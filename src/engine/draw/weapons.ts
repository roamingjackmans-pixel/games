// Weapons, shields and casting tools drawn in local space: the grip at the origin, pointing along +x.
// Lengths match the gameplay silhouettes (reach itself lives in the data). `t` is an animation clock in
// seconds; the bow's draw is a separate `charge` (seconds held). Legendary items with a design in
// legendaryWeapons.ts draw that instead of their base (pass the item's name).
import { OUTLINE, blob, glow, limb, poly, shade, spec, withAlpha } from './parts';
import { drawLegendaryWeapon } from './legendaryWeapons';

type Ctx = CanvasRenderingContext2D;

export const STEEL = '#c9ced6';
export const IRON = '#7c838e';
export const WOOD = '#7a5232';
export const LEATHER = '#4a2e1e';
export const GOLD = '#d4af37';
export const BRASS = '#b8893a';
export const DARK = '#3a3440';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// Shared weapon parts (also used by the legendary designs)
// ---------------------------------------------------------------------------------------------

/** Cheap deterministic hash in [0, 1) for particle placement (no Math.random in visuals either). */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Build a closed path from a flat [x0, y0, x1, y1, …] list (no fill, no stroke). */
export function trace(ctx: Ctx, pts: readonly number[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.closePath();
}

/**
 * Stroke an open polyline with round caps. Hot path: no save/restore (only alpha is put back; line caps
 * and joins are left round, every caller of drawWeapon/drawShield/drawTool wraps them in save/restore).
 */
export function line(ctx: Ctx, pts: readonly number[], color: string, w: number, alpha = 1): void {
  if (pts.length < 4 || alpha <= 0) return;
  const a = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = a * Math.min(1, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.stroke();
  ctx.globalAlpha = a;
}

/** The part of a closed polygon at or below y = y0 (one-plane Sutherland–Hodgman; avoids a canvas clip). */
function below(pts: readonly number[], y0: number): number[] {
  const out: number[] = [];
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const ax = pts[i * 2]!;
    const ay = pts[i * 2 + 1]!;
    const j = (i + 1) % n;
    const bx = pts[j * 2]!;
    const by = pts[j * 2 + 1]!;
    const ain = ay >= y0;
    if (ain) out.push(ax, ay);
    if (ain !== by >= y0) out.push(ax + ((bx - ax) * (y0 - ay)) / (by - ay), y0);
  }
  return out;
}

/** An outlined stroke: a dark line under a colored one (cords, chains, wires, bows). */
export function cord(ctx: Ctx, pts: readonly number[], color: string, w: number, ow = 2): void {
  line(ctx, pts, OUTLINE, w + ow * 2);
  line(ctx, pts, color, w);
}

export interface PlateOpts {
  /** outline width (default 2.5) */
  ow?: number;
  /** underside colour below `splitY`; null for none */
  under?: string | null;
  splitY?: number;
  /** an open polyline drawn as a bright cutting edge (half of it is clipped away) */
  edge?: readonly number[];
  edgeColor?: string;
  edgeW?: number;
}

/** A filled, outlined shape with a darker underside and an optional bright cutting edge. */
export function plate(ctx: Ctx, pts: readonly number[], fill: string, o: PlateOpts = {}): void {
  trace(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  if (o.under !== null) {
    const u = below(pts, o.splitY ?? 0);
    if (u.length >= 6) {
      trace(ctx, u);
      ctx.fillStyle = o.under ?? shade(fill, 0.78);
      ctx.fill();
    }
  }
  if (o.edge) {
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    line(ctx, o.edge, o.edgeColor ?? shade(fill, 1.6), (o.edgeW ?? 1.5) * 2);
    ctx.restore();
  }
  trace(ctx, pts);
  ctx.lineJoin = 'round';
  ctx.lineWidth = o.ow ?? 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

export interface BladeOpts {
  color?: string;
  tip?: number;
  /** fuller colour; null for no fuller */
  fuller?: string | null;
  /** fuller length as a fraction of the blade (default 0.7) */
  fullerLen?: number;
  /** tip-end half width as a fraction of the base half width (default 0.85) */
  taper?: number;
  ow?: number;
  edge?: string;
}

/** A straight double-edged blade from x0 to x1 (width w): two-tone, bright edge, fuller. Returns its outline. */
export function swordBlade(ctx: Ctx, x0: number, x1: number, w: number, o: BladeOpts = {}): number[] {
  const c = o.color ?? STEEL;
  const tip = o.tip ?? w;
  const hw = w / 2;
  const tw = hw * (o.taper ?? 0.85);
  const pts = [x0, -hw, x1 - tip, -tw, x1, 0, x1 - tip, tw, x0, hw];
  plate(ctx, pts, c, { ow: o.ow ?? (w >= 8 ? 2.5 : 2) });
  // the bright cutting edge, inset (no clip: this is drawn every frame in every hand)
  line(ctx, [x0 + 0.8, -hw + 0.75, x1 - tip, -tw + 0.7, x1 - 1.6, -0.15], o.edge ?? shade(c, 1.75), 0.8);
  if (o.fuller !== null && w >= 5) {
    const fx = x0 + (x1 - x0) * (o.fullerLen ?? 0.7);
    line(ctx, [x0 + 2.5, 0, fx, 0], o.fuller ?? shade(c, 0.62), Math.max(1, w * 0.2));
    line(ctx, [x0 + 2.5, -w * 0.17, fx - 1, -w * 0.17], shade(c, 1.6), 0.6, 0.8);
  } else {
    line(ctx, [x0 + 1, 0, x1 - tip * 0.6, 0], shade(c, 0.7), 0.6, 0.7);
  }
  return pts;
}

/** A moving light band across a shape (legendary sheen, polished steel). */
export function sheen(ctx: Ctx, pts: readonly number[], t: number, x0: number, x1: number, color = '#ffffff', alpha = 0.5, period = 2.4, width = 4): void {
  const k = (((t / period) % 1) + 1) % 1;
  const x = x0 - 12 + (x1 - x0 + 24) * k;
  ctx.save();
  trace(ctx, pts);
  ctx.clip();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 6, -40);
  ctx.lineTo(x - 6 + width, -40);
  ctx.lineTo(x + 6 + width, 40);
  ctx.lineTo(x + 6, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A wrapped grip from x0 to x1 (diagonal wrap lines and a light top stripe). */
export function grip(ctx: Ctx, x0: number, x1: number, w: number, color = LEATHER, wrap?: string): void {
  limb(ctx, x0, 0, x1, 0, w, color);
  ctx.save();
  ctx.strokeStyle = wrap ?? shade(color, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = x0; x < x1 - 1; x += 2.6) {
    ctx.moveTo(x, -w / 2 + 0.4);
    ctx.lineTo(x + 1.8, w / 2 - 0.4);
  }
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = shade(color, 1.5);
  ctx.beginPath();
  ctx.moveTo(x0, -w * 0.26);
  ctx.lineTo(x1, -w * 0.26);
  ctx.stroke();
  ctx.restore();
}

/** A wooden (or metal) haft with grain and a highlight. */
export function haft(ctx: Ctx, x0: number, x1: number, w: number, color = WOOD): void {
  limb(ctx, x0, 0, x1, 0, w, color);
  line(ctx, [x0 + 1, w * 0.2, x1 - 1, w * 0.2], shade(color, 0.72), Math.max(0.8, w * 0.22));
  line(ctx, [x0 + 1, -w * 0.22, x1 - 1, -w * 0.22], shade(color, 1.35), 0.8, 0.7);
}

/** A metal band around a haft at x. */
export function band(ctx: Ctx, x: number, w: number, h: number, color = IRON): void {
  plate(ctx, [x - w / 2, -h / 2, x + w / 2, -h / 2, x + w / 2, h / 2, x - w / 2, h / 2], color, { ow: 1.5 });
  line(ctx, [x - w / 2 + 0.7, -h / 2 + 1, x - w / 2 + 0.7, h / 2 - 1], shade(color, 1.6), 0.7);
}

/** A crossguard at x, half length `half`, thickness `th`, quillons curving forward by `curve`. */
export function crossguard(ctx: Ctx, x: number, half: number, th: number, color = GOLD, curve = 0): void {
  const a = th / 2;
  plate(ctx, [x - a, -half + 1.5, x + a + curve, -half - 0.5, x + a, -a - 1, x + a, a + 1, x + a + curve, half + 0.5, x - a, half - 1.5], color, { ow: 2 });
  disc(ctx, x, 0, a + 1, shade(color, 1.1), 1.5);
  spec(ctx, x - 0.4, -half * 0.55, 0.8, 0.7);
}

/** A flat outlined disc (cheaper than blob: no underside clip). */
export function disc(ctx: Ctx, x: number, y: number, r: number, fill: string, ow = 2): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (ow > 0) {
    ctx.lineWidth = ow;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

/** A round pommel at x. */
export function pommel(ctx: Ctx, x: number, r: number, color = GOLD): void {
  disc(ctx, x, 0, r, color, 2);
  dot(ctx, x + r * 0.15, r * 0.3, r * 0.55, shade(color, 0.78), 0.7);
  spec(ctx, x - r * 0.3, -r * 0.35, Math.max(0.6, r * 0.3), 0.8);
}

export function rivet(ctx: Ctx, x: number, y: number, r = 1.1, color = '#2a2630'): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(x - r * 0.55, y - r * 0.65, r * 0.6, r * 0.6);
}

/** A four-pointed sparkle. */
export function glint(ctx: Ctx, x: number, y: number, s: number, color = '#ffffff', alpha = 1): void {
  if (s <= 0.05 || alpha <= 0.01) return;
  const k = s * 0.22;
  const ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + k, y - k);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x + k, y + k);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - k, y + k);
  ctx.lineTo(x - s, y);
  ctx.lineTo(x - k, y - k);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = ga;
}

/** A filled dot. */
export function dot(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1): void {
  if (alpha <= 0.01 || r <= 0) return;
  const ga = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = ga * Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = ga;
}

/** The world's "up" (screen −y) expressed in this local space, so smoke and flames rise however the weapon turns. */
export function worldUp(ctx: Ctx): [number, number] {
  if (typeof ctx.getTransform !== 'function') return [0, -1];
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c;
  if (!det) return [0, -1];
  const ux = m.c / det;
  const uy = -m.a / det;
  const l = Math.hypot(ux, uy) || 1;
  return [ux / l, uy / l];
}

/**
 * Looping particles drifting from (x, y) along `dir` for `dist` px, `n` of them, `speed` loops a second.
 * Calls `fn(px, py, k, i)` with k the particle's life in [0, 1).
 */
export function drift(ctx: Ctx, x: number, y: number, t: number, n: number, dir: readonly [number, number], spread: number, dist: number, speed: number, seed: number, fn: (px: number, py: number, k: number, i: number) => void): void {
  const [dx, dy] = dir;
  const px = -dy;
  const py = dx;
  for (let i = 0; i < n; i++) {
    const h = hash(i * 7.31 + seed);
    const k = (((t * speed * (0.75 + 0.5 * hash(i + seed * 3.7)) + h) % 1) + 1) % 1;
    const off = (hash(i * 3.17 + seed * 1.3) - 0.5) * spread + Math.sin(t * 3 + i * 2.1) * spread * 0.15 * k;
    fn(x + dx * dist * k + px * off, y + dy * dist * k + py * off, k, i);
  }
  void ctx;
}

function flameShape(ctx: Ctx, x: number, y: number, h: number, w: number, sway: number, up: readonly [number, number], color: string): void {
  const [ux, uy] = up;
  const px = -uy;
  const py = ux;
  const tx = x + ux * h + px * sway;
  const ty = y + uy * h + py * sway;
  ctx.beginPath();
  ctx.moveTo(x + px * w, y + py * w);
  ctx.quadraticCurveTo(x + px * w + ux * h * 0.55, y + py * w + uy * h * 0.55, tx, ty);
  ctx.quadraticCurveTo(x - px * w + ux * h * 0.55, y - py * w + uy * h * 0.55, x - px * w, y - py * w);
  ctx.quadraticCurveTo(x - ux * w * 1.2, y - uy * w * 1.2, x + px * w, y + py * w);
  ctx.fillStyle = color;
  ctx.fill();
}

/** A flickering tongue of flame rising (world up) from (x, y). */
export function flame(ctx: Ctx, x: number, y: number, h: number, w: number, t: number, up: readonly [number, number], seed = 0, outer = '#ff7a1a', inner = '#ffd27a'): void {
  const f = 0.78 + 0.16 * Math.sin(t * 13 + seed * 3.1) + 0.08 * Math.sin(t * 23 + seed);
  const sway = Math.sin(t * 7 + seed) * w * 0.5;
  flameShape(ctx, x, y, h * f, w, sway, up, outer);
  flameShape(ctx, x, y, h * f * 0.55, w * 0.55, sway * 0.6, up, inner);
}

// ---------------------------------------------------------------------------------------------
// Base weapons
// ---------------------------------------------------------------------------------------------

function greathammer(ctx: Ctx): void {
  haft(ctx, -7, 42, 6, WOOD);
  grip(ctx, -7, 12, 6.5, LEATHER);
  band(ctx, 15, 3, 9);
  band(ctx, 28, 3, 9);
  plate(ctx, [31, -3.6, 42, -3.6, 42, 3.6, 31, 3.6], IRON, { ow: 1.5 });
  rivet(ctx, 35, 0, 1);
  // head: a chamfered block across the haft with striking faces at both ends
  const head = '#878d97';
  plate(ctx, [41, -13, 63, -13, 63, 13, 41, 13], head, { edge: [41, -13, 63, -13], edgeW: 0.8 });
  plate(ctx, [39, -17.5, 65, -17.5, 63.5, -12.5, 40.5, -12.5], '#b3b9c2', { ow: 2, edge: [39, -17.5, 65, -17.5], edgeColor: '#eef1f4', edgeW: 0.8 });
  plate(ctx, [40.5, 12.5, 63.5, 12.5, 65, 17.5, 39, 17.5], '#9aa0a9', { ow: 2 });
  plate(ctx, [49, -12.5, 55, -12.5, 55, 12.5, 49, 12.5], '#5d626b', { ow: 1.5, under: null });
  rivet(ctx, 52, -8, 1.2);
  rivet(ctx, 52, 8, 1.2);
  line(ctx, [43, -9, 47, -9], '#c3c8cf', 0.8, 0.7);
  line(ctx, [57, -9, 61, -9], '#c3c8cf', 0.8, 0.7);
  spec(ctx, 59, -15.4, 1.2);
}

function greataxe(ctx: Ctx): void {
  haft(ctx, -7, 63, 6, WOOD);
  grip(ctx, -7, 12, 6.5, LEATHER);
  band(ctx, 16, 3, 9);
  // two crescent bits
  const top = [44, -3, 42, -8, 38.5, -15, 35, -22, 41, -25.5, 49, -26.8, 57, -25.5, 63, -21, 60, -15, 57.5, -8, 56, -3];
  const edgeTop = [35, -22, 41, -25.5, 49, -26.8, 57, -25.5, 63, -21];
  plate(ctx, top, STEEL, { under: null, edge: edgeTop, edgeColor: '#f4f6f8', edgeW: 1.2 });
  line(ctx, [38.5, -19.5, 44, -22.4, 49, -23.4, 54.5, -22.4, 60, -19], shade(STEEL, 0.72), 0.9);
  const bot = top.map((v, i) => (i % 2 ? -v : v));
  const edgeBot = edgeTop.map((v, i) => (i % 2 ? -v : v));
  plate(ctx, bot, '#aeb4bd', { under: null, edge: edgeBot, edgeColor: '#e6eaee', edgeW: 1.2 });
  line(ctx, [38.5, 19.5, 44, 22.4, 49, 23.4, 54.5, 22.4, 60, 19], shade(STEEL, 0.62), 0.9);
  // socket and top spike
  plate(ctx, [42, -5, 58, -5, 58, 5, 42, 5], '#5d626b', { ow: 2 });
  rivet(ctx, 46, 0, 1.1);
  rivet(ctx, 54, 0, 1.1);
  plate(ctx, [58, -3, 68, 0, 58, 3], STEEL, { ow: 2, splitY: 0 });
  spec(ctx, 50, -21, 1.2);
}

function colossal(ctx: Ctx): void {
  pommel(ctx, -10, 4, '#8a6a3a');
  grip(ctx, -9, 11, 6, '#2e2630');
  plate(ctx, [13, -6.5, 22, -6.5, 22, 6.5, 13, 6.5], '#8f96a0', { ow: 2 });
  const pts = swordBlade(ctx, 21, 84, 16, { color: '#b8bec8', tip: 15, fuller: '#7d848f', fullerLen: 0.66, taper: 0.88 });
  line(ctx, [24, -4.8, 60, -4.8], '#e8ebef', 0.6, 0.6);
  void pts;
  crossguard(ctx, 12.5, 14, 4.5, '#8a6a3a', 3.5);
  rivet(ctx, 17.5, -3.5);
  rivet(ctx, 17.5, 3.5);
  spec(ctx, 70, -4, 1.2);
}

function crossbow(ctx: Ctx, charge: number): void {
  // stock with a flared butt and a rail
  plate(ctx, [-9, -4.5, -3, -3.2, 30, -3.2, 47, -2.4, 47, 2.4, 30, 3.2, -3, 3.2, -9, 4.5], WOOD, { ow: 2.5 });
  line(ctx, [-1, -0.6, 46, -0.6], shade(WOOD, 0.55), 1.2);
  band(ctx, 28, 2.5, 7.5);
  // trigger
  line(ctx, [7, 3.5, 6, 7, 8.5, 7.5], OUTLINE, 2.5);
  line(ctx, [7, 3.5, 6, 7, 8.5, 7.5], IRON, 1);
  // prod (bow arms)
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(30, 0, 18, -1.2, 1.2);
  ctx.stroke();
  ctx.strokeStyle = '#8a919c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#d6dae0';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(30, 0, 18.6, -1.1, 1.1);
  ctx.stroke();
  ctx.restore();
  const ex = 30 + Math.cos(1.2) * 18;
  const ey = Math.sin(1.2) * 18;
  dot(ctx, ex, -ey, 2, OUTLINE);
  dot(ctx, ex, ey, 2, OUTLINE);
  dot(ctx, ex, -ey, 1.1, '#d4af37');
  dot(ctx, ex, ey, 1.1, '#d4af37');
  // string, cocked
  const back = 14 - Math.min(3, charge * 6);
  line(ctx, [ex, -ey, back, 0, ex, ey], '#efe6d2', 1);
  // the loaded bolt
  line(ctx, [back, 0, 47, 0], OUTLINE, 3.2);
  line(ctx, [back, 0, 47, 0], '#a07a4a', 1.4);
  plate(ctx, [46, -2.4, 53, 0, 46, 2.4], STEEL, { ow: 1.5 });
  poly(ctx, [back + 1, 0, back + 5, -2.6, back + 6, 0], '#b03030', OUTLINE, 1);
  poly(ctx, [back + 1, 0, back + 5, 2.6, back + 6, 0], '#b03030', OUTLINE, 1);
  plate(ctx, [43, -5, 49, -5, 49, 5, 43, 5], IRON, { ow: 1.5 });
}

function club(ctx: Ctx): void {
  const body = [-7, -2.8, 8, -3.2, 20, -4.6, 30, -6.6, 40, -8.6, 47, -8.2, 51, -3.2, 51, 3.2, 47, 8.6, 38, 9.2, 28, 6.6, 18, 4.6, 8, 3.2, -7, 2.8];
  plate(ctx, body, '#8a5a32', { ow: 2.5 });
  line(ctx, [12, -1, 24, -2.2, 36, -3.8, 46, -4], '#6a4224', 0.9);
  line(ctx, [16, 1.8, 30, 2.4, 42, 4.2], '#6a4224', 0.9);
  line(ctx, [14, -2.2, 28, -4, 40, -6.4], '#b07a4a', 0.8, 0.8);
  blob(ctx, 34, -4.5, 2.2, 1.6, { fill: '#5a3a1a', outlineW: 1 });
  blob(ctx, 43, 4.5, 2, 1.5, { fill: '#5a3a1a', outlineW: 1 });
  blob(ctx, 24, 2.6, 1.5, 1.1, { fill: '#5a3a1a', outlineW: 1 });
  // a bark knot ridge at the head
  poly(ctx, [44, -8.4, 46, -11, 48.5, -7.8], '#7a4e2a', OUTLINE, 1.5);
  // leather wrap
  grip(ctx, -7, 9, 5.6, '#5a3a22', '#2a1a10');
  band(ctx, 9.5, 1.8, 6.8, '#3a2618');
}

function daggers(ctx: Ctx): void {
  pommel(ctx, -5.2, 2.6, '#a8aeb8');
  grip(ctx, -4.5, 5, 4, '#2e2630');
  swordBlade(ctx, 7, 30, 7, { tip: 8, taper: 0.8, fullerLen: 0.6 });
  crossguard(ctx, 6.4, 5.5, 2.4, '#a8aeb8', 1.5);
  spec(ctx, 22, -1.6, 0.8);
}

function rapier(ctx: Ctx): void {
  pommel(ctx, -6.5, 2.7, GOLD);
  grip(ctx, -5, 5, 3.6, '#5a4632', '#d4af37');
  swordBlade(ctx, 7, 62, 4, { color: '#dfe4ea', tip: 7, fuller: null, taper: 0.7, ow: 2 });
  // swept hilt: knuckle bow, side rings, straight quillons
  ctx.save();
  ctx.lineCap = 'round';
  for (const [col, w] of [
    [OUTLINE, 4],
    [GOLD, 1.8],
  ] as const) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(-5.5, -1.5);
    ctx.bezierCurveTo(-3, -9, 5, -9.5, 7, -2);
    ctx.moveTo(6.5, 0);
    ctx.ellipse(7.5, 0, 2.2, 6, 0, 0, TAU);
    ctx.moveTo(6.5, -8.5);
    ctx.lineTo(6.5, 8.5);
    ctx.moveTo(8, 3);
    ctx.bezierCurveTo(10, 6, 12, 6, 13, 4);
    ctx.stroke();
  }
  ctx.restore();
  dot(ctx, 6.5, -8.5, 1.5, GOLD);
  dot(ctx, 6.5, 8.5, 1.5, GOLD);
  spec(ctx, 7, -4, 0.8);
}

