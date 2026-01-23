/**
 * ========================================
 * Fitness Board - Main Application
 * ========================================
 * Haupteinstiegspunkt der App
 * Verwaltet Navigation, Event-System und Initialisierung
 */

import { Store } from './store.js';
import { WorkoutModule } from './modules/workout.js';
import { TrainingModule } from './modules/training.js';
import { TimerModule } from './modules/timer.js';
import { StatsModule } from './modules/stats.js';
import { RecoveryModule } from './modules/recovery.js';
import { UI } from './modules/ui.js';
import { formatDate, generateId } from './utils.js';

/**
 * ========================================
 * Event System
 * ========================================
 * Zentrales Pub/Sub System für Modul-Kommunikation
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Event registrieren
     * @param {string} event - Event-Name
     * @param {Function} callback - Callback-Funktion
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Event auslösen
     * @param {string} event - Event-Name
     * @param {*} data - Event-Daten
     */
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    /**
     * Event-Listener entfernen
     * @param {string} event - Event-Name
     * @param {Function} callback - Callback-Funktion
     */
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

/**
 * ========================================
 * Main Application Class
 * ========================================
 */
class FitnessApp {
    constructor() {
        // Event-System
        this.eventBus = new EventBus();

        // Store initialisieren
        this.store = new Store();

        // Module initialisieren
        this.modules = {
            workout: new WorkoutModule(this.store, this.eventBus),
            training: new TrainingModule(this.store, this.eventBus),
            timer: new TimerModule(this.store, this.eventBus),
            recovery: new RecoveryModule(this.store, this.eventBus),
            stats: new StatsModule(this.store, this.eventBus),
            ui: new UI(this.store, this.eventBus)
        };

        // Aktuelle View
        this.currentView = 'workouts';

        // Feature Flags
        this.features = {
            tvMode: false,
            autoProgression: true,
            soundEffects: true,
            darkMode: true
        };

        // Initialisierung
        this.init();
    }

    /**
     * App initialisieren
     */
    init() {
        console.log('🚀 Fitness Board wird initialisiert...');

        // Service Worker registrieren (PWA) - NEU!
        this.registerServiceWorker();

        // Audio-Context initialisieren - NEU!
        this.initAudioContext();

        // Navigation Setup
        this.setupNavigation();

        // Global Event Listeners
        this.setupGlobalEvents();

        // Module initialisieren
        this.initModules();

        // Initial View laden
        this.showView(this.currentView);

        // Feature Flags aus LocalStorage laden
        this.loadFeatureFlags();

        console.log('✅ Fitness Board bereit!');
    }


    /**
     * ========================================
     * PWA - Service Worker
     * ========================================
     */

    /**
     * Service Worker registrieren
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('✅ Service Worker registriert:', registration.scope);

                        // Update-Check
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // Neue Version verfügbar
                                    this.showUpdateNotification();
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('❌ Service Worker Registrierung fehlgeschlagen:', error);
                    });
            });
        } else {
            console.warn('⚠️ Service Worker wird nicht unterstützt');
        }
    }

    /**
     * Update-Benachrichtigung anzeigen
     */
    showUpdateNotification() {
        if (this.eventBus) {
            this.eventBus.emit('showToast', {
                message: '🔄 Neue Version verfügbar! Seite neu laden?',
                type: 'info',
                duration: 10000
            });
        }
    }


    /**
     * ========================================
     * Navigation
     * ========================================
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.showView(view);
            });
        });
    }

    /**
     * View anzeigen
     * @param {string} viewName - Name der View
     */
    showView(viewName) {
        // Alle Views ausblenden
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Alle Nav-Buttons deaktivieren
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Gewählte View anzeigen
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Nav-Button aktivieren
        const targetBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // View-spezifische Initialisierung
        this.currentView = viewName;
        this.eventBus.emit('viewChanged', { view: viewName });

        // Modul-spezifische Render-Methoden aufrufen
        switch(viewName) {
            case 'workouts':
                this.modules.workout.render();
                break;
            case 'training':
                this.modules.training.render();
                break;
            case 'timer':
                this.modules.timer.render();
                break;
            case 'recovery':
                this.modules.recovery.render();
                break;
            case 'stats':
                this.modules.stats.render();
                break;
        }
    }

    /**
     * ========================================
     * Global Events
     * ========================================
     */
    setupGlobalEvents() {
        // Settings Button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Event-Bus Listeners
        this.setupEventBusListeners();

        // Window Events
        window.addEventListener('beforeunload', () => {
            this.saveFeatureFlags();
        });

        // Navigation-Event
        this.eventBus.on('navigateTo', (data) => {
            console.log('🔄 Navigation zu:', data.view);
            this.showView(data.view);
        });
    }

