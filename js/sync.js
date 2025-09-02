/**
 * Data Synchronization Module for HyperFiler Pro
 * Handles cloud sync for tasks, lists, and templates
 */

// Global sync lock to prevent race conditions
let syncPromise = null;

// Sync status tracking
let lastVisibilitySync = 0;
let lastFocusRefresh = 0;

/**
 * Initialize the sync system
 */
function initializeSimpleSync() {
    if (!window.currentUser?.user?.id) {
        console.log('⚠️ Cannot initialize sync - no user credentials');
        return;
    }
    
    console.log('🔄 Initializing simple sync system (Lists pattern)...');
    
    // Check for stale browser protection flags before sync
    if (window.staleBrowserDetected || window.skipInitialUpload) {
        console.log('🔒 STALE BROWSER: Sync initialization postponed until stale browser download completes');
        // Schedule retry after stale browser handling completes
        setTimeout(() => {
            if (!window.staleBrowserDetected && !window.skipInitialUpload) {
                console.log('🔓 STALE BROWSER: Retrying sync initialization');
                initializeSimpleSync();
            }
        }, 7000); // 7 seconds after stale browser detection
        return;
    }
    
    // IMMEDIATE SYNC: Download tasks, lists, and templates on startup
    console.log('📥 Starting immediate smart download on sync init...');
    smartDownloadTasks().catch(error => {
        console.warn('📥 Initial smart download failed:', error);
    });
    downloadAllLists().catch(error => {
        console.warn('📥 Initial lists download failed:', error);
    });
    downloadAllTemplates().catch(error => {
        console.warn('📥 Initial templates download failed:', error);
    });
    
    // Setup event listeners for sync triggers
    setupSyncEventListeners();
    
    // Setup periodic backup sync
    setupPeriodicSync();
    
    console.log('✅ Simple sync system initialized with immediate sync pattern');
}

/**
 * Setup event listeners for sync triggers
 */
function setupSyncEventListeners() {
    // Debounced sync on page visibility change (max once per minute)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.currentUser) {
            const now = Date.now();
            if (now - lastVisibilitySync > 10000) { // 10 seconds minimum
                console.log('📥 Visibility sync - smart downloading tasks, lists, and templates...');
                lastVisibilitySync = now;
                downloadTasksFromCloud().catch(error => {
                    console.warn('📥 Visibility tasks download failed:', error);
                });
                downloadAllLists().catch(error => {
                    console.warn('📥 Visibility lists download failed:', error);
                });
                downloadAllTemplates().catch(error => {
                    console.warn('📥 Visibility templates download failed:', error);
                });
            }
        }
    });
    
    // Debounced window focus handler (max once per minute)  
    window.addEventListener('focus', () => {
        if (window.currentUser) {
            // Check if backup restore is in progress
            if (window.backupRestoreInProgress || window.justRestoredBackup || window.skipNextDownload) {
                console.log('🔒 FOCUS SYNC: Blocked - backup restore in progress');
                return;
            }
            
            const now = Date.now();
            if (now - lastFocusRefresh > 10000) { // 10 seconds minimum
                console.log('📥 Focus sync - smart downloading tasks and lists...');
                lastFocusRefresh = now;
                downloadTasksFromCloud().catch(error => {
                    console.warn('📥 Focus tasks download failed:', error);
                });
                downloadAllLists().catch(error => {
                    console.warn('📥 Focus lists download failed:', error);
                });
            }
        }
    });
    
    console.log('✅ Immediate sync events registered (focus + visibility)');
}

/**
 * Setup periodic backup sync
 */
function setupPeriodicSync() {
    setInterval(() => {
        if (navigator.onLine && window.currentUser) {
            console.log('📥 Backup periodic sync...');
            pullLatestFromCloud(false).catch(error => {
                console.warn('📥 Backup tasks sync failed:', error);
            });
            downloadAllLists().catch(error => {
                console.warn('📥 Backup lists sync failed:', error);
            });
            downloadAllTemplates().catch(error => {
                console.warn('📥 Backup templates sync failed:', error);
            });
        }
    }, 60000); // 1 minute intervals
}

/**
 * Upload all tasks to the server
 */
