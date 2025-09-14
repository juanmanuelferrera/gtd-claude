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

// Make template filter functions globally accessible
window.filterWeekByTemplate = filterWeekByTemplate;
window.clearWeekTemplateFilter = clearWeekTemplateFilter;
window.filterMonthByTemplate = filterMonthByTemplate;
window.clearMonthTemplateFilter = clearMonthTemplateFilter;
window.renderWeekTemplateFilters = renderWeekTemplateFilters;
window.renderMonthTemplateFilters = renderMonthTemplateFilters;

// Simple calendar dropdown picker for task cards (like time dropdown)
function openIOSDateTimePicker(taskId, currentDate, currentTime, buttonElement) {
    // Remove any existing picker
    if (window.currentDateDropdown) {
        document.body.removeChild(window.currentDateDropdown);
        window.currentDateDropdown = null;
    }
    
    console.log('📅 Opening calendar dropdown for task:', taskId);
    
    // Get button position
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.3); z-index: 10000;
    `;
    
    // Create calendar card
    const calendar = document.createElement('div');
    calendar.style.cssText = `
        background: white; border-radius: 12px; width: 280px; 
        padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: fixed; z-index: 10001;
        left: ${Math.max(10, Math.min(buttonRect.left, window.innerWidth - 300))}px;
        top: ${Math.max(10, Math.min(buttonRect.bottom + 10, window.innerHeight - 350))}px;
        border: 1px solid #e0e0e0; max-height: 320px; overflow-y: auto;
    `;
    
    // Get current date info
    const today = new Date();
    const currentDateObj = currentDate ? new Date(currentDate + 'T00:00:00') : today;
    const currentMonth = currentDateObj.getMonth();
    const currentYear = currentDateObj.getFullYear();
    const currentDay = currentDateObj.getDate();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Create month calendar
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // Calculate first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = `
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <div style="font-weight: 600; font-size: 16px; color: #333; margin-bottom: 8px;">
                📅 ${monthNames[currentMonth]} ${currentYear}
            </div>
            <div style="display: flex; gap: 6px; justify-content: center;">
                <button onclick="changeCalendarMonth('${taskId}', -1)" style="background: #f0f0f0; border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px;">‹ Prev</button>
                <button onclick="setCalendarToday('${taskId}')" style="background: #007AFF; color: white; border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Today</button>
                <button onclick="changeCalendarMonth('${taskId}', 1)" style="background: #f0f0f0; border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Next ›</button>
            </div>
        </div>
        
        <!-- Calendar Grid -->
        <div id="calendar-grid-${taskId}" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
            <!-- Day headers -->
            ${daysOfWeek.map(day => 
                `<div style="text-align: center; padding: 8px 4px; font-size: 11px; font-weight: 600; color: #666;">${day}</div>`
            ).join('')}
            
            <!-- Empty cells for days before month starts -->
            ${Array(firstDay).fill().map(() => 
                `<div style="padding: 8px;"></div>`
            ).join('')}
            
            <!-- Days of the month -->
            ${Array.from({length: daysInMonth}, (_, i) => {
                const day = i + 1;
                const isToday = day === todayDay && currentMonth === todayMonth && currentYear === todayYear;
                const isSelected = day === currentDay;
                
                let style = 'padding: 8px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 13px; font-weight: 500;';
                
                if (isSelected) {
                    style += ' background: #007AFF; color: white;';
                } else if (isToday) {
                    style += ' background: #e3f2fd; color: #1976d2; font-weight: 600;';
                } else {
                    style += ' background: transparent; color: #333;';
                }
                
                return `<div onclick="selectCalendarDate('${taskId}', ${day})" 
                             style="${style}"
                             onmouseover="if(!this.style.color.includes('white')) { this.style.background='#f0f8ff'; }"
                             onmouseout="if(!this.style.color.includes('white')) { this.style.background='${isToday ? '#e3f2fd' : 'transparent'}'; }">
                            ${day}
                        </div>`;
            }).join('')}
        </div>
        
        <!-- Quick Actions -->
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
            <div style="display: flex; gap: 6px;">
                <button onclick="setCalendarQuickDate('${taskId}', 0)" style="flex: 1; padding: 8px; background: #e3f2fd; color: #1976d2; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">Today</button>
                <button onclick="setCalendarQuickDate('${taskId}', 1)" style="flex: 1; padding: 8px; background: #fff3e0; color: #f57c00; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">Tomorrow</button>
                <button onclick="setCalendarQuickDate('${taskId}', 7)" style="flex: 1; padding: 8px; background: #e8f5e8; color: #388e3c; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">+1W</button>
            </div>
        </div>
    `;
    
    calendar.innerHTML = html;
    
    // Store references
    window.currentDateDropdown = overlay;
    window.currentCalendarTaskId = taskId;
    window.currentCalendarMonth = currentMonth;
    window.currentCalendarYear = currentYear;
    
    overlay.appendChild(calendar);
    document.body.appendChild(overlay);
    
    // Auto-close after 10 seconds
    window.calendarAutoCloseTimer = setTimeout(() => {
        closeDateDropdown();
    }, 10000);
    
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDateDropdown();
        }
    });
}

// Close calendar dropdown
function closeDateDropdown() {
    if (window.currentDateDropdown) {
        document.body.removeChild(window.currentDateDropdown);
        window.currentDateDropdown = null;
    }
    if (window.calendarAutoCloseTimer) {
        clearTimeout(window.calendarAutoCloseTimer);
        window.calendarAutoCloseTimer = null;
    }
}

// Select a specific date in calendar
function selectCalendarDate(taskId, day) {
    const dateString = `${window.currentCalendarYear}-${(window.currentCalendarMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log('📅 Selected date:', dateString);
    
    // Update task date
    updateTaskDate(taskId, dateString, { stopPropagation: () => {} });
    
    // Close dropdown
    closeDateDropdown();
    
    // Show success feedback
    showMessage('Date updated!', 'success');
}

// Change calendar month (prev/next)
function changeCalendarMonth(taskId, direction) {
    window.currentCalendarMonth += direction;
    
    if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
    } else if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
    }
    
    // Refresh calendar
    const currentTask = window.tasks?.find(t => t.id === taskId);
    const currentDate = currentTask?.dueDate || getLocalDateString(new Date());
    openIOSDateTimePicker(taskId, currentDate, '', document.querySelector(`[onclick*="openIOSDateTimePicker('${taskId}'"]`));
}

// Set calendar to today
function setCalendarToday(taskId) {
    const today = new Date();
    window.currentCalendarMonth = today.getMonth();
    window.currentCalendarYear = today.getFullYear();
    
    // Select today's date
    selectCalendarDate(taskId, today.getDate());
}

// Quick date selection for calendar
function setCalendarQuickDate(taskId, daysFromToday) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    
    window.currentCalendarMonth = date.getMonth();
    window.currentCalendarYear = date.getFullYear();
    
    // Select the date
    selectCalendarDate(taskId, date.getDate());
}

