import { describe, expect, it } from 'vitest';
import { SKILLS } from '../../src/data/skills';
import { SPELLS, BRAIN_SPELLS, PRAYER_SPELLS } from '../../src/data/spells';
import { WEAPONS } from '../../src/data/weapons';
import { CLASSES, CLASS_IDS } from '../../src/data/classes';
import { CASTING_TOOLS } from '../../src/data/castingTools';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer, refreshDerived } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { installRules } from '../../src/game/rules';
import { tryCastSpell, tryUseSkill, cooldownReduction, spellPowerMult } from '../../src/game/skills/use';
import { makeItem } from '../../src/game/items/make';
import { makeGem } from '../../src/data/gems';
import { computeDerived } from '../../src/game/player/derived';
import { itemRequirements, meetsRequirements } from '../../src/game/items/bases';
import { emptyInput } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { ENEMIES } from '../../src/data/enemies';
import { validateData } from '../../src/data/validate';

function world(): { w: World; p: Entity } {
  const w = new World('SKILLS', Room.empty());
  const c = newCharacter('knight', 'Joe', 'p1', new Rng(4));
  for (const k of ['hp', 'endurance', 'bonk', 'slicey', 'brain', 'prayer'] as const) c.stats[k] = 60;
  const p = spawnPlayer(w, c, 0, true, 500, 368);
  installRules(w, { onPlayerDown: (_w, e) => (e.hp!.hp = e.hp!.max) });
  for (let i = 0; i < 4; i++) spawnEnemy(w, ENEMIES.shambler!, 650 + i * 40, 300 + i * 40, { tellS: 0 });
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368 };
  p.pl!.aimX = 700;
  p.pl!.aimY = 368;
  return { w, p };
}
function run(w: World, s: number): void {
  for (let i = 0; i < Math.round(s * 60); i++) stepWorld(w);
}

describe('spells and classes data (CONTENT_SPELLS_CLASSES §4)', () => {
  it('14 Brain + 14 Prayer spells, requirement ≥ 8, a school, none in both lists', () => {
    expect(BRAIN_SPELLS.length).toBe(14);
    expect(PRAYER_SPELLS.length).toBe(14);
    expect(BRAIN_SPELLS.filter((s) => PRAYER_SPELLS.includes(s))).toEqual([]);
    for (const s of Object.values(SPELLS)) {
      expect(s.req, s.id).toBeGreaterThanOrEqual(8);
      expect(['brain', 'prayer']).toContain(s.school);
      expect(s.effect.length, s.id).toBeGreaterThan(0);
    }
  });
  it('every class sums to 48 (the Hunter 46, D184), meets its own requirements, and its first spell of each school is castable', () => {
    expect(CLASS_IDS.length).toBe(10);
    for (const id of CLASS_IDS) {
      const cls = CLASSES[id];
      const st = cls.stats;
      expect(st.hp + st.endurance + st.bonk + st.slicey + st.brain + st.prayer, id).toBe(id === 'hunter' ? 46 : 48);
      const c = newCharacter(id, 'Joe', 'p', new Rng(1));
      const d = computeDerived(c);
      expect(d.weaponMeetsReq, `${id} weapon`).toBe(true);
      if (c.equipment.off) expect(meetsRequirements(itemRequirements(c.equipment.off), c.stats, false), `${id} off-hand`).toBe(true);
      if (c.altMain) expect(meetsRequirements(itemRequirements(c.altMain), c.stats, c.twoHanded), `${id} 2nd weapon`).toBe(true);
      expect(d.load.tier, `${id} equip load`).not.toBe('encumbered');
      // every starting spell is castable with a starting tool of its school, in its own loadout
      for (const sid of cls.start.spells) {
        const sp = SPELLS[sid]!;
        const tools = [c.equipment.main, c.equipment.off, c.altMain].filter((it) => it && CASTING_TOOLS[it.baseId]?.school === sp.school);
        expect(tools.length, `${id} has a tool for ${sid}`).toBeGreaterThan(0);
        expect(c.spellLoadout[sp.school], `${id} loadout`).toContain(sid);
      }
      // the first spell of each school is castable at the start; later ones may be learnt ahead (the Hunter, D184)
      const firstOf = new Set<string>();
      for (const sid of cls.start.spells) {
        const sp = SPELLS[sid]!;
        expect(sp, sid).toBeDefined();
        if (firstOf.has(sp.school)) continue;
        firstOf.add(sp.school);
        expect((sp.school === 'brain' ? st.brain : st.prayer) >= sp.req, `${id} ${sid}`).toBe(true);
      }
    }
  });
  it('the reworked classes (D118–D121) keep their ids and get their new kits', () => {
    expect(CLASSES.cleric.name).toBe('Pyre Priest');
    expect(CLASSES.cleric.start.main).toBe('censer_flail');
    expect(WEAPONS.censer_flail!.element).toBe('fire');
    const bm = CLASSES.spearman;
    expect(bm.name).toBe('Battlemage');
    expect([bm.start.main, bm.start.alt]).toEqual(['colossal_sword', 'apprentice_staff']);
    expect(bm.stats.bonk).toBeGreaterThanOrEqual(13);
    expect(bm.stats.brain).toBeGreaterThanOrEqual(10);
    // started Medium (D121); every item weighing 20% more (D163) puts the colossal sword's wielder in Heavy
    expect(computeDerived(newCharacter('spearman', 'J', 'p', new Rng(1))).load.tier).toBe('heavy');
    const bz = CLASSES.berserker;
    expect(bz.start.main).toBe('twin_axes');
    expect(bz.twoHanded).toBe(true);
    // D123 / D140: real Bonk and Slicey behind the axes, HP 9 and Prayer 3
    expect(bz.stats.bonk).toBe(13);
    expect(bz.stats.slicey).toBe(14);
    expect(bz.stats.hp).toBe(9);
    expect(bz.stats.prayer).toBe(3);
    expect(bz.stats.bonk).toBeGreaterThanOrEqual(WEAPONS.twin_axes!.req.bonk);
    expect(bz.stats.slicey).toBeGreaterThanOrEqual(WEAPONS.twin_axes!.req.slicey);
    const z = CLASSES.occultist;
    expect(z.start.main).toBe('dawn_glaive');
    expect(z.stats.slicey + z.stats.prayer).toBeGreaterThanOrEqual(24);
  });
  it('every weapon class has 3 existing skills in Q/E/R order and the data validates', () => {
    for (const w of Object.values(WEAPONS)) {
      expect(w.skills.length).toBe(3);
      w.skills.forEach((sid, i) => {
        expect(SKILLS[sid], sid).toBeDefined();
        expect(SKILLS[sid]!.key).toBe(i);
        expect(SKILLS[sid]!.weapon).toBe(w.id);
      });
    }
    expect(Object.keys(SKILLS).length).toBe(63); // D320: Chakrams brought three
    expect(validateData().map((i) => `${i.where}: ${i.msg}`)).toEqual([]);
  });
});