/** Point on a quadratic Bézier. */
function qb(a: number, b: number, c: number, s: number): number {
  const u = 1 - s;
  return u * u * a + 2 * u * s * b + s * s * c;
}

function katana(ctx: Ctx): void {
  // tsuka: black cord over white samegawa, showing diamonds
  limb(ctx, -9, 0, 8, 0, 4.6, '#1d1a22');
  ctx.fillStyle = '#e8e0d0';
  for (let x = -7.5; x < 6; x += 3.2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 1.6, -1.5);
    ctx.lineTo(x + 3.2, 0);
    ctx.lineTo(x + 1.6, 1.5);
    ctx.closePath();
    ctx.fill();
  }
  plate(ctx, [-11.5, -2.8, -9, -2.8, -9, 2.8, -11.5, 2.8], '#2a2a2a', { ow: 1.5 });
  // blade: curved, with a hamon temper line near the edge (+y side)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(12, -2.8);
  ctx.quadraticCurveTo(40, -6.5, 63, -10.5);
  ctx.quadraticCurveTo(62, -6, 57.5, -4);
  ctx.quadraticCurveTo(38, 2.4, 12, 3);
  ctx.closePath();
  ctx.fillStyle = '#c3c9d2';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#f2f5f8';
  ctx.beginPath();
  ctx.moveTo(12, 6);
  for (let i = 0; i <= 16; i++) {
    const s = i / 16;
    const xt = qb(12, 40, 63, s);
    const yt = qb(-2.8, -6.5, -10.5, s);
    const xb = qb(12, 38, 57.5, s);
    const yb = qb(3, 2.4, -4, s);
    const k = 0.45 + Math.sin(i * 1.9) * 0.1;
    ctx.lineTo(xt + (xb - xt) * k, yt + (yb - yt) * k);
  }
  ctx.lineTo(70, -10);
  ctx.lineTo(70, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  line(ctx, [14, -2, 40, -5.4, 60, -9.2], '#8f96a1', 0.8);
  line(ctx, [56.5, -8.6, 57.8, -4.4], '#8f96a1', 0.7);
  ctx.beginPath();
  ctx.moveTo(12, -2.8);
  ctx.quadraticCurveTo(40, -6.5, 63, -10.5);
  ctx.quadraticCurveTo(62, -6, 57.5, -4);
  ctx.quadraticCurveTo(38, 2.4, 12, 3);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // habaki and tsuba
  plate(ctx, [11, -3, 14, -3.2, 14, 3.2, 11, 3], GOLD, { ow: 1.5 });
  blob(ctx, 9.5, 0, 2, 6.6, { fill: '#3b3530', outlineW: 2 });
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(9.5, 0, 1.2, 5.4, 0, 0, TAU);
  ctx.stroke();
  glint(ctx, 44, -5.6, 1.8, '#ffffff', 0.9);
}

