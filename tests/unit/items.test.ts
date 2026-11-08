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
  fuseGems,
  fusePreview,
  sellAll,
  sellAllPreview,
  sellGem,
  sellItem,
  socketGem,
  unequip,
  unsocketGem,
  itemSellValue,
} from '../../src/game/items/inventory';
import { GEM_PERK_PRICE, gemFuseCost, gemPerkSellValue, gemSellTotal, levelCost, gearSellValue } from '../../src/game/combat/formulas';
import { gemKind, isValidGem, makeGem } from '../../src/data/gems';
import { gemPerkCountChances, randomGem } from '../../src/game/items/generate';
import type { Gem } from '../../src/game/types';
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
    c.equipment.main = makeItem('longsword', 'legendary', 1, { gems: [makeGem('quicksilver', { q: 0.5 }), makeGem('quicksilver', { q: 0.5 })] });
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
  it('gem socket rules and sell values (GAME_DESIGN §8.5, D284)', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.gems = [];
    const w = makeItem('longsword', 'rare', 1, { sockets: 1 });
    const a = makeItem('crypt_rags_body', 'epic', 1, { sockets: 1 });
    c.bag.push(w, a);
    c.gems.push(makeGem('bulwark'), makeGem('brutal'));
    expect(socketGem(c, w.id, 0, 0).ok).toBe(false); // bulwark is an armor gem
    expect(socketGem(c, a.id, 0, 0).ok).toBe(true);
    expect(socketGem(c, w.id, 0, 0).ok).toBe(true);
    expect(c.gems.length).toBe(0);
    expect(unsocketGem(c, w.id, 0).ok).toBe(true);
    // a baseline perk sells for 80, × its level's strength and its roll
    expect(gemPerkSellValue({})).toBe(GEM_PERK_PRICE);
    expect(gemPerkSellValue({ level: 50, q: 0.5 })).toBe(Math.round(80 * 3 * 1.5));
    expect(gemPerkSellValue({ level: 1, q: -0.5 })).toBe(10);
    c.glowen = 0;
    expect(sellGem(c, 0).ok).toBe(true);
    expect(c.glowen).toBe(80);
    expect(gearSellValue('legendary', 3)).toBe(Math.round(400 * 1.6));
    const before = c.glowen;
    const v = itemSellValue(a);
    expect(v).toBe(gearSellValue('epic', 1) + 80); // the socketed Bulwark sells with the armor
    expect(sellItem(c, a.id).ok).toBe(true);
    expect(c.glowen - before).toBe(v);
  });
  it('multi-perk gems: every perk works, socketed; sell value is the sum', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const g: Gem = { perks: [{ family: 'brutal', q: -0.2 }, { family: 'tempo', q: 0.25 }, { family: 'leech' }] };
    expect(isValidGem(g)).toBe(true);
    expect(gemKind(g)).toBe('weapon');
    expect(gemSellTotal(g)).toBe(64 + 100 + 80);
    const w = makeItem('longsword', 'rare', 1, { sockets: 1, gems: [g] });
    c.equipment.main = w;
    // every perk works: Brutal adds damage, Tempo cooldowns, Leech lifesteal (baseline × roll)
    const d = computeDerived(c);
    expect(d.dmgPct).toBeCloseTo(0.088, 5);
    expect(d.cdr).toBeCloseTo(0.15, 5);
    expect(d.lifesteal).toBeCloseTo(0.04, 5);
    // armor perks in armor
    c.equipment.body = makeItem('crypt_rags_body', 'epic', 1, { sockets: 1, gems: [{ perks: [{ family: 'hearth', q: -0.5 }, { family: 'bulwark' }] }] });
    const d2 = computeDerived(c);
    expect(d2.maxHp).toBe(Math.round(d.maxHp * 1.04)); // Hearth: 8% baseline, −50% roll
    // a gem mixing weapon and armor perks, or repeating a family, is not a gem
    expect(isValidGem({ perks: [{ family: 'brutal' }, { family: 'bulwark' }] })).toBe(false);
    expect(isValidGem({ perks: [{ family: 'brutal' }, { family: 'brutal', q: 0.1 }] })).toBe(false);
  });
  it('fusing keeps the chosen perks, destroys the donor and never duplicates a family', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.gems = [
      { perks: [{ family: 'brutal', q: 0.3 }, { family: 'tempo', q: -0.4 }, { family: 'leech', q: -0.4 }] },
      { perks: [{ family: 'quicksilver', q: -0.1 }, { family: 'vigor', q: 0.45 }, { family: 'brutal', q: -0.4 }] },
      makeGem('bulwark'),
    ];
    const orig = c.gems[0]!;
    // wrong kind, wrong count, duplicate family, nothing from the donor
    expect(fuseGems(c, { gemIdx: 0 }, 2, [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 0 }, { from: 'orig', idx: 1 }]).ok).toBe(false);
    expect(fusePreview(orig, c.gems[1]!, [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 0 }])).toHaveProperty('error');
    expect(fusePreview(orig, c.gems[1]!, [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 2 }, { from: 'orig', idx: 1 }])).toHaveProperty('error');
    expect(fusePreview(orig, c.gems[1]!, [{ from: 'orig', idx: 0 }, { from: 'orig', idx: 1 }, { from: 'orig', idx: 2 }])).toHaveProperty('error');
    expect(fusePreview(orig, c.gems[1]!, [{ from: 'donor', idx: 0 }, { from: 'donor', idx: 1 }, { from: 'donor', idx: 2 }])).toHaveProperty('error');
    // keep Brutal +30%, take Quicksilver −10% and Vigor +45%
    const picks = [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 0 }, { from: 'donor', idx: 1 }] as const;
    const pv = fusePreview(orig, c.gems[1]!, [...picks]);
    expect('error' in pv).toBe(false);
    c.glowen = 0;
    expect(fuseGems(c, { gemIdx: 0 }, 1, [...picks]).ok).toBe(false); // costs Glowen
    c.glowen = 10000;
    expect(fuseGems(c, { gemIdx: 0 }, 1, [...picks]).ok).toBe(true);
    expect(orig.perks).toEqual([{ family: 'brutal', q: 0.3 }, { family: 'quicksilver', q: -0.1 }, { family: 'vigor', q: 0.45 }]);
    expect(c.gems.length).toBe(2);
    expect(c.gems[0]).toBe(orig);
    expect(c.glowen).toBe(10000 - gemFuseCost(orig.perks));
    expect(gemFuseCost(orig.perks)).toBe(Math.round(80 * 1.45));
    // a one-perk gem cannot be the original
    expect(fusePreview(c.gems[1]!, orig, [{ from: 'donor', idx: 0 }])).toHaveProperty('error');
  });
  it('dropped gems: one perk in the first cycle, up to two in NG+, up to three from NG+2, same kind', () => {
    for (const cycle of [0, 1, 2, 3]) {
      const r = new Rng(`gems-${cycle}`);
      const counts = [0, 0, 0, 0];
      const N = 4000;
      for (let i = 0; i < N; i++) {
        const g = randomGem(r, cycle, undefined, 7);
        expect(isValidGem(g)).toBe(true);
        expect(g.perks.every((p) => p.level === 7 && !('tier' in p))).toBe(true);
        counts[g.perks.length]!++;
      }
      const ch = gemPerkCountChances(cycle);
      if (cycle === 0) expect(counts[1]).toBe(N);
      if (cycle === 1) expect(counts[3]).toBe(0);
      expect(Math.abs(counts[2]! / N - ch.two)).toBeLessThan(0.03);
      expect(Math.abs(counts[3]! / N - ch.three)).toBeLessThan(0.03);
    }
    // armor gems can carry three perks too (four armor families)
    const g = randomGem(new Rng('a'), 5, 'armor');
    expect(gemKind(g)).toBe('armor');
  });
  it('Sell all sells only the bag, by rarity, and hands socketed gems back', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.bag = [];
    c.gems = [];
    const worn = c.equipment.main!;
    c.bag.push(makeItem('longsword', 'common', 1), makeItem('battleaxe', 'uncommon', 2, { sockets: 1, gems: [makeGem('brutal')] }), makeItem('longsword', 'rare', 3));
    const pv = sellAllPreview(c, 'belowRare');
    expect(pv.count).toBe(2);
    expect(pv.gems).toBe(1);
    expect(pv.glowen).toBe(gearSellValue('common', 1) + gearSellValue('uncommon', 2));
    expect(sellAllPreview(c, 'common').count).toBe(1);
    c.glowen = 0;
    expect(sellAll(c, 'belowRare').ok).toBe(true);
    expect(c.glowen).toBe(pv.glowen);
    expect(c.bag.map((i) => i.rarity)).toEqual(['rare']);
    expect(c.gems.length).toBe(1);
    expect(sellAll(c, 'all').ok).toBe(true);
    expect(c.bag.length).toBe(0);
    expect(c.equipment.main).toBe(worn);
    expect(sellAll(c, 'all').ok).toBe(false);
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
    c.gems.push(makeGem('tempo', { level: 9, q: 0.2 }), { perks: [{ family: 'brutal', q: -0.1 }, { family: 'leech' }], locked: true });
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
