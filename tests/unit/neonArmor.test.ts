// D442: every legendary armor piece has six neon versions, found only in a Hardcore campaign; the colour changes
// nothing but the look.
import { describe, expect, it } from 'vitest';
import { ARMOR_SETS } from '../../src/data/armor';
import { NEON_COLORS, NEON_IDS, isNeonColor, neonOf } from '../../src/data/neon';
import { generateItem } from '../../src/game/items/generate';
import { chestDrops } from '../../src/game/items/drops';
import { makeItem } from '../../src/game/items/make';
import { gearOf, previewCharacter } from '../../src/game/net/lobbyGear';
import type { PublicPlayer } from '../../src/game/net/protocol';
import { newCharacter } from '../../src/game/player/character';
import { newSave } from '../../src/game/save/schema';
import { GameSession } from '../../src/game/session';
import type { Item } from '../../src/game/types';
import { Rng } from '../../src/engine/rng';

const armorBases = ARMOR_SETS.flatMap((s) => (['head', 'body', 'legs'] as const).map((slot) => `${s.id}_${slot}`));

describe('neon legendary armor (D442)', () => {
  it('has the six colours the owner named', () => {
    expect([...NEON_IDS].sort()).toEqual(['blue', 'green', 'orange', 'pink', 'purple', 'red']);
    expect(new Set(NEON_IDS.map((id) => NEON_COLORS[id].color)).size).toBe(6);
    expect(isNeonColor('pink')).toBe(true);
    expect(isNeonColor('constructor')).toBe(false);
  });

  it('every legendary armor piece can come up in all six colours, and only when found in Hardcore', () => {
    const seen = new Set<string>();
    let neon = 0;
    const n = 600;
    for (let i = 0; i < n; i++) {
      const baseId = armorBases[i % armorBases.length]!;
      const it = generateItem(new Rng(`neon${i}`), { source: 'boss', ilvl: 5, zone: 5, rarity: 'legendary', baseId, neon: true });
      if (it.neon) {
        neon++;
        seen.add(it.neon);
        expect(it.name).toContain(NEON_COLORS[it.neon].name);
      }
      expect(generateItem(new Rng(`neon${i}`), { source: 'boss', ilvl: 5, zone: 5, rarity: 'legendary', baseId }).neon).toBeUndefined();
    }
    expect(seen.size).toBe(6);
    expect(neon / n).toBeGreaterThan(0.4);
    expect(neon / n).toBeLessThan(0.6);
  });

  it('never lands on anything but legendary armor', () => {
    for (let i = 0; i < 300; i++) {
      const it = generateItem(new Rng(`other${i}`), { source: 'boss', ilvl: 5, zone: 5, neon: true });
      if (it.kind !== 'armor' || it.rarity !== 'legendary') expect(it.neon, it.baseId).toBeUndefined();
    }
  });

  it('changes nothing but the colour and the name, and moves no other roll', () => {
    for (let i = 0; i < 60; i++) {
      const baseId = armorBases[i % armorBases.length]!;
      const a = new Rng(`same${i}`);
      const b = new Rng(`same${i}`);
      const plain = generateItem(a, { source: 'boss', ilvl: 5, zone: 5, rarity: 'legendary', baseId });
      const lit = generateItem(b, { source: 'boss', ilvl: 5, zone: 5, rarity: 'legendary', baseId, neon: true });
      const strip = (x: Item): Item => {
        const { neon: _n, name: _m, ...rest } = x;
        return rest as Item;
      };
      expect(strip(lit)).toEqual(strip(plain));
      expect(a.next()).toBe(b.next());
    }
  });

  it('a Hardcore campaign’s chests give it; a normal campaign’s never do', () => {
    const found = (hardcore: boolean): number => {
      const c = newCharacter('knight', 'Joe', 'p1', new Rng('NEON'));
      c.tutorialDone = true;
      if (hardcore) c.hardcore = true;
      const s = new GameSession(newSave(1, c, 'NEON'));
      s.start();
      expect(s.w.hardcore).toBe(hardcore);
      for (let i = 0; i < 1500; i++) chestDrops({ w: s.w, seed: 'NEON', zone: 5, cycle: 0 }, `chest${i}`, 'boss', 300, 300);
      s.w.refreshLists();
      return [...s.w.entities.values()].filter((e) => e.pk?.item?.neon).length;
    };
    expect(found(true)).toBeGreaterThan(0);
    expect(found(false)).toBe(0);
  });

  it('shows in the co-op lobby, and a peer’s bad colour is dropped', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng('LOBBY'));
    const body = makeItem(armorBases[1]!, 'legendary', 5, { sockets: 0 });
    body.neon = 'orange';
    c.equipment.body = body;
    const gear = gearOf(c);
    expect(gear.body?.c).toBe('orange');
    const peer = { playerId: 'p1', name: 'Joe', classId: 'knight', gear } as unknown as PublicPlayer;
    expect(neonOf(previewCharacter(peer).equipment.body)?.id).toBe('orange');
    const bad = { ...peer, gear: { ...gear, body: { ...gear.body!, c: 'plaid' } } } as unknown as PublicPlayer;
    expect(neonOf(previewCharacter(bad).equipment.body)).toBeNull();
  });
});
