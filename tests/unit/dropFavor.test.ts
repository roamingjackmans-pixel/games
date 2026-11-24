// D254, D371, D455: weapons that scale with a class's primary stat drop 120% more often, its secondary 60% more.
import { describe, expect, it } from 'vitest';
import { spellSchoolFavor } from '../../src/game/items/drops';
import { Rng } from '../../src/engine/rng';
import { favorMult, generateItem, scalingStatsOf, slotFavor } from '../../src/game/items/generate';

describe('class-favoured weapon drops (D254)', () => {
  it('scaling stats come from the grades; staffs Brain, talismans Prayer', () => {
    expect(scalingStatsOf('greathammer')).toContain('bonk');
    expect(scalingStatsOf('greathammer')).not.toContain('slicey');
    expect(scalingStatsOf('arcane_staff')).toEqual(['brain']);
  });

  it('+120% for the primary, +60% for the secondary, +195% for both (D455), nothing for HP or Endurance', () => {
    expect(favorMult(['bonk'], { primary: 'bonk', secondary: 'hp' })).toBeCloseTo(2.2, 9);
    expect(favorMult(['slicey'], { primary: 'bonk', secondary: 'slicey' })).toBeCloseTo(1.6, 9);
    expect(favorMult(['bonk', 'slicey'], { primary: 'slicey', secondary: 'bonk' })).toBeCloseTo(2.95, 9);
    expect(favorMult(['bonk'], { primary: 'hp', secondary: 'endurance' })).toBe(1);
    expect(slotFavor('weapon', { primary: 'hp', secondary: 'endurance' })).toBe(1);
    expect(slotFavor('staff', { primary: 'brain', secondary: 'hp' })).toBeCloseTo(2.2, 9);
    expect(slotFavor('shield', { primary: 'bonk', secondary: 'slicey' })).toBe(1);
  });

  it('a Brute (Bonk, then HP) finds Bonk weapons much more often (D371, D455)', () => {
    const count = (favor?: { primary: 'bonk'; secondary: 'hp' }): number => {
      let n = 0;
      for (let i = 0; i < 20000; i++) {
        const it = generateItem(new Rng(`fav${i}`), { source: 'elite', ilvl: 4, zone: 4, ...(favor ? { favor } : {}) });
        if (it.kind === 'weapon' && scalingStatsOf(it.baseId).includes('bonk')) n++;
      }
      return n;
    };
    const plain = count();
    const brute = count({ primary: 'bonk', secondary: 'hp' });
    expect(brute / plain).toBeGreaterThan(1.35);
    expect(brute / plain).toBeLessThan(1.9);
  });

  it('reliquaries lean to the class school (D317): ×3 for the primary stat, ×2 the secondary', () => {
    expect(spellSchoolFavor('brain', { primary: 'brain', secondary: 'slicey' })).toBe(3);
    expect(spellSchoolFavor('prayer', { primary: 'bonk', secondary: 'prayer' })).toBe(2);
    expect(spellSchoolFavor('prayer', { primary: 'bonk', secondary: 'hp' })).toBe(1);
  });
});
