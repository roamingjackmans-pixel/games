// New Game+ bonus fights (D278): from NG+1 on, one combat room in every zone holds a boss from any zone in its second
// phase, at 30% of the HP it has in this playthrough, in place of the room's waves. Deterministic from (seed, zone,
// cycle) like the rest of the zone (PROCGEN §1).
import { stream } from '../../engine/rng';
import { BOSSES } from '../../data/bosses';
import type { BossDef } from '../types';
import type { ZoneLayout } from './zone';

/** A bonus boss's whole bar, as a share of its full HP in this playthrough; the bar starts full (D290). */
export const BONUS_BOSS_HP_PCT = 0.3;
/** Its Shards are cut the same way. */
export const BONUS_BOSS_SHARD_MULT = 0.3;
/** The phase it fights in (0-based: its second phase). */
export const BONUS_BOSS_PHASE = 1;
/** From this New Game+ cycle on it fights in its third phase, the Overtime one (D360; 0-based phase 2). */
export const BONUS_BOSS_PHASE3_FROM_CYCLE = 2;
export const BONUS_BOSS_PHASE3 = 2;

/** The phase a bonus boss fights in this cycle: its second, or from NG+2 its third (if its form has one). */
export function bonusBossPhase(cycle: number, phaseCount: number): number {
  return Math.min(cycle >= BONUS_BOSS_PHASE3_FROM_CYCLE ? BONUS_BOSS_PHASE3 : BONUS_BOSS_PHASE, phaseCount - 1);
}

/**
 * Bosses that can fight outside their arena: every boss with a second phase that is not `arenaBound`; with a zone,
 * never that zone's own boss (D306: it waits at the end of the zone).
 */
export function bonusBossPool(zone?: number): BossDef[] {
  return Object.values(BOSSES)
    .filter((b) => !b.arenaBound && b.phases.length > BONUS_BOSS_PHASE && b.zone !== zone)
    .sort((a, b) => a.zone - b.zone || a.id.localeCompare(b.id));
}

export interface BonusBoss {
  roomId: string;
  bossId: string;
}

/** This zone's bonus fight, or null (the first playthrough, or no combat room). */
export function bonusBossFor(layout: Pick<ZoneLayout, 'seed' | 'zone' | 'cycle' | 'rooms'>): BonusBoss | null {
  if (layout.cycle < 1) return null;
  const rooms = layout.rooms.filter((r) => r.kind === 'combat').sort((a, b) => a.id.localeCompare(b.id));
  const pool = bonusBossPool(layout.zone);
  if (rooms.length === 0 || pool.length === 0) return null;
  const rng = stream(layout.seed, `bonusBoss:${layout.zone}:${layout.cycle}`);
  const room = rng.pick(rooms);
  const boss = rng.pick(pool);
  return { roomId: room.id, bossId: boss.id };
}
