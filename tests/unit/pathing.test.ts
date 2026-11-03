import { describe, expect, it } from 'vitest';
import { Room, tileCenter } from '../../src/game/room';
import { stepToward } from '../../src/game/enemies/pathing';
import { generateZone } from '../../src/game/procgen/zone';
import { buildRoom } from '../../src/game/procgen/rooms';

/** Walk a body toward a goal the way ai.ts does (stepToward + moveCircle); true if it gets within `near` px. */
function walk(room: Room, from: [number, number], to: [number, number], radius: number, seconds = 40, near = 40): boolean {
  // bodies appear where they fit, as the session's spawner does (nearestFloor with the full radius)
  const [sx, sy] = room.nearestFloor(from[0], from[1], radius);
  const e = { x: sx, y: sy, radius };
  const dt = 1 / 60;
  const speed = 110;
  for (let t = 0; t < seconds; t += dt) {
    if (Math.hypot(to[0] - e.x, to[1] - e.y) < near) return true;
    const [dx, dy] = stepToward(room, e.x, e.y, to[0], to[1], false, t, radius);
    room.moveCircle(e, dx * speed * dt, dy * speed * dt);
  }
  return false;
}

function room(rows: string[]): Room {
  const r = Room.fromAscii(rows);
  r.id = rows.join('').slice(0, 64) + rows.length;
  return r;
}

describe('enemy pathing runs around obstacles', () => {
  // a long wall between the enemy (left) and the player (right): only a 1-tile slot at the top (pre-gap-rule)
  const WALL = room([
    '########################################',
    '#......................................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '########################################',
  ]);
  // the same wall leaving the 3-tile gap the rule allows
  const GAP = room([
    '########################################',
    '#......................................#',
    '#......................................#',
    '#......................................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '#.................#....................#',
    '########################################',
  ]);
  it('an enemy behind a wall walks around it to the player (small, big and Elite bodies)', () => {
    for (const r of [12, 24, 33, 43]) {
      expect(walk(GAP, tileCenter(10, 16), tileCenter(26, 16), r), `radius ${r}`).toBe(true);
      expect(walk(WALL, tileCenter(10, 16), tileCenter(26, 16), r), `radius ${r} through the 1-row gap`).toBe(r <= 12);
    }
  });
  it('big bodies weave through a field of pillars and props instead of sticking on them', () => {
    const FIELD = room([
      '########################################',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......P....P....o....P....P....o......#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#........oo....PP.....oo....PP.........#',
      '#........oo....PP.....oo....PP.........#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......P....____...P...____....P.......#',
      '#...........____.......____............#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#.....PPPPPPPPPPPPPPPPPPPPPPPPPPPP.....#',
      '#......................................#',
      '#......................................#',
      '########################################',
    ]);
    for (const r of [24, 33, 43])
      for (const [a, b] of [
        [tileCenter(3, 2), tileCenter(36, 20)],
        [tileCenter(20, 20), tileCenter(20, 2)],
        [tileCenter(36, 11), tileCenter(3, 11)],
      ] as const)
        expect(walk(FIELD, a, b, r), `radius ${r} ${a} → ${b}`).toBe(true);
  });
  it('in generated (shaped) rooms a big body gets from every spawn point to every open door', () => {
    for (let s = 0; s < 4; s++)
      for (let z = 1; z <= 8; z++) {
        const L = generateZone(`path-${s}`, z);
        for (const n of L.rooms.filter((r) => r.kind === 'combat').slice(0, 3)) {
          const { room: rm, markers } = buildRoom(L, n);
          rm.id = `${L.seed}|${z}|${n.id}`;
          const goals: [number, number][] = [tileCenter(20, 2), tileCenter(19, 19), tileCenter(2, 11), tileCenter(37, 10)];
          for (const sp of markers.spawns.slice(0, 3))
            for (const g of goals) for (const r of [33, 43]) expect(walk(rm, sp, g, r, 40, 52), `r ${r} zone ${z} ${n.id} (${n.shape}) from ${sp} to ${g}`).toBe(true);
        }
      }
  });
});
