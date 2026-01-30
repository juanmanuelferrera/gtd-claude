/**
 * Task Management Module for HyperFiler Pro
 * Handles task creation, editing, deletion, and validation
 */

// Global task-related variables
let tasks = [];
let currentEditTaskId = null;
let undoStack = [];
let maxUndoSteps = 5;
let draggedTask = null;
let isSaving = false;

// VERSION 2: Event Registry System - Bulletproof Event preservation
let eventTaskIds = new Set(); // Tracks which tasks are Events

// Template Management
let customTemplates = [];

/**
 * Validate task data structure and sanitize inputs
 */
function validateTaskData(task) {
    if (!task || typeof task !== 'object') return null;
    
    return {
        id: task.id,
        title: sanitizeInput(task.title || ''),
        notes: sanitizeInput(task.notes || ''),
        images: task.images || [],
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        status: task.status,
        repeat: task.repeat,
        template: sanitizeInput(task.template || ''),
        isEvent: Boolean(task.isEvent),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
    };
}

/**
 * Event Registry Management Functions
 */
function loadEventRegistry() {
    try {
        const stored = localStorage.getItem('gtd_event_registry');
        if (stored) {
            eventTaskIds = new Set(JSON.parse(stored));
        }
    } catch (error) {
        console.error('Error loading Event Registry:', error);
        eventTaskIds = new Set();
    }
}

function saveEventRegistry() {
    try {
        localStorage.setItem('gtd_event_registry', JSON.stringify([...eventTaskIds]));
    } catch (error) {
        console.error('Error saving Event Registry:', error);
    }
}

function markAsEvent(taskId) {
    eventTaskIds.add(taskId);
    saveEventRegistry();
}

function unmarkAsEvent(taskId) {
    eventTaskIds.delete(taskId);
    saveEventRegistry();
}

function isRegisteredEvent(taskId) {
    return eventTaskIds.has(taskId);
}

/**
 * Post-download healing: Restore isEvent properties from registry
 */
function healEventProperties() {
    let healedCount = 0;
    tasks.forEach(task => {
        if (eventTaskIds.has(task.id) && !task.isEvent) {
            task.isEvent = true;
            healedCount++;
        }
    });
    
    if (healedCount > 0) {
        // Save healed tasks to localStorage
        saveTasksToLocalStorage();
    }
    
    return healedCount;
}

/**
 * Clean up registry: Remove deleted task IDs
 */
function cleanEventRegistry() {
    const taskIdSet = new Set(tasks.map(t => t.id));
    const originalSize = eventTaskIds.size;
    
    eventTaskIds = new Set([...eventTaskIds].filter(id => taskIdSet.has(id)));
    
    if (eventTaskIds.size !== originalSize) {
        saveEventRegistry();
    }
}

/**
 * Helper function to clean task objects and remove circular references
 */
function cleanTaskForStorage(task) {
    const cleanTask = {};
    
    // Copy only the essential properties we want to store
    const allowedProps = [
        'id', 'title', 'notes', 'dueDate', 'dueTime', 'status', 
        'repeatType', 'template', 'createdAt', 'updatedAt', 
        'isDeleted', 'isEvent', 'repeat', 'priority', 'images'
    ];
    
    allowedProps.forEach(prop => {
        if (task.hasOwnProperty(prop)) {
            // Sanitize string fields
            if (prop === 'title' || prop === 'notes' || prop === 'template') {
                cleanTask[prop] = sanitizeInput(task[prop]);
            } else {
                cleanTask[prop] = task[prop];
            }
        }
    });
    
    return cleanTask;
}

/**
 * Helper function to safely save tasks to localStorage
 */
function saveTasksToLocalStorage() {
    try {
        const cleanedTasks = tasks.map(task => cleanTaskForStorage(task));
        localStorage.setItem('gtdTasks', JSON.stringify(cleanedTasks));
    } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
        // Fallback: try to save with replacer to handle circular references
        try {
            const replacer = (key, value) => {
                if (key.startsWith('_') || typeof value === 'function') {
                    return undefined;
                }
                return value;
            };
            localStorage.setItem('gtdTasks', JSON.stringify(tasks, replacer));
        } catch (fallbackError) {
            console.error('Fallback save also failed:', fallbackError);
        }
    }
}

/**
 * SECURITY: Client-side input validation functions
 */
function validateTaskInput(input) {
    if (typeof input !== 'string') return null;
    
    // Remove dangerous content
    const cleaned = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .substring(0, 500) // Limit length
        .trim();
    
    return cleaned || null;
}

function validateTaskTitle(title) {
    const cleaned = validateTaskInput(title);
    return cleaned && cleaned.length > 0 && cleaned.length <= 200 ? cleaned : null;
}

