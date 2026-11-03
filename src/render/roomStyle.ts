// Per-zone room art: wall/floor families, colors, ambient darkness, particles (ART_AUDIO §1–2), plus the shared
// types and small paint helpers the room layers use. Cosmetic only; never read by the simulation.
import { getGlow, offscreen } from '../engine/draw/parts';
import { ROOM_H, ROOM_W, T, TILE, doorTiles, type Room, type Side } from '../game/room';

export const RW = ROOM_W * TILE; // 1280
export const RH = ROOM_H * TILE; // 704

export type StyleId = 'crypt' | 'caverns' | 'sewers' | 'forest' | 'forge' | 'reliquary' | 'citadel' | 'abyss' | 'hall';

/** Ambient particle kinds (ambience.ts). */
export const AMB = {
  dust: 0,
  spore: 1,
  drip: 2,
  firefly: 3,
  leaf: 4,
  ember: 5,
  ash: 6,
  snow: 7,
  steam: 8,
  spark: 9,
  voidMote: 10,
  pitDust: 11,
} as const;
export type AmbKind = (typeof AMB)[keyof typeof AMB];

export interface RoomStyle {
  id: StyleId;
  /** organic walls get bumpy, rounded outlines (caves, tree lines, crags) */
  organic: boolean;
  /** height of a south-facing wall's front face, px */
  frontH: number;
  top: string;
  topHi: string;
  front: string;
  frontDark: string;
  /** pit cliff (the far inner wall of a hole) */
  cliff: string;
  /** haze at the bottom of pits */
  fog: string;
  /** baked ambient darkness: r, g, b, alpha */
  dark: [number, number, number, number];
  /** vignette alpha at the corners and its color */
  vignette: number;
  vignetteColor: string;
  /** warm/cold color of wall lights */
  lightColor: string;
  /** ambient particles: kind and count */
  particles: [AmbKind, number][];
  /** pits are star-filled void (The Abyss) */
  voidPits: boolean;
}

const BASE: Omit<RoomStyle, 'id'> = {
  organic: false,
  frontH: 18,
  top: '#4a5644',
  topHi: '#77866c',
  front: '#2c3428',
  frontDark: '#151a13',
  cliff: '#3d4535',
  fog: '#2a4a3a',
  dark: [8, 14, 10, 0.42],
  vignette: 0.55,
  vignetteColor: '#040705',
  lightColor: '#ff9a3a',
  particles: [[AMB.dust, 34]],
  voidPits: false,
};

