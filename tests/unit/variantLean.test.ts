// D456: a class's Brain or Prayer gets a second chance at the variants that bring it.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { CLASSES, secondaryStats } from '../../src/data/classes';
import { VARIANT_CHANCE } from '../../src/data/weaponVariants';
import { FAVOR_PRIMARY, FAVOR_SECONDARY, generateItem, leanVariants, type DropFavor } from '../../src/game/items/generate';
import type { ClassId } from '../../src/game/types';

const favorOf = (id: ClassId): DropFavor => ({ primary: CLASSES[id].primary, secondary: secondaryStats(id) });

/** Share of `n` dropped weapons of `baseId` that roll a variant, and how often each variant comes up. */
function roll(baseId: string, favor: DropFavor | undefined, n = 8000): { rate: number; by: Record<string, number> } {
  const by: Record<string, number> = {};
  let v = 0;
  for (let i = 0; i < n; i++) {
    const it = generateItem(new Rng(`lean${i}`), { source: 'elite', ilvl: 4, zone: 4, slot: 'weapon', baseId, ...(favor ? { favor } : {}) });
    if (it.variant) {
      v++;
      by[it.variant] = (by[it.variant] ?? 0) + 1;
    }
  }
  return { rate: v / n, by };
}

describe('variants lean to a Brain or Prayer class (D456)', () => {
  it('the chance: ×2.2 for the primary stat, ×1.6 for a secondary, unchanged otherwise', () => {
    expect(leanVariants('katana', favorOf('scholar')).chance).toBeCloseTo(VARIANT_CHANCE * FAVOR_PRIMARY, 9);
    expect(leanVariants('katana', favorOf('scholar')).suits.map((v) => v.id)).toEqual(['arcane']);
    expect(leanVariants('katana', favorOf('cleric')).suits.map((v) => v.id)).toEqual(['blessed']);
    expect(leanVariants('katana', favorOf('spearman')).chance).toBeCloseTo(VARIANT_CHANCE * FAVOR_SECONDARY, 9);
    expect(leanVariants('katana', favorOf('nobody')).chance).toBeCloseTo(VARIANT_CHANCE * FAVOR_SECONDARY, 9);
    expect(leanVariants('katana', favorOf('brute')).chance).toBe(VARIANT_CHANCE);
    expect(leanVariants('katana', favorOf('knight')).suits).toEqual([]);
    expect(leanVariants('katana', undefined).chance).toBe(VARIANT_CHANCE);
  });

  it('only variants that bring the stat count: a type that already has it, or has none, is unchanged', () => {
    expect(leanVariants('hollow_maul', favorOf('scholar')).chance).toBe(VARIANT_CHANCE); // Bonk + Brain already
    expect(leanVariants('rune_kris', favorOf('scholar')).chance).toBe(VARIANT_CHANCE); // its variant trades Brain away
    expect(leanVariants('rune_kris', favorOf('cleric')).chance).toBeCloseTo(VARIANT_CHANCE * FAVOR_PRIMARY, 9); // Blessed
    expect(leanVariants('club', favorOf('scholar')).chance).toBe(VARIANT_CHANCE); // Keen only
    expect(leanVariants('whip', favorOf('scholar')).chance).toBe(VARIANT_CHANCE); // no variants
  });

  it('a Scholar finds an Arcane Katana far more often; the extra rolls are all Arcane', () => {
    const plain = roll('katana', undefined);
    const sch = roll('katana', favorOf('scholar'));
    expect(plain.rate).toBeGreaterThan(VARIANT_CHANCE - 0.03);
    expect(plain.rate).toBeLessThan(VARIANT_CHANCE + 0.03);
    expect(sch.rate).toBeGreaterThan(VARIANT_CHANCE * FAVOR_PRIMARY - 0.03);
    expect(sch.rate).toBeLessThan(VARIANT_CHANCE * FAVOR_PRIMARY + 0.03);
    // Balanced and Blessed come only from the usual 35% roll, so they are no more common than before
    const n = 8000;
    expect((sch.by.balanced ?? 0) + (sch.by.blessed ?? 0)).toBeLessThan(0.35 * n * 0.6);
    expect(sch.by.arcane ?? 0).toBeGreaterThan(0.5 * n);
  });

  it('a Battlemage (Brain second) gets 56%; a Brute 35%, the same as no class', () => {
    expect(roll('katana', favorOf('spearman')).rate).toBeCloseTo(VARIANT_CHANCE * FAVOR_SECONDARY, 1);
    const brute = roll('katana', favorOf('brute')).rate;
    expect(brute).toBeGreaterThan(VARIANT_CHANCE - 0.03);
    expect(brute).toBeLessThan(VARIANT_CHANCE + 0.03);
  });

  it('the same weapon rolls the same variant every time (its own stream)', () => {
    const a = generateItem(new Rng('same'), { source: 'boss', ilvl: 6, zone: 6, slot: 'weapon', baseId: 'longsword', favor: favorOf('occultist') });
    const b = generateItem(new Rng('same'), { source: 'boss', ilvl: 6, zone: 6, slot: 'weapon', baseId: 'longsword', favor: favorOf('occultist') });
    expect(a.variant).toBe(b.variant);
  });
});
