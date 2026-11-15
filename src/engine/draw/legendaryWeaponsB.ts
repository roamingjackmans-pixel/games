// D388: legendary weapon designs, part B (merged into legendaryWeapons.ts DESIGNS): the fourth legendary of the
// Spear, Battleaxe, Mace, Halberd, Twin Axes, Hollow Maul, Spellblade, Censer Flail, Dawn Glaive and Chakram.
// Same local space as legendaryWeapons.ts (grip at the origin, pointing along +x). legendaryWeapons.ts imports
// this file and weapons.ts imports that one, so imported values are only ever touched inside functions.
import type { Design } from './legendaryWeapons';
import { OUTLINE, blob, glow, limb, poly, shade, spec } from './parts';
import { GOLD, IRON, LEATHER, STEEL, WOOD, band, cord, crossguard, dot, drift, flame, glint, grip, haft, hash, line, plate, pommel, rivet, sheen, swordBlade, trace, worldUp } from './weapons';

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

function ring(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, w: number, alpha = 1, a0 = 0, a1 = TAU, rot = 0): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, a0, a1);
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

function heart(ctx: Ctx, x: number, y: number, s: number, color: string, ow = 1.5, alpha = 1, rot = 0): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.7, -s * 1.25, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.7, -s * 1.25, s * 1.4, -s * 0.1, 0, s * 0.9);
  ctx.closePath();
  ctx.restore();
  fillPath(ctx, color, ow, alpha);
}

/** Something hanging from (ax, ay) on a string of length len, swinging (world down). Returns its position. */
function dangle(ctx: Ctx, ax: number, ay: number, len: number, t: number, color = '#efe6d2', speed = 2.2, amp = 0.35): [number, number] {
  const up = worldUp(ctx);
  const a = Math.sin(t * speed) * amp;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x = ax + (-up[0] * c + up[1] * s) * len;
  const y = ay + (-up[0] * s - up[1] * c) * len;
  line(ctx, [ax, ay, x, y], OUTLINE, 2);
  line(ctx, [ax, ay, x, y], color, 0.9);
  return [x, y];
}