async function uploadAllTasks() {
    console.log('🔄 uploadAllTasks called - using simple sync pattern');
    
    // CRITICAL STALE BROWSER PROTECTION: Check flags first
    // EXCEPTION: Allow uploads during backup restore (user intentionally restored data)
    if (window.justRestoredBackup) {
        console.log('✅ BACKUP RESTORE: Tasks upload allowed - user explicitly restored this data');
    } else {
        if (window.staleBrowserDetected || window.skipInitialUpload) {
            console.error('🚨 BLOCKED: Tasks upload blocked - stale browser protection active');
            console.error('🛡️ Stale browser still downloading fresh data from cloud');
            return;
        }
    }
    
    if (!window.currentUser?.user?.id) {
        console.log('⚠️ No user ID available for tasks upload');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tasks/sync`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: window.currentUser.user.id,
                tasks: tasks.map(task => cleanTaskForStorage(task))
            })
        });
        
        if (response.ok) {
            console.log('✅ Tasks synced to server successfully');
            // Update last sync timestamp
            localStorage.setItem('lastSyncTime', Date.now().toString());
        } else {
            console.error('❌ TASKS SYNC: Upload failed:', response.status);
            throw new Error(`Upload failed: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ TASKS SYNC: Upload error:', error);
        throw error;
    }
}

/**
 * Download all tasks from server
 */
