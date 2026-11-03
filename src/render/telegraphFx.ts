// Telegraph FX (ART_AUDIO §3): the pieces that make a telegraph look like an attack charging rather than a
// floor marker. Per-kind looks (the kind colour is the combat language: red = unblockable, blue = piercing,
// warm yellow = normal, gold = player skill; the attack's damage type only ever adds an accent), cached ground
// textures (cracks, frost stripes, rune lattice) that light up as the charge builds, exact shape paths and
// "wispy" edge paths that never leave the true boundary by more than a couple of pixels, batched sparks /
// embers / frost motes, and impact echoes (flash, shockwave, debris) that outlive the telegraph entity.
// Everything is deterministic from time + ids (no Math.random), and nothing allocates per frame once warm.
import { ELEMENTS } from '../game/elements';
import { ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y, type Shape } from '../game/combat/patterns';
import type { DamageType } from '../game/types';
import { getGlow } from '../engine/draw/parts';

export type LookKind = 'red' | 'pierce' | 'normal' | 'player';

export interface Look {
  kind: LookKind;
  /** the kind colour: never replaced */
  main: string;
  /** white-hot core of the same hue */
  hot: string;
  /** spark colour (a touch warmer / brighter than main) */
  spark: string;
  /** dark contrast shade (high-contrast outlines) */
  deep: string;
  /** the damage type's glow (ELEMENTS[type].glow), or a kind default */
  accent: string;
  pattern: CanvasPattern | null;
  tile: CanvasImageSource | null;
}

const BASE: Record<LookKind, Omit<Look, 'accent' | 'pattern' | 'tile' | 'kind'> & { accent: string }> = {
  red: { main: '#ff3b3b', hot: '#ffd8b8', spark: '#ff6a2e', deep: '#2a0404', accent: '#ffb45a' },
  pierce: { main: '#8fd3ff', hot: '#f2fbff', spark: '#c8ecff', deep: '#04202e', accent: '#ffffff' },
  normal: { main: '#f2d9a0', hot: '#fff7e0', spark: '#ffe7b0', deep: '#24190a', accent: '#fff7e0' },
  player: { main: '#ffd27a', hot: '#fffcef', spark: '#ffe9b0', deep: '#2e2006', accent: '#ffffff' },
};

const looks = new Map<string, Look>();

/** The look for a telegraph kind (team 0 = a player skill: gold) with its damage type's accent. */
export function lookFor(kind: string, team: number, type: DamageType | undefined): Look {
  const k: LookKind = team === 0 ? 'player' : kind === 'red' ? 'red' : kind === 'pierce' ? 'pierce' : 'normal';
  const key = type ? `${k}|${type}` : k;
  let l = looks.get(key);
  if (!l) {
    const b = BASE[k];
    l = { kind: k, main: b.main, hot: b.hot, spark: b.spark, deep: b.deep, accent: type ? ELEMENTS[type].glow : b.accent, pattern: null, tile: null };
    looks.set(key, l);
  }
  return l;
}

// ---------------------------------------------------------------- deterministic noise

/** Integer hash of two ints → [0, 1). */
export function hash2(a: number, b: number): number {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x165667b1, 0x85ebca6b);
  h ^= h >>> 15;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** 64 jitter values in [-1, 1] (edge crackle). */
const JIT = new Float32Array(64);
for (let i = 0; i < 64; i++) JIT[i] = hash2(i, 977) * 2 - 1;

function frac(x: number): number {
  return x - Math.floor(x);
}

// ---------------------------------------------------------------- ground textures

const TILE = 256;

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

type G2 = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** A tiny seeded generator for building textures once (render-only, deterministic). */
function texRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stroke a polyline 9 times (offset by ±TILE) so the texture wraps seamlessly. */
function wrapStroke(g: G2, pts: number[]): void {
  for (let ox = -TILE; ox <= TILE; ox += TILE)
    for (let oy = -TILE; oy <= TILE; oy += TILE) {
      g.beginPath();
      g.moveTo(pts[0]! + ox, pts[1]! + oy);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]! + ox, pts[i + 1]! + oy);
      g.stroke();
    }
}

/** Random-walk cracks with branches. */
function crackSet(rnd: () => number, n: number, steps: number, stepLen: number, wander: number, branch: number): number[][] {
  const out: number[][] = [];
  const grow = (x: number, y: number, a: number, left: number, depth: number): void => {
    const pts = [x, y];
    for (let i = 0; i < left; i++) {
      a += (rnd() - 0.5) * wander;
      const l = stepLen * (0.6 + rnd() * 0.8);
      x += Math.cos(a) * l;
      y += Math.sin(a) * l;
      pts.push(x, y);
      if (depth < 2 && rnd() < branch) grow(x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.7), Math.floor(left * 0.5), depth + 1);
    }
    out.push(pts);
  };
  for (let i = 0; i < n; i++) grow(rnd() * TILE, rnd() * TILE, rnd() * Math.PI * 2, steps, 0);
  return out;
}

