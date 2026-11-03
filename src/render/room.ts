// Room art (ART_AUDIO §1). Two cached layers:
//  · the base: zone floor, hazard floors, pits/void, grates, walls by mass with their decorations, pillars,
//    props, trees, and the baked light map (ambient darkness with light pools). Rebuilt only when the room's
//    tiles or door set change; seeded by the room id, so a room looks the same on every visit.
//  · the per-version layer: the base plus platform tiles that fell away / are crumbling and shut doors.
// Per frame on top: flickering light, flames, animated hazards (ambience.ts).
import { OUTLINE, getGlow, offscreen, withAlpha } from '../engine/draw/parts';
import { drawRoomProp, type PropFx } from '../engine/draw/props';
import { Rng, hashString } from '../engine/rng';
import { OVERLAY, ROOM_W, ROOM_Y0, T, TILE, type Room, type Side } from '../game/room';
import type { Palette } from '../game/types';
import { drawAmbienceUnder } from './ambience';
import { floorEdgeShade, paintFloor } from './floors';
import { drawCrumbling, drawFallenTile, drawGrates, drawHazards, drawHoles, isFallenOverlay, makeVoidSky } from './holes';
import { E, RH, RW, Tiles, emptyArt, scratch, styleFor, type RoomArt, type RoomStyle } from './roomStyle';
import { drawTerrainAnim, drawTerrainBase, terrainKey, type TerrainArt } from './terrain';
import { drawClosedDoor, drawDoorways, drawPillars, drawWallDecor, drawWalls } from './walls';

export const DEFAULT_PALETTE: Palette = {
  floor: '#2b3326',
  floor2: '#323b2c',
  wall: '#1c2219',
  wallTop: '#4a5a44',
  accent: '#a9b7a0',
  hazard: '#2a5a5a',
  colors: ['#2f3d2a', '#a9b7a0', '#e8e1c8', '#6b7f66'],
};

type Canvas = HTMLCanvasElement | OffscreenCanvas;

interface Base {
  key: string;
  canvas: Canvas;
  art: RoomArt;
  style: RoomStyle;
  seed: number;
  sky: CanvasImageSource | null;
  /** hazardous terrain patches (terrain.ts), null when the room has none */
  terrain: TerrainArt | null;
}

let base: Base | null = null;
let layer: { key: string; canvas: Canvas; ctx: CanvasRenderingContext2D } | null = null;

const SIDES: Side[] = ['n', 's', 'e', 'w'];

function doorKey(room: Room): string {
  return SIDES.map((s) => `${room.doors[s].exists ? 1 : 0}${room.doors[s].open ? 1 : 0}`).join('');
}

function baseKey(room: Room, pal: Palette, propStyle: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < room.tiles.length; i++) h = Math.imul(h ^ room.tiles[i]!, 16777619);
  for (const i of room.trees.keys()) h = Math.imul(h ^ (i + 7), 16777619);
  return `${room.id}|${h >>> 0}|${SIDES.map((s) => (room.doors[s].exists ? 1 : 0)).join('')}|${room.hazardKind}|${pal.floor}|${propStyle}|${terrainKey(room)}`;
}

/** Last build/compose time in ms (dev diagnostics). */
export const roomPerf = { baseMs: 0, layerMs: 0, marks: '' };
if (import.meta.env.DEV) (globalThis as { __djRoomPerf?: unknown }).__djRoomPerf = roomPerf;

