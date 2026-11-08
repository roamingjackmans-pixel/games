// D280–D285: no gem tiers (quality only), adding gems, fewer gem drops, Sell all gems with locks, Essence breakdown.
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { GEMS, gemOrigin, gemQualityRolls, isValidGem, makeGem, perkValue, rollGemQuality, untierGem } from '../../src/data/gems';
import { GEM_CHANCE } from '../../src/data/lootTables';
import { randomGem } from '../../src/game/items/generate';
import { fuseGems, fusePreview, sellAllGems, sellAllGemsPreview, toggleGemLock } from '../../src/game/items/inventory';
import { breakDownEssence } from '../../src/game/items/reinforce';
import { gemSellTotal } from '../../src/game/combat/formulas';
import { makeItem } from '../../src/game/items/make';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { migrate } from '../../src/game/save/migrations';
import { newSave, validateSave } from '../../src/game/save/schema';
import type { Gem, GemPerk } from '../../src/game/types';

describe('gems without tiers (D284)', () => {
  it('each family has one baseline: the average of its old T1–T5 values (Ember & co. ×1.4, D283)', () => {
    expect(GEMS.brutal.value).toBe(11);
    expect(GEMS.hearth.value).toBe(8);
    expect(GEMS.fleetfoot.value).toBeCloseTo(0.6);
    expect(GEMS.ember.value).toBeCloseTo(GEMS.brutal.value * 1.2, 5); // D292: Brutal + 20%
    expect(perkValue({ family: 'tempo', level: 50, q: 0.5 })).toBeCloseTo(12 * 3 * 1.5);
  });

  it('an old tiered perk keeps its strength through its roll, clamped to −50% … +50%', () => {
    const g = { perks: [{ family: 'brutal', tier: 1 }, { family: 'tempo', tier: 4, q: 0.1 }, { family: 'leech', tier: 5, q: 0.4 }] };
    untierGem(g);
    const p = g.perks as unknown as GemPerk[];
    for (const x of p) expect('tier' in x).toBe(false);
    // Brutal T1 was 5 (baseline 11): 5 / 11 − 1 = −0.545 → clamped −0.5
    expect(p[0]!.q).toBe(-0.5);
    // Tempo T4 +10% was 15 × 1.1 = 16.5 → 16.5 / 12 − 1 = +0.375, exactly as strong as before
    expect(p[1]!.q).toBeCloseTo(0.375, 3);
    expect(perkValue(p[1]!)).toBeCloseTo(16.5, 1);
    // Leech T5 +40% was 8.4 → needs +110%, clamped +50%
    expect(p[2]!.q).toBe(0.5);
    // running it again changes nothing
    const again = structuredClone(p);
    untierGem({ perks: again });
    expect(again).toEqual(p);
  });

  it('a current-version save with tiered gems loads tier-free and valid', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const raw = JSON.parse(JSON.stringify(newSave(1, c, 'S'))) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    raw.character.gems = [{ perks: [{ family: 'gilt', tier: 3, level: 20, q: 0.2 }] }];
    raw.character.equipment.main.sockets = [{ perks: [{ family: 'brutal', tier: 2, level: 5 }] }];
    const m = migrate(raw) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(validateSave(m)).toEqual([]);
    expect(m.character.gems[0].perks[0]).toEqual({ family: 'gilt', level: 20, q: 0.2 });
    expect(m.character.equipment.main.sockets[0].perks[0].tier).toBeUndefined();
  });

  it('dropped gems carry no tier; deeper gems and bonus rolls roll better, still inside −50% … +50%', () => {
    const g = randomGem(new Rng('t'), 2, 'weapon', 30);
    for (const p of g.perks) expect('tier' in p).toBe(false);
    expect(gemQualityRolls(10)).toBe(1);
    expect(gemQualityRolls(25)).toBe(2);
    expect(gemQualityRolls(30, 1)).toBe(3);
    const mean = (rolls: number): number => {
      const r = new Rng(`m${rolls}`);
      let s = 0;
      for (let i = 0; i < 4000; i++) {
        const q = rollGemQuality(r, rolls);
        expect(Math.abs(q)).toBeLessThanOrEqual(0.5);
        s += q;
      }
      return s / 4000;
    };
    expect(mean(2)).toBeGreaterThan(mean(1) + 0.05);
  });
});

