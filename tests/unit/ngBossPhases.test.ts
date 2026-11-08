// New Game+ boss phases (D295) and an Elite in every New Game+ room (D296).
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { NG_PHASE3_COOLDOWN, NG_PHASE3_DMG, NG_PHASE3_SPEED, ngBossDef } from '../../src/game/boss/ngPhases';
import { generateZone } from '../../src/game/procgen/zone';
import { planRoom } from '../../src/game/procgen/waves';
import { canBeElite } from '../../src/game/procgen/elite';
import { ENEMIES } from '../../src/data/enemies';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import type { BossDef } from '../../src/game/types';

const zoneBosses = (): BossDef[] => Object.values(BOSSES).filter((b) => b.zone <= 7);

describe('New Game+ boss phases (D295)', () => {
  it('the first playthrough and zone 8 keep their phases', () => {
    for (const b of Object.values(BOSSES)) expect(ngBossDef(b, 0)).toBe(b);
    const ll = Object.values(BOSSES).find((b) => b.zone === 8)!;
    expect(ngBossDef(ll, 1)).toBe(ll);
  });

  it('a 50% change moves to 75%, the new one sits at 37.5%, and the third phase is the last one harder', () => {
    const b = BOSSES.the_caretaker!;
    expect(b.phases.map((p) => p.untilHpPct)).toEqual([50, 0]);
    const ng = ngBossDef(b, 1);
    expect(ng.phases.map((p) => p.untilHpPct)).toEqual([75, 37.5, 0]);
    const [, last, ot] = ng.phases;
    // the last phase's attacks, then its own Overtime attacks (D309)
    expect(ot!.attacks.slice(0, last!.attacks.length)).toEqual(last!.attacks);
    expect(ot!.attacks.slice(last!.attacks.length)).toEqual(b.overtimeAttacks);
    expect(ot!.speedMult).toBeCloseTo(last!.speedMult * NG_PHASE3_SPEED, 6);
    expect(ot!.dmgMult).toBeCloseTo(last!.dmgMult * NG_PHASE3_DMG, 6);
    expect(ot!.cooldownMult).toBeCloseTo(NG_PHASE3_COOLDOWN, 6);
    expect(ot!.name).toBe('The lantern breaks: Overtime');
    // the last phase's arena change is not applied again
    expect(ot!.arena).toBeUndefined();
    // the NG-only Last Rites (D277) is still there
    expect(ot!.attacks.some((a) => a.condition === 'cycleAtLeast(1)')).toBe(true);
    // Saint Aurelia: 75% → 87.5%, then 43.75%
    expect(ngBossDef(BOSSES.saint_aurelia!, 1).phases.map((p) => p.untilHpPct)).toEqual([87.5, 43.75, 0]);
  });

  it('Ignatius keeps his split and refill; his third phase starts at 50% of the refilled bar', () => {
    const ng = ngBossDef(BOSSES.foreman_ignatius!, 2);
    expect(ng.phases.map((p) => p.untilHpPct)).toEqual([0, 50, 0]);
    expect(ng.phases[1]!.refillHp).toBe(true);
    expect(ng.phases[2]!.refillHp).toBeUndefined();
    expect(ng.phases[2]!.passive?.splitBody).toBe(ng.phases[1]!.passive?.splitBody);
  });

  function session(zone: number): GameSession {
    const ch = newCharacter('knight', 'Joe', 'p1', new Rng('ngb'));
    ch.tutorialDone = true;
    ch.cycle = 1;
    const save = newSave(1, ch, 'NG-BOSS-SEED');
    save.world.zone = zone;
    save.world.respawnBonfireId = `z${zone}-start`;
    const s = new GameSession(save);
    s.start();
    return s;
  }
  const hit = (s: GameSession, b: Entity, amount: number): void => {
    const spec = emptySpec('normal');
    spec.dmg.physical = amount;
    hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
  };

  for (const def of zoneBosses()) {
    it(`${def.name} fights through all three phases in New Game+`, () => {
      const s = session(def.zone);
      s.w.god = true;
      s.enterRoom(s.layout.bossId, 's');
      for (let i = 0; i < 100; i++) stepWorld(s.w);
      const b = s.w.get(s.w.bossId)!;
      const ng = b.en!.def as unknown as BossDef;
      expect(ng.phases.length).toBe(3);
      const used: Set<string>[] = [new Set(), new Set(), new Set()];
      const watch = (sec: number): void => {
        for (let i = 0; i < sec * 60; i++) {
          stepWorld(s.w);
          for (const e of s.w.enemies) if (e.en?.attack) used[b.en!.phase]!.add(e.en.attack.def.id);
        }
      };
      watch(8);
      expect(b.en!.phase).toBe(0);
      for (let p = 1; p <= 2; p++) {
        // down to just under the next change (a "killing blow" for Ignatius's split)
        let guard = 0;
        while (b.en!.phase < p && guard++ < 50) {
          if (b.en!.phaseTransitionUntil > s.w.time) watch(0.5);
          else hit(s, b, b.hp!.max * 0.3);
        }
        expect(b.en!.phase).toBe(p);
        expect(b.hp!.dead).toBe(false);
        watch(9);
        expect(b.en!.phase).toBe(p);
      }
      expect(used[2]!.size, def.id).toBeGreaterThanOrEqual(1);
      // Overtime shortens its cooldowns
      expect(ng.phases[2]!.cooldownMult).toBeCloseTo(NG_PHASE3_COOLDOWN, 6);
      // and it can still be killed
      let guard = 0;
      while (!b.hp!.dead && guard++ < 50) hit(s, b, b.hp!.max * 0.5);
      expect(b.hp!.dead).toBe(true);
    });
  }

  it('the NG+ bonus boss uses the New Game+ list but stays in its phase 2', () => {
    const w = new World('BONUS', Room.empty());
    w.cycle = 1;
    const b = spawnEnemy(w, BOSSES.saint_aurelia!, 640, 300, { zone: 6, cycle: 1 });
    expect((b.en!.def as unknown as BossDef).phases.length).toBe(3);
  });
});

