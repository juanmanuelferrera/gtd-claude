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
            if (typeof renderAllTasksView === 'function') {
                renderAllTasksView();
            } else if (typeof renderTasks === 'function') {
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
            // First, prioritize by completion status (pending first)
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }
            
            // Then prioritize events first within the same day
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
function renderTaskCard(task) {
    const isOverdue = window.isTaskOverdue ? window.isTaskOverdue(task) : (task.dueDate && task.dueDate < getLocalDateString() && task.status === 'pending');
    const isEvent = task.isEvent;
    let cardClass = `task-card ${task.status}`;
    
    if (isEvent) {
        cardClass += ' event';
    } else if (isOverdue) {
        cardClass += ' overdue';
    }
    
    const timeDisplay = task.dueTime ? ` at ${formatTime(task.dueTime)}` : '';
    
    return `
        <div class="${cardClass}" 
             onclick="editTask('${task.id}')" 
             data-task-id="${task.id}" 
             draggable="true"
             ondragstart="handleDragStart(event)"
             ondragend="handleDragEnd(event)"
             style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; min-height: 40px; cursor: move;">
            <div style="display: flex; align-items: center; flex: 1;">
                <div style="margin-right: 8px; color: #ccc; cursor: grab;">⋮⋮</div>
                <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                       onclick="toggleTaskStatus('${task.id}', event)" style="margin-right: 10px;">
                <div class="task-title" style="flex: 1;">
                    ${(task.repeat && task.repeat !== 'none') ? `<span class="repeat-badge" title="Recurring task: ${task.repeat}" style="background: #ffc107; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-right: 6px;">🔄</span>` : ''}
                    ${makeLinksClickable(extractTagsAndCleanText(task.title).cleanText)}
                    ${hasTaskTags(task) ? ` <span style="color: #999; font-size: 14px;">🏷️</span>` : ''}
                    ${isOverdue && !isEvent ? ' <span style="color: #dc3545; font-weight: bold;">OVERDUE</span>' : ''}
                    ${task.notes ? ` <span style="color: #666; font-size: 12px; margin-left: 8px;">📝</span>` : ''}
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
        container.innerHTML = '<div class="no-tasks"><p>📝 No tasks found for this view.</p></div>';
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
    
    container.innerHTML = html;
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
 * Perform search for all tasks view
 */
function performAllTasksSearch() {
    const searchInputElement = document.getElementById('allTasksSearchInput');
    
    // Get search term if input exists, otherwise show all tasks
    const searchTerm = searchInputElement ? searchInputElement.value.toLowerCase() : '';
    
    if (!Array.isArray(tasks)) {
        console.error('Tasks array not properly initialized');
        return;
    }
    
    let filteredTasks = tasks;
    
    // Apply search term filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => {
            const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
            const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
            const dateMatch = task.dueDate && task.dueDate.includes(searchTerm);
            const statusMatch = task.status && task.status.toLowerCase().includes(searchTerm);
            
            return titleMatch || notesMatch || dateMatch || statusMatch;
        });
        console.log('Search filtered tasks:', filteredTasks.length, 'found');
    }
    
    // Apply active template filter if exists
    if (activeAllTasksTemplateFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const text = `${task.title || ''} ${task.notes || ''}`;
            return text.toLowerCase().includes(activeAllTasksTemplateFilter.toLowerCase());
        });
        console.log('Template filtered tasks:', filteredTasks.length, 'found for template:', activeAllTasksTemplateFilter);
    }
    
    // Store filtered tasks for reference
    currentFilteredTasks = filteredTasks;
    
    renderTasksWithSelection(filteredTasks);
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
        container.innerHTML = '<div class="no-tasks"><p>📝 No tasks found matching your search criteria.</p></div>';
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
                    ${groupTasks.map(task => renderTaskCard(task)).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Update the date display in the Today view header
 */
function updateCurrentTodayDisplay() {
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
}

/**
 * Render template filter buttons for Today view
 */
function renderTodayTemplateFilters(todayTasks) {
    const container = document.getElementById('todayTemplateFilters');
    if (!container) return;
    
    // Extract templates from today's tasks
    const templatesInUse = new Set();
    todayTasks.forEach(task => {
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
    
    container.innerHTML = html;
}

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
    
    // Get today's tasks AND overdue tasks (only show overdue on current day)
    const isToday = todayStr === getLocalDateString(new Date());
    let todayTasks = tasks.filter(task => {
        // Exclude deleted tasks
        if (task.status === 'deleted') return false;
        
        // Show tasks for this specific date
        if (task.dueDate === todayStr) return true;
        
        // Only show overdue tasks if we're viewing TODAY (not past/future dates)
        if (isToday && task.dueDate && task.dueDate < todayStr && task.status === 'pending') {
            return true;
        }
        
        return false;
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
    
    // Sort timed tasks by status first (pending first, completed last), then by time
    timedTasks.sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'completed' ? 1 : -1;
        }
        return (a.dueTime || '').localeCompare(b.dueTime || '');
    });
    
    // Sort untimed tasks by status (pending first, completed last)
    untimedTasks.sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'completed' ? 1 : -1;
        }
        return 0;
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
        // Sort tasks within this time slot (pending first, completed last)
        timeSlots[time].sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }
            return 0;
        });
        
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
 * Render Week View with calendar grid
 */
function renderWeekView() {
    const grid = document.getElementById('weekGrid');
    const weekTitle = document.getElementById('currentWeek');
    
    if (!grid || !weekTitle) return;
    
    // Keep active template filter if it exists
    
    // Update the week display
    updateCurrentWeekDisplay();
    
    // Get week range based on user preference
    const weekRange = DateUtils.getWeekRange ? DateUtils.getWeekRange(currentWeekDate) : { start: getMonday(currentWeekDate), end: new Date() };
    const weekStart = weekRange.start;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
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
    
    // Render template filter buttons
    renderWeekTemplateFilters(weekTasks);
    
    // Set week title
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const year = weekStart.getFullYear();
    weekTitle.textContent = `${startStr} - ${endStr}, ${year}`;
    
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
            // First, prioritize by completion status (pending first)
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }
            
            // Then prioritize events first
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
            
            // Click and drag events
            taskElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof editTask === 'function') {
                    editTask(task.id);
                }
            });
            if (typeof handleDragStart === 'function') {
                taskElement.addEventListener('dragstart', handleDragStart);
            }
            if (typeof handleDragEnd === 'function') {
                taskElement.addEventListener('dragend', handleDragEnd);
            }
            
            dayElement.appendChild(taskElement);
            console.log(`DEBUG: Week day ${dateStr}: appended task "${task.title}" to dayElement`);
        });
        
        // Drop events
        if (typeof handleDragOver === 'function') {
            dayElement.addEventListener('dragover', handleDragOver);
        }
        if (typeof handleDrop === 'function') {
            dayElement.addEventListener('drop', handleDrop);
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
    if (typeof updateWeekStats === 'function') {
        updateWeekStats();
    }
}

/**
 * Render All Tasks View
 */
function renderAllTasksView() {
    // Don't call showView to avoid recursion - just perform the search
    if (typeof performAllTasksSearch === 'function') {
        performAllTasksSearch();
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
    
    const listSections = typeof window.listSections !== 'undefined' ? window.listSections : [];
    console.log('📋 Rendering', listSections.length, 'list sections');
    
    if (listSections.length === 0) {
        container.innerHTML = '';
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
    
    container.innerHTML = html;
}

/**
 * Render lists within a section
 */
function renderListsInSection(section) {
    if (!section.lists || section.lists.length === 0) {
        return `
            <div class="empty-list-section">
                <h4>📝 No Lists Yet</h4>
                <p>Create your first list in this section.</p>
                <button class="add-list-btn" onclick="${typeof openCreateListModal === 'function' ? `openCreateListModal('${section.id}')` : 'return false'}">
                    + Add First List
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
                        <button onclick="${typeof deleteRepeatSeries === 'function' ? `deleteRepeatSeries('${series.representative.id}')` : 'return false'}" 
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
            // First, prioritize by completion status (pending first)
            if (a.status !== b.status) {
                return a.status === 'completed' ? 1 : -1;
            }
            
            // Then prioritize events first
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
            
            if (typeof handleDragStart === 'function') {
                taskElement.addEventListener('dragstart', handleDragStart);
            }
            if (typeof handleDragEnd === 'function') {
                taskElement.addEventListener('dragend', handleDragEnd);
            }
            taskElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof editTask === 'function') {
                    editTask(task.id);
                }
            });
            
            dayElement.appendChild(taskElement);
        });
        
        
        // Drop events
        if (typeof handleDragOver === 'function') {
            dayElement.addEventListener('dragover', handleDragOver);
        }
        if (typeof handleDrop === 'function') {
            dayElement.addEventListener('drop', handleDrop);
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
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    
    const today = getLocalDateString();
    const todayTasks = tasks.filter(t => t.dueDate === today).length;
    const overdue = tasks.filter(t => 
        t.dueDate && t.dueDate < today && t.status === 'pending'
    ).length;
    const events = tasks.filter(t => t.isEvent && t.status === 'pending').length;
    
    // Update stats display elements if they exist
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const todayTasksEl = document.getElementById('todayTasks');
    const overdueTasksEl = document.getElementById('overdueTasks');
    const criticalTasksEl = document.getElementById('criticalTasks');
    
    if (totalTasksEl) totalTasksEl.textContent = total;
    if (completedTasksEl) completedTasksEl.textContent = completed;
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
    if (completed > 0 && total > 0) {
        const percentage = Math.round((completed / total) * 100);
        insights.push(`✅ You've completed ${percentage}% of your tasks. Great progress!`);
    }
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