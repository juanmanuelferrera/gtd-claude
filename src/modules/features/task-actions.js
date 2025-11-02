// Task Actions Module
// Pure utility functions for task manipulation (duplicate, delay, etc.)

import { generateTaskId, createTaskObject } from './tasks.js';
import { getLocalDateString } from '../core/utils.js';

/**
 * Create a duplicate of a task object
 * @param {Object} task - Task to duplicate
 * @param {Object} options - Duplication options
 * @returns {Object} New task object (duplicate)
 */
export function duplicateTaskObject(task, options = {}) {
    const {
        addCopyLabel = true,
        resetStatus = true,
        preserveImages = true,
        preserveRepeat = true
    } = options;

    const newTask = {
        ...task,
        id: generateTaskId(),
        title: addCopyLabel ? `${task.title} (Copy)` : task.title,
        status: resetStatus ? 'active' : task.status,
        images: preserveImages && task.images ? [...task.images] : [],
        repeat: preserveRepeat ? task.repeat : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };

    return newTask;
}

/**
 * Calculate delayed date
 * @param {string|Date} currentDate - Current date
 * @param {number} days - Number of days to delay (30 = 1 month)
 * @returns {string} New date in YYYY-MM-DD format
 */
export function calculateDelayedDate(currentDate, days) {
    const date = currentDate instanceof Date ? currentDate : new Date(currentDate);
    const newDate = new Date(date);

    // Handle month addition properly for +1M button (30 days = 1 month)
    if (days === 30) {
        // Add 1 month properly
        newDate.setMonth(newDate.getMonth() + 1);
    } else {
        // Add days for +1D (1 day) and +1W (7 days)
        newDate.setDate(newDate.getDate() + days);
    }

    return getLocalDateString(newDate);
}

/**
 * Apply delay to a task object
 * @param {Object} task - Task to delay
 * @param {number} days - Number of days to delay
 * @returns {Object} Updated task object
 */
export function applyDelayToTask(task, days) {
    const currentDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const newDate = calculateDelayedDate(currentDate, days);

    return {
        ...task,
        dueDate: newDate,
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
}

/**
 * Calculate next repeat date based on repeat type
 * @param {string} currentDate - Current date (YYYY-MM-DD)
 * @param {string} repeatType - Repeat type (daily, weekly, bi-weekly, monthly, yearly)
 * @returns {string} Next date in YYYY-MM-DD format
 */
export function calculateNextRepeatDate(currentDate, repeatType) {
    const date = new Date(currentDate);
    const newDate = new Date(date);

    switch (repeatType) {
        case 'daily':
            newDate.setDate(newDate.getDate() + 1);
            break;
        case 'weekly':
            newDate.setDate(newDate.getDate() + 7);
            break;
        case 'bi-weekly':
            newDate.setDate(newDate.getDate() + 14);
            break;
        case 'monthly':
            newDate.setMonth(newDate.getMonth() + 1);
            break;
        case 'yearly':
            newDate.setFullYear(newDate.getFullYear() + 1);
            break;
        default:
            return currentDate; // No repeat
    }

    return getLocalDateString(newDate);
}

/**
 * Create next occurrence of a repeating task
 * @param {Object} task - Repeating task
 * @returns {Object|null} New task object for next occurrence, or null if not repeating
 */
export function createNextRepeatOccurrence(task) {
    if (!task.repeat) {
        return null;
    }

    const nextDate = calculateNextRepeatDate(task.dueDate, task.repeat);

    return createTaskObject({
        ...task,
        id: generateTaskId(),
        dueDate: nextDate,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    });
}

/**
 * Prepare task for quick add with template
 * @param {string} templateName - Template name
 * @param {Object} options - Options for task creation
 * @returns {Object} New task object
 */
export function prepareQuickAddTask(templateName, options = {}) {
    const {
        date = getLocalDateString(),
        time = null,
        status = 'active'
    } = options;

    return createTaskObject({
        title: `@ ${templateName}`,
        notes: '',
        dueDate: date,
        dueTime: time,
        status: status,
        template: templateName,
        repeat: null,
        isEvent: false
    });
}

/**
 * Get delay options (common delay periods)
 * @returns {Array} Array of delay options
 */
export function getDelayOptions() {
    return [
        { label: '+1D', days: 1, description: 'Tomorrow' },
        { label: '+1W', days: 7, description: 'Next week' },
        { label: '+1M', days: 30, description: 'Next month' }
    ];
}

/**
 * Get repeat type options
 * @returns {Array} Array of repeat type options
 */
export function getRepeatOptions() {
    return [
        { value: null, label: 'No Repeat' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'bi-weekly', label: 'Bi-weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];
}

/**
 * Validate repeat type
 * @param {string} repeatType - Repeat type to validate
 * @returns {boolean} True if valid repeat type
 */
export function isValidRepeatType(repeatType) {
    const validTypes = ['daily', 'weekly', 'bi-weekly', 'monthly', 'yearly'];
    return repeatType === null || validTypes.includes(repeatType);
}

/**
 * Calculate days until date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {number} Number of days until date (negative if past)
 */
export function getDaysUntilDate(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Format days until as human-readable string
 * @param {number} days - Number of days
 * @returns {string} Human-readable string
 */
export function formatDaysUntil(days) {
    if (days === null) return 'No due date';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0) return `In ${days} days`;
    return `${Math.abs(days)} days ago`;
}

console.log('✅ task-actions module loaded');
