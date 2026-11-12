import { describe, expect, it } from 'vitest';
import { ngEnemyHpTrim } from '../../src/data/roles';
import { ENEMIES } from '../../src/data/enemies';
import { zoneDef } from '../../src/data/zones';
import { enemyFullHp } from '../../src/game/enemies/spawn';

const avgRoster = (z: number, c: number): number => {
  const hp = zoneDef(z).enemies.map((id) => enemyFullHp(ENEMIES[id]!, z, c));
  return hp.reduce((a, b) => a + b, 0) / hp.length;
};

// D352: room enemies in the early New Game+ zones lose HP by zone
describe('NG+ early-zone enemy HP trim (D352)', () => {
  it('has the owner\'s per-zone factors', () => {
    expect([1, 2, 3, 4, 5, 8].map((z) => ngEnemyHpTrim(z, 1))).toEqual([0.4, 0.56, 0.75 * 1.15, 0.84 * 1.15, 1, 1]); // D366: zones 3 and 4 +15%
    expect([1, 2, 3].map((z) => ngEnemyHpTrim(z, 2))).toEqual([0.85, 1, 1]);
    expect(ngEnemyHpTrim(1, 0)).toBe(1);
    expect(ngEnemyHpTrim(1, 3)).toBe(1);
  });

  it('puts the zone averages where the report says they land (60% / 44% / 25% / 16% off NG+1, 15% off NG+2 zone 1)', () => {
    // the averages before D352 were 1,949 / 1,762 / 1,760 / 1,983 (NG+1 zones 1–4) and 5,585 (NG+2 zone 1)
    expect(avgRoster(1, 1)).toBeCloseTo(1949 * 0.4, -1);
    expect(avgRoster(2, 1)).toBeCloseTo(1762 * 0.56, -1);
    expect(avgRoster(3, 1)).toBeCloseTo(1760 * 0.75 * 1.15, -1);
    expect(avgRoster(4, 1)).toBeCloseTo(1983 * 0.84 * 1.15, -1);
    expect(avgRoster(1, 2)).toBeCloseTo(5585 * 0.85, -1);
    // untouched: zone 5 NG+1 and the first playthrough
    expect(avgRoster(5, 1)).toBeCloseTo(2065, -1);
    expect(avgRoster(1, 0)).toBeCloseTo(90, -1);
  });
});
