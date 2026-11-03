// Weapon art coverage: every weapon class draws its own base art and every legendary name has its own
// design (src/engine/draw/weapons.ts, legendaryWeapons.ts). Drawing itself is checked by eye in a browser.
import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../../src/data/weapons';
import { LEGENDARY_DESIGNS } from '../../src/engine/draw/legendaryWeapons';
import { WEAPON_DRAW_IDS } from '../../src/engine/draw/weapons';

describe('weapon art', () => {
  it('every weapon class has its own base art', () => {
    const missing = Object.values(WEAPONS)
      .map((w) => w.draw)
      .filter((d) => !WEAPON_DRAW_IDS.includes(d));
    expect(missing).toEqual([]);
  });

  it('every legendary name has its own design, and no two classes share one', () => {
    const names = Object.values(WEAPONS).flatMap((w) => w.legendaryNames);
    expect(names.filter((n) => !LEGENDARY_DESIGNS.includes(n))).toEqual([]);
    expect(new Set(names).size).toBe(names.length);
  });
});
