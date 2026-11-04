// GAME_DESIGN §8.5, CONTENT_ITEMS §11: 15 gem families × 5 tiers. A gem carries 1–3 perks (one per family,
// each with its own tier); a gem is either a weapon gem or an armor gem, never both.
import type { Rng } from '../engine/rng';
import type { DamageType, Gem, GemFamily, GemPerk, GemTier, StatusId } from '../game/types';

export interface GemDef {
  family: GemFamily;
  name: string;
  color: string;
  /** effect value per tier T1..T5 */
  values: [number, number, number, number, number];
  text: string;
  armorOnly?: boolean;
  weaponOnly?: boolean;
  convert?: { type: DamageType; status?: StatusId };
}

export const GEMS: Record<GemFamily, GemDef> = {
  quicksilver: { family: 'quicksilver', name: 'Quicksilver', color: '#cfd6dc', values: [6, 9, 12, 15, 18], text: '+{v}% attack and cast speed', weaponOnly: true },
  tempo: { family: 'tempo', name: 'Tempo', color: '#e6b84a', values: [6, 9, 12, 15, 18], text: '−{v}% skill cooldowns', weaponOnly: true },
  fleetfoot: { family: 'fleetfoot', name: 'Fleetfoot', color: '#58d66a', values: [0.3, 0.45, 0.6, 0.75, 0.9], text: '−{v} s dodge recharge', weaponOnly: true },
  brutal: { family: 'brutal', name: 'Brutal', color: '#d63a3a', values: [5, 8, 11, 14, 17], text: '+{v}% damage', weaponOnly: true },
  ember: { family: 'ember', name: 'Ember', color: '#ff7a1a', values: [20, 25, 30, 35, 40], text: '{v}% of physical becomes Fire, Burn buildup', weaponOnly: true, convert: { type: 'fire', status: 'burn' } },
  rime: { family: 'rime', name: 'Rime', color: '#9ad0ff', values: [20, 25, 30, 35, 40], text: '{v}% of physical becomes Magic (frost), Chill buildup', weaponOnly: true, convert: { type: 'magic', status: 'chill' } },
  storm: { family: 'storm', name: 'Storm', color: '#6f8dff', values: [20, 25, 30, 35, 40], text: '{v}% of physical becomes Magic (lightning), Shock buildup', weaponOnly: true, convert: { type: 'magic', status: 'shock' } },
  dawn: { family: 'dawn', name: 'Dawn', color: '#ffe98a', values: [20, 25, 30, 35, 40], text: '{v}% of physical becomes Holy', weaponOnly: true, convert: { type: 'holy' } },
  dusk: { family: 'dusk', name: 'Dusk', color: '#8a8396', values: [20, 25, 30, 35, 40], text: '{v}% of physical becomes Void', weaponOnly: true, convert: { type: 'void' } },
  leech: { family: 'leech', name: 'Leech', color: '#8a1020', values: [2, 3, 4, 5, 6], text: '{v}% lifesteal', weaponOnly: true },
  vigor: { family: 'vigor', name: 'Vigor', color: '#2aa198', values: [8, 12, 16, 20, 24], text: '−{v}% stamina costs', weaponOnly: true },
  bulwark: { family: 'bulwark', name: 'Bulwark', color: '#9a9aa6', values: [8, 12, 16, 20, 24], text: '+{v} defense to all types', armorOnly: true },
  hearth: { family: 'hearth', name: 'Hearth', color: '#e0705a', values: [15, 22, 30, 38, 45], text: '+{v} max HP', armorOnly: true },
  zephyr: { family: 'zephyr', name: 'Zephyr', color: '#a8e6cf', values: [8, 12, 16, 20, 24], text: '+{v}% stamina regeneration', armorOnly: true },
  gilt: { family: 'gilt', name: 'Gilt', color: '#d4af37', values: [5, 8, 11, 14, 17], text: '+{v}% Glowen found', armorOnly: true },
};

export const GEM_FAMILIES = Object.keys(GEMS) as GemFamily[];
export const WEAPON_GEM_FAMILIES = GEM_FAMILIES.filter((f) => !GEMS[f].armorOnly);
export const ARMOR_GEM_FAMILIES = GEM_FAMILIES.filter((f) => GEMS[f].armorOnly);
export const MAX_GEM_PERKS = 3;