function bowLimbs(ctx: Ctx, color: string, tipColor: string, w = 3.5): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + 3;
  ctx.beginPath();
  ctx.arc(-6, 0, 26, -1.25, 1.25);
  ctx.moveTo(2.2, -24.7);
  ctx.quadraticCurveTo(2.6, -27.6, 6, -28.2);
  ctx.moveTo(2.2, 24.7);
  ctx.quadraticCurveTo(2.6, 27.6, 6, 28.2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(-6, 0, 26, -1.25, 1.25);
  ctx.stroke();
  ctx.strokeStyle = shade(color, 1.45);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(-6, 0, 26.9, -1.15, 1.15);
  ctx.stroke();
  ctx.strokeStyle = tipColor;
  ctx.lineWidth = w * 0.8;
  ctx.beginPath();
  ctx.moveTo(2.2, -24.7);
  ctx.quadraticCurveTo(2.6, -27.6, 6, -28.2);
  ctx.moveTo(2.2, 24.7);
  ctx.quadraticCurveTo(2.6, 27.6, 6, 28.2);
  ctx.stroke();
  ctx.restore();
}

/** The bow's string and (while drawn) a nocked arrow. Returns the string's middle x. */
export function bowString(ctx: Ctx, charge: number, color = '#efe6d2', arrow = true): number {
  const pull = Math.min(16, charge * 22);
  const mx = 2.5 - pull;
  line(ctx, [5.4, -27.6, mx, 0, 5.4, 27.6], color, 1);
  if (arrow && pull > 0.5) {
    line(ctx, [mx, 0, 30, 0], OUTLINE, 3);
    line(ctx, [mx, 0, 30, 0], '#a07a4a', 1.3);
    plate(ctx, [29, -2.2, 35, 0, 29, 2.2], STEEL, { ow: 1.2 });
    poly(ctx, [mx + 1, 0, mx + 5, -2.4, mx + 6.5, 0], '#efe6d2', OUTLINE, 1);
    poly(ctx, [mx + 1, 0, mx + 5, 2.4, mx + 6.5, 0], '#efe6d2', OUTLINE, 1);
  }
  return mx;
}

