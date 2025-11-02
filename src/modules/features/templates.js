// Templates Module
// Handles template management - load, save, add, delete, validate

import { sanitizeInput } from '../core/sanitization.js';

/**
 * Default templates
 */
const DEFAULT_TEMPLATES = ['@casa', '@recados', '@vedicvault', '@facebook', '@theonething'];

/**
 * Load templates from localStorage
 * @returns {Array<string>} Array of template strings
 */
export function loadTemplates() {
    try {
        const saved = localStorage.getItem('gtdTemplates');

        if (saved !== null) {
            // Templates have been saved before (could be empty array if user deleted all)
            const parsed = JSON.parse(saved);
            console.log(`📥 Loaded ${parsed.length} templates from localStorage`);
            return parsed;
        } else {
            // First time - no templates saved yet, use defaults
            console.log(`📥 No templates in localStorage, using ${DEFAULT_TEMPLATES.length} defaults`);
            return [...DEFAULT_TEMPLATES];
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        return [...DEFAULT_TEMPLATES];
    }
}

/**
 * Save templates to localStorage
 * @param {Array<string>} templates - Array of template strings
 * @returns {boolean} Success status
 */
export function saveTemplates(templates) {
    try {
        localStorage.setItem('gtdTemplates', JSON.stringify(templates));
        console.log(`💾 Saved ${templates.length} templates to localStorage`);
        return true;
    } catch (error) {
        console.error('Error saving templates:', error);
        return false;
    }
}

/**
 * Validate template string
 * @param {string} template - Template string to validate
 * @returns {string|null} Cleaned template or null if invalid
 */
export function validateTemplate(template) {
    if (!template || typeof template !== 'string') {
        return null;
    }

    // Sanitize input
    let cleaned = sanitizeInput(template.trim());

    if (!cleaned) {
        return null;
    }

    // Ensure it starts with @
    if (!cleaned.startsWith('@')) {
        cleaned = '@' + cleaned;
    }

    // Remove all spaces
    cleaned = cleaned.replace(/\s/g, '');

    // Limit length
    if (cleaned.length > 50) {
        cleaned = cleaned.substring(0, 50);
    }

    // Must have at least @ and one character
    if (cleaned.length < 2) {
        return null;
    }

    return cleaned;
}

/**
 * Add a new template
 * @param {Array<string>} templates - Current templates array
 * @param {string} template - Template to add
 * @returns {Object} Result object with success status and message
 */
export function addTemplate(templates, template) {
    const validated = validateTemplate(template);

    if (!validated) {
        return {
            success: false,
            message: 'Invalid template format',
            templates: templates
        };
    }

    if (templates.includes(validated)) {
        return {
            success: false,
            message: 'Template already exists',
            templates: templates
        };
    }

    const newTemplates = [...templates, validated];

    return {
        success: true,
        message: 'Template added successfully',
        templates: newTemplates,
        added: validated
    };
}

/**
 * Delete a template
 * @param {Array<string>} templates - Current templates array
 * @param {string} template - Template to delete
 * @returns {Object} Result object with success status
 */
export function deleteTemplate(templates, template) {
    const index = templates.indexOf(template);

    if (index === -1) {
        return {
            success: false,
            message: 'Template not found',
            templates: templates
        };
    }

    const newTemplates = templates.filter(t => t !== template);

    return {
        success: true,
        message: 'Template deleted successfully',
        templates: newTemplates,
        deleted: template
    };
}

/**
 * Check if template exists
 * @param {Array<string>} templates - Templates array
 * @param {string} template - Template to check
 * @returns {boolean} True if template exists
 */
export function hasTemplate(templates, template) {
    return templates.includes(template);
}

/**
 * Get all templates
 * @param {Array<string>} templates - Templates array
 * @returns {Array<string>} Copy of templates array
 */
export function getTemplates(templates) {
    return [...templates];
}

/**
 * Get template count
 * @param {Array<string>} templates - Templates array
 * @returns {number} Number of templates
 */
export function getTemplateCount(templates) {
    return templates.length;
}

/**
 * Search templates by text
 * @param {Array<string>} templates - Templates array
 * @param {string} searchText - Text to search for
 * @returns {Array<string>} Matching templates
 */
export function searchTemplates(templates, searchText) {
    if (!searchText || searchText.trim() === '') {
        return [...templates];
    }

    const searchLower = searchText.toLowerCase().trim();
    return templates.filter(template =>
        template.toLowerCase().includes(searchLower)
    );
}

/**
 * Sort templates alphabetically
 * @param {Array<string>} templates - Templates array
 * @returns {Array<string>} Sorted templates
 */
export function sortTemplates(templates) {
    return [...templates].sort((a, b) => a.localeCompare(b));
}

/**
 * Get default templates
 * @returns {Array<string>} Default templates
 */
export function getDefaultTemplates() {
    return [...DEFAULT_TEMPLATES];
}

/**
 * Reset templates to defaults
 * @returns {Array<string>} Default templates
 */
export function resetToDefaults() {
    const defaults = getDefaultTemplates();
    saveTemplates(defaults);
    console.log(`🔄 Reset to ${defaults.length} default templates`);
    return defaults;
}

console.log('✅ templates module loaded');
