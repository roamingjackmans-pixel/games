// Skill and spell animations: a player attack's pattern names its look (PatternCommon.vfx); the telegraph's impact
// fx event carries that id with the true shape (a line's start, angle, length and width; a cone's origin, angle,
// half-angle and radius; a circle's centre and radius) and the damage type, and this module draws the animation
// over exactly that area: a guillotine's slice and travelling shockwave, a frost lance's ice spike that flies and
// shatters, a meteor that falls before it lands, and so on. Without an id the view keeps its plain burst.
// Records are pooled (no per-frame allocation once warm); particles carry the debris. Cosmetic only.
import { glow } from '../engine/draw/parts';
import type { Particles } from '../engine/particles';
import type { DamageType } from '../game/types';
import type { Entity, FxExtra } from '../game/world';
import { hash2 } from './telegraphFx';

/** Every animation a pattern may name (data tests check `vfx` against this list). */
export const VFX_IDS = [
  'slash',
  'cleave',
  'dawn_arc',
  'spin',
  'whip_crack',
  'guillotine',
  'thrust',
  'execute',
  'smash',
  'judgment',
  'iai',
  'bolt',
  'whip',
  'hook',
  'ice_lance',
  'sunbeam',
  'arcane_beam',
  'lightning',
  'ground_slam',
  'holy_smite',
  'holy_nova',
  'void_implode',
  'fire_burst',
  'frost_burst',
  'meteor',
  'arrow_rain',
  'shadow_cut',
  'tick',
] as const;
export type VfxId = (typeof VFX_IDS)[number];

interface Tint {
  /** white-hot core */
  core: string;
  main: string;
  /** dark shade (ground scars) */
  deep: string;
  /** soft halo */
  halo: string;
  /** the glowing seam of a crack in the floor */
  seam: string;
}

const TINTS: Record<DamageType, Tint> = {
  physical: { core: '#ffffff', main: '#e6eefc', deep: '#0e0c10', halo: '#bcd2ff', seam: '#d8c4a0' },
  magic: { core: '#f2fbff', main: '#7cc4ff', deep: '#0c1a3a', halo: '#4f9dff', seam: '#7cc4ff' },
  void: { core: '#f3e8ff', main: '#b06bff', deep: '#1a0a2a', halo: '#7a2cff', seam: '#b06bff' },
  fire: { core: '#fff3c4', main: '#ff8a3a', deep: '#2a0c04', halo: '#ff5a1a', seam: '#ffb45a' },
  holy: { core: '#fffcef', main: '#ffe27a', deep: '#2a2006', halo: '#ffc83a', seam: '#ffe27a' },
};
const BLOOD: Tint = { core: '#fff0f0', main: '#ff4a5a', deep: '#2a0208', halo: '#ff1a2e', seam: '#ff4a5a' };
const ICE: Tint = { core: '#ffffff', main: '#bfe6ff', deep: '#0a1a2a', halo: '#6cc0ff', seam: '#bfe6ff' };
const SPARK: Tint = { core: '#ffffff', main: '#d8f0ff', deep: '#0a1020', halo: '#6fb8ff', seam: '#d8f0ff' };
const SHOCK: Tint = { core: '#ffffff', main: '#fff27a', deep: '#201a04', halo: '#ffd23a', seam: '#fff27a' };
const FIRE = TINTS.fire;
const VOID = TINTS.void;
const HOLY = TINTS.holy;

/** shape kinds an fx event carries */
const LINE = 0;
const CONE = 1;
const CIRCLE = 2;

interface Fx {
  live: boolean;
  def: VfxDef;
  shape: number;
  x: number;
  y: number;
  /** facing (line / cone) */
  a: number;
  /** line length, cone radius, circle radius */
  l: number;
  /** line width, cone half-angle, ring inner radius */
  w: number;
  t0: number;
  dur: number;
  seed: number;
  tint: Tint;
  /** one-shot flags (debris bursts) */
  done: number;
}

interface VfxDef {
  /** lifetime, s (from the area's live time `d` when given) */
  dur(d: number): number;
  /** fixed colours (otherwise the damage type's) */
  tint?: Tint;
  /** under the bodies (scars, cracks, scorch) */
  ground?: ((ctx: CanvasRenderingContext2D, f: Fx, age: number) => void) | undefined;
  /** over the bodies */
  top(ctx: CanvasRenderingContext2D, f: Fx, age: number, p: Particles): void;
  /** drawn over a telegraph while it is about to land (k 0 → 1 over `preS` seconds): a meteor falling */
  pre?: { s: number; draw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, k: number, seed: number): void };
}

// ---------------------------------------------------------------- helpers

const TAU = Math.PI * 2;
function c01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function easeOut(t: number): number {
  const u = 1 - c01(t);
  return 1 - u * u * u;
}
function easeIn(t: number): number {
  const u = c01(t);
  return u * u;
}
/** 1 until `from`, then down to 0 at `to` */
function fade(age: number, from: number, to: number): number {
  return 1 - c01((age - from) / Math.max(0.001, to - from));
}
/** a seed from a spot on the floor (what falls onto a circle and what lands there agree) */
function xySeed(x: number, y: number): number {
  return (Math.round(x) * 73856093) ^ (Math.round(y) * 19349663);
}
function once(f: Fx, bit: number): boolean {
  if (f.done & bit) return false;
  f.done |= bit;
  return true;
}

/** A crescent from angle a0 (thin tail) to a1 (fat leading end, pointed tip) at radius r. */
function crescentPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a0: number, a1: number, thick: number, sym = false): void {
  const N = 20;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const ang = a0 + ((a1 - a0) * i) / N;
    ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    const ang = a0 + (a1 - a0) * u;
    const th = sym ? thick * Math.pow(Math.sin(Math.PI * u), 0.6) : thick * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.7) * (0.25 + 0.75 * u);
    ctx.lineTo(cx + Math.cos(ang) * (r - th), cy + Math.sin(ang) * (r - th));
  }
  ctx.closePath();
}

/** A glowing crescent: halo, body, white-hot outer edge (additive). */
function crescent(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a0: number, a1: number, thick: number, t: Tint, alpha: number, sym = false): void {
  if (alpha <= 0.01 || Math.abs(a1 - a0) < 0.01) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.35;
  ctx.fillStyle = t.halo;
  crescentPath(ctx, cx, cy, r + thick * 0.12, a0, a1, thick * 1.25, sym);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = t.main;
  crescentPath(ctx, cx, cy, r, a0, a1, thick * 0.62, sym);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = t.core;
  crescentPath(ctx, cx, cy, r, a0, a1, thick * 0.2, sym);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** A leaf / lens along the line from d0 to d1 (local x), widest in the middle. */
function lensPath(ctx: CanvasRenderingContext2D, d0: number, d1: number, hw: number, bias = 0.5): void {
  const N = 12;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const k = u < bias ? u / bias : (1 - u) / (1 - bias);
    ctx.lineTo(d0 + (d1 - d0) * u, -hw * Math.pow(Math.max(0, k), 0.55));
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    const k = u < bias ? u / bias : (1 - u) / (1 - bias);
    ctx.lineTo(d0 + (d1 - d0) * u, hw * Math.pow(Math.max(0, k), 0.55));
  }
  ctx.closePath();
}

