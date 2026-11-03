// D88–D89: requirement-gated buffs, the skill schedule, bows and parry tuning.
import { describe, expect, it } from 'vitest';
import { rollSkillCount, GRADE_MULT } from '../../src/game/combat/formulas';
import { Rng } from '../../src/engine/rng';
import { computeDerived } from '../../src/game/player/derived';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { WEAPONS } from '../../src/data/weapons';

function maxOver(zone: number, cycle: number, legendary = true): number {
  const r = new Rng(`s${zone}${cycle}`);
  let m = 0;
  for (let i = 0; i < 4000; i++) m = Math.max(m, rollSkillCount(() => r.next(), zone, cycle, legendary));
  return m;
}

describe('skill schedule (D89)', () => {
  it('no skills before zone 4, Q from zone 4, E from NG+, R from NG+2', () => {
    expect(maxOver(3, 0)).toBe(0);
    expect(maxOver(4, 0)).toBe(1);
    expect(maxOver(8, 0)).toBe(1);
    expect(maxOver(1, 1)).toBe(2);
    expect(maxOver(8, 1)).toBe(2);
    expect(maxOver(1, 2)).toBe(3);
  });
});

describe('requirement-gated buffs (D88)', () => {
  it('an affix on gear you cannot use gives nothing', () => {
    const c = newCharacter('scholar', 'Joe', 'p', new Rng(1));
    const hammer = makeItem('greathammer', 'rare', 1);
    hammer.affixes = [{ id: 'hale', value: 3 }];
    c.equipment.main = hammer;
    expect(computeDerived(c).stats.hp).toBe(c.stats.hp);
    c.stats.bonk = 40;
    expect(computeDerived(c).stats.hp).toBe(c.stats.hp + 3);
  });
});

describe('bows and scaling (D88)', () => {
  it('bows need two hands, barely stagger and cost more stamina; grades are steeper', () => {
    expect(WEAPONS.bow!.twoHandOnly).toBe(true);
    expect(WEAPONS.bow!.poiseDmg).toBeLessThanOrEqual(3);
    expect(WEAPONS.bow!.stamina).toBeGreaterThanOrEqual(18);
    expect(GRADE_MULT.A).toBeGreaterThan(1.2);
  });
});
