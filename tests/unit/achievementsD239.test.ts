// D239: Bestiary achievements, a weapon raised to Legendary, and Legendaries in every slot.
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../../src/data/achievements';
import { bestiaryTally, bestiaryZones } from '../../src/data/bestiary';
import { hasRaisedLegendary, wearsAllLegendary } from '../../src/game/achievements';
import { upgradeRarity } from '../../src/game/items/proficiency';
import { makeItem } from '../../src/game/items/make';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';

describe('D239 achievements', () => {
  it('are listed', () => {
    for (const id of ['raised_legendary', 'all_legendary', 'bestiary_25', 'bestiary_all', 'bestiary_enemy', 'bestiary_boss', 'bestiary_zone']) expect(ACHIEVEMENTS.some((a) => a.id === id), id).toBe(true);
  });

  it('a weapon found Legendary does not count; one raised to Legendary does', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(2));
    c.equipment.main = makeItem('longsword', 'legendary', 5);
    expect(hasRaisedLegendary(c)).toBe(false);
    const w = makeItem('longsword', 'epic', 5);
    c.bag.push(w);
    w.xp = 1e9;
    c.glowen = 1e9;
    expect(upgradeRarity(c, w.id).ok).toBe(true);
    expect(w.rarity).toBe('legendary');
    expect(hasRaisedLegendary(c)).toBe(true);
  });

  it('every slot Legendary, rings and second hands included', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(3));
    const L = (b: string) => makeItem(b, 'legendary', 8);
    c.equipment.main = L('longsword');
    c.altMain = L('longsword');
    c.equipment.off = L('round_shield');
    c.equipment.head = L(c.equipment.head!.baseId);
    c.equipment.body = L(c.equipment.body!.baseId);
    c.equipment.legs = L(c.equipment.legs!.baseId);
    c.equipment.ring1 = L('red_thread');
    c.equipment.ring2 = L('red_thread');
    c.equipment.ring3 = L('red_thread');
    c.equipment.ring4 = L('red_thread');
    expect(wearsAllLegendary(c)).toBe(false); // the 2nd off hand is empty
    c.altOff = L('round_shield');
    expect(wearsAllLegendary(c)).toBe(true);
    c.equipment.ring4 = makeItem('red_thread', 'epic', 8);
    expect(wearsAllLegendary(c)).toBe(false);
  });

  it('the Bestiary tally: entries, one enemy, one boss, a whole zone', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(4));
    c.bestiary = { kills: {}, seen: [] };
    const z1 = bestiaryZones()[0]!;
    let t = bestiaryTally(c);
    expect(t.known).toBe(0);
    expect(t.total).toBe(bestiaryZones().reduce((n, z) => n + z.enemies.length + (z.boss ? 1 : 0), 0));
    c.bestiary.kills[z1.enemies[0]!.id] = 500;
    t = bestiaryTally(c);
    expect([t.known, t.enemyDone, t.bossDone, t.zoneDone]).toEqual([1, true, false, false]);
    c.bestiary.kills[z1.boss!.id] = 8;
    t = bestiaryTally(c);
    expect([t.bossDone, t.zoneDone]).toEqual([true, false]);
    for (const e of z1.enemies) c.bestiary.kills[e.id] = 500;
    expect(bestiaryTally(c).zoneDone).toBe(true);
  });
});
