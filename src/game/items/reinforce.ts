// Reinforcing gear with Soul Essence and Glowen at a bonfire (D198): weapons, shields and armour go from +0 to +15,
// each level 20% stronger (four times at +15). Each step costs 1, 2, then 3 Essence of one tier (six per tier, a new
// tier every three levels) plus Glowen; a higher tier pays for a lower one at 3:1.
import { MAX_REINFORCE, essenceCounts, essenceDef, payEssence, reinforceGlowen, reinforceMult, reinforceNeed } from '../../data/essence';
import { findItem } from './inventory';
import type { Character, Item } from '../types';

/** Weapons, shields, armour, and (D227) staffs and talismans, whose spell power each + raises. */
export function canReinforce(it: Item): boolean {
  return it.kind === 'weapon' || it.kind === 'shield' || it.kind === 'armor' || it.kind === 'staff' || it.kind === 'talisman';
}

export interface ReinforceInfo {
  plus: number;
  /** null at +15 */
  next: { tier: number; count: number; glowen: number; name: string } | null;
  /** strength now and after the next step (×1 … ×4) */
  mult: number;
  nextMult: number;
  /** enough Essence (counting higher tiers 3:1) and Glowen for the next step */
  affordable: boolean;
}

export function reinforceInfo(c: Character, it: Item): ReinforceInfo {
  const plus = Math.max(0, Math.min(MAX_REINFORCE, it.plus ?? 0));
  if (plus >= MAX_REINFORCE) return { plus, next: null, mult: reinforceMult(plus), nextMult: reinforceMult(plus), affordable: false };
  const need = reinforceNeed(plus);
  const glowen = reinforceGlowen(plus);
  const affordable = c.glowen >= glowen && payEssence(essenceCounts(c), need.tier, need.count) !== null;
  return { plus, next: { ...need, glowen, name: essenceDef(need.tier).name }, mult: reinforceMult(plus), nextMult: reinforceMult(plus + 1), affordable };
}

/**
 * Break Soul Essence down by hand (D285): each one of `tier` (2–5) becomes three of the tier below. `all` breaks every
 * one of that tier, else one.
 */
export function breakDownEssence(c: Character, tier: number, all = false): { ok: boolean; msg: string } {
  if (!Number.isInteger(tier) || tier < 2 || tier > 5) return { ok: false, msg: 'Only Tier 2 and higher Essence breaks down.' };
  const e = essenceCounts(c);
  const have = e[tier - 1]!;
  if (have <= 0) return { ok: false, msg: `You have no ${essenceDef(tier).name}.` };
  const n = all ? have : 1;
  e[tier - 1] = have - n;
  e[tier - 2]! += 3 * n;
  c.essence = e;
  return { ok: true, msg: `${n} × ${essenceDef(tier).name} → ${3 * n} × ${essenceDef(tier - 1).name}.` };
}

/** Reinforce one item a level, paying its Essence (breaking higher tiers if needed) and Glowen. */
export function reinforceItem(c: Character, itemId: string): { ok: boolean; msg: string } {
  const it = findItem(c, itemId);
  if (!it) return { ok: false, msg: 'That item is not with you.' };
  if (!canReinforce(it)) return { ok: false, msg: 'Only weapons, shields and armour take Soul Essence.' };
  const info = reinforceInfo(c, it);
  if (!info.next) return { ok: false, msg: `${it.name} is already +${MAX_REINFORCE}.` };
  const paid = payEssence(essenceCounts(c), info.next.tier, info.next.count);
  if (!paid) return { ok: false, msg: `Needs ${info.next.count} × ${info.next.name} (Tier ${info.next.tier}) or higher.` };
  if (c.glowen < info.next.glowen) return { ok: false, msg: `Not enough Glowen (${info.next.glowen} needed).` };
  c.essence = paid;
  c.glowen -= info.next.glowen;
  it.plus = info.plus + 1;
  return { ok: true, msg: `${it.name} is now +${it.plus}.` };
}
