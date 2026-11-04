// Holes and hazard floors, pre-rendered: pits read as holes (jagged broken rim, rubble and cracks around it, the far
// inner cliff face, depth fog at the bottom), the Abyss void is a starry drop with an obvious platform ledge, and
// each hazard pool looks like its thing (water, lava, ice, bog, thorns, oil, crumbling void edge…) with rounded,
// organic shores.
import { OUTLINE, offscreen, shade, withAlpha } from '../engine/draw/parts';
import { Rng } from '../engine/rng';
import { OVERLAY, ROOM_W, T, TILE, type Room } from '../game/room';
import type { Palette } from '../game/types';
import { E, RH, RW, blit, clipTo, crack, edgeBand, jitterPoly, scratch, scratchRegion, silhouette, soft, tileBounds, type RoomArt, type RoomStyle, type Tiles } from './roomStyle';

export interface HoleCtx {
  ctx: CanvasRenderingContext2D;
  rng: Rng;
  tiles: Tiles;
  pal: Palette;
  style: RoomStyle;
  art: RoomArt;
  seed: number;
}

const DIRS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
] as const;

// ------------------------------------------------------------------ the void sky

/** A starfield with violet nebulae, the whole room's size (also used for platform tiles that fall away). */
export function makeVoidSky(seed: number): CanvasImageSource {
  const { canvas, ctx } = offscreen(RW, RH);
  const rng = new Rng(seed ^ 0x51a7);
  ctx.fillStyle = '#05020c';
  ctx.fillRect(0, 0, RW, RH);
  for (let k = 0; k < 60; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(50, 170), rng.pick(['#4a1a80', '#2a1068', '#6a24b0', '#1a2a78', '#3a0a50']), 0.25 + rng.next() * 0.35);
  for (let k = 0; k < 18; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(40, 120), '#000000', 0.45);
  for (let k = 0; k < 900; k++) {
    ctx.fillStyle = withAlpha(rng.chance(0.7) ? '#ffffff' : rng.chance(0.5) ? '#d0a8ff' : '#a8c8ff', 0.3 + rng.next() * 0.7);
    const s = rng.chance(0.88) ? 1 : 1.8;
    ctx.fillRect(rng.range(0, RW), rng.range(0, RH), s, s);
  }
  for (let k = 0; k < 34; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    soft(ctx, x, y, 7, '#d6c0ff', 0.7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 3.5, y - 0.5, 7, 1);
    ctx.fillRect(x - 0.5, y - 3.5, 1, 7);
  }
  return canvas;
}

// ------------------------------------------------------------------ pits and void

type HoleKind = 'pit' | 'void';

function isHoleOf(h: HoleCtx, kind: HoleKind, tx: number, ty: number): boolean {
  const v = h.tiles.get(tx, ty);
  if (kind === 'void') return v === E.Void || (h.style.voidPits && v === E.Pit);
  return v === E.Pit && !h.style.voidPits;
}

const stripCache = new Map<string, CanvasImageSource>();
function cliffGradient(color: string, h: number): CanvasImageSource {
  const key = `${color}|${h}`;
  let c = stripCache.get(key);
  if (!c) {
    const o = offscreen(32, h);
    const g = o.ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, shade(color, 1.45));
    g.addColorStop(0.1, shade(color, 1.1));
    g.addColorStop(0.5, shade(color, 0.6));
    g.addColorStop(0.85, shade(color, 0.25));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    o.ctx.fillStyle = g;
    o.ctx.fillRect(0, 0, 32, h);
    c = o.canvas;
    stripCache.set(key, c);
  }
  return c;
}

