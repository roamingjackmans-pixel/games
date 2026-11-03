// Walls drawn by mass (any '#' shape, not just the border): a lit top face, a darker front face on every edge that
// faces the camera (south), an outline that follows the shape, organic bumpy edges for caves / tree lines / crags,
// masonry, brick, plates or brass for built zones. Plus wall decorations, pillars and doorways. Pre-rendered.
import { OUTLINE, shade, withAlpha } from '../engine/draw/parts';
import { Rng } from '../engine/rng';
import { ROOM_H, ROOM_W, TILE, type Side } from '../game/room';
import type { Palette } from '../game/types';
import { candles, fungusPatch, gearPath, rivet, root } from './floors';
import { E, clipTo, crack, edgeBand, jitterPoly, scratch, silhouette, soft, type RoomArt, type RoomStyle, type Tiles } from './roomStyle';

export interface WallCtx {
  ctx: CanvasRenderingContext2D;
  rng: Rng;
  tiles: Tiles;
  pal: Palette;
  style: RoomStyle;
  art: RoomArt;
  seed: number;
}

/** Deterministic per-cell stream (textures stay continuous across tiles). */
function cell(seed: number, a: number, b: number): Rng {
  return new Rng((seed ^ Math.imul(a + 1013, 73856093) ^ Math.imul(b + 7919, 19349663)) >>> 0);
}

// ------------------------------------------------------------------ the mass

export function drawWalls(w: WallCtx): void {
  const { ctx, tiles, style } = w;
  const FH = style.frontH;
  // the mass, drawn black: it is the clip mask, the shadow and the outline at once
  const m = scratch(0);
  buildMask(m.ctx, w);
  const M = m.canvas;
  // drop shadow on the floor (south and a little east)
  for (const [dx, dy, a] of [
    [0, 5, 0.3],
    [2, 11, 0.18],
    [4, 18, 0.1],
  ] as const) {
    ctx.globalAlpha = a;
    ctx.drawImage(M, dx, dy);
  }
  ctx.globalAlpha = 1;
  // outline ring (a 2 px dilation)
  for (const [dx, dy] of [
    [-2, -2],
    [2, -2],
    [-2, 2],
    [2, 2],
  ] as const)
    ctx.drawImage(M, dx, dy);
  // top face
  const tx = scratch(2);
  paintTop(tx.ctx, w);
  clipTo(tx.ctx, M);
  ctx.drawImage(tx.canvas, 0, 0);
  // light from the top-left: a lit rim on the back and west edges, a darker east bevel
  const Mhi = silhouette(M, 8, style.topHi);
  ctx.globalAlpha = 0.45;
  ctx.drawImage(edgeBand(Mhi, 1, -2, -2), 0, 0);
  ctx.globalAlpha = 0.3;
  ctx.drawImage(edgeBand(M, 1, 3, 0), 0, 0);
  ctx.globalAlpha = 1;
  // front faces: the part of the mass whose pixel FH below is floor
  const F = edgeBand(Mhi, 3, 0, FH);
  const fx = scratch(2);
  paintFront(fx.ctx, w);
  clipTo(fx.ctx, F);
  ctx.drawImage(fx.canvas, 0, 0);
  // the brink where the top face turns down into the front face
  ctx.globalAlpha = 0.75;
  ctx.drawImage(edgeBand(F, 4, 0, -2), 0, 0);
  ctx.globalAlpha = 1;
  void tiles;
}

function buildMask(c: CanvasRenderingContext2D, w: WallCtx): void {
  const { tiles, style } = w;
  const rng = new Rng(w.seed ^ 0x5eed);
  c.fillStyle = OUTLINE;
  for (let ty = 0; ty < ROOM_H; ty++) for (let tx = 0; tx < ROOM_W; tx++) if (tiles.wall(tx, ty)) c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
  if (!style.organic) return;
  const bulgeMax = style.id === 'forest' ? 6 : 4.5;
  const edges: [number, number, number, number][] = []; // edge midpoint x, y, outward normal nx, ny
  for (let ty = 0; ty < ROOM_H; ty++)
    for (let tx = 0; tx < ROOM_W; tx++) {
      if (!tiles.wall(tx, ty)) continue;
      for (const [dx, dy] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as const) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
        const v = tiles.get(nx, ny);
        if (v === E.Wall || v === E.Door) continue;
        if (tiles.nearDoor(tx, ty, 1)) continue;
        edges.push([tx * TILE + 16 + dx * 16, ty * TILE + 16 + dy * 16, dx, dy]);
      }
    }
  // bites into the wall, then bulges out into the room
  c.globalCompositeOperation = 'destination-out';
  for (const [ex, ey, nx, ny] of edges) {
    if (!rng.chance(0.55)) continue;
    const r = rng.range(6, 11);
    const t = rng.range(-10, 10);
    const bite = rng.range(1.5, 4.5);
    c.beginPath();
    c.arc(ex + ny * t + nx * (r - bite), ey + nx * t + ny * (r - bite), r, 0, Math.PI * 2);
    c.fill();
  }
  c.globalCompositeOperation = 'source-over';
  for (const [ex, ey, nx, ny] of edges) {
    for (let k = rng.int(1, 2); k > 0; k--) {
      const r = rng.range(7, 13);
      const t = rng.range(-12, 12);
      const bulge = rng.range(0.5, bulgeMax);
      c.beginPath();
      c.arc(ex + ny * t - nx * (r - bulge), ey + nx * t - ny * (r - bulge), r, 0, Math.PI * 2);
      c.fill();
    }
  }
  // round the convex corners
  for (let ty = 0; ty < ROOM_H; ty++)
    for (let tx = 0; tx < ROOM_W; tx++) {
      if (!tiles.wall(tx, ty) || tiles.nearDoor(tx, ty, 1)) continue;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        if (tiles.wall(tx + sx, ty) || tiles.wall(tx, ty + sy) || tiles.wall(tx + sx, ty + sy)) continue;
        const cx = tx * TILE + (sx > 0 ? TILE : 0);
        const cy = ty * TILE + (sy > 0 ? TILE : 0);
        const r = 10;
        c.globalCompositeOperation = 'destination-out';
        c.fillRect(sx > 0 ? cx - r : cx, sy > 0 ? cy - r : cy, r, r);
        c.globalCompositeOperation = 'source-over';
        c.beginPath();
        c.arc(cx - sx * r, cy - sy * r, r, 0, Math.PI * 2);
        c.fill();
      }
    }
}

/** Cells (32 px) a wall texture must cover: every wall tile and a margin for organic bulges. */
function wallCells(t: Tiles): [number, number][] {
  const out: [number, number][] = [];
  for (let ty = 0; ty < ROOM_H; ty++)
    for (let tx = 0; tx < ROOM_W; tx++) {
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) if (t.wall(tx + dx, ty + dy) && tx + dx >= 0 && ty + dy >= 0 && tx + dx < ROOM_W && ty + dy < ROOM_H) near = true;
      if (near) out.push([tx, ty]);
    }
  return out;
}

// ------------------------------------------------------------------ top faces

function paintTop(c: CanvasRenderingContext2D, w: WallCtx): void {
  const { style, tiles, seed } = w;
  const cells = wallCells(tiles);
  c.fillStyle = shade(style.top, 0.5);
  for (const [tx, ty] of cells) c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
  switch (style.id) {
    case 'caverns':
    case 'abyss':
      return rockTop(c, w, cells);
    case 'forest':
      return canopyTop(c, w, cells);
    case 'forge':
    case 'citadel':
      return plateTop(c, w, cells);
    default:
      return blockTop(c, style, seed, cells, style.id === 'sewers' ? 10 : 16, style.id === 'sewers' ? [20] : style.id === 'reliquary' ? [32, 48] : [24, 32, 40]);
  }
}

