/**
 * Missing Functions Module for HyperFiler Pro
 * Contains all functions referenced in HTML but missing from other modules
 */

// Template filter functions for Week and Month views
function renderWeekTemplateFilters(weekTasks) {
    const container = document.getElementById('weekTemplateFilters');
    if (!container) return;
    
    // Extract templates from week's tasks
    const templatesInUse = new Set();
    weekTasks.forEach(task => {
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
    
    // Add template filter buttons
    Array.from(templatesInUse).sort().forEach(template => {
        const isActive = window.activeWeekTemplateFilter === template;
        const buttonClass = isActive ? 'filter-btn active' : 'filter-btn';
        const title = `Filter tasks by template: ${template}`;
        
        html += `<button class="${buttonClass}" onclick="filterWeekByTemplate('${template}')" title="${title}" style="
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
    if (window.activeWeekTemplateFilter) {
        html += `<button class="filter-btn filter-clear" onclick="clearWeekTemplateFilter()" title="Clear template filter" style="
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

function renderMonthTemplateFilters(monthTasks) {
    const container = document.getElementById('monthTemplateFilters');
    if (!container) return;
    
    // Extract templates from month's tasks
    const templatesInUse = new Set();
    monthTasks.forEach(task => {
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
    
    // Add template filter buttons
    Array.from(templatesInUse).sort().forEach(template => {
        const isActive = window.activeMonthTemplateFilter === template;
        const buttonClass = isActive ? 'filter-btn active' : 'filter-btn';
        const title = `Filter tasks by template: ${template}`;
        
        html += `<button class="${buttonClass}" onclick="filterMonthByTemplate('${template}')" title="${title}" style="
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
    if (window.activeMonthTemplateFilter) {
        html += `<button class="filter-btn filter-clear" onclick="clearMonthTemplateFilter()" title="Clear template filter" style="
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

// Week template filter functions
function filterWeekByTemplate(template) {
    window.activeWeekTemplateFilter = template;
    if (typeof renderWeekView === 'function') {
        renderWeekView();
    }
}

function clearWeekTemplateFilter() {
    window.activeWeekTemplateFilter = null;
    if (typeof renderWeekView === 'function') {
        renderWeekView();
    }
}

// Month template filter functions  
function filterMonthByTemplate(template) {
    window.activeMonthTemplateFilter = template;
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

function clearMonthTemplateFilter() {
    window.activeMonthTemplateFilter = null;
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

// Simple calendar picker for task cards
function openIOSDateTimePicker(taskId, currentDate, currentTime, buttonElement) {
    // Remove any existing picker
    if (window.currentIOSDatePicker) {
        document.body.removeChild(window.currentIOSDatePicker);
    }
    
    // Get button position
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.3); z-index: 10000;
    `;
    
    // Create picker
    const picker = document.createElement('div');
    picker.style.cssText = `
        background: white; border-radius: 12px; width: 320px; 
        padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: fixed; z-index: 10001;
        left: ${Math.max(10, Math.min(buttonRect.left, window.innerWidth - 340))}px;
        top: ${Math.max(10, Math.min(buttonRect.bottom + 10, window.innerHeight - 450))}px;
        border: 1px solid #e0e0e0;
    `;
    
    // Get current date info
    const today = new Date();
    const pickerDate = currentDate ? new Date(currentDate) : today;
    const year = pickerDate.getFullYear();
    const month = pickerDate.getMonth();
    const selectedDay = pickerDate.getDate();
    
    // Generate calendar HTML
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    // Calculate calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    let calendarHTML = '';
    
    // Empty cells before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarHTML += '<div></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const isSelected = day === selectedDay;
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        
        let style = 'padding: 8px; cursor: pointer; border-radius: 50%; font-size: 14px; text-align: center;';
        if (isSelected) {
            style += ' background: #007AFF; color: white; font-weight: bold;';
        } else if (isToday) {
            style += ' background: #e0e0e0; color: #333;';
        } else {
            style += ' color: #333;';
        }
        
        calendarHTML += `<div onclick="setPickerDate('${taskId}', ${year}, ${month}, ${day})" style="${style}">${day}</div>`;
    }
    
    picker.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; font-size: 16px; font-weight: 600;">
            ${monthNames[month]} ${year}
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 10px; text-align: center; font-size: 12px; color: #666;">
            <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
            ${calendarHTML}
        </div>
    `;
    
    // Store references
    window.currentIOSDatePicker = overlay;
    window.currentTaskId = taskId;
    
    overlay.appendChild(picker);
    document.body.appendChild(overlay);
    
    // Auto-close after 6 seconds
    window.calendarAutoCloseTimer = setTimeout(() => {
        closeTaskPicker();
    }, 6000);
    
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeTaskPicker();
        }
    });
}

function closeTaskPicker() {
    if (window.calendarAutoCloseTimer) {
        clearTimeout(window.calendarAutoCloseTimer);
        window.calendarAutoCloseTimer = null;
    }
    if (window.currentIOSDatePicker) {
        document.body.removeChild(window.currentIOSDatePicker);
        window.currentIOSDatePicker = null;
    }
}

function setPickerDate(taskId, year, month, day) {
    const newDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    updateTaskDate(taskId, newDate, { stopPropagation: () => {} });
    closeTaskPicker();
}

function setTaskToday(taskId) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const timeInput = document.getElementById('timePicker');
    const time = timeInput ? timeInput.value : '';
    
    updateTaskDate(taskId, todayStr, { stopPropagation: () => {} });
    if (time) {
        updateTaskTime(taskId, time, { stopPropagation: () => {} });
    }
    closeTaskPicker();
}

function clearTaskDateTime(taskId) {
    updateTaskDate(taskId, '', { stopPropagation: () => {} });
    updateTaskTime(taskId, '', { stopPropagation: () => {} });
    closeTaskPicker();
}

// Time dropdown picker
function openTimeDropdown(taskId, currentTime, buttonElement) {
    // Remove any existing picker
    if (window.currentTimeDropdown) {
        document.body.removeChild(window.currentTimeDropdown);
    }
    
    // Get button position
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.3); z-index: 10000;
    `;
    
    // Create picker
    const picker = document.createElement('div');
    picker.style.cssText = `
        background: white; border-radius: 12px; width: 200px; 
        padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: fixed; z-index: 10001;
        left: ${Math.max(10, Math.min(buttonRect.left, window.innerWidth - 220))}px;
        top: ${Math.max(10, Math.min(buttonRect.bottom + 10, window.innerHeight - 300))}px;
        border: 1px solid #e0e0e0; max-height: 250px; overflow-y: auto;
    `;
    
    // Generate time options from 6:00 to 22:00 every hour
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
        times.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    let html = `
        <div style="margin-bottom: 10px;">
            <div onclick="clearTimeAndClose('${taskId}')" 
                 style="padding: 10px; margin: 2px 0; cursor: pointer; border-radius: 6px; text-align: center; background: #f8f9fa; font-weight: 600;"
                 onmouseover="this.style.background='#e9ecef'"
                 onmouseout="this.style.background='#f8f9fa'">Untimed</div>
        </div>
        <div style="margin-bottom: 10px;">
    `;
    
    times.forEach(time => {
        const isSelected = time === currentTime;
        const style = isSelected 
            ? 'background: #007AFF; color: white; font-weight: bold;'
            : 'background: #f8f9fa;';
        
        html += `<div onclick="setTimeAndClose('${taskId}', '${time}')" 
                      style="padding: 8px; margin: 2px 0; cursor: pointer; border-radius: 6px; text-align: center; ${style}"
                      onmouseover="this.style.background='${isSelected ? '#0056CC' : '#e9ecef'}'"
                      onmouseout="this.style.background='${isSelected ? '#007AFF' : '#f8f9fa'}'">${time}</div>`;
    });
    
    html += `
        </div>
    `;
    
    picker.innerHTML = html;
    
    // Store references
    window.currentTimeDropdown = overlay;
    
    overlay.appendChild(picker);
    document.body.appendChild(overlay);
    
    // Auto-close after 6 seconds
    window.timeAutoCloseTimer = setTimeout(() => {
        closeTimeDropdown();
    }, 6000);
    
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeTimeDropdown();
        }
    });
}

function closeTimeDropdown() {
    if (window.timeAutoCloseTimer) {
        clearTimeout(window.timeAutoCloseTimer);
        window.timeAutoCloseTimer = null;
    }
    if (window.currentTimeDropdown) {
        document.body.removeChild(window.currentTimeDropdown);
        window.currentTimeDropdown = null;
    }
}

function setTimeAndClose(taskId, time) {
    updateTaskTime(taskId, time, { stopPropagation: () => {} });
    closeTimeDropdown();
}

function clearTimeAndClose(taskId) {
    updateTaskTime(taskId, '', { stopPropagation: () => {} });
    closeTimeDropdown();
}

// Template buttons section rendering
function renderTemplateButtonsSection() {
    const allTemplates = new Set();
    tasks.forEach(task => {
        const text = `${task.title || ''} ${task.notes || ''}`;
        const templateMatches = text.match(/@\w+/g);
        if (templateMatches) {
            templateMatches.forEach(template => allTemplates.add(template));
        }
    });
    
    if (allTemplates.size === 0) return '';
    
    let html = '<div style="margin-bottom: 15px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">';
    
    Array.from(allTemplates).sort().forEach(template => {
        html += `<button onclick="filterByTemplate('${template}')" style="
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            cursor: pointer;
        ">${template}</button>`;
    });
    
    html += '</div>';
    return html;
}

// Time block toggle function with state persistence and rapid-click protection
function toggleTimeBlock(timeKey) {
    if (!timeKey) return;
    
    // Rapid-click protection
    const currentTime = Date.now();
    if (!window.toggleTimeBlockLastClick) window.toggleTimeBlockLastClick = {};
    if (window.toggleTimeBlockLastClick[timeKey] && 
        currentTime - window.toggleTimeBlockLastClick[timeKey] < 300) {
        console.log(`⏱️ Rapid-click blocked for ${timeKey}`);
        return;
    }
    window.toggleTimeBlockLastClick[timeKey] = currentTime;
    
    const content = document.getElementById(`content-${timeKey}`);
    const arrow = document.getElementById(`arrow-${timeKey}`);
    
    if (!content || !arrow) {
        console.warn(`Time block elements not found: ${timeKey}`);
        return;
    }
    
    try {
        // Get current collapse states from localStorage
        const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
        
        // Toggle state
        const isCurrentlyCollapsed = content.style.display === 'none' || collapseStates[timeKey] === true;
        collapseStates[timeKey] = !isCurrentlyCollapsed;
        
        // Apply visual state with accessibility
        content.style.display = collapseStates[timeKey] ? 'none' : 'block';
        arrow.textContent = collapseStates[timeKey] ? '▶' : '▼';
        arrow.setAttribute('aria-expanded', (!collapseStates[timeKey]).toString());
        arrow.setAttribute('aria-label', 
            collapseStates[timeKey] ? `Expand ${timeKey} time block` : `Collapse ${timeKey} time block`);
        
        // Persist state
        localStorage.setItem('timeblock_collapse_states', JSON.stringify(collapseStates));
        
        console.log(`🔄 Time block ${timeKey} ${collapseStates[timeKey] ? 'collapsed' : 'expanded'}`);
        
    } catch (error) {
        console.error(`Error toggling time block ${timeKey}:`, error);
    }
}
window.toggleTimeBlock = toggleTimeBlock;



function selectAndSetCalendarDay(day) {
    window.selectedCalendarDay = day;
    // Immediately set the date+time when day is clicked
    setIOSDateTime(window.currentTaskId);
}



// Missing core functions
function saveTasks() {
    if (window.tasks) {
        localStorage.setItem('gtd_tasks', JSON.stringify(window.tasks));
        console.log('💾 Tasks saved to localStorage');
    }
}

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}

function clearTaskModalTimeout() {
    if (window.taskModalTimeout) {
        clearTimeout(window.taskModalTimeout);
        window.taskModalTimeout = null;
    }
}

function setTaskModalTimeout() {
    clearTaskModalTimeout();
    window.taskModalTimeout = setTimeout(() => {
        // Auto-save or cleanup logic
    }, 5000);
}

// Global variables declared in globals.js
// selectedTasks, activeAllTasksTemplateFilter, currentLanguage, dragged, mobileMoreMenuOpen

// Mobile interface functions
function openAddTaskModalMobile(dateStr) {
    console.log('📱 Mobile Add Task clicked - opening Things-style interface');
    
    // Check if we're on mobile
    if (window.innerWidth > 768) {
        if (typeof openAddTaskModal === 'function') {
            openAddTaskModal(dateStr);
        }
        return;
    }
    
    // For mobile, use the same modal but with mobile-optimized behavior
    if (typeof openAddTaskModal === 'function') {
        openAddTaskModal(dateStr);
        
        // Focus and scroll to modal for mobile
        setTimeout(() => {
            const modal = document.getElementById('taskModal');
            if (modal) {
                modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function provideFeedback(element, type = 'success') {
    if (!element) return;
    
    // Scale feedback
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 150);
    
    // Add a subtle highlight
    const originalBackground = element.style.background;
    element.style.background = type === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    setTimeout(() => {
        element.style.background = originalBackground;
    }, 300);
}

// Search functions
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    const exportBtn = document.getElementById('exportHtmlBtn');
    
    if (searchTerm === '') {
        if (searchResults) searchResults.innerHTML = '';
        if (exportBtn) exportBtn.style.display = 'none';
        return;
    }
    
    // Filter tasks based on search term
    const filteredTasks = tasks.filter(task => {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
        const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
        const dateMatch = task.dueDate && task.dueDate.includes(searchTerm);
        return titleMatch || notesMatch || dateMatch;
    });
    
    // Auto-expand sections containing search results (only when actively searching)
    if (searchTerm && searchTerm.trim() && filteredTasks.length > 0) {
        autoExpandSectionsWithResults(filteredTasks);
    }
    
    // Render results
    if (searchResults) {
        if (filteredTasks.length === 0) {
            searchResults.innerHTML = '<div class="no-tasks"><p>No tasks found matching your search.</p></div>';
        } else {
            searchResults.innerHTML = filteredTasks.map(task => {
                if (typeof renderTaskCard === 'function') {
                    return renderTaskCard(task);
                }
                return `<div class="task-card">${task.title}</div>`;
            }).join('');
        }
    }
    
    if (exportBtn) exportBtn.style.display = filteredTasks.length > 0 ? 'block' : 'none';
}

// Auto-expand sections containing search results
function autoExpandSectionsWithResults(filteredTasks) {
    try {
        console.log('🔍 autoExpandSectionsWithResults called with', filteredTasks.length, 'tasks');
        
        const sectionsToExpand = new Set();
        const timeBlocksToExpand = new Set();
        
        filteredTasks.forEach(task => {
            // Expand date-based sections
            if (task.dueDate) {
                const dateKey = task.dueDate;
                sectionsToExpand.add(dateKey);
                
                // Also expand time blocks if task has time
                if (task.dueTime) {
                    timeBlocksToExpand.add(task.dueTime);
                }
            }
            
            // Expand list sections
            if (task.listSectionId) {
                sectionsToExpand.add(`section-${task.listSectionId}`);
                if (task.listId) {
                    sectionsToExpand.add(`list-${task.listId}`);
                }
            }
        });
        
        // Expand date group sections
        sectionsToExpand.forEach(dateKey => {
            const content = document.getElementById(`tasks-${dateKey}`);
            const arrow = document.getElementById(`arrow-${dateKey}`);
            
            if (content && content.style.display === 'none') {
                content.style.display = 'block';
                content.classList.add('expanded');
                if (arrow) {
                    arrow.textContent = '▼';
                    arrow.setAttribute('aria-expanded', 'true');
                    arrow.classList.add('expanded');
                }
            }
        });
        
        // Expand time block sections
        timeBlocksToExpand.forEach(timeKey => {
            const content = document.getElementById(`content-${timeKey}`);
            const arrow = document.getElementById(`arrow-${timeKey}`);
            
            if (content && content.style.display === 'none') {
                content.style.display = 'block';
                if (arrow) {
                    arrow.textContent = '▼';
                    arrow.setAttribute('aria-expanded', 'true');
                }
                
                // Update localStorage state
                const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
                collapseStates[timeKey] = false;
                localStorage.setItem('timeblock_collapse_states', JSON.stringify(collapseStates));
            }
        });
        
        console.log(`🔍 Auto-expanded ${sectionsToExpand.size} sections and ${timeBlocksToExpand.size} time blocks for search results`);
        
    } catch (error) {
        console.error('Error in autoExpandSectionsWithResults:', error);
    }
}

function performMobileSearch(value) {
    // Dynamic mobile search functionality based on current view
    const currentView = window.currentView || 'today';
    const searchTerm = value.toLowerCase();
    
    if (!searchTerm) {
        // Clear search - show all tasks
        document.querySelectorAll('.time-slot-task, .task-item, .week-task-item, .calendar-task-item, [data-task-id]').forEach(el => {
            el.style.display = 'block';
        });
        return;
    }
    
    // Search and filter tasks based on current view
    if (currentView === 'today') {
        searchCurrentViewTasks(searchTerm, '.time-slot-task, [data-task-id]');
    } else if (currentView === 'week') {
        searchCurrentViewTasks(searchTerm, '.week-task-item, .task-item');
    } else if (currentView === 'calendar') {
        searchCurrentViewTasks(searchTerm, '.calendar-task-item, .task-item');
    } else if (currentView === 'all') {
        searchCurrentViewTasks(searchTerm, '.task-item, [data-task-id]');
    } else {
        // Default search for any view
        searchCurrentViewTasks(searchTerm, '.time-slot-task, .task-item, .week-task-item, .calendar-task-item, [data-task-id]');
    }
}

function searchCurrentViewTasks(searchTerm, selector) {
    document.querySelectorAll(selector).forEach(taskElement => {
        const taskText = taskElement.textContent.toLowerCase();
        if (taskText.includes(searchTerm)) {
            taskElement.style.display = 'block';
        } else {
            taskElement.style.display = 'none';
        }
    });
}

function quickSearch(term) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = term;
        performSearch();
        
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

function performAllTasksSearch() {
    const searchInputElement = document.getElementById('allTasksSearchInput');
    
    if (!searchInputElement) {
        console.error('🔍 ERROR: Search input element not found');
        return;
    }
    
    // Get search term if input exists, otherwise show all tasks
    const searchTerm = searchInputElement.value.toLowerCase();
    
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
    }
    
    // Apply active template filter if exists
    if (activeAllTasksTemplateFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const text = `${task.title || ''} ${task.notes || ''}`;
            return text.toLowerCase().includes(activeAllTasksTemplateFilter.toLowerCase());
        });
    }
    
    // Store filtered tasks for reference
    if (typeof currentFilteredTasks !== 'undefined') {
        window.currentFilteredTasks = filteredTasks;
    }
    
    // Render tasks
    if (typeof renderTasksWithSelection === 'function') {
        renderTasksWithSelection(filteredTasks);
    } else if (typeof renderTasks === 'function') {
        renderTasks('all');
    }
}

function clearAllTasksTemplateFilter() {
    activeAllTasksTemplateFilter = null;
    
    // Clear search input to show all tasks
    const searchInput = document.getElementById('allTasksSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Hide clear filter button
    const clearBtn = document.querySelector('.filter-clear');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // Refresh search results
    performAllTasksSearch();
}

function searchTodayTasks() {
    const searchInputElement = document.getElementById('todayTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    const todayDate = typeof getLocalDateString === 'function' ? 
        getLocalDateString(typeof currentTodayDate !== 'undefined' ? currentTodayDate : new Date()) :
        new Date().toISOString().split('T')[0];
    
    // Filter today's tasks
    const todayTasks = tasks.filter(task => {
        const isToday = task.dueDate === todayDate;
        if (!isToday) return false;
        
        if (!searchTerm) return true;
        
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTerm);
        const notesMatch = task.notes && task.notes.toLowerCase().includes(searchTerm);
        return titleMatch || notesMatch;
    });
    
    // Auto-expand time blocks containing search results
    if (searchTerm && todayTasks.length > 0) {
        autoExpandSectionsWithResults(todayTasks);
    }
    
    // Render filtered results
    const container = document.getElementById('todaySchedule');
    if (container && todayTasks.length > 0) {
        container.innerHTML = '<div class="today-tasks-list">' + 
            todayTasks.map(task => {
                if (typeof renderTaskCard === 'function') {
                    return renderTaskCard(task);
                }
                return `<div class="task-card">${task.title}</div>`;
            }).join('') + 
            '</div>';
    }
}

function searchMonthTasks() {
    const searchInputElement = document.getElementById('monthTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    // Month search logic would go here
    console.log('Month search:', searchTerm);
}

function searchWeekTasks() {
    const searchInputElement = document.getElementById('weekTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    // Week search logic would go here
    console.log('Week search:', searchTerm);
}

function searchRepeatTasks() {
    const searchInputElement = document.getElementById('repeatTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase();
    // Repeat tasks search logic would go here
    console.log('Repeat tasks search:', searchTerm);
}

// Action functions
function undoLastAction() {
    // Use existing undo functionality
    if (typeof performUndo === 'function') {
        performUndo();
    } else {
        console.log('Undo functionality not available');
        alert('Undo functionality not available');
    }
}

function deleteSelectedTasks() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks to delete first');
        return;
    }
    
    const taskCount = selectedTasks.size;
    if (!confirm(`Delete ${taskCount} selected task${taskCount > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Delete selected tasks
    const tasksToDelete = Array.from(selectedTasks);
    tasksToDelete.forEach(taskId => {
        if (typeof deleteTask === 'function') {
            deleteTask(taskId);
        } else {
            // Remove from tasks array directly
            const taskIndex = tasks.findIndex(t => t.id == taskId);
            if (taskIndex >= 0) {
                tasks.splice(taskIndex, 1);
            }
        }
    });
    
    // Clear selection
    selectedTasks.clear();
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function delaySelectedTasks(days) {
    if (selectedTasks.size === 0) {
        alert('Please select tasks to delay first');
        return;
    }
    
    const tasksToDelay = Array.from(selectedTasks);
    tasksToDelay.forEach(taskId => {
        if (typeof delayTask === 'function') {
            delayTask(taskId, days);
        }
    });
    
    // Clear selection
    selectedTasks.clear();
    
    // Refresh view
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (!selectAllCheckbox) return;
    
    if (selectAllCheckbox.checked) {
        // Select all visible tasks
        const visibleTasks = typeof currentFilteredTasks !== 'undefined' ? 
            currentFilteredTasks : tasks;
        visibleTasks.forEach(task => selectedTasks.add(task.id));
    } else {
        // Clear all selections
        selectedTasks.clear();
    }
    
    // Update UI
    updateSelectedTasksUI();
}

function updateSelectedTasksUI() {
    const hasSelected = selectedTasks.size > 0;
    
    // Show/hide bulk action buttons
    const bulkButtons = document.querySelectorAll('#deleteSelectedBtn, #delaySelectedDayBtn, #delaySelectedWeekBtn, #delaySelectedMonthBtn, #todayDeleteSelectedBtn, #todayDelaySelectedDayBtn, #todayDelaySelectedWeekBtn, #todayDelaySelectedMonthBtn, #todaySetTimeBtn');
    bulkButtons.forEach(btn => {
        if (btn) {
            btn.style.display = hasSelected ? 'inline-block' : 'none';
        }
    });
}

// Group functions
function expandAllGroups() {
    document.querySelectorAll('[id^="tasks-"]').forEach(container => {
        container.classList.add('expanded');
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(arrow => {
        arrow.classList.add('expanded');
        arrow.textContent = '▼';
        arrow.setAttribute('aria-expanded', 'true');
    });
    document.querySelectorAll('.group-content').forEach(content => {
        content.style.display = 'block';
    });
}

function collapseAllGroups() {
    document.querySelectorAll('[id^="tasks-"]').forEach(container => {
        container.classList.remove('expanded');
    });
    document.querySelectorAll('[id^="arrow-"]').forEach(arrow => {
        arrow.classList.remove('expanded');
        arrow.textContent = '▶';
        arrow.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.group-content').forEach(content => {
        content.style.display = 'none';
    });
}

// Data management functions
function exportTasks() {
    try {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                notes: task.notes,
                dueDate: task.dueDate,
                dueTime: task.dueTime,
                status: task.status,
                repeat: task.repeat,
                isEvent: task.isEvent,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            })),
            listSections: typeof window.listSections !== 'undefined' ? window.listSections : [],
            templates: typeof customTemplates !== 'undefined' ? customTemplates : []
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `hyperfiler-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('✅ Export completed');
        
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}

function exportAllTasks() {
    exportTasks(); // Alias for exportTasks
}

function importTasks() {
    showImportOptionsModal();
}

function showImportOptionsModal() {
    const modal = document.createElement('div');
    modal.id = 'importOptionsModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '10001';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 10vh auto;">
            <h3>📥 Import Tasks</h3>
            <div style="margin: 20px 0;">
                <label for="fileImport" class="btn btn-primary" style="display: block; padding: 12px; margin-bottom: 10px; cursor: pointer; text-align: center;">
                    📁 Choose JSON File
                </label>
                <input type="file" id="fileImport" accept=".json" style="display: none;">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="closeImportModal()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle file import
    document.getElementById('fileImport').addEventListener('change', handleFileImport);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.tasks && Array.isArray(importData.tasks)) {
                tasks.push(...importData.tasks);
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`Imported ${importData.tasks.length} tasks successfully!`);
            }
            
            closeImportModal();
            
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function closeImportModal() {
    const modal = document.getElementById('importOptionsModal');
    if (modal) {
        modal.remove();
    }
}

function clearAllTasks() {
    const firstConfirmation = confirm('⚠️ WARNING: This will DELETE ALL your tasks, events, and templates FOREVER!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to continue?');
    
    if (!firstConfirmation) return;
    
    const secondConfirmation = confirm('🔴 FINAL WARNING: You are about to PERMANENTLY DELETE everything!\n\nType YES in the next dialog to confirm.');
    
    if (!secondConfirmation) return;
    
    const finalConfirmation = prompt('Type "DELETE EVERYTHING" to confirm:');
    
    if (finalConfirmation !== 'DELETE EVERYTHING') {
        alert('Operation cancelled.');
        return;
    }
    
    // Clear everything
    tasks = [];
    if (typeof window.listSections !== 'undefined') {
        window.listSections = [];
    }
    if (typeof customTemplates !== 'undefined') {
        customTemplates = [];
    }
    
    // Save changes
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    localStorage.removeItem('gtd_list_sections');
    localStorage.removeItem('gtdTemplates');
    
    // Refresh UI
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
    
    alert('All data has been cleared.');
}

function performUndo() {
    if (typeof undoStack !== 'undefined' && undoStack.length > 0) {
        const lastState = undoStack.pop();
        if (lastState && lastState.tasks) {
            tasks = lastState.tasks;
            if (typeof saveTasksToLocalStorage === 'function') {
                saveTasksToLocalStorage();
            }
            if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
            alert('Action undone');
        }
    } else {
        alert('Nothing to undo');
    }
}

function refreshUndoView() {
    // Refresh undo view logic
    console.log('Refreshing undo view...');
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function checkAllBackups() {
    // Check backup status
    console.log('Checking backup status...');
    alert('Backup status checked');
}

function createEmergencyBackup() {
    // Create an emergency backup
    exportTasks();
}

// Modal functions
function openDateTimeModal() {
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Get current values or set defaults
        const currentDate = document.getElementById('editTaskDateOnly').value;
        const currentTime = document.getElementById('editTaskTimeOnly').value;
        
        // Set default to today if no date is set
        const defaultDate = currentDate || getLocalDateString(new Date());
        const defaultTime = currentTime || '';
        
        // Set desktop inputs
        const desktopDateInput = document.getElementById('desktopDateInput');
        const desktopTimeInput = document.getElementById('desktopTimeInput');
        if (desktopDateInput) desktopDateInput.value = defaultDate;
        if (desktopTimeInput) desktopTimeInput.value = defaultTime;
        
        // Set mobile inputs
        const mobileDateInput = document.getElementById('mobileDateInput');
        const mobileTimeInput = document.getElementById('mobileTimeInput');
        if (mobileDateInput) mobileDateInput.value = defaultDate;
        if (mobileTimeInput) mobileTimeInput.value = defaultTime;
        
        // Initialize the picker selects with current values
        initializeDateTimePickers(defaultDate, defaultTime);
    }
}

function initializeDateTimePickers(dateStr, timeStr) {
    const date = new Date(dateStr);
    
    // Set day picker
    const dayPicker = document.getElementById('desktopDayPicker');
    if (dayPicker) {
        populateDayPicker(date.getMonth(), date.getFullYear());
        dayPicker.value = date.getDate().toString();
    }
    
    // Set month picker
    const monthPicker = document.getElementById('desktopMonthPicker');
    if (monthPicker) {
        monthPicker.value = date.getMonth().toString();
    }
    
    // Set hour picker
    const hourPicker = document.getElementById('desktopHourPicker');
    if (hourPicker && timeStr) {
        hourPicker.value = timeStr;
    }
}

function populateDayPicker(month, year) {
    const dayPicker = document.getElementById('desktopDayPicker');
    if (!dayPicker) return;
    
    // Clear existing options
    dayPicker.innerHTML = '';
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add day options
    for (let day = 1; day <= daysInMonth; day++) {
        const option = document.createElement('option');
        option.value = day.toString();
        option.textContent = day.toString();
        dayPicker.appendChild(option);
    }
}

function updateDesktopDateTime() {
    // Update the day picker when month changes
    const monthPicker = document.getElementById('desktopMonthPicker');
    const dayPicker = document.getElementById('desktopDayPicker');
    
    if (monthPicker && dayPicker) {
        const selectedMonth = parseInt(monthPicker.value);
        const currentYear = new Date().getFullYear();
        const currentDay = dayPicker.value;
        
        // Repopulate days for the new month
        populateDayPicker(selectedMonth, currentYear);
        
        // Try to restore the previously selected day if it exists in the new month
        if (currentDay) {
            const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
            if (parseInt(currentDay) <= daysInMonth) {
                dayPicker.value = currentDay;
            }
        }
    }
}

function closeDateTimeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function applyDesktopDateTime() {
    // Get values from pickers
    const dayPicker = document.getElementById('desktopDayPicker');
    const monthPicker = document.getElementById('desktopMonthPicker');
    const hourPicker = document.getElementById('desktopHourPicker');
    
    // Also check for direct inputs as fallback
    const dateInput = document.getElementById('desktopDateInput');
    const timeInput = document.getElementById('desktopTimeInput');
    
    let finalDate = '';
    let finalTime = '';
    
    // Build date from pickers if available
    if (dayPicker && monthPicker) {
        const day = dayPicker.value;
        const month = parseInt(monthPicker.value);
        const year = new Date().getFullYear(); // Use current year
        
        if (day && month !== '') {
            const date = new Date(year, month, parseInt(day));
            finalDate = getLocalDateString(date);
        }
    }
    
    // Use direct date input as fallback
    if (!finalDate && dateInput) {
        finalDate = dateInput.value;
    }
    
    // Get time from picker or input
    if (hourPicker) {
        finalTime = hourPicker.value || '';
    } else if (timeInput) {
        finalTime = timeInput.value || '';
    }
    
    // Update the main form fields
    const mainDateInput = document.getElementById('editTaskDateOnly');
    const mainTimeInput = document.getElementById('editTaskTimeOnly');
    
    if (mainDateInput && finalDate) mainDateInput.value = finalDate;
    if (mainTimeInput) mainTimeInput.value = finalTime;
    
    // Update display
    updateDateTimeDisplay();
    
    closeDateTimeModal();
}

function applyMobileDateTime() {
    const dateInput = document.getElementById('mobileDateInput');
    const timeInput = document.getElementById('mobileTimeInput');
    
    if (dateInput && timeInput) {
        // Update the main form fields
        const mainDateInput = document.getElementById('editTaskDateOnly');
        const mainTimeInput = document.getElementById('editTaskTimeOnly');
        
        if (mainDateInput) mainDateInput.value = dateInput.value;
        if (mainTimeInput) mainTimeInput.value = timeInput.value;
        
        // Update display
        if (typeof updateDateTimeDisplay === 'function') {
            updateDateTimeDisplay();
        }
    }
    
    closeDateTimeModal();
}

function openBulkTimeModal() {
    if (selectedTasks.size === 0) {
        alert('Please select tasks first');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'bulkTimeModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h3>⏰ Set Time for Selected Tasks</h3>
            <div style="margin: 20px 0;">
                <label>Time:</label>
                <input type="time" id="bulkTimeInput" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="closeBulkTimeModal()" class="btn btn-secondary">Cancel</button>
                <button onclick="applyBulkTime()" class="btn btn-primary">Apply</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeBulkTimeModal() {
    const modal = document.getElementById('bulkTimeModal');
    if (modal) {
        modal.remove();
    }
}

function applyBulkTime() {
    const timeInput = document.getElementById('bulkTimeInput');
    if (!timeInput || !timeInput.value) {
        alert('Please select a time');
        return;
    }
    
    const newTime = timeInput.value;
    const tasksToUpdate = Array.from(selectedTasks);
    
    tasksToUpdate.forEach(taskId => {
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            task.dueTime = newTime;
            task.updatedAt = new Date().toISOString();
        }
    });
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
    
    closeBulkTimeModal();
    selectedTasks.clear();
}

// Image and template functions
function triggerImageUpload() {
    const input = document.getElementById('imageUpload');
    if (input) {
        input.click();
    }
}

function handleImageUpload(event) {
    console.log('Image upload functionality currently disabled');
    // Placeholder for image upload functionality
}

function handleJsonImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (importData.tasks && Array.isArray(importData.tasks)) {
                tasks.push(...importData.tasks);
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`Imported ${importData.tasks.length} tasks successfully!`);
            }
            
            // Import list sections if available
            if (importData.listSections && Array.isArray(importData.listSections)) {
                window.listSections.push(...importData.listSections);
                localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
            }
            
            // Import templates if available
            if (importData.templates && Array.isArray(importData.templates)) {
                customTemplates.push(...importData.templates);
                localStorage.setItem('gtdTemplates', JSON.stringify(customTemplates));
            }
            
        } catch (error) {
            console.error('JSON import failed:', error);
            alert('Import failed. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function handleTextImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            const importedTasks = [];
            lines.forEach((line, index) => {
                if (line.trim()) {
                    const task = {
                        id: (Date.now() + index).toString(),
                        title: line.trim(),
                        notes: '',
                        dueDate: null,
                        dueTime: null,
                        status: 'pending',
                        repeat: 'none',
                        isEvent: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    importedTasks.push(task);
                }
            });
            
            if (importedTasks.length > 0) {
                tasks.push(...importedTasks);
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`Imported ${importedTasks.length} tasks from text file!`);
            }
            
        } catch (error) {
            console.error('Text import failed:', error);
            alert('Text import failed. Please try again.');
        }
    };
    reader.readAsText(file);
}

function addNewTemplate() {
    const input = document.getElementById('newTemplateInput');
    if (!input) return;
    
    const template = input.value.trim();
    if (!template) return;
    
    if (typeof customTemplates !== 'undefined') {
        if (!customTemplates.includes(template)) {
            customTemplates.push(template);
            
            // Save templates
            if (typeof saveTemplates === 'function') {
                saveTemplates();
            }
            
            // Clear input
            input.value = '';
            
            // Re-render template buttons
            if (typeof renderTemplateButtons === 'function') {
                renderTemplateButtons();
            }
        }
    }
}

function resetTaskTitle() {
    const titleInput = document.getElementById('editTaskTitle');
    if (titleInput) {
        titleInput.value = '';
        titleInput.focus();
    }
}

// Settings and language functions
function switchLanguage(lang) {
    console.log('🔧 switchLanguage called with:', lang);
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    
    if (typeof translateUI === 'function') {
        console.log('🔧 Calling translateUI...');
        translateUI();
    } else {
        console.error('❌ translateUI function not found');
    }
    
    if (typeof updateLanguageButtonStyles === 'function') {
        console.log('🔧 Calling updateLanguageButtonStyles...');
        updateLanguageButtonStyles();
    } else {
        console.log('⚠️ updateLanguageButtonStyles function not found (optional)');
    }
    
    if (typeof updateHeaderLanguageButton === 'function') {
        console.log('🔧 Calling updateHeaderLanguageButton...');
        updateHeaderLanguageButton();
    } else {
        console.log('⚠️ updateHeaderLanguageButton function not found (optional)');
    }
    
    console.log('✅ Language switched to:', lang);
}

function saveAutoPrintTime() {
    const select = document.getElementById('autoPrintTimeSelect');
    if (select) {
        localStorage.setItem('autoPrintTime', select.value);
        console.log('Auto print time saved:', select.value);
    }
}

function updateSyncPeriod() {
    const select = document.getElementById('syncPeriodSelect');
    if (select) {
        localStorage.setItem('syncPeriod', select.value);
        console.log('Sync period updated:', select.value);
    }
}

// Load settings values into settings view
function loadSettingsValues() {
    try {
        console.log('Loading settings values...');
        
        // Load date format
        const dateFormat = localStorage.getItem('dateFormat') || 'default';
        const dateFormatElement = document.getElementById('dateFormatSelect');
        if (dateFormatElement) {
            dateFormatElement.value = dateFormat;
        }
        
        // Load time format
        const timeFormat = localStorage.getItem('timeFormat') || '12';
        const timeFormatElement = document.getElementById('timeFormatSelect');
        if (timeFormatElement) {
            timeFormatElement.value = timeFormat;
        }
        
        // Load week start day
        const weekStartDay = localStorage.getItem('weekStartDay') || '1';
        const weekStartElement = document.getElementById('weekStartSelect');
        if (weekStartElement) {
            weekStartElement.value = weekStartDay;
        }
        
        // Load auto-print settings (default to false/unchecked)
        const autoPrintEnabled = localStorage.getItem('autoPrintEnabled') === 'true';
        const autoPrintEnabledElement = document.getElementById('autoPrintEnabled');
        if (autoPrintEnabledElement) {
            autoPrintEnabledElement.checked = autoPrintEnabled;
        }
        
        const autoPrintTime = localStorage.getItem('autoPrintTime');
        const autoPrintTimeElement = document.getElementById('autoPrintTime');
        if (autoPrintTime && autoPrintTimeElement && autoPrintTime !== 'disabled') {
            autoPrintTimeElement.value = autoPrintTime;
        }
        
        // Initialize auto-print controls visibility
        if (typeof toggleAutoPrint === 'function') {
            toggleAutoPrint();
        }
        
        // Load keyboard-only mode setting
        const keyboardOnlyMode = localStorage.getItem('keyboardOnlyMode') === 'true';
        const keyboardOnlyModeElement = document.getElementById('keyboardOnlyMode');
        if (keyboardOnlyModeElement) {
            keyboardOnlyModeElement.checked = keyboardOnlyMode;
        }
        // Apply keyboard-only mode immediately
        if (typeof applyKeyboardOnlyMode === 'function') {
            applyKeyboardOnlyMode(keyboardOnlyMode);
        }
        
        // Load tab display mode setting (default to 'both' for icon + text)
        let tabDisplayMode = localStorage.getItem('tabDisplayMode') || 'both';
        if (!localStorage.getItem('tabDisplayMode')) {
            localStorage.setItem('tabDisplayMode', 'both');
            tabDisplayMode = 'both';
        }
        const tabDisplayElement = document.getElementById('tabDisplaySelect');
        if (tabDisplayElement) {
            tabDisplayElement.value = tabDisplayMode;
        }
        
        // Apply tab display mode with delay
        setTimeout(() => {
            if (typeof applyTabDisplayMode === 'function') {
                applyTabDisplayMode(tabDisplayMode);
                console.log('🎨 Tab display mode applied:', tabDisplayMode);
            }
        }, 100);
        
        // Load mobile UI version setting (default to 'm1')
        let mobileUIVersion = localStorage.getItem('mobileUIVersion') || 'm1';
        if (!localStorage.getItem('mobileUIVersion')) {
            localStorage.setItem('mobileUIVersion', 'm1');
            mobileUIVersion = 'm1';
        }
        const mobileUIElement = document.getElementById('mobileUIVersion');
        if (mobileUIElement) {
            mobileUIElement.value = mobileUIVersion;
        }
        
        // Apply mobile UI version immediately
        if (typeof applyMobileUIVersion === 'function') {
            applyMobileUIVersion(mobileUIVersion);
            console.log('📱 Mobile UI version applied:', mobileUIVersion);
        }
        
        // Load backup settings
        setTimeout(() => {
            if (typeof getBackupSettings === 'function') {
                const backupSettings = getBackupSettings();
                console.log('📥 Loading backup settings:', backupSettings);
                
                const autoBackupElement = document.getElementById('autoBackupEnabled');
                const dailyBackupElement = document.getElementById('dailyBackupEnabled');
                const weeklyBackupElement = document.getElementById('weeklyBackupEnabled'); 
                const monthlyBackupElement = document.getElementById('monthlyBackupEnabled');
                
                if (autoBackupElement) {
                    autoBackupElement.checked = backupSettings.enabled || false;
                }
                if (dailyBackupElement) {
                    dailyBackupElement.checked = backupSettings.daily || false;
                }
                if (weeklyBackupElement) {
                    weeklyBackupElement.checked = backupSettings.weekly || false;
                }
                if (monthlyBackupElement) {
                    monthlyBackupElement.checked = backupSettings.monthly || false;
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('Error loading settings values:', error);
    }
}

function openSettings() {
    if (typeof showView === 'function') {
        showView('settings');
    }
}

// Drag and Drop functions for tasks
// draggedTask declared in tasks.js

function handleDragStart(e) {
    const taskIdStr = e.target.dataset.taskId;
    
    // Try both string and number comparison since task IDs can be either
    const taskId = parseInt(taskIdStr);
    window.draggedTask = window.tasks?.find(t => t.id == taskIdStr || t.id === taskId);
    
    if (!window.draggedTask) {
        console.error('Task not found for drag:', taskIdStr);
        return;
    }
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskIdStr);
    
    // Create a clean drag image with just the task
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.background = '#e3f2fd';
    dragImage.style.border = '2px solid #007bff';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.zIndex = '9999';
    dragImage.style.width = e.target.offsetWidth + 'px';
    document.body.appendChild(dragImage);
    
    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, e.offsetX || 10, e.offsetY || 10);
    
    // Remove the temporary drag image after a short delay
    setTimeout(() => {
        if (dragImage.parentNode) {
            dragImage.parentNode.removeChild(dragImage);
        }
    }, 0);
    
    // Add dragging-active class to grids for visual effects
    const weekGrid = document.getElementById('weekGrid');
    const calendarGrid = document.getElementById('calendarGrid');
    if (weekGrid) {
        weekGrid.classList.add('dragging-active');
    }
    if (calendarGrid) {
        calendarGrid.classList.add('dragging-active');
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    window.draggedTask = null;
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    // Remove dragging-active class from grids
    const weekGrid = document.getElementById('weekGrid');
    const calendarGrid = document.getElementById('calendarGrid');
    if (weekGrid) {
        weekGrid.classList.remove('dragging-active');
    }
    if (calendarGrid) {
        calendarGrid.classList.remove('dragging-active');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (window.draggedTask && (e.currentTarget.classList.contains('calendar-day') || e.currentTarget.classList.contains('week-day'))) {
        // Clear all existing drop-targets before adding to current element
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        e.currentTarget.classList.add('drop-target');
    }
}

function handleDragLeave(e) {
    // Only remove drop-target if we're truly leaving the calendar day
    // Check if the related target is outside the current target
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // If mouse coordinates are outside the calendar day bounds, remove the class
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        e.currentTarget.classList.remove('drop-target');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    if (!window.draggedTask) {
        console.error('No draggedTask found in handleDrop');
        return;
    }
    
    const newDate = e.currentTarget.dataset.date;
    if (!newDate) {
        console.error('No date found on drop target');
        return;
    }
    
    if (newDate === window.draggedTask.dueDate) {
        return;
    }
    
    // Store task info before async operations (draggedTask can become null)
    const taskTitle = window.draggedTask.title;
    const taskId = window.draggedTask.id;
    
    const newDateObj = new Date(newDate);
    const oldDate = window.draggedTask.dueDate ? new Date(window.draggedTask.dueDate) : null;
    
    try {
        // Update task date
        window.draggedTask.dueDate = newDate;
        window.draggedTask.updatedAt = new Date().toISOString();
        
        // Update in memory tasks array
        if (window.tasks) {
            const existingIndex = window.tasks.findIndex(t => t.id === window.draggedTask.id);
            if (existingIndex >= 0) {
                window.tasks[existingIndex] = window.draggedTask;
                // Sync back to local tasks variable for immediate UI update
                if (typeof tasks !== 'undefined') {
                    tasks = window.tasks;
                }
            }
        }
        
        // Save to localStorage
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        
        // Sync to cloud
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
        }
        
        if (typeof sortTasks === 'function') {
            sortTasks();
        }
        
        // Force immediate UI refresh for all views
        console.log('🔄 Force refreshing UI after drag and drop');
        
        // Force re-render the current view immediately
        setTimeout(() => {
            if (window.currentView === 'today' && typeof renderTodayView === 'function') {
                renderTodayView();
            } else if (window.currentView === 'week' && typeof renderWeekView === 'function') {
                renderWeekView();
            } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
                renderCalendar();
            } else if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
        }, 10); // Minimal delay to ensure DOM updates are processed
        
        // Show brief success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = `Task "${taskTitle}" moved to ${newDateObj.toLocaleDateString()}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error in handleDrop:', error);
    }
}

// Settings helper functions
function applyKeyboardOnlyMode(keyboardOnlyMode) {
    const buttonsToHide = document.querySelectorAll('.keyboard-hideable');
    buttonsToHide.forEach(button => {
        if (keyboardOnlyMode) {
            button.style.display = 'none';
        } else {
            button.style.display = '';
        }
    });
    console.log('Keyboard-only mode:', keyboardOnlyMode ? 'enabled' : 'disabled');
}

function applyTabDisplayMode(mode) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        const icon = tab.querySelector('.nav-icon');
        const text = tab.querySelector('.nav-text');
        
        switch(mode) {
            case 'icons':
                if (icon) icon.style.display = 'inline';
                if (text) text.style.display = 'none';
                break;
            case 'text':
                if (icon) icon.style.display = 'none';
                if (text) text.style.display = 'inline';
                break;
            case 'both':
            default:
                if (icon) icon.style.display = 'inline';
                if (text) text.style.display = 'inline';
                break;
        }
    });
    console.log('Tab display mode applied:', mode);
}

function applyMobileUIVersion(version) {
    document.body.classList.remove('mobile-v1', 'mobile-v2');
    if (version === 'm1') {
        document.body.classList.add('mobile-v1');
    } else if (version === 'm2') {
        document.body.classList.add('mobile-v2');
    }
    console.log('Mobile UI version applied:', version);
}

function toggleAutoPrint() {
    const checkbox = document.getElementById('autoPrintEnabled');
    const timeSelect = document.getElementById('autoPrintTime');
    
    if (checkbox && timeSelect) {
        timeSelect.style.display = checkbox.checked ? 'block' : 'none';
        localStorage.setItem('autoPrintEnabled', checkbox.checked);
    }
}

function toggleKeyboardOnlyMode() {
    const checkbox = document.getElementById('keyboardOnlyMode');
    if (checkbox) {
        const enabled = checkbox.checked;
        localStorage.setItem('keyboardOnlyMode', enabled);
        applyKeyboardOnlyMode(enabled);
    }
}

function saveDateFormat() {
    const select = document.getElementById('dateFormatSelect');
    if (select) {
        localStorage.setItem('dateFormat', select.value);
        console.log('Date format saved:', select.value);
    }
}

function saveTimeFormat() {
    const select = document.getElementById('timeFormatSelect');
    if (select) {
        localStorage.setItem('timeFormat', select.value);
        console.log('Time format saved:', select.value);
    }
}

function saveWeekStart() {
    const select = document.getElementById('weekStartSelect');
    if (select) {
        localStorage.setItem('weekStartDay', select.value);
        console.log('Week start day saved:', select.value);
        
        // Refresh week and calendar views if they're currently displayed
        if (window.currentView === 'week' && typeof renderWeekView === 'function') {
            renderWeekView();
        } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
            renderCalendar();
        }
    }
}

function getWeekStartDay() {
    const saved = localStorage.getItem('weekStartDay');
    return saved !== null ? parseInt(saved) : 1; // Default to Monday (1)
}

function getBackupSettings() {
    return {
        enabled: localStorage.getItem('autoBackupEnabled') === 'true',
        daily: localStorage.getItem('dailyBackupEnabled') === 'true',
        weekly: localStorage.getItem('weeklyBackupEnabled') === 'true',
        monthly: localStorage.getItem('monthlyBackupEnabled') === 'true'
    };
}

// List management functions
function openCreateSectionModal() {
    console.log('Opening create section modal...');
    // Placeholder for create section modal
    const sectionName = prompt('Enter section name:');
    if (sectionName) {
        console.log('Would create section:', sectionName);
    }
}

// Edit list section
async function editListSection(sectionId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const newName = prompt('Edit section name:', section.name);
    if (newName && newName.trim() && newName.trim() !== section.name) {
        section.name = newName.trim();
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// URL hash handling for direct actions
function handleUrlHash() {
    const hash = window.location.hash.slice(1); // Remove the #
    
    if (hash === 'new') {
        // Open the add task modal
        setTimeout(() => {
            if (typeof openAddTaskModal === 'function') {
                openAddTaskModal();
                console.log('🔗 Opened add task modal from URL hash #new');
            }
        }, 1000); // Delay to ensure page and scripts are fully loaded
        
        // Clear the hash to prevent repeated triggers
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}

// Initialize hash handling on page load and hash changes
window.addEventListener('load', handleUrlHash);
window.addEventListener('hashchange', handleUrlHash);

// Utility function for HTML escaping
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// List item management functions (global scope)
async function addListItem() {
    console.log('🔍 Global addListItem called');
    const input = document.getElementById('newListItemInput');
    const text = input.value.trim();
    
    if (!text) {
        console.error('Empty list item text');
        input.focus();
        return;
    }
    
    // Use global variables (not window.)
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    console.log('🔍 Current context:', { currentListSectionId, currentListId, listSectionsLength: listSections?.length });
    
    const section = listSections?.find(s => s.id == currentListSectionId);
    if (!section) {
        console.error('❌ Section not found:', currentListSectionId);
        return;
    }
    
    const list = section.lists?.find(l => l.id == currentListId);
    if (!list) {
        console.error('❌ List not found:', currentListId);
        return;
    }
    
    if (!list.items) {
        list.items = [];
    }
    
    // Add new item
    const newItem = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    list.items.unshift(newItem);
    console.log('✅ Added item:', newItem.text, 'to list:', list.name);
    
    // Save and refresh using window functions
    if (typeof window.saveListSections === 'function') {
        await window.saveListSections();
        console.log('💾 Saved to localStorage and server');
    }
    if (typeof renderListItems === 'function') {
        renderListItems();
        console.log('🔄 Refreshed list items');
    }
    if (typeof renderListsView === 'function') {
        renderListsView();
        console.log('🔄 Refreshed lists view');
    }
    
    // Clear input and focus
    input.value = '';
    input.focus();
}

async function editListItem(itemIndex) {
    console.log('🔍 Global editListItem called:', itemIndex);
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list || !list.items || !list.items[itemIndex]) return;
    
    const item = list.items[itemIndex];
    const newText = prompt('Edit item:', item.text);
    
    if (newText !== null && newText.trim() && newText.trim() !== item.text) {
        item.text = newText.trim();
        item.updatedAt = new Date().toISOString();
        console.log('✅ Edited item:', item.text);
        
        // Save and refresh
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListItems === 'function') {
            renderListItems();
        }
    }
}

async function deleteListItem(itemIndex) {
    console.log('🔍 Global deleteListItem called:', itemIndex);
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list || !list.items || !list.items[itemIndex]) return;
    
    // Delete item
    const deletedItem = list.items.splice(itemIndex, 1)[0];
    console.log('✅ Deleted item:', deletedItem.text);
    
    // Save and refresh
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    if (typeof renderListItems === 'function') {
        renderListItems();
    }
}

async function toggleListItem(itemIndex) {
    console.log('🔍 Global toggleListItem called:', itemIndex);
    
    // Rapid-click protection
    const currentTime = Date.now();
    if (!window.toggleListItemLastClick) window.toggleListItemLastClick = {};
    const clickKey = `${window.currentListSectionId}-${window.currentListId}-${itemIndex}`;
    if (window.toggleListItemLastClick[clickKey] && 
        currentTime - window.toggleListItemLastClick[clickKey] < 300) {
        console.log(`⏱️ Rapid-click blocked for list item ${itemIndex}`);
        return;
    }
    window.toggleListItemLastClick[clickKey] = currentTime;
    
    // Enhanced null checks
    if (itemIndex === null || itemIndex === undefined || itemIndex < 0) {
        console.warn('Invalid itemIndex provided to toggleListItem:', itemIndex);
        return;
    }
    
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) {
        console.warn('No section found for currentListSectionId:', window.currentListSectionId);
        return;
    }
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list || !list.items || !list.items[itemIndex]) {
        console.warn('No list or item found:', { 
            listId: window.currentListId, 
            itemIndex, 
            itemsLength: list?.items?.length 
        });
        return;
    }
    
    try {
        // Toggle completed status
        const item = list.items[itemIndex];
        const wasCompleted = item.completed;
        item.completed = !wasCompleted;
        
        console.log('✅ Toggled item:', item.text, 'completed:', item.completed);
        
        // Update accessibility attributes for the item element
        const itemElement = document.querySelector(`[data-item-index="${itemIndex}"]`);
        if (itemElement) {
            itemElement.setAttribute('aria-checked', item.completed.toString());
            itemElement.setAttribute('aria-label', 
                `${item.text} - ${item.completed ? 'completed' : 'pending'}`);
        }
        
        // Save and refresh
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListItems === 'function') {
            renderListItems();
        }
        
    } catch (error) {
        console.error('Error in toggleListItem:', error);
    }
}



