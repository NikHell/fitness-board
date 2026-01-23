/**
 * ========================================
 * Stats Module
 * ========================================
 * Verwaltet Statistiken und Auswertungen
 * - Trainings-Übersicht
 * - Fortschritts-Tracking
 * - Persönliche Rekorde
 * - Charts & Diagramme
 */

import { formatDate, formatNumber, percentage, groupBy, sortBy } from '../utils.js';
// ❌ ENTFERNT: import { VolumeAnalysis } from './volumeAnalysis.js';

export class StatsModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // UI-Elemente
        this.statsContentEl = null;

        // State
        this.selectedPeriod = 'all'; // all, week, month, year
        this.selectedExercise = null;

        // ❌ ENTFERNT: this.volumeAnalysis = new VolumeAnalysis(store);
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
                ${this.renderVolumeByMuscleGroup(sessions)}
                ${this.renderExerciseStats()}
            </div>
        `;

        // ❌ ENTFERNT: ${this.volumeAnalysis.render(sessions)}

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
     * Volumen nach Muskelgruppen rendern
     * @param {Array} sessions - Training Sessions
     * @returns {string} HTML
     */
    renderVolumeByMuscleGroup(sessions) {
        const muscleGroups = {};

        // Berechne Volumen pro Muskelgruppe
        sessions.forEach(session => {
            session.exercises?.forEach(ex => {
                const exercise = this.store.getExercise(ex.exerciseId);
                if (!exercise) return;

                const muscle = exercise.muscleGroup;
                if (!muscleGroups[muscle]) {
                    muscleGroups[muscle] = 0;
                }

                ex.sets.forEach(set => {
                    if (set.completed) {
                        muscleGroups[muscle] += set.weight * set.reps;
                    }
                });
            });
        });

        // Sortiere nach Volumen
        const sortedMuscles = Object.entries(muscleGroups)
            .sort((a, b) => b[1] - a[1]);

        if (sortedMuscles.length === 0) return '';

        const totalVolume = sortedMuscles.reduce((sum, [_, vol]) => sum + vol, 0);

        // Formatierung
        const formatVolume = (vol) => {
            if (vol >= 1000) {
                return `${(vol / 1000).toFixed(1)}k kg`;
            }
            return `${formatNumber(vol)} kg`;
        };

        return `
        <div class="stats-section" style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">💪 Volumen nach Muskelgruppen</h3>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${sortedMuscles.map(([muscleGroup, volume]) => {
            const percentage = ((volume / totalVolume) * 100).toFixed(0);

            return `
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="flex: 0 0 120px; font-weight: 500; color: var(--text-primary);">
                                ${muscleGroup}
                            </div>
                            <div style="flex: 1; background: var(--bg-secondary); border-radius: 6px; height: 32px; position: relative; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary-dark)); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.9rem; font-weight: 600; color: var(--text-primary); text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                                    ${formatVolume(volume)} (${percentage}%)
                                </div>
                            </div>
                            <div style="flex: 0 0 80px; text-align: right; font-size: 0.9rem; color: var(--text-secondary);">
                                ${formatVolume(volume)}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 3px solid var(--accent-info);">
                <div style="display: flex; align-items: start; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">💡</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; margin-bottom: 0.25rem;">Volumen-Empfehlung</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                            ${this.getVolumeRecommendationText(muscleGroups, totalVolume)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * Volumen-Empfehlungstext generieren
     * @param {Object} muscleGroups - Volumen pro Muskelgruppe
     * @param {number} totalVolume - Gesamtvolumen
     * @returns {string}
     */
    getVolumeRecommendationText(muscleGroups, totalVolume) {
        const entries = Object.entries(muscleGroups);
        if (entries.length === 0) return 'Keine Daten verfügbar.';

        // Finde dominante Muskelgruppe
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        const [topMuscle, topVolume] = sorted[0];
        const topPercentage = ((topVolume / totalVolume) * 100).toFixed(0);

        // Finde untertrainierte Muskelgruppen
        const undertrainedMuscles = sorted.filter(([_, vol]) => {
            const percent = (vol / totalVolume) * 100;
            return percent < 15;
        });

        let recommendations = [];

        // Dominante Muskelgruppe
        if (topPercentage > 40) {
            recommendations.push(`${topMuscle} dominiert mit ${topPercentage}% des Volumens.`);
        }

        // Untertrainierte Muskelgruppen
        if (undertrainedMuscles.length > 0 && undertrainedMuscles.length < entries.length) {
            const muscleNames = undertrainedMuscles.map(([name]) => name).join(', ');
            recommendations.push(`Überlege, mehr Volumen für ${muscleNames} einzuplanen.`);
        }

        // Ausgewogenes Training
        if (topPercentage < 35 && undertrainedMuscles.length === 0) {
            recommendations.push('Gute Balance zwischen den Muskelgruppen! 💪');
        }

        // Volumen-Steigerung
        if (totalVolume < 10000) {
            recommendations.push('Steigere das Gesamtvolumen schrittweise für mehr Fortschritt.');
        }

        return recommendations.length > 0
            ? recommendations.join(' ')
            : 'Trainiere weiter so! 🎯';
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

        // Session-Karten
        this.statsContentEl.querySelectorAll('.session-card').forEach(card => {
            card.addEventListener('click', () => {
                const sessionId = card.dataset.sessionId;
                this.showSessionDetails(sessionId);
            });
        });

        // ❌ ENTFERNT: Profil-Einstellungen Event-Listener
        // const saveProfileBtn = document.getElementById('saveProfileBtn');
        // if (saveProfileBtn) { ... }
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

    calculateTotalVolume(sessions) {
        return sessions.reduce((total, session) => {
            return total + this.calculateSessionVolume(session);
        }, 0);
    }

    calculateSessionVolume(session) {
        if (!session.exercises) return 0;

        return session.exercises.reduce((total, ex) => {
            return total + ex.sets.reduce((exTotal, set) => {
                return set.completed ? exTotal + (set.weight * set.reps) : exTotal;
            }, 0);
        }, 0);
    }

    calculateTotalSets(sessions) {
        return sessions.reduce((total, session) => {
            return total + this.calculateSessionSets(session);
        }, 0);
    }

    calculateSessionSets(session) {
        if (!session.exercises) return 0;

        return session.exercises.reduce((total, ex) => {
            return total + ex.sets.filter(s => s.completed).length;
        }, 0);
    }

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
}
