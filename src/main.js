// HyperFiler Pro - Main Entry Point (Modular Version)
// This will gradually replace extracted_js.js

console.log('🚀 HyperFiler Pro v4.5.14 - Modular Architecture Loading...');

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
import {
    duplicateTaskObject,
    calculateDelayedDate,
    applyDelayToTask,
    calculateNextRepeatDate,
    createNextRepeatOccurrence,
    prepareQuickAddTask,
    getDelayOptions,
    getRepeatOptions,
    isValidRepeatType,
    getDaysUntilDate,
    formatDaysUntil
} from './modules/features/task-actions.js';
import {
    createBlob,
    downloadBlob,
    downloadTextFile,
    downloadJSON,
    downloadHTML,
    generateFilename,
    exportTasksToJSON,
    exportTasksToText,
    parseJSON,
    readFileAsText,
    importTasksFromJSON,
    importTasksFromText,
    validateTasksArray,
    getFileExtension,
    isJSONFile,
    isTextFile,
    copyToClipboard
} from './modules/features/export-import.js';
import {
    createUndoManager,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoStack,
    getRedoStack,
    clearUndoStack,
    clearRedoStack,
    clearAllStacks,
    setMaxUndoSteps,
    getUndoHistory,
    getUndoState
} from './modules/features/undo.js';
import {
    TOAST_CONFIG,
    TOAST_TYPES,
    initializeToastContainer,
    createToast,
    showToast,
    hideToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    clearAllToasts,
    getActiveToastCount,
    getToastContainer
} from './modules/ui/notifications.js';
import {
    initializeDarkMode,
    applyDarkMode,
    toggleDarkMode,
    resetToSystemPreference,
    createToggleButton,
    updateToggleButton,
    getDarkModeState,
    isDarkModeEnabled,
    enableDarkMode,
    disableDarkMode
} from './modules/ui/dark-mode.js';
import {
    KEYBOARD_SHORTCUTS,
    createKeyboardShortcutsModal,
    showKeyboardShortcutsModal,
    closeKeyboardShortcutsModal,
    toggleKeyboardShortcutsModal,
    isKeyboardShortcutsModalOpen,
    getKeyboardShortcuts,
    initializeKeyboardShortcutsHelp
} from './modules/ui/keyboard-shortcuts.js';
import {
    NETWORK_CHECK_INTERVAL,
    CONNECTION_TIMEOUT,
    PING_ENDPOINT,
    addNetworkStatusListener,
    removeNetworkStatusListener,
    notifyNetworkStatusChange,
    getNetworkStatus,
    testNetworkConnectivity,
    updateNetworkStatus,
    handleOnlineEvent,
    handleOfflineEvent,
    initializeNetworkStatus,
    getNetworkIndicator,
    shouldShowOfflineIndicators,
    refreshNetworkStatus,
    isCurrentlyOnline,
    getConnectionQuality
} from './modules/features/network-status.js';
import {
    getDateForRelative,
    getDateForWeekday,
    getDateForRelativePeriod,
    normalizeTime,
    extractMetadata,
    NL_PATTERNS,
    parseNaturalLanguage,
    applyParsedData,
    setupNaturalLanguageInput,
    initializeNaturalLanguage
} from './modules/features/natural-language.js';

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
window.duplicateTaskObject = duplicateTaskObject;
window.calculateDelayedDate = calculateDelayedDate;
window.applyDelayToTask = applyDelayToTask;
window.calculateNextRepeatDate = calculateNextRepeatDate;
window.createNextRepeatOccurrence = createNextRepeatOccurrence;
window.prepareQuickAddTask = prepareQuickAddTask;
window.getDelayOptions = getDelayOptions;
window.getRepeatOptions = getRepeatOptions;
window.isValidRepeatType = isValidRepeatType;
window.getDaysUntilDate = getDaysUntilDate;
window.formatDaysUntil = formatDaysUntil;
window.createBlob = createBlob;
window.downloadBlob = downloadBlob;
window.downloadTextFile = downloadTextFile;
window.downloadJSON = downloadJSON;
window.downloadHTML = downloadHTML;
window.generateFilename = generateFilename;
window.exportTasksToJSON = exportTasksToJSON;
window.exportTasksToText = exportTasksToText;
window.parseJSON = parseJSON;
window.readFileAsText = readFileAsText;
window.importTasksFromJSON = importTasksFromJSON;
window.importTasksFromText = importTasksFromText;
window.validateTasksArray = validateTasksArray;
window.getFileExtension = getFileExtension;
window.isJSONFile = isJSONFile;
window.isTextFile = isTextFile;
window.copyToClipboard = copyToClipboard;
window.createUndoManager = createUndoManager;
window.saveState = saveState;
window.undo = undo;
window.redo = redo;
window.canUndo = canUndo;
window.canRedo = canRedo;
window.getUndoStack = getUndoStack;
window.getRedoStack = getRedoStack;
window.clearUndoStack = clearUndoStack;
window.clearRedoStack = clearRedoStack;
window.clearAllStacks = clearAllStacks;
window.setMaxUndoSteps = setMaxUndoSteps;
window.getUndoHistory = getUndoHistory;
window.getUndoState = getUndoState;
window.TOAST_CONFIG = TOAST_CONFIG;
window.TOAST_TYPES = TOAST_TYPES;
window.initializeToastContainer = initializeToastContainer;
window.createToast = createToast;
window.showToast = showToast;
window.hideToast = hideToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;
window.clearAllToasts = clearAllToasts;
window.getActiveToastCount = getActiveToastCount;
window.getToastContainer = getToastContainer;

