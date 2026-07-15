/**
 * Authentication Module for HyperFiler Pro
 * Handles user authentication, authorization, and session management
 */

// API Configuration - API_BASE is already defined in utils.js

// Authentication state tracking
let lastAuthenticationState = null;
window.accessDeniedShown = false;
let redirectTimeout = null;

/**
 * Security Functions - XSS Prevention
 */


/**
 * Safely set innerHTML with HTML escaping
 * @param {Element} element - Element to set content
 * @param {string} html - HTML template with placeholders
 * @param {Object} data - Data to substitute, will be escaped
 */
function safeSetInnerHTML(element, html, data = {}) {
    // Escape all data values
    const escapedData = {};
    for (const [key, value] of Object.entries(data)) {
        escapedData[key] = escapeHtml(String(value));
    }
    
    // Replace placeholders in template
    let result = html;
    for (const [key, value] of Object.entries(escapedData)) {
        const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
        result = result.replace(placeholder, value);
    }
    
    element.innerHTML = result;
}

/**
 * Clear all authentication data from storage
 */
function clearAuthData() {
    // Clear BOTH localStorage and sessionStorage to be thorough
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpiry');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');

    // Clear persisted user data
    localStorage.removeItem('currentUser');

    // Clear any legacy sync data
    localStorage.removeItem('tasks_with_tombstones');
    
    // Reset access denied flag so login form can show again
    window.accessDeniedShown = false;
    
    console.log('🧹 Cleared authentication data from both localStorage and sessionStorage');
}

/**
 * Clear this browser's cached TASK/LIST/TEMPLATE data (localStorage + IndexedDB).
 *
 * Task data is stored under GLOBAL keys (not namespaced per user), so switching
 * accounts on the same browser would otherwise show the previous user's tasks.
 * This is called on explicit logout and on account-switch at login — NOT from
 * clearAuthData(), which also fires on transient token expiry where we must keep
 * local (possibly unsynced) data.
 */
window.clearLocalUserData = function() {
    var keys = [
        'gtdTasks', 'gtd_list_sections', 'gtdTemplates', 'gtd_event_registry',
        'ls_tasks', 'ls_lists', 'ls_templates',
        'ls_synced_tasks', 'ls_synced_lists', 'ls_synced_templates',
        '__localstore_meta__', 'tasks_with_tombstones', 'lastSyncTime'
    ];
    keys.forEach(function(k) {
        try { localStorage.removeItem(k); } catch (e) {}
        try { sessionStorage.removeItem(k); } catch (e) {}
    });
    try { if (window.indexedDB) indexedDB.deleteDatabase('hyperfiler_sync'); } catch (e) {}
    console.log('🧹 Cleared local task/list/template cache (localStorage + IndexedDB)');
};

/**
 * Force logout and reload (for troubleshooting)
 */
window.forceLogout = function() {
    clearAuthData();
    if (window.clearLocalUserData) window.clearLocalUserData();
    window.currentUser = null;
    window.location.reload();
};

/**
 * Get authentication headers for API requests
 */
function getAuthHeaders() {
    // ALWAYS check localStorage first (for persistent login)
    let authToken = null;
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('authTokenExpiry');
    
    if (token && expiry && Date.now() < parseInt(expiry)) {
        authToken = token;
        console.log('💾 Using persistent token from localStorage');
    } else if (token && expiry) {
        // Token expired, clear it
        console.log('⏰ Persistent token expired, clearing...');
        clearAuthData();
    } else {
        // Fallback to sessionStorage
        authToken = sessionStorage.getItem('authToken');
        if (authToken) {
            console.log('📂 Fallback: Using token from sessionStorage');
        }
    }
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
}

/**
 * Helper function for authenticated fetch requests with proper CORS credentials
 */
