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
    // ×1.6 HP per cycle; item level +1
    const e1 = spawnEnemy(s.w, ENEMIES.shambler!, 640, 300, { cycle: 1, zone: 1 });
    const e0 = spawnEnemy(s.w, ENEMIES.shambler!, 640, 300, { cycle: 0, zone: 1 });
    expect(e1.hp!.max / e0.hp!.max).toBeCloseTo(1.6, 5);
    expect(itemLevelFor(1, 1)).toBe(2);
  });
});
