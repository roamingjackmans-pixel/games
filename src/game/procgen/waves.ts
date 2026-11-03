// Threat budgets and waves (PROCGEN §4). Deterministic from (seed, zone, cycle, room).
import { stream } from '../../engine/rng';
import { ENEMIES } from '../../data/enemies';
import { ROLE_STATS } from '../../data/roles';
import { rollElite } from './elite';
import type { EliteAffix, EnemyDef, Role } from '../types';
import type { RoomNode, ZoneLayout } from './zone';

export interface PlannedUnit {
  defId: string;
  elite: EliteAffix | null;
}
export interface RoomPlan {
  waves: PlannedUnit[][];
  ambush: boolean;
}

/**
 * Room size (D79): every room has 50% more enemies than the original budget, and co-op multiplies the count by
 * the number of players (5 → 10 → 15 → 20). Each of those enemies' Shards and drop chances are divided by the
 * same factor, so what each player earns per room stays the same.
 */
export const ROOM_ENEMY_MULT = 1.5;
export function roomCountMult(players: number): number {
  return ROOM_ENEMY_MULT * Math.max(1, players);
}

/** caps for one player; they scale with the party */
export const MAX_LIVE = 18;
export const MAX_PER_WAVE = 12;
export function maxPerWave(players: number): number {
  return MAX_PER_WAVE * Math.max(1, players);
}
export function maxLive(players: number): number {
  return MAX_LIVE * Math.max(1, players);
}

/** The original budget before the D79 multiplier. */
export function threatBudget(depth: number, zone: number): number {
  return (6 + 2 * depth) * (1 + 0.15 * (zone - 1));
}

export function waveCount(depth: number): number {
  return depth <= 2 ? 1 : depth <= 5 ? 2 : 3;
}

export function unitCost(def: EnemyDef): number {
  return ROLE_STATS[def.role as Role].cost;
}

/** Number of live entities a planned unit becomes (a swarm group counts once toward the live cap). */
export function unitWeight(_def: EnemyDef): number {
  return 1;
}

export function planRoom(layout: ZoneLayout, node: RoomNode, players = 1): RoomPlan {
  const p = Math.max(1, Math.min(4, players));
  const rng = stream(layout.seed, `waves:${layout.zone}:${layout.cycle}:${node.id}${p > 1 ? `:p${p}` : ''}`);
  const ambush = node.kind === 'ambush';
  if (node.kind !== 'combat' && node.kind !== 'ambush') return { waves: [], ambush: false };
  const mix = layout.mix.map((id) => ENEMIES[id]).filter((d): d is EnemyDef => !!d);
  if (mix.length === 0) return { waves: [], ambush };
  const depth = Math.max(1, node.depth);
  const budget = threatBudget(depth, layout.zone) * roomCountMult(p);
  const cap = maxPerWave(p);
  const n = waveCount(depth);
  const per = budget / n;
  const waves: PlannedUnit[][] = [];
  let elites = 0;
  for (let wi = 0; wi < n; wi++) {
    let left = per;
    const wave: PlannedUnit[] = [];
    const roleCount: Partial<Record<Role, number>> = {};
    let guard = 0;
    while (left >= 2 && wave.length < cap && guard++ < 200) {
      const options = mix.filter((d) => {
        const c = unitCost(d);
        if (c > left + 0.5) return false;
        const rc = roleCount[d.role] ?? 0;
        // a wave's casters and heavies stay readable: at most 2 of each per player
        if ((d.role === 'caster' || d.role === 'support') && rc >= 2 * p) return false;
        if ((d.role === 'brute' || d.role === 'tank') && rc >= 2 * p) return false;
        return true;
      });
      if (options.length === 0) break;
      const def = rng.pick(options);
      const pack = def.traits?.packSize;
      const count = pack ? Math.min(rng.int(pack[0], pack[1]), Math.max(1, Math.floor(left / unitCost(def))), cap - wave.length) : 1;
      for (let k = 0; k < count; k++) {
        const elite = rollElite(rng, def, elites, p);
        if (elite) elites++;
        wave.push({ defId: def.id, elite });
        left -= unitCost(def);
        roleCount[def.role] = (roleCount[def.role] ?? 0) + 1;
      }
    }
    if (wave.length === 0) wave.push({ defId: mix[0]!.id, elite: null });
    waves.push(wave);
  }
  return { waves, ambush };
}

/** Shards one player gets from a full clear of the room (no elites), for the tuning test. */
export function planShards(plan: RoomPlan, shardOf: (defId: string) => number, players = 1): number {
  let s = 0;
  for (const w of plan.waves) for (const u of w) s += shardOf(u.defId) * (ENEMIES[u.defId]?.swarm?.pieces ?? 1);
  return s / roomCountMult(players);
}
