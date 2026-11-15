// D388: legendary weapon designs, part A (merged into legendaryWeapons.ts DESIGNS): the fourth legendary of the
// Greathammer, Greataxe, Colossal Sword, Crossbow, Club, Twin Daggers, Rapier, Katana, Bow, Whip and Longsword.
// Same local space as legendaryWeapons.ts (grip at the origin, pointing along +x). legendaryWeapons.ts imports
// this file and this file imports ./weapons, so imported values are only ever used inside functions.
import type { Design } from './legendaryWeapons';
import { OUTLINE, blob, glow, limb, mix, poly, spec } from './parts';
import { GOLD, IRON, STEEL, band, bowString, cord, crossguard, dot, drift, glint, grip, hash, line, plate, pommel, rivet, sheen, swordBlade, trace, worldUp } from './weapons';

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// Small helpers (local copies: legendaryWeapons.ts keeps its own private)
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

/** Fill (and outline) the current path. */
function fillPath(ctx: Ctx, color: string, ow = 2, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.fill();
  if (ow > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = ow;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
  ctx.restore();
}

function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number, alpha = 1, a0 = 0, a1 = TAU): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, a0, a1);
  ctx.stroke();
  ctx.restore();
}

/** A spiky star / comic burst: `points` tips, inner radius `inner` × r. */
function star(ctx: Ctx, x: number, y: number, r: number, color: string, points = 5, inner = 0.45, rot = -Math.PI / 2, ow = 1.2): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points;
    const rr = i % 2 ? r * inner : r;
    if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  fillPath(ctx, color, ow);
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

/** Something hanging from (ax, ay) on a string of length len, swinging (world down). Returns its position. */
function dangle(ctx: Ctx, ax: number, ay: number, len: number, t: number, color: string, speed = 2.2, amp = 0.35): [number, number] {
  const up = worldUp(ctx);
  const a = Math.sin(t * speed) * amp;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = -up[0] * c + up[1] * s;
  const dy = -up[0] * s - up[1] * c;
  const x = ax + dx * len;
  const y = ay + dy * len;
  line(ctx, [ax, ay, x, y], OUTLINE, 2);
  line(ctx, [ax, ay, x, y], color, 0.9);
  return [x, y];
}

/** Rotation that turns local +y into world down (for things hanging, or text standing upright). */
function hangAngle(ctx: Ctx): number {
  const up = worldUp(ctx);
  return Math.atan2(up[0], -up[1]);
}

// ---------------------------------------------------------------------------------------------
// Greathammer: Load-Bearing Wall
// ---------------------------------------------------------------------------------------------

const WALL = [40, -17.5, 64, -17.5, 64, 17.5, 40, 17.5];

function loadBearingWall(ctx: Ctx, t: number): void {
  // a riveted steel I-beam for a haft, hazard tape for a grip
  plate(ctx, [-7, -3.4, 41, -3.4, 41, 3.4, -7, 3.4], '#8a929c', { ow: 2, under: '#6e7680', splitY: 0 });
  line(ctx, [-6, -1.8, 40, -1.8], '#565e68', 0.8);
  line(ctx, [-6, 1.8, 40, 1.8], '#565e68', 0.8);
  line(ctx, [-6, -2.7, 40, -2.7], '#d6dce4', 0.6, 0.8);
  for (let x = 16; x <= 31; x += 5) {
    rivet(ctx, x, -2.6, 0.7);
    rivet(ctx, x, 2.6, 0.7);
  }
  grip(ctx, -7, 12, 6.6, '#f2c40c', '#1a1a1a');
  plate(ctx, [34, -4.8, 41, -4.8, 41, 4.8, 34, 4.8], IRON, { ow: 1.6 });
  rivet(ctx, 37.5, 0, 1);
  // the head: a section of brick wall, courses laid in mortar
  trace(ctx, WALL);
  ctx.fillStyle = '#cfc6b2';
  ctx.fill();
  clipDo(ctx, WALL, () => {
    for (let r = 0; r < 8; r++) {
      const y = -17.5 + r * 4.4;
      const off = r % 2 ? -4 : 0;
      for (let c = 0; c < 5; c++) {
        const x = 40 + off + c * 8;
        const h = hash(r * 5.3 + c * 1.7);
        ctx.fillStyle = h < 0.33 ? '#b0462e' : h < 0.66 ? '#9a3a26' : '#c05436';
        ctx.fillRect(x + 0.5, y + 0.5, 7, 3.4);
        ctx.fillStyle = 'rgba(255,220,190,0.28)';
        ctx.fillRect(x + 0.5, y + 0.5, 7, 0.8);
      }
    }
    ctx.fillStyle = 'rgba(20,8,8,0.2)';
    ctx.fillRect(38, 2, 30, 18);
  });
  outlineOf(ctx, WALL, 2.5);
  // the crack it is holding together, and dust sifting out of it (world down)
  line(ctx, [53, -17.5, 51.2, -13.4, 53.6, -9.6, 51.4, -6.4, 52.4, -4.6], OUTLINE, 1.1);
  line(ctx, [51.2, -13.4, 48.6, -11.8], OUTLINE, 0.8);
  const up = worldUp(ctx);
  drift(ctx, 52, -8, t, 4, [-up[0], -up[1]], 3, 14, 0.55, 3, (x, y, k) => dot(ctx, x, y, 0.85 - k * 0.35, '#e0d8c6', 0.85 * (1 - k)));
  // concrete lintel and sill
  plate(ctx, [38.5, -21.5, 65.5, -21.5, 65.5, -17.5, 38.5, -17.5], '#b2b0a6', { ow: 2, under: null });
  plate(ctx, [38.5, 17.5, 65.5, 17.5, 65.5, 21.5, 38.5, 21.5], '#8e8c84', { ow: 2, under: null });
  line(ctx, [39.5, -20.6, 64.5, -20.6], '#dedcd2', 0.7);
  // DO NOT REMOVE: a hazard plaque, striped round the edge
  const pl = [45.5, -4.6, 58.5, -4.6, 58.5, 4.6, 45.5, 4.6];
  plate(ctx, pl, '#f2c40c', { ow: 1.5, under: null });
  clipDo(ctx, pl, () => {
    for (let x = 41; x < 62; x += 3) line(ctx, [x, 5, x + 5, -5], '#1a1a1a', 1.3);
  });
  plate(ctx, [47.6, -2.9, 56.4, -2.9, 56.4, 2.9, 47.6, 2.9], '#f2c40c', { ow: 0.8, under: null });
  poly(ctx, [52, -2.3, 54.7, 2.1, 49.3, 2.1], '#ffe14a', OUTLINE, 0.8);
  line(ctx, [52, -0.9, 52, 0.5], OUTLINE, 0.7);
  dot(ctx, 52, 1.35, 0.4, OUTLINE);
  sheen(ctx, pl, t, 45, 59, '#ffffff', 0.5, 2.6, 3);
  spec(ctx, 41.5, -19.6, 1);
}

