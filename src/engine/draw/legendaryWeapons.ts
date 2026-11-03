// Legendary weapon designs: every legendary name (WeaponDef.legendaryNames) gets its own weapon, a riff on
// the joke in its name. Same local space as weapons.ts (grip at the origin, pointing along +x) and roughly the
// length and grip of its class, so swings still read. `t` (seconds) drives glows, particles and shimmer;
// every design also carries a travelling warm legendary glint (#ff9b2e).
import { OUTLINE, blob, glow, limb, poly, shade, spec } from './parts';
import { GOLD, IRON, LEATHER, STEEL, WOOD, band, bowString, cord, crossguard, dot, drift, flame, glint, grip, haft, hash, line, plate, pommel, rivet, runes, sheen, swordBlade, trace, worldUp } from './weapons';

type Ctx = CanvasRenderingContext2D;
type Vec = readonly [number, number];

interface Design {
  /** reach of the art along +x (the legendary glint travels along it) */
  len: number;
  /** bows: the glint travels along the limbs instead */
  bow?: boolean;
  draw: (ctx: Ctx, t: number, charge: number) => void;
}

const TAU = Math.PI * 2;
const LEG = '#ff9b2e';
const LEG_HI = '#ffd27a';

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

/** Mirror a flat point list across the x axis. */
function flipY(pts: readonly number[]): number[] {
  return pts.map((v, i) => (i % 2 ? -v : v));
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

/** A jagged closed outline around (cx, cy). */
function rock(cx: number, cy: number, r: number, n: number, seed: number, jag = 0.25, sy = 1): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = r * (1 - jag / 2 + jag * hash(i * 1.7 + seed));
    pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy);
  }
  return pts;
}

/** Rotate a direction by angle a. */
function rot(v: Vec, a: number): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

/** Something hanging from (ax, ay) on a string of length len, swinging (world down). Returns its position. */
function dangle(ctx: Ctx, ax: number, ay: number, len: number, t: number, color = '#efe6d2', speed = 2.2, amp = 0.35): [number, number] {
  const up = worldUp(ctx);
  const d = rot([-up[0], -up[1]], Math.sin(t * speed) * amp);
  const x = ax + d[0] * len;
  const y = ay + d[1] * len;
  line(ctx, [ax, ay, x, y], OUTLINE, 2);
  line(ctx, [ax, ay, x, y], color, 0.9);
  return [x, y];
}

/** A music note (rises in world space). */
function note(ctx: Ctx, x: number, y: number, a: number, up: Vec, color: string): void {
  dot(ctx, x, y, 1.5, color, a);
  const sx = x + up[1] * -1.3;
  const sy = y + up[0] * 1.3;
  line(ctx, [sx, sy, sx + up[0] * 5, sy + up[1] * 5, sx + up[0] * 3.6 - up[1] * 2, sy + up[1] * 3.6 + up[0] * 2], color, 0.9, a);
}

function prodArc(ctx: Ctx, cx: number, r: number, color: string, a = 1.2, w = 3): [number, number] {
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
  ctx.strokeStyle = shade(color, 1.5);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, 0, r + w * 0.25, -a * 0.9, a * 0.9);
  ctx.stroke();
  ctx.restore();
  return [cx + Math.cos(a) * r, Math.sin(a) * r];
}

function bolt(ctx: Ctx, x0: number, x1: number, y: number, ang: number, shaft: string, head: string, fletch: string): void {
  ctx.save();
  ctx.translate(x0, y);
  ctx.rotate(ang);
  const L = x1 - x0;
  line(ctx, [0, 0, L, 0], OUTLINE, 3.2);
  line(ctx, [0, 0, L, 0], shaft, 1.4);
  plate(ctx, [L - 1, -2.3, L + 6, 0, L - 1, 2.3], head, { ow: 1.4 });
  poly(ctx, [1, 0, 5, -2.6, 6, 0], fletch, OUTLINE, 1);
  poly(ctx, [1, 0, 5, 2.6, 6, 0], fletch, OUTLINE, 1);
  ctx.restore();
}

/** The crossbow stock outline (shared silhouette). */
const XBOW_STOCK = [-9, -4.5, -3, -3.2, 30, -3.2, 47, -2.4, 47, 2.4, 30, 3.2, -3, 3.2, -9, 4.5];
const GA_TOP = [44, -3, 42, -8, 38.5, -15, 35, -22, 41, -25.5, 49, -26.8, 57, -25.5, 63, -21, 60, -15, 57.5, -8, 56, -3];
const GA_EDGE = [35, -22, 41, -25.5, 49, -26.8, 57, -25.5, 63, -21];

// ---------------------------------------------------------------------------------------------
// Greathammer: Landlord's Gavel, Noise Complaint, The Big One
// ---------------------------------------------------------------------------------------------

function landlordsGavel(ctx: Ctx, t: number): void {
  const MAH = '#7a3a22';
  pommel(ctx, -8.5, 3.8, '#8a4a2a');
  haft(ctx, -7, 40, 5.4, '#6a2e1a');
  for (const x of [-2.5, 9, 21]) blob(ctx, x, 0, 1.8, 4, { fill: '#8a4a2a', outlineW: 1.5 });
  band(ctx, 32, 2.4, 7, GOLD);
  // the barrel head of a judge's gavel, across the haft, with flared striking ends
  const head = [42, -17, 60, -17, 60, 17, 42, 17];
  plate(ctx, head, MAH, { under: '#5a2614', splitY: 3, edge: [42, -17, 42, 17], edgeColor: '#a05a34', edgeW: 1 });
  for (const s of [-1, 1]) {
    const cap = s < 0 ? [40, -23, 62, -23, 62, -17, 40, -17] : [40, 17, 62, 17, 62, 23, 40, 23];
    plate(ctx, cap, s < 0 ? '#8a4a2a' : '#6a3220', { ow: 2, under: null });
    line(ctx, [41.5, s * 22, 60.5, s * 22], s < 0 ? '#b06a40' : '#4a2214', 0.9);
    const b = s < 0 ? [41, -16.5, 61, -16.5, 61, -13.5, 41, -13.5] : [41, 13.5, 61, 13.5, 61, 16.5, 41, 16.5];
    plate(ctx, b, GOLD, { ow: 1.5, under: null });
    sheen(ctx, b, t + (s > 0 ? 1.1 : 0), 41, 61, '#fff6c8', 0.85, 2.2, 3);
  }
  // brass plaque, engraved
  const pl = [44.5, -6, 57.5, -6, 57.5, 6, 44.5, 6];
  plate(ctx, pl, '#ecd07a', { ow: 1.5, under: '#c8a050', splitY: 3 });
  line(ctx, [47, -2.6, 55, -2.6], '#6a4a10', 1);
  line(ctx, [47.5, 0.6, 54.5, 0.6], '#6a4a10', 1);
  line(ctx, [49, 3.2, 53, 3.2], '#6a4a10', 0.8);
  sheen(ctx, pl, t + 0.7, 44, 58, '#ffffff', 0.6, 2.2, 3);
  spec(ctx, 44, -20.5, 1.2);
  // the rent: gold coins orbiting the head
  for (let i = 0; i < 3; i++) {
    const a = t * 1.6 + (i * TAU) / 3;
    const x = 51 + Math.cos(a) * 19;
    const y = Math.sin(a) * 6;
    const w = Math.abs(Math.cos(t * 5 + i * 1.3)) * 2.4 + 0.5;
    blob(ctx, x, y, w, 2.7, { fill: '#f0c84a', under: '#c8962a', outlineW: 1 });
    if (w > 1.6) glint(ctx, x, y - 0.6, 1.4, '#ffffff', 0.8);
  }
}

function noiseComplaint(ctx: Ctx, t: number): void {
  const BR = '#b5793a';
  haft(ctx, -7, 42, 5.6, '#3a2a22');
  grip(ctx, -7, 12, 6.2, '#5a2a2a');
  band(ctx, 16, 2.6, 8, BR);
  band(ctx, 30, 2.6, 8, BR);
  // sound rings from the bell's mouth
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.9 + i / 3);
    const r = 5 + k * 18;
    ring(ctx, 64, 0, r * 0.75, r, '#ffe9b0', 2 * (1 - k) + 0.5, 0.85 * (1 - k), -1.1, 1.1);
    glint(ctx, 64 + Math.cos(0.9) * r * 0.75, -Math.sin(0.9) * r, 1.8 * (1 - k), '#ffffff', 1 - k);
  }
  const bell = (): void => {
    ctx.beginPath();
    ctx.moveTo(39.5, -5);
    ctx.quadraticCurveTo(39.5, -9.5, 45, -10);
    ctx.quadraticCurveTo(55, -10.5, 59, -13.5);
    ctx.quadraticCurveTo(62, -17, 66, -17.5);
    ctx.lineTo(66, 17.5);
    ctx.quadraticCurveTo(62, 17, 59, 13.5);
    ctx.quadraticCurveTo(55, 10.5, 45, 10);
    ctx.quadraticCurveTo(39.5, 9.5, 39.5, 5);
    ctx.closePath();
  };
  bell();
  ctx.fillStyle = BR;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#8a5424';
  ctx.fillRect(30, 3, 40, 20);
  ctx.fillStyle = '#7a4a1e';
  ctx.fillRect(61.5, -20, 6, 40);
  line(ctx, [42, -6.5, 55, -7.4, 61, -11.5], '#f0c080', 1.4, 0.9);
  line(ctx, [47, -10, 47, 10], '#7a4a1e', 1);
  ctx.restore();
  bell();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // the crack
  line(ctx, [66, -8, 61, -4.5, 58.5, -7.5, 54, -3.5, 50.5, -5.5], OUTLINE, 1.3);
  line(ctx, [61, -4.5, 60, -1], OUTLINE, 0.9);
  plate(ctx, [37, -3.6, 40.5, -3.6, 40.5, 3.6, 37, 3.6], '#8a5424', { ow: 1.5 });
  glint(ctx, 52, -7.6, 1.6 + pulse(t, 5) * 1.4, '#fff3d0', 0.9);
  const up = worldUp(ctx);
  drift(ctx, 58, 0, t, 2, up, 16, 24, 0.45, 5, (x, y, k) => note(ctx, x, y, 1 - k, up, '#ffe9b0'));
}

function theBigOne(ctx: Ctx, t: number): void {
  haft(ctx, -7, 40, 6, '#3a2a22');
  grip(ctx, -7, 12, 6.5, '#2a2220');
  band(ctx, 16, 3, 9);
  band(ctx, 30, 3, 9);
  const cx = 53;
  const fl = pulse(t, 4) * 0.6 + pulse(t, 9.3) * 0.4;
  glow(ctx, cx, 0, 26 + fl * 4, '#ff7a1a', 0.35 + fl * 0.12);
  // two pebbles caught in its orbit (the far one behind)
  const a = t * 1.3;
  const orbit = (k: number): [number, number, number] => [cx + Math.cos(a + k) * 22, Math.sin(a + k) * 7, Math.sin(a + k)];
  const p1 = orbit(0);
  const p2 = orbit(Math.PI);
  for (const p of [p1, p2]) if (p[2] < 0) blob(ctx, p[0], p[1], 2.2, 1.8, { fill: '#5a4a44', outlineW: 1.2 });
  // the meteorite
  const pts = rock(cx, 0, 16.5, 13, 4, 0.3);
  plate(ctx, pts, '#4a3a36', { under: '#2a201e', splitY: 3 });
  clipDo(ctx, pts, () => {
    blob(ctx, 47, 6, 3.4, 2.6, { fill: '#3a2c28', outlineW: 1 });
    blob(ctx, 60, -6, 2.6, 2, { fill: '#3a2c28', outlineW: 1 });
    const cracks = [
      [38, -4, 45, -2, 49, -7, 54, -5, 58, -10, 64, -9],
      [42, 7, 49, 3, 53, 6, 58, 2, 68, 4],
      [52, -16, 53, -8, 51, -3, 55, 1, 54, 8, 57, 16],
    ];
    for (const c of cracks) {
      line(ctx, c, '#ff5a1a', 2.8, 0.55 + 0.35 * fl);
      line(ctx, c, '#ffd27a', 0.9, 0.7 + 0.3 * fl);
    }
  });
  // iron straps holding it on
  cord(ctx, [41, -5, 45, -13, 52, -16.5], IRON, 2, 1.2);
  cord(ctx, [41, 5, 45, 13, 52, 16.5], IRON, 2, 1.2);
  rivet(ctx, 42, -6.5, 1);
  rivet(ctx, 42, 6.5, 1);
  for (const p of [p1, p2]) if (p[2] >= 0) blob(ctx, p[0], p[1], 2.2, 1.8, { fill: '#6a5a52', outlineW: 1.2 });
  const up = worldUp(ctx);
  drift(ctx, cx, 0, t, 7, up, 22, 20, 0.8, 9, (x, y, k) => dot(ctx, x, y, 1.1 - k * 0.6, k < 0.5 ? '#ffd27a' : '#ff7a1a', 1 - k));
}

// ---------------------------------------------------------------------------------------------
// Greataxe: The Severance Package, Lumberjack Retirement Plan, Firewood
// ---------------------------------------------------------------------------------------------

function severancePackage(ctx: Ctx, t: number): void {
  haft(ctx, -7, 63, 6, WOOD);
  grip(ctx, -7, 12, 6.5, LEATHER);
  const PAPER = '#d6345a';
  for (const s of [1, -1]) {
    const pts = s > 0 ? GA_TOP : flipY(GA_TOP);
    const edge = s > 0 ? GA_EDGE : flipY(GA_EDGE);
    trace(ctx, pts);
    ctx.fillStyle = s > 0 ? PAPER : '#b82848';
    ctx.fill();
    clipDo(ctx, pts, () => {
      for (let i = 0; i < 18; i++) {
        const x = 36 + (i % 6) * 5 + (Math.floor(i / 6) % 2) * 2.5;
        const y = s * (6 + Math.floor(i / 6) * 6.5);
        dot(ctx, x, y, 1, '#ffd0dc', 0.9);
      }
      ctx.fillStyle = '#f0c84a';
      ctx.fillRect(47.5, -30, 4, 60);
      line(ctx, [48.4, -30, 48.4, 30], '#fff3b0', 0.8);
      line(ctx, edge, STEEL, 5);
      line(ctx, edge, '#ffffff', 1.4);
    });
    outlineOf(ctx, pts, 2.5);
  }
  // ribbon round the socket and a bow on top
  plate(ctx, [42, -5, 58, -5, 58, 5, 42, 5], '#f0c84a', { ow: 2, under: '#c8962a', splitY: 1 });
  plate(ctx, [58, -3, 68, 0, 58, 3], STEEL, { ow: 2 });
  const wob = Math.sin(t * 3) * 0.08;
  blob(ctx, 45.5, -1.5, 4.6, 2.8, { fill: '#f0c84a', under: '#c8962a', outlineW: 1.6 }, -0.45 + wob);
  blob(ctx, 54.5, -1.5, 4.6, 2.8, { fill: '#f0c84a', under: '#c8962a', outlineW: 1.6 }, 0.45 - wob);
  poly(ctx, [49, 1, 46, 7, 48.5, 6.5, 50, 1.5], '#e0b03a', OUTLINE, 1.2);
  poly(ctx, [51, 1, 54, 7, 51.5, 6.5, 50, 1.5], '#e0b03a', OUTLINE, 1.2);
  blob(ctx, 50, -0.5, 2, 2.4, { fill: '#ffd86a', outlineW: 1.4 });
  // the gift tag
  const [gx, gy] = dangle(ctx, 66, 0, 7, t);
  ctx.save();
  ctx.translate(gx, gy);
  const up = worldUp(ctx);
  ctx.rotate(Math.atan2(-up[1], -up[0]) - Math.PI / 2 + Math.sin(t * 2.2) * 0.35);
  plate(ctx, [-2.4, 0, 2.4, 0, 2.4, 5.5, 0, 7, -2.4, 5.5], '#f4ecd6', { ow: 1.2, under: null });
  dot(ctx, 0, 1.3, 0.6, OUTLINE);
  line(ctx, [-1.2, 3.5, 1.2, 3.5], '#d6345a', 0.6);
  ctx.restore();
  glint(ctx, 40, -22, 1.4 + pulse(t, 4) * 1.6, '#ffffff', 0.9);
  glint(ctx, 60, 19, 1.4 + pulse(t, 4, 2) * 1.6, '#ffffff', 0.9);
}

function lumberjackRetirement(ctx: Ctx, t: number): void {
  // buffalo-check plaid haft
  limb(ctx, -7, 0, 62, 0, 6, '#b02a2a');
  clipDo(ctx, [-8, -3, 63, -3, 63, 3, -8, 3], () => {
    ctx.fillStyle = 'rgba(20,10,14,0.6)';
    for (let x = -8; x < 63; x += 6) ctx.fillRect(x, -3, 3, 6);
    ctx.fillStyle = 'rgba(20,10,14,0.45)';
    ctx.fillRect(-8, -1, 71, 2);
  });
  grip(ctx, -7, 10, 6.5, '#3a2a1a');
  // the poll and a big golden single bit
  plate(ctx, [44, 3, 56, 3, 55, 9.5, 45, 9.5], '#c8a040', { ow: 2 });
  const edge = [29, -22, 31, -27, 37, -30.6, 45, -32, 53, -31.4, 60, -28.6, 65, -23];
  const bit = [43, -3, 42.5, -8, 40, -13, 34, -17.5, ...edge, 61, -17.5, 58.5, -12, 57.5, -7, 57, -3];
  plate(ctx, bit, '#e8c04a', { under: null, edge, edgeColor: '#fffbe0', edgeW: 1.5 });
  line(ctx, [33, -22.5, 38, -26.4, 45, -27.8, 53, -27.2, 59, -24.6, 62.5, -21], '#b08a2a', 1);
  sheen(ctx, bit, t, 29, 65, '#fff8d8', 0.65, 2.6, 4);
  plate(ctx, [42, -5, 58, -5, 58, 5, 42, 5], '#8a6a2a', { ow: 2 });
  rivet(ctx, 46, 0, 1);
  rivet(ctx, 54, 0, 1);
  // a gold pocket watch on a chain
  const [wx, wy] = dangle(ctx, 50, 9.5, 8, t, '#f0c84a', 1.8, 0.3);
  blob(ctx, wx, wy, 5.2, 5.2, { fill: '#f0c84a', under: '#c8962a', outlineW: 1.8 });
  blob(ctx, wx, wy, 3.8, 3.8, { fill: '#fbf6e8', under: '#e8e0cc', outlineW: 1 });
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4;
    dot(ctx, wx + Math.cos(a) * 3, wy + Math.sin(a) * 3, 0.45, OUTLINE);
  }
  line(ctx, [wx, wy, wx + Math.cos(t * 0.5) * 1.8, wy + Math.sin(t * 0.5) * 1.8], OUTLINE, 0.9);
  line(ctx, [wx, wy, wx + Math.cos(t * 6) * 3, wy + Math.sin(t * 6) * 3], '#b03030', 0.6);
  glint(ctx, 40, -25, 1.4 + pulse(t, 3) * 1.8, '#ffffff', 0.9);
}

