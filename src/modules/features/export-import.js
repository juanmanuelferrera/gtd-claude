// Export/Import Module
// Utilities for exporting and importing data (JSON, text, HTML)

import { formatDateForFilename } from '../core/utils.js';

/**
 * Create a Blob object from data
 * @param {string} content - Content to put in blob
 * @param {string} mimeType - MIME type (default: text/plain)
 * @returns {Blob} Blob object
 */
export function createBlob(content, mimeType = 'text/plain;charset=utf-8') {
    return new Blob([content], { type: mimeType });
}

/**
 * Create a download link and trigger download
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for download
 * @returns {boolean} Success status
 */
export function downloadBlob(blob, filename) {
    try {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        return true;
    } catch (error) {
        console.error('Error downloading blob:', error);
        return false;
    }
}

/**
 * Download text file
 * @param {string} content - Text content
 * @param {string} filename - Filename
 * @returns {boolean} Success status
 */
export function downloadTextFile(content, filename) {
    const blob = createBlob(content, 'text/plain;charset=utf-8');
    return downloadBlob(blob, filename);
}

/**
 * Download JSON file
 * @param {Object|Array} data - Data to export as JSON
 * @param {string} filename - Filename
 * @param {boolean} pretty - Pretty print JSON (default: true)
 * @returns {boolean} Success status
 */
export function downloadJSON(data, filename, pretty = true) {
    try {
        const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        const blob = createBlob(jsonString, 'application/json');
        return downloadBlob(blob, filename);
    } catch (error) {
        console.error('Error downloading JSON:', error);
        return false;
    }
}

/**
 * Download HTML file
 * @param {string} htmlContent - HTML content
 * @param {string} filename - Filename
 * @returns {boolean} Success status
 */
export function downloadHTML(htmlContent, filename) {
    const blob = createBlob(htmlContent, 'text/html;charset=utf-8');
    return downloadBlob(blob, filename);
}

/**
 * Generate filename with date
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (without dot)
 * @param {Date} date - Date to use (default: now)
 * @returns {string} Generated filename
 */
export function generateFilename(prefix, extension, date = new Date()) {
    const dateStr = formatDateForFilename(date);
    return `${prefix}-${dateStr}.${extension}`;
}

/**
 * Export tasks to JSON file
 * @param {Array} tasks - Tasks array
 * @param {string} filename - Optional custom filename
 * @returns {boolean} Success status
 */
export function exportTasksToJSON(tasks, filename = null) {
    const finalFilename = filename || generateFilename('hyperfiler-tasks', 'json');
    console.log(`📁 Exporting ${tasks.length} tasks to ${finalFilename}`);
    return downloadJSON(tasks, finalFilename);
}

/**
 * Export tasks to plain text
 * @param {Array} tasks - Tasks array
 * @param {string} filename - Optional custom filename
 * @returns {boolean} Success status
 */
export function exportTasksToText(tasks, filename = null) {
    const finalFilename = filename || generateFilename('hyperfiler-tasks', 'txt');

    // Convert tasks to plain text
    const lines = tasks.map(task => {
        let line = `- ${task.title}`;
        if (task.dueDate) line += ` (Due: ${task.dueDate})`;
        if (task.notes) line += `\n  Notes: ${task.notes}`;
        return line;
    });

    const content = lines.join('\n\n');
    console.log(`📁 Exporting ${tasks.length} tasks to ${finalFilename}`);
    return downloadTextFile(content, finalFilename);
}

/**
 * Parse JSON from string safely
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|Array|null} Parsed data or null on error
 */
export function parseJSON(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
    }
}

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} File content as text
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * Import tasks from JSON file
 * @param {File} file - JSON file
 * @returns {Promise<Array|null>} Imported tasks or null on error
 */
export async function importTasksFromJSON(file) {
    try {
        const content = await readFileAsText(file);
        const tasks = parseJSON(content);

        if (!Array.isArray(tasks)) {
            console.error('Invalid JSON: not an array');
            return null;
        }

        console.log(`📥 Imported ${tasks.length} tasks from ${file.name}`);
        return tasks;
    } catch (error) {
        console.error('Error importing JSON:', error);
        return null;
    }
}

/**
 * Import tasks from text file
 * @param {File} file - Text file
 * @returns {Promise<Array|null>} Imported tasks or null on error
 */
export async function importTasksFromText(file) {
    try {
        const content = await readFileAsText(file);
        const lines = content.split('\n').filter(line => line.trim());

        const tasks = lines.map((line, index) => {
            // Simple parser: each line is a task title
            const cleaned = line.replace(/^[-*•]\s*/, '').trim();
            return {
                id: Date.now() + index,
                title: cleaned,
                status: 'active',
                createdAt: new Date().toISOString()
            };
        });

        console.log(`📥 Imported ${tasks.length} tasks from ${file.name}`);
        return tasks;
    } catch (error) {
        console.error('Error importing text:', error);
        return null;
    }
}

/**
 * Validate tasks array
 * @param {Array} tasks - Tasks to validate
 * @returns {boolean} True if valid
 */
export function validateTasksArray(tasks) {
    if (!Array.isArray(tasks)) {
        return false;
    }

    // Check if each task has required fields
    return tasks.every(task => {
        return task.id && task.title && typeof task.status === 'string';
    });
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} Extension (lowercase, without dot)
 */
export function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if file is JSON
 * @param {File|string} file - File object or filename
 * @returns {boolean} True if JSON file
 */
export function isJSONFile(file) {
    const name = typeof file === 'string' ? file : file.name;
    return getFileExtension(name) === 'json';
}

/**
 * Check if file is text
 * @param {File|string} file - File object or filename
 * @returns {boolean} True if text file
 */
export function isTextFile(file) {
    const name = typeof file === 'string' ? file : file.name;
    const ext = getFileExtension(name);
    return ['txt', 'text'].includes(ext);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('📋 Copied to clipboard');
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            return false;
        }
    }
}

console.log('✅ export-import module loaded');
