// D177: spell cooldowns only run while there is something to fight, and a bonfire rest or a real death readies them.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer, resetSpellCooldowns } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { ENEMIES } from '../../src/data/enemies';
import { GARY } from '../../src/data/enemies/special';
import { emptyInput } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';

function setup(): { w: World; p: ReturnType<typeof spawnPlayer> } {
  const w = new World('CD', Room.empty());
  const c = newCharacter('cleric', 'Joe', 'p1', new Rng(3));
  const p = spawnPlayer(w, c, 0, true, 500, 368);
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368 };
  w.god = true;
  return { w, p };
}
const run = (w: World, s: number): void => {
  for (let i = 0; i < Math.round(s * 60); i++) stepWorld(w);
};
const left = (w: World, at: number): number => Math.max(0, at - w.time);

describe('spell cooldowns (D177)', () => {
  it('hold in an empty room (a merchant does not count) and run with an enemy there', () => {
    const { w, p } = setup();
    p.pl!.spellReadyAt[0] = w.time + 10;
    run(w, 3);
    expect(left(w, p.pl!.spellReadyAt[0])).toBeCloseTo(10, 1);
    spawnEnemy(w, GARY, 900, 368);
    run(w, 2);
    expect(left(w, p.pl!.spellReadyAt[0])).toBeCloseTo(10, 1);
    spawnEnemy(w, ENEMIES.hollow_wolf!, 1100, 600);
    run(w, 3);
    expect(left(w, p.pl!.spellReadyAt[0])).toBeLessThan(7.6);
  });

  it('weapon skills are not held', () => {
    const { w, p } = setup();
    p.pl!.skillReadyAt[0] = w.time + 10;
    run(w, 3);
    expect(left(w, p.pl!.skillReadyAt[0])).toBeLessThan(7.6);
  });

  it('a rest or a real death readies every spell', () => {
    const { w, p } = setup();
    p.pl!.spellReadyAt = [w.time + 30, w.time + 12, w.time + 5];
    resetSpellCooldowns(p);
    expect(p.pl!.spellReadyAt).toEqual([0, 0, 0]);
  });
});
