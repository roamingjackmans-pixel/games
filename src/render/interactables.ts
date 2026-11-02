// Drawing for interactables (bonfires, chests, reliquaries, signs, stairs). Shared by the host's run scene
// and the co-op guest's mirror, which answer "is this bonfire spent / this station done" differently.
import { drawChest } from '../engine/draw/enemies/crypt';
import { glow } from '../engine/draw/parts';
import { drawBonfire, drawReliquary, drawSign, drawStairs, drawStationMarker } from '../engine/draw/props';
import { TUTORIAL_STATIONS } from '../data/rooms/special';
import type { Entity } from '../game/world';

export interface InteractLook {
  bonfireUsed(key: string): boolean;
  stationDone(goal: string): boolean;
}

export function drawInteractable(ctx: CanvasRenderingContext2D, e: Entity, now: number, look: InteractLook): void {
  const it = e.it!;
  switch (it.kind) {
    case 'bonfire':
      drawBonfire(ctx, e.x, e.y, now, it.data?.unlit ? 'unlit' : look.bonfireUsed(it.key) ? 'ember' : 'fresh');
      break;
    case 'chest':
      drawChest(ctx, e.x, e.y, it.used ? Math.min(1, e.anim.poseT * 4 + 0.3) : 0, false, 0, false, false);
      e.anim.poseT += 1 / 60;
      break;
    case 'reliquary':
      drawReliquary(ctx, e.x, e.y, now, it.used);
      break;
    case 'station': {
      const n = Number(it.data?.n ?? 0);
      const goal = TUTORIAL_STATIONS.find((s) => s.n === n)?.goal ?? '';
      drawStationMarker(ctx, e.x, e.y - 40, look.stationDone(goal), now);
      drawSign(ctx, e.x, e.y, n);
      break;
    }
    case 'stairs':
      drawStairs(ctx, e.x, e.y, now, it.data?.up === true);
      break;
    case 'ngplus':
      // the New Game+ fire burns blue-white
      glow(ctx, e.x, e.y - 10, 70, '#9ad0ff', 0.45 + Math.sin(now * 3) * 0.1);
      drawBonfire(ctx, e.x, e.y, now, 'fresh');
      break;
    default:
      break;
  }
}

/** The interactable a player would use (the session's rule, for mirrors without a session). */
export function nearestInteractable(entities: Iterable<Entity>, p: Entity, reach = 56): Entity | null {
  let best: Entity | null = null;
  let bd = reach;
  for (const e of entities) {
    if (e.removed || e.type !== 'interact' || !e.it) continue;
    if (e.it.used && e.it.kind !== 'bonfire') continue;
    const d = Math.hypot(p.x - e.x, p.y - e.y) - e.radius;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}
