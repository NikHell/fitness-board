/**
 * ========================================
 * Volume Analysis Module
 * ========================================
 * Intelligente Volumen-Analyse mit:
 * - Trend-Analyse
 * - Muskelgruppen-Balance
 * - Optimale Bereiche
 * - Periodisierungs-Erkennung
 * - Prognosen
 * - Adaptive Empfehlungen
 */

import { formatDate, formatNumber } from '../utils.js';

export class VolumeAnalysis {
    constructor(store) {
        this.store = store;

        // Optimale Volumen-Bereiche pro Muskelgruppe (kg/Woche)
        this.optimalRanges = {
            'Brust': { min: 30000, max: 50000 },
            'Rücken': { min: 35000, max: 55000 },
            'Beine': { min: 40000, max: 70000 },
            'Schultern': { min: 20000, max: 35000 },
            'Bizeps': { min: 10000, max: 20000 },
            'Trizeps': { min: 10000, max: 20000 },
            'Bauch': { min: 5000, max: 15000 }
        };
    }

    /**
     * ========================================
     * BENUTZER-PROFIL & EINSTELLUNGEN
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
            experience: 'intermediate',  // beginner, intermediate, advanced
            frequency: 3,                // Trainings pro Woche
            goals: 'muscle_building'     // muscle_building, strength, endurance
        };
    }

    /**
     * Speichere Benutzer-Profil
     */
    saveUserProfile(profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        this.updateOptimalRanges();
    }

    /**
     * Aktualisiere optimale Bereiche basierend auf Profil
     */
    updateOptimalRanges() {
        const profile = this.getUserProfile();

        // Basis-Multiplikatoren nach Erfahrung
        const experienceMultipliers = {
            'beginner': 0.5,      // 50% der Profi-Werte
            'intermediate': 0.75, // 75% der Profi-Werte
            'advanced': 1.0       // 100% (Profi)
        };

        // Frequenz-Multiplikatoren
        const frequencyMultipliers = {
            2: 0.7,  // 2× pro Woche: 70%
            3: 1.0,  // 3× pro Woche: 100% (Standard)
            4: 1.2,  // 4× pro Woche: 120%
            5: 1.4,  // 5×+ pro Woche: 140%
            6: 1.4,
            7: 1.4
        };

        const expMult = experienceMultipliers[profile.experience] || 0.75;
        const freqMult = frequencyMultipliers[profile.frequency] || 1.0;
        const totalMult = expMult * freqMult;

        // Basis-Werte (für Profis mit 3× Training/Woche)
        const baseRanges = {
            'Brust': { min: 30000, max: 50000 },
            'Rücken': { min: 35000, max: 55000 },
            'Beine': { min: 40000, max: 70000 },
            'Schultern': { min: 20000, max: 35000 },
            'Bizeps': { min: 10000, max: 20000 },
            'Trizeps': { min: 10000, max: 20000 },
            'Bauch': { min: 5000, max: 15000 }
        };

        // Passe Bereiche an
        this.optimalRanges = {};
        Object.entries(baseRanges).forEach(([muscle, range]) => {
            this.optimalRanges[muscle] = {
                min: Math.round(range.min * totalMult),
                max: Math.round(range.max * totalMult)
            };
        });
    }

    /**
     * Rendere Profil-Einstellungen
     */
    renderProfileSettings() {
        const profile = this.getUserProfile();

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>⚙️</span>
                    <span>Dein Trainings-Profil</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
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

                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-info);">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <span style="font-size: 1.5rem;">💡</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 0.5rem;">Deine optimalen Volumen-Bereiche:</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                ${this.getProfileDescription(profile)}
                            </div>
                        </div>
                    </div>
                </div>

                <button id="saveProfileBtn" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">
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

        const expMult = {
            'beginner': 0.5,
            'intermediate': 0.75,
            'advanced': 1.0
        }[profile.experience];

        const freqMult = {
            2: 0.7,
            3: 1.0,
            4: 1.2,
            5: 1.4,
            6: 1.4,
            7: 1.4
        }[profile.frequency] || 1.0;