// ---------------------------------------------------------------------------------------------
// Greataxe: Timber!
// ---------------------------------------------------------------------------------------------

const TB_TOP = [44, -3, 42, -8, 38.5, -15, 35, -22, 41, -25.5, 49, -26.8, 57, -25.5, 63, -21, 60, -15, 57.5, -8, 56, -3];
const TB_EDGE = [35, -22, 41, -25.5, 49, -26.8, 57, -25.5, 63, -21];

function timber(ctx: Ctx, t: number): void {
  const up = worldUp(ctx);
  const sway = Math.sin(t * 1.7) * 0.12;
  // a whole birch sapling for a haft, black-flecked bark
  limb(ctx, -7, 0, 62, 0, 6, '#ece6d8');
  for (let i = 0; i < 9; i++) {
    const x = -2 + i * 7 + hash(i * 2.7) * 3;
    const s = i % 2 ? 1 : -1;
    line(ctx, [x, s * 2.9, x + 2.2 + hash(i) * 1.5, s * 1.5], '#2a2a2a', 1.1);
  }
  line(ctx, [-6, -1.5, 61, -1.5], '#ffffff', 0.7, 0.6);
  // a twig still in leaf
  cord(ctx, [26, -2.6, 28.5, -7, 32, -8.6], '#8a6a4a', 1, 1);
  blob(ctx, 34.2, -9.2, 2.8, 1.4, { fill: '#58b858', outlineW: 1.1 }, -0.3 + sway);
  grip(ctx, -7, 12, 6.5, '#5a3a22');
  // the top bit: a crosscut-saw edge (teeth first, the bit covers their roots)
  for (let i = 0; i + 3 < TB_EDGE.length; i += 2) {
    const ax = TB_EDGE[i]!;
    const ay = TB_EDGE[i + 1]!;
    const dx = TB_EDGE[i + 2]! - ax;
    const dy = TB_EDGE[i + 3]! - ay;
    const l = Math.hypot(dx, dy);
    const nx = dy / l;
    const ny = -dx / l;
    const n = Math.max(2, Math.round(l / 3));
    for (let j = 0; j < n; j++) {
      const x0 = ax + (dx * j) / n;
      const y0 = ay + (dy * j) / n;
      const x1 = ax + (dx * (j + 1)) / n;
      const y1 = ay + (dy * (j + 1)) / n;
      poly(ctx, [x0 - nx, y0 - ny, x1 - nx, y1 - ny, (x0 + x1) / 2 + nx * 2.6, (y0 + y1) / 2 + ny * 2.6], '#e6eaee', OUTLINE, 1);
    }
  }
  plate(ctx, TB_TOP, STEEL, { under: null, edge: TB_EDGE, edgeColor: '#f4f6f8', edgeW: 1.2 });
  // a painted pine on it
  poly(ctx, [49, -22.5, 45.4, -17.6, 47.2, -17.6, 44, -12.6, 54, -12.6, 50.8, -17.6, 52.6, -17.6], '#3a8a4a', OUTLINE, 0.9);
  line(ctx, [49, -12.6, 49, -9.6], '#6a4a2a', 1.4);
  // the bottom bit: the stump's growth rings, engraved
  const bot = TB_TOP.map((v, i) => (i % 2 ? -v : v));
  const botEdge = TB_EDGE.map((v, i) => (i % 2 ? -v : v));
  plate(ctx, bot, '#aeb4bd', { under: null, edge: botEdge, edgeColor: '#e6eaee', edgeW: 1.2 });
  clipDo(ctx, bot, () => {
    for (let r = 2.5; r < 14; r += 2.6) ring(ctx, 49, 16 + hash(r) * 0.8, r, r * 0.8, '#7d848f', 0.7);
    dot(ctx, 49, 16, 1, '#7d848f');
  });
  // socket
  plate(ctx, [42, -5, 58, -5, 58, 5, 42, 5], '#5d626b', { ow: 2 });
  rivet(ctx, 46, 0, 1.1);
  rivet(ctx, 54, 0, 1.1);
  // the sapling's crown where the top spike would be, swaying
  for (const [x, y, rx, ry, c] of [
    [63.5, -2.6, 4.2, 3.2, '#3a8a4a'],
    [64, 2.8, 4, 3, '#2f7a40'],
    [68, 0, 3.6, 3.6, '#58b858'],
  ] as const) {
    blob(ctx, x + sway * 4, y, rx, ry, { fill: c, outlineW: 1.6 }, sway);
  }
  // woodchips flying off the saw edge
  drift(ctx, 49, -27, t, 4, [0, -1], 22, 12, 0.8, 5, (x, y, k, i) => {
    ctx.save();
    ctx.globalAlpha *= 1 - k;
    ctx.translate(x, y);
    ctx.rotate(k * 6 + i);
    plate(ctx, [-1.3, -0.6, 1.3, -0.6, 1.3, 0.6, -1.3, 0.6], '#e0bc88', { ow: 0.8, under: null });
    ctx.restore();
  });
  // TIMBER! a comic burst popping up by the crown now and then
  const k = frac(t * 0.33);
  if (k < 0.45) {
    const s = Math.sin((k / 0.45) * Math.PI);
    const bx = 66 + up[0] * 13;
    const by = up[1] * 13;
    star(ctx, bx, by, 6 * s, '#ffe14a', 9, 0.6, -Math.PI / 2 + t, 1.2);
    text(ctx, '!', bx, by + 0.3, 7 * s, '#d42a2a', hangAngle(ctx));
  }
}

