/**
 * Toast Notification System for HyperFiler Pro
 * Provides beautiful, accessible toast notifications for user feedback
 * Version: 1.0
 */

console.log('🍞 Toast Notification System loading - v1.0');

// Toast configuration
const TOAST_CONFIG = {
    duration: 4000,      // Default duration in ms
    maxToasts: 5,        // Maximum number of toasts to show at once
    position: 'top-right' // Position of toast container
};

// Toast type configurations
const TOAST_TYPES = {
    success: {
        icon: '✅',
        defaultTitle: 'Success',
        color: '#10b981'
    },
    error: {
        icon: '❌',
        defaultTitle: 'Error',
        color: '#ef4444'
    },
    warning: {
        icon: '⚠️',
        defaultTitle: 'Warning',
        color: '#f59e0b'
    },
    info: {
        icon: 'ℹ️',
        defaultTitle: 'Info',
        color: '#3b82f6'
    }
};

// Active toasts tracking
let activeToasts = [];
let toastContainer = null;

/**
 * Initialize toast container
 */
function initializeToastContainer() {
    if (toastContainer) {
        return toastContainer;
    }

    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('role', 'region');
    toastContainer.setAttribute('aria-label', 'Notifications');
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);

    console.log('🍞 Toast container initialized');
    return toastContainer;
}

/**
 * Create a toast notification
 * @param {Object} options - Toast options
 * @param {string} options.type - Type of toast (success, error, warning, info)
 * @param {string} options.title - Toast title (optional)
 * @param {string} options.message - Toast message
 * @param {number} options.duration - Duration in ms (0 for persistent)
 * @param {Function} options.onClick - Click handler (optional)
 * @returns {HTMLElement} Toast element
 */
function createToast(options) {
    const {
        type = 'info',
        title,
        message,
        duration = TOAST_CONFIG.duration,
        onClick
    } = options;

    const typeConfig = TOAST_TYPES[type] || TOAST_TYPES.info;
    const toastTitle = title || typeConfig.defaultTitle;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Toast icon
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = typeConfig.icon;
    icon.setAttribute('aria-hidden', 'true');

    // Toast content
    const content = document.createElement('div');
    content.className = 'toast-content';

    const titleElement = document.createElement('div');
    titleElement.className = 'toast-title';
    titleElement.textContent = toastTitle;

    const messageElement = document.createElement('div');
    messageElement.className = 'toast-message';
    messageElement.textContent = message;

    content.appendChild(titleElement);
    if (message) {
        content.appendChild(messageElement);
    }

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.addEventListener('click', () => {
        hideToast(toast);
    });

    // Progress bar (if duration is set)
    let progressBar = null;
    if (duration > 0) {
        progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        progressBar.style.animationDuration = `${duration}ms`;
        progressBar.style.color = typeConfig.color;
    }

    // Assemble toast
    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeButton);
    if (progressBar) {
        toast.appendChild(progressBar);
    }

    // Add click handler if provided
    if (onClick) {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('.toast-close')) {
                onClick();
                hideToast(toast);
            }
        });
    }

    return toast;
}

/**
 * Show a toast notification
 * @param {Object} options - Toast options (see createToast)
 * @returns {HTMLElement} Toast element
 */
function showToast(options) {
    const container = initializeToastContainer();

    // Remove oldest toast if max limit reached
    if (activeToasts.length >= TOAST_CONFIG.maxToasts) {
        const oldestToast = activeToasts[0];
        hideToast(oldestToast);
    }

    const toast = createToast(options);
    container.appendChild(toast);
    activeToasts.push(toast);

    console.log(`🍞 Toast shown: ${options.type} - ${options.message}`);

    // Auto-hide after duration
    const duration = options.duration !== undefined ? options.duration : TOAST_CONFIG.duration;
    if (duration > 0) {
        setTimeout(() => {
            hideToast(toast);
        }, duration);
    }

    return toast;
}

/**
 * Hide a toast notification
 * @param {HTMLElement} toast - Toast element to hide
 */
function hideToast(toast) {
    if (!toast || !toast.parentNode) {
        return;
    }

    toast.classList.add('toast-hiding');

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        activeToasts = activeToasts.filter(t => t !== toast);

        // Remove container if no toasts left
        if (activeToasts.length === 0 && toastContainer) {
            toastContainer.remove();
            toastContainer = null;
        }
    }, 300); // Match animation duration
}

/**
 * Convenience methods for different toast types
 */
const toast = {
    /**
     * Show success toast
     * @param {string} message - Toast message
     * @param {string} title - Toast title (optional)
     * @param {Object} options - Additional options
     */
    success: (message, title, options = {}) => {
        return showToast({
            type: 'success',
            title,
            message,
            ...options
        });
    },

    /**
     * Show error toast
     * @param {string} message - Toast message
     * @param {string} title - Toast title (optional)
     * @param {Object} options - Additional options
     */
    error: (message, title, options = {}) => {
        return showToast({
            type: 'error',
            title,
            message,
            duration: options.duration !== undefined ? options.duration : 6000, // Errors last longer
            ...options
        });
    },

    /**
     * Show warning toast
     * @param {string} message - Toast message
     * @param {string} title - Toast title (optional)
     * @param {Object} options - Additional options
     */
    warning: (message, title, options = {}) => {
        return showToast({
            type: 'warning',
            title,
            message,
            duration: options.duration !== undefined ? options.duration : 5000,
            ...options
        });
    },

    /**
     * Show info toast
     * @param {string} message - Toast message
     * @param {string} title - Toast title (optional)
     * @param {Object} options - Additional options
     */
    info: (message, title, options = {}) => {
        return showToast({
            type: 'info',
            title,
            message,
            ...options
        });
    },

    /**
     * Show a custom toast
     * @param {Object} options - Toast options
     */
    show: (options) => {
        return showToast(options);
    },

    /**
     * Clear all active toasts
     */
    clearAll: () => {
        activeToasts.forEach(toast => hideToast(toast));
        activeToasts = [];
    }
};

// Disabled: toast notifications turned off
var noOp = function() {};
window.toast = { success: noOp, error: noOp, warning: noOp, info: noOp, show: noOp, clearAll: noOp };
window.showToast = noOp;

console.log('✅ Toast Notification System ready');
console.log('Usage: toast.success("Task completed!"), toast.error("Failed to save"), etc.');
