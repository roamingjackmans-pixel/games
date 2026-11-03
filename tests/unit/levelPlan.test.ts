import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { newCharacter } from '../../src/game/player/character';
import { levelCost } from '../../src/game/combat/formulas';
import { planLevelUps } from '../../src/game/items/inventory';

// D142: the bonfire plans points on a copy; nothing on the real character changes until Confirm.
describe('planned level-up points (D142)', () => {
  it('prices points at the rising level cost on a copy, leaving the character alone', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.shards = levelCost(c.level) + levelCost(c.level + 1);
    const before = JSON.stringify(c);
    const plan = planLevelUps(c, { hp: 1, bonk: 1 });
    expect(plan.ok).toBe(true);
    expect(plan.points).toBe(2);
    expect(plan.char.stats.hp).toBe(c.stats.hp + 1);
    expect(plan.char.stats.bonk).toBe(c.stats.bonk + 1);
    expect(plan.char.level).toBe(c.level + 2);
    expect(plan.shardsSpent).toBe(levelCost(c.level) + levelCost(c.level + 1));
    expect(JSON.stringify(c)).toBe(before);
    expect(planLevelUps(c, { hp: 3 }).ok).toBe(false);
  });
  it('uses free points from a Tear first', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.shards = 0;
    c.freePoints = 2;
    const plan = planLevelUps(c, { slicey: 2 });
    expect(plan.ok).toBe(true);
    expect(plan.freeUsed).toBe(2);
    expect(plan.shardsSpent).toBe(0);
    expect(planLevelUps(c, { slicey: 3 }).ok).toBe(false);
  });
});
