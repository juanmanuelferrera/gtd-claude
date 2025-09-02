// Patches for missing functionality after JavaScript split

// Main app initialization
window.addEventListener('load', async () => {
    console.log('🚀 Initializing HyperFiler Pro...');
    
    // Ensure tasks array is initialized
    if (typeof tasks === 'undefined') {
        window.tasks = [];
    }
    
    // Load tasks from local storage first
    if (typeof loadTasksFromLocalStorage === 'function') {
        await loadTasksFromLocalStorage();
        console.log('📥 Loaded', tasks.length, 'tasks from localStorage');
    }
    
    // Check if user is logged in
    if (typeof checkAuthentication === 'function') {
        await checkAuthentication();
    }
    
    // Initialize sync system
    if (typeof initializeSimpleSync === 'function' && window.currentUser) {
        initializeSimpleSync();
    }
    
    // Sort tasks after loading
    if (typeof sortTasks === 'function') {
        sortTasks();
    }
    
    // Initialize the UI
    if (typeof showView === 'function') {
        // Show default view
        showView('today');
    }
    
    // Force render the view multiple times to ensure data displays
    const forceRender = () => {
        if (typeof renderCurrentView === 'function') {
            renderCurrentView();
            console.log('🔄 Forced render - tasks:', tasks.length);
        }
    };
    
    // Initial render
    setTimeout(forceRender, 100);
    setTimeout(forceRender, 500);
    setTimeout(forceRender, 2000);
    setTimeout(forceRender, 4000);
    
    // Listen for download completion and force render
    const originalDownloadAllTasks = window.downloadAllTasks;
    if (originalDownloadAllTasks) {
        window.downloadAllTasks = async function(...args) {
            const result = await originalDownloadAllTasks.apply(this, args);
            setTimeout(() => {
                console.log('📥 Download completed, tasks:', tasks.length);
                if (typeof sortTasks === 'function') {
                    sortTasks();
                }
                if (typeof renderCurrentView === 'function') {
                    renderCurrentView();
                    console.log('🔄 Forced render after download');
                }
            }, 500);
            return result;
        };
    }
    
    console.log('✅ HyperFiler Pro initialized with', tasks.length, 'tasks');
});

// Hide broken template literals and overlays immediately
document.addEventListener('DOMContentLoaded', () => {
    // Hide green overlay immediately
    const hideOverlays = () => {
        // Hide green DATABASE UPDATED overlay
        document.querySelectorAll('div').forEach(div => {
            if (div.style && (
                div.style.background === '#4caf50' || 
                div.style.backgroundColor === '#4caf50' ||
                div.style.background === 'rgb(76, 175, 80)' ||
                (div.textContent && div.textContent.includes('DATABASE UPDATED'))
            )) {
                if (div.style.position === 'fixed' || div.closest('[style*="position: fixed"]')) {
                    const target = div.style.position === 'fixed' ? div : div.closest('[style*="position: fixed"]');
                    if (target) {
                        target.style.display = 'none';
                    }
                }
            }
        });
        
        // Hide any elements with visible template literals
        document.querySelectorAll('*').forEach(element => {
            if (element.innerHTML && element.innerHTML.includes('${') && element.innerHTML.includes('}')) {
                // Check if it's visible text (not in script tags)
                if (element.textContent && element.textContent.includes('${')) {
                    // Hide the entire modal/container
                    const modal = element.closest('[style*="position: fixed"], [style*="position: absolute"]');
                    if (modal) {
                        modal.style.display = 'none';
                    } else if (element.style) {
                        element.style.display = 'none';
                    }
                }
            }
        });
    };
    
    // Run immediately and after short delay
    hideOverlays();
    setTimeout(hideOverlays, 100);
    setTimeout(hideOverlays, 500);
    setTimeout(hideOverlays, 1000);
    setTimeout(hideOverlays, 2000);
});

// Ensure critical functions are globally accessible
window.renderCurrentView = window.renderCurrentView || renderCurrentView;
window.renderTodayView = window.renderTodayView || renderTodayView;
window.renderTasks = window.renderTasks || renderTasks;
window.sortTasks = window.sortTasks || sortTasks;
window.toggleTaskStatus = window.toggleTaskStatus || toggleTaskStatus;
window.deleteTask = window.deleteTask || deleteTask;
window.delayTask = window.delayTask || delayTask;
window.openAddTaskModal = window.openAddTaskModal || openAddTaskModal;
window.editTask = window.editTask || editTask;
window.saveTaskEdit = window.saveTaskEdit || saveTaskEdit;
window.closeTaskModal = window.closeTaskModal || closeTaskModal;

// Stub out missing repeat manager functions to prevent errors
window.showRepeatManager = window.showRepeatManager || function() {
    console.log('Repeat Manager not available in split version');
    return false;
};

window.openRepeatManager = window.openRepeatManager || function() {
    console.log('Repeat Manager not available in split version');
    return false;
};

// Hide any visible template literal strings in the UI
setInterval(() => {
    document.querySelectorAll('*').forEach(el => {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            const text = el.childNodes[0].textContent;
            if (text && text.includes('${') && text.includes('}')) {
                el.style.display = 'none';
            }
        }
    });
}, 1000);