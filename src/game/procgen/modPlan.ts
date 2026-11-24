// A FlashGames run's modifiers on a room's plan (D452, GAME_DESIGN §25): Elite Squad, Paper Horde and Boss Rush Hour.
// Deterministic from the zone seed and the room like the plan itself (PROCGEN §1). With the normal game's neutral
// modifiers the plan comes back untouched.
import { stream } from '../../engine/rng';
import { ENEMIES } from '../../data/enemies';
import { ELITE_AFFIXES } from '../types';
import { runMods } from '../runMods';
import { canBeElite } from './elite';
import { bonusBossPool } from './bonusBoss';
import { roomCountMult, type RoomPlan } from './waves';
import type { RoomNode, ZoneLayout } from './zone';

/**
 * Boss Rush Hour's rooms in a zone: its combat and ambush rooms counted nearest the start first (then by id), every
 * `every`-th one.
 */
export function bossRushRooms(layout: Pick<ZoneLayout, 'rooms'>, every: number): Set<string> {
  if (every <= 0) return new Set();
  const rooms = layout.rooms.filter((r) => r.kind === 'combat' || r.kind === 'ambush').sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  return new Set(rooms.filter((_, i) => i % every === every - 1).map((r) => r.id));
}

/**
 * The plan with the run's modifiers on it. Boss Rush Hour swaps the room's waves for a challenger: a boss from
 * another zone in its second phase, sized and hitting like this zone's (the New Game+ bonus fight, D278, D322).
 * Paper Horde repeats the waves (the solo waves of an ambush still spring at once, the repeats follow one by one) and
 * divides each enemy's Shards and drops by as much, so a room pays what it did. Elite Squad makes every enemy that can
 * be an Elite one (never a swarm piece or a special enemy, GAME_DESIGN §6.5).
 */
export function modRoomPlan(plan: RoomPlan, layout: ZoneLayout, node: RoomNode, allowBoss = true): RoomPlan {
  const m = runMods();
  if (plan.bonusBoss) return plan;
  if (allowBoss && m.bossEvery > 0 && bossRushRooms(layout, m.bossEvery).has(node.id)) {
    const pool = bonusBossPool(layout.zone);
    if (pool.length) {
      const boss = stream(layout.seed, `rushHour:${layout.zone}:${layout.cycle}:${node.id}`).pick(pool);
      return { waves: [], ambush: false, baseWaves: 1, share: 1, bonusBoss: boss.id };
    }
  }
  let waves = plan.waves;
  if (m.waveRepeat > 1 && waves.length) {
    const out: RoomPlan['waves'] = [];
    for (let k = 0; k < m.waveRepeat; k++) for (const wv of waves) out.push(wv.map((u) => ({ ...u })));
    waves = out;
  }
  if (m.allElite) {
    const rng = stream(layout.seed, `allElite:${layout.zone}:${layout.cycle}:${node.id}`);
    waves = waves.map((wv) => wv.map((u) => (u.elite || !canBeElite(ENEMIES[u.defId]) ? u : { ...u, elite: rng.pick(ELITE_AFFIXES) })));
  }
  if (waves === plan.waves) return plan;
  return { ...plan, waves, ...(m.waveRepeat > 1 ? { share: (plan.share ?? roomCountMult()) * m.waveRepeat } : {}) };
}
