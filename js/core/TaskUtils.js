/**
 * Task Utilities for HyperFiler Pro
 * Common task operations, filtering, and sorting functions
 */

class TaskUtils {
    /**
     * Get tasks for a specific date
     */
    static getTasksForDate(tasks, dateStr) {
        return tasks.filter(task => task.dueDate === dateStr && task.status !== 'deleted');
    }

    /**
     * Get tasks for a date range
     */
    static getTasksForDateRange(tasks, startDate, endDate) {
        return tasks.filter(task => {
            if (!task.dueDate || task.status === 'deleted') return false;
            return task.dueDate >= startDate && task.dueDate <= endDate;
        });
    }

    /**
     * Sort tasks with consistent logic
     */
    static sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            // First, prioritize by completion status (pending first)
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }
            
            // Then prioritize events first
            if (a.isEvent !== b.isEvent) {
                return a.isEvent ? -1 : 1;
            }
            
            // Then sort by time if both have times
            if (a.dueTime && b.dueTime) {
                return a.dueTime.localeCompare(b.dueTime);
            }
            if (a.dueTime && !b.dueTime) return -1;
            if (!a.dueTime && b.dueTime) return 1;
            
            // Finally by creation date
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    /**
     * Group tasks by date for rendering
     */
    static groupTasksByDate(tasks) {
        const grouped = {};
        
        tasks.forEach(task => {
            const dateKey = task.dueDate || 'no-date';
            if (!grouped[dateKey]) {
                grouped[dateKey] = { date: dateKey, tasks: [] };
            }
            grouped[dateKey].tasks.push(task);
        });
        
        // Sort tasks within each group
        Object.keys(grouped).forEach(dateKey => {
            grouped[dateKey].tasks = this.sortTasks(grouped[dateKey].tasks);
        });
        
        // Sort groups by date
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'no-date') return 1;
            if (b === 'no-date') return -1;
            return new Date(a) - new Date(b);
        });
        
        const sortedGrouped = {};
        sortedKeys.forEach(key => {
            sortedGrouped[key] = grouped[key];
        });
        
        return sortedGrouped;
    }

    /**
     * Group tasks by time for Today view
     */
    static groupTasksByTime(tasks) {
        const eventTasks = tasks.filter(task => task.isEvent);
        const regularTasks = tasks.filter(task => !task.isEvent);
        
        const timedTasks = regularTasks.filter(task => task.dueTime);
        const untimedTasks = regularTasks.filter(task => !task.dueTime);
        
        // Sort timed tasks
        const sortedTimedTasks = this.sortTasks(timedTasks);
        const sortedUntimedTasks = this.sortTasks(untimedTasks);
        
        // Group by time slots
        const timeSlots = {};
        sortedTimedTasks.forEach(task => {
            const timeKey = task.dueTime;
            if (!timeSlots[timeKey]) {
                timeSlots[timeKey] = [];
            }
            timeSlots[timeKey].push(task);
        });

        return {
            events: this.sortTasks(eventTasks),
            timeSlots,
            untimed: sortedUntimedTasks
        };
    }

    /**
     * Check if task has tags
     */
    static hasTaskTags(task) {
        return false; // Simplified for now - can be enhanced
    }

    /**
     * Extract tags and clean text from task title
     */
    static extractTagsAndCleanText(text) {
        return {
            cleanText: text,
            tags: []
        };
    }

    /**
     * Make links clickable in text
     */
    static makeLinksClickable(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank" onclick="event.stopPropagation()">$1</a>');
    }

    /**
     * Check if task is overdue
     */
    static isOverdue(task) {
        return DateUtils.isOverdue(task);
    }

    /**
     * Get task display title with length limit
     */
    static getDisplayTitle(task, maxChars = 30) {
        let displayTitle = task.title;
        if (task.title.length > maxChars) {
            displayTitle = task.title.substring(0, maxChars) + '...';
        }
        return displayTitle;
    }

    /**
     * Get task card CSS class
     */
    static getTaskCardClass(task) {
        const isOverdue = this.isOverdue(task);
        const isEvent = task.isEvent;
        let cardClass = `task-card ${task.status}`;
        
        if (isEvent) {
            cardClass += ' event';
        } else if (isOverdue) {
            cardClass += ' overdue';
        }
        
        return cardClass;
    }

    /**
     * Get today's tasks including overdue (for Today view)
     */
    static getTodayTasks(tasks, todayDate, activeFilter = null) {
        const todayStr = DateUtils.getLocalDateString(todayDate);
        const isToday = DateUtils.isToday(todayStr);
        
        let todayTasks = tasks.filter(task => {
            // Exclude deleted tasks
            if (task.status === 'deleted') return false;
            
            // Show tasks for this specific date
            if (task.dueDate === todayStr) return true;
            
            // Only show overdue tasks if we're viewing TODAY (not past/future dates)
            if (isToday && task.dueDate && task.dueDate < todayStr && task.status === 'pending') {
                return true;
            }
            
            return false;
        });

        // Apply template filter if active
        if (activeFilter) {
            todayTasks = TemplateProcessor.filterTasksByTemplate(todayTasks, activeFilter);
        }

        return todayTasks;
    }

    /**
     * Filter tasks for current view with template support
     */
    static getViewTasks(tasks, viewType, viewDate, activeFilter = null) {
        switch (viewType) {
            case 'today':
                return this.getTodayTasks(tasks, viewDate, activeFilter);
            
            case 'week':
                const weekRange = DateUtils.getWeekRange(viewDate);
                const weekStart = DateUtils.getLocalDateString(weekRange.start);
                const weekEnd = DateUtils.getLocalDateString(weekRange.end);
                let weekTasks = this.getTasksForDateRange(tasks, weekStart, weekEnd);
                return activeFilter ? TemplateProcessor.filterTasksByTemplate(weekTasks, activeFilter) : weekTasks;
            
            case 'calendar':
                const monthRange = DateUtils.getMonthRange(viewDate);
                let monthTasks = tasks.filter(task => {
                    if (!task.dueDate || task.status === 'deleted') return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate.getFullYear() === monthRange.year && taskDate.getMonth() === monthRange.month;
                });
                return activeFilter ? TemplateProcessor.filterTasksByTemplate(monthTasks, activeFilter) : monthTasks;
            
            default:
                return tasks.filter(task => task.status !== 'deleted');
        }
    }

    /**
     * Get tasks for a specific date range
     */
    static getTasksForDateRange(tasks, startDateStr, endDateStr) {
        return tasks.filter(task => {
            if (!task.dueDate || task.status === 'deleted') return false;
            return task.dueDate >= startDateStr && task.dueDate <= endDateStr;
        });
    }
}

// Make available globally for backward compatibility
window.TaskUtils = TaskUtils;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskUtils;
}