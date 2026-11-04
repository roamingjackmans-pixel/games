// D185: you cannot dodge (or walk, dash or leap) into a hole; only an attack's knockback or pull puts you in one.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room, ROOM_W, ROOM_H, ROOM_Y0, T, TILE } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { Rng } from '../../src/engine/rng';

function pitRoom(): Room {
  const tiles = new Uint8Array(ROOM_W * ROOM_H);
  for (let y = 4; y <= 16; y++) for (let x = 18; x <= 21; x++) tiles[y * ROOM_W + x] = T.Pit;
  return new Room(tiles);
}
const midY = ROOM_Y0 + 10.5 * TILE;

describe('holes only take you when an attack sends you in (D185)', () => {
  it('a dodge toward a pit stops at its edge', () => {
    const w = new World('HOLE', pitRoom());
    const p = spawnPlayer(w, newCharacter('knight', 'J', 'p', new Rng(1)), 0, true, 18 * TILE - 30, midY);
    const pl = p.pl!;
    pl.state = 'dodge';
    pl.stateUntil = pl.dodgeUntil = w.time + 0.45;
    pl.dodgeDir = [1, 0];
    for (let i = 0; i < 40; i++) stepWorld(w);
    expect(pl.falling).toBeNull();
    expect(w.room.isFallAt(p.x, p.y)).toBe(false);
    expect(p.x).toBeLessThan(18 * TILE);
  });

  it('a knockback into the pit drops you', () => {
    const w = new World('HOLE', pitRoom());
    const p = spawnPlayer(w, newCharacter('knight', 'J', 'p', new Rng(1)), 0, true, 18 * TILE - 30, midY);
    p.forced = { vx: 400, vy: 0, until: w.time + 0.3, kind: 'knock' }; // ends over the pit
    let fell = false;
    for (let i = 0; i < 40 && !fell; i++) {
      stepWorld(w);
      fell = !!p.pl!.falling;
    }
    expect(fell).toBe(true);
  });
});