function validateTaskNotes(notes) {
    if (!notes) return '';
    
    // For notes, we need to do our own validation without the 500 char limit
    if (typeof notes !== 'string') return '';
    
    // Remove dangerous content but don't limit length here
    const cleaned = notes
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .trim();
    
    // Check if notes contain images and adjust limit accordingly
    const hasImages = /\[IMG:\d+:data:image\//.test(cleaned);
    const maxLength = 50000; // 50,000 characters for notes
    
    // Apply the appropriate length limit
    if (cleaned.length > maxLength) {
        return cleaned.substring(0, maxLength);
    }
    
    return cleaned;
}

/**
 * Task completion animation
 */
function animateTaskCompletion(taskElement) {
    taskElement.style.animation = 'completeTask 0.4s ease-out forwards';
    setTimeout(() => {
        taskElement.style.display = 'none';
    }, 400);
}

/**
 * Load tasks from local storage
 */
function loadTasksFromLocalStorage() {
    try {
        const savedTasks = localStorage.getItem('gtdTasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            
            // Validate each task and filter out invalid ones
            tasks = parsedTasks
                .map(task => validateTaskData(task))
                .filter(task => task !== null);
            
            console.log(`📥 Loaded ${tasks.length} tasks from localStorage`);
            
            // CRITICAL: Sync to window.tasks for other modules
            window.tasks = tasks;
            console.log(`🔄 Synced ${tasks.length} tasks to window.tasks`);
            
            // Load and clean event registry
            loadEventRegistry();
            cleanEventRegistry();
            
            // Heal event properties from registry
            const healedCount = healEventProperties();
            if (healedCount > 0) {
                console.log(`🩹 Healed ${healedCount} event properties from registry`);
            }
        }
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        tasks = [];
        window.tasks = tasks; // Sync empty array to window
    }
}

/**
 * Quick add task with template
 */
function quickAddTaskWithTemplate(templateName) {
    console.log('Quick adding task with template:', templateName);
    
    // Create task for today with the template
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    const newTask = {
        id: Date.now().toString(),
        title: `@ ${templateName}`,
        notes: '',
        dueDate: todayStr,
        dueTime: null,
        status: 'pending',
        template: templateName,
        repeat: null,
        isEvent: false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    // Add task to array
    tasks.push(newTask);
    window.tasks = tasks; // Sync to window
    
    // Save to localStorage and server
    saveTasksToLocalStorage();
    saveTasks().then(() => {
        console.log('Task created with template:', templateName);
        renderCurrentView();
    }).catch(error => {
        console.error('Error saving task with template:', error);
    });
}

/**
 * Refresh a specific task card element in the DOM without full re-render
 */
function refreshTaskCardElement(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Find all task card elements with this ID (could be in multiple views)
    const taskCards = document.querySelectorAll(`[data-task-id="${taskId}"]`);

    taskCards.forEach(cardElement => {
        // Re-render the card using the existing renderTaskCard function
        if (typeof renderTaskCard === 'function') {
            const newCardHtml = renderTaskCard(task);
            // Create a temporary container to parse the HTML
            const temp = document.createElement('div');
            temp.innerHTML = newCardHtml;
            const newCard = temp.firstElementChild;

            if (newCard && cardElement.parentNode) {
                // Replace the old card with the new one
                cardElement.parentNode.replaceChild(newCard, cardElement);
                console.log('✅ Task card refreshed in DOM for:', task.title);
            }
        }
    });
}

/**
 * Update task date
 */
async function updateTaskDate(taskId, newDate, event) {
    console.log('🔄 updateTaskDate called with:', taskId, newDate);
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }

    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        console.log(`🔄 Updating task "${task.title}" date from "${task.dueDate}" to "${newDate}"`);

        // Save state for undo
        if (typeof saveStateForUndo === 'function') {
            saveStateForUndo('update date', task);
        }

        // Update task date
        task.dueDate = newDate || null;
        task.lastModified = new Date().toISOString();

        // Save to localStorage
        saveTasksToLocalStorage();

        // Re-render current view immediately for instant feedback
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }

        // Sync to cloud in background
        if (typeof uploadAllTasks === 'function') {
            uploadAllTasks();
        }

        console.log('✅ Task date updated successfully');
    } catch (error) {
        console.error('❌ Error updating task date:', error);
        showNotification('Failed to update task date', 'error');
    }
}

/**
 * Open date picker for task
 */
function openDatePicker(taskId, event) {
    event.stopPropagation();
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Store the task ID for the modal
    window.currentDateTimeTaskId = taskId;
    
    // Open the existing dateTimeModal
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        // Populate current values
        if (typeof populateDateTimeModal === 'function') {
            populateDateTimeModal(task.dueDate, task.dueTime);
        }
        modal.style.display = 'block';
    }
}

/**
 * Open time picker for task
 */
function openTimePicker(taskId, event) {
    event.stopPropagation();
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Store the task ID for the modal
    window.currentDateTimeTaskId = taskId;
    
    // Open the existing dateTimeModal
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        // Populate current values
        if (typeof populateDateTimeModal === 'function') {
            populateDateTimeModal(task.dueDate, task.dueTime);
        }
        modal.style.display = 'block';
    }
}

/**
 * Update task time
 */
async function updateTaskTime(taskId, newTime, event) {
    console.log('🔄 updateTaskTime called with:', taskId, newTime);
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }

    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        const timeDescription = newTime === '' ? 'untimed (no specific time)' : newTime;
        console.log(`🔄 Updating task "${task.title}" time from "${task.dueTime}" to "${timeDescription}"`);

        // Save state for undo
        if (typeof saveStateForUndo === 'function') {
            saveStateForUndo('update time', task);
        }

        // Update task time (empty string for untimed tasks)
        task.dueTime = newTime || null;

        // Save to localStorage
        saveTasks();

        // Re-render current view immediately for instant feedback
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }

        // Sync to cloud in background
        if (typeof uploadAllTasks === 'function') {
            uploadAllTasks();
        }

        console.log('✅ Task time updated successfully');
    } catch (error) {
        console.error('❌ Error updating task time:', error);
        showNotification('Failed to update task time', 'error');
    }
}

/**
 * Duplicate an existing task
 */