export function drawRoomFloor(ctx: CanvasRenderingContext2D, room: Room, pal: Palette, propStyle: string, darkness = 0): void {
  const vkey = `${room.id}|${room.version}|${doorKey(room)}|${pal.floor}|${propStyle}`;
  if (!layer || layer.key !== vkey || !base) {
    const bk = baseKey(room, pal, propStyle);
    if (!base || base.key !== bk) {
      const t0 = performance.now();
      base = renderBase(room, pal, propStyle, bk);
      roomPerf.baseMs = performance.now() - t0;
    }
    const t1 = performance.now();
    composeLayer(room, base, vkey);
    roomPerf.layerMs = performance.now() - t1;
  }
  ctx.drawImage(layer!.canvas, 0, ROOM_Y0);
  drawAmbienceUnder(ctx, room, base.art, performance.now() / 1000);
  if (base.terrain) drawTerrainAnim(ctx, base.terrain, performance.now() / 1000);
  if (darkness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    ctx.fillRect(0, ROOM_Y0, RW, RH);
  }
}

export function invalidateRoomCache(): void {
  base = null;
  layer = null;
}

/** The current room's art data (lights, vents, pits…) for the per-frame layers. */
export function currentRoomArt(): RoomArt | null {
  return base?.art ?? null;
}

// ------------------------------------------------------------------ the base

function renderBase(room: Room, pal: Palette, propStyle: string, key: string): Base {
  const style = styleFor(propStyle);
  const seed = hashString(`room|${room.id}`);
  const tiles = new Tiles(room);
  const art = emptyArt(style);
  const { canvas, ctx } = offscreen(RW, RH);
  const marks: string[] = [];
  let tm = performance.now();
  const mark = (n: string): void => {
    const now = performance.now();
    marks.push(`${n}:${(now - tm).toFixed(1)}`);
    tm = now;
  };
  // floor
  paintFloor({ ctx, rng: new Rng(`floor|${room.id}`), tiles, pal, style, art });
  floorEdgeShade(ctx, tiles);
  mark('floor');
  // hazard floors, holes, raised grates
  const hc = { ctx, rng: new Rng(seed ^ 0x1001), tiles, pal, style, art, seed };
  drawHazards(hc, room.hazardKind);
  mark('haz');
  let needSky = false;
  for (let i = 0; i < tiles.e.length && !needSky; i++) needSky = tiles.e[i] === E.Void || (style.voidPits && tiles.e[i] === E.Pit);
  const sky = needSky ? makeVoidSky(seed) : null;
  drawHoles(hc, 'pit', null);
  drawHoles(hc, 'void', sky);
  drawGrates(hc);
  mark('holes');
  // walls, doorways, decorations, pillars
  const wc = { ctx, rng: new Rng(seed ^ 0x2002), tiles, pal, style, art, seed };
  drawWalls(wc);
  mark('walls');
  drawDoorways(wc);
  drawWallDecor(wc);
  drawPillars(wc);
  mark('decor');
  // props
  const prng = new Rng(`props|${room.id}`);
  const fx: PropFx = {
    light: (x, y, r, color, a) => art.lights.push({ x, y, r, color, a, flicker: 2, phase: prng.next() * 10 }),
    flame: (x, y, s) => art.flames.push({ x, y, s, phase: prng.next() * 10, tint: 0 }),
  };
  for (let i = 0; i < tiles.e.length; i++) if (tiles.e[i] === E.Prop) drawRoomProp(ctx, (i % ROOM_W) * TILE, Math.floor(i / ROOM_W) * TILE, propStyle, prng, fx);
  if (room.trees.size) drawTrees(ctx, room);
  for (let i = 0; i < tiles.e.length; i++) {
    const v = tiles.e[i];
    if (v === E.Floor || v === E.Hazard || v === E.Grate) art.openTiles.push(i);
  }
  mark('props');
  bakeLighting(ctx, art, style);
  mark('light');
  // hazardous terrain patches over the light map, like the entities: gameplay ground must read in any corner
  // (they sit on open floor a tile clear of walls and props, so nothing drawn earlier overlaps them)
  const terrain = drawTerrainBase(ctx, room, style.id, seed);
  mark('terrain');
  roomPerf.marks = marks.join(' ');
  return { key, canvas, art, style, seed, sky, terrain };
}