function firewood(ctx: Ctx, t: number): void {
  const up = worldUp(ctx);
  const fl = pulse(t, 7) * 0.5 + pulse(t, 11.7) * 0.5;
  glow(ctx, 44, 0, 26 + fl * 3, '#ff7a1a', 0.3 + fl * 0.12);
  // the axe blade lodged in the log (drawn first: the log covers its buried end)
  const blade = [39, -2, 36, -12, 31, -21, 44, -25.5, 57, -22, 52, -12, 49, -2];
  plate(ctx, blade, STEEL, { under: null, edge: [31, -21, 44, -25.5, 57, -22], edgeColor: '#ffffff', edgeW: 1.2 });
  line(ctx, [34.5, -18, 44, -21.5, 53, -19], shade(STEEL, 0.72), 0.9);
  // the log
  const log = [-8, -3.2, 10, -3.9, 30, -4.8, 50, -5.4, 61, -5.6, 61, 5.6, 50, 5.4, 30, 4.8, 10, 3.9, -8, 3.2];
  plate(ctx, log, '#6a4428', { under: '#4a2e18', splitY: 1.5 });
  clipDo(ctx, log, () => {
    line(ctx, [12, -1.6, 22, -2.2, 30, -1.4, 40, -2.6, 58, -2], '#3a2412', 0.9);
    line(ctx, [16, 2, 28, 1.4, 36, 2.6, 52, 2], '#3a2412', 0.9);
    line(ctx, [26, -3.6, 36, -4, 46, -3.4], '#8a6040', 0.8);
    blob(ctx, 24, 0.6, 1.6, 1.2, { fill: '#3a2412', outlineW: 0.8 });
    // charred, glowing patches
    line(ctx, [36, -4.6, 41, -5, 50, -4.6], '#ff7a1a', 1.6, 0.4 + fl * 0.4);
  });
  line(ctx, [41, -5.2, 44, -3, 47, -5.2], OUTLINE, 1);
  blob(ctx, 61, 0, 2.8, 5.6, { fill: '#d8b080', outlineW: 2 });
  ring(ctx, 61, 0, 1.5, 3.4, '#a07a4a', 0.7);
  ring(ctx, 61, 0, 0.6, 1.5, '#a07a4a', 0.6);
  grip(ctx, -8, 7, 6.6, '#8a7a5a', '#4a3a2a');
  // flames along the log and rising embers
  for (let i = 0; i < 4; i++) flame(ctx, 24 + i * 11, 0, 11 + (i % 2) * 3, 3.4, t, up, i * 1.7);
  drift(ctx, 40, 0, t, 7, up, 30, 22, 0.9, 2, (x, y, k) => dot(ctx, x, y, 1 - k * 0.6, k < 0.4 ? '#ffd27a' : '#ff7a3a', 1 - k));
}

// ---------------------------------------------------------------------------------------------
// Colossal Sword: Overcompensation, The Door, Small Talk
// ---------------------------------------------------------------------------------------------

function overcompensation(ctx: Ctx, t: number): void {
  pommel(ctx, -10.5, 4.5, '#f0c84a');
  dot(ctx, -10.5, 0, 1.8, '#d42a2a');
  grip(ctx, -9, 11, 6.2, '#1a1a1a', '#d42a2a');
  // a red sports-car blade with chrome edges, racing stripes and flame decals
  const pts = [20, -11.5, 78, -10, 93, 0, 78, 10, 20, 11.5];
  plate(ctx, pts, '#d42a2a', { under: '#a81c1c', splitY: 0 });
  clipDo(ctx, pts, () => {
    for (const s of [1, -1]) {
      poly(ctx, flipIf([20, -11.5, 31, -6, 28, -9.5, 39, -5.5, 35, -9.4, 47, -7.4, 42, -10.5, 50, -11], s), '#ffb020', OUTLINE, 0.8);
      poly(ctx, flipIf([20, -11, 28, -8, 26, -10, 34, -7.8, 32, -10.4], s), '#ffe14a', OUTLINE, 0);
    }
    line(ctx, [22, -1.8, 86, -1.8], '#ffffff', 1.5);
    line(ctx, [22, 1.8, 86, 1.8], '#ffffff', 1.5);
    line(ctx, [20, -11.5, 78, -10, 93, 0, 78, 10, 20, 11.5], '#e8ecf0', 4.6);
    line(ctx, [20, -11.5, 78, -10, 93, 0], '#ffffff', 1.4);
  });
  outlineOf(ctx, pts, 2.5);
  sheen(ctx, pts, t, 20, 93, '#ffffff', 0.38, 1.8, 4);
  // chrome spoiler guard with gems
  plate(ctx, [9, -19, 14, -20, 18, -6, 18, 6, 14, 20, 9, 19, 12.5, 0], '#e8ecf0', { under: '#9aa0a8', edge: [9, -19, 14, -20, 18, -6], edgeColor: '#ffffff', edgeW: 0.8, ow: 2 });
  dot(ctx, 14.5, -12, 1.6, '#3f8cff');
  dot(ctx, 14.5, 12, 1.6, '#58d66a');
  dot(ctx, 15.5, 0, 2, '#d42a2a');
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.7 + i / 3);
    glint(ctx, 26 + i * 22, (i - 1) * 5, 2.6 * Math.sin(k * Math.PI), '#ffffff', 1);
  }
}

function flipIf(pts: number[], s: number): number[] {
  return s > 0 ? pts : flipY(pts);
}

function theDoor(ctx: Ctx, t: number): void {
  pommel(ctx, -10, 3.8, '#c9a85a');
  grip(ctx, -9, 11, 6, '#5a3a22');
  const door = [14, -11.5, 80, -11.5, 85, -7, 85, 7, 80, 11.5, 14, 11.5];
  // light leaking round the edge: the door is ajar onto somewhere bright
  const p = pulse(t, 2.4);
  for (let i = 0; i < 5; i++) glow(ctx, 20 + i * 15, 12, 5 + p * 2, '#ffe9b0', 0.25 + p * 0.15);
  plate(ctx, door, '#9a6a3a', { under: '#7a4e28', splitY: 3 });
  plate(ctx, [19, -8, 46, -8, 46, 7.5, 19, 7.5], '#8a5a30', { ow: 1.2, under: '#74482a', splitY: 3 });
  plate(ctx, [50, -8, 79, -8, 79, 7.5, 50, 7.5], '#8a5a30', { ow: 1.2, under: '#74482a', splitY: 3 });
  line(ctx, [20, -7, 45, -7], '#b8844e', 0.8);
  line(ctx, [51, -7, 78, -7], '#b8844e', 0.8);
  // hinges on one edge, knob and keyhole on the other
  for (const x of [28, 68]) plate(ctx, [x - 2.5, -13, x + 2.5, -13, x + 2.5, -9.5, x - 2.5, -9.5], IRON, { ow: 1.2 });
  plate(ctx, [21, 5, 27, 5, 27, 11, 21, 11], '#b8893a', { ow: 1.2 });
  blob(ctx, 24, 7.4, 2.4, 2.4, { fill: '#e0b45a', outlineW: 1.5 });
  spec(ctx, 23.4, 6.6, 0.8);
  dot(ctx, 24, 10, 0.8, OUTLINE);
  line(ctx, [16, 11.5, 80, 11.5, 85, 7], '#fff3c8', 1.3, 0.55 + 0.45 * p);
  glow(ctx, 24, 10, 3 + p * 2, '#ffe9b0', 0.6);
  // the door frame as a crossguard
  plate(ctx, [10.5, -15, 14.5, -15, 14.5, 15, 10.5, 15], '#6a4428', { ow: 2 });
}

function smallTalk(ctx: Ctx, t: number): void {
  pommel(ctx, -10, 4, '#7ab0e0');
  grip(ctx, -9, 11, 6, '#4a6a9a', '#2a3a5a');
  const bubble = (): void => {
    ctx.beginPath();
    ctx.moveTo(19, -10);
    ctx.lineTo(70, -10);
    ctx.quadraticCurveTo(80, -10, 87, 0);
    ctx.quadraticCurveTo(80, 10, 70, 10);
    ctx.lineTo(28, 10);
    ctx.lineTo(19, 17);
    ctx.lineTo(22, 10);
    ctx.quadraticCurveTo(15.5, 10, 15.5, 0);
    ctx.quadraticCurveTo(15.5, -10, 19, -10);
    ctx.closePath();
  };
  bubble();
  ctx.fillStyle = '#f6f2ea';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#dcd6cc';
  ctx.fillRect(10, 4, 80, 20);
  line(ctx, [20, -8, 70, -8, 80, -7], '#ffffff', 1.4);
  ctx.restore();
  bubble();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // typing…
  for (let i = 0; i < 3; i++) {
    const b = Math.max(0, Math.sin(t * 6 - i * 0.9));
    dot(ctx, 38 + i * 13, -b * 2.6, 3, '#5a5560', 0.55 + 0.45 * b);
  }
  crossguard(ctx, 12.5, 12, 4, '#7ab0e0', 2.5);
  // a stray little bubble drifting off
  const up = worldUp(ctx);
  drift(ctx, 70, 0, t, 1, up, 6, 22, 0.35, 4, (x, y, k) => {
    ctx.beginPath();
    ctx.ellipse(x, y, 4 * (1 - k * 0.3), 3 * (1 - k * 0.3), 0, 0, TAU);
    fillPath(ctx, '#f6f2ea', 1.3, 1 - k);
  });
}

// ---------------------------------------------------------------------------------------------
// Crossbow: Second Opinion, The Notary, Quarrelsome
// ---------------------------------------------------------------------------------------------

function ecg(u: number): number {
  const p = ((u % 16) + 16) % 16;
  if (p < 7) return 0;
  if (p < 8) return -0.8 * (p - 7);
  if (p < 9) return -0.8 - 2.6 * (p - 8);
  if (p < 10) return -3.4 + 5.6 * (p - 9);
  if (p < 11) return 2.2 - 2.2 * (p - 10);
  if (p < 13) return -Math.sin(((p - 11) / 2) * Math.PI) * 0.9;
  return 0;
}

function secondOpinion(ctx: Ctx, t: number, charge: number): void {
  plate(ctx, XBOW_STOCK, '#ece6da', { ow: 2.5, under: '#cfc8ba', splitY: 1 });
  // the stethoscope slung round it
  const sw = Math.sin(t * 2) * 1.5;
  cord(ctx, [-2, 3, 4, 9, 14, 11 + sw * 0.4, 22, 10 + sw], '#3a3a44', 1.4, 1);
  blob(ctx, 23.5, 10 + sw, 3, 3, { fill: '#c9ced6', outlineW: 1.6 });
  dot(ctx, 23.5, 10 + sw, 1.4, '#8a919c');
  // two prods: a second opinion
  const [rx, ry] = prodArc(ctx, 22, 14, '#8a919c', 1.15, 2.6);
  const [ex, ey] = prodArc(ctx, 31, 17, '#c9ced6', 1.2, 3);
  const back = 13 - Math.min(3, charge * 6);
  line(ctx, [rx, -ry, back - 4, 0, rx, ry], '#efe6d2', 0.9);
  line(ctx, [ex, -ey, back, 0, ex, ey], '#efe6d2', 1);
  bolt(ctx, back, 47, -1.6, 0, '#a07a4a', STEEL, '#d42a2a');
  bolt(ctx, back - 2, 45, 1.6, 0, '#a07a4a', STEEL, '#ffffff');
  plate(ctx, [43, -5, 49, -5, 49, 5, 43, 5], IRON, { ow: 1.5 });
  // red cross emblem and a heartbeat across the stock
  plate(ctx, [1.5, -1.2, 3.3, -1.2, 3.3, -3, 5.1, -3, 5.1, -1.2, 6.9, -1.2, 6.9, 0.6, 5.1, 0.6, 5.1, 2.4, 3.3, 2.4, 3.3, 0.6, 1.5, 0.6], '#d42a2a', { ow: 1, under: null });
  const pts: number[] = [];
  const off = t * 22;
  for (let x = 9; x <= 40; x += 0.5) pts.push(x, ecg(x - off) * 0.9);
  line(ctx, pts, '#2a8a3a', 1.6, 0.6);
  line(ctx, pts, '#7dff8a', 0.7);
  const hx = 9 + frac(t * 0.7) * 31;
  glow(ctx, hx, ecg(hx - off) * 0.9, 5, '#58d66a', 0.8);
}

function theNotary(ctx: Ctx, t: number, charge: number): void {
  plate(ctx, XBOW_STOCK, '#2a2228', { ow: 2.5, under: '#1a1418', splitY: 1 });
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let x = -6; x < 28; x += 6) {
    ctx.moveTo(x, 1.6);
    ctx.bezierCurveTo(x + 1.5, -2.4, x + 3.5, -2.4, x + 3, 0.4);
    ctx.bezierCurveTo(x + 2.6, 2.2, x + 5, 2.2, x + 6, 1.6);
  }
  ctx.stroke();
  ctx.restore();
  const [ex, ey] = prodArc(ctx, 30, 18, GOLD);
  const back = 12 - Math.min(3, charge * 6);
  line(ctx, [ex, -ey, back, 0, ex, ey], '#efe6d2', 1);
  // a parchment scroll rolled round the fore-end
  plate(ctx, [33, -4.5, 40, -4.5, 40, 4.5, 33, 4.5], '#efe2c0', { ow: 1.6, under: '#d8c8a0', splitY: 1 });
  line(ctx, [35.3, -4, 35.3, 4], '#b8a070', 0.7);
  line(ctx, [37.6, -4, 37.6, 4], '#b8a070', 0.7);
  // the bolt is a quill pen
  line(ctx, [back, 0, 50, 0], OUTLINE, 3);
  line(ctx, [back, 0, 50, 0], '#efe6d2', 1.3);
  plate(ctx, [48.5, -2.4, 56, 0, 48.5, 2.4], GOLD, { ow: 1.3 });
  line(ctx, [51, 0, 55, 0], OUTLINE, 0.6);
  dot(ctx, 50.6, 0, 0.6, OUTLINE);
  ctx.beginPath();
  ctx.moveTo(back + 1, 0);
  ctx.quadraticCurveTo(back + 7, -8, back + 20, -3.5);
  ctx.quadraticCurveTo(back + 12, -1, back + 22, 0);
  ctx.quadraticCurveTo(back + 10, 2.4, back + 1, 0);
  ctx.closePath();
  fillPath(ctx, '#f4f0e6', 1.2);
  for (let i = 0; i < 5; i++) line(ctx, [back + 4 + i * 3, -0.4, back + 6 + i * 3, -3.4 - (i % 2)], '#c8c0b0', 0.6);
  // the wax seal
  const seal = rock(3, 0, 4.4, 11, 2, 0.22);
  poly(ctx, [1, 2, -1, 9, 1.5, 8, 3, 3], '#a01818', OUTLINE, 1);
  poly(ctx, [5, 2, 7, 9, 4.5, 8, 3, 3], '#c02020', OUTLINE, 1);
  plate(ctx, seal, '#b01c1c', { ow: 1.5, under: '#8a1010', splitY: 1 });
  ring(ctx, 3, 0, 2.6, 2.6, '#e04a4a', 0.7);
  star(ctx, 3, 0, 1.6, '#e04a4a', 5, 0.45, -Math.PI / 2, 0);
  // ink drips from the nib
  const up = worldUp(ctx);
  drift(ctx, 55, 0, t, 2, [-up[0], -up[1]], 1, 12, 0.6, 7, (x, y, k) => dot(ctx, x, y, 1.1 - k * 0.3, '#1a1a3a', 1 - k));
}

function quarrelsome(ctx: Ctx, t: number, charge: number): void {
  plate(ctx, XBOW_STOCK, '#2a1a1e', { ow: 2.5, under: '#1a0e10', splitY: 1 });
  line(ctx, [-4, -2, 40, -1.6], '#8a1a1a', 0.8);
  // a thorny prod
  const [ex, ey] = prodArc(ctx, 30, 18, '#8a1a1a');
  for (let i = 0; i < 6; i++) {
    const a = -1.05 + (i * 2.1) / 5;
    const c = Math.cos(a);
    const s = Math.sin(a);
    poly(ctx, [30 + c * 19 - s * 1.4, s * 19 + c * 1.4, 30 + c * 23.5, s * 23.5, 30 + c * 19 + s * 1.4, s * 19 - c * 1.4], '#c03030', OUTLINE, 1);
  }
  const back = 14 - Math.min(3, charge * 6);
  line(ctx, [ex, -ey, back, 0, ex, ey], '#efe6d2', 1);
  // a quarrel of quarrels
  bolt(ctx, back, 46, 0, -0.2, '#4a3030', '#d6dae0', '#ff3b3b');
  bolt(ctx, back, 46, 0, 0.2, '#4a3030', '#d6dae0', '#ff3b3b');
  bolt(ctx, back, 50, 0, 0, '#4a3030', '#d6dae0', '#ff3b3b');
  // a snarling maw at the front
  poly(ctx, [40, -4, 49, -6, 47, -1.5], '#3a2226', OUTLINE, 1.5);
  poly(ctx, [40, 4, 49, 6, 47, 1.5], '#3a2226', OUTLINE, 1.5);
  for (let i = 0; i < 3; i++) {
    poly(ctx, [41.5 + i * 2.4, -3.8 - i * 0.5, 42.7 + i * 2.4, -1.6, 43.9 + i * 2.4, -4.2 - i * 0.5], '#efe6d2', OUTLINE, 0.6);
    poly(ctx, [41.5 + i * 2.4, 3.8 + i * 0.5, 42.7 + i * 2.4, 1.6, 43.9 + i * 2.4, 4.2 + i * 0.5], '#efe6d2', OUTLINE, 0.6);
  }
  dot(ctx, 44, -3.6, 0.9, '#ff3b3b');
  // the anger mark, throbbing (world up)
  const up = worldUp(ctx);
  const s = 2.6 + pulse(t, 6) * 1.2;
  const ax = 18 + up[0] * 11;
  const ay = up[1] * 11;
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 + Math.PI / 4;
    const cx = ax + Math.cos(a) * s * 1.7;
    const cy = ay + Math.sin(a) * s * 1.7;
    ring(ctx, cx, cy, s, s, OUTLINE, 3, 1, a + Math.PI - 0.75, a + Math.PI + 0.75);
    ring(ctx, cx, cy, s, s, '#ff3b3b', 1.5, 1, a + Math.PI - 0.75, a + Math.PI + 0.75);
  }
  drift(ctx, 48, 0, t, 2, up, 4, 14, 0.7, 3, (x, y, k) => dot(ctx, x, y, 1.5 + k * 2.5, '#c8c0c0', 0.4 * (1 - k)));
}

// ---------------------------------------------------------------------------------------------
// Club: Stick of Destiny, Problem Solver, Original Recipe
// ---------------------------------------------------------------------------------------------

function stickOfDestiny(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.5);
  glow(ctx, 50, 0, 18 + p * 4, '#ffe98a', 0.45);
  const twig = [-7, -2.2, 12, -2, 24, -2.7, 32, -1.8, 44, -2.4, 52, -1.4, 53.5, 0.6, 44, 2.2, 34, 2, 24, 2.5, 12, 2, -7, 2.2];
  plate(ctx, [29, -1.6, 35, -7.5, 36.5, -6.6, 32, -1.2], '#a07850', { ow: 1.5 });
  plate(ctx, twig, '#a07850', { ow: 2, under: '#7a5838', splitY: 0.6 });
  line(ctx, [8, -0.8, 30, -1, 50, -0.6], '#c8a070', 0.7, 0.8);
  // a single brave leaf
  ctx.save();
  ctx.translate(36, -7.4);
  ctx.rotate(-0.6 + Math.sin(t * 2) * 0.15);
  ctx.beginPath();
  ctx.ellipse(3.2, 0, 3.6, 1.8, 0, 0, TAU);
  fillPath(ctx, '#58d66a', 1.2);
  line(ctx, [0, 0, 6, 0], '#2a8a3a', 0.6);
  ctx.restore();
  grip(ctx, -7, 6, 4.8, '#c8b890', '#8a7a5a');
  // destiny: golden motes spiralling round it, stars at the tip
  for (let i = 0; i < 8; i++) {
    const k = frac(t * 0.22 + i / 8);
    const x = -4 + k * 58;
    const y = Math.sin(k * 14 - t * 3 + i) * (3 + k * 3);
    dot(ctx, x, y, 0.9 + k * 0.5, '#ffe98a', Math.sin(k * Math.PI));
  }
  for (let i = 0; i < 2; i++) {
    const a = t * 1.8 + i * Math.PI;
    glint(ctx, 52 + Math.cos(a) * 7, Math.sin(a) * 7, 2.4, '#fffbe0', 0.6 + 0.4 * Math.sin(t * 5 + i));
  }
  glint(ctx, 53, 0, 3 + p * 2, '#ffffff', 0.9);
}