// Time dropdown picker - Grid Card Layout
function openTimeDropdown(taskId, currentTime, buttonElement) {
    // Remove any existing picker
    if (window.currentTimeDropdown) {
        document.body.removeChild(window.currentTimeDropdown);
    }
    
    console.log('🕐 Opening time grid card for task:', taskId);
    
    // Get button position
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.3); z-index: 10000;
    `;
    
    // Create time card
    const timeCard = document.createElement('div');
    timeCard.style.cssText = `
        background: white; border-radius: 12px; width: 240px; 
        padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: fixed; z-index: 10001;
        left: ${Math.max(10, Math.min(buttonRect.left - 30, window.innerWidth - 260))}px;
        top: ${Math.max(10, Math.min(buttonRect.bottom + 10, window.innerHeight - 320))}px;
        border: 1px solid #e0e0e0;
    `;
    
    // Generate morning times (6:00 - 11:00)
    const morningTimes = [];
    for (let hour = 6; hour <= 11; hour++) {
        morningTimes.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    // Generate afternoon times (12:00 - 17:00)
    const afternoonTimes = [];
    for (let hour = 12; hour <= 17; hour++) {
        afternoonTimes.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    // Generate evening times (18:00 - 22:00)
    const eveningTimes = [];
    for (let hour = 18; hour <= 22; hour++) {
        eveningTimes.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    let html = `
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <button onclick="clearTimeAndClose('${taskId}')" 
                    style="background: #f0f0f0; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 600;">
                ✕ Clear Time (Untimed)
            </button>
        </div>
        
        <!-- Morning Times -->
        <div style="margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                ${morningTimes.map(time => {
                    const isSelected = time === currentTime;
                    const baseStyle = 'padding: 6px 4px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 11px; font-weight: 500; transition: all 0.2s;';
                    const colorStyle = isSelected 
                        ? 'background: #007AFF; color: white;'
                        : 'background: #e3f2fd; color: #1976d2;';
                    
                    return `<div onclick="setTimeAndClose('${taskId}', '${time}')" 
                                 style="${baseStyle} ${colorStyle}"
                                 onmouseover="this.style.background='${isSelected ? '#0056CC' : '#bbdefb'}'"
                                 onmouseout="this.style.background='${isSelected ? '#007AFF' : '#e3f2fd'}'">
                                ${time}
                            </div>`;
                }).join('')}
            </div>
        </div>
        
        <!-- Afternoon Times -->
        <div style="margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                ${afternoonTimes.map(time => {
                    const isSelected = time === currentTime;
                    const baseStyle = 'padding: 6px 4px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 11px; font-weight: 500; transition: all 0.2s;';
                    const colorStyle = isSelected 
                        ? 'background: #007AFF; color: white;'
                        : 'background: #fff3e0; color: #f57c00;';
                    
                    return `<div onclick="setTimeAndClose('${taskId}', '${time}')" 
                                 style="${baseStyle} ${colorStyle}"
                                 onmouseover="this.style.background='${isSelected ? '#0056CC' : '#ffe0b2'}'"
                                 onmouseout="this.style.background='${isSelected ? '#007AFF' : '#fff3e0'}'">
                                ${time}
                            </div>`;
                }).join('')}
            </div>
        </div>
        
        <!-- Evening Times -->
        <div style="margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                ${eveningTimes.map(time => {
                    const isSelected = time === currentTime;
                    const baseStyle = 'padding: 6px 4px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 11px; font-weight: 500; transition: all 0.2s;';
                    const colorStyle = isSelected 
                        ? 'background: #007AFF; color: white;'
                        : 'background: #f3e5f5; color: #7b1fa2;';
                    
                    return `<div onclick="setTimeAndClose('${taskId}', '${time}')" 
                                 style="${baseStyle} ${colorStyle}"
                                 onmouseover="this.style.background='${isSelected ? '#0056CC' : '#e1bee7'}'"
                                 onmouseout="this.style.background='${isSelected ? '#007AFF' : '#f3e5f5'}'">
                                ${time}
                            </div>`;
                }).join('')}
            </div>
        </div>
    `;
    
    timeCard.innerHTML = html;
    
    // Store references
    window.currentTimeDropdown = overlay;
    
    overlay.appendChild(timeCard);
    document.body.appendChild(overlay);
    
    // Auto-close after 10 seconds
    window.timeAutoCloseTimer = setTimeout(() => {
        closeTimeDropdown();
    }, 10000);
    
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

// Quick time selection
function setTimeQuick(taskId, timeType) {
    let time = '';
    switch(timeType) {
        case 'morning':
            time = '09:00';
            break;
        case 'noon':
            time = '12:00';
            break;
        case 'afternoon':
            time = '15:00';
            break;
        case 'evening':
            time = '18:00';
            break;
    }
    
    if (time) {
        updateTaskTime(taskId, time, { stopPropagation: () => {} });
        closeTimeDropdown();
        showMessage(`Time set to ${time}`, 'success');
    }
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
    console.log('🔍 DEBUG: performAllTasksSearch called (missing-functions.js version)');
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
    
    // First, exclude deleted tasks (they should only appear in Trash view)
    filteredTasks = filteredTasks.filter(task => {
        return task.status !== 'deleted';
    });
    
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
    
    // Generate template filters for All Tasks view (both desktop and mobile)
    if (typeof renderAllTasksTemplateFilters === 'function') {
        renderAllTasksTemplateFilters(filteredTasks);
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
    // Use the selectedTaskIds variable from ui.js for consistency
    const selectedTasksSet = window.selectedTaskIds || selectedTasks || new Set();
    
    if (selectedTasksSet.size === 0) {
        alert('Please select tasks to delete first');
        return;
    }
    
    const taskCount = selectedTasksSet.size;
    if (!confirm(`Delete ${taskCount} selected task${taskCount > 1 ? 's' : ''}?`)) {
        return;
    }
    
    // Delete selected tasks
    const tasksToDelete = Array.from(selectedTasksSet);
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
    selectedTasksSet.clear();
    if (window.selectedTaskIds) {
        window.selectedTaskIds.clear();
    }
    
    // Save and refresh
    if (typeof saveTasksToLocalStorage === 'function') {
        saveTasksToLocalStorage();
    }
    if (typeof performAllTasksSearch === 'function') {
        performAllTasksSearch();
    } else if (typeof renderCurrentView === 'function') {
        renderCurrentView();
    }
}

function delaySelectedTasks(days) {
    // Use the selectedTaskIds variable from ui.js for consistency
    const selectedTasksSet = window.selectedTaskIds || selectedTasks || new Set();
    
    if (selectedTasksSet.size === 0) {
        alert('Please select tasks to delay first');
        return;
    }
    
    const tasksToDelay = Array.from(selectedTasksSet);
    tasksToDelay.forEach(taskId => {
        if (typeof delayTask === 'function') {
            delayTask(taskId, days);
        }
    });
    
    // Clear selection
    selectedTasksSet.clear();
    if (window.selectedTaskIds) {
        window.selectedTaskIds.clear();
    }
    
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
                // ALWAYS OVERWRITE - Clear existing tasks and replace with imported ones
                console.log(`🔄 OVERWRITE MODE: Replacing ${tasks.length} existing tasks with ${importData.tasks.length} imported tasks`);
                tasks.length = 0; // Clear existing tasks
                tasks.push(...importData.tasks); // Add imported tasks
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                alert(`✅ REPLACED all tasks with ${importData.tasks.length} imported tasks!`);
                
                // Set sync protection flag and upload to server
                window.justModifiedTasks = true;
                setTimeout(async () => {
                    try {
                        if (typeof uploadAllTasks === 'function') {
                            await uploadAllTasks();
                            console.log('✅ Tasks synced to server after import');
                        }
                        setTimeout(() => {
                            window.justModifiedTasks = false;
                        }, 5000);
                    } catch (error) {
                        console.error('❌ Failed to sync tasks after import:', error);
                    }
                }, 1000);
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
    console.log('🔍 DEBUG: clearAllTasks called');
    try {
        const firstConfirmation = confirm('⚠️ WARNING: This will DELETE ALL your tasks, events, and templates FOREVER!\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to continue?');
        
        if (!firstConfirmation) {
            console.log('🔍 DEBUG: First confirmation cancelled');
            return;
        }
        
        const secondConfirmation = confirm('🔴 FINAL WARNING: You are about to PERMANENTLY DELETE everything!\n\nType YES in the next dialog to confirm.');
        
        if (!secondConfirmation) {
            console.log('🔍 DEBUG: Second confirmation cancelled');
            return;
        }
        
        const finalConfirmation = prompt('Type "DELETE EVERYTHING" to confirm:');
        
        if (finalConfirmation !== 'DELETE EVERYTHING') {
            console.log('🔍 DEBUG: Final confirmation failed:', finalConfirmation);
            alert('Operation cancelled.');
            return;
        }
        
        console.log('🔍 DEBUG: All confirmations passed, clearing data...');
        
        // Clear everything
        if (typeof tasks !== 'undefined') {
            tasks = [];
            console.log('🔍 DEBUG: tasks cleared');
        }
        if (typeof window.listSections !== 'undefined') {
            window.listSections = [];
            console.log('🔍 DEBUG: listSections cleared');
        }
        if (typeof customTemplates !== 'undefined') {
            customTemplates = [];
            console.log('🔍 DEBUG: customTemplates cleared');
        }
        
        // Save changes
        if (typeof saveTasksToLocalStorage === 'function') {
            console.log('🔍 DEBUG: Calling saveTasksToLocalStorage');
            saveTasksToLocalStorage();
        } else {
            console.log('🔍 DEBUG: saveTasksToLocalStorage not available');
        }
        
        localStorage.removeItem('gtd_list_sections');
        localStorage.removeItem('gtdTemplates');
        console.log('🔍 DEBUG: localStorage items removed');
        
        // Refresh UI
        if (typeof renderCurrentView === 'function') {
            console.log('🔍 DEBUG: Calling renderCurrentView');
            renderCurrentView();
        } else {
            console.log('🔍 DEBUG: renderCurrentView not available, trying alternative refresh');
            if (typeof renderTodayView === 'function') {
                renderTodayView();
            } else if (typeof location !== 'undefined') {
                location.reload();
            }
        }
        
        alert('All data has been cleared.');
        console.log('🔍 DEBUG: clearAllTasks completed successfully');
        
    } catch (error) {
        console.error('🔍 ERROR in clearAllTasks:', error);
        alert('Error clearing tasks: ' + error.message);
    }
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
    console.log('🔧 DEBUG: openDateTimeModal called (from missing-functions.js)');
    const modal = document.getElementById('dateTimeModal');
    if (modal) {
        // Get current values or set defaults
        const currentDate = document.getElementById('editTaskDateOnly').value;
        const currentTime = document.getElementById('editTaskTimeOnly').value;
        
        console.log('Current date:', currentDate, 'Current time:', currentTime);
        
        // Set default to today if no date is set
        const defaultDate = currentDate || getLocalDateString(new Date());
        const defaultTime = currentTime || '';
        
        // Detect device type and show appropriate version
        const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('📱 Detected mobile device - showing mobile version');
            // Show mobile version, hide desktop version
            const mobileModal = document.querySelector('.modal-content.mobile-only');
            const desktopModal = document.querySelector('.modal-content.desktop-only');
            if (mobileModal) mobileModal.style.display = 'block';
            if (desktopModal) desktopModal.style.display = 'none';
            
            // Initialize mobile pickers
            if (typeof initializeMobileDatePickers === 'function') {
                initializeMobileDatePickers();
            }
        } else {
            console.log('🖥️ Detected desktop device - showing desktop version');
            // Show desktop version, hide mobile version
            const mobileModal = document.querySelector('.modal-content.mobile-only');
            const desktopModal = document.querySelector('.modal-content.desktop-only');
            if (mobileModal) mobileModal.style.display = 'none';
            if (desktopModal) desktopModal.style.display = 'block';
            
            // Initialize desktop pickers (date only)
            if (typeof initializeDesktopDatePickers === 'function') {
                initializeDesktopDatePickers();
            } else {
                // Fallback initialization
                initializeDateTimePickers(defaultDate, defaultTime);
            }
        }
        
        modal.style.display = 'block';
        console.log('Modal should be visible now');
    } else {
        console.error('dateTimeModal not found!');
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
            
            // Ask user if they want to overwrite or add to existing data
            const shouldOverwrite = confirm('⚠️ IMPORT MODE SELECTION:\n\n✅ Click OK to REPLACE ALL existing data (RECOMMENDED)\n❌ Click Cancel to ADD to existing data (creates duplicates)\n\n🔄 FOR CLEAN RESTORE: Click OK to completely replace everything with backup data.');
            
            if (importData.tasks && Array.isArray(importData.tasks)) {
                if (shouldOverwrite) {
                    // OVERWRITE: Replace all tasks
                    tasks.length = 0; // Clear existing tasks
                    tasks.push(...importData.tasks);
                    console.log(`🔄 OVERWRITE: Replaced all tasks with ${importData.tasks.length} imported tasks`);
                } else {
                    // ADD: Append to existing tasks
                    tasks.push(...importData.tasks);
                    console.log(`➕ ADD: Added ${importData.tasks.length} tasks to existing ${tasks.length - importData.tasks.length} tasks`);
                }
                
                if (typeof saveTasksToLocalStorage === 'function') {
                    saveTasksToLocalStorage();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                const action = shouldOverwrite ? 'replaced all tasks with' : 'added';
                alert(`Successfully ${action} ${importData.tasks.length} imported tasks!`);
            }
            
            // Import list sections if available
            if (importData.listSections && Array.isArray(importData.listSections)) {
                if (shouldOverwrite) {
                    // OVERWRITE: Replace all lists
                    window.listSections.length = 0; // Clear existing lists
                    window.listSections.push(...importData.listSections);
                    console.log(`🔄 OVERWRITE: Replaced all lists with ${importData.listSections.length} imported lists`);
                } else {
                    // ADD: Append to existing lists
                    window.listSections.push(...importData.listSections);
                    console.log(`➕ ADD: Added ${importData.listSections.length} lists to existing data`);
                }
                localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
            }
            
            // Import templates if available
            if (importData.templates && Array.isArray(importData.templates)) {
                if (shouldOverwrite) {
                    // OVERWRITE: Replace all templates
                    if (typeof window.customTemplates !== 'undefined') {
                        window.customTemplates.length = 0; // Clear existing templates
                        window.customTemplates.push(...importData.templates);
                        console.log(`🔄 OVERWRITE: Replaced all templates with ${importData.templates.length} imported templates`);
                    }
                } else {
                    // ADD: Append to existing templates
                    if (typeof window.customTemplates !== 'undefined') {
                        window.customTemplates.push(...importData.templates);
                        console.log(`➕ ADD: Added ${importData.templates.length} templates to existing data`);
                    }
                }
                localStorage.setItem('gtd_custom_templates', JSON.stringify(window.customTemplates));
            }
            
            // Force sync to server after import
            console.log('📤 Starting sync to server after import...');
            setTimeout(async () => {
                try {
                    if (typeof uploadAllTasks === 'function') {
                        await uploadAllTasks();
                        console.log('✅ Tasks synced to server');
                    }
                    if (typeof uploadAllLists === 'function') {
                        await uploadAllLists();
                        console.log('✅ Lists synced to server');  
                    }
                    if (typeof uploadAllTemplates === 'function') {
                        await uploadAllTemplates();
                        console.log('✅ Templates synced to server');
                    }
                    console.log('✅ All data synced to server successfully');
                } catch (error) {
                    console.error('❌ Server sync failed after import:', error);
                }
            }, 1000);
            
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

async function addNewTemplate() {
    console.log('🏷️ addNewTemplate called');
    const input = document.getElementById('newTemplateInput');
    if (!input) {
        console.error('❌ newTemplateInput not found');
        return;
    }
    
    let template = input.value.trim();
    if (!template) {
        console.log('⚠️ No template text entered');
        return;
    }
    
    // Ensure template starts with @
    if (!template.startsWith('@')) {
        template = '@' + template;
    }
    
    // Remove any spaces
    template = template.replace(/\s/g, '');
    
    console.log('📝 Adding template:', template);
    console.log('📝 Template includes @?', template.includes('@'));
    
    // Initialize customTemplates if needed
    if (typeof window.customTemplates === 'undefined') {
        window.customTemplates = [];
    }
    
    // Check if template already exists
    if (window.customTemplates.includes(template)) {
        alert('Template already exists');
        return;
    }
    
    // Add template
    window.customTemplates.push(template);
    console.log('📝 Template added to array:', template);
    console.log('📝 Full customTemplates array:', window.customTemplates);
    console.log('✅ Template added, current templates:', window.customTemplates);
    
    // Ensure global customTemplates variable is also updated
    if (typeof window.customTemplates !== 'undefined' && Array.isArray(window.customTemplates)) {
        window.customTemplates = [...window.customTemplates];
        // Sync with global customTemplates variable used by renderTemplateButtons
        if (typeof customTemplates !== 'undefined') {
            customTemplates.splice(0, customTemplates.length, ...window.customTemplates);
            console.log('🔄 Synced global customTemplates:', customTemplates);
        } else {
            window.customTemplates = window.customTemplates;
            console.log('🔄 Set global customTemplates reference');
        }
    }
    
    // Save templates persistently
    if (typeof saveTemplates === 'function') {
        console.log('💾 Saving templates...');
        await saveTemplates();
    } else {
        // Fallback: save directly to localStorage
        console.log('💾 Saving templates to localStorage (fallback)...');
        localStorage.setItem('gtd_custom_templates', JSON.stringify(window.customTemplates));
    }
    
    // Clear input
    input.value = '';
    
    // Force re-render template buttons multiple times
    console.log('🔄 About to render template buttons...');
    if (typeof renderTemplateButtons === 'function') {
        console.log('🔄 Rendering template buttons immediately...');
        renderTemplateButtons();
        
        // Add delayed renders to ensure it works
        setTimeout(() => {
            console.log('🔄 Rendering template buttons (100ms delay)...');
            renderTemplateButtons();
        }, 100);
        
        setTimeout(() => {
            console.log('🔄 Rendering template buttons (500ms delay)...');
            renderTemplateButtons();
        }, 500);
    } else {
        console.error('❌ renderTemplateButtons function not available');
    }
}

// Make function globally accessible
window.addNewTemplate = addNewTemplate;

/**
 * Emergency function to recover lists from server
 */
async function emergencyRecoverLists() {
    console.log('🚨 EMERGENCY: Attempting to recover lists from server...');
    
    if (!window.currentUser?.user?.id) {
        console.error('❌ No user logged in');
        alert('Please log in first to recover lists');
        return;
    }
    
    try {
        // First, let's try using the existing getAuthHeaders function if available
        let headers;
        if (typeof getAuthHeaders === 'function') {
            console.log('🔑 Using getAuthHeaders function...');
            headers = getAuthHeaders();
        } else {
            console.log('🔑 Using manual auth headers...');
            headers = {
                'Authorization': `Bearer ${window.currentUser.token}`,
                'Content-Type': 'application/json'
            };
        }
        
        console.log('🔄 Forcing download from server...');
        console.log('🔗 API URL:', `${window.API_BASE}/lists/${window.currentUser.user.id}`);
        console.log('🔑 Auth headers:', headers);
        
        const response = await fetch(`${window.API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: headers
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        if (response.status === 401) {
            console.error('❌ Unauthorized - token might be expired');
            alert('❌ Authentication expired. Please refresh the page and log in again, then retry.');
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`Server responded with ${response.status}: ${response.statusText}\n${errorText}`);
        }
        
        const data = await response.json();
        console.log('📥 Server response:', data);
        
        const serverListSections = data.listSections || [];
        console.log(`📋 Found ${serverListSections.length} lists on server`);
        
        if (serverListSections.length > 0) {
            // Restore lists
            window.listSections = serverListSections;
            localStorage.setItem('gtd_list_sections', JSON.stringify(serverListSections));
            
            console.log('✅ Lists recovered from server!');
            alert(`✅ Recovered ${serverListSections.length} lists from server!`);
            
            // Refresh UI if possible
            if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
            
            return serverListSections;
        } else {
            console.log('⚠️ No lists found on server');
            alert('No lists found on server to recover. They might not have been synced before being lost.');
        }
        
    } catch (error) {
        console.error('❌ Recovery failed:', error);
        alert(`Recovery failed: ${error.message}`);
    }
}

