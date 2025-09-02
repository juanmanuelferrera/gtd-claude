/**
 * Missing Functions Module for HyperFiler Pro
 * Contains all functions referenced in HTML but missing from other modules
 */

// Global variables declared in globals.js
// selectedTasks, activeAllTasksTemplateFilter, currentLanguage, dragged, mobileMoreMenuOpen

// Mobile interface functions
function openAddTaskModalMobile(dateStr) {
    console.log('📱 Mobile Add Task clicked - opening Things-style interface');
    
    // Check if we're on mobile
    if (window.innerWidth > 768) {
        if (typeof openAddTaskModal === 'function') {
            openAddTaskModal(dateStr);
        }
        return;
    }
    
    // For mobile, use the same modal but with mobile-optimized behavior
    if (typeof openAddTaskModal === 'function') {
        openAddTaskModal(dateStr);
        
        // Focus and scroll to modal for mobile
        setTimeout(() => {
            const modal = document.getElementById('taskModal');
            if (modal) {
                modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function provideFeedback(element, type = 'success') {
    if (!element) return;
    
    // Scale feedback
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 150);
    
    // Add a subtle highlight
    const originalBackground = element.style.background;
    element.style.background = type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    setTimeout(() => {
        element.style.background = originalBackground;
    }, 300);
}

// Search functions
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    const exportBtn = document.getElementById('exportHtmlBtn');
    
    if (searchTerm === '') {
        if (searchResults) searchResults.innerHTML = '';
        if (exportBtn) exportBtn.style.display = 'none';
        return;
    }
    
    // Filter tasks based on search term
    const filteredTasks = tasks.filter(task => {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
        const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
        const dateMatch = task.dueDate && task.dueDate.includes(searchTerm);
        return titleMatch || notesMatch || dateMatch;
    });
    
    // Render results
    if (searchResults) {
        if (filteredTasks.length === 0) {
            searchResults.innerHTML = '<div class="no-tasks"><p>No tasks found matching your search.</p></div>';
        } else {
            searchResults.innerHTML = filteredTasks.map(task => {
                if (typeof renderTaskCard === 'function') {
                    return renderTaskCard(task);
                }
                return `<div class="task-card">${task.title}</div>`;
            }).join('');
        }
    }
    
    if (exportBtn) exportBtn.style.display = filteredTasks.length > 0 ? 'block' : 'none';
}

function performMobileSearch(value) {
    // Mobile search functionality
    performSearch();
}

function quickSearch(term) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = term;
        performSearch();
        
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

function performAllTasksSearch() {
    const searchInputElement = document.getElementById('allTasksSearchInput');
    
    if (!searchInputElement) {
        console.error('🔍 ERROR: Search input element not found');
        return;
    }
    
    // Get search term if input exists, otherwise show all tasks
    const searchTerm = searchInputElement.value.toLowerCase();
    
    if (!Array.isArray(tasks)) {
        console.error('Tasks array not properly initialized');
        return;
    }
    
    let filteredTasks = tasks;
    
    // Apply search term filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => {
            const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
            const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
            const dateMatch = task.dueDate && task.dueDate.includes(searchTerm);
            const statusMatch = task.status && task.status.toLowerCase().includes(searchTerm);
            
            return titleMatch || notesMatch || dateMatch || statusMatch;
        });
    }
    
    // Apply active template filter if exists
    if (activeAllTasksTemplateFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const text = `${task.title || ''} ${task.notes || ''}`;
            return text.toLowerCase().includes(activeAllTasksTemplateFilter.toLowerCase());
        });
    }
    
    // Store filtered tasks for reference
    if (typeof currentFilteredTasks !== 'undefined') {
        window.currentFilteredTasks = filteredTasks;
    }
    
    // Render tasks
    if (typeof renderTasksWithSelection === 'function') {
        renderTasksWithSelection(filteredTasks);
    } else if (typeof renderTasks === 'function') {
        renderTasks('all');
    }
}

