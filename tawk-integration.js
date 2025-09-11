// Tawk.to Auto Language Detection Script
// This script automatically detects the page language and sets Tawk.to accordingly

var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();

// Auto-detect and set Tawk.to language based on current page
function autoDetectAndSetTawkLanguage() {
    let detectedLang = 'en'; // default
    
    // Method 1: Check URL for -es suffix or /es/ path
    if (window.location.pathname.includes('-es.html') || 
        window.location.pathname.includes('/es/')) {
        detectedLang = 'es';
    }
    
    // Method 2: Check if this is the main app with saved language preference
    if (window.location.pathname.includes('hyperfiler-pro.html')) {
        const savedLang = localStorage.getItem('language');
        if (savedLang === 'es') {
            detectedLang = 'es';
        }
    }
    
    // Method 3: Check HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang === 'es' || htmlLang === 'es-ES') {
        detectedLang = 'es';
    }
    
    // Method 4: Check for Spanish content indicators in title and body
    const title = document.title.toLowerCase();
    const bodyText = document.body ? document.body.textContent.toLowerCase() : '';
    if (title.includes('español') || title.includes('registro') || 
        title.includes('iniciar sesión') || title.includes('cancelar') ||
        bodyText.includes('iniciar sesión') || bodyText.includes('registro') ||
        bodyText.includes('cancelar suscripción')) {
        detectedLang = 'es';
    }
    
    // Set Tawk.to language
    if (typeof Tawk_API !== 'undefined' && Tawk_API.setLocale) {
        Tawk_API.setLocale(detectedLang);
        console.log('🌐 Auto-detected Tawk.to language:', detectedLang, 'for page:', window.location.pathname);
    } else {
        // Store for later when Tawk loads
        window.pendingTawkLanguage = detectedLang;
    }
    
    return detectedLang;
}

// Initialize Tawk.to with language detection
(function(){
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/5e73910a8d24fc226588aae2/default';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
    
    // Set up Tawk.to callbacks
    Tawk_API.onLoad = function(){
        console.log('📱 Tawk.to chat loaded successfully');
        
        // Auto-detect and set language
        autoDetectAndSetTawkLanguage();
        
        // If there was a pending language setting, apply it
        if (window.pendingTawkLanguage) {
            Tawk_API.setLocale(window.pendingTawkLanguage);
            console.log('🌐 Applied pending Tawk.to language:', window.pendingTawkLanguage);
            delete window.pendingTawkLanguage;
        }
        
        // Set visitor name and email if available
        if (window.currentUser) {
            Tawk_API.setAttributes({
                'name': window.currentUser.name || 'User',
                'email': window.currentUser.email || '',
                'id': window.currentUser.id || ''
            }, function(error){
                if (!error) {
                    console.log('✅ Tawk.to visitor attributes set');
                }
            });
        }
    };
    
    // Run initial language detection (before Tawk fully loads)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoDetectAndSetTawkLanguage);
    } else {
        autoDetectAndSetTawkLanguage();
    }
})();

// Export function for manual language switching (for main app)
window.updateTawkLanguage = function(lang) {
    if (typeof Tawk_API !== 'undefined' && Tawk_API.setLocale) {
        const tawkLocale = lang === 'es' ? 'es' : 'en';
        Tawk_API.setLocale(tawkLocale);
        console.log('🌐 Tawk.to language manually set to:', tawkLocale);
    }
};