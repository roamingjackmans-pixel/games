import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
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
import { ACTION_BIT, emptyInput, type InputFrame } from '../../src/engine/input/actions';
import { rawDamage, addRevive, applyRemoteHit, emptySpec, heal, hitEnemy, hitPlayer, parryEnemy, REMOTE_HIT_REACH } from '../../src/game/combat/damage';
import { bodyReportOf, decodeBody, encodeBody } from '../../src/game/net/body';
import { ARCANE_ORB_SPIN } from '../../src/game/enemies/ai';
import { speedMult } from '../../src/game/combat/state';
import { runEffects } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import type { ClassId, SaveFile } from '../../src/game/types';
import type { Entity, GameEvent } from '../../src/game/world';

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
  /** every world event each guest's screen saw, with the hub time it saw it */
  seen: { at: number; ev: GameEvent }[][];
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
  const seen: Party['seen'] = guests.map(() => []);
  const p: Party = {
    hub,
    host,
    s,
    guests,
    inputs,
    seen,
    step(sec: number) {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        guests.forEach((g, k) => {
          g.frame(inputs[k]!, 1 / 60);
          for (const ev of g.cw.events) seen[k]!.push({ at: hub.now, ev });
          g.cw.events.length = 0;
          // a press lasts one frame, as the real input sampler makes it
          inputs[k] = { ...inputs[k]!, pressed: 0 };
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
    inCombat(p.s.w); // D329: a player only takes damage in a fight
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
    inCombat(p.s.w); // D329: a player only takes damage in a fight
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
    inCombat(p.s.w); // D329: a player only takes damage in a fight
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

// D338: each player's own screen is the authority for that player's body and for the hits it lands.
describe('net: guest-owned bodies (D338)', () => {
  /** A party of one guest in a fight (a still Practice Dummy next to the guest's body), everyone settled. */
  function fight(latencyMs = 30): { p: Party; g: Entity; dummy: Entity; me: () => Entity } {
    const p = party(1, latencyMs);
    p.host.start(p.s);
    p.step(0.6);
    const g = guestEntity(p, 0);
    const dummy = inCombat(p.s.w, g.x + 40, g.y);
    p.step(0.4);
    return { p, g, dummy, me: () => p.guests[0]!.me! };
  }

  it("a guest's swing lands on its own screen first (number, flash), and the host applies it to the real enemy", () => {
    const { p, dummy } = fight(60);
    const hp0 = dummy.hp!.hp;
    p.inputs[0] = { ...emptyInput(), aimX: dummy.x, aimY: dummy.y, pressed: ACTION_BIT.attack };
    let local = -1;
    let hostAt = -1;
    for (let f = 0; f < 90 && hostAt < 0; f++) {
      p.step(1 / 60);
      if (local < 0 && p.seen[0]!.some((s) => s.ev.t === 'dmg' && !s.ev.toPlayer && s.ev.targetId === dummy.id)) local = p.hub.now;
      if (dummy.hp!.hp < hp0 - 1e-6) hostAt = p.hub.now;
    }
    expect(local).toBeGreaterThan(0);
    expect(hostAt).toBeGreaterThan(0);
    // the guest saw its hit before the host had it: one way of latency at least
    expect(hostAt - local).toBeGreaterThanOrEqual(50);
    // the guest's mirror shows the damage without the bar jumping back while the host catches up
    p.step(0.05);
    const mirror = p.guests[0]!.cw.get(dummy.id)!;
    expect(mirror.hp!.hp).toBeLessThan(mirror.hp!.max - 1e-6);
    // the host never sends the guest its own number back
    p.step(0.3);
    const numbers = p.seen[0]!.filter((s) => s.ev.t === 'dmg' && !s.ev.toPlayer && s.ev.targetId === dummy.id);
    expect(numbers.length).toBe(1);
  });

  it("a guest's hit that staggers or parries an enemy mid-attack on its screen is safe there and reaches the host", () => {
    const { p, g, me } = fight();
    const sh = spawnEnemy(p.s.w, ENEMIES.shambler!, g.x + 50, g.y, { tellS: 0 });
    // wait until the guest's screen shows the enemy winding up an attack
    let mirror: Entity | undefined;
    for (let i = 0; i < 300 && !mirror?.en?.attack; i++) {
      p.step(1 / 60);
      mirror = p.guests[0]!.cw.get(sh.id);
    }
    expect(mirror?.en?.attack).toBeTruthy();
    const spec = emptySpec('player');
    spec.dmg.physical = 5;
    spec.poiseDmg = 1e6;
    // a poise break cancels its attack (D78); a parry does the same
    expect(() => hitEnemy(p.guests[0]!.cw, me(), mirror!, spec, me().x, me().y, { heavy: true })).not.toThrow();
    expect(() => parryEnemy(p.guests[0]!.cw, me(), mirror!)).not.toThrow();
    p.step(0.3);
    expect(sh.hp!.hp).toBeLessThan(sh.hp!.max);
    expect(sh.en!.state).toBe('stagger');
  });

  it("a guest's own hit measures against the host's co-op HP, so the bar does not drop and bounce back (D340)", () => {
    const p = party(2);
    p.host.start(p.s);
    p.step(0.6);
    const g = guestEntity(p, 0);
    inCombat(p.s.w);
    const sh = spawnEnemy(p.s.w, ENEMIES.shambler!, g.x + 60, g.y, { tellS: 0 });
    const solo = spawnEnemy(p.s.w, ENEMIES.shambler!, 40, 40, { tellS: 0, players: 1 });
    p.s.w.remove(solo);
    p.step(0.4);
    const gw = p.guests[0]!.cw;
    const mirror = gw.get(sh.id)!;
    // three players: the host's enemy has ×2.5 a solo enemy's HP (D159), and so does the guest's copy
    expect(sh.hp!.max).toBeCloseTo(solo.hp!.max * 2.5, 3);
    expect(mirror.hp!.max).toBeCloseTo(sh.hp!.max, 1);
    const me = p.guests[0]!.me!;
    const spec = emptySpec('player');
    spec.dmg.physical = solo.hp!.max * 0.9;
    hitEnemy(gw, me, mirror, spec, me.x, me.y);
    const shown = mirror.hp!.hp / mirror.hp!.max;
    expect(shown).toBeGreaterThan(0.5);
    let lowest = shown;
    let highest = shown;
    for (let i = 0; i < 40; i++) {
      p.step(1 / 60);
      const k = mirror.hp!.hp / mirror.hp!.max;
      lowest = Math.min(lowest, k);
      highest = Math.max(highest, k);
    }
    // the guest's bar shows the host's result from the first frame: no dip and no bounce
    expect(highest - lowest).toBeLessThan(0.03);
    expect(sh.hp!.hp / sh.hp!.max).toBeCloseTo(mirror.hp!.hp / mirror.hp!.max, 1);
  });

  it("an Arcane Elite's orbs circle on a guest's screen, where the host has them (D340)", () => {
    const p = party(1);
    p.host.start(p.s);
    p.step(0.6);
    const g = guestEntity(p, 0);
    const el = spawnEnemy(p.s.w, ENEMIES.shambler!, g.x + 200, g.y, { tellS: 0, elite: 'arcane' });
    p.step(0.6);
    const mirror = p.guests[0]!.cw.get(el.id)!;
    const a0 = mirror.en!.eliteOrbAngle;
    p.step(0.5);
    const a1 = mirror.en!.eliteOrbAngle;
    // about 2.2 rad a second
    expect(a1 - a0).toBeGreaterThan(0.6);
    expect(a1 - a0).toBeLessThan(1.6);
    // and in step with the host's, at the time this screen shows
    const want = el.en!.eliteOrbAngle + ARCANE_ORB_SPIN * (p.guests[0]!.cw.time - p.s.w.time);
    const diff = Math.atan2(Math.sin(a1 - want), Math.cos(a1 - want));
    expect(Math.abs(diff)).toBeLessThan(0.2);
  });

  it('the host refuses a guest hit on an enemy that is dead, gone or far out of reach', () => {
    const { p, g, dummy } = fight();
    const hit = { t: 'hit' as const, id: dummy.id, dmg: 10, type: 'physical' as const, crit: false, poise: 0, fx: g.x, fy: g.y };
    const far = spawnEnemy(p.s.w, ENEMIES.shambler!, g.x + REMOTE_HIT_REACH + 200, g.y, { tellS: 0 });
    far.en!.state = 'idle';
    expect(applyRemoteHit(p.s.w, g, far, { ...hit, id: far.id })).toBe(0);
    expect(applyRemoteHit(p.s.w, g, undefined, hit)).toBe(0);
    expect(applyRemoteHit(p.s.w, g, dummy, hit)).toBeCloseTo(10, 5);
    dummy.hp!.dead = true;
    expect(applyRemoteHit(p.s.w, g, dummy, hit)).toBe(0);
  });

  it("an enemy hit on a guest is decided on the guest's screen: taken there, the host's copy follows", () => {
    const { p, g, dummy, me } = fight();
    const spec = emptySpec('normal');
    spec.dmg.physical = 30;
    const hp0 = me().hp!.hp;
    // the host's world finds the hit on its copy of the guest: it does not apply it, it asks the guest
    expect(hitPlayer(p.s.w, dummy.id, g, spec, dummy.x, dummy.y)).toBe('dodged');
    expect(g.hp!.hp).toBe(hp0);
    p.step(0.4);
    expect(me().hp!.hp).toBeLessThan(hp0 - 5);
    // the guest's body packets carry its HP back to the host
    expect(g.hp!.hp).toBeCloseTo(me().hp!.hp, 0);
  });

  it("a guest's dodge on its own screen avoids a hit the host's copy of it would have taken", () => {
    const { p, g, dummy, me } = fight();
    const spec = emptySpec('normal');
    spec.dmg.physical = 30;
    const hp0 = me().hp!.hp;
    // the guest presses dodge as the hit lands on the host: the dodge starts on its screen at once, and by the time
    // its screen shows the hit land it is inside the dodge's i-frames (the host's copy never had them)
    p.inputs[0] = { ...emptyInput(), moveX: -1, pressed: ACTION_BIT.dodge };
    p.step(1 / 60);
    expect(me().pl!.state).toBe('dodge');
    expect(g.pl!.iframesUntil).toBe(0);
    // an area far bigger than the dodge: only its i-frames can save the guest
    hitPlayer(p.s.w, dummy.id, g, spec, dummy.x, dummy.y, undefined, { s: { k: 'circle', x: g.x, y: g.y, r: 600 }, tau: 0 });
    p.inputs[0] = emptyInput();
    p.step(0.5);
    expect(me().hp!.hp).toBe(hp0);
    expect(g.hp!.hp).toBe(hp0);
    expect(p.seen[0]!.some((x) => x.ev.t === 'fx' && x.ev.kind === 'dodge')).toBe(true);
  });

  it("a guest that stepped out of an area on its own screen is not hit, though the host's copy still stood in it", () => {
    const { p, g, dummy, me } = fight();
    const spec = emptySpec('normal');
    spec.dmg.physical = 30;
    const hp0 = me().hp!.hp;
    hitPlayer(p.s.w, dummy.id, g, spec, dummy.x, dummy.y, undefined, { s: { k: 'circle', x: g.x, y: g.y, r: 30 }, tau: 0 });
    // on the guest's screen it is already well clear of the circle
    me().y += 120;
    p.step(0.4);
    expect(me().hp!.hp).toBe(hp0);
    // the host is told it missed; nothing happened to its copy
    expect(g.hp!.hp).toBe(hp0);
  });

  it("a guest's own swing revives a downed host and, with friendly fire on, hurts a standing one (D12, D115)", () => {
    const { p, me } = fight();
    const host = p.s.localPlayer!;
    // the host stands right next to the guest's body
    host.x = me().x;
    host.y = me().y - 34;
    p.s.w.friendlyFire = 1;
    p.step(0.3);
    rawDamage(p.s.w, host, 1e9, 'physical', 0);
    expect(host.pl!.downed).toBe(true);
    p.step(0.3);
    const swing = (): void => {
      p.inputs[0] = { ...emptyInput(), aimX: host.x, aimY: host.y, pressed: ACTION_BIT.attack };
      p.step(1.2);
    };
    swing();
    expect(host.pl!.reviveProgress).toBeGreaterThan(0);
    // up again (D12): the guest swings at a standing host
    p.s.revive(host);
    host.hp!.invulnUntil = 0;
    p.step(0.3);
    const hp0 = host.hp!.hp;
    swing();
    expect(host.hp!.hp).toBeLessThan(hp0);
  });

  it("the host's word on a guest's body wins: downed, its countdown on everyone's screen, and the revive's HP (D329)", () => {
    const { p, g, me } = fight();
    rawDamage(p.s.w, g, 1e9, 'physical', 0);
    expect(g.pl!.downed).toBe(true);
    p.step(0.4);
    expect(me().pl!.downed).toBe(true);
    expect(me().hp!.hp).toBe(0);
    // the countdown is the host's, and the guest sees it running
    expect(me().pl!.ghostUntil - p.guests[0]!.cw.time).toBeGreaterThan(25);
    for (let i = 0; i < 6 && g.pl!.downed; i++) addRevive(p.s.w, g, p.s.localPlayer!, 2);
    expect(g.pl!.downed).toBe(false);
    p.step(0.4);
    // the guest's stale packets (HP 0) never put it back down; it gets up with the host's 40%
    expect(g.pl!.downed).toBe(false);
    expect(me().pl!.downed).toBe(false);
    expect(me().hp!.hp).toBeCloseTo(g.hp!.max * 0.4, 0);
    expect(g.hp!.hp).toBeCloseTo(g.hp!.max * 0.4, 0);
  });

  it("what the host's world does to a guest's body reaches it: a heal and a buff from an ally", () => {
    const { p, g, me } = fight();
    me().hp!.hp = me().hp!.max * 0.5;
    p.step(0.3);
    expect(g.hp!.hp).toBeCloseTo(me().hp!.max * 0.5, 0);
    heal(p.s.w, g, 20);
    (g.buffs ??= []).push({ id: 'test_haste', stat: 'moveSpeedPct', amount: 0.3, until: p.s.w.time + 5, stacks: 1, maxStacks: 1, sourceId: p.s.localPlayer!.id });
    p.step(0.3);
    expect(me().hp!.hp).toBeCloseTo(me().hp!.max * 0.5 + 20, 0);
    expect(me().buffs!.some((b) => b.id === 'test_haste')).toBe(true);
  });

  it('nothing hurts a guest out of combat, on either screen (D329)', () => {
    const p = party(1);
    p.host.start(p.s);
    p.step(0.6);
    const g = guestEntity(p, 0);
    const spec = emptySpec('normal');
    spec.dmg.physical = 30;
    expect(hitPlayer(p.s.w, 0, g, spec, g.x, g.y)).toBe('none');
    p.step(0.3);
    expect(p.guests[0]!.me!.hp!.hp).toBe(p.guests[0]!.me!.hp!.max);
  });

  it("a guest's own body walks as slowly in the Bloatking's phase-two flood as the host's (D345)", () => {
    const { p, me } = fight();
    p.s.w.roomMods.floodUntil = 1e9;
    p.s.w.roomMods.floodSlow = 0.3;
    p.s.w.roomMods.lightningBonusUntil = p.s.w.time + 30;
    p.step(0.3);
    const gw = p.guests[0]!.cw;
    expect(gw.roomMods.floodSlow).toBeCloseTo(0.3, 6);
    expect(gw.roomMods.lightningBonusUntil).toBeGreaterThan(gw.time);
    expect(speedMult(me(), gw)).toBeCloseTo(0.7, 6);
  });

  it('body packets round-trip', () => {
    const { me } = fight();
    const r = bodyReportOf(me(), 12.5, 4321, 7);
    const back = decodeBody(encodeBody(r))!;
    expect(back.seq).toBe(4321);
    expect(back.epoch).toBe(7);
    expect(back.x).toBeCloseTo(r.x, 0);
    expect(back.y).toBeCloseTo(r.y, 0);
    expect(back.hp).toBeCloseTo(r.hp, 3);
    expect(back.state).toBe(r.state);
    expect(back.flask).toBe(r.flask);
  });
});
