
import { formatTime } from '../utils.js';

export class TimerModule {
    constructor(store, eventBus) {
        this.store = store;
        this.eventBus = eventBus;

        // State
        this.currentMode = 'countdown';
        this.isRunning = false;
        this.isPaused = false;
        this.seconds = 60;
        this.targetSeconds = 60;
        this.intervalId = null;

        // Intervall-Timer
        this.intervalWorkSeconds = 30;
        this.intervalRestSeconds = 10;
        this.intervalRounds = 8;
        this.currentRound = 0;
        this.isWorkPhase = true;

        // Presets
        this.presets = [
            { name: '30s', seconds: 30 },
            { name: '1min', seconds: 60 },
            { name: '90s', seconds: 90 },
            { name: '2min', seconds: 120 },
            { name: '3min', seconds: 180 },
            { name: '5min', seconds: 300 }
        ];
    }

    /**
     * Initialisierung
     */
    init() {
        console.log('✅ Timer-Modul initialisiert');

        // Event-Bus Listener
        this.eventBus.on('viewChanged', (data) => {
            if (data.view === 'timer') {
                // Warte kurz, bis View sichtbar ist
                setTimeout(() => {
                    this.render();
                    this.attachAllListeners();
                }, 100);
            }
        });
    }

    /**
     * Alle Event-Listener anhängen
     */
    attachAllListeners() {
        // Timer-Tabs
        const tabs = document.querySelectorAll('.timer-tab');
        tabs.forEach(tab => {
            // Entferne alte Listener
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);

            // Füge neuen Listener hinzu
            newTab.addEventListener('click', () => {
                const mode = newTab.dataset.mode;
                console.log('Tab geklickt:', mode);
                this.switchMode(mode);
            });
        });

