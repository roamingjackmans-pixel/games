// D313: more poise from rings (the Ballast Ring and the Ballasted affix) and the Load-Bearing Wall set perk.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { SET_PERKS } from '../../src/data/setPerks';
import { AFFIXES } from '../../src/data/affixes';
import { RINGS } from '../../src/data/rings';
import { Rng } from '../../src/engine/rng';

describe('poise from rings and a set (D313)', () => {
  it('a Ballast Ring adds 5 / 7 / 10 by rarity, and every one worn counts', () => {
    expect(RINGS.ballast_ring).toBeDefined();
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const base = computeDerived(c).poise;
    c.equipment.ring1 = makeItem('ballast_ring', 'rare', 1);
    expect(computeDerived(c).poise).toBe(base + 5);
    c.equipment.ring2 = makeItem('ballast_ring', 'legendary', 1);
    expect(computeDerived(c).poise).toBe(base + 15);
  });
  it('the Ballasted ring affix adds its roll and never grows with item level', () => {
    expect(AFFIXES.ballasted!.slots).toEqual(['ring']);
    expect(AFFIXES.ballasted!.flat).toBe(false);
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const base = computeDerived(c).poise;
    const ring = makeItem('lucky_charm', 'rare', 40);
    ring.affixes = [{ id: 'ballasted', value: 4 }];
    c.equipment.ring1 = ring;
    expect(computeDerived(c).poise).toBe(base + 4);
  });
  it('Load-Bearing Wall: +5 / +10 / +18 poise at 3 / 5 / 7 pieces', () => {
    expect(SET_PERKS.load_bearing_wall!.steps.map((s) => s.poise)).toEqual([5, 10, 18]);
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const base = computeDerived(c).poise;
    const worn = [c.equipment.main, c.equipment.off, c.equipment.head, c.equipment.body, c.equipment.legs].filter((x) => !!x);
    for (const it of worn.slice(0, 3)) it!.setPerk = 'load_bearing_wall';
    expect(computeDerived(c).poise).toBe(base + 5);
  });
});
