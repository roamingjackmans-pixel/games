// Telegraph drawing (ART_AUDIO §3): an attack charging, not a floor marker. The exact hit area is always
// drawn (a faint tint plus a dim ground texture over the precise footprint, and a glowing boundary that never
// strays more than ~2 px from the true edge); inside it the charge builds: the texture lights up from the
// centre (from the apex for cones, from the centre line for lines, from the outer edge for rings) and meets the
// boundary at the moment of impact; sparks stream inward and gather; the glow throbs faster toward impact.
// Kind colours are the combat language: Red = #ff3b3b (jagged embers, heat shimmer), Piercing = #8fd3ff
// (crystalline: frost shards, motes and the diagonal stripes that keep it readable without colour), normal =
// warm sand (dust and ground cracks), player skills = gold (clean runes). The attack's damage type only adds
// an accent (ELEMENTS glow) to sparks and cracks. Impacts (flash, shockwave, debris) are echoes drawn by
// drawTelegraphEchoes so they outlive the entity. High contrast adds a dark outline and a solid kind-coloured
// edge under the wisps and strengthens fills; the colorblind icons (skull / hollow ring) stay.
import { rollPos, sweepAngle, wavePos, ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y, type Shape } from '../game/combat/patterns';
import type { Entity, World } from '../game/world';
import {
  dot,
  edgePath,
  emitCharge,
  glowAt,
  hash2,
  lookFor,
  noteImpacts,
  seg,
  setCharge,
  shapePath,
  sparkFlush,
  sparkReset,
  texture,
  clipOutPockets,
  type Charge,
  type Look,
} from './telegraphFx';

export const RED = '#ff3b3b';
export const BLUE = '#8fd3ff';

const NO_DASH: number[] = [];
const DOTS = [2, 10];
const POCKET_DASH = [10, 7];
const RAY_DASH = [10, 10];

type Sweep = Extract<Shape, { k: 'sweep' }>;
type Beam = Extract<Shape, { k: 'beam' }>;
type ExpRing = Extract<Shape, { k: 'expRing' }>;
type Wave = Extract<Shape, { k: 'wave' }>;
type Pockets = Extract<Shape, { k: 'pockets' }>;
type Roll = Extract<Shape, { k: 'roll' }>;

// scratch shapes (no per-frame allocation)
const SC_CONE: Extract<Shape, { k: 'cone' }> = { k: 'cone', x: 0, y: 0, a: 0, half: 0, r: 0 };
const SC_LINE: Extract<Shape, { k: 'line' }> = { k: 'line', x: 0, y: 0, a: 0, w: 0, l: 0 };
const ONE: Shape[] = [SC_CONE];
const GAPS: number[] = [];
const numCmp = (a: number, b: number): number => a - b;

function isArea(s: Shape): boolean {
  return s.k === 'circle' || s.k === 'ring' || s.k === 'line' || s.k === 'cone';
}

function areaShape(s: Shape, all: boolean): boolean {
  return all ? s.k !== 'sweep' && s.k !== 'expRing' && s.k !== 'wave' && s.k !== 'pockets' : isArea(s);
}

/** Tint alpha over the whole footprint, before the charge. */
function baseA(l: Look, hc: boolean): number {
  const a = l.kind === 'normal' ? 0.07 : l.kind === 'player' ? 0.08 : 0.1;
  return hc ? a * 1.9 : a;
}

/** Dim texture alpha over the whole footprint (Piercing stripes stay legible: colorblind rule). */
function dimA(l: Look, hc: boolean): number {
  const a = l.kind === 'pierce' ? 0.32 : l.kind === 'red' ? 0.17 : 0.15;
  return Math.min(0.8, hc ? a * 1.6 : a);
}

export function drawTelegraph(ctx: CanvasRenderingContext2D, w: World, t: Entity, highContrast: boolean, alphaTime: number): void {
  const tg = t.tg!;
  if (tg.hidden) return;
  const now = alphaTime;
  const look = lookFor(tg.kind, tg.team, tg.dmgType);
  const pre = now < tg.impact;
  // a pulsing telegraph (grids) recharges between pulses
  const t0 = tg.pulsesDone > 0 ? Math.max(tg.start, tg.impact - tg.pulseGap) : tg.start;
  const c = setCharge(now, t0, tg.impact, tg.shapes.length, t.id);
  const tau = now - tg.impact;
  if (tg.mode === 'instant') noteImpacts(t.id, tg.start, tg.pulsesDone, tg.shapes, look, now);
  ctx.save();
  let areas = 0;
  for (const s of tg.shapes) if (isArea(s)) areas++;
  if (areas) drawAreas(ctx, tg.shapes, false, look, c, highContrast, pre, tau, tg.mode, t.id);
  for (const s of tg.shapes) {
    switch (s.k) {
      case 'sweep':
        drawSweep(ctx, s, look, c, highContrast, pre, tau, t.id);
        break;
      case 'beam':
        drawBeam(ctx, s, look, c, highContrast, pre, tau, t.id);
        break;
      case 'expRing':
        drawExpRing(ctx, s, look, c, highContrast, pre, tau, t.id);
        break;
      case 'wave':
        drawWave(ctx, s, look, c, highContrast, pre, tau, t.id);
        break;
      case 'pockets':
        if (pre) drawPockets(ctx, s, look, c, highContrast);
        break;
      case 'roll':
        drawRollLane(ctx, s, look, c, highContrast, pre, tau, t.id);
        break;
      default:
        break;
    }
  }
  ctx.restore();
  void w;
}