/** A glowing lens in local coords (the caller has rotated to the line). */
function lens(ctx: CanvasRenderingContext2D, d0: number, d1: number, hw: number, t: Tint, alpha: number, bias = 0.5): void {
  if (alpha <= 0.01 || d1 - d0 < 1) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.35;
  ctx.fillStyle = t.halo;
  lensPath(ctx, d0 - 4, d1 + 4, hw * 1.5, bias);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.85;
  ctx.fillStyle = t.main;
  lensPath(ctx, d0, d1, hw * 0.75, bias);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = t.core;
  lensPath(ctx, d0 + (d1 - d0) * 0.06, d1, hw * 0.25, bias);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** A four-point glint. */
function star(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, color: string, alpha: number, points = 4): void {
  if (alpha <= 0.01 || s <= 0.5) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const ang = rot + (i * Math.PI) / points;
    const rr = i % 2 === 0 ? s : s * 0.16;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** A ring stroke (additive). */
function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, width: number, color: string, alpha: number): void {
  if (alpha <= 0.01 || r <= 0.5) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.5, width);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** A jagged crack from (x, y) along angle a (deterministic from seed): dark gash with a glowing seam. */
function crack(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, seed: number, t: Tint, alpha: number): void {
  if (alpha <= 0.01) return;
  const N = 5;
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x;
    let py = y;
    let ang = a;
    for (let i = 1; i <= N; i++) {
      ang += (hash2(seed, i) - 0.5) * 0.9;
      const step = (len / N) * (0.7 + hash2(seed + 7, i) * 0.6);
      px += Math.cos(ang) * step;
      py += Math.sin(ang) * step;
      ctx.lineTo(px, py);
    }
    if (pass === 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = t.deep;
      ctx.lineWidth = 5;
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = t.seam;
      ctx.lineWidth = 1.4;
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/** A soft dark stain (scorch, frost, void residue). */
function stain(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = alpha * 0.33;
    ctx.beginPath();
    ctx.arc(x, y, r * (1 - i * 0.28), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A jagged lightning bolt from (x1, y1) to (x2, y2), re-jittered every frame bucket. */
function bolt(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, seed: number, t: Tint, alpha: number, amp: number): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  if (L < 2 || alpha <= 0.01) return;
  const nx = -dy / L;
  const ny = dx / L;
  const N = Math.max(3, Math.min(24, Math.round(L / 22)));
  const off = Math.min(amp, L * 0.14);
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i < N; i++) {
      const u = i / N;
      const o = (hash2(seed, i) * 2 - 1) * off;
      ctx.lineTo(x1 + dx * u + nx * o, y1 + dy * u + ny * o);
    }
    ctx.lineTo(x2, y2);
  };
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  path();
  ctx.globalAlpha = alpha * 0.3;
  ctx.strokeStyle = t.halo;
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = t.main;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = t.core;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // a fork off the middle
  const m = Math.floor(N / 2);
  const mo = (hash2(seed, m) * 2 - 1) * off;
  const mx = x1 + (dx * m) / N + nx * mo;
  const my = y1 + (dy * m) / N + ny * mo;
  const fa = Math.atan2(dy, dx) + (hash2(seed, 99) < 0.5 ? -0.7 : 0.7);
  const fl = L * 0.22;
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + Math.cos(fa) * fl * 0.5 + nx * off * 0.3, my + Math.sin(fa) * fl * 0.5 + ny * off * 0.3);
  ctx.lineTo(mx + Math.cos(fa) * fl, my + Math.sin(fa) * fl);
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = t.main;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
}

function toLocal(ctx: CanvasRenderingContext2D, f: Fx): void {
  ctx.translate(f.x, f.y);
  ctx.rotate(f.a);
}

/** sweep direction: alternate by seed so repeated swings (Flurry) go back and forth */
function dirOf(f: Fx): number {
  return f.seed & 1 ? -1 : 1;
}

// ---------------------------------------------------------------- the animations

/** a crescent swipe across a cone (`heavy`: thicker, an afterimage, a ground scar) */
function slashDef(heavy: boolean, rays: boolean): VfxDef {
  return {
    dur: () => (heavy ? 0.75 : 0.36),
    ground: heavy
      ? (ctx, f, age) => {
          const d = dirOf(f);
          ctx.globalAlpha = 0.35 * fade(age, 0.25, 0.75);
          ctx.strokeStyle = f.tint.deep;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.l * 0.86, f.a - d * f.w, f.a + d * f.w, d < 0);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      : undefined,
    top(ctx, f, age, p) {
      const d = dirOf(f);
      const sweepS = heavy ? 0.13 : 0.1;
      const start = f.a - d * f.w;
      const span = 2 * f.w;
      const lead = start + d * span * easeOut(age / sweepS);
      const tail = start + d * span * easeIn((age - sweepS * 0.6) / (heavy ? 0.3 : 0.24));
      const alpha = fade(age, heavy ? 0.22 : 0.16, heavy ? 0.42 : 0.34);
      const R = f.l * 0.9;
      const th = f.l * (heavy ? 0.5 : 0.36);
      if (heavy) crescent(ctx, f.x, f.y, R * 0.8, start + (tail - start) * 0.6, start + (lead - start) * 0.85, th * 0.55, f.tint, alpha * 0.45);
      crescent(ctx, f.x, f.y, R, tail, lead, th, f.tint, alpha);
      if (rays) {
        // a rising sun: rays fan across the cone from the wielder
        const k = easeOut(age / 0.2);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = f.tint.main;
        ctx.lineWidth = 3;
        for (let i = 0; i < 7; i++) {
          const ang = f.a - f.w + (2 * f.w * (i + 0.5)) / 7;
          ctx.globalAlpha = 0.45 * fade(age, 0.15, 0.6);
          ctx.beginPath();
          ctx.moveTo(f.x + Math.cos(ang) * f.l * 0.25, f.y + Math.sin(ang) * f.l * 0.25);
          ctx.lineTo(f.x + Math.cos(ang) * f.l * (0.4 + 0.75 * k), f.y + Math.sin(ang) * f.l * (0.4 + 0.75 * k));
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        glow(ctx, f.x, f.y, f.l * 0.55, f.tint.halo, 0.5 * fade(age, 0.1, 0.5));
      }
      if (age > sweepS * 0.8 && once(f, 1)) {
        const ex = f.x + Math.cos(f.a + d * f.w) * R;
        const ey = f.y + Math.sin(f.a + d * f.w) * R;
        p.burst(ex, ey, heavy ? 10 : 6, heavy ? 260 : 200, 0.3, 2.5, f.tint.main, 'spark', f.a + d * (f.w + Math.PI / 2), 0.5);
        if (heavy) p.burst(ex, ey, 5, 60, 0.6, 9, '#6a6058', 'smoke');
      }
    },
  };
}

const spin: VfxDef = {
  dur: () => 0.46,
  top(ctx, f, age, p) {
    const d = dirOf(f);
    const a0 = hash2(f.seed, 3) * TAU;
    const lead = a0 + d * TAU * 1.15 * easeOut(age / 0.26);
    const trail = Math.min(TAU * 0.8, TAU * 1.15 * easeOut(age / 0.26));
    const alpha = fade(age, 0.2, 0.46);
    const R = f.l * 0.86;
    crescent(ctx, f.x, f.y, R, lead - d * trail, lead, f.l * 0.32, f.tint, alpha);
    crescent(ctx, f.x, f.y, R * 0.62, lead - d * trail * 0.7 - d * 0.6, lead - d * 0.6, f.l * 0.14, f.tint, alpha * 0.5);
    ring(ctx, f.x, f.y, R, 2, f.tint.halo, 0.25 * alpha);
    if (once(f, 1)) p.burst(f.x, f.y, 6, f.l * 1.6, 0.45, 8, '#5a524a', 'smoke');
  },
};

const whipCrack: VfxDef = {
  dur: () => 0.42,
  top(ctx, f, age, p) {
    const d = dirOf(f);
    const s = easeOut(age / 0.16);
    const lead = f.a - d * f.w + d * 2 * f.w * s;
    const alpha = fade(age, 0.2, 0.42);
    // the whip itself: a curve from the hand to the tip, the tip lagging the sweep
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const u = i / 14;
        const ang = lead - d * 0.55 * u * u * (1 - s * 0.7);
        ctx.lineTo(f.x + Math.cos(ang) * f.l * u, f.y + Math.sin(ang) * f.l * u);
      }
      ctx.globalAlpha = alpha * (pass === 0 ? 0.3 : 0.95);
      ctx.strokeStyle = pass === 0 ? f.tint.halo : f.tint.core;
      ctx.lineWidth = pass === 0 ? 8 : 2.5;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'butt';
    // the tip's trail, crackling
    const tipA = lead - d * 0.55 * (1 - s * 0.7);
    const tailA = f.a - d * f.w + d * 2 * f.w * easeIn((age - 0.05) / 0.25);
    crescent(ctx, f.x, f.y, f.l, tailA, tipA, f.l * 0.12, f.tint, alpha * 0.8);
    const fr = Math.floor(age / 0.04);
    bolt(ctx, f.x + Math.cos(tailA) * f.l, f.y + Math.sin(tailA) * f.l, f.x + Math.cos(tipA) * f.l, f.y + Math.sin(tipA) * f.l, f.seed + fr * 13, SHOCK, alpha, 14);
    if (age > 0.14 && once(f, 1)) {
      const tx = f.x + Math.cos(tipA) * f.l;
      const ty = f.y + Math.sin(tipA) * f.l;
      p.burst(tx, ty, 10, 280, 0.3, 2.5, '#ffe14a', 'spark');
      p.spawn(tx, ty, 0, 0, 0.25, 6, '#ffffff', 'ring', { grow: 120 });
    }
  },
};

const guillotine: VfxDef = {
  dur: () => 0.8,
  ground(ctx, f, age) {
    // the scar the wave cuts into the floor
    const d = f.l * easeOut((age - 0.05) / 0.36);
    if (d < 4) return;
    ctx.save();
    toLocal(ctx, f);
    ctx.globalAlpha = 0.5 * fade(age, 0.35, 0.8);
    ctx.fillStyle = f.tint.deep;
    lensPath(ctx, f.w * 0.3, d, f.w * 0.12, 0.3);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 * fade(age, 0.2, 0.7);
    ctx.fillStyle = f.tint.halo;
    lensPath(ctx, f.w * 0.3, d, f.w * 0.05, 0.3);
    ctx.fill();
    ctx.restore();
  },
  top(ctx, f, age, p) {
    // 1) the slice: a huge crescent swung across the front of the wielder
    const R = f.w * 1.35;
    const cx = f.x + Math.cos(f.a) * f.w * 0.15;
    const cy = f.y + Math.sin(f.a) * f.w * 0.15;
    const sweep = easeOut(age / 0.1);
    const lead = f.a - 1.35 + 2.7 * sweep;
    const tail = f.a - 1.35 + 2.7 * easeIn((age - 0.05) / 0.25);
    crescent(ctx, cx, cy, R, tail, lead, R * 0.6, f.tint, fade(age, 0.12, 0.32));
    // 2) the shockwave: a crescent of force travelling along the cut, as wide as the cut
    const u = c01((age - 0.06) / 0.42);
    if (u > 0 && u < 1) {
      const wr = f.w * 0.95;
      const d = f.w * 0.5 + (f.l - f.w * 0.5) * easeOut(u);
      const alpha = 1 - u * u * u;
      const ox = f.x + Math.cos(f.a) * (d - wr);
      const oy = f.y + Math.sin(f.a) * (d - wr);
      crescent(ctx, ox, oy, wr, f.a - 1.1, f.a + 1.1, wr * 0.5, f.tint, alpha, true);
      crescent(ctx, ox - Math.cos(f.a) * wr * 0.4, oy - Math.sin(f.a) * wr * 0.4, wr * 0.9, f.a - 0.95, f.a + 0.95, wr * 0.25, f.tint, alpha * 0.45, true);
      // speed lines behind it
      ctx.save();
      toLocal(ctx, f);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = f.tint.main;
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 2) {
        ctx.globalAlpha = 0.5 * alpha;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, d - f.w * 1.4), i * f.w * 0.32);
        ctx.lineTo(d - f.w * 0.25, i * f.w * 0.32);
        ctx.stroke();
      }
      ctx.restore();
      if (once(f, 2)) p.burst(cx + Math.cos(f.a) * R, cy + Math.sin(f.a) * R, 10, 260, 0.35, 2.5, f.tint.core, 'spark', f.a, 0.9);
    }
    if (u >= 1 && once(f, 1)) {
      const ex = f.x + Math.cos(f.a) * f.l;
      const ey = f.y + Math.sin(f.a) * f.l;
      p.burst(ex, ey, 8, 120, 0.6, 9, '#6a6058', 'smoke', f.a, 0.8);
      p.burst(ex, ey, 10, 240, 0.35, 2.5, f.tint.main, 'spark', f.a, 0.8);
    }
  },
};

