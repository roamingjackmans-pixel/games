// GAME_DESIGN §8.5, CONTENT_ITEMS §11: 15 gem families. A gem carries 1–3 perks (one per family); a gem is either a
// weapon gem or an armor gem, never both. There are no tiers (D284): a perk is its family's baseline value × its level
// (D197) × its quality roll, −50% … +50%.
import type { Rng } from '../engine/rng';
import type { DamageType, Gem, GemFamily, GemPerk, StatusId } from '../game/types';
import { lifestealShown } from './roles';

export interface GemDef {
  family: GemFamily;
  name: string;
  color: string;
  /** the baseline effect at a level-14-ish perk with a +0% roll (D284: the average of the old T1–T5 values) */
  value: number;
  text: string;
  armorOnly?: boolean;
  weaponOnly?: boolean;
  /** D283: this share of the hit is added again as `type`; the physical stays (was taken out of the physical) */
  adds?: { type: DamageType; status?: StatusId };
}

export const GEMS: Record<GemFamily, GemDef> = {
  quicksilver: { family: 'quicksilver', name: 'Quicksilver', color: '#cfd6dc', value: 12, text: '+{v}% attack and cast speed', weaponOnly: true },
  tempo: { family: 'tempo', name: 'Tempo', color: '#e6b84a', value: 12, text: '−{v}% skill cooldowns', weaponOnly: true },
  fleetfoot: { family: 'fleetfoot', name: 'Fleetfoot', color: '#58d66a', value: 0.6, text: '−{v} s dodge recharge', weaponOnly: true },
  brutal: { family: 'brutal', name: 'Brutal', color: '#d63a3a', value: 11, text: '+{v}% damage', weaponOnly: true },
  // D283: these add their share on top as their type (they used to convert 20–40% of the physical); D292: 20% more than Brutal
  ember: { family: 'ember', name: 'Ember', color: '#ff7a1a', value: 13.2, text: '+{v}% of the hit as Fire, Burn buildup', weaponOnly: true, adds: { type: 'fire', status: 'burn' } },
  rime: { family: 'rime', name: 'Rime', color: '#9ad0ff', value: 13.2, text: '+{v}% of the hit as Magic (frost), Chill buildup', weaponOnly: true, adds: { type: 'magic', status: 'chill' } },
  storm: { family: 'storm', name: 'Storm', color: '#6f8dff', value: 13.2, text: '+{v}% of the hit as Magic (lightning), Shock buildup', weaponOnly: true, adds: { type: 'magic', status: 'shock' } },
  dawn: { family: 'dawn', name: 'Dawn', color: '#ffe98a', value: 13.2, text: '+{v}% of the hit as Holy', weaponOnly: true, adds: { type: 'holy' } },
  dusk: { family: 'dusk', name: 'Dusk', color: '#8a8396', value: 13.2, text: '+{v}% of the hit as Void', weaponOnly: true, adds: { type: 'void' } },
  // D325: lifesteal is a share of max HP a hit (was 4% of the damage)
  leech: { family: 'leech', name: 'Leech', color: '#8a1020', value: 0.4, text: '{v}% of max HP healed a hit (lifesteal)', weaponOnly: true },
  vigor: { family: 'vigor', name: 'Vigor', color: '#2aa198', value: 16, text: '−{v}% stamina costs', weaponOnly: true },
  bulwark: { family: 'bulwark', name: 'Bulwark', color: '#9a9aa6', value: 16, text: '+{v} defense to all types', armorOnly: true },
  // D260: a share of max HP (was +15 … +45 flat)
  hearth: { family: 'hearth', name: 'Hearth', color: '#e0705a', value: 8, text: '+{v}% max HP', armorOnly: true },
  // D356: 30% weaker (was 16)
  zephyr: { family: 'zephyr', name: 'Zephyr', color: '#a8e6cf', value: 11.2, text: '+{v}% stamina regeneration', armorOnly: true },
  gilt: { family: 'gilt', name: 'Gilt', color: '#d4af37', value: 11, text: '+{v}% Glowen found', armorOnly: true },
};

