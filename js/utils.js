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
        // El arrastre de la tarjeta se maneja globalmente (ver setup al final del archivo).
        return `<a href="${href}" target="_blank" rel="noopener" draggable="false" onclick="event.stopPropagation()" ontouchstart="event.stopPropagation()">${url}</a>${tail}`;
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
// ============================================================================
// Enlaces clicables dentro de tarjetas arrastrables.
// El arrastre nativo se "come" el clic si mueves aunque sea 1-2px, así que el
// enlace parece no clicable. Solución definitiva: abrimos el enlace nosotros en
// "pointerup" (un toque real, sin apenas movimiento), saltándonos el clic
// nativo y el arrastre. Solo para enlaces dentro de tarjetas/notas de tareas.
// ============================================================================
(function setupTaskLinkClicks() {
    var LINK_SCOPE = 'a[href]';
    var CARD_SCOPE = '.task-title, .task-notes, .task-card, .time-slot-task, [draggable]';
    function draggableAncestor(el) {
        var node = el.parentElement;
        while (node) {
            if (node.getAttribute && node.getAttribute('draggable') !== null) return node;
            node = node.parentElement;
        }
        return null;
    }
    var downLink = null, downX = 0, downY = 0, restoreCard = null;
    document.addEventListener('pointerdown', function (e) {
        downLink = null; restoreCard = null;
        var a = e.target && e.target.closest && e.target.closest(LINK_SCOPE);
        if (!a || !a.closest(CARD_SCOPE)) return;
        downLink = a; downX = e.clientX; downY = e.clientY;
        // Desactiva el arrastre de la tarjeta mientras se pulsa el enlace (evita el "fantasma").
        var card = draggableAncestor(a);
        if (card) {
            var prev = card.getAttribute('draggable');
            card.setAttribute('draggable', 'false');
            restoreCard = function () { if (prev === null) card.removeAttribute('draggable'); else card.setAttribute('draggable', prev); };
        }
    }, true);
    document.addEventListener('pointerup', function (e) {
        if (restoreCard) { var r = restoreCard; setTimeout(r, 0); restoreCard = null; }
        if (!downLink) return;
        var a = e.target && e.target.closest && e.target.closest(LINK_SCOPE);
        var moved = Math.sqrt(Math.pow(e.clientX - downX, 2) + Math.pow(e.clientY - downY, 2));
        if (a && a === downLink && moved < 8) {
            e.preventDefault();
            e.stopPropagation();
            var href = a.getAttribute('href');
            var target = a.getAttribute('target') || '_self';
            if (href) window.open(href, target, 'noopener');
        }
        downLink = null;
    }, true);
    document.addEventListener('pointercancel', function () { if (restoreCard) { restoreCard(); restoreCard = null; } downLink = null; }, true);
    console.log('🔗 Task link click handler installed');
})();
