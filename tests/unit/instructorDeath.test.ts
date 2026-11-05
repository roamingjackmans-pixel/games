// D207: dying to The Instructor does not spoil zone 1's clean run (Spotless / Damage Deposit Returned); any other
// death still does.
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
  it('a new character who dies to him still clears zone 1 cleanly by beating its boss without another death', () => {
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
    expect(t.view.count('clean:1')).toBe(1);
    expect(t.unlocked('clean_zone')).toBe(true);
    // the save remembers it, so a reload starts clean too
    expect(s.save.stats.deaths).toBe(1);
    expect(s.save.stats.instructorDeaths).toBe(1);
  });

  it('any other death in zone 1 still spoils it', () => {
    const t = new AchievementTracker(new MemoryStore(), () => 1_700_000_000_000);
    const ch = newCharacter('knight', 'Joe', 'p1', new Rng('s'));
    const s = new GameSession(newSave(1, ch, 'OTHER-DEATH'));
    s.start();
    t.begin({ clean: true });
    t.frame(s.w, s.localPlayer, ch, []);
    t.note({ k: 'death', by: 'the_instructor' });
    t.note({ k: 'death', by: 'hollow_wolf' });
    s.w.bossId = 77;
    t.frame(s.w, s.localPlayer, ch, [{ t: 'death', id: 77, x: 0, y: 0, isPlayer: false, defId: 'the_caretaker' }]);
    expect(t.view.count('clean:1')).toBe(0);
  });
});