function problemSolver(ctx: Ctx, t: number): void {
  const bat = [-8, -2.5, 10, -2.4, 24, -4, 38, -6.4, 48, -7, 51, -5, 52.5, 0, 51, 5, 48, 7, 38, 6.4, 24, 4, 10, 2.4, -8, 2.5];
  // nails sticking out (drawn first so the bat covers their shanks)
  const nails = [
    [30, -4.4, 31, -9.5],
    [34, 4.8, 35.5, 10],
    [43, -6.4, 44, -11.5],
    [46.5, 6.4, 48, 11.5],
    [50, -3, 55.5, -4.5],
  ] as const;
  for (const [x0, y0, x1, y1] of nails) cord(ctx, [x0, y0, x1, y1], '#b8bec8', 1.1, 1);
  plate(ctx, bat, '#d8b888', { under: '#b89868', splitY: 1.5 });
  line(ctx, [14, -1.6, 30, -3, 46, -4.6], '#f0d8a8', 0.9);
  blob(ctx, -8.6, 0, 1.9, 3.8, { fill: '#c8a878', outlineW: 1.8 });
  grip(ctx, -7, 10, 4.8, '#222226', '#000000');
  // duct tape
  clipDo(ctx, bat, () => {
    for (const [x, w] of [
      [20, 5],
      [39, 6],
    ] as const) {
      ctx.fillStyle = '#a2a8ae';
      ctx.fillRect(x, -10, w, 20);
      line(ctx, [x + 1, -6, x + w - 1, -4.5], '#c8ced4', 0.6);
      line(ctx, [x + 1.5, 2, x + w - 1, 3.5], '#7a8086', 0.6);
      line(ctx, [x, -10, x, 10], '#5a6066', 0.8);
      line(ctx, [x + w, -10, x + w, 10], '#5a6066', 0.8);
    }
  });
  outlineOf(ctx, bat, 2.5);
  // a hex bolt clean through the head
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    if (i) ctx.lineTo(46 + Math.cos(a) * 2.6, Math.sin(a) * 2.6);
    else ctx.moveTo(46 + Math.cos(a) * 2.6, Math.sin(a) * 2.6);
  }
  ctx.closePath();
  fillPath(ctx, IRON, 1.4);
  dot(ctx, 46, 0, 1, '#4a4e56');
  // problem: solved — glints jumping between nail tips
  const i = Math.floor(t * 3) % nails.length;
  const k = frac(t * 3);
  const n = nails[i]!;
  glint(ctx, n[2], n[3], 2.8 * Math.sin(k * Math.PI), '#ffffff', 1);
}

function originalRecipe(ctx: Ctx, t: number): void {
  // the bone is the handle
  limb(ctx, -6, 0, 16, 0, 4.4, '#f2ead8');
  blob(ctx, -8, -2.3, 2.6, 2.4, { fill: '#f2ead8', outlineW: 1.8 });
  blob(ctx, -8, 2.3, 2.6, 2.4, { fill: '#f2ead8', outlineW: 1.8 });
  line(ctx, [-4, -0.8, 14, -0.8], '#ffffff', 0.8, 0.8);
  const meat = (): void => {
    ctx.beginPath();
    ctx.moveTo(13, -4);
    ctx.bezierCurveTo(24, -7.5, 34, -12.5, 44, -11.5);
    ctx.bezierCurveTo(55, -10.5, 56, 10.5, 44, 11.5);
    ctx.bezierCurveTo(34, 12.5, 24, 7.5, 13, 4);
    ctx.closePath();
  };
  meat();
  ctx.fillStyle = '#c47e2c';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#9a5a1a';
  ctx.fillRect(10, 3, 50, 12);
  // crispy bumps, batched: one path per shade
  for (const top of [true, false]) {
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const x = 16 + hash(i * 2.3) * 38;
      const y = (hash(i * 5.1) - 0.5) * 20;
      if (y < 2 !== top) continue;
      const rx = 1.6 + hash(i) * 1.2;
      ctx.moveTo(x + rx, y);
      ctx.ellipse(x, y, rx, 1.2 + hash(i * 3) * 0.8, 0, 0, TAU);
    }
    ctx.fillStyle = top ? '#e8a84a' : '#b8702a';
    ctx.fill();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = '#7a4210';
    ctx.stroke();
  }
  ctx.restore();
  meat();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // steam and grease
  const up = worldUp(ctx);
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.5 + i / 3);
    const bx = 28 + i * 9 + up[0] * (6 + k * 14);
    const by = up[1] * (6 + k * 14);
    const px = -up[1];
    const py = up[0];
    const wv = Math.sin(t * 4 + i * 2) * 2;
    line(ctx, [bx - up[0] * 3 + px * wv, by - up[1] * 3 + py * wv, bx + px * -wv * 0.6, by + py * -wv * 0.6, bx + up[0] * 3 + px * wv, by + up[1] * 3 + py * wv], '#ffffff', 1.1, 0.55 * Math.sin(k * Math.PI));
  }
  glint(ctx, 36, -7, 1.4 + pulse(t, 4) * 1.6, '#fff8e0', 0.9);
  glint(ctx, 46, 4, 1.2 + pulse(t, 4, 2) * 1.4, '#fff8e0', 0.8);
}

// ---------------------------------------------------------------------------------------------
// Twin Daggers: Paper Cut, The Fine Print, Mr. and Mrs. Stabby (each design is one of the pair)
// ---------------------------------------------------------------------------------------------

const DAGGER = [7, -3.6, 22, -3.2, 31, 0, 22, 3.2, 7, 3.6];

function paperCut(ctx: Ctx, t: number): void {
  // a rolled-paper grip
  limb(ctx, -5, 0, 6, 0, 4.2, '#efe6d2');
  for (let x = -4; x < 6; x += 2.2) line(ctx, [x, -1.8, x + 1.4, 1.8], '#b8ae98', 0.6);
  blob(ctx, -5.6, 0, 1.6, 2.5, { fill: '#f6f0e0', outlineW: 1.4 });
  ring(ctx, -5.6, 0, 0.7, 1.2, '#b8ae98', 0.5);
  // origami facets with red-ink edges
  poly(ctx, [7, -3.6, 22, -3.2, 31, 0, 7, 0], '#fbfaf6', OUTLINE, 0);
  poly(ctx, [7, 0, 31, 0, 22, 3.2, 7, 3.6], '#d9d6ce', OUTLINE, 0);
  poly(ctx, [14, -3.4, 18.5, 0, 14, 3.4, 11, 0], '#ebe8e0', OUTLINE, 0);
  clipDo(ctx, DAGGER, () => {
    line(ctx, [7, 0, 31, 0], '#a8a49a', 0.6);
    line(ctx, [22, -3.2, 26, 0, 22, 3.2], '#b8b4aa', 0.5);
    line(ctx, [7, -3.6, 22, -3.2, 31, 0, 22, 3.2, 7, 3.6], '#c8202a', 2.2);
  });
  outlineOf(ctx, DAGGER, 1.8);
  // folded wings for a guard
  poly(ctx, [5, 0, 8, -7.5, 9.5, -1], '#f6f4ee', OUTLINE, 1.3);
  poly(ctx, [5, 0, 8, 7.5, 9.5, 1], '#dedbd2', OUTLINE, 1.3);
  line(ctx, [6, -0.5, 8, -6], '#c8202a', 0.5);
  // a fresh red drop off the tip, and a glint running the edge
  const up = worldUp(ctx);
  drift(ctx, 30, 0, t, 1, [-up[0], -up[1]], 0, 10, 0.5, 3, (x, y, k) => dot(ctx, x, y, 1.1, '#c8202a', 1 - k));
  const k = frac(t * 0.8);
  glint(ctx, 8 + k * 22, -3.4 + k * 3.2, 2 * Math.sin(k * Math.PI), '#ffffff', 1);
}

function theFinePrint(ctx: Ctx, t: number): void {
  pommel(ctx, -5.4, 2.6, GOLD);
  grip(ctx, -4.5, 5, 4, '#e8dcc0', '#a89878');
  const pts = swordBlade(ctx, 8, 31, 7.4, { color: '#3a3a4a', tip: 8, fuller: null, taper: 0.8, edge: '#9aa0b8' });
  // rows of tiny gold text scrolling along the blade
  const off = (t * 4) % 6;
  clipDo(ctx, pts, () => {
    for (let r = 0; r < 3; r++) {
      const y = -1.9 + r * 1.9;
      for (let i = 0; i < 9; i++) {
        const x = 7 + i * 3.4 - off + (r % 2) * 1.2;
        const w = 1 + hash(i * 3.1 + r * 7) * 1.8;
        line(ctx, [x, y, x + w, y], '#e8c870', 0.6, 0.85);
      }
    }
  });
  // the asterisk
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3 + t;
    line(ctx, [26.5 - Math.cos(a) * 1.4, -1.8 - Math.sin(a) * 1.4, 26.5 + Math.cos(a) * 1.4, -1.8 + Math.sin(a) * 1.4], '#ffd27a', 0.6);
  }
  // a magnifying lens as the guard, enlarging the small print behind it
  ctx.save();
  ctx.beginPath();
  ctx.arc(9.5, 0, 4.4, 0, TAU);
  ctx.clip();
  ctx.fillStyle = '#4a5068';
  ctx.fillRect(4, -5, 11, 10);
  for (let r = 0; r < 2; r++) line(ctx, [6 - off * 0.6, -1.4 + r * 2.8, 9 - off * 0.6, -1.4 + r * 2.8, 10 - off * 0.6, -1.4 + r * 2.8], '#ffe08a', 1.1);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#9ad0ff';
  ctx.fillRect(4, -5, 11, 10);
  ctx.restore();
  ring(ctx, 9.5, 0, 4.4, 4.4, OUTLINE, 3.4);
  ring(ctx, 9.5, 0, 4.4, 4.4, GOLD, 1.6);
  glint(ctx, 8, -1.8, 1 + pulse(t, 3) * 1.3, '#ffffff', 0.9);
}

function mrAndMrsStabby(ctx: Ctx, t: number): void {
  pommel(ctx, -5.4, 2.6, '#f4eef4');
  grip(ctx, -4.5, 5, 4, '#f4a0c0', '#c86a90');
  // half wedding dress, half tuxedo
  trace(ctx, DAGGER);
  ctx.fillStyle = '#f6f2f6';
  ctx.fill();
  clipDo(ctx, DAGGER, () => {
    ctx.fillStyle = '#2a2630';
    ctx.fillRect(6, 0, 30, 6);
    for (let x = 9; x < 24; x += 2.6) ring(ctx, x, -0.2, 1.2, 1, '#d8c8e0', 0.6, 1, 0, Math.PI);
    line(ctx, [7, -3.6, 22, -3.2, 31, 0], '#ffffff', 1.4);
    line(ctx, [14, 0.6, 15.5, 2.4, 17, 0.6], '#f6f2f6', 0.7);
  });
  outlineOf(ctx, DAGGER, 1.8);
  // a bow-tie guard
  poly(ctx, [6, 0, 3.6, -5.6, 8.4, -5.6], '#c8202a', OUTLINE, 1.3);
  poly(ctx, [6, 0, 3.6, 5.6, 8.4, 5.6], '#c8202a', OUTLINE, 1.3);
  blob(ctx, 6, 0, 1.4, 1.6, { fill: '#e83a3a', outlineW: 1.2 });
  // the ring, on the blade
  ring(ctx, 12.5, 0, 1.6, 4.6, OUTLINE, 2.8);
  ring(ctx, 12.5, 0, 1.6, 4.6, GOLD, 1.3);
  plate(ctx, [12.5, -7.6, 14, -6, 12.5, -4.6, 11, -6], '#bfe8ff', { ow: 1, under: null });
  glint(ctx, 12.5, -6.2, 1.4 + pulse(t, 5) * 1.6, '#ffffff', 1);
  // love is in the air
  const up = worldUp(ctx);
  drift(ctx, 24, 0, t, 2, up, 8, 18, 0.45, 6, (x, y, k) => heart(ctx, x, y, 1.6 + k * 0.6, '#ff6a9a', 0.9, 1 - k));
}

// ---------------------------------------------------------------------------------------------
// Rapier: Strongly Worded Letter, En Garde, The Point
// ---------------------------------------------------------------------------------------------

function stronglyWordedLetter(ctx: Ctx, t: number): void {
  pommel(ctx, -6.5, 2.7, '#2a2a3a');
  grip(ctx, -5, 5, 3.6, '#1a1a2a', GOLD);
  // a black-lacquer blade with a cursive gold flourish, ending in a fountain-pen nib
  swordBlade(ctx, 7, 56, 4, { color: '#2a2a3a', tip: 3, fuller: null, taper: 0.95, edge: '#8a8aaa', ow: 2 });
  const wv: number[] = [];
  for (let x = 11; x <= 52; x += 1) wv.push(x, Math.sin(x * 0.85) * 0.9 - Math.max(0, Math.sin(x * 0.42)) * 0.4);
  line(ctx, wv, '#e8c870', 0.5);
  plate(ctx, [53, -2.7, 57.5, -3, 64, 0, 57.5, 3, 53, 2.7], GOLD, { ow: 1.6, under: '#b08a2a', splitY: 0.5 });
  line(ctx, [58, 0, 63.4, 0], OUTLINE, 0.7);
  dot(ctx, 57.6, 0, 0.8, OUTLINE);
  // a quill feather for a swept guard
  ctx.beginPath();
  ctx.moveTo(7.5, -0.5);
  ctx.quadraticCurveTo(5, -12, -9, -15.5);
  ctx.quadraticCurveTo(-1, -9.5, 6.5, 1.5);
  ctx.closePath();
  fillPath(ctx, '#f4f0e6', 1.6);
  line(ctx, [7, 0.5, 2, -8, -8, -15], '#b8b0a0', 0.8);
  for (let i = 0; i < 5; i++) {
    const k = 0.15 + i * 0.16;
    const x = 7 - k * 15;
    const y = 0.5 - k * 15.5 + k * k * 4;
    line(ctx, [x, y, x - 2.6, y + 2], '#c8c0b0', 0.5);
  }
  // ink, dripping
  const up = worldUp(ctx);
  drift(ctx, 63, 0, t, 2, [-up[0], -up[1]], 1, 12, 0.6, 5, (x, y, k) => dot(ctx, x, y, 1.2 - k * 0.4, '#1a1a4a', 1 - k));
  glint(ctx, 59, -1.4, 1 + pulse(t, 4) * 1.4, '#fffbe0', 0.9);
}

