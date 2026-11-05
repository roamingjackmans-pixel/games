// D213: a Shielded Elite's barrier (25% of max HP) comes back 5 s after it is broken; chip damage that does not
// break it stays. D212: the Bloatking has no Red circle any more.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { SHIELDED_REFILL_S } from '../../src/game/enemies/ai';
import { Rng } from '../../src/engine/rng';

const run = (w: World, s: number): void => {
  for (let i = 0; i < Math.round(s * 60); i++) stepWorld(w);
};

describe('Shielded Elites (D213)', () => {
  it('chip damage stays; a broken barrier returns 5 s later, full', () => {
    const w = new World('SHIELD', Room.empty());
    w.god = true;
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p', new Rng(1)), 0, true, 200, 600);
    const e = spawnEnemy(w, ENEMIES.shambler!, 1000, 200, { elite: 'shielded', tellS: 0 });
    run(w, 2); // past its spawn-in
    const full = e.hp!.max * 0.25;
    expect(e.hp!.barrier).toBeCloseTo(full, 3);
    const hit = (n: number): void => {
      const spec = emptySpec('player');
      spec.dmg.physical = n;
      spec.poiseDmg = 0;
      e.hp!.invulnUntil = 0;
      hitEnemy(w, p, e, spec, p.x, p.y);
    };
    // chip a third off: it does not come back, not even after 15 s
    hit(full / 3);
    const chipped = e.hp!.barrier;
    expect(chipped).toBeLessThan(full);
    run(w, 15);
    expect(e.hp!.barrier).toBeCloseTo(chipped, 1);
    // break it: nothing for 5 s, then full again
    hit(full * 2);
    expect(e.hp!.barrier).toBe(0);
    run(w, SHIELDED_REFILL_S - 0.3);
    expect(e.hp!.barrier).toBe(0);
    run(w, 0.6);
    expect(e.hp!.barrier).toBeCloseTo(full, 3);
  });
});

describe('the Bloatking (D212)', () => {
  it('has no Red circle attack', () => {
    const atks = BOSSES.bloatking!.phases.flatMap((ph) => ph.attacks);
    expect(atks.some((a) => a.id === 'bloat_grasp')).toBe(false);
    expect(atks.some((a) => a.kind === 'red' && a.pattern.kind === 'circle')).toBe(false);
  });
});
