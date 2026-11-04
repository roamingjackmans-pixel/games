// D163: the zone 3 waves and the Citadel's full-turn laser sweeps have two gaps to slip through; items weigh 20% more.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { resolvePattern, shapeHit, inWaveGap, inSweepGap, type Shape, type PatternCtx, ROOM_MIN_X, ROOM_MAX_X, ROOM_MIN_Y, ROOM_MAX_Y, ROOM_CX, ROOM_CY } from '../../src/game/combat/patterns';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { itemWeight, ITEM_WEIGHT_MULT } from '../../src/game/player/equipLoad';
import { WEAPONS } from '../../src/data/weapons';
import type { Item, PatternDef } from '../../src/game/types';

function ctx(seed: string): PatternCtx {
  return { ox: ROOM_CX, oy: ROOM_CY, facing: 0, tx: ROOM_CX + 100, ty: ROOM_CY, players: [{ x: ROOM_CX + 100, y: ROOM_CY }], rng: new Rng(seed), room: null, telegraphS: 1.2 };
}

describe('wave gaps (D163)', () => {
  it('a wave with gaps: 2 has two well-spaced gaps inside the room, and bodies in them are not hit', () => {
    for (const from of ['north', 'south', 'east', 'west'] as const)
      for (let i = 0; i < 20; i++) {
        const p: PatternDef = { kind: 'wave', w: 140, speed: 340, from, gaps: 2 };
        const s = resolvePattern(p, ctx(`w${from}${i}`))[0]!.shapes[0] as Extract<Shape, { k: 'wave' }>;
        expect(s.gaps).toHaveLength(2);
        const horiz = from === 'east' || from === 'west';
        const [lo, hi] = horiz ? [ROOM_MIN_Y, ROOM_MAX_Y] : [ROOM_MIN_X, ROOM_MAX_X];
        const [a, b] = s.gaps!;
        expect(a! - s.gapW! / 2).toBeGreaterThanOrEqual(lo);
        expect(b! + s.gapW! / 2).toBeLessThanOrEqual(hi);
        expect(b! - a!).toBeGreaterThanOrEqual(s.gapW!);
        // at the moment the band crosses the room's middle, a body in a gap is safe and one beside it is hit
        const tau = ((horiz ? ROOM_CX - ROOM_MIN_X : ROOM_CY - ROOM_MIN_Y) + s.w / 2) / s.speed;
        for (const g of s.gaps!) {
          const at = (v: number): [number, number] => (horiz ? [ROOM_CX, v] : [v, ROOM_CY]);
          expect(shapeHit(s, tau, ...at(g), 16, null)).toBe(false);
          expect(inWaveGap(s, ...at(g), 16)).toBe(true);
          expect(shapeHit(s, tau, ...at(g + s.gapW! / 2 + 20), 16, null)).toBe(true);
        }
      }
  });

  it('every zone 3 wave (Tide Caller, the Bloatking) has two gaps', () => {
    const waves: PatternDef[] = [];
    const scan = (p: PatternDef | undefined): void => {
      if (!p) return;
      if (p.kind === 'wave') waves.push(p);
      if (p.kind === 'sequence') for (const st of p.steps) scan(st.pattern);
    };
    for (const e of Object.values(ENEMIES)) for (const a of e.attacks) scan(a.pattern);
    for (const b of Object.values(BOSSES)) for (const ph of b.phases) for (const a of ph.attacks) scan(a.pattern);
    expect(waves.length).toBeGreaterThanOrEqual(4);
    for (const w of waves) expect(w.kind === 'wave' && w.gaps).toBe(2);
  });
});

describe('sweep gaps (D163)', () => {
  it('a full-turn laser sweep with gaps leaves two safe rings it passes over', () => {
    for (let i = 0; i < 20; i++) {
      const p: PatternDef = { kind: 'sweep', angleDeg: 360, r: 'room', durationS: 3, anchor: 'self', tickS: 0.25, w: 30, beamLine: true, gaps: 2 };
      const s = resolvePattern(p, ctx(`s${i}`))[0]!.shapes[0] as Extract<Shape, { k: 'sweep' }>;
      expect(s.gaps).toHaveLength(2);
      for (const g of s.gaps!) {
        // a body on the beam's start line at the gap's distance is not hit; just outside the gap it is
        const at = (d: number): [number, number] => [s.x + Math.cos(s.a0) * d, s.y + Math.sin(s.a0) * d];
        expect(inSweepGap(s, ...at(g), 16)).toBe(true);
        expect(shapeHit(s, 0, ...at(g), 16, null)).toBe(false);
        expect(shapeHit(s, 0, ...at(g + s.gapW! / 2 + 20), 16, null)).toBe(true);
      }
    }
  });

  it('the Citadel turret and Tock laser sweeps have two gaps', () => {
    const ids: string[] = [];
    for (const e of Object.values(ENEMIES)) for (const a of e.attacks) if (a.pattern?.kind === 'sweep' && a.pattern.angleDeg >= 360 && a.pattern.r === 'room') ids.push(`${a.id}:${a.pattern.gaps}`);
    for (const b of Object.values(BOSSES)) for (const ph of b.phases) for (const a of ph.attacks) if (a.pattern?.kind === 'sweep' && a.pattern.angleDeg >= 360 && a.pattern.r === 'room') ids.push(`${a.id}:${a.pattern.gaps}`);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) expect(id).toMatch(/:2$/);
  });
});

describe('item weight (D163)', () => {
  it('every item weighs 20% more than its table says', () => {
    expect(ITEM_WEIGHT_MULT).toBe(1.2);
    const w = WEAPONS['longsword'] ?? Object.values(WEAPONS)[0]!;
    const item = { kind: 'weapon', baseId: w.id } as unknown as Item;
    expect(itemWeight(item)).toBeCloseTo(Math.round(w.weight * 1.2 * 10) / 10, 5);
  });
});