function enGarde(ctx: Ctx, t: number): void {
  // a red rose tied below the guard
  cord(ctx, [5, 3, 1, 7, -3, 9.5], '#3a8a3a', 1, 0.8);
  blob(ctx, 1.4, 7.6, 1.8, 1, { fill: '#58b858', outlineW: 1 }, 0.9);
  blob(ctx, -3.4, 9.8, 2.8, 2.6, { fill: '#c8202a', outlineW: 1.6 });
  ring(ctx, -3.4, 9.8, 1.4, 1.2, '#8a1018', 0.7, 1, 0, Math.PI * 1.6);
  pommel(ctx, -6.5, 2.4, '#c9ced6');
  grip(ctx, -5, 4.5, 3.4, '#3a2a22', '#c9ced6');
  // a flexible foil, flexing
  const bend = Math.sin(t * 3) * 1.6;
  ctx.save();
  ctx.lineCap = 'round';
  for (const [c, w] of [
    [OUTLINE, 3.8],
    ['#dfe4ea', 1.8],
    ['#ffffff', 0.6],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(8, w < 1 ? -0.4 : 0);
    ctx.quadraticCurveTo(36, bend, 62, bend * 1.8);
    ctx.stroke();
  }
  ctx.restore();
  dot(ctx, 62.5, bend * 1.8, 2, OUTLINE);
  dot(ctx, 62.5, bend * 1.8, 1.1, '#c9ced6');
  // the bell guard
  blob(ctx, 7, 0, 2.8, 9, { fill: '#d6dae0', under: '#9aa0a8', outlineW: 2 });
  ring(ctx, 7.6, 0, 1.4, 6.6, '#ffffff', 0.7, 0.7, -Math.PI / 2, Math.PI / 2);
  spec(ctx, 6.4, -5, 1);
  // touché
  const k = frac(t * 0.6);
  glint(ctx, 10 + k * 50, bend * k * k * 1.8, 2.4 * Math.sin(k * Math.PI), '#ffffff', 1);
  glint(ctx, 62.5, bend * 1.8, 1 + pulse(t, 6) * 2, '#fff3d0', 0.9);
}

function thePoint(ctx: Ctx, t: number): void {
  pommel(ctx, -6, 2.4, '#e8ecf0');
  grip(ctx, -5, 4.5, 3.4, '#2a2a32', '#e8ecf0');
  // a needle with ruler marks, all leading to the point
  plate(ctx, [8, -1.4, 60, -0.45, 66, 0, 60, 0.45, 8, 1.4], '#f0f4f8', { ow: 1.6, splitY: 0 });
  for (let x = 12; x <= 58; x += 4) line(ctx, [x, -1.2 + (x - 8) * 0.017, x, (x % 8 === 4 ? 0.3 : -0.3)], '#4a5060', 0.5);
  ring(ctx, 7, 0, 2, 7, OUTLINE, 3.6);
  ring(ctx, 7, 0, 2, 7, '#e8ecf0', 1.8);
  dot(ctx, 7, -7, 1.4, '#3f8cff');
  // the point itself
  const p = pulse(t, 4);
  glow(ctx, 66, 0, 12 + p * 5, '#fff3d0', 0.6);
  ctx.save();
  ctx.translate(66, 0);
  ctx.rotate(t * 1.2);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const r = i % 2 ? 7 : 11;
    line(ctx, [Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * r, Math.sin(a) * r], '#ffe9b0', 0.6, 0.6 + 0.4 * p);
  }
  glint(ctx, 0, 0, 5.5 + p * 2, '#ffffff', 1);
  ctx.rotate(Math.PI / 4);
  glint(ctx, 0, 0, 3 + p, '#ffd27a', 0.9);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Katana: Moonlight Shift, Overtime, Folded Laundry
// ---------------------------------------------------------------------------------------------

function katanaPath(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(12, -2.8);
  ctx.quadraticCurveTo(40, -6.5, 63, -10.5);
  ctx.quadraticCurveTo(62, -6, 57.5, -4);
  ctx.quadraticCurveTo(38, 2.4, 12, 3);
  ctx.closePath();
}

function katanaOutline(ctx: Ctx): void {
  katanaPath(ctx);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function qb(a: number, b: number, c: number, s: number): number {
  const u = 1 - s;
  return u * u * a + 2 * u * s * b + s * s * c;
}

/** A point across the katana blade: s along (0 hilt → 1 tip), k across (0 spine → 1 edge). */
function katanaAt(s: number, k: number): [number, number] {
  const xt = qb(12, 40, 63, s);
  const yt = qb(-2.8, -6.5, -10.5, s);
  const xb = qb(12, 38, 57.5, s);
  const yb = qb(3, 2.4, -4, s);
  return [xt + (xb - xt) * k, yt + (yb - yt) * k];
}

function hamon(ctx: Ctx, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(12, 6);
  for (let i = 0; i <= 16; i++) {
    const [x, y] = katanaAt(i / 16, 0.45 + Math.sin(i * 1.9) * 0.1);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(70, -10);
  ctx.lineTo(70, 6);
  ctx.closePath();
  ctx.fill();
}

function tsuka(ctx: Ctx, cordColor: string, diamond: string, cap: string): void {
  limb(ctx, -9, 0, 8, 0, 4.6, cordColor);
  ctx.fillStyle = diamond;
  for (let x = -7.5; x < 6; x += 3.2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 1.6, -1.5);
    ctx.lineTo(x + 3.2, 0);
    ctx.lineTo(x + 1.6, 1.5);
    ctx.closePath();
    ctx.fill();
  }
  plate(ctx, [-11.5, -2.8, -9, -2.8, -9, 2.8, -11.5, 2.8], cap, { ow: 1.5 });
}

function moonlightShift(ctx: Ctx, t: number): void {
  const p = pulse(t, 2);
  glow(ctx, 48, -5, 18 + p * 3, '#9ad0ff', 0.3);
  tsuka(ctx, '#1a2a4a', '#cfd8e8', '#c9ced6');
  katanaPath(ctx);
  ctx.fillStyle = '#b8cdf0';
  ctx.fill();
  ctx.save();
  ctx.clip();
  hamon(ctx, '#eef4ff');
  line(ctx, [12, 3, 38, 2.4, 57.5, -4], '#9ad0ff', 2.4, 0.5 + 0.4 * p);
  ctx.restore();
  katanaOutline(ctx);
  // starlight drifting along the blade
  for (let i = 0; i < 4; i++) {
    const k = frac(t * 0.3 + i / 4);
    const [x, y] = katanaAt(0.08 + k * 0.84, 0.3 + 0.3 * hash(i));
    glint(ctx, x, y, 2.2 * Math.sin(k * Math.PI), '#ffffff', 1);
  }
  // a crescent-moon tsuba and silver habaki
  plate(ctx, [11, -3, 14, -3.2, 14, 3.2, 11, 3], '#d6dae0', { ow: 1.5 });
  ctx.beginPath();
  ctx.arc(9.5, 0, 7, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(11.2, 0, 5.8, Math.PI * 1.36, Math.PI * 0.64, true);
  ctx.closePath();
  fillPath(ctx, '#f0e4a0', 1.6);
  glint(ctx, 5, -2, 1 + p * 1.2, '#ffffff', 0.8);
}

function overtime(ctx: Ctx, t: number): void {
  tsuka(ctx, '#6a1a1a', '#e8c0a0', '#2a2a2a');
  // afterimages: it never stops working
  for (const k of [2, 1]) {
    ctx.save();
    ctx.globalAlpha *= 0.16 * (3 - k);
    ctx.translate(-k * 2.4, k * 1.8);
    katanaPath(ctx);
    ctx.fillStyle = '#ff7a3a';
    ctx.fill();
    ctx.restore();
  }
  katanaPath(ctx);
  ctx.fillStyle = '#c8ccd4';
  ctx.fill();
  ctx.save();
  ctx.clip();
  hamon(ctx, '#fff0e0');
  line(ctx, [12, 3, 38, 2.4, 57.5, -4, 63, -10.5], '#ff7a3a', 2.4, 0.4 + 0.4 * pulse(t, 5));
  ctx.restore();
  katanaOutline(ctx);
  plate(ctx, [11, -3, 14, -3.2, 14, 3.2, 11, 3], GOLD, { ow: 1.5 });
  // a clock-face tsuba, hands racing
  blob(ctx, 8.5, 0, 6.6, 6.6, { fill: '#f4f0e6', under: '#d8d2c4', outlineW: 2 });
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    const r0 = i % 3 ? 5 : 4.2;
    line(ctx, [8.5 + Math.cos(a) * r0, Math.sin(a) * r0, 8.5 + Math.cos(a) * 5.6, Math.sin(a) * 5.6], OUTLINE, 0.6);
  }
  line(ctx, [8.5, 0, 8.5 + Math.cos(t * 0.7) * 2.8, Math.sin(t * 0.7) * 2.8], OUTLINE, 1.1);
  line(ctx, [8.5, 0, 8.5 + Math.cos(t * 8) * 4.4, Math.sin(t * 8) * 4.4], OUTLINE, 0.7);
  line(ctx, [8.5, 0, 8.5 + Math.cos(t * 20) * 4.6, Math.sin(t * 20) * 4.6], '#d42a2a', 0.5);
  dot(ctx, 8.5, 0, 0.8, '#d42a2a');
}

function foldedLaundry(ctx: Ctx, t: number): void {
  // a striped sock pulled over the grip
  limb(ctx, -9.5, 0, 8, 0, 5, '#f4f4f4');
  clipDo(ctx, [-12, -3, 9, -3, 9, 3, -12, 3], () => {
    for (let x = -8; x < 8; x += 4) {
      ctx.fillStyle = (x / 4) % 2 ? '#4a8ad0' : '#e05a6a';
      ctx.fillRect(x, -3, 1.6, 6);
    }
  });
  blob(ctx, -10, 0, 2.6, 3.2, { fill: '#4a8ad0', outlineW: 1.5 });
  // a blade of neatly folded fabric
  const bands = ['#f4b0c4', '#a8e0c8', '#a8c8f0', '#f4e090'];
  katanaPath(ctx);
  ctx.fillStyle = bands[0]!;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let b = 1; b < 4; b++) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const [x, y] = katanaAt(i / 12, b / 4);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.lineTo(70, 10);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fillStyle = bands[b]!;
    ctx.fill();
  }
  for (const s of [0.3, 0.62]) {
    const [x0, y0] = katanaAt(s, 0);
    const [x1, y1] = katanaAt(s + 0.03, 0.5);
    const [x2, y2] = katanaAt(s, 1);
    line(ctx, [x0, y0, x1, y1, x2, y2], 'rgba(60,40,60,0.35)', 0.7);
  }
  ctx.restore();
  katanaOutline(ctx);
  // a clothes-peg tsuba
  plate(ctx, [7.5, -8.5, 11, -8.5, 11, 8.5, 7.5, 8.5], '#d8b080', { ow: 1.6, under: '#b8905a', splitY: 0 });
  line(ctx, [9.25, -8, 9.25, 8], '#8a6a3a', 0.6);
  ring(ctx, 9.25, 0, 2, 2, OUTLINE, 2.2);
  ring(ctx, 9.25, 0, 2, 2, '#c9ced6', 1);
  // soap bubbles
  const up = worldUp(ctx);
  drift(ctx, 36, -3, t, 4, up, 26, 18, 0.35, 8, (x, y, k) => {
    const r = 1.4 + hash(x * 0.1) * 0 + k * 1.6;
    ring(ctx, x, y, r, r, '#bfe4ff', 0.7, 0.9 * (1 - k));
    dot(ctx, x - r * 0.35, y - r * 0.35, 0.45, '#ffffff', 1 - k);
  });
}

// ---------------------------------------------------------------------------------------------
// Bow: Long Distance Relationship, Return to Sender, Cupid Retired
// (bow geometry: an arc round (−6, 0), radius 26, tips at (2.2, ±24.7), grip at x ≈ 20)
// ---------------------------------------------------------------------------------------------

function limbs(ctx: Ctx, color: string, tipColor: string, w = 3.5, stripes?: readonly string[]): void {
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
  if (stripes) {
    ctx.lineCap = 'butt';
    stripes.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.setLineDash([2.6, 2.6 * (stripes.length * 2 - 1)]);
      ctx.lineDashOffset = -i * 5.2;
      ctx.beginPath();
      ctx.arc(-6, 0, 26, -1.25, 1.25);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
  }
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

function longDistance(ctx: Ctx, t: number, charge: number): void {
  // a ribbon trailing from the lower tip
  const rib: number[] = [];
  for (let i = 0; i < 7; i++) rib.push(5 - i * 3.2, 28 + i * 1.8 + Math.sin(t * 4 - i * 0.9) * (0.4 + i * 0.3));
  cord(ctx, rib, '#ff6a9a', 1.8, 1);
  limbs(ctx, '#e0507a', '#ffd0dc');
  const mx = bowString(ctx, charge, '#ffd0dc', false);
  if (charge > 0.03) {
    line(ctx, [mx, 0, 30, 0], OUTLINE, 3);
    line(ctx, [mx, 0, 30, 0], '#f4e0e8', 1.3);
    heart(ctx, 32, 0, 2.6, '#ff3b6a', 1.2, 1, -Math.PI / 2);
  }
  heart(ctx, 20.2, 0, 5.4, '#d42a5a', 1.8, 1, Math.PI / 2);
  spec(ctx, 18.6, -2.4, 1);
  // a heart sent a long, long way
  const k = frac(t * 0.45);
  heart(ctx, 26 + k * 44, Math.sin(k * 9) * 2, 2.8 * (1 - k * 0.5), '#ff6a9a', 1.1, Math.sin(k * Math.PI), -Math.PI / 2);
}

function returnToSender(ctx: Ctx, t: number, charge: number): void {
  limbs(ctx, '#f4f0e6', '#d42a2a', 3.6, ['#d42a2a', '#2a5ac8']);
  // a postage-stamp grip, postmarked
  plate(ctx, [16.4, -5.4, 23.8, -5.4, 23.8, 5.4, 16.4, 5.4], '#f6eed8', { ow: 1.4, under: null });
  for (let i = 0; i <= 5; i++) {
    dot(ctx, 16.4, -5.4 + i * 2.16, 0.55, OUTLINE);
    dot(ctx, 23.8, -5.4 + i * 2.16, 0.55, OUTLINE);
  }
  plate(ctx, [17.6, -4, 22.6, -4, 22.6, 4, 17.6, 4], '#5a9ad8', { ow: 0.6, under: null });
  poly(ctx, [17.6, 4, 20.1, 0, 22.6, 4], '#3a7a4a', OUTLINE, 0);
  dot(ctx, 21.4, -2, 1, '#ffd27a');
  for (let i = 0; i < 3; i++) {
    const pts: number[] = [];
    for (let x = 13; x <= 28; x += 1) pts.push(x, -3 + i * 2.2 + Math.sin(x * 0.9) * 0.6);
    line(ctx, pts, '#2a2a3a', 0.5, 0.55);
  }
  bowString(ctx, charge);
  // a paper aeroplane looping round
  const a = t * 1.4;
  const px = 10 + Math.cos(a) * 16;
  const py = Math.sin(a) * 31;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(Math.cos(a) * 31, -Math.sin(a) * 16));
  poly(ctx, [4, 0, -3.5, -3, -2, 0, -3.5, 3], '#ffffff', OUTLINE, 1.1);
  line(ctx, [4, 0, -2, 0], '#a0a8b8', 0.5);
  ctx.restore();
}

function cupidRetired(ctx: Ctx, t: number, charge: number): void {
  const flap = Math.sin(t * 2) * 0.25;
  limbs(ctx, '#c8a040', '#f0d070');
  // tired little wings at the tips, flapping slowly
  for (const s of [-1, 1]) {
    const base = Math.atan2(s * 0.9, -1) - s * flap;
    for (let i = 2; i >= 0; i--) {
      const a = base + s * (i - 1) * 0.42;
      const r = 4.6 - i * 0.4;
      blob(ctx, 3.5 + Math.cos(a) * r, s * 27 + Math.sin(a) * r, 4.4 - i * 0.6, 1.7, { fill: '#ffffff', under: '#dfe4ee', outlineW: 1.1 }, a);
    }
  }
  plate(ctx, [17.4, -4.6, 22.8, -4.6, 22.8, 4.6, 17.4, 4.6], '#b03a3a', { ow: 1.4 });
  for (let y = -3; y <= 3; y += 2) line(ctx, [18.4, y - 0.8, 20.1, y + 0.4, 21.8, y - 0.8], '#7a2020', 0.6);
  bowString(ctx, charge);
  // reading glasses perched on the grip
  ring(ctx, 25.4, -2.6, 2, 2, OUTLINE, 1.8);
  ring(ctx, 25.4, 2.6, 2, 2, OUTLINE, 1.8);
  ring(ctx, 25.4, -2.6, 2, 2, GOLD, 0.8);
  ring(ctx, 25.4, 2.6, 2, 2, GOLD, 0.8);
  dot(ctx, 25.4, -2.6, 1.5, '#bfe4ff', 0.4);
  dot(ctx, 25.4, 2.6, 1.5, '#bfe4ff', 0.4);
  // … and a nap
  const up = worldUp(ctx);
  drift(ctx, 12, 0, t, 3, up, 8, 22, 0.3, 1, (x, y, k, i) => {
    ctx.save();
    ctx.globalAlpha *= Math.sin(k * Math.PI);
    text(ctx, i % 2 ? 'Z' : 'z', x, y, 4 + k * 4, '#ffe9b0', Math.atan2(up[0], -up[1]));
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------------------------
// Whip: Middle Management, The Long Reach, Snap Decision
// ---------------------------------------------------------------------------------------------

function middleManagement(ctx: Ctx, t: number): void {
  pommel(ctx, -1.5, 3, '#c9ced6');
  grip(ctx, 0, 10, 5, '#222226', '#000000');
  line(ctx, [2, -3.4, 8, -3.4], '#e8ecf0', 1);
  // the necktie, widening to its point
  const top: number[] = [];
  const bot: number[] = [];
  let lx = 0;
  let ly = 0;
  for (let i = 0; i <= 8; i++) {
    const x = 13 + i * 5.6;
    const y = Math.sin(i * 0.8 + t * 2.5) * (0.6 + i * 0.4);
    const hw = 1.6 + i * 0.26;
    top.push(x, y - hw);
    bot.unshift(x, y + hw);
    lx = x;
    ly = y;
  }
  const tie = [...top, lx + 4.5, ly, ...bot];
  trace(ctx, tie);
  ctx.fillStyle = '#24346a';
  ctx.fill();
  clipDo(ctx, tie, () => {
    ctx.strokeStyle = '#e8c04a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 10; x < 70; x += 4.5) {
      ctx.moveTo(x, -8);
      ctx.lineTo(x + 8, 8);
    }
    ctx.stroke();
    ctx.strokeStyle = '#c8202a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 12; x < 70; x += 4.5) {
      ctx.moveTo(x, -8);
      ctx.lineTo(x + 8, 8);
    }
    ctx.stroke();
  });
  outlineOf(ctx, tie, 2);
  plate(ctx, [10, -3.2, 14.5, -2.4, 14.5, 2.4, 10, 3.2], '#24346a', { ow: 1.8, under: '#18244a', splitY: 0 });
  // a lanyard and ID badge
  const [bx, by] = dangle(ctx, 6, 2.5, 7, t, '#2a5ac8', 2, 0.4);
  ctx.save();
  ctx.translate(bx, by);
  const up = worldUp(ctx);
  ctx.rotate(Math.atan2(up[0], -up[1]) + Math.sin(t * 2) * 0.4);
  plate(ctx, [-2.4, 0, 2.4, 0, 2.4, 6, -2.4, 6], '#ffffff', { ow: 1.1, under: null });
  ctx.fillStyle = '#2a5ac8';
  ctx.fillRect(-2, 0.4, 4, 1.4);
  dot(ctx, -0.8, 3.6, 0.9, '#e8c9a0');
  line(ctx, [0.6, 3.2, 1.8, 3.2], '#8a919c', 0.5);
  line(ctx, [0.6, 4.4, 1.8, 4.4], '#8a919c', 0.5);
  ctx.restore();
}

function theLongReach(ctx: Ctx, t: number): void {
  // a reacher-grabber pistol grip
  plate(ctx, [-6, -2.6, 9, -2.6, 12, -3.4, 12, 3.4, 9, 2.6, 4.5, 2.8, 1.5, 7.5, -2, 7.5, -1.5, 2.6, -6, 2.6], '#ff7a1a', { ow: 2, under: '#d85a0a', splitY: 1 });
  line(ctx, [5.5, 3, 6.5, 6, 8.5, 6.4], OUTLINE, 1.2);
  // a long telescoping chain
  const pts: number[] = [];
  const n = 11;
  for (let i = 0; i <= n; i++) pts.push(12 + i * 5.4, Math.sin(i * 0.7 + t * 2.4) * (0.5 + i * 0.32));
  for (let i = 0; i < n; i++) {
    const x0 = pts[i * 2]!;
    const y0 = pts[i * 2 + 1]!;
    const x1 = pts[i * 2 + 2]!;
    const y1 = pts[i * 2 + 3]!;
    ctx.save();
    ctx.translate((x0 + x1) / 2, (y0 + y1) / 2);
    ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (i % 2) ctx.ellipse(0, 0, 3.4, 1.6, 0, 0, TAU);
    else {
      ctx.moveTo(-3.2, 0);
      ctx.lineTo(3.2, 0);
    }
    ctx.stroke();
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
  // the claw, snapping
  const ex = pts[n * 2]!;
  const ey = pts[n * 2 + 1]!;
  const ang = Math.atan2(ey - pts[n * 2 - 1]!, ex - pts[n * 2 - 2]!);
  const open = 0.15 + 0.35 * pulse(t, 3);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(ang);
  plate(ctx, [-1.5, -2.6, 2.5, -2.6, 2.5, 2.6, -1.5, 2.6], '#ff7a1a', { ow: 1.4 });
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(2.5, s * 1.4);
    ctx.rotate(s * open);
    plate(ctx, [0, -s * 0.6, 5, -s * 1.6, 8, s * 0.4, 6.5, s * 1.4, 4.5, s * 0.2, 0, s * 1.2], '#c9ced6', { ow: 1.3, under: null });
    ctx.restore();
  }
  ctx.restore();
}

function snapDecision(ctx: Ctx, t: number): void {
  // a coin, flipping, for a pommel
  const cw = Math.abs(Math.cos(t * 6)) * 3.2 + 0.4;
  blob(ctx, -2.6, 0, cw, 3.4, { fill: '#f0c84a', under: '#c8962a', outlineW: 1.4 });
  if (cw > 2) dot(ctx, -2.6, 0, 1, '#c8962a');
  grip(ctx, 0, 10, 5, '#1a1a22', GOLD);
  band(ctx, 10.5, 2, 5.6, GOLD);
  // a lash of lightning, re-striking every few frames
  const seg = Math.floor(t * 14);
  const pts: number[] = [11.5, 0];
  for (let i = 1; i <= 9; i++) {
    const x = 11.5 + i * 5.4;
    const y = (hash(i * 13.1 + seg * 7.7) - 0.5) * (2 + i * 0.7) + Math.sin(i * 0.9 + t * 2.5) * (1 + i * 0.4) * 0.6;
    pts.push(x, y);
  }
  for (let i = 2; i < pts.length; i += 6) glow(ctx, pts[i]!, pts[i + 1]!, 7, '#7cc4ff', 0.35);
  line(ctx, pts, '#3f8cff', 4.2, 0.55);
  line(ctx, pts, '#bfe4ff', 2);
  line(ctx, pts, '#ffffff', 0.8);
  const bi = 8 + 2 * (seg % 3);
  const bx = pts[bi]!;
  const by = pts[bi + 1]!;
  line(ctx, [bx, by, bx + 3, by + (hash(seg) - 0.5) * 8, bx + 6, by + (hash(seg + 1) - 0.5) * 10], '#bfe4ff', 0.8, 0.8);
  const ex = pts[pts.length - 2]!;
  const ey = pts[pts.length - 1]!;
  glow(ctx, ex, ey, 9, '#bfe4ff', 0.6);
  for (let i = 0; i < 5; i++) {
    const a = hash(i + seg * 3.3) * TAU;
    const r = 2 + hash(i * 2 + seg) * 3.5;
    line(ctx, [ex, ey, ex + Math.cos(a) * r, ey + Math.sin(a) * r], '#ffffff', 0.6);
  }
}

// ---------------------------------------------------------------------------------------------
// Longsword: Employee of the Month, Plot Armor, Exactly As Long As It Needs To Be
// ---------------------------------------------------------------------------------------------

function employeeOfTheMonth(ctx: Ctx, t: number): void {
  pommel(ctx, -8.2, 3.4, GOLD);
  grip(ctx, -6, 7.5, 4.5, '#2a3a6a', GOLD);
  const pts = swordBlade(ctx, 11, 64, 8, { tip: 10, taper: 0.82, color: '#d6dbe2', edge: '#fff6c8' });
  clipDo(ctx, pts, () => line(ctx, [11, -4, 54, -3.3, 64, 0, 54, 3.3, 11, 4], GOLD, 2));
  outlineOf(ctx, pts, 2);
  // the framed photo, smiling
  plate(ctx, [14, -5.6, 25.5, -5.6, 25.5, 5.6, 14, 5.6], GOLD, { ow: 1.6, under: '#b08a2a', splitY: 3 });
  plate(ctx, [15.6, -4, 23.9, -4, 23.9, 4, 15.6, 4], '#9ad0ff', { ow: 0.8, under: null });
  ctx.save();
  trace(ctx, [15.6, -4, 23.9, -4, 23.9, 4, 15.6, 4]);
  ctx.clip();
  blob(ctx, 19.75, 4.6, 3.4, 2, { fill: '#2a5ac8', outlineW: 0.8 });
  blob(ctx, 19.75, 0.4, 2.5, 2.5, { fill: '#e8c9a0', outlineW: 0.8 });
  dot(ctx, 18.9, 0, 0.35, OUTLINE);
  dot(ctx, 20.6, 0, 0.35, OUTLINE);
  ring(ctx, 19.75, 0.9, 1.1, 0.8, OUTLINE, 0.4, 1, 0.3, Math.PI - 0.3);
  ctx.restore();
  crossguard(ctx, 9.5, 11, 3.4, GOLD, 2.2);
  star(ctx, 9.5, 0, 3.2, '#ffe14a', 5, 0.45, -Math.PI / 2, 1);
  // a first-place rosette hanging off the guard
  const [rx, ry] = dangle(ctx, 9.5, 11, 5, t, '#2a5ac8', 2, 0.3);
  poly(ctx, [rx - 1, ry, rx - 2.4, ry + 6, rx - 0.6, ry + 5, rx, ry + 1], '#2a5ac8', OUTLINE, 0.8);
  poly(ctx, [rx + 1, ry, rx + 2.4, ry + 6, rx + 0.6, ry + 5, rx, ry + 1], '#2a5ac8', OUTLINE, 0.8);
  star(ctx, rx, ry, 3.6, '#4a7ae0', 10, 0.75, 0, 1);
  dot(ctx, rx, ry, 1.5, GOLD);
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.6 + i / 3);
    glint(ctx, 30 + i * 11, (i - 1) * 1.6, 2.2 * Math.sin(k * Math.PI), '#ffffff', 1);
  }
}

