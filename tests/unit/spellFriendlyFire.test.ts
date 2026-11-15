// D397: spells cast at a spot catch their caster (Meteor, Comet Barrage, Void Rift, Fireball's blast), and a spell's
// shot stops on a player as it stops on an enemy, hurting them as friendly fire does.
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { runEffects, type EffectCtx } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { stepWorld } from '../../src/game/sim';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import { emptyInput } from '../../src/engine/input/actions';
import type { Entity } from '../../src/game/world';

function solo(seed = 'SELF'): GameSession {
  const ch = newCharacter('scholar', 'Joe', 'p1', new Rng(seed));
  ch.tutorialDone = true;
  const s = new GameSession(newSave(1, ch, seed));
  s.start();
  inCombat(s.w);
  return s;
}

function cast(s: GameSession, p: Entity, id: string, aimX: number, aimY: number): void {
  const ctx: EffectCtx = { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX, aimY, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: `spell:${id}`, spellId: id, school: SPELLS[id]!.school };
  runEffects(s.w, SPELLS[id]!.effect, ctx);
}

const run = (s: GameSession, sec: number): void => {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
};

describe('spells cast at a spot hurt their caster (D397)', () => {
  for (const id of ['meteor', 'comet_barrage', 'void_rift']) {
    it(`${id} at your own feet hurts you`, () => {
      const s = solo(id);
      const p = s.localPlayer!;
      const hp0 = p.hp!.hp;
      cast(s, p, id, p.x, p.y + 9);
      run(s, 3.5);
      expect(p.hp!.hp).toBeLessThan(hp0);
    });
  }

  it('Meteor far away does not, and neither does a line spell from your own hand (Frost Lance)', () => {
    const s = solo('far');
    const p = s.localPlayer!;
    const hp0 = p.hp!.hp;
    cast(s, p, 'meteor', p.x + 400, p.y);
    cast(s, p, 'frost_lance', p.x + 100, p.y);
    run(s, 2.5);
    expect(p.hp!.hp).toBe(hp0);
  });

  it('Fireball bursting on a wall right beside you burns you', () => {
    const s = solo('fb');
    const p = s.localPlayer!;
    // stand against the left wall and throw it into the wall
    p.x = 60;
    p.y = 368;
    const hp0 = p.hp!.hp;
    cast(s, p, 'fireball', 0, 368);
    run(s, 0.6);
    expect(p.hp!.hp).toBeLessThan(hp0);
  });

  it('at 0% friendly fire, or with nothing to fight, it does not', () => {
    const s = solo('ff0');
    const p = s.localPlayer!;
    s.w.friendlyFire = 0;
    const hp0 = p.hp!.hp;
    cast(s, p, 'meteor', p.x, p.y + 9);
    run(s, 2);
    expect(p.hp!.hp).toBe(hp0);
  });
});

describe("a spell's shot stops on a player (D397)", () => {
  it('an Arcane Bolt stops on the ally in its path and hurts them as friendly fire; one behind is untouched', () => {
    const s = solo('bolt');
    const p = s.localPlayer!;
    const c2 = newCharacter('knight', 'Ally', 'p2', new Rng('a2'));
    c2.tutorialDone = true;
    const ally = s.joinPlayer(c2).entity!;
    const c3 = newCharacter('knight', 'Behind', 'p3', new Rng('a3'));
    c3.tutorialDone = true;
    const behind = s.joinPlayer(c3).entity!;
    p.x = 300;
    p.y = 368;
    ally.x = 420;
    ally.y = 368 - 9;
    behind.x = 560;
    behind.y = 368 - 9;
    const a0 = ally.hp!.hp;
    const b0 = behind.hp!.hp;
    cast(s, p, 'arcane_bolt', 900, 368);
    run(s, 1);
    expect(ally.hp!.hp).toBeLessThan(a0);
    expect(behind.hp!.hp).toBe(b0);
    expect([...s.w.entities.values()].some((e) => e.type === 'projectile' && !e.removed)).toBe(false);
  });

  it('with friendly fire off it still stops on them, for no damage', () => {
    const s = solo('bolt0');
    s.w.friendlyFire = 0;
    const p = s.localPlayer!;
    const c2 = newCharacter('knight', 'Ally', 'p2', new Rng('a2'));
    c2.tutorialDone = true;
    const ally = s.joinPlayer(c2).entity!;
    const c3 = newCharacter('knight', 'Behind', 'p3', new Rng('a3'));
    c3.tutorialDone = true;
    const behind = s.joinPlayer(c3).entity!;
    p.x = 300;
    p.y = 368;
    ally.x = 420;
    ally.y = 368 - 9;
    behind.x = 560;
    behind.y = 368 - 9;
    const foe = s.w.enemies[0]!;
    foe.x = 700;
    foe.y = 368;
    const f0 = foe.hp!.hp;
    const a0 = ally.hp!.hp;
    cast(s, p, 'arcane_bolt', 900, 368);
    run(s, 1);
    expect(ally.hp!.hp).toBe(a0);
    expect(foe.hp!.hp).toBe(f0);
  });

  it("on the host, a spell shot stops on a co-op guest's body too (it used to fly through: the guest decides the hit)", () => {
    const hub = new LoopbackHub({ latencyMs: 30 });
    const clock = (): number => hub.now / 1000;
    const hc = newCharacter('scholar', 'Host', 'host', new Rng('h'));
    hc.tutorialDone = true;
    const hostSave = newSave(1, hc, 'SHOTGUEST');
    const s = new GameSession(hostSave);
    s.start();
    inCombat(s.w);
    const host = new NetHost(hub.join('SG', 'host-peer'), 'SG', hostSave, clock);
    const gc = newCharacter('knight', 'Robb', 'g0', new Rng('g'));
    gc.tutorialDone = true;
    const guest = new NetGuest(hub.join('SG', 'guest-peer'), newSave(1, gc, 'OWN'), clock);
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
    hub.pump(200);
    host.start(s);
    step(0.5);
    const p = s.localPlayer!;
    const puppet = s.players.find((sp) => sp.char.playerId === 'g0')!.entity!;
    p.x = 300;
    p.y = 368;
    guest.me!.x = 440;
    guest.me!.y = 368 - 9;
    step(0.3);
    expect(Math.abs(puppet.x - 440)).toBeLessThan(2);
    const foe = s.w.enemies[0]!;
    foe.x = 700;
    foe.y = 368;
    const f0 = foe.hp!.hp;
    const g0 = guest.me!.hp!.hp;
    cast(s, p, 'arcane_bolt', 900, 368);
    step(1);
    expect(foe.hp!.hp).toBe(f0);
    expect(guest.me!.hp!.hp).toBeLessThan(g0);
  });
});
