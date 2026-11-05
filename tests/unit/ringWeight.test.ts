// D237: every ring weighs 0.8 … 1.5 in game.
import { describe, expect, it } from 'vitest';
import { RINGS } from '../../src/data/rings';
import { makeItem } from '../../src/game/items/make';
import { itemWeight } from '../../src/game/player/equipLoad';

describe('ring weights (D237)', () => {
  it('each ring weighs between 0.8 and 1.5', () => {
    for (const id of Object.keys(RINGS)) {
      const w = itemWeight(makeItem(id, RINGS[id]!.floor, 3));
      expect(w, id).toBeGreaterThanOrEqual(0.8);
      expect(w, id).toBeLessThanOrEqual(1.5);
    }
    expect(itemWeight(makeItem('band_bonk', 'rare', 3))).toBe(1.5);
    expect(itemWeight(makeItem('lucky_charm', 'uncommon', 3))).toBe(0.8);
  });
});
