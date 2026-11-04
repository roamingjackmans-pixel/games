// Hazardous terrain art (PROCGEN §3.2, ART_AUDIO §1): Slow and Hurt patches themed per zone. Cosmetic only.
//  · baked into the room's base layer: a dark outline ring (a crisp edge), the themed surface clipped to a
//    rounded, wobbly mask, and a rim. Slow patches read heavy and gooey (mud, sludge, snow drifts, oil, tar), with a
//    thick dark lip and a glossy rim; Hurt patches are the same spike field in every zone (D167), only recoloured
//    (ground, spikes, tips, a bright warning rim);
//  · per frame (drawTerrainAnim): Hurt patches throb with a glow, glints flash on their spike tips and hot specks rise;
//    Slow patches bubble and ripple lazily (snow twinkles, oil sheens). A few dozen small shapes at most.
import { OUTLINE, offscreen, withAlpha } from '../engine/draw/parts';
import { Rng } from '../engine/rng';
import { ROOM_W, ROOM_Y0, TERRAIN, TILE, type Room } from '../game/room';
import { blit, clipTo, edgeBand, jitterPoly, scratch, scratchRegion, silhouette, soft, tileBounds, type StyleId } from './roomStyle';

type Theme = 'crypt' | 'caverns' | 'sewers' | 'forest' | 'forge' | 'reliquary' | 'citadel' | 'abyss';

interface Look {
  deep: string;
  mid: string;
  hi: string;
  /** the rim inside the outline */
  rim: string;
  /** per-frame pulse color (Hurt patches always have one) */
  glow?: string;
  /** particle colors */
  p1: string;
  p2: string;
  /** Hurt only: the spikes' body and their bright tips (D167) */
  spike?: string;
  tip?: string;
}

const SLOW: Record<Theme, Look> = {
  crypt: { deep: '#24170c', mid: '#46301a', hi: '#8a6a40', rim: '#9a7a4a', p1: '#6a4e2c', p2: '#a88a5a' },
  caverns: { deep: '#3a1a1e', mid: '#6a3a30', hi: '#e0a070', rim: '#d89060', glow: '#c060ff', p1: '#8a5a40', p2: '#f0c0ff' },
  sewers: { deep: '#232a0c', mid: '#4c561a', hi: '#c8d060', rim: '#a8b048', p1: '#7a8a2a', p2: '#d8e080' },
  forest: { deep: '#1e1408', mid: '#3e2a12', hi: '#9a7a44', rim: '#7a5a2a', p1: '#5a4020', p2: '#b0e070' },
  forge: { deep: '#1e1a18', mid: '#3e3632', hi: '#8a7c70', rim: '#a06040', glow: '#7a2a08', p1: '#5a4a42', p2: '#c06a30' },
  reliquary: { deep: '#8aa6c4', mid: '#d6e4f2', hi: '#ffffff', rim: '#ffffff', p1: '#ffffff', p2: '#bfe4ff' },
  citadel: { deep: '#2a1c06', mid: '#5a3e0e', hi: '#f0c050', rim: '#e0b040', p1: '#8a6418', p2: '#ffe090' },
  abyss: { deep: '#160a24', mid: '#3a1a5c', hi: '#e0b0ff', rim: '#c080ff', glow: '#7a3ae0', p1: '#5a2a8a', p2: '#e0b0ff' },
};