// ---------------------------------------------------------------------------------------------
// Colossal Sword: Big Energy
// ---------------------------------------------------------------------------------------------

const BATT = [20, -11, 84, -11, 85.5, -9.5, 85.5, 9.5, 84, 11, 20, 11];

function bigEnergy(ctx: Ctx, t: number): void {
  const p = pulse(t, 5);
  glow(ctx, 55, 0, 36 + p * 4, '#b8ff4a', 0.14 + p * 0.08);
  // a mains plug for a pommel, a power cable for a grip
  cord(ctx, [-13.5, -2, -18, -2], GOLD, 1.4, 1);
  cord(ctx, [-13.5, 2, -18, 2], GOLD, 1.4, 1);
  plate(ctx, [-14, -4.6, -8.5, -4, -8.5, 4, -14, 4.6], '#2a2a30', { ow: 2 });
  line(ctx, [-12.4, -3, -12.4, 3], '#4a4a54', 0.8);
  grip(ctx, -9, 15, 6, '#1e1e24', '#3a3a44');
  // the negative terminal for a guard
  plate(ctx, [14.5, -12.5, 20.5, -12.5, 20.5, 12.5, 14.5, 12.5], '#c9ced6', { ow: 2, under: '#9aa0a8', splitY: 2 });
  line(ctx, [16, -7.5, 19, -7.5], OUTLINE, 1.1);
  spec(ctx, 15.8, -10.6, 0.8);
  // the blade: one enormous battery, copper top
  plate(ctx, BATT, '#26262c', { under: '#18181c', splitY: 3 });
  clipDo(ctx, BATT, () => {
    ctx.fillStyle = '#e08a2a';
    ctx.fillRect(64, -12, 24, 24);
    ctx.fillStyle = '#b8681a';
    ctx.fillRect(64, 3, 24, 9);
    line(ctx, [64, -12, 64, 12], OUTLINE, 1.4);
    line(ctx, [21, -8.6, 84, -8.6], '#ffffff', 1, 0.3);
  });
  outlineOf(ctx, BATT, 2.5);
  // the charge meter, filling up, over and over
  const lvl = Math.floor(frac(t * 0.45) * 6);
  for (let i = 0; i < 5; i++) {
    const x = 26 + i * 7.2;
    const on = i < lvl;
    const c = on ? (i < 2 ? '#58d66a' : i < 4 ? '#b8ff4a' : '#ffe14a') : '#3a3a44';
    plate(ctx, [x, -4, x + 5.6, -4, x + 5.6, 4, x, 4], c, { ow: 1, under: null });
    if (on) glow(ctx, x + 2.8, 0, 5, c, 0.35);
  }
  // a lightning emblem and a plus on the copper
  poly(ctx, [77.5, -7.5, 70.5, 1, 74.6, 1, 71.6, 7.8, 80, -1.6, 75.8, -1.6, 79.2, -7.5], '#ffe14a', OUTLINE, 1.2);
  line(ctx, [66.4, -6.4, 69.6, -6.4], OUTLINE, 1);
  line(ctx, [68, -8, 68, -4.8], OUTLINE, 1);
  sheen(ctx, BATT, t, 20, 86, '#ffffff', 0.2, 2.2, 5);
  // the positive terminal at the tip, sparking
  plate(ctx, [85.5, -4.5, 89.5, -4.5, 91, -3, 91, 3, 89.5, 4.5, 85.5, 4.5], '#c9ced6', { ow: 1.8 });
  const seg = Math.floor(t * 12);
  glow(ctx, 91, 0, 8 + p * 5, '#d8ff8a', 0.6);
  for (let i = 0; i < 4; i++) {
    const a = (hash(i + seg * 3.3) - 0.5) * 2.6;
    const r = 3 + hash(i * 2 + seg) * 4;
    const mx = 91 + Math.cos(a) * r * 0.5 + (hash(i * 5 + seg) - 0.5) * 2;
    const my = Math.sin(a) * r * 0.5 + (hash(i * 7 + seg) - 0.5) * 2;
    line(ctx, [91, 0, mx, my, 91 + Math.cos(a) * r, Math.sin(a) * r], '#f4ffd0', 0.7);
  }
  // arcs crackling along the long edges
  for (const s of [-1, 1]) {
    if (hash(seg * 1.31 + s * 7) < 0.35) continue;
    const pts: number[] = [];
    for (let i = 0; i <= 10; i++) pts.push(22 + i * 6.3, s * (11.2 + hash(i * 3.1 + seg * 1.7 + s) * 3.4));
    line(ctx, pts, '#b8ff4a', 2.4, 0.3 + 0.35 * p);
    line(ctx, pts, '#f4ffd0', 0.8, 0.85);
  }
  const up = worldUp(ctx);
  drift(ctx, 55, 0, t, 5, up, 50, 18, 0.7, 4, (x, y, k) => dot(ctx, x, y, 0.9 - k * 0.4, k < 0.5 ? '#f4ffd0' : '#b8ff4a', 1 - k));
}

// ---------------------------------------------------------------------------------------------
// Crossbow: Bolt From the Blue
// ---------------------------------------------------------------------------------------------

const XB_STOCK = [-9, -4.5, -3, -3.2, 30, -3.2, 47, -2.4, 47, 2.4, 30, 3.2, -3, 3.2, -9, 4.5];

