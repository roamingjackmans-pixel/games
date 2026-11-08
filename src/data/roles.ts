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
 * New Game+ (cycle 1 and later, D275, D287): extra damage for a zone's non-boss enemies, on top of everything above.
 * Zone 2 hits twice as hard, zone 8 65% harder, and zones 3 to 7 climb geometrically between them, by each zone
 * roster's average hit (zone 1 is unchanged). Bosses are not affected. Checked against the rosters by
 * tests/unit/ngZonesBonusBoss.test.ts.
 */
export const NG_ZONE_ENEMY_DMG: Record<number, number> = { 2: 2, 3: 1.64, 4: 1.59, 5: 1.5, 6: 1.37, 7: 1.34, 8: 1.65 }; // refitted after D308 raised weak attackers

/**
 * New Game+ boss HP, by the boss's own zone (D301; refitted with D307's levels): sized so the median build of the balance report
 * (docs/balance/report.md, nonstop light attacks) takes about 5 minutes on a zone boss and 8 on the Landlord in NG+1,
 * and about 8 and 11 minutes from NG+2 on. Later cycles use the NG+2 column on top of the usual cycle growth.
 */
export const NG_BOSS_HP: Record<1 | 2, Record<number, number>> = {
  1: { 1: 1.56, 2: 1.91, 3: 2.29, 4: 2.13, 5: 1.64, 6: 1.8, 7: 1.91, 8: 1.35 },
  2: { 1: 2.82, 2: 3.1, 3: 3.41, 4: 3.04, 5: 2.23, 6: 2.36, 7: 2.48, 8: 1.5 },
};

export function ngBossHpMult(zone: number, cycle: number): number {
  if (cycle < 1) return 1;
  return NG_BOSS_HP[cycle >= 2 ? 2 : 1][Math.max(1, Math.min(8, zone))] ?? 1;
}

/**
 * The levels New Game+ now buys (D307: about 300 by the end of NG+2, was about 136) make a player stronger; every
 * enemy and boss grows by 70% of that gain (owner: "30% less than the gain"). Measured on the balance report's builds
 * (same gear, the new level against the old): damage rose 1–7% (stats near their caps) and HP up to 31%, so enemy HP
 * grows by 70% of the damage gain and enemy damage by 70% of the HP gain. NG+3 on uses the NG+2 column.
 */
export const NG_LEVEL_COMP: { hp: Record<1 | 2, Record<number, number>>; dmg: Record<1 | 2, Record<number, number>> } = {
  hp: { 1: { 1: 1.004, 2: 1.012, 3: 1.019, 4: 1.024, 5: 1.034, 6: 1.041, 7: 1.048, 8: 1.044 }, 2: { 1: 1.041, 2: 1.039, 3: 1.037, 4: 1.035, 5: 1.033, 6: 1.033, 7: 1.029, 8: 1.029 } },
  dmg: { 1: { 1: 1, 2: 1.02, 3: 1.039, 4: 1.067, 5: 1.084, 6: 1.111, 7: 1.137, 8: 1.16 }, 2: { 1: 1.165, 2: 1.171, 3: 1.181, 4: 1.183, 5: 1.195, 6: 1.197, 7: 1.214, 8: 1.218 } },
};

export function ngLevelComp(kind: 'hp' | 'dmg', zone: number, cycle: number): number {
  if (cycle < 1) return 1;
  return NG_LEVEL_COMP[kind][cycle >= 2 ? 2 : 1][Math.max(1, Math.min(8, zone))] ?? 1;
}

export function ngZoneEnemyDmg(zone: number, cycle: number): number {
  return cycle >= 1 ? (NG_ZONE_ENEMY_DMG[Math.max(1, Math.min(8, zone))] ?? 1) : 1;
}
