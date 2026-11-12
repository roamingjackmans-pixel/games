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
 * New Game+ boss HP, by the boss's own zone (D301; refitted with D307's levels and D311's stat curve): sized so the median build of the balance report
 * (docs/balance/report.md, nonstop light attacks) takes about 5 minutes on a zone boss and 8 on the Landlord in NG+1,
 * and about 8 and 11 minutes from NG+2 on. Later cycles use the NG+2 column on top of the usual cycle growth.
 */
export const NG_BOSS_HP: Record<1 | 2, Record<number, number>> = {
  1: { 1: 1.52, 2: 1.88, 3: 2.16, 4: 2.03, 5: 1.56, 6: 1.73, 7: 1.9, 8: 1.34 },
  2: { 1: 2.7, 2: 2.89, 3: 3.1, 4: 2.67, 5: 1.89, 6: 1.94, 7: 1.97, 8: 1.15 },
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

/**
 * The longer stat curve (D311) makes a player stronger from the late first playthrough on; enemies grow by 70% of the
 * gain (owner: "30% less") through NG+2. Measured on the balance report's builds at each zone's expected level: the
 * damage gain (new curve and 999 cap against the old curve and 99 cap) sets enemy HP, the HP gain sets enemy damage.
 * From NG+3 on the cycle's own factors take over (NG_LATE), since the old curve stopped growing there at all.
 */
export const STAT_CURVE_COMP: { hp: Record<0 | 1 | 2, Record<number, number>>; dmg: Record<0 | 1 | 2, Record<number, number>> } = {
  hp: { 0: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1.021 }, 1: { 1: 1.082, 2: 1.139, 3: 1.186, 4: 1.227, 5: 1.274, 6: 1.323, 7: 1.383, 8: 1.436 }, 2: { 1: 1.498, 2: 1.559, 3: 1.605, 4: 1.652, 5: 1.706, 6: 1.76, 7: 1.821, 8: 1.881 } },
  dmg: { 0: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 }, 1: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1.011, 7: 1.024, 8: 1.048 }, 2: { 1: 1.076, 2: 1.102, 3: 1.133, 4: 1.161, 5: 1.188, 6: 1.214, 7: 1.245, 8: 1.266 } },
};

/**
 * NG+3 on (D311): HP and damage of every enemy and boss by cycle, on top of everything else. HP keeps boss fights
 * near 8 minutes (the Landlord 11) through NG+7 and a little longer after; damage lets a build grow sturdier through
 * NG+7, then climbs so NG+10 takes real skill. Cycles past the table use its last entry.
 */
export const NG_LATE: Record<number, { hp: number; dmg: number }> = {
  3: { hp: 1.5, dmg: 1.06 },
  4: { hp: 1.2, dmg: 0.74 },
  5: { hp: 1.26, dmg: 0.74 },
  6: { hp: 1.28, dmg: 0.73 },
  7: { hp: 1.29, dmg: 0.69 },
  8: { hp: 1.33, dmg: 0.84 },
  9: { hp: 1.36, dmg: 1.09 },
  10: { hp: 1.4, dmg: 1.57 },
};

export function statCurveComp(kind: 'hp' | 'dmg', zone: number, cycle: number): number {
  const z = Math.max(1, Math.min(8, zone));
  if (cycle <= 2) return STAT_CURVE_COMP[kind][Math.max(0, cycle) as 0 | 1 | 2][z] ?? 1;
  const keys = Object.keys(NG_LATE).map(Number).filter((k) => k <= cycle);
  if (keys.length === 0) return 1;
  return NG_LATE[Math.max(...keys)]![kind];
}

/**
 * D325: New Game+ levels cost twice the Shards (about L245 at the end of NG+3 on one clear of each zone, was about L411),
 * so players there are weaker than every table above assumed. These factors take back what the slower levels take away:
 * fitted on the balance report so its builds, at their new levels, see the same room and boss kill times and the same
 * hits to die as before. By cycle (cycles past the table use its last row, 8 and 9 the step between 7 and 10), then
 * zone 1–8.
 */
