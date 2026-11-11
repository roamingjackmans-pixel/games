// D117: staffs and talismans in the weapon hand (block with a shield and cast), and two tools at once.
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer, refreshDerived } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { tryCastSpell, spellOf, spellPowerMult } from '../../src/game/skills/use';
import { makeItem } from '../../src/game/items/make';
import { equip, unequip } from '../../src/game/items/inventory';
import { computeDerived, toolForSchool } from '../../src/game/player/derived';
import { emptySpec, hitPlayer } from '../../src/game/combat/damage';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { SPELLS } from '../../src/data/spells';
import type { Character } from '../../src/game/types';

function mage(): { w: World; p: Entity; c: Character } {
  const w = new World('TOOLS', Room.empty());
  const c = newCharacter('scholar', 'Joe', 'p1', new Rng(2));
  c.equipment.main = makeItem('apprentice_staff', 'common', 1);
  c.equipment.off = makeItem('kite_shield', 'common', 1);
  c.stats.bonk = 17; // the Kite Shield needs Bonk 17 / Slicey 9 (D326)
  c.knownSpells = ['arcane_bolt', 'heal'];
  c.spellLoadout.brain = ['arcane_bolt', null, null];
  c.spellLoadout.prayer = ['heal', null, null];
  const p = spawnPlayer(w, c, 0, true, 500, 368);
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368 };
  p.pl!.aimX = 700;
  p.pl!.aimY = 368;
  return { w, p, c };
}
const run = (w: World, s: number): void => {
  for (let i = 0; i < Math.round(s * 60); i++) stepWorld(w);
};
const hold = (p: Entity, bits: number, pressed = 0): void => {
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368, buttons: bits, pressed };
};

describe('staffs and talismans in either hand (D117)', () => {
  it('a tool equips to the weapon hand and the 2nd weapon slot; a shield does not', () => {
    const c = newCharacter('scholar', 'Joe', 'p', new Rng(1));
    const staff = makeItem('arcane_staff', 'common', 1);
    const tal = makeItem('wooden_talisman', 'common', 1);
    const shield = makeItem('round_shield', 'common', 1);
    c.bag.push(staff, tal, shield);
    expect(equip(c, staff.id, 'main').ok).toBe(true);
    expect(c.equipment.main?.id).toBe(staff.id);
    expect(equip(c, tal.id, 'altMain').ok).toBe(true);
    expect(c.altMain?.id).toBe(tal.id);
    expect(equip(c, shield.id, 'main').ok).toBe(false);
    expect(unequip(c, 'altMain').ok).toBe(true);
    expect(equip(c, tal.id).ok).toBe(true); // default: the off hand
    expect(c.equipment.off?.id).toBe(tal.id);
  });

  it('a main-hand staff casts on Q/E/R while a shield sits in the off hand, and its light attack is a bash with no skills (D201)', () => {
    const { w, p } = mage();
    const d = p.pl!.derived;
    expect(d.mainTool?.def.id).toBe('apprentice_staff');
    expect(d.shield?.id).toBe('kite_shield');
    expect(d.skillKeySchool).toBe('brain');
    expect(d.weapon.skills).toEqual(['', '', '']);
    expect(d.weapon.base1).toBeGreaterThan(0);
    expect(d.weapon.base1).toBeLessThan(30);
    expect(d.spellKeys).toBeNull();
    expect(tryCastSpell(w, p, 0, 'skill')).toBe(true);
    run(w, 1);
    expect(p.pl!.state).toBe('idle');
    // light attack swings the staff
    hold(p, ACTION_BIT.attack, ACTION_BIT.attack);
    stepWorld(w);
    expect(p.pl!.state).toBe('attack');
  });

  it('blocks with the shield between casts', () => {
    const { w, p } = mage();
    inCombat(w); // D329
    expect(tryCastSpell(w, p, 0, 'skill')).toBe(true);
    run(w, 1);
    hold(p, ACTION_BIT.block);
    stepWorld(w);
    expect(p.pl!.blocking).toBe(true);
    const spec = emptySpec('normal');
    spec.dmg.physical = 40;
    spec.parryable = false;
    const hp0 = p.hp!.hp;
    expect(hitPlayer(w, 0, p, spec, p.x + 50, p.y)).toBe('blocked');
    expect(hp0 - p.hp!.hp).toBeLessThan(40 * 0.3);
  });

  it('requirements: a main-hand staff beyond your Brain neither casts nor swings at full power', () => {
    const { w, p, c } = mage();
    c.equipment.main = makeItem('arcane_staff', 'common', 1); // needs Brain 14
    c.stats.brain = 10;
    refreshDerived(p);
    expect(p.pl!.derived.mainTool?.meetsReq).toBe(false);
    expect(p.pl!.derived.weaponMeetsReq).toBe(false);
    expect(tryCastSpell(w, p, 0, 'skill')).toBe(false);
    c.stats.brain = 14;
    refreshDerived(p);
    expect(p.pl!.derived.weaponMeetsReq).toBe(true);
    expect(tryCastSpell(w, p, 0, 'skill')).toBe(true);
  });

  it('two tools: Q/E/R cast the weapon hand school, 1/2/3 the off hand school, each with its own tool: six spells (D201)', () => {
    const { w, p, c } = mage();
    c.stats.prayer = 20;
    c.equipment.off = makeItem('saints_relic', 'common', 1); // Prayer 26
    c.stats.prayer = 26;
    refreshDerived(p);
    const d = p.pl!.derived;
    expect(d.skillKeySchool).toBe('brain');
    expect(d.spellKeys).toBe('prayer');
    expect(spellOf(p, 0, 'skill')?.id).toBe('arcane_bolt');
    expect(spellOf(p, 0)?.id).toBe('heal');
    expect(toolForSchool(d, 'prayer')?.hand).toBe('off');
    // the relic's healing bonus applies to the Prayer spell; the staff's power to the Brain one
    expect(spellPowerMult(p, SPELLS.heal!)).toBeGreaterThan(spellPowerMult(p, SPELLS.arcane_bolt!) * 0.5);
    // Q casts Arcane Bolt from the weapon-hand staff (the cooldown goes on the Q slot)
    hold(p, ACTION_BIT.skill1, ACTION_BIT.skill1);
    stepWorld(w);
    expect(p.pl!.action?.id).toBe('arcane_bolt');
    expect(p.pl!.skillReadyAt[0]).toBeGreaterThan(w.time);
    run(w, 1.5);
    // 1 casts Heal from the off-hand talisman
    hold(p, ACTION_BIT.spell1, ACTION_BIT.spell1);
    stepWorld(w);
    expect(p.pl!.action?.id).toBe('heal');
    expect(p.pl!.spellReadyAt[0]).toBeGreaterThan(w.time);
    // swap the hands: the talisman's school moves to Q/E/R
    const staff = c.equipment.main!;
    c.equipment.main = c.equipment.off;
    c.equipment.off = staff;
    refreshDerived(p);
    expect(p.pl!.derived.skillKeySchool).toBe('prayer');
    expect(p.pl!.derived.spellKeys).toBe('brain');
  });

  it('a tool in the off hand alone casts on 1/2/3, and Q/E/R stay the weapon skills', () => {
    const c = newCharacter('scholar', 'Joe', 'p', new Rng(1));
    const d = computeDerived(c);
    expect(d.mainTool).toBeNull();
    expect(d.offTool?.def.school).toBe('brain');
    expect(d.spellKeys).toBe('brain');
    expect(d.skillKeySchool).toBeNull();
  });

  it('two-handing a main-hand tool still casts (the off hand is set aside)', () => {
    const { w, p, c } = mage();
    c.twoHanded = true;
    refreshDerived(p);
    expect(p.pl!.derived.shield).toBeNull();
    expect(tryCastSpell(w, p, 0, 'skill')).toBe(true);
  });

  it('equip load counts a main-hand tool and not the 2nd weapon', () => {
    const c = newCharacter('spearman', 'Joe', 'p', new Rng(1));
    const a = computeDerived(c).load.load;
    const staff = c.altMain!;
    c.altMain = c.equipment.main;
    c.equipment.main = staff;
    const b = computeDerived(c).load.load;
    expect(a - b).toBeCloseTo((16 - 2.5) * 1.2, 1); // items weigh 20% more (D163)
  });
});

