/**
 * Offline UI Indicators for HyperFiler Pro
 * Provides visual feedback for offline status and queued operations
 * Version: 1.0 (Step 5 - PWA Offline Implementation)
 */

console.log('📱 Offline UI Indicators loading - v1.0');

// UI state tracking
let currentIndicator = null;
let offlineToast = null;
let statusIndicator = null;
let queueIndicator = null;

// Configuration
const TOAST_DURATION = 4000; // 4 seconds
const STATUS_UPDATE_INTERVAL = 5000; // 5 seconds

/**
 * Create network status indicator in the header
 */
function createNetworkStatusIndicator() {
    // Remove existing indicator if it exists
    if (statusIndicator) {
        statusIndicator.remove();
    }
    
    statusIndicator = document.createElement('div');
    statusIndicator.id = 'networkStatusIndicator';
    statusIndicator.style.cssText = `
        position: fixed;
        top: 14px;
        right: 80px;
        z-index: 9999;
        padding: 4px;
        border-radius: 50%;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        background: transparent;
        border: none;
        cursor: pointer;
        user-select: none;
        width: 24px;
        height: 24px;
    `;
    
    // Add click handler for manual refresh
    statusIndicator.addEventListener('click', async () => {
        if (window.networkStatus && window.networkStatus.refresh) {
            statusIndicator.style.opacity = '0.6';
            await window.networkStatus.refresh();
            setTimeout(() => {
                statusIndicator.style.opacity = '1';
            }, 500);
        }
    });
    
    document.body.appendChild(statusIndicator);
    console.log('📡 Network status indicator created');
}

/**
 * Update network status indicator
 */
function updateNetworkStatusIndicator(networkStatus) {
    if (!statusIndicator) {
        createNetworkStatusIndicator();
    }
    
    const indicator = window.networkStatus ? window.networkStatus.getIndicator() : {
        icon: '❓',
        text: 'Unknown',
        color: '#6b7280',
        status: 'unknown'
    };
    
    statusIndicator.innerHTML = `
        <span style="font-size: 16px;">${indicator.icon}</span>
    `;
    
    statusIndicator.style.backgroundColor = `transparent`;
    statusIndicator.style.color = indicator.color;
    statusIndicator.style.borderColor = `transparent`;
    statusIndicator.style.padding = '4px';
    
    // Add tooltip based on status
    const statusText = indicator.status === 'offline' ? 'Offline' : 
                      indicator.status === 'online' ? 'Online - Excellent' :
                      indicator.status === 'online-good' ? 'Online - Good' :
                      indicator.status === 'online-poor' ? 'Online - Poor' : 
                      'Checking...';
    statusIndicator.title = `Network: ${statusText} (click to refresh)`;
}

/**
 * Create offline queue indicator
 */
function createOfflineQueueIndicator() {
    // Remove existing indicator if it exists
    if (queueIndicator) {
        queueIndicator.remove();
    }
    
    queueIndicator = document.createElement('div');
    queueIndicator.id = 'offlineQueueIndicator';
    queueIndicator.style.cssText = `
        position: fixed;
        top: 12px;
        right: 200px;
        z-index: 9999;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        display: none;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        background: rgba(251, 191, 36, 0.2);
        color: #d97706;
        border: 1px solid rgba(251, 191, 36, 0.3);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        user-select: none;
    `;
    
    // Add click handler to show queue details
    queueIndicator.addEventListener('click', () => {
        showOfflineQueueDetails();
    });
    
    document.body.appendChild(queueIndicator);
    console.log('📤 Offline queue indicator created');
}

/**
 * Update offline queue indicator
 */
function updateOfflineQueueIndicator() {
    if (!queueIndicator) {
        createOfflineQueueIndicator();
    }
    
    const offlineStatus = window.offlineSync ? window.offlineSync.getStatus() : null;
    
    if (offlineStatus && offlineStatus.hasQueuedOperations) {
        const count = offlineStatus.queueLength;
        queueIndicator.innerHTML = `
            <span style="font-size: 14px;">📤</span>
            <span>${count} queued</span>
        `;
        queueIndicator.style.display = 'flex';
        queueIndicator.title = `${count} operations queued for sync (click for details)`;
    } else {
        queueIndicator.style.display = 'none';
    }
}

/**
 * Show offline queue details modal
 */
