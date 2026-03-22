;;; hyperfiler.el --- HyperFiler Pro task management system for Emacs -*- lexical-binding: t; -*-

;; Copyright (C) 2025 HyperFiler Pro

;; Author: HyperFiler Pro Team
;; Version: 2.0.6
;; Keywords: productivity, todo, tasks, gtd
;; Package-Requires: ((emacs "26.1"))

;;; Commentary:

;; HyperFiler Pro is a comprehensive task management system ported to Emacs Lisp
;; from the original JavaScript/HTML application. It provides GTD-style task
;; organization with calendar views, repeating tasks, and cloud synchronization.

;;; Code:

(require 'url)
(require 'calendar)
(require 'org)
(require 'filenotify)
(require 'json)
(require 'cl-lib)

;;; Variables

(defvar hyperfiler-tasks nil
  "List of all tasks in HyperFiler.")

(defvar hyperfiler-current-view 'today
  "Current view mode: 'today, 'week, 'month, 'all, 'repeat, 'undo, 'lists.")

(defvar hyperfiler-lists nil
  "List of all lists in HyperFiler.")

(defvar hyperfiler-current-list nil
  "Currently selected list for viewing/editing.")

(defvar hyperfiler-list-archive nil
  "Archive for completed list items.")

(defvar hyperfiler-current-edit-task-id nil
  "ID of task currently being edited.")

(defvar hyperfiler-event-task-ids (make-hash-table :test 'equal)
  "Hash table tracking which tasks are events.")

(defvar hyperfiler-api-base "https://hyperfiler.pro/api"
  "Base URL for HyperFiler API.")

(defvar hyperfiler-current-user nil
  "Current user information for authentication.")

(defvar hyperfiler-undo-stack nil
  "Stack of states for undo functionality.")

(defvar hyperfiler-current-language "en"
  "Current UI language.")

(defvar hyperfiler-current-task-index 0
  "Index of currently selected task.")

(defvar hyperfiler-selected-task-indices nil
  "List of task indices that are selected for batch operations.")

(defvar hyperfiler-archived-tasks nil
  "List of archived tasks.")

(defvar hyperfiler-current-date nil
  "Current date for navigation in views.")

(defvar hyperfiler-current-week-start nil
  "Start of current week for week view navigation.")

(defvar hyperfiler-current-month nil
  "Current month for month view navigation (list: month year).")

(defvar hyperfiler-auto-update-timer nil
  "Timer for auto-updating today's tasks and HTML export.")

(defvar hyperfiler-file-watchers nil
  "List of active file watchers for org files.")

(defvar hyperfiler-sync-watcher nil
  "File watcher for HTML-to-Emacs sync commands.")

(defvar hyperfiler-sync-file nil
  "File path for HTML-to-Emacs sync commands.")

(defvar hyperfiler-sync-server-process nil
  "HTTP server process for HTML sync.")

(defvar hyperfiler-sync-port 8765
  "Port for HTML sync server.")

;;; Utility Functions

(defun hyperfiler--ask-is-event ()
  "Ask if task is an event with better key handling."
  (let ((key nil))
    (while (not (memq key '(?y ?n ?\r ?\s)))
      (setq key (read-key "Is this an event? [y/n] (Enter = no): "))
      (unless (memq key '(?y ?n ?\r ?\s))
        (message "Please press y, n, or Enter")))
    (memq key '(?y))))

(defun hyperfiler--sanitize-input (input)
  "Sanitize INPUT string for safe storage and display."
  (when input
    (let ((sanitized (replace-regexp-in-string "[<>\"'&]" "" input)))
      (substring sanitized 0 (min 1000 (length sanitized))))))

(defun hyperfiler--validate-task-title (title)
  "Validate and clean TITLE for a task."
  (when title
    (let ((clean-title (string-trim (hyperfiler--sanitize-input title))))
      (when (and (> (length clean-title) 0)
                 (<= (length clean-title) 200))
        clean-title))))

(defun hyperfiler--validate-task-notes (notes)
  "Validate and clean NOTES for a task."
  (when notes
    (let ((clean-notes (hyperfiler--sanitize-input notes)))
      (when (<= (length clean-notes) 5000)
        clean-notes))))

(defun hyperfiler--generate-id ()
  "Generate a unique ID for a new task."
  (format "%d-%d" (time-to-seconds) (random 1000000)))

(defun hyperfiler--get-current-date ()
  "Get current date in YYYY-MM-DD format."
  (format-time-string "%Y-%m-%d"))

(defun hyperfiler--get-current-time ()
  "Get current time in HH:MM format."
  (format-time-string "%H:%M"))

(defun hyperfiler--format-date (date-string)
  "Format DATE-STRING for display."
  (if (and date-string 
           (not (string-empty-p date-string))
           (string-match-p "^[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}$" date-string))
      (condition-case nil
          (format-time-string "%a, %b %d" (date-to-time (concat date-string "T00:00:00")))
        (error "Invalid date"))
    "No date"))

(defun hyperfiler--format-time (time-string)
  "Format TIME-STRING for display."
  (if time-string
      time-string
    ""))

;;; Task Management Functions

(defun hyperfiler-create-task (title &optional notes due-date due-time is-event repeat-type)
  "Create a new task with TITLE, optional NOTES, DUE-DATE, DUE-TIME, IS-EVENT flag, and REPEAT-TYPE."
  (let* ((clean-title (hyperfiler--validate-task-title title))
         (clean-notes (hyperfiler--validate-task-notes notes))
         (task-id (hyperfiler--generate-id))
         (now (current-time))
         ;; Validate due-date format or use current date
         (validated-due-date (if (and due-date 
                                      (not (string-empty-p due-date))
                                      (string-match-p "^[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}$" due-date))
                                 due-date
                               (hyperfiler--get-current-date)))
         (task (list :id task-id
                     :title clean-title
                     :notes clean-notes
                     :dueDate validated-due-date
                     :dueTime (or due-time "00:00")
                     :isEvent (or is-event nil)
                     :repeatType repeat-type
                     :createdAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ" now)
                     :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ" now)
                     :images nil)))
    (when clean-title
      (push task hyperfiler-tasks)
      (when is-event
        (puthash task-id t hyperfiler-event-task-ids))
      (hyperfiler--save-tasks-to-local-storage)
      task)))

(defun hyperfiler-save-task (task-data)
  "Save or update TASK-DATA in the task list."
  (let* ((task-id (plist-get task-data :id))
         (existing-task-index (cl-position task-id hyperfiler-tasks 
                                          :test (lambda (id task) 
                                                  (equal id (plist-get task :id))))))
    (if existing-task-index
        ;; Update existing task
        (setf (nth existing-task-index hyperfiler-tasks) task-data)
      ;; Add new task
      (push task-data hyperfiler-tasks))
    (hyperfiler--save-tasks-to-local-storage)
    task-data))

(defun hyperfiler-toggle-task-status (task-id)
  "Toggle completion status of task with TASK-ID."
  (let ((task (cl-find task-id hyperfiler-tasks 
                       :test (lambda (id task) 
                               (equal id (plist-get task :id))))))
    (when task
      (hyperfiler--save-state-for-undo "toggle status")
      (let ((current-status (plist-get task :status)))
        (plist-put task :status 
                   (if (equal current-status "completed") "pending" "completed"))
        (plist-put task :updatedAt 
                   (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
        (hyperfiler-save-task task)
        (hyperfiler-render-current-view)))))

(defun hyperfiler-delete-task (task-id)
  "Delete task with TASK-ID."
  (let ((task (cl-find task-id hyperfiler-tasks 
                       :test (lambda (id task) 
                               (equal id (plist-get task :id))))))
    (when task
      (hyperfiler--save-state-for-undo "delete task")
      (setq hyperfiler-tasks 
            (cl-remove task-id hyperfiler-tasks 
                       :test (lambda (id task) 
                               (equal id (plist-get task :id)))))
      (remhash task-id hyperfiler-event-task-ids)
      (hyperfiler--save-tasks-to-local-storage)
      (hyperfiler-render-current-view))))

(defun hyperfiler-edit-task (task-id)
  "Open edit dialog for task with TASK-ID."
  (let ((task (cl-find task-id hyperfiler-tasks 
                       :test (lambda (id task) 
                               (equal id (plist-get task :id))))))
    (when task
      (setq hyperfiler-current-edit-task-id task-id)
      (let* ((title (plist-get task :title))
             (notes (plist-get task :notes))
             (due-date (plist-get task :dueDate))
             (due-time (plist-get task :dueTime))
             (is-event (plist-get task :isEvent))
             (repeat-type (plist-get task :repeatType))
             
             ;; Prompt for new values
             (new-title (read-string "Title: " title))
             (new-notes (read-string "Notes: " (or notes "")))
             (new-due-date (read-string "Due date (YYYY-MM-DD): " (or due-date "")))
             (new-due-time (read-string "Due time (HH:MM): " (or due-time "")))
             (new-is-event (hyperfiler--ask-is-event))
             (new-repeat-type (completing-read "Repeat type: " 
                                               '("none" "daily" "weekly" "biweekly" "monthly" "yearly")
                                               nil t (or repeat-type "none"))))
        
        ;; Validate and update task
        (let ((validated-title (hyperfiler--validate-task-title new-title))
              (validated-notes (hyperfiler--validate-task-notes new-notes)))
          (when validated-title
            (plist-put task :title validated-title)
            (plist-put task :notes validated-notes)
            (plist-put task :dueDate (if (string-empty-p new-due-date) nil new-due-date))
            (plist-put task :dueTime (if (string-empty-p new-due-time) nil new-due-time))
            (plist-put task :isEvent new-is-event)
            (plist-put task :repeatType (if (equal new-repeat-type "none") nil new-repeat-type))
            (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            
            ;; Update event registry
            (if new-is-event
                (puthash task-id t hyperfiler-event-task-ids)
              (remhash task-id hyperfiler-event-task-ids))
            
            (hyperfiler-save-task task)
            (message "Task updated successfully!")))))))

;;; List Management Functions

(defun hyperfiler-create-list (name)
  "Create a new list with NAME."
  (let* ((clean-name (hyperfiler--validate-task-title name))
         (list-id (hyperfiler--generate-id))
         (now (current-time))
         (new-list (list :id list-id
                        :name clean-name
                        :items nil
                        :createdAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ" now)
                        :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ" now))))
    (when clean-name
      (push new-list hyperfiler-lists)
      (hyperfiler--save-lists-to-storage)
      ;; (hyperfiler--auto-export-list-to-html new-list)
      new-list)))

(defun hyperfiler-add-item-to-list (list-id item-text)
  "Add ITEM-TEXT to list with LIST-ID."
  (let ((list-obj (cl-find list-id hyperfiler-lists
                          :test (lambda (id lst) (equal id (plist-get lst :id))))))
    (when list-obj
      (let* ((clean-text (hyperfiler--validate-task-title item-text))
             (item-id (hyperfiler--generate-id))
             (now (current-time))
             (new-item (list :id item-id
                           :text clean-text
                           :completed nil
                           :createdAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ" now))))
        (when clean-text
          (let ((current-items (plist-get list-obj :items)))
            (plist-put list-obj :items (append current-items (list new-item)))
            (plist-put list-obj :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            (hyperfiler--save-lists-to-storage)
            ;; (hyperfiler--auto-export-list-to-html list-obj)
            new-item))))))

(defun hyperfiler-toggle-list-item (list-id item-id)
  "Toggle completion status of item ITEM-ID in list LIST-ID."
  (let ((list-obj (cl-find list-id hyperfiler-lists
                          :test (lambda (id lst) (equal id (plist-get lst :id))))))
    (when list-obj
      (let ((items (plist-get list-obj :items)))
        (dolist (item items)
          (when (equal (plist-get item :id) item-id)
            (plist-put item :completed (not (plist-get item :completed)))
            (plist-put list-obj :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            (hyperfiler--save-lists-to-storage)
            ;; (hyperfiler--auto-export-list-to-html list-obj)
            (return t)))))))

(defun hyperfiler-archive-completed-list-items (list-id)
  "Archive all completed items from list LIST-ID."
  (let ((list-obj (cl-find list-id hyperfiler-lists
                          :test (lambda (id lst) (equal id (plist-get lst :id))))))
    (when list-obj
      (let* ((items (plist-get list-obj :items))
             (completed-items (cl-remove-if-not 
                              (lambda (item) (plist-get item :completed))
                              items))
             (remaining-items (cl-remove-if 
                              (lambda (item) (plist-get item :completed))
                              items)))
        (when completed-items
          ;; Add list name to each archived item
          (dolist (item completed-items)
            (plist-put item :listName (plist-get list-obj :name))
            (plist-put item :listId list-id)
            (push item hyperfiler-list-archive))
          ;; Update list with remaining items
          (plist-put list-obj :items remaining-items)
          (plist-put list-obj :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
          (hyperfiler--save-lists-to-storage)
          ;; (hyperfiler--auto-export-list-to-html list-obj)
          (length completed-items))))))

(defun hyperfiler-delete-list (list-id)
  "Delete list with LIST-ID."
  (when (y-or-n-p "Delete this list and all its items? ")
    (setq hyperfiler-lists 
          (cl-remove list-id hyperfiler-lists
                     :test (lambda (id lst) (equal id (plist-get lst :id)))))
    (hyperfiler--save-lists-to-storage)
    t))

;;; File Watcher Functions

(defun hyperfiler--setup-file-watchers ()
  "Setup file watchers for org files to auto-generate HTML."
  (hyperfiler--remove-file-watchers)
  (let ((org-files '("hyperfiler-tasks.org" 
                     "hyperfiler-archive.org"
                     "hyperfiler-lists.org" 
                     "hyperfiler-list-archive.org"
                     "hyperfiler-events.org")))
    (dolist (filename org-files)
      (let ((file-path (expand-file-name filename user-emacs-directory)))
        (when (file-exists-p file-path)
          (condition-case err
              (let ((watcher (file-notify-add-watch 
                             file-path
                             '(change)
                             'hyperfiler--on-org-file-change)))
                (push watcher hyperfiler-file-watchers)
                (message "Watching %s for changes" filename))
            (error
             (message "Failed to setup watcher for %s: %s" filename (error-message-string err)))))))
  ;; Setup sync file watcher and HTTP server
  (hyperfiler--setup-sync-watcher)
  (hyperfiler--start-sync-server)))

(defun hyperfiler--setup-sync-watcher ()
  "Setup watcher for HTML-to-Emacs sync commands."
  (setq hyperfiler-sync-file (expand-file-name "hyperfiler-sync.json" user-emacs-directory))
  ;; Create empty sync file if it doesn't exist
  (unless (file-exists-p hyperfiler-sync-file)
    (with-temp-file hyperfiler-sync-file
      (insert "{}\n")))
  ;; Setup watcher
  (when hyperfiler-sync-watcher
    (file-notify-rm-watch hyperfiler-sync-watcher))
  (condition-case err
      (setq hyperfiler-sync-watcher
            (file-notify-add-watch hyperfiler-sync-file
                                   '(change)
                                   'hyperfiler--handle-sync-command))
    (error
     (message "Failed to setup sync watcher: %s" (error-message-string err)))))

(defun hyperfiler--remove-file-watchers ()
  "Remove all active file watchers."
  (dolist (watcher hyperfiler-file-watchers)
    (when watcher
      (condition-case err
          (file-notify-rm-watch watcher)
        (error
         (message "Error removing watcher: %s" (error-message-string err))))))
  (setq hyperfiler-file-watchers nil)
  ;; Remove sync watcher
  (when hyperfiler-sync-watcher
    (condition-case err
        (file-notify-rm-watch hyperfiler-sync-watcher)
      (error
       (message "Error removing sync watcher: %s" (error-message-string err))))
    (setq hyperfiler-sync-watcher nil))
  ;; Stop sync server
  (hyperfiler--stop-sync-server))

(defun hyperfiler--on-org-file-change (event)
  "Handle org file change EVENT by regenerating HTML."
  (let ((filename (file-name-nondirectory (cadr event)))
        (action (car (cddr event))))
    (when (eq action 'changed)
      (message "Detected change in %s - regenerating HTML..." filename)
      ;; Add a small delay to avoid multiple rapid regenerations
      (run-with-timer 1.0 nil 'hyperfiler--auto-generate-all-html))))

(defun hyperfiler--handle-sync-command (event)
  "Handle sync command from HTML interface."
  (let ((action (car (cddr event))))
    (when (eq action 'changed)
      (condition-case err
          (progn
            ;; Small delay to ensure file write is complete
            (run-with-timer 0.5 nil 'hyperfiler--process-sync-file))
        (error
         (message "Error handling sync command: %s" (error-message-string err)))))))

(defun hyperfiler--process-sync-file ()
  "Process sync commands from the sync file."
  (when (and hyperfiler-sync-file (file-exists-p hyperfiler-sync-file))
    (condition-case err
        (with-temp-buffer
          (insert-file-contents hyperfiler-sync-file)
          (let* ((content (buffer-string))
                 (json-data (json-read-from-string content)))
            (when (and json-data (not (equal json-data (json-object))))
              (let ((command (cdr (assq 'command json-data)))
                    (item-id (cdr (assq 'itemId json-data)))
                    (list-name (cdr (assq 'listName json-data)))
                    (completed (cdr (assq 'completed json-data)))
                    (task-id (cdr (assq 'taskId json-data))))
                (cond
                 ((string= command "toggle-list-item")
                  (hyperfiler--sync-toggle-list-item list-name item-id completed))
                 ((string= command "toggle-task")
                  (hyperfiler--sync-toggle-task task-id completed))
                 (t
                  (message "Unknown sync command: %s" command)))
                ;; Clear sync file after processing
                (with-temp-file hyperfiler-sync-file
                  (insert "{}\n"))))))
      (error
       (message "Error processing sync file: %s" (error-message-string err))))))

(defun hyperfiler--start-sync-server ()
  "Start a simple HTTP server for HTML sync."
  (hyperfiler--stop-sync-server)
  (condition-case err
      (progn
        (setq hyperfiler-sync-server-process
              (make-network-process
               :name "hyperfiler-sync-server"
               :service hyperfiler-sync-port
               :server t
               :family 'ipv4
               :filter 'hyperfiler--sync-server-filter
               :sentinel 'hyperfiler--sync-server-sentinel))
        (message "HyperFiler sync server started on port %d" hyperfiler-sync-port))
    (error
     (message "Failed to start sync server: %s" (error-message-string err)))))

(defun hyperfiler--stop-sync-server ()
  "Stop the HTTP sync server."
  (when hyperfiler-sync-server-process
    (delete-process hyperfiler-sync-server-process)
    (setq hyperfiler-sync-server-process nil)))

(defun hyperfiler--sync-server-filter (process string)
  "Handle HTTP requests from HTML interface."
  (condition-case err
      (when (string-match "POST /sync" string)
        ;; Extract JSON data from POST body
        (when (string-match "\r\n\r\n\\(.*\\)" string)
          (let* ((json-data (match-string 1 string))
                 (parsed-data (json-read-from-string json-data))
                 (command (cdr (assq 'command parsed-data)))
                 (list-name (cdr (assq 'listName parsed-data)))
                 (item-id (cdr (assq 'itemId parsed-data)))
                 (completed (cdr (assq 'completed parsed-data))))
            (cond
             ((string= command "toggle-task")
              (hyperfiler--sync-toggle-task (cdr (assq 'taskId parsed-data)) completed))
             ((string= command "toggle-list-item")
              (message "List sync disabled - checkboxes work independently"))
             (t
              (message "Unknown sync command: %s" command)))))
        ;; Send HTTP response
        (process-send-string process "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 2\r\n\r\nOK")
        (delete-process process))
    (error
     (message "Error in sync server: %s" (error-message-string err))
     (process-send-string process "HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\n\r\n")
     (delete-process process))))

(defun hyperfiler--sync-server-sentinel (process event)
  "Handle sync server process events."
  (when (string-match "^deleted" event)
    (message "Sync server connection closed")))

(defun hyperfiler--sync-toggle-list-item (list-name item-id completed)
  "Toggle list item completion status and update org file."
  (let ((lists-file (expand-file-name "hyperfiler-lists.org" user-emacs-directory)))
    (when (file-exists-p lists-file)
      (with-temp-buffer
        (insert-file-contents lists-file)
        (org-mode)
        (goto-char (point-min))
        (when (re-search-forward (format "^\\*\\* %s$" (regexp-quote list-name)) nil t)
          ;; Skip properties section
          (when (re-search-forward ":PROPERTIES:" nil t)
            (re-search-forward ":END:" nil t))
          ;; Find and toggle the item
          (let ((items-start (point))
                (items-end (save-excursion
                             (or (re-search-forward "^\\*\\*" nil t)
                                 (point-max))))
                (found nil))
            (goto-char items-start)
            (while (and (< (point) items-end) (not found))
              (when (re-search-forward "^- \\(\\[.\\]\\) \\(.*\\)$" items-end t)
                (let ((checkbox (match-string 1))
                      (text (match-string 2)))
                  ;; Simple ID matching based on text (since we don't store IDs in org)
                  (when (string-match-p (regexp-quote text) item-id)
                    (let ((new-checkbox (if completed "[X]" "[ ]")))
                      (replace-match (format "- %s %s" new-checkbox text))
                      (setq found t))))))
            (when found
              (write-region (point-min) (point-max) lists-file)
              (message "Updated %s item: %s" list-name (if completed "completed" "uncompleted"))
              ;; Refresh view if we're currently looking at lists
              (when (eq hyperfiler-current-view 'lists)
                (hyperfiler-load-tasks-from-local-storage)
                (hyperfiler-render-current-view)))))))))

(defun hyperfiler--sync-toggle-task (task-id completed)
  "Toggle task completion status and potentially archive it."
  (let ((tasks-file (expand-file-name "hyperfiler-tasks.org" user-emacs-directory))
        (archive-file (expand-file-name "hyperfiler-archive.org" user-emacs-directory)))
    (when (file-exists-p tasks-file)
      (if completed
          ;; Archive the task
          (hyperfiler--sync-archive-task task-id tasks-file archive-file)
        ;; Unarchive the task (restore from archive)
        (hyperfiler--sync-unarchive-task task-id tasks-file archive-file)))))

(defun hyperfiler--sync-archive-task (task-id tasks-file archive-file)
  "Archive a task by moving it from tasks to archive file."
  (let ((task-data nil))
    ;; Find and extract task from tasks file
    (with-temp-buffer
      (insert-file-contents tasks-file)
      (org-mode)
      (goto-char (point-min))
      (when (re-search-forward "^\\* Active Tasks" nil t)
        (while (and (re-search-forward "^\\*\\* \\(.*\\)$" nil t) (not task-data))
          (let ((task-start (match-beginning 0))
                (title (match-string 1)))
            (when (re-search-forward (format ":ID: %s$" (regexp-quote task-id)) nil t)
              ;; Found the task, extract it
              (let ((task-end (save-excursion
                                (or (re-search-forward "^\\*\\*" nil t)
                                    (point-max)))))
                (setq task-data (buffer-substring task-start task-end))
                ;; Remove task from current buffer
                (delete-region task-start task-end))))))
      ;; Write updated tasks file
      (when task-data
        (write-region (point-min) (point-max) tasks-file)))
    
    ;; Add task to archive file
    (when task-data
      (with-temp-buffer
        (when (file-exists-p archive-file)
          (insert-file-contents archive-file))
        (org-mode)
        (goto-char (point-max))
        ;; Add DONE status to the archived task
        (let ((modified-task (replace-regexp-in-string "^\\*\\* " "** DONE " task-data)))
          (insert modified-task "\n"))
        (write-region (point-min) (point-max) archive-file))
      (message "Archived task: %s" task-id)
      ;; Refresh view
      (hyperfiler-load-tasks-from-local-storage)
      (when (memq hyperfiler-current-view '(today week month all))
        (hyperfiler-render-current-view)))))

(defun hyperfiler--sync-unarchive-task (task-id tasks-file archive-file)
  "Unarchive a task by moving it from archive back to tasks file."
  (let ((task-data nil))
    ;; Find and extract task from archive file
    (with-temp-buffer
      (insert-file-contents archive-file)
      (org-mode)
      (goto-char (point-min))
      (when (re-search-forward "^\\* Archived Tasks" nil t)
        (while (and (re-search-forward "^\\*\\* DONE \\(.*\\)$" nil t) (not task-data))
          (let ((task-start (match-beginning 0))
                (title (match-string 1)))
            (when (re-search-forward (format ":ID: %s$" (regexp-quote task-id)) nil t)
              ;; Found the task, extract it
              (let ((task-end (save-excursion
                                (or (re-search-forward "^\\*\\*" nil t)
                                    (point-max)))))
                (setq task-data (buffer-substring task-start task-end))
                ;; Remove task from current buffer
                (delete-region task-start task-end))))))
      ;; Write updated archive file
      (when task-data
        (write-region (point-min) (point-max) archive-file)))
    
    ;; Add task back to tasks file
    (when task-data
      (with-temp-buffer
        (when (file-exists-p tasks-file)
          (insert-file-contents tasks-file))
        (org-mode)
        (goto-char (point-min))
        ;; Find or create Active Tasks section
        (unless (re-search-forward "^\\* Active Tasks" nil t)
          (goto-char (point-max))
          (insert "\n* Active Tasks\n"))
        (goto-char (point-max))
        ;; Remove DONE status from the unarchived task
        (let ((modified-task (replace-regexp-in-string "^\\*\\* DONE " "** " task-data)))
          (insert modified-task "\n"))
        (write-region (point-min) (point-max) tasks-file))
      (message "Unarchived task: %s" task-id)
      ;; Refresh view
      (hyperfiler-load-tasks-from-local-storage)
      (when (memq hyperfiler-current-view '(today week month all))
        (hyperfiler-render-current-view)))))

;;; Storage Functions

(defun hyperfiler--get-tasks-from-org-for-date (target-date)
  "Get tasks from org file for TARGET-DATE."
  (let ((storage-file (expand-file-name "hyperfiler-tasks.org" user-emacs-directory))
        (tasks '()))
    (when (file-exists-p storage-file)
      (with-temp-buffer
        (insert-file-contents storage-file)
        (org-mode)
        (goto-char (point-min))
        (when (re-search-forward "^\\* Active Tasks" nil t)
          (while (re-search-forward "^\\*\\* \\(.*\\)$" nil t)
            (let ((title (match-string 1))
                  (task-plist (list :title title)))
              ;; Parse properties
              (when (re-search-forward ":PROPERTIES:" nil t)
                (let ((props-start (point))
                      (props-end (save-excursion 
                                  (re-search-forward ":END:" nil t)
                                  (point))))
                  (goto-char props-start)
                  (while (re-search-forward "^:\\([^:]+\\):\\s-*\\(.*\\)$" props-end t)
                    (let ((key (intern (concat ":" (downcase (match-string 1)))))
                          (value (match-string 2)))
                      (when (and value (not (string-empty-p value)))
                        (setq task-plist (plist-put task-plist key value)))))))
              ;; Get task content (notes)
              (let ((content-start (save-excursion
                                     (re-search-forward ":END:" nil t)
                                     (forward-line 1)
                                     (point)))
                    (content-end (save-excursion
                                   (or (re-search-forward "^\\*\\*" nil t)
                                       (point-max)))))
                (when (< content-start content-end)
                  (let ((notes (string-trim (buffer-substring content-start content-end))))
                    (when (not (string-empty-p notes))
                      (setq task-plist (plist-put task-plist :notes notes))))))
              ;; Only include tasks for the target date
              (when (equal (plist-get task-plist :due_date) target-date)
                (push task-plist tasks)))))))
    (hyperfiler--sort-tasks-by-time tasks)))

(defun hyperfiler--get-list-from-org (list-name)
  "Get specific list from org file by LIST-NAME."
  (catch 'found-list
    (let ((lists-file (expand-file-name "hyperfiler-lists.org" user-emacs-directory)))
    (when (file-exists-p lists-file)
      (with-temp-buffer
        (insert-file-contents lists-file)
        (org-mode)
        (goto-char (point-min))
        (when (re-search-forward "^\\* Lists" nil t)
          (while (re-search-forward "^\\*\\* \\(.*\\)$" nil t)
            (let ((found-name (match-string 1)))
              (when (string= found-name list-name)
                (let ((items '()))
                  ;; Skip properties section
                  (when (re-search-forward ":PROPERTIES:" nil t)
                    (re-search-forward ":END:" nil t))
                  ;; Parse list items (checkboxes)
                  (let ((items-start (point))
                        (items-end (save-excursion
                                     (or (re-search-forward "^\\*\\*" nil t)
                                         (point-max)))))
                    (goto-char items-start)
                    (while (re-search-forward "^- \\(\\[.\\]\\) \\(.*\\)$" items-end t)
                      (let ((checkbox (match-string 1))
                            (text (match-string 2)))
                        (push (list :text text 
                                   :completed (string= checkbox "[X]")
                                   :id (format "%d-%d" (time-to-seconds) (random 1000000)))
                              items))))
                  (throw 'found-list (list :name list-name :items (nreverse items)))))))))
    nil))))

(defun hyperfiler--get-all-lists-from-org ()
  "Get all lists from org file."
  (let ((lists-file (expand-file-name "hyperfiler-lists.org" user-emacs-directory))
        (lists '()))
    (when (file-exists-p lists-file)
      (with-temp-buffer
        (insert-file-contents lists-file)
        (org-mode)
        (goto-char (point-min))
        (when (re-search-forward "^\\* Lists" nil t)
          (while (re-search-forward "^\\*\\* \\(.*\\)$" nil t)
            (let ((list-name (match-string 1))
                  (items '()))
              ;; Skip properties section
              (when (re-search-forward ":PROPERTIES:" nil t)
                (re-search-forward ":END:" nil t))
              ;; Parse list items (checkboxes)
              (let ((items-start (point))
                    (items-end (save-excursion
                                 (or (re-search-forward "^\\*\\*" nil t)
                                     (point-max)))))
                (goto-char items-start)
                (while (re-search-forward "^- \\(\\[.\\]\\) \\(.*\\)$" items-end t)
                  (let ((checkbox (match-string 1))
                        (text (match-string 2)))
                    (push (list :text text 
                               :completed (string= checkbox "[X]")
                               :id (format "%d-%d" (time-to-seconds) (random 1000000)))
                          items))))
              (push (list :name list-name :items (nreverse items)) lists)))))
    (nreverse lists))))

(defun hyperfiler--create-backup (file-path)
  "Create a rotating backup of FILE-PATH, keeping up to 5 copies."
  (when (file-exists-p file-path)
    (let* ((backup-dir (expand-file-name "hyperfiler-backups" user-emacs-directory))
           (file-name (file-name-nondirectory file-path))
           (base-name (file-name-sans-extension file-name))
           (extension (file-name-extension file-name t)))
      ;; Create backup directory if it doesn't exist
      (unless (file-directory-p backup-dir)
        (make-directory backup-dir t))
      
      ;; Rotate existing backups (5 -> 4, 4 -> 3, etc.)
      (dotimes (i 4)
        (let ((old-backup (expand-file-name (format "%s.backup%d%s" base-name (- 4 i) extension) backup-dir))
              (new-backup (expand-file-name (format "%s.backup%d%s" base-name (- 5 i) extension) backup-dir)))
          (when (file-exists-p old-backup)
            (rename-file old-backup new-backup t))))
      
      ;; Create new backup.1
      (let ((new-backup (expand-file-name (format "%s.backup1%s" base-name extension) backup-dir)))
        (copy-file file-path new-backup t)
        (message "Created backup: %s" (file-name-nondirectory new-backup))))))

(defun hyperfiler--backup-all-files ()
  "Create backups of all hyperfiler org files."
  (let ((files-to-backup '("hyperfiler-tasks.org"
                          "hyperfiler-archive.org" 
                          "hyperfiler-events.org"
                          "hyperfiler-lists.org"
                          "hyperfiler-list-archive.org")))
    (dolist (filename files-to-backup)
      (let ((file-path (expand-file-name filename user-emacs-directory)))
        (when (file-exists-p file-path)
          (hyperfiler--create-backup file-path))))))

(defun hyperfiler-backup-data ()
  "Manually create backups of all hyperfiler data files."
  (interactive)
  (hyperfiler--backup-all-files)
  (message "Manual backup completed for all hyperfiler files"))

(defun hyperfiler-restore-from-backup ()
  "Restore hyperfiler data from backup files."
  (interactive)
  (let ((backup-dir (expand-file-name "hyperfiler-backups" user-emacs-directory))
        (files-to-restore '("hyperfiler-tasks.org"
                           "hyperfiler-archive.org" 
                           "hyperfiler-events.org"
                           "hyperfiler-lists.org"
                           "hyperfiler-list-archive.org")))
    (unless (file-directory-p backup-dir)
      (error "No backup directory found"))
    
    (when (y-or-n-p "This will overwrite current data with backup. Continue? ")
      (let ((restored-count 0))
        (dolist (filename files-to-restore)
          (let* ((base-name (file-name-sans-extension filename))
                 (extension (file-name-extension filename t))
                 (backup-file (expand-file-name (format "%s.backup1%s" base-name extension) backup-dir))
                 (target-file (expand-file-name filename user-emacs-directory)))
            (when (file-exists-p backup-file)
              (copy-file backup-file target-file t)
              (setq restored-count (1+ restored-count))
              (message "Restored %s" filename))))
        (if (> restored-count 0)
            (progn
              (hyperfiler-load-tasks-from-local-storage)
              (hyperfiler-render-current-view)
              (message "Restored %d files from backup" restored-count))
          (message "No backup files found to restore"))))))

(defun hyperfiler--save-tasks-to-local-storage ()
  "Save tasks to persistent org storage with automatic backup."
  (let ((storage-file (expand-file-name "hyperfiler-tasks.org" user-emacs-directory))
        (archive-file (expand-file-name "hyperfiler-archive.org" user-emacs-directory)))
    ;; Don't save if we have no tasks but the org file has content (prevents accidental deletion)
    (if (and (= (length hyperfiler-tasks) 0)
             (file-exists-p storage-file)
             (> (file-attribute-size (file-attributes storage-file)) 100))
        (message "Warning: Not saving empty task list over existing tasks file")
      ;; Create backups before saving
      (hyperfiler--create-backup storage-file)
      (hyperfiler--create-backup archive-file)
    ;; Save active tasks
    (with-temp-file storage-file
      (insert "#+TITLE: HyperFiler Tasks\n\n")
      (insert "* Active Tasks\n")
      (dolist (task hyperfiler-tasks)
        (let ((id (plist-get task :id))
              (title (plist-get task :title))
              (notes (plist-get task :notes))
              (due-date (plist-get task :dueDate))
              (due-time (plist-get task :dueTime))
              (is-event (plist-get task :isEvent))
              (repeat-type (plist-get task :repeatType))
              (created-at (plist-get task :createdAt))
              (updated-at (plist-get task :updatedAt)))
          (insert (format "** %s\n" (or title "Untitled")))
          (insert ":PROPERTIES:\n")
          (insert (format ":ID: %s\n" (or id "")))
          (when due-date
            (insert (format ":DUE_DATE: %s\n" due-date)))
          (when due-time
            (insert (format ":DUE_TIME: %s\n" due-time)))
          (when is-event
            (insert (format ":IS_EVENT: %s\n" is-event)))
          (when repeat-type
            (insert (format ":REPEAT_TYPE: %s\n" repeat-type)))
          (when created-at
            (insert (format ":CREATED_AT: %s\n" created-at)))
          (when updated-at
            (insert (format ":UPDATED_AT: %s\n" updated-at)))
          (insert ":END:\n")
          (when notes
            (insert (format "%s\n" notes)))
          (insert "\n"))))
    ;; Save archived tasks
    (with-temp-file archive-file
      (insert "#+TITLE: HyperFiler Archived Tasks\n\n")
      (insert "* Archived Tasks\n")
      (dolist (task hyperfiler-archived-tasks)
        (let ((id (plist-get task :id))
              (title (plist-get task :title))
              (notes (plist-get task :notes))
              (due-date (plist-get task :dueDate))
              (due-time (plist-get task :dueTime))
              (is-event (plist-get task :isEvent))
              (repeat-type (plist-get task :repeatType))
              (created-at (plist-get task :createdAt))
              (updated-at (plist-get task :updatedAt)))
          (insert (format "** DONE %s\n" (or title "Untitled")))
          (insert ":PROPERTIES:\n")
          (insert (format ":ID: %s\n" (or id "")))
          (when due-date
            (insert (format ":DUE_DATE: %s\n" due-date)))
          (when due-time
            (insert (format ":DUE_TIME: %s\n" due-time)))
          (when is-event
            (insert (format ":IS_EVENT: %s\n" is-event)))
          (when repeat-type
            (insert (format ":REPEAT_TYPE: %s\n" repeat-type)))
          (when created-at
            (insert (format ":CREATED_AT: %s\n" created-at)))
          (when updated-at
            (insert (format ":UPDATED_AT: %s\n" updated-at)))
          (insert ":END:\n")
          (when notes
            (insert (format "%s\n" notes)))
          (insert "\n")))
    ;; Save events list
    (let ((events-file (expand-file-name "hyperfiler-events.org" user-emacs-directory)))
      (hyperfiler--create-backup events-file)
      (with-temp-file events-file
        (insert "#+TITLE: HyperFiler Events Registry\n\n")
        (insert "* Event Task IDs\n")
        (maphash (lambda (key _value) 
                   (insert (format "- %s\n" key))) 
                 hyperfiler-event-task-ids)))
    ;; Auto-generate HTML for tasks after saving
    (hyperfiler--auto-generate-all-html)))))

(defun hyperfiler--save-lists-to-storage ()
  "Save lists and list archive to persistent org storage with automatic backup."
  (let ((lists-file (expand-file-name "hyperfiler-lists.org" user-emacs-directory))
        (list-archive-file (expand-file-name "hyperfiler-list-archive.org" user-emacs-directory)))
    ;; Create backups before saving
    (hyperfiler--create-backup lists-file)
    (hyperfiler--create-backup list-archive-file)
    ;; Save lists
    (with-temp-file lists-file
      (insert "#+TITLE: HyperFiler Lists\n\n")
      (insert "* Lists\n")
      (dolist (list hyperfiler-lists)
        (let ((name (plist-get list :name))
              (items (plist-get list :items)))
          (insert (format "** %s\n" (or name "Unnamed List")))
          (insert ":PROPERTIES:\n")
          (insert (format ":LIST_NAME: %s\n" (or name "")))
          (insert ":END:\n")
          (dolist (item items)
            (let ((text (plist-get item :text))
                  (completed (plist-get item :completed))
                  (id (plist-get item :id)))
              (insert (format "- %s%s\n" 
                            (if completed "[X] " "[ ] ")
                            (or text "")))))
          (insert "\n"))))
    ;; Save list archive
    (with-temp-file list-archive-file
      (insert "#+TITLE: HyperFiler List Archive\n\n")
      (insert "* Archived List Items\n")
      (dolist (item hyperfiler-list-archive)
        (let ((text (plist-get item :text))
              (list-name (plist-get item :listName))
              (archived-at (plist-get item :archivedAt)))
          (insert (format "** DONE %s\n" (or text "Untitled")))
          (insert ":PROPERTIES:\n")
          (insert (format ":LIST_NAME: %s\n" (or list-name "")))
          (when archived-at
            (insert (format ":ARCHIVED_AT: %s\n" archived-at)))
          (insert ":END:\n")
          (insert "\n"))))
    ;; Auto-generate all HTML after saving
    (hyperfiler--auto-generate-all-html)))

(defun hyperfiler-load-tasks-from-local-storage ()
  "Load tasks from persistent org storage."
  (let ((storage-file (expand-file-name "hyperfiler-tasks.org" user-emacs-directory))
        (archive-file (expand-file-name "hyperfiler-archive.org" user-emacs-directory))
        (events-file (expand-file-name "hyperfiler-events.org" user-emacs-directory)))
    ;; Initialize with empty lists if no tasks exist
    (setq hyperfiler-tasks nil)
    (setq hyperfiler-archived-tasks nil)
    (clrhash hyperfiler-event-task-ids)
    
    ;; Load tasks from org file
    (when (file-exists-p storage-file)
      (message "Loading tasks from: %s" storage-file)
      (condition-case err
          (with-temp-buffer
            (insert-file-contents storage-file)
            (org-mode)
            (goto-char (point-min))
            (message "File contents loaded, searching for Active Tasks section...")
            ;; Find all task entries (level 2 headings under "Active Tasks")
            (if (re-search-forward "^\\* Active Tasks" nil t)
                (progn
                  (message "Found Active Tasks section, parsing tasks...")
                  (while (re-search-forward "^\\*\\* \\(.*\\)$" nil t)
                    (let* ((title (match-string 1))
                           (task-plist (list :title (or title "Untitled"))))
                      ;; Parse properties
                      (when (re-search-forward ":PROPERTIES:" nil t)
                        (let ((props-start (point))
                              (props-end (save-excursion 
                                          (re-search-forward ":END:" nil t)
                                          (point))))
                          (goto-char props-start)
                          (while (re-search-forward "^:\\([^:]+\\):\\s-*\\(.*\\)$" props-end t)
                            (let ((key-str (match-string 1))
                                  (value-str (match-string 2)))
                              (when (and key-str value-str (stringp key-str) (stringp value-str) (not (string-empty-p value-str)))
                                (let* ((key-name (downcase key-str))
                                       ;; Convert property names from org format to internal format
                                       (key (cond
                                             ((string= key-name "id") :id)
                                             ((string= key-name "due_date") :dueDate)
                                             ((string= key-name "due_time") :dueTime)
                                             ((string= key-name "is_event") :isEvent)
                                             ((string= key-name "repeat_type") :repeatType)
                                             ((string= key-name "created_at") :createdAt)
                                             ((string= key-name "updated_at") :updatedAt)
                                             (t (intern (concat ":" key-name))))))
                                  (setq task-plist (plist-put task-plist key value-str))))))))
                      ;; Get task content (notes)
                      (let ((content-start (save-excursion
                                             (re-search-forward ":END:" nil t)
                                             (forward-line 1)
                                             (point)))
                            (content-end (save-excursion
                                           (or (re-search-forward "^\\*\\*" nil t)
                                               (point-max)))))
                        (when (< content-start content-end)
                          (let ((notes (string-trim (buffer-substring content-start content-end))))
                            (when (not (string-empty-p notes))
                              (setq task-plist (plist-put task-plist :notes notes))))))
                      ;; Add default status if not present
                      (unless (plist-get task-plist :status)
                        (setq task-plist (plist-put task-plist :status "pending")))
                      (push task-plist hyperfiler-tasks)
                      (message "Loaded task: %s" (plist-get task-plist :title))))))
              (message "No Active Tasks section found in file")))
        (error
         (message "Error loading tasks from org. Starting with empty task list."))
        (t 
         (message "Unknown error during task loading")
         (setq hyperfiler-tasks nil))))
    
    ;; Load archived tasks
    (when (file-exists-p archive-file)
      (message "Loading archived tasks from: %s" archive-file)
      (condition-case err
          (with-temp-buffer
            (insert-file-contents archive-file)
            (org-mode)
            (goto-char (point-min))
            (message "Searching for Archived Tasks section...")
            (if (re-search-forward "^\\* Archived Tasks" nil t)
                (progn
                  (message "Found Archived Tasks section")
                  (while (re-search-forward "^\\*\\* DONE \\(.*\\)$" nil t)
                (let ((title (match-string 1))
                      (task-plist (list :title title)))
                  ;; Parse properties similar to active tasks
                  (when (re-search-forward ":PROPERTIES:" nil t)
                    (let ((props-start (point))
                          (props-end (save-excursion 
                                      (re-search-forward ":END:" nil t)
                                      (point))))
                      (goto-char props-start)
                      (while (re-search-forward "^:\\([^:]+\\):\\s-*\\(.*\\)$" props-end t)
                        (let* ((key-str (match-string 1))
                               (value-str (match-string 2)))
                          (when (and key-str value-str (stringp key-str) (stringp value-str) (not (string-empty-p value-str)))
                            (let* ((key-name (downcase key-str))
                                   ;; Convert property names from org format to internal format
                                   (key (cond
                                         ((string= key-name "id") :id)
                                         ((string= key-name "due_date") :dueDate)
                                         ((string= key-name "due_time") :dueTime)
                                         ((string= key-name "is_event") :isEvent)
                                         ((string= key-name "repeat_type") :repeatType)
                                         ((string= key-name "created_at") :createdAt)
                                         ((string= key-name "updated_at") :updatedAt)
                                         (t (intern (concat ":" key-name))))))
                              (setq task-plist (plist-put task-plist key value-str))))))))
                  ;; Archived tasks are always completed
                  (setq task-plist (plist-put task-plist :status "completed"))
                  (push task-plist hyperfiler-archived-tasks))))
              (message "No Archived Tasks section found in archive file")))
        (error
         (message "Error loading archived tasks: %s" (error-message-string err))
         (setq hyperfiler-archived-tasks nil))))
    
    ;; Load event registry
    (when (file-exists-p events-file)
      (condition-case err
          (with-temp-buffer
            (insert-file-contents events-file)
            (org-mode)
            (goto-char (point-min))
            (when (re-search-forward "^\\* Event Task IDs" nil t)
              (while (re-search-forward "^- \\(.*\\)$" nil t)
                (let ((event-id (match-string 1)))
                  (when (not (string-empty-p event-id))
                    (puthash event-id t hyperfiler-event-task-ids))))))
        (error
         (message "Error loading event registry: %s" (error-message-string err)))))
    
    ;; Load lists
    (hyperfiler--load-lists-from-storage)
    
    (message "Final result: Loaded %d tasks, %d archived, %d lists" (length hyperfiler-tasks) (length hyperfiler-archived-tasks) (length hyperfiler-lists))
    (when hyperfiler-tasks
      (message "Sample task: %s" (car hyperfiler-tasks))
      (message "Tasks successfully loaded!"))

(defun hyperfiler--load-lists-from-storage ()
  "Load lists and list archive from persistent org storage."
  (let ((lists-file (expand-file-name "hyperfiler-lists.org" user-emacs-directory))
        (list-archive-file (expand-file-name "hyperfiler-list-archive.org" user-emacs-directory)))
    ;; Initialize
    (setq hyperfiler-lists nil)
    (setq hyperfiler-list-archive nil)
    
    ;; Load lists
    (when (file-exists-p lists-file)
      (condition-case err
          (with-temp-buffer
            (insert-file-contents lists-file)
            (org-mode)
            (goto-char (point-min))
            (when (re-search-forward "^\\* Lists" nil t)
              (while (re-search-forward "^\\*\\* \\(.*\\)$" nil t)
                (let ((list-name (match-string 1))
                      (items '()))
                  ;; Skip properties section
                  (when (re-search-forward ":PROPERTIES:" nil t)
                    (re-search-forward ":END:" nil t))
                  ;; Parse list items (checkboxes)
                  (let ((items-start (point))
                        (items-end (save-excursion
                                     (or (re-search-forward "^\\*\\*" nil t)
                                         (point-max)))))
                    (goto-char items-start)
                    (while (re-search-forward "^- \\(\\[.\\]\\) \\(.*\\)$" items-end t)
                      (let ((checkbox (match-string 1))
                            (text (match-string 2)))
                        (push (list :text text 
                                   :completed (string= checkbox "[X]")
                                   :id (format "%d-%d" (time-to-seconds) (random 1000000)))
                              items))))
                  (push (list :name list-name :items (nreverse items)) hyperfiler-lists)))))
        (error
         (message "Error loading lists from org: %s" (error-message-string err))
         (setq hyperfiler-lists nil))))
    
    ;; Load list archive
    (when (file-exists-p list-archive-file)
      (condition-case err
          (with-temp-buffer
            (insert-file-contents list-archive-file)
            (org-mode)
            (goto-char (point-min))
            (when (re-search-forward "^\\* Archived List Items" nil t)
              (while (re-search-forward "^\\*\\* DONE \\(.*\\)$" nil t)
                (let ((text (match-string 1))
                      (item-plist (list :text text)))
                  ;; Parse properties
                  (when (re-search-forward ":PROPERTIES:" nil t)
                    (let ((props-start (point))
                          (props-end (save-excursion 
                                      (re-search-forward ":END:" nil t)
                                      (point))))
                      (goto-char props-start)
                      (while (re-search-forward "^:\\([^:]+\\):\\s-*\\(.*\\)$" props-end t)
                        (let ((key (intern (concat ":" (downcase (match-string 1)))))
                              (value (match-string 2)))
                          (when (and value (not (string-empty-p value)))
                            (setq item-plist (plist-put item-plist key value)))))))
                  (push item-plist hyperfiler-list-archive)))))
        (error
         (message "Error loading list archive: %s" (error-message-string err))
         (setq hyperfiler-list-archive nil))))
    
    ;; Auto-export all lists to HTML after loading (if any exist)
    ;; (when hyperfiler-lists
    ;;   (hyperfiler--auto-export-all-lists))
    ))

(defun hyperfiler-reset-data ()
  "Reset all HyperFiler data and start fresh."
  (interactive)
  (when (y-or-n-p "This will delete all HyperFiler tasks and data. Are you sure? ")
    (setq hyperfiler-tasks nil)
    (clrhash hyperfiler-event-task-ids)
    (setq hyperfiler-undo-stack nil)
    (setq hyperfiler-current-task-index 0)
    (let ((storage-file (expand-file-name "hyperfiler-tasks.json" user-emacs-directory))
          (events-file (expand-file-name "hyperfiler-events.json" user-emacs-directory)))
      (when (file-exists-p storage-file)
        (delete-file storage-file))
      (when (file-exists-p events-file)
        (delete-file events-file)))
    (message "HyperFiler data reset. Starting fresh.")
    (hyperfiler-render-current-view)))

(defun hyperfiler-fix-invalid-dates ()
  "Fix tasks with invalid or missing dates."
  (interactive)
  (let ((fixed-count 0)
        (current-date (hyperfiler--get-current-date)))
    (dolist (task hyperfiler-tasks)
      (let ((due-date (plist-get task :dueDate)))
        (when (or (not due-date)
                  (string-empty-p due-date)
                  (not (string-match-p "^[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}$" due-date)))
          (plist-put task :dueDate current-date)
          (setq fixed-count (1+ fixed-count)))))
    
    ;; Also fix archived tasks
    (dolist (task hyperfiler-archived-tasks)
      (let ((due-date (plist-get task :dueDate)))
        (when (or (not due-date)
                  (string-empty-p due-date)
                  (not (string-match-p "^[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}$" due-date)))
          (plist-put task :dueDate current-date)
          (setq fixed-count (1+ fixed-count)))))
    
    (when (> fixed-count 0)
      (hyperfiler--save-tasks-to-local-storage)
      (message "Fixed %d tasks with invalid dates" fixed-count)
      (hyperfiler-render-current-view))
    (when (= fixed-count 0)
      (message "No invalid dates found"))))

;;; Undo System

(defun hyperfiler--save-state-for-undo (action)
  "Save current state for undo with ACTION description."
  (let ((state (list :action action
                     :timestamp (current-time)
                     :tasks (copy-sequence hyperfiler-tasks)
                     :events (copy-hash-table hyperfiler-event-task-ids))))
    (push state hyperfiler-undo-stack)
    ;; Keep only last 50 undo states
    (when (> (length hyperfiler-undo-stack) 50)
      (setq hyperfiler-undo-stack (butlast hyperfiler-undo-stack)))))

(defun hyperfiler-undo-last-action ()
  "Undo the last action."
  (interactive)
  (when hyperfiler-undo-stack
    (let ((last-state (pop hyperfiler-undo-stack)))
      (setq hyperfiler-tasks (plist-get last-state :tasks))
      (setq hyperfiler-event-task-ids (plist-get last-state :events))
      (hyperfiler--save-tasks-to-local-storage)
      (hyperfiler-render-current-view)
      (message "Undid: %s" (plist-get last-state :action)))))

;;; Sorting Functions

(defun hyperfiler--sort-tasks-by-time (tasks)
  "Sort TASKS with timed tasks first chronologically, then 00:00 tasks."
  (let ((timed-tasks (cl-remove-if 
                      (lambda (task) 
                        (let ((time (or (plist-get task :dueTime) "00:00")))
                          (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                          (equal time "00:00")))
                      tasks))
        (zero-time-tasks (cl-remove-if-not 
                          (lambda (task) 
                            (let ((time (or (plist-get task :dueTime) "00:00")))
                              (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                              (equal time "00:00")))
                          tasks)))
    ;; Sort timed tasks chronologically, then append 00:00 tasks
    (append (sort timed-tasks (lambda (a b)
                                (let ((time-a (or (plist-get a :dueTime) "00:00"))
                                      (time-b (or (plist-get b :dueTime) "00:00")))
                                  (string< time-a time-b))))
            zero-time-tasks)))

;;; Navigation Functions

(defun hyperfiler--get-current-view-tasks ()
  "Get tasks for the current view."
  (pcase hyperfiler-current-view
    ('today 
     (let ((today (hyperfiler--get-current-date)))
       (hyperfiler--sort-tasks-by-time
        (cl-remove-if-not 
         (lambda (task) (equal (plist-get task :dueDate) today))
         hyperfiler-tasks))))
    ('week 
     (let* ((today (current-time))
            (start-of-week (time-subtract today (seconds-to-time (* (calendar-day-of-week (calendar-current-date)) 86400))))
            (end-of-week (time-add start-of-week (seconds-to-time (* 7 86400)))))
       (hyperfiler--sort-tasks-by-time
        (cl-remove-if-not 
         (lambda (task)
           (let ((due-date (plist-get task :dueDate)))
             (when (and due-date 
                        (not (string-empty-p due-date))
                        (string-match-p "^[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}$" due-date))
               (condition-case nil
                   (let ((task-date (date-to-time (concat due-date "T00:00:00"))))
                     (and (time-less-p start-of-week task-date)
                          (time-less-p task-date end-of-week)))
                 (error nil)))))
         hyperfiler-tasks))))
    ('all (hyperfiler--sort-tasks-by-time hyperfiler-tasks))
    ('archive hyperfiler-archived-tasks)
    ('lists hyperfiler-lists)
    (_ hyperfiler-tasks)))

(defun hyperfiler--move-cursor-to-task (task-index)
  "Move cursor to task at TASK-INDEX."
  (let ((tasks (hyperfiler--get-current-view-tasks)))
    (when (and tasks (>= task-index 0) (< task-index (length tasks)))
      (setq hyperfiler-current-task-index task-index)
      (goto-char (point-min))
      ;; Skip header lines (title + navigation + empty line)
      (forward-line 3)
      ;; Find task lines by looking for task pattern
      (let ((task-count 0)
            (found nil))
        (while (and (not found) (not (eobp)))
          ;; Match task lines: timed tasks [HH:MM], completed tasks ✓, or any line that doesn't start with === or [n] 
          (when (and (looking-at "^\\s-*\\(\\[[0-9][0-9]:[0-9][0-9]\\]\\|[^=\\[]\\)")
                     (not (looking-at "^\\s-*$"))  ; Skip empty lines
                     (not (looking-at ".*\\[.*\\].*Navigate"))  ; Skip navigation help lines
                     (not (looking-at ".*←.*→"))  ; Skip navigation arrows
                     (not (looking-at "^\\s-*-+\\s-*$")))  ; Skip separator lines with dashes
            (if (= task-count task-index)
                (setq found t)
              (setq task-count (1+ task-count))))
          (unless found
            (forward-line 1)))
        (when found
          (beginning-of-line)))))

(defun hyperfiler--highlight-selected-tasks ()
  "Highlight all selected task lines with red text."
  (save-excursion
    ;; Remove previous highlights
    (remove-overlays (point-min) (point-max) 'hyperfiler-highlight t)
    ;; Add red text highlight to all selected tasks
    (when hyperfiler-selected-task-indices
      (goto-char (point-min))
      (forward-line 3) ;; Skip header lines
      (let ((task-count 0))
        (while (not (eobp))
          (when (and (looking-at "^\\s-*\\(\\[[0-9][0-9]:[0-9][0-9]\\]\\|[^=\\[]\\)")
                     (not (looking-at "^\\s-*$"))  ; Skip empty lines
                     (not (looking-at ".*\\[.*\\].*Navigate"))  ; Skip navigation help lines
                     (not (looking-at ".*←.*→"))  ; Skip navigation arrows
                     (not (looking-at "^\\s-*-+\\s-*$")))  ; Skip separator lines with dashes
            (when (member task-count hyperfiler-selected-task-indices)
              (let ((overlay (make-overlay (line-beginning-position) (line-end-position))))
                (overlay-put overlay 'face '(:foreground "red" :weight bold))
                (overlay-put overlay 'hyperfiler-highlight t)))
            (setq task-count (1+ task-count)))
          (forward-line 1)))))))

(defun hyperfiler-next-task ()
  "Move to next task."
  (interactive)
  (let ((tasks (hyperfiler--get-current-view-tasks)))
    (when tasks
      (setq hyperfiler-current-task-index 
            (min (1- (length tasks)) (1+ hyperfiler-current-task-index)))
      (hyperfiler--move-cursor-to-task hyperfiler-current-task-index))))

(defun hyperfiler-previous-task ()
  "Move to previous task."
  (interactive)
  (let ((tasks (hyperfiler--get-current-view-tasks)))
    (when tasks
      (setq hyperfiler-current-task-index (max 0 (1- hyperfiler-current-task-index)))
      (hyperfiler--move-cursor-to-task hyperfiler-current-task-index))))

(defun hyperfiler--get-current-task ()
  "Get the currently selected task."
  (let ((tasks (hyperfiler--get-current-view-tasks)))
    (when (and tasks (>= hyperfiler-current-task-index 0) 
               (< hyperfiler-current-task-index (length tasks)))
      (nth hyperfiler-current-task-index tasks))))

;;; View Functions

(defun hyperfiler-render-current-view ()
  "Render the current view based on `hyperfiler-current-view'."
  (pcase hyperfiler-current-view
    ('today (hyperfiler-show-today-view))
    ('week (hyperfiler-show-week-view))
    ('month (hyperfiler-show-month-view))
    ('all (hyperfiler-show-all-view))
    ('archive (hyperfiler-show-archive-view))
    ('lists (hyperfiler-show-lists-view))
    (_ (hyperfiler-show-today-view)))
  ;; Maintain red highlighting of selected tasks after render
  (hyperfiler--highlight-selected-tasks))

(defun hyperfiler-show-today-view ()
  "Show today's tasks."
  (interactive)
  (setq hyperfiler-current-view 'today)
  (let* ((display-date (or hyperfiler-current-date (hyperfiler--get-current-date)))
         (today-tasks (hyperfiler--sort-tasks-by-time
                       (cl-remove-if-not 
                        (lambda (task)
                          (equal (plist-get task :dueDate) display-date))
                        hyperfiler-tasks)))
         (buffer (get-buffer-create "*HyperFiler Today*")))
    (with-current-buffer buffer
      (setq buffer-read-only nil)
      (erase-buffer)
      (insert (format "=== %s ===\n" (hyperfiler--format-date display-date)))
      (insert "←  Today  →\n\n")
      (if today-tasks
          (hyperfiler--render-tasks-with-sections today-tasks)
        (insert "No tasks for this day.\n"))
      (insert "\n[n] New task  [e] Edit  [d] Archive  [SPC] Select+Next  [t] Time nav (↑↓)  [T] Set time  [+/-] Adjust time  [A] Archive view  [u] Undo  [↑↓/j/k] Navigate  [←→/h/l] Change day  [0] Today  [1/2/3/4] Views  [q] Quit\n")
      (hyperfiler-mode)
      (setq buffer-read-only t)
      ;; Reset task index and move cursor to first task
      (setq hyperfiler-current-task-index 0)
      (when today-tasks (hyperfiler--move-cursor-to-task 0)))
    (switch-to-buffer buffer)))

(defun hyperfiler-show-week-view ()
  "Show this week's tasks in Monday-Sunday layout."
  (interactive)
  (setq hyperfiler-current-view 'week)
  (let* ((week-start (or hyperfiler-current-week-start 
                        (hyperfiler--get-monday-of-current-week)))
         (monday (date-to-time (concat week-start "T00:00:00")))
         (sunday (time-add monday (seconds-to-time (* 6 86400))))
         (buffer (get-buffer-create "*HyperFiler Week*")))
    
    (with-current-buffer buffer
      (setq buffer-read-only nil)
      (erase-buffer)
      (insert (format "=== Week: %s - %s ===\n" 
                      (format-time-string "%b %d" monday)
                      (format-time-string "%b %d, %Y" sunday)))
      (insert "←  Week  →\n\n")
      
      ;; Display each day of the week
      (dotimes (day 7)
        (let* ((current-day (time-add monday (seconds-to-time (* day 86400))))
               (day-date (format-time-string "%Y-%m-%d" current-day))
               (day-name (format-time-string "%A" current-day))
               (is-today (equal day-date (hyperfiler--get-current-date)))
               (day-tasks (hyperfiler--sort-tasks-by-time
                          (cl-remove-if-not 
                           (lambda (task)
                             (equal (plist-get task :dueDate) day-date))
                           hyperfiler-tasks))))
          
          ;; Day header
          (insert (format "%s %s%s\n" 
                         day-name 
                         (format-time-string "%b %d" current-day)
                         (if is-today " (TODAY)" "")))
          (insert (make-string (length (format "%s %s%s" 
                                              day-name 
                                              (format-time-string "%b %d" current-day)
                                              (if is-today " (TODAY)" ""))) ?-))
          (insert "\n")
          
          ;; Day tasks - separate timed and untimed
          (if day-tasks
              (let ((timed-tasks (cl-remove-if 
                                  (lambda (task) 
                                    (let ((time (or (plist-get task :dueTime) "00:00")))
                                      (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                                      (equal time "00:00")))
                                  day-tasks))
                    (zero-time-tasks (cl-remove-if-not 
                                      (lambda (task) 
                                        (let ((time (or (plist-get task :dueTime) "00:00")))
                                          (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                                          (equal time "00:00")))
                                      day-tasks)))
                ;; Render timed tasks first
                (dolist (task timed-tasks)
                  (let* ((title (plist-get task :title))
                         (time (plist-get task :dueTime))
                         (status (plist-get task :status))
                         (is-event (plist-get task :isEvent))
                         (status-prefix "")
                         (event-badge (if is-event " 🔴" "")))
                    (insert (format "  [%s] %s%s%s\n" 
                                   time status-prefix title event-badge))))
                ;; Render notes section for 00:00 tasks if any
                (when zero-time-tasks
                  (when timed-tasks (insert "\n"))
                  (insert "  No specific time:\n")
                  (dolist (task zero-time-tasks)
                    (let* ((title (plist-get task :title))
                           (status (plist-get task :status))
                           (is-event (plist-get task :isEvent))
                           (status-prefix "")
                           (event-badge (if is-event " 🔴" "")))
                      (insert (format "    %s%s%s\n" 
                                     status-prefix title event-badge))))))
            (insert "  (No tasks)\n"))
          (insert "\n")))
      
      (insert "\n[n] New task  [e] Edit  [d] Archive  [SPC] Select+Next  [t] Time nav (↑↓)  [T] Set time  [+/-] Adjust time  [A] Archive view  [u] Undo  [↑↓/j/k] Navigate  [←→/h/l] Change week  [0] Current week  [1/2/3/4] Views  [q] Quit\n")
      (hyperfiler-mode)
      (setq buffer-read-only t))
    (switch-to-buffer buffer)))

(defun hyperfiler-show-month-view ()
  "Show month view calendar with tasks."
  (interactive)
  (setq hyperfiler-current-view 'month)
  (let* ((current-month-year (or hyperfiler-current-month 
                                (list (string-to-number (format-time-string "%m"))
                                      (string-to-number (format-time-string "%Y")))))
         (current-month (car current-month-year))
         (current-year (cadr current-month-year))
         (first-day-month (encode-time 0 0 0 1 current-month current-year))
         (month-name (format-time-string "%B %Y" first-day-month))
         (days-in-month (calendar-last-day-of-month current-month current-year))
         (first-weekday (calendar-day-of-week (list current-month 1 current-year)))
         (start-weekday (if (= first-weekday 0) 6 (1- first-weekday))) ; Monday = 0
         (buffer (get-buffer-create "*HyperFiler Month*")))
    
    (with-current-buffer buffer
      (setq buffer-read-only nil)
      (erase-buffer)
      (insert (format "=== %s ===\n" month-name))
      (insert "←  Month  →\n\n")
      
      ;; Calendar header
      (insert "Mon  Tue  Wed  Thu  Fri  Sat  Sun\n")
      (insert "---  ---  ---  ---  ---  ---  ---\n")
      
      ;; First week - pad with spaces for days before month starts
      (dotimes (i start-weekday)
        (insert "     "))
      
      ;; Calendar days
      (let ((day-of-week start-weekday))
        (dotimes (day days-in-month)
          (let* ((day-num (1+ day))
                 (day-date (format "%04d-%02d-%02d" current-year current-month day-num))
                 (is-today (equal day-date (hyperfiler--get-current-date)))
                 (day-tasks (cl-remove-if-not 
                            (lambda (task)
                              (equal (plist-get task :dueDate) day-date))
                            hyperfiler-tasks))
                 (task-count (length day-tasks))
                 (day-str (if is-today
                             (format "[%2d]" day-num)
                           (format " %2d " day-num))))
            
            ;; Add task indicator
            (when (> task-count 0)
              (setq day-str (concat day-str (format "●%d" (min task-count 9)))))
            
            (insert (format "%-5s" day-str))
            
            (setq day-of-week (1+ day-of-week))
            (when (= day-of-week 7)
              (setq day-of-week 0)
              (insert "\n")))))
      
      (insert "\n\n")
      
      ;; Task details for days with tasks
      (insert "=== Tasks This Month ===\n\n")
      (let ((month-tasks (hyperfiler--sort-tasks-by-time
                         (cl-remove-if-not 
                          (lambda (task)
                            (let ((task-date (plist-get task :dueDate)))
                              (and task-date
                                   (string-prefix-p (format "%04d-%02d" current-year current-month) task-date))))
                          hyperfiler-tasks))))
        (if month-tasks
            (let ((current-date nil))
              (dolist (task month-tasks)
                (let* ((task-date (plist-get task :dueDate))
                       (title (plist-get task :title))
                       (time (plist-get task :dueTime))
                       (status (plist-get task :status))
                       (is-event (plist-get task :isEvent))
                       (status-icon "")
                       (event-badge (if is-event " 🔴" "")))
                  
                  ;; Show date header if new date
                  (unless (equal current-date task-date)
                    (setq current-date task-date)
                    (insert (format "\n%s (%s)\n" 
                                   (hyperfiler--format-date task-date)
                                   (format-time-string "%A" (date-to-time (concat task-date "T00:00:00")))))
                    (insert (make-string 20 ?-) "\n"))
                  
                  ;; Show task
                  (insert (format "  %s %s %s%s\n" 
                                 (if time (format "[%s]" time) "[--:--]")
                                 status-icon 
                                 title 
                                 event-badge)))))
          (insert "No tasks this month.\n")))
      
      (insert "\n[n] New task  [e] Edit  [d] Archive  [SPC] Select+Next  [t] Time nav (↑↓)  [T] Set time  [+/-] Adjust time  [A] Archive view  [u] Undo  [↑↓/j/k] Navigate  [←→/h/l] Change month  [0] Current month  [1/2/3/4] Views  [q] Quit\n")
      (hyperfiler-mode)
      (setq buffer-read-only t))
    (switch-to-buffer buffer)))

(defun hyperfiler-show-all-view ()
  "Show all tasks."
  (interactive)
  (setq hyperfiler-current-view 'all)
  (let ((buffer (get-buffer-create "*HyperFiler All*")))
    (with-current-buffer buffer
      (setq buffer-read-only nil)
      (erase-buffer)
      (insert (format "=== All Tasks (%d) ===\n\n" (length hyperfiler-tasks)))
      (if hyperfiler-tasks
          (hyperfiler--render-tasks-with-sections (hyperfiler--sort-tasks-by-time hyperfiler-tasks))
        (insert "No tasks found.\n"))
      (insert "\n[n] New task  [e] Edit  [d] Archive  [SPC] Select+Next  [t] Time nav (↑↓)  [T] Set time  [+/-] Adjust time  [A] Archive view  [u] Undo  [↑↓/j/k] Navigate  [1/2/3/4] Views  [q] Quit\n")
      (hyperfiler-mode)
      (setq buffer-read-only t)
      ;; Reset task index and move cursor to first task
      (setq hyperfiler-current-task-index 0)
      (when hyperfiler-tasks (hyperfiler--move-cursor-to-task 0)))
    (switch-to-buffer buffer)))

(defun hyperfiler-show-archive-view ()
  "Show archived tasks."
  (interactive)
  (setq hyperfiler-current-view 'archive)
  (let ((buffer (get-buffer-create "*HyperFiler Archive*")))
    (with-current-buffer buffer
      (setq buffer-read-only nil)
      (erase-buffer)
      (insert (format "=== Archive (%d) ===\n\n" (length hyperfiler-archived-tasks)))
      (if hyperfiler-archived-tasks
          (dolist (task hyperfiler-archived-tasks)
            (hyperfiler--render-task task))
        (insert "No archived tasks.\n"))
      (insert "\n[r] Restore task  [d] Delete permanently  [u] Undo  [↑↓/j/k] Navigate  [1/2/3] Views  [q] Quit\n")
      (hyperfiler-mode)
      (setq buffer-read-only t)
      ;; Reset task index and move cursor to first task
      (setq hyperfiler-current-task-index 0)
      (when hyperfiler-archived-tasks (hyperfiler--move-cursor-to-task 0)))
    (switch-to-buffer buffer)))

(defun hyperfiler-show-lists-view ()
  "Show lists view for managing different lists."
  (interactive)
  (setq hyperfiler-current-view 'lists)
  (let ((buffer (get-buffer-create "*HyperFiler Lists*")))
    (with-current-buffer buffer
      (setq buffer-read-only nil)
      (erase-buffer)
      (insert (format "=== Lists (%d) ===\n\n" (length hyperfiler-lists)))
      
      (if hyperfiler-lists
          (progn
            ;; Show lists overview
            (dolist (list-obj hyperfiler-lists)
              (let* ((name (plist-get list-obj :name))
                     (items (plist-get list-obj :items))
                     (total-items (length items))
                     (completed-items (length (cl-remove-if-not 
                                              (lambda (item) (plist-get item :completed))
                                              items)))
                     (is-current (equal (plist-get list-obj :id) 
                                       (when hyperfiler-current-list 
                                         (plist-get hyperfiler-current-list :id)))))
                (if is-current
                    (insert (format "🔴 %s (%d/%d items)\n" name completed-items total-items))
                  (insert (format "   %s (%d/%d items)\n" name completed-items total-items)))))
            (insert "\n")
            
            ;; Show current list details if one is selected
            (when hyperfiler-current-list
              (let* ((name (plist-get hyperfiler-current-list :name))
                     (items (plist-get hyperfiler-current-list :items)))
                (insert (format "=== %s ===\n\n" name))
                (if items
                    (dolist (item items)
                      (let* ((text (plist-get item :text))
                             (completed (plist-get item :completed))
                             (status-prefix (if completed "✓ " "☐ ")))
                        (insert (format "%s%s\n" status-prefix text))))
                  (insert "No items in this list.\n"))
                (insert "\n")))
            
            ;; Show archive summary if exists
            (when hyperfiler-list-archive
              (insert (format "=== List Archive (%d items) ===\n" (length hyperfiler-list-archive)))))
        (insert "No lists created yet.\n\nPress 'N' to create your first list.\n"))
      
      (insert "\n[N] New list  [ENTER] Select list  [n] Add item  [SPC] Toggle item  [d] Archive completed items  [D] Delete list  [A] Archive view  [1/2/3/4] Views  [q] Quit\n")
      (hyperfiler-mode)
      (setq buffer-read-only t)
      ;; Reset task index and move cursor to first list
      (setq hyperfiler-current-task-index 0)
      (when hyperfiler-lists (hyperfiler--move-cursor-to-list 0)))
    (switch-to-buffer buffer)))

(defun hyperfiler--render-tasks-with-sections (tasks)
  "Render TASKS with separate sections for timed and 00:00 tasks."
  (let ((timed-tasks (cl-remove-if 
                      (lambda (task) 
                        (let ((time (or (plist-get task :dueTime) "00:00")))
                          (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                          (equal time "00:00")))
                      tasks))
        (zero-time-tasks (cl-remove-if-not 
                          (lambda (task) 
                            (let ((time (or (plist-get task :dueTime) "00:00")))
                              (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                              (equal time "00:00")))
                          tasks)))
    ;; Render timed tasks first - group by time with lines between different times
    (when timed-tasks
      (let ((last-time nil))
        (dolist (task timed-tasks)
          (let ((current-time (plist-get task :dueTime)))
            ;; Add separator line between different time groups
            (when (and last-time (not (equal last-time current-time)))
              (insert "--------------------\n"))
            (hyperfiler--render-task-today task)
            (setq last-time current-time)))))
    
    ;; Add section header and render 00:00 tasks if any exist
    (when zero-time-tasks
      (when timed-tasks (insert "\n"))  ; Add spacing if there were timed tasks
      (insert "=== Inbox ===\n\n")
      (dolist (task zero-time-tasks)
        (hyperfiler--render-task-today task)))))

(defun hyperfiler--render-task-today (task)
  "Render a single TASK for today view with time and task on same line."
  (let* ((title (plist-get task :title))
         (status (plist-get task :status))
         (due-time (plist-get task :dueTime))
         (is-event (plist-get task :isEvent))
         (notes (plist-get task :notes))
         (status-prefix "")
         (event-badge (if is-event " 🔴" ""))
         (time-display (if (and due-time (not (equal due-time "00:00")))
                          (format "[%s] " due-time)
                        "")))
    
    (insert (format "%s%s%s%s\n" time-display status-prefix title event-badge))
    (when (and notes (not (string-empty-p notes)))
      (insert (format "    📝 %s\n" (substring notes 0 (min 100 (length notes))))))))

(defun hyperfiler--render-task (task)
  "Render a single TASK in the current buffer."
  (let* ((title (plist-get task :title))
         (status (plist-get task :status))
         (due-date (plist-get task :dueDate))
         (due-time (plist-get task :dueTime))
         (is-event (plist-get task :isEvent))
         (notes (plist-get task :notes))
         (status-prefix "")
         (event-badge (if is-event " 🔴" ""))
         (date-str (hyperfiler--format-date due-date))
         (time-str (if due-time (concat " at " (hyperfiler--format-time due-time)) "")))
    
    (insert (format "%s%s%s\n" status-prefix title event-badge))
    (when due-date
      (insert (format "    📅 %s%s\n" date-str time-str)))
    (when (and notes (not (string-empty-p notes)))
      (insert (format "    📝 %s\n" (substring notes 0 (min 100 (length notes))))))
    (insert "\n")))

;;; Date Management and Export Functions

(defun hyperfiler--move-past-tasks-to-today ()
  "Move all tasks with past dates to today."
  (let ((today (hyperfiler--get-current-date))
        (moved-count 0))
    (dolist (task hyperfiler-tasks)
      (let ((task-date (plist-get task :dueDate)))
        (when (and task-date 
                   (string< task-date today))  ; Task date is before today
          (plist-put task :dueDate today)
          (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
          (setq moved-count (1+ moved-count)))))
    (when (> moved-count 0)
      (hyperfiler--save-tasks-to-local-storage)
      (message "Moved %d past tasks to today" moved-count))
    moved-count))

(defun hyperfiler--export-today-to-html ()
  "Export today's tasks to a beautiful HTML file and save to iCloud."
  (let* ((today (hyperfiler--get-current-date))
         ;; Use in-memory tasks instead of reading from org file
         (today-tasks (cl-remove-if-not 
                       (lambda (task)
                         (equal (plist-get task :dueDate) today))
                       hyperfiler-tasks))
         (icloud-path (expand-file-name "~/Library/Mobile Documents/com~apple~CloudDocs/"))
         (html-file (concat icloud-path "today-tasks.html")))
    
    ;; Create iCloud directory if it doesn't exist  
    (make-directory icloud-path t)
    
    ;; Generate HTML content
    (let ((html-content (hyperfiler--generate-html-for-tasks today-tasks today)))
      (with-temp-file html-file
        (insert html-content))
      (message "Exported %d tasks to iCloud: %s" (length today-tasks) html-file))))

(defun hyperfiler--generate-html-for-tasks (tasks date)
  "Generate beautiful HTML content for TASKS on DATE."
  (let* ((timed-tasks (cl-remove-if 
                       (lambda (task) 
                         (let ((time (or (plist-get task :dueTime) "00:00")))
                           (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                           (equal time "00:00")))
                       tasks))
         (inbox-tasks (cl-remove-if-not 
                       (lambda (task) 
                         (let ((time (or (plist-get task :dueTime) "00:00")))
                           (when (or (not time) (string-empty-p time)) (setq time "00:00"))
                           (equal time "00:00")))
                       tasks))
         (completed-count (length (cl-remove-if-not 
                                   (lambda (task) (equal (plist-get task :status) "completed"))
                                   tasks)))
         (total-count (length tasks)))
    
    (format "<!DOCTYPE html>
<html>
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Today's Tasks - %s</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .date {
            font-size: 1.2em;
            opacity: 0.9;
            margin-top: 10px;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        .stat {
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }
        .section {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .section h2 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .task-group {
            margin-bottom: 25px;
        }
        .time-header {
            font-size: 1.2em;
            font-weight: 600;
            color: #555;
            margin-bottom: 10px;
            padding: 8px 15px;
            background: #e8f4f8;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        .task {
            padding: 12px 15px;
            margin: 8px 0;
            border-radius: 8px;
            background: #fafbfc;
            border-left: 4px solid #e0e6ed;
            transition: all 0.3s ease;
        }
        .task.completed {
            background: #d5f4e6;
            border-left-color: #27ae60;
            text-decoration: line-through;
            opacity: 0.8;
        }
        .task.event {
            border-left-color: #e74c3c;
            background: #ffeaea;
        }
        .task-title {
            font-weight: 500;
            color: #2c3e50;
        }
        .task-notes {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
            font-style: italic;
        }
        .empty-section {
            text-align: center;
            color: #95a5a6;
            font-style: italic;
            padding: 30px;
        }
        .footer {
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e6ed;
        }
        .progress-bar {
            background: #e0e6ed;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 15px;
        }
        .progress-fill {
            background: linear-gradient(90deg, #27ae60, #2ecc71);
            height: 100%%;
            width: %d%%;
            transition: width 0.3s ease;
        }
        .task-checkbox {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            cursor: pointer;
            transform: scale(1.2);
            vertical-align: middle;
        }
        .task-content {
            display: flex;
            align-items: center;
        }
        .task-title-text {
            flex-grow: 1;
        }
        .archive-feedback {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
        }
        .archive-feedback.show {
            opacity: 1;
        }
    </style>
    <script>
        // Function to send task completion to Emacs
        function toggleTaskCompletion(taskId, isCompleted) {
            // Create a temporary file with the task completion command
            const command = JSON.stringify({
                action: isCompleted ? 'complete' : 'uncomplete',
                taskId: taskId,
                timestamp: new Date().toISOString()
            });
            
            // Save command to a file that Emacs can monitor
            fetch('file:///tmp/hyperfiler-web-command.json', {
                method: 'PUT',
                body: command
            }).catch(() => {
                // Fallback: try to write to local storage or show user message
                localStorage.setItem('hyperfiler-pending-' + taskId, command);
                showFeedback('Task updated - sync will occur on next refresh');
            });
        }
        
        function showFeedback(message) {
            const feedback = document.getElementById('feedback');
            feedback.textContent = message;
            feedback.classList.add('show');
            setTimeout(() => feedback.classList.remove('show'), 3000);
        }
        
        // Handle checkbox changes
        document.addEventListener('DOMContentLoaded', function() {
            const checkboxes = document.querySelectorAll('.task-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const taskId = this.dataset.taskId;
                    const isCompleted = this.checked;
                    const taskElement = this.closest('.task');
                    
                    // Update UI immediately
                    if (isCompleted) {
                        taskElement.classList.add('completed');
                        showFeedback('Task completed! Will be archived.');
                    } else {
                        taskElement.classList.remove('completed');
                        showFeedback('Task unmarked.');
                    }
                    
                    // Send to Emacs
                    toggleTaskCompletion(taskId, isCompleted);
                });
            });
        });
    </script>
</head>
<body>
    <div class=\"header\">
        <h1>📋 Today's Tasks</h1>
        <div class=\"date\">%s</div>
        <div class=\"stats\">
            <div class=\"stat\">
                <span class=\"stat-number\">%d</span>
                Total Tasks
            </div>
            <div class=\"stat\">
                <span class=\"stat-number\">%d</span>
                Completed
            </div>
            <div class=\"stat\">
                <span class=\"stat-number\">%d</span>
                Remaining
            </div>
        </div>
        <div class=\"progress-bar\">
            <div class=\"progress-fill\"></div>
        </div>
    </div>

%s

%s

    <div class=\"footer\">
        Generated by HyperFiler • Last updated: %s
    </div>
    
    <div id=\"feedback\" class=\"archive-feedback\"></div>
</body>
</html>"
            date  ; Page title date
            (if (> total-count 0) (/ (* completed-count 100) total-count) 0)  ; Progress percentage
            (format-time-string "%A, %B %d, %Y" (date-to-time (concat date "T00:00:00")))  ; Formatted date
            total-count completed-count (- total-count completed-count)  ; Stats
            (hyperfiler--generate-html-timed-section timed-tasks)  ; Timed tasks section
            (hyperfiler--generate-html-inbox-section inbox-tasks)  ; Inbox section
            (format-time-string "%Y-%m-%d at %H:%M"))))  ; Footer timestamp

(defun hyperfiler--generate-html-timed-section (tasks)
  "Generate HTML for timed tasks section."
  (if tasks
      (let ((html "<div class=\"section\"><h2>🕒 Scheduled Tasks</h2>")
            (last-time nil))
        (dolist (task tasks)
          (let ((task-time (plist-get task :dueTime)))
            (when (not (equal last-time task-time))
              (when last-time (setq html (concat html "</div>")))
              (setq html (concat html (format "<div class=\"task-group\"><div class=\"time-header\">%s</div>" task-time)))
              (setq last-time task-time))
            (setq html (concat html (hyperfiler--generate-html-task task)))))
        (when last-time (setq html (concat html "</div>")))
        (concat html "</div>"))
    ""))

(defun hyperfiler--generate-html-inbox-section (tasks)
  "Generate HTML for inbox tasks section."
  (concat "<div class=\"section\"><h2>📥 Inbox</h2>"
          (if tasks
              (mapconcat 'hyperfiler--generate-html-task tasks "")
            "<div class=\"empty-section\">No inbox tasks</div>")
          "</div>"))

(defun hyperfiler--generate-html-task (task)
  "Generate HTML for a single task with interactive checkbox."
  (let* ((title (plist-get task :title))
         (status (plist-get task :status))
         (notes (plist-get task :notes))
         (is-event (plist-get task :isEvent))
         (task-id (plist-get task :id))
         (completed (equal status "completed"))
         (classes (concat "task"
                         (if completed " completed" "")
                         (if is-event " event" ""))))
    (concat (format "<div class=\"%s\">" classes)
            "<div class=\"task-content\">"
            (format "<input type=\"checkbox\" class=\"task-checkbox\" data-task-id=\"%s\"%s>"
                   task-id
                   (if completed " checked" ""))
            "<div class=\"task-title-text\">"
            (format "<div class=\"task-title\">%s%s</div>"
                   (hyperfiler--html-escape title)
                   (if is-event " 🔴" ""))
            (if (and notes (not (string-empty-p notes)))
                (format "<div class=\"task-notes\">%s</div>" (hyperfiler--html-escape notes))
              "")
            "</div>"
            "</div>"
            "</div>")))

(defun hyperfiler--html-escape (text)
  "Escape HTML special characters in TEXT."
  (when text
    (replace-regexp-in-string
     "&" "&amp;"
     (replace-regexp-in-string
      "<" "&lt;"
      (replace-regexp-in-string
       ">" "&gt;"
       (replace-regexp-in-string
        "\"" "&quot;" text))))))

(defun hyperfiler-auto-update-today ()
  "Auto-move past tasks to today and export HTML. Call this periodically."
  (interactive)
  (hyperfiler--move-past-tasks-to-today)
  (hyperfiler--export-today-to-html)
  (when (equal hyperfiler-current-view 'today)
    (hyperfiler-render-current-view)))

;;; Batch Operations

(defun hyperfiler-batch-insert-notes-from-clipboard ()
  "Insert multiple notes from clipboard, one line per note, into Inbox."
  (interactive)
  (let ((clipboard-content (current-kill 0 t)))
    (if (and clipboard-content (not (string-empty-p (string-trim clipboard-content))))
        (let ((lines (split-string (string-trim clipboard-content) "\n" t "\\s-+"))
              (added-count 0)
              (today (hyperfiler--get-current-date)))
          (dolist (line lines)
            (let ((clean-line (string-trim line)))
              (when (not (string-empty-p clean-line))
                (let ((new-task (list :id (format "%d-%d" (time-to-seconds) (random 1000000))
                                     :title clean-line
                                     :notes nil
                                     :dueDate today
                                     :dueTime "00:00"
                                     :isEvent nil
                                     :repeatType nil
                                     :createdAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ")
                                     :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))))
                  (push new-task hyperfiler-tasks)
                  (setq added-count (1+ added-count))))))
          (when (> added-count 0)
            (hyperfiler--save-tasks-to-local-storage)
            (hyperfiler-render-current-view)
            (message "Added %d notes to Inbox from clipboard" added-count)))
      (message "No content found in clipboard"))))

(defun hyperfiler-batch-insert-notes-from-region ()
  "Insert multiple notes from selected region, one line per note, into Inbox."
  (interactive)
  (if (use-region-p)
      (let ((region-content (buffer-substring-no-properties (region-beginning) (region-end))))
        (if (not (string-empty-p (string-trim region-content)))
            (let ((lines (split-string (string-trim region-content) "\n" t "\\s-+"))
                  (added-count 0)
                  (today (hyperfiler--get-current-date)))
              (dolist (line lines)
                (let ((clean-line (string-trim line)))
                  (when (not (string-empty-p clean-line))
                    (let ((new-task (list :id (format "%d-%d" (time-to-seconds) (random 1000000))
                                         :title clean-line
                                         :notes nil
                                         :dueDate today
                                         :dueTime "00:00"
                                         :isEvent nil
                                         :repeatType nil
                                         :createdAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ")
                                         :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))))
                      (push new-task hyperfiler-tasks)
                      (setq added-count (1+ added-count))))))
              (when (> added-count 0)
                (hyperfiler--save-tasks-to-local-storage)
                (hyperfiler-render-current-view)
                (message "Added %d notes to Inbox from region" added-count)))
          (message "No content found in selected region")))
    (message "No region selected")))

;;; Interactive Commands

(defun hyperfiler-jump-to-current ()
  "Jump to current date/week/month depending on current view."
  (interactive)
  (pcase hyperfiler-current-view
    ('today 
     (setq hyperfiler-current-date nil)
     (hyperfiler-show-today-view)
     (message "Jumped to today"))
    ('week 
     (setq hyperfiler-current-week-start nil)
     (hyperfiler-show-week-view)
     (message "Jumped to current week"))
    ('month 
     (setq hyperfiler-current-month nil)
     (hyperfiler-show-month-view)
     (message "Jumped to current month"))
    (_ 
     (message "Jump to current only works in today/week/month views"))))

(defun hyperfiler-new-task ()
  "Create a new task interactively."
  (interactive)
  (let* ((title (read-string "Task title: "))
         (notes (read-string "Notes (optional): "))
         (due-date (read-string "Due date (YYYY-MM-DD, optional): "))
         (due-time (read-string "Due time (HH:MM, optional): "))
         (is-event (hyperfiler--ask-is-event))
         (repeat-type (completing-read "Repeat type: " 
                                       '("none" "daily" "weekly" "biweekly" "monthly" "yearly")
                                       nil t "none")))
    (when (not (string-empty-p title))
      (let ((task (hyperfiler-create-task 
                   title
                   (if (string-empty-p notes) nil notes)
                   (if (string-empty-p due-date) nil due-date)
                   (if (string-empty-p due-time) nil due-time)
                   is-event
                   (if (equal repeat-type "none") nil repeat-type))))
        (when task
          (message "Task created: %s" title)
          (hyperfiler-render-current-view))))))

(defun hyperfiler-edit-current-task ()
  "Edit the currently selected task."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (hyperfiler-edit-task (plist-get task :id))
      (message "No task selected"))))

(defun hyperfiler-archive-current-task ()
  "Archive the selected tasks (or current task if none selected)."
  (interactive)
  (let* ((all-tasks (hyperfiler--get-current-view-tasks))
         (tasks-to-archive (if hyperfiler-selected-task-indices
                              ;; Archive all selected tasks
                              (mapcar (lambda (idx) (nth idx all-tasks)) hyperfiler-selected-task-indices)
                            ;; Archive current task only
                            (let ((current (hyperfiler--get-current-task)))
                              (if current (list current) nil)))))
    (if tasks-to-archive
        (progn
          ;; Move tasks to archive
          (dolist (task tasks-to-archive)
            (push task hyperfiler-archived-tasks))
          ;; Remove tasks from main list
          (let ((task-ids (mapcar (lambda (task) (plist-get task :id)) tasks-to-archive)))
            (setq hyperfiler-tasks 
                  (cl-remove-if (lambda (task) (member (plist-get task :id) task-ids))
                                hyperfiler-tasks)))
          ;; Clear selection
          (setq hyperfiler-selected-task-indices nil)
          ;; Save changes
          (hyperfiler--save-tasks-to-local-storage)
          ;; Adjust cursor position
          (let ((tasks (hyperfiler--get-current-view-tasks)))
            (when (>= hyperfiler-current-task-index (length tasks))
              (setq hyperfiler-current-task-index (max 0 (1- (length tasks))))))
          (hyperfiler-render-current-view)
          (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
          (message "%d task(s) archived" (length tasks-to-archive)))
      (message "No task selected"))))

(defun hyperfiler-toggle-task-selection ()
  "Toggle selection of current task for batch operations and move to next task."
  (interactive)
  (let ((task (hyperfiler--get-current-task))
        (tasks (hyperfiler--get-current-view-tasks)))
    (if task
        (progn
          ;; Toggle selection in the list
          (if (member hyperfiler-current-task-index hyperfiler-selected-task-indices)
              ;; Task is already selected - deselect it
              (progn
                (setq hyperfiler-selected-task-indices 
                      (remove hyperfiler-current-task-index hyperfiler-selected-task-indices))
                (hyperfiler--highlight-selected-tasks)
                (message "%d tasks selected" (length hyperfiler-selected-task-indices)))
            ;; Task is not selected - add it to selection
            (progn
              (push hyperfiler-current-task-index hyperfiler-selected-task-indices)
              (hyperfiler--highlight-selected-tasks)
              (message "%d tasks selected" (length hyperfiler-selected-task-indices))))
          ;; Move to next task automatically
          (when (and tasks (< hyperfiler-current-task-index (1- (length tasks))))
            (setq hyperfiler-current-task-index (1+ hyperfiler-current-task-index))
            (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)))
      (message "No task selected"))))

(defun hyperfiler-restore-current-task ()
  "Restore the currently selected archived task."
  (interactive)
  (when (eq hyperfiler-current-view 'archive)
    (let ((task (hyperfiler--get-current-task)))
      (if task
          (progn
            ;; Move task back to main list
            (push task hyperfiler-tasks)
            ;; Remove from archive
            (setq hyperfiler-archived-tasks 
                  (cl-remove (plist-get task :id) hyperfiler-archived-tasks 
                             :test (lambda (id task) 
                                     (equal id (plist-get task :id)))))
            ;; Save changes
            (hyperfiler--save-tasks-to-local-storage)
            ;; Move cursor to previous task if current was restored
            (when (>= hyperfiler-current-task-index (length (hyperfiler--get-current-view-tasks)))
              (setq hyperfiler-current-task-index (max 0 (1- hyperfiler-current-task-index))))
            ;; Refresh the current view (archive view)
            (hyperfiler-render-current-view)
            (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
            ;; Show where task was restored to
            (let* ((task-date (plist-get task :dueDate))
                   (today (hyperfiler--get-current-date))
                   (location (cond 
                             ((equal task-date today) "Today")
                             ((or (not task-date) (equal task-date "")) "Inbox")
                             (t task-date))))
              (message "Task restored to %s" location)))
        (message "No task selected")))))

(defun hyperfiler-delete-current-task ()
  "Delete the currently selected task."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (when (y-or-n-p "Delete this task? ")
          (hyperfiler-delete-task (plist-get task :id))
          ;; Move cursor to previous task if current was deleted
          (when (>= hyperfiler-current-task-index (length (hyperfiler--get-current-view-tasks)))
            (setq hyperfiler-current-task-index (max 0 (1- hyperfiler-current-task-index))))
          (hyperfiler--move-cursor-to-task hyperfiler-current-task-index))
      (message "No task selected"))))

(defun hyperfiler-time-navigation-mode ()
  "Enter time navigation mode where ↑↓ arrows adjust time."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (progn
          (message "Time navigation mode: ↑↓ to adjust time, ENTER to exit")
          (let ((continue t))
            (while continue
              (let ((key (read-key)))
                (cond
                 ((eq key 'up)
                  (hyperfiler-move-task-time-up)
                  (message "Time navigation: ↑↓ to adjust, ENTER to exit"))
                 ((eq key 'down)
                  (hyperfiler-move-task-time-down)
                  (message "Time navigation: ↑↓ to adjust, ENTER to exit"))
                 ((or (eq key 'return) (eq key ?\r) (eq key ?\n))
                  (setq continue nil)
                  (message "Exited time navigation mode"))
                 (t
                  ;; Ignore other keys, stay in time navigation mode
                  (message "Time navigation: ↑↓ to adjust, ENTER to exit")))))))
      (message "No task selected"))))

(defun hyperfiler-quick-set-time ()
  "Quick time picker for current task with 30-minute blocks."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (let* ((time-blocks '("00:00" "00:30" "01:00" "01:30" "02:00" "02:30" 
                             "03:00" "03:30" "04:00" "04:30" "05:00" "05:30"
                             "06:00" "06:30" "07:00" "07:30" "08:00" "08:30"
                             "09:00" "09:30" "10:00" "10:30" "11:00" "11:30"
                             "12:00" "12:30" "13:00" "13:30" "14:00" "14:30"
                             "15:00" "15:30" "16:00" "16:30" "17:00" "17:30"
                             "18:00" "18:30" "19:00" "19:30" "20:00" "20:30"
                             "21:00" "21:30" "22:00" "22:30" "23:00" "23:30"))
               (current-time (or (plist-get task :dueTime) "00:00"))
               (new-time (completing-read "Select time: " time-blocks nil t current-time)))
          (plist-put task :dueTime new-time)
          (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
          (hyperfiler-save-task task)
          (hyperfiler-render-current-view)
          (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
          (message "Time updated to %s" new-time))
      (message "No task selected"))))

(defun hyperfiler-increment-time ()
  "Increment current task time by 30 minutes."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (let* ((current-time (or (plist-get task :dueTime) "00:00"))
               (time-parts (split-string current-time ":"))
               (hours (string-to-number (car time-parts)))
               (minutes (string-to-number (cadr time-parts)))
               (new-minutes (+ minutes 30))
               (new-hours hours))
          (when (>= new-minutes 60)
            (setq new-minutes (- new-minutes 60))
            (setq new-hours (+ new-hours 1)))
          (when (>= new-hours 24)
            (setq new-hours 0))
          (let ((new-time (format "%02d:%02d" new-hours new-minutes)))
            (plist-put task :dueTime new-time)
            (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            (hyperfiler-save-task task)
            (hyperfiler-render-current-view)
            (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
            (message "Time incremented to %s" new-time)))
      (message "No task selected"))))

(defun hyperfiler-decrement-time ()
  "Decrement current task time by 30 minutes."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (let* ((current-time (or (plist-get task :dueTime) "00:00"))
               (time-parts (split-string current-time ":"))
               (hours (string-to-number (car time-parts)))
               (minutes (string-to-number (cadr time-parts)))
               (new-minutes (- minutes 30))
               (new-hours hours))
          (when (< new-minutes 0)
            (setq new-minutes (+ new-minutes 60))
            (setq new-hours (- new-hours 1)))
          (when (< new-hours 0)
            (setq new-hours 23))
          (let ((new-time (format "%02d:%02d" new-hours new-minutes)))
            (plist-put task :dueTime new-time)
            (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            (hyperfiler-save-task task)
            (hyperfiler-render-current-view)
            (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
            (message "Time decremented to %s" new-time)))
      (message "No task selected"))))

;;; List Navigation Functions

(defun hyperfiler--move-cursor-to-list (list-index)
  "Move cursor to list at LIST-INDEX."
  (when (and hyperfiler-lists (>= list-index 0) (< list-index (length hyperfiler-lists)))
    (setq hyperfiler-current-task-index list-index)
    (goto-char (point-min))
    ;; Skip header lines
    (forward-line 3)
    ;; Find list lines
    (let ((list-count 0)
          (found nil))
      (while (and (not found) (not (eobp)))
        (when (looking-at "^\\s-*\\([🔴]\\|   \\)")
          (if (= list-count list-index)
              (setq found t)
            (setq list-count (1+ list-count))))
        (unless found
          (forward-line 1)))
      (when found
        (beginning-of-line)))
    ;; Highlight current line
    (hyperfiler--highlight-current-task)))

(defun hyperfiler--get-current-list ()
  "Get the currently selected list."
  (when (and hyperfiler-lists (>= hyperfiler-current-task-index 0) 
             (< hyperfiler-current-task-index (length hyperfiler-lists)))
    (nth hyperfiler-current-task-index hyperfiler-lists)))

(defun hyperfiler-select-current-list ()
  "Select the currently highlighted list for viewing/editing."
  (interactive)
  (when (eq hyperfiler-current-view 'lists)
    (let ((list-obj (hyperfiler--get-current-list)))
      (if list-obj
          (progn
            (setq hyperfiler-current-list list-obj)
            (hyperfiler-show-lists-view)
            (message "Selected list: %s" (plist-get list-obj :name)))
        (message "No list selected")))))

;;; List Interactive Commands

(defun hyperfiler-new-list ()
  "Create a new list."
  (interactive)
  (let ((name (read-string "List name: ")))
    (when (not (string-empty-p name))
      (let ((new-list (hyperfiler-create-list name)))
        (when new-list
          (message "List created: %s" name)
          (hyperfiler-show-lists-view))))))

(defun hyperfiler-add-item-to-current-list ()
  "Add item to currently selected list."
  (interactive)
  (when (eq hyperfiler-current-view 'lists)
    (if hyperfiler-current-list
        (let ((item-text (read-string "Item text: ")))
          (when (not (string-empty-p item-text))
            (let ((new-item (hyperfiler-add-item-to-list 
                           (plist-get hyperfiler-current-list :id) 
                           item-text)))
              (when new-item
                ;; Refresh current list from storage
                (setq hyperfiler-current-list 
                      (cl-find (plist-get hyperfiler-current-list :id) hyperfiler-lists
                              :test (lambda (id lst) (equal id (plist-get lst :id)))))
                (hyperfiler-show-lists-view)
                (message "Added item: %s" item-text)))))
      (message "No list selected. Press ENTER to select a list first."))))

(defun hyperfiler-toggle-current-list-item ()
  "Toggle completion status of current list item."
  (interactive)
  (when (and (eq hyperfiler-current-view 'lists) hyperfiler-current-list)
    (let ((items (plist-get hyperfiler-current-list :items)))
      (if items
          (let* ((item-index (- hyperfiler-current-task-index 
                               (+ 3 ; header lines
                                  (length hyperfiler-lists) ; list overview lines
                                  2 ; spacing
                                  1))) ; list header
                 (item (when (and (>= item-index 0) (< item-index (length items)))
                        (nth item-index items))))
            (if item
                (progn
                  (hyperfiler-toggle-list-item 
                   (plist-get hyperfiler-current-list :id)
                   (plist-get item :id))
                  ;; Refresh current list from storage
                  (setq hyperfiler-current-list 
                        (cl-find (plist-get hyperfiler-current-list :id) hyperfiler-lists
                                :test (lambda (id lst) (equal id (plist-get lst :id)))))
                  (hyperfiler-show-lists-view)
                  (message "Toggled item: %s" (plist-get item :text)))
              (message "No item selected")))
        (message "No items in current list")))))

(defun hyperfiler-archive-current-list-completed ()
  "Archive all completed items from current list."
  (interactive)
  (when (and (eq hyperfiler-current-view 'lists) hyperfiler-current-list)
    (let ((archived-count (hyperfiler-archive-completed-list-items 
                          (plist-get hyperfiler-current-list :id))))
      (if archived-count
          (progn
            ;; Refresh current list from storage
            (setq hyperfiler-current-list 
                  (cl-find (plist-get hyperfiler-current-list :id) hyperfiler-lists
                          :test (lambda (id lst) (equal id (plist-get lst :id)))))
            (hyperfiler-show-lists-view)
            (message "Archived %d completed items" archived-count))
        (message "No completed items to archive")))))

(defun hyperfiler-delete-current-list ()
  "Delete the current list."
  (interactive)
  (when (and (eq hyperfiler-current-view 'lists) hyperfiler-current-list)
    (when (hyperfiler-delete-list (plist-get hyperfiler-current-list :id))
      (setq hyperfiler-current-list nil)
      (setq hyperfiler-current-task-index 0)
      (hyperfiler-show-lists-view)
      (message "List deleted"))))

(defun hyperfiler-export-current-list-to-html ()
  "Export current list to HTML with interactive checkboxes."
  (interactive)
  (when (and (eq hyperfiler-current-view 'lists) hyperfiler-current-list)
    (let* ((list-name (plist-get hyperfiler-current-list :name))
           ;; Get fresh data from org file
           (org-list-data (hyperfiler--get-list-from-org list-name))
           (icloud-path (expand-file-name "~/Library/Mobile Documents/com~apple~CloudDocs/"))
           (safe-name (replace-regexp-in-string "[^a-zA-Z0-9-]" "-" list-name))
           (html-file (concat icloud-path safe-name "-list.html")))
      
      ;; Create directory if it doesn't exist
      (make-directory icloud-path t)
      
      ;; Generate HTML content using org data
      (let ((html-content (hyperfiler--generate-html-for-list org-list-data)))
        (with-temp-file html-file
          (insert html-content))
        (message "Exported list '%s' to iCloud: %s" list-name html-file)))))

(defun hyperfiler--auto-export-list-to-html (list-obj)
  "Automatically export LIST-OBJ to HTML."
  (when list-obj
    (let* ((list-name (plist-get list-obj :name))
           ;; Get fresh data from org file
           (org-list-data (hyperfiler--get-list-from-org list-name))
           (icloud-base (expand-file-name "~/Library/Mobile Documents/com~apple~CloudDocs/"))
           (desktop-path (expand-file-name "~/Desktop/"))
           ;; Use iCloud if available, otherwise fall back to Desktop
           (export-path (if (file-directory-p icloud-base) icloud-base desktop-path))
           (safe-name (replace-regexp-in-string "[^a-zA-Z0-9-]" "-" list-name))
           (html-file (concat export-path safe-name "-list.html")))
      
      ;; Create directory if it doesn't exist
      (make-directory export-path t)
      
      ;; Generate HTML content using org data
      (let ((html-content (hyperfiler--generate-html-for-list org-list-data)))
        (with-temp-file html-file
          (insert html-content)))
      
      ;; Debug message to show where file was saved
      (message "List '%s' exported to: %s" list-name html-file))))

(defun hyperfiler-check-icloud-status ()
  "Check iCloud Drive status and show available paths."
  (interactive)
  (let ((icloud-path "~/Library/Mobile Documents/com~apple~CloudDocs/")
        (desktop-path "~/Desktop/"))
    (message "iCloud path: %s (exists: %s)" 
             (expand-file-name icloud-path)
             (file-directory-p (expand-file-name icloud-path)))
    (message "Desktop path: %s (exists: %s)" 
             (expand-file-name desktop-path)
             (file-directory-p (expand-file-name desktop-path)))))

(defun hyperfiler--auto-export-all-lists ()
  "Auto-export all lists to HTML."
  (dolist (list-obj hyperfiler-lists)
    (hyperfiler--auto-export-list-to-html list-obj)))

;;; HTML generation for lists

(defun hyperfiler--auto-generate-all-html ()
  "Automatically generate all HTML files from org data."
  (condition-case err
      (progn
        ;; Export today's tasks
        (hyperfiler--export-today-to-html)
        ;; Export all lists  
        (hyperfiler-export-all-lists-to-html))
    (error
     (message "Error auto-generating HTML: %s" (error-message-string err)))))

(defun hyperfiler-export-all-lists-to-html ()
  "Export all lists from org file to HTML."
  (interactive)
  (let ((all-lists (hyperfiler--get-all-lists-from-org))
        (exported-count 0))
    (dolist (list-obj all-lists)
      (when list-obj
        (hyperfiler--auto-export-list-to-html list-obj)
        (setq exported-count (1+ exported-count))))
    (message "Exported %d lists to HTML" exported-count)))

;; TEMPORARILY DISABLED FOR DEBUGGING
;; (defun hyperfiler--generate-html-for-list (list-obj)
;;   "Generate interactive HTML content for LIST-OBJ with org file sync."
;;   (when list-obj
;;     ... (function implementation was here)
;;   )

(defun hyperfiler--generate-html-for-list (list-obj)
  "Generate simple HTML content for LIST-OBJ."
  (when list-obj
    (let ((list-name (plist-get list-obj :name))
          (items (plist-get list-obj :items)))
      (concat "<!DOCTYPE html><html><head><title>" 
              (hyperfiler--html-escape list-name) 
              "</title></head><body><h1>" 
              (hyperfiler--html-escape list-name) 
              "</h1>"
              (if items
                  (mapconcat 
                   (lambda (item)
                     (concat "<div><input type='checkbox'> " (hyperfiler--html-escape (plist-get item :text)) "</div>"))
                   items "")
                "<p>No items</p>")
              "</body></html>"))))


;;; Context-sensitive commands

(defun hyperfiler-context-new ()
  "Context-sensitive new command: task for other views, item for lists view."
  (interactive)
  (if (eq hyperfiler-current-view 'lists)
      (hyperfiler-add-item-to-current-list)
    (hyperfiler-new-task)))

(defun hyperfiler-context-toggle ()
  "Context-sensitive toggle command."
  (interactive)
  (if (eq hyperfiler-current-view 'lists)
      (hyperfiler-toggle-current-list-item)
    (hyperfiler-toggle-task-selection)))

(defun hyperfiler-context-archive ()
  "Context-sensitive archive command."
  (interactive)
  (if (eq hyperfiler-current-view 'lists)
      (hyperfiler-archive-current-list-completed)
    (hyperfiler-archive-current-task)))

(defun hyperfiler-move-task-time-up ()
  "Move current task's time up in 30-minute increments or set time if none."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (let* ((current-time (plist-get task :dueTime))
               (new-time (cond
                         ;; No time set or empty - ask user to select
                         ((or (not current-time) (string-empty-p current-time))
                          (hyperfiler--quick-time-select task "Set time for task"))
                         ;; Has time (including 00:00) - increment by 30 minutes
                         (t (hyperfiler--increment-time-by-30 current-time)))))
          (when new-time
            (plist-put task :dueTime new-time)
            (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            (hyperfiler-save-task task)
            (hyperfiler-render-current-view)
            (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
            (message "Time updated to %s" new-time)))
      (message "No task selected"))))

(defun hyperfiler-move-task-time-down ()
  "Move current task's time down in 30-minute increments or set time if none."
  (interactive)
  (let ((task (hyperfiler--get-current-task)))
    (if task
        (let* ((current-time (plist-get task :dueTime))
               (new-time (cond
                         ;; No time set or empty - ask user to select
                         ((or (not current-time) (string-empty-p current-time))
                          (hyperfiler--quick-time-select task "Set time for task"))
                         ;; Has time (including 00:00) - decrement by 30 minutes  
                         (t (hyperfiler--decrement-time-by-30 current-time)))))
          (when new-time
            (plist-put task :dueTime new-time)
            (plist-put task :updatedAt (format-time-string "%Y-%m-%dT%H:%M:%S.%3NZ"))
            (hyperfiler-save-task task)
            (hyperfiler-render-current-view)
            (hyperfiler--move-cursor-to-task hyperfiler-current-task-index)
            (message "Time updated to %s" new-time)))
      (message "No task selected"))))

(defun hyperfiler--quick-time-select (task prompt)
  "Quick time selection for TASK with PROMPT."
  (let* ((common-times '("08:00" "09:00" "10:00" "11:00" "12:00" "13:00" "14:00" "15:00" "16:00" "17:00" "18:00"))
         (all-times '("00:00" "00:30" "01:00" "01:30" "02:00" "02:30" 
                     "03:00" "03:30" "04:00" "04:30" "05:00" "05:30"
                     "06:00" "06:30" "07:00" "07:30" "08:00" "08:30"
                     "09:00" "09:30" "10:00" "10:30" "11:00" "11:30"
                     "12:00" "12:30" "13:00" "13:30" "14:00" "14:30"
                     "15:00" "15:30" "16:00" "16:30" "17:00" "17:30"
                     "18:00" "18:30" "19:00" "19:30" "20:00" "20:30"
                     "21:00" "21:30" "22:00" "22:30" "23:00" "23:30"))
         (choice (completing-read 
                  (format "%s [TAB for all times]: " prompt)
                  (append common-times (list "--- All Times ---") all-times)
                  nil t)))
    (if (equal choice "--- All Times ---")
        (completing-read "Select time: " all-times nil t)
      choice)))

(defun hyperfiler--increment-time-by-30 (time-str)
  "Increment TIME-STR by 30 minutes."
  (let* ((time-parts (split-string time-str ":"))
         (hours (string-to-number (car time-parts)))
         (minutes (string-to-number (cadr time-parts)))
         (new-minutes (+ minutes 30))
         (new-hours hours))
    (when (>= new-minutes 60)
      (setq new-minutes (- new-minutes 60))
      (setq new-hours (+ new-hours 1)))
    (when (>= new-hours 24)
      (setq new-hours 0))
    (format "%02d:%02d" new-hours new-minutes)))

(defun hyperfiler--decrement-time-by-30 (time-str)
  "Decrement TIME-STR by 30 minutes."
  (let* ((time-parts (split-string time-str ":"))
         (hours (string-to-number (car time-parts)))
         (minutes (string-to-number (cadr time-parts)))
         (new-minutes (- minutes 30))
         (new-hours hours))
    (when (< new-minutes 0)
      (setq new-minutes (+ new-minutes 60))
      (setq new-hours (- new-hours 1)))
    (when (< new-hours 0)
      (setq new-hours 23))
    (format "%02d:%02d" new-hours new-minutes)))

;;; Navigation Functions

(defun hyperfiler-navigate-previous ()
  "Navigate to previous day/week/month depending on current view."
  (interactive)
  (pcase hyperfiler-current-view
    ('today
     (let ((current (or hyperfiler-current-date (hyperfiler--get-current-date))))
       (let* ((current-time (date-to-time (concat current "T00:00:00")))
              (prev-time (time-subtract current-time (seconds-to-time 86400)))
              (prev-date (format-time-string "%Y-%m-%d" prev-time)))
         (setq hyperfiler-current-date prev-date)
         (hyperfiler-show-today-view))))
    ('week
     (let ((current-start (or hyperfiler-current-week-start 
                             (hyperfiler--get-monday-of-current-week))))
       (let* ((current-time (date-to-time (concat current-start "T00:00:00")))
              (prev-time (time-subtract current-time (seconds-to-time (* 7 86400))))
              (prev-start (format-time-string "%Y-%m-%d" prev-time)))
         (setq hyperfiler-current-week-start prev-start)
         (hyperfiler-show-week-view))))
    ('month
     (let* ((current (or hyperfiler-current-month 
                        (list (string-to-number (format-time-string "%m"))
                              (string-to-number (format-time-string "%Y")))))
            (month (car current))
            (year (cadr current))
            (prev-month (if (= month 1) 12 (1- month)))
            (prev-year (if (= month 1) (1- year) year)))
       (setq hyperfiler-current-month (list prev-month prev-year))
       (hyperfiler-show-month-view)))))

(defun hyperfiler-navigate-next ()
  "Navigate to next day/week/month depending on current view."
  (interactive)
  (pcase hyperfiler-current-view
    ('today
     (let ((current (or hyperfiler-current-date (hyperfiler--get-current-date))))
       (let* ((current-time (date-to-time (concat current "T00:00:00")))
              (next-time (time-add current-time (seconds-to-time 86400)))
              (next-date (format-time-string "%Y-%m-%d" next-time)))
         (setq hyperfiler-current-date next-date)
         (hyperfiler-show-today-view))))
    ('week
     (let ((current-start (or hyperfiler-current-week-start 
                             (hyperfiler--get-monday-of-current-week))))
       (let* ((current-time (date-to-time (concat current-start "T00:00:00")))
              (next-time (time-add current-time (seconds-to-time (* 7 86400))))
              (next-start (format-time-string "%Y-%m-%d" next-time)))
         (setq hyperfiler-current-week-start next-start)
         (hyperfiler-show-week-view))))
    ('month
     (let* ((current (or hyperfiler-current-month 
                        (list (string-to-number (format-time-string "%m"))
                              (string-to-number (format-time-string "%Y")))))
            (month (car current))
            (year (cadr current))
            (next-month (if (= month 12) 1 (1+ month)))
            (next-year (if (= month 12) (1+ year) year)))
       (setq hyperfiler-current-month (list next-month next-year))
       (hyperfiler-show-month-view)))))

(defun hyperfiler--get-monday-of-current-week ()
  "Get the Monday of current week."
  (let* ((today (current-time))
         (today-weekday (calendar-day-of-week (calendar-current-date)))
         (days-since-monday (if (= today-weekday 0) 6 (1- today-weekday)))
         (monday (time-subtract today (seconds-to-time (* days-since-monday 86400)))))
    (format-time-string "%Y-%m-%d" monday)))

;;; Mode Definition

(defvar hyperfiler-mode-map
  (let ((map (make-sparse-keymap)))
    (define-key map "n" 'hyperfiler-context-new)
    (define-key map "e" 'hyperfiler-edit-current-task)
    (define-key map " " 'hyperfiler-context-toggle)
    (define-key map "r" 'hyperfiler-restore-current-task)
    (define-key map "d" 'hyperfiler-context-archive)
    (define-key map "u" 'hyperfiler-undo-last-action)
    (define-key map "1" 'hyperfiler-show-today-view)
    (define-key map "2" 'hyperfiler-show-week-view)
    (define-key map "3" 'hyperfiler-show-month-view)
    (define-key map "4" 'hyperfiler-show-all-view)
    (define-key map "L" 'hyperfiler-show-lists-view)
    (define-key map "A" 'hyperfiler-show-archive-view)
    ;; Lists-specific commands
    (define-key map "N" 'hyperfiler-new-list)
    (define-key map (kbd "RET") 'hyperfiler-select-current-list)
    (define-key map "D" 'hyperfiler-delete-current-list)
    (define-key map "q" 'quit-window)
    (define-key map "g" 'hyperfiler-render-current-view)
    ;; Time editing
    (define-key map "t" 'hyperfiler-time-navigation-mode)
    (define-key map "T" 'hyperfiler-quick-set-time)
    (define-key map "+" 'hyperfiler-increment-time)
    (define-key map "-" 'hyperfiler-decrement-time)
    ;; Navigation
    (define-key map (kbd "<up>") 'hyperfiler-previous-task)
    (define-key map (kbd "<down>") 'hyperfiler-next-task)
    (define-key map (kbd "<left>") 'hyperfiler-navigate-previous)
    (define-key map (kbd "<right>") 'hyperfiler-navigate-next)
    (define-key map "j" 'hyperfiler-next-task)
    (define-key map "k" 'hyperfiler-previous-task)
    (define-key map "h" 'hyperfiler-navigate-previous)
    (define-key map "l" 'hyperfiler-navigate-next)
    (define-key map (kbd "C-n") 'hyperfiler-next-task)
    (define-key map (kbd "C-p") 'hyperfiler-previous-task)
    ;; Jump to current date/week/month
    (define-key map "0" 'hyperfiler-jump-to-current)
    (define-key map "B" 'hyperfiler-backup-data)
    (define-key map "R" 'hyperfiler-restore-from-backup)
    (define-key map "E" 'hyperfiler-export-all-lists-to-html)
    (define-key map "P" 'hyperfiler-batch-insert-notes-from-clipboard)
    (define-key map "I" 'hyperfiler-batch-insert-notes-from-region)
    map)
  "Keymap for HyperFiler mode.")

(define-derived-mode hyperfiler-mode special-mode "HyperFiler"
  "Major mode for HyperFiler task management.

\\{hyperfiler-mode-map}"
  (setq truncate-lines t))

;;; Debug and Reset Functions

(defun hyperfiler-reset-data ()
  "Reset all HyperFiler data and start fresh."
  (interactive)
  (when (y-or-n-p "This will delete all tasks, archives, and lists. Are you sure? ")
    (setq hyperfiler-tasks nil)
    (setq hyperfiler-archived-tasks nil)
    (setq hyperfiler-lists nil)
    (setq hyperfiler-list-archive nil)
    (setq hyperfiler-selected-task-indices nil)
    (clrhash hyperfiler-event-task-ids)
    (hyperfiler--save-tasks-to-local-storage)
    (hyperfiler--save-lists-to-storage)
    (message "All HyperFiler data has been reset")
    (hyperfiler-render-current-view)))

;;; Entry Point

;;;###autoload
(defun hyperfiler ()
  "Start HyperFiler task management system."
  (interactive)
  (hyperfiler-load-tasks-from-local-storage)
  ;; Delay file watchers to avoid interference during startup
  (run-with-timer 2.0 nil 'hyperfiler--setup-file-watchers)
  (hyperfiler--start-auto-update-timer)
  ;; Delay HTML generation to ensure tasks are loaded
  (run-with-timer 1.0 nil 'hyperfiler--auto-generate-all-html)
  (message "HyperFiler started! Tasks loaded: %d" (length hyperfiler-tasks))
  (hyperfiler-show-today-view))

(defun hyperfiler--start-auto-update-timer ()
  "Start the auto-update timer for moving past tasks and exporting HTML."
  (when hyperfiler-auto-update-timer
    (cancel-timer hyperfiler-auto-update-timer))
  (setq hyperfiler-auto-update-timer
        (run-with-timer 300 300 'hyperfiler-auto-update-today))) ; Every 5 minutes

(defun hyperfiler--stop-auto-update-timer ()
  "Stop the auto-update timer."
  (when hyperfiler-auto-update-timer
    (cancel-timer hyperfiler-auto-update-timer)
    (setq hyperfiler-auto-update-timer nil)))

(defun hyperfiler-cleanup ()
  "Clean up hyperfiler resources (timers, file watchers, and servers)."
  (interactive)
  (hyperfiler--stop-auto-update-timer)
  (hyperfiler--remove-file-watchers)
  (hyperfiler--stop-sync-server)
  (message "HyperFiler cleanup completed"))

;; Add cleanup hook when Emacs exits
(add-hook 'kill-emacs-hook 'hyperfiler-cleanup)

(provide 'hyperfiler)

;;; Test function for persistence
(defun hyperfiler-test-persistence ()
  "Test task persistence by creating tasks, saving, clearing memory, and reloading."
  (interactive)
  (message "=== Starting Task Persistence Test ===")
  
  ;; Step 1: Create test tasks
  (message "Step 1: Creating test tasks...")
  (let ((initial-count (length hyperfiler-tasks)))
    (hyperfiler-create-task 
     "Test Task 1" 
     "This is a note for task 1 - testing persistence"
     (hyperfiler--get-current-date)
     "09:00"
     nil
     nil)
    (hyperfiler-create-task 
     "Test Task 2" 
     "Another note here - with special chars: & < > \" '"
     (hyperfiler--get-current-date)
     "14:30"
     nil
     nil)
    (hyperfiler-create-task 
     "Test Event" 
     "This is an event with notes"
     (hyperfiler--get-current-date)
     "18:00"
     t  ; is-event
     nil)
    (let ((new-count (length hyperfiler-tasks)))
      (message "Created %d new tasks (total: %d)" (- new-count initial-count) new-count)))
  
  ;; Step 2: Display current tasks
  (message "\nStep 2: Current tasks in memory:")
  (dolist (task hyperfiler-tasks)
    (message "  - %s at %s%s" 
             (plist-get task :title)
             (plist-get task :dueTime)
             (if (plist-get task :notes) 
                 (format " (with note: %s)" 
                         (substring (plist-get task :notes) 0 
                                   (min 30 (length (plist-get task :notes)))))
               "")))
  
  ;; Step 3: Force save to disk
  (message "\nStep 3: Saving to disk...")
  (hyperfiler--save-tasks-to-local-storage)
  (message "Tasks saved to org file")
  
  ;; Step 4: Clear memory
  (message "\nStep 4: Clearing memory...")
  (setq hyperfiler-tasks nil)
  (setq hyperfiler-archived-tasks nil)
  (clrhash hyperfiler-event-task-ids)
  (message "Memory cleared. Tasks in memory: %d" (length hyperfiler-tasks))
  
  ;; Step 5: Reload from disk
  (message "\nStep 5: Reloading from disk...")
  (hyperfiler-load-tasks-from-local-storage)
  (message "Reload complete. Tasks in memory: %d" (length hyperfiler-tasks))
  
  ;; Step 6: Verify loaded tasks
  (message "\nStep 6: Verifying loaded tasks:")
  (let ((test-tasks (cl-remove-if-not 
                     (lambda (task) 
                       (string-prefix-p "Test" (plist-get task :title)))
                     hyperfiler-tasks)))
    (if test-tasks
        (progn
          (message "Found %d test tasks:" (length test-tasks))
          (dolist (task test-tasks)
            (message "  ✓ %s at %s%s%s" 
                     (plist-get task :title)
                     (plist-get task :dueTime)
                     (if (plist-get task :isEvent) " [EVENT]" "")
                     (if (plist-get task :notes) 
                         (format "\n    Note: %s" (plist-get task :notes))
                       ""))))
      (message "  ✗ NO TEST TASKS FOUND - Persistence failed!")))
  
  ;; Step 7: Refresh view
  (message "\n=== Test Complete ===")
  (hyperfiler-render-current-view)
  (message "Check the task view to verify all test tasks are displayed with their notes."))

;;; hyperfiler.el ends here