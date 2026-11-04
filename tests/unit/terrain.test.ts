// Hazardous terrain (PROCGEN §3.2): generation rules across seeds and zones, the Slow and Hurt effects, the dodge
// keeping its full distance, determinism, and the room sync to guests.
import { describe, expect, it } from 'vitest';
import { generateZone } from '../../src/game/procgen/zone';
import { buildRoom } from '../../src/game/procgen/rooms';
import { TERRAIN_HEAVY_COVER, TERRAIN_MAX_COVER, TERRAIN_ROOM_RATE, terrainStream } from '../../src/game/procgen/terrain';
import { TERRAIN_HURT_PCT, TERRAIN_HURT_TICK_S } from '../../src/game/systems/terrain';
import { Room, ROOM_H, ROOM_W, T, TERRAIN, doorTiles, worldToTile, type Side } from '../../src/game/room';
import { World, type Entity } from '../../src/game/world';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { roomSync, fromB64 } from '../../src/game/net/snapshot';
import { ENEMIES } from '../../src/data/enemies';

const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function cleanReach(room: Room, from: number): Uint8Array {
  const seen = new Uint8Array(ROOM_W * ROOM_H);
  const q = [from];
  seen[from] = 1;
  while (q.length) {
    const c = q.pop()!;
    const x = c % ROOM_W;
    const y = (c - x) / ROOM_W;
    for (const [dx, dy] of N4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) continue;
      const ni = ny * ROOM_W + nx;
      if (seen[ni] || room.blocksMove(nx, ny) || room.terrain[ni]) continue;
      seen[ni] = 1;
      q.push(ni);
    }
  }
  return seen;
}

