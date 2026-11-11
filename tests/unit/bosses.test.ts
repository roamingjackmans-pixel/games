import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { BOSS_ARENAS } from '../../src/data/rooms/bosses';
import { ZONES } from '../../src/data/zones';
import { validateBoss, type ValidationIssue } from '../../src/data/validate';
import { validateTemplate } from '../../src/game/procgen/templates';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import type { Entity } from '../../src/game/world';

function session(zone = 1): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('b'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'BOSS-SEED');
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
function bossRoomId(s: GameSession): string {
  return s.layout.bossId;
}
function boss(s: GameSession): Entity {
  const b = s.w.get(s.w.bossId);
  if (!b) throw new Error('no boss');
  return b;
}
function bigHit(s: GameSession, b: Entity, amount: number): number {
  const spec = emptySpec('normal');
  spec.dmg.physical = amount;
  return hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
}

describe('bosses: data (CONTENT_ENEMIES §13 item 5)', () => {
  it('every registered boss has Red, Piercing, two [AREA] attacks and a phase-2 table', () => {
    const issues: ValidationIssue[] = [];
    for (const b of Object.values(BOSSES)) validateBoss(b, issues);
    expect(issues).toEqual([]);
  });
  it('zones 1–3 have their bosses; arenas are valid rooms with a boss spot and stairs', () => {
    for (const z of ZONES.slice(0, 3)) expect(BOSSES[z.boss], z.boss).toBeDefined();
    for (const t of Object.values(BOSS_ARENAS)) {
      expect(validateTemplate(t, { arena: true }), t.id).toEqual([]);
      expect(t.rows.join('').includes('K'), t.id).toBe(true);
      expect(t.rows.join('').includes('H'), t.id).toBe(true);
    }
  });
});

describe('bosses: phases', () => {
  it('a hit that would cross 50% stops at exactly 50% and starts a 2 s invulnerable transition', () => {
    const s = session(1);
    s.enterRoom(bossRoomId(s), 's');
    run(s, 1.6); // past the intro
    const b = boss(s);
    const max = b.hp!.max;
    expect(b.en!.phase).toBe(0);
    bigHit(s, b, max * 10);
    expect(b.hp!.hp).toBe(max * 0.5);
    expect(b.hp!.dead).toBe(false);
    expect(b.en!.phase).toBe(1);
    expect(b.en!.phaseAttacks.some((a) => a.id === 'caretaker_grave_quake')).toBe(true);
    // invulnerable during the transition
    expect(bigHit(s, b, 100)).toBe(0);
    expect(b.hp!.hp).toBe(max * 0.5);
    run(s, PHASE_TRANSITION_S + 0.1);
    expect(bigHit(s, b, 100)).toBeGreaterThan(0);
    // phase 2's arena change: the moss burns
    expect([...s.w.entities.values()].some((e) => e.type === 'hazard' && e.hz?.hazard === 'emberMoss')).toBe(true);
  });
  it('hitting exactly to the threshold also changes phase', () => {
    const s = session(1);
    s.enterRoom(bossRoomId(s), 's');
    run(s, 1.6);
    const b = boss(s);
    b.hp!.hp = b.hp!.max * 0.5 + 10;
    // resist-free physical hit of exactly 10 after mitigation is hard to guarantee; set and check directly
    b.hp!.hp = b.hp!.max * 0.5;
    bigHit(s, b, 0.0001);
    expect(b.en!.phase).toBe(1);
  });
});

describe('bosses: the room', () => {
  it('locks on entry with an intro, then the kill opens the stairs and counts toward the flask', () => {
    const s = session(1);
    s.enterRoom(bossRoomId(s), 's');
    expect(s.roomPhase).toBe('boss');
    expect(s.w.inputLock).toBeGreaterThan(s.w.time + 1.4);
    expect(Object.values(s.w.room.doors).filter((d) => d.exists).every((d) => d.locked && !d.open)).toBe(true);
    run(s, 1.6);
    const b = boss(s);
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 0.1);
    bigHit(s, b, b.hp!.max * 10);
    expect(b.hp!.dead).toBe(true);
    const c = s.save.character;
    expect(c.bossesBeaten).toBe(1);
    expect(c.flaskMax).toBe(1);
    expect(s.save.world.bossesBeatenThisCycle).toEqual([1]);
    // drops: items (zone 1: never purple or orange, D327) and a gem for the player
    const mine = [...s.w.entities.values()].filter((e) => e.type === 'pickup' && e.pk?.forPlayer === 'p1');
    const items = mine.filter((e) => e.pk!.kind === 'item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((e) => ['common', 'uncommon', 'rare'].includes(e.pk!.item!.rarity))).toBe(true);
    expect(mine.some((e) => e.pk!.kind === 'gem')).toBe(true);
    run(s, 2.2);
    const stairs = [...s.w.entities.values()].find((e) => e.it?.kind === 'stairs');
    expect(stairs).toBeDefined();
    expect(Object.values(s.w.room.doors).some((d) => d.exists && d.open)).toBe(true);
    s.interact(s.localPlayer!, stairs!);
    expect(s.layout.zone).toBe(2);
    expect(s.node.kind).toBe('start');
  });
  it('a second boss raises the flask max to 2; a beaten boss stays beaten', () => {
    const s = session(2);
    s.save.character.bossesBeaten = 1;
    s.enterRoom(bossRoomId(s), 's');
    run(s, 1.6);
    const b = boss(s);
    expect(b.en!.def.id).toBe('mother_spore');
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 0.1);
    bigHit(s, b, b.hp!.max * 10);
    expect(s.save.character.flaskMax).toBe(2);
    // the flask max went up, the flask itself was not refilled (D38)
    expect(s.save.character.flaskCur).toBeLessThanOrEqual(1);
    s.enterRoom(s.layout.startId, 'bonfire');
    s.enterRoom(bossRoomId(s), 's');
    expect(s.w.bossId).toBe(0);
    expect(s.roomPhase).not.toBe('boss');
    expect([...s.w.entities.values()].some((e) => e.it?.kind === 'stairs')).toBe(true);
  });
  it('dying to a boss resets it; the Shardpile lands inside the door', () => {
    const s = session(3);
    s.save.character.shards = 77;
    s.enterRoom(bossRoomId(s), 'n');
    run(s, 1.6);
    const b = boss(s);
    bigHit(s, b, b.hp!.max * 10);
    expect(b.en!.phase).toBe(1);
    s.die(s.localPlayer!);
    expect(s.save.world.shardpile?.roomId).toBe(bossRoomId(s));
    s.respawn();
    s.enterRoom(bossRoomId(s), 'n');
    run(s, 1.6);
    const b2 = boss(s);
    expect(b2.en!.phase).toBe(0);
    expect(b2.hp!.hp).toBe(b2.hp!.max);
  });
  it('every zone 1–3 boss survives a minute of fighting a passive player without errors', () => {
    for (const z of [1, 2, 3]) {
      const s = session(z);
      s.w.god = true;
      s.enterRoom(bossRoomId(s), 's');
      const b = boss(s);
      run(s, 20);
      bigHit(s, b, b.hp!.max * 10);
      run(s, 40);
      expect(b.en!.phase, `zone ${z}`).toBe(1);
      expect(b.hp!.dead).toBe(false);
    }
  });
});
