// Installs the real loot hooks into the session (M5): enemy drops, chests, reliquaries, The Instructor.
import { lootHooks } from './lootHooks';
import type { GameSession } from './session';
import { chestDrops, enemyDrops, instructorDrops, reliquaryDrops, type DropContext } from './items/drops';

function ctx(s: GameSession): DropContext {
  return { w: s.w, seed: s.save.world.seed, zone: s.layout.zone, cycle: s.save.character.cycle };
}

lootHooks.enemyDrops = (s, e) => enemyDrops(ctx(s), e);
lootHooks.chest = (s, _p, id, kind, x, y) => chestDrops(ctx(s), id, kind, x, y);
lootHooks.reliquary = (s, _p, x, y) => reliquaryDrops(ctx(s), s.node.id, x, y);
lootHooks.instructor = (s, x, y) => instructorDrops(ctx(s), x, y);

export const LOOT_INSTALLED = true;
