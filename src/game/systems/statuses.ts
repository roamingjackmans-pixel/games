// Status meters, damage-over-time ticks, buff expiry, poise regeneration.
import { statusDecay, statusTickActive } from '../combat/damage';
import type { Entity, World } from '../world';

/** Everyone's; with `only`, just that one body (a co-op guest's own, on its own screen, D338). */
export function updateStatuses(w: World, dt: number, only?: Entity): void {
  const now = w.time;
  for (const e of only ? [only] : w.entities.values()) {
    if (e.removed || (e.type !== 'player' && e.type !== 'enemy')) continue;
    // a guest's own statuses build, tick and wear off on its own screen (D338); buffs given here still expire here
    const own = e.pl?.net !== 'puppet';
    if (own) {
      statusDecay(w, e, dt);
      statusTickActive(w, e);
    }
    if (e.buffs && e.buffs.length) {
      for (let i = e.buffs.length - 1; i >= 0; i--) if (e.buffs[i]!.until <= now) e.buffs.splice(i, 1);
    }
    const hp = e.hp;
    if (hp && hp.poise < hp.poiseMax && now >= hp.poiseRegenAt) hp.poise = hp.poiseMax;
    if (own && hp && hp.barrierUntil <= now) hp.barrier = 0;
  }
}