function duplicateTask(taskId, event) {
    event.stopPropagation();
    console.log('🔄 Duplicating task with ID:', taskId, typeof taskId);
    
    const task = tasks.find(t => t.id == taskId);
    if (!task) {
        console.error('❌ Task not found for ID:', taskId);
        return;
    }
    console.log('✅ Found task to duplicate:', task.title);
    
    const newTask = {
        ...task,
        id: Date.now(),
        title: task.title + ' (Copy)',
        status: 'pending',
        images: task.images ? [...task.images] : [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    // Add task directly to array and save
    tasks.push(newTask);
    window.tasks = tasks; // Sync to window
    saveTasksToLocalStorage();
    sortTasks();
    renderCurrentView();
    
    // Sync to cloud in background
    if (typeof uploadAllTasks === 'function') {
        uploadAllTasks().catch(error => {
            console.error('Background sync failed for duplicated task:', error);
        });
    }
    
    console.log('✅ Task duplicated successfully:', newTask.title);
}

/**
 * Edit an existing task
 */
function editTask(taskId, event) {
    console.log('🔄 editTask called with taskId:', taskId);
    if (event) event.stopPropagation();
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.log('❌ Task not found with id:', taskId);
        console.log('Available task IDs:', tasks.map(t => t.id));
        return;
    }
    console.log('✅ Found task:', task);
    
    window.currentEditTaskId = taskId;
    currentEditTaskId = taskId;
    
    // Reset manual time flag when opening edit modal
    window.manualTimeSet = false;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskIsEvent').checked = task.isEvent || false;
    
    // Handle both old format (images in notes) and new format (separate images property)
    if (task.images && task.images.length > 0) {
        // New format: images stored separately
        console.log('📷 Loading images from task.images property:', task.images.length);
        if (typeof noteImagesData !== 'undefined') {
            noteImagesData = [...task.images]; // Copy to avoid mutations
        }
        document.getElementById('editTaskNotes').value = task.notes || '';
    } else if (task.notes && /\[IMG:\d+:data:image\//.test(task.notes)) {
        // Old format: images embedded in notes - parse them out
        console.log('📷 Converting old format: images found in notes');
        if (typeof parseImagesFromNotes === 'function') {
            const parsed = parseImagesFromNotes(task.notes);
            if (typeof noteImagesData !== 'undefined') {
                noteImagesData = parsed.images;
            }
            document.getElementById('editTaskNotes').value = parsed.text;
        }
    } else {
        // No images
        if (typeof noteImagesData !== 'undefined') {
            noteImagesData = [];
        }
        document.getElementById('editTaskNotes').value = task.notes || '';
    }
    
    if (typeof displayNoteImages === 'function') {
        displayNoteImages();
    }
    
    // Set repeat dropdown - allow editing for existing tasks
    const repeatDropdown = document.getElementById('editTaskRepeat');
    if (repeatDropdown) {
        repeatDropdown.value = task.repeat || 'none';
        repeatDropdown.disabled = false;
        repeatDropdown.style.opacity = '1';
    }
    
    // Set date and time inputs - only set if task has a date
    document.getElementById('editTaskDateOnly').value = task.dueDate || '';
    document.getElementById('editTaskTimeOnly').value = task.dueTime || '';
    
    // Also update the main date/time fields
    document.getElementById('editTaskDate').value = task.dueDate || '';
    document.getElementById('editTaskTime').value = task.dueTime || '';
    
    // Update display and hidden fields
    if (typeof updateDateTimeDisplay === 'function') {
        updateDateTimeDisplay();
    }
    
    // Set modal title for editing
    const modalTitle = document.querySelector('#taskModal h3');
    if (modalTitle) {
        modalTitle.textContent = '✏️ Edit Task';
        console.log('Modal title set to: Edit Task');
    } else {
        console.log('Modal title element not found');
    }
    
    // Load and render templates
    renderTemplateButtons();
    
    // Only prepopulate when adding new task (not editing)
    if (!currentEditTaskId) {
        if (typeof populateTimeOptions === 'function') {
            populateTimeOptions();
        }
    } else {
        // Just update display for existing task
        if (typeof updateDateTimeDisplay === 'function') {
            updateDateTimeDisplay();
        }
    }
    
    document.getElementById('taskModal').style.display = 'block';
    
    // Set auto-close timer for 6 seconds
    if (typeof setTaskModalTimeout === 'function') {
        setTaskModalTimeout();
    }
    
    // Reinitialize natural language processing for this modal instance
    setTimeout(() => {
        if (typeof initializeNaturalLanguageProcessing === 'function') {
            initializeNaturalLanguageProcessing();
        }
    }, 50);
    
    // Position cursor at end of title text plus a space when editing
    if (currentEditTaskId) {
        setTimeout(() => {
            const titleInput = document.getElementById('editTaskTitle');
            if (titleInput && titleInput.value) {
                // Set cursor at the end for editing existing tasks
                titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
                titleInput.focus();
            }
        }, 150);
    }
    
    // Scroll page down to ensure modal is visible
    window.scrollTo({
        top: 120,
        behavior: 'smooth'
    });
    
    // Add Enter key listener for saving task
    const modalElement = document.getElementById('taskModal');
    const handleEnterKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Enter pressed in add task modal');
            
            // Prevent multiple rapid saves
            if (window.modalSaving) {
                console.log('⚠️ Modal already saving, ignoring Enter');
                return;
            }
            
            window.modalSaving = true;
            saveTaskEdit().finally(() => {
                setTimeout(() => {
                    window.modalSaving = false;
                }, 500);
            });
        }
    };
    
    // Remove any existing listener and add new one
    modalElement.removeEventListener('keydown', handleEnterKey);
    modalElement.addEventListener('keydown', handleEnterKey);
    
    // Focus the title field and position cursor at the beginning
    setTimeout(() => {
        const titleField = document.getElementById('editTaskTitle');
        if (titleField) {
            titleField.focus();
            titleField.setSelectionRange(0, 0); // Position cursor at beginning
        }
    }, 100); // Small delay to ensure modal is fully displayed
}

