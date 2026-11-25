// D461: the Bloatking's fight slows nobody. His second phase used to flood the hall (floodAll 0.3: everyone off the
// grates 30% slower), and the New Game+ third phase kept it; the whirlpool stays.
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { applyArenaChanges } from '../../src/game/boss/arena';
import { speedMult } from '../../src/game/combat/state';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { Room } from '../../src/game/room';
import { World } from '../../src/game/world';
import { Rng } from '../../src/engine/rng';

describe('the Bloatking slows nobody (D461)', () => {
  it('no phase floods the hall; phase 2 keeps its whirlpool', () => {
    const def = BOSSES.bloatking!;
    for (const ph of def.phases) expect((ph.arena ?? []).map((c) => c.op)).not.toContain('floodAll');
    expect((def.phases[1]!.arena ?? []).map((c) => c.op)).toContain('movingFloor');
  });

  it('after his phase-2 arena change a player off the grates walks at full speed', () => {
    const w = new World('TEST', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 300, 368);
    applyArenaChanges(w, BOSSES.bloatking!.phases[1]!.arena ?? [], null);
    expect(w.roomMods.floodUntil).toBe(0);
    expect(speedMult(p, w)).toBe(1);
  });
});
