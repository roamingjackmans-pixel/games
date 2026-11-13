// What an item would really do in your hands (D294): the item cards equip it on a copy of the character and read the
// result, so every perk counts (stats and their scaling, proficiency, rarity, reinforcement, the item's own affixes,
// gems and legendary power, set perks gained or lost by the swap, rings and the rest of your gear). Timed buffs and
// situational bonuses (spells, Battle Cry, backstabs, Momentum) are not counted.
import { CASTING_TOOLS } from '../../data/castingTools';
import { WEAPONS } from '../../data/weapons';
import { computeDerived, weaponHitByType, type Derived } from '../player/derived';
import { spellSkill } from '../skills/use';
import type { Character, DamageType, Item } from '../types';

export interface EffectiveHit {
  /** one hit of the first light attack, by damage type (a volley: one bolt, as each target takes one, D264) */
  byType: Partial<Record<DamageType, number>>;
  total: number;
  /** a light-attack combo's damage per second at your attack speed */
  perSec: number;
  /** shot from the off hand with the block button (D291) */
  offHand: boolean;
}

type Hand = 'main' | 'off';

/** Where the item is worn now, or null when it is not worn (bag, second slots, shop, loot). */
function wornHand(c: Character, item: Item): Hand | null {
  if (c.equipment.main?.id === item.id) return 'main';
  if (c.equipment.off?.id === item.id) return 'off';
  return null;
}

/** A copy of the character wearing the item in `hand` (the hand it is in now, or its usual hand). */
function wearing(c: Character, item: Item, hand: Hand): Character {
  const copy = structuredClone(c);
  if (wornHand(c, item) !== hand) copy.equipment[hand] = structuredClone(item);
  return copy;
}

/** Light-combo damage per second for these derived stats. */
function comboPerSec(d: Derived, offHand: boolean): number {
  const wdef = offHand && d.offWeapon ? d.offWeapon.def : d.weapon;
  let dmg = 0;
  let secs = 0;
  for (const sw of wdef.combo) {
    dmg += Object.values(weaponHitByType(d, sw.mult, offHand)).reduce((a, b) => a + (b ?? 0), 0);
    secs += (sw.windupMs + sw.activeMs + sw.recoverMs) / 1000 / Math.max(0.3, offHand && d.offWeapon ? d.off.attackSpeed : d.attackSpeed);
  }
  return secs > 0 ? dmg / secs : 0;
}

/**
 * The hit a weapon deals with you holding it: worn, as worn; otherwise in the weapon hand (a bow two-handed, as it
 * shoots, D203). An off-hand crossbow (D291) is its off-hand shot. Null for anything that is not a weapon.
 */
export function effectiveWeaponHit(c: Character, item: Item): EffectiveHit | null {
  const def = WEAPONS[item.baseId];
  if (!def) return null;
  const offHand = wornHand(c, item) === 'off' || c.altOff?.id === item.id;
  const copy = wearing(c, item, offHand ? 'off' : 'main');
  // a bow is drawn in both hands; an off-hand crossbow only shoots one-handing
  if (def.twoHandOnly && !offHand) copy.twoHanded = true;
  if (offHand) copy.twoHanded = false;
  const d = computeDerived(copy);
  const shoots = offHand && !!d.offWeapon;
  const wdef = shoots ? d.offWeapon!.def : d.weapon;
  const byType = weaponHitByType(d, wdef.combo[0]?.mult ?? 1, shoots);
  const total = Object.values(byType).reduce((a, b) => a + (b ?? 0), 0);
  return { byType, total, perSec: comboPerSec(d, shoots), offHand: shoots };
}

/** A staff's or talisman's Spell Skill with you holding it (proficiency and set perks too), or null. */
export function effectiveSpellSkill(c: Character, item: Item): number | null {
  const def = CASTING_TOOLS[item.baseId];
  if (!def) return null;
  const hand: Hand = wornHand(c, item) ?? (c.altMain?.id === item.id ? 'main' : 'off');
  const copy = wearing(c, item, hand);
  if (hand === 'off') copy.twoHanded = false;
  const d = computeDerived(copy);
  const held = [d.mainTool, d.offTool].find((t) => t?.item.id === item.id) ?? null;
  if (!held) return null;
  // this tool alone, whichever other tool of its school you hold
  return spellSkill({ ...d, mainTool: held, offTool: null }, def.school);
}