    /**
     * Event-Bus Listeners registrieren
     */
    setupEventBusListeners() {
        // Workout erstellt
        this.eventBus.on('workoutCreated', (data) => {
            console.log('✅ Workout erstellt:', data.workout.name);
            this.modules.ui.showToast('Workout erstellt!', 'success');
        });

        // Workout gelöscht
        this.eventBus.on('workoutDeleted', (data) => {
            console.log('🗑️ Workout gelöscht:', data.workoutId);
            this.modules.ui.showToast('Workout gelöscht', 'info');
        });

        // Training gestartet
        this.eventBus.on('trainingStarted', (data) => {
            console.log('🏋️ Training gestartet:', data.workout.name);
            this.modules.ui.showToast('Training gestartet!', 'success');
        });

        // Training beendet
        this.eventBus.on('trainingFinished', (data) => {
            console.log('✅ Training beendet:', data.session);
            this.modules.ui.showToast('Training abgeschlossen! 💪', 'success');

            // Statistiken aktualisieren
            this.modules.stats.render();
        });

        // Set abgeschlossen
        this.eventBus.on('setCompleted', (data) => {
            if (this.features.soundEffects) {
                this.playSound('setComplete');
            }
        });

        // Timer beendet
        this.eventBus.on('timerFinished', () => {
            if (this.features.soundEffects) {
                this.playSound('timerEnd');
            }
            this.modules.ui.showToast('Timer beendet!', 'info');
        });

        // Fehler
        this.eventBus.on('error', (data) => {
            console.error('❌ Fehler:', data.message);
            this.modules.ui.showToast(data.message, 'error');
        });

        // Recovery-Warnungen
        this.eventBus.on('lowRecovery', (data) => {
            this.modules.ui.showToast(
                `⚠️ Niedriger Regenerations-Score: ${data.score}%. Ruhetag empfohlen!`,
                'warning',
                8000
            );
        });

        this.eventBus.on('deloadRecommended', (data) => {
            this.modules.ui.showToast(
                `📉 Deload-Woche empfohlen! Grund: ${data.reason}`,
                'info',
                10000
            );
        });

        // Recovery-View neu rendern nach Deload
        this.eventBus.on('deloadMarked', () => {
            if (this.currentView === 'recovery') {
                this.modules.recovery.render();
            }
        });
    }

    /**
     * ========================================
     * Module Initialisierung
     * ========================================
     */
    initModules() {
        // Workout-Modul
        this.modules.workout.init();

        // Training-Modul
        this.modules.training.init();

        // Timer-Modul
        this.modules.timer.init();

        // Recovery-Modul
        this.modules.recovery.init();

        // Stats-Modul
        this.modules.stats.init();

        // UI-Modul
        this.modules.ui.init();
    }

    /**
     * ========================================
     * Keyboard Shortcuts
     * ========================================
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: Neues Workout
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (this.currentView === 'workouts') {
                this.modules.workout.showCreateModal();
            }
        }

        // Ctrl/Cmd + T: Training starten
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.showView('training');
        }

        // Ctrl/Cmd + S: Statistiken
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.showView('stats');
        }

        // Escape: Modal schließen
        if (e.key === 'Escape') {
            this.modules.ui.closeModal();
        }

        // Space: Timer Start/Stop (nur in Timer-View)
        if (e.key === ' ' && this.currentView === 'timer') {
            e.preventDefault();
            this.modules.timer.toggleTimer();
        }
    }

    /**
     * ========================================
     * Settings Modal
     * ========================================
     */
    showSettingsModal() {
        const modalContent = `
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" ${this.features.tvMode ? 'checked' : ''} id="tvModeToggle">
                    TV-Modus (Große Schrift)
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" ${this.features.autoProgression ? 'checked' : ''} id="autoProgressionToggle">
                    Automatische Progression
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" ${this.features.soundEffects ? 'checked' : ''} id="soundEffectsToggle">
                    Sound-Effekte
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" ${this.features.darkMode ? 'checked' : ''} id="darkModeToggle">
                    Dark Mode
                </label>
            </div>
            <div class="form-group">
                <button class="btn btn-secondary" id="exportDataBtn">📥 Daten exportieren</button>
                <button class="btn btn-secondary" id="importDataBtn">📤 Daten importieren</button>
            </div>
            <div class="form-group">
                <button class="btn btn-danger" id="clearDataBtn">🗑️ Alle Daten löschen</button>
            </div>
        `;

        this.modules.ui.showModal('Einstellungen', modalContent, [
            {
                text: 'Speichern',
                className: 'btn-primary',
                onClick: () => {
                    this.saveSettings();
                    this.modules.ui.closeModal();
                }
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => {
                    this.modules.ui.closeModal();
                }
            }
        ]);

        // Event-Listener für Settings
        this.setupSettingsListeners();
    }

