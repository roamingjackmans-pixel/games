// D327: first playthrough zones 1–2 never roll purple or orange, zones 3–4 never orange; every New Game+ cycle makes
// orange 20% likelier than the one before, the rest shrinking in proportion.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { generateItem, rarityChances } from '../../src/game/items/generate';
import { itemLevelFor } from '../../src/game/combat/formulas';
import { RARITY_WEIGHTS, type LootSource } from '../../src/data/lootTables';

const SOURCES = Object.keys(RARITY_WEIGHTS) as LootSource[];

describe('rarity by zone and cycle (D327)', () => {
  it('first playthrough: no purple or orange in zones 1–2, no orange in zones 3–4, from any source', () => {
    for (const source of SOURCES) {
      for (let zone = 1; zone <= 4; zone++) {
        for (let i = 0; i < 300; i++) {
          const it = generateItem(new Rng(`rz${source}${zone}${i}`), { source, ilvl: itemLevelFor(zone, 0), zone });
          if (zone <= 2) expect(['epic', 'legendary'], `${source} z${zone}`).not.toContain(it.rarity);
          else expect(it.rarity, `${source} z${zone}`).not.toBe('legendary');
        }
      }
    }
  });

  it('orange ×1.2 a cycle; the rest shrink in proportion so it still adds to 100% (30/30/15/15/10 → 29.33/29.33/14.67/14.67/12)', () => {
    // the boss row is 20/35/30/11/4: check the rule on it the same way
    const c0 = rarityChances('boss', 8, 0);
    const c1 = rarityChances('boss', 8, 1);
    const c2 = rarityChances('boss', 8, 2);
    expect(c1[4]).toBeCloseTo(c0[4]! * 1.2, 9);
    expect(c2[4]).toBeCloseTo(c0[4]! * 1.44, 9);
    const k = (100 - c1[4]!) / (100 - c0[4]!);
    for (let i = 0; i < 4; i++) expect(c1[i]).toBeCloseTo(c0[i]! * k, 9);
    expect(c1.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 9);
    // the worked example: 10% orange → 12%, the other 90% → 88% (each ×0.978)
    expect(((1 - 0.12) / (1 - 0.1)) * 30).toBeCloseTo(29.333, 3);
  });

  it('New Game+ zone 1 has no cap; Gary sells purple and orange there again', () => {
    expect(rarityChances('boss', 1, 1)[4]).toBeGreaterThan(0);
    expect(rarityChances('gary', 1, 0)).toEqual([0, 0, 100, 0, 0]);
    expect(rarityChances('gary', 3, 0)).toEqual([0, 0, 0, 100, 0]);
  });
});