const thrust: VfxDef = {
  dur: () => 0.34,
  top(ctx, f, age) {
    const tip = f.l * easeOut(age / 0.09);
    const base = f.l * 0.85 * easeIn((age - 0.1) / 0.22);
    const alpha = fade(age, 0.14, 0.34);
    ctx.save();
    toLocal(ctx, f);
    lens(ctx, Math.max(8, base), tip, f.w * 0.42, f.tint, alpha, 0.25);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = f.tint.main;
    ctx.lineWidth = 1.2;
    for (let i = -1; i <= 1; i += 2) {
      ctx.globalAlpha = 0.55 * alpha;
      ctx.beginPath();
      ctx.moveTo(Math.max(base, tip - f.l * 0.55), i * f.w * 0.55);
      ctx.lineTo(tip - f.l * 0.12, i * f.w * 0.55);
      ctx.stroke();
    }
    ctx.restore();
    if (age > 0.06) {
      const k = fade(age, 0.12, 0.3);
      star(ctx, f.x + Math.cos(f.a) * tip, f.y + Math.sin(f.a) * tip, f.w * 0.9 * k, f.a + age * 3, f.tint.core, k);
      glow(ctx, f.x + Math.cos(f.a) * tip, f.y + Math.sin(f.a) * tip, f.w * 0.9, f.tint.halo, 0.6 * k);
    }
  },
};

/** a heavy downward chop: a fat blade streak and a split in the floor at its end */
const chop: VfxDef = {
  dur: () => 0.7,
  tint: BLOOD,
  ground(ctx, f, age) {
    const ex = f.x + Math.cos(f.a) * f.l * 0.85;
    const ey = f.y + Math.sin(f.a) * f.l * 0.85;
    const k = fade(age, 0.3, 0.7);
    for (let i = 0; i < 4; i++) crack(ctx, ex, ey, f.a + (i - 1.5) * 0.8, f.w * 0.75, f.seed + i * 17, f.tint, k);
  },
  top(ctx, f, age, p) {
    const tip = f.l * easeOut(age / 0.08);
    ctx.save();
    toLocal(ctx, f);
    lens(ctx, f.l * 0.1, tip, f.w * 0.55, f.tint, fade(age, 0.14, 0.4), 0.6);
    ctx.restore();
    if (age > 0.07 && once(f, 1)) {
      const ex = f.x + Math.cos(f.a) * f.l * 0.85;
      const ey = f.y + Math.sin(f.a) * f.l * 0.85;
      p.spawn(ex, ey, 0, 0, 0.3, 8, f.tint.main, 'ring', { grow: 200 });
      p.burst(ex, ey, 10, 220, 0.4, 3, f.tint.main, 'spark');
      p.burst(ex, ey, 6, 160, 0.5, 3, '#a01828', 'shard', f.a, 1.2, { grav: 300 });
    }
  },
};