/**
 * Close task modal
 */
function closeTaskModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('taskModal').style.display = 'none';
    currentEditTaskId = null;
}

/**
 * Delete a task from the modal
 */
async function deleteTaskFromModal() {
    if (!currentEditTaskId) return;
    
    const task = tasks.find(t => t.id === currentEditTaskId);
    if (!task) return;
    
    // Delete directly without confirmation when in modal
    try {
        console.log(`Deleting single task instance with ID: ${currentEditTaskId}`);
        console.log(`Task title: ${task.title}`);
        
        // Store task for undo before deletion
        const taskToDelete = {...task};
        
        // Mark task as deleted (tombstone pattern for sync)
        const taskIndex = tasks.findIndex(t => t.id === currentEditTaskId);
        if (taskIndex >= 0) {
            tasks[taskIndex].isDeleted = true;
            tasks[taskIndex].status = 'deleted';
            tasks[taskIndex].deletedAt = new Date().toISOString();
            tasks[taskIndex].updatedAt = new Date().toISOString();
            console.log('🗑️ Task marked as deleted (tombstone):', currentEditTaskId);
        } else {
            throw new Error('Task not found in array');
        }
        
        // Save to localStorage immediately
        localStorage.setItem('gtdTasks', JSON.stringify(tasks));
        
        // Direct upload like Lists
        window.justModifiedTasks = true;
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
        }
        
        // Clear flag
        setTimeout(() => {
            window.justModifiedTasks = false;
            console.log('🔓 Cleared justModifiedTasks flag');
        }, 5000);
        
        // Move to trash
        if (typeof moveToTrash === 'function') {
            moveToTrash(taskToDelete);
        }
        
        closeTaskModal();
        
        // Force refresh the current view
        console.log('Refreshing view after deletion, current view:', currentView);
        const preservedView = currentView;
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        
        if (currentView === 'search') {
            // Re-run search to update results
            if (typeof performSearch === 'function') {
                performSearch();
            }
        } else {
            if (typeof showView === 'function') {
                showView(preservedView); // Use preserved view to stay in current view
            }
        }
        
        console.log('✅ Task deleted successfully from modal');
        
    } catch (error) {
        console.error('❌ Error deleting task from modal:', error);
        if (window.toast) {
            toast.error('Failed to delete task. Please try again.');
        } else {
            alert('Error deleting task. Please try again.');
        }
    }
}

/**
 * Save task edit (create or update)
 */
