/**
 * ARIA Accessibility Enhancements for HyperFiler Pro
 * Adds comprehensive ARIA attributes for screen reader support
 * Version: 1.0
 */

console.log('♿ ARIA Accessibility System loading - v1.0');

/**
 * Initialize ARIA enhancements when DOM is ready
 */
function initializeARIAEnhancements() {
    console.log('♿ Initializing ARIA accessibility enhancements...');

    // 1. Add semantic roles to main sections
    addSectionRoles();

    // 2. Add ARIA labels to navigation
    enhanceNavigation();

    // 3. Add ARIA labels to forms and inputs
    enhanceForms();

    // 4. Add ARIA live regions for dynamic content
    addLiveRegions();

    // 5. Enhance buttons with proper ARIA labels
    enhanceButtons();

    // 6. Add ARIA attributes to task cards
    enhanceTaskCards();

    // 7. Add ARIA attributes to modals
    enhanceModals();

    // 8. Enhance calendar with ARIA
    enhanceCalendar();

    console.log('✅ ARIA accessibility enhancements initialized');
}

/**
 * Add semantic ARIA roles to main sections
 */
function addSectionRoles() {
    // Main navigation
    const desktopSidebar = document.querySelector('.desktop-sidebar');
    if (desktopSidebar) {
        desktopSidebar.setAttribute('role', 'navigation');
        desktopSidebar.setAttribute('aria-label', 'Main navigation');
    }

    // Mobile navigation
    const mobileNav = document.querySelector('.modern-mobile-nav');
    if (mobileNav) {
        mobileNav.setAttribute('role', 'navigation');
        mobileNav.setAttribute('aria-label', 'Mobile navigation');
    }

    // Main content areas
    const todayView = document.getElementById('today-view');
    if (todayView) {
        todayView.setAttribute('role', 'region');
        todayView.setAttribute('aria-labelledby', 'today-view-heading');
    }

    const weekView = document.getElementById('week-view');
    if (weekView) {
        weekView.setAttribute('role', 'region');
        weekView.setAttribute('aria-labelledby', 'week-view-heading');
    }

    const calendarView = document.getElementById('calendar-view');
    if (calendarView) {
        calendarView.setAttribute('role', 'region');
        calendarView.setAttribute('aria-labelledby', 'calendar-view-heading');
    }

    // Search section
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
        searchSection.setAttribute('role', 'search');
        searchSection.setAttribute('aria-label', 'Search tasks');
    }

    console.log('✅ Section roles added');
}

/**
 * Enhance navigation with ARIA attributes
 */
function enhanceNavigation() {
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        // Add role if not present
        if (!button.getAttribute('role')) {
            button.setAttribute('role', 'button');
        }

        // Add aria-label based on button text or ID
        const buttonText = button.textContent.trim();
        if (buttonText && !button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', `Navigate to ${buttonText}`);
        }

        // Add aria-current for active buttons
        if (button.classList.contains('active')) {
            button.setAttribute('aria-current', 'page');
        }
    });

    console.log('✅ Navigation enhanced');
}

/**
 * Enhance forms and inputs with ARIA labels
 */
function enhanceForms() {
    // Search inputs
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="🔍"]');
    searchInputs.forEach(input => {
        if (!input.getAttribute('aria-label')) {
            const placeholder = input.getAttribute('placeholder') || 'Search';
            input.setAttribute('aria-label', placeholder.replace(/🔍/g, '').trim());
            input.setAttribute('role', 'searchbox');
        }
    });

    // Task search inputs
    const todayTaskSearch = document.getElementById('todayTaskSearch');
    if (todayTaskSearch) {
        todayTaskSearch.setAttribute('aria-label', 'Search today\'s tasks');
        todayTaskSearch.setAttribute('role', 'searchbox');
    }

    const weekTaskSearch = document.getElementById('weekTaskSearch');
    if (weekTaskSearch) {
        weekTaskSearch.setAttribute('aria-label', 'Search week tasks');
        weekTaskSearch.setAttribute('role', 'searchbox');
    }

    const monthTaskSearch = document.getElementById('monthTaskSearch');
    if (monthTaskSearch) {
        monthTaskSearch.setAttribute('aria-label', 'Search month tasks');
        monthTaskSearch.setAttribute('role', 'searchbox');
    }

    console.log('✅ Forms enhanced');
}

/**
 * Add ARIA live regions for dynamic content updates
 */
