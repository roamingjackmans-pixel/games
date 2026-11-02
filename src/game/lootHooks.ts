// Loot hooks the session calls (the loot module installs the real ones; defaults keep the game playable).
import type { Entity } from './world';
import type { GameSession } from './session';

export interface LootHooks {
  enemyDrops(s: GameSession, e: Entity, killerId: number): void;
  chest(s: GameSession, p: Entity, chestId: string, kind: 'small' | 'treasure' | 'mimic' | 'boss', x: number, y: number): void;
  reliquary(s: GameSession, p: Entity, x: number, y: number): void;
  instructor(s: GameSession, x: number, y: number): void;
}

export const lootHooks: LootHooks = {
  enemyDrops: () => undefined,
  chest: (s, _p, _id, _k, x, y) => {
    for (const pl of s.w.players) {
      const c = pl.pl!.char;
      c.consumables.throwing_knife = Math.min(10, (c.consumables.throwing_knife ?? 0) + 2);
    }
    s.w.fx('levelup', x, y);
  },
  reliquary: () => undefined,
  instructor: () => undefined,
};

