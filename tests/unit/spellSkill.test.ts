// D182: staffs and talismans give a Spell Skill from your Brain or Prayer and their own scaling; every spell grows with it.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { spellSkill, toolSpellSkill } from '../../src/game/skills/use';
import { spellUtility } from '../../src/game/combat/formulas';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnPlayer } from '../../src/game/player/player';
import { runEffects } from '../../src/game/effects/run';
import { Rng } from '../../src/engine/rng';

const scholar = (brain: number, staff = 'apprentice_staff', ilvl = 1) => {
  const c = newCharacter('scholar', 'S', 's', new Rng(1));
  c.stats.brain = brain;
  c.equipment.off = makeItem(staff, 'common', ilvl);
  return c;
};

describe('Spell Skill (D182)', () => {
  it('grows with Brain, with a better scaling letter, and with item level', () => {
    const at = (brain: number, staff = 'apprentice_staff', ilvl = 1): number => spellSkill(computeDerived(scholar(brain, staff, ilvl)), 'brain');
    expect(at(30)).toBeGreaterThan(at(10));
    expect(at(60)).toBeGreaterThan(at(30));
    // S-scaling rod gains more from each point of Brain than the C-scaling apprentice staff
    const gainC = at(60) / at(10);
    const gainS = at(60, 'archmagister_rod') / at(10, 'archmagister_rod');
    expect(gainS).toBeGreaterThan(gainC);
    expect(at(30, 'apprentice_staff', 5)).toBeGreaterThan(at(30, 'apprentice_staff', 1));
    // the tooltip's number agrees with the character's
    const c = scholar(40, 'arcane_staff', 3);
    expect(toolSpellSkill(c.equipment.off!, c.stats)).toBe(spellSkill(computeDerived(c), 'brain'));
  });

  it('other effects grow gently and never run away', () => {
    expect(spellUtility(1)).toBe(1);
    expect(spellUtility(2.7)).toBeGreaterThan(1.45);
    expect(spellUtility(2.7)).toBeLessThan(1.55);
    expect(spellUtility(1000)).toBe(3);
  });

  it('a spell buff and barrier grow with Spell Skill; heals too', () => {
    const run = (power: number) => {
      const w = new World('SK', Room.empty());
      const p = spawnPlayer(w, scholar(30), 0, true, 400, 368);
      p.hp!.hp = 1;
      const ctx = { sourceId: p.id, team: 0 as const, x: p.x, y: p.y, aimX: p.x, aimY: p.y, targetId: 0, powerMult: power, isSpell: true, isSkill: false, baseDamage: 10, windupS: 0.5, tag: 'spell:test' };
      runEffects(w, [{ op: 'buff', stat: 'defenseAll', amount: 30, durationS: 10, id: 'ward' }], ctx);
      runEffects(w, [{ op: 'barrier', pctMaxHp: 0.2, durationS: 8, target: 'self' }], ctx);
      runEffects(w, [{ op: 'heal', pct: 0.1, target: 'self' }], ctx);
      const ward = p.buffs!.find((b) => b.id === 'ward')!.amount;
      return { ward, barrier: p.hp!.barrier, hp: p.hp!.hp, max: p.hp!.max };
    };
    const lo = run(1);
    const hi = run(3);
    expect(lo.ward).toBe(30);
    expect(hi.ward).toBeCloseTo(30 * spellUtility(3), 5);
    expect(hi.barrier).toBeGreaterThan(lo.barrier);
    expect(hi.hp - 1).toBeCloseTo(3 * (lo.hp - 1), 0);
  });
});
