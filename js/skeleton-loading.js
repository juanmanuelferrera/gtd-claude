/**
 * Skeleton Loading System for HyperFiler Pro
 * Provides loading placeholders for improved perceived performance
 * Version: 1.0
 */

console.log('💀 Skeleton Loading System loading - v1.0');

/**
 * Create a skeleton task card placeholder
 */
function createSkeletonTaskCard() {
    const skeleton = document.createElement('div');
    skeleton.className = 'task-card skeleton-task-card';
    skeleton.setAttribute('aria-busy', 'true');
    skeleton.setAttribute('aria-label', 'Loading tasks...');

    skeleton.innerHTML = `
        <div style="padding: 16px;">
            <div class="skeleton skeleton-text" style="width: 75%; height: 18px; margin-bottom: 12px;"></div>
            <div class="skeleton skeleton-text" style="width: 50%; height: 14px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-text" style="width: 40%; height: 14px;"></div>
        </div>
    `;

    return skeleton;
}

/**
 * Create a skeleton calendar day placeholder
 */
function createSkeletonCalendarDay() {
    const skeleton = document.createElement('div');
    skeleton.className = 'calendar-day skeleton';
    skeleton.setAttribute('aria-busy', 'true');

    skeleton.innerHTML = `
        <div style="padding: 8px;">
            <div class="skeleton skeleton-text" style="width: 30px; height: 24px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton-text" style="width: 100%; height: 12px; margin-bottom: 4px;"></div>
            <div class="skeleton skeleton-text" style="width: 100%; height: 12px;"></div>
        </div>
    `;

    return skeleton;
}

/**
 * Show skeleton loading placeholders in a container
 * @param {string} containerId - ID of the container element
 * @param {number} count - Number of skeleton items to show
 * @param {string} type - Type of skeleton ('task' or 'calendar')
 */
function showSkeletonLoading(containerId, count = 3, type = 'task') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add skeleton placeholders
    for (let i = 0; i < count; i++) {
        const skeleton = type === 'calendar'
            ? createSkeletonCalendarDay()
            : createSkeletonTaskCard();
        container.appendChild(skeleton);
    }

    // Mark container as loading
    container.classList.add('is-loading-content');
    container.setAttribute('aria-busy', 'true');
}

/**
 * Hide skeleton loading and restore container
 * @param {string} containerId - ID of the container element
 */
function hideSkeletonLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }

    // Remove loading state
    container.classList.remove('is-loading-content');
    container.removeAttribute('aria-busy');

    // Remove skeleton items
    const skeletons = container.querySelectorAll('.skeleton-task-card, .skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
}

/**
 * Show skeleton loading for specific view
 * @param {string} view - View name ('today', 'week', 'month', 'search')
 */
function showViewSkeleton(view) {
    const viewConfig = {
        'today': { containerId: 'todaySchedule', count: 5, type: 'task' },
        'week': { containerId: 'weekSchedule', count: 7, type: 'task' },
        'month': { containerId: 'calendarGrid', count: 35, type: 'calendar' },
        'search': { containerId: 'searchResults', count: 5, type: 'task' }
    };

    const config = viewConfig[view];
    if (config) {
        showSkeletonLoading(config.containerId, config.count, config.type);
    }
}

/**
 * Hide skeleton loading for specific view
 * @param {string} view - View name ('today', 'week', 'month', 'search')
 */
function hideViewSkeleton(view) {
    const viewConfig = {
        'today': 'todaySchedule',
        'week': 'weekSchedule',
        'month': 'calendarGrid',
        'search': 'searchResults'
    };

    const containerId = viewConfig[view];
    if (containerId) {
        hideSkeletonLoading(containerId);
    }
}

/**
 * Enhanced task rendering with skeleton transition
 * Wraps around existing render functions to add smooth loading states
 */
function enhanceWithSkeleton(renderFunction, view) {
    return async function(...args) {
        // Show skeleton before rendering
        showViewSkeleton(view);

        // Small delay for skeleton to be visible (prevents flash)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Call original render function
        const result = await renderFunction.apply(this, args);

        // Hide skeleton after rendering
        hideViewSkeleton(view);

        return result;
    };
}

// Make functions globally available
window.showSkeletonLoading = showSkeletonLoading;
window.hideSkeletonLoading = hideSkeletonLoading;
window.showViewSkeleton = showViewSkeleton;
window.hideViewSkeleton = hideViewSkeleton;
window.createSkeletonTaskCard = createSkeletonTaskCard;
window.createSkeletonCalendarDay = createSkeletonCalendarDay;
window.enhanceWithSkeleton = enhanceWithSkeleton;

console.log('✅ Skeleton Loading System ready');
console.log('💡 Use showViewSkeleton("today"|"week"|"month"|"search") to show loading states');