function plotArmor(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.2);
  // the protagonist's bubble
  ring(ctx, 36, 0, 33 + p * 1.5, 10 + p, '#ffe98a', 1.2, 0.3 + 0.3 * p);
  for (let i = 0; i < 4; i++) {
    const a = t * 0.9 + (i * TAU) / 4;
    glint(ctx, 36 + Math.cos(a) * (33 + p * 1.5), Math.sin(a) * (10 + p), 1.8, '#fff6c8', 0.8);
  }
  pommel(ctx, -8.2, 3.4, '#8a919c');
  grip(ctx, -6, 7.5, 4.5, '#3a2a22');
  // a blade clad in overlapping lames
  const pts = [11, -4.6, 54, -3.9, 65, 0, 54, 3.9, 11, 4.6];
  plate(ctx, pts, '#a8aeb8', { under: '#8a909a', splitY: 0 });
  clipDo(ctx, pts, () => {
    for (let x = 13; x < 62; x += 5.5) {
      line(ctx, [x, -5, x + 2.2, 0, x, 5], '#5d626b', 1.3);
      line(ctx, [x + 0.9, -5, x + 3.1, 0, x + 0.9, 5], '#e0e4ea', 0.6);
      rivet(ctx, x + 3.6, -2.4, 0.6);
      rivet(ctx, x + 3.6, 2.4, 0.6);
    }
    line(ctx, [11, -4.6, 54, -3.9, 65, 0], '#f0f2f4', 1.4);
  });
  outlineOf(ctx, pts, 2);
  // a heater shield for a crossguard
  plate(ctx, [6.5, -9, 13, -9, 13, 3, 9.75, 9.5, 6.5, 3], '#a03030', { ow: 1.8, splitY: 2 });
  line(ctx, [9.75, -7.5, 9.75, 6.5], GOLD, 1.2);
  line(ctx, [7.6, -3, 11.9, -3], GOLD, 1.2);
  glint(ctx, 65, 0, 1.6 + p * 2, '#fff6c8', 0.9);
}

function exactlyAsLong(ctx: Ctx, t: number): void {
  blob(ctx, -8, 0, 2.4, 3, { fill: '#2a2a2a', outlineW: 1.8 });
  grip(ctx, -7, 5, 4.6, '#2a2a2a', '#000000');
  // the tape, measuring exactly as far as it has to
  const L = 63 + Math.sin(t * 1.3) * 2.5;
  const tape = [17, -3.3, L, -3.3, L, 3.3, 17, 3.3];
  plate(ctx, tape, '#f2c40c', { under: '#d8a800', splitY: 1.2, ow: 1.8 });
  // tick marks in one path; a red number every eighth
  ctx.beginPath();
  for (let x = 18, i = 0; x < L - 0.5; x += 1.5, i++) {
    const len = i % 4 === 0 ? 3.2 : i % 2 === 0 ? 1.8 : 1;
    ctx.moveTo(x, -3.3);
    ctx.lineTo(x, -3.3 + len);
  }
  ctx.lineWidth = 0.45;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  for (let i = 8; 18 + i * 1.5 < L - 2; i += 8) text(ctx, String(i / 4), 18 + i * 1.5, 1.7, 2.8, '#c8202a');
  sheen(ctx, tape, t, 17, L, '#ffffff', 0.5, 2.6, 3);
  plate(ctx, [L - 0.8, -4.4, L + 2.2, -4.4, L + 2.2, 4.4, L - 0.8, 4.4], '#9aa0a8', { ow: 1.4 });
  // the case is the guard
  plate(ctx, [6, -7.5, 16, -7.5, 18.5, -5, 18.5, 5, 16, 7.5, 6, 7.5, 3.5, 5, 3.5, -5], '#f2c40c', { ow: 2, under: '#d8a800', splitY: 2 });
  plate(ctx, [5, -7.4, 17, -7.4, 17, -5.6, 5, -5.6], '#2a2a2a', { ow: 0, under: null });
  plate(ctx, [5, 5.6, 17, 5.6, 17, 7.4, 5, 7.4], '#2a2a2a', { ow: 0, under: null });
  plate(ctx, [9, -9, 13, -9, 13, -7.4, 9, -7.4], '#d42a2a', { ow: 1 });
  blob(ctx, 11, 0, 2.2, 2.2, { fill: '#c9ced6', outlineW: 1.2 });
  line(ctx, [10, 0, 12, 0], OUTLINE, 0.6);
}

// ---------------------------------------------------------------------------------------------
// Spear: Social Distancing, The Ten-Foot Rule, Personal Space
// ---------------------------------------------------------------------------------------------

function spearHead(ctx: Ctx, color = STEEL): void {
  plate(ctx, [67, -3.2, 76, -2.4, 76, 2.4, 67, 3.2], IRON, { ow: 1.8 });
  plate(ctx, [74.5, -1.8, 79, -6.2, 86, -5.8, 97, 0, 86, 5.8, 79, 6.2, 74.5, 1.8], color, { edge: [79, -6.2, 86, -5.8, 97, 0], edgeColor: '#f6f8fa', edgeW: 0.8, ow: 2 });
  line(ctx, [76, 0, 94, 0], shade(color, 0.6), 0.9);
}

function socialDistancing(ctx: Ctx, t: number): void {
  // keep-back rings round the point
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.6 + i / 3);
    const r = 6 + k * 18;
    ring(ctx, 88, 0, r, r, '#ff5a5a', 1.6 * (1 - k) + 0.4, 0.7 * (1 - k));
  }
  // caution-tape shaft
  limb(ctx, -8, 0, 75, 0, 4.4, '#f2c40c');
  clipDo(ctx, [-9, -2.2, 76, -2.2, 76, 2.2, -9, 2.2], () => {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = -10; x < 76; x += 4.4) {
      ctx.moveTo(x, -2.5);
      ctx.lineTo(x + 2.6, 2.5);
    }
    ctx.stroke();
  });
  grip(ctx, -5, 10, 4.8, '#222226', '#000000');
  spearHead(ctx);
  // a stop sign for a guard
  const oct: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + Math.PI / 8;
    oct.push(70 + Math.cos(a) * 3.2, Math.sin(a) * 7.5);
  }
  plate(ctx, oct, '#d42a2a', { ow: 1.8, under: null });
  const inner = oct.map((v, i) => (i % 2 ? v * 0.78 : 70 + (v - 70) * 0.7));
  ctx.save();
  trace(ctx, inner);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.restore();
  line(ctx, [70, -3.6, 70, 3.6], '#ffffff', 1.4);
}

function tenFootRule(ctx: Ctx, t: number): void {
  // a surveyor's rod, marked off in feet
  limb(ctx, -8, 0, 76, 0, 4.4, '#f4f0e6');
  clipDo(ctx, [-9, -2.2, 77, -2.2, 77, 2.2, -9, 2.2], () => {
    for (let i = 0; i < 10; i++) {
      if (i % 2) {
        ctx.fillStyle = '#d42a2a';
        ctx.fillRect(-8 + i * 8.4, -3, 8.4, 6);
      }
      for (let j = 1; j < 4; j++) line(ctx, [-8 + i * 8.4 + j * 2.1, -2.2, -8 + i * 8.4 + j * 2.1, j === 2 ? 0 : -1], OUTLINE, 0.45);
    }
  });
  grip(ctx, -5, 7, 4.8, '#2a2a2a', '#000000');
  // a bubble level, its bubble drifting
  plate(ctx, [21, -3.4, 31, -3.4, 31, 3.4, 21, 3.4], '#c8a040', { ow: 1.5 });
  plate(ctx, [22.2, -2, 29.8, -2, 29.8, 2, 22.2, 2], '#9ae07a', { ow: 0.8, under: null });
  blob(ctx, 26 + Math.sin(t * 1.5) * 2.4, -0.2, 1.3, 0.9, { fill: '#f4fff0', outlineW: 0.5 });
  line(ctx, [24.8, -2, 24.8, 2], OUTLINE, 0.4);
  line(ctx, [27.2, -2, 27.2, 2], OUTLINE, 0.4);
  // a little orange survey flag
  const w = Math.sin(t * 4) * 1.4;
  poly(ctx, [66, -2, 65.5, -10.5, 58, -8.5 + w, 59, -2.5 + w * 0.4], '#ff7a1a', OUTLINE, 1.2);
  // a brass plumb-bob point
  ctx.beginPath();
  ctx.moveTo(73, -3.6);
  ctx.quadraticCurveTo(86, -6.5, 97, 0);
  ctx.quadraticCurveTo(86, 6.5, 73, 3.6);
  ctx.quadraticCurveTo(70.5, 0, 73, -3.6);
  ctx.closePath();
  fillPath(ctx, '#d4a84a', 2);
  line(ctx, [76, -2.8, 86, -3.4, 93, -1.4], '#fff0b0', 0.9);
  line(ctx, [78, -4.2, 78, 4.2], '#9a7a2a', 0.8);
  glint(ctx, 84, -2.6, 1 + pulse(t, 3) * 1.6, '#ffffff', 0.9);
}

function personalSpace(ctx: Ctx, t: number): void {
  const a = t * 1.2;
  const px = 84 + Math.cos(a) * 14;
  const py = Math.sin(a) * 5.5;
  const planet = (): void => {
    blob(ctx, px, py, 3, 3, { fill: '#e0905a', under: '#b0603a', outlineW: 1.2 });
    ring(ctx, px, py, 5.4, 1.5, OUTLINE, 2, 1, 0, TAU, -0.35);
    ring(ctx, px, py, 5.4, 1.5, '#f0d8a0', 0.9, 1, 0, TAU, -0.35);
  };
  glow(ctx, 88, 0, 16 + pulse(t, 2) * 3, '#bfa0ff', 0.4);
  if (Math.sin(a) < 0) planet();
  // the night sky, on a stick
  limb(ctx, -8, 0, 75, 0, 4.4, '#1a1a40');
  for (let i = 0; i < 10; i++) dot(ctx, -3 + i * 8 + hash(i) * 4, (hash(i * 3) - 0.5) * 2, 0.6, '#ffffff', pulse(t, 3, i * 1.7));
  grip(ctx, -5, 9, 4.8, '#2a2a5a', '#101028');
  for (let i = 0; i < 3; i++) line(ctx, [60, (i - 1) * 1.8, 74, (i - 1) * 0.8], '#bfa0ff', 0.8, 0.4);
  // a star for a spearhead
  plate(ctx, [74, -2, 82, -3.2, 86, -9.5, 88.5, -3, 98, 0, 88.5, 3, 86, 9.5, 82, 3.2, 74, 2], '#f4f8ff', { ow: 2, under: '#d0d8f0', splitY: 0.5, edge: [82, -3.2, 86, -9.5, 88.5, -3, 98, 0], edgeColor: '#ffffff', edgeW: 0.7 });
  dot(ctx, 86, 0, 1.4, '#bfa0ff');
  if (Math.sin(a) >= 0) planet();
  glint(ctx, 98, 0, 1.6 + pulse(t, 5) * 1.8, '#ffffff', 0.9);
}

// ---------------------------------------------------------------------------------------------
// Battleaxe: Hostile Takeover, Chopping Block, Axe Me Anything
// ---------------------------------------------------------------------------------------------

function hostileTakeover(ctx: Ctx, t: number): void {
  haft(ctx, -7, 54, 5, '#1e1c22');
  grip(ctx, -7, 10, 5.6, '#2a2a30', GOLD);
  band(ctx, 14, 2.5, 7.5, GOLD);
  band(ctx, 36, 2.5, 7.5, GOLD);
  plate(ctx, [45, 3, 51, 3, 48.5, 13], GOLD, { ow: 2, splitY: 99 });
  // a black blade whose edge is a stock chart, only going up
  const edge = [31, -15, 34, -18.5, 37, -17, 41, -21, 45, -19.5, 49, -23.5, 53, -21.5, 58.5, -26.5];
  const bit = [46, -3, 44, -8, 38, -12, ...edge, 59, -17, 57, -10, 55, -3];
  trace(ctx, bit);
  ctx.fillStyle = '#4a4458';
  ctx.fill();
  clipDo(ctx, bit, () => {
    // pinstripes: it is wearing a suit
    for (let x = 28; x < 62; x += 3) line(ctx, [x, -2, x + 4, -28], '#6a6478', 0.6);
    line(ctx, bit, GOLD, 2.2);
    line(ctx, edge, '#ffe9a0', 3.2);
  });
  outlineOf(ctx, bit, 2.5);
  const tl =[34, -13.4, 37, -12.3, 41, -16, 45, -14.6, 49, -18.4, 53, -16.6, 56, -20.4];
  line(ctx, tl, '#58d66a', 1.4);
  const k = frac(t * 0.6);
  const seg = Math.min(5, Math.floor(k * 6));
  const f = k * 6 - seg;
  const gx = tl[seg * 2]! + (tl[seg * 2 + 2]! - tl[seg * 2]!) * f;
  const gy = tl[seg * 2 + 1]! + (tl[seg * 2 + 3]! - tl[seg * 2 + 1]!) * f;
  glow(ctx, gx, gy, 5, '#58d66a', 0.9);
  poly(ctx, [54.4, -23.6, 58.6, -24.2, 57.2, -19.8], '#e83a3a', OUTLINE, 1);
  plate(ctx, [42.5, -4.6, 55.5, -4.6, 55.5, 4.6, 42.5, 4.6], '#2a2a30', { ow: 2 });
  line(ctx, [43.5, -3.4, 54.5, -3.4], GOLD, 0.8);
  rivet(ctx, 46, 0, 1, GOLD);
  rivet(ctx, 52, 0, 1, GOLD);
  ctx.save();
  ctx.globalAlpha *= pulse(t, 2.5);
  text(ctx, '$', 49.5, -8.5, 5, GOLD);
  ctx.restore();
}

function choppingBlock(ctx: Ctx, t: number): void {
  haft(ctx, -7, 52, 5, '#9a6a3a');
  // a gingham grip
  limb(ctx, -7, 0, 10, 0, 5.6, '#ffffff');
  clipDo(ctx, [-8, -2.8, 11, -2.8, 11, 2.8, -8, 2.8], () => {
    ctx.fillStyle = 'rgba(212,42,42,0.75)';
    for (let x = -8; x < 11; x += 3.6) ctx.fillRect(x, -3, 1.8, 6);
    ctx.fillRect(-8, -0.9, 19, 1.8);
  });
  // a giant cleaver
  const cl = [35, -3.5, 34, -24.5, 58.5, -26, 59.5, -3.5];
  plate(ctx, cl, '#c9ced6', { under: null, edge: [34, -24.5, 58.5, -26], edgeColor: '#ffffff', edgeW: 1.5 });
  clipDo(ctx, cl, () => {
    line(ctx, [34, -21.5, 58.5, -22.8], '#8a919c', 0.9);
    for (let i = 0; i < 9; i++) dot(ctx, 40 + hash(i) * 17, -6 - hash(i * 2.7) * 13, 0.7, '#a8aeb8');
  });
  sheen(ctx, cl, t, 34, 60, '#ffffff', 0.45, 2.6, 4);
  ring(ctx, 38.5, -8.5, 2, 2, OUTLINE, 2.4);
  dot(ctx, 38.5, -8.5, 1.4, '#1c1924');
  plate(ctx, [33, -4.6, 61, -4.6, 61, 4.6, 33, 4.6], '#5a3a22', { ow: 2 });
  for (const x of [38, 47, 56]) rivet(ctx, x, 0, 1.1, '#c9ced6');
  // a butcher's tag on a string through the hole
  const [tx, ty] = dangle(ctx, 38.5, -8.5, 6, t, '#efe6d2', 2.4, 0.4);
  plate(ctx, [tx - 2, ty - 0.5, tx + 2, ty - 0.5, tx + 2, ty + 3.5, tx - 2, ty + 3.5], '#e8d8a8', { ow: 1, under: null });
  line(ctx, [tx - 1, ty + 1.5, tx + 1, ty + 1.5], '#c8202a', 0.6);
}

