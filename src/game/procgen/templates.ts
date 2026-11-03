// Room interior templates (PROCGEN §3): 40 × 22 ASCII grids, validated by a unit test.
//   #  wall      .  floor      P  pillar (blocks movement and projectiles)
//   o  prop (blocks movement, not projectiles)      ~  zone hazard tile (walkable, hurts or slows)
//   _  pit (cannot walk; falling in = 30% max HP)   G  raised grate (Sewers: safe from waves)
//   S  enemy spawn point (≥ 200 px from any door)   C  chest spot      D  door (2 per side, fixed spots)
//   boss arenas only: K boss spot, H stairs spot, g open grave (pit + summon spot), w pool spot,
//   t tree (a prop a charge breaks: one charge per connected clump)
import { ROOM_H, ROOM_W, doorTiles, type Side } from '../room';

export interface RoomTemplate {
  id: string;
  rows: string[];
  /** boss arenas: a rotating floor ring (centre and radii in px, speed = px/s along the ring, sign = direction) */
  rotFloor?: { x: number; y: number; rIn: number; rOut: number; speed: number };
}

export const DOOR_SIDES: Side[] = ['n', 's', 'e', 'w'];

export interface TemplateIssue {
  id: string;
  msg: string;
}

const PASSABLE = new Set(['.', '~', 'G', 'S', 'C', 'D', 'B', 'K', 'H', 'w']);
const KNOWN = new Set(['#', '.', 'P', 'o', '~', '_', 'G', 'S', 'C', 'D', 'B', 'V', 'K', 'H', 'w', 'g', 't']);
/** Tiles a walking body cannot cross: wall, pillar, prop, pit, void, tree, open grave. */
export const BLOCKING = new Set(['#', 'P', 'o', '_', 'V', 't', 'g']);
/** The narrowest walkable gap allowed between two separate blocking things, in tiles (96 px: an Elite brute fits). */
export const MIN_GAP = 3;

function at(rows: string[], x: number, y: number): string {
  return rows[y]?.[x] ?? '#';
}

function onBorder(x: number, y: number): boolean {
  return x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1;
}

/**
 * The gap rule (PROCGEN §3): two blocking tiles either touch (one lump) or leave at least MIN_GAP walkable tiles
 * between them, measured horizontally, vertically and diagonally (Euclidean, in whole tiles: a gap of 2 across
 * and 2 down is 2.8 tiles and too narrow). Big bodies (radius up to ~43 px) cannot squeeze through anything less.
 * Returns each offending pair once (the door openings in the outer wall are exempt). `blocks` overrides which
 * characters count as blocking.
 */
export function gapViolations(rows: readonly string[], blocks: (ch: string) => boolean = (ch) => BLOCKING.has(ch)): { a: [number, number]; b: [number, number] }[] {
  const out: { a: [number, number]; b: [number, number] }[] = [];
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const solid = (x: number, y: number): boolean => x < 0 || y < 0 || x >= W || y >= H || blocks(rows[y]![x]!);
  const R = MIN_GAP;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!solid(x, y)) continue;
      for (let dy = 0; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          if (dy === 0 && dx <= 0) continue;
          const gx = Math.max(0, Math.abs(dx) - 1);
          const gy = Math.max(0, Math.abs(dy) - 1);
          if (gx === 0 && gy === 0) continue; // touching
          if (gx * gx + gy * gy >= R * R) continue; // wide enough
          const bx = x + dx;
          const by = y + dy;
          if (bx < 0 || by < 0 || bx >= W || by >= H || !solid(bx, by)) continue;
          if (onBorder(x, y) && onBorder(bx, by)) continue; // the outer wall's own door openings
          // anything blocking in between means a closer pair (or one lump): only an all-walkable box is a gap
          let open = true;
          const x0 = Math.min(x, bx);
          const x1 = Math.max(x, bx);
          for (let yy = y; yy <= by && open; yy++)
            for (let xx = x0; xx <= x1; xx++) {
              if ((xx === x && yy === y) || (xx === bx && yy === by)) continue;
              if (solid(xx, yy)) {
                open = false;
                break;
              }
            }
          if (open) out.push({ a: [x, y], b: [bx, by] });
        }
    }
  return out;
}

