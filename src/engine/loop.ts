// Fixed-step simulation (1/60 s) with render interpolation (alpha = leftover / step).
export const STEP = 1 / 60;

export interface LoopHooks {
  /** called once per animation frame before updates (input polling) */
  frame?(now: number, realDt: number): void;
  update(dt: number): void;
  render(alpha: number, realDt: number): void;
}

/**
 * Call fn about every 16 ms, from a tiny inline worker when one can be made (its timer keeps running in a hidden tab,
 * D155), else from setInterval. Returns a stop function.
 */
function startTicker(fn: () => void): () => void {
  try {
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') throw new Error('no worker');
    const src = 'var t=setInterval(function(){postMessage(0)},16);onmessage=function(){clearInterval(t);close()};';
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const w = new Worker(url);
    w.onmessage = () => fn();
    return () => {
      w.postMessage('stop');
      w.terminate();
      URL.revokeObjectURL(url);
    };
  } catch {
    const id = setInterval(fn, 16);
    return () => clearInterval(id);
  }
}

export class Loop {
  private acc = 0;
  private last = 0;
  private running = false;
  private raf = 0;
  /** optional frame cap in fps (0 = uncapped, browser vsync) */
  frameCap = 0;
  private lastRender = 0;
  private lastFrameAt = 0;
  private watchdogStop: (() => void) | null = null;
  /** timings for the debug frame graph (ms) */
  simMs = 0;
  renderMs = 0;
  fps = 60;
  private fpsAcc = 0;
  private fpsFrames = 0;
  readonly frameTimes = new Float32Array(120);
  private frameIdx = 0;

  constructor(private hooks: LoopHooks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    // Hidden tabs get no animation frames; a co-op host must keep simulating, so a timer takes over. Chrome also
    // slows a hidden page's own timers (to about once a second, minimised or covered windows too), which made a
    // hidden host crawl and its guests rubber-band on the spot (D155); a worker's timer is not held back that way,
    // so it does the waking where workers exist.
    this.watchdogStop = startTicker(() => {
      const now = performance.now();
      if (this.running && now - this.lastFrameAt > 100) step(now, false);
    });
    const tick = (now: number): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      step(now, true);
    };
    const step = (now: number, fromRaf: boolean): void => {
      if (fromRaf) this.lastFrameAt = now;
      if (this.frameCap > 0 && now - this.lastRender < 1000 / this.frameCap - 1) return;
      this.lastRender = now;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.25) dt = 0.25; // tab switch: do not spiral
      if (dt < 0) dt = 0;
      this.hooks.frame?.(now, dt);
      this.acc += dt;
      const t0 = performance.now();
      let steps = 0;
      while (this.acc >= STEP && steps < 8) {
        this.hooks.update(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (steps >= 8) this.acc = 0;
      const t1 = performance.now();
      this.hooks.render(this.acc / STEP, dt);
      const t2 = performance.now();
      this.simMs = this.simMs * 0.9 + (t1 - t0) * 0.1;
      this.renderMs = this.renderMs * 0.9 + (t2 - t1) * 0.1;
      this.frameTimes[this.frameIdx] = dt * 1000;
      this.frameIdx = (this.frameIdx + 1) % this.frameTimes.length;
      this.fpsAcc += dt;
      this.fpsFrames++;
      if (this.fpsAcc >= 0.5) {
        this.fps = this.fpsFrames / this.fpsAcc;
        this.fpsAcc = 0;
        this.fpsFrames = 0;
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Run `seconds` of simulation synchronously, then render once (dev playtests in a hidden pane, tests). */
  advance(seconds: number): void {
    const n = Math.max(1, Math.round(seconds / STEP));
    for (let i = 0; i < n; i++) {
      this.hooks.frame?.(performance.now(), STEP);
      this.hooks.update(STEP);
    }
    this.hooks.render(0, STEP);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.watchdogStop?.();
    this.watchdogStop = null;
  }

  get frameIndex(): number {
    return this.frameIdx;
  }
}
