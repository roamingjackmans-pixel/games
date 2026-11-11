// D326: shield requirements by size. Small lean Slicey, medium lean Bonk, greatshields mostly Bonk.
import { describe, expect, it } from 'vitest';
import { SHIELDS } from '../../src/data/shields';

const RANGE = { small: { bonk: [3, 10], slicey: [10, 18] }, medium: { bonk: [12, 22], slicey: [6, 11] }, great: { bonk: [20, 36], slicey: [3, 8] } } as const;

describe('shield requirements by size (D326)', () => {
  it('every shield sits in its size range; small ones need more Slicey than Bonk, the rest more Bonk', () => {
    for (const s of Object.values(SHIELDS)) {
      const r = RANGE[s.size];
      expect(s.req.bonk, s.id).toBeGreaterThanOrEqual(r.bonk[0]);
      expect(s.req.bonk, s.id).toBeLessThanOrEqual(r.bonk[1]);
      expect(s.req.slicey, s.id).toBeGreaterThanOrEqual(r.slicey[0]);
      expect(s.req.slicey, s.id).toBeLessThanOrEqual(r.slicey[1]);
      if (s.size === 'small') expect(s.req.slicey, s.id).toBeGreaterThan(s.req.bonk);
      else expect(s.req.bonk, s.id).toBeGreaterThan(s.req.slicey);
    }
  });
});
