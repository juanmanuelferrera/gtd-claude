/**
 * Template Processing Utilities for HyperFiler Pro
 * Handles template extraction, filtering, and UI generation
 */

class TemplateProcessor {
    /**
     * Extract templates from text content
     */
    static extractFromText(text) {
        if (!text) return [];
        const templateMatches = text.match(/@\w+/g);
        return templateMatches ? templateMatches : [];
    }

    /**
     * Extract templates from an array of tasks
     */
    static extractFromTasks(tasks) {
        const templates = new Set();
        tasks.forEach(task => {
            const text = `${task.title || ''} ${task.notes || ''}`;
            const templateMatches = this.extractFromText(text);
            if (templateMatches) {
                templateMatches.forEach(template => templates.add(template));
            }
        });
        return Array.from(templates).sort();
    }

    /**
     * Check if a task matches a template filter
     */
    static taskMatchesTemplate(task, template) {
        if (!template) return true;
        const text = `${task.title || ''} ${task.notes || ''}`;
        return text.includes(template);
    }

    /**
     * Filter tasks by template
     */
    static filterTasksByTemplate(tasks, template) {
        if (!template) return tasks;
        return tasks.filter(task => this.taskMatchesTemplate(task, template));
    }

    /**
     * Create template filter button HTML
     */
    static createFilterButton(template, isActive, clickHandler, options = {}) {
        const buttonClass = isActive ? 'filter-btn active' : 'filter-btn';
        const title = options.title || `Filter tasks by template: ${template}`;
        const style = options.style || `
            background: ${isActive ? '#007bff' : 'transparent'}; 
            color: ${isActive ? 'white' : '#007bff'}; 
            border: 1px solid #007bff; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            cursor: pointer;
            margin-right: 4px;
        `;

        return `<button class="${buttonClass}" onclick="${clickHandler}('${template}')" title="${title}" style="${style}">${template}</button>`;
    }

    /**
     * Create clear filter button HTML
     */
    static createClearButton(clickHandler, options = {}) {
        const title = options.title || 'Clear template filter';
        const style = options.style || `
            background: #dc3545; 
            color: white; 
            border: 1px solid #dc3545; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            cursor: pointer;
            margin-left: 4px;
        `;

        return `<button class="filter-btn filter-clear" onclick="${clickHandler}()" title="${title}" style="${style}">✖ Clear</button>`;
    }

    /**
     * Render complete template filter UI for a view
     */
    static renderTemplateFilters(containerElement, tasks, activeFilter, filterHandler, clearHandler, options = {}) {
        if (!containerElement) return;

        const templates = this.extractFromTasks(tasks);
        if (templates.length === 0) {
            containerElement.innerHTML = '';
            return;
        }

        let html = '';

        // Add toggle all button only for Today view
        if (options.includeToggleAll) {
            html += `<button onclick="toggleAllTimeSlots()" title="Toggle all time slots" style="
                background: #007AFF; 
                color: white; 
                border: 1px solid #007AFF; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 11px; 
                cursor: pointer;
                margin-right: 8px;
            ">⏰ Toggle All</button>`;
        }

        // Add template filter buttons
        templates.forEach(template => {
            const isActive = activeFilter === template;
            html += this.createFilterButton(template, isActive, filterHandler, options);
        });

        // Add clear filter button if filter is active
        if (activeFilter) {
            html += this.createClearButton(clearHandler, options);
        }

        containerElement.innerHTML = html;
    }

    /**
     * Get filtered tasks for a specific view
     */
    static getFilteredTasks(tasks, filter, additionalFilters = {}) {
        let filtered = [...tasks];

        // Apply template filter
        if (filter) {
            filtered = this.filterTasksByTemplate(filtered, filter);
        }

        // Apply additional filters
        if (additionalFilters.excludeDeleted !== false) {
            filtered = filtered.filter(task => task.status !== 'deleted');
        }

        if (additionalFilters.dateRange) {
            const { start, end } = additionalFilters.dateRange;
            filtered = filtered.filter(task => {
                if (!task.dueDate) return false;
                return task.dueDate >= start && task.dueDate <= end;
            });
        }

        if (additionalFilters.specificDate) {
            filtered = filtered.filter(task => task.dueDate === additionalFilters.specificDate);
        }

        return filtered;
    }
}

// Make available globally for backward compatibility
window.TemplateProcessor = TemplateProcessor;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateProcessor;
}