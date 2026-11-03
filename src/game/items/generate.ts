// Item generation (GAME_DESIGN §8, CONTENT_ITEMS §3–14): rarity by source, slot, base, affixes (no
// duplicates), sockets, legendary powers, names. Deterministic for a given stream.
import type { Rng } from '../../engine/rng';
import { WEAPONS, WEAPON_IDS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { ARMOR_SETS } from '../../data/armor';
import { RINGS } from '../../data/rings';
import { AFFIXES, type AffixDef, type AffixSlotGroup } from '../../data/affixes';
import { LEGENDARY_NAMES, powersFor, type PowerSlot } from '../../data/legendaries';
import { RARITY_ORDER, RARITY_WEIGHTS, SLOT_WEIGHTS, type LootSource } from '../../data/lootTables';
import { GEM_FAMILIES } from '../../data/gems';
import { baseInfo } from './bases';
import { rollSkillCount } from '../combat/formulas';
import { makeItem, newId, socketCount } from './make';
import type { Gem, Item, Rarity } from '../types';

export const AFFIX_COUNT: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 3 };

export function rollRarity(rng: Rng, source: LootSource): Rarity {
  const i = rng.weighted(RARITY_WEIGHTS[source]);
  return RARITY_ORDER[Math.max(0, i)]!;
}

function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

/** Pick a base for a slot category, respecting ring rarity floors and the Holy Bulwark rule. */
export function rollBase(rng: Rng, slot: (typeof SLOT_WEIGHTS)[number]['slot'], rarity: Rarity, ilvl: number, zone: number): string {
  switch (slot) {
    case 'weapon':
      return rng.pick(WEAPON_IDS);
    case 'shield': {
      if (rarity === 'legendary' && ilvl >= 5 && rng.chance(0.25)) return 'holy_bulwark';
      return rng.pick(Object.values(SHIELDS).filter((s) => !s.legendaryOnly)).id;
    }
    case 'staff':
      return rng.pick(Object.values(CASTING_TOOLS).filter((t) => t.school === 'brain')).id;
    case 'talisman':
      return rng.pick(Object.values(CASTING_TOOLS).filter((t) => t.school === 'prayer')).id;
    case 'head':
    case 'body':
    case 'legs': {
      // sets from the drop's zone, sometimes a neighbouring zone
      const z = Math.max(1, Math.min(8, rng.chance(0.25) ? zone + (rng.chance(0.5) ? 1 : -1) : zone));
      const sets = ARMOR_SETS.filter((s) => s.zone === z);
      return `${rng.pick(sets.length ? sets : ARMOR_SETS).id}_${slot}`;
    }
    case 'ring': {
      const ok = Object.values(RINGS).filter((r) => rarityIndex(r.floor) <= rarityIndex(rarity));
      return rng.pick(ok.length ? ok : Object.values(RINGS)).id;
    }
  }
}

function affixGroupsFor(item: Item): AffixSlotGroup[] {
  const g: AffixSlotGroup[] = ['any'];
  if (item.kind === 'weapon') g.push('weapon');
  if (item.kind === 'shield') g.push('shield');
  if (item.kind === 'ring') g.push('ring');
  if (item.kind === 'armor') {
    g.push('armor');
    g.push(item.slot as AffixSlotGroup);
  }
  return g;
}

export function eligibleAffixes(item: Item): AffixDef[] {
  const groups = affixGroupsFor(item);
  return Object.values(AFFIXES).filter((a) => a.slots.some((s) => groups.includes(s)));
}

export function rollAffixValue(rng: Rng, a: AffixDef, ilvl: number): number {
  const scale = a.flat ? 1 + 0.2 * (ilvl - 1) : 1;
  const v = rng.range(a.lo, a.hi) * scale;
  return a.integer ? Math.max(1, Math.round(v)) : Math.round(v * 100) / 100;
}