/** Pits (or void when `kind` is 'void'): mask with a broken rim, interior, far cliff, near lip, rubble. */
export function drawHoles(h: HoleCtx, kind: HoleKind, sky: CanvasImageSource | null): void {
  const { ctx, rng, style, pal } = h;
  const list: number[] = [];
  for (let i = 0; i < h.tiles.e.length; i++) if (isHoleOf(h, kind, i % ROOM_W, Math.floor(i / ROOM_W))) list.push(i);
  if (!list.length) return;
  const hole = (tx: number, ty: number): boolean => isHoleOf(h, kind, tx, ty);
  const solid = (tx: number, ty: number): boolean => h.tiles.wall(tx, ty);
  const isVoid = kind === 'void';
  const cliff = isVoid ? '#3a2a52' : shade(style.cliff, 1.2);
  scratchRegion(tileBounds(list, 12));
  // mask: tiles plus a jagged rim eating a few px into the floor around them
  const P = scratch(5);
  const pc = P.ctx;
  pc.fillStyle = '#000000';
  for (const i of list) pc.fillRect((i % ROOM_W) * TILE, Math.floor(i / ROOM_W) * TILE, TILE, TILE);
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    for (const [dx, dy] of DIRS) {
      if (hole(tx + dx, ty + dy) || solid(tx + dx, ty + dy)) continue;
      const ax = tx * TILE + (dx === 1 ? TILE : 0);
      const ay = ty * TILE + (dy === 1 ? TILE : 0);
      const ux = dy !== 0 ? 1 : 0;
      const uy = dx !== 0 ? 1 : 0;
      pc.beginPath();
      pc.moveTo(ax, ay);
      for (let d = 0; d <= TILE; d += rng.range(3, 6)) {
        const out = rng.range(0, isVoid ? 4.5 : 4);
        pc.lineTo(ax + ux * Math.min(d, TILE) + dx * out, ay + uy * Math.min(d, TILE) + dy * out);
      }
      pc.lineTo(ax + ux * TILE, ay + uy * TILE);
      pc.closePath();
      pc.fill();
    }
  }
  // a soft glow just outside the edge, under the dark contact ring (D174)
  if (isVoid && style.voidGlow) {
    const g = silhouette(P.canvas, 4, style.voidGlow);
    ctx.globalAlpha = 0.28;
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, -3], [-3, 3], [3, 3]] as const) ctx.drawImage(g, dx, dy);
    ctx.globalAlpha = 1;
  }
  // dark contact ring around the rim
  ctx.globalAlpha = 0.75;
  for (const [dx, dy] of [
    [-1.5, -1.5],
    [1.5, -1.5],
    [-1.5, 1.5],
    [1.5, 1.5],
  ] as const)
    ctx.drawImage(P.canvas, dx, dy);
  ctx.globalAlpha = 1;
  // interior
  const I = scratch(6);
  const ic = I.ctx;
  if (isVoid && sky) ic.drawImage(sky, 0, 0);
  else {
    ic.fillStyle = '#020104';
    ic.fillRect(0, 0, RW, RH);
  }
  const CH = isVoid ? 24 : 30;
  const strip = cliffGradient(cliff, CH + 6);
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    const x = tx * TILE;
    const y = ty * TILE;
    if (!isVoid) {
      // a faint haze at the bottom, darker toward the middle of big pits
      let deep = false;
      if (hole(tx, ty - 1) && hole(tx, ty + 1) && hole(tx - 1, ty) && hole(tx + 1, ty)) deep = true;
      soft(ic, x + 16, y + 22, 24, style.fog, deep ? 0.12 : 0.2);
      if (deep) soft(ic, x + 16, y + 16, 26, '#000000', 0.4);
    } else {
      // the drop darkens close under the platform edges
      for (const [dx, dy] of DIRS) if (!hole(tx + dx, ty + dy)) soft(ic, x + 16 + dx * 16, y + 16 + dy * 16, 20, '#000000', 0.45, dy === 0 ? 0.6 : 1.2, dy === 0 ? 1.2 : 0.6);
    }
    if (!hole(tx, ty - 1)) {
      // the far inner cliff face
      ic.drawImage(strip, x, y - 4, TILE, CH + 6);
      ic.strokeStyle = isVoid ? withAlpha('#9a6aff', 0.25) : 'rgba(0,0,0,0.4)';
      ic.lineWidth = 1;
      ic.beginPath();
      for (const sy of [5, 11, 18]) {
        if (sy > CH - 6) continue;
        ic.moveTo(x, y + sy + rng.range(-1, 1));
        for (let sx = 0; sx <= TILE; sx += 8) ic.lineTo(x + sx, y + sy + rng.range(-1.5, 1.5));
      }
      ic.stroke();
      ic.fillStyle = 'rgba(0,0,0,0.4)';
      for (let k = 0; k < 3; k++) ic.fillRect(x + rng.range(0, TILE), y - 2 + rng.range(0, CH * 0.5), 1.2, rng.range(3, 9));
      ic.fillStyle = withAlpha(shade(cliff, 1.6), 0.6);
      for (let k = 0; k < 4; k++) ic.fillRect(x + rng.range(0, TILE), y + rng.range(-2, CH * 0.35), rng.range(1, 3), 1);
      if (isVoid) {
        // jagged underside of the floating platform, a violet glow beneath it
        ic.fillStyle = shade(cliff, 0.55);
        ic.beginPath();
        ic.moveTo(x, y + CH * 0.55);
        let px = x;
        while (px < x + TILE) {
          const tw = rng.range(4, 8);
          ic.lineTo(px + tw / 2, y + CH * 0.55 + rng.range(5, 14));
          px += tw;
          ic.lineTo(Math.min(px, x + TILE), y + CH * 0.55);
        }
        ic.closePath();
        ic.fill();
        soft(ic, x + 16, y + CH + 6, 20, '#7a2bd6', 0.45, 1.3, 0.55);
      }
    }
    if (!hole(tx - 1, ty) && !solid(tx - 1, ty)) {
      ic.fillStyle = withAlpha(shade(cliff, 0.7), 0.9);
      ic.fillRect(x, y, 4, TILE);
      ic.fillStyle = 'rgba(0,0,0,0.5)';
      ic.fillRect(x + 4, y, 4, TILE);
    }
    if (!hole(tx + 1, ty) && !solid(tx + 1, ty)) {
      ic.fillStyle = 'rgba(0,0,0,0.65)';
      ic.fillRect(x + TILE - 6, y, 6, TILE);
      ic.fillStyle = withAlpha(shade(cliff, 0.45), 0.9);
      ic.fillRect(x + TILE - 2, y, 2, TILE);
    }
  }
  clipTo(ic, P.canvas);
  blit(ctx, I.canvas);
  // a bright line just inside the edge, all the way round (D174)
  if (isVoid && style.voidRim) {
    const hi = silhouette(P.canvas, 4, style.voidRim);
    ctx.globalAlpha = 0.9;
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]] as const) blit(ctx, edgeBand(hi, 1, dx, dy));
    ctx.globalAlpha = 1;
  }
  scratchRegion(null);
  // near lip (the floor edge you would fall from), rubble and cracks on the floor around the hole
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    const x = tx * TILE;
    const y = ty * TILE;
    if (!hole(tx, ty + 1) && !solid(tx, ty + 1)) {
      if (isVoid) {
        soft(ctx, x + 16, y + TILE + 2, 20, '#7a2bd6', 0.45, 1.2, 0.4);
        ctx.fillStyle = '#b06bff';
        ctx.fillRect(x, y + TILE + 1, TILE, 2);
        ctx.fillStyle = withAlpha('#f0e0ff', 0.7);
        ctx.fillRect(x, y + TILE + 1.5, TILE, 0.8);
      } else {
        ctx.fillStyle = withAlpha(shade(pal.floor, 1.7), 0.75);
        ctx.fillRect(x, y + TILE + 1.5, TILE, 1.5);
      }
    }
    for (const [dx, dy] of DIRS) {
      if (hole(tx + dx, ty + dy) || solid(tx + dx, ty + dy)) continue;
      const ex = x + 16 + dx * 16;
      const ey = y + 16 + dy * 16;
      if (rng.chance(0.6)) {
        const t = rng.range(-12, 12);
        crack(ctx, rng, ex + (dy !== 0 ? t : 0) + dx * 3, ey + (dx !== 0 ? t : 0) + dy * 3, rng.range(6, 16), Math.atan2(dy, dx) + rng.range(-0.6, 0.6), 'rgba(0,0,0,0.6)', 1.2, false);
      }
      for (let k = rng.int(0, 2); k > 0; k--) {
        const t = rng.range(-14, 14);
        const out = rng.range(5, 12);
        const rx = ex + (dy !== 0 ? t : 0) + dx * out;
        const ry = ey + (dx !== 0 ? t : 0) + dy * out;
        const rr = rng.range(1.5, 3.5);
        jitterPoly(ctx, rng, rx, ry, rr, 5, 0.3);
        ctx.fillStyle = isVoid ? '#3a2a52' : shade(pal.floor, 0.9 + rng.next() * 0.7);
        ctx.fill();
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  if (kind === 'pit') h.art.pitTiles.push(...list);
  else h.art.voidTiles.push(...list);
}

/** A platform tile that has fallen away (or is about to): drawn on the per-version layer. */
export function drawFallenTile(ctx: CanvasRenderingContext2D, room: Room, tx: number, ty: number, sky: CanvasImageSource, style: RoomStyle): void {
  const x = tx * TILE;
  const y = ty * TILE;
  ctx.drawImage(sky, x, y, TILE, TILE, x, y, TILE, TILE);
  const fallen = (ax: number, ay: number): boolean => {
    const t = room.get(ax, ay);
    return t === T.Void || t === T.Pit;
  };
  const above = room.get(tx, ty - 1);
  if (ty > 0 && !fallen(tx, ty - 1) && above !== T.Wall && above !== T.Door) {
    ctx.drawImage(cliffGradient('#3a2a52', 30), x, y, TILE, 22);
    ctx.fillStyle = withAlpha('#7a2bd6', 0.6);
    ctx.fillRect(x, y + 20, TILE, 2);
  }
  if (!fallen(tx - 1, ty)) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y, 5, TILE);
  }
  if (!fallen(tx + 1, ty)) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x + TILE - 5, y, 5, TILE);
  }
  if (!fallen(tx, ty + 1) && room.get(tx, ty + 1) !== T.Wall) {
    ctx.fillStyle = '#b06bff';
    ctx.fillRect(x, y + TILE, TILE, 2);
  }
  void style;
}