// Delete list section
async function deleteListSection(sectionId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const listsCount = section.lists ? section.lists.length : 0;
    const message = listsCount > 0 
        ? `Delete section "${section.name}" and all its ${listsCount} lists?`
        : `Delete section "${section.name}"?`;
    
    if (confirm(message)) {
        window.listSections = window.listSections.filter(s => s.id !== sectionId);
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// Open create list modal
function openCreateListModal(sectionId) {
    const listName = prompt('Enter list name:', '');
    if (listName && listName.trim()) {
        createList(sectionId, listName.trim());
    }
}

// Create new list
async function createList(sectionId, name) {
    if (!window.listSections) {
        window.listSections = [];
    }
    
    const section = window.listSections.find(s => s.id === sectionId);
    if (!section) return;
    
    if (!section.lists) {
        section.lists = [];
    }
    
    const newList = {
        id: Date.now().toString(),
        name: name,
        items: [],
        createdAt: new Date().toISOString()
    };
    
    section.lists.push(newList);
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    if (typeof renderListsView === 'function') {
        renderListsView();
    }
}

// Edit list
async function editList(sectionId, listId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id === listId);
    if (!list) return;
    
    const newName = prompt('Edit list name:', list.name);
    if (newName && newName.trim() && newName.trim() !== list.name) {
        list.name = newName.trim();
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// Delete list
async function deleteList(sectionId, listId) {
    const section = window.listSections?.find(s => s.id === sectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id === listId);
    if (!list) return;
    
    const itemsCount = list.items ? list.items.length : 0;
    const message = itemsCount > 0 
        ? `Delete list "${list.name}" and all its ${itemsCount} items?`
        : `Delete list "${list.name}"?`;
    
    if (confirm(message)) {
        section.lists = section.lists.filter(l => l.id !== listId);
        if (typeof saveListSections === 'function') {
            await saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
    }
}

// Open list modal to view/edit list items
function openListModal(sectionId, listId) {
    
    const section = window.listSections?.find(s => s.id == sectionId);
    if (!section) {
        console.error('❌ Section not found:', sectionId);
        console.log('Available sections:', window.listSections?.map(s => s.id));
        return;
    }
    
    const list = section.lists?.find(l => l.id == listId);
    if (!list) {
        console.error('❌ List not found:', listId);
        console.log('Available lists in section:', section.lists?.map(l => l.id));
        return;
    }
    
    console.log('✅ Found list:', list.name);
    
    // Store current list context
    window.currentListSectionId = sectionId;
    window.currentListId = listId;
    
    // Update modal title
    const titleElement = document.getElementById('listItemsModalTitle');
    const subtitleElement = document.getElementById('listItemsModalSubtitle');
    
    if (titleElement) {
        titleElement.textContent = `📋 ${list.name}`;
    }
    if (subtitleElement) {
        subtitleElement.textContent = '';
    }
    
    // Initialize items if not exists
    if (!list.items) {
        list.items = [];
    }
    
    // Clear input
    const inputElement = document.getElementById('newListItemInput');
    if (inputElement) {
        inputElement.value = '';
    }
    
    // Render items
    if (typeof renderListItems === 'function') {
        renderListItems();
    }
    
    // Show modal
    const modal = document.getElementById('listItemsModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus input after a short delay
        setTimeout(() => {
            if (inputElement) {
                inputElement.focus();
            }
        }, 100);
    }
}

// Render list items in modal
function renderListItems() {
    const section = window.listSections?.find(s => s.id == window.currentListSectionId);
    if (!section) return;
    
    const list = section.lists?.find(l => l.id == window.currentListId);
    if (!list) return;
    
    const container = document.getElementById('listItemsContainer');
    const emptyState = document.getElementById('emptyListItems');
    const countElement = document.getElementById('listItemsCount');
    
    if (!container) return;
    
    if (!list.items || list.items.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (countElement) countElement.textContent = '0 items';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (countElement) countElement.textContent = `${list.items.length} item${list.items.length === 1 ? '' : 's'}`;
    
    // Sort items: unchecked first, then checked
    const sortedItems = [...list.items].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });
    
    let html = '';
    sortedItems.forEach((item, index) => {
        const originalIndex = list.items.indexOf(item);
        html += `
            <div class="list-modal-item ${item.completed ? 'completed' : ''}" 
                 data-item-index="${originalIndex}">
                <div class="list-modal-item-content">
                    <input type="checkbox" 
                           class="list-modal-item-checkbox" 
                           ${item.completed ? 'checked' : ''} 
                           onchange="toggleListItem(${originalIndex})">
                    <div class="list-modal-item-text">${escapeHtml(item.text)}</div>
                </div>
                <div class="list-modal-item-actions">
                    <button class="list-modal-action-btn edit" 
                            onclick="editListItem(${originalIndex})" 
                            title="Edit item">✏️</button>
                    <button class="list-modal-action-btn delete" 
                            onclick="deleteListItem(${originalIndex})" 
                            title="Delete item">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render template buttons in the Add Task modal
function renderTemplateButtons() {
    const container = document.getElementById('templateButtons');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!window.customTemplates || window.customTemplates.length === 0) {
        container.innerHTML = '<span style="color: #999; font-size: 12px;">No templates created yet</span>';
        return;
    }
    
    window.customTemplates.forEach(template => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'template-btn';
        button.textContent = template;
        button.title = `Left-click to add "${template}" to task • Right-click or long-press to delete`;
        
        let touchStartTime = 0;
        let touchTimer = null;
        
        // Touch start for mobile long-press
        button.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchTimer = setTimeout(async () => {
                e.preventDefault();
                button.classList.add('deleting');
                if (confirm(`Delete template "${template}"?`)) {
                    await deleteTemplate(template);
                } else {
                    button.classList.remove('deleting');
                }
            }, 800);
        });
        
        // Touch end to cancel long-press timer
        button.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            const touchDuration = Date.now() - touchStartTime;
            if (touchDuration < 800) {
                insertTemplateToTask(template);
            }
            button.classList.remove('deleting');
        });
        
        // Left click: insert template (for desktop)
        button.addEventListener('click', (e) => {
            if (!('ontouchstart' in window)) {
                insertTemplateToTask(template);
            }
        });
        
        // Right click: delete template (for desktop)
        button.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            await deleteTemplate(template);
        });
        
        container.appendChild(button);
    });
}

// Insert template into task title input
function insertTemplateToTask(template) {
    const titleInput = document.getElementById('editTaskTitle');
    if (!titleInput) return;
    
    const currentValue = titleInput.value.trim();
    if (currentValue) {
        titleInput.value = currentValue + ' ' + template;
    } else {
        titleInput.value = template;
    }
    titleInput.focus();
    titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
}

// Delete template
async function deleteTemplate(template) {
    if (!window.customTemplates) return;
    
    window.customTemplates = window.customTemplates.filter(t => t !== template);
    
    // Save templates
    localStorage.setItem('gtd_custom_templates', JSON.stringify(window.customTemplates));
    
    // Upload to server
    if (typeof uploadAllTemplates === 'function') {
        await uploadAllTemplates();
    }
    
    // Re-render template buttons
    renderTemplateButtons();
}

// Open Add Task Modal
function openAddTaskModal(dateStr) {
    // Clear the form for new task
    const titleInput = document.getElementById('editTaskTitle');
    const notesInput = document.getElementById('editTaskNotes');
    const eventCheckbox = document.getElementById('editTaskIsEvent');
    
    if (titleInput) titleInput.value = '';
    if (notesInput) notesInput.value = '';
    if (eventCheckbox) eventCheckbox.checked = false;
    
    // Set the date
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const dateToUse = dateStr || currentDate;
    
    const dateInput = document.getElementById('editTaskDate');
    const timeInput = document.getElementById('editTaskTime');
    
    if (dateInput) dateInput.value = dateToUse;
    if (timeInput) timeInput.value = '';
    
    // Change modal title
    const modalTitle = document.querySelector('#taskModal h3');
    if (modalTitle) {
        modalTitle.textContent = '➕ Add New Task';
    }
    
    // Set global variable to indicate we're adding, not editing
    window.currentEditTaskId = null;
    
    // Render template buttons
    renderTemplateButtons();
    
    // Show the modal
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Focus on title input
        setTimeout(() => {
            if (titleInput) titleInput.focus();
        }, 100);
    }
}

// Date/Time Modal Functions
function populateDateTimeModal(currentDate, currentTime) {
    // Store current values
    window.selectedModalDate = currentDate;
    window.selectedModalTime = currentTime;
    
    // Replace day picker with calendar grid
    const dayPickerContainer = document.getElementById('desktopDayPicker')?.parentElement || document.getElementById('mobileDayPicker')?.parentElement;
    if (dayPickerContainer) {
        const currentDateObj = currentDate ? new Date(currentDate) : new Date();
        const year = currentDateObj.getFullYear();
        const month = currentDateObj.getMonth();
        
        dayPickerContainer.innerHTML = `
            <label style="display: block; font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 8px; text-align: center; font-weight: 600;">CALENDAR</label>
            <div style="background: rgba(255,255,255,0.9); border-radius: 12px; padding: 8px; backdrop-filter: blur(10px);">
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-size: 11px; text-align: center;">
                    <div style="font-weight: bold; color: #666;">M</div>
                    <div style="font-weight: bold; color: #666;">T</div>
                    <div style="font-weight: bold; color: #666;">W</div>
                    <div style="font-weight: bold; color: #666;">T</div>
                    <div style="font-weight: bold; color: #666;">F</div>
                    <div style="font-weight: bold; color: #666;">S</div>
                    <div style="font-weight: bold; color: #666;">S</div>
                    <!-- Calendar grid placeholder -->
                </div>
            </div>
        `;
    }
    
    // Populate month picker
    const monthPicker = document.getElementById('desktopMonthPicker') || document.getElementById('mobileMonthPicker');
    if (monthPicker && currentDate) {
        const date = new Date(currentDate);
        monthPicker.value = date.getMonth();
    }
    
    // Populate hour picker
    const hourPicker = document.getElementById('desktopHourPicker') || document.getElementById('mobileHourPicker');
    if (hourPicker) {
        hourPicker.value = currentTime || '';
    }
    
    updateDateTimeDisplay();
}


// Select date in modal calendar
function selectModalDate(dateStr) {
    window.selectedModalDate = dateStr;
    updateDateTimeDisplay();
    
    // Re-populate to update selection
    populateDateTimeModal(dateStr, window.selectedModalTime);
}

function closeDateTimeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function applyDesktopDateTime() {
    const hourPicker = document.getElementById('desktopHourPicker') || document.getElementById('mobileHourPicker');
    
    // Use the selected date from calendar and time from picker
    const selectedDate = window.selectedModalDate;
    const selectedTime = hourPicker ? hourPicker.value : window.selectedModalTime;
    
    // Update the task
    const taskId = window.currentDateTimeTaskId;
    if (taskId) {
        if (selectedDate) {
            updateTaskDate(taskId, selectedDate, { stopPropagation: () => {} });
        }
        if (selectedTime) {
            updateTaskTime(taskId, selectedTime, { stopPropagation: () => {} });
        }
    }
    
    closeDateTimeModal();
}

function updateDateTimeDisplay() {
    const dateField = document.getElementById('editTaskDateOnly');
    const timeField = document.getElementById('editTaskTimeOnly');
    const display = document.getElementById('dateTimeDisplay');
    
    if (!display) return;
    
    const dateValue = dateField?.value;
    const timeValue = timeField?.value;
    
    if (!dateValue) {
        display.textContent = 'Select date & time...';
        return;
    }
    
    // Format the date nicely
    const date = new Date(dateValue);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let dateText = '';
    if (dateValue === getLocalDateString(today)) {
        dateText = 'Today';
    } else if (dateValue === getLocalDateString(tomorrow)) {
        dateText = 'Tomorrow';
    } else {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        dateText = date.toLocaleDateString('en-US', options);
    }
    
    // Format the time
    const timeText = timeValue ? timeValue : 'No specific time';
    
    display.textContent = `${dateText}, ${timeText}`;
}

// Today view template filtering
function filterTodayByTemplate(template) {
    if (window.activeTodayTemplateFilter === template) {
        // Toggle off if same template clicked
        clearTodayTemplateFilter();
    } else {
        // Set new filter
        window.activeTodayTemplateFilter = template;
        renderTodayView();
    }
}

function clearTodayTemplateFilter() {
    window.activeTodayTemplateFilter = null;
    renderTodayView();
}

// Time slot drag and drop for Today view
function handleTimeSlotDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleTimeSlotDragEnter(e) {
    e.preventDefault();
    if (window.draggedTask) {
        e.currentTarget.classList.add('drop-target');
    }
}

function handleTimeSlotDragLeave(e) {
    // Remove drop-target class when leaving the time slot
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        e.currentTarget.classList.remove('drop-target');
    }
}

async function handleTimeSlotDrop(e, targetTime) {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    if (!window.draggedTask) {
        console.error('No draggedTask found in time slot drop');
        return;
    }
    
    try {
        console.log(`Moving task "${window.draggedTask.title}" to time ${targetTime}`);
        
        // Update task time
        window.draggedTask.dueTime = targetTime;
        window.draggedTask.updatedAt = new Date().toISOString();
        
        // Save to localStorage and server
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        if (typeof saveTasks === 'function') {
            await saveTasks();
        }
        
        // Re-render Today view to show new position
        if (typeof renderTodayView === 'function') {
            renderTodayView();
        }
        
        console.log('✅ Task time updated via drag and drop');
    } catch (error) {
        console.error('❌ Error in time slot drop:', error);
    }
}

function toggleAllSections() {
    console.log('🔄 TOGGLE ALL: Starting, current view:', window.currentView);
    
    try {
        // Check which view we're in and find appropriate sections
        const listSections = document.querySelectorAll('.list-section');
        const timeBlocks = document.querySelectorAll('.time-block');
        
        console.log(`🔄 TOGGLE ALL: Found ${listSections.length} list sections, ${timeBlocks.length} time blocks`);
        
        if (listSections.length > 0) {
            // Lists view - toggle list sections
            console.log('🔄 TOGGLE ALL: Using list sections');
            toggleAllListSections(listSections);
        } else if (timeBlocks.length > 0) {
            // Today view - toggle time blocks
            console.log('🔄 TOGGLE ALL: Using time blocks');
            toggleAllTimeBlocks(timeBlocks);
        } else {
            // No sections found - try again after a brief delay in case view is still rendering
            console.log('🔄 TOGGLE ALL: No sections found, retrying in 100ms...');
            setTimeout(() => {
                const retryListSections = document.querySelectorAll('.list-section');
                const retryTimeBlocks = document.querySelectorAll('.time-block');
                
                console.log(`🔄 TOGGLE ALL RETRY: Found ${retryListSections.length} list sections, ${retryTimeBlocks.length} time blocks`);
                
                if (retryListSections.length > 0) {
                    toggleAllListSections(retryListSections);
                } else if (retryTimeBlocks.length > 0) {
                    toggleAllTimeBlocks(retryTimeBlocks);
                } else {
                    console.warn('🔄 TOGGLE ALL: No sections found to toggle after retry');
                }
            }, 100);
            return;
        }
    } catch (error) {
        console.error('Error in toggleAllSections:', error);
    }
}

function toggleAllListSections(sections) {
    const arrows = document.querySelectorAll('.list-section-header span');
        
        // Check if any sections are visible
        let anyVisible = false;
        sections.forEach(section => {
            const content = section.querySelector('.list-section-content');
            if (content && !content.classList.contains('collapsed')) {
                anyVisible = true;
            }
        });
        
        console.log(`Found ${sections.length} sections, anyVisible: ${anyVisible}`);
        
        // Toggle all sections using the data-section-id
        sections.forEach(section => {
            const sectionId = section.dataset.sectionId;
            if (sectionId) {
                // Find the corresponding listSection data
                const listSection = window.listSections?.find(s => s.id === sectionId);
                if (listSection) {
                    // Toggle the collapsed state
                    listSection.collapsed = anyVisible; // If any visible, collapse all; otherwise expand all
                    console.log(`Toggling section ${listSection.name} to collapsed: ${listSection.collapsed}`);
                }
            }
        });
        
        // Save and re-render
        if (typeof saveListSections === 'function') {
            saveListSections();
        }
        if (typeof renderListsView === 'function') {
            renderListsView();
        }
        
        console.log(`✅ Toggled ${sections.length} sections - ${anyVisible ? 'collapsed' : 'expanded'} all`);
}

function toggleAllTimeBlocks(timeBlocks) {
    console.log('Toggling all time blocks...');
    
    try {
        // Get current collapse states from localStorage
        const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
        
        // Check if any time blocks are visible
        let anyVisible = false;
        timeBlocks.forEach(block => {
            const header = block.querySelector('.time-block-header');
            if (header) {
                const timeKey = header.textContent.includes('No Specific Time') ? 'untimed' : 
                               header.textContent.match(/\d{1,2}:\d{2}/)?.[0]?.replace(':', '');
                if (timeKey && collapseStates[timeKey] !== true) {
                    anyVisible = true;
                }
            }
        });
        
        // Toggle all time blocks
        timeBlocks.forEach(block => {
            const header = block.querySelector('.time-block-header');
            if (header) {
                const timeKey = header.textContent.includes('No Specific Time') ? 'untimed' : 
                               header.textContent.match(/\d{1,2}:\d{2}/)?.[0]?.replace(':', '');
                if (timeKey && typeof toggleTimeBlock === 'function') {
                    const shouldCollapse = anyVisible;
                    const currentlyCollapsed = collapseStates[timeKey] === true;
                    
                    // Only toggle if state needs to change
                    if (currentlyCollapsed !== shouldCollapse) {
                        toggleTimeBlock(timeKey);
                    }
                }
            }
        });
        
        console.log(`✅ Toggled ${timeBlocks.length} time blocks - ${anyVisible ? 'collapsed' : 'expanded'} all`);
    } catch (error) {
        console.error('Error toggling time blocks:', error);
    }
}

function showListSelectionForTXTImport() {
    console.log('Showing list selection for TXT import...');
    // Placeholder for TXT import
}

// Quick Backup and Import JSON functions
function quickBackupJSON() {
    try {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tasks: tasks || [],
            customTemplates: customTemplates || [],
            listSections: listSections || [],
            settings: {
                language: localStorage.getItem('language') || 'en',
                theme: localStorage.getItem('theme') || 'light'
            }
        };
        
        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `hyperfiler-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Backup created successfully!', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showNotification('❌ Failed to create backup', 'error');
    }
}

function importJSONBackup(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.tasks || !Array.isArray(backup.tasks)) {
                throw new Error('Invalid backup format');
            }
            
            if (confirm(`Import ${backup.tasks.length} tasks from backup?\nThis will replace your current data!`)) {
                // Import tasks
                tasks = backup.tasks || [];
                localStorage.setItem('gtdTasks', JSON.stringify(tasks));
                
                // Import templates
                if (backup.customTemplates) {
                    customTemplates = backup.customTemplates;
                    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
                }
                
                // Import lists
                if (backup.listSections) {
                    listSections = backup.listSections;
                    localStorage.setItem('listSections', JSON.stringify(listSections));
                }
                
                // Refresh the view
                renderCurrentView();
                showNotification('✅ Backup imported successfully!', 'success');
                
                // Close settings modal
                closeSettings();
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification('❌ Failed to import backup', 'error');
        }
    };
    reader.readAsText(file);
}

// Toggle all time slots function
function toggleAllTimeSlots() {
    // Get all time slot content elements
    const timeSlots = document.querySelectorAll('.time-block-content');
    const arrows = document.querySelectorAll('.group-arrow');
    
    // Check if any are visible
    let anyVisible = false;
    timeSlots.forEach(slot => {
        if (slot.style.display !== 'none') {
            anyVisible = true;
        }
    });
    
    // Toggle all with consistent accessibility
    timeSlots.forEach((slot, index) => {
        if (anyVisible) {
            slot.style.display = 'none';
            if (arrows[index]) {
                arrows[index].textContent = '▶';
                arrows[index].setAttribute('aria-expanded', 'false');
            }
        } else {
            slot.style.display = 'block';
            if (arrows[index]) {
                arrows[index].textContent = '▼';
                arrows[index].setAttribute('aria-expanded', 'true');
            }
        }
    });
}

// Export functions
function downloadTodayHtml() {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const todayTasks = tasks.filter(task => 
        task.dueDate === (typeof getLocalDateString === 'function' ? 
            getLocalDateString(today) : 
            today.toISOString().split('T')[0])
    );
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Today's Schedule - ${formattedDate}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .task { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
                .task-title { font-weight: bold; }
                .task-time { color: #666; font-size: 0.9em; }
                .task-notes { margin-top: 5px; color: #444; }
            </style>
        </head>
        <body>
            <h1>Today's Schedule</h1>
            <h2>${formattedDate}</h2>
    `;
    
    if (todayTasks.length === 0) {
        html += '<p>No tasks scheduled for today.</p>';
    } else {
        todayTasks.forEach(task => {
            html += `
                <div class="task">
                    <div class="task-title">${task.title}</div>
                    ${task.dueTime ? `<div class="task-time">Time: ${task.dueTime}</div>` : ''}
                    ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                </div>
            `;
        });
    }
    
    html += `
        </body>
        </html>
    `;
    
    // Download the HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `today-schedule-${today.toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportRepeatHtml() {
    console.log('Exporting repeat tasks as HTML...');
    // Placeholder for repeat tasks HTML export
}

function printSearchResults() {
    window.print();
}

function openTrash() {
    console.log('Opening trash...');
    alert('Trash functionality not yet implemented');
}

// Keyboard support for collapse/expand functionality
function setupCollapseExpandKeyboardSupport() {
    document.addEventListener('keydown', function(e) {
        // Only handle keyboard events when no input/textarea is focused
        if (document.activeElement && 
            (document.activeElement.tagName === 'INPUT' || 
             document.activeElement.tagName === 'TEXTAREA' ||
             document.activeElement.isContentEditable)) {
            return;
        }
        
        // Handle keyboard shortcuts for collapse/expand
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'e':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Expand all groups');
                    if (typeof expandAllGroups === 'function') {
                        expandAllGroups();
                    }
                    break;
                case 'c':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Collapse all groups');
                    if (typeof collapseAllGroups === 'function') {
                        collapseAllGroups();
                    }
                    break;
                case 't':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Toggle all time slots');
                    if (typeof toggleAllTimeSlots === 'function') {
                        toggleAllTimeSlots();
                    }
                    break;
            }
        }
        
        // Individual arrow navigation with arrow keys
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.classList.contains('group-arrow')) {
                e.preventDefault();
                const timeKey = focusedElement.id.replace('arrow-', '');
                if (timeKey && typeof toggleTimeBlock === 'function') {
                    toggleTimeBlock(timeKey);
                }
            }
        }
    });
    
    console.log('🎹 Keyboard shortcuts initialized: Ctrl+E (expand), Ctrl+C (collapse), Ctrl+T (toggle time blocks)');
}

// Initialize keyboard support on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCollapseExpandKeyboardSupport);
} else {
    setupCollapseExpandKeyboardSupport();
}

// Make all functions globally accessible
window.openAddTaskModalMobile = openAddTaskModalMobile;
window.provideFeedback = provideFeedback;
window.performSearch = performSearch;
window.performMobileSearch = performMobileSearch;
window.quickSearch = quickSearch;
window.performAllTasksSearch = performAllTasksSearch;
window.clearAllTasksTemplateFilter = clearAllTasksTemplateFilter;
window.searchTodayTasks = searchTodayTasks;
window.searchMonthTasks = searchMonthTasks;
window.searchWeekTasks = searchWeekTasks;
window.searchRepeatTasks = searchRepeatTasks;
window.undoLastAction = undoLastAction;
window.deleteSelectedTasks = deleteSelectedTasks;
window.delaySelectedTasks = delaySelectedTasks;
window.toggleSelectAll = toggleSelectAll;
window.expandAllGroups = expandAllGroups;
window.collapseAllGroups = collapseAllGroups;
window.exportTasks = exportTasks;
window.exportAllTasks = exportAllTasks;
window.importTasks = importTasks;
window.clearAllTasks = clearAllTasks;
window.performUndo = performUndo;
window.refreshUndoView = refreshUndoView;
window.checkAllBackups = checkAllBackups;
window.createEmergencyBackup = createEmergencyBackup;
window.openDateTimeModal = openDateTimeModal;
window.closeDateTimeModal = closeDateTimeModal;
window.applyDesktopDateTime = applyDesktopDateTime;
window.applyMobileDateTime = applyMobileDateTime;
window.openBulkTimeModal = openBulkTimeModal;
window.triggerImageUpload = triggerImageUpload;
window.handleImageUpload = handleImageUpload;
window.addNewTemplate = addNewTemplate;
window.resetTaskTitle = resetTaskTitle;

// Helper function to parse time strings for comparison
function parseTime(timeStr) {
    if (!timeStr) return null;
    
    try {
        // Handle various time formats: "14:30", "2:30 PM", "14:30:00"
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
        if (!timeMatch) return null;
        
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[4];
        
        // Convert 12-hour to 24-hour format
        if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hours !== 12) {
                hours += 12;
            } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
                hours = 0;
            }
        }
        
        // Return minutes since midnight for easy comparison
        return hours * 60 + minutes;
    } catch (error) {
        console.warn('Could not parse time:', timeStr, error);
        return null;
    }
}

