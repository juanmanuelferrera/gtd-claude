/**
 * Date/Time Picker Functions for HyperFiler Pro
 */

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
// Helper: restore task selection at saved index after view re-renders
function reselectTaskAtSavedIndex() {
    var idx = window._lastSelectedTaskIdx;
    if (idx == null || idx < 0) return;
    setTimeout(function() {
        var tasks = document.querySelectorAll('.task-card[data-task-id], .task-item[data-task-id]');
        if (tasks.length === 0) return;
        var selectIdx = Math.min(idx, tasks.length - 1);
        tasks[selectIdx].classList.add('task-selected');
        tasks[selectIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 300);
}
window.reselectTaskAtSavedIndex = reselectTaskAtSavedIndex;
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
        reselectTaskAtSavedIndex();
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

window.openIOSDateTimePicker = openIOSDateTimePicker;
window.selectInlineCalendarDate = selectInlineCalendarDate;
window.refreshInlineCalendar = refreshInlineCalendar;
window.changeCalendarMonth = changeCalendarMonth;
window.setCalendarToday = setCalendarToday;
window.setCalendarQuickDate = setCalendarQuickDate;
window.closeDateDropdown = closeDateDropdown;

let modalSelectedDate = null;
let modalSelectedTime = null;
let modalCurrentMonth = new Date().getMonth();
let modalCurrentYear = new Date().getFullYear();

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
            
            // Auto-save via edit modal only if the edit modal is actually open
            const taskModal = document.getElementById('taskModal');
            const editModalOpen = taskModal && taskModal.style.display === 'block';
            if (editModalOpen && typeof saveTaskEdit === 'function') {
                console.log('💾 Auto-saving task after date/time change (edit modal open)');
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

window.navigateCalendar = navigateCalendar;
window.goToCalendarToday = goToCalendarToday;
window.setQuickDate = setQuickDate;
window.selectTime = selectTime;
window.clearSelectedTime = clearSelectedTime;
window.selectCalendarDay = selectCalendarDay;
window.applyDateTime = applyDateTime;
window.initUnifiedDateTimeModal = initUnifiedDateTimeModal;

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
    reselectTaskAtSavedIndex();
}
async function clearTimeAndClose(taskId) {
    // Close dropdown first for better UX
    closeTimeDropdown();
    // Update task time and wait for it to complete
    await updateTaskTime(taskId, '', { stopPropagation: () => {} });
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

// Date/Time Modal Functions
function populateDateTimeModal(currentDate, currentTime) {
    console.log('📅 Populating unified date/time modal with:', currentDate, currentTime);
    
    // Initialize the unified modal
    initUnifiedDateTimeModal(currentDate, currentTime);
    
    // Legacy support - store current values for backwards compatibility
    window.selectedModalDate = currentDate;
    window.selectedModalTime = currentTime;
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

window.openDateTimeModal = openDateTimeModal;
window.closeDateTimeModal = closeDateTimeModal;
window.applyDesktopDateTime = applyDesktopDateTime;
window.applyMobileDateTime = applyMobileDateTime;

let modalCalendarDate = new Date();
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

window.initCalendarModal = initCalendarModal;
window.renderCalendarModal = renderCalendarModal;
window.navigateCalendar = navigateCalendar;
window.goToCalendarToday = goToCalendarToday;
window.selectCalendarDate = selectCalendarDate;
window.selectTime = selectTime;
window.clearSelectedTime = clearSelectedTime;
window.highlightSelectedTime = highlightSelectedTime;
window.applyCalendarDateTime = applyCalendarDateTime;

window.updateDesktopDateTime = updateDesktopDateTime;
window.initializeDateTimePickers = initializeDateTimePickers;
window.populateDayPicker = populateDayPicker;