function blockTop(c: CanvasRenderingContext2D, style: RoomStyle, seed: number, cells: [number, number][], bh: number, widths: number[]): void {
  const done = new Set<number>();
  const crypt = style.id === 'crypt';
  const snow = style.id === 'reliquary';
  const slime = style.id === 'sewers';
  for (const [tx, ty] of cells) {
    const x0 = tx * TILE;
    const y0 = ty * TILE;
    for (let row = Math.floor(y0 / bh); row * bh < y0 + TILE; row++) {
      const rr = cell(seed, row, -1);
      const bw = widths[rr.int(0, widths.length - 1)]!;
      const off = -rr.int(0, bw - 1);
      for (let k = Math.floor((x0 - off) / bw); off + k * bw < x0 + TILE; k++) {
        const key = row * 1000 + k + 500;
        if (done.has(key)) continue;
        done.add(key);
        const r = cell(seed, row, k);
        const x = off + k * bw;
        const y = row * bh;
        c.fillStyle = shade(style.top, 0.8 + r.next() * 0.34);
        c.fillRect(x + 1, y + 1, bw - 2, bh - 2);
        c.fillStyle = withAlpha(style.topHi, 0.32);
        c.fillRect(x + 1, y + 1, bw - 2, 1.5);
        c.fillStyle = 'rgba(0,0,0,0.3)';
        c.fillRect(x + 1, y + bh - 2.5, bw - 2, 1.5);
        if (r.chance(0.08)) crack(c, r, x + r.range(3, bw - 3), y + 3, r.range(5, 12), r.range(0, Math.PI * 2), 'rgba(0,0,0,0.4)', 1, false);
        if (crypt && r.chance(0.2)) {
          for (let d = 0; d < 10; d++) {
            c.fillStyle = r.chance(0.5) ? '#3d5826' : '#557a34';
            c.fillRect(x + r.range(0, bw), y + r.range(0, bh), r.range(1, 2.5), r.range(1, 2.5));
          }
        }
        if (slime && r.chance(0.2)) soft(c, x + bw / 2, y + bh / 2, 10, '#3a6a22', 0.35);
        if (snow && r.chance(0.55)) soft(c, x + r.range(0, bw), y + r.range(0, bh), r.range(8, 16), '#f4f8ff', 0.3 + r.next() * 0.35);
      }
    }
  }
}

function rockTop(c: CanvasRenderingContext2D, w: WallCtx, cells: [number, number][]): void {
  const { style, seed } = w;
  const abyss = style.id === 'abyss';
  c.fillStyle = style.top;
  for (const [tx, ty] of cells) c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
  for (const [tx, ty] of cells) {
    const r = cell(seed, tx, ty);
    const x0 = tx * TILE;
    const y0 = ty * TILE;
    for (let k = 0; k < 3; k++) {
      const x = x0 + r.range(0, TILE);
      const y = y0 + r.range(0, TILE);
      const rad = r.range(8, 16);
      jitterPoly(c, r, x, y, rad, r.int(5, 7), 0.3);
      c.fillStyle = shade(style.top, 0.72 + r.next() * 0.5);
      c.fill();
      c.strokeStyle = abyss ? withAlpha('#9a5aff', 0.22) : 'rgba(0,0,0,0.35)';
      c.lineWidth = 1.2;
      c.stroke();
      // a lit facet on the upper left
      c.fillStyle = withAlpha(style.topHi, 0.28);
      c.beginPath();
      c.ellipse(x - rad * 0.3, y - rad * 0.35, rad * 0.5, rad * 0.32, -0.5, 0, Math.PI * 2);
      c.fill();
    }
    if (r.chance(0.12)) crack(c, r, x0 + r.range(4, 28), y0 + r.range(4, 28), r.range(8, 18), r.range(0, Math.PI * 2), abyss ? '#b06bff' : 'rgba(0,0,0,0.45)', 1.2, false);
    if (!abyss && r.chance(0.15)) {
      c.fillStyle = r.chance(0.5) ? '#5fd3c0' : '#c58cff';
      for (let d = 0; d < 3; d++) c.fillRect(x0 + r.range(2, 30), y0 + r.range(2, 30), 1.5, 1.5);
    }
  }
}

const CANOPY = ['#1f3d22', '#24482a', '#2a5230', '#1a3420', '#2e5a2c'];
const AUTUMN = ['#c8621f', '#e6b84a', '#a0501a'];

function canopyTop(c: CanvasRenderingContext2D, w: WallCtx, cells: [number, number][]): void {
  const { seed } = w;
  c.fillStyle = '#10220f';
  for (const [tx, ty] of cells) c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
  for (const [tx, ty] of cells) {
    const r = cell(seed, tx, ty);
    const x0 = tx * TILE;
    const y0 = ty * TILE;
    for (let k = 0; k < 5; k++) {
      const x = x0 + r.range(-2, TILE + 2);
      const y = y0 + r.range(-2, TILE + 2);
      const rad = r.range(8, 15);
      c.fillStyle = '#0c1a0b';
      c.beginPath();
      c.arc(x + 1.5, y + 2, rad, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = CANOPY[r.int(0, CANOPY.length - 1)]!;
      c.beginPath();
      c.arc(x, y, rad, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = withAlpha('#4a8040', 0.45);
      c.beginPath();
      c.arc(x - rad * 0.3, y - rad * 0.35, rad * 0.55, 0, Math.PI * 2);
      c.fill();
    }
    // leaf texture and a few autumn leaves
    for (let d = 0; d < 8; d++) {
      c.fillStyle = r.chance(0.7) ? withAlpha('#5a9a48', 0.5) : AUTUMN[r.int(0, 2)]!;
      c.fillRect(x0 + r.range(0, TILE), y0 + r.range(0, TILE), 2, 1.5);
    }
  }
}

function plateTop(c: CanvasRenderingContext2D, w: WallCtx, cells: [number, number][]): void {
  const { style, seed } = w;
  const brass = style.id === 'citadel';
  for (const [tx, ty] of cells) {
    const r = cell(seed, tx, ty);
    const x = tx * TILE;
    const y = ty * TILE;
    const copper = brass && r.chance(0.3);
    c.fillStyle = copper ? shade('#6a4028', 0.85 + r.next() * 0.3) : shade(style.top, 0.8 + r.next() * 0.35);
    c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    c.fillStyle = withAlpha(style.topHi, brass ? 0.45 : 0.25);
    c.fillRect(x + 1, y + 1, TILE - 2, 1.5);
    c.fillRect(x + 1, y + 1, 1.5, TILE - 2);
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(x + 1, y + TILE - 2.5, TILE - 2, 1.5);
    c.fillRect(x + TILE - 2.5, y + 1, 1.5, TILE - 2);
    if (brass) {
      c.strokeStyle = 'rgba(0,0,0,0.3)';
      c.lineWidth = 1;
      c.strokeRect(x + 6.5, y + 6.5, TILE - 13, TILE - 13);
      if (r.chance(0.1)) {
        c.fillStyle = '#2aa198';
        c.fillRect(x + 15, y + 15, 2, 2);
      }
    } else {
      if (r.chance(0.3)) soft(c, x + 16, y + 16, 14, '#5a2a1a', 0.3);
      if (r.chance(0.07)) crack(c, r, x + r.range(6, 26), y + r.range(6, 26), r.range(8, 16), r.range(0, Math.PI * 2), '#ff6a10', 1.2, false);
    }
    for (const [rx, ry] of [
      [x + 4.5, y + 4.5],
      [x + TILE - 4.5, y + 4.5],
      [x + 4.5, y + TILE - 4.5],
      [x + TILE - 4.5, y + TILE - 4.5],
    ] as const)
      rivet(c, rx, ry, 1.5, brass ? '#c8a050' : '#6a5a52');
  }
}

// ------------------------------------------------------------------ front faces

/** Wall tiles whose south neighbour is not wall (they show a front face). */
function frontTiles(t: Tiles): [number, number][] {
  const out: [number, number][] = [];
  for (let ty = 0; ty < ROOM_H - 1; ty++) for (let tx = 0; tx < ROOM_W; tx++) if (t.wall(tx, ty) && !t.wall(tx, ty + 1)) out.push([tx, ty]);
  return out;
}

let gradCache: { h: number; canvas: CanvasImageSource } | null = null;
function frontGradient(h: number): CanvasImageSource {
  if (gradCache?.h === h) return gradCache.canvas;
  const { canvas, ctx } = scratchStrip(48, h + 10);
  const g = ctx.createLinearGradient(0, 0, 0, h + 10);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 48, h + 10);
  gradCache = { h, canvas };
  return canvas;
}

function scratchStrip(w: number, h: number): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D } {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h);
    return { canvas, ctx: canvas.getContext('2d') as unknown as CanvasRenderingContext2D };
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d')! };
}

