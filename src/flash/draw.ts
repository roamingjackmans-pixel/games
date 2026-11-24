// What a FlashGames run draws over the game (D452): the day's modifiers in a corner (under the minimap), a "get ready"
// line while FlashGames counts down, and Lights Out's lantern. No timer: FlashGames shows the clock.
import { drawText } from '../engine/text';

/** The corner box: the day's modifiers and the score so far. */
export function drawFlashCorner(ctx: CanvasRenderingContext2D, names: readonly string[], score: number): void {
  const x1 = 1268;
  const w = 158;
  const y0 = 140;
  const h = 26 + 17 * names.length;
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,14,0.6)';
  ctx.fillRect(x1 - w, y0, w, h);
  ctx.restore();
  drawText(ctx, 'FLASHGAMES', x1 - w + 7, y0 + 16, { size: 11, weight: 'bold', color: '#e6b84a' });
  drawText(ctx, score.toLocaleString('en-US'), x1 - 7, y0 + 16, { size: 12, weight: 'bold', mono: true, align: 'right', color: '#efe6d2' });
  names.forEach((n, i) => drawText(ctx, n, x1 - w + 7, y0 + 34 + 17 * i, { size: 12, color: '#cfc6b4', maxWidth: w - 14 }));
}

/** While FlashGames counts 3-2-1 (or a second, opened on its own), the game waits. */
export function drawGetReady(ctx: CanvasRenderingContext2D, names: readonly string[]): void {
  ctx.save();
  ctx.fillStyle = 'rgba(8,6,12,0.45)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
  drawText(ctx, 'GET READY', 640, 330, { size: 44, weight: 'bold', align: 'center', color: '#e6b84a' });
  if (names.length) drawText(ctx, names.join(' · '), 640, 372, { size: 18, align: 'center', color: '#efe6d2', maxWidth: 1100 });
}

/** Lights Out: the room is dark but for a pool of lantern light round Joe. */
export function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 90, x, y, 330);
  g.addColorStop(0, 'rgba(3,2,6,0)');
  g.addColorStop(0.55, 'rgba(3,2,6,0.62)');
  g.addColorStop(1, 'rgba(3,2,6,0.93)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();
}
