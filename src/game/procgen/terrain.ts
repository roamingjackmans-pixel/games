// Hazardous terrain patches (PROCGEN §3.2): a seeded share of combat and ambush rooms get 1–3 organic patches of
// Slow or Hurt terrain on plain floor, and some of those are heavy: a field of 4–8 big patches (D160). Deterministic from (seed, zone, cycle, room), so the host and every guest
// agree (the layer also travels in the room sync). Rules:
//  · only plain floor ('.'), and every tile of a patch has 8 floor (or grate) neighbours: never on or touching
//    walls, pillars, props, pits, void, '~' hazard tiles or doors, so a patch never narrows a passage;
//  · never within 3 tiles of a door (the door tiles and where you step in), never on or next to a spawn point
//    or a chest spot (nor the room's centre, where a chest without a C spot stands);
//  · patches keep a 1-tile gap from each other; total coverage ≤ TERRAIN_MAX_COVER of the room's floor
//    (TERRAIN_HEAVY_COVER in a heavy room);
//  · after each patch, a terrain-free walkable route must still join every door, chest spot and spawn point that
//    was reachable before (flood fill); a patch that breaks one is dropped and another tried.
import { stream, type Rng } from '../../engine/rng';
import { ROOM_H, ROOM_W, T, TERRAIN, doorTiles, worldToTile, type Room, type Side } from '../room';
import type { RoomNode, ZoneLayout } from './zone';

/** share of combat and ambush rooms with hazardous terrain (D160; was 0.35) */
export const TERRAIN_ROOM_RATE = 0.5;
/** most of a room's floor the patches may cover */
export const TERRAIN_MAX_COVER = 0.08;
/**
 * Heavy terrain rooms (D160): this share of the terrain rooms is a whole field of it instead: 4–8 big patches covering
 * up to TERRAIN_HEAVY_COVER of the floor, all Slow, all Hurt, or both mixed. The usual rules still hold (plain floor,
 * clear of doors, spawns and chests, and a clean route between them all).
 */
export const TERRAIN_HEAVY_RATE = 0.3;
export const TERRAIN_HEAVY_COVER = 0.3;
type HeavyTheme = 'slow' | 'hurt' | 'mixed';
/** door tiles keep this many tiles (Chebyshev) of clean floor around them */
const DOOR_CLEAR = 3;
const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Does this room roll hazardous terrain (and which stream does it use)? Only combat and ambush rooms do. */
export function terrainStream(layout: ZoneLayout, node: RoomNode): Rng | null {
  if (node.kind !== 'combat' && node.kind !== 'ambush') return null;
  const rng = stream(layout.seed, `terrain:${layout.zone}:${layout.cycle}:${node.id}`);
  return rng.chance(TERRAIN_ROOM_RATE) ? rng : null;
}

/** Tiles reachable on foot from `from` without crossing blocking tiles (or terrain, when `avoidTerrain`). */
function reach(room: Room, from: number[], avoidTerrain: boolean): Uint8Array {
  const seen = new Uint8Array(ROOM_W * ROOM_H);
  const q: number[] = [];
  for (const i of from) {
    if (seen[i]) continue;
    seen[i] = 1;
    q.push(i);
  }
  while (q.length) {
    const cur = q.pop()!;
    const cx = cur % ROOM_W;
    const cy = (cur - cx) / ROOM_W;
    for (const [dx, dy] of N4) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
      const ni = ny * ROOM_W + nx;
      if (seen[ni] || room.blocksMove(nx, ny)) continue;
      if (avoidTerrain && room.terrain[ni] !== TERRAIN.None) continue;
      seen[ni] = 1;
      q.push(ni);
    }
  }
  return seen;
}

/**
 * Lay hazardous terrain into `room` (its tiles, doors and markers already built). `keep` are world points that
 * must stay on clean floor with a clean route to the doors: spawn points, chest spots, the centre chest spot.
 * Returns the number of terrain tiles placed.
 */
