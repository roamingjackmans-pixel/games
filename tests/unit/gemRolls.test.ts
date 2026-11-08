// D197: gem quality rolls (−50% … +50%, Green / Blue / Purple / Orange) and gem levels 1–50.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import {
  GEM_QUALITIES, gemDropLevel, gemLevelMult, isValidGem, makeGem, perkName, perkValue, qualityOf, rollGemQuality, untierGem,
} from '../../src/data/gems';
import { randomGem } from '../../src/game/items/generate';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnPlayer, weaponSpec } from '../../src/game/player/player';

describe('gem quality rolls (D197)', () => {
  it('55% Green, 30% Blue, 11% Purple, 4% Orange, always inside −50% … +50%', () => {
    const rng = new Rng('rolls');
    const n = 40000;
    const count: Record<string, number> = { green: 0, blue: 0, purple: 0, orange: 0 };
    for (let i = 0; i < n; i++) {
      const q = rollGemQuality(rng);
      expect(q).toBeGreaterThanOrEqual(-0.5);
      expect(q).toBeLessThanOrEqual(0.5);
      count[qualityOf(q).id]!++;
    }
    expect(count.green! / n).toBeCloseTo(0.55, 1);
    expect(count.blue! / n).toBeCloseTo(0.3, 1);
    expect(count.purple! / n).toBeCloseTo(0.11, 1);
    expect(count.orange! / n).toBeCloseTo(0.04, 1);
    expect(GEM_QUALITIES.map((b) => [b.from, b.to])).toEqual([[-0.5, -0.15], [-0.15, 0.1], [0.1, 0.35], [0.35, 0.5]]);
  });

  it('every perk of a dropped gem has its own roll and the gem level', () => {
    const g = randomGem(new Rng('g'), 2, 'weapon', 33);
    for (const p of g.perks) {
      expect(p.level).toBe(33);
      expect(typeof p.q).toBe('number');
    }
    expect(isValidGem(g)).toBe(true);
    expect(isValidGem({ perks: [{ family: 'brutal', level: 51 }] })).toBe(false);
    expect(isValidGem({ perks: [{ family: 'brutal', q: 0.7 }] })).toBe(false);
  });
});

describe('gem levels (D197)', () => {
  it('level 1 is a quarter of the baseline, level 50 three times it', () => {
    expect(gemLevelMult(1)).toBeCloseTo(0.25, 5);
    expect(gemLevelMult(50)).toBeCloseTo(3, 5);
    // Leech (4% baseline, D284): level 1 runs 0.5% … 1.5% from −50% to +50%; level 50 6% … 18%
    const at = (level: number, q: number): number => perkValue(makeGem('leech', { level, q }).perks[0]!);
    expect(at(1, -0.5)).toBeCloseTo(0.5, 5);
    expect(at(1, 0.5)).toBeCloseTo(1.5, 5);
    expect(at(50, -0.5)).toBeCloseTo(6, 5);
    expect(at(50, 0.5)).toBeCloseTo(18, 5);
  });

  it('gems drop at level 1–3 in the first zone and reach 50 by the start of New Game+3', () => {
    const rng = new Rng('lv');
    const levels = (zone: number, cycle: number): number[] => Array.from({ length: 300 }, () => gemDropLevel(rng, zone, cycle));
    expect(Math.max(...levels(1, 0))).toBeLessThanOrEqual(3);
    expect(Math.min(...levels(1, 0))).toBe(1);
    expect(Math.max(...levels(8, 2))).toBeLessThan(50);
    const ng3 = levels(1, 3);
    expect(Math.max(...ng3)).toBe(50);
    expect(Math.min(...ng3)).toBeGreaterThanOrEqual(46);
    expect(Math.max(...levels(8, 6))).toBe(50);
  });

  it('gems from before levels and tiers keep their old value (the tier goes into the roll) and show as level 14', () => {
    const old = { perks: [{ family: 'brutal', tier: 2 }] };
    untierGem(old);
    const p = (old as { perks: { family: 'brutal'; q?: number }[] }).perks[0]!;
    expect('tier' in p).toBe(false);
    expect(perkValue(p)).toBeCloseTo(8, 1);
    expect(perkName(p)).toBe('Brutal (Lv 14)');
  });

  it('Ember / Rime add their share on top as their own type: the physical stays whole (D283)', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const gem = { perks: [{ family: 'ember' as const, level: 50, q: 0.5 }] };
    c.equipment.main = makeItem('longsword', 'legendary', 1, { gems: [gem, { perks: [{ family: 'rime' as const, level: 50, q: 0.5 }] }] });
    const d = computeDerived(c);
    const add = d.addDmg.reduce((t, x) => t + x.pct, 0);
    expect(add).toBeGreaterThan(1);
    const w = new World('CONV', Room.empty());
    const e = spawnPlayer(w, c, 0, true, 600, 368);
    const spec = weaponSpec(w, e, 1);
    const total = Object.values(spec.dmg).reduce((t, v) => t + (v ?? 0), 0);
    const flat = Object.values(e.pl!.derived.flat).reduce((t, v) => t + (v ?? 0), 0);
    const base = e.pl!.derived.weaponPower * (1 + e.pl!.derived.dmgPct);
    expect(total).toBeCloseTo(base * (1 + add) + flat, 3);
    expect(spec.dmg.physical ?? 0).toBeCloseTo(base + (e.pl!.derived.flat.physical ?? 0), 3);
    expect((spec.dmg.fire ?? 0) - (e.pl!.derived.flat.fire ?? 0)).toBeCloseTo(base * 42 * 3 * 1.5 / 100, 3);
  });
});
