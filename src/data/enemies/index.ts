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
import { VEXTHORN_PARTS } from '../bosses/forest';
import { FOREMAN_IGNATIUS_PARTS } from '../bosses/forge';
import { SAINT_AURELIA_PARTS } from '../bosses/reliquary';
import { ARCHMAGISTER_TOCK_PARTS } from '../bosses/citadel';
import { THE_LANDLORD_PARTS } from '../bosses/abyss';

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
  // boss-only bodies and summons (fey lights, ice mirrors, a second body…)
  ...VEXTHORN_PARTS,
  ...FOREMAN_IGNATIUS_PARTS,
  ...SAINT_AURELIA_PARTS,
  ...ARCHMAGISTER_TOCK_PARTS,
  ...THE_LANDLORD_PARTS,
};

export function enemyDef(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Unknown enemy ${id}`);
  return d;
}

export function rosterOf(zone: number): EnemyDef[] {
  return Object.values(ENEMIES).filter((e) => e.zone === zone && !e.special);
}
