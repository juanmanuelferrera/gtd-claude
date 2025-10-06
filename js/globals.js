/**
 * Global Variables Module for HyperFiler Pro
 * Ensures all modules have access to shared state
 */

// Ensure core globals are initialized
if (typeof window.tasks === 'undefined') {
    window.tasks = [];
}

if (typeof window.listSections === 'undefined') {
    window.listSections = [];
}

if (typeof window.customTemplates === 'undefined') {
    // Load templates from localStorage
    try {
        const stored = localStorage.getItem('gtdTemplates');
        window.customTemplates = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading templates:', error);
        window.customTemplates = [];
    }
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

// Utility function to check if all critical globals are initialized
window.checkGlobalsInitialized = function() {
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
};

// Function to reset all globals to safe defaults
window.resetGlobals = function() {
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
};

// Make key variables directly accessible without window prefix for backward compatibility
tasks = window.tasks;
listSections = window.listSections;
customTemplates = window.customTemplates;
currentView = window.currentView;
currentFilteredTasks = window.currentFilteredTasks;
selectedTasks = window.selectedTasks;
activeAllTasksTemplateFilter = window.activeAllTasksTemplateFilter;
currentTodayDate = window.currentTodayDate;
currentWeekDate = window.currentWeekDate;
currentCalendarDate = window.currentCalendarDate;
currentEditTaskId = window.currentEditTaskId;
undoStack = window.undoStack;
eventTaskIds = window.eventTaskIds;
currentLanguage = window.currentLanguage;
noteImagesData = window.noteImagesData;

// Check initialization on load
window.checkGlobalsInitialized();

console.log('✅ Global variables module loaded');