export type GemKind = 'weapon' | 'armor';

/** The table value of a family at a tier (level 14-ish, an average roll: what every gem was before D197). */
export function gemValue(family: GemFamily, tier: number): number {
  return GEMS[family].values[Math.max(0, Math.min(4, tier - 1))]!;
}

// ---------- levels and quality rolls (D197) ----------

export const GEM_MAX_LEVEL = 50;
/** Perks made before levels existed show as this level (the nearest to ×1) and keep exactly their old value. */
export const LEGACY_GEM_LEVEL = 14;

/** Level 1 is a quarter of the tier value, level 50 three times it, in even steps between. */
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

/** A quality roll: the band by its chance, then evenly inside it (two numbers from `rng`). */
export function rollGemQuality(rng: Rng): number {
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

/** What a perk does: tier value × level × (1 + roll); a perk from before levels keeps its old value (×1). */
export function perkValue(p: GemPerk): number {
  return gemValue(p.family, p.tier) * (p.level === undefined ? 1 : gemLevelMult(p.level)) * (1 + perkQ(p));
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

/** The table text at a tier (no level or roll). */
export function gemText(family: GemFamily, tier: number): string {
  return GEMS[family].text.replace('{v}', String(gemValue(family, tier)));
}

/** "Brutal (T2)": a family at a tier. */
export function gemName(family: GemFamily, tier: number): string {
  return `${GEMS[family].name} (T${tier})`;
}

/** "Brutal (T2 · Lv 12)": one perk's name. */
export function perkName(p: GemPerk): string {
  return `${GEMS[p.family].name} (T${p.tier} · Lv ${perkLevel(p)})`;
}

/** "+11% damage": what this perk does at its tier, level and roll. */
export function perkText(p: GemPerk): string {
  return GEMS[p.family].text.replace('{v}', fmtGemValue(perkValue(p)));
}

/** "Purple +22%": the perk's roll. */
export function perkRollText(p: GemPerk): string {
  const q = perkQ(p);
  return `${perkQuality(p).label} ${q >= 0 ? '+' : '−'}${Math.round(Math.abs(q) * 100)}%`;
}

/** A one-perk gem; without a level it is a plain table-value perk (as every gem was before D197). */
export function makeGem(family: GemFamily, tier = 1, level?: number, q?: number): Gem {
  const perk: GemPerk = { family, tier: Math.max(1, Math.min(5, Math.round(tier))) as GemTier };
  if (level !== undefined) perk.level = Math.max(1, Math.min(GEM_MAX_LEVEL, Math.round(level)));
  if (q !== undefined) perk.q = q;
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

/** "Lv 12 Brutal (T2) + Tempo (T1)" (or each perk's own level when a fuse mixed them). */
export function gemTitle(g: Gem): string {
  const lv = new Set(g.perks.map(perkLevel));
  if (lv.size === 1) return `Lv ${[...lv][0]} ${g.perks.map((p) => gemName(p.family, p.tier)).join(' + ')}`;
  return g.perks.map(perkName).join(' + ');
}

/** 1–3 perks of known, distinct families, all the same kind, tiers 1–5. */
export function isValidGem(g: unknown): g is Gem {
  if (!g || typeof g !== 'object' || !Array.isArray((g as Gem).perks)) return false;
  const perks = (g as Gem).perks;
  if (perks.length < 1 || perks.length > MAX_GEM_PERKS) return false;
  const seen = new Set<string>();
  let armor: boolean | null = null;
  for (const p of perks) {
    if (!p || !(p.family in GEMS) || !Number.isInteger(p.tier) || p.tier < 1 || p.tier > 5) return false;
    if (p.level !== undefined && (!Number.isInteger(p.level) || p.level < 1 || p.level > GEM_MAX_LEVEL)) return false;
    if (p.q !== undefined && (typeof p.q !== 'number' || !Number.isFinite(p.q) || p.q < -0.5 || p.q > 0.5)) return false;
    if (seen.has(p.family)) return false;
    seen.add(p.family);
    const a = !!GEMS[p.family].armorOnly;
    if (armor !== null && armor !== a) return false;
    armor = a;
  }
  return true;
}

/** Status buildup added per hit by a conversion gem (scales with tier). */
export function gemBuildup(tier: number): number {
  return 10 + tier * 4;
}
