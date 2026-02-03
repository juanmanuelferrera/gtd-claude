/**
 * Task Bulk Operations for HyperFiler Pro
 */

// Time block toggle function with state persistence and rapid-click protection
function toggleTimeBlock(timeKey) {
    if (!timeKey) return;
    
    // Rapid-click protection
    const currentTime = Date.now();
    if (!window.toggleTimeBlockLastClick) window.toggleTimeBlockLastClick = {};
    if (window.toggleTimeBlockLastClick[timeKey] && 
        currentTime - window.toggleTimeBlockLastClick[timeKey] < 300) {
        console.log(`⏱️ Rapid-click blocked for ${timeKey}`);
        return;
    }
    window.toggleTimeBlockLastClick[timeKey] = currentTime;
    
    const content = document.getElementById(`content-${timeKey}`);
    const arrow = document.getElementById(`arrow-${timeKey}`);
    
    if (!content || !arrow) {
        console.warn(`Time block elements not found: ${timeKey}`);
        return;
    }
    
    try {
        // Get current collapse states from localStorage
        const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
        
        // Toggle state
        const isCurrentlyCollapsed = content.style.display === 'none' || collapseStates[timeKey] === true;
        collapseStates[timeKey] = !isCurrentlyCollapsed;
        
        // Apply visual state with accessibility
        content.style.display = collapseStates[timeKey] ? 'none' : 'block';
        arrow.textContent = collapseStates[timeKey] ? '▶' : '▼';
        arrow.setAttribute('aria-expanded', (!collapseStates[timeKey]).toString());
        arrow.setAttribute('aria-label', 
            collapseStates[timeKey] ? `Expand ${timeKey} time block` : `Collapse ${timeKey} time block`);
        
        // Persist state
        localStorage.setItem('timeblock_collapse_states', JSON.stringify(collapseStates));
        
        console.log(`🔄 Time block ${timeKey} ${collapseStates[timeKey] ? 'collapsed' : 'expanded'}`);
        
    } catch (error) {
        console.error(`Error toggling time block ${timeKey}:`, error);
    }
}
window.toggleTimeBlock = toggleTimeBlock;