/** The old T1..T5 tables, kept only to carry perks from before D284 across (`untierPerk`). */
const LEGACY_TIER_VALUES: Record<GemFamily, readonly number[]> = {
  quicksilver: [6, 9, 12, 15, 18],
  tempo: [6, 9, 12, 15, 18],
  fleetfoot: [0.3, 0.45, 0.6, 0.75, 0.9],
  brutal: [5, 8, 11, 14, 17],
  ember: [20, 25, 30, 35, 40],
  rime: [20, 25, 30, 35, 40],
  storm: [20, 25, 30, 35, 40],
  dawn: [20, 25, 30, 35, 40],
  dusk: [20, 25, 30, 35, 40],
  leech: [0.2, 0.3, 0.4, 0.5, 0.6],
  vigor: [8, 12, 16, 20, 24],
  bulwark: [8, 12, 16, 20, 24],
  hearth: [4, 6, 8, 10, 12],
  zephyr: [8, 12, 16, 20, 24],
  gilt: [5, 8, 11, 14, 17],
};

export const GEM_FAMILIES = Object.keys(GEMS) as GemFamily[];
export const WEAPON_GEM_FAMILIES = GEM_FAMILIES.filter((f) => !GEMS[f].armorOnly);
export const ARMOR_GEM_FAMILIES = GEM_FAMILIES.filter((f) => GEMS[f].armorOnly);
export const MAX_GEM_PERKS = 3;

export type GemKind = 'weapon' | 'armor';

/** A family's baseline value (a level-14-ish perk with a +0% roll). */
export function gemBaseValue(family: GemFamily): number {
  return GEMS[family].value;
}

// ---------- levels and quality rolls (D197) ----------

export const GEM_MAX_LEVEL = 50;
/** Perks made before levels existed show as this level (the nearest to ×1) and keep exactly their old value. */
export const LEGACY_GEM_LEVEL = 14;

/** Level 1 is a quarter of the baseline, level 50 three times it, in even steps between. */
export function gemLevelMult(level: number): number {
  const l = Math.max(1, Math.min(GEM_MAX_LEVEL, Math.round(level)));
  return 0.25 + (2.75 * (l - 1)) / (GEM_MAX_LEVEL - 1);
}

export interface GemQuality {
  id: 'green' | 'blue' | 'purple' | 'orange';
  label: string;
  /** the roll band, as a share of the value: −0.5 … +0.5 */
  from: number;
  to: number;
  /** how often a roll lands here */
  chance: number;
  color: string;
}

/** 55% Green (−50% … −15%), 30% Blue (−15% … +10%), 11% Purple (+10% … +35%), 4% Orange (+35% … +50%). */
export const GEM_QUALITIES: readonly GemQuality[] = [
  { id: 'green', label: 'Green', from: -0.5, to: -0.15, chance: 0.55, color: '#6fd46a' },
  { id: 'blue', label: 'Blue', from: -0.15, to: 0.1, chance: 0.3, color: '#5aa8ff' },
  { id: 'purple', label: 'Purple', from: 0.1, to: 0.35, chance: 0.11, color: '#b779ff' },
  { id: 'orange', label: 'Orange', from: 0.35, to: 0.5, chance: 0.04, color: '#ff9a2e' },
];

function rollOnce(rng: Rng): number {
  let r = rng.next();
  let band = GEM_QUALITIES[GEM_QUALITIES.length - 1]!;
  for (const b of GEM_QUALITIES) {
    if (r < b.chance) {
      band = b;
      break;
    }
    r -= b.chance;
  }
  return Math.round((band.from + rng.next() * (band.to - band.from)) * 1000) / 1000;
}

/**
 * A quality roll: the band by its chance, then evenly inside it (two numbers from `rng` a roll). With `rolls` > 1 the
 * best of that many is kept (D284: deeper gems, treasure, bosses and Gary roll better; any roll is still −50% … +50%).
 */
export function rollGemQuality(rng: Rng, rolls = 1): number {
  let best = rollOnce(rng);
  for (let i = 1; i < rolls; i++) best = Math.max(best, rollOnce(rng));
  return best;
}

/** How many quality rolls a gem of this level gets (best kept): one more from level 25 (D284), plus `bonus`. */
export function gemQualityRolls(level: number, bonus = 0): number {
  return 1 + Math.max(0, Math.round(bonus)) + (level >= 25 ? 1 : 0);
}