function paintFront(c: CanvasRenderingContext2D, w: WallCtx): void {
  const { style, tiles, seed } = w;
  const FH = style.frontH;
  const fronts = frontTiles(tiles);
  for (const [tx, ty] of fronts) {
    const x0 = tx * TILE - 8;
    const y0 = ty * TILE + TILE - FH - 6;
    const yb = ty * TILE + TILE; // the face's bottom (the floor line)
    const top = yb - FH;
    c.fillStyle = style.front;
    c.fillRect(x0, y0, TILE + 16, FH + 14);
    const r = cell(seed, tx, ty + 500);
    switch (style.id) {
      case 'forest':
        trunks(c, r, x0, top, yb);
        break;
      case 'caverns':
      case 'abyss':
        strata(c, r, style, x0, top, yb);
        break;
      case 'forge':
      case 'citadel':
        plateFront(c, r, style, x0, top, yb, tx);
        break;
      default:
        courses(c, seed, style, x0, top, yb);
        if (style.id === 'crypt' || style.id === 'sewers') {
          for (let d = r.int(0, 2); d > 0; d--) {
            const dx = x0 + 8 + r.range(2, 30);
            c.fillStyle = style.id === 'crypt' ? '#4f6b32' : '#3a5a26';
            c.fillRect(dx, top, 2, r.range(3, FH - 3));
            c.beginPath();
            c.arc(dx + 1, top + r.range(4, FH - 4), 1.6, 0, Math.PI * 2);
            c.fill();
          }
          if (style.id === 'sewers' && r.chance(0.4)) soft(c, x0 + r.range(10, 38), top + FH / 2, 8, '#000000', 0.4, 0.5, 1.6);
        }
        if (style.id === 'reliquary') {
          c.fillStyle = '#d4af37';
          c.fillRect(x0, top + 1, TILE + 16, 2);
          c.fillStyle = 'rgba(255,240,180,0.6)';
          c.fillRect(x0, top + 1, TILE + 16, 0.8);
        }
    }
    c.drawImage(frontGradient(FH), x0, top, TILE + 16, FH + 8);
  }
}

function courses(c: CanvasRenderingContext2D, seed: number, style: RoomStyle, x0: number, top: number, yb: number): void {
  const ch = style.id === 'sewers' ? 4.5 : 6;
  let row = 0;
  for (let y = top; y < yb + 4; y += ch, row++) {
    const rr = cell(seed, Math.round(y), 77);
    const bw = style.id === 'sewers' ? 9 : rr.int(11, 16);
    const off = -rr.int(0, bw);
    for (let x = off + Math.floor((x0 - off) / bw) * bw; x < x0 + TILE + 16; x += bw) {
      const r = cell(seed, x, Math.round(y));
      c.fillStyle = shade(style.front, 0.78 + r.next() * 0.42);
      c.fillRect(x + 0.75, y + 0.75, bw - 1.5, ch - 1.5);
    }
  }
  void row;
}

function strata(c: CanvasRenderingContext2D, r: Rng, style: RoomStyle, x0: number, top: number, yb: number): void {
  const abyss = style.id === 'abyss';
  for (let k = 0; k < 7; k++) {
    const x = x0 + r.range(0, TILE + 16);
    const wv = r.range(2, 7);
    c.fillStyle = shade(style.front, 0.65 + r.next() * 0.6);
    c.fillRect(x, top + r.range(-2, 4), wv, yb - top + 6);
  }
  c.strokeStyle = 'rgba(0,0,0,0.4)';
  c.lineWidth = 1;
  for (let k = 0; k < 2; k++) {
    const y = top + r.range(4, yb - top - 2);
    c.beginPath();
    c.moveTo(x0, y);
    for (let x = x0; x < x0 + TILE + 16; x += 6) c.lineTo(x, y + r.range(-1.5, 1.5));
    c.stroke();
  }
  if (abyss && r.chance(0.35)) {
    const x = x0 + r.range(10, 36);
    c.strokeStyle = '#9a5aff';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, top + 2);
    c.lineTo(x + r.range(-3, 3), top + 8);
    c.lineTo(x + r.range(-2, 4), yb - 2);
    c.stroke();
  }
}

