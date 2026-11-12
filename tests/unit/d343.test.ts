import { describe, expect, it } from 'vitest';
// D343: crossbows −35%, Bonk A / S weapons −10%, spells +40% early fading out by 300, the controller aim arrow.
import { WEAPONS } from '../../src/data/weapons';
import { WEAPON_VARIANTS } from '../../src/data/weaponVariants';
import { applyVariant } from '../../src/game/items/weaponOf';
import { BONK_HEAVY_MULT, SLICEY_LED_MULT, gradeDamageMult, sliceyLed, spellDamageMult } from '../../src/game/combat/formulas';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { runEffects, type EffectCtx } from '../../src/game/effects/run';
import { aimsFar } from '../../src/render/entities';
import { Rng } from '../../src/engine/rng';
import type { EffectDef } from '../../src/game/types';

describe('D343 balance', () => {
  it('crossbows deal 35% less: their base is 26 (was 40)', () => {
    expect(WEAPONS.crossbow!.base1).toBe(26);
  });

  it('a weapon that scales A or S with Bonk, variant included, deals 10% less', () => {
    for (const def of Object.values(WEAPONS)) {
      const heavy = def.grades.bonk === 'A' || def.grades.bonk === 'S';
      expect(gradeDamageMult(def), def.id).toBeCloseTo((heavy ? BONK_HEAVY_MULT : 1) * (sliceyLed(def) ? SLICEY_LED_MULT : 1), 9);
    }
    expect(['greathammer', 'greataxe', 'colossal_sword', 'battleaxe', 'halberd'].every((id) => gradeDamageMult(WEAPONS[id]!) === 0.9)).toBe(true);
    expect(gradeDamageMult(WEAPONS.longsword!)).toBe(1);
    // a Heavy longsword scales A with Bonk: it counts
    const heavyLongsword = applyVariant(WEAPONS.longsword!, WEAPON_VARIANTS.longsword!.find((v) => v.grades.bonk === 'A')!);
    expect(gradeDamageMult(heavyLongsword)).toBe(0.9);
  });

  it('spells: ×1.4 to 30 Brain or Prayer, easing to ×1 at 300 and staying there', () => {
    expect(spellDamageMult(0)).toBeCloseTo(1.4, 6);
    expect(spellDamageMult(30)).toBeCloseTo(1.4, 6);
    expect(spellDamageMult(165)).toBeCloseTo(1.2, 6);
    expect(spellDamageMult(300)).toBeCloseTo(1, 6);
    expect(spellDamageMult(999)).toBeCloseTo(1, 6);
    for (let s = 30; s < 300; s += 10) expect(spellDamageMult(s + 10)).toBeLessThan(spellDamageMult(s));
  });

  it("a spell's damage carries the bonus for its own school's stat; a heal does not", () => {
    const w = new World('D343', Room.empty());
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    c.stats.brain = 20;
    c.stats.prayer = 300;
    const p = spawnPlayer(w, c, 0, true, 500, 368);
    const fx: EffectDef[] = [{ op: 'damage', pattern: { kind: 'projectile', speed: 400, r: 6, drawId: 'p_bolt' }, mult: 1, type: 'magic', base: 100 } as EffectDef];
    const ctx = (school?: 'brain' | 'prayer'): EffectCtx => ({ sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: p.x + 100, aimY: p.y, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: 'spell:0', ...(school ? { school } : {}) });
    const shot = (school?: 'brain' | 'prayer'): number => {
      const before = new Set(w.entities.keys());
      runEffects(w, fx, ctx(school));
      const e = [...w.entities.values()].find((x) => !before.has(x.id) && x.type === 'projectile')!;
      return e.pr!.dmg.magic ?? 0;
    };
    const plain = shot();
    expect(shot('brain') / plain).toBeCloseTo(1.4, 5);
    expect(shot('prayer') / plain).toBeCloseTo(1, 5);
  });

  it('the aim arrow is long with a bow, crossbow, chakram, staff or talisman in either hand', () => {
    const w = new World('ARROW', Room.empty());
    const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p', new Rng(1)), 0, true, 500, 368);
    const d = p.pl!.derived;
    expect(aimsFar(p)).toBe(!!d.weapon.ranged || !!d.mainTool || !!d.offTool || !!d.offWeapon);
    d.weapon = WEAPONS.bow!;
    d.mainTool = null;
    d.offTool = null;
    d.offWeapon = null;
    expect(aimsFar(p)).toBe(true);
    d.weapon = WEAPONS.longsword!;
    expect(aimsFar(p)).toBe(false);
    d.offWeapon = { def: WEAPONS.crossbow!, item: null as never, power: 1, meetsReq: true };
    expect(aimsFar(p)).toBe(true);
  });
});

// D347: Slicey-based weapons deal 20% more
describe('D347 Slicey-based weapons', () => {
  it('Slicey above Bonk (as rolled) is ×1.2; equal or Bonk-led is not', () => {
    const led = Object.values(WEAPONS).filter((d) => sliceyLed(d)).map((d) => d.id).sort();
    expect(led).toEqual(['bow', 'chakram', 'dawn_glaive', 'katana', 'rapier', 'spear', 'spellblade', 'twin_axes', 'twin_daggers', 'whip'].sort());
    expect(gradeDamageMult(WEAPONS.twin_daggers!)).toBeCloseTo(1.2, 9);
    expect(gradeDamageMult(WEAPONS.longsword!)).toBe(1);
    expect(gradeDamageMult(WEAPONS.greathammer!)).toBeCloseTo(0.9, 9);
    // a Keen Longsword (B Bonk / A Slicey) counts
    const keen = applyVariant(WEAPONS.longsword!, WEAPON_VARIANTS.longsword!.find((v) => v.grades.slicey === 'A')!);
    expect(gradeDamageMult(keen)).toBeCloseTo(1.2, 9);
  });
});