function buildTile(l: Look): CanvasImageSource {
  const c = makeCanvas(TILE, TILE);
  const g = c.getContext('2d') as G2;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const rnd = texRng(l.kind === 'red' ? 11 : l.kind === 'pierce' ? 23 : l.kind === 'normal' ? 37 : 41);
  if (l.kind === 'red' || l.kind === 'normal') {
    const red = l.kind === 'red';
    // jagged, angry fissures (red) or a dry ground crack web (normal)
    const cracks = red ? crackSet(rnd, 7, 12, 17, 1.25, 0.3) : crackSet(rnd, 10, 9, 13, 0.9, 0.42);
    g.strokeStyle = l.main;
    g.globalAlpha = red ? 0.55 : 0.5;
    g.lineWidth = red ? 4.5 : 3.2;
    for (const p of cracks) wrapStroke(g, p);
    g.globalAlpha = 1;
    g.strokeStyle = red ? l.spark : l.main;
    g.lineWidth = red ? 2 : 1.5;
    for (const p of cracks) wrapStroke(g, p);
    g.strokeStyle = l.accent;
    g.globalAlpha = 0.9;
    g.lineWidth = red ? 0.9 : 0.7;
    for (const p of cracks) wrapStroke(g, p);
    // embers / dust specks
    g.fillStyle = red ? l.hot : l.main;
    for (let i = 0; i < (red ? 26 : 60); i++) {
      g.globalAlpha = red ? 0.8 : 0.35 + rnd() * 0.35;
      const s = red ? 1 + rnd() * 1.6 : 0.8 + rnd() * 1.8;
      g.fillRect(rnd() * TILE, rnd() * TILE, s, s);
    }
  } else if (l.kind === 'pierce') {
    // the colorblind motif: diagonal stripes, plus crystalline shards along them
    g.strokeStyle = l.main;
    g.globalAlpha = 0.6;
    g.lineWidth = 4;
    for (let i = -TILE; i <= TILE * 2; i += 16) {
      g.beginPath();
      g.moveTo(i, TILE);
      g.lineTo(i + TILE, 0);
      g.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const x = rnd() * TILE;
      const y = rnd() * TILE;
      const len = 7 + rnd() * 12;
      const wd = 2.5 + rnd() * 2.5;
      const a = -Math.PI / 4 + (rnd() - 0.5) * 0.5;
      for (let ox = -TILE; ox <= TILE; ox += TILE)
        for (let oy = -TILE; oy <= TILE; oy += TILE) {
          const cx = x + ox;
          const cy = y + oy;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          g.beginPath();
          g.moveTo(cx + ca * len, cy + sa * len);
          g.lineTo(cx - sa * wd, cy + ca * wd);
          g.lineTo(cx - ca * len, cy - sa * len);
          g.lineTo(cx + sa * wd, cy - ca * wd);
          g.closePath();
          g.globalAlpha = 0.5;
          g.fillStyle = l.hot;
          g.fill();
          g.globalAlpha = 0.9;
          g.lineWidth = 1;
          g.strokeStyle = i % 3 === 0 ? l.accent : l.main;
          g.stroke();
        }
    }
  } else {
    // player skills: a clean rune lattice
    g.strokeStyle = l.main;
    g.globalAlpha = 0.5;
    g.lineWidth = 1.2;
    for (let i = -TILE; i <= TILE * 2; i += 32) {
      g.beginPath();
      g.moveTo(i, TILE);
      g.lineTo(i + TILE, 0);
      g.moveTo(i, 0);
      g.lineTo(i + TILE, TILE);
      g.stroke();
    }
    g.globalAlpha = 0.85;
    g.fillStyle = l.hot;
    for (let x = 0; x < TILE; x += 32)
      for (let y = 0; y < TILE; y += 32) {
        g.beginPath();
        g.arc(x + 16, y, 1.8, 0, Math.PI * 2);
        g.arc(x, y + 16, 1.8, 0, Math.PI * 2);
        g.fill();
      }
    g.fillStyle = l.accent;
    for (let x = 0; x < TILE; x += 64)
      for (let y = 0; y < TILE; y += 64) g.fillRect(x + 15, y + 15, 2, 2);
  }
  return frozen(c);
}

/**
 * A stable snapshot of a scratch canvas. Drawing from a live (software) OffscreenCanvas re-uploads it to the GPU
 * on every use (a 256 px pattern cost ~0.25 ms per fill); an ImageBitmap is uploaded once and cached.
 */
function frozen(c: HTMLCanvasElement | OffscreenCanvas): CanvasImageSource {
  if (typeof OffscreenCanvas !== 'undefined' && c instanceof OffscreenCanvas && typeof c.transferToImageBitmap === 'function') return c.transferToImageBitmap();
  return c;
}

/** The look's ground texture as a pattern (world-anchored: cracks in the floor light up as the charge passes). */
export function texture(ctx: CanvasRenderingContext2D, l: Look): CanvasPattern | null {
  if (l.pattern) return l.pattern;
  l.tile ??= buildTile(l);
  l.pattern = ctx.createPattern(l.tile, 'repeat');
  return l.pattern;
}

// ---------------------------------------------------------------- shape and edge paths

/** How far a shape centred at (x, y) can be seen inside the room (progress fronts for room-sized shapes). */
export function visibleReach(x: number, y: number): number {
  const dx = Math.max(Math.abs(x - ROOM_MIN_X), Math.abs(ROOM_MAX_X - x)) + 40;
  const dy = Math.max(Math.abs(y - ROOM_MIN_Y), Math.abs(ROOM_MAX_Y - y)) + 40;
  return Math.hypot(dx, dy);
}

/**
 * Add a static shape's exact area to the current path (no beginPath). `scale` < 1 is the charged part:
 * circles and cones grow from the centre / apex, lines widen from their centre line, rings fill inward
 * from their outer edge to the safe inner circle.
 */
