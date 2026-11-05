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
      const want = b.id === 'the_landlord' ? 1800 * 2.5 : b.id === 'vexthorn' ? 1800 * 2 * 1.15 : b.id === 'saint_aurelia' ? 1800 * 2 * 1.4 : 1800 * 2; // D217: Vexthorn +15%; D224: Aurelia +40%
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

describe('co-op boss poise (D194)', () => {
  it('+150% per extra player at spawn, and follows the party when someone joins mid-fight', async () => {
    const { rescaleForPlayers } = await import('../../src/game/enemies/spawn');
    const { coopPoiseMult } = await import('../../src/game/combat/formulas');
    expect([1, 2, 3, 4].map(coopPoiseMult)).toEqual([1, 2.5, 4, 5.5]);
    const solo = spawnEnemy(new World('BP1', Room.empty()), BOSSES.the_landlord!, 640, 368, { zone: 8, players: 1 });
    for (const n of [2, 3, 4]) {
      const b = spawnEnemy(new World(`BP${n}`, Room.empty()), BOSSES.the_landlord!, 640, 368, { zone: 8, players: n });
      expect(b.hp!.poiseMax / solo.hp!.poiseMax).toBeCloseTo(1 + 1.5 * (n - 1), 5);
    }
    // a guest joins mid-fight: the bar grows and stays as worn down as it was
    const w = new World('BPJ', Room.empty());
    const b = spawnEnemy(w, BOSSES.the_landlord!, 640, 368, { zone: 8, players: 1 });
    w.refreshLists();
    b.hp!.poise = b.hp!.poiseMax * 0.4;
    rescaleForPlayers(w, 2);
    expect(b.hp!.poiseMax).toBeCloseTo(solo.hp!.poiseMax * 2.5, 5);
    expect(b.hp!.poise / b.hp!.poiseMax).toBeCloseTo(0.4, 5);
  });
});

describe('The Caretaker on the first playthrough (D211)', () => {
  it('has 30% less HP the first time down, and the full amount in New Game+', () => {
    const cr = BOSSES.the_caretaker!;
    expect(cr.firstCycleHpMult).toBe(0.7);
    const { firstCycleHpMult: _m, ...plain } = cr;
    const hp = (def: typeof cr | typeof plain, cycle: number): number => spawnEnemy(new World(`CT${cycle}`, Room.empty()), def as typeof cr, 640, 368, { zone: 1, cycle, players: 1 }).hp!.max;
    expect(hp(cr, 0)).toBeCloseTo(3600 * 0.7, 3);
    expect(hp(cr, 0) / hp(plain, 0)).toBeCloseTo(0.7, 6);
    expect(hp(cr, 1) / hp(plain, 1)).toBeCloseTo(1, 6);
  });
});

describe('Vexthorn (D217)', () => {
  it('has 15% more HP, one Stag Sentinel in phase 1 and two in phase 2', async () => {
    const { startPhaseSummons } = await import('../../src/game/boss/summons');
    const v = BOSSES.vexthorn!;
    expect(v.baseHp).toBe(Math.round(3600 * 1.15));
    expect(v.phases[0]!.summons).toEqual([{ enemyId: 'stag_sentinel', count: 1, max: 1, everyS: 15 }]);
    expect(v.phases[1]!.summons?.[0]).toMatchObject({ enemyId: 'stag_sentinel', count: 2, max: 2 });
    const w = new World('VEX', Room.empty());
    const boss = spawnEnemy(w, v, 640, 368, { zone: 4 });
    w.refreshLists();
    const stags = (): number => w.enemies.filter((e) => !e.hp?.dead && e.en?.def.id === 'stag_sentinel' && e.en.summonerId === boss.id).length;
    startPhaseSummons(w, boss);
    expect(stags()).toBe(1);
    boss.en!.phase = 1;
    startPhaseSummons(w, boss);
    expect(stags()).toBe(2);
    // never more than the phase allows
    startPhaseSummons(w, boss);
    expect(stags()).toBe(2);
  });
});
