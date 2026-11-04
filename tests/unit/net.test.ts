import { describe, expect, it } from 'vitest';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import { decodeInput, encodeInput, newRoomCode, parseRoomCode } from '../../src/game/net/protocol';
import { decodeSnap, encodeSnap, recordOf } from '../../src/game/net/snapshot';
import { CharLog, applyCharOp, cloneChar } from '../../src/game/net/charSync';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, type InputFrame } from '../../src/engine/input/actions';
import { rawDamage, addRevive } from '../../src/game/combat/damage';
import { runEffects } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import type { ClassId, SaveFile } from '../../src/game/types';
import type { Entity } from '../../src/game/world';

function saveOf(cls: ClassId, name: string, pid: string, seed = 'COOP-SEED'): SaveFile {
  const c = newCharacter(cls, name, pid, new Rng(pid));
  c.tutorialDone = true;
  return newSave(1, c, seed);
}

interface Party {
  hub: LoopbackHub;
  host: NetHost;
  s: GameSession;
  guests: NetGuest[];
  inputs: InputFrame[];
  step(sec: number): void;
}

function party(nGuests = 3, latencyMs = 30): Party {
  const hub = new LoopbackHub({ latencyMs, jitterMs: 5 });
  const clock = (): number => hub.now / 1000;
  const hostSave = saveOf('knight', 'Host Joe', 'host');
  const s = new GameSession(hostSave);
  s.start();
  const host = new NetHost(hub.join('ROOM22', 'host-peer'), 'ROOM22', hostSave, clock);
  const classes: ClassId[] = ['brute', 'cleric', 'duelist'];
  const guests: NetGuest[] = [];
  for (let i = 0; i < nGuests; i++) guests.push(new NetGuest(hub.join('ROOM22', `guest-peer-${i}`), saveOf(classes[i]!, `Guest ${i}`, `g${i}`, `OWN-${i}`), clock));
  const inputs = guests.map(() => emptyInput());
  const p: Party = {
    hub,
    host,
    s,
    guests,
    inputs,
    step(sec: number) {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        guests.forEach((g, k) => {
          g.frame(inputs[k]!, 1 / 60);
          g.cw.events.length = 0;
        });
      }
    },
  };
  hub.pump(200);
  return p;
}

function guestEntity(p: Party, i: number): Entity {
  const e = p.s.players.find((sp) => sp.char.playerId === `g${i}`)?.entity;
  if (!e) throw new Error('no guest body');
  return e;
}

describe('net: codecs', () => {
  it('room codes are 6 digits and parse back (D76)', () => {
    for (let i = 0; i < 50; i++) {
      const c = newRoomCode();
      expect(c).toMatch(/^[0-9]{6}$/);
      expect(parseRoomCode(c)).toBe(c);
    }
    expect(parseRoomCode('123 456')).toBe('123456');
    expect(parseRoomCode('12O-45O')).toBe('120450');
    expect(parseRoomCode('ABCDEF')).toBeNull();
    expect(parseRoomCode('12345')).toBeNull();
    expect(parseRoomCode('1234567')).toBeNull();
  });
  it('input packets round-trip', () => {
    const f: InputFrame = { moveX: 0.5, moveY: -1, aimX: 700, aimY: 300, aimNeutral: true, aimAssist: 0.6, buttons: 0b101, pressed: 0b100 };
    const back = decodeInput(encodeInput({ seq: 65535, tick: 1234, frame: f }));
    expect(back.seq).toBe(65535);
    expect(back.tick).toBe(1234);
    expect(back.frame.moveX).toBeCloseTo(0.5, 1);
    expect(back.frame.moveY).toBe(-1);
    expect(back.frame.buttons).toBe(5);
    expect(back.frame.pressed).toBe(4);
    expect(back.frame.aimNeutral).toBe(true);
  });
  it('snapshots round-trip records, removals and JSON', () => {
    const s = new GameSession(saveOf('knight', 'J', 'p'));
    s.start();
    const e = s.localPlayer!;
    const r = recordOf(e, s.w.time);
    const back = decodeSnap(encodeSnap({ full: true, tick: 9, time: 1.25, ackSeq: 7, recs: [r], removed: [3, 4], json: { bossId: 0, ev: [{ t: 'shake', amount: 3 }] } }));
    expect(back.recs[0]).toEqual(r);
    expect(back.removed).toEqual([3, 4]);
    expect(back.time).toBe(1.25);
    expect(back.json.ev?.[0]).toEqual({ t: 'shake', amount: 3 });
  });
  it('character ops replay on top of a guest change made in flight', () => {
    const c = saveOf('knight', 'J', 'p').character;
    const hostCopy = cloneChar(c);
    const log = new CharLog(hostCopy);
    hostCopy.shards += 100;
    const first = log.collect(hostCopy)!;
    // the guest has not seen op 1 yet and levels up (spends 40 Shards it had before)
    const guest = cloneChar(c);
    guest.level += 1;
    log.adopt(hostCopy, guest, 0);
    expect(hostCopy.level).toBe(c.level + 1);
    expect(hostCopy.shards).toBe(c.shards + 100);
    // when op 1 arrives the guest applies it once
    for (const o of first.ops) applyCharOp(guest, o);
    expect(guest.shards).toBe(c.shards + 100);
  });
});

