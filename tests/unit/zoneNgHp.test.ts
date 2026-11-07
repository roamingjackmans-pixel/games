// D257: zone 1's regular enemies have three times their HP in New Game+ (not the first playthrough, not the boss).
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { zoneNgHpFactor } from '../../src/data/roles';
import { enemyHpMult } from '../../src/game/combat/formulas';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';

const hp = (id: string, zone: number, cycle: number, boss = false): number =>
  spawnEnemy(new World(`Z${zone}${cycle}`, Room.empty()), (boss ? BOSSES[id] : ENEMIES[id]) as never, 640, 368, { zone, cycle, players: 1 }).hp!.max;

describe('zone 1 in New Game+ (D257)', () => {
  it('×3 in every NG+ cycle, only in zone 1, never for its boss or the first playthrough', () => {
    expect([zoneNgHpFactor(1, 0, false), zoneNgHpFactor(1, 1, false), zoneNgHpFactor(1, 3, false), zoneNgHpFactor(1, 1, true), zoneNgHpFactor(2, 1, false)]).toEqual([1, 3, 3, 1, 1]);
    const ratio = hp('shambler', 1, 1) / hp('shambler', 1, 0);
    expect(ratio).toBeCloseTo((enemyHpMult(1, 1, 1) / enemyHpMult(1, 0, 1)) * 3, 6);
    expect(hp('the_caretaker', 1, 1, true)).toBeGreaterThan(0);
  });
});
