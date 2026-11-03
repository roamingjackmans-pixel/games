import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { generateItem, rollRarity, eligibleAffixes, AFFIX_COUNT } from '../../src/game/items/generate';
import { RARITY_WEIGHTS, RARITY_ORDER, type LootSource } from '../../src/data/lootTables';
import { makeItem } from '../../src/game/items/make';
import { computeDerived } from '../../src/game/player/derived';
import { newCharacter } from '../../src/game/player/character';
import {
  buyConsumable,
  equip,
  levelUp,
  respec,
  rerollGem,
  sellGem,
  sellItem,
  socketGem,
  unequip,
  unsocketGem,
  upgradeGem,
  itemSellValue,
} from '../../src/game/items/inventory';
import { gemSellValue, gemUpgradeCost, gemRerollCost, levelCost, gearSellValue } from '../../src/game/combat/formulas';
import { newSave, validateSave } from '../../src/game/save/schema';
import { MemoryStore } from '../../src/engine/settings';
import { readSave, writeSave } from '../../src/game/save/storage';
import { RINGS } from '../../src/data/rings';

describe('item generator (CONTENT_ITEMS §3)', () => {
  for (const source of ['fodder', 'brute', 'elite', 'chestSmall', 'chestTreasure', 'boss'] as LootSource[]) {
    it(`${source}: rarity weights within 1% over 100k rolls`, () => {
      const r = new Rng(`rarity-${source}`);
      const counts = [0, 0, 0, 0, 0];
      const N = 100000;
      for (let i = 0; i < N; i++) counts[RARITY_ORDER.indexOf(rollRarity(r, source))]!++;
      const w = RARITY_WEIGHTS[source];
      const total = w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < 5; i++) expect(Math.abs(counts[i]! / N - w[i]! / total)).toBeLessThan(0.01);
    });
  }
  it('affixes never duplicate and match the rarity count; legendaries carry a power', () => {
    const r = new Rng('affix');
    for (let i = 0; i < 5000; i++) {
      const it = generateItem(r, { source: 'boss', ilvl: 1 + (i % 9), zone: 1 + (i % 8) });
      const ids = it.affixes.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBe(Math.min(AFFIX_COUNT[it.rarity], eligibleAffixes(it).length));
      if (it.rarity === 'legendary' && it.kind !== 'ring') expect(it.legendaryPower, `${it.baseId}`).toBeTruthy();
      const ring = RINGS[it.baseId];
      if (ring) expect(RARITY_ORDER.indexOf(it.rarity)).toBeGreaterThanOrEqual(RARITY_ORDER.indexOf(ring.floor));
      if (it.kind === 'weapon') expect(it.sockets.length).toBeLessThanOrEqual(2);
      expect(it.name.length).toBeGreaterThan(0);
    }
  });
  it('is deterministic for a stream', () => {
    const a = generateItem(new Rng('same'), { source: 'elite', ilvl: 4, zone: 3 });
    const b = generateItem(new Rng('same'), { source: 'elite', ilvl: 4, zone: 3 });
    expect(a).toEqual(b);
  });
});

describe('requirements and penalties (D37)', () => {
  it('weapon below requirement: 40% damage and no skills; shield half block; tool cannot cast', () => {
    const c = newCharacter('scholar', 'Joe', 'p', new Rng(1));
    c.equipment.main = makeItem('greathammer', 'legendary', 5);
    let d = computeDerived(c);
    expect(d.weaponMeetsReq).toBe(false);
    expect(d.skillsUnlocked).toBe(0);
    c.stats.bonk = 40;
    const d2 = computeDerived(c);
    expect(d2.weaponMeetsReq).toBe(true);
    expect(d2.skillsUnlocked).toBe(3);
    c.stats.bonk = 3;
    c.equipment.off = makeItem('kite_shield', 'common', 1);
    d = computeDerived(c);
    expect(d.shieldMeetsReq).toBe(false);
    c.equipment.off = makeItem('archmagister_rod', 'common', 1);
    d = computeDerived(c);
    expect(d.toolMeetsReq).toBe(false);
  });
  it('gems change attack speed (Quicksilver) and are capped at ×1.6', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const base = computeDerived(c).attackSpeed;
    c.equipment.main = makeItem('longsword', 'legendary', 1, { gems: [{ family: 'quicksilver', tier: 5 }, { family: 'quicksilver', tier: 5 }] });
    expect(computeDerived(c).attackSpeed).toBeCloseTo(base * 1.36, 2);
    c.equipment.main.affixes.push({ id: 'swift', value: 40 });
    expect(computeDerived(c).attackSpeed).toBeLessThanOrEqual(1.6);
  });
});