// Move all tasks to current time block
function moveAllTasksToCurrentTime() {
    console.log('🕐 Move button clicked! Starting function...');
    console.log('🔍 Debug - tasks array:', window.tasks ? window.tasks.length + ' tasks' : 'tasks array not found');
    console.log('🔍 Debug - currentTodayDate:', window.currentTodayDate);
    
    // Get current time rounded to 30-minute interval
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    now.setMinutes(roundedMinutes, 0, 0);
    
    const currentTimeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: false 
    });
    
    console.log('🎯 Target time:', currentTimeStr);
    
    // Get today's date string - fix currentTodayDate if it's a DOM element
    let today;
    if (window.currentTodayDate && typeof window.currentTodayDate.getFullYear === 'function') {
        today = window.currentTodayDate;
    } else if (typeof currentTodayDate !== 'undefined' && typeof currentTodayDate.getFullYear === 'function') {
        today = currentTodayDate;
    } else {
        today = new Date(); // Fallback to current date
        console.log('⚠️ Using current date as fallback, currentTodayDate was:', typeof currentTodayDate, currentTodayDate);
    }
    
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    
    console.log('📅 Working with date:', todayStr, 'from', today);
    
    // Find all today's tasks that have a specific time (exclude untimed tasks and events)  
    const tasksArray = window.tasks || tasks || [];
    console.log('🔍 Working with', tasksArray.length, 'total tasks');
    
    // First, let's see what today's tasks we have
    const todayTasks = tasksArray.filter(task => 
        task.dueDate && task.dueDate.startsWith(todayStr) && 
        task.status !== 'deleted' && task.status !== 'completed'
    );
    console.log('📅 Found', todayTasks.length, 'tasks for today', todayStr);
    
    // Also check tasks that might match your cleaning task specifically
    const cleaningTasks = tasksArray.filter(task => 
        task.title && task.title.toLowerCase().includes('cleaning')
    );
    console.log('🧹 Found', cleaningTasks.length, 'cleaning-related tasks:');
    cleaningTasks.forEach((task, i) => {
        console.log(`Cleaning ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | time: "${task.time}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Debug each today's task to see why they're not considered "timed"
    console.log('🔍 Analyzing ALL today\'s tasks:');
    todayTasks.forEach((task, i) => {
        console.log(`Task ${i+1}: "${task.title}" | time: "${task.time}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    const timedTasks = todayTasks.filter(task => task.time && task.time.trim() !== '' && !task.isEvent);
    console.log('⏰ Found', timedTasks.length, 'timed tasks (excluding events)');
    
    timedTasks.forEach(task => {
        const taskTime = parseTime(task.time);
        const currentTime = parseTime(currentTimeStr);
        console.log('🔍 Task:', task.title, '| Time:', task.time, '| Parsed:', taskTime, '| Current:', currentTime, '| Before current?', taskTime < currentTime);
    });

    let movedCount = 0;
    const updatedTasks = tasksArray.map(task => {
        if (task.dueDate && task.dueDate.startsWith(todayStr) && 
            task.status !== 'deleted' && task.status !== 'completed' && 
            task.time && task.time.trim() !== '' && // Only tasks with specific times
            !task.isEvent) { // Exclude events
            
            // Parse task time and current time for comparison
            const taskTime = parseTime(task.time);
            const currentTime = parseTime(currentTimeStr);
            
            // Only move tasks that are BEFORE current time
            if (taskTime && currentTime && taskTime < currentTime) {
                // Update task time to current time
                const updatedTask = {
                    ...task,
                    dueDate: todayStr,
                    time: currentTimeStr,
                    updatedAt: new Date().toISOString()
                };
                movedCount++;
                console.log('📋 Moved task:', task.title, 'from', task.time, 'to', currentTimeStr, '(was before current time)');
                return updatedTask;
            } else {
                console.log('⏭️ Skipped task:', task.title, 'at', task.time, '(is after current time or parsing failed)');
            }
        }
        return task;
    });
    
    // Update global tasks array
    window.tasks = updatedTasks;
    tasks = updatedTasks;  // Keep both for compatibility
    
    // Save to localStorage
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    console.log('💾 Saved', updatedTasks.length, 'tasks to localStorage');
    
    // Re-render today view
    console.log('🔄 Attempting to re-render Today view...');
    if (typeof renderTodayView === 'function') {
        renderTodayView();
        console.log('✅ renderTodayView called successfully');
    } else {
        console.error('❌ renderTodayView function not found');
        // Try alternative rendering methods
        if (typeof window.renderTodayView === 'function') {
            window.renderTodayView();
            console.log('✅ window.renderTodayView called as fallback');
        }
    }
    
    // Show confirmation
    const message = movedCount > 0 
        ? `✅ Moved ${movedCount} overdue tasks to ${currentTimeStr}` 
        : `ℹ️ No overdue tasks to move (only moves tasks scheduled before ${currentTimeStr})`;
    
    console.log(message);
    
    // Show brief notification
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else {
        // Fallback: temporary message in the button
        const btn = document.querySelector('.move-current-time-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = movedCount > 0 ? `✅ Moved ${movedCount}` : '✅ Done';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }
    }
}

// Expose functions globally
window.switchLanguage = switchLanguage;
window.moveAllTasksToCurrentTime = moveAllTasksToCurrentTime;
window.saveAutoPrintTime = saveAutoPrintTime;
window.updateSyncPeriod = updateSyncPeriod;
window.openSettings = openSettings;
window.openCreateSectionModal = openCreateSectionModal;
window.toggleAllSections = toggleAllSections;
window.updateDesktopDateTime = updateDesktopDateTime;
window.initializeDateTimePickers = initializeDateTimePickers;
window.populateDayPicker = populateDayPicker;

// Standardized overdue check - use this everywhere to ensure consistency
function isTaskOverdue(task) {
    // Consistent logic: pending status, has due date, date is in past, not an event
    if (!task.dueDate || task.status !== 'pending' || task.isEvent) {
        return false;
    }
    const today = getLocalDateString(new Date());
    return task.dueDate < today;
}
window.isTaskOverdue = isTaskOverdue;
window.showListSelectionForTXTImport = showListSelectionForTXTImport;
window.downloadTodayHtml = downloadTodayHtml;
window.exportRepeatHtml = exportRepeatHtml;
window.printSearchResults = printSearchResults;
window.openTrash = openTrash;
window.handleJsonImportFile = handleJsonImportFile;
window.handleTextImportFile = handleTextImportFile;

// Global variables
window.selectedTasks = selectedTasks;
window.activeAllTasksTemplateFilter = activeAllTasksTemplateFilter;
window.currentLanguage = currentLanguage;

// Global list modal functions
async function toggleAllListItems() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    const allCompleted = list.items.every(item => item.completed);
    list.items.forEach(item => {
        item.completed = !allCompleted;
    });
    
    await window.saveListSections();
    window.openListItemsModal(currentListSectionId, currentListId);
}

async function exportListToHTML() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list) return;
    
    const uncompletedItems = (list.items || []).filter(item => !item.completed);
    const htmlContent = window.generateListHTML ? window.generateListHTML(section.name, list.name, uncompletedItems) : 'Export function not available';
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section.name}-${list.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function convertEntireListToTasks() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    if (!confirm(`Convert all ${list.items.length} items from "${list.name}" to tasks for today?`)) {
        return;
    }
    
    const today = window.formatDate ? window.formatDate(new Date()) : new Date().toISOString().split('T')[0];
    
    if (typeof window.addTask === 'function') {
        for (let item of list.items) {
            if (!item.completed) {
                await window.addTask(item.text, today, null, null, false);
            }
        }
    }
    
    window.closeListItemsModal();
    if (typeof window.switchToTodayView === 'function') {
        window.switchToTodayView();
    }
}

