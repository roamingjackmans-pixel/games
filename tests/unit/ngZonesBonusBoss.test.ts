// New Game+ tuning (D275–D278): room enemy damage by zone, zone 8's head count in every zone, the Caretaker's
// map-wide Red, and the bonus phase-2 boss in one room per zone.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { enemyFullHp, spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { THE_CARETAKER } from '../../src/data/bosses/crypt';
import { NG_ZONE_ENEMY_DMG, levelPaceComp, ngLevelComp, statCurveComp, ngZoneEnemyDmg, zoneDmgFactor } from '../../src/data/roles';
import { enemyDmgMult } from '../../src/game/combat/formulas';
import { generateZone } from '../../src/game/procgen/zone';
import { planRoom } from '../../src/game/procgen/waves';
import { zoneDef } from '../../src/data/zones';
import type { BossDef } from '../../src/game/types';
import { BONUS_BOSS_HP_PCT, bonusBossFor, bonusBossPool } from '../../src/game/procgen/bonusBoss';
import { checkDeath } from '../../src/game/combat/damage';
import { validateAttack } from '../../src/data/validate';
import { World } from '../../src/game/world';
import { attackDamage } from '../../src/game/enemies/spawn';

const level = (z: number): number => enemyDmgMult(z, 1) * zoneDmgFactor(z);

describe('New Game+ room enemy damage by zone (D275)', () => {
  it('doubles zone 2, raises zone 8 by 65%, climbs zones 3 to 7 between them, and leaves the first playthrough alone (D287)', () => {
    expect(ngZoneEnemyDmg(1, 1)).toBe(1);
    expect(ngZoneEnemyDmg(2, 1)).toBe(2);
    expect(ngZoneEnemyDmg(8, 1)).toBe(1.65);
    for (let z = 1; z <= 8; z++) expect(ngZoneEnemyDmg(z, 0)).toBe(1);
    // later cycles carry it like everything else
    expect(ngZoneEnemyDmg(2, 3)).toBe(2);
    // each roster's average hit at NG+1 before this table, then after it
    const rosterHit = (z: number): number => {
      const w = new World('hit');
      let s = 0;
      let n = 0;
      for (const d of Object.values(ENEMIES).filter((e) => e.zone === z && !e.special)) {
        const e = spawnEnemy(w, d, 640, 300, { cycle: 1, zone: z });
        for (const atk of d.attacks) {
          if (!atk.dmgMult) continue;
          s += attackDamage(e, atk.dmgMult);
          n++;
        }
      }
      // without D287's table and D307's level growth, which is checked on its own
      return s / n / ngZoneEnemyDmg(z, 1) / ngLevelComp('dmg', z, 1) / statCurveComp('dmg', z, 1) / levelPaceComp('dmg', z, 1);
    };
    const base = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((z) => (z ? rosterHit(z) : 0));
    const a = 2 * base[2]!;
    const b = 1.65 * base[8]!;
    let prev = a;
    for (let z = 3; z <= 8; z++) {
      const line = a * Math.pow(b / a, (z - 2) / 6);
      const hit = base[z]! * (NG_ZONE_ENEMY_DMG[z] ?? 1);
      expect(Math.abs(hit - line) / line).toBeLessThan(0.01);
      expect(hit).toBeGreaterThan(prev);
      prev = hit;
    }
  });

  it('applies to room enemies only, not bosses', () => {
    const w = new World('dmg');
    const s1 = spawnEnemy(w, ENEMIES.shambler!, 640, 300, { cycle: 1, zone: 2 });
    const s0 = spawnEnemy(w, ENEMIES.shambler!, 640, 300, { cycle: 1, zone: 1 });
    const lc = (ngLevelComp('dmg', 2, 1) * levelPaceComp('dmg', 2, 1)) / (ngLevelComp('dmg', 1, 1) * levelPaceComp('dmg', 1, 1)); // D307, D325, for everyone
    expect(s1.en!.dmgMult / s0.en!.dmgMult).toBeCloseTo(((2 * level(2)) / level(1)) * lc, 5);
    const b2 = spawnEnemy(w, THE_CARETAKER, 640, 300, { cycle: 1, zone: 2 });
    const b1 = spawnEnemy(w, THE_CARETAKER, 640, 300, { cycle: 1, zone: 1 });
    expect(b2.en!.dmgMult / b1.en!.dmgMult).toBeCloseTo((level(2) / level(1)) * lc, 5);
  });
});

