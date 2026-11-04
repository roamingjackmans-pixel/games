// Weapon experience and weapon-class proficiency (D178). Every enemy that dies gives each standing player experience
// on what they have out: the item in the weapon hand and a staff or talisman they hold. That experience fills the
// item's own bar (a full bar lets you pay Glowen at a bonfire to raise it a rarity) and the proficiency of its class,
// which levels to 50. Each class has two small perks: odd levels raise the first, even levels the second. Perks work
// only while an item of that class is out.

import type { Rarity } from '../game/types';

/** What a perk point raises. Percent stats are fractions per point; dodge is seconds per point. */
export type ProfStat =
  | 'damage'
  | 'poise'
  | 'attackSpeed'
  | 'castSpeed'
  | 'skillCooldown'
  | 'spellCooldown'
  | 'spellPower'
  | 'dodge'
  | 'stamina'
  | 'reach'
  | 'bleed'
  | 'lifesteal';

export interface ProfPerk {
  stat: ProfStat;
  /** per point */
  per: number;
  /** short name in the Proficiency tab */
  label: string;
}

export interface ProfClass {
  id: string;
  name: string;
  /** one line of flavour shown with the perks */
  blurb: string;
  perks: [ProfPerk, ProfPerk];
}

export const PROF_MAX_LEVEL = 50;

const p = (stat: ProfStat, per: number, label: string): ProfPerk => ({ stat, per, label });

/** Keyed by weapon base id, plus 'staff' and 'talisman' for the casting tools. */
export const PROF_CLASSES: Record<string, ProfClass> = {
  greataxe: { id: 'greataxe', name: 'Greataxes', blurb: 'Lean into the swing. Then lean harder.', perks: [p('damage', 0.01, 'Damage'), p('poise', 0.01, 'Poise damage')] },
  greathammer: { id: 'greathammer', name: 'Greathammers', blurb: 'Every problem is a nail.', perks: [p('damage', 0.01, 'Damage'), p('poise', 0.015, 'Poise damage')] },
  colossal_sword: { id: 'colossal_sword', name: 'Colossal Swords', blurb: 'You stop feeling the weight. Your back does not.', perks: [p('damage', 0.01, 'Damage'), p('stamina', 0.006, 'Swing stamina')] },
  hollow_maul: { id: 'hollow_maul', name: 'Hollow Mauls', blurb: 'It rings when it lands. You learn the note.', perks: [p('damage', 0.01, 'Damage'), p('poise', 0.015, 'Poise damage')] },
  battleaxe: { id: 'battleaxe', name: 'Battleaxes', blurb: 'One good chop deserves another.', perks: [p('damage', 0.01, 'Damage'), p('poise', 0.01, 'Poise damage')] },
  twin_axes: { id: 'twin_axes', name: 'Twin Axes', blurb: 'Two axes, one bad mood.', perks: [p('attackSpeed', 0.005, 'Attack speed'), p('lifesteal', 0.0006, 'Lifesteal')] },
  club: { id: 'club', name: 'Clubs', blurb: 'The oldest tool. Still works.', perks: [p('poise', 0.015, 'Poise damage'), p('stamina', 0.008, 'Swing stamina')] },
  mace: { id: 'mace', name: 'Maces', blurb: 'Armor is just a suggestion.', perks: [p('poise', 0.015, 'Poise damage'), p('damage', 0.008, 'Damage')] },
  censer_flail: { id: 'censer_flail', name: 'Censer Flails', blurb: 'Swing the smoke, not just the iron.', perks: [p('damage', 0.008, 'Damage'), p('reach', 0.008, 'Reach')] },
  longsword: { id: 'longsword', name: 'Longswords', blurb: 'Nothing fancy. Nothing missing.', perks: [p('damage', 0.008, 'Damage'), p('stamina', 0.006, 'Swing stamina')] },
  katana: { id: 'katana', name: 'Katanas', blurb: 'Draw, cut, done.', perks: [p('damage', 0.008, 'Damage'), p('attackSpeed', 0.005, 'Attack speed')] },
  spellblade: { id: 'spellblade', name: 'Spellblades', blurb: 'The edge hums the same tune as the spell.', perks: [p('damage', 0.008, 'Damage'), p('castSpeed', 0.006, 'Cast speed')] },
  rapier: { id: 'rapier', name: 'Rapiers', blurb: 'Light feet, lighter blade.', perks: [p('attackSpeed', 0.006, 'Attack speed'), p('dodge', 0.02, 'Dodge recharge')] },
  twin_daggers: { id: 'twin_daggers', name: 'Twin Daggers', blurb: 'Quick in, quicker out.', perks: [p('attackSpeed', 0.006, 'Attack speed'), p('bleed', 0.02, 'Bleed buildup')] },
  spear: { id: 'spear', name: 'Spears', blurb: 'Keep them at arm’s length. Then a bit further.', perks: [p('reach', 0.008, 'Reach'), p('damage', 0.008, 'Damage')] },
  halberd: { id: 'halberd', name: 'Halberds', blurb: 'An axe that hired a spear.', perks: [p('reach', 0.008, 'Reach'), p('poise', 0.01, 'Poise damage')] },
  dawn_glaive: { id: 'dawn_glaive', name: 'Dawn Glaives', blurb: 'The arc of the blade follows the sun.', perks: [p('damage', 0.008, 'Damage'), p('reach', 0.006, 'Reach')] },
  whip: { id: 'whip', name: 'Whips', blurb: 'Every crack reaches a little further.', perks: [p('reach', 0.012, 'Reach'), p('attackSpeed', 0.005, 'Attack speed')] },
  bow: { id: 'bow', name: 'Bows', blurb: 'Breathe out. Let go.', perks: [p('damage', 0.01, 'Damage'), p('skillCooldown', 0.008, 'Skill cooldowns')] },
  crossbow: { id: 'crossbow', name: 'Crossbows', blurb: 'Point. Click. Problem solved.', perks: [p('damage', 0.01, 'Damage'), p('attackSpeed', 0.006, 'Reload speed')] },
  staff: { id: 'staff', name: 'Staffs', blurb: 'The words come quicker once you stop reading them.', perks: [p('spellCooldown', 0.008, 'Spell cooldowns'), p('spellPower', 0.008, 'Spell power')] },
  talisman: { id: 'talisman', name: 'Talismans', blurb: 'Faith is a muscle. Use it.', perks: [p('spellCooldown', 0.008, 'Spell cooldowns'), p('castSpeed', 0.006, 'Cast speed')] },
};

