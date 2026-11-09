// D324: a dropped weapon has at most one skill on the first playthrough, two from NG+1, all three only from NG+2.
// Drops pass no cycle; it is read from the item level (zone + 8 a cycle). It used to be ilvl − zone, so an NG+1 drop
// rolled as NG+8 and often had all three.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { generateItem } from '../../src/game/items/generate';
import { itemLevelFor } from '../../src/game/combat/formulas';
import type { LootSource } from '../../src/data/lootTables';

const maxSkills = (cycle: number, source: LootSource): number => {
  let m = 0;
  for (let zone = 1; zone <= 8; zone++) {
    for (let i = 0; i < 400; i++) {
      const it = generateItem(new Rng(`sk${cycle}|${zone}|${i}`), { source, ilvl: itemLevelFor(zone, cycle), zone, slot: 'weapon', rarity: i % 4 === 0 ? 'legendary' : 'rare' });
      m = Math.max(m, it.skills ?? 0);
    }
  }
  return m;
};

describe('weapon skill counts by New Game+ cycle (D324)', () => {
  it('first playthrough: one at most; NG+1: two at most; NG+2: all three can drop', () => {
    expect(maxSkills(0, 'boss')).toBe(1);
    expect(maxSkills(1, 'boss')).toBe(2);
    expect(maxSkills(1, 'gary')).toBe(2);
    expect(maxSkills(2, 'boss')).toBe(3);
  });
});
