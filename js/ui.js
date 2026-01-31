/**
 * User Interface Module for HyperFiler Pro
 * Handles view management, navigation, and UI interactions
 */

// Global UI state variables
let currentView = 'today';
let currentCalendarDate = new Date();
let currentWeekDate = new Date();
let currentTodayDate = new Date();
let mobileMoreMenuOpen = false;

/**
 * Generate skeleton loader HTML
 */
function generateSkeletonLoader(count = 3) {
    let html = '<div class="skeleton-container">';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-task-card">
                <div class="skeleton-loader skeleton-title"></div>
                <div class="skeleton-loader skeleton-meta"></div>
            </div>
        `;
    }
    html += '</div>';
    return html;
}

/**
 * Show skeleton loaders in a container
 */
function showSkeletonLoader(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = generateSkeletonLoader(count);
    }
}

/**
 * Hide skeleton loader and show content
 */
function hideSkeletonLoader(containerId, content) {
    const container = document.getElementById(containerId);
    if (container) {
        // Small delay for smooth transition
        setTimeout(() => {
            container.innerHTML = content;
        }, 200);
    }
}

/**
 * Show a specific view and update navigation
 */
function showView(viewName, preserveDate = false) {
    currentView = viewName;
    window.currentView = viewName; // Fix: Also update global window.currentView for drag handlers
    
    // Reset task selection when changing views
    if (typeof resetTaskSelection === 'function') {
        resetTaskSelection();
    }
    
    // If switching to Today view, reset to current date (unless preserveDate is true)
    if (viewName === 'today' && !preserveDate) {
        currentTodayDate = new Date();
    }
    
    // If switching to Week view, reset to current week
    if (viewName === 'week') {
        currentWeekDate = new Date();
    }
    
    // If switching to Search view, auto-focus the search field
    if (viewName === 'search') {
        setTimeout(() => {
            const searchField = document.getElementById('searchInput');
            if (searchField) {
                searchField.focus();
            }
        }, 100); // Small delay to ensure view is rendered
    }
    
    // Update mobile navigation
    updateMobileNavigation();
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navButton = document.getElementById(`nav-${viewName}`);
    if (navButton) {
        navButton.classList.add('active');
    }
    
    // Update container background to match active tab
    const container = document.querySelector('.container');
    if (container) {
        container.classList.remove('today-active', 'week-active', 'calendar-active', 'all-active', 'lists-active', 'repeat-active', 'undo-active', 'stats-active', 'settings-active', 'recent-actions-active');
        container.classList.add(`${viewName}-active`);
    }
    
    // Show/hide sections
    const views = {
        'today-view': viewName === 'today',
        'calendar-view': viewName === 'calendar',
        'week-view': viewName === 'week',
        'tasks-view': viewName === 'all' || viewName === 'recent-actions',
        'stats-view': viewName === 'stats',
        'lists-view': viewName === 'lists',
        'repeat-view': viewName === 'repeat',
        'undo-view': viewName === 'undo',
        'settings-view': viewName === 'settings'
    };
    
    Object.entries(views).forEach(([viewId, isVisible]) => {
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.classList.toggle('hidden', !isVisible);
        }
    });
    
    // Handle search section
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
        searchSection.style.display = viewName === 'search' ? 'block' : 'none';
    }
    
    // Render the appropriate view
    switch (viewName) {
        case 'today':
            if (typeof renderTodayView === 'function') {
                renderTodayView();
            }
            break;
        case 'week':
            if (typeof safeRenderWeekView === 'function') {
                safeRenderWeekView();
            } else if (typeof renderWeekView === 'function') {
                renderWeekView();
            }
            if (typeof highlightCurrentDay === 'function') {
                highlightCurrentDay();
            }
            break;
        case 'calendar':
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
            if (typeof highlightCurrentDay === 'function') {
                highlightCurrentDay();
            }
            break;
        case 'stats':
            if (typeof renderStats === 'function') {
                renderStats();
            }
            break;
        case 'lists':
            if (typeof renderListsView === 'function') {
                renderListsView();
            }
            break;
        case 'repeat':
            if (typeof renderRepeatView === 'function') {
                renderRepeatView();
            }
            break;
        case 'undo':
            if (typeof renderUndoView === 'function') {
                renderUndoView();
            }
            break;
        case 'settings':
            if (typeof renderSettingsView === 'function') {
                renderSettingsView();
            }
            break;
        case 'search':
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
            if (typeof performSearch === 'function') {
                performSearch(); // Show all tasks initially
            }
            break;
        case 'all':
            console.log('showView: switching to all tasks view');
            if (typeof renderAllTasksView === 'function') {
                renderAllTasksView();
            } else if (typeof renderTasks === 'function') {
                renderTasks(viewName);
            }
            break;
        case 'recent-actions':
            console.log('showView: switching to recent actions view');
            if (typeof renderRecentActionsView === 'function') {
                renderRecentActionsView();
            }
            break;
        default:
            if (typeof renderTasks === 'function') {
                renderTasks(viewName);
            }
    }
    
    // Restore persistent highlighting after render
    if (typeof PERSISTENT_TASK_SELECTION !== 'undefined' && 
        typeof PERSISTENT_TASK_SELECTION.restoreAfterRender === 'function') {
        PERSISTENT_TASK_SELECTION.restoreAfterRender();
    }
    
    // Re-translate UI after view changes to handle dynamic content
    setTimeout(() => {
        if (typeof translateUI === 'function') {
            translateUI();
        }
        // Restore emojis after translations
        setTimeout(() => {
            if (typeof restoreMobileNavEmojis === 'function') {
                restoreMobileNavEmojis();
            }
        }, 50);
    }, 50);
}

/**
 * Switch to mobile view with mobile-specific handling
 */
function switchToMobileView(viewName) {
    // Update mobile header title
    const titles = {
        'today': { key: 'HeaderToday', emoji: '🔥' },
        'week': { key: 'HeaderWeek', emoji: '📅' },
        'calendar': { key: 'HeaderMonth', emoji: '🗓️' },
        'all': { key: 'HeaderSearch', emoji: '🔍' },
        'repeat': { key: 'HeaderRecurring', emoji: '🔄' },
        'lists': { key: 'HeaderLists', emoji: '📝' },
        'trash': { key: 'HeaderTrash', emoji: '🗑️' }
    };
    
    const headerTitle = document.getElementById('mobileHeaderTitle');
    if (headerTitle) {
        const titleData = titles[viewName];
        if (titleData) {
            if (viewName === 'today') {
                console.log('🔄 switchToMobileView setting today header');
                // Use the dedicated function for consistent behavior
                setTimeout(function() {
                    if (typeof updateMobileDateHeader === 'function') {
                        updateMobileDateHeader();
                        console.log('🔄 Called updateMobileDateHeader from switchToMobileView');
                    }
                }, 100);
            } else {
                const translatedText = typeof translateText === 'function' ? translateText(titleData.key) : titleData.key;
                headerTitle.textContent = titleData.emoji + ' ' + translatedText;
            }
        } else {
            headerTitle.textContent = viewName;
        }
    }
    
    // Update mobile navigation active state
    const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
    mobileNavButtons.forEach(btn => btn.classList.remove('active'));
    
    // Restore emojis after any navigation change
    if (typeof restoreMobileNavEmojis === 'function') {
        restoreMobileNavEmojis();
    }
    
    const activeBtn = document.getElementById(`mobileNav${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else if (viewName === 'today') {
        const todayBtn = document.getElementById('mobileNavToday');
        if (todayBtn) todayBtn.classList.add('active');
    } else if (viewName === 'week') {
        const weekBtn = document.getElementById('mobileNavWeek');
        if (weekBtn) weekBtn.classList.add('active');
    }
    
    // Call the existing view switching function
    if (viewName === 'calendar') {
        showView('calendar');
    } else {
        showView(viewName);
    }
    
    // Hide more menu if open
    hideMobileMoreMenu();
}


/**
 * Render current view
 */
function renderCurrentView() {
    // Force set hasLoadedOnce to prevent loading state issues
    window.hasLoadedOnce = true;
    
    switch (currentView) {
        case 'today':
            if (typeof renderTodayView === 'function') {
                renderTodayView();
            }
            break;
        case 'week':
            if (typeof safeRenderWeekView === 'function') {
                safeRenderWeekView();
            } else if (typeof renderWeekView === 'function') {
                renderWeekView();
            }
            if (typeof highlightCurrentDay === 'function') {
                highlightCurrentDay();
            }
            break;
        case 'calendar':
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
            if (typeof highlightCurrentDay === 'function') {
                highlightCurrentDay();
            }
            break;
        case 'repeat':
            if (typeof renderRepeatView === 'function') {
                renderRepeatView();
            }
            break;
        case 'undo':
            if (typeof renderUndoView === 'function') {
                renderUndoView();
            }
            break;
        case 'stats':
            if (typeof renderStats === 'function') {
                renderStats();
            }
            break;
        case 'recent-actions':
            if (typeof renderRecentActionsView === 'function') {
                renderRecentActionsView();
            }
            break;
        case 'search':
            if (typeof performSearch === 'function') {
                performSearch(); // Refresh search results
            }
            break;
        case 'lists':
            if (typeof renderListsView === 'function') {
                renderListsView();
            }
            break;
        case 'settings':
            if (typeof renderSettingsView === 'function') {
                renderSettingsView();
            }
            break;
        default:
            if (typeof renderTasks === 'function') {
                renderTasks(currentView);
            }
    }
    
    // Restore persistent highlighting after render
    if (typeof PERSISTENT_TASK_SELECTION !== 'undefined' && 
        typeof PERSISTENT_TASK_SELECTION.restoreAfterRender === 'function') {
        PERSISTENT_TASK_SELECTION.restoreAfterRender();
    }
}

/**
 * Mobile navigation functions
 */
function toggleMobileMoreMenu() {
    const moreMenu = document.getElementById('mobileMoreMenu');
    if (moreMenu) {
        mobileMoreMenuOpen = !mobileMoreMenuOpen;
        if (mobileMoreMenuOpen) {
            moreMenu.classList.add('show');
        } else {
            moreMenu.classList.remove('show');
        }
    }
}

function hideMobileMoreMenu() {
    const moreMenu = document.getElementById('mobileMoreMenu');
    if (moreMenu) {
        moreMenu.classList.remove('show');
        mobileMoreMenuOpen = false;
    }
}

/**
 * Settings tab management
 */
function showSettingsTab(tabName) {
    // Hide all tab contents
    const allTabs = document.querySelectorAll('.settings-tab-content');
    allTabs.forEach(tab => tab.classList.add('hidden'));
    
    // Remove active class from all tab buttons
    const allTabButtons = document.querySelectorAll('.settings-tab');
    allTabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}Tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    const selectedButton = document.querySelector(`[onclick="showSettingsTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

/**
 * Update mobile navigation state
 */
function updateMobileNavigation() {
    // Update mobile header and navigation based on current view
    const mobileHeader = document.getElementById('mobileHeader');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileHeader) {
        // Update header title based on current view
        const headerTitle = document.getElementById('mobileHeaderTitle');
        if (headerTitle) {
            if (currentView === 'today') {
                // Use the dedicated function for today view to show month
                console.log('🔄 updateMobileNavigation calling updateMobileDateHeader for today view');
                setTimeout(function() {
                    if (typeof updateMobileDateHeader === 'function') {
                        updateMobileDateHeader();
                    }
                }, 100);
            } else {
                const titles = {
                    'week': '📅 Week',
                    'calendar': '🗓️ Month',
                    'all': '🔍 All Tasks',
                    'repeat': '🔄 Repeat',
                    'lists': '📝 Lists',
                    'stats': '📊 Stats',
                    'settings': '⚙️ Settings',
                    'search': '🔍 Search',
                    'recent-actions': '⏮️ Recent Actions'
                };
                
                headerTitle.textContent = titles[currentView] || currentView;
            }
        }
    }
    
    if (mobileNav) {
        // Update active navigation button
        const navButtons = mobileNav.querySelectorAll('.mobile-nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            
            // Add active class to current view button
            const btnView = btn.getAttribute('data-view') || btn.id.replace('mobileNav', '').toLowerCase();
            if (btnView === currentView || 
                (currentView === 'calendar' && btnView === 'month') ||
                (currentView === 'all' && btnView === 'tasks')) {
                btn.classList.add('active');
            }
        });
    }
}

/**
 * Mobile date header updates
 */
function updateMobileDateHeader() {
    try {
        console.log('🔄 updateMobileDateHeader() called');
        const headerTitle = document.getElementById('mobileHeaderTitle');
        console.log('🎯 headerTitle element:', headerTitle);
        if (headerTitle) {
            console.log('📱 Mobile header element found, current content:', headerTitle.innerHTML);
            console.log('📱 Element styles:', window.getComputedStyle(headerTitle).display, window.getComputedStyle(headerTitle).visibility);
            
            // Use the same reliable date checking pattern as updateMobileDateDisplay
            let currentDate = new Date();
            let dateFound = false;
            
            // PRIORITY: Check currentTodayDate (used by navigation system)
            if (window.currentTodayDate && !dateFound) {
                try {
                    // If it's already a Date object, use it directly, otherwise create new Date
                    if (window.currentTodayDate instanceof Date) {
                        currentDate = window.currentTodayDate;
                    } else {
                        currentDate = new Date(window.currentTodayDate);
                    }
                    
                    if (!isNaN(currentDate.getTime())) {
                        dateFound = true;
                        console.log('📅 Using window.currentTodayDate for month:', currentDate.toDateString());
                    }
                } catch (e) {
                    console.log('❌ Error parsing currentTodayDate for month:', e);
                }
            }
            
            // Fallback to currentTodayDate variable if available
            if (!dateFound && typeof currentTodayDate !== 'undefined') {
                try {
                    if (currentTodayDate instanceof Date) {
                        currentDate = currentTodayDate;
                    } else {
                        currentDate = new Date(currentTodayDate);
                    }
                    
                    if (!isNaN(currentDate.getTime())) {
                        dateFound = true;
                        console.log('📅 Using currentTodayDate variable for month:', currentDate.toDateString());
                    }
                } catch (e) {
                    console.log('❌ Error parsing currentTodayDate variable for month:', e);
                }
            }
            
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = monthNames[currentDate.getMonth()];
            
            // Make month clickable to return to today  
            headerTitle.innerHTML = '<span onclick="goToToday()" style="cursor: pointer; font-size: 18px; font-weight: bold; color: #007aff;">' + monthName + '</span>';
            
            // Force visibility
            headerTitle.style.display = 'block';
            headerTitle.style.visibility = 'visible';
            headerTitle.style.color = '#007aff';
            
            console.log('📱 Mobile header updated to:', monthName, 'from date:', currentDate.toDateString());
            console.log('📱 Final innerHTML:', headerTitle.innerHTML);
        }
        
        // Also update the mobile date display between Ant/Sig buttons
        if (typeof updateMobileDateDisplay === 'function') {
            updateMobileDateDisplay();
        }
    } catch (error) {
        console.error('Error in updateMobileDateHeader:', error);
    }
}

/**
 * Navigation date functions
 */
function goToToday() {
    console.log('🏠 goToToday() called - before:', currentTodayDate.toDateString());
    currentTodayDate = new Date();
    // Sync with global window variable for other components
    window.currentTodayDate = currentTodayDate;
    console.log('🏠 goToToday() - after:', currentTodayDate.toDateString(), 'window.currentTodayDate:', window.currentTodayDate.toDateString());
    if (currentView === 'today') {
        updateMobileDateHeader();
        renderCurrentView();
    } else {
        showView('today');
    }
}

function goToCurrentWeek() {
    currentWeekDate = new Date();
    if (currentView === 'week') {
        renderCurrentView();
    } else {
        showView('week');
    }
}

function goToCurrentMonth() {
    currentCalendarDate = new Date();
    if (currentView === 'calendar') {
        renderCurrentView();
    } else {
        showView('calendar');
    }
}

/**
 * Week navigation functions
 */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

function previousWeek() {
    currentWeekDate.setDate(currentWeekDate.getDate() - 7);
    if (typeof safeRenderWeekView === 'function') {
        safeRenderWeekView();
    } else if (typeof renderWeekView === 'function') {
        renderWeekView();
    }
}

function nextWeek() {
    currentWeekDate.setDate(currentWeekDate.getDate() + 7);
    if (typeof safeRenderWeekView === 'function') {
        safeRenderWeekView();
    } else if (typeof renderWeekView === 'function') {
        renderWeekView();
    }
}

/**
 * Day navigation functions
 */
function previousDay() {
    console.log('🔙 previousDay() called - before:', currentTodayDate.toDateString());
    currentTodayDate.setDate(currentTodayDate.getDate() - 1);
    // Sync with global window variable for other components
    window.currentTodayDate = currentTodayDate;
    console.log('🔙 previousDay() - after:', currentTodayDate.toDateString(), 'window.currentTodayDate:', window.currentTodayDate.toDateString());
    updateMobileDateHeader();
    if (typeof renderTodayView === 'function') {
        renderTodayView();
    }
}

function nextDay() {
    console.log('▶️ nextDay() called - before:', currentTodayDate.toDateString());
    currentTodayDate.setDate(currentTodayDate.getDate() + 1);
    // Sync with global window variable for other components
    window.currentTodayDate = currentTodayDate;
    console.log('▶️ nextDay() - after:', currentTodayDate.toDateString(), 'window.currentTodayDate:', window.currentTodayDate.toDateString());
    updateMobileDateHeader();
    if (typeof renderTodayView === 'function') {
        renderTodayView();
    }
}

/**
 * Month navigation functions
 */
function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

/**
 * Display update functions
 */
function updateCurrentTodayDisplay() {
    console.log('🔍 DEBUG: updateCurrentTodayDisplay FIRST VERSION (line 726) executing');
    const todayDateElement = document.getElementById('todayDate');
    if (todayDateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        todayDateElement.textContent = currentTodayDate.toLocaleDateString('en-US', options);
    }
}

function updateCurrentWeekDisplay() {
    const weekDateElement = document.getElementById('weekDate');
    if (weekDateElement) {
        const monday = getMonday(currentWeekDate);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        const options = { month: 'short', day: 'numeric' };
        const mondayStr = monday.toLocaleDateString('en-US', options);
        const sundayStr = sunday.toLocaleDateString('en-US', options);
        
        weekDateElement.textContent = `${mondayStr} - ${sundayStr}`;
    }
}

function updateCurrentMonthDisplay() {
    const monthDateElement = document.getElementById('monthDate');
    if (monthDateElement) {
        const options = { year: 'numeric', month: 'long' };
        monthDateElement.textContent = currentCalendarDate.toLocaleDateString('en-US', options);
    }
}

/**
 * Modal management functions
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        // Add event listener to close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Notification and feedback functions
 */
function showInlineNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `inline-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * Keyboard navigation support
 */
function initializeKeyboardNavigation() {
    console.log('🎹 initializeKeyboardNavigation called - adding keyboard listener');
    document.addEventListener('keydown', (e) => {
        console.log('🔑 Key pressed:', e.key, 'Target:', e.target.tagName, 'Prevented:', e.defaultPrevented);
        // Handle template navigation first
        if (templateNavActive) {
            console.log('🏷️ Template navigation active, handling key:', e.key);
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    navigateTemplateButtons('left');
                    return;
                case 'ArrowRight':
                    e.preventDefault();
                    navigateTemplateButtons('right');
                    return;
                case 'Enter':
                    console.log('⚡ Enter pressed - applying highlighted template filter');
                    e.preventDefault();
                    if (templateButtons[selectedButtonIndex]) {
                        clickTemplateButton(templateButtons[selectedButtonIndex]);
                        exitTemplateNavigation();
                    }
                    return;
                case 'p':
                case 'P':
                    console.log('🔄 P pressed during template navigation - toggling off');
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation(); // Prevent any further handling
                    exitTemplateNavigation();
                    return;
                case 'Escape':
                    console.log('🚪 ESC pressed during template navigation - exiting');
                    console.log('Template nav state before exit:', templateNavActive);
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from bubbling
                    exitTemplateNavigation();
                    console.log('Template nav state after exit:', templateNavActive);
                    return;
                default:
                    // Check if it's a navigation key - if so, exit template nav and let it through
                    const navKeys = ['t', 'w', 'm', 's', 'l', 'r', 'u', 'x', '/'];
                    if (navKeys.includes(e.key.toLowerCase())) {
                        console.log('🔄 Navigation key pressed - exiting template nav and switching view:', e.key);
                        exitTemplateNavigation();
                        // Don't return - let the key fall through to normal navigation
                    } else {
                        // Other keys just pass through
                        console.log('🔓 Allowing key to pass through template nav:', e.key);
                        break;
                    }
            }
        }
        
        // Only handle keyboard shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            console.log('🚫 Ignoring key because typing in:', e.target.tagName);
            return;
        }
        
        console.log('⌨️ Processing shortcut key:', e.key.toLowerCase());
        
        // Handle arrow keys for date navigation (when not in template nav)
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !window.currentDateDropdown && !window.currentTimeDropdown) {
            e.preventDefault();
            
            if (e.key === 'ArrowLeft') {
                // Navigate to previous day/week/month based on current view
                if (window.currentView === 'today') {
                    console.log('⬅️ Arrow left - previous day');
                    if (typeof previousDay === 'function') previousDay();
                } else if (window.currentView === 'week') {
                    console.log('⬅️ Arrow left - previous week');
                    if (typeof previousWeek === 'function') previousWeek();
                } else if (window.currentView === 'calendar') {
                    console.log('⬅️ Arrow left - previous month');
                    if (typeof previousMonth === 'function') previousMonth();
                }
            } else if (e.key === 'ArrowRight') {
                // Navigate to next day/week/month based on current view
                if (window.currentView === 'today') {
                    console.log('➡️ Arrow right - next day');
                    if (typeof nextDay === 'function') nextDay();
                } else if (window.currentView === 'week') {
                    console.log('➡️ Arrow right - next week');
                    if (typeof nextWeek === 'function') nextWeek();
                } else if (window.currentView === 'calendar') {
                    console.log('➡️ Arrow right - next month');
                    if (typeof nextMonth === 'function') nextMonth();
                }
            }
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case 't':
                console.log('✅ T key - switching to Today view and clearing all template filters');
                clearAllTemplateFilters();
                showView('today');
                break;
            case 'w':
                console.log('✅ W key - switching to Week view');
                showView('week');
                break;
            case 'm':
                console.log('✅ M key - switching to Month view');
                showView('calendar');
                break;
            case 's':
                console.log('✅ S key - switching to Search view');
                showView('all');
                break;
            case 'l':
                console.log('✅ L key - switching to Lists view');
                showView('lists');
                break;
            case 'r':
                console.log('✅ R key - switching to Repeat view');
                showView('repeat');
                break;
            case 'u':
                console.log('✅ U key - switching to Undo view');
                showView('recent-actions');
                break;
            case 'x':
                console.log('✅ X key - switching to Settings view');
                showView('settings');
                break;
            case 'p':
                console.log('✅ P key pressed in general handler, templateNavActive:', templateNavActive);
                e.preventDefault();
                e.stopPropagation();
                if (templateNavActive) {
                    console.log('🔄 P pressed - template nav is active, exiting');
                    exitTemplateNavigation();
                } else {
                    console.log('🏷️ P pressed - template nav is inactive, activating');
                    activateTemplateSelector();
                }
                break;
            case '/':
                e.preventDefault();
                showView('search');
                break;
            case 'Escape':
                // Template navigation should already be handled above
                // This is only for closing modals when not in template nav
                console.log('🚪 ESC pressed in general navigation');
                e.preventDefault();
                // Close any open modals
                const openModals = document.querySelectorAll('[style*="display: block"]');
                openModals.forEach(modal => {
                    if (modal.id && modal.id.includes('Modal')) {
                        closeModal(modal.id);
                    }
                });
                break;
            default:
                console.log('🔍 Unhandled key:', e.key.toLowerCase());
                break;
        }
    });
}

