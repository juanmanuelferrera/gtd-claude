// Utility functions and initialization code
console.log('🚀 HyperFiler Pro v3.5 - Starting initialization...');

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

// Configuration
const API_BASE = window.location.hostname.includes('localhost') 
    ? 'http://localhost:8787' 
    : 'https://hyperfiler-fresh-api.joanmanelferrera-400.workers.dev';