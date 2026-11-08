// Inventory operations on a Character (bag of 60, equipment, gems, consumables). Pure and validated:
// the co-op host runs the same functions to check guests' commands (NETCODE §6).
import { GEMS, gemKind, gemKindLabel, gemOrigin, gemTitle } from '../../data/gems';
import { CONSUMABLES, MAX_CONSUMABLE } from '../../data/consumables';
import { STAT_CAP, buyPrice, gearSellValue, gemFuseCost, gemSellTotal, levelCost } from '../combat/formulas';
import { canRaise, levelFromStats, respecStats } from '../player/character';
import type { Character, ConsumableId, Gem, GemFamily, GemPerk, Item, Rarity, StatId } from '../types';
import { newId } from './make';
import { WEAPONS } from '../../data/weapons';

export const BAG_SIZE = 60;
export type EquipSlot = keyof Character['equipment'] | 'altMain' | 'altOff';

/** Every slot that is worn and counts (D228: four rings); the 2nd weapon and 2nd off hand wait their turn. */
export const WORN_SLOTS = ['main', 'off', 'head', 'body', 'legs', 'ring1', 'ring2', 'ring3', 'ring4'] as const;
export const RING_SLOTS = ['ring1', 'ring2', 'ring3', 'ring4'] as const;

/** What is in a slot, the quick-swap ones included. */
export function slotItem(c: Character, slot: EquipSlot): Item | null {
  if (slot === 'altMain') return c.altMain;
  if (slot === 'altOff') return c.altOff ?? null;
  return c.equipment[slot] ?? null;
}
function setSlot(c: Character, slot: EquipSlot, item: Item | null): void {
  if (slot === 'altMain') c.altMain = item;
  else if (slot === 'altOff') c.altOff = item;
  else c.equipment[slot] = item;
}

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
      return RING_SLOTS.find((s) => !c.equipment[s]) ?? 'ring1';
  }
}

/** Staffs and talismans go in the off hand by default but may be held in the weapon hand too (D117). */
export function isToolItem(item: Pick<Item, 'kind'>): boolean {
  return item.kind === 'staff' || item.kind === 'talisman';
}

/** Goes in any of the four weapon slots: a staff, a talisman, or a weapon held in either hand (D291: the crossbow). */
export function isEitherHandItem(item: Pick<Item, 'kind' | 'baseId'>): boolean {
  return isToolItem(item) || (item.kind === 'weapon' && !!WEAPONS[item.baseId]?.eitherHand);
}

export function slotAccepts(slot: EquipSlot, item: Item): boolean {
  if (slot === 'altMain' || slot === 'main') return item.slot === 'main' || isEitherHandItem(item);
  if (slot === 'altOff' || slot === 'off') return item.slot === 'off' || isEitherHandItem(item);
  if ((RING_SLOTS as readonly string[]).includes(slot)) return item.slot === 'ring';
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
  const prev = slotItem(c, s);
  setSlot(c, s, item);
  if (prev) c.bag.splice(i, 0, prev);
  return ok(`Equipped ${item.name}.`);
}

export function unequip(c: Character, slot: EquipSlot): OpResult {
  const item = slotItem(c, slot);
  if (!item) return no('Nothing there.');
  if (c.bag.length >= BAG_SIZE) return no('Your bag is full.');
  setSlot(c, slot, null);
  c.bag.push(item);
  return ok(`Unequipped ${item.name}.`);
}

export function allItems(c: Character): Item[] {
  const e = c.equipment;
  return [...WORN_SLOTS.map((s) => e[s]), c.altMain, c.altOff, ...c.bag].filter((x): x is Item => !!x);
}

/**
 * Give an item coming into the character a fresh id if something it carries already has that one (D232). Drops are
 * rolled from seeded streams that repeat between visits, so two different items could be born with one id, and every
 * menu that looks an item up by id (the gem bench, reinforce, equip) then found the wrong one.
 */
