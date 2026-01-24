/**
 * Data Synchronization Module for HyperFiler Pro
 * Handles cloud sync for tasks, lists, and templates
 */

// API_BASE is defined by utils.js - no redeclaration needed here

// Global sync lock to prevent race conditions
let syncPromise = null;

/**
 * Wrapper function to ensure only one sync operation at a time
 * Prevents race conditions by queuing sync operations
 */
async function withSyncLock(syncFunction, ...args) {
    // If sync is already running, wait for it to complete
    if (syncPromise) {
        console.log('🔒 Sync already in progress, waiting...');
        await syncPromise;
    }
    
    // Start new sync operation
    syncPromise = syncFunction(...args);
    
    try {
        const result = await syncPromise;
        return result;
    } catch (error) {
        console.error('❌ Sync operation failed:', error);
        throw error;
    } finally {
        // Always clear the lock when done
        syncPromise = null;
    }
}

// Sync status tracking
let lastVisibilitySync = 0;
let lastFocusRefresh = 0;
let syncEventListenersInitialized = false;

// Store event listener references for cleanup
let visibilityChangeHandler = null;
let focusHandler = null;

/**
 * Initialize the sync system
 */
function initializeSimpleSync() {
    // MOBILE FIX: Try to restore currentUser from localStorage if not set
    if (!window.currentUser) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                window.currentUser = JSON.parse(storedUser);
                console.log('✅ Restored currentUser from localStorage for mobile sync');
            } catch (e) {
                console.warn('⚠️ Failed to parse currentUser from localStorage:', e);
            }
        }
    }
    
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
 * Setup event listeners for sync triggers (with race condition prevention)
 */
function setupSyncEventListeners() {
    // Prevent duplicate event listener registration
    if (syncEventListenersInitialized) {
        console.log('⚠️ Sync event listeners already initialized, skipping...');
        return;
    }
    
    // Unified debounce timing for both visibility and focus events
    let lastUnifiedSync = 0;
    const SYNC_DEBOUNCE_MS = 10000; // 10 seconds minimum between syncs
    
    /**
     * Unified sync handler for both visibility and focus events
     * Prevents race conditions by using single timing mechanism
     */
    const performUnifiedSync = (eventType) => {
        // MOBILE FIX: Ensure currentUser is loaded before checking
        if (!ensureCurrentUserLoaded()) {
            console.log(`🔒 ${eventType} sync blocked - no user authenticated`);
            return;
        }
        
        // Check if backup restore is in progress
        if (window.backupRestoreInProgress || window.justRestoredBackup || window.skipNextDownload) {
            console.log(`🔒 ${eventType} sync blocked - backup restore in progress`);
            return;
        }
        
        const now = Date.now();
        if (now - lastUnifiedSync > SYNC_DEBOUNCE_MS) {
            console.log(`📥 ${eventType} sync - performing comprehensive sync...`);
            lastUnifiedSync = now;
            
            // Update both tracking variables for backward compatibility
            lastVisibilitySync = now;
            lastFocusRefresh = now;
            
            performComprehensiveSync().catch(error => {
                console.warn(`📥 ${eventType} comprehensive sync failed:`, error);
            });
        } else {
            console.log(`🔒 ${eventType} sync skipped - within debounce period`);
        }
    };
    
    // Create event handlers with proper cleanup references
    visibilityChangeHandler = () => {
        if (!document.hidden) {
            performUnifiedSync('VISIBILITY');
        }
    };
    
    focusHandler = () => {
        performUnifiedSync('FOCUS');
    };
    
    // Register event listeners
    document.addEventListener('visibilitychange', visibilityChangeHandler);
    window.addEventListener('focus', focusHandler);
    
    // Mark as initialized to prevent duplicates
    syncEventListenersInitialized = true;
    
    console.log('✅ Unified sync event listeners registered (focus + visibility with race condition prevention)');
}

/**
 * Cleanup sync event listeners (for testing or re-initialization)
 */
function cleanupSyncEventListeners() {
    if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        visibilityChangeHandler = null;
    }
    
    if (focusHandler) {
        window.removeEventListener('focus', focusHandler);
        focusHandler = null;
    }
    
    syncEventListenersInitialized = false;
    console.log('🧹 Sync event listeners cleaned up');
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
 * Upload all tasks to the server (internal implementation)
 */
