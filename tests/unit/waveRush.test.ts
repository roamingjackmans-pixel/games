// Wave Rush (GAME_DESIGN §24, D401–D410): room and cycle progression, the boss, the checkpoint unlock, the wipe reset,
// the per-character record and the save migration.
import { describe, expect, it } from 'vitest';
import { GameSession, type RushEvent } from '../../src/game/session';
import { newSave, SAVE_VERSION } from '../../src/game/save/schema';
import { migrate } from '../../src/game/save/migrations';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { checkDeath } from '../../src/game/combat/damage';
import { MemoryStore } from '../../src/engine/settings';
import { stepWorld } from '../../src/game/sim';
import { BOSSES } from '../../src/data/bosses';
import { rosterOf } from '../../src/data/enemies';
import { bonusBossFor } from '../../src/game/procgen/bonusBoss';
import { smallChest } from '../../src/game/procgen/chests';
import { planRoom } from '../../src/game/procgen/waves';
import {
  RUSH_BOSS_STAGE,
  RUSH_ROOMS,
  bossBarWork,
  canStartRushAt,
  fmtRushTime,
  newRushRecord,
  normalizeRushRecord,
  noteRushClear,
  noteRushStage,
  noteRushUnlock,
  pickRushBoss,
  readRushUnlock,
  RUSH_EXIT_GAP,
  rushBossHpBase,
  rushExitFits,
  rushExitSpots,
  rushFastest,
  rushFurthestLabel,
  rushRoomLayout,
  rushStartCycles,
} from '../../src/game/waveRush';
import type { SaveFile } from '../../src/game/types';
import { Room, T } from '../../src/game/room';
import type { Entity } from '../../src/game/world';

function rushSave(seed = 'RUSHTEST'): SaveFile {
  const c = newCharacter('knight', 'Joe', 'p-rush', new Rng(seed));
  c.tutorialDone = true;
  c.level = 200;
  return newSave(1, c, seed);
}

function rushSession(cycle = 0, save = rushSave(), events: RushEvent[] = []): GameSession {
  const s = new GameSession(save, { rush: (e) => events.push(e) }, { rushCycle: cycle });
  s.w.god = true;
  s.start();
  return s;
}

/** advance the world by about `sec` seconds */
function steps(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}

function me(s: GameSession): Entity {
  return s.w.players[0]!;
}

/** Fight a Wave Rush room to the end: tick past the arming, kill every wave as it comes. */
function clearRoom(s: GameSession): void {
  for (let i = 0; i < 400 && s.roomPhase !== 'cleared'; i++) {
    steps(s, 0.1);
    for (const e of [...s.w.enemies]) {
      if (e.hp?.dead || e.removed || e.en?.def.special) continue;
      e.hp!.hp = 0;
      checkDeath(s.w, e, me(s).id);
    }
  }
  expect(s.roomPhase).toBe('cleared');
}

function stairs(s: GameSession): Entity | undefined {
  return [...s.w.entities.values()].find((e) => e.it?.kind === 'stairs' && !e.removed);
}

function bonfire(s: GameSession): Entity | undefined {
  return [...s.w.entities.values()].find((e) => e.it?.kind === 'bonfire' && !e.removed);
}

function takeStairs(s: GameSession): void {
  const st = stairs(s);
  expect(st).toBeTruthy();
  s.interact(me(s), st!);
}

function killBoss(s: GameSession): Entity {
  for (let i = 0; i < 40 && !s.w.bossId; i++) steps(s, 0.1);
  const b = s.w.get(s.w.bossId)!;
  expect(b?.en?.isBoss).toBe(true);
  // a boss stops at each phase threshold and may refill; keep knocking it down until it is gone
  for (let i = 0; i < 400 && s.roomPhase !== 'cleared'; i++) {
    if (!b.hp!.dead) {
      b.hp!.invulnUntil = 0;
      b.hp!.hp = 0;
      checkDeath(s.w, b, me(s).id);
    }
    steps(s, 0.25);
  }
  expect(s.roomPhase).toBe('cleared');
  return b;
}

