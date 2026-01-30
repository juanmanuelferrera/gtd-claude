/**
 * Keyboard Shortcuts Help Modal for HyperFiler Pro
 * Shows all available keyboard shortcuts when user presses "?"
 * Version: 1.0
 */

console.log('⌨️ Keyboard Shortcuts Help Modal loading - v1.0');

// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = {
    navigation: {
        title: '🧭 Navigation',
        shortcuts: [
            { keys: ['T'], description: 'Go to Today view' },
            { keys: ['W'], description: 'Go to Week view' },
            { keys: ['M'], description: 'Go to Month (Calendar) view' },
            { keys: ['S'], description: 'Go to Search/All tasks view' },
            { keys: ['L'], description: 'Go to Lists view' },
            { keys: ['R'], description: 'Go to Repeat tasks view' },
            { keys: ['U'], description: 'Go to Undo/Recent actions view' },
            { keys: ['X'], description: 'Go to Settings view' },
            { keys: ['/'], description: 'Go to Search view' }
        ]
    },
    dateNavigation: {
        title: '📅 Date Navigation',
        shortcuts: [
            { keys: ['←'], description: 'Previous day/week/month' },
            { keys: ['→'], description: 'Next day/week/month' }
        ]
    },
    templates: {
        title: '🏷️ Template Filters',
        shortcuts: [
            { keys: ['P'], description: 'Toggle template selector' },
            { keys: ['←', '→'], description: 'Navigate between templates (when active)' },
            { keys: ['Enter'], description: 'Apply selected template filter' },
            { keys: ['Esc'], description: 'Exit template navigation' }
        ]
    },
    taskActions: {
        title: '✅ Task Actions',
        shortcuts: [
            { keys: ['↑'], description: 'Select previous task' },
            { keys: ['↓'], description: 'Select next task' },
            { keys: ['Enter'], description: 'Edit selected task' },
            { keys: ['Space'], description: 'Toggle task selection (batch)' },
            { keys: ['C'], description: 'Complete/uncomplete selected task' },
            { keys: ['D'], description: 'Delete selected task' },
            { keys: ['1'], description: 'Delay selected task +1 day' },
            { keys: ['7'], description: 'Delay selected task +1 week' },
            { keys: ['3'], description: 'Delay selected task +1 month' }
        ]
    },
    ctrlShortcuts: {
        title: '⌨️ Ctrl Shortcuts',
        shortcuts: [
            { keys: ['Ctrl+N'], description: 'New task' },
            { keys: ['Ctrl+K'], description: 'Toggle keyboard-only mode' },
            { keys: ['Ctrl+Z'], description: 'Undo' },
            { keys: ['Ctrl+J'], description: 'Time dropdown for selected task' },
            { keys: ['Ctrl+F'], description: 'Filter navigation' },
            { keys: ['Ctrl+S'], description: 'Focus search' },
            { keys: ['Ctrl+B'], description: 'Emergency backup' },
            { keys: ['Ctrl+E'], description: 'Export as text' }
        ]
    },
    general: {
        title: '⚙️ General',
        shortcuts: [
            { keys: ['?'], description: 'Show this help modal' },
            { keys: ['Esc'], description: 'Close modals / clear selection' }
        ]
    }
};

let shortcutsOverlay = null;
let isShortcutsModalOpen = false;

/**
 * Create keyboard shortcuts modal HTML
 */