describe('hazardous terrain generation (PROCGEN §3.2)', () => {
  it('only some combat/ambush rooms, on plain floor, capped, clear of doors/spawns/chests, always a clean route', () => {
    let eligible = 0;
    let withTerrain = 0;
    let slowTiles = 0;
    let hurtTiles = 0;
    let heavyRooms = 0;
    const heavyKinds = new Set<string>();
    for (let s = 0; s < 14; s++)
      for (let z = 1; z <= 8; z++) {
        const L = generateZone(`terrain-${s}`, z, { tutorial: s === 0 && z === 1 });
        for (const n of L.rooms) {
          const { room, markers } = buildRoom(L, n, n.kind === 'boss' ? undefined : undefined);
          const tiles: number[] = [];
          for (let i = 0; i < room.terrain.length; i++) if (room.terrain[i]) tiles.push(i);
          const tag = `seed ${s} zone ${z} ${n.id} (${n.kind}, ${n.shape})`;
          if (n.kind !== 'combat' && n.kind !== 'ambush') {
            expect(tiles.length, tag).toBe(0);
            continue;
          }
          eligible++;
          if (!tiles.length) continue;
          withTerrain++;
          let floor = 0;
          for (let i = 0; i < room.tiles.length; i++) if (room.tiles[i] === T.Floor) floor++;
          // a heavy room (D160) may cover far more than an ordinary one
          expect(tiles.length, tag).toBeLessThanOrEqual(Math.floor(floor * TERRAIN_HEAVY_COVER));
          const heavy = tiles.length > Math.floor(floor * TERRAIN_MAX_COVER);
          if (heavy) {
            heavyRooms++;
            const k = new Set(tiles.map((i) => room.terrain[i]));
            heavyKinds.add(k.size === 2 ? 'mixed' : k.has(TERRAIN.Slow) ? 'slow' : 'hurt');
          }
          const doors: [number, number][] = [];
          for (const sd of ['n', 's', 'e', 'w'] as Side[]) doors.push(...doorTiles(sd));
          const keep = [...markers.spawns, ...markers.chests, room.nearestFloor(640, 368, 22)].map(([x, y]) => worldToTile(x, y));
          for (const i of tiles) {
            const x = i % ROOM_W;
            const y = (i - x) / ROOM_W;
            if (room.terrain[i] === TERRAIN.Slow) slowTiles++;
            else hurtTiles++;
            expect(room.tiles[i], tag).toBe(T.Floor);
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const t = room.tiles[(y + dy) * ROOM_W + x + dx];
                expect(t === T.Floor || t === T.Grate, `${tag} tile ${x},${y} touches ${t}`).toBe(true);
                // patches of different kinds never touch
                const o = room.terrain[(y + dy) * ROOM_W + x + dx]!;
                expect(o === 0 || o === room.terrain[i], tag).toBe(true);
              }
            for (const [dx, dy] of doors) expect(Math.max(Math.abs(dx - x), Math.abs(dy - y)), tag).toBeGreaterThan(3);
            for (const [kx, ky] of keep) expect(Math.max(Math.abs(kx - x), Math.abs(ky - y)), tag).toBeGreaterThan(1);
          }
          // a terrain-free route joins every open door, spawn point and chest spot
          const open = (['n', 's', 'e', 'w'] as Side[]).filter((sd) => room.doors[sd].exists).flatMap((sd) => doorTiles(sd));
          const [fx, fy] = open[0]!;
          const r = cleanReach(room, fy * ROOM_W + fx);
          for (const [x, y] of open) expect(r[y * ROOM_W + x], `${tag} door ${x},${y}`).toBe(1);
          for (const [x, y] of keep) expect(r[y * ROOM_W + x], `${tag} spot ${x},${y}`).toBe(1);
          // 1–3 patches
          const seen = new Uint8Array(room.terrain.length);
          let patches = 0;
          for (const i of tiles) {
            if (seen[i]) continue;
            patches++;
            const q = [i];
            seen[i] = 1;
            while (q.length) {
              const c = q.pop()!;
              for (const d of [1, -1, ROOM_W, -ROOM_W])
                if (room.terrain[c + d] && !seen[c + d]) {
                  seen[c + d] = 1;
                  q.push(c + d);
                }
            }
          }
          expect(patches, tag).toBeGreaterThanOrEqual(1);
          expect(patches, tag).toBeLessThanOrEqual(8); // 1–3, or 4–8 in a heavy room (D160)
        }
      }
    const share = withTerrain / eligible;
    expect(share).toBeGreaterThan(TERRAIN_ROOM_RATE - 0.1);
    expect(share).toBeLessThan(TERRAIN_ROOM_RATE + 0.06);
    // both kinds turn up
    expect(slowTiles).toBeGreaterThan(200);
    expect(hurtTiles).toBeGreaterThan(200);
    // heavy rooms turn up, in all three themes
    expect(heavyRooms / eligible).toBeGreaterThan(0.06);
    expect([...heavyKinds].sort()).toEqual(['hurt', 'mixed', 'slow']);
  });

  it('is deterministic per room', () => {
    for (let z = 1; z <= 8; z++) {
      const L1 = generateZone('det-seed', z);
      const L2 = generateZone('det-seed', z);
      for (const n of L1.rooms) {
        const a = buildRoom(L1, n).room.terrain;
        const b = buildRoom(L2, L2.byId[n.id]!).room.terrain;
        expect([...a]).toEqual([...b]);
        if (terrainStream(L1, n) === null) expect(a.some((v) => v !== 0)).toBe(false);
      }
    }
  });
});

function setup(kind: number): { w: World; p: Entity } {
  const room = Room.empty();
  if (kind) room.terrain.fill(kind);
  const w = new World('TEST', room);
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 300, 368);
  return { w, p };
}
function run(w: World, seconds: number): void {
  for (let i = 0; i < Math.round(seconds * 60); i++) stepWorld(w);
}
function walkRight(p: Entity): void {
  p.pl!.input = { ...emptyInput(), moveX: 1, moveY: 0, aimX: 1200, aimY: 368, buttons: 0, pressed: 0 };
}

