// Elite rolls (GAME_DESIGN §6.4): 8% of non-swarm spawns solo, never bosses, at most 2 per room solo. With more
// players Elites come more often (D79): 12%, 16%, 20% with 2, 3, 4 players, and up to 2 per player per room.
import type { Rng } from '../../engine/rng';
import { ELITE_AFFIXES, type EliteAffix, type EnemyDef } from '../types';

export const ELITE_RATE = 0.08;
export const MAX_ELITES_PER_ROOM = 2;

export function eliteRate(players: number): number {
  return ELITE_RATE + 0.04 * (Math.max(1, players) - 1);
}

export function rollElite(rng: Rng, def: EnemyDef, elitesInRoom: number, players = 1): EliteAffix | null {
  if (def.role === 'swarm' || def.special || elitesInRoom >= MAX_ELITES_PER_ROOM * Math.max(1, players)) return null;
  if (!rng.chance(eliteRate(players))) return null;
  return rng.pick(ELITE_AFFIXES);
}
