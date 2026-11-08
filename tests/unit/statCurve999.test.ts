// D311: stats go to 999; an S weapon doubles from 50 to 100, eases past the soft cap 150 and triples from 150 to 999;
// enemies grow by 70% of that to NG+2, then by the late-cycle table (sturdier to NG+7, brutal by NG+10).
import { describe, expect, it } from 'vitest';
import { STAT_CAP, STAT_SOFT_CAP, castMoveMult, maxHP, scalingCurve, slickCast, softStatCurve } from '../../src/game/combat/formulas';
import { NG_LATE, STAT_CURVE_COMP, statCurveComp } from '../../src/data/roles';
import { canRaise, newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';

const S = (x: number): number => 1 + 1.9 * scalingCurve(x);

describe('stats to 999 (D311)', () => {
  it('every stat can be raised past 99, up to 999', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.stats.bonk = 99;
    expect(canRaise(c, 'bonk')).toBe(true);
    c.stats.bonk = STAT_CAP;
    expect(canRaise(c, 'bonk')).toBe(false);
  });
  it('an S weapon: unchanged to 50, ×2 by 100, most of the gain by 150, ×3 from 150 to 999', () => {
    expect(scalingCurve(40)).toBeCloseTo(softStatCurve(40), 10);
    expect(S(100) / S(50)).toBeCloseTo(2, 6);
    expect(S(STAT_CAP) / S(STAT_SOFT_CAP)).toBeCloseTo(3, 6);
    // the gain per point is largest before the soft cap and keeps shrinking after it
    const per = (a: number, b: number): number => (scalingCurve(b) - scalingCurve(a)) / (b - a);
    expect(per(100, 150)).toBeGreaterThan(per(150, 300));
    expect(per(150, 300)).toBeGreaterThan(per(800, 999));
    for (let x = 1; x <= STAT_CAP; x++) expect(scalingCurve(x)).toBeGreaterThanOrEqual(scalingCurve(x - 1));
  });
  it('HP grows with the same shape; cast speed and moving while casting keep the old settling curve', () => {
    expect((maxHP(100) - 100) / (maxHP(50) - 100)).toBeCloseTo(2, 5);
    expect(slickCast(999)).toBeLessThan(1.26);
    expect(castMoveMult(999)).toBeLessThan(0.76);
  });
});

describe('enemies grow with it (D311)', () => {
  it('to NG+2 they take 70% of the measured gain; the first playthrough is all but untouched', () => {
    for (let z = 1; z <= 7; z++) expect(statCurveComp('hp', z, 0)).toBe(1);
    expect(statCurveComp('hp', 8, 2)).toBe(STAT_CURVE_COMP.hp[2][8]);
    expect(STAT_CURVE_COMP.hp[2][8]!).toBeGreaterThan(STAT_CURVE_COMP.hp[1][8]!);
  });
  it('from NG+3 a cycle table: a build gets sturdier to NG+7, then enemy damage climbs so NG+10 is hard', () => {
    expect(statCurveComp('dmg', 4, 7)).toBe(NG_LATE[7]!.dmg);
    expect(NG_LATE[7]!.dmg).toBeLessThan(NG_LATE[3]!.dmg);
    expect(NG_LATE[10]!.dmg).toBeGreaterThan(NG_LATE[3]!.dmg);
    expect(statCurveComp('dmg', 4, 15)).toBe(NG_LATE[10]!.dmg);
  });
});
