// Tile flow fields toward a target tile (BFS over the 40 × 22 grid), cached per room version and target tile.
import { ROOM_H, ROOM_W, ROOM_Y0, TILE, type Room } from '../room';

interface Field {
  version: number;
  key: number;
  dist: Int16Array;
  at: number;
}

const cache = new Map<string, Field>();

function fieldFor(room: Room, tx: number, ty: number, flying: boolean, now: number): Int16Array {
  const key = ty * ROOM_W + tx;
  const ck = `${room.id}|${flying ? 1 : 0}|${key}`;
  const f = cache.get(ck);
  if (f && f.version === room.version && now - f.at < 0.5) return f.dist;
  const dist = new Int16Array(ROOM_W * ROOM_H).fill(-1);
  const q = new Int32Array(ROOM_W * ROOM_H);
  let qh = 0;
  let qt = 0;
  if (tx >= 0 && ty >= 0 && tx < ROOM_W && ty < ROOM_H) {
    dist[key] = 0;
    q[qt++] = key;
  }
  while (qh < qt) {
    const cur = q[qh++]!;
    const cx = cur % ROOM_W;
    const cy = (cur - cx) / ROOM_W;
    const d = dist[cur]!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
      const ni = ny * ROOM_W + nx;
      if (dist[ni] !== -1) continue;
      if (room.blocksMove(nx, ny, flying)) continue;
      dist[ni] = d + 1;
      q[qt++] = ni;
    }
  }
  if (cache.size > 64) cache.clear();
  cache.set(ck, { version: room.version, key, dist, at: now });
  return dist;
}

/** Direction (unit vector) to step from (x, y) toward (gx, gy) around obstacles. */
export function stepToward(room: Room, x: number, y: number, gx: number, gy: number, flying: boolean, now: number): [number, number] {
  const direct = room.lineOfSight(x, y, gx, gy) && !lineBlockedForWalk(room, x, y, gx, gy, flying);
  if (direct) {
    const d = Math.hypot(gx - x, gy - y) || 1;
    return [(gx - x) / d, (gy - y) / d];
  }
  const tx = Math.floor(gx / TILE);
  const ty = Math.floor((gy - ROOM_Y0) / TILE);
  const field = fieldFor(room, tx, ty, flying, now);
  const cx = Math.floor(x / TILE);
  const cy = Math.floor((y - ROOM_Y0) / TILE);
  let best = -1;
  let bx = 0;
  let by = 0;
  const here = field[cy * ROOM_W + cx] ?? -1;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const) {
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
    const v = field[ny * ROOM_W + nx]!;
    if (v < 0) continue;
    if (dx !== 0 && dy !== 0 && (room.blocksMove(cx + dx, cy, flying) || room.blocksMove(cx, cy + dy, flying))) continue;
    if (best === -1 || v < best) {
      best = v;
      bx = dx;
      by = dy;
    }
  }
  if (best === -1 || (here >= 0 && best >= here && here !== 0)) {
    const d = Math.hypot(gx - x, gy - y) || 1;
    return [(gx - x) / d, (gy - y) / d];
  }
  const tcx = (cx + bx) * TILE + 16;
  const tcy = ROOM_Y0 + (cy + by) * TILE + 16;
  const d = Math.hypot(tcx - x, tcy - y) || 1;
  return [(tcx - x) / d, (tcy - y) / d];
}

function lineBlockedForWalk(room: Room, x0: number, y0: number, x1: number, y1: number, flying: boolean): boolean {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.ceil(d / 16);
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    if (room.blocksMove(Math.floor(x / TILE), Math.floor((y - ROOM_Y0) / TILE), flying)) return true;
  }
  return false;
}
