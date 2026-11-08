// D306: a zone's NG+ bonus boss is never that zone's own boss (it waits at the end of the zone).
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { bonusBossFor, bonusBossPool } from '../../src/game/procgen/bonusBoss';
import type { ZoneLayout } from '../../src/game/procgen/zone';

describe('NG+ bonus boss pick (D306)', () => {
  it("never picks the zone's own boss, over many seeds and cycles", () => {
    const rooms = [{ id: 'r1', kind: 'combat' }, { id: 'r2', kind: 'combat' }] as unknown as ZoneLayout['rooms'];
    for (let z = 1; z <= 8; z++) {
      const own = Object.values(BOSSES).filter((b) => b.zone === z).map((b) => b.id);
      expect(bonusBossPool(z).some((b) => own.includes(b.id))).toBe(false);
      for (let s = 0; s < 200; s++)
        for (const cycle of [1, 2, 3]) {
          const bb = bonusBossFor({ seed: `S${s}`, zone: z, cycle, rooms });
          expect(bb).not.toBeNull();
          expect(own).not.toContain(bb!.bossId);
        }
    }
  });
});
