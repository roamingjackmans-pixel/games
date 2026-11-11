// D316: two-handing sets the off hand's gems aside; an off-hand crossbow's skills are on the spell keys (1/2/3, D-pad).
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { computeDerived } from '../../src/game/player/derived';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { makeItem } from '../../src/game/items/make';
import { makeGem } from '../../src/data/gems';
import { offSkillOf, offSkillsUnlocked, spellKeysAreOffSkills } from '../../src/game/skills/use';
import { Rng } from '../../src/engine/rng';

describe('off-hand gems while two-handing (D316)', () => {
  it("a shield's Bulwark gem counts one-handed and not two-handed", () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.equipment.off = makeItem('round_shield', 'rare', 1, { sockets: 1, gems: [makeGem('bulwark', { q: 0 })] });
    c.twoHanded = false;
    const one = computeDerived(c);
    c.equipment.off = makeItem('round_shield', 'rare', 1, { sockets: 0 });
    const none = computeDerived(c);
    expect(one.defense.physical).toBeGreaterThan(none.defense.physical);
    c.equipment.off = makeItem('round_shield', 'rare', 1, { sockets: 1, gems: [makeGem('bulwark', { q: 0 })] });
    c.twoHanded = true;
    const two = computeDerived(c);
    c.equipment.off = makeItem('round_shield', 'rare', 1, { sockets: 0 });
    expect(two.defense.physical).toBeCloseTo(computeDerived(c).defense.physical, 6);
  });
});

describe('off-hand crossbow skills on the spell keys (D316)', () => {
  it('spell key 1 uses the crossbow skill 1, on its own cooldown, with the crossbow behind it', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const xb = makeItem('crossbow', 'legendary', 10);
    xb.skills = 3;
    c.equipment.off = xb;
    c.twoHanded = false;
    c.stats.bonk = 60;
    const w = new World('OFFSK', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const d = p.pl!.derived;
    expect(spellKeysAreOffSkills(d)).toBe(true);
    expect(offSkillsUnlocked(d)).toBe(3);
    expect(offSkillOf(p, 0)?.id).toBe('crossbow_piercing_bolt');
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.spell1, pressed: ACTION_BIT.spell1 };
    stepWorld(w);
    expect(p.pl!.state).toBe('skill');
    expect(p.pl!.action?.offHand).toBe(true);
    expect(p.pl!.action?.id).toBe('crossbow_piercing_bolt');
    expect(p.pl!.spellReadyAt[0]).toBeGreaterThan(w.time);
    expect(p.pl!.skillReadyAt[0]).toBe(0);
  });
});
