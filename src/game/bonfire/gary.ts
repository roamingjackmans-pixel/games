// Gary, the wandering merchant (GAME_DESIGN §11, CONTENT_ITEMS §3): 3–5 special things for Glowen in a
// merchant room. The stock is rolled once per zone and cycle from the world seed and kept in the save, so
// it is the same every visit; sold entries stay sold. NG+ stock is better (more Legendaries, gems +1 tier).
import { stream } from '../../engine/rng';
import { CONSUMABLE_IDS, CONSUMABLES } from '../../data/consumables';
import { gemDropLevel, gemKindLabel, gemTitle } from '../../data/gems';
import { itemLevelFor, gemSellTotal } from '../combat/formulas';
import { generateItem, randomGem } from '../items/generate';
import { itemSellValue } from '../items/inventory';
import type { Character, GaryStockEntry, WorldState } from '../types';

export const GARY_HITS_TO_LEAVE = 3;

export function garyStock(ws: WorldState, zone: number, cycle: number): GaryStockEntry[] {
  const key = `z${zone}c${cycle}`;
  const have = ws.garyStock[key];
  if (have) return have;
  const rng = stream(ws.seed, `gary:${zone}:${cycle}`);
  const ilvl = itemLevelFor(zone, cycle) + 1;
  const pool: (() => GaryStockEntry)[] = [
    () => {
      const item = generateItem(rng, { source: 'gary', ilvl, zone, ...(cycle > 0 && rng.chance(0.5) ? { rarity: 'legendary' as const } : {}) });
      return { kind: 'item', item, price: Math.max(400, itemSellValue(item) * 5), sold: false };
    },
    () => {
      const tier = Math.min(5, (rng.chance(0.6) ? 2 : 3) + (cycle > 0 ? 1 : 0)) as 2 | 3 | 4;
      const gem = randomGem(rng, tier, cycle, undefined, gemDropLevel(rng, zone, cycle));
      return { kind: 'gem', gem, price: gemSellTotal(gem) * 3, sold: false };
    },
    () => {
      const ids = CONSUMABLE_IDS.filter((id) => CONSUMABLES[id].price !== null);
      const id = rng.pick(ids);
      return { kind: 'consumable', consumable: id, count: 3, price: Math.round((CONSUMABLES[id].price ?? 50) * 3 * 1.5), sold: false };
    },
    () => {
      const item = generateItem(rng, { source: 'gary', ilvl, zone, baseId: 'lucky_charm', rarity: 'uncommon' });
      return { kind: 'ring', item, price: 450 * zone, sold: false };
    },
  ];
  const n = rng.int(3, 5);
  const out: GaryStockEntry[] = [pool[0]!(), pool[1]!(), pool[2]!()];
  if (n >= 4) out.push(pool[3]!());
  if (n >= 5) out.push(rng.chance(0.5) ? pool[0]!() : pool[2]!());
  // a Tear of Undoing, sometimes (rare)
  if (rng.chance(0.2 + (cycle > 0 ? 0.1 : 0))) out.push({ kind: 'tear', price: 2000 * zone, sold: false });
  ws.garyStock[key] = out;
  return out;
}

export function garyEntryName(e: GaryStockEntry): string {
  switch (e.kind) {
    case 'item':
    case 'ring':
      return e.item?.name ?? 'Something';
    case 'gem':
      return e.gem ? `${gemKindLabel(e.gem)}: ${gemTitle(e.gem)}` : 'A gem';
    case 'consumable':
      return `${e.count ?? 1}× ${e.consumable ? CONSUMABLES[e.consumable].name : 'thing'}`;
    case 'tear':
      return 'Tear of Undoing';
  }
}

/** Buy one entry: Glowen out, the thing in, the entry marked sold. */
export function buyFromGary(c: Character, e: GaryStockEntry): { ok: boolean; msg: string } {
  if (e.sold) return { ok: false, msg: 'Sold.' };
  if (c.glowen < e.price) return { ok: false, msg: `Needs ${e.price} Glowen.` };
  if ((e.kind === 'item' || e.kind === 'ring') && c.bag.length >= 60) return { ok: false, msg: 'Your bag is full.' };
  c.glowen -= e.price;
  e.sold = true;
  if ((e.kind === 'item' || e.kind === 'ring') && e.item) c.bag.push(e.item);
  else if (e.kind === 'gem' && e.gem) c.gems.push({ perks: e.gem.perks.map((p) => ({ ...p })) });
  else if (e.kind === 'consumable' && e.consumable) {
    c.consumables[e.consumable] = Math.min(10, (c.consumables[e.consumable] ?? 0) + (e.count ?? 1));
    if (!c.quickSlot) c.quickSlot = e.consumable;
  } else if (e.kind === 'tear') c.tears++;
  return { ok: true, msg: `Bought ${garyEntryName(e)}. "Pleasure."` };
}
