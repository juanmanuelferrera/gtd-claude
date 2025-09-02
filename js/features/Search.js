/**
 * Search Functionality for HyperFiler Pro
 * Handles task searching, filtering, and result display
 */

class SearchManager {
    constructor() {
        this.searchTerm = '';
        this.searchResults = [];
        this.debounceTimer = null;
        this.debounceDelay = 300;
        
        this.setupEventListeners();
    }

    /**
     * Setup search event listeners
     */
    setupEventListeners() {
        // Auto-focus search input when Search button is clicked
        document.addEventListener('click', (e) => {
            if (e.target.textContent?.includes('Search') || e.target.closest('[onclick*="showView(\'search\')"')) {
                setTimeout(() => {
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
            }
        });
    }

    /**
     * Perform search with debouncing
     */
    search(query, immediate = false) {
        this.searchTerm = query;
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        const performSearch = () => {
            this.searchResults = this.performSearch(query);
            this.renderSearchResults();
        };

        if (immediate) {
            performSearch();
        } else {
            this.debounceTimer = setTimeout(performSearch, this.debounceDelay);
        }
    }

    /**
     * Perform the actual search operation
     */
    performSearch(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        const tasks = window.tasks || [];
        
        return tasks.filter(task => {
            // Exclude deleted tasks from search
            if (task.status === 'deleted') return false;
            
            const title = (task.title || '').toLowerCase();
            const notes = (task.notes || '').toLowerCase();
            const dueDate = task.dueDate || '';
            const dueTime = task.dueTime || '';
            
            // Search in title, notes, date, and time
            return title.includes(searchTerm) ||
                   notes.includes(searchTerm) ||
                   dueDate.includes(searchTerm) ||
                   dueTime.includes(searchTerm);
        });
    }

    /**
     * Render search results
     */
    renderSearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (this.searchResults.length === 0) {
            if (this.searchTerm.trim().length > 0) {
                resultsContainer.innerHTML = `
                    <div class="no-results" style="text-align: center; color: #999; padding: 40px;">
                        <div style="font-size: 24px; margin-bottom: 12px;">🔍</div>
                        <div style="font-size: 16px; margin-bottom: 8px;">No tasks found</div>
                        <div style="font-size: 14px;">Try a different search term</div>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div class="search-prompt" style="text-align: center; color: #999; padding: 40px;">
                        <div style="font-size: 24px; margin-bottom: 12px;">🔍</div>
                        <div style="font-size: 16px;">Enter a search term above</div>
                    </div>
                `;
            }
            return;
        }

        // Group results by date and status
        const grouped = this.groupSearchResults(this.searchResults);
        
        let html = `<div class="search-summary" style="padding: 16px; background: #f8f9fa; border-radius: 8px; margin-bottom: 16px;">
            Found ${this.searchResults.length} task${this.searchResults.length !== 1 ? 's' : ''} matching "${this.searchTerm}"
        </div>`;

        // Render each group
        Object.keys(grouped).forEach(groupKey => {
            const group = grouped[groupKey];
            html += this.renderSearchGroup(group.title, group.tasks);
        });

        resultsContainer.innerHTML = html;
    }

    /**
     * Group search results for better organization
     */
    groupSearchResults(results) {
        const groups = {
            overdue: { title: '⚠️ Overdue Tasks', tasks: [] },
            today: { title: '📅 Today', tasks: [] },
            upcoming: { title: '📆 Upcoming', tasks: [] },
            events: { title: '🔴 Events', tasks: [] },
            completed: { title: '✅ Completed', tasks: [] },
            noDate: { title: '📝 No Date', tasks: [] }
        };

        const todayStr = DateUtils.getLocalDateString ? DateUtils.getLocalDateString(new Date()) : '';

        results.forEach(task => {
            if (task.status === 'completed') {
                groups.completed.tasks.push(task);
            } else if (task.isEvent) {
                groups.events.tasks.push(task);
            } else if (!task.dueDate) {
                groups.noDate.tasks.push(task);
            } else if (task.dueDate < todayStr) {
                groups.overdue.tasks.push(task);
            } else if (task.dueDate === todayStr) {
                groups.today.tasks.push(task);
            } else {
                groups.upcoming.tasks.push(task);
            }
        });

        // Filter out empty groups
        const filteredGroups = {};
        Object.keys(groups).forEach(key => {
            if (groups[key].tasks.length > 0) {
                filteredGroups[key] = groups[key];
            }
        });

        return filteredGroups;
    }

    /**
     * Render a search result group
     */
    renderSearchGroup(title, tasks) {
        let html = `
            <div class="search-group" style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; color: #333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                    ${title} (${tasks.length})
                </h4>
                <div class="search-group-tasks">
        `;

        tasks.forEach(task => {
            html += this.renderSearchResultTask(task);
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render individual search result task
     */
    renderSearchResultTask(task) {
        const isOverdue = TaskUtils.isOverdue && TaskUtils.isOverdue(task);
        const cardClass = `search-result-task ${task.status} ${isOverdue ? 'overdue' : ''} ${task.isEvent ? 'event' : ''}`;
        
        const dateDisplay = task.dueDate 
            ? (DateUtils.formatDateForDisplay ? DateUtils.formatDateForDisplay(task.dueDate) : task.dueDate)
            : 'No date';
            
        const timeDisplay = task.dueTime ? ` at ${task.dueTime}` : '';
        
        return `
            <div class="${cardClass}" 
                 data-task-id="${task.id}"
                 onclick="editTask('${task.id}')"
                 style="
                     border: 1px solid #ddd;
                     border-radius: 8px;
                     padding: 12px;
                     margin-bottom: 8px;
                     cursor: pointer;
                     transition: all 0.2s ease;
                     background: ${task.status === 'completed' ? '#f8f9fa' : 'white'};
                 "
                 onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
                 onmouseout="this.style.boxShadow='none'">
                
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <div class="task-title" style="font-weight: 500; color: ${task.status === 'completed' ? '#666' : '#333'}; margin-bottom: 4px;">
                            ${task.isEvent ? '🔴 ' : ''}${this.highlightSearchTerm(task.title, this.searchTerm)}
                            ${task.repeat && task.repeat !== 'none' ? ' <span style="color: #ffc107;">🔄</span>' : ''}
                        </div>
                        
                        ${task.notes ? `<div class="task-notes" style="color: #666; font-size: 13px; margin-bottom: 8px;">${this.highlightSearchTerm(task.notes.substring(0, 100) + (task.notes.length > 100 ? '...' : ''), this.searchTerm)}</div>` : ''}
                        
                        <div class="task-meta" style="display: flex; gap: 12px; font-size: 12px; color: #888;">
                            <span>📅 ${dateDisplay}${timeDisplay}</span>
                            ${task.status === 'completed' ? '<span style="color: #28a745;">✅ Completed</span>' : ''}
                            ${isOverdue ? '<span style="color: #dc3545;">⚠️ Overdue</span>' : ''}
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" 
                               class="task-checkbox" 
                               ${task.status === 'completed' ? 'checked' : ''} 
                               onclick="toggleTaskStatus('${task.id}', event)" 
                               style="cursor: pointer;">
                        <button onclick="deleteTask('${task.id}', event)" 
                                title="Delete task" 
                                style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Highlight search terms in text
     */
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</mark>');
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Clear search results
     */
    clear() {
        this.searchTerm = '';
        this.searchResults = [];
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.renderSearchResults();
    }

    /**
     * Get current search state
     */
    getState() {
        return {
            searchTerm: this.searchTerm,
            results: this.searchResults,
            hasResults: this.searchResults.length > 0
        };
    }
}

// Create global instance
window.searchManager = new SearchManager();

// Backward compatibility functions
window.performSearch = (query) => {
    window.searchManager.search(query, true);
};

window.clearSearch = () => {
    window.searchManager.clear();
};

// Auto-focus search input helper (referenced in UI)
window.focusSearchInput = () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}