async function downloadAllTasks() {
    if (!window.currentUser?.user?.id) {
        console.log('⚠️ No user ID available for download');
        return;
    }
    
    // FRESH BROWSER: Override protection for fresh browsers (no sync history)
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    const isFreshBrowser = !lastSyncTime || lastSyncTime === '0' || lastSyncTime === 'null';
    
    // MANDATORY REFRESH: Override protection for stale browser or fresh browser
    if (window.forceMandatoryRefresh || isFreshBrowser) {
        if (isFreshBrowser) {
            console.warn('🆕 FRESH BROWSER: Forcing download despite protection flags');
        } else {
            console.warn('🚨 MANDATORY REFRESH: Forcing download despite protection flags');
        }
        console.warn('🛡️ This overrides normal protection to prevent database conflicts');
    } else {
        // BACKUP RESTORE PROTECTION - highest priority
        if (window.justRestoredBackup || window.skipNextDownload || window.backupRestoreInProgress) {
            console.log('🔒 BLOCKED: Download skipped - backup restore in progress');
            return;
        }
        
        // Download protection - skip if just modified tasks
        if (window.justModifiedTasks) {
            console.log('📥 Skipping download - just modified tasks');
            return;
        }
    }
    
    // Get auth token with fallback
    const authToken = window.currentUser?.token || localStorage.getItem('authToken');
    if (!authToken) {
        console.log('⚠️ No auth token available for download');
        return;
    }
    
    try {
        console.log('📥 Downloading tasks from server...');
        
        const response = await fetch(`${API_BASE}/tasks/${window.currentUser.user.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }
        
        const data = await response.json();
        const serverTasks = data.tasks || [];
        
        console.log('📥 Downloaded', serverTasks.length, 'tasks from server');
        
        // MANDATORY REFRESH: Direct replacement with server data
        if (window.forceMandatoryRefresh || window.staleBrowserMode) {
            console.log('🚨 MANDATORY REFRESH: Directly replacing with server data');
            tasks = serverTasks;
        } else {
            // Normal sync: merge with conflict detection
            await mergeTasksWithConflictResolution(serverTasks);
        }
        
        // Clean up event registry and heal properties
        if (typeof cleanEventRegistry === 'function') {
            cleanEventRegistry();
        }
        if (typeof healEventProperties === 'function') {
            healEventProperties();
        }
        
        // Save merged tasks
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        
        // Update UI
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
        
        console.log('✅ Tasks download completed');
        
    } catch (error) {
        console.error('❌ Error downloading tasks:', error);
        throw error;
    }
}

/**
 * Smart download tasks with additional logic
 */
async function smartDownloadTasks() {
    return downloadAllTasks();
}

/**
 * Download tasks from cloud (alias for compatibility)
 */
async function downloadTasksFromCloud() {
    return downloadAllTasks();
}

/**
 * Pull latest data from cloud
 */
async function pullLatestFromCloud(force = false) {
    if (force || (!window.justModifiedTasks && !window.backupRestoreInProgress)) {
        return downloadAllTasks();
    }
}

/**
 * Merge server tasks with local tasks, handling conflicts
 */
async function mergeTasksWithConflictResolution(serverTasks) {
    // Simple merge strategy: server takes precedence for now
    // This can be enhanced with more sophisticated conflict resolution
    
    if (!tasks || tasks.length === 0) {
        // No local tasks, use server tasks
        tasks = serverTasks;
        return;
    }
    
    if (serverTasks.length === 0) {
        // No server tasks, keep local tasks
        return;
    }
    
    // Create maps for efficient lookup
    const localTaskMap = new Map(tasks.map(t => [t.id, t]));
    const serverTaskMap = new Map(serverTasks.map(t => [t.id, t]));
    
    const mergedTasks = [];
    
    // Process server tasks (they take precedence)
    for (const serverTask of serverTasks) {
        const localTask = localTaskMap.get(serverTask.id);
        
        if (localTask) {
            // Task exists locally, check for conflicts
            const serverTime = new Date(serverTask.updatedAt || serverTask.createdAt || 0);
            const localTime = new Date(localTask.updatedAt || localTask.createdAt || 0);
            
            if (serverTime >= localTime) {
                // Server version is newer or same, use it
                mergedTasks.push(serverTask);
            } else {
                // Local version is newer, use it
                mergedTasks.push(localTask);
            }
        } else {
            // New task from server
            mergedTasks.push(serverTask);
        }
    }
    
    // Add local-only tasks that don't exist on server
    for (const localTask of tasks) {
        if (!serverTaskMap.has(localTask.id)) {
            mergedTasks.push(localTask);
        }
    }
    
    tasks = mergedTasks;
    console.log(`✅ Merged tasks: ${serverTasks.length} from server, ${tasks.length} total after merge`);
}

/**
 * Upload all lists to the server
 */
async function uploadAllLists() {
    console.log('🔄 uploadAllLists called - using simple sync pattern');
    
    // CRITICAL STALE BROWSER PROTECTION: Check flags first
    if (window.justRestoredBackup) {
        console.log('✅ BACKUP RESTORE: Lists upload allowed - user explicitly restored this data');
    } else {
        if (window.staleBrowserDetected || window.skipInitialUpload) {
            console.error('🚨 BLOCKED: Lists upload blocked - stale browser protection active');
            console.error('🛡️ Stale browser still downloading fresh data from cloud');
            return;
        }
    }
    
    if (!window.currentUser?.user?.id) {
        console.log('⚠️ No user ID available for lists upload');
        return;
    }
    
    try {
        const listsToUpload = typeof listSections !== 'undefined' ? listSections : [];
        
        const response = await fetch(`${API_BASE}/lists/sync`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: window.currentUser.user.id,
                listSections: listsToUpload
            })
        });
        
        if (response.ok) {
            console.log('✅ Lists synced to server successfully');
        } else {
            console.error('❌ LISTS SYNC: Upload failed:', response.status);
            throw new Error(`Lists upload failed: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ LISTS SYNC: Upload error:', error);
        throw error;
    }
}

/**
 * Download all lists from server
 */
async function downloadAllLists() {
    if (!window.currentUser?.user?.id) return;
    
    // FRESH BROWSER: Override protection for fresh browsers
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    const isFreshBrowser = !lastSyncTime || lastSyncTime === '0' || lastSyncTime === 'null';
    
    // MANDATORY REFRESH: Override protection for stale browser or fresh browser
    if (window.forceMandatoryRefresh || window.staleBrowserMode || isFreshBrowser) {
        if (isFreshBrowser) {
            console.log('🆕 FRESH BROWSER: Forcing lists download despite protection flags');
        } else {
            console.log('🚨 MANDATORY REFRESH: Forcing lists download despite protection flags');
        }
    } else {
        // BACKUP RESTORE PROTECTION - highest priority
        if (window.justRestoredBackup || window.skipNextDownload || window.backupRestoreInProgress) {
            console.log('🔒 BLOCKED: Lists download skipped - backup restore in progress');
            return;
        }
        
        // Don't download if we just modified lists
        if (window.justModifiedLists) {
            console.log('📥 Skipping lists download - just modified lists');
            return;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const serverListSections = data.listSections || [];
            
            // MANDATORY REFRESH: Direct replacement with server data
            if (window.forceMandatoryRefresh || window.staleBrowserMode) {
                console.log('🚨 MANDATORY REFRESH: Directly replacing lists with server data');
                if (typeof listSections !== 'undefined') {
                    listSections = serverListSections;
                    localStorage.setItem('gtd_list_sections', JSON.stringify(listSections));
                    if (currentView === 'lists' && typeof renderListsView === 'function') {
                        renderListsView();
                    }
                }
            } else {
                // Normal sync: safety checks
                const localListCount = typeof listSections !== 'undefined' ? listSections.length : 0;
                const serverListCount = serverListSections.length;
                
                // Safety: Prevent data loss
                if (Math.abs(localListCount - serverListCount) > 2 || localListCount === 0 || serverListCount === 0) {
                    console.log(`📥 LISTS SYNC: Local count ${localListCount}, server count ${serverListCount}`);
                }
                
                // Additional safety: Check if server has significantly fewer lists
                if (serverListCount < localListCount * 0.5 && localListCount > 2) {
                    console.log('🛡️ LISTS SAFETY: Server has significantly fewer lists than local - skipping download');
                    return;
                }
                
                if (typeof listSections !== 'undefined') {
                    listSections = serverListSections;
                    localStorage.setItem('gtd_list_sections', JSON.stringify(listSections));
                    if (currentView === 'lists' && typeof renderListsView === 'function') {
                        renderListsView();
                    }
                }
            }
        } else {
            console.log('📥 LISTS SYNC: Download failed with status:', response.status);
        }
    } catch (error) {
        console.log('📥 LISTS SYNC: Download error:', error);
    }
}

/**
 * Upload all templates to the server
 */
async function uploadAllTemplates() {
    if (!window.currentUser?.user?.id) return;
    
    try {
        const templatesArray = typeof customTemplates !== 'undefined' ? customTemplates : [];
        
        const response = await fetch(`${API_BASE}/templates/sync`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: window.currentUser.user.id,
                templates: templatesArray
            })
        });
        
        if (response.ok) {
            console.log('✅ Templates synced to server successfully');
        } else {
            console.error('❌ TEMPLATES SYNC: Upload failed:', response.status);
        }
    } catch (error) {
        console.error('❌ TEMPLATES SYNC: Upload error:', error);
    }
}

