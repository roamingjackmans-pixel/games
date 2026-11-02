// Status meters, damage-over-time ticks, buff expiry, poise regeneration.
import { statusDecay, statusTickActive } from '../combat/damage';
import type { World } from '../world';

export function updateStatuses(w: World, dt: number): void {
  const now = w.time;
  for (const e of w.entities.values()) {
    if (e.removed || (e.type !== 'player' && e.type !== 'enemy')) continue;
    statusDecay(w, e, dt);
    statusTickActive(w, e);
    if (e.buffs && e.buffs.length) {
      for (let i = e.buffs.length - 1; i >= 0; i--) if (e.buffs[i]!.until <= now) e.buffs.splice(i, 1);
    }
    const hp = e.hp;
    if (hp && hp.poise < hp.poiseMax && now >= hp.poiseRegenAt) hp.poise = hp.poiseMax;
    if (hp && hp.barrierUntil <= now) hp.barrier = 0;
  }
}
