import { describe, expect, it } from 'vitest';
import { HostClock } from '../../src/game/net/clock';
import { Rng } from '../../src/engine/rng';

// D149: the guest's smoothed host clock. With snapshots at 30 Hz over a link with 60 ms latency and up to ±25 ms
// of jitter, the drawn time must move forward smoothly (no jumps back) and nearly always fall between two snapshots
// that have already arrived, so nothing has to be guessed.
describe('guest host clock (D149)', () => {
  function run(jitterMs: number): { backSteps: number; maxStepErr: number; covered: number; delay: number } {
    const rng = new Rng(7);
    const clock = new HostClock(1 / 30);
    const arrivals: { host: number; at: number }[] = [];
    for (let i = 0; i < 30 * 20; i++) {
      const host = 100 + i / 30;
      arrivals.push({ host, at: host + 0.06 + (rng.next() * 2 - 1) * (jitterMs / 1000) + 5 });
    }
    arrivals.sort((a, b) => a.at - b.at);
    let k = 0;
    let lastRender = -Infinity;
    let backSteps = 0;
    let maxStepErr = 0;
    let covered = 0;
    let frames = 0;
    let delay = 0;
    const dt = 1 / 60;
    let newest = -Infinity;
    for (let t = arrivals[0]!.at; t < arrivals[arrivals.length - 1]!.at; t += dt) {
      while (k < arrivals.length && arrivals[k]!.at <= t) {
        clock.sample(arrivals[k]!.host, arrivals[k]!.at);
        newest = Math.max(newest, arrivals[k]!.host);
        k++;
      }
      delay = clock.delay(dt);
      const render = clock.now(t) - delay;
      if (t > arrivals[0]!.at + 3) {
        frames++;
        if (render < lastRender) backSteps++;
        maxStepErr = Math.max(maxStepErr, Math.abs(render - lastRender - dt));
        if (render <= newest) covered++;
      }
      lastRender = render;
    }
    return { backSteps, maxStepErr, covered: covered / frames, delay };
  }
  it('a jittery link: the drawn time never steps back and the snapshots around it have arrived', () => {
    const r = run(25);
    expect(r.backSteps).toBe(0);
    expect(r.maxStepErr).toBeLessThan(0.0025); // under a sixth of a 60 fps frame
    expect(r.covered).toBeGreaterThan(0.98);
    expect(r.delay).toBeLessThan(0.2);
  });
  it('a steady link draws closer to now than a jittery one', () => {
    expect(run(2).delay).toBeLessThan(run(25).delay);
    expect(run(2).delay).toBeGreaterThanOrEqual(0.05);
  });
});
