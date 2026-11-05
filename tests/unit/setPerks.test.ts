// D243: set perks. 3, 5 and 7 worn pieces with the same one give a small, medium and large playstyle bonus.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { SET_PERKS, SET_PERK_CHANCE, setEffectText, setStep } from '../../src/data/setPerks';
import { generateItem } from '../../src/game/items/generate';
import { makeItem } from '../../src/game/items/make';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import type { Character } from '../../src/game/types';

/** A knight with `n` of its worn slots carrying `set`. */
function wearing(set: string, n: number): Character {
  const c = newCharacter('knight', 'Joe', 'p', new Rng('SET'));
  c.stats = { hp: 40, endurance: 40, bonk: 40, slicey: 40, brain: 40, prayer: 40 };
  for (const r of ['ring1', 'ring2', 'ring3', 'ring4'] as const) c.equipment[r] = makeItem('lucky_charm', 'rare', 3);
  const slots = [c.equipment.main, c.equipment.off, c.equipment.head, c.equipment.body, c.equipment.legs, c.equipment.ring1, c.equipment.ring2, c.equipment.ring3, c.equipment.ring4];
  slots.forEach((it, i) => {
    if (!it) return;
    if (i < n) it.setPerk = set;
    else delete it.setPerk;
  });
  return c;
}

describe('set perks (D243)', () => {
  it('a bunch of them, each with three growing steps and text', () => {
    expect(Object.keys(SET_PERKS).length).toBeGreaterThanOrEqual(8);
    for (const s of Object.values(SET_PERKS)) for (const e of s.steps) expect(setEffectText(e).length, s.id).toBeGreaterThan(0);
  });

  it('steps at 3, 5 and 7', () => {
    expect([0, 2, 3, 4, 5, 6, 7, 9].map(setStep)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('two pieces give nothing; 3, 5 and 7 give the small, medium and large step (not added together)', () => {
    const base = computeDerived(wearing('eviction', 0)).dmgPct;
    expect(computeDerived(wearing('eviction', 2)).dmgPct).toBeCloseTo(base, 6);
    expect(computeDerived(wearing('eviction', 3)).dmgPct).toBeCloseTo(base + 0.06, 6);
    expect(computeDerived(wearing('eviction', 5)).dmgPct).toBeCloseTo(base + 0.12, 6);
    expect(computeDerived(wearing('eviction', 7)).dmgPct).toBeCloseTo(base + 0.2, 6);
    expect(computeDerived(wearing('eviction', 7)).setCounts.eviction).toBe(7);
  });

  it('rings count, and other playstyles move their own numbers', () => {
    const flit = computeDerived(wearing('moonlight_flit', 7));
    const none = computeDerived(wearing('moonlight_flit', 0));
    expect(flit.dodgeRecharge).toBeLessThan(none.dodgeRecharge);
    expect(computeDerived(wearing('squatters_rights', 5)).maxHp).toBeGreaterThan(none.maxHp);
    expect(computeDerived(wearing('counteroffer', 7)).parryBonusS).toBeCloseTo(none.parryBonusS + 0.1, 6);
    expect(computeDerived(wearing('fine_print', 3)).spellPowerPct).toBeCloseTo(none.spellPowerPct + 0.06, 6);
  });

  it('new drops roll them by rarity, never on Commons, from their own stream', () => {
    let rare = 0;
    let common = 0;
    for (let i = 0; i < 2000; i++) {
      const it = generateItem(new Rng(`drop${i}`), { source: 'elite', ilvl: 4, zone: 4 });
      if (it.rarity === 'common' && it.setPerk) common++;
      if (it.rarity === 'rare') rare += it.setPerk ? 1 : 0;
      if (it.setPerk) expect(SET_PERKS[it.setPerk]).toBeDefined();
    }
    expect(common).toBe(0);
    expect(rare).toBeGreaterThan(0);
    expect(SET_PERK_CHANCE.legendary).toBeGreaterThan(SET_PERK_CHANCE.rare);
  });
});

describe('set perk drop rates (D245)', () => {
  it('are 35% below the first ones', () => {
    expect(SET_PERK_CHANCE.uncommon).toBeCloseTo(0.078, 6);
    expect(SET_PERK_CHANCE.rare).toBeCloseTo(0.143, 6);
    expect(SET_PERK_CHANCE.epic).toBeCloseTo(0.208, 6);
    expect(SET_PERK_CHANCE.legendary).toBeCloseTo(0.2925, 6);
  });
});