describe('inventory, gems, Glowen, levels', () => {
  it('equip / unequip swaps through the bag', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const sword = c.equipment.main!;
    const axe = makeItem('battleaxe', 'rare', 2);
    c.bag.push(axe);
    expect(equip(c, axe.id).ok).toBe(true);
    expect(c.equipment.main!.id).toBe(axe.id);
    expect(c.bag.some((i) => i.id === sword.id)).toBe(true);
    expect(unequip(c, 'main').ok).toBe(true);
    expect(c.equipment.main).toBeNull();
    expect(equip(c, sword.id, 'altMain').ok).toBe(true);
    expect(c.altMain!.id).toBe(sword.id);
  });
  it('gem socket rules, upgrade costs and sell values (GAME_DESIGN §8.5)', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const w = makeItem('longsword', 'rare', 1, { sockets: 1 });
    const a = makeItem('crypt_rags_body', 'epic', 1, { sockets: 1 });
    c.bag.push(w, a);
    c.gems.push({ family: 'bulwark', tier: 1 }, { family: 'brutal', tier: 1 });
    expect(socketGem(c, w.id, 0, 0).ok).toBe(false); // bulwark is armor-only
    expect(socketGem(c, a.id, 0, 0).ok).toBe(true);
    expect(socketGem(c, w.id, 0, 0).ok).toBe(true);
    expect(c.gems.length).toBe(0);
    expect(unsocketGem(c, w.id, 0).ok).toBe(true);
    expect([1, 2, 3, 4, 5].map(gemSellValue)).toEqual([40, 120, 360, 1080, 3240]);
    expect(gemUpgradeCost(1)).toBe(400);
    expect(gemRerollCost(2)).toBe(240);
    c.glowen = 400;
    expect(upgradeGem(c, 0).ok).toBe(true);
    expect(c.gems[0]!.tier).toBe(2);
    expect(c.glowen).toBe(0);
    c.glowen = 240;
    expect(rerollGem(c, 0, new Rng(5)).ok).toBe(true);
    expect(c.gems[0]!.family).not.toBe('brutal');
    expect(sellGem(c, 0).ok).toBe(true);
    expect(c.glowen).toBe(120);
    expect(gearSellValue('legendary', 3)).toBe(Math.round(400 * 1.6));
    const before = c.glowen;
    const v = itemSellValue(a);
    expect(sellItem(c, a.id).ok).toBe(true);
    expect(c.glowen - before).toBe(v);
  });
  it('level up costs follow the curve; respec refunds points as free points', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.shards = levelCost(1) + levelCost(2) - 1;
    expect(levelUp(c, 'hp').ok).toBe(true);
    expect(c.level).toBe(2);
    expect(levelUp(c, 'hp').ok).toBe(false);
    c.tears = 1;
    expect(respec(c).ok).toBe(true);
    expect(c.stats.hp).toBe(10);
    expect(c.freePoints).toBe(1);
    expect(levelUp(c, 'bonk').ok).toBe(true);
    expect(c.level).toBe(2);
    c.glowen = 15;
    expect(buyConsumable(c, 'throwing_knife').ok).toBe(true);
    expect(c.consumables.throwing_knife).toBe(4);
  });
});

describe('save round-trip of items', () => {
  it('a character with generated gear survives write → read', () => {
    const c = newCharacter('cleric', 'Joe', 'p', new Rng(1));
    const r = new Rng('rt');
    for (let i = 0; i < 40; i++) c.bag.push(generateItem(r, { source: 'boss', ilvl: 5, zone: 4 }));
    c.gems.push({ family: 'tempo', tier: 3 });
    const s = newSave(3, c, 'RT');
    const store = new MemoryStore();
    writeSave(store, s);
    const back = readSave(store, 3)!;
    expect(validateSave(back)).toEqual([]);
    expect(back.character.bag).toEqual(c.bag);
    expect(back.character.gems).toEqual(c.gems);
    expect(back.character.equipment).toEqual(c.equipment);
  });
});
