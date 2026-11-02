// The enemy table registry: every zone roster plus special (non-roster) enemies.
import type { EnemyDef } from '../../game/types';
import { SPECIAL_ENEMIES } from './special';

export const ENEMIES: Record<string, EnemyDef> = {
  ...SPECIAL_ENEMIES,
};

export function enemyDef(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Unknown enemy ${id}`);
  return d;
}

export function rosterOf(zone: number): EnemyDef[] {
  return Object.values(ENEMIES).filter((e) => e.zone === zone && !e.special);
}
