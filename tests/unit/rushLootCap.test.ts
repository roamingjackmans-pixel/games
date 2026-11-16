// D431: in Wave Rush a character finds nothing better than it could in its own campaign (items' level, gems, Soul
// Essence, the shop) until it has cleared Wave Rush Cycle 5 itself; from Cycle 6 on its loot climbs with the cycle.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { RUSH_FREE_LOOT_CLEARED, rushLootCycle } from '../../src/game/waveRush';
import { bossDrops } from '../../src/game/items/drops';
import { itemLevelFor } from '../../src/game/combat/formulas';
import { essenceTierFor, ESSENCES } from '../../src/data/essence';
import type { SaveFile } from '../../src/game/types';

function save(campaignCycle: number, rushBest: number, id = 'p-cap'): SaveFile {
  const c = newCharacter('knight', 'Joe', id, new Rng(id));
  c.tutorialDone = true;
  c.cycle = campaignCycle;
  const s = newSave(1, c, 'CAP');
  s.rush!.bestCycle = rushBest;
  return s;
}

describe('Wave Rush loot is capped at the campaign until Cycle 5 is cleared (D431)', () => {
  it('the rule: the lower of the two cycles, until the rush’s Cycle 5 (0-based 4) is cleared', () => {
    expect(RUSH_FREE_LOOT_CLEARED).toBe(4);
    expect(rushLootCycle(5, 2, 3)).toBe(2);
    expect(rushLootCycle(1, 2, -1)).toBe(1);
    expect(rushLootCycle(5, 2, 4)).toBe(5);
    expect(rushLootCycle(9, 0, 8)).toBe(9);
    expect(rushLootCycle(3, Number.NaN, -1)).toBe(0);
  });

  it('the owner’s example: playing Cycle 3 of the campaign, no Superintendent’s Blaze or Freeholder’s Soul', () => {
    const cap = rushLootCycle(7, 2, 3);
    const tiers = [1, 2, 3, 4, 5, 6, 7, 8].map((z) => essenceTierFor(z, cap));
    expect(Math.max(...tiers)).toBe(3);
    expect(ESSENCES[3]!.name).toMatch(/Superintendent/);
    expect(ESSENCES[4]!.name).toMatch(/Freeholder/);
  });

  it('a session rolls the host’s and a guest’s loot each at its own cap; a cleared Cycle 5 lifts it', () => {
    const s = new GameSession(save(2, 3), {}, { rushCycle: 6 });
    s.w.god = true;
    s.start();
    const host = s.save.character;
    expect(s.cycle).toBe(6);
    expect(s.lootCycleFor(host)).toBe(2);
    const guest = save(0, 5, 'p-guest').character;
    s.joinPlayer(guest, 5);
    expect(s.lootCycleFor(guest)).toBe(6);
    const rookie = save(1, -1, 'p-rookie').character;
    s.joinPlayer(rookie, -1);
    expect(s.lootCycleFor(rookie)).toBe(1);
    s.save.rush!.bestCycle = 4;
    expect(s.lootCycleFor(host)).toBe(6);
    // the campaign is not capped by anything
    const camp = new GameSession(save(2, -1, 'p-camp'));
    expect(camp.lootCycleFor(camp.save.character)).toBe(2);
  });

  it('a boss in a Cycle 6 rush drops Cycle 3 items and essence for a Cycle 3 character', () => {
    const s = new GameSession(save(2, 3), {}, { rushCycle: 5 });
    s.w.god = true;
    s.start();
    const pickups = (): { ilvl: number[]; tiers: number[] } => {
      const ilvl: number[] = [];
      const tiers: number[] = [];
      for (const e of s.w.entities.values()) {
        if (e.type !== 'pickup' || e.removed) continue;
        if (e.pk!.kind === 'item') ilvl.push(e.pk!.item!.ilvl);
        if (e.pk!.kind === 'essence') tiers.push(e.pk!.essenceTier!);
      }
      return { ilvl, tiers };
    };
    for (let i = 0; i < 6; i++) bossDrops({ w: s.w, seed: `CAP${i}`, zone: 8, cycle: 5, cycleFor: (c) => s.lootCycleFor(c) }, 'b', 640, 400);
    const capped = pickups();
    expect(capped.ilvl.length).toBeGreaterThan(0);
    for (const l of capped.ilvl) expect(l).toBe(itemLevelFor(8, 2));
    expect(capped.tiers.length).toBeGreaterThan(0);
    for (const t of capped.tiers) expect(t).toBe(3);
  });
});
