// D227: staffs, talismans and shields take gems; off-hand staffs and talismans can be reinforced; rings stack.
import { describe, expect, it } from 'vitest';
import { newCharacter } from '../../src/game/player/character';
import { computeDerived } from '../../src/game/player/derived';
import { makeItem } from '../../src/game/items/make';
import { canSocket, socketGem, socketKind } from '../../src/game/items/inventory';
import { canReinforce, reinforceItem } from '../../src/game/items/reinforce';
import { toolSpellSkill } from '../../src/game/skills/use';
import { makeGem } from '../../src/data/gems';
import { Rng } from '../../src/engine/rng';

describe('gear fixes (D227)', () => {
  it('a staff or talisman takes weapon gems, a shield armour gems, and their perks work', () => {
    const c = newCharacter('hunter', 'Joe', 'p', new Rng(1));
    const staff = makeItem('apprentice_staff', 'rare', 2, { sockets: 2 });
    const shield = makeItem('kite_shield', 'rare', 2, { sockets: 1 });
    expect(socketKind(staff)).toBe('weapon');
    expect(socketKind(shield)).toBe('armor');
    expect(canSocket(staff, makeGem('brutal'))).toBe(true);
    expect(canSocket(staff, makeGem('hearth'))).toBe(false);
    expect(canSocket(shield, makeGem('hearth'))).toBe(true);
    expect(canSocket(shield, makeGem('brutal'))).toBe(false);
    // into the second socket of a 2nd-weapon staff, as asked
    c.altMain = staff;
    c.gems = [makeGem('brutal')];
    expect(socketGem(c, staff.id, 1, 0).ok).toBe(true);
    expect(staff.sockets.map((g) => !!g)).toEqual([false, true]);
    // a shield's armour gem counts while it is held
    c.twoHanded = false;
    c.equipment.off = shield;
    c.stats.bonk = 30;
    const before = computeDerived(c).maxHp;
    c.gems = [makeGem('hearth')];
    expect(socketGem(c, shield.id, 0, 0).ok).toBe(true);
    expect(computeDerived(c).maxHp).toBeGreaterThan(before);
  });

  it('a staff or talisman can be reinforced, and each + raises its Spell Skill', () => {
    const c = newCharacter('scholar', 'Joe', 'p', new Rng(1));
    const staff = c.equipment.off!;
    expect(staff.kind).toBe('staff');
    expect(canReinforce(staff)).toBe(true);
    c.glowen = 1e6;
    c.essence = [6, 0, 0, 0, 0];
    const s0 = toolSpellSkill(staff, c.stats);
    const p0 = computeDerived(c).offTool!.mult;
    expect(reinforceItem(c, staff.id).ok).toBe(true);
    expect(staff.plus).toBe(1);
    expect(toolSpellSkill(staff, c.stats)).toBeGreaterThan(s0);
    expect(computeDerived(c).offTool!.mult).toBeCloseTo(p0 * 1.15, 6); // D303: a casting tool gains 15% a step
  });

  it('two of the same ring both count: two Slumlord’s Signets give +30% damage and ×0.7225 HP', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const base = computeDerived(c);
    c.equipment.ring1 = makeItem('slumlords_signet', 'legendary', 1);
    const one = computeDerived(c);
    c.equipment.ring2 = makeItem('slumlords_signet', 'legendary', 1);
    const two = computeDerived(c);
    expect(two.ringCounts.slumlords_signet).toBe(2);
    expect(two.dmgPct - base.dmgPct).toBeCloseTo(0.3, 6);
    expect(two.dmgPct - one.dmgPct).toBeCloseTo(0.15, 6);
    expect(two.maxHp).toBeLessThan(one.maxHp);
  });
});
