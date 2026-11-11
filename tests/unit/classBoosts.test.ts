// D184: each class has a primary stat (+25% from every point) and a secondary (+15%); the Knight's and Hunter's new kits.
import { describe, expect, it } from 'vitest';
import { CLASSES, PRIMARY_BOOST, SECONDARY_BOOST, statBoosts } from '../../src/data/classes';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { maxHP, maxStamina, scalingMult } from '../../src/game/combat/formulas';
import { spellSkill } from '../../src/game/skills/use';
import { Rng } from '../../src/engine/rng';
import type { ClassId } from '../../src/game/types';

describe('primary and secondary stats (D184)', () => {
  it('the classes have the asked-for pairs', () => {
    const want: Partial<Record<ClassId, [string, string]>> = {
      knight: ['hp', 'endurance'], brute: ['bonk', 'hp'], duelist: ['slicey', 'endurance'], scholar: ['brain', 'slicey'], cleric: ['prayer', 'bonk'],
      spearman: ['bonk', 'brain'], hunter: ['slicey', 'bonk'], occultist: ['prayer', 'slicey'], berserker: ['bonk', 'slicey'],
    };
    for (const [id, [p, s]] of Object.entries(want)) {
      expect(CLASSES[id as ClassId].primary, id).toBe(p);
      expect(CLASSES[id as ClassId].secondary, id).toBe(s);
    }
    // D334: the Nobody has no primary and every stat secondary (+15% each)
    expect(CLASSES.nobody.primary).toBeNull();
    expect(Object.values(statBoosts('nobody'))).toEqual([1.15, 1.15, 1.15, 1.15, 1.15, 1.15]);
  });

  it('a primary stat gives 25% more from its points, a secondary 15% (the base is untouched)', () => {
    expect(maxHP(10, PRIMARY_BOOST) - 100).toBeCloseTo((maxHP(10) - 100) * 1.25, 0);
    expect(maxHP(10, SECONDARY_BOOST) - 100).toBeCloseTo((maxHP(10) - 100) * 1.15, 0);
    expect(maxStamina(0, PRIMARY_BOOST)).toBe(maxStamina(0));
    const g = { bonk: 'A' as const, slicey: 'E' as const };
    expect(scalingMult(g, { bonk: 30, slicey: 0 }, false, { bonk: 1.25 }) - 1).toBeCloseTo((scalingMult(g, { bonk: 30, slicey: 0 }, false) - 1) * 1.25, 6);
  });

  it('it reaches the character: the Knight\'s HP and the Scholar\'s Spell Skill', () => {
    const k = newCharacter('knight', 'K', 'k', new Rng(1));
    expect(computeDerived(k).maxHp).toBe(maxHP(k.stats.hp, 1.25));
    expect(statBoosts('knight').endurance).toBe(1.15);
    const s = newCharacter('scholar', 'S', 's', new Rng(1));
    const d = computeDerived(s);
    const plain = spellSkill({ ...d, statBoost: { ...d.statBoost, brain: 1 } }, 'brain');
    expect(spellSkill(d, 'brain')).toBeGreaterThan(plain);
  });

  it('the Knight and the Hunter have their new stats; the Hunter carries a halberd, its bow and whip in the bag (D334)', () => {
    expect(CLASSES.knight.stats).toEqual({ hp: 10, endurance: 10, bonk: 12, slicey: 9, brain: 3, prayer: 4 });
    expect(CLASSES.hunter.stats).toEqual({ hp: 7, endurance: 9, bonk: 10, slicey: 14, brain: 5, prayer: 3 });
    const h = newCharacter('hunter', 'H', 'h', new Rng(1));
    expect(h.equipment.main?.baseId).toBe('halberd');
    expect(h.equipment.off).toBeNull();
    expect(h.bag.map((i) => i.baseId)).toEqual(expect.arrayContaining(['bow', 'whip']));
    expect(h.knownSpells).toEqual([]);
  });
});