// Create toast convenience object for backward compatibility
window.toast = {
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
    show: showToast,
    clearAll: clearAllToasts
};
window.initializeDarkMode = initializeDarkMode;
window.applyDarkMode = applyDarkMode;
window.toggleDarkMode = toggleDarkMode;
window.resetToSystemPreference = resetToSystemPreference;
window.createToggleButton = createToggleButton;
window.updateToggleButton = updateToggleButton;
window.getDarkModeState = getDarkModeState;
window.isDarkModeEnabled = isDarkModeEnabled;
window.enableDarkMode = enableDarkMode;
window.disableDarkMode = disableDarkMode;
window.KEYBOARD_SHORTCUTS = KEYBOARD_SHORTCUTS;
window.createKeyboardShortcutsModal = createKeyboardShortcutsModal;
window.showKeyboardShortcutsModal = showKeyboardShortcutsModal;
window.closeKeyboardShortcutsModal = closeKeyboardShortcutsModal;
window.toggleKeyboardShortcutsModal = toggleKeyboardShortcutsModal;
window.isKeyboardShortcutsModalOpen = isKeyboardShortcutsModalOpen;
window.getKeyboardShortcuts = getKeyboardShortcuts;
window.initializeKeyboardShortcutsHelp = initializeKeyboardShortcutsHelp;
window.NETWORK_CHECK_INTERVAL = NETWORK_CHECK_INTERVAL;
window.CONNECTION_TIMEOUT = CONNECTION_TIMEOUT;
window.PING_ENDPOINT = PING_ENDPOINT;
window.addNetworkStatusListener = addNetworkStatusListener;
window.removeNetworkStatusListener = removeNetworkStatusListener;
window.notifyNetworkStatusChange = notifyNetworkStatusChange;
window.getNetworkStatus = getNetworkStatus;
window.testNetworkConnectivity = testNetworkConnectivity;
window.updateNetworkStatus = updateNetworkStatus;
window.handleOnlineEvent = handleOnlineEvent;
window.handleOfflineEvent = handleOfflineEvent;
window.initializeNetworkStatus = initializeNetworkStatus;
window.getNetworkIndicator = getNetworkIndicator;
window.shouldShowOfflineIndicators = shouldShowOfflineIndicators;
window.refreshNetworkStatus = refreshNetworkStatus;
window.isCurrentlyOnline = isCurrentlyOnline;
window.getConnectionQuality = getConnectionQuality;

// Create networkStatus convenience object for backward compatibility
window.networkStatus = {
    getStatus: getNetworkStatus,
    getIndicator: getNetworkIndicator,
    isOnline: isCurrentlyOnline,
    getQuality: getConnectionQuality,
    addListener: addNetworkStatusListener,
    removeListener: removeNetworkStatusListener,
    refresh: refreshNetworkStatus,
    update: updateNetworkStatus,
    shouldShowOfflineIndicators: shouldShowOfflineIndicators,
    initialize: initializeNetworkStatus
};
window.getDateForRelative = getDateForRelative;
window.getDateForWeekday = getDateForWeekday;
window.getDateForRelativePeriod = getDateForRelativePeriod;
window.normalizeTime = normalizeTime;
window.extractMetadata = extractMetadata;
window.NL_PATTERNS = NL_PATTERNS;
window.parseNaturalLanguage = parseNaturalLanguage;
window.applyParsedData = applyParsedData;
window.setupNaturalLanguageInput = setupNaturalLanguageInput;
window.initializeNaturalLanguage = initializeNaturalLanguage;

console.log('✅ Modular system initialized');
console.log('📦 Modules loaded: sanitization, utils, storage, tasks, i18n, data-operations, templates, task-actions, export-import, undo, notifications, dark-mode, keyboard-shortcuts, network-status, natural-language');

// TODO: Gradually import more modules as we migrate functions
// import { TaskManager } from './modules/features/tasks.js';
// import { SyncEngine } from './modules/features/sync.js';
// import { AuthManager } from './modules/features/auth.js';