const HURT: Record<Theme, Look> = {
  crypt: { deep: '#0a1612', mid: '#163a2c', hi: '#c8ffe8', rim: '#5affb0', glow: '#3aff9a', p1: '#5affb0', p2: '#e0fff4', spike: '#8fd0b4', tip: '#e0fff4' },
  caverns: { deep: '#2a4a06', mid: '#6aa014', hi: '#eaff90', rim: '#d8ff60', glow: '#a6e040', p1: '#d8ff70', p2: '#ffffff', spike: '#b8d860', tip: '#f4ffc0' },
  sewers: { deep: '#0a3008', mid: '#228418', hi: '#b8ff60', rim: '#80ff40', glow: '#50ff20', p1: '#a0ff50', p2: '#e8ffb0', spike: '#7ccf50', tip: '#e8ffb0' },
  forest: { deep: '#2a0c06', mid: '#4a160c', hi: '#ff6a3a', rim: '#ff5a2a', glow: '#ff3a1a', p1: '#ffffff', p2: '#ff6a3a', spike: '#e0d0a8', tip: '#ff6a3a' },
  forge: { deep: '#160a06', mid: '#2e140a', hi: '#ffd060', rim: '#ff8a20', glow: '#ff6a10', p1: '#ffb040', p2: '#fff0a0', spike: '#e09048', tip: '#fff0a0' },
  reliquary: { deep: '#1e3a5a', mid: '#3a6a94', hi: '#f4fcff', rim: '#bfe8ff', glow: '#7ac8ff', p1: '#ffffff', p2: '#bfe8ff', spike: '#a8dcf8', tip: '#ffffff' },
  citadel: { deep: '#1a2028', mid: '#2e3844', hi: '#c0f4ff', rim: '#ffd23a', glow: '#40c8ff', p1: '#c0f4ff', p2: '#ffffff', spike: '#9ab8d0', tip: '#c0f4ff' },
  abyss: { deep: '#0e0418', mid: '#2a0a3e', hi: '#ffd0ff', rim: '#e060ff', glow: '#c040ff', p1: '#f0a0ff', p2: '#ffffff', spike: '#c890f0', tip: '#ffd0ff' },
};

interface Mote {
  x: number;
  y: number;
  phase: number;
  period: number;
}

export interface TerrainArt {
  theme: Theme;
  slow: Mote[];
  hurt: Mote[];
  /** Hurt patches' glow for the throb, cropped to their bounds */
  hurtGlow: { canvas: CanvasImageSource; x: number; y: number } | null;
  slowGlow: { canvas: CanvasImageSource; x: number; y: number } | null;
}

function themeOf(style: StyleId): Theme {
  return style === 'hall' ? 'crypt' : style;
}

/** A hash of the terrain layer for the base cache key. */
export function terrainKey(room: Room): number {
  let h = 0x9e3779b1;
  for (let i = 0; i < room.terrain.length; i++) if (room.terrain[i]) h = Math.imul(h ^ (i * 3 + room.terrain[i]!), 16777619);
  return h >>> 0;
}

/** Bake every patch into the base layer; returns what the per-frame layer needs (null: the room has none). */
export function drawTerrainBase(ctx: CanvasRenderingContext2D, room: Room, style: StyleId, seed: number): TerrainArt | null {
  const slow: number[] = [];
  const hurt: number[] = [];
  for (let i = 0; i < room.terrain.length; i++) {
    if (room.terrain[i] === TERRAIN.Slow) slow.push(i);
    else if (room.terrain[i] === TERRAIN.Hurt) hurt.push(i);
  }
  if (!slow.length && !hurt.length) return null;
  const theme = themeOf(style);
  const art: TerrainArt = { theme, slow: [], hurt: [], hurtGlow: null, slowGlow: null };
  if (slow.length) {
    paintKind(ctx, room, slow, TERRAIN.Slow, SLOW[theme], theme, seed ^ 0x51a7);
    art.slow = motes(slow, seed ^ 0x77, 1);
    if (SLOW[theme].glow) art.slowGlow = glowLayer(slow, SLOW[theme].glow!, 0.45);
  }
  if (hurt.length) {
    paintKind(ctx, room, hurt, TERRAIN.Hurt, HURT[theme], theme, seed ^ 0xb00b);
    art.hurt = motes(hurt, seed ^ 0x99, 2);
    art.hurtGlow = glowLayer(hurt, HURT[theme].glow!, 0.6);
  }
  return art;
}

function motes(list: number[], seed: number, per: number): Mote[] {
  const r = new Rng(seed);
  const out: Mote[] = [];
  for (const i of list)
    for (let k = 0; k < per; k++)
      out.push({ x: (i % ROOM_W) * TILE + r.range(7, 25), y: Math.floor(i / ROOM_W) * TILE + r.range(7, 25), phase: r.range(0, 10), period: r.range(0.9, 2.2) });
  return out;
}

