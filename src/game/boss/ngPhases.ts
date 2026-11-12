// New Game+ boss phases (D295): from the second playthrough on, every zone 1–7 boss gets a third phase. Its first
// phase change moves halfway up to full HP (50% → 75%) and the new change sits halfway from there to 0 (37.5%).
// The new phase is an "Overtime" of the boss's last phase: its attacks plus the boss's own Overtime attacks (D309),
// faster, harder, shorter cooldowns.
// The list is derived from the boss's own data when it spawns, so the host, guests, the boss bar and the AI all
// read the same phases from the spawned boss's def.
import type { AttackDef, BossDef, BossPhase } from '../types';

/** The highest zone whose boss gets the New Game+ third phase. */
export const NG_PHASE3_MAX_ZONE = 7;
export const NG_PHASE3_SPEED = 1.15;
export const NG_PHASE3_DMG = 1.15;
export const NG_PHASE3_COOLDOWN = 0.8;

const cache = new WeakMap<BossDef, BossDef>();

/** The Overtime phase: the last phase again, harder; its arena changes are already in place, so none are re-applied. */
function overtime(last: BossPhase, bossName: string, extra: readonly AttackDef[], intro?: BossDef['overtimeIntro']): BossPhase {
  const {
    arena: _arena,
    refillHp: _refill,
    barMult: _bar,
    hpOfPrevPhase: _prev,
    transitionS: _ts,
    transitionBeats: _beats,
    clearField: _clear,
    ...rest
  } = last;
  return {
    ...rest,
    untilHpPct: 0,
    // a boss with its own arrival (D358) names the phase and scripts the change: beats, shakes, bursts, the field cleared
    name: intro ? intro.name : `${last.name ?? bossName}: Overtime`,
    ...(intro ? { transitionS: intro.transitionS, transitionBeats: intro.transitionBeats, clearField: true } : {}),
    // the last phase's attacks and at least two of its own (D309)
    attacks: [...last.attacks, ...extra.filter((a) => !last.attacks.some((b) => b.id === a.id))],
    speedMult: last.speedMult * NG_PHASE3_SPEED,
    dmgMult: last.dmgMult * NG_PHASE3_DMG,
    cooldownMult: (last.cooldownMult ?? 1) * NG_PHASE3_COOLDOWN,
  };
}

/**
 * The phases a boss fights with in this cycle: its own on the first playthrough (and for zone 8), the New Game+ list
 * from cycle 1. A boss whose second phase refills a new bar (Ignatius, D253) keeps the split and gets the third phase
 * at 50% of the refilled bar. A boss with three or more phases moves its first change and adds the new phase at half
 * of its last change.
 */
export function ngBossDef(def: BossDef, cycle: number): BossDef {
  if (cycle < 1 || def.zone > NG_PHASE3_MAX_ZONE || def.phases.length < 2) return def;
  const hit = cache.get(def);
  if (hit) return hit;
  const ph = def.phases.map((p) => ({ ...p }));
  const n = ph.length;
  // the first real phase change (one that ends above 0, not a "killing blow" split) moves halfway up to full HP
  const first = ph.findIndex((p, i) => i < n - 1 && p.untilHpPct > 0);
  if (first >= 0) ph[first]!.untilHpPct = (ph[first]!.untilHpPct + 100) / 2;
  const last = ph[n - 1]!;
  const before = ph[n - 2]!.untilHpPct;
  // the new change: halfway from the change before it to 0, or halfway down a refilled bar
  const at = last.refillHp || before <= 0 ? 50 : before / 2;
  ph[n - 1] = { ...last, untilHpPct: at };
  ph.push(overtime(last, def.name, def.overtimeAttacks ?? [], def.overtimeIntro));
  const out: BossDef = { ...def, phases: ph };
  cache.set(def, out);
  return out;
}
