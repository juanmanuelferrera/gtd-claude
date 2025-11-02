// Natural Language Processing Module
// Parses natural language input into structured task data

// Import dependencies from other modules
// Note: getLocalDateString is available globally via main.js

/**
 * Get date string for relative dates (today, tomorrow)
 * @param {string} relative - Relative date keyword
 * @returns {string|null} Date string in YYYY-MM-DD format
 */
export function getDateForRelative(relative) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (relative.toLowerCase()) {
        case 'today':
            return window.getLocalDateString(today);
        case 'tomorrow':
            return window.getLocalDateString(tomorrow);
        default:
            return null;
    }
}

/**
 * Get date string for weekdays (monday, tuesday, etc.)
 * @param {string} weekday - Weekday name
 * @returns {string|null} Date string in YYYY-MM-DD format
 */
export function getDateForWeekday(weekday) {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = dayNames.findIndex(day => day === weekday.toLowerCase());

    if (targetDay === -1) return null;

    const currentDay = today.getDay();
    let daysUntilTarget = targetDay - currentDay;

    // If the target day is today or in the past, move to next week
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }

    const targetDate = new Date(today.getTime() + daysUntilTarget * 24 * 60 * 60 * 1000);
    return window.getLocalDateString(targetDate);
}

/**
 * Get date string for relative periods (in 3 days, in a week, etc.)
 * @param {string|number} amount - Amount (number or "a"/"an")
 * @param {string} unit - Time unit (day, week, month, year)
 * @returns {string|null} Date string in YYYY-MM-DD format
 */
export function getDateForRelativePeriod(amount, unit) {
    const today = new Date();
    let num;

    // Handle both numbers and "a" (as in "in a month")
    if (amount.toLowerCase() === 'a' || amount.toLowerCase() === 'an') {
        num = 1;
    } else {
        num = parseInt(amount);
    }

    if (isNaN(num) || num < 1) return null;

    let targetDate;
    switch (unit.toLowerCase()) {
        case 'day':
        case 'days':
            targetDate = new Date(today.getTime() + num * 24 * 60 * 60 * 1000);
            break;
        case 'week':
        case 'weeks':
            targetDate = new Date(today.getTime() + num * 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
        case 'months':
            targetDate = new Date(today);
            targetDate.setMonth(targetDate.getMonth() + num);
            break;
        case 'year':
        case 'years':
            targetDate = new Date(today);
            targetDate.setFullYear(targetDate.getFullYear() + num);
            break;
        default:
            return null;
    }

    return window.getLocalDateString(targetDate);
}

/**
 * Normalize time format to 24-hour HH:MM
 * @param {string} timeStr - Time string (e.g., "6pm", "6:30pm", "18:00", "9am")
 * @returns {string|null} Time string in HH:MM format
 */
export function normalizeTime(timeStr) {
    if (!timeStr) return null;

    console.log('🔍 NL Debug: Normalizing time:', timeStr);

    // Handle formats like "6pm", "6:30pm", "18:00", "6:30", "9am"
    const pmMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*pm$/i);
    const amMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*am$/i);
    const is24Hour = timeStr.match(/^(\d{1,2}):(\d{2})$/);

    let result = null;

    if (pmMatch) {
        let hour = parseInt(pmMatch[1]);
        const minute = pmMatch[2] || '00';
        if (hour !== 12) hour += 12; // Convert PM to 24-hour
        result = `${hour.toString().padStart(2, '0')}:${minute}`;
    } else if (amMatch) {
        let hour = parseInt(amMatch[1]);
        const minute = amMatch[2] || '00';
        if (hour === 12) hour = 0; // Convert 12 AM to 00
        result = `${hour.toString().padStart(2, '0')}:${minute}`;
    } else if (is24Hour) {
        result = timeStr;
    }

    console.log('🔍 NL Debug: Normalized time result:', result);
    return result;
}

/**
 * Extract metadata from text (tags, priority)
 * @param {string} text - Input text
 * @returns {Object} Metadata object with tags, priority, cleanText
 */
