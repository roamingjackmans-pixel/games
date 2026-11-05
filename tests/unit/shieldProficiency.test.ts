// D215: shields train a proficiency class by size; small widens the parry, great and medium cut block stamina.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { grantKillXp, hasRarityBar, itemsOut, profClassOf, upgradeInfo } from '../../src/game/items/proficiency';
import { PROF_MAX_LEVEL, profLevelCost } from '../../src/data/proficiency';
import { Rng } from '../../src/engine/rng';

const xpTo = (level: number): number => Array.from({ length: level }, (_, i) => profLevelCost(i + 1)).reduce((a, b) => a + b, 0);
const maxXp = xpTo(50);

describe('shield proficiency (D215)', () => {
  it('a shield in the off hand trains its size class on kills; no rarity bar of its own', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.twoHanded = false;
    expect(profClassOf(c.equipment.off)).toBe('shield_medium');
    expect(profClassOf(makeItem('buckler', 'common', 1))).toBe('shield_small');
    expect(profClassOf(makeItem('tower_greatshield', 'common', 1))).toBe('shield_great');
    expect(itemsOut(c)).toContain(c.equipment.off);
    grantKillXp(c, 10);
    expect(c.proficiency?.shield_medium).toBe(10);
    expect(c.equipment.off!.xp ?? 0).toBe(0);
    expect(hasRarityBar(c.equipment.off)).toBe(false);
    expect(upgradeInfo(c.equipment.off!)).toBeNull();
    // two-handing sets the shield aside: it trains nothing
    c.twoHanded = true;
    grantKillXp(c, 10);
    expect(c.proficiency?.shield_medium).toBe(10);
  });

  it('level 50: small +75 ms parry, great −30% block stamina and +10% elemental block', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.twoHanded = false;
    c.equipment.off = makeItem('buckler', 'common', 1);
    const base = computeDerived(c);
    c.proficiency = { shield_small: maxXp };
    const small = computeDerived(c);
    expect(small.parryBonusS - base.parryBonusS).toBeCloseTo(0.075, 6);
    expect(small.stabilityMult).toBeCloseTo(base.stabilityMult - 0.15, 6);

    c.equipment.off = makeItem('tower_greatshield', 'common', 1);
    c.proficiency = {};
    const g0 = computeDerived(c);
    c.proficiency = { shield_great: maxXp };
    const g50 = computeDerived(c);
    expect(g50.stabilityMult).toBeCloseTo(g0.stabilityMult - 0.3, 6);
    expect(g50.shieldVals.elemental).toBeCloseTo(Math.min(0.85, g0.shieldVals.elemental + 0.1), 6);
    // level 100 (D218): twice the level-50 numbers
    expect(PROF_MAX_LEVEL).toBe(100);
    c.proficiency = { shield_great: xpTo(PROF_MAX_LEVEL) };
    expect(computeDerived(c).stabilityMult).toBeCloseTo(g0.stabilityMult - 0.6, 6);
    // a great-shield class does nothing while a small shield is out
    c.equipment.off = makeItem('buckler', 'common', 1);
    expect(computeDerived(c).stabilityMult).toBeCloseTo(base.stabilityMult, 6);
  });
});
