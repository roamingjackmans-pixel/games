// A platform floating in the void (any arena built on Void tiles; CONTENT_ENEMIES §11 The Abyss): measure
// it, shrink it (the edge crumbles under a telegraph, then falls away), let part of it fall away for a while
// (Collapse), and find the spot a stationary boss form takes in its far third. Standing on fallen floor is
// the void fall (systems/movement.ts). Door approaches and the ground under a boss never fall.
import { ROOM_CX, ROOM_CY, resolvePattern, shapeHit, type PatternCtx, type Shape } from '../combat/patterns';
import { spawnShapeTelegraph } from '../combat/telegraph';
import { OVERLAY, ROOM_H, ROOM_W, ROOM_Y0, T, TILE, doorTiles, tileCenter, type Room, type Side } from '../room';
import type { PatternDef } from '../types';
import type { Entity, World } from '../world';

/** The crumbling edge falls this long after the shrink starts (the boss's 2 s phase transition). */
export const CRUMBLE_S = 2;

export interface PlatformBounds {
  /** inclusive tile bounds of the platform's dense part (door bridges excluded) */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Standable platform floor (collapsed-for-now floor counts; crumbling and fallen floor do not). */
export function isPlatformTile(room: Room, tx: number, ty: number): boolean {
  if (tx < 1 || ty < 1 || tx > ROOM_W - 2 || ty > ROOM_H - 2) return false;
  const o = room.overlay[ty * ROOM_W + tx]!;
  if (o !== OVERLAY.None && o !== OVERLAY.Collapsed) return false;
  const t = room.tiles[ty * ROOM_W + tx]!;
  return t === T.Floor || t === T.Hazard || t === T.Grate;
}

/** Rows and columns at least half as full as the fullest one: thin door bridges do not stretch the bounds. */
export function platformBounds(room: Room): PlatformBounds | null {
  const rows = new Array<number>(ROOM_H).fill(0);
  const cols = new Array<number>(ROOM_W).fill(0);
  for (let ty = 1; ty < ROOM_H - 1; ty++)
    for (let tx = 1; tx < ROOM_W - 1; tx++)
      if (isPlatformTile(room, tx, ty)) {
        rows[ty]!++;
        cols[tx]!++;
      }
  const maxR = Math.max(...rows);
  const maxC = Math.max(...cols);
  if (maxR <= 0 || maxC <= 0) return null;
  const denseR = rows.map((n, i) => (n >= maxR / 2 ? i : -1)).filter((i) => i >= 0);
  const denseC = cols.map((n, i) => (n >= maxC / 2 ? i : -1)).filter((i) => i >= 0);
  return { x0: Math.min(...denseC), x1: Math.max(...denseC), y0: Math.min(...denseR), y1: Math.max(...denseR) };
}

function tileTouchesCircle(tx: number, ty: number, x: number, y: number, r: number): boolean {
  const rx0 = tx * TILE;
  const ry0 = ROOM_Y0 + ty * TILE;
  const cx = Math.max(rx0, Math.min(x, rx0 + TILE));
  const cy = Math.max(ry0, Math.min(y, ry0 + TILE));
  return (cx - x) ** 2 + (cy - y) ** 2 < r * r;
}

function livingBosses(w: World): Entity[] {
  return w.enemies.filter((e) => e.en?.isBoss && !e.hp?.dead && !e.removed);
}

const INWARD: Record<Side, [number, number]> = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

/** Straight two-tile corridors from every door inward to the kept platform: they never fall. */
function doorCorridors(room: Room, keep: (tx: number, ty: number) => boolean): Set<number> {
  const out = new Set<number>();
  for (const s of ['n', 's', 'e', 'w'] as Side[]) {
    const [dx, dy] = INWARD[s];
    for (const [sx, sy] of doorTiles(s)) {
      let x = sx + dx;
      let y = sy + dy;
      while (isPlatformTile(room, x, y) && !keep(x, y)) {
        out.add(y * ROOM_W + x);
        x += dx;
        y += dy;
      }
    }
  }
  return out;
}

/**
 * Shrink the platform (ArenaChange 'shrinkPlatform'). `value` < 1: that fraction of its area falls away, the
 * rest scaled toward its centre (0.25 = −25%); `value` ≥ 1: that many outer rows/columns fall. The doomed
 * edge crumbles under a Piercing-blue telegraph for CRUMBLE_S, then falls away.
 */
export function shrinkPlatform(w: World, value: number, boss: Entity | null): void {
  const room = w.room;
  const b = platformBounds(room);
  if (!b) return;
  let keep: (tx: number, ty: number) => boolean;
  if (value < 1) {
    const s = Math.sqrt(Math.max(0, 1 - value));
    const cx = (b.x0 + b.x1 + 1) / 2;
    const cy = (b.y0 + b.y1 + 1) / 2;
    const hw = ((b.x1 - b.x0 + 1) / 2) * s + 1e-6;
    const hh = ((b.y1 - b.y0 + 1) / 2) * s + 1e-6;
    keep = (tx, ty) => Math.abs(tx + 0.5 - cx) <= hw && Math.abs(ty + 0.5 - cy) <= hh;
  } else {
    const k = Math.round(value);
    keep = (tx, ty) => tx >= b.x0 + k && tx <= b.x1 - k && ty >= b.y0 + k && ty <= b.y1 - k;
  }
  const corridors = doorCorridors(room, keep);
  const shapes: Shape[] = [];
  let kx0 = ROOM_W;
  let kx1 = -1;
  let ky0 = ROOM_H;
  let ky1 = -1;
  for (let ty = 1; ty < ROOM_H - 1; ty++) {
    let runStart = -1;
    for (let tx = 1; tx <= ROOM_W - 1; tx++) {
      const i = ty * ROOM_W + tx;
      const plat = tx < ROOM_W - 1 && isPlatformTile(room, tx, ty);
      const kept = plat && keep(tx, ty);
      if (kept) {
        kx0 = Math.min(kx0, tx);
        kx1 = Math.max(kx1, tx);
        ky0 = Math.min(ky0, ty);
        ky1 = Math.max(ky1, ty);
      }
      const doomed = plat && !kept && !corridors.has(i);
      if (doomed) {
        room.overlay[i] = OVERLAY.Crumbling;
        if (runStart < 0) runStart = tx;
      }
      if (!doomed && runStart >= 0) {
        // one telegraph strip per run of crumbling tiles in this row
        shapes.push({ k: 'line', x: runStart * TILE, y: ROOM_Y0 + ty * TILE + TILE / 2, a: 0, w: TILE, l: (tx - runStart) * TILE });
        runStart = -1;
      }
    }
  }
  if (!shapes.length) return;
  room.version++;
  spawnShapeTelegraph(w, shapes, { ownerId: boss?.id ?? 0, team: 1, kind: boss ? 'pierce' : 'utility', windupS: CRUMBLE_S, spec: null, x: ROOM_CX, y: ROOM_CY, sourceTag: 'platform:crumble' });
  w.emit({ t: 'shake', amount: 6 });
  // a boss standing on the crumbling edge steps in
  if (boss && kx1 >= kx0) {
    const r = boss.radius + 4;
    const px0 = kx0 * TILE;
    const px1 = (kx1 + 1) * TILE;
    const py0 = ROOM_Y0 + ky0 * TILE;
    const py1 = ROOM_Y0 + (ky1 + 1) * TILE;
    const tx = px1 - px0 > 2 * r ? Math.max(px0 + r, Math.min(px1 - r, boss.x)) : (px0 + px1) / 2;
    const ty = py1 - py0 > 2 * r ? Math.max(py0 + r, Math.min(py1 - r, boss.y)) : (py0 + py1) / 2;
    const d = Math.hypot(tx - boss.x, ty - boss.y);
    if (d > 1) boss.forced = { vx: (tx - boss.x) / 0.6, vy: (ty - boss.y) / 0.6, until: w.time + 0.6, kind: 'slide' };
  }
  w.schedule(CRUMBLE_S, () => fallAway(w));
}

/** The crumbling edge falls into the void (except where a boss stands). */
export function fallAway(w: World): void {
  const room = w.room;
  const bosses = livingBosses(w);
  let n = 0;
  for (let i = 0; i < room.overlay.length; i++) {
    if (room.overlay[i] !== OVERLAY.Crumbling) continue;
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    const underBoss = bosses.some((b) => tileTouchesCircle(tx, ty, b.x, b.y, b.radius));
    room.overlay[i] = underBoss ? OVERLAY.None : OVERLAY.Void;
    n++;
  }
  if (!n) return;
  room.version++;
  w.emit({ t: 'shake', amount: 10 });
  w.sfx('fall', ROOM_CX, 0.9, 0.6);
}

/**
 * The floor inside `pattern` falls away for `durationS` (EffectDef 'collapseFloor'), then returns. Tiles under a
 * boss stay. Standing there is the void fall; the climb back finds the nearest floor that is still there.
 */
export function collapseFloor(w: World, pattern: PatternDef, durationS: number, ctx: PatternCtx): void {
  const room = w.room;
  const shapes = resolvePattern(pattern, ctx).flatMap((s) => s.shapes);
  const bosses = livingBosses(w);
  const changed: number[] = [];
  for (let ty = 1; ty < ROOM_H - 1; ty++)
    for (let tx = 1; tx < ROOM_W - 1; tx++) {
      const i = ty * ROOM_W + tx;
      if (room.overlay[i] !== OVERLAY.None || !isPlatformTile(room, tx, ty)) continue;
      const [cx, cy] = tileCenter(tx, ty);
      if (!shapes.some((s) => shapeHit(s, 0, cx, cy, 0, room))) continue;
      if (bosses.some((b) => tileTouchesCircle(tx, ty, b.x, b.y, b.radius))) continue;
      room.overlay[i] = OVERLAY.Collapsed;
      changed.push(i);
    }
  if (!changed.length) return;
  room.version++;
  w.emit({ t: 'shake', amount: 8 });
  w.sfx('fall', ROOM_CX, 0.9, 0.5);
  w.schedule(durationS, () => {
    for (const i of changed) if (room.overlay[i] === OVERLAY.Collapsed) room.overlay[i] = OVERLAY.None;
    room.version++;
  });
}

/**
 * The middle of the platform's third farthest from the room's door (BossPhase.passive.stationaryAt 'farThird'),
 * kept at least `r` from the platform's edge so a body of that radius stands wholly on it.
 */
export function farThirdSpot(w: World, r = 0): { x: number; y: number; facing: number } {
  const room = w.room;
  const b = platformBounds(room) ?? { x0: 1, x1: ROOM_W - 2, y0: 1, y1: ROOM_H - 2 };
  const door = (['n', 's', 'e', 'w'] as Side[]).find((s) => room.doors[s].exists) ?? 's';
  const px0 = b.x0 * TILE;
  const px1 = (b.x1 + 1) * TILE;
  const py0 = ROOM_Y0 + b.y0 * TILE;
  const py1 = ROOM_Y0 + (b.y1 + 1) * TILE;
  const cx = (px0 + px1) / 2;
  const cy = (py0 + py1) / 2;
  let x = cx;
  let y = cy;
  if (door === 's') y = py0 + (py1 - py0) / 6;
  else if (door === 'n') y = py1 - (py1 - py0) / 6;
  else if (door === 'w') x = px1 - (px1 - px0) / 6;
  else x = px0 + (px1 - px0) / 6;
  if (px1 - px0 > 2 * r) x = Math.max(px0 + r, Math.min(px1 - r, x));
  if (py1 - py0 > 2 * r) y = Math.max(py0 + r, Math.min(py1 - r, y));
  if (room.circleBlocked(x, y, 4)) [x, y] = room.nearestFloor(x, y, 14);
  return { x, y, facing: Math.atan2(cy - y, cx - x) };
}
