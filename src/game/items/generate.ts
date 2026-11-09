// Item generation (GAME_DESIGN §8, CONTENT_ITEMS §3–14): rarity by source, slot, base, affixes (no
// duplicates), sockets, legendary powers, names. Deterministic for a given stream.
import { Rng } from '../../engine/rng';
import { SET_PERK_CHANCE, SET_PERK_IDS } from '../../data/setPerks';
import { WEAPONS, WEAPON_IDS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { ARMOR_SETS } from '../../data/armor';
import { RINGS } from '../../data/rings';
import { AFFIXES, type AffixDef, type AffixSlotGroup } from '../../data/affixes';
import { LEGENDARY_NAMES, powersFor, type PowerSlot } from '../../data/legendaries';
import { RARITY_ORDER, RARITY_WEIGHTS, SLOT_WEIGHTS, type LootSource } from '../../data/lootTables';
import { GEM_FAMILIES, GEMS, familiesOfKind, gemQualityRolls, rollGemQuality, type GemKind } from '../../data/gems';
import { baseInfo } from './bases';
import { variantOf } from './weaponOf';
import { VARIANT_CHANCE, WEAPON_VARIANTS, type WeaponVariantDef } from '../../data/weaponVariants';
import { rollSkillCount } from '../combat/formulas';
import { makeItem, newId, socketCount } from './make';
import type { Gem, GemPerk, Item, Rarity, StatId } from '../types';

export const AFFIX_COUNT: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 3 };

export function rollRarity(rng: Rng, source: LootSource): Rarity {
  const i = rng.weighted(RARITY_WEIGHTS[source]);
  return RARITY_ORDER[Math.max(0, i)]!;
}

function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

/**
 * Whose drop it is, for its weapons (D254, D317): a weapon (or staff, or talisman) that scales with the class's primary
 * stat drops 30% more often, with its secondary 15% more, and with both 55% more (the two plus 10%). A stat no weapon
 * scales with (HP, Endurance) does nothing, so a Brute (Bonk / HP) gets only the Bonk boost and a Knight none.
 */
export interface DropFavor {
  primary: StatId;
  secondary: StatId;
}
export const FAVOR_PRIMARY = 1.3;
export const FAVOR_SECONDARY = 1.15;
/** on top of both, for a weapon that scales with the primary and the secondary stat (D317) */
export const FAVOR_BOTH_EXTRA = 0.1;

/** The stats a weapon base scales with (grade other than "-"); a staff Brain, a talisman Prayer. */
export function scalingStatsOf(baseId: string): StatId[] {
  const w = WEAPONS[baseId];
  if (w) return (Object.entries(w.grades) as [StatId, string | undefined][]).filter(([, g]) => !!g && g !== '-').map(([k]) => k);
  const t = CASTING_TOOLS[baseId];
  return t ? [t.school] : [];
}

export function favorMult(stats: readonly StatId[], f: DropFavor | undefined): number {
  if (!f) return 1;
  const p = stats.includes(f.primary);
  const s = stats.includes(f.secondary);
  return 1 + (p ? FAVOR_PRIMARY - 1 : 0) + (s ? FAVOR_SECONDARY - 1 : 0) + (p && s ? FAVOR_BOTH_EXTRA : 0);
}

const pickFavored = (rng: Rng, ids: readonly string[], f: DropFavor | undefined): string => (f ? ids[Math.max(0, rng.weighted(ids.map((id) => favorMult(scalingStatsOf(id), f))))]! : rng.pick(ids));

/** How much more often a slot comes up for this player (D254): its bases' average favour. */
export function slotFavor(slot: (typeof SLOT_WEIGHTS)[number]['slot'], f: DropFavor | undefined): number {
  if (!f) return 1;
  const ids = slot === 'weapon' ? WEAPON_IDS : slot === 'staff' ? toolIds('brain') : slot === 'talisman' ? toolIds('prayer') : null;
  if (!ids?.length) return 1;
  return ids.reduce((s, id) => s + favorMult(scalingStatsOf(id), f), 0) / ids.length;
}
const toolIds = (school: 'brain' | 'prayer'): string[] => Object.values(CASTING_TOOLS).filter((t) => t.school === school).map((t) => t.id);

