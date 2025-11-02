// Internationalization (i18n) Module
// Multi-language support for the application

/**
 * Translation dictionary
 * Add new languages by adding a new key to this object
 */
export const translations = {
    en: {
        // Navigation
        'Today': 'Today',
        'Week': 'Week',
        'Month': 'Month',
        'All Tasks': 'All Tasks',
        'Lists': 'Lists',
        'Repeat': 'Repeat',
        'Undo': 'Undo',
        'Search': 'Search',

        // Common buttons
        'Add Task': 'Add Task',
        'Save': 'Save',
        'Cancel': 'Cancel',
        'Delete': 'Delete',
        'Edit': 'Edit',
        'Close': 'Close',
        'Export': 'Export',
        'Import': 'Import',

        // Days of week
        'Monday': 'Monday',
        'Tuesday': 'Tuesday',
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday',
        'Saturday': 'Saturday',
        'Sunday': 'Sunday',

        // Months
        'January': 'January',
        'February': 'February',
        'March': 'March',
        'April': 'April',
        'May': 'May',
        'June': 'June',
        'July': 'July',
        'August': 'August',
        'September': 'September',
        'October': 'October',
        'November': 'November',
        'December': 'December',

        // Task fields
        'Task Title': 'Task Title',
        'Notes': 'Notes',
        'Due Date': 'Due Date',
        'Due Time': 'Due Time',
        'Priority': 'Priority',
        'Status': 'Status',

        // Repeat options
        'No Repeat': 'No Repeat',
        'Daily': 'Daily',
        'Weekly': 'Weekly',
        'Bi-weekly': 'Bi-weekly',
        'Monthly': 'Monthly',
        'Yearly': 'Yearly',

        // Status
        'Pending': 'Pending',
        'Completed': 'Completed',
        'Overdue': 'Overdue',

        // Common
        'No due date': 'No due date',
        'Loading': 'Loading',
        'Refresh': 'Refresh',
        'Print': 'Print'
    },
    es: {
        // Navigation
        'Today': 'Hoy',
        'Week': 'Semana',
        'Month': 'Mes',
        'All Tasks': 'Todas las Tareas',
        'Lists': 'Listas',
        'Repeat': 'Repetir',
        'Undo': 'Deshacer',
        'Search': 'Buscar',

        // Common buttons
        'Add Task': 'Agregar Tarea',
        'Save': 'Guardar',
        'Cancel': 'Cancelar',
        'Delete': 'Eliminar',
        'Edit': 'Editar',
        'Close': 'Cerrar',
        'Export': 'Exportar',
        'Import': 'Importar',

        // Days of week
        'Monday': 'Lunes',
        'Tuesday': 'Martes',
        'Wednesday': 'Miércoles',
        'Thursday': 'Jueves',
        'Friday': 'Viernes',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo',

        // Months
        'January': 'Enero',
        'February': 'Febrero',
        'March': 'Marzo',
        'April': 'Abril',
        'May': 'Mayo',
        'June': 'Junio',
        'July': 'Julio',
        'August': 'Agosto',
        'September': 'Septiembre',
        'October': 'Octubre',
        'November': 'Noviembre',
        'December': 'Diciembre',

        // Task fields
        'Task Title': 'Título de la Tarea',
        'Notes': 'Notas',
        'Due Date': 'Fecha de Vencimiento',
        'Due Time': 'Hora de Vencimiento',
        'Priority': 'Prioridad',
        'Status': 'Estado',

        // Repeat options
        'No Repeat': 'Sin Repetir',
        'Daily': 'Diario',
        'Weekly': 'Semanal',
        'Bi-weekly': 'Quincenal',
        'Monthly': 'Mensual',
        'Yearly': 'Anual',

        // Status
        'Pending': 'Pendiente',
        'Completed': 'Completado',
        'Overdue': 'Vencido',

        // Common
        'No due date': 'Sin fecha de vencimiento',
        'Loading': 'Cargando',
        'Refresh': 'Actualizar',
        'Print': 'Imprimir'
    }
};

// Current active language
let currentLanguage = 'en';

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Set current language
 * @param {string} lang - Language code (e.g., 'en', 'es')
 * @returns {boolean} Success status
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        return true;
    }
    console.warn(`Language "${lang}" not found, keeping "${currentLanguage}"`);
    return false;
}

/**
 * Translate a key to current language
 * @param {string} key - Translation key
 * @param {string} fallback - Optional fallback text
 * @returns {string} Translated text or key if not found
 */
export function t(key, fallback = null) {
    const translation = translations[currentLanguage]?.[key];
    return translation || fallback || key;
}

/**
 * Translate a key (alias for t())
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
export function translateText(key) {
    return t(key);
}

/**
 * Get all available languages
 * @returns {string[]} Array of language codes
 */
export function getAvailableLanguages() {
    return Object.keys(translations);
}

/**
 * Check if language is supported
 * @param {string} lang - Language code
 * @returns {boolean} True if language exists
 */
export function isLanguageSupported(lang) {
    return Object.hasOwnProperty.call(translations, lang);
}

/**
 * Get all translations for a specific language
 * @param {string} lang - Language code
 * @returns {Object|null} Translation object or null
 */
export function getLanguageTranslations(lang) {
    return translations[lang] || null;
}

/**
 * Add or update translations for a language
 * @param {string} lang - Language code
 * @param {Object} newTranslations - Translation key-value pairs
 * @returns {boolean} Success status
 */
export function addTranslations(lang, newTranslations) {
    if (!translations[lang]) {
        translations[lang] = {};
    }
    Object.assign(translations[lang], newTranslations);
    return true;
}

/**
 * Get translation statistics
 * @returns {Object} Stats about translations
 */
export function getTranslationStats() {
    const stats = {};
    for (const lang of Object.keys(translations)) {
        stats[lang] = Object.keys(translations[lang]).length;
    }
    return stats;
}

console.log('✅ i18n module loaded');
