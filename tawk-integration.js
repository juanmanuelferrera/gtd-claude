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

// Initialize Tawk.to with language detection and custom colors
(function(){
    // Set custom widget appearance before loading
    window.Tawk_API = window.Tawk_API || {};
    
    // Customize widget colors to match site's blue palette
    window.Tawk_API.customStyle = {
        visibility: {
            desktop: {
                position: 'br',
                xOffset: 20,
                yOffset: 20
            },
            mobile: {
                position: 'br', 
                xOffset: 10,
                yOffset: 10
            }
        }
    };
    
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/5e73910a8d24fc226588aae2/default';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
    
    // Set up Tawk.to callbacks
    Tawk_API.onLoad = function(){
        console.log('📱 Tawk.to chat loaded successfully');
        
        // Add custom CSS to style Tawk.to widget with site colors  
        const style = document.createElement('style');
        style.textContent = `
            /* Tawk.to Widget Custom Colors - Match Site Palette (#2563eb blue theme) */
            
            /* Widget iframe styling */
            iframe[src*="tawk.to"] {
                border-radius: 12px !important;
                box-shadow: 0 8px 24px rgba(37, 99, 235, 0.2) !important;
                border: 2px solid #2563eb !important;
            }
            
            /* Widget bubble/launcher - target by common Tawk selectors */
            div[id*="tawk"],
            div[class*="tawk"],
            #tawkchat-container,
            .widget-bubble {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
                border: 3px solid #1d4ed8 !important;
                box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4) !important;
                border-radius: 50% !important;
            }
            
            /* Try to override any green/default Tawk colors */
            [style*="background-color: rgb(76, 175, 80)"],
            [style*="background-color: #4caf50"],
            [style*="background: rgb(76, 175, 80)"],
            [style*="background: #4caf50"] {
                background: #2563eb !important;
                background-color: #2563eb !important;
            }
            
            /* Widget button hover states */
            div[id*="tawk"]:hover,
            div[class*="tawk"]:hover {
                background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%) !important;
                transform: scale(1.05) !important;
                transition: all 0.3s ease !important;
            }
        `;
        document.head.appendChild(style);
        console.log('🎨 Applied custom Tawk.to styling with site blue theme (#2563eb)');
        
        // Monitor and restyle Tawk.to elements as they appear
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check for Tawk.to widget elements
                        if (node.id && node.id.includes('tawk')) {
                            node.style.setProperty('background', '#2563eb', 'important');
                            node.style.setProperty('background-color', '#2563eb', 'important');
                        }
                        
                        // Check for iframes from Tawk.to
                        if (node.tagName === 'IFRAME' && node.src && node.src.includes('tawk.to')) {
                            node.style.setProperty('border-radius', '12px', 'important');
                            node.style.setProperty('box-shadow', '0 8px 24px rgba(37, 99, 235, 0.2)', 'important');
                        }
                        
                        // Look for elements with green Tawk.to default colors and change them
                        const elementsWithBg = node.querySelectorAll ? node.querySelectorAll('[style*="background"]') : [];
                        elementsWithBg.forEach(function(el) {
                            const bgStyle = el.style.background || el.style.backgroundColor;
                            if (bgStyle && (bgStyle.includes('4caf50') || bgStyle.includes('76, 175, 80'))) {
                                el.style.setProperty('background', '#2563eb', 'important');
                                el.style.setProperty('background-color', '#2563eb', 'important');
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👁️ Started monitoring for Tawk.to elements to apply custom colors');
        
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