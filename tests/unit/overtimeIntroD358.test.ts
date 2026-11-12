import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ngBossDef } from '../../src/game/boss/ngPhases';
import { enemyFullHp } from '../../src/game/enemies/spawn';

// D358: the Caretaker's and Mother Spore's New Game+ third phase arrives with its own scripted, field-clearing change
describe('Overtime arrival for zones 1 and 2 (D358)', () => {
  it.each(['the_caretaker', 'mother_spore'])('%s: a named, scripted third phase from NG+1, the plain one before', (id) => {
    const def = BOSSES[id]!;
    expect(def.overtimeIntro).toBeDefined();
    const first = ngBossDef(def, 0);
    expect(first.phases).toHaveLength(2);
    const ng = ngBossDef(def, 1);
    expect(ng.phases).toHaveLength(3);
    const p3 = ng.phases[2]!;
    expect(p3.name).toBe(def.overtimeIntro!.name);
    expect(p3.clearField).toBe(true);
    expect(p3.transitionS).toBeGreaterThan(3);
    expect(p3.transitionBeats!.length).toBeGreaterThanOrEqual(4);
    const times = p3.transitionBeats!.map((b) => b.atS);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(Math.max(...times)).toBeLessThan(p3.transitionS!);
    // it still fights with the last phase's attacks and the Overtime ones
    expect(p3.attacks.length).toBeGreaterThan(ng.phases[1]!.attacks.length - 1);
    expect(enemyFullHp(def, def.zone, 1)).toBeGreaterThan(0);
  });

  it('other bosses keep the plain Overtime change', () => {
    const p3 = ngBossDef(BOSSES.bloatking!, 1).phases[2]!;
    expect(p3.name).toMatch(/: Overtime$/);
    expect(p3.transitionBeats).toBeUndefined();
    expect(p3.clearField).toBeUndefined();
  });
});
