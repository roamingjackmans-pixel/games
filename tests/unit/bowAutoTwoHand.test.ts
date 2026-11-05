// D203: shooting a bow held one-handed takes it in both hands and shoots on the same press.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';

describe('bow auto two-hand (D203)', () => {
  it('attack with a one-handed bow: two-hands it and shoots', () => {
    const c = newCharacter('hunter', 'Joe', 'p1', new Rng(1));
    c.twoHanded = false;
    const w = new World('BOW', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 600, 368);
    expect(p.pl!.derived.weapon.twoHandOnly).toBe(true);
    expect(p.pl!.derived.twoHanded).toBe(false);
    p.pl!.input = { ...emptyInput(), aimX: 800, aimY: 368, buttons: ACTION_BIT.attack, pressed: ACTION_BIT.attack };
    stepWorld(w);
    expect(c.twoHanded).toBe(true);
    expect(p.pl!.derived.twoHanded).toBe(true);
    expect(p.pl!.state).toBe('attack');
    expect(p.pl!.combo).not.toBeNull();
  });
});