function axeMeAnything(ctx: Ctx, t: number): void {
  haft(ctx, -7, 52, 5, '#3a2a5a');
  grip(ctx, -7, 10, 5.6, '#5a3aa0', '#2a1a5a');
  const fl = 0.7 + 0.3 * Math.sin(t * 17) * Math.sin(t * 5.3);
  // the question-mark hook blade, outer edge in neon
  const hook: number[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * 0.95 + (i / 18) * Math.PI * 1.3;
    hook.push(49 + Math.cos(a) * 8.5, -15.5 + Math.sin(a) * 8.5);
  }
  hook.push(50, -9, 50, -4.5);
  const neon: number[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * 0.95 + (i / 18) * Math.PI * 1.25;
    neon.push(49 + Math.cos(a) * 11, -15.5 + Math.sin(a) * 11);
  }
  for (let i = 0; i < neon.length; i += 8) glow(ctx, neon[i]!, neon[i + 1]!, 8, '#5fe0ff', 0.35 * fl);
  line(ctx, hook, OUTLINE, 9.5);
  line(ctx, hook, '#6a4ac0', 6);
  line(ctx, neon, '#5fe0ff', 1.5, fl);
  line(ctx, neon, '#e8ffff', 0.6, fl);
  blob(ctx, 49.5, 11, 3.6, 3.6, { fill: '#6a4ac0', outlineW: 2 });
  ring(ctx, 49.5, 11, 4.8, 4.8, '#5fe0ff', 1, fl);
  plate(ctx, [43, -4.6, 55.5, -4.6, 55.5, 4.6, 43, 4.6], '#2a1a4a', { ow: 2 });
  rivet(ctx, 46.5, 0, 1);
  rivet(ctx, 52, 0, 1);
  const up = worldUp(ctx);
  drift(ctx, 49, -15, t, 2, up, 18, 20, 0.4, 5, (x, y, k) => {
    ctx.save();
    ctx.globalAlpha *= Math.sin(k * Math.PI) * fl;
    text(ctx, '?', x, y, 5 + k * 3, '#5fe0ff', Math.atan2(up[0], -up[1]));
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------------------------
// Mace: Sunday Best, Thoughts and Prayers, The Sermon
// ---------------------------------------------------------------------------------------------

function sundayBest(ctx: Ctx, t: number): void {
  haft(ctx, -7, 36, 4.6, '#f4f0e6');
  grip(ctx, -7, 10, 5.4, '#2a2a30', '#000000');
  pommel(ctx, -8.5, 2.8, GOLD);
  const cx = 44;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const c = Math.cos(a);
    const s = Math.sin(a);
    plate(ctx, [cx + c * 5 - s * 2.6, s * 5 + c * 2.6, cx + c * 13.5 - s * 1.4, s * 13.5 + c * 1.4, cx + c * 14.5, s * 14.5, cx + c * 13.5 + s * 1.4, s * 13.5 - c * 1.4, cx + c * 5 + s * 2.6, s * 5 - c * 2.6], '#f0c84a', { ow: 1.6, under: null });
    line(ctx, [cx + c * 7, s * 7, cx + c * 13.2, s * 13.2], '#fff8d8', 0.8, 0.8);
  }
  blob(ctx, cx, 0, 8, 8, { fill: '#f4d060', under: '#d0a830' });
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    dot(ctx, cx + Math.cos(a) * 5, Math.sin(a) * 5, 1.1, '#fffaf4');
  }
  // a top hat on the finial
  plate(ctx, [51.5, -6.5, 53.5, -6.5, 53.5, 6.5, 51.5, 6.5], '#1a1a22', { ow: 1.5, under: null });
  plate(ctx, [53.5, -4.2, 61, -3.8, 61, 3.8, 53.5, 4.2], '#1a1a22', { ow: 1.8, under: null });
  plate(ctx, [54.2, -4.1, 56, -4.05, 56, 4.05, 54.2, 4.1], '#c8202a', { ow: 0, under: null });
  line(ctx, [55, -3.4, 60.4, -3.2], '#4a4a5a', 0.7);
  // a bow tie at the collar and a boutonnière
  poly(ctx, [33, 0, 30.6, -5.6, 35.4, -5.6], '#c8202a', OUTLINE, 1.3);
  poly(ctx, [33, 0, 30.6, 5.6, 35.4, 5.6], '#c8202a', OUTLINE, 1.3);
  blob(ctx, 33, 0, 1.4, 1.6, { fill: '#e83a3a', outlineW: 1.2 });
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5 + t * 0.5;
    blob(ctx, 40 + Math.cos(a) * 1.5, -7 + Math.sin(a) * 1.5, 1.3, 1.3, { fill: '#ffffff', outlineW: 0.7 });
  }
  dot(ctx, 40, -7, 0.9, '#ffd27a');
  glint(ctx, 47, -4, 1.4 + pulse(t, 4) * 1.6, '#ffffff', 0.9);
  glint(ctx, 39, 8, 1.2 + pulse(t, 4, 2.2) * 1.4, '#ffffff', 0.8);
}

function thoughtsAndPrayers(ctx: Ctx, t: number): void {
  haft(ctx, -7, 34, 4.6, '#f4f0e6');
  grip(ctx, -7, 10, 5.4, '#8a6a10', '#4a3808');
  band(ctx, 33, 3, 7, GOLD);
  const cx = 44;
  const p = pulse(t, 2.4);
  glow(ctx, cx, 0, 18 + p * 3, '#ffe98a', 0.4);
  // a stained-glass orb
  const glass = ['#3f8cff', '#d42a2a', '#f0c43c', '#58d66a', '#9b5bff', '#d42a2a', '#3f8cff', '#f0c43c'];
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.arc(cx, 0, 10.5, (i * TAU) / 8, ((i + 1) * TAU) / 8);
    ctx.closePath();
    ctx.fillStyle = shade(glass[i]!, 0.85 + 0.35 * pulse(t, 2, i * 0.8));
    ctx.fill();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx + Math.cos(a) * 10.5, Math.sin(a) * 10.5);
  }
  ctx.stroke();
  ring(ctx, cx, 0, 5, 5, OUTLINE, 1);
  ring(ctx, cx, 0, 10.5, 10.5, OUTLINE, 2.5);
  ring(ctx, cx, 0, 9, 9, '#ffffff', 0.6, 0.4, -2.4, -1.2);
  dot(ctx, cx, 0, 2, '#fff6c8');
  // a halo hovering over it, thoughts drifting up
  const up = worldUp(ctx);
  const hx = cx + up[0] * 15;
  const hy = up[1] * 15;
  const hr = Math.atan2(up[1], up[0]) + Math.PI / 2;
  ring(ctx, hx, hy, 7, 2.4, OUTLINE, 3, 1, 0, TAU, hr);
  ring(ctx, hx, hy, 7, 2.4, '#ffe98a', 1.5, 0.7 + 0.3 * p, 0, TAU, hr);
  drift(ctx, cx, 0, t, 3, rot(up, 0.5), 4, 22, 0.4, 2, (x, y, k) => {
    ctx.beginPath();
    ctx.arc(x, y, 1 + k * 2.6, 0, TAU);
    fillPath(ctx, '#ffffff', 1, Math.sin(k * Math.PI));
  });
}

function theSermon(ctx: Ctx, t: number): void {
  haft(ctx, -7, 36, 4.6, '#5a3a22');
  grip(ctx, -7, 10, 5.4, '#5a1a2a', '#2a0a12');
  pommel(ctx, -8.5, 2.8, GOLD);
  const p = pulse(t, 2.5);
  // light pouring from the pages
  glow(ctx, 58, 0, 16 + p * 3, '#ffe98a', 0.45);
  for (let i = 0; i < 5; i++) {
    const a = -0.7 + i * 0.35 + Math.sin(t * 1.5 + i) * 0.05;
    line(ctx, [58, (i - 2) * 4, 58 + Math.cos(a) * 12, (i - 2) * 4 + Math.sin(a) * 12], '#fff3b0', 1, 0.3 + 0.3 * p);
  }
  // the book: a heavy hymnal, page edges to the front
  plate(ctx, [54, -12.6, 57.8, -12.6, 57.8, 12.6, 54, 12.6], '#f4ecd6', { ow: 1.6, under: null });
  for (let y = -10; y <= 10; y += 2.5) line(ctx, [54.6, y, 57.4, y], '#c8b890', 0.5);
  plate(ctx, [34.5, -13.5, 54.5, -13.5, 54.5, 13.5, 34.5, 13.5], '#6a1a2a', { ow: 2.2, under: '#4a1018', splitY: 4 });
  plate(ctx, [34.5, -13.5, 37.5, -13.5, 37.5, 13.5, 34.5, 13.5], '#4a1018', { ow: 1.4, under: null });
  for (const [x, y, sx, sy] of [
    [54.5, -13.5, -1, 1],
    [54.5, 13.5, -1, -1],
  ] as const)
    poly(ctx, [x, y, x + sx * 5, y, x, y + sy * 5], GOLD, OUTLINE, 1.2);
  plate(ctx, [44.6, -7.5, 46.6, -7.5, 46.6, -3, 50, -3, 50, -1, 46.6, -1, 46.6, 7.5, 44.6, 7.5, 44.6, -1, 41.2, -1, 41.2, -3, 44.6, -3], GOLD, { ow: 1.2, under: null });
  plate(ctx, [52, -2, 59, -2, 59, 2, 52, 2], GOLD, { ow: 1.3, under: null });
  dot(ctx, 58, 0, 0.8, OUTLINE);
  sheen(ctx, [34.5, -13.5, 54.5, -13.5, 54.5, 13.5, 34.5, 13.5], t, 34, 55, '#ffffff', 0.18, 3, 3);
  // a ribbon bookmark, swinging
  const up = worldUp(ctx);
  const d = rot([-up[0], -up[1]], Math.sin(t * 2.2) * 0.3);
  cord(ctx, [50, 13, 50 + d[0] * 4, 13 + d[1] * 4, 50 + d[0] * 8 + d[1], 13 + d[1] * 8 - d[0]], '#c8202a', 1.8, 0.9);
}

// ---------------------------------------------------------------------------------------------
// Halberd: Committee Decision, Swiss Army Pole, The Long Arm of the Law
// ---------------------------------------------------------------------------------------------

function committeeDecision(ctx: Ctx, t: number): void {
  // a shaft nobody could agree on the colour of
  limb(ctx, -8, 0, 90, 0, 4.2, WOOD);
  const cols = ['#7a5232', '#3a6aa0', '#a03a3a', '#3a8a5a', '#c8a040', '#8a5aa0'];
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineWidth = 4.2;
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = cols[i]!;
    ctx.beginPath();
    ctx.moveTo(-8 + i * 16.3, 0);
    ctx.lineTo(-8 + (i + 1) * 16.3, 0);
    ctx.stroke();
  }
  ctx.restore();
  grip(ctx, -6, 10, 4.6, LEATHER);
  // a ladle
  cord(ctx, [73, 2, 69, 9], '#9aa0a8', 1.4, 1);
  blob(ctx, 67.5, 12, 4, 3, { fill: '#c9ced6', under: '#9aa0a8', outlineW: 1.6 }, 0.5);
  // half an axe
  const ax = [72, -2.5, 70, -9, 67, -15, 75, -17.5, 82, -16, 80, -9, 79, -2.5];
  plate(ctx, ax, STEEL, { under: null, edge: [67, -15, 75, -17.5, 82, -16], edgeColor: '#ffffff', edgeW: 1 });
  // a sticky note on it, fluttering
  ctx.save();
  ctx.translate(76, -10);
  ctx.rotate(0.15 + Math.sin(t * 5) * 0.12);
  plate(ctx, [-2.6, -2.6, 2.6, -2.6, 2.6, 1.4, 1.4, 2.6, -2.6, 2.6], '#ffe14a', { ow: 1, under: null });
  line(ctx, [-1.6, -1, 1.6, -1], '#8a7a2a', 0.5);
  line(ctx, [-1.6, 0.6, 0.8, 0.6], '#8a7a2a', 0.5);
  ctx.restore();
  plate(ctx, [70, -2.8, 88, -2.8, 88, 2.8, 70, 2.8], '#5d626b', { ow: 1.8 });
  // a fork for a spike
  plate(ctx, [87, -3.6, 92, -3.6, 92, 3.6, 87, 3.6], '#c9ced6', { ow: 1.6 });
  for (const y of [-2.6, 0, 2.6]) cord(ctx, [92, y, 101, y * 1.1], '#c9ced6', 1.2, 0.9);
  // the committee's flag
  cord(ctx, [84, 3, 86, 16], '#7a5232', 1, 0.8);
  const w = Math.sin(t * 4) * 1.2;
  poly(ctx, [86, 16, 94, 16 + w, 93.6, 11 + w, 85.5, 11], '#3a6aa0', OUTLINE, 1.1);
  line(ctx, [86, 13.5, 93.8, 13.5 + w], '#ffffff', 0.7);
}

function swissArmyPole(ctx: Ctx, t: number): void {
  haft(ctx, -8, 72, 4.4, '#d42a2a');
  grip(ctx, -6, 10, 4.8, '#a01818', '#600a0a');
  plate(ctx, [14, -3.4, 20.8, -3.4, 20.8, 3.4, 14, 3.4], '#d42a2a', { ow: 1.4 });
  plate(ctx, [16.6, -2.4, 18.2, -2.4, 18.2, -0.8, 19.8, -0.8, 19.8, 0.8, 18.2, 0.8, 18.2, 2.4, 16.6, 2.4, 16.6, 0.8, 15, 0.8, 15, -0.8, 16.6, -0.8], '#ffffff', { ow: 0, under: null });
  // the fold-out tools (behind the scales)
  const cork = -1.15 + Math.sin(t * 1.5) * 0.3;
  const cs: number[] = [];
  for (let i = 0; i <= 16; i++) {
    const r = 2 + i * 0.75;
    const wob = Math.sin(i * 1.6) * 1.6;
    cs.push(84 + Math.cos(cork) * r - Math.sin(cork) * wob, -3 + Math.sin(cork) * r + Math.cos(cork) * wob);
  }
  line(ctx, cs, OUTLINE, 3);
  line(ctx, cs, '#d6dae0', 1.2);
  ctx.save();
  ctx.translate(76, 3);
  ctx.rotate(0.9);
  plate(ctx, [0, -1.4, 11, -0.6, 12, 0.4, 0, 1.4], STEEL, { ow: 1.3 });
  plate(ctx, [0, 0.4, 10, 2.6, 11, 1.6, 0, -0.6], '#d6dae0', { ow: 1.3 });
  ctx.restore();
  plate(ctx, [72, -4, 74, -9, 76.5, -9.5, 76.5, -7.5, 75, -7, 74.5, -4], '#c9ced6', { ow: 1.3 });
  plate(ctx, [88, -3, 100, -2.6, 105, 0, 99.5, 1.6, 88, 1.3], STEEL, { ow: 1.8, under: null, edge: [88, 1.3, 99.5, 1.6, 105, 0], edgeColor: '#ffffff', edgeW: 0.8 });
  line(ctx, [91, -1.6, 94, -1.6], '#8a919c', 0.7);
  // the red scales
  plate(ctx, [70, -4.2, 88, -4.2, 90, -2.6, 90, 2.6, 88, 4.2, 70, 4.2], '#d42a2a', { ow: 2, under: '#a81c1c', splitY: 1 });
  band(ctx, 70.5, 1.6, 8.4, '#c9ced6');
  rivet(ctx, 74, 0, 1, '#c9ced6');
  rivet(ctx, 86, 0, 1, '#c9ced6');
  sheen(ctx, [70, -4.2, 88, -4.2, 90, -2.6, 90, 2.6, 88, 4.2, 70, 4.2], t, 70, 90, '#ffffff', 0.4, 2.4, 2.5);
  plate(ctx, [78, -1.6, 81.4, -1.6, 81.4, -0.4, 82.6, -0.4, 82.6, 0.8, 81.4, 0.8, 81.4, 2, 78, 2], '#ffffff', { ow: 0, under: null });
}

function longArmOfTheLaw(ctx: Ctx, t: number): void {
  haft(ctx, -8, 90, 4.2, '#1a2a5a');
  grip(ctx, -6, 10, 4.6, '#101830', '#c9ced6');
  band(ctx, 30, 2, 6, '#c9ced6');
  band(ctx, 52, 2, 6, '#c9ced6');
  // handcuffs dangling off the hook side
  const [hx, hy] = dangle(ctx, 74, 3, 3, t, '#c9ced6', 2.4, 0.4);
  ring(ctx, hx, hy + 2.4, 2.4, 2.4, OUTLINE, 2.6);
  ring(ctx, hx, hy + 2.4, 2.4, 2.4, '#d6dae0', 1.2);
  ring(ctx, hx + 2, hy + 7.6, 2.4, 2.4, OUTLINE, 2.6);
  ring(ctx, hx + 2, hy + 7.6, 2.4, 2.4, '#d6dae0', 1.2);
  plate(ctx, [92, -2.6, 102, 0, 92, 2.6], '#d6dae0', { ow: 2 });
  // a sheriff's star for the blade
  const bx = 79;
  const by = -12.5;
  star(ctx, bx, by, 10, '#f0c43c', 6, 0.55, -Math.PI / 2, 2);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 6;
    dot(ctx, bx + Math.cos(a) * 10, by + Math.sin(a) * 10, 1.1, '#f8dc70');
  }
  ring(ctx, bx, by, 4, 4, '#b08a2a', 1);
  star(ctx, bx, by, 2.6, '#f8dc70', 5, 0.45, -Math.PI / 2, 0.6);
  glint(ctx, bx - 4, by - 4, 1 + pulse(t, 3) * 1.6, '#ffffff', 0.9);
  plate(ctx, [66, -2.8, 90, -2.8, 90, 2.8, 66, 2.8], '#5d626b', { ow: 1.8 });
  // the lights
  const on = Math.floor(t * 4) % 2;
  glow(ctx, 90, on ? -3 : 3, 14, on ? '#ff3b3b' : '#3b6bff', 0.7);
  blob(ctx, 89.5, -3, 2.4, 2, { fill: on ? '#ff6b6b' : '#7a1a1a', outlineW: 1.3 });
  blob(ctx, 89.5, 3, 2.4, 2, { fill: on ? '#1a2a7a' : '#6b8bff', outlineW: 1.3 });
}

// ---------------------------------------------------------------------------------------------
// Twin Axes: Double Shift, Twice Shy, The Twins (each design is one of the pair)
// ---------------------------------------------------------------------------------------------

const TA_BIT = [24.5, -2.6, 23.5, -6, 20.5, -11, 22.5, -14.6, 30, -15, 36.5, -12.6, 34.5, -7, 33.5, -2.6];
const TA_EDGE = [20.5, -11, 22.5, -14.6, 30, -15, 36.5, -12.6];

function doubleShift(ctx: Ctx, t: number): void {
  haft(ctx, -6, 34, 4.4, WOOD);
  grip(ctx, -6, 8, 5, '#2a2a2a', '#000000');
  // a hi-vis band with a reflective stripe
  const hv = [11, -2.7, 19, -2.7, 19, 2.7, 11, 2.7];
  plate(ctx, hv, '#ff7a1a', { ow: 1.4, under: null });
  line(ctx, [11, 0, 19, 0], '#e8ecf0', 1.2);
  sheen(ctx, hv, t, 11, 19, '#ffffff', 0.9, 1.6, 2);
  // a hazard-striped head
  trace(ctx, TA_BIT);
  ctx.fillStyle = '#f2c40c';
  ctx.fill();
  clipDo(ctx, TA_BIT, () => {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 12; x < 44; x += 4.4) {
      ctx.moveTo(x, -2);
      ctx.lineTo(x + 9, -17);
    }
    ctx.stroke();
    line(ctx, TA_EDGE, STEEL, 3.6);
    line(ctx, TA_EDGE, '#ffffff', 1);
  });
  outlineOf(ctx, TA_BIT, 2);
  plate(ctx, [23.5, -3.6, 34.5, -3.6, 34.5, 3.6, 23.5, 3.6], '#5d626b', { ow: 1.8 });
  rivet(ctx, 29, 0, 0.9);
  // a punched time card, swinging
  const [cx, cy] = dangle(ctx, 33, 3, 4, t, '#efe6d2', 2.6, 0.4);
  plate(ctx, [cx - 2.2, cy, cx + 2.2, cy, cx + 2.2, cy + 5.5, cx - 2.2, cy + 5.5], '#f4f0e6', { ow: 1, under: null });
  line(ctx, [cx - 1.4, cy + 1.6, cx + 1.4, cy + 1.6], '#8a919c', 0.4);
  line(ctx, [cx - 1.4, cy + 2.8, cx + 1.4, cy + 2.8], '#8a919c', 0.4);
  dot(ctx, cx + 0.8, cy + 4.2, 0.6, '#d42a2a');
  dot(ctx, cx - 0.8, cy + 4.2, 0.6, '#d42a2a');
}

