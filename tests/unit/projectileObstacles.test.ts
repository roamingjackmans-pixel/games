// D180: enemy shots stop at obstacles (props, crates, trees), not only walls; player shots still fly over them.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room, ROOM_W, ROOM_H, ROOM_Y0, T, TILE } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer, spawnPlayerProjectile } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { spawnEnemyProjectile } from '../../src/game/enemies/attacks';
import { emptySpec } from '../../src/game/combat/damage';
import { stepWorld } from '../../src/game/sim';
import { ENEMIES } from '../../src/data/enemies';
import { SPELL_PROJECTILE_SCALE } from '../../src/game/effects/run';
import { Rng } from '../../src/engine/rng';

function propRoom(): Room {
  const tiles = new Uint8Array(ROOM_W * ROOM_H);
  // a column of props across x tile 20
  for (let y = 2; y < ROOM_H - 2; y++) tiles[y * ROOM_W + 20] = T.Prop;
  return new Room(tiles);
}
const midY = ROOM_Y0 + 10.5 * TILE;

describe('projectiles and obstacles (D180)', () => {
  it('an enemy shot stops at a prop', () => {
    const w = new World('PRJ', propRoom());
    const p = spawnPlayer(w, newCharacter('knight', 'J', 'p', new Rng(1)), 0, true, 30 * TILE, midY);
    const e = spawnEnemy(w, ENEMIES.hollow_wolf!, 12 * TILE, midY);
    const shot = spawnEnemyProjectile(w, e, 0, 500, { kind: 'projectile', speed: 500, r: 6 }, emptySpec(), p.id, p.x, p.y);
    for (let i = 0; i < 120 && !shot.removed; i++) stepWorld(w);
    expect(shot.removed).toBe(true);
    expect(shot.x).toBeLessThan(21 * TILE + 6);
  });

  it("a player's shot still flies past props", () => {
    const w = new World('PRJ', propRoom());
    const p = spawnPlayer(w, newCharacter('knight', 'J', 'p', new Rng(1)), 0, true, 12 * TILE, midY);
    const shot = spawnPlayerProjectile(w, p, 0, 500, 6, emptySpec(), 0, 'p_knife');
    for (let i = 0; i < 40; i++) stepWorld(w);
    expect(shot.x).toBeGreaterThan(22 * TILE);
  });

  it("a player's spell projectiles fly twice their listed size", () => {
    expect(SPELL_PROJECTILE_SCALE).toBe(2);
  });
});

describe('projectile range (D185)', () => {
  it('no projectile flies further than about two-thirds of the screen', async () => {
    const { MAX_PROJECTILE_RANGE, ENEMY_PROJECTILE_RANGE } = await import('../../src/game/combat/formulas');
    expect(ENEMY_PROJECTILE_RANGE).toBe(MAX_PROJECTILE_RANGE / 2);
    expect(MAX_PROJECTILE_RANGE).toBeLessThanOrEqual(Math.round((1280 * 2) / 3));
    const w = new World('RANGE', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'J', 'p', new Rng(1)), 0, true, 100, midY);
    const e = spawnEnemy(w, ENEMIES.hollow_wolf!, 100, midY + 200);
    const enemyShot = spawnEnemyProjectile(w, e, 0, 500, { kind: 'projectile', speed: 500, r: 6, range: 1600 }, emptySpec(), 0, 1200, midY + 200);
    const playerShot = spawnPlayerProjectile(w, p, 0, 500, 6, emptySpec(), 0, 'p_knife', { range: 1600 });
    const x0 = [enemyShot.x, playerShot.x];
    for (let i = 0; i < 60 * 4; i++) stepWorld(w);
    expect(enemyShot.removed).toBe(true);
    expect(playerShot.removed).toBe(true);
    // they never got past the cap (the last position before removal)
    expect(enemyShot.x - x0[0]!).toBeLessThanOrEqual(ENEMY_PROJECTILE_RANGE + 20);
    expect(playerShot.x - x0[1]!).toBeLessThanOrEqual(MAX_PROJECTILE_RANGE + 20);
    expect(playerShot.x - x0[1]!).toBeGreaterThan(ENEMY_PROJECTILE_RANGE + 100);
  });
});
