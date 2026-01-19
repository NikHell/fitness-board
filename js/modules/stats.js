/**
 * ========================================
 * Stats Module
 * ========================================
 * Verwaltet Statistiken und Auswertungen
 * - Trainings-Übersicht
 * - Fortschritts-Tracking
 * - Persönliche Rekorde
 * - Volumen-Analyse
 * - Charts & Diagramme
 */

import { formatDate, formatNumber, percentage, groupBy, sortBy } from '../utils.js';

export class StatsModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.statsContentEl = null;

        // State
        this.selectedPeriod = 'all'; // all, week, month, year
        this.selectedExercise = null;
    }

    /**
     * ========================================
     * Initialisierung
     * ========================================
     */
    init() {
        this.statsContentEl = document.getElementById('statsContent');

        // Event-Listener
        this.setupEventListeners();

        console.log('✅ Stats-Modul initialisiert');
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Event-Bus Listener
        this.eventBus.on('viewChanged', (data) => {
            if (data.view === 'stats') {
                this.render();
            }
        });

        this.eventBus.on('trainingFinished', () => {
            // Statistiken aktualisieren wenn Training beendet
            if (this.statsContentEl && this.statsContentEl.closest('.view.active')) {
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
     * Stats-View rendern
     */
    render() {
        if (!this.statsContentEl) return;

        const sessions = this.getFilteredSessions();

        if (sessions.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.statsContentEl.innerHTML = `
            <div class="stats-container">
                ${this.renderPeriodFilter()}
                ${this.renderOverviewStats(sessions)}
                ${this.renderRecentTrainings(sessions)}
                ${this.renderPersonalRecords()}
                ${this.renderVolumeChart(sessions)}
                ${this.renderExerciseStats()}
            </div>
        `;

        // Event-Listener
        this.attachStatsListeners();
    }

    /**
     * Empty State rendern
     */
    renderEmptyState() {
        this.statsContentEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-title">Noch keine Statistiken</div>
                <div class="empty-state-text">Absolviere dein erstes Training, um Statistiken zu sehen!</div>
            </div>
        `;
    }

    /**
     * Perioden-Filter rendern
     * @returns {string} HTML
     */
    renderPeriodFilter() {
        const periods = [
            { value: 'week', label: '7 Tage' },
            { value: 'month', label: '30 Tage' },
            { value: 'year', label: '1 Jahr' },
            { value: 'all', label: 'Gesamt' }
        ];

        return `
            <div class="period-filter" style="margin-bottom: 2rem;">
                ${periods.map(period => `
                    <button 
                        class="filter-btn ${this.selectedPeriod === period.value ? 'active' : ''}" 
                        data-period="${period.value}"
                    >
                        ${period.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Übersichts-Statistiken rendern
     * @param {Array} sessions - Training Sessions
     * @returns {string} HTML
     */
    renderOverviewStats(sessions) {
        const totalTrainings = sessions.length;
        const totalVolume = this.calculateTotalVolume(sessions);
        const totalSets = this.calculateTotalSets(sessions);
        const streak = this.store.getTrainingStreak();
        const avgDuration = this.calculateAverageDuration(sessions);

        return `
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-card-icon">🏋️</div>
                    <div class="stat-card-title">Trainings</div>
                    <div class="stat-card-value">${totalTrainings}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">💪</div>
                    <div class="stat-card-title">Volumen</div>
                    <div class="stat-card-value">${formatNumber(totalVolume)}kg</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">🔢</div>
                    <div class="stat-card-title">Sets</div>
                    <div class="stat-card-value">${formatNumber(totalSets)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">🔥</div>
                    <div class="stat-card-title">Streak</div>
                    <div class="stat-card-value">${streak} Tage</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon">⏱️</div>
                    <div class="stat-card-title">Ø Dauer</div>
                    <div class="stat-card-value">${avgDuration}min</div>
                </div>
            </div>
        `;
    }

    /**
     * Letzte Trainings rendern
     * @param {Array} sessions - Training Sessions
     * @returns {string} HTML
     */
    renderRecentTrainings(sessions) {
        const recent = sessions.slice(0, 5);

        return `
            <div class="stats-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">📅 Letzte Trainings</h3>
                <div class="training-history">
                    ${recent.map(session => this.renderSessionCard(session)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Session-Karte rendern
     * @param {Object} session - Training Session
     * @returns {string} HTML
     */
    renderSessionCard(session) {
        const workout = this.store.getWorkout(session.workoutId);
        const volume = this.calculateSessionVolume(session);
        const sets = this.calculateSessionSets(session);
        const duration = session.duration ? Math.floor(session.duration / 60) : 0;

        return `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-card-header">
                    <div>
                        <div class="session-card-title">${workout?.name || 'Unbekannt'}</div>
                        <div class="session-card-date">${formatDate(session.date, 'DD.MM.YYYY HH:mm')}</div>
                    </div>
                </div>
                <div class="session-card-stats">
                    <span>💪 ${formatNumber(volume)}kg</span>
                    <span>🔢 ${sets} Sets</span>
                    <span>⏱️ ${duration}min</span>
                </div>
            </div>
        `;
    }

    /**
     * Persönliche Rekorde rendern
     * @returns {string} HTML
     */
    renderPersonalRecords() {
        const exercises = this.store.getExercises();
        const records = exercises.map(exercise => {
            const bestWeight = this.store.getBestWeightForExercise(exercise.id);
            return {
                exercise,
                bestWeight
            };
        }).filter(r => r.bestWeight > 0)
            .sort((a, b) => b.bestWeight - a.bestWeight)
            .slice(0, 5);

        if (records.length === 0) {
            return '';
        }

        return `
            <div class="stats-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">🏆 Persönliche Rekorde</h3>
                <div class="records-list">
                    ${records.map((record, index) => `
                        <div class="record-item">
                            <div class="record-rank">${index + 1}</div>
                            <div class="record-info">
                                <div class="record-name">${record.exercise.name}</div>
                                <div class="record-muscle">${record.exercise.muscleGroup}</div>
                            </div>
                            <div class="record-value">${record.bestWeight}kg</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Volumen-Chart rendern
     * @param {Array} sessions - Training Sessions
     * @returns {string} HTML
     */
    renderVolumeChart(sessions) {
        // Gruppiere Sessions nach Datum
        const sessionsByDate = this.groupSessionsByDate(sessions);
        const dates = Object.keys(sessionsByDate).slice(-7); // Letzte 7 Tage

        if (dates.length === 0) return '';

        const maxVolume = Math.max(...dates.map(date =>
            this.calculateTotalVolume(sessionsByDate[date])
        ));

        return `
            <div class="stats-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">📈 Volumen-Verlauf (7 Tage)</h3>
                <div class="chart-container">
                    ${dates.map(date => {
            const volume = this.calculateTotalVolume(sessionsByDate[date]);
            const height = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;

            return `
                            <div class="chart-bar-wrapper">
                                <div class="chart-bar" style="height: ${height}%">
                                    <div class="chart-value">${formatNumber(volume)}</div>
                                </div>
                                <div class="chart-label">${formatDate(date, 'DD.MM')}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Übungs-Statistiken rendern
     * @returns {string} HTML
     */
    renderExerciseStats() {
        const exercises = this.store.getExercises();
        const sessions = this.store.getTrainingSessions();

        // Zähle wie oft jede Übung trainiert wurde
        const exerciseCount = {};
        sessions.forEach(session => {
            session.exercises?.forEach(ex => {
                if (!exerciseCount[ex.exerciseId]) {
                    exerciseCount[ex.exerciseId] = 0;
                }
                exerciseCount[ex.exerciseId]++;
            });
        });

        // Top 5 Übungen
        const topExercises = exercises
            .map(ex => ({
                exercise: ex,
                count: exerciseCount[ex.id] || 0
            }))
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        if (topExercises.length === 0) return '';

        return `
            <div class="stats-section">
                <h3 style="margin-bottom: 1rem;">💪 Meisttrainierte Übungen</h3>
                <div class="exercise-stats-list">
                    ${topExercises.map(item => {
            const total = Object.values(exerciseCount).reduce((sum, c) => sum + c, 0);
            const percent = percentage(item.count, total);

            return `
                            <div class="exercise-stat-item">
                                <div class="exercise-stat-info">
                                    <div class="exercise-stat-name">${item.exercise.name}</div>
                                    <div class="exercise-stat-muscle">${item.exercise.muscleGroup}</div>
                                </div>
                                <div class="exercise-stat-bar">
                                    <div class="exercise-stat-fill" style="width: ${percent}%"></div>
                                </div>
                                <div class="exercise-stat-count">${item.count}×</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * ========================================
     * Event-Listener
     * ========================================
     */

    /**
     * Stats Event-Listener
     */
    attachStatsListeners() {
        // Perioden-Filter
        this.statsContentEl.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedPeriod = btn.dataset.period;
                this.render();
            });
        });

        // Session-Karten (Details anzeigen)
        this.statsContentEl.querySelectorAll('.session-card').forEach(card => {
            card.addEventListener('click', () => {
                const sessionId = card.dataset.sessionId;
                this.showSessionDetails(sessionId);
            });
        });
    }

    /**
     * ========================================
     * Session-Details
     * ========================================
     */

    /**
     * Session-Details anzeigen
     * @param {string} sessionId - Session ID
     */
    showSessionDetails(sessionId) {
        const session = this.store.getTrainingSession(sessionId);
        if (!session) return;

        const workout = this.store.getWorkout(session.workoutId);
        const volume = this.calculateSessionVolume(session);
        const sets = this.calculateSessionSets(session);
        const duration = session.duration ? Math.floor(session.duration / 60) : 0;

        const modalContent = `
            <div class="session-details">
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div class="stat-card">
                        <div class="stat-card-title">Volumen</div>
                        <div class="stat-card-value">${formatNumber(volume)}kg</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Sets</div>
                        <div class="stat-card-value">${sets}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Dauer</div>
                        <div class="stat-card-value">${duration}min</div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Übungen</label>
                    ${session.exercises?.map(ex => {
            const exercise = this.store.getExercise(ex.exerciseId);
            const completedSets = ex.sets.filter(s => s.completed).length;
            const exVolume = ex.sets.reduce((sum, set) =>
                set.completed ? sum + (set.weight * set.reps) : sum, 0
            );

            return `
                            <div class="exercise-detail-card" style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${exercise?.name || 'Unbekannt'}</strong>
                                    <span>${formatNumber(exVolume)}kg</span>
                                </div>
                                <div class="set-list">
                                    ${ex.sets.filter(s => s.completed).map((set, i) => `
                                        <div class="set-detail">
                                            Set ${i + 1}: ${set.weight}kg × ${set.reps}
                                        </div>
                                    `).join('')}
                                </div>
                                ${ex.notes ? `
                                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; font-size: 0.9rem;">
                                        📝 ${ex.notes}
                                    </div>
                                ` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        const buttons = [
            {
                text: 'Schließen',
                className: 'btn-secondary',
                onClick: () => this.eventBus.emit('closeModal')
            }
        ];

        this.eventBus.emit('showModal', {
            title: `${workout?.name || 'Training'} - ${formatDate(session.date, 'DD.MM.YYYY')}`,
            content: modalContent,
            buttons
        });
    }

    /**
     * ========================================
     * Berechnungen
     * ========================================
     */

    /**
     * Gesamtvolumen berechnen
     * @param {Array} sessions - Training Sessions
     * @returns {number}
     */
    calculateTotalVolume(sessions) {
        return sessions.reduce((total, session) => {
            return total + this.calculateSessionVolume(session);
        }, 0);
    }

    /**
     * Session-Volumen berechnen
     * @param {Object} session - Training Session
     * @returns {number}
     */
    calculateSessionVolume(session) {
        if (!session.exercises) return 0;

        return session.exercises.reduce((total, ex) => {
            return total + ex.sets.reduce((exTotal, set) => {
                return set.completed ? exTotal + (set.weight * set.reps) : exTotal;
            }, 0);
        }, 0);
    }

    /**
     * Gesamtanzahl Sets berechnen
     * @param {Array} sessions - Training Sessions
     * @returns {number}
     */
    calculateTotalSets(sessions) {
        return sessions.reduce((total, session) => {
            return total + this.calculateSessionSets(session);
        }, 0);
    }

    /**
     * Session-Sets berechnen
     * @param {Object} session - Training Session
     * @returns {number}
     */
    calculateSessionSets(session) {
        if (!session.exercises) return 0;

        return session.exercises.reduce((total, ex) => {
            return total + ex.sets.filter(s => s.completed).length;
        }, 0);
    }

    /**
     * Durchschnittliche Trainings-Dauer berechnen
     * @param {Array} sessions - Training Sessions
     * @returns {number} Minuten
     */
    calculateAverageDuration(sessions) {
        if (sessions.length === 0) return 0;

        const totalDuration = sessions.reduce((total, session) => {
            return total + (session.duration || 0);
        }, 0);

        return Math.round(totalDuration / sessions.length / 60);
    }

    /**
     * ========================================
     * Daten-Filterung
     * ========================================
     */

    /**
     * Gefilterte Sessions abrufen
     * @returns {Array}
     */
    getFilteredSessions() {
        const allSessions = this.store.getTrainingSessions();

        if (this.selectedPeriod === 'all') {
            return allSessions;
        }

        const now = new Date();
        let startDate = new Date();

        switch(this.selectedPeriod) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        return allSessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startDate;
        });
    }

    /**
     * Sessions nach Datum gruppieren
     * @param {Array} sessions - Training Sessions
     * @returns {Object}
     */
    groupSessionsByDate(sessions) {
        const grouped = {};

        sessions.forEach(session => {
            const date = formatDate(session.date, 'YYYY-MM-DD');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(session);
        });

        return grouped;
    }

    /**
     * ========================================
     * Fortschritts-Analyse
     * ========================================
     */

    /**
     * Fortschritt für Übung berechnen
     * @param {string} exerciseId - Exercise ID
     * @returns {Object}
     */
    calculateExerciseProgress(exerciseId) {
        const sessions = this.store.getTrainingSessions();
        const exerciseSessions = [];

        sessions.forEach(session => {
            session.exercises?.forEach(ex => {
                if (ex.exerciseId === exerciseId) {
                    exerciseSessions.push({
                        date: session.date,
                        sets: ex.sets.filter(s => s.completed)
                    });
                }
            });
        });

        if (exerciseSessions.length === 0) {
            return null;
        }

        // Sortiere nach Datum
        exerciseSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Erste und letzte Session
        const first = exerciseSessions[0];
        const last = exerciseSessions[exerciseSessions.length - 1];

        // Durchschnittliches Gewicht
        const firstAvgWeight = this.calculateAverageWeight(first.sets);
        const lastAvgWeight = this.calculateAverageWeight(last.sets);

        // Progression
        const progression = lastAvgWeight > firstAvgWeight
            ? ((lastAvgWeight - firstAvgWeight) / firstAvgWeight * 100).toFixed(1)
            : 0;

        return {
            firstSession: first,
            lastSession: last,
            firstAvgWeight,
            lastAvgWeight,
            progression,
            totalSessions: exerciseSessions.length
        };
    }

    /**
     * Durchschnittsgewicht berechnen
     * @param {Array} sets - Sets
     * @returns {number}
     */
    calculateAverageWeight(sets) {
        if (sets.length === 0) return 0;

        const totalWeight = sets.reduce((sum, set) => sum + set.weight, 0);
        return totalWeight / sets.length;
    }

    /**
     * ========================================
     * Muskelgruppen-Analyse
     * ========================================
     */

    /**
     * Trainings nach Muskelgruppe
     * @returns {Object}
     */
    getTrainingsByMuscleGroup() {
        const sessions = this.store.getTrainingSessions();
        const muscleGroups = {};

        sessions.forEach(session => {
            session.exercises?.forEach(ex => {
                const exercise = this.store.getExercise(ex.exerciseId);
                if (!exercise) return;

                const muscle = exercise.muscleGroup;
                if (!muscleGroups[muscle]) {
                    muscleGroups[muscle] = {
                        count: 0,
                        volume: 0,
                        sets: 0
                    };
                }

                muscleGroups[muscle].count++;

                ex.sets.forEach(set => {
                    if (set.completed) {
                        muscleGroups[muscle].volume += set.weight * set.reps;
                        muscleGroups[muscle].sets++;
                    }
                });
            });
        });

        return muscleGroups;
    }

    /**
     * ========================================
     * Export-Funktionen
     * ========================================
     */

    /**
     * Statistiken als CSV exportieren
     */
    exportStatsAsCSV() {
        const sessions = this.store.getTrainingSessions();

        let csv = 'Datum,Workout,Übung,Set,Gewicht,Wiederholungen,Volumen\n';

        sessions.forEach(session => {
            const workout = this.store.getWorkout(session.workoutId);
            const date = formatDate(session.date, 'YYYY-MM-DD');

            session.exercises?.forEach(ex => {
                const exercise = this.store.getExercise(ex.exerciseId);

                ex.sets.forEach((set, index) => {
                    if (set.completed) {
                        const volume = set.weight * set.reps;
                        csv += `${date},${workout?.name || 'Unbekannt'},${exercise?.name || 'Unbekannt'},${index + 1},${set.weight},${set.reps},${volume}\n`;
                    }
                });
            });
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-stats-${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.eventBus.emit('showToast', {
            message: 'Statistiken exportiert!',
            type: 'success'
        });
    }

    /**
     * ========================================
     * Ziele & Milestones
     * ========================================
     */

    /**
     * Nächste Milestones berechnen
     * @returns {Array}
     */
    getNextMilestones() {
        const totalTrainings = this.store.getTotalTrainings();
        const totalVolume = this.store.getTotalVolume();
        const streak = this.store.getTrainingStreak();

        const milestones = [];

        // Trainings-Milestones
        const trainingMilestones = [10, 25, 50, 100, 250, 500];
        const nextTrainingMilestone = trainingMilestones.find(m => m > totalTrainings);
        if (nextTrainingMilestone) {
            milestones.push({
                type: 'trainings',
                icon: '🏋️',
                current: totalTrainings,
                target: nextTrainingMilestone,
                label: 'Trainings',
                progress: percentage(totalTrainings, nextTrainingMilestone)
            });
        }

        // Volumen-Milestones (in Tonnen)
        const volumeTons = Math.floor(totalVolume / 1000);
        const volumeMilestones = [1, 5, 10, 25, 50, 100];
        const nextVolumeMilestone = volumeMilestones.find(m => m > volumeTons);
        if (nextVolumeMilestone) {
            milestones.push({
                type: 'volume',
                icon: '💪',
                current: volumeTons,
                target: nextVolumeMilestone,
                label: 'Tonnen',
                progress: percentage(volumeTons, nextVolumeMilestone)
            });
        }

        // Streak-Milestones
        const streakMilestones = [7, 14, 30, 60, 100, 365];
        const nextStreakMilestone = streakMilestones.find(m => m > streak);
        if (nextStreakMilestone) {
            milestones.push({
                type: 'streak',
                icon: '🔥',
                current: streak,
                target: nextStreakMilestone,
                label: 'Tage Streak',
                progress: percentage(streak, nextStreakMilestone)
            });
        }

        return milestones;
    }

    /**
     * ========================================
     * Utility-Methoden
     * ========================================
     */

    /**
     * Beste Woche finden
     * @returns {Object|null}
     */
    getBestWeek() {
        const sessions = this.store.getTrainingSessions();
        if (sessions.length === 0) return null;

        // Gruppiere nach Woche
        const weeks = {};
        sessions.forEach(session => {
            const date = new Date(session.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = formatDate(weekStart, 'YYYY-MM-DD');

            if (!weeks[weekKey]) {
                weeks[weekKey] = [];
            }
            weeks[weekKey].push(session);
        });

        // Finde Woche mit höchstem Volumen
        let bestWeek = null;
        let maxVolume = 0;

        Object.entries(weeks).forEach(([weekKey, weekSessions]) => {
            const volume = this.calculateTotalVolume(weekSessions);
            if (volume > maxVolume) {
                maxVolume = volume;
                bestWeek = {
                    week: weekKey,
                    sessions: weekSessions.length,
                    volume
                };
            }
        });

        return bestWeek;
    }

    /**
     * Konsistenz-Score berechnen (0-100)
     * @returns {number}
     */
    getConsistencyScore() {
        const sessions = this.store.getTrainingSessions();
        if (sessions.length === 0) return 0;

        // Letzte 30 Tage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSessions = sessions.filter(s =>
            new Date(s.date) >= thirtyDaysAgo
        );

        // Ideale Anzahl: 3-4 Trainings pro Woche = 12-16 pro Monat
        const ideal = 14;
        const score = Math.min((recentSessions.length / ideal) * 100, 100);

        return Math.round(score);
    }

    /**
     * Trainings-Frequenz berechnen (Trainings pro Woche)
     * @returns {number}
     */
    getTrainingFrequency() {
        const sessions = this.store.getTrainingSessions();
        if (sessions.length === 0) return 0;

        const firstSession = new Date(sessions[sessions.length - 1].date);
        const lastSession = new Date(sessions[0].date);
        const weeks = Math.max(1, Math.ceil((lastSession - firstSession) / (7 * 24 * 60 * 60 * 1000)));

        return (sessions.length / weeks).toFixed(1);
    }
}
