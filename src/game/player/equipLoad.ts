// Equip load (D82): every item has a weight; the total against a max from Endurance sets a tier that changes
// walking speed, dodge distance and dodge invulnerability. The weapon not in hand (the quick-swap slot) is not
// counted, so swapping weapons can change the tier.
import { WEAPONS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { armorPieceWeight } from '../../data/armor';
import { maxEquipLoad } from '../combat/formulas';
import type { Character, Item } from '../types';

export type LoadTier = 'light' | 'medium' | 'heavy' | 'encumbered';
export const LOAD_TIERS_ORDER: readonly LoadTier[] = ['light', 'medium', 'heavy', 'encumbered'];

export interface LoadEffects {
  label: string;
  /** walking speed multiplier */
  speed: number;
  /** dodge distance multiplier */
  dodge: number;
  /** dodge invulnerability time multiplier */
  iframes: number;
  /** one line for the inventory: what this tier is doing to you */
  text: string;
  color: string;
}

export const LOAD_TIERS: Record<LoadTier, LoadEffects> = {
  light: { label: 'Light', speed: 1.1, dodge: 1.1, iframes: 1.2, text: '+10% move speed, +10% dodge distance, +20% dodge invulnerability', color: '#7ee08a' },
  medium: { label: 'Medium', speed: 1, dodge: 1, iframes: 1, text: 'Normal move speed, dodge distance and dodge invulnerability', color: '#e8e1c8' },
  heavy: { label: 'Heavy', speed: 0.9, dodge: 0.8, iframes: 0.8, text: '−10% move speed, −20% dodge distance, −20% dodge invulnerability', color: '#ffb35a' },
  encumbered: { label: 'Encumbered', speed: 0.5, dodge: 0.5, iframes: 0.5, text: 'Half move speed, half dodge distance, half dodge invulnerability', color: '#ff5a4a' },
};

/** Light under 25%, Medium to 70%, Heavy to 100%, Encumbered above. */
export function loadTier(frac: number): LoadTier {
  if (frac < 0.25) return 'light';
  if (frac <= 0.7) return 'medium';
  if (frac <= 1) return 'heavy';
  return 'encumbered';
}

export const RING_WEIGHT = 0.2;

/** Every item weighs this much more than its table says (D163, owner's request: everything 20% heavier). */
export const ITEM_WEIGHT_MULT = 1.2;

/** One item's weight (one decimal), as listed in its table, before ITEM_WEIGHT_MULT. */
function baseWeight(item: Item): number {
  const w = WEAPONS[item.baseId];
  if (w) return w.weight;
  const s = SHIELDS[item.baseId];
  if (s) return s.weight;
  const t = CASTING_TOOLS[item.baseId];
  if (t) return t.weight;
  if (item.kind === 'armor') return armorPieceWeight(item.baseId);
  if (item.kind === 'ring') return RING_WEIGHT;
  return 0;
}

/** One item's weight (one decimal). */
export function itemWeight(item: Item | null | undefined): number {
  if (!item) return 0;
  return Math.round(baseWeight(item) * ITEM_WEIGHT_MULT * 10) / 10;
}

export interface EquipLoadInfo {
  load: number;
  max: number;
  frac: number;
  tier: LoadTier;
  effects: LoadEffects;
}

type Equipped = Pick<Character['equipment'], 'main' | 'off' | 'head' | 'body' | 'legs' | 'ring1' | 'ring2'>;

/** Equip load of the worn set: the weapon in hand, off hand, armor and rings (never the quick-swap weapon). */
export function equipLoadOf(eq: Equipped, endurance: number): EquipLoadInfo {
  let load = 0;
  for (const it of [eq.main, eq.off, eq.head, eq.body, eq.legs, eq.ring1, eq.ring2]) load += itemWeight(it);
  load = Math.round(load * 10) / 10;
  const max = Math.round(maxEquipLoad(endurance) * 10) / 10;
  const frac = max > 0 ? load / max : 2;
  const tier = loadTier(frac);
  return { load, max, frac, tier, effects: LOAD_TIERS[tier] };
}

/** The same, if `item` were worn in `slot` instead of what is there (tooltip previews). */
export function equipLoadWith(c: Character, endurance: number, slot: keyof Equipped, item: Item | null): EquipLoadInfo {
  return equipLoadOf({ ...c.equipment, [slot]: item }, endurance);
}

/** "12.4 / 38.0" */
export function fmtLoad(info: EquipLoadInfo): string {
  return `${info.load.toFixed(1)} / ${info.max.toFixed(1)}`;
}
