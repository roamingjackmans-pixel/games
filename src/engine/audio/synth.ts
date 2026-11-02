// Offline sample synthesis: oscillators, noise, ADSR envelopes, one-pole filters, rendered into
// Float32Arrays (pure functions, unit-testable without Web Audio).

export type Wave = 'sine' | 'square' | 'saw' | 'tri' | 'noise';

export interface Voice {
  wave: Wave;
  /** start frequency Hz (ignored for noise unless filtered) */
  f0: number;
  /** end frequency (exponential sweep) */
  f1?: number;
  dur: number;
  delay?: number;
  /** envelope: attack, decay (s), sustain level 0..1, release (s) at the end of dur */
  a?: number;
  d?: number;
  s?: number;
  r?: number;
  vol: number;
  /** lowpass cutoff (Hz) start and end */
  lp?: number;
  lpEnd?: number;
  hp?: number;
  /** pitch vibrato depth (fraction) and rate Hz */
  vib?: number;
  vibRate?: number;
  /** detune in cents for a second copy (chorus) */
  detune?: number;
}

export interface SfxDef {
  voices: Voice[];
  vol?: number;
}

/** Deterministic noise so tests are stable. */
function noiseGen(seed: number): () => number {
  let x = seed | 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) / 4294967296) * 2 - 1;
  };
}

function osc(wave: Wave, phase: number): number {
  const p = phase - Math.floor(phase);
  switch (wave) {
    case 'sine':
      return Math.sin(p * Math.PI * 2);
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'saw':
      return p * 2 - 1;
    case 'tri':
      return p < 0.5 ? p * 4 - 1 : 3 - p * 4;
    default:
      return 0;
  }
}

export function envelope(t: number, dur: number, a: number, d: number, s: number, r: number): number {
  if (t < 0) return 0;
  if (t < a) return t / Math.max(1e-6, a);
  if (t < a + d) return 1 - (1 - s) * ((t - a) / Math.max(1e-6, d));
  const relStart = Math.max(a + d, dur - r);
  if (t < relStart) return s;
  if (t < dur) return s * (1 - (t - relStart) / Math.max(1e-6, dur - relStart));
  return 0;
}

export function sfxLength(def: SfxDef): number {
  let len = 0;
  for (const v of def.voices) len = Math.max(len, (v.delay ?? 0) + v.dur);
  return len;
}

/** Render a sound definition to mono samples. */
export function renderSfx(def: SfxDef, sampleRate: number, seed = 1): Float32Array {
  const total = Math.ceil(sfxLength(def) * sampleRate) + 1;
  const out = new Float32Array(total);
  let vi = 0;
  for (const v of def.voices) {
    vi++;
    const rnd = noiseGen(seed * 977 + vi * 131);
    const start = Math.floor((v.delay ?? 0) * sampleRate);
    const n = Math.floor(v.dur * sampleRate);
    const a = v.a ?? 0.005;
    const d = v.d ?? 0.05;
    const s = v.s ?? 0.6;
    const r = v.r ?? Math.min(0.1, v.dur * 0.4);
    let phase = 0;
    let phase2 = 0;
    let lpState = 0;
    let hpState = 0;
    let hpPrev = 0;
    const f1 = v.f1 ?? v.f0;
    const det = v.detune ? Math.pow(2, v.detune / 1200) : 0;
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const k = n > 1 ? i / (n - 1) : 0;
      let f = v.f0 * Math.pow(f1 / Math.max(1, v.f0), k);
      if (v.vib) f *= 1 + v.vib * Math.sin(t * Math.PI * 2 * (v.vibRate ?? 6));
      let x: number;
      if (v.wave === 'noise') x = rnd();
      else {
        phase += f / sampleRate;
        x = osc(v.wave, phase);
        if (det) {
          phase2 += (f * det) / sampleRate;
          x = (x + osc(v.wave, phase2)) * 0.6;
        }
      }
      if (v.lp) {
        const cut = v.lp * Math.pow((v.lpEnd ?? v.lp) / v.lp, k);
        const alpha = 1 - Math.exp((-2 * Math.PI * cut) / sampleRate);
        lpState += alpha * (x - lpState);
        x = lpState;
      }
      if (v.hp) {
        const rc = 1 / (2 * Math.PI * v.hp);
        const alpha = rc / (rc + 1 / sampleRate);
        hpState = alpha * (hpState + x - hpPrev);
        hpPrev = x;
        x = hpState;
      }
      const env = envelope(t, v.dur, a, d, s, r);
      const idx = start + i;
      if (idx < total) out[idx]! += x * env * v.vol * (def.vol ?? 1);
    }
  }
  // soft clip
  for (let i = 0; i < total; i++) out[i] = Math.tanh(out[i]! * 1.2);
  return out;
}
