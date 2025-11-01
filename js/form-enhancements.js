/**
 * Form Enhancement System for HyperFiler Pro
 * Provides input validation, state management, and visual feedback
 * Version: 1.0
 */

console.log('📝 Form Enhancement System loading - v1.0');

/**
 * Show error state on input
 * @param {HTMLElement} input - Input element
 * @param {string} message - Error message to display
 */
function showInputError(input, message) {
    if (!input) return;

    // Add error class
    input.classList.remove('has-success');
    input.classList.add('has-error');

    // Remove existing message
    const existingMessage = input.parentElement.querySelector('.input-error-message, .input-success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Add error message if provided
    if (message) {
        const errorMessage = document.createElement('span');
        errorMessage.className = 'input-error-message';
        errorMessage.textContent = message;
        errorMessage.setAttribute('role', 'alert');
        input.parentElement.appendChild(errorMessage);
    }

    // Trigger shake animation by re-adding class
    input.style.animation = 'none';
    setTimeout(() => {
        input.style.animation = '';
    }, 10);
}

/**
 * Show success state on input
 * @param {HTMLElement} input - Input element
 * @param {string} message - Success message to display (optional)
 */
function showInputSuccess(input, message) {
    if (!input) return;

    // Add success class
    input.classList.remove('has-error');
    input.classList.add('has-success');

    // Remove existing message
    const existingMessage = input.parentElement.querySelector('.input-error-message, .input-success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Add success message if provided
    if (message) {
        const successMessage = document.createElement('span');
        successMessage.className = 'input-success-message';
        successMessage.textContent = message;
        successMessage.setAttribute('role', 'status');
        input.parentElement.appendChild(successMessage);
    }
}

/**
 * Clear validation state on input
 * @param {HTMLElement} input - Input element
 */
function clearInputState(input) {
    if (!input) return;

    input.classList.remove('has-error', 'has-success');

    // Remove any message
    const existingMessage = input.parentElement.querySelector('.input-error-message, .input-success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate required field
 * @param {HTMLElement} input - Input element
 * @returns {boolean}
 */
function validateRequired(input) {
    if (!input) return false;

    const value = input.value.trim();
    const isValid = value.length > 0;

    if (!isValid) {
        showInputError(input, 'This field is required');
    } else {
        clearInputState(input);
    }

    return isValid;
}

/**
 * Validate email input
 * @param {HTMLElement} input - Email input element
 * @returns {boolean}
 */
function validateEmail(input) {
    if (!input) return false;

    const value = input.value.trim();

    if (value.length === 0) {
        showInputError(input, 'Email is required');
        return false;
    }

    if (!isValidEmail(value)) {
        showInputError(input, 'Please enter a valid email address');
        return false;
    }

    showInputSuccess(input);
    return true;
}

/**
 * Validate minimum length
 * @param {HTMLElement} input - Input element
 * @param {number} minLength - Minimum required length
 * @returns {boolean}
 */
function validateMinLength(input, minLength) {
    if (!input) return false;

    const value = input.value.trim();

    if (value.length < minLength) {
        showInputError(input, `Must be at least ${minLength} characters`);
        return false;
    }

    clearInputState(input);
    return true;
}

/**
 * Enhance all inputs with focus indicators
 */
function enhanceInputFocusStates() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="date"], input[type="time"], input[type="number"], textarea, select');

    inputs.forEach(input => {
        // Clear state on focus
        input.addEventListener('focus', () => {
            // Only clear if not in error/success state
            if (!input.dataset.preserveState) {
                // Don't clear immediately, just update aria
                input.setAttribute('aria-invalid', 'false');
            }
        });

        // Validate on blur if required
        input.addEventListener('blur', () => {
            if (input.hasAttribute('required') && input.value.trim() === '') {
                showInputError(input, 'This field is required');
            }
        });
    });
}

/**
 * Auto-enhance form submissions
 */
function enhanceFormSubmissions() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

            inputs.forEach(input => {
                if (!validateRequired(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                e.preventDefault();
                // Focus first invalid input
                const firstError = form.querySelector('.has-error');
                if (firstError) {
                    firstError.focus();
                }
            }
        });
    });
}

/**
 * Add real-time validation to specific inputs
 */
function addRealTimeValidation() {
    // Email inputs
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.value.trim().length > 0) {
                validateEmail(input);
            }
        });
    });

    // Required inputs
    const requiredInputs = document.querySelectorAll('input[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('input', () => {
            // Clear error as user types
            if (input.classList.contains('has-error') && input.value.trim().length > 0) {
                clearInputState(input);
            }
        });
    });
}

// Make functions globally available
window.showInputError = showInputError;
window.showInputSuccess = showInputSuccess;
window.clearInputState = clearInputState;
window.validateRequired = validateRequired;
window.validateEmail = validateEmail;
window.validateMinLength = validateMinLength;
window.isValidEmail = isValidEmail;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        enhanceInputFocusStates();
        enhanceFormSubmissions();
        addRealTimeValidation();
    });
} else {
    // DOM is already ready
    enhanceInputFocusStates();
    enhanceFormSubmissions();
    addRealTimeValidation();
}

console.log('✅ Form Enhancement System ready');
console.log('💡 All inputs enhanced with focus states and validation');
