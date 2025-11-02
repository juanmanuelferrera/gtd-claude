// Authentication Module
// Handles user authentication, authorization, session management, and subscription checks

// Module-private state
let lastAuthenticationState = null;
let redirectTimeout = null;

/**
 * Safely set innerHTML with HTML escaping
 * @param {Element} element - Element to set content
 * @param {string} html - HTML template with placeholders
 * @param {Object} data - Data to substitute, will be escaped
 */
export function safeSetInnerHTML(element, html, data = {}) {
    // Escape all data values using global escapeHtml if available
    const escapedData = {};
    const escaper = window.escapeHtml || ((text) => {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    });

    for (const [key, value] of Object.entries(data)) {
        escapedData[key] = escaper(String(value));
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
export function clearAuthData() {
    // Clear BOTH localStorage and sessionStorage to be thorough
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpiry');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');

    // Clear any legacy sync data
    localStorage.removeItem('tasks_with_tombstones');

    // Reset access denied flag so login form can show again
    if (window.accessDeniedShown !== undefined) {
        window.accessDeniedShown = false;
    }

    console.log('🧹 Cleared authentication data from both localStorage and sessionStorage');
}

/**
 * Force logout and reload (for troubleshooting)
 */
export function forceLogout() {
    clearAuthData();
    window.currentUser = null;
    window.location.reload();
}

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Authorization if token available
 */
export function getAuthHeaders() {
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
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export function authenticatedFetch(url, options = {}) {
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
 * @returns {Promise<boolean>} True if authenticated
 */
export async function checkAuthentication() {
    try {
        console.log('🔍 Checking authentication status...');

        // Get API_BASE from window
        const API_BASE = window.API_BASE || '';

        // Special handling for mobile Safari
        if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
            let authToken = null;
            const token = localStorage.getItem('authToken');
            const expiry = localStorage.getItem('authTokenExpiry');

            if (token && expiry && Date.now() < parseInt(expiry)) {
                authToken = token;
                console.log('🔍 Mobile auth check: Using persistent token from localStorage');
            } else if (token && expiry) {
                console.log('⏰ Mobile auth check: Persistent token expired, clearing...');
                clearAuthData();
                authToken = null;
            } else {
                authToken = sessionStorage.getItem('authToken');
                if (authToken) {
                    console.log('📂 Mobile auth check: Using fallback token from sessionStorage');
                }
            }

            if (authToken) {
                try {
                    const response = await authenticatedFetch(`${API_BASE}/auth/me`, {
                        method: 'GET'
                    });

                    if (response.ok) {
                        const userInfo = await response.json();
                        window.currentUser = userInfo;
                        return true;
                    } else {
                        clearAuthData();
                        lastAuthenticationState = false;
                        showAccessDenied('login');
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Mobile Safari auth validation failed:', error);
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
        let response;
        let lastError;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await authenticatedFetch(`${API_BASE}/auth/me`, {
                    method: 'GET'
                });

                if (response.ok) {
                    break;
                }

                lastError = `HTTP ${response.status}: ${response.statusText}`;

                if (response.status === 401 || response.status === 403) {
                    console.error(`❌ Authentication failed (attempt ${attempt}):`, lastError);
                    break;
                }

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

            const storedToken = localStorage.getItem('authToken');
            const storedUserId = localStorage.getItem('userId');
            const storedEmail = localStorage.getItem('userEmail');

            if (storedToken && storedUserId && storedEmail) {
                console.log('❌ Found stored credentials but /auth/me failed - tokens are likely expired');
                console.log('🔍 Clearing expired credentials and redirecting to login');
                clearAuthData();
            }

            clearAuthData();
            showAccessDenied('login');
            return false;
        }

        const userInfo = await response.json();

        // Check subscription status
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

        // Subscription expiration check
        if (userInfo.subscription.current_period_end) {
            const expiryDate = new Date(userInfo.subscription.current_period_end);
            const now = new Date();
            if (expiryDate < now) {
                console.error('🚫 AUTH: Subscription expired:', expiryDate.toISOString());
                showAccessDenied('expired');
                return false;
            }

            const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            console.log(`✅ AUTH: Valid subscription - Plan: ${planName}, Days left: ${daysLeft}`);
        } else {
            console.log(`✅ AUTH: Valid subscription - Plan: ${planName}, Type: Lifetime`);
        }

        // Store user info
        window.currentUser = userInfo;

        // CRITICAL: Check for stale browser data
        const lastSyncTime = localStorage.getItem('lastSyncTime');
        const currentTime = Date.now();
        const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);

        if (!lastSyncTime || parseInt(lastSyncTime) < oneDayAgo) {
            console.warn('🚨 STALE BROWSER DETECTED: Last sync was more than 24 hours ago or never');
            console.warn('📥 Forcing download from cloud to prevent overwriting fresh data');

            window.staleBrowserDetected = true;
            window.skipInitialUpload = true;
            window.justModifiedTasks = true;
            window.justModifiedLists = true;
            window.justModifiedTemplates = true;

            setTimeout(async () => {
                try {
                    if (window.backupRestoreInProgress || window.justRestoredBackup) {
                        console.log('🔒 STALE BROWSER: Download cancelled - backup restore in progress');
                        return;
                    }

                    console.log('📥 STALE BROWSER: Starting forced download...');
                    window.forceMandatoryRefresh = true;

                    if (typeof window.performStaleBrowserRecovery === 'function') {
                        await window.performStaleBrowserRecovery();
                    } else {
                        if (typeof window.downloadAllTasks === 'function') await window.downloadAllTasks();
                        if (typeof window.downloadAllLists === 'function') await window.downloadAllLists();
                        if (typeof window.downloadAllTemplates === 'function') await window.downloadAllTemplates();
                    }

                    window.forceMandatoryRefresh = false;
                    window.staleBrowserDetected = false;
                    localStorage.setItem('lastSyncTime', currentTime.toString());
                    console.log('✅ STALE BROWSER: Forced download completed');
                } catch (error) {
                    console.error('❌ STALE BROWSER: Forced download failed:', error);
                }
            }, 1000);
        }

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
 * @param {string} reason - Reason for access denial (login, invalid, subscription, expired, error)
 */
export function showAccessDenied(reason) {
    // Prevent showing multiple access denied screens
    if (window.accessDeniedShown) {
        console.log('🚫 Access denied screen already shown, skipping');
        return;
    }

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

    safeSetInnerHTML(document.body, template, {
        titleEmoji: config.title.split(' ')[0],
        titleText: config.title.substring(2),
        message: config.message,
        url: config.url,
        action: config.action
    });

    if (reason === 'error') {
        redirectTimeout = setTimeout(() => {
            window.location.reload();
        }, 5000);
    }
}

/**
 * Get user status icon based on subscription
 * @param {Object} userInfo - User information object
 * @returns {string} HTML for status icon
 */
export function getUserStatusIcon(userInfo) {
    if (userInfo.trialStatus && userInfo.trialStatus.hasPaid) {
        return '<span title="Pro User">💎</span>';
    }
    return '<span title="Free Trial">🆓</span>';
}

/**
 * Display user information in the interface
 * @param {Object} userInfo - User information object
 */
export function showUserInfo(userInfo) {
    if (!userInfo || !userInfo.user) return;

    const headerUserInfo = document.getElementById('headerUserInfo');
    if (headerUserInfo) {
        const headerTemplate = `
            <div style="
                font-size: 11px;
                text-align: right;
                line-height: 1.2;
                font-weight: normal;
                color: #666;
                margin-top: 5px;
            ">
                Welcome, \${email} <a href="/upgrade-compare.html" style="color: #28a745; text-decoration: none; margin-left: 8px;" title="Upgrade to Pro">🐷</a> \${statusIcon} |
                <a href="#" onclick="logout()" style="color: #dc3545; text-decoration: none;">Logout</a>
            </div>
        `;

        safeSetInnerHTML(headerUserInfo, headerTemplate, {
            email: userInfo.user.email,
            statusIcon: getUserStatusIcon(userInfo)
        });

        const sidebarUserInfo = document.getElementById('sidebarUserInfo');
        if (sidebarUserInfo) {
            const sidebarTemplate = `Welcome, \${email} \${statusIcon} | <a href="#" onclick="logout()" style="color: var(--things-danger);">Logout</a>`;
            safeSetInnerHTML(sidebarUserInfo, sidebarTemplate, {
                email: userInfo.user.email,
                statusIcon: getUserStatusIcon(userInfo)
            });
            sidebarUserInfo.style.display = 'block';
        }
    }

    if (userInfo.trialStatus && !userInfo.trialStatus.hasPaid) {
        showTrialReminder(userInfo);
    }
}

/**
 * Logout function
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        const API_BASE = window.API_BASE || '';
        await authenticatedFetch(`${API_BASE}/auth/logout`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    clearAuthData();
    window.location.href = '/login';
}

/**
 * Show trial reminder for non-paid users
 * @param {Object} userInfo - User information object
 */
export function showTrialReminder(userInfo) {
    if (!userInfo.trialStatus) return;

    const { trialStatus } = userInfo;

    if (trialStatus.hasPaid) return;

    const now = Date.now();

    const lastPopupShown = localStorage.getItem('trial_popup_shown');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    if (!lastPopupShown || (now - parseInt(lastPopupShown)) >= thirtyDaysInMs) {
        showTrialPopup();
        localStorage.setItem('trial_popup_shown', now.toString());
    }

    const lastSubtleShown = localStorage.getItem('trial_subtle_shown');
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (!lastSubtleShown || (now - parseInt(lastSubtleShown)) >= sevenDaysInMs) {
        setTimeout(showSubtleReminder, 5000);
        localStorage.setItem('trial_subtle_shown', now.toString());
    }
}

/**
 * Show subtle trial reminder
 */
export function showSubtleReminder() {
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
            <button onclick="window.upgradeToPro && window.upgradeToPro()" style="
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
            <button onclick="window.closeSubtleReminder && window.closeSubtleReminder()" style="
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

    setTimeout(() => {
        reminder.style.opacity = '1';
        reminder.style.transform = 'translateY(0)';
    }, 100);

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
export function closeSubtleReminder() {
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
export function showTrialPopup() {
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
                <button onclick="window.upgradeToPro && window.upgradeToPro()" style="
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
                <button id="close-popup-btn" onclick="window.closeTrialPopup && window.closeTrialPopup()" style="
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
export function closeTrialPopup() {
    const overlay = document.querySelector('[style*="rgba(0, 0, 0, 0.8)"]');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Show trial notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
export function showTrialNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 300px;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.3s ease;
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="flex: 1; margin-right: 8px;">${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                padding: 0;
                margin-left: 10px;
                opacity: 0.7;
            ">&times;</button>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button onclick="window.upgradeToPro && window.upgradeToPro()" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            ">Upgrade Now</button>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                opacity: 0.8;
            ">Maybe Later</button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

/**
 * Upgrade to Pro function
 * @returns {Promise<void>}
 */
export async function upgradeToPro() {
    try {
        const API_BASE = window.API_BASE || '';
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

/**
 * Initialize premium features
 */
export function initializePremiumFeatures() {
    if (typeof window.checkForTaskMigration === 'function') {
        window.checkForTaskMigration();
    }

    if (typeof window.enableCloudSync === 'function') {
        window.enableCloudSync();
    }

    if (typeof window.addPremiumAnalytics === 'function') {
        window.addPremiumAnalytics();
    }

    if (typeof window.enableAdvancedExports === 'function') {
        window.enableAdvancedExports();
    }

    if (typeof window.enableCollaboration === 'function') {
        window.enableCollaboration();
    }
}

/**
 * Get last authentication state
 * @returns {boolean|null} Last authentication state
 */
export function getLastAuthenticationState() {
    return lastAuthenticationState;
}

/**
 * Check if user is currently authenticated
 * @returns {boolean} True if currentUser exists
 */
export function isAuthenticated() {
    return window.currentUser !== null && window.currentUser !== undefined;
}

console.log('✅ auth module loaded');
