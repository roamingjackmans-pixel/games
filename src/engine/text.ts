// Canvas text helpers. System font stack only (no external fonts, D8/ART_AUDIO §6).
export const FONT = '"Segoe UI", system-ui, sans-serif';
export const MONO = 'Consolas, "Cascadia Mono", ui-monospace, monospace';

export interface TextOpts {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  weight?: 'normal' | 'bold' | '600';
  outline?: string | null;
  outlineWidth?: number;
  mono?: boolean;
  alpha?: number;
  maxWidth?: number;
}

export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpts = {}): void {
  const size = o.size ?? 16;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.font = `${o.weight ?? 'normal'} ${size}px ${o.mono ? MONO : FONT}`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.outline !== null) {
    ctx.lineWidth = o.outlineWidth ?? Math.max(2, size / 6);
    ctx.strokeStyle = o.outline ?? '#000';
    ctx.lineJoin = 'round';
    if (o.maxWidth) ctx.strokeText(s, x, y, o.maxWidth);
    else ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = o.color ?? '#efe6d2';
  if (o.maxWidth) ctx.fillText(s, x, y, o.maxWidth);
  else ctx.fillText(s, x, y);
  ctx.restore();
}

export function measure(ctx: CanvasRenderingContext2D, s: string, size: number, weight = 'normal'): number {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}
