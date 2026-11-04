// D171: every weapon or shield with a special perk says so on its tooltip, with its number.
import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../../src/data/weapons';
import { SHIELDS } from '../../src/data/shields';
import { shieldSpecials, weaponSpecials } from '../../src/ui/itemSpecials';

const WEAPON_PERKS = ['twoHandOnly', 'hyperArmor', 'bleed', 'backstabMult', 'ripostedCritMult', 'ignoreFrontGuard'] as const;
const SHIELD_PERKS = ['thorns', 'blockHealPct', 'walkMult'] as const;

describe('item special perks (D171)', () => {
  it('every weapon perk in the data gets a line', () => {
    for (const w of Object.values(WEAPONS)) {
      const lines = weaponSpecials(w);
      const want = WEAPON_PERKS.filter((k) => w[k] !== undefined && w[k] !== false && w[k] !== 'none').length + (w.ranged?.chargeS ? 1 : 0) + (w.ranged?.pierceBonk ? 1 : 0);
      expect(lines.length, w.id).toBe(want);
    }
  });

  it('every shield perk gets a line, and says how much', () => {
    for (const s of Object.values(SHIELDS)) {
      const lines = shieldSpecials(s);
      const want = SHIELD_PERKS.filter((k) => s[k] !== undefined && s[k] !== 1).length;
      expect(lines.length, s.id).toBe(want);
    }
    expect(shieldSpecials(SHIELDS.spiked_greatshield!).join(' ')).toMatch(/deals 50% of its damage back/);
    expect(shieldSpecials(SHIELDS.tower_greatshield!).join(' ')).toMatch(/−10% walking speed/);
  });
});