describe('adding gems (D283)', () => {
  it('Ember keeps the physical and adds its share as Fire, with Burn buildup', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const plain = computeDerived(c);
    c.equipment.main = makeItem(c.equipment.main!.baseId, c.equipment.main!.rarity, c.equipment.main!.ilvl, { sockets: 1, gems: [makeGem('ember', { q: 0 })] });
    const d = computeDerived(c);
    expect(d.convert.filter((x) => x.type === 'fire')).toEqual([]);
    expect(d.addDmg).toEqual([{ type: 'fire', pct: 0.132 }]);
    expect(d.statusBuild.some((s) => s.id === 'burn' && s.buildup === 22)).toBe(true);
    expect(plain.addDmg).toEqual([]);
  });
});

describe('gem drop rate (D281)', () => {
  it('is 35% lower everywhere', () => {
    expect(GEM_CHANCE.enemy).toBeCloseTo(0.02 * 0.65, 6);
    expect(GEM_CHANCE.chest).toBeCloseTo(0.12 * 0.65, 6);
    expect(GEM_CHANCE.boss).toBeCloseTo(0.65, 6);
  });
});

describe('gem locks and Sell all gems (D282)', () => {
  it('Sell all gems sells every unlocked loose gem and keeps the locked and socketed ones', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.gems = [makeGem('brutal', { level: 10 }), makeGem('hearth'), makeGem('tempo', { q: 0.3 })];
    const sock: Gem = makeGem('leech');
    c.equipment.main!.sockets = [sock];
    expect(toggleGemLock(c, { gemIdx: 1 }).ok).toBe(true);
    expect(c.gems[1]!.locked).toBe(true);
    expect(toggleGemLock(c, { itemId: c.equipment.main!.id, socketIdx: 0 }).ok).toBe(true);
    expect(sock.locked).toBe(true);
    const pv = sellAllGemsPreview(c);
    expect(pv).toEqual({ count: 2, glowen: gemSellTotal(c.gems[0]!) + gemSellTotal(c.gems[2]!), locked: 1 });
    c.glowen = 0;
    expect(sellAllGems(c).ok).toBe(true);
    expect(c.glowen).toBe(pv.glowen);
    expect(c.gems.map((g) => g.perks[0]!.family)).toEqual(['hearth']);
    expect(c.equipment.main!.sockets[0]).toBe(sock);
    expect(sellAllGems(c).ok).toBe(false);
    // unlocking toggles back; the lock survives JSON
    expect(JSON.parse(JSON.stringify(c.gems))[0].locked).toBe(true);
    toggleGemLock(c, { gemIdx: 0 });
    expect(c.gems[0]!.locked).toBeUndefined();
    expect(toggleGemLock(c, { gemIdx: 9 }).ok).toBe(false);
  });
});

