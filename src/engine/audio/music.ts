// Procedural music (ART_AUDIO §5): per-zone ambient (drone + slow pentatonic arpeggio + filtered wind)
// and a boss mode (faster pulse with a kick-like low sine every beat; phase 2+ adds a second voice).
import { mixer } from './mixer';

export interface MusicSeed {
  /** root note as MIDI number */
  root: number;
  /** beats per minute for the arpeggio / boss pulse */
  tempo: number;
  /** 0..1 filter brightness */
  bright: number;
  /** scale degrees in semitones (pentatonic variants) */
  scale: number[];
  wave: OscillatorType;
}

const midi = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

/** Two seeds describe the same music (D152): callers often build a fresh seed object each frame. */
function sameSeed(a: MusicSeed | null, b: MusicSeed | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.root === b.root && a.tempo === b.tempo && a.bright === b.bright && a.wave === b.wave && a.scale.length === b.scale.length && a.scale.every((v, i) => v === b.scale[i]);
}

type Mode = 'off' | 'ambient' | 'boss' | 'title' | 'credits';

class Music {
  private mode: Mode = 'off';
  private seed: MusicSeed | null = null;
  private phase = 1;
  private nodes: AudioNode[] = [];
  private oscs: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;
  private bus: GainNode | null = null;
  private rngState = 1;

  private rnd(): number {
    // music variation is cosmetic only
    this.rngState = (this.rngState * 1103515245 + 12345) & 0x7fffffff;
    return this.rngState / 0x7fffffff;
  }

  play(mode: Mode, seed: MusicSeed | null, phase = 1): void {
    // compared by value: a fresh but equal seed each frame used to tear the music down and rebuild it 60 times a
    // second on co-op guests (noise buffer and all), which cost real CPU in busy fights (D152)
    const same = sameSeed(seed, this.seed);
    if (mode === this.mode && same && phase === this.phase) return;
    const sameBase = mode === this.mode && same;
    this.phase = phase;
    if (sameBase && mode === 'boss') return; // phase change only alters scheduling
    this.stop();
    this.mode = mode;
    this.seed = seed;
    if (mode === 'off' || !seed) return;
    mixer.whenUnlocked(() => {
      if (this.mode === mode && sameSeed(this.seed, seed)) this.start();
    });
  }

  setPhase(phase: number): void {
    this.phase = phase;
  }

  private start(): void {
    const ctx = mixer.ctx;
    if (!ctx || !mixer.music || !this.seed) return;
    const s = this.seed;
    this.rngState = s.root * 7919 + s.tempo;
    this.bus = ctx.createGain();
    this.bus.gain.value = 0;
    this.bus.gain.setTargetAtTime(1, ctx.currentTime, 1.5);
    this.bus.connect(mixer.music);
    this.nodes.push(this.bus);
    // drone: two detuned oscillators through a lowpass
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200 + s.bright * 900;
    lp.Q.value = 0.7;
    const droneGain = ctx.createGain();
    droneGain.gain.value = this.mode === 'boss' ? 0.08 : 0.12;
    lp.connect(droneGain);
    droneGain.connect(this.bus);
    this.nodes.push(lp, droneGain);
    for (const det of [-7, 6]) {
      const o = ctx.createOscillator();
      o.type = s.wave;
      o.frequency.value = midi(s.root - 24);
      o.detune.value = det;
      o.connect(lp);
      o.start();
      this.oscs.push(o);
    }
    // slow LFO on the filter
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 120 + s.bright * 200;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    this.oscs.push(lfo);
    this.nodes.push(lfoG);
    // wind: looped noise through a bandpass
    if (this.mode !== 'boss') {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = this.rnd() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 400 + s.bright * 600;
      bp.Q.value = 0.6;
      const wg = ctx.createGain();
      wg.gain.value = 0.035;
      src.connect(bp);
      bp.connect(wg);
      wg.connect(this.bus);
      src.start();
      this.oscs.push(src);
      this.nodes.push(bp, wg);
    }
    this.nextNote = ctx.currentTime + 0.2;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 50);
  }

  private schedule(): void {
    const ctx = mixer.ctx;
    if (!ctx || !this.bus || !this.seed) return;
    const s = this.seed;
    const boss = this.mode === 'boss';
    const beat = 60 / (boss ? s.tempo * 1.6 : s.tempo);
    const noteLen = boss ? beat / 2 : beat * 2;
    while (this.nextNote < ctx.currentTime + 0.25) {
      const t = this.nextNote;
      if (boss) {
        // kick on every beat
        if (this.step % 2 === 0) this.kick(t);
        const deg = s.scale[(this.step * 3 + (this.step >> 3)) % s.scale.length]!;
        this.note(t, midi(s.root + deg), noteLen * 0.9, 0.05, 'sawtooth', 900 + s.bright * 1200);
        if (this.phase >= 2 && this.step % 4 === 2) {
          const deg2 = s.scale[(this.step + 2) % s.scale.length]!;
          this.note(t, midi(s.root + 12 + deg2), noteLen * 1.6, 0.035, 'square', 1600);
        }
        if (this.phase >= 3 && this.step % 8 === 4) this.note(t, midi(s.root - 12), beat * 2, 0.07, 'sawtooth', 500);
        this.nextNote += noteLen;
      } else {
        if (this.rnd() < 0.72) {
          const deg = s.scale[Math.floor(this.rnd() * s.scale.length)]!;
          const oct = this.rnd() < 0.3 ? 12 : 0;
          this.note(t, midi(s.root + deg + oct), noteLen * 1.5, 0.045, s.wave, 600 + s.bright * 1600);
        }
        this.nextNote += noteLen * (this.rnd() < 0.2 ? 2 : 1);
      }
      this.step++;
    }
  }

  private note(t: number, f: number, dur: number, vol: number, wave: OscillatorType, cutoff: number): void {
    const ctx = mixer.ctx!;
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.08, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    o.connect(lp);
    lp.connect(g);
    g.connect(this.bus!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private kick(t: number): void {
    const ctx = mixer.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g);
    g.connect(this.bus!);
    o.start(t);
    o.stop(t + 0.3);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = mixer.ctx;
    const bus = this.bus;
    const oscs = this.oscs;
    const nodes = this.nodes;
    this.oscs = [];
    this.nodes = [];
    this.bus = null;
    if (ctx && bus) {
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      setTimeout(() => {
        for (const o of oscs)
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        for (const n of nodes) n.disconnect();
      }, 1200);
    }
    this.mode = 'off';
  }

  get current(): Mode {
    return this.mode;
  }
}

export const music = new Music();
