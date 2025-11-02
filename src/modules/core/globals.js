// Global State Module
// Manages application-wide state and ensures all modules have access to shared state

/**
 * Initialize all global state variables
 * Sets up window.* variables for backward compatibility during migration
 * @returns {boolean} True if initialization succeeded
 */
export function initializeGlobals() {
    console.log('🚀 Initializing global state...');

    // Core data globals
    if (typeof window.tasks === 'undefined') {
        window.tasks = [];
    }

    if (typeof window.listSections === 'undefined') {
        window.listSections = [];
    }

    if (typeof window.customTemplates === 'undefined') {
        console.log('🌐 Initializing window.customTemplates from globals module');
        // Load templates from localStorage
        try {
            const stored = localStorage.getItem('gtdTemplates');
            console.log('🌐 localStorage gtdTemplates:', stored);
            window.customTemplates = stored ? JSON.parse(stored) : [];
            console.log('🌐 Set window.customTemplates to:', window.customTemplates);
            console.log('🌐 window.customTemplates length:', window.customTemplates.length);
        } catch (error) {
            console.error('🌐 Error loading templates in globals module:', error);
            window.customTemplates = [];
        }
    } else {
        console.log('🌐 window.customTemplates already defined:', window.customTemplates);
    }

    if (typeof window.currentView === 'undefined') {
        window.currentView = 'today';
    }

    if (typeof window.currentFilteredTasks === 'undefined') {
        window.currentFilteredTasks = [];
    }

    if (typeof window.selectedTasks === 'undefined') {
        window.selectedTasks = new Set();
    }

    if (typeof window.activeAllTasksTemplateFilter === 'undefined') {
        window.activeAllTasksTemplateFilter = null;
    }

    // Date-related globals
    if (typeof window.currentTodayDate === 'undefined') {
        window.currentTodayDate = new Date();
    }

    if (typeof window.currentWeekDate === 'undefined') {
        window.currentWeekDate = new Date();
    }

    if (typeof window.currentCalendarDate === 'undefined') {
        window.currentCalendarDate = new Date();
    }

    // UI state globals
    if (typeof window.mobileMoreMenuOpen === 'undefined') {
        window.mobileMoreMenuOpen = false;
    }

    // Task management globals
    if (typeof window.currentEditTaskId === 'undefined') {
        window.currentEditTaskId = null;
    }

    if (typeof window.undoStack === 'undefined') {
        window.undoStack = [];
    }

    if (typeof window.maxUndoSteps === 'undefined') {
        window.maxUndoSteps = 5;
    }

    if (typeof window.draggedTask === 'undefined') {
        window.draggedTask = null;
    }

    if (typeof window.isSaving === 'undefined') {
        window.isSaving = false;
    }

    // Event registry
    if (typeof window.eventTaskIds === 'undefined') {
        window.eventTaskIds = new Set();
    }

    // Language and settings
    if (typeof window.currentLanguage === 'undefined') {
        window.currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
    }

    // Image handling placeholder
    if (typeof window.noteImagesData === 'undefined') {
        window.noteImagesData = [];
    }

    // Sync protection flags
    if (typeof window.justModifiedTasks === 'undefined') {
        window.justModifiedTasks = false;
    }

    if (typeof window.justModifiedLists === 'undefined') {
        window.justModifiedLists = false;
    }

    if (typeof window.justModifiedTemplates === 'undefined') {
        window.justModifiedTemplates = false;
    }

    if (typeof window.staleBrowserDetected === 'undefined') {
        window.staleBrowserDetected = false;
    }

    if (typeof window.skipInitialUpload === 'undefined') {
        window.skipInitialUpload = false;
    }

    if (typeof window.forceMandatoryRefresh === 'undefined') {
        window.forceMandatoryRefresh = false;
    }

    if (typeof window.backupRestoreInProgress === 'undefined') {
        window.backupRestoreInProgress = false;
    }

    if (typeof window.justRestoredBackup === 'undefined') {
        window.justRestoredBackup = false;
    }

    if (typeof window.skipNextDownload === 'undefined') {
        window.skipNextDownload = false;
    }

    // Authentication state
    if (typeof window.currentUser === 'undefined') {
        window.currentUser = null;
    }

    if (typeof window.accessDeniedShown === 'undefined') {
        window.accessDeniedShown = false;
    }

    // App state
    if (typeof window.hasLoadedOnce === 'undefined') {
        window.hasLoadedOnce = false;
    }

    if (typeof window.modalSaving === 'undefined') {
        window.modalSaving = false;
    }

    if (typeof window.manualTimeSet === 'undefined') {
        window.manualTimeSet = false;
    }

    // Ensure globals are accessible from all contexts
    window.global = window;
    window.globalThis = window;

    console.log('✅ Global state initialized');
    return true;
}

/**
 * Check if all critical globals are initialized
 * @returns {boolean} True if all critical globals exist
 */