function glowLayer(list: number[], color: string, a: number): { canvas: CanvasImageSource; x: number; y: number } {
  const [x0, y0, w0, h0] = tileBounds(list, 20);
  const { canvas, ctx } = offscreen(w0, h0);
  for (const i of list) soft(ctx, (i % ROOM_W) * TILE + 16 - x0, Math.floor(i / ROOM_W) * TILE + 16 - y0, 26, color, a);
  return { canvas, x: x0, y: y0 };
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function paintKind(ctx: CanvasRenderingContext2D, room: Room, list: number[], kind: number, L: Look, theme: Theme, seed: number): void {
  const is = (tx: number, ty: number): boolean => tx >= 0 && ty >= 0 && tx < ROOM_W && room.terrain[ty * ROOM_W + tx] === kind;
  scratchRegion(tileBounds(list, 14));
  // the mask: tiles, rounded outer corners, a wobbly edge
  const M = scratch(5);
  const mc = M.ctx;
  mc.fillStyle = '#ffffff';
  for (const i of list) mc.fillRect((i % ROOM_W) * TILE, Math.floor(i / ROOM_W) * TILE, TILE, TILE);
  const r = new Rng(seed);
  const round = 11;
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const cx = tx * TILE + (sx > 0 ? TILE : 0);
      const cy = ty * TILE + (sy > 0 ? TILE : 0);
      if (is(tx + sx, ty) && is(tx, ty + sy) && !is(tx + sx, ty + sy)) {
        // an inside corner: a fillet into the notch, so steps read as one rounded shore
        const f = 9;
        mc.fillRect(sx > 0 ? cx : cx - f, sy > 0 ? cy : cy - f, f, f);
        mc.globalCompositeOperation = 'destination-out';
        mc.beginPath();
        mc.arc(cx + sx * f, cy + sy * f, f, 0, Math.PI * 2);
        mc.fill();
        mc.globalCompositeOperation = 'source-over';
        continue;
      }
      if (is(tx + sx, ty) || is(tx, ty + sy) || is(tx + sx, ty + sy)) continue;
      mc.globalCompositeOperation = 'destination-out';
      mc.fillRect(sx > 0 ? cx - round : cx, sy > 0 ? cy - round : cy, round, round);
      mc.globalCompositeOperation = 'source-over';
      mc.beginPath();
      mc.arc(cx - sx * round, cy - sy * round, round, 0, Math.PI * 2);
      mc.fill();
    }
    for (const [dx, dy] of DIRS) {
      if (is(tx + dx, ty + dy)) continue;
      const ex = tx * TILE + 16 + dx * 16;
      const ey = ty * TILE + 16 + dy * 16;
      const rr = r.range(6, 9);
      const t = r.range(-7, 7);
      const bulge = r.range(-2, 3);
      mc.globalCompositeOperation = bulge < 0 ? 'destination-out' : 'source-over';
      mc.beginPath();
      if (bulge < 0) mc.arc(ex + dy * t + dx * (rr + bulge), ey + dx * t + dy * (rr + bulge), rr, 0, Math.PI * 2);
      else mc.arc(ex + dy * t - dx * (rr - bulge), ey + dx * t - dy * (rr - bulge), rr, 0, Math.PI * 2);
      mc.fill();
    }
    mc.globalCompositeOperation = 'source-over';
  }
  // the outline: a dark ring just outside the mask (heavier on Slow patches: a lip)
  const ring = silhouette(M.canvas, 4, OUTLINE);
  const w = kind === TERRAIN.Slow ? 3.5 : 2.5;
  ctx.globalAlpha = 0.9;
  for (const [dx, dy] of [
    [-w, 0],
    [w, 0],
    [0, -w],
    [0, w],
    [-w * 0.7, -w * 0.7],
    [w * 0.7, -w * 0.7],
    [-w * 0.7, w * 0.7],
    [w * 0.7, w * 0.7],
  ] as const)
    blit2(ctx, ring, dx, dy);
  // Slow: a drop shadow under the heavy lip (it sits a little proud of the floor)
  if (kind === TERRAIN.Slow) {
    ctx.globalAlpha = 0.45;
    blit2(ctx, ring, 0, w + 2.5);
  }
  ctx.globalAlpha = 1;
  // the surface
  const S = scratch(6);
  const sc = S.ctx;
  sc.fillStyle = L.deep;
  for (const i of list) sc.fillRect((i % ROOM_W) * TILE - 10, Math.floor(i / ROOM_W) * TILE - 10, TILE + 20, TILE + 20);
  for (const i of list) {
    const tr = new Rng(seed ^ Math.imul(i + 17, 2654435761));
    if (kind === TERRAIN.Slow) paintSlowTile(sc, tr, L, theme, (i % ROOM_W) * TILE, Math.floor(i / ROOM_W) * TILE);
    else paintHurtTile(sc, tr, L, theme, (i % ROOM_W) * TILE, Math.floor(i / ROOM_W) * TILE);
  }
  // themed detail that spans tiles (cracks, roots, plates)
  spanDetail(sc, list, kind, L, theme, new Rng(seed ^ 0x3c3c));
  clipTo(sc, M.canvas);
  blit(ctx, S.canvas);
  // the rim: Slow = a glossy highlight on the upper-left and a dark inner shade below; Hurt = a bright warning line
  const hi = silhouette(M.canvas, 4, L.rim);
  if (kind === TERRAIN.Slow) {
    ctx.globalAlpha = theme === 'reliquary' ? 0.9 : 0.55;
    blit(ctx, edgeBand(hi, 1, -2, -2));
    const dark = silhouette(M.canvas, 4, '#000000');
    ctx.globalAlpha = theme === 'reliquary' ? 0.25 : 0.35;
    blit(ctx, edgeBand(dark, 1, 3, 3));
  } else {
    ctx.globalAlpha = 0.95;
    for (const d of [2, -2] as const) blit(ctx, edgeBand(hi, 1, d, d));
    ctx.globalAlpha = 0.5;
    blit(ctx, edgeBand(hi, 1, 4, 0));
    blit(ctx, edgeBand(hi, 1, -4, 0));
  }
  ctx.globalAlpha = 1;
  scratchRegion(null);
}

