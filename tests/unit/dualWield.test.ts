// D318: twin daggers and twin axes dual-wielded (two-handed) hit 50% harder than one blade.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived, DUAL_WIELD_MULT } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { Rng } from '../../src/engine/rng';

describe('dual wielding (D318)', () => {
  it('twin daggers: ×1.5 two-handed; a longsword is unchanged by it', () => {
    const c = newCharacter('duelist', 'Joe', 'p', new Rng(1));
    c.equipment.main = makeItem('twin_daggers', 'common', 1);
    c.twoHanded = false;
    const one = computeDerived(c).weaponPower;
    c.twoHanded = true;
    expect(computeDerived(c).weaponPower / one).toBeCloseTo(DUAL_WIELD_MULT, 6);
    expect(DUAL_WIELD_MULT).toBe(1.5);
    c.equipment.main = makeItem('rapier', 'common', 1);
    c.twoHanded = false;
    const r1 = computeDerived(c).weaponPower;
    c.twoHanded = true;
    // the rapier scales on Slicey only, which two-handing does not touch
    expect(computeDerived(c).weaponPower).toBeCloseTo(r1, 6);
  });
});
