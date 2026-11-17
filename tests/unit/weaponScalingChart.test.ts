// D436: the weapon scaling chart (docs/balance/weapon_scaling.csv) is the owner's: every weapon class and scaling
// variant in the game, with its Bonk / Slicey / Brain / Prayer grades, must match a row of it, and every row must exist.
// Change a grade in the data and the CSV together (the Scaling column is the grades' category, see `category`).
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { WEAPONS } from '../../src/data/weapons';
import { WEAPON_VARIANTS } from '../../src/data/weaponVariants';
import type { WeaponDef } from '../../src/game/types';

const ORDER = ['-', 'E', 'D', 'C', 'B', 'A', 'S'];
const rank = (g?: string): number => Math.max(0, ORDER.indexOf(g ?? '-'));

/** The chart's Scaling column for a set of grades. */
export function category(g: WeaponDef['grades']): string {
  const b = rank(g.bonk);
  const s = rank(g.slicey);
  const br = rank(g.brain);
  const pr = rank(g.prayer);
  if (br > 0 || pr > 0) return `${s > b ? 'Slicey' : 'Bonk'} and ${br > 0 ? 'Brain' : 'Prayer'}`;
  if (b > 0 && s === 0) return 'Pure Bonk';
  if (s > 0 && b === 0) return 'Pure Slicey';
  if (b > s) return 'Main Bonk with Slicey';
  if (s > b) return 'Main Slicey with Bonk';
  return 'Even Bonk and Slicey';
}

const g = (x: string | undefined): string => (x && x !== '-' ? x : '');

function fromData(): Map<string, string> {
  const out = new Map<string, string>();
  for (const w of Object.values(WEAPONS)) {
    const forms: [string, WeaponDef['grades']][] = [['Base', w.grades], ...(WEAPON_VARIANTS[w.id] ?? []).map((v): [string, WeaponDef['grades']] => [v.word, v.grades])];
    for (const [form, gr] of forms) out.set(`${w.name}|${form}`, [category(gr), g(gr.bonk), g(gr.slicey), g(gr.brain), g(gr.prayer)].join(','));
  }
  return out;
}

function fromCsv(): Map<string, string> {
  const lines = fs.readFileSync('docs/balance/weapon_scaling.csv', 'utf8').trim().split(/\r?\n/);
  const head = lines[0]!.split(',');
  const col = (n: string): number => head.indexOf(n);
  const out = new Map<string, string>();
  for (const l of lines.slice(1)) {
    const r = l.split(',');
    out.set(`${r[col('Weapon class')]}|${r[col('Form')]}`, [r[col('Scaling')], r[col('Bonk')], r[col('Slicey')], r[col('Brain')], r[col('Prayer')]].join(','));
  }
  return out;
}

describe('the weapon scaling chart (D436)', () => {
  it('every weapon form in the game is in the chart with the same grades, and the chart has nothing more', () => {
    const data = fromData();
    const csv = fromCsv();
    expect([...csv.keys()].sort()).toEqual([...data.keys()].sort());
    for (const [k, v] of data) expect(csv.get(k), k).toBe(v);
  });

  it('the owner’s changes', () => {
    expect(WEAPONS.club!.grades).toEqual({ bonk: 'A', slicey: '-' });
    expect(WEAPON_VARIANTS.club!.map((v) => [v.word, v.grades])).toEqual([['Keen', { bonk: 'B', slicey: 'C' }]]);
    expect(WEAPONS.rapier!.grades).toEqual({ bonk: '-', slicey: 'S' });
    expect(WEAPONS.twin_axes!.grades).toEqual({ bonk: 'A', slicey: 'B' });
    expect(WEAPON_VARIANTS.twin_axes!.find((v) => v.id === 'heavy')!.grades).toEqual({ bonk: 'B', slicey: 'A' });
  });
});
