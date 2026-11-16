// D433: fists can scale with Slicey (the Keen Cestus) and with Slicey and Prayer (the Blessed Cestus, Holy), beside the
// Bonk Cestus and its Hollow (Brain) and Fervent (Prayer) variants, which the fast Bonk hybrid builds need (D388).
import { describe, expect, it } from 'vitest';
import { weaponOf } from '../../src/game/items/weaponOf';
import { WEAPONS } from '../../src/data/weapons';
import { WEAPON_VARIANTS } from '../../src/data/weaponVariants';

describe('Slicey fists (D433)', () => {
  it('a Keen Cestus scales A Slicey and needs Slicey, not Bonk', () => {
    const w = weaponOf({ baseId: 'cestus', variant: 'keen' })!;
    expect(w.grades).toEqual({ bonk: '-', slicey: 'A' });
    expect(w.req.bonk).toBe(0);
    expect(w.req.slicey).toBeGreaterThan(0);
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

  it('the Bonk Cestus and its Hollow and Fervent variants stay', () => {
    expect(WEAPONS.cestus!.grades).toEqual({ bonk: 'A', slicey: '-' });
    expect(WEAPON_VARIANTS.cestus!.map((v) => v.id)).toEqual(['hollow', 'fervent', 'keen', 'blessed']);
  });
});
