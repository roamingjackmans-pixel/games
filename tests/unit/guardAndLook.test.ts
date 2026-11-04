// D176: a front guard stops physical damage hard and lets most of the rest through; empty armor slots are bare.
import { describe, expect, it } from 'vitest';
import { GUARD_NONPHYS_SHARE, frontGuardDmg } from '../../src/game/combat/damage';
import { lookFor } from '../../src/render/entities';
import { newCharacter } from '../../src/game/player/character';
import { CLASSES } from '../../src/data/classes';
import { makeItem } from '../../src/game/items/make';
import type { ClassId } from '../../src/game/types';

describe('front guard by damage type (D176)', () => {
  it('a 70% guard stops 70% of physical and only a share of fire', () => {
    const out = frontGuardDmg({ physical: 100, fire: 100 }, 0.7);
    expect(out.physical).toBeCloseTo(30, 5);
    expect(out.fire).toBeCloseTo(100 * (1 - 0.7 * GUARD_NONPHYS_SHARE), 5);
    expect(out.fire!).toBeGreaterThan(75);
  });
  it('an unbreakable guard stops all physical but lets most magic through', () => {
    const out = frontGuardDmg({ physical: 50, magic: 50 }, 1);
    expect(out.physical ?? 0).toBe(0);
    expect(out.magic!).toBeCloseTo(50 * (1 - GUARD_NONPHYS_SHARE), 5);
  });
});

describe('empty armor slots are bare for every class (D176)', () => {
  for (const id of Object.keys(CLASSES) as ClassId[]) {
    it(`${id} with no armor looks like the Nobody`, () => {
      const c = newCharacter(id, 'x', 'p');
      c.equipment.head = null;
      c.equipment.body = null;
      c.equipment.legs = null;
      const l = lookFor(c);
      expect(l.head).toBe('none');
      expect(l.body).toBe('loincloth');
      expect(l.legs).toBe('bare');
    });
  }
  it('worn leg armor still shows under a bare chest', () => {
    const c = newCharacter('scholar', 'x', 'p');
    c.equipment.body = null;
    c.equipment.legs = makeItem('forgeplate_legs', 'rare');
    expect(lookFor(c).legs).not.toBe('bare');
  });
});