export function drawCrumbling(ctx: CanvasRenderingContext2D, tx: number, ty: number): void {
  const x = tx * TILE;
  const y = ty * TILE;
  ctx.fillStyle = withAlpha('#7a2bd6', 0.2);
  ctx.fillRect(x, y, TILE, TILE);
  ctx.lineCap = 'round';
  for (const [c, wv] of [
    ['#1a0a2a', 3.5],
    ['#d6a8ff', 1.5],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = wv;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 6 + ((tx * 5) % 9));
    ctx.lineTo(x + 15, y + 15);
    ctx.lineTo(x + 29, y + 9 + ((ty * 7) % 11));
    ctx.moveTo(x + 15, y + 15);
    ctx.lineTo(x + 12 + ((tx + ty) % 8), y + 29);
    ctx.stroke();
  }
}

export function isFallenOverlay(room: Room, i: number): boolean {
  const o = room.overlay[i]!;
  return o === OVERLAY.Void || o === OVERLAY.Collapsed;
}

// ------------------------------------------------------------------ grates

export function drawGrates(h: HoleCtx): void {
  const { ctx, tiles } = h;
  const g = (tx: number, ty: number): boolean => tiles.get(tx, ty) === E.Grate;
  const list: number[] = [];
  for (let i = 0; i < tiles.e.length; i++) if (tiles.e[i] === E.Grate) list.push(i);
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    const x = tx * TILE;
    const y = ty * TILE;
    if (!g(tx, ty + 1)) soft(ctx, x + 18, y + TILE + 3, 18, '#000000', 0.55, 1.1, 0.4);
    if (!g(tx + 1, ty)) soft(ctx, x + TILE + 3, y + 18, 14, '#000000', 0.4, 0.4, 1.1);
  }
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    const x = tx * TILE;
    const y = ty * TILE;
    const front = !g(tx, ty + 1);
    const fh = front ? 6 : 0;
    // slots with water glinting below, bars on top
    ctx.fillStyle = '#0a100e';
    ctx.fillRect(x, y, TILE, TILE - fh);
    soft(ctx, x + 16, y + 14, 14, '#2a6a6a', 0.25);
    ctx.fillStyle = '#5e5e54';
    for (let k = 2; k < TILE; k += 6) ctx.fillRect(x + k, y, 3, TILE - fh);
    ctx.fillStyle = 'rgba(255,255,240,0.18)';
    for (let k = 2; k < TILE; k += 6) ctx.fillRect(x + k, y, 1, TILE - fh);
    ctx.fillStyle = '#6e6e62';
    ctx.fillRect(x, y + (TILE - fh) / 2 - 1.5, TILE, 3);
    // frame on the outer edges
    ctx.fillStyle = '#76766a';
    if (!g(tx, ty - 1)) ctx.fillRect(x, y, TILE, 3);
    if (!g(tx - 1, ty)) ctx.fillRect(x, y, 3, TILE - fh);
    if (!g(tx + 1, ty)) ctx.fillRect(x + TILE - 3, y, 3, TILE - fh);
    if (front) {
      ctx.fillStyle = '#2e2e28';
      ctx.fillRect(x, y + TILE - fh, TILE, fh);
      ctx.fillStyle = '#8a8a7c';
      ctx.fillRect(x, y + TILE - fh, TILE, 1);
      ctx.fillStyle = '#9a9a8a';
      for (const rx of [x + 5, x + 16, x + 27]) ctx.fillRect(rx - 1, y + TILE - fh + 2.5, 2, 2);
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (!g(tx, ty - 1)) {
      ctx.moveTo(x, y + 0.5);
      ctx.lineTo(x + TILE, y + 0.5);
    }
    if (!g(tx, ty + 1)) {
      ctx.moveTo(x, y + TILE - 0.5);
      ctx.lineTo(x + TILE, y + TILE - 0.5);
    }
    if (!g(tx - 1, ty)) {
      ctx.moveTo(x + 0.5, y);
      ctx.lineTo(x + 0.5, y + TILE);
    }
    if (!g(tx + 1, ty)) {
      ctx.moveTo(x + TILE - 0.5, y);
      ctx.lineTo(x + TILE - 0.5, y + TILE);
    }
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ hazard floors

interface HazLook {
  family: 'liquid' | 'molten' | 'ice' | 'thorns' | 'crumble' | 'moss';
  deep: string;
  mid: string;
  hi: string;
  /** glow color for the per-frame pulse (molten, crumble, moss, glowing liquids) */
  glow?: string;
}

export function hazardLook(kind: string, style: RoomStyle, pal: Palette): HazLook {
  switch (kind) {
    case 'water':
      return style.id === 'sewers' ? { family: 'liquid', deep: '#0d1a12', mid: '#24402c', hi: '#9ac080' } : { family: 'liquid', deep: '#0b1e24', mid: '#1e4448', hi: '#9ad0c8' };
    case 'deepWater':
      return { family: 'liquid', deep: '#081820', mid: '#14303a', hi: '#8fc8d0' };
    case 'sewage':
    case 'sludge':
      return { family: 'liquid', deep: '#1a1e0e', mid: '#34401a', hi: '#a0b060' };
    case 'acid':
      return { family: 'liquid', deep: '#3a5a0a', mid: '#7ab020', hi: '#e0ff80', glow: '#a6e040' };
    case 'poison':
    case 'poisonCloud':
    case 'bog':
      return { family: 'liquid', deep: '#16280e', mid: '#3a6a1c', hi: '#a8f060', glow: '#6a9a30' };
    case 'oil':
      return { family: 'liquid', deep: '#0a0806', mid: '#1e1a16', hi: '#8a8070' };
    case 'mud':
      return { family: 'liquid', deep: '#2a1c0e', mid: '#4a3418', hi: '#8a6a40' };
    case 'lava':
      return { family: 'molten', deep: '#8a1a08', mid: '#e8500e', hi: '#ffd060', glow: '#ff6a10' };
    case 'slag':
      return { family: 'molten', deep: '#5a1a08', mid: '#c84a10', hi: '#ffb050', glow: '#ff5a1a' };
    case 'ice':
      return { family: 'ice', deep: '#6aa0c4', mid: '#a8d8f0', hi: '#f4fbff' };
    case 'thorns':
    case 'roots':
      return { family: 'thorns', deep: '#1c1c0c', mid: '#2e3e16', hi: '#c8c090' };
    case 'void':
    case 'voidEdge':
      return { family: 'crumble', deep: '#0c0614', mid: '#1c1028', hi: '#d6a8ff', glow: '#7a2bd6' };
    case 'emberMoss':
      return { family: 'moss', deep: '#1e1a0a', mid: '#3a3a14', hi: '#ffb050', glow: '#ff8a2a' };
    case 'spores':
      return { family: 'moss', deep: '#1e1428', mid: '#3a2a4a', hi: '#c58cff', glow: '#c58cff' };
    default:
      return { family: 'liquid', deep: shade(pal.hazard, 0.7), mid: pal.hazard, hi: shade(pal.hazard, 1.5) };
  }
}

export function drawHazards(h: HoleCtx, kind: string): void {
  const { ctx, tiles, style, pal, art } = h;
  const list: number[] = [];
  for (let i = 0; i < tiles.e.length; i++) if (tiles.e[i] === E.Hazard) list.push(i);
  art.hazardKind = kind;
  art.hazardTiles = list;
  if (!list.length) return;
  const L = hazardLook(kind, style, pal);
  art.hazardFamily = L.family;
  art.hazardHi = L.hi;
  const hz = (tx: number, ty: number): boolean => tiles.get(tx, ty) === E.Hazard;
  const masked = L.family !== 'thorns' && L.family !== 'crumble';
  const bounds = tileBounds(list, 10);
  scratchRegion(bounds);
  const T6 = masked ? scratch(6) : null;
  const tc = T6 ? T6.ctx : ctx;
  // the surface, tile by tile (painted a little past each tile so rounded shores have texture)
  if (T6) {
    tc.fillStyle = L.deep;
    for (const i of list) tc.fillRect((i % ROOM_W) * TILE - 8, Math.floor(i / ROOM_W) * TILE - 8, TILE + 16, TILE + 16);
  }
  for (const i of list) {
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    const x = tx * TILE;
    const y = ty * TILE;
    const r = new Rng(h.seed ^ Math.imul(i + 31, 2654435761));
    paintHazardTile(tc, r, L, kind, style, x, y, art, tx, ty);
  }
  if (T6) {
    // rounded, wobbly mask
    const M = scratch(5);
    const mc = M.ctx;
    mc.fillStyle = L.deep;
    for (const i of list) mc.fillRect((i % ROOM_W) * TILE, Math.floor(i / ROOM_W) * TILE, TILE, TILE);
    const r = new Rng(h.seed ^ 0x7a7a);
    const round = L.family === 'ice' ? 6 : 12;
    for (const i of list) {
      const tx = i % ROOM_W;
      const ty = Math.floor(i / ROOM_W);
      const open = (dx: number, dy: number): boolean => !hz(tx + dx, ty + dy) && !tiles.wall(tx + dx, ty + dy);
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        if (!open(sx, 0) || !open(0, sy) || hz(tx + sx, ty + sy)) continue;
        const cx = tx * TILE + (sx > 0 ? TILE : 0);
        const cy = ty * TILE + (sy > 0 ? TILE : 0);
        mc.globalCompositeOperation = 'destination-out';
        mc.fillRect(sx > 0 ? cx - round : cx, sy > 0 ? cy - round : cy, round, round);
        mc.globalCompositeOperation = 'source-over';
        mc.beginPath();
        mc.arc(cx - sx * round, cy - sy * round, round, 0, Math.PI * 2);
        mc.fill();
      }
      if (L.family === 'ice') continue;
      for (const [dx, dy] of DIRS) {
        if (!open(dx, dy)) continue;
        const ex = tx * TILE + 16 + dx * 16;
        const ey = ty * TILE + 16 + dy * 16;
        const rr = r.range(7, 11);
        const t = r.range(-8, 8);
        const bulge = r.range(-2.5, 3);
        mc.globalCompositeOperation = bulge < 0 ? 'destination-out' : 'source-over';
        mc.beginPath();
        if (bulge < 0) mc.arc(ex + dy * t + dx * (rr + bulge), ey + dx * t + dy * (rr + bulge), rr, 0, Math.PI * 2);
        else mc.arc(ex + dy * t - dx * (rr - bulge), ey + dx * t - dy * (rr - bulge), rr, 0, Math.PI * 2);
        mc.fill();
      }
      mc.globalCompositeOperation = 'source-over';
    }
    // a damp (or scorched, or frosted) ring on the floor around the pool
    ctx.globalAlpha = L.family === 'ice' ? 0.25 : 0.4;
    const ring = L.family === 'ice' ? silhouette(M.canvas, 1, '#e8f4ff') : M.canvas;
    for (const [dx, dy] of [
      [-2.5, -2.5],
      [2.5, -2.5],
      [-2.5, 2.5],
      [2.5, 2.5],
    ] as const)
      ctx.drawImage(ring, dx, dy);
    ctx.globalAlpha = 1;
    // the surface inside the shore (flooded crypt floors stay a little see-through)
    clipTo(tc, M.canvas);
    ctx.globalAlpha = kind === 'water' && (style.id === 'crypt' || style.id === 'hall') ? 0.82 : 1;
    blit(ctx, T6!.canvas);
    ctx.globalAlpha = 1;
    // shores: shallows and a bright rim (molten: a black crust and a white-hot line)
    const Mhi = silhouette(M.canvas, 4, L.family === 'molten' ? '#1a0806' : L.hi);
    const shallow = L.family === 'molten' ? 0.85 : L.family === 'ice' ? 0.35 : 0.2;
    for (const d of [3, -3] as const) {
      ctx.globalAlpha = shallow;
      blit(ctx, edgeBand(Mhi, 1, d, d));
    }
    const Mline = L.family === 'molten' ? silhouette(M.canvas, 4, L.hi) : Mhi;
    const line = L.family === 'molten' ? 0.9 : L.family === 'ice' ? 0.8 : 0.5;
    for (const d of [1.5, -1.5] as const) {
      ctx.globalAlpha = line;
      if (L.family === 'molten') {
        // the hot line sits just inside the crust
        const b = edgeBand(Mline, 1, d * 3, d * 3);
        const c2 = scratch(3);
        c2.ctx.drawImage(b, 0, 0);
        c2.ctx.globalCompositeOperation = 'destination-out';
        c2.ctx.drawImage(edgeBand(Mline, 2, d * 2, d * 2), 0, 0);
        c2.ctx.globalCompositeOperation = 'source-over';
        blit(ctx, c2.canvas);
      } else blit(ctx, edgeBand(Mline, 1, d, d));
    }
    ctx.globalAlpha = 1;
  }
  scratchRegion(null);
  // the glow layer for the per-frame pulse
  if (L.glow) {
    const [x0, y0, w0, h0] = tileBounds(list, 16);
    const { canvas, ctx: gc } = offscreen(w0, h0);
    for (const i of list) {
      const cx = (i % ROOM_W) * TILE + 16 - x0;
      const cy = Math.floor(i / ROOM_W) * TILE + 16 - y0;
      soft(gc, cx, cy, L.family === 'crumble' ? 18 : 24, L.glow, L.family === 'crumble' ? 0.35 : L.family === 'liquid' ? 0.25 : 0.5);
    }
    art.hazardGlow = { canvas, x: x0, y: y0 };
  }
}