function bow(ctx: Ctx, charge: number): void {
  bowLimbs(ctx, '#9a6a3a', '#e8dcc0');
  plate(ctx, [17.6, -4.5, 22.6, -4.5, 22.6, 4.5, 17.6, 4.5], '#4a2e1e', { ow: 1.5 });
  line(ctx, [18.4, -3, 21.8, -1.6], '#2a1a10', 0.8);
  line(ctx, [18.4, 0, 21.8, 1.4], '#2a1a10', 0.8);
  dot(ctx, 20.1, -4.8, 1, '#d4af37');
  bowString(ctx, charge);
}

function whip(ctx: Ctx, t: number): void {
  pommel(ctx, -1.5, 3, '#6a4a2a');
  grip(ctx, 0, 10, 5, '#4a3020', '#2a1a10');
  band(ctx, 10.5, 2, 5.6, BRASS);
  const pts: number[] = [];
  for (let i = 0; i <= 8; i++) pts.push(11 + i * 6, Math.sin(i * 0.9 + t * 2.5) * (1 + i * 0.6));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  for (let i = 0; i < 8; i++) {
    ctx.lineWidth = 5.4 - i * 0.42;
    ctx.beginPath();
    ctx.moveTo(pts[i * 2]!, pts[i * 2 + 1]!);
    ctx.lineTo(pts[i * 2 + 2]!, pts[i * 2 + 3]!);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x0 = pts[i * 2]!;
    const y0 = pts[i * 2 + 1]!;
    const x1 = pts[i * 2 + 2]!;
    const y1 = pts[i * 2 + 3]!;
    ctx.strokeStyle = '#6a4424';
    ctx.lineWidth = 2.8 - i * 0.24;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    // braid ticks
    ctx.strokeStyle = '#3a2412';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    ctx.moveTo(mx - 1, my - 1);
    ctx.lineTo(mx + 1, my + 1);
    ctx.stroke();
  }
  ctx.restore();
  // the cracker
  const ex = pts[16]!;
  const ey = pts[17]!;
  line(ctx, [ex, ey, ex + 3.5, ey - 1.6], '#efe6d2', 1);
  line(ctx, [ex, ey, ex + 3.6, ey + 1.2], '#efe6d2', 1);
}

function longsword(ctx: Ctx): void {
  blob(ctx, -8.2, 0, 3.4, 3.4, { fill: '#a08a5a', outlineW: 2 });
  blob(ctx, -8.2, 0, 1.5, 1.5, { fill: '#6a5a3a', outlineW: 1 });
  grip(ctx, -6, 7.5, 4.5, '#3a2a22');
  swordBlade(ctx, 11, 64, 8, { tip: 10, taper: 0.82 });
  plate(ctx, [11, -4, 15, -4, 15, 4, 11, 4], '#9aa1ab', { ow: 1.8 });
  crossguard(ctx, 9.5, 11, 3.4, '#a08a5a', 2.2);
  spec(ctx, 46, -2.2, 0.9);
}

