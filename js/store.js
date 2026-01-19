/**
 * ========================================
 * Store - Zentrale Datenhaltung
 * ========================================
 * Verwaltet alle Daten mit LocalStorage-Persistenz
 * - Workouts
 * - Exercises (Übungsbibliothek)
 * - Training Sessions (Trainingshistorie)
 */

import { generateId } from './utils.js';

export class Store {
    constructor() {
        // LocalStorage Keys
        this.keys = {
            workouts: 'fitnessApp_workouts',
            exercises: 'fitnessApp_exercises',
            sessions: 'fitnessApp_sessions',
            lastWorkout: 'fitnessApp_lastWorkout'
        };

        // In-Memory Cache
        this.cache = {
            workouts: null,
            exercises: null,
            sessions: null
        };

        // Initialisierung
        this.init();
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        // Cache laden
        this.loadCache();

        // Demo-Daten erstellen falls leer
        if (this.getWorkouts().length === 0 && this.getExercises().length === 0) {
            this.createInitialData();
        }
    }

    /**
     * Cache aus LocalStorage laden
     */
    loadCache() {
        this.cache.workouts = this.loadFromStorage(this.keys.workouts) || [];
        this.cache.exercises = this.loadFromStorage(this.keys.exercises) || [];
        this.cache.sessions = this.loadFromStorage(this.keys.sessions) || [];
    }

    /**
     * Daten aus LocalStorage laden
     * @param {string} key - Storage Key
     * @returns {Array|null}
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Fehler beim Laden von ${key}:`, e);
            return null;
        }
    }

    /**
     * Daten in LocalStorage speichern
     * @param {string} key - Storage Key
     * @param {*} data - Daten
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Fehler beim Speichern von ${key}:`, e);

            // Quota exceeded?
            if (e.name === 'QuotaExceededError') {
                alert('Speicher voll! Bitte alte Trainings löschen oder Daten exportieren.');
            }
        }
    }

    /**
     * ========================================
     * WORKOUTS
     * ========================================
     */

    /**
     * Alle Workouts abrufen
     * @returns {Array}
     */
    getWorkouts() {
        return [...this.cache.workouts];
    }

    /**
     * Workout nach ID abrufen
     * @param {string} id - Workout ID
     * @returns {Object|null}
     */
    getWorkout(id) {
        return this.cache.workouts.find(w => w.id === id) || null;
    }

    /**
     * Workout speichern (erstellen oder aktualisieren)
     * @param {Object} workout - Workout-Objekt
     * @returns {Object} - Gespeichertes Workout
     */
    saveWorkout(workout) {
        // Validierung
        if (!workout.name) {
            throw new Error('Workout muss einen Namen haben');
        }

        // ID generieren falls neu
        if (!workout.id) {
            workout.id = generateId();
            workout.createdAt = new Date().toISOString();
        }

        workout.updatedAt = new Date().toISOString();

        // Existierendes Workout aktualisieren oder neues hinzufügen
        const index = this.cache.workouts.findIndex(w => w.id === workout.id);
        if (index >= 0) {
            this.cache.workouts[index] = workout;
        } else {
            this.cache.workouts.push(workout);
        }

        // Speichern
        this.saveToStorage(this.keys.workouts, this.cache.workouts);

        return workout;
    }

    /**
     * Workout löschen
     * @param {string} id - Workout ID
     * @returns {boolean}
     */
    deleteWorkout(id) {
        const index = this.cache.workouts.findIndex(w => w.id === id);
        if (index >= 0) {
            this.cache.workouts.splice(index, 1);
            this.saveToStorage(this.keys.workouts, this.cache.workouts);
            return true;
        }
        return false;
    }

