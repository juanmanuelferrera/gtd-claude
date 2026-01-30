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
    console.log('📅 Opening iOS date/time picker for task:', taskId, 'current date:', currentDate, 'current time:', currentTime);
    
    // Remove any existing picker
    if (window.currentDateDropdown) {
        console.log('📅 Removing existing calendar dropdown');
        try {
            document.body.removeChild(window.currentDateDropdown);
        } catch (e) {
            console.warn('Warning removing old dropdown:', e);
        }
        window.currentDateDropdown = null;
    }
    
    console.log('📅 Creating new calendar dropdown for task:', taskId);
    
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
        background: white; border-radius: 12px; width: min(300px, calc(100vw - 20px));
        padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: fixed; z-index: 10001;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        border: 1px solid #e0e0e0;
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
        
        <!-- Quick Actions -->
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <div style="display: flex; gap: 6px;">
                <button onclick="setCalendarQuickDate('${taskId}', 0)" style="flex: 1; padding: 8px; background: #e3f2fd; color: #1976d2; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">Today</button>
                <button onclick="setCalendarQuickDate('${taskId}', 1)" style="flex: 1; padding: 8px; background: #fff3e0; color: #f57c00; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">Tomorrow</button>
                <button onclick="setCalendarQuickDate('${taskId}', 7)" style="flex: 1; padding: 8px; background: #e8f5e8; color: #388e3c; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">+1W</button>
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
                
                return `<div onclick="selectInlineCalendarDate('${taskId}', ${day})" 
                             style="${style}"
                             onmouseover="if(!this.style.color.includes('white')) { this.style.background='#f0f8ff'; }"
                             onmouseout="if(!this.style.color.includes('white')) { this.style.background='${isToday ? '#e3f2fd' : 'transparent'}'; }">
                            ${day}
                        </div>`;
            }).join('')}
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

    // Auto-focus the selected or first day cell for keyboard navigation
    setTimeout(() => {
        var selected = calendar.querySelector('[onclick*="selectInlineCalendarDate"][style*="background: #007AFF"]');
        var target = selected || calendar.querySelector('[onclick*="selectInlineCalendarDate"]');
        if (target) { target.setAttribute('tabindex', '0'); target.focus(); }
    }, 50);
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