describe('net: loopback host + 3 guests (NETCODE §8)', () => {
  it('lobby → start → everyone sees everyone; inputs move a guest; kills pay every guest', () => {
    const p = party(3);
    expect(p.host.lobbyState().players.length).toBe(4);
    for (const g of p.guests) expect(g.state).toBe('lobby');
    p.host.start(p.s);
    p.step(1);
    for (const g of p.guests) {
      expect(g.state).toBe('game');
      expect(g.cw.players.length).toBe(4);
      expect(g.me).not.toBeNull();
      expect(g.cw.room.tiles.length).toBe(p.s.w.room.tiles.length);
    }
    // guest 0 walks right: the host moves its body and the guest's prediction agrees
    const g0 = guestEntity(p, 0);
    const x0 = g0.x;
    p.inputs[0] = { ...emptyInput(), moveX: 1, aimX: 1200, aimY: g0.y };
    p.step(0.5);
    p.inputs[0] = emptyInput();
    p.step(0.3);
    expect(g0.x).toBeGreaterThan(x0 + 60);
    expect(Math.abs(p.guests[0]!.me!.x - g0.x)).toBeLessThan(24);
    // an enemy dies: every player gets the Shards (instanced, D33)
    const before = p.guests.map((g) => g.save.character.shards);
    const e = spawnEnemy(p.s.w, ENEMIES.shambler!, 640, 300, { tellS: 0 });
    p.step(0.2);
    rawDamage(p.s.w, e, 1e9, 'physical', p.s.localPlayer!.id);
    p.step(0.5);
    p.guests.forEach((g, i) => expect(g.save.character.shards, `guest ${i}`).toBeGreaterThan(before[i]!));
    // the mirrors saw it spawn and go
    for (const g of p.guests) expect([...g.cw.entities.values()].some((x) => x.type === 'enemy' && !x.hp?.dead)).toBe(false);
  });

  it('co-op HP: +75% per extra player for enemies, +125% for Elites and bosses, and back when a guest leaves (D159)', () => {
    const p = party(3);
    p.host.start(p.s);
    p.step(0.5);
    const solo = spawnEnemy(p.s.w, ENEMIES.shambler!, 600, 300, { tellS: 0, players: 1 });
    const e = spawnEnemy(p.s.w, ENEMIES.shambler!, 640, 300, { tellS: 0 });
    const soloHp = solo.hp!.max;
    expect(e.hp!.max).toBeCloseTo(soloHp * 3.25, 3);
    const eliteSolo = spawnEnemy(p.s.w, ENEMIES.shambler!, 600, 340, { tellS: 0, players: 1, elite: 'armored' });
    const elite = spawnEnemy(p.s.w, ENEMIES.shambler!, 640, 340, { tellS: 0, elite: 'armored' });
    expect(elite.hp!.max).toBeCloseTo(eliteSolo.hp!.max * 4.75, 3);
    const boss = spawnEnemy(p.s.w, BOSSES.the_caretaker!, 640, 200, { tellS: 0 });
    expect(boss.hp!.max).toBeCloseTo(boss.en!.hpScaleBase * 4.75, 3);
    p.guests[2]!.leave();
    p.step(0.5);
    expect(p.s.players.length).toBe(3);
    expect(boss.hp!.max).toBeCloseTo(boss.en!.hpScaleBase * 3.5, 3);
    expect(e.hp!.max).toBeCloseTo(soloHp * 2.5, 3);
  });

  it('a silent guest is removed after 10 s', () => {
    const p = party(2);
    p.host.start(p.s);
    p.step(0.5);
    // guest 1 stops sending anything
    const g1 = p.guests[1]!;
    g1.frame = () => undefined;
    g1.t.leave = () => undefined;
    (g1.t as unknown as { closed: boolean }).closed = true;
    p.step(11);
    expect(p.s.players.map((sp) => sp.char.playerId)).not.toContain('g1');
    expect(p.s.players.length).toBe(2);
  });

  it('downed, revived by a teammate, bleed-out, and the wipe drops every guest\'s Shards', () => {
    const p = party(1);
    p.host.start(p.s);
    p.step(0.5);
    const g = guestEntity(p, 0);
    rawDamage(p.s.w, g, 1e9, 'physical', 0);
    expect(g.pl!.downed).toBe(true);
    expect(g.pl!.reviveNeed).toBe(10);
    p.step(0.3);
    expect(p.guests[0]!.me!.pl!.downed).toBe(true);
    // the host hits the ghost with a sword (revive value ~2.4 per hit)
    for (let i = 0; i < 6 && g.pl!.downed; i++) addRevive(p.s.w, g, p.s.localPlayer!, 2);
    expect(g.pl!.downed).toBe(false);
    expect(g.hp!.hp).toBeCloseTo(g.hp!.max * 0.4, 3);
    // second down needs 20; let the ghost bleed out
    rawDamage(p.s.w, g, 1e9, 'physical', 0);
    expect(g.pl!.reviveNeed).toBe(20);
    p.step(31);
    expect(g.pl!.deadUntilRest).toBe(true);
    // everyone down: wipe; the guest's Shards fall where it lay
    g.pl!.char.shards = 55;
    p.step(0.1);
    rawDamage(p.s.w, p.s.localPlayer!, 1e9, 'physical', 0);
    expect(p.s.dead).toBe(true);
    expect(p.s.save.world.guestPiles?.g0?.amount).toBe(55);
    p.step(0.3);
    expect(p.guests[0]!.save.character.shards).toBe(0);
    p.s.respawn();
    expect(g.pl!.deadUntilRest).toBe(false);
    expect(g.hp!.hp).toBe(g.hp!.max);
  });

  it('Last Rites gives 3 revive (6 with a Ghost Lantern); being revived does not refill the Thermos', () => {
    const p = party(1);
    p.host.start(p.s);
    p.step(0.5);
    const g = guestEntity(p, 0);
    const host = p.s.localPlayer!;
    g.pl!.char.flaskCur = 0;
    rawDamage(p.s.w, g, 1e9, 'physical', 0);
    const cast = (): void =>
      runEffects(p.s.w, SPELLS.last_rites!.effect, { sourceId: host.id, team: 0, x: host.x, y: host.y, aimX: g.x, aimY: g.y, targetId: g.id, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 10, windupS: 0, tag: 'lr' });
    cast();
    expect(g.pl!.reviveProgress).toBeCloseTo(3, 5);
    host.pl!.derived.rings.add('ghost_lantern');
    cast();
    expect(g.pl!.reviveProgress).toBeCloseTo(9, 5);
    cast();
    expect(g.pl!.downed).toBe(false);
    expect(g.pl!.char.flaskCur).toBe(0);
  });

  it('zone credit goes home when the guest\'s own world had reached that zone (D195; was next-zone-only, D31)', () => {
    const p = party(2);
    // guest 0's world is in zone 1, like the host's; guest 1's has reached zone 3 already
    const w1 = p.guests[1]!.save.world;
    w1.zone = 3;
    w1.bossesBeatenThisCycle.push(1, 2);
    w1.bonfiresDiscovered.push('z1-start', 'z2-start', 'z3-start');
    p.hub.pump(100);
    p.host.start(p.s);
    p.step(0.5);
    p.s.enterRoom(p.s.layout.bossId, 's');
    p.step(1.6);
    const b = p.s.w.get(p.s.w.bossId)!;
    rawDamage(p.s.w, b, b.hp!.max, 'physical', p.s.localPlayer!.id);
    p.step(2.2);
    rawDamage(p.s.w, b, b.hp!.max, 'physical', p.s.localPlayer!.id);
    p.step(0.5);
    expect(b.hp!.dead).toBe(true);
    const g0 = p.guests[0]!.save;
    const g1 = p.guests[1]!.save;
    // guest 0 was in zone 1 at home: zone 2 opens; guest 1 already had it: nothing moves
    expect(g0.pending?.advanceToZone).toBe(2);
    expect(g0.pending?.beatenZones).toEqual([1]);
    expect(g0.character.bossesBeaten).toBe(1);
    expect(g1.pending?.advanceToZone).toBeUndefined();
    expect(g1.character.bossesBeaten).toBe(1);
  });

  it('guests who waited a long time in the lobby still make it into the game (D161)', () => {
    const p = party(3);
    // a long wait in the lobby: nobody sends inputs there
    for (let i = 0; i < 25; i++) p.hub.pump(1000);
    p.host.start(p.s);
    p.step(1.5);
    expect(p.s.players.length).toBe(4);
    for (const g of p.guests) {
      expect(g.state).toBe('game');
      expect(g.me).not.toBeNull();
      expect(g.cw.players.length).toBe(4);
    }
  });

  it('a player arriving after the start is turned away without knocking anyone out of the game (D156)', () => {
    const p = party(2);
    p.host.start(p.s);
    p.step(1);
    const late = new NetGuest(p.hub.join('ROOM22', 'late-peer'), saveOf('cleric', 'Late', 'late', 'OWN-L'), () => p.hub.now / 1000);
    p.hub.pump(200);
    p.step(0.5);
    expect(late.state).toBe('rejected');
    for (const g of p.guests) expect(g.state).toBe('game');
    // and they still move
    const g0 = guestEntity(p, 0);
    const x0 = g0.x;
    p.inputs[0] = { ...emptyInput(), moveX: 1, aimX: 1200, aimY: g0.y };
    p.step(0.5);
    expect(g0.x).toBeGreaterThan(x0 + 40);
  });

  it("a second copy of a guest's character stays turned away while the lobby keeps updating (D156)", () => {
    const p = party(1);
    const dup = new NetGuest(p.hub.join('ROOM22', 'dup-peer'), saveOf('brute', 'Copy', 'g0', 'OWN-D'), () => p.hub.now / 1000);
    p.hub.pump(200);
    p.host.sendLobby();
    p.hub.pump(200);
    expect(dup.state).toBe('rejected');
    expect(dup.rejectReason).toContain('Pick another character');
    expect(p.host.lobbyState().players.length).toBe(2);
  });

  it('rejects a newer version, a full party and the same character twice', () => {
    const hub = new LoopbackHub();
    const clock = (): number => hub.now / 1000;
    const hostSave = saveOf('knight', 'Host', 'host');
    const host = new NetHost(hub.join('R', 'h'), 'R', hostSave, clock);
    void host;
    const dup = new NetGuest(hub.join('R', 'd'), saveOf('knight', 'Copy', 'host'), clock);
    hub.pump(100);
    expect(dup.state).toBe('rejected');
    const old = new NetGuest(hub.join('R', 'o'), saveOf('knight', 'Old', 'old'), clock);
    old.sayHello = () => undefined;
    (old as unknown as { ch: { hello: { send: (d: unknown) => void } } }).ch.hello.send({ version: '0.0.1', playerId: 'old', name: 'Old', classId: 'knight', level: 1, char: saveOf('knight', 'Old', 'old').character });
    hub.pump(100);
    expect(old.rejectReason).toContain('Host is on');
  });
});
