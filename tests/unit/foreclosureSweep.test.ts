// D315: the Landlord's Foreclosure sweeps a 60° slice 120° round him, from his gaze the way the arrow points to where
// he will look next; phase 3 is 40% smaller, phase 4 half again the player's size.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { startEnemyAttack } from '../../src/game/enemies/attacks';
import { THE_LANDLORD } from '../../src/data/bosses/abyss';
import { DEG } from '../../src/engine/math';

describe('Foreclosure (D315)', () => {
  it('a sweep from the gaze through 120°, 60° wide; the next one starts where this one ended', () => {
    const L = THE_LANDLORD!;
    const atk = L.phases[2]!.attacks.find((a) => a.id === 'landlord_foreclosure')!;
    expect(atk.pattern?.kind).toBe('sweep');
    const w = new World('FC', Room.empty());
    const b = spawnEnemy(w, L, 640, 300, { zone: 8, tellS: 0 });
    b.en!.gaze = 0.3;
    startEnemyAttack(w, b, atk, null);
    const tele = [...w.entities.values()].find((e) => e.type === 'telegraph' && !e.removed);
    const s = tele!.tg!.shapes[0]! as { k: string; a0: number; arc: number; half: number };
    expect(s.k).toBe('sweep');
    expect(s.a0).toBeCloseTo(0.3, 5);
    expect(s.arc).toBeCloseTo(120 * DEG, 5);
    expect(s.half).toBeCloseTo(30 * DEG, 5);
    expect(b.en!.gaze).toBeCloseTo(0.3 + 120 * DEG, 5);
  });
  it('phase 3 is 40% smaller than it was (×1.14, was ×1.9); phase 4 ×0.45 (was ×0.3)', () => {
    const L = THE_LANDLORD!;
    expect(L.phases[2]!.passive!.scale).toBeCloseTo(1.9 * 0.6, 5);
    expect(L.phases[3]!.passive!.scale).toBeCloseTo(0.3 * 1.5, 5);
  });
});