/** A symmetric outline from its upper half (butt to tip, the tip last, on y = 0). */
function mirrorHalf(top: readonly number[]): number[] {
  const out = [...top];
  for (let i = top.length - 4; i >= 0; i -= 2) out.push(top[i]!, -top[i + 1]!);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Spear: Point of No Return
// ---------------------------------------------------------------------------------------------

const PNR_TOP = [74, -2, 79.5, -2.2, 76.5, -7.4, 84, -3.4, 88.5, -3.4, 85, -9.6, 92.5, -4.2, 100, 0];

/** A one-way road for a shaft, chevrons all pointing the same way, and a barbed harpoon head: it does not come back out. */
function pointOfNoReturn(ctx: Ctx, t: number): void {
  const p = pulse(t, 3);
  glow(ctx, 96, 0, 14 + p * 3, '#ff5a2a', 0.4);
  limb(ctx, -8, 0, 75, 0, 4.4, '#3a3842');
  clipDo(ctx, [-9, -2.2, 76, -2.2, 76, 2.2, -9, 2.2], () => {
    line(ctx, [-9, -1.55, 76, -1.55], '#e8e8e0', 0.5, 0.8);
    line(ctx, [-9, 1.55, 76, 1.55], '#e8e8e0', 0.5, 0.8);
    const off = frac(t * 1.2) * 7;
    for (let x = -14 + off; x < 76; x += 7) line(ctx, [x, 0, x + 3.6, 0], '#f2c40c', 1);
  });
  grip(ctx, -5, 10, 4.8, '#1e1c22', '#000000');
  plate(ctx, [-11, 0, -7, -2.6, -6, -2.6, -6, 2.6, -7, 2.6], IRON, { ow: 1.5 });
  // chevrons flowing toward the point
  for (let i = 0; i < 4; i++) {
    const k = frac(t * 0.8 + i / 4);
    const x = 32 + k * 32;
    const a = Math.sin(k * Math.PI);
    const ch = [x - 3.2, -4.8, x, 0, x - 3.2, 4.8];
    line(ctx, ch, OUTLINE, 3, a);
    line(ctx, ch, '#ff7a2a', 1.4, a);
  }
  // socket and harpoon head
  plate(ctx, [67, -3.2, 76, -2.4, 76, 2.4, 67, 3.2], IRON, { ow: 1.8 });
  line(ctx, [69, -2.8, 69, 2.8], '#3a3440', 0.8);
  line(ctx, [71, -2.6, 71, 2.6], '#3a3440', 0.8);
  plate(ctx, mirrorHalf(PNR_TOP), STEEL, { ow: 2, splitY: 0.5, edge: PNR_TOP.slice(4), edgeColor: '#f6f8fa', edgeW: 0.8 });
  line(ctx, [76, 0, 96, 0], shade(STEEL, 0.6), 0.9);
  spec(ctx, 90, -2.4, 0.9);
  glint(ctx, 100, 0, 1.4 + p * 1.6, '#ffe0c0', 0.9);
}

// ---------------------------------------------------------------------------------------------
// Battleaxe: Splitting Hairs
// ---------------------------------------------------------------------------------------------

/** A barber's pole for a haft, a comb for a back spike, a straight-razor bit, and one hair being split on its edge. */
function splittingHairs(ctx: Ctx, t: number): void {
  limb(ctx, -7, 0, 54, 0, 5, '#f4f2ee');
  clipDo(ctx, [-8, -2.5, 55, -2.5, 55, 2.5, -8, 2.5], () => {
    const off = frac(t * 0.5) * 9;
    for (let x = -18 + off; x < 58; x += 9) {
      line(ctx, [x, 3, x + 4, -3], '#d42a2a', 2);
      line(ctx, [x + 4.5, 3, x + 8.5, -3], '#2a5ad4', 2);
    }
    line(ctx, [-8, -1.4, 55, -1.4], '#ffffff', 0.7, 0.5);
  });
  grip(ctx, -7, 10, 5.6, '#1e1c22', '#c9ced6');
  band(ctx, 12, 2.5, 7.5, '#c9ced6');
  // the comb, coarse teeth then fine
  for (let x = 44.8; x < 54.5; x += 1.9) {
    const y1 = x < 49.5 ? 12.8 : 10.6;
    line(ctx, [x, 5, x, y1], OUTLINE, 1.6);
    line(ctx, [x, 5, x, y1 - 0.4], '#4a4456', 0.6);
  }
  plate(ctx, [43.5, 3, 55, 3, 55, 6.4, 43.5, 6.4], '#3a3440', { ow: 1.6, under: null });
  line(ctx, [44.5, 4, 54, 4], '#6a6476', 0.6);
  // the razor bit, mirror-polished
  const bit = [45.5, -3, 44.5, -8.5, 34, -12.5, 31, -15, 31.5, -23, 58.5, -25, 59, -18, 56.5, -10, 55, -3];
  plate(ctx, bit, '#e4e8ee', { under: null, edge: [31.5, -23, 58.5, -25], edgeColor: '#ffffff', edgeW: 1.3 });
  clipDo(ctx, bit, () => {
    poly(ctx, [30, -16, 60, -18.5, 60, -15.6, 30, -13.2], '#a2aab6', OUTLINE, 0);
    line(ctx, [32, -21, 58.4, -22.8], '#b8c0ca', 0.7);
  });
  sheen(ctx, bit, t, 30, 60, '#ffffff', 0.55, 2.2, 3);
  rivet(ctx, 37, -15.6, 1.1, '#c9a85a');
  plate(ctx, [42.5, -4.6, 55.5, -4.6, 55.5, 4.6, 42.5, 4.6], '#2a2a30', { ow: 2 });
  rivet(ctx, 46, 0, 1, '#c9ced6');
  rivet(ctx, 52, 0, 1, '#c9ced6');
  // one hair, split down the middle where it meets the edge
  const wv = (x: number, ph: number): number => Math.sin(t * 3 + x * 0.45 + ph) * 0.5;
  const sx = 44;
  const sy = -28.6 + wv(sx, 0);
  const s0: number[] = [];
  for (let x = 23; x < sx; x += 1.5) s0.push(x, -28.6 + wv(x, 0));
  s0.push(sx, sy);
  const s1: number[] = [sx, sy];
  const s2: number[] = [sx, sy];
  for (let i = 1; i <= 10; i++) {
    const x = sx + i * 1.7;
    const d = Math.min(1, i / 4);
    s1.push(x, sy - d * 2.4 + wv(x, 1) * d);
    s2.push(x, sy + d * 1.2 + wv(x, 2) * d);
  }
  for (const s of [s0, s1, s2]) {
    line(ctx, s, OUTLINE, 1.3);
    line(ctx, s, '#8a5a2a', 0.55);
  }
  glint(ctx, sx, sy, 1 + pulse(t, 5) * 1.6, '#ffffff', 0.9);
}

// ---------------------------------------------------------------------------------------------
// Mace: Blunt Truth
// ---------------------------------------------------------------------------------------------

function bubblePath(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(39, -10);
  ctx.lineTo(53, -10);
  ctx.quadraticCurveTo(57.5, -10, 57.5, -5.5);
  ctx.lineTo(57.5, 5.5);
  ctx.quadraticCurveTo(57.5, 10, 53, 10);
  ctx.lineTo(43, 10);
  ctx.lineTo(36, 14.5);
  ctx.lineTo(38, 9.6);
  ctx.quadraticCurveTo(34.5, 9, 34.5, 5.5);
  ctx.lineTo(34.5, -5.5);
  ctx.quadraticCurveTo(34.5, -10, 39, -10);
  ctx.closePath();
}

/** No spikes, no flanges: a solid iron speech bubble that says NO., a flat striking face, and a lie detector that never twitches. */
function bluntTruth(ctx: Ctx, t: number): void {
  haft(ctx, -7, 36, 4.6, '#5d626b');
  grip(ctx, -7, 10, 5.4, '#2a2a30', '#000000');
  pommel(ctx, -8.5, 2.8, '#c9ced6');
  // the polygraph strip: a calm, honest line
  const strip = [12, -2.6, 31, -2.6, 31, 2.6, 12, 2.6];
  plate(ctx, strip, '#f4f0e6', { ow: 1.3, under: null });
  clipDo(ctx, strip, () => {
    for (let x = 14; x < 31; x += 3) line(ctx, [x, -2.6, x, 2.6], '#c8d8e8', 0.4);
    const pts: number[] = [];
    for (let x = 12; x <= 31; x += 0.6) pts.push(x, Math.sin((x - t * 9) * 1.7) * 0.45);
    line(ctx, pts, '#d42a2a', 0.6);
  });
  band(ctx, 33, 3, 7, '#c9ced6');
  // the head
  bubblePath(ctx);
  ctx.fillStyle = '#8a909a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#6a707a';
  ctx.fillRect(30, 4, 32, 14);
  line(ctx, [38.5, -8.6, 53.5, -8.6], '#c4cad2', 1.2);
  ctx.restore();
  bubblePath(ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  plate(ctx, [57, -8, 60.5, -7, 60.5, 7, 57, 8], '#c9ced6', { ow: 1.8 });
  // the word, stamped in with every beat
  const k = frac(t * 0.7);
  const s = k < 0.12 ? 1 + (0.12 - k) * 3 : 1;
  ctx.save();
  ctx.translate(46, 0.4);
  ctx.scale(s, s);
  text(ctx, 'NO.', 0.5, 0.5, 8, OUTLINE);
  text(ctx, 'NO.', 0, 0, 8, '#f4f0e6');
  ctx.restore();
  // impact lines off the face
  for (const y of [-6, 0, 6]) line(ctx, [62.5, y * 1.1, 66.5, y * 1.4], '#f4f0e6', 1, 0.8 * (1 - k));
  spec(ctx, 39, -6.5, 1.3);
}

// ---------------------------------------------------------------------------------------------
// Halberd: Red Tape
// ---------------------------------------------------------------------------------------------

const RT_BIT = [73, -2.5, 72, -7, 69.5, -11, 66, -16.5, 68.5, -21, 76, -23, 84, -22, 89.5, -18.5, 88.5, -11, 87, -7, 86.5, -2.5];
const RT_EDGE = [66, -16.5, 68.5, -21, 76, -23, 84, -22, 89.5, -18.5];

/** Wound in red tape: a manila-folder axe stamped DENIED, a paperclip hook, a fountain-pen spike, a wax seal. */
function redTape(ctx: Ctx, t: number): void {
  haft(ctx, -8, 96, 4.2, '#5a3a22');
  clipDo(ctx, [-8, -2.1, 90, -2.1, 90, 2.1, -8, 2.1], () => {
    for (let x = 28; x < 68; x += 5) line(ctx, [x, 2.4, x + 3.2, -2.4], '#c8202a', 1.8);
  });
  grip(ctx, 25, 11, 4.6, '#3a2418', '#1a0e08');
  plate(ctx, [-11, 0, -7.5, -2.6, -6.5, -2.6, -6.5, 2.6, -7.5, 2.6], IRON, { ow: 1.5 });
  // the loose ends of the tape, fluttering
  const w1 = Math.sin(t * 3.2) * 1.5;
  const w2 = Math.sin(t * 3.2 + 1.2) * 1.5;
  cord(ctx, [65, 1.5, 59, 5 + w1, 53, 6 + w2, 48, 8 + w1], '#c8202a', 1.8, 1);
  cord(ctx, [65, 1.5, 60, 7 + w2, 55, 10 + w1], '#e83a3a', 1.4, 1);
  // a paperclip for the back hook
  cord(ctx, [72, 2.5, 72, 12, 70.5, 13.6, 67.5, 13.6, 66, 12, 66, 5, 67.2, 3.8, 68.4, 5, 68.4, 10.6], '#d6dae0', 1.1, 1);
  // a fountain-pen nib for the spike
  plate(ctx, [87, -3, 94, -3.2, 102, 0, 94, 3.2, 87, 3], GOLD, { ow: 2, under: '#b08a2a', splitY: 0.3 });
  line(ctx, [93.5, 0, 101, 0], OUTLINE, 0.7);
  dot(ctx, 93, 0, 1, OUTLINE);
  line(ctx, [88.5, -2, 94, -2.2], '#fff0b0', 0.6);
  // the axe: a manila folder of forms with a steel edge
  trace(ctx, RT_BIT);
  ctx.fillStyle = '#e8cc90';
  ctx.fill();
  clipDo(ctx, RT_BIT, () => {
    for (let y = -6; y > -19; y -= 2.6) line(ctx, [70, y, 86.5, y], '#a8916a', 0.5);
    line(ctx, RT_EDGE, STEEL, 3.6);
    line(ctx, RT_EDGE, '#ffffff', 1);
  });
  outlineOf(ctx, RT_BIT, 2.5);
  const k = frac(t * 0.45);
  const s = k < 0.1 ? 1.8 - k * 8 : 1;
  ctx.save();
  ctx.translate(78, -12);
  ctx.rotate(-0.28);
  ctx.scale(s, s);
  ctx.globalAlpha *= k < 0.1 ? 0.5 + k * 5 : 1;
  ctx.strokeStyle = '#d42a2a';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-8, -2.6, 16, 5.2);
  text(ctx, 'DENIED', 0, 0.3, 3.8, '#d42a2a');
  ctx.restore();
  // langets, tied up in more tape, sealed
  plate(ctx, [66, -2.8, 88, -2.8, 88, 2.8, 66, 2.8], '#5d626b', { ow: 1.8 });
  line(ctx, [68, 2.8, 71, -2.8], '#c8202a', 1.4);
  line(ctx, [72.5, 2.8, 75.5, -2.8], '#c8202a', 1.4);
  blob(ctx, 82, 0, 3.4, 3.4, { fill: '#a81818', under: '#701010', outlineW: 1.4 });
  ring(ctx, 82, 0, 2, 2, '#e05050', 0.6);
  spec(ctx, 81, -1.4, 0.7);
  spec(ctx, 78, -19.5, 1);
}

// ---------------------------------------------------------------------------------------------
// Twin Axes: Split Decision (each design is one of the pair)
// ---------------------------------------------------------------------------------------------

const TA_BIT = [24.5, -2.6, 23.5, -6, 20.5, -11, 22.5, -14.6, 30, -15, 36.5, -12.6, 34.5, -7, 33.5, -2.6];
const TA_EDGE = [20.5, -11, 22.5, -14.6, 30, -15, 36.5, -12.6];
const SD_CRACK = [29, -2.4, 27.8, -5.4, 30.2, -8.2, 28.4, -11, 30, -13.6, 29.4, -17];
const SD_LEFT = [8, 0, 29, 0, ...SD_CRACK, 29.4, -20, 8, -20];
const SD_RIGHT = [29, 0, 50, 0, 50, -20, 29.4, -20, 29.4, -17, 30, -13.6, 28.4, -11, 30.2, -8.2, 27.8, -5.4, 29, -2.4];

/** A boxing-taped axe whose head is split down the middle, red corner and blue corner, the two halves undecided. */
function splitDecision(ctx: Ctx, t: number): void {
  haft(ctx, -6, 34, 4.4, WOOD);
  grip(ctx, -6, 8, 5, '#f4f4f0', '#b8b8b0');
  band(ctx, 11.5, 2, 6, '#d42a2a');
  band(ctx, 15, 2, 6, '#2a5ad4');
  const g = 0.4 + 1.1 * pulse(t, 2.2);
  const lit = Math.floor(t * 1.5) % 2;
  for (let i = 0; i < 2; i++) {
    const col = i ? '#3a6ad4' : '#d43a3a';
    ctx.save();
    ctx.translate(i ? g / 2 : -g / 2, 0);
    if (lit === i) glow(ctx, i ? 33 : 24.5, -9, 10, col, 0.6);
    clipDo(ctx, i ? SD_RIGHT : SD_LEFT, () => {
      plate(ctx, TA_BIT, col, { under: null, edge: TA_EDGE, edgeColor: '#f4f6f8', edgeW: 1.1 });
      line(ctx, SD_CRACK, OUTLINE, 2.4);
    });
    ctx.restore();
  }
  // sparks in the gap
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 1.7 + i / 3);
    const j = 2 + i * 2;
    glint(ctx, SD_CRACK[j]!, SD_CRACK[j + 1]!, 1.6 * Math.sin(k * Math.PI) * (g - 0.3), '#fff3c0', 0.9);
  }
  plate(ctx, [26, 2.6, 32, 2.6, 30.5, 7.5, 27.5, 7.5], '#aeb4bd', { ow: 1.8 });
  plate(ctx, [23.5, -3.6, 34.5, -3.6, 34.5, 3.6, 23.5, 3.6], '#5d626b', { ow: 1.8 });
  line(ctx, [29, -3.6, 29, 3.6], OUTLINE, 0.8);
  rivet(ctx, 26.2, 0, 0.9);
  rivet(ctx, 31.8, 0, 0.9);
  // the judges' scorecard, swinging
  const [cx, cy] = dangle(ctx, 34, 3, 4.5, t, '#efe6d2', 2.6, 0.4);
  plate(ctx, [cx - 2.4, cy, cx + 2.4, cy, cx + 2.4, cy + 5, cx - 2.4, cy + 5], '#f4f0e6', { ow: 1, under: null });
  line(ctx, [cx - 1.1, cy + 1.3, cx - 1.1, cy + 3.7], '#d42a2a', 1);
  line(ctx, [cx + 1.1, cy + 1.3, cx + 1.1, cy + 3.7], '#2a5ad4', 1);
}

