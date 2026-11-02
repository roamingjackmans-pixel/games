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
  it('the boss anteroom has a bonfire and a locked boss door', () => {
    const s = session();
    s.enterRoom(s.layout.anteroomId, 'bonfire');
    expect(bonfireOf(s)).toBeDefined();
    const locked = Object.values(s.w.room.doors).filter((d) => d.exists && d.locked);
    expect(locked.length).toBe(1);
  });
  it('a new character starts in the tutorial hall and leaves it into the start room', () => {
    const s = session(true);
    expect(s.node.kind).toBe('tutorial');
    expect([...s.w.entities.values()].some((e) => e.en?.def.id === 'the_instructor')).toBe(true);
    const p = s.localPlayer!;
    p.x = 1262;
    p.y = 372;
    p.pl!.input = { ...p.pl!.input, moveX: 1, moveY: 0 };
    run(s, 0.3);
    expect(s.node.kind).toBe('start');
    expect(s.save.character.tutorialDone).toBe(true);
  });
});
