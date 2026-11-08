import { describe, expect, it } from 'vitest';
import { reinforceHpFactor } from '../../src/data/essence';
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
    // D209: NG+ zone 1 is a little harder than the first playthrough's zone 8 (D257: its regular enemies ×3 on top); item level +1
    const e1 = spawnEnemy(s.w, ENEMIES.shambler!, 640, 300, { cycle: 1, zone: 1 });
    const e8 = spawnEnemy(s.w, ENEMIES.shambler!, 640, 300, { cycle: 0, zone: 8 });
    // D303: each zone loses the HP share its expected weapon reinforcement lost in damage
    expect(e1.hp!.max / e8.hp!.max).toBeCloseTo((1.05 * 4.5 * reinforceHpFactor(1, 1)) / reinforceHpFactor(8, 0), 5);
    // D299: each cycle adds 8, so NG+1 zone 1 (9) beats the first playthrough's zone 8 (8)
    expect(itemLevelFor(1, 1)).toBe(9);
    expect(itemLevelFor(8, 0)).toBe(8);
    expect(itemLevelFor(1, 2)).toBeGreaterThan(itemLevelFor(8, 1));
  });
});

describe('New Game+ difficulty curve (D209, D258)', () => {
  it('Shards: NG+ runs from 5% to 35% above the first zone 8, then +10% a cycle (D209)', async () => {
    const { enemyShardMult: f } = await import('../../src/game/combat/formulas');
    const z8 = f(8, 0);
    expect(f(1, 0)).toBe(1);
    expect(f(1, 1) / z8).toBeCloseTo(1.05, 6);
    expect(f(8, 1) / z8).toBeCloseTo(1.35, 6);
    for (const z of [1, 5, 8]) expect(f(z, 2) / f(z, 1)).toBeCloseTo(1.1, 6);
  });

  it('NG+1 is 4.5× the D209 curve for HP and 1.4× for damage; then ×2.5, ×2, ×2, and ×1.15 a cycle for both (D258, D259)', async () => {
    const { enemyHpMult, enemyDmgMult } = await import('../../src/game/combat/formulas');
    const hp = (z: number, c: number): number => enemyHpMult(z, c, 1);
    const z8 = hp(8, 0);
    expect(hp(1, 0)).toBe(1);
    expect(hp(1, 1) / z8).toBeCloseTo(1.05 * 4.5, 6);
    expect(hp(8, 1) / z8).toBeCloseTo(1.35 * 4.5, 6);
    expect(enemyDmgMult(1, 1) / enemyDmgMult(8, 0)).toBeCloseTo(1.05 * 1.4, 6);
    for (const f of [hp, enemyDmgMult]) {
      for (const z of [1, 5, 8]) {
        expect(f(z, 2) / f(z, 1)).toBeCloseTo(2.5, 6);
        expect(f(z, 3) / f(z, 2)).toBeCloseTo(2, 6);
        expect(f(z, 4) / f(z, 3)).toBeCloseTo(2, 6);
        expect(f(z, 5) / f(z, 4)).toBeCloseTo(1.15, 6);
        expect(f(z, 9) / f(z, 8)).toBeCloseTo(1.15, 6);
      }
    }
  });
});
