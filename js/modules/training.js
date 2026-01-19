/**
 * ========================================
 * Training Module
 * ========================================
 * Verwaltet aktive Trainingseinheiten
 * - Training starten/beenden
 * - Sets abhaken
 * - Pausen-Timer
 * - Progression
 * - Notizen
 */

import { generateId, formatDate, formatTime } from '../utils.js';

export class TrainingModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.trainingContentEl = null;
        this.todayTrainingBtn = null;

        // State
        this.activeSession = null;
        this.currentWorkout = null;
        this.pauseTimer = null;
        this.pauseSeconds = 0;
        this.sessionStartTime = null;
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        this.trainingContentEl = document.getElementById('trainingContent');
        this.todayTrainingBtn = document.getElementById('todayTrainingBtn');

        // Event-Listener
        this.setupEventListeners();

        console.log('✅ Training-Modul initialisiert');
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // "Heute trainieren" Button
        if (this.todayTrainingBtn) {
            this.todayTrainingBtn.addEventListener('click', () => {
                this.startLastWorkout();
            });
        }

        // Event-Bus Listener
        this.eventBus.on('startTraining', (data) => {
            this.startTraining(data.workoutId);
        });

        this.eventBus.on('viewChanged', (data) => {
            if (data.view === 'training') {
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
     * Training-View rendern
     */
    render() {
        if (!this.trainingContentEl) return;

        if (this.activeSession) {
            this.renderActiveTraining();
        } else {
            this.renderWorkoutSelection();
        }
    }

    /**
     * Workout-Auswahl rendern
     */
    renderWorkoutSelection() {
        const workouts = this.store.getWorkouts();
        const lastWorkoutId = this.store.getLastWorkoutId();

        if (workouts.length === 0) {
            this.trainingContentEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏋️</div>
                    <div class="empty-state-title">Keine Workouts vorhanden</div>
                    <div class="empty-state-text">Erstelle zuerst ein Workout im Workouts-Tab</div>
                </div>
            `;
            return;
        }

        this.trainingContentEl.innerHTML = `
            <div class="training-selection">
                <h2 style="margin-bottom: 1.5rem;">Workout auswählen</h2>
                <div class="workouts-grid">
                    ${workouts.map(workout => this.renderWorkoutSelectionCard(workout, workout.id === lastWorkoutId)).join('')}
                </div>
            </div>
        `;

        // Event-Listener für Start-Buttons
        this.trainingContentEl.querySelectorAll('[data-start-workout]').forEach(btn => {
            btn.addEventListener('click', () => {
                const workoutId = btn.dataset.startWorkout;
                this.startTraining(workoutId);
            });
        });
    }

    /**
     * Workout-Auswahl-Karte rendern
     * @param {Object} workout - Workout
     * @param {boolean} isLast - Ist letztes Workout
     * @returns {string} HTML
     */
    renderWorkoutSelectionCard(workout, isLast) {
        const exerciseCount = workout.exercises?.length || 0;
        const lastSession = this.store.getLastSessionForWorkout(workout.id);

        return `
            <div class="workout-card ${isLast ? 'recommended' : ''}" style="${isLast ? 'border: 2px solid var(--accent-primary);' : ''}">
                ${isLast ? '<div class="badge badge-success" style="margin-bottom: 0.5rem;">Zuletzt trainiert</div>' : ''}
                <div class="workout-card-title">${workout.name}</div>
                <div class="workout-card-info">
                    <span>📊 ${exerciseCount} Übungen</span>
                    ${lastSession ? `<span>📅 ${formatDate(lastSession.date, 'DD.MM.YYYY')}</span>` : ''}
                </div>
                <button class="btn btn-primary" data-start-workout="${workout.id}" style="width: 100%; margin-top: 1rem;">
                    🏋️ Training starten
                </button>
            </div>
        `;
    }

    /**
     * Aktives Training rendern
     */
    renderActiveTraining() {
        if (!this.activeSession || !this.currentWorkout) return;

        const completedSets = this.getCompletedSetsCount();
        const totalSets = this.getTotalSetsCount();
        const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

        this.trainingContentEl.innerHTML = `
            <div class="training-session">
                <div class="training-header">
                    <div>
                        <div class="training-title">${this.currentWorkout.name}</div>
                        <div class="training-info">
                            Gestartet: ${formatDate(this.sessionStartTime, 'DD.MM.YYYY HH:mm')}
                        </div>
                    </div>
                    <button class="btn btn-danger" id="finishTrainingBtn">
                        ✓ Training beenden
                    </button>
                </div>

                <div class="progress-bar" style="margin: 1.5rem 0;">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div style="text-align: center; color: var(--text-secondary); margin-bottom: 2rem;">
                    ${completedSets} / ${totalSets} Sets abgeschlossen (${progress}%)
                </div>

                <div class="exercise-list" id="exercisesList">
                    ${this.renderExercisesList()}
                </div>
            </div>
        `;

        // Event-Listener
        this.attachTrainingListeners();
    }

    /**
     * Übungsliste für aktives Training rendern
     * @returns {string} HTML
     */
    renderExercisesList() {
        return this.activeSession.exercises.map((sessionEx, exIndex) => {
            const exercise = this.store.getExercise(sessionEx.exerciseId);
            if (!exercise) return '';

            const completedSets = sessionEx.sets.filter(s => s.completed).length;
            const totalSets = sessionEx.sets.length;

            return `
                <div class="exercise-card" data-exercise-index="${exIndex}">
                    <div class="exercise-card-header">
                        <div>
                            <div class="exercise-card-title">${exercise.name}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${exercise.muscleGroup} • ${exercise.equipment}
                            </div>
                        </div>
                        <div class="badge ${completedSets === totalSets ? 'badge-success' : 'badge-info'}">
                            ${completedSets}/${totalSets} Sets
                        </div>
                    </div>

                    <div class="set-list">
                        ${sessionEx.sets.map((set, setIndex) => this.renderSetItem(set, setIndex, exIndex)).join('')}
                    </div>

                    <div style="margin-top: 1rem;">
                        <button class="btn btn-secondary" data-action="add-note" data-exercise-index="${exIndex}">
                            📝 Notiz hinzufügen
                        </button>
                    </div>

                    ${sessionEx.notes ? `
                        <div style="margin-top: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px;">
                            <strong>Notiz:</strong> ${sessionEx.notes}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Set-Item rendern
     * @param {Object} set - Set-Daten
     * @param {number} setIndex - Set-Index
     * @param {number} exIndex - Exercise-Index
     * @returns {string} HTML
     */
    renderSetItem(set, setIndex, exIndex) {
        const lastSession = this.getLastSessionData(exIndex);
        const lastSet = lastSession?.sets?.[setIndex];
        const progression = this.calculateProgression(set, lastSet);

        return `
            <div class="set-item ${set.completed ? 'completed' : ''}" data-exercise-index="${exIndex}" data-set-index="${setIndex}">
                <input 
                    type="checkbox" 
                    class="set-checkbox" 
                    ${set.completed ? 'checked' : ''}
                    data-exercise-index="${exIndex}" 
                    data-set-index="${setIndex}"
                >
                <div class="set-number">Set ${setIndex + 1}</div>
                <div class="set-inputs">
                    <input 
                        type="number" 
                        class="set-input" 
                        placeholder="Gewicht (kg)" 
                        value="${set.weight || ''}"
                        data-field="weight"
                        data-exercise-index="${exIndex}" 
                        data-set-index="${setIndex}"
                        ${set.completed ? 'readonly' : ''}
                    >
                    <input 
                        type="number" 
                        class="set-input" 
                        placeholder="Wdh." 
                        value="${set.reps || ''}"
                        data-field="reps"
                        data-exercise-index="${exIndex}" 
                        data-set-index="${setIndex}"
                        ${set.completed ? 'readonly' : ''}
                    >
                </div>
                ${progression ? `
                    <div class="set-progression" style="font-size: 0.85rem; color: ${progression.color};">
                        ${progression.text}
                    </div>
                ` : ''}
                ${lastSet ? `
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        Letztes Mal: ${lastSet.weight}kg × ${lastSet.reps}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * ========================================
     * Training starten/beenden
     * ========================================
     */

    /**
     * Training starten
     * @param {string} workoutId - Workout ID
     */
    startTraining(workoutId) {
        const workout = this.store.getWorkout(workoutId);
        if (!workout) {
            this.eventBus.emit('error', { message: 'Workout nicht gefunden' });
            return;
        }

        this.currentWorkout = workout;
        this.sessionStartTime = new Date();

        // Session-Objekt erstellen
        this.activeSession = {
            id: generateId(),
            workoutId: workout.id,
            date: this.sessionStartTime.toISOString(),
            exercises: workout.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                sets: Array.from({ length: ex.sets }, (_, i) => ({
                    setNumber: i + 1,
                    weight: ex.weight || 0,
                    reps: ex.reps || 0,
                    completed: false,
                    completedAt: null
                })),
                notes: ''
            }))
        };

        this.eventBus.emit('trainingStarted', { workout });
        this.render();
    }

    /**
     * Letztes Workout starten
     */
    startLastWorkout() {
        const lastWorkoutId = this.store.getLastWorkoutId();

        if (!lastWorkoutId) {
            this.eventBus.emit('error', { message: 'Kein letztes Workout gefunden' });
            return;
        }

        this.startTraining(lastWorkoutId);
    }

    /**
     * Training beenden
     */
    finishTraining() {
        if (!this.activeSession) return;

        const completedSets = this.getCompletedSetsCount();
        const totalSets = this.getTotalSetsCount();

        if (completedSets === 0) {
            this.eventBus.emit('showModal', {
                title: 'Training abbrechen?',
                content: '<p>Du hast noch keine Sets abgeschlossen. Möchtest du das Training wirklich beenden?</p>',
                buttons: [
                    {
                        text: 'Ja, beenden',
                        className: 'btn-danger',
                        onClick: () => {
                            this.cancelTraining();
                        }
                    },
                    {
                        text: 'Weiter trainieren',
                        className: 'btn-primary',
                        onClick: () => {
                            this.eventBus.emit('closeModal');
                        }
                    }
                ]
            });
            return;
        }

        // Session speichern
        this.activeSession.completedAt = new Date().toISOString();
        this.activeSession.duration = Math.floor((new Date() - this.sessionStartTime) / 1000);

        this.store.saveTrainingSession(this.activeSession);

        this.eventBus.emit('trainingFinished', { session: this.activeSession });

        // Zusammenfassung anzeigen
        this.showTrainingSummary();

        // Session zurücksetzen
        this.resetSession();
    }

    /**
     * Training abbrechen
     */
    cancelTraining() {
        this.resetSession();
        this.eventBus.emit('closeModal');
        this.render();
    }

    /**
     * Session zurücksetzen
     */
    resetSession() {
        this.activeSession = null;
        this.currentWorkout = null;
        this.sessionStartTime = null;
        this.stopPauseTimer();
    }

    /**
     * ========================================
     * Set-Handling
     * ========================================
     */

    /**
     * Training Event-Listener
     */
    attachTrainingListeners() {
        // Finish-Button
        const finishBtn = document.getElementById('finishTrainingBtn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                this.finishTraining();
            });
        }

        // Set-Checkboxen
        this.trainingContentEl.querySelectorAll('.set-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const exIndex = parseInt(e.target.dataset.exerciseIndex);
                const setIndex = parseInt(e.target.dataset.setIndex);
                this.toggleSet(exIndex, setIndex, e.target.checked);
            });
        });

        // Set-Inputs
        this.trainingContentEl.querySelectorAll('.set-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const exIndex = parseInt(e.target.dataset.exerciseIndex);
                const setIndex = parseInt(e.target.dataset.setIndex);
                const field = e.target.dataset.field;
                const value = parseFloat(e.target.value) || 0;
                this.updateSetValue(exIndex, setIndex, field, value);
            });
        });

        // Notiz-Buttons
        this.trainingContentEl.querySelectorAll('[data-action="add-note"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const exIndex = parseInt(btn.dataset.exerciseIndex);
                this.showAddNoteModal(exIndex);
            });
        });
    }

    /**
     * Set abhaken/abhaken rückgängig machen
     * @param {number} exIndex - Exercise-Index
     * @param {number} setIndex - Set-Index
     * @param {boolean} completed - Abgeschlossen?
     */
    toggleSet(exIndex, setIndex, completed) {
        const set = this.activeSession.exercises[exIndex].sets[setIndex];

        set.completed = completed;
        set.completedAt = completed ? new Date().toISOString() : null;

        if (completed) {
            // Sound-Effekt
            this.eventBus.emit('setCompleted', { exIndex, setIndex });

            // Pausen-Timer starten
            this.startPauseTimer();
        }

        // UI aktualisieren
        this.render();
    }

    /**
     * Set-Wert aktualisieren
     * @param {number} exIndex - Exercise-Index
     * @param {number} setIndex - Set-Index
     * @param {string} field - Feld (weight/reps)
     * @param {number} value - Wert
     */
    updateSetValue(exIndex, setIndex, field, value) {
        const set = this.activeSession.exercises[exIndex].sets[setIndex];
        set[field] = value;
    }

    /**
     * ========================================
     * Pausen-Timer
     * ========================================
     */

    /**
     * Pausen-Timer starten
     */
    startPauseTimer() {
        this.stopPauseTimer();

        this.pauseSeconds = 90; // 90 Sekunden Standard-Pause

        this.pauseTimer = setInterval(() => {
            this.pauseSeconds--;

            if (this.pauseSeconds <= 0) {
                this.stopPauseTimer();
                this.eventBus.emit('showToast', {
                    message: 'Pause vorbei! Nächster Satz! 💪',
                    type: 'info'
                });
            }
        }, 1000);
    }

    /**
     * Pausen-Timer stoppen
     */
    stopPauseTimer() {
        if (this.pauseTimer) {
            clearInterval(this.pauseTimer);
            this.pauseTimer = null;
        }
        this.pauseSeconds = 0;
    }

    /**
     * ========================================
     * Notizen
     * ========================================
     */

    /**
     * Notiz-Modal anzeigen
     * @param {number} exIndex - Exercise-Index
     */
    showAddNoteModal(exIndex) {
        const exercise = this.store.getExercise(this.activeSession.exercises[exIndex].exerciseId);
        const currentNote = this.activeSession.exercises[exIndex].notes || '';

        const modalContent = `
            <form id="noteForm">
                <div class="form-group">
                    <label class="form-label">Notiz für ${exercise.name}</label>
                    <textarea 
                        class="form-textarea" 
                        id="exerciseNote" 
                        placeholder="z.B. Technik-Hinweise, Gefühl, Anpassungen..."
                        rows="5"
                    >${currentNote}</textarea>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: 'Speichern',
                className: 'btn-primary',
                onClick: () => {
                    const note = document.getElementById('exerciseNote')?.value.trim();
                    this.activeSession.exercises[exIndex].notes = note;
                    this.eventBus.emit('closeModal');
                    this.render();
                }
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                }
            }
        ];

        this.eventBus.emit('showModal', {
            title: 'Notiz hinzufügen',
            content: modalContent,
            buttons
        });
    }

    /**
     * ========================================
     * Progression & Statistiken
     * ========================================
     */

    /**
     * Letzte Session-Daten für Übung
     * @param {number} exIndex - Exercise-Index
     * @returns {Object|null}
     */
    getLastSessionData(exIndex) {
        const exerciseId = this.activeSession.exercises[exIndex].exerciseId;
        const sessions = this.store.getSessionsByWorkout(this.currentWorkout.id);

        if (sessions.length === 0) return null;

        const lastSession = sessions[0];
        return lastSession.exercises?.find(ex => ex.exerciseId === exerciseId);
    }

    /**
     * Progression berechnen
     * @param {Object} currentSet - Aktueller Set
     * @param {Object} lastSet - Letzter Set
     * @returns {Object|null}
     */
    calculateProgression(currentSet, lastSet) {
        if (!lastSet) return null;

        const currentVolume = currentSet.weight * currentSet.reps;
        const lastVolume = lastSet.weight * lastSet.reps;

        if (currentVolume > lastVolume) {
            const increase = ((currentVolume - lastVolume) / lastVolume * 100).toFixed(1);
            return {
                text: `↗ +${increase}%`,
                color: 'var(--accent-primary)'
            };
        } else if (currentVolume < lastVolume) {
            const decrease = ((lastVolume - currentVolume) / lastVolume * 100).toFixed(1);
            return {
                text: `↘ -${decrease}%`,
                color: 'var(--accent-danger)'
            };
        } else {
            return {
                text: '→ Gleich',
                color: 'var(--text-secondary)'
            };
        }
    }

    /**
     * Anzahl abgeschlossener Sets
     * @returns {number}
     */
    getCompletedSetsCount() {
        if (!this.activeSession) return 0;

        return this.activeSession.exercises.reduce((total, ex) => {
            return total + ex.sets.filter(s => s.completed).length;
        }, 0);
    }

    /**
     * Gesamtanzahl Sets
     * @returns {number}
     */
    getTotalSetsCount() {
        if (!this.activeSession) return 0;

        return this.activeSession.exercises.reduce((total, ex) => {
            return total + ex.sets.length;
        }, 0);
    }

    /**
     * ========================================
     * Training-Zusammenfassung
     * ========================================
     */

    /**
     * Training-Zusammenfassung anzeigen
     */
    showTrainingSummary() {
        const duration = this.activeSession.duration;
        const completedSets = this.getCompletedSetsCount();
        const totalSets = this.getTotalSetsCount();
        const totalVolume = this.calculateTotalVolume();

        const modalContent = `
            <div class="training-summary">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                    <h2 style="color: var(--accent-primary); margin-bottom: 0.5rem;">Training abgeschlossen!</h2>
                    <p style="color: var(--text-secondary);">Großartige Leistung! 💪</p>
                </div>

                <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card">
                        <div class="stat-card-title">Dauer</div>
                        <div class="stat-card-value">${Math.floor(duration / 60)}min</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Sets</div>
                        <div class="stat-card-value">${completedSets}/${totalSets}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Volumen</div>
                        <div class="stat-card-value">${totalVolume}kg</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Übungen</div>
                        <div class="stat-card-value">${this.activeSession.exercises.length}</div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Übungen</label>
                    ${this.activeSession.exercises.map(ex => {
            const exercise = this.store.getExercise(ex.exerciseId);
            const completedSets = ex.sets.filter(s => s.completed).length;
            return `
                            <div class="exercise-item" style="margin-bottom: 0.5rem;">
                                <span>${exercise?.name || 'Unbekannt'}</span>
                                <span class="badge badge-success">${completedSets}/${ex.sets.length} Sets</span>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        const buttons = [
            {
                text: '📊 Statistiken ansehen',
                className: 'btn-primary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                    // Zur Stats-View wechseln
                    document.querySelector('[data-view="stats"]')?.click();
                }
            },
            {
                text: 'Schließen',
                className: 'btn-secondary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                }
            }
        ];

        this.eventBus.emit('showModal', {
            title: this.currentWorkout.name,
            content: modalContent,
            buttons
        });
    }

    /**
     * Gesamtvolumen berechnen
     * @returns {number}
     */
    calculateTotalVolume() {
        if (!this.activeSession) return 0;

        return this.activeSession.exercises.reduce((total, ex) => {
            return total + ex.sets.reduce((exTotal, set) => {
                return set.completed ? exTotal + (set.weight * set.reps) : exTotal;
            }, 0);
        }, 0);
    }

    /**
     * ========================================
     * Utility-Methoden
     * ========================================
     */

    /**
     * Aktive Session prüfen
     * @returns {boolean}
     */
    hasActiveSession() {
        return this.activeSession !== null;
    }

    /**
     * Aktuelle Session abrufen
     * @returns {Object|null}
     */
    getActiveSession() {
        return this.activeSession;
    }

    /**
     * Training-Fortschritt in Prozent
     * @returns {number}
     */
    getProgress() {
        const completed = this.getCompletedSetsCount();
        const total = this.getTotalSetsCount();
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    /**
     * Verbleibende Sets
     * @returns {number}
     */
    getRemainingSets() {
        return this.getTotalSetsCount() - this.getCompletedSetsCount();
    }

    /**
     * Geschätzte verbleibende Zeit (basierend auf Durchschnitt)
     * @returns {number} Sekunden
     */
    getEstimatedTimeRemaining() {
        if (!this.sessionStartTime) return 0;

        const elapsed = (new Date() - this.sessionStartTime) / 1000;
        const completed = this.getCompletedSetsCount();
        const remaining = this.getRemainingSets();

        if (completed === 0) return 0;

        const avgTimePerSet = elapsed / completed;
        return Math.round(avgTimePerSet * remaining);
    }

    /**
     * Auto-Save (für Wiederherstellung bei Reload)
     */
    autoSave() {
        if (this.activeSession) {
            localStorage.setItem('activeTrainingSession', JSON.stringify({
                session: this.activeSession,
                workout: this.currentWorkout,
                startTime: this.sessionStartTime
            }));
        } else {
            localStorage.removeItem('activeTrainingSession');
        }
    }

    /**
     * Session wiederherstellen
     */
    restoreSession() {
        const saved = localStorage.getItem('activeTrainingSession');
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            this.activeSession = data.session;
            this.currentWorkout = data.workout;
            this.sessionStartTime = new Date(data.startTime);

            this.eventBus.emit('showToast', {
                message: 'Training wiederhergestellt',
                type: 'info'
            });

            return true;
        } catch (e) {
            console.error('Fehler beim Wiederherstellen:', e);
            return false;
        }
    }
}
