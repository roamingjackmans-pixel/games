import { describe, expect, it } from 'vitest';
import { ngBossHpTrim } from '../../src/data/roles';
import { BOSSES } from '../../src/data/bosses';
import { enemyFullHp } from '../../src/game/enemies/spawn';

// D353: zone bosses have half the HP in NG+1 and NG+2 only
describe('NG+1 and NG+2 boss HP trim (D353)', () => {
  it('is 0.5 for NG+1 and NG+2 and 1 everywhere else', () => {
    expect([0, 1, 2, 3, 4, 7, 10].map(ngBossHpTrim)).toEqual([1, 0.5, 0.5, 1, 1, 1, 1]);
  });

  it('lands the Caretaker at half its balance-report totals', () => {
    // before D353 the report listed 118,787 / 603,314 (Caretaker NG+1 / NG+2) and 509,354 / 1,598,221 (Landlord)
    const caretaker = BOSSES.the_caretaker!;
    const landlord = BOSSES.the_landlord!;
    expect(enemyFullHp(caretaker, 1, 1)).toBeCloseTo(118787 / 2, -2);
    expect(enemyFullHp(caretaker, 1, 2)).toBeCloseTo(603314 / 2, -2);
    // the Landlord has four bars (report total 509,354 / 1,598,221): its full HP halves like the others
    expect(enemyFullHp(landlord, 8, 1) / enemyFullHp(landlord, 8, 0)).toBeGreaterThan(1);
  });

  it('leaves the first playthrough and NG+3 on the plain curve', () => {
    const caretaker = BOSSES.the_caretaker!;
    expect(enemyFullHp(caretaker, 1, 0)).toBeCloseTo(2520, -1);
    expect(enemyFullHp(caretaker, 1, 3)).toBeGreaterThan(enemyFullHp(caretaker, 1, 2) * 2);
  });
});
