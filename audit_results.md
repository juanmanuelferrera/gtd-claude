# JavaScript Module Audit Results

## HTML Onclick Handler Functions Analysis

### Functions Referenced in HTML onclick Handlers:

#### ✅ FUNCTIONS FOUND IN MODULES:

**From ui.js:**
- `showView()` - ✅ Available globally
- `toggleMobileMoreMenu()` - ✅ Available
- `hideMobileMoreMenu()` - ✅ Available 
- `switchToMobileView()` - ✅ Available
- `previousDay()` - ✅ Available
- `nextDay()` - ✅ Available
- `goToToday()` - ✅ Available
- `previousMonth()` - ✅ Available
- `nextMonth()` - ✅ Available
- `goToCurrentMonth()` - ✅ Available
- `previousWeek()` - ✅ Available
- `nextWeek()` - ✅ Available
- `goToCurrentWeek()` - ✅ Available
- `showSettingsTab()` - ✅ Available

**From tasks.js:**
- `openAddTaskModal()` - ✅ Available globally
- `editTask()` - ✅ Available globally
- `saveTaskEdit()` - ✅ Available globally
- `closeTaskModal()` - ✅ Available globally
- `deleteTaskFromModal()` - ✅ Available globally
- `deleteTask()` - ✅ Available globally
- `delayTask()` - ✅ Available globally
- `toggleTaskStatus()` - ✅ Available globally
- `duplicateTask()` - ✅ Available globally

**From auth.js:**
- `logout()` - ✅ Available globally

#### ❌ CRITICAL MISSING FUNCTIONS:

**Mobile Functions:**
- `openAddTaskModalMobile()` - ❌ Missing
- `provideFeedback()` - ❌ Missing

**Search & Filter Functions:**
- `performSearch()` - ❌ Missing
- `quickSearch()` - ❌ Missing
- `performAllTasksSearch()` - ❌ Missing
- `clearAllTasksTemplateFilter()` - ❌ Missing
- `searchTodayTasks()` - ❌ Missing
- `searchMonthTasks()` - ❌ Missing
- `searchWeekTasks()` - ❌ Missing
- `searchRepeatTasks()` - ❌ Missing

**Action Functions:**
- `undoLastAction()` - ❌ Missing
- `deleteSelectedTasks()` - ❌ Missing
- `delaySelectedTasks()` - ❌ Missing
- `toggleSelectAll()` - ❌ Missing
- `openBulkTimeModal()` - ❌ Missing
- `expandAllGroups()` - ❌ Missing
- `collapseAllGroups()` - ❌ Missing

**Export/Import Functions:**
- `exportTasks()` - ❌ Missing
- `importTasks()` - ❌ Missing
- `exportAllTasks()` - ❌ Missing
- `createEmergencyBackup()` - ❌ Missing
- `downloadTodayHtml()` - ❌ Missing
- `exportRepeatHtml()` - ❌ Missing
- `printSearchResults()` - ❌ Missing

**Data Management:**
- `clearAllTasks()` - ❌ Missing
- `performUndo()` - ❌ Missing
- `refreshUndoView()` - ❌ Missing
- `checkAllBackups()` - ❌ Missing

**List Management:**
- `openCreateSectionModal()` - ❌ Missing
- `toggleAllSections()` - ❌ Missing
- `showListSelectionForTXTImport()` - ❌ Missing
- `openTrash()` - ❌ Missing

**Modal & UI Functions:**
- `openDateTimeModal()` - ❌ Missing
- `closeDateTimeModal()` - ❌ Missing
- `applyDesktopDateTime()` - ❌ Missing
- `applyMobileDateTime()` - ❌ Missing
- `triggerImageUpload()` - ❌ Missing
- `handleImageUpload()` - ❌ Missing
- `addNewTemplate()` - ❌ Missing
- `resetTaskTitle()` - ❌ Missing
- `openSettings()` - ❌ Missing

**Settings & Language:**
- `switchLanguage()` - ❌ Missing
- `saveAutoPrintTime()` - ❌ Missing
- `updateSyncPeriod()` - ❌ Missing

#### ⚠️ PARTIAL INPUT HANDLERS:

**Input Event Handlers:**
- `performMobileSearch()` - ❌ Missing (oninput handler)
- `searchTodayTasks()` - ❌ Missing (oninput handler)
- `searchMonthTasks()` - ❌ Missing (oninput handler) 
- `searchWeekTasks()` - ❌ Missing (oninput handler)
- `searchRepeatTasks()` - ❌ Missing (oninput handler)
- `handleImageUpload()` - ❌ Missing (onchange handler)

## Global Variable Issues:

### ❌ Missing Global Variables:
- `listSections` - Referenced in ui.js but not properly initialized
- `customTemplates` - Referenced in tasks.js but may not be globally accessible
- `currentView` - Referenced across modules but not properly shared

### ⚠️ Dependency Issues:
- Many UI functions in tasks.js check for existence with `typeof function === 'function'`
- Cross-module function calls may fail if functions aren't globally exposed

## Module Loading Order Issues:

**Current HTML order:**
1. utils.js
2. auth.js 
3. tasks.js
4. ui.js
5. sync.js
6. patches.js

**⚠️ Potential Issues:**
- `tasks.js` calls UI functions that may not be loaded yet
- Global variables not properly initialized before use
- Some functions may be overwritten by patches.js

## Critical Missing Functionality:

1. **Complete Search System** - All search functions missing
2. **Mobile Interface** - Mobile-specific functions missing
3. **Import/Export System** - All data management functions missing
4. **List Management** - Complete list CRUD operations missing
5. **Modal Management** - DateTime and other modals missing
6. **Bulk Operations** - Selection and bulk actions missing
7. **Settings System** - Language switching and preferences missing

## Immediate Action Required:

The application is missing approximately **40+ critical functions** that are directly called from HTML onclick handlers. This will result in JavaScript errors and broken functionality across the entire application.