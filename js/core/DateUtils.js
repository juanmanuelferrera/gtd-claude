/**
 * Date Utilities for HyperFiler Pro
 * Centralized date formatting, navigation, and calculation functions
 */

class DateUtils {
    /**
     * Get local date string consistently (avoids timezone issues)
     */
    static getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Format date for display with relative terms
     */
    static formatDateForDisplay(dateStr) {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        
        if (dateStr === this.getLocalDateString(today)) {
            return 'Today';
        } else if (dateStr === this.getLocalDateString(tomorrow)) {
            return 'Tomorrow';
        } else if (dateStr === this.getLocalDateString(yesterday)) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }

    /**
     * Format date for shorter display
     */
    static formatDate(dateStr) {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format time string
     */
    static formatTime(timeStr) {
        if (!timeStr) return '';
        return timeStr; // Display in 24-hour format
    }

    /**
     * Get week start day from user preferences (0=Sunday, 1=Monday)
     */
    static getWeekStartDay() {
        const saved = localStorage.getItem('weekStartDay');
        return saved !== null ? parseInt(saved) : 1; // Default to Monday (1)
    }

    /**
     * Get start of the week for a given date based on user preference
     */
    static getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const weekStartDay = this.getWeekStartDay();
        
        let diff;
        if (weekStartDay === 0) { // Sunday start
            diff = day; // Days since Sunday
        } else { // Monday start
            diff = day === 0 ? 6 : day - 1; // Days since Monday
        }
        
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - diff);
        return weekStart;
    }

    /**
     * Get Monday of the week for a given date (legacy compatibility)
     */
    static getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    }

    /**
     * Get date range for a week based on user preference
     */
    static getWeekRange(baseDate) {
        const weekStart = this.getWeekStart(baseDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { start: weekStart, end: weekEnd };
    }

    /**
     * Get date range for a month
     */
    static getMonthRange(baseDate) {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return { start: firstDay, end: lastDay, year, month };
    }

    /**
     * Check if a date is today
     */
    static isToday(dateStr) {
        return dateStr === this.getLocalDateString(new Date());
    }

    /**
     * Check if a date is in the past
     */
    static isPast(dateStr) {
        if (!dateStr) return false;
        return dateStr < this.getLocalDateString(new Date());
    }

    /**
     * Check if a date is overdue (past and task is pending)
     */
    static isOverdue(task) {
        return this.isPast(task.dueDate) && task.status === 'pending' && !task.isEvent;
    }

    /**
     * Get calendar grid dates for a month view
     */
    static getCalendarDates(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        
        // Adjust for Monday-first week
        const dayOfWeek = firstDay.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToSubtract);

        const dates = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push({
                date: new Date(date),
                dateStr: this.getLocalDateString(date),
                isCurrentMonth: date.getMonth() === month,
                isToday: this.isToday(this.getLocalDateString(date))
            });
        }

        return dates;
    }

    /**
     * Navigation helper functions
     */
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static addWeeks(date, weeks) {
        return this.addDays(date, weeks * 7);
    }

    static addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    /**
     * Get day names for locale
     */
    static getDayNames() {
        return [
            typeof translateText === 'function' ? translateText('Monday') : 'Monday', 
            typeof translateText === 'function' ? translateText('Tuesday') : 'Tuesday', 
            typeof translateText === 'function' ? translateText('Wednesday') : 'Wednesday', 
            typeof translateText === 'function' ? translateText('Thursday') : 'Thursday', 
            typeof translateText === 'function' ? translateText('Friday') : 'Friday', 
            typeof translateText === 'function' ? translateText('Saturday') : 'Saturday', 
            typeof translateText === 'function' ? translateText('Sunday') : 'Sunday'
        ];
    }

    /**
     * Get short day names for locale
     */
    static getShortDayNames() {
        return [
            typeof translateText === 'function' ? translateText('Monday').substring(0, 3) : 'Mon', 
            typeof translateText === 'function' ? translateText('Tuesday').substring(0, 3) : 'Tue', 
            typeof translateText === 'function' ? translateText('Wednesday').substring(0, 3) : 'Wed', 
            typeof translateText === 'function' ? translateText('Thursday').substring(0, 3) : 'Thu', 
            typeof translateText === 'function' ? translateText('Friday').substring(0, 3) : 'Fri', 
            typeof translateText === 'function' ? translateText('Saturday').substring(0, 3) : 'Sat', 
            typeof translateText === 'function' ? translateText('Sunday').substring(0, 3) : 'Sun'
        ];
    }
}

// Make available globally for backward compatibility  
window.DateUtils = DateUtils;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
}