/**
 * Task Card Component for HyperFiler Pro
 * Reusable task display component for different contexts
 */

class TaskCard {
    /**
     * Create a task card element
     */
    static create(task, context = 'default', options = {}) {
        const config = {
            showCheckbox: true,
            showDragHandle: true,
            showTime: true,
            showDate: true,
            maxTitleLength: 30,
            enableDragDrop: true,
            enableClick: true,
            ...options
        };

        return this.createCardElement(task, context, config);
    }

    /**
     * Create the actual task card DOM element
     */
    static createCardElement(task, context, config) {
        const cardClass = this.getCardClass(task, context);
        const titleText = this.getDisplayTitle(task, config.maxTitleLength);
        
        const taskElement = document.createElement('div');
        taskElement.className = cardClass;
        taskElement.dataset.taskId = task.id;
        
        // Setup drag and drop if enabled
        if (config.enableDragDrop) {
            this.setupDragDrop(taskElement, task);
        }

        // Build task card content
        taskElement.innerHTML = this.buildCardContent(task, context, config, titleText);

        // Setup click handler if enabled
        if (config.enableClick) {
            this.setupClickHandler(taskElement, task);
        }

        return taskElement;
    }

    /**
     * Get CSS class for task card based on context and task properties
     */
    static getCardClass(task, context) {
        const isOverdue = TaskUtils.isOverdue ? TaskUtils.isOverdue(task) : false;
        let cardClass = `task-card ${task.status}`;
        
        if (task.isEvent) {
            cardClass += ' event';
        } else if (isOverdue) {
            cardClass += ' overdue';
        }

        // Add context-specific classes
        switch (context) {
            case 'today':
                cardClass += ' today-task';
                break;
            case 'week':
                cardClass = 'week-task-item';
                if (task.isEvent) cardClass += ' event';
                break;
            case 'month':
                cardClass = 'calendar-task-item';
                if (task.isEvent) cardClass += ' event';
                break;
            case 'detailed':
                cardClass += ' detailed-task';
                break;
        }

        return cardClass;
    }

    /**
     * Get display title with truncation
     */
    static getDisplayTitle(task, maxLength) {
        if (!maxLength || task.title.length <= maxLength) {
            return task.title;
        }
        return task.title.substring(0, maxLength) + '...';
    }

    /**
     * Build task card content HTML
     */
    static buildCardContent(task, context, config, titleText) {
        switch (context) {
            case 'detailed':
                return this.buildDetailedCardContent(task, config, titleText);
            case 'week':
                return this.buildWeekCardContent(task, config, titleText);
            case 'month':
                return this.buildMonthCardContent(task, config, titleText);
            case 'today':
            default:
                return this.buildDefaultCardContent(task, config, titleText);
        }
    }