function paintHazardTile(c: CanvasRenderingContext2D, r: Rng, L: HazLook, kind: string, style: RoomStyle, x: number, y: number, art: RoomArt, tx: number, ty: number): void {
  switch (L.family) {
    case 'liquid': {
      soft(c, x + r.range(6, 26), y + r.range(6, 26), r.range(12, 20), L.mid, 0.55);
      if (r.chance(0.4)) soft(c, x + r.range(4, 28), y + r.range(4, 28), r.range(10, 16), '#000000', 0.25);
      c.fillStyle = withAlpha(L.hi, 0.25);
      for (let k = r.int(0, 2); k > 0; k--) c.fillRect(x + r.range(2, 22), y + r.range(3, 29), r.range(5, 11), 1);
      if (kind === 'oil')
        for (const col of ['#2aa198', '#b06bff', '#e6b84a']) {
          c.strokeStyle = withAlpha(col, 0.2);
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(x + r.range(8, 24), y + r.range(8, 24), r.range(5, 11), r.range(0, 3), r.range(3, 6));
          c.stroke();
        }
      if ((style.id === 'sewers' || L.glow) && r.chance(0.15)) {
        // floating scum
        c.fillStyle = withAlpha(L.glow ? L.hi : '#5a7a2a', 0.6);
        c.beginPath();
        c.ellipse(x + r.range(6, 26), y + r.range(6, 26), r.range(2, 5), r.range(1.5, 3), 0, 0, Math.PI * 2);
        c.fill();
      }
      break;
    }
    case 'molten': {
      // molten base with bright flowing patches and a few cooling crust plates
      c.fillStyle = L.mid;
      c.fillRect(x - 2, y - 2, TILE + 4, TILE + 4);
      soft(c, x + r.range(4, 28), y + r.range(4, 28), r.range(14, 22), '#ff8a20', 0.7);
      soft(c, x + r.range(6, 26), y + r.range(6, 26), r.range(7, 12), L.hi, 0.75);
      soft(c, x + r.range(2, 30), y + r.range(2, 30), r.range(10, 16), L.deep, 0.45);
      if (r.chance(0.45)) {
        jitterPoly(c, r, x + r.range(6, 26), y + r.range(6, 26), r.range(4, 8), 7, 0.35);
        c.fillStyle = kind === 'slag' ? '#2a0e06' : '#3a1008';
        c.fill();
        c.strokeStyle = withAlpha(L.hi, 0.75);
        c.lineWidth = 1.2;
        c.stroke();
      }
      c.strokeStyle = withAlpha('#fff2b0', 0.45);
      c.lineWidth = 1;
      c.beginPath();
      const sx = x + r.range(0, 16);
      const sy = y + r.range(4, 28);
      c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + 8, sy + r.range(-6, 6), sx + r.range(12, 20), sy + r.range(-4, 4));
      c.stroke();
      if ((tx * 7 + ty * 3) % 5 === 0) art.lights.push({ x: x + 16, y: y + 16, r: 90, color: L.glow ?? '#ff6a10', a: 0.5, flicker: 2, phase: r.next() * 10 });
      break;
    }
    case 'ice': {
      c.fillStyle = L.mid;
      c.fillRect(x - 2, y - 2, TILE + 4, TILE + 4);
      soft(c, x + r.range(8, 24), y + r.range(8, 24), 16, L.deep, 0.35);
      c.strokeStyle = withAlpha(L.hi, 0.75);
      c.lineWidth = 2;
      c.beginPath();
      const o = r.range(-8, 8);
      c.moveTo(x + 4 + o, y + 28);
      c.lineTo(x + 18 + o, y + 6);
      c.stroke();
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 14 + o, y + 28);
      c.lineTo(x + 22 + o, y + 15);
      c.stroke();
      if (r.chance(0.4)) crack(c, r, x + r.range(4, 28), y + r.range(4, 28), r.range(8, 18), r.range(0, Math.PI * 2), withAlpha('#ffffff', 0.7), 0.8);
      break;
    }
    case 'thorns': {
      c.fillStyle = L.deep;
      c.globalAlpha = 0.85;
      c.fillRect(x, y, TILE, TILE);
      c.globalAlpha = 1;
      for (let k = 0; k < 3; k++) {
        const sx = x + r.range(-4, 36);
        const sy = y + r.range(-4, 36);
        const a = r.range(0, Math.PI * 2);
        const ex = sx + Math.cos(a) * 26;
        const ey = sy + Math.sin(a) * 26;
        const qx = (sx + ex) / 2 + r.range(-10, 10);
        const qy = (sy + ey) / 2 + r.range(-10, 10);
        c.lineCap = 'round';
        c.strokeStyle = OUTLINE;
        c.lineWidth = 4.5;
        c.beginPath();
        c.moveTo(sx, sy);
        c.quadraticCurveTo(qx, qy, ex, ey);
        c.stroke();
        c.strokeStyle = r.chance(0.5) ? '#3a4a18' : '#4a3a18';
        c.lineWidth = 2.5;
        c.stroke();
        c.fillStyle = L.hi;
        for (let t = 0.15; t < 1; t += 0.22) {
          const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * qx + t * t * ex;
          const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * qy + t * t * ey;
          const side = r.chance(0.5) ? 1 : -1;
          c.beginPath();
          c.moveTo(px - 1.5, py);
          c.lineTo(px + 1.5, py);
          c.lineTo(px + side, py - 4.5 * side);
          c.closePath();
          c.fill();
        }
      }
      break;
    }
    case 'crumble': {
      // the floor is already obsidian: crack it to pieces, violet light leaking through
      soft(c, x + 16, y + 16, 22, '#7a2bd6', 0.14);
      for (let k = 0; k < 2; k++) {
        const sx = x + r.range(2, 30);
        const sy = y + r.range(2, 30);
        const a = r.range(0, Math.PI * 2);
        const seed = r.nextU32();
        const len = r.range(8, 16);
        for (const [col, wv] of [
          ['#030106', 3],
          ['#9a4af0', 1.2],
        ] as const)
          crack(c, new Rng(seed), sx, sy, len, a, col, wv);
      }
      if (r.chance(0.3)) {
        jitterPoly(c, r, x + r.range(8, 24), y + r.range(8, 24), r.range(2.5, 5), 5, 0.35);
        c.fillStyle = '#05020a';
        c.fill();
        c.strokeStyle = '#b06bff';
        c.lineWidth = 1;
        c.stroke();
      }
      break;
    }
    case 'moss': {
      for (let k = 0; k < 18; k++) {
        c.fillStyle = r.chance(0.5) ? L.mid : shade(L.mid, 1.3);
        c.beginPath();
        c.arc(x + r.range(0, TILE), y + r.range(0, TILE), r.range(1.5, 3.5), 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = L.hi;
      for (let k = 0; k < 5; k++) c.fillRect(x + r.range(2, 30), y + r.range(2, 30), 1.6, 1.6);
      break;
    }
  }
}
