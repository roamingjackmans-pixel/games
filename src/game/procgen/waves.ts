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

export const MAX_LIVE = 12;
export const MAX_PER_WAVE = 8;

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

export function planRoom(layout: ZoneLayout, node: RoomNode): RoomPlan {
  const rng = stream(layout.seed, `waves:${layout.zone}:${layout.cycle}:${node.id}`);
  const ambush = node.kind === 'ambush';
  if (node.kind !== 'combat' && node.kind !== 'ambush') return { waves: [], ambush: false };
  const mix = layout.mix.map((id) => ENEMIES[id]).filter((d): d is EnemyDef => !!d);
  if (mix.length === 0) return { waves: [], ambush };
  const depth = Math.max(1, node.depth);
  const budget = threatBudget(depth, layout.zone);
  const n = waveCount(depth);
  const per = budget / n;
  const waves: PlannedUnit[][] = [];
  let elites = 0;
  for (let wi = 0; wi < n; wi++) {
    let left = per;
    const wave: PlannedUnit[] = [];
    const roleCount: Partial<Record<Role, number>> = {};
    let guard = 0;
    while (left >= 2 && wave.length < MAX_PER_WAVE && guard++ < 50) {
      const options = mix.filter((d) => {
        const c = unitCost(d);
        if (c > left + 0.5) return false;
        const rc = roleCount[d.role] ?? 0;
        if ((d.role === 'caster' || d.role === 'support') && rc >= 2) return false;
        if ((d.role === 'brute' || d.role === 'tank') && rc >= 2) return false;
        return true;
      });
      if (options.length === 0) break;
      const def = rng.pick(options);
      const pack = def.traits?.packSize;
      const count = pack ? Math.min(rng.int(pack[0], pack[1]), Math.max(1, Math.floor(left / unitCost(def))), MAX_PER_WAVE - wave.length) : 1;
      for (let k = 0; k < count; k++) {
        const elite = rollElite(rng, def, elites);
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

/** Shards a full clear of the room yields (no elites), for the tuning test. */
export function planShards(plan: RoomPlan, shardOf: (defId: string) => number): number {
  let s = 0;
  for (const w of plan.waves) for (const u of w) s += shardOf(u.defId) * (ENEMIES[u.defId]?.swarm?.pieces ?? 1);
  return s;
}