function spear(ctx: Ctx, t: number): void {
  haft(ctx, -8, 75, 4.2, WOOD);
  grip(ctx, -5, 10, 4.6, LEATHER);
  plate(ctx, [-11, 0, -7, -2.6, -6, -2.6, -6, 2.6, -7, 2.6], IRON, { ow: 1.5 });
  band(ctx, 24, 2, 6);
  band(ctx, 46, 2, 6);
  // a red streamer tied below the head
  const w1 = Math.sin(t * 3) * 1.5;
  const w2 = Math.sin(t * 3 + 1.3) * 1.5;
  cord(ctx, [70, 1.5, 64, 4 + w1, 58, 5 + w2], '#b03030', 1.8, 1);
  cord(ctx, [70, 1.5, 65, 6 + w2, 60, 8.5 + w1], '#d04a3a', 1.4, 1);
  // socket with binding, leaf head with a midrib
  plate(ctx, [67, -3.2, 76, -2.4, 76, 2.4, 67, 3.2], IRON, { ow: 1.8 });
  line(ctx, [69, -2.8, 69, 2.8], '#3a3440', 0.8);
  line(ctx, [71, -2.6, 71, 2.6], '#3a3440', 0.8);
  plate(ctx, [74.5, -1.8, 79, -6.2, 86, -5.8, 97, 0, 86, 5.8, 79, 6.2, 74.5, 1.8], STEEL, { edge: [79, -6.2, 86, -5.8, 97, 0], edgeColor: '#f6f8fa', edgeW: 0.8, ow: 2 });
  line(ctx, [76, 0, 94, 0], shade(STEEL, 0.6), 0.9);
  spec(ctx, 84, -3, 0.9);
}

function battleaxe(ctx: Ctx): void {
  haft(ctx, -7, 54, 5, WOOD);
  grip(ctx, -7, 10, 5.6, LEATHER);
  band(ctx, 14, 2.5, 7.5);
  // back spike
  plate(ctx, [45, 3, 51, 3, 48.5, 13], STEEL, { ow: 2, splitY: 99 });
  // bearded bit
  const bit = [46, -3, 45, -7, 41, -11, 34, -15, 31, -21, 36, -23.6, 45, -23.2, 53, -21.2, 58.5, -17.5, 56.5, -10, 55, -3];
  plate(ctx, bit, STEEL, { under: null, edge: [31, -21, 36, -23.6, 45, -23.2, 53, -21.2, 58.5, -17.5], edgeColor: '#f4f6f8', edgeW: 1.2 });
  line(ctx, [35, -19.4, 44, -20, 52, -18.4, 56, -15.4], shade(STEEL, 0.72), 0.9);
  // socket
  plate(ctx, [42.5, -4.6, 55.5, -4.6, 55.5, 4.6, 42.5, 4.6], '#5d626b', { ow: 2 });
  rivet(ctx, 46, 0, 1);
  rivet(ctx, 52, 0, 1);
  spec(ctx, 47, -18, 1.1);
}

function mace(ctx: Ctx): void {
  haft(ctx, -7, 36, 4.6, '#6a707a');
  grip(ctx, -7, 10, 5.4, '#4a2e1e');
  pommel(ctx, -8.5, 2.8, '#c9a85a');
  band(ctx, 33, 3, 7, '#c9a85a');
  const cx = 44;
  // flanges
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const px = -s;
    const py = c;
    plate(
      ctx,
      [cx + c * 5 + px * 2.6, s * 5 + py * 2.6, cx + c * 13.5 + px * 1.4, s * 13.5 + py * 1.4, cx + c * 14.5, s * 14.5, cx + c * 13.5 - px * 1.4, s * 13.5 - py * 1.4, cx + c * 5 - px * 2.6, s * 5 - py * 2.6],
      '#d8c27a',
      { ow: 1.6, under: null },
    );
    line(ctx, [cx + c * 7, s * 7, cx + c * 13.2, s * 13.2], '#fff4c4', 0.8, 0.8);
  }
  blob(ctx, cx, 0, 8, 8, { fill: '#c9a85a' });
  blob(ctx, cx, 0, 3, 3, { fill: '#e8d08a', outlineW: 1.5 });
  plate(ctx, [cx + 7, -2.6, cx + 13.5, 0, cx + 7, 2.6], '#e0cc8a', { ow: 1.5 });
  spec(ctx, cx - 2.5, -3.5, 1.4);
}

function halberd(ctx: Ctx): void {
  haft(ctx, -8, 96, 4.2, WOOD);
  grip(ctx, -6, 10, 4.6, LEATHER);
  band(ctx, 30, 2, 6);
  band(ctx, 52, 2, 6);
  plate(ctx, [-11, 0, -7.5, -2.6, -6.5, -2.6, -6.5, 2.6, -7.5, 2.6], IRON, { ow: 1.5 });
  // back hook
  plate(ctx, [73, 2, 70, 7, 63.5, 13.5, 67, 7.5, 70, 2], STEEL, { ow: 2, under: null, edge: [70, 7, 63.5, 13.5], edgeW: 0.8 });
  // top spike
  plate(ctx, [87, -2.6, 101, 0, 87, 2.6], STEEL, { ow: 2 });
  // axe blade
  const bit = [73, -2.5, 72, -7, 69.5, -11, 66, -16.5, 68.5, -21, 76, -23, 84, -22, 89.5, -18.5, 88.5, -11, 87, -7, 86.5, -2.5];
  plate(ctx, bit, STEEL, { under: null, edge: [66, -16.5, 68.5, -21, 76, -23, 84, -22, 89.5, -18.5], edgeColor: '#f4f6f8', edgeW: 1.1 });
  line(ctx, [70, -15, 72, -18.6, 77, -19.8, 84, -19, 87, -16.4], shade(STEEL, 0.72), 0.9);
  // langets
  plate(ctx, [66, -2.8, 88, -2.8, 88, 2.8, 66, 2.8], '#5d626b', { ow: 1.8 });
  rivet(ctx, 70, 0, 0.9);
  rivet(ctx, 79, 0, 0.9);
  spec(ctx, 78, -17, 1);
}

function twinaxes(ctx: Ctx): void {
  haft(ctx, -6, 34, 4.4, WOOD);
  grip(ctx, -6, 8, 5, LEATHER);
  const bit = [24.5, -2.6, 23.5, -6, 20.5, -11, 22.5, -14.6, 30, -15, 36.5, -12.6, 34.5, -7, 33.5, -2.6];
  plate(ctx, bit, STEEL, { under: null, edge: [20.5, -11, 22.5, -14.6, 30, -15, 36.5, -12.6], edgeColor: '#f4f6f8', edgeW: 1 });
  line(ctx, [23, -10.4, 30, -12, 34.5, -10.2], shade(STEEL, 0.72), 0.8);
  plate(ctx, [26, 2.6, 32, 2.6, 30.5, 7.5, 27.5, 7.5], '#aeb4bd', { ow: 1.8 });
  plate(ctx, [23.5, -3.6, 34.5, -3.6, 34.5, 3.6, 23.5, 3.6], '#5d626b', { ow: 1.8 });
  rivet(ctx, 29, 0, 0.9);
  spec(ctx, 28, -12, 0.9);
}

function fists(ctx: Ctx): void {
  blob(ctx, 6, 0, 6, 6, { fill: '#e8c9a0' });
  line(ctx, [3, -5, 3, 5], '#efe6d2', 2, 0.9);
  line(ctx, [6.5, -5.6, 6.5, 5.6], '#efe6d2', 1.6, 0.9);
}

