// D294: a weapon card shows the hit you would really deal with it, every perk counted, and compares like with like.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { makeGem } from '../../src/data/gems';
import { profClassOf } from '../../src/game/items/proficiency';
import { effectiveSpellSkill, effectiveWeaponHit } from '../../src/game/items/effectiveDamage';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnPlayer, weaponSpec } from '../../src/game/player/player';
import { computeDerived } from '../../src/game/player/derived';
import { spellSkill } from '../../src/game/skills/use';
import type { Character } from '../../src/game/types';

const knight = (): Character => {
  const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
  c.twoHanded = false;
  return c;
};
const total = (o: Partial<Record<string, number>>): number => Object.values(o).reduce<number>((a, b) => a + (b ?? 0), 0);

describe('weapon cards show the real hit (D294)', () => {
  it("the equipped weapon's shown hit is exactly the hit weaponSpec deals", () => {
    const c = knight();
    const w = new World('CARD', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const mult = p.pl!.derived.weapon.combo[0]!.mult;
    const spec = weaponSpec(w, p, mult);
    const shown = effectiveWeaponHit(c, c.equipment.main!)!;
    expect(shown.total).toBeCloseTo(total(spec.dmg), 6);
    expect(shown.perSec).toBeGreaterThan(0);
  });

  it('counts proficiency: a weapon class with proficiency points hits harder on its card', () => {
    const c = knight();
    const before = effectiveWeaponHit(c, c.equipment.main!)!.total;
    const cls = profClassOf(c.equipment.main)!;
    expect(cls).toBeTruthy();
    c.proficiency = { ...(c.proficiency ?? {}), [cls]: 1e6 };
    expect(effectiveWeaponHit(c, c.equipment.main!)!.total).toBeGreaterThan(before);
  });

  it("counts a Brutal gem in the candidate's own socket, and one worn elsewhere (in the compared weapon too)", () => {
    const c = knight();
    const base = c.equipment.main!;
    const plain = makeItem(base.baseId, base.rarity, base.ilvl, { sockets: 1 });
    const gemmed = makeItem(base.baseId, base.rarity, base.ilvl, { sockets: 1, gems: [makeGem('brutal', { q: 0.5 })] });
    c.bag.push(plain, gemmed);
    const a = effectiveWeaponHit(c, plain)!.total;
    const b = effectiveWeaponHit(c, gemmed)!.total;
    expect(b).toBeGreaterThan(a * 1.05);
    // a Brutal ring-slot-free check: the same gem on the worn weapon lifts what the worn weapon shows
    const worn0 = effectiveWeaponHit(c, c.equipment.main!)!.total;
    c.equipment.main = gemmed;
    expect(effectiveWeaponHit(c, c.equipment.main)!.total).toBeGreaterThan(worn0);
  });

  it('a bag weapon is shown as it would be in your weapon hand, not as the worn one', () => {
    const c = knight();
    const axe = makeItem('battleaxe', 'epic', 10);
    c.bag.push(axe);
    const shown = effectiveWeaponHit(c, axe)!;
    const copy = structuredClone(c);
    copy.equipment.main = axe;
    const d = computeDerived(copy);
    expect(shown.total).toBeGreaterThan(0);
    expect(shown.total).toBeCloseTo(d.weaponPower * d.weapon.combo[0]!.mult * (1 + d.dmgPct) + total(d.flat), 3);
  });

  it('an off-hand crossbow shows its off-hand bolt (D291)', () => {
    const c = knight();
    c.equipment.off = makeItem('crossbow', 'rare', 6);
    const shown = effectiveWeaponHit(c, c.equipment.off)!;
    expect(shown.offHand).toBe(true);
    const d = computeDerived(c);
    expect(shown.total).toBeCloseTo(d.offWeapon!.power * d.offWeapon!.def.combo[0]!.mult * (1 + d.dmgPct) + total(d.flat), 3);
  });

  it("a staff's Spell Skill counts spell-power proficiency and matches what it casts with", () => {
    const c = newCharacter('scholar', 'Joe', 'p1', new Rng(1));
    c.twoHanded = false;
    const staff = [c.equipment.off, c.equipment.main].find((i) => i && (i.kind === 'staff' || i.kind === 'talisman'))!;
    expect(staff).toBeTruthy();
    const shown = effectiveSpellSkill(c, staff);
    c.proficiency = { ...(c.proficiency ?? {}), [profClassOf(staff)!]: 1e6 };
    expect(effectiveSpellSkill(c, staff)!).toBeGreaterThan(shown!);
    c.proficiency = {};
    const d = computeDerived(c);
    const held = [d.mainTool, d.offTool].find((t) => t?.item.id === staff.id)!;
    expect(shown).toBe(spellSkill({ ...d, mainTool: held, offTool: null }, held.def.school));
  });
});