export function checkGlobalsInitialized() {
    const criticalGlobals = [
        'tasks', 'listSections', 'customTemplates', 'currentView',
        'currentFilteredTasks', 'selectedTasks', 'activeAllTasksTemplateFilter',
        'currentTodayDate', 'currentWeekDate', 'currentCalendarDate',
        'currentEditTaskId', 'undoStack', 'eventTaskIds',
        'currentLanguage', 'noteImagesData'
    ];

    const missing = criticalGlobals.filter(global => typeof window[global] === 'undefined');

    if (missing.length > 0) {
        console.warn('⚠️ Missing global variables:', missing);
        return false;
    }

    console.log('✅ All critical global variables initialized');
    return true;
}

/**
 * Reset all globals to safe defaults
 * Useful for testing or clearing app state
 */
export function resetGlobals() {
    window.tasks = [];
    window.listSections = [];
    window.customTemplates = [];
    window.currentView = 'today';
    window.currentFilteredTasks = [];
    window.selectedTasks = new Set();
    window.activeAllTasksTemplateFilter = null;
    window.currentTodayDate = new Date();
    window.currentWeekDate = new Date();
    window.currentCalendarDate = new Date();
    window.currentEditTaskId = null;
    window.undoStack = [];
    window.eventTaskIds = new Set();
    window.noteImagesData = [];
    window.justModifiedTasks = false;
    window.justModifiedLists = false;
    window.justModifiedTemplates = false;
    window.modalSaving = false;
    window.manualTimeSet = false;

    console.log('🔄 All globals reset to defaults');
}

/**
 * Get current global state as an object
 * @returns {Object} Current global state
 */
export function getGlobalState() {
    return {
        tasks: window.tasks,
        listSections: window.listSections,
        customTemplates: window.customTemplates,
        currentView: window.currentView,
        currentFilteredTasks: window.currentFilteredTasks,
        selectedTasks: Array.from(window.selectedTasks),
        activeAllTasksTemplateFilter: window.activeAllTasksTemplateFilter,
        currentTodayDate: window.currentTodayDate,
        currentWeekDate: window.currentWeekDate,
        currentCalendarDate: window.currentCalendarDate,
        currentEditTaskId: window.currentEditTaskId,
        undoStack: window.undoStack,
        eventTaskIds: Array.from(window.eventTaskIds),
        currentLanguage: window.currentLanguage,
        noteImagesData: window.noteImagesData,
        // Sync flags
        justModifiedTasks: window.justModifiedTasks,
        justModifiedLists: window.justModifiedLists,
        justModifiedTemplates: window.justModifiedTemplates,
        staleBrowserDetected: window.staleBrowserDetected,
        skipInitialUpload: window.skipInitialUpload,
        forceMandatoryRefresh: window.forceMandatoryRefresh,
        backupRestoreInProgress: window.backupRestoreInProgress,
        justRestoredBackup: window.justRestoredBackup,
        skipNextDownload: window.skipNextDownload,
        // Auth state
        currentUser: window.currentUser,
        accessDeniedShown: window.accessDeniedShown,
        // App state
        hasLoadedOnce: window.hasLoadedOnce,
        modalSaving: window.modalSaving,
        manualTimeSet: window.manualTimeSet
    };
}

/**
 * Get list of all critical global variable names
 * @returns {Array<string>} Array of global variable names
 */
export function getCriticalGlobalNames() {
    return [
        'tasks', 'listSections', 'customTemplates', 'currentView',
        'currentFilteredTasks', 'selectedTasks', 'activeAllTasksTemplateFilter',
        'currentTodayDate', 'currentWeekDate', 'currentCalendarDate',
        'currentEditTaskId', 'undoStack', 'eventTaskIds',
        'currentLanguage', 'noteImagesData'
    ];
}

/**
 * Get list of all global variable names (including non-critical)
 * @returns {Array<string>} Array of all global variable names
 */
export function getAllGlobalNames() {
    return [
        // Critical globals
        'tasks', 'listSections', 'customTemplates', 'currentView',
        'currentFilteredTasks', 'selectedTasks', 'activeAllTasksTemplateFilter',
        'currentTodayDate', 'currentWeekDate', 'currentCalendarDate',
        'currentEditTaskId', 'undoStack', 'eventTaskIds',
        'currentLanguage', 'noteImagesData',
        // Sync flags
        'justModifiedTasks', 'justModifiedLists', 'justModifiedTemplates',
        'staleBrowserDetected', 'skipInitialUpload', 'forceMandatoryRefresh',
        'backupRestoreInProgress', 'justRestoredBackup', 'skipNextDownload',
        // Auth state
        'currentUser', 'accessDeniedShown',
        // App state
        'hasLoadedOnce', 'modalSaving', 'manualTimeSet',
        // UI state
        'mobileMoreMenuOpen', 'draggedTask', 'isSaving', 'maxUndoSteps'
    ];
}

/**
 * Check if a specific global is initialized
 * @param {string} globalName - Name of the global variable
 * @returns {boolean} True if the global is initialized
 */
export function isGlobalInitialized(globalName) {
    return typeof window[globalName] !== 'undefined';
}

console.log('✅ globals module loaded');
