// D232: two different items must never share an id (the gem bench and reinforce look items up by id).
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { buyItem, dedupeItemIds, findItem, itemPlace, uniqueItemId } from '../../src/game/items/inventory';

describe('item ids (D232)', () => {
  it('a save whose 2nd weapon shares the main weapon id is repaired', () => {
    const c = newCharacter('brute', 'Joe', 'p1', new Rng('IDS'));
    const a = makeItem('colossal_sword', 'epic', 5);
    const b = makeItem('colossal_sword', 'epic', 6);
    b.id = a.id;
    c.equipment.main = a;
    c.altMain = b;
    expect(dedupeItemIds(c)).toBe(1);
    expect(a.id).not.toBe(b.id);
    expect(itemPlace(c, b.id)).toBe('altMain');
    expect(findItem(c, b.id)).toBe(b);
  });

  it('an item coming in with an id already carried gets a new one', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng('IDS2'));
    const worn = c.equipment.main!;
    const dup = makeItem('longsword', 'rare', 4);
    dup.id = worn.id;
    c.glowen = 1000;
    buyItem(c, dup, 10);
    expect(dup.id).not.toBe(worn.id);
    const keep = makeItem('longsword', 'rare', 4);
    const id = keep.id;
    expect(uniqueItemId(c, keep).id).toBe(id);
  });
});