describe('hazardous terrain effects', () => {
  it('Slow terrain: −35% walking speed, and the dodge keeps its full distance', () => {
    const plain = setup(0);
    const slow = setup(TERRAIN.Slow);
    for (const s of [plain, slow]) {
      walkRight(s.p);
      run(s.w, 1);
    }
    const dPlain = plain.p.x - 300;
    const dSlow = slow.p.x - 300;
    expect(dPlain).toBeGreaterThan(50);
    expect(dSlow / dPlain).toBeCloseTo(0.65, 2);
    // dodges from a standstill, same direction
    const a = setup(0);
    const b = setup(TERRAIN.Slow);
    for (const s of [a, b]) {
      s.p.pl!.input = { ...emptyInput(), moveX: 1, moveY: 0, aimX: 1200, aimY: 368, buttons: ACTION_BIT.dodge, pressed: ACTION_BIT.dodge };
      stepWorld(s.w);
      s.p.pl!.input = { ...emptyInput(), aimX: 1200, aimY: 368 };
      run(s.w, 0.6);
    }
    expect(a.p.x - 300).toBeGreaterThan(60);
    expect(b.p.x - 300).toBeCloseTo(a.p.x - 300, 5);
  });

  it('Slow terrain slows walking enemies but not fliers', () => {
    const walker = Object.values(ENEMIES).find((d) => (d.speed ?? 0) > 40 && !['stationary', 'hover', 'ceiling'].includes(d.moveStyle))!;
    const dist = (kind: number): number => {
      const { w, p } = setup(kind);
      w.god = true;
      p.x = 1100;
      const e = spawnEnemy(w, walker, 300, 200, { tellS: 0 });
      const x0 = e.x;
      const y0 = e.y;
      run(w, 0.8);
      return Math.hypot(e.x - x0, e.y - y0);
    };
    const d0 = dist(0);
    const d1 = dist(TERRAIN.Slow);
    expect(d0).toBeGreaterThan(10);
    expect(d1).toBeLessThan(d0 * 0.8);
  });

  it('Hurt terrain: 3% of max HP every 0.5 s while standing in it; a dodge i-frame skips the tick; enemies are spared', () => {
    const { w, p } = setup(TERRAIN.Hurt);
    const max = p.hp!.max;
    const hp0 = p.hp!.hp;
    const hit = Math.max(1, Math.round(max * TERRAIN_HURT_PCT));
    run(w, 1 / 60);
    expect(hp0 - p.hp!.hp).toBe(hit);
    run(w, TERRAIN_HURT_TICK_S - 3 / 60);
    expect(hp0 - p.hp!.hp).toBe(hit);
    run(w, 4 / 60);
    expect(hp0 - p.hp!.hp).toBe(hit * 2);
    run(w, 1.0);
    expect(hp0 - p.hp!.hp).toBe(hit * 4);
    // dodging through: i-frames skip ticks that fall inside them
    const d = setup(TERRAIN.Hurt);
    d.p.pl!.terrainHurtAt = 0.1;
    d.p.pl!.input = { ...emptyInput(), moveX: 1, aimX: 1200, aimY: 368, buttons: ACTION_BIT.dodge, pressed: ACTION_BIT.dodge };
    stepWorld(d.w);
    d.p.pl!.input = { ...emptyInput(), aimX: 1200, aimY: 368 };
    const before = d.p.hp!.hp;
    run(d.w, 0.25);
    expect(d.p.hp!.hp).toBe(before);
    // no terrain → no damage
    const c = setup(0);
    const h = c.p.hp!.hp;
    run(c.w, 2);
    expect(c.p.hp!.hp).toBe(h);
    // an enemy standing in it takes nothing
    const e = spawnEnemy(w, Object.values(ENEMIES)[0]!, 900, 500, { tellS: 0 });
    const eh = e.hp!.hp;
    w.god = true;
    run(w, 1.5);
    expect(e.hp!.hp).toBe(eh);
  });

  it('travels to guests with the room sync', () => {
    for (let s = 0; s < 6; s++) {
      const L = generateZone(`sync-${s}`, 3);
      const n = L.rooms.find((r) => buildRoom(L, r).room.terrain.some((v) => v !== 0));
      if (!n) continue;
      const room = buildRoom(L, n).room;
      const w = new World('SYNC', room);
      const sync = roomSync(w, n.id, n.kind, 3, [], []);
      expect(sync.terrain).toBeTypeOf('string');
      expect([...fromB64(sync.terrain!)]).toEqual([...room.terrain]);
      const plain = roomSync(new World('SYNC', Room.empty()), 'x', 'combat', 3, [], []);
      expect(plain.terrain).toBeUndefined();
      return;
    }
    throw new Error('no room with terrain found');
  });
});
