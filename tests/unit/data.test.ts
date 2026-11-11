// `npm run validate:data`: every data table passes validateData (CONTENT_ENEMIES §13, CONTENT_SPELLS_CLASSES
// §4), and nothing in the data can refill the Thermos (D38, GAME_DESIGN §9.2).
import { describe, expect, it } from 'vitest';
import { validateData } from '../../src/data/validate';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { SKILLS } from '../../src/data/skills';
import { SPELLS } from '../../src/data/spells';
import { CONSUMABLES } from '../../src/data/consumables';
import { LEGENDARY_POWERS } from '../../src/data/legendaries';
import { RINGS } from '../../src/data/rings';
import { WEAPONS } from '../../src/data/weapons';
import { GEMS } from '../../src/data/gems';
import { AFFIXES } from '../../src/data/affixes';
import { garyStock } from '../../src/game/bonfire/gary';
import { newWorldState } from '../../src/game/save/schema';

/** Every object anywhere inside a value (effects nest inside effects, patterns, phases…). */
function* walk(v: unknown, seen = new Set<unknown>()): Generator<Record<string, unknown>> {
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  if (Array.isArray(v)) {
    for (const x of v) yield* walk(x, seen);
    return;
  }
  const o = v as Record<string, unknown>;
  yield o;
  for (const x of Object.values(o)) yield* walk(x, seen);
}

describe('data validation (npm run validate:data)', () => {
  it('validateData finds no issues', () => {
    expect(validateData()).toEqual([]);
  });

  it('no skill, spell, consumable, power, ring, enemy or boss restores Thermos charges (D38)', () => {
    const tables: Record<string, unknown> = { ENEMIES, BOSSES, SKILLS, SPELLS, CONSUMABLES, LEGENDARY_POWERS, RINGS, WEAPONS, GEMS, AFFIXES };
    for (const [name, t] of Object.entries(tables)) expect(t, name).toBeTruthy();
    const bad: string[] = [];
    for (const [name, t] of Object.entries(tables)) {
      for (const o of walk(t)) {
        if (o.op === 'resource' && typeof o.flask === 'number' && o.flask > 0) bad.push(`${name}: ${JSON.stringify(o)}`);
        if (o.op === 'modifyNext' && o.what === 'flask' && (o.mods as { noCooldown?: boolean } | undefined)) {
          // a cheaper or faster drink is fine; a free charge is not
          if ((o.mods as Record<string, unknown>).refill) bad.push(`${name}: ${JSON.stringify(o)}`);
        }
        for (const k of ['flaskRefill', 'refillFlask', 'restoreFlask']) if (k in o) bad.push(`${name}: ${k}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('Gary (GAME_DESIGN §11)', () => {
  it('sells 3–6 special things, the same every visit, in Glowen', () => {
    for (let z = 2; z <= 8; z++) {
      const ws = newWorldState(`GARYSEED${z}`);
      const a = garyStock(ws, z, 0);
      expect(a.length).toBeGreaterThanOrEqual(3);
      expect(a.length).toBeLessThanOrEqual(6);
      expect(a.every((e) => e.price > 0 && !e.sold)).toBe(true);
      const first = a.find((e) => e.kind === 'item');
      // D327: the first playthrough caps zones 1–2 at Rare and 3–4 at Epic, even for Gary
      const allowed = z <= 2 ? ['rare'] : z <= 4 ? ['epic'] : ['epic', 'legendary'];
      expect(first?.item && allowed.includes(first.item.rarity)).toBe(true);
      expect(garyStock(ws, z, 0)).toBe(a);
      const ws2 = newWorldState(`GARYSEED${z}`);
      expect(JSON.stringify(garyStock(ws2, z, 0))).toBe(JSON.stringify(a));
    }
  });
});

describe('every ring and legendary power does something (M13)', () => {
  it('each id is used by game code (bands work through bandStat)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const files: string[] = [];
    const walkDir = (d: string): void => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walkDir(p);
        else if (p.endsWith('.ts')) files.push(fs.readFileSync(p, 'utf8'));
      }
    };
    walkDir('src/game');
    const code = files.join('\n');
    const unused = [...Object.keys(LEGENDARY_POWERS), ...Object.keys(RINGS).filter((r) => !r.startsWith('band_'))].filter((id) => !code.includes(`'${id}'`));
    expect(unused).toEqual([]);
  });
});
