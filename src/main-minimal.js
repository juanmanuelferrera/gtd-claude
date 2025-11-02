// Minimal test - just console log
console.log('🔥 MINIMAL MAIN.JS LOADED');

// Try a simple import
import { sanitizeHTML } from './modules/core/sanitization.js';

console.log('✅ sanitization.js imported');
console.log('sanitizeHTML function:', typeof sanitizeHTML);

// Expose to window
window.sanitizeHTML = sanitizeHTML;

console.log('✅ Function exposed to window');
