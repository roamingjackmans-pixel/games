// D228: a 2nd off hand (swapped with Interact held + swap weapon), four ring slots, staffs and talismans in either hand.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { computeDerived } from '../../src/game/player/derived';
import { stepWorld } from '../../src/game/sim';
import { makeItem } from '../../src/game/items/make';
import { equip, defaultSlotFor, slotAccepts } from '../../src/game/items/inventory';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { newSave, normalizeSave } from '../../src/game/save/schema';
import { Rng } from '../../src/engine/rng';

describe('the 2nd off hand and four rings (D228)', () => {
  it('Interact held + swap weapon swaps the off hand; swap weapon alone swaps the weapon', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.twoHanded = false;
    const tal = makeItem('wooden_talisman', 'common', 1);
    c.bag.push(tal);
    expect(equip(c, tal.id, 'altOff').ok).toBe(true);
    expect(c.altOff?.id).toBe(tal.id);
    const w = new World('OFF', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 600, 368);
    const shield = c.equipment.off!;
    p.pl!.input = { ...emptyInput(), buttons: ACTION_BIT.swapWeapon | ACTION_BIT.interact, pressed: ACTION_BIT.swapWeapon };
    stepWorld(w);
    expect(c.equipment.off?.id).toBe(tal.id);
    expect(c.altOff?.id).toBe(shield.id);
    expect(p.pl!.derived.offTool?.def.school).toBe('prayer');
    // the weapon did not move
    expect(c.equipment.main?.baseId).toBe('longsword');
  });

  it('only the off hand in use weighs anything', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const before = computeDerived(c).load.load;
    c.altOff = makeItem('tower_greatshield', 'common', 1);
    expect(computeDerived(c).load.load).toBe(before);
  });

  it('four ring slots fill in turn; staffs and talismans fit either hand, shields only the off hands', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    for (let i = 0; i < 4; i++) {
      const r = makeItem('lucky_charm', 'rare', 1);
      c.bag.push(r);
      expect(equip(c, r.id).ok).toBe(true);
    }
    expect([c.equipment.ring1, c.equipment.ring2, c.equipment.ring3, c.equipment.ring4].every(Boolean)).toBe(true);
    expect(computeDerived(c).ringCounts.lucky_charm).toBe(4);
    expect(defaultSlotFor(c, makeItem('lucky_charm', 'rare', 1))).toBe('ring1');
    const staff = makeItem('apprentice_staff', 'common', 1);
    for (const s of ['main', 'altMain', 'off', 'altOff'] as const) expect(slotAccepts(s, staff)).toBe(true);
    const shield = makeItem('buckler', 'common', 1);
    expect(slotAccepts('altOff', shield)).toBe(true);
    expect(slotAccepts('altMain', shield)).toBe(false);
  });

  it('an older save gets the new slots, empty', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const s = newSave(1, c, 'S');
    const ch = s.character as unknown as Record<string, unknown> & { equipment: Record<string, unknown> };
    delete ch.altOff;
    delete ch.equipment.ring3;
    delete ch.equipment.ring4;
    normalizeSave(s);
    expect(s.character.altOff).toBeNull();
    expect(s.character.equipment.ring3).toBeNull();
    expect(s.character.equipment.ring4).toBeNull();
  });
});