/** a blunt overhead smash (`cross`: a holy cross flares from the impact) */
function smashDef(cross: boolean): VfxDef {
  return {
    dur: () => 0.75,
    ...(cross ? { tint: HOLY } : {}),
    ground(ctx, f, age) {
      const d = Math.max(f.l * 0.5, Math.min(f.l * 0.75, f.l - f.w * 0.3));
      const ex = f.x + Math.cos(f.a) * d;
      const ey = f.y + Math.sin(f.a) * d;
      const k = fade(age, 0.35, 0.75) * c01((age - 0.05) / 0.03);
      for (let i = 0; i < 6; i++) crack(ctx, ex, ey, f.a + (i * TAU) / 6 + hash2(f.seed, i) * 0.6, f.w * (0.6 + hash2(f.seed, i + 9) * 0.5), f.seed + i * 31, f.tint, k);
    },
    top(ctx, f, age, p) {
      const d = Math.max(f.l * 0.5, Math.min(f.l * 0.75, f.l - f.w * 0.3));
      const ex = f.x + Math.cos(f.a) * d;
      const ey = f.y + Math.sin(f.a) * d;
      // the swing coming down
      if (age < 0.12) {
        ctx.save();
        toLocal(ctx, f);
        lens(ctx, 6, d * easeOut(age / 0.06), f.w * 0.3, f.tint, fade(age, 0.05, 0.12), 0.7);
        ctx.restore();
      }
      if (age < 0.05) return;
      const k = (age - 0.05) / 0.3;
      glow(ctx, ex, ey, f.w * 1.6, f.tint.halo, 0.9 * fade(age, 0.05, 0.3));
      star(ctx, ex, ey, f.w * 1.2 * (1 - c01(k) * 0.6), hash2(f.seed, 1), f.tint.core, fade(age, 0.08, 0.3), 4);
      star(ctx, ex, ey, f.w * 0.8 * (1 - c01(k) * 0.6), hash2(f.seed, 1) + Math.PI / 4, f.tint.main, fade(age, 0.08, 0.3), 4);
      ring(ctx, ex, ey, f.w * (0.4 + 1.1 * easeOut(k)), 6 * (1 - c01(k)) + 1, f.tint.main, fade(age, 0.1, 0.4));
      if (cross) {
        const ck = fade(age, 0.1, 0.6);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = f.tint.core;
        ctx.globalAlpha = 0.8 * ck;
        const h = f.w * 2.2 * easeOut((age - 0.05) / 0.12);
        ctx.fillRect(ex - 3, ey - h, 6, h * 1.35);
        ctx.fillRect(ex - h * 0.45, ey - h * 0.55, h * 0.9, 6);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      if (once(f, 1)) {
        p.burst(ex, ey, 8, 110, 0.6, 9, '#6a6058', 'smoke');
        p.burst(ex, ey, 8, 220, 0.5, 3, '#8a7f70', 'shard', -Math.PI / 2, 1.3, { grav: 500 });
        p.burst(ex, ey, 8, 260, 0.3, 2.5, f.tint.core, 'spark');
      }
    },
  };
}

const iai: VfxDef = {
  dur: () => 0.6,
  top(ctx, f, age, p) {
    ctx.save();
    toLocal(ctx, f);
    ctx.globalCompositeOperation = 'lighter';
    // the cut: one razor line drawn before the eye can follow
    const k = fade(age, 0.03, 0.22);
    ctx.globalAlpha = 0.45 * k;
    ctx.fillStyle = f.tint.halo;
    lensPath(ctx, -6, f.l + 6, f.w * 0.4, 0.55);
    ctx.fill();
    ctx.globalAlpha = k;
    ctx.fillStyle = f.tint.core;
    lensPath(ctx, 0, f.l, 2.6, 0.55);
    ctx.fill();
    // the air it parted: two afterimage edges drifting apart
    const sep = 3 + easeOut(age / 0.4) * f.w * 0.45;
    const a2 = fade(age, 0.1, 0.55) * c01(age / 0.05);
    ctx.globalAlpha = 0.8 * a2;
    ctx.fillStyle = f.tint.main;
    for (let i = -1; i <= 1; i += 2) {
      ctx.save();
      ctx.translate(0, i * sep);
      lensPath(ctx, f.l * 0.05, f.l, 1.6, 0.5);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    star(ctx, f.x + Math.cos(f.a) * f.l, f.y + Math.sin(f.a) * f.l, f.w * 0.9 * k, 0, f.tint.core, k);
    if (once(f, 1)) {
      for (let i = 1; i <= 5; i++) {
        const d = (f.l * i) / 6;
        p.burst(f.x + Math.cos(f.a) * d, f.y + Math.sin(f.a) * d, 2, 160, 0.35, 2, f.tint.core, 'spark', f.a + Math.PI / 2, 0.25);
        p.burst(f.x + Math.cos(f.a) * d, f.y + Math.sin(f.a) * d, 2, 160, 0.35, 2, f.tint.core, 'spark', f.a - Math.PI / 2, 0.25);
      }
    }
  },
};

/** a bolt or arrow streaking down the line with a tracer and rings of parted air */
const boltStreak: VfxDef = {
  dur: () => 0.42,
  top(ctx, f, age, p) {
    const head = f.l * c01(age / 0.1);
    const tail = f.l * easeIn((age - 0.04) / 0.34);
    ctx.save();
    toLocal(ctx, f);
    ctx.globalCompositeOperation = 'lighter';
    if (head - tail > 1) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = f.tint.halo;
      lensPath(ctx, tail, head, Math.max(4, f.w * 0.3), 0.85);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = f.tint.core;
      lensPath(ctx, tail, head, 1.8, 0.9);
      ctx.fill();
    }
    // rings of parted air where the head has passed
    ctx.strokeStyle = f.tint.main;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const u = 0.18 + i * 0.27;
      const at = u * 0.1;
      if (age < at) continue;
      const k = c01((age - at) / 0.28);
      ctx.globalAlpha = 0.6 * (1 - k);
      ctx.beginPath();
      ctx.ellipse(f.l * u, 0, 3 + k * 6, f.w * 0.5 + k * f.w * 0.9, 0, 0, TAU);
      ctx.stroke();
    }
    // the projectile itself while it flies
    if (age < 0.1) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e8e1c8';
      ctx.beginPath();
      ctx.moveTo(head + 8, 0);
      ctx.lineTo(head - 4, -4);
      ctx.lineTo(head - 4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(head - 22, -1.2, 20, 2.4);
    }
    ctx.restore();
    if (age >= 0.1 && once(f, 1)) p.burst(f.x + Math.cos(f.a) * f.l, f.y + Math.sin(f.a) * f.l, 8, 220, 0.3, 2.5, f.tint.main, 'spark', f.a + Math.PI, 0.8);
  },
};

const whip: VfxDef = {
  dur: () => 0.42,
  top(ctx, f, age, p) {
    const ext = easeOut(age / 0.14);
    const tipD = f.l * ext;
    const alpha = fade(age, 0.2, 0.42);
    ctx.save();
    toLocal(ctx, f);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const u = i / 18;
        const amp = f.w * 0.9 * (1 - ext * 0.9) * Math.sin(Math.PI * u);
        ctx.lineTo(tipD * u, Math.sin(u * Math.PI * 2.4 - age * 40) * amp);
      }
      ctx.globalAlpha = alpha * (pass === 0 ? 0.3 : 0.95);
      ctx.strokeStyle = pass === 0 ? f.tint.halo : f.tint.core;
      ctx.lineWidth = pass === 0 ? 8 : 2.6;
      ctx.stroke();
    }
    ctx.restore();
    if (age > 0.12) {
      const tx = f.x + Math.cos(f.a) * f.l;
      const ty = f.y + Math.sin(f.a) * f.l;
      const k = fade(age, 0.14, 0.32);
      star(ctx, tx, ty, 18 * k, f.seed, f.tint.core, k, 5);
      if (once(f, 1)) {
        p.spawn(tx, ty, 0, 0, 0.25, 4, '#ffffff', 'ring', { grow: 140 });
        p.burst(tx, ty, 10, 260, 0.28, 2.5, f.tint.core, 'spark');
      }
    }
  },
};