/** Validate one template against the PROCGEN §3 rules (`minFloor`: shaped rooms may go down to 50%). */
export function validateTemplate(t: RoomTemplate, o: { arena?: boolean; minFloor?: number } = {}): TemplateIssue[] {
  const out: TemplateIssue[] = [];
  const bad = (msg: string): void => {
    out.push({ id: t.id, msg });
  };
  if (t.rows.length !== ROOM_H) bad(`has ${t.rows.length} rows (needs ${ROOM_H})`);
  t.rows.forEach((r, i) => {
    if (r.length !== ROOM_W) bad(`row ${i} has ${r.length} columns (needs ${ROOM_W})`);
    for (const ch of r) if (!KNOWN.has(ch)) bad(`unknown character '${ch}' in row ${i}`);
  });
  if (out.length) return out;
  // border: walls except the fixed door tiles, which must be D
  const doorSet = new Set<string>();
  for (const s of DOOR_SIDES) for (const [x, y] of doorTiles(s)) doorSet.add(`${x},${y}`);
  for (let y = 0; y < ROOM_H; y++)
    for (let x = 0; x < ROOM_W; x++) {
      const border = x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1;
      if (!border) continue;
      const ch = at(t.rows, x, y);
      if (doorSet.has(`${x},${y}`)) {
        if (ch !== 'D') bad(`door tile ${x},${y} must be 'D'`);
      } else if (ch !== '#') bad(`border tile ${x},${y} must be '#'`);
    }
  // the tile just inside each door must be passable
  const inside: Record<Side, [number, number][]> = {
    n: [
      [19, 1],
      [20, 1],
    ],
    s: [
      [19, ROOM_H - 2],
      [20, ROOM_H - 2],
    ],
    w: [
      [1, 10],
      [1, 11],
    ],
    e: [
      [ROOM_W - 2, 10],
      [ROOM_W - 2, 11],
    ],
  };
  for (const s of DOOR_SIDES) for (const [x, y] of inside[s]) if (!PASSABLE.has(at(t.rows, x, y))) bad(`tile inside the ${s} door (${x},${y}) is blocked`);
  // ≥ 60% floor (interior)
  let floor = 0;
  let interior = 0;
  for (let y = 1; y < ROOM_H - 1; y++)
    for (let x = 1; x < ROOM_W - 1; x++) {
      interior++;
      if (PASSABLE.has(at(t.rows, x, y))) floor++;
    }
  const minFloor = o.minFloor ?? 0.6;
  if (floor / interior < minFloor) bad(`only ${Math.round((floor / interior) * 100)}% floor (needs ≥ ${Math.round(minFloor * 100)}%)`);
  // the gap rule: no 1–2 tile squeezes between blocking things
  const gaps = gapViolations(t.rows);
  for (const g of gaps.slice(0, 6)) bad(`gap narrower than ${MIN_GAP} tiles between ${g.a[0]},${g.a[1]} and ${g.b[0]},${g.b[1]}`);
  if (gaps.length > 6) bad(`… and ${gaps.length - 6} more narrow gaps`);
  // every door reachable from every other door (flood fill)
  const seen = new Set<string>();
  const start = inside.n[0]!;
  const q: [number, number][] = [start];
  seen.add(`${start[0]},${start[1]}`);
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= ROOM_W - 1 || ny >= ROOM_H - 1) continue;
      const k = `${nx},${ny}`;
      if (seen.has(k) || !PASSABLE.has(at(t.rows, nx, ny))) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  for (const s of DOOR_SIDES) for (const [x, y] of inside[s]) if (!seen.has(`${x},${y}`)) bad(`the ${s} door is not reachable from the north door`);
  // spawn points: at least 4, each ≥ 200 px (6.25 tiles) from every door
  const spawns: [number, number][] = [];
  const chests: [number, number][] = [];
  for (let y = 0; y < ROOM_H; y++)
    for (let x = 0; x < ROOM_W; x++) {
      if (at(t.rows, x, y) === 'S') spawns.push([x, y]);
      if (at(t.rows, x, y) === 'C') chests.push([x, y]);
    }
  if (spawns.length < 4 && !o.arena) bad(`has ${spawns.length} spawn points (needs ≥ 4)`);
  for (const [sx, sy] of spawns) {
    for (const s of DOOR_SIDES)
      for (const [dx, dy] of doorTiles(s)) {
        if (Math.hypot(sx - dx, sy - dy) * 32 < 200) {
          bad(`spawn ${sx},${sy} is within 200 px of the ${s} door`);
          break;
        }
      }
    if (!seen.has(`${sx},${sy}`)) bad(`spawn ${sx},${sy} is unreachable`);
  }
  if (chests.length < 1 && !o.arena) bad('has no chest spot C');
  // boss arenas: the boss spot and the stairs must be reachable
  if (o.arena)
    for (const ch of ['K', 'H']) {
      let found = false;
      for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) if (at(t.rows, x, y) === ch) found = seen.has(`${x},${y}`) || found;
      if (!found) bad(`arena has no reachable '${ch}'`);
    }
  for (const [cx, cy] of chests) if (!seen.has(`${cx},${cy}`)) bad(`chest spot ${cx},${cy} is unreachable`);
  return out;
}

/** Mirror a template horizontally and/or vertically (doors stay on their fixed spots by symmetry). */
export function mirrorTemplate(rows: string[], h: boolean, v: boolean): string[] {
  let r = rows.map((s) => s);
  if (h) r = r.map((s) => s.split('').reverse().join(''));
  if (v) r = [...r].reverse();
  return r;
}