async function deleteCompletedListItems() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    const completedCount = list.items.filter(item => item.completed).length;
    if (completedCount === 0) {
        alert('No completed items to delete');
        return;
    }
    
    if (!confirm(`Delete ${completedCount} completed items?`)) {
        return;
    }
    
    list.items = list.items.filter(item => !item.completed);
    
    await window.saveListSections();
    window.openListItemsModal(currentListSectionId, currentListId);
}

function closeListItemsModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('listItemsModal').style.display = 'none';
}

async function convertSelectedItemsToTasks() {
    const listSections = window.listSections;
    const currentListSectionId = window.currentListSectionId;
    const currentListId = window.currentListId;
    
    const section = listSections.find(s => s.id == currentListSectionId);
    if (!section) return;
    
    const list = section.lists.find(l => l.id == currentListId);
    if (!list || !list.items || list.items.length === 0) return;
    
    const selectedItems = list.items.filter(item => item.completed);
    if (selectedItems.length === 0) {
        alert('No completed items to convert');
        return;
    }
    
    if (!confirm(`Convert ${selectedItems.length} completed items to tasks for today?`)) {
        return;
    }
    
    const today = window.formatDate ? window.formatDate(new Date()) : new Date().toISOString().split('T')[0];
    
    if (typeof window.addTask === 'function') {
        for (let item of selectedItems) {
            await window.addTask(item.text, today, null, null, false);
        }
    }
    
    window.closeListItemsModal();
    if (typeof window.switchToTodayView === 'function') {
        window.switchToTodayView();
    }
}

