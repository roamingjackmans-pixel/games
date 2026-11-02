// Shared vector parts: outlines, two-tone bodies, specular dots, limbs, and pre-rendered glow sprites.
// Style (ART_AUDIO §2): thick dark outlines, flat fill with a darker underside, small specular dot.

export const OUTLINE = '#120e14';
export const OUTLINE_W = 3;

const glowCache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** A soft radial glow sprite, 64 × 64, cached by color. Draw scaled with globalCompositeOperation 'lighter'. */
export function getGlow(color: string): CanvasImageSource {
  let g = glowCache.get(color);
  if (!g) {
    g = makeCanvas(64, 64);
    const c = g.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, withAlpha(color, 0.45));
    grad.addColorStop(1, withAlpha(color, 0));
    c.fillStyle = grad;
    c.fillRect(0, 0, 64, 64);
    glowCache.set(color, g);
  }
  return g;
}

/** Blit a glow of radius r at (x, y). */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1): void {
  const prevOp = ctx.globalCompositeOperation;
  const prevA = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = prevA * alpha;
  ctx.drawImage(getGlow(color), x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = prevA;
}

/** Parse #rgb / #rrggbb into an rgba() string with the given alpha. */
export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Darken (k < 1) or lighten (k > 1) a hex color. */
export function shade(hex: string, k: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number): number => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k)));
  return `#${((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1)}`;
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const f = (x: number, y: number): number => Math.round(x + (y - x) * t);
  return `#${((1 << 24) | (f(r1, r2) << 16) | (f(g1, g2) << 8) | f(b1, b2)).toString(16).slice(1)}`;
}

export interface Paint {
  fill: string;
  /** darker underside; derived when omitted */
  under?: string;
  outline?: string;
  outlineW?: number;
}

/** Ellipse body with two-tone shading and outline. */
export function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, p: Paint, rot = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = p.fill;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = p.under ?? shade(p.fill, 0.72);
  ctx.beginPath();
  ctx.ellipse(0, ry * 0.55, rx * 1.1, ry * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = p.outlineW ?? OUTLINE_W;
  ctx.strokeStyle = p.outline ?? OUTLINE;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, p: Paint): void {
  blob(ctx, x, y, r, r, p);
}

/** Small white specular dot. */
export function spec(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 0.8): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Thick rounded limb/stick from (x1, y1) to (x2, y2) with an outline. */
export function limb(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + OUTLINE_W * 2 - 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Closed polygon from a flat [x0, y0, x1, y1, …] list, filled and outlined. */
export function poly(ctx: CanvasRenderingContext2D, pts: number[], fill: string, outline = OUTLINE, w = OUTLINE_W): void {
  if (pts.length < 6) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (w > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
}

/** Two dot eyes looking along `facing`. */
export function eyes(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number, spread: number, r: number, color = '#120e14', look = 2): void {
  const lx = Math.cos(facing) * look;
  const ly = Math.sin(facing) * look;
  const px = -Math.sin(facing) * spread;
  const py = Math.cos(facing) * spread;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + px + lx, y + py + ly, r, 0, Math.PI * 2);
  ctx.arc(x - px + lx, y - py + ly, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Ground shadow under an entity. */
export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 0.32): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.75, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Offscreen canvas helper for pre-rendered layers (room floors). */
export function offscreen(w: number, h: number): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D } {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  return { canvas, ctx };
}