function twiceShy(ctx: Ctx, t: number): void {
  haft(ctx, -6, 34, 4.4, '#f4d8e4');
  grip(ctx, -6, 8, 5, '#e890b0', '#b0607a');
  plate(ctx, [23.5, -3.6, 34.5, -3.6, 34.5, 3.6, 23.5, 3.6], '#d07898', { ow: 1.8 });
  // the head keeps hiding
  const shy = 0.5 + 0.5 * pulse(t, 1.6);
  ctx.save();
  ctx.globalAlpha *= shy;
  plate(ctx, TA_BIT, '#f4a0c0', { under: null, edge: TA_EDGE, edgeColor: '#ffffff', edgeW: 1 });
  ring(ctx, 26, -9.2, 1.2, 1, OUTLINE, 0.8, 1, Math.PI, TAU);
  ring(ctx, 31, -9.6, 1.2, 1, OUTLINE, 0.8, 1, Math.PI, TAU);
  ring(ctx, 28.6, -7.2, 0.8, 0.6, OUTLINE, 0.6, 1, 0, Math.PI);
  ctx.restore();
  const b = 0.5 + 0.5 * pulse(t, 3);
  blob(ctx, 24.6, -7.4, 1.6, 1, { fill: '#ff5a7a', outlineW: 0 });
  blob(ctx, 32.6, -7.8, 1.6, 1, { fill: '#ff5a7a', outlineW: 0 });
  for (const x of [23.8, 24.8, 31.8, 32.8]) line(ctx, [x, -8, x - 0.5, -6.8], '#c83a5a', 0.4, b);
  heart(ctx, 35.4, -13.6, 1, '#bfe4ff', 0.6, 0.9, Math.PI);
  const up = worldUp(ctx);
  drift(ctx, 29, -12, t, 1, up, 6, 12, 0.5, 3, (x, y, k) => heart(ctx, x, y, 1.4, '#ff6a9a', 0.8, (1 - k) * 0.9));
}

function theTwins(ctx: Ctx, t: number): void {
  haft(ctx, -6, 34, 4.4, '#2a2630');
  grip(ctx, -6, 8, 5, '#e8e4ec', '#8a8494');
  // two mirrored bits, one light and one dark, joined by a yin-yang
  plate(ctx, TA_BIT, '#f4f2f6', { under: null, edge: TA_EDGE, edgeColor: '#bfa0ff', edgeW: 1 });
  line(ctx, [23, -10.4, 30, -12, 34.5, -10.2], '#c8c4d0', 0.8);
  plate(ctx, flipY(TA_BIT), '#2a2432', { under: null, edge: flipY(TA_EDGE), edgeColor: '#ffffff', edgeW: 1 });
  line(ctx, [23, 10.4, 30, 12, 34.5, 10.2], '#4a4456', 0.8);
  plate(ctx, [23.5, -3.8, 34.5, -3.8, 34.5, 3.8, 23.5, 3.8], '#4a4456', { ow: 1.8 });
  ctx.save();
  ctx.translate(29, 0);
  ctx.rotate(t * 1.5);
  blob(ctx, 0, 0, 3.2, 3.2, { fill: '#f4f2f6', under: '#f4f2f6', outlineW: 1.2 });
  ctx.fillStyle = '#1e1a24';
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, -Math.PI / 2, Math.PI / 2);
  ctx.arc(0, 1.6, 1.6, Math.PI / 2, -Math.PI / 2, true);
  ctx.arc(0, -1.6, 1.6, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  dot(ctx, 0, -1.6, 0.5, '#1e1a24');
  dot(ctx, 0, 1.6, 0.5, '#f4f2f6');
  ctx.restore();
  // Gemini: two stars circling each other
  const a = t * 2;
  for (let i = 0; i < 2; i++) {
    const x = 29 + Math.cos(a + i * Math.PI) * 3.4;
    const y = -20 + Math.sin(a + i * Math.PI) * 1.6;
    glint(ctx, x, y, 2 + pulse(t, 4, i * Math.PI), i ? '#ffffff' : '#bfa0ff', 0.9);
  }
}

// ---------------------------------------------------------------------------------------------
// Hollow Maul: Dark Matter of Fact, Existential Dread, The Void Warranty
// ---------------------------------------------------------------------------------------------

const VOID_GLOW = '#9a93ab';

function maulHaft(ctx: Ctx, wood = '#2a2631', wrap = '#3a3448'): void {
  haft(ctx, -7, 41, 6, wood);
  grip(ctx, -7, 12, 6.5, wrap, '#1a1622');
  band(ctx, 17, 3, 9, '#5d626b');
  band(ctx, 31, 3, 9, '#5d626b');
}

function darkMatterOfFact(ctx: Ctx, t: number): void {
  maulHaft(ctx);
  const cx = 54;
  const p = pulse(t, 2.2);
  glow(ctx, cx, 0, 24 + p * 3, VOID_GLOW, 0.4);
  glow(ctx, cx, 0, 14, '#ff9b4a', 0.25);
  // a yoke holding a black hole
  cord(ctx, [40, 0, 43, -9, 51, -14.5], '#6d737d', 2.2, 1);
  cord(ctx, [40, 0, 43, 9, 51, 14.5], '#6d737d', 2.2, 1);
  plate(ctx, [38, -4.5, 43, -6, 43, 6, 38, 4.5], '#5d626b', { ow: 1.8 });
  const disk = (a0: number, a1: number): void => {
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.ellipse(cx, 0, 17, 5, -0.35, a0, a1);
    ctx.strokeStyle = '#ff9b4a';
    ctx.lineWidth = 3.4;
    ctx.globalAlpha *= 0.85;
    ctx.stroke();
    ctx.setLineDash([3, 2.4]);
    ctx.lineDashOffset = -t * 18;
    ctx.strokeStyle = '#fff0d0';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  };
  disk(Math.PI, TAU);
  // infalling motes
  for (let i = 0; i < 6; i++) {
    const k = frac(t * 0.5 + hash(i * 2.3));
    const r = 16 * (1 - k) + 6;
    const a = hash(i * 4.1) * TAU + k * 4;
    dot(ctx, cx + Math.cos(a) * r, Math.sin(a) * r * 0.45, 0.8, '#ffe0c0', 1 - k);
  }
  blob(ctx, cx, 0, 7, 7, { fill: '#050308', under: '#000000', outlineW: 2 });
  ring(ctx, cx, 0, 7.8, 7.8, '#ffffff', 0.8, 0.5 + 0.4 * p);
  disk(0, Math.PI);
  dot(ctx, cx, 0, 2, '#000000');
}

function existentialDread(ctx: Ctx, t: number): void {
  maulHaft(ctx);
  plate(ctx, [38, -4.5, 43, -6, 43, 6, 38, 4.5], '#5d626b', { ow: 1.8 });
  const cx = 54;
  glow(ctx, cx, 0, 22 + pulse(t, 1.5) * 3, '#7a2bd6', 0.35);
  // reaching tendrils
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4 + Math.sin(t * 0.8 + i) * 0.15;
    const pts: number[] = [];
    for (let j = 0; j <= 5; j++) {
      const r = 9 + j * 2;
      const w = Math.sin(t * 3 + i * 2 + j * 1.2) * j * 0.45;
      pts.push(cx + Math.cos(a) * r - Math.sin(a) * w, Math.sin(a) * r + Math.cos(a) * w);
    }
    cord(ctx, pts, '#3a2a4a', 1.4, 1);
  }
  blob(ctx, cx, 0, 11.5, 11.5, { fill: '#2a2631', under: '#0d0b11', outlineW: 2.2 });
  // the eye: it looks around, it blinks, it knows
  const cyc = frac(t * 0.3);
  const open = cyc > 0.92 ? Math.abs(Math.cos(((cyc - 0.92) / 0.08) * Math.PI)) : 1;
  const ry = 5.6 * Math.max(0.08, open);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, 0, 7.2, ry, 0, 0, TAU);
  ctx.fillStyle = '#efe8f0';
  ctx.fill();
  ctx.clip();
  line(ctx, [cx - 7, -1, cx - 4.5, -0.4, cx - 3.6, 1.2], '#c83a4a', 0.5);
  line(ctx, [cx + 7, 1.4, cx + 4.6, 0.6], '#c83a4a', 0.5);
  const lx = cx + Math.cos(t * 0.9) * 2.4;
  const ly = Math.sin(t * 1.3) * 1.6;
  blob(ctx, lx, ly, 3.4, 3.4, { fill: '#9b5bff', under: '#6a2bd6', outlineW: 1 });
  dot(ctx, lx, ly, 1.6, '#06030a');
  dot(ctx, lx - 1, ly - 1, 0.7, '#ffffff');
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(cx, 0, 7.2, ry, 0, 0, TAU);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  const up = worldUp(ctx);
  drift(ctx, cx, 4, t, 2, [-up[0], -up[1]], 10, 12, 0.5, 9, (x, y, k) => dot(ctx, x, y, 1, '#7a2bd6', 1 - k));
}

function voidWarranty(ctx: Ctx, t: number): void {
  maulHaft(ctx, '#3b3540', '#4a4256');
  const up = worldUp(ctx);
  glow(ctx, 52, 0, 22 + pulse(t, 2) * 2, VOID_GLOW, 0.35);
  // the box, void leaking from its seams
  const box = [40, -14.5, 64, -14.5, 64, 14.5, 40, 14.5];
  plate(ctx, box, '#c8a070', { under: '#a88050', splitY: 5 });
  clipDo(ctx, box, () => {
    ctx.fillStyle = 'rgba(232,216,168,0.85)';
    ctx.fillRect(38, -2.2, 28, 4.4);
    line(ctx, [40, -2.2, 64, -2.2], '#b89868', 0.5);
    line(ctx, [40, 2.2, 64, 2.2], '#b89868', 0.5);
    line(ctx, [40.5, -14, 47, -13.4, 52, -14], '#2a2631', 1.6);
    line(ctx, [64, 6, 63.4, 11, 64, 14], '#2a2631', 1.6);
  });
  ctx.save();
  ctx.translate(51.5, -8);
  ctx.rotate(-0.16);
  ctx.strokeStyle = '#d42a2a';
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-7, -2.8, 14, 5.6);
  text(ctx, 'VOID', 0, 0.3, 4.8, '#d42a2a');
  ctx.restore();
  // a holographic warranty sticker, peeling
  const hue = Math.floor((t * 90) % 360);
  ctx.beginPath();
  ctx.arc(57, 8, 3.4, 0.4, TAU - 0.9);
  ctx.lineTo(57, 8);
  ctx.closePath();
  fillPath(ctx, `hsl(${hue},80%,72%)`, 0.9);
  poly(ctx, [57 + Math.cos(0.4) * 3.4, 8 + Math.sin(0.4) * 3.4, 61.6, 5.2, 57 + Math.cos(-0.9) * 3.4, 8 + Math.sin(-0.9) * 3.4], '#e8e8f0', OUTLINE, 0.8);
  dot(ctx, 56, 7, 0.9, `hsl(${(hue + 120) % 360},80%,72%)`);
  // iron straps
  for (const x of [43, 61]) plate(ctx, [x - 1, -15.5, x + 1, -15.5, x + 1, 15.5, x - 1, 15.5], '#5d626b', { ow: 1.2, under: null });
  drift(ctx, 52, -14, t, 3, up, 20, 16, 0.4, 4, (x, y, k) => dot(ctx, x, y, 1.2 + k * 2.4, '#2a2631', 0.7 * (1 - k)));
  drift(ctx, 63, 10, t, 2, up, 4, 14, 0.5, 8, (x, y, k) => dot(ctx, x, y, 1 + k * 1.6, VOID_GLOW, 0.6 * (1 - k)));
}

// ---------------------------------------------------------------------------------------------
// Spellblade: Spell Check, Sharp Mind, Wizard of Odds
// ---------------------------------------------------------------------------------------------

function spellCheck(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.6);
  glow(ctx, -8.5, 0, 9 + p * 2, '#58d66a', 0.5);
  plate(ctx, [-13.5, -1.2, -11.6, -3, -9.4, -0.8, -5.2, -5.8, -3.4, -4, -9.4, 2.8], '#7dff8a', { ow: 1.6, under: '#3aa84a', splitY: -1 });
  grip(ctx, -5, 7.5, 4, '#22304a', '#0e1626');
  const pts = swordBlade(ctx, 11, 64, 7, { color: '#d6e2f0', tip: 10, fuller: '#1f3a6a', fullerLen: 0.78, taper: 0.8 });
  line(ctx, [13.5, 0, 52, 0], '#1a3f8a', 2.4);
  runes(ctx, 16, 6, 6.2, t, '#3f8cff', '#7cc4ff', 0.95);
  // one of them is spelled wrong
  const sq: number[] = [];
  for (let x = 32; x <= 37.6; x += 0.4) sq.push(x, 2.3 + Math.sin(x * 4) * 0.55);
  line(ctx, sq, '#ff3b3b', 0.8, 0.6 + 0.4 * p);
  sheen(ctx, pts, t, 11, 64, '#bfe4ff', 0.35, 3);
  crossguard(ctx, 9.3, 8.5, 3, '#c8d4e6', 1.8);
  dot(ctx, 9.3, 0, 1.8, '#58d66a');
  glint(ctx, -8.4, -1, 1.6 + p * 1.4, '#ffffff', 0.9);
}

function sharpMind(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.4);
  glow(ctx, -9, 0, 10 + p * 2, '#ff9ad0', 0.45);
  blob(ctx, -9, 0, 5.2, 4.4, { fill: '#f4a0c0', under: '#d07898', outlineW: 1.8 });
  line(ctx, [-12.5, -1.5, -11, -2.6, -9.6, -1.4, -8, -2.8, -6.4, -1.6], '#b05878', 0.7);
  line(ctx, [-12.6, 1, -11, 0.2, -9.4, 1.6, -7.6, 0.4, -6, 1.4], '#b05878', 0.7);
  line(ctx, [-9, -4, -9, 4], '#b05878', 0.5);
  grip(ctx, -4, 7.5, 4, '#2a2a4a', VOID_GLOW);
  // a crystal blade: you can see the thoughts in it
  const bl = [11, -3.7, 54, -3.1, 64.5, 0, 54, 3.1, 11, 3.7];
  trace(ctx, bl);
  ctx.save();
  ctx.globalAlpha *= 0.6;
  ctx.fillStyle = '#bfe4ff';
  ctx.fill();
  ctx.restore();
  clipDo(ctx, bl, () => {
    line(ctx, [11, -3.7, 54, -3.1, 64.5, 0], '#ffffff', 1.6);
    line(ctx, [14, 0, 20, -1.6, 26, 0.8, 33, -1, 40, 1.2, 47, -0.8, 55, 0.4], '#7cc4ff', 0.6, 0.5);
    line(ctx, [20, -1.6, 22, -3], '#7cc4ff', 0.5, 0.5);
    line(ctx, [33, -1, 35, 2.6], '#7cc4ff', 0.5, 0.5);
    line(ctx, [47, -0.8, 49, -2.6], '#7cc4ff', 0.5, 0.5);
  });
  outlineOf(ctx, bl, 2);
  // synapses firing down the blade
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.9 + i / 3);
    const x = 13 + k * 49;
    glow(ctx, x, 0, 5, '#7cc4ff', 0.8 * Math.sin(k * Math.PI));
    line(ctx, [x - 2.4, -1, x - 0.6, 0.8, x + 0.8, -0.8, x + 2.4, 0.6], '#ffffff', 0.7, Math.sin(k * Math.PI));
  }
  // a dendrite guard
  cord(ctx, [9.5, 0, 9.5, -5, 8, -8], '#c8d4e6', 1.2, 0.9);
  cord(ctx, [9.5, -4.5, 11.5, -7.5], '#c8d4e6', 1, 0.8);
  cord(ctx, [9.5, 0, 9.5, 5, 8, 8], '#c8d4e6', 1.2, 0.9);
  cord(ctx, [9.5, 4.5, 11.5, 7.5], '#c8d4e6', 1, 0.8);
  dot(ctx, 9.5, 0, 1.8, '#ff9ad0');
}

function suit(ctx: Ctx, kind: number, x: number, y: number, s: number, color: string): void {
  if (kind === 1) {
    heart(ctx, x, y, s, color, 0);
    return;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  if (kind === 2) {
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.7, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.7, y);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (kind === 0) {
    ctx.moveTo(x, y - s);
    ctx.bezierCurveTo(x + s * 1.3, y - s * 0.1, x + s * 0.6, y + s * 0.9, x, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.6, y + s * 0.9, x - s * 1.3, y - s * 0.1, x, y - s);
  } else {
    ctx.arc(x, y - s * 0.45, s * 0.45, 0, TAU);
    ctx.moveTo(x - s * 0.45 + s * 0.45, y + s * 0.15);
    ctx.arc(x - s * 0.45, y + s * 0.15, s * 0.45, 0, TAU);
    ctx.moveTo(x + s * 0.9, y + s * 0.15);
    ctx.arc(x + s * 0.45, y + s * 0.15, s * 0.45, 0, TAU);
  }
  ctx.fill();
  ctx.fillRect(x - s * 0.12, y + s * 0.2, s * 0.24, s * 0.8);
}

function wizardOfOdds(ctx: Ctx, t: number): void {
  const p = pulse(t, 2.2);
  glow(ctx, -9.5, 0, 9 + p * 2, '#b06bff', 0.45);
  // a d20 for a pommel
  const hex: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6 + Math.PI / 6;
    hex.push(-9.5 + Math.cos(a) * 5.2, Math.sin(a) * 5.2);
  }
  plate(ctx, hex, '#7a3ad0', { ow: 1.6, under: '#5a2aa0', splitY: 1 });
  line(ctx, [hex[2]!, hex[3]!, hex[6]!, hex[7]!, hex[10]!, hex[11]!, hex[2]!, hex[3]!], '#d8b8ff', 0.6);
  text(ctx, '20', -9.5, 0.4, 3, '#ffffff');
  grip(ctx, -4, 7.5, 4, '#2a1a4a', GOLD);
  const pts = swordBlade(ctx, 11, 64, 7, { color: '#3a2a6a', tip: 10, fuller: '#1a1040', fullerLen: 0.78, taper: 0.8, edge: '#b8a0ff' });
  line(ctx, [13.5, 0, 52, 0], '#1a1040', 2.6);
  // the four suits, one lucky one lit at a time
  const lit = Math.floor(t * 2.5) % 4;
  for (let i = 0; i < 4; i++) {
    const x = 18 + i * 9.5;
    const on = i === lit;
    if (on) glow(ctx, x, 0, 6, '#ffd27a', 0.8);
    suit(ctx, i, x, 0, on ? 1.8 : 1.4, on ? '#fff3c0' : i % 2 ? '#d84a6a' : '#c8b8ff');
  }
  sheen(ctx, pts, t, 11, 64, '#d8c8ff', 0.3, 3);
  crossguard(ctx, 9.3, 8.5, 3, GOLD, 1.8);
  star(ctx, 10.5, -9.5, 2, '#ffe14a', 5, 0.45, -Math.PI / 2, 0.8);
  star(ctx, 10.5, 9.5, 2, '#ffe14a', 5, 0.45, -Math.PI / 2, 0.8);
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.5 + i / 3);
    glint(ctx, 20 + i * 15, (i % 2 ? 1 : -1) * (5 + k * 3), 1.8 * Math.sin(k * Math.PI), '#e8d8ff', 1);
  }
}

// ---------------------------------------------------------------------------------------------
// Censer Flail: Holy Smokes, Fire and Brimstone Inc., Smoke Alarm
// ---------------------------------------------------------------------------------------------

