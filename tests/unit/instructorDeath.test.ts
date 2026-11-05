// D207: dying to The Instructor is a death in zone 1 for the achievements: Spotless / Damage Deposit Returned
// cannot count zone 1 afterwards.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { AchievementTracker } from '../../src/game/achievements';
import { MemoryStore } from '../../src/engine/settings';
import { rawDamage } from '../../src/game/combat/damage';
import { stepWorld } from '../../src/game/sim';

describe('The Instructor and clean zones (D207)', () => {
  it('a new character who dies to him has not cleared zone 1 cleanly, even after beating its boss', () => {
    const ch = newCharacter('knight', 'Joe', 'p1', new Rng('s'));
    ch.tutorialDone = false;
    const s = new GameSession(newSave(1, ch, 'INSTRUCTOR-DEATH'));
    s.start();
    const t = new AchievementTracker(new MemoryStore(), () => 1_700_000_000_000);
    t.begin({ clean: true });
    const me = s.localPlayer!;
    t.frame(s.w, me, ch, []);
    expect(s.w.zone).toBe(1);
    s.enterRoom(s.layout.rooms.find((r) => r.kind === 'trial')!.id, 'w');
    for (let i = 0; i < 120; i++) stepWorld(s.w);
    const inst = s.w.enemies.find((e) => e.en?.def.id === 'the_instructor')!;
    expect(inst).toBeTruthy();
    // the session notes deaths on the shared tracker; this test's own tracker hears the same note
    rawDamage(s.w, me, 99999, 'physical', inst.id);
    for (let i = 0; i < 10; i++) stepWorld(s.w);
    expect(s.dead).toBe(true);
    t.note({ k: 'death', by: 'the_instructor' });
    s.respawn();
    expect(s.node.kind).toBe('start');
    // then zone 1's boss falls
    s.w.bossId = 77;
    t.frame(s.w, me, ch, []);
    t.frame(s.w, me, ch, [{ t: 'death', id: 77, x: 0, y: 0, isPlayer: false, defId: 'the_caretaker' }]);
    expect(t.unlocked('boss_the_caretaker')).toBe(true);
    expect(t.view.count('clean:1')).toBe(0);
    expect(t.unlocked('clean_zone')).toBe(false);
  });
});
