import { describe, expect, it } from 'vitest';
import { BONFIRE_LINES, BOSS_DEFEAT, CREDITS_EPILOGUE, DEATH_QUIPS, DEATH_TITLES, EMBER_LINES, INSTRUCTOR_INTRO, TIPS, ZONE_STORY, bossIntroId, zoneCutsceneId, zoneLines } from '../../src/data/story';
import { BOSSES } from '../../src/data/bosses';
import { ZONES } from '../../src/data/zones';

// The story (src/data/story.ts): every zone and boss has its cutscene lines, and every shown line is short.

describe('story', () => {
  it('every zone has 2–4 entry lines (and NG+ variants stay in range)', () => {
    for (const z of ZONES) {
      const s = ZONE_STORY[z.id];
      expect(s, z.name).toBeDefined();
      for (const lines of [s!.lines, s!.ngLines ?? s!.lines]) {
        expect(lines.length).toBeGreaterThanOrEqual(2);
        expect(lines.length).toBeLessThanOrEqual(4);
      }
      expect(zoneLines(z.id, 1).length).toBeGreaterThan(0);
    }
  });

  it('every zone boss has 2–3 defeat lines', () => {
    for (const z of ZONES) {
      const lines = BOSS_DEFEAT[z.boss];
      expect(lines, z.boss).toBeDefined();
      expect(BOSSES[z.boss], z.boss).toBeDefined();
      expect(lines!.length).toBeGreaterThanOrEqual(2);
      expect(lines!.length).toBeLessThanOrEqual(3);
    }
  });

  it('every line the game shows is at most 90 characters and says Glowen, never Stardust', () => {
    const shown: string[] = [
      ...Object.values(ZONE_STORY).flatMap((s) => [...s.lines, ...(s.ngLines ?? [])]),
      ...Object.values(BOSS_DEFEAT).flat(),
      ...DEATH_QUIPS,
      ...BONFIRE_LINES,
      ...EMBER_LINES,
      ...TIPS,
      ...CREDITS_EPILOGUE,
      INSTRUCTOR_INTRO.sub,
      ...Object.values(BOSSES).map((b) => b.introSub),
      ...ZONES.map((z) => z.tagline),
    ];
    expect(shown.filter((l) => l.length > 90 || /stardust/i.test(l))).toEqual([]);
    for (const t of DEATH_TITLES) expect(t).toBe(t.toUpperCase());
  });

  it('cutscene ids are stable strings', () => {
    expect(zoneCutsceneId(3)).toBe('zone-3');
    expect(bossIntroId(8)).toBe('boss-intro-8');
  });
});