export function rollAffixes(rng: Rng, item: Item, count: number): { id: string; value: number }[] {
  const pool = rng.shuffle([...eligibleAffixes(item)]);
  const out: { id: string; value: number }[] = [];
  for (const a of pool) {
    if (out.length >= count) break;
    if (out.some((x) => x.id === a.id)) continue;
    out.push({ id: a.id, value: rollAffixValue(rng, a, item.ilvl) });
  }
  return out;
}

function powerSlotOf(item: Item): PowerSlot | null {
  if (item.kind === 'weapon') return 'weapon';
  if (item.kind === 'shield') return 'shield';
  if (item.kind === 'staff') return 'staff';
  if (item.kind === 'talisman') return 'talisman';
  if (item.kind === 'armor') return item.slot === 'legs' ? 'legs' : 'armor';
  return null;
}

/** Display name: "<prefix> <Base> <suffix>" for Uncommon–Epic, proper names for Legendaries. */
export function itemName(rng: Rng | null, item: Item): string {
  const info = baseInfo(item.baseId);
  const base = info?.name ?? item.baseId;
  if (item.rarity === 'legendary') {
    if (item.kind === 'ring') return base;
    const w = WEAPONS[item.baseId];
    const list = w ? w.legendaryNames : item.kind === 'armor' ? LEGENDARY_NAMES[item.slot] : LEGENDARY_NAMES[item.kind];
    if (list && list.length) return rng ? rng.pick(list) : list[0]!;
    return base;
  }
  if (item.rarity === 'common') return base;
  const pre = item.affixes.map((a) => AFFIXES[a.id]).find((a) => a?.pos === 'prefix');
  const suf = item.affixes.map((a) => AFFIXES[a.id]).find((a) => a?.pos === 'suffix');
  return [pre?.name, base, suf?.name].filter(Boolean).join(' ');
}

export interface GenOpts {
  source: LootSource;
  ilvl: number;
  zone: number;
  rarity?: Rarity;
  slot?: (typeof SLOT_WEIGHTS)[number]['slot'];
  baseId?: string;
  /** minimum rarity (bosses drop Rare+) */
  minRarity?: Rarity;
  /** NG+ cycle (skill unlocks, D89); defaults to ilvl − zone */
  cycle?: number;
}

export function generateItem(rng: Rng, o: GenOpts): Item {
  let rarity = o.rarity ?? rollRarity(rng, o.source);
  if (o.minRarity && rarityIndex(rarity) < rarityIndex(o.minRarity)) rarity = o.minRarity;
  let baseId = o.baseId;
  if (!baseId) {
    const slot = o.slot ?? SLOT_WEIGHTS[Math.max(0, rng.weighted(SLOT_WEIGHTS.map((s) => s.w)))]!.slot;
    baseId = rollBase(rng, slot, rarity, o.ilvl, o.zone);
  }
  // a ring below its rarity floor is lifted to the floor
  const ring = RINGS[baseId];
  if (ring && rarityIndex(rarity) < rarityIndex(ring.floor)) rarity = ring.floor;
  const item = makeItem(baseId, rarity, Math.max(1, o.ilvl), { rng, sockets: 0 });
  item.id = newId(rng);
  item.sockets = new Array(socketCount(item.kind, rarity, rng)).fill(null);
  item.affixes = rollAffixes(rng, item, AFFIX_COUNT[rarity]);
  if (item.kind === 'weapon') item.skills = rollSkillCount(() => rng.next(), o.zone, o.cycle ?? Math.max(0, o.ilvl - o.zone), rarity === 'legendary');
  if (rarity === 'legendary') {
    const ps = powerSlotOf(item);
    if (ps) {
      const list = powersFor(ps);
      if (list.length) item.legendaryPower = rng.pick(list);
    }
  }
  item.name = itemName(rng, item);
  return item;
}

export function randomGem(rng: Rng, tier: 1 | 2 | 3 | 4 | 5 = 1, armor = false): Gem {
  const fams = armor ? (['bulwark'] as const) : GEM_FAMILIES;
  return { family: rng.pick(fams as readonly Gem['family'][]), tier };
}
