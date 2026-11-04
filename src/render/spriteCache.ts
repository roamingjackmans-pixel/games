// Per-enemy sprite cache (D152). Enemies are drawn from vector shapes (about 130 curve segments and several clips
// each), and redrawing every one of them every frame was most of a busy fight's frame time on both host and guests.
// Each ordinary enemy now keeps its own small offscreen picture: it is redrawn at most animHz() times a second, or at
// once when something visible changes (pose, hit flash, tint, facing, squash…), and every frame just stamps that
// picture at the enemy's current position, so movement stays as smooth as before. Bosses are drawn directly.
import type { DrawState } from '../engine/draw/registry';
import type { Entity } from '../game/world';

/**
 * How often a cached enemy's own animation (breathing, walk cycle, flicker) is redrawn: 30 times a second with a
 * handful of enemies on screen, easing down to 10 in a crowd of 30 or more (positions still move every frame).
 * Measured on a 40-enemy fight with a GPU: 2.6× the frames of drawing every enemy every frame at 8 Hz.
 */
export function animHz(crowd: number): number {
  if (crowd <= 8) return 30;
  if (crowd >= 30) return 10;
  return 30 - ((crowd - 8) / 22) * 20;
}
let crowd = 0;
let countThisFrame = 0;
let frameNow = -1;

interface Sprite {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** half the picture's size in world units */
  half: number;
  /** device pixels per world unit it was drawn at */
  k: number;
  key: string;
  at: number;
}

const sprites = new WeakMap<Entity, Sprite>();
/** counters for the debug overlay and profiling: pictures redrawn and stamped */
export const spriteStats = { redraws: 0, stamps: 0 };
let enabled = true;

/** Switch the cache off (tests, or to compare); everything then draws directly. */
export function setSpriteCache(on: boolean): void {
  enabled = on;
}

const q = (v: number, step: number): number => Math.round(v / step);

/** What, when it changes, must redraw the picture at once (anything continuous is bucketed). */
function keyOf(drawId: string, s: DrawState, half: number, k: number): string {
  return [
    drawId,
    s.pose,
    s.tint ?? '',
    s.flash ? 1 : 0,
    q(s.facing, Math.PI / 24),
    q(s.squash, 0.1),
    q(s.scale, 0.05),
    q(s.alpha, 0.05),
    q(s.hpFrac, 0.1),
    s.moving > 0.2 ? 1 : 0,
    s.phase,
    s.variant,
    s.awake ? 1 : 0,
    s.gaze === undefined ? '' : q(s.gaze, Math.PI / 32),
    s.atk ?? '',
    s.elem,
    half,
    q(k, 0.05),
  ].join('|');
}

/** True for enemies the cache handles: not bosses, not huge, not drawn far outside their body. */
export function cacheable(e: Entity): boolean {
  return enabled && !!e.en && !e.en.isBoss && e.radius <= 48 && typeof document !== 'undefined';
}

/**
 * Draw an enemy through its cached picture. `draw` paints the enemy centred on (cx, cy) in the given context, and
 * `state` is the state it would be drawn with now (only read to decide whether the picture is stale).
 */
export function drawCachedEnemy(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  x: number,
  y: number,
  now: number,
  drawId: string,
  state: DrawState,
  draw: (c: CanvasRenderingContext2D, cx: number, cy: number) => void,
): void {
  // how many cached enemies the last frame drew sets this frame's repaint rate
  if (now !== frameNow) {
    frameNow = now;
    crowd = countThisFrame;
    countThisFrame = 0;
  }
  countThisFrame++;
  const t = ctx.getTransform();
  const k = Math.max(0.25, Math.min(4, Math.hypot(t.a, t.b)));
  // room for limbs, weapons and windup poses around the body
  const half = Math.ceil(e.radius * Math.max(1, state.scale || 1) * 3.5 + 36);
  const key = keyOf(drawId, state, half, k);
  let sp = sprites.get(e);
  if (!sp || sp.half !== half || Math.abs(sp.k - k) > 0.01) {
    const px = Math.ceil(half * 2 * k);
    const canvas = Object.assign(document.createElement('canvas'), { width: px, height: px });
    sp = { canvas, half, k, key: '', at: -1 };
    sprites.set(e, sp);
  }
  if (sp.key !== key || now - sp.at >= 1 / animHz(crowd) || now < sp.at) {
    const g = sp.canvas.getContext('2d') as CanvasRenderingContext2D;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, sp.canvas.width, sp.canvas.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    draw(g, half, half);
    spriteStats.redraws++;
    sp.key = key;
    sp.at = now;
  }
  spriteStats.stamps++;
  ctx.drawImage(sp.canvas as CanvasImageSource, x - half, y - half, half * 2, half * 2);
}

// dev builds: profiling scripts reach the switch and counters here (a second import of this module would be a copy)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __djSprites: unknown }).__djSprites = { spriteStats, setSpriteCache };
