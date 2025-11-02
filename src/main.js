// HyperFiler Pro - Main Entry Point (Modular Version)
// This will gradually replace extracted_js.js

console.log('🚀 HyperFiler Pro v4.5.1 - Modular Architecture Loading...');

// Import core utilities
import { sanitizeHTML, sanitizeInput } from './modules/core/sanitization.js';
import {
    normalizeDueTime,
    escapeHtml,
    formatDate,
    formatDateForFilename,
    formatTime,
    getLocalDateString,
    validateTaskInput,
    validateTaskTitle,
    validateTaskNotes
} from './modules/core/utils.js';

// Make functions globally available (for backward compatibility during migration)
window.sanitizeHTML = sanitizeHTML;
window.sanitizeInput = sanitizeInput;
window.normalizeDueTime = normalizeDueTime;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.formatDateForFilename = formatDateForFilename;
window.formatTime = formatTime;
window.getLocalDateString = getLocalDateString;
window.validateTaskInput = validateTaskInput;
window.validateTaskTitle = validateTaskTitle;
window.validateTaskNotes = validateTaskNotes;

console.log('✅ Modular system initialized');
console.log('📦 Modules loaded: sanitization, utils');

// TODO: Gradually import more modules as we migrate functions
// import { TaskManager } from './modules/features/tasks.js';
// import { SyncEngine } from './modules/features/sync.js';
// import { AuthManager } from './modules/features/auth.js';
