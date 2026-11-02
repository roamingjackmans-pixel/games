// Draw-function registry: every enemy/boss/prop references a DrawId implemented under src/engine/draw/.
import { OUTLINE, blob, eyes, glow, shadow } from './parts';

export interface DrawState {
  x: number;
  y: number;
  facing: number;
  /** seconds since spawn (idle animation clock) */
  t: number;
  r: number;
  flash: boolean;
  tint: 'red' | 'blue' | null;
  alpha: number;
  scale: number;
  /** −1 (windup crouch) … +1 (release stretch) */
  squash: number;
  pose: string;
  poseT: number;
  hpFrac: number;
  moving: number;
  /** zone palette (4 colours) */
  pal: string[];
  /** extra per-entity numbers (phase, piece index, revealed, open lid…) */
  phase: number;
  variant: number;
  awake: boolean;
  /** where the entity's next gaze attack strikes (AttackDef.gazeTurnDeg), for its sweep arrow */
  gaze?: number;
}

export type DrawFn = (ctx: CanvasRenderingContext2D, s: DrawState) => void;

const registry = new Map<string, DrawFn>();

export function registerDraw(id: string, fn: DrawFn): void {
  registry.set(id, fn);
}

export function hasDraw(id: string): boolean {
  return registry.has(id);
}

export function drawIds(): string[] {
  return [...registry.keys()];
}

/** Fill colour helper: white while flashing. */
export function fc(s: DrawState, color: string): string {
  return s.flash ? '#ffffff' : color;
}

/** Draw an entity by id; unknown ids get a readable placeholder blob so nothing is ever invisible. */
export function drawById(ctx: CanvasRenderingContext2D, id: string, s: DrawState): void {
  const fn = registry.get(id);
  ctx.save();
  ctx.globalAlpha *= s.alpha;
  if (fn) fn(ctx, s);
  else {
    shadow(ctx, s.x, s.y, s.r);
    blob(ctx, s.x, s.y, s.r, s.r * (1 + s.squash * 0.1), { fill: fc(s, s.pal[0] ?? '#888') });
    eyes(ctx, s.x, s.y - s.r * 0.2, s.facing, s.r * 0.3, Math.max(1.5, s.r * 0.12), OUTLINE, s.r * 0.25);
  }
  ctx.restore();
  if (s.tint === 'red') glow(ctx, s.x, s.y, s.r * 2.4, '#ff3b3b', 0.5 + Math.sin(s.t * 22) * 0.2);
  else if (s.tint === 'blue') glow(ctx, s.x, s.y, s.r * 2.4, '#8fd3ff', 0.6);
}
