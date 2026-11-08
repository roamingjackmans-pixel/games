// Soul Essence (D198): what is left of somebody when the Landlord's staff have taken all their Glowen. Glowen is rent;
// the soul is the bit that never paid. Five tiers, one per playthrough, spent with Glowen at a bonfire to reinforce
// weapons, shields, staffs, talismans and armour (D227) from +0 to +15. It cannot be sold: nobody down here will touch it but the fires.

export type EssenceTier = 1 | 2 | 3 | 4 | 5;

export interface EssenceDef {
  tier: EssenceTier;
  name: string;
  color: string;
  /** one line of lore for the tooltip and the bonfire */
  blurb: string;
}

export const ESSENCES: readonly EssenceDef[] = [
  { tier: 1, name: 'Tenant’s Wisp', color: '#bfe6ff', blurb: 'Somebody who could not make rent. Went hollow paying it anyway. This bit stayed behind.' },
  { tier: 2, name: 'Lodger’s Ember', color: '#8fd06a', blurb: 'A soul that has been evicted once and came back down the stairs. Warmer for it.' },
  { tier: 3, name: 'Caretaker’s Flame', color: '#ffb04a', blurb: 'One of the Joes who lit the fires. Still tidying up after everyone.' },
  { tier: 4, name: 'Superintendent’s Blaze', color: '#ff5a7a', blurb: 'Kept the whole building running for years. The Landlord sent three staff to collect it. None came back.' },
  { tier: 5, name: 'Freeholder’s Soul', color: '#e8d0ff', blurb: 'Owned outright. No lease, no rent, no Landlord. It does not glow; everything near it does.' },
];

export function essenceDef(tier: number): EssenceDef {
  return ESSENCES[Math.max(1, Math.min(5, Math.round(tier))) - 1]!;
}

/** The tier found here, or 0 (D198): none in zones 1–3 of the first playthrough, Tier 1 from zone 4, then one tier per New Game+ cycle (5 from NG+4 on). */
export function essenceTierFor(zone: number, cycle: number): 0 | EssenceTier {
  if (cycle <= 0) return zone >= 4 ? 1 : 0;
  return Math.min(5, cycle + 1) as EssenceTier;
}

// ---------- reinforcement (+0 … +15) ----------

export const MAX_REINFORCE = 15;

/** Armour and shields: +1 is 20% stronger, +15 is four times the item (D198). */
export function reinforceMult(plus: number | undefined): number {
  return 1 + 0.2 * Math.max(0, Math.min(MAX_REINFORCE, plus ?? 0));
}

/** Weapons, staffs and talismans: +1 is 15% more damage, +15 is ×3.25 (D303; was 20% like armour). */
export const REINFORCE_DMG_STEP = 0.15;
export function reinforceDmgMult(plus: number | undefined): number {
  return 1 + REINFORCE_DMG_STEP * Math.max(0, Math.min(MAX_REINFORCE, plus ?? 0));
}

/**
 * The reinforcement a player can have reached by a zone (D303): Tier 1 Essence from zone 4 pays to +3 in the first
 * playthrough; each New Game+ cycle's new tier pays three more, reached over its first zones.
 */
export function expectedReinforce(zone: number, cycle: number): number {
  const cap = (c: number): number => {
    const tier = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8].map((z) => essenceTierFor(z, c)));
    return Math.min(MAX_REINFORCE, 3 * tier);
  };
  if (cycle <= 0) return zone >= 4 ? Math.min(cap(0), zone - 3) : 0;
  return Math.min(cap(cycle), cap(cycle - 1) + zone);
}

/**
 * Enemy HP × this (D303): weapon reinforcement was cut from 20% to 15% a step, so enemies lose the same share of HP a
 * player at the expected reinforcement for that zone lost in damage (about 9% by the end of the first playthrough,
 * about 19% once +15 is reachable). Time to kill stays as it was.
 */
export function reinforceHpFactor(zone: number, cycle: number): number {
  const p = expectedReinforce(zone, cycle);
  return reinforceDmgMult(p) / reinforceMult(p);
}

/** Going from `plus` to `plus + 1`: 1, then 2, then 3 Essence of one tier, a new tier every three levels. */
export function reinforceNeed(plus: number): { tier: EssenceTier; count: number } {
  return { tier: (Math.floor(plus / 3) + 1) as EssenceTier, count: (plus % 3) + 1 };
}

/** The Glowen paid alongside: 100 for +1, ×1.45 a level (about 18,000 for the last step). */
/** Reinforcing costs 4× the Glowen it did (D309): the main thing Glowen is for. */
export const REINFORCE_GLOWEN_MULT = 4;
export function reinforceGlowen(plus: number): number {
  return Math.round(100 * REINFORCE_GLOWEN_MULT * Math.pow(1.45, plus));
}

/** Essence held, Tier 1 first (older saves have none). */
export function essenceCounts(c: { essence?: number[] }): number[] {
  const e = c.essence ?? [];
  return [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.floor(e[i] ?? 0)));
}

/**
 * Pay `count` Essence of `tier`, breaking higher tiers 3:1 into lower ones when short (the change stays in the
 * bag). Returns the new counts, or null when even the higher tiers cannot cover it. Lower tiers never pay for higher.
 */
export function payEssence(have: number[], tier: number, count: number): number[] | null {
  const e = [...have];
  const t = tier - 1;
  while (e[t]! < count) {
    // break the nearest higher Essence down one tier at a time
    let up = t + 1;
    while (up < 5 && e[up]! === 0) up++;
    if (up >= 5) return null;
    e[up]!--;
    e[up - 1]! += 3;
  }
  e[t]! -= count;
  return e;
}

/** Can these counts pay for that (counting higher tiers 3:1)? */
export function canPayEssence(have: number[], tier: number, count: number): boolean {
  return payEssence(have, tier, count) !== null;
}

/** "Longsword +3" (no suffix at +0). */
export function plusName(it: { name: string; plus?: number }): string {
  return it.plus ? `${it.name} +${it.plus}` : it.name;
}
