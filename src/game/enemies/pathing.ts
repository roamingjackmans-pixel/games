// Enemy pathing: tile flow fields toward a target tile over the 40 × 22 grid, cached per room version, target
// tile and body class (recomputed at most twice a second each, shared by every enemy chasing the same player).
// Big bodies (collision radius > 13 px) prefer "open" tiles — no blocking tile among the 8 neighbours, room for
// a body up to 48 px across the middle of any passage the gap rule allows (≥ 3 tiles) — and pay extra to cross
// tiles hugging a wall, so they run around pillars, props and pits instead of scraping into them. A clear
// straight line (swept with the body's radius) is always taken directly.
import { ROOM_H, ROOM_W, ROOM_Y0, TILE, type Room } from '../room';

interface Field {
  version: number;
  dist: Int16Array;
  at: number;
}

const cache = new Map<string, Field>();
/** Collision radius (room.moveCircle uses 0.8 × radius) above which a body counts as big. */
const BIG_R = 13;
/** Cost of entering a walkable tile that touches something blocking (big bodies only). */
const TIGHT_COST = 4;
const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
const N8 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

function collisionR(radius: number): number {
  return Math.max(4, radius * 0.8);
}

/** A walkable tile with all 8 neighbours walkable too. */
function openTile(room: Room, tx: number, ty: number, flying: boolean): boolean {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (room.blocksMove(tx + dx, ty + dy, flying)) return false;
  return true;
}

/** Weighted flow field (Dial's bucket queue): cost-to-target per tile, -1 = unreachable. */
function fieldFor(room: Room, tx: number, ty: number, flying: boolean, big: boolean, now: number): Int16Array {
  const key = ty * ROOM_W + tx;
  const ck = `${room.id}|${flying ? 1 : 0}|${big ? 1 : 0}|${key}`;
  const f = cache.get(ck);
  if (f && f.version === room.version && now - f.at < 0.5 && now >= f.at) return f.dist;
  const n = ROOM_W * ROOM_H;
  const dist = new Int16Array(n).fill(-1);
  const step = new Uint8Array(n);
  for (let y = 0; y < ROOM_H; y++)
    for (let x = 0; x < ROOM_W; x++) {
      const i = y * ROOM_W + x;
      if (room.blocksMove(x, y, flying)) step[i] = 0;
      else step[i] = big && !openTile(room, x, y, flying) ? TIGHT_COST : 1;
    }
  // buckets by cost modulo (TIGHT_COST + 1): costs never jump by more than TIGHT_COST
  const B = TIGHT_COST + 1;
  const buckets: number[][] = Array.from({ length: B }, () => []);
  if (tx >= 0 && ty >= 0 && tx < ROOM_W && ty < ROOM_H) {
    dist[key] = 0;
    buckets[0]!.push(key);
  }
  let pending = buckets[0]!.length;
  for (let c = 0; pending > 0; c++) {
    const b = buckets[c % B]!;
    while (b.length) {
      const cur = b.pop()!;
      pending--;
      if (dist[cur] !== c) continue; // stale entry
      const cx = cur % ROOM_W;
      const cy = (cur - cx) / ROOM_W;
      for (const [dx, dy] of N4) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
        const ni = ny * ROOM_W + nx;
        const s = step[ni]!;
        if (!s) continue;
        const nd = c + s;
        if (dist[ni] !== -1 && dist[ni]! <= nd) continue;
        dist[ni] = nd;
        buckets[nd % B]!.push(ni);
        pending++;
      }
    }
  }
  if (cache.size > 96) cache.clear();
  cache.set(ck, { version: room.version, dist, at: now });
  return dist;
}

/** Can a body of collision radius r slide along the straight line from (x0, y0) to (x1, y1)? */
export function clearLine(room: Room, x0: number, y0: number, x1: number, y1: number, r: number, flying: boolean): boolean {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / 8));
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    if (room.circleBlocked(x, y, r, flying)) return false;
  }
  return true;
}

/**
 * Direction (unit vector) to step from (x, y) toward (gx, gy) around obstacles. `radius` is the body's radius
 * (0 = a point): the straight line is swept with it, and big bodies path through open tiles.
 */
export function stepToward(room: Room, x: number, y: number, gx: number, gy: number, flying: boolean, now: number, radius = 0): [number, number] {
  const r = radius > 0 ? collisionR(radius) : 0;
  const straight = (): [number, number] => {
    const d = Math.hypot(gx - x, gy - y) || 1;
    return [(gx - x) / d, (gy - y) / d];
  };
  const direct = r > 0 ? clearLine(room, x, y, gx, gy, r * 0.95, flying) : room.lineOfSight(x, y, gx, gy) && !lineBlockedForWalk(room, x, y, gx, gy, flying);
  if (direct) return straight();
  const big = r > BIG_R;
  const tx = Math.floor(gx / TILE);
  const ty = Math.floor((gy - ROOM_Y0) / TILE);
  const field = fieldFor(room, tx, ty, flying, big, now);
  const cx = Math.floor(x / TILE);
  const cy = Math.floor((y - ROOM_Y0) / TILE);
  const here = field[cy * ROOM_W + cx] ?? -1;
  if (here === 0) return straight();
  let best = -1;
  let bx = 0;
  let by = 0;
  for (const [dx, dy] of N8) {
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
    const v = field[ny * ROOM_W + nx]!;
    if (v < 0) continue;
    // no cutting corners: both orthogonal neighbours of a diagonal step must be walkable
    if (dx !== 0 && dy !== 0 && (room.blocksMove(cx + dx, cy, flying) || room.blocksMove(cx, cy + dy, flying))) continue;
    // a diagonal step costs a little more, so ties go to straight steps along a corridor
    const score = v * 2 + (dx !== 0 && dy !== 0 ? 1 : 0);
    if (best === -1 || score < best) {
      best = score;
      bx = dx;
      by = dy;
    }
  }
  // unreachable from here (another island) or nothing better: walk at it, the old behaviour
  if (best === -1 || (here >= 0 && best >= here * 2 + 1)) return straight();
  // aim at the next tile's centre, but if the line to it is blocked for this body (we are off-centre against
  // a corner), first slide back toward the middle of our own tile
  const tcx = (cx + bx) * TILE + 16;
  const tcy = ROOM_Y0 + (cy + by) * TILE + 16;
  let ax = tcx;
  let ay = tcy;
  if (r > 0 && !clearLine(room, x, y, tcx, tcy, r * 0.95, flying)) {
    ax = cx * TILE + 16 + bx * 8;
    ay = ROOM_Y0 + cy * TILE + 16 + by * 8;
  }
  const d = Math.hypot(ax - x, ay - y);
  if (d < 1) {
    const dd = Math.hypot(tcx - x, tcy - y) || 1;
    return [(tcx - x) / dd, (tcy - y) / dd];
  }
  return [(ax - x) / d, (ay - y) / d];
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
