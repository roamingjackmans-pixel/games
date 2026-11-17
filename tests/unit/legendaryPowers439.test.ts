// D439: ten more legendary weapon powers, and no power on more than four weapon classes (each class still four names,
// four different powers). Each new power does what its text says.
import { describe, expect, it } from 'vitest';
import { LEGENDARY_POWERS, LEGENDARY_WEAPON_POWERS, powersFor } from '../../src/data/legendaries';
import { WEAPONS } from '../../src/data/weapons';
import type { Entity, World } from '../../src/game/world';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { refreshDerived } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { ENEMIES } from '../../src/data/enemies';
import { Rng } from '../../src/engine/rng';
import { cooldownReduction } from '../../src/game/skills/use';
import { stepWorld } from '../../src/game/sim';
import { checkDeath } from '../../src/game/combat/damage';

const NEW = ['backbreaker', 'first_blood', 'long_shot', 'finisher', 'counterstep', 'reapers_due', 'smite', 'drillmaster', 'whirlwind', 'venom'];

describe('legendary powers by weapon class (D439)', () => {
  it('every weapon power is on at least one and at most four weapon classes; each class has four different ones', () => {
    const classesOf = new Map<string, Set<string>>();
    for (const w of Object.values(WEAPONS)) {
      const powers = w.legendaryNames.map((n) => LEGENDARY_WEAPON_POWERS[n]);
      expect(powers.every(Boolean), w.id).toBe(true);
      expect(new Set(powers).size, w.id).toBe(4);
      for (const p of powers) (classesOf.get(p!) ?? classesOf.set(p!, new Set()).get(p!)!).add(w.id);
    }
    for (const id of powersFor('weapon')) {
      const n = classesOf.get(id)?.size ?? 0;
      expect(n, id).toBeGreaterThanOrEqual(1);
      expect(n, id).toBeLessThanOrEqual(4);
    }
    for (const id of NEW) expect(LEGENDARY_POWERS[id]?.on, id).toEqual(['weapon']);
  });
});

function fight(powers: string[]): { w: World; p: Entity; foe: Entity; dmg: (light?: boolean) => number } {
  const c = newCharacter('knight', 'Joe', 'p1', new Rng('pw439'));
  c.tutorialDone = true;
  c.stats.bonk = c.stats.slicey = 40;
  const s = new GameSession(newSave(1, c, 'POW439'));
  s.start();
  const w = s.w;
  const p = s.localPlayer!;
  const foe = spawnEnemy(w, ENEMIES.shambler!, p.x + 40, p.y, { tellS: 0 });
  foe.en!.state = 'alert';
  foe.en!.def = { ...foe.en!.def, resist: {}, element: 'physical' };
  foe.hp!.max = foe.hp!.hp = 1e6;
  w.refreshLists();
  p.pl!.derived.powers = new Set(powers);
  const dmg = (light = false): number => {
    const before = foe.hp!.hp;
    hitEnemy(w, p, foe, { ...emptySpec('player'), dmg: { physical: 100 } }, p.x, p.y, light ? { light: true, noLifesteal: true } : { noLifesteal: true });
    const d = before - foe.hp!.hp;
    foe.hp!.hp = foe.hp!.max * 0.9; // not at full: First Blood off for the next hit unless set
    foe.hp!.staggerUntil = 0;
    foe.hp!.poise = foe.hp!.poiseMax;
    return d;
  };
  return { w, p, foe, dmg };
}

