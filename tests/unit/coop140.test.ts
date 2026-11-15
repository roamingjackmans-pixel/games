// The 1.4.0 co-op fixes (D376), on the in-process loopback (a host and one guest, as tests/unit/net.test.ts runs them).
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest, sameThing } from '../../src/game/net/guest';
import { GameSession, REVIVE_INVULN_S } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { ACTION_BIT, emptyInput, type InputFrame } from '../../src/engine/input/actions';
import { addRevive, emptySpec, hitPlayer, rawDamage } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { coopHpMult } from '../../src/game/combat/formulas';
import { buyConsumable } from '../../src/game/items/inventory';
import { tryUseSkill } from '../../src/game/skills/use';
import { refreshDerived } from '../../src/game/player/player';
import { ID_REUSE_S, World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { recordOf, metaOf } from '../../src/game/net/snapshot';
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
  guest: NetGuest;
  input: InputFrame;
  step(sec: number): void;
}

function party(latencyMs = 30): Party {
  const hub = new LoopbackHub({ latencyMs, jitterMs: 5 });
  const clock = (): number => hub.now / 1000;
  const hostSave = saveOf('knight', 'Host Joe', 'host');
  const s = new GameSession(hostSave);
  s.start();
  const host = new NetHost(hub.join('ROOM40', 'host-peer'), 'ROOM40', hostSave, clock);
  const guest = new NetGuest(hub.join('ROOM40', 'guest-peer-0'), saveOf('brute', 'Guest', 'g0', 'OWN-0'), clock);
  const p: Party = {
    hub,
    host,
    s,
    guest,
    input: emptyInput(),
    step(sec: number) {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        guest.frame(p.input, 1 / 60);
        guest.cw.events.length = 0;
        p.input = { ...p.input, pressed: 0 };
      }
    },
  };
  hub.pump(200);
  host.start(s);
  p.step(0.6);
  return p;
}

const guestBody = (p: Party): Entity => p.s.players.find((sp) => sp.char.playerId === 'g0')!.entity!;

describe('co-op: a guest pushes nobody (D376)', () => {
  it('walking into an enemy and into the host moves neither of them', () => {
    const p = party();
    const host = p.s.localPlayer!;
    const g = guestBody(p);
    const foe = spawnEnemy(p.s.w, ENEMIES.shambler!, g.x + 60, g.y, { tellS: 0 });
    foe.en!.state = 'dormant';
    p.step(0.3);
    const f0 = { x: foe.x, y: foe.y };
    p.input = { ...emptyInput(), moveX: 1, aimX: foe.x, aimY: foe.y };
    p.step(1.2);
    p.input = emptyInput();
    expect(Math.hypot(foe.x - f0.x, foe.y - f0.y)).toBeLessThan(1);
    // the guest's own screen keeps it out of the enemy instead
    const me = p.guest.me!;
    const mf = p.guest.cw.get(foe.id)!;
    expect(Math.hypot(me.x - mf.x, me.y - mf.y)).toBeGreaterThan((me.radius + mf.radius) * 0.8);
    // and into the host player
    host.x = g.x - 60;
    host.y = g.y;
    p.step(0.3);
    const h0 = { x: host.x, y: host.y };
    p.input = { ...emptyInput(), moveX: -1, aimX: host.x, aimY: host.y };
    p.step(1.2);
    expect(Math.hypot(host.x - h0.x, host.y - h0.y)).toBeLessThan(1);
  });
});

describe('co-op: ids and the things they name (D376)', () => {
  it('a freed id is not handed out again until ID_REUSE_S later', () => {
    const w = new World('IDS', Room.empty());
    for (let i = 0; i < 70; i++) w.spawn('decoy', 100, 100);
    const a = w.spawn('decoy', 100, 100);
    w.remove(a);
    w.sweep();
    const b = w.spawn('decoy', 100, 100);
    expect(b.id).not.toBe(a.id);
    w.time += ID_REUSE_S + 0.1;
    const c = w.spawn('decoy', 100, 100);
    expect(c.id).toBe(a.id);
  });

  it("a guest's mirror hands out ids far from the host's", () => {
    const w = World.mirror();
    expect(w.spawn('decoy', 0, 0).id).toBeGreaterThan(1e8);
  });

  it('a host id that now names something else is a different thing on the guest (a projectile id reused by an enemy)', () => {
    const w = new World('SAME', Room.empty());
    const proj = w.spawn('decoy', 100, 100);
    const foe = spawnEnemy(w, ENEMIES.shambler!, 200, 200, { tellS: 0 });
    expect(sameThing(foe, recordOf(foe, 0), metaOf(foe, 'x')!)).toBe(true);
    expect(sameThing(proj, recordOf(foe, 0), metaOf(foe, 'x')!)).toBe(false);
    const other = spawnEnemy(w, ENEMIES.crypt_bat ?? ENEMIES.slime ?? ENEMIES.shambler!, 200, 200, { tellS: 0 });
    if (other.en!.def.id !== foe.en!.def.id) expect(sameThing(foe, recordOf(other, 0), metaOf(other, 'x')!)).toBe(false);
  });

  it("a boss's stairs show on the guest's screen, even when something else vanished that same moment", () => {
    const p = party();
    const g = guestBody(p);
    // a short-lived thing the guest has seen goes, and in the same tick the stairs appear: with few ids free, the host
    // used to hand the stairs that very id, and the guest kept its old entity under it (no stairs)
    // (ids up to 64 are never reused: fill those first)
    for (let i = 0; i < 70; i++) p.s.w.spawn('decoy', 40, 40, { radius: 1, dc: { until: p.s.w.time + 60, tauntR: 0, ownerId: 0, illusion: false } });
    (p.s.w as unknown as { freeIds: unknown[] }).freeIds = [];
    const gone = p.s.w.spawn('decoy', g.x, g.y, { radius: 10, dc: { until: p.s.w.time + 5, tauntR: 0, ownerId: 0, illusion: false } });
    p.step(0.3);
    expect(p.guest.cw.get(gone.id)?.type).toBe('decoy');
    p.s.w.remove(gone);
    p.s.w.sweep();
    const st = p.s.w.spawn('interact', g.x + 80, g.y, { radius: 26, drawId: 'stairs', it: { kind: 'stairs', key: 'z1-stairs', label: 'Descend', used: false, holdS: 0 } });
    p.step(0.4);
    const mirror = p.guest.cw.get(st.id);
    expect(mirror?.type).toBe('interact');
    expect(mirror?.it?.kind).toBe('stairs');
  });
});

