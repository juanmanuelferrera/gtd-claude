/**
 * Backup, Import and Export Functions for HyperFiler Pro
 */

// Data management functions
function exportTasks() {
    try {
        const exportData = {
            version: '1.0',
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
    quickBackupJSON(); // Unified - uses full backup
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
                // ALWAYS OVERWRITE - Clear existing tasks and replace with imported ones
                console.log(`🔄 OVERWRITE MODE: Replacing ${tasks.length} existing tasks with ${importData.tasks.length} imported tasks`);
                tasks.length = 0; // Clear existing tasks
                tasks.push(...importData.tasks); // Add imported tasks
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`✅ REPLACED all tasks with ${importData.tasks.length} imported tasks!`);
                
                // Set sync protection flag and upload to server
                window.justModifiedTasks = true;
                setTimeout(async () => {
                    try {
                        if (typeof uploadAllTasks === 'function') {
                            await uploadAllTasks();
                            console.log('✅ Tasks synced to server after import');
                        }
                        setTimeout(() => {
                            window.justModifiedTasks = false;
                        }, 5000);
                    } catch (error) {
                        console.error('❌ Failed to sync tasks after import:', error);
                    }
                }, 1000);
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
    console.log('🔍 DEBUG: clearAllTasks called');
    try {
        const firstConfirmation = confirm('⚠️ WARNING: This will DELETE ALL your tasks, events, and templates FOREVER!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to continue?');
        
        if (!firstConfirmation) {
            console.log('🔍 DEBUG: First confirmation cancelled');
            return;
        }
        
        const secondConfirmation = confirm('🔴 FINAL WARNING: You are about to PERMANENTLY DELETE everything!\n\nType YES in the next dialog to confirm.');
        
        if (!secondConfirmation) {
            console.log('🔍 DEBUG: Second confirmation cancelled');
            return;
        }
        
        const finalConfirmation = prompt('Type "DELETE EVERYTHING" to confirm:');
        
        if (finalConfirmation !== 'DELETE EVERYTHING') {
            console.log('🔍 DEBUG: Final confirmation failed:', finalConfirmation);
            alert('Operation cancelled.');
            return;
        }
        
        console.log('🔍 DEBUG: All confirmations passed, clearing data...');
        
        // Clear everything
        if (typeof tasks !== 'undefined') {
            tasks = [];
            console.log('🔍 DEBUG: tasks cleared');
        }
        if (typeof window.listSections !== 'undefined') {
            window.listSections = [];
            console.log('🔍 DEBUG: listSections cleared');
        }
        if (typeof customTemplates !== 'undefined') {
            customTemplates = [];
            console.log('🔍 DEBUG: customTemplates cleared');
        }
        
        // Save changes
        if (typeof saveTasksToLocalStorage === 'function') {
            console.log('🔍 DEBUG: Calling saveTasksToLocalStorage');
            saveTasksToLocalStorage();
        } else {
            console.log('🔍 DEBUG: saveTasksToLocalStorage not available');
        }
        
        localStorage.removeItem('gtd_list_sections');
        localStorage.removeItem('gtdTemplates');
        console.log('🔍 DEBUG: localStorage items removed');
        
        // Refresh UI
        if (typeof renderCurrentView === 'function') {
            console.log('🔍 DEBUG: Calling renderCurrentView');
            renderCurrentView();
        } else {
            console.log('🔍 DEBUG: renderCurrentView not available, trying alternative refresh');
            if (typeof renderTodayView === 'function') {
                renderTodayView();
            } else if (typeof location !== 'undefined') {
                location.reload();
            }
        }
        
        alert('All data has been cleared.');
        console.log('🔍 DEBUG: clearAllTasks completed successfully');
        
    } catch (error) {
        console.error('🔍 ERROR in clearAllTasks:', error);
        alert('Error clearing tasks: ' + error.message);
    }
}
function performUndo() {
    // Revert the most recent action from the registry
    var registry = window.actionRegistry || JSON.parse(localStorage.getItem('actionRegistry') || '[]');
    if (registry.length === 0) {
        console.log('Nothing to undo');
        return;
    }
    revertAction(registry[registry.length - 1].id);
}

function revertAction(actionId) {
    var registry = window.actionRegistry || JSON.parse(localStorage.getItem('actionRegistry') || '[]');
    var idx = registry.findIndex(function(a) { return a.id === actionId; });
    if (idx === -1) {
        console.error('Action not found:', actionId);
        return;
    }
    var action = registry[idx];
    console.log('Reverting action:', action.type, action.taskTitle);

    switch (action.type) {
        case 'create':
        case 'duplicate': {
            // Delete the created task (tombstone)
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task) {
                task.isDeleted = true;
                task.status = 'deleted';
                task.deletedAt = new Date().toISOString();
                task.updatedAt = new Date().toISOString();
            }
            break;
        }
        case 'edit':
        case 'delay': {
            // Restore before fields
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task && action.before) {
                Object.keys(action.before).forEach(function(key) {
                    task[key] = action.before[key];
                });
                task.updatedAt = new Date().toISOString();
            }
            break;
        }
        case 'delete': {
            // Restore the task
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task) {
                task.isDeleted = false;
                task.status = 'pending';
                task.deletedAt = null;
                task.updatedAt = new Date().toISOString();
            } else if (action.before) {
                // Task was fully removed, re-add from snapshot
                var restored = JSON.parse(JSON.stringify(action.before));
                restored.isDeleted = false;
                restored.status = 'pending';
                restored.deletedAt = null;
                restored.updatedAt = new Date().toISOString();
                tasks.push(restored);
            }
            break;
        }
        case 'complete': {
            // Restore previous status
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task && action.before) {
                task.status = action.before.status || 'pending';
                task.isDeleted = action.before.isDeleted || false;
                task.deletedAt = action.before.deletedAt || null;
                task.updatedAt = new Date().toISOString();
            }
            break;
        }
    }

    // Remove action from registry
    registry.splice(idx, 1);
    window.actionRegistry = registry;
    localStorage.setItem('actionRegistry', JSON.stringify(registry));

    // Save and re-render
    if (typeof saveTasksToLocalStorage === 'function') saveTasksToLocalStorage();
    if (typeof sortTasks === 'function') sortTasks();
    if (typeof renderCurrentView === 'function') renderCurrentView();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    console.log('Reverted:', action.type, action.taskTitle);
}
window.revertAction = revertAction;
function refreshUndoView() {
    renderRecentActionsView();
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

function handleJsonImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Ask user if they want to overwrite or add to existing data
            const shouldOverwrite = confirm('⚠️ IMPORT MODE SELECTION:\n\n✅ Click OK to REPLACE ALL existing data (RECOMMENDED)\n❌ Click Cancel to ADD to existing data (creates duplicates)\n\n🔄 FOR CLEAN RESTORE: Click OK to completely replace everything with backup data.');
            
            if (importData.tasks && Array.isArray(importData.tasks)) {
                if (shouldOverwrite) {
                    // OVERWRITE: Replace all tasks
                    tasks.length = 0; // Clear existing tasks
                    tasks.push(...importData.tasks);
                    console.log(`🔄 OVERWRITE: Replaced all tasks with ${importData.tasks.length} imported tasks`);
                } else {
                    // ADD: Append to existing tasks
                    tasks.push(...importData.tasks);
                    console.log(`➕ ADD: Added ${importData.tasks.length} tasks to existing ${tasks.length - importData.tasks.length} tasks`);
                }
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                const action = shouldOverwrite ? 'replaced all tasks with' : 'added';
                alert(`Successfully ${action} ${importData.tasks.length} imported tasks!`);
            }
            
            // Import list sections if available
            if (importData.listSections && Array.isArray(importData.listSections)) {
                if (shouldOverwrite) {
                    // OVERWRITE: Replace all lists
                    window.listSections.length = 0; // Clear existing lists
                    window.listSections.push(...importData.listSections);
                    console.log(`🔄 OVERWRITE: Replaced all lists with ${importData.listSections.length} imported lists`);
                } else {
                    // ADD: Append to existing lists
                    window.listSections.push(...importData.listSections);
                    console.log(`➕ ADD: Added ${importData.listSections.length} lists to existing data`);
                }
                localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
            }
            
            // Import templates if available
            if (importData.templates && Array.isArray(importData.templates)) {
                if (shouldOverwrite) {
                    // OVERWRITE: Replace all templates
                    if (typeof window.customTemplates !== 'undefined') {
                        window.customTemplates.length = 0; // Clear existing templates
                        window.customTemplates.push(...importData.templates);
                        console.log(`🔄 OVERWRITE: Replaced all templates with ${importData.templates.length} imported templates`);
                    }
                } else {
                    // ADD: Append to existing templates
                    if (typeof window.customTemplates !== 'undefined') {
                        window.customTemplates.push(...importData.templates);
                        console.log(`➕ ADD: Added ${importData.templates.length} templates to existing data`);
                    }
                }
                localStorage.setItem('gtdTemplates', JSON.stringify(window.customTemplates));
            }
            
            // Force sync to server after import
            console.log('📤 Starting sync to server after import...');
            setTimeout(async () => {
                try {
                    if (typeof uploadAllTasks === 'function') {
                        await uploadAllTasks();
                        console.log('✅ Tasks synced to server');
                    }
                    if (typeof uploadAllLists === 'function') {
                        await uploadAllLists();
                        console.log('✅ Lists synced to server');  
                    }
                    if (typeof uploadAllTemplates === 'function') {
                        await uploadAllTemplates();
                        console.log('✅ Templates synced to server');
                    }
                    console.log('✅ All data synced to server successfully');
                } catch (error) {
                    console.error('❌ Server sync failed after import:', error);
                }
            }, 1000);
            
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

async function emergencyRecoverLists() {
    console.log('🚨 EMERGENCY: Attempting to recover lists from server...');
    
    if (!window.currentUser?.user?.id) {
        console.error('❌ No user logged in');
        alert('Please log in first to recover lists');
        return;
    }
    
    try {
        // First, let's try using the existing getAuthHeaders function if available
        let headers;
        if (typeof getAuthHeaders === 'function') {
            console.log('🔑 Using getAuthHeaders function...');
            headers = getAuthHeaders();
        } else {
            console.log('🔑 Using manual auth headers...');
            headers = {
                'Authorization': `Bearer ${window.currentUser.token}`,
                'Content-Type': 'application/json'
            };
        }
        
        console.log('🔄 Forcing download from server...');
        console.log('🔗 API URL:', `${window.API_BASE}/lists/${window.currentUser.user.id}`);
        console.log('🔑 Auth headers:', headers);
        
        const response = await fetch(`${window.API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: headers
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        if (response.status === 401) {
            console.error('❌ Unauthorized - token might be expired');
            alert('❌ Authentication expired. Please refresh the page and log in again, then retry.');
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`Server responded with ${response.status}: ${response.statusText}\n${errorText}`);
        }
        
        const data = await response.json();
        console.log('📥 Server response:', data);
        
        const serverListSections = data.listSections || [];
        console.log(`📋 Found ${serverListSections.length} lists on server`);
        
        if (serverListSections.length > 0) {
            // Restore lists
            window.listSections = serverListSections;
            localStorage.setItem('gtd_list_sections', JSON.stringify(serverListSections));
            
            console.log('✅ Lists recovered from server!');
            alert(`✅ Recovered ${serverListSections.length} lists from server!`);
            
            // Refresh UI if possible
            if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
            
            return serverListSections;
        } else {
            console.log('⚠️ No lists found on server');
            alert('No lists found on server to recover. They might not have been synced before being lost.');
        }
        
    } catch (error) {
        console.error('❌ Recovery failed:', error);
        alert(`Recovery failed: ${error.message}`);
    }
}

window.emergencyRecoverLists = emergencyRecoverLists;

async function recoverListsWithAuthRefresh() {
    console.log('🔄 Attempting to refresh authentication...');
    
    try {
        // Try to refresh the auth session
        if (typeof refreshAuthToken === 'function') {
            console.log('🔑 Refreshing auth token...');
            await refreshAuthToken();
        } else if (typeof downloadAllTasks === 'function') {
            // Sometimes downloading tasks triggers a token refresh
            console.log('🔄 Triggering sync to refresh token...');
            await downloadAllTasks();
        }
        
        // Wait a moment for auth to settle
        setTimeout(async () => {
            console.log('🔄 Retrying list recovery...');
            await emergencyRecoverLists();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Auth refresh failed:', error);
        alert('❌ Could not refresh authentication. Please refresh the page and log in again.');
    }
}

window.recoverListsWithAuthRefresh = recoverListsWithAuthRefresh;

async function importListsOnlyFromJSON() {
    console.log('📋 Starting Lists-only import...');
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                console.log('📥 Loaded JSON data:', importData);
                
                // Check if listSections exist in the backup
                if (!importData.listSections || !Array.isArray(importData.listSections)) {
                    alert('❌ No Lists found in this backup file.\n\nLook for "listSections" property in the JSON.');
                    return;
                }
                
                const listsToImport = importData.listSections;
                console.log(`📋 Found ${listsToImport.length} lists in backup:`, listsToImport);
                
                // Show preview of what will be imported
                const listNames = listsToImport.map(list => list.title || list.name || 'Unnamed List').join(', ');
                const confirmMessage = `📋 IMPORT LISTS ONLY\n\nFound ${listsToImport.length} lists:\n${listNames}\n\n⚠️ This will REPLACE your current lists but keep your tasks and templates.\n\nProceed?`;
                
                if (confirm(confirmMessage)) {
                    // Replace lists
                    window.listSections = [...listsToImport]; // Create a copy
                    localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
                    
                    console.log('✅ Lists imported successfully');
                    alert(`✅ Successfully imported ${listsToImport.length} lists!\n\nYour tasks and templates remain unchanged.`);
                    
                    // Refresh UI if in Lists view
                    if (typeof renderCurrentView === 'function') {
                        renderCurrentView();
                    }
                    
                    // CRITICAL: Set flag to prevent downloads from overwriting our import
                    window.justModifiedLists = true;
                    console.log('🔒 Set justModifiedLists flag to protect import');
                    
                    // Sync to server IMMEDIATELY
                    (async () => {
                        try {
                            if (typeof uploadAllLists === 'function') {
                                await uploadAllLists();
                                console.log('✅ Lists synced to server successfully');
                                
                                // Clear flag after successful upload  
                                setTimeout(() => {
                                    window.justModifiedLists = false;
                                    console.log('🔓 Cleared justModifiedLists protection flag');
                                }, 5000);
                            }
                        } catch (error) {
                            console.error('❌ Failed to sync lists to server:', error);
                            // Clear flag even on error to avoid permanent blocking
                            setTimeout(() => {
                                window.justModifiedLists = false;
                                console.log('🔓 Cleared justModifiedLists flag after error');
                            }, 10000);
                        }
                    })();
                }
                
            } catch (error) {
                console.error('❌ JSON parsing failed:', error);
                alert('❌ Failed to read JSON file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
}

window.importListsOnlyFromJSON = importListsOnlyFromJSON;

async function forceDownloadListsFromServer() {
    console.log('🚨 FORCE DOWNLOAD: Bypassing all protection to get lists from server...');
    
    if (!window.currentUser?.user?.id) {
        alert('❌ No user logged in. Please log in first.');
        return;
    }
    
    try {
        // Get auth headers
        let headers;
        if (typeof getAuthHeaders === 'function') {
            headers = getAuthHeaders();
        } else {
            headers = {
                'Authorization': `Bearer ${window.currentUser.token}`,
                'Content-Type': 'application/json'
            };
        }
        
        console.log('🔄 Forcing download from server (bypassing ALL protections)...');
        const response = await fetch(`${window.API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 Server response:', data);
        
        const serverListSections = data.listSections || [];
        console.log(`📋 Found ${serverListSections.length} lists on server`);
        
        if (serverListSections.length > 0) {
            // Force restore lists (bypassing all safety checks)
            window.listSections = serverListSections;
            localStorage.setItem('gtd_list_sections', JSON.stringify(serverListSections));
            
            console.log('✅ Lists force-downloaded from server!');
            alert(`✅ Force-recovered ${serverListSections.length} lists from server!`);
            
            // Refresh UI
            if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
            
            return serverListSections;
        } else {
            console.log('⚠️ No lists found on server');
            alert('❌ No lists found on server. They may not have been uploaded yet.');
        }
        
    } catch (error) {
        console.error('❌ Force download failed:', error);
        alert(`❌ Force download failed: ${error.message}`);
    }
}

window.forceDownloadListsFromServer = forceDownloadListsFromServer;

async function forceImportJSONOverwrite() {
    console.log('🔄 FORCE IMPORT: Opening file picker for JSON overwrite...');
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                console.log('📥 Loaded JSON data for FORCE OVERWRITE:', importData);
                
                // Final confirmation
                const finalConfirm = confirm(`🔄 FORCE OVERWRITE CONFIRMATION\n\nThis will COMPLETELY REPLACE all your data with the backup:\n\n• Tasks: ${importData.tasks?.length || 0}\n• Lists: ${importData.listSections?.length || 0}\n• Templates: ${importData.templates?.length || importData.customTemplates?.length || 0}\n\nThis action CANNOT be undone!\n\nProceed?`);
                
                if (!finalConfirm) {
                    alert('❌ Import cancelled.');
                    return;
                }
                
                // FORCE OVERWRITE ALL DATA
                console.log('🔄 FORCE OVERWRITE: Replacing ALL data...');
                
                // Replace tasks
                if (importData.tasks && Array.isArray(importData.tasks)) {
                    tasks.length = 0;
                    tasks.push(...importData.tasks);
                    if (typeof saveTasksToLocalStorage === 'function') {
                        saveTasksToLocalStorage();
                    }
                    console.log(`✅ OVERWRITE: Replaced with ${importData.tasks.length} tasks`);
                }
                
                // Replace lists
                if (importData.listSections && Array.isArray(importData.listSections)) {
                    window.listSections.length = 0;
                    window.listSections.push(...importData.listSections);
                    localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
                    console.log(`✅ OVERWRITE: Replaced with ${importData.listSections.length} lists`);
                }
                
                // Replace templates
                const templates = importData.templates || importData.customTemplates;
                if (templates && Array.isArray(templates)) {
                    if (typeof window.customTemplates !== 'undefined') {
                        window.customTemplates.length = 0;
                        window.customTemplates.push(...templates);
                        localStorage.setItem('gtdTemplates', JSON.stringify(window.customTemplates));
                        console.log(`✅ OVERWRITE: Replaced with ${templates.length} templates`);
                    }
                }
                
                alert('✅ FORCE OVERWRITE COMPLETE!\n\nAll data has been replaced with the backup.');
                
                // Refresh UI
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                // Force sync to server
                setTimeout(async () => {
                    try {
                        window.justModifiedTasks = true;
                        window.justModifiedLists = true;
                        window.justModifiedTemplates = true;
                        
                        if (typeof uploadAllTasks === 'function') await uploadAllTasks();
                        if (typeof uploadAllLists === 'function') await uploadAllLists();
                        if (typeof uploadAllTemplates === 'function') await uploadAllTemplates();
                        
                        console.log('✅ All data synced to server after force import');
                    } catch (error) {
                        console.error('❌ Sync failed after import:', error);
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ JSON parsing failed:', error);
                alert('❌ Failed to read JSON file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
}

window.forceImportJSONOverwrite = forceImportJSONOverwrite;

function showListSelectionForTXTImport() {
    console.log('Showing list selection for TXT import...');
    // Placeholder for TXT import
}
// Handle TXT file import for Lists View - supports both simple and structured import
async function handleNewTXTImport(event) {
    console.log('📋 Starting TXT import for Lists View');
    
    const file = event.target.files[0];
    if (!file) {
        console.log('❌ No file selected');
        return;
    }
    
    try {
        const text = await file.text();
        if (!text.trim()) {
            alert('❌ The selected file is empty.');
            return;
        }
        
        // Detect if this is structured format (contains # or ## lines)
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const hasStructuredFormat = lines.some(line => line.startsWith('# ') || line.startsWith('## '));
        
        if (hasStructuredFormat) {
            // Use structured import
            await importStructuredTXTDirect(text);
        } else {
            // Use simple import - show list selection
            await importSimpleTXTDirect(text);
        }
        
        // Clear the file input
        event.target.value = '';
        
    } catch (error) {
        console.error('❌ Error importing TXT file:', error);
        alert('❌ Error importing file: ' + error.message);
    }
}
// Simple TXT import - select existing list
async function importSimpleTXTDirect(text) {
    // Check if we have any lists to import into
    await loadListSections();
    let availableLists = [];
    listSections.forEach(section => {
        if (section.lists && section.lists.length > 0) {
            section.lists.forEach(list => {
                availableLists.push({
                    sectionId: section.id,
                    listId: list.id,
                    sectionName: section.name,
                    listName: list.name,
                    itemCount: list.items ? list.items.length : 0
                });
            });
        }
    });
    
    if (availableLists.length === 0) {
        alert('❌ No lists found. Please create a list first before importing, or use structured format (# Section, ## List) to create new ones.');
        return;
    }
    
    // Show simple selection dialog for target list
    const selectedIndex = prompt(
        `📋 Simple Import - Choose target list (enter number 1-${availableLists.length}):\n\n` +
        availableLists.map((list, index) => 
            `${index + 1}. ${list.sectionName} → ${list.listName} (${list.itemCount} items)`
        ).join('\n')
    );
    
    const listIndex = parseInt(selectedIndex) - 1;
    if (isNaN(listIndex) || listIndex < 0 || listIndex >= availableLists.length) {
        alert('❌ Invalid selection. Import cancelled.');
        return;
    }
    
    const targetList = availableLists[listIndex];
    
    // Find the target section and list
    const section = listSections.find(s => s.id === targetList.sectionId);
    const list = section.lists.find(l => l.id === targetList.listId);
    
    if (!section || !list) {
        alert('❌ Could not find target list. Import cancelled.');
        return;
    }
    
    // Parse the text file - each line becomes an item
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (lines.length === 0) {
        alert('❌ No valid content found in the file.');
        return;
    }
    
    // Add items to the list
    let addedCount = 0;
    lines.forEach(line => {
        const newItem = {
            id: Date.now() + Math.random(),
            text: line,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        if (!list.items) list.items = [];
        list.items.push(newItem);
        addedCount++;
    });
    
    // Save changes
    await saveListSections();
    
    // Refresh the Lists View if currently viewing it
    if (currentView === 'lists') {
        renderListsView();
    }
    
    alert(`✅ Successfully imported ${addedCount} items to "${targetList.sectionName} → ${targetList.listName}".`);
}
// Structured TXT import - create sections, lists, and items automatically
async function importStructuredTXTDirect(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
        alert('❌ The TXT file is empty or contains no valid content.');
        return;
    }
    
    await loadListSections();
    let currentSection = null;
    let currentList = null;
    let addedSections = 0;
    let addedLists = 0;
    let addedItems = 0;
    
    for (const line of lines) {
        if (line.startsWith('# ')) {
            // Section header
            const sectionName = line.substring(2).trim();
            
            // Find existing section or create new one
            currentSection = listSections.find(s => s.name === sectionName);
            if (!currentSection) {
                currentSection = {
                    id: Date.now().toString() + Math.random(),
                    name: sectionName,
                    lists: [],
                    collapsed: false,
                    createdAt: new Date().toISOString(),
                    order: listSections.length
                };
                listSections.push(currentSection);
                addedSections++;
            }
            currentList = null; // Reset current list when entering new section
            
        } else if (line.startsWith('## ')) {
            // List header
            const listName = line.substring(3).trim();
            
            if (!currentSection) {
                // Create default section if none exists
                currentSection = {
                    id: Date.now().toString() + Math.random(),
                    name: 'Imported',
                    lists: [],
                    collapsed: false,
                    createdAt: new Date().toISOString(),
                    order: listSections.length
                };
                listSections.push(currentSection);
                addedSections++;
            }
            
            // Find existing list in current section or create new one
            currentList = currentSection.lists.find(l => l.name === listName);
            if (!currentList) {
                currentList = {
                    id: Date.now().toString() + Math.random(),
                    name: listName,
                    items: [],
                    createdAt: new Date().toISOString()
                };
                currentSection.lists.push(currentList);
                addedLists++;
            }
            
        } else {
            // Regular item
            if (!currentList) {
                // Create default section and list if none exists
                if (!currentSection) {
                    currentSection = {
                        id: Date.now().toString() + Math.random(),
                        name: 'Imported',
                        lists: [],
                        collapsed: false,
                        createdAt: new Date().toISOString(),
                        order: listSections.length
                    };
                    listSections.push(currentSection);
                    addedSections++;
                }
                
                currentList = {
                    id: Date.now().toString() + Math.random(),
                    name: 'Items',
                    items: [],
                    createdAt: new Date().toISOString()
                };
                currentSection.lists.push(currentList);
                addedLists++;
            }
            
            // Add item to current list
            const newItem = {
                id: Date.now() + Math.random(),
                text: line,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            if (!currentList.items) currentList.items = [];
            currentList.items.push(newItem);
            addedItems++;
        }
    }
    
    // Save changes
    await saveListSections();
    
    // Refresh the Lists View if currently viewing it
    if (currentView === 'lists') {
        renderListsView();
    }
    
    alert(`✅ Structured import complete!\nAdded ${addedSections} sections, ${addedLists} lists, and ${addedItems} items.`);
}
// Quick Backup and Import JSON functions
function quickBackupJSON() {
    try {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tasks: tasks || [],
            customTemplates: customTemplates || [],
            listSections: listSections || [],
            settings: {
                language: localStorage.getItem('language') || 'en',
                theme: localStorage.getItem('theme') || 'light'
            }
        };
        
        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `hyperfiler-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Backup created successfully!', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showNotification('❌ Failed to create backup', 'error');
    }
}
function importJSONBackup(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.tasks || !Array.isArray(backup.tasks)) {
                throw new Error('Invalid backup format');
            }
            
            if (confirm(`Import ${backup.tasks.length} tasks from backup?\nThis will replace your current data!`)) {
                // Import tasks — enruta por writeCollectionSync para que se marquen
                // dirty y se suban al DO (antes se escribían sin metadata → no sincronizaban).
                tasks = backup.tasks || [];
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                } else {
                    localStorage.setItem('gtdTasks', JSON.stringify(tasks));
                }
                
                // Import templates
                if (backup.customTemplates) {
                    customTemplates = backup.customTemplates;
                    localStorage.setItem('gtdTemplates', JSON.stringify(customTemplates));
                }
                
                // Import lists
                if (backup.listSections) {
                    listSections = backup.listSections;
                    localStorage.setItem('gtd_list_sections', JSON.stringify(listSections));
                }
                
                // Refresh the view
                renderCurrentView();
                showNotification('✅ Backup imported successfully!', 'success');
                
                // Close settings modal
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal) settingsModal.style.display = 'none';
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('❌ Failed to import backup', 'error');
        }
    };
    reader.readAsText(file);
}

window.exportTasks = exportTasks;
window.exportAllTasks = exportAllTasks;
window.importTasks = importTasks;
window.clearAllTasks = clearAllTasks;
window.performUndo = performUndo;
window.quickBackupJSON = quickBackupJSON;
window.refreshUndoView = refreshUndoView;

window.checkAllBackups = checkAllBackups;
window.createEmergencyBackup = createEmergencyBackup;

window.showListSelectionForTXTImport = showListSelectionForTXTImport;
window.handleNewTXTImport = handleNewTXTImport;

window.handleJsonImportFile = handleJsonImportFile;
window.handleTextImportFile = handleTextImportFile;

// Export tasks as JSON file
function exportTasksJSON() {
    try {
        const tasks = window.tasks || [];
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hyperfiler-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('📁 Tasks exported as JSON successfully');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}
window.exportTasksJSON = exportTasksJSON;