    /**
     * Settings Event-Listener
     */
    setupSettingsListeners() {
        // Export
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Import
        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importData();
            });
        }

        // Clear Data
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden!')) {
                    this.store.clearAll();
                    this.modules.ui.showToast('Alle Daten gelöscht', 'info');
                    this.modules.ui.closeModal();
                    location.reload();
                }
            });
        }
    }

    /**
     * Settings speichern
     */
    saveSettings() {
        // Feature Flags aus Checkboxen lesen
        this.features.tvMode = document.getElementById('tvModeToggle')?.checked || false;
        this.features.autoProgression = document.getElementById('autoProgressionToggle')?.checked || false;
        this.features.soundEffects = document.getElementById('soundEffectsToggle')?.checked || false;
        this.features.darkMode = document.getElementById('darkModeToggle')?.checked || false;

        // TV-Modus anwenden
        if (this.features.tvMode) {
            document.body.classList.add('tv-mode');
        } else {
            document.body.classList.remove('tv-mode');
        }

        // Dark Mode anwenden
        if (this.features.darkMode) {
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
        }

        // In LocalStorage speichern
        this.saveFeatureFlags();

        this.modules.ui.showToast('Einstellungen gespeichert', 'success');
    }

    /**
     * ========================================
     * Feature Flags
     * ========================================
     */
    loadFeatureFlags() {
        const saved = localStorage.getItem('fitnessboard_features');
        if (saved) {
            try {
                this.features = JSON.parse(saved);

                // Features anwenden
                if (this.features.tvMode) {
                    document.body.classList.add('tv-mode');
                }
                if (!this.features.darkMode) {
                    document.body.classList.add('light-mode');
                }
            } catch (e) {
                console.error('Fehler beim Laden der Feature Flags:', e);
            }
        }
    }

    saveFeatureFlags() {
        localStorage.setItem('fitnessboard_features', JSON.stringify(this.features));
    }

    /**
     * ========================================
     * Data Export/Import
     * ========================================
     */
    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            workouts: this.store.getWorkouts(),
            exercises: this.store.getExercises(),
            sessions: this.store.getSessions(),
            features: this.features
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-board-backup-${formatDate(new Date(), 'YYYY-MM-DD')}.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.modules.ui.showToast('Daten exportiert!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    // Validierung
                    if (!data.version || !data.workouts) {
                        throw new Error('Ungültiges Backup-Format');
                    }

                    // Bestätigung
                    if (!confirm('Alle aktuellen Daten werden überschrieben. Fortfahren?')) {
                        return;
                    }

                    // Daten importieren
                    this.store.clearAll();

                    if (data.workouts) {
                        data.workouts.forEach(workout => {
                            this.store.saveWorkout(workout);
                        });
                    }

                    if (data.exercises) {
                        data.exercises.forEach(exercise => {
                            this.store.saveExercise(exercise);
                        });
                    }

                    if (data.sessions) {
                        data.sessions.forEach(session => {
                            this.store.saveSession(session);
                        });
                    }

                    if (data.features) {
                        this.features = data.features;
                        this.saveFeatureFlags();
                    }

                    this.modules.ui.showToast('Daten importiert!', 'success');
                    this.modules.ui.closeModal();

                    // Seite neu laden
                    setTimeout(() => {
                        location.reload();
                    }, 1000);

                } catch (error) {
                    console.error('Import-Fehler:', error);
                    this.modules.ui.showToast('Fehler beim Importieren: ' + error.message, 'error');
                }
            };

            reader.readAsText(file);
        });

        input.click();
    }

    /**
     * ========================================
     * Sound Effects
     * ========================================
     */



    /**
     * Audio-Context initialisieren (für Browser-Kompatibilität)
     */
    /**
     * Audio-Context initialisieren (nach User-Interaktion)
     */
    initAudioContext() {
        this.audioContext = null;
        this.audioInitialized = false;

        // Funktion zum Initialisieren
        const initAudio = () => {
            if (this.audioInitialized) return;

            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();

                // Context starten
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log('✅ Audio-Context gestartet:', this.audioContext.state);
                        this.audioInitialized = true;
                    });
                } else {
                    console.log('✅ Audio-Context bereit:', this.audioContext.state);
                    this.audioInitialized = true;
                }

                // Event-Listener entfernen
                document.removeEventListener('click', initAudio);
                document.removeEventListener('touchstart', initAudio);
                document.removeEventListener('keydown', initAudio);

            } catch (e) {
                console.error('❌ Audio-Context Fehler:', e);
            }
        };

        // Auf User-Interaktion warten
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });

        console.log('🔊 Audio-System bereit (wartet auf User-Interaktion)');
    }



    /**
     * Sound abspielen
     */
    playSound(soundType) {
        if (!this.features.soundEffects) {
            console.log('🔇 Sound-Effekte deaktiviert');
            return;
        }

        console.log('🔊 Versuche Sound abzuspielen:', soundType);

        // Audio-Context prüfen
        if (!this.audioContext) {
            console.warn('⚠️ Audio-Context noch nicht initialisiert. Klicken Sie irgendwo auf die Seite.');

            // Versuche zu initialisieren
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (e) {
                console.error('❌ Kann Audio-Context nicht erstellen:', e);
                return;
            }
        }

        // Context fortsetzen falls suspended
        if (this.audioContext.state === 'suspended') {
            console.log('🔊 Audio-Context ist suspended, versuche fortzusetzen...');
            this.audioContext.resume().then(() => {
                console.log('✅ Audio-Context fortgesetzt');
                this.playActualSound(soundType);
            }).catch(e => {
                console.error('❌ Fehler beim Fortsetzen:', e);
            });
        } else {
            this.playActualSound(soundType);
        }
    }

    /**
     * Tatsächlichen Sound abspielen
     */
    playActualSound(soundType) {
        if (!this.audioContext) {
            console.error('❌ Kein Audio-Context verfügbar');
            return;
        }

        console.log('🔊 Spiele Sound ab:', soundType, 'State:', this.audioContext.state);

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';

            const now = this.audioContext.currentTime;

            switch(soundType) {
                case 'setComplete':
                    oscillator.frequency.value = 800;
                    gainNode.gain.value = 0.3;
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    console.log('✅ Set Complete Sound gestartet');
                    break;

                case 'timerEnd':
                    oscillator.frequency.value = 1000;
                    gainNode.gain.value = 0.5;
                    oscillator.start(now);
                    oscillator.stop(now + 0.5);
                    console.log('✅ Timer End Sound gestartet');
                    break;

                case 'trainingComplete':
                    const frequencies = [523, 659, 784, 1047];
                    frequencies.forEach((freq, i) => {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        osc.type = 'sine';
                        osc.frequency.value = freq;
                        gain.gain.value = 0.3;
                        osc.start(now + (i * 0.15));
                        osc.stop(now + (i * 0.15) + 0.1);
                    });
                    console.log('✅ Training Complete Sound gestartet');
                    break;

                default:
                    console.warn('⚠️ Unbekannter Sound-Typ:', soundType);
            }

        } catch (e) {
            console.error('❌ Fehler beim Sound abspielen:', e);
        }
    }


    /**
     * ========================================
     * Utility Methods
     * ========================================
     */

    /**
     * Feature-Flag prüfen
     * @param {string} feature - Feature-Name
     * @returns {boolean}
     */
    isFeatureEnabled(feature) {
        return this.features[feature] || false;
    }

    /**
     * Debug-Informationen ausgeben
     */
    debug() {
        console.log('=== Fitness Board Debug Info ===');
        console.log('Current View:', this.currentView);
        console.log('Features:', this.features);
        console.log('Workouts:', this.store.getWorkouts().length);
        console.log('Exercises:', this.store.getExercises().length);
        console.log('Sessions:', this.store.getSessions().length);
        console.log('Event Listeners:', Object.keys(this.eventBus.events));
        console.log('================================');
    }
}

/**
 * ========================================
 * App Initialisierung
 * ========================================
 */

// Warten bis DOM geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    // App-Instanz erstellen
    window.fitnessApp = new FitnessApp();

    // Debug-Funktion global verfügbar machen
    window.debugFitness = () => window.fitnessApp.debug();

    // Service Worker registrieren (optional für PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service Worker optional, Fehler ignorieren
        });
    }
}

// Export für Module
export { EventBus, FitnessApp };

