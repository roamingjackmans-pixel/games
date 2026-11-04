// Canvas at a logical 1280 × 720, letterboxed to the window, drawn at devicePixelRatio × resolution scale.
export const VIEW_W = 1280;
export const VIEW_H = 720;

export class GameCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly overlay: HTMLElement;
  /** CSS pixels per logical pixel */
  cssScale = 1;
  /** device pixels per logical pixel */
  pixelScale = 1;
  resolutionScale = 1;
  /**
   * At most this many device pixels per logical pixel (D153): a laptop at 200% display scaling used to draw
   * 2880×1620 (4.7 million pixels, five times a 1280×720 canvas) every frame, more than integrated graphics can
   * fill in a busy fight. 1.5 keeps it at 1920×1080 or less; the room art is built at 1280×704 anyway. Infinity
   * (Settings → Video → Full sharpness) draws at the screen's own density.
   */
  maxPixelScale = 1.5;
  private offsetX = 0;
  private offsetY = 0;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.canvas = canvas;
    this.overlay = overlay;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    window.addEventListener('resize', () => this.fit());
    document.addEventListener('fullscreenchange', () => this.fit());
    // a tab opened in the background has no size yet; fit again when it is first shown
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.fit();
    });
    this.fit();
  }

  fit(): void {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    this.cssScale = Math.min(ww / VIEW_W, wh / VIEW_H);
    const cssW = Math.floor(VIEW_W * this.cssScale);
    const cssH = Math.floor(VIEW_H * this.cssScale);
    this.offsetX = Math.floor((ww - cssW) / 2);
    this.offsetY = Math.floor((wh - cssH) / 2);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.pixelScale = Math.min(this.cssScale * dpr, this.maxPixelScale) * this.resolutionScale;
    this.canvas.width = Math.max(1, Math.round(VIEW_W * this.pixelScale));
    this.canvas.height = Math.max(1, Math.round(VIEW_H * this.pixelScale));
    for (const el of [this.canvas, this.overlay]) {
      el.style.position = 'absolute';
      el.style.left = `${this.offsetX}px`;
      el.style.top = `${this.offsetY}px`;
      el.style.width = `${cssW}px`;
      el.style.height = `${cssH}px`;
    }
    // overlay content is authored at logical size and scaled with a transform
    const inner = this.overlay.firstElementChild as HTMLElement | null;
    if (inner) this.applyOverlayScale(inner);
    this.ctx.imageSmoothingEnabled = true;
  }

  applyOverlayScale(inner: HTMLElement): void {
    inner.style.width = `${VIEW_W}px`;
    inner.style.height = `${VIEW_H}px`;
    inner.style.transformOrigin = '0 0';
    inner.style.transform = `scale(${this.cssScale})`;
  }

  setMaxPixelScale(m: number): void {
    if (m === this.maxPixelScale) return;
    this.maxPixelScale = m;
    this.fit();
  }

  setResolutionScale(s: number): void {
    this.resolutionScale = Math.min(1, Math.max(0.5, s));
    this.fit();
  }

  /** Reset the transform so drawing uses logical pixels. */
  begin(): CanvasRenderingContext2D {
    const c = this.ctx;
    c.setTransform(this.pixelScale, 0, 0, this.pixelScale, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    return c;
  }

  toLogical(clientX: number, clientY: number): [number, number] {
    return [(clientX - this.offsetX) / this.cssScale, (clientY - this.offsetY) / this.cssScale];
  }

  async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // fullscreen can be refused (iframes, browser policy); the windowed view still works
    }
  }
}
