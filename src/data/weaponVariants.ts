// Scaling variants (D319): a dropped weapon sometimes comes with a different scaling profile than its class's usual
// one, so every build has a few weapon types that suit it. A Blessed Katana scales B Slicey / C Prayer and deals
// Holy; a Fervent Colossal Sword scales C Bonk / E Slicey / C Prayer and deals Fire. The four elemental words follow
// the hybrid rule (D80): Slicey + Prayer Holy, Bonk + Prayer Fire, Slicey + Brain Magic, Bonk + Brain Void. The
// grade totals stay close to the class's own (GRADE_MULT sum within about ±0.1), so a variant trades, never wins.
import type { DamageType, Grade, WeaponDef } from '../game/types';

export interface WeaponVariantDef {
  id: string;
  /** the word in front of the weapon's name ("Blessed Katana") */
  word: string;
  grades: WeaponDef['grades'];
  /** the weapon's own damage type with this variant (else the class's) */
  element?: DamageType;
  /** a variant the owner asked for that is better than its class, not a trade (D328: the B / A Keen Longsword) */
  upgrade?: true;
}

/** A dropped weapon has this chance of a scaling variant, when its class has any (D319). */
export const VARIANT_CHANCE = 0.35;

/** A requirement for a stat the class did not need, by the variant's grade there. */
export const VARIANT_REQ: Record<Grade, number> = { S: 14, A: 13, B: 12, C: 10, D: 9, E: 8, '-': 0 };

type G = WeaponDef['grades'];
const blessed = (grades: G): WeaponVariantDef => ({ id: 'blessed', word: 'Blessed', grades, element: 'holy' });
const fervent = (grades: G): WeaponVariantDef => ({ id: 'fervent', word: 'Fervent', grades, element: 'fire' });
const arcane = (grades: G): WeaponVariantDef => ({ id: 'arcane', word: 'Arcane', grades, element: 'magic' });
const hollow = (grades: G): WeaponVariantDef => ({ id: 'hollow', word: 'Hollow', grades, element: 'void' });
const heavy = (grades: G): WeaponVariantDef => ({ id: 'heavy', word: 'Heavy', grades });
const keen = (grades: G): WeaponVariantDef => ({ id: 'keen', word: 'Keen', grades });
const balanced = (grades: G): WeaponVariantDef => ({ id: 'balanced', word: 'Balanced', grades });
const devout = (grades: G): WeaponVariantDef => ({ id: 'devout', word: 'Devout', grades });
const deep = (grades: G): WeaponVariantDef => ({ id: 'deep', word: 'Deep', grades });

/** By weapon class. The Club and Whip have none: they do not care how strong you are. */
export const WEAPON_VARIANTS: Record<string, WeaponVariantDef[]> = {
  greathammer: [fervent({ bonk: 'B', slicey: '-', prayer: 'C' }), hollow({ bonk: 'B', slicey: '-', brain: 'C' })],
  greataxe: [keen({ bonk: 'B', slicey: 'D' }), fervent({ bonk: 'C', slicey: '-', prayer: 'C' })],
  colossal_sword: [keen({ bonk: 'B', slicey: 'D' }), fervent({ bonk: 'C', slicey: 'E', prayer: 'C' }), hollow({ bonk: 'C', slicey: 'E', brain: 'C' })],
  crossbow: [fervent({ bonk: 'C', slicey: '-', prayer: 'D' }), hollow({ bonk: 'C', slicey: '-', brain: 'D' })],
  twin_daggers: [blessed({ bonk: '-', slicey: 'B', prayer: 'C' }), arcane({ bonk: '-', slicey: 'B', brain: 'C' })],
  rapier: [blessed({ bonk: '-', slicey: 'C', prayer: 'C' }), arcane({ bonk: '-', slicey: 'C', brain: 'C' })],
  katana: [balanced({ bonk: 'C', slicey: 'B' }), blessed({ bonk: '-', slicey: 'B', prayer: 'C' }), arcane({ bonk: '-', slicey: 'B', brain: 'C' })],
  bow: [blessed({ bonk: '-', slicey: 'D', prayer: 'C' }), arcane({ bonk: '-', slicey: 'D', brain: 'C' })],
  // D328: the Keen Longsword leans a little to Slicey (B / A), the owner's ask; it is an upgrade on the B / B class
  longsword: [heavy({ bonk: 'A', slicey: 'D' }), { ...keen({ bonk: 'B', slicey: 'A' }), upgrade: true }, blessed({ bonk: 'D', slicey: 'C', prayer: 'C' }), arcane({ bonk: 'D', slicey: 'C', brain: 'C' })],
  spear: [heavy({ bonk: 'B', slicey: 'C' }), keen({ bonk: 'E', slicey: 'A' }), blessed({ bonk: 'D', slicey: 'C', prayer: 'C' })],
  battleaxe: [keen({ bonk: 'C', slicey: 'B' }), fervent({ bonk: 'C', slicey: 'D', prayer: 'C' }), hollow({ bonk: 'C', slicey: 'D', brain: 'C' })],
  mace: [fervent({ bonk: 'D', slicey: 'E', prayer: 'C' }), hollow({ bonk: 'D', slicey: 'E', brain: 'C' })],
  halberd: [keen({ bonk: 'C', slicey: 'A' }), fervent({ bonk: 'C', slicey: 'D', prayer: 'C' })],
  twin_axes: [heavy({ bonk: 'B', slicey: 'C' }), blessed({ bonk: 'D', slicey: 'C', prayer: 'C' }), arcane({ bonk: 'D', slicey: 'C', brain: 'C' })],
  chakram: [blessed({ bonk: '-', slicey: 'D', prayer: 'C' }), arcane({ bonk: '-', slicey: 'D', brain: 'C' })],
  // the hybrids (D80) lean one way or the other
  hollow_maul: [heavy({ bonk: 'A', slicey: '-', brain: 'D' }), deep({ bonk: 'D', slicey: '-', brain: 'A' })],
  spellblade: [keen({ bonk: '-', slicey: 'A', brain: 'D' }), deep({ bonk: '-', slicey: 'D', brain: 'A' })],
  censer_flail: [heavy({ bonk: 'A', slicey: '-', prayer: 'D' }), devout({ bonk: 'D', slicey: '-', prayer: 'A' })],
  dawn_glaive: [keen({ bonk: '-', slicey: 'A', prayer: 'D' }), devout({ bonk: '-', slicey: 'D', prayer: 'A' })],
};