/** A crossbow prod (bow arms) round (cx, 0). Returns its lower tip as [x, y] (the upper is [x, −y]). */
function prod(ctx: Ctx, cx: number, r: number, color: string, a = 1.2, w = 3): [number, number] {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + 3;
  ctx.beginPath();
  ctx.arc(cx, 0, r, -a, a);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = mix(color, '#ffffff', 0.45);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, 0, r + w * 0.25, -a * 0.9, a * 0.9);
  ctx.stroke();
  ctx.restore();
  return [cx + Math.cos(a) * r, Math.sin(a) * r];
}

function boltFromTheBlue(ctx: Ctx, t: number, charge: number): void {
  const p = pulse(t, 7);
  // a clear-sky stock with clouds drifting along it
  plate(ctx, XB_STOCK, '#5aa8e8', { ow: 2.5, under: '#3a86cc', splitY: 1 });
  clipDo(ctx, XB_STOCK, () => {
    for (let i = 0; i < 4; i++) {
      const x = frac(i / 4 + t * 0.06) * 64 - 12;
      const y = i % 2 ? 0.8 : -0.8;
      dot(ctx, x, y, 2.1, '#ffffff', 0.9);
      dot(ctx, x + 2.4, y - 0.8, 1.7, '#ffffff', 0.9);
      dot(ctx, x - 2.2, y + 0.4, 1.4, '#ffffff', 0.9);
    }
  });
  outlineOf(ctx, XB_STOCK, 2.5);
  line(ctx, [7, 3.5, 6, 7, 8.5, 7.5], OUTLINE, 2.5);
  line(ctx, [7, 3.5, 6, 7, 8.5, 7.5], IRON, 1);
  // a storm-cloud prod
  const [ex, ey] = prod(ctx, 30, 18, '#4a5468');
  for (const s of [-1, 1]) {
    blob(ctx, ex - 1.6, s * (ey - 1), 3.2, 2.5, { fill: '#7a8498', under: '#5a6478', outlineW: 1.4 });
    blob(ctx, ex + 1.6, s * (ey + 0.4), 2.6, 2.1, { fill: '#8a94a8', under: '#5a6478', outlineW: 1.4 });
  }
  const back = 14 - Math.min(3, charge * 6);
  line(ctx, [ex, -ey, back, 0, ex, ey], '#e8f4ff', 1);
  plate(ctx, [41, -4.6, 46, -4.6, 46, 4.6, 41, 4.6], '#e8f4ff', { ow: 1.5, under: '#bcd4ec', splitY: 1 });
  // the bolt is a bolt
  const zz = [back, 0, back + 7, -2, back + 13, 1.8, back + 20, -1.8, back + 26, 1.4, 48, 0];
  for (let i = 2; i < zz.length; i += 4) glow(ctx, zz[i]!, zz[i + 1]!, 6 + p * 2, '#7cc4ff', 0.4);
  line(ctx, zz, OUTLINE, 4.4);
  line(ctx, zz, '#ffe14a', 2.4);
  line(ctx, zz, '#ffffff', 0.8);
  poly(ctx, [47, -3.4, 55, 0, 47, 3.4, 48.6, 0], '#ffe14a', OUTLINE, 1.4);
  poly(ctx, [back + 1, 0, back + 5, -2.6, back + 6, 0], '#ffffff', OUTLINE, 1);
  poly(ctx, [back + 1, 0, back + 5, 2.6, back + 6, 0], '#ffffff', OUTLINE, 1);
  // crackling at the head
  const seg = Math.floor(t * 10);
  glow(ctx, 55, 0, 7 + p * 3, '#bfe4ff', 0.6);
  for (let i = 0; i < 3; i++) {
    const a = (hash(i + seg * 2.3) - 0.5) * 2.6;
    const r = 3 + hash(i * 5 + seg) * 4;
    line(ctx, [55, 0, 55 + Math.cos(a + 0.4) * r * 0.5, Math.sin(a + 0.4) * r * 0.5, 55 + Math.cos(a) * r, Math.sin(a) * r], '#bfe4ff', 0.7);
  }
}

// ---------------------------------------------------------------------------------------------
// Club: Club Membership
// ---------------------------------------------------------------------------------------------

function driverHead(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(44.5, -3.2);
  ctx.bezierCurveTo(47, -9.5, 56.5, -9.5, 57.5, -2);
  ctx.bezierCurveTo(58.5, 5.5, 55, 11, 48.5, 10.6);
  ctx.bezierCurveTo(43.5, 10.2, 42.5, 4, 44.5, -3.2);
  ctx.closePath();
}

