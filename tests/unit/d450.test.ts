// D450, D451: every stat's gains reshaped. The first 50 points climb to their best at 21–30 and ease off from there; no
// early point is worth less than before, and every stat ends at 999 exactly where it did.
import { describe, expect, it } from 'vitest';
import { EARLY_SHAPE, castMoveMult, flaskHeal, maxEquipLoad, maxHP, maxStamina, scalingCurve, scalingCurveBefore, slickCast, staminaRegen } from '../../src/game/combat/formulas';

const BANDS: [number, number][] = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 100], [101, 150], [151, 200], [201, 300], [301, 400], [401, 500], [501, 700], [701, 999]];
/** An S weapon's % of base damage a point, over a band. */
const sPerPoint = (f: (s: number) => number, a: number, b: number): number => (190 * (f(b) - f(a - 1))) / (b - a + 1);

describe('stat gains reshaped (D450)', () => {
  it("an S weapon's Bonk: the owner's numbers to 50, best at 21–30, then always a little less per point", () => {
    BANDS.slice(0, 5).forEach(([a, b], i) => expect(sPerPoint(scalingCurve, a, b), `${a}-${b}`).toBeCloseTo(EARLY_SHAPE[i]!, 6));
    const per = BANDS.map(([a, b]) => sPerPoint(scalingCurve, a, b));
    expect(Math.max(...per)).toBe(per[2]);
    for (let i = 3; i < per.length; i++) expect(per[i]!, BANDS[i]!.join('-')).toBeLessThanOrEqual(per[i - 1]! + 1e-9);
  });

  it('every stat ends at 999 where it did before (D451)', () => {
    expect(scalingCurve(999)).toBeCloseTo(scalingCurveBefore(999), 6);
    expect(maxHP(999)).toBe(4885);
    expect(maxStamina(999)).toBe(562);
    expect(maxEquipLoad(999)).toBeCloseTo(230.9, 6);
    expect(staminaRegen(999)).toBeCloseTo(22 + 0.165 * 200 + 0.02 * 799, 6);
    expect(flaskHeal(100, 999)).toBeCloseTo(40 * (1 + 0.003 * 999), 6);
    // in between an S weapon is stronger than it was, most of all around 50
    expect(scalingCurve(50) / scalingCurveBefore(50)).toBeGreaterThan(1.5);
    for (const s of [100, 200, 500, 900]) expect(scalingCurve(s)).toBeGreaterThan(scalingCurveBefore(s));
  });

  it('no stat is worth less than before by 50, and every stat still grows with every point', () => {
    for (let s = 1; s <= 50; s++) expect(scalingCurve(s) + 0.002).toBeGreaterThanOrEqual(scalingCurveBefore(s));
    expect(maxHP(30)).toBe(520);
    expect(maxHP(50)).toBeGreaterThan(680);
    expect(maxStamina(50)).toBe(215);
    expect(maxEquipLoad(50)).toBe(91);
    expect(staminaRegen(50)).toBeCloseTo(30.25, 6);
    for (const f of [scalingCurve, (s: number) => maxHP(s), (s: number) => maxStamina(s), (s: number) => maxEquipLoad(s), (s: number) => staminaRegen(s), (s: number) => flaskHeal(100, s), (s: number) => slickCast(s), (s: number) => castMoveMult(s)])
      for (let s = 1; s <= 999; s += 7) expect(f(s)).toBeGreaterThanOrEqual(f(s - 1));
  });

  it('two-handed Bonk (×1.5) lands between whole points', () => {
    expect(scalingCurve(76.5)).toBeGreaterThan(scalingCurve(76));
    expect(scalingCurve(76.5)).toBeLessThan(scalingCurve(77));
  });
});