async function saveTaskEdit() {
    console.log('💾 saveTaskEdit function called');
    if (isSaving) {
        console.log('⚠️ Already saving, preventing duplicate');
        return; // Already saving, prevent duplicate
    }
    isSaving = true;
    
    try {
        console.log('💾 Getting form data...');
        // Get form data and sanitize inputs
        let title = sanitizeInput(document.getElementById('editTaskTitle').value.trim());
        const notes = sanitizeInput(document.getElementById('editTaskNotes').value.trim());
        const images = typeof noteImagesData !== 'undefined' ? [...noteImagesData] : []; // Copy current images
        const isEvent = document.getElementById('editTaskIsEvent').checked;
        const repeatType = document.getElementById('editTaskRepeat').value;
        
        // Skip natural language parsing to preserve templates
        // Templates should remain in the title field
        console.log('💾 Preserving templates in title:', title);
        
        
        if (!title) {
            console.log('❌ No title provided');
            if (window.toast) {
                toast.warning('Please enter a task title');
            } else {
                alert('Please enter a task title');
            }
            isSaving = false;
            return;
        }
        
        // Handle date and time inputs
        const dateValue = document.getElementById('editTaskDateOnly').value;
        const timeValue = document.getElementById('editTaskTimeOnly').value;
        
        // If no date provided, use today's date for new tasks
        const dueDate = dateValue || (currentEditTaskId ? null : getLocalDateString(new Date()));
        const dueTime = timeValue || null;
        
        if (currentEditTaskId) {
            // Editing existing task
            const task = tasks.find(t => t.id === currentEditTaskId);
            if (!task) {
                isSaving = false;
                return;
            }
            
            // If adding repeat to existing task, convert to repeat series
            if (repeatType && repeatType !== 'none' && dueDate && (!task.repeat || task.repeat === 'none')) {
                console.log('🔄 Converting single task to repeat series');
                
                // Remove the original single task
                tasks = tasks.filter(t => t.id !== currentEditTaskId);
                
                // Create repeat series using same logic as new tasks
                const tasksToCreate = [];
                const startDate = new Date(dueDate);
                
                const baseId = Date.now();
                let iterations, incrementDays;
                
                switch (repeatType) {
                    case 'daily':
                        iterations = 30; // 30 days
                        incrementDays = 1;
                        break;
                    case 'weekly':
                    case 'weekly-3months':
                        iterations = 8; // 2 months
                        incrementDays = 7;
                        break;
                    case 'biweekly':
                    case 'biweekly-6months':
                        iterations = 6; // 3 months
                        incrementDays = 14;
                        break;
                    case 'monthly':
                        iterations = 6; // 6 months
                        incrementDays = 30;
                        break;
                    case 'yearly':
                    case 'annual-5years':
                        iterations = 3; // 3 years
                        incrementDays = 365;
                        break;
                    default:
                        iterations = 1;
                        incrementDays = 0;
                }
                
                for (let i = 0; i < iterations; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + (i * incrementDays));
                    
                    // Stop if we've reached the end of time reasonably
                    if (currentDate.getFullYear() > new Date().getFullYear() + 10) break;
                    
                    const taskId = (baseId + i).toString();
                    const newTask = {
                        id: taskId,
                        title: title,
                        notes: notes,
                        images: images,
                        dueDate: getLocalDateString(currentDate),
                        dueTime: dueTime,
                        status: 'pending',
                        repeat: repeatType,
                        isEvent: isEvent,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    tasksToCreate.push(newTask);
                    
                    // Register as Event if needed
                    if (isEvent) {
                        markAsEvent(taskId);
                    }
                }
                
                // Add all new tasks
                tasks.push(...tasksToCreate);
                console.log(`✅ Created ${tasksToCreate.length} repeat instances`);
                
            } else {
                // Regular task update
                task.title = title;
                task.notes = notes;
                task.images = images;
                task.dueDate = dueDate;
                task.dueTime = dueTime;
                task.isEvent = isEvent;
                task.repeat = repeatType;
                task.updatedAt = new Date().toISOString();
                
                // Update Event registry
                if (isEvent) {
                    markAsEvent(task.id);
                } else {
                    unmarkAsEvent(task.id);
                }
                
                console.log('✅ Updated existing task:', task.title);
            }
            
        } else {
            // Creating new task
            const taskId = Date.now().toString();
            
            if (repeatType && repeatType !== 'none' && dueDate) {
                // Create repeat series
                const startDate = new Date(dueDate);
                const baseId = Date.now();
                let iterations, incrementDays;
                
                switch (repeatType) {
                    case 'daily':
                        iterations = 30;
                        incrementDays = 1;
                        break;
                    case 'weekly':
                    case 'weekly-3months':
                        iterations = 8;
                        incrementDays = 7;
                        break;
                    case 'biweekly':
                    case 'biweekly-6months':
                        iterations = 6;
                        incrementDays = 14;
                        break;
                    case 'monthly':
                        iterations = 6;
                        incrementDays = 30;
                        break;
                    case 'yearly':
                    case 'annual-5years':
                        iterations = 3;
                        incrementDays = 365;
                        break;
                    default:
                        iterations = 1;
                        incrementDays = 0;
                }
                
                const tasksToCreate = [];
                for (let i = 0; i < iterations; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + (i * incrementDays));
                    
                    if (currentDate.getFullYear() > new Date().getFullYear() + 10) break;
                    
                    const newTaskId = (baseId + i).toString();
                    const newTask = {
                        id: newTaskId,
                        title: title,
                        notes: notes,
                        images: images,
                        dueDate: getLocalDateString(currentDate),
                        dueTime: dueTime,
                        status: 'pending',
                        repeat: repeatType,
                        isEvent: isEvent,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    tasksToCreate.push(newTask);
                    
                    if (isEvent) {
                        markAsEvent(newTaskId);
                    }
                }
                
                tasks.push(...tasksToCreate);
                console.log(`✅ Created ${tasksToCreate.length} new repeat instances`);
                
            } else {
                // Single task
                const newTask = {
                    id: taskId,
                    title: title,
                    notes: notes,
                    images: images,
                    dueDate: dueDate,
                    dueTime: dueTime,
                    status: 'pending',
                    repeat: repeatType || 'none',
                    isEvent: isEvent,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                tasks.push(newTask);
                window.tasks = tasks; // Sync to window
                
                if (isEvent) {
                    markAsEvent(taskId);
                }
                
                console.log('✅ Created new single task:', newTask.title);
            }
        }
        
        // Save to localStorage immediately
        saveTasksToLocalStorage();
        
        // Close modal and refresh UI
        closeTaskModal();
        
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
        
        // Sync to cloud in background
        window.justModifiedTasks = true;
        if (typeof uploadAllTasks === 'function') {
            setTimeout(async () => {
                try {
                    await uploadAllTasks();
                    console.log('✅ Task changes synced to cloud');
                } catch (error) {
                    console.error('❌ Error syncing task changes:', error);
                }
            }, 100);
        }
        
        // Clear flag
        setTimeout(() => {
            window.justModifiedTasks = false;
        }, 10000);

        console.log('✅ Task saved successfully');


    } catch (error) {
        console.error('❌ Error saving task:', error);
        if (window.toast) {
            toast.error('Failed to save task. Please try again.');
        } else {
            alert('Error saving task. Please try again.');
        }
    } finally {
        isSaving = false;
    }
}

/**
 * Open add task modal
 */
function openAddTaskModal(dateStr) {
    // Use the existing openAddTaskModal function logic but allow optional date
    currentEditTaskId = null;
    
    // Clear form fields
    const titleField = document.getElementById('editTaskTitle');
    const notesField = document.getElementById('editTaskNotes');
    const eventCheckbox = document.getElementById('editTaskIsEvent');
    
    if (titleField) titleField.value = '';
    if (notesField) notesField.value = '';
    if (eventCheckbox) eventCheckbox.checked = false;
    
    // Clear images
    if (typeof noteImagesData !== 'undefined') {
        noteImagesData = [];
    }
    if (typeof displayNoteImages === 'function') {
        displayNoteImages();
    }
    
    // Set date - use provided date or today
    const targetDate = dateStr || getLocalDateString(new Date());
    const dateOnlyField = document.getElementById('editTaskDateOnly');
    const timeOnlyField = document.getElementById('editTaskTimeOnly');
    const dateField = document.getElementById('editTaskDate');
    const timeField = document.getElementById('editTaskTime');
    
    if (dateOnlyField) dateOnlyField.value = targetDate;
    if (timeOnlyField) timeOnlyField.value = '';
    if (dateField) dateField.value = targetDate;
    if (timeField) timeField.value = '';
    
    // Update the date/time display button
    updateDateTimeDisplay();
    
    // Set modal title for adding
    const modalTitle = document.querySelector('#taskModal h3');
    if (modalTitle) {
        modalTitle.textContent = '➕ Add Task';
    }
    
    // Load and render templates
    if (typeof renderTemplateButtons === 'function') {
        renderTemplateButtons();
    }
    
    // Reset repeat dropdown
    const repeatDropdown = document.getElementById('editTaskRepeat');
    if (repeatDropdown) {
        repeatDropdown.value = 'none';
        repeatDropdown.disabled = false;
        repeatDropdown.style.opacity = '1';
    }
    
    // Show modal
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Set auto-close timer
    if (typeof setTaskModalTimeout === 'function') {
        setTaskModalTimeout();
    }
    
    // Initialize natural language processing
    setTimeout(() => {
        if (typeof initializeNaturalLanguageProcessing === 'function') {
            initializeNaturalLanguageProcessing();
        }
    }, 50);
    
    // Auto-focus title field
    setTimeout(() => {
        const titleInput = document.getElementById('editTaskTitle');
        if (titleInput) {
            titleInput.focus();
        }
    }, 100);
}

/**
 * Template Management Functions
 */
function loadTemplates() {
    console.log('🔄 [ULTRA-DEBUG] loadTemplates called from tasks.js');
    const saved = localStorage.getItem('gtdTemplates');
    console.log('🔄 [ULTRA-DEBUG] localStorage gtdTemplates value:', saved);
    console.log('🔄 [ULTRA-DEBUG] localStorage gtdTemplates type:', typeof saved);
    console.log('🔄 [ULTRA-DEBUG] saved !== null:', saved !== null);
    
    if (saved !== null) {
        // Templates have been saved before (could be empty array if user deleted all)
        try {
            customTemplates = JSON.parse(saved);
            console.log('🔄 [ULTRA-DEBUG] Parsed templates from localStorage:', customTemplates);
            console.log('🔄 [ULTRA-DEBUG] customTemplates length:', customTemplates.length);
        } catch (error) {
            console.error('🔄 [ULTRA-DEBUG] Error parsing templates:', error);
            customTemplates = [];
        }
    } else {
        // First time - no templates saved yet, use defaults
        console.log('🔄 [ULTRA-DEBUG] No templates in localStorage, using defaults');
        customTemplates = ['@casa', '@recados', '@vedicvault', '@facebook', '@theonething'];
    }
    
    // Sync to window.customTemplates
    window.customTemplates = customTemplates;
    console.log('🔄 [ULTRA-DEBUG] Synced to window.customTemplates:', window.customTemplates);
    console.log('🔄 [ULTRA-DEBUG] Final customTemplates:', customTemplates);
    
    renderTemplateButtons();
    console.log('🔄 [ULTRA-DEBUG] loadTemplates completed');
}

async function saveTemplates() {
    localStorage.setItem('gtdTemplates', JSON.stringify(customTemplates));
    
    // Set flag to prevent downloads from overwriting changes
    window.justModifiedTemplates = true;
    
    // Upload to server
    if (typeof uploadAllTemplates === 'function') {
        await uploadAllTemplates();
    }
    
    // Clear flag after successful upload
    setTimeout(() => {
        window.justModifiedTemplates = false;
        console.log('🔓 Cleared justModifiedTemplates flag');
    }, 10000); // 10-second protection
}

function renderTemplateButtons() {
    console.log('🔧 renderTemplateButtons called - DEBUGGING');
    console.log('📋 customTemplates array:', customTemplates);
    console.log('📋 customTemplates length:', customTemplates.length);
    
    const container = document.getElementById('templateButtons');
    if (!container) {
        console.log('❌ templateButtons container not found');
        return;
    }
    
    console.log('✅ templateButtons container found:', container);
    container.innerHTML = '';
    
    console.log('🎨 Rendering templates:', customTemplates);
    customTemplates.forEach((template, index) => {
        console.log(`🔄 Processing template ${index + 1}/${customTemplates.length}: "${template}"`);
        console.log('🎨 Rendering template button:', template, 'includes @:', template.includes('@'));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-btn';
        button.textContent = template;
        button.title = `Left-click to add "${template}" to task • Right-click or long-press to delete`;
        
        let touchStartTime = 0;
        let touchTimer = null;
        let touchHandled = false;
        
        // Touch start for mobile long-press
        button.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchHandled = false;
            touchTimer = setTimeout(async () => {
                // Long press detected - show delete option
                e.preventDefault();
                touchHandled = true;
                button.classList.add('deleting');
                if (confirm(`Delete template "${template}"?`)) {
                    await deleteTemplate(template);
                } else {
                    button.classList.remove('deleting');
                }
            }, 800); // 800ms long press
        });
        
        // Touch end to cancel long-press timer
        button.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 800 && !touchHandled) {
                // Short tap - insert template
                e.preventDefault(); // Prevent the click event from firing
                touchHandled = true;
                console.log('👆 Touch: inserting template:', template);
                insertTemplateToTask(template);
            }
            button.classList.remove('deleting');
        });
        
        // Left click: insert template (for desktop)
        button.addEventListener('click', (e) => {
            // Only handle if not already handled by touch
            if (!touchHandled) {
                console.log('🖱️ Click: inserting template:', template);
                insertTemplateToTask(template);
            }
            touchHandled = false; // Reset for next interaction
        });
        
        // Right click: delete template (for desktop)
        button.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            if (confirm(`Delete template "${template}"?`)) {
                await deleteTemplate(template);
            }
        });
        
        console.log(`➕ Adding button for template "${template}" to container`);
        container.appendChild(button);
        console.log(`✅ Button added. Container now has ${container.children.length} buttons`);
    });
    
    console.log(`🏁 Template buttons rendered. Container has ${container.children.length} buttons before adding "Add" button`);
    
    // Add new template button
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'template-btn add-template';
    addButton.textContent = '+ Add';
    addButton.title = 'Add new template';
    addButton.addEventListener('click', createNewTemplate);
    
    console.log('➕ Adding "Add" button to container');
    container.appendChild(addButton);
    console.log(`🏁 renderTemplateButtons completed. Final button count: ${container.children.length}`);
    console.log('🔍 Final container children:', Array.from(container.children).map(btn => btn.textContent));
}

