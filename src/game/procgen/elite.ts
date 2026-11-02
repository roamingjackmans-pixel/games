// Elite rolls (GAME_DESIGN §6.4): 8% of non-swarm spawns, never bosses, max 2 per room.
import type { Rng } from '../../engine/rng';
import { ELITE_AFFIXES, type EliteAffix, type EnemyDef } from '../types';

export const ELITE_RATE = 0.08;
export const MAX_ELITES_PER_ROOM = 2;

export function rollElite(rng: Rng, def: EnemyDef, elitesInRoom: number): EliteAffix | null {
  if (def.role === 'swarm' || def.special || elitesInRoom >= MAX_ELITES_PER_ROOM) return null;
  if (!rng.chance(ELITE_RATE)) return null;
  return rng.pick(ELITE_AFFIXES);
}
