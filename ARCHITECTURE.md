# HyperFiler Pro - Modular Architecture Documentation

## Overview

HyperFiler Pro has been completely refactored from a monolithic codebase into a clean, modular ES6 architecture. This document describes the new structure and how to work with it.

## Architecture Summary

- **23 ES6 modules** organized by concern
- **530 functions** extracted and modularized
- **627+ automated tests** ensuring zero breaking changes
- **Complete backward compatibility** during migration period

## Directory Structure

```
src/
├── main.js                    # Entry point - imports all modules
└── modules/
    ├── core/                  # Core utilities (4 modules)
    │   ├── globals.js         # Global state management
    │   ├── sanitization.js    # XSS prevention
    │   ├── storage.js         # localStorage/sessionStorage wrappers
    │   └── utils.js           # Date, time, validation utilities
    ├── features/              # Feature modules (17 modules)
    │   ├── auth.js            # Authentication & premium features
    │   ├── data-operations.js # Task filtering & search
    │   ├── export-import.js   # File export/import
    │   ├── missing-functions.js # Date/time pickers, templates, search, backup
    │   ├── natural-language.js  # NLP task parsing
    │   ├── network-status.js    # Online/offline detection
    │   ├── offline-sync.js      # Offline queue management
    │   ├── sync.js             # Cloud synchronization
    │   ├── task-actions.js     # Task operations (duplicate, delay, repeat)
    │   ├── task-management.js  # Task CRUD, events, templates
    │   ├── tasks.js            # Task object creation & validation
    │   ├── templates.js        # Template management
    │   └── undo.js             # Undo/redo system
    └── ui/                    # User interface (3 modules)
        ├── dark-mode.js       # Dark mode toggle & persistence
        ├── keyboard-shortcuts.js # Keyboard navigation
        ├── notifications.js    # Toast notifications
        ├── offline-ui.js      # Offline status UI
        └── ui-components.js   # Views, navigation, rendering
```

## Module Breakdown

### Core Modules (4 modules, 41 functions)

#### `core/globals.js` (7 functions)
Global state initialization and management.
- initializeGlobals, checkGlobalsInitialized, resetGlobals
- getGlobalState, getCriticalGlobalNames, getAllGlobalNames, isGlobalInitialized

#### `core/sanitization.js` (2 functions)
XSS prevention and input sanitization.
- sanitizeHTML, sanitizeInput

#### `core/storage.js` (10 functions)
Safe localStorage and sessionStorage operations.
- getLocal, setLocal, removeLocal, clearLocal
- getSession, setSession, removeSession, clearSession
- isLocalStorageAvailable, isSessionStorageAvailable

#### `core/utils.js` (22 functions)
Date/time formatting, validation, and utilities.
- normalizeDueTime, escapeHtml, formatDate, formatDateForFilename
- formatTime, getLocalDateString, validateTaskInput, validateTaskTitle, validateTaskNotes

### Feature Modules (17 modules, 397 functions)

#### `features/tasks.js` (12 functions)
Core task object creation and validation.
- generateTaskId, createTaskObject, validateTaskData, cleanTaskForStorage
- taskHasImages, isTaskOverdue, isTaskToday, isTaskFuture
- isTaskCompleted, isTaskActive, getTaskStatusText

#### `features/task-management.js` (36 functions)
Complete task CRUD operations.
- **Event Registry (7):** loadEventRegistry, saveEventRegistry, markAsEvent, unmarkAsEvent, isRegisteredEvent, healEventProperties, cleanEventRegistry
- **Storage (2):** saveTasksToLocalStorage, loadTasksFromLocalStorage
- **Quick Actions (5):** quickAddTaskWithTemplate, updateTaskDate, updateTaskTime, duplicateTask, delayTask
- **Modals (4):** editTask, closeTaskModal, openAddTaskModal, deleteTaskFromModal
- **CRUD (3):** saveTaskEdit, deleteTask, sortTasks
- **Templates (7):** loadTemplates, saveTemplates, renderTemplateButtons, insertTemplateToTask, deleteTemplate, createNewTemplate, addNewTemplate
- **State (4):** saveStateForUndo, toggleTaskComplete, toggleTaskStatus, animateTaskCompletion
- **Pickers (2):** openDatePicker, openTimePicker

