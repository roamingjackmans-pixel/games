// Boss phase passives (DATA_MODEL BossPhase.passive): a constant pull toward the boss, a stationary form in the
// arena's far third or centre, a size change and a projectile speed multiplier. A phase's passive is applied
// once, on the boss's first tick after the phase's 2 s transition (so the arena has finished changing), and
// the pull and the stationary pin are ticked by the AI. (`splitBody` is handled by its own module.)
import { dist } from '../../engine/math';
import { ROOM_CX, ROOM_CY } from '../combat/patterns';
import { farThirdSpot } from './platform';
import type { BossDef, BossPhase } from '../types';
import type { Entity, World } from '../world';

/** The pull pauses in the last 0.2 s of the boss's Piercing telegraphs (escapability, D50). */
export const PULL_PAUSE_S = 0.2;

export function phasePassive(e: Entity): BossPhase['passive'] | undefined {
  if (!e.en?.isBoss) return undefined;
  return (e.en.def as unknown as BossDef).phases[e.en.phase]?.passive;
}

/** Is the boss's pull paused right now? */
export function pullPaused(e: Entity): boolean {
  const a = e.en?.attack;
  return !!a && a.phase === 'windup' && a.def.kind === 'pierce' && a.windup - a.t < PULL_PAUSE_S;
}

function applyPhasePassive(w: World, e: Entity): void {
  const en = e.en!;
  const pp = phasePassive(e);
  const base = (en.extrasUsed.__baseRadius ??= e.radius);
  e.radius = base * (pp?.scale ?? 1);
  en.projSpeedMult = pp?.projectileSpeedMult ?? 1;
  if (pp?.stationaryAt) {
    const spot = pp.stationaryAt === 'farThird' ? farThirdSpot(w, e.radius + 4) : { x: ROOM_CX, y: ROOM_CY, facing: Math.PI / 2 };
    w.fx('teleport', e.x, e.y);
    e.x = e.px = spot.x;
    e.y = e.py = spot.y;
    e.facing = spot.facing;
    e.forced = null;
    en.homeX = spot.x;
    en.homeY = spot.y;
    w.fx('teleport', e.x, e.y);
    w.emit({ t: 'shake', amount: 8 });
  }
}

/** Every AI tick of a living boss (not during spawn or a phase transition). */
export function tickBossPassive(w: World, e: Entity, dt: number): void {
  const en = e.en!;
  if (en.extrasUsed.__passivePhase !== en.phase) {
    en.extrasUsed.__passivePhase = en.phase;
    applyPhasePassive(w, e);
  }
  const pp = phasePassive(e);
  if (!pp) return;
  if (pp.stationaryAt) {
    // pinned: bodies pushing against it do not move it
    e.x = en.homeX;
    e.y = en.homeY;
  }
  const pull = pp.pull;
  if (pull && !pullPaused(e)) {
    for (const p of w.livingPlayers()) {
      if (p.pl!.falling || p.pl!.state === 'dodge') continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > pull.r || d < e.radius + p.radius) continue;
      w.room.moveCircle(p, ((e.x - p.x) / d) * pull.speed * dt, ((e.y - p.y) / d) * pull.speed * dt);
    }
  }
}
