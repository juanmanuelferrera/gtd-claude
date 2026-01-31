/**
 * Search and Filter Functions for HyperFiler Pro
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

window.filterWeekByTemplate = filterWeekByTemplate;
window.clearWeekTemplateFilter = clearWeekTemplateFilter;
window.filterMonthByTemplate = filterMonthByTemplate;
window.clearMonthTemplateFilter = clearMonthTemplateFilter;
window.renderWeekTemplateFilters = renderWeekTemplateFilters;
window.renderMonthTemplateFilters = renderMonthTemplateFilters;

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

window.performSearch = performSearch;
window.performMobileSearch = performMobileSearch;
window.quickSearch = quickSearch;
window.performAllTasksSearch = performAllTasksSearch;
window.clearAllTasksTemplateFilter = clearAllTasksTemplateFilter;
window.searchTodayTasks = searchTodayTasks;
window.searchMonthTasks = searchMonthTasks;
window.searchWeekTasks = searchWeekTasks;
window.searchRepeatTasks = searchRepeatTasks;

function searchRecentActions() {
    var input = document.getElementById('recentActionsSearchInput');
    var term = input ? input.value.trim() : '';
    renderRecentActionsView(term || undefined);
}

window.searchRecentActions = searchRecentActions;

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
