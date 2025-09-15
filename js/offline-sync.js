/**
 * Offline Sync Queue System for HyperFiler Pro
 * Handles offline operations and syncs them when online
 * Maintains "server wins" conflict resolution strategy
 * Version: 1.0 (Step 3 - PWA Offline Implementation)
 */

// Offline sync queue storage key
const OFFLINE_QUEUE_KEY = 'hyperfiler_offline_queue';
const OFFLINE_STATUS_KEY = 'hyperfiler_offline_status';

// Queue operation types
const QUEUE_OPERATIONS = {
    CREATE_TASK: 'create_task',
    UPDATE_TASK: 'update_task', 
    DELETE_TASK: 'delete_task',
    CREATE_LIST: 'create_list',
    UPDATE_LIST: 'update_list',
    DELETE_LIST: 'delete_list',
    CREATE_TEMPLATE: 'create_template',
    UPDATE_TEMPLATE: 'update_template',
    DELETE_TEMPLATE: 'delete_template'
};

console.log('🔄 Offline Sync Queue System loaded - v1.0');

/**
 * Get current offline queue from localStorage
 */
function getOfflineQueue() {
    try {
        const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error('❌ Failed to load offline queue:', error);
        return [];
    }
}

/**
 * Save offline queue to localStorage
 */
function saveOfflineQueue(queue) {
    try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        console.log(`💾 Offline queue saved: ${queue.length} operations`);
    } catch (error) {
        console.error('❌ Failed to save offline queue:', error);
    }
}

/**
 * Add operation to offline queue
 */
function queueOfflineOperation(operation) {
    const queue = getOfflineQueue();
    
    // Add timestamp and unique ID
    const queuedOperation = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        ...operation
    };
    
    queue.push(queuedOperation);
    saveOfflineQueue(queue);
    
    console.log('📤 Queued offline operation:', queuedOperation.type, queuedOperation.id);
    updateOfflineStatus();
    
    return queuedOperation.id;
}

/**
 * Remove operation from queue by ID
 */
function removeFromQueue(operationId) {
    const queue = getOfflineQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    saveOfflineQueue(filteredQueue);
    
    console.log('🗑️ Removed from offline queue:', operationId);
    updateOfflineStatus();
}

/**
 * Clear entire offline queue
 */
function clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('🧹 Offline queue cleared');
    updateOfflineStatus();
}

/**
 * Get offline status info
 */
function getOfflineStatus() {
    const queue = getOfflineQueue();
    const isOnline = navigator.onLine;
    
    return {
        isOnline: isOnline,
        queueLength: queue.length,
        hasQueuedOperations: queue.length > 0,
        oldestOperation: queue.length > 0 ? queue[0].timestamp : null
    };
}

/**
 * Update offline status in localStorage for UI
 */
function updateOfflineStatus() {
    const status = getOfflineStatus();
    localStorage.setItem(OFFLINE_STATUS_KEY, JSON.stringify(status));
    
    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('offlineStatusUpdate', { 
        detail: status 
    }));
}

/**
 * Process offline queue when connection is restored
 * Maintains "server wins" conflict resolution
 */
