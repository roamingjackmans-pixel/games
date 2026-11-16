// D421: fist weapons (the Cestus and its Hollow and Fervent variants) are dual-wielded when two-handed, as the twin
// blades are (D318): one on each hand, hitting 50% harder; one-handed they are unchanged.
import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../../src/data/weapons';
import { weaponOf } from '../../src/game/items/weaponOf';
import { isPairedWeapon } from '../../src/engine/draw/weapons';
import { weaponSpecials } from '../../src/ui/itemSpecials';
import { makeItem } from '../../src/game/items/make';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived, DUAL_WIELD_MULT } from '../../src/game/player/derived';
import { Rng } from '../../src/engine/rng';

describe('fist weapons dual-wield two-handed (D421)', () => {
  it('the Cestus and its variants are paired and drawn on both hands', () => {
    expect(WEAPONS.cestus!.paired).toBe(true);
    for (const variant of ['hollow', 'fervent', 'keen', 'blessed']) expect(weaponOf({ baseId: 'cestus', variant })!.paired, variant).toBe(true);
    expect(isPairedWeapon(WEAPONS.cestus!.draw)).toBe(true);
    expect(weaponSpecials(WEAPONS.cestus!).join(' ')).toMatch(/Dual-wielded/);
  });

  it('two-handed it hits 50% harder than it would unpaired; one-handed nothing changes', () => {
    const c = newCharacter('brute', 'Joe', 'p', new Rng('FIST'));
    for (const k of Object.keys(c.stats) as (keyof typeof c.stats)[]) c.stats[k] = 40;
    c.equipment.main = makeItem('cestus', 'common');
    c.equipment.off = null;
    const power = (two: boolean, paired: boolean): number => {
      c.twoHanded = two;
      const was = WEAPONS.cestus!.paired;
      WEAPONS.cestus!.paired = paired;
      try {
        return computeDerived(c).weaponPower;
      } finally {
        WEAPONS.cestus!.paired = was === true;
      }
    };
    expect(power(true, true) / power(true, false)).toBeCloseTo(DUAL_WIELD_MULT, 6);
    expect(power(false, true)).toBeCloseTo(power(false, false), 6);
  });
});