function authenticatedFetch(url, options = {}) {
    const defaultOptions = {
        credentials: 'include', // Always include cookies for cross-domain auth
        mode: 'cors',
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}

/**
 * Check authentication status and validate user session
 */
async function checkAuthentication() {
    try {
        console.log('🔍 Checking authentication status...');
        
        // Special handling for mobile Safari
        if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
            let authToken = null;
            const token = localStorage.getItem('authToken');
            const expiry = localStorage.getItem('authTokenExpiry');
            
            if (token && expiry && Date.now() < parseInt(expiry)) {
                authToken = token;
                console.log('🔍 Mobile auth check: Using persistent token from localStorage');
            } else if (token && expiry) {
                // Token expired, clear it
                console.log('⏰ Mobile auth check: Persistent token expired, clearing...');
                clearAuthData();
                authToken = null;
            } else {
                // Fallback to sessionStorage
                authToken = sessionStorage.getItem('authToken');
                if (authToken) {
                    console.log('📂 Mobile auth check: Using fallback token from sessionStorage');
                }
            }
            
            if (authToken) {
                // Actually validate the token with retry logic (same as non-Safari path)
                let mobileResponse;
                let mobileLastError;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        mobileResponse = await authenticatedFetch(`${API_BASE}/auth/me`, {
                            method: 'GET'
                        });
                        if (mobileResponse.ok) break;
                        mobileLastError = `HTTP ${mobileResponse.status}`;
                        if (mobileResponse.status === 401 || mobileResponse.status === 403) break;
                        if (attempt < 3) {
                            console.warn(`⚠️ Mobile auth check failed (attempt ${attempt}), retrying...`);
                            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                        }
                    } catch (error) {
                        mobileLastError = error.message;
                        if (attempt < 3) {
                            console.warn(`⚠️ Mobile network error (attempt ${attempt}), retrying...`);
                            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                        }
                    }
                }

                if (mobileResponse && mobileResponse.ok) {
                    const userInfo = await mobileResponse.json();
                    window.currentUser = userInfo;
                    try {
                        localStorage.setItem('currentUser', JSON.stringify(userInfo));
                    } catch (e) {
                        console.warn('⚠️ Failed to persist currentUser to localStorage:', e);
                    }
                    return true;
                } else {
                    console.error('❌ Mobile Safari auth failed after retries:', mobileLastError);
                    clearAuthData();
                    lastAuthenticationState = false;
                    showAccessDenied('login');
                    return false;
                }
            } else {
                lastAuthenticationState = false;
                showAccessDenied('login');
                return false;
            }
        }
        
        // SECURITY: Try httpOnly cookie first, fallback to localStorage for cross-domain
        // Add retry logic to prevent bouncing on temporary network issues
        let response;
        let lastError;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await authenticatedFetch(`${API_BASE}/auth/me`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    break; // Success, exit retry loop
                }
                
                lastError = `HTTP ${response.status}: ${response.statusText}`;
                
                // If it's a clear authentication error (401/403), don't retry but don't clear tokens yet
                if (response.status === 401 || response.status === 403) {
                    console.error(`❌ Authentication failed (attempt ${attempt}):`, lastError);
                    break;
                }
                
                // For other errors (500, network issues), retry with delay
                if (attempt < 3) {
                    console.warn(`⚠️ Auth check failed (attempt ${attempt}), retrying in ${attempt}s:`, lastError);
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
            } catch (networkError) {
                lastError = `Network error: ${networkError.message}`;
                
                if (attempt < 3) {
                    console.warn(`⚠️ Network error (attempt ${attempt}), retrying in ${attempt}s:`, lastError);
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                } else {
                    console.error('❌ All retry attempts failed:', lastError);
                }
            }
        }
        
        if (!response || !response.ok) {
            console.error('❌ Authentication failed after retries:', lastError);
            
            // Check if we have stored credentials that might be expired
            const storedToken = localStorage.getItem('authToken');
            const storedUserId = localStorage.getItem('userId');
            const storedEmail = localStorage.getItem('userEmail');
            
            if (storedToken && storedUserId && storedEmail) {
                console.log('❌ Found stored credentials but /auth/me failed - tokens are likely expired');
                console.log('🔍 Clearing expired credentials and redirecting to login');
                clearAuthData();
            }
            
            // If no valid session, clear auth data and show login form
            clearAuthData();
            showAccessDenied('login');
            return false;
        }
        
        const userInfo = await response.json();
        
        // Check subscription status - RE-ENABLED FOR SECURITY
        if (!userInfo.subscription) {
            console.error('🚫 AUTH: No subscription data found');
            showAccessDenied('subscription');
            return false;
        }
        
        const planName = userInfo.subscription.plan_name;
        const subscriptionStatus = userInfo.subscription.status;
        
        // Block free users and invalid plans
        if (planName === 'free' || !planName) {
            console.error('🚫 AUTH: Free or invalid plan detected:', planName);
            showAccessDenied('subscription');
            return false;
        }
        
        // Block inactive subscriptions
        if (subscriptionStatus !== 'active') {
            console.error('🚫 AUTH: Inactive subscription status:', subscriptionStatus);
            showAccessDenied('subscription');
            return false;
        }
        
        // Subscription expiration check - RE-ENABLED FOR SECURITY
        if (userInfo.subscription.current_period_end) {
            const expiryDate = new Date(userInfo.subscription.current_period_end);
            const now = new Date();
            if (expiryDate < now) {
                console.error('🚫 AUTH: Subscription expired:', expiryDate.toISOString());
                showAccessDenied('expired');
                return false;
            }
            
            // Log remaining time for valid subscriptions
            const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            console.log(`✅ AUTH: Valid subscription - Plan: ${planName}, Days left: ${daysLeft}`);
        } else {
            // No expiration date - assume lifetime (pro users with one-time payment)
            console.log(`✅ AUTH: Valid subscription - Plan: ${planName}, Type: Lifetime`);
        }
        
        // Store user info for app use
        window.currentUser = userInfo;
        try {
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
        } catch (e) {
            console.warn('⚠️ Failed to persist currentUser to localStorage:', e);
        }
        
        // Stale browser detection disabled — it relied on performStaleRefresh() in
        // extracted_js.js which has a SyntaxError and never runs. The download-then-upload
        // flow in initializeSimpleSync makes this redundant (download always happens first).
        window.staleBrowserDetected = false;
        window.skipInitialUpload = false;
        
        // Update authentication state
        lastAuthenticationState = true;
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        lastAuthenticationState = false;
        showAccessDenied('error');
        return false;
    }
}

