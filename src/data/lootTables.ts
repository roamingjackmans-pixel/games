// CONTENT_ITEMS §3: rarity weights by source, drop chances, slot weights; GAME_DESIGN §8.5 gem rates.
import type { Rarity } from '../game/types';

export type LootSource = 'fodder' | 'brute' | 'elite' | 'chestSmall' | 'chestTreasure' | 'mimic' | 'boss' | 'shop' | 'gary';

/**
 * Weights for common (white) / uncommon (green) / rare (blue) / epic (purple) / legendary (orange), in percent.
 * Enemy rows follow the owner's table (D84): every standard enemy (fodder and brute alike) 70 / 22 / 5 / 2.5 / 0.5,
 * Elites 45 / 35 / 12.5 / 6 / 1.5, bosses 20 / 35 / 30 / 11 / 4.
 */
export const RARITY_WEIGHTS: Record<LootSource, [number, number, number, number, number]> = {
  fodder: [70, 22, 5, 2.5, 0.5],
  brute: [70, 22, 5, 2.5, 0.5],
  elite: [45, 35, 12.5, 6, 1.5],
  chestSmall: [25, 40, 25, 8, 2],
  chestTreasure: [20, 35, 30, 11, 4], // D98: the treasure room's chest rolls like a boss (was 0 / 35 / 40 / 20 / 5)
  mimic: [0, 20, 45, 27, 8],
  boss: [20, 35, 30, 11, 4],
  shop: [0, 40, 45, 15, 0],
  gary: [0, 0, 0, 70, 30],
};

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * Item drop chance per kill (D84): standard enemies rarely drop anything, Elites a little more often (swarm pieces
 * count as a fraction of a body). Bosses drop 2–5 items per player.
 */
export const DROP_CHANCE = { fodder: 0.06, swarm: 0.015, other: 0.06, elite: 0.15, bossMin: 2, bossMax: 5 };
/** Every kill sheds a puff of Glowen (D83) at this chance; amount (4 + 2 × zone) × the role's share. */
export const GLOWEN_PUFF = { chance: 0.35, swarm: 0.3, fodder: 1, other: 1.5, elite: 4 };

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

/** Gem drop chances (GAME_DESIGN §8.5; D281: 35% fewer, was 2% / 12% / every boss). */
export const GEM_CHANCE = { enemy: 0.013, chest: 0.078, boss: 0.65 };
/** Chests: 8% a consumable bundle of 3–6 of one kind; fodder 3% a single knife or bomb (CONTENT_ITEMS §12). */
export const CONSUMABLE_CHANCE = { chestBundle: 0.08, fodderSingle: 0.03 };
/** Rare "Glowen Wisp" drops. */
export const GLOWEN_WISP_CHANCE = 0.01;
/** Bosses: 10% Tear of Undoing; spell reliquaries 5% a Tear instead of a spell. */
export const TEAR_CHANCE = { boss: 0.1, reliquary: 0.05 };