describe('weapon buff spells need a weapon (D131)', () => {
  const blessSetup = (main: string | null, off: string): { w: World; p: Entity } => {
    const { w, p, c } = mage();
    c.equipment.main = main ? makeItem(main, 'common', 1) : null;
    c.equipment.off = makeItem(off, 'common', 1);
    c.stats.prayer = 30;
    c.stats.bonk = 30;
    c.knownSpells.push('bless_weapon');
    c.spellLoadout.prayer = ['bless_weapon', null, null];
    refreshDerived(p);
    return { w, p };
  };
  const blessed = (p: Entity): boolean => !!p.buffs?.some((b) => b.stat === 'holyConvertPct');
  it('Bless Weapon fails with a talisman in the weapon hand, and says why', () => {
    const { w, p } = blessSetup('wooden_talisman', 'kite_shield');
    const msgs: string[] = [];
    const emit = w.emit.bind(w);
    w.emit = (ev) => {
      if (ev.t === 'msg') msgs.push(ev.text);
      emit(ev);
    };
    expect(tryCastSpell(w, p, 0, 'skill')).toBe(false);
    run(w, 1);
    expect(blessed(p)).toBe(false);
    expect(msgs.some((m) => m.includes('needs a weapon'))).toBe(true);
  });
  it('Bless Weapon fails bare-handed', () => {
    const { w, p } = blessSetup(null, 'wooden_talisman');
    expect(tryCastSpell(w, p, 0)).toBe(false);
  });
  it('Bless Weapon casts with a weapon in hand and the talisman in the off hand', () => {
    const { w, p } = blessSetup('censer_flail', 'wooden_talisman');
    expect(tryCastSpell(w, p, 0)).toBe(true);
    run(w, 1.5);
    expect(blessed(p)).toBe(true);
  });
});
