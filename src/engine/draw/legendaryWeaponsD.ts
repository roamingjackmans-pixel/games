// D388: legendary weapon designs, part D (merged into legendaryWeapons.ts DESIGNS): the Hex Hammer (Void) and
// the Harvest Sickle (Holy). Same local space as weapons.ts: grip at the origin, pointing along +x.
// Imported values are only ever used inside functions (legendaryWeapons.ts imports this file, and this file
// imports ./weapons, so nothing imported may be read at module load).
import type { Design } from './legendaryWeapons';
import { OUTLINE, blob, glow, poly, shade, spec } from './parts';
import { STEEL, WOOD, band, cord, dot, drift, glint, grip, haft, hash, line, plate, pommel, rivet, sheen, trace, worldUp } from './weapons';

type Ctx = CanvasRenderingContext2D;
type Vec = readonly [number, number];

const TAU = Math.PI * 2;
const VOID = '#9b5bff';
const VOID_HI = '#dcc8ff';
const HOLY = '#ffe98a';
const HOLY_HI = '#fffbe0';

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

function rotV(v: Vec, a: number): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

function clipDo(ctx: Ctx, pts: readonly number[], fn: () => void): void {
  ctx.save();
  trace(ctx, pts);
  ctx.clip();
  fn();
  ctx.restore();
}