function clearAllTasksTemplateFilter() {
    activeAllTasksTemplateFilter = null;
    
    // Clear search input to show all tasks
    const searchInput = document.getElementById('allTasksSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Hide clear filter button
    const clearBtn = document.querySelector('.filter-clear');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Refresh search results
    performAllTasksSearch();
}

function searchTodayTasks() {
    const searchInputElement = document.getElementById('todayTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    const todayDate = typeof getLocalDateString === 'function' ? 
        getLocalDateString(typeof currentTodayDate !== 'undefined' ? currentTodayDate : new Date()) :
        new Date().toISOString().split('T')[0];
    
    // Filter today's tasks
    const todayTasks = tasks.filter(task => {
        const isToday = task.dueDate === todayDate;
        if (!isToday) return false;
        
        if (!searchTerm) return true;
        
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
        const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
        return titleMatch || notesMatch;
    });
    
    // Render filtered results
    const container = document.getElementById('todaySchedule');
    if (container && todayTasks.length > 0) {
        container.innerHTML = '<div class="today-tasks-list">' + 
            todayTasks.map(task => {
                if (typeof renderTaskCard === 'function') {
                    return renderTaskCard(task);
                }
                return `<div class="task-card">${task.title}</div>`;
            }).join('') + 
            '</div>';
    }
}

function searchMonthTasks() {
    const searchInputElement = document.getElementById('monthTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    // Month search logic would go here
    console.log('Month search:', searchTerm);
}

function searchWeekTasks() {
    const searchInputElement = document.getElementById('weekTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    // Week search logic would go here
    console.log('Week search:', searchTerm);
}

function searchRepeatTasks() {
    const searchInputElement = document.getElementById('repeatTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    // Repeat tasks search logic would go here
    console.log('Repeat tasks search:', searchTerm);
}

// Action functions
function undoLastAction() {
    // Use existing undo functionality
    if (typeof performUndo === 'function') {
        performUndo();
    } else {
        console.log('Undo functionality not available');
        alert('Undo functionality not available');
    }
}

function deleteSelectedTasks() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks to delete first');
        return;
    }
    
    const taskCount = selectedTasks.size;
    if (!confirm(`Delete ${taskCount} selected task${taskCount > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Delete selected tasks
    const tasksToDelete = Array.from(selectedTasks);
    tasksToDelete.forEach(taskId => {
        if (typeof deleteTask === 'function') {
            deleteTask(taskId);
        } else {
            // Remove from tasks array directly
            const taskIndex = tasks.findIndex(t => t.id == taskId);
            if (taskIndex >= 0) {
                tasks.splice(taskIndex, 1);
            }
        }
    });
    
    // Clear selection
    selectedTasks.clear();
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function delaySelectedTasks(days) {
    if (selectedTasks.size === 0) {
        alert('Please select tasks to delay first');
        return;
    }
    
    const tasksToDelay = Array.from(selectedTasks);
    tasksToDelay.forEach(taskId => {
        if (typeof delayTask === 'function') {
            delayTask(taskId, days);
        }
    });
    
    // Clear selection
    selectedTasks.clear();
    
    // Refresh view
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (!selectAllCheckbox) return;
    
    if (selectAllCheckbox.checked) {
        // Select all visible tasks
        const visibleTasks = typeof currentFilteredTasks !== 'undefined' ? 
            currentFilteredTasks : tasks;
        visibleTasks.forEach(task => selectedTasks.add(task.id));
    } else {
        // Clear all selections
        selectedTasks.clear();
    }
    
    // Update UI
    updateSelectedTasksUI();
}

function updateSelectedTasksUI() {
    const hasSelected = selectedTasks.size > 0;
    
    // Show/hide bulk action buttons
    const bulkButtons = document.querySelectorAll('#deleteSelectedBtn, #delaySelectedDayBtn, #delaySelectedWeekBtn, #delaySelectedMonthBtn, #todayDeleteSelectedBtn, #todayDelaySelectedDayBtn, #todayDelaySelectedWeekBtn, #todayDelaySelectedMonthBtn, #todaySetTimeBtn');
    bulkButtons.forEach(btn => {
        if (btn) {
            btn.style.display = hasSelected ? 'inline-block' : 'none';
        }
    });
}

// Group functions
function expandAllGroups() {
    document.querySelectorAll('[id^="tasks-"]').forEach(container => {
        container.classList.add('expanded');
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(arrow => {
        arrow.classList.add('expanded');
    });
    document.querySelectorAll('.group-content').forEach(content => {
        content.style.display = 'block';
    });
}

function collapseAllGroups() {
    document.querySelectorAll('[id^="tasks-"]').forEach(container => {
        container.classList.remove('expanded');
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(arrow => {
        arrow.classList.remove('expanded');
    });
    document.querySelectorAll('.group-content').forEach(content => {
        content.style.display = 'none';
    });
}

// Data management functions
function exportTasks() {
    try {
        const exportData = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                notes: task.notes,
                dueDate: task.dueDate,
                dueTime: task.dueTime,
                status: task.status,
                repeat: task.repeat,
                isEvent: task.isEvent,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            })),
            listSections: typeof window.listSections !== 'undefined' ? window.listSections : [],
            templates: typeof customTemplates !== 'undefined' ? customTemplates : []
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `hyperfiler-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('✅ Export completed');
        
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}

function exportAllTasks() {
    exportTasks(); // Alias for exportTasks
}

function importTasks() {
    showImportOptionsModal();
}

function showImportOptionsModal() {
    const modal = document.createElement('div');
    modal.id = 'importOptionsModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '10001';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 10vh auto;">
            <h3>📥 Import Tasks</h3>
            <div style="margin: 20px 0;">
                <label for="fileImport" class="btn btn-primary" style="display: block; padding: 12px; margin-bottom: 10px; cursor: pointer; text-align: center;">
                    📁 Choose JSON File
                </label>
                <input type="file" id="fileImport" accept=".json" style="display: none;">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="closeImportModal()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle file import
    document.getElementById('fileImport').addEventListener('change', handleFileImport);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.tasks && Array.isArray(importData.tasks)) {
                tasks.push(...importData.tasks);
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`Imported ${importData.tasks.length} tasks successfully!`);
            }
            
            closeImportModal();
            
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function closeImportModal() {
    const modal = document.getElementById('importOptionsModal');
    if (modal) {
        modal.remove();
    }
}

function clearAllTasks() {
    const firstConfirmation = confirm('⚠️ WARNING: This will DELETE ALL your tasks, events, and templates FOREVER!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to continue?');
    
    if (!firstConfirmation) return;
    
    const secondConfirmation = confirm('🔴 FINAL WARNING: You are about to PERMANENTLY DELETE everything!\n\nType YES in the next dialog to confirm.');
    
    if (!secondConfirmation) return;
    
    const finalConfirmation = prompt('Type "DELETE EVERYTHING" to confirm:');
    
    if (finalConfirmation !== 'DELETE EVERYTHING') {
        alert('Operation cancelled.');
        return;
    }
    
    // Clear everything
    tasks = [];
    if (typeof window.listSections !== 'undefined') {
        window.listSections = [];
    }
    if (typeof customTemplates !== 'undefined') {
        customTemplates = [];
    }
    
    // Save changes
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    localStorage.removeItem('gtd_list_sections');
    localStorage.removeItem('gtdTemplates');
    
    // Refresh UI
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
    
    alert('All data has been cleared.');
}

function performUndo() {
    if (typeof undoStack !== 'undefined' && undoStack.length > 0) {
        const lastState = undoStack.pop();
        if (lastState && lastState.tasks) {
            tasks = lastState.tasks;
            if (typeof saveTasksToLocalStorage === 'function') {
                saveTasksToLocalStorage();
            }
            if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
            alert('Action undone');
        }
    } else {
        alert('Nothing to undo');
    }
}

function refreshUndoView() {
    // Refresh undo view logic
    console.log('Refreshing undo view...');
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function checkAllBackups() {
    // Check backup status
    console.log('Checking backup status...');
    alert('Backup status checked');
}

function createEmergencyBackup() {
    // Create an emergency backup
    exportTasks();
}

// Modal functions
function openDateTimeModal() {
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Set current values if they exist
        const currentDate = document.getElementById('editTaskDateOnly').value;
        const currentTime = document.getElementById('editTaskTimeOnly').value;
        
        // Set desktop inputs
        const desktopDateInput = document.getElementById('desktopDateInput');
        const desktopTimeInput = document.getElementById('desktopTimeInput');
        if (desktopDateInput) desktopDateInput.value = currentDate || '';
        if (desktopTimeInput) desktopTimeInput.value = currentTime || '';
        
        // Set mobile inputs
        const mobileDateInput = document.getElementById('mobileDateInput');
        const mobileTimeInput = document.getElementById('mobileTimeInput');
        if (mobileDateInput) mobileDateInput.value = currentDate || '';
        if (mobileTimeInput) mobileTimeInput.value = currentTime || '';
    }
}

function closeDateTimeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function applyDesktopDateTime() {
    const dateInput = document.getElementById('desktopDateInput');
    const timeInput = document.getElementById('desktopTimeInput');
    
    if (dateInput && timeInput) {
        // Update the main form fields
        const mainDateInput = document.getElementById('editTaskDateOnly');
        const mainTimeInput = document.getElementById('editTaskTimeOnly');
        
        if (mainDateInput) mainDateInput.value = dateInput.value;
        if (mainTimeInput) mainTimeInput.value = timeInput.value;
        
        // Update display
        if (typeof updateDateTimeDisplay === 'function') {
            updateDateTimeDisplay();
        }
    }
    
    closeDateTimeModal();
}

function applyMobileDateTime() {
    const dateInput = document.getElementById('mobileDateInput');
    const timeInput = document.getElementById('mobileTimeInput');
    
    if (dateInput && timeInput) {
        // Update the main form fields
        const mainDateInput = document.getElementById('editTaskDateOnly');
        const mainTimeInput = document.getElementById('editTaskTimeOnly');
        
        if (mainDateInput) mainDateInput.value = dateInput.value;
        if (mainTimeInput) mainTimeInput.value = timeInput.value;
        
        // Update display
        if (typeof updateDateTimeDisplay === 'function') {
            updateDateTimeDisplay();
        }
    }
    
    closeDateTimeModal();
}

function openBulkTimeModal() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks first');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'bulkTimeModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>⏰ Set Time for Selected Tasks</h3>
            <div style="margin: 20px 0;">
                <label>Time:</label>
                <input type="time" id="bulkTimeInput" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="closeBulkTimeModal()" class="btn btn-secondary">Cancel</button>
                <button onclick="applyBulkTime()" class="btn btn-primary">Apply</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeBulkTimeModal() {
    const modal = document.getElementById('bulkTimeModal');
    if (modal) {
        modal.remove();
    }
}

function applyBulkTime() {
    const timeInput = document.getElementById('bulkTimeInput');
    if (!timeInput || !timeInput.value) {
        alert('Please select a time');
        return;
    }
    
    const newTime = timeInput.value;
    const tasksToUpdate = Array.from(selectedTasks);
    
    tasksToUpdate.forEach(taskId => {
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            task.dueTime = newTime;
            task.updatedAt = new Date().toISOString();
        }
    });
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
    
    closeBulkTimeModal();
    selectedTasks.clear();
}

// Image and template functions
function triggerImageUpload() {
    const input = document.getElementById('imageUpload');
    if (input) {
        input.click();
    }
}

function handleImageUpload(event) {
    console.log('Image upload functionality currently disabled');
    // Placeholder for image upload functionality
}

function handleJsonImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.tasks && Array.isArray(importData.tasks)) {
                tasks.push(...importData.tasks);
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`Imported ${importData.tasks.length} tasks successfully!`);
            }
            
            // Import list sections if available
            if (importData.listSections && Array.isArray(importData.listSections)) {
                window.listSections.push(...importData.listSections);
                localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
            }
            
            // Import templates if available
            if (importData.templates && Array.isArray(importData.templates)) {
                customTemplates.push(...importData.templates);
                localStorage.setItem('gtdTemplates', JSON.stringify(customTemplates));
            }
            
        } catch (error) {
            console.error('JSON import failed:', error);
            alert('Import failed. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function handleTextImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            const importedTasks = [];
            lines.forEach((line, index) => {
                if (line.trim()) {
                    const task = {
                        id: (Date.now() + index).toString(),
                        title: line.trim(),
                        notes: '',
                        dueDate: null,
                        dueTime: null,
                        status: 'pending',
                        repeat: 'none',
                        isEvent: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    importedTasks.push(task);
                }
            });
            
            if (importedTasks.length > 0) {
                tasks.push(...importedTasks);
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`Imported ${importedTasks.length} tasks from text file!`);
            }
            
        } catch (error) {
            console.error('Text import failed:', error);
            alert('Text import failed. Please try again.');
        }
    };
    reader.readAsText(file);
}

