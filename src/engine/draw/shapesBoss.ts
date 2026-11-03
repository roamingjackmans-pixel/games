// Shape helpers for the boss draw functions (ART_AUDIO §2): two-tone outlined silhouettes (not just
// ellipses), tapered and jointed limbs, horns and claws, flames, glowing eyes, element swing trails, and the
// shared pose curves (windup → swing, the intro's 'roar'). Only src/engine/draw/bosses/* uses this file.
// Everything is plain canvas paths and the cached glow sprite from parts.ts: no per-frame canvases, no blur.
import { ELEMENTS } from '../../game/elements';
import type { DamageType } from '../../game/types';
import { OUTLINE, glow, shade, withAlpha } from './parts';
import type { DrawState } from './registry';

export const TAU = Math.PI * 2;

/** Current outline width: 3 px at scale 1, thicker when a boss is drawn big (the intro freeze-frame). */
const cur = { ow: 3 };

/** Call first in every boss draw: sets the outline width for this draw and returns the drawn radius. */
export function begin(s: DrawState): number {
  cur.ow = 3 * Math.max(1, s.scale);
  return s.r * s.scale;
}

export function ow(k = 1): number {
  return cur.ow * k;
}

/** Deterministic hash in [0, 1) for flicker and ragged edges (no Math.random in draw code). */
export function hash(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

function easeOutBack(k: number): number {
  const c = 1.9;
  const x = k - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

// ------------------------------------------------------------------ pose curves

/**
 * The weapon/limb curve shared by every boss: 0 at rest, rising to 1 over the first 0.3 s of a windup
 * (raised, coiled), snapping to −1 over 0.12 s of an attack (swung through), easing back in recovery.
 */
export function swing(s: DrawState): number {
  switch (s.pose) {
    case 'windup':
      return easeOutBack(clamp01(s.poseT / 0.3)) * (1 + Math.sin(s.t * 40) * 0.015);
    case 'attack': {
      const k = clamp01(s.poseT / 0.12);
      return 1 - 2 * k * k * (3 - 2 * k);
    }
    case 'recover':
      return -0.45;
    default:
      return 0;
  }
}

/**
 * Weights of the three key poses (rest, raised, struck) for the current pose: blend per-boss pose arrays
 * with blendPose. Windup eases into 'raised' with an overshoot; the attack snaps from raised to struck in
 * 0.12 s; recovery hangs mostly in the follow-through.
 */
export function poseWeights(s: DrawState): [number, number, number] {
  switch (s.pose) {
    case 'windup': {
      const e = easeOutBack(clamp01(s.poseT / 0.3));
      return [1 - e, e, 0];
    }
    case 'attack': {
      const k = clamp01(s.poseT / 0.12);
      const e = k * k * (3 - 2 * k);
      return [0, 1 - e, e];
    }
    case 'recover':
      return [0.4, 0, 0.6];
    default:
      return [1, 0, 0];
  }
}

/** out[i] = rest[i]·w0 + raised[i]·w1 + struck[i]·w2. */
export function blendPose(rest: number[], raised: number[], struck: number[], w: [number, number, number]): number[] {
  const out = new Array<number>(rest.length);
  for (let i = 0; i < rest.length; i++) out[i] = rest[i]! * w[0] + raised[i]! * w[1] + struck[i]! * w[2];
  return out;
}

/** Move a pose array toward a target pose by k (in place); used for the roar and stagger overlays. */
export function mixPose(p: number[], target: number[], k: number): number[] {
  if (k === 0) return p;
  for (let i = 0; i < p.length; i++) p[i] = p[i]! + (target[i]! - p[i]!) * k;
  return p;
}

/** 'roar' (boss intro): animates in over ~0.4 s with an overshoot and holds at 1. 0 in every other pose. */
export function roar(s: DrawState): number {
  if (s.pose !== 'roar') return 0;
  return easeOutBack(clamp01(s.poseT / 0.4));
}

/** A small angry tremble while roaring (pixels, scaled to the body). */
export function roarShake(s: DrawState, r: number): number {
  if (s.pose !== 'roar') return 0;
  return Math.sin(s.t * 55) * r * 0.012 * clamp01(s.poseT / 0.4);
}

/** The glow colour of the attack in progress (windup/attack only), else null. */
export function atkGlow(s: DrawState): string | null {
  if (!s.atk) return null;
  if (s.pose !== 'windup' && s.pose !== 'attack') return null;
  return ELEMENTS[s.atk].glow;
}

/** How strongly the attack glow shows: builds over the windup, full on the strike. */
export function atkK(s: DrawState): number {
  if (!s.atk) return 0;
  if (s.pose === 'windup') return 0.45 + 0.55 * clamp01(s.poseT / 0.5);
  if (s.pose === 'attack') return 1 - clamp01((s.poseT - 0.15) / 0.3) * 0.6;
  return 0;
}

export function elem(t: DamageType): (typeof ELEMENTS)[DamageType] {
  return ELEMENTS[t];
}

/** Fill colour: white while flashing (same rule as registry.fc). */
export function f(s: DrawState, color: string): string {
  return s.flash ? '#ffffff' : color;
}

// ------------------------------------------------------------------ paths and filled shapes

export function linePath(ctx: CanvasRenderingContext2D, pts: number[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.closePath();
}

/** A closed smooth curve through the midpoints of a point list (organic silhouettes). */
export function smoothPath(ctx: CanvasRenderingContext2D, pts: number[]): void {
  const n = pts.length / 2;
  ctx.beginPath();
  const lx = pts[(n - 1) * 2]!;
  const ly = pts[(n - 1) * 2 + 1]!;
  ctx.moveTo((lx + pts[0]!) / 2, (ly + pts[1]!) / 2);
  for (let i = 0; i < n; i++) {
    const x = pts[i * 2]!;
    const y = pts[i * 2 + 1]!;
    const j = ((i + 1) % n) * 2;
    ctx.quadraticCurveTo(x, y, (x + pts[j]!) / 2, (y + pts[j + 1]!) / 2);
  }
  ctx.closePath();
}

export interface ShapeOpts {
  /** darker underside colour (derived when omitted); null for none */
  under?: string | null;
  /** fraction of the height the underside covers */
  uf?: number;
  /** smooth (curved) instead of straight edges */
  smooth?: boolean;
  outline?: string;
  /** outline width multiplier (× the current outline width); 0 for none */
  w?: number;
  /** a lighter rim along the top edge */
  hi?: string | null;
}

/** Fill a point list with a flat colour, a curved darker underside and a thick outline. */
export function shape(ctx: CanvasRenderingContext2D, pts: number[], fill: string, o: ShapeOpts = {}): void {
  if (pts.length < 6) return;
  if (o.smooth) smoothPath(ctx, pts);
  else linePath(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  const under = o.under === undefined ? shade(fill, 0.7) : o.under;
  if (under || o.hi) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      x0 = Math.min(x0, pts[i]!);
      x1 = Math.max(x1, pts[i]!);
      y0 = Math.min(y0, pts[i + 1]!);
      y1 = Math.max(y1, pts[i + 1]!);
    }
    const w = x1 - x0;
    const h = y1 - y0;
    ctx.save();
    ctx.clip();
    if (under) {
      const uf = o.uf ?? 0.38;
      ctx.fillStyle = under;
      ctx.beginPath();
      ctx.ellipse((x0 + x1) / 2 + w * 0.08, y1 + h * 0.05, w * 0.75, h * uf * 1.15, 0, 0, TAU);
      ctx.fill();
    }
    if (o.hi) {
      ctx.fillStyle = o.hi;
      ctx.beginPath();
      ctx.ellipse((x0 + x1) / 2 - w * 0.12, y0 - h * 0.02, w * 0.45, h * 0.16, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  const lw = o.w ?? 1;
  if (lw > 0) {
    if (under || o.hi) {
      if (o.smooth) smoothPath(ctx, pts);
      else linePath(ctx, pts);
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = cur.ow * lw;
    ctx.strokeStyle = o.outline ?? OUTLINE;
    ctx.stroke();
  }
}

/** Ellipse with the two-tone shading and outline (like parts.blob, using the current outline width). */
export function oval(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, o: ShapeOpts & { rot?: number } = {}): void {
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  const under = o.under === undefined ? shade(fill, 0.7) : o.under;
  if (under) {
    ctx.save();
    ctx.clip();
    ctx.fillStyle = under;
    ctx.beginPath();
    ctx.ellipse(rx * 0.1, ry * (1.05 - (o.uf ?? 0.38) * 0.9), rx * 1.1, ry * 0.8, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  const lw = o.w ?? 1;
  if (lw > 0) {
    ctx.lineWidth = cur.ow * lw;
    ctx.strokeStyle = o.outline ?? OUTLINE;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/** A tapered limb from (x1, y1) (width w1) to (x2, y2) (width w2) with round ends and one outline. */
export function taper(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w1: number, w2: number, fill: string, lw = 1): void {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const r1 = w1 / 2;
  const r2 = w2 / 2;
  ctx.beginPath();
  ctx.arc(x2, y2, r2, a - Math.PI / 2, a + Math.PI / 2);
  ctx.arc(x1, y1, r1, a + Math.PI / 2, a + Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = cur.ow * lw;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

/** A plain stick (shaft, chain, pole) with an outline: like parts.limb with the current outline width. */
export function stick(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + cur.ow * 2 - 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.restore();
}

/**
 * Two-bone limb from a shoulder to a hand, bending at the elbow toward `bend` (±1). Upper and lower lengths
 * l1, l2; widths taper w1 → w2 → w3. Returns the elbow.
 */
export function arm2(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  hx: number,
  hy: number,
  l1: number,
  l2: number,
  bend: number,
  w1: number,
  w2: number,
  w3: number,
  fill: string,
): [number, number] {
  const e = elbow(sx, sy, hx, hy, l1, l2, bend);
  taper(ctx, sx, sy, e[0], e[1], w1, w2, fill);
  taper(ctx, e[0], e[1], hx, hy, w2, w3, fill);
  // re-fill the joint so the upper arm's outline does not cut across it
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(e[0], e[1], w2 / 2 - cur.ow * 0.5, 0, TAU);
  ctx.fill();
  return e;
}

/** Elbow point of a two-bone chain (law of cosines), bending to side `bend`. */
export function elbow(sx: number, sy: number, hx: number, hy: number, l1: number, l2: number, bend: number): [number, number] {
  const dx = hx - sx;
  const dy = hy - sy;
  const d = Math.max(1e-3, Math.min(l1 + l2 - 1e-3, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const c = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const b = a + bend * Math.acos(c);
  return [sx + Math.cos(b) * l1, sy + Math.sin(b) * l1];
}

/** A curved tapering horn/claw/thorn from a base (width w) along angle `a`, curling by `curl` (radians). */
export function horn(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, w: number, curl: number, fill: string, lw = 1): void {
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  const tipA = a + curl;
  const tx = x + Math.cos(a + curl * 0.5) * len;
  const ty = y + Math.sin(a + curl * 0.5) * len;
  const mx = x + Math.cos(a) * len * 0.55;
  const my = y + Math.sin(a) * len * 0.55;
  ctx.beginPath();
  ctx.moveTo(x + nx * w * 0.5, y + ny * w * 0.5);
  ctx.quadraticCurveTo(mx + nx * w * 0.35, my + ny * w * 0.35, tx, ty);
  ctx.quadraticCurveTo(mx - nx * w * 0.3 + Math.cos(tipA) * 0, my - ny * w * 0.3, x - nx * w * 0.5, y - ny * w * 0.5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = cur.ow * lw;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

/**
 * A smooth tapering tentacle/vine/tail along a cubic Bézier (x0, y0) → (x3, y3) with control points
 * (x1, y1), (x2, y2), from width w0 to w1, one outline around the whole thing. Optional sucker dots.
 */
export function tentacle(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  w0: number,
  w1: number,
  fill: string,
  under: string | null = null,
  suckers: string | null = null,
): void {
  const n = 14;
  const L: number[] = [];
  const Rr: number[] = [];
  const mids: number[] = [];
  let px = x0;
  let py = y0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    // tangent
    const tx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
    const ty = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
    const tl = Math.hypot(tx, ty) || Math.hypot(x - px, y - py) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push(x + nx * w, y + ny * w);
    Rr.push(x - nx * w, y - ny * w);
    mids.push(x, y, nx, ny, w);
    px = x;
    py = y;
  }
  ctx.beginPath();
  ctx.moveTo(L[0]!, L[1]!);
  for (let i = 2; i < L.length; i += 2) ctx.lineTo(L[i]!, L[i + 1]!);
  ctx.arc(x3, y3, Math.max(0.5, w1 / 2), Math.atan2(L[L.length - 1]! - y3, L[L.length - 2]! - x3), Math.atan2(Rr[Rr.length - 1]! - y3, Rr[Rr.length - 2]! - x3), true);
  for (let i = Rr.length - 2; i >= 0; i -= 2) ctx.lineTo(Rr[i]!, Rr[i + 1]!);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (under) {
    // a darker stripe along one side for volume
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = under;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = i * 5;
      const b = a + 5;
      ctx.lineWidth = Math.max(1, mids[a + 4]! * 0.9);
      ctx.beginPath();
      ctx.moveTo(mids[a]! - mids[a + 2]! * mids[a + 4]! * 0.6, mids[a + 1]! - mids[a + 3]! * mids[a + 4]! * 0.6);
      ctx.lineTo(mids[b]! - mids[b + 2]! * mids[b + 4]! * 0.6, mids[b + 1]! - mids[b + 3]! * mids[b + 4]! * 0.6);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(L[0]!, L[1]!);
    for (let i = 2; i < L.length; i += 2) ctx.lineTo(L[i]!, L[i + 1]!);
    ctx.arc(x3, y3, Math.max(0.5, w1 / 2), Math.atan2(L[L.length - 1]! - y3, L[L.length - 2]! - x3), Math.atan2(Rr[Rr.length - 1]! - y3, Rr[Rr.length - 2]! - x3), true);
    for (let i = Rr.length - 2; i >= 0; i -= 2) ctx.lineTo(Rr[i]!, Rr[i + 1]!);
    ctx.closePath();
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = cur.ow;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (suckers) {
    ctx.fillStyle = suckers;
    for (let i = 2; i < n - 1; i += 2) {
      const a = i * 5;
      ctx.beginPath();
      ctx.arc(mids[a]! + mids[a + 2]! * mids[a + 4]! * 0.35, mids[a + 1]! + mids[a + 3]! * mids[a + 4]! * 0.35, Math.max(1, mids[a + 4]! * 0.35), 0, TAU);
      ctx.fill();
    }
  }
}

/** A hand of n claws/fingers fanned around angle `a`. */
export function claws(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, w: number, n: number, spread: number, curl: number, fill: string): void {
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0 : i / (n - 1) - 0.5;
    horn(ctx, x, y, a + k * spread, len * (1 - Math.abs(k) * 0.35), w, curl, fill, 0.8);
  }
}

/** A row of triangular teeth along (x1, y1) → (x2, y2), pointing to side `dir` (+1 = the line's left normal). */
export function teeth(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, n: number, h: number, dir: number, fill: string): void {
  const dx = (x2 - x1) / n;
  const dy = (y2 - y1) / n;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / len) * dir;
  const ny = ((x2 - x1) / len) * dir;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ax = x1 + dx * i;
    const ay = y1 + dy * i;
    const hh = h * (0.75 + hash(i * 3.1 + n) * 0.5);
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + dx * 0.5 + nx * hh, ay + dy * 0.5 + ny * hh);
    ctx.lineTo(ax + dx, ay + dy);
  }
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = cur.ow * 0.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

/** A glowing eye: soft glow, a coloured almond (rotated by `rot`), a hot white core. */
export function glowEye(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, rot = 0, glowK = 1): void {
  if (glowK > 0) glow(ctx, x, y, Math.max(rx, ry) * 3.2, color, 0.75 * glowK);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-rx, 0);
  ctx.quadraticCurveTo(0, -ry * 2, rx, 0);
  ctx.quadraticCurveTo(0, ry * 2, -rx, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = Math.max(1, cur.ow * 0.5);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha *= 0.85;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.4, ry * 0.45, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** One flickering flame tongue rising from (x, y): outer colour, inner hot core. */
export function flame(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, t: number, seed: number, outer = '#ff6a1a', inner = '#ffe08a', lw = 0.7): void {
  const fl = 0.8 + 0.2 * Math.sin(t * 13 + seed * 7) + 0.1 * Math.sin(t * 29 + seed * 3);
  const sway = Math.sin(t * 7 + seed * 5) * w * 0.35;
  const hh = h * fl;
  const tongue = (k: number, color: string, stroke: boolean): void => {
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5 * k, y);
    ctx.quadraticCurveTo(x - w * 0.6 * k, y - hh * 0.45 * k, x + sway * k, y - hh * k);
    ctx.quadraticCurveTo(x + w * 0.6 * k, y - hh * 0.45 * k, x + w * 0.5 * k, y);
    ctx.quadraticCurveTo(x, y + w * 0.35 * k, x - w * 0.5 * k, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke && lw > 0) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = cur.ow * lw;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
  };
  tongue(1, outer, true);
  tongue(0.55, inner, false);
}

/**
 * The element swing trail: a fading ring band from angle a0 to a1 around (cx, cy) at radius rr (band width
 * bw), drawn additively in `color`. Brightest at a1 (the leading edge).
 */
export function trail(ctx: CanvasRenderingContext2D, cx: number, cy: number, rr: number, bw: number, a0: number, a1: number, color: string, alpha = 1): void {
  const n = 7;
  const prevOp = ctx.globalCompositeOperation;
  const prevA = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const s0 = a0 + ((a1 - a0) * i) / n;
    const s1 = a0 + ((a1 - a0) * (i + 1)) / n;
    const k = (i + 1) / n;
    ctx.globalAlpha = prevA * alpha * k * k * 0.75;
    const ri = rr - bw * (0.35 + 0.65 * k);
    ctx.beginPath();
    ctx.arc(cx, cy, rr, s0, s1, a1 < a0);
    ctx.arc(cx, cy, Math.max(1, ri), s1, s0, a1 >= a0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = prevA;
}

/** Additive glow along a segment (a charged blade or a crackling limb): a few glow sprites. */
export function glowLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, r: number, color: string, alpha = 1, n = 4): void {
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    glow(ctx, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, r, color, alpha);
  }
}

/** Soft dark ground shadow (ellipse) under a body. */
export function groundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, alpha = 0.35): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** A ragged hem: points from (x0, y) to (x1, y) with jagged tatters hanging down by up to `d`. */
export function raggedEdge(x0: number, x1: number, y: number, d: number, n: number, seed: number, t = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n * 2; i++) {
    const k = i / (n * 2);
    const x = x0 + (x1 - x0) * k;
    const down = i % 2 === 1 ? d * (0.55 + hash(seed + i) * 0.45) + Math.sin(t * 3 + i) * d * 0.08 : d * 0.1 * hash(seed + i * 7);
    out.push(x, y + down);
  }
  return out;
}

/** Small specular glint (white dot). */
export function glint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 0.8): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Stroke an open polyline (cracks, seams, stitches) in a colour. */
export function strokePts(ctx: CanvasRenderingContext2D, pts: number[], color: string, w: number, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.stroke();
  ctx.restore();
}

/** Dizzy stars circling over a staggered boss. */
export function dizzy(ctx: CanvasRenderingContext2D, x: number, y: number, rr: number, t: number): void {
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + (i * TAU) / 3;
    const sx = x + Math.cos(a) * rr;
    const sy = y + Math.sin(a) * rr * 0.3;
    const k = Math.max(6, rr * 0.16);
    glow(ctx, sx, sy, k * 2, '#ffe14a', 0.8);
    const pts: number[] = [];
    for (let j = 0; j < 10; j++) {
      const aa = -Math.PI / 2 + (j * Math.PI) / 5;
      const rad = j % 2 === 0 ? k : k * 0.45;
      pts.push(sx + Math.cos(aa) * rad, sy + Math.sin(aa) * rad);
    }
    shape(ctx, pts, '#ffe14a', { under: null, w: 0.35 });
  }
}

/** Rising angry steam/shock lines around a roaring boss's head. */
export function roarLines(ctx: CanvasRenderingContext2D, x: number, y: number, rr: number, k: number, t: number, color = '#ffffff'): void {
  if (k <= 0.05) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = withAlpha(color, 0.75 * clamp01(k));
  ctx.lineWidth = cur.ow * 1.1;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    const pulse = (t * 2.2 + i * 0.37) % 1;
    const r0 = rr * (1 + pulse * 0.35);
    const r1 = r0 + rr * 0.22 * (1 - pulse * 0.5);
    ctx.globalAlpha = (1 - pulse) * clamp01(k);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

/** Shade helpers re-exported so the boss files import from one place. */
export { shade, withAlpha, glow, OUTLINE };