/**
 * Group tasks by date for rendering
 */
function groupTasksByDate(tasksArray) {
    const grouped = {};
    
    tasksArray.forEach(task => {
        const dateKey = task.dueDate || 'no-date';
        if (!grouped[dateKey]) {
            grouped[dateKey] = { date: dateKey, tasks: [] };
        }
        grouped[dateKey].tasks.push(task);
    });
    
    // Sort tasks within each group: events first, then by time, then by status
    Object.keys(grouped).forEach(dateKey => {
        grouped[dateKey].tasks.sort((a, b) => {
            // Prioritize events first within the same day
            if (a.isEvent !== b.isEvent) {
                return a.isEvent ? -1 : 1;
            }
            
            // Then sort by time if both have times
            if (a.dueTime && b.dueTime) {
                return a.dueTime.localeCompare(b.dueTime);
            }
            if (a.dueTime && !b.dueTime) return -1;
            if (!a.dueTime && b.dueTime) return 1;
            
            // Finally by creation date
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    });
    
    // Sort groups by date
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'no-date') return 1;
        if (b === 'no-date') return -1;
        return new Date(a) - new Date(b);
    });
    
    const sortedGrouped = {};
    sortedKeys.forEach(key => {
        sortedGrouped[key] = grouped[key];
    });
    
    return sortedGrouped;
}

/**
 * Render individual task card
 */
function renderTaskCard(task, isAllTasksView = false) {
    const isOverdue = window.isTaskOverdue ? window.isTaskOverdue(task) : (task.dueDate && task.dueDate < getLocalDateString() && task.status === 'pending');
    const isEvent = task.isEvent;
    let cardClass = `task-card ${task.status}`;
    
    if (isEvent) {
        cardClass += ' event';
    } else if (isOverdue) {
        cardClass += ' overdue';
    }
    
    // Different checkbox behavior based on view
    const checkboxHtml = isAllTasksView ? 
        // All Tasks view: checkbox for bulk selection
        `<input type="checkbox" class="task-selection-checkbox" 
               onclick="toggleTaskSelection('${task.id}', event)" 
               data-task-id="${task.id}"
               style="margin-right: 10px;"
               title="Select this task for bulk actions">` : 
        // Today/Week/Month views: checkbox for task completion/deletion
        `<input type="checkbox" class="task-completion-checkbox" 
               onclick="completeTask('${task.id}', event)" 
               data-task-id="${task.id}"
               style="margin-right: 10px;"
               title="Mark as complete">`;
    
    return `
        <div class="${cardClass}" 
             onclick="editTask('${task.id}')" 
             data-task-id="${task.id}" 
             draggable="true"
             ondragstart="handleDragStart(event)"
             ondragend="handleDragEnd(event)"
             ontouchstart="handleTouchStart(event, '${task.id}')"
             ontouchmove="handleTouchMove(event, '${task.id}')"
             ontouchend="handleTouchEnd(event, '${task.id}')"
             style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; min-height: 40px; cursor: move; transition: transform 0.3s ease;">
            <div style="display: flex; align-items: center; flex: 1;">
                <div style="margin-right: 8px; color: #ccc; cursor: grab;">⋮⋮</div>
                ${checkboxHtml}
                <div class="task-title" style="flex: 1;" title="${task.title}${task.notes ? ' - ' + task.notes : ''}">
                    ${(task.repeat && task.repeat !== 'none') ? `<span class="repeat-badge" title="Recurring task: ${task.repeat}" style="background: #ffc107; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-right: 6px;">🔄</span>` : ''}
                    ${makeLinksClickable(extractTagsAndCleanText(task.title).cleanText)}
                    ${hasTaskTags(task) ? ` <span style="color: #999; font-size: 14px;">🏷️</span>` : ''}
                    ${isOverdue && !isEvent ? ' <span style="color: #dc3545; font-weight: bold;">OVERDUE</span>' : ''}
                    ${task.notes ? ` <span style="color: #666; font-size: 12px; margin-left: 8px;" title="${task.notes}">📝</span>` : ''}
                </div>
            </div>
            <div class="action-buttons" style="display: flex; gap: 4px; align-items: center;">
                <span style="cursor: pointer; font-size: 16px; padding: 4px; position: relative;" 
                      title="Change date" 
                      onclick="event.stopPropagation(); openIOSDateTimePicker('${task.id}', '${task.dueDate || ''}', '${task.dueTime || ''}', this)">
                    📅
                </span>
                <span style="cursor: pointer; font-size: 16px; padding: 4px; position: relative;"
                      title="Change time"
                      onclick="event.stopPropagation(); openTimeDropdown('${task.id}', '${task.dueTime || ''}', this)">
                    🕐
                </span>
                <button onclick="delayTask('${task.id}', 1, event)" 
                        style="background: #ffc107; color: #333; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;" 
                        title="Delay by 1 day">+1D</button>
                <button onclick="delayTask('${task.id}', 7, event)" 
                        style="background: #17a2b8; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;" 
                        title="Delay by 1 week">+1W</button>
                <button onclick="delayTask('${task.id}', 30, event)" 
                        style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;" 
                        title="Delay by 1 month">+1M</button>
            </div>
        </div>
    `;
}

/**
 * Render tasks for various views
 */
function renderTasks(viewType) {
    if (viewType === 'all') {
        // For All Tasks view, use the search functionality
        performAllTasksSearch();
        return;
    }

    // For other view types, use the original logic
    console.log('renderTasks called with viewType:', viewType);
    console.log('Total tasks:', tasks.length);

    const container = document.getElementById('tasksContainer');

    if (!container) {
        console.error('tasksContainer not found');
        return;
    }

    // Show skeleton loader while processing
    showSkeletonLoader('tasksContainer', 5);

    // Process tasks with small delay to show skeleton loader
    setTimeout(() => {
        let filteredTasks = [];

        if (viewType === 'today') {
            const today = getLocalDateString();
            filteredTasks = tasks.filter(task => task.dueDate === today);
        } else if (viewType === 'week') {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const weekStartStr = getLocalDateString(weekStart);
            const weekEndStr = getLocalDateString(weekEnd);

            filteredTasks = tasks.filter(task => {
                return task.dueDate && task.dueDate >= weekStartStr && task.dueDate <= weekEndStr;
            });
        } else {
            filteredTasks = tasks;
        }

        if (filteredTasks.length === 0) {
            const emptyStateHTML = `
                <div class="no-tasks">
                    <div class="no-tasks-illustration">✨</div>
                    <h3 class="no-tasks-title">All Clear!</h3>
                    <p class="no-tasks-message">No tasks scheduled for this view. Time to plan ahead or enjoy your free time!</p>
                    <button class="no-tasks-cta" onclick="openAddTaskModal()">
                        <span>➕</span>
                        <span>Add a Task</span>
                    </button>
                </div>
            `;
            hideSkeletonLoader('tasksContainer', emptyStateHTML);
            return;
        }

        // Group tasks by date
        const taskGroups = groupTasksByDate(filteredTasks);

        let html = '';
        for (const [dateKey, groupData] of Object.entries(taskGroups)) {
            const groupTasks = groupData.tasks;
            html += `
                <div class="task-group" id="group-${dateKey}">
                    <h4 class="group-header" onclick="toggleGroup('${dateKey}')">
                        <span class="group-icon">📁</span>
                        <span class="group-title">${getGroupTitle(dateKey)}</span>
                        <span class="group-count">(${groupTasks.length})</span>
                    </h4>
                    <div class="group-content" id="content-${dateKey}">
                        ${groupTasks.map(task => renderTaskCard(task)).join('')}
                    </div>
                </div>
            `;
        }

        hideSkeletonLoader('tasksContainer', html);
    }, 100);
}

/**
 * Get group title for date grouping
 */
function getGroupTitle(dateKey) {
    if (dateKey === 'no-date') return 'No Date';
    return formatDateForDisplay(dateKey);
}

/**
 * Toggle group visibility
 */
function toggleGroup(dateKey) {
    const content = document.getElementById(`content-${dateKey}`);
    if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Open the format selection modal for GTD Review
 */
function openReviewFormatModal(mode) {
    window.reviewMode = mode || 'weekly';
    const modal = document.getElementById('reviewFormatModal');
    if (modal) {
        const title = document.getElementById('reviewModalTitle');
        if (title) {
            title.textContent = mode === 'projects' ? '📁 GTD Projects Review' : mode === 'daily' ? '☀️ GTD Daily Review' : '📊 GTD Weekly Review';
        }
        modal.style.display = 'block';

        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', function closeOnClickOutside(event) {
                if (event.target === modal) {
                    closeReviewFormatModal();
                    document.removeEventListener('click', closeOnClickOutside);
                }
            });
        }, 100);
    }
}

/**
 * Close the format selection modal
 */