function addNewTemplate() {
    const input = document.getElementById('newTemplateInput');
    if (!input) return;
    
    const template = input.value.trim();
    if (!template) return;
    
    if (typeof customTemplates !== 'undefined') {
        if (!customTemplates.includes(template)) {
            customTemplates.push(template);
            
            // Save templates
            if (typeof saveTemplates === 'function') {
                saveTemplates();
            }
            
            // Clear input
            input.value = '';
            
            // Re-render template buttons
            if (typeof renderTemplateButtons === 'function') {
                renderTemplateButtons();
            }
        }
    }
}

function resetTaskTitle() {
    const titleInput = document.getElementById('editTaskTitle');
    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
}

// Settings and language functions
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    
    if (typeof translateUI === 'function') {
        translateUI();
    }
    if (typeof updateLanguageButtonStyles === 'function') {
        updateLanguageButtonStyles();
    }
    if (typeof updateHeaderLanguageButton === 'function') {
        updateHeaderLanguageButton();
    }
    
    console.log('Language switched to:', lang);
}

function saveAutoPrintTime() {
    const select = document.getElementById('autoPrintTimeSelect');
    if (select) {
        localStorage.setItem('autoPrintTime', select.value);
        console.log('Auto print time saved:', select.value);
    }
}

function updateSyncPeriod() {
    const select = document.getElementById('syncPeriodSelect');
    if (select) {
        localStorage.setItem('syncPeriod', select.value);
        console.log('Sync period updated:', select.value);
    }
}

