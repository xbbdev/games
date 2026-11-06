/**
 * Checkers Sound Synthesizer using Web Audio API
 * Generates natural sounds without any external assets.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Layer 1: Wood knock
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, t);
    osc1.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    gain1.gain.setValueAtTime(0.5 * this.volume, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Layer 2: Snap click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(520, t);
    osc2.frequency.exponentialRampToValueAtTime(150, t + 0.06);
    gain2.gain.setValueAtTime(0.3 * this.volume, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.06);
  }

  playPromotion() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Fanfare chords
    const notes = [
      { f: 523.25, d: 0.12, w: 0 },
      { f: 659.25, d: 0.12, w: 0.13 },
      { f: 783.99, d: 0.12, w: 0.26 },
      { f: 1046.50, d: 0.5, w: 0.40 }
    ];
    const t = this.ctx.currentTime;

    notes.forEach(n => {
      const startTime = t + n.w;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, startTime);

      gain.gain.setValueAtTime(0.35 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + n.d + 0.05);
    });
  }

  playLose() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 415.3, 392, 349.23];
    const t = this.ctx.currentTime;

    notes.forEach((f, idx) => {
      const startTime = t + idx * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startTime);

      gain.gain.setValueAtTime(0.25 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  playHint() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.15);

    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playInvalid() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.setValueAtTime(95, t + 0.06);

    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

window.SoundManager = SoundManager;