function clubMembership(ctx: Ctx, t: number): void {
  // a rubber golf grip and end cap
  grip(ctx, -7, 12, 5.4, '#2a2a2e', '#111114');
  blob(ctx, -7.6, 0, 1.8, 3, { fill: '#2a2a2e', outlineW: 1.6 });
  // a graphite shaft with a gold ferrule
  limb(ctx, 12, 0, 46, 0, 3.4, '#3a404a');
  line(ctx, [13, -0.7, 45, -0.6], '#8a96a8', 0.7, 0.8);
  band(ctx, 13, 2.2, 5.4, GOLD);
  plate(ctx, [42, -2.2, 46, -2.6, 47.5, 0, 46, 2.6, 42, 2.2], '#8a919c', { ow: 1.6 });
  // the driver head: navy titanium crown, a grooved silver face
  driverHead(ctx);
  ctx.fillStyle = '#22306a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#16204a';
  ctx.fillRect(40, 4, 20, 10);
  ctx.fillStyle = '#c9ced6';
  ctx.beginPath();
  ctx.ellipse(60, 1.5, 5, 11, 0, 0, TAU);
  ctx.fill();
  for (let y = -5; y <= 8; y += 2.2) line(ctx, [55.5, y, 58.5, y], '#7c838e', 0.5);
  line(ctx, [47, -6.4, 53.5, -6.8], '#6a7ab8', 1, 0.8);
  ctx.restore();
  driverHead(ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  star(ctx, 50, 1.5, 2.6, GOLD, 5, 0.45, -Math.PI / 2, 0.9);
  glint(ctx, 48.5, -5.4, 1.2 + pulse(t, 4) * 1.6, '#ffffff', 0.9);
  // the gold membership card on a bag-tag loop
  const [cx, cy] = dangle(ctx, 16, 2.6, 6, t, GOLD, 2, 0.3);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(hangAngle(ctx) + Math.sin(t * 2) * 0.3);
  const card = [-3.6, 0, 3.6, 0, 3.6, 4.8, -3.6, 4.8];
  plate(ctx, card, '#e8c04a', { ow: 1.1, under: null });
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-3.6, 1, 7.2, 1.1);
  plate(ctx, [-2.8, 2.8, -1.2, 2.8, -1.2, 4, -2.8, 4], '#c8a040', { ow: 0.5, under: null });
  line(ctx, [0, 3.4, 2.6, 3.4], '#8a6a1a', 0.5);
  sheen(ctx, card, t, -3.6, 3.6, '#ffffff', 0.7, 1.8, 1.6);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Twin Daggers: Backstabbers (one of the pair)
// ---------------------------------------------------------------------------------------------

function backstabbers(ctx: Ctx, t: number): void {
  // half a "best friends" charm, the other half long gone
  const [hx, hy] = dangle(ctx, -5.6, 1.6, 5, t, '#c9ced6', 2.4, 0.4);
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(hangAngle(ctx) + Math.sin(t * 2.4) * 0.4);
  const s = 2.8;
  const cy = s * 0.55;
  ctx.beginPath();
  ctx.moveTo(0, cy + s * 0.9);
  ctx.bezierCurveTo(-s * 1.4, cy - s * 0.1, -s * 0.7, cy - s * 1.25, 0, cy - s * 0.45);
  ctx.lineTo(0.7, cy - s * 0.1);
  ctx.lineTo(-0.4, cy + s * 0.25);
  ctx.lineTo(0.6, cy + s * 0.6);
  ctx.closePath();
  fillPath(ctx, '#f0c84a', 1.1);
  ctx.restore();
  pommel(ctx, -5.4, 2.6, '#6a5a7a');
  grip(ctx, -4.5, 5, 4, '#3a2a4a', '#1a1020');
  // a serrated back: the spine is all teeth
  const blade: number[] = [7, -3.4];
  for (let i = 0; i < 6; i++) {
    const x = 8.6 + i * 2.3;
    blade.push(x, -3.3, x + 1.15, -5.1);
  }
  blade.push(22.4, -3.3, 31, 0, 22, 3.2, 7, 3.6);
  plate(ctx, blade, '#a8bcb2', { under: '#7e9489', splitY: 0.6 });
  line(ctx, [8, 2.7, 22, 2.4, 29.6, 0.3], '#eefff4', 0.8);
  // shifty eyes, glancing over its shoulder
  const look = Math.sin(t * 1.8) > 0 ? 0.55 : -0.55;
  for (const x of [13.2, 17.2]) {
    dot(ctx, x, 0.4, 1.3, '#ffffff');
    ring(ctx, x, 0.4, 1.3, 1.3, OUTLINE, 0.6);
    dot(ctx, x + look, 0.55, 0.6, OUTLINE);
    line(ctx, [x - 1.4, -1.7, x + 1.3, -1], OUTLINE, 0.6);
  }
  crossguard(ctx, 6.4, 5.5, 2.4, '#6a5a7a', -1.4);
  // poison, dripping (world down)
  const up = worldUp(ctx);
  drift(ctx, 30, 0, t, 2, [-up[0], -up[1]], 0.5, 9, 0.55, 4, (x, y, k) => dot(ctx, x, y, 1 - k * 0.3, '#7ad84a', 1 - k));
  glint(ctx, 30.5, 0, 0.8 + pulse(t, 5) * 1.4, '#c8ffb0', 0.9);
}

// ---------------------------------------------------------------------------------------------
// Rapier: Touché
// ---------------------------------------------------------------------------------------------

function touche(ctx: Ctx, t: number): void {
  // a swept knuckle bow, then the grip
  cord(ctx, [-5.5, -1.8, -1.5, -6.6, 3.5, -7.6, 6.8, -6], '#c9ced6', 1.2, 1);
  pommel(ctx, -6.5, 2.6, '#c9ced6');
  grip(ctx, -5, 4.5, 3.6, '#f4f0e6', '#a8aeb8');
  // a needle-thin blade
  swordBlade(ctx, 7, 56, 3.2, { color: '#dfe4ea', tip: 1.5, fuller: null, taper: 0.9, ow: 1.8 });
  // ending in a white-gloved hand, pointing: touché
  const jab = Math.pow(Math.max(0, Math.sin(t * 3)), 4) * 1.6;
  ctx.save();
  ctx.translate(jab, 0);
  plate(ctx, [53.4, -3.4, 56.6, -3.7, 56.6, 3.7, 53.4, 3.4], '#e4e0d6', { ow: 1.4, under: null });
  blob(ctx, 58.8, -3.3, 2, 1.1, { fill: '#ffffff', under: '#e4e0d6', outlineW: 1.1 }, -0.5);
  limb(ctx, 60.4, -1.4, 66.8, -1.4, 2.4, '#ffffff');
  blob(ctx, 59.2, 0.4, 3.1, 3.4, { fill: '#ffffff', under: '#e4e0d6', outlineW: 1.4 });
  for (const y of [0.9, 2.5]) blob(ctx, 61.8, y, 1.4, 1, { fill: '#ffffff', under: '#e4e0d6', outlineW: 0.9 });
  line(ctx, [57.4, -1, 60, -1], '#b8b4aa', 0.5);
  line(ctx, [57.4, 0.6, 60, 0.6], '#b8b4aa', 0.5);
  line(ctx, [57.4, 2.2, 60, 2.2], '#b8b4aa', 0.5);
  ctx.restore();
  // the touch: a ring of contact off the fingertip
  const k = frac(t * 0.9);
  ring(ctx, 67.6 + jab, -1.4, 1 + k * 5, 1 + k * 5, '#ffd27a', 1.2 * (1 - k) + 0.3, 1 - k);
  glint(ctx, 67.6 + jab, -1.4, 1 + pulse(t, 6) * 1.6, '#ffffff', 0.9);
  // a tricolour cockade for a guard
  blob(ctx, 7, 0, 2.6, 7, { fill: '#2a4ab8', outlineW: 1.8 });
  blob(ctx, 7, 0, 1.8, 4.8, { fill: '#f4f4f4', under: '#d8d8e0', outlineW: 0.8 });
  blob(ctx, 7, 0, 1.1, 2.6, { fill: '#d42a2a', outlineW: 0.8 });
  spec(ctx, 6.4, -4.6, 0.8);
}

// ---------------------------------------------------------------------------------------------
// Katana: Paper Thin
// ---------------------------------------------------------------------------------------------

function kPath(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(12, -2.8);
  ctx.quadraticCurveTo(40, -6.5, 63, -10.5);
  ctx.quadraticCurveTo(62, -6, 57.5, -4);
  ctx.quadraticCurveTo(38, 2.4, 12, 3);
  ctx.closePath();
}

function qb(a: number, b: number, c: number, s: number): number {
  const u = 1 - s;
  return u * u * a + 2 * u * s * b + s * s * c;
}

/** A point across the katana blade: s along (0 hilt → 1 tip), k across (0 spine → 1 edge). */
function kAt(s: number, k: number): [number, number] {
  const xt = qb(12, 40, 63, s);
  const yt = qb(-2.8, -6.5, -10.5, s);
  const xb = qb(12, 38, 57.5, s);
  const yb = qb(3, 2.4, -4, s);
  return [xt + (xb - xt) * k, yt + (yb - yt) * k];
}

/** A polyline through blade coordinates [s, k]. */
function kLine(ctx: Ctx, pts: readonly (readonly [number, number])[], color: string, w: number, alpha = 1): void {
  const flat: number[] = [];
  for (const [s, k] of pts) flat.push(...kAt(s, k));
  line(ctx, flat, color, w, alpha);
}

function paperThin(ctx: Ctx, t: number): void {
  // tsuka: black cord over washi, a red cap
  limb(ctx, -9, 0, 8, 0, 4.6, '#26242a');
  ctx.fillStyle = '#f6f1e4';
  for (let x = -7.5; x < 6; x += 3.2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 1.6, -1.5);
    ctx.lineTo(x + 3.2, 0);
    ctx.lineTo(x + 1.6, 1.5);
    ctx.closePath();
    ctx.fill();
  }
  plate(ctx, [-11.5, -2.8, -9, -2.8, -9, 2.8, -11.5, 2.8], '#c8202a', { ow: 1.5 });
  // a blade of folded paper that, every few seconds, turns edge-on and all but vanishes
  const ph = frac(t * 0.22);
  const sq = ph > 0.84 ? Math.max(0.07, Math.abs(Math.cos(((ph - 0.84) / 0.16) * Math.PI))) : 1;
  const a = Math.atan2(-10.5, 51);
  ctx.save();
  ctx.translate(12, 0);
  ctx.rotate(a);
  ctx.scale(1, sq);
  ctx.rotate(-a);
  ctx.translate(-12, 0);
  kPath(ctx);
  ctx.fillStyle = '#f6f1e4';
  ctx.fill();
  ctx.save();
  ctx.clip();
  // the edge half a shade darker, paper fibres, fold creases
  ctx.fillStyle = '#e6dcc6';
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const [x, y] = kAt(i / 12, 0.55);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.lineTo(70, 10);
  ctx.lineTo(10, 10);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const s = 0.05 + hash(i * 3.7) * 0.88;
    const k = 0.15 + hash(i * 1.9) * 0.7;
    kLine(ctx, [
      [s, k],
      [s + 0.04, k + 0.06],
    ], '#cfc4aa', 0.4);
  }
  for (const s of [0.27, 0.52, 0.77]) {
    kLine(ctx, [
      [s, 0],
      [s + 0.05, 1],
    ], '#c8bea6', 0.7);
    kLine(ctx, [
      [s + 0.012, 0],
      [s + 0.062, 1],
    ], '#ffffff', 0.5, 0.8);
  }
  // sumi-ink brush strokes
  const INK = '#1e1a1e';
  kLine(ctx, [
    [0.16, 0.22],
    [0.21, 0.5],
    [0.19, 0.78],
  ], INK, 1.5);
  kLine(ctx, [
    [0.32, 0.36],
    [0.47, 0.3],
  ], INK, 1.3);
  kLine(ctx, [
    [0.36, 0.6],
    [0.44, 0.66],
  ], INK, 0.9);
  kLine(ctx, [
    [0.6, 0.2],
    [0.63, 0.55],
    [0.69, 0.72],
  ], INK, 1.1);
  // the red hanko seal
  const [hx, hy] = kAt(0.07, 0.5);
  plate(ctx, [hx - 1.3, hy - 1.3, hx + 1.3, hy - 1.3, hx + 1.3, hy + 1.3, hx - 1.3, hy + 1.3], '#c8202a', { ow: 0.6, under: null });
  line(ctx, [hx - 0.6, hy - 0.5, hx + 0.6, hy - 0.5], '#ffe8e0', 0.4);
  line(ctx, [hx, hy - 0.5, hx, hy + 0.7], '#ffe8e0', 0.4);
  ctx.restore();
  kPath(ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  // edge-on: just a gleaming line
  if (sq < 0.6) {
    const g = 1 - sq / 0.6;
    line(ctx, [13, -0.3, 62.5, -10.3], '#ffffff', 1.3, g);
    glint(ctx, 62.5, -10.4, 3.5 * g, '#ffffff', g);
  }
  // a folded paper fan for a tsuba, red and white panels
  const R = 7.5;
  const a0 = Math.PI - 0.95;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const b0 = a0 + (i * 1.9) / n;
    const b1 = a0 + ((i + 1) * 1.9) / n;
    poly(ctx, [12.5, 0, 12.5 + Math.cos(b0) * R, Math.sin(b0) * R, 12.5 + Math.cos(b1) * R, Math.sin(b1) * R], i % 2 ? '#c8202a' : '#f6f1e4', OUTLINE, 0.6);
  }
  ctx.beginPath();
  ctx.moveTo(12.5, 0);
  ctx.arc(12.5, 0, R, a0, a0 + 1.9);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  plate(ctx, [11, -3, 14, -3.2, 14, 3.2, 11, 3], '#e8e0c8', { ow: 1.5 });
  // paper flakes drifting off
  const up = worldUp(ctx);
  drift(ctx, 38, -4, t, 3, up, 26, 14, 0.3, 6, (x, y, k, i) => {
    ctx.save();
    ctx.globalAlpha *= Math.sin(k * Math.PI);
    ctx.translate(x, y);
    ctx.rotate(t * 2 + i);
    plate(ctx, [-1, -1, 1, -1, 1, 1, -1, 1], '#f6f1e4', { ow: 0.6, under: null });
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------------------------
// Bow: Arrow Minded (bow geometry: an arc round (−6, 0), radius 26, tips at (2.2, ±24.7), grip at x ≈ 20)
// ---------------------------------------------------------------------------------------------

function signLimbs(ctx: Ctx, w = 3.6): void {
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
  ctx.strokeStyle = '#f2c40c';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(-6, 0, 26, -1.25, 1.25);
  ctx.stroke();
  // black hazard bands along the limbs
  ctx.lineCap = 'butt';
  ctx.setLineDash([2.4, 2.4]);
  ctx.strokeStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-6, 0, 26, -1.25, 1.25);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fff3a0';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-6, 0, 26.9, -1.15, 1.15);
  ctx.stroke();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = w * 0.8;
  ctx.beginPath();
  ctx.moveTo(2.2, -24.7);
  ctx.quadraticCurveTo(2.6, -27.6, 6, -28.2);
  ctx.moveTo(2.2, 24.7);
  ctx.quadraticCurveTo(2.6, 27.6, 6, 28.2);
  ctx.stroke();
  ctx.restore();
}

function arrowMinded(ctx: Ctx, t: number, charge: number): void {
  signLimbs(ctx);
  // the tips are arrows too, all pointing the one way it knows
  for (const s of [-1, 1]) poly(ctx, [6, s * 28.2 - 2.4, 10.6, s * 28.2, 6, s * 28.2 + 2.4], '#f2c40c', OUTLINE, 1.1);
  // blinkers either side of the grip
  for (const s of [-1, 1]) {
    poly(ctx, [21.6, s * 4.4, 31, s * 8.6, 31.6, s * 6.2, 22.6, s * 2.8], '#3a2418', OUTLINE, 1.4);
    line(ctx, [23, s * 3.9, 30.4, s * 7.4], '#6a4a32', 0.6);
    dot(ctx, 23.2, s * 3.6, 0.8, GOLD);
  }
  // a one-way sign for a grip
  plate(ctx, [16.6, -5.6, 23.6, -5.6, 23.6, 5.6, 16.6, 5.6], '#2a5ac8', { ow: 1.5, under: null });
  poly(ctx, [17.4, -1, 20.4, -1, 20.4, -2.9, 23, 0, 20.4, 2.9, 20.4, 1, 17.4, 1], '#ffffff', OUTLINE, 0.6);
  bowString(ctx, charge);
  // chevrons marching forward: this way, only this way
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.8 + i / 3);
    const x = 30 + k * 26;
    const al = Math.sin(k * Math.PI);
    line(ctx, [x - 2.4, -3.2, x, 0, x - 2.4, 3.2], OUTLINE, 2.6, al);
    line(ctx, [x - 2.4, -3.2, x, 0, x - 2.4, 3.2], '#f2c40c', 1.2, al);
  }
}

