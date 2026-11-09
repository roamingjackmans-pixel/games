// D319: weapons sometimes drop with another scaling profile (a Blessed Katana scales B Slicey / C Prayer, deals Holy).
// D320: movesets — long combos for fast weapons, spins round the player, overheads that land in front, whips that
// lash out, and Chakrams whose thrown rings cut through a group out and back.
import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../../src/data/weapons';
import { WEAPON_VARIANTS, VARIANT_CHANCE } from '../../src/data/weaponVariants';
import { GRADE_MULT } from '../../src/game/combat/formulas';
import { weaponOf } from '../../src/game/items/weaponOf';
import { itemRequirements } from '../../src/game/items/bases';
import { generateItem, itemName } from '../../src/game/items/generate';
import { makeItem } from '../../src/game/items/make';
import { Rng } from '../../src/engine/rng';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { computeDerived } from '../../src/game/player/derived';
import type { Grade, WeaponDef } from '../../src/game/types';

const total = (g: WeaponDef['grades']): number => (Object.values(g) as (Grade | undefined)[]).reduce((s, x) => s + (x ? GRADE_MULT[x] : 0), 0);

describe('scaling variants (D319)', () => {
  it('every variant trades, never wins: its grade total is within 0.31 of its class, never more than 0.1 above', () => {
    for (const [id, list] of Object.entries(WEAPON_VARIANTS)) {
      const base = total(WEAPONS[id]!.grades);
      for (const v of list) {
        const t = total(v.grades);
        expect(Math.abs(t - base), `${id} ${v.id}`).toBeLessThanOrEqual(0.31);
        expect(t - base, `${id} ${v.id}`).toBeLessThanOrEqual(0.1 + 1e-9);
      }
    }
  });

  it('every build has weapons: a Prayer, a Brain, a Bonk and a Slicey variant all exist across several classes', () => {
    const count = (stat: 'bonk' | 'slicey' | 'brain' | 'prayer'): number => Object.values(WEAPON_VARIANTS).filter((l) => l.some((v) => (v.grades[stat] ?? '-') !== '-')).length;
    expect(count('prayer')).toBeGreaterThanOrEqual(8);
    expect(count('brain')).toBeGreaterThanOrEqual(8);
  });

  it('a Blessed Katana scales B Slicey / C Prayer, needs Prayer, deals Holy and says so in its name', () => {
    const it0 = makeItem('katana', 'rare', 3);
    it0.variant = 'blessed';
    const def = weaponOf(it0)!;
    expect(def.grades).toEqual({ bonk: '-', slicey: 'B', prayer: 'C' });
    expect(def.element).toBe('holy');
    const req = itemRequirements(it0);
    expect(req.prayer).toBe(10);
    expect(req.bonk).toBe(0);
    expect(itemName(null, { ...it0, affixes: [] })).toContain('Blessed Katana');
    // the plain class is untouched
    expect(WEAPONS.katana!.grades).toEqual({ bonk: 'D', slicey: 'A' });
  });

  it('a Fervent Colossal Sword scales C Bonk / E Slicey / C Prayer and the character deals Fire with it', () => {
    const c = newCharacter('cleric', 'Joe', 'p1', new Rng(1));
    const it0 = makeItem('colossal_sword', 'common', 1);
    it0.variant = 'fervent';
    c.equipment.main = it0;
    const d = computeDerived(c);
    expect(d.weapon.grades).toEqual({ bonk: 'C', slicey: 'E', prayer: 'C' });
    expect(d.weapon.element).toBe('fire');
  });

  it(`about ${VARIANT_CHANCE * 100}% of weapon drops roll one, and a class's own stats come up more`, () => {
    let weapons = 0;
    let variants = 0;
    let prayerFav = 0;
    let prayerPlain = 0;
    for (let i = 0; i < 6000; i++) {
      const a = generateItem(new Rng(`var${i}`), { source: 'elite', ilvl: 4, zone: 4, slot: 'weapon', baseId: 'katana' });
      const b = generateItem(new Rng(`var${i}`), { source: 'elite', ilvl: 4, zone: 4, slot: 'weapon', baseId: 'katana', favor: { primary: 'prayer', secondary: 'hp' } });
      weapons++;
      if (a.variant) variants++;
      if (a.variant === 'blessed') prayerPlain++;
      if (b.variant === 'blessed') prayerFav++;
    }
    expect(variants / weapons).toBeGreaterThan(VARIANT_CHANCE - 0.03);
    expect(variants / weapons).toBeLessThan(VARIANT_CHANCE + 0.03);
    expect(prayerFav).toBeGreaterThan(prayerPlain * 1.08);
  });
});

