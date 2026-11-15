// D388: base art for the Cestus, Rune Kris, Hex Hammer and Harvest Sickle (same local space as weapons.ts: the grip
// at the origin, the weapon along +x). Imported values from ./weapons are only ever used inside functions (weapons.ts
// imports this module, so they are not ready while it is first evaluated).
import { OUTLINE, blob, glow, shade, spec } from './parts';
import type { BaseDraw } from './weapons';
import { BRASS, IRON, LEATHER, STEEL, WOOD, band, cord, dot, drift, glint, grip, haft, line, plate, pommel, rivet, sheen, trace, worldUp } from './weapons';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// Cestus: a studded iron-and-leather fighting gauntlet worn over the fist (the hand is drawn over the origin)
// ---------------------------------------------------------------------------------------------

function cestus(ctx: Ctx): void {
  // the wrist cuff behind the fist, two straps and a brass buckle
  plate(ctx, [-11, -5.2, -3, -5.9, -3, 5.9, -11, 5.2], LEATHER, { ow: 2 });
  line(ctx, [-8.6, -5.1, -8.6, 5.1], shade(LEATHER, 0.55), 1.3);
  line(ctx, [-5.6, -5.5, -5.6, 5.5], shade(LEATHER, 0.55), 1.3);
  line(ctx, [-10.4, -3.6, -3.6, -4.2], shade(LEATHER, 1.5), 0.7, 0.6);
  plate(ctx, [-9.6, -7.4, -6.6, -7.4, -6.6, -4.6, -9.6, -4.6], BRASS, { ow: 1.2, under: null });
  dot(ctx, -8.1, -6, 0.7, OUTLINE);
  // crossed straps over the back of the hand
  cord(ctx, [-3.5, -4.6, 6, 4.8], '#6a4428', 1.7, 1);
  cord(ctx, [-3.5, 4.6, 6, -4.8], '#6a4428', 1.7, 1);
  // the padded leather over the fingers
  plate(ctx, [1.5, -6.6, 9, -7.8, 9, 7.8, 1.5, 6.6], '#5a3a24', { ow: 2 });
  line(ctx, [3, -2.3, 8.5, -2.6], '#3a2416', 0.8);
  line(ctx, [3, 2.3, 8.5, 2.6], '#3a2416', 0.8);
  // the iron knuckle bar
  plate(ctx, [8, -9.2, 13, -9.6, 15, -7.2, 15, 7.2, 13, 9.6, 8, 9.2], IRON, { edge: [8, -9.2, 13, -9.6, 15, -7.2], edgeColor: '#c3c8cf', edgeW: 0.8 });
  // a spike on every knuckle, the middle two the longest
  for (const y of [-6.3, -2.1, 2.1, 6.3]) {
    const tip = Math.abs(y) < 3 ? 22 : 19.5;
    plate(ctx, [14.4, y - 2, tip, y, 14.4, y + 2], STEEL, { ow: 1.5, splitY: y, under: '#8e959f' });
    line(ctx, [15.2, y - 1, tip - 1.4, y - 0.15], '#f2f4f7', 0.6, 0.8);
    rivet(ctx, 11, y, 0.9);
  }
  spec(ctx, 10.2, -7.6, 0.9);
}

// ---------------------------------------------------------------------------------------------
// Rune Kris: a wavy dagger with blue runes along its spine
// ---------------------------------------------------------------------------------------------

/** The kris's centre line (y) and half width at s ∈ [0, 1] along the blade (five waves, a point at s = 1). */
function krisAt(s: number, hw0: number, amp: number): [number, number] {
  const c = amp * Math.sin(s * 5 * Math.PI) * (1 - 0.5 * s);
  const hw = hw0 * (1 - 0.42 * s) * Math.min(1, (1 - s) / 0.2);
  return [c, hw];
}

/** The outline of a wavy blade from x0 to x1. */
function krisBlade(x0: number, x1: number, hw0: number, amp: number): number[] {
  const n = 30;
  const top: number[] = [];
  const bot: number[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const [c, hw] = krisAt(s, hw0, amp);
    const x = x0 + (x1 - x0) * s;
    top.push(x, c - hw);
    if (i < n) bot.unshift(x, c + hw);
  }
  return [...top, ...bot];
}

/** A polyline along the blade at a fraction `k` of the half width (−1 top edge … 1 bottom edge). */
function krisLine(x0: number, x1: number, hw0: number, amp: number, k: number, s0: number, s1: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= 20; i++) {
    const s = s0 + ((s1 - s0) * i) / 20;
    const [c, hw] = krisAt(s, hw0, amp);
    pts.push(x0 + (x1 - x0) * s, c + hw * k);
  }
  return pts;
}