export function uniqueItemId(c: Character, item: Item): Item {
  if (allItems(c).some((i) => i !== item && i.id === item.id)) item.id = newId();
  return item;
}

/** Repair a character whose items share ids (saves from before D232): every later copy gets a new id. */
export function dedupeItemIds(c: Character): number {
  const seen = new Set<string>();
  let fixed = 0;
  for (const it of allItems(c)) {
    if (seen.has(it.id)) {
      it.id = newId();
      fixed++;
    }
    seen.add(it.id);
  }
  return fixed;
}

/** Where an item is (D168): the slot it is worn in, or the bag. */
export function itemPlace(c: Character, itemId: string): EquipSlot | 'bag' | null {
  const e = c.equipment;
  for (const s of WORN_SLOTS) if (e[s]?.id === itemId) return s;
  if (c.altMain?.id === itemId) return 'altMain';
  if (c.altOff?.id === itemId) return 'altOff';
  return c.bag.some((i) => i.id === itemId) ? 'bag' : null;
}

const PLACE_LABEL: Record<EquipSlot | 'bag', string> = { main: 'Weapon', altMain: '2nd weapon', off: 'Off hand', altOff: '2nd off hand', head: 'Head', body: 'Body', legs: 'Legs', ring1: 'Ring 1', ring2: 'Ring 2', ring3: 'Ring 3', ring4: 'Ring 4', bag: 'Bag' };

/** "Weapon", "2nd weapon", "Head", ... or "Bag" (D168). */
export function placeLabel(c: Character, itemId: string): string {
  const p = itemPlace(c, itemId);
  return p ? PLACE_LABEL[p] : '';
}

export function findItem(c: Character, itemId: string): Item | null {
  return allItems(c).find((i) => i.id === itemId) ?? null;
}

// ------------------------------------------------------------------ gems

/** Which gems an item's sockets take (D227): weapons, staffs and talismans weapon gems; armour and shields armour gems. */
export function socketKind(item: Item): 'weapon' | 'armor' | null {
  if (item.kind === 'armor' || item.kind === 'shield') return 'armor';
  if (item.kind === 'weapon' || item.kind === 'staff' || item.kind === 'talisman') return 'weapon';
  return null;
}