/**
 * Experience to go from level L − 1 to L: about 23 at level 1 (ten kills) up to 175 at level 50. All 50 levels take
 * about 4,950 experience: a clean playthrough (every room cleared once, every boss) gives about 1,370, so one class
 * used throughout reaches 50 around the end of New Game+ 2, a little sooner with all the refighting a real run has.
 */
export function profLevelCost(level: number): number {
  return Math.round(20 + 3.1 * level);
}

/** Level (0–50), experience into the current level and the cost of the next, from total experience. */
export function profLevel(xp: number): { level: number; into: number; next: number } {
  let level = 0;
  let left = Math.max(0, Math.floor(xp));
  while (level < PROF_MAX_LEVEL && left >= profLevelCost(level + 1)) {
    left -= profLevelCost(level + 1);
    level++;
  }
  return { level, into: level >= PROF_MAX_LEVEL ? 0 : left, next: level >= PROF_MAX_LEVEL ? 0 : profLevelCost(level + 1) };
}

/** Points in each perk at a level: odd levels the first perk, even levels the second. */
export function perkPoints(level: number): [number, number] {
  return [Math.ceil(level / 2), Math.floor(level / 2)];
}

/** Experience an enemy is worth when it dies. */
export function killXp(o: { isBoss: boolean; elite: boolean; role: string; mimic: boolean }): number {
  if (o.isBoss) return 30;
  if (o.elite || o.mimic) return 5;
  if (o.role === 'fodder' || o.role === 'swarm') return 1;
  return 2;
}

/** A weapon's own bar: experience to fill it at each rarity (legendary is the top); Common to Legendary is about half a playthrough. */
export const RARITY_XP: Partial<Record<Rarity, number>> = { common: 60, uncommon: 120, rare: 200, epic: 320 };

/** Glowen to raise an item from this rarity to the next (× 1 + 0.2 per item level above 1). */
export const RARITY_UPGRADE_COST: Partial<Record<Rarity, number>> = { common: 150, uncommon: 400, rare: 1000, epic: 2500 };

/** Weapon and staff damage by rarity (D178: rarity used to change only affixes and sockets). */
export const RARITY_POWER: Record<Rarity, number> = { common: 1, uncommon: 1.06, rare: 1.12, epic: 1.2, legendary: 1.28 };
