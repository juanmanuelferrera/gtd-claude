/**
 * Centralized State Management for HyperFiler Pro
 * Manages application state and notifies components of changes
 */

class StateManager {
    constructor() {
        this.state = {
            currentView: 'today',
            currentTodayDate: new Date(),
            currentWeekDate: new Date(),
            currentCalendarDate: new Date(),
            tasks: [],
            filters: {
                activetodayTemplateFilter: null,
                activeWeekTemplateFilter: null,
                activeMonthTemplateFilter: null,
                activeAllTasksTemplateFilter: null
            },
            ui: {
                loading: false,
                mobileMoreMenuOpen: false
            },
            draggedTask: null
        };
        
        this.listeners = new Map();
        this.initializeFromGlobals();
    }

    /**
     * Initialize state from existing global variables
     */
    initializeFromGlobals() {
        if (typeof window.currentView !== 'undefined') {
            this.state.currentView = window.currentView;
        }
        if (typeof window.tasks !== 'undefined') {
            this.state.tasks = window.tasks;
        }
        if (typeof window.currentTodayDate !== 'undefined') {
            this.state.currentTodayDate = window.currentTodayDate;
        }
        if (typeof window.currentWeekDate !== 'undefined') {
            this.state.currentWeekDate = window.currentWeekDate;
        }
        if (typeof window.currentCalendarDate !== 'undefined') {
            this.state.currentCalendarDate = window.currentCalendarDate;
        }
        
        // Sync filters
        this.state.filters.activeodayTemplateFilter = window.activeTodayTemplateFilter || null;
        this.state.filters.activeWeekTemplateFilter = window.activeWeekTemplateFilter || null;
        this.state.filters.activeMonthTemplateFilter = window.activeMonthTemplateFilter || null;
        this.state.filters.activeAllTasksTemplateFilter = window.activeAllTasksTemplateFilter || null;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Update state and notify listeners
     */
    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Keep global variables in sync for backward compatibility
        this.syncToGlobals(updates);
        
        this.notifyListeners(prevState);
    }

    /**
     * Sync state back to global variables for compatibility
     */
    syncToGlobals(updates) {
        if ('currentView' in updates) {
            window.currentView = this.state.currentView;
        }
        if ('currentTodayDate' in updates) {
            window.currentTodayDate = this.state.currentTodayDate;
        }
        if ('currentWeekDate' in updates) {
            window.currentWeekDate = this.state.currentWeekDate;
        }
        if ('currentCalendarDate' in updates) {
            window.currentCalendarDate = this.state.currentCalendarDate;
        }
        if ('tasks' in updates) {
            window.tasks = this.state.tasks;
        }
        if ('draggedTask' in updates) {
            window.draggedTask = this.state.draggedTask;
        }
        
        // Sync filters
        if (updates.filters) {
            window.activeTodayTemplateFilter = this.state.filters.activeTodayTemplateFilter;
            window.activeWeekTemplateFilter = this.state.filters.activeWeekTemplateFilter;
            window.activeMonthTemplateFilter = this.state.filters.activeMonthTemplateFilter;
            window.activeAllTasksTemplateFilter = this.state.filters.activeAllTasksTemplateFilter;
        }
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get specific state value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Notify listeners of state changes
     */
    notifyListeners(prevState) {
        for (const [key, callbacks] of this.listeners) {
            if (this.hasChanged(key, prevState)) {
                const currentValue = this.get(key);
                const previousValue = prevState[key];
                callbacks.forEach(callback => {
                    try {
                        callback(currentValue, previousValue);
                    } catch (error) {
                        console.error('Error in state listener:', error);
                    }
                });
            }
        }
    }

    /**
     * Check if a state value has changed
     */
    hasChanged(key, prevState) {
        return JSON.stringify(this.state[key]) !== JSON.stringify(prevState[key]);
    }

    /**
     * Update tasks array
     */
    updateTasks(tasks) {
        this.setState({ tasks });
    }

    /**
     * Update filter state
     */
    updateFilter(filterType, value) {
        const filters = { ...this.state.filters };
        filters[filterType] = value;
        this.setState({ filters });
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        const filters = {
            activeTodayTemplateFilter: null,
            activeWeekTemplateFilter: null,
            activeMonthTemplateFilter: null,
            activeAllTasksTemplateFilter: null
        };
        this.setState({ filters });
    }
}

// Create global instance for backward compatibility
window.appState = new StateManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}