describe("co-op: another player's skill picture ends with the skill (D376)", () => {
  it("the host's weapon skill plays on the guest's screen and then stops", () => {
    const p = party();
    const host = p.s.localPlayer!;
    inCombat(p.s.w);
    // a starting weapon has no skills unlocked yet: give it one
    host.pl!.char.equipment.main!.skills = 3;
    refreshDerived(host);
    host.stam!.cur = host.stam!.max;
    expect(tryUseSkill(p.s.w, host, 0)).toBe(true);
    let seen = false;
    for (let i = 0; i < 60; i++) {
      p.step(1 / 60);
      if (p.guest.cw.get(host.id)?.pl?.action?.kind === 'skill') seen = true;
    }
    p.step(3);
    expect(host.pl!.action).toBeNull();
    expect(seen).toBe(true);
    expect(p.guest.cw.get(host.id)!.pl!.action).toBeNull();
  });
});

describe('co-op: quick-use items (D376)', () => {
  it('buying an item with nothing usable in the slot puts it there', () => {
    const c = newCharacter('knight', 'Q', 'q', new Rng('q'));
    c.consumables = { throwing_knife: 0 };
    c.quickSlot = 'throwing_knife';
    c.glowen = 10000;
    expect(buyConsumable(c, 'firebomb').ok).toBe(true);
    expect(c.quickSlot).toBe('firebomb');
    // a usable slot stays as it is
    expect(buyConsumable(c, 'throwing_knife').ok).toBe(true);
    expect(c.quickSlot).toBe('firebomb');
  });

  it("a guest's newly bought, newly picked quick item works at once: the host's copy hears of it", () => {
    const p = party();
    const g = guestBody(p);
    inCombat(p.s.w);
    const c = p.guest.save.character;
    c.consumables = {};
    c.quickSlot = null;
    c.glowen = 10000;
    p.guest.syncChar();
    p.step(0.3);
    buyConsumable(c, 'firebomb');
    p.guest.syncChar();
    p.step(0.3);
    expect(g.pl!.char.quickSlot).toBe('firebomb');
    expect(g.pl!.char.consumables.firebomb).toBe(1);
    p.input = { ...emptyInput(), aimX: g.x + 100, aimY: g.y, pressed: ACTION_BIT.quick, buttons: ACTION_BIT.quick };
    p.step(0.5);
    expect(g.pl!.char.consumables.firebomb ?? 0).toBe(0);
  });
});

describe("co-op: Saint Aurelia's Ice Mirrors grow with the party (D376)", () => {
  it('a mirror has the co-op boss share of HP for each player in the fight', () => {
    const solo = new World('M1', Room.empty());
    solo.playerCount = 1;
    const three = new World('M3', Room.empty());
    three.playerCount = 3;
    const a = spawnEnemy(solo, ENEMIES.ice_mirror!, 300, 300, { tellS: 0, zone: 6 });
    const b = spawnEnemy(three, ENEMIES.ice_mirror!, 300, 300, { tellS: 0, zone: 6 });
    expect(b.hp!.max / a.hp!.max).toBeCloseTo(coopHpMult(3, true), 3);
  });
});

describe('co-op: 2 s of invulnerability after a revive (D376)', () => {
  it("the revived guest's own screen has it: a hit and a burn tick in those 2 s do nothing", () => {
    const p = party();
    const g = guestBody(p);
    inCombat(p.s.w);
    rawDamage(p.s.w, g, 1e9, 'physical', 0);
    p.step(0.4);
    for (let i = 0; i < 6 && g.pl!.downed; i++) addRevive(p.s.w, g, p.s.localPlayer!, 2);
    expect(g.pl!.downed).toBe(false);
    p.step(0.3);
    const me = p.guest.me!;
    expect(me.hp!.invulnUntil - p.guest.cw.time).toBeGreaterThan(REVIVE_INVULN_S - 0.6);
    const hp0 = me.hp!.hp;
    const foe = p.guest.cw.enemies[0]!;
    const spec = emptySpec('normal');
    spec.dmg.physical = 50;
    expect(hitPlayer(p.guest.cw, foe.id, me, spec, foe.x, foe.y)).toBe('immune');
    rawDamage(p.guest.cw, me, 20, 'fire', 0);
    expect(me.hp!.hp).toBe(hp0);
  });
});
