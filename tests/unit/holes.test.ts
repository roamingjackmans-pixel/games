// D173: no enemy floats over a hole: pits and the void block fliers as they block walkers; fliers still pass props.
import { describe, expect, it } from 'vitest';
import { Room, ROOM_W, ROOM_H, ROOM_Y0, T, TILE } from '../../src/game/room';
import { stepToward } from '../../src/game/enemies/pathing';

function roomWithTrench(kind: number): Room {
  const tiles = new Uint8Array(ROOM_W * ROOM_H);
  for (let i = 0; i < tiles.length; i++) {
    const x = i % ROOM_W;
    const y = Math.floor(i / ROOM_W);
    if (x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1) tiles[i] = T.Wall;
  }
  // a hole across the room's middle with a gap at the bottom
  for (let y = 1; y < ROOM_H - 4; y++) for (let x = 19; x <= 20; x++) tiles[y * ROOM_W + x] = kind;
  return new Room(tiles);
}

describe('holes block every enemy (D173)', () => {
  for (const [name, kind] of [
    ['pit', T.Pit],
    ['void', T.Void],
  ] as const) {
    it(`a flier goes round a ${name}, never over it`, () => {
      const room = roomWithTrench(kind);
      expect(room.blocksMove(19, 5, true)).toBe(true);
      expect(room.blocksMove(19, 5, false)).toBe(true);
      // a flier walks from the left side to the right side at the top of the room
      const e = { x: 12 * TILE + 16, y: ROOM_Y0 + 4 * TILE + 16, radius: 14 };
      const gx = 28 * TILE + 16;
      const gy = ROOM_Y0 + 4 * TILE + 16;
      let overHole = false;
      for (let i = 0; i < 2000 && Math.hypot(e.x - gx, e.y - gy) > 20; i++) {
        const [dx, dy] = stepToward(room, e.x, e.y, gx, gy, true, i / 60, e.radius);
        room.moveCircle(e, dx * 4, dy * 4, true);
        if (room.isFallAt(e.x, e.y)) overHole = true;
      }
      expect(overHole).toBe(false);
      expect(Math.hypot(e.x - gx, e.y - gy)).toBeLessThan(40);
    });
  }

  it('fliers still pass over props; walkers do not', () => {
    const room = roomWithTrench(T.Prop);
    expect(room.blocksMove(19, 5, true)).toBe(false);
    expect(room.blocksMove(19, 5, false)).toBe(true);
  });
});
