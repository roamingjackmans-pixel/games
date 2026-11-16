// D422: Overload is a 15 s buff that halves the cooldown of every spell cast while it lasts (spell cooldowns only), and
// it comes back in 50 s.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { ENEMIES } from '../../src/data/enemies';
import { SPELLS } from '../../src/data/spells';
import { cooldownReduction, tryCastSpell } from '../../src/game/skills/use';
import { buffSum } from '../../src/game/combat/state';
import { emptyInput } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';

function setup(): { w: World; p: ReturnType<typeof spawnPlayer> } {
  const w = new World('OVL', Room.empty());
  const c = newCharacter('scholar', 'Joe', 'p1', new Rng(5));
  c.stats.brain = 40;
  c.knownSpells = [...new Set([...c.knownSpells, 'overload', 'arcane_bolt'])];
  c.spellLoadout.brain = ['overload', 'arcane_bolt', null];
  const p = spawnPlayer(w, c, 0, true, 500, 368);
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368 };
  w.god = true;
  // something to fight, so cooldowns run (D177); far away
  spawnEnemy(w, ENEMIES.hollow_wolf!, 1200, 650);
  return { w, p };
}
const run = (w: World, s: number): void => {
  for (let i = 0; i < Math.round(s * 60); i++) stepWorld(w);
};
const left = (w: World, at: number): number => Math.max(0, at - w.time);

describe('Overload (D422)', () => {
  it('is a 15 s, −50% spell-cooldown buff on a 50 s cooldown', () => {
    const sp = SPELLS.overload!;
    expect(sp.cooldownS).toBe(50);
    expect(sp.effect).toEqual([{ op: 'buff', stat: 'spellCooldownPct', amount: -0.5, durationS: 15, id: 'overload' }]);
  });

  it('spells cast under it come back in half the time; its own cooldown is the full 50 s; weapon skills are untouched', () => {
    const { w, p } = setup();
    const cdr = p.pl!.derived.spellCdr;
    const skillCdr = cooldownReduction(w, p);
    expect(tryCastSpell(w, p, 0)).toBe(true);
    run(w, 0.5);
    expect(buffSum(p, 'spellCooldownPct', w.time)).toBeCloseTo(-0.5, 6);
    expect(left(w, p.pl!.spellReadyAt[0]!)).toBeGreaterThan(50 * (1 - cdr) - 1);
    expect(tryCastSpell(w, p, 1)).toBe(true);
    expect(left(w, p.pl!.spellReadyAt[1]!)).toBeCloseTo(SPELLS.arcane_bolt!.cooldownS * (1 - cdr) * 0.5, 2);
    // weapon skills' cooldowns are not spells': their reduction is unchanged under it
    expect(cooldownReduction(w, p)).toBeCloseTo(skillCdr, 9);
    // 15 s on, it has worn off: spells take their full time again
    run(w, 15);
    expect(buffSum(p, 'spellCooldownPct', w.time)).toBe(0);
    p.pl!.spellReadyAt[1] = 0;
    run(w, 1);
    expect(tryCastSpell(w, p, 1)).toBe(true);
    expect(left(w, p.pl!.spellReadyAt[1]!)).toBeCloseTo(SPELLS.arcane_bolt!.cooldownS * (1 - cdr), 2);
  });
});
