// Data Operations Module
// Handles loading, saving, and manipulating task data in localStorage

import { validateTaskData, cleanTaskForStorage } from './tasks.js';

/**
 * Save tasks array to localStorage
 * @param {Array} tasks - Array of task objects to save
 * @returns {boolean} Success status
 */
export function saveTasksToLocalStorage(tasks) {
    try {
        const cleanedTasks = tasks.map(task => cleanTaskForStorage(task));
        localStorage.setItem('gtdTasks', JSON.stringify(cleanedTasks));
        console.log(`💾 Saved ${tasks.length} tasks to localStorage`);
        return true;
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
            console.log(`💾 Saved ${tasks.length} tasks (fallback method)`);
            return true;
        } catch (fallbackError) {
            console.error('Fallback save also failed:', fallbackError);
            return false;
        }
    }
}

/**
 * Load tasks from localStorage
 * @returns {Array} Array of validated task objects
 */
export function loadTasksFromLocalStorage() {
    try {
        const savedTasks = localStorage.getItem('gtdTasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);

            // Validate each task and filter out invalid ones
            const validatedTasks = parsedTasks
                .map(task => validateTaskData(task))
                .filter(task => task !== null);

            console.log(`📥 Loaded ${validatedTasks.length} tasks from localStorage`);
            return validatedTasks;
        }
        console.log('📥 No saved tasks found, starting fresh');
        return [];
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        return [];
    }
}

/**
 * Sort tasks array by status, date, time, and creation date
 * @param {Array} tasks - Array of task objects to sort
 * @returns {Array} Sorted array (modifies in place and returns)
 */
export function sortTasks(tasks) {
    return tasks.sort((a, b) => {
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

/**
 * Load event registry from localStorage
 * @returns {Set} Set of event task IDs
 */
export function loadEventRegistry() {
    try {
        const stored = localStorage.getItem('gtd_event_registry');
        if (stored) {
            const eventIds = new Set(JSON.parse(stored));
            console.log(`📥 Loaded ${eventIds.size} events from registry`);
            return eventIds;
        }
        return new Set();
    } catch (error) {
        console.error('Error loading Event Registry:', error);
        return new Set();
    }
}

/**
 * Save event registry to localStorage
 * @param {Set} eventTaskIds - Set of event task IDs
 * @returns {boolean} Success status
 */
export function saveEventRegistry(eventTaskIds) {
    try {
        localStorage.setItem('gtd_event_registry', JSON.stringify([...eventTaskIds]));
        console.log(`💾 Saved ${eventTaskIds.size} events to registry`);
        return true;
    } catch (error) {
        console.error('Error saving Event Registry:', error);
        return false;
    }
}

/**
 * Mark a task as an event
 * @param {Set} eventTaskIds - Set of event task IDs
 * @param {string} taskId - Task ID to mark as event
 * @returns {boolean} Success status
 */
export function markAsEvent(eventTaskIds, taskId) {
    eventTaskIds.add(taskId);
    return saveEventRegistry(eventTaskIds);
}

/**
 * Unmark a task as an event
 * @param {Set} eventTaskIds - Set of event task IDs
 * @param {string} taskId - Task ID to unmark as event
 * @returns {boolean} Success status
 */
export function unmarkAsEvent(eventTaskIds, taskId) {
    eventTaskIds.delete(taskId);
    return saveEventRegistry(eventTaskIds);
}

/**
 * Check if a task is registered as an event
 * @param {Set} eventTaskIds - Set of event task IDs
 * @param {string} taskId - Task ID to check
 * @returns {boolean} True if task is an event
 */
export function isRegisteredEvent(eventTaskIds, taskId) {
    return eventTaskIds.has(taskId);
}

/**
 * Restore isEvent properties from registry
 * @param {Array} tasks - Array of task objects
 * @param {Set} eventTaskIds - Set of event task IDs
 * @returns {number} Number of tasks healed
 */
export function healEventProperties(tasks, eventTaskIds) {
    let healedCount = 0;
    tasks.forEach(task => {
        if (eventTaskIds.has(task.id) && !task.isEvent) {
            task.isEvent = true;
            healedCount++;
        }
    });

    if (healedCount > 0) {
        console.log(`🩹 Healed ${healedCount} event properties`);
    }

    return healedCount;
}

/**
 * Clean up registry: Remove deleted task IDs
 * @param {Array} tasks - Array of task objects
 * @param {Set} eventTaskIds - Set of event task IDs
 * @returns {number} Number of IDs removed
 */
export function cleanEventRegistry(tasks, eventTaskIds) {
    const taskIdSet = new Set(tasks.map(t => t.id));
    const originalSize = eventTaskIds.size;

    const cleanedIds = new Set([...eventTaskIds].filter(id => taskIdSet.has(id)));

    const removedCount = originalSize - cleanedIds.size;
    if (removedCount > 0) {
        console.log(`🧹 Cleaned ${removedCount} deleted event IDs from registry`);
    }

    return removedCount;
}

/**
 * Filter tasks by date range
 * @param {Array} tasks - Array of task objects
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Filtered tasks
 */
export function filterTasksByDateRange(tasks, startDate, endDate) {
    return tasks.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= startDate && task.dueDate <= endDate;
    });
}

/**
 * Filter tasks by status
 * @param {Array} tasks - Array of task objects
 * @param {string} status - Status to filter by ('active', 'completed')
 * @returns {Array} Filtered tasks
 */
export function filterTasksByStatus(tasks, status) {
    return tasks.filter(task => task.status === status);
}

/**
 * Search tasks by text (title and notes)
 * @param {Array} tasks - Array of task objects
 * @param {string} searchText - Text to search for
 * @returns {Array} Matching tasks
 */
export function searchTasks(tasks, searchText) {
    if (!searchText || searchText.trim() === '') {
        return tasks;
    }

    const searchLower = searchText.toLowerCase().trim();
    return tasks.filter(task => {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchLower);
        const notesMatch = task.notes && task.notes.toLowerCase().includes(searchLower);
        return titleMatch || notesMatch;
    });
}

/**
 * Get tasks for a specific date
 * @param {Array} tasks - Array of task objects
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Array} Tasks for the specified date
 */
export function getTasksForDate(tasks, dateStr) {
    return tasks.filter(task => task.dueDate === dateStr);
}

/**
 * Get all active (non-completed) tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Active tasks
 */
export function getActiveTasks(tasks) {
    return filterTasksByStatus(tasks, 'active');
}

/**
 * Get all completed tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Completed tasks
 */
export function getCompletedTasks(tasks) {
    return filterTasksByStatus(tasks, 'completed');
}

console.log('✅ data-operations module loaded');