describe('movesets (D320)', () => {
  it('fast weapons have long combos; heavy ones at least three steps', () => {
    for (const w of Object.values(WEAPONS)) {
      if (w.combo[0]!.hitbox.shape === 'proj' && w.id !== 'chakram') continue; // bows and crossbows shoot
      const n = w.combo.length;
      if (w.speedClass === 'veryfast') expect(n, w.id).toBeGreaterThanOrEqual(6);
      else if (w.speedClass === 'fast') expect(n, w.id).toBeGreaterThanOrEqual(5);
      else expect(n, w.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('a greathammer never pokes; it ends on an overhead. A halberd spins.', () => {
    expect(WEAPONS.greathammer!.combo.some((s) => s.hitbox.shape === 'thrust')).toBe(false);
    expect(WEAPONS.greathammer!.combo.at(-1)!.move).toBe('overhead');
    expect(WEAPONS.halberd!.combo.some((s) => s.move === 'spin')).toBe(true);
  });

  it('a whip lashes and cracks sideways; it never just pokes', () => {
    const moves = WEAPONS.whip!.combo.map((s) => s.move);
    expect(moves).toContain('lash');
    expect(moves).toContain('lashSweep');
    expect(moves.every((m) => m === 'lash' || m === 'lashSweep')).toBe(true);
  });

  const swingAt = (baseId: string, step: number, foes: [number, number][]): Entity[] => {
    const c = newCharacter('brute', 'Joe', 'p1', new Rng(1));
    c.equipment.main = makeItem(baseId, 'common', 1);
    c.twoHanded = false;
    const w = new World('MOVE', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const en = foes.map(([x, y]) => spawnEnemy(w, ENEMIES.shambler!, x, y, { tellS: 0 }));
    for (const e of en) e.en!.state = 'idle';
    p.pl!.combo = null;
    p.pl!.nextComboIdx = step;
    p.pl!.comboResetAt = w.time + 10;
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.attack, pressed: ACTION_BIT.attack };
    const hp0 = en.map((e) => e.hp!.hp);
    for (let i = 0; i < 80; i++) {
      stepWorld(w);
      p.pl!.input = { ...p.pl!.input, pressed: 0, buttons: 0 };
      p.x = 400;
      p.y = 368;
      en.forEach((e, k) => {
        e.x = foes[k]![0];
        e.y = foes[k]![1];
        e.vx = e.vy = 0;
      });
    }
    return en.filter((e, i) => e.hp!.hp < hp0[i]!);
  };

  it('an overhead lands in front: a foe there is hit, one beside you is not', () => {
    const last = WEAPONS.greathammer!.combo.length - 1;
    const hb = WEAPONS.greathammer!.combo[last]!.hitbox as { d: number };
    const hit = swingAt('greathammer', last, [
      [400 + hb.d, 368],
      [400, 368 + 110],
    ]);
    expect(hit.length).toBe(1);
    expect(hit[0]!.x).toBe(400 + hb.d);
  });

  it('a spin hits behind you as well as in front', () => {
    const idx = WEAPONS.halberd!.combo.findIndex((s) => s.move === 'spin');
    const hit = swingAt('halberd', idx, [
      [480, 368],
      [320, 368],
    ]);
    expect(hit.length).toBe(2);
  });

  it('a chakram ring cuts through a whole line of foes and comes back to hit them again', () => {
    const c = newCharacter('duelist', 'Joe', 'p1', new Rng(1));
    c.equipment.main = makeItem('chakram', 'common', 1);
    const w = new World('CHAK', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 300, 368);
    const xs = [380, 440, 500];
    const en = xs.map((x) => spawnEnemy(w, ENEMIES.shambler!, x, 368, { tellS: 0 }));
    const hits = new Map<number, number>();
    const hp = new Map(en.map((e) => [e.id, e.hp!.hp]));
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.attack, pressed: ACTION_BIT.attack };
    for (let i = 0; i < 150; i++) {
      stepWorld(w);
      p.pl!.input = { ...p.pl!.input, pressed: 0, buttons: 0 };
      p.x = 300;
      p.y = 368;
      for (const [k, e] of en.entries()) {
        e.x = xs[k]!;
        e.y = 368;
        e.vx = e.vy = 0;
        const now = e.hp!.hp;
        if (now < hp.get(e.id)!) {
          hits.set(e.id, (hits.get(e.id) ?? 0) + 1);
          hp.set(e.id, now);
        }
      }
    }
    for (const e of en) expect(hits.get(e.id) ?? 0, `foe at ${e.x}`).toBeGreaterThanOrEqual(2);
    // and the ring came home
    expect([...w.entities.values()].some((e) => e.type === 'projectile' && !e.removed && e.pr?.ownerId === p.id)).toBe(false);
  });
});
