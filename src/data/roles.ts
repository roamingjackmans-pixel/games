// CONTENT_ENEMIES §1: role base stats (zone 1, cycle 0, solo). Shard values ×5 per D39 (tuned against the level curve).
import type { Role } from '../game/types';

export interface RoleStats {
  hp: number;
  dmg: number;
  speed: number;
  poise: number;
  shards: number;
  drop: number;
  radius: number;
  /** threat cost for room budgets (PROCGEN §4) */
  cost: number;
  dropRow: 'fodder' | 'brute';
}

export const ROLE_STATS: Record<Role | 'mimic' | 'boss', RoleStats> = {
  fodder: { hp: 60, dmg: 18, speed: 150, poise: 0, shards: 20, drop: 0.18, radius: 18, cost: 2, dropRow: 'fodder' },
  swarm: { hp: 18, dmg: 8, speed: 240, poise: 0, shards: 5, drop: 0.04, radius: 9, cost: 3, dropRow: 'fodder' },
  ranged: { hp: 50, dmg: 20, speed: 130, poise: 10, shards: 25, drop: 0.3, radius: 17, cost: 3, dropRow: 'fodder' },
  caster: { hp: 55, dmg: 22, speed: 110, poise: 10, shards: 30, drop: 0.3, radius: 17, cost: 4, dropRow: 'fodder' },
  support: { hp: 55, dmg: 22, speed: 110, poise: 10, shards: 30, drop: 0.3, radius: 17, cost: 4, dropRow: 'fodder' },
  brute: { hp: 180, dmg: 40, speed: 110, poise: 60, shards: 70, drop: 0.3, radius: 30, cost: 6, dropRow: 'brute' },
  assassin: { hp: 70, dmg: 28, speed: 170, poise: 15, shards: 40, drop: 0.3, radius: 16, cost: 4, dropRow: 'brute' },
  tank: { hp: 150, dmg: 26, speed: 120, poise: 80, shards: 60, drop: 0.3, radius: 24, cost: 5, dropRow: 'brute' },
  hazard: { hp: 80, dmg: 20, speed: 90, poise: 20, shards: 40, drop: 0.3, radius: 20, cost: 4, dropRow: 'fodder' },
  mimic: { hp: 220, dmg: 45, speed: 200, poise: 70, shards: 100, drop: 1, radius: 22, cost: 6, dropRow: 'brute' },
  // D187: base HP doubled (was 1800); The Landlord sets his own (baseHp)
  boss: { hp: 3600, dmg: 45, speed: 140, poise: 200, shards: 1200, drop: 1, radius: 56, cost: 0, dropRow: 'brute' },
};

/** Shard multiplier applied to every role value (D39 "Shard values ×5"; tuned to the §2.3 target). */
export const SHARD_SCALE = 5;

/**
 * Per-zone Shard value factor (tuned, GAME_DESIGN §2.3): a full clear of a zone pays for its ten levels
 * within ±20%. Recomputed by tests/unit/procgen.test.ts whenever rosters or budgets change.
 */
export const ZONE_SHARD_FACTOR: Record<number, number> = { 1: 0.46, 2: 0.35, 3: 0.34, 4: 0.26, 5: 0.27, 6: 0.24, 7: 0.26, 8: 0.19 };

export function zoneShardFactor(zone: number): number {
  return ZONE_SHARD_FACTOR[Math.max(1, Math.min(8, zone))] ?? 1;
}

/** Extra damage from everything in a zone, bosses too, in every cycle (D231): zone 4 +10%, 5 and 6 +15%, 7 +35%. */
export const ZONE_DMG_FACTOR: Record<number, number> = { 4: 1.1, 5: 1.15, 6: 1.15, 7: 1.35 };

export function zoneDmgFactor(zone: number): number {
  return ZONE_DMG_FACTOR[Math.max(1, Math.min(8, zone))] ?? 1;
}

/**
 * New Game+ (cycle 1 and later, D275): extra damage for a zone's non-boss enemies, on top of everything above. Zone 2
 * hits twice as hard; zones 3 to 6 step geometrically from there to zone 8's level (zone 7 already sits above that
 * line and keeps its own; zones 1 and 8 are unchanged). Bosses are not affected. Checked against the zone curve by
 * tests/unit/ngZonesBonusBoss.test.ts.
 */
export const NG_ZONE_ENEMY_DMG: Record<number, number> = { 2: 2, 3: 1.78, 4: 1.44, 5: 1.22, 6: 1.09 };

export function ngZoneEnemyDmg(zone: number, cycle: number): number {
  return cycle >= 1 ? (NG_ZONE_ENEMY_DMG[Math.max(1, Math.min(8, zone))] ?? 1) : 1;
}