/** Ambient darkness with light pools punched out, then a soft colored wash from each light. */
function bakeLighting(ctx: CanvasRenderingContext2D, art: RoomArt, style: RoomStyle): void {
  const [r, g, b, a] = style.dark;
  const D = scratch(7);
  D.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
  D.ctx.fillRect(0, 0, RW, RH);
  D.ctx.globalCompositeOperation = 'destination-out';
  const white = getGlow('#ffffff');
  const lights = art.lights.length > 140 ? art.lights.slice(0, 140) : art.lights;
  for (const L of lights) {
    D.ctx.globalAlpha = Math.min(1, L.a * 1.15);
    D.ctx.drawImage(white, L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
  }
  D.ctx.globalAlpha = 1;
  D.ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(D.canvas, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    ctx.globalAlpha = L.a * 0.2;
    ctx.drawImage(getGlow(L.color), L.x - L.r * 0.8, L.y - L.r * 0.8, L.r * 1.6, L.r * 1.6);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// ------------------------------------------------------------------ the per-version layer

function composeLayer(room: Room, b: Base, key: string): void {
  if (!layer) {
    const o = offscreen(RW, RH);
    layer = { key, canvas: o.canvas, ctx: o.ctx };
  }
  layer.key = key;
  const c = layer.ctx;
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.drawImage(b.canvas, 0, 0);
  for (let i = 0; i < room.overlay.length; i++) {
    const o = room.overlay[i]!;
    if (o === OVERLAY.None) continue;
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    if (isFallenOverlay(room, i)) {
      if (room.tiles[i] === T.Void) continue;
      b.sky ??= makeVoidSky(b.seed);
      drawFallenTile(c, room, tx, ty, b.sky, b.style);
    } else if (o === OVERLAY.Crumbling) drawCrumbling(c, tx, ty);
  }
  for (const s of SIDES) if (room.doors[s].exists && !room.doors[s].open) drawClosedDoor(c, s, b.style);
}

// ------------------------------------------------------------------ trees (Vexthorn's clearing)

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
    // shadow, roots, trunk, then a canopy ringed with thorns
    ctx.fillStyle = withAlpha('#000000', 0.4);
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + r * 0.55, r * 1.1, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.5);
      ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + r * 0.5 + Math.sin(a) * r * 0.45);
      ctx.stroke();
      ctx.strokeStyle = '#4a3018';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx - r * 0.2 - 2, cy - 2, r * 0.4 + 4, r * 0.8);
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(cx - r * 0.2, cy, r * 0.4, r * 0.75);
    ctx.fillStyle = '#2a1a0c';
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const rr = k % 2 === 0 ? r * 1.14 : r * 0.92;
      ctx.lineTo(cx + Math.cos(a) * rr, cy - r * 0.2 + Math.sin(a) * rr * 0.9);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1f3d22';
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.2, r * 0.9, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    for (const [ox, oy, k, col] of [
      [-0.35, -0.45, 0.4, '#2a5230'],
      [0.3, -0.35, 0.34, '#2f5a30'],
      [0.05, 0.05, 0.32, '#24482a'],
      [-0.2, -0.1, 0.22, '#3a6a34'],
    ] as const) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx + ox * r, cy - r * 0.2 + oy * r * 0.8, r * k, r * k * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // autumn leaves and amber fey motes in the leaves
    for (const [ox, oy, col] of [
      [-0.5, -0.3, '#c8621f'],
      [0.45, -0.1, '#e6b84a'],
      [0.1, -0.6, '#a0501a'],
    ] as const) {
      ctx.fillStyle = col;
      ctx.fillRect(cx + ox * r - 2, cy - r * 0.2 + oy * r - 1, 4, 2.5);
    }
    ctx.fillStyle = '#e6b84a';
    for (const [ox, oy] of [
      [-0.4, -0.1],
      [0.35, -0.55],
      [0.2, 0.25],
    ] as const) ctx.fillRect(cx + ox * r - 1.5, cy - r * 0.2 + oy * r - 1.5, 3, 3);
  }
}