function insertTemplateToTask(template) {
    console.log('🏷️ [tasks.js] insertTemplateToTask called with:', template);
    const titleInput = document.getElementById('editTaskTitle');
    const notesInput = document.getElementById('editTaskNotes');
    
    // Check which element has focus
    const activeElement = document.activeElement;
    console.log('🎯 Active element:', activeElement?.id || 'none');
    
    // Always insert into notes field for templates
    if (notesInput) {
        const currentNotes = notesInput.value.trim();
        console.log('📝 Current notes value:', currentNotes);
        
        // Add template to notes, inline with spaces
        if (currentNotes) {
            notesInput.value = currentNotes + ' ' + template;
            console.log('✅ Appended template to notes');
        } else {
            notesInput.value = template;
            console.log('✅ Set template as notes');
        }
        
        console.log('📍 New notes value:', notesInput.value);
        
        // Ensure focus stays on notes input
        notesInput.focus();
        notesInput.setSelectionRange(notesInput.value.length, notesInput.value.length);
        
        // Trigger change event for any listeners
        notesInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('🎯 Templates added to notes field inline');
    } else {
        console.error('❌ editTaskNotes input not found');
    }
}

async function deleteTemplate(template) {
    customTemplates = customTemplates.filter(t => t !== template);
    // SYNC FIX: Also update window.customTemplates for renderTemplateButtons  
    if (typeof window.customTemplates !== 'undefined') {
        window.customTemplates = window.customTemplates.filter(t => t !== template);
        console.log('🔄 Synced deletion to window.customTemplates:', window.customTemplates.length);
    }
    await saveTemplates();
    renderTemplateButtons();
}