describe('fuse lineage (D286)', () => {
  it('a,b,c + d,e,f: one of a/b/c must stay; keeping a,d,f leaves origin {a}, and the next fuse must keep a', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.glowen = 100000;
    // a, b, c = brutal, tempo, leech; d, e, f = quicksilver, vigor, fleetfoot
    const g1: Gem = { perks: [{ family: 'brutal' }, { family: 'tempo' }, { family: 'leech' }] };
    const g2: Gem = { perks: [{ family: 'quicksilver' }, { family: 'vigor' }, { family: 'fleetfoot' }] };
    c.gems = [g1, g2];
    const none = fusePreview(g1, g2, [{ from: 'donor', idx: 0 }, { from: 'donor', idx: 1 }, { from: 'donor', idx: 2 }]);
    expect(none).toEqual({ error: 'Keep at least one original perk: Brutal, Tempo, Leech.' });
    expect(fuseGems(c, { gemIdx: 0 }, 1, [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 0 }, { from: 'donor', idx: 2 }]).ok).toBe(true);
    expect(g1.perks.map((p) => p.family)).toEqual(['brutal', 'quicksilver', 'fleetfoot']);
    expect(g1.origin).toEqual(['brutal']);
    expect(gemOrigin(g1)).toEqual(['brutal']);
    // next fuse: keeping Quicksilver and Fleetfoot (not original) but dropping Brutal is refused
    const g3: Gem = { perks: [{ family: 'tempo' }, { family: 'leech' }] };
    c.gems.push(g3);
    const di = c.gems.indexOf(g3);
    expect(fusePreview(g1, g3, [{ from: 'orig', idx: 1 }, { from: 'orig', idx: 2 }, { from: 'donor', idx: 0 }])).toEqual({ error: 'Keep at least one original perk: Brutal.' });
    expect(fuseGems(c, { gemIdx: 0 }, di, [{ from: 'orig', idx: 1 }, { from: 'orig', idx: 2 }, { from: 'donor', idx: 0 }]).ok).toBe(false);
    // keeping Brutal works, and the origin stays {Brutal}
    expect(fuseGems(c, { gemIdx: 0 }, di, [{ from: 'orig', idx: 0 }, { from: 'orig', idx: 1 }, { from: 'donor', idx: 1 }]).ok).toBe(true);
    expect(g1.perks.map((p) => p.family)).toEqual(['brutal', 'quicksilver', 'leech']);
    expect(g1.origin).toEqual(['brutal']);
    expect(isValidGem(g1)).toBe(true);
  });

  it('origin survives JSON and a load; a broken origin is cleaned; an origin of families it lacks is not a gem', () => {
    const g: Gem = { perks: [{ family: 'brutal' }, { family: 'tempo' }], origin: ['tempo'] };
    expect(JSON.parse(JSON.stringify(g))).toEqual(g);
    expect(isValidGem({ perks: [{ family: 'brutal' }], origin: ['leech'] })).toBe(false);
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const raw = JSON.parse(JSON.stringify(newSave(1, c, 'S'))) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    raw.character.gems = [{ ...g }, { perks: [{ family: 'gilt' }], origin: ['brutal', 7] }, { perks: [{ family: 'gilt' }, { family: 'zephyr' }], origin: ['zephyr', 'zephyr'] }];
    const m = migrate(raw) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(m.character.gems[0].origin).toEqual(['tempo']);
    expect(m.character.gems[1].origin).toBeUndefined();
    expect(m.character.gems[2].origin).toEqual(['zephyr']);
    for (const x of m.character.gems) expect(isValidGem(x)).toBe(true);
  });
});

describe('breaking Soul Essence down (D285)', () => {
  it('one of a tier becomes three of the tier below; Convert all does every one', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.essence = [0, 1, 0, 0, 2];
    expect(breakDownEssence(c, 5, false).ok).toBe(true);
    expect(c.essence).toEqual([0, 1, 0, 3, 1]);
    expect(breakDownEssence(c, 4, true).ok).toBe(true);
    expect(c.essence).toEqual([0, 1, 9, 0, 1]);
    expect(breakDownEssence(c, 2, true).ok).toBe(true);
    expect(c.essence).toEqual([3, 0, 9, 0, 1]);
    expect(breakDownEssence(c, 2, false).ok).toBe(false); // none left
    expect(breakDownEssence(c, 1, true).ok).toBe(false); // the lowest tier cannot break
    expect(breakDownEssence(c, 6, true).ok).toBe(false);
    expect(c.essence).toEqual([3, 0, 9, 0, 1]);
  });
  it('works on a character with no Essence list yet', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    delete c.essence;
    expect(breakDownEssence(c, 3, false).ok).toBe(false);
  });
});