function trunks(c: CanvasRenderingContext2D, r: Rng, x0: number, top: number, yb: number): void {
  c.fillStyle = '#120a04';
  c.fillRect(x0, top - 4, TILE + 16, yb - top + 12);
  let x = x0 + r.range(-4, 4);
  while (x < x0 + TILE + 16) {
    const wv = r.range(7, 13);
    const bark = r.chance(0.5) ? '#3a2814' : '#4a3418';
    // root flare
    c.fillStyle = bark;
    c.beginPath();
    c.moveTo(x - 3, yb + 2);
    c.lineTo(x + 1, yb - 6);
    c.lineTo(x + wv - 1, yb - 6);
    c.lineTo(x + wv + 3, yb + 2);
    c.closePath();
    c.fill();
    c.fillRect(x, top - 4, wv, yb - top);
    c.fillStyle = withAlpha('#7a5a34', 0.6);
    c.fillRect(x + 1, top - 4, 1.5, yb - top);
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(x + wv - 2.5, top - 4, 2, yb - top);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    for (let k = 0; k < 3; k++) c.fillRect(x + r.range(2, wv - 3), top + r.range(0, yb - top - 6), 1, r.range(3, 7));
    if (r.chance(0.25)) {
      c.fillStyle = '#3a5a1e';
      c.fillRect(x + 1, top + r.range(2, 10), wv - 2, 3);
    }
    x += wv + r.range(2, 8);
  }
  // the canopy overhangs the trunks
  for (let k = 0; k < 6; k++) {
    const lx = x0 + r.range(0, TILE + 16);
    const rad = r.range(4, 8);
    c.fillStyle = '#0c1a0b';
    c.beginPath();
    c.arc(lx + 1, top + 1.5, rad, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = CANOPY[r.int(0, CANOPY.length - 1)]!;
    c.beginPath();
    c.arc(lx, top, rad, 0, Math.PI * 2);
    c.fill();
  }
}

function plateFront(c: CanvasRenderingContext2D, r: Rng, style: RoomStyle, x0: number, top: number, yb: number, tx: number): void {
  const brass = style.id === 'citadel';
  const pw = 16;
  for (let x = Math.floor(x0 / pw) * pw; x < x0 + TILE + 16; x += pw) {
    c.fillStyle = shade(style.front, 0.8 + cell(tx, x, 3).next() * 0.4);
    c.fillRect(x + 0.75, top + 1, pw - 1.5, yb - top + 4);
    rivet(c, x + 4, top + 4, 1.2, brass ? '#c8a050' : '#5e4e46');
    rivet(c, x + 4, yb - 4, 1.2, brass ? '#c8a050' : '#5e4e46');
  }
  c.fillStyle = brass ? withAlpha('#b08d3c', 0.8) : 'rgba(0,0,0,0.35)';
  c.fillRect(x0, top + (yb - top) * 0.45, TILE + 16, 2);
  if (!brass && r.chance(0.35)) soft(c, x0 + r.range(8, 40), top + 6, 8, '#6a3a1a', 0.45, 0.5, 1.6);
}

// ------------------------------------------------------------------ decorations

interface Spot {
  tx: number;
  ty: number;
  /** which way the room is: 's' = front face, 'e'/'w' = side top, 'n' = back top */
  face: 's' | 'e' | 'w' | 'n';
}

function decorSpots(t: Tiles): { front: Spot[]; side: Spot[] } {
  const front: Spot[] = [];
  const side: Spot[] = [];
  const open = (x: number, y: number): boolean => {
    const v = t.get(x, y);
    return v === E.Floor || v === E.Hazard || v === E.Grate;
  };
  for (let ty = 0; ty < ROOM_H; ty++)
    for (let tx = 0; tx < ROOM_W; tx++) {
      if (!t.wall(tx, ty) || t.nearDoor(tx, ty, 1)) continue;
      if (open(tx, ty + 1) && t.wall(tx - 1, ty) && t.wall(tx + 1, ty) && !t.wall(tx - 1, ty + 1) && !t.wall(tx + 1, ty + 1)) front.push({ tx, ty, face: 's' });
      else if (open(tx + 1, ty) && t.wall(tx, ty - 1) && t.wall(tx, ty + 1)) side.push({ tx, ty, face: 'e' });
      else if (open(tx - 1, ty) && t.wall(tx, ty - 1) && t.wall(tx, ty + 1)) side.push({ tx, ty, face: 'w' });
      else if (open(tx, ty - 1) && t.wall(tx - 1, ty) && t.wall(tx + 1, ty)) side.push({ tx, ty, face: 'n' });
    }
  return { front, side };
}

function shuffle<T>(rng: Rng, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

/** The anchor of a decoration: front faces hang on the face; side/back ones sit on the wall top by the edge. */
function anchor(s: Spot, FH: number): [number, number] {
  const x = s.tx * TILE;
  const y = s.ty * TILE;
  switch (s.face) {
    case 's':
      return [x + 16, y + TILE - FH * 0.55];
    case 'e':
      return [x + TILE - 7, y + 16];
    case 'w':
      return [x + 7, y + 16];
    case 'n':
      return [x + 16, y + 8];
  }
}

export function drawWallDecor(w: WallCtx): void {
  const { ctx, rng, tiles, style, art } = w;
  const FH = style.frontH;
  const { front, side } = decorSpots(tiles);
  const taken = new Set<number>();
  const key = (s: Spot): number => s.ty * ROOM_W + s.tx;
  // lights: spread around the room (Poisson-ish), front faces preferred
  const lit: Spot[] = [];
  const minD = style.id === 'hall' ? 8 : 7;
  for (const s of [...shuffle(rng, front.slice()), ...shuffle(rng, side.slice())]) {
    if (lit.length >= 12) break;
    if (lit.some((o) => (o.tx - s.tx) ** 2 + (o.ty - s.ty) ** 2 < minD * minD)) continue;
    lit.push(s);
    taken.add(key(s));
    taken.add(key(s) - 1);
    taken.add(key(s) + 1);
  }
  for (const s of lit) lightDecor(ctx, rng, art, style, s, FH);
  // cobwebs in inner corners
  const webP = style.id === 'crypt' ? 0.55 : style.id === 'sewers' || style.id === 'hall' ? 0.35 : style.id === 'caverns' ? 0.2 : 0;
  if (webP > 0)
    for (let ty = 1; ty < ROOM_H - 1; ty++)
      for (let tx = 1; tx < ROOM_W - 1; tx++) {
        if (tiles.get(tx, ty) !== E.Floor || !tiles.wall(tx, ty - 1)) continue;
        if (tiles.wall(tx - 1, ty) && rng.chance(webP)) cobweb(ctx, rng, tx * TILE, ty * TILE, 1);
        else if (tiles.wall(tx + 1, ty) && rng.chance(webP)) cobweb(ctx, rng, tx * TILE + TILE, ty * TILE, -1);
      }
  // dressing on the remaining front faces
  let lastX = -99;
  let lastY = -99;
  for (const s of front) {
    if (taken.has(key(s))) continue;
    const far = Math.abs(s.tx - lastX) > 2 || s.ty !== lastY;
    const x = s.tx * TILE;
    const yb = s.ty * TILE + TILE;
    const top = yb - FH;
    const r = rng.next();
    switch (style.id) {
      case 'crypt':
      case 'hall':
        if (far && r < 0.13) banner(ctx, rng, x + 16, top, FH, style.id === 'crypt' ? '#3e4a2c' : '#5a2a2a', '#a08a4a', 0);
        else if (far && r < 0.26) chains(ctx, rng, x + 16, top, FH);
        else if (far && r < 0.33 && style.id === 'crypt') skullNiche(ctx, rng, art, x + 16, top, FH);
        else continue;
        break;
      case 'caverns':
        if (r < 0.3) hangingRoots(ctx, rng, x, yb, '#6a5a7a');
        else if (far && r < 0.42) fungusShelf(ctx, rng, art, x + 16, top + FH * 0.5);
        else continue;
        break;
      case 'sewers':
        if (far && r < 0.12) outflow(ctx, rng, art, x + 16, top, yb);
        else if (far && r < 0.22) chains(ctx, rng, x + 16, top, FH);
        else if (r < 0.4) pipeOnFace(ctx, x - 0.5, x + TILE + 0.5, top + FH * 0.4, '#5a4a32', '#8a7a5a');
        else continue;
        break;
      case 'forest':
        if (r < 0.35) vines(ctx, rng, x, top);
        else if (r < 0.5) hangingRoots(ctx, rng, x, yb, '#5a3a1a');
        else continue;
        break;
      case 'forge':
        if (far && r < 0.16) chains(ctx, rng, x + 16, top, FH);
        else if (r < 0.32) pipeOnFace(ctx, x - 0.5, x + TILE + 0.5, top + FH * 0.35, '#3a3030', '#6a5a52');
        else if (far && r < 0.4) stripes(ctx, x, yb);
        else continue;
        break;
      case 'reliquary':
        if (far && r < 0.1) banner(ctx, rng, x + 16, top, FH, '#2a4a8a', '#d4af37', 1);
        break;
      case 'citadel':
        if (far && r < 0.16) {
          ctx.fillStyle = '#0c0a10';
          ctx.beginPath();
          ctx.arc(x + 16, top + FH * 0.5, 11, 0, Math.PI * 2);
          ctx.fill();
          art.gears.push({ x: x + 16, y: top + FH * 0.5, r: rng.range(8, 11), teeth: rng.int(8, 10), dir: rng.chance(0.5) ? 1 : -1 });
        } else if (r < 0.34) pipeOnFace(ctx, x - 0.5, x + TILE + 0.5, top + FH * 0.42, '#9a6038', '#d09a68');
        else if (far && r < 0.44) {
          ventGrille(ctx, x + 16, top + FH * 0.5);
          art.vents.push([x + 16, top + FH * 0.5]);
        } else continue;
        break;
      case 'abyss':
        if (r < 0.22) tendrils(ctx, rng, x, yb);
        else if (far && r < 0.32) {
          glyph(ctx, rng, x + 16, top + FH * 0.5, '#b06bff');
          art.lights.push({ x: x + 16, y: top + FH * 0.5 + 6, r: 60, color: '#7a2bd6', a: 0.4, flicker: 3, phase: rng.next() * 10 });
        } else continue;
        break;
    }
    lastX = s.tx;
    lastY = s.ty;
  }
  // icicles hang from almost every reliquary front face
  if (style.id === 'reliquary') for (const s of frontTiles(tiles)) if (!tiles.nearDoor(s[0], s[1], 0) && rng.chance(0.75)) icicles(ctx, rng, s[0] * TILE, s[1] * TILE + TILE);
  // small things on the wall tops by the side edges
  for (const s of side) {
    if (taken.has(key(s))) continue;
    const [ax, ay] = anchor(s, FH);
    const r = rng.next();
    if ((style.id === 'caverns' || style.id === 'abyss') && r < 0.08) crystals(ctx, rng, art, ax, ay + 4, style.id === 'abyss' ? '#b06bff' : '#5fd3c0', 0.6);
    else if (style.id === 'reliquary' && r < 0.06) crystals(ctx, rng, art, ax, ay + 4, '#9ad0ff', 0.6);
    else if (style.id === 'crypt' && r < 0.05) candles(ctx, art, rng, ax, ay + 4, rng.int(1, 2));
  }
}

function lightDecor(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, style: RoomStyle, s: Spot, FH: number): void {
  const [ax, ay] = anchor(s, FH);
  const front = s.face === 's';
  switch (style.id) {
    case 'caverns':
      return crystals(ctx, rng, art, ax, front ? ay + FH * 0.55 : ay + 6, rng.chance(0.5) ? '#5fd3c0' : '#c58cff', 1);
    case 'abyss':
      return crystals(ctx, rng, art, ax, front ? ay + FH * 0.55 : ay + 6, '#b06bff', 1);
    case 'forest':
      if (front) return lantern(ctx, rng, art, ax, ay - FH * 0.45);
      return fungusPatch(ctx, art, rng, ax, ay, 8);
    case 'forge':
      if (front) return furnaceVent(ctx, rng, art, ax, ay);
      return brazier(ctx, rng, art, ax, ay);
    case 'reliquary':
      if (front && rng.chance(0.5)) return crystals(ctx, rng, art, ax, ay + FH * 0.55, '#9ad0ff', 1);
      return candles(ctx, art, rng, ax, front ? ay - FH * 0.45 + 4 : ay + 4, rng.int(2, 3), 1, '#ffd27a');
    case 'citadel':
      return lamp(ctx, rng, art, ax, ay, '#2aa198', '#a8fff4', 2);
    case 'sewers':
      return lamp(ctx, rng, art, ax, ay, '#d8b860', '#fff0b0', 3);
    default:
      return torch(ctx, rng, art, ax, ay, front, style.lightColor);
  }
}

function torch(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number, front: boolean, color: string): void {
  // iron bracket and a wrapped wooden handle
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 4.5, y - 1.5, 9, 7);
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(x - 3.5, y - 0.5, 7, 5);
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 3);
  ctx.lineTo(x, y - (front ? 12 : 9));
  ctx.stroke();
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#2a1a10';
  ctx.beginPath();
  ctx.ellipse(x, y - (front ? 12 : 9), 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const fy = y - (front ? 14 : 11);
  art.flames.push({ x, y: fy, s: 1, phase: rng.next() * 10, tint: 0 });
  art.lights.push({ x, y: fy + (front ? 18 : 6), r: 150, color, a: 0.85, flicker: 1, phase: rng.next() * 10 });
}

function lamp(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number, color: string, hi: string, tint: 0 | 1 | 2 | 3): void {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 5.5, y - 7.5, 11, 13);
  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y - 6, 8, 10);
  ctx.fillStyle = hi;
  ctx.fillRect(x - 2, y - 4, 4, 6);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 1);
  ctx.lineTo(x + 4, y - 1);
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x, y + 4);
  ctx.stroke();
  soft(ctx, x, y - 1, 14, color, 0.6);
  void tint;
  art.lights.push({ x, y: y + 8, r: 130, color, a: 0.75, flicker: 2, phase: rng.next() * 10 });
}

