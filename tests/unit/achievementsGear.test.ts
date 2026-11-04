// D199: "Freshly Squeezed" (a level 50 gem, three Orange perks) and "Built to Code" (+15 reinforcement).
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../../src/data/achievements';
import { hasMaxReinforce, hasPerfectGem } from '../../src/game/achievements';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import type { Gem } from '../../src/game/types';

const orange = (family: 'brutal' | 'leech' | 'tempo', level = 50, q = 0.4) => ({ family, tier: 1 as const, level, q });

describe('gear achievements (D199)', () => {
  it('both are listed', () => {
    expect(ACHIEVEMENTS.find((a) => a.id === 'gem_perfect')?.name).toBe('Freshly Squeezed');
    expect(ACHIEVEMENTS.find((a) => a.id === 'plus_max')?.name).toBe('Built to Code');
  });

  it('Freshly Squeezed: three perks, all level 50, all Orange, loose or socketed', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.gems = [];
    const perfect: Gem = { perks: [orange('brutal'), orange('leech'), orange('tempo')] };
    expect(hasPerfectGem(c)).toBe(false);
    c.gems.push({ perks: [orange('brutal'), orange('leech')] }); // two perks
    c.gems.push({ perks: [orange('brutal'), orange('leech'), orange('tempo', 49)] }); // one at 49
    c.gems.push({ perks: [orange('brutal'), orange('leech'), orange('tempo', 50, 0.34)] }); // one Purple
    expect(hasPerfectGem(c)).toBe(false);
    c.equipment.main!.sockets = [perfect];
    expect(hasPerfectGem(c)).toBe(true);
    c.equipment.main!.sockets = [null];
    c.gems.push(perfect);
    expect(hasPerfectGem(c)).toBe(true);
  });

  it('Built to Code: any weapon, shield or armour piece at +15', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.equipment.body!.plus = 14;
    expect(hasMaxReinforce(c)).toBe(false);
    c.equipment.body!.plus = 15;
    expect(hasMaxReinforce(c)).toBe(true);
  });
});