/**
 * Show access denied screen
 */
function showAccessDenied(reason) {
    // Prevent showing multiple access denied screens
    if (window.accessDeniedShown) {
        console.log('🚫 Access denied screen already shown, skipping');
        return;
    }
    
    // Clear any existing redirect timeout
    if (redirectTimeout) {
        clearTimeout(redirectTimeout);
    }
    
    window.accessDeniedShown = true;
    
    const messages = {
        login: {
            title: '🔐 Login Required',
            message: 'Please log in to access HyperFiler Pro.',
            action: 'Login',
            url: '/login'
        },
        invalid: {
            title: '❌ Session Expired',
            message: 'Your session has expired. Please log in again.',
            action: 'Login',
            url: '/login'
        },
        subscription: {
            title: '💳 Subscription Required',
            message: 'HyperFiler Pro requires an active subscription.',
            action: 'Get Started',
            url: '/upgrade-compare.html'
        },
        expired: {
            title: '⏰ Subscription Expired',
            message: 'Your subscription has expired. Please renew to continue.',
            action: 'Renew Now',
            url: '/upgrade-compare.html'
        },
        error: {
            title: '⚠️ Connection Error',
            message: 'Unable to verify your authentication. Please check your connection and try again.',
            action: 'Try Again',
            url: window.location.href
        }
    };
    
    const config = messages[reason] || messages.login;
    
    // SECURITY FIX: Use safe HTML template to prevent XSS
    const template = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">\${titleEmoji}</div>
                <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-weight: 600;">\${titleText}</h2>
                <p style="color: #7f8c8d; margin-bottom: 30px; line-height: 1.5;">\${message}</p>
                <a href="\${url}" style="
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 32px;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">\${action}</a>
            </div>
        </div>
    `;
    
    // SECURITY: Safely set innerHTML with escaped data
    safeSetInnerHTML(document.body, template, {
        titleEmoji: config.title.split(' ')[0],
        titleText: config.title.substring(2),
        message: config.message,
        url: config.url,
        action: config.action
    });
    
    // Auto-redirect after 5 seconds for error cases
    if (reason === 'error') {
        redirectTimeout = setTimeout(() => {
            window.location.reload();
        }, 5000);
    }
}

/**
 * Get user status icon based on subscription
 */
function getUserStatusIcon(userInfo) {
    if (userInfo.trialStatus && userInfo.trialStatus.hasPaid) {
        return '<span title="Pro User">💎</span>';
    }
    return '<span title="Free Trial">🆓</span>';
}

/**
 * Logout function
 */
async function logout() {
    try {
        // Call backend logout endpoint to clear httpOnly cookie
        await authenticatedFetch(`${API_BASE}/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clean up sync timers and event listeners before clearing auth
    if (typeof cleanupSyncEventListeners === 'function') {
        cleanupSyncEventListeners();
    }
    clearTimeout(window._staleBrowserFailsafeTimer);
    clearTimeout(window._backupRestoreFailsafeTimer);

    // SECURITY: Clear all authentication data
    clearAuthData();
    // Clear cached tasks/lists/templates so the next account starts clean
    // (task data uses global keys, not namespaced per user).
    if (window.clearLocalUserData) window.clearLocalUserData();
    window.location.href = '/login';
}
window.logout = logout;

