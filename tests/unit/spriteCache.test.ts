import { describe, expect, it } from 'vitest';
import { animHz } from '../../src/render/spriteCache';

// D152: cached enemies repaint their own animation 30 times a second with a few on screen, 10 in a crowd.
describe('enemy sprite cache repaint rate (D152)', () => {
  it('eases from 30 Hz (8 or fewer) to 10 Hz (30 or more)', () => {
    expect(animHz(0)).toBe(30);
    expect(animHz(8)).toBe(30);
    expect(animHz(19)).toBeCloseTo(20, 6);
    expect(animHz(30)).toBe(10);
    expect(animHz(80)).toBe(10);
    for (let n = 1; n < 40; n++) expect(animHz(n)).toBeLessThanOrEqual(animHz(n - 1));
  });
});
