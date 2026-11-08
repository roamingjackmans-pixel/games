// D198: Soul Essence and reinforcing gear +0 … +15.
import { describe, expect, it } from 'vitest';
import { ESSENCES, essenceTierFor, payEssence, reinforceMult, reinforceNeed } from '../../src/data/essence';
import { reinforceItem } from '../../src/game/items/reinforce';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { Rng } from '../../src/engine/rng';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnPlayer } from '../../src/game/player/player';
import { bossDrops, ESSENCE_DROP } from '../../src/game/items/drops';
import { applyCharOp, cloneChar, diffChar } from '../../src/game/net/charSync';
import { normalizeSave, newSave } from '../../src/game/save/schema';

const knight = () => {
  const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
  c.glowen = 1e7;
  return c;
};

describe('Soul Essence (D198)', () => {
  it('five tiers; none in zones 1–3 of the first descent, Tier 1 from zone 4, then one tier per New Game+', () => {
    expect(ESSENCES.map((e) => e.tier)).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3].map((z) => essenceTierFor(z, 0))).toEqual([0, 0, 0]);
    expect([4, 5, 8].map((z) => essenceTierFor(z, 0))).toEqual([1, 1, 1]);
    expect([1, 8].map((z) => essenceTierFor(z, 1))).toEqual([2, 2]);
    expect(essenceTierFor(1, 2)).toBe(3);
    expect(essenceTierFor(5, 3)).toBe(4);
    expect([4, 7].map((cy) => essenceTierFor(3, cy))).toEqual([5, 5]);
  });

  it('a boss drops one or two of its tier (D226: halved from three), none before zone 4', () => {
    const drops = (zone: number, cycle: number) => {
      const w = new World('ESS', Room.empty());
      spawnPlayer(w, knight(), 0, true, 600, 368);
      bossDrops({ w, seed: 'S', zone, cycle }, 'b', 640, 300);
      return [...w.entities.values()].filter((e) => e.pk?.kind === 'essence').map((e) => [e.pk!.essenceTier, e.pk!.amount]);
    };
    expect(drops(3, 0)).toEqual([]);
    const a = drops(4, 0);
    expect(a.length).toBe(1);
    expect(a[0]![0]).toBe(1);
    expect([1, 2]).toContain(a[0]![1]);
    expect(drops(2, 1)[0]![0]).toBe(2);
    expect(ESSENCE_DROP).toEqual({ enemy: 0.01, elite: 0.175, smallChest: 0.125, mimic: 0.25, treasure: 0.75, boss: 1.5 });
  });

  it('steps cost 1, 2, 3 of one tier, a new tier every three levels: 6 a tier, +3 in the first descent', () => {
    const steps = Array.from({ length: 15 }, (_, p) => reinforceNeed(p));
    expect(steps.map((s) => s.count)).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3]);
    expect(steps.map((s) => s.tier)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
    const c = knight();
    c.essence = [6, 0, 0, 0, 0];
    const id = c.equipment.main!.id;
    for (let i = 0; i < 3; i++) expect(reinforceItem(c, id).ok).toBe(true);
    expect(c.equipment.main!.plus).toBe(3);
    expect(reinforceItem(c, id).ok).toBe(false); // +4 needs Tier 2
    expect(c.essence).toEqual([0, 0, 0, 0, 0]);
  });

  it('a higher tier pays 3:1 for a lower one: two Tier 2 take a weapon to +3; lower never pays for higher', () => {
    const c = knight();
    c.essence = [0, 2, 0, 0, 0];
    const id = c.equipment.main!.id;
    for (let i = 0; i < 3; i++) expect(reinforceItem(c, id).ok).toBe(true);
    expect(c.equipment.main!.plus).toBe(3);
    expect(c.essence).toEqual([0, 0, 0, 0, 0]);
    expect(payEssence([30, 0, 0, 0, 0], 2, 1)).toBeNull();
    expect(payEssence([0, 0, 1, 0, 0], 1, 1)).toEqual([2, 2, 0, 0, 0]); // the change stays
  });

  it('+15 is four times the item: weapon damage, armour defense, and a shield leaks and tires a quarter as much', () => {
    expect(reinforceMult(0)).toBe(1);
    expect(reinforceMult(15)).toBeCloseTo(4, 10);
    const c = knight();
    const before = computeDerived(c);
    c.equipment.main!.plus = 15;
    c.equipment.body!.plus = 15;
    c.equipment.off = makeItem('kite_shield', 'common', 1);
    const s0 = computeDerived(c);
    c.equipment.off.plus = 15;
    const after = computeDerived(c);
    expect(after.weaponPower / before.weaponPower).toBeCloseTo(3.25, 5); // D303: weapons 15% a step
    expect(after.defense.physical).toBeGreaterThan(before.defense.physical);
    expect(1 - after.shieldVals.physical).toBeCloseTo((1 - s0.shieldVals.physical) / 4, 5);
    expect(after.shieldStability).toBeCloseTo(s0.shieldStability / 4, 5);
  });

  it('travels to a co-op guest as its own op, and survives the save (bad values cleaned)', () => {
    const c = knight();
    const base = cloneChar(c);
    c.essence = [2, 0, 1, 0, 0];
    const g = cloneChar(base);
    for (const o of diffChar(base, c)) applyCharOp(g, o);
    expect(g.essence).toEqual([2, 0, 1, 0, 0]);
    const s = newSave(1, c, 'S');
    (s.character as { essence: unknown }).essence = [3.7, -2, 'x'];
    s.character.equipment.main!.plus = 99;
    normalizeSave(s);
    expect(s.character.essence).toEqual([3, 0, 0, 0, 0]);
    expect(s.character.equipment.main!.plus).toBe(15);
  });
});