export function shapePath(ctx: CanvasRenderingContext2D, s: Shape, scale: number): void {
  switch (s.k) {
    case 'circle': {
      const r = Math.max(0.1, s.r * scale);
      ctx.moveTo(s.x + r, s.y);
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      break;
    }
    case 'ring': {
      const R = Math.min(1600, s.rOut);
      ctx.moveTo(s.x + R, s.y);
      ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
      const vis = Math.min(R, visibleReach(s.x, s.y));
      const inner = scale >= 1 ? s.rIn : Math.min(R, s.rIn + (vis - s.rIn) * (1 - scale));
      if (inner > 0) {
        ctx.moveTo(s.x + inner, s.y);
        ctx.arc(s.x, s.y, inner, 0, Math.PI * 2, true);
      }
      break;
    }
    case 'line':
    case 'beam':
    case 'roll': {
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = (s.w / 2) * scale;
      ctx.moveTo(s.x - sa * hw, s.y + ca * hw);
      ctx.lineTo(s.x + ca * s.l - sa * hw, s.y + sa * s.l + ca * hw);
      ctx.lineTo(s.x + ca * s.l + sa * hw, s.y + sa * s.l - ca * hw);
      ctx.lineTo(s.x + sa * hw, s.y - ca * hw);
      ctx.closePath();
      break;
    }
    case 'cone': {
      const r = Math.min(1600, s.r);
      const rr = scale >= 1 ? r : Math.min(r, visibleReach(s.x, s.y)) * scale;
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, Math.max(0.1, rr), s.a - s.half, s.a + s.half);
      ctx.closePath();
      break;
    }
    default:
      break;
  }
}

/** Edge crackle amplitude (px) and vertex spacing per look: angry red, cracked-earth normal, crystal facets. */
const EDGE_AMP: Record<LookKind, number> = { red: 2.4, normal: 1.3, pierce: 0, player: 0 };
const EDGE_STEP: Record<LookKind, number> = { red: 9, normal: 14, pierce: 24, player: 0 };

/** An arc as a crackling (red / normal: radial jitter), faceted (blue: crystal chords) or smooth edge. */
function edgeArc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a0: number, a1: number, kind: LookKind, seed: number, move: boolean): void {
  const span = a1 - a0;
  const closed = Math.abs(span) >= Math.PI * 2 - 1e-3;
  if (kind !== 'player') {
    const step = EDGE_STEP[kind];
    const n = Math.max(8, Math.min(kind === 'red' ? 160 : 96, Math.ceil((Math.abs(span) * r) / step)));
    const amp = Math.min(EDGE_AMP[kind], r * 0.05);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (span * i) / n;
      const j = amp ? JIT[((closed ? i % n : i) * 7 + seed) & 63]! * amp : 0;
      const px = x + Math.cos(a) * (r + j);
      const py = y + Math.sin(a) * (r + j);
      if (i === 0 && move) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    if (closed) ctx.closePath();
    return;
  }
  if (move) ctx.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
  ctx.arc(x, y, r, a0, a1, span < 0);
}

/** A straight edge: crackling for red / normal, plain otherwise. Continues the current subpath. */
function edgeSeg(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, kind: LookKind, seed: number): void {
  const amp = EDGE_AMP[kind];
  if (!amp) {
    ctx.lineTo(x1, y1);
    return;
  }
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.min(140, Math.floor(len / (EDGE_STEP[kind] + 2))));
  const nx = -(y1 - y0) / Math.max(1, len);
  const ny = (x1 - x0) / Math.max(1, len);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const j = i === n ? 0 : JIT[(i * 5 + seed) & 63]! * amp * 0.92;
    ctx.lineTo(x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j);
  }
}

/** Add a static shape's boundary to the current path in the look's edge style. */
export function edgePath(ctx: CanvasRenderingContext2D, s: Shape, kind: LookKind, seed: number): void {
  switch (s.k) {
    case 'circle':
      edgeArc(ctx, s.x, s.y, s.r, 0, Math.PI * 2, kind, seed, true);
      break;
    case 'ring': {
      const R = Math.min(1600, s.rOut);
      if (R < 1500) edgeArc(ctx, s.x, s.y, R, 0, Math.PI * 2, kind, seed, true);
      if (s.rIn > 0) edgeArc(ctx, s.x, s.y, s.rIn, 0, Math.PI * 2, kind, seed + 17, true);
      break;
    }
    case 'line':
    case 'beam':
    case 'roll': {
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = s.w / 2;
      const ax = s.x - sa * hw;
      const ay = s.y + ca * hw;
      const bx = s.x + ca * s.l - sa * hw;
      const by = s.y + sa * s.l + ca * hw;
      const cx = s.x + ca * s.l + sa * hw;
      const cy = s.y + sa * s.l - ca * hw;
      const dx = s.x + sa * hw;
      const dy = s.y - ca * hw;
      ctx.moveTo(ax, ay);
      edgeSeg(ctx, ax, ay, bx, by, kind, seed);
      ctx.lineTo(cx, cy);
      edgeSeg(ctx, cx, cy, dx, dy, kind, seed + 31);
      ctx.closePath();
      break;
    }
    case 'cone': {
      const r = Math.min(1600, s.r);
      const a0 = s.a - s.half;
      const a1 = s.a + s.half;
      ctx.moveTo(s.x, s.y);
      edgeSeg(ctx, s.x, s.y, s.x + Math.cos(a0) * r, s.y + Math.sin(a0) * r, kind, seed);
      edgeArc(ctx, s.x, s.y, r, a0, a1, kind, seed + 11, false);
      edgeSeg(ctx, s.x + Math.cos(a1) * r, s.y + Math.sin(a1) * r, s.x, s.y, kind, seed + 23);
      ctx.closePath();
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------- batched sparks

const CAP = 1400;
const segM = new Float32Array(CAP * 4);
const segA = new Float32Array(CAP * 4);
const dotM = new Float32Array(CAP * 3);
const dotA = new Float32Array(CAP * 3);
const tri = new Float32Array(CAP * 6);
let nSegM = 0;
let nSegA = 0;
let nDotM = 0;
let nDotA = 0;
let nTri = 0;

export function sparkReset(): void {
  nSegM = nSegA = nDotM = nDotA = nTri = 0;
}

/** A streak from (x1, y1) to (x2, y2). */
export function seg(accent: boolean, x1: number, y1: number, x2: number, y2: number): void {
  if (accent) {
    if (nSegA >= CAP) return;
    const i = nSegA++ * 4;
    segA[i] = x1;
    segA[i + 1] = y1;
    segA[i + 2] = x2;
    segA[i + 3] = y2;
  } else {
    if (nSegM >= CAP) return;
    const i = nSegM++ * 4;
    segM[i] = x1;
    segM[i + 1] = y1;
    segM[i + 2] = x2;
    segM[i + 3] = y2;
  }
}

/** An ember / mote of half-size s (squares; diamonds for frost). */
export function dot(accent: boolean, x: number, y: number, s: number): void {
  if (accent) {
    if (nDotA >= CAP) return;
    const i = nDotA++ * 3;
    dotA[i] = x;
    dotA[i + 1] = y;
    dotA[i + 2] = s;
  } else {
    if (nDotM >= CAP) return;
    const i = nDotM++ * 3;
    dotM[i] = x;
    dotM[i + 1] = y;
    dotM[i + 2] = s;
  }
}

/** A frost shard (filled triangle). */
export function shard(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
  if (nTri >= CAP) return;
  const i = nTri++ * 6;
  tri[i] = x1;
  tri[i + 1] = y1;
  tri[i + 2] = x2;
  tri[i + 3] = y2;
  tri[i + 4] = x3;
  tri[i + 5] = y3;
}

function dots(ctx: CanvasRenderingContext2D, buf: Float32Array, n: number, diamond: boolean): void {
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const x = buf[k * 3]!;
    const y = buf[k * 3 + 1]!;
    const s = buf[k * 3 + 2]!;
    if (diamond) {
      ctx.moveTo(x, y - s * 1.4);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s * 1.4);
      ctx.lineTo(x - s, y);
      ctx.closePath();
    } else ctx.rect(x - s, y - s, s * 2, s * 2);
  }
  ctx.fill();
}

function segs(ctx: CanvasRenderingContext2D, buf: Float32Array, n: number): void {
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    ctx.moveTo(buf[k * 4]!, buf[k * 4 + 1]!);
    ctx.lineTo(buf[k * 4 + 2]!, buf[k * 4 + 3]!);
  }
  ctx.stroke();
}