describe('every skill and spell resolves in a headless world', () => {
  for (const w of Object.values(WEAPONS)) {
    it(`${w.name} skills`, () => {
      const { w: wo, p } = world();
      const c = p.pl!.char;
      c.equipment.main = makeItem(w.id, 'legendary', 7);
      c.equipment.off = null;
      refreshDerived(p);
      expect(p.pl!.derived.skillsUnlocked).toBe(3);
      for (let i = 0; i < 3; i++) {
        p.stam!.cur = p.stam!.max;
        p.pl!.state = 'idle';
        expect(tryUseSkill(wo, p, i), `${w.id} skill ${i}`).toBe(true);
        run(wo, 3.5);
        p.pl!.channel = null;
        p.pl!.charge = null;
        p.pl!.state = 'idle';
      }
    });
  }
  for (const sp of Object.values(SPELLS)) {
    it(`spell ${sp.name}`, () => {
      const { w: wo, p } = world();
      const c = p.pl!.char;
      c.equipment.off = makeItem(sp.school === 'brain' ? 'arcane_staff' : 'silver_talisman', 'common', 1);
      c.twoHanded = false;
      c.knownSpells = [sp.id];
      c.spellLoadout[sp.school] = [sp.id, null, null];
      refreshDerived(p);
      p.pl!.state = 'idle';
      expect(tryCastSpell(wo, p, 0), sp.id).toBe(true);
      run(wo, 4);
    });
  }
});

describe('caps and casting rules', () => {
  it('cooldown reduction is capped at 50% and attack speed at ×1.6', () => {
    const { w, p } = world();
    const c = p.pl!.char;
    c.equipment.main = makeItem('longsword', 'legendary', 5, { gems: [makeGem('tempo', { q: 0.5 }), makeGem('tempo', { q: 0.5 })] });
    c.equipment.main.affixes.push({ id: 'hasty', value: 12 }, { id: 'swift', value: 40 });
    c.equipment.ring1 = makeItem('band_bonk', 'rare', 1);
    c.equipment.ring1.affixes.push({ id: 'hasty', value: 12 });
    refreshDerived(p);
    expect(cooldownReduction(w, p)).toBeLessThanOrEqual(0.5);
    expect(p.pl!.derived.attackSpeed).toBeLessThanOrEqual(1.6);
  });
  it('a staff refuses Prayer spells and a below-requirement tool cannot cast', () => {
    const { w, p } = world();
    const c = p.pl!.char;
    c.equipment.off = makeItem('arcane_staff', 'common', 1);
    c.knownSpells = ['heal', 'arcane_bolt'];
    c.spellLoadout.prayer = ['heal', null, null];
    c.spellLoadout.brain = [null, null, null];
    refreshDerived(p);
    expect(tryCastSpell(w, p, 0)).toBe(false); // staff + empty Brain slot: the Prayer loadout is not used
    c.spellLoadout.brain = ['arcane_bolt', null, null];
    c.stats.brain = 5;
    refreshDerived(p);
    expect(tryCastSpell(w, p, 0)).toBe(false); // the Arcane Staff needs Brain 14
    expect(CASTING_TOOLS.arcane_staff!.req).toBe(14);
  });
  it('spell power scales with Brain and the casting tool, not the caster level', () => {
    const { p } = world();
    const c = p.pl!.char;
    c.stats.brain = 10;
    c.equipment.off = makeItem('arcane_staff', 'common', 1);
    refreshDerived(p);
    const a = spellPowerMult(p, SPELLS.arcane_bolt!);
    c.equipment.off = makeItem('arcane_staff', 'common', 5);
    c.stats.brain = 60;
    refreshDerived(p);
    expect(spellPowerMult(p, SPELLS.arcane_bolt!)).toBeGreaterThan(a * 2);
  });
});
