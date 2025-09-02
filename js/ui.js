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
 * Show a specific view and update navigation
 */
function showView(viewName, preserveDate = false) {
    currentView = viewName;
    
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
        container.classList.remove('today-active', 'week-active', 'calendar-active', 'all-active', 'lists-active', 'repeat-active', 'undo-active', 'stats-active', 'settings-active');
        container.classList.add(`${viewName}-active`);
    }
    
    // Show/hide sections
    const views = {
        'today-view': viewName === 'today',
        'calendar-view': viewName === 'calendar',
        'week-view': viewName === 'week',
        'tasks-view': viewName === 'all',
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
            if (typeof renderWeekView === 'function') {
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
            if (typeof renderTasks === 'function') {
                renderTasks(viewName);
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
        'lists': { key: 'HeaderLists', emoji: '📝' }
    };
    
    const headerTitle = document.getElementById('mobileHeaderTitle');
    if (headerTitle) {
        const titleData = titles[viewName];
        if (titleData) {
            if (viewName === 'today') {
                if (typeof getCurrentTodayDate === 'function') {
                    const currentDate = getCurrentTodayDate();
                    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
                    const monthName = monthNames[currentDate.getMonth()];
                    headerTitle.innerHTML = `<span onclick="goToToday()" style="cursor: pointer; font-size: 18px; font-weight: bold;">${monthName}</span>`;
                }
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
 * Show loading state
 */
function showLoadingState() {
    // Find the currently visible view or default to today-view
    const currentViewId = currentView + '-view';
    const content = document.getElementById(currentViewId) || document.getElementById('today-view');
    
    if (content) {
        content.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 200px; flex-direction: column; color: #666;">
                <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                <div>Syncing...</div>
            </div>
        `;
    } else {
        console.warn('Could not find content element for loading state');
    }
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
            if (typeof renderWeekView === 'function') {
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

function goBack() {
    // Implement back navigation if needed
    // This can be expanded based on specific navigation requirements
    if (typeof history !== 'undefined' && history.length > 1) {
        history.back();
    }
}

function openSearchView() {
    showView('all');
    setTimeout(() => {
        const searchInput = document.getElementById('allTasksSearchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);
}

function openSettingsView() {
    showView('stats');
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
            const titles = {
                'today': '🔥 Today',
                'week': '📅 Week',
                'calendar': '🗓️ Month',
                'all': '🔍 All Tasks',
                'repeat': '🔄 Repeat',
                'lists': '📝 Lists',
                'stats': '📊 Stats',
                'settings': '⚙️ Settings',
                'search': '🔍 Search',
                'undo': '↩️ Undo'
            };
            
            headerTitle.textContent = titles[currentView] || currentView;
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
function getCurrentTodayDate() {
    return currentTodayDate || new Date();
}

function updateMobileDateHeader() {
    const headerTitle = document.getElementById('mobileHeaderTitle');
    if (headerTitle && currentView === 'today') {
        const currentDate = getCurrentTodayDate();
        const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const monthName = monthNames[currentDate.getMonth()];
        headerTitle.innerHTML = `<span onclick="goToToday()" style="cursor: pointer; font-size: 18px; font-weight: bold;">${monthName}</span>`;
    }
}

/**
 * Navigation date functions
 */
function goToToday() {
    currentTodayDate = new Date();
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
    if (typeof renderWeekView === 'function') {
        renderWeekView();
    }
}

function nextWeek() {
    currentWeekDate.setDate(currentWeekDate.getDate() + 7);
    if (typeof renderWeekView === 'function') {
        renderWeekView();
    }
}

/**
 * Day navigation functions
 */
function previousDay() {
    currentTodayDate.setDate(currentTodayDate.getDate() - 1);
    updateMobileDateHeader();
    if (typeof renderTodayView === 'function') {
        renderTodayView();
    }
}

function nextDay() {
    currentTodayDate.setDate(currentTodayDate.getDate() + 1);
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
 * Smart navigation functions that handle different view states
 */
function previousWeekSmart() {
    if (currentView === 'week') {
        previousWeek();
    } else {
        // Switch to week view first, then navigate
        showView('week');
        setTimeout(() => {
            previousWeek();
        }, 100);
    }
}

function nextWeekSmart() {
    if (currentView === 'week') {
        nextWeek();
    } else {
        // Switch to week view first, then navigate
        showView('week');
        setTimeout(() => {
            nextWeek();
        }, 100);
    }
}

function previousMonthSmart() {
    if (currentView === 'calendar') {
        previousMonth();
    } else {
        // Switch to calendar view first, then navigate
        showView('calendar');
        setTimeout(() => {
            previousMonth();
        }, 100);
    }
}

function nextMonthSmart() {
    if (currentView === 'calendar') {
        nextMonth();
    } else {
        // Switch to calendar view first, then navigate
        showView('calendar');
        setTimeout(() => {
            nextMonth();
        }, 100);
    }
}

/**
 * Display update functions
 */
function updateCurrentTodayDisplay() {
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

function showOptimisticFeedback(message, type = 'info', duration = 3000) {
    showInlineNotification(message, type);
}

/**
 * Keyboard navigation support
 */
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case '1':
                showView('today');
                break;
            case '2':
                showView('week');
                break;
            case '3':
                showView('calendar');
                break;
            case '4':
                showView('all');
                break;
            case '5':
                showView('lists');
                break;
            case '6':
                showView('repeat');
                break;
            case '/':
                e.preventDefault();
                showView('search');
                break;
            case 'Escape':
                // Close any open modals
                const openModals = document.querySelectorAll('[style*="display: block"]');
                openModals.forEach(modal => {
                    if (modal.id && modal.id.includes('Modal')) {
                        closeModal(modal.id);
                    }
                });
                break;
        }
    });
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