function lantern(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number): void {
  const len = rng.range(10, 18);
  ctx.strokeStyle = '#2a1a0c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + len);
  ctx.stroke();
  const ly = y + len + 5;
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(x, ly, 5.5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e6b84a';
  ctx.beginPath();
  ctx.ellipse(x, ly, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2c0';
  ctx.fillRect(x - 1.5, ly - 2, 3, 4);
  soft(ctx, x, ly, 16, '#e6b84a', 0.55);
  art.lights.push({ x, y: ly + 10, r: 120, color: '#e6b84a', a: 0.7, flicker: 2, phase: rng.next() * 10 });
}

function brazier(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number): void {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3030';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 6.5, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6a10';
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  art.flames.push({ x, y: y - 1, s: 0.8, phase: rng.next() * 10, tint: 0 });
  art.lights.push({ x, y: y + 4, r: 120, color: '#ff7a1a', a: 0.75, flicker: 1, phase: rng.next() * 10 });
}

function furnaceVent(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number): void {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 11, y - 6, 22, 13);
  ctx.fillStyle = '#1a0a06';
  ctx.fillRect(x - 9.5, y - 4.5, 19, 10);
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = '#ff6a10';
    ctx.fillRect(x - 8, y - 3 + k * 3.2, 16, 1.6);
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(x - 6, y - 3 + k * 3.2, 12, 0.7);
  }
  soft(ctx, x, y, 22, '#ff6a10', 0.45);
  art.lights.push({ x, y: y + 14, r: 140, color: '#ff6a10', a: 0.8, flicker: 1, phase: rng.next() * 10 });
}

export function crystals(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number, color: string, k: number): void {
  const n = rng.int(3, 5);
  soft(ctx, x, y - 6 * k, 20 * k, color, 0.4);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + rng.range(-0.8, 0.8);
    const len = rng.range(8, 16) * k;
    const wv = rng.range(2.5, 4) * k;
    const bx = x + rng.range(-6, 6) * k;
    const by = y;
    const tx = bx + Math.cos(a) * len;
    const ty = by + Math.sin(a) * len;
    const px = -Math.sin(a) * wv;
    const py = Math.cos(a) * wv;
    ctx.beginPath();
    ctx.moveTo(bx + px, by + py);
    ctx.lineTo(bx + px + Math.cos(a) * len * 0.75, by + py + Math.sin(a) * len * 0.75);
    ctx.lineTo(tx, ty);
    ctx.lineTo(bx - px + Math.cos(a) * len * 0.75, by - py + Math.sin(a) * len * 0.75);
    ctx.lineTo(bx - px, by - py);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(bx + px * 0.2, by + py * 0.2);
    ctx.lineTo(tx, ty);
    ctx.lineTo(bx + px, by + py);
    ctx.closePath();
    ctx.fill();
  }
  if (k >= 1) art.lights.push({ x, y: y - 4, r: 110, color, a: 0.65, flicker: 2, phase: rng.next() * 10 });
  else art.lights.push({ x, y: y - 4, r: 60, color, a: 0.4, flicker: 2, phase: rng.next() * 10 });
}

function banner(ctx: CanvasRenderingContext2D, rng: Rng, x: number, top: number, FH: number, cloth: string, trim: string, emblem: 0 | 1): void {
  const bw = rng.range(14, 18);
  const len = FH + rng.range(8, 14);
  const y = top - 2;
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(x - bw / 2 - 1.5, y - 1);
  ctx.lineTo(x + bw / 2 + 1.5, y - 1);
  ctx.lineTo(x + bw / 2 + 1.5, y + len);
  ctx.lineTo(x, y + len - 6);
  ctx.lineTo(x - bw / 2 - 1.5, y + len);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(x - bw / 2, y);
  ctx.lineTo(x + bw / 2, y);
  ctx.lineTo(x + bw / 2, y + len - 2);
  ctx.lineTo(x, y + len - 7.5);
  ctx.lineTo(x - bw / 2, y + len - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x - bw / 2 + bw * 0.3, y, 1.5, len - 6);
  ctx.fillRect(x + bw / 2 - bw * 0.25, y, 1.5, len - 4);
  ctx.fillStyle = trim;
  ctx.fillRect(x - bw / 2, y + 2, bw, 1.5);
  if (emblem === 0) {
    ctx.beginPath();
    ctx.arc(x, y + len * 0.42, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x - 0.75, y + 5, 1.5, len * 0.5);
    ctx.fillRect(x - 3.5, y + 8, 7, 1.5);
  }
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(x - bw / 2 - 3, y - 2.5, bw + 6, 2.5);
}