/**
 * Fill the logged-in email into any account UI elements. Safe to call anytime.
 */
window.updateUserBadge = function() {
    var email = '';
    try {
        email = localStorage.getItem('userEmail') || '';
        if (!email) {
            var cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
            email = (cu && cu.user && cu.user.email) || '';
        }
    } catch (e) {}
    if (!email) return;

    var span = document.getElementById('userEmail');
    if (span) span.textContent = email;

    var sidebar = document.getElementById('sidebarUserInfo');
    if (sidebar) {
        sidebar.textContent = '👤 ' + email;
        sidebar.style.display = 'block';
    }

    var badgeEmail = document.getElementById('accountBadgeEmail');
    if (badgeEmail) badgeEmail.textContent = email;
    var badge = document.getElementById('accountBadge');
    if (badge) badge.style.display = 'flex';
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        try { window.updateUserBadge(); } catch (e) {}
    });
}

/**
 * Show trial reminder for non-paid users
 */
function showTrialReminder(userInfo) {
    if (!userInfo.trialStatus) return;
    
    const { trialStatus } = userInfo;
    
    // Don't show reminder if user has paid
    if (trialStatus.hasPaid) return;
    
    // Show soft reminders for all users (Reaper-style)
    const now = Date.now();
    
    // Show popup every 30 days
    const lastPopupShown = localStorage.getItem('trial_popup_shown');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    if (!lastPopupShown || (now - parseInt(lastPopupShown)) >= thirtyDaysInMs) {
        showTrialPopup();
        localStorage.setItem('trial_popup_shown', now.toString());
    }
    
    // Show subtle reminder if last shown more than 7 days ago
    const lastSubtleShown = localStorage.getItem('trial_subtle_shown');
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (!lastSubtleShown || (now - parseInt(lastSubtleShown)) >= sevenDaysInMs) {
        setTimeout(showSubtleReminder, 5000); // Show after 5 seconds
        localStorage.setItem('trial_subtle_shown', now.toString());
    }
}

/**
 * Show subtle trial reminder
 */
