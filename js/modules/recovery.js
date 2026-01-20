/**
 * Recovery & Deload Tracking Module
 * Überwacht Trainingsvolumen, erkennt Übertraining und schlägt Deload-Wochen vor
 */

export class RecoveryModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // Schwellenwerte
        this.thresholds = {
            volumeIncrease: 1.3,      // 30% Volumen-Anstieg = Warnung
            consecutiveDays: 6,        // 6 Tage Training in Folge = Warnung
            deloadWeeks: 4,            // Alle 4 Wochen Deload empfehlen
            minRecoveryScore: 60       // Unter 60% = schlechte Regeneration
        };
    }

    /**
     * Initialisierung
     */
    init() {
        console.log('🔄 Recovery Module initialisiert');
        this.setupEventListeners();
        this.checkRecoveryStatus();
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Nach jedem Training Recovery-Status aktualisieren
        this.eventBus.on('trainingCompleted', () => {
            this.checkRecoveryStatus();
            this.checkDeloadNeeded();
        });
    }

    /**
     * Regenerations-Score berechnen (0-100%)
     */
    calculateRecoveryScore() {
        const sessions = this.store.getTrainingSessions();
        const now = new Date();
        const last7Days = sessions.filter(s => {
            const sessionDate = new Date(s.date);
            const daysDiff = (now - sessionDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        });

        if (last7Days.length === 0) {
            return 100; // Voll erholt, wenn nicht trainiert
        }

        let score = 100;

        // Faktor 1: Trainingsfrequenz (je mehr, desto niedriger)
        const frequency = last7Days.length;
        score -= frequency * 8; // -8% pro Training

        // Faktor 2: Volumen-Belastung
        const totalVolume = this.calculateWeeklyVolume(last7Days);
        const avgVolume = this.getAverageWeeklyVolume();

        if (avgVolume > 0) {
            const volumeRatio = totalVolume / avgVolume;
            if (volumeRatio > 1.2) {
                score -= (volumeRatio - 1) * 30; // Hohe Belastung
            }
        }

        // Faktor 3: Aufeinanderfolgende Trainingstage
        const consecutiveDays = this.getConsecutiveTrainingDays();
        if (consecutiveDays > 3) {
            score -= (consecutiveDays - 3) * 10;
        }

        // Faktor 4: Zeit seit letztem Training
        const lastSession = last7Days[last7Days.length - 1];
        const hoursSinceLastTraining = (now - new Date(lastSession.date)) / (1000 * 60 * 60);

        if (hoursSinceLastTraining > 48) {
            score += 10; // Bonus für Ruhetage
        }

        // Score begrenzen
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Wöchentliches Volumen berechnen
     */
    calculateWeeklyVolume(sessions) {
        let totalVolume = 0;

        sessions.forEach(session => {
            session.exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                    if (set.weight && set.reps) {
                        totalVolume += set.weight * set.reps;
                    }
                });
            });
        });

        return totalVolume;
    }

    /**
     * Durchschnittliches wöchentliches Volumen
     */
    getAverageWeeklyVolume() {
        const sessions = this.store.getTrainingSessions();
        const weeks = this.groupSessionsByWeek(sessions);

        if (weeks.length === 0) return 0;

        const totalVolume = weeks.reduce((sum, week) => {
            return sum + this.calculateWeeklyVolume(week);
        }, 0);

        return totalVolume / weeks.length;
    }

    /**
     * Sessions nach Wochen gruppieren
     */
    groupSessionsByWeek(sessions) {
        const weeks = {};

        sessions.forEach(session => {
            const date = new Date(session.date);
            const weekKey = this.getWeekKey(date);

            if (!weeks[weekKey]) {
                weeks[weekKey] = [];
            }
            weeks[weekKey].push(session);
        });

        return Object.values(weeks);
    }

    /**
     * Wochen-Schlüssel generieren (Jahr-Woche)
     */
    getWeekKey(date) {
        const year = date.getFullYear();
        const week = this.getWeekNumber(date);
        return `${year}-W${week}`;
    }

    /**
     * Kalenderwoche berechnen
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Aufeinanderfolgende Trainingstage zählen
     */
    getConsecutiveTrainingDays() {
        const sessions = this.store.getTrainingSessions();
        if (sessions.length === 0) return 0;

        // Nach Datum sortieren (neueste zuerst)
        const sorted = sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

        let consecutive = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let session of sorted) {
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === consecutive) {
                consecutive++;
            } else {
                break;
            }
        }

        return consecutive;
    }

    /**
     * Prüfen ob Deload nötig ist
     */
    checkDeloadNeeded() {
        const sessions = this.store.getTrainingSessions();
        if (sessions.length === 0) return false;

        const lastDeload = this.getLastDeloadDate();
        const weeksSinceDeload = this.getWeeksSince(lastDeload);

        // Deload alle 4 Wochen empfehlen
        if (weeksSinceDeload >= this.thresholds.deloadWeeks) {
            this.eventBus.emit('deloadRecommended', {
                weeksSinceDeload,
                reason: 'Zeitbasiert (4 Wochen)'
            });
            return true;
        }

        // Volumen-basierte Empfehlung
        const currentVolume = this.calculateWeeklyVolume(this.getLastWeekSessions());
        const avgVolume = this.getAverageWeeklyVolume();

        if (currentVolume > avgVolume * this.thresholds.volumeIncrease) {
            this.eventBus.emit('deloadRecommended', {
                volumeIncrease: ((currentVolume / avgVolume - 1) * 100).toFixed(0) + '%',
                reason: 'Hohes Volumen'
            });
            return true;
        }

        // Aufeinanderfolgende Trainingstage
        const consecutiveDays = this.getConsecutiveTrainingDays();
        if (consecutiveDays >= this.thresholds.consecutiveDays) {
            this.eventBus.emit('deloadRecommended', {
                consecutiveDays,
                reason: 'Zu viele aufeinanderfolgende Trainingstage'
            });
            return true;
        }

        return false;
    }

    /**
     * Letztes Deload-Datum abrufen
     */
    getLastDeloadDate() {
        const deloadData = localStorage.getItem('lastDeload');
        return deloadData ? new Date(deloadData) : new Date(0);
    }

    /**
     * Deload markieren
     */
    markDeloadWeek() {
        localStorage.setItem('lastDeload', new Date().toISOString());
        this.eventBus.emit('deloadMarked');
        this.eventBus.emit('showToast', {
            message: '✅ Deload-Woche markiert!',
            type: 'success'
        });
    }

    /**
     * Wochen seit Datum berechnen
     */
    getWeeksSince(date) {
        const now = new Date();
        const diff = now - date;
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    }

    /**
     * Sessions der letzten Woche
     */
    getLastWeekSessions() {
        const sessions = this.store.getTrainingSessions();
        const now = new Date();

        return sessions.filter(s => {
            const sessionDate = new Date(s.date);
            const daysDiff = (now - sessionDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        });
    }

    /**
     * Recovery-Status prüfen
     */
    checkRecoveryStatus() {
        const score = this.calculateRecoveryScore();

        if (score < this.thresholds.minRecoveryScore) {
            this.eventBus.emit('lowRecovery', { score });
        }

        return {
            score,
            status: this.getRecoveryStatus(score),
            consecutiveDays: this.getConsecutiveTrainingDays(),
            weeksSinceDeload: this.getWeeksSince(this.getLastDeloadDate())
        };
    }

    /**
     * Recovery-Status als Text
     */
    getRecoveryStatus(score) {
        if (score >= 80) return 'Ausgezeichnet';
        if (score >= 60) return 'Gut';
        if (score >= 40) return 'Mäßig';
        if (score >= 20) return 'Schlecht';
        return 'Kritisch';
    }

    /**
     * Recovery-Daten für UI
     */
    getRecoveryData() {
        const score = this.calculateRecoveryScore();
        const status = this.checkRecoveryStatus();
        const deloadNeeded = this.checkDeloadNeeded();

        return {
            score,
            status: status.status,
            consecutiveDays: status.consecutiveDays,
            weeksSinceDeload: status.weeksSinceDeload,
            deloadNeeded,
            recommendations: this.getRecommendations(score, status)
        };
    }

    /**
     * Empfehlungen generieren
     */
    getRecommendations(score, status) {
        const recommendations = [];

        if (score < 40) {
            recommendations.push({
                icon: '😴',
                text: 'Ruhetag einlegen',
                priority: 'high'
            });
        }

        if (status.consecutiveDays >= 5) {
            recommendations.push({
                icon: '🛑',
                text: 'Mindestens 1 Ruhetag nehmen',
                priority: 'high'
            });
        }

        if (status.weeksSinceDeload >= 4) {
            recommendations.push({
                icon: '📉',
                text: 'Deload-Woche durchführen',
                priority: 'medium'
            });
        }

        if (score >= 80) {
            recommendations.push({
                icon: '💪',
                text: 'Bereit für intensives Training',
                priority: 'low'
            });
        }

        return recommendations;
    }

    /**
     * Recovery-View rendern
     */
    render() {
        const data = this.getRecoveryData();

        // Score anzeigen
        this.renderScore(data);

        // Stats anzeigen
        this.renderStats(data);

        // Empfehlungen rendern
        this.renderRecommendations(data.recommendations);

        // Deload-Button Event
        this.setupDeloadButton();
    }

    /**
     * Score-Anzeige rendern
     */
    renderScore(data) {
        const scoreValue = document.getElementById('recoveryScoreValue');
        const scoreCircle = document.getElementById('recoveryScoreCircle');
        const scoreStatus = document.getElementById('recoveryStatus');

        if (!scoreValue || !scoreCircle || !scoreStatus) return;

        scoreValue.textContent = data.score;
        scoreStatus.textContent = data.status;

        // Score-Klasse setzen
        scoreCircle.className = 'score-circle';
        if (data.score >= 80) scoreCircle.classList.add('excellent');
        else if (data.score >= 60) scoreCircle.classList.add('good');
        else if (data.score >= 40) scoreCircle.classList.add('moderate');
        else if (data.score >= 20) scoreCircle.classList.add('poor');
        else scoreCircle.classList.add('critical');
    }

    /**
     * Statistiken rendern
     */
    renderStats(data) {
        const consecutiveDays = document.getElementById('consecutiveDays');
        const weeksSinceDeload = document.getElementById('weeksSinceDeload');
        const weeklyVolume = document.getElementById('weeklyVolume');

        if (consecutiveDays) {
            consecutiveDays.textContent = data.consecutiveDays;
        }

        if (weeksSinceDeload) {
            weeksSinceDeload.textContent = data.weeksSinceDeload;
        }

        if (weeklyVolume) {
            const sessions = this.getLastWeekSessions();
            const volume = this.calculateWeeklyVolume(sessions);
            weeklyVolume.textContent = Math.round(volume / 1000) + 'k';
        }
    }

    /**
     * Empfehlungen rendern
     */
    renderRecommendations(recommendations) {
        const list = document.getElementById('recommendationsList');
        if (!list) return;

        if (recommendations.length === 0) {
            list.innerHTML = `
            <div class="recovery-empty">
                <div class="recovery-empty-icon">✅</div>
                <h3>Alles im grünen Bereich!</h3>
                <p>Keine besonderen Empfehlungen. Weiter so!</p>
            </div>
        `;
            return;
        }

        list.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item priority-${rec.priority}">
            <div class="recommendation-icon">${rec.icon}</div>
            <div class="recommendation-text">${rec.text}</div>
        </div>
    `).join('');
    }

    /**
     * Deload-Button Setup
     */
    setupDeloadButton() {
        const markDeloadBtn = document.getElementById('markDeloadBtn');
        if (!markDeloadBtn) return;

        // Alten Event-Listener entfernen (falls vorhanden)
        const newBtn = markDeloadBtn.cloneNode(true);
        markDeloadBtn.parentNode.replaceChild(newBtn, markDeloadBtn);

        // Neuen Event-Listener hinzufügen
        newBtn.addEventListener('click', () => {
            this.markDeloadWeek();
            this.render(); // Neu rendern
        });
    }

}


