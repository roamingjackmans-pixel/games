// The one stun rule (D293): every full stun on a player (a grab's hold, a freeze, a hold control) lasts 70% of its
// listed length, none takes hold while one is on or for 0.5 s after one ends, and each one in a chain (starting within
// 6 s of the last one ending) is halved again, down to a quarter.
import { describe, expect, it } from 'vitest';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { applyControl, emptySpec, hitPlayer, playerStunned, resetPlayerStun, PLAYER_STUN_MULT } from '../../src/game/combat/damage';
import { TRAINING_DUMMY } from '../../src/data/enemies/special';
import { Rng } from '../../src/engine/rng';

function rig(): { w: World; p: Entity; grab: (listed?: number) => void; freeze: (listed?: number) => void; at: (t: number) => void; t0: number } {
  const w = new World('STUN', Room.empty());
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 600, 368);
  const d = spawnEnemy(w, TRAINING_DUMMY, 640, 368, { tellS: 0 });
  const t0 = w.time;
  return {
    w,
    p,
    t0,
    grab: (listed = 2 / PLAYER_STUN_MULT) => {
      const s = emptySpec('red');
      s.dmg = { physical: 1 };
      s.grab = { holdS: listed, mult: 1 };
      hitPlayer(w, d.id, p, s, d.x, d.y);
    },
    freeze: (listed = 2 / PLAYER_STUN_MULT) => applyControl(w, p, 'freeze', listed),
    at: (t: number) => {
      while (w.time < t0 + t - 1e-9) stepWorld(w);
    },
  };
}
/** how long the current stun has left */
const left = (r: ReturnType<typeof rig>): number => {
  const pl = r.p.pl!;
  if (pl.state === 'held') return pl.holdUntil - r.w.time;
  return Math.max(0, r.p.st!.controls.freeze - r.w.time, r.p.st!.controls.hold - r.w.time);
};

describe('one stun rule for every full stun (D293)', () => {
  it('a freeze during a grab does nothing, and neither does one in the 0.5 s after it', () => {
    const r = rig();
    r.grab();
    expect(r.p.pl!.state).toBe('held');
    r.at(1);
    r.freeze();
    expect(r.p.st!.controls.freeze).toBeLessThanOrEqual(r.w.time);
    r.at(2.3);
    expect(playerStunned(r.w, r.p)).toBe(false);
    r.freeze();
    expect(playerStunned(r.w, r.p)).toBe(false);
  });

  it('a grab during a freeze does nothing, and neither does one in the 0.5 s after it', () => {
    const r = rig();
    r.freeze();
    expect(playerStunned(r.w, r.p)).toBe(true);
    r.at(1);
    r.grab();
    expect(r.p.pl!.state).not.toBe('held');
    r.at(2.3);
    expect(playerStunned(r.w, r.p)).toBe(false);
    r.grab();
    expect(r.p.pl!.state).not.toBe('held');
  });

  it('stuns in a chain are halved each time, down to a quarter', () => {
    const r = rig();
    r.grab();
    expect(left(r)).toBeCloseTo(2, 3);
    // the next, after the grace: half as long (1 s), whatever kind it is
    r.at(2.55);
    r.freeze();
    expect(left(r)).toBeCloseTo(1, 3);
    // the third: a quarter (0.5 s)
    r.at(4.1);
    r.grab();
    expect(r.p.pl!.state).toBe('held');
    expect(left(r)).toBeCloseTo(0.5, 3);
    // the fourth stays at a quarter
    r.at(5.2);
    r.freeze();
    expect(left(r)).toBeCloseTo(0.5, 3);
  });

  it('the chain lapses 6 s after the last stun ended: the next is full length again', () => {
    const r = rig();
    r.grab();
    r.at(2.55);
    r.grab();
    expect(left(r)).toBeCloseTo(1, 3);
    // that one ends at 3.55; at 9.5 the chain is still on, at 9.6 it has lapsed
    r.at(9.5);
    r.freeze();
    expect(left(r)).toBeCloseTo(0.5, 3);
    const r2 = rig();
    r2.grab();
    r2.at(2.55);
    r2.grab();
    r2.at(9.6);
    r2.freeze();
    expect(left(r2)).toBeCloseTo(2, 3);
  });

  it('a hold control (a bat screech) counts as a full stun; root, silence and blind do not', () => {
    const r = rig();
    applyControl(r.w, r.p, 'root', 2);
    applyControl(r.w, r.p, 'silence', 2);
    applyControl(r.w, r.p, 'blind', 2);
    expect(playerStunned(r.w, r.p)).toBe(false);
    applyControl(r.w, r.p, 'hold', 0.4);
    expect(playerStunned(r.w, r.p)).toBe(true);
    expect(left(r)).toBeCloseTo(0.28, 3);
    // a grab right after it is refused (the grace), the root still applies
    r.at(0.5);
    r.grab();
    expect(r.p.pl!.state).not.toBe('held');
  });

  it('a rest, respawn or revive starts afresh', () => {
    const r = rig();
    r.grab();
    r.at(2.55);
    r.grab();
    r.at(3.6);
    resetPlayerStun(r.p);
    r.freeze();
    expect(left(r)).toBeCloseTo(2, 3);
  });

  it("freezes the players put on enemies are untouched (no cut, no grace, they stack as before)", () => {
    const r = rig();
    const en = spawnEnemy(r.w, TRAINING_DUMMY, 300, 300, { tellS: 0 });
    applyControl(r.w, en, 'freeze', 1.5);
    expect(en.st!.controls.freeze - r.w.time).toBeCloseTo(1.5, 5);
    applyControl(r.w, en, 'freeze', 3);
    expect(en.st!.controls.freeze - r.w.time).toBeCloseTo(3, 5);
  });
});