/** Hybrid: Bonk + Brain, Void. A heavy maul whose head is an iron cage around a swirling void orb. */
function hollowMaul(ctx: Ctx, t: number): void {
  const VG = '#9a93ab';
  haft(ctx, -7, 41, 6, '#3b3540');
  grip(ctx, -7, 12, 6.5, '#4a4256', '#221e2a');
  band(ctx, 17, 3, 9, '#5d626b');
  band(ctx, 31, 3, 9, '#5d626b');
  plate(ctx, [38, -4.5, 43, -6, 43, 6, 38, 4.5], '#5d626b', { ow: 1.8 });
  const cx = 53.5;
  glow(ctx, cx, 0, 22 + Math.sin(t * 2.2) * 2, VG, 0.35);
  blob(ctx, cx, 0, 11, 11, { fill: '#2a2631', under: '#0d0b11', outlineW: 2 });
  // inward swirl
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, 0, 10.4, 0, TAU);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const r = 10.5 - j * 0.78;
      const a = -t * 1.8 + (k * TAU) / 3 + j * 0.32;
      const x = cx + Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = withAlpha(VG, 0.55);
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const k = (((t * 0.55 + hash(i * 1.7)) % 1) + 1) % 1;
    const r = 10 * (1 - k);
    const a = hash(i * 5.3) * TAU - k * 3.2 - t * 0.4;
    dot(ctx, cx + Math.cos(a) * r, Math.sin(a) * r, 0.9, '#d8d2e6', 0.9 * (1 - k * 0.6));
  }
  ctx.restore();
  dot(ctx, cx, 0, 2.6, '#06050a');
  // the cage
  ctx.save();
  ctx.lineCap = 'round';
  for (const [col, w] of [
    [OUTLINE, 4.2],
    ['#6d737d', 2],
  ] as const) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (const k of [-1, -0.42, 0.42, 1]) {
      ctx.moveTo(42.5, 0);
      ctx.quadraticCurveTo(cx, k * 16.5, 64.5, 0);
    }
    ctx.moveTo(cx, -11.5);
    ctx.lineTo(cx, 11.5);
    ctx.stroke();
  }
  ctx.restore();
  dot(ctx, 65, 0, 2.6, OUTLINE);
  dot(ctx, 65, 0, 1.6, '#8a909a');
  spec(ctx, 47.5, -6, 1);
}

const RUNES: readonly (readonly number[])[] = [
  [-1, -1.2, 0, 1.2, 1, -1.2],
  [0, -1.3, 0, 1.3, 0, 0, 1, -1],
  [-1, 1.2, -1, -1.2, 1, 0, -1, 1.2],
  [-1, -1, 1, 1, 0, 0, -1, 1],
  [0, -1.3, 1, 0, 0, 1.3, -1, 0, 0, -1.3],
  [-1, -1.2, 1, -1.2, -1, 1.2, 1, 1.2],
];

/** Glowing rune strokes along a fuller from x0, spaced `gap`, pulsing with t. */
export function runes(ctx: Ctx, x0: number, n: number, gap: number, t: number, color: string, glowColor: string, scale = 1): void {
  for (let i = 0; i < n; i++) {
    const a = 0.5 + 0.5 * Math.sin(t * 3 - i * 0.8);
    const x = x0 + i * gap;
    glow(ctx, x, 0, 4.5 * scale, glowColor, 0.25 + 0.4 * a);
    const r = RUNES[i % RUNES.length]!;
    const pts: number[] = [];
    for (let j = 0; j < r.length; j += 2) pts.push(x + r[j]! * scale, r[j + 1]! * scale);
    line(ctx, pts, color, 0.9, 0.6 + 0.4 * a);
    line(ctx, pts, '#ffffff', 0.4, 0.3 + 0.6 * a);
  }
}

/** Hybrid: Slicey + Brain, Magic. A slender longsword with blue runes along the fuller and a crystal pommel. */
function spellblade(ctx: Ctx, t: number): void {
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
  glow(ctx, -8.5, 0, 9 + pulse * 2, '#7cc4ff', 0.45);
  plate(ctx, [-12.5, 0, -8.5, -3.8, -4.8, 0, -8.5, 3.8], '#7cc4ff', { ow: 1.8, under: '#3f8cff', edge: [-12.5, 0, -8.5, -3.8], edgeColor: '#e8f6ff', edgeW: 0.7 });
  grip(ctx, -5.5, 7.5, 4, '#22304a', '#0e1626');
  const pts = swordBlade(ctx, 11, 64, 7, { color: '#d6e2f0', tip: 10, fuller: '#1f3a6a', fullerLen: 0.78, taper: 0.8 });
  line(ctx, [13.5, 0, 52, 0], '#1a3f8a', 2.4);
  runes(ctx, 16, 6, 6.2, t, '#3f8cff', '#7cc4ff', 0.95);
  sheen(ctx, pts, t, 11, 64, '#bfe4ff', 0.35, 3);
  crossguard(ctx, 9.3, 8.5, 3, '#c8d4e6', 1.8);
  dot(ctx, 9.3, 0, 1.8, '#3f8cff');
  glint(ctx, 9.3, 0, 2.2 + pulse, '#e8f6ff', 0.5 + pulse * 0.5);
}

/** Hybrid: Bonk + Prayer, Fire. A short haft, a chain, and a swaying spiked brass censer leaking embers. */
function censer(ctx: Ctx, t: number): void {
  haft(ctx, -6, 19, 4.6, '#4a3020');
  grip(ctx, -6, 9, 5, '#5a2a1a', '#2a1008');
  band(ctx, 11, 2, 6, BRASS);
  plate(ctx, [18, -3.4, 22.5, -2.4, 22.5, 2.4, 18, 3.4], BRASS, { ow: 1.8 });
  const th = 0.32 * Math.sin(t * 2.4);
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  const L = 18;
  // chain links
  for (let i = 0; i < 5; i++) {
    const s = 23 + (i + 0.5) * (L / 5);
    const x = 23 + (s - 23) * dx;
    const y = (s - 23) * dy;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(th);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (i % 2) ctx.ellipse(0, 0, 2.4, 1.4, 0, 0, TAU);
    else {
      ctx.moveTo(-2.4, 0);
      ctx.lineTo(2.4, 0);
    }
    ctx.stroke();
    ctx.strokeStyle = '#c9a85a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
  const cx = 23 + (L + 8) * dx;
  const cy = (L + 8) * dy;
  const flick = 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 5.3);
  glow(ctx, cx, cy, 17 + flick * 3, '#e33b22', 0.4 + flick * 0.15);
  // the censer
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(th);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const c = Math.cos(a);
    const s = Math.sin(a);
    poly(ctx, [c * 6 - s * 2.3, s * 6 + c * 2.3, c * 12, s * 12, c * 6 + s * 2.3, s * 6 - c * 2.3], '#f0c870', OUTLINE, 1.2);
  }
  blob(ctx, 0, 0, 7.5, 7.5, { fill: '#d9a640', under: '#9a6a20' });
  ctx.strokeStyle = '#6a3a10';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.stroke();
  for (const [hx, hy] of [
    [-3.5, -3.2],
    [0, -4.2],
    [3.5, -3.2],
    [-3.5, 3],
    [0, 4],
    [3.5, 3],
  ] as const) {
    dot(ctx, hx, hy, 1.15, OUTLINE);
    dot(ctx, hx, hy, 0.8, flick > 0.5 ? '#ffd27a' : '#ff7a3a');
  }
  blob(ctx, -8, 0, 2.6, 3.4, { fill: '#e0b45a', outlineW: 1.5 });
  spec(ctx, -2.5, -4, 1.1);
  ctx.restore();
  // smoke and embers drift up in world space
  const up = worldUp(ctx);
  drift(ctx, cx, cy, t, 3, up, 6, 22, 0.35, 11, (x, y, k) => dot(ctx, x, y, 2 + k * 4, '#8a8478', 0.28 * (1 - k)));
  drift(ctx, cx, cy, t, 6, up, 10, 18, 0.9, 3, (x, y, k) => dot(ctx, x, y, 1 - k * 0.5, k < 0.4 ? '#ffd27a' : '#ff7a3a', 1 - k));
}

