/**
 * Modal Management for HyperFiler Pro
 * Centralized modal operations and event handling
 */

class ModalManager {
    constructor() {
        this.openModals = new Set();
        this.setupGlobalEventListeners();
    }

    /**
     * Show a modal
     */
    show(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} not found`);
            return;
        }

        modal.style.display = 'block';
        this.openModals.add(modalId);

        // Setup backdrop close if enabled (default true)
        if (options.backdropClose !== false) {
            this.setupBackdropClose(modal, modalId);
        }

        // Auto-focus first input if requested
        if (options.autoFocus) {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }

        // Setup auto-close timer if specified
        if (options.autoClose) {
            setTimeout(() => this.hide(modalId), options.autoClose);
        }

        // Emit event for other components to respond
        this.emitModalEvent('modal:show', modalId);
    }

    /**
     * Hide a modal
     */
    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.openModals.delete(modalId);
            this.emitModalEvent('modal:hide', modalId);
        }
    }

    /**
     * Hide all open modals
     */
    hideAll() {
        Array.from(this.openModals).forEach(modalId => {
            this.hide(modalId);
        });
    }

    /**
     * Check if any modal is open
     */
    hasOpenModal() {
        return this.openModals.size > 0;
    }

    /**
     * Setup backdrop close functionality
     */
    setupBackdropClose(modal, modalId) {
        const handleBackdropClick = (e) => {
            if (e.target === modal) {
                this.hide(modalId);
                modal.removeEventListener('click', handleBackdropClick);
            }
        };
        modal.addEventListener('click', handleBackdropClick);
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.hasOpenModal()) {
                this.hideAll();
            }
        });
    }

    /**
     * Emit modal events for other components
     */
    emitModalEvent(eventType, modalId) {
        const event = new CustomEvent(eventType, {
            detail: { modalId }
        });
        document.dispatchEvent(event);
    }

    /**
     * Confirm dialog wrapper
     */
    async confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const confirmModal = document.createElement('div');
            confirmModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            confirmModal.innerHTML = `
                <div style="
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                ">
                    <h3 style="margin: 0 0 16px 0; color: #333;">${title}</h3>
                    <p style="margin: 0 0 24px 0; color: #666; line-height: 1.4;">${message}</p>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancelBtn" style="
                            padding: 8px 16px;
                            border: 1px solid #ddd;
                            background: white;
                            color: #333;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Cancel</button>
                        <button id="confirmBtn" style="
                            padding: 8px 16px;
                            border: none;
                            background: #dc3545;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Confirm</button>
                    </div>
                </div>
            `;

            const cleanup = () => {
                if (confirmModal.parentElement) {
                    confirmModal.remove();
                }
            };

            confirmModal.querySelector('#confirmBtn').onclick = () => {
                cleanup();
                resolve(true);
            };

            confirmModal.querySelector('#cancelBtn').onclick = () => {
                cleanup();
                resolve(false);
            };

            confirmModal.onclick = (e) => {
                if (e.target === confirmModal) {
                    cleanup();
                    resolve(false);
                }
            };

            document.body.appendChild(confirmModal);
        });
    }

    /**
     * Alert dialog wrapper
     */
    static alert(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `inline-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
}

// Create global instance for backward compatibility
window.modalManager = new ModalManager();

// Expose static methods globally for compatibility
window.showModal = (modalId, options) => window.modalManager.show(modalId, options);
window.closeModal = (modalId) => window.modalManager.hide(modalId);
window.showInlineNotification = (message, type) => ModalManager.alert(message, type);
window.showOptimisticFeedback = (message, type, duration) => ModalManager.alert(message, type);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}