function addLiveRegions() {
    // Today's schedule - announces when tasks are added/removed
    const todaySchedule = document.getElementById('todaySchedule');
    if (todaySchedule) {
        todaySchedule.setAttribute('aria-live', 'polite');
        todaySchedule.setAttribute('aria-atomic', 'false');
        todaySchedule.setAttribute('aria-relevant', 'additions removals');
    }

    // Search results
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.setAttribute('aria-live', 'polite');
        searchResults.setAttribute('aria-atomic', 'true');
    }

    // Calendar grid
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        calendarGrid.setAttribute('aria-live', 'polite');
        calendarGrid.setAttribute('aria-atomic', 'false');
    }

    // Toast container (already has aria-live in toast.js)
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        toastContainer.setAttribute('aria-live', 'polite');
        toastContainer.setAttribute('aria-atomic', 'true');
    }

    console.log('✅ Live regions added');
}

/**
 * Enhance buttons with proper ARIA labels
 */
function enhanceButtons() {
    // Previous/Next navigation buttons
    const prevButtons = document.querySelectorAll('button[onclick*="previous"]');
    prevButtons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            const text = button.textContent.trim();
            if (text.includes('Prev') || text.includes('Ant')) {
                button.setAttribute('aria-label', 'Go to previous period');
            }
        }
    });

    const nextButtons = document.querySelectorAll('button[onclick*="next"]');
    nextButtons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            const text = button.textContent.trim();
            if (text.includes('Next') || text.includes('Sig')) {
                button.setAttribute('aria-label', 'Go to next period');
            }
        }
    });

    // Add Task buttons
    const addButtons = document.querySelectorAll('button[onclick*="openAddTaskModal"], button[onclick*="AddTask"]');
    addButtons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', 'Add new task');
        }
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            const text = button.textContent.trim();
            button.setAttribute('aria-label', `Filter by ${text}`);
            button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
        }
    });

    // Close buttons
    const closeButtons = document.querySelectorAll('.close-btn, button[onclick*="close"]');
    closeButtons.forEach(button => {
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', 'Close');
        }
    });

    console.log('✅ Buttons enhanced');
}

/**
 * Enhance task cards with ARIA attributes
 */
function enhanceTaskCards() {
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        // Add article role for semantic meaning
        card.setAttribute('role', 'article');

        // Add aria-label with task title
        const titleElement = card.querySelector('.task-title');
        if (titleElement && !card.getAttribute('aria-label')) {
            card.setAttribute('aria-label', `Task: ${titleElement.textContent.trim()}`);
        }

        // Mark completed tasks
        if (card.classList.contains('completed')) {
            card.setAttribute('aria-label', card.getAttribute('aria-label') + ' (completed)');
        }
    });

    console.log('✅ Task cards enhanced');
}

/**
 * Enhance modals with ARIA attributes
 */
function enhanceModals() {
    // All modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        // Find modal title
        const modalTitle = modal.querySelector('.modal-title, h2, h3');
        if (modalTitle) {
            // Add ID if not present
            if (!modalTitle.id) {
                modalTitle.id = `modal-title-${Date.now()}`;
            }
            modal.setAttribute('aria-labelledby', modalTitle.id);
        }
    });

    console.log('✅ Modals enhanced');
}

/**
 * Enhance calendar with ARIA attributes
 */
function enhanceCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        calendarGrid.setAttribute('role', 'grid');
        calendarGrid.setAttribute('aria-label', 'Calendar month view');

        // Mark calendar cells
        const cells = calendarGrid.querySelectorAll('.calendar-day');
        cells.forEach(cell => {
            cell.setAttribute('role', 'gridcell');

            // Add aria-label with date
            const dateText = cell.querySelector('.date-number')?.textContent;
            if (dateText) {
                cell.setAttribute('aria-label', `Day ${dateText}`);
            }

            // Mark selected/today
            if (cell.classList.contains('today')) {
                cell.setAttribute('aria-current', 'date');
            }
        });
    }

    console.log('✅ Calendar enhanced');
}

/**
 * Update ARIA attributes when navigation changes
 */
function updateNavigationARIA() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        if (button.classList.contains('active')) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });
}

/**
 * Announce dynamic content changes to screen readers
 */
function announceToScreenReader(message, priority = 'polite') {
    // Create a visually hidden live region if it doesn't exist
    let announcer = document.getElementById('aria-announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'aria-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.position = 'absolute';
        announcer.style.left = '-10000px';
        announcer.style.width = '1px';
        announcer.style.height = '1px';
        announcer.style.overflow = 'hidden';
        document.body.appendChild(announcer);
    }

    // Update the message
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
        announcer.textContent = '';
    }, 1000);
}

// Make functions globally available
window.updateNavigationARIA = updateNavigationARIA;
window.announceToScreenReader = announceToScreenReader;
window.enhanceTaskCards = enhanceTaskCards;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeARIAEnhancements);
} else {
    initializeARIAEnhancements();
}

// Re-enhance task cards when they're dynamically added
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('task-card')) {
                    enhanceTaskCards();
                }
            });
        }
    });
});

// Start observing the document for task card additions
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('✅ ARIA Accessibility System ready');
console.log('💡 Screen reader support enabled');
