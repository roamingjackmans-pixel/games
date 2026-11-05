// D203: shooting a bow held one-handed takes it in both hands and shoots on the same press.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';

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

describe('bow and crossbow volleys (D205)', () => {
  const shoot = (classId: 'hunter' | 'knight', weapon?: string): number[] => {
    const c = newCharacter(classId, 'Joe', 'p1', new Rng(1));
    if (weapon) c.equipment.main = makeItem(weapon, 'common', 1);
    c.twoHanded = true;
    const w = new World('VOLLEY', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.attack, pressed: ACTION_BIT.attack };
    for (let i = 0; i < 90; i++) {
      stepWorld(w);
      p.pl!.input = { ...p.pl!.input, pressed: 0, buttons: 0 };
      const shots = [...w.entities.values()].filter((e) => e.type === 'projectile' && e.pr?.ownerId === p.id);
      if (shots.length) return shots.map((s) => Math.round((Math.atan2(s.vy, s.vx) * 180) / Math.PI * 10) / 10).sort((a, b) => a - b);
    }
    return [];
  };
  it('a bow shoots three arrows at once: straight ahead and 5° to each side', () => {
    expect(shoot('hunter')).toEqual([-5, 0, 5]);
  });
  it('so does a crossbow', () => {
    expect(shoot('knight', 'crossbow')).toEqual([-5, 0, 5]);
  });
});