/**
 * Download all templates from server
 */
async function downloadAllTemplates() {
    if (!window.currentUser?.user?.id) return;
    
    // MANDATORY REFRESH: Override protection for stale browser
    if (window.forceMandatoryRefresh || window.staleBrowserMode) {
        console.log('🚨 MANDATORY REFRESH: Forcing templates download despite protection flags');
    } else {
        // BACKUP RESTORE PROTECTION - highest priority
        if (window.justRestoredBackup || window.skipNextDownload || window.backupRestoreInProgress) {
            console.log('🔒 BLOCKED: Templates download skipped - backup restore in progress');
            return;
        }
        
        // Don't download if we just modified templates
        if (window.justModifiedTemplates) {
            console.log('📥 Skipping templates download - just modified templates');
            return;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE}/templates/${window.currentUser.user.id}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const serverTemplates = data.templates || [];
            
            // MANDATORY REFRESH: Direct replacement with server data
            if (window.forceMandatoryRefresh || window.staleBrowserMode) {
                console.log('🚨 MANDATORY REFRESH: Directly replacing templates with server data');
                if (typeof customTemplates !== 'undefined') {
                    customTemplates = serverTemplates;
                    localStorage.setItem('gtdTemplates', JSON.stringify(serverTemplates));
                    if (typeof renderTemplateButtons === 'function') {
                        renderTemplateButtons();
                    }
                }
            } else {
                // Normal sync: Compare and update
                const localTemplates = typeof customTemplates !== 'undefined' ? customTemplates : [];
                
                if (JSON.stringify(serverTemplates) !== JSON.stringify(localTemplates)) {
                    if (typeof customTemplates !== 'undefined') {
                        customTemplates = serverTemplates;
                        localStorage.setItem('gtdTemplates', JSON.stringify(serverTemplates));
                        if (typeof renderTemplateButtons === 'function') {
                            renderTemplateButtons();
                        }
                    }
                }
            }
        } else {
            console.log('📥 TEMPLATES SYNC: Download failed:', response.status);
        }
    } catch (error) {
        console.log('📥 TEMPLATES SYNC: Download error:', error);
    }
}

/**
 * Show sync status in UI
 */
