// Scene manager: one active scene receives update/render; scenes own their DOM overlays.
export interface Scene {
  readonly name: string;
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D, alpha: number, realDt: number): void;
}

export class SceneManager {
  current: Scene | null = null;
  private pending: Scene | null = null;

  /** Switch at the start of the next update so a scene never exits mid-update. */
  go(scene: Scene): void {
    this.pending = scene;
  }

  /** Switch immediately (boot). */
  set(scene: Scene): void {
    this.current?.exit?.();
    this.current = scene;
    scene.enter?.();
  }

  update(dt: number): void {
    if (this.pending) {
      const p = this.pending;
      this.pending = null;
      this.set(p);
    }
    this.current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, realDt: number): void {
    this.current?.render(ctx, alpha, realDt);
  }
}
