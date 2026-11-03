import { describe, expect, it } from 'vitest';
import { SHIELDS } from '../../src/data/shields';

// D130: every small shield parries well; medium shields parry worse than any small one, and some not at all;
// anything larger than medium never parries.
describe('shield parry by size (D130)', () => {
  const all = Object.values(SHIELDS);
  const small = all.filter((s) => s.size === 'small');
  const medium = all.filter((s) => s.size === 'medium');
  it('every small shield has a good parry', () => {
    expect(small.length).toBeGreaterThan(0);
    for (const s of small) expect(s.parryS ?? 0).toBeGreaterThanOrEqual(0.15);
  });
  it('medium shields parry worse than every small shield, and at least one cannot parry', () => {
    const worstSmall = Math.min(...small.map((s) => s.parryS ?? 0));
    for (const s of medium) expect(s.parryS ?? 0).toBeLessThan(worstSmall);
    expect(medium.some((s) => s.parryS === null)).toBe(true);
    expect(medium.some((s) => (s.parryS ?? 0) > 0)).toBe(true);
  });
  it('shields larger than medium cannot parry', () => {
    for (const s of all) if (s.size !== 'small' && s.size !== 'medium') expect(s.parryS).toBeNull();
  });
});