function showSubtleReminder() {
    const installTime = localStorage.getItem('appInstallTime') || Date.now();
    const daysSinceInstall = Math.floor((Date.now() - parseInt(installTime)) / (1000 * 60 * 60 * 24));
    const usageText = daysSinceInstall > 0 ? `${daysSinceInstall} days` : 'today';
    
    const reminder = document.createElement('div');
    const reminderTemplate = `
        <div style="margin-bottom: 10px;">
            <div style="font-size: 16px; margin-bottom: 5px;">💎 Support HyperFiler Pro</div>
            <div style="font-size: 12px; opacity: 0.8;">You've been using the app for \${usageText}</div>
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="upgradeToPro()" style="
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                flex: 1;
            ">Buy Now</button>
            <button onclick="closeSubtleReminder()" style="
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
            ">Close</button>
        </div>
    `;
    
    // SECURITY: Use safe innerHTML with escaped data
    safeSetInnerHTML(reminder, reminderTemplate, {
        usageText: usageText
    });
    
    reminder.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 280px;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
    `;
    
    document.body.appendChild(reminder);
    
    // Animate in
    setTimeout(() => {
        reminder.style.opacity = '1';
        reminder.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (reminder.parentElement) {
            reminder.style.opacity = '0';
            reminder.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (reminder.parentElement) {
                    reminder.remove();
                }
            }, 300);
        }
    }, 15000);
}

/**
 * Close subtle reminder
 */
function closeSubtleReminder() {
    const reminder = document.querySelector('[style*="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"]');
    if (reminder && reminder.parentElement) {
        reminder.style.opacity = '0';
        reminder.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (reminder.parentElement) {
                reminder.remove();
            }
        }, 300);
    }
}

/**
 * Show trial popup
 */
function showTrialPopup() {
    const installTime = localStorage.getItem('appInstallTime') || Date.now();
    const daysSinceInstall = Math.floor((Date.now() - parseInt(installTime)) / (1000 * 60 * 60 * 24));
    const usageText = daysSinceInstall > 0 ? `${daysSinceInstall} days` : 'today';
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 420px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        ">
            <div style="font-size: 48px; margin-bottom: 16px;">💎</div>
            <h2 style="color: #2c3e50; margin: 0 0 12px 0; font-weight: 700;">Support HyperFiler Pro</h2>
            <p style="color: #7f8c8d; margin-bottom: 20px; font-size: 15px;">
                You've been using the app for <strong>${usageText}</strong>. Consider supporting development!
            </p>
            
            <div style="text-align: left; margin: 20px 0; background: #f8f9fa; padding: 16px; border-radius: 8px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #495057;">Why upgrade?</div>
                <ul style="margin: 0; padding-left: 18px; color: #6c757d; font-size: 14px;">
                    <li>Remove these gentle reminders</li>
                    <li>Support continued development</li>
                    <li>Help keep the app free for others</li>
                    <li>Support development</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 25px;">
                <button onclick="upgradeToPro()" style="
                    flex: 1;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.95em;
                    transition: transform 0.2s ease;
                ">💎 Buy Now</button>
                <button id="close-popup-btn" onclick="closeTrialPopup()" style="
                    flex: 1;
                    background: #e9ecef;
                    color: #495057;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: not-allowed;
                    font-size: 0.95em;
                    transition: transform 0.2s ease;
                    opacity: 0.5;
                ">Continue Free (5s)</button>
            </div>
            
            <p style="margin-top: 15px; color: #6c757d; font-size: 0.85em; opacity: 0.8;">
                You can continue using HyperFiler Pro free forever.
            </p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Enable close button after 5 seconds
    let countdown = 5;
    const closeBtn = overlay.querySelector('#close-popup-btn');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            closeBtn.textContent = `Continue Free (${countdown}s)`;
        } else {
            closeBtn.textContent = 'Continue Free';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.opacity = '1';
            closeBtn.disabled = false;
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Close on overlay click after countdown
    setTimeout(() => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeTrialPopup();
            }
        });
    }, 5000);
}

/**
 * Close trial popup
 */
function closeTrialPopup() {
    const overlay = document.querySelector('[style*="rgba(0, 0, 0, 0.8)"]');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Upgrade to Pro function
 */
async function upgradeToPro() {
    try {
        const response = await authenticatedFetch(`${API_BASE}/payments/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mode: 'payment' })
        });
        
        const data = await response.json();
        
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert('Error creating checkout session. Please try again.');
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        alert('Error processing upgrade. Please try again.');
    }
}

// Export functions for use in other modules
window.getAuthHeaders = getAuthHeaders;