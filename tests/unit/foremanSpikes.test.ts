// D219: the Foreman's arena draws its live lava as the forge's spike field (and drops the orange wash); it still burns.
import { describe, expect, it } from 'vitest';
import { FOREMAN_IGNATIUS_ARENA } from '../../src/data/bosses/forge';
import { BOSS_ARENAS } from '../../src/data/rooms/bosses';
import { HAZARDS } from '../../src/game/systems/hazards';

describe("the Foreman's lava (D219)", () => {
  it('his arena is flagged to draw its hazard tiles as spikes; the lava keeps its damage and burn, without the wash', () => {
    expect(FOREMAN_IGNATIUS_ARENA.hazardSpikes).toBe(true);
    expect(Object.values(BOSS_ARENAS).filter((a) => a.hazardSpikes).map((a) => a.id)).toEqual(['forge_arena']);
    expect(HAZARDS.lava.noWash).toBe(true);
    expect(HAZARDS.lava.dmg).toBeGreaterThan(0);
    expect(HAZARDS.lava.status?.id).toBe('burn');
  });
});
