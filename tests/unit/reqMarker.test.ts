// D210: the inventory's "!" asks the same question as the tooltip and the damage: requirements against the stats
// with gear bonuses, not the bare stats.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { itemRequirements } from '../../src/game/items/bases';
import { itemMeetsReqs } from '../../src/ui/tooltip';
import { Rng } from '../../src/engine/rng';

describe('requirement marker (D210)', () => {
  it('a +Bonk on other gear that lifts you to the requirement clears the "!", as it clears the damage penalty', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const sword = makeItem('colossal_sword', 'rare', 1);
    const need = itemRequirements(sword).bonk;
    c.twoHanded = false;
    c.stats.bonk = need - 2;
    c.equipment.main = sword;
    expect(itemMeetsReqs(sword, c)).toBe(false);
    expect(computeDerived(c).weaponMeetsReq).toBe(false);
    // +2 Bonk on the helmet
    c.equipment.head!.affixes.push({ id: 'bonker', value: 2 });
    expect(computeDerived(c).stats.bonk).toBe(need);
    expect(computeDerived(c).weaponMeetsReq).toBe(true);
    expect(itemMeetsReqs(sword, c)).toBe(true);
  });
});
