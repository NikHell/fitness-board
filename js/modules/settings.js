/**
 * ========================================
 * Settings Module
 * ========================================
 * Verwaltet alle App-Einstellungen
 * - Trainingsprofil (Erfahrung, Frequenz, Ziele)
 * - App-Einstellungen (Theme, Sound, etc.)
 * - Daten-Export/Import
 * - Account-Verwaltung
 */

export class SettingsModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.settingsContentEl = null;

        // Feature Flags (aus app.js übernommen)
        this.features = this.loadFeatureFlags();
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        this.settingsContentEl = document.getElementById('settingsContent');

        // Event-Listener
        this.setupEventListeners();

        console.log('✅ Settings-Modul initialisiert');
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Event-Bus Listener
        this.eventBus.on('viewChanged', (data) => {
            if (data.view === 'settings') {
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
     * Settings-View rendern
     */
    render() {
        if (!this.settingsContentEl) return;

        this.settingsContentEl.innerHTML = `
            <div class="settings-container">
                ${this.renderTrainingProfile()}
                ${this.renderAppSettings()}
                ${this.renderDataManagement()}
                ${this.renderAbout()}
            </div>
        `;

        // Event-Listener
        this.attachSettingsListeners();
    }

    /**
     * ========================================
     * 1. TRAININGSPROFIL
     * ========================================
     */

    renderTrainingProfile() {
        const profile = this.getUserProfile();

        return `
            <div class="settings-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>👤</span>
                    <span>Trainingsprofil</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                    <!-- Trainingserfahrung -->
                    <div class="form-group">
                        <label class="form-label">Trainingserfahrung</label>
                        <select id="profileExperience" class="form-select" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary);">
                            <option value="beginner" ${profile.experience === 'beginner' ? 'selected' : ''}>
                                Anfänger (< 1 Jahr)
                            </option>
                            <option value="intermediate" ${profile.experience === 'intermediate' ? 'selected' : ''}>
                                Fortgeschritten (1-3 Jahre)
                            </option>
                            <option value="advanced" ${profile.experience === 'advanced' ? 'selected' : ''}>
                                Profi (> 3 Jahre)
                            </option>
                        </select>
                    </div>

                    <!-- Trainingshäufigkeit -->
                    <div class="form-group">
                        <label class="form-label">Trainings pro Woche</label>
                        <select id="profileFrequency" class="form-select" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary);">
                            <option value="2" ${profile.frequency === 2 ? 'selected' : ''}>2× pro Woche</option>
                            <option value="3" ${profile.frequency === 3 ? 'selected' : ''}>3× pro Woche</option>
                            <option value="4" ${profile.frequency === 4 ? 'selected' : ''}>4× pro Woche</option>
                            <option value="5" ${profile.frequency === 5 ? 'selected' : ''}>5× pro Woche</option>
                            <option value="6" ${profile.frequency === 6 ? 'selected' : ''}>6× pro Woche</option>
                            <option value="7" ${profile.frequency === 7 ? 'selected' : ''}>7× pro Woche</option>
                        </select>
                    </div>

                    <!-- Trainingsziel -->
                    <div class="form-group">
                        <label class="form-label">Trainingsziel</label>
                        <select id="profileGoals" class="form-select" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary);">
                            <option value="muscle_building" ${profile.goals === 'muscle_building' ? 'selected' : ''}>
                                Muskelaufbau
                            </option>
                            <option value="strength" ${profile.goals === 'strength' ? 'selected' : ''}>
                                Kraftaufbau
                            </option>
                            <option value="endurance" ${profile.goals === 'endurance' ? 'selected' : ''}>
                                Ausdauer
                            </option>
                        </select>
                    </div>
                </div>

                <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-info); margin-bottom: 1rem;">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <span style="font-size: 1.5rem;">💡</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 0.5rem;">Dein Profil</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                ${this.getProfileDescription(profile)}
                            </div>
                        </div>
                    </div>
                </div>

                <button id="saveProfileBtn" class="btn btn-primary" style="width: 100%;">
                    💾 Profil speichern
                </button>
            </div>
        `;
    }

    /**
     * Profil-Beschreibung
     */
    getProfileDescription(profile) {
        const expLabels = {
            'beginner': 'Anfänger',
            'intermediate': 'Fortgeschritten',
            'advanced': 'Profi'
        };

        const goalLabels = {
            'muscle_building': 'Muskelaufbau',
            'strength': 'Kraftaufbau',
            'endurance': 'Ausdauer'
        };

        return `
            Du bist <strong>${expLabels[profile.experience]}</strong> und trainierst 
            <strong>${profile.frequency}× pro Woche</strong> mit dem Ziel 
            <strong>${goalLabels[profile.goals]}</strong>.
            <br><br>
            Deine optimalen Volumen-Bereiche werden automatisch an dein Profil angepasst.
        `;
    }

    /**
     * ========================================
     * 2. APP-EINSTELLUNGEN
     * ========================================
     */

    renderAppSettings() {
        return `
            <div class="settings-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>⚙️</span>
                    <span>App-Einstellungen</span>
                </h3>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <!-- TV-Modus -->
                    <div class="setting-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div>
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">📺 TV-Modus</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Größere Schrift für bessere Lesbarkeit</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="tvModeToggle" ${this.features.tvMode ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>

                    <!-- Auto-Progression -->
                    <div class="setting-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div>
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">📈 Automatische Progression</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Gewichte automatisch erhöhen</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="autoProgressionToggle" ${this.features.autoProgression ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>

                    <!-- Sound-Effekte -->
                    <div class="setting-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div>
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">🔊 Sound-Effekte</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Töne bei Set-Abschluss und Timer</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="soundEffectsToggle" ${this.features.soundEffects ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>

                    <!-- Dark Mode -->
                    <div class="setting-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div>
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">🌙 Dark Mode</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Dunkles Farbschema</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="darkModeToggle" ${this.features.darkMode ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <button id="saveAppSettingsBtn" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    💾 Einstellungen speichern
                </button>
            </div>
        `;
    }

    /**
     * ========================================
     * 3. DATEN-VERWALTUNG
     * ========================================
     */

    renderDataManagement() {
        const sessions = this.store.getTrainingSessions();
        const workouts = this.store.getWorkouts();
        const exercises = this.store.getExercises();

        return `
            <div class="settings-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>💾</span>
                    <span>Daten-Verwaltung</span>
                </h3>

                <!-- Daten-Übersicht -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="stat-card">
                        <div class="stat-card-title">Trainings</div>
                        <div class="stat-card-value">${sessions.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Workouts</div>
                        <div class="stat-card-value">${workouts.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Übungen</div>
                        <div class="stat-card-value">${exercises.length}</div>
                    </div>
                </div>

                <!-- Export/Import Buttons -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <button class="btn btn-secondary" id="exportDataBtn">
                        📥 Daten exportieren
                    </button>
                    <button class="btn btn-secondary" id="importDataBtn">
                        📤 Daten importieren
                    </button>
                </div>

                <!-- Warnung -->
                <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-warning); margin-bottom: 1rem;">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <span style="font-size: 1.5rem;">⚠️</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 0.5rem;">Wichtig</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                Exportiere regelmäßig deine Daten als Backup. 
                                Beim Importieren werden alle aktuellen Daten überschrieben!
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alle Daten löschen -->
                <button class="btn btn-danger" id="clearDataBtn" style="width: 100%;">
                    🗑️ Alle Daten löschen
                </button>
            </div>
        `;
    }

    /**
     * ========================================
     * 4. ÜBER DIE APP
     * ========================================
     */

    renderAbout() {
        return `
            <div class="settings-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>ℹ️</span>
                    <span>Über Fitness Board</span>
                </h3>

                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">💪</div>
                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Fitness Board</div>
                    <div style="color: var(--text-secondary);">Version 1.0.0</div>
                </div>

                <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; margin-bottom: 1rem;">
                    <div style="font-weight: 500; margin-bottom: 0.5rem;">Features:</div>
                    <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                        <li>Workout-Verwaltung</li>
                        <li>Training-Tracking</li>
                        <li>Intelligente Volumen-Analyse</li>
                        <li>Regenerations-Tracking</li>
                        <li>Timer & Stoppuhr</li>
                        <li>Statistiken & Fortschritt</li>
                        <li>PWA-Support (Offline-fähig)</li>
                    </ul>
                </div>

                <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                    Made with ❤️ for fitness enthusiasts
                </div>
            </div>
        `;
    }

    /**
     * ========================================
     * EVENT-LISTENER
     * ========================================
     */

    /**
     * Settings Event-Listener
     */
    attachSettingsListeners() {
        // Profil speichern
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveUserProfile();
            });
        }

        // App-Einstellungen speichern
        const saveAppSettingsBtn = document.getElementById('saveAppSettingsBtn');
        if (saveAppSettingsBtn) {
            saveAppSettingsBtn.addEventListener('click', () => {
                this.saveAppSettings();
            });
        }

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
                this.clearAllData();
            });
        }
    }

    /**
     * ========================================
     * PROFIL-VERWALTUNG
     * ========================================
     */

    /**
     * Lade Benutzer-Profil
     */
    getUserProfile() {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
            return JSON.parse(saved);
        }

        // Standard-Profil
        return {
            experience: 'intermediate',
            frequency: 3,
            goals: 'muscle_building'
        };
    }

    /**
     * Speichere Benutzer-Profil
     */
    saveUserProfile() {
        console.log('💾 Speichere Profil...');

        // Werte aus Formular lesen
        const experienceEl = document.getElementById('profileExperience');
        const frequencyEl = document.getElementById('profileFrequency');
        const goalsEl = document.getElementById('profileGoals');

        // Debug: Prüfen ob Elemente existieren
        console.log('Experience Element:', experienceEl);
        console.log('Frequency Element:', frequencyEl);
        console.log('Goals Element:', goalsEl);

        if (!experienceEl || !frequencyEl || !goalsEl) {
            console.error('❌ Formular-Elemente nicht gefunden!');
            alert('Fehler: Formular-Elemente nicht gefunden!');
            return;
        }

        const profile = {
            experience: experienceEl.value,
            frequency: parseInt(frequencyEl.value),
            goals: goalsEl.value
        };

        console.log('Profil-Daten:', profile);

        // In localStorage speichern
        try {
            localStorage.setItem('userProfile', JSON.stringify(profile));
            console.log('✅ Profil in localStorage gespeichert');

            // Toast-Benachrichtigung
            if (this.eventBus) {
                this.eventBus.emit('showToast', {
                    message: '✅ Profil gespeichert!',
                    type: 'success'
                });
                console.log('✅ Toast-Event gesendet');
            } else {
                console.error('❌ EventBus nicht verfügbar!');
                alert('✅ Profil gespeichert!'); // Fallback
            }

            // Analyse-View aktualisieren falls offen
            this.eventBus.emit('profileUpdated', { profile });

        } catch (e) {
            console.error('❌ Fehler beim Speichern:', e);
            alert('❌ Fehler beim Speichern: ' + e.message);
        }
    }


    /**
     * ========================================
     * APP-EINSTELLUNGEN
     * ========================================
     */

    /**
     * Lade Feature Flags
     */
    loadFeatureFlags() {
        const saved = localStorage.getItem('fitnessboard_features');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Fehler beim Laden der Feature Flags:', e);
            }
        }

        // Standard-Features
        return {
            tvMode: false,
            autoProgression: true,
            soundEffects: true,
            darkMode: true
        };
    }

    /**
     * Speichere App-Einstellungen
     */
    saveAppSettings() {
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
        localStorage.setItem('fitnessboard_features', JSON.stringify(this.features));

        this.eventBus.emit('showToast', {
            message: '✅ Einstellungen gespeichert!',
            type: 'success'
        });

        // Features an App weitergeben
        this.eventBus.emit('featuresUpdated', { features: this.features });
    }

    /**
     * ========================================
     * DATEN-EXPORT/IMPORT
     * ========================================
     */

    /**
     * Daten exportieren
     */
    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            workouts: this.store.getWorkouts(),
            exercises: this.store.getExercises(),
            sessions: this.store.getTrainingSessions(),
            profile: this.getUserProfile(),
            features: this.features
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-board-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.eventBus.emit('showToast', {
            message: '✅ Daten exportiert!',
            type: 'success'
        });
    }

    /**
     * Daten importieren
     */
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

                    if (data.profile) {
                        localStorage.setItem('userProfile', JSON.stringify(data.profile));
                    }

                    if (data.features) {
                        this.features = data.features;
                        localStorage.setItem('fitnessboard_features', JSON.stringify(this.features));
                    }

                    this.eventBus.emit('showToast', {
                        message: '✅ Daten importiert!',
                        type: 'success'
                    });

                    // Seite neu laden
                    setTimeout(() => {
                        location.reload();
                    }, 1000);

                } catch (error) {
                    console.error('Import-Fehler:', error);
                    this.eventBus.emit('showToast', {
                        message: '❌ Fehler beim Importieren: ' + error.message,
                        type: 'error'
                    });
                }
            };

            reader.readAsText(file);
        });

        input.click();
    }

    /**
     * Alle Daten löschen
     */
    clearAllData() {
        if (!confirm('Wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden!')) {
            return;
        }

        // Zweite Bestätigung
        if (!confirm('Bist du dir SICHER? Alle Trainings, Workouts und Einstellungen werden gelöscht!')) {
            return;
        }

        this.store.clearAll();
        localStorage.removeItem('userProfile');
        localStorage.removeItem('fitnessboard_features');

        this.eventBus.emit('showToast', {
            message: '🗑️ Alle Daten gelöscht',
            type: 'info'
        });

        // Seite neu laden
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}
