// Friendly fire in co-op (D115): players' attacks hit standing allies at the host's 0–200%, ghosts are still revived
// by hits (D12), nobody leaves the room while a ghost waits for its revive, and the two achievements that go with it.
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { MemoryStore, normalizeFriendlyFire, normalizeSettings, defaultSettings } from '../../src/engine/settings';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, ffVictims, hitAlly, hitPlayer, rawDamage } from '../../src/game/combat/damage';
import { spawnPlayerProjectile } from '../../src/game/player/player';
import { neighbourId } from '../../src/game/procgen/zone';
import { AchievementTracker } from '../../src/game/achievements';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import { emptyInput } from '../../src/engine/input/actions';
import type { Side } from '../../src/game/room';
import type { DamageSpec, Entity, GameEvent } from '../../src/game/world';

function party(): { s: GameSession; host: Entity; ally: Entity } {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('ff'));
  ch.tutorialDone = true;
  const s = new GameSession(newSave(1, ch, 'FF-SEED'));
  s.start();
  const sp = s.joinPlayer(newCharacter('knight', 'Ann', 'p2', new Rng('ff2')));
  const host = s.localPlayer!;
  const ally = sp.entity!;
  // side by side in the open, nobody blocking, no i-frames
  host.x = host.px = 600;
  host.y = host.py = 400;
  ally.x = ally.px = 660;
  ally.y = ally.py = 400;
  inCombat(s.w); // D329: hurting anyone needs something to fight
  return { s, host, ally };
}

function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}

const sword = (): DamageSpec => ({ ...emptySpec('player'), dmg: { physical: 40 }, status: [{ id: 'bleed', buildup: 20 }] });

/** The HP an ally loses to `spec` at friendly fire `k` (fresh HP, meters and stance each time). */
function lost(s: GameSession, host: Entity, ally: Entity, k: number): number {
  s.w.friendlyFire = k;
  ally.hp!.hp = ally.hp!.max;
  ally.st!.meters.bleed = 0;
  ally.pl!.state = 'idle';
  hitAlly(s.w, host, ally, sword(), host.x, host.y);
  return ally.hp!.max - ally.hp!.hp;
}

describe('friendly fire (D115)', () => {
  it('scales an ally hit by the host setting: 0% nothing, 100% a normal player hit, 200% double', () => {
    const { s, host, ally } = party();
    expect(lost(s, host, ally, 0)).toBe(0);
    expect(ally.st!.meters.bleed).toBe(0);
    const full = lost(s, host, ally, 1);
    expect(full).toBeGreaterThan(0);
    expect(ally.st!.meters.bleed).toBeCloseTo(20, 5);
    // exactly what the player hit pipeline (defense) makes of the same blow
    ally.hp!.hp = ally.hp!.max;
    hitPlayer(s.w, host.id, ally, sword(), host.x, host.y);
    expect(ally.hp!.max - ally.hp!.hp).toBeCloseTo(full, 6);
    expect(lost(s, host, ally, 2)).toBeCloseTo(full * 2, 6);
    expect(ally.st!.meters.bleed).toBeCloseTo(40, 5);
  });

  it('never hits the attacker, a ghost, or anyone in solo; attacks without damage never hit allies', () => {
    const { s, host, ally } = party();
    expect(ffVictims(s.w, host)).toEqual([ally]);
    expect(hitAlly(s.w, host, host, sword(), host.x, host.y)).toBe('none');
    expect(hitAlly(s.w, host, ally, { ...emptySpec('player'), control: { id: 'freeze', durationS: 2 } }, host.x, host.y)).toBe('none');
    expect(ally.st!.controls.freeze).toBe(0);
    s.w.friendlyFire = 0;
    expect(ffVictims(s.w, host)).toEqual([]);
    const solo = new GameSession(newSave(2, Object.assign(newCharacter('knight', 'Solo', 's1', new Rng('solo')), { tutorialDone: true }), 'FF-SOLO'));
    solo.start();
    expect(ffVictims(solo.w, solo.localPlayer!)).toEqual([]);
  });

  it('goes through i-frames and blocks like any hit, and is never parried', () => {
    const { s, host, ally } = party();
    ally.pl!.iframesFrom = s.w.time;
    ally.pl!.iframesUntil = s.w.time + 1;
    expect(hitAlly(s.w, host, ally, sword(), host.x, host.y)).toBe('dodged');
    expect(ally.hp!.hp).toBe(ally.hp!.max);
    ally.pl!.iframesUntil = 0;
    ally.pl!.parryUntil = s.w.time + 1;
    ally.pl!.stanceUntil = s.w.time + 1;
    expect(hitAlly(s.w, host, ally, sword(), host.x, host.y)).not.toBe('parried');
    expect(host.pl!.state).not.toBe('stagger');
  });

  it("a player's shot hurts an ally in its path, scaled, and passes harmlessly at 0%", () => {
    const { s, host, ally } = party();
    s.w.friendlyFire = 0;
    spawnPlayerProjectile(s.w, host, 0, 600, 6, sword(), 0, 'p_arrow');
    run(s, 0.3);
    expect(ally.hp!.hp).toBe(ally.hp!.max);
    s.w.friendlyFire = 2;
    spawnPlayerProjectile(s.w, host, 0, 600, 6, sword(), 0, 'p_arrow');
    run(s, 0.3);
    expect(ally.hp!.hp).toBeLessThan(ally.hp!.max);
    expect(host.hp!.hp).toBe(host.hp!.max);
  });

  it("hitting a downed ally's ghost still revives instead of hurting (D12)", () => {
    const { s, host, ally } = party();
    s.w.friendlyFire = 2;
    rawDamage(s.w, ally, 1e9, 'physical', 0);
    expect(ally.pl!.downed).toBe(true);
    const spec = { ...sword(), reviveValue: 3 };
    spawnPlayerProjectile(s.w, host, 0, 600, 6, spec, 0, 'p_arrow');
    run(s, 0.3);
    expect(ally.pl!.reviveProgress).toBeGreaterThan(0);
    expect(ally.pl!.downed).toBe(true);
    expect(ally.hp!.hp).toBe(0);
  });

  it('the setting is stored 0–200 in steps of 10, defaulting to 100 for old settings', () => {
    expect(defaultSettings().game.friendlyFire).toBe(100);
    expect(normalizeSettings({ video: {} }).game.friendlyFire).toBe(100);
    expect(normalizeSettings({ game: { friendlyFire: 0 } }).game.friendlyFire).toBe(0);
    expect(normalizeFriendlyFire(250)).toBe(200);
    expect(normalizeFriendlyFire(-5)).toBe(0);
    expect(normalizeFriendlyFire(144)).toBe(140);
    expect(normalizeFriendlyFire('lots')).toBe(100);
  });
});

