/**
 * ========================================
 * Volume Analysis Module (ÜBERARBEITET!)
 * ========================================
 * Intelligente Volumen-Analyse basierend auf SETS, nicht kg!
 *
 * Wissenschaftliche Grundlagen:
 * - Anfänger: 10-15 Sets/Woche pro Muskelgruppe
 * - Fortgeschritten: 12-20 Sets/Woche
 * - Profi: 15-25 Sets/Woche
 *
 * Kleinere Muskelgruppen (Bizeps, Trizeps): ~60% der großen Muskeln
 * Schultern: ~80% der großen Muskeln
 */

export class VolumeAnalysis {
    constructor(store) {
        this.store = store;
    }

    /**
     * Benutzer-Profil laden
     */
    getUserProfile() {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            experience: 'intermediate',
            frequency: 3,
            goals: 'muscle_building'
        };
    }

    /**
     * ========================================
     * HAUPTANALYSE
     * ========================================
     */
    analyzeVolume(sessions) {
        const profile = this.getUserProfile();

        console.log('🧠 Starte Volumen-Analyse...');
        console.log('Profil:', profile);

        // Berechne SETS pro Muskelgruppe (letzte 7 Tage)
        const volumeData = this.calculateWeeklySets(sessions);

        console.log('Wöchentliche Sets:', volumeData);

        // Hole optimale Bereiche (in SETS!)
        const optimalRanges = this.getOptimalSetRanges(profile);

        console.log('Optimale Bereiche:', optimalRanges);

        // Analysiere jede Muskelgruppe
        const analysis = {};

        Object.keys(volumeData).forEach(muscle => {
            const data = volumeData[muscle];
            const currentSets = data.sets;
            const currentVolume = data.volume; // kg (nur für Info)
            const optimal = optimalRanges[muscle] || optimalRanges.default;

            let status = 'optimal';
            let recommendation = null;
            let warning = null;

            // Zu wenig Sets
            if (currentSets < optimal.min) {
                status = 'low';
                const deficit = optimal.min - currentSets;
                const targetSets = Math.round((optimal.min + optimal.max) / 2);
                recommendation = {
                    type: 'increase',
                    message: `Erhöhe auf ${optimal.min}-${optimal.max} Sets/Woche`,
                    detail: `Füge ${deficit}-${targetSets - currentSets} Sets hinzu`,
                    targetSets: targetSets
                };
            }
            // Zu viele Sets
            else if (currentSets > optimal.max) {
                status = 'high';
                const excess = currentSets - optimal.max;
                warning = {
                    type: 'overtraining',
                    message: `⚠️ Möglicherweise zu viel Volumen!`,
                    detail: `Reduziere um ${excess} Sets auf ${optimal.max} Sets/Woche`,
                    risk: excess > 5 ? 'high' : 'medium'
                };
            }
            // Optimal
            else {
                status = 'optimal';
                recommendation = {
                    type: 'maintain',
                    message: `✅ Optimales Volumen!`,
                    detail: `Halte ${currentSets} Sets/Woche bei`,
                    targetSets: currentSets
                };
            }

            analysis[muscle] = {
                currentSets,
                currentVolume, // kg (nur Info)
                optimalMin: optimal.min,
                optimalMax: optimal.max,
                status,
                recommendation,
                warning,
                exercises: data.exercises // Liste der Übungen
            };
        });

        console.log('Analyse-Ergebnis:', analysis);

        return analysis;
    }

    /**
     * ========================================
     * SETS PRO WOCHE BERECHNEN
     * ========================================
     */
    calculateWeeklySets(sessions) {
        const volumeData = {};

        // Letzte 7 Tage
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSessions = sessions.filter(s =>
            new Date(s.date) >= sevenDaysAgo
        );

        console.log(`📊 Analysiere ${recentSessions.length} Sessions der letzten 7 Tage`);

        recentSessions.forEach(session => {
            session.exercises?.forEach(ex => {
                const exercise = this.store.getExercise(ex.exerciseId);
                if (!exercise) return;

                const muscle = exercise.muscleGroup;

                if (!volumeData[muscle]) {
                    volumeData[muscle] = {
                        sets: 0,
                        volume: 0, // kg
                        exercises: []
                    };
                }

                // Zähle SETS (nur completed)
                const completedSets = ex.sets.filter(s => s.completed).length;
                volumeData[muscle].sets += completedSets;

                // Berechne Volumen in kg (nur für Info)
                let exerciseVolume = 0;
                ex.sets.forEach(set => {
                    if (set.completed) {
                        volumeData[muscle].volume += set.weight * set.reps;
                        exerciseVolume += set.weight * set.reps;
                    }
                });

                // Speichere Übungs-Info
                volumeData[muscle].exercises.push({
                    name: exercise.name,
                    sets: completedSets,
                    volume: exerciseVolume
                });
            });
        });

        return volumeData;
    }

    /**
     * ========================================
     * OPTIMALE SET-BEREICHE
     * ========================================
     * Basierend auf wissenschaftlichen Empfehlungen
     */
    getOptimalSetRanges(profile) {
        const { experience, frequency } = profile;

        // Basis-Bereiche (Sets pro Woche) für GROSSE Muskelgruppen
        const baseRanges = {
            beginner: { min: 10, max: 15 },
            intermediate: { min: 12, max: 20 },
            advanced: { min: 15, max: 25 }
        };

        // Wähle Bereich basierend auf Erfahrung
        let baseRange = { ...baseRanges[experience] };

        // Anpassung basierend auf Frequenz
        if (frequency <= 2) {
            // 2× Training/Woche → Etwas weniger Sets
            baseRange.min = Math.round(baseRange.min * 0.85);
            baseRange.max = Math.round(baseRange.max * 0.85);
        }
        else if (frequency >= 5) {
            // 5+ Training/Woche → Etwas mehr Sets möglich
            baseRange.min = Math.round(baseRange.min * 1.15);
            baseRange.max = Math.round(baseRange.max * 1.15);
        }

        // Muskelgruppen-spezifische Bereiche
        return {
            // Große Muskelgruppen (100%)
            'Brust': { ...baseRange },
            'Rücken': { ...baseRange },
            'Beine': { ...baseRange },

            // Schultern (80%)
            'Schultern': {
                min: Math.round(baseRange.min * 0.8),
                max: Math.round(baseRange.max * 0.8)
            },

            // Kleine Muskelgruppen (60%)
            'Bizeps': {
                min: Math.round(baseRange.min * 0.6),
                max: Math.round(baseRange.max * 0.6)
            },
            'Trizeps': {
                min: Math.round(baseRange.min * 0.6),
                max: Math.round(baseRange.max * 0.6)
            },

            // Core (70%)
            'Bauch': {
                min: Math.round(baseRange.min * 0.7),
                max: Math.round(baseRange.max * 0.7)
            },

            // Default
            'default': { ...baseRange }
        };
    }



    /**
     * ========================================
     * RENDERING
     * ========================================
     */

    render(sessions) {
        // Prüfe Sessions der letzten 7 Tage
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSessions = sessions.filter(s =>
            new Date(s.date) >= sevenDaysAgo
        );

        console.log(`📊 Gefundene Sessions (letzte 7 Tage): ${recentSessions.length}`);

        // Mindestens 1 Session nötig
        if (recentSessions.length === 0) {
            return this.renderNoRecentData();
        }

        // Warnung bei wenig Daten (1-2 Sessions)
        const showWarning = recentSessions.length < 3;

        const analysis = this.analyzeVolume(sessions);
        const profile = this.getUserProfile();

        return `
        <div class="volume-analysis-section">
            ${showWarning ? this.renderDataWarning(recentSessions.length) : ''}
            ${this.renderProfileInfo(profile)}
            ${this.renderVolumeByMuscleGroup(analysis)}
            ${this.renderRecommendations(analysis)}
            ${this.renderWarnings(analysis)}
        </div>
    `;
    }

    /**
     * Keine aktuellen Daten
     */
    renderNoRecentData() {
        return `
        <div class="info-card" style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
            <h3>Keine aktuellen Trainingsdaten</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                Du hast in den letzten 7 Tagen nicht trainiert.
            </p>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                Starte ein Training, um eine Volumen-Analyse zu erhalten!
            </p>
        </div>
    `;
    }

    /**
     * Warnung bei wenig Daten
     */
    renderDataWarning(sessionCount) {
        return `
        <div style="background: var(--accent-warning); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">
                        Begrenzte Daten
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">
                        Nur ${sessionCount} Training${sessionCount === 1 ? '' : 's'} in den letzten 7 Tagen gefunden. 
                        Für genauere Empfehlungen trainiere regelmäßiger.
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    /**
     * Unzureichende Daten (VERALTET - wird nicht mehr verwendet)
     */
    renderInsufficientData() {
        return `
        <div class="info-card" style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
            <h3>Nicht genug Daten</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                Trainiere mindestens 7 Tage, um eine Volumen-Analyse zu erhalten.
            </p>
        </div>
    `;
    }


    /**
     * Profil-Info rendern
     */
    renderProfileInfo(profile) {
        const experienceLabels = {
            beginner: 'Anfänger',
            intermediate: 'Fortgeschritten',
            advanced: 'Profi'
        };

        const goalsLabels = {
            muscle_building: 'Muskelaufbau',
            strength: 'Kraftaufbau',
            endurance: 'Ausdauer',
            general_fitness: 'Allgemeine Fitness'
        };

        return `
            <div class="profile-info-card" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">👤 Dein Profil</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Erfahrung</div>
                        <div style="font-weight: 600;">${experienceLabels[profile.experience]}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Häufigkeit</div>
                        <div style="font-weight: 600;">${profile.frequency}× pro Woche</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Ziel</div>
                        <div style="font-weight: 600;">${goalsLabels[profile.goals]}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Volumen nach Muskelgruppen rendern
     */
    renderVolumeByMuscleGroup(analysis) {
        const muscles = Object.keys(analysis).sort();

        if (muscles.length === 0) {
            return '<p>Keine Daten verfügbar.</p>';
        }

        return `
            <div class="stats-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">💪 Wöchentliches Volumen (Sets)</h3>
                
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${muscles.map(muscle => {
            const data = analysis[muscle];
            const percentage = ((data.currentSets / data.optimalMax) * 100);
            const isLow = data.status === 'low';
            const isHigh = data.status === 'high';
            const isOptimal = data.status === 'optimal';

            // Farbe basierend auf Status
            let barColor = 'var(--accent-success)'; // Grün
            if (isLow) barColor = 'var(--accent-warning)'; // Orange
            if (isHigh) barColor = 'var(--accent-danger)'; // Rot

            return `
                            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${barColor};">
                                <!-- Header -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <div>
                                        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem;">
                                            ${muscle}
                                        </div>
                                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                            ${data.currentSets} Sets/Woche
                                            <span style="color: var(--text-tertiary); margin-left: 0.5rem;">
                                                (${this.formatVolume(data.currentVolume)})
                                            </span>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Optimal</div>
                                        <div style="font-weight: 600; color: var(--accent-primary);">
                                            ${data.optimalMin}-${data.optimalMax} Sets
                                        </div>
                                    </div>
                                </div>

                                <!-- Progress Bar -->
                                <div style="background: var(--bg-tertiary); border-radius: 8px; height: 12px; position: relative; overflow: hidden; margin-bottom: 1rem;">
                                    <!-- Optimal Range Marker -->
                                    <div style="position: absolute; left: ${(data.optimalMin / data.optimalMax) * 100}%; right: 0; height: 100%; background: rgba(76, 175, 80, 0.2);"></div>
                                    
                                    <!-- Current Volume Bar -->
                                    <div style="background: ${barColor}; height: 100%; width: ${Math.min(percentage, 100)}%; transition: width 0.3s ease;"></div>
                                </div>

                                <!-- Status & Empfehlung -->
                                <div style="display: flex; align-items: start; gap: 0.75rem; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                                    <span style="font-size: 1.5rem;">
                                        ${isOptimal ? '✅' : isLow ? '📈' : '⚠️'}
                                    </span>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500; margin-bottom: 0.25rem;">
                                            ${data.recommendation.message}
                                        </div>
                                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                            ${data.recommendation.detail}
                                        </div>
                                    </div>
                                </div>

                                <!-- Übungen Details (ausklappbar) -->
                                ${data.exercises && data.exercises.length > 0 ? `
                                    <details style="margin-top: 1rem;">
                                        <summary style="cursor: pointer; font-size: 0.9rem; color: var(--text-secondary); padding: 0.5rem;">
                                            📋 Übungen anzeigen (${data.exercises.length})
                                        </summary>
                                        <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-primary); border-radius: 6px;">
                                            ${data.exercises.map(ex => `
                                                <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid var(--border-color);">
                                                    <span>${ex.name}</span>
                                                    <span style="color: var(--text-secondary);">
                                                        ${ex.sets} Sets · ${this.formatVolume(ex.volume)}
                                                    </span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </details>
                                ` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Empfehlungen rendern
     */
    renderRecommendations(analysis) {
        const recommendations = [];

        Object.entries(analysis).forEach(([muscle, data]) => {
            if (data.status === 'low') {
                recommendations.push({
                    muscle,
                    type: 'increase',
                    priority: 'high',
                    message: data.recommendation.message,
                    detail: data.recommendation.detail
                });
            }
        });

        if (recommendations.length === 0) {
            return `
                <div class="stats-section" style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">💡 Empfehlungen</h3>
                    <div style="padding: 2rem; text-align: center; background: var(--bg-secondary); border-radius: 12px; border: 2px dashed var(--accent-success);">
                        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎯</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: var(--accent-success);">
                            Perfekt! Alle Muskelgruppen im optimalen Bereich!
                        </div>
                        <div style="margin-top: 0.5rem; color: var(--text-secondary);">
                            Halte dein aktuelles Trainingsvolumen bei.
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="stats-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">💡 Empfehlungen</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${recommendations.map(rec => `
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--accent-warning);">
                            <div style="display: flex; align-items: start; gap: 1rem;">
                                <span style="font-size: 2rem;">📈</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; margin-bottom: 0.5rem;">
                                        ${rec.muscle}
                                    </div>
                                    <div style="margin-bottom: 0.25rem;">
                                        ${rec.message}
                                    </div>
                                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                        ${rec.detail}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Allgemeine Tipps -->
                <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--accent-info);">
                    <div style="display: flex; align-items: start; gap: 1rem;">
                        <span style="font-size: 2rem;">💡</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">Tipps zur Volumen-Steigerung</div>
                            <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                                <li>Steigere das Volumen schrittweise (1-2 Sets pro Woche)</li>
                                <li>Achte auf ausreichende Regeneration zwischen den Trainings</li>
                                <li>Priorisiere Übungen, die mehrere Muskelgruppen ansprechen</li>
                                <li>Erhöhe erst das Volumen, dann die Intensität</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Warnungen rendern
     */
    renderWarnings(analysis) {
        const warnings = [];

        Object.entries(analysis).forEach(([muscle, data]) => {
            if (data.warning) {
                warnings.push({
                    muscle,
                    ...data.warning
                });
            }
        });

        if (warnings.length === 0) {
            return '';
        }

        return `
            <div class="stats-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">⚠️ Warnungen</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${warnings.map(warning => {
            const isHighRisk = warning.risk === 'high';
            const borderColor = isHighRisk ? 'var(--accent-danger)' : 'var(--accent-warning)';

            return `
                            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${borderColor};">
                                <div style="display: flex; align-items: start; gap: 1rem;">
                                    <span style="font-size: 2rem;">${isHighRisk ? '🚨' : '⚠️'}</span>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; margin-bottom: 0.5rem; color: ${borderColor};">
                                            ${warning.muscle} - ${warning.message}
                                        </div>
                                        <div style="margin-bottom: 0.5rem;">
                                            ${warning.detail}
                                        </div>
                                        <div style="font-size: 0.9rem; color: var(--text-secondary); padding: 1rem; background: var(--bg-primary); border-radius: 6px; margin-top: 0.5rem;">
                                            <strong>Risiken bei zu viel Volumen:</strong>
                                            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                                                <li>Übertraining und Leistungsabfall</li>
                                                <li>Erhöhtes Verletzungsrisiko</li>
                                                <li>Längere Regenerationszeiten</li>
                                                <li>Stagnation oder Rückschritte</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * ========================================
     * HELPER FUNKTIONEN
     * ========================================
     */

    /**
     * Volumen formatieren (kg)
     */
    formatVolume(volume) {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k kg`;
        }
        return `${Math.round(volume)} kg`;
    }

}