function outlineOf(ctx: Ctx, pts: readonly number[], w = 2.2): void {
  trace(ctx, pts);
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function fillPath(ctx: Ctx, color: string, ow = 2, alpha = 1): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
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

function ring(
  ctx: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  w: number,
  alpha = 1,
  a0 = 0,
  a1 = TAU,
  rot = 0,
): void {
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

function star(ctx: Ctx, x: number, y: number, r: number, color: string, rot = -Math.PI / 2, ow = 1): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  fillPath(ctx, color, ow);
}

function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, alpha = 1): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha);
  ctx.font = `bold ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** A string hanging from (ax, ay), swinging (world down). Returns the end and the string's direction. */
function hang(
  ctx: Ctx,
  ax: number,
  ay: number,
  len: number,
  t: number,
  color: string,
  speed = 2.2,
  amp = 0.35,
): [number, number, number, number] {
  const up = worldUp(ctx);
  const d = rotV([-up[0], -up[1]], Math.sin(t * speed) * amp);
  const x = ax + d[0] * len;
  const y = ay + d[1] * len;
  line(ctx, [ax, ay, x, y], OUTLINE, 2);
  line(ctx, [ax, ay, x, y], color, 0.9);
  return [x, y, d[0], d[1]];
}

// ---------------------------------------------------------------------------------------------
// Hex Hammer: Mind Over Matter, Thinking Cap, Headache, Brainstorm
// ---------------------------------------------------------------------------------------------

function hexHaft(ctx: Ctx, wood: string, wrap: string, trim: string): void {
  haft(ctx, -7, 43, 5, wood);
  grip(ctx, -7, 11, 5.8, wrap, shade(wrap, 0.45));
  pommel(ctx, -8.6, 3, trim);
  band(ctx, 14, 2.6, 7.5, trim);
  band(ctx, 36, 3, 8, trim);
}

function socket(ctx: Ctx, color = '#5d626b'): void {
  plate(ctx, [38.5, -4.5, 43, -6, 43, 6, 38.5, 4.5], color, { ow: 1.8 });
}

/** A carved void sigil: a ring and a turning hexagram, glowing softly purple. */
function sigil(ctx: Ctx, x: number, y: number, r: number, t: number, spin = 0.5): void {
  const p = pulse(t, 2.4);
  glow(ctx, x, y, r * 2.6 + p * 2, VOID, 0.35 + 0.3 * p);
  ring(ctx, x, y, r, r, OUTLINE, 1.8, 0.6);
  ring(ctx, x, y, r, r, VOID_HI, 0.8, 0.55 + 0.45 * p);
  for (const off of [0, Math.PI / 3]) {
    const pts: number[] = [];
    for (let i = 0; i <= 3; i++) {
      const a = -Math.PI / 2 + off + t * spin + (i * TAU) / 3;
      pts.push(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82);
    }
    line(ctx, pts, VOID, 1, 0.5 + 0.5 * p);
    line(ctx, pts, VOID_HI, 0.45, 0.4 + 0.6 * p);
  }
  dot(ctx, x, y, r * 0.28, '#ffffff', 0.5 + 0.5 * p);
}

/** Telekinesis: the head floats free of the haft, held there by thought alone (and a little debris). */
function mindOverMatter(ctx: Ctx, t: number): void {
  hexHaft(ctx, '#2e2a36', '#3e3052', '#5d626b');
  socket(ctx, '#4a4656');
  const p = pulse(t, 2.2);
  dot(ctx, 43.5, 0, 1.8, VOID_HI, 0.5 + 0.5 * pulse(t, 4));
  const hx = 53 + Math.sin(t * 2) * 1.2;
  glow(ctx, hx, 0, 24 + p * 3, VOID, 0.32);
  // psychic waves carrying the head
  for (let i = 0; i < 3; i++) {
    const k = frac(t * 0.9 + i / 3);
    ring(ctx, 43.5, 0, 1.5 + k * 6, 4 + k * 9, VOID_HI, 1.1, 0.85 * (1 - k), -1.2, 1.2);
  }
  // pebbles orbiting the head (the back half first)
  const pebbles = (front: boolean): void => {
    for (let i = 0; i < 4; i++) {
      const a = t * 1.4 + (i * TAU) / 4;
      const depth = Math.sin(a);
      if (depth > 0 !== front) continue;
      const x = hx + depth * 10;
      const y = Math.cos(a) * 18;
      const r = 1.3 + 0.4 * hash(i * 3.1) + depth * 0.3;
      blob(ctx, x, y, r * 1.2, r, { fill: front ? '#6d6878' : '#4a4656', outlineW: 1 }, a);
      dot(ctx, x, y, r * 2.4, VOID, 0.12);
    }
  };
  pebbles(false);
  ctx.save();
  ctx.translate(hx, 0);
  ctx.rotate(Math.sin(t * 1.3) * 0.07);
  plate(ctx, [-6, -11, 6, -11, 6, 11, -6, 11], '#3a3644', { under: '#2a2632', splitY: 3 });
  plate(ctx, [-7.5, -15, 7.5, -15, 6.5, -11, -6.5, -11], '#57536a', {
    ow: 1.8,
    under: null,
    edge: [-7.5, -15, 7.5, -15],
    edgeColor: '#8a86a0',
    edgeW: 0.7,
  });
  plate(ctx, [-6.5, 11, 6.5, 11, 7.5, 15, -7.5, 15], '#45414f', { ow: 1.8, under: null });
  // the eye where a haft should be: empty, glowing
  dot(ctx, -6, 0, 2.2, OUTLINE);
  dot(ctx, -6, 0, 1.3, VOID, 0.6 + 0.4 * p);
  sigil(ctx, 0.5, 0, 3.8, t);
  spec(ctx, -4.5, -13, 1);
  ctx.restore();
  pebbles(true);
  const up = worldUp(ctx);
  drift(ctx, hx, 0, t, 4, up, 18, 14, 0.5, 6, (x, y, k) => dot(ctx, x, y, 0.9, VOID_HI, 0.8 * (1 - k)));
}

/** A hammer head in a mortarboard, tassel swinging, thinking very hard. */
function thinkingCap(ctx: Ctx, t: number): void {
  hexHaft(ctx, '#3a2a4a', '#2a2238', '#8a7aa0');
  socket(ctx);
  const p = pulse(t, 2.6);
  glow(ctx, 50, 0, 20 + p * 3, VOID, 0.3);
  // the head
  plate(ctx, [42, -12, 55, -12, 55, 12, 42, 12], '#4a4656', { under: '#34303e', splitY: 3 });
  plate(ctx, [41, -15.5, 56, -15.5, 55, -12, 42, -12], '#5d5a6c', {
    ow: 1.8,
    under: null,
    edge: [41, -15.5, 56, -15.5],
    edgeColor: '#9a96b0',
    edgeW: 0.7,
  });
  plate(ctx, [42, 12, 55, 12, 56, 15.5, 41, 15.5], '#454151', { ow: 1.8, under: null });
  sigil(ctx, 48.5, 0, 3.6, t, -0.4);
  rivet(ctx, 44.5, -8.5, 0.9);
  rivet(ctx, 44.5, 8.5, 0.9);
  // the mortarboard on the finial: skullcap, then the board edge-on
  plate(ctx, [55, -6.5, 59, -6, 59, 6, 55, 6.5], '#1c1824', { ow: 1.8, under: null });
  plate(ctx, [59, -13, 61.8, -13, 61.8, 13, 59, 13], '#1c1824', { ow: 1.8, under: null });
  line(ctx, [59.7, -12, 59.7, 12], '#3e3850', 0.7);
  // the tassel: across the board, then hanging
  line(ctx, [62.4, 0, 62.4, -11.6], OUTLINE, 2);
  line(ctx, [62.4, 0, 62.4, -11.6], VOID, 0.9);
  blob(ctx, 62.4, 0, 1.4, 1.4, { fill: VOID, outlineW: 1 });
  const [tx, ty, dx, dy] = hang(ctx, 62.4, -12, 5, t, VOID, 2.4, 0.45);
  const px = -dy;
  const py = dx;
  poly(
    ctx,
    [
      tx + px * 1.1,
      ty + py * 1.1,
      tx + dx * 4 + px * 1.8,
      ty + dy * 4 + py * 1.8,
      tx + dx * 4 - px * 1.8,
      ty + dy * 4 - py * 1.8,
      tx - px * 1.1,
      ty - py * 1.1,
    ],
    VOID,
    OUTLINE,
    1,
  );
  dot(ctx, tx, ty, 1.3, '#c9a0ff');
  glow(ctx, tx + dx * 2, ty + dy * 2, 5, VOID, 0.3 + 0.3 * p);
  // thought bubbles rising from under the cap, the biggest holding an idea
  const up = worldUp(ctx);
  drift(ctx, 57, 0, t, 3, up, 5, 22, 0.32, 5, (x, y, k) => {
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + k * 3, 0, TAU);
    const a = Math.sin(k * Math.PI);
    fillPath(ctx, '#efe6ff', 0.9, a);
    if (k > 0.55) glint(ctx, x, y, 1.6 * k, VOID, a);
  });
  glint(ctx, 43, -14.5, 1.2 + p * 1.6, VOID_HI, 0.9);
}

/** A bandaged head, throbbing (double beat), pain lines and dizzy stars circling above it. */
function headache(ctx: Ctx, t: number): void {
  hexHaft(ctx, '#2a2631', '#4a2e3a', '#5d626b');
  socket(ctx);
  const u = frac(t * 1.1);
  const th = Math.max(Math.exp(-u * 9), u > 0.22 ? 0.65 * Math.exp(-(u - 0.22) * 9) : 0);
  const cx = 50;
  glow(ctx, cx, 0, 20 + th * 8, VOID, 0.25 + th * 0.35);
  // pain lines
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.5;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const bx = cx + c * (10 + th * 2);
    const by = s * (17 + th * 2);
    const pts = [
      bx,
      by,
      bx + c * 2.5 - s * 1.3,
      by + s * 2.5 + c * 1.3,
      bx + c * 4.5 + s * 1.3,
      by + s * 4.5 - c * 1.3,
      bx + c * 6.5,
      by + s * 6.5,
    ];
    line(ctx, pts, OUTLINE, 2.4, th);
    line(ctx, pts, '#e0a0ff', 1, th);
  }
  const sc = 1 + th * 0.08;
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(sc, sc);
  plate(ctx, [-6.5, -11.5, 6.5, -11.5, 6.5, 11.5, -6.5, 11.5], '#4a3e58', { under: '#352a42', splitY: 3 });
  plate(ctx, [-8, -15.5, 8, -15.5, 7, -11.5, -7, -11.5], '#5e5270', { ow: 1.8, under: null });
  plate(ctx, [-7, 11.5, 7, 11.5, 8, 15.5, -8, 15.5], '#463a54', { ow: 1.8, under: null });
  // a throbbing vein and a cracked void sigil
  line(ctx, [-4, -10, -1.5, -7.5, -3.5, -5, -1, -2.5, -2.8, 0], OUTLINE, 2.2, 0.6);
  line(ctx, [-4, -10, -1.5, -7.5, -3.5, -5, -1, -2.5, -2.8, 0], '#c060ff', 1.1, 0.4 + 0.6 * th);
  glow(ctx, -2, -5, 6 + th * 4, VOID, 0.25 + 0.4 * th);
  ring(ctx, 2.5, -6, 2.6, 2.6, VOID_HI, 0.8, 0.5 + 0.5 * th);
  line(ctx, [2.5, -8.6, 3.2, -6.4, 2, -5.2, 2.8, -3.4], VOID_HI, 0.6, 0.6 + 0.4 * th);
  // sticking plasters, crossed
  for (const r of [-0.55, 0.55]) {
    ctx.save();
    ctx.translate(0, 5);
    ctx.rotate(r);
    plate(ctx, [-2.1, -7.5, 2.1, -7.5, 2.1, 7.5, -2.1, 7.5], '#e8cfa4', { ow: 1.2, under: null });
    for (const y of [-5.5, -4, 4, 5.5]) dot(ctx, 0, y, 0.35, '#a88a60');
    ctx.restore();
  }
  plate(ctx, [-1.8, 2.8, 1.8, 2.8, 1.8, 7.2, -1.8, 7.2], '#f6ecd8', { ow: 0.9, under: null });
  spec(ctx, -5, -13.5, 1);
  ctx.restore();
  // dizzy stars, circling world-above the head
  const up = worldUp(ctx);
  const px = -up[1];
  const py = up[0];
  const ox = cx + up[0] * 22;
  const oy = up[1] * 22;
  ring(ctx, ox, oy, 9, 2.4, VOID_HI, 0.6, 0.3, 0, TAU, Math.atan2(py, px));
  for (let i = 0; i < 3; i++) {
    const a = t * 3 + (i * TAU) / 3;
    const x = ox + px * Math.cos(a) * 9 + up[0] * Math.sin(a) * 2.4;
    const y = oy + py * Math.cos(a) * 9 + up[1] * Math.sin(a) * 2.4;
    star(ctx, x, y, 2.1 + 0.6 * Math.sin(a), i % 2 ? '#ffe14a' : '#c9a0ff', t * 4 + i);
  }
}

/** A brain clamped in the head, a little thundercloud raining on it and striking it with ideas. */
function brainstorm(ctx: Ctx, t: number): void {
  hexHaft(ctx, '#2e2a36', '#3a3448', '#5d626b');
  const cx = 52;
  const cyc = frac(t * 0.8);
  const flash = cyc < 0.14 ? 1 - cyc / 0.14 : 0;
  const strike = Math.floor(t * 0.8);
  const p = pulse(t, 3);
  glow(ctx, cx, 0, 22 + p * 2 + flash * 8, VOID, 0.35 + flash * 0.4);
  // the clamp
  cord(ctx, [40, 0, 43.5, -8, 48, -12.5], '#6d737d', 2, 1);
  cord(ctx, [40, 0, 43.5, 8, 48, 12.5], '#6d737d', 2, 1);
  socket(ctx);
  // the brain
  blob(ctx, cx, 0, 9, 13, { fill: '#d89ae0', under: '#a86ab8', outlineW: 2 });
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, 0, 9, 13, 0, 0, TAU);
  ctx.clip();
  for (const s of [-1, 1]) {
    for (let j = 0; j < 3; j++) {
      const pts: number[] = [];
      for (let y = -13; y <= 13; y += 1.3) pts.push(cx + s * (2.3 + j * 2.4) + Math.sin(y * 0.9 + j * 1.7 + s) * 1.1, y);
      line(ctx, pts, '#9a5aa8', 0.9);
    }
  }
  const fis: number[] = [];
  for (let y = -13; y <= 13; y += 1.3) fis.push(cx + Math.sin(y * 0.7) * 0.5, y);
  line(ctx, fis, '#6a2a80', 1.3);
  // neurons firing along the folds
  for (let i = 0; i < 5; i++) {
    const k = frac(t * 0.7 + hash(i * 2.9));
    const y = -12 + k * 24;
    const x = cx + (hash(i * 5.1) - 0.5) * 12 + Math.sin(y * 0.9 + i) * 1.1;
    dot(ctx, x, y, 0.8, VOID_HI, Math.sin(k * Math.PI));
  }
  if (flash > 0) {
    ctx.globalAlpha *= flash * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 10, -14, 20, 28);
  }
  ctx.restore();
  ring(ctx, cx, 0, 9, 13, OUTLINE, 2);
  spec(ctx, cx - 4, -8, 1.2);
  // the thundercloud, world-above the brain
  const up = worldUp(ctx);
  const px = -up[1];
  const py = up[0];
  const ccx = cx + up[0] * 25;
  const ccy = up[1] * 25;
  drift(ctx, ccx, ccy, t, 6, [-up[0], -up[1]], 12, 12, 1.4, 3, (x, y, k) =>
    line(ctx, [x, y, x - up[0] * 2, y - up[1] * 2], '#b8a8ff', 0.8, 0.8 * (1 - k)),
  );
  if (flash > 0) {
    const pts: number[] = [];
    const ax = ccx - up[0] * 3;
    const ay = ccy - up[1] * 3;
    const bx = cx + up[0] * 10;
    const by = up[1] * 10;
    for (let i = 0; i <= 4; i++) {
      const k = i / 4;
      const off = i === 0 || i === 4 ? 0 : (hash(strike * 3.7 + i) - 0.5) * 6;
      pts.push(ax + (bx - ax) * k + px * off, ay + (by - ay) * k + py * off);
    }
    glow(ctx, (ax + bx) / 2, (ay + by) / 2, 10, VOID, 0.5 * flash);
    line(ctx, pts, VOID, 2.6, flash);
    line(ctx, pts, '#ffffff', 1.1, flash);
  }
  const puffs: readonly (readonly [number, number, number])[] = [
    [-6.5, 0, 3.4],
    [-2.5, 1.4, 4.6],
    [2.8, 1, 4.2],
    [7, 0, 3.2],
  ];
  for (const [o, h, r] of puffs) dot(ctx, ccx + px * o + up[0] * h, ccy + py * o + up[1] * h, r + 1.6, OUTLINE);
  const cloud = flash > 0 ? '#8a7aaa' : '#4a4060';
  for (const [o, h, r] of puffs) dot(ctx, ccx + px * o + up[0] * h, ccy + py * o + up[1] * h, r, cloud);
  for (const [o, h, r] of puffs)
    dot(ctx, ccx + px * o + up[0] * (h + r * 0.35), ccy + py * o + up[1] * (h + r * 0.35), r * 0.5, '#6a5e84', 0.7);
}

// ---------------------------------------------------------------------------------------------
// Harvest Sickle: Grim Reaping, Harvest Moon, Crop Circle, Sickle Day
// ---------------------------------------------------------------------------------------------

/** A crescent blade: an arc of radius r about (cx, cy) from a0 to a1, thickness th tapering to the tip. */
interface Sk {
  cx: number;
  cy: number;
  r: number;
  a0: number;
  a1: number;
  th: number;
}

interface Blade {
  pts: number[];
  /** the inner (cutting) edge, base to tip */
  edge: number[];
  /** the outer back, base to tip */
  spine: number[];
}

function sk(th = 7.5, r = 17): Sk {
  return { cx: 31, cy: 2, r, a0: Math.PI + 0.2, a1: TAU + 0.35, th };
}

function thick(s: Sk, u: number): number {
  return s.th * Math.pow(Math.max(0, 1 - u), 0.8);
}

/** A point on the blade: u along it (0 base, 1 tip), d in from the back (0 back, 1 cutting edge). */
function skAt(s: Sk, u: number, d: number): [number, number] {
  const a = s.a0 + (s.a1 - s.a0) * u;
  const rr = s.r - thick(s, u) * d;
  return [s.cx + Math.cos(a) * rr, s.cy + Math.sin(a) * rr];
}

function skPts(s: Sk, n = 16): Blade {
  const spine: number[] = [];
  const edge: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const [ox, oy] = skAt(s, u, 0);
    const [ix, iy] = skAt(s, u, 1);
    spine.push(ox, oy);
    edge.push(ix, iy);
  }
  const pts = spine.slice();
  for (let i = n - 1; i >= 0; i--) pts.push(edge[i * 2]!, edge[i * 2 + 1]!);
  return { pts, edge, spine };
}

function sickleHandle(ctx: Ctx, wood: string, knob: string): void {
  haft(ctx, -6, 14, 4.6, wood);
  pommel(ctx, -7.2, 3, knob);
}

function ferrule(ctx: Ctx, color: string): void {
  plate(ctx, [11.5, -3.1, 17.5, -3.6, 17.5, 3.6, 11.5, 3.1], color, { ow: 1.8 });
  line(ctx, [12.2, -2.2, 16.8, -2.6], shade(color, 1.5), 0.7);
  rivet(ctx, 14.5, 0, 0.9);
}

/** The soft holy light behind the blade. */
function holyHalo(ctx: Ctx, t: number, k = 1): void {
  glow(ctx, 31, -5, (20 + pulse(t, 2.2) * 3) * Math.max(0.6, k), HOLY, 0.35 * k);
}

/** The faint gold-white glow along the cutting edge. */
function holyEdge(ctx: Ctx, b: Blade, t: number, color = HOLY_HI, k = 1): void {
  const p = pulse(t, 2.6);
  for (let i = 2; i < b.edge.length - 4; i += 6) glow(ctx, b.edge[i]!, b.edge[i + 1]!, 4.5 + p * 1.5, HOLY, 0.22 * k);
  clipDo(ctx, b.pts, () => {
    line(ctx, b.edge, color, 2.8, (0.55 + 0.45 * p) * k);
    line(ctx, b.edge, '#ffffff', 1, (0.45 + 0.55 * p) * k);
  });
}

/** Death's own sickle in miniature: a bone handle, a skull ferrule, an hourglass, and souls let go to the light. */
function grimReaping(ctx: Ctx, t: number): void {
  const s = sk(7.5);
  const b = skPts(s);
  haft(ctx, -6, 14, 4.2, '#d8cfb8');
  for (let x = -4; x <= 11; x += 3.2) blob(ctx, x, 0, 1.3, 3.2, { fill: '#efe8d4', under: '#c8bfa4', outlineW: 1.1 });
  // an hourglass hanging from the butt, running out
  const [hx, hy, dx, dy] = hang(ctx, -7, 0, 4, t, '#c9b890', 2, 0.35);
  ctx.save();
  ctx.translate(hx + dx * 3.6, hy + dy * 3.6);
  ctx.rotate(Math.atan2(-dx, dy));
  const k = frac(t * 0.2);
  poly(ctx, [-2.2, -2.8, 2.2, -2.8, 0.4, 0, 2.2, 2.8, -2.2, 2.8, -0.4, 0], '#e8f0f8', OUTLINE, 1);
  if (k < 0.98) poly(ctx, [-2 * (1 - k), -2.6 * (1 - k), 2 * (1 - k), -2.6 * (1 - k), 0, 0], HOLY, OUTLINE, 0);
  poly(ctx, [-2, 2.6, 2, 2.6, 2 * (1 - k), 2.6 * (1 - k), -2 * (1 - k), 2.6 * (1 - k)], HOLY, OUTLINE, 0);
  line(ctx, [0, 0, 0, 2.4], HOLY, 0.5, 0.9);
  plate(ctx, [-2.8, -3.8, 2.8, -3.8, 2.8, -2.8, -2.8, -2.8], '#4a3a2a', { ow: 1, under: null });
  plate(ctx, [-2.8, 2.8, 2.8, 2.8, 2.8, 3.8, -2.8, 3.8], '#4a3a2a', { ow: 1, under: null });
  ctx.restore();
  // the blade: black steel with a pale holy edge
  holyHalo(ctx, t, 0.8);
  plate(ctx, b.pts, '#4a4654', { under: null });
  clipDo(ctx, b.pts, () => line(ctx, b.spine, '#6a6676', 2.2));
  outlineOf(ctx, b.pts);
  holyEdge(ctx, b, t, '#fff3c8');
  sheen(ctx, b.pts, t, 14, 48, '#ffffff', 0.22, 3, 3);
  // the skull ferrule, eyes lit
  blob(ctx, 15.5, 0, 4.6, 4.3, { fill: '#efe8d4', under: '#c8bfa4', outlineW: 1.6 });
  plate(ctx, [18.6, -2.4, 21.2, -1.9, 21.2, 1.9, 18.6, 2.4], '#e0d8c0', { ow: 1.2, under: null });
  for (const y of [-1, 0, 1]) line(ctx, [19.4, y * 1.2, 21, y * 1.1], '#a89a80', 0.4);
  const ep = pulse(t, 2.4);
  for (const y of [-1.8, 1.8]) {
    dot(ctx, 16.8, y, 1.3, OUTLINE);
    dot(ctx, 16.9, y, 0.55, HOLY, 0.6 + 0.4 * ep);
  }
  spec(ctx, 13.8, -2.4, 0.9);
  // souls drifting up, freed
  const up = worldUp(ctx);
  drift(ctx, 31, -11, t, 4, up, 18, 18, 0.35, 3, (x, y, kk) => {
    const a = Math.sin(kk * Math.PI);
    glow(ctx, x, y, 3 + kk * 2, HOLY, 0.4 * a);
    dot(ctx, x, y, 1.1 - kk * 0.4, '#ffffff', a);
  });
}

/** The blade is the moon itself: a pale cratered crescent, asleep, with stars twinkling in its curve. */
function harvestMoon(ctx: Ctx, t: number): void {
  const s = sk(9.5);
  const b = skPts(s);
  const p = pulse(t, 1.8);
  sickleHandle(ctx, '#2a3050', '#e8d48a');
  grip(ctx, -6, 7, 5, '#3a4470', '#1a2040');
  for (const x of [9.5, 12]) dot(ctx, x, 0, 0.8, '#e8d48a');
  glow(ctx, 30, -4, 24 + p * 3, HOLY, 0.4);
  plate(ctx, b.pts, '#f4e6b0', { under: null });
  clipDo(ctx, b.pts, () => {
    line(ctx, b.edge, '#d8c080', 4);
    line(ctx, b.spine, HOLY_HI, 2);
    for (const [u, d, r] of [
      [0.12, 0.35, 1.6],
      [0.5, 0.3, 1.2],
      [0.62, 0.55, 0.9],
      [0.74, 0.3, 0.8],
    ] as const) {
      const [x, y] = skAt(s, u, d);
      dot(ctx, x, y, r, '#dcc890');
      dot(ctx, x - r * 0.3, y - r * 0.3, r * 0.55, '#c8b070');
    }
  });
  outlineOf(ctx, b.pts);
  // the sleeping face
  const [e1x, e1y] = skAt(s, 0.24, 0.42);
  const [e2x, e2y] = skAt(s, 0.36, 0.42);
  ring(ctx, e1x, e1y, 1.5, 1, OUTLINE, 0.9, 1, 0.2, Math.PI - 0.2);
  ring(ctx, e2x, e2y, 1.5, 1, OUTLINE, 0.9, 1, 0.2, Math.PI - 0.2);
  const [mx, my] = skAt(s, 0.3, 0.72);
  ring(ctx, mx, my, 1.6, 1, OUTLINE, 0.8, 1, 0.3, Math.PI - 0.3);
  const [cx, cy] = skAt(s, 0.19, 0.7);
  dot(ctx, cx, cy, 1.2, '#f0a890', 0.6);
  holyEdge(ctx, b, t);
  ferrule(ctx, '#e8d48a');
  // stars in its curve, and a sleepy z
  const stars: readonly (readonly [number, number])[] = [
    [32, -1],
    [38, 3],
    [26, 5],
    [43, -12],
    [19, -12],
  ];
  stars.forEach(([x, y], i) => glint(ctx, x, y, 0.8 + 1.6 * pulse(t, 2.6, i * 1.7), HOLY_HI, 0.9));
  const up = worldUp(ctx);
  drift(ctx, e2x, e2y, t, 2, rotV(up, 0.5), 3, 14, 0.3, 4, (x, y, k) => text(ctx, 'z', x, y, 3 + k * 3, '#fff3c8', Math.sin(k * Math.PI)));
}

/** Wheat-bound handle, a crop-circle pattern etched in light along the blade, and a visitor beaming it up. */
function cropCircle(ctx: Ctx, t: number): void {
  const s = sk(8.5);
  const b = skPts(s);
  // wheat ears at the butt
  for (let i = -1; i <= 1; i++) {
    const a = Math.PI + i * 0.5;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    line(ctx, [-6, 0, -6 + c * 9, sn * 9], '#8a6a2a', 0.8);
    for (let j = 0; j < 3; j++)
      blob(ctx, -6 + c * (4 + j * 2.2), sn * (4 + j * 2.2), 1.5, 0.9, { fill: '#f0c860', under: '#c89a30', outlineW: 0.9 }, a);
  }
  haft(ctx, -6, 14, 4.6, WOOD);
  for (let i = 0; i < 3; i++) line(ctx, [-5, -1.4 + i * 1.4, 12, -1.6 + i * 1.6], '#e8c060', 0.7, 0.9);
  band(ctx, -1, 1.6, 6.2, '#c8a050');
  band(ctx, 8, 1.6, 6.2, '#c8a050');
  holyHalo(ctx, t);
  plate(ctx, b.pts, STEEL, { under: null });
  clipDo(ctx, b.pts, () => line(ctx, b.spine, '#eef1f4', 1.6));
  // the pattern: a path of rings along the blade, lighting in turn
  const path: number[] = [];
  for (let u = 0.08; u <= 0.86; u += 0.04) path.push(...skAt(s, u, 0.5));
  line(ctx, path, '#c8a040', 1.4, 0.7);
  line(ctx, path, HOLY, 0.6, 0.9);
  for (let i = 0; i < 5; i++) {
    const u = 0.12 + i * 0.17;
    const [x, y] = skAt(s, u, 0.5);
    const r = Math.max(0.8, thick(s, u) * 0.3);
    const a = pulse(t, 3, -i * 0.9);
    glow(ctx, x, y, r * 3 + 2, HOLY, 0.2 + 0.35 * a);
    ring(ctx, x, y, r, r, '#c8a040', 1.4, 0.8);
    ring(ctx, x, y, r, r, HOLY_HI, 0.6, 0.6 + 0.4 * a);
    dot(ctx, x, y, Math.max(0.4, r * 0.35), HOLY_HI, 0.6 + 0.4 * a);
  }
  holyEdge(ctx, b, t);
  sheen(ctx, b.pts, t, 14, 48, '#ffffff', 0.3, 2.8, 3);
  ferrule(ctx, '#9a7a3a');
  // the saucer, hovering world-above the blade, its beam on the pattern
  const up = worldUp(ctx);
  const px = -up[1];
  const py = up[0];
  const [tx, ty] = skAt(s, 0.5, 0.5);
  const hov = 13 + Math.sin(t * 2.3) * 1.2;
  const ux = tx + up[0] * hov;
  const uy = ty + up[1] * hov;
  const bp = pulse(t, 4);
  ctx.save();
  ctx.globalAlpha *= 0.16 + 0.12 * bp;
  ctx.fillStyle = HOLY_HI;
  ctx.beginPath();
  ctx.moveTo(ux + px * 2.2, uy + py * 2.2);
  ctx.lineTo(tx + px * 6, ty + py * 6);
  ctx.lineTo(tx - px * 6, ty - py * 6);
  ctx.lineTo(ux - px * 2.2, uy - py * 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drift(ctx, tx, ty, t, 4, up, 8, hov - 2, 0.7, 5, (x, y, k) => dot(ctx, x, y, 0.7, HOLY_HI, 1 - k));
  ctx.save();
  ctx.translate(ux, uy);
  ctx.rotate(Math.atan2(up[0], -up[1]));
  blob(ctx, 0, -1.4, 2.6, 2.2, { fill: '#bfe8ff', under: '#7ab8d8', outlineW: 1.2 });
  spec(ctx, -0.8, -2.2, 0.6);
  blob(ctx, 0, 0.4, 6.8, 2, { fill: '#c9ced6', under: '#7c838e', outlineW: 1.4 });
  for (let i = 0; i < 3; i++) dot(ctx, -4 + i * 4, 0.8, 0.7, Math.floor(t * 4 + i) % 3 === 0 ? '#ffffff' : HOLY);
  ctx.restore();
}

/** Off sick: a little green, a scarf round its neck, a thermometer in its mouth, and the occasional sneeze. */
function sickleDay(ctx: Ctx, t: number): void {
  const cyc = frac(t * 0.22);
  const sneeze = cyc > 0.9 ? Math.sin(((cyc - 0.9) / 0.1) * Math.PI) : 0;
  ctx.save();
  ctx.translate(Math.sin(t * 50) * 0.7 * sneeze, Math.cos(t * 43) * 0.5 * sneeze);
  const s = sk(8.5);
  const b = skPts(s);
  sickleHandle(ctx, '#8a6a4a', '#a07a50');
  holyHalo(ctx, t, 0.6);
  plate(ctx, b.pts, '#c4d4b4', { under: null });
  clipDo(ctx, b.pts, () => {
    line(ctx, b.spine, '#e4eed8', 2);
    line(ctx, b.edge, '#a8bc98', 3);
  });
  outlineOf(ctx, b.pts);
  holyEdge(ctx, b, t, '#fff3c8', 0.55);
  // the poorly face: heavy lids, flushed cheeks
  for (const u of [0.2, 0.33]) {
    const [x, y] = skAt(s, u, 0.45);
    dot(ctx, x, y, 1.15, OUTLINE);
    ctx.beginPath();
    ctx.arc(x, y, 1.45, Math.PI, TAU);
    ctx.closePath();
    ctx.fillStyle = '#c4d4b4';
    ctx.fill();
    line(ctx, [x - 1.6, y - 0.1, x + 1.6, y + 0.2], OUTLINE, 0.8);
    const [cx, cy] = skAt(s, u - 0.04, 0.78);
    dot(ctx, cx, cy, 1.1, '#e87a7a', 0.55);
  }
  // a thermometer in the mouth, pointing into the curve, the mercury climbing
  const [mx, my] = skAt(s, 0.27, 0.8);
  const dl = Math.hypot(s.cx - mx, s.cy - my) || 1;
  const dx = (s.cx - mx) / dl;
  const dy = (s.cy - my) / dl;
  const ex = mx + dx * 8;
  const ey = my + dy * 8;
  cord(ctx, [mx, my, ex, ey], '#f4f6f8', 1.5, 0.9);
  const lvl = 0.4 + 0.5 * pulse(t, 1.3);
  line(ctx, [mx, my, mx + dx * 8 * lvl, my + dy * 8 * lvl], '#e33b3b', 0.7);
  for (let i = 1; i < 4; i++)
    line(
      ctx,
      [mx + dx * i * 2 - dy * 0.8, my + dy * i * 2 + dx * 0.8, mx + dx * i * 2 - dy * 0.2, my + dy * i * 2 + dx * 0.2],
      '#8a909a',
      0.35,
    );
  dot(ctx, mx, my, 1.8, OUTLINE);
  dot(ctx, mx, my, 1.2, '#e33b3b');
  // a striped scarf knotted round the neck, its tails hanging
  const up = worldUp(ctx);
  for (const [ph, len] of [
    [0, 9],
    [1.3, 7],
  ] as const) {
    const sw = Math.sin(t * 2.4 + ph) * 0.3;
    const d1 = rotV([-up[0], -up[1]], sw);
    const d2 = rotV([-up[0], -up[1]], sw * 1.8);
    const ax = 15;
    const ay = 3;
    const m1x = ax + d1[0] * len * 0.5;
    const m1y = ay + d1[1] * len * 0.5;
    const e1x = m1x + d2[0] * len * 0.5;
    const e1y = m1y + d2[1] * len * 0.5;
    cord(ctx, [ax, ay, m1x, m1y, e1x, e1y], '#c8202a', 2.6, 0.9);
    line(ctx, [m1x - d1[1] * 1.3, m1y + d1[0] * 1.3, m1x + d1[1] * 1.3, m1y - d1[0] * 1.3], '#fff2e0', 1);
    line(ctx, [e1x - d2[1] * 1.3, e1y + d2[0] * 1.3, e1x + d2[1] * 1.3, e1y - d2[0] * 1.3], '#fff2e0', 0.8);
  }
  plate(ctx, [11.5, -4, 18, -4.4, 18, 4.4, 11.5, 4], '#c8202a', { ow: 1.6, under: '#981820', splitY: 1 });
  line(ctx, [13.6, -3.8, 13.6, 3.8], '#fff2e0', 1.2);
  line(ctx, [16, -4, 16, 4], '#fff2e0', 1.2);
  blob(ctx, 15, 3.2, 2, 1.6, { fill: '#d8303a', outlineW: 1.2 });
  // a bead of sweat, sliding off
  const [sx, sy] = skAt(s, 0.12, 0.2);
  drift(ctx, sx, sy, t, 1, [-up[0], -up[1]], 1, 10, 0.5, 2, (x, y, k) => {
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, TAU);
    fillPath(ctx, '#bfe8ff', 0.7, 1 - k);
  });
  // the sneeze: a spray of blessed sparkles
  if (sneeze > 0.05) {
    for (let i = 0; i < 7; i++) {
      const a = (hash(i * 1.9) - 0.5) * 1.1;
      const [vx, vy] = rotV([dx, dy], a);
      const r = 3 + sneeze * (6 + hash(i * 3.3) * 8);
      glint(ctx, mx + vx * r, my + vy * r, 0.8 + sneeze * 1.4, i % 2 ? HOLY_HI : '#e8f4d8', sneeze);
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------------------------

export const DESIGNS_D: Record<string, Design> = {
  'Mind Over Matter': { len: 61, draw: mindOverMatter },
  'Thinking Cap': { len: 62, draw: thinkingCap },
  Headache: { len: 58, draw: headache },
  Brainstorm: { len: 61, draw: brainstorm },
  'Grim Reaping': { len: 48, draw: grimReaping },
  'Harvest Moon': { len: 48, draw: harvestMoon },
  'Crop Circle': { len: 48, draw: cropCircle },
  'Sickle Day': { len: 48, draw: sickleDay },
};
