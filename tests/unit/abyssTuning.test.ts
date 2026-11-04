// D172: zone 8's red and blue attacks cover less of the room.
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/data/enemies';
import { THE_LANDLORD } from '../../src/data/bosses/abyss';
import { Rng } from '../../src/engine/rng';
import { placePockets, resolvePattern, ROOM_CX, ROOM_CY, type PatternCtx } from '../../src/game/combat/patterns';
import type { PatternDef } from '../../src/game/types';

const ctx = (seed: string): PatternCtx => ({ ox: ROOM_CX, oy: ROOM_CY, facing: 0, tx: ROOM_CX + 100, ty: ROOM_CY, players: [{ x: ROOM_CX + 100, y: ROOM_CY }], rng: new Rng(seed), room: null, telegraphS: 1.2 });
const atk = (enemy: string, id: string) => ENEMIES[enemy]!.attacks.find((a) => a.id === id)!;

describe('zone 8 tuning (D172)', () => {
  it('the Eye of the Deep beams 450 px and no longer blinks away', () => {
    const eye = ENEMIES.eye_of_the_deep!;
    expect(eye.traits?.blinkWhenApproached).toBeUndefined();
    const beam = atk('eye_of_the_deep', 'gaze_beam');
    expect(beam.pattern?.kind === 'beam' && beam.pattern.l).toBe(450);
    expect(beam.range[1]).toBeLessThanOrEqual(450);
  });

  it("the Abyssal Knight's Void Cleave reaches 70% as far", () => {
    const cleave = atk('abyssal_knight', 'void_cleave');
    const p = cleave.pattern!;
    if (p.kind !== 'line') throw new Error('Void Cleave is a line');
    const { lMult: _drop, ...whole } = p;
    const full = resolvePattern(whole, ctx('k'))[0]!.shapes[0]!;
    const short = resolvePattern(cleave.pattern!, ctx('k'))[0]!.shapes[0]!;
    expect(full.k === 'line' && short.k === 'line' && short.l / full.l).toBeCloseTo(0.7, 5);
    expect(cleave.range[1]).toBe(490);
  });

  it('safe-spot attacks have two more pockets, spread apart', () => {
    const pockets = (p: PatternDef | undefined): number => (p?.kind === 'pockets' ? p.n : -1);
    expect(pockets(atk('landlords_clerk', 'audit')?.pattern)).toBe(4);
    expect(pockets(atk('star_eater', 'supernova')?.pattern)).toBe(5);
    const boss = THE_LANDLORD!.phases.map((ph) => ph.attacks.filter((a) => a.pattern?.kind === 'pockets').map((a) => pockets(a.pattern)));
    expect(boss).toEqual([[5], [4, 4], [3]]);
    // the extra pockets are spread: no two closer than their own diameter in these rolls
    for (let s = 0; s < 30; s++) {
      const ps = placePockets(5, 100, ctx(`p${s}`));
      let near = Infinity;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) near = Math.min(near, Math.hypot(ps[i]!.x - ps[j]!.x, ps[i]!.y - ps[j]!.y));
      expect(near).toBeGreaterThan(150);
    }
  });
});
