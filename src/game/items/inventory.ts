// Inventory operations on a Character (bag of 60, equipment, gems, consumables). Pure and validated:
// the co-op host runs the same functions to check guests' commands (NETCODE §6).
import { GEMS, GEM_FAMILIES, WEAPON_GEM_FAMILIES } from '../../data/gems';
import { CONSUMABLES, MAX_CONSUMABLE } from '../../data/consumables';
import { gearSellValue, gemRerollCost, gemSellValue, gemUpgradeCost, levelCost } from '../combat/formulas';
import { canRaise, levelFromStats, respecStats } from '../player/character';
import type { Rng } from '../../engine/rng';
import type { Character, ConsumableId, Gem, Item, StatId } from '../types';

export const BAG_SIZE = 60;
export type EquipSlot = keyof Character['equipment'] | 'altMain';

export interface OpResult {
  ok: boolean;
  msg: string;
}
const ok = (msg = ''): OpResult => ({ ok: true, msg });
const no = (msg: string): OpResult => ({ ok: false, msg });

export function findInBag(c: Character, itemId: string): number {
  return c.bag.findIndex((i) => i.id === itemId);
}

/** Which equipment slot an item goes to by default. */
export function defaultSlotFor(c: Character, item: Item): EquipSlot | null {
  switch (item.slot) {
    case 'main':
      return 'main';
    case 'off':
      return 'off';
    case 'head':
    case 'body':
    case 'legs':
      return item.slot;
    case 'ring':
      return !c.equipment.ring1 ? 'ring1' : !c.equipment.ring2 ? 'ring2' : 'ring1';
  }
}

function slotAccepts(slot: EquipSlot, item: Item): boolean {
  if (slot === 'altMain' || slot === 'main') return item.slot === 'main';
  if (slot === 'ring1' || slot === 'ring2') return item.slot === 'ring';
  return item.slot === slot;
}

/** Equip an item from the bag (requirements are not enforced: penalties apply instead, D37). */
export function equip(c: Character, itemId: string, slot?: EquipSlot): OpResult {
  const i = findInBag(c, itemId);
  if (i < 0) return no('That item is not in your bag.');
  const item = c.bag[i]!;
  const s = slot ?? defaultSlotFor(c, item);
  if (!s || !slotAccepts(s, item)) return no('That does not go there.');
  c.bag.splice(i, 1);
  const prev = s === 'altMain' ? c.altMain : c.equipment[s];
  if (s === 'altMain') c.altMain = item;
  else c.equipment[s] = item;
  if (prev) c.bag.splice(i, 0, prev);
  return ok(`Equipped ${item.name}.`);
}

export function unequip(c: Character, slot: EquipSlot): OpResult {
  const item = slot === 'altMain' ? c.altMain : c.equipment[slot];
  if (!item) return no('Nothing there.');
  if (c.bag.length >= BAG_SIZE) return no('Your bag is full.');
  if (slot === 'altMain') c.altMain = null;
  else c.equipment[slot] = null;
  c.bag.push(item);
  return ok(`Unequipped ${item.name}.`);
}

export function allItems(c: Character): Item[] {
  const e = c.equipment;
  return [e.main, e.off, e.head, e.body, e.legs, e.ring1, e.ring2, c.altMain, ...c.bag].filter((x): x is Item => !!x);
}

export function findItem(c: Character, itemId: string): Item | null {
  return allItems(c).find((i) => i.id === itemId) ?? null;
}

// ------------------------------------------------------------------ gems

export function canSocket(item: Item, gem: Gem): boolean {
  if (item.kind === 'armor') return gem.family === 'bulwark';
  if (item.kind === 'weapon') return !GEMS[gem.family].armorOnly;
  return false;
}

export function socketGem(c: Character, itemId: string, socketIdx: number, gemIdx: number): OpResult {
  const item = findItem(c, itemId);
  const gem = c.gems[gemIdx];
  if (!item || !gem) return no('Nothing to socket.');
  if (socketIdx < 0 || socketIdx >= item.sockets.length) return no('No such socket.');
  if (!canSocket(item, gem)) return no(item.kind === 'armor' ? 'Armor sockets take Bulwark gems only.' : 'That gem does not fit.');
  const prev = item.sockets[socketIdx];
  item.sockets[socketIdx] = gem;
  c.gems.splice(gemIdx, 1);
  if (prev) c.gems.push(prev);
  return ok(`Socketed ${GEMS[gem.family].name} (T${gem.tier}).`);
}

/** Unsocketing is free at a bonfire (GAME_DESIGN §8.5). */
export function unsocketGem(c: Character, itemId: string, socketIdx: number): OpResult {
  const item = findItem(c, itemId);
  const gem = item?.sockets[socketIdx];
  if (!item || !gem) return no('That socket is empty.');
  item.sockets[socketIdx] = null;
  c.gems.push(gem);
  return ok('Gem removed.');
}

