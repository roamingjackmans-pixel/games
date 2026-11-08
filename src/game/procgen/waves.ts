// Threat budgets and waves (PROCGEN §4). Deterministic from (seed, zone, cycle, room).
import { stream } from '../../engine/rng';
import { ENEMIES, rosterOf } from '../../data/enemies';
import { ROLE_STATS } from '../../data/roles';
import { ensureNgElite, rollElite } from './elite';
import { bonusBossFor } from './bonusBoss';
import type { EliteAffix, EnemyDef, Role } from '../types';
import type { RoomNode, ZoneLayout } from './zone';

export interface PlannedUnit {
  defId: string;
  elite: EliteAffix | null;
}
export interface RoomPlan {
  waves: PlannedUnit[][];
  ambush: boolean;
  /** how many of the waves a solo room has (an ambush spawns these at once; the party's extra waves follow, D159) */
  baseWaves?: number;
  /** what each enemy's Shards and drop chances are divided by, so a player earns the same per room in any party */
  share?: number;
  /** New Game+ (D278): this room's fight is this boss, in its second phase, instead of waves */
  bonusBoss?: string;
}

/**
 * Room size (D79): every room has 50% more enemies than the original budget. Co-op adds **one full extra wave per
 * extra player** (D159; it was 20% bigger waves, D150, and 100% bigger before that): waves stay the solo size, so a
 * party fights longer rather than more crowded. Each enemy's Shards and drop chances are divided by the room's
 * total against a solo room (the plan's share), so what each player earns per room stays the same.
 */
export const ROOM_ENEMY_MULT = 1.5;
const clampPlayers = (players: number): number => Math.max(1, Math.min(4, players));
/** the room size against the original budget (solo; co-op adds waves instead) */
export function roomCountMult(_players = 1): number {
  return ROOM_ENEMY_MULT;
}
/** waves in a room at this depth for this party: the solo count plus one per extra player */
export function waveCountFor(depth: number, players: number): number {
  return waveCount(depth) + clampPlayers(players) - 1;
}

/** caps for one player; they scale with the party */
export const MAX_LIVE = 18;
export const MAX_PER_WAVE = 12;
export function maxPerWave(_players = 1): number {
  return MAX_PER_WAVE;
}
export function maxLive(_players = 1): number {
  return MAX_LIVE;
}

/** The original budget before the D79 multiplier. */
export function threatBudget(depth: number, zone: number): number {
  return (6 + 2 * depth) * (1 + 0.15 * (zone - 1));
}

/** New Game+ (D276): every zone's rooms are budgeted like zone 8's, so they hold as many enemies as zone 8's rooms. */
export const NG_BUDGET_ZONE = 8;
export function budgetZone(zone: number, cycle: number): number {
  return cycle >= 1 ? Math.max(zone, NG_BUDGET_ZONE) : zone;
}

function avgUnitCost(defs: EnemyDef[]): number {
  return defs.length ? defs.reduce((a, d) => a + unitCost(d), 0) / defs.length : 1;
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
  const bonus = bonusBossFor(layout);
  if (bonus && bonus.roomId === node.id) return { waves: [], ambush: false, baseWaves: 1, share: 1, bonusBoss: bonus.bossId };
  const mix = layout.mix.map((id) => ENEMIES[id]).filter((d): d is EnemyDef => !!d);
  if (mix.length === 0) return { waves: [], ambush };
  const depth = Math.max(1, node.depth);
  // every wave the solo size; the party adds whole waves (D159)
  const base = waveCount(depth);
  // New Game+ (D276): a room holds as many enemies as a zone 8 room of its depth: zone 8's budget, priced in this
  // zone's units (a cheap mix would otherwise buy more bodies than zone 8's). The share grows with it, so a room still
  // pays the same Shards and loot. Never fewer than the zone's own budget buys.
  const bz = budgetZone(layout.zone, layout.cycle);
  const ngMore = bz === layout.zone ? 1 : Math.max(1, (threatBudget(depth, bz) / threatBudget(depth, layout.zone)) * (avgUnitCost(mix) / avgUnitCost(rosterOf(bz))));
  const per = (threatBudget(depth, layout.zone) * ngMore * ROOM_ENEMY_MULT) / base;
  const cap = maxPerWave(p);
  const roleCap = 2;
  const n = waveCountFor(depth, p);
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
        // a wave's casters and heavies stay readable: 2 of each, growing with the party like the room does (D150)
        if ((d.role === 'caster' || d.role === 'support') && rc >= roleCap) return false;
        if ((d.role === 'brute' || d.role === 'tank') && rc >= roleCap) return false;
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
  // New Game+ (D294): every combat room has at least one Elite
  if (layout.cycle >= 1 && elites === 0) ensureNgElite(stream(layout.seed, `ngElite:${layout.zone}:${layout.cycle}:${node.id}${p > 1 ? `:p${p}` : ''}`), waves, mix);
  return { waves, ambush, baseWaves: base, share: (ROOM_ENEMY_MULT * n * ngMore) / base };
}

/** Shards one player gets from a full clear of the room (no elites), for the tuning test. */
export function planShards(plan: RoomPlan, shardOf: (defId: string) => number, players = 1): number {
  let s = 0;
  for (const w of plan.waves) for (const u of w) s += shardOf(u.defId) * (ENEMIES[u.defId]?.swarm?.pieces ?? 1);
  return s / (plan.share ?? roomCountMult(players));
}
