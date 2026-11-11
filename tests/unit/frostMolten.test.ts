// D330: frost (chill) builds twice as fast; a Molten Elite leaves a pool of fire every 3 s, sized to it.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnPlayer } from '../../src/game/player/player';
import { newCharacter } from '../../src/game/player/character';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { applyStatusBuild } from '../../src/game/combat/damage';
import { stepWorld } from '../../src/game/sim';
import { Rng } from '../../src/engine/rng';
import { MOLTEN_POOL_EVERY_S, moltenPoolR } from '../../src/game/enemies/ai';

describe('frost and molten (D330)', () => {
  it('chill builds twice as fast; burn as before', () => {
    const w = new World('FR', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 400, 368);
    applyStatusBuild(w, p, 'chill', 20);
    applyStatusBuild(w, p, 'burn', 20);
    expect(p.st!.meters.chill).toBe(40);
    expect(p.st!.meters.burn).toBe(20);
  });

  it('a Molten Elite leaves one pool every 3 s, its radius twice its own', () => {
    const w = new World('MO', Room.empty());
    const pl = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 520, 300);
    w.god = true;
    void pl;
    const e = spawnEnemy(w, ENEMIES.shambler!, 300, 300, { tellS: 0, elite: 'molten' });
    const pools = (): number => [...w.entities.values()].filter((h) => h.type === 'hazard' && !h.removed && h.hz?.ownerId === e.id).length;
    for (let i = 0; i < 60 * (MOLTEN_POOL_EVERY_S * 2 + 0.5); i++) stepWorld(w);
    const all = [...w.entities.values()].filter((h) => h.type === 'hazard' && h.hz?.ownerId === e.id);
    expect(pools()).toBeGreaterThanOrEqual(1);
    expect(pools()).toBeLessThanOrEqual(3);
    const shape = all[0]!.hz!.shapes[0] as { r: number };
    expect(shape.r).toBeCloseTo(moltenPoolR(e.radius), 0);
    expect(shape.r).toBeGreaterThan(26);
  });
});
