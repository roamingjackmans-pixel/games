// Boss phases (GAME_DESIGN §7): HP stops at each phase threshold, then a 2 s invulnerable transition (or the
// phase's own transitionS, with scripted beats)
// swaps in the next phase's attack table. The arena change and music live in the boss module (hook).
import { applyPhasePassive } from '../boss/passive';
import type { BossDef } from '../types';
import type { Entity, World } from '../world';

export const PHASE_TRANSITION_S = 2;

export function bossDefOf(e: Entity): BossDef | null {
  return e.en?.isBoss ? (e.en.def as unknown as BossDef) : null;
}

/**
 * HP at which the boss's current phase ends (0 in the last phase). A phase that is not the last but ends at 0% ends
 * on the blow that would have killed it (D253): it stops at 1 HP instead.
 */
export function phaseFloor(e: Entity): number {
  const def = bossDefOf(e);
  if (!def || !e.hp) return 0;
  const ph = def.phases[e.en!.phase];
  // a New Game+ bonus fight (D278) stays in the phase it started in, to the end
  if (!ph || e.en!.phase >= def.phases.length - 1 || e.en!.bonusBoss) return 0;
  return Math.max(1, (e.hp.max * ph.untilHpPct) / 100);
}

/** Where phase `i` starts on the bar, in percent: at the last phase's threshold, or a full bar if it refills. */
export function phaseStartPct(def: BossDef, i: number): number {
  if (i <= 0 || def.phases[i]?.refillHp) return 100;
  return def.phases[i - 1]?.untilHpPct ?? 100;
}

/** How long phase `i`'s invulnerable transition lasts. */
export function phaseTransitionS(def: BossDef, i: number): number {
  return def.phases[i]?.transitionS ?? PHASE_TRANSITION_S;
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
  const prev = en.phase;
  en.phase = phase;
  en.phaseAttacks = ph.attacks;
  // D253: a full bar again for the new phase; a second health pool is sized from what the last phase had to lose
  if (ph.refillHp && e.hp) {
    // the boss's full HP, whatever share of it the last bar was (D289)
    const full = e.hp.max / (en.barMult ?? 1);
    let bar = ph.barMult ?? 1;
    if (ph.hpOfPrevPhase) {
      const span = Math.max(1, phaseStartPct(def, prev) - (def.phases[prev]?.untilHpPct ?? 0)) / 100;
      bar = (en.barMult ?? 1) * span * ph.hpOfPrevPhase;
    }
    en.barMult = bar;
    e.hp.max = Math.max(1, full * bar);
    e.hp.hp = e.hp.max;
  }
  const trans = phaseTransitionS(def, phase);
  en.phaseTransitionUntil = now + trans;
  en.extrasUsed.__phaseAt = now;
  en.extrasUsed.__beats = 0;
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
    en.cooldowns[a.id] = Math.max(en.cooldowns[a.id] ?? 0, now + trans + 0.3 + i * 0.4);
  });
  if (ph.clearField) clearBossField(w, e);
  w.emit({ t: 'bossPhase', phase, ...(ph.name ? { name: ph.name } : {}) });
  w.emit({ t: 'shake', amount: 10 });
  w.sfx('phaseChange', e.x);
  w.fx('burst', e.x, e.y, { color: def.palette?.[1] ?? '#ffcf6a', n: 40, r: e.radius * 2 });
  // a new form at once, so the transition plays in it (BossPhase.passive.formAtStart)
  if (ph.passive?.formAtStart) applyPhasePassive(w, e);
  w.hooks.onBossPhase?.(w, e, phase);
}

/** Everything of the boss's side goes: its telegraphs, shots and hazards, and its adds (BossPhase.clearField). */
export function clearBossField(w: World, boss: Entity): void {
  for (const h of w.entities.values()) {
    if (h.removed) continue;
    if (h.type === 'telegraph' && h.tg?.team === 1) w.remove(h);
    else if (h.type === 'projectile' && h.pr?.team === 1) w.remove(h);
    else if (h.type === 'hazard' && h.hz?.team === 1 && h.hz.hazard !== 'curePool') w.remove(h);
  }
  for (const o of w.enemies) {
    if (o === boss || o.removed || o.hp?.dead || o.en?.isBoss) continue;
    o.en!.quietDeath = true;
    o.hp!.dead = true;
    w.fx('dust', o.x, o.y, { n: 10 });
    w.remove(o);
  }
}

/** During a boss's phase transition: play the phase's scripted beats as their times come (BossPhase.transitionBeats). */
export function tickBossTransition(w: World, e: Entity): void {
  const def = bossDefOf(e);
  const en = e.en!;
  const beats = def?.phases[en.phase]?.transitionBeats;
  if (!beats) return;
  const t = w.time - (en.extrasUsed.__phaseAt ?? w.time);
  let done = en.extrasUsed.__beats ?? 0;
  while (done < beats.length && beats[done]!.atS <= t) {
    const b = beats[done]!;
    if (b.sfx) w.sfx(b.sfx, e.x);
    if (b.shake) w.emit({ t: 'shake', amount: b.shake });
    if (b.fx) w.fx(b.fx, e.x, e.y, { ...(b.color ? { color: b.color } : {}), ...(b.n ? { n: b.n } : {}), ...(b.r ? { r: b.r } : {}) });
    done++;
  }
  en.extrasUsed.__beats = done;
}
