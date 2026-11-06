// D254: weapons that scale with a class's primary stat drop 20% more often, its secondary 10% more.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { favorMult, generateItem, scalingStatsOf, slotFavor } from '../../src/game/items/generate';

describe('class-favoured weapon drops (D254)', () => {
  it('scaling stats come from the grades; staffs Brain, talismans Prayer', () => {
    expect(scalingStatsOf('greathammer')).toContain('bonk');
    expect(scalingStatsOf('greathammer')).not.toContain('slicey');
    expect(scalingStatsOf('arcane_staff')).toEqual(['brain']);
  });

  it('×1.2 for the primary, ×1.1 for the secondary, nothing for HP or Endurance', () => {
    expect(favorMult(['bonk'], { primary: 'bonk', secondary: 'hp' })).toBeCloseTo(1.2, 9);
    expect(favorMult(['bonk', 'slicey'], { primary: 'slicey', secondary: 'bonk' })).toBeCloseTo(1.32, 9);
    expect(favorMult(['bonk'], { primary: 'hp', secondary: 'endurance' })).toBe(1);
    expect(slotFavor('weapon', { primary: 'hp', secondary: 'endurance' })).toBe(1);
    expect(slotFavor('staff', { primary: 'brain', secondary: 'hp' })).toBeCloseTo(1.2, 9);
    expect(slotFavor('shield', { primary: 'bonk', secondary: 'slicey' })).toBe(1);
  });

  it('a Brute (Bonk, then HP) finds Bonk weapons about 20% more often', () => {
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
    expect(brute / plain).toBeGreaterThan(1.1);
    expect(brute / plain).toBeLessThan(1.3);
  });
});
