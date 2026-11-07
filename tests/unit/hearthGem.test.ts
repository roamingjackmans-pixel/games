// D260: the Hearth gem gives a share of max HP, not a flat amount.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { GEMS, perkValue } from '../../src/data/gems';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';

describe('Hearth gem (D260)', () => {
  it('reads as a percent and raises max HP by that share', () => {
    expect(GEMS.hearth.text).toContain('% max HP');
    const c = newCharacter('knight', 'Joe', 'p', new Rng('HEARTH'));
    const base = computeDerived(c).maxHp;
    const perk = { family: 'hearth' as const, tier: 3 as const, level: 14, q: 0 };
    c.equipment.body!.sockets = [{ perks: [perk] }];
    const pct = perkValue(perk) / 100;
    expect(computeDerived(c).maxHp).toBe(Math.round(base * (1 + pct)));
    expect(pct).toBeGreaterThan(0.02);
    expect(pct).toBeLessThan(0.2);
  });
});