    /**
     * Build detailed task card content (for All Tasks view)
     */
    static buildDetailedCardContent(task, config, titleText) {
        const repeatBadge = (task.repeat && task.repeat !== 'none') 
            ? `<span class="repeat-badge" title="Recurring task: ${task.repeat}" style="background: #ffc107; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-right: 6px;">🔄</span>`
            : '';

        const tagIndicator = TaskUtils.hasTaskTags && TaskUtils.hasTaskTags(task) 
            ? ' <span style="color: #999; font-size: 14px;">🏷️</span>' 
            : '';

        const cleanText = TaskUtils.makeLinksClickable 
            ? TaskUtils.makeLinksClickable(TaskUtils.extractTagsAndCleanText(titleText).cleanText)
            : titleText;

        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; min-height: 40px; cursor: move;">
                <div style="display: flex; align-items: center; flex: 1;">
                    ${config.showDragHandle ? '<div style="margin-right: 8px; color: #ccc; cursor: grab;">⋮⋮</div>' : ''}
                    ${config.showCheckbox ? `<input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} onclick="toggleTaskStatus('${task.id}', event)" style="margin-right: 10px;">` : ''}
                    <div class="task-title" style="flex: 1;">
                        ${repeatBadge}${cleanText}${tagIndicator}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                    ${config.showTime && task.dueTime ? `<span style="color: #666; font-size: 12px;">🕐 ${task.dueTime}</span>` : ''}
                    ${config.showDate && task.dueDate ? `<span style="color: #666; font-size: 12px;">${DateUtils.formatDateForDisplay ? DateUtils.formatDateForDisplay(task.dueDate) : task.dueDate}</span>` : ''}
                    <button onclick="deleteTask('${task.id}', event)" title="Delete task" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">🗑️</button>
                </div>
            </div>
        `;
    }

    /**
     * Build week view task card content
     */
    static buildWeekCardContent(task, config, titleText) {
        const titlePrefix = task.isEvent ? '🔴 ' : '';
        return `${titlePrefix}${titleText}`;
    }

    /**
     * Build month view task card content
     */
    static buildMonthCardContent(task, config, titleText) {
        const titlePrefix = task.isEvent ? '🔴 ' : '';
        return `${titlePrefix}${titleText}`;
    }

    /**
     * Build default task card content
     */
    static buildDefaultCardContent(task, config, titleText) {
        return `
            <div style="display: flex; align-items: center; padding: 8px;">
                ${config.showCheckbox ? `<input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} onclick="toggleTaskStatus('${task.id}', event)" style="margin-right: 8px;">` : ''}
                <div class="task-title" style="flex: 1;">${titleText}</div>
                ${config.showTime && task.dueTime ? `<span style="color: #666; font-size: 12px; margin-left: 8px;">${task.dueTime}</span>` : ''}
            </div>
        `;
    }

    /**
     * Setup drag and drop for task element
     */
    static setupDragDrop(element, task) {
        element.draggable = true;
        element.dataset.taskId = task.id;
        element.dataset.fullText = task.title;
        element.title = task.title;

        // Use new drag drop manager if available
        if (window.dragDropManager) {
            window.dragDropManager.setupTaskDragDrop(element, task);
        } else {
            // Fallback to old handlers
            if (typeof handleDragStart === 'function') {
                element.addEventListener('dragstart', handleDragStart);
            }
            if (typeof handleDragEnd === 'function') {
                element.addEventListener('dragend', handleDragEnd);
            }
        }
    }

    /**
     * Setup click handler for task element
     */
    static setupClickHandler(element, task) {
        element.addEventListener('click', (e) => {
            // Don't trigger if clicking on checkbox or buttons
            if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                return;
            }
            
            e.stopPropagation();
            if (typeof editTask === 'function') {
                editTask(task.id);
            }
        });
    }

    /**
     * Create task list for a container
     */
    static renderTaskList(container, tasks, context = 'default', options = {}) {
        if (!container) return;

        const sortedTasks = TaskUtils.sortTasks ? TaskUtils.sortTasks(tasks) : tasks;
        
        // Clear container
        container.innerHTML = '';

        if (sortedTasks.length === 0) {
            container.innerHTML = `<div class="no-tasks" style="text-align: center; color: #999; padding: 20px;">No tasks for this view</div>`;
            return;
        }

        // Create task cards
        sortedTasks.forEach(task => {
            const taskCard = this.create(task, context, options);
            container.appendChild(taskCard);
        });
    }

    /**
     * Factory method for different card types
     */
    static forView(viewType) {
        const configs = {
            today: {
                showCheckbox: true,
                showDragHandle: false,
                showTime: true,
                showDate: false,
                maxTitleLength: 50,
                enableDragDrop: true
            },
            week: {
                showCheckbox: false,
                showDragHandle: false,
                showTime: false,
                showDate: false,
                maxTitleLength: 30,
                enableDragDrop: true,
                enableClick: true
            },
            month: {
                showCheckbox: false,
                showDragHandle: false,
                showTime: false,
                showDate: false,
                maxTitleLength: 25,
                enableDragDrop: true,
                enableClick: true
            },
            detailed: {
                showCheckbox: true,
                showDragHandle: true,
                showTime: true,
                showDate: true,
                maxTitleLength: null,
                enableDragDrop: true
            }
        };

        return (task, extraOptions = {}) => {
            const config = { ...configs[viewType], ...extraOptions };
            return this.create(task, viewType, config);
        };
    }
}

// Make available globally for backward compatibility
window.TaskCard = TaskCard;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskCard;
}