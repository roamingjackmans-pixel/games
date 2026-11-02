// Weapon skills, spells and consumables (GAME_DESIGN §5.8, §8.3, §10). Skills and spells arrive in M6.
import { CONSUMABLES } from '../../data/consumables';
import { runEffects } from '../effects/run';
import { itemLevelFor } from '../combat/formulas';
import type { Entity, World } from '../world';

export function tryUseSkill(_w: World, _e: Entity, _index: number): boolean {
  return false;
}

export function tryCastSpell(_w: World, _e: Entity, _index: number): boolean {
  return false;
}

export function updatePlayerAction(w: World, e: Entity, _dt: number): void {
  const pl = e.pl!;
  if (pl.state === 'consumable' && w.time >= pl.stateUntil) pl.state = 'idle';
}

/** Use the item in the quick-use slot: thrown items go to the cursor; damage scales with item level. */
export function tryUseConsumable(w: World, e: Entity): boolean {
  const pl = e.pl!;
  const c = pl.char;
  const id = c.quickSlot;
  if (!id || (c.consumables[id] ?? 0) <= 0) {
    w.emit({ t: 'msg', text: 'Nothing in the quick-use slot.', forPlayer: pl.playerId });
    return false;
  }
  const def = CONSUMABLES[id];
  c.consumables[id] = (c.consumables[id] ?? 0) - 1;
  const ilvl = itemLevelFor(w.zone, w.cycle);
  pl.state = 'consumable';
  pl.stateUntil = w.time + 0.3;
  runEffects(w, def.effect, {
    sourceId: e.id,
    team: 0,
    x: e.x,
    y: e.y,
    aimX: pl.aimX,
    aimY: pl.aimY,
    targetId: 0,
    powerMult: 1 + 0.45 * (ilvl - 1),
    isSpell: false,
    isSkill: false,
    baseDamage: 20,
    windupS: 0,
    tag: `consumable:${id}`,
  });
  w.sfx(def.thrown ? 'swingLight' : 'heal', e.x, 0.7);
  if ((c.consumables[id] ?? 0) <= 0) {
    // move to the next owned consumable
    const next = (Object.keys(c.consumables) as (keyof typeof c.consumables)[]).find((k) => (c.consumables[k] ?? 0) > 0) ?? null;
    c.quickSlot = next;
  }
  return true;
}