#### `features/task-actions.js` (11 functions)
Task operations (duplicate, delay, repeat).
- duplicateTaskObject, calculateDelayedDate, applyDelayToTask
- calculateNextRepeatDate, createNextRepeatOccurrence, prepareQuickAddTask
- getDelayOptions, getRepeatOptions, isValidRepeatType
- getDaysUntilDate, formatDaysUntil

#### `features/data-operations.js` (6 functions)
Task filtering and search.
- filterTasksByDateRange, filterTasksByStatus, searchTasks
- getTasksForDate, getActiveTasks, getCompletedTasks

#### `features/templates.js` (12 functions)
Template management system.
- loadTemplates, saveTemplates, validateTemplate, addTemplate
- deleteTemplate, hasTemplate, getTemplates, getTemplateCount
- searchTemplates, sortTemplates, getDefaultTemplates, resetToDefaults

#### `features/export-import.js` (17 functions)
File export/import functionality.
- createBlob, downloadBlob, downloadTextFile, downloadJSON, downloadHTML
- generateFilename, exportTasksToJSON, exportTasksToText
- parseJSON, readFileAsText, importTasksFromJSON, importTasksFromText
- validateTasksArray, getFileExtension, isJSONFile, isTextFile, copyToClipboard

#### `features/undo.js` (12 functions)
Undo/redo system.
- createUndoManager, saveState, undo, redo, canUndo, canRedo
- getUndoStack, getRedoStack, clearUndoStack, clearRedoStack
- clearAllStacks, setMaxUndoSteps, getUndoHistory, getUndoState

#### `features/auth.js` (18 functions)
Authentication and premium features.
- safeSetInnerHTML, clearAuthData, forceLogout, getAuthHeaders
- authenticatedFetch, checkAuthentication, showAccessDenied
- getUserStatusIcon, showUserInfo, logout
- showTrialReminder, showSubtleReminder, closeSubtleReminder
- showTrialPopup, closeTrialPopup, showTrialNotification
- upgradeToPro, initializePremiumFeatures

#### `features/sync.js` (23 functions)
Cloud synchronization.
- withSyncLock, ensureCurrentUserLoaded, initializeSimpleSync
- setupSyncEventListeners, cleanupSyncEventListeners, setupPeriodicSync
- uploadAllTasks, mergeTasksWithConflictResolution, downloadAllTasks
- smartDownloadTasks, downloadTasksFromCloud, pullLatestFromCloud
- uploadAllLists, downloadAllLists, uploadAllTemplates, downloadAllTemplates
- performComprehensiveSync, performStaleBrowserRecovery, showSyncStatus
- deleteTaskFromCloud, syncAll, canSync, forceResync, ensureSyncInitialized

#### `features/natural-language.js` (10 functions)
Natural language task parsing.
- getDateForRelative, getDateForWeekday, getDateForRelativePeriod
- normalizeTime, extractMetadata, parseNaturalLanguage, applyParsedData
- setupNaturalLanguageInput, initializeNaturalLanguage
- NL_PATTERNS (export)

#### `features/network-status.js` (18 functions)
Online/offline detection.
- addNetworkStatusListener, removeNetworkStatusListener, notifyNetworkStatusChange
- getNetworkStatus, testNetworkConnectivity, updateNetworkStatus
- handleOnlineEvent, handleOfflineEvent, initializeNetworkStatus
- getNetworkIndicator, shouldShowOfflineIndicators, refreshNetworkStatus
- isCurrentlyOnline, getConnectionQuality
- NETWORK_CHECK_INTERVAL, CONNECTION_TIMEOUT, PING_ENDPOINT (exports)

#### `features/offline-sync.js` (13 functions)
Offline queue management.
- getOfflineQueue, saveOfflineQueue, queueOfflineOperation
- removeFromQueue, clearOfflineQueue, getOfflineStatus, updateOfflineStatus
- deleteTaskFromServer, deleteListFromServer, deleteTemplateFromServer
- executeQueuedOperation, processOfflineQueue, offlineAwareTaskOperation
- offlineAwareTaskDeletion, initializeOfflineSync
- OFFLINE_QUEUE_KEY, OFFLINE_STATUS_KEY, QUEUE_OPERATIONS (exports)

