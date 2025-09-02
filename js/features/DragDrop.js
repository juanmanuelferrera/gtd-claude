/**
 * Drag and Drop Management for HyperFiler Pro
 * Handles all task drag and drop operations across views
 */

class DragDropManager {
    constructor() {
        this.draggedTask = null;
        this.setupGlobalStyles();
    }

    /**
     * Setup global drag and drop styles
     */
    setupGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .dragging {
                opacity: 0.6;
                transform: rotate(2deg);
            }
            
            .drop-target {
                background: rgba(0, 123, 255, 0.1);
                border: 2px dashed #007bff;
            }
            
            .dragging-active .calendar-day,
            .dragging-active .week-day {
                transition: all 0.2s ease;
            }
            
            .dragging-active .calendar-day:hover,
            .dragging-active .week-day:hover {
                background: rgba(0, 123, 255, 0.05);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Handle drag start for tasks
     */
    handleDragStart(e) {
        const taskIdStr = e.target.dataset.taskId;
        
        // Find task in global tasks array
        const taskId = parseInt(taskIdStr);
        this.draggedTask = window.tasks?.find(t => t.id == taskIdStr || t.id === taskId);
        
        if (!this.draggedTask) {
            console.error('Task not found for drag:', taskIdStr);
            return false;
        }
        
        // Update global state
        window.draggedTask = this.draggedTask;
        if (window.appState) {
            window.appState.setState({ draggedTask: this.draggedTask });
        }
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskIdStr);
        
        // Create custom drag image
        this.createDragImage(e);
        
        // Add visual feedback to grids
        this.addGridDragState();
        
        return true;
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedTask = null;
        window.draggedTask = null;
        
        if (window.appState) {
            window.appState.setState({ draggedTask: null });
        }
        
        // Clean up visual feedback
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        
        this.removeGridDragState();
    }

