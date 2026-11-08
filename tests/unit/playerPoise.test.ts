// D312: a player's poise is a stat: 8% of max HP plus armour (heavy most) and a held shield; a hit staggers only if it
// deals at least that share of your max HP, a projectile twice that.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { computeDerived, BASE_POISE } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { emptySpec, hitPlayer } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { TRAINING_DUMMY } from '../../src/data/enemies/special';
import { ARMOR_POISE } from '../../src/data/armor';
import { SHIELD_POISE } from '../../src/data/shields';
import { Rng } from '../../src/engine/rng';
import type { Character } from '../../src/game/types';

const dressed = (weight: 'light' | 'medium' | 'heavy'): Character => {
  const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
  const set = weight === 'heavy' ? 'foreclosure' : weight === 'medium' ? 'abyssal_scale' : 'lessee';
  for (const sl of ['head', 'body', 'legs'] as const) c.equipment[sl] = makeItem(`${set}_${sl}`, 'common', 1);
  c.equipment.off = null;
  return c;
};
const sum = (w: 'light' | 'medium' | 'heavy'): number => ARMOR_POISE[w].head + ARMOR_POISE[w].body + ARMOR_POISE[w].legs;

describe('player poise (D312)', () => {
  it('8 + armour (light 4, medium 10, heavy 17) + a held shield, not while two-handing', () => {
    expect(computeDerived(dressed('light')).poise).toBe(BASE_POISE + sum('light'));
    expect(computeDerived(dressed('medium')).poise).toBe(BASE_POISE + sum('medium'));
    const c = dressed('heavy');
    expect(computeDerived(c).poise).toBe(BASE_POISE + sum('heavy'));
    c.equipment.off = makeItem('kite_shield', 'common', 1);
    const withShield = computeDerived(c).poise;
    expect(withShield).toBeGreaterThanOrEqual(BASE_POISE + sum('heavy'));
    c.twoHanded = true;
    expect(computeDerived(c).poise).toBe(BASE_POISE + sum('heavy'));
    expect(Object.values(SHIELD_POISE)).toContain(withShield - BASE_POISE - sum('heavy'));
  });

  it('a hit staggers only at your poise; a projectile needs twice it', () => {
    const run = (pctOfHp: number, projectile: boolean): boolean => {
      const w = new World('POISE', Room.empty());
      const p = spawnPlayer(w, dressed('heavy'), 0, true, 600, 368);
      const d = spawnEnemy(w, TRAINING_DUMMY, 640, 368, { tellS: 0 });
      const s = emptySpec('normal');
      // defense shaves the hit, so aim by what lands: no defense for this test
      p.pl!.derived.defense.physical = 0;
      s.dmg = { physical: (p.hp!.max * pctOfHp) / 100 };
      hitPlayer(w, d.id, p, s, d.x, d.y, projectile ? d : undefined);
      return p.pl!.state === 'stagger';
    };
    const poise = BASE_POISE + sum('heavy');
    expect(run(poise - 2, false)).toBe(false);
    expect(run(poise + 2, false)).toBe(true);
    expect(run(poise + 2, true)).toBe(false);
    expect(run(poise * 2 + 2, true)).toBe(true);
  });
});