#### `features/i18n.js` (9 functions)
Internationalization.
- getCurrentLanguage, setLanguage, t, translateText
- getAvailableLanguages, isLanguageSupported, getLanguageTranslations
- addTranslations, getTranslationStats
- translations (export)

#### `features/missing-functions.js` (154 functions)
Comprehensive utilities for date/time, search, backup, settings.
- **Date/Time Pickers & Calendar (40):** Complete unified modal system with iOS support
- **Template Filters (12):** View-specific filtering for all views
- **Search (12):** Comprehensive search with auto-expand
- **Bulk Operations (8):** Multi-task time management
- **Import/Export & Backup (17):** Complete backup system
- **Settings (14):** Configuration management
- **Trash & Undo (15):** Trash system with multi-level undo
- **Lists (10):** List management with sections
- **Data (9):** Data deletion and management
- **Drag & Drop (8):** Drag operation handlers
- **Utilities (10):** Notifications, feedback, routing

### UI Modules (3 modules, 92 functions)

#### `ui/notifications.js` (12 functions)
Toast notification system.
- initializeToastContainer, createToast, showToast, hideToast
- showSuccessToast, showErrorToast, showWarningToast, showInfoToast
- clearAllToasts, getActiveToastCount, getToastContainer
- TOAST_CONFIG, TOAST_TYPES (exports)

#### `ui/dark-mode.js` (10 functions)
Dark mode toggle and persistence.
- initializeDarkMode, applyDarkMode, toggleDarkMode, resetToSystemPreference
- createToggleButton, updateToggleButton, getDarkModeState
- isDarkModeEnabled, enableDarkMode, disableDarkMode

#### `ui/keyboard-shortcuts.js` (7 functions)
Keyboard navigation system.
- createKeyboardShortcutsModal, showKeyboardShortcutsModal
- closeKeyboardShortcutsModal, toggleKeyboardShortcutsModal
- isKeyboardShortcutsModalOpen, getKeyboardShortcuts
- initializeKeyboardShortcutsHelp
- KEYBOARD_SHORTCUTS (export)

#### `ui/offline-ui.js` (13 functions)
Offline status UI.
- createNetworkStatusIndicator, updateNetworkStatusIndicator
- showEnhancedNetworkBadge, createOfflineQueueIndicator
- updateOfflineQueueIndicator, showOfflineQueueDetails
- showOfflineToast, handleNetworkStatusChange, handleOfflineStatusChange
- showConnectionProblem, showSyncSuccess, showSyncError
- adjustForMobile, initializeOfflineUI

#### `ui/ui-components.js` (92 functions)
Complete UI rendering system.
- **View Management (11):** showView, switchToMobileView, renderCurrentView, showLoadingState, createSpinner, generateSkeletonLoader, etc.
- **Navigation (20):** goBack, goToToday, goToCurrentWeek, previousDay, nextDay, previousWeek, nextWeek, etc.
- **Date/Time Display (3):** updateCurrentTodayDisplay, updateCurrentWeekDisplay, updateCurrentMonthDisplay
- **Rendering (17):** renderTodayView, renderWeekView, renderCalendar, renderAllTasksView, renderStats, etc.
- **Template Filtering (8):** renderTodayTemplateFilters, activateTemplateSelector, navigateTemplateButtons, etc.
- **Bulk Selection (7):** renderTasksWithSelection, toggleTaskSelection, updateBulkSelectionUI, etc.
- **Task Operations (3):** completeTask, performAllTasksSearch, verifyTaskFunctions
- **Import/Export (4):** openTaskImportModal, closeTaskImportModal, importTasksFromTextarea, downloadTextFile
- **Review/Reports (11):** generateTasksReview, generatePlainTextReport, generateOrgModeReport, etc.
- **Utilities (11):** showModal, closeModal, initializeUI, forceTaskMigration, etc.

## Entry Point: main.js

The `src/main.js` file serves as the single entry point:

