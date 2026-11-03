// CONTENT_ITEMS §10: affixes. Flat ranges scale ×(1 + 0.2 (ilvl − 1)); percents are fixed.
import type { DamageType, StatusId } from '../game/types';

export type AffixSlotGroup = 'weapon' | 'armor' | 'head' | 'body' | 'legs' | 'ring' | 'shield' | 'any';

export interface AffixDef {
  id: string;
  name: string;
  /** shown as a prefix ("Swift Longsword") or suffix ("of the Medic") */
  pos: 'prefix' | 'suffix';
  slots: AffixSlotGroup[];
  lo: number;
  hi: number;
  /** scales with ilvl (flat values) */
  flat: boolean;
  /** display: '+{v}% damage' */
  text: string;
  element?: DamageType;
  status?: StatusId;
  /** status buildup range for elemental affixes */
  buildup?: [number, number];
  stat?: 'bonk' | 'slicey' | 'brain' | 'prayer' | 'endurance' | 'hp';
  defType?: DamageType;
  integer?: boolean;
}

const A = (d: AffixDef): AffixDef => d;

export const AFFIXES: Record<string, AffixDef> = {
  brutal: A({ id: 'brutal', name: 'Brutal', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 12, flat: false, text: '+{v}% damage', integer: true }),
  heavy: A({ id: 'heavy', name: 'Heavy', pos: 'prefix', slots: ['weapon'], lo: 3, hi: 10, flat: true, text: '+{v} physical damage', integer: true }),
  burning: A({ id: 'burning', name: 'Burning', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 12, flat: true, text: '+{v} fire damage, Burn buildup', element: 'fire', status: 'burn', buildup: [10, 25], integer: true }),
  freezing: A({ id: 'freezing', name: 'Freezing', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 12, flat: true, text: '+{v} magic damage (frost), Chill buildup', element: 'magic', status: 'chill', buildup: [10, 25], integer: true }),
  shocking: A({ id: 'shocking', name: 'Shocking', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 12, flat: true, text: '+{v} magic damage (lightning), Shock buildup', element: 'magic', status: 'shock', buildup: [10, 25], integer: true }),
  radiant: A({ id: 'radiant', name: 'Radiant', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 12, flat: true, text: '+{v} holy damage', element: 'holy', buildup: [10, 25], integer: true }),
  dusky: A({ id: 'dusky', name: 'Dusky', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 12, flat: true, text: '+{v} void damage', element: 'void', buildup: [10, 25], integer: true }),
  swift: A({ id: 'swift', name: 'Swift', pos: 'prefix', slots: ['weapon'], lo: 4, hi: 10, flat: false, text: '+{v}% attack speed', integer: true }),
  hasty: A({ id: 'hasty', name: 'Hasty', pos: 'prefix', slots: ['weapon', 'ring'], lo: 4, hi: 12, flat: false, text: '−{v}% skill cooldowns', integer: true }),
  fleet: A({ id: 'fleet', name: 'Fleet', pos: 'prefix', slots: ['legs', 'ring'], lo: 0.3, hi: 0.6, flat: false, text: '−{v} s dodge recharge' }),
  frugal: A({ id: 'frugal', name: 'Frugal', pos: 'prefix', slots: ['weapon', 'body'], lo: 5, hi: 12, flat: false, text: '−{v}% stamina costs', integer: true }),
  leeching: A({ id: 'leeching', name: 'Leeching', pos: 'prefix', slots: ['weapon'], lo: 1, hi: 3, flat: false, text: '{v}% lifesteal', integer: true }),
  crushing: A({ id: 'crushing', name: 'Crushing', pos: 'prefix', slots: ['weapon'], lo: 10, hi: 30, flat: false, text: '+{v}% poise damage', integer: true }),
  warded: A({ id: 'warded', name: 'Warded', pos: 'prefix', slots: ['armor'], lo: 3, hi: 9, flat: true, text: '+{v} defense to all types', integer: true }),
  fireproof: A({ id: 'fireproof', name: 'Fireproof', pos: 'prefix', slots: ['armor'], lo: 40, hi: 40, flat: false, text: '+{v}% fire defense', defType: 'fire', integer: true }),
  frostproof: A({ id: 'frostproof', name: 'Spellproof', pos: 'prefix', slots: ['armor'], lo: 40, hi: 40, flat: false, text: '+{v}% magic defense', defType: 'magic', integer: true }),
  hallowed: A({ id: 'hallowed', name: 'Hallowed', pos: 'prefix', slots: ['armor'], lo: 40, hi: 40, flat: false, text: '+{v}% holy defense', defType: 'holy', integer: true }),
  voidtouched: A({ id: 'voidtouched', name: 'Voidtouched', pos: 'prefix', slots: ['armor'], lo: 40, hi: 40, flat: false, text: '+{v}% void defense', defType: 'void', integer: true }),
  hearty: A({ id: 'hearty', name: 'Hearty', pos: 'prefix', slots: ['armor'], lo: 15, hi: 45, flat: true, text: '+{v} max HP', integer: true }),
  enduring: A({ id: 'enduring', name: 'Enduring', pos: 'prefix', slots: ['armor'], lo: 6, hi: 18, flat: true, text: '+{v} max stamina', integer: true }),
  lucky: A({ id: 'lucky', name: 'Lucky', pos: 'prefix', slots: ['ring', 'head'], lo: 5, hi: 15, flat: false, text: '+{v}% Shard find', integer: true }),
  glowing: A({ id: 'glowing', name: 'Glowing', pos: 'prefix', slots: ['ring', 'head'], lo: 10, hi: 30, flat: false, text: '+{v}% Glowen find', integer: true }),
  medic: A({ id: 'medic', name: 'of the Medic', pos: 'suffix', slots: ['weapon'], lo: 0.5, hi: 1.5, flat: false, text: '+{v} revive value per hit' }),
  bonker: A({ id: 'bonker', name: 'of the Bonker', pos: 'suffix', slots: ['any'], lo: 1, hi: 3, flat: false, text: '+{v} Bonk', stat: 'bonk', integer: true }),
  slicer: A({ id: 'slicer', name: 'of the Slicer', pos: 'suffix', slots: ['any'], lo: 1, hi: 3, flat: false, text: '+{v} Slicey', stat: 'slicey', integer: true }),
  thinker: A({ id: 'thinker', name: 'of the Thinker', pos: 'suffix', slots: ['any'], lo: 1, hi: 3, flat: false, text: '+{v} Brain', stat: 'brain', integer: true }),
  pious: A({ id: 'pious', name: 'of the Pious', pos: 'suffix', slots: ['any'], lo: 1, hi: 3, flat: false, text: '+{v} Prayer', stat: 'prayer', integer: true }),
  vigorous: A({ id: 'vigorous', name: 'of the Enduring', pos: 'suffix', slots: ['any'], lo: 1, hi: 3, flat: false, text: '+{v} Endurance', stat: 'endurance', integer: true }),
  hale: A({ id: 'hale', name: 'of the Hale', pos: 'suffix', slots: ['any'], lo: 1, hi: 3, flat: false, text: '+{v} HP', stat: 'hp', integer: true }),
  steadfast: A({ id: 'steadfast', name: 'Steadfast', pos: 'prefix', slots: ['shield'], lo: 10, hi: 25, flat: false, text: '−{v}% stamina per block', integer: true }),
  reflective: A({ id: 'reflective', name: 'Reflective', pos: 'prefix', slots: ['shield'], lo: 10, hi: 20, flat: false, text: '+{v}% elemental block', integer: true }),
};

export const AFFIX_IDS = Object.keys(AFFIXES);

export function affixText(id: string, v: number): string {
  const a = AFFIXES[id];
  if (!a) return id;
  const val = a.integer ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, '');
  return a.text.replace('{v}', val);
}

/** Status buildup that rides along with an elemental affix (scaled by the rolled value within its range). */
export function affixBuildup(id: string, v: number, ilvl: number): number {
  const a = AFFIXES[id];
  if (!a?.buildup) return 0;
  const scale = a.flat ? 1 + 0.2 * (ilvl - 1) : 1;
  const t = (v / scale - a.lo) / Math.max(1e-6, a.hi - a.lo);
  return Math.round(a.buildup[0] + (a.buildup[1] - a.buildup[0]) * Math.max(0, Math.min(1, t)));
}