describe('downed allies hold the doors (D115)', () => {
  /** stand the host in an open door of the start room */
  function atDoor(s: GameSession, host: Entity): void {
    for (const side of ['n', 's', 'e', 'w'] as Side[]) {
      const d = s.w.room.doors[side];
      if (!d.exists || !d.open || !neighbourId(s.layout, s.node.id, side)) continue;
      const [x, y] = side === 'n' ? [640, 16] : side === 's' ? [640, 720] : side === 'w' ? [0, 368] : [1280, 368];
      host.x = host.px = x;
      host.y = host.py = y;
      return;
    }
    throw new Error('no open door');
  }

  it('nobody leaves while a ghost waits; a revive or a bleed-out opens the way again', () => {
    const { s, host, ally } = party();
    const start = s.node.id;
    rawDamage(s.w, ally, 1e9, 'physical', 0);
    expect(s.waitingGhost()).toBe(ally);
    atDoor(s, host);
    s.w.events.length = 0;
    s.tick(1 / 60);
    expect(s.node.id).toBe(start);
    expect(s.w.events.some((e) => e.t === 'msg' && e.text === 'Revive Ann first!' && e.forPlayer === 'p1')).toBe(true);
    // revived: the door works
    s.revive(ally);
    expect(s.waitingGhost()).toBeNull();
    atDoor(s, host);
    s.tick(1 / 60);
    expect(s.node.id).not.toBe(start);
  });

  it('a player who bled out (out until the bonfire) does not block the doors', () => {
    const { s, host, ally } = party();
    const start = s.node.id;
    rawDamage(s.w, ally, 1e9, 'physical', 0);
    // keep the host standing still and away from the doors while the ghost runs out
    run(s, 31);
    expect(ally.pl!.deadUntilRest).toBe(true);
    expect(s.waitingGhost()).toBeNull();
    expect(s.dead).toBe(false);
    atDoor(s, host);
    s.tick(1 / 60);
    expect(s.node.id).not.toBe(start);
  });

  it('a party of ghosts is wiped, not trapped', () => {
    const { s, host, ally } = party();
    rawDamage(s.w, ally, 1e9, 'physical', 0);
    rawDamage(s.w, host, 1e9, 'physical', 0);
    expect(s.dead).toBe(true);
    s.respawn();
    expect(s.waitingGhost()).toBeNull();
  });
});

