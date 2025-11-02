// Undo/Redo Module
// State management for undo/redo functionality

/**
 * Create new undo manager
 * @param {number} maxSteps - Maximum undo steps to keep (default: 20)
 * @returns {Object} Undo manager instance
 */
export function createUndoManager(maxSteps = 20) {
    return {
        undoStack: [],
        redoStack: [],
        maxSteps: maxSteps
    };
}

/**
 * Save state to undo stack
 * @param {Object} manager - Undo manager instance
 * @param {Object} state - State to save
 * @param {string} action - Action description
 * @returns {Object} Updated manager
 */
export function saveState(manager, state, action = 'unknown') {
    // Deep clone the state
    const clonedState = JSON.parse(JSON.stringify(state));

    const stateEntry = {
        state: clonedState,
        action: action,
        timestamp: Date.now()
    };

    // Add to undo stack
    manager.undoStack.push(stateEntry);

    // Limit stack size
    if (manager.undoStack.length > manager.maxSteps) {
        manager.undoStack.shift();
    }

    // Clear redo stack when new action is performed
    manager.redoStack = [];

    return manager;
}

/**
 * Undo last action
 * @param {Object} manager - Undo manager instance
 * @param {Object} currentState - Current state
 * @returns {Object|null} Previous state or null if nothing to undo
 */
export function undo(manager, currentState) {
    if (manager.undoStack.length === 0) {
        return null;
    }

    // Pop current state from undo stack and move to redo stack
    const currentStateEntry = manager.undoStack.pop();
    manager.redoStack.push(currentStateEntry);

    // Limit redo stack
    if (manager.redoStack.length > manager.maxSteps) {
        manager.redoStack.shift();
    }

    // Get the new top of undo stack (the previous state) without popping
    if (manager.undoStack.length === 0) {
        return null;
    }

    const previousState = manager.undoStack[manager.undoStack.length - 1];

    return previousState ? previousState.state : null;
}

/**
 * Redo last undone action
 * @param {Object} manager - Undo manager instance
 * @param {Object} currentState - Current state
 * @returns {Object|null} Next state or null if nothing to redo
 */
export function redo(manager, currentState) {
    if (manager.redoStack.length === 0) {
        return null;
    }

    // Pop from redo stack and move back to undo stack
    const nextStateEntry = manager.redoStack.pop();
    manager.undoStack.push(nextStateEntry);

    // Return the state
    return nextStateEntry ? nextStateEntry.state : null;
}

/**
 * Check if undo is available
 * @param {Object} manager - Undo manager instance
 * @returns {boolean} True if can undo
 */
export function canUndo(manager) {
    return manager.undoStack.length > 0;
}

/**
 * Check if redo is available
 * @param {Object} manager - Undo manager instance
 * @returns {boolean} True if can redo
 */
export function canRedo(manager) {
    return manager.redoStack.length > 0;
}

/**
 * Get undo stack (read-only copy)
 * @param {Object} manager - Undo manager instance
 * @returns {Array} Copy of undo stack
 */
export function getUndoStack(manager) {
    return [...manager.undoStack];
}

/**
 * Get redo stack (read-only copy)
 * @param {Object} manager - Undo manager instance
 * @returns {Array} Copy of redo stack
 */
export function getRedoStack(manager) {
    return [...manager.redoStack];
}

/**
 * Clear undo stack
 * @param {Object} manager - Undo manager instance
 * @returns {Object} Updated manager
 */
export function clearUndoStack(manager) {
    manager.undoStack = [];
    return manager;
}

/**
 * Clear redo stack
 * @param {Object} manager - Undo manager instance
 * @returns {Object} Updated manager
 */
export function clearRedoStack(manager) {
    manager.redoStack = [];
    return manager;
}

/**
 * Clear both undo and redo stacks
 * @param {Object} manager - Undo manager instance
 * @returns {Object} Updated manager
 */
export function clearAllStacks(manager) {
    manager.undoStack = [];
    manager.redoStack = [];
    return manager;
}

/**
 * Set maximum undo steps
 * @param {Object} manager - Undo manager instance
 * @param {number} maxSteps - New maximum steps
 * @returns {Object} Updated manager
 */
export function setMaxUndoSteps(manager, maxSteps) {
    manager.maxSteps = maxSteps;

    // Trim stacks if needed
    while (manager.undoStack.length > maxSteps) {
        manager.undoStack.shift();
    }
    while (manager.redoStack.length > maxSteps) {
        manager.redoStack.shift();
    }

    return manager;
}

/**
 * Get undo history summary
 * @param {Object} manager - Undo manager instance
 * @returns {Object} History summary
 */
export function getUndoHistory(manager) {
    return {
        undoCount: manager.undoStack.length,
        redoCount: manager.redoStack.length,
        maxSteps: manager.maxSteps,
        canUndo: canUndo(manager),
        canRedo: canRedo(manager),
        recentActions: manager.undoStack.slice(-5).map(entry => ({
            action: entry.action,
            timestamp: entry.timestamp
        }))
    };
}

/**
 * Get specific state from undo stack
 * @param {Object} manager - Undo manager instance
 * @param {number} index - Index from end of stack (0 = most recent)
 * @returns {Object|null} State entry or null
 */
export function getUndoState(manager, index = 0) {
    if (index < 0 || index >= manager.undoStack.length) {
        return null;
    }

    const actualIndex = manager.undoStack.length - 1 - index;
    return manager.undoStack[actualIndex];
}

console.log('✅ undo module loaded');