export function placeTerrain(room: Room, rng: Rng, keep: [number, number][]): number {
  const n = ROOM_W * ROOM_H;
  const tiles = room.tiles;
  const floorish = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= ROOM_W || y >= ROOM_H) return false;
    const t = tiles[y * ROOM_W + x];
    return t === T.Floor || t === T.Grate;
  };
  // where a patch may go
  const ok = new Uint8Array(n);
  let floorCount = 0;
  const doorList: [number, number][] = [];
  for (const s of ['n', 's', 'e', 'w'] as Side[]) for (const d of doorTiles(s)) doorList.push(d);
  const keepTiles = keep.map(([x, y]) => worldToTile(x, y));
  for (let y = 1; y < ROOM_H - 1; y++)
    for (let x = 1; x < ROOM_W - 1; x++) {
      if (tiles[y * ROOM_W + x] !== T.Floor) continue;
      floorCount++;
      let good = true;
      for (let dy = -1; dy <= 1 && good; dy++) for (let dx = -1; dx <= 1 && good; dx++) if (!floorish(x + dx, y + dy)) good = false;
      for (const [dx, dy] of doorList) if (Math.max(Math.abs(dx - x), Math.abs(dy - y)) <= DOOR_CLEAR) good = false;
      for (const [kx, ky] of keepTiles) if (Math.max(Math.abs(kx - x), Math.abs(ky - y)) <= 1) good = false;
      if (good) ok[y * ROOM_W + x] = 1;
    }
  const heavy = rng.chance(TERRAIN_HEAVY_RATE);
  const theme: HeavyTheme | null = heavy ? rng.pick<HeavyTheme>(['slow', 'hurt', 'mixed']) : null;
  const cap = Math.floor(floorCount * (heavy ? TERRAIN_HEAVY_COVER : TERRAIN_MAX_COVER));
  // what must stay joined by clean floor: the open doors' tiles, the kept points
  const starts: number[] = [];
  for (const s of ['n', 's', 'e', 'w'] as Side[]) if (room.doors[s].exists) for (const [dx, dy] of doorTiles(s)) starts.push(dy * ROOM_W + dx);
  for (const [kx, ky] of keepTiles) if (kx >= 0 && ky >= 0 && kx < ROOM_W && ky < ROOM_H && !room.blocksMove(kx, ky)) starts.push(ky * ROOM_W + kx);
  if (!starts.length) return 0;
  const before = reach(room, [starts[0]!], false);
  const must = starts.filter((i) => before[i]);
  const joined = (): boolean => {
    const r = reach(room, [must[0]!], true);
    return must.every((i) => r[i]);
  };
  const candidates: number[] = [];
  for (let i = 0; i < n; i++) if (ok[i]) candidates.push(i);
  if (!candidates.length || cap < 6) return 0;
  const patches = heavy ? rng.int(4, 8) : rng.int(1, 3);
  let used = 0;
  for (let p = 0; p < patches; p++) {
    const want = Math.min(heavy ? rng.int(16, 45) : rng.int(9, 20), cap - used);
    if (want < 5) break;
    const kind = theme === 'slow' ? TERRAIN.Slow : theme === 'hurt' ? TERRAIN.Hurt : rng.chance(0.5) ? TERRAIN.Slow : TERRAIN.Hurt;
    for (let attempt = 0; attempt < (heavy ? 16 : 10); attempt++) {
      const free = candidates.filter((i) => ok[i] && !nearTerrain(room, i));
      if (!free.length) return used;
      const patch = growPatch(room, ok, rng, free[rng.int(0, free.length - 1)]!, want);
      if (patch.length < 4) continue;
      for (const i of patch) room.terrain[i] = kind;
      if (joined()) {
        used += patch.length;
        break;
      }
      for (const i of patch) room.terrain[i] = TERRAIN.None;
    }
  }
  return used;
}

/** Is a tile on or next to (8 neighbours) existing terrain? Patches keep a 1-tile gap. */
function nearTerrain(room: Room, i: number): boolean {
  const x = i % ROOM_W;
  const y = (i - x) / ROOM_W;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
      if (room.terrain[ny * ROOM_W + nx] !== TERRAIN.None) return true;
    }
  return false;
}

/** Grow an organic blob from `seed`: new tiles favour spots with more of the patch around them (round, few holes). */
function growPatch(room: Room, ok: Uint8Array, rng: Rng, seed: number, want: number): number[] {
  const inPatch = new Set<number>([seed]);
  const patch = [seed];
  const frontier = new Set<number>();
  const addFrontier = (i: number): void => {
    const x = i % ROOM_W;
    const y = (i - x) / ROOM_W;
    for (const [dx, dy] of N4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= ROOM_W - 1 || ny >= ROOM_H - 1) continue;
      const ni = ny * ROOM_W + nx;
      if (!ok[ni] || inPatch.has(ni) || nearTerrain(room, ni)) continue;
      frontier.add(ni);
    }
  };
  addFrontier(seed);
  const sx = seed % ROOM_W;
  const sy = (seed - sx) / ROOM_W;
  // a little wider than tall reads as a puddle in the top-down view
  const rad2 = Math.max(1.5, want / Math.PI) * 1.2;
  while (patch.length < want && frontier.size) {
    const list = [...frontier];
    const weights = list.map((i) => {
      const x = i % ROOM_W;
      const y = (i - x) / ROOM_W;
      // orthogonal neighbours count double, diagonals once: fills notches first, so no thin tails
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && inPatch.has((y + dy) * ROOM_W + x + dx)) k += dx && dy ? 1 : 2;
      const d2 = (x - sx) ** 2 * 0.8 + (y - sy) ** 2;
      return (k * k * k + 1) / (1 + (d2 / rad2) ** 2);
    });
    const pick = list[Math.max(0, rng.weighted(weights))]!;
    frontier.delete(pick);
    inPatch.add(pick);
    patch.push(pick);
    addFrontier(pick);
  }
  return patch;
}

/** Count terrain tiles of each kind (tests, the debug menu). */
export function terrainCounts(room: Room): { slow: number; hurt: number } {
  let slow = 0;
  let hurt = 0;
  for (const v of room.terrain) {
    if (v === TERRAIN.Slow) slow++;
    else if (v === TERRAIN.Hurt) hurt++;
  }
  return { slow, hurt };
}
