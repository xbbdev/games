// Web Audio API Sound and Ambient Music Engine
// 100% offline, zero external audio files needed

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = false;
        this.musicTimer = null;
        this.masterVolume = 0.7;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick() {
        if (!this.soundEnabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

        gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playSlide() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Gentle woosh/slide sound with filtered noise + low sine
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(0.18 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playSnap() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Satisfying metallic/magnetic snap
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.09);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.exponentialRampToValueAtTime(220, now + 0.09);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.1);
        osc2.stop(now + 0.1);
    }

    playRotate() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);

        gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    playError() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    playWin() {
        if (!this.soundEnabled) return;
        this.init();
        const now = this.ctx.currentTime;
        // Joyous victory arpeggio: C5, E5, G5, B5, C6, G6
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50, 1567.98];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + i * 0.09;
            const noteDuration = 0.55;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.001, noteStart);
            gain.gain.linearRampToValueAtTime(0.22 * this.masterVolume, noteStart + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + noteDuration);
        });
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.init();
            this.startAmbientMusic();
        } else {
            this.stopAmbientMusic();
        }
        return this.musicEnabled;
    }

    startAmbientMusic() {
        if (!this.musicEnabled) return;
        // Soothing pentatonic scale in D major: D, E, F#, A, B
        const scale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99];
        const playChime = () => {
            if (!this.musicEnabled) return;
            const now = this.ctx.currentTime;
            // Play 2-3 gentle harmonic notes
            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const freq = scale[Math.floor(Math.random() * scale.length)];
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const delay = i * 0.3;
                const dur = 2.5 + Math.random() * 1.5;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + delay);

                gain.gain.setValueAtTime(0.0001, now + delay);
                gain.gain.linearRampToValueAtTime(0.04 * this.masterVolume, now + delay + 0.6);
                gain.gain.exponentialRampToValueAtTime(0.00001, now + delay + dur);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + delay);
                osc.stop(now + delay + dur);
            }

            const nextInterval = 2800 + Math.random() * 2200;
            this.musicTimer = setTimeout(playChime, nextInterval);
        };
        playChime();
    }

    stopAmbientMusic() {
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

window.soundEngine = new SoundEngine();
