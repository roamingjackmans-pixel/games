// D388: legendary weapon designs, part C (merged into legendaryWeapons.ts DESIGNS): the Cestus and the Rune Kris.
// Same local space as weapons.ts (grip at the origin, along +x). Imported values from ./weapons are only used inside
// functions (this module is evaluated while weapons.ts and legendaryWeapons.ts are still loading).
import { OUTLINE, blob, glow, limb, poly, spec } from './parts';
import type { Design } from './legendaryWeapons';
import { GOLD, STEEL, cord, disc, dot, drift, glint, grip, line, plate, pommel, rivet, trace, worldUp } from './weapons';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

function frac(x: number): number {
  return x - Math.floor(x);
}

/** 0..1 sine pulse. */
function pulse(t: number, speed = 3, phase = 0): number {
  return 0.5 + 0.5 * Math.sin(t * speed + phase);
}

function clipDo(ctx: Ctx, pts: readonly number[], fn: () => void): void {
  ctx.save();
  trace(ctx, pts);
  ctx.clip();
  fn();
  ctx.restore();
}

function outlineOf(ctx: Ctx, pts: readonly number[], w = 2): void {
  trace(ctx, pts);
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number, alpha = 1): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, rot = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `bold ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, 0, 0);
  ctx.restore();
}

/** A hexagon's points round (x, y). */
function hexPts(x: number, y: number, r: number, rot = 0): number[] {
  const pts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * TAU;
    pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  return pts;
}

// ---------------------------------------------------------------------------------------------
// Cestus parts (the hand is drawn over the origin; the gauntlet reaches about 22 px)
// ---------------------------------------------------------------------------------------------

const CUFF = [-11, -5.2, -3, -5.9, -3, 5.9, -11, 5.2];
const PAD = [1.5, -6.6, 9, -7.8, 9, 7.8, 1.5, 6.6];
const BAR = [8, -9.2, 13, -9.6, 15, -7.2, 15, 7.2, 13, 9.6, 8, 9.2];
const KNUCKLES = [-6.3, -2.1, 2.1, 6.3];

/** A slice of bread side on, from x0 to x1, crust round the edge. */
function bread(ctx: Ctx, x0: number, x1: number): void {
  const pts = [x0, -8, x0 + 0.9, -8.9, x1 - 0.9, -8.9, x1, -8, x1, 8, x1 - 0.9, 8.9, x0 + 0.9, 8.9, x0, 8];
  plate(ctx, pts, '#f2dca0', { ow: 0, under: '#e4c880' });
  clipDo(ctx, pts, () => line(ctx, [...pts, pts[0]!, pts[1]!], '#b8763a', 2.4));
  outlineOf(ctx, pts, 1.8);
  dot(ctx, (x0 + x1) / 2, -3, 0.5, '#d8b878');
  dot(ctx, (x0 + x1) / 2 + 0.6, 2.6, 0.45, '#d8b878');
}

/** Knuckle Sandwich: the gauntlet is a sandwich, layers and all, with a toothpick-and-olive spike. */
function knuckleSandwich(ctx: Ctx, t: number): void {
  // a picnic-cloth cuff
  plate(ctx, CUFF, '#f4ece0', { ow: 0, under: null });
  clipDo(ctx, CUFF, () => {
    ctx.fillStyle = '#c8202a';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) ctx.fillRect(-11 + i * 2, -6 + j * 3, 2, 3);
  });
  outlineOf(ctx, CUFF, 2);
  cord(ctx, [-3.5, -4.4, 3, 4.4], '#c8202a', 1.4, 1);
  cord(ctx, [-3.5, 4.4, 3, -4.4], '#c8202a', 1.4, 1);
  // bread, lettuce, tomato, cheese, bread
  bread(ctx, 1.5, 6.6);
  const lettuce: number[] = [];
  for (let i = 0; i <= 10; i++) lettuce.push(7.3 + (i % 2 ? 1.2 : -0.2) + Math.sin(t * 3 + i) * 0.2, -10 + i * 2);
  cord(ctx, lettuce, '#6ccf4a', 2, 1);
  plate(ctx, [8.6, -8.3, 10.6, -8.3, 10.6, 8.3, 8.6, 8.3], '#e0402a', { ow: 1.4, under: null });
  for (const y of [-5, 0, 5]) dot(ctx, 9.6, y, 0.55, '#ffe08a');
  plate(ctx, [10.6, -9.4, 12, -9.4, 12, 9.4, 10.6, 9.4], '#ffcf3a', { ow: 1.4, under: null });
  poly(ctx, [10.6, 9.2, 12, 9.2, 13.4, 12.4], '#ffcf3a', OUTLINE, 1.2);
  bread(ctx, 12, 16.6);
  for (const y of [-5.6, -2, 1.6, 5.2]) blob(ctx, 16.9, y, 0.5, 0.9, { fill: '#fff4d0', outlineW: 0.6 });
  // the toothpick through the middle, an olive on the end
  line(ctx, [4, 0, 22, 0], OUTLINE, 2.6);
  line(ctx, [4, 0, 22, 0], '#e8d0a0', 1);
  blob(ctx, 19.4, 0, 2.3, 2.1, { fill: '#6a8a2a', outlineW: 1.4 });
  dot(ctx, 20.5, 0, 0.9, '#d83a2a');
  spec(ctx, 18.8, -1, 0.6);
  // crumbs fall (world down)
  const up = worldUp(ctx);
  drift(ctx, 14, 0, t, 4, [-up[0], -up[1]], 14, 9, 0.6, 2, (x, y, k) => dot(ctx, x, y, 0.7, '#c89050', 1 - k));
}

/** Hands Down: the undisputed champion's gauntlet, gold, laurelled, with a winner's rosette and confetti. */
function handsDown(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.4);
  // a royal-blue velvet cuff with gold trim and a first-place rosette
  plate(ctx, CUFF, '#2a4aa8', { ow: 2, under: '#1e3680' });
  line(ctx, [-10.4, -4.4, -3.6, -5], GOLD, 0.9);
  line(ctx, [-10.4, 4.4, -3.6, 5], GOLD, 0.9);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    disc(ctx, -7 + Math.cos(a) * 2.3, -7.4 + Math.sin(a) * 2.3, 1.4, '#3a64d8', 1);
  }
  disc(ctx, -7, -7.4, 1.9, GOLD, 1.2);
  text(ctx, '1', -7, -7.3, 2.8, '#1e3680');
  // a gold gauntlet
  cord(ctx, [-3.5, -4.6, 6, 4.8], '#b8892a', 1.5, 1);
  cord(ctx, [-3.5, 4.6, 6, -4.8], '#b8892a', 1.5, 1);
  plate(ctx, PAD, '#c89a2a', { ow: 2 });
  plate(ctx, BAR, '#e8c454', { edge: [8, -9.2, 13, -9.6, 15, -7.2], edgeColor: '#fff4c0', edgeW: 0.8 });
  for (const y of KNUCKLES) {
    disc(ctx, 15.3, y, 1.7, '#f0d070', 1.4);
    spec(ctx, 14.9, y - 0.6, 0.5);
  }
  // the laurel wreath round the knuckles, its two branches meeting out front
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const a = side * (1.4 - i * 0.24);
      const x = 13.8 + Math.cos(a) * 7.6;
      const y = Math.sin(a) * 9.4;
      const tang = Math.atan2(Math.cos(a) * 9.4 * -side, -Math.sin(a) * 7.6 * -side);
      blob(ctx, x, y, 1.9, 0.95, { fill: i % 2 ? '#6aa84a' : '#4e8a36', outlineW: 1 }, tang + side * 0.5);
    }
  }
  dot(ctx, 21.6, 0, 1.2, '#e8c454');
  glint(ctx, 21.6, 0, 1.4 + p * 1.6, '#ffffff', 0.9);
  // confetti drifting down (world space)
  const up = worldUp(ctx);
  const cols = ['#e8302a', '#ffd23a', '#3ab0e0', '#6ccf4a'];
  drift(ctx, 10, 0, t, 5, [-up[0], -up[1]], 22, 10, 0.5, 8, (x, y, k, i) => {
    ctx.save();
    ctx.globalAlpha *= 1 - k;
    ctx.translate(x, y);
    ctx.rotate(t * 4 + i);
    ctx.fillStyle = cols[i % cols.length]!;
    ctx.fillRect(-0.9, -0.5, 1.8, 1);
    ctx.restore();
  });
}

/** Fist Impressions: a rubber ink stamp worn on the fist; it keeps stamping its knuckle prints out ahead. */
function fistImpressions(ctx: Ctx, t: number): void {
  // a varnished wooden handle for a cuff
  plate(ctx, CUFF, '#8a5a32', { ow: 2 });
  line(ctx, [-10.4, -2, -3.4, -2.4], '#6a4224', 0.7);
  line(ctx, [-10.4, 2, -3.4, 2.4], '#6a4224', 0.7);
  cord(ctx, [-3.5, -4.6, 3, 4.6], '#2a2026', 1.5, 1);
  cord(ctx, [-3.5, 4.6, 3, -4.6], '#2a2026', 1.5, 1);
  // the stamp block with its paper label
  plate(ctx, [1.5, -7.6, 12.5, -8.6, 12.5, 8.6, 1.5, 7.6], '#b07a44', { ow: 2 });
  plate(ctx, [4, -5.4, 9.6, -5.8, 9.6, 5.8, 4, 5.4], '#efe6d2', { ow: 1.2, under: null });
  text(ctx, 'HI!', 6.8, 0, 3.4, '#c8202a', Math.PI / 2);
  // the red rubber face, four inked knuckle pads raised on it
  plate(ctx, [12.5, -9, 15, -9, 15, 9, 12.5, 9], '#c8202a', { ow: 1.8, under: '#9a1820' });
  for (const y of KNUCKLES) {
    blob(ctx, 16.2, y, 1.5, 1.85, { fill: '#e0303a', under: '#a81a24', outlineW: 1.3 });
    spec(ctx, 15.9, y - 0.8, 0.45, 0.9);
  }
  // the impression: four knuckle prints stamped out ahead, fading away before the next
  const k = frac(t * 0.7);
  const a = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
  for (const y of KNUCKLES) {
    ring(ctx, 20.4, y * 1.04, 1.45, 1.8, '#c8202a', 0.9, 0.75 * a);
    dot(ctx, 20.4, y * 1.04, 1.1, '#c8202a', 0.3 * a);
  }
  // an ink drip
  const up = worldUp(ctx);
  drift(ctx, 15.6, 0, t, 2, [-up[0], -up[1]], 12, 8, 0.5, 4, (x, y, kk) => dot(ctx, x, y, 0.8, '#a01820', 1 - kk));
}

/** The Handshake: a suited gauntlet caught mid-deal, someone else's hand clasped round it, pumping. */
function theHandshake(ctx: Ctx, t: number): void {
  const pump = Math.sin(t * 5) * 0.9;
  // a pinstriped suit sleeve, a white shirt cuff and a gold cufflink
  plate(ctx, [-12, -6, -5, -6.6, -5, 6.6, -12, 6], '#2a3450', { ow: 2, under: '#1e2640' });
  for (const y of [-3.6, -1.2, 1.2, 3.6]) line(ctx, [-11.4, y, -5.6, y * 1.08], '#5a6890', 0.4, 0.8);
  plate(ctx, [-5.5, -5.8, -2, -5.8, -2, 5.8, -5.5, 5.8], '#f4f4f0', { ow: 1.6, under: '#d8d8d2' });
  disc(ctx, -3.8, -4.2, 1.2, GOLD, 1);
  // the polished gauntlet underneath
  plate(ctx, PAD, STEEL, { ow: 2 });
  plate(ctx, BAR, '#9aa1ab', { edge: [8, -9.2, 13, -9.6, 15, -7.2], edgeColor: '#eef1f4', edgeW: 0.8 });
  for (const y of KNUCKLES) rivet(ctx, 11, y, 0.9);
  // the other party's hand, shaking ours
  ctx.save();
  ctx.translate(0, pump);
  plate(ctx, [19.4, -6, 22, -6.4, 22, 6.4, 19.4, 6], '#f4f4f0', { ow: 1.6, under: '#d8d8d2' });
  blob(ctx, 16.4, 0.4, 4.4, 6.6, { fill: '#f2d0a0', under: '#d8b080', outlineW: 1.8 });
  // four fingers wrapped back over our knuckles, the thumb across the top
  for (let i = 0; i < 4; i++) {
    const y = -5.4 + i * 3.6;
    const x1 = i === 0 || i === 3 ? 8.6 : 7.4;
    limb(ctx, 15, y, x1, y * 0.94, 2.7, '#f2d0a0');
    dot(ctx, x1 + 0.3, y * 0.94, 0.7, '#fbe6cc');
  }
  limb(ctx, 17.4, -5, 11.6, -8.8, 2.8, '#f2d0a0');
  ctx.restore();
  // it's a deal
  const k = Math.max(0, Math.sin(t * 5));
  glint(ctx, 12, -11.2 + pump, 0.6 + k * 1.8, '#ffffff', 0.4 + k * 0.6);
}

// ---------------------------------------------------------------------------------------------
// Rune Kris parts (a wavy blade from x 9 to 40)
// ---------------------------------------------------------------------------------------------

const KX0 = 9;
const KX1 = 40;

/** The centre line (y) and half width at s ∈ [0, 1] along a kris blade (five waves, a point at s = 1). */
function krisAt(s: number, hw0: number, amp: number): [number, number] {
  const c = amp * Math.sin(s * 5 * Math.PI) * (1 - 0.5 * s);
  const hw = hw0 * (1 - 0.42 * s) * Math.min(1, (1 - s) / 0.2);
  return [c, hw];
}

/** The outline of the part of a kris blade from s0 to s1. */
function krisPart(hw0: number, amp: number, s0 = 0, s1 = 1): number[] {
  const n = 28;
  const top: number[] = [];
  const bot: number[] = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const [c, hw] = krisAt(s, hw0, amp);
    const x = KX0 + (KX1 - KX0) * s;
    top.push(x, c - hw);
    if (hw > 0) bot.unshift(x, c + hw);
  }
  return [...top, ...bot];
}

/** A polyline along the blade at a fraction `k` of the half width (−1 top edge … 1 bottom edge). */
function krisLine(hw0: number, amp: number, k: number, s0: number, s1: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= 18; i++) {
    const s = s0 + ((s1 - s0) * i) / 18;
    const [c, hw] = krisAt(s, hw0, amp);
    pts.push(KX0 + (KX1 - KX0) * s, c + hw * k);
  }
  return pts;
}

function krisX(s: number): number {
  return KX0 + (KX1 - KX0) * s;
}

const GLYPHS: readonly (readonly number[])[] = [
  [-1, -1.2, 0, 1.2, 1, -1.2],
  [0, -1.3, 0, 1.3, 0, 0, 1, -1],
  [-1, 1.2, -1, -1.2, 1, 0, -1, 1.2],
  [-1, -1, 1, 1, 0, 0, -1, 1],
  [0, -1.3, 1, 0, 0, 1.3, -1, 0, 0, -1.3],
];

function rune(ctx: Ctx, i: number, x: number, y: number, s: number, a: number, color: string, glowColor: string): void {
  glow(ctx, x, y, 4 * s, glowColor, 0.2 + 0.45 * a);
  const g = GLYPHS[i % GLYPHS.length]!;
  const pts: number[] = [];
  for (let j = 0; j < g.length; j += 2) pts.push(x + g[j]! * s, y + g[j + 1]! * s);
  line(ctx, pts, color, 0.9, 0.3 + 0.7 * a);
  line(ctx, pts, '#ffffff', 0.4, 0.2 + 0.7 * a);
}

const GANJA = [7, -3.8, 9.6, -7.2, 11.8, -5.4, 10.6, 4, 7.4, 4.6];

/** Curse Word: a bruised-purple kris swearing a blue streak of hot grawlix, a censor bar chasing it, a speech-bubble guard. */
function curseWord(ctx: Ctx, t: number): void {
  const hw0 = 3.9;
  const amp = 1.4;
  pommel(ctx, -6, 2.5, '#c8202a');
  grip(ctx, -4.5, 6, 4, '#2a1a22', '#120a10');
  const pts = krisPart(hw0, amp);
  plate(ctx, pts, '#3a2a44', { ow: 2, under: '#2a1e32' });
  // the grawlix scrolling along it
  const syms = '#@$%&!*';
  const gap = 5.2;
  const pos = t * 6;
  const off = pos % gap;
  const base = Math.floor(pos / gap);
  clipDo(ctx, pts, () => {
    line(ctx, krisLine(hw0, amp, -0.8, 0.01, 0.96), '#8a7aa0', 0.8);
    for (let i = 0; i < 8; i++) {
      const x = KX0 + 2 + i * gap - off;
      const s = (x - KX0) / (KX1 - KX0);
      if (s < 0 || s > 0.9) continue;
      const [c] = krisAt(s, hw0, amp);
      glow(ctx, x, c, 3.4, '#ff5a3a', 0.4);
      text(ctx, syms[(((i - base) % 7) + 7) % 7]!, x, c + 0.2, 4.4, i % 2 ? '#ff6a3a' : '#ffc040');
    }
  });
  // a censor bar sliding along over the worst of it
  const cx = KX0 + 5 + pulse(t, 1.3) * 17;
  const [cc] = krisAt((cx - KX0) / (KX1 - KX0), hw0, amp);
  plate(ctx, [cx - 3.4, cc - 2.6, cx + 3.4, cc - 2.6, cx + 3.4, cc + 2.6, cx - 3.4, cc + 2.6], '#0a080c', { ow: 1, under: null });
  line(ctx, [cx - 2.6, cc - 1.6, cx + 2.6, cc - 1.6], '#ffffff', 0.4, 0.35);
  // the guard: a speech bubble with a shout in it
  poly(ctx, [7.2, 0.6, 9.8, 0.8, 7.4, 4.6], '#f6f2f6', OUTLINE, 1.4);
  blob(ctx, 8.6, -3, 3.2, 4.4, { fill: '#f6f2f6', under: '#dcd6e0', outlineW: 1.6 });
  text(ctx, '!', 8.6, -3, 4.6, '#c8202a');
}

/** Hex Key: a black-oxide Allen key bent into a kris, purple hexes on the blade and a turning hex nut for a guard. */
function hexKey(ctx: Ctx, t: number): void {
  const hw0 = 3.6;
  const amp = 1.3;
  const KEY = '#2c2c34';
  // the short arm, bent at the pommel, with its hex end
  plate(ctx, [-7.6, -1.8, -4.6, -1.8, -4.6, 9, -7.6, 9], KEY, { ow: 1.8, under: null });
  line(ctx, [-6.1, -0.6, -6.1, 8.2], '#5a5a68', 0.8);
  poly(ctx, hexPts(-6.1, 9.4, 1.9, Math.PI / 6), '#3e3e48', OUTLINE, 1.2);
  // the long arm is the grip, in a rubber sleeve
  grip(ctx, -5, 6, 4.2, '#3a3a44', '#1a1a20');
  // the blade
  const pts = krisPart(hw0, amp);
  plate(ctx, pts, '#4a4a56', { ow: 2, under: '#3a3a46' });
  clipDo(ctx, pts, () => {
    line(ctx, krisLine(hw0, amp, -0.82, 0.01, 0.96), '#a8b0c8', 0.9);
    line(ctx, krisLine(hw0, amp, 0, 0.03, 0.9), '#5e5e6c', 0.6);
  });
  // hex sigils (a hex is a curse) turning along it
  for (let i = 0; i < 4; i++) {
    const s = 0.16 + i * 0.18;
    const [c] = krisAt(s, hw0, amp);
    const x = krisX(s);
    const a = pulse(t, 3, -i * 0.9);
    glow(ctx, x, c, 4, '#a050ff', 0.25 + 0.4 * a);
    const h = hexPts(x, c, 1.7 * (1 - s * 0.3), t * (i % 2 ? 1.2 : -1.2));
    line(ctx, [...h, h[0]!, h[1]!], '#c07cff', 0.8, 0.6 + 0.4 * a);
    dot(ctx, x, c, 0.45, '#f0e0ff', a);
  }
  // a brass hex nut threaded on for a guard, slowly turning
  ctx.save();
  ctx.translate(8.6, 0);
  ctx.rotate(t * 0.8);
  plate(ctx, hexPts(0, 0, 5, Math.PI / 6), '#c8a040', { ow: 1.8, under: '#9a7a2a' });
  disc(ctx, 0, 0, 2.2, KEY, 1.4);
  ctx.restore();
  spec(ctx, 7, -3, 0.8);
}

/** Stab in the Dark: a pitch-black kris you only see by its faint rim and flickering runes; something on the guard blinks. */
function stabInTheDark(ctx: Ctx, t: number): void {
  const hw0 = 3.7;
  const amp = 1.4;
  // darkness pooled round it
  for (let i = 0; i < 3; i++) dot(ctx, 14 + i * 9, 0, 7 - i, '#05040a', 0.22);
  // a crescent-moon pommel
  disc(ctx, -6.2, 0, 3, '#e8e4c8', 1.6);
  dot(ctx, -5.1, -0.9, 2.5, '#14111c');
  grip(ctx, -4, 6, 4, '#14111c', '#000000');
  const pts = krisPart(hw0, amp);
  plate(ctx, pts, '#14111c', { ow: 2, under: '#0a0810' });
  clipDo(ctx, pts, () => {
    line(ctx, krisLine(hw0, amp, -0.85, 0.01, 0.97), '#4a5a8a', 0.8);
    line(ctx, krisLine(hw0, amp, 0.85, 0.01, 0.97), '#2a3458', 0.6);
  });
  // runes that only flicker now and then
  for (let i = 0; i < 5; i++) {
    const s = 0.12 + i * 0.15;
    const [c] = krisAt(s, hw0, amp);
    const a = Math.max(0, Math.sin(t * 2.1 - i * 1.3)) ** 2;
    rune(ctx, i, krisX(s), c, 0.7, a, '#5a7aff', '#3a5aff');
  }
  // a black guard with two yellow eyes that blink
  plate(ctx, GANJA, '#1a1622', { ow: 1.8 });
  const b = frac(t * 0.31);
  const open = b < 0.06 ? Math.abs(b - 0.03) / 0.03 : 1;
  for (const [ex, ey] of [
    [9.4, -4.6],
    [9.9, -1.4],
  ] as const) {
    glow(ctx, ex, ey, 3, '#ffd23a', 0.35 * open);
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 0.7 * open + 0.05, 1.1, 0, 0, TAU);
    ctx.fill();
    line(ctx, [ex, ey - 0.7, ex, ey + 0.7], '#000000', 0.4, open);
  }
  // shadow wisps rising off it
  const up = worldUp(ctx);
  drift(ctx, 24, 0, t, 4, up, 16, 12, 0.4, 9, (x, y, k) => dot(ctx, x, y, 1.5 + k * 2.5, '#0a0812', 0.35 * (1 - k)));
}

/** Mind the Gap: a kris snapped in two, the tip floating on a blue spark across the gap; Underground roundel for a guard. */
function mindTheGap(ctx: Ctx, t: number): void {
  const hw0 = 3.7;
  const amp = 1.4;
  const RED = '#e8302a';
  const YEL = '#ffd23a';
  // a moquette grip (tube-seat fabric)
  pommel(ctx, -6, 2.4, RED);
  grip(ctx, -4.5, 6, 4.2, '#2a3a8a', '#18245a');
  const cols = [RED, YEL, '#3ab0e0', RED];
  for (let i = 0; i < 4; i++) dot(ctx, -3.2 + i * 2.6, i % 2 ? 0.9 : -0.9, 0.55, cols[i]!);
  // the near piece, with the yellow platform-edge line
  const s0 = 0.42;
  const s1 = 0.5;
  const near = krisPart(hw0, amp, 0, s0);
  plate(ctx, near, '#c2c8d2', { ow: 2, under: '#9aa1ab' });
  clipDo(ctx, near, () => line(ctx, krisLine(hw0, amp, -0.8, 0.01, s0), YEL, 0.8));
  // the far piece, floating a little off
  const gx = 0.8 + 0.8 * pulse(t, 2.6);
  const gy = Math.sin(t * 2.6) * 0.7;
  const [cn] = krisAt(s0, hw0, amp);
  const [cf] = krisAt(s1, hw0, amp);
  const ax = krisX(s0);
  const bx = krisX(s1) + gx;
  glow(ctx, (ax + bx) / 2, (cn + cf + gy) / 2, 6, '#7cc4ff', 0.5 + 0.3 * pulse(t, 9));
  for (let i = 0; i < 2; i++) {
    const j = Math.sin(t * 23 + i * 2.1) * 1.4;
    line(ctx, [ax, cn - 1 + i * 2, (ax + bx) / 2, (cn + cf + gy) / 2 + j, bx, cf + gy + 1 - i * 2], '#bfe4ff', 0.6, 0.85);
  }
  ctx.save();
  ctx.translate(gx, gy);
  const far = krisPart(hw0, amp, s1, 1);
  plate(ctx, far, '#c2c8d2', { ow: 2, under: '#9aa1ab' });
  clipDo(ctx, far, () => line(ctx, krisLine(hw0, amp, -0.8, s1, 0.97), YEL, 0.8));
  spec(ctx, 30, -1.8, 0.7);
  ctx.restore();
  // the roundel: a red ring with a blue bar across it
  ring(ctx, 7.8, 0, 4.4, 4.4, OUTLINE, 3.8);
  ring(ctx, 7.8, 0, 4.4, 4.4, RED, 2.2);
  plate(ctx, [6.2, -7.6, 9.4, -7.6, 9.4, 7.6, 6.2, 7.6], '#1a3a9a', { ow: 1.5, under: null });
  for (let y = -6; y <= 6; y += 2) line(ctx, [7.8, y - 0.5, 7.8, y + 0.5], '#ffffff', 0.6, 0.85);
}

/** D388: the Cestus and Rune Kris legendaries. */
export const DESIGNS_C: Record<string, Design> = {
  'Knuckle Sandwich': { len: 22, draw: knuckleSandwich },
  'Hands Down': { len: 22, draw: handsDown },
  'Fist Impressions': { len: 22, draw: fistImpressions },
  'The Handshake': { len: 22, draw: theHandshake },
  'Curse Word': { len: 40, draw: curseWord },
  'Hex Key': { len: 40, draw: hexKey },
  'Stab in the Dark': { len: 40, draw: stabInTheDark },
  'Mind the Gap': { len: 42, draw: mindTheGap },
};
