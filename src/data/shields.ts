// CONTENT_ITEMS §5: shields. Block values improve +1% physical / +1.5% elemental per ilvl above 1 (caps 100% / 85%).
import type { ShieldDef } from '../game/types';

export const SHIELDS: Record<string, ShieldDef> = {
  buckler: { id: 'buckler', name: 'Buckler', weight: 1.5, size: 'small', req: { bonk: 0, slicey: 8 }, physical: 0.6, elemental: 0.2, stability: 45, parryS: 0.18, flavor: 'Best parry. Worst everything else.', draw: 's_buckler' },
  targe: { id: 'targe', name: 'Targe', weight: 2.5, size: 'small', req: { bonk: 6, slicey: 6 }, physical: 0.7, elemental: 0.3, stability: 40, parryS: 0.16, flavor: 'A buckler that went to the gym.', draw: 's_targe' },
  round_shield: { id: 'round_shield', name: 'Round Shield', weight: 4, size: 'medium', req: { bonk: 8, slicey: 0 }, physical: 0.8, elemental: 0.35, stability: 30, parryS: 0.12, flavor: 'Round. As advertised.', draw: 's_round' },
  kite_shield: { id: 'kite_shield', name: 'Kite Shield', weight: 5, size: 'medium', req: { bonk: 10, slicey: 0 }, physical: 0.88, elemental: 0.45, stability: 28, parryS: 0.12, flavor: 'Does not fly. Was asked.', draw: 's_kite' },
  heater_shield: { id: 'heater_shield', name: 'Heater Shield', weight: 5.5, size: 'medium', req: { bonk: 12, slicey: 0 }, physical: 0.9, elemental: 0.5, stability: 26, parryS: 0.1, flavor: 'Not a heater. Do not ask again.', draw: 's_heater' },
  tower_greatshield: { id: 'tower_greatshield', name: 'Tower Greatshield', weight: 13, size: 'great', req: { bonk: 18, slicey: 0 }, physical: 1.0, elemental: 0.55, stability: 18, parryS: null, walkMult: 0.9, flavor: 'A wall with a handle.', draw: 's_tower' },
  spiked_greatshield: { id: 'spiked_greatshield', name: 'Spiked Greatshield', weight: 12, size: 'great', req: { bonk: 20, slicey: 0 }, physical: 1.0, elemental: 0.65, stability: 20, parryS: null, thorns: 0.5, flavor: 'Hugging it is a mistake.', draw: 's_spiked' },
  holy_bulwark: {
    id: 'holy_bulwark',
    weight: 12,
    name: 'Holy Bulwark',
    size: 'great',
    req: { bonk: 22, slicey: 0 },
    physical: 1.0,
    elemental: 0.6,
    holyVoidBlock: 0.8,
    stability: 16,
    parryS: null,
    blockHealPct: 0.01,
    legendaryOnly: true,
    flavor: 'Smells faintly of incense and victory.',
    draw: 's_bulwark',
  },
};

export const SHIELD_IDS = Object.keys(SHIELDS);

/** Block values at an item level (+1% physical, +1.5% elemental per ilvl above 1; caps 100% / 85%). */
export function shieldValues(s: ShieldDef, ilvl: number): { physical: number; elemental: number; holyVoid: number } {
  const up = Math.max(0, ilvl - 1);
  return {
    physical: Math.min(1, s.physical + 0.01 * up),
    elemental: Math.min(0.85, s.elemental + 0.015 * up),
    holyVoid: Math.min(0.85, (s.holyVoidBlock ?? s.elemental) + 0.015 * up),
  };
}