async function processOfflineQueue() {
    const queue = getOfflineQueue();
    
    if (queue.length === 0) {
        console.log('✅ Offline queue empty - nothing to sync');
        return { success: true, processed: 0, failed: 0 };
    }
    
    if (!navigator.onLine) {
        console.log('🌐 Still offline - cannot process queue');
        return { success: false, reason: 'offline' };
    }
    
    console.log(`🔄 Processing offline queue: ${queue.length} operations`);
    
    let processed = 0;
    let failed = 0;
    const failedOperations = [];
    
    // Process operations in chronological order
    for (const operation of queue) {
        try {
            console.log(`📤 Processing queued operation: ${operation.type} (${operation.id})`);
            
            const success = await executeQueuedOperation(operation);
            
            if (success) {
                processed++;
                removeFromQueue(operation.id);
                console.log(`✅ Processed: ${operation.type} (${operation.id})`);
            } else {
                failed++;
                failedOperations.push(operation);
                console.log(`❌ Failed: ${operation.type} (${operation.id})`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${operation.type} (${operation.id}):`, error);
            failed++;
            failedOperations.push(operation);
        }
        
        // Small delay between operations to prevent overwhelming server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // After processing, do a comprehensive sync to ensure "server wins" 
    if (processed > 0) {
        console.log('🔄 Running comprehensive sync after queue processing...');
        
        try {
            // Use existing sync function if available
            if (typeof comprehensiveSync === 'function') {
                await comprehensiveSync();
                console.log('✅ Comprehensive sync completed after queue processing');
            }
        } catch (error) {
            console.error('❌ Comprehensive sync failed after queue processing:', error);
        }
    }
    
    updateOfflineStatus();
    
    console.log(`📊 Queue processing complete: ${processed} processed, ${failed} failed`);
    
    return {
        success: processed > 0 || failed === 0,
        processed,
        failed,
        failedOperations
    };
}

/**
 * Execute a queued operation using existing sync functions
 */
async function executeQueuedOperation(operation) {
    try {
        switch (operation.type) {
            case QUEUE_OPERATIONS.CREATE_TASK:
            case QUEUE_OPERATIONS.UPDATE_TASK:
                // For tasks, we'll upload all tasks to let server handle conflicts
                if (typeof uploadAllTasks === 'function') {
                    await uploadAllTasks();
                    return true;
                }
                break;
                
            case QUEUE_OPERATIONS.DELETE_TASK:
                // For deletions, we need to call the specific API
                if (operation.data && operation.data.id) {
                    return await deleteTaskFromServer(operation.data.id);
                }
                break;
                
            case QUEUE_OPERATIONS.CREATE_LIST:
            case QUEUE_OPERATIONS.UPDATE_LIST:
                if (typeof uploadAllLists === 'function') {
                    await uploadAllLists();
                    return true;
                }
                break;
                
            case QUEUE_OPERATIONS.DELETE_LIST:
                if (operation.data && operation.data.id) {
                    return await deleteListFromServer(operation.data.id);
                }
                break;
                
            case QUEUE_OPERATIONS.CREATE_TEMPLATE:
            case QUEUE_OPERATIONS.UPDATE_TEMPLATE:
                if (typeof uploadAllTemplates === 'function') {
                    await uploadAllTemplates();
                    return true;
                }
                break;
                
            case QUEUE_OPERATIONS.DELETE_TEMPLATE:
                if (operation.data && operation.data.id) {
                    return await deleteTemplateFromServer(operation.data.id);
                }
                break;
                
            default:
                console.error('❌ Unknown queued operation type:', operation.type);
                return false;
        }
        
    } catch (error) {
        console.error('❌ Failed to execute queued operation:', error);
        return false;
    }
    
    return false;
}

/**
 * Delete task from server (helper for queued deletions)
 */
async function deleteTaskFromServer(taskId) {
    try {
        const response = await fetchWithAuth(`${API_BASE}/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ Failed to delete task from server:', error);
        return false;
    }
}

/**
 * Delete list from server (helper for queued deletions)
 */
async function deleteListFromServer(listId) {
    try {
        const response = await fetchWithAuth(`${API_BASE}/api/lists/${listId}`, {
            method: 'DELETE'
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ Failed to delete list from server:', error);
        return false;
    }
}

/**
 * Delete template from server (helper for queued deletions)
 */
async function deleteTemplateFromServer(templateId) {
    try {
        const response = await fetchWithAuth(`${API_BASE}/api/templates/${templateId}`, {
            method: 'DELETE'
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ Failed to delete template from server:', error);
        return false;
    }
}

// ========== PUBLIC API FOR OFFLINE-AWARE OPERATIONS ==========

/**
 * Offline-aware task creation/update
 */
function offlineAwareTaskOperation(task, operationType = 'update') {
    if (navigator.onLine) {
        // Online - proceed normally (existing functions will handle)
        console.log('🌐 Online: proceeding with immediate sync');
        return true; // Let existing sync handle it
    } else {
        // Offline - queue the operation
        console.log('📴 Offline: queueing task operation');
        
        const operation = {
            type: operationType === 'create' ? QUEUE_OPERATIONS.CREATE_TASK : QUEUE_OPERATIONS.UPDATE_TASK,
            data: task,
            entity: 'task'
        };
        
        queueOfflineOperation(operation);
        return true;
    }
}

/**
 * Offline-aware task deletion
 */
function offlineAwareTaskDeletion(taskId) {
    if (navigator.onLine) {
        console.log('🌐 Online: proceeding with immediate deletion');
        return true; // Let existing sync handle it
    } else {
        console.log('📴 Offline: queueing task deletion');
        
        const operation = {
            type: QUEUE_OPERATIONS.DELETE_TASK,
            data: { id: taskId },
            entity: 'task'
        };
        
        queueOfflineOperation(operation);
        return true;
    }
}

/**
 * Initialize offline sync system
 */
function initializeOfflineSync() {
    console.log('🚀 Initializing offline sync system...');
    
    // Update initial status
    updateOfflineStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        console.log('🌐 Connection restored - processing offline queue');
        updateOfflineStatus();
        
        // Process queue after a short delay to ensure connection is stable
        setTimeout(() => {
            processOfflineQueue().catch(error => {
                console.error('❌ Failed to process offline queue:', error);
            });
        }, 1000);
    });
    
    window.addEventListener('offline', () => {
        console.log('📴 Connection lost - entering offline mode');
        updateOfflineStatus();
    });
    
    // Process any existing queue on startup if online
    if (navigator.onLine) {
        setTimeout(() => {
            const queue = getOfflineQueue();
            if (queue.length > 0) {
                console.log(`🔄 Found ${queue.length} queued operations on startup`);
                processOfflineQueue().catch(error => {
                    console.error('❌ Failed to process startup queue:', error);
                });
            }
        }, 2000); // Wait for app to fully initialize
    }
    
    console.log('✅ Offline sync system initialized');
}

// ========== EXPORTS FOR GLOBAL ACCESS ==========

// Make functions globally available
window.offlineSync = {
    // Queue management
    getQueue: getOfflineQueue,
    clearQueue: clearOfflineQueue,
    processQueue: processOfflineQueue,
    
    // Status
    getStatus: getOfflineStatus,
    updateStatus: updateOfflineStatus,
    
    // Operations
    queueOperation: queueOfflineOperation,
    taskOperation: offlineAwareTaskOperation,
    taskDeletion: offlineAwareTaskDeletion,
    
    // Initialization
    initialize: initializeOfflineSync,
    
    // Constants
    OPERATIONS: QUEUE_OPERATIONS
};

console.log('✅ Offline Sync Queue System ready');