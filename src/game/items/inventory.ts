// Inventory operations on a Character (bag of 60, equipment, gems, consumables). Pure and validated:
// the co-op host runs the same functions to check guests' commands (NETCODE §6).
import { GEMS, gemKind, gemKindLabel, gemTitle } from '../../data/gems';
import { CONSUMABLES, MAX_CONSUMABLE } from '../../data/consumables';
import { gearSellValue, gemFuseCost, gemSellTotal, gemUpgradeCost, levelCost } from '../combat/formulas';
import { canRaise, levelFromStats, respecStats } from '../player/character';
import type { Character, ConsumableId, Gem, GemPerk, GemTier, Item, Rarity, StatId } from '../types';

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

/** Staffs and talismans go in the off hand by default but may be held in the weapon hand too (D117). */
export function isToolItem(item: Pick<Item, 'kind'>): boolean {
  return item.kind === 'staff' || item.kind === 'talisman';
}

export function slotAccepts(slot: EquipSlot, item: Item): boolean {
  if (slot === 'altMain' || slot === 'main') return item.slot === 'main' || isToolItem(item);
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

/** Weapon gems go in weapon sockets, armor gems in armor sockets. */
export function canSocket(item: Item, gem: Gem): boolean {
  if (item.kind === 'armor') return gemKind(gem) === 'armor';
  if (item.kind === 'weapon') return gemKind(gem) === 'weapon';
  return false;
}

/** Where a gem sits: loose in the bag (`gemIdx`) or in a socket of an item you carry. */
export type GemLoc = { gemIdx: number } | { itemId: string; socketIdx: number };

export function gemAt(c: Character, loc: GemLoc): Gem | null {
  if ('gemIdx' in loc) return c.gems[loc.gemIdx] ?? null;
  return findItem(c, loc.itemId)?.sockets[loc.socketIdx] ?? null;
}

export function socketGem(c: Character, itemId: string, socketIdx: number, gemIdx: number): OpResult {
  const item = findItem(c, itemId);
  const gem = c.gems[gemIdx];
  if (!item || !gem) return no('Nothing to socket.');
  if (socketIdx < 0 || socketIdx >= item.sockets.length) return no('No such socket.');
  if (!canSocket(item, gem)) return no(item.kind === 'armor' ? 'Armor sockets take armor gems only.' : 'Weapon sockets take weapon gems only.');
  const prev = item.sockets[socketIdx];
  item.sockets[socketIdx] = gem;
  c.gems.splice(gemIdx, 1);
  if (prev) c.gems.push(prev);
  return ok(`Socketed ${gemTitle(gem)}.`);
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

/** Upgrade one perk of a gem by a tier, loose or socketed (no need to unsocket). Each perk pays its own way. */
export function upgradeGem(c: Character, loc: GemLoc, perkIdx = 0): OpResult {
  const gem = gemAt(c, loc);
  const perk = gem?.perks[perkIdx];
  if (!gem || !perk) return no('No gem.');
  if (perk.tier >= 5) return no(`${GEMS[perk.family].name} is already T5.`);
  const cost = gemUpgradeCost(perk.tier);
  if (c.glowen < cost) return no(`Needs ${cost} Glowen.`);
  c.glowen -= cost;
  perk.tier = (perk.tier + 1) as GemTier;
  return ok(`${GEMS[perk.family].name} upgraded to T${perk.tier}.`);
}

/** A perk chosen for a fused gem: from the original gem or the donor gem, by index. */
export interface FusePick {
  from: 'orig' | 'donor';
  idx: number;
}

/** Check a fuse and work out the resulting perks (or why it cannot be done). */
export function fusePreview(orig: Gem | null, donor: Gem | null, picks: FusePick[]): { perks: GemPerk[]; cost: number } | { error: string } {
  if (!orig || !donor) return { error: 'Pick two gems.' };
  if (orig === donor) return { error: 'A gem cannot fuse with itself.' };
  if (orig.perks.length < 2) return { error: 'Only gems with two or more perks can be fused.' };
  if (gemKind(orig) !== gemKind(donor)) return { error: `Both gems must be ${gemKindLabel(orig).toLowerCase()}s.` };
  if (picks.length !== orig.perks.length) return { error: `Choose exactly ${orig.perks.length} perks.` };
  const perks: GemPerk[] = [];
  const seen = new Set<string>();
  for (const p of picks) {
    const perk = (p.from === 'orig' ? orig : donor).perks[p.idx];
    if (!perk) return { error: 'No such perk.' };
    if (seen.has(perk.family)) return { error: `Only one ${GEMS[perk.family].name} perk per gem.` };
    seen.add(perk.family);
    perks.push({ ...perk });
  }
  if (!picks.some((p) => p.from === 'orig')) return { error: 'Keep at least one perk of the original gem.' };
  if (!picks.some((p) => p.from === 'donor')) return { error: 'Take at least one perk from the other gem.' };
  return { perks, cost: gemFuseCost(perks) };
}

/**
 * Fuse: the original gem (loose or socketed, two or more perks) keeps the chosen perks, taking the rest
 * from a loose donor gem of the same kind, which is destroyed. The perk count stays the original's.
 */
export function fuseGems(c: Character, orig: GemLoc, donorIdx: number, picks: FusePick[]): OpResult {
  const o = gemAt(c, orig);
  const d = c.gems[donorIdx] ?? null;
  const res = fusePreview(o, d, picks);
  if ('error' in res) return no(res.error);
  if (c.glowen < res.cost) return no(`Needs ${res.cost} Glowen.`);
  c.glowen -= res.cost;
  o!.perks = res.perks;
  c.gems.splice(c.gems.indexOf(d!), 1);
  return ok(`Fused: ${gemTitle(o!)}.`);
}

// ------------------------------------------------------------------ selling and buying

export function itemSellValue(item: Item): number {
  let v = gearSellValue(item.rarity, item.ilvl);
  for (const g of item.sockets) if (g) v += gemSellTotal(g);
  return v;
}

/** Which bag items "Sell all" takes. */
export type SellAllFilter = 'all' | 'common' | 'belowRare';
const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function sellAllPicks(c: Character, filter: SellAllFilter): Item[] {
  return c.bag.filter((it) => filter === 'all' || (filter === 'common' ? it.rarity === 'common' : RARITY_ORDER.indexOf(it.rarity) < RARITY_ORDER.indexOf('rare')));
}

/**
 * What "Sell all" would do: worn gear and the quick-swap weapon are never in the bag, so never sold.
 * Socketed gems are not sold with the gear: they go back to your loose gems.
 */
export function sellAllPreview(c: Character, filter: SellAllFilter): { count: number; glowen: number; gems: number } {
  const items = sellAllPicks(c, filter);
  return {
    count: items.length,
    glowen: items.reduce((s, it) => s + gearSellValue(it.rarity, it.ilvl), 0),
    gems: items.reduce((s, it) => s + it.sockets.filter((g) => !!g).length, 0),
  };
}

export function sellAll(c: Character, filter: SellAllFilter): OpResult {
  const items = sellAllPicks(c, filter);
  if (items.length === 0) return no('Nothing to sell.');
  let v = 0;
  let gems = 0;
  for (const it of items) {
    v += gearSellValue(it.rarity, it.ilvl);
    for (const g of it.sockets) {
      if (!g) continue;
      c.gems.push(g);
      gems++;
    }
  }
  for (const it of items) c.bag.splice(c.bag.indexOf(it), 1);
  c.glowen += v;
  return ok(`Sold ${items.length} item${items.length === 1 ? '' : 's'} for ${v} Glowen.${gems ? ` ${gems} gem${gems === 1 ? '' : 's'} back in your pouch.` : ''}`);
}

export function sellItem(c: Character, itemId: string): OpResult {
  const i = findInBag(c, itemId);
  if (i < 0) return no('Only items in your bag can be sold.');
  const item = c.bag[i]!;
  const v = itemSellValue(item);
  c.bag.splice(i, 1);
  c.glowen += v;
  return ok(`Sold ${item.name} for ${v} Glowen.`);
}

export function sellGem(c: Character, gemIdx: number): OpResult {
  const gem = c.gems[gemIdx];
  if (!gem) return no('No gem.');
  const v = gemSellTotal(gem);
  c.gems.splice(gemIdx, 1);
  c.glowen += v;
  return ok(`Sold for ${v} Glowen.`);
}

export function sellConsumable(c: Character, id: ConsumableId): OpResult {
  const n = c.consumables[id] ?? 0;
  const def = CONSUMABLES[id];
  if (n <= 0) return no('None left.');
  const v = Math.floor((def.price ?? 20) / 2);
  c.consumables[id] = n - 1;
  c.glowen += v;
  return ok(`Sold for ${v} Glowen.`);
}

export function buyConsumable(c: Character, id: ConsumableId): OpResult {
  const def = CONSUMABLES[id];
  if (def.price === null) return no('Not for sale.');
  if ((c.consumables[id] ?? 0) >= MAX_CONSUMABLE) return no(`You can carry ${MAX_CONSUMABLE}.`);
  if (c.glowen < def.price) return no(`Needs ${def.price} Glowen.`);
  c.glowen -= def.price;
  c.consumables[id] = (c.consumables[id] ?? 0) + 1;
  if (!c.quickSlot) c.quickSlot = id;
  return ok(`Bought a ${def.name}.`);
}

export function buyItem(c: Character, item: Item, price: number): OpResult {
  if (c.bag.length >= BAG_SIZE) return no('Your bag is full.');
  if (c.glowen < price) return no(`Needs ${price} Glowen.`);
  c.glowen -= price;
  c.bag.push(item);
  return ok(`Bought ${item.name}.`);
}

export function buyGem(c: Character, gem: Gem, price: number): OpResult {
  if (c.glowen < price) return no(`Needs ${price} Glowen.`);
  c.glowen -= price;
  c.gems.push({ perks: gem.perks.map((p) => ({ ...p })) });
  return ok(`Bought ${gemTitle(gem)}.`);
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

/** Level-up points not yet spent, by stat (the bonfire holds them until Confirm, D142). */
export type PendingPoints = Partial<Record<StatId, number>>;
const PLAN_ORDER: StatId[] = ['hp', 'endurance', 'bonk', 'slicey', 'brain', 'prayer'];

/**
 * Try pending level-up points on a copy of the character: free points first, then Shards at the rising level cost.
 * The copy shows the stats, level and Shards after; nothing on the real character changes.
 */
export function planLevelUps(c: Character, pending: PendingPoints): { ok: boolean; char: Character; points: number; shardsSpent: number; freeUsed: number; msg: string } {
  const copy = structuredClone(c);
  let points = 0;
  for (const st of PLAN_ORDER) {
    for (let i = 0; i < (pending[st] ?? 0); i++) {
      const r = levelUp(copy, st);
      if (!r.ok) return { ok: false, char: copy, points, shardsSpent: c.shards - copy.shards, freeUsed: c.freePoints - copy.freePoints, msg: r.msg };
      points++;
    }
  }
  return { ok: true, char: copy, points, shardsSpent: c.shards - copy.shards, freeUsed: c.freePoints - copy.freePoints, msg: '' };
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
