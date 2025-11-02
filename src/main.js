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
import {
    getLocal,
    setLocal,
    removeLocal,
    clearLocal,
    getSession,
    setSession,
    removeSession,
    clearSession,
    isLocalStorageAvailable,
    isSessionStorageAvailable
} from './modules/core/storage.js';

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
window.getLocal = getLocal;
window.setLocal = setLocal;
window.removeLocal = removeLocal;
window.clearLocal = clearLocal;
window.getSession = getSession;
window.setSession = setSession;
window.removeSession = removeSession;
window.clearSession = clearSession;
window.isLocalStorageAvailable = isLocalStorageAvailable;
window.isSessionStorageAvailable = isSessionStorageAvailable;

console.log('✅ Modular system initialized');
console.log('📦 Modules loaded: sanitization, utils, storage');

// TODO: Gradually import more modules as we migrate functions
// import { TaskManager } from './modules/features/tasks.js';
// import { SyncEngine } from './modules/features/sync.js';
// import { AuthManager } from './modules/features/auth.js';