describe("New Game+ rooms hold zone 8's numbers (D276)", () => {
  const perRoom = (z: number, cycle: number): number => {
    let n = 0;
    let rooms = 0;
    for (let s = 0; s < 25; s++) {
      const L = generateZone(`NGC${s}`, z, { cycle });
      for (const r of L.rooms) {
        const p = planRoom(L, r);
        if (!p.waves.length) continue;
        rooms++;
        n += p.waves.flat().length;
      }
    }
    return n / rooms;
  };
  it('zones 1 to 7 in NG+ hold about as many enemies per room as zone 8, and never fewer than before', () => {
    const z8 = perRoom(8, 1);
    for (let z = 1; z <= 7; z++) {
      const ng = perRoom(z, 1);
      expect(ng).toBeGreaterThan(z8 * 0.85);
      expect(ng).toBeLessThan(z8 * 1.25);
    }
    // zone 1's rooms in NG+ nearly double the first playthrough's
    expect(perRoom(1, 1)).toBeGreaterThan(perRoom(1, 0) * 1.6);
  });
  it('is deterministic and keeps what a room pays (the share grows with it)', () => {
    const a = generateZone('DET', 2, { cycle: 1 });
    const b = generateZone('DET', 2, { cycle: 1 });
    for (const r of a.rooms) expect(JSON.stringify(planRoom(a, r))).toBe(JSON.stringify(planRoom(b, b.byId[r.id]!)));
    const room = a.rooms.find((r) => r.kind === 'combat' && planRoom(a, r).waves.length)!;
    expect(planRoom(a, room).share!).toBeGreaterThan(1.5);
  });
});

describe("The Caretaker's Last Rites (D277)", () => {
  const rites = THE_CARETAKER.phases.map((p) => p.attacks.find((a) => a.id === 'caretaker_last_rites')!);
  it('is a map-wide Red with a long telegraph, only from NG+1, in both phases', () => {
    for (const a of rites) {
      expect(a).toBeTruthy();
      expect(a.kind).toBe('red');
      expect(a.pattern).toEqual({ kind: 'ring', rIn: 0, rOut: 'edge', anchor: 'self' });
      expect(a.windupMs).toBeGreaterThanOrEqual(2000);
      expect(a.condition).toBe('cycleAtLeast(1)');
      const issues: { where: string; msg: string }[] = [];
      validateAttack('rites', a, issues);
      expect(issues).toEqual([]);
    }
  });
  it('hits for about 600 at NG+1 solo in either phase, more every cycle after', () => {
    const w = new World('rites');
    const b = spawnEnemy(w, THE_CARETAKER, 640, 300, { cycle: 1, zone: 1, players: 1 });
    const p1 = attackDamage(b, rites[0]!.dmgMult) * THE_CARETAKER.phases[0]!.dmgMult;
    const p2 = attackDamage(b, rites[1]!.dmgMult) * THE_CARETAKER.phases[1]!.dmgMult;
    expect(p1).toBeGreaterThan(560);
    expect(p1).toBeLessThan(640);
    expect(p2).toBeGreaterThan(560);
    expect(p2).toBeLessThan(640);
    const b2 = spawnEnemy(w, THE_CARETAKER, 640, 300, { cycle: 2, zone: 1, players: 1 });
    expect(attackDamage(b2, rites[0]!.dmgMult)).toBeGreaterThan(p1 * 2);
  });
});

function ngSession(seed: string, zone = 1, cycle = 1): GameSession {
  const c = newCharacter('knight', 'Joe', 'p', new Rng('bb'));
  c.cycle = cycle;
  c.tutorialDone = true;
  c.level = 120;
  const save = newSave(1, c, seed);
  save.world.zone = zone;
  const s = new GameSession(save);
  s.start();
  return s;
}

