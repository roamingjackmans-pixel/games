import { describe, expect, it } from 'vitest';
import { GameSession, beginNextCycle } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { itemLevelFor } from '../../src/game/combat/formulas';

describe('New Game+ (GAME_DESIGN §13)', () => {
  it('keeps the character, starts a new world at zone 1 without the tutorial, and scales the next cycle', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng('n'));
    c.level = 120;
    c.shards = 5000;
    c.glowen = 900;
    c.flaskMax = 5;
    c.flaskCur = 0;
    c.bossesBeaten = 8;
    c.knownSpells.push('heal');
    c.tutorialDone = true;
    const save = newSave(1, c, 'FIRSTSEED');
    save.world.zone = 8;
    save.world.bossesBeatenThisCycle = [1, 2, 3, 4, 5, 6, 7, 8];
    const gear = JSON.stringify(c.equipment);
    beginNextCycle(save);
    expect(c.cycle).toBe(1);
    expect(c.level).toBe(120);
    expect(c.shards).toBe(5000);
    expect(c.glowen).toBe(900);
    expect(c.flaskMax).toBe(5);
    expect(c.flaskCur).toBe(5);
    expect(c.knownSpells).toContain('heal');
    expect(JSON.stringify(c.equipment)).toBe(gear);
    expect(save.world.zone).toBe(1);
    expect(save.world.seed).not.toBe('FIRSTSEED');
    expect(save.world.bossesBeatenThisCycle).toEqual([]);
    const s = new GameSession(save);
    s.start();
    expect(s.layout.tutorialId).toBeNull();
    expect(s.node.kind).toBe('start');
    expect(s.w.cycle).toBe(1);
    // D209: NG+ zone 1 is a little harder than the first playthrough's zone 8; item level +1
    const e1 = spawnEnemy(s.w, ENEMIES.shambler!, 640, 300, { cycle: 1, zone: 1 });
    const e8 = spawnEnemy(s.w, ENEMIES.shambler!, 640, 300, { cycle: 0, zone: 8 });
    expect(e1.hp!.max / e8.hp!.max).toBeCloseTo(1.05, 5);
    expect(itemLevelFor(1, 1)).toBe(2);
  });
});

describe('New Game+ difficulty curve (D209)', () => {
  it('NG+ runs from 5% to 35% harder than the first zone 8, then +10% on every zone each cycle', async () => {
    const { enemyHpMult, enemyDmgMult, enemyShardMult } = await import('../../src/game/combat/formulas');
    for (const f of [(z: number, c: number) => enemyHpMult(z, c, 1), enemyDmgMult, enemyShardMult]) {
      const z8 = f(8, 0);
      // the first playthrough is unchanged and climbs zone by zone
      expect(f(1, 0)).toBe(1);
      expect(f(8, 0)).toBeGreaterThan(f(7, 0));
      // NG+: just above the first zone 8, up to 35% above it, evenly
      expect(f(1, 1) / z8).toBeCloseTo(1.05, 6);
      expect(f(8, 1) / z8).toBeCloseTo(1.35, 6);
      expect(f(4, 1) - f(3, 1)).toBeCloseTo(f(8, 1) - f(7, 1), 6);
      // every cycle after: +10% on every zone
      for (const z of [1, 5, 8]) {
        expect(f(z, 2) / f(z, 1)).toBeCloseTo(1.1, 6);
        expect(f(z, 5) / f(z, 4)).toBeCloseTo(1.1, 6);
      }
    }
  });
});
