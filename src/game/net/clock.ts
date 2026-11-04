// The guest's view of the host's clock (D149). Snapshots arrive with network jitter; taking each one's time as "now"
// (as the guest used to) made the whole mirror jump forward and back 20 times a second. This keeps a smooth offset
// instead: it follows the fastest-arriving snapshots quickly (the network got quicker) and the slow ones only
// gently (they are mostly jitter), measures that jitter, and picks how far behind the newest snapshot to draw so
// the two snapshots around the drawn time have almost always arrived.

const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export class HostClock {
  /** host time − local time, null until the first snapshot */
  private offset: number | null = null;
  /** average size of a snapshot's lateness against the smooth clock, seconds */
  jitter = 0.01;
  /** the delay actually used, eased toward the target so the picture never jumps */
  private delayS: number;

  constructor(
    private readonly snapInterval: number,
    readonly minDelay = 0.06,
    readonly maxDelay = 0.25,
  ) {
    this.delayS = clamp(snapInterval * 2, minDelay, maxDelay);
  }

  /** A snapshot stamped `hostT` arrived at local time `localT`. */
  sample(hostT: number, localT: number): void {
    const o = hostT - localT;
    if (this.offset === null || Math.abs(o - this.offset) > 1) {
      // first contact, or the host's clock jumped (a new world): start over
      this.offset = o;
      this.jitter = 0.01;
      return;
    }
    const d = o - this.offset;
    this.jitter += (Math.abs(d) - this.jitter) * 0.08;
    // ease in either way, never more than 2 ms per snapshot, so the drawn time keeps an even pace
    this.offset += Math.max(-0.002, Math.min(0.002, d > 0 ? d * 0.5 : d * 0.02));
  }

  /** Reset (a fresh welcome). */
  reset(hostT: number, localT: number): void {
    this.offset = hostT - localT;
    this.jitter = 0.01;
  }

  /** The host's time now, as best known. */
  now(localT: number): number {
    return localT + (this.offset ?? 0);
  }

  /** How far behind the newest snapshot to draw: a snapshot and a half plus room for the measured jitter. */
  targetDelay(): number {
    return clamp(this.snapInterval * 1.5 + this.jitter * 2.5, this.minDelay, this.maxDelay);
  }

  /** Ease the drawing delay toward its target (call once a frame) and return it. */
  delay(dt: number): number {
    this.delayS += (this.targetDelay() - this.delayS) * Math.min(1, dt * 1.5);
    return this.delayS;
  }
}
