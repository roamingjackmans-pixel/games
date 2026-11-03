// Moving floors (D68, D95): Tock's rotating ring (RoomTemplate.rotFloor) and the rings and conveyor belts a boss
// phase starts (ArenaChange 'movingFloor', kept in Room.movers). Every walking body standing on one is carried,
// players and enemies alike; flying bodies are not.
import { dist } from '../../engine/math';
import type { Room } from '../room';
import type { MovingFloorDef } from '../types';
import type { Entity, World } from '../world';

const BELT_DIR: Record<'n' | 's' | 'e' | 'w', [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/** Is (x, y) on this floor? */
export function onMovingFloor(f: MovingFloorDef, x: number, y: number): boolean {
  if (f.kind === 'ring') {
    const d = dist(f.x, f.y, x, y);
    return d >= f.rIn && d <= f.rOut;
  }
  return x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h;
}

/** Every moving floor in the room (Tock's template ring first). */
export function movingFloors(room: Room): MovingFloorDef[] {
  const rf = room.rotFloor;
  return rf ? [{ kind: 'ring', ...rf, look: 'brass' }, ...room.movers] : room.movers;
}

/** The fastest floor speed under (x, y), in px/s (0 off every moving floor). The escapability checks use it. */
export function floorSpeedAt(room: Room, x: number, y: number): number {
  let s = 0;
  for (const f of movingFloors(room)) if (onMovingFloor(f, x, y)) s = Math.max(s, Math.abs(f.speed));
  return s;
}

/** Where a body at (x, y) on floor f is carried to in dt seconds. */
export function carriedTo(f: MovingFloorDef, x: number, y: number, dt: number): [number, number] {
  if (f.kind === 'ring') {
    const d = dist(f.x, f.y, x, y);
    const a = Math.atan2(y - f.y, x - f.x) + (f.speed / Math.max(40, d)) * dt;
    return [f.x + Math.cos(a) * d, f.y + Math.sin(a) * d];
  }
  const [dx, dy] = BELT_DIR[f.dir];
  return [x + dx * f.speed * dt, y + dy * f.speed * dt];
}

/** Carry one body on whichever floors it stands on (a body on two overlapping floors rides both). */
export function carryOnMovingFloors(w: World, e: Entity, dt: number): void {
  if (e.flying) return;
  const rf = w.room.rotFloor;
  if (!rf && w.room.movers.length === 0) return;
  for (const f of movingFloors(w.room)) {
    if (!onMovingFloor(f, e.x, e.y)) continue;
    const [nx, ny] = carriedTo(f, e.x, e.y, dt);
    w.room.moveCircle(e, nx - e.x, ny - e.y, false);
  }
}
