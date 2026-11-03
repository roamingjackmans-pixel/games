// GAME_DESIGN §8.5, CONTENT_ITEMS §11: 12 gem families × 5 tiers.
import type { DamageType, GemFamily, StatusId } from '../game/types';

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
};

export const GEM_FAMILIES = Object.keys(GEMS) as GemFamily[];
export const WEAPON_GEM_FAMILIES = GEM_FAMILIES.filter((f) => !GEMS[f].armorOnly);

export function gemValue(family: GemFamily, tier: number): number {
  return GEMS[family].values[Math.max(0, Math.min(4, tier - 1))]!;
}

export function gemText(family: GemFamily, tier: number): string {
  return GEMS[family].text.replace('{v}', String(gemValue(family, tier)));
}

export function gemName(family: GemFamily, tier: number): string {
  return `${GEMS[family].name} (T${tier})`;
}

/** Status buildup added per hit by a conversion gem (scales with tier). */
export function gemBuildup(tier: number): number {
  return 10 + tier * 4;
}