function chains(ctx: CanvasRenderingContext2D, rng: Rng, x: number, top: number, FH: number): void {
  for (const ox of rng.chance(0.5) ? [-4, 5] : [0]) {
    const len = FH + rng.range(2, 12);
    for (let d = 0; d < len; d += 4) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      if ((d / 4) % 2 === 0) ctx.ellipse(x + ox, top + d + 2, 1.6, 2.6, 0, 0, Math.PI * 2);
      else ctx.ellipse(x + ox, top + d + 2, 0.6, 2.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#6a6a72';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.strokeStyle = '#6a6a72';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + ox, top + len + 3, 3, 0, Math.PI * 1.4);
    ctx.stroke();
  }
}

function skullNiche(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, top: number, FH: number): void {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(x - 8, top + FH - 1);
  ctx.lineTo(x - 8, top + 6);
  ctx.arc(x, top + 6, 8, Math.PI, 0);
  ctx.lineTo(x + 8, top + FH - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0806';
  ctx.beginPath();
  ctx.moveTo(x - 6.5, top + FH - 2);
  ctx.lineTo(x - 6.5, top + 6);
  ctx.arc(x, top + 6, 6.5, Math.PI, 0);
  ctx.lineTo(x + 6.5, top + FH - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8d0b8';
  ctx.beginPath();
  ctx.arc(x, top + FH - 7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(x - 2.5, top + FH - 8, 1.6, 1.6);
  ctx.fillRect(x + 1, top + FH - 8, 1.6, 1.6);
  void rng;
  void art;
}

function cobweb(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, dir: 1 | -1): void {
  const r = rng.range(14, 22);
  ctx.strokeStyle = 'rgba(220,220,210,0.32)';
  ctx.lineWidth = 0.8;
  const spokes: [number, number][] = [];
  for (let k = 0; k <= 4; k++) {
    const a = (k / 4) * (Math.PI / 2);
    spokes.push([x + Math.cos(a) * r * dir, y - 6 + Math.sin(a) * r]);
  }
  ctx.beginPath();
  for (const [sx, sy] of spokes) {
    ctx.moveTo(x, y - 6);
    ctx.lineTo(sx, sy);
  }
  for (const f of [0.35, 0.6, 0.85]) {
    ctx.moveTo(x + (spokes[0]![0] - x) * f, y - 6 + (spokes[0]![1] - y + 6) * f);
    for (const [sx, sy] of spokes) ctx.lineTo(x + (sx - x) * f, y - 6 + (sy - y + 6) * f);
  }
  ctx.stroke();
}

function hangingRoots(ctx: CanvasRenderingContext2D, rng: Rng, x: number, yb: number, color: string): void {
  ctx.lineCap = 'round';
  for (let k = rng.int(2, 4); k > 0; k--) {
    const sx = x + rng.range(3, 29);
    const len = rng.range(6, 16);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(sx, yb - 4);
    ctx.quadraticCurveTo(sx + rng.range(-5, 5), yb + len * 0.5, sx + rng.range(-4, 4), yb + len);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function vines(ctx: CanvasRenderingContext2D, rng: Rng, x: number, top: number): void {
  for (let k = rng.int(1, 3); k > 0; k--) {
    const sx = x + rng.range(2, 30);
    const len = rng.range(14, 30);
    ctx.strokeStyle = '#1a3a14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, top - 2);
    ctx.quadraticCurveTo(sx + rng.range(-6, 6), top + len * 0.5, sx + rng.range(-3, 3), top + len);
    ctx.stroke();
    for (let d = 4; d < len; d += 5) {
      ctx.fillStyle = rng.chance(0.85) ? '#3a6a2a' : '#c8621f';
      ctx.beginPath();
      ctx.ellipse(sx + rng.range(-3, 3), top + d, 2.2, 1.3, rng.range(0, Math.PI), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function fungusShelf(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, y: number): void {
  const c = rng.chance(0.5) ? '#5fd3c0' : '#c58cff';
  for (let k = 0; k < 3; k++) {
    const sx = x + (k - 1) * 7 + rng.range(-2, 2);
    const sy = y + rng.range(-4, 4);
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 5.5, 3.5, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#8a6a9a';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 4.5, 2.6, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.fillRect(sx - 3, sy, 6, 1);
  }
  soft(ctx, x, y + 2, 14, c, 0.4);
  art.lights.push({ x, y: y + 10, r: 60, color: c, a: 0.4, flicker: 2, phase: rng.next() * 10 });
}

function outflow(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x: number, top: number, yb: number): void {
  const y = top + 8;
  // sludge trickle down the face and a pool on the floor
  ctx.fillStyle = '#4a6a22';
  ctx.fillRect(x - 2.5, y, 5, yb - y + 2);
  ctx.fillStyle = withAlpha('#3a5a1a', 0.85);
  ctx.beginPath();
  ctx.ellipse(x, yb + 5, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha('#8ab040', 0.5);
  ctx.fillRect(x - 5, yb + 3, 4, 1);
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a5a4a';
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0c08';
  ctx.beginPath();
  ctx.arc(x, y + 0.5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a6a22';
  ctx.fillRect(x - 2.5, y + 2, 5, 3);
  art.vents.push([x, yb + 4]);
  void rng;
}

function pipeOnFace(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color: string, hi: string): void {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x0, y - 4, x1 - x0, 8);
  ctx.fillStyle = color;
  ctx.fillRect(x0, y - 2.75, x1 - x0, 5.5);
  ctx.fillStyle = hi;
  ctx.fillRect(x0, y - 2, x1 - x0, 1.2);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x0 + 13, y - 5, 6, 10);
  ctx.fillStyle = hi;
  ctx.fillRect(x0 + 14, y - 4, 4, 8);
}

function stripes(ctx: CanvasRenderingContext2D, x: number, yb: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, yb - 6, TILE, 5);
  ctx.clip();
  ctx.fillStyle = '#d0a020';
  ctx.fillRect(x, yb - 6, TILE, 5);
  ctx.fillStyle = '#1a1210';
  for (let k = -8; k < TILE; k += 8) {
    ctx.beginPath();
    ctx.moveTo(x + k, yb);
    ctx.lineTo(x + k + 4, yb);
    ctx.lineTo(x + k + 9, yb - 6);
    ctx.lineTo(x + k + 5, yb - 6);
    ctx.fill();
  }
  ctx.restore();
}

function ventGrille(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 9, y - 6, 18, 12);
  ctx.fillStyle = '#6a5a2a';
  ctx.fillRect(x - 8, y - 5, 16, 10);
  ctx.fillStyle = '#100e12';
  for (let k = 0; k < 3; k++) ctx.fillRect(x - 6, y - 3.5 + k * 3, 12, 1.6);
}

function icicles(ctx: CanvasRenderingContext2D, rng: Rng, x: number, yb: number): void {
  for (let k = rng.int(2, 5); k > 0; k--) {
    const ix = x + rng.range(2, 30);
    const len = rng.range(4, 13);
    const wv = rng.range(1.8, 3);
    ctx.fillStyle = withAlpha('#2a4a6a', 0.9);
    ctx.beginPath();
    ctx.moveTo(ix - wv - 0.8, yb - 3);
    ctx.lineTo(ix + wv + 0.8, yb - 3);
    ctx.lineTo(ix, yb + len + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cfeaff';
    ctx.beginPath();
    ctx.moveTo(ix - wv, yb - 3);
    ctx.lineTo(ix + wv, yb - 3);
    ctx.lineTo(ix, yb + len);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix - wv * 0.5, yb - 2, 0.8, len * 0.6);
  }
}

function tendrils(ctx: CanvasRenderingContext2D, rng: Rng, x: number, yb: number): void {
  for (let k = rng.int(1, 3); k > 0; k--) {
    const sx = x + rng.range(3, 29);
    const len = rng.range(8, 18);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#06030a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, yb - 4);
    ctx.bezierCurveTo(sx + 6, yb + len * 0.3, sx - 6, yb + len * 0.6, sx + rng.range(-3, 3), yb + len);
    ctx.stroke();
    ctx.strokeStyle = '#3a1a5a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function glyph(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, color: string): void {
  soft(ctx, x, y, 12, color, 0.45);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 5);
  ctx.lineTo(x + 4, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.closePath();
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x, y + rng.range(5, 7));
  ctx.stroke();
}

// ------------------------------------------------------------------ pillars

export function drawPillars(w: WallCtx): void {
  const { tiles, ctx } = w;
  const seen = new Uint8Array(ROOM_W * ROOM_H);
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || tiles.e[i] !== E.Pillar) continue;
    let x0 = ROOM_W;
    let y0 = ROOM_H;
    let x1 = 0;
    let y1 = 0;
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop()!;
      const tx = j % ROOM_W;
      const ty = Math.floor(j / ROOM_W);
      x0 = Math.min(x0, tx);
      y0 = Math.min(y0, ty);
      x1 = Math.max(x1, tx);
      y1 = Math.max(y1, ty);
      for (const n of [j - 1, j + 1, j - ROOM_W, j + ROOM_W]) {
        if (n < 0 || n >= seen.length || seen[n] || tiles.e[n] !== E.Pillar) continue;
        if (Math.abs((n % ROOM_W) - tx) > 1) continue;
        seen[n] = 1;
        q.push(n);
      }
    }
    // big clumps break into 2 × 2 columns
    for (let by = y0; by <= y1; by += 2)
      for (let bx = x0; bx <= x1; bx += 2) {
        const bw = Math.min(2, x1 - bx + 1);
        const bh = Math.min(2, y1 - by + 1);
        pillar(ctx, w, bx * TILE, by * TILE, bw * TILE, bh * TILE);
      }
  }
}

function pillar(ctx: CanvasRenderingContext2D, w: WallCtx, x: number, y: number, pw: number, ph: number): void {
  const { style, rng, art } = w;
  const s = Math.min(pw, ph) / 32;
  const cx = x + pw / 2;
  // shadow
  soft(ctx, cx + 5 * s, y + ph - 1, pw * 0.62, '#000000', 0.55, 1, 0.45);
  switch (style.id) {
    case 'caverns':
    case 'abyss': {
      const abyss = style.id === 'abyss';
      jitterPoly(ctx, rng, cx, y + ph * 0.55, pw * 0.46, 9, 0.18, ph / pw);
      ctx.fillStyle = abyss ? '#1a1026' : shade(style.top, 0.8);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // the spike rising toward the viewer
      ctx.beginPath();
      ctx.moveTo(cx - pw * 0.3, y + ph * 0.75);
      ctx.lineTo(cx - pw * 0.08, y + ph * 0.05);
      ctx.lineTo(cx + pw * 0.06, y + ph * 0.02);
      ctx.lineTo(cx + pw * 0.3, y + ph * 0.75);
      ctx.closePath();
      ctx.fillStyle = abyss ? '#2a1a3e' : style.top;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - pw * 0.26, y + ph * 0.72);
      ctx.lineTo(cx - pw * 0.08, y + ph * 0.08);
      ctx.lineTo(cx - pw * 0.02, y + ph * 0.72);
      ctx.closePath();
      ctx.fillStyle = withAlpha(style.topHi, 0.55);
      ctx.fill();
      if (abyss) {
        glyph(ctx, rng, cx, y + ph * 0.45, '#b06bff');
        art.lights.push({ x: cx, y: y + ph * 0.6, r: 70 * s, color: '#7a2bd6', a: 0.45, flicker: 3, phase: rng.next() * 10 });
      } else if (rng.chance(0.6)) fungusShelf(ctx, rng, art, cx, y + ph * 0.6);
      return;
    }
    case 'forest': {
      // a small tree: roots, a short trunk, a round leafy crown seen from above
      for (let k = 0; k < 5; k++) root(ctx, rng, cx + rng.range(-5, 5) * s, y + ph * 0.82, rng.range(0, Math.PI * 2), rng.range(10, 18) * s, 3.5 * s);
      const tw = pw * 0.34;
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(cx - tw / 2 - 2, y + ph * 0.42, tw + 4, ph * 0.46);
      ctx.fillStyle = '#4a3418';
      ctx.fillRect(cx - tw / 2, y + ph * 0.42, tw, ph * 0.44);
      ctx.fillStyle = withAlpha('#7a5a34', 0.7);
      ctx.fillRect(cx - tw / 2 + 1, y + ph * 0.42, 1.5 * s, ph * 0.44);
      const cr = pw * 0.5;
      const cy = y + ph * 0.36;
      soft(ctx, cx + 4 * s, y + ph * 0.7, cr * 1.1, '#000000', 0.4, 1, 0.45);
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const rr = cr * (k % 2 === 0 ? 1.04 : 0.9) + 2;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1f3d22';
      ctx.beginPath();
      ctx.ellipse(cx, cy, cr * 0.92, cr * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let k = 0; k < 5; k++) {
        const a = rng.range(0, Math.PI * 2);
        const d = rng.range(0, cr * 0.45);
        const lr = cr * rng.range(0.3, 0.45);
        ctx.fillStyle = CANOPY[rng.int(0, CANOPY.length - 1)]!;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, lr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = withAlpha('#5a9a48', 0.5);
      ctx.beginPath();
      ctx.ellipse(cx - cr * 0.3, cy - cr * 0.3, cr * 0.35, cr * 0.25, -0.4, 0, Math.PI * 2);
      ctx.fill();
      for (let k = 0; k < 3 * s; k++) {
        ctx.fillStyle = AUTUMN[rng.int(0, 2)]!;
        ctx.fillRect(cx + rng.range(-cr * 0.7, cr * 0.7), cy + rng.range(-cr * 0.5, cr * 0.5), 2.5, 1.8);
      }
      return;
    }
    default:
      return column(ctx, w, x, y, pw, ph, s);
  }
}

function column(ctx: CanvasRenderingContext2D, w: WallCtx, x: number, y: number, pw: number, ph: number, s: number): void {
  const { style, rng, art } = w;
  const id = style.id;
  const stone = id === 'crypt' || id === 'hall';
  const marble = id === 'reliquary';
  const iron = id === 'forge';
  const brass = id === 'citadel';
  const brick = id === 'sewers';
  const body = marble ? '#9ab0c4' : iron ? '#3a2e2a' : brass ? '#8a6d2e' : brick ? '#4a5440' : shade(style.top, 0.95);
  const cap = marble ? '#c8dcec' : iron ? '#4a3a34' : brass ? '#b08d3c' : brick ? '#5a6650' : style.top;
  // plinth
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x + 1 * s, y + ph - 8 * s, pw - 2 * s, 8 * s);
  ctx.fillStyle = shade(cap, 0.75);
  ctx.fillRect(x + 2.5 * s, y + ph - 6.5 * s, pw - 5 * s, 5 * s);
  // shaft with round shading
  const sx0 = x + (brick || iron ? 3 : 5) * s;
  const sx1 = x + pw - (brick || iron ? 3 : 5) * s;
  const g = ctx.createLinearGradient(sx0, 0, sx1, 0);
  g.addColorStop(0, shade(body, 0.6));
  g.addColorStop(0.35, shade(body, 1.15));
  g.addColorStop(0.7, body);
  g.addColorStop(1, shade(body, 0.5));
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(sx0 - 2, y + 9 * s, sx1 - sx0 + 4, ph - 15 * s);
  ctx.fillStyle = g;
  ctx.fillRect(sx0, y + 10 * s, sx1 - sx0, ph - 17 * s);
  if (stone || marble) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let fx = sx0 + 4 * s; fx < sx1 - 2; fx += 4 * s) ctx.fillRect(fx, y + 11 * s, 1, ph - 19 * s);
  }
  if (brick) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let by = y + 14 * s; by < y + ph - 8 * s; by += 4 * s) ctx.fillRect(sx0, by, sx1 - sx0, 1);
    soft(ctx, cx(x, pw), y + ph * 0.6, pw * 0.3, '#3a6a22', 0.35);
  }
  if (iron || brass) {
    for (let by = y + 14 * s; by < y + ph - 10 * s; by += 9 * s) {
      ctx.fillStyle = brass ? '#6a4028' : '#2a201c';
      ctx.fillRect(sx0, by, sx1 - sx0, 2.5 * s);
      rivet(ctx, sx0 + 3 * s, by + 1.2 * s, 1.2 * s, brass ? '#d8b060' : '#6a5a52');
      rivet(ctx, sx1 - 3 * s, by + 1.2 * s, 1.2 * s, brass ? '#d8b060' : '#6a5a52');
    }
  }
  if (marble) {
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(sx0, y + ph * 0.55, sx1 - sx0, 2 * s);
  }
  // capital (the top face)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x, y, pw, 12 * s);
  ctx.fillStyle = cap;
  ctx.fillRect(x + 1.5 * s, y + 1.5 * s, pw - 3 * s, 9 * s);
  ctx.fillStyle = withAlpha(style.topHi, 0.6);
  ctx.fillRect(x + 1.5 * s, y + 1.5 * s, pw - 3 * s, 2.5 * s);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 1.5 * s, y + 8.5 * s, pw - 3 * s, 2 * s);
  if (id === 'crypt' && rng.chance(0.6)) {
    for (let d = 0; d < 12 * s; d++) {
      ctx.fillStyle = rng.chance(0.5) ? '#3d5826' : '#557a34';
      ctx.fillRect(x + rng.range(2, pw - 2), y + rng.range(1, 10 * s), 2, 2);
    }
  }
  if (marble) soft(ctx, cx(x, pw), y + 4 * s, pw * 0.4, '#ffffff', 0.5, 1, 0.3);
  if (iron) {
    // a chimney mouth glowing on top
    ctx.fillStyle = '#120806';
    ctx.beginPath();
    ctx.ellipse(cx(x, pw), y + 6 * s, pw * 0.28, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6a10';
    ctx.beginPath();
    ctx.ellipse(cx(x, pw), y + 6.5 * s, pw * 0.2, 1.8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    art.lights.push({ x: cx(x, pw), y: y + ph * 0.5, r: 70 * s, color: '#ff6a10', a: 0.5, flicker: 1, phase: rng.next() * 10 });
  }
  if (brass) {
    ctx.fillStyle = '#d8b060';
    gearPath(ctx, cx(x, pw), y + ph * 0.45, 6 * s, 8, rng.next());
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function cx(x: number, w: number): number {
  return x + w / 2;
}

// ------------------------------------------------------------------ doors

/** Pixel rect of a side's 2-tile doorway. */
export function doorRect(side: Side): [number, number, number, number] {
  switch (side) {
    case 'n':
      return [19 * TILE, 0, 64, TILE];
    case 's':
      return [19 * TILE, (ROOM_H - 1) * TILE, 64, TILE];
    case 'w':
      return [0, 10 * TILE, TILE, 64];
    case 'e':
      return [(ROOM_W - 1) * TILE, 10 * TILE, TILE, 64];
  }
}

/** Open doorways: the floor runs out into a dark passage. (Closed doors are drawn over these by room.ts.) */
export function drawDoorways(w: WallCtx): void {
  const { ctx, tiles, pal, style } = w;
  for (const side of ['n', 's', 'e', 'w'] as Side[]) {
    const [first] = [...tiles.doorSide.entries()].filter(([, s]) => s === side);
    if (!first || tiles.e[first[0]] !== E.Door) continue;
    const [x, y, dw, dh] = doorRect(side);
    ctx.fillStyle = shade(pal.floor, 0.75);
    ctx.fillRect(x, y, dw, dh);
    const g =
      side === 'n'
        ? ctx.createLinearGradient(0, y + dh, 0, y)
        : side === 's'
          ? ctx.createLinearGradient(0, y, 0, y + dh)
          : side === 'w'
            ? ctx.createLinearGradient(x + dw, 0, x, 0)
            : ctx.createLinearGradient(x, 0, x + dw, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, dw, dh);
    // threshold stone and jambs
    ctx.fillStyle = shade(style.top, 0.9);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    if (side === 'n' || side === 's') {
      const ty = side === 'n' ? y + dh - 5 : y;
      ctx.fillRect(x, ty, dw, 5);
      ctx.strokeRect(x, ty, dw, 5);
      for (const jx of [x - 5, x + dw]) {
        ctx.fillStyle = shade(style.front, 1.15);
        ctx.fillRect(jx, y, 5, dh);
        ctx.strokeRect(jx, y, 5, dh);
      }
    } else {
      const tx = side === 'w' ? x + dw - 5 : x;
      ctx.fillRect(tx, y, 5, dh);
      ctx.strokeRect(tx, y, 5, dh);
    }
  }
}

/** A shut door: an obvious barrier with a glowing seal (drawn on the per-version layer). */
export function drawClosedDoor(ctx: CanvasRenderingContext2D, side: Side, style: RoomStyle): void {
  const [x, y, dw, dh] = doorRect(side);
  const vert = side === 'n' || side === 's';
  const mat: Record<string, [string, string, string]> = {
    forge: ['#3a2c28', '#1a1210', '#ff6a10'],
    reliquary: ['#4a6a8a', '#d4af37', '#9ad0ff'],
    citadel: ['#8a6d2e', '#3a2a14', '#2aa198'],
    abyss: ['#2a0d3f', '#7a2bd6', '#d6a8ff'],
  };
  const [wood, band, seal] = mat[style.id] ?? ['#5a3a20', '#3a3a42', '#ffb04a'];
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x, y, dw, dh);
  ctx.fillStyle = wood;
  ctx.fillRect(x + 2, y + 2, dw - 4, dh - 4);
  // planks / slats
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (vert)
    for (let i = 8; i < dw; i += 8) {
      ctx.moveTo(x + i, y + 2);
      ctx.lineTo(x + i, y + dh - 2);
    }
  else
    for (let i = 8; i < dh; i += 8) {
      ctx.moveTo(x + 2, y + i);
      ctx.lineTo(x + dw - 2, y + i);
    }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  if (vert) ctx.fillRect(x + 2, y + 2, dw - 4, 3);
  else ctx.fillRect(x + 2, y + 2, 3, dh - 4);
  // iron bands with studs
  ctx.fillStyle = band;
  for (const f of [0.28, 0.72]) {
    if (vert) ctx.fillRect(x + 2, y + dh * f - 2, dw - 4, 4);
    else ctx.fillRect(x + dw * f - 2, y + 2, 4, dh - 4);
  }
  ctx.fillStyle = '#c9ced6';
  for (const f of [0.28, 0.72])
    for (let i = 6; i < (vert ? dw : dh) - 4; i += 12) {
      if (vert) ctx.fillRect(x + i, y + dh * f - 1, 2, 2);
      else ctx.fillRect(x + dw * f - 1, y + i, 2, 2);
    }
  // the seal in the middle
  const mx = x + dw / 2;
  const my = y + dh / 2;
  soft(ctx, mx, my, 20, seal, 0.55);
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(mx, my, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = seal;
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(mx - 1.2, my - 3, 2.4, 4);
  ctx.beginPath();
  ctx.arc(mx, my - 2.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // a glowing seam on the room side so a shut door reads even in the dark
  ctx.fillStyle = seal;
  if (side === 'n') ctx.fillRect(x, y + dh - 2, dw, 2);
  else if (side === 's') ctx.fillRect(x, y, dw, 2);
  else if (side === 'w') ctx.fillRect(x + dw - 2, y, 2, dh);
  else ctx.fillRect(x, y, 2, dh);
}

