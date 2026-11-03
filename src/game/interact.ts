// Interactions that are world rules (not menus): the mimic bite.
import { dist } from '../engine/math';
import { rawDamage, wakeMimic } from './combat/damage';
import type { Entity, World } from './world';

/** Find a dormant mimic within reach of the player. */
export function dormantMimicNear(w: World, p: Entity, r = 64): Entity | null {
  for (const e of w.enemies) {
    if (e.en?.state === 'dormant' && !e.hp?.dead && dist(e.x, e.y, p.x, p.y) <= r + e.radius) return e;
  }
  return null;
}

/** Opening a mimic: it bites. Solo this kills; in co-op it downs you (D12). Then it is awake. */
export function mimicBite(w: World, p: Entity, mimic: Entity): void {
  w.sfx('mimicBite', p.x, 1);
  w.emit({ t: 'shake', amount: 14 });
  w.fx('hit', p.x, p.y, { color: '#c0304a', n: 20 });
  w.emit({ t: 'msg', text: 'It was a mimic.', color: '#ff6a5a' });
  wakeMimic(w, mimic);
  rawDamage(w, p, p.hp!.hp + p.hp!.max, 'physical', mimic.id, true);
  if (p.pl) w.emit({ t: 'stat', key: 'mimicBites', playerId: p.pl.playerId });
  w.hooks.onMimicBite?.(w, p, mimic);
}
