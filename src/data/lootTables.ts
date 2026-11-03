// CONTENT_ITEMS §3: rarity weights by source, drop chances, slot weights; GAME_DESIGN §8.5 gem rates.
import type { Rarity } from '../game/types';

export type LootSource = 'fodder' | 'brute' | 'elite' | 'chestSmall' | 'chestTreasure' | 'mimic' | 'boss' | 'shop' | 'gary';

/** Weights for common / uncommon / rare / epic / legendary. */
export const RARITY_WEIGHTS: Record<LootSource, [number, number, number, number, number]> = {
  fodder: [60, 27, 9, 3.2, 0.8],
  brute: [45, 32, 15, 6, 2],
  elite: [0, 30, 45, 20, 5],
  chestSmall: [25, 40, 25, 8, 2],
  chestTreasure: [0, 35, 40, 20, 5],
  mimic: [0, 20, 45, 27, 8],
  boss: [0, 0, 50, 38, 12],
  shop: [0, 40, 45, 15, 0],
  gary: [0, 0, 0, 70, 30],
};

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Drop chance per kill by role (GAME_DESIGN §8.2). */
export const DROP_CHANCE = { fodder: 0.18, swarm: 0.04, other: 0.3, elite: 1, boss: 1, bossSecond: 0.5 };

/** Item slot roll (CONTENT_ITEMS §3). Off-hand 25% = shield 15, staff 5, talisman 5. */
export const SLOT_WEIGHTS: { slot: 'weapon' | 'shield' | 'staff' | 'talisman' | 'head' | 'body' | 'legs' | 'ring'; w: number }[] = [
  { slot: 'weapon', w: 35 },
  { slot: 'shield', w: 15 },
  { slot: 'staff', w: 5 },
  { slot: 'talisman', w: 5 },
  { slot: 'head', w: 12 },
  { slot: 'body', w: 14 },
  { slot: 'legs', w: 10 },
  { slot: 'ring', w: 4 },
];

/** Gem drop chances (GAME_DESIGN §8.5). */
export const GEM_CHANCE = { enemy: 0.02, chest: 0.12, boss: 1 };
/** Chests: 8% a consumable bundle of 3–6 of one kind; fodder 3% a single knife or bomb (CONTENT_ITEMS §12). */
export const CONSUMABLE_CHANCE = { chestBundle: 0.08, fodderSingle: 0.03 };
/** Rare "Glowen Wisp" drops. */
export const GLOWEN_WISP_CHANCE = 0.01;
/** Bosses: 10% Tear of Undoing; spell reliquaries 5% a Tear instead of a spell. */
export const TEAR_CHANCE = { boss: 0.1, reliquary: 0.05 };
