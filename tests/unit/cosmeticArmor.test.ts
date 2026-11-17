// D435: cosmetic head, chest and leg slots. A piece there only changes how you look: defense, poise, perks, set pieces,
// gems and equip load all come from the equipped armor; a cosmetic piece holds no gems and weighs nothing.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { makeGem } from '../../src/data/gems';
import { computeDerived } from '../../src/game/player/derived';
import { BAG_SIZE, cosmeticItem, findItem, lookItem, removeCosmetic, uniqueItemId, wearCosmetic } from '../../src/game/items/inventory';
import { lookFor } from '../../src/render/entities';
import { gearOf } from '../../src/game/net/lobbyGear';
import { publicChar } from '../../src/game/net/snapshot';
import type { Character } from '../../src/game/types';

function joe(): Character {
  const c = newCharacter('knight', 'Joe', 'p-look', new Rng('LOOK'));
  for (const k of Object.keys(c.stats) as (keyof typeof c.stats)[]) c.stats[k] = 30;
  return c;
}

describe('cosmetic armor (D435)', () => {
  it('a bag piece worn for its look leaves the bag, gives up its gems, and swaps with the one there', () => {
    const c = joe();
    const helm = makeItem('caretakers_plate_head', 'rare', 5, { sockets: 2, gems: [makeGem('ember')] });
    expect(helm.sockets.filter(Boolean)).toHaveLength(1);
    const hood = makeItem('crypt_rags_head', 'common', 1);
    c.bag.push(helm, hood);
    const gems0 = c.gems.length;
    expect(wearCosmetic(c, helm.id).ok).toBe(true);
    expect(cosmeticItem(c, 'head')).toBe(helm);
    expect(c.bag).not.toContain(helm);
    expect(helm.sockets.every((g) => g === null)).toBe(true);
    expect(c.gems.length).toBe(gems0 + 1);
    // no menu finds it by id to socket, sell or reinforce
    expect(findItem(c, helm.id)).toBeNull();
    // another piece swaps the first back into the bag
    expect(wearCosmetic(c, hood.id).ok).toBe(true);
    expect(cosmeticItem(c, 'head')).toBe(hood);
    expect(c.bag).toContain(helm);
    // taking it off puts it back
    expect(removeCosmetic(c, 'head').ok).toBe(true);
    expect(cosmeticItem(c, 'head')).toBeNull();
    expect(c.bag).toContain(hood);
  });

  it('only head, chest and leg armor; a full bag keeps it on', () => {
    const c = joe();
    const ring = makeItem('ring_stillness', 'epic', 1);
    c.bag.push(ring);
    expect(wearCosmetic(c, ring.id).ok).toBe(false);
    const legs = makeItem('crypt_rags_legs', 'common', 1);
    c.bag.push(legs);
    expect(wearCosmetic(c, legs.id).ok).toBe(true);
    while (c.bag.length < BAG_SIZE) c.bag.push(makeItem('crypt_rags_head', 'common', 1));
    expect(removeCosmetic(c, 'legs').ok).toBe(false);
    expect(cosmeticItem(c, 'legs')).toBe(legs);
  });

  it('stats, set pieces and equip load come only from the equipped armor', () => {
    const c = joe();
    const before = computeDerived(c);
    const heavy = [makeItem('caretakers_plate_head', 'legendary', 40), makeItem('caretakers_plate_body', 'legendary', 40), makeItem('caretakers_plate_legs', 'legendary', 40)];
    c.bag.push(...heavy);
    for (const it of heavy) expect(wearCosmetic(c, it.id).ok).toBe(true);
    const after = computeDerived(c);
    expect(after.defense).toEqual(before.defense);
    expect(after.load.load).toBeCloseTo(before.load.load, 9);
    expect(after.poise).toBeCloseTo(before.poise, 9);
  });

  it('the look draws the cosmetic piece, else the equipped one', () => {
    const c = joe();
    const plainLook = lookFor(c);
    const robe = makeItem('sporesilk_body', 'epic', 5);
    c.bag.push(robe);
    wearCosmetic(c, robe.id);
    expect(lookItem(c, 'body')).toBe(robe);
    expect(lookItem(c, 'head')).toBe(c.equipment.head);
    const look = lookFor(c);
    expect(look.body).toBe('robe');
    expect(look.body).not.toBe(plainLook.body);
    // over an empty equipped slot too
    c.equipment.legs = null;
    const legs = makeItem('caretakers_plate_legs', 'common', 1);
    c.bag.push(legs);
    wearCosmetic(c, legs.id);
    expect(lookFor(c).legs).not.toBe('bare');
  });

  it('other players see it: the lobby gear and the snapshot carry it', () => {
    const c = joe();
    const helm = makeItem('caretakers_plate_head', 'rare', 5);
    c.bag.push(helm);
    wearCosmetic(c, helm.id);
    expect(gearOf(c).head?.b).toBe('caretakers_plate_head');
    expect(gearOf(c).main?.b).toBe(c.equipment.main?.baseId);
    expect((publicChar(c) as Character).cosmetic?.head?.baseId).toBe('caretakers_plate_head');
  });

  it('an item coming in never shares an id with a cosmetic piece', () => {
    const c = joe();
    const helm = makeItem('caretakers_plate_head', 'rare', 5);
    c.bag.push(helm);
    wearCosmetic(c, helm.id);
    const twin = makeItem('crypt_rags_head', 'common', 1);
    twin.id = helm.id;
    expect(uniqueItemId(c, twin).id).not.toBe(helm.id);
  });
});
