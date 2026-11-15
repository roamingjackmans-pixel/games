// D388: more hybrid weapon options per build and speed, four legendaries per class with their own fixed powers.
import { describe, expect, it } from 'vitest';
import { WEAPONS, speedTag } from '../../src/data/weapons';
import { WEAPON_VARIANTS } from '../../src/data/weaponVariants';
import { LEGENDARY_POWERS, LEGENDARY_WEAPON_POWERS } from '../../src/data/legendaries';
import { SKILLS } from '../../src/data/skills';
import { PROF_CLASSES } from '../../src/data/proficiency';
import { generateItem } from '../../src/game/items/generate';
import { Rng } from '../../src/engine/rng';
import { GRADE_MULT } from '../../src/game/combat/formulas';
import type { Grade } from '../../src/game/types';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { refreshDerived, swingStamina } from '../../src/game/player/player';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';

/** A grade counts for a build when it is C or better. */
const good = (g: Grade | undefined): boolean => !!g && GRADE_MULT[g] >= GRADE_MULT.C;

/** Every way a class can drop (itself and each scaling variant) that scales with both `a` and `b` at C or better. */
function options(a: 'bonk' | 'slicey', b: 'brain' | 'prayer', tag: 'fast' | 'medium'): string[] {
  const out: string[] = [];
  for (const w of Object.values(WEAPONS)) {
    if (speedTag(w) !== tag) continue;
    const forms: [string, Partial<Record<'bonk' | 'slicey' | 'brain' | 'prayer', Grade>>][] = [[w.id, w.grades], ...(WEAPON_VARIANTS[w.id] ?? []).map((v): [string, Partial<Record<'bonk' | 'slicey' | 'brain' | 'prayer', Grade>>] => [`${v.word} ${w.id}`, v.grades])];
    for (const [label, g] of forms) if (good(g[a]) && good(g[b])) out.push(label);
  }
  return out;
}

describe('every Bonk or Slicey build with Brain or Prayer has two Fast and two Medium weapons (D388)', () => {
  for (const a of ['bonk', 'slicey'] as const)
    for (const b of ['brain', 'prayer'] as const)
      for (const tag of ['fast', 'medium'] as const)
        it(`${a} + ${b}, ${tag}`, () => {
          expect(options(a, b, tag).length, options(a, b, tag).join(', ')).toBeGreaterThanOrEqual(2);
        });

  it('Slicey + Prayer has more than the Dawn Glaive', () => {
    const all = [...options('slicey', 'prayer', 'fast'), ...options('slicey', 'prayer', 'medium')];
    expect(all.filter((x) => !x.includes('dawn_glaive')).length).toBeGreaterThanOrEqual(3);
  });

  it('the four new classes are complete: three skills, a proficiency class, variants', () => {
    for (const id of ['cestus', 'rune_kris', 'hex_hammer', 'harvest_sickle']) {
      const w = WEAPONS[id]!;
      expect(w.skills.map((s) => SKILLS[s]?.weapon)).toEqual([id, id, id]);
      expect(PROF_CLASSES[id]).toBeTruthy();
      expect(WEAPON_VARIANTS[id]?.length).toBeGreaterThan(0);
    }
  });
});

describe('four legendaries per class, each with its own power (D388)', () => {
  it('every class has four legendary names, each mapped to a weapon power, four different powers a class', () => {
    for (const w of Object.values(WEAPONS)) {
      expect(w.legendaryNames.length, w.id).toBe(4);
      const powers = w.legendaryNames.map((n) => LEGENDARY_WEAPON_POWERS[n]);
      for (const p of powers) expect(LEGENDARY_POWERS[p ?? '']?.on, `${w.id} ${p}`).toContain('weapon');
      expect(new Set(powers).size, w.id).toBe(4);
    }
  });

  it('a dropped legendary weapon carries the power of its name, always', () => {
    let n = 0;
    for (let i = 0; i < 200; i++) {
      const it0 = generateItem(new Rng(`leg${i}`), { source: 'boss', ilvl: 5, zone: 5, rarity: 'legendary', slot: 'weapon' });
      if (it0.kind !== 'weapon') continue;
      n++;
      expect(it0.legendaryPower, it0.name).toBe(LEGENDARY_WEAPON_POWERS[it0.name]);
      expect(WEAPONS[it0.baseId]!.legendaryNames).toContain(it0.name);
    }
    expect(n).toBeGreaterThan(50);
  });
});

describe('the new legendary powers (D388)', () => {
  const setup = (power: string) => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng('pw'));
    c.tutorialDone = true;
    c.stats.bonk = c.stats.slicey = 40;
    const s = new GameSession(newSave(1, c, 'POW387'));
    s.start();
    const p = s.localPlayer!;
    const it = makeItem('longsword', 'legendary', 3);
    it.legendaryPower = power;
    p.pl!.char.equipment.main = it;
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    return { s, p };
  };
  const hitFor = (power: string, prep: (foe: ReturnType<typeof spawnEnemy>) => void = () => {}): number => {
    const { s, p } = setup(power);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x + 40, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    foe.en!.def = { ...foe.en!.def, resist: {}, element: 'physical' };
    foe.hp!.hp = foe.hp!.max = 10000;
    prep(foe);
    const before = foe.hp!.hp;
    const spec = emptySpec('player');
    spec.dmg.physical = 100;
    hitEnemy(s.w, p, foe, spec, p.x, p.y, { noLifesteal: true });
    return before - foe.hp!.hp;
  };

  it('Executioner: +40% below 25% HP; Giant Slayer: +25% on Elites', () => {
    const low = (f: ReturnType<typeof spawnEnemy>): void => {
      f.hp!.hp = 2000;
    };
    expect(hitFor('executioner', low) / hitFor('second_wind', low)).toBeCloseTo(1.4, 2);
    expect(hitFor('executioner') / hitFor('second_wind')).toBeCloseTo(1, 5);
    const elite = (f: ReturnType<typeof spawnEnemy>): void => {
      f.en!.elite = 'frenzied';
    };
    expect(hitFor('giant_slayer', elite) / hitFor('second_wind', elite)).toBeCloseTo(1.25, 2);
  });

  it('Quickdraw, Shatterpoint, Featherweight, Bounty Hunter and the status powers change the numbers they say', () => {
    const base = setup('second_wind').p.pl!.derived;
    expect(setup('quickdraw').p.pl!.derived.attackSpeed).toBeGreaterThan(base.attackSpeed * 1.1);
    expect(setup('shatterpoint').p.pl!.derived.poiseDmgMult).toBeCloseTo(base.poiseDmgMult + 0.5, 6);
    expect(setup('bounty_hunter').p.pl!.derived.shardFind).toBeCloseTo(base.shardFind + 0.25, 6);
    expect(swingStamina(setup('featherweight').p)).toBeCloseTo(swingStamina(setup('second_wind').p) * 0.75, 6);
    for (const [power, status] of [['bloodletter', 'bleed'], ['kindling', 'burn'], ['frostbite', 'chill'], ['static_charge', 'shock']] as const) {
      expect(setup(power).p.pl!.derived.statusBuild.some((sb) => sb.id === status), power).toBe(true);
    }
  });
});