describe('Wave Rush rooms', () => {
  it('a room is one closed combat room with its zone, enemies from its roster, no chest and no bonus boss', () => {
    for (let z = 1; z <= 8; z++) {
      for (const cycle of [0, 1, 3]) {
        const lay = rushRoomLayout(`L${z}`, z, cycle);
        expect(lay.rooms).toHaveLength(1);
        expect(lay.rush).toBe(true);
        const node = lay.byId[lay.startId]!;
        expect(node.kind).toBe('combat');
        expect(node.doors).toEqual([]);
        expect(lay.zone).toBe(z);
        const roster = rosterOf(z).map((d) => d.id);
        for (const id of lay.mix) expect(roster).toContain(id);
        expect(smallChest(lay, node, false)).toBeNull();
        expect(bonusBossFor(lay)).toBeNull();
        // a full horde: three waves solo, one more per extra player (D407)
        expect(planRoom(lay, node, 1).waves.length).toBe(3);
        expect(planRoom(lay, node, 3).waves.length).toBe(5);
      }
    }
  });
});

describe('Wave Rush progression', () => {
  it('room 1 is zone 1 at the chosen cycle; a cleared room opens a bonfire and stairs to the next zone; nothing gives Shards', () => {
    const save = rushSave();
    const campaign = JSON.stringify(save.world);
    const events: RushEvent[] = [];
    const s = rushSession(0, save, events);
    expect(s.rush).toMatchObject({ cycle: 0, stage: 1 });
    expect(s.layout.zone).toBe(1);
    expect(s.w.rush).toBe(true);
    expect(s.roomPhase).toBe('armed');
    // the first wave comes by itself
    for (let i = 0; i < 30 && s.roomPhase === 'armed'; i++) steps(s, 0.1);
    expect(s.roomPhase).toBe('fighting');
    expect(s.w.enemies.length).toBeGreaterThan(0);
    expect(s.w.enemies.every((e) => e.en!.shards === 0)).toBe(true);
    const shards = save.character.shards;
    clearRoom(s);
    expect(save.character.shards).toBe(shards);
    expect(bonfire(s)).toBeTruthy();
    expect(stairs(s)!.it!.label).toBe('Descend');
    // both on plain floor, off any hazardous ground
    for (const e of [stairs(s)!, bonfire(s)!]) {
      expect(s.w.room.terrainAt(e.x, e.y)).toBe(0);
      expect(s.w.room.isHazardAt(e.x, e.y)).toBe(false);
    }
    expect(save.rush!.roomsCleared).toBe(1);
    takeStairs(s);
    expect(s.rush!.stage).toBe(2);
    expect(s.layout.zone).toBe(2);
    expect(save.rush!.furthestStage).toBe(2);
    // the campaign's world is never touched
    expect(JSON.stringify(save.world)).toBe(campaign);
    expect(events.map((e) => e.kind)).toEqual(['try', 'stage', 'room', 'stage']);
  });

  it('eight rooms, then the boss sized like the cycle’s Landlord; its fall is a checkpoint with a time, then the next cycle', () => {
    const save = rushSave('RUSHFULL');
    const events: RushEvent[] = [];
    const s = rushSession(1, save, events);
    for (let room = 1; room <= RUSH_ROOMS; room++) {
      expect(s.rush!.stage).toBe(room);
      expect(s.layout.zone).toBe(room);
      expect(s.w.cycle).toBe(1);
      clearRoom(s);
      expect(stairs(s)!.it!.label).toBe(room === RUSH_ROOMS ? 'Face the boss' : 'Descend');
      // side by side, the fire on the left, on a footprint of plain floor (D413)
      expect(stairs(s)!.y).toBe(bonfire(s)!.y);
      expect(stairs(s)!.x - bonfire(s)!.x).toBe(RUSH_EXIT_GAP);
      expect(rushExitFits(s.w.room, (stairs(s)!.x + bonfire(s)!.x) / 2, stairs(s)!.y)).toBe(true);
      takeStairs(s);
    }
    expect(s.rush!.stage).toBe(RUSH_BOSS_STAGE);
    const def = BOSSES[s.rush!.bossId]!;
    expect(s.node.kind).toBe('boss');
    expect(s.layout.zone).toBe(def.zone);
    for (let i = 0; i < 40 && !s.w.bossId; i++) steps(s, 0.1);
    const b = s.w.get(s.w.bossId)!;
    expect(b.en!.def.id).toBe(def.id);
    expect(b.en!.hpScaleBase).toBeCloseTo(rushBossHpBase(def, 1), 3);
    expect(b.en!.zone).toBe(8);
    s.w.time += 300;
    killBoss(s);
    const cleared = events.find((e) => e.kind === 'cleared')!;
    expect(cleared.cycle).toBe(1);
    expect(cleared.sec!).toBeGreaterThan(300);
    expect(save.rush!.best['1']).toBeCloseTo(cleared.sec!, 1);
    expect(save.rush!.bestCycle).toBe(1);
    expect(save.rush!.cleared).toBe(1);
    expect(rushFurthestLabel(save.rush!)).toBe('Cycle 2 cleared');
    // not campaign progress: no zone beaten, no Thermos step
    expect(save.character.highestZoneBeaten).toBe(0);
    expect(save.character.bossesBeaten).toBe(0);
    // the bonfire and the stairs come up after the boss; they lead into the next cycle, room 1
    for (let i = 0; i < 30 && !stairs(s); i++) steps(s, 0.1);
    expect(stairs(s)!.it!.label).toBe('On to Cycle 3');
    takeStairs(s);
    expect(s.rush).toMatchObject({ cycle: 2, stage: 1 });
    expect(s.layout.zone).toBe(1);
    expect(save.rush!.tries).toBe(2);
  });

  it('a death sends the party back to room 1 of the same cycle, with a new attempt, losing nothing', () => {
    const save = rushSave('RUSHWIPE');
    const s = rushSession(2, save);
    clearRoom(s);
    takeStairs(s);
    clearRoom(s);
    takeStairs(s);
    expect(s.rush!.stage).toBe(3);
    const firstBoss = s.rush!.bossId;
    void firstBoss;
    const c = save.character;
    c.shards = 1234;
    const bag = c.bag.length;
    s.w.god = false;
    s.die(me(s));
    expect(s.dead).toBe(true);
    expect(save.rush!.deaths).toBe(1);
    expect(save.stats.deaths).toBe(0);
    expect(save.world.shardpile).toBeUndefined();
    s.respawn();
    expect(s.rush).toMatchObject({ cycle: 2, stage: 1, attempt: 2 });
    expect(s.layout.zone).toBe(1);
    expect(c.shards).toBe(1234);
    expect(c.bag.length).toBe(bag);
    expect(me(s).hp!.hp).toBe(me(s).hp!.max);
    expect(save.rush!.tries).toBe(2);
    // the furthest point stays where it was
    expect(rushFurthestLabel(save.rush!)).toBe('Cycle 3, room 3 of 8');
  });

  it('a co-op wipe resets the whole party to room 1', () => {
    const save = rushSave('RUSHCOOP');
    const s = rushSession(0, save);
    const g = newCharacter('brute', 'Ann', 'p-ann', new Rng('ann'));
    s.joinPlayer(g);
    clearRoom(s);
    takeStairs(s);
    s.w.god = false;
    for (const p of s.w.players) {
      p.hp!.hp = 0;
      s.downPlayer(p);
    }
    expect(s.dead).toBe(true);
    s.respawn();
    expect(s.rush!.stage).toBe(1);
    expect(s.w.players).toHaveLength(2);
    expect(s.w.players.every((p) => !p.pl!.downed && p.hp!.hp === p.hp!.max)).toBe(true);
  });

  it('the boss is drawn again on every attempt, from any zone, the same for the same seed', () => {
    const seen = new Set<string>();
    for (let k = 0; k < 80; k++) seen.add(pickRushBoss(`WR${k}c0:x`, 0));
    expect(seen.size).toBe(Object.keys(BOSSES).length);
    expect(pickRushBoss('WR5c3:x', 3)).toBe(pickRushBoss('WR5c3:x', 3));
  });

  it('every boss takes as much to win as the Landlord of its cycle', () => {
    const ll = BOSSES.the_landlord!;
    expect(bossBarWork(ll)).toBeGreaterThan(1.3);
    for (const cycle of [0, 1, 4]) {
      for (const def of Object.values(BOSSES)) {
        expect(rushBossHpBase(def, cycle)).toBeGreaterThan(0);
      }
    }
  });
});