describe('New Game+ bonus boss rooms (D278)', () => {
  it('leaves out the bosses tied to their arenas', () => {
    const ids = bonusBossPool().map((b) => b.id);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    for (const id of ids) expect(BOSSES[id]!.arenaBound).toBeFalsy();
    expect(ids).not.toContain('the_landlord');
    expect(ids).not.toContain('bloatking');
    expect(ids).not.toContain('foreman_ignatius');
  });

  it('one combat room per zone from NG+1, none on the first playthrough, picked the same way every time', () => {
    for (let z = 1; z <= 8; z++) {
      const L0 = generateZone('BB', z, { cycle: 0 });
      expect(bonusBossFor(L0)).toBeNull();
      const L = generateZone('BB', z, { cycle: 1 });
      const bb = bonusBossFor(L)!;
      expect(bb).toBeTruthy();
      expect(L.byId[bb.roomId]!.kind).toBe('combat');
      expect(bonusBossFor(generateZone('BB', z, { cycle: 1 }))).toEqual(bb);
      const bonusRooms = L.rooms.filter((r) => planRoom(L, r).bonusBoss);
      expect(bonusRooms.map((r) => r.id)).toEqual([bb.roomId]);
      expect(planRoom(L, L.byId[bb.roomId]!).waves).toEqual([]);
    }
    // seeds spread the picks over the pool
    const picks = new Set<string>();
    for (let s = 0; s < 40; s++) picks.add(bonusBossFor(generateZone(`P${s}`, 3, { cycle: 1 }))!.bossId);
    expect(picks.size).toBeGreaterThanOrEqual(3);
  });

  it('spawns the boss in its second phase at 30% of the zone boss HP this playthrough, and clears the room when it falls', () => {
    const s = ngSession('BONUSROOM');
    const bb = bonusBossFor(s.layout)!;
    const node = s.layout.byId[bb.roomId]!;
    s.enterRoom(bb.roomId, node.doors[0]!);
    expect(s.roomPhase).toBe('armed');
    const me = s.w.players[0]!;
    // walk in
    me.x = 640;
    me.y = 368;
    s.tick(0.016);
    expect(s.roomPhase).toBe('fighting');
    const boss = s.w.get(s.w.bossId)!;
    expect(boss?.en?.bonusBoss).toBe(true);
    expect(boss.en!.def.id).toBe(bb.bossId);
    expect(boss.en!.phase).toBe(1);
    expect(boss.en!.phaseAttacks).toBe(BOSSES[bb.bossId]!.phases[1]!.attacks);
    // D322: a full bar of 30% of the room's zone boss's full HP this playthrough, not of its own
    const zb = BOSSES[zoneDef(s.layout.zone).boss]!;
    const full = spawnEnemy(new World('ref'), zb, 0, 0, { cycle: 1, zone: s.layout.zone, players: 1 });
    const fullHp = full.hp!.max / (full.en!.barMult ?? 1);
    expect(bb.bossId).not.toBe(zb.id);
    expect(fullHp).toBeCloseTo(enemyFullHp(zb, s.layout.zone, 1), 3); // D353: the boss HP trims reach the bonus boss through it
    expect(boss.hp!.max).toBeCloseTo(fullHp * BONUS_BOSS_HP_PCT, 3);
    expect(boss.hp!.hp).toBe(boss.hp!.max);
    // only the waves are replaced: nothing else spawned
    expect(s.w.enemies.filter((e) => !e.hp?.dead && !e.en!.def.traits?.mimic).length).toBe(1);
    // it never changes phase again
    boss.hp!.hp = 1;
    expect(boss.en!.phase).toBe(1);
    const beaten = [...s.save.world.bossesBeatenThisCycle];
    const killsBefore = s.save.stats.bossKills;
    boss.hp!.hp = 0;
    checkDeath(s.w, boss, me.id);
    expect(s.w.bossId).toBe(0);
    s.tick(0.016);
    expect(s.roomPhase).toBe('cleared');
    expect(s.save.world.roomsCleared).toContain(bb.roomId);
    // not the zone's boss: the zone is not beaten and the stairs do not open
    expect(s.save.world.bossesBeatenThisCycle).toEqual(beaten);
    expect(s.save.stats.bossKills).toBe(killsBefore);
    // and it left loot
    expect([...s.w.entities.values()].some((e) => e.type === 'pickup' && e.pk?.kind === 'item')).toBe(true);
  });

  it('fights in its second phase in NG+1 and its third (Overtime) from NG+2 on, held there (D360)', () => {
    for (const [cycle, want] of [[1, 1], [2, 2], [3, 2]] as const) {
      const s = ngSession('BONUSROOM', 1, cycle);
      const bb = bonusBossFor(s.layout)!;
      s.enterRoom(bb.roomId, s.layout.byId[bb.roomId]!.doors[0]!);
      const me = s.w.players[0]!;
      me.x = 640;
      me.y = 368;
      s.tick(0.016);
      const boss = s.w.get(s.w.bossId)!;
      expect(boss.en!.bonusBoss).toBe(true);
      expect(boss.en!.phase).toBe(want);
      const live = (boss.en!.def as unknown as BossDef).phases;
      expect(boss.en!.phaseAttacks).toBe(live[want]!.attacks);
      if (want === 2) expect(live[2]!.name).toMatch(/Overtime|Lantern|Bloom|Hunt|Meltdown|Absolute|Time Runs/);
      // held: a heavy hit does not change the phase
      boss.hp!.hp = Math.max(1, boss.hp!.max * 0.05);
      expect(boss.en!.phase).toBe(want);
    }
  });

  it('no bonus boss in the first playthrough', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng('bb0'));
    c.tutorialDone = true;
    const save = newSave(1, c, 'FIRSTGO');
    const s = new GameSession(save);
    s.start();
    for (const r of s.layout.rooms) expect(planRoom(s.layout, r).bonusBoss).toBeUndefined();
  });
});