const GLYPHS: readonly (readonly number[])[] = [
  [-1, -1.2, 0, 1.2, 1, -1.2],
  [0, -1.3, 0, 1.3, 0, 0, 1, -1],
  [-1, 1.2, -1, -1.2, 1, 0, -1, 1.2],
  [-1, -1, 1, 1, 0, 0, -1, 1],
  [0, -1.3, 1, 0, 0, 1.3, -1, 0, 0, -1.3],
];

function rune(ctx: Ctx, i: number, x: number, y: number, s: number, a: number, color: string, glowColor: string): void {
  glow(ctx, x, y, 4 * s, glowColor, 0.25 + 0.45 * a);
  const g = GLYPHS[i % GLYPHS.length]!;
  const pts: number[] = [];
  for (let j = 0; j < g.length; j += 2) pts.push(x + g[j]! * s, y + g[j + 1]! * s);
  line(ctx, pts, color, 0.9, 0.6 + 0.4 * a);
  line(ctx, pts, '#ffffff', 0.4, 0.3 + 0.6 * a);
}

function runeKris(ctx: Ctx, t: number): void {
  const x0 = 9;
  const x1 = 40;
  const hw0 = 3.7;
  const amp = 1.4;
  // a carved wooden hilt, bent like a pistol grip, with a brass collar
  blob(ctx, -6.2, -0.9, 2.8, 3.3, { fill: '#6a4a2a', outlineW: 1.8 }, -0.4);
  grip(ctx, -4.5, 6, 4, '#3a2618', '#1e140c');
  band(ctx, 6.4, 1.6, 5.4, BRASS);
  // the blade
  const pts = krisBlade(x0, x1, hw0, amp);
  plate(ctx, pts, '#aab3c2', { ow: 2, under: '#8a93a3' });
  // pamor: the folded-steel pattern following the waves, and the bright top edge
  ctx.save();
  trace(ctx, pts);
  ctx.clip();
  for (const k of [-0.55, 0.15, 0.6]) line(ctx, krisLine(x0, x1, hw0, amp, k, 0.04, 0.95), '#6f7889', 0.6, 0.7);
  line(ctx, krisLine(x0, x1, hw0, amp, -0.85, 0.01, 0.97), '#eef2f7', 0.8);
  ctx.restore();
  // glowing runes along the spine
  for (let i = 0; i < 5; i++) {
    const s = 0.12 + i * 0.15;
    const [c] = krisAt(s, hw0, amp);
    rune(ctx, i, x0 + (x1 - x0) * s, c, 0.72, 0.5 + 0.5 * Math.sin(t * 3 - i * 0.8), '#3f8cff', '#7cc4ff');
  }
  sheen(ctx, pts, t, x0, x1, '#bfe4ff', 0.3, 3);
  // the ganja: an asymmetric guard, flared on the edge side
  plate(ctx, [7, -3.8, 9.6, -7.2, 11.8, -5.4, 10.6, 4, 7.4, 4.6], '#5d6470', { ow: 1.8 });
  dot(ctx, 9.6, -4.6, 0.9, '#7cc4ff');
  spec(ctx, 20, -2.4, 0.8);
}

// ---------------------------------------------------------------------------------------------
// Hex Hammer: a one-handed warhammer, dark iron head carved with a glowing void hex
// ---------------------------------------------------------------------------------------------

const HEX_VIOLET = '#b06cff';