/** Draw everything queued since sparkReset (additive glow), then reset. */
export function sparkFlush(ctx: CanvasRenderingContext2D, l: Look, alpha: number, hc: boolean): void {
  if (alpha <= 0.01) {
    sparkReset();
    return;
  }
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'butt';
  const diamond = l.kind === 'pierce';
  if (nTri) {
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = l.hot;
    ctx.beginPath();
    for (let k = 0; k < nTri; k++) {
      const i = k * 6;
      ctx.moveTo(tri[i]!, tri[i + 1]!);
      ctx.lineTo(tri[i + 2]!, tri[i + 3]!);
      ctx.lineTo(tri[i + 4]!, tri[i + 5]!);
      ctx.closePath();
    }
    ctx.fill();
  }
  if (nSegM || nSegA) {
    ctx.lineWidth = hc ? 2.6 : 2;
    ctx.globalAlpha = alpha;
    if (nSegM) {
      ctx.strokeStyle = l.spark;
      segs(ctx, segM, nSegM);
    }
    if (nSegA) {
      ctx.strokeStyle = l.accent;
      segs(ctx, segA, nSegA);
    }
  }
  if (nDotM) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = l.kind === 'normal' ? l.main : l.hot;
    dots(ctx, dotM, nDotM, diamond);
  }
  if (nDotA) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = l.accent;
    dots(ctx, dotA, nDotA, diamond);
  }
  ctx.globalCompositeOperation = prevOp;
  ctx.lineCap = 'butt';
  sparkReset();
}

// ---------------------------------------------------------------- the charge (timing) state

export interface Charge {
  /** 0 → 1 over the telegraph */
  p: number;
  /** spark phase in cycles: accelerates toward impact (continuous, so sparks never jump) */
  ph: number;
  /** 0..1 throb whose rate climbs from ~1.5 Hz to ~9 Hz near impact */
  pulse: number;
  /** world time (s) */
  t: number;
  /** flicker step (changes ~14 times a second) */
  step: number;
  /** spark density scale (fewer per shape when a telegraph has many shapes) */
  dens: number;
  seed: number;
}

export const charge: Charge = { p: 0, ph: 0, pulse: 0, t: 0, step: 0, dens: 1, seed: 0 };

export function setCharge(now: number, t0: number, impact: number, nShapes: number, seed: number): Charge {
  const dur = Math.max(0.05, impact - t0);
  const tau = Math.min(dur, Math.max(0, now - t0));
  const p = tau / dur;
  charge.p = p;
  charge.ph = tau * 0.9 + p * p * dur * 1.6;
  charge.pulse = 0.5 + 0.5 * Math.sin((tau * 1.5 + p * p * dur * 3.8) * Math.PI * 2);
  charge.t = now;
  charge.step = Math.floor(now * 14);
  charge.dens = nShapes <= 4 ? 1 : Math.max(0.22, 4 / nShapes);
  charge.seed = seed;
  return charge;
}

// ---------------------------------------------------------------- spark emitters (per shape)