describe('every bonus boss fights in an ordinary room (D278)', () => {
  it('each pool boss attacks, hurts, and never changes phase, in a few rooms of different zones', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    for (const def of bonusBossPool()) {
      for (const zone of [1, 4, 7]) {
        const s = ngSession(`SMOKE-${def.id}-${zone}`, zone);
        const room = s.layout.rooms.find((r) => r.kind === 'combat')!;
        s.enterRoom(room.id, room.doors[0]!);
        s.plan = { waves: [], ambush: false, bonusBoss: def.id };
        const me = s.w.players[0]!;
        me.x = 640;
        me.y = 368;
        me.hp!.max = me.hp!.hp = 1e9;
        s.tick(0.016);
        const b = s.w.get(s.w.bossId)!;
        expect(b.en!.bonusBoss).toBe(true);
        const used = new Set<string>();
        for (let i = 0; i < 60 * 30; i++) {
          stepWorld(s.w);
          if (b.en!.attack) used.add(b.en!.attack.def.id);
          me.hp!.hp = 1e9;
          if (me.pl!.downed) break;
        }
        expect(b.en!.phase).toBe(1);
        expect(used.size, `${def.id} in zone ${zone}`).toBeGreaterThanOrEqual(2);
      }
    }
  }, 60000);
});

describe('Last Rites only in New Game+ (D277)', () => {
  it('the Caretaker never uses it on the first playthrough, and does in NG+1', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const fight = (cycle: number): Set<string> => {
      const c = newCharacter('knight', 'Joe', 'p', new Rng('lr'));
      c.cycle = cycle;
      c.tutorialDone = true;
      const save = newSave(1, c, `RITES${cycle}`);
      save.world.respawnBonfireId = 'z1-start';
      const s = new GameSession(save);
      s.start();
      s.enterRoom(s.layout.bossId, 'bonfire');
      const me = s.w.players[0]!;
      me.hp!.max = 1e9;
      const used = new Set<string>();
      for (let i = 0; i < 60 * 120; i++) {
        stepWorld(s.w);
        me.hp!.hp = 1e9;
        const b = s.w.get(s.w.bossId);
        if (b?.en?.attack) used.add(b.en.attack.def.id);
        if (used.has('caretaker_last_rites')) break;
      }
      return used;
    };
    const first = fight(0);
    expect(first.size).toBeGreaterThan(2);
    expect(first.has('caretaker_last_rites')).toBe(false);
    expect(fight(1).has('caretaker_last_rites')).toBe(true);
  }, 60000);
});
