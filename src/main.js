// HyperFiler Pro - Main Entry Point (Modular Version)
// This will gradually replace extracted_js.js

console.log('🚀 HyperFiler Pro v4.5.5 - Modular Architecture Loading...');

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
import {
    generateTaskId,
    createTaskObject,
    validateTaskData,
    cleanTaskForStorage,
    taskHasImages,
    isTaskOverdue,
    isTaskToday,
    isTaskFuture,
    isTaskCompleted,
    isTaskActive,
    getTaskStatusText
} from './modules/features/tasks.js';
import {
    translations,
    getCurrentLanguage,
    setLanguage,
    t,
    translateText,
    getAvailableLanguages,
    isLanguageSupported,
    getLanguageTranslations,
    addTranslations,
    getTranslationStats
} from './modules/core/i18n.js';
import {
    saveTasksToLocalStorage,
    loadTasksFromLocalStorage,
    sortTasks,
    loadEventRegistry,
    saveEventRegistry,
    markAsEvent,
    unmarkAsEvent,
    isRegisteredEvent,
    healEventProperties,
    cleanEventRegistry,
    filterTasksByDateRange,
    filterTasksByStatus,
    searchTasks,
    getTasksForDate,
    getActiveTasks,
    getCompletedTasks
} from './modules/features/data-operations.js';
import {
    loadTemplates,
    saveTemplates,
    validateTemplate,
    addTemplate,
    deleteTemplate,
    hasTemplate,
    getTemplates,
    getTemplateCount,
    searchTemplates,
    sortTemplates,
    getDefaultTemplates,
    resetToDefaults
} from './modules/features/templates.js';

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
window.generateTaskId = generateTaskId;
window.createTaskObject = createTaskObject;
window.validateTaskData = validateTaskData;
window.cleanTaskForStorage = cleanTaskForStorage;
window.taskHasImages = taskHasImages;
window.isTaskOverdue = isTaskOverdue;
window.isTaskToday = isTaskToday;
window.isTaskFuture = isTaskFuture;
window.isTaskCompleted = isTaskCompleted;
window.isTaskActive = isTaskActive;
window.getTaskStatusText = getTaskStatusText;
window.translations = translations;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;
window.t = t;
window.translateText = translateText;
window.getAvailableLanguages = getAvailableLanguages;
window.isLanguageSupported = isLanguageSupported;
window.getLanguageTranslations = getLanguageTranslations;
window.addTranslations = addTranslations;
window.getTranslationStats = getTranslationStats;
window.saveTasksToLocalStorage = saveTasksToLocalStorage;
window.loadTasksFromLocalStorage = loadTasksFromLocalStorage;
window.sortTasks = sortTasks;
window.loadEventRegistry = loadEventRegistry;
window.saveEventRegistry = saveEventRegistry;
window.markAsEvent = markAsEvent;
window.unmarkAsEvent = unmarkAsEvent;
window.isRegisteredEvent = isRegisteredEvent;
window.healEventProperties = healEventProperties;
window.cleanEventRegistry = cleanEventRegistry;
window.filterTasksByDateRange = filterTasksByDateRange;
window.filterTasksByStatus = filterTasksByStatus;
window.searchTasks = searchTasks;
window.getTasksForDate = getTasksForDate;
window.getActiveTasks = getActiveTasks;
window.getCompletedTasks = getCompletedTasks;
window.loadTemplates = loadTemplates;
window.saveTemplates = saveTemplates;
window.validateTemplate = validateTemplate;
window.addTemplate = addTemplate;
window.deleteTemplate = deleteTemplate;
window.hasTemplate = hasTemplate;
window.getTemplates = getTemplates;
window.getTemplateCount = getTemplateCount;
window.searchTemplates = searchTemplates;
window.sortTemplates = sortTemplates;
window.getDefaultTemplates = getDefaultTemplates;
window.resetToDefaults = resetToDefaults;

console.log('✅ Modular system initialized');
console.log('📦 Modules loaded: sanitization, utils, storage, tasks, i18n, data-operations, templates');

// TODO: Gradually import more modules as we migrate functions
// import { TaskManager } from './modules/features/tasks.js';
// import { SyncEngine } from './modules/features/sync.js';
// import { AuthManager } from './modules/features/auth.js';
