// D399: Lingering (+spell duration) and Expanse (+spell area size) gems, working in a staff or talisman for that
// school's spells.
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { runEffects, type EffectCtx } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { GEMS, makeGem, perkValue } from '../../src/data/gems';
import { makeItem } from '../../src/game/items/make';
import { refreshDerived } from '../../src/game/player/player';
import type { Entity } from '../../src/game/world';
import type { Item } from '../../src/game/types';

function caster(seed: string, gemIn: 'tool' | 'weapon' | null, family: 'lingering' | 'expanse', tool: string): { s: GameSession; p: Entity } {
  const ch = newCharacter('cleric', 'Joe', 'p1', new Rng(seed));
  ch.tutorialDone = true;
  // enough of both to wield either tool (gear under its requirements counts for nothing)
  ch.stats.prayer = 40;
  ch.stats.brain = 40;
  const s = new GameSession(newSave(1, ch, seed));
  s.start();
  inCombat(s.w);
  const p = s.localPlayer!;
  const t: Item = makeItem(tool, 'common', 1, { sockets: 1 });
  ch.equipment.off = t;
  ch.twoHanded = false;
  if (gemIn === 'tool') t.sockets[0] = makeGem(family, { q: 0 });
  if (gemIn === 'weapon') {
    ch.equipment.main!.sockets = [makeGem(family, { q: 0 })];
  }
  refreshDerived(p);
  return { s, p };
}

function cast(s: GameSession, p: Entity, id: string, aimX: number, aimY: number): void {
  const ctx: EffectCtx = { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX, aimY, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: `spell:${id}`, spellId: id, school: SPELLS[id]!.school };
  runEffects(s.w, SPELLS[id]!.effect, ctx);
}

const hazard = (s: GameSession): Entity => [...s.w.entities.values()].find((e) => e.type === 'hazard' && !e.removed)!;

describe('spell gems (D399)', () => {
  it('Lingering in a talisman makes Sanctuary last longer; in the weapon it does nothing', () => {
    const plain = caster('L0', null, 'lingering', 'silver_talisman');
    cast(plain.s, plain.p, 'sanctuary', plain.p.x + 100, plain.p.y);
    const base = hazard(plain.s).hz!.until - plain.s.w.time;
    const gem = caster('L1', 'tool', 'lingering', 'silver_talisman');
    cast(gem.s, gem.p, 'sanctuary', gem.p.x + 100, gem.p.y);
    const longer = hazard(gem.s).hz!.until - gem.s.w.time;
    expect(longer / base).toBeCloseTo(1 + (base > 0 ? (1 + perkValue({ family: 'lingering', q: 0 }) / 100 + plain.p.pl!.derived.spellDurationPct) / (1 + plain.p.pl!.derived.spellDurationPct) - 1 : 0), 3);
    expect(longer).toBeGreaterThan(base);
    const inWeapon = caster('L2', 'weapon', 'lingering', 'silver_talisman');
    cast(inWeapon.s, inWeapon.p, 'sanctuary', inWeapon.p.x + 100, inWeapon.p.y);
    expect(hazard(inWeapon.s).hz!.until - inWeapon.s.w.time).toBeCloseTo(base, 5);
  });

  it("only that school's spells: a staff's Lingering does not stretch a talisman's Sanctuary", () => {
    const plain = caster('S0', null, 'lingering', 'silver_talisman');
    cast(plain.s, plain.p, 'sanctuary', plain.p.x + 100, plain.p.y);
    const base = hazard(plain.s).hz!.until - plain.s.w.time;
    const staff = caster('S1', 'tool', 'lingering', 'arcane_staff');
    // the staff sits in the off hand; Sanctuary is a Prayer spell
    cast(staff.s, staff.p, 'sanctuary', staff.p.x + 100, staff.p.y);
    expect(hazard(staff.s).hz!.until - staff.s.w.time).toBeCloseTo(base, 5);
  });

  it('Expanse in a staff makes Meteor and Void Rift bigger', () => {
    const k = 1 + perkValue({ family: 'expanse', q: 0 }) / 100;
    const plain = caster('E0', null, 'expanse', 'arcane_staff');
    const gem = caster('E1', 'tool', 'expanse', 'arcane_staff');
    for (const c of [plain, gem]) {
      cast(c.s, c.p, 'meteor', c.p.x + 300, c.p.y);
      cast(c.s, c.p, 'void_rift', c.p.x - 300, c.p.y);
    }
    const r = (s: GameSession, type: 'telegraph' | 'hazard'): number => {
      const e = [...s.w.entities.values()].find((x) => x.type === type && !x.removed)!;
      const sh = (type === 'telegraph' ? e.tg!.shapes : e.hz!.shapes)[0]!;
      return sh.k === 'circle' ? sh.r : 0;
    };
    expect(r(gem.s, 'telegraph') / r(plain.s, 'telegraph')).toBeCloseTo(k, 3);
    expect(r(gem.s, 'hazard') / r(plain.s, 'hazard')).toBeCloseTo(k, 3);
  });

  it('they are weapon-side gems that say where they work', () => {
    expect(GEMS.lingering.toolOnly).toBe(true);
    expect(GEMS.expanse.toolOnly).toBe(true);
    expect(GEMS.lingering.armorOnly).toBeFalsy();
    expect(GEMS.expanse.text).toContain('staff or talisman');
  });
});