async function _uploadAllTasksInternal() {
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
    
    // MOBILE FIX: Ensure currentUser is loaded
    if (!ensureCurrentUserLoaded() || !window.currentUser?.user?.id) {
        console.log('⚠️ No user ID available for tasks upload');
        return;
    }
    
    try {
        const response = await fetch(`${window.API_BASE}/tasks/sync`, {
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
 * Upload all tasks to the server (with sync lock)
 */
async function uploadAllTasks() {
    return withSyncLock(_uploadAllTasksInternal);
}

/**
 * Download all tasks from server (internal implementation)
 */
async function _downloadAllTasksInternal() {
    // MOBILE FIX: Ensure currentUser is loaded
    if (!ensureCurrentUserLoaded() || !window.currentUser?.user?.id) {
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
    
    // Get auth token with fallback (check all possible locations)
    const authToken = window.currentUser?.token || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
        console.log('⚠️ No auth token available for download');
        return;
    }
    
    try {
        console.log('📥 Downloading tasks from server...');
        
        const response = await fetch(`${window.API_BASE}/tasks/${window.currentUser.user.id}`, {
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
            window.tasks = tasks; // Sync to window
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
 * Download all tasks from server (with sync lock)
 */
async function downloadAllTasks() {
    return withSyncLock(_downloadAllTasksInternal);
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
        window.tasks = tasks; // Sync to window
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
    window.tasks = tasks; // Sync to window
    console.log(`✅ Merged tasks: ${serverTasks.length} from server, ${tasks.length} total after merge`);
}

/**
 * Upload all lists to the server (internal implementation)
 */
async function _uploadAllListsInternal() {
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
        const listsToUpload = window.listSections || [];
        
        const response = await fetch(`${window.API_BASE}/lists/sync`, {
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
 * Upload all lists to the server (with sync lock)
 */
async function uploadAllLists() {
    return withSyncLock(_uploadAllListsInternal);
}

/**
 * Download all lists from server (internal implementation)
 */
async function _downloadAllListsInternal() {
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
        const response = await fetch(`${window.API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const serverListSections = data.listSections || [];
            
            // MANDATORY REFRESH: Direct replacement with server data - BUT STILL CHECK FOR DATA LOSS
            if (window.forceMandatoryRefresh || window.staleBrowserMode) {
                console.log('🚨 MANDATORY REFRESH: Attempting to replace lists with server data');
                
                // CRITICAL SAFETY: Even in mandatory refresh, never replace with empty unless explicitly cleared
                const localListCount = typeof listSections !== 'undefined' ? listSections.length : 0;
                const serverListCount = serverListSections.length;
                
                if (serverListCount === 0 && localListCount > 0 && !window.justClearedAllData) {
                    console.error('🚨 MANDATORY REFRESH SAFETY: Server returned empty lists but local has data!');
                    console.error('🛡️ Even in mandatory refresh mode, this looks like data loss. Blocking sync.');
                    console.error('🔧 If you intentionally cleared server data, set window.justClearedAllData = true first');
                    return;
                }
                
                if (typeof listSections !== 'undefined') {
                    console.log('✅ MANDATORY REFRESH: Safety checks passed, replacing with server data');
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
                
                // CRITICAL BUG FIX: Enhanced safety checks to prevent data loss
                console.log(`🔍 LISTS SYNC SAFETY CHECK: Local count ${localListCount}, server count ${serverListCount}`);
                
                // CRITICAL: Never replace local lists with empty server lists unless local is also empty
                if (serverListCount === 0 && localListCount > 0) {
                    console.error('🚨 CRITICAL SAFETY: Server returned empty lists but local has data - BLOCKING sync to prevent data loss!');
                    console.error('🛡️ This likely means server connection issues or auth problems. Local data preserved.');
                    return;
                }
                
                // Additional safety: Check if server has significantly fewer lists
                if (serverListCount < localListCount * 0.5 && localListCount > 1) {
                    console.error('🛡️ LISTS SAFETY: Server has significantly fewer lists than local - BLOCKING download to prevent data loss');
                    console.error(`🛡️ Local: ${localListCount} lists, Server: ${serverListCount} lists - discrepancy too large`);
                    return;
                }
                
                // Only proceed if safety checks pass
                if (typeof listSections !== 'undefined') {
                    console.log('✅ LISTS SAFETY: Checks passed, updating local lists with server data');
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
 * Download all lists from server (with sync lock)
 */
async function downloadAllLists() {
    return withSyncLock(_downloadAllListsInternal);
}

/**
 * Perform comprehensive sync - upload and download all data types
 * Uses sync lock to prevent race conditions
 */
async function performComprehensiveSync() {
    return withSyncLock(async () => {
        console.log('🔄 Starting comprehensive sync...');
        try {
            // Upload local changes first
            await _uploadAllTasksInternal();
            await _uploadAllListsInternal();
            await _uploadAllTemplatesInternal();
            
            // Then download latest data
            await _downloadAllTasksInternal();
            await _downloadAllListsInternal();
            await _downloadAllTemplatesInternal();
            
            console.log('✅ Comprehensive sync completed successfully');
        } catch (error) {
            console.error('❌ Comprehensive sync failed:', error);
            throw error;
        }
    });
}

/**
 * Upload all templates to the server (internal implementation)  
 */
async function _uploadAllTemplatesInternal() {
    console.log('📤 [ULTRA-DEBUG] _uploadAllTemplatesInternal called');
    console.log('📤 [ULTRA-DEBUG] window.currentUser:', window.currentUser?.user?.id);
    
    if (!window.currentUser?.user?.id) {
        console.log('📤 [ULTRA-DEBUG] No user ID, returning');
        return;
    }
    
    try {
        const templatesArray = window.customTemplates || [];
        console.log('📤 [ULTRA-DEBUG] customTemplates variable:', customTemplates);
        console.log('📤 [ULTRA-DEBUG] window.customTemplates:', window.customTemplates);
        console.log('📤 [ULTRA-DEBUG] Templates to upload:', templatesArray);
        console.log('📤 [ULTRA-DEBUG] Templates count:', templatesArray.length);
        
        const uploadData = {
            userId: window.currentUser.user.id,
            templates: templatesArray
        };
        console.log('📤 [ULTRA-DEBUG] Upload payload:', JSON.stringify(uploadData, null, 2));
        console.log('📤 [ULTRA-DEBUG] API_BASE:', window.API_BASE);
        console.log('📤 [ULTRA-DEBUG] Upload URL:', `${window.API_BASE}/templates/sync`);
        
        const response = await fetch(`${window.API_BASE}/templates/sync`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(uploadData)
        });
        
        console.log('📤 [ULTRA-DEBUG] Server response status:', response.status);
        console.log('📤 [ULTRA-DEBUG] Server response ok:', response.ok);
        
        if (response.ok) {
            const responseData = await response.text();
            console.log('📤 [ULTRA-DEBUG] Server response data:', responseData);
            console.log('✅ Templates synced to server successfully');
        } else {
            const errorData = await response.text();
            console.error('📤 [ULTRA-DEBUG] Server error response:', errorData);
            console.error('❌ TEMPLATES SYNC: Upload failed:', response.status);
        }
    } catch (error) {
        console.error('📤 [ULTRA-DEBUG] Upload exception:', error);
        console.error('❌ TEMPLATES SYNC: Upload error:', error);
    }
}

/**
 * Upload all templates to the server (with sync lock)
 */
async function uploadAllTemplates() {
    return withSyncLock(_uploadAllTemplatesInternal);
}

/**
 * Download all templates from server (internal implementation)
 */
async function _downloadAllTemplatesInternal() {
    console.log('📥 [ULTRA-DEBUG] _downloadAllTemplatesInternal called');
    console.log('📥 [ULTRA-DEBUG] window.currentUser:', window.currentUser?.user?.id);
    console.log('📥 [ULTRA-DEBUG] localStorage gtdTemplates:', localStorage.getItem('gtdTemplates'));
    console.log('📥 [ULTRA-DEBUG] window.customTemplates:', window.customTemplates);
    
    if (!window.currentUser?.user?.id) {
        console.log('📥 [ULTRA-DEBUG] No user ID, returning');
        return;
    }
    
    // Check persistent protection flag from localStorage
    const protectionData = localStorage.getItem('templateProtection');
    if (protectionData) {
        try {
            const protection = JSON.parse(protectionData);
            const timeSinceProtection = Date.now() - protection.timestamp;
            console.log('📥 [ULTRA-DEBUG] Found localStorage protection:', protection);
            console.log('📥 [ULTRA-DEBUG] Time since protection set:', timeSinceProtection, 'ms');
            
            // Respect protection for 30 seconds
            if (timeSinceProtection < 30000) {
                console.log('📥 [ULTRA-DEBUG] BLOCKED by localStorage protection - recent template modification');
                return;
            } else {
                console.log('📥 [ULTRA-DEBUG] Protection expired, removing flag');
                localStorage.removeItem('templateProtection');
            }
        } catch (e) {
            console.log('📥 [ULTRA-DEBUG] Invalid protection data, removing');
            localStorage.removeItem('templateProtection');
        }
    }
    
    // MANDATORY REFRESH: Override protection for stale browser
    if (window.forceMandatoryRefresh || window.staleBrowserMode) {
        console.log('🚨 MANDATORY REFRESH: Forcing templates download despite protection flags');
    } else {
        // BACKUP RESTORE PROTECTION - highest priority
        if (window.justRestoredBackup || window.skipNextDownload || window.backupRestoreInProgress) {
            console.log('🔒 BLOCKED: Templates download skipped - backup restore in progress');
            return;
        }
        
        // Don't download if we just modified templates (memory flag)
        if (window.justModifiedTemplates) {
            console.log('📥 [ULTRA-DEBUG] BLOCKED by memory flag - just modified templates');
            return;
        }
    }
    
    try {
        const response = await fetch(`${window.API_BASE}/templates/${window.currentUser.user.id}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const serverTemplates = data.templates || [];
            console.log('📥 [ULTRA-DEBUG] Server response received');
            console.log('📥 [ULTRA-DEBUG] Server templates:', serverTemplates);
            console.log('📥 [ULTRA-DEBUG] Server templates count:', serverTemplates.length);
            
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
                // Smart sync: Preserve local deletions, only add new templates from server
                const localTemplates = typeof customTemplates !== 'undefined' ? customTemplates : [];
                console.log('📥 [ULTRA-DEBUG] Local templates before sync:', localTemplates);
                console.log('📥 [ULTRA-DEBUG] Local templates count:', localTemplates.length);
                
                if (JSON.stringify(serverTemplates) !== JSON.stringify(localTemplates)) {
                    console.log('📥 [ULTRA-DEBUG] Templates differ - analyzing changes...');
                    
                    // Smart merge logic: Only add new templates from server, don't restore deleted ones
                    const newTemplatesFromServer = serverTemplates.filter(serverTemplate => 
                        !localTemplates.includes(serverTemplate)
                    );
                    
                    console.log('📥 [ULTRA-DEBUG] New templates from server:', newTemplatesFromServer);
                    
                    if (newTemplatesFromServer.length > 0) {
                        console.log('📥 [ULTRA-DEBUG] Adding new templates from server:', newTemplatesFromServer);
                        const mergedTemplates = [...localTemplates, ...newTemplatesFromServer];
                        
                        if (typeof customTemplates !== 'undefined') {
                            customTemplates = mergedTemplates;
                            window.customTemplates = mergedTemplates;
                            localStorage.setItem('gtdTemplates', JSON.stringify(mergedTemplates));
                            console.log('📥 [ULTRA-DEBUG] Updated with merged templates:', mergedTemplates);
                            
                            if (typeof renderTemplateButtons === 'function') {
                                renderTemplateButtons();
                            }
                        }
                    } else {
                        console.log('📥 [ULTRA-DEBUG] No new templates from server, keeping local templates');
                    }
                } else {
                    console.log('📥 [ULTRA-DEBUG] Templates are identical, no sync needed');
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
 * Download all templates from server (with sync lock)
 */
async function downloadAllTemplates() {
    return withSyncLock(_downloadAllTemplatesInternal);
}

/**
 * Perform stale browser recovery - download all data without uploads
 * Uses sync lock to prevent race conditions
 */
async function performStaleBrowserRecovery() {
    return withSyncLock(async () => {
        console.log('🔄 Starting stale browser recovery...');
        try {
            // Only download for stale browser recovery - no uploads
            await _downloadAllTasksInternal();
            await _downloadAllListsInternal();
            await _downloadAllTemplatesInternal();
            
            console.log('✅ Stale browser recovery completed successfully');

            // Clear stale browser flags to allow uploads after recovery
            window.staleBrowserDetected = false;
            window.skipInitialUpload = false;
            console.log('🔓 Stale browser protection cleared - uploads now allowed');
        } catch (error) {
            console.error('❌ Stale browser recovery failed:', error);
            throw error;
        }
    });
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
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(syncIndicator);
    }

    // Add spinner for 'info' type (syncing)
    if (type === 'info') {
        syncIndicator.innerHTML = `
            <div class="spinner spinner-small" style="border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>
            <span>${message}</span>
        `;
    } else {
        syncIndicator.innerHTML = `<span>${message}</span>`;
    }

    syncIndicator.style.backgroundColor = type === 'success' ? '#4CAF50' :
                                         type === 'error' ? '#f44336' : '#2196F3';
    syncIndicator.style.display = 'flex';

    // Auto-hide after 3 seconds (except for info which stays until replaced)
    if (type !== 'info') {
        setTimeout(() => {
            if (syncIndicator) {
                syncIndicator.style.display = 'none';
            }
        }, 3000);
    }
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
        
        const response = await fetch(`${window.API_BASE}/tasks/${taskId}`, {
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
 * Ensure currentUser is loaded from localStorage if needed (mobile fix)
 */
function ensureCurrentUserLoaded() {
    if (!window.currentUser) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                window.currentUser = JSON.parse(storedUser);
                console.log('✅ Restored currentUser from localStorage');
                return true;
            } catch (e) {
                console.warn('⚠️ Failed to parse currentUser from localStorage:', e);
            }
        }
    }
    return !!window.currentUser;
}

/**
 * Initialize sync system if needed
 */
function ensureSyncInitialized() {
    // Ensure currentUser is loaded first
    ensureCurrentUserLoaded();
    
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