export function upgradeGem(c: Character, gemIdx: number): OpResult {
  const gem = c.gems[gemIdx];
  if (!gem) return no('No gem.');
  if (gem.tier >= 5) return no('Already T5.');
  const cost = gemUpgradeCost(gem.tier);
  if (c.stardust < cost) return no(`Needs ${cost} Stardust.`);
  c.stardust -= cost;
  gem.tier = (gem.tier + 1) as Gem['tier'];
  return ok(`Upgraded to T${gem.tier}.`);
}

export function rerollGem(c: Character, gemIdx: number, rng: Rng): OpResult {
  const gem = c.gems[gemIdx];
  if (!gem) return no('No gem.');
  const cost = gemRerollCost(gem.tier);
  if (c.stardust < cost) return no(`Needs ${cost} Stardust.`);
  c.stardust -= cost;
  const pool = gem.family === 'bulwark' ? GEM_FAMILIES : WEAPON_GEM_FAMILIES.filter((f) => f !== gem.family);
  gem.family = rng.pick(pool);
  return ok(`It became ${GEMS[gem.family].name}.`);
}

// ------------------------------------------------------------------ selling and buying

export function itemSellValue(item: Item): number {
  let v = gearSellValue(item.rarity, item.ilvl);
  for (const g of item.sockets) if (g) v += gemSellValue(g.tier);
  return v;
}

export function sellItem(c: Character, itemId: string): OpResult {
  const i = findInBag(c, itemId);
  if (i < 0) return no('Only items in your bag can be sold.');
  const item = c.bag[i]!;
  const v = itemSellValue(item);
  c.bag.splice(i, 1);
  c.stardust += v;
  return ok(`Sold ${item.name} for ${v} Stardust.`);
}

export function sellGem(c: Character, gemIdx: number): OpResult {
  const gem = c.gems[gemIdx];
  if (!gem) return no('No gem.');
  const v = gemSellValue(gem.tier);
  c.gems.splice(gemIdx, 1);
  c.stardust += v;
  return ok(`Sold for ${v} Stardust.`);
}

export function sellConsumable(c: Character, id: ConsumableId): OpResult {
  const n = c.consumables[id] ?? 0;
  const def = CONSUMABLES[id];
  if (n <= 0) return no('None left.');
  const v = Math.floor((def.price ?? 20) / 2);
  c.consumables[id] = n - 1;
  c.stardust += v;
  return ok(`Sold for ${v} Stardust.`);
}

export function buyConsumable(c: Character, id: ConsumableId): OpResult {
  const def = CONSUMABLES[id];
  if (def.price === null) return no('Not for sale.');
  if ((c.consumables[id] ?? 0) >= MAX_CONSUMABLE) return no(`You can carry ${MAX_CONSUMABLE}.`);
  if (c.stardust < def.price) return no(`Needs ${def.price} Stardust.`);
  c.stardust -= def.price;
  c.consumables[id] = (c.consumables[id] ?? 0) + 1;
  if (!c.quickSlot) c.quickSlot = id;
  return ok(`Bought a ${def.name}.`);
}

export function buyItem(c: Character, item: Item, price: number): OpResult {
  if (c.bag.length >= BAG_SIZE) return no('Your bag is full.');
  if (c.stardust < price) return no(`Needs ${price} Stardust.`);
  c.stardust -= price;
  c.bag.push(item);
  return ok(`Bought ${item.name}.`);
}

export function buyGem(c: Character, gem: Gem, price: number): OpResult {
  if (c.stardust < price) return no(`Needs ${price} Stardust.`);
  c.stardust -= price;
  c.gems.push({ ...gem });
  return ok(`Bought ${GEMS[gem.family].name} (T${gem.tier}).`);
}

// ------------------------------------------------------------------ levels

export function levelUp(c: Character, stat: StatId): OpResult {
  if (!canRaise(c, stat)) return no(`${stat} is at 99.`);
  if (c.freePoints > 0) {
    c.freePoints--;
    c.stats[stat]++;
    return ok(`+1 ${stat} (free).`);
  }
  const cost = levelCost(c.level);
  if (c.shards < cost) return no(`Needs ${cost} Shards.`);
  c.shards -= cost;
  c.stats[stat]++;
  c.level = levelFromStats(c) + c.freePoints;
  return ok(`Level ${c.level}.`);
}

/** Tear of Undoing: stats back to the class base, the points come back as free points to spend. */
export function respec(c: Character): OpResult {
  if (c.tears <= 0) return no('You need a Tear of Undoing.');
  c.tears--;
  const refund = respecStats(c);
  c.freePoints += refund;
  return ok(`Your stats are undone. ${c.freePoints} points to place.`);
}

/** Cycle the quick-use slot to the next owned consumable. */
export function cycleQuickSlot(c: Character): ConsumableId | null {
  const owned = (Object.keys(CONSUMABLES) as ConsumableId[]).filter((id) => (c.consumables[id] ?? 0) > 0);
  if (owned.length === 0) {
    c.quickSlot = null;
    return null;
  }
  const i = c.quickSlot ? owned.indexOf(c.quickSlot) : -1;
  c.quickSlot = owned[(i + 1) % owned.length]!;
  return c.quickSlot;
}
