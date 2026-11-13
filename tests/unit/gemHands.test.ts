// D369: a gem holds one of each effect (Rime and Storm both add Magic: never both); a weapon gem works only for the
// hand it sits in (the weapon hand's for its swings and skills, the off hand's for its crossbow shots and tool's spells).
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/engine/rng';
import { randomGem } from '../../src/game/items/generate';
import { gemEffect, makeGem } from '../../src/data/gems';
import { fusePreview } from '../../src/game/items/inventory';
import { newCharacter } from '../../src/game/player/character';
import { makeItem } from '../../src/game/items/make';
import { computeDerived } from '../../src/game/player/derived';
import type { Gem } from '../../src/game/types';

describe('one of each effect a gem (D369)', () => {
  it('no rolled gem carries Rime and Storm together', () => {
    for (let i = 0; i < 4000; i++) {
      const g = randomGem(new Rng(`fx${i}`), 3, 'weapon', 20);
      const effects = g.perks.map((p) => gemEffect(p.family));
      expect(new Set(effects).size, JSON.stringify(g.perks)).toBe(effects.length);
    }
  });

  it('a fuse cannot put Rime and Storm on one gem', () => {
    const orig: Gem = { perks: [{ family: 'rime', level: 5 }, { family: 'brutal', level: 5 }] };
    const donor: Gem = { perks: [{ family: 'storm', level: 5 }] };
    const r = fusePreview(orig, donor, [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 0 }]);
    expect('error' in r && r.error).toMatch(/Only one Magic damage/);
    const ok = fusePreview(orig, { perks: [{ family: 'leech', level: 5 }] }, [{ from: 'orig', idx: 0 }, { from: 'donor', idx: 0 }]);
    expect('error' in ok).toBe(false);
  });
});

describe('weapon gems work only for their own hand (D369)', () => {
  const caster = (offGem: Gem | null, mainGem: Gem | null) => {
    const c = newCharacter('cleric', 'Joe', 'p1', new Rng(1));
    // gear works only when its requirements are met: enough for the sword and the talisman both
    c.stats.bonk = 20;
    c.stats.slicey = 20;
    c.stats.prayer = 20;
    c.equipment.main = makeItem('longsword', 'rare', 1, { sockets: 1, gems: mainGem ? [mainGem] : [] });
    c.equipment.off = makeItem('wooden_talisman', 'rare', 1, { sockets: 1, gems: offGem ? [offGem] : [] });
    c.twoHanded = false;
    return computeDerived(c);
  };

  it('Leech in the off-hand talisman heals nothing on sword hits; it works for that hand', () => {
    const plain = caster(null, null);
    const d = caster(makeGem('leech', { level: 14, q: 0 }), null);
    expect(d.lifesteal).toBeCloseTo(plain.lifesteal, 9);
    expect(d.off.lifesteal).toBeGreaterThan(plain.off.lifesteal);
  });

  it("Quicksilver in the off-hand talisman speeds that hand's casting, not the sword", () => {
    const plain = caster(null, null);
    const d = caster(makeGem('quicksilver', { level: 14, q: 0 }), null);
    expect(d.attackSpeed).toBeCloseTo(plain.attackSpeed, 9);
    expect(d.castSpeed).toBeCloseTo(plain.castSpeed, 9);
    expect(d.off.castSpeed).toBeGreaterThan(plain.off.castSpeed);
  });

  it("Brutal in the sword raises the sword's damage, not the off hand's", () => {
    const plain = caster(null, null);
    const d = caster(null, makeGem('brutal', { level: 14, q: 0 }));
    expect(d.dmgPct).toBeGreaterThan(plain.dmgPct);
    expect(d.off.dmgPct).toBeCloseTo(plain.off.dmgPct, 9);
  });
});
