/**
 * Dark Mode Support for HyperFiler Pro
 * Provides automatic system preference detection + manual toggle
 * Version: 1.0
 */

console.log('🌙 Dark Mode System loading - v1.0');

// Dark mode state
let isDarkMode = false;
let toggleButton = null;

/**
 * Initialize dark mode based on saved preference or system preference
 */
function initializeDarkMode() {
    console.log('🌙 Initializing dark mode...');

    // Check for saved user preference
    const savedMode = localStorage.getItem('darkMode');

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Priority: saved preference > system preference
    if (savedMode !== null) {
        // User has explicitly chosen a mode
        isDarkMode = savedMode === 'true';
        console.log('🌙 Using saved preference:', isDarkMode ? 'dark' : 'light');
    } else if (prefersDark) {
        // Use system preference
        isDarkMode = true;
        console.log('🌙 Using system preference: dark');
    } else {
        isDarkMode = false;
        console.log('🌙 Using system preference: light');
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
}

/**
 * Apply dark mode by adding/removing class
 */
function applyDarkMode(dark) {
    if (dark) {
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    isDarkMode = !isDarkMode;

    // Save preference
    localStorage.setItem('darkMode', isDarkMode.toString());

    // Apply mode
    applyDarkMode(isDarkMode);

    // Update button
    updateToggleButton();

    // Show toast notification
    if (window.toast) {
        toast.success(
            isDarkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️',
            null,
            { duration: 2000 }
        );
    }

    console.log('🌙 Dark mode toggled:', isDarkMode ? 'dark' : 'light');
}

/**
 * Reset to system preference
 */
function resetToSystemPreference() {
    localStorage.removeItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode = prefersDark;
    applyDarkMode(isDarkMode);
    updateToggleButton();

    if (window.toast) {
        toast.info('Using system preference', null, { duration: 2000 });
    }

    console.log('🌙 Reset to system preference:', isDarkMode ? 'dark' : 'light');
}

/**
 * Create toggle button
 */
function createToggleButton() {
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
}

/**
 * Update toggle button text/icon
 */
function updateToggleButton() {
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
 */
function getDarkModeState() {
    return {
        isDarkMode: isDarkMode,
        isSystemPreference: localStorage.getItem('darkMode') === null,
        systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    };
}

// Make functions globally available
window.toggleDarkMode = toggleDarkMode;
window.resetToSystemPreference = resetToSystemPreference;
window.getDarkModeState = getDarkModeState;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDarkMode);
} else {
    initializeDarkMode();
}

console.log('✅ Dark Mode System ready');
console.log('💡 Click toggle button to switch modes');
console.log('💡 Double-click toggle button to reset to system preference');
