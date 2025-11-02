// Network Status Module
// Monitors online/offline status and provides UI feedback

// Configuration
export const NETWORK_CHECK_INTERVAL = 30000; // 30 seconds
export const CONNECTION_TIMEOUT = 5000; // 5 seconds
export const PING_ENDPOINT = '/manifest.json'; // Light endpoint for testing connection

// Network status tracking (module-private)
let isOnline = navigator.onLine;
let connectionQuality = 'unknown';
let lastConnectionCheck = Date.now();

// Event listeners for network status updates
const networkStatusListeners = [];

/**
 * Add a listener for network status changes
 * @param {Function} callback - Callback function to notify on status change
 */
export function addNetworkStatusListener(callback) {
    networkStatusListeners.push(callback);
}

/**
 * Remove a network status listener
 * @param {Function} callback - Callback function to remove
 */
export function removeNetworkStatusListener(callback) {
    const index = networkStatusListeners.indexOf(callback);
    if (index > -1) {
        networkStatusListeners.splice(index, 1);
    }
}

/**
 * Notify all listeners of network status change
 * @param {Object} status - Network status object
 */
export function notifyNetworkStatusChange(status) {
    console.log('📡 Network status changed:', status);

    networkStatusListeners.forEach(listener => {
        try {
            listener(status);
        } catch (error) {
            console.error('❌ Network status listener error:', error);
        }
    });

    // Also dispatch custom event
    window.dispatchEvent(new CustomEvent('networkStatusChange', {
        detail: status
    }));
}

/**
 * Get current network status
 * @returns {Object} Network status object
 */
export function getNetworkStatus() {
    return {
        isOnline: isOnline,
        quality: connectionQuality,
        lastCheck: lastConnectionCheck,
        timestamp: Date.now()
    };
}

/**
 * Test actual network connectivity beyond browser's navigator.onLine
 * @returns {Promise<boolean>} True if connected
 */
export async function testNetworkConnectivity() {
    try {
        const startTime = Date.now();

        // Use fetch with cache-busting timestamp
        const response = await fetch(`${PING_ENDPOINT}?t=${Date.now()}`, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(CONNECTION_TIMEOUT)
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
            // Determine connection quality based on response time
            if (responseTime < 1000) {
                connectionQuality = 'excellent';
            } else if (responseTime < 2000) {
                connectionQuality = 'good';
            } else if (responseTime < 4000) {
                connectionQuality = 'fair';
            } else {
                connectionQuality = 'poor';
            }

            console.log(`🌐 Network connectivity test: OK (${responseTime}ms - ${connectionQuality})`);
            return true;
        } else {
            console.log('🌐 Network connectivity test: Failed (HTTP error)');
            connectionQuality = 'poor';
            return false;
        }

    } catch (error) {
        console.log('🌐 Network connectivity test: Failed (Network error)');
        connectionQuality = 'offline';
        return false;
    }
}

/**
 * Update network status and notify listeners
 * @returns {Promise<boolean>} True if online
 */
export async function updateNetworkStatus() {
    const previousStatus = isOnline;
    const browserOnline = navigator.onLine;

    if (browserOnline) {
        // Browser says online, but let's verify with actual connectivity test
        const actuallyOnline = await testNetworkConnectivity();
        isOnline = actuallyOnline;
    } else {
        // Browser says offline
        isOnline = false;
        connectionQuality = 'offline';
    }

    lastConnectionCheck = Date.now();

    // Only notify if status changed
    if (isOnline !== previousStatus) {
        const status = getNetworkStatus();
        notifyNetworkStatusChange(status);

        // Store status in localStorage for other components
        localStorage.setItem('network_status', JSON.stringify(status));
    }

    return isOnline;
}

/**
 * Handle browser online event
 */
export function handleOnlineEvent() {
    console.log('🌐 Browser reports: ONLINE');
    // Verify with actual connectivity test
    setTimeout(updateNetworkStatus, 100);
}

/**
 * Handle browser offline event
 */
export function handleOfflineEvent() {
    console.log('📴 Browser reports: OFFLINE');
    isOnline = false;
    connectionQuality = 'offline';
    lastConnectionCheck = Date.now();

    const status = getNetworkStatus();
    notifyNetworkStatusChange(status);
    localStorage.setItem('network_status', JSON.stringify(status));
}

/**
 * Initialize network status monitoring
 * @returns {boolean} True if initialized successfully
 */
export function initializeNetworkStatus() {
    console.log('🚀 Initializing network status detection...');

    // Set initial status
    isOnline = navigator.onLine;
    lastConnectionCheck = Date.now();

    // Test initial connectivity
    updateNetworkStatus();

    // Listen for browser events
    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    // Periodic connectivity checks (when browser thinks we're online)
    setInterval(() => {
        if (navigator.onLine && isOnline) {
            updateNetworkStatus();
        }
    }, NETWORK_CHECK_INTERVAL);

    // Listen for visibility change to check connection when app becomes active
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) {
            // App became visible and browser thinks we're online - verify
            setTimeout(updateNetworkStatus, 500);
        }
    });

    console.log('✅ Network status detection initialized');
    return true;
}

/**
 * Get network status indicator for UI
 * @returns {Object} Indicator object with icon, text, color, status
 */
export function getNetworkIndicator() {
    if (!isOnline) {
        return {
            icon: '',
            text: '',
            color: '#dc2626', // Red
            status: 'offline'
        };
    }

    switch (connectionQuality) {
        case 'excellent':
            return {
                icon: '',
                text: '',
                color: '#059669', // Green
                status: 'online'
            };
        case 'good':
            return {
                icon: '',
                text: '',
                color: '#059669', // Green
                status: 'online'
            };
        case 'fair':
            return {
                icon: '',
                text: '',
                color: '#d97706', // Amber
                status: 'online'
            };
        case 'poor':
            return {
                icon: '',
                text: '',
                color: '#dc2626', // Red
                status: 'online-poor'
            };
        default:
            return {
                icon: '',
                text: '',
                color: '#6b7280', // Gray
                status: 'checking'
            };
    }
}

/**
 * Check if we should show offline indicators
 * @returns {boolean} True if offline indicators should be shown
 */
export function shouldShowOfflineIndicators() {
    return !isOnline || connectionQuality === 'poor';
}

/**
 * Manual network status refresh (for user-triggered checks)
 * @returns {Promise<boolean>} True if online after refresh
 */
export async function refreshNetworkStatus() {
    console.log('🔄 Manual network status refresh requested');
    return await updateNetworkStatus();
}

/**
 * Check if currently online
 * @returns {boolean} True if online
 */
export function isCurrentlyOnline() {
    return isOnline;
}

/**
 * Get current connection quality
 * @returns {string} Connection quality (excellent, good, fair, poor, offline, unknown)
 */
export function getConnectionQuality() {
    return connectionQuality;
}

console.log('✅ network-status module loaded');
