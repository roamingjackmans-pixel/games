// D314: bosses hit 75% harder from NG+1 on (later cycles grow from there); stamina regen reaches 55 a second at 200.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { THE_CARETAKER } from '../../src/data/bosses/crypt';
import { NG_BOSS_DMG_MULT, ROLE_STATS, levelPaceComp, ngBossDmgTrim, ngLevelComp, statCurveComp, zoneDmgFactor } from '../../src/data/roles';
import { MOTHER_SPORE } from '../../src/data/bosses/caverns';
import { enemyDmgMult, staminaRegen } from '../../src/game/combat/formulas';

describe('NG+ boss damage (D314)', () => {
  it("a boss's damage is ×1.75 from NG+1 on, on top of the usual NG+ growth", () => {
    const w = new World('BD', Room.empty());
    const b1 = spawnEnemy(w, THE_CARETAKER, 300, 300, { zone: 1, cycle: 1, players: 1 });
    const b0 = spawnEnemy(w, THE_CARETAKER, 300, 300, { zone: 1, cycle: 0, players: 1 });
    // zone 1 at NG+1 has no level or curve growth (D307, D311), so the cycle curve, D314 and the level pace (D325) separate them
    expect(b1.en!.dmgMult / b0.en!.dmgMult).toBeCloseTo((enemyDmgMult(1, 1) / enemyDmgMult(1, 0)) * NG_BOSS_DMG_MULT * levelPaceComp('dmg', 1, 1), 6);
    expect(NG_BOSS_DMG_MULT).toBe(1.75);
  });
});

describe('stamina regen (D314)', () => {
  it('22 at 0, 55 at 200 Endurance, slow after', () => {
    expect(staminaRegen(0)).toBe(22);
    expect(staminaRegen(200)).toBeCloseTo(55, 6);
    expect(staminaRegen(999)).toBeLessThan(75);
    expect(staminaRegen(60)).toBeCloseTo(22 + 0.165 * 60, 6);
  });
});

describe('zone 2 boss NG+1 damage trim (D362)', () => {
  it('Mother Spore hits 15% harder in NG+1 only, and nothing else changes', () => {
    expect([1, 2, 3, 8].map((z) => ngBossDmgTrim(z, 1))).toEqual([1, 1.15, 1, 1]);
    expect([0, 2, 3, 10].map((c) => ngBossDmgTrim(2, c))).toEqual([1, 1, 1, 1]);
    const w = new World('BD2', Room.empty());
    const dmg = (cycle: number): number => spawnEnemy(w, MOTHER_SPORE, 300, 300, { zone: 2, cycle, players: 1 }).en!.dmgMult;
    // the whole formula for a boss (spawn.ts), with the trim as the only factor in question
    const plain = (cycle: number): number => (ROLE_STATS.boss.dmg / 18) * (MOTHER_SPORE.mult?.dmg ?? 1) * enemyDmgMult(2, cycle) * zoneDmgFactor(2) * ngLevelComp('dmg', 2, cycle) * statCurveComp('dmg', 2, cycle) * levelPaceComp('dmg', 2, cycle) * (cycle >= 1 ? NG_BOSS_DMG_MULT : 1);
    expect(dmg(1)).toBeCloseTo(plain(1) * 1.15, 6);
    expect(dmg(0)).toBeCloseTo(plain(0), 6);
    expect(dmg(2)).toBeCloseTo(plain(2), 6);
  });
});
