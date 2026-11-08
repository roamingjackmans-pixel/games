// The bonfire shop (GAME_DESIGN §9.1, D20): throwables, one one-perk gem per zone, and one rotating gear piece
// at the zone's item level, re-rolled on every rest. Spells are never sold.
import { stream } from '../../engine/rng';
import { GEM_FAMILIES, gemDropLevel, gemQualityRolls, makeGem, rollGemQuality } from '../../data/gems';
import { CONSUMABLES, CONSUMABLE_IDS } from '../../data/consumables';
import { itemLevelFor, gemSellTotal, GEM_PERK_PRICE } from '../combat/formulas';
import { generateItem } from '../items/generate';
import { itemSellValue } from '../items/inventory';
import type { ConsumableId, Gem, Item, WorldState } from '../types';

/** The zone's shop gem: one perk, weapon or armor (multi-perk gems come from drops and Gary only). */
export function shopGem(seed: string, zone: number, cycle: number): Gem {
  const rng = stream(seed, `shopgem:${zone}:${cycle}`);
  const family = rng.pick(GEM_FAMILIES);
  const level = gemDropLevel(rng, zone, cycle);
  return makeGem(family, { level, q: rollGemQuality(rng, gemQualityRolls(level)) });
}
export function shopGemPrice(gem?: Gem): number {
  return (gem ? gemSellTotal(gem) : GEM_PERK_PRICE) * 3;
}

export function shopConsumables(): { id: ConsumableId; price: number }[] {
  return CONSUMABLE_IDS.filter((id) => CONSUMABLES[id].price !== null).map((id) => ({ id, price: CONSUMABLES[id].price! }));
}

/** Price for the rotating piece: 4× its sell value. */
export function shopItemPrice(item: Item): number {
  return Math.max(100, itemSellValue(item) * 4);
}

/** Re-roll the rotating piece at a bonfire (called on every rest). */
export function rollShopPiece(ws: WorldState, bonfireId: string, zone: number, cycle: number): Item {
  const entry = (ws.shopStock[bonfireId] ??= { item: null, rolls: 0 });
  entry.rolls = (entry.rolls ?? 0) + 1;
  const rng = stream(ws.seed, `shop:${bonfireId}:${cycle}:${entry.rolls}`);
  // NG+ improves stock: one tier better on cycles ≥ 1
  const item = generateItem(rng, { source: 'shop', ilvl: itemLevelFor(zone, cycle), zone, ...(cycle > 0 ? { minRarity: 'rare' as const } : {}) });
  entry.item = item;
  entry.sold = false;
  return item;
}

export function shopPiece(ws: WorldState, bonfireId: string, zone: number, cycle: number): Item | null {
  const e = ws.shopStock[bonfireId];
  if (!e) return rollShopPiece(ws, bonfireId, zone, cycle);
  return e.sold ? null : e.item;
}
