// The Thermos sparkle: while a player drinks, golden four-point sparkles rise around them and a warm glow wraps the
// body. Drawn from the player's own drink state (state 'flask' and stateUntil reach guests in snapshots), so every
// client sees it on every player. Cosmetic only; no randomness (each sparkle's spot comes from its index).
import { glow } from '../engine/draw/parts';
import { FLASK_DRINK_S } from '../game/player/player';
import type { Entity } from '../game/world';

const TAU = Math.PI * 2;
const SPARKS = 14;
/** a sparkle rises from the feet to over the head in this long */
const RISE_S = 0.7;

function frac(v: number): number {
  return v - Math.floor(v);
}
/** a fixed 0..1 value per sparkle index */
function h(i: number, salt: number): number {
  return frac(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, a: number): void {
  if (a <= 0.01 || s <= 0.4) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffd75a';
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const r = k % 2 === 0 ? s : s * 0.28;
    const ang = rot + (k * Math.PI) / 4;
    const px = x + Math.cos(ang) * r;
    const py = y + Math.sin(ang) * r;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.arc(x, y, s * 0.26, 0, TAU);
  ctx.fill();
}

/** How far into the drink a player is, 0..1, or -1 when they are not drinking. */
export function thermosProgress(e: Entity, now: number): number {
  const pl = e.pl;
  if (!pl || pl.state !== 'flask' || pl.deadUntilRest || pl.downed || e.hp?.dead) return -1;
  return Math.max(0, Math.min(1, 1 - (pl.stateUntil - now) / FLASK_DRINK_S));
}

/** Golden sparkles on a player who is drinking from the Thermos (x, y: the body's drawn centre). */
export function drawThermosSparkle(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number): void {
  const k = thermosProgress(e, now);
  if (k < 0) return;
  // fades in fast, holds, fades out over the last fifth of the drink
  const env = Math.min(1, k / 0.12) * Math.min(1, (1 - k) / 0.2);
  if (env <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y - 6, 34, '#ffc83a', 0.4 * env * e.anim.alpha);
  for (let i = 0; i < SPARKS; i++) {
    const u = frac(now / RISE_S + h(i, 1));
    const ang = h(i, 2) * TAU + now * (h(i, 3) > 0.5 ? 1.6 : -1.6);
    const r = 9 + h(i, 4) * 12;
    const sx = x + Math.cos(ang) * r;
    const sy = y + 12 - u * 44;
    const tw = 0.6 + 0.4 * Math.sin(now * 22 + i * 1.7);
    const size = (3 + h(i, 5) * 3) * Math.sin(u * Math.PI) * tw;
    sparkle(ctx, sx, sy, size, now * 3 + i, env * e.anim.alpha * Math.sin(u * Math.PI));
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
