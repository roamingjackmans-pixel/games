// Attacks cost 50% more stamina and start only with the stamina to pay for them (D193); a dodge still goes on any.
import { describe, expect, it } from 'vitest';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { attackCost, canAffordAttack, spawnPlayer } from '../../src/game/player/player';
import { newCharacter } from '../../src/game/player/character';
import { stepWorld } from '../../src/game/sim';
import { CLASS_IDS, CLASSES } from '../../src/data/classes';
import { WEAPONS } from '../../src/data/weapons';
import { SKILLS } from '../../src/data/skills';
import { SPELLS } from '../../src/data/spells';
import { ATTACK_STAMINA_MULT, STAMINA_COST_MULT } from '../../src/game/combat/formulas';
import { computeDerived } from '../../src/game/player/derived';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';

function setup(): { w: World; p: Entity } {
  const w = new World('STAM', Room.empty());
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 600, 368);
  return { w, p };
}
function press(p: Entity, action: keyof typeof ACTION_BIT, moveX = 0): void {
  p.pl!.input = { ...emptyInput(), moveX, aimX: 700, aimY: 368, buttons: ACTION_BIT[action], pressed: ACTION_BIT[action] };
}

describe('attack stamina (D193)', () => {
  it('a swing costs 1.5x what it used to', () => {
    const { w, p } = setup();
    const amt = p.pl!.derived.weapon.stamina;
    expect(ATTACK_STAMINA_MULT).toBe(1.5);
    expect(attackCost(w, p, amt)).toBeCloseTo(amt * STAMINA_COST_MULT * 1.5 * p.pl!.derived.stamCost, 5);
    press(p, 'attack');
    const before = p.stam!.cur;
    stepWorld(w);
    expect(p.pl!.combo).not.toBeNull();
    expect(before - p.stam!.cur).toBeCloseTo(attackCost(w, p, amt), 1);
  });

  it('an attack needs its full cost; a dodge still goes on a sliver', () => {
    const { w, p } = setup();
    const amt = p.pl!.derived.weapon.stamina;
    const need = attackCost(w, p, amt);
    p.stam!.cur = need - 0.5;
    p.pl!.stamDelayUntil = w.time + 10; // no regen during the check
    expect(canAffordAttack(w, p, amt)).toBe(false);
    press(p, 'attack');
    stepWorld(w);
    expect(p.pl!.combo).toBeNull();
    expect(p.stam!.cur).toBeCloseTo(need - 0.5, 3);
    p.stam!.cur = 1;
    press(p, 'dodge', 1);
    stepWorld(w);
    expect(p.pl!.state).toBe('dodge');
  });

  it('no starting class has a swing, skill or spell it could never afford', () => {
    for (const c of CLASS_IDS) {
      const ch = newCharacter(c, 'Joe', 'p', new Rng('k'));
      const d = computeDerived(ch);
      const wpn = WEAPONS[CLASSES[c].start.main]!;
      const costs = [d.weapon.stamina, ...wpn.skills.map((s) => SKILLS[s]!.stamina), ...CLASSES[c].start.spells.map((s) => SPELLS[s]!.stamina)];
      for (const a of costs) expect(a * STAMINA_COST_MULT * ATTACK_STAMINA_MULT * d.stamCost, `${c} ${a}`).toBeLessThanOrEqual(d.maxStam);
    }
  });
});