/**
 * The static areas of a telegraph as one batch (a grid of 30 circles costs about what one does): footprint,
 * charged texture, core glows, wispy edge, sparks. Instant shapes draw nothing after impact (their echo does);
 * 'once' / 'tick' shapes burn at full charge while active.
 */
/** more areas than this in one telegraph draw lighter (D162) */
const MANY_AREAS = 8;

/** a telegraph's textured footprint, painted once (keyed by its shapes list, which never changes) */
const footprints = new WeakMap<Shape[], { canvas: HTMLCanvasElement | OffscreenCanvas; x: number; y: number; w: number; h: number; k: number; pat: CanvasPattern }>();

/** The textured footprint of many areas as one picture, at the canvas's current scale (or null if it has no size). */
function footprintLayer(ctx: CanvasRenderingContext2D, shapes: Shape[], all: boolean, pat: CanvasPattern): { canvas: HTMLCanvasElement | OffscreenCanvas; x: number; y: number; w: number; h: number } | null {
  const t = ctx.getTransform();
  const k = Math.max(0.25, Math.min(3, Math.hypot(t.a, t.b)));
  const hit = footprints.get(shapes);
  if (hit && Math.abs(hit.k - k) < 0.01 && hit.pat === pat) return hit;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of shapes) {
    if (!areaShape(s, all) || s.k !== 'circle') continue;
    x0 = Math.min(x0, s.x - s.r);
    y0 = Math.min(y0, s.y - s.r);
    x1 = Math.max(x1, s.x + s.r);
    y1 = Math.max(y1, s.y + s.r);
  }
  if (!(x1 > x0 && y1 > y0)) return null;
  const x = Math.floor(x0) - 2;
  const y = Math.floor(y0) - 2;
  const w = Math.ceil(x1 - x) + 4;
  const h = Math.ceil(y1 - y) + 4;
  const pw = Math.min(4096, Math.ceil(w * k));
  const ph = Math.min(4096, Math.ceil(h * k));
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(pw, ph) : Object.assign(document.createElement('canvas'), { width: pw, height: ph });
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.setTransform(pw / w, 0, 0, ph / h, -x * (pw / w), -y * (ph / h));
  g.beginPath();
  for (const s of shapes) if (areaShape(s, all)) shapePath(g, s, 1);
  g.fillStyle = pat;
  g.fill();
  const out = { canvas, x, y, w, h, k, pat };
  footprints.set(shapes, out);
  return out;
}

