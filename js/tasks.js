/**
 * Task Management Module for HyperFiler Pro
 * Handles task creation, editing, deletion, and validation
 */

// Global task-related variables
let tasks = [];
let currentEditTaskId = null;
let undoStack = [];
let maxUndoSteps = 10;
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
 * Update task date
 */
async function updateTaskDate(taskId, newDate, event) {
    console.log('🔄 updateTaskDate called with:', taskId, newDate);
    event.stopPropagation();
    
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
        
        // Save to server
        await saveTasks();
        
        // Re-render current view to reposition the task
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
        
        console.log('✅ Task date updated and repositioned successfully');
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
    event.stopPropagation();
    
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
        
        // Save to server
        await saveTasks();
        
        // Re-render current view to reposition the task if needed
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
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
    saveTasksToLocalStorage();
    sortTasks();
    renderCurrentView();
    
    // Sync to cloud in background
    if (typeof uploadAllTasks === 'function') {
        uploadAllTasks([{
            type: 'create',
            task: cleanTaskForStorage(newTask)
        }]).catch(error => {
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
    
    // Set date and time inputs
    if (task.dueDate) {
        document.getElementById('editTaskDateOnly').value = task.dueDate;
        document.getElementById('editTaskTimeOnly').value = task.dueTime || '';
    } else {
        document.getElementById('editTaskDateOnly').value = '';
        document.getElementById('editTaskTimeOnly').value = '';
    }
    
    // Update display and hidden fields
    if (typeof updateDateTimeDisplay === 'function') {
        updateDateTimeDisplay();
    }
    document.getElementById('editTaskDate').value = task.dueDate || '';
    document.getElementById('editTaskTime').value = task.dueTime || '';
    
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
        
        // Count tasks before deletion for verification
        const beforeCount = tasks.length;
        const beforeRepeatCount = tasks.filter(t => t.title === task.title).length;
        
        // Remove ONLY the specific task ID from local array
        tasks = tasks.filter(t => t.id !== currentEditTaskId);
        
        // Count tasks after deletion for verification
        const afterCount = tasks.length;
        const afterRepeatCount = tasks.filter(t => t.title === task.title).length;
        
        console.log(`Tasks before deletion: ${beforeCount}, after: ${afterCount}`);
        console.log(`Repeat instances before: ${beforeRepeatCount}, after: ${afterRepeatCount}`);
        
        // Verify only one task was deleted
        const deletedCount = beforeCount - afterCount;
        if (deletedCount !== 1) {
            throw new Error(`Expected to delete 1 task, but deleted ${deletedCount} tasks`);
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
        alert('Error deleting task. Please try again.');
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
        
        // Apply natural language parsing to clean up title one final time
        if (typeof parseNaturalLanguage === 'function') {
            const parsed = parseNaturalLanguage(title);
            if (parsed) {
                console.log('💾 Final parsing cleanup:', parsed);
                title = parsed.title;
            }
        }
        
        console.log('💾 Form data collected:', {title, notes, isEvent, repeatType});
        
        if (!title) {
            console.log('❌ No title provided');
            alert('Please enter a task title');
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
        alert('Error saving task. Please try again.');
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
    const saved = localStorage.getItem('gtdTemplates');
    if (saved) {
        customTemplates = JSON.parse(saved);
    } else {
        // Default templates
        customTemplates = ['@casa', '@recados', '@vedicvault', '@facebook', '@theonething'];
    }
    renderTemplateButtons();
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
    const container = document.getElementById('templateButtons');
    if (!container) return;
    
    container.innerHTML = '';
    
    customTemplates.forEach(template => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-btn';
        button.textContent = template;
        button.title = `Left-click to add "${template}" to task • Right-click or long-press to delete`;
        
        let touchStartTime = 0;
        let touchTimer = null;
        
        // Touch start for mobile long-press
        button.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchTimer = setTimeout(async () => {
                // Long press detected - show delete option
                e.preventDefault();
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
            if (touchDuration < 800) {
                // Short tap - insert template
                insertTemplateToTask(template);
            }
            button.classList.remove('deleting');
        });
        
        // Left click: insert template (for desktop)
        button.addEventListener('click', (e) => {
            if (e.pointerType === 'touch') return; // Skip if it's a touch event
            insertTemplateToTask(template);
        });
        
        // Right click: delete template (for desktop)
        button.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            if (confirm(`Delete template "${template}"?`)) {
                await deleteTemplate(template);
            }
        });
        
        container.appendChild(button);
    });
    
    // Add new template button
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'template-btn add-template';
    addButton.textContent = '+ Add';
    addButton.title = 'Add new template';
    addButton.addEventListener('click', createNewTemplate);
    
    container.appendChild(addButton);
}

function insertTemplateToTask(template) {
    const titleInput = document.getElementById('editTaskTitle');
    if (titleInput) {
        const currentValue = titleInput.value;
        const cursorPosition = titleInput.selectionStart;
        
        // Insert template at cursor position
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const afterCursor = currentValue.substring(cursorPosition);
        const newValue = beforeCursor + template + ' ' + afterCursor;
        
        titleInput.value = newValue;
        
        // Move cursor after the inserted template
        const newCursorPosition = cursorPosition + template.length + 1;
        titleInput.setSelectionRange(newCursorPosition, newCursorPosition);
        titleInput.focus();
    }
}

async function deleteTemplate(template) {
    customTemplates = customTemplates.filter(t => t !== template);
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
            alert('Template already exists!');
        }
    }
}

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
    
    // Toggle completion status
    task.status = task.status === 'completed' ? 'pending' : 'completed';
    task.updatedAt = new Date().toISOString();
    
    // Animate if completing
    if (task.status === 'completed') {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            animateTaskCompletion(taskElement);
        }
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
        
        // Remove task from local array
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
            // Move to trash before permanent deletion if function exists
            if (typeof moveToTrash === 'function') {
                moveToTrash(taskToDelete);
            }
            
            // Remove task permanently from local array
            tasks.splice(taskIndex, 1);
            console.log('🗑️ Task permanently removed from local array:', taskId);
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
        alert('❌ Error deleting task. Please try again.');
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
        alert('❌ Error delaying task. Please try again.');
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