function createKeyboardShortcutsModal() {
    const overlay = document.createElement('div');
    overlay.className = 'keyboard-shortcuts-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'shortcuts-modal-title');

    let sectionsHTML = '';

    Object.keys(KEYBOARD_SHORTCUTS).forEach(sectionKey => {
        const section = KEYBOARD_SHORTCUTS[sectionKey];

        const shortcutsHTML = section.shortcuts.map(shortcut => {
            const keysHTML = shortcut.keys.map(key => {
                // Special handling for arrow keys
                const displayKey = key === '←' ? '←' :
                                  key === '→' ? '→' :
                                  key === '↑' ? '↑' :
                                  key === '↓' ? '↓' :
                                  key === 'Esc' ? 'Esc' :
                                  key === 'Enter' ? 'Enter' :
                                  key;

                return `<kbd class="keyboard-key">${displayKey}</kbd>`;
            }).join('<span class="keyboard-key-separator">or</span>');

            return `
                <div class="keyboard-shortcut-item">
                    <span class="keyboard-shortcut-label">${shortcut.description}</span>
                    <div class="keyboard-shortcut-keys">
                        ${keysHTML}
                    </div>
                </div>
            `;
        }).join('');

        sectionsHTML += `
            <div class="keyboard-shortcuts-section">
                <h3 class="keyboard-shortcuts-section-title">${section.title}</h3>
                <div class="keyboard-shortcuts-list">
                    ${shortcutsHTML}
                </div>
            </div>
        `;
    });

    overlay.innerHTML = `
        <div class="keyboard-shortcuts-modal">
            <div class="keyboard-shortcuts-header">
                <h2 id="shortcuts-modal-title">
                    <span>⌨️</span>
                    <span>Keyboard Shortcuts</span>
                </h2>
                <button class="keyboard-shortcuts-close" onclick="closeKeyboardShortcutsModal()" aria-label="Close keyboard shortcuts help">
                    ×
                </button>
            </div>

            <div class="keyboard-shortcuts-content">
                ${sectionsHTML}
            </div>

            <div class="keyboard-shortcuts-footer">
                <p>Press <strong>?</strong> anytime to show this help • Press <strong>Esc</strong> to close</p>
            </div>
        </div>
    `;

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeKeyboardShortcutsModal();
        }
    });

    // Prevent clicks inside modal from closing
    const modal = overlay.querySelector('.keyboard-shortcuts-modal');
    modal.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    return overlay;
}

/**
 * Show keyboard shortcuts modal
 */
function showKeyboardShortcutsModal() {
    if (isShortcutsModalOpen) return;

    if (!shortcutsOverlay) {
        shortcutsOverlay = createKeyboardShortcutsModal();
        document.body.appendChild(shortcutsOverlay);
    }

    shortcutsOverlay.classList.add('active');
    isShortcutsModalOpen = true;

    // Focus trap - move focus to close button
    const closeButton = shortcutsOverlay.querySelector('.keyboard-shortcuts-close');
    setTimeout(() => {
        if (closeButton) closeButton.focus();
    }, 100);

    console.log('⌨️ Keyboard shortcuts modal opened');
}

/**
 * Close keyboard shortcuts modal
 */
function closeKeyboardShortcutsModal() {
    if (!isShortcutsModalOpen || !shortcutsOverlay) return;

    shortcutsOverlay.classList.remove('active');
    isShortcutsModalOpen = false;

    console.log('⌨️ Keyboard shortcuts modal closed');
}

/**
 * Toggle keyboard shortcuts modal
 */
function toggleKeyboardShortcutsModal() {
    if (isShortcutsModalOpen) {
        closeKeyboardShortcutsModal();
    } else {
        showKeyboardShortcutsModal();
    }
}

/**
 * Initialize keyboard shortcuts help system
 */
function initializeKeyboardShortcutsHelp() {
    console.log('🚀 Initializing keyboard shortcuts help system...');

    // Listen for ? key to show help
    document.addEventListener('keydown', (e) => {
        // Check if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Handle ? key (Shift + /)
        if (e.key === '?' && !isShortcutsModalOpen) {
            e.preventDefault();
            showKeyboardShortcutsModal();
        }

        // Handle Escape key to close modal
        if (e.key === 'Escape' && isShortcutsModalOpen) {
            e.preventDefault();
            closeKeyboardShortcutsModal();
        }
    });

    console.log('✅ Keyboard shortcuts help system initialized');
    console.log('💡 Press ? to see all keyboard shortcuts');
}

// Make functions globally available
window.showKeyboardShortcutsModal = showKeyboardShortcutsModal;
window.closeKeyboardShortcutsModal = closeKeyboardShortcutsModal;
window.toggleKeyboardShortcutsModal = toggleKeyboardShortcutsModal;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKeyboardShortcutsHelp);
} else {
    initializeKeyboardShortcutsHelp();
}

console.log('✅ Keyboard Shortcuts Help Modal ready');
