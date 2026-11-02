// Shard tuning helper (GAME_DESIGN §2.3): expected Shards from clearing every room of a zone once.
import { generateZone } from './zone';
import { planRoom, planShards } from './waves';
import { ENEMIES } from '../../data/enemies';
import { ROLE_STATS, SHARD_SCALE, zoneShardFactor } from '../../data/roles';
import { enemyShardMult, levelCostRange } from '../combat/formulas';

export const EXPECTED_LEVEL = [1, 12, 22, 32, 42, 52, 62, 72, 80];

export function zoneShardYield(z: number, seeds = 100, factor = zoneShardFactor(z)): number {
  let tot = 0;
  for (let s = 0; s < seeds; s++) {
    const L = generateZone(`S${s}`, z, {});
    for (const r of L.rooms)
      tot += planShards(planRoom(L, r), (id) => ROLE_STATS[ENEMIES[id]!.role].shards * SHARD_SCALE * factor * (ENEMIES[id]!.mult?.shards ?? 1) * enemyShardMult(z, 0));
  }
  return tot / seeds;
}

export function zoneShardNeed(z: number): number {
  return levelCostRange(EXPECTED_LEVEL[z - 1]!, EXPECTED_LEVEL[z]!);
}
