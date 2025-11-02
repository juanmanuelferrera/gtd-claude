// Core Utility Functions Module
// Extracted from extracted_js.js - Pure functions with no global dependencies

/**
 * Normalize dueTime values consistently across the app
 * @param {string|null|undefined} dueTime - Time string to normalize
 * @returns {string|null} Normalized time or null
 */
export function normalizeDueTime(dueTime) {
    // Convert any falsy value OR "00:00" OR "untimed" to null for consistent handling
    if (!dueTime || dueTime === '' || dueTime === undefined || dueTime === '00:00' || dueTime === 'untimed') {
        return null;
    }
    return dueTime;
}

/**
 * Escape HTML by converting to text (prevents XSS)
 * @param {string} text - Input text
 * @returns {string} HTML-escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date for display (short format)
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr) {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date for filename (YYYY-MM-DD)
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date for filename
 */
export function formatDateForFilename(dateStr) {
    if (!dateStr) return 'no-date';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time string for display
 * @param {string} timeStr - Time string
 * @returns {string} Formatted time (24-hour format)
 */
export function formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr; // Display in 24-hour format
}

/**
 * Get local date string (YYYY-MM-DD) avoiding timezone issues
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} Local date string
 */
export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Validate and sanitize task input
 * @param {string} input - User input
 * @returns {string|null} Cleaned input or null
 */
export function validateTaskInput(input) {
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

/**
 * Validate task title
 * @param {string} title - Task title
 * @returns {string|null} Validated title or null
 */
export function validateTaskTitle(title) {
    const cleaned = validateTaskInput(title);
    return cleaned && cleaned.length > 0 && cleaned.length <= 200 ? cleaned : null;
}

/**
 * Validate task notes
 * @param {string} notes - Task notes
 * @returns {string} Validated notes
 */
export function validateTaskNotes(notes) {
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

    return cleaned;
}

console.log('✅ Utils module loaded');
