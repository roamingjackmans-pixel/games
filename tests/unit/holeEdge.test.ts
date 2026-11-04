// D175: a dodge that ends on a pit's rim never leaves you stuck: you fell in, or you are on the floor.
import { describe, expect, it } from 'vitest';
import { Room, ROOM_W, ROOM_H, ROOM_Y0, T, TILE } from '../../src/game/room';

function pitRoom(): Room {
  const tiles = new Uint8Array(ROOM_W * ROOM_H);
  for (let i = 0; i < tiles.length; i++) {
    const x = i % ROOM_W;
    const y = Math.floor(i / ROOM_W);
    if (x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1) tiles[i] = T.Wall;
  }
  // a 4 x 4 pit in the middle (tiles 18..21 across, 9..12 down)
  for (let y = 9; y <= 12; y++) for (let x = 18; x <= 21; x++) tiles[y * ROOM_W + x] = T.Pit;
  return new Room(tiles);
}
const pitLeft = 18 * TILE;
const midY = ROOM_Y0 + 10.5 * TILE;

describe('no getting stuck on a hole rim (D175)', () => {
  it('a body half over the rim (centre on the floor) walks away and along the edge', () => {
    for (const [dx, dy] of [
      [-60, 0],
      [0, 60],
      [0, -60],
    ] as const) {
      const room = pitRoom();
      // centre 4 px left of the pit, body (r 14 → collision 11.2) well over it
      const e = { x: pitLeft - 4, y: midY, radius: 14 };
      const x0 = e.x;
      const y0 = e.y;
      for (let i = 0; i < 10; i++) room.moveCircle(e, dx / 10, dy / 10);
      expect(Math.hypot(e.x - x0, e.y - y0)).toBeGreaterThan(40);
      expect(room.circleBlocked(e.x, e.y, 11.2)).toBe(false);
    }
  });

  it('standing still after the dodge, the body is set clear of the pit', () => {
    const room = pitRoom();
    const e = { x: pitLeft - 4, y: midY, radius: 14 };
    expect(room.pushOutOfHoles(e)).toBe(true);
    expect(room.circleBlocked(e.x, e.y, 11.2)).toBe(false);
    expect(pitLeft - e.x).toBeLessThan(14); // a short step, not a teleport
  });

  it('a body whose centre is over the pit is left alone (it falls)', () => {
    const room = pitRoom();
    const e = { x: pitLeft + 6, y: midY, radius: 14 };
    expect(room.pushOutOfHoles(e)).toBe(false);
    expect(e.x).toBe(pitLeft + 6);
  });
});
