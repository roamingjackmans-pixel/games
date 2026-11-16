// D414: a status gem (Ember, Rime, Storm) builds its status 40% slower, then ×1.5 in a Medium weapon and ×2 in a Slow
// one; its info (loose, or in a weapon's card) and a status affix's show the buildup as a number.
import { describe, expect, it } from 'vitest';
import { GEM_BUILDUP_MULT, gemBuildup, makeGem, perkText } from '../../src/data/gems';
import { affixBuildup, affixText } from '../../src/data/affixes';
import { makeItem } from '../../src/game/items/make';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { Rng } from '../../src/engine/rng';
import { speedMultIn } from '../../src/ui/tooltip';

const emberIn = (baseId: string): number => {
  const c = newCharacter('knight', 'Joe', 'p-gem', new Rng('GEMBUILD'));
  c.equipment.main = makeItem(baseId, 'rare', 1, { sockets: 1, gems: [makeGem('ember', { level: 10, q: 0 })] });
  c.equipment.off = null;
  // enough of every stat to wield any of them (gear you cannot wield gives no gem perks, D88)
  for (const k of Object.keys(c.stats) as (keyof typeof c.stats)[]) c.stats[k] = 60;
  return computeDerived(c).statusBuild.filter((s) => s.id === 'burn').reduce((a, s) => a + s.buildup, 0);
};

describe('gem status buildup (D414)', () => {
  it('is 40% slower than the old 22, then ×1 Fast, ×1.5 Medium, ×2 Slow', () => {
    const p = makeGem('ember', { q: 0 }).perks[0]!;
    expect(GEM_BUILDUP_MULT).toBe(0.6);
    expect(gemBuildup(p)).toBe(13);
    expect(gemBuildup(p, 1.5)).toBe(20);
    expect(gemBuildup(p, 2)).toBe(26);
    // the roll still counts: a +50% Orange is half as much again
    expect(gemBuildup(makeGem('ember', { q: 0.5 }).perks[0]!)).toBe(20);
  });

  it('a character hitting with the gem gets the amount for that weapon’s speed', () => {
    expect(speedMultIn(makeItem('rapier', 'rare'))).toBe(1);
    expect(speedMultIn(makeItem('longsword', 'rare'))).toBe(1.5);
    expect(speedMultIn(makeItem('greataxe', 'rare'))).toBe(2);
    expect(emberIn('rapier')).toBe(13);
    expect(emberIn('longsword')).toBe(20);
    expect(emberIn('greataxe')).toBe(26);
  });

  it('the info shows the buildup number, loose and socketed', () => {
    const p = makeGem('rime', { q: 0 }).perks[0]!;
    expect(perkText(p)).toMatch(/Chill buildup 13$/);
    expect(perkText(p, speedMultIn(makeItem('greataxe', 'rare')))).toMatch(/Chill buildup 26$/);
    // a gem that adds no status says nothing of buildup
    expect(perkText(makeGem('dawn', { q: 0 }).perks[0]!)).not.toMatch(/buildup/);
  });

  it('a status affix on a weapon shows its buildup number too', () => {
    expect(affixText('burning', 8, 1, 1)).toBe(`+8 fire damage, Burn buildup ${affixBuildup('burning', 8, 1)}`);
    // without the item level (lists that only name the affix) it reads as before
    expect(affixText('burning', 8)).toBe('+8 fire damage, Burn buildup');
  });
});

describe('set perks raise gem buildup too (D415)', () => {
  it('one piece of Late Fees (+15% status buildup, D419) raise a gem’s Burn as they raise an affix’s', () => {
    const c = newCharacter('knight', 'Joe', 'p-gem', new Rng('GEMBUILD'));
    for (const k of Object.keys(c.stats) as (keyof typeof c.stats)[]) c.stats[k] = 60;
    c.equipment.main = makeItem('greataxe', 'rare', 1, { sockets: 1, gems: [makeGem('ember', { level: 10, q: 0 })] });
    c.equipment.off = null;
    const burn = (): number => computeDerived(c).statusBuild.filter((s) => s.id === 'burn').reduce((a, s) => a + s.buildup, 0);
    expect(burn()).toBe(26);
    c.equipment.ring1 = makeItem('lucky_charm', 'rare', 3);
    c.equipment.ring1.setPerk = 'late_fees';
    expect(burn()).toBeCloseTo(26 * 1.15, 6);
  });
});