/** Weapon gems go in weapon sockets, armor gems in armor sockets (D227: staffs and talismans count as weapons, shields as armor). */
export function canSocket(item: Item, gem: Gem): boolean {
  const k = socketKind(item);
  return !!k && gemKind(gem) === k;
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

/** Unsocketing is free, from any item, worn or in the bag, anywhere (D168; was at a bonfire only, GAME_DESIGN §8.5). */
export function unsocketGem(c: Character, itemId: string, socketIdx: number): OpResult {
  const item = findItem(c, itemId);
  const gem = item?.sockets[socketIdx];
  if (!item || !gem) return no('That socket is empty.');
  item.sockets[socketIdx] = null;
  c.gems.push(gem);
  return ok('Gem removed.');
}

/** A perk chosen for a fused gem: from the original gem or the donor gem, by index. */
export interface FusePick {
  from: 'orig' | 'donor';
  idx: number;
}

/** Check a fuse and work out the resulting perks (or why it cannot be done). */
export function fusePreview(orig: Gem | null, donor: Gem | null, picks: FusePick[]): { perks: GemPerk[]; cost: number; origin: GemFamily[] } | { error: string } {
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
  // D286: at least one of the gem's original perks stays, through every fuse; the kept ones are its new origin
  const origin = gemOrigin(orig);
  const keptOrigin = picks.filter((p) => p.from === 'orig').map((p) => orig.perks[p.idx]!.family).filter((f) => origin.includes(f));
  if (!keptOrigin.length) return { error: `Keep at least one original perk: ${origin.map((f) => GEMS[f].name).join(', ')}.` };
  if (!picks.some((p) => p.from === 'donor')) return { error: 'Take at least one perk from the other gem.' };
  return { perks, cost: gemFuseCost(perks), origin: keptOrigin };
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
  o!.origin = res.origin;
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

function sellAllMatches(it: Item, filter: SellAllFilter): boolean {
  return filter === 'all' || (filter === 'common' ? it.rarity === 'common' : RARITY_ORDER.indexOf(it.rarity) < RARITY_ORDER.indexOf('rare'));
}

/** a locked item is never picked (D265) */
function sellAllPicks(c: Character, filter: SellAllFilter): Item[] {
  return c.bag.filter((it) => !it.locked && sellAllMatches(it, filter));
}

/** Bag items a "Sell all" with this filter would take but for their lock (D265). */
export function lockedSkipped(c: Character, filter: SellAllFilter): number {
  return c.bag.filter((it) => it.locked && sellAllMatches(it, filter)).length;
}

/** Lock or unlock an item in the bag or worn (D265): a locked item is never taken by "Sell all". */
export function toggleItemLock(c: Character, itemId: string): OpResult {
  const it = [...c.bag, ...Object.values(c.equipment), c.altMain, c.altOff].find((x): x is Item => !!x && x.id === itemId);
  if (!it) return no('No such item.');
  if (it.locked) delete it.locked;
  else it.locked = true;
  return ok(it.locked ? `Locked ${it.name}: Sell all will keep it.` : `Unlocked ${it.name}.`);
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

/** Lock or unlock a loose or socketed gem (D282): "Sell all gems" never takes a locked one. */
export function toggleGemLock(c: Character, loc: GemLoc): OpResult {
  const g = gemAt(c, loc);
  if (!g) return no('No gem.');
  if (g.locked) delete g.locked;
  else g.locked = true;
  return ok(g.locked ? `Locked ${gemTitle(g)}: Sell all gems will keep it.` : `Unlocked ${gemTitle(g)}.`);
}

/** What "Sell all gems" would take (D282): every loose gem that is not locked (socketed gems are never sold by it). */
export function sellAllGemsPreview(c: Character): { count: number; glowen: number; locked: number } {
  const picks = c.gems.filter((g) => !g.locked);
  return { count: picks.length, glowen: picks.reduce((s, g) => s + gemSellTotal(g), 0), locked: c.gems.length - picks.length };
}

export function sellAllGems(c: Character): OpResult {
  const picks = c.gems.filter((g) => !g.locked);
  if (picks.length === 0) return no('No unlocked loose gems to sell.');
  const v = picks.reduce((s, g) => s + gemSellTotal(g), 0);
  c.gems = c.gems.filter((g) => g.locked);
  c.glowen += v;
  return ok(`Sold ${picks.length} gem${picks.length === 1 ? '' : 's'} for ${v} Glowen.`);
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
  const price = buyPrice(def.price);
  if (c.glowen < price) return no(`Needs ${price} Glowen.`);
  c.glowen -= price;
  c.consumables[id] = (c.consumables[id] ?? 0) + 1;
  if (!c.quickSlot) c.quickSlot = id;
  return ok(`Bought a ${def.name}.`);
}

export function buyItem(c: Character, item: Item, price: number): OpResult {
  if (c.bag.length >= BAG_SIZE) return no('Your bag is full.');
  if (c.glowen < price) return no(`Needs ${price} Glowen.`);
  c.glowen -= price;
  c.bag.push(uniqueItemId(c, item));
  return ok(`Bought ${item.name}.`);
}

export function buyGem(c: Character, gem: Gem, price: number): OpResult {
  if (c.glowen < price) return no(`Needs ${price} Glowen.`);
  c.glowen -= price;
  c.gems.push({ perks: gem.perks.map((p) => ({ ...p })), ...(gem.origin ? { origin: [...gem.origin] } : {}) });
  return ok(`Bought ${gemTitle(gem)}.`);
}

// ------------------------------------------------------------------ levels

export function levelUp(c: Character, stat: StatId): OpResult {
  if (!canRaise(c, stat)) return no(`${stat} is at ${STAT_CAP}.`);
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