function showOfflineQueueDetails() {
    if (!window.offlineSync) return;
    
    const queue = window.offlineSync.getQueue();
    const status = window.offlineSync.getStatus();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 25px;
        max-width: 500px;
        width: 100%;
        max-height: 70vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    const queueItems = queue.map(op => `
        <div style="
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 8px;
            background: #f9fafb;
        ">
            <div style="font-weight: 600; color: #374151;">
                ${op.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                ${new Date(op.timestamp).toLocaleString()}
            </div>
        </div>
    `).join('');
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 1.5em; color: #1f2937;">📤 Offline Queue</h2>
            <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                background: none;
                border: none;
                font-size: 24px;
                color: #6b7280;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px; padding: 12px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <div style="font-weight: 600; color: #0c4a6e;">Status: ${status.isOnline ? 'Online' : 'Offline'}</div>
            <div style="font-size: 14px; color: #0369a1; margin-top: 4px;">${queue.length} operations queued</div>
        </div>
        
        ${queue.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 1.1em; color: #374151;">Queued Operations:</h3>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${queueItems}
                </div>
            </div>
        ` : `
            <div style="text-align: center; color: #6b7280; padding: 20px;">
                No operations queued
            </div>
        `}
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            ${queue.length > 0 && status.isOnline ? `
                <button onclick="processOfflineQueue(); this.closest('[style*=\"position: fixed\"]').remove()" style="
                    padding: 10px 20px;
                    background: #059669;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">Sync Now</button>
            ` : ''}
            <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                padding: 10px 20px;
                background: #6b7280;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
            ">Close</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Show offline toast notification
 */
function showOfflineToast(message, type = 'info', duration = TOAST_DURATION) {
    // Remove existing toast
    if (offlineToast) {
        offlineToast.remove();
    }
    
    const colors = {
        info: { bg: '#3b82f6', text: 'white' },
        success: { bg: '#059669', text: 'white' },
        warning: { bg: '#d97706', text: 'white' },
        error: { bg: '#dc2626', text: 'white' }
    };
    
    const color = colors[type] || colors.info;
    
    offlineToast = document.createElement('div');
    offlineToast.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        z-index: 10001;
        background: ${color.bg};
        color: ${color.text};
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    offlineToast.textContent = message;
    document.body.appendChild(offlineToast);
    
    // Animate in
    setTimeout(() => {
        offlineToast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (offlineToast) {
                offlineToast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (offlineToast) {
                        offlineToast.remove();
                        offlineToast = null;
                    }
                }, 300);
            }
        }, duration);
    }
}

/**
 * Handle network status changes
 */
function handleNetworkStatusChange(networkStatus) {
    console.log('📱 UI handling network status change:', networkStatus);
    
    updateNetworkStatusIndicator(networkStatus);
    
    if (networkStatus.isOnline) {
        showOfflineToast('📶 Back online - syncing data...', 'success', 3000);
        
        // Update queue indicator since sync might process queued items
        setTimeout(updateOfflineQueueIndicator, 2000);
    } else {
        showOfflineToast('📴 You\'re offline - changes will be queued', 'warning', 5000);
    }
}

/**
 * Handle offline status changes from offline sync
 */
function handleOfflineStatusChange(offlineStatus) {
    console.log('📤 UI handling offline status change:', offlineStatus);
    updateOfflineQueueIndicator();
}

/**
 * Initialize offline UI indicators
 */
function initializeOfflineUI() {
    console.log('🚀 Initializing offline UI indicators...');
    
    // Create indicators
    createNetworkStatusIndicator();
    createOfflineQueueIndicator();
    
    // Initial updates
    setTimeout(() => {
        if (window.networkStatus) {
            updateNetworkStatusIndicator(window.networkStatus.getStatus());
        }
        updateOfflineQueueIndicator();
    }, 100);
    
    // Listen for network status changes
    if (window.networkStatus && window.networkStatus.addListener) {
        window.networkStatus.addListener(handleNetworkStatusChange);
    }
    
    // Listen for offline status changes  
    window.addEventListener('offlineStatusUpdate', (event) => {
        handleOfflineStatusChange(event.detail);
    });
    
    // Periodic updates
    setInterval(() => {
        if (window.networkStatus) {
            updateNetworkStatusIndicator(window.networkStatus.getStatus());
        }
        updateOfflineQueueIndicator();
    }, STATUS_UPDATE_INTERVAL);
    
    console.log('✅ Offline UI indicators initialized');
}

/**
 * Show connection problem indicator
 */
function showConnectionProblem(message) {
    showOfflineToast(`🔌 ${message}`, 'warning', 6000);
}

/**
 * Show sync success indicator
 */
function showSyncSuccess(message) {
    showOfflineToast(`✅ ${message}`, 'success', 3000);
}

/**
 * Show sync error indicator
 */
function showSyncError(message) {
    showOfflineToast(`❌ ${message}`, 'error', 8000);
}

// ========== MOBILE RESPONSIVE ADJUSTMENTS ==========

/**
 * Adjust indicators for mobile screens
 */
function adjustForMobile() {
    if (window.innerWidth <= 768) {
        // Move indicators to avoid conflicts with mobile UI
        if (statusIndicator) {
            statusIndicator.style.top = '50px';
            statusIndicator.style.right = '12px';
        }
        if (queueIndicator) {
            queueIndicator.style.top = '50px';
            queueIndicator.style.right = '120px';
        }
    } else {
        // Desktop positioning
        if (statusIndicator) {
            statusIndicator.style.top = '12px';
            statusIndicator.style.right = '72px';
        }
        if (queueIndicator) {
            queueIndicator.style.top = '12px';
            queueIndicator.style.right = '200px';
        }
    }
}

// Listen for window resize
window.addEventListener('resize', adjustForMobile);

// ========== EXPORTS FOR GLOBAL ACCESS ==========

// Make functions globally available
window.offlineUI = {
    // Toast notifications
    showToast: showOfflineToast,
    showConnectionProblem: showConnectionProblem,
    showSyncSuccess: showSyncSuccess,
    showSyncError: showSyncError,
    
    // Queue details
    showQueueDetails: showOfflineQueueDetails,
    
    // Manual updates
    updateNetworkIndicator: updateNetworkStatusIndicator,
    updateQueueIndicator: updateOfflineQueueIndicator,
    
    // Initialization
    initialize: initializeOfflineUI
};

console.log('✅ Offline UI Indicators ready');