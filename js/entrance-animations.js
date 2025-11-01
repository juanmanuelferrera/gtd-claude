/**
 * Entrance Animations System for HyperFiler Pro
 * Adds smooth entrance animations to dynamically added elements
 * Version: 1.0
 */

console.log('✨ Entrance Animations System loading - v1.0');

/**
 * Apply entrance animation to an element
 * @param {HTMLElement} element - Element to animate
 * @param {string} animation - Animation name ('fadeInUp', 'fadeIn', 'scaleIn', etc.)
 * @param {number} delay - Delay in milliseconds before animation starts
 */
function applyEntranceAnimation(element, animation = 'fadeInUp', delay = 0) {
    if (!element) return;

    // Set initial state (invisible)
    element.style.opacity = '0';

    // Apply animation after delay
    setTimeout(() => {
        element.style.animation = `${animation} 0.4s ease-out forwards`;
        element.style.opacity = '1';
    }, delay);
}

/**
 * Apply staggered entrance animations to multiple elements
 * @param {NodeList|Array} elements - Elements to animate
 * @param {string} animation - Animation name
 * @param {number} staggerDelay - Delay between each element (ms)
 */
function applyStaggeredAnimation(elements, animation = 'fadeInUp', staggerDelay = 50) {
    if (!elements || elements.length === 0) return;

    elements.forEach((element, index) => {
        applyEntranceAnimation(element, animation, index * staggerDelay);
    });
}

/**
 * Observe and animate task cards as they're added to the DOM
 */
function initializeTaskCardAnimations() {
    // Animation observer for task cards
    const taskCardObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Task cards
                        if (node.classList && node.classList.contains('task-card')) {
                            applyEntranceAnimation(node, 'fadeInUp', 0);
                        }
                        // Also check for task cards added inside the node
                        else if (node.querySelectorAll) {
                            const taskCards = node.querySelectorAll('.task-card');
                            applyStaggeredAnimation(taskCards, 'fadeInUp', 30);
                        }
                    }
                });
            }
        });
    });

    // Start observing the document body for task card additions
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body) {
                taskCardObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        });
    } else {
        // DOM is already ready
        if (document.body) {
            taskCardObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
}

/**
 * Animate all existing task cards on page load
 */
function animateExistingTaskCards() {
    const taskCards = document.querySelectorAll('.task-card');
    if (taskCards.length > 0) {
        applyStaggeredAnimation(taskCards, 'fadeInUp', 30);
    }
}

/**
 * Animate calendar grid on load/update
 */
function animateCalendarGrid() {
    const calendarDays = document.querySelectorAll('.calendar-day');
    if (calendarDays.length > 0) {
        applyStaggeredAnimation(calendarDays, 'fadeIn', 15);
    }
}

/**
 * Animate modal dialogs with scaleIn effect
 */
function initializeModalAnimations() {
    // Observer for modals
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList) {
                        if (node.classList.contains('modal') && !node.classList.contains('hidden')) {
                            const modalContent = node.querySelector('.modal-content');
                            if (modalContent) {
                                applyEntranceAnimation(modalContent, 'scaleIn', 0);
                            }
                        }
                    }
                });
            }

            // Also watch for class changes (when modal becomes visible)
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const node = mutation.target;
                if (node.classList.contains('modal') && !node.classList.contains('hidden')) {
                    const modalContent = node.querySelector('.modal-content');
                    if (modalContent) {
                        applyEntranceAnimation(modalContent, 'scaleIn', 0);
                    }
                }
            }
        });
    });

    // Start observing
    if (document.body) {
        modalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }
}

/**
 * Animate empty states
 */
function animateEmptyStates() {
    const emptyStates = document.querySelectorAll('.no-tasks');
    emptyStates.forEach(state => {
        applyEntranceAnimation(state, 'fadeInUp', 100);
    });
}

/**
 * Enhanced render function wrapper that adds animations
 * @param {Function} renderFunction - Original render function
 * @param {string} animation - Animation to apply
 */
function withEntranceAnimation(renderFunction, animation = 'fadeInUp') {
    return function(...args) {
        // Call original function
        const result = renderFunction.apply(this, args);

        // Animate after a short delay to ensure DOM is updated
        setTimeout(() => {
            const taskCards = document.querySelectorAll('.task-card');
            applyStaggeredAnimation(taskCards, animation, 30);
        }, 10);

        return result;
    };
}

// Make functions globally available
window.applyEntranceAnimation = applyEntranceAnimation;
window.applyStaggeredAnimation = applyStaggeredAnimation;
window.animateExistingTaskCards = animateExistingTaskCards;
window.animateCalendarGrid = animateCalendarGrid;
window.animateEmptyStates = animateEmptyStates;
window.withEntranceAnimation = withEntranceAnimation;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeTaskCardAnimations();
        initializeModalAnimations();

        // Animate existing content after a short delay
        setTimeout(() => {
            animateExistingTaskCards();
            animateEmptyStates();
        }, 300);
    });
} else {
    // DOM is already ready
    initializeTaskCardAnimations();
    initializeModalAnimations();

    setTimeout(() => {
        animateExistingTaskCards();
        animateEmptyStates();
    }, 300);
}

console.log('✅ Entrance Animations System ready');
console.log('💡 Task cards, modals, and empty states will animate on appearance');