/** Draw a full-room scratch canvas offset by (dx, dy). */
function blit2(ctx: CanvasRenderingContext2D, src: CanvasImageSource, dx: number, dy: number): void {
  ctx.drawImage(src, dx, dy);
}

function blobs(c: CanvasRenderingContext2D, r: Rng, x: number, y: number, n: number, color: string, rMin: number, rMax: number, sy = 0.8): void {
  c.fillStyle = color;
  for (let k = 0; k < n; k++) {
    jitterPoly(c, r, x + r.range(2, 30), y + r.range(2, 30), r.range(rMin, rMax), 7, 0.3, sy);
    c.fill();
  }
}

function dots(c: CanvasRenderingContext2D, r: Rng, x: number, y: number, n: number, color: string, rMin: number, rMax: number): void {
  c.fillStyle = color;
  for (let k = 0; k < n; k++) {
    c.beginPath();
    c.arc(x + r.range(3, 29), y + r.range(3, 29), r.range(rMin, rMax), 0, Math.PI * 2);
    c.fill();
  }
}

function bone(c: CanvasRenderingContext2D, x: number, y: number, a: number, len: number): void {
  const dx = Math.cos(a) * len * 0.5;
  const dy = Math.sin(a) * len * 0.5;
  c.lineCap = 'round';
  c.strokeStyle = OUTLINE;
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(x - dx, y - dy);
  c.lineTo(x + dx, y + dy);
  c.stroke();
  c.strokeStyle = '#d8d0b0';
  c.lineWidth = 2.5;
  c.stroke();
  for (const s of [-1, 1]) {
    for (const o of [-1.6, 1.6]) {
      c.fillStyle = OUTLINE;
      c.beginPath();
      c.arc(x + s * dx - Math.sin(a) * o, y + s * dy + Math.cos(a) * o, 3, 0, Math.PI * 2);
      c.fill();
    }
    for (const o of [-1.6, 1.6]) {
      c.fillStyle = '#e8e0c4';
      c.beginPath();
      c.arc(x + s * dx - Math.sin(a) * o, y + s * dy + Math.cos(a) * o, 1.8, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function gear(c: CanvasRenderingContext2D, x: number, y: number, rad: number, rot: number): void {
  c.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = rot + (k / 16) * Math.PI * 2;
    const rr = k % 2 === 0 ? rad : rad * 0.74;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = '#8a6a2a';
  c.fill();
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = '#1a1822';
  c.beginPath();
  c.arc(x, y, rad * 0.32, 0, Math.PI * 2);
  c.fill();
}

function paintSlowTile(c: CanvasRenderingContext2D, r: Rng, L: Look, theme: Theme, x: number, y: number): void {
  blobs(c, r, x, y, 3, L.mid, 6, 11);
  switch (theme) {
    case 'crypt':
      // grave mud: wet dark holes, lumps, and old bones
      blobs(c, r, x, y, 2, '#160e06', 2, 4);
      dots(c, r, x, y, 3, L.p1, 1.5, 3);
      if (r.chance(0.35)) bone(c, x + r.range(9, 23), y + r.range(9, 23), r.range(0, Math.PI), r.range(10, 15));
      else if (r.chance(0.2)) {
        // a skull peeking out
        const sx = x + r.range(10, 22);
        const sy = y + r.range(10, 22);
        c.fillStyle = OUTLINE;
        c.beginPath();
        c.arc(sx, sy, 6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#d8d0b0';
        c.beginPath();
        c.arc(sx, sy, 4.6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = OUTLINE;
        c.fillRect(sx - 3, sy - 1, 2, 2);
        c.fillRect(sx + 1, sy - 1, 2, 2);
      }
      break;
    case 'caverns':
      // sticky spore sludge: glowing spores stuck in it
      dots(c, r, x, y, 4, L.p1, 1, 2.2);
      dots(c, r, x, y, 2, L.p2, 0.8, 1.4);
      break;
    case 'sewers':
      // sewage slime: scum, floating muck
      blobs(c, r, x, y, 2, '#6a7426', 3, 6);
      c.fillStyle = '#3a2a14';
      for (let k = 0; k < 2; k++) c.fillRect(x + r.range(4, 26), y + r.range(4, 26), r.range(3, 6), 2);
      dots(c, r, x, y, 3, L.hi, 0.8, 1.6);
      break;
    case 'forest':
      // bramble roots are spanned over the patch (spanDetail); dark wet soil here
      blobs(c, r, x, y, 2, '#140c04', 2, 5);
      break;
    case 'forge':
      // cooling slag: grey crust plates over a dull warmth
      c.fillStyle = '#3a1a10';
      c.fillRect(x, y, TILE, TILE);
      blobs(c, r, x, y, 4, L.mid, 6, 10);
      blobs(c, r, x, y, 2, '#4e4640', 3, 6);
      dots(c, r, x, y, 2, L.hi, 0.8, 1.5);
      break;
    case 'reliquary':
      // deep snow drifts: soft mounds with blue shadows
      c.fillStyle = L.mid;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.ellipse(x + r.range(4, 28), y + r.range(4, 28), r.range(9, 14), r.range(6, 9), 0, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = '#9ab8d8';
      c.lineWidth = 1.5;
      for (let k = 0; k < 2; k++) {
        const cx = x + r.range(6, 26);
        const cy = y + r.range(8, 26);
        c.beginPath();
        c.arc(cx, cy, r.range(5, 9), Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
      }
      dots(c, r, x, y, 3, '#ffffff', 1, 2);
      break;
    case 'citadel':
      // thick clockwork grease with sunken gears and a sheen
      c.lineWidth = 1.5;
      for (const col of ['#f0c050', '#c08a20', '#ffe8a0']) {
        c.strokeStyle = withAlpha(col, 0.45);
        c.beginPath();
        c.arc(x + r.range(6, 26), y + r.range(6, 26), r.range(5, 10), r.range(0, 3), r.range(3.5, 6));
        c.stroke();
      }
      if (r.chance(0.45)) gear(c, x + r.range(10, 22), y + r.range(10, 22), r.range(5, 8), r.range(0, 1));
      break;
    case 'abyss':
      // void tar: thick violet-black goo with glossy streaks (no specks: it must never read as the starry void)
      blobs(c, r, x, y, 2, '#0a0412', 3, 6);
      c.strokeStyle = withAlpha(L.hi, 0.45);
      c.lineWidth = 1.5;
      c.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        const sx = x + r.range(6, 24);
        const sy = y + r.range(6, 26);
        c.beginPath();
        c.moveTo(sx, sy);
        c.quadraticCurveTo(sx + 4, sy - 3, sx + r.range(6, 10), sy + r.range(-2, 2));
        c.stroke();
      }
      break;
  }
  // a glossy blob highlight (gooey)
  if (theme !== 'reliquary' && theme !== 'forest' && r.chance(0.5)) {
    c.fillStyle = withAlpha(L.hi, 0.35);
    c.beginPath();
    c.ellipse(x + r.range(8, 24), y + r.range(8, 24), r.range(3, 5), r.range(1.2, 2), -0.4, 0, Math.PI * 2);
    c.fill();
  }
}

function spike(c: CanvasRenderingContext2D, x: number, y: number, h: number, wd: number, lean: number, fill: string, tip: string): void {
  c.beginPath();
  c.moveTo(x - wd, y);
  c.lineTo(x + lean, y - h);
  c.lineTo(x + wd, y);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = OUTLINE;
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = tip;
  c.beginPath();
  c.moveTo(x - wd * 0.3 + lean * 0.6, y - h * 0.6);
  c.lineTo(x + lean, y - h);
  c.lineTo(x + wd * 0.2 + lean * 0.6, y - h * 0.6);
  c.closePath();
  c.fill();
}

/** Hurt ground (D167): the same spike field in every zone, only its colours change: dark ground, a cluster of spikes, a few hot specks. */
function paintHurtTile(c: CanvasRenderingContext2D, r: Rng, L: Look, _theme: Theme, x: number, y: number): void {
  blobs(c, r, x, y, 2, L.mid, 5, 9);
  for (let k = 0; k < 4; k++) spike(c, x + r.range(5, 27), y + r.range(13, 31), r.range(11, 17), 3.6, r.range(-3, 3), L.spike ?? L.hi, L.tip ?? '#ffffff');
  dots(c, r, x, y, 1, L.rim, 1.2, 1.8);
}

/** Detail that runs across tiles: forest bramble roots under Slow patches (Hurt patches are one spike field everywhere, D167). */
function spanDetail(c: CanvasRenderingContext2D, list: number[], kind: number, _L: Look, theme: Theme, r: Rng): void {
  const hurt = kind === TERRAIN.Hurt;
  if (!hurt && theme === 'forest') {
    // tangled bramble roots: thick knotted curves over the soil
    c.lineCap = 'round';
    for (const i of list) {
      for (let k = 0; k < 2; k++) {
        const x = (i % ROOM_W) * TILE + r.range(0, 32);
        const y = Math.floor(i / ROOM_W) * TILE + r.range(0, 32);
        const a = r.range(0, Math.PI * 2);
        const len = r.range(22, 38);
        const x2 = x + Math.cos(a) * len;
        const y2 = y + Math.sin(a) * len;
        const mx = (x + x2) / 2 + r.range(-10, 10);
        const my = (y + y2) / 2 + r.range(-10, 10);
        for (const [wd, col] of [
          [6.5, OUTLINE],
          [4, '#5a3a1a'],
          [1.5, '#8a6a3a'],
        ] as const) {
          c.strokeStyle = col;
          c.lineWidth = wd;
          c.beginPath();
          c.moveTo(x, y);
          c.quadraticCurveTo(mx, my, x2, y2);
          c.stroke();
        }
      }
      if (r.chance(0.3)) {
        // a sprig of leaves
        const x = (i % ROOM_W) * TILE + r.range(8, 24);
        const y = Math.floor(i / ROOM_W) * TILE + r.range(8, 24);
        c.fillStyle = '#4a7a2a';
        c.beginPath();
        c.ellipse(x, y, 3.5, 1.8, r.range(0, 3), 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}

// ------------------------------------------------------------------ per frame

function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** The animated touch, drawn over the base each frame (room-local px translated by ROOM_Y0). */
export function drawTerrainAnim(ctx: CanvasRenderingContext2D, art: TerrainArt, t: number): void {
  ctx.save();
  ctx.translate(0, ROOM_Y0);
  const prevOp = ctx.globalCompositeOperation;
  const S = SLOW[art.theme];
  const H = HURT[art.theme];
  // throbbing danger glow (fast flicker on fire/sparks, slower on pools)
  if (art.hurtGlow) {
    const flick = 0.08 * Math.sin(t * 11.3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, Math.min(1, 0.32 + 0.2 * Math.sin(t * 3.4) + flick));
    ctx.drawImage(art.hurtGlow.canvas, art.hurtGlow.x, art.hurtGlow.y);
  }
  if (art.slowGlow) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 0.9);
    ctx.drawImage(art.slowGlow.canvas, art.slowGlow.x, art.slowGlow.y);
  }
  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = 1;
  for (const m of art.slow) slowMote(ctx, m, S, art.theme, t);
  for (const m of art.hurt) hurtMote(ctx, m, H, art.theme, t);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prevOp;
  ctx.restore();
}

function slowMote(ctx: CanvasRenderingContext2D, m: Mote, L: Look, theme: Theme, t: number): void {
  const period = m.period * 1.8;
  const p = ((t + m.phase) % period) / period;
  if (theme === 'reliquary') {
    // snow glitter
    const k = Math.max(0, Math.sin(p * Math.PI * 2)) ** 6;
    if (k < 0.05) return;
    ctx.globalAlpha = k;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(m.x - 2.5 * k, m.y - 0.5, 5 * k, 1);
    ctx.fillRect(m.x - 0.5, m.y - 2.5 * k, 1, 5 * k);
    return;
  }
  if (theme === 'forest') {
    // roots creak: a slow mud bubble between them
    if (p > 0.5) return;
  }
  if (theme === 'citadel' && p > 0.6) {
    // the oil sheen slides
    ctx.globalAlpha = Math.sin(((p - 0.6) / 0.4) * Math.PI) * 0.5;
    ctx.strokeStyle = hash01(m.phase) > 0.5 ? L.p1 : L.p2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 4 + p * 4, t % 6.28, (t % 6.28) + 2);
    ctx.stroke();
    return;
  }
  // a heavy bubble swells, pops, leaves a ripple
  if (p < 0.7) {
    const q = p / 0.7;
    const rad = 1 + q * 3.5;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = L.p1;
    ctx.beginPath();
    ctx.arc(m.x, m.y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = L.p2;
    ctx.fillRect(m.x - rad * 0.45, m.y - rad * 0.55, 1.5, 1.5);
  } else {
    const q = (p - 0.7) / 0.3;
    ctx.globalAlpha = (1 - q) * 0.7;
    ctx.strokeStyle = L.hi;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, 3 + q * 7, 1.5 + q * 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Hurt patches' life (D167): the same everywhere: glints flash on the spike tips and a hot speck drifts up. */
function hurtMote(ctx: CanvasRenderingContext2D, m: Mote, L: Look, _theme: Theme, t: number): void {
  const p = ((t + m.phase) % m.period) / m.period;
  const k = Math.max(0, Math.sin(p * Math.PI * 2)) ** 8;
  if (k > 0.05) {
    ctx.globalAlpha = k;
    ctx.fillStyle = L.tip ?? L.p1;
    ctx.fillRect(m.x - 3 * k, m.y - 6 - 0.5, 6 * k, 1);
    ctx.fillRect(m.x - 0.5, m.y - 6 - 3 * k, 1, 6 * k);
  }
  ctx.globalAlpha = Math.sin(p * Math.PI) * 0.7;
  ctx.fillStyle = L.p2;
  ctx.fillRect(m.x + Math.sin(t + m.phase) * 4, m.y - p * 14, 1.6, 1.6);
}
