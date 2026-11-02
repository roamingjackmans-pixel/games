// The enemy table registry: every zone roster plus special (non-roster) enemies.
import type { EnemyDef } from '../../game/types';
import { SPECIAL_ENEMIES } from './special';
import { CRYPT } from './crypt';
import { CAVERNS } from './caverns';
import { SEWERS } from './sewers';
import { FOREST } from './forest';
import { FORGE } from './forge';
import { RELIQUARY } from './reliquary';
import { CITADEL } from './citadel';
import { ABYSS } from './abyss';

export const ENEMIES: Record<string, EnemyDef> = {
  ...SPECIAL_ENEMIES,
  ...CRYPT,
  ...CAVERNS,
  ...SEWERS,
  ...FOREST,
  ...FORGE,
  ...RELIQUARY,
  ...CITADEL,
  ...ABYSS,
};

export function enemyDef(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Unknown enemy ${id}`);
  return d;
}

export function rosterOf(zone: number): EnemyDef[] {
  return Object.values(ENEMIES).filter((e) => e.zone === zone && !e.special);
}