export const STYLES: Record<StyleId, RoomStyle> = {
  crypt: { ...BASE, id: 'crypt', particles: [[AMB.dust, 34], [AMB.pitDust, 8]] },
  hall: { ...BASE, id: 'hall', dark: [10, 12, 10, 0.3], vignette: 0.45, particles: [[AMB.dust, 26]] },
  caverns: {
    ...BASE,
    id: 'caverns',
    organic: true,
    frontH: 18,
    top: '#5a4874',
    topHi: '#9a84c4',
    front: '#34283f',
    frontDark: '#130d1b',
    cliff: '#3a2c4a',
    fog: '#3a2a6a',
    dark: [10, 4, 22, 0.5],
    vignette: 0.6,
    vignetteColor: '#06020c',
    lightColor: '#5fd3c0',
    particles: [[AMB.spore, 30], [AMB.dust, 12], [AMB.pitDust, 8]],
  },
  sewers: {
    ...BASE,
    id: 'sewers',
    frontH: 18,
    top: '#5a6650',
    topHi: '#8a9a72',
    front: '#343e2e',
    frontDark: '#121811',
    cliff: '#2e3428',
    fog: '#1a3a2a',
    dark: [2, 10, 8, 0.46],
    vignette: 0.6,
    vignetteColor: '#020604',
    lightColor: '#e8c060',
    particles: [[AMB.drip, 12], [AMB.dust, 16], [AMB.pitDust, 6]],
  },
  forest: {
    ...BASE,
    id: 'forest',
    organic: true,
    frontH: 22,
    top: '#1f3d22',
    topHi: '#3f7038',
    front: '#3a2814',
    frontDark: '#150c05',
    cliff: '#3a2a16',
    fog: '#2a3a1a',
    dark: [8, 10, 2, 0.32],
    vignette: 0.55,
    vignetteColor: '#050602',
    lightColor: '#e6b84a',
    particles: [[AMB.firefly, 16], [AMB.leaf, 14], [AMB.pitDust, 6]],
  },
  forge: {
    ...BASE,
    id: 'forge',
    top: '#4a3a34',
    topHi: '#7e6658',
    front: '#2e201c',
    frontDark: '#0f0706',
    cliff: '#2a1a14',
    fog: '#5a1a08',
    dark: [16, 3, 0, 0.42],
    vignette: 0.6,
    vignetteColor: '#0a0200',
    lightColor: '#ff7a1a',
    particles: [[AMB.ember, 30], [AMB.ash, 18], [AMB.pitDust, 6]],
  },
  reliquary: {
    ...BASE,
    id: 'reliquary',
    top: '#7a92aa',
    topHi: '#d4e4f4',
    front: '#3e5266',
    frontDark: '#1d2937',
    cliff: '#4a6078',
    fog: '#6a9ac8',
    dark: [4, 12, 28, 0.26],
    vignette: 0.5,
    vignetteColor: '#02060e',
    lightColor: '#ffd27a',
    particles: [[AMB.snow, 46], [AMB.pitDust, 6]],
  },
  citadel: {
    ...BASE,
    id: 'citadel',
    top: '#5a4a2a',
    topHi: '#b89a4a',
    front: '#2e2a30',
    frontDark: '#131117',
    cliff: '#2e2a34',
    fog: '#2a6a6a',
    dark: [8, 6, 16, 0.36],
    vignette: 0.55,
    vignetteColor: '#040308',
    lightColor: '#2aa198',
    particles: [[AMB.steam, 14], [AMB.spark, 10], [AMB.dust, 14], [AMB.pitDust, 6]],
  },
  abyss: {
    ...BASE,
    id: 'abyss',
    organic: true,
    frontH: 18,
    top: '#261a36',
    topHi: '#5a3486',
    front: '#150d20',
    frontDark: '#06030a',
    cliff: '#3a2a52',
    fog: '#3a1060',
    dark: [6, 0, 14, 0.42],
    vignette: 0.65,
    vignetteColor: '#030008',
    lightColor: '#b06bff',
    particles: [[AMB.voidMote, 34], [AMB.pitDust, 10]],
    voidPits: true,
  },
};

const BY_PROP: Record<string, StyleId> = {
  coffin: 'crypt',
  mushroom: 'caverns',
  barrel: 'sewers',
  stump: 'forest',
  anvil: 'forge',
  crystal: 'reliquary',
  gear: 'citadel',
  void: 'abyss',
};

/** The zone's art style from its prop style (one per zone; anything else is the plain training-hall look). */
export function styleFor(propStyle: string): RoomStyle {
  return STYLES[BY_PROP[propStyle] ?? 'hall'];
}

// ------------------------------------------------------------------ shared art data

export interface Light {
  /** room-local px (add ROOM_Y0 for screen y) */
  x: number;
  y: number;
  r: number;
  color: string;
  /** strength 0..1 */
  a: number;
  /** 0 steady, 1 torch flicker, 2 slow pulse, 3 faint shimmer */
  flicker: 0 | 1 | 2 | 3;
  phase: number;
}

export interface Flame {
  x: number;
  y: number;
  /** size multiplier (1 = torch, 0.45 = candle) */
  s: number;
  phase: number;
  /** 0 fire, 1 cold gold candle, 2 violet witch-fire, 3 green sewer-lamp */
  tint: 0 | 1 | 2 | 3;
}

export interface Gear {
  x: number;
  y: number;
  r: number;
  teeth: number;
  dir: 1 | -1;
}

/** What the per-frame layers need about the room (rebuilt with the static layer). */
export interface RoomArt {
  style: RoomStyle;
  lights: Light[];
  flames: Flame[];
  gears: Gear[];
  /** steam vents / drip spouts, room-local px */
  vents: [number, number][];
  /** puddles for ripples: x, y, rx, ry */
  puddles: [number, number, number, number][];
  hazardKind: string;
  /** how hazard tiles animate: liquid ripples, molten bubbles, ice glints, crumble motes, moss embers, none */
  hazardFamily: string;
  hazardHi: string;
  hazardTiles: number[];
  pitTiles: number[];
  voidTiles: number[];
  /** walkable-ish tiles for particle spawns */
  openTiles: number[];
  /** bright parts of glowing hazards (lava, void cracks) for the pulse, cropped */
  hazardGlow: { canvas: CanvasImageSource; x: number; y: number } | null;
}

