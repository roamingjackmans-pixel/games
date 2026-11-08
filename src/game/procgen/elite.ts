// Elite rolls (GAME_DESIGN §6.4): 8% of non-swarm spawns solo, never bosses, at most 2 per room solo. With more
// players Elites come more often (D79): 12%, 16%, 20% with 2, 3, 4 players, and up to 2 per player per room.
import type { Rng } from '../../engine/rng';
import { ELITE_AFFIXES, type EliteAffix, type EnemyDef } from '../types';
import { ENEMIES } from '../../data/enemies';

export const ELITE_RATE = 0.08;
export const MAX_ELITES_PER_ROOM = 2;

export function eliteRate(players: number): number {
  return ELITE_RATE + 0.04 * (Math.max(1, players) - 1);
}

/** Can this enemy be an Elite? Never a swarm piece or a special enemy (GAME_DESIGN §6.4). */
export function canBeElite(def: EnemyDef | undefined): boolean {
  return !!def && def.role !== 'swarm' && !def.special;
}

/**
 * New Game+ (D296): a room with no Elite gets one. An enemy that can be one, in the earliest wave that has one, is
 * made an Elite (seeded); if no wave has such an enemy, one of the zone's mix that can be is added to the first wave.
 */
export function ensureNgElite(rng: Rng, waves: { defId: string; elite: EliteAffix | null }[][], mix: EnemyDef[]): void {
  if (waves.some((wv) => wv.some((u) => u.elite))) return;
  for (const wv of waves) {
    const ok = wv.filter((u) => canBeElite(ENEMIES[u.defId]));
    if (!ok.length) continue;
    rng.pick(ok).elite = rng.pick(ELITE_AFFIXES);
    return;
  }
  const add = mix.filter((d) => canBeElite(d));
  if (add.length && waves[0]) waves[0].push({ defId: rng.pick(add).id, elite: rng.pick(ELITE_AFFIXES) });
}

export function rollElite(rng: Rng, def: EnemyDef, elitesInRoom: number, players = 1): EliteAffix | null {
  if (def.role === 'swarm' || def.special || elitesInRoom >= MAX_ELITES_PER_ROOM * Math.max(1, players)) return null;
  if (!rng.chance(eliteRate(players))) return null;
  return rng.pick(ELITE_AFFIXES);
}
