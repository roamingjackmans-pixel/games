// D431, D432: in Wave Rush a character finds nothing better than it could in its own campaign (items' level, gems,
// Soul Essence, the shop) until it has cleared Cycle 5 of the campaign; after that its loot climbs with whatever
// cycle of Wave Rush it plays. Clearing Wave Rush cycles does not lift the cap (D432; D431 had it lift at Wave Rush
// Cycle 5).
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { RUSH_FREE_LOOT_CAMPAIGN, rushLootCycle } from '../../src/game/waveRush';
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

describe('Wave Rush loot is capped at the campaign until campaign Cycle 5 is cleared (D431, D432)', () => {
  it('the rule: the lower of the two cycles until the campaign reaches Cycle 6 (0-based 5)', () => {
    expect(RUSH_FREE_LOOT_CAMPAIGN).toBe(5);
    expect(rushLootCycle(5, 2)).toBe(2);
    expect(rushLootCycle(1, 2)).toBe(1);
    expect(rushLootCycle(9, 4)).toBe(4);
    expect(rushLootCycle(9, 5)).toBe(9);
    expect(rushLootCycle(2, 7)).toBe(2);
    expect(rushLootCycle(3, Number.NaN)).toBe(0);
  });

  it('the owner’s example: playing Cycle 3 of the campaign, no Superintendent’s Blaze or Freeholder’s Soul', () => {
    const cap = rushLootCycle(7, 2);
    const tiers = [1, 2, 3, 4, 5, 6, 7, 8].map((z) => essenceTierFor(z, cap));
    expect(Math.max(...tiers)).toBe(3);
    expect(ESSENCES[3]!.name).toMatch(/Superintendent/);
    expect(ESSENCES[4]!.name).toMatch(/Freeholder/);
  });

  it('a session caps each player at its own campaign; Wave Rush clears do not lift it', () => {
    // cleared Wave Rush Cycle 8, but only on Cycle 3 of the campaign: still capped
    const s = new GameSession(save(2, 7), {}, { rushCycle: 6 });
    s.w.god = true;
    s.start();
    expect(s.cycle).toBe(6);
    expect(s.lootCycleFor(s.save.character)).toBe(2);
    const veteran = save(5, -1, 'p-guest').character;
    s.joinPlayer(veteran);
    expect(s.lootCycleFor(veteran)).toBe(6);
    const rookie = save(1, -1, 'p-rookie').character;
    s.joinPlayer(rookie);
    expect(s.lootCycleFor(rookie)).toBe(1);
    // the campaign is not capped by anything
    const camp = new GameSession(save(2, -1, 'p-camp'));
    expect(camp.lootCycleFor(camp.save.character)).toBe(2);
  });

  it('a boss in a Cycle 6 rush drops Cycle 3 items and essence for a Cycle 3 character', () => {
    const s = new GameSession(save(2, 7), {}, { rushCycle: 5 });
    s.w.god = true;
    s.start();
    const ilvl: number[] = [];
    const tiers: number[] = [];
    for (let i = 0; i < 6; i++) bossDrops({ w: s.w, seed: `CAP${i}`, zone: 8, cycle: 5, cycleFor: (c) => s.lootCycleFor(c) }, 'b', 640, 400);
    for (const e of s.w.entities.values()) {
      if (e.type !== 'pickup' || e.removed) continue;
      if (e.pk!.kind === 'item') ilvl.push(e.pk!.item!.ilvl);
      if (e.pk!.kind === 'essence') tiers.push(e.pk!.essenceTier!);
    }
    expect(ilvl.length).toBeGreaterThan(0);
    for (const l of ilvl) expect(l).toBe(itemLevelFor(8, 2));
    expect(tiers.length).toBeGreaterThan(0);
    for (const t of tiers) expect(t).toBe(3);
  });
});
