// D178: weapon experience bars, rarity raises, and weapon-class proficiency with two perks per class.
import { describe, expect, it } from 'vitest';
import { PROF_CLASSES, PROF_MAX_LEVEL, RARITY_POWER, killXp, perkPoints, profLevel, profLevelCost } from '../../src/data/proficiency';
import { WEAPONS } from '../../src/data/weapons';
import { activeClasses, grantKillXp, profBonuses, upgradeInfo, upgradeRarity } from '../../src/game/items/proficiency';
import { computeDerived } from '../../src/game/player/derived';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnPlayer } from '../../src/game/player/player';
import { grantWeaponXp } from '../../src/game/rules';
import { cloneChar, diffChar, applyCharOp } from '../../src/game/net/charSync';
import { Rng } from '../../src/engine/rng';

describe('proficiency levels (D178)', () => {
  it('the first 50 levels take about three clean playthroughs (each about 1,370 experience); all 100 about thirteen (D218)', () => {
    expect(PROF_MAX_LEVEL).toBe(100);
    let half = 0;
    for (let l = 1; l <= 50; l++) half += profLevelCost(l);
    expect(half).toBeGreaterThan(3 * 1370 * 0.95);
    expect(half).toBeLessThan(3 * 1370 * 1.4);
    expect(profLevel(half).level).toBe(50);
    let total = 0;
    for (let l = 1; l <= PROF_MAX_LEVEL; l++) total += profLevelCost(l);
    expect(total).toBe(17660);
    expect(profLevel(total).level).toBe(PROF_MAX_LEVEL);
    expect(profLevel(total - 1).level).toBe(PROF_MAX_LEVEL - 1);
    expect(profLevel(0)).toEqual({ level: 0, into: 0, next: profLevelCost(1) });
  });

  it('odd levels raise the first perk, even levels the second', () => {
    expect(perkPoints(1)).toEqual([1, 0]);
    expect(perkPoints(2)).toEqual([1, 1]);
    expect(perkPoints(3)).toEqual([2, 1]);
    expect(perkPoints(50)).toEqual([25, 25]);
  });

  it('every weapon base has a class with two perks; greataxes get damage then poise', () => {
    for (const id of Object.keys(WEAPONS)) expect(PROF_CLASSES[id]?.perks.length, id).toBe(2);
    expect(PROF_CLASSES.greataxe!.perks.map((p) => p.stat)).toEqual(['damage', 'poise']);
    expect(PROF_CLASSES.whip!.perks[0]!.stat).toBe('reach');
    expect(PROF_CLASSES.staff!.perks[0]!.stat).toBe('spellCooldown');
  });
});

describe('experience on what is out (D178)', () => {
  it('a kill trains the weapon in hand and a held staff, not the 2nd weapon', () => {
    const c = newCharacter('spearman', 'Joe', 'p', new Rng(1));
    c.equipment.main = makeItem('greataxe', 'common');
    c.equipment.off = makeItem('apprentice_staff', 'common');
    c.twoHanded = false;
    c.altMain = makeItem('rapier', 'common');
    expect(activeClasses(c).sort()).toEqual(['greataxe', 'staff']);
    grantKillXp(c, 5);
    expect(c.equipment.main!.xp).toBe(5);
    expect(c.equipment.off!.xp).toBe(5);
    expect(c.altMain.xp ?? 0).toBe(0);
    expect(c.proficiency).toEqual({ greataxe: 5, staff: 5 });
  });

  it('every standing player gets it, whoever made the kill (a co-op partner holding a greataxe too)', () => {
    const w = new World('XP', Room.empty());
    const a = newCharacter('knight', 'A', 'a', new Rng(1));
    const b = newCharacter('knight', 'B', 'b', new Rng(2));
    b.equipment.main = makeItem('greataxe', 'common');
    spawnPlayer(w, a, 0, true, 300, 300);
    const pb = spawnPlayer(w, b, 1, false, 400, 300);
    grantWeaponXp(w, killXp({ isBoss: false, elite: true, role: 'brute', mimic: false }));
    expect(a.proficiency?.longsword).toBe(5);
    expect(b.proficiency?.greataxe).toBe(5);
    pb.pl!.downed = true;
    grantWeaponXp(w, 2);
    expect(b.proficiency?.greataxe).toBe(5);
  });

  it('perks count only while that class is out', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.proficiency = { greataxe: 2000, longsword: 0 };
    expect(profBonuses(c).damage).toBe(0);
    c.equipment.main = makeItem('greataxe', 'common');
    const lv = profLevel(2000).level;
    const [a, b] = perkPoints(lv);
    expect(profBonuses(c).damage).toBeCloseTo(0.01 * a, 6);
    expect(profBonuses(c).poise).toBeCloseTo(0.01 * b, 6);
    const d = computeDerived(c);
    expect(d.dmgPct).toBeGreaterThanOrEqual(0.01 * a - 1e-9);
  });
});

describe('raising a weapon a rarity (D178)', () => {
  it('needs a full bar and the Glowen; keeps affixes and sockets; damage moves to the new tier', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const sword = makeItem('longsword', 'rare', 3);
    sword.affixes = [{ id: 'dmg_pct', value: 7 }];
    sword.sockets = [null];
    c.equipment.main = sword;
    c.glowen = 0;
    const before = computeDerived(c).weaponPower;
    expect(upgradeRarity(c, sword.id).ok).toBe(false);
    sword.xp = upgradeInfo(sword)!.need;
    expect(upgradeRarity(c, sword.id).ok).toBe(false);
    c.glowen = 100000;
    const cost = upgradeInfo(sword)!.cost;
    expect(upgradeRarity(c, sword.id).ok).toBe(true);
    expect(sword.rarity).toBe('epic');
    expect(sword.xp).toBe(0);
    expect(sword.affixes).toEqual([{ id: 'dmg_pct', value: 7 }]);
    expect(sword.sockets.length).toBe(1);
    expect(c.glowen).toBe(100000 - cost);
    expect(computeDerived(c).weaponPower / before).toBeCloseTo(RARITY_POWER.epic / RARITY_POWER.rare, 5);
  });

  it('Epic to Legendary gives a legendary power; Legendary is the top', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const axe = makeItem('greataxe', 'epic', 5);
    c.equipment.main = axe;
    c.glowen = 999999;
    axe.xp = upgradeInfo(axe)!.need;
    expect(upgradeRarity(c, axe.id).ok).toBe(true);
    expect(axe.rarity).toBe('legendary');
    expect(axe.legendaryPower).toBeTruthy();
    expect(upgradeInfo(axe)).toBeNull();
  });
});

describe('co-op: proficiency reaches the guest (D178)', () => {
  it('the host sends gains as a delta op the guest applies', () => {
    const host = newCharacter('knight', 'G', 'g', new Rng(1));
    const base = cloneChar(host);
    grantKillXp(host, 7);
    const ops = diffChar(base, host);
    expect(ops.some((o) => o.op === 'prof')).toBe(true);
    expect(ops.some((o) => o.op === 'gear')).toBe(true);
    const guest = cloneChar(base);
    guest.proficiency = { longsword: 10 };
    for (const o of ops) applyCharOp(guest, o);
    expect(guest.proficiency.longsword).toBe(17);
  });
});
