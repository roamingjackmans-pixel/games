// Set perks (D243): any piece of gear may carry one. Wear 3, 5 or 7 pieces with the same set perk (every slot in
// use counts: weapon, off hand, head, body, legs, all four rings) for a small, medium or large boost to one
// playstyle. Each step replaces the one before (the large one is the whole bonus, not added to the others). Only
// gear whose requirements you meet counts, as with every other buff (D88). Systems read the effect keys, never a
// set's id.
import type { Rarity } from '../game/types';

/** What a step gives. Fractions (0.1 = 10%) except dodgeS and parryS (seconds) and defense (flat, every type). */
export interface SetEffect {
  /** all damage */
  damagePct?: number;
  attackSpeedPct?: number;
  castSpeedPct?: number;
  /** spells deal and heal more */
  spellPowerPct?: number;
  /** weapon-skill cooldowns */
  skillCdrPct?: number;
  /** spell cooldowns */
  spellCdrPct?: number;
  /** seconds off the dodge recharge */
  dodgeS?: number;
  /** less stamina for everything */
  staminaCostPct?: number;
  staminaRegenPct?: number;
  lifestealPct?: number;
  poiseDamagePct?: number;
  maxHpPct?: number;
  /** flat defense against every damage type */
  defense?: number;
  /** less stamina lost blocking */
  blockStaminaPct?: number;
  /** seconds added to the parry window */
  parryS?: number;
  /** more status buildup (Bleed, Burn, Chill…) */
  statusBuildupPct?: number;
  /** the Thermos heals more */
  flaskPct?: number;
}

export interface SetPerkDef {
  id: string;
  name: string;
  /** the playstyle, one line */
  style: string;
  color: string;
  flavor: string;
  /** at 3, 5 and 7 pieces */
  steps: [SetEffect, SetEffect, SetEffect];
}

export const SET_STEPS = [3, 5, 7] as const;

const S = (d: SetPerkDef): SetPerkDef => d;

export const SET_PERKS: Record<string, SetPerkDef> = {
  counteroffer: S({
    id: 'counteroffer',
    name: 'Counteroffer',
    style: 'Parry and block',
    color: '#e8e1c8',
    flavor: 'Whatever they offer, you have a better one ready.',
    steps: [
      { parryS: 0.03, blockStaminaPct: 0.1 },
      { parryS: 0.06, blockStaminaPct: 0.2, damagePct: 0.05 },
      { parryS: 0.1, blockStaminaPct: 0.35, damagePct: 0.12 },
    ],
  }),
  moonlight_flit: S({
    id: 'moonlight_flit',
    name: 'Moonlight Flit',
    style: 'Dodging',
    color: '#8fd3ff',
    flavor: 'Gone before the rent is due. Gone before the hit lands.',
    steps: [
      { dodgeS: 0.3, staminaCostPct: 0.05 },
      { dodgeS: 0.6, staminaCostPct: 0.1, attackSpeedPct: 0.04 },
      { dodgeS: 1.0, staminaCostPct: 0.15, attackSpeedPct: 0.08 },
    ],
  }),
  eviction: S({
    id: 'eviction',
    name: 'Eviction',
    style: 'All-out attack',
    color: '#ff6a4a',
    flavor: 'Out. Now. Everything. Everyone.',
    steps: [
      { damagePct: 0.06, attackSpeedPct: 0.03 },
      { damagePct: 0.12, attackSpeedPct: 0.06, lifestealPct: 0.01 },
      { damagePct: 0.2, attackSpeedPct: 0.1, lifestealPct: 0.025 },
    ],
  }),
  squatters_rights: S({
    id: 'squatters_rights',
    name: "Squatter's Rights",
    style: 'Tanking',
    color: '#b0a07a',
    flavor: 'Possession is nine tenths of the law. The other tenth is armour.',
    steps: [
      { maxHpPct: 0.05, defense: 3 },
      { maxHpPct: 0.12, defense: 7, poiseDamagePct: 0.05 },
      { maxHpPct: 0.2, defense: 12, poiseDamagePct: 0.1 },
    ],
  }),
  fine_print: S({
    id: 'fine_print',
    name: 'Fine Print',
    style: 'Spellcasting',
    color: '#b06bff',
    flavor: 'Read it carefully. It reads you back.',
    steps: [
      { spellPowerPct: 0.06, castSpeedPct: 0.04 },
      { spellPowerPct: 0.12, castSpeedPct: 0.08, spellCdrPct: 0.05 },
      { spellPowerPct: 0.2, castSpeedPct: 0.12, spellCdrPct: 0.12 },
    ],
  }),
  late_fees: S({
    id: 'late_fees',
    name: 'Late Fees',
    style: 'Bleed, burn and other ailments',
    color: '#d0405a',
    flavor: 'They add up. Then they add up some more.',
    steps: [
      { statusBuildupPct: 0.15 },
      { statusBuildupPct: 0.35, lifestealPct: 0.01 },
      { statusBuildupPct: 0.6, lifestealPct: 0.02, damagePct: 0.05 },
    ],
  }),
  handyman: S({
    id: 'handyman',
    name: 'Handyman',
    style: 'Weapon skills',
    color: '#e8c25a',
    flavor: 'Has the right tool for it. Has three, in fact.',
    steps: [
      { skillCdrPct: 0.06 },
      { skillCdrPct: 0.12, staminaCostPct: 0.05 },
      { skillCdrPct: 0.2, staminaCostPct: 0.1, damagePct: 0.05 },
    ],
  }),
  demolition: S({
    id: 'demolition',
    name: 'Demolition',
    style: 'Heavy hits and staggers',
    color: '#c98a4a',
    flavor: 'Load-bearing walls are a suggestion.',
    steps: [
      { poiseDamagePct: 0.1 },
      { poiseDamagePct: 0.25, damagePct: 0.04 },
      { poiseDamagePct: 0.4, damagePct: 0.1, maxHpPct: 0.05 },
    ],
  }),
  tea_break: S({
    id: 'tea_break',
    name: 'Tea Break',
    style: 'Healing and staying power',
    color: '#7ee08a',
    flavor: 'Nothing is so urgent it cannot wait for the kettle.',
    steps: [
      { flaskPct: 0.1, staminaRegenPct: 0.08 },
      { flaskPct: 0.2, staminaRegenPct: 0.15, lifestealPct: 0.01 },
      { flaskPct: 0.35, staminaRegenPct: 0.25, lifestealPct: 0.02 },
    ],
  }),
};

