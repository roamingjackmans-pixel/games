// D462: the Bloatking's second phase floods the hall again, at 35% less than it used to (19.5% slower off the grates,
// was 30%; D461 had removed it). The New Game+ third phase keeps the second phase's arena, flood included.
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { applyArenaChanges } from '../../src/game/boss/arena';
import { speedMult } from '../../src/game/combat/state';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { Room, T, worldToTile } from '../../src/game/room';
import { World } from '../../src/game/world';
import { Rng } from '../../src/engine/rng';

describe("the Bloatking's flood (D462)", () => {
  it('phase 1 has none; phase 2 floods at 0.195 and keeps its whirlpool', () => {
    const def = BOSSES.bloatking!;
    expect((def.phases[0]!.arena ?? []).map((c) => c.op)).not.toContain('floodAll');
    const p2 = def.phases[1]!.arena ?? [];
    expect(p2.find((c) => c.op === 'floodAll')?.value).toBeCloseTo(0.3 * (1 - 0.35), 9);
    expect(p2.map((c) => c.op)).toContain('movingFloor');
  });

  it('after his phase-2 arena change a player off the grates walks 19.5% slower, on a grate at full speed', () => {
    const w = new World('TEST', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 300, 368);
    expect(speedMult(p, w)).toBe(1);
    applyArenaChanges(w, BOSSES.bloatking!.phases[1]!.arena ?? [], null);
    expect(speedMult(p, w)).toBeCloseTo(0.805, 9);
    const [tx, ty] = worldToTile(p.x, p.y);
    w.room.set(tx, ty, T.Grate);
    expect(speedMult(p, w)).toBe(1);
  });
});