/** Energy streaming inward and gathering (circles, rings, lines, cones). */
export function emitCharge(s: Shape, l: Look, c: Charge, idx: number): void {
  const p = c.p;
  const base = c.seed * 131 + idx * 977;
  const red = l.kind === 'red';
  const frost = l.kind === 'pierce';
  const dust = l.kind === 'normal';
  const show = 0.3 + 0.7 * p;
  switch (s.k) {
    case 'circle': {
      const r = s.r;
      const n = Math.round(Math.max(3, Math.min(18, r / 8)) * c.dens);
      for (let i = 0; i < n; i++) {
        const h = hash2(base, i);
        if (hash2(base + 5, i) > show) continue;
        const rate = 0.7 + 0.6 * hash2(base + 7, i);
        const u = frac(c.ph * rate + h * 3.7);
        const ang = h * Math.PI * 2 + (frost || l.kind === 'player' ? u * 0.5 : 0);
        const d = r * (1.06 - Math.pow(u, 1.5) * 0.96);
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        if (frost) {
          dot(i % 3 === 0, s.x + ca * d, s.y + sa * d, 1.2 + 1.6 * Math.sin(Math.PI * u));
          continue;
        }
        const len = (red ? 7 : 5) + (red ? 14 : 10) * p * Math.sin(Math.PI * u);
        seg(i % 3 === 0, s.x + ca * (d + len), s.y + sa * (d + len), s.x + ca * d, s.y + sa * d);
      }
      rimEmbers(s.x, s.y, r, 0, Math.PI * 2, l, c, base + 3, 1);
      break;
    }
    case 'ring': {
      const R = Math.min(s.rOut, s.rIn + 260, visibleReach(s.x, s.y));
      const band = R - s.rIn;
      const n = Math.round(Math.max(6, Math.min(26, (s.rIn + band) / 12)) * c.dens);
      for (let i = 0; i < n; i++) {
        const h = hash2(base, i);
        if (hash2(base + 5, i) > show) continue;
        const u = frac(c.ph * (0.7 + 0.6 * hash2(base + 7, i)) + h * 3.7);
        const ang = h * Math.PI * 2;
        const d = s.rIn + 3 + band * (1 - Math.pow(u, 1.4));
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        if (frost) {
          dot(i % 3 === 0, s.x + ca * d, s.y + sa * d, 1.2 + 1.6 * Math.sin(Math.PI * u));
          continue;
        }
        const len = Math.min(d - s.rIn - 2, 6 + 12 * p * Math.sin(Math.PI * u));
        if (len > 1) seg(i % 3 === 0, s.x + ca * (d + len), s.y + sa * (d + len), s.x + ca * d, s.y + sa * d);
      }
      if (s.rIn > 0) rimEmbers(s.x, s.y, s.rIn, 0, Math.PI * 2, l, c, base + 3, -1);
      if (s.rOut < 1500) rimEmbers(s.x, s.y, s.rOut, 0, Math.PI * 2, l, c, base + 9, 1);
      break;
    }
    case 'line':
    case 'beam':
    case 'roll': {
      // gathering into the centre line (a beam drawing itself in)
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = s.w / 2;
      const L = Math.min(s.l, 1500);
      const n = Math.round(Math.max(4, Math.min(28, L / 26)) * c.dens);
      for (let i = 0; i < n; i++) {
        const h = hash2(base, i);
        if (hash2(base + 5, i) > show) continue;
        const u = frac(c.ph * (0.8 + 0.6 * hash2(base + 7, i)) + h * 3.7);
        const along = hash2(base + 11, i) * L;
        const side = i & 1 ? 1 : -1;
        const off = side * (hw + 4) * (1 - Math.pow(u, 1.3));
        const px = s.x + ca * along - sa * off;
        const py = s.y + sa * along + ca * off;
        if (frost) {
          dot(i % 3 === 0, px, py, 1.2 + 1.5 * Math.sin(Math.PI * u));
          continue;
        }
        const len = Math.min(Math.abs(off), (dust ? 5 : 6) + 10 * p * Math.sin(Math.PI * u));
        seg(i % 3 === 0, px - sa * side * len, py + ca * side * len, px, py);
      }
      lineEmbers(s.x, s.y, s.a, hw, L, l, c, base + 3);
      break;
    }
    case 'cone': {
      // a breath drawn in: motes flow from the mouth of the cone back to its apex
      const R = Math.min(s.r, 420);
      const n = Math.round(Math.max(5, Math.min(22, (R * s.half) / 14)) * c.dens);
      for (let i = 0; i < n; i++) {
        const h = hash2(base, i);
        if (hash2(base + 5, i) > show) continue;
        const u = frac(c.ph * (0.7 + 0.6 * hash2(base + 7, i)) + h * 3.7);
        const ang = s.a - s.half * 0.92 + s.half * 1.84 * hash2(base + 11, i);
        const d = 10 + (R - 10) * (1 - Math.pow(u, 1.4));
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        if (frost) {
          dot(i % 3 === 0, s.x + ca * d, s.y + sa * d, 1.2 + 1.6 * Math.sin(Math.PI * u));
          continue;
        }
        const len = Math.min(d - 4, 6 + 12 * p * Math.sin(Math.PI * u));
        if (len > 1) seg(i % 3 === 0, s.x + ca * (d + len), s.y + sa * (d + len), s.x + ca * d, s.y + sa * d);
      }
      if (s.r < 900) rimEmbers(s.x, s.y, s.r, s.a - s.half, s.a + s.half, l, c, base + 3, 1);
      break;
    }
    default:
      break;
  }
}

/**
 * Embers / frost shards / dust along an arc boundary. `inward` = which side of the arc is the danger
 * (1: inside the radius, -1: outside it), so frost shards always point into the area.
 */