export function qualityOf(q: number): GemQuality {
  for (const b of GEM_QUALITIES) if (q < b.to) return b;
  return GEM_QUALITIES[GEM_QUALITIES.length - 1]!;
}

export function perkLevel(p: GemPerk): number {
  return p.level ?? LEGACY_GEM_LEVEL;
}
export function perkQ(p: GemPerk): number {
  return p.q ?? 0;
}
export function perkQuality(p: GemPerk): GemQuality {
  return qualityOf(perkQ(p));
}

/** What a perk does: baseline × level × (1 + roll); a perk from before levels counts as ×1 for its level. */
export function perkValue(p: GemPerk): number {
  return gemBaseValue(p.family) * (p.level === undefined ? 1 : gemLevelMult(p.level)) * (1 + perkQ(p));
}

/** Two significant figures under 10 (0.25, 1.4, 3.7), whole numbers above. */
export function fmtGemValue(v: number): string {
  const r = v < 1 ? Math.round(v * 100) / 100 : v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  return String(r);
}

/** A gem's drop level (D197): up to 4 below a target that rises evenly from 1 (zone 1) to 50 (the start of New Game+3). */
export function gemDropLevel(rng: Rng, zone: number, cycle: number): number {
  const progress = Math.max(0, cycle * 8 + (zone - 1));
  const target = 1 + (49 * Math.min(1, progress / 24));
  return Math.max(1, Math.min(GEM_MAX_LEVEL, Math.round(target - 4 + rng.next() * 4)));
}

/** The family's baseline text (no level or roll). */
export function gemText(family: GemFamily): string {
  return GEMS[family].text.replace('{v}', fmtGemValue(family === 'leech' ? lifestealShown(gemBaseValue(family)) : gemBaseValue(family)));
}

/** "Brutal (Lv 12)": one perk's name. */
export function perkName(p: GemPerk): string {
  return `${GEMS[p.family].name} (Lv ${perkLevel(p)})`;
}

/** "+11% damage": what this perk does at its level and roll. */
export function perkText(p: GemPerk): string {
  return GEMS[p.family].text.replace('{v}', fmtGemValue(p.family === 'leech' ? lifestealShown(perkValue(p)) : perkValue(p)));
}

/** "Purple +22%": the perk's roll. */
export function perkRollText(p: GemPerk): string {
  const q = perkQ(p);
  return `${perkQuality(p).label} ${q >= 0 ? '+' : '−'}${Math.round(Math.abs(q) * 100)}%`;
}

/** A one-perk gem; without a level it is a plain baseline perk (×1 for its level). */
export function makeGem(family: GemFamily, opts: { level?: number; q?: number } = {}): Gem {
  const perk: GemPerk = { family };
  if (opts.level !== undefined) perk.level = Math.max(1, Math.min(GEM_MAX_LEVEL, Math.round(opts.level)));
  if (opts.q !== undefined) perk.q = Math.max(-0.5, Math.min(0.5, opts.q));
  return { perks: [perk] };
}

/** The gem's level: its highest perk's (perks keep their own through a fuse). */
export function gemLevel(g: Gem): number {
  return g.perks.reduce((m, p) => Math.max(m, perkLevel(p)), 1);
}

/** The colour of the gem's best roll. */
export function gemQualityColor(g: Gem): string {
  return qualityOf(g.perks.reduce((m, p) => Math.max(m, perkQ(p)), -1)).color;
}

/** Weapon gem or armor gem: every perk on a gem is the same kind. */
export function gemKind(g: Gem): GemKind {
  return g.perks[0] && GEMS[g.perks[0].family].armorOnly ? 'armor' : 'weapon';
}

export function gemKindLabel(g: Gem): string {
  return gemKind(g) === 'armor' ? 'Armor gem' : 'Weapon gem';
}

export function familiesOfKind(kind: GemKind): GemFamily[] {
  return kind === 'armor' ? ARMOR_GEM_FAMILIES : WEAPON_GEM_FAMILIES;
}

