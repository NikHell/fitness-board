/**
 * ========================================
 * Analysis Module
 * ========================================
 * Intelligente Trainingsanalyse
 * - Volumen-Analyse
 * - Trend-Erkennung
 * - Muskelgruppen-Balance
 * - Periodisierungs-Analyse
 * - Warnungen & Empfehlungen
 */

import { VolumeAnalysis } from './volumeAnalysis.js';

export class AnalysisModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.analysisContentEl = null;

        // Volume Analysis
        this.volumeAnalysis = new VolumeAnalysis(store);
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        this.analysisContentEl = document.getElementById('analysisContent');

        // Event-Listener
        this.setupEventListeners();

        console.log('✅ Analysis-Modul initialisiert');
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Event-Bus Listener
        this.eventBus.on('viewChanged', (data) => {
            if (data.view === 'analysis') {
                this.render();
            }
        });

        this.eventBus.on('trainingFinished', () => {
            // Analyse aktualisieren wenn Training beendet
            if (this.analysisContentEl && this.analysisContentEl.closest('.view.active')) {
                this.render();
            }
        });
    }

    /**
     * ========================================
     * Rendering
     * ========================================
     */

    /**
     * Analysis-View rendern
     */
    render() {
        if (!this.analysisContentEl) return;

        const sessions = this.store.getTrainingSessions();

        if (sessions.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Rendere Volumen-Analyse
        this.analysisContentEl.innerHTML = this.volumeAnalysis.render(sessions);

        // Event-Listener für Profil-Speicherung
        this.attachAnalysisListeners();
    }

    /**
     * Empty State rendern
     */
    renderEmptyState() {
        this.analysisContentEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧠</div>
                <div class="empty-state-title">Noch keine Analyse verfügbar</div>
                <div class="empty-state-text">Trainiere mindestens 2 Wochen, um eine intelligente Analyse zu erhalten!</div>
            </div>
        `;
    }

    /**
     * ========================================
     * Event-Listener
     * ========================================
     */

    /**
     * Analysis Event-Listener
     */
    attachAnalysisListeners() {
        // Profil-Einstellungen speichern
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const profile = {
                    experience: document.getElementById('profileExperience').value,
                    frequency: parseInt(document.getElementById('profileFrequency').value),
                    goals: document.getElementById('profileGoals').value
                };

                this.volumeAnalysis.saveUserProfile(profile);

                this.eventBus.emit('showToast', {
                    message: '✅ Profil gespeichert! Bereiche wurden angepasst.',
                    type: 'success'
                });

                // Neu rendern
                this.render();
            });
        }
    }
}