/** A carved hexagon sigil at (x, y), radius r, its inner triangle turning with t. */
function hexSigil(ctx: Ctx, x: number, y: number, r: number, t: number, a: number): void {
  glow(ctx, x, y, r * 2.6, HEX_VIOLET, 0.25 + 0.3 * a);
  const hex: number[] = [];
  for (let i = 0; i <= 6; i++) {
    const ang = (i / 6) * TAU + Math.PI / 6;
    hex.push(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
  }
  line(ctx, hex, OUTLINE, 2.4);
  line(ctx, hex, HEX_VIOLET, 1, 0.65 + 0.35 * a);
  const tri: number[] = [];
  for (let i = 0; i <= 3; i++) {
    const ang = (i / 3) * TAU - t * 0.7;
    tri.push(x + Math.cos(ang) * r * 0.55, y + Math.sin(ang) * r * 0.55);
  }
  line(ctx, tri, '#d8b8ff', 0.7, 0.5 + 0.5 * a);
  dot(ctx, x, y, 1.1, '#f0e4ff', 0.6 + 0.4 * a);
}

function hexHammer(ctx: Ctx, t: number): void {
  const a = 0.5 + 0.5 * Math.sin(t * 2.4);
  haft(ctx, -7, 46, 4.8, '#3b3540');
  grip(ctx, -7, 10, 5.4, '#4a4256', '#221e2a');
  pommel(ctx, -8.4, 2.8, '#5d626b');
  band(ctx, 13.5, 2.4, 7, '#5d626b');
  // langets up into the head
  plate(ctx, [35, -3.4, 46, -3.4, 46, 3.4, 35, 3.4], '#4a4f58', { ow: 1.8 });
  rivet(ctx, 39, 0, 0.9);
  // the head: a block with its striking face on the edge side, a beak behind and a short top spike
  plate(ctx, [50, 5, 56, 5, 52.6, 15.5], '#5a5464', { ow: 2, splitY: 99 });
  plate(ctx, [44.5, -14.5, 57.5, -14.5, 57.5, 5.5, 44.5, 5.5], '#4a4552', { under: '#36323d', splitY: 0 });
  plate(ctx, [43, -18.5, 59, -18.5, 57.5, -14, 44.5, -14], '#6a6478', { ow: 2, edge: [43, -18.5, 59, -18.5], edgeColor: '#b4adc4', edgeW: 0.8 });
  plate(ctx, [57.3, -7.2, 61, -4.6, 57.3, -2], '#6a6478', { ow: 1.5, under: null });
  line(ctx, [46, -12.6, 46, 3.6], '#6e6880', 0.7, 0.7);
  hexSigil(ctx, 51, -4.6, 4.3, t, a);
  // a few motes leaking from the sigil, rising in world space
  const up = worldUp(ctx);
  drift(ctx, 51, -4.6, t, 3, up, 6, 12, 0.45, 5, (x, y, k) => dot(ctx, x, y, 0.9 * (1 - k * 0.5), '#d8b8ff', 0.8 * (1 - k)));
  spec(ctx, 55.4, -16.6, 1);
}

// ---------------------------------------------------------------------------------------------
// Harvest Sickle: a wooden handle and a big crescent blade with a faint holy edge
// ---------------------------------------------------------------------------------------------

function sicklePath(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(16, 2.6);
  ctx.quadraticCurveTo(46, 7.5, 47.5, -11);
  ctx.quadraticCurveTo(47.5, -25, 31, -28.5);
  ctx.quadraticCurveTo(41.5, -20.5, 40.5, -11);
  ctx.quadraticCurveTo(39.5, -1.8, 16, -2.4);
  ctx.closePath();
}

function sickle(ctx: Ctx, t: number): void {
  const a = 0.5 + 0.5 * Math.sin(t * 2.2);
  // the handle: turned wood with a knob and a brass ferrule
  haft(ctx, -6, 14, 4.8, WOOD);
  line(ctx, [-3, -2.5, -3, 2.5], shade(WOOD, 0.6), 0.8);
  line(ctx, [1, -2.5, 1, 2.5], shade(WOOD, 0.6), 0.8);
  blob(ctx, -7, 0, 2.8, 3.2, { fill: shade(WOOD, 0.85), outlineW: 1.8 });
  band(ctx, 14.5, 3, 6.2, BRASS);
  // the faint holy shine along the cutting (inner) edge, under the blade
  for (let i = 0; i < 4; i++) {
    const k = i / 3;
    glow(ctx, 22 + k * 16.5, -2.2 - k * k * 10, 5, '#ffe98a', (0.12 + 0.12 * a) * (0.7 + 0.3 * Math.sin(t * 3 + i)));
  }
  glow(ctx, 40.5, -14, 7, '#ffe98a', 0.15 + 0.15 * a);
  // the blade
  sicklePath(ctx);
  ctx.fillStyle = STEEL;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // a darker spine, the bright bevel on the inner edge, and a faint gold-white holy line along it
  line(ctx, [16, 3.4, 30, 3, 42, -2, 47, -12, 45, -21, 38, -26], shade(STEEL, 0.68), 3.2);
  const edge = [16, -2.4, 28, -2.4, 37, -4.6, 40.5, -11, 39.6, -19, 31, -28.5];
  line(ctx, edge, '#f4f6f8', 2.4);
  line(ctx, edge, '#fff2b0', 1, 0.45 + 0.4 * a);
  ctx.restore();
  sicklePath(ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // the tang rivet, and a slow glimmer climbing the edge
  rivet(ctx, 19, 0, 1);
  const k = (((t * 0.35) % 1) + 1) % 1;
  glint(ctx, 24 + k * 16, -2.8 - k * k * 10, 1.8 * Math.sin(k * Math.PI), '#fff6d0', 0.8);
  spec(ctx, 44, -14, 0.9);
}

/** D388: the four new classes' base art (looked up alongside weapons.ts BASE). */
export const HYBRID_BASE: Record<string, BaseDraw> = {
  w_cestus: (c) => cestus(c),
  w_rune_kris: (c, t) => runeKris(c, t),
  w_hex_hammer: (c, t) => hexHammer(c, t),
  w_sickle: (c, t) => sickle(c, t),
};