async function createNewTemplate() {
    const template = prompt('Enter new template:');
    if (template && template.trim()) {
        const cleanTemplate = template.trim();
        if (!customTemplates.includes(cleanTemplate)) {
            customTemplates.push(cleanTemplate);
            await saveTemplates();
            renderTemplateButtons();
        } else {
            if (window.toast) {
                toast.warning('Template already exists');
            } else {
                alert('Template already exists!');
            }
        }
    }
}

async function addNewTemplate() {
    console.log('🎯 addNewTemplate called');
    const input = document.getElementById('newTemplateInput');
    if (!input) {
        console.error('❌ newTemplateInput not found');
        return;
    }
    
    let template = input.value.trim();
    console.log('📝 Input value:', template);
    
    if (!template) {
        console.log('⚠️ Empty template, returning');
        return;
    }
    
    if (!template.startsWith('@')) {
        template = '@' + template;
    }
    console.log('🏷️ Template with @ prefix:', template);
    
    template = template.replace(/\s/g, '');
    console.log('🏷️ Template after removing spaces:', template);
    
    console.log('📋 Current templates:', customTemplates);
    if (customTemplates.includes(template)) {
        console.log('⚠️ Template already exists');
        if (window.toast) {
            toast.warning('Template already exists');
        } else {
            alert('Template already exists');
        }
        return;
    }
    
    console.log('➕ Adding template to array');
    customTemplates.push(template);
    // SYNC FIX: Also update window.customTemplates for renderTemplateButtons
    if (typeof window.customTemplates !== 'undefined') {
        window.customTemplates.push(template);
        console.log('🔄 Synced to window.customTemplates:', window.customTemplates.length);
    }
    console.log('📋 Updated templates:', customTemplates);
    
    console.log('💾 Saving templates...');
    await saveTemplates();
    
    console.log('🎨 Rendering template buttons...');
    renderTemplateButtons();
    
    console.log('✅ Template added successfully:', template);
    console.log('📋 Final templates array:', customTemplates);
    
    // Verify the button was added to DOM
    setTimeout(() => {
        const container = document.getElementById('templateButtons');
        if (container) {
            console.log('🔍 Container buttons count:', container.children.length);
            console.log('🔍 Container HTML:', container.innerHTML.substring(0, 200));
        }
    }, 100);
    
    input.value = '';
    input.focus();
}

window.addNewTemplate = addNewTemplate;

/**
 * Save state for undo functionality
 */
function saveStateForUndo(action, task = null) {
    const state = {
        action: action,
        tasks: JSON.parse(JSON.stringify(tasks)), // Deep copy
        timestamp: Date.now(),
        task: task ? JSON.parse(JSON.stringify(task)) : null
    };
    
    undoStack.push(state);
    
    // Limit undo stack size
    if (undoStack.length > maxUndoSteps) {
        undoStack.shift();
    }
}

/**
 * Task completion toggle
 */