        const totalMult = expMult * freqMult;
        const percentage = Math.round(totalMult * 100);

        return `
            Als <strong>${expLabels[profile.experience]}</strong> mit <strong>${profile.frequency}× Training/Woche</strong> 
            sind deine optimalen Bereiche bei <strong>${percentage}%</strong> der Profi-Werte.
            <br><br>
            Beispiel Brust: ${this.formatVolume(30000 * totalMult)} - ${this.formatVolume(50000 * totalMult)} pro Woche
        `;
    }


    /**
     * ========================================
     * Haupt-Render-Methode
     * ========================================
     */

    /**
     * Komplette Volumen-Analyse rendern
     * @param {Array} sessions - Training Sessions
     * @returns {string} HTML
     */
    render(sessions) {
        // Aktualisiere Bereiche basierend auf Profil
        this.updateOptimalRanges();

        if (!sessions || sessions.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="volume-analysis-container">
                ${this.renderHeader()}
                ${this.renderProfileSettings()}  ← NEU!
                ${this.renderTrendAnalysis(sessions)}
                ${this.renderMuscleGroupBalance(sessions)}
                ${this.renderOptimalRanges(sessions)}
                ${this.renderPeriodization(sessions)}
                ${this.renderWarnings(sessions)}
                ${this.renderRecommendations(sessions)}
            </div>
        `;
    }

    /**
     * Empty State
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-title">Nicht genug Daten</div>
                <div class="empty-state-text">Trainiere mindestens 2 Wochen, um eine Volumen-Analyse zu sehen.</div>
            </div>
        `;
    }

    /**
     * Header
     */
    renderHeader() {
        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span>🧠</span>
                    <span>Intelligente Volumen-Analyse</span>
                </h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    KI-gestützte Analyse deines Trainingsvolumens mit personalisierten Empfehlungen
                </p>
            </div>
        `;
    }

    /**
     * ========================================
     * 1. TREND-ANALYSE
     * ========================================
     */

    renderTrendAnalysis(sessions) {
        const weeks = this.groupSessionsByWeek(sessions);
        const weekData = Object.entries(weeks)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-8); // Letzte 8 Wochen

        if (weekData.length < 2) {
            return '';
        }

        const weeklyVolumes = weekData.map(([week, sessions]) => ({
            week,
            volume: this.calculateTotalVolume(sessions),
            sessions: sessions.length
        }));

        // Berechne Trends
        const avgVolume = weeklyVolumes.reduce((sum, w) => sum + w.volume, 0) / weeklyVolumes.length;
        const lastWeek = weeklyVolumes[weeklyVolumes.length - 1];
        const prevWeek = weeklyVolumes[weeklyVolumes.length - 2];
        const weekChange = ((lastWeek.volume - prevWeek.volume) / prevWeek.volume * 100).toFixed(1);

        // Gesamttrend
        const firstWeek = weeklyVolumes[0];
        const totalTrend = ((lastWeek.volume - firstWeek.volume) / firstWeek.volume * 100).toFixed(1);

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>📈</span>
                    <span>Volumen-Trend (${weekData.length} Wochen)</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="stat-card">
                        <div class="stat-card-title">Ø Volumen</div>
                        <div class="stat-card-value">${this.formatVolume(avgVolume)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Letzte Woche</div>
                        <div class="stat-card-value">${this.formatVolume(lastWeek.volume)}</div>
                        <div style="font-size: 0.85rem; color: ${weekChange > 0 ? 'var(--accent-primary)' : 'var(--accent-danger)'};">
                            ${weekChange > 0 ? '↗' : '↘'} ${Math.abs(weekChange)}%
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Gesamt-Trend</div>
                        <div class="stat-card-value" style="color: ${totalTrend > 0 ? 'var(--accent-primary)' : 'var(--accent-danger)'};">
                            ${totalTrend > 0 ? '+' : ''}${totalTrend}%
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${weeklyVolumes.map((week, index) => {
            const prevWeek = index > 0 ? weeklyVolumes[index - 1] : null;
            const change = prevWeek ? ((week.volume - prevWeek.volume) / prevWeek.volume * 100).toFixed(1) : 0;
            const isDeload = change < -20;

            return `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-primary); border-radius: 8px;">
                                <div style="flex: 0 0 100px; font-size: 0.9rem; color: var(--text-secondary);">
                                    Woche ${index + 1}
                                </div>
                                <div style="flex: 1; background: var(--bg-secondary); border-radius: 4px; height: 24px; position: relative; overflow: hidden;">
                                    <div style="background: ${isDeload ? 'var(--accent-info)' : 'var(--accent-primary)'}; height: 100%; width: ${(week.volume / avgVolume * 50).toFixed(0)}%; transition: width 0.3s;"></div>
                                </div>
                                <div style="flex: 0 0 100px; text-align: right; font-weight: 500;">
                                    ${this.formatVolume(week.volume)}
                                </div>
                                <div style="flex: 0 0 80px; text-align: right; font-size: 0.85rem; color: ${change > 0 ? 'var(--accent-primary)' : change < -20 ? 'var(--accent-info)' : 'var(--accent-danger)'};">
                                    ${prevWeek ? `${change > 0 ? '+' : ''}${change}%` : '—'}
                                    ${isDeload ? ' 📉' : ''}
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
     * 2. MUSKELGRUPPEN-BALANCE
     * ========================================
     */

    renderMuscleGroupBalance(sessions) {
        const muscleGroups = this.getVolumeByMuscleGroup(sessions);
        const totalVolume = Object.values(muscleGroups).reduce((sum, vol) => sum + vol, 0);

        if (Object.keys(muscleGroups).length === 0) return '';

        // Sortiere nach Volumen
        const sorted = Object.entries(muscleGroups).sort((a, b) => b[1] - a[1]);

        // Berechne Push/Pull Ratio
        const pushMuscles = ['Brust', 'Schultern', 'Trizeps'];
        const pullMuscles = ['Rücken', 'Bizeps'];

        const pushVolume = sorted
            .filter(([muscle]) => pushMuscles.includes(muscle))
            .reduce((sum, [_, vol]) => sum + vol, 0);

        const pullVolume = sorted
            .filter(([muscle]) => pullMuscles.includes(muscle))
            .reduce((sum, [_, vol]) => sum + vol, 0);

        const pushPullRatio = pullVolume > 0 ? (pushVolume / pullVolume).toFixed(2) : 0;

        // Finde Ungleichgewichte
        const imbalances = this.detectImbalances(muscleGroups, totalVolume);

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>⚖️</span>
                    <span>Muskelgruppen-Balance</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="stat-card">
                        <div class="stat-card-title">Push/Pull Ratio</div>
                        <div class="stat-card-value" style="color: ${Math.abs(pushPullRatio - 1) < 0.2 ? 'var(--accent-primary)' : 'var(--accent-warning)'};">
                            ${pushPullRatio}:1
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${Math.abs(pushPullRatio - 1) < 0.2 ? '✅ Ausgewogen' : '⚠️ Ungleichgewicht'}
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Trainierte Gruppen</div>
                        <div class="stat-card-value">${sorted.length}</div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                    ${sorted.map(([muscleGroup, volume]) => {
            const percentage = ((volume / totalVolume) * 100).toFixed(0);
            const status = this.getMuscleGroupStatus(muscleGroup, volume, totalVolume);

            return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <div style="font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
                                        <span>${muscleGroup}</span>
                                        <span style="font-size: 0.85rem;">${status.icon}</span>
                                    </div>
                                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                        ${this.formatVolume(volume)} (${percentage}%)
                                    </div>
                                </div>
                                <div style="background: var(--bg-primary); border-radius: 6px; height: 28px; position: relative; overflow: hidden;">
                                    <div style="background: ${status.color}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">
                                        ${percentage}%
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>

                ${imbalances.length > 0 ? `
                    <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-warning);">
                        <div style="font-weight: 500; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                            <span>⚠️</span>
                            <span>Erkannte Ungleichgewichte:</span>
                        </div>
                        <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                            ${imbalances.map(imbalance => `<li>${imbalance}</li>`).join('')}
                        </ul>
                    </div>
                ` : `
                    <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-primary);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>✅</span>
                            <span style="font-weight: 500;">Gute Balance zwischen den Muskelgruppen!</span>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * ========================================
     * 3. OPTIMALE BEREICHE
     * ========================================
     */

    renderOptimalRanges(sessions) {
        const weeklyVolume = this.getWeeklyVolumeByMuscleGroup(sessions);

        if (Object.keys(weeklyVolume).length === 0) return '';

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>🎯</span>
                    <span>Optimale Volumen-Bereiche</span>
                </h3>

                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${Object.entries(weeklyVolume).map(([muscleGroup, volume]) => {
            const optimal = this.optimalRanges[muscleGroup];
            if (!optimal) return '';

            const status = this.getOptimalRangeStatus(volume, optimal);
            const percentage = ((volume - optimal.min) / (optimal.max - optimal.min) * 100);
            const clampedPercentage = Math.max(0, Math.min(100, percentage));

            return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <div style="font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
                                        <span>${muscleGroup}</span>
                                        <span style="font-size: 0.85rem;">${status.icon}</span>
                                    </div>
                                    <div style="font-size: 0.9rem; color: ${status.color};">
                                        ${this.formatVolume(volume)}/Woche
                                    </div>
                                </div>
                                
                                <div style="position: relative; background: var(--bg-primary); border-radius: 6px; height: 32px; overflow: hidden;">
                                    <!-- Optimaler Bereich (grün) -->
                                    <div style="position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(76, 175, 80, 0.2) 20%, rgba(76, 175, 80, 0.2) 80%, transparent 100%);"></div>
                                    
                                    <!-- Aktuelles Volumen -->
                                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${clampedPercentage}%; background: ${status.color}; transition: width 0.3s;"></div>
                                    
                                    <!-- Labels -->
                                    <div style="position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-secondary);">
                                        ${this.formatVolume(optimal.min)}
                                    </div>
                                    <div style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-secondary);">
                                        ${this.formatVolume(optimal.max)}
                                    </div>
                                </div>
                                
                                <div style="margin-top: 0.5rem; font-size: 0.85rem; color: ${status.color};">
                                    ${status.text}
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
     * 4. PERIODISIERUNG
     * ========================================
     */

    renderPeriodization(sessions) {
        const weeks = this.groupSessionsByWeek(sessions);
        const weekData = Object.entries(weeks)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-8);

        if (weekData.length < 4) return '';

        const weeklyVolumes = weekData.map(([week, sessions]) => ({
            week,
            volume: this.calculateTotalVolume(sessions)
        }));

        // Erkenne Deload-Wochen
        const deloadWeeks = [];
        const buildupWeeks = [];

        weeklyVolumes.forEach((week, index) => {
            if (index === 0) return;

            const prevWeek = weeklyVolumes[index - 1];
            const change = ((week.volume - prevWeek.volume) / prevWeek.volume * 100);

            if (change < -20) {
                deloadWeeks.push(index);
            } else if (change > 5) {
                buildupWeeks.push(index);
            }
        });

        // Berechne Wochen seit letztem Deload
        const lastDeloadIndex = deloadWeeks.length > 0 ? Math.max(...deloadWeeks) : -1;
        const weeksSinceDeload = lastDeloadIndex >= 0 ? weeklyVolumes.length - 1 - lastDeloadIndex : weeklyVolumes.length;

        const needsDeload = weeksSinceDeload >= 4;

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>📅</span>
                    <span>Periodisierungs-Analyse</span>
                </h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="stat-card">
                        <div class="stat-card-title">Deload-Wochen</div>
                        <div class="stat-card-value">${deloadWeeks.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            in ${weeklyVolumes.length} Wochen
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Seit letztem Deload</div>
                        <div class="stat-card-value" style="color: ${needsDeload ? 'var(--accent-warning)' : 'var(--accent-primary)'};">
                            ${weeksSinceDeload} Wochen
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${needsDeload ? '⚠️ Deload empfohlen' : '✅ Gut'}
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-title">Aufbau-Wochen</div>
                        <div class="stat-card-value">${buildupWeeks.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            Progressive Steigerung
                        </div>
                    </div>
                </div>

                ${needsDeload ? `
                    <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-warning);">
                        <div style="display: flex; align-items: start; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">⚠️</span>
                            <div>
                                <div style="font-weight: 500; margin-bottom: 0.5rem;">Deload-Woche empfohlen!</div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                    Du hast ${weeksSinceDeload} Wochen ohne Deload trainiert. 
                                    Plane nächste Woche eine Deload-Woche ein (60% des normalen Volumens).
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-primary);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>✅</span>
                            <span style="font-weight: 500;">Gute Periodisierung! Weiter so!</span>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * ========================================
     * 5. WARNUNGEN
     * ========================================
     */

    renderWarnings(sessions) {
        const warnings = this.detectWarnings(sessions);

        if (warnings.length === 0) return '';

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>🚨</span>
                    <span>Warnungen & Hinweise</span>
                </h3>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${warnings.map(warning => `
                        <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid ${warning.color};">
                            <div style="display: flex; align-items: start; gap: 0.75rem;">
                                <span style="font-size: 1.5rem;">${warning.icon}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; margin-bottom: 0.5rem; color: ${warning.color};">
                                        ${warning.title}
                                    </div>
                                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                                        ${warning.description}
                                    </div>
                                    ${warning.recommendation ? `
                                        <div style="font-size: 0.9rem; color: var(--text-primary); padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px;">
                                            💡 ${warning.recommendation}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * ========================================
     * 6. EMPFEHLUNGEN
     * ========================================
     */

    renderRecommendations(sessions) {
        const recommendations = this.generateRecommendations(sessions);

        if (recommendations.length === 0) return '';

        return `
            <div class="analysis-section" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <span>💡</span>
                    <span>Personalisierte Empfehlungen</span>
                </h3>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${recommendations.map((rec, index) => `
                        <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-primary);">
                            <div style="display: flex; align-items: start; gap: 0.75rem;">
                                <div style="flex: 0 0 24px; height: 24px; background: var(--accent-primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem;">
                                    ${index + 1}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; margin-bottom: 0.5rem;">
                                        ${rec.title}
                                    </div>
                                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                        ${rec.description}
                                    </div>
                                    ${rec.action ? `
                                        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--accent-primary); font-weight: 500;">
                                            → ${rec.action}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * ========================================
     * HILFSMETHODEN - BERECHNUNGEN
     * ========================================
     */

    /**
     * Gruppiere Sessions nach Woche
     */
    groupSessionsByWeek(sessions) {
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

        return weeks;
    }

    /**
     * Berechne Gesamtvolumen
     */
    calculateTotalVolume(sessions) {
        return sessions.reduce((total, session) => {
            return total + this.calculateSessionVolume(session);
        }, 0);
    }

    /**
     * Berechne Session-Volumen
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
     * Volumen nach Muskelgruppen
     */
    getVolumeByMuscleGroup(sessions) {
        const muscleGroups = {};

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

        return muscleGroups;
    }

    /**
     * Wöchentliches Volumen nach Muskelgruppen
     */
    getWeeklyVolumeByMuscleGroup(sessions) {
        const weeks = this.groupSessionsByWeek(sessions);
        const recentWeek = Object.entries(weeks)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];

        if (!recentWeek) return {};

        return this.getVolumeByMuscleGroup(recentWeek[1]);
    }

    /**
     * ========================================
     * HILFSMETHODEN - STATUS & ANALYSE
     * ========================================
     */

    /**
     * Muskelgruppen-Status
     */
    getMuscleGroupStatus(muscleGroup, volume, totalVolume) {
        const percentage = (volume / totalVolume) * 100;

        if (percentage > 40) {
            return { icon: '⚠️', color: 'var(--accent-warning)' };
        } else if (percentage < 10) {
            return { icon: '❌', color: 'var(--accent-danger)' };
        } else {
            return { icon: '✅', color: 'var(--accent-primary)' };
        }
    }

    /**
     * Optimaler Bereich Status
     */
    getOptimalRangeStatus(volume, optimal) {
        if (volume < optimal.min) {
            const deficit = ((optimal.min - volume) / optimal.min * 100).toFixed(0);
            return {
                icon: '❌',
                color: 'var(--accent-danger)',
                text: `${deficit}% unter Minimum - Erhöhe das Volumen!`
            };
        } else if (volume > optimal.max) {
            const excess = ((volume - optimal.max) / optimal.max * 100).toFixed(0);
            return {
                icon: '⚠️',
                color: 'var(--accent-warning)',
                text: `${excess}% über Maximum - Reduziere das Volumen!`
            };
        } else {
            return {
                icon: '✅',
                color: 'var(--accent-primary)',
                text: 'Im optimalen Bereich!'
            };
        }
    }

    /**
     * Erkenne Ungleichgewichte
     */
    detectImbalances(muscleGroups, totalVolume) {
        const imbalances = [];
        const sorted = Object.entries(muscleGroups).sort((a, b) => b[1] - a[1]);

        // Dominante Muskelgruppe
        if (sorted.length > 0) {
            const [topMuscle, topVolume] = sorted[0];
            const topPercentage = (topVolume / totalVolume) * 100;

            if (topPercentage > 40) {
                imbalances.push(`${topMuscle} dominiert mit ${topPercentage.toFixed(0)}% des Volumens`);
            }
        }

        // Untertrainierte Muskelgruppen
        sorted.forEach(([muscle, volume]) => {
            const percentage = (volume / totalVolume) * 100;
            if (percentage < 10) {
                imbalances.push(`${muscle} ist untertrainiert (nur ${percentage.toFixed(0)}%)`);
            }
        });

        // Push/Pull Ungleichgewicht
        const pushMuscles = ['Brust', 'Schultern', 'Trizeps'];
        const pullMuscles = ['Rücken', 'Bizeps'];

        const pushVolume = sorted
            .filter(([muscle]) => pushMuscles.includes(muscle))
            .reduce((sum, [_, vol]) => sum + vol, 0);

        const pullVolume = sorted
            .filter(([muscle]) => pullMuscles.includes(muscle))
            .reduce((sum, [_, vol]) => sum + vol, 0);

        if (pullVolume > 0) {
            const ratio = pushVolume / pullVolume;
            if (Math.abs(ratio - 1) > 0.3) {
                imbalances.push(`Push/Pull Verhältnis unausgeglichen (${ratio.toFixed(2)}:1)`);
            }
        }

        return imbalances;
    }

    /**
     * Erkenne Warnungen
     */
    detectWarnings(sessions) {
        const warnings = [];
        const weeks = this.groupSessionsByWeek(sessions);
        const weekData = Object.entries(weeks)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-8);

        if (weekData.length < 2) return warnings;

        const weeklyVolumes = weekData.map(([week, sessions]) => ({
            week,
            volume: this.calculateTotalVolume(sessions)
        }));

        // Übertraining-Risiko
        const lastWeek = weeklyVolumes[weeklyVolumes.length - 1];
        const avgVolume = weeklyVolumes.reduce((sum, w) => sum + w.volume, 0) / weeklyVolumes.length;

        if (lastWeek.volume > avgVolume * 1.3) {
            warnings.push({
                icon: '⚠️',
                color: 'var(--accent-warning)',
                title: 'Übertraining-Risiko',
                description: `Dein Volumen ist ${((lastWeek.volume / avgVolume - 1) * 100).toFixed(0)}% über dem Durchschnitt.`,
                recommendation: 'Reduziere das Volumen nächste Woche oder plane einen Deload ein.'
            });
        }

        // Zu wenig Volumen
        if (lastWeek.volume < avgVolume * 0.5 && weeklyVolumes.length > 4) {
            warnings.push({
                icon: '📉',
                color: 'var(--accent-info)',
                title: 'Niedriges Volumen',
                description: 'Dein aktuelles Volumen ist deutlich unter deinem Durchschnitt.',
                recommendation: 'Wenn dies kein geplanter Deload ist, erhöhe das Volumen wieder.'
            });
        }

        // Lange ohne Deload
        const deloadWeeks = weeklyVolumes.filter((week, index) => {
            if (index === 0) return false;
            const prevWeek = weeklyVolumes[index - 1];
            return ((week.volume - prevWeek.volume) / prevWeek.volume) < -0.2;
        });

        const lastDeloadIndex = deloadWeeks.length > 0
            ? weeklyVolumes.findIndex(w => w === deloadWeeks[deloadWeeks.length - 1])
            : -1;

        const weeksSinceDeload = lastDeloadIndex >= 0
            ? weeklyVolumes.length - 1 - lastDeloadIndex
            : weeklyVolumes.length;

        if (weeksSinceDeload >= 5) {
            warnings.push({
                icon: '🚨',
                color: 'var(--accent-danger)',
                title: 'Deload überfällig',
                description: `Du hast ${weeksSinceDeload} Wochen ohne Deload trainiert.`,
                recommendation: 'Plane DRINGEND eine Deload-Woche ein (60% des normalen Volumens).'
            });
        }

        return warnings;
    }

    /**
     * Generiere Empfehlungen
     */
    generateRecommendations(sessions) {
        const recommendations = [];
        const muscleGroups = this.getVolumeByMuscleGroup(sessions);
        const weeklyVolume = this.getWeeklyVolumeByMuscleGroup(sessions);
        const totalVolume = Object.values(muscleGroups).reduce((sum, vol) => sum + vol, 0);

        // Muskelgruppen-Empfehlungen
        Object.entries(weeklyVolume).forEach(([muscle, volume]) => {
            const optimal = this.optimalRanges[muscle];
            if (!optimal) return;

            if (volume < optimal.min) {
                const needed = optimal.min - volume;
                recommendations.push({
                    title: `Erhöhe ${muscle}-Volumen`,
                    description: `Aktuell: ${this.formatVolume(volume)}/Woche. Optimal: ${this.formatVolume(optimal.min)}-${this.formatVolume(optimal.max)}/Woche.`,
                    action: `Füge ${this.formatVolume(needed)} mehr Volumen hinzu (ca. 1-2 Übungen)`
                });
            } else if (volume > optimal.max) {
                const excess = volume - optimal.max;
                recommendations.push({
                    title: `Reduziere ${muscle}-Volumen`,
                    description: `Aktuell: ${this.formatVolume(volume)}/Woche. Du trainierst zu viel!`,
                    action: `Reduziere um ${this.formatVolume(excess)} (ca. 1-2 Übungen weniger)`
                });
            }
        });

        // Periodisierungs-Empfehlung
        const weeks = this.groupSessionsByWeek(sessions);
        const weekData = Object.entries(weeks)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(-8);

        if (weekData.length >= 4) {
            const weeklyVolumes = weekData.map(([week, sessions]) => ({
                volume: this.calculateTotalVolume(sessions)
            }));

            const deloadWeeks = weeklyVolumes.filter((week, index) => {
                if (index === 0) return false;
                const prevWeek = weeklyVolumes[index - 1];
                return ((week.volume - prevWeek.volume) / prevWeek.volume) < -0.2;
            });

            const weeksSinceDeload = deloadWeeks.length > 0
                ? weeklyVolumes.length - 1 - weeklyVolumes.findIndex(w => w === deloadWeeks[deloadWeeks.length - 1])
                : weeklyVolumes.length;

            if (weeksSinceDeload >= 3) {
                recommendations.push({
                    title: 'Plane einen Deload ein',
                    description: `Du hast ${weeksSinceDeload} Wochen ohne Deload trainiert.`,
                    action: 'Nächste Woche: 60% des normalen Volumens, gleiche Übungen'
                });
            }
        }

        // Limitiere auf Top 5
        return recommendations.slice(0, 5);
    }

    /**
     * ========================================
     * HILFSMETHODEN - FORMATIERUNG
     * ========================================
     */

    /**
     * Formatiere Volumen
     */
    formatVolume(volume) {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k kg`;
        }
        return `${formatNumber(volume)} kg`;
    }
}