// ---------------------------------------------------------------------------------------------
// Hollow Maul: Nothing Personal (Void)
// ---------------------------------------------------------------------------------------------

function personHole(ctx: Ctx, cx: number): void {
  ctx.beginPath();
  ctx.arc(cx, -3.8, 3.4, 0, TAU);
  ctx.moveTo(cx - 7, 10.5);
  ctx.bezierCurveTo(cx - 7, -2, cx + 7, -2, cx + 7, 10.5);
  ctx.closePath();
}

/** A plain iron block with a person-shaped hole right through it, the void inside; a blank name tag on the haft. */
function nothingPersonal(ctx: Ctx, t: number): void {
  const VG = '#9b5bff';
  haft(ctx, -7, 41, 6, '#2a2631');
  grip(ctx, -7, 12, 6.5, '#3a3448', '#1a1622');
  band(ctx, 15.5, 3, 9, '#5d626b');
  band(ctx, 33, 3, 9, '#5d626b');
  // HELLO, my name is: (blank)
  plate(ctx, [19.5, -5.2, 29.5, -5.2, 29.5, 5.2, 19.5, 5.2], '#f4f2ee', { ow: 1.4, under: null });
  plate(ctx, [19.5, -5.2, 29.5, -5.2, 29.5, -2.2, 19.5, -2.2], '#d42a2a', { ow: 1.4, under: null });
  line(ctx, [21, 3, 28, 3], '#8a8494', 0.5);
  plate(ctx, [38, -4.5, 43, -6, 43, 6, 38, 4.5], '#5d626b', { ow: 1.8 });
  const cx = 54.5;
  const p = pulse(t, 2);
  glow(ctx, cx, 0, 24 + p * 3, VG, 0.38);
  const block = [43, -10, 46.5, -13.5, 62.5, -13.5, 66, -10, 66, 10, 62.5, 13.5, 46.5, 13.5, 43, 10];
  plate(ctx, block, '#4a4656', { under: '#33303d', splitY: 5 });
  line(ctx, [46.5, -12.2, 62.5, -12.2], '#6a6676', 1);
  for (const [x, y] of [
    [46, -10.5],
    [63, -10.5],
    [46, 10.5],
    [63, 10.5],
  ] as const)
    rivet(ctx, x, y, 1, '#8a909a');
  plate(ctx, [65.5, -8, 68.5, -7, 68.5, 7, 65.5, 8], '#5d626b', { ow: 1.8 });
  // the hole: nobody in there, only the void
  personHole(ctx, cx);
  ctx.fillStyle = '#07050c';
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, cx, 2, 10, VG, 0.5 + 0.3 * p);
  ctx.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    ctx.beginPath();
    for (let j = 0; j <= 14; j++) {
      const r = 11 - j * 0.75;
      const a = -t * 1.6 + k * Math.PI + j * 0.36;
      const x = cx + Math.cos(a) * r;
      const y = 2 + Math.sin(a) * r;
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = 'rgba(155,91,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) dot(ctx, cx - 6 + hash(i * 3.3) * 12, -7 + hash(i * 5.1) * 17, 0.6, '#e8e0ff', pulse(t, 3, i * 1.9));
  ctx.restore();
  personHole(ctx, cx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha *= 0.5 + 0.4 * p;
  personHole(ctx, cx);
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#c8a8ff';
  ctx.stroke();
  ctx.restore();
  spec(ctx, 48.5, -10, 1);
  // the void leaks out of the shape of you
  const up = worldUp(ctx);
  drift(ctx, cx, -3, t, 3, up, 8, 16, 0.45, 6, (x, y, k) => dot(ctx, x, y, 1 + k * 1.8, VG, 0.6 * (1 - k)));
}

// ---------------------------------------------------------------------------------------------
// Spellblade: Hex Appeal (Magic)
// ---------------------------------------------------------------------------------------------

function hexPath(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else ctx.moveTo(x + r, y);
  }
  ctx.closePath();
}