const hook: VfxDef = {
  dur: () => 0.52,
  top(ctx, f, age, p) {
    const ext = age < 0.16 ? easeOut(age / 0.16) : age < 0.22 ? 1 : 1 - easeIn((age - 0.22) / 0.26);
    const tipD = Math.max(14, f.l * ext);
    const alpha = fade(age, 0.4, 0.52);
    ctx.save();
    toLocal(ctx, f);
    // a streak of motion under the chain
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3 * alpha;
    ctx.fillStyle = f.tint.halo;
    lensPath(ctx, 10, tipD + 6, 7, 0.8);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2.2;
    // chain links, dark-outlined so they read on any floor
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? '#120e14' : '#d4d9e0';
      ctx.lineWidth = pass === 0 ? 4 : 2;
      for (let d = 16, i = 0; d < tipD - 14; d += 11, i++) {
        ctx.beginPath();
        if (i % 2 === 0) ctx.ellipse(d, 0, 6.5, 3.6, 0, 0, TAU);
        else {
          ctx.moveTo(d - 5, 0);
          ctx.lineTo(d + 5, 0);
        }
        ctx.stroke();
      }
    }
    // the hook: a sickle blade at the tip, its point curled back toward the wielder
    const s = Math.max(1.3, f.w / 26);
    ctx.translate(tipD, 0);
    ctx.scale(s, (f.seed & 2 ? 1 : -1) * s);
    ctx.fillStyle = '#e6eaf0';
    ctx.strokeStyle = '#120e14';
    ctx.lineWidth = 2 / s;
    ctx.beginPath();
    ctx.moveTo(-10, -2.5);
    ctx.lineTo(4, -3);
    ctx.quadraticCurveTo(20, -4, 18, -16);
    ctx.quadraticCurveTo(15, -25, 2, -24);
    ctx.quadraticCurveTo(12, -19, 10, -12);
    ctx.quadraticCurveTo(8, 4, -10, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a8290';
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.quadraticCurveTo(12, -19, 2, -24);
    ctx.quadraticCurveTo(14, -22, 15, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (age > 0.14 && age < 0.3) {
      const k = fade(age, 0.16, 0.3);
      star(ctx, f.x + Math.cos(f.a) * tipD, f.y + Math.sin(f.a) * tipD, f.w * 0.7 * k, 0.3, f.tint.core, k);
    }
    if (age > 0.15 && once(f, 1)) p.burst(f.x + Math.cos(f.a) * tipD, f.y + Math.sin(f.a) * tipD, 6, 180, 0.3, 2, f.tint.core, 'spark', f.a + Math.PI, 0.9);
  },
};

const iceLance: VfxDef = {
  dur: () => 0.95,
  tint: ICE,
  ground(ctx, f, age) {
    // a stripe of frost where it passed
    const head = Math.min(f.l, f.l * (age / 0.2));
    ctx.save();
    toLocal(ctx, f);
    ctx.globalAlpha = 0.22 * fade(age, 0.4, 0.95);
    ctx.fillStyle = '#d8f0ff';
    lensPath(ctx, 10, head, f.w * 0.35, 0.7);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  },
  top(ctx, f, age, p) {
    const L = Math.max(90, Math.min(140, f.w * 3.6));
    const hw = Math.max(14, f.w * 0.6);
    const flyS = 0.2;
    const u = c01(age / flyS);
    const head = L * 0.5 + (f.l - L * 0.5) * (u * (2 - u));
    const cx = head - L * 0.5;
    ctx.save();
    toLocal(ctx, f);
    // the frost trail behind the spike
    const tailA = fade(age, 0.15, 0.45);
    if (tailA > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 * tailA;
      ctx.fillStyle = '#6cc0ff';
      lensPath(ctx, 10 + (cx - 10) * easeIn((age - 0.12) / 0.3), cx, hw * 0.9, 0.85);
      ctx.fill();
      ctx.globalAlpha = 0.6 * tailA;
      ctx.fillStyle = '#e6f7ff';
      lensPath(ctx, 10 + (cx - 10) * easeIn((age - 0.1) / 0.25), cx, hw * 0.25, 0.9);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // the spike: a faceted crystal, bright face up, shadowed face down
    const holdS = flyS + 0.05;
    if (age < holdS) {
      ctx.translate(cx, 0);
      ctx.globalAlpha = 1;
      glow(ctx, 0, 0, L * 0.85, '#7cc4ff', 0.75);
      ctx.beginPath();
      ctx.moveTo(L / 2, 0);
      ctx.lineTo(L * 0.1, -hw);
      ctx.lineTo(-L * 0.2, -hw * 0.75);
      ctx.lineTo(-L / 2, -hw * 0.3);
      ctx.lineTo(-L * 0.38, 0);
      ctx.lineTo(-L / 2, hw * 0.3);
      ctx.lineTo(-L * 0.2, hw * 0.75);
      ctx.lineTo(L * 0.1, hw);
      ctx.closePath();
      ctx.fillStyle = '#8fd0f8';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0e2a40';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(L / 2, 0);
      ctx.lineTo(L * 0.1, -hw);
      ctx.lineTo(-L * 0.2, -hw * 0.75);
      ctx.lineTo(-L * 0.38, 0);
      ctx.closePath();
      ctx.fillStyle = '#e8f8ff';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(L / 2, 0);
      ctx.lineTo(L * 0.1, hw);
      ctx.lineTo(-L * 0.2, hw * 0.75);
      ctx.lineTo(-L * 0.38, 0);
      ctx.closePath();
      ctx.fillStyle = '#4f94cc';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(L / 2 - 2, 0);
      ctx.lineTo(-L * 0.36, 0);
      ctx.stroke();
      // small side crystals near the back
      ctx.fillStyle = '#bfe6ff';
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(-L * 0.05, i * hw * 0.6);
        ctx.lineTo(-L * 0.32, i * hw * 1.25);
        ctx.lineTo(-L * 0.3, i * hw * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      star(ctx, L / 2, 0, 10 + 4 * Math.sin(age * 60), age * 6, '#ffffff', 0.9);
    }
    ctx.restore();
    // motes shed in flight
    if (age < flyS) {
      const mx = f.x + Math.cos(f.a) * (cx - L * 0.4);
      const my = f.y + Math.sin(f.a) * (cx - L * 0.4);
      p.burst(mx, my, 2, 40, 0.5, 3, '#cfeaff', 'glow', f.a + Math.PI, 1.4);
    }
    // it shatters at the end of the line
    if (age >= holdS) {
      const tx = f.x + Math.cos(f.a) * (f.l - L * 0.25);
      const ty = f.y + Math.sin(f.a) * (f.l - L * 0.25);
      const k = fade(age, holdS, holdS + 0.3);
      glow(ctx, tx, ty, L * 0.9, '#9ad0ff', 0.8 * k);
      star(ctx, tx, ty, L * 0.6 * k, f.seed, '#ffffff', k, 6);
      if (once(f, 1)) {
        p.burst(tx, ty, 14, 300, 0.6, 5, '#cfeaff', 'shard', f.a, 1.6, { drag: 3 });
        p.burst(tx, ty, 8, 200, 0.5, 4, '#7cc4ff', 'shard', f.a, 2.4, { drag: 3 });
        p.burst(tx, ty, 8, 120, 0.7, 4, '#e6f7ff', 'glow');
        p.spawn(tx, ty, 0, 0, 0.35, 8, '#bfe6ff', 'ring', { grow: 180 });
      }
    }
  },
};

/** a beam of light down the line that flares, holds and narrows away */
const sunbeam: VfxDef = {
  dur: (d) => Math.max(0.6, d + 0.4),
  tint: HOLY,
  ground(ctx, f, age) {
    ctx.save();
    toLocal(ctx, f);
    ctx.globalCompositeOperation = 'lighter';
    // the floor it scorched with light: a soft band that fades from the far end inward
    ctx.globalAlpha = 0.18 * fade(age, 0.2, 0.6);
    ctx.fillStyle = '#ffc83a';
    lensPath(ctx, -f.w * 0.3, f.l * (1 - 0.6 * easeIn((age - 0.2) / 0.4)), f.w * 0.7, 0.3);
    ctx.fill();
    ctx.restore();
  },
  top(ctx, f, age, p) {
    const ext = f.l * easeOut(age / 0.07);
    const life = Math.max(0.6, f.dur);
    const wf = age < 0.1 ? 1 + 0.25 * (1 - age / 0.1) : fade(age, 0.12, life - 0.05);
    ctx.save();
    toLocal(ctx, f);
    ctx.globalCompositeOperation = 'lighter';
    const layers: [number, string, number][] = SUN_LAYERS;
    for (const [wm, col, al] of layers) {
      const hw = (f.w * wm * wf) / 2;
      if (hw <= 0.3) continue;
      ctx.globalAlpha = al * Math.min(1, wf + 0.2);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, -hw * 0.5);
      ctx.lineTo(ext, -hw);
      ctx.lineTo(ext, hw);
      ctx.lineTo(0, hw * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    // light ripples running down the beam
    ctx.strokeStyle = '#fffcef';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const u = (age * 2.2 + i / 4) % 1;
      ctx.globalAlpha = 0.5 * wf * Math.sin(Math.PI * u);
      ctx.beginPath();
      ctx.ellipse(ext * u, 0, 4, (f.w * wf) / 2, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    glow(ctx, f.x, f.y, f.w * 1.2, '#ffe98a', 0.8 * wf);
    glow(ctx, f.x + Math.cos(f.a) * ext, f.y + Math.sin(f.a) * ext, f.w * 1.4, '#ffe98a', 0.7 * wf);
    if (once(f, 1)) {
      for (let i = 0; i < 10; i++) {
        const d = (f.l * (i + 0.5)) / 10;
        p.spawn(f.x + Math.cos(f.a) * d + (Math.random() - 0.5) * f.w, f.y + Math.sin(f.a) * d + (Math.random() - 0.5) * f.w, 0, -30 - Math.random() * 40, 0.8 + Math.random() * 0.4, 3, '#ffe98a', 'glow', { drag: 1 });
      }
    }
  },
};
const SUN_LAYERS: [number, string, number][] = [
  [1.15, '#ffb42a', 0.3],
  [0.7, '#ffe98a', 0.6],
  [0.28, '#ffffff', 0.95],
];

/** one tick of a channelled beam: ticks overlap so the beam reads as one continuous ray */
const arcaneBeam: VfxDef = {
  dur: () => 0.27,
  tint: VOID,
  top(ctx, f, age) {
    const al = c01(age / 0.03) * fade(age, 0.2, 0.27);
    const rt = performance.now() / 1000;
    ctx.save();
    toLocal(ctx, f);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22 * al;
    ctx.fillStyle = f.tint.halo;
    ctx.fillRect(0, -f.w * 0.5, f.l, f.w);
    ctx.globalAlpha = 0.5 * al;
    ctx.fillStyle = f.tint.main;
    ctx.fillRect(0, -f.w * 0.2, f.l, f.w * 0.4);
    ctx.globalAlpha = 0.85 * al;
    ctx.fillStyle = f.tint.core;
    ctx.fillRect(0, -2, f.l, 4);
    // two strands winding round the core
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#e0c0ff';
    for (let s = 0; s < 2; s++) {
      ctx.globalAlpha = 0.45 * al;
      ctx.beginPath();
      for (let x = 0; x <= f.l; x += 14) ctx.lineTo(x, Math.sin(x * 0.045 - rt * 18 + s * Math.PI) * f.w * 0.36);
      ctx.stroke();
    }
    ctx.restore();
    glow(ctx, f.x, f.y, f.w * 0.9, f.tint.halo, 0.6 * al);
    glow(ctx, f.x + Math.cos(f.a) * f.l, f.y + Math.sin(f.a) * f.l, f.w * 1.1, f.tint.main, 0.5 * al);
  },
};

const lightning: VfxDef = {
  dur: () => 0.3,
  tint: SPARK,
  top(ctx, f, age, p) {
    const fr = Math.floor(age / 0.045);
    const al = 1 - easeIn(age / 0.3);
    const x2 = f.x + Math.cos(f.a) * f.l;
    const y2 = f.y + Math.sin(f.a) * f.l;
    bolt(ctx, f.x, f.y, x2, y2, f.seed + fr * 7, f.tint, al, Math.max(10, f.w * 1.4));
    glow(ctx, x2, y2, 26, '#7cc4ff', 0.7 * al);
    if (once(f, 1)) p.burst(x2, y2, 6, 200, 0.25, 2, '#ffe14a', 'spark');
  },
};

const groundSlam: VfxDef = {
  dur: () => 0.85,
  ground(ctx, f, age) {
    const k = fade(age, 0.35, 0.85) * c01(age / 0.05);
    const n = f.l > 130 ? 9 : 7;
    for (let i = 0; i < n; i++) crack(ctx, f.x, f.y, (i * TAU) / n + hash2(f.seed, i) * 0.5, f.l * (0.5 + hash2(f.seed, i + 5) * 0.35), f.seed + i * 29, f.tint, k);
    stain(ctx, f.x, f.y, f.l * 0.35, f.tint.deep, 0.5 * k);
  },
  top(ctx, f, age, p) {
    const k = easeOut(age / 0.26);
    ring(ctx, f.x, f.y, f.l * k, 10 * (1 - k) + 2, f.tint.main, fade(age, 0.12, 0.34));
    ring(ctx, f.x, f.y, f.l * k, 3, f.tint.core, fade(age, 0.08, 0.26));
    ring(ctx, f.x, f.y, f.l * easeOut((age - 0.06) / 0.3), 5, f.tint.halo, 0.45 * fade(age, 0.15, 0.4));
    glow(ctx, f.x, f.y, f.l * 0.8, f.tint.halo, 0.8 * fade(age, 0, 0.22));
    if (once(f, 1)) {
      for (let i = 0; i < 10; i++) {
        const a = (i * TAU) / 10;
        p.spawn(f.x + Math.cos(a) * f.l * 0.6, f.y + Math.sin(a) * f.l * 0.6, Math.cos(a) * 90, Math.sin(a) * 90, 0.7, 12, '#6a6058', 'smoke', { drag: 2.5 });
      }
      p.burst(f.x, f.y, 12, f.l * 2.2, 0.6, 3.5, '#8a7f70', 'shard', -Math.PI / 2, 1.4, { grav: 600 });
    }
  },
};

const holySmite: VfxDef = {
  dur: () => 0.75,
  tint: HOLY,
  ground(ctx, f, age) {
    // the floor still glowing where it struck
    glow(ctx, f.x, f.y, f.l * 1.4, '#ffc83a', 0.6 * fade(age, 0.2, 0.75));
  },
  top(ctx, f, age, p) {
    // a pillar of light driven down from above
    const pk = fade(age, 0.08, 0.45);
    const pw = f.l * 0.75 * (0.3 + 0.7 * pk);
    const top = f.y - 420;
    const drop = easeOut(age / 0.06);
    ctx.globalCompositeOperation = 'lighter';
    for (const [wm, col, al] of SUN_LAYERS) {
      ctx.globalAlpha = al * pk;
      ctx.fillStyle = col;
      ctx.fillRect(f.x - (pw * wm) / 2, top, pw * wm, (f.y - top) * drop);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    glow(ctx, f.x, f.y, f.l * 1.3, '#ffe98a', fade(age, 0.05, 0.4));
    ring(ctx, f.x, f.y, f.l * easeOut(age / 0.25), 6 * fade(age, 0, 0.3) + 1, '#ffe27a', fade(age, 0.1, 0.4));
    star(ctx, f.x, f.y, f.l * 1.2 * fade(age, 0.05, 0.4), age * 1.5, '#fffcef', fade(age, 0.05, 0.4));
    if (once(f, 1)) {
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU;
        const d = Math.random() * f.l;
        p.spawn(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 0, -40 - Math.random() * 60, 0.8 + Math.random() * 0.4, 3, '#ffe98a', 'glow', { drag: 1 });
      }
    }
  },
};

const holyNova: VfxDef = {
  dur: () => 0.7,
  tint: HOLY,
  top(ctx, f, age, p) {
    const k = easeOut(age / 0.3);
    const al = fade(age, 0.15, 0.6);
    glow(ctx, f.x, f.y, f.l * 0.9, '#ffe98a', 0.7 * fade(age, 0, 0.3));
    ring(ctx, f.x, f.y, f.l * k, 12 * (1 - k) + 3, '#ffc83a', 0.6 * al);
    ring(ctx, f.x, f.y, f.l * k, 2.5, '#ffffff', al);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#ffe98a';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12 + hash2(f.seed, i) * 0.2;
      ctx.globalAlpha = 0.6 * al;
      ctx.beginPath();
      ctx.moveTo(f.x + Math.cos(a) * f.l * k * 0.45, f.y + Math.sin(a) * f.l * k * 0.45);
      ctx.lineTo(f.x + Math.cos(a) * f.l * k * 0.95, f.y + Math.sin(a) * f.l * k * 0.95);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (once(f, 1)) p.burst(f.x, f.y, 14, f.l * 1.6, 0.8, 3, '#ffe98a', 'glow', -Math.PI / 2, Math.PI, { drag: 2.5, grav: -30 });
  },
};

const voidImplode: VfxDef = {
  dur: () => 0.85,
  tint: VOID,
  ground(ctx, f, age) {
    stain(ctx, f.x, f.y, f.l * 0.9, '#140820', 0.55 * fade(age, 0.4, 0.85));
  },
  top(ctx, f, age, p) {
    const inS = 0.32;
    const q = easeIn(age / inS);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    // tendrils wind inward and drag the light with them
    if (age < inS + 0.08) {
      const al = fade(age, inS, inS + 0.08);
      for (let i = 0; i < 7; i++) {
        const base = hash2(f.seed, i) * 0.6 + (i * TAU) / 7;
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          for (let j = 0; j <= 10; j++) {
            const u = j / 10;
            const rr = f.l * (1.15 - 0.95 * q) * (1 - u) + f.l * 0.06 * u;
            const ang = base + (1 - u) * 1.1 + q * 1.4;
            ctx.lineTo(f.x + Math.cos(ang) * rr, f.y + Math.sin(ang) * rr);
          }
          ctx.globalAlpha = al * (pass === 0 ? 0.3 : 0.85);
          ctx.strokeStyle = pass === 0 ? '#7a2cff' : '#c99aff';
          ctx.lineWidth = pass === 0 ? 8 : 2.4;
          ctx.stroke();
        }
      }
    }
    ctx.lineCap = 'butt';
    ctx.globalCompositeOperation = 'source-over';
    // the hole: grows as it feeds, then collapses
    const hr = age < inS ? f.l * 0.32 * q : f.l * 0.32 * (1 - easeOut((age - inS) / 0.18));
    if (hr > 0.5) {
      glow(ctx, f.x, f.y, hr * 2.4, '#7a2cff', 0.8);
      ctx.fillStyle = '#07030c';
      ctx.beginPath();
      ctx.arc(f.x, f.y, hr, 0, TAU);
      ctx.fill();
      ring(ctx, f.x, f.y, hr, 2.5, '#c99aff', 0.9);
    }
    // and bursts
    if (age >= inS) {
      const k = easeOut((age - inS) / 0.3);
      ring(ctx, f.x, f.y, f.l * k, 10 * (1 - k) + 2, '#b06bff', fade(age, inS + 0.1, inS + 0.4));
      ring(ctx, f.x, f.y, f.l * k * 0.92, 2, '#f3e8ff', fade(age, inS + 0.05, inS + 0.3));
      if (once(f, 1)) {
        p.burst(f.x, f.y, 18, f.l * 2.4, 0.5, 4, '#b06bff', 'glow');
        p.burst(f.x, f.y, 6, f.l, 0.8, 12, '#1a0a2a', 'smoke');
      }
    }
  },
};

/** flame tongues, a fireball and a scorch: an explosion over the circle (`size` scales the debris) */
function fireTop(ctx: CanvasRenderingContext2D, f: Fx, age: number, p: Particles, t0: number): void {
  const a = age - t0;
  if (a < 0) return;
  const k = easeOut(a / 0.22);
  const al = fade(a, 0.12, 0.5);
  glow(ctx, f.x, f.y, f.l * 1.5, '#fff3c4', fade(a, 0, 0.12));
  glow(ctx, f.x, f.y, f.l * (0.7 + 0.6 * k), '#ff5a1a', 0.9 * al);
  glow(ctx, f.x, f.y, f.l * (0.4 + 0.4 * k), '#ffd27a', 0.9 * al);
  ctx.globalCompositeOperation = 'lighter';
  const fr = Math.floor(a / 0.05);
  for (let i = 0; i < 10; i++) {
    const ang = (i * TAU) / 10 + (hash2(f.seed + fr, i) - 0.5) * 0.4;
    const len = f.l * (0.55 + 0.5 * hash2(f.seed, i + 20)) * k;
    const wid = f.l * 0.16 * (1 - k * 0.4);
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let pass = 0; pass < 2; pass++) {
      const s = pass === 0 ? 1 : 0.55;
      ctx.globalAlpha = al * (pass === 0 ? 0.7 : 0.9);
      ctx.fillStyle = pass === 0 ? '#ff6a1a' : '#ffd27a';
      ctx.beginPath();
      ctx.moveTo(f.x + ca * len * s, f.y + sa * len * s);
      ctx.quadraticCurveTo(f.x + ca * len * 0.4 * s - sa * wid * s, f.y + sa * len * 0.4 * s + ca * wid * s, f.x, f.y);
      ctx.quadraticCurveTo(f.x + ca * len * 0.4 * s + sa * wid * s, f.y + sa * len * 0.4 * s - ca * wid * s, f.x + ca * len * s, f.y + sa * len * s);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ring(ctx, f.x, f.y, f.l * k, 4 * (1 - k) + 1.5, '#ffb45a', fade(a, 0.08, 0.3));
  if (once(f, 1)) {
    const n = f.l > 120 ? 22 : 14;
    p.burst(f.x, f.y, n, f.l * 2.2, 0.8, 3, '#ff9a3a', 'glow', -Math.PI / 2, Math.PI, { drag: 2.5, grav: -50 });
    p.burst(f.x, f.y, 8, f.l * 2.6, 0.35, 2.5, '#ffd27a', 'spark');
    p.burst(f.x, f.y, 6, f.l * 0.8, 1.0, f.l * 0.12, '#3a3030', 'smoke', -Math.PI / 2, 1.2, { grav: -20 });
  }
}
function scorch(ctx: CanvasRenderingContext2D, f: Fx, age: number, life: number): void {
  stain(ctx, f.x, f.y, f.l * 0.75, '#140806', 0.55 * fade(age, life * 0.5, life) * c01(age / 0.1));
}

const fireBurst: VfxDef = {
  dur: () => 0.85,
  tint: FIRE,
  ground: (ctx, f, age) => scorch(ctx, f, age, 0.85),
  top: (ctx, f, age, p) => fireTop(ctx, f, age, p, 0),
};

const frostBurst: VfxDef = {
  dur: () => 0.85,
  tint: ICE,
  ground(ctx, f, age) {
    // a frost patch with a soft edge
    stain(ctx, f.x, f.y, f.l * 0.9, '#d8f0ff', 0.3 * fade(age, 0.4, 0.85));
    ctx.globalAlpha = 1;
  },
  top(ctx, f, age, p) {
    const grow = easeOut(age / 0.12);
    const al = fade(age, 0.38, 0.5);
    glow(ctx, f.x, f.y, f.l * 1.2, '#9ad0ff', 0.8 * fade(age, 0, 0.4));
    if (al > 0) {
      ctx.globalAlpha = al;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0e2a40';
      for (let i = 0; i < 9; i++) {
        const ang = (i * TAU) / 9 + hash2(f.seed, i) * 0.4;
        const len = f.l * (0.55 + 0.4 * hash2(f.seed, i + 9)) * grow;
        const hw = f.l * 0.09;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        ctx.fillStyle = i % 2 ? '#bfe6ff' : '#8fd0f8';
        ctx.beginPath();
        ctx.moveTo(f.x + ca * len, f.y + sa * len);
        ctx.lineTo(f.x + ca * len * 0.3 - sa * hw, f.y + sa * len * 0.3 + ca * hw);
        ctx.lineTo(f.x, f.y);
        ctx.lineTo(f.x + ca * len * 0.3 + sa * hw, f.y + sa * len * 0.3 - ca * hw);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ring(ctx, f.x, f.y, f.l * easeOut(age / 0.3), 3, '#e6f7ff', fade(age, 0.1, 0.45));
    if (age > 0.38 && once(f, 1)) {
      p.burst(f.x, f.y, 16, f.l * 2.6, 0.6, 5, '#cfeaff', 'shard', 0, Math.PI, { drag: 3 });
      p.burst(f.x, f.y, 8, f.l * 1.2, 0.7, 4, '#e6f7ff', 'glow');
    }
  },
};

/** a flaming rock falls onto the circle (drawn over its telegraph), then bursts and cracks the floor */
const meteor: VfxDef = {
  dur: () => 1.0,
  tint: FIRE,
  ground(ctx, f, age) {
    scorch(ctx, f, age, 1.0);
    const k = fade(age, 0.5, 1.0);
    for (let i = 0; i < 7; i++) crack(ctx, f.x, f.y, (i * TAU) / 7 + hash2(f.seed, i) * 0.5, f.l * (0.6 + hash2(f.seed, i + 3) * 0.4), f.seed + i * 11, FIRE, k);
  },
  top(ctx, f, age, p) {
    fireTop(ctx, f, age, p, 0);
    ring(ctx, f.x, f.y, f.l * 1.15 * easeOut(age / 0.3), 3, '#fff3c4', fade(age, 0.1, 0.35));
  },
  pre: {
    s: 0.42,
    draw(ctx, x, y, r, k, seed) {
      const rock = Math.max(9, r * 0.24);
      const sx = x - 260 * (1 - k);
      const sy = y - 560 * (1 - k);
      // its shadow swelling on the floor
      ctx.globalAlpha = 0.45 * k;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(x, y, rock * (0.6 + k), rock * (0.4 + 0.6 * k), 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      // the trail
      const tx = sx - 260 * 0.35;
      const ty = sy - 560 * 0.35;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const [w, c, a] of TRAIL) {
        ctx.globalAlpha = a;
        ctx.strokeStyle = c;
        ctx.lineWidth = rock * w;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      glow(ctx, sx, sy, rock * 3.2, '#ff7a3a', 0.9);
      ctx.fillStyle = '#3a2018';
      ctx.strokeStyle = '#120e14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        const rr = rock * (0.8 + hash2(seed, i) * 0.35);
        ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffb45a';
      ctx.beginPath();
      ctx.arc(sx + rock * 0.3, sy + rock * 0.35, rock * 0.4, 0, TAU);
      ctx.fill();
    },
  },
};
const TRAIL: [number, string, number][] = [
  [2.4, '#ff5a1a', 0.35],
  [1.4, '#ffb45a', 0.6],
  [0.6, '#fff3c4', 0.9],
];

/** arrows drop into the circle (over its telegraph), then stand in the floor */
const arrowRain: VfxDef = {
  dur: () => 0.9,
  top(ctx, f, age, p) {
    const n = Math.max(3, Math.min(7, Math.round(f.l / 12)));
    const al = fade(age, 0.5, 0.9);
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = hash2(xySeed(f.x, f.y), i) * TAU;
      const d = Math.sqrt(hash2(xySeed(f.x, f.y), i + 40)) * f.l * 0.8;
      const ax = f.x + Math.cos(a) * d;
      const ay = f.y + Math.sin(a) * d;
      const lean = (hash2(f.seed, i + 80) - 0.5) * 6;
      ctx.globalAlpha = al;
      ctx.strokeStyle = '#d8c8a8';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + lean, ay - 16);
      ctx.stroke();
      ctx.fillStyle = '#e8e1c8';
      ctx.fillRect(ax + lean - 2.5, ay - 18, 5, 4);
    }
    ctx.globalAlpha = 1;
    if (once(f, 1)) {
      p.burst(f.x, f.y, 5, f.l * 1.2, 0.5, 7, '#6a6058', 'smoke');
      p.burst(f.x, f.y, 6, 160, 0.25, 2, '#ffe9b0', 'spark', -Math.PI / 2, 1.2);
    }
  },
  pre: {
    s: 0.22,
    draw(ctx, x, y, r, k) {
      const n = Math.max(3, Math.min(7, Math.round(r / 12)));
      ctx.lineWidth = 2;
      for (let i = 0; i < n; i++) {
        const a = hash2(xySeed(x, y), i) * TAU;
        const d = Math.sqrt(hash2(xySeed(x, y), i + 40)) * r * 0.8;
        const ax = x + Math.cos(a) * d;
        const ay = y + Math.sin(a) * d - 300 * (1 - k);
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#ffe9b0';
        ctx.beginPath();
        ctx.moveTo(ax, ay - 70);
        ctx.lineTo(ax, ay - 16);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#d8c8a8';
        ctx.beginPath();
        ctx.moveTo(ax, ay - 22);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.fillStyle = '#c9ced6';
        ctx.beginPath();
        ctx.moveTo(ax - 3, ay - 4);
        ctx.lineTo(ax, ay + 3);
        ctx.lineTo(ax + 3, ay - 4);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
};

const shadowCut: VfxDef = {
  dur: () => 0.45,
  tint: VOID,
  top(ctx, f, age, p) {
    const a0 = hash2(f.seed, 2) * Math.PI;
    for (let i = 0; i < 2; i++) {
      const t0 = i * 0.07;
      if (age < t0) continue;
      const a = a0 + i * 1.9;
      const ext = easeOut((age - t0) / 0.06);
      const al = fade(age, t0 + 0.12, t0 + 0.32);
      const L = f.l * 1.25;
      ctx.save();
      ctx.translate(f.x - Math.cos(a) * L, f.y - Math.sin(a) * L);
      ctx.rotate(a);
      ctx.globalAlpha = 0.6 * al;
      ctx.fillStyle = '#1a0a2a';
      lensPath(ctx, 0, 2 * L * ext, f.l * 0.16, 0.5);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(f.x - Math.cos(a) * L, f.y - Math.sin(a) * L);
      ctx.rotate(a);
      lens(ctx, 0, 2 * L * ext, f.l * 0.12, f.tint, al, 0.5);
      ctx.restore();
    }
    if (once(f, 1)) {
      p.burst(f.x, f.y, 6, 90, 0.6, 10, '#2a1438', 'smoke');
      p.burst(f.x, f.y, 6, 160, 0.4, 3, '#9a4aff', 'glow');
    }
  },
};

/** a zone's tick on one body: a small glint in the zone's colour */
const tick: VfxDef = {
  dur: () => 0.35,
  top(ctx, f, age, p) {
    const k = fade(age, 0.05, 0.35);
    const s = 8 + 10 * easeOut(age / 0.12);
    glow(ctx, f.x, f.y, s * 1.6, f.tint.halo, 0.7 * k);
    star(ctx, f.x, f.y, s, f.seed, f.tint.core, k);
    if (once(f, 1)) p.burst(f.x, f.y, 3, 50, 0.5, 2.5, f.tint.main, 'glow', -Math.PI / 2, 0.8, { grav: -40 });
  },
};

const DEFS: Record<VfxId, VfxDef> = {
  slash: slashDef(false, false),
  cleave: slashDef(true, false),
  dawn_arc: { ...slashDef(true, true), tint: HOLY },
  spin,
  whip_crack: whipCrack,
  guillotine,
  thrust,
  execute: chop,
  smash: smashDef(false),
  judgment: smashDef(true),
  iai,
  bolt: boltStreak,
  whip,
  hook,
  ice_lance: iceLance,
  sunbeam,
  arcane_beam: arcaneBeam,
  lightning,
  ground_slam: groundSlam,
  holy_smite: holySmite,
  holy_nova: holyNova,
  void_implode: voidImplode,
  fire_burst: fireBurst,
  frost_burst: frostBurst,
  meteor,
  arrow_rain: arrowRain,
  shadow_cut: shadowCut,
  tick,
};

export function isVfxId(id: string): id is VfxId {
  return id in DEFS;
}

// ---------------------------------------------------------------- the pool

const MAX = 64;
const pool: Fx[] = [];
let next = 0;
let seedN = 1;
let liveN = 0;

/** Start the animation an fx event names (returns false when the id is unknown: the caller draws its plain burst). */
export function spawnSkillFx(ev: { kind: string; x: number; y: number } & FxExtra, now: number): boolean {
  if (!ev.v || !isVfxId(ev.v)) return false;
  const def = DEFS[ev.v];
  let f = pool[next];
  if (!f) {
    f = { live: false, def, shape: 0, x: 0, y: 0, a: 0, l: 0, w: 0, t0: 0, dur: 0, seed: 0, tint: TINTS.physical, done: 0 };
    pool[next] = f;
  }
  next = (next + 1) % MAX;
  if (!f.live) liveN++;
  f.live = true;
  f.def = def;
  f.shape = ev.kind === 'line' ? LINE : ev.kind === 'cone' ? CONE : CIRCLE;
  f.x = ev.x;
  f.y = ev.y;
  f.a = ev.a ?? 0;
  f.l = ev.r ?? 40;
  f.w = ev.x2 ?? (f.shape === CONE ? 0.8 : f.shape === LINE ? 30 : 0);
  f.t0 = now;
  f.dur = def.dur(ev.d ?? 0);
  f.seed = (seedN = (seedN * 1103515245 + 12345) & 0x7fffffff);
  f.tint = def.tint ?? TINTS[ev.el ?? 'physical'];
  f.done = 0;
  return true;
}

function sweep(now: number): void {
  for (const f of pool) {
    if (f.live && now - f.t0 > f.dur) {
      f.live = false;
      liveN--;
    }
  }
}

/** Draw the floor parts (scars, cracks, scorch) under the bodies. */
export function drawSkillFxGround(ctx: CanvasRenderingContext2D, now: number): void {
  if (!liveN) return;
  sweep(now);
  ctx.save();
  for (const f of pool) if (f.live && f.def.ground) f.def.ground(ctx, f, now - f.t0);
  ctx.restore();
}

/** Draw the bright parts over the bodies, plus whatever is about to land on a telegraph (falling meteors, arrows). */
export function drawSkillFxTop(ctx: CanvasRenderingContext2D, now: number, p: Particles, telegraphs: Iterable<Entity>, simNow: number): void {
  ctx.save();
  for (const e of telegraphs) {
    const tg = e.tg;
    if (e.type !== 'telegraph' || e.removed || !tg || !tg.vfx || tg.fired || !isVfxId(tg.vfx)) continue;
    const pre = DEFS[tg.vfx].pre;
    if (!pre) continue;
    const k = 1 - (tg.impact - simNow) / pre.s;
    if (k < 0 || k > 1) continue;
    let i = 0;
    for (const s of tg.shapes) if (s.k === 'circle' && i++ < 12) pre.draw(ctx, s.x, s.y, s.r, k, e.id * 31 + i);
  }
  if (liveN) {
    sweep(now);
    for (const f of pool) if (f.live) f.def.top(ctx, f, now - f.t0, p);
  }
  ctx.restore();
}

/** Forget every running animation (a room change). */
export function clearSkillFx(): void {
  for (const f of pool) f.live = false;
  liveN = 0;
}
