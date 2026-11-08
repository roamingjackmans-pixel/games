// A boss phase's bar can be a share of the boss's full HP (D289): Foreman Ignatius's first bar is 40% smaller, his
// second is the full HP, and the co-op party rescale keeps whatever share the current bar is.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy, rescaleForPlayers } from '../../src/game/enemies/spawn';
import { bossPhaseCheck, startBossPhase } from '../../src/game/combat/bossPhase';
import { FOREMAN_IGNATIUS } from '../../src/data/bosses/forge';
import { THE_LANDLORD } from '../../src/data/bosses/abyss';

function fullHp(w: World): number {
  // the same boss with every phase's bar at full size
  const plain = { ...FOREMAN_IGNATIUS, phases: FOREMAN_IGNATIUS.phases.map((p) => ({ ...p, barMult: 1 })) };
  return spawnEnemy(w, plain, 300, 300, { zone: 5 }).hp!.max;
}

describe('Foreman Ignatius: a 40% smaller first bar (D289)', () => {
  it('starts on 60% of his HP and phase 2 refills to the full HP', () => {
    const w = new World('IGN', Room.empty());
    const full = fullHp(w);
    const e = spawnEnemy(w, FOREMAN_IGNATIUS, 640, 300, { zone: 5 });
    expect(e.hp!.max).toBeCloseTo(full * 0.6, 3);
    expect(e.hp!.hp).toBeCloseTo(full * 0.6, 3);
    e.hp!.hp = 0.5;
    bossPhaseCheck(w, e);
    expect(e.en!.phase).toBe(1);
    expect(e.hp!.max).toBeCloseTo(full, 3);
    expect(e.hp!.hp).toBeCloseTo(full, 3);
  });

  it('a player joining keeps the first bar at 60% and the second at full', () => {
    const w = new World('IGN2', Room.empty());
    const e = spawnEnemy(w, FOREMAN_IGNATIUS, 640, 300, { zone: 5, players: 1 });
    const solo = e.hp!.max;
    rescaleForPlayers(w, 2);
    const duo = e.hp!.max;
    const w2 = new World('IGN3', Room.empty());
    w2.playerCount = 2;
    const fresh = spawnEnemy(w2, FOREMAN_IGNATIUS, 640, 300, { zone: 5, players: 2 });
    expect(duo).toBeCloseTo(fresh.hp!.max, 3);
    expect(duo).toBeGreaterThan(solo);
    startBossPhase(w, e, 1);
    const before = e.hp!.max;
    rescaleForPlayers(w, 2);
    expect(e.hp!.max).toBeCloseTo(before, 3);
  });
});

describe("The Landlord's second bar survives a party rescale (D289)", () => {
  it('a player joining in phase 4 does not reset his bar to the full HP', () => {
    if (!THE_LANDLORD) return;
    const w = new World('LL', Room.empty());
    const e = spawnEnemy(w, THE_LANDLORD, 640, 300, { zone: 8, players: 1 });
    const full = e.hp!.max;
    startBossPhase(w, e, 3);
    const p4 = e.hp!.max;
    expect(p4).toBeLessThan(full * 0.5);
    rescaleForPlayers(w, 1);
    expect(e.hp!.max).toBeCloseTo(p4, 3);
  });
});
