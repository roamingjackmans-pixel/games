// Weapon experience and weapon-class proficiency (D178): what is "out", kill experience, the perks a character has
// active right now, and raising a weapon's rarity with Glowen once its bar is full.
import { WEAPONS } from '../../data/weapons';
import { CASTING_TOOLS } from '../../data/castingTools';
import { SHIELDS } from '../../data/shields';
import { PROF_CLASSES, RARITY_UPGRADE_COST, RARITY_XP, SHIELD_PROF_CLASS, perkPoints, profLevel, type ProfStat } from '../../data/proficiency';
import { Rng } from '../../engine/rng';
import { RARITIES, type Character, type Item, type Rarity } from '../types';
import { findItem } from './inventory';
import { itemName, powerSlotOf } from './generate';
import { powersFor } from '../../data/legendaries';

/** The proficiency class of an item: its weapon base, 'staff' / 'talisman', or its shield size (null: armor, a ring…). */
export function profClassOf(item: Item | null | undefined): string | null {
  if (!item) return null;
  if (WEAPONS[item.baseId] && PROF_CLASSES[item.baseId]) return item.baseId;
  const t = CASTING_TOOLS[item.baseId];
  if (t) return t.school === 'brain' ? 'staff' : 'talisman';
  const s = SHIELDS[item.baseId];
  if (s) return SHIELD_PROF_CLASS[s.size];
  return null;
}

/** Weapons, casting tools and shields (D221; shields trained only their class at first, D215) have a bar to raise a rarity. */
export function hasRarityBar(item: Item | null | undefined): boolean {
  return !!item && !!profClassOf(item);
}

/** What a character has out: the weapon hand's item, and a staff, talisman or shield in the off hand (not when two-handing). */
export function itemsOut(c: Character): Item[] {
  const out: Item[] = [];
  if (profClassOf(c.equipment.main)) out.push(c.equipment.main!);
  const off = c.equipment.off;
  if (off && !c.twoHanded && (CASTING_TOOLS[off.baseId] || SHIELDS[off.baseId])) out.push(off);
  return out;
}

/** The classes whose perks are on right now. */
export function activeClasses(c: Character): string[] {
  return [...new Set(itemsOut(c).map(profClassOf).filter((x): x is string => !!x))];
}

export function profXp(c: Character, cls: string): number {
  return c.proficiency?.[cls] ?? 0;
}

/** The experience an item's bar needs at its rarity (0: legendary, the top). */
export function itemXpCap(item: Item): number {
  if (!hasRarityBar(item)) return 0;
  return RARITY_XP[item.rarity] ?? 0;
}

export interface KillXpResult {
  /** classes that reached a new level, with that level */
  levels: { cls: string; level: number }[];
  /** items whose bar just filled */
  filled: Item[];
}

/** Give a character `xp` on everything it has out (each item's bar, and each class once). */
export function grantKillXp(c: Character, xp: number): KillXpResult {
  const res: KillXpResult = { levels: [], filled: [] };
  if (xp <= 0) return res;
  for (const it of itemsOut(c)) {
    const cap = itemXpCap(it);
    if (cap <= 0) continue;
    const before = it.xp ?? 0;
    it.xp = Math.min(cap, before + xp);
    if (before < cap && it.xp >= cap) res.filled.push(it);
  }
  c.proficiency ??= {};
  for (const cls of activeClasses(c)) {
    const before = profLevel(profXp(c, cls)).level;
    c.proficiency[cls] = profXp(c, cls) + xp;
    const after = profLevel(c.proficiency[cls]!).level;
    if (after > before) res.levels.push({ cls, level: after });
  }
  return res;
}

export type ProfBonuses = Record<ProfStat, number>;

const ZERO: ProfBonuses = { damage: 0, poise: 0, attackSpeed: 0, castSpeed: 0, skillCooldown: 0, spellCooldown: 0, spellPower: 0, dodge: 0, stamina: 0, reach: 0, bleed: 0, lifesteal: 0, parryWindow: 0, blockStamina: 0, elemBlock: 0 };

/** The perk totals of one class at its current level. */
export function classBonuses(c: Character, cls: string): ProfBonuses {
  const out = { ...ZERO };
  const def = PROF_CLASSES[cls];
  if (!def) return out;
  const pts = perkPoints(profLevel(profXp(c, cls)).level);
  def.perks.forEach((pk, i) => (out[pk.stat] += pk.per * pts[i]!));
  return out;
}

/** Every active class's perks added up (only what is out counts). */
export function profBonuses(c: Character): ProfBonuses {
  const out = { ...ZERO };
  for (const cls of activeClasses(c)) {
    const b = classBonuses(c, cls);
    for (const k of Object.keys(out) as ProfStat[]) out[k] += b[k];
  }
  return out;
}

function nextRarity(r: Rarity): Rarity | null {
  const i = RARITIES.indexOf(r);
  return i >= 0 && i < RARITIES.length - 1 ? RARITIES[i + 1]! : null;
}

/** What raising this item would take: null when it cannot be raised at all (not a weapon or tool, or legendary). */
export function upgradeInfo(item: Item): { to: Rarity; cost: number; xp: number; need: number; ready: boolean } | null {
  if (!hasRarityBar(item)) return null;
  const to = nextRarity(item.rarity);
  const need = itemXpCap(item);
  if (!to || need <= 0) return null;
  const cost = Math.round((RARITY_UPGRADE_COST[item.rarity] ?? 0) * (1 + 0.2 * (item.ilvl - 1)));
  const xp = item.xp ?? 0;
  return { to, cost, xp, need, ready: xp >= need };
}

/**
 * Raise an item a rarity (D178): its bar must be full and the Glowen paid. Affixes, sockets, gems and skills all stay;
 * its damage moves to the new rarity's tier; the bar starts again. Becoming Legendary also gives it a legendary power
 * and name, rolled from the item itself so it is the same everywhere.
 */
export function upgradeRarity(c: Character, itemId: string): { ok: boolean; msg: string } {
  const it = findItem(c, itemId);
  if (!it) return { ok: false, msg: 'That item is not with you.' };
  const u = upgradeInfo(it);
  if (!u) return { ok: false, msg: 'That cannot be raised any further.' };
  if (!u.ready) return { ok: false, msg: `Use it more first (${u.xp}/${u.need}).` };
  if (c.glowen < u.cost) return { ok: false, msg: `Not enough Glowen (${u.cost} needed).` };
  c.glowen -= u.cost;
  it.rarity = u.to;
  it.xp = 0;
  if (u.to === 'legendary') {
    const rng = new Rng(`raise|${it.id}`);
    const ps = powerSlotOf(it);
    const list = ps ? powersFor(ps) : [];
    if (list.length && !it.legendaryPower) it.legendaryPower = rng.pick(list);
    it.name = itemName(rng, it);
  }
  return { ok: true, msg: `${it.name} is now ${u.to[0]!.toUpperCase()}${u.to.slice(1)}.` };
}
