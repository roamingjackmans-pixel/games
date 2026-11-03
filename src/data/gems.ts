// GAME_DESIGN §8.5, CONTENT_ITEMS §11: 15 gem families × 5 tiers. A gem carries 1–3 perks (one per family,
// each with its own tier); a gem is either a weapon gem or an armor gem, never both.
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

export function gemValue(family: GemFamily, tier: number): number {
  return GEMS[family].values[Math.max(0, Math.min(4, tier - 1))]!;
}

export function gemText(family: GemFamily, tier: number): string {
  return GEMS[family].text.replace('{v}', String(gemValue(family, tier)));
}

/** "Brutal (T2)": one perk's name. */
export function gemName(family: GemFamily, tier: number): string {
  return `${GEMS[family].name} (T${tier})`;
}

export function perkName(p: GemPerk): string {
  return gemName(p.family, p.tier);
}

export function perkText(p: GemPerk): string {
  return gemText(p.family, p.tier);
}

/** A one-perk gem. */
export function makeGem(family: GemFamily, tier = 1): Gem {
  return { perks: [{ family, tier: Math.max(1, Math.min(5, Math.round(tier))) as GemTier }] };
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

/** "Brutal (T2) + Tempo (T1)". */
export function gemTitle(g: Gem): string {
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
