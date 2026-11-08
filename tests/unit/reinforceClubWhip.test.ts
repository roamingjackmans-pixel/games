// D302: Club and Whip hit like other weapons; D303: weapon reinforcement 15% a step, enemy HP cut to match.
import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../../src/data/weapons';
import { expectedReinforce, reinforceDmgMult, reinforceHpFactor, reinforceMult } from '../../src/data/essence';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';

describe('Club and Whip (D302)', () => {
  it('have the higher base their poor scaling calls for (D40)', () => {
    expect(WEAPONS.club!.base1).toBe(80);
    expect(WEAPONS.whip!.base1).toBe(65);
  });
});

describe('reinforcement (D303)', () => {
  it('weapons gain 15% a step (+15 is ×3.25); armour and shields keep 20% (×4)', () => {
    expect(reinforceDmgMult(3)).toBeCloseTo(1.45, 10);
    expect(reinforceDmgMult(15)).toBeCloseTo(3.25, 10);
    expect(reinforceMult(15)).toBeCloseTo(4, 10);
  });
  it('the expected reinforcement: +3 by zone 6 of the first playthrough, +6 in NG+1, up to +15', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((z) => expectedReinforce(z, 0))).toEqual([0, 0, 0, 1, 2, 3, 3, 3]);
    expect(expectedReinforce(1, 1)).toBe(4);
    expect(expectedReinforce(8, 1)).toBe(6);
    expect(expectedReinforce(8, 2)).toBe(9);
    expect(expectedReinforce(8, 9)).toBe(15);
  });
  it('enemy HP loses what that reinforcement lost in damage: none early, about 9% late in the first playthrough, about 19% at +15', () => {
    expect(reinforceHpFactor(1, 0)).toBe(1);
    expect(reinforceHpFactor(8, 0)).toBeCloseTo(1.45 / 1.6, 10);
    expect(reinforceHpFactor(8, 9)).toBeCloseTo(3.25 / 4, 10);
    const w = new World('HP', Room.empty());
    const z1 = spawnEnemy(w, ENEMIES.shambler!, 300, 300, { zone: 1, cycle: 0 });
    const z1b = spawnEnemy(w, ENEMIES.shambler!, 300, 300, { zone: 1, cycle: 0 });
    expect(z1.hp!.max).toBe(z1b.hp!.max);
    // a player at the expected +p kills a zone's enemy in the same time as before: damage and HP fell by one factor
    for (const [z, c] of [[8, 0], [3, 1], [8, 2]] as const) {
      const p = expectedReinforce(z, c);
      expect((reinforceDmgMult(p) / reinforceMult(p)) / reinforceHpFactor(z, c)).toBeCloseTo(1, 10);
    }
  });
});
