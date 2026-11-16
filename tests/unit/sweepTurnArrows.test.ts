// D423: a sweep's tell shows which way it will turn. The Gear Turret's and Archmagister Tock's corner Laser Sweeps
// turn a full circle, so their old end-of-turn arc ended where it began and said nothing; now chevrons march down
// the leading side of the start beam and a bold curved arrow turns round the pivot, the way the beam will go.
import { describe, expect, it } from 'vitest';
import { drawTurnArrows, fullTurn } from '../../src/render/telegraphs';
import type { Charge, Look } from '../../src/render/telegraphFx';
import type { Shape } from '../../src/game/combat/patterns';
import { ENEMIES } from '../../src/data/enemies';

type Sweep = Extract<Shape, { k: 'sweep' }>;

const LOOK: Look = { kind: 'pierce', main: '#8fd3ff', hot: '#f2fbff', spark: '#c8ecff', deep: '#04202e', accent: '#fff', pattern: null, tile: null };
const CHARGE = { p: 0.5, ph: 0, pulse: 0.5, t: 0.3, step: 0 } as unknown as Charge;

/** Records the vertices drawn and every arc call. */
function recorder(): { ctx: CanvasRenderingContext2D; lines: [number, number][]; arcs: { a1: number; a2: number; ccw: boolean }[] } {
  const lines: [number, number][] = [];
  const arcs: { a1: number; a2: number; ccw: boolean }[] = [];
  const ctx = new Proxy(
    {},
    {
      get(_t, k) {
        if (k === 'moveTo' || k === 'lineTo') return (x: number, y: number) => lines.push([x, y]);
        if (k === 'arc') return (_x: number, _y: number, _r: number, a1: number, a2: number, ccw?: boolean) => arcs.push({ a1, a2, ccw: !!ccw });
        return () => undefined;
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D;
  return { ctx, lines, arcs };
}

const beam = (arc: number): Sweep => ({ k: 'sweep', x: 640, y: 400, a0: 0, arc, half: 0.07, r: 1500, dur: 3, line: true, w: 60, gaps: [200, 400], gapW: 100 });

describe('sweep turn arrows (D423)', () => {
  it('the Gear Turret’s Laser Sweep is a full turn', () => {
    const atk = ENEMIES.gear_turret!.attacks.find((a) => a.id === 'turret_laser_sweep')!;
    expect(atk.pattern?.kind === 'sweep' && atk.pattern.angleDeg).toBe(360);
    expect(fullTurn(beam(Math.PI * 2))).toBe(true);
    expect(fullTurn(beam(Math.PI))).toBe(false);
  });

  for (const dir of [1, -1]) {
    it(`turning ${dir > 0 ? 'clockwise' : 'anticlockwise'}, the arrows sit on and point to the side it turns toward`, () => {
      const { ctx, lines, arcs } = recorder();
      drawTurnArrows(ctx, beam(dir * Math.PI * 2), LOOK, CHARGE, false);
      // the beam starts pointing east (a0 0): it turns toward +y on screen when clockwise, −y when not
      expect(lines.length).toBeGreaterThan(6);
      for (const [, y] of lines) expect(Math.sign(y - 400)).toBe(dir);
      // one bold arc, a quarter turn the same way
      expect(arcs.length).toBeGreaterThan(0);
      for (const a of arcs) {
        expect(a.ccw).toBe(dir < 0);
        expect(a.a2 - a.a1).toBeCloseTo((dir * Math.PI) / 2, 6);
        expect(Math.sign(a.a1)).toBe(dir);
      }
    });
  }

  it('a part turn keeps only the chevrons (its end-of-turn arc already shows the way)', () => {
    const { ctx, lines, arcs } = recorder();
    drawTurnArrows(ctx, beam(Math.PI / 2), LOOK, CHARGE, false);
    expect(lines.length).toBeGreaterThan(6);
    expect(arcs).toHaveLength(0);
  });
});
