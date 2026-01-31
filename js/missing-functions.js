/**
 * Missing Functions Module for HyperFiler Pro
 * Contains remaining functions referenced in HTML but not in other modules
 */

// Make template filter functions globally accessible

// Make functions globally available for inline onclick handlers

// Unified Date/Time Modal Support

// Make unified modal functions globally available

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
    // Block ALL keys from propagating when dropdown is open
    e.preventDefault();
    e.stopImmediatePropagation();
    // Enter: click focused cell, or the selected/first cell
    if (e.key === 'Enter') {
        var target = (idx >= 0) ? cells[idx] : null;
        if (!target) {
            // Try to find the already-selected cell (blue background)
            target = container.querySelector('[style*="background: #007AFF"]');
        }
        if (!target) target = cells[0];
        if (target) target.click();
        return;
    }
    // Only arrow keys navigate
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) === -1) return;
    // Columns: 7 for calendar, 3 for time (grid-template-columns: repeat(3, 1fr) with 2 items per cell = 6 per row)
    var cols = isDate ? 7 : 6; // time grid: 3 columns x 2 (hour + :30) = 6
    if (idx < 0) {
        // Nothing focused yet, focus first cell
        cells[0].setAttribute('tabindex', '0');
        cells[0].focus();
        return;
    }
    var newIdx = idx;
    if (e.key === 'ArrowRight') newIdx = idx + 1;
    else if (e.key === 'ArrowLeft') newIdx = idx - 1;
    else if (e.key === 'ArrowDown') newIdx = idx + cols;
    else if (e.key === 'ArrowUp') newIdx = idx - cols;
    // Calendar: navigate to prev/next month when going past edges
    if (isDate && newIdx >= cells.length) {
        var taskId = window.currentCalendarTaskId;
        if (taskId && typeof changeCalendarMonth === 'function') {
            changeCalendarMonth(taskId, 1);
            setTimeout(function() {
                var newContainer = window.currentDateDropdown;
                if (!newContainer) return;
                var newCells = Array.from(newContainer.querySelectorAll('[onclick*="selectInlineCalendarDate"]'));
                var focusIdx = Math.min(newIdx - cells.length, newCells.length - 1);
                if (newCells[focusIdx]) { newCells[focusIdx].setAttribute('tabindex', '0'); newCells[focusIdx].focus(); }
            }, 50);
        }
        return;
    }
    if (isDate && newIdx < 0) {
        var taskIdPrev = window.currentCalendarTaskId;
        if (taskIdPrev && typeof changeCalendarMonth === 'function') {
            changeCalendarMonth(taskIdPrev, -1);
            setTimeout(function() {
                var newContainer = window.currentDateDropdown;
                if (!newContainer) return;
                var newCells = Array.from(newContainer.querySelectorAll('[onclick*="selectInlineCalendarDate"]'));
                var focusIdx = Math.max(newCells.length + newIdx, 0);
                if (newCells[focusIdx]) { newCells[focusIdx].setAttribute('tabindex', '0'); newCells[focusIdx].focus(); }
            }, 50);
        }
        return;
    }
    // Clamp for time grid (no wrapping)
    if (!isDate) {
        newIdx = Math.max(0, Math.min(newIdx, cells.length - 1));
    }
    if (newIdx !== idx && newIdx >= 0 && newIdx < cells.length) {
        cells[idx].removeAttribute('tabindex');
        cells[newIdx].setAttribute('tabindex', '0');
        cells[newIdx].focus();
    }
}, true);  // capture phase to intercept before other handlers

// Global variables declared in globals.js
// selectedTasks, activeAllTasksTemplateFilter, currentLanguage, dragged, mobileMoreMenuOpen

/**
 * Revert a specific action from the action registry
 */

// Template function handled by extracted_js.js - removed duplicate
/**
 * Emergency function to recover lists from server
 */

// Make function globally accessible for emergency use

/**
 * Try to refresh authentication and then recover lists
 */

// Make function globally accessible

/**
 * Import ONLY Lists from a JSON backup file
 * Useful when you want to restore lists but keep current tasks/templates
 */

// Make function globally accessible

/**
 * Emergency function to bypass sync protection and force download lists from server
 * Use this when lists disappeared due to sync timing issues
 */

// Make function globally accessible

/**
 * Force import JSON backup with OVERWRITE mode (no questions asked)
 * Use this when you want to completely replace all data
 */

// Make function globally accessible

