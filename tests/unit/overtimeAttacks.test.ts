// D309: every zone 1–7 boss's New Game+ third phase ("Overtime", D295) brings at least two attacks of its own, which
// pass the usual rules and are really used in the fight.
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { startBossPhase } from '../../src/game/combat/bossPhase';
import { ngBossDef } from '../../src/game/boss/ngPhases';
import { validateBoss, type ValidationIssue } from '../../src/data/validate';
import type { BossDef } from '../../src/game/types';

const zoneBosses = (): BossDef[] => Object.values(BOSSES).filter((b) => b.zone <= 7);

describe('New Game+ Overtime attacks (D309)', () => {
  it('every zone 1–7 boss has at least two Overtime attacks found in no earlier phase; they pass validation', () => {
    for (const b of zoneBosses()) {
      const ng = ngBossDef(b, 1);
      const ot = ng.phases[ng.phases.length - 1]!;
      const earlier = new Set(ng.phases.slice(0, -1).flatMap((p) => p.attacks.map((a) => a.id)));
      const fresh = ot.attacks.filter((a) => !earlier.has(a.id));
      expect(fresh.length, b.id).toBeGreaterThanOrEqual(2);
      // a mix: at least one Red or Piercing among them, never both on one attack
      expect(fresh.some((a) => a.kind === 'red' || a.kind === 'pierce'), b.id).toBe(true);
      // no new hit bigger than the biggest the boss already has in its last phase
      const biggest = Math.max(...ng.phases[ng.phases.length - 2]!.attacks.map((a) => Math.max(a.dmgMult, ...(a.comboMults ?? [0]))));
      for (const a of fresh) expect(Math.max(a.dmgMult, ...(a.comboMults ?? [0])), `${b.id}/${a.id}`).toBeLessThanOrEqual(biggest);
      const issues: ValidationIssue[] = [];
      validateBoss({ ...ng, id: `${b.id} (NG+)` }, issues);
      expect(issues, b.id).toEqual([]);
      // the first playthrough never sees them
      expect(b.phases.some((p) => p.attacks.some((a) => fresh.includes(a))), b.id).toBe(false);
    }
  });

  function session(zone: number): GameSession {
    const ch = newCharacter('knight', 'Joe', 'p1', new Rng('ot'));
    ch.tutorialDone = true;
    ch.cycle = 1;
    const save = newSave(1, ch, 'OVERTIME-SEED');
    save.world.zone = zone;
    save.world.respawnBonfireId = `z${zone}-start`;
    const s = new GameSession(save);
    s.start();
    return s;
  }

  for (const def of zoneBosses()) {
    it(`${def.name}'s Overtime uses its new attacks`, () => {
      const s = session(def.zone);
      s.w.god = true;
      s.enterRoom(s.layout.bossId, 's');
      for (let i = 0; i < 100; i++) stepWorld(s.w);
      const b = s.w.get(s.w.bossId)!;
      const ng = b.en!.def as unknown as BossDef;
      const fresh = new Set((def.overtimeAttacks ?? []).map((a) => a.id));
      // straight into Overtime (through the split for Ignatius, so his on-foot body is there)
      for (let p = 1; p <= 2; p++) {
        startBossPhase(s.w, b, p);
        for (let i = 0; i < 180; i++) stepWorld(s.w);
      }
      expect(b.en!.phase).toBe(ng.phases.length - 1);
      const used = new Set<string>();
      const me = s.w.players[0]!;
      for (let i = 0; i < 40 * 60; i++) {
        // wander so both near and far attacks come up
        if (i % 240 === 0) {
          me.x = 400 + ((i / 240) % 3) * 220;
          me.y = 260 + ((i / 240) % 2) * 220;
        }
        stepWorld(s.w);
        const id = b.en!.attack?.def.id;
        if (id && fresh.has(id)) used.add(id);
      }
      expect(b.hp!.dead).toBe(false);
      expect(used.size, `${def.id}: ${[...used].join(',')}`).toBeGreaterThanOrEqual(2);
    });
  }
});