export function rimEmbers(x: number, y: number, r: number, a0: number, a1: number, l: Look, c: Charge, base: number, inward: number): void {
  if (c.dens < 0.3 && l.kind !== 'pierce') return;
  const span = a1 - a0;
  const m = Math.round(Math.max(5, Math.min(44, (Math.abs(span) * r) / 22)) * c.dens);
  const p = c.p;
  for (let j = 0; j < m; j++) {
    const h = hash2(base, j);
    const a = a0 + span * h;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const flick = hash2(base + 1, j + c.step * 7);
    switch (l.kind) {
      case 'red': {
        if (flick > 0.45 + 0.4 * p) continue;
        const life = frac(c.t * (0.9 + h) + h * 5);
        const rr = r + JIT[(j * 3 + c.step) & 63]! * 3;
        dot(j % 4 === 0, x + ca * rr, y + sa * rr - life * 9, (1 - life) * (1.3 + p));
        break;
      }
      case 'pierce': {
        if (flick > 0.55 + 0.35 * p) continue;
        const len = (5 + 7 * hash2(base + 2, j)) * (0.6 + 0.6 * p);
        const wd = 2.6 / Math.max(20, r);
        const bx0 = x + Math.cos(a - wd * 1.4) * r;
        const by0 = y + Math.sin(a - wd * 1.4) * r;
        const bx1 = x + Math.cos(a + wd * 1.4) * r;
        const by1 = y + Math.sin(a + wd * 1.4) * r;
        const tr = r - inward * len;
        shard(bx0, by0, bx1, by1, x + ca * tr, y + sa * tr);
        break;
      }
      case 'normal': {
        if (flick > 0.5 + 0.3 * p) continue;
        const life = frac(c.t * (0.6 + h * 0.5) + h * 3);
        const rr = r + inward * -1 * (1 + life * 7);
        dot(false, x + ca * rr, y + sa * rr, (1 - life) * 1.6 + 0.4);
        break;
      }
      case 'player': {
        const aa = a0 + span * ((j + 0.5) / m) + (span >= Math.PI * 2 - 1e-3 ? c.t * 0.5 : 0);
        dot(j % 3 === 0, x + Math.cos(aa) * r, y + Math.sin(aa) * r, 1.3 + 0.6 * c.pulse);
        break;
      }
    }
  }
}

/** Embers / shards / dust along a line's two long sides. */
export function lineEmbers(x: number, y: number, a: number, hw: number, L: number, l: Look, c: Charge, base: number): void {
  if (c.dens < 0.3 && l.kind !== 'pierce') return;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const m = Math.round(Math.max(4, Math.min(48, (L * 2) / 30)) * c.dens);
  const p = c.p;
  for (let j = 0; j < m; j++) {
    const h = hash2(base, j);
    const along = h * L;
    const side = j & 1 ? 1 : -1;
    const flick = hash2(base + 1, j + c.step * 7);
    const ex = x + ca * along - sa * side * hw;
    const ey = y + sa * along + ca * side * hw;
    switch (l.kind) {
      case 'red': {
        if (flick > 0.45 + 0.4 * p) continue;
        const life = frac(c.t * (0.9 + h) + h * 5);
        dot(j % 4 === 0, ex, ey - life * 9, (1 - life) * (1.3 + p));
        break;
      }
      case 'pierce': {
        if (flick > 0.55 + 0.35 * p) continue;
        const len = (5 + 7 * hash2(base + 2, j)) * (0.6 + 0.6 * p);
        shard(ex - ca * 3, ey - sa * 3, ex + ca * 3, ey + sa * 3, ex + sa * side * len, ey - ca * side * len);
        break;
      }
      case 'normal': {
        if (flick > 0.5 + 0.3 * p) continue;
        const life = frac(c.t * (0.6 + h * 0.5) + h * 3);
        dot(false, ex - sa * side * life * 7, ey + ca * side * life * 7, (1 - life) * 1.6 + 0.4);
        break;
      }
      case 'player':
        if (flick > 0.5) continue;
        dot(j % 3 === 0, ex, ey, 1.3 + 0.6 * c.pulse);
        break;
    }
  }
}

const glows = new Map<string, CanvasImageSource>();

/** A soft radial glow sprite per colour, frozen to an ImageBitmap (GPU-resident). */
function glowSprite(color: string): CanvasImageSource {
  let g = glows.get(color);
  if (!g) {
    const c = makeCanvas(64, 64);
    const x = c.getContext('2d') as G2;
    x.drawImage(getGlow(color), 0, 0);
    g = frozen(c);
    glows.set(color, g);
  }
  return g;
}

/** A soft additive glow (cached sprite). */
export function glowAt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  if (alpha <= 0.01 || r <= 0.5) return;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = prevOp;
}

// ---------------------------------------------------------------- impact echoes

interface Echo {
  t0: number;
  shapes: Shape[];
  look: Look;
  seed: number;
  live: boolean;
}

const ECHO_S = 0.6;

/**
 * Clip to the room outside every pocket. Successive clips intersect, so overlapping pockets stay safe where
 * they overlap (an even-odd fill would paint the overlap as danger). Caller saves / restores.
 */
export function clipOutPockets(ctx: CanvasRenderingContext2D, pockets: { x: number; y: number; r: number }[]): void {
  for (const q of pockets) {
    ctx.beginPath();
    ctx.rect(ROOM_MIN_X - 64, ROOM_MIN_Y - 64, ROOM_MAX_X - ROOM_MIN_X + 128, ROOM_MAX_Y - ROOM_MIN_Y + 128);
    ctx.moveTo(q.x + q.r, q.y);
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2, true);
    ctx.clip('evenodd');
  }
}
const echoes: Echo[] = [];
let echoNext = 0;
const seen = new Map<number, { start: number; done: number; at: number }>();

