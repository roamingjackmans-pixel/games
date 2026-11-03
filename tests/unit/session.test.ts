import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { rawDamage } from '../../src/game/combat/damage';
import { neighbourId } from '../../src/game/procgen/zone';
import type { Side } from '../../src/game/room';
import type { Entity } from '../../src/game/world';

function session(tutorial = false): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('s'));
  ch.tutorialDone = !tutorial;
  const s = new GameSession(newSave(1, ch, 'SESSION-SEED'));
  s.start();
  return s;
}
function bonfireOf(s: GameSession): Entity {
  const b = [...s.w.entities.values()].find((e) => e.it?.kind === 'bonfire');
  if (!b) throw new Error('no bonfire');
  return b;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}

describe('session: bonfires (D38)', () => {
  it('heals and refills only on the first rest; dying refills the Thermos', () => {
    const s = session();
    const p = s.localPlayer!;
    const c = s.save.character;
    p.hp!.hp = 10;
    c.flaskCur = 0;
    s.interact(p, bonfireOf(s));
    expect(p.hp!.hp).toBe(p.hp!.max);
    expect(c.flaskCur).toBe(c.flaskMax);
    p.hp!.hp = 10;
    c.flaskCur = 0;
    s.interact(p, bonfireOf(s));
    expect(p.hp!.hp).toBe(10);
    expect(c.flaskCur).toBe(0);
    // dying refills (and the respawn heals)
    rawDamage(s.w, p, 9999, 'physical', 0);
    expect(s.dead).toBe(true);
    s.respawn();
    expect(c.flaskCur).toBe(c.flaskMax);
    expect(s.localPlayer!.hp!.hp).toBe(s.localPlayer!.hp!.max);
  });
});

