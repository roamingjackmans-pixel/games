// Room floor pre-rendered to an offscreen canvas (ART_AUDIO §1): floor, walls, pillars, props, hazard tiles,
// pits, grates, doors. Re-rendered only when the room's tiles or doors change.
import { OUTLINE, offscreen, shade, withAlpha } from '../engine/draw/parts';
import { Rng } from '../engine/rng';
import { OVERLAY, ROOM_H, ROOM_W, ROOM_Y0, T, TILE, doorTiles, type Room, type Side } from '../game/room';
import type { Palette } from '../game/types';

export const DEFAULT_PALETTE: Palette = {
  floor: '#2b3326',
  floor2: '#323b2c',
  wall: '#1c2219',
  wallTop: '#4a5a44',
  accent: '#a9b7a0',
  hazard: '#2a5a5a',
  colors: ['#2f3d2a', '#a9b7a0', '#e8e1c8', '#6b7f66'],
};

let cache: { key: string; canvas: CanvasImageSource } | null = null;

function doorKey(room: Room): string {
  return (['n', 's', 'e', 'w'] as Side[]).map((s) => `${room.doors[s].exists ? 1 : 0}${room.doors[s].open ? 1 : 0}`).join('');
}

export function drawRoomFloor(ctx: CanvasRenderingContext2D, room: Room, pal: Palette, propStyle: string, darkness = 0): void {
  const key = `${room.id}|${room.version}|${doorKey(room)}|${pal.floor}|${propStyle}`;
  if (!cache || cache.key !== key) cache = { key, canvas: renderRoom(room, pal, propStyle) };
  ctx.drawImage(cache.canvas, 0, ROOM_Y0);
  if (darkness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    ctx.fillRect(0, ROOM_Y0, 1280, 704);
  }
}

export function invalidateRoomCache(): void {
  cache = null;
}

