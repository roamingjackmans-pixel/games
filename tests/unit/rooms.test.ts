import { describe, expect, it } from 'vitest';
import { gapViolations, mirrorTemplate, validateTemplate } from '../../src/game/procgen/templates';
import { ROOM_TEMPLATES } from '../../src/data/rooms';
import { BOSS_ARENAS } from '../../src/data/rooms/bosses';
import { ROOM_ANTEROOM, ROOM_MERCHANT, ROOM_RELIQUARY, ROOM_START, ROOM_TREASURE, ROOM_TRIAL, ROOM_TUTORIAL } from '../../src/data/rooms/special';
import { generateZone, SIDE_DELTA } from '../../src/game/procgen/zone';
import { roomRows } from '../../src/game/procgen/rooms';
import { SHAPED_MIN_FLOOR, shapeIds } from '../../src/game/procgen/shapes';
import { BLOCKING } from '../../src/game/procgen/templates';
import type { Side } from '../../src/game/room';

describe('room templates (PROCGEN §3)', () => {
  for (const [zone, list] of Object.entries(ROOM_TEMPLATES)) {
    it(`zone ${zone} templates are valid`, () => {
      if (list.length === 0) return;
      expect(list.length).toBe(10);
      expect(list.flatMap((t) => validateTemplate(t)).map((i) => `${i.id}: ${i.msg}`)).toEqual([]);
      expect(new Set(list.map((t) => t.id)).size).toBe(10);
    });
  }
  it('the gap rule: blocking things touch or leave ≥ 3 tiles, in every arena and special room too', () => {
    const all = [...Object.values(BOSS_ARENAS), ROOM_START, ROOM_ANTEROOM, ROOM_TREASURE, ROOM_RELIQUARY, ROOM_MERCHANT, ROOM_TUTORIAL, ROOM_TRIAL];
    for (const t of all) expect(gapViolations(t.rows), t.id).toEqual([]);
  });
  it('the gap rule catches 1- and 2-tile squeezes, straight and diagonal, and allows 3', () => {
    const grid = (pairs: [number, number][]): string[] => {
      const g = Array.from({ length: 22 }, (_, y) => (y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#').split(''));
      for (const [x, y] of pairs) g[y]![x] = 'P';
      return g.map((r) => r.join(''));
    };
    expect(gapViolations(grid([[10, 10], [12, 10]])).length).toBeGreaterThan(0); // 1 across
    expect(gapViolations(grid([[10, 10], [13, 10]])).length).toBeGreaterThan(0); // 2 across
    expect(gapViolations(grid([[10, 10], [14, 10]]))).toEqual([]); // 3 across
    expect(gapViolations(grid([[10, 10], [13, 13]])).length).toBeGreaterThan(0); // 2 + 2 diagonal
    expect(gapViolations(grid([[10, 10], [12, 11]])).length).toBeGreaterThan(0); // a knight's step
    expect(gapViolations(grid([[10, 10], [11, 11]]))).toEqual([]); // touching corners: one lump
    expect(gapViolations(grid([[3, 10]])).length).toBeGreaterThan(0); // 2 from the wall
    expect(gapViolations(grid([[4, 10]]))).toEqual([]); // 3 from the wall
    expect(gapViolations(grid([[1, 10]]))).toEqual([]); // against the wall
  });
});

/** Walkable tiles reachable from (sx, sy), 4-connected. */
function reachable(rows: string[], sx: number, sy: number): Set<string> {
  const seen = new Set([`${sx},${sy}`]);
  const q: [number, number][] = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 1 || ny < 1 || nx > 38 || ny > 20 || seen.has(`${nx},${ny}`) || BLOCKING.has(rows[ny]![nx]!)) continue;
      seen.add(`${nx},${ny}`);
      q.push([nx, ny]);
    }
  }
  return seen;
}