export function emptyArt(style: RoomStyle): RoomArt {
  return { style, lights: [], flames: [], gears: [], vents: [], puddles: [], hazardKind: '', hazardFamily: '', hazardHi: '#ffffff', hazardTiles: [], pitTiles: [], voidTiles: [], openTiles: [], hazardGlow: null };
}

// ------------------------------------------------------------------ effective tiles

/** Effective tile codes for drawing (doors resolved, trees split from props). */
export const E = { Floor: 0, Wall: 1, Pillar: 2, Prop: 3, Hazard: 4, Pit: 5, Grate: 6, Door: 7, Void: 8, Tree: 9 } as const;

export class Tiles {
  readonly e = new Uint8Array(ROOM_W * ROOM_H);
  readonly doorSide = new Map<number, Side>();
  constructor(room: Room) {
    for (const s of ['n', 's', 'e', 'w'] as Side[]) for (const [dx, dy] of doorTiles(s)) this.doorSide.set(dy * ROOM_W + dx, s);
    for (let i = 0; i < ROOM_W * ROOM_H; i++) {
      const t = room.tiles[i]!;
      const side = this.doorSide.get(i);
      let v: number;
      if (side) v = room.doors[side].exists ? E.Door : E.Wall;
      else if (t === T.Door) v = E.Wall;
      else if (t === T.Wall) v = E.Wall;
      else if (t === T.Pillar) v = E.Pillar;
      else if (t === T.Prop) v = room.trees.has(i) ? E.Tree : E.Prop;
      else if (t === T.Hazard) v = E.Hazard;
      else if (t === T.Pit) v = E.Pit;
      else if (t === T.Grate) v = E.Grate;
      else if (t === T.Void) v = E.Void;
      else v = E.Floor;
      this.e[i] = v;
    }
  }
  get(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= ROOM_W || ty >= ROOM_H) return E.Wall;
    return this.e[ty * ROOM_W + tx]!;
  }
  wall(tx: number, ty: number): boolean {
    return this.get(tx, ty) === E.Wall;
  }
  /** plain floor a decal may sit on */
  floor(tx: number, ty: number): boolean {
    return this.get(tx, ty) === E.Floor;
  }
  hole(tx: number, ty: number): boolean {
    const v = this.get(tx, ty);
    return v === E.Pit || v === E.Void;
  }
  /** near any door tile (Chebyshev distance) */
  nearDoor(tx: number, ty: number, d: number): boolean {
    for (const i of this.doorSide.keys()) {
      if (this.e[i] !== E.Door) continue;
      const x = i % ROOM_W;
      const y = Math.floor(i / ROOM_W);
      if (Math.abs(x - tx) <= d && Math.abs(y - ty) <= d) return true;
    }
    return false;
  }
}

// ------------------------------------------------------------------ paint helpers

/** A soft round blot (the cached glow sprite drawn source-over). Only pass fixed palette colors (the sprite cache is per color). */
export function soft(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number, sx = 1, sy = 1): void {
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * a;
  ctx.drawImage(getGlow(color), x - r * sx, y - r * sy, r * 2 * sx, r * 2 * sy);
  ctx.globalAlpha = pa;
}