// LEVEL_PACE_COMP:BEGIN
export const LEVEL_PACE_COMP: Record<number, { hp: number[]; dmg: number[]; bossHp: number[] }> = {
  1: { hp: [0.981, 0.927, 0.861, 0.833, 0.8, 0.805, 0.765, 0.786], dmg: [0.986, 0.953, 0.933, 0.91, 0.886, 0.864, 0.808, 0.788], bossHp: [1, 0.998, 0.999, 1.014, 1.022, 0.994, 1.003, 1.009] },
  2: { hp: [0.815, 0.818, 0.872, 0.881, 0.902, 0.92, 0.932, 0.93], dmg: [0.758, 0.73, 0.722, 0.725, 0.716, 0.718, 0.691, 0.695], bossHp: [0.998, 1.019, 0.988, 0.998, 1.011, 1.015, 1, 0.994] },
  3: { hp: [0.92, 0.902, 0.921, 0.902, 0.925, 0.918, 0.929, 0.926], dmg: [0.703, 0.715, 0.74, 0.758, 0.776, 0.806, 0.831, 0.855], bossHp: [1.008, 1.021, 1.003, 1.016, 0.989, 0.995, 0.982, 0.984] },
  4: { hp: [0.917, 0.902, 0.897, 0.905, 0.905, 0.922, 0.911, 0.93], dmg: [0.866, 0.884, 0.914, 0.94, 0.959, 0.981, 1, 1], bossHp: [0.987, 1.004, 1.006, 1.003, 1.005, 0.993, 1.012, 0.996] },
  5: { hp: [0.927, 0.944, 0.946, 0.95, 0.95, 0.94, 0.953, 0.964], dmg: [1, 1, 1, 1, 1, 1, 1, 1], bossHp: [1.001, 0.995, 0.996, 1, 1.003, 1.016, 1.007, 1.001] },
  6: { hp: [0.949, 1, 0.971, 1, 0.974, 0.979, 0.976, 1], dmg: [1, 1, 1, 1, 1, 1, 1, 1], bossHp: [1.024, 0.972, 1.008, 0.982, 1.012, 1.013, 1.018, 0.998] },
  7: { hp: [0.974, 1, 1, 1, 1, 1, 1, 1], dmg: [1, 1, 1, 1, 1, 1, 1, 1], bossHp: [1.025, 1, 1, 1, 1, 1, 1, 1] },
  10: { hp: [1, 1, 1, 1, 1, 1, 1, 1], dmg: [1, 1, 1, 1, 1, 1, 1, 1], bossHp: [1, 1, 1, 1, 1, 1, 1, 1] },
};
// LEVEL_PACE_COMP:END

export function levelPaceComp(kind: 'hp' | 'dmg' | 'bossHp', zone: number, cycle: number): number {
  if (cycle < 1) return 1;
  const z = Math.max(1, Math.min(8, zone)) - 1;
  const row = (c: number): number => LEVEL_PACE_COMP[c]?.[kind][z] ?? 1;
  const keys = Object.keys(LEVEL_PACE_COMP).map(Number);
  if (!keys.length) return 1;
  const last = Math.max(...keys);
  if (cycle >= last) return row(last);
  if (LEVEL_PACE_COMP[cycle]) return row(cycle);
  // between rows (NG+8, NG+9): the geometric step
  const lo = Math.max(...keys.filter((k) => k < cycle));
  const hi = Math.min(...keys.filter((k) => k > cycle));
  return row(lo) * Math.pow(row(hi) / row(lo), (cycle - lo) / (hi - lo));
}

/**
 * D352: the early New Game+ zones were too tanky, so room enemies (not bosses or special NPCs) lose a share of their HP
 * by cycle and zone, on top of every other curve (and kept out of LEVEL_PACE_COMP, which is refitted by script).
 * NG+1: zone 1 −60%, zone 2 −44%, zone 3 −25%, zone 4 −16%. NG+2: zone 1 −15%. Everything else stays 1.
 * D366: then NG+1 zones 3 and 4 get 15% back (0.75 × 1.15, 0.84 × 1.15), so they read −13.75% and −3.4%.
 */