function showSyncStatus(message, type) {
    // Create or update sync status indicator
    let syncIndicator = document.getElementById('sync-status');
    if (!syncIndicator) {
        syncIndicator = document.createElement('div');
        syncIndicator.id = 'sync-status';
        syncIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(syncIndicator);
    }
    
    syncIndicator.textContent = message;
    syncIndicator.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                         type === 'error' ? '#f44336' : '#2196F3';
    syncIndicator.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (syncIndicator) {
            syncIndicator.style.display = 'none';
        }
    }, 3000);
}

/**
 * Delete a specific task from the cloud
 */
async function deleteTaskFromCloud(taskId) {
    if (!window.currentUser?.user?.id) {
        console.log('⚠️ No user credentials for cloud delete');
        return false;
    }
    
    try {
        console.log(`🗑️ Deleting task ${taskId} from cloud...`);
        
        const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE',
            mode: 'cors',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Delete failed: ${response.status} ${errorData.error || response.statusText}`);
        }
        
        console.log(`✅ Task ${taskId} deleted from cloud successfully`);
        return true;
        
    } catch (error) {
        console.error('❌ Failed to delete task from cloud:', error);
        throw error;
    }
}

/**
 * Sync all data types
 */
async function syncAll() {
    if (!window.currentUser?.user?.id) {
        console.log('⚠️ Cannot sync - no user credentials');
        return;
    }
    
    console.log('🔄 Starting full sync...');
    showSyncStatus('Syncing...', 'info');
    
    try {
        // Upload all data first
        await Promise.all([
            uploadAllTasks().catch(e => console.warn('Tasks upload failed:', e)),
            uploadAllLists().catch(e => console.warn('Lists upload failed:', e)),
            uploadAllTemplates().catch(e => console.warn('Templates upload failed:', e))
        ]);
        
        // Then download to get latest state
        await Promise.all([
            downloadAllTasks().catch(e => console.warn('Tasks download failed:', e)),
            downloadAllLists().catch(e => console.warn('Lists download failed:', e)),
            downloadAllTemplates().catch(e => console.warn('Templates download failed:', e))
        ]);
        
        // Update sync timestamp
        localStorage.setItem('lastSyncTime', Date.now().toString());
        
        showSyncStatus('Sync complete', 'success');
        console.log('✅ Full sync completed');
        
    } catch (error) {
        console.error('❌ Full sync failed:', error);
        showSyncStatus('Sync failed', 'error');
        throw error;
    }
}

/**
 * Check if we're online and can sync
 */
function canSync() {
    return navigator.onLine && window.currentUser?.user?.id;
}

/**
 * Force a complete resync
 */
async function forceResync() {
    console.log('🔄 Forcing complete resync...');
    
    // Clear protection flags
    window.justModifiedTasks = false;
    window.justModifiedLists = false;
    window.justModifiedTemplates = false;
    
    // Enable mandatory refresh mode
    window.forceMandatoryRefresh = true;
    
    try {
        await syncAll();
    } finally {
        // Disable mandatory refresh mode
        window.forceMandatoryRefresh = false;
    }
}

/**
 * Initialize sync system if needed
 */
function ensureSyncInitialized() {
    if (!window.syncInitialized && window.currentUser?.user?.id) {
        initializeSimpleSync();
        window.syncInitialized = true;
    }
}

// Hide the green DATABASE UPDATED overlay after page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Find and hide the green overlay - multiple approaches
        const overlays = document.querySelectorAll('div');
        overlays.forEach(overlay => {
            // Check for green background
            if ((overlay.style.background === '#4caf50' || 
                 overlay.style.backgroundColor === '#4caf50' ||
                 overlay.style.background === 'rgb(76, 175, 80)') && 
                overlay.style.position === 'fixed') {
                overlay.style.display = 'none';
                console.log('✅ Hiding DATABASE UPDATED overlay');
            }
            
            // Also check for DATABASE UPDATED text
            if (overlay.textContent && overlay.textContent.includes('DATABASE UPDATED')) {
                const parent = overlay.closest('div[style*="position: fixed"]');
                if (parent) {
                    parent.style.display = 'none';
                    console.log('✅ Hiding DATABASE UPDATED overlay by text');
                }
            }
        });
        
        // Hide any modal with template literals showing
        const modals = document.querySelectorAll('[style*="display: block"]');
        modals.forEach(modal => {
            if (modal.innerHTML && modal.innerHTML.includes('${seriesTasks')) {
                modal.style.display = 'none';
                console.log('✅ Hiding broken Repeat Series Manager modal');
            }
        });
    }, 2000); // Hide after 2 seconds
});