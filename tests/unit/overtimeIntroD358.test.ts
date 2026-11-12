import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ngBossDef } from '../../src/game/boss/ngPhases';
import { enemyFullHp } from '../../src/game/enemies/spawn';

// D358, D359: every zone 1–7 boss's New Game+ third phase arrives with its own scripted, field-clearing change
describe('Overtime arrival for zones 1 to 7 (D358, D359)', () => {
  it.each(['the_caretaker', 'mother_spore', 'bloatking', 'vexthorn', 'foreman_ignatius', 'saint_aurelia', 'archmagister_tock'])('%s: a named, scripted third phase from NG+1, the plain one before', (id) => {
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

  it('the Landlord (zone 8, no third phase) is untouched', () => {
    expect(BOSSES.the_landlord!.overtimeIntro).toBeUndefined();
    expect(ngBossDef(BOSSES.the_landlord!, 1)).toBe(BOSSES.the_landlord);
  });
});