/**
 * Called by drawTelegraph for instant telegraphs: every pulse that has fired since the last frame starts an
 * echo (flash, shockwave, debris). Keyed by entity id + telegraph start (ids are recycled).
 */
export function noteImpacts(id: number, start: number, pulsesDone: number, shapes: Shape[], look: Look, now: number): void {
  let rec = seen.get(id);
  if (!rec || rec.start !== start) {
    rec = { start, done: 0, at: now };
    seen.set(id, rec);
  }
  rec.at = now;
  if (pulsesDone > rec.done) {
    rec.done = pulsesDone;
    let e = echoes[echoNext];
    if (!e) {
      e = { t0: now, shapes, look, seed: id, live: true };
      echoes[echoNext] = e;
    } else {
      e.t0 = now;
      e.shapes = shapes;
      e.look = look;
      e.seed = id * 31 + pulsesDone;
      e.live = true;
    }
    echoNext = (echoNext + 1) % 48;
  }
  if (seen.size > 400) for (const [k, v] of seen) if (now - v.at > 3 || v.at > now) seen.delete(k);
}

/** Draw the impact echoes (call once per frame after the telegraphs). */
export function drawTelegraphEchoes(ctx: CanvasRenderingContext2D, now: number, hc: boolean): void {
  let any = false;
  for (const e of echoes) if (e.live) any = true;
  if (!any) return;
  ctx.save();
  for (const e of echoes) {
    if (!e.live) continue;
    const age = now - e.t0;
    if (age < 0 || age > ECHO_S) {
      e.live = false;
      continue;
    }
    drawEcho(ctx, e, age, hc);
  }
  ctx.restore();
}

function drawEcho(ctx: CanvasRenderingContext2D, e: Echo, age: number, hc: boolean): void {
  const l = e.look;
  const n = e.shapes.length;
  const lim = Math.min(n, 64);
  // 1. flash: white-hot, then the kind colour, then the cracks blazing and cooling
  const kFlash = Math.max(0, 1 - age / 0.2);
  const kCool = Math.max(0, 1 - age / 0.45);
  if (kCool > 0) {
    const s0 = e.shapes[0]!;
    const room = s0.k === 'pockets';
    ctx.save();
    ctx.beginPath();
    if (s0.k === 'pockets') {
      clipOutPockets(ctx, s0.pockets);
      ctx.beginPath();
      ctx.rect(ROOM_MIN_X - 32, ROOM_MIN_Y - 32, ROOM_MAX_X - ROOM_MIN_X + 64, ROOM_MAX_Y - ROOM_MIN_Y + 64);
    } else for (let i = 0; i < lim; i++) shapePath(ctx, e.shapes[i]!, 1);
    if (kFlash > 0) {
      ctx.globalAlpha = (room ? 0.3 : 0.42) * kFlash;
      ctx.fillStyle = l.main;
      ctx.fill();
      ctx.globalAlpha = (room ? 0.22 : 0.4) * kFlash * kFlash;
      ctx.fillStyle = l.hot;
      ctx.fill();
    }
    const pat = texture(ctx, l);
    if (pat) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = kCool;
      ctx.fillStyle = pat;
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    // bloom: a soft burst of light over each area
    if (kFlash > 0 && !room) {
      const bl = lim <= 6 ? 1 : 0.6;
      for (let i = 0; i < lim; i++) {
        const s = e.shapes[i]!;
        if (s.k === 'circle') {
          glowAt(ctx, s.x, s.y, s.r * 1.45, l.main, 0.75 * kFlash * bl);
          glowAt(ctx, s.x, s.y, s.r * 0.8, l.hot, 0.8 * kFlash * kFlash * bl);
        } else if (s.k === 'cone' && s.r < 1000) {
          const d = s.r * 0.5;
          glowAt(ctx, s.x + Math.cos(s.a) * d, s.y + Math.sin(s.a) * d, s.r * 0.75, l.main, 0.6 * kFlash);
        }
      }
    }
  }
  // 2. shockwave pushing out from the boundary
  const k = Math.min(1, age / 0.42);
  const ease = 1 - (1 - k) * (1 - k);
  const fade = 1 - k;
  if (fade > 0) {
    ctx.beginPath();
    for (let i = 0; i < lim; i++) shockPath(ctx, e.shapes[i]!, ease);
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.32 * fade;
    ctx.strokeStyle = l.main;
    ctx.lineWidth = (hc ? 20 : 16) * (1 - ease) + 4;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.95 * fade * fade;
    ctx.strokeStyle = l.hot;
    ctx.lineWidth = (hc ? 5 : 3.5) * (1 - ease) + 0.8;
    ctx.stroke();
  }
  // 3. debris: embers (red), dust (normal), frost shards (blue), sparkles (gold)
  const dens = lim <= 4 ? 1 : Math.max(0.2, 4 / lim);
  for (let i = 0; i < lim; i++) debris(e.shapes[i]!, l, age, e.seed * 7 + i * 131, dens);
  sparkFlush(ctx, l, Math.max(0, 1 - age / ECHO_S), hc);
}

