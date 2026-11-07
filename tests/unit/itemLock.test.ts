// D265: a locked item is never taken by "Sell all"; the lock toggles on bag and worn items and survives a save.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { lockedSkipped, sellAll, sellAllPreview, sellItem, toggleItemLock } from '../../src/game/items/inventory';

describe('item lock (D265)', () => {
  const setup = () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.bag = [makeItem('longsword', 'common', 1), makeItem('battleaxe', 'common', 2), makeItem('mace', 'uncommon', 3), makeItem('spear', 'rare', 4)];
    // makeItem may hand out the same id twice in a test; give each its own
    c.bag.forEach((it, i) => (it.id = `it${i}`));
    return c;
  };
  it('toggles on and off', () => {
    const c = setup();
    expect(toggleItemLock(c, 'it0').ok).toBe(true);
    expect(c.bag[0]!.locked).toBe(true);
    toggleItemLock(c, 'it0');
    expect(c.bag[0]!.locked).toBeUndefined();
    expect(toggleItemLock(c, 'nope').ok).toBe(false);
  });
  it('Sell all keeps locked items, whatever the filter', () => {
    const c = setup();
    toggleItemLock(c, 'it1');
    toggleItemLock(c, 'it3');
    expect(sellAllPreview(c, 'common').count).toBe(1);
    expect(lockedSkipped(c, 'common')).toBe(1);
    expect(lockedSkipped(c, 'all')).toBe(2);
    sellAll(c, 'all');
    expect(c.bag.map((i) => i.id)).toEqual(['it1', 'it3']);
    // nothing left to sell: only locked items
    expect(sellAll(c, 'all').ok).toBe(false);
  });
  it('a locked item can still be sold on its own, and a worn one can be locked', () => {
    const c = setup();
    toggleItemLock(c, 'it0');
    expect(sellItem(c, 'it0').ok).toBe(true);
    const worn = c.equipment.main!;
    expect(toggleItemLock(c, worn.id).ok).toBe(true);
    expect(worn.locked).toBe(true);
  });
  it('the lock survives a save round-trip', () => {
    const c = setup();
    toggleItemLock(c, 'it2');
    const back = JSON.parse(JSON.stringify(c)) as typeof c;
    expect(back.bag[2]!.locked).toBe(true);
    expect(back.bag[0]!.locked).toBeUndefined();
  });
});
