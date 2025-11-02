// Task Utilities Module
// Pure helper functions for task operations

import { sanitizeInput } from '../core/sanitization.js';
import { getLocalDateString } from '../core/utils.js';

/**
 * Generate unique task ID
 * @returns {string} Unique task ID based on timestamp
 */
export function generateTaskId() {
    return Date.now().toString();
}

/**
 * Create a new task object with default values
 * @param {Object} data - Task data
 * @returns {Object} Complete task object
 */
export function createTaskObject(data = {}) {
    const now = new Date().toISOString();
    return {
        id: data.id || generateTaskId(),
        title: sanitizeInput(data.title || ''),
        notes: sanitizeInput(data.notes || ''),
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
        status: data.status || 'active',
        repeat: data.repeat || null,
        template: sanitizeInput(data.template || ''),
        isEvent: Boolean(data.isEvent),
        priority: data.priority || null,
        images: data.images || [],
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        lastModified: data.lastModified || now
    };
}

/**
 * Validate and sanitize task data
 * @param {Object} task - Task object
 * @returns {Object|null} Validated task or null if invalid
 */
export function validateTaskData(task) {
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
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        lastModified: task.lastModified
    };
}

/**
 * Clean task object for storage (remove circular references, excess data)
 * @param {Object} task - Task object
 * @returns {Object} Cleaned task object
 */
export function cleanTaskForStorage(task) {
    const cleanTask = {};

    // Copy only essential properties
    const allowedProps = [
        'id', 'title', 'notes', 'dueDate', 'dueTime', 'status',
        'repeatType', 'template', 'createdAt', 'updatedAt',
        'isDeleted', 'isEvent', 'repeat', 'priority', 'images',
        'lastModified'
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
 * Check if task has images
 * @param {Object} task - Task object
 * @returns {boolean} True if task has images
 */
export function taskHasImages(task) {
    return false; // Images feature currently disabled
}

/**
 * Check if task is overdue
 * @param {Object} task - Task object
 * @returns {boolean} True if task is overdue
 */
export function isTaskOverdue(task) {
    if (!task.dueDate) return false;

    const today = getLocalDateString();
    return task.dueDate < today && task.status !== 'completed';
}

/**
 * Check if task is due today
 * @param {Object} task - Task object
 * @returns {boolean} True if task is due today
 */
export function isTaskToday(task) {
    if (!task.dueDate) return false;

    const today = getLocalDateString();
    return task.dueDate === today;
}

/**
 * Check if task is due in the future
 * @param {Object} task - Task object
 * @returns {boolean} True if task is due in future
 */
export function isTaskFuture(task) {
    if (!task.dueDate) return false;

    const today = getLocalDateString();
    return task.dueDate > today;
}

/**
 * Check if task is completed
 * @param {Object} task - Task object
 * @returns {boolean} True if task is completed
 */
export function isTaskCompleted(task) {
    return task && task.status === 'completed';
}

/**
 * Check if task is active (not completed, not deleted)
 * @param {Object} task - Task object
 * @returns {boolean} True if task is active
 */
export function isTaskActive(task) {
    return task && task.status === 'active' && !task.isDeleted;
}

/**
 * Get task status display text
 * @param {Object} task - Task object
 * @returns {string} Status display text
 */
export function getTaskStatusText(task) {
    if (!task) return 'Unknown';
    if (task.status === 'completed') return 'Completed';
    if (task.isDeleted) return 'Deleted';
    if (isTaskOverdue(task)) return 'Overdue';
    if (isTaskToday(task)) return 'Due Today';
    if (isTaskFuture(task)) return 'Upcoming';
    return 'Active';
}

console.log('✅ Tasks module loaded');
