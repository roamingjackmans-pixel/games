import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { rawDamage } from '../../src/game/combat/damage';
import { neighbourId } from '../../src/game/procgen/zone';
import { smallChest } from '../../src/game/procgen/chests';
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
  it('a combat room either has its chest standing there on entry or none; clearing never spawns one (D88)', () => {
    const s = session();
    const noMimics = false;
    const combat = s.layout.rooms.filter((r) => r.kind === 'combat' || r.kind === 'ambush');
    const withChest = combat.filter((r) => smallChest(s.layout, r, noMimics));
    const without = combat.filter((r) => !smallChest(s.layout, r, noMimics) && !r.bonusChest);
    expect(withChest.length).toBeGreaterThan(0);
    expect(without.length).toBeGreaterThan(0);
    // "on occasion": over many zones about a quarter of the non-dead-end combat rooms
    let n = 0;
    let k = 0;
    for (let i = 0; i < 40; i++) {
      const lay = { ...s.layout, seed: `CHESTS-${i}` };
      for (const r of combat) {
        if (r.bonusChest) continue;
        k++;
        if (smallChest(lay, r, noMimics)) n++;
      }
    }
    expect(n / k).toBeGreaterThan(0.18);
    expect(n / k).toBeLessThan(0.32);
    const chestsHere = (): Entity[] => [...s.w.entities.values()].filter((e) => !e.removed && (e.it?.kind === 'chest' || (e.en?.def.traits?.mimic ?? false)));
    const clearHere = (): void => {
      s.w.god = true;
      const p = s.localPlayer!;
      [p.x, p.y] = s.w.room.nearestFloor(s.entry[0] + 160, s.entry[1], p.radius);
      run(s, 1.5);
      for (let i = 0; i < 12 && s.roomPhase !== 'cleared'; i++) {
        for (const e of s.w.enemies) if (!e.hp!.dead && !e.en!.def.traits?.mimic) rawDamage(s.w, e, 1e9, 'holy', p.id);
        run(s, 1.5);
      }
      expect(s.roomPhase).toBe('cleared');
    };
    // a room with a chest: it is there before the fight starts and can be opened mid-fight
    const a = withChest[0]!;
    const planA = smallChest(s.layout, a, noMimics)!;
    s.enterRoom(a.id, 'bonfire');
    expect(s.roomPhase).toBe('armed');
    expect(chestsHere()).toHaveLength(1);
    clearHere();
    expect(chestsHere()).toHaveLength(1);
    if (!planA.mimic) {
      const c = chestsHere()[0]!;
      s.interact(s.localPlayer!, c);
      expect(s.save.world.chestsOpened).toContain(planA.id);
      s.enterRoom(a.id, 'bonfire');
      expect(chestsHere()).toHaveLength(0);
    }
    // a room without one: none on entry, none after the clear
    const b = without[0]!;
    s.enterRoom(b.id, 'bonfire');
    expect(chestsHere()).toHaveLength(0);
    clearHere();
    expect(chestsHere()).toHaveLength(0);
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

  it('the Instructor has his own room off the hall; stations are kept, death there sends you back to the hall (D75)', () => {
    const s = session(true);
    const p = s.localPlayer!;
    s.goal('move');
    s.goal('aim');
    // walk out through the hall's south door
    p.x = 640;
    p.y = 700;
    p.pl!.input = { ...p.pl!.input, moveX: 0, moveY: 1 };
    run(s, 0.3);
    expect(s.node.kind).toBe('trial');
    expect(s.save.character.tutorialDone).toBe(false);
    const inst = [...s.w.entities.values()].find((e) => e.en?.def.id === 'the_instructor');
    expect(inst).toBeDefined();
    // back into the hall: the stations already done stay done
    s.enterRoom(s.layout.tutorialId!, 'n');
    expect(s.node.kind).toBe('tutorial');
    expect(s.tutorialDone('move')).toBe(true);
    expect(s.tutorialDone('aim')).toBe(true);
    // in his room you can die, and you wake at the start of the hall
    s.enterRoom(s.layout.trialId!, 'n');
    rawDamage(s.w, s.localPlayer!, 1e9, 'physical', 0);
    expect(s.dead).toBe(true);
    s.respawn();
    expect(s.node.kind).toBe('tutorial');
    expect(s.tutorialDone('move')).toBe(true);
  });

  it('a new character starts in the tutorial hall and leaves it into the start room', () => {
    const s = session(true);
    expect(s.node.kind).toBe('tutorial');
    // the Instructor is not in the hall any more (D75)
    expect([...s.w.entities.values()].some((e) => e.en?.def.id === 'the_instructor')).toBe(false);
    const p = s.localPlayer!;
    p.x = 1262;
    p.y = 372;
    p.pl!.input = { ...p.pl!.input, moveX: 1, moveY: 0 };
    run(s, 0.3);
    expect(s.node.kind).toBe('start');
    expect(s.save.character.tutorialDone).toBe(true);
  });
});
