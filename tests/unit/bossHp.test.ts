// D187: every boss's base HP is doubled (1800 → 3600); The Landlord's is 2.5× (4500).
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ROLE_STATS } from '../../src/data/roles';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';

describe('boss HP (D187)', () => {
  it('the bosses double, The Landlord gets 2.5×', () => {
    expect(ROLE_STATS.boss.hp).toBe(1800 * 2);
    expect(Object.keys(BOSSES).length).toBe(8);
    for (const b of Object.values(BOSSES)) {
      const want = b.id === 'the_landlord' ? 1800 * 2.5 : 1800 * 2;
      expect(b.baseHp ?? ROLE_STATS.boss.hp, b.id).toBe(want);
    }
  });

  it('a spawned Landlord has 1.25× the HP of a spawned zone-8 boss on the shared base', () => {
    const w = new World('BHP', Room.empty());
    const ll = spawnEnemy(w, BOSSES.the_landlord!, 640, 368, { zone: 8 });
    const { baseHp: _own, ...shared } = BOSSES.the_landlord!;
    const other = spawnEnemy(w, shared, 640, 368, { zone: 8 });
    expect(ll.hp!.max / other.hp!.max).toBeCloseTo(4500 / 3600, 3);
  });
});
