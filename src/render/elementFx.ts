// Damage-type colour on enemies (D81): a faint glow of an elemental enemy's own type under it, and while it
// attacks, a charge-up aura and a strike streak in the colour of the attack's damage type. The draw functions
// colour the striking limb or weapon themselves (DrawState.atk); this is the shared layer around them.
import { glow, withAlpha } from '../engine/draw/parts';
import { ELEMENTS, enemyElement } from '../game/elements';
import type { Entity } from '../game/world';

/** states in which the body is hidden or not yet there: no glow may give it away */
const HIDDEN = new Set(['dormant', 'spawning', 'ceiling', 'stealth', 'invisible', 'submerged', 'dead']);

/** Under the body: the enemy's own type as a soft pool of light, and the gathering aura of an attack. */
export function drawElementUnder(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number): void {
  const en = e.en;
  if (!en || HIDDEN.has(en.state) || e.anim.alpha < 0.3) return;
  const own = enemyElement(en.def);
  const r = e.radius * (e.anim.scale || 1);
  if (own !== 'physical') {
    const el = ELEMENTS[own];
    // void is grey-black: a dark pool with a pale rim reads better than a dark glow
    if (own === 'void') {
      ctx.save();
      ctx.fillStyle = withAlpha(el.deep, 0.45);
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.7, r * 1.35, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      glow(ctx, x, y + r * 0.5, r * 1.6, el.glow, 0.16 + Math.sin(now * 2.2 + e.id) * 0.04);
    } else glow(ctx, x, y + r * 0.4, r * 1.9, el.glow, 0.18 + Math.sin(now * 2.2 + e.id) * 0.05);
  }
  const a = en.attack;
  if (!a || a.def.kind === 'utility') return;
  const el = ELEMENTS[a.def.type];
  if (a.phase === 'windup') {
    const k = Math.min(1, a.t / Math.max(0.05, a.windup));
    glow(ctx, x, y, r * (1.6 + k * 1.2), el.glow, 0.15 + k * 0.45);
  } else if (a.phase === 'active') glow(ctx, x, y, r * 2.6, el.glow, 0.55);
}

/** Over the body: motes drawn inward while winding up, and a bright streak along a melee strike. */
export function drawElementOver(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number): void {
  const en = e.en;
  if (!en || HIDDEN.has(en.state) || e.anim.alpha < 0.3) return;
  const a = en.attack;
  if (!a || a.def.kind === 'utility') return;
  if (en.def.swarm && en.pieceIndex > 0) return;
  const el = ELEMENTS[a.def.type];
  const r = e.radius * (e.anim.scale || 1);
  if (a.phase === 'windup') {
    const k = Math.min(1, a.t / Math.max(0.05, a.windup));
    const n = 6;
    ctx.save();
    ctx.fillStyle = el.glow;
    for (let i = 0; i < n; i++) {
      // each mote spirals in from 2.2 r to the body, looping faster as the windup fills
      const ph = (now * (1.2 + k * 2.4) + i / n) % 1;
      const ang = e.id * 1.7 + i * ((Math.PI * 2) / n) + ph * 1.6;
      const d = r * (2.3 - ph * 1.6);
      ctx.globalAlpha = (0.25 + k * 0.6) * Math.sin(ph * Math.PI);
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, 1.6 + k * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // no swing trail on the hit itself (D130): the telegraph already shows where it lands, and a trail drawn at the
  // attack's opening angle hung white half-circles beside combo and spin hits that had turned elsewhere
}

const GOLD = '#ffd24a';

/** Immune right now: faded, briefly invulnerable, or a boss changing phase (D108). Spawning and scenery excluded. */
export function isImmuneNow(e: Entity, now: number): boolean {
  const en = e.en;
  if (!en || !e.hp || e.hp.dead || HIDDEN.has(en.state) || en.def.traits?.invulnerable) return false;
  return en.fadeUntil > now || e.hp.invulnUntil > now || en.phaseTransitionUntil > now;
}

let goldCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;

/**
 * Draw a body turned to gold (D108): the sprite is drawn into a scratch canvas, washed with gold over its own
 * pixels (so the outline and shading still show through a little), then stamped back in place. Only immune
 * enemies pay for this, and the scratch canvas is reused.
 */
export function drawGolden(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number, draw: (c: CanvasRenderingContext2D, cx: number, cy: number) => void): void {
  const half = Math.min(512, Math.ceil(e.radius * (e.anim.scale || 1) * 4 + 40));
  const size = half * 2;
  if (!goldCanvas || goldCanvas.width < size || goldCanvas.height < size) {
    const n = Math.max(size, goldCanvas?.width ?? 0);
    goldCanvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(n, n) : Object.assign(document.createElement('canvas'), { width: n, height: n });
  }
  const g = goldCanvas.getContext('2d') as CanvasRenderingContext2D;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.clearRect(0, 0, size, size);
  draw(g, half, half);
  // wash the drawn pixels gold; a slow shimmer keeps it alive
  const shimmer = 0.5 + 0.5 * Math.sin(now * 6 + e.id);
  g.globalCompositeOperation = 'source-atop';
  const grad = g.createLinearGradient(0, half - half * 0.6, 0, half + half * 0.6);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.5, GOLD);
  grad.addColorStop(1, '#b07a12');
  g.globalAlpha = 0.68 + shimmer * 0.12;
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  // a glint band sweeping across the body
  const band = ((now * 0.9 + e.id * 0.37) % 1) * size * 1.6 - size * 0.3;
  const gl = g.createLinearGradient(band - 18, 0, band + 18, size);
  gl.addColorStop(0, 'rgba(255,255,255,0)');
  gl.addColorStop(0.5, 'rgba(255,255,240,0.55)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalAlpha = 1;
  g.fillStyle = gl;
  g.fillRect(0, 0, size, size);
  g.globalCompositeOperation = 'source-over';
  glow(ctx, x, y, e.radius * 2, GOLD, 0.3 + shimmer * 0.15);
  ctx.drawImage(goldCanvas as CanvasImageSource, 0, 0, size, size, x - half, y - half, size, size);
}
