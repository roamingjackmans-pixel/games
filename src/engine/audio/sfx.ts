// The synthesized sound list (ART_AUDIO §5). Sounds render to AudioBuffers on first use and are cached.
import { mixer } from './mixer';
import { renderSfx, type SfxDef } from './synth';

export const SFX = {
  // combat
  swingLight: { voices: [{ wave: 'noise', f0: 0, dur: 0.14, a: 0.01, d: 0.05, s: 0.4, vol: 0.5, lp: 4000, lpEnd: 1500, hp: 600 }] },
  swingMedium: { voices: [{ wave: 'noise', f0: 0, dur: 0.2, a: 0.02, d: 0.08, s: 0.4, vol: 0.55, lp: 2600, lpEnd: 900, hp: 300 }] },
  swingHeavy: {
    voices: [
      { wave: 'noise', f0: 0, dur: 0.32, a: 0.05, d: 0.12, s: 0.5, vol: 0.6, lp: 1400, lpEnd: 400, hp: 120 },
      { wave: 'sine', f0: 120, f1: 60, dur: 0.28, a: 0.05, vol: 0.25 },
    ],
  },
  hitFlesh: {
    voices: [
      { wave: 'noise', f0: 0, dur: 0.12, a: 0.002, d: 0.05, s: 0.3, vol: 0.7, lp: 1800 },
      { wave: 'sine', f0: 180, f1: 70, dur: 0.12, a: 0.002, vol: 0.5 },
    ],
  },
  hitBone: {
    voices: [
      { wave: 'noise', f0: 0, dur: 0.09, a: 0.001, d: 0.03, s: 0.2, vol: 0.6, hp: 1500 },
      { wave: 'tri', f0: 900, f1: 500, dur: 0.08, a: 0.001, vol: 0.35 },
    ],
  },
  hitMetal: {
    voices: [
      { wave: 'square', f0: 1300, f1: 1100, dur: 0.22, a: 0.001, d: 0.05, s: 0.3, vol: 0.18, lp: 5000 },
      { wave: 'sine', f0: 2600, dur: 0.3, a: 0.001, d: 0.1, s: 0.2, vol: 0.18 },
      { wave: 'noise', f0: 0, dur: 0.05, vol: 0.4, hp: 2000 },
    ],
  },
  hitSlime: {
    voices: [
      { wave: 'sine', f0: 300, f1: 90, dur: 0.18, a: 0.005, vol: 0.5, vib: 0.2, vibRate: 30 },
      { wave: 'noise', f0: 0, dur: 0.1, vol: 0.3, lp: 700 },
    ],
  },
  block: {
    voices: [
      { wave: 'noise', f0: 0, dur: 0.12, a: 0.001, d: 0.04, s: 0.3, vol: 0.6, lp: 2500 },
      { wave: 'tri', f0: 420, f1: 300, dur: 0.15, a: 0.001, vol: 0.4 },
    ],
  },
  guardBreak: {
    voices: [
      { wave: 'saw', f0: 220, f1: 60, dur: 0.4, a: 0.001, d: 0.1, s: 0.4, vol: 0.35, lp: 1500 },
      { wave: 'noise', f0: 0, dur: 0.3, vol: 0.5, lp: 1200 },
    ],
  },
  parry: {
    voices: [
      { wave: 'sine', f0: 1760, dur: 0.6, a: 0.001, d: 0.15, s: 0.3, vol: 0.4 },
      { wave: 'sine', f0: 2637, dur: 0.5, a: 0.001, d: 0.1, s: 0.2, vol: 0.25 },
      { wave: 'noise', f0: 0, dur: 0.05, vol: 0.4, hp: 3000 },
    ],
  },
  riposte: {
    voices: [
      { wave: 'saw', f0: 200, f1: 50, dur: 0.35, a: 0.001, vol: 0.4, lp: 2000 },
      { wave: 'noise', f0: 0, dur: 0.25, vol: 0.6, lp: 3000, lpEnd: 600 },
      { wave: 'sine', f0: 1200, dur: 0.3, delay: 0.02, vol: 0.2 },
    ],
  },
  dodge: { voices: [{ wave: 'noise', f0: 0, dur: 0.25, a: 0.03, d: 0.1, s: 0.3, vol: 0.4, lp: 900, lpEnd: 2400, hp: 200 }] },
  redWarning: {
    voices: [
      { wave: 'saw', f0: 110, dur: 0.22, a: 0.01, vol: 0.28, lp: 900 },
      { wave: 'saw', f0: 82, dur: 0.3, delay: 0.22, a: 0.01, vol: 0.28, lp: 800 },
    ],
  },
  pierceWarning: {
    voices: [
      { wave: 'sine', f0: 1568, dur: 0.5, a: 0.005, d: 0.2, s: 0.3, vol: 0.25, vib: 0.01, vibRate: 7 },
      { wave: 'sine', f0: 2093, dur: 0.45, delay: 0.08, a: 0.005, d: 0.2, s: 0.2, vol: 0.18 },
    ],
  },
  stepStone: { voices: [{ wave: 'noise', f0: 0, dur: 0.04, vol: 0.12, lp: 1200, hp: 200 }] },
  stepWater: { voices: [{ wave: 'noise', f0: 0, dur: 0.08, vol: 0.12, lp: 900, vib: 0.3 }] },
  stepGrass: { voices: [{ wave: 'noise', f0: 0, dur: 0.05, vol: 0.1, hp: 1500 }] },
  shootArrow: { voices: [{ wave: 'noise', f0: 0, dur: 0.12, vol: 0.4, hp: 1200, lp: 6000 }, { wave: 'tri', f0: 300, f1: 900, dur: 0.06, vol: 0.2 }] },
  shootBolt: { voices: [{ wave: 'square', f0: 140, f1: 60, dur: 0.12, vol: 0.25, lp: 1200 }, { wave: 'noise', f0: 0, dur: 0.1, vol: 0.4, hp: 800 }] },
  shootMagic: { voices: [{ wave: 'sine', f0: 600, f1: 1400, dur: 0.18, vol: 0.25 }, { wave: 'tri', f0: 900, f1: 2000, dur: 0.15, vol: 0.12, detune: 15 }] },
  enemyShot: { voices: [{ wave: 'tri', f0: 500, f1: 250, dur: 0.15, vol: 0.2 }] },
  castBrain: {
    voices: [
      { wave: 'saw', f0: 300, f1: 900, dur: 0.3, vol: 0.18, lp: 2500, detune: 12 },
      { wave: 'sine', f0: 1200, dur: 0.35, delay: 0.05, vol: 0.12, vib: 0.03 },
    ],
  },
  castPrayer: {
    voices: [
      { wave: 'sine', f0: 523, dur: 0.5, a: 0.05, vol: 0.18 },
      { wave: 'sine', f0: 659, dur: 0.5, a: 0.05, delay: 0.06, vol: 0.14 },
      { wave: 'sine', f0: 784, dur: 0.5, a: 0.05, delay: 0.12, vol: 0.12 },
    ],
  },
  explosion: {
    voices: [
      { wave: 'noise', f0: 0, dur: 0.6, a: 0.002, d: 0.2, s: 0.4, vol: 0.8, lp: 1500, lpEnd: 200 },
      { wave: 'sine', f0: 90, f1: 35, dur: 0.5, vol: 0.5 },
    ],
  },
  heal: {
    voices: [
      { wave: 'sine', f0: 440, f1: 880, dur: 0.6, a: 0.05, vol: 0.18 },
      { wave: 'tri', f0: 660, f1: 1320, dur: 0.6, a: 0.05, vol: 0.1, delay: 0.05 },
    ],
  },
  flask: {
    voices: [
      { wave: 'sine', f0: 200, f1: 400, dur: 0.15, vol: 0.2, vib: 0.3, vibRate: 25 },
      { wave: 'sine', f0: 240, f1: 480, dur: 0.15, delay: 0.25, vol: 0.2, vib: 0.3, vibRate: 25 },
      { wave: 'sine', f0: 280, f1: 560, dur: 0.15, delay: 0.5, vol: 0.2, vib: 0.3, vibRate: 25 },
    ],
  },
  chestOpen: {
    voices: [
      { wave: 'saw', f0: 120, f1: 180, dur: 0.35, vol: 0.18, lp: 700 },
      { wave: 'sine', f0: 880, dur: 0.4, delay: 0.3, vol: 0.2 },
      { wave: 'sine', f0: 1318, dur: 0.4, delay: 0.38, vol: 0.15 },
    ],
  },
  mimicBite: {
    voices: [
      { wave: 'noise', f0: 0, dur: 0.25, a: 0.001, vol: 0.9, lp: 1200 },
      { wave: 'saw', f0: 90, f1: 40, dur: 0.4, vol: 0.4, lp: 600 },
    ],
  },
  reliquary: {
    voices: [
      { wave: 'sine', f0: 1046, dur: 1.2, a: 0.02, d: 0.4, s: 0.4, vol: 0.15 },
      { wave: 'sine', f0: 1568, dur: 1.2, a: 0.02, delay: 0.1, d: 0.4, s: 0.4, vol: 0.12 },
      { wave: 'sine', f0: 2093, dur: 1.2, a: 0.02, delay: 0.2, d: 0.4, s: 0.4, vol: 0.1 },
    ],
  },
  levelUp: {
    voices: [
      { wave: 'tri', f0: 523, dur: 0.15, vol: 0.2 },
      { wave: 'tri', f0: 659, dur: 0.15, delay: 0.1, vol: 0.2 },
      { wave: 'tri', f0: 784, dur: 0.15, delay: 0.2, vol: 0.2 },
      { wave: 'tri', f0: 1046, dur: 0.4, delay: 0.3, vol: 0.22 },
    ],
  },
  bonfire: {
    voices: [
      { wave: 'noise', f0: 0, dur: 1.2, a: 0.1, d: 0.3, s: 0.5, vol: 0.25, lp: 2000, hp: 400 },
      { wave: 'sine', f0: 262, dur: 1.4, a: 0.3, vol: 0.12 },
      { wave: 'sine', f0: 330, dur: 1.4, a: 0.3, delay: 0.1, vol: 0.1 },
      { wave: 'sine', f0: 392, dur: 1.4, a: 0.3, delay: 0.2, vol: 0.1 },
    ],
  },
  bossRoar: {
    voices: [
      { wave: 'saw', f0: 90, f1: 55, dur: 1.2, a: 0.1, vol: 0.4, lp: 700, vib: 0.06, vibRate: 9, detune: 20 },
      { wave: 'noise', f0: 0, dur: 1.0, a: 0.1, vol: 0.4, lp: 900 },
    ],
  },
  phaseChange: {
    voices: [
      { wave: 'sine', f0: 120, f1: 30, dur: 1.4, a: 0.01, vol: 0.6 },
      { wave: 'noise', f0: 0, dur: 0.8, vol: 0.3, lp: 600, lpEnd: 100 },
    ],
  },
  downed: { voices: [{ wave: 'sine', f0: 300, f1: 90, dur: 0.8, vol: 0.3, lp: 600 }, { wave: 'noise', f0: 0, dur: 0.5, vol: 0.2, lp: 400 }] },
  revive: { voices: [{ wave: 'sine', f0: 300, f1: 1200, dur: 0.7, a: 0.05, vol: 0.25 }, { wave: 'tri', f0: 450, f1: 1800, dur: 0.7, a: 0.05, vol: 0.12 }] },
  reviveTick: { voices: [{ wave: 'sine', f0: 900, dur: 0.08, vol: 0.12 }] },
  death: {
    voices: [
      { wave: 'saw', f0: 220, f1: 110, dur: 0.6, vol: 0.25, lp: 1200 },
      { wave: 'saw', f0: 207, f1: 98, dur: 0.9, delay: 0.5, vol: 0.25, lp: 1000 },
      { wave: 'sine', f0: 55, dur: 1.6, delay: 0.4, vol: 0.4 },
    ],
  },
  uiHover: { voices: [{ wave: 'sine', f0: 1400, dur: 0.03, vol: 0.06 }] },
  uiClick: { voices: [{ wave: 'tri', f0: 800, f1: 600, dur: 0.05, vol: 0.15 }] },
  uiConfirm: { voices: [{ wave: 'tri', f0: 660, dur: 0.07, vol: 0.15 }, { wave: 'tri', f0: 990, dur: 0.1, delay: 0.06, vol: 0.15 }] },
  uiBack: { voices: [{ wave: 'tri', f0: 600, f1: 400, dur: 0.08, vol: 0.13 }] },
  uiError: { voices: [{ wave: 'square', f0: 160, dur: 0.15, vol: 0.12, lp: 900 }] },
  shardPickup: { voices: [{ wave: 'sine', f0: 1200, f1: 1800, dur: 0.08, vol: 0.12 }] },
  lootCommon: { voices: [{ wave: 'tri', f0: 500, dur: 0.1, vol: 0.12 }] },
  lootUncommon: { voices: [{ wave: 'tri', f0: 600, dur: 0.1, vol: 0.14 }, { wave: 'tri', f0: 800, dur: 0.12, delay: 0.07, vol: 0.12 }] },
  lootRare: { voices: [{ wave: 'sine', f0: 700, dur: 0.15, vol: 0.16 }, { wave: 'sine', f0: 1050, dur: 0.2, delay: 0.08, vol: 0.14 }] },
  lootEpic: {
    voices: [
      { wave: 'sine', f0: 660, dur: 0.2, vol: 0.16 },
      { wave: 'sine', f0: 880, dur: 0.2, delay: 0.08, vol: 0.14 },
      { wave: 'sine', f0: 1320, dur: 0.3, delay: 0.16, vol: 0.14 },
    ],
  },
  lootLegendary: {
    voices: [
      { wave: 'saw', f0: 440, dur: 0.6, a: 0.02, vol: 0.12, lp: 2500, detune: 10 },
      { wave: 'sine', f0: 880, dur: 0.6, delay: 0.1, vol: 0.14 },
      { wave: 'sine', f0: 1320, dur: 0.7, delay: 0.2, vol: 0.14 },
      { wave: 'sine', f0: 1760, dur: 0.8, delay: 0.3, vol: 0.12 },
    ],
  },
  doorOpen: { voices: [{ wave: 'saw', f0: 70, f1: 50, dur: 0.5, vol: 0.2, lp: 400 }, { wave: 'noise', f0: 0, dur: 0.4, vol: 0.2, lp: 500 }] },
  doorLock: { voices: [{ wave: 'square', f0: 90, dur: 0.12, vol: 0.2, lp: 500 }, { wave: 'noise', f0: 0, dur: 0.2, delay: 0.05, vol: 0.4, lp: 800 }] },
  spawnTell: { voices: [{ wave: 'sine', f0: 200, f1: 500, dur: 0.6, a: 0.2, vol: 0.12, vib: 0.05 }] },
  stagger: { voices: [{ wave: 'tri', f0: 300, f1: 200, dur: 0.2, vol: 0.2 }, { wave: 'noise', f0: 0, dur: 0.12, vol: 0.2, hp: 1000 }] },
  shock: { voices: [{ wave: 'square', f0: 2000, f1: 600, dur: 0.15, vol: 0.12, vib: 0.5, vibRate: 60 }] },
  burn: { voices: [{ wave: 'noise', f0: 0, dur: 0.3, vol: 0.25, lp: 3000, hp: 800 }] },
  freeze: { voices: [{ wave: 'sine', f0: 3000, f1: 1500, dur: 0.25, vol: 0.12 }, { wave: 'noise', f0: 0, dur: 0.2, vol: 0.2, hp: 4000 }] },
  bleed: { voices: [{ wave: 'noise', f0: 0, dur: 0.2, vol: 0.35, lp: 1200 }, { wave: 'sine', f0: 150, f1: 80, dur: 0.2, vol: 0.3 }] },
  poison: { voices: [{ wave: 'sine', f0: 200, f1: 150, dur: 0.3, vol: 0.18, vib: 0.3, vibRate: 15 }] },
  splash: { voices: [{ wave: 'noise', f0: 0, dur: 0.4, vol: 0.4, lp: 1500, lpEnd: 400 }] },
  fall: { voices: [{ wave: 'sine', f0: 800, f1: 100, dur: 0.6, vol: 0.25 }] },
  gary: {
    voices: [
      { wave: 'tri', f0: 220, f1: 260, dur: 0.15, vol: 0.18, vib: 0.05 },
      { wave: 'tri', f0: 180, f1: 150, dur: 0.2, delay: 0.17, vol: 0.18, vib: 0.05 },
    ],
  },
  wipe: { voices: [{ wave: 'saw', f0: 110, f1: 40, dur: 1.4, vol: 0.3, lp: 600 }] },
  join: { voices: [{ wave: 'sine', f0: 660, dur: 0.12, vol: 0.15 }, { wave: 'sine', f0: 880, dur: 0.15, delay: 0.1, vol: 0.15 }] },
  /** an achievement unlocks: a small rising bell */
  achievement: {
    voices: [
      { wave: 'tri', f0: 784, dur: 0.12, vol: 0.14 },
      { wave: 'tri', f0: 1047, dur: 0.14, delay: 0.09, vol: 0.14 },
      { wave: 'sine', f0: 1568, dur: 0.45, delay: 0.18, a: 0.01, vol: 0.12, vib: 0.02 },
    ],
  },
} satisfies Record<string, SfxDef>;