    /**
     * Handle drag over (required for drop to work)
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Handle drag enter
     */
    handleDragEnter(e) {
        e.preventDefault();
        if (this.draggedTask && this.isValidDropTarget(e.currentTarget)) {
            // Clear existing drop targets first
            document.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
            e.currentTarget.classList.add('drop-target');
        }
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        // Only remove drop-target if mouse is truly outside bounds
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            e.currentTarget.classList.remove('drop-target');
        }
    }

    /**
     * Handle drop for date changes
     */
    async handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-target');
        
        if (!this.draggedTask) {
            console.error('No draggedTask found in handleDrop');
            return;
        }
        
        const newDate = e.currentTarget.dataset.date;
        if (!newDate) {
            console.error('No date found on drop target');
            return;
        }
        
        if (newDate === this.draggedTask.dueDate) {
            return; // No change needed
        }
        
        await this.updateTaskDate(this.draggedTask, newDate);
    }

    /**
     * Handle drop for time slot changes (Today view)
     */
    async handleTimeSlotDrop(e, targetTime) {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-target');
        
        if (!this.draggedTask) {
            console.error('No draggedTask found in time slot drop');
            return;
        }
        
        console.log(`Moving task "${this.draggedTask.title}" to time ${targetTime}`);
        await this.updateTaskTime(this.draggedTask, targetTime);
    }

    /**
     * Update task date and sync
     */
    async updateTaskDate(task, newDate) {
        const oldDate = task.dueDate;
        
        try {
            // Update task
            task.dueDate = newDate;
            task.updatedAt = new Date().toISOString();
            
            // Update in tasks array
            const taskIndex = window.tasks.findIndex(t => t.id === task.id);
            if (taskIndex >= 0) {
                window.tasks[taskIndex] = task;
                // Sync back to local tasks variable
                if (typeof tasks !== 'undefined') {
                    tasks = window.tasks;
                }
            }
            
            // Save and sync
            await this.saveAndSync();
            
            // Refresh current view
            this.refreshCurrentView();
            
            // Show feedback
            const formattedOldDate = oldDate ? DateUtils.formatDateForDisplay(oldDate) : 'No date';
            const formattedNewDate = DateUtils.formatDateForDisplay(newDate);
            ModalManager.alert(`Task moved from ${formattedOldDate} to ${formattedNewDate}`, 'success');
            
        } catch (error) {
            console.error('Error updating task date:', error);
            ModalManager.alert('Failed to move task', 'error');
        }
    }

    /**
     * Update task time and sync
     */
    async updateTaskTime(task, newTime) {
        try {
            task.dueTime = newTime;
            task.updatedAt = new Date().toISOString();
            
            // Update in tasks array
            const taskIndex = window.tasks.findIndex(t => t.id === task.id);
            if (taskIndex >= 0) {
                window.tasks[taskIndex] = task;
                // Sync back to local tasks variable
                if (typeof tasks !== 'undefined') {
                    tasks = window.tasks;
                }
            }
            
            await this.saveAndSync();
            this.refreshCurrentView();
            
            ModalManager.alert(`Task time updated to ${newTime}`, 'success');
            
        } catch (error) {
            console.error('Error updating task time:', error);
            ModalManager.alert('Failed to update task time', 'error');
        }
    }

    /**
     * Save to storage and sync to cloud
     */
    async saveAndSync() {
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
        }
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
    }

    /**
     * Refresh the current view after changes
     */
    refreshCurrentView() {
        const currentView = window.currentView || (window.appState && window.appState.get('currentView'));
        
        switch (currentView) {
            case 'today':
                if (typeof renderTodayView === 'function') renderTodayView();
                break;
            case 'week':
                if (typeof renderWeekView === 'function') renderWeekView();
                break;
            case 'calendar':
                if (typeof renderCalendar === 'function') renderCalendar();
                break;
            default:
                if (typeof renderCurrentView === 'function') renderCurrentView();
        }
    }

    /**
     * Check if element is a valid drop target
     */
    isValidDropTarget(element) {
        return element.classList.contains('calendar-day') || 
               element.classList.contains('week-day') ||
               element.classList.contains('time-block');
    }

    /**
     * Create custom drag image
     */
    createDragImage(e) {
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
        
        e.dataTransfer.setDragImage(dragImage, e.offsetX || 10, e.offsetY || 10);
        
        // Clean up drag image
        setTimeout(() => {
            if (dragImage.parentNode) {
                dragImage.parentNode.removeChild(dragImage);
            }
        }, 0);
    }

    /**
     * Add visual state to grids during drag
     */
    addGridDragState() {
        const grids = ['weekGrid', 'calendarGrid', 'todaySchedule'];
        grids.forEach(gridId => {
            const grid = document.getElementById(gridId);
            if (grid) grid.classList.add('dragging-active');
        });
    }

    /**
     * Remove visual state from grids after drag
     */
    removeGridDragState() {
        const grids = ['weekGrid', 'calendarGrid', 'todaySchedule'];
        grids.forEach(gridId => {
            const grid = document.getElementById(gridId);
            if (grid) grid.classList.remove('dragging-active');
        });
    }

    /**
     * Setup drag and drop for an element
     */
    setupTaskDragDrop(element, task) {
        if (!element || !task) return;
        
        element.draggable = true;
        element.dataset.taskId = task.id;
        
        element.addEventListener('dragstart', this.handleDragStart.bind(this));
        element.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    /**
     * Setup drop zone for an element
     */
    setupDropZone(element, dropHandler) {
        if (!element) return;
        
        element.addEventListener('dragover', this.handleDragOver.bind(this));
        element.addEventListener('dragenter', this.handleDragEnter.bind(this));
        element.addEventListener('dragleave', this.handleDragLeave.bind(this));
        element.addEventListener('drop', dropHandler || this.handleDrop.bind(this));
    }
}

// Create global instance and expose methods for backward compatibility
window.dragDropManager = new DragDropManager();

// Export individual functions for backward compatibility
window.handleDragStart = (e) => window.dragDropManager.handleDragStart(e);
window.handleDragEnd = (e) => window.dragDropManager.handleDragEnd(e);
window.handleDragOver = (e) => window.dragDropManager.handleDragOver(e);
window.handleDragEnter = (e) => window.dragDropManager.handleDragEnter(e);
window.handleDragLeave = (e) => window.dragDropManager.handleDragLeave(e);
window.handleDrop = (e) => window.dragDropManager.handleDrop(e);
window.handleTimeSlotDrop = (e, time) => window.dragDropManager.handleTimeSlotDrop(e, time);

// Time slot specific handlers for backward compatibility
window.handleTimeSlotDragOver = (e) => window.dragDropManager.handleDragOver(e);
window.handleTimeSlotDragEnter = (e) => {
    e.preventDefault();
    if (window.dragDropManager.draggedTask) {
        e.currentTarget.classList.add('drop-target');
    }
};
window.handleTimeSlotDragLeave = (e) => window.dragDropManager.handleDragLeave(e);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DragDropManager;
}