/** The gem's colour (its first perk's). */
export function gemColor(g: Gem): string {
  return g.perks[0] ? GEMS[g.perks[0].family].color : '#cccccc';
}

/** "Lv 12 Brutal + Tempo" (or each perk's own level when a fuse mixed them). */
export function gemTitle(g: Gem): string {
  const lv = new Set(g.perks.map(perkLevel));
  if (lv.size === 1) return `Lv ${[...lv][0]} ${g.perks.map((p) => GEMS[p.family].name).join(' + ')}`;
  return g.perks.map(perkName).join(' + ');
}

/** The gem's original families (D286): its `origin`, or every perk it has when it has none yet. */
export function gemOrigin(g: Gem): GemFamily[] {
  return g.origin ?? g.perks.map((p) => p.family);
}

/** 1–3 perks of known, distinct families, all the same kind; an origin (D286) only of families it carries. */
export function isValidGem(g: unknown): g is Gem {
  if (!g || typeof g !== 'object' || !Array.isArray((g as Gem).perks)) return false;
  const perks = (g as Gem).perks;
  if (perks.length < 1 || perks.length > MAX_GEM_PERKS) return false;
  const seen = new Set<string>();
  let armor: boolean | null = null;
  for (const p of perks) {
    if (!p || !(p.family in GEMS)) return false;
    if (p.level !== undefined && (!Number.isInteger(p.level) || p.level < 1 || p.level > GEM_MAX_LEVEL)) return false;
    if (p.q !== undefined && (typeof p.q !== 'number' || !Number.isFinite(p.q) || p.q < -0.5 || p.q > 0.5)) return false;
    if (seen.has(p.family)) return false;
    seen.add(p.family);
    const a = !!GEMS[p.family].armorOnly;
    if (armor !== null && armor !== a) return false;
    armor = a;
  }
  const o = (g as Gem).origin;
  if (o !== undefined && (!Array.isArray(o) || o.length < 1 || new Set(o).size !== o.length || o.some((f) => !seen.has(f)))) return false;
  return true;
}

/** Status buildup added per hit by an adding gem (D284: 22, the old T3, × its roll). */
export function gemBuildup(p: GemPerk): number {
  return Math.round(22 * (1 + perkQ(p)));
}

// ---------- carrying tiered perks across (D284) ----------

/**
 * A perk from before D284 (it has a `tier`): the tier is folded into its quality so it keeps its old strength as nearly
 * as the −50% … +50% range allows, and the tier is dropped. A perk without one is left alone (safe to run twice).
 */
export function untierPerk(p: unknown): void {
  if (!p || typeof p !== 'object' || !('tier' in p)) return;
  const o = p as { family?: unknown; tier?: unknown; q?: unknown };
  const table = typeof o.family === 'string' ? LEGACY_TIER_VALUES[o.family as GemFamily] : undefined;
  const t = typeof o.tier === 'number' && Number.isFinite(o.tier) ? Math.max(1, Math.min(5, Math.round(o.tier))) : 1;
  delete o.tier;
  if (!table) return;
  const q = typeof o.q === 'number' && Number.isFinite(o.q) ? o.q : 0;
  const want = (1 + q) * (table[t - 1]! / table[2]!) - 1;
  o.q = Math.round(Math.max(-0.5, Math.min(0.5, want)) * 1000) / 1000;
}

/**
 * Every perk of a gem through `untierPerk`, and its origin (D286) cleaned on load: only families it still carries, no
 * repeats; an origin that is left empty or is not a list is dropped (it then means all of its perks). Anything that is
 * not a gem is left alone.
 */
export function untierGem(g: unknown): void {
  if (!g || typeof g !== 'object') return;
  const o = g as { perks?: unknown; origin?: unknown };
  const perks = o.perks;
  if (Array.isArray(perks)) for (const p of perks) untierPerk(p);
  if (o.origin === undefined) return;
  const have = new Set(Array.isArray(perks) ? perks.map((p) => (p as { family?: unknown } | null)?.family) : []);
  const clean = Array.isArray(o.origin) ? [...new Set(o.origin.filter((f) => typeof f === 'string' && have.has(f)))] : [];
  if (clean.length) o.origin = clean;
  else delete o.origin;
}