/** Haft, grip and a swaying chain; returns the censer's centre and swing angle. */
function censerRig(ctx: Ctx, t: number, wood: string, wrap: string, chain: string, trim: string): [number, number, number] {
  haft(ctx, -6, 19, 4.6, wood);
  grip(ctx, -6, 9, 5, wrap, shade(wrap, 0.5));
  band(ctx, 11, 2, 6, trim);
  plate(ctx, [18, -3.4, 22.5, -2.4, 22.5, 2.4, 18, 3.4], trim, { ow: 1.8 });
  const th = 0.32 * Math.sin(t * 2.4);
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  for (let i = 0; i < 5; i++) {
    const s = (i + 0.5) * (18 / 5);
    ctx.save();
    ctx.translate(23 + s * dx, s * dy);
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
    ctx.strokeStyle = chain;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
  return [23 + 26 * dx, 26 * dy, th];
}

function holySmokes(ctx: Ctx, t: number): void {
  const [cx, cy, th] = censerRig(ctx, t, '#f4f0e6', '#8a6a10', '#f0c84a', GOLD);
  const up = worldUp(ctx);
  const p = pulse(t, 2.5);
  glow(ctx, cx, cy, 20 + p * 3, '#ffe98a', 0.45);
  // billowing smoke…
  drift(ctx, cx, cy, t, 6, up, 12, 26, 0.3, 4, (x, y, k) => dot(ctx, x, y, 2.4 + k * 5, '#f4f0e6', 0.42 * Math.sin(k * Math.PI)));
  // …that forms a halo
  const hx = cx + up[0] * 20;
  const hy = cy + up[1] * 20;
  const hr = Math.atan2(up[1], up[0]) + Math.PI / 2;
  ring(ctx, hx, hy, 8, 2.6, '#ffe98a', 1.8, 0.5 + 0.4 * p, 0, TAU, hr);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(th);
  blob(ctx, -8, 0, 2.6, 3.6, { fill: '#f8dc70', outlineW: 1.5 });
  blob(ctx, 0, 0, 7.6, 7.6, { fill: '#f0c84a', under: '#c8962a', outlineW: 2.2 });
  for (const [x, y] of [
    [-2.5, -3],
    [2.8, -1.6],
    [-1, 3.4],
  ] as const) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 1.5, y - 0.6, 3, 1.2);
    ctx.fillRect(x - 0.6, y - 1.5, 1.2, 3);
    ctx.fillStyle = p > 0.5 ? '#ffffff' : '#fff3b0';
    ctx.fillRect(x - 1, y - 0.25, 2, 0.5);
    ctx.fillRect(x - 0.25, y - 1, 0.5, 2);
  }
  blob(ctx, 8.4, 0, 1.6, 1.6, { fill: '#f8dc70', outlineW: 1.2 });
  spec(ctx, -2.5, -4.6, 1.1);
  ctx.restore();
}

function fireAndBrimstone(ctx: Ctx, t: number): void {
  const [cx, cy, th] = censerRig(ctx, t, '#2a1a1a', '#5a1a1a', '#5d626b', '#8a1a1a');
  // management
  plate(ctx, [-3, -2.8, 7, -2.8, 7, 2.8, -3, 2.8], GOLD, { ow: 1.2, under: '#b08a2a', splitY: 1 });
  text(ctx, 'Inc.', 2, 0.3, 3.4, '#3a2008');
  const up = worldUp(ctx);
  const fl = pulse(t, 9) * 0.5 + pulse(t, 13.1) * 0.5;
  glow(ctx, cx, cy, 22 + fl * 4, '#e33b22', 0.45 + fl * 0.15);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(th);
  // horns
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-3, s * 6);
    ctx.quadraticCurveTo(-4, s * 12, 3, s * 13.5);
    ctx.quadraticCurveTo(-0.5, s * 10, 2, s * 6.4);
    ctx.closePath();
    fillPath(ctx, '#e8dcc0', 1.4);
  }
  blob(ctx, 0, 0, 8, 8, { fill: '#2a2226', under: '#140e10' });
  // a grinning grate
  poly(ctx, [-1.5, -4.6, 2.6, -3.6, 2.6, -1.8, -1.5, -2.6], fl > 0.5 ? '#ffd27a' : '#ff7a1a', OUTLINE, 0.8);
  poly(ctx, [-1.5, 4.6, 2.6, 3.6, 2.6, 1.8, -1.5, 2.6], fl > 0.5 ? '#ffd27a' : '#ff7a1a', OUTLINE, 0.8);
  line(ctx, [5.6, -3.6, 4.4, -2.2, 6, -0.8, 4.4, 0.6, 6, 2, 4.4, 3.4, 5.6, 4.4], '#ff7a1a', 1.4);
  glow(ctx, 2, 0, 7, '#ff7a1a', 0.5);
  ctx.restore();
  const fx = cx + up[0] * 5;
  const fy = cy + up[1] * 5;
  flame(ctx, fx - up[1] * 4, fy + up[0] * 4, 11, 3, t, up, 3, '#ff5a1a', '#ffe14a');
  flame(ctx, fx + up[1] * 4, fy - up[0] * 4, 11, 3, t, up, 5, '#ff5a1a', '#ffe14a');
  flame(ctx, fx, fy, 18, 5, t, up, 1, '#e33b22', '#ffb03a');
  drift(ctx, cx, cy, t, 6, up, 14, 22, 0.9, 6, (x, y, k) => dot(ctx, x, y, 1 - k * 0.5, k < 0.5 ? '#ffe14a' : '#e8c020', 1 - k));
}

function smokeAlarm(ctx: Ctx, t: number): void {
  const [cx, cy, th] = censerRig(ctx, t, WOOD, LEATHER, '#c9ced6', '#c9ced6');
  const up = worldUp(ctx);
  const beep = frac(t * 0.8) < 0.18;
  drift(ctx, cx, cy, t, 4, up, 10, 22, 0.35, 2, (x, y, k) => dot(ctx, x, y, 2 + k * 4, '#9a9a9a', 0.35 * (1 - k)));
  if (beep) {
    glow(ctx, cx, cy, 20, '#ff3b3b', 0.4);
    ring(ctx, cx, cy, 11.5, 11.5, '#ff3b3b', 1.4, 0.8);
    ring(ctx, cx, cy, 14.5, 14.5, '#ff3b3b', 1, 0.5);
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(th);
  blob(ctx, 0, 0, 8.6, 8.6, { fill: '#f4f4f0', under: '#d8d8d0' });
  ring(ctx, 0, 0, 6, 6, '#a8a8a0', 0.8);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    line(ctx, [Math.cos(a) * 6.6, Math.sin(a) * 6.6, Math.cos(a) * 7.8, Math.sin(a) * 7.8], '#a8a8a0', 0.8);
  }
  blob(ctx, 0, 0, 2.6, 2.6, { fill: '#e0e0d8', outlineW: 1 });
  dot(ctx, 3.6, -3.6, 1.3, OUTLINE);
  dot(ctx, 3.6, -3.6, 0.9, beep ? '#ff3b3b' : '#6a1a1a');
  if (beep) glow(ctx, 3.6, -3.6, 5, '#ff3b3b', 0.9);
  spec(ctx, -3, -4.4, 1.2);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Dawn Glaive: Morning Person, Sunday Service, Rise and Shine
// ---------------------------------------------------------------------------------------------

function glaiveShaft(ctx: Ctx, wood: string, wrap: string, trim: string): void {
  haft(ctx, -8, 79, 4.2, wood);
  grip(ctx, -6, 10, 4.6, wrap, shade(wrap, 0.5));
  band(ctx, 24, 2, 6, trim);
  band(ctx, 50, 2, 6, trim);
  plate(ctx, [-11, 0, -7.5, -2.6, -6.5, -2.6, -6.5, 2.6, -7.5, 2.6], trim, { ow: 1.5 });
  plate(ctx, [74, -3, 80, -3.6, 80, 3.6, 74, 3], trim, { ow: 1.8 });
}

function morningPerson(ctx: Ctx, t: number): void {
  glaiveShaft(ctx, '#f4e0c0', '#c86a3a', '#ff9b4a');
  // a mug of coffee hanging off the socket
  const [mx, my] = dangle(ctx, 77, 3.4, 3.4, t, '#efe6d2', 2, 0.3);
  plate(ctx, [mx - 2.4, my, mx + 2.4, my, mx + 2, my + 4.6, mx - 2, my + 4.6], '#ffffff', { ow: 1.1, under: null });
  ring(ctx, mx + 2.6, my + 2.2, 1.2, 1.4, OUTLINE, 0.9);
  const up = worldUp(ctx);
  drift(ctx, mx, my, t, 2, up, 2, 8, 0.6, 3, (x, y, k) => dot(ctx, x, y, 0.8 + k, '#ffffff', 0.5 * (1 - k)));
  // a cheerful sun, up before everyone
  const sx = 89;
  const p = pulse(t, 2.6);
  glow(ctx, sx, 0, 22 + p * 3, '#ffd27a', 0.45);
  ctx.save();
  ctx.translate(sx, 0);
  ctx.rotate(t * 0.8);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const r = (i % 2 ? 12 : 15) + p * 1.2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    poly(ctx, [c * 8 - s * 1.8, s * 8 + c * 1.8, c * r, s * r, c * 8 + s * 1.8, s * 8 - c * 1.8], i % 2 ? '#ffb84a' : '#ffd84a', OUTLINE, 1.2);
  }
  ctx.restore();
  blob(ctx, sx, 0, 8.4, 8.4, { fill: '#ffd84a', under: '#f0a830' });
  ring(ctx, sx - 2.8, -1.6, 1.3, 1.1, OUTLINE, 0.9, 1, Math.PI, TAU);
  ring(ctx, sx + 2.8, -1.6, 1.3, 1.1, OUTLINE, 0.9, 1, Math.PI, TAU);
  ring(ctx, sx, 1.4, 3, 2.4, OUTLINE, 1, 1, 0.2, Math.PI - 0.2);
  dot(ctx, sx - 4.6, 1.4, 1.3, '#ff8a6a', 0.7);
  dot(ctx, sx + 4.6, 1.4, 1.3, '#ff8a6a', 0.7);
  glint(ctx, sx + 13, -8, 1.4 + p * 1.4, '#ffffff', 0.9);
}

function sundayService(ctx: Ctx, t: number): void {
  glaiveShaft(ctx, '#f4f0e6', '#4a3a6a', GOLD);
  const p = pulse(t, 2);
  glow(ctx, 93, 0, 20 + p * 3, '#ffe98a', 0.45);
  // a little bell hanging from the socket
  const [bx, by] = dangle(ctx, 78, 3.6, 3, t, '#c9a85a', 2.6, 0.5);
  plate(ctx, [bx - 1.4, by, bx + 1.4, by, bx + 2.6, by + 4, bx - 2.6, by + 4], '#c8862e', { ow: 1.1, under: null });
  const ringK = Math.abs(Math.sin(t * 2.6));
  if (ringK > 0.85) ring(ctx, bx, by + 3, 4, 4, '#ffe9b0', 0.8, (ringK - 0.85) * 6, 0.3, Math.PI - 0.3);
  // a stained-glass lancet window for a blade
  const win = (): void => {
    ctx.beginPath();
    ctx.moveTo(79, -7);
    ctx.lineTo(92, -7);
    ctx.quadraticCurveTo(102, -7, 107, 0);
    ctx.quadraticCurveTo(102, 7, 92, 7);
    ctx.lineTo(79, 7);
    ctx.closePath();
  };
  win();
  ctx.fillStyle = '#3a5a8a';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const panes = ['#3f8cff', '#d42a2a', '#f0c43c', '#58d66a', '#9b5bff', '#f0c43c', '#d42a2a', '#3f8cff'];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = shade(panes[i * 2 + j]!, 0.8 + 0.4 * pulse(t, 2, i + j * 2));
      ctx.fillRect(79 + i * 6, j ? 0 : -7, 6, 7);
    }
  }
  ctx.fillStyle = shade('#f0c43c', 0.9 + 0.3 * p);
  ctx.beginPath();
  ctx.arc(99, 0, 3.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(79 + i * 6, -7);
    ctx.lineTo(79 + i * 6, 7);
  }
  ctx.moveTo(79, 0);
  ctx.lineTo(95.8, 0);
  ctx.moveTo(102.2, 0);
  ctx.lineTo(108, 0);
  ctx.stroke();
  ring(ctx, 99, 0, 3.2, 3.2, OUTLINE, 0.9);
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    line(ctx, [99, 0, 99 + Math.cos(a) * 3.2, Math.sin(a) * 3.2], OUTLINE, 0.6);
  }
  ctx.restore();
  win();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
}

function riseAndShine(ctx: Ctx, t: number): void {
  glaiveShaft(ctx, '#6a1a1a', '#3a0a0a', GOLD);
  const up = worldUp(ctx);
  const p = pulse(t, 3);
  glow(ctx, 92, -4, 24 + p * 3, '#ff9b4a', 0.45);
  // a phoenix wing: feathers fanning from the socket to a forward point
  const cols = ['#e33b22', '#ff5a1a', '#ff8a2a', '#ffb83a', '#ffe14a'];
  for (let i = 0; i < 5; i++) {
    const a = -1.35 + i * 0.33 + Math.sin(t * 3 + i) * 0.03;
    const L = 15 + i * 3;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x0 = 80;
    const y0 = -1;
    const tx = x0 + c * L;
    const ty = y0 + s * L;
    const w = 3.6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + c * L * 0.5 - s * w, y0 + s * L * 0.5 + c * w, tx, ty);
    ctx.quadraticCurveTo(x0 + c * L * 0.5 + s * w, y0 + s * L * 0.5 - c * w, x0, y0);
    ctx.closePath();
    fillPath(ctx, cols[i]!, 1.5);
    line(ctx, [x0 + c * 2, y0 + s * 2, tx - c * 2, ty - s * 2], shade(cols[i]!, 0.7), 0.6);
    flame(ctx, tx, ty, 4 + i * 0.4, 1.4, t, [c, s], i * 2, cols[Math.min(4, i + 1)]!, '#fff3c0');
  }
  // the point: the longest, brightest plume
  plate(ctx, [80, -2.2, 94, -3.2, 107, 0, 94, 2.6, 80, 2.2], '#ffd84a', { ow: 1.8, under: '#ffa830', splitY: 0.3, edge: [80, -2.2, 94, -3.2, 107, 0], edgeColor: '#fffbe0', edgeW: 0.8 });
  line(ctx, [82, 0, 103, 0], '#e8902a', 0.7);
  drift(ctx, 92, -6, t, 6, up, 20, 20, 0.8, 7, (x, y, k) => dot(ctx, x, y, 1 - k * 0.5, k < 0.5 ? '#fff3c0' : '#ff9b4a', 1 - k));
}

// ---------------------------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------------------------

const DESIGNS: Record<string, Design> = {
  "Landlord's Gavel": { len: 64, draw: landlordsGavel },
  'Noise Complaint': { len: 64, draw: noiseComplaint },
  'The Big One': { len: 68, draw: theBigOne },
  'The Severance Package': { len: 66, draw: severancePackage },
  'Lumberjack Retirement Plan': { len: 64, draw: lumberjackRetirement },
  Firewood: { len: 62, draw: firewood },
  Overcompensation: { len: 92, draw: overcompensation },
  'The Door': { len: 84, draw: theDoor },
  'Small Talk': { len: 86, draw: smallTalk },
  'Second Opinion': { len: 52, draw: secondOpinion },
  'The Notary': { len: 54, draw: theNotary },
  Quarrelsome: { len: 54, draw: quarrelsome },
  'Stick of Destiny': { len: 52, draw: stickOfDestiny },
  'Problem Solver': { len: 52, draw: problemSolver },
  'Original Recipe': { len: 54, draw: originalRecipe },
  'Paper Cut': { len: 31, draw: paperCut },
  'The Fine Print': { len: 31, draw: theFinePrint },
  'Mr. and Mrs. Stabby': { len: 31, draw: mrAndMrsStabby },
  'Strongly Worded Letter': { len: 64, draw: stronglyWordedLetter },
  'En Garde': { len: 62, draw: enGarde },
  'The Point': { len: 66, draw: thePoint },
  'Moonlight Shift': { len: 62, draw: moonlightShift },
  Overtime: { len: 62, draw: overtime },
  'Folded Laundry': { len: 62, draw: foldedLaundry },
  'Long Distance Relationship': { len: 22, bow: true, draw: longDistance },
  'Return to Sender': { len: 22, bow: true, draw: returnToSender },
  'Cupid Retired': { len: 22, bow: true, draw: cupidRetired },
  'Middle Management': { len: 60, draw: middleManagement },
  'The Long Reach': { len: 74, draw: theLongReach },
  'Snap Decision': { len: 60, draw: snapDecision },
  'Employee of the Month': { len: 64, draw: employeeOfTheMonth },
  'Plot Armor': { len: 65, draw: plotArmor },
  'Exactly As Long As It Needs To Be': { len: 64, draw: exactlyAsLong },
  'Social Distancing': { len: 97, draw: socialDistancing },
  'The Ten-Foot Rule': { len: 97, draw: tenFootRule },
  'Personal Space': { len: 98, draw: personalSpace },
  'Hostile Takeover': { len: 58, draw: hostileTakeover },
  'Chopping Block': { len: 60, draw: choppingBlock },
  'Axe Me Anything': { len: 58, draw: axeMeAnything },
  'Sunday Best': { len: 61, draw: sundayBest },
  'Thoughts and Prayers': { len: 56, draw: thoughtsAndPrayers },
  'The Sermon': { len: 58, draw: theSermon },
  'Committee Decision': { len: 101, draw: committeeDecision },
  'Swiss Army Pole': { len: 105, draw: swissArmyPole },
  'The Long Arm of the Law': { len: 102, draw: longArmOfTheLaw },
  'Double Shift': { len: 36, draw: doubleShift },
  'Twice Shy': { len: 36, draw: twiceShy },
  'The Twins': { len: 36, draw: theTwins },
  'Dark Matter of Fact': { len: 70, draw: darkMatterOfFact },
  'Existential Dread': { len: 66, draw: existentialDread },
  'The Void Warranty': { len: 64, draw: voidWarranty },
  'Spell Check': { len: 64, draw: spellCheck },
  'Sharp Mind': { len: 64, draw: sharpMind },
  'Wizard of Odds': { len: 64, draw: wizardOfOdds },
  'Holy Smokes': { len: 52, draw: holySmokes },
  'Fire and Brimstone Inc.': { len: 52, draw: fireAndBrimstone },
  'Smoke Alarm': { len: 52, draw: smokeAlarm },
  'Morning Person': { len: 104, draw: morningPerson },
  'Sunday Service': { len: 107, draw: sundayService },
  'Rise and Shine': { len: 107, draw: riseAndShine },
};

/** Every legendary name with its own design. */
export const LEGENDARY_DESIGNS: string[] = Object.keys(DESIGNS);

/** The warm legendary glint: a sparkle travelling along the weapon (or round a bow's limbs). */
function legendGlint(ctx: Ctx, d: Design, t: number, seed: number): void {
  const k = frac(t * 0.38 + seed * 0.137);
  const tw = Math.sin(k * Math.PI);
  let x: number;
  let y: number;
  if (d.bow) {
    const a = -1.1 + 2.2 * k;
    x = -6 + Math.cos(a) * 26;
    y = Math.sin(a) * 26;
  } else {
    x = d.len * (0.3 + 0.65 * k);
    y = -1.5;
  }
  const s = Math.max(0.55, Math.min(1, d.len / 56));
  glow(ctx, x, y, (3 + 6 * tw) * s, LEG, 0.45 * tw);
  glint(ctx, x, y, (0.6 + 3 * tw) * s, LEG_HI, 0.95 * tw);
}

/**
 * Draw the legendary design for a legendary item's name in weapon local space. Returns false (drawing
 * nothing) when the name has no design. `charge` is the bow/crossbow draw time like drawWeapon's.
 */
export function drawLegendaryWeapon(ctx: CanvasRenderingContext2D, name: string, t: number, charge = 0): boolean {
  const d = DESIGNS[name];
  if (!d) return false;
  d.draw(ctx, t, charge);
  legendGlint(ctx, d, t, name.length + name.charCodeAt(0));
  return true;
}