describe('friendly-fire achievements (D115)', () => {
  it('"Friendly Fire" for the one who downs an ally; "Not My Problem" when that ally bleeds out', () => {
    const { s, host, ally } = party();
    const seen: GameEvent[] = [];
    s.w.friendlyFire = 2;
    for (let i = 0; i < 100 && !ally.pl!.downed; i++) {
      ally.pl!.state = 'idle';
      hitAlly(s.w, host, ally, { ...emptySpec('player'), dmg: { physical: 200 } }, host.x, host.y);
      seen.push(...s.w.events.splice(0));
    }
    expect(ally.pl!.downed).toBe(true);
    expect(ally.pl!.downedBy).toBe('p1');
    expect(seen.some((e) => e.t === 'feat' && e.kind === 'downAlly' && e.playerId === 'p1' && e.targetId === ally.id)).toBe(true);
    for (let i = 0; i < 31 * 60; i++) {
      stepWorld(s.w);
      seen.push(...s.w.events.splice(0));
    }
    expect(ally.pl!.deadUntilRest).toBe(true);
    expect(seen.some((e) => e.t === 'feat' && e.kind === 'abandonAlly' && e.playerId === 'p1')).toBe(true);

    // the downer earns both; the friend who was downed earns neither
    const mine = new AchievementTracker(new MemoryStore());
    const theirs = new AchievementTracker(new MemoryStore());
    mine.frame(s.w, host, host.pl!.char, seen);
    theirs.frame(s.w, ally, ally.pl!.char, seen);
    expect(mine.unlocked('ff_down')).toBe(true);
    expect(mine.unlocked('ff_abandon')).toBe(true);
    expect(theirs.unlocked('ff_down')).toBe(false);
    expect(theirs.unlocked('ff_abandon')).toBe(false);
  });

  it('a revived ally is not abandoned, and an enemy down is nobody\'s fault', () => {
    const { s, host, ally } = party();
    s.w.friendlyFire = 2;
    for (let i = 0; i < 100 && !ally.pl!.downed; i++) {
      ally.pl!.state = 'idle';
      hitAlly(s.w, host, ally, { ...emptySpec('player'), dmg: { physical: 200 } }, host.x, host.y);
    }
    s.revive(ally);
    expect(ally.pl!.downedBy).toBe('');
    s.w.events.length = 0;
    // downed later by something else (no source), long after the friendly hit: nobody's achievement
    s.w.time += 20;
    rawDamage(s.w, ally, 1e9, 'physical', 0);
    expect(ally.pl!.downed).toBe(true);
    expect(ally.pl!.downedBy).toBe('');
    const ev: GameEvent[] = [];
    for (let i = 0; i < 31 * 60; i++) {
      stepWorld(s.w);
      ev.push(...s.w.events.splice(0));
    }
    expect(ev.some((e) => e.t === 'feat' && (e.kind === 'abandonAlly' || e.kind === 'downAlly'))).toBe(false);
  });
});

describe('the host sets friendly fire for the party (D115)', () => {
  it('guests see the host value in the lobby and get changes mid-run with the snapshots', () => {
    const hub = new LoopbackHub({ latencyMs: 20, jitterMs: 0 });
    const clock = (): number => hub.now / 1000;
    const hostChar = Object.assign(newCharacter('knight', 'Host', 'host', new Rng('h')), { tutorialDone: true });
    const hostSave = newSave(1, hostChar, 'FF-NET');
    const host = new NetHost(hub.join('FFROOM', 'host-peer'), 'FFROOM', hostSave, clock);
    let pct = 150;
    host.friendlyFire = () => pct;
    const guestChar = Object.assign(newCharacter('brute', 'Guest', 'g0', new Rng('g')), { tutorialDone: true });
    const guest = new NetGuest(hub.join('FFROOM', 'guest-peer'), newSave(2, guestChar, 'FF-OWN'), clock);
    hub.pump(200);
    expect(guest.state).toBe('lobby');
    expect(guest.hostFriendlyFire).toBe(150);
    pct = 30;
    host.sendLobby(false);
    hub.pump(100);
    expect(guest.hostFriendlyFire).toBe(30);
    // in the world, the host's simulation value travels with every snapshot
    const s = new GameSession(hostSave);
    s.start();
    host.start(s);
    s.w.friendlyFire = 2;
    const step = (sec: number): void => {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        guest.frame(emptyInput(), 1 / 60);
        guest.cw.events.length = 0;
      }
    };
    step(0.5);
    expect(guest.hostFriendlyFire).toBe(200);
    expect(guest.cw.friendlyFire).toBe(2);
    s.w.friendlyFire = 0;
    step(0.3);
    expect(guest.hostFriendlyFire).toBe(0);
  });
});