// Drag and Drop functions for tasks
// draggedTask declared in tasks.js

// Keyboard shortcuts (missing-functions.js) — capture phase to beat extracted_js NavigationManager
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
        event.stopImmediatePropagation();
        var next = currentIdx < allTasks.length - 1 ? currentIdx + 1 : 0;
        if (current) current.classList.remove('task-selected');
        allTasks[next].classList.add('task-selected');
        allTasks[next].scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
    }
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopImmediatePropagation();
        var prev = currentIdx > 0 ? currentIdx - 1 : allTasks.length - 1;
        if (current) current.classList.remove('task-selected');
        allTasks[prev].classList.add('task-selected');
        allTasks[prev].scrollIntoView({ block: 'center', behavior: 'smooth' });
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
        event.stopImmediatePropagation();
        current.classList.toggle('selected');
        current.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
    }
    // Helper: re-select task at given index after view re-renders
    function reselectAfterAction(idx) {
        setTimeout(function() {
            var tasks = document.querySelectorAll('.task-card[data-task-id], .task-item[data-task-id]');
            if (tasks.length === 0) return;
            var selectIdx = Math.min(idx, tasks.length - 1);
            if (selectIdx < 0) selectIdx = 0;
            tasks[selectIdx].classList.add('task-selected');
            tasks[selectIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 300);
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
        reselectAfterAction(currentIdx);
        return;
    }
    // C: copy/duplicate task(s)
    if ((event.key === 'c' || event.key === 'C') && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var cid = parseTaskId(el.getAttribute('data-task-id'));
            if (cid && typeof duplicateTask === 'function') duplicateTask(cid, event);
        });
        reselectAfterAction(currentIdx);
        return;
    }
    // F: open calendar dropdown (same as clicking calendar emoji on task line)
    if ((event.key === 'f' || event.key === 'F') && targets.length > 0) {
        event.preventDefault();
        window._lastSelectedTaskIdx = currentIdx;
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
        window._lastSelectedTaskIdx = currentIdx;
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
        reselectAfterAction(currentIdx);
        return;
    }
    // 7: delay +1 week
    if (event.key === '7' && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var d7id = parseTaskId(el.getAttribute('data-task-id'));
            if (d7id && typeof delayTask === 'function') delayTask(d7id, 7);
        });
        reselectAfterAction(currentIdx);
        return;
    }
    // 3: delay +1 month
    if (event.key === '3' && targets.length > 0) {
        event.preventDefault();
        targets.forEach(function(el) {
            var d3id = parseTaskId(el.getAttribute('data-task-id'));
            if (d3id && typeof delayTask === 'function') delayTask(d3id, 30);
        });
        reselectAfterAction(currentIdx);
        return;
    }
    // 0: set task date to today
    if (event.key === '0' && targets.length > 0) {
        event.preventDefault();
        var todayStr = typeof getLocalDateString === 'function' ? getLocalDateString(new Date()) : new Date().toISOString().slice(0, 10);
        targets.forEach(function(el) {
            var tid = parseTaskId(el.getAttribute('data-task-id'));
            if (tid && typeof updateTaskDate === 'function') updateTaskDate(tid, todayStr, { stopPropagation: function(){} });
        });
        reselectAfterAction(currentIdx);
        return;
    }
    // Escape: clear selection
    if (event.key === 'Escape' && current) {
        current.classList.remove('task-selected');
        return;
    }
}, true);  // capture phase

// Initialize keyboard support on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCollapseExpandKeyboardSupport);
} else {
    setupCollapseExpandKeyboardSupport();
}
// Make all functions globally accessible

// translateUI is defined in extracted_js.js

// renderFilteredActions removed - replaced by renderRecentActionsView(searchTerm)

// Calendar and Time picker variables
// Use window variables to ensure they're accessible globally

// Make calendar functions globally available

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

// Expose functions globally
// switchLanguage is defined in extracted_js.js

// Global variables
window.selectedTasks = selectedTasks;
window.activeAllTasksTemplateFilter = activeAllTasksTemplateFilter;
window.currentLanguage = currentLanguage;

/**
 * Delete All Data - Double Security Confirmation System
 */

// Export global functions

console.log('✅ Missing functions module loaded with', Object.keys(window).filter(k => typeof window[k] === 'function' && (k.startsWith('open') || k.startsWith('perform') || k.startsWith('search') || k.startsWith('handle'))).length, 'functions');