        console.log('✅ Timer Event-Listener angehängt');
    }

    /**
     * Rendering
     */
    render() {
        this.updateDisplay();
        this.renderControls();
        this.renderPresets();
    }

    /**
     * Display aktualisieren
     */
    updateDisplay() {
        const displayEl = document.getElementById('timerDisplay');
        if (!displayEl) {
            console.error('❌ timerDisplay nicht gefunden');
            return;
        }

        let displayText = '';

        switch(this.currentMode) {
            case 'countdown':
                displayText = formatTime(this.seconds);
                break;
            case 'stopwatch':
                displayText = formatTime(this.seconds);
                break;
            case 'interval':
                displayText = this.formatIntervalDisplay();
                break;
        }

        displayEl.textContent = displayText;
        displayEl.classList.toggle('running', this.isRunning);
    }

    /**
     * Intervall-Display formatieren
     */
    formatIntervalDisplay() {
        const phase = this.isWorkPhase ? 'WORK' : 'REST';
        const time = formatTime(this.seconds);
        const round = `${this.currentRound}/${this.intervalRounds}`;
        return `${phase} ${time} (${round})`;
    }

    /**
     * Controls rendern
     */
    renderControls() {
        const controlsEl = document.getElementById('timerControls');
        if (!controlsEl) {
            console.error('❌ timerControls nicht gefunden');
            return;
        }

        let controlsHTML = '';

        if (!this.isRunning && !this.isPaused) {
            controlsHTML = `
                <button class="btn btn-primary" id="startTimerBtn">
                    ▶️ Start
                </button>
            `;
        } else if (this.isRunning) {
            controlsHTML = `
                <button class="btn btn-warning" id="pauseTimerBtn">
                    ⏸️ Pause
                </button>
                <button class="btn btn-danger" id="resetTimerBtn">
                    ⏹️ Reset
                </button>
            `;
        } else if (this.isPaused) {
            controlsHTML = `
                <button class="btn btn-primary" id="resumeTimerBtn">
                    ▶️ Fortsetzen
                </button>
                <button class="btn btn-danger" id="resetTimerBtn">
                    ⏹️ Reset
                </button>
            `;
        }

        controlsEl.innerHTML = controlsHTML;

        // Event-Listener für Controls
        setTimeout(() => {
            this.attachControlListeners();
        }, 50);
    }

    /**
     * Control Event-Listener
     */
    attachControlListeners() {
        const startBtn = document.getElementById('startTimerBtn');
        const pauseBtn = document.getElementById('pauseTimerBtn');
        const resumeBtn = document.getElementById('resumeTimerBtn');
        const resetBtn = document.getElementById('resetTimerBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('▶️ Start geklickt');
                this.start();
            });
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                console.log('⏸️ Pause geklickt');
                this.pause();
            });
        }
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                console.log('▶️ Resume geklickt');
                this.resume();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('⏹️ Reset geklickt');
                this.reset();
            });
        }
    }

    /**
     * Presets rendern
     */
    renderPresets() {
        const presetsEl = document.getElementById('timerPresets');
        if (!presetsEl) {
            console.error('❌ timerPresets nicht gefunden');
            return;
        }

        if (this.currentMode === 'countdown') {
            presetsEl.innerHTML = this.presets.map(preset => `
                <button class="preset-btn" data-seconds="${preset.seconds}">
                    ${preset.name}
                </button>
            `).join('');

            // Event-Listener für Presets
            setTimeout(() => {
                presetsEl.querySelectorAll('.preset-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const seconds = parseInt(btn.dataset.seconds);
                        console.log('Preset geklickt:', seconds);
                        this.setCountdown(seconds);
                    });
                });
            }, 50);

        } else if (this.currentMode === 'interval') {
            presetsEl.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Arbeit (Sekunden)</label>
                    <input type="number" class="form-input" id="intervalWork" value="${this.intervalWorkSeconds}" min="5" max="300">
                </div>
                <div class="form-group">
                    <label class="form-label">Pause (Sekunden)</label>
                    <input type="number" class="form-input" id="intervalRest" value="${this.intervalRestSeconds}" min="5" max="300">
                </div>
                <div class="form-group">
                    <label class="form-label">Runden</label>
                    <input type="number" class="form-input" id="intervalRounds" value="${this.intervalRounds}" min="1" max="50">
                </div>
                <button class="btn btn-secondary" id="applyIntervalBtn">Übernehmen</button>
            `;

            // Event-Listener für Intervall-Settings
            setTimeout(() => {
                const applyBtn = document.getElementById('applyIntervalBtn');
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        this.intervalWorkSeconds = parseInt(document.getElementById('intervalWork').value);
                        this.intervalRestSeconds = parseInt(document.getElementById('intervalRest').value);
                        this.intervalRounds = parseInt(document.getElementById('intervalRounds').value);
                        this.reset();
                        this.eventBus.emit('showToast', {
                            message: 'Intervall-Einstellungen übernommen',
                            type: 'success'
                        });
                    });
                }
            }, 50);

        } else {
            presetsEl.innerHTML = '';
        }
    }

    /**
     * Modus wechseln
     */
    switchMode(mode) {
        console.log('Wechsle zu Modus:', mode);

        // Timer stoppen
        this.stop();
        this.reset();

        // Modus wechseln
        this.currentMode = mode;

        // Tabs aktualisieren
        document.querySelectorAll('.timer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Initial-Werte setzen
        switch(mode) {
            case 'countdown':
                this.seconds = 60;
                this.targetSeconds = 60;
                break;
            case 'stopwatch':
                this.seconds = 0;
                break;
            case 'interval':
                this.setupInterval();
                break;
        }

        this.render();
    }

    /**
     * Countdown setzen
     */
    setCountdown(seconds) {
        if (this.isRunning) return;

        this.seconds = seconds;
        this.targetSeconds = seconds;
        this.updateDisplay();

        console.log('Countdown gesetzt auf:', seconds);
    }

    /**
     * Intervall-Timer einrichten
     */
    setupInterval() {
        this.currentRound = 1;
        this.isWorkPhase = true;
        this.seconds = this.intervalWorkSeconds;
    }

    /**
     * Timer starten
     */
    start() {
        if (this.isRunning) return;

        console.log('⏱️ Timer gestartet');
        this.isRunning = true;
        this.isPaused = false;

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);

        this.renderControls();
    }

    /**
     * Timer pausieren
     */
    pause() {
        if (!this.isRunning) return;

        console.log('⏸️ Timer pausiert');
        this.isRunning = false;
        this.isPaused = true;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.renderControls();
    }

    /**
     * Timer fortsetzen
     */
    resume() {
        if (this.isRunning || !this.isPaused) return;

        console.log('▶️ Timer fortgesetzt');
        this.isRunning = true;
        this.isPaused = false;

        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);

        this.renderControls();
    }

    /**
     * Timer zurücksetzen
     */
    reset() {
        console.log('⏹️ Timer zurückgesetzt');
        this.stop();

        switch(this.currentMode) {
            case 'countdown':
                this.seconds = this.targetSeconds;
                break;
            case 'stopwatch':
                this.seconds = 0;
                break;
            case 'interval':
                this.setupInterval();
                break;
        }

        this.updateDisplay();
        this.renderControls();
    }

    /**
     * Timer stoppen
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Timer-Tick
     */
    tick() {
        switch(this.currentMode) {
            case 'countdown':
                this.countdownTick();
                break;
            case 'stopwatch':
                this.stopwatchTick();
                break;
            case 'interval':
                this.intervalTick();
                break;
        }
    }

    /**
     * Countdown-Tick
     */
    countdownTick() {
        if (this.seconds > 0) {
            this.seconds--;
            this.updateDisplay();
        } else {
            this.timerFinished();
        }
    }

    /**
     * Stoppuhr-Tick
     */
    stopwatchTick() {
        this.seconds++;
        this.updateDisplay();
    }

    /**
     * Intervall-Tick
     */
    intervalTick() {
        if (this.seconds > 0) {
            this.seconds--;
            this.updateDisplay();
        } else {
            this.nextIntervalPhase();
        }
    }

    /**
     * Nächste Intervall-Phase
     */
    nextIntervalPhase() {
        if (this.isWorkPhase) {
            this.isWorkPhase = false;
            this.seconds = this.intervalRestSeconds;

            this.eventBus.emit('showToast', {
                message: '💤 Pause!',
                type: 'info'
            });
        } else {
            this.currentRound++;

            if (this.currentRound > this.intervalRounds) {
                this.timerFinished();
                return;
            }

            this.isWorkPhase = true;
            this.seconds = this.intervalWorkSeconds;

            this.eventBus.emit('showToast', {
                message: `💪 Runde ${this.currentRound}/${this.intervalRounds}`,
                type: 'success'
            });
        }

        this.updateDisplay();
    }

    /**
     * Timer beendet
     */
    timerFinished() {
        this.stop();

        console.log('⏰ Timer beendet!');

        this.eventBus.emit('showToast', {
            message: '⏰ Timer beendet!',
            type: 'success'
        });

        // Vibration
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }

        this.renderControls();
    }
}
