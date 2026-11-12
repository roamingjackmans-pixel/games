import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { planRoom } from '../../src/game/procgen/waves';
import { roomEnemyDmgTrim } from '../../src/data/roles';
import { World, type Entity } from '../../src/game/world';
import type { EliteAffix } from '../../src/game/types';

/** A session in `zone` at `cycle`, in the first combat room, fighting: the enemies its waves spawned. */
function fightingRoom(zone: number, cycle: number): { s: GameSession; foes: Entity[] } {
  const c = newCharacter('knight', 'Joe', 'p', new Rng('rd'));
  c.cycle = cycle;
  c.tutorialDone = true;
  c.level = 60;
  const save = newSave(1, c, 'ROOMDMG');
  save.world.zone = zone;
  const s = new GameSession(save);
  s.start();
  const room = s.layout.rooms.filter((r) => r.kind === 'combat').sort((a, b) => a.id.localeCompare(b.id)).find((r) => planRoom(s.layout, r).waves.length > 0 && !planRoom(s.layout, r).bonusBoss)!;
  s.enterRoom(room.id, s.layout.byId[room.id]!.doors[0]!);
  const me = s.w.players[0]!;
  me.x = 640;
  me.y = 368;
  s.tick(0.016);
  const foes = s.w.enemies.filter((e) => !e.hp?.dead && !e.en!.isBoss && !e.en!.def.traits?.mimic);
  return { s, foes };
}

describe('zone 3 room enemies hit 25% harder (D363)', () => {
  it('has the trim in zone 3 only', () => {
    expect([1, 2, 3, 4, 8].map(roomEnemyDmgTrim)).toEqual([1, 1, 1.25, 1, 1]);
  });

  it.each([0, 1])("every enemy a zone 3 room's waves spawn hits ×1.25 (cycle %i), and a zone 2 room's are unchanged", (cycle) => {
    for (const [zone, k] of [[3, 1.25], [2, 1]] as const) {
      const { foes } = fightingRoom(zone, cycle);
      expect(foes.length).toBeGreaterThan(0);
      const w = new World('ref');
      for (const e of foes) {
        const ref = spawnEnemy(w, e.en!.def as never, 0, 0, { zone, cycle, players: 1, elite: e.en!.elite as EliteAffix | null });
        // a co-op rescale does not touch damage; the room's own spawn differs from the plain one only by the trim
        expect(e.en!.dmgMult / ref.en!.dmgMult).toBeCloseTo(k, 6);
      }
    }
  });
});
