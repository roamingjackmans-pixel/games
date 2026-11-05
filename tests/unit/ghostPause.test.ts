// D202: each ally hit on a downed co-op player holds their bleed-out countdown for 3 s, starting the 3 s again.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { addRevive, GHOST_HIT_PAUSE_S } from '../../src/game/combat/damage';

function party() {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('s'));
  ch.tutorialDone = true;
  const s = new GameSession(newSave(1, ch, 'GHOST-SEED'));
  s.start();
  s.joinPlayer(newCharacter('duelist', 'Guest', 'p2', new Rng('g')));
  s.w.god = false;
  const ghost = s.players.find((p) => !p.local)!.entity!;
  return { s, host: s.localPlayer!, ghost };
}
const run = (s: GameSession, sec: number): void => {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
};
const left = (s: GameSession, g: { pl?: { ghostUntil: number } }): number => g.pl!.ghostUntil - s.w.time;

describe('downed countdown pause (D202)', () => {
  it('holds 3 s after each hit, each hit starting the 3 s again, then runs on', () => {
    const { s, host, ghost } = party();
    expect(GHOST_HIT_PAUSE_S).toBe(3);
    s.downPlayer(ghost);
    ghost.pl!.reviveNeed = 1e9; // never revived in this test
    run(s, 5);
    expect(left(s, ghost)).toBeCloseTo(25, 1);
    addRevive(s.w, ghost, host as never, 1);
    run(s, 2);
    expect(left(s, ghost)).toBeCloseTo(25, 1); // held
    addRevive(s.w, ghost, host as never, 1); // 2 s in: the hold starts again
    run(s, 2.5);
    expect(left(s, ghost)).toBeCloseTo(25, 1); // 4.5 s since the first hit, still held
    run(s, 1.5);
    expect(left(s, ghost)).toBeCloseTo(24, 1); // the hold ended 3 s after the second hit, then 1 s ran
    expect(ghost.pl!.downed).toBe(true);
  });
});