function shockPath(ctx: CanvasRenderingContext2D, s: Shape, e: number): void {
  switch (s.k) {
    case 'circle': {
      const r = s.r + 2 + 50 * e;
      ctx.moveTo(s.x + r, s.y);
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      break;
    }
    case 'ring': {
      const ri = Math.max(4, s.rIn - 6 - 14 * e);
      ctx.moveTo(s.x + ri, s.y);
      ctx.arc(s.x, s.y, ri, 0, Math.PI * 2);
      if (s.rOut < 1400) {
        const ro = s.rOut + 10 + 44 * e;
        ctx.moveTo(s.x + ro, s.y);
        ctx.arc(s.x, s.y, ro, 0, Math.PI * 2);
      }
      break;
    }
    case 'cone': {
      if (s.r > 1000) break;
      const r = s.r + 8 + 40 * e;
      ctx.moveTo(s.x + Math.cos(s.a - s.half) * r, s.y + Math.sin(s.a - s.half) * r);
      ctx.arc(s.x, s.y, r, s.a - s.half, s.a + s.half);
      break;
    }
    case 'line': {
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = s.w / 2 + 6 + 22 * e;
      ctx.moveTo(s.x - sa * hw, s.y + ca * hw);
      ctx.lineTo(s.x + ca * s.l - sa * hw, s.y + sa * s.l + ca * hw);
      ctx.moveTo(s.x + ca * s.l + sa * hw, s.y + sa * s.l - ca * hw);
      ctx.lineTo(s.x + sa * hw, s.y - ca * hw);
      break;
    }
    case 'pockets':
      // the safe pockets flare white as the room goes off around them
      for (const q of s.pockets) {
        const r = Math.max(4, q.r - 4 - 10 * e);
        ctx.moveTo(q.x + r, q.y);
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      }
      break;
    default:
      break;
  }
}

/** Deterministic burst particles for one shape at `age` seconds after impact (queued as sparks). */
function debris(s: Shape, l: Look, age: number, base: number, dens: number): void {
  let cx = 0;
  let cy = 0;
  let n: number;
  switch (s.k) {
    case 'circle':
      cx = s.x;
      cy = s.y;
      n = Math.round(Math.max(5, Math.min(18, s.r / 8)) * dens);
      break;
    case 'ring':
      cx = s.x;
      cy = s.y;
      n = Math.round(18 * dens);
      break;
    case 'cone':
      cx = s.x;
      cy = s.y;
      n = Math.round(Math.max(6, Math.min(18, (Math.min(s.r, 500) * s.half) / 14)) * dens);
      break;
    case 'line':
      n = Math.round(Math.max(5, Math.min(22, s.l / 30)) * dens);
      break;
    case 'pockets':
      n = 40;
      break;
    default:
      return;
  }
  const drag = (1 - Math.exp(-4.5 * age)) / 4.5;
  for (let i = 0; i < n; i++) {
    const h1 = hash2(base, i);
    const h2 = hash2(base + 1, i);
    const h3 = hash2(base + 2, i);
    let x = 0;
    let y = 0;
    let dx = 0;
    let dy = 0;
    switch (s.k) {
      case 'circle': {
        const a = h1 * Math.PI * 2;
        const d = s.r * Math.sqrt(h2) * 0.95;
        dx = Math.cos(a);
        dy = Math.sin(a);
        x = cx + dx * d;
        y = cy + dy * d;
        break;
      }
      case 'ring': {
        const a = h1 * Math.PI * 2;
        const d = s.rIn + Math.min(220, Math.min(s.rOut, 1400) - s.rIn) * h2;
        dx = Math.cos(a);
        dy = Math.sin(a);
        x = cx + dx * d;
        y = cy + dy * d;
        break;
      }
      case 'cone': {
        const a = s.a - s.half + 2 * s.half * h1;
        const d = Math.min(s.r, 500) * (0.15 + 0.85 * Math.sqrt(h2));
        dx = Math.cos(a);
        dy = Math.sin(a);
        x = cx + dx * d;
        y = cy + dy * d;
        break;
      }
      case 'line': {
        const ca = Math.cos(s.a);
        const sa = Math.sin(s.a);
        const along = h1 * Math.min(s.l, 1500);
        const side = h2 * 2 - 1;
        x = s.x + ca * along - sa * side * s.w * 0.5;
        y = s.y + sa * along + ca * side * s.w * 0.5;
        dx = -sa * Math.sign(side || 1);
        dy = ca * Math.sign(side || 1);
        break;
      }
      case 'pockets': {
        x = ROOM_MIN_X + h1 * (ROOM_MAX_X - ROOM_MIN_X);
        y = ROOM_MIN_Y + h2 * (ROOM_MAX_Y - ROOM_MIN_Y);
        let inside = false;
        for (const q of s.pockets) if ((q.x - x) * (q.x - x) + (q.y - y) * (q.y - y) < (q.r + 10) * (q.r + 10)) inside = true;
        if (inside) continue;
        dx = 0;
        dy = -1;
        break;
      }
      default:
        break;
    }
    const sp = (l.kind === 'normal' ? 70 : 110) + 200 * h3;
    const px = x + dx * sp * drag;
    let py = y + dy * sp * drag;
    const lifeK = Math.max(0, 1 - age / (0.3 + 0.25 * h3));
    if (lifeK <= 0) continue;
    switch (l.kind) {
      case 'red':
        py -= 60 * age * age + 20 * age;
        if (i % 3 === 2) seg(true, px - dx * 6, py - dy * 6, px, py);
        else dot(i % 4 === 0, px, py, (1 + 1.6 * h2) * lifeK);
        break;
      case 'normal':
        dot(i % 5 === 0, px, py, (1.4 + 2.2 * h2) * (0.4 + 0.6 * lifeK));
        break;
      case 'pierce': {
        const rot = h1 * 6 + age * 9;
        const sz = (3 + 4 * h2) * lifeK;
        const ca = Math.cos(rot);
        const sa = Math.sin(rot);
        shard(px + ca * sz, py + sa * sz, px - sa * sz * 0.4, py + ca * sz * 0.4, px - ca * sz, py - sa * sz);
        break;
      }
      case 'player':
        dot(i % 2 === 0, px, py, (1 + 1.3 * h2) * lifeK);
        break;
    }
  }
}