function drawAreas(ctx: CanvasRenderingContext2D, shapes: Shape[], all: boolean, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, mode: string, id: number, k = 1): void {
  if (!pre && mode === 'instant') return;
  const active = !pre;
  if (active) c.p = 1;
  const p = c.p;
  const pulse = c.pulse;
  const flick = active ? 0.85 + 0.15 * Math.sin(c.t * 37 + id) : 1;
  const pat = texture(ctx, l);
  // many small areas at once (a grid, a scatter) draw lighter (D162): one core glow, plain round edges, sparks from
  // a dozen of them; a single big area keeps the full look
  let count = 0;
  for (const s of shapes) if (areaShape(s, all)) count++;
  const plain = count > MANY_AREAS;
  ctx.save();
  // 1. the exact footprint: a faint tint (plus the frost stripes for Piercing: the colorblind motif covers
  // the whole area; other kinds keep their texture for the charged part, which keeps software raster cheap)
  ctx.beginPath();
  for (const s of shapes) if (areaShape(s, all)) shapePath(ctx, s, 1);
  ctx.fillStyle = l.main;
  ctx.globalAlpha = active ? (hc ? 0.42 : 0.3) * flick : baseA(l, hc) * (0.8 + 0.45 * pulse * p);
  ctx.fill();
  if (pat && (active || l.kind === 'pierce' || hc)) {
    if (active) ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = active ? 0.8 * flick : dimA(l, hc);
    if (plain) {
      // many areas: their textured footprint is painted once and stamped each frame (D162)
      const f = footprintLayer(ctx, shapes, all, pat);
      if (f) ctx.drawImage(f.canvas as CanvasImageSource, f.x, f.y, f.w, f.h);
    } else {
      ctx.fillStyle = pat;
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // 2. the charge: the texture lights up from the centre and meets the edge at impact
  if (!active && p > 0.004) {
    ctx.beginPath();
    for (const s of shapes) if (areaShape(s, all)) shapePath(ctx, s, p);
    ctx.fillStyle = l.main;
    ctx.globalAlpha = (0.12 + 0.1 * pulse) * (hc ? 1.6 : 1) * k;
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    // (many areas: the charge fill and its front line show the build-up without a second texture pass, D162)
    if (pat && !plain) {
      // heat shimmer: red cracks waver
      const wx = l.kind === 'red' ? Math.round(Math.sin(c.t * 9.1) * 1.6) : 0;
      const wy = l.kind === 'red' ? Math.round(Math.cos(c.t * 7.3) * 1.6) : 0;
      ctx.translate(wx, wy);
      ctx.fillStyle = pat;
      ctx.globalAlpha = Math.min(1, 0.45 + 0.35 * p + 0.2 * pulse) * k;
      ctx.fill();
      ctx.translate(-wx, -wy);
    }
    // the charge front: a fine line of light where the charge meets the dim area
    ctx.lineJoin = 'round';
    ctx.strokeStyle = l.hot;
    ctx.lineWidth = hc ? 2.6 : 1.6;
    ctx.globalAlpha = (0.3 + 0.5 * p) * k;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  // 3. gathering cores
  const dens = c.dens;
  for (const s of shapes) {
    if (!areaShape(s, all)) continue;
    if (s.k === 'circle') {
      glowAt(ctx, s.x, s.y, s.r * (0.3 + 0.45 * p), l.main, (0.14 + 0.42 * p) * (0.7 + 0.3 * pulse) * (active ? 0.7 : 1));
      if (dens >= 0.5 && !plain) glowAt(ctx, s.x, s.y, s.r * (0.12 + 0.2 * p), l.accent, 0.5 * p * (0.6 + 0.4 * pulse));
    } else if (s.k === 'cone') {
      const r = Math.min(s.r, 320);
      glowAt(ctx, s.x, s.y, r * (0.25 + 0.35 * p), l.main, (0.15 + 0.45 * p) * (0.7 + 0.3 * pulse));
      glowAt(ctx, s.x, s.y, r * (0.08 + 0.12 * p), l.accent, 0.6 * p);
    }
  }
  ctx.restore();
  // 4. the boundary: a soft throbbing glow band on the true line, then the kind's wisps on top
  ctx.beginPath();
  const eseed = c.step * 13 + id;
  // (the wispy edge is hundreds of jittered points per circle, stroked twice: plain arcs when there are many, D162)
  for (const s of shapes) {
    if (!areaShape(s, all)) continue;
    if (plain && s.k === 'circle') {
      ctx.moveTo(s.x + s.r, s.y);
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    } else edgePath(ctx, s, l.kind, eseed);
  }
  ctx.lineJoin = 'bevel';
  if (hc) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = l.deep;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = l.main;
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (!plain) {
    ctx.globalAlpha = (0.16 + 0.14 * pulse) * (active ? 1.4 : 0.6 + 0.6 * p);
    ctx.strokeStyle = l.main;
    ctx.lineWidth = 9;
    ctx.stroke();
  }
  edgeStroke(ctx, l, hc);
  // 5. sparks streaming in
  sparkReset();
  let i = 0;
  const every = plain ? Math.ceil(count / 12) : 1;
  let j = 0;
  for (const s of shapes) if (areaShape(s, all) && j++ % every === 0) emitCharge(s, l, c, i++);
  sparkFlush(ctx, l, (active ? 0.9 : 0.55 + 0.45 * p) * k, hc);
}

/** The crisp layer of an edge path already built in ctx. */
function edgeStroke(ctx: CanvasRenderingContext2D, l: Look, hc: boolean): void {
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = l.kind === 'pierce' || l.kind === 'player' || hc ? l.hot : l.main;
  ctx.lineWidth = hc ? 1.6 : l.kind === 'red' ? 2 : 1.6;
  ctx.stroke();
}

function fillOne(ctx: CanvasRenderingContext2D, s: Shape, color: string | CanvasPattern, alpha: number): void {
  ctx.beginPath();
  shapePath(ctx, s, 1);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
}

// ---------------------------------------------------------------- sweeps

function sweepShape(s: Sweep, a: number): Shape {
  if (s.line) {
    SC_LINE.x = s.x;
    SC_LINE.y = s.y;
    SC_LINE.a = a;
    SC_LINE.w = s.w;
    SC_LINE.l = Math.min(1600, s.r);
    return SC_LINE;
  }
  SC_CONE.x = s.x;
  SC_CONE.y = s.y;
  SC_CONE.a = a;
  SC_CONE.half = s.half;
  SC_CONE.r = Math.min(1600, s.r);
  return SC_CONE;
}

/** A rotating cone / beam: the start wedge charges, a dotted ember arc shows the way it will turn. */
/** A sweep, with its gaps (D163) cut out and their safe rings marked. */
function drawSweep(ctx: CanvasRenderingContext2D, s: Sweep, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, id: number): void {
  if (!s.gaps?.length) {
    drawSweepBody(ctx, s, l, c, hc, pre, tau, id);
    return;
  }
  const hw = (s.gapW ?? 130) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-4000, -4000, 9000, 9000);
  for (const g of s.gaps) {
    ctx.moveTo(s.x + g + hw, s.y);
    ctx.arc(s.x, s.y, g + hw, 0, Math.PI * 2);
    if (g - hw > 0) {
      ctx.moveTo(s.x + g - hw, s.y);
      ctx.arc(s.x, s.y, g - hw, 0, Math.PI * 2);
    }
  }
  ctx.clip('evenodd');
  drawSweepBody(ctx, s, l, c, hc, pre, tau, id);
  ctx.restore();
  // the safe rings: a calm white band at each gap's distance
  ctx.beginPath();
  for (const g of s.gaps) {
    ctx.moveTo(s.x + g + hw, s.y);
    ctx.arc(s.x, s.y, g + hw, 0, Math.PI * 2);
    if (g - hw > 0) {
      ctx.moveTo(s.x + g - hw, s.y);
      ctx.arc(s.x, s.y, g - hw, 0, Math.PI * 2);
    }
  }
  ctx.setLineDash(DOTS);
  ctx.lineDashOffset = -c.t * 30;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = hc ? 3.5 : 2.5;
  ctx.globalAlpha = pre ? 0.55 + 0.25 * c.pulse : 0.45;
  ctx.stroke();
  ctx.setLineDash(NO_DASH);
  ctx.lineCap = 'butt';
}

function drawSweepBody(ctx: CanvasRenderingContext2D, s: Sweep, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, id: number): void {
  const dir = Math.sign(s.arc) || 1;
  if (pre) {
    ONE[0] = sweepShape(s, s.a0);
    drawAreas(ctx, ONE, true, l, c, hc, true, tau, 'once', id);
    const rr = Math.min(s.r, 260) * 0.7;
    ctx.beginPath();
    ctx.arc(s.x, s.y, rr, s.a0, s.a0 + s.arc, dir < 0);
    ctx.setLineDash(DOTS);
    ctx.lineDashOffset = -c.t * 50;
    ctx.lineCap = 'round';
    ctx.lineWidth = hc ? 5 : 3.5;
    ctx.strokeStyle = l.main;
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    // arrowhead at the end of the turn
    const ae = s.a0 + s.arc;
    const ex = s.x + Math.cos(ae) * rr;
    const ey = s.y + Math.sin(ae) * rr;
    const tx = -Math.sin(ae) * dir;
    const ty = Math.cos(ae) * dir;
    const nx = Math.cos(ae);
    const ny = Math.sin(ae);
    ctx.beginPath();
    ctx.moveTo(ex - tx * 11 + nx * 9, ey - ty * 11 + ny * 9);
    ctx.lineTo(ex + tx * 3, ey + ty * 3);
    ctx.lineTo(ex - tx * 11 - nx * 9, ey - ty * 11 - ny * 9);
    ctx.lineWidth = hc ? 4.5 : 3;
    ctx.strokeStyle = l.hot;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.lineCap = 'butt';
    // a comet running the arc, the way the sweep will go
    const f = (c.t * 0.8) % 1;
    const ac = s.a0 + s.arc * f;
    glowAt(ctx, s.x + Math.cos(ac) * rr, s.y + Math.sin(ac) * rr, 16, l.main, 0.9 * Math.sin(Math.PI * f));
    return;
  }
  const a = sweepAngle(s, tau);
  // afterimages where it just passed (fill only, faint: never mistaken for the live wedge)
  for (let g = 1; g <= 3; g++) {
    const ag = a - dir * 0.07 * g;
    if ((ag - s.a0) * dir < 0) break;
    fillOne(ctx, sweepShape(s, ag), l.main, 0.1 / g);
  }
  const sh = sweepShape(s, a);
  ONE[0] = sh;
  drawAreas(ctx, ONE, true, l, c, hc, false, tau, 'once', id);
  // the hot core along the wedge
  const L = Math.min(1600, s.r) * 0.97;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + Math.cos(a) * L, s.y + Math.sin(a) * L);
  ctx.lineCap = 'round';
  ctx.strokeStyle = l.hot;
  ctx.globalAlpha = 0.75 * (0.8 + 0.2 * Math.sin(c.t * 43 + id));
  ctx.lineWidth = s.line ? Math.max(3, s.w * 0.28) : 3;
  ctx.stroke();
  ctx.lineCap = 'butt';
  glowAt(ctx, s.x, s.y, 40, l.main, 0.7);
  // sparks shed off the leading edge
  const lead = a + dir * (s.line ? 0 : s.half);
  const off = s.line ? s.w / 2 : 0;
  const lx = Math.cos(lead);
  const ly = Math.sin(lead);
  const px = -ly * dir;
  const py = lx * dir;
  sparkReset();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const h = hash2(id * 7 + i, 3);
    const u = (c.t * (1.5 + h) + h * 9) % 1;
    const d = 30 + (L - 30) * hash2(id * 7 + i, 5);
    const bx = s.x + lx * d + px * off;
    const by = s.y + ly * d + py * off;
    const len = 6 + 16 * u;
    seg(i % 3 === 0, bx + px * u * 18, by + py * u * 18, bx + px * (u * 18 + len), by + py * (u * 18 + len));
  }
  sparkFlush(ctx, l, 0.8, hc);
  if (tau < 0.15) fillOne(ctx, sh, l.hot, 0.55 * (1 - tau / 0.15));
}