describe('room shapes (PROCGEN §3.1)', () => {
  const SEEDS = 12;
  it('every generated room of every zone is valid: gap rule, connected doors, spawns, chests, ≥ 50% floor', () => {
    for (let s = 0; s < SEEDS; s++)
      for (let z = 1; z <= 8; z++) {
        const L = generateZone(`shape-${s}`, z, { tutorial: z === 1 && s % 2 === 0 });
        for (const n of L.rooms) {
          const { rows, mirror } = roomRows(L, n);
          expect(rows.length).toBe(22);
          if (mirror) {
            expect(validateTemplate({ id: `${z}:${n.id}:${n.shape}`, rows }, { minFloor: SHAPED_MIN_FLOOR }).map((i) => `${i.id}: ${i.msg}`)).toEqual([]);
            continue;
          }
          if (n.kind === 'boss' || n.kind === 'tutorial' || n.kind === 'trial') continue;
          // framed special rooms: gap rule, all doors joined, their markers kept and reachable
          expect(gapViolations(rows), `${z}:${n.id}`).toEqual([]);
          const seen = reachable(rows, 19, 1);
          for (const [x, y] of [
            [19, 1],
            [1, 10],
            [38, 10],
            [19, 20],
          ])
            expect(seen.has(`${x},${y}`), `${z}:${n.id} door tile ${x},${y}`).toBe(true);
          for (let y = 0; y < 22; y++) for (let x = 0; x < 40; x++) if ('BRMC'.includes(rows[y]![x]!)) expect(seen.has(`${x},${y}`), `${z}:${n.id} marker at ${x},${y}`).toBe(true);
        }
      }
  });
  it('combat rooms really are shaped (the plain fallback is rare), with every family in use', () => {
    let rooms = 0;
    let plain = 0;
    for (let z = 1; z <= 8; z++) {
      const used = new Set<string>();
      for (let s = 0; s < SEEDS; s++) {
        const L = generateZone(`shape-${s}`, z);
        for (const n of L.rooms) {
          if (n.kind !== 'combat' && n.kind !== 'ambush') continue;
          rooms++;
          used.add(n.shape);
          const t = ROOM_TEMPLATES[z]!.find((x) => x.id === n.template)!;
          const before = mirrorTemplate(t.rows, n.mirrorH, n.mirrorV);
          const { rows } = roomRows(L, n);
          // walls the template did not have
          let carved = 0;
          for (let y = 1; y < 21; y++) for (let x = 1; x < 39; x++) if (rows[y]![x] !== before[y]![x] && (rows[y]![x] === '#' || rows[y]![x] === '_')) carved++;
          if (carved === 0) plain++;
        }
      }
      expect([...used].sort(), `zone ${z}`).toEqual([...shapeIds(z)].sort());
    }
    expect(plain / rooms).toBeLessThan(0.03);
  });
  it('neighbouring combat rooms do not share a shape family', () => {
    let pairs = 0;
    let same = 0;
    for (let s = 0; s < SEEDS * 2; s++)
      for (let z = 1; z <= 8; z++) {
        const L = generateZone(`nb-${s}`, z);
        for (const a of L.rooms) {
          if (!a.shape) continue;
          for (const side of ['e', 's'] as Side[]) {
            const [dx, dy] = SIDE_DELTA[side];
            const b = L.rooms.find((r) => r.gx === a.gx + dx && r.gy === a.gy + dy);
            if (!b?.shape) continue;
            pairs++;
            if (a.shape === b.shape) same++;
          }
        }
      }
    expect(pairs).toBeGreaterThan(100);
    expect(same).toBe(0);
  });
  it('is deterministic: the same seed builds the same rows', () => {
    const a = generateZone('DET', 5);
    const b = generateZone('DET', 5);
    for (let i = 0; i < a.rooms.length; i++) expect(roomRows(a, a.rooms[i]!).rows).toEqual(roomRows(b, b.rooms[i]!).rows);
  });
});