export function extractMetadata(text) {
    const tags = [];
    let priority = 0;
    let cleanText = text;

    // Extract @tags and #hashtags
    const tagMatches = text.match(/[@#]\w+/g);
    if (tagMatches) {
        tags.push(...tagMatches);
        // Remove tags from clean text
        cleanText = cleanText.replace(/[@#]\w+/g, '').trim();
    }

    // Extract priority (count ! marks)
    const priorityMatches = text.match(/!/g);
    if (priorityMatches) {
        priority = Math.min(priorityMatches.length, 3); // Max priority of 3
        // Remove priority marks from clean text
        cleanText = cleanText.replace(/!/g, '').trim();
    }

    return {
        tags,
        priority,
        cleanText: cleanText.replace(/\s+/g, ' ').trim()
    };
}

/**
 * Natural language patterns for parsing
 */
export const NL_PATTERNS = [
    // Relative periods with time: "task in 2 days at 7am" or "task 2 days at 7am" - MUST BE FIRST!
    {
        regex: /^(.+?)\s+(?:in\s+)?(\d+|a|an)\s+(day|days|week|weeks|month|months|year|years)\s+at\s+(.+)$/i,
        parser: (match) => {
            console.log('🔍 NL Debug: Relative period with time match:', match);
            const timeResult = normalizeTime(match[4]);
            const dateResult = getDateForRelativePeriod(match[2], match[3]);
            console.log('🔍 NL Debug: Time result:', timeResult);
            console.log('🔍 NL Debug: Date result:', dateResult);
            if (timeResult) {
                return {
                    title: match[1].trim(),
                    date: dateResult,
                    time: timeResult
                };
            }
            return null;
        }
    },

    // Standard order: "task tomorrow at 6pm" or "task today at 6:30"
    {
        regex: /^(.+?)\s+(today|tomorrow)\s+at\s+(.+)$/i,
        parser: (match) => ({
            title: match[1].trim(),
            date: getDateForRelative(match[2]),
            time: normalizeTime(match[3])
        })
    },

    // Reverse order: "tomorrow at 6pm task"
    {
        regex: /^(today|tomorrow)\s+at\s+(.+?)\s+(.+)$/i,
        parser: (match) => ({
            title: match[3].trim(),
            date: getDateForRelative(match[1]),
            time: normalizeTime(match[2])
        })
    },

    // Standard order: "task on monday at 6pm"
    {
        regex: /^(.+?)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(.+)$/i,
        parser: (match) => ({
            title: match[1].trim(),
            date: getDateForWeekday(match[2]),
            time: normalizeTime(match[3])
        })
    },

    // Standard order without "at": "task tomorrow 6pm"
    {
        regex: /^(.+?)\s+(today|tomorrow)\s+(\d{1,2}(?::\d{2})?(?:am|pm)?)$/i,
        parser: (match) => {
            const timeResult = normalizeTime(match[3]);
            if (timeResult) {
                return {
                    title: match[1].trim(),
                    date: getDateForRelative(match[2]),
                    time: timeResult
                };
            }
            return null;
        }
    },

    // Weekday without "on": "task monday 6pm"
    {
        regex: /^(.+?)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2}(?::\d{2})?(?:am|pm)?)$/i,
        parser: (match) => {
            const timeResult = normalizeTime(match[3]);
            if (timeResult) {
                return {
                    title: match[1].trim(),
                    date: getDateForWeekday(match[2]),
                    time: timeResult
                };
            }
            return null;
        }
    },

    // Simple "task at time" pattern: "limpiar ombligo at 9am"
    {
        regex: /^(.+?)\s+at\s+(\d{1,2}(?::\d{2})?(?:am|pm)?)$/i,
        parser: (match) => {
            const timeResult = normalizeTime(match[2]);
            if (timeResult) {
                return {
                    title: match[1].trim(),
                    date: window.getLocalDateString(new Date()), // Today by default
                    time: timeResult
                };
            }
            return null;
        }
    },

    // Standalone time pattern: "at 8am" or "at 3:30pm"
    {
        regex: /^at\s+(.+)$/i,
        parser: (match) => {
            const timeResult = normalizeTime(match[1]);
            if (timeResult) {
                return {
                    title: '',
                    date: window.getLocalDateString(new Date()),
                    time: timeResult
                };
            }
            return null;
        }
    },

    // Relative periods: "task in 3 days", "task in a week"
    {
        regex: /^(.+?)\s+in\s+(\d+|a|an)\s+(day|days|week|weeks|month|months|year|years)$/i,
        parser: (match) => ({
            title: match[1].trim(),
            date: getDateForRelativePeriod(match[2], match[3]),
            time: null
        })
    },

    // Just date: "task tomorrow", "task today"
    {
        regex: /^(.+?)\s+(today|tomorrow)$/i,
        parser: (match) => ({
            title: match[1].trim(),
            date: getDateForRelative(match[2]),
            time: null
        })
    },

    // Just weekday: "task monday", "task on friday"
    {
        regex: /^(.+?)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
        parser: (match) => ({
            title: match[1].trim(),
            date: getDateForWeekday(match[2]),
            time: null
        })
    }
];

/**
 * Parse natural language input into structured task data
 * @param {string} input - Natural language input
 * @returns {Object|null} Parsed task data or null
 */
export function parseNaturalLanguage(input) {
    if (!input || typeof input !== 'string') return null;

    const original = input.trim();
    if (!original) return null;

    // Try each pattern
    for (let i = 0; i < NL_PATTERNS.length; i++) {
        const pattern = NL_PATTERNS[i];
        console.log(`🔍 NL Debug: Testing pattern ${i + 1}:`, pattern.regex);
        const match = original.match(pattern.regex);
        if (match) {
            console.log(`🔍 NL Debug: Pattern ${i + 1} matched:`, match);
            const parsed = pattern.parser(match);
            console.log(`🔍 NL Debug: Pattern ${i + 1} parsed result:`, parsed);
            if (parsed && parsed.title !== undefined) {
                // Extract metadata from title
                const metadata = extractMetadata(parsed.title);

                return {
                    title: metadata.cleanText,
                    date: parsed.date,
                    time: parsed.time,
                    tags: metadata.tags,
                    priority: metadata.priority,
                    originalInput: original
                };
            }
        }
    }

    // If no patterns match, just extract metadata from the original text
    const metadata = extractMetadata(original);
    if (metadata.tags.length > 0 || metadata.priority > 0 || metadata.cleanText !== original) {
        return {
            title: metadata.cleanText,
            date: null,
            time: null,
            tags: metadata.tags,
            priority: metadata.priority,
            originalInput: original
        };
    }

    // No parsing needed
    return null;
}

/**
 * Apply parsed data to form fields
 * @param {Object} parsed - Parsed task data
 * @param {HTMLElement} titleElement - Title input element
 */
export function applyParsedData(parsed, titleElement) {
    console.log('🔍 NL Debug: Applying parsed data:', parsed);

    // Update title field
    if (parsed.title && parsed.title !== parsed.originalInput) {
        console.log('🔍 NL Debug: Updating title from', titleElement.value, 'to', parsed.title);
        titleElement.value = parsed.title;
    }

    // Update date field
    if (parsed.date) {
        const dateInput = document.getElementById('taskDueDate') ||
                        document.getElementById('editTaskDate') ||
                        document.getElementById('editTaskDateOnly');
        console.log('🔍 NL Debug: Date input found:', !!dateInput, 'Setting date:', parsed.date);
        if (dateInput) {
            dateInput.value = parsed.date;
        }
        // Also update the separate DateOnly field for edit modal
        const dateOnlyInput = document.getElementById('editTaskDateOnly');
        if (dateOnlyInput) {
            dateOnlyInput.value = parsed.date;
        }

        // Update the display button to show the new date/time
        if (typeof window.updateDateTimeDisplay === 'function') {
            window.updateDateTimeDisplay();
        }
    }

    // Update time field
    if (parsed.time) {
        const timeInput = document.getElementById('taskDueTime') ||
                        document.getElementById('editTaskTime') ||
                        document.getElementById('editTaskTimeOnly');
        console.log('🔍 NL Debug: Time input found:', !!timeInput, 'Setting time:', parsed.time);
        if (timeInput) {
            timeInput.value = parsed.time;
        }
        // Also update the separate TimeOnly field for edit modal
        const timeOnlyInput = document.getElementById('editTaskTimeOnly');
        if (timeOnlyInput) {
            timeOnlyInput.value = parsed.time;
        }

        // Update the display button to show the new date/time
        if (typeof window.updateDateTimeDisplay === 'function') {
            window.updateDateTimeDisplay();
        }
    }

    // Update priority
    if (parsed.priority > 0) {
        const priorityInput = document.getElementById('taskPriority') ||
                            document.getElementById('editTaskPriority');
        if (priorityInput) {
            priorityInput.value = parsed.priority;
        }
    }

    // Update notes with tags if any
    if (parsed.tags && parsed.tags.length > 0) {
        const notesInput = document.getElementById('taskNotes') ||
                         document.getElementById('editTaskNotes');
        if (notesInput && !notesInput.value.trim()) {
            notesInput.value = parsed.tags.join(' ');
        }
    }

    // Visual feedback
    titleElement.style.borderColor = '#34c759';
    titleElement.style.boxShadow = '0 0 0 2px rgba(52, 199, 89, 0.2)';
    setTimeout(() => {
        titleElement.style.borderColor = '';
        titleElement.style.boxShadow = '';
    }, 1000);
}

/**
 * Set up natural language input handler for a title input field
 * @param {HTMLElement} titleInput - Title input element
 */
export function setupNaturalLanguageInput(titleInput) {
    if (!titleInput) return;

    let debounceTimer = null;

    function handleInput() {
        const value = titleInput.value;
        console.log('🔍 NL Debug: Input value:', value);
        if (!value || value.length < 3) return;

        // Clear previous debounce
        clearTimeout(debounceTimer);

        // Debounce parsing to avoid excessive processing
        debounceTimer = setTimeout(() => {
            console.log('🔍 NL Debug: Parsing:', value);
            const parsed = parseNaturalLanguage(value);
            console.log('🔍 NL Debug: Parsed result:', parsed);
            if (parsed) {
                applyParsedData(parsed, titleInput);
            }
        }, 1500); // Increased delay to allow complete phrase typing
    }

    // Attach event listeners
    titleInput.addEventListener('input', handleInput);
    titleInput.addEventListener('paste', () => setTimeout(handleInput, 10));

    // Add placeholder hint
    const originalPlaceholder = titleInput.placeholder;
    titleInput.placeholder = originalPlaceholder ||
        'e.g., "Meeting tomorrow at 2pm", "Call John monday 9am", "Buy groceries today"';
}

/**
 * Initialize natural language processing for all task input fields
 * @returns {boolean} True if initialized successfully
 */
export function initializeNaturalLanguage() {
    console.log('🔍 NL Debug: Initializing natural language processing');

    // Look for task input fields
    const titleInputs = [
        document.getElementById('taskTitle'),
        document.getElementById('editTaskTitle'),
        document.querySelector('input[placeholder*="task"]'),
        document.querySelector('input[name="title"]'),
        // Also look for inputs in modals
        document.querySelector('.modal input[type="text"]'),
        document.querySelector('#editTaskModal input[type="text"]'),
        document.querySelector('#addTaskModal input[type="text"]')
    ].filter(el => el);

    console.log('🔍 NL Debug: Found title inputs:', titleInputs.map(el => el ? el.id || el.tagName : 'null'));

    titleInputs.forEach(input => {
        if (input && !input.hasAttribute('data-nl-initialized')) {
            console.log('🔍 NL Debug: Setting up NL for input:', input.id || input.tagName);
            setupNaturalLanguageInput(input);
            input.setAttribute('data-nl-initialized', 'true');
        }
    });

    return true;
}

console.log('✅ natural-language module loaded');