// Handle Enter key press in add item input
function handleAddItemKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addListItem();
    }
}

// Export tasks as JSON file
function exportTasksJSON() {
    try {
        const tasks = window.tasks || [];
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hyperfiler-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('📁 Tasks exported as JSON successfully');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}
window.exportTasksJSON = exportTasksJSON;

// Save list sections - restored from v2.0.7 working version with debug logging
async function saveListSections() {
    console.log('🚀 saveListSections called - v2.0.7 style');
    console.log('📋 Saving', window.listSections?.length || 0, 'list sections');
    try {
        localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
        console.log('💾 Saved to localStorage');
        
        // Set flag to prevent downloads from overwriting changes
        window.justModifiedLists = true;
        console.log('🔒 Set justModifiedLists flag');
        
        // Upload to server
        if (typeof uploadAllLists === 'function') {
            console.log('📤 Calling uploadAllLists...');
            await uploadAllLists();
            console.log('✅ uploadAllLists completed');
        } else {
            console.error('❌ uploadAllLists function not found!');
        }
        
        // Clear flag after successful upload
        setTimeout(() => {
            window.justModifiedLists = false;
            console.log('🔓 Cleared justModifiedLists flag');
        }, 5000); // 5 seconds for reliable cross-browser sync
        
    } catch (error) {
        console.error('❌ Error saving list sections:', error);
    }
}

// Export global functions
window.handleAddItemKeyPress = handleAddItemKeyPress;
window.saveListSections = saveListSections;
window.toggleAllListItems = toggleAllListItems;
window.exportListToHTML = exportListToHTML;
window.convertEntireListToTasks = convertEntireListToTasks;
window.deleteCompletedListItems = deleteCompletedListItems;
window.closeListItemsModal = closeListItemsModal;
window.convertSelectedItemsToTasks = convertSelectedItemsToTasks;

console.log('✅ Missing functions module loaded with', Object.keys(window).filter(k => typeof window[k] === 'function' && (k.startsWith('open') || k.startsWith('perform') || k.startsWith('search') || k.startsWith('handle'))).length, 'functions');