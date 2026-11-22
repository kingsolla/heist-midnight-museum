// Sound, synthesized live with WebAudio. No audio files, no network:
// every effect is a few oscillators and a gain envelope, built from scratch.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short tone: frequency slide from f0 to f1 over `dur` seconds.
  tone(f0, f1, dur, type, volume, when = 0) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), t0);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Soft carpet footstep, throttled so it never chatters.
  footstep(now) {
    if (now - this.lastStep < 0.28) return;
    this.lastStep = now;
    this.tone(140, 70, 0.09, 'sine', 0.05);
  }

  alertSting() {
    this.tone(620, 930, 0.22, 'sawtooth', 0.10);
    this.tone(930, 620, 0.28, 'sawtooth', 0.08, 0.16);
  }

  cameraBeep() {
    this.tone(1180, 1180, 0.08, 'square', 0.05);
    this.tone(1180, 1180, 0.08, 'square', 0.05, 0.12);
  }

  vaultChime() {
    this.tone(880, 880, 0.35, 'sine', 0.12);
    this.tone(1318, 1318, 0.5, 'sine', 0.10, 0.12);
    this.tone(1760, 1760, 0.7, 'sine', 0.08, 0.24);
  }

  smokePuff() {
    this.tone(320, 90, 0.4, 'triangle', 0.09);
  }

  winJingle() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => this.tone(n, n, 0.32, 'triangle', 0.12, i * 0.14));
  }

  loseDrone() {
    this.tone(220, 55, 1.1, 'sawtooth', 0.12);
    this.tone(110, 55, 1.2, 'square', 0.06, 0.1);
  }
}
