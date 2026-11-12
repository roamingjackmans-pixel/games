import { describe, expect, it } from 'vitest';
import { ngBossHpTrim } from '../../src/data/roles';
import { BOSSES } from '../../src/data/bosses';
import { enemyFullHp } from '../../src/game/enemies/spawn';

// D353: zone bosses have half the HP in NG+1 and NG+2; D354: the trim climbs back to 1 by NG+7
describe('NG+1 and NG+2 boss HP trim (D353)', () => {
  it('is 0.5 for NG+1 and NG+2, climbs 0.6 to 0.9 over NG+3–NG+6, and is 1 elsewhere', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 10].map(ngBossHpTrim)).toEqual([1, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1]);
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

  it('leaves the first playthrough alone and steps NG+2 to NG+3 by under 3x for every zone boss (was 3.1–4.5x)', () => {
    expect(enemyFullHp(BOSSES.the_caretaker!, 1, 0)).toBeCloseTo(2520, -1);
    for (const b of Object.values(BOSSES).filter((x) => !x.special)) {
      const step = enemyFullHp(b, b.zone, 3) / enemyFullHp(b, b.zone, 2);
      expect(step).toBeGreaterThan(1.5);
      expect(step).toBeLessThan(2.8);
    }
  });
});