// Select a specific date in inline calendar dropdown
async function selectInlineCalendarDate(taskId, day) {
    console.log('📅 selectCalendarDate called with taskId:', taskId, 'day:', day);
    console.log('📅 currentCalendarYear:', window.currentCalendarYear);
    console.log('📅 currentCalendarMonth:', window.currentCalendarMonth);

    try {
        const dateString = `${window.currentCalendarYear}-${(window.currentCalendarMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        console.log('📅 Selected date:', dateString);

        // Find the task first
        const task = window.tasks?.find(t => t.id === taskId);
        if (!task) {
            console.error('❌ Task not found with ID:', taskId);
            return;
        }
        console.log('✅ Found task:', task.title);

        // Close dropdown first for better UX
        console.log('📅 Closing dropdown...');
        closeDateDropdown();

        // Update task date and wait for it to complete
        console.log('📅 Calling updateTaskDate...');
        await updateTaskDate(taskId, dateString, { stopPropagation: () => {} });

        // Batch: also update remaining tasks from F key batch selection
        if (window.pendingDateTimeBatchIds && window.pendingDateTimeBatchIds.length > 0) {
            var batchIds = window.pendingDateTimeBatchIds;
            window.pendingDateTimeBatchIds = null;
            console.log('📅 Batch updating date for', batchIds.length, 'additional tasks');
            for (var i = 0; i < batchIds.length; i++) {
                await updateTaskDate(batchIds[i], dateString, { stopPropagation: () => {} });
            }
        }

        console.log('✅ Date updated successfully!');
    } catch (error) {
        console.error('❌ Error in selectCalendarDate:', error);
    }
}

// Change calendar month (prev/next)
function changeCalendarMonth(taskId, direction) {
    console.log('📅 Changing calendar month, direction:', direction);
    window.currentCalendarMonth += direction;
    
    if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
    } else if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
    }
    
    console.log('📅 New month/year:', window.currentCalendarMonth, window.currentCalendarYear);
    
    // Re-render the calendar without closing it
    refreshInlineCalendar(taskId);
}

// Refresh inline calendar display without closing it
function refreshInlineCalendar(taskId) {
    console.log('📅 Refreshing inline calendar for task:', taskId);
    
    // Find the calendar container in the overlay
    if (!window.currentDateDropdown) {
        console.error('❌ No calendar dropdown found');
        return;
    }
    
    const calendar = window.currentDateDropdown.querySelector('div[style*="background: white"]');
    if (!calendar) {
        console.error('❌ Calendar element not found');
        return;
    }
    
    // Get current task
    const currentTask = window.tasks?.find(t => t.id === taskId);
    const currentDate = currentTask?.dueDate;
    
    // Rebuild calendar HTML
    const today = new Date();
    const currentYear = window.currentCalendarYear;
    const currentMonth = window.currentCalendarMonth;
    const currentDay = currentDate ? new Date(currentDate + 'T00:00:00').getDate() : null;
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const html = `
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
        
        <!-- Quick Actions -->
        <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <div style="display: flex; gap: 6px;">
                <button onclick="setCalendarQuickDate('${taskId}', 0)" style="flex: 1; padding: 8px; background: #e3f2fd; color: #1976d2; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">Today</button>
                <button onclick="setCalendarQuickDate('${taskId}', 1)" style="flex: 1; padding: 8px; background: #fff3e0; color: #f57c00; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">Tomorrow</button>
                <button onclick="setCalendarQuickDate('${taskId}', 7)" style="flex: 1; padding: 8px; background: #e8f5e8; color: #388e3c; border: none; border-radius: 6px; font-size: 11px; cursor: pointer;">+1W</button>
            </div>
        </div>
        
        <!-- Calendar Grid -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">
            ${daysOfWeek.map(day => 
                `<div style="text-align: center; padding: 8px 4px; font-size: 11px; font-weight: 600; color: #666;">${day}</div>`
            ).join('')}
            
            ${Array(firstDay).fill().map(() => 
                `<div style="padding: 8px;"></div>`
            ).join('')}
            
            ${Array.from({length: daysInMonth}, (_, i) => {
                const day = i + 1;
                const isToday = day === todayDay && currentMonth === todayMonth && currentYear === todayYear;
                const isSelected = day === currentDay && currentMonth === (currentDate ? new Date(currentDate + 'T00:00:00').getMonth() : null) && currentYear === (currentDate ? new Date(currentDate + 'T00:00:00').getFullYear() : null);
                
                let style = 'padding: 8px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 13px; font-weight: 500;';
                
                if (isSelected) {
                    style += ' background: #007AFF; color: white;';
                } else if (isToday) {
                    style += ' background: #e3f2fd; color: #1976d2; font-weight: 600;';
                } else {
                    style += ' background: transparent; color: #333;';
                }
                
                return `<div onclick="selectInlineCalendarDate('${taskId}', ${day})" 
                             style="${style}"
                             onmouseover="if(!this.style.color.includes('white')) { this.style.background='#f0f8ff'; }"
                             onmouseout="if(!this.style.color.includes('white')) { this.style.background='${isToday ? '#e3f2fd' : 'transparent'}'; }">
                            ${day}
                        </div>`;
            }).join('')}
        </div>
    `;
    
    calendar.innerHTML = html;
    console.log('✅ Calendar refreshed');
}

// Set calendar to today
function setCalendarToday(taskId) {
    const today = new Date();
    window.currentCalendarMonth = today.getMonth();
    window.currentCalendarYear = today.getFullYear();
    
    // Refresh and select today's date
    refreshInlineCalendar(taskId);
    selectInlineCalendarDate(taskId, today.getDate());
}

// Quick date selection for calendar
function setCalendarQuickDate(taskId, daysFromToday) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    
    window.currentCalendarMonth = date.getMonth();
    window.currentCalendarYear = date.getFullYear();
    
    // Select the date
    selectInlineCalendarDate(taskId, date.getDate());
}

// Make functions globally available for inline onclick handlers
window.openIOSDateTimePicker = openIOSDateTimePicker;
window.selectInlineCalendarDate = selectInlineCalendarDate;
window.refreshInlineCalendar = refreshInlineCalendar;
window.changeCalendarMonth = changeCalendarMonth;
window.setCalendarToday = setCalendarToday;
window.setCalendarQuickDate = setCalendarQuickDate;
window.closeDateDropdown = closeDateDropdown;

// Unified Date/Time Modal Support
let modalSelectedDate = null;
let modalSelectedTime = null;
let modalCurrentMonth = new Date().getMonth();
let modalCurrentYear = new Date().getFullYear();

// Navigate calendar months
function navigateCalendar(direction) {
    modalCurrentMonth += direction;
    
    if (modalCurrentMonth < 0) {
        modalCurrentMonth = 11;
        modalCurrentYear--;
    } else if (modalCurrentMonth > 11) {
        modalCurrentMonth = 0;
        modalCurrentYear++;
    }
    
    updateCalendarDisplay();
}

// Go to today's date
function goToCalendarToday() {
    const today = new Date();
    modalCurrentMonth = today.getMonth();
    modalCurrentYear = today.getFullYear();
    modalSelectedDate = getLocalDateString(today);
    updateCalendarDisplay();
    updateSelectedDisplay();
}

// Set quick date
function setQuickDate(daysFromToday) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    
    // Update the unified modal variables
    window.selectedModalDate = getLocalDateString(date);
    modalSelectedDate = getLocalDateString(date);
    
    // Update the calendar to show the selected month
    modalCalendarDate = new Date(date);
    
    // Re-render the calendar modal and highlight the selected date
    renderCalendarModal();
    updateSelectedDisplay();
}

// Select time
function selectTime(time) {
    console.log('🕐 Time selected:', time);
    
    // Update unified modal variables
    modalSelectedTime = time;
    
    // Update legacy modal variables for backward compatibility
    window.selectedModalTime = time;
    
    // Update visual state of time buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        if (btn.textContent === time) {
            btn.style.background = '#007AFF';
            btn.style.color = 'white';
        } else {
            // Reset to original colors based on time period
            const hour = parseInt(time.split(':')[0]);
            if (hour < 12) {
                btn.style.background = '#e3f2fd';
                btn.style.color = '#1976d2';
            } else if (hour < 18) {
                btn.style.background = '#fff3e0';
                btn.style.color = '#f57c00';
            } else {
                btn.style.background = '#f3e5f5';
                btn.style.color = '#7b1fa2';
            }
        }
    });
    
    updateSelectedDisplay();
    console.log('✅ Time selection updated');
}

// Clear selected time
function clearSelectedTime() {
    console.log('🚫 Clearing selected time');
    
    // Update unified modal variables
    modalSelectedTime = null;
    
    // Update legacy modal variables for backward compatibility
    window.selectedModalTime = '';
    
    // Reset all time button styles
    document.querySelectorAll('.time-btn').forEach(btn => {
        const btnTime = btn.textContent;
        const hour = parseInt(btnTime.split(':')[0]);
        if (hour < 12) {
            btn.style.background = '#e3f2fd';
            btn.style.color = '#1976d2';
        } else if (hour < 18) {
            btn.style.background = '#fff3e0';
            btn.style.color = '#f57c00';
        } else {
            btn.style.background = '#f3e5f5';
            btn.style.color = '#7b1fa2';
        }
    });
    
    updateSelectedDisplay();
    console.log('✅ Time cleared');
}

// Update calendar display
function updateCalendarDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update title
    const titleElement = document.getElementById('modalCalendarTitle');
    if (titleElement) {
        titleElement.textContent = `${monthNames[modalCurrentMonth]} ${modalCurrentYear}`;
    }
    
    // Update calendar days
    const daysElement = document.getElementById('modalCalendarDays');
    if (daysElement) {
        const firstDay = new Date(modalCurrentYear, modalCurrentMonth, 1).getDay();
        const daysInMonth = new Date(modalCurrentYear, modalCurrentMonth + 1, 0).getDate();
        const today = new Date();
        const todayStr = getLocalDateString(today);
        
        let html = '';
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += '<div style="padding: 12px;"></div>';
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${modalCurrentYear}-${(modalCurrentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === modalSelectedDate;
            
            let style = 'padding: 12px; text-align: center; cursor: pointer; border-radius: 8px; font-size: 14px; font-weight: 500;';
            
            if (isSelected) {
                style += ' background: #007AFF; color: white;';
            } else if (isToday) {
                style += ' background: #e3f2fd; color: #1976d2; font-weight: 600;';
            } else {
                style += ' background: transparent; color: #495057;';
            }
            
            html += `<div onclick="selectCalendarDay('${dateStr}')" 
                         style="${style}"
                         onmouseover="if(!'${isSelected}') { this.style.background='#f8f9fa'; }"
                         onmouseout="if(!'${isSelected}') { this.style.background='${isToday ? '#e3f2fd' : 'transparent'}'; }">
                        ${day}
                    </div>`;
        }
        
        daysElement.innerHTML = html;
    }
}

// Select calendar day
function selectCalendarDay(dateStr) {
    console.log('📅 Calendar day selected:', dateStr);
    
    // Update unified modal variables
    modalSelectedDate = dateStr;
    
    // Update legacy modal variables for backward compatibility
    window.selectedModalDate = dateStr;
    
    // Update displays
    updateCalendarDisplay();
    updateSelectedDisplay();
    
    console.log('✅ Calendar day selection updated');
}

// Update selected display
function updateSelectedDisplay() {
    const displayElement = document.getElementById('selectedDateTimeDisplay');
    if (displayElement) {
        // Use window.selectedModalDate and window.selectedModalTime for consistency
        const dateToUse = window.selectedModalDate || modalSelectedDate;
        const timeToUse = window.selectedModalTime || modalSelectedTime;
        
        if (dateToUse || timeToUse) {
            const datePart = dateToUse ? formatDateForDisplay(dateToUse) : 'No date';
            const timePart = timeToUse ? timeToUse : 'No time';
            displayElement.textContent = timeToUse ? `${datePart} at ${timePart}` : datePart;
            displayElement.style.color = '#007AFF';
            displayElement.style.fontWeight = '600';
        } else {
            displayElement.textContent = 'Select a date and/or time';
            displayElement.style.color = '#495057';
            displayElement.style.fontWeight = '500';
        }
    }
}

// Format date for display
function formatDateForDisplay(dateStr) {
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
}

// Apply selected date/time
async function applyDateTime() {
    console.log('📅 Applying date/time:', { 
        date: modalSelectedDate, 
        time: modalSelectedTime, 
        taskId: window.currentDateTimeTaskId,
        legacyDate: window.selectedModalDate,
        legacyTime: window.selectedModalTime
    });
    
    try {
        // Use the date/time from either the unified modal or legacy modal variables
        // IMPORTANT: Prioritize legacy variables since they're updated by calendar clicks
        const selectedDate = window.selectedModalDate || modalSelectedDate;
        const selectedTime = window.selectedModalTime || modalSelectedTime;

        if (window.currentDateTimeTaskId) {
            const taskId = window.currentDateTimeTaskId;
            
            // Update date if selected
            if (selectedDate) {
                console.log('📅 Updating task date:', taskId, selectedDate);
                if (typeof updateTaskDate === 'function') {
                    updateTaskDate(taskId, selectedDate, { stopPropagation: () => {} });
                } else {
                    console.warn('⚠️ updateTaskDate function not available');
                }
            }
            
            // Update time if selected
            if (selectedTime) {
                console.log('🕐 Updating task time:', taskId, selectedTime);
                if (typeof updateTaskTime === 'function') {
                    updateTaskTime(taskId, selectedTime, { stopPropagation: () => {} });
                } else {
                    console.warn('⚠️ updateTaskTime function not available');
                }
            }
            
            // Clear time if user explicitly chose "No specific time"
            if (selectedDate && !selectedTime) {
                console.log('🚫 Clearing task time:', taskId);
                if (typeof updateTaskTime === 'function') {
                    updateTaskTime(taskId, '', { stopPropagation: () => {} });
                }
            }
            
            // Refresh current view to show changes
            setTimeout(() => {
                if (window.currentView === 'today' && typeof renderTodayView === 'function') {
                    renderTodayView();
                } else if (window.currentView === 'week' && typeof safeRenderWeekView === 'function') {
                    safeRenderWeekView();
                } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
                    // Navigate calendar to the selected date
                    if (selectedDate) {
                        window.currentCalendarDate = new Date(selectedDate + 'T00:00:00');
                        console.log('📅 Navigating calendar to:', selectedDate);
                    }
                    renderCalendar();
                } else if (window.currentView === 'allTasks' && typeof renderAllTasksView === 'function') {
                    renderAllTasksView();
                }
            }, 100);
            
            // Update the edit modal display fields
            const dateField = document.getElementById('editTaskDateOnly');
            const timeField = document.getElementById('editTaskTimeOnly');
            console.log('📝 Updating hidden form fields:', { dateField: !!dateField, timeField: !!timeField, selectedDate, selectedTime });
            if (dateField && selectedDate) {
                dateField.value = selectedDate;
                console.log('✅ Set editTaskDateOnly to:', dateField.value);
                // Mark that date was manually set
                window.manualDateSet = true;
            }
            if (timeField) {
                timeField.value = selectedTime || '';
                console.log('✅ Set editTaskTimeOnly to:', timeField.value);
                // Mark that time was manually set
                window.manualTimeSet = true;
            }
            
            // Update the display button to show the new date/time
            if (typeof updateDateTimeDisplay === 'function') {
                updateDateTimeDisplay();
            }
            
            console.log('✅ Date/time applied successfully');
            
            // Auto-save the task after applying date/time
            if (typeof saveTaskEdit === 'function') {
                console.log('💾 Auto-saving task after date/time change');
                await saveTaskEdit();
                
                // Close the edit modal as well since we've saved
                console.log('🚪 Closing edit modal after saving');
                if (typeof closeTaskModal === 'function') {
                    closeTaskModal();
                }
            }
        } else {
            console.warn('⚠️ No task ID set for date/time update');
        }
    } catch (error) {
        console.error('❌ Error applying date/time:', error);
    }
    
    closeDateTimeModal();
}

// Initialize modal when opened
function initUnifiedDateTimeModal(currentDate, currentTime) {
    // Reset selections
    modalSelectedDate = currentDate || null;
    modalSelectedTime = currentTime || null;
    
    // Set current month/year to the selected date or today
    if (currentDate) {
        const date = new Date(currentDate + 'T00:00:00');
        modalCurrentMonth = date.getMonth();
        modalCurrentYear = date.getFullYear();
    } else {
        const today = new Date();
        modalCurrentMonth = today.getMonth();
        modalCurrentYear = today.getFullYear();
    }
    
    // Update displays
    updateCalendarDisplay();
    updateSelectedDisplay();
    
    // Update time button if time is selected
    if (modalSelectedTime) {
        selectTime(modalSelectedTime);
    }
}

// Make unified modal functions globally available
window.navigateCalendar = navigateCalendar;
window.goToCalendarToday = goToCalendarToday;
window.setQuickDate = setQuickDate;
window.selectTime = selectTime;
window.clearSelectedTime = clearSelectedTime;
window.selectCalendarDay = selectCalendarDay;
window.applyDateTime = applyDateTime;
window.initUnifiedDateTimeModal = initUnifiedDateTimeModal;

// Keyboard navigation inside date/time dropdowns (capture phase to beat other handlers)
document.addEventListener('keydown', function(e) {
    var isDate = !!window.currentDateDropdown;
    var isTime = !!window.currentTimeDropdown;
    if (!isDate && !isTime) return;

    // Escape closes whichever is open
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isDate) closeDateDropdown();
        if (isTime) closeTimeDropdown();
        return;
    }

    // Gather clickable cells
    var container = isDate
        ? window.currentDateDropdown
        : window.currentTimeDropdown;
    var cells;
    if (isDate) {
        // Calendar day cells: divs with onclick containing selectInlineCalendarDate
        cells = Array.from(container.querySelectorAll('[onclick*="selectInlineCalendarDate"]'));
    } else {
        // Time cells: divs with onclick containing setTimeAndClose
        cells = Array.from(container.querySelectorAll('[onclick*="setTimeAndClose"]'));
    }
    if (cells.length === 0) return;

    // Find currently focused cell
    var focused = document.activeElement;
    var idx = cells.indexOf(focused);

    // Arrow keys navigate, Enter selects
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].indexOf(e.key) === -1) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    if (e.key === 'Enter') {
        if (idx >= 0) cells[idx].click();
        return;
    }

    // Columns: 7 for calendar, 3 for time (grid-template-columns: repeat(3, 1fr) with 2 items per cell = 6 per row)
    var cols = isDate ? 7 : 6; // time grid: 3 columns x 2 (hour + :30) = 6

    if (idx < 0) {
        // Nothing focused yet, focus first cell
        cells[0].setAttribute('tabindex', '0');
        cells[0].focus();
        return;
    }

    var newIdx = idx;
    if (e.key === 'ArrowRight') newIdx = Math.min(idx + 1, cells.length - 1);
    else if (e.key === 'ArrowLeft') newIdx = Math.max(idx - 1, 0);
    else if (e.key === 'ArrowDown') newIdx = Math.min(idx + cols, cells.length - 1);
    else if (e.key === 'ArrowUp') newIdx = Math.max(idx - cols, 0);

    if (newIdx !== idx) {
        cells[idx].removeAttribute('tabindex');
        cells[newIdx].setAttribute('tabindex', '0');
        cells[newIdx].focus();
    }
}, true);  // capture phase to intercept before other handlers

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
        background: white; border-radius: 12px; width: min(320px, calc(100vw - 20px));
        padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: fixed; z-index: 10001;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        border: 1px solid #e0e0e0;
        max-height: 80vh;
        overflow-y: auto;
    `;

    // Helper to render a time row: full hour button + small :30 button
    function renderTimeRow(hour, bgColor, textColor, hoverColor) {
        const fullTime = `${String(hour).padStart(2, '0')}:00`;
        const halfTime = `${String(hour).padStart(2, '0')}:30`;
        const isFullSelected = fullTime === currentTime;
        const isHalfSelected = halfTime === currentTime;

        const fullStyle = isFullSelected
            ? 'background: #007AFF; color: white;'
            : `background: ${bgColor}; color: ${textColor};`;
        const halfStyle = isHalfSelected
            ? 'background: #007AFF; color: white;'
            : `background: ${bgColor}; color: ${textColor}; opacity: 0.75;`;

        return `<div style="display: flex; gap: 3px;">
            <div onclick="setTimeAndClose('${taskId}', '${fullTime}')"
                 style="flex: 1; padding: 6px 2px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 600; transition: all 0.2s; ${fullStyle}"
                 onmouseover="this.style.background='${isFullSelected ? '#0056CC' : hoverColor}'"
                 onmouseout="this.style.background='${isFullSelected ? '#007AFF' : bgColor}'">
                ${fullTime}
            </div>
            <div onclick="setTimeAndClose('${taskId}', '${halfTime}')"
                 style="width: 36px; padding: 6px 2px; text-align: center; cursor: pointer; border-radius: 6px; font-size: 10px; font-weight: 500; transition: all 0.2s; ${halfStyle}"
                 onmouseover="this.style.background='${isHalfSelected ? '#0056CC' : hoverColor}'"
                 onmouseout="this.style.background='${isHalfSelected ? '#007AFF' : bgColor}'">
                :30
            </div>
        </div>`;
    }

    let html = `
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <button onclick="clearTimeAndClose('${taskId}')"
                    style="background: #f0f0f0; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 600;">
                ✕ Clear Time (Untimed)
            </button>
        </div>

        <!-- Morning (6-11) -->
        <div style="margin-bottom: 8px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                ${[6,7,8,9,10,11].map(h => renderTimeRow(h, '#e3f2fd', '#1976d2', '#bbdefb')).join('')}
            </div>
        </div>

        <!-- Afternoon (12-17) -->
        <div style="margin-bottom: 8px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                ${[12,13,14,15,16,17].map(h => renderTimeRow(h, '#fff3e0', '#f57c00', '#ffe0b2')).join('')}
            </div>
        </div>

        <!-- Evening (18-23) -->
        <div style="margin-bottom: 8px;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                ${[18,19,20,21,22,23].map(h => renderTimeRow(h, '#f3e5f5', '#7b1fa2', '#e1bee7')).join('')}
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

    // Auto-focus the selected or first time cell for keyboard navigation
    setTimeout(() => {
        var selected = timeCard.querySelector('[onclick*="setTimeAndClose"][style*="background: #007AFF"]');
        var target = selected || timeCard.querySelector('[onclick*="setTimeAndClose"]');
        if (target) { target.setAttribute('tabindex', '0'); target.focus(); }
    }, 50);
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

async function setTimeAndClose(taskId, time) {
    // Close dropdown first for better UX
    closeTimeDropdown();
    // Update task time and wait for it to complete
    await updateTaskTime(taskId, time, { stopPropagation: () => {} });
    // Batch: also update remaining tasks from G key batch selection
    if (window.pendingTimeBatchIds && window.pendingTimeBatchIds.length > 0) {
        var batchIds = window.pendingTimeBatchIds;
        window.pendingTimeBatchIds = null;
        console.log('🕐 Batch updating time for', batchIds.length, 'additional tasks');
        for (var i = 0; i < batchIds.length; i++) {
            await updateTaskTime(batchIds[i], time, { stopPropagation: () => {} });
        }
    }
}

async function clearTimeAndClose(taskId) {
    // Close dropdown first for better UX
    closeTimeDropdown();
    // Update task time and wait for it to complete
    await updateTaskTime(taskId, '', { stopPropagation: () => {} });
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
    
    const searchTerm = searchInputElement.value.toLowerCase().trim();
    
    if (!searchTerm) {
        // If search is empty, re-render the calendar to show all tasks
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
        return;
    }
    
    // Get current month date range
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    // Filter tasks for current month that match search term
    const filteredTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        const isInMonth = taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                            (task.notes && task.notes.toLowerCase().includes(searchTerm)) ||
                            (task.project && task.project.toLowerCase().includes(searchTerm));
        
        return isInMonth && matchesSearch;
    });
    
    console.log(`🔍 Month search: "${searchTerm}" found ${filteredTasks.length} tasks`);
    
    // Clear all task items from calendar days
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const dayCells = calendarGrid.querySelectorAll('.calendar-day');
    dayCells.forEach(cell => {
        // Remove all task items but keep the day number
        const taskItems = cell.querySelectorAll('.calendar-task-item');
        taskItems.forEach(item => item.remove());
    });
    
    // Group filtered tasks by date
    const tasksByDate = {};
    filteredTasks.forEach(task => {
        const dateStr = task.dueDate.split('T')[0];
        if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = [];
        }
        tasksByDate[dateStr].push(task);
    });
    
    // Add filtered tasks to their respective days
    Object.entries(tasksByDate).forEach(([dateStr, dayTasks]) => {
        const taskDate = new Date(dateStr + 'T00:00:00');
        const day = taskDate.getDate();
        
        // Find the day cell for this date
        const dayCell = Array.from(dayCells).find(cell => {
            const dayNumber = cell.querySelector('.calendar-day-number');
            return dayNumber && parseInt(dayNumber.textContent) === day;
        });
        
        if (dayCell) {
            // Sort tasks for this day
            const sortedTasks = [...dayTasks].sort((a, b) => {
                if (a.isEvent !== b.isEvent) return b.isEvent ? 1 : -1;
                const timeA = a.dueTime || '99:99';
                const timeB = b.dueTime || '99:99';
                return timeA.localeCompare(timeB);
            });
            
            // Add task items
            sortedTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = task.isEvent ? 'calendar-task-item event' : 'calendar-task-item';
                
                const titlePrefix = task.isEvent ? '🔴 ' : '';
                const maxChars = 25;
                let displayText = titlePrefix + task.title;
                
                if (task.title.length > maxChars) {
                    displayText = titlePrefix + task.title.substring(0, maxChars) + '...';
                }
                
                taskElement.textContent = displayText;
                taskElement.style.cursor = 'pointer';
                taskElement.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof openEditTaskModal === 'function') {
                        openEditTaskModal(task);
                    }
                };
                
                dayCell.appendChild(taskElement);
            });
        }
    });
}

function searchWeekTasks() {
    const searchInputElement = document.getElementById('weekTaskSearch');
    if (!searchInputElement) return;
    
    const searchTerm = searchInputElement.value.toLowerCase().trim();
    
    if (!searchTerm) {
        // If search is empty, re-render the week view to show all tasks
        if (typeof renderWeekView === 'function') {
            renderWeekView();
        }
        return;
    }
    
    // Get current week date range using the same method as renderWeekView
    let weekStart;
    if (typeof getMonday === 'function') {
        weekStart = getMonday(currentWeekDate);
    } else {
        // Fallback calculation
        weekStart = new Date(currentWeekDate);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
    }
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Filter tasks for current week that match search term
    const filteredTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        const isInWeek = taskDate >= weekStart && taskDate <= weekEnd;
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                            (task.notes && task.notes.toLowerCase().includes(searchTerm)) ||
                            (task.project && task.project.toLowerCase().includes(searchTerm));
        
        return isInWeek && matchesSearch;
    });
    
    console.log(`🔍 Week search: "${searchTerm}" found ${filteredTasks.length} tasks`);
    
    // Clear all task items from week grid
    const weekGrid = document.getElementById('weekGrid');
    if (!weekGrid) return;
    
    // Remove all existing task items
    const taskItems = weekGrid.querySelectorAll('.week-task-item');
    taskItems.forEach(item => item.remove());
    
    // Group filtered tasks by date
    const tasksByDate = {};
    filteredTasks.forEach(task => {
        const dateStr = task.dueDate.split('T')[0];
        if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = [];
        }
        tasksByDate[dateStr].push(task);
    });
    
    // Add filtered tasks to their respective days
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayElement = weekGrid.children[i];
        
        if (dayElement && tasksByDate[dateStr]) {
            // Sort tasks for this day
            const sortedTasks = [...tasksByDate[dateStr]].sort((a, b) => {
                if (a.isEvent !== b.isEvent) return b.isEvent ? 1 : -1;
                const timeA = a.dueTime || '99:99';
                const timeB = b.dueTime || '99:99';
                return timeA.localeCompare(timeB);
            });
            
            // Add task items
            sortedTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = task.isEvent ? 'week-task-item event' : 'week-task-item';
                
                const titlePrefix = task.isEvent ? '🔴 ' : '';
                const maxChars = 30;
                let displayText = titlePrefix + task.title;
                
                if (task.title.length > maxChars) {
                    displayText = titlePrefix + task.title.substring(0, maxChars) + '...';
                }
                
                taskElement.textContent = displayText;
                taskElement.style.cursor = 'pointer';
                taskElement.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof openEditTaskModal === 'function') {
                        openEditTaskModal(task);
                    }
                };
                
                // Add drag functionality if available
                if (typeof setupTaskDragging === 'function') {
                    taskElement.draggable = true;
                    taskElement.addEventListener('dragstart', (e) => handleDragStart(e, task));
                    taskElement.addEventListener('dragend', handleDragEnd);
                }
                
                dayElement.appendChild(taskElement);
            });
        }
    }
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
    quickBackupJSON(); // Unified - uses full backup
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
    // Revert the most recent action from the registry
    var registry = window.actionRegistry || JSON.parse(localStorage.getItem('actionRegistry') || '[]');
    if (registry.length === 0) {
        console.log('Nothing to undo');
        return;
    }
    revertAction(registry[registry.length - 1].id);
}

/**
 * Revert a specific action from the action registry
 */
function revertAction(actionId) {
    var registry = window.actionRegistry || JSON.parse(localStorage.getItem('actionRegistry') || '[]');
    var idx = registry.findIndex(function(a) { return a.id === actionId; });
    if (idx === -1) {
        console.error('Action not found:', actionId);
        return;
    }
    var action = registry[idx];
    console.log('Reverting action:', action.type, action.taskTitle);

    switch (action.type) {
        case 'create':
        case 'duplicate': {
            // Delete the created task (tombstone)
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task) {
                task.isDeleted = true;
                task.status = 'deleted';
                task.deletedAt = new Date().toISOString();
                task.updatedAt = new Date().toISOString();
            }
            break;
        }
        case 'edit':
        case 'delay': {
            // Restore before fields
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task && action.before) {
                Object.keys(action.before).forEach(function(key) {
                    task[key] = action.before[key];
                });
                task.updatedAt = new Date().toISOString();
            }
            break;
        }
        case 'delete': {
            // Restore the task
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task) {
                task.isDeleted = false;
                task.status = 'pending';
                task.deletedAt = null;
                task.updatedAt = new Date().toISOString();
            } else if (action.before) {
                // Task was fully removed, re-add from snapshot
                var restored = JSON.parse(JSON.stringify(action.before));
                restored.isDeleted = false;
                restored.status = 'pending';
                restored.deletedAt = null;
                restored.updatedAt = new Date().toISOString();
                tasks.push(restored);
            }
            break;
        }
        case 'complete': {
            // Restore previous status
            var task = tasks.find(function(t) { return t.id === action.taskId; });
            if (task && action.before) {
                task.status = action.before.status || 'pending';
                task.isDeleted = action.before.isDeleted || false;
                task.deletedAt = action.before.deletedAt || null;
                task.updatedAt = new Date().toISOString();
            }
            break;
        }
    }

    // Remove action from registry
    registry.splice(idx, 1);
    window.actionRegistry = registry;
    localStorage.setItem('actionRegistry', JSON.stringify(registry));

    // Save and re-render
    if (typeof saveTasksToLocalStorage === 'function') saveTasksToLocalStorage();
    if (typeof sortTasks === 'function') sortTasks();
    if (typeof renderCurrentView === 'function') renderCurrentView();
    if (typeof uploadAllTasks === 'function') uploadAllTasks();

    console.log('Reverted:', action.type, action.taskTitle);
}

window.revertAction = revertAction;

function refreshUndoView() {
    renderRecentActionsView();
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
        // Store the current task ID for when we save
        window.currentDateTimeTaskId = window.currentEditTaskId;
        console.log('📝 Setting currentDateTimeTaskId:', window.currentDateTimeTaskId);
        
        // Get current values from the edit form fields
        const currentDate = document.getElementById('editTaskDateOnly').value;
        const currentTime = document.getElementById('editTaskTimeOnly').value;
        
        console.log('Current date:', currentDate, 'Current time:', currentTime);
        
        // Clear any previously stored modal values
        window.selectedModalDate = '';
        window.selectedModalTime = '';
        modalSelectedDate = null;
        modalSelectedTime = null;
        
        // Only use the date/time if the task actually has them
        const dateToUse = currentDate || '';
        const timeToUse = currentTime || '';
        
        // Initialize the calendar modal with the task's actual date/time (or empty if none)
        initCalendarModal(dateToUse, timeToUse);
        
        // Detect device type and show appropriate version
        const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Always show horizontal desktop version regardless of device
        console.log('🖥️ Always showing horizontal desktop calendar + time picker version');
        
        // Force show desktop version, hide mobile version
        const mobileModal = document.querySelector('.modal-content.mobile-only');
        const desktopModal = document.querySelector('.modal-content.desktop-only');
        if (mobileModal) mobileModal.style.display = 'none';
        if (desktopModal) desktopModal.style.display = 'block';
        
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
                localStorage.setItem('gtdTemplates', JSON.stringify(window.customTemplates));
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

// Template function handled by extracted_js.js - removed duplicate

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
                        localStorage.setItem('gtdTemplates', JSON.stringify(window.customTemplates));
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

function toggleSidebarLanguage() {
    console.log('🌐 toggleSidebarLanguage called');
    var lang = (localStorage.getItem('preferredLanguage') || 'en') === 'en' ? 'es' : 'en';
    console.log('🌐 Switching to:', lang);

    // Update all possible currentLanguage references
    window.currentLanguage = lang;
    if (typeof currentLanguage !== 'undefined') currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);

    // --- data-translate dictionary ---
    var dict = {
        "Today": "Hoy", "Add": "Crear", "Week": "Semana", "Lists": "Listas",
        "More": "Mas", "Month": "Mes", "General": "General", "Data": "Datos",
        "Trash": "Papelera", "Backup": "Respaldo", "Shortcuts": "Atajos",
        "Cancel": "Cancelar", "Import": "Importar", "Enable": "Activar",
        "Quick Backup": "Respaldo Rapido", "Quick Backup JSON": "Respaldo Rapido JSON",
        "Import JSON Backup": "Importar Respaldo JSON", "Import Data": "Importar Datos",
        "Export Data": "Exportar Datos", "Delete All Tasks": "Eliminar Todas las Tareas",
        "+ Add Task": "+ Nueva Tarea", "+ Add": "+ Nueva",
        "Quick filters": "Filtros rapidos:", "TODAY": "HOY", "MONTH": "MES", "WEEK": "SEMANA",
        "Recent Changes (Last 10)": "Cambios Recientes (Ultimos 10)",
        "Press Ctrl+Z to undo or click any item to undo up to that point": "Pulsa Ctrl+Z para deshacer o haz clic en cualquier elemento",
        "No Actions to Undo": "Sin Acciones para Deshacer",
        "Make some changes to see undo history here": "Haz cambios para ver el historial aqui",
        "Create Manual Backup": "Crear Respaldo Manual", "Import Tasks": "Importar Tareas",
        "Paste your tasks below (one per line):": "Pega tus tareas abajo (una por linea):",
        "Mobile UI Version": "Version Movil", "Keyboard-Only Mode": "Modo Solo Teclado",
        "Hide buttons that have keyboard shortcuts, forcing keyboard-only navigation": "Ocultar botones con atajos de teclado",
        "Text Files": "Archivos de Texto",
        "Enable Automatic Backups": "Habilitar Respaldos Automaticos",
        "Automatically create backups based on your schedule": "Crear respaldos automaticamente segun tu horario",
        "Choose Backup Types:": "Elegir Tipos de Respaldo:",
        "Daily Backups": "Respaldos Diarios", "Weekly Backups": "Respaldos Semanales",
        "Monthly Backups": "Respaldos Mensuales",
        "Select which automatic backups you want to enable": "Selecciona que respaldos automaticos quieres habilitar",
        "View Backup Stats": "Ver Estadisticas de Respaldo",
        "Delete all tasks permanently - this cannot be undone": "Eliminar todas las tareas permanentemente",
        "Quick Import": "Importacion Rapida",
        "Choose the type of file you want to import:": "Elige el tipo de archivo a importar:",
        "Import Backup": "Importar Respaldo", "Import TXT File": "Importar Archivo TXT",
        "Supported formats: .json, .txt": "Formatos: .json, .txt"
    };
    document.querySelectorAll('[data-translate]').forEach(function(el) {
        var key = el.getAttribute('data-translate');
        // Extract leading emoji from current content
        var currentText = el.textContent.trim();
        var emojiMatch = currentText.match(/^([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]+\s*)/u);
        var emoji = emojiMatch ? emojiMatch[1] : '';
        if (lang === 'es' && dict[key]) {
            el.textContent = emoji + dict[key];
        } else if (lang === 'en') {
            el.textContent = emoji + key;
        }
    });

    // --- Button translations (with emoji prefix) ---
    var btnMap = {
        '← Prev': '← Ant.', 'Next →': 'Sig. →', '📥 Bulk': '📥 Lote',
        '🕐 Now': '🕐 Ahora', '🔥 Today': '🔥 Hoy',
        '💾 Quick Backup': '💾 Respaldo Rapido',
        '📥 Import JSON': '📥 Importar JSON',
        '✖ Clear': '✖ Borrar',
        '📊 Review': '📊 Revisar',
        '📂 Expand All': '📂 Expandir Todo',
        '📁 Collapse All': '📁 Colapsar Todo',
        '📄 Export Results': '📄 Exportar Resultados',
        '+ New Section': '+ Nueva Seccion',
        '📁 Toggle All': '📁 Alternar Todo',
        '📋 Import TXT': '📋 Importar TXT',
        '📤 Export Data': '📤 Exportar Datos',
        '📥 Import Data': '📥 Importar Datos',
        'Clear All': 'Borrar Todo',
        '↶ Undo Last': '↶ Deshacer',
        'Delete All Data': 'Borrar Todos los Datos',
        '📤 Export JSON': '📤 Exportar JSON',
        '📥 Import JSON': '📥 Importar JSON',
        '💾 Create Backup': '💾 Crear Respaldo',
        '🔄 Refresh': '🔄 Actualizar',
        '🔄 Refresh Status': '🔄 Actualizar Estado',
        '🗑️ Empty Trash': '🗑️ Vaciar Papelera',
        '+ Add Item': '+ Nuevo Elemento',
        '🗑️ Delete': '🗑️ Eliminar',
        'Close': 'Cerrar',
        'Save Task': 'Guardar Tarea',
        'Delete': 'Eliminar',
        'Reset': 'Reiniciar',
        'Add': 'Crear',
        'Apply': 'Aplicar',
        'Save': 'Guardar',
        'Save Changes': 'Guardar Cambios',
        'Tomorrow': 'Manana',
        '+1W': '+1S',
        'Complete': 'Completar',
        'Next Week': 'Proxima Semana'
    };
    var btnMapReverse = {};
    Object.keys(btnMap).forEach(function(k) { btnMapReverse[btnMap[k]] = k; });
    document.querySelectorAll('button:not(.nav-btn)').forEach(function(btn) {
        var t = btn.textContent.trim();
        if (lang === 'es' && btnMap[t]) {
            btn.textContent = btnMap[t];
        } else if (lang === 'en' && btnMapReverse[t]) {
            btn.textContent = btnMapReverse[t];
        }
    });

    // --- Headings (h3, h4, h5) ---
    var headingMap = {
        '🔍 Search Tasks': '🔍 Buscar Tareas',
        '📋 All Tasks': '📋 Todas las Tareas',
        '🔄 Repeat Management': '🔄 Gestion de Repeticiones',
        '📝 Lists Management': '📝 Gestion de Listas',
        '⚙️ Settings & Statistics': '⚙️ Ajustes y Estadisticas',
        '↶ Undo Management': '↶ Gestion de Deshacer',
        '✏️ Edit Task': '✏️ Editar Tarea',
        '📅 Select Date & Time': '📅 Seleccionar Fecha y Hora',
        '⌨️ Keyboard Shortcuts': '⌨️ Atajos de Teclado',
        '🗑️ Trash': '🗑️ Papelera',
        '📋 List Items': '📋 Elementos de Lista',
        '🚀 Quick Actions': '🚀 Acciones Rapidas',
        '⚠️ Danger Zone': '⚠️ Zona Peligrosa',
        '💾 Backup Status': '💾 Estado de Respaldos',
        '📅 Last Backup Dates': '📅 Ultimas Fechas de Respaldo',
        '📤 Import / Export JSON Backup': '📤 Importar / Exportar Respaldo JSON',
        '📁 Recent Backup Files (Latest 3 of each type)': '📁 Archivos Recientes (Ultimos 3 de cada tipo)',
        '🔧 Backup Management': '🔧 Gestion de Respaldos',
        '📈 Productivity Insights': '📈 Productividad',
        '📊 Task Completion Analysis': '📊 Analisis de Tareas',
        '⚙️ Application Settings': '⚙️ Ajustes de Aplicacion',
        '🖨️ Auto-Print Settings': '🖨️ Impresion Automatica',
        '☁️ Sync Settings': '☁️ Ajustes de Sincronizacion',
        '👤 Account Information': '👤 Informacion de Cuenta',
        '🔧 Advanced Settings': '🔧 Ajustes Avanzados',
        '💾 Backup Settings': '💾 Ajustes de Respaldo',
        '📋 Advanced Import/Export': '📋 Importar/Exportar Avanzado',
        '📤 Export Formats:': '📤 Formatos de Exportacion:'
    };
    var headingMapReverse = {};
    Object.keys(headingMap).forEach(function(k) { headingMapReverse[headingMap[k]] = k; });
    document.querySelectorAll('h3, h4, h5').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && headingMap[t]) {
            el.textContent = headingMap[t];
        } else if (lang === 'en' && headingMapReverse[t]) {
            el.textContent = headingMapReverse[t];
        }
    });

    // --- Settings tabs ---
    var tabMap = {
        '📊 Overview': '📊 Resumen',
        '💾 Backups': '💾 Respaldos',
        '📈 Analytics': '📈 Analiticas',
        '⚙️ Settings': '⚙️ Ajustes',
        '🎛️ General': '🎛️ General',
        '💾 Data': '💾 Datos',
        '🗑️ Trash': '🗑️ Papelera',
        '🛡️ Backup': '🛡️ Respaldo',
        '⌨️ Shortcuts': '⌨️ Atajos'
    };
    var tabMapReverse = {};
    Object.keys(tabMap).forEach(function(k) { tabMapReverse[tabMap[k]] = k; });

    // --- Statistics labels ---
    var statMap = {
        'Total Tasks': 'Total Tareas', 'Completed': 'Completadas', 'Pending': 'Pendientes',
        'Overdue': 'Atrasadas', 'Due Today': 'Para Hoy', 'Critical Tasks': 'Tareas Criticas',
        'Daily Backups': 'Respaldos Diarios', 'Weekly Backups': 'Respaldos Semanales',
        'Monthly Backups': 'Respaldos Mensuales', 'Manual Exports': 'Exportaciones Manuales'
    };
    var statMapReverse = {};
    Object.keys(statMap).forEach(function(k) { statMapReverse[statMap[k]] = k; });

    // --- Labels ---
    var labelMap = {
        'Date Format:': 'Formato de Fecha:',
        'Time Format:': 'Formato de Hora:',
        'Week Starts On:': 'Semana Empieza:',
        'Sync Period:': 'Periodo de Sincronizacion:',
        'Email:': 'Correo:',
        'Language / Idioma': 'Idioma / Language',
        'Select date & time...': 'Seleccionar fecha y hora...',
        'Deleted tasks are stored here': 'Las tareas eliminadas se guardan aqui',
        'No Items Yet': 'Sin Elementos',
        'Add your first item to get started.': 'Agrega tu primer elemento.',
        'No Tasks Yet!': 'Sin Tareas!',
        'Add Your First Task': 'Crea Tu Primera Tarea',
        'No Sections Yet!': 'Sin Secciones!',
        'Create First Section': 'Crear Primera Seccion',
        'Download all tasks as JSON file': 'Descargar todas las tareas como JSON',
        'Upload JSON backup file': 'Subir archivo de respaldo JSON',
        'HyperFiler Pro': 'HyperFiler Pro'
    };
    var labelMapReverse = {};
    Object.keys(labelMap).forEach(function(k) { labelMapReverse[labelMap[k]] = k; });

    // --- Keyboard shortcuts section ---
    var kbMap = {
        '📱 Navigation': '📱 Navegacion', '⚡ Actions': '⚡ Acciones',
        'Today View': 'Vista Hoy', 'Week View': 'Vista Semana', 'Month View': 'Vista Mes',
        'All Tasks + Search': 'Todas las Tareas + Buscar',
        'Repeat View': 'Vista Repeticiones', 'Undo View': 'Vista Deshacer',
        'Lists View': 'Vista Listas', 'Statistics View': 'Vista Estadisticas',
        'New Task': 'Nueva Tarea', 'Search in Current View': 'Buscar en Vista Actual',
        'Filter Navigation': 'Navegacion Filtros',
        'Time Dropdown (Selected Task)': 'Hora (Tarea Seleccionada)',
        'Open Trash': 'Abrir Papelera', 'Undo (up to 10 steps)': 'Deshacer (hasta 10 pasos)',
        'Export All Data (text file)': 'Exportar Todos los Datos (texto)'
    };
    var kbMapReverse = {};
    Object.keys(kbMap).forEach(function(k) { kbMapReverse[kbMap[k]] = k; });

    // --- Review format options ---
    var reviewMap = {
        '📄 HTML Report': '📄 Informe HTML', '📝 Plain Text': '📝 Texto Plano',
        '📄 PDF Document': '📄 Documento PDF', '📋 Org-mode': '📋 Org-mode'
    };
    var reviewMapReverse = {};
    Object.keys(reviewMap).forEach(function(k) { reviewMapReverse[reviewMap[k]] = k; });

    // --- Mobile task options ---
    var mobileMap = {
        'Complete': 'Completar', 'Tomorrow': 'Manana', 'Next Week': 'Proxima Semana', 'Delete': 'Eliminar'
    };
    var mobileMapReverse = {};
    Object.keys(mobileMap).forEach(function(k) { mobileMapReverse[mobileMap[k]] = k; });

    // --- Day headers ---
    var dayMap = { 'Su': 'Do', 'Mo': 'Lu', 'Tu': 'Ma', 'We': 'Mi', 'Th': 'Ju', 'Fr': 'Vi', 'Sa': 'Sa' };
    var dayMapReverse = {};
    Object.keys(dayMap).forEach(function(k) { dayMapReverse[dayMap[k]] = k; });

    // Merge all maps for span/label/small/p/div text translation
    var allMaps = [tabMap, statMap, labelMap, kbMap, reviewMap, mobileMap];
    var allReverse = [tabMapReverse, statMapReverse, labelMapReverse, kbMapReverse, reviewMapReverse, mobileMapReverse];

    // Translate all generic text elements
    try {
        document.querySelectorAll('span, small, p, label').forEach(function(el) {
            if (el.children.length > 0 && el.tagName !== 'LABEL') return;
            var t = el.textContent.trim();
            if (!t || t.length > 200) return;
            for (var i = 0; i < allMaps.length; i++) {
                if (lang === 'es' && allMaps[i][t]) {
                    el.textContent = allMaps[i][t];
                    return;
                } else if (lang === 'en' && allReverse[i][t]) {
                    el.textContent = allReverse[i][t];
                    return;
                }
            }
        });
    } catch(e) { console.error('Translation error:', e); }

    // --- Settings tabs (buttons with class settings-tab) ---
    document.querySelectorAll('.settings-tab').forEach(function(btn) {
        var t = btn.textContent.trim();
        if (lang === 'es' && tabMap[t]) btn.textContent = tabMap[t];
        else if (lang === 'en' && tabMapReverse[t]) btn.textContent = tabMapReverse[t];
    });

    // --- Stat labels (div.stat-label) ---
    document.querySelectorAll('.stat-label').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && statMap[t]) el.textContent = statMap[t];
        else if (lang === 'en' && statMapReverse[t]) el.textContent = statMapReverse[t];
    });

    // --- Paragraphs with specific text ---
    var paraMap = {
        'This action cannot be undone. All your tasks, settings, and data will be permanently deleted.':
            'Esta accion no se puede deshacer. Todas tus tareas, ajustes y datos se eliminaran permanentemente.',
        'Deleted tasks are stored here': 'Las tareas eliminadas se guardan aqui',
        'Add your first item to get started.': 'Agrega tu primer elemento para empezar.'
    };
    var paraMapReverse = {};
    Object.keys(paraMap).forEach(function(k) { paraMapReverse[paraMap[k]] = k; });
    document.querySelectorAll('p').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && paraMap[t]) el.textContent = paraMap[t];
        else if (lang === 'en' && paraMapReverse[t]) el.textContent = paraMapReverse[t];
    });

    // Translate day headers in calendar
    document.querySelectorAll('.day-header, .calendar-day-header').forEach(function(el) {
        var t = el.textContent.trim();
        if (lang === 'es' && dayMap[t]) el.textContent = dayMap[t];
        else if (lang === 'en' && dayMapReverse[t]) el.textContent = dayMapReverse[t];
    });

    // --- Comprehensive text replacement for ALL remaining elements ---
    var allText = {
        // Settings Preferences tab
        'Enable auto-print for today\'s tasks': 'Activar impresion automatica de tareas de hoy',
        'When enabled, today\'s tasks will be automatically printed': 'Cuando esta activado, las tareas de hoy se imprimiran automaticamente',
        'Sync Status:': 'Estado de Sincronizacion:',
        'Sync Period:': 'Periodo de Sincronizacion:',
        'Last 30 days': 'Ultimos 30 dias',
        'Last 60 days': 'Ultimos 60 dias',
        'Last 90 days': 'Ultimos 90 dias',
        'Last 6 months': 'Ultimos 6 meses',
        'Last year': 'Ultimo ano',
        'All data': 'Todos los datos',
        'Email:': 'Correo:',
        'Plan:': 'Plan:',
        'Switch Version': 'Cambiar Version',
        'Save Settings': 'Guardar Ajustes',
        'Bulk Import': 'Importar en Lote',
        'Toggle between different mobile interface versions for optimal experience on your device.':
            'Alternar entre versiones de interfaz movil para mejor experiencia en tu dispositivo.',
        'Configure automatic backup preferences and backup frequency settings.':
            'Configurar preferencias de respaldo automatico y frecuencia.',
        'Advanced import options for bulk data migration and specialized export formats.':
            'Opciones avanzadas de importacion masiva y formatos de exportacion.',
        '🚪 Logout': '🚪 Cerrar Sesion',
        'Loading...': 'Cargando...',
        '✅ Connected': '✅ Conectado',
        // Sync info bullets
        '• New devices sync only recent data': '• Los dispositivos nuevos sincronizan solo datos recientes',
        '• Old tasks (90+ days) won\'t upload to cloud': '• Las tareas antiguas (+90 dias) no suben a la nube',
        '• Existing synced devices work normally': '• Los dispositivos sincronizados funcionan normalmente',
        // Backups tab
        'Download all tasks as JSON file': 'Descargar todas las tareas como archivo JSON',
        'Upload JSON backup file': 'Subir archivo de respaldo JSON',
        // Undo
        '🔄 Refresh': '🔄 Actualizar',
        '🔍 Search Tasks': '🔍 Buscar Tareas',
        'Recent Actions': 'Acciones Recientes',
        'recent actions': 'acciones recientes',
        'Deleted Task': 'Tarea Eliminada',
        'Restore All Deleted': 'Restaurar Eliminadas',
        'Delete All': 'Eliminar Todo',
        'Dark': 'Oscuro',
        'Light': 'Claro',
        'Due:': 'Vence:',
        'at': 'a las',
        'Restore': 'Restaurar',
        'Settings': 'Ajustes',
        'GTD Reviews': 'Revisiones GTD',
        'Generate task reviews following Getting Things Done methodology':
            'Generar revisiones de tareas siguiendo la metodologia Getting Things Done',
        'Daily Review': 'Revision Diaria',
        'Weekly Review': 'Revision Semanal',
        'Projects': 'Proyectos',
        'Choose export formats in the popup': 'Elige formatos de exportacion en el popup',
        'Display Options': 'Opciones de Visualizacion',
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miercoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sabado', 'Sunday': 'Domingo',
        'English': 'English', 'Español': 'Español',
        'Import/Export': 'Importar/Exportar',
        'Export Tasks': 'Exportar Tareas',
        'Import Tasks': 'Importar Tareas',
        'Export Today HTML': 'Exportar Hoy HTML',
        'Export Week HTML': 'Exportar Semana HTML',
        'Export Month HTML': 'Exportar Mes HTML',
        'Keyboard & Advanced': 'Teclado y Avanzado',
        'Keyboard-Only Mode': 'Modo Solo Teclado',
        'Hide mouse buttons, show only keyboard shortcuts': 'Ocultar botones del raton, mostrar solo atajos de teclado',
        'Switch Mobile UI': 'Cambiar a UI Movil',
        'Save Backup Settings': 'Guardar Ajustes de Respaldo',
        'Recent Actions': 'Acciones Recientes',
        'Deleted Task': 'Tarea Eliminada',
        'Refresh': 'Actualizar',
        'recent actions': 'acciones recientes'
    };
    var allTextReverse = {};
    Object.keys(allText).forEach(function(k) { allTextReverse[allText[k]] = k; });

    // Scan all text nodes in the document
    function translateElements(selector) {
        document.querySelectorAll(selector).forEach(function(el) {
            // Only process leaf elements or elements with simple text
            var t = el.textContent.trim();
            if (!t || t.length > 300) return;

            // Check direct text content match
            if (lang === 'es' && allText[t]) {
                el.textContent = allText[t];
            } else if (lang === 'en' && allTextReverse[t]) {
                el.textContent = allTextReverse[t];
            } else {
                // Try stripping leading emoji prefix
                var emojiMatch = t.match(/^([\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]+\s*)/u);
                if (emojiMatch) {
                    var stripped = t.slice(emojiMatch[1].length).trim();
                    if (lang === 'es' && allText[stripped]) {
                        el.textContent = emojiMatch[1] + allText[stripped];
                    } else if (lang === 'en' && allTextReverse[stripped]) {
                        el.textContent = emojiMatch[1] + allTextReverse[stripped];
                    }
                }
            }
        });
    }
    translateElements('h2, h3, h4, h5, p, strong, span, div.stat-label, button, option, label');

    // For div elements with description text, translate if matches
    document.querySelectorAll('div').forEach(function(el) {
        if (el.children.length > 0) return;
        var t = el.textContent.trim();
        if (lang === 'es' && allText[t]) el.textContent = allText[t];
        else if (lang === 'en' && allTextReverse[t]) el.textContent = allTextReverse[t];
    });

    // --- Dynamic text with numbers (regex-based) ---
    document.querySelectorAll('h2, h3, h4, span, div, button').forEach(function(el) {
        if (el.children.length > 1) return;
        var t = el.textContent.trim();
        var m;
        if (lang === 'es') {
            // "Recent Actions" heading
            if (t === 'Recent Actions') el.textContent = 'Acciones Recientes';
            // "439 recent actions"
            m = t.match(/^(\d+)\s+recent actions$/);
            if (m) el.textContent = m[1] + ' acciones recientes';
            // "Restore All Deleted (439)"
            m = t.match(/^Restore All Deleted\s*\((\d+)\)$/);
            if (m) el.textContent = 'Restaurar Eliminadas (' + m[1] + ')';
            // "Delete All (439)"
            m = t.match(/^Delete All\s*\((\d+)\)$/);
            if (m) el.textContent = 'Eliminar Todo (' + m[1] + ')';
            // "Deleted Task"
            if (t === 'Deleted Task') el.textContent = 'Tarea Eliminada';
            // "Dark" / "Light" theme toggle
            if (t === '🌙 Dark') el.textContent = '🌙 Oscuro';
            if (t === '☀️ Light') el.textContent = '☀️ Claro';
            // "Undo Management" heading
            if (t === '↶ Undo Management') el.textContent = '↶ Gestion de Deshacer';
            // "Recent Changes" with emoji
            if (t === '⏮️ Recent Actions' || t === '⏮ Recent Actions') el.textContent = '⏮️ Acciones Recientes';
        } else {
            if (t === 'Acciones Recientes') el.textContent = 'Recent Actions';
            m = t.match(/^(\d+)\s+acciones recientes$/);
            if (m) el.textContent = m[1] + ' recent actions';
            m = t.match(/^Restaurar Eliminadas\s*\((\d+)\)$/);
            if (m) el.textContent = 'Restore All Deleted (' + m[1] + ')';
            m = t.match(/^Eliminar Todo\s*\((\d+)\)$/);
            if (m) el.textContent = 'Delete All (' + m[1] + ')';
            if (t === 'Tarea Eliminada') el.textContent = 'Deleted Task';
            if (t === '🌙 Oscuro') el.textContent = '🌙 Dark';
            if (t === '☀️ Claro') el.textContent = '☀️ Light';
            if (t === '↶ Gestion de Deshacer') el.textContent = '↶ Undo Management';
            if (t === '⏮️ Acciones Recientes' || t === '⏮ Acciones Recientes') el.textContent = '⏮️ Recent Actions';
        }
    });

    // --- Search placeholders ---
    document.querySelectorAll('input[placeholder]').forEach(function(input) {
        var p = input.placeholder;
        if (lang === 'es') {
            if (p === '🔍 Day') input.placeholder = '🔍 Dia';
            else if (p === '🔍 Week') input.placeholder = '🔍 Semana';
            else if (p === '🔍 Month') input.placeholder = '🔍 Mes';
            else if (p.includes('Search by title')) input.placeholder = '🔍 Buscar por titulo, notas o fecha...';
            else if (p.includes('Search tasks')) input.placeholder = '🔍 Buscar tareas...';
            else if (p === 'Select date & time...') input.placeholder = 'Seleccionar fecha y hora...';
            else if (p.includes('Search actions')) input.placeholder = '🔍 Buscar acciones...';
        } else {
            if (p === '🔍 Dia') input.placeholder = '🔍 Day';
            else if (p === '🔍 Semana') input.placeholder = '🔍 Week';
            else if (p === '🔍 Mes') input.placeholder = '🔍 Month';
            else if (p.includes('Buscar por titulo')) input.placeholder = '🔍 Search by title, notes, or date...';
            else if (p.includes('Buscar tareas')) input.placeholder = '🔍 Search tasks...';
            else if (p === 'Seleccionar fecha y hora...') input.placeholder = 'Select date & time...';
            else if (p.includes('Buscar acciones')) input.placeholder = '🔍 Search actions...';
        }
    });

    // Translate nav buttons (emoji + text + shortcut key)
    var navMap = {
        'nav-today':          { icon: '📋', en: 'Today',    es: 'Hoy',      key: 'D' },
        'nav-week':           { icon: '📊', en: 'Week',     es: 'Semana',   key: 'W' },
        'nav-calendar':       { icon: '📆', en: 'Month',    es: 'Mes',      key: 'M' },
        'nav-all':            { icon: '🔍', en: 'Search',   es: 'Buscar',   key: 'S' },
        'nav-lists':          { icon: '📂', en: 'Lists',    es: 'Listas',   key: 'L' },
        'nav-repeat':         { icon: '🔄', en: 'Repeat',   es: 'Repetir',  key: 'R' },
        'nav-recent-actions': { icon: '⏮️', en: 'Undo',     es: 'Deshacer', key: 'U' },
        'nav-settings':       { icon: '⚙️', en: 'Settings', es: 'Ajustes',  key: 'X' }
    };
    Object.keys(navMap).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            var n = navMap[id];
            var text = lang === 'es' ? n.es : n.en;
            el.innerHTML = n.icon + ' ' + text + ' <span style="opacity: 0.7; font-size: 11px; color: #666;">' + n.key + '</span>';
        }
    });

    var btn = document.getElementById('sidebarLangToggle');
    if (btn) {
        btn.textContent = lang === 'en' ? '🇪🇸 ES' : '🇬🇧 EN';
    }
    console.log('🌐 Language switched to:', lang);
}
window.toggleSidebarLanguage = toggleSidebarLanguage;

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
        console.log('🔍 Current view:', window.currentView);
        
        // IMMEDIATE render without delay + clear filters
        if (window.currentView === 'today' && typeof renderTodayView === 'function') {
            console.log('📅 Rendering today view immediately');
            renderTodayView();
        } else if (window.currentView === 'week' && typeof renderWeekView === 'function') {
            console.log('📅 Rendering week view immediately');
            // Clear week filters
            const weekSearchInput = document.getElementById('weekTaskSearch');
            if (weekSearchInput) weekSearchInput.value = '';
            if (typeof activeWeekTemplateFilter !== 'undefined') {
                activeWeekTemplateFilter = null;
            }
            renderWeekView();
        } else if (window.currentView === 'calendar' && typeof renderCalendar === 'function') {
            console.log('📅 Rendering calendar view immediately');
            
            // Clear month filters BEFORE rendering
            const monthSearchInput = document.getElementById('monthTaskSearch');
            if (monthSearchInput) {
                monthSearchInput.value = '';
                console.log('🧹 Cleared month search filter');
            }
            if (typeof activeMonthTemplateFilter !== 'undefined') {
                activeMonthTemplateFilter = null;
                console.log('🧹 Cleared month template filter');
            }
            if (typeof window !== 'undefined') {
                window.currentMonthFilteredTasks = null;
                window.currentMonthSearchTerm = null;
                console.log('🧹 Cleared month filtered tasks cache');
            }
            
            renderCalendar();
            console.log('✅ Calendar rendered successfully');
        } else if (typeof renderCurrentView === 'function') {
            console.log('📅 Rendering current view as fallback');
            renderCurrentView();
        } else {
            console.error('❌ No render function available!');
        }
        
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
    // CSS handles hiding via body.keyboard-only-mode (survives re-renders)
    if (keyboardOnlyMode) {
        document.body.classList.add('keyboard-only-mode');
    } else {
        document.body.classList.remove('keyboard-only-mode');
    }
    if (typeof showInlineNotification === 'function') {
        showInlineNotification(keyboardOnlyMode ? '⌨️ Keyboard-only mode ON' : '🖱️ Keyboard-only mode OFF', 'success');
    }
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

function toggleMobileUIVersion() {
    var select = document.getElementById('mobileUIVersion');
    if (select) {
        var version = select.value;
        localStorage.setItem('mobileUIVersion', version);
        applyMobileUIVersion(version);
        console.log('📱 Mobile UI version changed to:', version);
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('📱 Mobile interface updated', 'success');
        }
    } else {
        // Toggle between m1 and m2 if no select element
        var current = localStorage.getItem('mobileUIVersion') || 'm1';
        var next = current === 'm1' ? 'm2' : 'm1';
        localStorage.setItem('mobileUIVersion', next);
        applyMobileUIVersion(next);
        console.log('📱 Mobile UI toggled to:', next);
        if (typeof showInlineNotification === 'function') {
            showInlineNotification('📱 Mobile UI: ' + next, 'success');
        }
    }
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

function toggleKeyboardOnlyMode(forceState) {
    var enabled;
    if (typeof forceState === 'boolean') {
        enabled = forceState;
    } else {
        // Toggle current state
        var current = localStorage.getItem('keyboardOnlyMode');
        enabled = !(current === 'true');
    }
    localStorage.setItem('keyboardOnlyMode', String(enabled));
    // Sync all checkboxes with this id
    document.querySelectorAll('#keyboardOnlyMode, input[id="keyboardOnlyMode"]').forEach(function(cb) {
        cb.checked = enabled;
    });
    applyKeyboardOnlyMode(enabled);
}

// Return task ID as-is (IDs are strings in the tasks array)
function parseTaskId(raw) {
    return raw;
}

// Keyboard shortcuts (missing-functions.js)
document.addEventListener('keydown', function(event) {
    // Skip if typing in input fields
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.contentEditable === 'true')) {
        return;
    }

    // Skip if a date or time dropdown overlay is open (let clicks/keys go to the dropdown)
    if (window.currentDateDropdown || window.currentTimeDropdown) {
        return;
    }

    // Ctrl+K: toggle keyboard-only mode
    if (event.ctrlKey && (event.key === 'k' || event.key === 'K') && !event.altKey && !event.metaKey) {
        event.preventDefault();
        toggleKeyboardOnlyMode();
        return;
    }

    // Only handle non-modifier keys below
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // Q: quick backup
    if (event.key === 'q' || event.key === 'Q') {
        event.preventDefault();
        if (typeof quickBackupJSON === 'function') quickBackupJSON();
        return;
    }

    // I: import
    if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        if (typeof importTasks === 'function') importTasks();
        return;
    }

    var allTasks = document.querySelectorAll('.task-card[data-task-id], .task-item[data-task-id]');
    if (allTasks.length === 0) return;

    var current = document.querySelector('.task-selected');
    var currentIdx = -1;
    if (current) {
        allTasks.forEach(function(el, i) { if (el === current) currentIdx = i; });
    }

    // Arrow Up/Down: navigate tasks
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        var next = currentIdx < allTasks.length - 1 ? currentIdx + 1 : 0;
        if (current) current.classList.remove('task-selected');
        allTasks[next].classList.add('task-selected');
        allTasks[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
    }
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        var prev = currentIdx > 0 ? currentIdx - 1 : allTasks.length - 1;
        if (current) current.classList.remove('task-selected');
        allTasks[prev].classList.add('task-selected');
        allTasks[prev].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
    }

    // Enter: edit selected task
    if (event.key === 'Enter' && current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var eid = parseTaskId(current.getAttribute('data-task-id'));
        if (eid && typeof editTask === 'function') {
            editTask(eid);
        }
        return;
    }

    // Space: toggle batch selection
    if (event.key === ' ' && current) {
        event.preventDefault();
        current.classList.toggle('selected');
        return;
    }

    // Helper: get batch-selected tasks or fall back to current
    var batchSelected = document.querySelectorAll('.task-card.selected, .task-item.selected');
    var targets = batchSelected.length > 0 ? batchSelected : (current ? [current] : []);

    // D or Delete: delete task(s)
    if ((event.key === 'Delete' || event.key === 'd' || event.key === 'D') && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var did = parseTaskId(el.getAttribute('data-task-id'));
            if (did && typeof deleteTask === 'function') deleteTask(did);
        });
        return;
    }

    // C: copy/duplicate task(s)
    if ((event.key === 'c' || event.key === 'C') && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var cid = parseTaskId(el.getAttribute('data-task-id'));
            if (cid && typeof duplicateTask === 'function') duplicateTask(cid, event);
        });
        return;
    }

    // F: open calendar dropdown (same as clicking calendar emoji on task line)
    if ((event.key === 'f' || event.key === 'F') && targets.length > 0) {
        event.preventDefault();
        var batchIds = [];
        targets.forEach(function(el) {
            var fid = parseTaskId(el.getAttribute('data-task-id'));
            if (fid) batchIds.push(fid);
        });
        if (batchIds.length === 0) return;
        // Store extra batch IDs (excluding the first, which the dropdown handles directly)
        window.pendingDateTimeBatchIds = batchIds.length > 1 ? batchIds.slice(1) : null;
        var firstId = batchIds[0];
        var firstTask = window.tasks ? window.tasks.find(function(t) { return t.id === firstId || t.id == firstId; }) : null;
        var existingDate = firstTask ? (firstTask.dueDate || '') : '';
        var existingTime = firstTask ? (firstTask.dueTime || '') : '';
        // Find the button element on the first target task card, or use the card itself
        var btnEl = targets[0].querySelector('[onclick*="openIOSDateTimePicker"]') || targets[0];
        if (typeof openIOSDateTimePicker === 'function') {
            openIOSDateTimePicker(firstId, existingDate, existingTime, btnEl);
        }
        return;
    }

    // G: open time dropdown (same as clicking clock emoji on task line)
    if ((event.key === 'g' || event.key === 'G') && targets.length > 0) {
        event.preventDefault();
        var batchIdsG = [];
        targets.forEach(function(el) {
            var gid = parseTaskId(el.getAttribute('data-task-id'));
            if (gid) batchIdsG.push(gid);
        });
        if (batchIdsG.length === 0) return;
        window.pendingTimeBatchIds = batchIdsG.length > 1 ? batchIdsG.slice(1) : null;
        var firstIdG = batchIdsG[0];
        var firstTaskG = window.tasks ? window.tasks.find(function(t) { return t.id === firstIdG || t.id == firstIdG; }) : null;
        var existingTimeG = firstTaskG ? (firstTaskG.dueTime || '') : '';
        var btnElG = targets[0].querySelector('[onclick*="openTimeDropdown"]') || targets[0];
        if (typeof openTimeDropdown === 'function') {
            openTimeDropdown(firstIdG, existingTimeG, btnElG);
        }
        return;
    }

    // 1: delay +1 day
    if (event.key === '1' && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var d1id = parseTaskId(el.getAttribute('data-task-id'));
            if (d1id && typeof delayTask === 'function') delayTask(d1id, 1);
        });
        return;
    }

    // 7: delay +1 week
    if (event.key === '7' && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var d7id = parseTaskId(el.getAttribute('data-task-id'));
            if (d7id && typeof delayTask === 'function') delayTask(d7id, 7);
        });
        return;
    }

    // 3: delay +1 month
    if (event.key === '3' && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var d3id = parseTaskId(el.getAttribute('data-task-id'));
            if (d3id && typeof delayTask === 'function') delayTask(d3id, 30);
        });
        return;
    }

    // Escape: clear selection
    if (event.key === 'Escape' && current) {
        current.classList.remove('task-selected');
        return;
    }
});

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
    console.log('🔧 [missing-functions.js] renderTemplateButtons called - THE REAL ONE');
    console.log('📋 window.customTemplates:', window.customTemplates);
    console.log('📋 window.customTemplates length:', window.customTemplates?.length);
    
    const container = document.getElementById('templateButtons');
    if (!container) {
        console.log('❌ templateButtons container not found');
        return;
    }
    
    console.log('✅ templateButtons container found');
    container.innerHTML = '';
    
    if (!window.customTemplates || window.customTemplates.length === 0) {
        console.log('❌ No templates found');
        container.innerHTML = '<span style="color: #999; font-size: 12px;">No templates created yet</span>';
        return;
    }
    
    console.log(`🎨 About to render ${window.customTemplates.length} templates`);
    window.customTemplates.forEach((template, index) => {
        console.log(`🔄 Processing template ${index + 1}/${window.customTemplates.length}: "${template}"`);
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
        
        console.log(`➕ Adding button for template "${template}" to container`);
        container.appendChild(button);
        console.log(`✅ Button added. Container now has ${container.children.length} buttons`);
    });
    
    console.log(`🏁 renderTemplateButtons completed. Final button count: ${container.children.length}`);
    console.log('🔍 Final container children:', Array.from(container.children).map(btn => btn.textContent));
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
    console.log('🗑️ [ULTRA-DEBUG] deleteTemplate called for:', template);
    console.log('🗑️ [ULTRA-DEBUG] window.customTemplates before deletion:', window.customTemplates);
    console.log('🗑️ [ULTRA-DEBUG] localStorage before deletion:', localStorage.getItem('gtdTemplates'));
    
    if (!window.customTemplates) {
        console.log('🗑️ [ULTRA-DEBUG] No window.customTemplates found, returning');
        return;
    }
    
    // Filter out the template
    const beforeLength = window.customTemplates.length;
    window.customTemplates = window.customTemplates.filter(t => t !== template);
    const afterLength = window.customTemplates.length;
    
    console.log('🗑️ [ULTRA-DEBUG] Templates before deletion:', beforeLength);
    console.log('🗑️ [ULTRA-DEBUG] Templates after deletion:', afterLength);
    console.log('🗑️ [ULTRA-DEBUG] Remaining templates:', window.customTemplates);
    
    // Save templates - use same key as tasks.js
    const templatesJSON = JSON.stringify(window.customTemplates);
    localStorage.setItem('gtdTemplates', templatesJSON);
    console.log('🗑️ [ULTRA-DEBUG] Saved to localStorage:', templatesJSON);
    
    // Set persistent protection flag that survives page reload
    const protectionData = {
        flag: true,
        timestamp: Date.now(),
        action: 'template_deletion',
        deletedTemplate: template
    };
    localStorage.setItem('templateProtection', JSON.stringify(protectionData));
    window.justModifiedTemplates = true;
    console.log('🗑️ [ULTRA-DEBUG] Set protection flag in localStorage and memory');
    
    // Upload to server with detailed logging
    if (typeof uploadAllTemplates === 'function') {
        console.log('🗑️ [ULTRA-DEBUG] Starting uploadAllTemplates...');
        try {
            await uploadAllTemplates();
            console.log('🗑️ [ULTRA-DEBUG] uploadAllTemplates completed successfully');
        } catch (error) {
            console.error('🗑️ [ULTRA-DEBUG] uploadAllTemplates failed:', error);
        }
    } else {
        console.error('🗑️ [ULTRA-DEBUG] uploadAllTemplates function not found!');
    }
    
    // Clear memory flag after delay, but keep localStorage protection longer
    setTimeout(() => {
        window.justModifiedTemplates = false;
        console.log('🗑️ [ULTRA-DEBUG] Cleared memory justModifiedTemplates flag');
    }, 10000);
    
    // Clear localStorage protection after longer delay
    setTimeout(() => {
        localStorage.removeItem('templateProtection');
        console.log('🗑️ [ULTRA-DEBUG] Cleared localStorage templateProtection flag');
    }, 30000); // 30-second protection
    
    // Re-render template buttons
    console.log('🗑️ [ULTRA-DEBUG] Re-rendering template buttons...');
    renderTemplateButtons();
    console.log('🗑️ [ULTRA-DEBUG] deleteTemplate completed');
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
    console.log('📅 Populating unified date/time modal with:', currentDate, currentTime);
    
    // Initialize the unified modal
    initUnifiedDateTimeModal(currentDate, currentTime);
    
    // Legacy support - store current values for backwards compatibility
    window.selectedModalDate = currentDate;
    window.selectedModalTime = currentTime;
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

// Handle TXT file import for Lists View - supports both simple and structured import
async function handleNewTXTImport(event) {
    console.log('📋 Starting TXT import for Lists View');
    
    const file = event.target.files[0];
    if (!file) {
        console.log('❌ No file selected');
        return;
    }
    
    try {
        const text = await file.text();
        if (!text.trim()) {
            alert('❌ The selected file is empty.');
            return;
        }
        
        // Detect if this is structured format (contains # or ## lines)
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const hasStructuredFormat = lines.some(line => line.startsWith('# ') || line.startsWith('## '));
        
        if (hasStructuredFormat) {
            // Use structured import
            await importStructuredTXTDirect(text);
        } else {
            // Use simple import - show list selection
            await importSimpleTXTDirect(text);
        }
        
        // Clear the file input
        event.target.value = '';
        
    } catch (error) {
        console.error('❌ Error importing TXT file:', error);
        alert('❌ Error importing file: ' + error.message);
    }
}

// Simple TXT import - select existing list
async function importSimpleTXTDirect(text) {
    // Check if we have any lists to import into
    await loadListSections();
    let availableLists = [];
    listSections.forEach(section => {
        if (section.lists && section.lists.length > 0) {
            section.lists.forEach(list => {
                availableLists.push({
                    sectionId: section.id,
                    listId: list.id,
                    sectionName: section.name,
                    listName: list.name,
                    itemCount: list.items ? list.items.length : 0
                });
            });
        }
    });
    
    if (availableLists.length === 0) {
        alert('❌ No lists found. Please create a list first before importing, or use structured format (# Section, ## List) to create new ones.');
        return;
    }
    
    // Show simple selection dialog for target list
    const selectedIndex = prompt(
        `📋 Simple Import - Choose target list (enter number 1-${availableLists.length}):\n\n` +
        availableLists.map((list, index) => 
            `${index + 1}. ${list.sectionName} → ${list.listName} (${list.itemCount} items)`
        ).join('\n')
    );
    
    const listIndex = parseInt(selectedIndex) - 1;
    if (isNaN(listIndex) || listIndex < 0 || listIndex >= availableLists.length) {
        alert('❌ Invalid selection. Import cancelled.');
        return;
    }
    
    const targetList = availableLists[listIndex];
    
    // Find the target section and list
    const section = listSections.find(s => s.id === targetList.sectionId);
    const list = section.lists.find(l => l.id === targetList.listId);
    
    if (!section || !list) {
        alert('❌ Could not find target list. Import cancelled.');
        return;
    }
    
    // Parse the text file - each line becomes an item
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    if (lines.length === 0) {
        alert('❌ No valid content found in the file.');
        return;
    }
    
    // Add items to the list
    let addedCount = 0;
    lines.forEach(line => {
        const newItem = {
            id: Date.now() + Math.random(),
            text: line,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        if (!list.items) list.items = [];
        list.items.push(newItem);
        addedCount++;
    });
    
    // Save changes
    await saveListSections();
    
    // Refresh the Lists View if currently viewing it
    if (currentView === 'lists') {
        renderListsView();
    }
    
    alert(`✅ Successfully imported ${addedCount} items to "${targetList.sectionName} → ${targetList.listName}".`);
}

// Structured TXT import - create sections, lists, and items automatically
async function importStructuredTXTDirect(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
        alert('❌ The TXT file is empty or contains no valid content.');
        return;
    }
    
    await loadListSections();
    let currentSection = null;
    let currentList = null;
    let addedSections = 0;
    let addedLists = 0;
    let addedItems = 0;
    
    for (const line of lines) {
        if (line.startsWith('# ')) {
            // Section header
            const sectionName = line.substring(2).trim();
            
            // Find existing section or create new one
            currentSection = listSections.find(s => s.name === sectionName);
            if (!currentSection) {
                currentSection = {
                    id: Date.now().toString() + Math.random(),
                    name: sectionName,
                    lists: [],
                    collapsed: false,
                    createdAt: new Date().toISOString(),
                    order: listSections.length
                };
                listSections.push(currentSection);
                addedSections++;
            }
            currentList = null; // Reset current list when entering new section
            
        } else if (line.startsWith('## ')) {
            // List header
            const listName = line.substring(3).trim();
            
            if (!currentSection) {
                // Create default section if none exists
                currentSection = {
                    id: Date.now().toString() + Math.random(),
                    name: 'Imported',
                    lists: [],
                    collapsed: false,
                    createdAt: new Date().toISOString(),
                    order: listSections.length
                };
                listSections.push(currentSection);
                addedSections++;
            }
            
            // Find existing list in current section or create new one
            currentList = currentSection.lists.find(l => l.name === listName);
            if (!currentList) {
                currentList = {
                    id: Date.now().toString() + Math.random(),
                    name: listName,
                    items: [],
                    createdAt: new Date().toISOString()
                };
                currentSection.lists.push(currentList);
                addedLists++;
            }
            
        } else {
            // Regular item
            if (!currentList) {
                // Create default section and list if none exists
                if (!currentSection) {
                    currentSection = {
                        id: Date.now().toString() + Math.random(),
                        name: 'Imported',
                        lists: [],
                        collapsed: false,
                        createdAt: new Date().toISOString(),
                        order: listSections.length
                    };
                    listSections.push(currentSection);
                    addedSections++;
                }
                
                currentList = {
                    id: Date.now().toString() + Math.random(),
                    name: 'Items',
                    items: [],
                    createdAt: new Date().toISOString()
                };
                currentSection.lists.push(currentList);
                addedLists++;
            }
            
            // Add item to current list
            const newItem = {
                id: Date.now() + Math.random(),
                text: line,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            if (!currentList.items) currentList.items = [];
            currentList.items.push(newItem);
            addedItems++;
        }
    }
    
    // Save changes
    await saveListSections();
    
    // Refresh the Lists View if currently viewing it
    if (currentView === 'lists') {
        renderListsView();
    }
    
    alert(`✅ Structured import complete!\nAdded ${addedSections} sections, ${addedLists} lists, and ${addedItems} items.`);
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
 * Action Registry View
 * Shows all recorded actions with per-action revert buttons
 */

const ACTION_ICONS = {
    create: '➕', edit: '✏️', delete: '🗑️', complete: '✅',
    delay: '⏭️', duplicate: '📋'
};
const ACTION_LABELS = {
    create: 'Created', edit: 'Edited', delete: 'Deleted', complete: 'Completed',
    delay: 'Delayed', duplicate: 'Duplicated'
};
const ACTION_COLORS = {
    create: '#28a745', edit: '#007bff', delete: '#dc3545', complete: '#6f42c1',
    delay: '#f59e0b', duplicate: '#17a2b8'
};

function renderRecentActionsView(searchTerm) {
    console.log('📋 Rendering action registry view...');
    var tasksView = document.getElementById('tasks-view');
    if (!tasksView) return;

    var registry = window.actionRegistry || JSON.parse(localStorage.getItem('actionRegistry') || '[]');
    // Show newest first
    var actions = registry.slice().reverse();

    // Filter by search
    if (searchTerm) {
        var term = searchTerm.toLowerCase();
        actions = actions.filter(function(a) {
            return (a.taskTitle || '').toLowerCase().includes(term) ||
                   (a.type || '').toLowerCase().includes(term) ||
                   (ACTION_LABELS[a.type] || '').toLowerCase().includes(term);
        });
    }

    var countText = actions.length + ' action' + (actions.length !== 1 ? 's' : '');
    if (searchTerm) countText += ' matching "' + searchTerm + '"';

    var html = '<div class="section-header"><h3>📋 Registry</h3><div class="view-controls">' +
        '<input type="text" id="recentActionsSearchInput" placeholder="Search actions..." value="' + (searchTerm || '') + '" style="padding:6px 12px;border:2px solid #e1e5e9;border-radius:4px;font-size:11px;width:200px;margin-right:8px;" oninput="searchRecentActions()">' +
        '</div></div>';

    html += '<div style="padding:16px 20px;background:linear-gradient(135deg,#6f42c1,#563d7c);color:white;border-radius:12px;margin-bottom:16px;">' +
        '<h2 style="margin:0;font-size:20px;font-weight:700;">📋 Action Registry</h2>' +
        '<p style="margin:4px 0 0;opacity:0.9;font-size:14px;">' + countText + '</p></div>';

    if (actions.length === 0) {
        html += '<div style="text-align:center;padding:40px;color:#666;">' +
            '<div style="font-size:48px;margin-bottom:16px;">📋</div>' +
            '<h3>No Actions Recorded</h3>' +
            '<p style="color:#999;">Actions will appear here as you create, edit, delete, or delay tasks.</p></div>';
    } else {
        html += '<div style="display:grid;gap:8px;">';
        actions.forEach(function(action) {
            var icon = ACTION_ICONS[action.type] || '📝';
            var label = ACTION_LABELS[action.type] || action.type;
            var color = ACTION_COLORS[action.type] || '#6c757d';
            var d = new Date(action.timestamp);
            var timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

            html += '<div style="background:#fff;border:1px solid #e9ecef;border-left:4px solid ' + color + ';border-radius:8px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">' +
                '<span style="font-size:16px;">' + icon + '</span>' +
                '<span style="font-weight:600;font-size:13px;color:' + color + ';">' + label + '</span>' +
                '<span style="font-size:13px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (action.taskTitle || '') + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#999;">' + timeStr + '</div>' +
                '</div>' +
                '<button onclick="revertAction(\'' + action.id + '\')" style="background:' + color + ';color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600;white-space:nowrap;margin-left:8px;">Revert</button>' +
                '</div>';
        });
        html += '</div>';
    }

    tasksView.innerHTML = html;

    // Re-focus search
    if (searchTerm) {
        var si = document.getElementById('recentActionsSearchInput');
        if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
    }
}

/**
 * Helper function to restore All Tasks UI (no longer needed as All Tasks renders its own complete HTML)
 */
function restoreAllTasksUI() {
    // No longer needed - All Tasks view renders complete HTML structure
    // This function kept for compatibility
}

// Legacy stubs for backward compatibility
function restoreDeletedTask(taskId) { console.log('Use revertAction instead'); }
function restoreAllDeletedTasks() { console.log('Use Registry view instead'); }
function deleteAllDeletedTasks() { console.log('Use Registry view instead'); }
function undoSpecificAction() { console.log('Use revertAction instead'); }
function undoAllActions() { console.log('Use Registry view instead'); }
function permanentlyDeleteTask() { console.log('Use Registry view instead'); }

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
                case 'z':
                    e.preventDefault();
                    console.log('🎹 Keyboard: Revert last action');
                    if (typeof revertAction === 'function') {
                        performUndo();
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
    
    console.log('🎹 Keyboard shortcuts initialized: Ctrl+E (expand), Ctrl+C (collapse), Ctrl+T (toggle time blocks), Ctrl+Z (undo)');
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
// translateUI is defined in extracted_js.js
window.importTasks = importTasks;
window.clearAllTasks = clearAllTasks;
window.performUndo = performUndo;
window.quickBackupJSON = quickBackupJSON;
window.refreshUndoView = refreshUndoView;

function searchRecentActions() {
    var input = document.getElementById('recentActionsSearchInput');
    var term = input ? input.value.trim() : '';
    renderRecentActionsView(term || undefined);
}

// renderFilteredActions removed - replaced by renderRecentActionsView(searchTerm)

function refreshRecentActionsView() {
    renderRecentActionsView();
}

window.searchRecentActions = searchRecentActions;
window.refreshRecentActionsView = refreshRecentActionsView;

// Search functionality for Undo History
function searchUndoHistory() {
    const searchInput = document.getElementById('undoSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Get all undo items
    const undoItems = document.querySelectorAll('#undoList > div');
    
    if (!searchTerm) {
        // Show all items if search is empty
        undoItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    // Filter items based on search term
    undoItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

window.searchUndoHistory = searchUndoHistory;
window.checkAllBackups = checkAllBackups;
window.createEmergencyBackup = createEmergencyBackup;
window.openDateTimeModal = openDateTimeModal;
window.closeDateTimeModal = closeDateTimeModal;
window.applyDesktopDateTime = applyDesktopDateTime;
window.applyMobileDateTime = applyMobileDateTime;
window.openBulkTimeModal = openBulkTimeModal;

// Calendar and Time picker variables
let modalCalendarDate = new Date();
// Use window variables to ensure they're accessible globally
window.selectedModalDate = '';
window.selectedModalTime = '';

// Initialize calendar modal
function initCalendarModal(currentDate, currentTime) {
    console.log('🗓️ Initializing calendar modal with:', currentDate, currentTime);
    
    // Set current selections for both legacy and unified systems
    // Don't default to today - keep empty if no date provided
    window.selectedModalDate = currentDate || '';
    window.selectedModalTime = currentTime || '';
    
    // Also set the unified modal variables
    modalSelectedDate = currentDate || null;
    modalSelectedTime = currentTime || null;
    
    // Set calendar to show the selected month
    if (currentDate) {
        modalCalendarDate = new Date(currentDate);
    } else {
        modalCalendarDate = new Date();
    }
    
    renderCalendarModal();
    highlightSelectedTime();
    
    // Update the date/time display in the edit modal
    if (typeof updateDateTimeDisplay === 'function') {
        updateDateTimeDisplay();
    }
}

// Render the calendar grid
function renderCalendarModal() {
    console.log('📅 renderCalendarModal called');
    const titleEl = document.getElementById('modalCalendarTitle');
    const daysEl = document.getElementById('modalCalendarDays');
    
    if (!titleEl || !daysEl) {
        console.error('❌ Calendar elements not found. titleEl:', !!titleEl, 'daysEl:', !!daysEl);
        return;
    }
    
    // Update month title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    titleEl.textContent = `${monthNames[modalCalendarDate.getMonth()]} ${modalCalendarDate.getFullYear()}`;
    
    // Clear previous days
    daysEl.innerHTML = '';
    
    // Get calendar info
    const year = modalCalendarDate.getFullYear();
    const month = modalCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('button');
        const dayNum = date.getDate();
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = window.selectedModalDate === getLocalDateString(date);
        
        dayElement.textContent = dayNum;
        dayElement.onclick = () => selectCalendarDate(getLocalDateString(date));
        
        // Styling
        let styles = 'width: 100%; aspect-ratio: 1; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s ease;';
        
        if (!isCurrentMonth) {
            styles += 'color: #ccc; background: transparent;';
        } else if (isSelected) {
            styles += 'background: #007aff; color: white;';
        } else if (isToday) {
            styles += 'background: #ff3b30; color: white;';
        } else {
            styles += 'background: transparent; color: #333;';
        }
        
        dayElement.style.cssText = styles;
        dayElement.onmouseover = () => {
            if (!isSelected && isCurrentMonth) {
                dayElement.style.background = '#f0f0f0';
            }
        };
        dayElement.onmouseout = () => {
            if (!isSelected && isCurrentMonth && !isToday) {
                dayElement.style.background = 'transparent';
            }
        };
        
        daysEl.appendChild(dayElement);
    }
}

// Navigate calendar months
function navigateCalendar(direction) {
    modalCalendarDate.setMonth(modalCalendarDate.getMonth() + direction);
    renderCalendarModal();
}

// Go to today
function goToCalendarToday() {
    modalCalendarDate = new Date();
    window.selectedModalDate = getLocalDateString(new Date());
    renderCalendarModal();
    highlightSelectedTime();
}

// Select calendar date (for unified modal)
function selectCalendarDate(dateStr) {
    console.log('📅 selectCalendarDate called for unified modal with dateStr:', dateStr);
    console.log('📅 Current selectedModalDate before:', window.selectedModalDate);
    
    try {
        window.selectedModalDate = dateStr;
        modalSelectedDate = dateStr;  // Also update the unified modal variable
        
        console.log('📅 Updated selectedModalDate to:', window.selectedModalDate);
        console.log('📅 Re-rendering calendar modal...');
        
        renderCalendarModal();
        
        console.log('✅ Calendar date selection complete');
    } catch (error) {
        console.error('❌ Error in selectCalendarDate:', error);
    }
}

// Select time slot
function selectTime(timeStr) {
    console.log('⏰ Selected time:', timeStr);
    window.selectedModalTime = timeStr;
    modalSelectedTime = timeStr;  // Also update the unified modal variable
    highlightSelectedTime();
}

// Clear selected time
function clearSelectedTime() {
    console.log('🗑️ Cleared time');
    window.selectedModalTime = '';
    highlightSelectedTime();
}

// Highlight selected time button
function highlightSelectedTime() {
    // Reset all time buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        const timeValue = btn.textContent.trim();
        
        // Reset to default colors based on time
        if (['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'].includes(timeValue)) {
            if (timeValue === window.selectedModalTime) {
                btn.style.cssText = 'background: #007aff; color: white; border: none; border-radius: 6px; padding: 14px 8px; cursor: pointer; font-size: 11px; font-weight: 500;';
            } else {
                btn.style.cssText = 'background: #e3f2fd; color: #1976d2; border: none; border-radius: 6px; padding: 14px 8px; cursor: pointer; font-size: 11px; font-weight: 500;';
            }
        } else if (['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].includes(timeValue)) {
            if (timeValue === window.selectedModalTime) {
                btn.style.cssText = 'background: #f57c00; color: white; border: none; border-radius: 6px; padding: 14px 8px; cursor: pointer; font-size: 11px; font-weight: 500;';
            } else {
                btn.style.cssText = 'background: #fff3e0; color: #f57c00; border: none; border-radius: 6px; padding: 14px 8px; cursor: pointer; font-size: 11px; font-weight: 500;';
            }
        } else {
            if (timeValue === window.selectedModalTime) {
                btn.style.cssText = 'background: #7b1fa2; color: white; border: none; border-radius: 6px; padding: 14px 8px; cursor: pointer; font-size: 11px; font-weight: 500;';
            } else {
                btn.style.cssText = 'background: #f3e5f5; color: #7b1fa2; border: none; border-radius: 6px; padding: 14px 8px; cursor: pointer; font-size: 11px; font-weight: 500;';
            }
        }
    });
}

// Apply calendar selection
function applyCalendarDateTime() {
    console.log('✅ Applying calendar datetime:', window.selectedModalDate, window.selectedModalTime);
    
    // Note: We'll update the task later when we save all fields together
    
    // Update the display in the task modal
    const dateTimeDisplay = document.getElementById('dateTimeDisplay');
    if (dateTimeDisplay) {
        if (window.selectedModalDate && window.selectedModalTime) {
            const dateObj = new Date(window.selectedModalDate + 'T' + window.selectedModalTime);
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const formattedTime = dateObj.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
            dateTimeDisplay.textContent = `📅 ${formattedDate} ⏰ ${formattedTime}`;
        } else if (window.selectedModalDate) {
            const dateObj = new Date(window.selectedModalDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            dateTimeDisplay.textContent = `📅 ${formattedDate}`;
        } else {
            dateTimeDisplay.textContent = 'Select date & time...';
        }
    }
    
    // Update the hidden inputs in the task modal
    const editTaskDateOnly = document.getElementById('editTaskDateOnly');
    const editTaskTimeOnly = document.getElementById('editTaskTimeOnly');
    
    if (editTaskDateOnly) editTaskDateOnly.value = window.selectedModalDate;
    if (editTaskTimeOnly) editTaskTimeOnly.value = window.selectedModalTime;
    
    // Close the date/time modal
    closeDateTimeModal();
    
    // Save all changes and close both modals
    const taskModal = document.getElementById('taskModal');
    
    // Always close the edit modal if it's visible, regardless of currentEditTaskId
    if (taskModal && taskModal.style.display !== 'none') {
        // Try to save the task - use the global function that already handles saving
        console.log('🔄 Set button: attempting to save task changes...');
        
        // Use the existing saveTaskEdit function if available
        if (typeof saveTaskEdit === 'function') {
            console.log('💾 Using saveTaskEdit function');
            saveTaskEdit();
        } else {
            // Fallback manual save
            const taskIdToSave = window.currentEditTaskId || window.currentDateTimeTaskId;
            console.log('💾 Manual save with taskId:', taskIdToSave);
            
            if (taskIdToSave) {
                // Get the task
                const task = tasks.find(t => t.id == taskIdToSave); // Use loose equality
                if (task) {
                    console.log('✅ Found task to save:', task.title);
                    
                    // Save all the field values from the edit modal
                    const titleInput = document.getElementById('editTaskTitle');
                    const notesInput = document.getElementById('editTaskNotes');
                    const isEventInput = document.getElementById('editTaskIsEvent');
                    const repeatInput = document.getElementById('editTaskRepeat');
                    
                    if (titleInput) task.title = titleInput.value;
                    if (notesInput) task.notes = notesInput.value;
                    if (isEventInput) task.isEvent = isEventInput.checked;
                    if (repeatInput) task.repeat = repeatInput.value;
                    
                    // Update the date and time from calendar modal
                    if (window.selectedModalDate) task.date = window.selectedModalDate;
                    if (window.selectedModalTime) task.time = window.selectedModalTime;
                    
                    console.log('💾 Saving task with date:', task.date, 'time:', task.time);
                    
                    // Save tasks to localStorage
                    saveTasks();
                    
                    // Re-render the view
                    if (typeof renderCurrentView === 'function') {
                        renderCurrentView();
                    }
                } else {
                    console.error('❌ Task not found with ID:', taskIdToSave);
                }
            } else {
                console.error('❌ No task ID available for saving');
            }
        }
        
        // Always close the edit modal regardless of save success
        taskModal.style.display = 'none';
        // Don't add hidden class as it might interfere with future modal operations
        window.currentEditTaskId = null;
        window.currentDateTimeTaskId = null;
        
        console.log('✅ Set button: closed both modals');
    }
}

// Make calendar functions globally available
window.initCalendarModal = initCalendarModal;
window.renderCalendarModal = renderCalendarModal;
window.navigateCalendar = navigateCalendar;
window.goToCalendarToday = goToCalendarToday;
window.selectCalendarDate = selectCalendarDate;
window.selectTime = selectTime;
window.clearSelectedTime = clearSelectedTime;
window.highlightSelectedTime = highlightSelectedTime;
window.applyCalendarDateTime = applyCalendarDateTime;

// Mobile swipe gesture functions
function toggleMobileTimeDropdown(taskId, event) {
    console.log('📱 Mobile swipe right detected - moving task to tomorrow:', taskId);
    
    // Find the task element
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) {
        console.error('❌ Task element not found:', taskId);
        return;
    }
    
    // Show visual feedback - task moving to tomorrow
    showSwipeToTomorrowFeedback(taskElement, taskId);
}

function showSwipeToTomorrowFeedback(taskElement, taskId) {
    // Create and show visual feedback overlay
    const originalText = taskElement.innerHTML;
    const originalBackground = taskElement.style.background;
    
    // Add visual cue that task is moving to tomorrow
    taskElement.style.transition = 'all 0.3s ease';
    taskElement.style.background = 'linear-gradient(45deg, #4CAF50, #66BB6A)';
    taskElement.style.color = 'white';
    taskElement.style.transform = 'scale(0.95)';
    
    // Create temporary overlay with feedback
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600;">
            <span style="font-size: 16px;">📅</span>
            <span>Moving to Tomorrow</span>
            <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(76, 175, 80, 0.95);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        z-index: 100;
        backdrop-filter: blur(2px);
    `;
    
    // Make task element relative for overlay positioning
    const originalPosition = taskElement.style.position;
    taskElement.style.position = 'relative';
    taskElement.appendChild(overlay);
    
    // Delay the task by 1 day after visual feedback
    setTimeout(async () => {
        try {
            // Actually delay the task by 1 day
            await delayTaskByDays(taskId, 1);
            
            // Show success feedback
            overlay.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600;">
                    <span style="font-size: 16px;">✅</span>
                    <span>Moved to Tomorrow!</span>
                </div>
            `;
            overlay.style.background = 'rgba(76, 175, 80, 0.95)';
            
            // Hide overlay after success message
            setTimeout(() => {
                // Restore original appearance
                taskElement.style.background = originalBackground;
                taskElement.style.color = '';
                taskElement.style.transform = '';
                taskElement.style.position = originalPosition;
                
                // Remove overlay
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                
                // Refresh the view to show updated task
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                }
            }, 800);
            
        } catch (error) {
            console.error('❌ Error delaying task:', error);
            
            // Show error feedback
            overlay.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600;">
                    <span style="font-size: 16px;">❌</span>
                    <span>Failed to move</span>
                </div>
            `;
            overlay.style.background = 'rgba(244, 67, 54, 0.95)';
            
            // Restore original appearance after error
            setTimeout(() => {
                taskElement.style.background = originalBackground;
                taskElement.style.color = '';
                taskElement.style.transform = '';
                taskElement.style.position = originalPosition;
                
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 1500);
        }
    }, 1000);
}

async function delayTaskByDays(taskId, days) {
    console.log(`📅 Delaying task ${taskId} by ${days} days`);
    
    // Find the task in the current tasks array
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        throw new Error('Task not found: ' + taskId);
    }
    
    // Calculate new date
    const currentDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Update the task
    task.dueDate = getLocalDateString(newDate);
    
    // Save tasks
    await saveTasks();
    
    console.log(`✅ Task ${taskId} delayed to ${task.dueDate}`);
}

// Make mobile swipe functions globally available
window.toggleMobileTimeDropdown = toggleMobileTimeDropdown;
window.showSwipeToTomorrowFeedback = showSwipeToTomorrowFeedback;
window.delayTaskByDays = delayTaskByDays;
window.triggerImageUpload = triggerImageUpload;
window.handleImageUpload = handleImageUpload;
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
    // Prevent multiple simultaneous executions
    if (window.moveTasksInProgress) {
        console.log('⚠️ Move already in progress, ignoring click');
        return;
    }
    
    window.moveTasksInProgress = true;
    console.log('🕐 Move button clicked! Starting function...');
    console.log('🔍 Debug - tasks array:', window.tasks ? window.tasks.length + ' tasks' : 'tasks array not found');
    console.log('🔍 Debug - currentTodayDate:', window.currentTodayDate);
    
    // Disable the button to prevent multiple clicks
    const btn = document.querySelector('.move-current-time-btn');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
    
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
        
        // Reset the progress flag
        window.moveTasksInProgress = false;
        
        // Re-enable the button
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
        
        console.log('✅ Move operation completed - no page reload needed');
    }, 3000);  // Increased delay to ensure upload completes
}