// Action functions
function undoLastAction() {
    // Use existing undo functionality
    if (typeof performUndo === 'function') {
        performUndo();
    } else {
        console.log('Undo functionality not available');
        alert('Undo functionality not available');
    }
}
function deleteSelectedTasks() {
    // Use the selectedTaskIds variable from ui.js for consistency
    const selectedTasksSet = window.selectedTaskIds || selectedTasks || new Set();
    
    if (selectedTasksSet.size === 0) {
        alert('Please select tasks to delete first');
        return;
    }
    
    const taskCount = selectedTasksSet.size;
    if (!confirm(`Delete ${taskCount} selected task${taskCount > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Delete selected tasks
    const tasksToDelete = Array.from(selectedTasksSet);
    tasksToDelete.forEach(taskId => {
        if (typeof deleteTask === 'function') {
            deleteTask(taskId);
        } else {
            // Soft-delete from tasks array (tombstone for sync)
            const taskIndex = tasks.findIndex(t => t.id == taskId);
            if (taskIndex >= 0) {
                const taskBefore = { ...tasks[taskIndex] };
                tasks[taskIndex].isDeleted = true;
                tasks[taskIndex].status = 'deleted';
                tasks[taskIndex].deletedAt = new Date().toISOString();
                tasks[taskIndex].updatedAt = new Date().toISOString();
                if (typeof recordAction === 'function') {
                    recordAction('delete', taskId, taskBefore.title, taskBefore, { ...tasks[taskIndex] });
                }
            }
        }
    });
    
    // Clear selection
    selectedTasksSet.clear();
    if (window.selectedTaskIds) {
        window.selectedTaskIds.clear();
    }
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof performAllTasksSearch === 'function') {
        performAllTasksSearch();
    } else if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}
function delaySelectedTasks(days) {
    // Use the selectedTaskIds variable from ui.js for consistency
    const selectedTasksSet = window.selectedTaskIds || selectedTasks || new Set();
    
    if (selectedTasksSet.size === 0) {
        alert('Please select tasks to delay first');
        return;
    }
    
    const tasksToDelay = Array.from(selectedTasksSet);
    tasksToDelay.forEach(taskId => {
        if (typeof delayTask === 'function') {
            delayTask(taskId, days);
        }
    });
    
    // Clear selection
    selectedTasksSet.clear();
    if (window.selectedTaskIds) {
        window.selectedTaskIds.clear();
    }
    
    // Refresh view
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (!selectAllCheckbox) return;
    
    if (selectAllCheckbox.checked) {
        // Select all visible tasks
        const visibleTasks = typeof currentFilteredTasks !== 'undefined' ? 
            currentFilteredTasks : tasks;
        visibleTasks.forEach(task => selectedTasks.add(task.id));
    } else {
        // Clear all selections
        selectedTasks.clear();
    }
    
    // Update UI
    updateSelectedTasksUI();
}
function updateSelectedTasksUI() {
    const hasSelected = selectedTasks.size > 0;
    
    // Show/hide bulk action buttons
    const bulkButtons = document.querySelectorAll('#deleteSelectedBtn, #delaySelectedDayBtn, #delaySelectedWeekBtn, #delaySelectedMonthBtn, #todayDeleteSelectedBtn, #todayDelaySelectedDayBtn, #todayDelaySelectedWeekBtn, #todayDelaySelectedMonthBtn, #todaySetTimeBtn');
    bulkButtons.forEach(btn => {
        if (btn) {
            btn.style.display = hasSelected ? 'inline-block' : 'none';
        }
    });
}
// Group functions
function expandAllGroups() {
    document.querySelectorAll('[id^="tasks-"]').forEach(container => {
        container.classList.add('expanded');
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(arrow => {
        arrow.classList.add('expanded');
        arrow.textContent = '▼';
        arrow.setAttribute('aria-expanded', 'true');
    });
    document.querySelectorAll('.group-content').forEach(content => {
        content.style.display = 'block';
    });
}
function collapseAllGroups() {
    document.querySelectorAll('[id^="tasks-"]').forEach(container => {
        container.classList.remove('expanded');
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(arrow => {
        arrow.classList.remove('expanded');
        arrow.textContent = '▶';
        arrow.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.group-content').forEach(content => {
        content.style.display = 'none';
    });
}

function handleDragStart(e) {
    const taskIdStr = e.target.dataset.taskId;
    
    // Try both string and number comparison since task IDs can be either
    const taskId = parseInt(taskIdStr);
    window.draggedTask = window.tasks?.find(t => t.id == taskIdStr || t.id === taskId);
    
    if (!window.draggedTask) {
        console.error('Task not found for drag:', taskIdStr);
        return;
    }
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskIdStr);
    
    // Create a clean drag image with just the task
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.background = '#e3f2fd';
    dragImage.style.border = '2px solid #007bff';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.zIndex = '9999';
    dragImage.style.width = e.target.offsetWidth + 'px';
    document.body.appendChild(dragImage);
    
    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, e.offsetX || 10, e.offsetY || 10);
    
    // Remove the temporary drag image after a short delay
    setTimeout(() => {
        if (dragImage.parentNode) {
            dragImage.parentNode.removeChild(dragImage);
        }
    }, 0);
    
    // Add dragging-active class to grids for visual effects
    const weekGrid = document.getElementById('weekGrid');
    const calendarGrid = document.getElementById('calendarGrid');
    if (weekGrid) {
        weekGrid.classList.add('dragging-active');
    }
    if (calendarGrid) {
        calendarGrid.classList.add('dragging-active');
    }
}
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    window.draggedTask = null;
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    // Remove dragging-active class from grids
    const weekGrid = document.getElementById('weekGrid');
    const calendarGrid = document.getElementById('calendarGrid');
    if (weekGrid) {
        weekGrid.classList.remove('dragging-active');
    }
    if (calendarGrid) {
        calendarGrid.classList.remove('dragging-active');
    }
}
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}
function handleDragEnter(e) {
    e.preventDefault();
    if (window.draggedTask && (e.currentTarget.classList.contains('calendar-day') || e.currentTarget.classList.contains('week-day'))) {
        // Clear all existing drop-targets before adding to current element
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        e.currentTarget.classList.add('drop-target');
    }
}
function handleDragLeave(e) {
    // Only remove drop-target if we're truly leaving the calendar day
    // Check if the related target is outside the current target
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // If mouse coordinates are outside the calendar day bounds, remove the class
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        e.currentTarget.classList.remove('drop-target');
    }
}
async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    if (!window.draggedTask) {
        console.error('No draggedTask found in handleDrop');
        return;
    }
    
    const newDate = e.currentTarget.dataset.date;
    if (!newDate) {
        console.error('No date found on drop target');
        return;
    }
    
    if (newDate === window.draggedTask.dueDate) {
        return;
    }
    
    // Store task info before async operations (draggedTask can become null)
    const taskTitle = window.draggedTask.title;
    const taskId = window.draggedTask.id;
    
    const newDateObj = new Date(newDate);
    const oldDate = window.draggedTask.dueDate ? new Date(window.draggedTask.dueDate) : null;
    
    try {
        // Update task date
        window.draggedTask.dueDate = newDate;
        window.draggedTask.updatedAt = new Date().toISOString();

        // Auto-mark as Event when dropping to a future date (protects from cron pulling it forward)
        const today = typeof getLocalDateString === 'function' ? getLocalDateString(new Date()) : new Date().toISOString().slice(0, 10);
        if (newDate > today) {
            window.draggedTask.isEvent = true;
            // Add @event to notes for MCP compatibility
            if (!window.draggedTask.notes || !window.draggedTask.notes.includes('@event')) {
                window.draggedTask.notes = window.draggedTask.notes ? window.draggedTask.notes + ' @event' : '@event';
            }
            console.log(`📅 Task "${window.draggedTask.title}" dropped on future date - marked as Event + @event`);
        }

        // Update in memory tasks array
        if (window.tasks) {
            const existingIndex = window.tasks.findIndex(t => t.id === window.draggedTask.id);
            if (existingIndex >= 0) {
                window.tasks[existingIndex] = window.draggedTask;
                // Sync back to local tasks variable for immediate UI update
                if (typeof tasks !== 'undefined') {
                    tasks = window.tasks;
                }
            }
        }
        
        // Save to localStorage
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        
        // Sync to cloud
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
        }
        
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        
        // Force immediate UI refresh for all views
        console.log('🔄 Force refreshing UI after drag and drop');
        console.log('🔍 Current view:', window.currentView);
        
        // IMMEDIATE render without delay + clear filters
        if (window.currentView === 'today' && typeof renderTodayView === 'function') {
            console.log('📅 Rendering today view immediately');
            renderTodayView();
        } else if (window.currentView === 'week' && typeof renderWeekView === 'function') {
            console.log('📅 Rendering week view immediately');
            // Clear week filters
            const weekSearchInput = document.getElementById('weekTaskSearch');
            if (weekSearchInput) weekSearchInput.value = '';
            if (typeof activeWeekTemplateFilter !== 'undefined') {
                activeWeekTemplateFilter = null;
            }
            renderWeekView();
        } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
            console.log('📅 Rendering calendar view immediately');
            
            // Clear month filters BEFORE rendering
            const monthSearchInput = document.getElementById('monthTaskSearch');
            if (monthSearchInput) {
                monthSearchInput.value = '';
                console.log('🧹 Cleared month search filter');
            }
            if (typeof activeMonthTemplateFilter !== 'undefined') {
                activeMonthTemplateFilter = null;
                console.log('🧹 Cleared month template filter');
            }
            if (typeof window !== 'undefined') {
                window.currentMonthFilteredTasks = null;
                window.currentMonthSearchTerm = null;
                console.log('🧹 Cleared month filtered tasks cache');
            }
            
            renderCalendar();
            console.log('✅ Calendar rendered successfully');
        } else if (typeof renderCurrentView === 'function') {
            console.log('📅 Rendering current view as fallback');
            renderCurrentView();
        } else {
            console.error('❌ No render function available!');
        }
        
        // Show brief success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = `Task "${taskTitle}" moved to ${newDateObj.toLocaleDateString()}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error in handleDrop:', error);
    }
}

// Time slot drag and drop for Today view
function handleTimeSlotDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}
function handleTimeSlotDragEnter(e) {
    e.preventDefault();
    if (window.draggedTask) {
        e.currentTarget.classList.add('drop-target');
    }
}
function handleTimeSlotDragLeave(e) {
    // Remove drop-target class when leaving the time slot
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        e.currentTarget.classList.remove('drop-target');
    }
}
async function handleTimeSlotDrop(e, targetTime) {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    if (!window.draggedTask) {
        console.error('No draggedTask found in time slot drop');
        return;
    }
    
    try {
        console.log(`Moving task "${window.draggedTask.title}" to time ${targetTime}`);
        
        // Update task time
        window.draggedTask.dueTime = targetTime;
        window.draggedTask.updatedAt = new Date().toISOString();
        
        // Save to localStorage and server
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        if (typeof saveTasks === 'function') {
            await saveTasks();
        }
        
        // Re-render Today view to show new position
        if (typeof renderTodayView === 'function') {
            renderTodayView();
        }
        
        console.log('✅ Task time updated via drag and drop');
    } catch (error) {
        console.error('❌ Error in time slot drop:', error);
    }
}
function toggleAllSections() {
    console.log('🔄 TOGGLE ALL: Starting, current view:', window.currentView);
    
    try {
        // Check which view we're in and find appropriate sections
        const listSections = document.querySelectorAll('.list-section');
        const timeBlocks = document.querySelectorAll('.time-block');
        
        console.log(`🔄 TOGGLE ALL: Found ${listSections.length} list sections, ${timeBlocks.length} time blocks`);
        
        if (listSections.length > 0) {
            // Lists view - toggle list sections
            console.log('🔄 TOGGLE ALL: Using list sections');
            toggleAllListSections(listSections);
        } else if (timeBlocks.length > 0) {
            // Today view - toggle time blocks
            console.log('🔄 TOGGLE ALL: Using time blocks');
            toggleAllTimeBlocks(timeBlocks);
        } else {
            // No sections found - try again after a brief delay in case view is still rendering
            console.log('🔄 TOGGLE ALL: No sections found, retrying in 100ms...');
            setTimeout(() => {
                const retryListSections = document.querySelectorAll('.list-section');
                const retryTimeBlocks = document.querySelectorAll('.time-block');
                
                console.log(`🔄 TOGGLE ALL RETRY: Found ${retryListSections.length} list sections, ${retryTimeBlocks.length} time blocks`);
                
                if (retryListSections.length > 0) {
                    toggleAllListSections(retryListSections);
                } else if (retryTimeBlocks.length > 0) {
                    toggleAllTimeBlocks(retryTimeBlocks);
                } else {
                    console.warn('🔄 TOGGLE ALL: No sections found to toggle after retry');
                }
            }, 100);
            return;
        }
    } catch (error) {
        console.error('Error in toggleAllSections:', error);
    }
}
function toggleAllListSections(sections) {
    const arrows = document.querySelectorAll('.list-section-header span');
        
        // Check if any sections are visible
        let anyVisible = false;
        sections.forEach(section => {
            const content = section.querySelector('.list-section-content');
            if (content && !content.classList.contains('collapsed')) {
                anyVisible = true;
            }
        });
        
        console.log(`Found ${sections.length} sections, anyVisible: ${anyVisible}`);
        
        // Toggle all sections using the data-section-id
        sections.forEach(section => {
            const sectionId = section.dataset.sectionId;
            if (sectionId) {
                // Find the corresponding listSection data
                const listSection = window.listSections?.find(s => s.id === sectionId);
                if (listSection) {
                    // Toggle the collapsed state
                    listSection.collapsed = anyVisible; // If any visible, collapse all; otherwise expand all
                    console.log(`Toggling section ${listSection.name} to collapsed: ${listSection.collapsed}`);
                }
            }
        });
        
        // Save and re-render
        if (typeof saveListSections === 'function') {
            saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
        
        console.log(`✅ Toggled ${sections.length} sections - ${anyVisible ? 'collapsed' : 'expanded'} all`);
}
function toggleAllTimeBlocks(timeBlocks) {
    console.log('Toggling all time blocks...');
    
    try {
        // Get current collapse states from localStorage
        const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
        
        // Check if any time blocks are visible
        let anyVisible = false;
        timeBlocks.forEach(block => {
            const header = block.querySelector('.time-block-header');
            if (header) {
                const timeKey = header.textContent.includes('No Specific Time') ? 'untimed' : 
                               header.textContent.match(/\d{1,2}:\d{2}/)?.[0]?.replace(':', '');
                if (timeKey && collapseStates[timeKey] !== true) {
                    anyVisible = true;
                }
            }
        });
        
        // Toggle all time blocks
        timeBlocks.forEach(block => {
            const header = block.querySelector('.time-block-header');
            if (header) {
                const timeKey = header.textContent.includes('No Specific Time') ? 'untimed' : 
                               header.textContent.match(/\d{1,2}:\d{2}/)?.[0]?.replace(':', '');
                if (timeKey && typeof toggleTimeBlock === 'function') {
                    const shouldCollapse = anyVisible;
                    const currentlyCollapsed = collapseStates[timeKey] === true;
                    
                    // Only toggle if state needs to change
                    if (currentlyCollapsed !== shouldCollapse) {
                        toggleTimeBlock(timeKey);
                    }
                }
            }
        });
        
        console.log(`✅ Toggled ${timeBlocks.length} time blocks - ${anyVisible ? 'collapsed' : 'expanded'} all`);
    } catch (error) {
        console.error('Error toggling time blocks:', error);
    }
}

// Toggle all time slots function
function toggleAllTimeSlots() {
    // Get all time slot content elements
    const timeSlots = document.querySelectorAll('.time-block-content');
    const arrows = document.querySelectorAll('.group-arrow');
    
    // Check if any are visible
    let anyVisible = false;
    timeSlots.forEach(slot => {
        if (slot.style.display !== 'none') {
            anyVisible = true;
        }
    });
    
    // Toggle all with consistent accessibility
    timeSlots.forEach((slot, index) => {
        if (anyVisible) {
            slot.style.display = 'none';
            if (arrows[index]) {
                arrows[index].textContent = '▶';
                arrows[index].setAttribute('aria-expanded', 'false');
            }
        } else {
            slot.style.display = 'block';
            if (arrows[index]) {
                arrows[index].textContent = '▼';
                arrows[index].setAttribute('aria-expanded', 'true');
            }
        }
    });
}

window.undoLastAction = undoLastAction;
window.deleteSelectedTasks = deleteSelectedTasks;
window.delaySelectedTasks = delaySelectedTasks;
window.toggleSelectAll = toggleSelectAll;
window.expandAllGroups = expandAllGroups;
window.collapseAllGroups = collapseAllGroups;

// Helper function to parse time strings for comparison
function parseTime(timeStr) {
    if (!timeStr) return null;
    
    try {
        // Handle various time formats: "14:30", "2:30 PM", "14:30:00"
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
        if (!timeMatch) return null;
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[4];
        
        // Convert 12-hour to 24-hour format
        if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hours !== 12) {
                hours += 12;
            } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
                hours = 0;
            }
        }
        
        // Return minutes since midnight for easy comparison
        return hours * 60 + minutes;
    } catch (error) {
        console.warn('Could not parse time:', timeStr, error);
        return null;
    }
}
// Move all tasks to current time block
function moveAllTasksToCurrentTime() {
    // Prevent multiple simultaneous executions
    if (window.moveTasksInProgress) {
        console.log('⚠️ Move already in progress, ignoring click');
        return;
    }
    
    window.moveTasksInProgress = true;
    console.log('🕐 Move button clicked! Starting function...');
    console.log('🔍 Debug - tasks array:', window.tasks ? window.tasks.length + ' tasks' : 'tasks array not found');
    console.log('🔍 Debug - currentTodayDate:', window.currentTodayDate);
    
    // Disable the button to prevent multiple clicks
    const btn = document.querySelector('.move-current-time-btn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
    
    // Temporarily disable sync to prevent overwriting our changes
    const originalSyncEnabled = window.syncEnabled;
    window.syncEnabled = false;
    console.log('🔒 Temporarily disabled sync during task move');
    
    // Get current time rounded to 30-minute interval
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    now.setMinutes(roundedMinutes, 0, 0);
    
    const currentTimeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: false 
    });
    
    console.log('🎯 Target time:', currentTimeStr);
    console.log('🔍 Testing parseTime with "12:00":', parseTime('12:00'));
    console.log('🔍 Testing parseTime with current time:', parseTime(currentTimeStr));
    console.log('🔍 Is 12:00 < current time?', parseTime('12:00') < parseTime(currentTimeStr));
    
    // Get today's date string - fix currentTodayDate if it's a DOM element
    let today;
    if (window.currentTodayDate && typeof window.currentTodayDate.getFullYear === 'function') {
        today = window.currentTodayDate;
    } else if (typeof currentTodayDate !== 'undefined' && typeof currentTodayDate.getFullYear === 'function') {
        today = currentTodayDate;
    } else {
        today = new Date(); // Fallback to current date
        console.log('⚠️ Using current date as fallback, currentTodayDate was:', typeof currentTodayDate, currentTodayDate);
    }
    
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    
    console.log('📅 Working with date:', todayStr, 'from', today);
    
    // Find all today's tasks that have a specific time (exclude untimed tasks and events)  
    const tasksArray = window.tasks || tasks || [];
    console.log('🔍 Working with', tasksArray.length, 'total tasks');
    
    // Find overdue tasks (from previous dates) AND today's tasks before current time
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0); // Start of today
    
    // First, let's see what timed tasks we have
    console.log('🔍 Sample of ALL tasks (first 10):');
    tasksArray.slice(0, 10).forEach((task, i) => {
        console.log(`Task ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | time: "${task.time}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    const timedTasks = tasksArray.filter(task => {
        return task.dueTime && task.dueTime.trim() !== '' && task.dueTime !== 'undefined' && task.status !== 'deleted';
    });
    console.log('⏰ Found', timedTasks.length, 'timed tasks total (using dueTime property):');
    timedTasks.slice(0, 5).forEach((task, i) => {
        console.log(`Timed ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | dueTime: "${task.dueTime}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Check if there are any tasks with time properties that are not "undefined"
    const anyTimeProperty = tasksArray.filter(task => task.dueTime !== 'undefined' && task.dueTime !== undefined && task.dueTime);
    console.log('🕐 Tasks with any dueTime property (not "undefined"):', anyTimeProperty.length);
    anyTimeProperty.slice(0, 3).forEach((task, i) => {
        console.log(`dueTime property ${i+1}: "${task.title}" | dueTime: "${task.dueTime}" | typeof: ${typeof task.dueTime}`);
    });

    const overdueTasks = tasksArray.filter(task => {
        if (!task.dueDate || task.status === 'deleted' || task.status === 'completed' || isTaskEvent(task)) {
            return false;
        }
        
        // EXCLUDE untimed tasks (as per your requirement: "not untimed")
        if (!task.dueTime || task.dueTime.trim() === '' || task.dueTime === 'undefined') {
            return false;
        }
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0); // Start of task date
        
        // Include tasks from previous dates (overdue) OR today's tasks before current time
        if (taskDate < todayDate) {
            // Overdue timed task from previous date
            return true;
        } else if (taskDate.getTime() === todayDate.getTime()) {
            // Today's timed tasks - only if before current time
            const taskTime = parseTime(task.dueTime);
            const currentTime = parseTime(currentTimeStr);
            return taskTime && currentTime && taskTime < currentTime;
        }
        
        return false;
    });
    
    console.log('📅 Found', overdueTasks.length, 'overdue tasks (from previous dates + today before', currentTimeStr + ')');
    
    // Also show today's tasks for reference
    const todayTasks = tasksArray.filter(task => 
        task.dueDate && task.dueDate.startsWith(todayStr) && 
        task.status !== 'deleted' && task.status !== 'completed'
    );
    console.log('📅 Found', todayTasks.length, 'tasks for today', todayStr, '(for reference)');
    
    // Check Facebook task specifically since it shows as timed in UI but untimed in console
    const facebookTasks = tasksArray.filter(task => 
        task.title && task.title.toLowerCase().includes('facebook')
    );
    console.log('📘 Found', facebookTasks.length, 'Facebook-related tasks:');
    facebookTasks.forEach((task, i) => {
        console.log(`Facebook ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | time: "${task.time}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Also check tasks that might match your cleaning task specifically
    const cleaningTasks = tasksArray.filter(task => 
        task.title && task.title.toLowerCase().includes('cleaning')
    );
    console.log('🧹 Found', cleaningTasks.length, 'cleaning-related tasks:');
    cleaningTasks.forEach((task, i) => {
        console.log(`Cleaning ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | dueTime: "${task.dueTime}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Debug overdue tasks
    console.log('🔍 Analyzing overdue tasks:');
    overdueTasks.forEach((task, i) => {
        console.log(`Overdue ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | dueTime: "${task.dueTime}" | status: ${task.status}`);
    });

    let movedCount = 0;
    const updatedTasks = tasksArray.map(task => {
        // Check if this task is in our overdue tasks list
        const isOverdue = overdueTasks.find(overdueTask => 
            overdueTask.id === task.id || 
            (overdueTask.title === task.title && overdueTask.dueDate === task.dueDate)
        );
        
        if (isOverdue) {
            const taskBefore = { ...task };
            // Move overdue task to current time and today's date
            const updatedTask = {
                ...task,
                dueDate: todayStr,
                dueTime: currentTimeStr,
                updatedAt: new Date().toISOString()
            };
            if (typeof recordAction === 'function') {
                recordAction('edit', task.id, task.title, taskBefore, updatedTask);
            }
            movedCount++;
            console.log('📋 Moved overdue task:', task.title, 'from', task.dueDate, task.dueTime || '(no time)', 'to', todayStr, currentTimeStr);
            return updatedTask;
        }
        return task;
    });
    
    // Update global tasks array
    window.tasks = updatedTasks;
    tasks = updatedTasks;  // Keep both for compatibility
    
    // Save to localStorage
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    console.log('💾 Saved', updatedTasks.length, 'tasks to localStorage');
    
    // CRITICAL SEQUENCE:
    // 1. Create the time slot FIRST by rendering with updated tasks
    console.log(`🏗️ STEP 1: Creating ${currentTimeStr} time slot...`);
    if (typeof renderTodayView === 'function') {
        renderTodayView();
        console.log(`✅ Time slot ${currentTimeStr} created and populated with ${movedCount} tasks`);
    }
    
    // 2. Verify the slot exists in DOM
    setTimeout(() => {
        const slot = document.querySelector(`[data-time="${currentTimeStr}"]`) || 
                     Array.from(document.querySelectorAll('.time-block-header')).find(el => el.textContent.includes(currentTimeStr));
        if (slot) {
            console.log(`✅ STEP 2: Verified ${currentTimeStr} slot exists in DOM`);
        } else {
            console.log(`⚠️ STEP 2: ${currentTimeStr} slot not found in DOM yet`);
        }
    }, 100);
    
    // 3. Upload to cloud AFTER slot is created and tasks are moved
    const uploadPromise = (async () => {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log(`📤 STEP 3: Uploading ${movedCount} moved tasks to cloud...`);
        if (typeof uploadAllTasks === 'function') {
            console.log(`📊 Uploading tasks with time ${currentTimeStr}`);
            await uploadAllTasks();
            console.log('✅ STEP 3: Upload completed successfully');
        } else if (window.uploadAllTasks) {
            console.log(`📊 Uploading tasks with time ${currentTimeStr}`);
            await window.uploadAllTasks();
            console.log('✅ STEP 3: Upload completed successfully');
        }
    })();
    
    // Re-render today view
    console.log('🔄 Attempting to re-render Today view...');
    
    // Check if tasks were actually updated in memory
    const fbTask = window.tasks.find(t => t.title && t.title.includes('Facebook @project'));
    if (fbTask) {
        console.log('🔍 Facebook task after update:', fbTask.title, '| dueDate:', fbTask.dueDate, '| dueTime:', fbTask.dueTime);
    }
    
    // Force clear any time block collapse states to ensure the target time block shows
    const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
    collapseStates[currentTimeStr] = false; // Ensure target time block is expanded
    localStorage.setItem('timeblock_collapse_states', JSON.stringify(collapseStates));
    console.log(`🔄 Forced ${currentTimeStr} time block to expand`);
    
    // Additional render after upload starts to refresh the view
    // This helps ensure the UI stays in sync
    setTimeout(() => {
        console.log(`🔄 Refreshing view to ensure ${currentTimeStr} slot is visible`);
        if (typeof renderTodayView === 'function') {
            renderTodayView();
        } else if (typeof window.renderTodayView === 'function') {
            window.renderTodayView();
        }
    }, 500);
    
    // Force re-render after a short delay to ensure DOM updates
    setTimeout(() => {
        console.log('🔄 Force refresh after delay...');
        if (typeof renderTodayView === 'function') {
            renderTodayView();
        } else if (typeof window.renderTodayView === 'function') {
            window.renderTodayView();
        }
        
        // Also try to trigger the Today tab refresh
        const todayTab = document.querySelector('[data-tab="today"], .tab[onclick*="showToday"]');
        if (todayTab) {
            todayTab.click();
            console.log('✅ Clicked Today tab to refresh view');
        }
    }, 500);
    
    // Give UI time to render, then check if the target time block has our tasks
    setTimeout(() => {
        const timeBlock = document.querySelector(`[data-time="${currentTimeStr}"], [id*="${currentTimeStr}"]`) || 
                          Array.from(document.querySelectorAll('.time-block-header')).find(el => el.textContent.includes(currentTimeStr));
        if (timeBlock) {
            console.log(`✅ Found ${currentTimeStr} time block in DOM after render`);
        } else {
            console.log(`❌ Could not find ${currentTimeStr} time block in DOM - may need page refresh`);
        }
    }, 1000);
    
    // Show confirmation
    const message = movedCount > 0 
        ? `✅ Moved ${movedCount} overdue tasks to ${currentTimeStr}` 
        : `ℹ️ No overdue tasks to move (only moves tasks scheduled before ${currentTimeStr})`;
    
    console.log(message);
    
    // Show brief notification
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else {
        // Fallback: temporary message in the button
        const btn = document.querySelector('.move-current-time-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = movedCount > 0 ? `✅ Moved ${movedCount}` : '✅ Done';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }
    }
    
    // Re-enable sync after upload completes (give more time for server sync)
    setTimeout(async () => {
        // Wait for initial upload to complete
        await uploadPromise;
        
        window.syncEnabled = originalSyncEnabled;
        console.log('🔓 Re-enabled sync after task move completion');
        
        // Force one more upload to be absolutely sure
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
            console.log('📤 Final upload to ensure server has latest data');
        }
        
        // Reset the progress flag
        window.moveTasksInProgress = false;
        
        // Re-enable the button
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
        
        console.log('✅ Move operation completed - no page reload needed');
    }, 3000);  // Increased delay to ensure upload completes
}

window.moveAllTasksToCurrentTime = moveAllTasksToCurrentTime;

window.toggleAllSections = toggleAllSections;

// Standardized overdue check - use this everywhere to ensure consistency
function isTaskOverdue(task) {
    // Consistent logic: pending status, has due date, date is in past, not an event
    if (!task.dueDate || task.status !== 'pending' || isTaskEvent(task)) {
        return false;
    }
    const today = getLocalDateString(new Date());
    return task.dueDate < today;
}
window.isTaskOverdue = isTaskOverdue;