describe('the new powers (D439)', () => {
  it('Backbreaker: +35% to a staggered enemy', () => {
    const { w, foe, dmg } = fight(['backbreaker']);
    foe.hp!.hp = foe.hp!.max * 0.9;
    const plain = dmg();
    foe.hp!.staggerUntil = w.time + 1;
    expect(dmg() / plain).toBeCloseTo(1.35, 2);
  });

  it('First Blood: +50% to an enemy at full HP', () => {
    const { foe, dmg } = fight(['first_blood']);
    foe.hp!.hp = foe.hp!.max * 0.9;
    const plain = dmg();
    foe.hp!.hp = foe.hp!.max;
    expect(dmg() / plain).toBeCloseTo(1.5, 2);
  });

  it('Smite: +30% to undead only', () => {
    const { foe, dmg } = fight(['smite']);
    foe.hp!.hp = foe.hp!.max * 0.9;
    const was = foe.en!.def.undead;
    foe.en!.def = { ...foe.en!.def, undead: false } as NonNullable<typeof foe.en>['def'];
    const living = dmg();
    foe.en!.def = { ...foe.en!.def, undead: true } as NonNullable<typeof foe.en>['def'];
    expect(dmg() / living).toBeCloseTo(1.3, 2);
    foe.en!.def = { ...foe.en!.def, undead: was === true } as NonNullable<typeof foe.en>['def'];
  });

  it('Counterstep: the first hit after a dodge, once', () => {
    const { w, p, foe, dmg } = fight(['counterstep']);
    foe.hp!.hp = foe.hp!.max * 0.9;
    const plain = dmg();
    p.pl!.counterUntil = w.time + 1;
    expect(dmg() / plain).toBeCloseTo(1.4, 2);
    expect(dmg() / plain).toBeCloseTo(1, 2);
  });

  it('Whirlwind: +15% for each other enemy within 150 px, up to three', () => {
    const { w, p, foe, dmg } = fight(['whirlwind']);
    foe.hp!.hp = foe.hp!.max * 0.9;
    const alone = dmg();
    for (let i = 0; i < 5; i++) spawnEnemy(w, ENEMIES.shambler!, p.x + 60 * Math.cos(i), p.y + 60 * Math.sin(i), { tellS: 0 }).en!.state = 'alert';
    w.refreshLists();
    expect(dmg() / alone).toBeCloseTo(1.45, 2);
  });

  it('Finisher: the last swing of the chain, a light hit', () => {
    const { p, foe, dmg } = fight(['finisher']);
    foe.hp!.hp = foe.hp!.max * 0.9;
    const plain = dmg(true);
    const combo = p.pl!.derived.weapon.combo;
    p.pl!.combo = { idx: combo.length - 1, phase: 'active', t: 0, dur: 1, swing: combo[combo.length - 1]!, hit: new Set(), queued: false, charging: false, chargeT: 0, speed: 1 } as never;
    expect(dmg(true) / plain).toBeCloseTo(1.4, 2);
    p.pl!.combo = { ...(p.pl!.combo as object), idx: 0 } as never;
    expect(dmg(true) / plain).toBeCloseTo(1, 2);
  });

  it("Drillmaster: weapon skills' cooldowns −20%", () => {
    const { w, p } = fight([]);
    const base = cooldownReduction(w, p);
    p.pl!.derived.powers = new Set(['drillmaster']);
    expect(cooldownReduction(w, p) - base).toBeCloseTo(Math.min(0.5, base + 0.2) - base, 9);
  });

  it('Venom: every hit builds Poison 12', () => {
    const { p } = fight([]);
    const c = p.pl!.char;
    c.equipment.main!.rarity = 'legendary';
    c.equipment.main!.legendaryPower = 'venom';
    refreshDerived(p);
    expect(p.pl!.derived.statusBuild).toContainEqual({ id: 'poison', buildup: 12 });
  });

  it("Reaper's Due: a kill heals 4% of max HP", () => {
    const { w, p, foe } = fight(['reapers_due']);
    p.hp!.hp = p.hp!.max * 0.5;
    const before = p.hp!.hp;
    foe.hp!.hp = 0;
    checkDeath(w, foe, p.id);
    stepWorld(w);
    expect(p.hp!.hp - before).toBeCloseTo(p.hp!.max * 0.04, 0);
  });
});