/** A blade of glowing blue hexagons in a honeycomb, a heart-cut crystal pommel, a heart gem in the guard, hearts in the air. */
function hexAppeal(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.6);
  glow(ctx, -10, 0, 10 + p * 2, '#7cc4ff', 0.5);
  heart(ctx, -9.6, 0, 4.4, '#7cc4ff', 1.6, 1, -Math.PI / 2);
  heart(ctx, -10.4, -0.4, 2, '#d8f0ff', 0, 0.8, -Math.PI / 2);
  grip(ctx, -5, 7.5, 4, '#1a2a5a', '#ff7ab0');
  const pts = swordBlade(ctx, 11, 64, 7, { color: '#d6e6f8', tip: 10, fuller: null, taper: 0.8 });
  clipDo(ctx, pts, () => {
    ctx.lineJoin = 'round';
    for (let i = 0; i < 17; i++) {
      const x = 14 + i * 2.55;
      const a = pulse(t, 4, -i * 0.55);
      for (const y of i % 2 ? [0, -2.94, 2.94] : [-1.47, 1.47]) {
        hexPath(ctx, x, y, 1.55);
        ctx.fillStyle = `rgba(124,196,255,${(0.2 + 0.6 * a).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = '#3f8cff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      if (a > 0.85) glow(ctx, x, 0, 4, '#7cc4ff', (a - 0.85) * 4);
    }
  });
  line(ctx, [11.8, -2.75, 54, -2.4, 62.4, -0.15], '#f4faff', 0.8);
  sheen(ctx, pts, t, 11, 64, '#bfe4ff', 0.35, 3);
  crossguard(ctx, 9.3, 8.5, 3, '#c8d4e6', 1.8);
  heart(ctx, 9.3, 0, 1.6, '#ff5a9a', 0.9, 1, -Math.PI / 2);
  const up = worldUp(ctx);
  drift(ctx, 40, 0, t, 3, up, 30, 14, 0.45, 7, (x, y, k) => heart(ctx, x, y, 1.3, k < 0.5 ? '#7cc4ff' : '#ff7ab0', 0.7, Math.sin(k * Math.PI) * 0.9));
  glint(ctx, -12, -2, 1.4 + p * 1.4, '#ffffff', 0.9);
}

// ---------------------------------------------------------------------------------------------
// Censer Flail: Hot Take (Fire)
// ---------------------------------------------------------------------------------------------

/** The censer is a microphone on a coiled cable, an ON AIR lamp on the haft, the mic on fire and broadcasting. */
function hotTake(ctx: Ctx, t: number): void {
  haft(ctx, -6, 19, 4.6, '#1e1c22');
  grip(ctx, -6, 9, 5, '#2a2a30', '#000000');
  band(ctx, 10.5, 2, 6, '#c9ced6');
  const on = frac(t * 0.6) < 0.65;
  if (on) glow(ctx, 15, 0, 8, '#ff3b3b', 0.7);
  plate(ctx, [12.3, -2.8, 17.7, -2.8, 17.7, 2.8, 12.3, 2.8], on ? '#ff4a3a' : '#5a1a1a', { ow: 1.2, under: null });
  plate(ctx, [18, -3.4, 22.5, -2.4, 22.5, 2.4, 18, 3.4], '#c9ced6', { ow: 1.8 });
  const th = 0.32 * Math.sin(t * 2.4);
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  // the coiled cable
  const cab: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const s = (i / 24) * 19;
    const w = Math.sin(i * 1.9) * 1.7 * Math.min(1, i / 3);
    cab.push(23 + s * dx - w * dy, s * dy + w * dx);
  }
  cord(ctx, cab, '#4a4854', 1.1, 0.9);
  const cx = 23 + 26 * dx;
  const cy = 26 * dy;
  const up = worldUp(ctx);
  const fl = pulse(t, 9) * 0.5 + pulse(t, 13.1) * 0.5;
  glow(ctx, cx, cy, 20 + fl * 4, '#ff7a1a', 0.45 + fl * 0.15);
  // strong opinions, broadcast forward
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.9 + i / 3);
    const r = 9 + k * 10;
    ring(ctx, cx, cy, r, r, '#ffb03a', 1.4 * (1 - k) + 0.4, 0.8 * (1 - k), th - 0.7, th + 0.7);
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(th);
  plate(ctx, [-11, -2.4, -6, -3.4, -6, 3.4, -11, 2.4], '#2a2a30', { ow: 1.6 });
  blob(ctx, 0, 0, 7.6, 7.6, { fill: '#b8bec8', under: '#8a909a' });
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 6.6, 0, TAU);
  ctx.clip();
  ctx.strokeStyle = '#5d626b';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let d = -14; d <= 14; d += 2.2) {
    ctx.moveTo(d - 8, -8);
    ctx.lineTo(d + 8, 8);
    ctx.moveTo(d + 8, -8);
    ctx.lineTo(d - 8, 8);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(255,122,26,${(0.25 + 0.25 * fl).toFixed(3)})`;
  ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();
  plate(ctx, [-1.4, -7.8, 1.4, -7.8, 1.4, 7.8, -1.4, 7.8], '#2a2a30', { ow: 1.3, under: null });
  spec(ctx, -3, -4, 1.1);
  ctx.restore();
  // on fire, obviously
  const fx = cx + up[0] * 5;
  const fy = cy + up[1] * 5;
  flame(ctx, fx - up[1] * 4, fy + up[0] * 4, 10, 2.8, t, up, 2, '#ff5a1a', '#ffe14a');
  flame(ctx, fx + up[1] * 4, fy - up[0] * 4, 10, 2.8, t, up, 4, '#ff5a1a', '#ffe14a');
  flame(ctx, fx, fy, 17, 4.6, t, up, 1, '#ff7a1a', '#ffd27a');
  drift(ctx, cx, cy, t, 6, up, 14, 22, 0.9, 9, (x, y, k) => dot(ctx, x, y, 1 - k * 0.5, k < 0.5 ? '#ffe14a' : '#ff7a3a', 1 - k));
}

// ---------------------------------------------------------------------------------------------
// Dawn Glaive: First Light (Holy)
// ---------------------------------------------------------------------------------------------

function roosterPath(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(78.5, -2.6);
  ctx.quadraticCurveTo(80.5, -12, 89, -13.6);
  ctx.quadraticCurveTo(97.5, -14.6, 100, -8.6);
  ctx.lineTo(106.5, -1.5);
  ctx.lineTo(98.6, -3.4);
  ctx.quadraticCurveTo(93, -0.6, 88, 2.6);
  ctx.quadraticCurveTo(83, 4, 78.5, 2.8);
  ctx.closePath();
}

/** A golden rooster's head for a blade, its comb the serrated edge and its beak the point, crowing at a sliver of sunrise. */
function firstLight(ctx: Ctx, t: number): void {
  const GO = '#f0c43c';
  haft(ctx, -8, 79, 4.2, '#f4ecd8');
  grip(ctx, 25, 11, 4.6, '#8a6a10', '#4a3808');
  band(ctx, 40, 2, 6, GO);
  band(ctx, 50, 2, 6, GO);
  plate(ctx, [-11, 0, -7.5, -2.6, -6.5, -2.6, -6.5, 2.6, -7.5, 2.6], GO, { ow: 1.5 });
  const p = pulse(t, 2.4);
  // daybreak behind the head
  glow(ctx, 92, -6, 24 + p * 3, '#fff3c0', 0.45);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i + 0.5) * (Math.PI / 7);
    const r1 = 19 + p * 3;
    line(ctx, [90 + Math.cos(a) * 9, 4 + Math.sin(a) * 9, 90 + Math.cos(a) * r1, 4 + Math.sin(a) * r1], '#fff3c0', 1.1, 0.3 + 0.3 * p);
  }
  plate(ctx, [74, -3, 80, -3.6, 80, 3.6, 74, 3], '#b08d3c', { ow: 1.8 });
  // the comb (the cutting edge), then the head over it
  poly(ctx, [83.5, -11.5, 84.5, -17.5, 87.2, -14, 89.2, -20, 91.6, -14.6, 94, -19.4, 95.4, -14.4, 98.6, -16.4, 98.4, -11.5], '#ff5a3a', OUTLINE, 1.6);
  line(ctx, [85, -15.5, 89.2, -18.4, 94, -17.8, 97.6, -15.4], '#ffb08a', 0.7);
  roosterPath(ctx);
  ctx.fillStyle = '#f4d76a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const x = 80.5 + i * 2.6;
    line(ctx, [x, -9 + i * 0.6, x + 3.5, 2], '#d8a830', 0.9);
  }
  poly(ctx, [99.2, -9.4, 107.5, -1.5, 98.6, -3.4], '#fff6d8', OUTLINE, 0);
  line(ctx, [79.5, -6, 83, -11.6, 89, -13.6, 97, -14, 100, -8.6], '#fff6c8', 2.2);
  ctx.restore();
  roosterPath(ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  line(ctx, [99.6, -8.6, 98.6, -3.4], OUTLINE, 0.8);
  line(ctx, [100.4, -5.2, 104.5, -2.8], OUTLINE, 0.6);
  blob(ctx, 97.6, 0.8, 1.8, 2.6, { fill: '#ff5a3a', outlineW: 1.2 });
  dot(ctx, 94, -9.2, 1.5, OUTLINE);
  dot(ctx, 93.6, -9.7, 0.5, '#ffffff');
  // a halo, naturally
  ring(ctx, 91, -23.5, 5.2, 1.6, OUTLINE, 2.6);
  ring(ctx, 91, -23.5, 5.2, 1.6, '#fff3c0', 1.2, 0.7 + 0.3 * p);
  // cock-a-doodle-do
  const k = frac(t * 0.35);
  if (k < 0.35) {
    for (let j = 0; j < 3; j++) {
      const r = 3 + j * 3 + k * 8;
      ring(ctx, 106.5, -1.5, r, r, '#fff6c8', 1, (1 - k / 0.35) * 0.8, -0.6, 0.6);
    }
  }
  const up = worldUp(ctx);
  drift(ctx, 92, -8, t, 4, up, 18, 16, 0.6, 5, (x, y, kk) => glint(ctx, x, y, 1.4 * Math.sin(kk * Math.PI), '#ffffff', 0.9));
}

// ---------------------------------------------------------------------------------------------
// Chakram: Boomerang Theory
// ---------------------------------------------------------------------------------------------

/** Three painted boomerangs locked into a ring round the grip bar, spinning, inside a chalk diagram of the orbit that brings it back. */
function boomerangTheory(ctx: Ctx, t: number): void {
  const cx = 9;
  // the theory, in chalk
  ctx.save();
  ctx.setLineDash([2.4, 2.2]);
  ctx.lineDashOffset = t * 14;
  ring(ctx, cx, 0, 16.5, 15, '#f4f4ec', 0.9, 0.55);
  ctx.restore();
  const a = -t * 0.9;
  const ax = cx + Math.cos(a) * 16.5;
  const ay = Math.sin(a) * 15;
  let ux = Math.sin(a) * 16.5;
  let uy = -Math.cos(a) * 15;
  const l = Math.hypot(ux, uy) || 1;
  ux /= l;
  uy /= l;
  line(ctx, [cx, 0, ax, ay], '#f4f4ec', 0.6, 0.4);
  poly(ctx, [ax + ux * 2.6, ay + uy * 2.6, ax - ux * 1.4 - uy * 1.8, ay - uy * 1.4 + ux * 1.8, ax - ux * 1.4 + uy * 1.8, ay - uy * 1.4 - ux * 1.8], '#f4f4ec', OUTLINE, 0.8);
  // the ring of boomerangs
  ctx.save();
  ctx.translate(cx, 0);
  ctx.rotate(t * 1.1);
  blob(ctx, 0, 0, 8, 8, { fill: '#2a2430', outlineW: 1.4 });
  for (let i = 0; i < 3; i++) {
    const a0 = (i * TAU) / 3;
    const pts: number[] = [];
    const n = 8;
    for (let j = 0; j <= n; j++) {
      const s = -1 + (2 * j) / n;
      const ang = a0 + s * 0.98;
      const r = 10.6 + 2.6 * (1 - Math.abs(s));
      pts.push(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    for (let j = n; j >= 0; j--) {
      const s = -1 + (2 * j) / n;
      const ang = a0 + s * 0.98;
      const r = 7.6 + 1.8 * (1 - Math.abs(s));
      pts.push(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    plate(ctx, pts, i === 1 ? '#d08a40' : '#c47a34', { ow: 1.5, under: null });
    for (const s of [-0.62, 0.62]) {
      const ang = a0 + s * 0.98;
      const r0 = 7.6 + 1.8 * (1 - Math.abs(s)) + 0.5;
      const r1 = 10.6 + 2.6 * (1 - Math.abs(s)) - 0.5;
      line(ctx, [Math.cos(ang) * r0, Math.sin(ang) * r0, Math.cos(ang) * r1, Math.sin(ang) * r1], '#f4e0b0', 1);
    }
    dot(ctx, Math.cos(a0) * 11, Math.sin(a0) * 11, 1, '#d42a2a');
  }
  ctx.restore();
  // the grip bar across the hole
  poly(ctx, [cx - 6.6, -1.6, cx + 6.6, -1.6, cx + 6.6, 1.6, cx - 6.6, 1.6], LEATHER, OUTLINE, 1);
  line(ctx, [cx - 5.6, -0.6, cx + 5.6, -0.6], shade(LEATHER, 1.5), 0.5, 0.6);
  spec(ctx, cx - 6, -7, 0.9);
}

// ---------------------------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------------------------

export const DESIGNS_B: Record<string, Design> = {
  'Point of No Return': { len: 100, draw: pointOfNoReturn },
  'Splitting Hairs': { len: 59, draw: splittingHairs },
  'Blunt Truth': { len: 61, draw: bluntTruth },
  'Red Tape': { len: 102, draw: redTape },
  'Split Decision': { len: 37, draw: splitDecision },
  'Nothing Personal': { len: 68, draw: nothingPersonal },
  'Hex Appeal': { len: 64, draw: hexAppeal },
  'Hot Take': { len: 52, draw: hotTake },
  'First Light': { len: 107, draw: firstLight },
  'Boomerang Theory': { len: 20, draw: boomerangTheory },
};
