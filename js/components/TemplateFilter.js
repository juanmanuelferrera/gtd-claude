/**
 * Template Filter Component for HyperFiler Pro
 * Reusable template filtering UI for all views
 */

class TemplateFilter {
    constructor(containerId, viewType, options = {}) {
        this.containerId = containerId;
        this.viewType = viewType;
        this.options = {
            includeToggleAll: false,
            ...options
        };
        
        this.container = document.getElementById(containerId);
        this.activeFilter = null;
        
        // Bind methods
        this.render = this.render.bind(this);
        this.filterByTemplate = this.filterByTemplate.bind(this);
        this.clearFilter = this.clearFilter.bind(this);
    }

    /**
     * Render template filters for given tasks
     */
    render(tasks) {
        if (!this.container) return;

        const templates = TemplateProcessor.extractFromTasks(tasks);
        if (templates.length === 0) {
            this.container.innerHTML = '';
            return;
        }

        let html = '';

        // Add toggle all button only for Today view
        if (this.options.includeToggleAll) {
            html += this.createToggleAllButton();
        }

        // Add template filter buttons
        templates.forEach(template => {
            const isActive = this.activeFilter === template;
            html += this.createTemplateButton(template, isActive);
        });

        // Add clear filter button if filter is active
        if (this.activeFilter) {
            html += this.createClearButton();
        }

        this.container.innerHTML = html;
    }

    /**
     * Create toggle all time slots button
     */
    createToggleAllButton() {
        return `
            <button onclick="toggleAllTimeSlots()" title="Toggle all time slots" style="
                background: #007AFF; 
                color: white; 
                border: 1px solid #007AFF; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 11px; 
                cursor: pointer;
                margin-right: 8px;
            ">⏰ Toggle All</button>
        `;
    }

    /**
     * Create template filter button
     */
    createTemplateButton(template, isActive) {
        const handlerName = `filter${this.viewType.charAt(0).toUpperCase() + this.viewType.slice(1)}ByTemplate`;
        const buttonClass = isActive ? 'filter-btn active' : 'filter-btn';
        const title = `Filter tasks by template: ${template}`;
        
        return `
            <button class="${buttonClass}" 
                    onclick="${handlerName}('${template}')" 
                    title="${title}" 
                    style="
                        background: ${isActive ? '#007bff' : 'transparent'}; 
                        color: ${isActive ? 'white' : '#007bff'}; 
                        border: 1px solid #007bff; 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        font-size: 11px; 
                        cursor: pointer;
                        margin-right: 4px;
                    ">${template}</button>
        `;
    }

    /**
     * Create clear filter button
     */
    createClearButton() {
        const handlerName = `clear${this.viewType.charAt(0).toUpperCase() + this.viewType.slice(1)}TemplateFilter`;
        
        return `
            <button class="filter-btn filter-clear" 
                    onclick="${handlerName}()" 
                    title="Clear template filter" 
                    style="
                        background: #dc3545; 
                        color: white; 
                        border: 1px solid #dc3545; 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        font-size: 11px; 
                        cursor: pointer;
                        margin-left: 4px;
                    ">✖ Clear</button>
        `;
    }

    /**
     * Filter by template
     */
    filterByTemplate(template) {
        this.activeFilter = template;
        
        // Update global state for backward compatibility
        const filterKey = `active${this.viewType.charAt(0).toUpperCase() + this.viewType.slice(1)}TemplateFilter`;
        window[filterKey] = template;
        
        if (window.appState) {
            const filters = { ...window.appState.get('filters') };
            filters[filterKey] = template;
            window.appState.setState({ filters });
        }
        
        // Re-render the view
        this.refreshView();
    }

    /**
     * Clear template filter
     */
    clearFilter() {
        this.activeFilter = null;
        
        // Update global state for backward compatibility
        const filterKey = `active${this.viewType.charAt(0).toUpperCase() + this.viewType.slice(1)}TemplateFilter`;
        window[filterKey] = null;
        
        if (window.appState) {
            const filters = { ...window.appState.get('filters') };
            filters[filterKey] = null;
            window.appState.setState({ filters });
        }
        
        // Re-render the view
        this.refreshView();
    }

    /**
     * Refresh the current view
     */
    refreshView() {
        switch (this.viewType) {
            case 'today':
                if (typeof renderTodayView === 'function') renderTodayView();
                break;
            case 'week':
                if (typeof renderWeekView === 'function') renderWeekView();
                break;
            case 'month':
            case 'calendar':
                if (typeof renderCalendar === 'function') renderCalendar();
                break;
            case 'allTasks':
                if (typeof renderAllTasksView === 'function') renderAllTasksView();
                break;
        }
    }

    /**
     * Update active filter from global state
     */
    syncActiveFilter() {
        const filterKey = `active${this.viewType.charAt(0).toUpperCase() + this.viewType.slice(1)}TemplateFilter`;
        this.activeFilter = window[filterKey] || null;
    }
}

// Create factory function for easy instantiation
window.createTemplateFilter = (containerId, viewType, options = {}) => {
    return new TemplateFilter(containerId, viewType, options);
};

// Create global instances for backward compatibility
window.templateFilters = {
    today: null,
    week: null,
    month: null,
    allTasks: null
};

// Initialize template filters when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // These will be initialized when the views are first shown
    if (document.getElementById('todayTemplateFilters')) {
        window.templateFilters.today = new TemplateFilter('todayTemplateFilters', 'today', { includeToggleAll: true });
    }
    if (document.getElementById('weekTemplateFilters')) {
        window.templateFilters.week = new TemplateFilter('weekTemplateFilters', 'week');
    }
    if (document.getElementById('monthTemplateFilters')) {
        window.templateFilters.month = new TemplateFilter('monthTemplateFilters', 'month');
    }
    if (document.getElementById('allTasksTemplateFilters')) {
        window.templateFilters.allTasks = new TemplateFilter('allTasksTemplateFilters', 'allTasks');
    }
});

// Note: Template filter functions are handled by existing missing-functions.js
// This component provides the TemplateFilter class for future enhancements

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateFilter;
}