/** Path of a jittered polygon around (cx, cy). */
export function jitterPoly(ctx: CanvasRenderingContext2D, rng: { next(): number }, cx: number, cy: number, r: number, n: number, jit: number, sy = 1): void {
  ctx.beginPath();
  const a0 = rng.next() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const rr = r * (1 - jit + rng.next() * jit * 2);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * sy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** A zig-zag crack with an optional branch. */
export function crack(ctx: CanvasRenderingContext2D, rng: { next(): number }, x: number, y: number, len: number, ang: number, color: string, w: number, branch = true): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  let px = x;
  let py = y;
  let a = ang;
  const seg = 4 + rng.next() * 4;
  let bx = 0;
  let by = 0;
  let ba = 0;
  for (let d = 0; d < len; d += seg) {
    a += (rng.next() - 0.5) * 1.1;
    px += Math.cos(a) * seg;
    py += Math.sin(a) * seg;
    ctx.lineTo(px, py);
    if (d < len * 0.5 && d + seg >= len * 0.4) {
      bx = px;
      by = py;
      ba = a + (rng.next() < 0.5 ? -1 : 1) * (0.6 + rng.next() * 0.6);
    }
  }
  if (branch && len > 14) {
    ctx.moveTo(bx, by);
    let qx = bx;
    let qy = by;
    for (let d = 0; d < len * 0.45; d += seg) {
      ba += (rng.next() - 0.5) * 0.9;
      qx += Math.cos(ba) * seg;
      qy += Math.sin(ba) * seg;
      ctx.lineTo(qx, qy);
    }
  }
  ctx.stroke();
}

// ------------------------------------------------------------------ scratch canvases (reused between room renders)

type Canvas = HTMLCanvasElement | OffscreenCanvas;
const pool: { canvas: Canvas; ctx: CanvasRenderingContext2D; clipped: boolean }[] = [];
let region: [number, number, number, number] | null = null;

/** Limit scratch work to a rect (pits, pools) until reset with null: compositing cost scales with area. */
export function scratchRegion(r: [number, number, number, number] | null): void {
  region = r;
}

/** A cleared full-room scratch canvas; index picks which one (callers keep indices distinct while in use). */
export function scratch(i: number): { canvas: Canvas; ctx: CanvasRenderingContext2D } {
  let s = pool[i];
  if (!s) {
    s = { ...offscreen(RW, RH), clipped: false };
    pool[i] = s;
  }
  const c = s.ctx;
  if (s.clipped) {
    c.restore();
    s.clipped = false;
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, RW, RH);
  if (region) {
    c.save();
    c.beginPath();
    c.rect(region[0], region[1], region[2], region[3]);
    c.clip();
    s.clipped = true;
  }
  return s;
}

/** Draw a scratch canvas onto `ctx` (only the active region, if any). */
export function blit(ctx: CanvasRenderingContext2D, src: Canvas): void {
  if (region) ctx.drawImage(src, region[0], region[1], region[2], region[3], region[0], region[1], region[2], region[3]);
  else ctx.drawImage(src, 0, 0);
}

/** Bounding rect of tiles (px) grown by a margin, clamped to the room. */
export function tileBounds(list: number[], margin: number): [number, number, number, number] {
  let x0 = RW;
  let y0 = RH;
  let x1 = 0;
  let y1 = 0;
  for (const i of list) {
    const x = (i % ROOM_W) * TILE;
    const y = Math.floor(i / ROOM_W) * TILE;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + TILE);
    y1 = Math.max(y1, y + TILE);
  }
  x0 = Math.max(0, x0 - margin);
  y0 = Math.max(0, y0 - margin);
  x1 = Math.min(RW, x1 + margin);
  y1 = Math.min(RH, y1 + margin);
  return [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
}

/** Copy `src` into scratch `i` recolored to a flat `color` (a silhouette of the mask). */
export function silhouette(src: Canvas, i: number, color: string): Canvas {
  const { canvas, ctx } = scratch(i);
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, RW, RH);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

/** Pixels of `mask` whose neighbour (dx, dy) away is outside the mask: an edge band, into scratch `i`. */
export function edgeBand(mask: Canvas, i: number, dx: number, dy: number): Canvas {
  const { canvas, ctx } = scratch(i);
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(mask, -dx, -dy);
  ctx.globalCompositeOperation = 'source-over';
  // beyond the canvas counts as solid (the room's border continues off screen)
  if (dx > 0) ctx.clearRect(RW - dx, 0, dx, RH);
  else if (dx < 0) ctx.clearRect(0, 0, -dx, RH);
  if (dy > 0) ctx.clearRect(0, RH - dy, RW, dy);
  else if (dy < 0) ctx.clearRect(0, 0, RW, -dy);
  return canvas;
}

/** Keep only the part of scratch `dst` inside `mask`. */
export function clipTo(dst: CanvasRenderingContext2D, mask: Canvas): void {
  dst.globalCompositeOperation = 'destination-in';
  dst.drawImage(mask, 0, 0);
  dst.globalCompositeOperation = 'source-over';
}