/** Hybrid: Slicey + Prayer, Holy. A polearm with a crescent sunburst blade and a halo shimmer. */
function dawnGlaive(ctx: Ctx, t: number): void {
  const GO = '#f0c43c';
  const GL = '#ffe98a';
  haft(ctx, -8, 79, 4.2, '#e8dcc0');
  grip(ctx, -6, 10, 4.6, '#8a6a10', '#4a3808');
  band(ctx, 24, 2, 6, GO);
  band(ctx, 50, 2, 6, GO);
  plate(ctx, [-11, 0, -7.5, -2.6, -6.5, -2.6, -6.5, 2.6, -7.5, 2.6], GO, { ow: 1.5 });
  const sx = 86;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  glow(ctx, sx, -2, 20 + pulse * 3, GL, 0.4);
  // sun rays
  ctx.save();
  ctx.translate(sx, 0);
  ctx.rotate(t * 0.6);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const r = i % 2 ? 9.5 : 11.5;
    const c = Math.cos(a);
    const s = Math.sin(a);
    poly(ctx, [c * 4 - s * 1.7, s * 4 + c * 1.7, c * r, s * r, c * 4 + s * 1.7, s * 4 - c * 1.7], i % 2 ? '#ffd86a' : GO, OUTLINE, 1.3);
  }
  ctx.restore();
  // socket
  plate(ctx, [74, -3, 80, -3.6, 80, 3.6, 74, 3], '#b08d3c', { ow: 1.8 });
  // crescent blade sweeping over the sun to a forward point
  const crescent = (): void => {
    ctx.beginPath();
    ctx.moveTo(76, -2);
    ctx.quadraticCurveTo(77, -16, 90, -16);
    ctx.quadraticCurveTo(102, -15, 106, 0);
    ctx.quadraticCurveTo(99, -9.5, 90, -10);
    ctx.quadraticCurveTo(82, -10, 80, -1.5);
    ctx.closePath();
  };
  crescent();
  ctx.fillStyle = '#f4d76a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  line(ctx, [76.5, -4, 79, -13.6, 90, -16, 101, -13, 106, 0], '#fff6c8', 2.4);
  line(ctx, [82, -4, 84, -9, 90, -10, 99, -8], '#c8901c', 1.6);
  ctx.restore();
  crescent();
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  blob(ctx, sx, 0, 4.8, 4.8, { fill: GO, under: '#c8901c', outlineW: 1.8 });
  spec(ctx, sx - 1.4, -1.6, 1.1);
  // halo shimmer
  ctx.save();
  ctx.globalAlpha *= 0.35 + 0.35 * pulse;
  ctx.strokeStyle = GL;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(sx, 0, 4.5, 15, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
  const ha = t * 2.4;
  glint(ctx, sx + Math.cos(ha) * 4.5, Math.sin(ha) * 15, 2.2, '#ffffff', 0.8);
  glint(ctx, sx + Math.cos(ha + Math.PI) * 4.5, Math.sin(ha + Math.PI) * 15, 1.6, GL, 0.7);
}

type BaseDraw = (ctx: Ctx, t: number, charge: number) => void;

const BASE: Record<string, BaseDraw> = {
  w_greathammer: (c) => greathammer(c),
  w_greataxe: (c) => greataxe(c),
  w_colossal: (c) => colossal(c),
  w_crossbow: (c, _t, ch) => crossbow(c, ch),
  w_club: (c) => club(c),
  w_daggers: (c) => daggers(c),
  w_rapier: (c) => rapier(c),
  w_katana: (c) => katana(c),
  w_bow: (c, _t, ch) => bow(c, ch),
  w_whip: (c, t) => whip(c, t),
  w_longsword: (c) => longsword(c),
  w_spear: (c, t) => spear(c, t),
  w_battleaxe: (c) => battleaxe(c),
  w_mace: (c) => mace(c),
  w_halberd: (c) => halberd(c),
  w_twinaxes: (c) => twinaxes(c),
  w_hollow_maul: (c, t) => hollowMaul(c, t),
  w_spellblade: (c, t) => spellblade(c, t),
  w_censer: (c, t) => censer(c, t),
  w_dawn_glaive: (c, t) => dawnGlaive(c, t),
  w_fists: (c) => fists(c),
};

/** Every weapon draw id with its own art (anything else draws as fists). */
export const WEAPON_DRAW_IDS: string[] = Object.keys(BASE);

/** Draw a base weapon by draw id, ignoring legendary designs. */
export function drawBaseWeapon(ctx: Ctx, id: string, t = 0, charge = 0): void {
  // a staff or talisman held in the weapon hand (D115) draws as itself
  if (!BASE[id] && id.startsWith('t_')) return drawTool(ctx, id, t);
  (BASE[id] ?? fists)(ctx, t, charge);
}

/**
 * Draw a weapon by draw id. `t` is an animation clock (seconds). A legendary item passes its name: when it
 * has a design (legendaryWeapons.ts) that is drawn instead of the base weapon. `charge` is how long a bow
 * or crossbow shot has been held (seconds), 0 when not charging.
 */
export function drawWeapon(ctx: Ctx, id: string, t = 0, legendaryName?: string, charge = 0): void {
  if (legendaryName && drawLegendaryWeapon(ctx, legendaryName, t, charge)) return;
  drawBaseWeapon(ctx, id, t, charge);
}

/** True for weapons drawn in both hands (second copy in the off hand). */
export function isPairedWeapon(id: string): boolean {
  return id === 'w_daggers' || id === 'w_twinaxes';
}

// ---------------------------------------------------------------------------------------------
// Shields (centered on the off hand, face toward +x)
// ---------------------------------------------------------------------------------------------

function ringOfRivets(ctx: Ctx, r: number, n: number, rr = 0.9): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    rivet(ctx, Math.cos(a) * r, Math.sin(a) * r, rr);
  }
}