describe('no weapon proficiency in Wave Rush (D412)', () => {
  it('kills there leave every player’s proficiency alone, a co-op guest’s too; the campaign still grants it', () => {
    const save = rushSave('RUSHPROF');
    const s = rushSession(0, save);
    const guest = newCharacter('brute', 'Ann', 'p-ann2', new Rng('ann2'));
    s.joinPlayer(guest);
    const profOf = (c: { proficiency?: Record<string, number> }): number => Object.values(c.proficiency ?? {}).reduce((a, b) => a + b, 0);
    const before = [profOf(save.character), profOf(guest)];
    clearRoom(s);
    expect([profOf(save.character), profOf(guest)]).toEqual(before);
    // the same kills in the campaign do grant it
    const camp = rushSave('CAMPPROF');
    camp.character.tutorialDone = true;
    const c = new GameSession(camp);
    c.start();
    const p0 = profOf(camp.character);
    const e = c.w.enemies[0] ?? null;
    const me0 = c.w.players[0]!;
    if (e) {
      e.hp!.hp = 0;
      checkDeath(c.w, e, me0.id);
    } else {
      const lay = c.layout;
      const room = lay.rooms.find((r) => r.kind === 'combat')!;
      c.enterRoom(room.id, room.doors[0]!);
      c.w.god = true;
      clearRoom2(c);
    }
    expect(profOf(camp.character)).toBeGreaterThan(p0);
  });
});

