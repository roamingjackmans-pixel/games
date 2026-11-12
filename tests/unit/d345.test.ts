import { describe, expect, it } from 'vitest';
// D345: Twin Daggers wielded in both hands regain stamina 30% faster (hidden); other pairs and one hand do not.
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { Rng } from '../../src/engine/rng';

describe('D345 Twin Daggers stamina regen', () => {
  const regen = (base: string, two: boolean): number => {
    const c = newCharacter('duelist', 'Joe', 'p', new Rng(1));
    c.equipment.main = makeItem(base, 'common', 1);
    c.equipment.off = null;
    c.twoHanded = two;
    return computeDerived(c).regen;
  };
  it('two-handed Twin Daggers regain stamina 30% faster than one-handed', () => {
    expect(regen('twin_daggers', true) / regen('twin_daggers', false)).toBeCloseTo(1.3, 6);
  });
  it('Twin Axes and other weapons are unchanged by two-handing', () => {
    expect(regen('twin_axes', true) / regen('twin_axes', false)).toBeCloseTo(1, 6);
    expect(regen('longsword', true) / regen('longsword', false)).toBeCloseTo(1, 6);
  });
});
