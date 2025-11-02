// Dark Mode Module
// Provides automatic system preference detection + manual toggle

// Dark mode state (module-private)
let isDarkMode = false;
let toggleButton = null;

/**
 * Initialize dark mode based on saved preference or default
 * @returns {boolean} Initial dark mode state
 */
export function initializeDarkMode() {
    console.log('🌙 Initializing dark mode...');

    // Check for saved user preference
    const savedMode = localStorage.getItem('darkMode');

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Priority: saved preference > light mode default (not system preference)
    if (savedMode !== null) {
        // User has explicitly chosen a mode
        isDarkMode = savedMode === 'true';
        console.log('🌙 Using saved preference:', isDarkMode ? 'dark' : 'light');
    } else {
        // Default to LIGHT mode (ignoring system preference)
        isDarkMode = false;
        localStorage.setItem('darkMode', 'false');
        console.log('🌙 Defaulting to light mode (system pref ignored)');
    }

    // Apply the mode
    applyDarkMode(isDarkMode);

    // Create toggle button
    createToggleButton();

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't set a preference
        if (localStorage.getItem('darkMode') === null) {
            isDarkMode = e.matches;
            applyDarkMode(isDarkMode);
            updateToggleButton();
            console.log('🌙 System preference changed to:', isDarkMode ? 'dark' : 'light');
        }
    });

    console.log('✅ Dark mode initialized');
    return isDarkMode;
}

/**
 * Apply dark mode by adding/removing classes
 * @param {boolean} dark - Whether to enable dark mode
 */
export function applyDarkMode(dark) {
    if (dark) {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
    }
    isDarkMode = dark;
}

/**
 * Toggle dark mode on/off
 * @returns {boolean} New dark mode state
 */
export function toggleDarkMode() {
    isDarkMode = !isDarkMode;

    // Save preference
    localStorage.setItem('darkMode', isDarkMode.toString());

    // Apply mode
    applyDarkMode(isDarkMode);

    // Update button
    updateToggleButton();

    // Show toast notification (if available)
    if (window.toast) {
        window.toast.success(
            isDarkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️',
            null,
            { duration: 2000 }
        );
    }

    console.log('🌙 Dark mode toggled:', isDarkMode ? 'dark' : 'light');
    return isDarkMode;
}

/**
 * Reset to system preference
 * @returns {boolean} System preference dark mode state
 */
export function resetToSystemPreference() {
    localStorage.removeItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode = prefersDark;
    applyDarkMode(isDarkMode);
    updateToggleButton();

    if (window.toast) {
        window.toast.info('Using system preference', null, { duration: 2000 });
    }

    console.log('🌙 Reset to system preference:', isDarkMode ? 'dark' : 'light');
    return isDarkMode;
}

/**
 * Create dark mode toggle button
 * @returns {HTMLElement} Toggle button element
 */
export function createToggleButton() {
    if (toggleButton) {
        return toggleButton;
    }

    toggleButton = document.createElement('button');
    toggleButton.className = 'dark-mode-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle dark mode');
    toggleButton.setAttribute('title', 'Toggle dark/light mode');

    toggleButton.addEventListener('click', toggleDarkMode);

    // Double-click to reset to system preference
    toggleButton.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        resetToSystemPreference();
    });

    updateToggleButton();

    document.body.appendChild(toggleButton);
    console.log('🌙 Toggle button created');

    return toggleButton;
}

/**
 * Update toggle button text/icon based on current mode
 */
export function updateToggleButton() {
    if (!toggleButton) return;

    const icon = isDarkMode ? '☀️' : '🌙';
    const text = isDarkMode ? 'Light' : 'Dark';

    toggleButton.innerHTML = `
        <span class="icon">${icon}</span>
        <span>${text}</span>
    `;
}

/**
 * Get current dark mode state
 * @returns {Object} Dark mode state information
 */
export function getDarkModeState() {
    return {
        isDarkMode: isDarkMode,
        isSystemPreference: localStorage.getItem('darkMode') === null,
        systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    };
}

/**
 * Check if dark mode is currently enabled
 * @returns {boolean} True if dark mode is active
 */
export function isDarkModeEnabled() {
    return isDarkMode;
}

/**
 * Enable dark mode
 * @returns {boolean} True if successful
 */
export function enableDarkMode() {
    if (!isDarkMode) {
        toggleDarkMode();
    }
    return isDarkMode;
}

/**
 * Disable dark mode (enable light mode)
 * @returns {boolean} False (dark mode disabled)
 */
export function disableDarkMode() {
    if (isDarkMode) {
        toggleDarkMode();
    }
    return isDarkMode;
}

console.log('✅ dark-mode module loaded');
