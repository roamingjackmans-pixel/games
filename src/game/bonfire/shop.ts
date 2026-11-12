// The bonfire shop (GAME_DESIGN §9.1, D20): throwables, one one-perk gem per zone, and one rotating gear piece
// at the zone's item level. Each zone has its own stock, and a piece or gem changes only once it is bought (D357). Spells are never sold.
import { stream } from '../../engine/rng';
import { GEM_FAMILIES, gemDropLevel, gemQualityRolls, makeGem, rollGemQuality } from '../../data/gems';
import { CONSUMABLES, CONSUMABLE_IDS } from '../../data/consumables';
import { buyPrice, itemLevelFor, gemSellTotal, GEM_PERK_PRICE } from '../combat/formulas';
import { generateItem } from '../items/generate';
import { itemSellValue } from '../items/inventory';
import type { ConsumableId, Gem, Item, WorldState } from '../types';

/** One stock entry for a zone and cycle (D357): every bonfire of the zone sells the same things. */
export const shopKey = (zone: number, cycle: number): string => `z${zone}c${cycle}`;

/** How many shop gems this zone has sold (D357): the next one is rolled after each purchase. */
export function shopGemBuys(ws: WorldState, zone: number, cycle: number): number {
  return ws.shopStock[shopKey(zone, cycle)]?.gemBuys ?? 0;
}
export function noteShopGemBought(ws: WorldState, zone: number, cycle: number): void {
  const e = (ws.shopStock[shopKey(zone, cycle)] ??= { item: null, rolls: 0 });
  e.gemBuys = (e.gemBuys ?? 0) + 1;
}

/**
 * The zone's shop gem: one perk, weapon or armor (multi-perk gems come from drops and Gary only). The same until it is
 * bought, then the next one (`bought` counts the sales); each zone and cycle has its own (D357).
 */
export function shopGem(seed: string, zone: number, cycle: number, bought = 0): Gem {
  const rng = stream(seed, bought > 0 ? `shopgem:${zone}:${cycle}:${bought}` : `shopgem:${zone}:${cycle}`);
  const family = rng.pick(GEM_FAMILIES);
  const level = gemDropLevel(rng, zone, cycle);
  return makeGem(family, { level, q: rollGemQuality(rng, gemQualityRolls(level)) });
}
export function shopGemPrice(gem?: Gem): number {
  return buyPrice((gem ? gemSellTotal(gem) : GEM_PERK_PRICE) * 3);
}

export function shopConsumables(): { id: ConsumableId; price: number }[] {
  return CONSUMABLE_IDS.filter((id) => CONSUMABLES[id].price !== null).map((id) => ({ id, price: buyPrice(CONSUMABLES[id].price!) }));
}

/** Price for the rotating piece: 4× its sell value. */
export function shopItemPrice(item: Item): number {
  return buyPrice(Math.max(100, itemSellValue(item) * 4));
}

/** Roll the zone's rotating piece (D357): the first time it is asked for, and again after each purchase. */
export function rollShopPiece(ws: WorldState, zone: number, cycle: number): Item {
  const entry = (ws.shopStock[shopKey(zone, cycle)] ??= { item: null, rolls: 0 });
  entry.rolls = (entry.rolls ?? 0) + 1;
  const rng = stream(ws.seed, `shop:z${zone}:${cycle}:${entry.rolls}`);
  // NG+ improves stock: one tier better on cycles ≥ 1
  const item = generateItem(rng, { source: 'shop', ilvl: itemLevelFor(zone, cycle), zone, ...(cycle > 0 ? { minRarity: 'rare' as const } : {}) });
  entry.item = item;
  delete entry.sold;
  return item;
}

/** The zone's rotating piece: kept across rests and fires until bought or you leave for another zone (D357). */
export function shopPiece(ws: WorldState, zone: number, cycle: number): Item {
  const e = ws.shopStock[shopKey(zone, cycle)];
  return e?.item ?? rollShopPiece(ws, zone, cycle);
}
