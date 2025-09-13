// Utility functions and initialization code
console.log('🚀 HyperFiler Pro v1.3.0 - Starting initialization...');

window.addEventListener('error', function(e) {
    console.error('❌ UNCAUGHT ERROR:', e.message, 'at line', e.lineno, 'column', e.colno);
    console.error('Stack:', e.error?.stack);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ UNHANDLED PROMISE REJECTION:', e.reason);
});

// Prevent mobile bounce/pull-to-refresh
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) return; // Allow multi-touch gestures
    
    // Check if we're scrolling inside a scrollable element
    let scrollable = e.target.closest('#todaySchedule, #weekSchedule, #monthSchedule, #listsContainer, #allTasks, #searchResults, #statsContainer, #settingsContainer, #repeatContainer, .modal-content');
    
    if (!scrollable) {
        e.preventDefault();
    }
}, { passive: false });

// Configuration - Primary API_BASE definition
window.API_BASE = window.API_BASE || (window.location.hostname.includes('localhost') 
    ? 'http://localhost:8787' 
    : 'https://hyperfiler-api.joanmanelferrera-400.workers.dev');

// SECURITY: Client-side input validation functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove dangerous content
    const cleaned = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .substring(0, 500) // Limit length
        .trim();
    
    return cleaned || null;
}

// Utility functions - now using centralized utilities with backward compatibility

// Delegate to DateUtils for consistency
function getLocalDateString(date = new Date()) {
    return DateUtils.getLocalDateString ? DateUtils.getLocalDateString(date) : (() => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();
}

function getTasksForDate(dateStr) {
    const tasksArray = window.tasks || tasks || [];
    return TaskUtils.getTasksForDate ? 
        TaskUtils.getTasksForDate(tasksArray, dateStr) :
        tasksArray.filter(task => task.dueDate === dateStr && task.status !== 'deleted');
}

function formatDate(dateStr) {
    return DateUtils.formatDate ? DateUtils.formatDate(dateStr) : (() => {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    })();
}

function formatDateForDisplay(dateStr) {
    return DateUtils.formatDateForDisplay ? DateUtils.formatDateForDisplay(dateStr) : (() => {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        if (dateStr === getLocalDateString(today)) {
            return 'Today';
        } else if (dateStr === getLocalDateString(tomorrow)) {
            return 'Tomorrow';
        } else if (dateStr === getLocalDateString(yesterday)) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    })();
}

function formatTime(timeStr) {
    return DateUtils.formatTime ? DateUtils.formatTime(timeStr) : (() => {
        if (!timeStr) return '';
        return timeStr; // Display in 24-hour format
    })();
}

// Delegate to TaskUtils
function makeLinksClickable(text) {
    return TaskUtils.makeLinksClickable ? TaskUtils.makeLinksClickable(text) : (() => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank" onclick="event.stopPropagation()">$1</a>');
    })();
}

function extractTagsAndCleanText(text) {
    return TaskUtils.extractTagsAndCleanText ? TaskUtils.extractTagsAndCleanText(text) : {
        cleanText: text,
        tags: []
    };
}

function hasTaskTags(task) {
    return TaskUtils.hasTaskTags ? TaskUtils.hasTaskTags(task) : false;
}

// Global variables needed for module communication
let currentFilteredTasks = [];
let activeAllTasksTemplateFilter = null;