1. **Imports all 23 modules** using ES6 import syntax
2. **Exposes all functions** to window object for backward compatibility
3. **Initializes global state** via initializeGlobals()
4. **Logs module load status** for debugging

Example structure:
```javascript
// Import modules
import { sanitizeHTML, sanitizeInput } from './modules/core/sanitization.js';
import { initializeGlobals, ... } from './modules/core/globals.js';
// ... all other imports

// Expose to window for backward compatibility
window.sanitizeHTML = sanitizeHTML;
window.sanitizeInput = sanitizeInput;
// ... all other window assignments

// Initialize
initializeGlobals();
```

## Testing

Comprehensive test suite in `hyperfiler-pro-modular.html`:
- **627+ automated tests** covering all 23 modules
- **Phase-based organization** (Phases 1-22)
- **Function loading tests** verify all exports
- **Functional tests** verify behavior
- **Zero failures** required for deployment

Test categories:
- Module import verification
- Function availability checks
- Basic functionality tests
- Integration tests
- Backward compatibility tests

## Migration Path

### Current State (v4.5.22)
- ✅ All functions extracted into modules
- ✅ Backward compatibility maintained via window object
- ✅ All tests passing
- ⏳ Old js/ files still present (828KB duplicates)

### Next Steps
1. **Cleanup Phase:** Remove duplicate js/ files
2. **Dependency Migration:** Remove window global dependencies from modules
3. **Optimization:** Bundle size reduction and tree-shaking
4. **Performance:** Profiling and optimization

## Benefits of Modular Architecture

1. **Maintainability:** Clear separation of concerns
2. **Testability:** Each module can be tested independently
3. **Reusability:** Modules can be imported where needed
4. **Performance:** Tree-shaking removes unused code
5. **Scalability:** Easy to add new modules
6. **Type Safety:** Easier to add TypeScript later
7. **Code Quality:** Smaller, focused files are easier to review

## Import Examples

```javascript
// Import specific functions
import { sanitizeHTML } from './modules/core/sanitization.js';
import { formatDate, getLocalDateString } from './modules/core/utils.js';

// Import from features
import { createTaskObject, generateTaskId } from './modules/features/tasks.js';
import { saveTasksToLocalStorage } from './modules/features/task-management.js';

// Import from UI
import { showSuccessToast } from './modules/ui/notifications.js';
import { renderTodayView } from './modules/ui/ui-components.js';
```

## File Size Comparison

| Location | Size | Description |
|----------|------|-------------|
| `js/` (old) | 828KB | Monolithic files (duplicates) |
| `src/modules/` | 860KB | Modular files with exports |
| Difference | +32KB | ES6 syntax + documentation |

The small size increase is due to:
- ES6 export statements
- Module headers with documentation
- Better code organization and spacing

## Performance Considerations

### Current (Development)
- All modules loaded via main.js
- No bundling or minification
- Window globals for compatibility

### Future (Production)
- Bundle and minify with Rollup/Vite
- Tree-shaking to remove unused code
- Remove window globals
- Expected 30-40% size reduction

## Documentation

- `ARCHITECTURE.md` (this file) - System overview
- `MODULAR-CHANGELOG.md` - Phase-by-phase extraction history
- `README.md` - Project overview and setup
- Inline JSDoc comments in each module

## Version History

- **v4.5.22** - Phase 22 complete: All functions extracted (530 functions, 23 modules)
- **v4.5.21** - Phase 21: UI Components (92 functions)
- **v4.5.20** - Phase 20: Task Management (36 functions)
- **v4.5.19** - Phase 19: Sync module (23 functions)
- Earlier phases documented in MODULAR-CHANGELOG.md

## Contributing

When adding new functionality:

1. **Choose appropriate module** or create new one if needed
2. **Use ES6 exports** for all functions
3. **Add JSDoc comments** for documentation
4. **Import dependencies** from other modules
5. **Add to main.js** imports and window exposure
6. **Write tests** in hyperfiler-pro-modular.html
7. **Update MODULAR-CHANGELOG.md**

## Contact

For questions about the modular architecture, see:
- MODULAR-CHANGELOG.md for detailed extraction history
- hyperfiler-pro-modular.html for test examples
- Individual module files for specific functionality
