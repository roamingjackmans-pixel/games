// Boss phases (GAME_DESIGN §7): HP stops at each phase threshold, then a 2 s invulnerable transition
// swaps in the next phase's attack table. The arena change and music live in the boss module (hook).
import type { BossDef } from '../types';
import type { Entity, World } from '../world';

export const PHASE_TRANSITION_S = 2;

export function bossDefOf(e: Entity): BossDef | null {
  return e.en?.isBoss ? (e.en.def as unknown as BossDef) : null;
}

/** HP at which the boss's current phase ends (0 in the last phase). */
export function phaseFloor(e: Entity): number {
  const def = bossDefOf(e);
  if (!def || !e.hp) return 0;
  const ph = def.phases[e.en!.phase];
  if (!ph || e.en!.phase >= def.phases.length - 1) return 0;
  return (e.hp.max * ph.untilHpPct) / 100;
}

/** Call after a boss loses HP: clamps at the threshold and starts the next phase when reached. */
export function bossPhaseCheck(w: World, e: Entity): void {
  if (!e.en?.isBoss || !e.hp || e.hp.dead) return;
  const floor = phaseFloor(e);
  if (floor <= 0 || e.hp.hp > floor) return;
  e.hp.hp = floor;
  startBossPhase(w, e, e.en.phase + 1);
}

export function startBossPhase(w: World, e: Entity, phase: number): void {
  const def = bossDefOf(e);
  const en = e.en!;
  const ph = def?.phases[phase];
  if (!def || !ph) return;
  const now = w.time;
  en.phase = phase;
  en.phaseAttacks = ph.attacks;
  en.phaseTransitionUntil = now + PHASE_TRANSITION_S;
  // the attack in progress is dropped with its telegraphs
  if (en.attack) {
    for (const id of en.attack.teleIds) {
      const t = w.get(id);
      if (t) w.remove(t);
    }
    en.attack = null;
  }
  e.anim.tint = null;
  e.anim.pose = 'idle';
  e.anim.squash = 0;
  e.anim.scale = 1;
  e.forced = null;
  en.state = 'alert';
  en.hitTimes = [];
  en.lastAttackId = '';
  e.hp!.staggerUntil = 0;
  en.stunUntil = 0;
  // the new table starts staggered a little so the first attacks do not all land at once
  ph.attacks.forEach((a, i) => {
    en.cooldowns[a.id] = Math.max(en.cooldowns[a.id] ?? 0, now + PHASE_TRANSITION_S + 0.3 + i * 0.4);
  });
  w.emit({ t: 'bossPhase', phase, ...(ph.name ? { name: ph.name } : {}) });
  w.emit({ t: 'shake', amount: 10 });
  w.sfx('phaseChange', e.x);
  w.fx('burst', e.x, e.y, { color: def.palette?.[1] ?? '#ffcf6a', n: 40, r: e.radius * 2 });
  w.hooks.onBossPhase?.(w, e, phase);
}