    /**
     * Workout klonen
     * @param {string} id - Workout ID
     * @returns {Object} - Geklontes Workout
     */
    cloneWorkout(id) {
        const original = this.getWorkout(id);
        if (!original) {
            throw new Error('Workout nicht gefunden');
        }

        const clone = {
            ...original,
            id: generateId(),
            name: `${original.name} (Kopie)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return this.saveWorkout(clone);
    }

    /**
     * ========================================
     * EXERCISES (Übungsbibliothek)
     * ========================================
     */

    /**
     * Alle Übungen abrufen
     * @returns {Array}
     */
    getExercises() {
        return [...this.cache.exercises];
    }

    /**
     * Übung nach ID abrufen
     * @param {string} id - Exercise ID
     * @returns {Object|null}
     */
    getExercise(id) {
        return this.cache.exercises.find(e => e.id === id) || null;
    }

    /**
     * Übungen nach Muskelgruppe filtern
     * @param {string} muscleGroup - Muskelgruppe
     * @returns {Array}
     */
    getExercisesByMuscleGroup(muscleGroup) {
        return this.cache.exercises.filter(e => e.muscleGroup === muscleGroup);
    }

    /**
     * Übung speichern
     * @param {Object} exercise - Exercise-Objekt
     * @returns {Object}
     */
    saveExercise(exercise) {
        // Validierung
        if (!exercise.name) {
            throw new Error('Übung muss einen Namen haben');
        }

        // ID generieren falls neu
        if (!exercise.id) {
            exercise.id = generateId();
            exercise.createdAt = new Date().toISOString();
        }

        exercise.updatedAt = new Date().toISOString();

        // Existierende Übung aktualisieren oder neue hinzufügen
        const index = this.cache.exercises.findIndex(e => e.id === exercise.id);
        if (index >= 0) {
            this.cache.exercises[index] = exercise;
        } else {
            this.cache.exercises.push(exercise);
        }

        // Speichern
        this.saveToStorage(this.keys.exercises, this.cache.exercises);

        return exercise;
    }

    /**
     * Übung löschen
     * @param {string} id - Exercise ID
     * @returns {boolean}
     */
    deleteExercise(id) {
        // Prüfen ob Übung in Workouts verwendet wird
        const usedInWorkouts = this.cache.workouts.some(workout =>
            workout.exercises.some(ex => ex.exerciseId === id)
        );

        if (usedInWorkouts) {
            throw new Error('Übung wird in Workouts verwendet und kann nicht gelöscht werden');
        }

        const index = this.cache.exercises.findIndex(e => e.id === id);
        if (index >= 0) {
            this.cache.exercises.splice(index, 1);
            this.saveToStorage(this.keys.exercises, this.cache.exercises);
            return true;
        }
        return false;
    }

    /**
     * ========================================
     * TRAINING SESSIONS (Trainingshistorie)
     * ========================================
     */

    /**
     * Alle Training Sessions abrufen
     * @returns {Array}
     */
    getTrainingSessions() {
        return [...this.cache.sessions].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );
    }

    /**
     * Training Session nach ID abrufen
     * @param {string} id - Session ID
     * @returns {Object|null}
     */
    getTrainingSession(id) {
        return this.cache.sessions.find(s => s.id === id) || null;
    }

    /**
     * Training Sessions nach Workout ID
     * @param {string} workoutId - Workout ID
     * @returns {Array}
     */
    getSessionsByWorkout(workoutId) {
        return this.cache.sessions
            .filter(s => s.workoutId === workoutId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Training Sessions nach Zeitraum
     * @param {Date} startDate - Start-Datum
     * @param {Date} endDate - End-Datum
     * @returns {Array}
     */
    getSessionsByDateRange(startDate, endDate) {
        return this.cache.sessions.filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate >= startDate && sessionDate <= endDate;
        });
    }

    /**
     * Letzte Training Session für Workout
     * @param {string} workoutId - Workout ID
     * @returns {Object|null}
     */
    getLastSessionForWorkout(workoutId) {
        const sessions = this.getSessionsByWorkout(workoutId);
        return sessions.length > 0 ? sessions[0] : null;
    }

    /**
     * Training Session speichern
     * @param {Object} session - Session-Objekt
     * @returns {Object}
     */
    saveTrainingSession(session) {
        // Validierung
        if (!session.workoutId) {
            throw new Error('Session muss eine Workout-ID haben');
        }

        // ID generieren falls neu
        if (!session.id) {
            session.id = generateId();
        }

        if (!session.date) {
            session.date = new Date().toISOString();
        }

        // Existierende Session aktualisieren oder neue hinzufügen
        const index = this.cache.sessions.findIndex(s => s.id === session.id);
        if (index >= 0) {
            this.cache.sessions[index] = session;
        } else {
            this.cache.sessions.push(session);
        }

        // Speichern
        this.saveToStorage(this.keys.sessions, this.cache.sessions);

        // Als letztes Workout merken
        localStorage.setItem(this.keys.lastWorkout, session.workoutId);

        return session;
    }

    /**
     * Training Session löschen
     * @param {string} id - Session ID
     * @returns {boolean}
     */
    deleteTrainingSession(id) {
        const index = this.cache.sessions.findIndex(s => s.id === id);
        if (index >= 0) {
            this.cache.sessions.splice(index, 1);
            this.saveToStorage(this.keys.sessions, this.cache.sessions);
            return true;
        }
        return false;
    }

    /**
     * ========================================
     * STATISTIKEN
     * ========================================
     */

    /**
     * Gesamtanzahl Trainings
     * @returns {number}
     */
    getTotalTrainings() {
        return this.cache.sessions.length;
    }

    /**
     * Trainings in Zeitraum
     * @param {number} days - Anzahl Tage
     * @returns {number}
     */
    getTrainingsInLastDays(days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.cache.sessions.filter(s =>
            new Date(s.date) >= startDate
        ).length;
    }

    /**
     * Gesamtvolumen berechnen (Gewicht × Wiederholungen)
     * @param {string} sessionId - Session ID (optional)
     * @returns {number}
     */
    getTotalVolume(sessionId = null) {
        const sessions = sessionId
            ? [this.getTrainingSession(sessionId)]
            : this.cache.sessions;

        return sessions.reduce((total, session) => {
            if (!session || !session.exercises) return total;

            return total + session.exercises.reduce((sessionTotal, exercise) => {
                return sessionTotal + exercise.sets.reduce((setTotal, set) => {
                    return setTotal + (set.weight * set.reps);
                }, 0);
            }, 0);
        }, 0);
    }

    /**
     * Bestes Gewicht für Übung
     * @param {string} exerciseId - Exercise ID
     * @returns {number}
     */
    getBestWeightForExercise(exerciseId) {
        let maxWeight = 0;

        this.cache.sessions.forEach(session => {
            session.exercises?.forEach(exercise => {
                if (exercise.exerciseId === exerciseId) {
                    exercise.sets?.forEach(set => {
                        if (set.weight > maxWeight) {
                            maxWeight = set.weight;
                        }
                    });
                }
            });
        });

        return maxWeight;
    }

    /**
     * Training Streak (aufeinanderfolgende Tage)
     * @returns {number}
     */
    getTrainingStreak() {
        if (this.cache.sessions.length === 0) return 0;

        const sortedSessions = [...this.cache.sessions].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const session of sortedSessions) {
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

            if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
                streak++;
                currentDate = sessionDate;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * ========================================
     * UTILITY
     * ========================================
     */

    /**
     * Letztes Workout ID abrufen
     * @returns {string|null}
     */
    getLastWorkoutId() {
        return localStorage.getItem(this.keys.lastWorkout);
    }

    /**
     * Alle Daten löschen
     */
    clearAll() {
        this.cache.workouts = [];
        this.cache.exercises = [];
        this.cache.sessions = [];

        localStorage.removeItem(this.keys.workouts);
        localStorage.removeItem(this.keys.exercises);
        localStorage.removeItem(this.keys.sessions);
        localStorage.removeItem(this.keys.lastWorkout);
    }

    /**
     * Initiale Demo-Daten erstellen
     */
    createInitialData() {
        // Standard-Übungen
        const exercises = [
            { name: 'Bankdrücken', muscleGroup: 'Brust', equipment: 'Langhantel' },
            { name: 'Schrägbankdrücken', muscleGroup: 'Brust', equipment: 'Kurzhantel' },
            { name: 'Kniebeugen', muscleGroup: 'Beine', equipment: 'Langhantel' },
            { name: 'Beinpresse', muscleGroup: 'Beine', equipment: 'Maschine' },
            { name: 'Kreuzheben', muscleGroup: 'Rücken', equipment: 'Langhantel' },
            { name: 'Latziehen', muscleGroup: 'Rücken', equipment: 'Kabel' },
            { name: 'Schulterdrücken', muscleGroup: 'Schultern', equipment: 'Kurzhantel' },
            { name: 'Seitheben', muscleGroup: 'Schultern', equipment: 'Kurzhantel' },
            { name: 'Bizeps-Curls', muscleGroup: 'Bizeps', equipment: 'Kurzhantel' },
            { name: 'Trizeps-Dips', muscleGroup: 'Trizeps', equipment: 'Körpergewicht' }
        ];

        exercises.forEach(ex => this.saveExercise(ex));

        console.log('✅ Initiale Übungsbibliothek erstellt');
    }
}
