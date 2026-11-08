import { describe, expect, it } from 'vitest';
import { itemUnlockedSkills } from '../../src/game/items/weaponSkills';
import { makeItem } from '../../src/game/items/make';
import { WEAPONS } from '../../src/data/weapons';

const anyWeapon = Object.keys(WEAPONS)[0]!;

describe('weapon card skills', () => {
  it('lists only the unlocked skills, in order', () => {
    const it0 = makeItem(anyWeapon, 'common', 1);
    it0.skills = 0;
    expect(itemUnlockedSkills(it0)).toEqual([]);
    it0.skills = 1;
    const one = itemUnlockedSkills(it0);
    expect(one.map((s) => s.slot)).toEqual([0]);
    expect(one[0]!.def.id).toBe(WEAPONS[anyWeapon]!.skills[0]);
    it0.skills = 3;
    expect(itemUnlockedSkills(it0).map((s) => s.def.id)).toEqual(WEAPONS[anyWeapon]!.skills);
  });
  it('a bonus skill adds the next one, never beyond three', () => {
    const it0 = makeItem(anyWeapon, 'common', 1);
    it0.skills = 1;
    it0.bonusSkills = 1;
    expect(itemUnlockedSkills(it0).map((s) => s.slot)).toEqual([0, 1]);
    it0.skills = 3;
    expect(itemUnlockedSkills(it0)).toHaveLength(3);
  });
  it('items from older saves use the item-level tiers; non-weapons list none', () => {
    const old = makeItem(anyWeapon, 'common', 3);
    delete old.skills;
    delete old.bonusSkills;
    expect(itemUnlockedSkills(old).map((s) => s.slot)).toEqual([0]);
    const ring = makeItem('ring_stillness', 'epic', 1);
    expect(itemUnlockedSkills(ring)).toEqual([]);
  });
});