// ---------------------------------------------------------------- beams

/** A tracking beam: it draws itself in (the core widens from its centre line), then burns. */
function drawBeam(ctx: CanvasRenderingContext2D, s: Beam, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, id: number): void {
  ONE[0] = s;
  if (pre) {
    drawAreas(ctx, ONE, true, l, c, hc, true, tau, 'once', id);
    glowAt(ctx, s.x, s.y, s.w * (0.8 + 1.4 * c.p), l.main, 0.25 + 0.6 * c.p * (0.7 + 0.3 * c.pulse));
    glowAt(ctx, s.x, s.y, s.w * (0.3 + 0.5 * c.p), l.accent, 0.7 * c.p);
    return;
  }
  drawAreas(ctx, ONE, true, l, c, hc, false, tau, 'tick', id);
  const ca = Math.cos(s.a);
  const sa = Math.sin(s.a);
  const fl = 0.8 + 0.2 * Math.sin(c.t * 47 + id);
  const hw = s.w * 0.17 * fl;
  ctx.beginPath();
  ctx.moveTo(s.x - sa * hw, s.y + ca * hw);
  ctx.lineTo(s.x + ca * s.l - sa * hw, s.y + sa * s.l + ca * hw);
  ctx.lineTo(s.x + ca * s.l + sa * hw, s.y + sa * s.l - ca * hw);
  ctx.lineTo(s.x + sa * hw, s.y - ca * hw);
  ctx.closePath();
  ctx.fillStyle = l.hot;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  glowAt(ctx, s.x, s.y, s.w * 2.2, l.main, 0.8);
  glowAt(ctx, s.x, s.y, s.w * 0.9, l.accent, 0.8);
  const L = Math.min(s.l, 1500);
  glowAt(ctx, s.x + ca * L, s.y + sa * L, s.w * 1.4 * fl, l.main, 0.7);
  if (tau < 0.15) fillOne(ctx, s, l.hot, 0.6 * (1 - tau / 0.15));
}

