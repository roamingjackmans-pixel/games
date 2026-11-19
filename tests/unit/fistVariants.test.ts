// D433, D434: fists scale with Slicey (the Cestus itself, A Slicey since D434; it was Bonk A) and with Slicey and
// Prayer (the Blessed Cestus, Holy); the Hollow (Bonk + Brain) and Fervent (Bonk + Prayer) Cestus stay, which the fast
// Bonk hybrid builds need (D388). The Keen Cestus of D433 (- / A Slicey) is the Cestus itself now and is gone.
import { describe, expect, it } from 'vitest';
import { weaponOf } from '../../src/game/items/weaponOf';
import { WEAPONS } from '../../src/data/weapons';
import { WEAPON_VARIANTS } from '../../src/data/weaponVariants';
import { retireVariant } from '../../src/game/save/migrations';

describe('Slicey fists (D433, D434)', () => {
  it('the Cestus scales A Slicey and needs Slicey, not Bonk', () => {
    const w = WEAPONS.cestus!;
    expect(w.grades).toEqual({ bonk: '-', slicey: 'A' });
    expect(w.req).toEqual({ bonk: 0, slicey: 12 });
    expect(w.paired).toBe(true);
  });

  it('a Blessed Cestus scales C Slicey / C Prayer and deals Holy', () => {
    const w = weaponOf({ baseId: 'cestus', variant: 'blessed' })!;
    expect(w.grades).toEqual({ bonk: '-', slicey: 'C', prayer: 'C' });
    expect(w.element).toBe('holy');
    expect(w.req.bonk).toBe(0);
    expect(w.req.slicey).toBeGreaterThan(0);
    expect(w.req.prayer).toBeGreaterThan(0);
  });

  it('the Hollow and Fervent Cestus still scale with Bonk, and need it', () => {
    expect(WEAPON_VARIANTS.cestus!.map((v) => v.id)).toEqual(['hollow', 'fervent', 'blessed']);
    for (const variant of ['hollow', 'fervent']) {
      const w = weaponOf({ baseId: 'cestus', variant })!;
      expect(w.grades.bonk, variant).toBe('C');
      expect(w.grades.slicey, variant).toBe('-');
      expect(w.req.bonk, variant).toBeGreaterThan(0);
      expect(w.req.slicey, variant).toBe(0);
    }
  });

  it('a Keen Cestus already found becomes a plain Cestus on load', () => {
    const it0 = { baseId: 'cestus', variant: 'keen', name: 'Brutal Keen Cestus of Haste' };
    retireVariant(it0);
    expect(it0).toEqual({ baseId: 'cestus', name: 'Brutal Cestus of Haste' });
    const plain = { baseId: 'cestus', variant: 'keen', name: 'Keen Cestus' };
    retireVariant(plain);
    expect(plain.name).toBe('Cestus');
    const other = { baseId: 'katana', variant: 'keen', name: 'Keen Katana' };
    retireVariant(other);
    expect(other).toEqual({ baseId: 'katana', variant: 'keen', name: 'Keen Katana' });
  });

  it('D437: a Heavy Twin Axes already found becomes plain Twin Axes (A Bonk / B Slicey) on load', () => {
    const axes = { baseId: 'twin_axes', variant: 'heavy', name: 'Heavy Twin Axes of Haste' };
    retireVariant(axes);
    expect(axes).toEqual({ baseId: 'twin_axes', name: 'Twin Axes of Haste' });
    expect(weaponOf(axes)!.grades).toEqual({ bonk: 'A', slicey: 'B' });
    // a Heavy Greatsword is still a Heavy Greatsword
    const ls = { baseId: 'longsword', variant: 'heavy', name: 'Heavy Greatsword' };
    retireVariant(ls);
    expect(ls.variant).toBe('heavy');
  });
});
