// D291: a crossbow goes in any of the four weapon slots, like a staff or talisman; in the off hand the block button
// shoots it, with its own damage and stamina cost.
import { describe, expect, it } from 'vitest';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { equip, isEitherHandItem, slotAccepts } from '../../src/game/items/inventory';
import { computeDerived } from '../../src/game/player/derived';

const shots = (w: World, p: Entity): Entity[] => [...w.entities.values()].filter((e) => e.type === 'projectile' && e.pr?.ownerId === p.id);

describe('a crossbow in any weapon slot (D291)', () => {
  it('goes in the weapon hand, the off hand and both second slots; a sword still does not go in the off hand', () => {
    const xb = makeItem('crossbow', 'common', 1);
    expect(isEitherHandItem(xb)).toBe(true);
    for (const s of ['main', 'off', 'altMain', 'altOff'] as const) expect(slotAccepts(s, xb)).toBe(true);
    const sword = makeItem('longsword', 'common', 1);
    expect(isEitherHandItem(sword)).toBe(false);
    expect(slotAccepts('off', sword)).toBe(false);
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
    c.bag.push(xb);
    expect(equip(c, xb.id, 'off').ok).toBe(true);
    expect(c.equipment.off?.id).toBe(xb.id);
  });

  it('in the off hand it has its own power; two-handing sets it aside', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
    c.equipment.off = makeItem('crossbow', 'common', 1);
    c.twoHanded = false;
    const d = computeDerived(c);
    expect(d.offWeapon?.def.id).toBe('crossbow');
    expect(d.offWeapon!.power).toBeGreaterThan(0);
    c.twoHanded = true;
    expect(computeDerived(c).offWeapon).toBeNull();
  });

  it('the block button shoots it (three bolts), does not block, and keeps the sword where it was', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
    c.equipment.off = makeItem('crossbow', 'common', 1);
    c.twoHanded = false;
    const w = new World('OFFXB', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const stam0 = p.stam!.cur;
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.block, pressed: ACTION_BIT.block };
    stepWorld(w);
    expect(p.pl!.combo?.offHand).toBe(true);
    expect(p.pl!.blocking).toBe(false);
    expect(p.stam!.cur).toBeLessThan(stam0);
    let fired: Entity[] = [];
    for (let i = 0; i < 90 && !fired.length; i++) {
      p.pl!.input = { ...p.pl!.input, pressed: 0 };
      stepWorld(w);
      expect(p.pl!.blocking).toBe(false);
      fired = shots(w, p);
    }
    expect(fired.length).toBe(3);
    // the bolts carry the crossbow's power, not the longsword's
    const d = p.pl!.derived;
    const sum = (s: Entity): number => Object.values(s.pr!.dmg).reduce((a, b) => a + (b ?? 0), 0);
    const xbSwing = d.offWeapon!.def.combo[0]!.mult;
    expect(sum(fired[0]!)).toBeCloseTo(d.offWeapon!.power * xbSwing * (1 + d.dmgPct), 3);
    expect(d.offWeapon!.power).not.toBeCloseTo(d.weaponPower, 3);
    expect(p.pl!.nextComboIdx).toBe(0);
  });

  it('with a shield in the off hand the block button still blocks', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
    c.twoHanded = false;
    const w = new World('SHIELD', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    expect(p.pl!.derived.offWeapon).toBeNull();
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.block, pressed: ACTION_BIT.block };
    stepWorld(w);
    expect(p.pl!.blocking).toBe(true);
    expect(p.pl!.combo).toBeNull();
  });
});
