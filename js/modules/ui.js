/**
 * ========================================
 * UI Module
 * ========================================
 * Verwaltet UI-Komponenten und Interaktionen
 * - Modals
 * - Toast-Benachrichtigungen
 * - Loading States
 * - Confirmations
 */

import { createElement, sleep } from '../utils.js';

export class UI {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.modalOverlay = null;
        this.modalContainer = null;
        this.toastContainer = null;

        // State
        this.activeModal = null;
        this.activeToasts = [];
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalContainer = document.getElementById('modalContainer');

        // Toast-Container erstellen
        this.createToastContainer();

        // Event-Listener
        this.setupEventListeners();

        console.log('✅ UI-Modul initialisiert');
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Modal-Overlay schließt Modal
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Event-Bus Listener
        this.eventBus.on('showModal', (data) => {
            this.showModal(data.title, data.content, data.buttons);
        });

        this.eventBus.on('closeModal', () => {
            this.closeModal();
        });

        this.eventBus.on('showToast', (data) => {
            this.showToast(data.message, data.type);
        });

        // ESC-Taste schließt Modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    /**
     * ========================================
     * Modal-System
     * ========================================
     */

    /**
     * Modal anzeigen
     * @param {string} title - Modal-Titel
     * @param {string} content - Modal-Inhalt (HTML)
     * @param {Array} buttons - Button-Konfiguration
     */
    showModal(title, content, buttons = []) {
        // Vorheriges Modal schließen
        if (this.activeModal) {
            this.closeModal();
        }

        // Modal-HTML erstellen
        const modalHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="modal-close" id="modalCloseBtn">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${buttons.map((btn, index) => `
                            <button class="btn ${btn.className || 'btn-secondary'}" data-modal-btn="${index}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Modal einfügen
        this.modalContainer.innerHTML = modalHTML;
        this.activeModal = this.modalContainer.querySelector('.modal');

        // Overlay anzeigen
        this.modalOverlay.classList.add('active');

        // Event-Listener für Buttons
        buttons.forEach((btn, index) => {
            const btnEl = this.modalContainer.querySelector(`[data-modal-btn="${index}"]`);
            if (btnEl && btn.onClick) {
                btnEl.addEventListener('click', btn.onClick);
            }
        });

        // Close-Button
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Verhindere Scroll auf Body
        document.body.style.overflow = 'hidden';

        // Focus auf erstes Input-Element
        setTimeout(() => {
            const firstInput = this.activeModal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    /**
     * Modal schließen
     */
    closeModal() {
        if (!this.activeModal) return;

        // Overlay ausblenden
        this.modalOverlay.classList.remove('active');

        // Modal entfernen
        this.modalContainer.innerHTML = '';
        this.activeModal = null;

        // Scroll wieder erlauben
        document.body.style.overflow = '';
    }

    /**
     * Confirmation-Dialog
     * @param {string} title - Titel
     * @param {string} message - Nachricht
     * @param {Function} onConfirm - Callback bei Bestätigung
     * @param {Function} onCancel - Callback bei Abbruch
     */
    showConfirm(title, message, onConfirm, onCancel = null) {
        const content = `
            <div style="padding: 1rem 0;">
                <p style="font-size: 1.1rem; line-height: 1.6;">${message}</p>
            </div>
        `;

        const buttons = [
            {
                text: 'Bestätigen',
                className: 'btn-primary',
                onClick: () => {
                    this.closeModal();
                    if (onConfirm) onConfirm();
                }
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => {
                    this.closeModal();
                    if (onCancel) onCancel();
                }
            }
        ];

        this.showModal(title, content, buttons);
    }

    /**
     * Alert-Dialog
     * @param {string} title - Titel
     * @param {string} message - Nachricht
     * @param {Function} onClose - Callback beim Schließen
     */
    showAlert(title, message, onClose = null) {
        const content = `
            <div style="padding: 1rem 0;">
                <p style="font-size: 1.1rem; line-height: 1.6;">${message}</p>
            </div>
        `;

        const buttons = [
            {
                text: 'OK',
                className: 'btn-primary',
                onClick: () => {
                    this.closeModal();
                    if (onClose) onClose();
                }
            }
        ];

        this.showModal(title, content, buttons);
    }

    /**
     * ========================================
     * Toast-Benachrichtigungen
     * ========================================
     */

    /**
     * Toast-Container erstellen
     */
    createToastContainer() {
        if (document.querySelector('.toast-container')) return;

        const container = createElement(`
            <div class="toast-container"></div>
        `);

        document.body.appendChild(container);
        this.toastContainer = container;
    }

    /**
     * Toast anzeigen
     * @param {string} message - Nachricht
     * @param {string} type - Typ (success, error, warning, info)
     * @param {number} duration - Anzeigedauer in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toastHTML = `
            <div class="toast toast-${type}">
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-content">
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">×</button>
            </div>
        `;

        const toast = createElement(toastHTML);
        this.toastContainer.appendChild(toast);
        this.activeToasts.push(toast);

        // Close-Button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto-Remove nach Duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Toast entfernen
     * @param {Element} toast - Toast-Element
     */
    async removeToast(toast) {
        if (!toast || !toast.parentElement) return;

        // Fade-Out Animation
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';

        await sleep(300);

        // Entfernen
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }

        // Aus Array entfernen
        this.activeToasts = this.activeToasts.filter(t => t !== toast);
    }

    /**
     * Alle Toasts entfernen
     */
    clearToasts() {
        this.activeToasts.forEach(toast => this.removeToast(toast));
    }

    /**
     * ========================================
     * Loading States
     * ========================================
     */

    /**
     * Loading-Overlay anzeigen
     * @param {string} message - Nachricht
     */
    showLoading(message = 'Lädt...') {
        const loadingHTML = `
            <div class="loading-overlay">
                <div class="spinner"></div>
                <div style="margin-top: 1rem; color: var(--text-primary); font-size: 1.1rem;">
                    ${message}
                </div>
            </div>
        `;

        const loading = createElement(loadingHTML);
        document.body.appendChild(loading);

        return loading;
    }

    /**
     * Loading-Overlay entfernen
     * @param {Element} loading - Loading-Element
     */
    hideLoading(loading) {
        if (loading && loading.parentElement) {
            loading.parentElement.removeChild(loading);
        }
    }

    /**
     * ========================================
     * Progress Bar
     * ========================================
     */

    /**
     * Progress Bar erstellen
     * @param {number} value - Wert (0-100)
     * @param {string} label - Label
     * @returns {string} HTML
     */
    createProgressBar(value, label = '') {
        const percentage = Math.min(Math.max(value, 0), 100);

        return `
            <div class="progress-bar-container">
                ${label ? `<div class="progress-bar-label">${label}</div>` : ''}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-bar-value">${percentage}%</div>
            </div>
        `;
    }

    /**
     * ========================================
     * Badges
     * ========================================
     */

    /**
     * Badge erstellen
     * @param {string} text - Text
     * @param {string} type - Typ (success, danger, warning, info)
     * @returns {string} HTML
     */
    createBadge(text, type = 'info') {
        return `<span class="badge badge-${type}">${text}</span>`;
    }

    /**
     * ========================================
     * Empty States
     * ========================================
     */

    /**
     * Empty State erstellen
     * @param {string} icon - Icon (Emoji)
     * @param {string} title - Titel
     * @param {string} text - Text
     * @param {Object} button - Button-Konfiguration (optional)
     * @returns {string} HTML
     */
    createEmptyState(icon, title, text, button = null) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-title">${title}</div>
                <div class="empty-state-text">${text}</div>
                ${button ? `
                    <button class="btn ${button.className || 'btn-primary'}" id="${button.id || 'emptyStateBtn'}">
                        ${button.text}
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * ========================================
     * Utility-Methoden
     * ========================================
     */

    /**
     * Element ein-/ausblenden mit Animation
     * @param {Element} element - Element
     * @param {boolean} show - Anzeigen oder verstecken
     */
    async toggleElement(element, show) {
        if (!element) return;

        if (show) {
            element.style.display = 'block';
            await sleep(10);
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        } else {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-10px)';
            await sleep(300);
            element.style.display = 'none';
        }
    }

    /**
     * Smooth Scroll zu Element
     * @param {Element|string} target - Element oder Selector
     */
    scrollTo(target) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Highlight-Effekt auf Element
     * @param {Element} element - Element
     * @param {string} color - Farbe
     */
    async highlightElement(element, color = 'var(--accent-primary)') {
        if (!element) return;

        const originalBg = element.style.backgroundColor;

        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = color;

        await sleep(500);

        element.style.backgroundColor = originalBg;

        await sleep(300);

        element.style.transition = '';
    }

    /**
     * Shake-Animation auf Element
     * @param {Element} element - Element
     */
    async shakeElement(element) {
        if (!element) return;

        element.style.animation = 'shake 0.5s';

        await sleep(500);

        element.style.animation = '';
    }

    /**
     * ========================================
     * Keyboard Shortcuts Helper
     * ========================================
     */

    /**
     * Keyboard Shortcut Hint anzeigen
     * @param {string} key - Taste
     * @param {string} description - Beschreibung
     * @returns {string} HTML
     */
    createShortcutHint(key, description) {
        return `
            <div class="shortcut-hint">
                <kbd class="shortcut-key">${key}</kbd>
                <span class="shortcut-description">${description}</span>
            </div>
        `;
    }
}

// CSS für Shake-Animation (falls nicht in styles.css)
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .progress-bar-container {
        margin: 1rem 0;
    }

    .progress-bar-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }

    .progress-bar-value {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
        text-align: right;
    }

    .shortcut-hint {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--bg-card);
        border-radius: 6px;
        margin-bottom: 0.5rem;
    }

    .shortcut-key {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: monospace;
        font-size: 0.9rem;
        color: var(--accent-primary);
    }

    .shortcut-description {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);
