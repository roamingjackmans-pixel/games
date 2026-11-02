// Minimal tween list for UI and camera animation (real time, not simulation time).
export type Ease = (t: number) => number;
export const linear: Ease = (t) => t;
export const easeOut: Ease = (t) => 1 - (1 - t) * (1 - t);
export const easeInOut: Ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface TweenItem {
  t: number;
  dur: number;
  ease: Ease;
  onUpdate: (v: number) => void;
  onDone?: () => void;
}

export class Tweens {
  private items: TweenItem[] = [];

  add(dur: number, onUpdate: (v: number) => void, ease: Ease = easeOut, onDone?: () => void): void {
    const item: TweenItem = { t: 0, dur: Math.max(0.0001, dur), ease, onUpdate };
    if (onDone) item.onDone = onDone;
    this.items.push(item);
    onUpdate(0);
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]!;
      it.t += dt;
      const k = Math.min(1, it.t / it.dur);
      it.onUpdate(it.ease(k));
      if (k >= 1) {
        this.items.splice(i, 1);
        it.onDone?.();
      }
    }
  }

  clear(): void {
    this.items.length = 0;
  }

  get active(): number {
    return this.items.length;
  }
}
