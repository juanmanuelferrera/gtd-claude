;; Emacs Dictation Setup for macOS
;; Add this to your ~/.emacs or ~/.emacs.d/init.el

;; Method 1: Simple AppleScript integration
(defun dictate-text ()
  "Use macOS dictation and insert the result at point"
  (interactive)
  (message "🎙️ Starting dictation...")
  (let ((result (do-applescript "
tell application \"System Events\"
    set oldClipboard to the clipboard
    keystroke \"fn\" using {fn down}
    delay 0.1
    keystroke \"fn\" using {fn down}
    delay 2
    keystroke \"c\" using {command down}
    delay 0.5
    set newText to the clipboard
    set the clipboard to oldClipboard
    return newText
end tell")))
    (when (and result (> (length result) 0))
      (insert result)
      (message "✅ Dictation inserted!"))))

;; Method 2: Shell command approach
(defun dictate-text-simple ()
  "Simple dictation using macOS shortcuts"
  (interactive)
  (message "🎙️ Speak now... (will open dictation)")
  (do-applescript "
tell application \"System Events\"
    keystroke \"fn\" using {fn down}
    delay 0.1
    keystroke \"fn\" using {fn down}
end tell"))

;; Method 3: Using osascript for dictation dialog
(defun dictate-text-dialog ()
  "Show dictation dialog and insert result"
  (interactive)
  (let ((text (shell-command-to-string "osascript -e 'tell app \"System Events\" to return text returned of (display dialog \"Dictation result:\" default answer \"\" buttons {\"Cancel\", \"Insert\"} default button \"Insert\")'")))
    (when (and text (not (string-match "User canceled" text)))
      (insert (string-trim text))
      (message "✅ Text inserted!"))))

;; Keybindings
(global-set-key (kbd "C-c d") 'dictate-text)
(global-set-key (kbd "C-c C-d") 'dictate-text-simple)
(global-set-key (kbd "C-c M-d") 'dictate-text-dialog)

;; Alternative: Use Cmd+Space for Spotlight, then type text
(defun spotlight-dictate ()
  "Open Spotlight for quick text entry"
  (interactive)
  (do-applescript "
tell application \"System Events\"
    keystroke space using {command down}
end tell"))

(global-set-key (kbd "C-c s") 'spotlight-dictate)