function toggleTaskComplete(taskId, event) {
    if (event) event.stopPropagation();
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Save state for undo
    saveStateForUndo('toggle_complete', task);
    
    // If task is pending, move to trash instead of marking complete
    if (task.status === 'pending') {
        // Move to trash
        task.status = 'deleted';
        task.deletedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        
        // Animate completion before removal
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            animateTaskCompletion(taskElement);
        }
    } else if (task.status === 'deleted') {
        // Restore from trash
        task.status = 'pending';
        task.deletedAt = null;
        task.updatedAt = new Date().toISOString();
    }
    
    // Save and sync
    saveTasksToLocalStorage();
    
    if (typeof sortTasks === 'function') {
        sortTasks();
    }
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
    
    // Background sync
    window.justModifiedTasks = true;
    if (typeof uploadAllTasks === 'function') {
        setTimeout(async () => {
            try {
                await uploadAllTasks();
            } catch (error) {
                console.error('Background sync failed:', error);
            }
        }, 100);
    }
    
    setTimeout(() => {
        window.justModifiedTasks = false;
    }, 5000);
}

/**
 * Toggle task status (alias for toggleTaskComplete)
 */
function toggleTaskStatus(taskId, event) {
    return toggleTaskComplete(taskId, event);
}

/**
 * Delete task permanently
 */
async function deleteTask(taskId, event) {
    if (event) event.stopPropagation();
    
    console.log('🗑️ PERMANENT DELETE: Deleting task', taskId);
    
    try {
        // Find the task before deletion for debugging
        const taskToDelete = tasks.find(t => t.id === taskId);
        console.log('🗑️ Task to delete:', taskToDelete);
        
        // Mark task as deleted (tombstone pattern for sync)
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            // Move to trash before marking as deleted if function exists
            if (typeof moveToTrash === 'function') {
                moveToTrash({...tasks[taskIndex]});
            }

            // Mark as deleted instead of removing (tombstone for sync)
            tasks[taskIndex].isDeleted = true;
            tasks[taskIndex].status = 'deleted';
            tasks[taskIndex].deletedAt = new Date().toISOString();
            tasks[taskIndex].updatedAt = new Date().toISOString();
            console.log('🗑️ Task marked as deleted (tombstone):', taskId);
        } else {
            console.error('🗑️ ERROR: Task not found in array:', taskId);
            return;
        }
        
        // Save updated tasks to localStorage
        saveTasksToLocalStorage();
        console.log('🗑️ Updated localStorage, new task count:', tasks.length);
        
        // Delete from server if function exists
        if (typeof deleteTaskFromCloud === 'function') {
            try {
                await deleteTaskFromCloud(taskId);
                console.log('✅ Task successfully deleted from server:', taskId);
            } catch (serverError) {
                console.error('❌ Failed to delete from server:', serverError);
                // Continue with local deletion even if server deletion fails
            }
        }
        
        // Clean up event registry if functions exist
        if (typeof unmarkAsEvent === 'function') {
            unmarkAsEvent(taskId);
        }
        
        // Update UI immediately
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }


        // Background sync
        window.justModifiedTasks = true;
        setTimeout(async () => {
            if (typeof uploadAllTasks === 'function') {
                try {
                    await uploadAllTasks();
                } catch (error) {
                    console.error('Background sync failed for deletion:', error);
                }
            }
        }, 100);
        
        setTimeout(() => {
            window.justModifiedTasks = false;
        }, 5000);
        
    } catch (error) {
        console.error('🗑️ Error deleting task:', error);
        if (window.toast) {
            toast.error('Failed to delete task. Please try again.');
        } else {
            alert('❌ Error deleting task. Please try again.');
        }
    }
}

/**
 * Delay task by specified number of days
 */
async function delayTask(taskId, days, event) {
    if (event) event.stopPropagation();
    
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }
        
        // Save state for undo before change
        saveStateForUndo('delay task', task);
        
        // Calculate new date
        const currentDate = task.dueDate ? new Date(task.dueDate) : new Date();
        const newDate = new Date(currentDate);
        
        // Handle month addition properly for +1M button (30 days = 1 month)
        if (days === 30) {
            // Add 1 month properly
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            // Add days for +1D (1 day) and +1W (7 days)
            newDate.setDate(newDate.getDate() + days);
        }
        
        // Update task
        task.dueDate = getLocalDateString(newDate);
        task.updatedAt = new Date().toISOString();
        
        // Save to localStorage
        saveTasksToLocalStorage();
        
        // Update UI
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }


        // Background sync
        window.justModifiedTasks = true;
        setTimeout(async () => {
            if (typeof uploadAllTasks === 'function') {
                try {
                    await uploadAllTasks();
                } catch (error) {
                    console.error('Background sync failed for delay:', error);
                }
            }
        }, 100);
        
        setTimeout(() => {
            window.justModifiedTasks = false;
        }, 5000);
        
    } catch (error) {
        console.error('Error delaying task:', error);
        if (window.toast) {
            toast.error('Failed to delay task. Please try again.');
        } else {
            alert('❌ Error delaying task. Please try again.');
        }
    }
}

/**
 * Sort tasks array
 */
function sortTasks() {
    tasks.sort((a, b) => {
        // First, prioritize by completion status (pending first)
        if (a.status !== b.status) {
            return a.status === 'completed' ? 1 : -1;
        }
        
        // Then by date (earlier dates first)
        if (a.dueDate !== b.dueDate) {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        }
        
        // Then by time (earlier times first)
        if (a.dueTime !== b.dueTime) {
            if (!a.dueTime) return 1;
            if (!b.dueTime) return -1;
            return a.dueTime.localeCompare(b.dueTime);
        }
        
        // Finally by creation date (newer first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

// Export functions to window for external access
window.editTask = editTask;
window.openEditTaskModal = editTask; // Alias for compatibility