/** Pick a base for a slot category, respecting ring rarity floors and the Holy Bulwark rule. */
export function rollBase(rng: Rng, slot: (typeof SLOT_WEIGHTS)[number]['slot'], rarity: Rarity, ilvl: number, zone: number, favor?: DropFavor): string {
  switch (slot) {
    case 'weapon':
      return pickFavored(rng, WEAPON_IDS, favor);
    case 'shield': {
      if (rarity === 'legendary' && ilvl >= 5 && rng.chance(0.25)) return 'holy_bulwark';
      return rng.pick(Object.values(SHIELDS).filter((s) => !s.legendaryOnly)).id;
    }
    case 'staff':
      return pickFavored(rng, toolIds('brain'), favor);
    case 'talisman':
      return pickFavored(rng, toolIds('prayer'), favor);
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

export function powerSlotOf(item: Item): PowerSlot | null {
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
  // a scaling variant (D319) puts its word before the class: "Keen Blessed Katana of Haste"
  const vw = variantOf(item)?.word;
  if (item.rarity === 'common') return vw ? `${vw} ${base}` : base;
  const pre = item.affixes.map((a) => AFFIXES[a.id]).find((a) => a?.pos === 'prefix');
  const suf = item.affixes.map((a) => AFFIXES[a.id]).find((a) => a?.pos === 'suffix');
  return [pre?.name, vw, base, suf?.name].filter(Boolean).join(' ');
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
  /** the player it drops for (D254): weapons that suit their class come up more often */
  favor?: DropFavor | undefined;
}

export function generateItem(rng: Rng, o: GenOpts): Item {
  let rarity = o.rarity ?? rollRarity(rng, o.source);
  if (o.minRarity && rarityIndex(rarity) < rarityIndex(o.minRarity)) rarity = o.minRarity;
  let baseId = o.baseId;
  if (!baseId) {
    const slot = o.slot ?? SLOT_WEIGHTS[Math.max(0, rng.weighted(SLOT_WEIGHTS.map((s) => s.w * slotFavor(s.slot, o.favor))))]!.slot;
    baseId = rollBase(rng, slot, rarity, o.ilvl, o.zone, o.favor);
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
  if (item.kind === 'weapon') rollVariant(item, o.favor);
  item.name = itemName(rng, item);
  rollSetPerk(item);
  return item;
}

/**
 * A scaling variant on a fresh weapon (D319): VARIANT_CHANCE when its class has any, the variants that suit the
 * player's class weighted up as the classes themselves are (favorMult). Its own stream, seeded by the item's id, so
 * every other roll stays where it was.
 */
export function rollVariant(item: Item, favor?: DropFavor): void {
  const list = WEAPON_VARIANTS[item.baseId];
  if (!list?.length) return;
  const r = new Rng(`variant|${item.id}`);
  if (r.next() >= VARIANT_CHANCE) return;
  const stats = (g: WeaponVariantDef['grades']): StatId[] => (Object.entries(g) as [StatId, string | undefined][]).filter(([, x]) => !!x && x !== '-').map(([k]) => k);
  item.variant = list[Math.max(0, r.weighted(list.map((v) => favorMult(stats(v.grades), favor))))]!.id;
}

/**
 * A set perk on a fresh piece of gear (D243), by rarity. Rolled from its own stream (seeded by the item's id) so it
 * draws nothing from the caller's: every drop, chest and shop roll stays where it was.
 */
export function rollSetPerk(item: Item): void {
  const r = new Rng(`setperk|${item.id}`);
  if (r.next() < SET_PERK_CHANCE[item.rarity]) item.setPerk = r.pick(SET_PERK_IDS);
}

/** Chance of a second and third perk on a dropped gem by NG+ cycle (cycle 0 gems always have one). */
export function gemPerkCountChances(cycle: number): { two: number; three: number } {
  if (cycle <= 0) return { two: 0, three: 0 };
  if (cycle === 1) return { two: 0.35, three: 0 };
  return { two: 0.4, three: 0.25 };
}

/**
 * A random gem with every perk at `level`, each perk with its own quality roll (D197), the best of
 * `gemQualityRolls(level, bonusRolls)` rolls (D284: treasure, bosses and Gary pass a bonus; tiers are gone). The first perk is
 * any family (or one of `kind`); NG+ adds a chance of more perks of the same kind (distinct families).
 */
export function randomGem(rng: Rng, cycle = 0, kind?: GemKind, level = 1, bonusRolls = 0): Gem {
  const rolls = gemQualityRolls(level, bonusRolls);
  const first = rng.pick(kind ? familiesOfKind(kind) : GEM_FAMILIES);
  const perks: GemPerk[] = [{ family: first, level, q: rollGemQuality(rng, rolls) }];
  const ch = gemPerkCountChances(cycle);
  if (ch.two + ch.three > 0) {
    const r = rng.next();
    const n = r < ch.three ? 3 : r < ch.three + ch.two ? 2 : 1;
    const pool = familiesOfKind(GEMS[first].armorOnly ? 'armor' : 'weapon').filter((f) => f !== first);
    for (let i = 1; i < n && pool.length; i++) {
      const f = pool.splice(rng.int(0, pool.length - 1), 1)[0]!;
      perks.push({ family: f, level, q: rollGemQuality(rng, rolls) });
    }
  }
  return { perks };
}