// ---------------------------------------------------------------------------------------------
// Whip: Crack of Dawn
// ---------------------------------------------------------------------------------------------

function crackOfDawn(ctx: Ctx, t: number): void {
  // rooster tail feathers for a tassel
  const sw = Math.sin(t * 2.2) * 0.15;
  for (const [c, a, L] of [
    ['#1a3a6a', 0.55, 5.8],
    ['#2a6a5a', -0.55, 6.4],
    ['#ff7a1a', 0.2, 6.8],
    ['#c8202a', -0.15, 7.4],
  ] as const) {
    const ang = Math.PI + a + sw;
    blob(ctx, -3 + Math.cos(ang) * L * 0.55, Math.sin(ang) * L * 0.55, L * 0.55, 1.4, { fill: c, outlineW: 1.1 }, ang);
  }
  pommel(ctx, -1.5, 3, '#f0c84a');
  // a night-sky grip, stars still out
  grip(ctx, 0, 10, 5, '#1a2a5a', '#0a1030');
  for (const [x, y] of [
    [2.6, -1],
    [5.4, 1],
    [8, -0.8],
  ] as const) {
    dot(ctx, x, y, 0.45, '#ffffff', 0.5 + 0.5 * Math.sin(t * 4 + x));
  }
  band(ctx, 10.5, 2, 5.6, GOLD);
  // the lash: night at the handle, dawn at the tip
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
    ctx.strokeStyle = i < 4 ? mix('#2a2a6a', '#c8508a', i / 4) : mix('#c8508a', '#ffc040', (i - 4) / 4);
    ctx.lineWidth = 2.8 - i * 0.24;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    ctx.moveTo(mx - 1, my - 1);
    ctx.lineTo(mx + 1, my + 1);
    ctx.stroke();
  }
  ctx.restore();
  // the sun coming up at the cracker
  const ex = pts[16]! + 2.5;
  const ey = pts[17]!;
  const p = pulse(t, 3);
  glow(ctx, ex, ey, 14 + p * 4, '#ffb040', 0.55);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(t * 0.8);
  for (let i = 0; i < 10; i++) {
    const a = (i * TAU) / 10;
    const r = i % 2 ? 5.6 : 7.4 + p;
    const ray = [Math.cos(a) * 3.8, Math.sin(a) * 3.8, Math.cos(a) * r, Math.sin(a) * r];
    line(ctx, ray, OUTLINE, 2.4);
    line(ctx, ray, '#ffd27a', 1.1);
  }
  ctx.restore();
  blob(ctx, ex, ey, 3.6, 3.6, { fill: '#ffc83a', under: '#ff8a1a', outlineW: 1.6 });
  spec(ctx, ex - 1.2, ey - 1.2, 0.8);
  // crack! a flash every so often
  const k = frac(t * 0.7);
  if (k < 0.18) {
    const s = Math.sin((k / 0.18) * Math.PI);
    glint(ctx, ex, ey, 10 * s, '#ffffff', s);
    for (let i = 0; i < 3; i++) {
      const a = -0.9 + i * 0.9;
      const r = 7 + 5 * s;
      line(ctx, [ex + Math.cos(a) * 5, ey + Math.sin(a) * 5, ex + Math.cos(a + 0.15) * (r - 2), ey + Math.sin(a + 0.15) * (r - 2), ex + Math.cos(a) * r, ey + Math.sin(a) * r], '#ffffff', 0.8, s);
    }
  }
  // golden motes rising off the lash
  const up = worldUp(ctx);
  drift(ctx, 46, 0, t, 4, up, 26, 14, 0.5, 2, (x, y, kk) => dot(ctx, x, y, 0.8, '#ffd27a', Math.sin(kk * Math.PI)));
}