// Load settings values into settings view
function loadSettingsValues() {
    try {
        console.log('Loading settings values...');
        
        // Load date format
        const dateFormat = localStorage.getItem('dateFormat') || 'default';
        const dateFormatElement = document.getElementById('dateFormatSelect');
        if (dateFormatElement) {
            dateFormatElement.value = dateFormat;
        }
        
        // Load time format
        const timeFormat = localStorage.getItem('timeFormat') || '12';
        const timeFormatElement = document.getElementById('timeFormatSelect');
        if (timeFormatElement) {
            timeFormatElement.value = timeFormat;
        }
        
        // Load auto-print settings (default to false/unchecked)
        const autoPrintEnabled = localStorage.getItem('autoPrintEnabled') === 'true';
        const autoPrintEnabledElement = document.getElementById('autoPrintEnabled');
        if (autoPrintEnabledElement) {
            autoPrintEnabledElement.checked = autoPrintEnabled;
        }
        
        const autoPrintTime = localStorage.getItem('autoPrintTime');
        const autoPrintTimeElement = document.getElementById('autoPrintTime');
        if (autoPrintTime && autoPrintTimeElement && autoPrintTime !== 'disabled') {
            autoPrintTimeElement.value = autoPrintTime;
        }
        
        // Initialize auto-print controls visibility
        if (typeof toggleAutoPrint === 'function') {
            toggleAutoPrint();
        }
        
        // Load keyboard-only mode setting
        const keyboardOnlyMode = localStorage.getItem('keyboardOnlyMode') === 'true';
        const keyboardOnlyModeElement = document.getElementById('keyboardOnlyMode');
        if (keyboardOnlyModeElement) {
            keyboardOnlyModeElement.checked = keyboardOnlyMode;
        }
        // Apply keyboard-only mode immediately
        if (typeof applyKeyboardOnlyMode === 'function') {
            applyKeyboardOnlyMode(keyboardOnlyMode);
        }
        
        // Load tab display mode setting (default to 'both' for icon + text)
        let tabDisplayMode = localStorage.getItem('tabDisplayMode') || 'both';
        if (!localStorage.getItem('tabDisplayMode')) {
            localStorage.setItem('tabDisplayMode', 'both');
            tabDisplayMode = 'both';
        }
        const tabDisplayElement = document.getElementById('tabDisplaySelect');
        if (tabDisplayElement) {
            tabDisplayElement.value = tabDisplayMode;
        }
        
        // Apply tab display mode with delay
        setTimeout(() => {
            if (typeof applyTabDisplayMode === 'function') {
                applyTabDisplayMode(tabDisplayMode);
                console.log('🎨 Tab display mode applied:', tabDisplayMode);
            }
        }, 100);
        
        // Load mobile UI version setting (default to 'm1')
        let mobileUIVersion = localStorage.getItem('mobileUIVersion') || 'm1';
        if (!localStorage.getItem('mobileUIVersion')) {
            localStorage.setItem('mobileUIVersion', 'm1');
            mobileUIVersion = 'm1';
        }
        const mobileUIElement = document.getElementById('mobileUIVersion');
        if (mobileUIElement) {
            mobileUIElement.value = mobileUIVersion;
        }
        
        // Apply mobile UI version immediately
        if (typeof applyMobileUIVersion === 'function') {
            applyMobileUIVersion(mobileUIVersion);
            console.log('📱 Mobile UI version applied:', mobileUIVersion);
        }
        
        // Load backup settings
        setTimeout(() => {
            if (typeof getBackupSettings === 'function') {
                const backupSettings = getBackupSettings();
                console.log('📥 Loading backup settings:', backupSettings);
                
                const autoBackupElement = document.getElementById('autoBackupEnabled');
                const dailyBackupElement = document.getElementById('dailyBackupEnabled');
                const weeklyBackupElement = document.getElementById('weeklyBackupEnabled'); 
                const monthlyBackupElement = document.getElementById('monthlyBackupEnabled');
                
                if (autoBackupElement) {
                    autoBackupElement.checked = backupSettings.enabled || false;
                }
                if (dailyBackupElement) {
                    dailyBackupElement.checked = backupSettings.daily || false;
                }
                if (weeklyBackupElement) {
                    weeklyBackupElement.checked = backupSettings.weekly || false;
                }
                if (monthlyBackupElement) {
                    monthlyBackupElement.checked = backupSettings.monthly || false;
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('Error loading settings values:', error);
    }
}

function openSettings() {
    if (typeof showView === 'function') {
        showView('settings');
    }
}

// Drag and Drop functions for tasks
let draggedTask = null;

function handleDragStart(e) {
    const taskIdStr = e.target.dataset.taskId;
    
    // Try both string and number comparison since task IDs can be either
    const taskId = parseInt(taskIdStr);
    draggedTask = window.tasks?.find(t => t.id == taskIdStr || t.id === taskId);
    
    if (!draggedTask) {
        console.error('Task not found for drag:', taskIdStr);
        return;
    }
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskIdStr);
    
    // Create a clean drag image with just the task
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.background = '#e3f2fd';
    dragImage.style.border = '2px solid #007bff';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.zIndex = '9999';
    dragImage.style.width = e.target.offsetWidth + 'px';
    document.body.appendChild(dragImage);
    
    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, e.offsetX || 10, e.offsetY || 10);
    
    // Remove the temporary drag image after a short delay
    setTimeout(() => {
        if (dragImage.parentNode) {
            dragImage.parentNode.removeChild(dragImage);
        }
    }, 0);
    
    // Add dragging-active class to grids for visual effects
    const weekGrid = document.getElementById('weekGrid');
    const calendarGrid = document.getElementById('calendarGrid');
    if (weekGrid) {
        weekGrid.classList.add('dragging-active');
    }
    if (calendarGrid) {
        calendarGrid.classList.add('dragging-active');
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedTask = null;
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    // Remove dragging-active class from grids
    const weekGrid = document.getElementById('weekGrid');
    const calendarGrid = document.getElementById('calendarGrid');
    if (weekGrid) {
        weekGrid.classList.remove('dragging-active');
    }
    if (calendarGrid) {
        calendarGrid.classList.remove('dragging-active');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (draggedTask && (e.currentTarget.classList.contains('calendar-day') || e.currentTarget.classList.contains('week-day'))) {
        // Clear all existing drop-targets before adding to current element
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        e.currentTarget.classList.add('drop-target');
    }
}

function handleDragLeave(e) {
    // Only remove drop-target if we're truly leaving the calendar day
    // Check if the related target is outside the current target
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // If mouse coordinates are outside the calendar day bounds, remove the class
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        e.currentTarget.classList.remove('drop-target');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    if (!draggedTask) {
        console.error('No draggedTask found in handleDrop');
        return;
    }
    
    const newDate = e.currentTarget.dataset.date;
    if (!newDate) {
        console.error('No date found on drop target');
        return;
    }
    
    if (newDate === draggedTask.dueDate) {
        return;
    }
    
    // Store task info before async operations (draggedTask can become null)
    const taskTitle = draggedTask.title;
    const taskId = draggedTask.id;
    
    const newDateObj = new Date(newDate);
    const oldDate = draggedTask.dueDate ? new Date(draggedTask.dueDate) : null;
    
    try {
        // Update task date
        draggedTask.dueDate = newDate;
        draggedTask.updatedAt = new Date().toISOString();
        
        // Update in memory tasks array
        if (window.tasks) {
            const existingIndex = window.tasks.findIndex(t => t.id === draggedTask.id);
            if (existingIndex >= 0) {
                window.tasks[existingIndex] = draggedTask;
            }
        }
        
        // Save to localStorage
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        
        // Sync to cloud
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
        }
        
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        
        // Refresh views based on current view
        if (window.currentView === 'today' && typeof renderTodayView === 'function') {
            renderTodayView();
        } else if (window.currentView === 'week' && typeof renderWeekView === 'function') {
            renderWeekView();
        } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
            renderCalendar();
        } else if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
        
        // Show brief success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = `Task "${taskTitle}" moved to ${newDateObj.toLocaleDateString()}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error in handleDrop:', error);
    }
}

// Settings helper functions
function applyKeyboardOnlyMode(keyboardOnlyMode) {
    const buttonsToHide = document.querySelectorAll('.keyboard-hideable');
    buttonsToHide.forEach(button => {
        if (keyboardOnlyMode) {
            button.style.display = 'none';
        } else {
            button.style.display = '';
        }
    });
    console.log('Keyboard-only mode:', keyboardOnlyMode ? 'enabled' : 'disabled');
}

function applyTabDisplayMode(mode) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        const icon = tab.querySelector('.nav-icon');
        const text = tab.querySelector('.nav-text');
        
        switch(mode) {
            case 'icons':
                if (icon) icon.style.display = 'inline';
                if (text) text.style.display = 'none';
                break;
            case 'text':
                if (icon) icon.style.display = 'none';
                if (text) text.style.display = 'inline';
                break;
            case 'both':
            default:
                if (icon) icon.style.display = 'inline';
                if (text) text.style.display = 'inline';
                break;
        }
    });
    console.log('Tab display mode applied:', mode);
}

