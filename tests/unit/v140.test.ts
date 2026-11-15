// The 1.4.0 batch (D371 onward): rules the owner asked for, one block each.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { refreshDerived } from '../../src/game/player/player';
import { emptySpec, hitPlayer } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { addBuff } from '../../src/game/combat/state';

function session(cls: Parameters<typeof newCharacter>[0] = 'knight'): GameSession {
  const c = newCharacter(cls, 'Joe', 'p1', new Rng('v140'));
  c.tutorialDone = true;
  c.stats.bonk = c.stats.slicey = 40;
  const s = new GameSession(newSave(1, c, 'V140'));
  s.start();
  return s;
}

describe('Spiked Greatshield thorns (D371)', () => {
  it('reflect half of what the enemy dealt before any reduction: a 300 hit reflects 150 though the block cut it', () => {
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.off = makeItem('spiked_greatshield', 'common');
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    foe.en!.def = { ...foe.en!.def, resist: {}, element: 'physical' };
    foe.hp!.hp = foe.hp!.max = 5000;
    p.facing = Math.PI;
    p.pl!.blocking = true;
    p.stam!.cur = p.stam!.max = 500;
    const hpBefore = p.hp!.hp;
    const spec = emptySpec('normal');
    spec.dmg.physical = 300;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    expect(hpBefore - p.hp!.hp).toBeLessThan(150);
    expect(5000 - foe.hp!.hp).toBeCloseTo(150, 0);
  });

  it("counts the enemy's own damage buffs, never the player's", () => {
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.off = makeItem('spiked_greatshield', 'common');
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    foe.en!.def = { ...foe.en!.def, resist: {}, element: 'physical' };
    foe.hp!.hp = foe.hp!.max = 5000;
    addBuff(foe, s.w, { id: 'rage', stat: 'damagePct', amount: 0.5, durationS: 10, maxStacks: 1, sourceId: foe.id });
    addBuff(p, s.w, { id: 'mine', stat: 'damagePct', amount: 1, durationS: 10, maxStacks: 1, sourceId: p.id });
    p.facing = Math.PI;
    p.pl!.blocking = true;
    p.stam!.cur = p.stam!.max = 500;
    const spec = emptySpec('normal');
    spec.dmg.physical = 200;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    expect(5000 - foe.hp!.hp).toBeCloseTo(150, 0);
  });
});

describe('weapon speed tags (D371)', () => {
  it('every class has a tag from its base speed: daggers Fast, longsword Medium, greathammer Slow', async () => {
    const { WEAPONS, speedTag, SPEED_TAG_MULT } = await import('../../src/data/weapons');
    for (const w of Object.values(WEAPONS)) expect(['fast', 'medium', 'slow']).toContain(speedTag(w));
    expect(speedTag(WEAPONS.twin_daggers!)).toBe('fast');
    expect(speedTag(WEAPONS.longsword!)).toBe('medium');
    expect(speedTag(WEAPONS.club!)).toBe('medium');
    expect(speedTag(WEAPONS.greathammer!)).toBe('slow');
    expect(SPEED_TAG_MULT).toEqual({ fast: 1, medium: 1.5, slow: 2 });
  });

  it('Bless Weapon and lifesteal: ×1 Fast, ×1.5 Medium, ×2 Slow', async () => {
    const { weaponSpec } = await import('../../src/game/player/player');
    const s = session();
    const p = s.localPlayer!;
    const c = p.pl!.char;
    c.stats.bonk = c.stats.slicey = 60;
    const blessed = (baseId: string): { holyShare: number; ls: number } => {
      c.equipment.main = makeItem(baseId, 'common');
      c.twoHanded = false;
      refreshDerived(p);
      p.pl!.derived.lifesteal = 0.01;
      p.buffs = [];
      const plain = weaponSpec(s.w, p, 1);
      addBuff(p, s.w, { id: 'bless', stat: 'holyConvertPct', amount: 0.2, durationS: 20, maxStacks: 1, sourceId: p.id });
      const b = weaponSpec(s.w, p, 1);
      const base = Object.values(plain.dmg).reduce((a, x) => a + (x ?? 0), 0);
      return { holyShare: ((b.dmg.holy ?? 0) - (plain.dmg.holy ?? 0)) / base, ls: b.lifestealPct ?? 0 };
    };
    const fast = blessed('rapier');
    const med = blessed('longsword');
    const slow = blessed('greataxe');
    expect(fast.holyShare).toBeCloseTo(0.2, 3);
    expect(med.holyShare).toBeCloseTo(0.3, 3);
    expect(slow.holyShare).toBeCloseTo(0.4, 3);
    expect(fast.ls).toBeCloseTo(0.01, 9);
    expect(med.ls).toBeCloseTo(0.015, 9);
    expect(slow.ls).toBeCloseTo(0.02, 9);
  });
});

describe('the Duelist starts with B-scaling Novice Twin Daggers (D371)', () => {
  it('only the starting pair: dropped daggers keep S', async () => {
    const { weaponOf } = await import('../../src/game/items/weaponOf');
    const { WEAPONS } = await import('../../src/data/weapons');
    const c = newCharacter('duelist', 'D', 'd', new Rng(3));
    expect(c.equipment.main!.baseId).toBe('twin_daggers');
    expect(weaponOf(c.equipment.main)!.grades.slicey).toBe('B');
    expect(c.equipment.main!.name).toMatch(/Novice Twin Daggers/);
    expect(WEAPONS.twin_daggers!.grades.slicey).toBe('S');
  });
});

describe('balance numbers (D371)', () => {
  it('Vexthorn pays three times the shards; gems drop 30% more; raising a rarity costs half', async () => {
    const { BOSSES } = await import('../../src/data/bosses');
    const { GEM_CHANCE } = await import('../../src/data/lootTables');
    const { RARITY_UPGRADE_COST, PROF_CLASSES, PROF_PERK_MULT } = await import('../../src/data/proficiency');
    expect(BOSSES.vexthorn!.mult?.shards).toBe(3);
    expect(GEM_CHANCE.enemy).toBeCloseTo(0.0169, 6);
    expect(RARITY_UPGRADE_COST).toEqual({ common: 75, uncommon: 200, rare: 500, epic: 1250 });
    expect(PROF_PERK_MULT).toBe(1.3);
    expect(PROF_CLASSES.talisman!.perks.map((k) => k.stat)).toEqual(['spellCooldown', 'spellDuration']);
    expect(PROF_CLASSES.greataxe!.perks[0]!.per).toBeCloseTo(0.013, 9);
  });

  it('Talisman proficiency makes a spell buff last longer (spell duration in place of cast speed)', async () => {
    const { runEffects } = await import('../../src/game/effects/run');
    const { SPELLS } = await import('../../src/data/spells');
    const s = session('cleric');
    const p = s.localPlayer!;
    const c = p.pl!.char;
    const ward = SPELLS.ward_of_steel!;
    const cast = (): number => {
      p.buffs = [];
      runEffects(s.w, ward.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: p.x + 50, aimY: p.y, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'ward', school: 'prayer' });
      return p.buffs!.find((b) => b.id === 'ward_self')!.until - s.w.time;
    };
    c.proficiency = {};
    refreshDerived(p);
    const plain = cast();
    c.proficiency = { talisman: 1e6 };
    refreshDerived(p);
    expect(p.pl!.derived.spellDurationPct).toBeGreaterThan(0.5);
    expect(cast()).toBeCloseTo(plain * (1 + p.pl!.derived.spellDurationPct), 3);
  });
});
