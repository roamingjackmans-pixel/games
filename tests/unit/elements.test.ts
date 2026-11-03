// D80–D84: five damage types, the weakness chart, enemy types, hybrid weapons, equip load, drop tables.
import { describe, expect, it } from 'vitest';
import { DAMAGE_TYPES } from '../../src/game/types';
import { affinityMult, chartLine, enemyElement, STRONG_MULT, WEAK_MULT } from '../../src/game/elements';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { WEAPONS } from '../../src/data/weapons';
import { CLASSES, CLASS_IDS } from '../../src/data/classes';
import { RARITY_WEIGHTS, DROP_CHANCE } from '../../src/data/lootTables';
import { scalingMult, maxEquipLoad } from '../../src/game/combat/formulas';
import { equipLoadOf, itemWeight, loadTier, LOAD_TIERS } from '../../src/game/player/equipLoad';
import { computeDerived } from '../../src/game/player/derived';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { itemRequirements } from '../../src/game/items/bases';
import { Rng } from '../../src/engine/rng';

describe('five damage types and the weakness chart (D80, D81)', () => {
  it('has exactly physical, magic, void, fire, holy', () => {
    expect([...DAMAGE_TYPES].sort()).toEqual(['fire', 'holy', 'magic', 'physical', 'void']);
  });
  it('physical is neutral both ways', () => {
    for (const t of DAMAGE_TYPES) {
      expect(affinityMult('physical', t)).toBe(1);
      expect(affinityMult(t, 'physical')).toBe(1);
    }
  });
  it('follows the owner chart', () => {
    expect(affinityMult('magic', 'holy')).toBe(STRONG_MULT);
    expect(affinityMult('magic', 'fire')).toBe(WEAK_MULT);
    expect(affinityMult('void', 'fire')).toBe(STRONG_MULT);
    expect(affinityMult('void', 'holy')).toBe(WEAK_MULT);
    expect(affinityMult('holy', 'void')).toBe(STRONG_MULT);
    expect(affinityMult('holy', 'magic')).toBe(WEAK_MULT);
    expect(affinityMult('fire', 'magic')).toBe(STRONG_MULT);
    expect(affinityMult('fire', 'void')).toBe(WEAK_MULT);
    expect(chartLine('holy')).toBe('Weak to Magic · Resists Void');
  });
  it('gives every enemy and boss a type, and the frozen and forge rosters read as magic and fire', () => {
    for (const def of Object.values(ENEMIES)) expect(DAMAGE_TYPES).toContain(enemyElement(def));
    for (const def of Object.values(BOSSES)) expect(DAMAGE_TYPES).toContain(enemyElement(def));
    expect(enemyElement(ENEMIES.frost_knight!)).toBe('magic');
    const forge = Object.values(ENEMIES).filter((d) => d.zone === 5 && !d.special);
    expect(forge.some((d) => enemyElement(d) === 'fire')).toBe(true);
  });
});

describe('hybrid weapons (D80)', () => {
  const hybrids: [string, 'brain' | 'prayer', string][] = [
    ['hollow_maul', 'brain', 'void'],
    ['spellblade', 'brain', 'magic'],
    ['censer_flail', 'prayer', 'fire'],
    ['dawn_glaive', 'prayer', 'holy'],
  ];
  it('pair a physical stat with Brain or Prayer and deal their own type', () => {
    for (const [id, stat, el] of hybrids) {
      const w = WEAPONS[id]!;
      expect(w.element).toBe(el);
      expect(w.grades[stat]).toBeTruthy();
      expect(w.req[stat]).toBeGreaterThan(0);
      const base = { bonk: 20, slicey: 20, brain: 10, prayer: 10 };
      const more = { ...base, [stat]: 40 };
      expect(scalingMult(w.grades, more, false)).toBeGreaterThan(scalingMult(w.grades, base, false));
      expect(itemRequirements({ baseId: id, ilvl: 1 })[stat]).toBe(w.req[stat]);
    }
    // Bonk+Brain void, Slicey+Brain magic, Bonk+Prayer fire, Slicey+Prayer holy
    expect(WEAPONS.hollow_maul!.grades.bonk).not.toBe('-');
    expect(WEAPONS.spellblade!.grades.slicey).not.toBe('-');
    expect(WEAPONS.censer_flail!.grades.bonk).not.toBe('-');
    expect(WEAPONS.dawn_glaive!.grades.slicey).not.toBe('-');
  });
});