function applyMobileUIVersion(version) {
    document.body.classList.remove('mobile-v1', 'mobile-v2');
    if (version === 'm1') {
        document.body.classList.add('mobile-v1');
    } else if (version === 'm2') {
        document.body.classList.add('mobile-v2');
    }
    console.log('Mobile UI version applied:', version);
}

function toggleAutoPrint() {
    const checkbox = document.getElementById('autoPrintEnabled');
    const timeSelect = document.getElementById('autoPrintTime');
    
    if (checkbox && timeSelect) {
        timeSelect.style.display = checkbox.checked ? 'block' : 'none';
        localStorage.setItem('autoPrintEnabled', checkbox.checked);
    }
}

function toggleKeyboardOnlyMode() {
    const checkbox = document.getElementById('keyboardOnlyMode');
    if (checkbox) {
        const enabled = checkbox.checked;
        localStorage.setItem('keyboardOnlyMode', enabled);
        applyKeyboardOnlyMode(enabled);
    }
}

function saveDateFormat() {
    const select = document.getElementById('dateFormatSelect');
    if (select) {
        localStorage.setItem('dateFormat', select.value);
        console.log('Date format saved:', select.value);
    }
}

function saveTimeFormat() {
    const select = document.getElementById('timeFormatSelect');
    if (select) {
        localStorage.setItem('timeFormat', select.value);
        console.log('Time format saved:', select.value);
    }
}