function renderRoom(room: Room, pal: Palette, propStyle: string): CanvasImageSource {
  const { canvas, ctx } = offscreen(ROOM_W * TILE, ROOM_H * TILE);
  const rng = new Rng(`floor|${room.id}`);
  // floor
  ctx.fillStyle = pal.floor;
  ctx.fillRect(0, 0, ROOM_W * TILE, ROOM_H * TILE);
  for (let ty = 0; ty < ROOM_H; ty++) {
    for (let tx = 0; tx < ROOM_W; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = pal.floor2;
        ctx.fillRect(x, y, TILE, TILE);
      }
      // speckles and cracks
      if (rng.chance(0.25)) {
        ctx.fillStyle = withAlpha(pal.accent, 0.06 + rng.next() * 0.06);
        ctx.fillRect(x + rng.int(2, 26), y + rng.int(2, 26), rng.int(2, 6), rng.int(2, 4));
      }
      if (rng.chance(0.05)) {
        ctx.strokeStyle = withAlpha('#000000', 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + rng.int(0, 32), y + rng.int(0, 32));
        ctx.lineTo(x + rng.int(0, 32), y + rng.int(0, 32));
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = withAlpha('#000000', 0.12);
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= ROOM_W; tx++) {
    ctx.beginPath();
    ctx.moveTo(tx * TILE + 0.5, 0);
    ctx.lineTo(tx * TILE + 0.5, ROOM_H * TILE);
    ctx.stroke();
  }
  for (let ty = 0; ty <= ROOM_H; ty++) {
    ctx.beginPath();
    ctx.moveTo(0, ty * TILE + 0.5);
    ctx.lineTo(ROOM_W * TILE, ty * TILE + 0.5);
    ctx.stroke();
  }
  // special tiles
  const doorSet = new Map<string, Side>();
  for (const s of ['n', 's', 'e', 'w'] as Side[]) for (const [dx, dy] of doorTiles(s)) doorSet.set(`${dx},${dy}`, s);
  for (let ty = 0; ty < ROOM_H; ty++) {
    for (let tx = 0; tx < ROOM_W; tx++) {
      // fallen floor (a shrunk or collapsed platform) reads as void
      const ov = room.overlay[ty * ROOM_W + tx]!;
      const t = ov === OVERLAY.Void || ov === OVERLAY.Collapsed ? T.Void : room.tiles[ty * ROOM_W + tx]!;
      const x = tx * TILE;
      const y = ty * TILE;
      const side = doorSet.get(`${tx},${ty}`);
      if (side && room.doors[side].exists) {
        drawDoorTile(ctx, x, y, room.doors[side].open, pal, side);
        continue;
      }
      switch (t) {
        case T.Wall:
        case T.Door:
          ctx.fillStyle = pal.wall;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = pal.wallTop;
          ctx.fillRect(x, y, TILE, 8);
          ctx.fillStyle = withAlpha('#000000', 0.25);
          ctx.fillRect(x, y + TILE - 4, TILE, 4);
          if ((tx * 7 + ty * 3) % 5 === 0) {
            ctx.strokeStyle = withAlpha(pal.wallTop, 0.4);
            ctx.strokeRect(x + 4, y + 12, 24, 12);
          }
          break;
        case T.Pillar:
          ctx.fillStyle = withAlpha('#000000', 0.35);
          ctx.fillRect(x + 2, y + 6, TILE, TILE);
          ctx.fillStyle = shade(pal.wallTop, 0.9);
          ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = shade(pal.wallTop, 1.2);
          ctx.fillRect(x + 4, y + 4, TILE - 8, 6);
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
          break;
        case T.Prop:
          // breakable trees are drawn as whole clumps after this pass
          if (!room.trees.has(ty * ROOM_W + tx)) drawProp(ctx, x, y, propStyle, pal, rng);
          break;
        case T.Hazard:
          drawHazardTile(ctx, x, y, room.hazardKind, pal, tx, ty);
          break;
        case T.Pit:
          ctx.fillStyle = '#050407';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = withAlpha(pal.floor, 0.5);
          if (room.get(tx, ty - 1) !== T.Pit) ctx.fillRect(x, y, TILE, 5);
          break;
        case T.Void: {
          ctx.clearRect(x, y, TILE, TILE);
          ctx.fillStyle = '#06030a';
          ctx.fillRect(x, y, TILE, TILE);
          // a far star or two (position from the tile, not the floor rng, so floors keep their speckles)
          const h = (tx * 73856093) ^ (ty * 19349663);
          if ((h & 15) === 0) {
            ctx.fillStyle = withAlpha((h & 16) === 0 ? '#b06bff' : '#e8e4f0', 0.5);
            ctx.fillRect(x + ((h >> 5) & 27), y + ((h >> 9) & 27), 2, 2);
          }
          // the platform's cliff face under a floor tile
          const above = room.get(tx, ty - 1);
          if (ty > 0 && above !== T.Void && above !== T.Wall && above !== T.Door) {
            ctx.fillStyle = shade(pal.floor, 0.55);
            ctx.fillRect(x, y, TILE, 9);
            ctx.fillStyle = withAlpha('#7a2bd6', 0.35);
            ctx.fillRect(x, y + 9, TILE, 2);
          }
          break;
        }
        case T.Grate:
          ctx.fillStyle = '#5a5a52';
          ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
          ctx.strokeStyle = '#2a2a26';
          ctx.lineWidth = 2;
          for (let i = 6; i < TILE; i += 7) {
            ctx.beginPath();
            ctx.moveTo(x + i, y + 2);
            ctx.lineTo(x + i, y + TILE - 2);
            ctx.stroke();
          }
          break;
        default:
          break;
      }
      // crumbling floor (about to fall away): violet cracks
      if (ov === OVERLAY.Crumbling) {
        ctx.fillStyle = withAlpha('#7a2bd6', 0.18);
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = withAlpha('#d6a8ff', 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 6 + ((tx * 5) % 9));
        ctx.lineTo(x + 15, y + 15);
        ctx.lineTo(x + 28, y + 9 + ((ty * 7) % 11));
        ctx.moveTo(x + 15, y + 15);
        ctx.lineTo(x + 12 + ((tx + ty) % 8), y + 29);
        ctx.stroke();
      }
    }
  }
  if (room.trees.size) drawTrees(ctx, room);
  return canvas;
}

/** Breakable trees (room.trees): one thorny canopy per connected clump of tree tiles. */
function drawTrees(ctx: CanvasRenderingContext2D, room: Room): void {
  const seen = new Set<number>();
  for (const start of room.trees.keys()) {
    if (seen.has(start) || room.tiles[start] !== T.Prop) continue;
    const clump: number[] = [];
    const q = [start];
    seen.add(start);
    while (q.length) {
      const i = q.pop()!;
      clump.push(i);
      for (const n of [i - 1, i + 1, i - ROOM_W, i + ROOM_W]) {
        if (!room.trees.has(n) || seen.has(n) || room.tiles[n] !== T.Prop) continue;
        seen.add(n);
        q.push(n);
      }
    }
    let cx = 0;
    let cy = 0;
    for (const i of clump) {
      cx += (i % ROOM_W) * TILE + TILE / 2;
      cy += Math.floor(i / ROOM_W) * TILE + TILE / 2;
    }
    cx /= clump.length;
    cy /= clump.length;
    const r = TILE * 0.62 * Math.sqrt(clump.length);
    // shadow, trunk, then a canopy ringed with thorns
    ctx.fillStyle = withAlpha('#000000', 0.35);
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + r * 0.5, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(cx - r * 0.18, cy, r * 0.36, r * 0.75);
    ctx.fillStyle = '#2a1a0c';
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const rr = k % 2 === 0 ? r * 1.12 : r * 0.92;
      ctx.lineTo(cx + Math.cos(a) * rr, cy - r * 0.2 + Math.sin(a) * rr * 0.9);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1f3d22';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.2, r * 0.9, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2f5a30';
    for (const [ox, oy, k] of [
      [-0.35, -0.45, 0.38],
      [0.3, -0.35, 0.32],
      [0.05, 0.05, 0.3],
    ] as const) {
      ctx.beginPath();
      ctx.ellipse(cx + ox * r, cy - r * 0.2 + oy * r * 0.8, r * k, r * k * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // a few amber fey motes in the leaves
    ctx.fillStyle = '#e6b84a';
    for (const [ox, oy] of [
      [-0.4, -0.1],
      [0.35, -0.55],
      [0.2, 0.25],
    ] as const) ctx.fillRect(cx + ox * r - 1.5, cy - r * 0.2 + oy * r - 1.5, 3, 3);
  }
}

function drawDoorTile(ctx: CanvasRenderingContext2D, x: number, y: number, open: boolean, pal: Palette, side: Side): void {
  ctx.fillStyle = shade(pal.floor, 0.8);
  ctx.fillRect(x, y, TILE, TILE);
  if (!open) {
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.strokeStyle = '#2a1a10';
    ctx.lineWidth = 2;
    for (let i = 8; i < TILE; i += 8) {
      ctx.beginPath();
      if (side === 'n' || side === 's') {
        ctx.moveTo(x + i, y + 2);
        ctx.lineTo(x + i, y + TILE - 2);
      } else {
        ctx.moveTo(x + 2, y + i);
        ctx.lineTo(x + TILE - 2, y + i);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#c9ced6';
    ctx.fillRect(x + 14, y + 14, 4, 4);
  } else {
    ctx.fillStyle = withAlpha('#000000', 0.45);
    ctx.fillRect(x, y, TILE, TILE);
  }
}

function drawHazardTile(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, pal: Palette, tx: number, ty: number): void {
  const colors: Record<string, [string, string]> = {
    water: ['#1a3a3a', '#2a5a5a'],
    lava: ['#a02010', '#ff6a10'],
    ice: ['#a8d8f0', '#e0f4ff'],
    poisonCloud: ['#3a5a20', '#6a9a30'],
    thorns: ['#2a3a1a', '#5a7a2a'],
  };
  const [a, b] = colors[kind] ?? [pal.hazard, shade(pal.hazard, 1.3)];
  ctx.fillStyle = a;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = b;
  if ((tx + ty) % 3 === 0) ctx.fillRect(x + 6, y + 10, 14, 3);
  if ((tx * 2 + ty) % 4 === 1) ctx.fillRect(x + 16, y + 22, 10, 3);
}

function drawProp(ctx: CanvasRenderingContext2D, x: number, y: number, style: string, pal: Palette, rng: Rng): void {
  ctx.fillStyle = withAlpha('#000000', 0.3);
  ctx.fillRect(x + 3, y + 8, TILE - 2, TILE - 6);
  const base = pal.colors[3];
  switch (style) {
    case 'coffin':
      ctx.fillStyle = '#4a3424';
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 2);
      ctx.lineTo(x + 22, y + 2);
      ctx.lineTo(x + 28, y + 10);
      ctx.lineTo(x + 22, y + 30);
      ctx.lineTo(x + 10, y + 30);
      ctx.lineTo(x + 4, y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#8a7a5a';
      ctx.fillRect(x + 15, y + 8, 2, 12);
      ctx.fillRect(x + 11, y + 11, 10, 2);
      break;
    case 'mushroom': {
      ctx.fillStyle = '#e8e1c8';
      ctx.fillRect(x + 13, y + 14, 6, 14);
      ctx.fillStyle = rng.chance(0.5) ? '#c58cff' : '#5fd3c0';
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 13, 13, 9, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'barrel':
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(x + 6, y + 4, 20, 26);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 6, y + 4, 20, 26);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x + 6, y + 9, 20, 3);
      ctx.fillRect(x + 6, y + 22, 20, 3);
      break;
    case 'stump':
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 13, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#8a6a3a';
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 6, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'anvil':
      ctx.fillStyle = '#3a3a40';
      ctx.fillRect(x + 4, y + 8, 24, 10);
      ctx.fillRect(x + 10, y + 18, 12, 10);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 8, 24, 10);
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(x + 6, y + 9, 4, 2);
      break;
    case 'crystal':
      ctx.fillStyle = '#cfeaff';
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 1);
      ctx.lineTo(x + 27, y + 18);
      ctx.lineTo(x + 16, y + 31);
      ctx.lineTo(x + 5, y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3a5a8a';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case 'gear':
      ctx.fillStyle = '#b08d3c';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 === 0 ? 14 : 10;
        ctx.lineTo(x + 16 + Math.cos(a) * r, y + 16 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#1a1a22';
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'void':
      ctx.fillStyle = '#2a0d3f';
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7a2bd6';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    default:
      ctx.fillStyle = base;
      ctx.fillRect(x + 4, y + 4, 24, 24);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, 24, 24);
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + 28, y + 28);
      ctx.stroke();
  }
}