export const SET_PERK_IDS = Object.keys(SET_PERKS);

/** D245: every chance 35% lower than D243's (12 / 22 / 32 / 45%). */
const SET_PERK_RATE = 0.65;

/** The chance a piece of this rarity rolls a set perk (D243, D245): about 7.8 / 14.3 / 20.8 / 29.3%. */
export const SET_PERK_CHANCE: Record<Rarity, number> = {
  common: 0,
  uncommon: 0.12 * SET_PERK_RATE,
  rare: 0.22 * SET_PERK_RATE,
  epic: 0.32 * SET_PERK_RATE,
  legendary: 0.45 * SET_PERK_RATE,
};

/** Which step a count of pieces reaches: 0 none, 1 small (3+), 2 medium (5+), 3 large (7+). */
export function setStep(count: number): 0 | 1 | 2 | 3 {
  return count >= SET_STEPS[2] ? 3 : count >= SET_STEPS[1] ? 2 : count >= SET_STEPS[0] ? 1 : 0;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

/** One step's effect as text: "+12% damage, −0.6 s dodge recharge". */
export function setEffectText(e: SetEffect): string {
  const out: string[] = [];
  if (e.damagePct) out.push(`+${pct(e.damagePct)} damage`);
  if (e.attackSpeedPct) out.push(`+${pct(e.attackSpeedPct)} attack speed`);
  if (e.castSpeedPct) out.push(`+${pct(e.castSpeedPct)} cast speed`);
  if (e.spellPowerPct) out.push(`+${pct(e.spellPowerPct)} spell power`);
  if (e.skillCdrPct) out.push(`−${pct(e.skillCdrPct)} skill cooldowns`);
  if (e.spellCdrPct) out.push(`−${pct(e.spellCdrPct)} spell cooldowns`);
  if (e.dodgeS) out.push(`−${e.dodgeS.toFixed(1)} s dodge recharge`);
  if (e.staminaCostPct) out.push(`−${pct(e.staminaCostPct)} stamina costs`);
  if (e.staminaRegenPct) out.push(`+${pct(e.staminaRegenPct)} stamina regen`);
  if (e.lifestealPct) out.push(`${(e.lifestealPct * 100).toFixed(1).replace(/\.0$/, '')}% life steal`);
  if (e.poiseDamagePct) out.push(`+${pct(e.poiseDamagePct)} poise damage`);
  if (e.maxHpPct) out.push(`+${pct(e.maxHpPct)} max HP`);
  if (e.defense) out.push(`+${e.defense} defense (all)`);
  if (e.blockStaminaPct) out.push(`−${pct(e.blockStaminaPct)} stamina lost blocking`);
  if (e.parryS) out.push(`+${e.parryS.toFixed(2)} s parry window`);
  if (e.statusBuildupPct) out.push(`+${pct(e.statusBuildupPct)} status buildup`);
  if (e.flaskPct) out.push(`Thermos heals +${pct(e.flaskPct)}`);
  return out.join(', ');
}