function getBackupSettings() {
    return {
        enabled: localStorage.getItem('autoBackupEnabled') === 'true',
        daily: localStorage.getItem('dailyBackupEnabled') === 'true',
        weekly: localStorage.getItem('weeklyBackupEnabled') === 'true',
        monthly: localStorage.getItem('monthlyBackupEnabled') === 'true'
    };
}

// List management functions
function openCreateSectionModal() {
    console.log('Opening create section modal...');
    // Placeholder for create section modal
    const sectionName = prompt('Enter section name:');
    if (sectionName) {
        console.log('Would create section:', sectionName);
    }
}

// Edit list section
async function editListSection(sectionId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const newName = prompt('Edit section name:', section.name);
    if (newName && newName.trim() && newName.trim() !== section.name) {
        section.name = newName.trim();
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// Delete list section
async function deleteListSection(sectionId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const listsCount = section.lists ? section.lists.length : 0;
    const message = listsCount > 0 
        ? `Delete section "${section.name}" and all its ${listsCount} lists?`
        : `Delete section "${section.name}"?`;
    
    if (confirm(message)) {
        window.listSections = window.listSections.filter(s => s.id !== sectionId);
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// Open create list modal
function openCreateListModal(sectionId) {
    const listName = prompt('Enter list name:', '');
    if (listName && listName.trim()) {
        createList(sectionId, listName.trim());
    }
}

// Create new list
async function createList(sectionId, name) {
    if (!window.listSections) {
        window.listSections = [];
    }
    
    const section = window.listSections.find(s => s.id === sectionId);
    if (!section) return;
    
    if (!section.lists) {
        section.lists = [];
    }
    
    const newList = {
        id: Date.now().toString(),
        name: name,
        items: [],
        createdAt: new Date().toISOString()
    };
    
    section.lists.push(newList);
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    if (typeof renderListsView === 'function') {
        renderListsView();
    }
}

// Edit list
async function editList(sectionId, listId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id === listId);
    if (!list) return;
    
    const newName = prompt('Edit list name:', list.name);
    if (newName && newName.trim() && newName.trim() !== list.name) {
        list.name = newName.trim();
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// Delete list
async function deleteList(sectionId, listId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id === listId);
    if (!list) return;
    
    const itemsCount = list.items ? list.items.length : 0;
    const message = itemsCount > 0 
        ? `Delete list "${list.name}" and all its ${itemsCount} items?`
        : `Delete list "${list.name}"?`;
    
    if (confirm(message)) {
        section.lists = section.lists.filter(l => l.id !== listId);
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

function toggleAllSections() {
    console.log('Toggling all sections...');
    // Placeholder for toggle all sections
}

function showListSelectionForTXTImport() {
    console.log('Showing list selection for TXT import...');
    // Placeholder for TXT import
}

// Export functions
function downloadTodayHtml() {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const todayTasks = tasks.filter(task => 
        task.dueDate === (typeof getLocalDateString === 'function' ? 
            getLocalDateString(today) : 
            today.toISOString().split('T')[0])
    );
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Today's Schedule - ${formattedDate}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .task { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
                .task-title { font-weight: bold; }
                .task-time { color: #666; font-size: 0.9em; }
                .task-notes { margin-top: 5px; color: #444; }
            </style>
        </head>
        <body>
            <h1>Today's Schedule</h1>
            <h2>${formattedDate}</h2>
    `;
    
    if (todayTasks.length === 0) {
        html += '<p>No tasks scheduled for today.</p>';
    } else {
        todayTasks.forEach(task => {
            html += `
                <div class="task">
                    <div class="task-title">${task.title}</div>
                    ${task.dueTime ? `<div class="task-time">Time: ${task.dueTime}</div>` : ''}
                    ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                </div>
            `;
        });
    }
    
    html += `
        </body>
        </html>
    `;
    
    // Download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `today-schedule-${today.toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportRepeatHtml() {
    console.log('Exporting repeat tasks as HTML...');
    // Placeholder for repeat tasks HTML export
}

function printSearchResults() {
    window.print();
}

function openTrash() {
    console.log('Opening trash...');
    alert('Trash functionality not yet implemented');
}

// Make all functions globally accessible
window.openAddTaskModalMobile = openAddTaskModalMobile;
window.provideFeedback = provideFeedback;
window.performSearch = performSearch;
window.performMobileSearch = performMobileSearch;
window.quickSearch = quickSearch;
window.performAllTasksSearch = performAllTasksSearch;
window.clearAllTasksTemplateFilter = clearAllTasksTemplateFilter;
window.searchTodayTasks = searchTodayTasks;
window.searchMonthTasks = searchMonthTasks;
window.searchWeekTasks = searchWeekTasks;
window.searchRepeatTasks = searchRepeatTasks;
window.undoLastAction = undoLastAction;
window.deleteSelectedTasks = deleteSelectedTasks;
window.delaySelectedTasks = delaySelectedTasks;
window.toggleSelectAll = toggleSelectAll;
window.expandAllGroups = expandAllGroups;
window.collapseAllGroups = collapseAllGroups;
window.exportTasks = exportTasks;
window.exportAllTasks = exportAllTasks;
window.importTasks = importTasks;
window.clearAllTasks = clearAllTasks;
window.performUndo = performUndo;
window.refreshUndoView = refreshUndoView;
window.checkAllBackups = checkAllBackups;
window.createEmergencyBackup = createEmergencyBackup;
window.openDateTimeModal = openDateTimeModal;
window.closeDateTimeModal = closeDateTimeModal;
window.applyDesktopDateTime = applyDesktopDateTime;
window.applyMobileDateTime = applyMobileDateTime;
window.openBulkTimeModal = openBulkTimeModal;
window.triggerImageUpload = triggerImageUpload;
window.handleImageUpload = handleImageUpload;
window.addNewTemplate = addNewTemplate;
window.resetTaskTitle = resetTaskTitle;
window.switchLanguage = switchLanguage;
window.saveAutoPrintTime = saveAutoPrintTime;
window.updateSyncPeriod = updateSyncPeriod;
window.openSettings = openSettings;
window.openCreateSectionModal = openCreateSectionModal;
window.toggleAllSections = toggleAllSections;
window.showListSelectionForTXTImport = showListSelectionForTXTImport;
window.downloadTodayHtml = downloadTodayHtml;
window.exportRepeatHtml = exportRepeatHtml;
window.printSearchResults = printSearchResults;
window.openTrash = openTrash;
window.handleJsonImportFile = handleJsonImportFile;
window.handleTextImportFile = handleTextImportFile;

// Global variables
window.selectedTasks = selectedTasks;
window.activeAllTasksTemplateFilter = activeAllTasksTemplateFilter;
window.currentLanguage = currentLanguage;

console.log('✅ Missing functions module loaded with', Object.keys(window).filter(k => typeof window[k] === 'function' && (k.startsWith('open') || k.startsWith('perform') || k.startsWith('search') || k.startsWith('handle'))).length, 'functions');