export type SfxId = keyof typeof SFX;

const cache = new Map<string, AudioBuffer>();
let lastPlay = new Map<string, number>();

function buffer(id: SfxId): AudioBuffer | null {
  const ctx = mixer.ctx;
  if (!ctx) return null;
  let b = cache.get(id);
  if (!b) {
    const data = renderSfx(SFX[id] as SfxDef, ctx.sampleRate, id.length * 31 + id.charCodeAt(0));
    b = ctx.createBuffer(1, data.length, ctx.sampleRate);
    b.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
    cache.set(id, b);
  }
  return b;
}

export interface PlayOpts {
  vol?: number;
  /** playback rate multiplier (pitch) */
  rate?: number;
  /** -1..1 stereo pan (from world x) */
  pan?: number;
}

/** Play a sound. Rate-limited per id so 12 hits on one frame do not stack into noise. */
export function playSfx(id: SfxId, o: PlayOpts = {}): void {
  const ctx = mixer.ctx;
  if (!ctx || !mixer.sfx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const last = lastPlay.get(id) ?? -1;
  if (now - last < 0.03) return;
  lastPlay.set(id, now);
  const b = buffer(id);
  if (!b) return;
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.playbackRate.value = o.rate ?? 1;
  const g = ctx.createGain();
  g.gain.value = o.vol ?? 1;
  let node: AudioNode = g;
  if (o.pan !== undefined && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    g.connect(p);
    node = p;
  }
  src.connect(g);
  node.connect(mixer.sfx);
  src.start();
}

/** Pre-render every sound (called after unlock, spread over idle time). */
export function warmSfx(): void {
  const ids = Object.keys(SFX) as SfxId[];
  let i = 0;
  const step = (): void => {
    for (let k = 0; k < 6 && i < ids.length; k++, i++) buffer(ids[i]!);
    if (i < ids.length) setTimeout(step, 16);
  };
  step();
}

export function resetSfxRateLimit(): void {
  lastPlay = new Map();
}