// ---------------------------------------------------------------------------------------------
// Longsword: Main Character
// ---------------------------------------------------------------------------------------------

function mainCharacter(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.4);
  // the spotlight is always on it
  glow(ctx, 38, 0, 36 + p * 3, '#fff3c8', 0.16 + p * 0.06);
  // a red scarf knotted at the hilt, streaming dramatically
  for (const [ph, yo, n] of [
    [1.3, 4.6, 6],
    [0, 3, 7],
  ] as const) {
    const top: number[] = [];
    const bot: number[] = [];
    for (let i = 0; i <= n; i++) {
      const x = 5.5 - i * 3.3;
      const y = yo + i * 1.3 + Math.sin(t * 6 - i * 0.9 + ph) * (0.3 + i * 0.35);
      const hw = 1.5 - i * 0.08;
      top.push(x, y - hw);
      bot.unshift(x, y + hw);
    }
    plate(ctx, [...top, ...bot], ph ? '#a81c1c' : '#d42a2a', { ow: 1.5, under: null });
    line(ctx, top, '#ff6a5a', 0.6, 0.8);
  }
  pommel(ctx, -8.2, 3.6, GOLD);
  dot(ctx, -8.2, 0, 1.5, '#3f8cff');
  grip(ctx, -6, 7.5, 4.6, '#1a1a2a', '#c8202a');
  blob(ctx, 5.4, 2.6, 2, 1.7, { fill: '#d42a2a', outlineW: 1.3 });
  // a hero's blade a size too big, its edges glowing with resolve
  const pts = swordBlade(ctx, 11, 66, 10, { tip: 12, taper: 0.9, color: '#e4e8f0', fuller: '#3a5ab8', fullerLen: 0.7 });
  clipDo(ctx, pts, () => line(ctx, pts, '#7cc4ff', 2.6, 0.35 + 0.45 * p));
  outlineOf(ctx, pts, 2.5);
  star(ctx, 20, 0, 2.4, '#ffe14a', 5, 0.45, -Math.PI / 2, 0.8);
  sheen(ctx, pts, t, 11, 66, '#ffffff', 0.4, 2.2, 3.5);
  // a winged, spiky guard with a red gem
  plate(ctx, [7, -3.5, 6, -10, 8.5, -8, 9, -15.5, 11.5, -10, 14, -13, 13.5, -3.5, 13.5, 3.5, 14, 13, 11.5, 10, 9, 15.5, 8.5, 8, 6, 10, 7, 3.5], GOLD, { ow: 2, under: '#b08a2a', splitY: 0 });
  blob(ctx, 10.4, 0, 2.3, 3.1, { fill: '#d42a2a', outlineW: 1.4 });
  spec(ctx, 9.8, -1.2, 0.8);
  // anime sparkles, never in the same place twice
  for (let i = 0; i < 3; i++) {
    const u = t * 0.5 + i / 3;
    const k = frac(u);
    const c = Math.floor(u);
    const s = Math.sin(k * Math.PI);
    glint(ctx, 22 + hash(i * 3.3 + c * 1.7) * 40, (hash(i * 7.1 + c * 2.9) - 0.5) * 16, 3.2 * s, '#ffffff', s);
  }
}

// ---------------------------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------------------------

export const DESIGNS_A: Record<string, Design> = {
  'Load-Bearing Wall': { len: 64, draw: loadBearingWall },
  'Timber!': { len: 66, draw: timber },
  'Big Energy': { len: 90, draw: bigEnergy },
  'Bolt From the Blue': { len: 54, draw: boltFromTheBlue },
  'Club Membership': { len: 56, draw: clubMembership },
  Backstabbers: { len: 31, draw: backstabbers },
  'Touché': { len: 66, draw: touche },
  'Paper Thin': { len: 62, draw: paperThin },
  'Arrow Minded': { len: 22, bow: true, draw: arrowMinded },
  'Crack of Dawn': { len: 60, draw: crackOfDawn },
  'Main Character': { len: 66, draw: mainCharacter },
};
