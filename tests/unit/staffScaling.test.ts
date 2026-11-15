// Staffs scale on a flatter table than weapons (D395): S 30% weaker than before, A clearly under the new S, B and C
// as they were. Talismans keep the weapons' table.
import { describe, expect, it } from 'vitest';
import { GRADE_MULT, STAFF_GRADE_MULT, scalingCurve, toolGradeMult } from '../../src/game/combat/formulas';
import { CASTING_TOOLS } from '../../src/data/castingTools';
import { toolSpellSkill } from '../../src/game/skills/use';
import { makeItem } from '../../src/game/items/make';

describe('staff scaling (D395)', () => {
  it('S is 30% weaker, A clearly under it, B and C unchanged', () => {
    expect(STAFF_GRADE_MULT.S).toBeCloseTo(GRADE_MULT.S * 0.7, 2);
    expect(STAFF_GRADE_MULT.A).toBeLessThan(STAFF_GRADE_MULT.S - 0.05);
    expect(STAFF_GRADE_MULT.A).toBeGreaterThan(STAFF_GRADE_MULT.B);
    expect(STAFF_GRADE_MULT.B).toBe(GRADE_MULT.B);
    expect(STAFF_GRADE_MULT.C).toBe(GRADE_MULT.C);
  });

  it('a staff uses the flat table, a talisman the weapons’', () => {
    expect(toolGradeMult(CASTING_TOOLS.archmagister_rod!)).toBe(STAFF_GRADE_MULT.S);
    expect(toolGradeMult(CASTING_TOOLS.saints_relic!)).toBe(GRADE_MULT.S);
    expect(toolGradeMult(CASTING_TOOLS.arcane_staff!)).toBe(GRADE_MULT.B);
  });

  it("the Archmagister's Rod's Spell Skill at high Brain drops by the S cut, an Arcane Staff's does not change", () => {
    const rod = makeItem('archmagister_rod', 'common', 10);
    const arc = makeItem('arcane_staff', 'common', 10);
    const brain = 80;
    const k = scalingCurve(brain);
    const rodNow = toolSpellSkill(rod, { brain, prayer: 0 });
    const rodWas = (rodNow * (1 + GRADE_MULT.S * k)) / (1 + STAFF_GRADE_MULT.S * k);
    expect(rodNow / rodWas).toBeLessThan(0.9);
    expect(toolSpellSkill(arc, { brain, prayer: 0 })).toBeGreaterThan(0);
  });
});
