// D329: a player takes no damage with nothing to fight. Tests that hurt a player in an empty room put a still,
// harmless Practice Dummy in a corner first, so the room counts as a fight.
import type { Entity, World } from '../../src/game/world';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { DUMMY_STILL } from '../../src/data/enemies/special';

export function inCombat(w: World, x = 48, y = 48): Entity {
  const d = spawnEnemy(w, DUMMY_STILL, x, y, { tellS: 0 });
  d.en!.state = 'idle';
  return d;
}
