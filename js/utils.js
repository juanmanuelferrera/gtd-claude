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
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .trim();
}
window.sanitizeInput = sanitizeInput;

// Utility functions - now using centralized utilities with backward compatibility

// Delegate to DateUtils for consistency (with fallback if DateUtils not loaded)
function getLocalDateString(date = new Date()) {
    if (typeof DateUtils !== 'undefined' && DateUtils.getLocalDateString) {
        return DateUtils.getLocalDateString(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTasksForDate(dateStr) {
    const tasksArray = window.tasks || tasks || [];
    if (typeof TaskUtils !== 'undefined' && TaskUtils.getTasksForDate) {
        return TaskUtils.getTasksForDate(tasksArray, dateStr);
    }
    return tasksArray.filter(task => task.dueDate === dateStr && task.status !== 'deleted');
}

function formatDate(dateStr) {
    if (typeof DateUtils !== 'undefined' && DateUtils.formatDate) {
        return DateUtils.formatDate(dateStr);
    }
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}


function formatTime(timeStr) {
    if (typeof DateUtils !== 'undefined' && DateUtils.formatTime) {
        return DateUtils.formatTime(timeStr);
    }
    if (!timeStr) return '';
    return timeStr; // Display in 24-hour format
}

// Delegate to TaskUtils
function makeLinksClickable(text) {
    if (typeof TaskUtils !== 'undefined' && TaskUtils.makeLinksClickable) {
        return TaskUtils.makeLinksClickable(text);
    }
    if (!text) return text;
    // Detecta http(s)://…, kavya://… y enlaces sin esquema tipo www.google.com
    const urlRegex = /((?:https?|kavya):\/\/[^\s]+|www\.[^\s]+)/gi;
    return text.replace(urlRegex, (match) => {
        // Separa la puntuación final (. , ) ! ? …) para no meterla dentro del enlace
        const trail = match.match(/[.,;:!?)\]]+$/);
        let url = match, tail = '';
        if (trail) { url = match.slice(0, -trail[0].length); tail = trail[0]; }
        const href = /^(?:https?|kavya):\/\//i.test(url) ? url : 'https://' + url;
        // Las tarjetas son draggable="true" y el arrastre nativo se come el clic del enlace.
        // Solución: al pasar el ratón/tocar el enlace, desactivamos el arrastre de la tarjeta;
        // lo reactivamos al salir. Así el clic del enlace funciona y el resto de la tarjeta sigue arrastrable.
        // Buscar la tarjeta desde el PADRE: el propio <a> tiene draggable="false",
        // así que this.closest('[draggable]') se encontraría a sí mismo en vez de la tarjeta.
        const off = `var c=this.parentElement&&this.parentElement.closest('[draggable]');if(c)c.setAttribute('draggable','false')`;
        const on = `var c=this.parentElement&&this.parentElement.closest('[draggable]');if(c)c.setAttribute('draggable','true')`;
        return `<a href="${href}" target="_blank" rel="noopener" draggable="false" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()" ontouchstart="event.stopPropagation();${off}" onmouseenter="${off}" onmouseleave="${on}" onblur="${on}">${url}</a>${tail}`;
    });
}

function extractTagsAndCleanText(text) {
    if (typeof TaskUtils !== 'undefined' && TaskUtils.extractTagsAndCleanText) {
        return TaskUtils.extractTagsAndCleanText(text);
    }
    return {
        cleanText: text,
        tags: []
    };
}

function hasTaskTags(task) {
    if (typeof TaskUtils !== 'undefined' && TaskUtils.hasTaskTags) {
        return TaskUtils.hasTaskTags(task);
    }
    return false;
}

// Global variables needed for module communication
let currentFilteredTasks = [];
let activeAllTasksTemplateFilter = null;