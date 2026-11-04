// D170: the co-op lobby shows each player as they are now: worn gear travels with the lobby and is checked.
import { describe, expect, it } from 'vitest';
import { gearOf, previewCharacter } from '../../src/game/net/lobbyGear';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { Rng } from '../../src/engine/rng';
import type { PublicPlayer } from '../../src/game/net/protocol';

const player = (gear: PublicPlayer['gear']): PublicPlayer => ({ peerId: 'p', playerId: 'id', name: 'Joe', classId: 'knight', level: 3, host: false, cycle: 0, gear });

describe('lobby gear (D170)', () => {
  it('round-trips what a character wears, empty slots included', () => {
    const c = newCharacter('knight', 'Joe', 'id', new Rng(1));
    c.equipment.off = makeItem('tower_greatshield', 'rare');
    c.equipment.head = null;
    const leg = makeItem('greathammer', 'legendary');
    leg.name = 'The Big Hammer';
    c.equipment.main = leg;
    c.twoHanded = true;
    const p = previewCharacter(player(gearOf(c)));
    expect(p.equipment.off?.baseId).toBe('tower_greatshield');
    expect(p.equipment.head).toBeNull();
    expect(p.equipment.main?.baseId).toBe('greathammer');
    expect(p.equipment.main?.name).toBe('The Big Hammer');
    expect(p.twoHanded).toBe(true);
  });

  it('drops anything that is not a real base for its slot, and keeps the class kit without gear', () => {
    const p = previewCharacter(player({ main: { b: 'tower_greatshield', r: 'rare' }, off: { b: 'nope', r: 'common' }, head: { b: 'longsword', r: 'epic' }, body: { b: 'forgeplate_body', r: 'bogus' as never } }));
    expect(p.equipment.main).toBeNull();
    expect(p.equipment.off).toBeNull();
    expect(p.equipment.head).toBeNull();
    expect(p.equipment.body?.baseId).toBe('forgeplate_body');
    expect(p.equipment.body?.rarity).toBe('common');
    const kit = previewCharacter(player(undefined));
    expect(kit.equipment.main?.baseId).toBe(newCharacter('knight', 'Joe', 'id').equipment.main?.baseId);
  });
});