describe('an Elite in every New Game+ room (D296)', () => {
  const count = (cycle: number, seed: string, zone: number): { rooms: number; withElite: number; sig: string } => {
    const L = generateZone(seed, zone, { cycle });
    let rooms = 0;
    let withElite = 0;
    const sig: string[] = [];
    for (const r of L.rooms) {
      const p = planRoom(L, r);
      if (!p.waves.length) continue;
      rooms++;
      const n = p.waves.flat().filter((u) => u.elite).length;
      if (n) withElite++;
      for (const u of p.waves.flat()) if (u.elite) expect(canBeElite(ENEMIES[u.defId])).toBe(true);
      sig.push(p.waves.map((wv) => wv.map((u) => `${u.defId}${u.elite ? '*' + u.elite : ''}`).join(',')).join('|'));
    }
    return { rooms, withElite, sig: sig.join('/') };
  };
  it('every combat room of every zone has one from NG+1, deterministically', () => {
    for (let z = 1; z <= 8; z++) {
      for (const seed of ['E1', 'E2', 'E3']) {
        const a = count(1, seed, z);
        expect(a.rooms).toBeGreaterThan(0);
        expect(a.withElite).toBe(a.rooms);
        expect(count(1, seed, z).sig).toBe(a.sig);
      }
    }
  });
  it('the first playthrough still rolls them by chance only', () => {
    let rooms = 0;
    let withElite = 0;
    for (let z = 1; z <= 8; z++)
      for (const seed of ['E1', 'E2', 'E3']) {
        const a = count(0, seed, z);
        rooms += a.rooms;
        withElite += a.withElite;
      }
    expect(withElite).toBeLessThan(rooms);
  });
});