export const NG_ENEMY_HP_TRIM: Record<number, Record<number, number>> = {
  1: { 1: 0.4, 2: 0.56, 3: 0.75 * 1.15, 4: 0.84 * 1.15 },
  2: { 1: 0.85 },
};

/**
 * D353: bosses in NG+1 and NG+2 have half the HP. D354: the trim then climbs back to 1 over NG+3–NG+6 so the next cycle
 * is not a jump (a boss went 3–4.5× from NG+2 to NG+3 with the half gone): NG+7 on is the plain D301 / D311 curve.
 */
export const NG_BOSS_HP_TRIM: Record<number, number> = { 1: 0.5, 2: 0.5, 3: 0.6, 4: 0.7, 5: 0.8, 6: 0.9 };

/** D367: on top of that, the zone 3 and 4 bosses have 15% more HP in NG+1. By zone, then cycle. */
export const NG_BOSS_ZONE_HP_TRIM: Record<number, Record<number, number>> = { 3: { 1: 1.15 }, 4: { 1: 1.15 } };

export function ngBossHpTrim(cycle: number, zone = 0): number {
  return (NG_BOSS_HP_TRIM[cycle] ?? 1) * (NG_BOSS_ZONE_HP_TRIM[zone]?.[cycle] ?? 1);
}

export function ngEnemyHpTrim(zone: number, cycle: number): number {
  return NG_ENEMY_HP_TRIM[cycle]?.[Math.max(1, Math.min(8, zone))] ?? 1;
}

/**
 * D355: lifesteal heals 4× what it did. The player's total (Leeching, the Leech gem, the Hungering power, set perks,
 * weapon proficiency) is multiplied once in computeDerived, and the cards show the multiplied number (lifestealShown),
 * so saved items keep their rolls and everything still reads true.
 */
export const LIFESTEAL_MULT = 4;
/** What a lifesteal figure on a card reads: its stored number times the multiplier (share of max HP, before ×100). */
export const lifestealShown = (v: number): number => v * LIFESTEAL_MULT;

/** D314: bosses hit 75% harder from NG+1 on (they had fallen behind); every later cycle grows from there. */
export const NG_BOSS_DMG_MULT = 1.75;
export function ngBossDmgMult(cycle: number): number {
  return cycle >= 1 ? NG_BOSS_DMG_MULT : 1;
}

/**
 * D362: a zone's boss hits harder in one cycle than the curve gives it, a factor on top of every other one: zone 2's boss
 * (Mother Spore) ×1.15 in NG+1. By zone, then cycle; anything not listed is 1.
 */
/**
 * D363: the room enemies of a zone hit harder than its curve gives them, a factor on top of every other one, in every
 * cycle (zone 3 ×1.25). Only what the zone's waves spawn: bosses, what they summon in their arena, Mimics and special
 * NPCs keep the plain curve. Anything not listed is 1.
 */
export const ZONE_ROOM_ENEMY_DMG: Record<number, number> = { 3: 1.25 };

export function roomEnemyDmgTrim(zone: number): number {
  return ZONE_ROOM_ENEMY_DMG[Math.max(1, Math.min(8, zone))] ?? 1;
}

export const NG_BOSS_DMG_TRIM: Record<number, Record<number, number>> = {
  2: { 1: 1.15 },
};

export function ngBossDmgTrim(zone: number, cycle: number): number {
  return NG_BOSS_DMG_TRIM[Math.max(1, Math.min(8, zone))]?.[cycle] ?? 1;
}

export function ngZoneEnemyDmg(zone: number, cycle: number): number {
  return cycle >= 1 ? (NG_ZONE_ENEMY_DMG[Math.max(1, Math.min(8, zone))] ?? 1) : 1;
}
