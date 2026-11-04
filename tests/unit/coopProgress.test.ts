// D195: what a guest's own world keeps from zones beaten in a host's.
import { describe, expect, it } from 'vitest';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { GameSession } from '../../src/game/session';
import { guestZoneBeaten, worldFrontier } from '../../src/game/save/coopProgress';
import type { SaveFile } from '../../src/game/types';

/** A world that has reached `upTo`: bosses 1..upTo-1 beaten, each zone's start (and boss) bonfire found. */
function reached(upTo: number): SaveFile {
  const ch = newCharacter('knight', 'Guest', 'p2', new Rng('g'));
  ch.tutorialDone = true;
  const s = newSave(2, ch, 'GUEST-WORLD');
  s.world.zone = upTo;
  for (let z = 1; z <= upTo; z++) s.world.bonfiresDiscovered.push(`z${z}-start`);
  for (let z = 1; z < upTo; z++) {
    s.world.bossesBeatenThisCycle.push(z);
    s.world.bonfiresDiscovered.push(`z${z}-boss`);
  }
  s.world.respawnBonfireId = `z${upTo}-start`;
  return s;
}

describe('co-op zone progress (D195)', () => {
  it('zone 3 open at home, join in zone 2, beat 2, 3 and 4: Continue lands in zone 5 with every bonfire of 1-4', () => {
    const s = reached(3);
    expect(worldFrontier(s)).toBe(3);
    for (const z of [2, 3, 4]) guestZoneBeaten(s, z, 0);
    expect(s.pending?.advanceToZone).toBe(5);
    const g = new GameSession(s);
    g.start();
    expect(s.world.zone).toBe(5);
    expect(g.layout.zone).toBe(5);
    for (let z = 1; z <= 4; z++) {
      expect(s.world.bonfiresDiscovered, `zone ${z}`).toContain(`z${z}-start`);
      expect(s.world.bossesBeatenThisCycle).toContain(z);
    }
    expect(s.world.bonfiresDiscovered).toContain('z5-start');
    expect(s.pending?.advanceToZone).toBeUndefined();
    // and the zone 3 and 4 bonfires warp
    expect(g.warp('z4-start')).toBe(true);
    expect(g.layout.zone).toBe(4);
    expect(g.warp('z3-boss')).toBe(true);
    expect(g.layout.zone).toBe(3);
  });

  it('only zones 1-2 open at home, join in zone 3, beat 3 and 4: Continue lands in zone 2 with no zone 3 or 4 bonfire', () => {
    const s = reached(2);
    expect(guestZoneBeaten(s, 3, 0)).toBe(false);
    expect(guestZoneBeaten(s, 4, 0)).toBe(false);
    const g = new GameSession(s);
    g.start();
    expect(s.world.zone).toBe(2);
    expect(g.layout.zone).toBe(2);
    expect(s.world.bonfiresDiscovered.some((b) => b.startsWith('z3') || b.startsWith('z4'))).toBe(false);
    expect(s.world.bossesBeatenThisCycle).not.toContain(3);
    expect(g.warp('z3-start')).toBe(false);
  });

  it('beating your own frontier zone as a guest opens the next one; a host on another NG+ cycle counts for nothing', () => {
    const s = reached(2);
    expect(guestZoneBeaten(s, 2, 1)).toBe(false);
    expect(guestZoneBeaten(s, 2, 0)).toBe(true);
    expect(s.pending?.advanceToZone).toBe(3);
  });

  it('a world warped back to zone 1 is not moved on by beating a zone it had already opened', () => {
    const s = reached(3);
    s.world.zone = 1;
    s.world.respawnBonfireId = 'z1-start';
    guestZoneBeaten(s, 2, 0);
    expect(s.pending?.advanceToZone).toBeUndefined();
    new GameSession(s).start();
    expect(s.world.zone).toBe(1);
  });

  it('The Landlord beaten from zone 8: home opens at his empty arena', () => {
    const s = reached(8);
    guestZoneBeaten(s, 8, 0);
    expect(s.pending?.advanceToZone).toBe(9);
    new GameSession(s).start();
    expect(s.world.respawnBonfireId).toBe('z8-boss');
    expect(s.world.bossesBeatenThisCycle).toContain(8);
  });
});
