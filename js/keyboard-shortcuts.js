/**
 * Keyboard Shortcuts Help Modal for HyperFiler Pro
 * Compact layout with clickable shortcut buttons
 * Version: 2.0
 */

console.log('⌨️ Keyboard Shortcuts Help Modal loading - v2.0');

// Action map: key label -> function to execute on click
const SHORTCUT_ACTIONS = {
    'T': () => { if (window.showView) window.showView('today'); },
    'W': () => { if (window.showView) window.showView('week'); },
    'M': () => { if (window.showView) window.showView('calendar'); },
    'S': () => { if (window.showView) window.showView('all'); },
    'L': () => { if (window.showView) window.showView('lists'); },
    'R': () => { if (window.showView) window.showView('repeat'); },
    'U': () => { if (window.showView) window.showView('recent-actions'); },
    'X': () => { if (window.showView) window.showView('settings'); },
    'N': () => { if (window.openAddTaskModal) window.openAddTaskModal(); },
    'P': () => { if (window.activateTemplateSelector) window.activateTemplateSelector(); },
    'Q': () => { if (window.quickBackupJSON) window.quickBackupJSON(); },
    'I': () => { if (window.importTasks) window.importTasks(); },
    'Ctrl+Z': () => { if (window.performUndo) window.performUndo(); }
};

// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = {
    navigation: {
        title: '🧭 Navigation',
        shortcuts: [
            { keys: ['T'], description: 'Today' },
            { keys: ['W'], description: 'Week' },
            { keys: ['M'], description: 'Month' },
            { keys: ['S'], description: 'Search / All' },
            { keys: ['L'], description: 'Lists' },
            { keys: ['R'], description: 'Repeat' },
            { keys: ['U'], description: 'Registry' },
            { keys: ['X'], description: 'Settings' }
        ]
    },
    taskActions: {
        title: '✅ Task Actions',
        shortcuts: [
            { keys: ['↑', '↓'], description: 'Select task' },
            { keys: ['Enter'], description: 'Edit task' },
            { keys: ['Space'], description: 'Batch select' },
            { keys: ['C'], description: 'Copy task' },
            { keys: ['D'], description: 'Delete' },
            { keys: ['F'], description: 'Set date' },
            { keys: ['G'], description: 'Set time' },
            { keys: ['1'], description: '+1 day' },
            { keys: ['7'], description: '+1 week' },
            { keys: ['3'], description: '+1 month' }
        ]
    },
    other: {
        title: '⌨️ Other',
        shortcuts: [
            { keys: ['N'], description: 'New task' },
            { keys: ['Q'], description: 'Quick backup' },
            { keys: ['I'], description: 'Import' },
            { keys: ['P'], description: 'Templates' },
            { keys: ['←', '→'], description: 'Date nav' },
            { keys: ['Ctrl+Z'], description: 'Revert last' },
            { keys: ['?'], description: 'This help' },
            { keys: ['Esc'], description: 'Close / Clear' }
        ]
    }
};

let shortcutsOverlay = null;
let isShortcutsModalOpen = false;

/**
 * Execute shortcut action and close modal
 */
function executeShortcutAction(keyLabel) {
    const action = SHORTCUT_ACTIONS[keyLabel];
    if (action) {
        closeKeyboardShortcutsModal();
        setTimeout(() => action(), 50);
    }
}

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
                const hasAction = SHORTCUT_ACTIONS[key];
                const clickAttr = hasAction
                    ? `onclick="executeShortcutAction('${key}')" style="cursor:pointer;" title="Click to activate"`
                    : '';
                const clickClass = hasAction ? ' keyboard-key-clickable' : '';
                return `<kbd class="keyboard-key${clickClass}" ${clickAttr}>${key}</kbd>`;
            }).join('');

            return `<div class="keyboard-shortcut-item">
                    <div class="keyboard-shortcut-keys">${keysHTML}</div>
                    <span class="keyboard-shortcut-label">${shortcut.description}</span>
                </div>`;
        }).join('');

        sectionsHTML += `
            <div class="keyboard-shortcuts-section">
                <h3 class="keyboard-shortcuts-section-title">${section.title}</h3>
                <div class="keyboard-shortcuts-list">${shortcutsHTML}</div>
            </div>`;
    });

    overlay.innerHTML = `
        <div class="keyboard-shortcuts-modal">
            <div class="keyboard-shortcuts-header">
                <h2 id="shortcuts-modal-title">⌨️ Shortcuts</h2>
                <button class="keyboard-shortcuts-close" onclick="closeKeyboardShortcutsModal()" aria-label="Close">×</button>
            </div>
            <div class="keyboard-shortcuts-content">${sectionsHTML}</div>
            <div class="keyboard-shortcuts-footer">
                <p><strong>?</strong> show help • <strong>Esc</strong> close • clickable keys execute the action</p>
            </div>
        </div>`;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeKeyboardShortcutsModal();
    });

    const modal = overlay.querySelector('.keyboard-shortcuts-modal');
    modal.addEventListener('click', (e) => { e.stopPropagation(); });

    return overlay;
}

/**
 * Show keyboard shortcuts modal
 */
function showKeyboardShortcutsModal() {
    if (isShortcutsModalOpen) return;

    // Always recreate to pick up latest shortcuts
    if (shortcutsOverlay && shortcutsOverlay.parentNode) {
        shortcutsOverlay.parentNode.removeChild(shortcutsOverlay);
    }
    shortcutsOverlay = createKeyboardShortcutsModal();
    document.body.appendChild(shortcutsOverlay);

    shortcutsOverlay.classList.add('active');
    isShortcutsModalOpen = true;

    const closeButton = shortcutsOverlay.querySelector('.keyboard-shortcuts-close');
    setTimeout(() => { if (closeButton) closeButton.focus(); }, 100);
}

/**
 * Close keyboard shortcuts modal
 */
function closeKeyboardShortcutsModal() {
    if (!isShortcutsModalOpen || !shortcutsOverlay) return;
    shortcutsOverlay.classList.remove('active');
    isShortcutsModalOpen = false;
}

/**
 * Toggle keyboard shortcuts modal
 */
function toggleKeyboardShortcutsModal() {
    if (isShortcutsModalOpen) closeKeyboardShortcutsModal();
    else showKeyboardShortcutsModal();
}

/**
 * Initialize keyboard shortcuts help system
 */
function initializeKeyboardShortcutsHelp() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '?' && !isShortcutsModalOpen) {
            e.preventDefault();
            showKeyboardShortcutsModal();
        }
        if (e.key === 'Escape' && isShortcutsModalOpen) {
            e.preventDefault();
            closeKeyboardShortcutsModal();
        }
    });
}

// Make functions globally available
window.showKeyboardShortcutsModal = showKeyboardShortcutsModal;
window.closeKeyboardShortcutsModal = closeKeyboardShortcutsModal;
window.toggleKeyboardShortcutsModal = toggleKeyboardShortcutsModal;
window.executeShortcutAction = executeShortcutAction;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKeyboardShortcutsHelp);
} else {
    initializeKeyboardShortcutsHelp();
}
