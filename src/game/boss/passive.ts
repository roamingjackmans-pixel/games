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

/** Apply the boss's current phase passive now (a phase with `formAtStart` takes its new form as the transition begins). */
export function applyPhasePassive(w: World, e: Entity): void {
  const en = e.en!;
  en.extrasUsed.__passivePhase = en.phase;
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

/** Every AI tick of a living boss (not during spawn or a phase transition). True while a blink holds it still. */
export function tickBossPassive(w: World, e: Entity, dt: number): boolean {
  const en = e.en!;
  if (en.extrasUsed.__passivePhase !== en.phase) applyPhasePassive(w, e);
  const pp = phasePassive(e);
  if (!pp) return false;
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
  return pp.blink ? tickBlink(w, e, pp.blink) : false;
}

type Blink = NonNullable<NonNullable<BossPhase['passive']>['blink']>;

/** Where a blink may land: open floor (not the void, not a wall), `minD`–`maxD` from the target, clear of every player. */
export function blinkSpot(w: World, e: Entity, target: Entity, b: Blink): { x: number; y: number } | null {
  const players = w.livingPlayers();
  for (let i = 0; i < 24; i++) {
    const a = w.combat.range(-Math.PI, Math.PI);
    const d = w.combat.range(b.minD, b.maxD);
    const x = target.x + Math.cos(a) * d;
    const y = target.y + Math.sin(a) * d;
    if (w.room.circleBlocked(x, y, e.radius + 6) || w.room.isFallAt(x, y)) continue;
    if (players.some((p) => dist(p.x, p.y, x, y) < b.minD)) continue;
    return { x, y };
  }
  return null;
}

/**
 * A telegraphed blink (BossPhase.passive.blink): between attacks, every `everyS` it flashes where it stands and a
 * mark lights where it will appear; `warnS` later it is there, facing its target. It holds still while it gathers.
 */
function tickBlink(w: World, e: Entity, b: Blink): boolean {
  const en = e.en!;
  const now = w.time;
  if (en.attack) return false;
  const x = en.extrasUsed;
  if ((x.__blinkAt ?? 0) > 0) {
    if (now < x.__blinkAt!) return true;
    x.__blinkAt = 0;
    x.__lastBlink = now;
    const tx = x.__blinkX!;
    const ty = x.__blinkY!;
    // a player may have walked onto the mark meanwhile: it fizzles rather than land on them
    if (w.livingPlayers().some((p) => dist(p.x, p.y, tx, ty) < p.radius + e.radius + 8) || w.room.circleBlocked(tx, ty, e.radius)) return false;
    w.fx('teleport', e.x, e.y);
    e.x = e.px = tx;
    e.y = e.py = ty;
    e.forced = null;
    w.fx('teleport', tx, ty);
    w.fx('impact', tx, ty, { color: '#ffd24a', r: 40 });
    w.sfx('voidBlink', tx, 0.6);
    const t = w.get(en.targetId);
    if (t) e.facing = Math.atan2(t.y - e.y, t.x - e.x);
    en.thinkAt = now;
    return false;
  }
  if (now - (x.__lastBlink ?? -99) < b.everyS) return false;
  const target = w.get(en.targetId) ?? w.livingPlayers()[0];
  if (!target) return false;
  const spot = blinkSpot(w, e, target, b);
  x.__lastBlink = now;
  if (!spot) return false;
  x.__blinkAt = now + b.warnS;
  x.__blinkX = spot.x;
  x.__blinkY = spot.y;
  w.fx('teleport', e.x, e.y);
  w.fx('impact', spot.x, spot.y, { color: '#b06bff', r: 30 });
  return true;
}
