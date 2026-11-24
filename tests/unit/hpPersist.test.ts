// D453: the HP you save & quit with is the HP you load back in with (it used to come back full). Capped at max; a rest
// and a death still fill the bar; Wave Rush and New Game+ start full; a co-op guest's HP is its own and comes back too.
import { describe, expect, it } from 'vitest';
import { GameSession, beginNextCycle } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { readSave, writeSave } from '../../src/game/save/storage';
import { MemoryStore } from '../../src/engine/settings';
import { newCharacter } from '../../src/game/player/character';
import { savedHp, storeHp } from '../../src/game/player/player';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptyInput } from '../../src/engine/input/actions';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import type { ClassId, SaveFile } from '../../src/game/types';
import type { Entity } from '../../src/game/world';

function saveOf(cls: ClassId = 'knight', pid = 'hp-joe', seed = 'HP-SEED'): SaveFile {
  const c = newCharacter(cls, 'Joe', pid, new Rng(pid));
  c.tutorialDone = true;
  return newSave(1, c, seed);
}

function load(save: SaveFile, opts: { rushCycle?: number } = {}): GameSession {
  const s = new GameSession(save, {}, opts);
  s.start();
  return s;
}

function me(s: GameSession): Entity {
  return s.localPlayer!;
}

/** Save & quit the way the run scene does (note the HP, write the slot), then load the slot into a new session. */
function saveAndReload(s: GameSession): { s: GameSession; save: SaveFile } {
  const store = new MemoryStore();
  s.noteHp();
  writeSave(store, s.save);
  const save = readSave(store, s.save.slot)!;
  expect(save).not.toBeNull();
  return { s: load(save), save };
}

describe('HP across save & quit (D453)', () => {
  it('comes back exactly as it was left, not full', () => {
    const s = load(saveOf());
    const max = me(s).hp!.max;
    me(s).hp!.hp = max * 0.37 + 0.25;
    const left = me(s).hp!.hp;
    const back = saveAndReload(s);
    expect(back.save.character.hpCur).toBe(left);
    expect(me(back.s).hp!.max).toBe(max);
    expect(me(back.s).hp!.hp).toBe(left);
    // and again: a second save & quit without touching anything keeps it
    expect(me(saveAndReload(back.s).s).hp!.hp).toBe(left);
  });

  it('is capped at max HP', () => {
    const save = saveOf();
    save.character.hpCur = 999_999;
    const s = load(save);
    expect(me(s).hp!.hp).toBe(me(s).hp!.max);
    expect(savedHp({ hpCur: 50 }, 40)).toBe(40);
    expect(savedHp({ hpCur: 30 }, 40)).toBe(30);
    expect(savedHp({}, 40)).toBe(40);
  });

  it('a full bar or a body at 0 HP saves none (full on load); junk in the save is a full bar', () => {
    const s = load(saveOf());
    const e = me(s);
    const c = s.save.character;
    e.hp!.hp = e.hp!.max;
    c.hpCur = 12;
    storeHp(c, e);
    expect(c.hpCur).toBeUndefined();
    // dead (the death screen): it comes back at the bonfire with a full bar, as a death would
    e.hp!.hp = 0;
    e.hp!.dead = true;
    c.hpCur = 12;
    storeHp(c, e);
    expect(c.hpCur).toBeUndefined();
    // a co-op down or a ghost waiting for a rest
    e.hp!.dead = false;
    e.hp!.hp = 20;
    e.pl!.deadUntilRest = true;
    storeHp(c, e);
    expect(c.hpCur).toBeUndefined();
    for (const junk of [-5, 0, Number.NaN, 'abc', null]) {
      const store = new MemoryStore();
      const sv = saveOf();
      (sv.character as unknown as Record<string, unknown>).hpCur = junk;
      writeSave(store, sv);
      const back = readSave(store, sv.slot)!;
      expect(back.character.hpCur).toBeUndefined();
      expect(me(load(back)).hp!.hp).toBe(me(load(back)).hp!.max);
    }
  });

  it('a rest still fills the bar, and the save then holds a full bar', () => {
    const save = saveOf();
    save.character.hpCur = 10;
    const s = load(save);
    expect(me(s).hp!.hp).toBe(10);
    s.rest(me(s), s.layout.startId);
    expect(me(s).hp!.hp).toBe(me(s).hp!.max);
    s.noteHp();
    expect(s.save.character.hpCur).toBeUndefined();
  });

  it('a death still fills the bar', () => {
    const save = saveOf();
    save.character.hpCur = 10;
    const s = load(save);
    s.respawn();
    expect(me(s).hp!.hp).toBe(me(s).hp!.max);
    s.noteHp();
    expect(s.save.character.hpCur).toBeUndefined();
  });

  it('Wave Rush starts full and leaves the campaign HP alone', () => {
    const save = saveOf();
    save.character.hpCur = 10;
    const s = load(save, { rushCycle: 0 });
    expect(me(s).hp!.hp).toBe(me(s).hp!.max);
    me(s).hp!.hp = 3;
    s.noteHp();
    expect(save.character.hpCur).toBe(10);
  });

  it('New Game+ starts full', () => {
    const save = saveOf();
    save.character.hpCur = 10;
    beginNextCycle(save);
    expect(save.character.hpCur).toBeUndefined();
    expect(me(load(save)).hp!.hp).toBe(me(load(save)).hp!.max);
  });

  it("a co-op guest comes in with the HP it saved, on its screen and in the host's world, and keeps it", () => {
    const hub = new LoopbackHub({ latencyMs: 40, jitterMs: 5 });
    const clock = (): number => hub.now / 1000;
    const hostSave = saveOf('knight', 'host', 'HOST-SEED');
    const s = new GameSession(hostSave);
    s.start();
    const host = new NetHost(hub.join('HPCO', 'host-peer'), 'HPCO', hostSave, clock);
    const guestSave = saveOf('cleric', 'guest', 'OWN-SEED');
    guestSave.character.hpCur = 33.5;
    const g = new NetGuest(hub.join('HPCO', 'guest-peer'), guestSave, clock);
    const step = (sec: number): void => {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        g.frame(emptyInput(), 1 / 60);
        g.cw.events.length = 0;
      }
    };
    hub.pump(300);
    host.start(s);
    step(1);
    const puppet = s.players.find((p) => !p.local)!.entity!;
    expect(g.me).not.toBeNull();
    expect(g.me!.hp!.hp).toBeCloseTo(33.5, 5);
    expect(puppet.hp!.hp).toBeCloseTo(33.5, 5);
    // the guest takes a hit on its own screen; its save (GuestRun.persist) keeps what it is at
    g.me!.hp!.hp = 21;
    step(0.5);
    expect(puppet.hp!.hp).toBeCloseTo(21, 5);
    g.keepMyHp();
    expect(guestSave.character.hpCur).toBe(21);
    // back home in its own campaign, it comes in with that
    expect(me(load(guestSave)).hp!.hp).toBe(21);
  });
});
