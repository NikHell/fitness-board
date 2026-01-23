/**
 * ========================================
 * Workout Module
 * ========================================
 * Verwaltet Workouts und Übungsbibliothek
 * - Workouts erstellen, bearbeiten, löschen
 * - Übungen zur Bibliothek hinzufügen
 * - Workouts klonen
 */

import { generateId, formatDate, capitalize, isEmpty } from '../utils.js';

export class WorkoutModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.workoutsListEl = null;
        this.createWorkoutBtn = null;

        // State
        this.currentWorkout = null;
        this.editMode = false;
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        this.workoutsListEl = document.getElementById('workoutsList');
        this.createWorkoutBtn = document.getElementById('createWorkoutBtn');

        // Event-Listener
        this.setupEventListeners();

        console.log('✅ Workout-Modul initialisiert');
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Create Workout Button
        if (this.createWorkoutBtn) {
            this.createWorkoutBtn.addEventListener('click', () => {
                this.showCreateModal();
            });
        }

        // Event-Bus Listener
        this.eventBus.on('viewChanged', (data) => {
            if (data.view === 'workouts') {
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
     * Workouts-Liste rendern
     */
    render() {
        if (!this.workoutsListEl) return;

        const workouts = this.store.getWorkouts();

        if (workouts.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.workoutsListEl.innerHTML = workouts
            .map(workout => this.renderWorkoutCard(workout))
            .join('');

        // Event-Listener für Karten
        this.attachCardListeners();
    }

    /**
     * Einzelne Workout-Karte rendern
     * @param {Object} workout - Workout-Objekt
     * @returns {string} HTML
     */
    renderWorkoutCard(workout) {
        const exerciseCount = workout.exercises?.length || 0;
        const totalSets = workout.exercises?.reduce((sum, ex) => sum + (ex.sets || 0), 0) || 0;

        // Letzte Session für dieses Workout
        const lastSession = this.store.getLastSessionForWorkout(workout.id);
        const lastTrainedText = lastSession
            ? `Zuletzt: ${formatDate(lastSession.date, 'DD.MM.YYYY')}`
            : 'Noch nicht trainiert';

        return `
            <div class="workout-card" data-workout-id="${workout.id}">
                <div class="workout-card-header">
                    <div>
                        <div class="workout-card-title">${workout.name}</div>
                        ${workout.description ? `<div class="workout-card-info">${workout.description}</div>` : ''}
                    </div>
                    <div class="workout-card-actions">
                        <button class="icon-btn" data-action="edit" title="Bearbeiten">✏️</button>
                        <button class="icon-btn" data-action="clone" title="Klonen">📋</button>
                        <button class="icon-btn" data-action="delete" title="Löschen">🗑️</button>
                    </div>
                </div>
                
                <div class="workout-card-info">
                    <span>📊 ${exerciseCount} Übungen</span>
                    <span>🔢 ${totalSets} Sets</span>
                    <span>📅 ${lastTrainedText}</span>
                </div>

                <div class="workout-card-exercises">
                    ${this.renderExercisesList(workout.exercises)}
                </div>

                <div class="workout-card-footer" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" data-action="start" style="flex: 1;">
                        🏋️ Training starten
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Übungsliste für Workout-Karte rendern
     * @param {Array} exercises - Übungen
     * @returns {string} HTML
     */
    renderExercisesList(exercises) {
        if (!exercises || exercises.length === 0) {
            return '<div class="exercise-item">Keine Übungen</div>';
        }

        return exercises.slice(0, 3).map(ex => {
            const exercise = this.store.getExercise(ex.exerciseId);
            if (!exercise) return '';

            return `
                <div class="exercise-item">
                    <span class="exercise-name">${exercise.name}</span>
                    <span class="exercise-details">${ex.sets}×${ex.reps} ${ex.weight ? `@ ${ex.weight}kg` : ''}</span>
                </div>
            `;
        }).join('') + (exercises.length > 3 ? `<div class="exercise-item">+ ${exercises.length - 3} weitere</div>` : '');
    }

    /**
     * Empty State rendern
     */
    renderEmptyState() {
        this.workoutsListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏋️</div>
                <div class="empty-state-title">Noch keine Workouts</div>
                <div class="empty-state-text">Erstelle dein erstes Workout, um loszulegen!</div>
                <button class="btn btn-primary" id="createFirstWorkout">
                    + Erstes Workout erstellen
                </button>
            </div>
        `;

        // Event-Listener für Button
        const btn = document.getElementById('createFirstWorkout');
        if (btn) {
            btn.addEventListener('click', () => this.showCreateModal());
        }
    }

    /**
     * Event-Listener für Workout-Karten
     */
    attachCardListeners() {
        const cards = this.workoutsListEl.querySelectorAll('.workout-card');

        cards.forEach(card => {
            const workoutId = card.dataset.workoutId;

            // Action-Buttons
            card.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    this.handleCardAction(action, workoutId);
                });
            });

            // Karte klicken = Details anzeigen
            card.addEventListener('click', (e) => {
                if (!e.target.closest('[data-action]')) {
                    this.showWorkoutDetails(workoutId);
                }
            });
        });
    }

    /**
     * Karten-Aktionen behandeln
     * @param {string} action - Aktion
     * @param {string} workoutId - Workout ID
     */
    handleCardAction(action, workoutId) {
        switch(action) {
            case 'edit':
                this.showEditModal(workoutId);
                break;
            case 'clone':
                this.cloneWorkout(workoutId);
                break;
            case 'delete':
                this.deleteWorkout(workoutId);
                break;
            case 'start':
                this.startTraining(workoutId);
                break;
        }
    }

    /**
     * ========================================
     * Workout erstellen/bearbeiten
     * ========================================
     */

    /**
     * Create-Modal anzeigen
     */
    showCreateModal() {
        this.editMode = false;
        this.currentWorkout = null;
        this.showWorkoutModal();
    }

    /**
     * Edit-Modal anzeigen
     * @param {string} workoutId - Workout ID
     */
    showEditModal(workoutId) {
        this.editMode = true;
        this.currentWorkout = this.store.getWorkout(workoutId);

        if (!this.currentWorkout) {
            this.eventBus.emit('error', { message: 'Workout nicht gefunden' });
            return;
        }

        this.showWorkoutModal();
    }

    /**
     * Workout-Modal anzeigen
     */
    showWorkoutModal() {
        const title = this.editMode ? 'Workout bearbeiten' : 'Neues Workout';
        const workout = this.currentWorkout || { name: '', description: '', exercises: [] };

        const modalContent = `
            <form id="workoutForm">
                <div class="form-group">
                    <label class="form-label">Workout-Name *</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        id="workoutName" 
                        value="${workout.name || ''}"
                        placeholder="z.B. Push Day, Leg Day..."
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">Beschreibung</label>
                    <textarea 
                        class="form-textarea" 
                        id="workoutDescription"
                        placeholder="Optional: Beschreibung des Workouts..."
                    >${workout.description || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Übungen</label>
                    <div id="exercisesList"></div>
                    <button type="button" class="btn btn-secondary mt-2" id="addExerciseBtn">
                        + Übung hinzufügen
                    </button>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: this.editMode ? 'Speichern' : 'Erstellen',
                className: 'btn-primary',
                onClick: () => this.saveWorkout()
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => this.eventBus.emit('closeModal')
            }
        ];

        this.eventBus.emit('showModal', { title, content: modalContent, buttons });

        // Nach Modal-Rendering
        setTimeout(() => {
            this.renderExercisesInModal(workout.exercises || []);
            this.setupModalListeners();
        }, 100);
    }

    /**
     * Übungen im Modal rendern
     * @param {Array} exercises - Übungen
     */
    renderExercisesInModal(exercises) {
        const listEl = document.getElementById('exercisesList');
        if (!listEl) return;

        if (exercises.length === 0) {
            listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;">Noch keine Übungen hinzugefügt</p>';
            return;
        }

        listEl.innerHTML = exercises.map((ex, index) => {
            const exercise = this.store.getExercise(ex.exerciseId);
            if (!exercise) return '';

            return `
                <div class="exercise-item" data-index="${index}" style="margin-bottom: 0.5rem;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${exercise.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${ex.sets} Sets × ${ex.reps} Wdh. ${ex.weight ? `@ ${ex.weight}kg` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="button" class="icon-btn" data-action="edit-exercise" data-index="${index}">✏️</button>
                        <button type="button" class="icon-btn" data-action="remove-exercise" data-index="${index}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Event-Listener
        listEl.querySelectorAll('[data-action="edit-exercise"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.editExerciseInWorkout(index);
            });
        });

        listEl.querySelectorAll('[data-action="remove-exercise"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.removeExerciseFromWorkout(index);
            });
        });
    }

    /**
     * Modal Event-Listener
     */
    setupModalListeners() {
        const addBtn = document.getElementById('addExerciseBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddExerciseModal();
            });
        }
    }

    /**
     * ========================================
     * Übungen verwalten
     * ========================================
     */

    /**
     * Modal zum Hinzufügen einer Übung
     */
    showAddExerciseModal() {
        const exercises = this.store.getExercises();

        const modalContent = `
            <form id="addExerciseForm">
                <div class="form-group">
                    <label class="form-label">Übung auswählen</label>
                    <select class="form-select" id="exerciseSelect" required>
                        <option value="">-- Übung wählen --</option>
                        ${exercises.map(ex => `
                            <option value="${ex.id}">${ex.name} (${ex.muscleGroup})</option>
                        `).join('')}
                    </select>
                    <button type="button" class="btn btn-secondary mt-2" id="createNewExerciseBtn">
                        + Neue Übung erstellen
                    </button>
                </div>

                <div class="form-group">
                    <label class="form-label">Sets *</label>
                    <input type="number" class="form-input" id="exerciseSets" value="3" min="1" max="10" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Wiederholungen *</label>
                    <input type="number" class="form-input" id="exerciseReps" value="10" min="1" max="50" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Gewicht (kg)</label>
                    <input type="number" class="form-input" id="exerciseWeight" value="0" min="0" step="2.5">
                </div>

                <div class="form-group">
                    <label class="form-label">Notizen</label>
                    <textarea class="form-textarea" id="exerciseNotes" placeholder="Optional: Technik-Hinweise, Tipps..."></textarea>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: 'Hinzufügen',
                className: 'btn-primary',
                onClick: () => this.addExerciseToWorkout()
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                    setTimeout(() => this.showWorkoutModal(), 100);
                }
            }
        ];

        this.eventBus.emit('showModal', {
            title: 'Übung hinzufügen',
            content: modalContent,
            buttons
        });

        // Event-Listener für "Neue Übung erstellen"
        setTimeout(() => {
            const createBtn = document.getElementById('createNewExerciseBtn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.showCreateExerciseModal();
                });
            }
        }, 100);
    }

    /**
     * Übung zum Workout hinzufügen
     */
    addExerciseToWorkout() {
        const exerciseId = document.getElementById('exerciseSelect')?.value;
        const sets = parseInt(document.getElementById('exerciseSets')?.value);
        const reps = parseInt(document.getElementById('exerciseReps')?.value);
        const weight = parseFloat(document.getElementById('exerciseWeight')?.value) || 0;
        const notes = document.getElementById('exerciseNotes')?.value || '';

        if (!exerciseId) {
            this.eventBus.emit('error', { message: 'Bitte Übung auswählen' });
            return;
        }

        // Workout-Objekt aktualisieren
        if (!this.currentWorkout) {
            this.currentWorkout = { exercises: [] };
        }
        if (!this.currentWorkout.exercises) {
            this.currentWorkout.exercises = [];
        }

        this.currentWorkout.exercises.push({
            exerciseId,
            sets,
            reps,
            weight,
            notes
        });

        // Modal schließen und Workout-Modal neu anzeigen
        this.eventBus.emit('closeModal');
        setTimeout(() => this.showWorkoutModal(), 100);
    }

    /**
     * Übung im Workout bearbeiten
     * @param {number} index - Index der Übung
     */
    editExerciseInWorkout(index) {
        const exercise = this.currentWorkout.exercises[index];
        const exerciseData = this.store.getExercise(exercise.exerciseId);

        const modalContent = `
            <form id="editExerciseForm">
                <div class="form-group">
                    <label class="form-label">Übung</label>
                    <input type="text" class="form-input" value="${exerciseData.name}" disabled>
                </div>

                <div class="form-group">
                    <label class="form-label">Sets *</label>
                    <input type="number" class="form-input" id="exerciseSets" value="${exercise.sets}" min="1" max="10" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Wiederholungen *</label>
                    <input type="number" class="form-input" id="exerciseReps" value="${exercise.reps}" min="1" max="50" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Gewicht (kg)</label>
                    <input type="number" class="form-input" id="exerciseWeight" value="${exercise.weight || 0}" min="0" step="2.5">
                </div>

                <div class="form-group">
                    <label class="form-label">Notizen</label>
                    <textarea class="form-textarea" id="exerciseNotes">${exercise.notes || ''}</textarea>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: 'Speichern',
                className: 'btn-primary',
                onClick: () => {
                    this.currentWorkout.exercises[index] = {
                        ...exercise,
                        sets: parseInt(document.getElementById('exerciseSets').value),
                        reps: parseInt(document.getElementById('exerciseReps').value),
                        weight: parseFloat(document.getElementById('exerciseWeight').value) || 0,
                        notes: document.getElementById('exerciseNotes').value
                    };
                    this.eventBus.emit('closeModal');
                    setTimeout(() => this.showWorkoutModal(), 100);
                }
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                    setTimeout(() => this.showWorkoutModal(), 100);
                }
            }
        ];

        this.eventBus.emit('showModal', {
            title: 'Übung bearbeiten',
            content: modalContent,
            buttons
        });
    }

    /**
     * Übung aus Workout entfernen
     * @param {number} index - Index der Übung
     */
    removeExerciseFromWorkout(index) {
        if (confirm('Übung wirklich entfernen?')) {
            this.currentWorkout.exercises.splice(index, 1);
            this.renderExercisesInModal(this.currentWorkout.exercises);
        }
    }

    /**
     * ========================================
     * Neue Übung erstellen
     * ========================================
     */

    /**
     * Modal zum Erstellen einer neuen Übung
     */
    showCreateExerciseModal() {
        const modalContent = `
            <form id="createExerciseForm">
                <div class="form-group">
                    <label class="form-label">Übungsname *</label>
                    <input type="text" class="form-input" id="newExerciseName" placeholder="z.B. Bankdrücken" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Muskelgruppe *</label>
                    <select class="form-select" id="newExerciseMuscleGroup" required>
                        <option value="">-- Auswählen --</option>
                        <option value="Brust">Brust</option>
                        <option value="Rücken">Rücken</option>
                        <option value="Beine">Beine</option>
                        <option value="Schultern">Schultern</option>
                        <option value="Bizeps">Bizeps</option>
                        <option value="Trizeps">Trizeps</option>
                        <option value="Bauch">Bauch</option>
                        <option value="Ganzkörper">Ganzkörper</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Equipment *</label>
                    <select class="form-select" id="newExerciseEquipment" required>
                        <option value="">-- Auswählen --</option>
                        <option value="Langhantel">Langhantel</option>
                        <option value="Kurzhantel">Kurzhantel</option>
                        <option value="Maschine">Maschine</option>
                        <option value="Kabel">Kabel</option>
                        <option value="Körpergewicht">Körpergewicht</option>
                        <option value="Kettlebell">Kettlebell</option>
                        <option value="Sonstiges">Sonstiges</option>
                    </select>
                </div>
            </form>
        `;

        const buttons = [
            {
                text: 'Erstellen',
                className: 'btn-primary',
                onClick: () => this.createNewExercise()
            },
            {
                text: 'Abbrechen',
                className: 'btn-secondary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                    setTimeout(() => this.showAddExerciseModal(), 100);
                }
            }
        ];

        this.eventBus.emit('showModal', {
            title: 'Neue Übung erstellen',
            content: modalContent,
            buttons
        });
    }

    /**
     * Neue Übung erstellen und speichern
     */
    createNewExercise() {
        const name = document.getElementById('newExerciseName')?.value.trim();
        const muscleGroup = document.getElementById('newExerciseMuscleGroup')?.value;
        const equipment = document.getElementById('newExerciseEquipment')?.value;

        if (!name || !muscleGroup || !equipment) {
            this.eventBus.emit('error', { message: 'Bitte alle Felder ausfüllen' });
            return;
        }

        const exercise = {
            name,
            muscleGroup,
            equipment
        };

        this.store.saveExercise(exercise);
        this.eventBus.emit('exerciseCreated', { exercise });

        // Zurück zum "Übung hinzufügen" Modal
        this.eventBus.emit('closeModal');
        setTimeout(() => this.showAddExerciseModal(), 100);
    }

    /**
     * ========================================
     * Workout speichern
     * ========================================
     */

    /**
     * Workout speichern
     */
    saveWorkout() {
        const name = document.getElementById('workoutName')?.value.trim();
        const description = document.getElementById('workoutDescription')?.value.trim();

        if (!name) {
            this.eventBus.emit('error', { message: 'Bitte Workout-Namen eingeben' });
            return;
        }

        if (!this.currentWorkout) {
            this.currentWorkout = {};
        }

        const workout = {
            ...this.currentWorkout,
            name,
            description,
            exercises: this.currentWorkout.exercises || []
        };

        try {
            this.store.saveWorkout(workout);

            this.eventBus.emit('workoutCreated', { workout });
            this.eventBus.emit('closeModal');

            this.render();
        } catch (error) {
            this.eventBus.emit('error', { message: error.message });
        }
    }

    /**
     * ========================================
     * Workout-Aktionen
     * ========================================
     */

    /**
     * Workout löschen
     * @param {string} workoutId - Workout ID
     */
    deleteWorkout(workoutId) {
        const workout = this.store.getWorkout(workoutId);
        if (!workout) return;

        if (confirm(`Workout "${workout.name}" wirklich löschen?`)) {
            this.store.deleteWorkout(workoutId);
            this.eventBus.emit('workoutDeleted', { workoutId });
            this.render();
        }
    }

    /**
     * Workout klonen
     * @param {string} workoutId - Workout ID
     */
    cloneWorkout(workoutId) {
        try {
            const cloned = this.store.cloneWorkout(workoutId);
            this.eventBus.emit('workoutCloned', { workout: cloned });
            this.render();
        } catch (error) {
            this.eventBus.emit('error', { message: error.message });
        }
    }

    /**
     * Workout-Details anzeigen
     * @param {string} workoutId - Workout ID
     */
    showWorkoutDetails(workoutId) {
        const workout = this.store.getWorkout(workoutId);
        if (!workout) return;

        const sessions = this.store.getSessionsByWorkout(workoutId);
        const lastSession = sessions.length > 0 ? sessions[0] : null;

        const modalContent = `
            <div class="workout-details">
                <div class="form-group">
                    <label class="form-label">Beschreibung</label>
                    <p>${workout.description || 'Keine Beschreibung'}</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Übungen (${workout.exercises?.length || 0})</label>
                    <div class="exercise-list">
                        ${workout.exercises?.map(ex => {
            const exercise = this.store.getExercise(ex.exerciseId);
            return `
                                <div class="exercise-item">
                                    <div>
                                        <div style="font-weight: 500;">${exercise?.name || 'Unbekannt'}</div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                            ${exercise?.muscleGroup} • ${exercise?.equipment}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div>${ex.sets} Sets × ${ex.reps} Wdh.</div>
                                        ${ex.weight ? `<div style="font-size: 0.85rem; color: var(--text-secondary);">${ex.weight}kg</div>` : ''}
                                    </div>
                                </div>
                            `;
        }).join('') || '<p>Keine Übungen</p>'}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Statistiken</label>
                    <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                        <div class="stat-card">
                            <div class="stat-card-title">Trainiert</div>
                            <div class="stat-card-value">${sessions.length}×</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-title">Zuletzt</div>
                            <div class="stat-card-value" style="font-size: 1rem;">
                                ${lastSession ? formatDate(lastSession.date, 'DD.MM.YYYY') : 'Nie'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const buttons = [
            {
                text: '🏋️ Training starten',
                className: 'btn-primary',
                onClick: () => {
                    this.eventBus.emit('closeModal');
                    this.startTraining(workoutId);
                }
            },
            {
                text: 'Schließen',
                className: 'btn-secondary',
                onClick: () => this.eventBus.emit('closeModal')
            }
        ];

        this.eventBus.emit('showModal', {
            title: workout.name,
            content: modalContent,
            buttons
        });
    }

    /**
     * Training starten
     * @param {string} workoutId - Workout ID
     */
    startTraining(workoutId) {
        console.log('🏋️ Starte Training:', workoutId);

        // Training-Event feuern
        this.eventBus.emit('startTraining', { workoutId });

        // Zur Training-View wechseln
        this.eventBus.emit('navigateTo', { view: 'training' });
    }
}