export function drawShield(ctx: Ctx, id: string): void {
  switch (id) {
    case 's_buckler':
      blob(ctx, 0, 0, 9, 9, { fill: '#9a8a62' });
      ctx.strokeStyle = '#c9ced6';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 7.2, 0, TAU);
      ctx.stroke();
      blob(ctx, 0, 0, 3.6, 3.6, { fill: '#c9ced6', outlineW: 1.8 });
      spec(ctx, -1.2, -1.4, 1);
      spec(ctx, -3, -5, 1.2, 0.5);
      break;
    case 's_targe':
      blob(ctx, 0, 0, 11, 11, { fill: '#7a4a2a' });
      ringOfRivets(ctx, 8.2, 10, 0.9);
      ctx.strokeStyle = '#5a3018';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 5.8, 0, TAU);
      ctx.stroke();
      blob(ctx, 0, 0, 4, 4, { fill: '#c9b98a', outlineW: 2 });
      plate(ctx, [0, -3.5, 1.2, 0, 0, 3.5, -1.2, 0], '#efe6d2', { ow: 1, under: null });
      spec(ctx, -1.4, -1.6, 1);
      break;
    case 's_round':
      blob(ctx, 0, 0, 13, 13, { fill: '#8a5a32' });
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, TAU);
      ctx.clip();
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let x = -8; x <= 8; x += 4) {
        ctx.moveTo(x, -13);
        ctx.lineTo(x, 13);
      }
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = '#a8aeb8';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ringOfRivets(ctx, 11, 8, 0.8);
      blob(ctx, 0, 0, 4.2, 4.2, { fill: '#a8aeb8', outlineW: 2 });
      spec(ctx, -1.4, -1.6, 1.1);
      break;
    case 's_kite':
      plate(ctx, [-10, -14, 10, -14, 11, 2, 0, 18, -11, 2], '#4a6aa0', { splitY: 2 });
      ctx.save();
      trace(ctx, [-10, -14, 10, -14, 11, 2, 0, 18, -11, 2]);
      ctx.clip();
      ctx.fillStyle = '#e6b84a';
      ctx.fillRect(-2, -14, 4, 32);
      ctx.fillRect(-11, -6, 22, 3.6);
      ctx.restore();
      line(ctx, [-8, -12, 8, -12, 9, 1.5, 0, 15.5, -9, 1.5, -8, -12], '#c9ced6', 1, 0.8);
      dot(ctx, 0, -4.2, 2.2, '#e6b84a');
      dot(ctx, 0, -4.2, 1, '#fff3b0');
      spec(ctx, -6, -10, 1.2);
      break;
    case 's_heater':
      plate(ctx, [-12, -12, 12, -12, 12, 2, 0, 16, -12, 2], '#a03030', { splitY: 3 });
      ctx.save();
      trace(ctx, [-12, -12, 12, -12, 12, 2, 0, 16, -12, 2]);
      ctx.clip();
      poly(ctx, [-13, 6, 0, -5, 13, 6, 13, 10, 0, -1, -13, 10], '#efe6d2', OUTLINE, 1.2);
      ctx.restore();
      line(ctx, [-10, -10, 10, -10, 10, 1.5, 0, 13.6, -10, 1.5, -10, -10], '#d4af37', 1, 0.9);
      spec(ctx, -7, -8, 1.2);
      break;
    case 's_tower':
      plate(ctx, [-12, -19, -8, -23, 8, -23, 12, -19, 12, 22, -12, 22], '#7a7f88', { splitY: 6 });
      plate(ctx, [-8.5, -18, 8.5, -18, 8.5, 18.5, -8.5, 18.5], '#8a909a', { ow: 1.5 });
      line(ctx, [0, -21, 0, 20.5], '#a9afb8', 2);
      line(ctx, [0.6, -21, 0.6, 20.5], '#5a5f68', 0.8);
      for (const y of [-20, -6, 8, 20]) {
        rivet(ctx, -10, y, 0.9);
        rivet(ctx, 10, y, 0.9);
      }
      spec(ctx, -6, -15, 1.2);
      break;
    case 's_spiked':
      for (let i = -16; i <= 16; i += 8) plate(ctx, [12, i - 3, 21, i, 12, i + 3], '#c9ced6', { ow: 1.5, edge: [12, i - 3, 21, i], edgeW: 0.6 });
      plate(ctx, [-12, -19, -8, -23, 8, -23, 12, -19, 12, 22, -12, 22], '#5a5f68', { splitY: 6 });
      plate(ctx, [-7, -15, 7, -15, 7, 15, -7, 15], '#4a4e56', { ow: 1.5 });
      blob(ctx, 0, 0, 5, 5, { fill: '#8a909a', outlineW: 2 });
      plate(ctx, [-2, -2, 2, -2, 0, 3], '#c9ced6', { ow: 1 });
      for (const y of [-19, 19]) {
        rivet(ctx, -9, y, 0.9);
        rivet(ctx, 9, y, 0.9);
      }
      spec(ctx, -1.6, -2, 1);
      break;
    case 's_bulwark':
      glow(ctx, 0, 0, 30, '#fff3b0', 0.4);
      plate(ctx, [-13, -22, 13, -22, 13, 18, 0, 26, -13, 18], '#efe6d2', { splitY: 8, under: '#d8ccb0' });
      line(ctx, [-10.5, -19.5, 10.5, -19.5, 10.5, 16.5, 0, 23, -10.5, 16.5, -10.5, -19.5], '#d4af37', 1.4);
      plate(ctx, [-2.4, -16, 2.4, -16, 2.4, -7, 9, -7, 9, -2.6, 2.4, -2.6, 2.4, 17, -2.4, 17, -2.4, -2.6, -9, -2.6, -9, -7, -2.4, -7], '#d4af37', { ow: 1.5, under: null });
      dot(ctx, 0, -4.8, 2, '#fff3b0');
      glint(ctx, 0, -4.8, 4, '#ffffff', 0.8);
      spec(ctx, -8, -17, 1.2);
      break;
    default:
      blob(ctx, 0, 0, 12, 12, { fill: '#8a7a5a' });
  }
}

// ---------------------------------------------------------------------------------------------
// Casting tools (staffs point along +x; talismans hang from the hand)
// ---------------------------------------------------------------------------------------------

export function drawTool(ctx: Ctx, id: string, t: number): void {
  const isStaff = id.startsWith('t_staff') || id === 't_rod';
  if (isStaff) {
    const color =
      id === 't_staff_void' ? '#9b5bff' : id === 't_staff_storm' ? '#ffe14a' : id === 't_staff_arcane' ? '#5fd3c0' : id === 't_rod' ? '#2aa198' : '#8fd3ff';
    const pulse = Math.sin(t * 4);
    if (id === 't_rod') {
      haft(ctx, -10, 42, 4, '#b08d3c');
      band(ctx, 8, 2, 6, '#e0c070');
      band(ctx, 30, 2, 6, '#e0c070');
      plate(ctx, [40, -2.5, 44, -7, 47, -2, 47, 2, 44, 7, 40, 2.5], '#d4af37', { ow: 1.8 });
    } else {
      haft(ctx, -10, 42, 4, WOOD);
      grip(ctx, 2, 12, 4.4, LEATHER);
      if (id === 't_staff_void') {
        cord(ctx, [41, -1, 45, -7, 50, -8, 54, -5], '#4a3a5a', 1.6, 1);
        cord(ctx, [41, 1, 45, 7, 50, 8, 54, 5], '#4a3a5a', 1.6, 1);
      } else if (id === 't_staff_storm') {
        cord(ctx, [41, -1, 46, -6, 52, -6.5], IRON, 1.6, 1);
        cord(ctx, [41, 1, 46, 6, 52, 6.5], IRON, 1.6, 1);
      } else {
        cord(ctx, [40, -1.5, 44, -6, 50, -6.5, 53, -3], WOOD, 2, 1);
        cord(ctx, [40, 1.5, 44, 6, 50, 6.5, 53, 3], WOOD, 2, 1);
      }
      band(ctx, 40, 2.4, 6, '#8a6a3a');
    }
    glow(ctx, 48, 0, 16 + pulse * 2, color, 0.6);
    if (id === 't_staff_arcane' || id === 't_rod') plate(ctx, [48, -6.5, 52, 0, 48, 6.5, 44, 0], color, { ow: 1.8, edge: [44, 0, 48, -6.5, 52, 0], edgeColor: '#ffffff', edgeW: 0.6 });
    else blob(ctx, 48, 0, 6, 6, { fill: color, outlineW: 2 });
    spec(ctx, 46.6, -2, 1.2);
    glint(ctx, 48, 0, 3 + pulse, '#ffffff', 0.5 + pulse * 0.3);
  } else {
    const color = id === 't_talisman_silver' ? '#d8dde4' : id === 't_talisman_sun' ? '#ffd27a' : id === 't_relic' ? '#efe6d2' : '#9a6a3a';
    line(ctx, [0, 0, 8, 0], OUTLINE, 3.2);
    line(ctx, [0, 0, 8, 0], '#c9a85a', 1.2);
    glow(ctx, 9, 0, 14 + Math.sin(t * 3) * 1.5, '#fff3b0', 0.35);
    if (id === 't_talisman_sun') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        poly(ctx, [9 + Math.cos(a - 0.38) * 4.5, Math.sin(a - 0.38) * 4.5, 9 + Math.cos(a) * 10.5, Math.sin(a) * 10.5, 9 + Math.cos(a + 0.38) * 4.5, Math.sin(a + 0.38) * 4.5], '#f0c43c', OUTLINE, 1);
      }
      blob(ctx, 9, 0, 5.5, 5.5, { fill: color, outlineW: 1.8 });
    } else if (id === 't_relic') {
      plate(ctx, [4, -6, 14, -6, 15, -4, 15, 4, 14, 6, 4, 6, 3, 4, 3, -4], '#d4af37', { ow: 1.8 });
      plate(ctx, [5.5, -3.6, 12.5, -3.6, 12.5, 3.6, 5.5, 3.6], '#3a2a40', { ow: 1, under: null });
      limb(ctx, 6.5, 0, 11.5, 0, 1.8, color);
    } else {
      plate(ctx, [9, -8, 17, 0, 9, 8, 1, 0], color, { ow: 2, edge: [1, 0, 9, -8, 17, 0], edgeW: 0.6 });
      plate(ctx, [9, -3.5, 12.5, 0, 9, 3.5, 5.5, 0], id === 't_talisman_silver' ? '#9ad0ff' : '#c9a85a', { ow: 1.2, under: null });
    }
    spec(ctx, 7, -2.5, 1);
  }
}