describe('equip load (D82)', () => {
  it('tiers at 25 / 70 / 100%', () => {
    expect(loadTier(0.1)).toBe('light');
    expect(loadTier(0.25)).toBe('medium');
    expect(loadTier(0.7)).toBe('medium');
    expect(loadTier(0.71)).toBe('heavy');
    expect(loadTier(1)).toBe('heavy');
    expect(loadTier(1.01)).toBe('encumbered');
    expect(LOAD_TIERS.encumbered).toMatchObject({ speed: 0.5, dodge: 0.5, iframes: 0.5 });
    expect(LOAD_TIERS.heavy).toMatchObject({ speed: 0.9, dodge: 0.8, iframes: 0.8 });
    expect(LOAD_TIERS.light).toMatchObject({ speed: 1.1, dodge: 1.1, iframes: 1.2 });
  });
  it('rises with Endurance', () => {
    expect(maxEquipLoad(30)).toBeGreaterThan(maxEquipLoad(10));
    expect(maxEquipLoad(99)).toBeGreaterThan(maxEquipLoad(60));
  });
  it('every item has a weight; no class starts encumbered', () => {
    for (const id of CLASS_IDS) {
      const c = newCharacter(id, 'Joe', 'p', new Rng(1));
      const d = computeDerived(c);
      expect(d.load.tier, `${id} ${d.load.load}/${d.load.max}`).not.toBe('encumbered');
      if (c.equipment.main) expect(itemWeight(c.equipment.main)).toBeGreaterThan(0);
      void CLASSES[id];
    }
  });
  it('the weapon not in hand is not counted', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const before = equipLoadOf(c.equipment, c.stats.endurance).load;
    c.altMain = makeItem('greathammer', 'common', 1);
    expect(equipLoadOf(c.equipment, c.stats.endurance).load).toBe(before);
  });
  it('heavy armor and a big weapon need decent Endurance to stay Medium', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.equipment.main = makeItem('greathammer', 'common', 1);
    c.equipment.off = null;
    c.equipment.head = makeItem('caretakers_plate_head', 'common', 1);
    c.equipment.body = makeItem('caretakers_plate_body', 'common', 1);
    c.equipment.legs = makeItem('caretakers_plate_legs', 'common', 1);
    expect(equipLoadOf(c.equipment, 10).tier).not.toBe('medium');
    expect(equipLoadOf(c.equipment, 30).tier).toBe('medium');
  });
});

describe('drop tables (D84)', () => {
  const pct = (w: number[]): number[] => {
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => Math.round((x / s) * 1000) / 10);
  };
  it('match the owner table', () => {
    expect(pct(RARITY_WEIGHTS.fodder)).toEqual([70, 22, 5, 2.5, 0.5]);
    expect(pct(RARITY_WEIGHTS.brute)).toEqual([70, 22, 5, 2.5, 0.5]);
    expect(pct(RARITY_WEIGHTS.elite)).toEqual([45, 35, 12.5, 6, 1.5]);
    expect(pct(RARITY_WEIGHTS.boss)).toEqual([20, 35, 30, 11, 4]);
    expect(DROP_CHANCE.elite).toBeGreaterThan(DROP_CHANCE.fodder);
    expect(DROP_CHANCE.fodder).toBeLessThan(0.1);
    expect([DROP_CHANCE.bossMin, DROP_CHANCE.bossMax]).toEqual([2, 5]);
  });
});