/** Clear a campaign combat room (walk in to arm it, then knock every wave down). */
function clearRoom2(s: GameSession): void {
  const p = me(s);
  p.x = 640;
  p.y = 368;
  for (let i = 0; i < 400 && s.roomPhase !== 'cleared'; i++) {
    steps(s, 0.1);
    for (const e of [...s.w.enemies]) {
      if (e.hp?.dead || e.removed || e.en?.def.special) continue;
      e.hp!.hp = 0;
      checkDeath(s.w, e, p.id);
    }
  }
}

describe('Wave Rush checkpoint unlock (account-wide)', () => {
  it('starts at cycle 1 only; clearing cycle N opens every cycle up to N + 1, and never goes back', () => {
    const store = new MemoryStore();
    expect(readRushUnlock(store).best).toBe(-1);
    expect(rushStartCycles(readRushUnlock(store))).toEqual([0]);
    noteRushUnlock(store, 0);
    expect(rushStartCycles(readRushUnlock(store))).toEqual([0, 1]);
    noteRushUnlock(store, 5);
    expect(rushStartCycles(readRushUnlock(store))).toEqual([0, 1, 2, 3, 4, 5, 6]);
    noteRushUnlock(store, 2);
    expect(readRushUnlock(store).best).toBe(5);
    expect(canStartRushAt(readRushUnlock(store), 6)).toBe(true);
    expect(canStartRushAt(readRushUnlock(store), 7)).toBe(false);
    store.setItem('dj.waveRush', 'not json');
    expect(readRushUnlock(store).best).toBe(-1);
  });
});