// Expose functions globally
// switchLanguage is defined in extracted_js.js
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
window.handleNewTXTImport = handleNewTXTImport;
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

/**
 * Delete All Data - Double Security Confirmation System
 */
function initiateDeleteAllData() {
    console.log('🚨 Delete All Data initiated - showing first confirmation');
    
    // First confirmation
    const firstConfirmation = confirm(
        "⚠️ WARNING: This will permanently delete ALL your data!\n\n" +
        "This includes:\n" +
        "• All tasks and events\n" +
        "• All lists and sections\n" +
        "• All templates and settings\n" +
        "• All backup data\n\n" +
        "This action CANNOT be undone.\n\n" +
        "Are you absolutely sure you want to continue?"
    );
    
    if (!firstConfirmation) {
        console.log('❌ Delete All Data cancelled at first confirmation');
        return;
    }
    
    // Show phrase confirmation modal
    showDeleteConfirmationModal();
}

function showDeleteConfirmationModal() {
    console.log('🔒 Showing phrase confirmation modal');
    
    // Create modal HTML
    const modalHTML = `
        <div id="deleteConfirmationModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                border: 3px solid #dc3545;
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h3 style="margin: 0 0 10px 0; color: #dc3545; font-size: 20px;">FINAL WARNING</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">This action will destroy all your data permanently</p>
                </div>
                
                <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 20px;">
                    <p style="margin: 0 0 15px 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                        To confirm deletion, please type the exact phrase below:
                    </p>
                    <div style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #dc3545; margin-bottom: 15px;">
                        <strong style="color: #dc3545; font-family: monospace; font-size: 16px;">DELETE ALL MY DATA</strong>
                    </div>
                    <input type="text" id="deleteConfirmationInput" placeholder="Type the phrase exactly..." 
                           style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 6px; font-size: 14px; font-family: monospace;">
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="cancelDeleteAllData()" 
                            style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Cancel
                    </button>
                    <button onclick="confirmDeleteAllData()" 
                            style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Delete Everything
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus the input
    setTimeout(() => {
        const input = document.getElementById('deleteConfirmationInput');
        if (input) {
            input.focus();
            // Allow Enter key to submit
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmDeleteAllData();
                }
            });
        }
    }, 100);
}

function cancelDeleteAllData() {
    console.log('❌ Delete All Data cancelled at phrase confirmation');
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
        modal.remove();
    }
}

function confirmDeleteAllData() {
    const input = document.getElementById('deleteConfirmationInput');
    const enteredPhrase = input ? input.value.trim() : '';
    const requiredPhrase = 'DELETE ALL MY DATA';
    
    console.log('🔍 Checking phrase:', enteredPhrase, 'vs required:', requiredPhrase);
    
    if (enteredPhrase !== requiredPhrase) {
        // Shake the input and show error
        input.style.borderColor = '#dc3545';
        input.style.background = '#fff5f5';
        input.style.animation = 'shake 0.5s';
        
        // Add shake animation if not exists
        if (!document.querySelector('#shakeStyle')) {
            const style = document.createElement('style');
            style.id = 'shakeStyle';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        alert('❌ Incorrect phrase. Please type exactly: DELETE ALL MY DATA');
        input.select();
        return;
    }
    
    // Phrase is correct - proceed with deletion
    console.log('🚨 Phrase confirmed - proceeding with data deletion');
    executeDeleteAllData();
}

function executeDeleteAllData() {
    console.log('🗑️ Executing complete data deletion...');
    
    try {
        // Clear all localStorage data
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ Deleted localStorage key:', key);
        });
        
        // Clear all sessionStorage data
        sessionStorage.clear();
        console.log('🗑️ Cleared sessionStorage');
        
        // Reset global variables
        if (typeof window.tasks !== 'undefined') {
            window.tasks = [];
        }
        if (typeof window.undoStack !== 'undefined') {
            window.undoStack = [];
        }
        if (typeof window.eventTaskIds !== 'undefined') {
            window.eventTaskIds = new Set();
        }
        
        // Close modal
        const modal = document.getElementById('deleteConfirmationModal');
        if (modal) {
            modal.remove();
        }
        
        // Show success message and reload
        alert('✅ All data has been permanently deleted.\n\nThe page will now reload to reset the application.');
        
        console.log('🔄 Reloading page after data deletion');
        window.location.reload();
        
    } catch (error) {
        console.error('❌ Error during data deletion:', error);
        alert('❌ An error occurred during deletion. Please try again or contact support.');
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
window.initiateDeleteAllData = initiateDeleteAllData;
window.cancelDeleteAllData = cancelDeleteAllData;
window.confirmDeleteAllData = confirmDeleteAllData;

console.log('✅ Missing functions module loaded with', Object.keys(window).filter(k => typeof window[k] === 'function' && (k.startsWith('open') || k.startsWith('perform') || k.startsWith('search') || k.startsWith('handle'))).length, 'functions');