// Make function globally accessible for emergency use
window.emergencyRecoverLists = emergencyRecoverLists;

/**
 * Try to refresh authentication and then recover lists
 */
async function recoverListsWithAuthRefresh() {
    console.log('🔄 Attempting to refresh authentication...');
    
    try {
        // Try to refresh the auth session
        if (typeof refreshAuthToken === 'function') {
            console.log('🔑 Refreshing auth token...');
            await refreshAuthToken();
        } else if (typeof downloadAllTasks === 'function') {
            // Sometimes downloading tasks triggers a token refresh
            console.log('🔄 Triggering sync to refresh token...');
            await downloadAllTasks();
        }
        
        // Wait a moment for auth to settle
        setTimeout(async () => {
            console.log('🔄 Retrying list recovery...');
            await emergencyRecoverLists();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Auth refresh failed:', error);
        alert('❌ Could not refresh authentication. Please refresh the page and log in again.');
    }
}

// Make function globally accessible
window.recoverListsWithAuthRefresh = recoverListsWithAuthRefresh;

/**
 * Import ONLY Lists from a JSON backup file
 * Useful when you want to restore lists but keep current tasks/templates
 */
async function importListsOnlyFromJSON() {
    console.log('📋 Starting Lists-only import...');
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                console.log('📥 Loaded JSON data:', importData);
                
                // Check if listSections exist in the backup
                if (!importData.listSections || !Array.isArray(importData.listSections)) {
                    alert('❌ No Lists found in this backup file.\n\nLook for "listSections" property in the JSON.');
                    return;
                }
                
                const listsToImport = importData.listSections;
                console.log(`📋 Found ${listsToImport.length} lists in backup:`, listsToImport);
                
                // Show preview of what will be imported
                const listNames = listsToImport.map(list => list.title || list.name || 'Unnamed List').join(', ');
                const confirmMessage = `📋 IMPORT LISTS ONLY\n\nFound ${listsToImport.length} lists:\n${listNames}\n\n⚠️ This will REPLACE your current lists but keep your tasks and templates.\n\nProceed?`;
                
                if (confirm(confirmMessage)) {
                    // Replace lists
                    window.listSections = [...listsToImport]; // Create a copy
                    localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
                    
                    console.log('✅ Lists imported successfully');
                    alert(`✅ Successfully imported ${listsToImport.length} lists!\n\nYour tasks and templates remain unchanged.`);
                    
                    // Refresh UI if in Lists view
                    if (typeof renderCurrentView === 'function') {
                        renderCurrentView();
                    }
                    
                    // CRITICAL: Set flag to prevent downloads from overwriting our import
                    window.justModifiedLists = true;
                    console.log('🔒 Set justModifiedLists flag to protect import');
                    
                    // Sync to server IMMEDIATELY
                    (async () => {
                        try {
                            if (typeof uploadAllLists === 'function') {
                                await uploadAllLists();
                                console.log('✅ Lists synced to server successfully');
                                
                                // Clear flag after successful upload  
                                setTimeout(() => {
                                    window.justModifiedLists = false;
                                    console.log('🔓 Cleared justModifiedLists protection flag');
                                }, 5000);
                            }
                        } catch (error) {
                            console.error('❌ Failed to sync lists to server:', error);
                            // Clear flag even on error to avoid permanent blocking
                            setTimeout(() => {
                                window.justModifiedLists = false;
                                console.log('🔓 Cleared justModifiedLists flag after error');
                            }, 10000);
                        }
                    })();
                }
                
            } catch (error) {
                console.error('❌ JSON parsing failed:', error);
                alert('❌ Failed to read JSON file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
}

// Make function globally accessible
window.importListsOnlyFromJSON = importListsOnlyFromJSON;

/**
 * Emergency function to bypass sync protection and force download lists from server
 * Use this when lists disappeared due to sync timing issues
 */
async function forceDownloadListsFromServer() {
    console.log('🚨 FORCE DOWNLOAD: Bypassing all protection to get lists from server...');
    
    if (!window.currentUser?.user?.id) {
        alert('❌ No user logged in. Please log in first.');
        return;
    }
    
    try {
        // Get auth headers
        let headers;
        if (typeof getAuthHeaders === 'function') {
            headers = getAuthHeaders();
        } else {
            headers = {
                'Authorization': `Bearer ${window.currentUser.token}`,
                'Content-Type': 'application/json'
            };
        }
        
        console.log('🔄 Forcing download from server (bypassing ALL protections)...');
        const response = await fetch(`${window.API_BASE}/lists/${window.currentUser.user.id}`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 Server response:', data);
        
        const serverListSections = data.listSections || [];
        console.log(`📋 Found ${serverListSections.length} lists on server`);
        
        if (serverListSections.length > 0) {
            // Force restore lists (bypassing all safety checks)
            window.listSections = serverListSections;
            localStorage.setItem('gtd_list_sections', JSON.stringify(serverListSections));
            
            console.log('✅ Lists force-downloaded from server!');
            alert(`✅ Force-recovered ${serverListSections.length} lists from server!`);
            
            // Refresh UI
            if (typeof renderCurrentView === 'function') {
                renderCurrentView();
            }
            
            return serverListSections;
        } else {
            console.log('⚠️ No lists found on server');
            alert('❌ No lists found on server. They may not have been uploaded yet.');
        }
        
    } catch (error) {
        console.error('❌ Force download failed:', error);
        alert(`❌ Force download failed: ${error.message}`);
    }
}

// Make function globally accessible
window.forceDownloadListsFromServer = forceDownloadListsFromServer;

/**
 * Force import JSON backup with OVERWRITE mode (no questions asked)
 * Use this when you want to completely replace all data
 */
async function forceImportJSONOverwrite() {
    console.log('🔄 FORCE IMPORT: Opening file picker for JSON overwrite...');
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                console.log('📥 Loaded JSON data for FORCE OVERWRITE:', importData);
                
                // Final confirmation
                const finalConfirm = confirm(`🔄 FORCE OVERWRITE CONFIRMATION\n\nThis will COMPLETELY REPLACE all your data with the backup:\n\n• Tasks: ${importData.tasks?.length || 0}\n• Lists: ${importData.listSections?.length || 0}\n• Templates: ${importData.templates?.length || importData.customTemplates?.length || 0}\n\nThis action CANNOT be undone!\n\nProceed?`);
                
                if (!finalConfirm) {
                    alert('❌ Import cancelled.');
                    return;
                }
                
                // FORCE OVERWRITE ALL DATA
                console.log('🔄 FORCE OVERWRITE: Replacing ALL data...');
                
                // Replace tasks
                if (importData.tasks && Array.isArray(importData.tasks)) {
                    tasks.length = 0;
                    tasks.push(...importData.tasks);
                    if (typeof saveTasksToLocalStorage === 'function') {
                        saveTasksToLocalStorage();
                    }
                    console.log(`✅ OVERWRITE: Replaced with ${importData.tasks.length} tasks`);
                }
                
                // Replace lists
                if (importData.listSections && Array.isArray(importData.listSections)) {
                    window.listSections.length = 0;
                    window.listSections.push(...importData.listSections);
                    localStorage.setItem('gtd_list_sections', JSON.stringify(window.listSections));
                    console.log(`✅ OVERWRITE: Replaced with ${importData.listSections.length} lists`);
                }
                
                // Replace templates
                const templates = importData.templates || importData.customTemplates;
                if (templates && Array.isArray(templates)) {
                    if (typeof window.customTemplates !== 'undefined') {
                        window.customTemplates.length = 0;
                        window.customTemplates.push(...templates);
                        localStorage.setItem('gtd_custom_templates', JSON.stringify(window.customTemplates));
                        console.log(`✅ OVERWRITE: Replaced with ${templates.length} templates`);
                    }
                }
                
                alert('✅ FORCE OVERWRITE COMPLETE!\n\nAll data has been replaced with the backup.');
                
                // Refresh UI
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
                
                // Force sync to server
                setTimeout(async () => {
                    try {
                        window.justModifiedTasks = true;
                        window.justModifiedLists = true;
                        window.justModifiedTemplates = true;
                        
                        if (typeof uploadAllTasks === 'function') await uploadAllTasks();
                        if (typeof uploadAllLists === 'function') await uploadAllLists();
                        if (typeof uploadAllTemplates === 'function') await uploadAllTemplates();
                        
                        console.log('✅ All data synced to server after force import');
                    } catch (error) {
                        console.error('❌ Sync failed after import:', error);
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ JSON parsing failed:', error);
                alert('❌ Failed to read JSON file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
}

// Make function globally accessible
window.forceImportJSONOverwrite = forceImportJSONOverwrite;

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
    alert('🌐 Language switching to: ' + lang); // Debug alert
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
    const sectionName = prompt('Enter section name:');
    if (sectionName && sectionName.trim()) {
        createListSection(sectionName.trim());
    }
}

// Create new list section
async function createListSection(name) {
    const newSection = {
        id: Date.now().toString(),
        name: name,
        lists: [],
        collapsed: false,
        createdAt: new Date().toISOString()
    };
    
    // Initialize listSections if it doesn't exist
    if (!window.listSections) {
        window.listSections = [];
    }
    
    window.listSections.push(newSection);
    
    // Save to localStorage and sync
    if (typeof saveListSections === 'function') {
        await saveListSections();
    }
    
    // Re-render the lists view
    if (typeof renderListsView === 'function') {
        renderListsView();
    }
    
    console.log('✅ Created new section:', name);
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
    console.log('🏷️ [missing-functions.js] insertTemplateToTask called with:', template);
    const titleInput = document.getElementById('editTaskTitle');
    const notesInput = document.getElementById('editTaskNotes');
    
    if (!notesInput) {
        console.error('❌ editTaskNotes input not found');
        return;
    }
    
    // Check which element has focus
    const activeElement = document.activeElement;
    console.log('🎯 Active element:', activeElement?.id || 'none');
    
    const currentNotes = notesInput.value.trim();
    console.log('📝 Current notes value before insertion:', currentNotes);
    console.log('📝 Template to insert:', template);
    
    // Add template to notes field, templates on same line separated by spaces
    if (currentNotes) {
        notesInput.value = currentNotes + ' ' + template;
        console.log('✅ Appended template to existing notes');
    } else {
        notesInput.value = template;
        console.log('✅ Set template as initial notes');
    }
    
    console.log('✅ New notes value after insertion:', notesInput.value);
    
    // Force focus back to notes input
    notesInput.focus();
    notesInput.setSelectionRange(notesInput.value.length, notesInput.value.length);
    
    // Trigger change event for any listeners
    notesInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('🎯 Multiple template support - templates accumulate in notes field inline');
}

// Override any previous definition
window.insertTemplateToTask = insertTemplateToTask;

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
    console.log('🗑️ Opening trash view...');
    if (typeof showView === 'function') {
        showView('trash');
    }
}

/**
 * Recent Actions View Functions
 * Unified system combining deleted tasks (Trash) and undo stack actions
 */

function getRecentActions() {
    const actions = [];
    
    // Get deleted tasks (from old Trash system)
    const deletedTasks = tasks.filter(task => task.status === 'deleted');
    deletedTasks.forEach(task => {
        actions.push({
            type: 'delete',
            icon: '🗑️',
            title: 'Deleted Task',
            task: task,
            timestamp: task.deletedAt || task.updatedAt || Date.now(),
            description: `${task.title || 'Untitled Task'}`,
            canRestore: true,
            canPermanentDelete: true
        });
    });
    
    // Get undo stack actions (from old Undo system)
    if (typeof undoStack !== 'undefined' && undoStack.length > 0) {
        undoStack.forEach((state, index) => {
            let icon = '↩️';
            let title = 'Action';
            let description = state.action || 'Unknown action';
            
            switch (state.action) {
                case 'toggle_complete':
                    icon = '✅';
                    title = 'Completed Task';
                    description = state.task ? state.task.title || 'Untitled Task' : 'Task completion';
                    break;
                case 'update date':
                    icon = '📅';
                    title = 'Changed Date';
                    description = state.task ? state.task.title || 'Untitled Task' : 'Date update';
                    break;
                case 'update time':
                    icon = '⏰';
                    title = 'Changed Time';
                    description = state.task ? state.task.title || 'Untitled Task' : 'Time update';
                    break;
                case 'delay task':
                    icon = '⏭️';
                    title = 'Delayed Task';
                    description = state.task ? state.task.title || 'Untitled Task' : 'Task delay';
                    break;
                default:
                    icon = '↩️';
                    title = 'Modified';
                    break;
            }
            
            actions.push({
                type: 'undo',
                icon: icon,
                title: title,
                description: description,
                timestamp: state.timestamp || Date.now(),
                stackIndex: index,
                canUndo: true
            });
        });
    }
    
    // Sort by timestamp (most recent first)
    actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return actions;
}

function renderRecentActionsView() {
    console.log('⏮️ Rendering recent actions view...');
    
    // Get the main tasks view container and replace ALL content
    const tasksView = document.getElementById('tasks-view');
    if (!tasksView) {
        console.error('Tasks view container not found');
        return;
    }
    
    if (!Array.isArray(tasks)) {
        console.error('Tasks array not properly initialized');
        return;
    }
    
    // Get all recent actions
    const recentActions = getRecentActions();
    
    console.log(`⏮️ Found ${recentActions.length} recent actions`);
    
    if (recentActions.length === 0) {
        tasksView.innerHTML = `
            <div class="section-header">
                <h3>⏮️ Recent Actions</h3>
            </div>
            <div class="no-tasks-today" style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏮️</div>
                <h3>No Recent Actions</h3>
                <p style="color: #999; margin-bottom: 20px;">No recent actions to undo or restore. When you delete tasks or make changes, they'll appear here.</p>
                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                    <button onclick="showView('today')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        🔥 Go to Today
                    </button>
                    <button onclick="showView('all')" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        🔍 All Tasks
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Count different action types
    const deletedCount = recentActions.filter(a => a.type === 'delete').length;
    const undoCount = recentActions.filter(a => a.type === 'undo').length;
    
    let html = `
        <div class="section-header">
            <h3>⏮️ Recent Actions</h3>
        </div>
        <div class="recent-actions-header" style="padding: 20px; background: linear-gradient(135deg, #6f42c1, #563d7c); color: white; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(111, 66, 193, 0.2);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center;">
                        <span style="margin-right: 12px; font-size: 28px;">⏮️</span>
                        Recent Actions
                    </h2>
                    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 16px;">${recentActions.length} recent action${recentActions.length !== 1 ? 's' : ''}</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    ${deletedCount > 0 ? `<button onclick="restoreAllDeletedTasks()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ↩️ Restore All Deleted (${deletedCount})
                    </button>` : ''}
                    ${undoCount > 0 ? `<button onclick="undoAllActions()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ↩️ Undo All (${undoCount})
                    </button>` : ''}
                </div>
            </div>
        </div>
        <div class="recent-actions-list" style="display: grid; gap: 16px;">
    `;
    
    recentActions.forEach(action => {
        const actionDate = new Date(action.timestamp).toLocaleDateString();
        const actionTime = new Date(action.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Color coding by action type
        const borderColor = action.type === 'delete' ? '#dc3545' : '#6f42c1';
        const bgColor = action.type === 'delete' ? 'rgba(220, 53, 69, 0.05)' : 'rgba(111, 66, 193, 0.05)';
        
        html += `
            <div class="action-card" style="background: ${bgColor}; border: 1px solid #e9ecef; border-left: 4px solid ${borderColor}; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s; position: relative;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div style="flex: 1; padding-right: 16px;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 20px; margin-right: 12px;">${action.icon}</span>
                            <h3 style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">
                                ${action.title}
                            </h3>
                        </div>
                        <p style="margin: 0 0 12px 0; color: #666; font-size: 14px; line-height: 1.5;">
                            ${action.description}
                        </p>
                        ${action.task && action.task.notes ? `<p style="margin: 0 0 12px 0; color: #888; font-size: 13px; font-style: italic; opacity: 0.8;">${action.task.notes.substring(0, 150)}${action.task.notes.length > 150 ? '...' : ''}</p>` : ''}
                        <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #888;">
                            <span style="display: flex; align-items: center;">
                                <span style="margin-right: 4px;">⏰</span>
                                ${actionDate} at ${actionTime}
                            </span>
                            ${action.task && action.task.dueDate ? `<span style="display: flex; align-items: center;">
                                <span style="margin-right: 4px;">📅</span>
                                Due: ${action.task.dueDate}${action.task.dueTime ? ` at ${action.task.dueTime}` : ''}
                            </span>` : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #f0f0f0; padding-top: 16px;">
                    ${action.type === 'delete' && action.canRestore ? `
                        <button onclick="restoreDeletedTask('${action.task.id}')" style="background: #28a745; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                            <span>↩️</span> Restore
                        </button>
                        ${action.canPermanentDelete ? `<button onclick="permanentlyDeleteTask('${action.task.id}')" style="background: #dc3545; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
                            <span>🗑️</span> Delete Forever
                        </button>` : ''}
                    ` : ''}
                    ${action.type === 'undo' && action.canUndo ? `
                        <button onclick="undoSpecificAction(${action.stackIndex})" style="background: #6f42c1; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#563d7c'" onmouseout="this.style.background='#6f42c1'">
                            <span>↩️</span> Undo This Action
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    tasksView.innerHTML = html;
}

/**
 * Helper function to restore All Tasks UI (no longer needed as All Tasks renders its own complete HTML)
 */
function restoreAllTasksUI() {
    // No longer needed - All Tasks view renders complete HTML structure
    // This function kept for compatibility
}

/**
 * Recent Actions Support Functions
 */
function restoreDeletedTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }
    
    if (task.status !== 'deleted') {
        console.error('Task is not deleted:', taskId);
        return;
    }
    
    // Restore the task
    task.status = 'pending';
    task.deletedAt = null;
    task.updatedAt = new Date().toISOString();
    
    console.log('✅ Task restored from Recent Actions:', task.title);
    
    // Save and sync
    if (typeof saveTasks === 'function') {
        saveTasks();
    }
    if (typeof uploadAllTasks === 'function') {
        uploadAllTasks();
    }
    
    // Refresh Recent Actions view
    renderRecentActionsView();
    
    // Show success message
    if (typeof showInlineNotification === 'function') {
        showInlineNotification(`Task restored: ${task.title}`, 'success');
    }
}

function restoreAllDeletedTasks() {
    const deletedTasks = tasks.filter(task => task.status === 'deleted');
    
    if (deletedTasks.length === 0) {
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('No deleted tasks to restore', 'info');
        }
        return;
    }
    
    // Confirm restoring all
    if (!confirm(`Restore all ${deletedTasks.length} deleted tasks?`)) {
        return;
    }
    
    deletedTasks.forEach(task => {
        task.status = 'pending';
        task.deletedAt = null;
        task.updatedAt = new Date().toISOString();
    });
    
    console.log(`✅ Restored ${deletedTasks.length} tasks from Recent Actions`);
    
    // Save and sync
    if (typeof saveTasks === 'function') {
        saveTasks();
    }
    if (typeof uploadAllTasks === 'function') {
        uploadAllTasks();
    }
    
    // Refresh Recent Actions view
    renderRecentActionsView();
    
    // Show success message
    if (typeof showInlineNotification === 'function') {
        showInlineNotification(`${deletedTasks.length} tasks restored`, 'success');
    }
}

function undoSpecificAction(stackIndex) {
    if (typeof undoStack === 'undefined' || !undoStack[stackIndex]) {
        console.error('Undo action not found at index:', stackIndex);
        return;
    }
    
    // Get the specific state to restore
    const state = undoStack[stackIndex];
    
    if (state && state.tasks) {
        // Restore the tasks state from this specific point
        tasks = JSON.parse(JSON.stringify(state.tasks));
        
        // Remove this action and all newer ones from the undo stack
        undoStack.splice(stackIndex);
        
        console.log('✅ Undid action:', state.action);
        
        // Save and sync
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        if (typeof uploadAllTasks === 'function') {
            uploadAllTasks();
        }
        
        // Refresh Recent Actions view
        renderRecentActionsView();
        
        // Show success message
        if (typeof showInlineNotification === 'function') {
            showInlineNotification(`Undid: ${state.action}`, 'success');
        }
    }
}

function undoAllActions() {
    if (typeof undoStack === 'undefined' || undoStack.length === 0) {
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('No actions to undo', 'info');
        }
        return;
    }
    
    // Confirm undoing all actions
    if (!confirm(`Undo all ${undoStack.length} recent actions? This will revert all recent changes.`)) {
        return;
    }
    
    // Get the oldest state (first item in undo stack)
    const oldestState = undoStack[0];
    
    if (oldestState && oldestState.tasks) {
        tasks = JSON.parse(JSON.stringify(oldestState.tasks));
        
        // Clear the entire undo stack
        undoStack.length = 0;
        
        console.log('✅ Undid all recent actions');
        
        // Save and sync
        if (typeof saveTasksToLocalStorage === 'function') {
            saveTasksToLocalStorage();
        }
        if (typeof uploadAllTasks === 'function') {
            uploadAllTasks();
        }
        
        // Refresh Recent Actions view
        renderRecentActionsView();
        
        // Show success message
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('All actions undone', 'success');
        }
    }
}

/**
 * Permanently delete a task (used by Recent Actions)
 */
function permanentlyDeleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }
    
    const taskTitle = task.title || 'Untitled Task';
    
    // Confirm permanent deletion
    if (!confirm(`Are you sure you want to permanently delete "${taskTitle}"? This cannot be undone.`)) {
        return;
    }
    
    // Remove task completely
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        console.log(`🗑️ Permanently deleted task: ${taskTitle}`);
    }
    
    // Save and sync
    if (typeof saveTasks === 'function') {
        saveTasks();
    }
    if (typeof uploadAllTasks === 'function') {
        uploadAllTasks();
    }
    
    // Refresh Recent Actions view
    renderRecentActionsView();
    
    // Show success message
    if (typeof showInlineNotification === 'function') {
        showInlineNotification(`Task permanently deleted: ${taskTitle}`, 'success');
    }
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
    
    // Temporarily disable sync to prevent overwriting our changes
    const originalSyncEnabled = window.syncEnabled;
    window.syncEnabled = false;
    console.log('🔒 Temporarily disabled sync during task move');
    
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
    console.log('🔍 Testing parseTime with "12:00":', parseTime('12:00'));
    console.log('🔍 Testing parseTime with current time:', parseTime(currentTimeStr));
    console.log('🔍 Is 12:00 < current time?', parseTime('12:00') < parseTime(currentTimeStr));
    
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
    
    // Find overdue tasks (from previous dates) AND today's tasks before current time
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0); // Start of today
    
    // First, let's see what timed tasks we have
    console.log('🔍 Sample of ALL tasks (first 10):');
    tasksArray.slice(0, 10).forEach((task, i) => {
        console.log(`Task ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | time: "${task.time}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    const timedTasks = tasksArray.filter(task => {
        return task.dueTime && task.dueTime.trim() !== '' && task.dueTime !== 'undefined' && task.status !== 'deleted';
    });
    console.log('⏰ Found', timedTasks.length, 'timed tasks total (using dueTime property):');
    timedTasks.slice(0, 5).forEach((task, i) => {
        console.log(`Timed ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | dueTime: "${task.dueTime}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Check if there are any tasks with time properties that are not "undefined"
    const anyTimeProperty = tasksArray.filter(task => task.dueTime !== 'undefined' && task.dueTime !== undefined && task.dueTime);
    console.log('🕐 Tasks with any dueTime property (not "undefined"):', anyTimeProperty.length);
    anyTimeProperty.slice(0, 3).forEach((task, i) => {
        console.log(`dueTime property ${i+1}: "${task.title}" | dueTime: "${task.dueTime}" | typeof: ${typeof task.dueTime}`);
    });

    const overdueTasks = tasksArray.filter(task => {
        if (!task.dueDate || task.status === 'deleted' || task.status === 'completed' || task.isEvent) {
            return false;
        }
        
        // EXCLUDE untimed tasks (as per your requirement: "not untimed")
        if (!task.dueTime || task.dueTime.trim() === '' || task.dueTime === 'undefined') {
            return false;
        }
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0); // Start of task date
        
        // Include tasks from previous dates (overdue) OR today's tasks before current time
        if (taskDate < todayDate) {
            // Overdue timed task from previous date
            return true;
        } else if (taskDate.getTime() === todayDate.getTime()) {
            // Today's timed tasks - only if before current time
            const taskTime = parseTime(task.dueTime);
            const currentTime = parseTime(currentTimeStr);
            return taskTime && currentTime && taskTime < currentTime;
        }
        
        return false;
    });
    
    console.log('📅 Found', overdueTasks.length, 'overdue tasks (from previous dates + today before', currentTimeStr + ')');
    
    // Also show today's tasks for reference
    const todayTasks = tasksArray.filter(task => 
        task.dueDate && task.dueDate.startsWith(todayStr) && 
        task.status !== 'deleted' && task.status !== 'completed'
    );
    console.log('📅 Found', todayTasks.length, 'tasks for today', todayStr, '(for reference)');
    
    // Check Facebook task specifically since it shows as timed in UI but untimed in console
    const facebookTasks = tasksArray.filter(task => 
        task.title && task.title.toLowerCase().includes('facebook')
    );
    console.log('📘 Found', facebookTasks.length, 'Facebook-related tasks:');
    facebookTasks.forEach((task, i) => {
        console.log(`Facebook ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | time: "${task.time}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Also check tasks that might match your cleaning task specifically
    const cleaningTasks = tasksArray.filter(task => 
        task.title && task.title.toLowerCase().includes('cleaning')
    );
    console.log('🧹 Found', cleaningTasks.length, 'cleaning-related tasks:');
    cleaningTasks.forEach((task, i) => {
        console.log(`Cleaning ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | dueTime: "${task.dueTime}" | isEvent: ${task.isEvent} | status: ${task.status}`);
    });
    
    // Debug overdue tasks
    console.log('🔍 Analyzing overdue tasks:');
    overdueTasks.forEach((task, i) => {
        console.log(`Overdue ${i+1}: "${task.title}" | dueDate: "${task.dueDate}" | dueTime: "${task.dueTime}" | status: ${task.status}`);
    });

    let movedCount = 0;
    const updatedTasks = tasksArray.map(task => {
        // Check if this task is in our overdue tasks list
        const isOverdue = overdueTasks.find(overdueTask => 
            overdueTask.id === task.id || 
            (overdueTask.title === task.title && overdueTask.dueDate === task.dueDate)
        );
        
        if (isOverdue) {
            // Move overdue task to current time and today's date
            const updatedTask = {
                ...task,
                dueDate: todayStr,
                dueTime: currentTimeStr,
                updatedAt: new Date().toISOString()
            };
            movedCount++;
            console.log('📋 Moved overdue task:', task.title, 'from', task.dueDate, task.dueTime || '(no time)', 'to', todayStr, currentTimeStr);
            return updatedTask;
        }
        return task;
    });
    
    // Update global tasks array
    window.tasks = updatedTasks;
    tasks = updatedTasks;  // Keep both for compatibility
    
    // Save to localStorage
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    console.log('💾 Saved', updatedTasks.length, 'tasks to localStorage');
    
    // CRITICAL SEQUENCE:
    // 1. Create the time slot FIRST by rendering with updated tasks
    console.log(`🏗️ STEP 1: Creating ${currentTimeStr} time slot...`);
    if (typeof renderTodayView === 'function') {
        renderTodayView();
        console.log(`✅ Time slot ${currentTimeStr} created and populated with ${movedCount} tasks`);
    }
    
    // 2. Verify the slot exists in DOM
    setTimeout(() => {
        const slot = document.querySelector(`[data-time="${currentTimeStr}"]`) || 
                     Array.from(document.querySelectorAll('.time-block-header')).find(el => el.textContent.includes(currentTimeStr));
        if (slot) {
            console.log(`✅ STEP 2: Verified ${currentTimeStr} slot exists in DOM`);
        } else {
            console.log(`⚠️ STEP 2: ${currentTimeStr} slot not found in DOM yet`);
        }
    }, 100);
    
    // 3. Upload to cloud AFTER slot is created and tasks are moved
    const uploadPromise = (async () => {
        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log(`📤 STEP 3: Uploading ${movedCount} moved tasks to cloud...`);
        if (typeof uploadAllTasks === 'function') {
            console.log(`📊 Uploading tasks with time ${currentTimeStr}`);
            await uploadAllTasks();
            console.log('✅ STEP 3: Upload completed successfully');
        } else if (window.uploadAllTasks) {
            console.log(`📊 Uploading tasks with time ${currentTimeStr}`);
            await window.uploadAllTasks();
            console.log('✅ STEP 3: Upload completed successfully');
        }
    })();
    
    // Re-render today view
    console.log('🔄 Attempting to re-render Today view...');
    
    // Check if tasks were actually updated in memory
    const fbTask = window.tasks.find(t => t.title && t.title.includes('Facebook @project'));
    if (fbTask) {
        console.log('🔍 Facebook task after update:', fbTask.title, '| dueDate:', fbTask.dueDate, '| dueTime:', fbTask.dueTime);
    }
    
    // Force clear any time block collapse states to ensure the target time block shows
    const collapseStates = JSON.parse(localStorage.getItem('timeblock_collapse_states') || '{}');
    collapseStates[currentTimeStr] = false; // Ensure target time block is expanded
    localStorage.setItem('timeblock_collapse_states', JSON.stringify(collapseStates));
    console.log(`🔄 Forced ${currentTimeStr} time block to expand`);
    
    // Additional render after upload starts to refresh the view
    // This helps ensure the UI stays in sync
    setTimeout(() => {
        console.log(`🔄 Refreshing view to ensure ${currentTimeStr} slot is visible`);
        if (typeof renderTodayView === 'function') {
            renderTodayView();
        } else if (typeof window.renderTodayView === 'function') {
            window.renderTodayView();
        }
    }, 500);
    
    // Force re-render after a short delay to ensure DOM updates
    setTimeout(() => {
        console.log('🔄 Force refresh after delay...');
        if (typeof renderTodayView === 'function') {
            renderTodayView();
        } else if (typeof window.renderTodayView === 'function') {
            window.renderTodayView();
        }
        
        // Also try to trigger the Today tab refresh
        const todayTab = document.querySelector('[data-tab="today"], .tab[onclick*="showToday"]');
        if (todayTab) {
            todayTab.click();
            console.log('✅ Clicked Today tab to refresh view');
        }
    }, 500);
    
    // Give UI time to render, then check if the target time block has our tasks
    setTimeout(() => {
        const timeBlock = document.querySelector(`[data-time="${currentTimeStr}"], [id*="${currentTimeStr}"]`) || 
                          Array.from(document.querySelectorAll('.time-block-header')).find(el => el.textContent.includes(currentTimeStr));
        if (timeBlock) {
            console.log(`✅ Found ${currentTimeStr} time block in DOM after render`);
        } else {
            console.log(`❌ Could not find ${currentTimeStr} time block in DOM - may need page refresh`);
        }
    }, 1000);
    
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
    
    // Re-enable sync after upload completes (give more time for server sync)
    setTimeout(async () => {
        // Wait for initial upload to complete
        await uploadPromise;
        
        window.syncEnabled = originalSyncEnabled;
        console.log('🔓 Re-enabled sync after task move completion');
        
        // Force one more upload to be absolutely sure
        if (typeof uploadAllTasks === 'function') {
            await uploadAllTasks();
            console.log('📤 Final upload to ensure server has latest data');
        }
        
        // If we moved tasks successfully, reload the page to show them
        if (movedCount > 0) {
            setTimeout(() => {
                console.log('🔄 Reloading page to display moved tasks in their new time slot...');
                window.location.reload();
            }, 1000);
        }
    }, 3000);  // Increased delay to ensure upload completes
}

// Expose functions globally
window.switchLanguage = switchLanguage;
window.moveAllTasksToCurrentTime = moveAllTasksToCurrentTime;
window.saveAutoPrintTime = saveAutoPrintTime;
window.updateSyncPeriod = updateSyncPeriod;
window.openSettings = openSettings;
window.openCreateSectionModal = openCreateSectionModal;
window.createListSection = createListSection;
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

// Handle mobile dropdown template filter selection for All Tasks view
function handleAllTasksMobileTemplateFilter(selectedValue) {
    if (selectedValue === '') {
        clearAllTasksTemplateFilter();
    } else {
        filterAllTasksByTemplate(selectedValue);
    }
}
window.handleAllTasksMobileTemplateFilter = handleAllTasksMobileTemplateFilter;

// Handle mobile template filter for Today view (from extracted_js.js)
function handleMobileTemplateFilter(selectedValue) {
    console.log('🔍 DEBUG: handleMobileTemplateFilter called with value:', selectedValue);
    if (selectedValue === '') {
        console.log('🔍 DEBUG: Clearing template filter');
        clearTodayTemplateFilter();
    } else {
        console.log('🔍 DEBUG: Filtering by template:', selectedValue);
        filterTodayByTemplate(selectedValue);
    }
}
window.handleMobileTemplateFilter = handleMobileTemplateFilter;

// Clear today template filter
function clearTodayTemplateFilter() {
    console.log('🔍 CLEAR ALL TEMPLATE BUTTON CLICKED!');
    console.log('🔍 Using proper clearTodayTemplateFilter implementation');
    
    // Clear the active template filter
    window.activeTodayTemplateFilter = null;
    
    // Reset the mobile dropdown to "All tasks"
    const mobileFilter = document.getElementById('todayMobileFilter');
    if (mobileFilter) {
        mobileFilter.value = '';
    }
    
    // Re-render the current view to show all tasks
    if (typeof renderTodayView === 'function') {
        renderTodayView();
    } else if (typeof renderAllTasksView === 'function') {
        renderAllTasksView();
    } else {
        console.log('🔍 No render function available, reloading page');
        location.reload();
    }
}
window.clearTodayTemplateFilter = clearTodayTemplateFilter;


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