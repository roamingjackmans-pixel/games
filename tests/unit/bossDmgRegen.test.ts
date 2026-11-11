// D314: bosses hit 75% harder from NG+1 on (later cycles grow from there); stamina regen reaches 55 a second at 200.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { THE_CARETAKER } from '../../src/data/bosses/crypt';
import { NG_BOSS_DMG_MULT, levelPaceComp } from '../../src/data/roles';
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