function closeReviewFormatModal() {
    const modal = document.getElementById('reviewFormatModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Generate simple GTD review with just date groups and project groups
 */
function generateSimpleTasksReview(mode) {
    mode = mode || 'weekly';
    const isDaily = mode === 'daily';
    const isProjects = mode === 'projects';

    const allTasks = tasks.filter(task => task.status !== 'deleted');

    if (allTasks.length === 0) {
        alert('No tasks to review!');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateString(today);

    // Calculate current week boundaries (Monday to Sunday)
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(today.getDate() + diffToMonday);
    const weekStartStr = getLocalDateString(weekStart);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = getLocalDateString(weekEnd);

    const reviewTitle = isProjects ? '📁 GTD Projects Review' : isDaily ? '☀️ GTD Daily Review' : '📊 GTD Weekly Review';
    const reviewSubtitle = isProjects ? `All projects as of ${todayStr}` : isDaily ? todayStr : `${weekStartStr} to ${weekEndStr}`;

    // Generate simple report HTML
    let reportHTML = `
        <div style="max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h1 style="text-align: center; color: ${isProjects ? '#6f42c1' : isDaily ? '#ff6b35' : '#2563eb'}; margin-bottom: 5px;">${reviewTitle}</h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">${reviewSubtitle}</p>
    `;

    // 1. EVENTS SECTION - filtered by mode (skip for projects mode)
    if (!isProjects) {
    const events = allTasks.filter(task => {
        if (!task.isEvent) return false;
        if (isDaily) return task.dueDate === todayStr;
        // Weekly: only events within current week
        return task.dueDate && task.dueDate >= weekStartStr && task.dueDate <= weekEndStr;
    });

    if (events.length > 0) {
        reportHTML += `
            <div style="margin-bottom: 40px;">
                <h2 style="color: #0ea5e9; border-bottom: 3px solid #0ea5e9; padding-bottom: 8px; margin-bottom: 20px;">
                    🎉 Events (${events.length})
                </h2>
        `;

        // Group events by date
        const eventsByDate = {};
        events.forEach(event => {
            if (!eventsByDate[event.dueDate]) {
                eventsByDate[event.dueDate] = [];
            }
            eventsByDate[event.dueDate].push(event);
        });

        const sortedEventDates = Object.keys(eventsByDate).sort();
        sortedEventDates.forEach(date => {
            const eventsForDate = eventsByDate[date];
            const isToday = date === todayStr;
            const isPast = date < todayStr;

            const dateStyle = isPast ? 'color: #dc3545; background: #fef2f2;' :
                             isToday ? 'color: #ff6b35; background: #fff7ed;' :
                             'color: #059669; background: #f0fdf4;';

            reportHTML += `
                <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${isPast ? '#dc3545' : isToday ? '#ff6b35' : '#059669'}; border-radius: 4px; ${dateStyle}">
                    <h3 style="margin: 0 0 15px 0;">${isPast ? '🚨' : isToday ? '⚡' : '🎉'} ${date} (${eventsForDate.length})</h3>
                    <ul style="margin: 0; padding-left: 20px; list-style: none;">
            `;

            eventsForDate.forEach(event => {
                reportHTML += `
                    <li style="margin: 6px 0; padding: 8px; background: white; border-radius: 3px;">
                        🎉 ${event.title || 'Untitled Event'}
                        ${event.dueTime ? `<span style="color: #666; font-size: 12px; margin-left: 6px;">${event.dueTime}</span>` : ''}
                        ${event.notes ? `<div style="margin-top: 4px; color: #666; font-size: 13px;">${event.notes}</div>` : ''}
                    </li>
                `;
            });

            reportHTML += `</ul></div>`;
        });

        reportHTML += `</div>`;
    }

    // 2. TASKS SECTION - filtered by mode
    reportHTML += `
            <div style="margin-bottom: 40px;">
                <h2 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 8px; margin-bottom: 20px;">
                    📅 ${isDaily ? 'Today\'s Tasks' : 'Tasks by Date'}
                </h2>
    `;

    // Group tasks by dates, filtered by mode
    const dateGroups = {};
    const noDateTasks = [];

    allTasks.forEach(task => {
        if (task.isEvent) return;

        if (isDaily) {
            // Daily: only today's tasks
            if (task.dueDate === todayStr) {
                if (!dateGroups[task.dueDate]) dateGroups[task.dueDate] = [];
                dateGroups[task.dueDate].push(task);
            }
        } else {
            // Weekly: all tasks
            if (!task.dueDate) {
                noDateTasks.push(task);
            } else {
                if (!dateGroups[task.dueDate]) dateGroups[task.dueDate] = [];
                dateGroups[task.dueDate].push(task);
            }
        }
    });

    if (!isDaily && noDateTasks.length > 0) {
        reportHTML += `
            <div style="margin-bottom: 25px; padding: 15px; background: #fef2f2; border-left: 4px solid #dc3545; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #dc3545;">🚨 No Date (${noDateTasks.length})</h3>
                <ul style="margin: 0; padding-left: 20px; list-style: none;">
        `;
        noDateTasks.forEach(task => {
            reportHTML += `
                <li style="margin: 6px 0; padding: 8px; background: white; border-radius: 3px;">
                    📋 ${task.title || 'Untitled'}
                    ${task.notes ? `<div style="margin-top: 4px; color: #666; font-size: 13px;">${task.notes}</div>` : ''}
                </li>
            `;
        });
        reportHTML += `</ul></div>`;
    }

    const sortedDates = Object.keys(dateGroups).sort();
    sortedDates.forEach(date => {
        const tasksForDate = dateGroups[date];
        // For daily review, sort by time (earliest first, no-time tasks at end)
        if (isDaily) {
            tasksForDate.sort((a, b) => {
                if (!a.dueTime && !b.dueTime) return 0;
                if (!a.dueTime) return 1;
                if (!b.dueTime) return -1;
                return a.dueTime.localeCompare(b.dueTime);
            });
        }
        const isToday = date === todayStr;
        const isPast = date < todayStr;

        const dateStyle = isPast ? 'color: #dc3545; background: #fef2f2;' :
                         isToday ? 'color: #ff6b35; background: #fff7ed;' :
                         'color: #059669; background: #f0fdf4;';

        reportHTML += `
            <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid ${isPast ? '#dc3545' : isToday ? '#ff6b35' : '#059669'}; border-radius: 4px; ${dateStyle}">
                <h3 style="margin: 0 0 15px 0;">${isPast ? '🚨' : isToday ? '⚡' : '📅'} ${date} (${tasksForDate.length})</h3>
                <ul style="margin: 0; padding-left: 20px; list-style: none;">
        `;

        tasksForDate.forEach(task => {
            reportHTML += `
                <li style="margin: 6px 0; padding: 8px; background: white; border-radius: 3px;">
                    ${task.dueTime ? `<span style="color: #007AFF; font-size: 12px; font-weight: 600; margin-right: 6px;">${task.dueTime}</span> ` : ''}${isDaily ? (extractTagsAndCleanText(task.title || 'Untitled').cleanText) : (task.title || 'Untitled')}
                    ${task.notes ? `<div style="margin-top: 4px; color: #666; font-size: 13px;">${task.notes}</div>` : ''}
                </li>
            `;
        });

        reportHTML += `</ul></div>`;
    });

    reportHTML += `</div>`;
    } // end if (!isProjects)

    // 2. TASKS WITH TEMPLATES GROUPED BY PROJECTS (only in projects mode)
    if (isProjects) {
    const templatedProjects = {};
    allTasks.forEach(task => {
        if (task.isEvent) return;

        const text = `${task.title || ''} ${task.notes || ''}`;
        const templates = TemplateProcessor.extractFromText(text);

        if (templates.length > 0) {
            templates.forEach(template => {
                if (!templatedProjects[template]) {
                    templatedProjects[template] = [];
                }
                templatedProjects[template].push(task);
            });
        }
    });

    if (Object.keys(templatedProjects).length > 0) {
        reportHTML += `
            <div style="margin-bottom: 40px;">
                <h2 style="color: #6f42c1; border-bottom: 3px solid #6f42c1; padding-bottom: 8px; margin-bottom: 20px;">
                    📁 Projects (Tasks with @templates)
                </h2>
        `;
        
        // Sort projects by task count
        const sortedProjects = Object.entries(templatedProjects)
            .sort((a, b) => b[1].length - a[1].length);
        
        sortedProjects.forEach(([template, projectTasks]) => {
            reportHTML += `
                <div style="margin-bottom: 25px; padding: 15px; background: #f8f7ff; border-left: 4px solid #6f42c1; border-radius: 4px;">
                    <h3 style="margin: 0 0 15px 0; color: #6f42c1;">📁 ${template} (${projectTasks.length} tasks)</h3>
                    <ul style="margin: 0; padding-left: 20px; list-style: none;">
            `;
            
            projectTasks.forEach(task => {
                const isPast = task.dueDate && task.dueDate < todayStr;
                const isToday = task.dueDate === todayStr;
                
                const taskStyle = isPast ? 'border-left: 3px solid #dc3545; background: #fef2f2;' : 
                                 isToday ? 'border-left: 3px solid #ff6b35; background: #fff7ed;' : 
                                 'border-left: 3px solid #e5e7eb; background: white;';
                
                reportHTML += `
                    <li style="margin: 8px 0; padding: 10px; ${taskStyle} border-radius: 3px;">
                        ${isPast ? '🚨' : isToday ? '⚡' : '📋'} ${task.title || 'Untitled'}
                        ${task.dueDate ? `<span style="color: #666; margin-left: 8px; font-size: 12px;">${task.dueDate}</span>` : ''}
                        ${task.notes ? `<div style="margin-top: 4px; color: #666; font-size: 13px;">${task.notes}</div>` : ''}
                    </li>
                `;
            });
            
            reportHTML += `</ul></div>`;
        });
        
        reportHTML += `</div>`;
    }
    } // end if (isProjects)

    // Footer
    reportHTML += `
        <div style="text-align: center; margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
                Generated on ${todayStr} at ${new Date().toLocaleTimeString()}
            </p>
        </div>
        </div>
    `;
    
    // Check if format preferences were set by the modal
    const formats = window.selectedReviewFormats;
    
    const filePrefix = isProjects ? 'gtd-projects' : isDaily ? 'gtd-daily' : 'gtd-weekly';

    if (formats) {
        if (formats.txt) {
            const plainText = generateSimplePlainTextReport(allTasks, todayStr, mode);
            downloadTextFile(plainText, `${filePrefix}-${todayStr}.txt`);
        }

        if (formats.org) {
            const orgMode = generateSimpleOrgModeReport(allTasks, todayStr, mode);
            downloadTextFile(orgMode, `${filePrefix}-${todayStr}.org`);
        }

        if (formats.html) {
            openHTMLReport(reportHTML, todayStr);
        }

        if (formats.pdf) {
            openPrintableReport(reportHTML, todayStr);
        }

        window.selectedReviewFormats = null;

    } else {
        openHTMLReport(reportHTML, todayStr);
    }
}

/**
 * Generate simple plain text report
 */
function generateSimplePlainTextReport(allTasks, todayStr, mode) {
    mode = mode || 'weekly';
    const isDaily = mode === 'daily';
    const isProjects = mode === 'projects';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(today.getDate() + diffToMonday);
    const weekStartStr = getLocalDateString(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = getLocalDateString(weekEnd);

    let text = isProjects ? `GTD PROJECTS REVIEW\n` : isDaily ? `GTD DAILY REVIEW\n` : `GTD WEEKLY REVIEW\n`;
    text += `Generated on ${todayStr} at ${new Date().toLocaleTimeString()}\n`;
    if (!isDaily && !isProjects) text += `Week: ${weekStartStr} to ${weekEndStr}\n`;
    text += `${'='.repeat(50)}\n\n`;

    if (!isProjects) {
    // EVENTS - filtered by mode
    const events = allTasks.filter(task => {
        if (!task.isEvent) return false;
        if (isDaily) return task.dueDate === todayStr;
        return task.dueDate && task.dueDate >= weekStartStr && task.dueDate <= weekEndStr;
    });

    if (events.length > 0) {
        text += `EVENTS (${events.length})\n`;
        text += `${'='.repeat(30)}\n\n`;

        const eventsByDate = {};
        events.forEach(event => {
            if (!eventsByDate[event.dueDate]) eventsByDate[event.dueDate] = [];
            eventsByDate[event.dueDate].push(event);
        });

        Object.keys(eventsByDate).sort().forEach(date => {
            const eventsForDate = eventsByDate[date];
            text += `${date} (${eventsForDate.length})\n`;
            text += `${'-'.repeat(20)}\n`;
            eventsForDate.forEach(event => {
                text += `• ${event.title || 'Untitled Event'}`;
                if (event.dueTime) text += ` [${event.dueTime}]`;
                text += `\n`;
                if (event.notes) text += `  ${event.notes}\n`;
            });
            text += `\n`;
        });
    }

    // TASKS - filtered by mode
    const dateGroups = {};
    const noDateTasks = [];

    allTasks.forEach(task => {
        if (task.isEvent) return;
        if (isDaily) {
            if (task.dueDate === todayStr) {
                if (!dateGroups[task.dueDate]) dateGroups[task.dueDate] = [];
                dateGroups[task.dueDate].push(task);
            }
        } else {
            if (!task.dueDate) {
                noDateTasks.push(task);
            } else {
                if (!dateGroups[task.dueDate]) dateGroups[task.dueDate] = [];
                dateGroups[task.dueDate].push(task);
            }
        }
    });

    text += isDaily ? `TODAY'S TASKS\n` : `TASKS BY DATE\n`;
    text += `${'='.repeat(30)}\n\n`;

    if (!isDaily && noDateTasks.length > 0) {
        text += `NO DATE (${noDateTasks.length})\n`;
        text += `${'-'.repeat(20)}\n`;
        noDateTasks.forEach(task => {
            text += `• ${task.title || 'Untitled'}\n`;
            if (task.notes) text += `  ${task.notes}\n`;
        });
        text += `\n`;
    }

    Object.keys(dateGroups).sort().forEach(date => {
        const tasksForDate = dateGroups[date];
        if (isDaily) {
            tasksForDate.sort((a, b) => {
                if (!a.dueTime && !b.dueTime) return 0;
                if (!a.dueTime) return 1;
                if (!b.dueTime) return -1;
                return a.dueTime.localeCompare(b.dueTime);
            });
        }
        text += `${date} (${tasksForDate.length})\n`;
        text += `${'-'.repeat(20)}\n`;
        tasksForDate.forEach(task => {
            const title = isDaily ? extractTagsAndCleanText(task.title || 'Untitled').cleanText : (task.title || 'Untitled');
            if (task.dueTime) text += `• [${task.dueTime}] ${title}`;
            else text += `• ${title}`;
            text += `\n`;
            if (task.notes) text += `  ${task.notes}\n`;
        });
        text += `\n`;
    });
    } // end if (!isProjects)

    // Projects section (projects mode only)
    if (isProjects) {
        const templatedProjects = {};
        allTasks.forEach(task => {
            if (task.isEvent) return;
            const text_content = `${task.title || ''} ${task.notes || ''}`;
            const templates = TemplateProcessor.extractFromText(text_content);
            if (templates.length > 0) {
                templates.forEach(template => {
                    if (!templatedProjects[template]) templatedProjects[template] = [];
                    templatedProjects[template].push(task);
                });
            }
        });

        if (Object.keys(templatedProjects).length > 0) {
            text += `\nPROJECTS (Tasks with @templates)\n`;
            text += `${'='.repeat(30)}\n\n`;

            Object.entries(templatedProjects)
                .sort((a, b) => b[1].length - a[1].length)
                .forEach(([template, projectTasks]) => {
                    text += `${template} (${projectTasks.length} tasks)\n`;
                    text += `${'-'.repeat(20)}\n`;
                    projectTasks.forEach(task => {
                        text += `• ${task.title || 'Untitled'}`;
                        if (task.dueDate) text += ` [${task.dueDate}]`;
                        text += `\n`;
                        if (task.notes) text += `  ${task.notes}\n`;
                    });
                    text += `\n`;
                });
        }
    }

    return text;
}

/**
 * Generate simple org-mode report
 */
function generateSimpleOrgModeReport(allTasks, todayStr, mode) {
    mode = mode || 'weekly';
    const isDaily = mode === 'daily';
    const isProjects = mode === 'projects';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(today.getDate() + diffToMonday);
    const weekStartStr = getLocalDateString(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = getLocalDateString(weekEnd);

    let text = `#+TITLE: GTD ${isProjects ? 'Projects' : isDaily ? 'Daily' : 'Weekly'} Review\n`;
    text += `#+DATE: ${todayStr}\n`;
    text += `#+TIME: ${new Date().toLocaleTimeString()}\n`;
    if (!isDaily && !isProjects) text += `#+WEEK: ${weekStartStr} to ${weekEndStr}\n`;
    text += `\n`;

    if (!isProjects) {
    // EVENTS - filtered
    const events = allTasks.filter(task => {
        if (!task.isEvent) return false;
        if (isDaily) return task.dueDate === todayStr;
        return task.dueDate && task.dueDate >= weekStartStr && task.dueDate <= weekEndStr;
    });

    if (events.length > 0) {
        text += `* Events (${events.length})\n\n`;

        const eventsByDate = {};
        events.forEach(event => {
            if (!eventsByDate[event.dueDate]) eventsByDate[event.dueDate] = [];
            eventsByDate[event.dueDate].push(event);
        });

        Object.keys(eventsByDate).sort().forEach(date => {
            const eventsForDate = eventsByDate[date];
            text += `** ${date} (${eventsForDate.length})\n`;
            eventsForDate.forEach(event => {
                text += `- ${event.title || 'Untitled Event'}`;
                if (event.dueTime) text += ` <${event.dueDate} ${event.dueTime}>`;
                text += `\n`;
                if (event.notes) text += `  ${event.notes}\n`;
            });
            text += `\n`;
        });
    }

    // TASKS - filtered
    const dateGroups = {};
    const noDateTasks = [];

    allTasks.forEach(task => {
        if (task.isEvent) return;
        if (isDaily) {
            if (task.dueDate === todayStr) {
                if (!dateGroups[task.dueDate]) dateGroups[task.dueDate] = [];
                dateGroups[task.dueDate].push(task);
            }
        } else {
            if (!task.dueDate) {
                noDateTasks.push(task);
            } else {
                if (!dateGroups[task.dueDate]) dateGroups[task.dueDate] = [];
                dateGroups[task.dueDate].push(task);
            }
        }
    });

    text += isDaily ? `* Today's Tasks\n\n` : `* Tasks by Date\n\n`;

    if (!isDaily && noDateTasks.length > 0) {
        text += `** No Date (${noDateTasks.length})\n`;
        noDateTasks.forEach(task => {
            text += `- [ ] ${task.title || 'Untitled'}\n`;
            if (task.notes) text += `  ${task.notes}\n`;
        });
        text += `\n`;
    }

    Object.keys(dateGroups).sort().forEach(date => {
        const tasksForDate = dateGroups[date];
        if (isDaily) {
            tasksForDate.sort((a, b) => {
                if (!a.dueTime && !b.dueTime) return 0;
                if (!a.dueTime) return 1;
                if (!b.dueTime) return -1;
                return a.dueTime.localeCompare(b.dueTime);
            });
        }
        text += `** ${date} (${tasksForDate.length})\n`;
        tasksForDate.forEach(task => {
            const title = isDaily ? extractTagsAndCleanText(task.title || 'Untitled').cleanText : (task.title || 'Untitled');
            text += `- [ ] ${title}`;
            if (task.dueTime) text += ` <${task.dueDate} ${task.dueTime}>`;
            else if (task.dueDate) text += ` <${task.dueDate}>`;
            text += `\n`;
            if (task.notes) text += `  ${task.notes}\n`;
        });
        text += `\n`;
    });
    } // end if (!isProjects)

    // Projects (projects mode only)
    if (isProjects) {
        const templatedProjects = {};
        allTasks.forEach(task => {
            if (task.isEvent) return;
            const text_content = `${task.title || ''} ${task.notes || ''}`;
            const templates = TemplateProcessor.extractFromText(text_content);
            if (templates.length > 0) {
                templates.forEach(template => {
                    if (!templatedProjects[template]) templatedProjects[template] = [];
                    templatedProjects[template].push(task);
                });
            }
        });

        if (Object.keys(templatedProjects).length > 0) {
            text += `* Projects (Tasks with @templates)\n\n`;

            Object.entries(templatedProjects)
                .sort((a, b) => b[1].length - a[1].length)
                .forEach(([template, projectTasks]) => {
                    text += `** ${template} (${projectTasks.length} tasks)\n`;
                    projectTasks.forEach(task => {
                        text += `- [ ] ${task.title || 'Untitled'}`;
                        if (task.dueDate) text += ` <${task.dueDate}>`;
                        text += `\n`;
                        if (task.notes) text += `  ${task.notes}\n`;
                    });
                    text += `\n`;
                });
        }
    }

    return text;
}

/**
 * Generate review with only the selected formats
 */
function generateReviewWithSelectedFormats() {
    const htmlChecked = document.getElementById('modal-format-html').checked;
    const txtChecked = document.getElementById('modal-format-txt').checked;
    const pdfChecked = document.getElementById('modal-format-pdf').checked;
    const orgChecked = document.getElementById('modal-format-org').checked;
    
    if (!htmlChecked && !txtChecked && !pdfChecked && !orgChecked) {
        alert('Please select at least one export format!');
        return;
    }
    
    // Close the modal first
    closeReviewFormatModal();
    
    // Generate the review data
    const allTasks = tasks.filter(task => task.status !== 'deleted');
    
    if (allTasks.length === 0) {
        alert('No tasks to review!');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateString(today);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + 7);
    
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(today.getDate() + 6);
    
    // Group tasks by time periods (same logic as original function)
    const timeGroups = {
        today: [],
        tomorrow: [],
        thisWeek: [],
        nextWeek: [],
        future: [],
        noDate: [],
        events: []
    };
    
    allTasks.forEach(task => {
        if (task.isEvent) {
            timeGroups.events.push(task);
            return;
        }
        
        if (!task.dueDate) {
            timeGroups.noDate.push(task);
            return;
        }
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        if (task.dueDate === todayStr) {
            timeGroups.today.push(task);
        } else if (task.dueDate === tomorrowStr) {
            timeGroups.tomorrow.push(task);
        } else if (taskDate > tomorrow && taskDate <= thisWeekEnd) {
            timeGroups.thisWeek.push(task);
        } else if (taskDate > thisWeekEnd && taskDate < nextWeekStart) {
            timeGroups.nextWeek.push(task);
        } else if (taskDate >= nextWeekStart) {
            timeGroups.future.push(task);
        }
    });
    
    // Group tasks by projects (same logic as original function)
    const projectGroups = {};
    allTasks.forEach(task => {
        if (task.isEvent) return;
        
        const text = `${task.title || ''} ${task.notes || ''}`;
        const templates = TemplateProcessor.extractFromText(text);
        
        if (templates.length === 0) {
            if (!projectGroups['No Project']) {
                projectGroups['No Project'] = [];
            }
            projectGroups['No Project'].push(task);
        } else {
            templates.forEach(template => {
                if (!projectGroups[template]) {
                    projectGroups[template] = [];
                }
                projectGroups[template].push(task);
            });
        }
    });
    
    // Generate reports in selected formats
    let reportHTML = null;
    let plainText = null;
    let orgMode = null;
    
    // Store the format preferences in a temporary variable
    window.selectedReviewFormats = {
        html: htmlChecked,
        txt: txtChecked,
        pdf: pdfChecked,
        org: orgChecked
    };

    // Call the review function with the selected mode
    generateSimpleTasksReview(window.reviewMode || 'weekly')
}


/**
 * Download text file
 */
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * Open HTML report in new window
 */
function openHTMLReport(reportHTML, todayStr) {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GTD Weekly Review - ${todayStr}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        margin: 20px; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.5;
                        color: #333;
                    }
                    @media print {
                        body { margin: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align: center; margin-bottom: 20px;">
                    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">🖨️ Print/PDF</button>
                </div>
                ${reportHTML}
            </body>
            </html>
        `);
        newWindow.document.close();
    } else {
        alert('Please allow popups to view the report');
    }
}

/**
 * Open print-friendly report for PDF generation
 */
function openPrintableReport(reportHTML, todayStr) {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GTD Weekly Review - ${todayStr}</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        body { 
                            margin: 15mm; 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 12pt;
                            line-height: 1.4;
                            color: #333;
                        }
                        h1 { font-size: 18pt; margin-bottom: 20pt; }
                        h2 { font-size: 14pt; margin: 15pt 0 8pt 0; page-break-after: avoid; }
                        h3 { font-size: 12pt; margin: 10pt 0 5pt 0; }
                        ul { margin: 5pt 0; padding-left: 15pt; }
                        li { margin: 3pt 0; }
                    }
                    body { 
                        margin: 20px; 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.4;
                        color: #333;
                    }
                </style>
            </head>
            <body>
                ${reportHTML}
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        newWindow.document.close();
    } else {
        alert('Please allow popups to view the report');
    }
}

/**
 * Render tasks with selection support
 */
function renderTasksWithSelection(filteredTasks) {
    const container = document.getElementById('tasksContainer');
    
    if (!container) {
        console.error('allTasks container not found');
        return;
    }
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="no-tasks">
                <div class="no-tasks-illustration">🔍</div>
                <h3 class="no-tasks-title">No Results Found</h3>
                <p class="no-tasks-message">We couldn't find any tasks matching your search. Try different keywords or add a new task!</p>
                <button class="no-tasks-cta" onclick="openAddTaskModal()">
                    <span>➕</span>
                    <span>Add New Task</span>
                </button>
            </div>
        `;
        return;
    }
    
    // Group tasks by date
    const taskGroups = groupTasksByDate(filteredTasks);
    
    let html = '';
    for (const [dateKey, groupData] of Object.entries(taskGroups)) {
        const groupTasks = groupData.tasks;
        html += `
            <div class="task-group" id="group-${dateKey}">
                <h4 class="group-header">
                    <span class="group-icon">📁</span>
                    <span class="group-title">${getGroupTitle(dateKey)}</span>
                    <span class="group-count">(${groupTasks.length})</span>
                </h4>
                <div class="group-content">
                    ${groupTasks.map(task => renderTaskCard(task, true)).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Update bulk selection UI
    updateBulkSelectionUI();
}

/**
 * Bulk Task Entry Functions
 */

/**
 * Open bulk task entry modal
 */
function openTaskImportModal() {
    console.log('📥 Opening bulk task import modal');
    const modal = document.getElementById('taskImportModal');
    const textarea = document.getElementById('taskImportTextarea');
    
    if (modal && textarea) {
        modal.style.display = 'block';
        modal.style.zIndex = '2000'; // Ensure it's on top
        textarea.value = '';
        setTimeout(() => textarea.focus(), 100); // Delay focus slightly
    } else {
        console.error('❌ Task import modal or textarea not found');
    }
}

/**
 * Close bulk task entry modal
 */
function closeTaskImportModal(event) {
    console.log('❌ Closing bulk task import modal');
    const modal = document.getElementById('taskImportModal');
    
    // Only close if clicked on backdrop or close button
    if (!event || event.target === modal || event.target.closest('button[onclick*="closeTaskImportModal"]')) {
        if (modal) {
            modal.style.display = 'none';
            const textarea = document.getElementById('taskImportTextarea');
            if (textarea) {
                textarea.value = '';
            }
        }
    }
}

/**
 * Import tasks from textarea - one task per line
 */
function importTasksFromTextarea() {
    console.log('📝 Starting bulk task import');
    
    const textarea = document.getElementById('taskImportTextarea');
    const modal = document.getElementById('taskImportModal');
    
    // If textarea doesn't exist or modal is not visible, open the modal first
    if (!textarea || !modal || modal.style.display === 'none' || !modal.style.display) {
        console.log('🔄 Opening modal first (called from other button)');
        openTaskImportModal();
        return;
    }
    
    const text = textarea.value.trim();
    if (!text) {
        alert('Please enter some tasks to import');
        return;
    }
    
    // Split by lines and filter out empty lines
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (lines.length === 0) {
        alert('No valid tasks found to import');
        return;
    }
    
    console.log(`📋 Processing ${lines.length} task lines`);
    
    // Get today's date string
    const today = getLocalDateString(new Date());
    let importedCount = 0;
    
    // Create tasks
    lines.forEach((taskText, index) => {
        try {
            const newTask = {
                id: (Date.now() + index).toString(), // Unique ID as string
                title: taskText,
                notes: '',
                dueDate: today,
                dueTime: '', // Untimed - goes to "No Specific Time" section
                status: 'pending',
                isEvent: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Add to tasks array
            tasks.push(newTask);
            importedCount++;
            
            console.log(`✅ Created task ${index + 1}: "${taskText}"`);
        } catch (error) {
            console.error(`❌ Error creating task from line: "${taskText}"`, error);
        }
    });
    
    // Save tasks
    saveTasksToLocalStorage();
    
    // Upload directly (avoid syncAll which downloads first and can overwrite local changes)
    window.justModifiedTasks = true;
    if (typeof uploadAllTasks === 'function') {
        uploadAllTasks().then(() => {
            window.justModifiedTasks = false;
        }).catch(() => {
            window.justModifiedTasks = false;
        });
    }
    
    // Close modal and clear textarea
    textarea.value = '';
    closeTaskImportModal();
    
    // Refresh the current view to show new tasks
    renderCurrentView();
    
    // Show success message
    if (typeof showNotification === 'function') {
        showNotification(`✅ Imported ${importedCount} tasks to Today`, 'success');
    }
    
    console.log(`🎉 Successfully imported ${importedCount} tasks`);
}

/**
 * Bulk Selection Functions for All Tasks View
 */

// Track selected tasks
let selectedTaskIds = new Set();
// Make it globally accessible for other modules
window.selectedTaskIds = selectedTaskIds;

/**
 * Complete/Delete a task when checkbox is clicked in Today/Week/Month views
 */
function completeTask(taskId, event) {
    event.stopPropagation(); // Prevent task edit dialog
    
    console.log('✅ Completing/deleting task:', taskId);
    console.log('🔍 Total tasks in array:', tasks.length);
    
    // Find the task and mark it as deleted
    const taskIndex = tasks.findIndex(t => t.id == taskId); // Use == instead of === in case of type mismatch
    console.log('📍 Task index found:', taskIndex);
    
    if (taskIndex !== -1) {
        const taskBefore = { ...tasks[taskIndex] };
        console.log('📋 Task before deletion:', taskBefore);

        tasks[taskIndex].status = 'deleted';
        tasks[taskIndex].isDeleted = true;
        tasks[taskIndex].deletedAt = new Date().toISOString();
        tasks[taskIndex].updatedAt = new Date().toISOString();

        // Record action for undo
        if (typeof recordAction === 'function') {
            recordAction('complete', taskId, taskBefore.title, taskBefore, { ...tasks[taskIndex] });
        }

        console.log('📋 Task after deletion (tombstone):', tasks[taskIndex]);
        console.log('💾 Saving tasks...');

        // Save changes
        saveTasksToLocalStorage();

        // Upload directly (NOT syncAll which downloads first and overwrites the deletion)
        window.justModifiedTasks = true;
        if (typeof uploadAllTasks === 'function') {
            uploadAllTasks().then(() => {
                console.log('✅ Task deletion synced to server');
                window.justModifiedTasks = false;
            }).catch(err => {
                console.error('❌ Task deletion sync failed:', err);
                window.justModifiedTasks = false;
            });
        }
        
        console.log('🔄 Refreshing view...');
        // Refresh the current view
        renderCurrentView();
        
        // Show feedback
        if (typeof showNotification === 'function') {
            showNotification('Task completed', 'success');
        }
        
        console.log('✅ Task completion process finished');
    } else {
        console.error('❌ Task not found with ID:', taskId);
        console.log('🔍 Available task IDs:', tasks.map(t => ({ id: t.id, type: typeof t.id, title: t.title?.substring(0, 20) })));
    }
}

/**
 * Toggle individual task selection
 */
function toggleTaskSelection(taskId, event) {
    event.stopPropagation(); // Prevent task edit dialog
    
    console.log('🔄 Toggling selection for task ID:', taskId);
    
    if (selectedTaskIds.has(taskId)) {
        selectedTaskIds.delete(taskId);
        console.log('➖ Removed from selection. Current selection:', Array.from(selectedTaskIds));
    } else {
        selectedTaskIds.add(taskId);
        console.log('➕ Added to selection. Current selection:', Array.from(selectedTaskIds));
    }
    
    updateBulkSelectionUI();
}

/**
 * Update the bulk selection UI based on current selection
 */
function updateBulkSelectionUI() {
    const selectAllCheckbox = document.getElementById('selectAllTasks');
    const deleteButton = document.getElementById('deleteSelectedBtn');
    const taskCheckboxes = document.querySelectorAll('.task-selection-checkbox');
    
    // Update individual checkboxes
    taskCheckboxes.forEach(checkbox => {
        const taskId = checkbox.getAttribute('data-task-id');
        checkbox.checked = selectedTaskIds.has(taskId);
    });
    
    // Update select all checkbox state
    const totalVisible = taskCheckboxes.length;
    const selectedVisible = Array.from(taskCheckboxes).filter(cb => cb.checked).length;
    
    if (selectedVisible === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (selectedVisible === totalVisible) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
    }
    
    // Show/hide bulk action buttons and update count
    const delayDayBtn = document.getElementById('delaySelectedDayBtn');
    const delayWeekBtn = document.getElementById('delaySelectedWeekBtn');
    
    if (selectedTaskIds.size > 0) {
        deleteButton.style.display = 'inline-block';
        deleteButton.innerHTML = `🗑️ Delete (${selectedTaskIds.size})`;
        
        if (delayDayBtn) {
            delayDayBtn.style.display = 'inline-block';
            delayDayBtn.innerHTML = `📅 +1D (${selectedTaskIds.size})`;
        }
        
        if (delayWeekBtn) {
            delayWeekBtn.style.display = 'inline-block';
            delayWeekBtn.innerHTML = `📅 +1W (${selectedTaskIds.size})`;
        }
    } else {
        deleteButton.style.display = 'none';
        if (delayDayBtn) delayDayBtn.style.display = 'none';
        if (delayWeekBtn) delayWeekBtn.style.display = 'none';
    }
}

/**
 * Mobile Touch/Swipe Handling for Task Cards
 */

// Track touch state for swipe detection
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let swipeThreshold = 100; // minimum distance for swipe
let swipeTimeThreshold = 500; // maximum time for swipe (ms)

function handleTouchStart(event, taskId) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    
    // Don't prevent default to allow other interactions
}

function handleTouchMove(event, taskId) {
    if (!event.touches[0]) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
        event.preventDefault(); // Prevent scrolling when swiping horizontally
        
        const taskCard = event.currentTarget;
        
        // Visual feedback during swipe
        if (deltaX > 0) {
            // Swiping right - show right arrow and green background
            taskCard.style.transform = `translateX(${Math.min(deltaX * 0.3, 50)}px)`;
            taskCard.style.background = `linear-gradient(90deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.3) 100%)`;
        } else {
            // Swiping left - show date picker icon and blue background
            taskCard.style.transform = `translateX(${Math.max(deltaX * 0.3, -50)}px)`;
            taskCard.style.background = `linear-gradient(90deg, rgba(33, 150, 243, 0.3) 0%, rgba(33, 150, 243, 0.1) 100%)`;
        }
    }
}

function handleTouchEnd(event, taskId) {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    const taskCard = event.currentTarget;
    
    // Reset visual state
    taskCard.style.transform = '';
    taskCard.style.background = '';
    
    // Check if it's a valid swipe (horizontal, within time limit, sufficient distance)
    if (touchDuration < swipeTimeThreshold && 
        Math.abs(deltaX) > swipeThreshold && 
        Math.abs(deltaX) > Math.abs(deltaY)) {
        
        event.preventDefault();
        event.stopPropagation();
        
        if (deltaX > 0) {
            // Swipe right - move task to next day
            delayTask(taskId, 1, event);
            
            // Show feedback
            taskCard.style.background = 'linear-gradient(90deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%)';
            setTimeout(() => {
                taskCard.style.background = '';
            }, 1000);
            
        } else {
            // Swipe left - open date/time picker
            console.log('📱 Swipe left detected for task:', taskId);
            
            // Try to find the task
            const task = window.tasks?.find(t => t.id === taskId) || {};
            console.log('Found task:', task);
            
            // Create a temporary button element if not found
            const buttonElement = taskCard.querySelector('[onclick*="openIOSDateTimePicker"]') || taskCard;
            
            // Use the unified date/time modal (same as desktop)
            try {
                // Set the current task ID for the modal
                window.currentDateTimeTaskId = taskId;
                
                // Open the unified modal using the same function as desktop edit modal
                if (typeof populateDateTimeModal === 'function') {
                    populateDateTimeModal(task.dueDate || task.date || '', task.dueTime || task.time || '');
                    const modal = document.getElementById('dateTimeModal');
                    if (modal) {
                        modal.style.display = 'block';
                        console.log('📅 Opened unified date/time modal for task:', taskId);
                    }
                }
                
                // Show feedback
                taskCard.style.background = 'linear-gradient(90deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.1) 100%)';
                setTimeout(() => {
                    taskCard.style.background = '';
                }, 300);
            } catch (error) {
                console.error('❌ Error opening unified date modal:', error);
            }
        }
    }
}

/**
 * Update the date display in the Today view header
 */
function updateCurrentTodayDisplay() {
    console.log('🔍 DEBUG: updateCurrentTodayDisplay SECOND VERSION (line 3371) executing');
    const displayElement = document.getElementById('currentTodayDate');
    if (displayElement) {
        const options = {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        };
        const formattedDate = currentTodayDate.toLocaleDateString('en-US', options);
        displayElement.textContent = formattedDate;
    }
    
    // Update the TODAY header to show fire emoji only on actual current day
    console.log('🔍 DEBUG: About to call updateTodayHeader()');
    updateTodayHeader();
}

/**
 * Update the TODAY header based on whether we're viewing the actual current day
 */
function updateTodayHeader() {
    console.log('🔥 DEBUG: updateTodayHeader() function executing');
    const todayHeaderElement = document.querySelector('[data-translate="TODAY"]');
    console.log('🔥 DEBUG: todayHeaderElement found:', todayHeaderElement);
    
    if (todayHeaderElement) {
        const actualToday = new Date();
        const isActualToday = currentTodayDate.toDateString() === actualToday.toDateString();
        console.log('🔥 DEBUG: actualToday:', actualToday.toDateString());
        console.log('🔥 DEBUG: currentTodayDate:', currentTodayDate.toDateString());
        console.log('🔥 DEBUG: isActualToday:', isActualToday);
        
        if (isActualToday) {
            // Show fire emoji and TODAY text when viewing actual current day
            console.log('🔥 DEBUG: Setting TODAY label to show');
            todayHeaderElement.innerHTML = '🔥 TODAY';
            todayHeaderElement.style.display = 'block';
        } else {
            // Hide the header text when viewing other days (date shown in red box below)
            console.log('🔥 DEBUG: Hiding TODAY label');
            todayHeaderElement.innerHTML = '';
            todayHeaderElement.style.display = 'none';
        }
    } else {
        console.log('🔥 DEBUG: todayHeaderElement NOT FOUND!');
    }
}

/**
 * Render template filter buttons for Today view
 */
function renderTodayTemplateFilters(todayTasks) {
    const container = document.getElementById('todayTemplateFilters');
    if (!container) return;
    
    // Extract templates from ALL tasks for today (unfiltered) to show all available templates
    // This ensures all template buttons remain visible even when a filter is active
    const todayStr = getLocalDateString(new Date(currentTodayDate));
    const allTodayTasks = tasks.filter(task => {
        if (task.status === 'deleted') return false;
        if (task.isEvent) {
            const taskDate = new Date(task.dueDate);
            const endDate = task.endDate ? new Date(task.endDate) : taskDate;
            const today = new Date(currentTodayDate);
            return today >= taskDate && today <= endDate;
        } else {
            return task.dueDate === todayStr;
        }
    });
    
    const templatesInUse = new Set();
    allTodayTasks.forEach(task => {
        const text = `${task.title || ''} ${task.notes || ''}`;
        const templateMatches = text.match(/@\w+/g);
        if (templateMatches) {
            templateMatches.forEach(template => templatesInUse.add(template));
        }
    });
    
    if (templatesInUse.size === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Add toggle all time slots button first
    html += `<button onclick="toggleAllTimeSlots()" title="Toggle all time slots" style="
        background: #007AFF; 
        color: white; 
        border: 1px solid #007AFF; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-size: 11px; 
        cursor: pointer;
        margin-right: 8px;
    ">⏰ Toggle All</button>`;
    
    // Add template filter buttons
    Array.from(templatesInUse).sort().forEach(template => {
        const isActive = window.activeTodayTemplateFilter === template;
        const buttonClass = isActive ? 'filter-btn active' : 'filter-btn';
        const title = `Filter tasks by template: ${template}`;
        
        html += `<button class="${buttonClass}" onclick="filterTodayByTemplate('${template}')" title="${title}" style="
            background: ${isActive ? '#007bff' : 'transparent'}; 
            color: ${isActive ? 'white' : '#007bff'}; 
            border: 1px solid #007bff; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            cursor: pointer;
        ">${template}</button>`;
    });
    
    // Add clear filter button if filter is active
    if (window.activeTodayTemplateFilter) {
        html += `<button class="filter-btn filter-clear" onclick="clearTodayTemplateFilter()" title="Clear template filter" style="
            background: #dc3545; 
            color: white; 
            border: 1px solid #dc3545; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            cursor: pointer;
        ">✖ Clear</button>`;
    }
    
    // Add T keyboard shortcut indicator at the end
    html += `<span style="
        display: inline-block;
        background: #f0f0f0;
        color: #666;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        margin-left: 8px;
        border: 1px solid #ddd;
    " title="Press P to navigate templates">P</span>`;
    
    container.innerHTML = html;
}

/**
 * Fix bulk imported tasks with numeric IDs by converting them to strings
 */
function fixBulkTaskIds() {
    console.log('🔧 Fixing bulk task IDs...');
    
    let fixedCount = 0;
    tasks.forEach(task => {
        if (typeof task.id === 'number') {
            console.log(`🔄 Converting task ID from ${task.id} to "${task.id}"`);
            task.id = task.id.toString();
            fixedCount++;
        }
    });
    
    if (fixedCount > 0) {
        console.log(`✅ Fixed ${fixedCount} task IDs`);
        saveTasksToLocalStorage();
        
        // Sync with server if available
        if (typeof syncAll === 'function') {
            syncAll();
        }
        
        // Refresh current view
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
        
        alert(`Fixed ${fixedCount} task IDs. Edit modal should now work for all tasks.`);
    } else {
        console.log('ℹ️ No numeric IDs found to fix');
        alert('No task IDs need fixing. All tasks already have string IDs.');
    }
}

// Make function globally accessible
window.fixBulkTaskIds = fixBulkTaskIds;

/**
 * Basic renderTodayView function
 */
function renderTodayView() {
    
    // Update the date display
    updateCurrentTodayDisplay();
    
    const container = document.getElementById('todaySchedule');
    
    if (!container) {
        console.error('todaySchedule container not found');
        return;
    }
    
    const today = new Date(currentTodayDate);
    const todayStr = getLocalDateString(today);
    const actualTodayStr = getLocalDateString(new Date());
    
    // One-time migration: Convert all "completed" tasks to "deleted" (cleanup legacy status)
    let completedTasksMigrated = false;
    tasks.forEach(task => {
        if (task.status === 'completed') {
            console.log(`🔄 Converting legacy completed task to deleted: "${task.title}"`);
            task.status = 'deleted';
            task.deletedAt = task.updatedAt || new Date().toISOString();
            completedTasksMigrated = true;
        }
    });
    
    if (completedTasksMigrated) {
        console.log('💾 Migrated legacy completed tasks to deleted status');
        if (typeof saveTasks === 'function') saveTasks();
        if (typeof uploadAllTasks === 'function') uploadAllTasks();
    }

    // Auto-migrate overdue tasks to today (except Events)
    if (todayStr === actualTodayStr) { // Only do this when viewing actual today
        console.log(`🔍 Auto-migration check: Today is ${todayStr}, viewing ${todayStr}`);
        console.log(`📋 Total tasks in system: ${tasks.length}`);
        
        // Debug: Show all tasks with their key properties
        const allTasksDebug = tasks.map(task => ({
            title: task.title ? task.title.substring(0, 30) + '...' : 'No title',
            dueDate: task.dueDate,
            status: task.status,
            isEvent: task.isEvent,
            isDeleted: task.status === 'deleted'
        }));
        console.log('📋 All tasks in system:');
        console.table(allTasksDebug);
        
        let migrated = false;
        let overdueTasks = [];
        let skippedTasks = [];
        
        tasks.forEach(task => {
            // Debug each task's migration decision
            if (task.status === 'deleted') {
                skippedTasks.push({reason: 'deleted', title: task.title});
                return; // Skip deleted tasks
            }
            
            if (task.isEvent) {
                skippedTasks.push({reason: 'is_event', title: task.title, dueDate: task.dueDate});
                return; // Skip events - they stay on their dates
            }
            
            // Check for tasks from previous dates that are still pending
            if (task.dueDate && task.dueDate < todayStr && task.status === 'pending') {
                overdueTasks.push({
                    title: task.title,
                    dueDate: task.dueDate,
                    status: task.status,
                    isEvent: task.isEvent
                });
                console.log(`🔄 Auto-migrating overdue task: "${task.title}" from ${task.dueDate} to ${todayStr}`);
                task.dueDate = todayStr;
                migrated = true;
            } else if (task.dueDate && task.dueDate < todayStr) {
                skippedTasks.push({
                    reason: 'not_pending', 
                    title: task.title, 
                    dueDate: task.dueDate, 
                    status: task.status
                });
            }
        });
        
        console.log(`📊 Migration summary: Found ${overdueTasks.length} overdue tasks to migrate`);
        console.log(`⏭️ Skipped ${skippedTasks.length} tasks (not eligible for migration)`);
        
        if (overdueTasks.length > 0) {
            console.log('🔄 Tasks being migrated:');
            console.table(overdueTasks);
        }
        
        if (skippedTasks.length > 0) {
            console.log('⏭️ Tasks skipped during migration:');
            console.table(skippedTasks);
        }
        
        if (migrated) {
            console.log('💾 Saving migrated tasks...');
            // Save the changes
            if (typeof saveTasks === 'function') saveTasks();
            if (typeof uploadAllTasks === 'function') uploadAllTasks();
        } else {
            console.log('✅ No tasks needed migration');
        }
    } else {
        console.log(`⏭️ Skipping auto-migration: viewing ${todayStr}, but today is ${actualTodayStr}`);
    }
    
    // Get today's tasks (no need for overdue logic since we auto-migrate)
    let todayTasks = tasks.filter(task => {
        // Exclude deleted tasks
        if (task.status === 'deleted') return false;
        
        // Events should ONLY appear on their exact due date - no exceptions
        if (task.isEvent) {
            return task.dueDate === todayStr;
        }
        
        // Show regular tasks for this specific date only
        return task.dueDate === todayStr;
    });
    
    // Apply template filter if active
    if (window.activeTodayTemplateFilter) {
        todayTasks = todayTasks.filter(task => {
            const text = `${task.title || ''} ${task.notes || ''}`;
            return text.includes(window.activeTodayTemplateFilter);
        });
    }
    
    console.log('Today tasks found:', todayTasks.length);
    
    // Render template filter buttons first
    renderTodayTemplateFilters(todayTasks);
    
    
    if (todayTasks.length === 0) {
        // If we have an active template filter and no matches, check if there are tasks without the filter
        if (window.activeTodayTemplateFilter) {
            // Get all tasks for today without template filter
            const allTodayTasks = tasks.filter(task => {
                if (task.status === 'deleted') return false;
                
                if (task.isEvent) {
                    // Events can span multiple days, check if today is within range
                    const taskDate = new Date(task.dueDate);
                    const endDate = task.endDate ? new Date(task.endDate) : taskDate;
                    const today = new Date(currentTodayDate);
                    return today >= taskDate && today <= endDate;
                } else {
                    // Show regular tasks for this specific date only
                    return task.dueDate === todayStr;
                }
            });
            
            if (allTodayTasks.length > 0) {
                // There are tasks for this day, so clear the filter and show them
                console.log(`🔄 Auto-clearing template filter "${window.activeTodayTemplateFilter}" - no matches but ${allTodayTasks.length} tasks exist for ${todayStr}`);
                window.activeTodayTemplateFilter = null;
                
                // Re-run renderTodayView to show all tasks
                renderTodayView();
                return;
            }
        }
        
        const message = window.activeTodayTemplateFilter 
            ? `No tasks with template "${window.activeTodayTemplateFilter}" for ${todayStr}`
            : `No tasks for ${todayStr}`;
        
        container.innerHTML = `
            <div class="no-tasks-today">
                <span class="emoji">📅</span>
                <h3>${message}</h3>
                <p>Click the "+ Add Task" button to add a new task for today</p>
                <button class="btn btn-primary" onclick="openAddTaskModal('${todayStr}')" style="background: #ff6b35; border-color: #ff6b35;">+ Add Task for Today</button>
            </div>
        `;
        return;
    }
    
    // Separate events from regular tasks
    const eventTasks = todayTasks.filter(task => task.isEvent);
    const regularTasks = todayTasks.filter(task => !task.isEvent);
    
    // Group regular tasks by time
    const timedTasks = regularTasks.filter(task => task.dueTime);
    const untimedTasks = regularTasks.filter(task => !task.dueTime);
    
    // Sort timed tasks by time
    timedTasks.sort((a, b) => {
        return (a.dueTime || '').localeCompare(b.dueTime || '');
    });
    
    // Group by time slots
    const timeSlots = {};
    timedTasks.forEach(task => {
        const timeKey = task.dueTime;
        if (!timeSlots[timeKey]) {
            timeSlots[timeKey] = [];
        }
        timeSlots[timeKey].push(task);
    });
    
    let html = '<div class="today-tasks-grouped">';
    
    // Render events first (always at top)
    if (eventTasks.length > 0) {
        html += `
            <div class="time-block">
                <div class="time-block-header">🎯 Events</div>
                <div class="time-block-content">`;
        
        eventTasks.forEach(task => {
            html += renderTaskCard(task);
        });
        
        html += `
                </div>
            </div>`;
    }
    
    // Get current time for highlighting
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const isViewingToday = todayStr === getLocalDateString(new Date());
    const sortedTimes = Object.keys(timeSlots).sort();
    
    console.log('🕐 UI Current Time Indicator Debug:', {
        currentTime,
        isViewingToday,
        sortedTimes,
        lastTimeSlot: sortedTimes[sortedTimes.length - 1],
        isAfterAllSlots: currentTime > sortedTimes[sortedTimes.length - 1]
    });
    
    // Find the most relevant time slot for current time
    let currentTimeSlot = null;
    if (isViewingToday && sortedTimes.length > 0) {
        // Find the first slot that is >= current time (next upcoming slot)
        const upcomingSlot = sortedTimes.find(slot => slot >= currentTime);
        
        if (upcomingSlot) {
            // If there's an upcoming slot, use it
            currentTimeSlot = upcomingSlot;
            console.log(`🕐 Current time ${currentTime} -> highlighting upcoming slot: ${currentTimeSlot}`);
        } else {
            // If current time is after all slots, highlight the last slot
            currentTimeSlot = sortedTimes[sortedTimes.length - 1];
            console.log(`🕐 Current time ${currentTime} is after all slots -> highlighting last slot: ${currentTimeSlot}`);
        }
    }

    // Render time slots
    sortedTimes.forEach(time => {
        // Tasks are already filtered to exclude deleted ones, no sorting needed by status
        
        // Check if this is the current time slot
        const isCurrentTime = isViewingToday && time === currentTimeSlot;
            
        console.log(`🕐 Checking slot ${time}: isCurrentTime = ${isCurrentTime} (currentTimeSlot: ${currentTimeSlot})`);
        
        if (isCurrentTime) {
            console.log('🕐 ✅ HIGHLIGHTING current time slot:', time);
        }
        
        html += `
            <div class="time-block" 
                 data-time="${time}"
                 ondragover="handleTimeSlotDragOver(event)"
                 ondrop="handleTimeSlotDrop(event, '${time}')"
                 ondragenter="handleTimeSlotDragEnter(event)"
                 ondragleave="handleTimeSlotDragLeave(event)"
                 style="min-height: 60px; position: relative;">
                <div class="time-block-header ${isCurrentTime ? 'current-time' : ''}" onclick="toggleTimeBlock('${time}')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <span id="arrow-${time}" class="group-arrow">▼</span>
                    🕐 ${time}
                    ${isCurrentTime ? '<span style="margin-left: auto; font-size: 12px; padding-right: 8px;">← Current Time</span>' : ''}
                </div>
                <div class="time-block-content" id="content-${time}">`;
        
        timeSlots[time].forEach(task => {
            html += renderTaskCard(task);
        });
        
        html += `
                </div>
            </div>`;
    });
    
    // Render untimed tasks
    if (untimedTasks.length > 0) {
        // Check collapse state from localStorage
        const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
        const isCollapsed = collapseStates['untimed'] === true;
        console.log('🔄 ui.js - No Specific Time section - reading collapse state:', isCollapsed, 'from localStorage:', collapseStates);
        
        // Check if "No Specific Time" should be highlighted as current time
        // This only happens when viewing today AND there are no timed slots at all
        const isNoTimeCurrentTime = isViewingToday && sortedTimes.length === 0;
            
        console.log('🕐 No Time section check:', {
            isNoTimeCurrentTime,
            hasTimedSlots: sortedTimes.length > 0,
            currentTimeAfterLast: currentTime > sortedTimes[sortedTimes.length - 1],
            currentTimeBeforeFirst: currentTime < sortedTimes[0],
            firstSlot: sortedTimes[0],
            lastSlot: sortedTimes[sortedTimes.length - 1]
        });
        
        html += `
            <div class="time-block">
                <div class="time-block-header ${isNoTimeCurrentTime ? 'current-time' : ''}" onclick="toggleTimeBlock('untimed')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <span id="arrow-untimed" class="group-arrow" aria-expanded="${!isCollapsed}" aria-label="${isCollapsed ? 'Expand' : 'Collapse'} No Specific Time section">${isCollapsed ? '▶' : '▼'}</span>
                    📋 No Specific Time
                    ${isNoTimeCurrentTime ? '<span style="margin-left: auto; font-size: 12px; padding-right: 8px;">← Current Time</span>' : ''}
                </div>
                <div class="time-block-content" id="content-untimed" style="display: ${isCollapsed ? 'none' : 'block'};">`;
        
        untimedTasks.forEach(task => {
            html += renderTaskCard(task);
        });
        
        html += `
                </div>
            </div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Safe wrapper for week view rendering with timeout
 */
function safeRenderWeekView() {
    console.log('🔄 Starting safe week view render...');
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
        console.error('⏰ Week view rendering timed out');
        const grid = document.getElementById('weekGrid');
        const weekTitle = document.getElementById('currentWeek');
        
        if (grid && weekTitle) {
            grid.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Week view took too long to load.<br><button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007AFF; color: white; border: none; border-radius: 6px; cursor: pointer;">Refresh Page</button></div>';
            weekTitle.textContent = 'Week View (Error)';
        }
    }, 5000); // 5 second timeout
    
    try {
        renderWeekView();
        clearTimeout(timeoutId);
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error in safeRenderWeekView:', error);
        throw error;
    }
}

/**
 * Render Week View with calendar grid
 */
function renderWeekView() {
    console.log('📅 Starting renderWeekView()');
    
    try {
        const grid = document.getElementById('weekGrid');
        const weekTitle = document.getElementById('currentWeek');
        
        if (!grid || !weekTitle) {
            console.warn('❌ Week view elements not found:', { grid: !!grid, weekTitle: !!weekTitle });
            return;
        }
        
        console.log('✅ Week view elements found, proceeding...');
        
        // Simple Monday fallback function
        const getSimpleMonday = (date) => {
            const monday = new Date(date);
            const day = monday.getDay();
            const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
            monday.setDate(diff);
            return monday;
        };
        
        // Update the week display with error handling
        try {
            if (typeof updateCurrentWeekDisplay === 'function') {
                updateCurrentWeekDisplay();
            }
        } catch (error) {
            console.warn('⚠️ Error in updateCurrentWeekDisplay:', error);
        }
        
        // Get week range based on user preference with fallbacks
        let weekStart, weekEnd;
        try {
            if (DateUtils && DateUtils.getWeekRange) {
                const weekRange = DateUtils.getWeekRange(currentWeekDate);
                weekStart = weekRange.start;
                weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
            } else {
                // Fallback to simple Monday calculation
                weekStart = typeof getMonday === 'function' ? getMonday(currentWeekDate) : getSimpleMonday(currentWeekDate);
                weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
            }
        } catch (error) {
            console.warn('⚠️ Error getting week range, using fallback:', error);
            weekStart = getSimpleMonday(currentWeekDate);
            weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
        }
    
    const weekTasks = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = getLocalDateString(date);
        const dayTasks = (window.tasks || []).filter(task => {
            // Exclude deleted tasks
            if (task.status === 'deleted') return false;
            
            // Only show tasks for this specific date
            if (task.dueDate !== dateStr) return false;
            
            // Events always show at their original date
            if (task.isEvent) return true;
            
            // For regular tasks: hide both completed AND pending tasks from past dates
            // (pending tasks will appear in Today view as overdue)
            const taskDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            taskDate.setHours(0, 0, 0, 0);
            
            if (taskDate < today) {
                return false; // Hide all regular tasks from past dates
            }
            
            return true; // Show tasks for today and future dates
        });
        weekTasks.push(...dayTasks);
    }
    
        // Render template filter buttons with error handling
        try {
            if (typeof renderWeekTemplateFilters === 'function') {
                renderWeekTemplateFilters(weekTasks);
            }
        } catch (error) {
            console.warn('⚠️ Error in renderWeekTemplateFilters:', error);
        }
        
        // Set week title
        try {
            const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const year = weekStart.getFullYear();
            weekTitle.textContent = `${startStr} - ${endStr}, ${year}`;
        } catch (error) {
            console.warn('⚠️ Error setting week title:', error);
            weekTitle.textContent = 'Week View';
        }
    
    // Clear grid
    grid.innerHTML = '';
    
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    // Generate 7 days starting from week start preference
    const weekStartDay = DateUtils.getWeekStartDay ? DateUtils.getWeekStartDay() : 1;
    let dayNames;
    
    if (weekStartDay === 0) { // Sunday first
        dayNames = [
            typeof translateText === 'function' ? translateText('Sunday') : 'Sunday',
            typeof translateText === 'function' ? translateText('Monday') : 'Monday', 
            typeof translateText === 'function' ? translateText('Tuesday') : 'Tuesday', 
            typeof translateText === 'function' ? translateText('Wednesday') : 'Wednesday', 
            typeof translateText === 'function' ? translateText('Thursday') : 'Thursday', 
            typeof translateText === 'function' ? translateText('Friday') : 'Friday', 
            typeof translateText === 'function' ? translateText('Saturday') : 'Saturday'
        ];
    } else { // Monday first (default)
        dayNames = [
            typeof translateText === 'function' ? translateText('Monday') : 'Monday', 
            typeof translateText === 'function' ? translateText('Tuesday') : 'Tuesday', 
            typeof translateText === 'function' ? translateText('Wednesday') : 'Wednesday', 
            typeof translateText === 'function' ? translateText('Thursday') : 'Thursday', 
            typeof translateText === 'function' ? translateText('Friday') : 'Friday', 
            typeof translateText === 'function' ? translateText('Saturday') : 'Saturday', 
            typeof translateText === 'function' ? translateText('Sunday') : 'Sunday'
        ];
    }
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = getLocalDateString(date);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'week-day';
        dayElement.dataset.date = dateStr;
        
        // Add classes
        if (dateStr === todayStr) {
            dayElement.classList.add('today');
        }
        
        // Check for tasks on this date
        let dayTasks = typeof getTasksForDate === 'function' ? getTasksForDate(dateStr) : 
                        (window.tasks || []).filter(task => task.dueDate === dateStr && task.status !== 'deleted');
        
        
        // Apply template filter if active
        if (window.activeWeekTemplateFilter) {
            dayTasks = dayTasks.filter(task => {
                const text = `${task.title || ''} ${task.notes || ''}`;
                return text.includes(window.activeWeekTemplateFilter);
            });
        }
        
        if (dayTasks.length > 0) {
            dayElement.classList.add('has-tasks');
        }
        
        // Day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'week-day-header';
        
        const dayName = document.createElement('div');
        dayName.className = 'week-day-name';
        dayName.textContent = dayNames[i];
        dayName.style.cursor = 'pointer';
        dayName.style.textDecoration = 'underline';
        dayName.onclick = (event) => {
            event.stopPropagation();
            // Navigate to Today view for this date
            if (typeof selectedDate !== 'undefined') {
                selectedDate = dateStr;
            }
            currentTodayDate = new Date(date);
            showView('today', true); // preserveDate = true
            if (typeof renderTodayView === 'function') {
                renderTodayView(); // Refresh to show the selected date
            }
        };
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'week-day-number';
        dayNumber.textContent = date.getDate();
        
        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayNumber);
        dayElement.appendChild(dayHeader);
        
        // Sort day tasks: events first, then by time
        const sortedDayTasks = [...dayTasks].sort((a, b) => {
            // Prioritize events first
            if (a.isEvent !== b.isEvent) {
                return a.isEvent ? -1 : 1;
            }
            
            // Then sort by time if both have times
            if (a.dueTime && b.dueTime) {
                return a.dueTime.localeCompare(b.dueTime);
            }
            if (a.dueTime && !b.dueTime) return -1;
            if (!a.dueTime && b.dueTime) return 1;
            
            // Finally by creation date
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        console.log(`DEBUG: Week day ${dateStr}: rendering ${sortedDayTasks.length} sorted tasks`);
        
        // Add task items
        sortedDayTasks.forEach(task => {
            console.log(`DEBUG: Week day ${dateStr}: rendering task "${task.title}" (${task.id})`);
        });
        sortedDayTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = task.isEvent ? 'week-task-item event' : 'week-task-item';
            
            const titlePrefix = task.isEvent ? '🔴 ' : '';
            
            // Character limit for single-line display with ellipsis
            const maxChars = 30; // Reduced for single-line display
            let displayTitle = task.title;
            if (task.title.length > maxChars) {
                displayTitle = task.title.substring(0, maxChars) + '...';
            }
            
            taskElement.innerHTML = `${titlePrefix}${displayTitle}`;
            
            taskElement.dataset.taskId = task.id;
            taskElement.dataset.fullText = task.title;
            taskElement.title = task.title; // Native tooltip for full text
            taskElement.draggable = true;
            
            // Drag-aware click and drag events - prevents click interference with drag
            let weekTaskDragging = false;
            
            if (typeof handleDragStart === 'function') {
                taskElement.addEventListener('dragstart', (e) => {
                    weekTaskDragging = true;
                    handleDragStart(e);
                });
            }
            if (typeof handleDragEnd === 'function') {
                taskElement.addEventListener('dragend', (e) => {
                    handleDragEnd(e);
                    setTimeout(() => { weekTaskDragging = false; }, 10);
                });
            }
            
            taskElement.addEventListener('click', (e) => {
                if (!weekTaskDragging) {
                    e.stopPropagation();
                    if (typeof editTask === 'function') {
                        editTask(task.id);
                    }
                } else {
                    console.log('🚫 Skipping click handler - drag operation detected');
                }
            });
            
            dayElement.appendChild(taskElement);
            console.log(`DEBUG: Week day ${dateStr}: appended task "${task.title}" to dayElement`);
        });
        
        // Drop events
        console.log('🎯 Setting up drop zone for day:', dateStr);
        if (typeof handleDragOver === 'function') {
            console.log('🔧 Adding dragover listener to day:', dateStr);
            dayElement.addEventListener('dragover', handleDragOver);
        } else {
            console.warn('⚠️ handleDragOver not available for day:', dateStr);
        }
        if (typeof handleDrop === 'function') {
            console.log('🔧 Adding drop listener to day:', dateStr);
            dayElement.addEventListener('drop', handleDrop);
        } else {
            console.warn('⚠️ handleDrop not available for day:', dateStr);
        }
        if (typeof handleDragEnter === 'function') {
            dayElement.addEventListener('dragenter', handleDragEnter);
        }
        if (typeof handleDragLeave === 'function') {
            dayElement.addEventListener('dragleave', handleDragLeave);
        }
        
        // Click to add new task
        dayElement.addEventListener('click', (e) => {
            // Only trigger if clicking on empty space (not on a task)
            if (e.target === dayElement || e.target === dayHeader || e.target === dayName || e.target === dayNumber) {
                if (typeof openAddTaskModal === 'function') {
                    openAddTaskModal(dateStr);
                }
            }
        });
        
        grid.appendChild(dayElement);
    }
    
    
    // Ensure the current day has the day cursor, or find first day with tasks
    const currentDateISO = getLocalDateString(currentWeekDate);
    let currentDayElement = grid.querySelector(`.week-day[data-date="${currentDateISO}"]`);
    
    // If current day exists and has tasks, use it
    if (currentDayElement && currentDayElement.querySelectorAll('.week-task-item').length > 0) {
        if (!currentDayElement.classList.contains('day-cursor')) {
            // Remove any existing cursors
            grid.querySelectorAll('.day-cursor').forEach(el => {
                el.classList.remove('day-cursor');
            });
            // Add cursor to current day
            currentDayElement.classList.add('day-cursor');
        }
    } else {
        // Current day has no tasks, still show cursor on current day
        if (currentDayElement) {
            // Remove any existing cursors
            grid.querySelectorAll('.day-cursor').forEach(el => {
                el.classList.remove('day-cursor');
            });
            // Add cursor to current day even if no tasks
            currentDayElement.classList.add('day-cursor');
        }
    }
    
        // Update dynamic week statistics
        try {
            if (typeof updateWeekStats === 'function') {
                updateWeekStats();
            }
        } catch (error) {
            console.warn('⚠️ Error in updateWeekStats:', error);
        }
        
        console.log('✅ renderWeekView completed successfully');
        
    } catch (error) {
        console.error('❌ Critical error in renderWeekView:', error);
        
        // Fallback: Show basic week view
        const grid = document.getElementById('weekGrid');
        const weekTitle = document.getElementById('currentWeek');
        
        if (grid && weekTitle) {
            grid.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Week view temporarily unavailable.<br>Please try refreshing the page.</div>';
            weekTitle.textContent = 'Week View';
        }
    }
}

/**
 * Render All Tasks View
 */
function renderAllTasksView() {
    console.log('🔍 DEBUG: renderAllTasksView called');
    
    // Restore All Tasks UI elements (in case we're coming from Recent Actions)
    if (typeof restoreAllTasksUI === 'function') {
        restoreAllTasksUI();
    }
    
    // Don't call showView to avoid recursion - just perform the search
    if (typeof performAllTasksSearch === 'function') {
        console.log('🔍 DEBUG: About to call performAllTasksSearch');
        performAllTasksSearch();
    } else {
        console.log('🔍 DEBUG: performAllTasksSearch function not found!');
    }
}

/**
 * Render Lists View
 */
function loadListSections() {
    try {
        const saved = localStorage.getItem('gtd_list_sections');
        const loadedSections = saved ? JSON.parse(saved) : [];
        
        // Don't overwrite if window.listSections already has data from sync
        if (!window.listSections || window.listSections.length === 0) {
            window.listSections = loadedSections;
        } else {
            // Preserve existing collapsed states when reloading
            const currentStates = new Map();
            window.listSections.forEach(section => {
                currentStates.set(section.id, section.collapsed);
            });
            
            // Update with fresh data but keep collapsed states
            window.listSections = loadedSections.map(section => ({
                ...section,
                collapsed: currentStates.has(section.id) ? currentStates.get(section.id) : section.collapsed
            }));
        }
        
        console.log('📋 loadListSections - localStorage:', loadedSections.length, 'window:', window.listSections?.length || 0);
    } catch (error) {
        console.error('Error loading list sections:', error);
        window.listSections = window.listSections || [];
    }
}

function renderListsView() {
    loadListSections();
    console.log('📋 Lists view - listSections:', window.listSections);

    const container = document.getElementById('listsContainer');
    const emptyState = document.getElementById('noListSections');

    if (!container) {
        console.error('listsContainer not found');
        return;
    }
    if (!emptyState) {
        console.error('noListSections not found');
        return;
    }

    // Show skeleton loader while processing
    showSkeletonLoader('listsContainer', 4);

    // Process lists with small delay to show skeleton loader
    setTimeout(() => {
        const listSections = typeof window.listSections !== 'undefined' ? window.listSections : [];
        console.log('📋 Rendering', listSections.length, 'list sections');

        if (listSections.length === 0) {
            hideSkeletonLoader('listsContainer', '');
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
    
    // Use manual order if sections have been reordered, otherwise sort alphabetically
    const sortedSections = listSections.some(s => s.order !== undefined) ? 
        [...listSections].sort((a, b) => (a.order || 0) - (b.order || 0)) :
        [...listSections].sort((a, b) => a.name.localeCompare(b.name));
    
    let html = '';
    sortedSections.forEach((section, index) => {
        const isCollapsed = section.collapsed || false;
        html += `
            <div class="list-section" 
                 data-section-id="${section.id}" 
                 data-section-index="${index}"
                 draggable="true"
                 ondragstart="${typeof handleSectionDragStart === 'function' ? `handleSectionDragStart(event, ${index})` : 'return false'}"
                 ondragend="${typeof handleSectionDragEnd === 'function' ? 'handleSectionDragEnd(event)' : 'return false'}"
                 ondragover="${typeof handleSectionDragOver === 'function' ? 'handleSectionDragOver(event)' : 'return false'}"
                 ondrop="${typeof handleSectionDrop === 'function' ? `handleSectionDrop(event, ${index})` : 'return false'}">
                <div class="list-section-drag-handle">⋮⋮</div>
                <div class="list-section-header" onclick="${typeof toggleListSection === 'function' ? `toggleListSection('${section.id}')` : 'return false'}">
                    <div class="list-section-title">
                        <span>${isCollapsed ? '📁' : '📂'}</span>
                        ${section.name}
                    </div>
                    <div class="list-section-meta">
                        <span>${section.lists ? section.lists.length : 0} lists</span>
                        <div class="section-actions">
                            <button class="section-action-btn" onclick="event.stopPropagation(); ${typeof openCreateListModal === 'function' ? `openCreateListModal('${section.id}')` : 'return false'}" title="Add List">
                                + List
                            </button>
                            <button class="section-action-btn" onclick="event.stopPropagation(); ${typeof editListSection === 'function' ? `editListSection('${section.id}')` : 'return false'}" title="Edit Section">
                                ✏️
                            </button>
                            <button class="section-action-btn" onclick="event.stopPropagation(); ${typeof deleteListSection === 'function' ? `deleteListSection('${section.id}')` : 'return false'}" title="Delete Section">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
                <div class="list-section-content ${isCollapsed ? 'collapsed' : ''}">
                    ${renderListsInSection(section)}
                </div>
            </div>
        `;
        });

        hideSkeletonLoader('listsContainer', html);
    }, 100);
}

/**
 * Render lists within a section
 */
function renderListsInSection(section) {
    if (!section.lists || section.lists.length === 0) {
        return `
            <div class="empty-list-section">
                <div class="empty-icon">📋</div>
                <h4>No Lists Yet</h4>
                <p>Start organizing by creating your first list in this section!</p>
                <button class="add-list-btn" onclick="${typeof openCreateListModal === 'function' ? `openCreateListModal('${section.id}')` : 'return false'}">
                    <span>➕</span>
                    <span>Create First List</span>
                </button>
            </div>
        `;
    }
    
    let html = '';
    section.lists.forEach((list, index) => {
        const itemCount = list.items ? list.items.length : 0;
        const completedCount = list.items ? list.items.filter(item => item.completed).length : 0;
        
        html += `
            <div class="list-item" 
                 data-list-id="${list.id}" 
                 data-list-index="${index}"
                 data-section-id="${section.id}"
                 draggable="true"
                 ondragstart="${typeof handleListDragStart === 'function' ? `handleListDragStart(event, '${section.id}', ${index})` : 'return false'}"
                 ondragend="${typeof handleListDragEnd === 'function' ? 'handleListDragEnd(event)' : 'return false'}"
                 ondragover="${typeof handleListDragOver === 'function' ? 'handleListDragOver(event)' : 'return false'}"
                 ondrop="${typeof handleListDrop === 'function' ? `handleListDrop(event, '${section.id}', ${index})` : 'return false'}"
                 onclick="${typeof openListModal === 'function' ? `openListModal('${section.id}', '${list.id}')` : 'return false'}" 
                 style="cursor: pointer;">
                <div class="list-item-drag-handle">⋮⋮</div>
                <div class="list-item-content">
                    <div class="list-item-title">
                        ${list.name}
                        <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">
                            ${itemCount > 0 ? `${completedCount}/${itemCount} items` : 'No items'}
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="list-action-btn" onclick="event.stopPropagation(); ${typeof openListModal === 'function' ? `openListModal('${section.id}', '${list.id}')` : 'return false'}" title="Open List">
                            📋
                        </button>
                        <button class="list-action-btn" onclick="event.stopPropagation(); ${typeof editList === 'function' ? `editList('${section.id}', '${list.id}')` : 'return false'}" title="Edit List">
                            ✏️
                        </button>
                        <button class="list-action-btn" onclick="event.stopPropagation(); ${typeof moveListToSection === 'function' ? `moveListToSection('${section.id}', '${list.id}')` : 'return false'}" title="Move to Section">
                            📂
                        </button>
                        <button class="list-action-btn" onclick="event.stopPropagation(); ${typeof mergeListWithAnother === 'function' ? `mergeListWithAnother('${section.id}', '${list.id}')` : 'return false'}" title="Merge with Another List">
                            🔀
                        </button>
                        <button class="list-action-btn" onclick="event.stopPropagation(); ${typeof duplicateList === 'function' ? `duplicateList('${section.id}', '${list.id}')` : 'return false'}" title="Duplicate List">
                            📋
                        </button>
                        <button class="list-action-btn delete" onclick="event.stopPropagation(); ${typeof deleteList === 'function' ? `deleteList('${section.id}', '${list.id}')` : 'return false'}" title="Delete List">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

/**
 * Render Repeat View
 */
function renderRepeatView() {
    const container = document.getElementById('repeatTasksList');
    if (!container) return;
    
    console.log('Total tasks:', tasks.length);
    
    // Get all tasks with repeat settings (stable grouping by title)
    const seriesMap = {};
    const repeatTasks = tasks.filter(task => {
        const hasRepeat = (task.repeat && task.repeat !== 'none') || (task.repeatType && task.repeatType !== 'none');
        const isDeleted = task.isDeleted;
        return hasRepeat && !isDeleted;
    });
    
    console.log(`Found ${repeatTasks.length} repeat tasks out of ${tasks.length} total tasks`);
    
    repeatTasks.forEach((task, index) => {
        console.log(`Repeat task ${index + 1}: "${task.title}" - repeat: ${task.repeat}, repeatType: ${task.repeatType}`);
        
        const title = task.title;
        if (!seriesMap[title]) {
            seriesMap[title] = {
                title: title,
                tasks: [],
                representative: null,
                repeatType: null,
                seriesCount: 0
            };
        }
        seriesMap[title].tasks.push(task);
        console.log(`Added task "${title}" to series. Series now has ${seriesMap[title].tasks.length} tasks`);
    });
    
    console.log('Series found:', Object.keys(seriesMap).length);
    Object.keys(seriesMap).forEach(title => {
        console.log(`- Series "${title}": ${seriesMap[title].tasks.length} tasks`);
    });
    
    // Process each series to get stable representative data
    const seriesList = Object.values(seriesMap);
    const today = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];
    
    seriesList.forEach(series => {
        // Sort tasks to get consistent representative
        series.tasks.sort((a, b) => {
            const aDate = a.dueDate || '9999-12-31';
            const bDate = b.dueDate || '9999-12-31';
            const aIsUpcoming = aDate >= today;
            const bIsUpcoming = bDate >= today;
            
            if (aIsUpcoming && !bIsUpcoming) return -1;
            if (!aIsUpcoming && bIsUpcoming) return 1;
            return aDate.localeCompare(bDate);
        });
        // Set stable data
        series.representative = series.tasks[0];
        series.seriesCount = series.tasks.length;
        series.repeatType = (series.representative.repeat || series.representative.repeatType || 'unknown')
            .replace('weekly-3months', 'weekly')
            .replace('biweekly-6months', 'biweekly')
            .replace('annual-5years', 'yearly');
    });
    
    if (seriesList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #dee2e6;">
                <div style="font-size: 48px; margin-bottom: 15px;">🔄</div>
                <h4 style="color: #6c757d; margin-bottom: 10px;">No Recurring Tasks</h4>
                <p style="color: #868e96; margin: 0;">Add tasks with repeat settings to see them here.</p>
            </div>
        `;
        return;
    }
    
    // Group by repeat period for organized display
    const groupedByPeriod = {
        'daily': [],
        'weekly': [],
        'biweekly': [],
        'monthly': [],
        'yearly': [],
        'unknown': []
    };
    seriesList.forEach(series => {
        const period = series.repeatType;
        if (groupedByPeriod[period]) {
            groupedByPeriod[period].push(series);
        } else {
            groupedByPeriod['unknown'].push(series);
        }
    });
    
    // Sort each group alphabetically by title
    Object.values(groupedByPeriod).forEach(group => {
        group.sort((a, b) => a.title.localeCompare(b.title));
    });
    
    // Render grouped display
    let html = `
        <div style="background: transparent; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #e9ecef;">
                <h4 style="margin: 0; color: #495057; display: flex; align-items: center; justify-content: space-between;">
                    🔄 Recurring Tasks
                    <span style="font-size: 14px; color: #6c757d;">${seriesList.length} series</span>
                </h4>
            </div>
    `;
    
    const periodConfig = {
        'daily': { name: '📅 Daily', color: '#28a745' },
        'weekly': { name: '🗓️ Weekly', color: '#007bff' },
        'biweekly': { name: '📆 Bi-weekly', color: '#6f42c1' },
        'monthly': { name: '🗓️ Monthly', color: '#fd7e14' },
        'yearly': { name: '🎂 Yearly', color: '#dc3545' },
        'unknown': { name: '❓ Other', color: '#6c757d' }
    };
    
    Object.entries(groupedByPeriod).forEach(([period, seriesGroup]) => {
        if (seriesGroup.length === 0) return;
        
        const config = periodConfig[period];
        
        html += `
            <div style="border-bottom: 1px solid #f1f3f4;">
                <div style="background: ${config.color}; color: white; padding: 12px 16px; font-weight: 600; font-size: 14px;">
                    ${config.name} (${seriesGroup.length})
                </div>
                <div>
        `;
        seriesGroup.forEach(series => {
            html += `
                <div style="padding: 14px 16px; border-bottom: 1px solid #f8f9fa; display: flex; align-items: center; justify-content: space-between; background: transparent; transition: background 0.2s;" 
                     onmouseover="this.style.background='#f8f9fa'" 
                     onmouseout="this.style.background='white'">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; color: #333; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                            ${series.title}
                            ${series.seriesCount > 1 ? `<span style="color: #6c757d; font-size: 12px; font-weight: normal;">(${series.seriesCount} instances)</span>` : ''}
                        </div>
                        ${series.representative.notes ? `<div style="font-size: 13px; color: #6c757d; line-height: 1.3;">${series.representative.notes.substring(0, 80)}${series.representative.notes.length > 80 ? '...' : ''}</div>` : ''}
                    </div>
                    <div style="margin-left: 16px;">
                        <button onclick="deleteRepeatSeries('${series.representative.id}')" 
                                style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background 0.2s;"
                                onmouseover="this.style.background='#c82333'"
                                onmouseout="this.style.background='#dc3545'"
                                title="Delete this recurring task">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

/**
 * Delete recurring task series
 */
async function deleteRepeatSeries(taskId) {
    const representativeTask = tasks.find(t => t.id == taskId);
    if (!representativeTask) {
        console.log('❌ Task not found for deletion:', taskId);
        return;
    }
    
    const taskTitle = representativeTask.title;
    
    if (confirm(`Delete the recurring task "${taskTitle}"?\n\nThis will remove all instances of this recurring task.`)) {
        console.log(`🗑️ Deleting repeat series: "${taskTitle}"`);
        
        // Save state for undo
        if (typeof saveStateForUndo === 'function') {
            saveStateForUndo('delete repeat series');
        }
        
        // Find and remove all tasks with the same title
        const allTasksWithTitle = tasks.filter(task => task.title === taskTitle);
        console.log(`🗑️ Found ${allTasksWithTitle.length} tasks to delete`);
        
        // Remove all tasks with the same title
        tasks = tasks.filter(task => task.title !== taskTitle);
        
        // Save to localStorage and sync
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        window.justModifiedTasks = true;
        
        // Sync to server
        try {
            if (typeof uploadAllTasks === 'function') {
                await uploadAllTasks();
            }
            console.log(`✅ Successfully deleted ${allTasksWithTitle.length} repeat tasks`);
        } catch (error) {
            console.error('❌ Error syncing deleted repeat tasks:', error);
        }
        
        // Update all views
        renderRepeatView();
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
        }
        
        // Reset sync flag after delay
        setTimeout(() => { window.justModifiedTasks = false; }, 5000);
    }
}

// Make deleteRepeatSeries globally available
window.deleteRepeatSeries = deleteRepeatSeries;

/**
 * Render Settings View
 */
function renderSettingsView() {
    console.log('🔧 renderSettingsView called');
    if (typeof loadSettingsValues === 'function') {
        loadSettingsValues();
    }
}

/**
 * Render Calendar View
 */
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('currentMonth');
    
    if (!grid || !monthTitle) return;
    
    // Keep active template filter if it exists
    
    // Update the month display
    updateCurrentMonthDisplay();
    
    // Get all tasks for the month to populate template filters
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    console.log(`DEBUG: Month view ${year}-${month}: Total tasks available:`, (window.tasks || []).length);
    const monthTasks = (window.tasks || []).filter(task => {
        // Exclude deleted tasks or tasks without dates
        if (!task.dueDate || task.status === 'deleted') return false;
        
        const taskDate = new Date(task.dueDate);
        
        // Only show tasks for this month
        if (taskDate.getFullYear() !== year || taskDate.getMonth() !== month) return false;
        
        // Events always show at their original date
        if (task.isEvent) return true;
        
        // For regular tasks: hide both completed AND pending tasks from past dates
        // (pending tasks will appear in Today view as overdue)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDateOnly = new Date(task.dueDate);
        taskDateOnly.setHours(0, 0, 0, 0);
        
        if (taskDateOnly < today) {
            return false; // Hide all regular tasks from past dates
        }
        
        return true; // Show tasks for today and future dates
    });
    console.log(`DEBUG: Month view ${year}-${month}: Found ${monthTasks.length} tasks for month`);
    
    // Render template filter buttons
    renderMonthTemplateFilters(monthTasks);
    
    // Format month name with translations
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const translatedMonth = typeof translateText === 'function' ? translateText(monthNames[month]) : monthNames[month];
    monthTitle.textContent = `${translatedMonth} ${year}`;
    
    grid.innerHTML = '';
    
    // Day headers based on week start preference
    const weekStartDay = DateUtils.getWeekStartDay ? DateUtils.getWeekStartDay() : 1;
    let dayHeaders;
    
    if (weekStartDay === 0) { // Sunday first
        dayHeaders = [
            typeof translateText === 'function' ? translateText('Sunday').substring(0, 3) : 'Sun',
            typeof translateText === 'function' ? translateText('Monday').substring(0, 3) : 'Mon', 
            typeof translateText === 'function' ? translateText('Tuesday').substring(0, 3) : 'Tue', 
            typeof translateText === 'function' ? translateText('Wednesday').substring(0, 3) : 'Wed', 
            typeof translateText === 'function' ? translateText('Thursday').substring(0, 3) : 'Thu', 
            typeof translateText === 'function' ? translateText('Friday').substring(0, 3) : 'Fri', 
            typeof translateText === 'function' ? translateText('Saturday').substring(0, 3) : 'Sat'
        ];
    } else { // Monday first (default)
        dayHeaders = [
            typeof translateText === 'function' ? translateText('Monday').substring(0, 3) : 'Mon', 
            typeof translateText === 'function' ? translateText('Tuesday').substring(0, 3) : 'Tue', 
            typeof translateText === 'function' ? translateText('Wednesday').substring(0, 3) : 'Wed', 
            typeof translateText === 'function' ? translateText('Thursday').substring(0, 3) : 'Thu', 
            typeof translateText === 'function' ? translateText('Friday').substring(0, 3) : 'Fri', 
            typeof translateText === 'function' ? translateText('Saturday').substring(0, 3) : 'Sat', 
            typeof translateText === 'function' ? translateText('Sunday').substring(0, 3) : 'Sun'
        ];
    }
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Adjust start date based on week start preference
    const dayOfWeek = firstDay.getDay();
    let daysToSubtract;
    
    if (weekStartDay === 0) { // Sunday first
        daysToSubtract = dayOfWeek;
    } else { // Monday first
        daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    }
    
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = getLocalDateString(date);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.date = dateStr;
        
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        if (dateStr === todayStr) {
            dayElement.classList.add('today');
        }
        
        let dayTasks = typeof getTasksForDate === 'function' ? getTasksForDate(dateStr) : 
                        (window.tasks || []).filter(task => {
                            // Exclude deleted tasks
                            if (task.status === 'deleted') return false;
                            
                            // Only show tasks for this specific date
                            if (task.dueDate !== dateStr) return false;
                            
                            // Events always show at their original date
                            if (task.isEvent) return true;
                            
                            // For regular tasks: hide both completed AND pending tasks from past dates
                            // (pending tasks will appear in Today view as overdue)
                            const taskDate = new Date(dateStr);
                            const currentDate = new Date();
                            currentDate.setHours(0, 0, 0, 0);
                            taskDate.setHours(0, 0, 0, 0);
                            
                            if (taskDate < currentDate) {
                                return false; // Hide all regular tasks from past dates
                            }
                            
                            return true; // Show tasks for today and future dates
                        });
        
        // Apply template filter if active
        if (window.activeMonthTemplateFilter) {
            dayTasks = dayTasks.filter(task => {
                const text = `${task.title || ''} ${task.notes || ''}`;
                return text.includes(window.activeMonthTemplateFilter);
            });
        }
        
        if (dayTasks.length > 0) {
            dayElement.classList.add('has-tasks');
            
            // Highlight days with events (highest priority)
            const hasEvents = dayTasks.some(t => t.isEvent && t.status === 'pending');
            if (hasEvents) {
                dayElement.classList.add('has-events');
            } else {
                // Highlight days with overdue tasks (if no events)
                const hasOverdue = dayTasks.some(t => t.dueDate < todayStr && t.status === 'pending');
                if (hasOverdue) {
                    dayElement.classList.add('critical-tasks');
                }
            }
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = date.getDate();
        dayNumber.style.cursor = 'pointer';
        dayNumber.style.textDecoration = 'underline';
        dayNumber.onclick = (event) => {
            event.stopPropagation();
            // Navigate to Today view for this date
            if (typeof selectedDate !== 'undefined') {
                selectedDate = dateStr;
            }
            currentTodayDate = new Date(date);
            showView('today', true); // preserveDate = true
            if (typeof renderTodayView === 'function') {
                renderTodayView(); // Refresh to show the selected date
            }
        };
        dayElement.appendChild(dayNumber);
        
        // Make day clickable on blank space to open task creation modal
        dayElement.style.cursor = 'pointer';
        dayElement.onclick = (event) => {
            // Only trigger if clicking on empty space (not on day number or task)
            if (event.target === dayElement || (event.target.classList && !event.target.classList.contains('calendar-day-number') && !event.target.classList.contains('calendar-task-item'))) {
                if (typeof openAddTaskModal === 'function') {
                    openAddTaskModal(dateStr);
                }
            }
        };
        
        // Sort day tasks: events first, then by time, then by creation date
        const sortedDayTasks = [...dayTasks].sort((a, b) => {
            // Prioritize events first
            if (a.isEvent !== b.isEvent) {
                return a.isEvent ? -1 : 1;
            }
            
            // Then sort by time if both have times
            if (a.dueTime && b.dueTime) {
                return a.dueTime.localeCompare(b.dueTime);
            }
            if (a.dueTime && !b.dueTime) return -1;
            if (!a.dueTime && b.dueTime) return 1;
            
            // Finally by creation date
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Add task items (events will appear first)
        sortedDayTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = task.isEvent ? 'calendar-task-item event' : 'calendar-task-item';
            const titlePrefix = task.isEvent ? '🔴 ' : '';
            
            // Show more text with line breaks for better readability
            const maxChars = 25; // Increased from 13 to 25 characters
            let displayText = titlePrefix + task.title;
            
            if (task.title.length > maxChars) {
                displayText = titlePrefix + task.title.substring(0, maxChars) + '...';
            }
            
            taskElement.textContent = displayText;
            taskElement.dataset.taskId = task.id;
            taskElement.dataset.fullText = task.title; // Store full text for hover
            taskElement.title = task.title; // Native tooltip
            taskElement.draggable = true;
            
            console.log('🔧 Setting up drag and drop for calendar task:', task.title, 'draggable:', taskElement.draggable);
            
            // Check for CSS that might prevent dragging
            const computedStyle = window.getComputedStyle(taskElement);
            console.log('🎨 Task CSS check:', {
                draggable: taskElement.draggable,
                userSelect: computedStyle.userSelect,
                pointerEvents: computedStyle.pointerEvents,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex
            });
            
            // Add comprehensive mouse event debugging to track drag gesture
            let mouseDownTime = 0;
            let mouseDownPos = { x: 0, y: 0 };
            let mouseMoveCount = 0;
            
            taskElement.addEventListener('mousedown', (e) => {
                mouseDownTime = Date.now();
                mouseDownPos = { x: e.clientX, y: e.clientY };
                mouseMoveCount = 0;
                console.log('🖱️ MOUSEDOWN on task:', task.title, 'at', mouseDownPos, 'button:', e.button);
            });
            
            taskElement.addEventListener('mousemove', (e) => {
                if (mouseDownTime > 0) {
                    mouseMoveCount++;
                    const distance = Math.sqrt(
                        Math.pow(e.clientX - mouseDownPos.x, 2) + 
                        Math.pow(e.clientY - mouseDownPos.y, 2)
                    );
                    console.log('🖱️ MOUSEMOVE during potential drag:', task.title, 'distance:', distance, 'moveCount:', mouseMoveCount);
                    
                    // Check if we've moved enough to trigger a drag
                    if (distance > 5) {
                        console.log('🎯 SUFFICIENT MOVEMENT for drag detected:', distance, 'pixels');
                    }
                }
            });
            
            taskElement.addEventListener('mouseup', (e) => {
                const holdTime = Date.now() - mouseDownTime;
                const finalPos = { x: e.clientX, y: e.clientY };
                const totalDistance = Math.sqrt(
                    Math.pow(finalPos.x - mouseDownPos.x, 2) + 
                    Math.pow(finalPos.y - mouseDownPos.y, 2)
                );
                
                console.log('🖱️ MOUSEUP on task:', task.title, {
                    holdTime: holdTime + 'ms',
                    totalDistance: totalDistance + 'px',
                    mouseMoveEvents: mouseMoveCount,
                    startPos: mouseDownPos,
                    endPos: finalPos
                });
                
                mouseDownTime = 0;
            });
            
            if (typeof handleDragStart === 'function') {
                console.log('🔧 Adding dragstart listener to calendar task:', task.title);
                taskElement.addEventListener('dragstart', handleDragStart);
            } else {
                console.warn('⚠️ handleDragStart not available for calendar task:', task.title);
            }
            if (typeof handleDragEnd === 'function') {
                console.log('🔧 Adding dragend listener to calendar task:', task.title);
                taskElement.addEventListener('dragend', handleDragEnd);
            } else {
                console.warn('⚠️ handleDragEnd not available for calendar task:', task.title);
            }
            
            // Drag-aware click handler for calendar tasks
            let calendarTaskDragging = false;
            
            // Override the drag handlers to include our tracking
            if (typeof handleDragStart === 'function') {
                taskElement.removeEventListener('dragstart', handleDragStart);
                taskElement.addEventListener('dragstart', (e) => {
                    calendarTaskDragging = true;
                    console.log('🎯 CALENDAR DRAG START - setting dragging flag');
                    handleDragStart(e);
                });
            }
            if (typeof handleDragEnd === 'function') {
                taskElement.removeEventListener('dragend', handleDragEnd);
                taskElement.addEventListener('dragend', (e) => {
                    console.log('🎯 CALENDAR DRAG END - clearing dragging flag in 10ms');
                    handleDragEnd(e);
                    setTimeout(() => { calendarTaskDragging = false; }, 10);
                });
            }
            
            taskElement.addEventListener('click', (e) => {
                if (!calendarTaskDragging) {
                    e.stopPropagation();
                    if (typeof editTask === 'function') {
                        editTask(task.id);
                    }
                } else {
                    console.log('🚫 Skipping calendar click handler - drag operation detected');
                }
            });
            
            dayElement.appendChild(taskElement);
        });
        
        
        // Drop events
        console.log('🎯 Setting up drop zone for day:', dateStr);
        if (typeof handleDragOver === 'function') {
            console.log('🔧 Adding dragover listener to day:', dateStr);
            dayElement.addEventListener('dragover', handleDragOver);
        } else {
            console.warn('⚠️ handleDragOver not available for day:', dateStr);
        }
        if (typeof handleDrop === 'function') {
            console.log('🔧 Adding drop listener to day:', dateStr);
            dayElement.addEventListener('drop', handleDrop);
        } else {
            console.warn('⚠️ handleDrop not available for day:', dateStr);
        }
        if (typeof handleDragEnter === 'function') {
            dayElement.addEventListener('dragenter', handleDragEnter);
        }
        if (typeof handleDragLeave === 'function') {
            dayElement.addEventListener('dragleave', handleDragLeave);
        }
        
        grid.appendChild(dayElement);
    }
    
    
    // Update dynamic month statistics
    if (typeof updateMonthStats === 'function') {
        updateMonthStats(year, month);
    }
}

/**
 * Render Stats View
 */
function renderStats() {
    const total = tasks.length;
    const pending = total;
    
    const today = getLocalDateString();
    const todayTasks = tasks.filter(t => t.dueDate === today).length;
    const overdue = tasks.filter(t => 
        t.dueDate && t.dueDate < today && t.status === 'pending'
    ).length;
    const events = tasks.filter(t => t.isEvent && t.status === 'pending').length;
    
    // Update stats display elements if they exist
    const totalTasksEl = document.getElementById('totalTasks');
    // Note: No completed tasks since tasks are either pending or deleted
    const pendingTasksEl = document.getElementById('pendingTasks');
    const todayTasksEl = document.getElementById('todayTasks');
    const overdueTasksEl = document.getElementById('overdueTasks');
    const criticalTasksEl = document.getElementById('criticalTasks');
    
    if (totalTasksEl) totalTasksEl.textContent = total;
    // No completed tasks to display since we only have pending/deleted states
    if (pendingTasksEl) pendingTasksEl.textContent = pending;
    if (todayTasksEl) todayTasksEl.textContent = todayTasks;
    if (overdueTasksEl) overdueTasksEl.textContent = overdue;
    if (criticalTasksEl) criticalTasksEl.textContent = events;
    
    // Generate insights
    const insights = [];
    if (events > 0) {
        insights.push(`🔴 You have ${events} special event${events !== 1 ? 's' : ''} that must be done on their scheduled day${events !== 1 ? 's' : ''}!`);
    }
    if (overdue > 0) {
        insights.push(`⚠️ You have ${overdue} overdue task${overdue !== 1 ? 's' : ''}. Focus on these first!`);
    }
    if (todayTasks > 0) {
        insights.push(`🔥 ${todayTasks} task${todayTasks !== 1 ? 's' : ''} due today. You've got this!`);
    }
    // No completion percentage since tasks are either active or deleted
    if (insights.length === 0) {
        insights.push('🎉 You\'re all caught up! Time to add some new goals.');
    }
    
    const insightsEl = document.getElementById('productivityInsights');
    if (insightsEl) {
        insightsEl.innerHTML = insights
            .map(insight => `<div style="padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 10px;">${insight}</div>`)
            .join('');
    }
    
    // Update backup statistics
    if (typeof renderBackupStats === 'function') {
        renderBackupStats();
    }
}

/**
 * Initialize UI components
 */
function initializeUI() {
    // Initialize keyboard navigation
    initializeKeyboardNavigation();
    
    // Set up mobile navigation if present
    updateMobileNavigation();
    
    // Initialize with today view
    showView('today');
    
    console.log('✅ UI module initialized');
}

/**
 * Template button navigation - directly activate template buttons with T and arrows
 */
let templateNavActive = false;
let selectedButtonIndex = 0;
let templateButtons = [];

function activateTemplateSelector() {
    console.log('🏷️ T key pressed - entering template navigation mode');
    
    // T key behavior: Show ALL templates with navigation for any view
    // Works with Today, Week, Month views that have template filters
    try {
        // Determine which template container to use based on current view
        let templateContainer;
        if (window.currentView === 'today') {
            templateContainer = '#todayTemplateFilters';
        } else if (window.currentView === 'week') {
            templateContainer = '#weekTemplateFilters';
        } else if (window.currentView === 'calendar') {
            templateContainer = '#monthTemplateFilters';
        } else {
            // For views without template filters, switch to Today view
            console.log('📅 T key: Current view has no templates, switching to Today view (current view:', window.currentView, ')');
            showView('today');
            // Wait for view to render before proceeding
            setTimeout(() => {
                console.log('⏱️ View rendered, now activating template selector');
                activateTemplateSelector();
            }, 150);
            return;
        }
        
        // Get template filter buttons and Clear button from the appropriate container
        // This includes both .filter-btn (templates) and .filter-clear (Clear) buttons
        templateButtons = Array.from(document.querySelectorAll(`${templateContainer} button`))
            .filter(btn => {
                const text = btn.textContent.trim();
                // Include: template buttons, Clear button, exclude: Toggle All and T indicator
                return text !== '⏰ Toggle All' && text !== 'T';
            });
        console.log(`📋 Found navigable buttons in ${window.currentView} view (templates + Clear):`, templateButtons.length);
        
        // Log what buttons we found for debugging
        templateButtons.forEach((btn, index) => {
            const isClear = btn.classList.contains('filter-clear');
            console.log(`  ${index}: ${btn.textContent.trim()} ${isClear ? '(Clear)' : '(Template)'}`);
        });
        
        if (templateButtons.length === 0) {
            console.log('❌ No template filters available - template nav remains inactive');
            console.log('💡 No template filters available. Create templates using @tags in your tasks.');
            templateNavActive = false; // Ensure it stays false
            return;
        }
        
        // Activate first template filter button
        console.log('✅ Activating template filter navigation mode');
        templateNavActive = true;
        selectedButtonIndex = 0;
        
        // Highlight AND apply the first template filter
        highlightTemplateButton(0);
        clickTemplateButton(templateButtons[0]);
        
        // Show user feedback about template selection
        const templateName = templateButtons[0].textContent;
        console.log(`🎯 Template navigation active. Applied: ${templateName}. Use ← → arrows to navigate (includes Clear button), ESC to exit.`);
    } catch (error) {
        console.error('❌ Error in activateTemplateSelector:', error);
        templateNavActive = false; // Reset on error
    }
}

function clickTemplateButton(button) {
    const buttonText = button.textContent.trim();
    
    // Check if this is the Clear button
    if (button.classList.contains('filter-clear') || buttonText.includes('Clear')) {
        console.log('🔴 Arrow navigation activated Clear button - clearing template filter');
    } else {
        console.log('🔘 Arrow navigation activated template filter:', buttonText);
    }
    
    // Simulate click on the button (works for both template and clear buttons)
    button.click();
}

function highlightTemplateButton(index) {
    // Remove highlight from all buttons
    templateButtons.forEach(btn => {
        btn.style.outline = '';
        btn.style.backgroundColor = '';
        btn.style.boxShadow = '';
    });
    
    // Highlight selected button with stronger visual indication
    if (templateButtons[index]) {
        console.log('🎯 Highlighting template button at index:', index, 'Button text:', templateButtons[index].textContent);
        templateButtons[index].style.outline = '3px solid #007aff';
        templateButtons[index].style.backgroundColor = 'rgba(0, 122, 255, 0.2)';
        templateButtons[index].style.boxShadow = '0 0 10px rgba(0, 122, 255, 0.5)';
        
        // Don't scroll - keep all templates visible in view
        // templateButtons[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function navigateTemplateButtons(direction) {
    if (!templateNavActive || templateButtons.length === 0) return;
    
    const oldIndex = selectedButtonIndex;
    
    if (direction === 'left' && selectedButtonIndex > 0) {
        selectedButtonIndex--;
    } else if (direction === 'right' && selectedButtonIndex < templateButtons.length - 1) {
        selectedButtonIndex++;
    } else {
        // At boundary, show feedback
        const message = direction === 'left' ? 'Already at first template' : 'Already at last template';
        console.log(`🔄 ${message}`);
        return;
    }
    
    // Update highlighting and apply filter if we moved
    if (oldIndex !== selectedButtonIndex) {
        highlightTemplateButton(selectedButtonIndex);
        clickTemplateButton(templateButtons[selectedButtonIndex]);
        
        const templateName = templateButtons[selectedButtonIndex].textContent;
        console.log(`🎯 Applied template filter: ${templateName}`);
    }
    
    console.log('🔄 Navigated to template button', selectedButtonIndex, templateButtons[selectedButtonIndex]?.textContent);
}

function exitTemplateNavigation() {
    console.log('🚪 exitTemplateNavigation called, current state:', templateNavActive);
    
    if (!templateNavActive) {
        console.log('⚠️ Template nav was already inactive');
        // Still clear any lingering highlights as a safeguard
        clearAllTemplateHighlights();
        return;
    }
    
    console.log('✅ Deactivating template navigation mode');
    templateNavActive = false;
    selectedButtonIndex = 0;
    
    // Remove highlights from current template buttons
    templateButtons.forEach(btn => {
        try {
            btn.style.outline = '';
            btn.style.backgroundColor = '';
            btn.style.boxShadow = '';
        } catch (error) {
            console.error('Error removing highlight from button:', error);
        }
    });
    
    // Clear any lingering highlights as a safeguard
    clearAllTemplateHighlights();
    
    templateButtons = [];
    console.log('🏁 Template navigation fully exited');
}

function clearAllTemplateFilters() {
    console.log('🧹 D key pressed - clearing all template filters across all views');
    
    // Clear Today template filter
    if (window.activeTodayTemplateFilter) {
        console.log('🔄 Clearing Today template filter:', window.activeTodayTemplateFilter);
        window.activeTodayTemplateFilter = null;
    }
    
    // Clear Week template filter
    if (window.activeWeekTemplateFilter) {
        console.log('🔄 Clearing Week template filter:', window.activeWeekTemplateFilter);
        window.activeWeekTemplateFilter = null;
    }
    
    // Clear Month template filter
    if (window.activeMonthTemplateFilter) {
        console.log('🔄 Clearing Month template filter:', window.activeMonthTemplateFilter);
        window.activeMonthTemplateFilter = null;
    }
    
    // Clear All Tasks template filter if it exists
    if (window.activeAllTasksTemplateFilter) {
        console.log('🔄 Clearing All Tasks template filter:', window.activeAllTasksTemplateFilter);
        window.activeAllTasksTemplateFilter = null;
    }
    
    // Update app state if it exists
    if (window.appState) {
        const filters = { ...window.appState.get('filters') };
        filters.activeTodayTemplateFilter = null;
        filters.activeWeekTemplateFilter = null;
        filters.activeMonthTemplateFilter = null;
        filters.activeAllTasksTemplateFilter = null;
        window.appState.setState({ filters });
    }
    
    console.log('✅ All template filters cleared');
}

function clearAllTemplateHighlights() {
    // Safeguard function to clear any template button highlights that might be stuck
    // Exclude Toggle All button from clearing highlights
    const allTemplateButtons = Array.from(document.querySelectorAll('#todayTemplateFilters button'))
        .filter(btn => btn.textContent.trim() !== '⏰ Toggle All');
    allTemplateButtons.forEach(btn => {
        try {
            btn.style.outline = '';
            btn.style.backgroundColor = '';
            btn.style.boxShadow = '';
        } catch (error) {
            console.error('Error clearing highlight from button:', error);
        }
    });
}

// Make functions globally available
window.activateTemplateSelector = activateTemplateSelector;
window.exitTemplateNavigation = exitTemplateNavigation;
window.showView = showView;

// Add test function to window for debugging
window.testTemplateSelector = function() {
    console.log('🧪 Testing template button navigation...');
    activateTemplateSelector();
};

// List management functions  
async function toggleListSection(sectionId) {
    console.log('🔄 toggleListSection (ui.js) called with ID:', sectionId);
    console.log('📋 Available listSections:', window.listSections?.map(s => ({id: s.id, name: s.name, collapsed: s.collapsed})));
    
    if (!window.listSections) {
        console.error('❌ window.listSections is not defined!');
        return;
    }
    
    const section = window.listSections.find(s => s.id === sectionId);
    if (section) {
        console.log('📁 Found section:', section.name, 'current collapsed state:', section.collapsed);
        section.collapsed = !section.collapsed;
        console.log('📁 New collapsed state:', section.collapsed);
        
        if (typeof saveListSections === 'function') {
            console.log('💾 Calling saveListSections...');
            await saveListSections();
        } else {
            console.warn('⚠️ saveListSections function not available');
        }
        
        console.log('🎨 Calling renderListsView to update UI...');
        renderListsView();
    } else {
        console.error('❌ Section not found with ID:', sectionId);
        console.log('Available section IDs:', window.listSections.map(s => s.id));
    }
}

async function saveListSections() {
    try {
        localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
        console.log('💾 Saved list sections to localStorage');
    } catch (error) {
        console.error('Error saving list sections:', error);
    }
}

// Make functions globally available
window.toggleListSection = toggleListSection;
window.saveListSections = saveListSections;

// Export the updateTodayHeader function
window.updateTodayHeader = updateTodayHeader;

// Force mobile header update immediately when script loads
console.log('🚀 UI.js loaded - forcing mobile header update');
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            console.log('🔥 Force calling updateMobileDateHeader from ui.js');
            updateMobileDateHeader();
        }, 100);
    });
}