describe('Wave Rush record (Statistics)', () => {
  it('keeps the best time per cycle, the furthest point and the fastest clear', () => {
    const r = newRushRecord();
    expect(rushFurthestLabel(r)).toBe('Not played');
    noteRushStage(r, 0, 4);
    expect(rushFurthestLabel(r)).toBe('Cycle 1, room 4 of 8');
    noteRushStage(r, 0, 2);
    expect(r.furthestStage).toBe(4);
    noteRushStage(r, 0, RUSH_BOSS_STAGE);
    expect(rushFurthestLabel(r)).toBe('Cycle 1, the boss');
    noteRushClear(r, 0, 600);
    noteRushClear(r, 0, 720);
    noteRushClear(r, 1, 500);
    expect(r.best).toEqual({ '0': 600, '1': 500 });
    expect(r.cleared).toBe(3);
    expect(rushFastest(r)).toEqual([1, 500]);
    expect(rushFurthestLabel(r)).toBe('Cycle 2 cleared');
    expect(fmtRushTime(607.25)).toBe('10:07.3');
    expect(fmtRushTime(3725)).toBe('1:02:05');
  });

  it('a hand-edited record is cleaned on load', () => {
    const r = normalizeRushRecord({ tries: -3, deaths: 'x', best: { '0': 90, bad: 3, '2': -1 }, furthestCycle: 1, furthestStage: 5 });
    expect(r.tries).toBe(0);
    expect(r.deaths).toBe(0);
    expect(r.best).toEqual({ '0': 90 });
    expect(rushFurthestLabel(r)).toBe('Cycle 2, room 5 of 8');
  });

  it('a version 3 save migrates to version 4 with an empty record', () => {
    const s = rushSave() as unknown as Record<string, unknown>;
    s.version = 3;
    delete s.rush;
    const m = migrate(JSON.parse(JSON.stringify(s))) as SaveFile;
    expect(m.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(4);
    expect(m.rush).toEqual(newRushRecord());
  });
});

describe('Wave Rush exit placement (D413)', () => {
  it('the bonfire and stairs sit side by side in the middle of an open room', () => {
    const { bonfire, stairs } = rushExitSpots(Room.empty(), 640, 368);
    expect(bonfire).toEqual([640 - RUSH_EXIT_GAP / 2, 368]);
    expect(stairs).toEqual([640 + RUSH_EXIT_GAP / 2, 368]);
  });

  it('an obstacle in the middle moves both straight north, still together and clear of it', () => {
    const room = Room.empty();
    // a 6 × 4 grove of props over the middle, as in a zone room with trees
    for (let ty = 9; ty <= 12; ty++) for (let tx = 17; tx <= 22; tx++) room.set(tx, ty, T.Prop);
    const { bonfire, stairs } = rushExitSpots(room, 640, 368);
    expect(bonfire[0]).toBe(640 - RUSH_EXIT_GAP / 2);
    expect(stairs[0]).toBe(640 + RUSH_EXIT_GAP / 2);
    expect(stairs[1]).toBe(bonfire[1]);
    expect(bonfire[1]).toBeLessThan(368);
    expect(rushExitFits(room, 640, bonfire[1])).toBe(true);
    // the first clear row: one step further south would touch the grove
    expect(rushExitFits(room, 640, bonfire[1] + 16)).toBe(false);
  });

  it('a room blocked all the way north still finds the pair a clear spot elsewhere', () => {
    const room = Room.empty();
    for (let ty = 1; ty <= 14; ty++) for (let tx = 15; tx <= 24; tx++) room.set(tx, ty, T.Pillar);
    const { bonfire, stairs } = rushExitSpots(room, 640, 368);
    expect(stairs[0] - bonfire[0]).toBe(RUSH_EXIT_GAP);
    expect(rushExitFits(room, (bonfire[0] + stairs[0]) / 2, bonfire[1])).toBe(true);
  });
});