describe('session: rooms, waves, death and the Shardpile', () => {
  it('locks a combat room, spawns waves, clears, drops and recovers a Shardpile', () => {
    const s = session();
    const start = s.node.id;
    let target: { id: string; entry: Side } | null = null;
    for (const side of ['n', 's', 'e', 'w'] as Side[]) {
      const n = neighbourId(s.layout, start, side);
      if (n && (s.layout.byId[n.id]!.kind === 'combat' || s.layout.byId[n.id]!.kind === 'ambush')) target = n;
    }
    const id = target?.id ?? s.layout.rooms.find((r) => r.kind === 'combat')!.id;
    s.enterRoom(id, target?.entry ?? 'bonfire');
    s.w.god = true;
    const p = s.localPlayer!;
    p.x = 640;
    p.y = 380;
    run(s, 1.5);
    expect(s.roomPhase).toBe('fighting');
    expect(Object.values(s.w.room.doors).some((d) => d.exists && d.open)).toBe(false);
    for (let i = 0; i < 12 && s.roomPhase !== 'cleared'; i++) {
      for (const e of s.w.enemies) if (!e.hp!.dead) rawDamage(s.w, e, 1e9, 'holy', p.id);
      run(s, 1.5);
    }
    expect(s.roomPhase).toBe('cleared');
    expect(s.save.character.shards).toBeGreaterThan(0);
    expect(s.save.world.roomsCleared).toContain(id);
    const shards = s.save.character.shards;
    s.w.god = false;
    const dx = p.x;
    const dy = p.y;
    rawDamage(s.w, p, 1e9, 'physical', 0);
    expect(s.save.world.shardpile?.amount).toBe(shards);
    expect(s.save.character.shards).toBe(0);
    s.respawn();
    s.enterRoom(id, 'bonfire');
    s.localPlayer!.x = dx;
    s.localPlayer!.y = dy;
    run(s, 0.2);
    expect(s.save.character.shards).toBe(shards);
    expect(s.save.world.shardpile).toBeUndefined();
  });
  it('a second death before recovering loses the old pile', () => {
    const s = session();
    const p = s.localPlayer!;
    s.save.character.shards = 500;
    rawDamage(s.w, p, 1e9, 'physical', 0);
    s.respawn();
    expect(s.save.world.shardpile?.amount).toBe(500);
    s.save.character.shards = 30;
    rawDamage(s.w, s.localPlayer!, 1e9, 'physical', 0);
    expect(s.save.world.shardpile?.amount).toBe(30);
  });
  it('the boss anteroom has a bonfire and an open door to the boss', () => {
    const s = session();
    s.enterRoom(s.layout.anteroomId, 'bonfire');
    expect(bonfireOf(s)).toBeDefined();
    const toBoss = (['n', 's', 'e', 'w'] as Side[]).find((d) => neighbourId(s.layout, s.node.id, d)?.id === s.layout.bossId);
    expect(toBoss).toBeDefined();
    expect(s.w.room.doors[toBoss!].locked).toBe(false);
    expect(s.w.room.doors[toBoss!].open).toBe(true);
  });
  it('walking into any open door goes through it at once (the body stops exactly on the edge)', () => {
    for (const seed of ['DOOR-A', 'DOOR-B', 'DOOR-C']) {
      const c = newCharacter('knight', 'Joe', 'p1', new Rng(seed));
      c.tutorialDone = true;
      const s = new GameSession(newSave(1, c, seed));
      s.start();
      for (const node of s.layout.rooms.filter((r) => r.kind !== 'boss' && r.kind !== 'tutorial' && r.kind !== 'trial')) {
        if (!s.save.world.roomsCleared.includes(node.id)) s.save.world.roomsCleared.push(node.id);
        for (const side of node.doors) {
          const to = neighbourId(s.layout, node.id, side);
          if (!to) continue;
          s.enterRoom(node.id, side);
          if (!s.w.room.doors[side].open) continue;
          const p = s.localPlayer!;
          // stand where a body walking into the door comes to rest (its radius from the room's edge) and keep pushing
          const r = p.radius;
          const [x, y, mx, my] = side === 'n' ? [640, 16 + r, 0, -1] : side === 's' ? [640, 720 - r, 0, 1] : side === 'w' ? [r, 368, -1, 0] : [1280 - r, 368, 1, 0];
          p.x = p.px = x;
          p.y = p.py = y;
          p.pl!.input = { ...p.pl!.input, moveX: mx, moveY: my, buttons: 0, pressed: 0 };
          run(s, 1);
          expect(s.node.id, `${seed} ${node.id} ${side}`).toBe(to.id);
        }
      }
    }
  });

  it('nobody dies in the Training Hall (D73), but they can in the first room after it', () => {
    const s = session(true);
    const p = s.localPlayer!;
    rawDamage(s.w, p, 1e9, 'physical', 0);
    expect(s.dead).toBe(false);
    expect(p.hp!.hp).toBe(1);
    run(s, 2);
    rawDamage(s.w, p, 1e9, 'fire', 0);
    expect(s.dead).toBe(false);
    expect(p.hp!.hp).toBe(1);
    s.enterRoom(s.layout.startId, 'e');
    rawDamage(s.w, p, 1e9, 'physical', 0);
    expect(s.dead).toBe(true);
  });

  it('the hall leads through the Instructor to the first bonfire; dying to him wakes you there (D90)', () => {
    const s = session(true);
    const p = s.localPlayer!;
    s.goal('move');
    // walk out through the hall's east door into his room
    p.x = 1262;
    p.y = 372;
    p.pl!.input = { ...p.pl!.input, moveX: 1, moveY: 0 };
    run(s, 0.3);
    expect(s.node.kind).toBe('trial');
    expect(s.save.character.tutorialDone).toBe(false);
    expect([...s.w.entities.values()].some((e) => e.en?.def.id === 'the_instructor')).toBe(true);
    // back into the hall: the stations already done stay done
    s.enterRoom(s.layout.tutorialId!, 'e');
    expect(s.node.kind).toBe('tutorial');
    expect(s.tutorialDone('move')).toBe(true);
    // in his room you can die, and you wake at the first bonfire with the tutorial behind you
    s.enterRoom(s.layout.trialId!, 'w');
    rawDamage(s.w, s.localPlayer!, 1e9, 'physical', 0);
    expect(s.dead).toBe(true);
    s.respawn();
    expect(s.node.kind).toBe('start');
    expect(s.save.character.tutorialDone).toBe(true);
  });

  it('walking past him and out his east door reaches the start room', () => {
    const s = session(true);
    expect([...s.w.entities.values()].some((e) => e.en?.def.id === 'the_instructor')).toBe(false);
    s.enterRoom(s.layout.trialId!, 'w');
    const p = s.localPlayer!;
    p.x = 1262;
    p.y = 372;
    p.pl!.input = { ...p.pl!.input, moveX: 1, moveY: 0 };
    run(s, 0.3);
    expect(s.node.kind).toBe('start');
    expect(s.save.character.tutorialDone).toBe(true);
  });

});