// ---------------------------------------------------------------- expanding rings

function ringArcs(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, halfGap: number): void {
  if (r <= 0.5) return;
  if (GAPS.length === 0) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
    return;
  }
  for (let i = 0; i < GAPS.length; i++) {
    const g0 = GAPS[i]! + halfGap;
    const g1 = (i + 1 < GAPS.length ? GAPS[i + 1]! : GAPS[0]! + Math.PI * 2) - halfGap;
    if (g1 <= g0) continue;
    ctx.moveTo(x + Math.cos(g0) * r, y + Math.sin(g0) * r);
    ctx.arc(x, y, r, g0, g1);
  }
}

function inGap(a: number, halfGap: number): boolean {
  for (const g of GAPS) {
    let d = a - g;
    d -= Math.round(d / (Math.PI * 2)) * Math.PI * 2;
    if (Math.abs(d) <= halfGap) return true;
  }
  return false;
}

/** A shockwave forming around its caster, then rolling out: the gaps are clean breaks with bright caps. */
function drawExpRing(ctx: CanvasRenderingContext2D, s: ExpRing, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, id: number): void {
  const p = pre ? c.p : 1;
  const R = pre ? 60 + 40 * p : s.speed * tau;
  const thick = pre ? Math.max(6, s.thick * (0.35 + 0.65 * p)) : s.thick;
  GAPS.length = 0;
  for (const g of s.gaps) GAPS.push(g);
  GAPS.sort(numCmp);
  const halfGap = s.gapW / 2 / Math.max(R, 30);
  const pat = texture(ctx, l);
  ctx.lineCap = 'butt';
  // the band
  ctx.beginPath();
  ringArcs(ctx, s.x, s.y, R, halfGap);
  if (hc) {
    ctx.strokeStyle = l.deep;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = thick + 6;
    ctx.stroke();
  }
  ctx.strokeStyle = l.main;
  ctx.globalAlpha = pre ? (0.2 + 0.25 * p) * (0.8 + 0.4 * c.pulse) : hc ? 0.55 : 0.4;
  ctx.lineWidth = thick;
  ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  if (pat) {
    ctx.strokeStyle = pat;
    ctx.globalAlpha = pre ? 0.45 + 0.45 * p : 0.85;
    ctx.stroke();
  }
  // a soft halo hugging the band
  ctx.strokeStyle = l.main;
  ctx.globalAlpha = pre ? 0.06 + 0.1 * p : 0.12;
  ctx.lineWidth = thick + 14;
  ctx.stroke();
  if (!pre) {
    // the wake: dust and light left behind the rolling front
    ctx.beginPath();
    ringArcs(ctx, s.x, s.y, Math.max(1, R - thick / 2 - 16), halfGap);
    ctx.globalAlpha = 0.07;
    ctx.lineWidth = 26;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  // leading (bright) and trailing edges
  ctx.beginPath();
  ringArcs(ctx, s.x, s.y, R + thick / 2, halfGap);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = l.main;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = l.hot;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = hc ? 3.5 : 2.2;
  ctx.stroke();
  ctx.beginPath();
  ringArcs(ctx, s.x, s.y, Math.max(1, R - thick / 2), halfGap);
  ctx.strokeStyle = l.main;
  ctx.globalAlpha = hc ? 0.95 : 0.6;
  ctx.lineWidth = hc ? 3 : 1.5;
  ctx.stroke();
  // gap caps: bright radial ticks so the breaks read at a glance
  if (GAPS.length) {
    ctx.beginPath();
    for (const g of GAPS) {
      for (let sgn = -1; sgn <= 1; sgn += 2) {
        const a = g + sgn * halfGap;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        ctx.moveTo(s.x + ca * (R - thick / 2 - 3), s.y + sa * (R - thick / 2 - 3));
        ctx.lineTo(s.x + ca * (R + thick / 2 + 3), s.y + sa * (R + thick / 2 + 3));
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = hc ? 4 : 2.5;
    ctx.stroke();
  }
  sparkReset();
  if (pre) {
    // safe lanes: dashed white rays through the gaps
    ctx.setLineDash(RAY_DASH);
    ctx.lineDashOffset = -c.t * 20;
    ctx.lineWidth = hc ? 3 : 2;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (const g of s.gaps) {
      ctx.moveTo(s.x + Math.cos(g) * 40, s.y + Math.sin(g) * 40);
      ctx.lineTo(s.x + Math.cos(g) * 900, s.y + Math.sin(g) * 900);
    }
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    glowAt(ctx, s.x, s.y, R * (0.6 + 0.5 * p), l.main, 0.2 + 0.4 * p);
    // energy gathering onto the forming ring (never inside a gap)
    for (let i = 0; i < 26; i++) {
      const h = hash2(id * 13 + i, 1);
      const a = h * Math.PI * 2;
      if (inGap(a, halfGap * 1.3)) continue;
      const u = (c.ph * (0.8 + 0.5 * hash2(id * 13 + i, 2)) + h * 5) % 1;
      const side = i & 1 ? 1 : -1;
      const d = R + side * (thick / 2 + 50 * (1 - Math.pow(u, 1.4)));
      const len = 6 + 10 * p;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (l.kind === 'pierce') dot(i % 3 === 0, s.x + ca * d, s.y + sa * d, 1.3 + 1.5 * Math.sin(Math.PI * u));
      else seg(i % 3 === 0, s.x + ca * (d + side * len), s.y + sa * (d + side * len), s.x + ca * d, s.y + sa * d);
    }
  } else {
    // debris shed behind the rolling front
    const n = Math.min(40, Math.round(R / 14));
    for (let i = 0; i < n; i++) {
      const h = hash2(id * 17 + i, 1);
      const a = h * Math.PI * 2;
      if (inGap(a, halfGap * 1.2)) continue;
      const u = (c.t * (1.2 + h) + h * 7) % 1;
      const d = R - thick / 2 - u * 26;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (l.kind === 'pierce') dot(i % 3 === 0, s.x + ca * d, s.y + sa * d, (1 - u) * 2.4);
      else seg(i % 3 === 0, s.x + ca * d, s.y + sa * d, s.x + ca * (d + 8), s.y + sa * (d + 8));
    }
    if (tau < 0.15) glowAt(ctx, s.x, s.y, 90, l.hot, 0.9 * (1 - tau / 0.15));
  }
  sparkFlush(ctx, l, 0.85, hc);
}

// ---------------------------------------------------------------- waves

/** A wall of energy crossing the room: bright leading edge, chevrons for its heading, dust in its wake. */
function drawWave(ctx: CanvasRenderingContext2D, s: Wave, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, id: number): void {
  const horiz = s.dir === 'east' || s.dir === 'west';
  const sign = s.dir === 'west' || s.dir === 'north' ? 1 : -1;
  const pos = pre ? wavePos(s, 0) + sign * s.w * 0.6 : wavePos(s, tau);
  const p = pre ? c.p : 1;
  const x0 = horiz ? pos - s.w / 2 : ROOM_MIN_X - 32;
  const y0 = horiz ? ROOM_MIN_Y - 32 : pos - s.w / 2;
  const bw = horiz ? s.w : ROOM_MAX_X - ROOM_MIN_X + 64;
  const bh = horiz ? ROOM_MAX_Y - ROOM_MIN_Y + 64 : s.w;
  // gaps (D163): the wall is drawn with clean breaks, capped by bright posts
  const gw = (s.gapW ?? 130) / 2;
  const gaps = s.gaps ?? [];
  if (gaps.length) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-4000, -4000, 9000, 9000);
    for (const g of gaps) {
      if (horiz) ctx.rect(-4000, g - gw, 9000, gw * 2);
      else ctx.rect(g - gw, -4000, gw * 2, 9000);
    }
    ctx.clip('evenodd');
  }
  ctx.beginPath();
  ctx.rect(x0, y0, bw, bh);
  ctx.fillStyle = l.main;
  ctx.globalAlpha = pre ? (0.14 + 0.2 * p) * (0.8 + 0.4 * c.pulse) * (hc ? 1.5 : 1) : hc ? 0.55 : 0.42;
  ctx.fill();
  const pat = texture(ctx, l);
  if (pat) {
    ctx.fillStyle = pat;
    ctx.globalAlpha = pre ? 0.45 + 0.45 * p : 0.9;
    ctx.fill();
  }
  // edges: the leading one is white-hot
  const lead = pos + (sign * s.w) / 2;
  const trail = pos - (sign * s.w) / 2;
  ctx.beginPath();
  if (horiz) {
    ctx.moveTo(lead, y0);
    ctx.lineTo(lead, y0 + bh);
  } else {
    ctx.moveTo(x0, lead);
    ctx.lineTo(x0 + bw, lead);
  }
  if (hc) {
    ctx.strokeStyle = l.deep;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  ctx.strokeStyle = l.hot;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = hc ? 4 : 3;
  ctx.stroke();
  ctx.beginPath();
  if (horiz) {
    ctx.moveTo(trail, y0);
    ctx.lineTo(trail, y0 + bh);
  } else {
    ctx.moveTo(x0, trail);
    ctx.lineTo(x0 + bw, trail);
  }
  ctx.strokeStyle = l.main;
  ctx.globalAlpha = hc ? 1 : 0.6;
  ctx.lineWidth = hc ? 3 : 1.5;
  ctx.stroke();
  // chevrons for the heading
  ctx.beginPath();
  const k = 12;
  if (horiz) {
    for (let y = 120; y < 700; y += 140) {
      ctx.moveTo(pos - sign * k, y - k * 1.3);
      ctx.lineTo(pos + sign * k * 0.6, y);
      ctx.lineTo(pos - sign * k, y + k * 1.3);
    }
  } else {
    for (let x = 120; x < 1240; x += 160) {
      ctx.moveTo(x - k * 1.3, pos - sign * k);
      ctx.lineTo(x, pos + sign * k * 0.6);
      ctx.lineTo(x + k * 1.3, pos - sign * k);
    }
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = pre ? l.hot : '#ffffff';
  ctx.globalAlpha = pre ? 0.7 + 0.3 * c.pulse : 0.85;
  ctx.lineWidth = hc ? 5 : 3.5;
  ctx.stroke();
  ctx.lineCap = 'butt';
  // dust / spray streaking the way it travels
  sparkReset();
  const span = horiz ? bh : bw;
  for (let i = 0; i < 34; i++) {
    const h = hash2(id * 19 + i, 1);
    const u = (c.t * (pre ? 0.6 : 1.6) * (0.7 + h) + h * 11) % 1;
    const across = (horiz ? y0 : x0) + hash2(id * 19 + i, 2) * span;
    const along = trail + sign * s.w * (pre ? u : u * 1.15);
    const len = (pre ? 6 : 14) * (0.5 + h);
    if (horiz) seg(i % 3 === 0, along - sign * len, across, along, across);
    else seg(i % 3 === 0, across, along - sign * len, across, along);
  }
  sparkFlush(ctx, l, pre ? 0.4 + 0.5 * p : 0.85, hc);
  if (!pre && tau < 0.15) {
    ctx.beginPath();
    ctx.rect(x0, y0, bw, bh);
    ctx.fillStyle = l.hot;
    ctx.globalAlpha = 0.5 * (1 - tau / 0.15);
    ctx.fill();
  }
  if (!gaps.length) return;
  ctx.restore();
  // posts at each break's edges, and a calm white line down the middle of the opening
  ctx.beginPath();
  for (const g of gaps)
    for (const e of [g - gw, g + gw]) {
      if (horiz) {
        ctx.moveTo(x0, e);
        ctx.lineTo(x0 + bw, e);
      } else {
        ctx.moveTo(e, y0);
        ctx.lineTo(e, y0 + bh);
      }
    }
  ctx.strokeStyle = l.hot;
  ctx.lineWidth = hc ? 5 : 3.5;
  ctx.globalAlpha = 0.95;
  ctx.stroke();
  ctx.beginPath();
  for (const g of gaps) {
    if (horiz) {
      ctx.moveTo(x0 + 6, g);
      ctx.lineTo(x0 + bw - 6, g);
    } else {
      ctx.moveTo(g, y0 + 6);
      ctx.lineTo(g, y0 + bh - 6);
    }
  }
  ctx.setLineDash(DOTS);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = hc ? 3 : 2;
  ctx.globalAlpha = pre ? 0.5 + 0.3 * c.pulse : 0.6;
  ctx.stroke();
  ctx.setLineDash(NO_DASH);
}

// ---------------------------------------------------------------- pockets

/** The whole room charges; the safe pockets stay calm, clean and white-rimmed. The impact is an echo. */
function drawPockets(ctx: CanvasRenderingContext2D, s: Pockets, l: Look, c: Charge, hc: boolean): void {
  const p = c.p;
  const qs = s.pockets;
  let overlap = false;
  for (let i = 0; i < qs.length; i++)
    for (let j = i + 1; j < qs.length; j++) {
      const a = qs[i]!;
      const b = qs[j]!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) overlap = true;
    }
  ctx.save();
  ctx.beginPath();
  if (overlap) {
    // overlapping pockets must stay safe where they overlap (an even-odd fill would paint the overlap): clip
    clipOutPockets(ctx, qs);
    ctx.beginPath();
    ctx.rect(ROOM_MIN_X - 32, ROOM_MIN_Y - 32, ROOM_MAX_X - ROOM_MIN_X + 64, ROOM_MAX_Y - ROOM_MIN_Y + 64);
  } else {
    ctx.rect(ROOM_MIN_X - 32, ROOM_MIN_Y - 32, ROOM_MAX_X - ROOM_MIN_X + 64, ROOM_MAX_Y - ROOM_MIN_Y + 64);
    for (const q of qs) {
      ctx.moveTo(q.x + q.r, q.y);
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2, true);
    }
  }
  ctx.fillStyle = l.main;
  ctx.globalAlpha = (0.08 + 0.18 * p) * (0.75 + 0.5 * c.pulse) * (hc ? 1.6 : 1);
  ctx.fill('evenodd');
  const pat = texture(ctx, l);
  if (pat) {
    // one texture pass: dim at first (the stripes stay for Piercing), blazing toward impact
    const wx = l.kind === 'red' ? Math.round(Math.sin(c.t * 9.1) * 1.6) : 0;
    ctx.translate(wx, 0);
    ctx.fillStyle = pat;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, (l.kind === 'pierce' ? 0.3 : 0.12) * (hc ? 1.5 : 1) + 0.55 * p * (0.7 + 0.3 * c.pulse));
    ctx.fill('evenodd');
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(-wx, 0);
  }
  ctx.restore();
  // the charge closing in on each pocket, meeting its rim at impact (never reaching into another pocket)
  ctx.beginPath();
  for (const q of qs) {
    let reach = 300;
    for (const o of qs) if (o !== q) reach = Math.min(reach, Math.hypot(o.x - q.x, o.y - q.y) - q.r - o.r - 6);
    if (reach <= 0) continue;
    const r = q.r + 2 + (1 - p) * reach;
    ctx.moveTo(q.x + r, q.y);
    ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
  }
  ctx.strokeStyle = l.hot;
  ctx.globalAlpha = (0.2 + 0.55 * p) * (0.7 + 0.3 * c.pulse);
  ctx.lineWidth = hc ? 3 : 2;
  ctx.stroke();
  // room-wide embers / motes rising everywhere except the pockets
  sparkReset();
  const W = ROOM_MAX_X - ROOM_MIN_X;
  const H = ROOM_MAX_Y - ROOM_MIN_Y;
  for (let i = 0; i < 70; i++) {
    if (hash2(i, 41) > 0.35 + 0.65 * p) continue;
    const h = hash2(i, 42);
    const x = ROOM_MIN_X + hash2(i, 43) * W;
    const u = (h * 7 - c.t * (0.25 + 0.3 * h) * (1 + p)) % 1;
    const y = ROOM_MIN_Y + (u < 0 ? u + 1 : u) * H;
    let inside = false;
    for (const q of qs) if ((q.x - x) * (q.x - x) + (q.y - y) * (q.y - y) < (q.r + 16) * (q.r + 16)) inside = true;
    if (inside) continue;
    if (l.kind === 'pierce') dot(i % 3 === 0, x, y, 1.5 + 1.2 * c.pulse);
    else seg(i % 3 === 0, x, y + 6 + 8 * p, x, y);
  }
  sparkFlush(ctx, l, 0.5 + 0.4 * p, hc);
  // the pockets: calm light, a steady white rim turning slowly (never pulsing)
  ctx.beginPath();
  for (const q of s.pockets) {
    ctx.moveTo(q.x + q.r, q.y);
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
  }
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.05;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 9;
  ctx.stroke();
  if (hc) {
    ctx.strokeStyle = '#000000';
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  ctx.setLineDash(POCKET_DASH);
  ctx.lineDashOffset = -c.t * 10;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = hc ? 4 : 3;
  ctx.stroke();
  ctx.setLineDash(NO_DASH);
}

// ---------------------------------------------------------------- rolling lanes

/** A rolling lane: the lane charges (chevrons for the roll direction), then its boulder rolls through. */
function drawRollLane(ctx: CanvasRenderingContext2D, s: Roll, l: Look, c: Charge, hc: boolean, pre: boolean, tau: number, id: number): void {
  const ca = Math.cos(s.a);
  const sa = Math.sin(s.a);
  if (pre) {
    ONE[0] = s;
    drawAreas(ctx, ONE, true, l, c, hc, true, tau, 'once', id, 0.5);
    // chevrons pointing the way the boulder will roll
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.55 + c.p * 0.35;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let d = 90; d < s.l - 40; d += 160) {
      const cx = s.x + ca * d;
      const cy = s.y + sa * d;
      ctx.moveTo(cx - ca * 12 - sa * 14, cy - sa * 12 + ca * 14);
      ctx.lineTo(cx + ca * 6, cy + sa * 6);
      ctx.lineTo(cx - ca * 12 + sa * 14, cy - sa * 12 - ca * 14);
    }
    ctx.stroke();
  } else {
    fillOne(ctx, s, l.main, 0.1);
    ctx.beginPath();
    edgePath(ctx, s, l.kind, c.step + id);
    ctx.strokeStyle = l.main;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = hc ? 3 : 2;
    ctx.stroke();
  }
  // the boulder (waits at the lane's end, then rolls through)
  const [bx, by] = rollPos(s, pre ? 0 : tau);
  const br = s.w * 0.45;
  if (!pre) {
    // dust kicked up behind it
    sparkReset();
    for (let i = 0; i < 12; i++) {
      const h = hash2(id * 23 + i, 1);
      const u = (c.t * (1.4 + h) + h * 5) % 1;
      const back = br * 0.6 + u * 60;
      const side = (hash2(id * 23 + i, 2) * 2 - 1) * br;
      dot(i % 4 === 0, bx - ca * back - sa * side, by - sa * back + ca * side, (1 - u) * 3);
    }
    sparkFlush(ctx, l, 0.7, hc);
  }
  const spin = (pre ? 0 : s.speed * tau) / br;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(spin * (Math.cos(s.a) + Math.sin(s.a) >= 0 ? 1 : -1));
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rr = br * (0.88 + ((i * 37) % 10) / 80);
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#8f9aa6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#120e14';
  ctx.stroke();
  ctx.strokeStyle = '#5f6a76';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-br * 0.5, -br * 0.1);
  ctx.lineTo(br * 0.1, br * 0.2);
  ctx.lineTo(br * 0.45, -br * 0.3);
  ctx.moveTo(-br * 0.2, br * 0.55);
  ctx.lineTo(br * 0.1, br * 0.2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,244,255,0.7)';
  ctx.beginPath();
  ctx.arc(-br * 0.35, -br * 0.4, br * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Skull icon (Red) and hollow ring icon (Piercing) over an attacker in windup (colorblind support, §5.6). */
export function drawAttackIcon(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'red' | 'pierce', size: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  const k = size * (1 + Math.sin(t * 14) * 0.08);
  ctx.scale(k, k);
  if (kind === 'red') {
    ctx.fillStyle = RED;
    ctx.strokeStyle = '#1a0606';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 9, Math.PI, 0);
    ctx.lineTo(9, 3);
    ctx.lineTo(5, 4);
    ctx.lineTo(5, 9);
    ctx.lineTo(-5, 9);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-9, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a0606';
    ctx.beginPath();
    ctx.arc(-3.5, -1, 2.4, 0, Math.PI * 2);
    ctx.arc(3.5, -1, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#0a1a24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
  ctx.restore();
}
