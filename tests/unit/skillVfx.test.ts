import { describe, expect, it } from 'vitest';
import { SKILLS } from '../../src/data/skills';
import { SPELLS } from '../../src/data/spells';
import { CONSUMABLES } from '../../src/data/consumables';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { VFX_IDS } from '../../src/render/skillFx';
import { World, type GameEvent } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { installRules } from '../../src/game/rules';
import { runEffects } from '../../src/game/effects/run';
import { Rng } from '../../src/engine/rng';
import type { EffectDef, PatternDef } from '../../src/game/types';

/** Every damage effect reachable from a list (dashes, channels, sequences, charges, chains, zones, triggers…). */
function damageEffects(list: EffectDef[] | undefined, out: Extract<EffectDef, { op: 'damage' }>[] = []): Extract<EffectDef, { op: 'damage' }>[] {
  for (const e of list ?? []) {
    switch (e.op) {
      case 'damage':
        out.push(e);
        damageEffects(e.onKill, out);
        break;
      case 'dash':
        for (const h of [e.hitOnEntry, e.hitOnExit, e.hitOnLand]) if (h) damageEffects([h], out);
        break;
      case 'channel':
        damageEffects(e.tick, out);
        break;
      case 'sequence':
        damageEffects(e.steps.map((s) => s.effect), out);
        break;
      case 'repeat':
        damageEffects([e.effect], out);
        break;
      case 'charge':
        damageEffects([e.release], out);
        break;
      case 'chain':
        damageEffects([e.hit], out);
        break;
      case 'zone':
        damageEffects(e.tick, out);
        damageEffects(e.allyTick, out);
        if (e.burst) damageEffects([e.burst], out);
        break;
      case 'buff':
        damageEffects(e.onStack, out);
        break;
      case 'onKill':
      case 'onHit':
      case 'onBlock':
      case 'onParry':
      case 'onDodge':
      case 'everyNthHit':
        damageEffects(e.then, out);
        break;
      default:
        break;
    }
  }
  return out;
}

/** the patterns that land as an area (a projectile's own flight is drawn by its drawId; its burst is an area) */
function areaPatterns(p: PatternDef): PatternDef[] {
  if (p.kind === 'projectile') return p.onImpact ? areaPatterns(p.onImpact) : [];
  if (p.kind === 'sequence') return p.steps.flatMap((s) => areaPatterns(s.pattern));
  return [p];
}

const PLAYER_SOURCES: [string, EffectDef[]][] = [
  ...Object.values(SKILLS).map((s): [string, EffectDef[]] => [`skill ${s.id}`, s.effect]),
  ...Object.values(SPELLS).map((s): [string, EffectDef[]] => [`spell ${s.id}`, s.effect]),
  ...Object.values(CONSUMABLES).map((c): [string, EffectDef[]] => [`consumable ${c.id}`, c.effect]),
];

describe('skill and spell animations (owner request: no more dot bursts)', () => {
  it('every area a player skill, spell or consumable lands names a known animation', () => {
    const missing: string[] = [];
    let n = 0;
    for (const [name, effects] of PLAYER_SOURCES) {
      for (const d of damageEffects(effects)) {
        for (const p of areaPatterns(d.pattern)) {
          n++;
          if (!p.vfx) missing.push(`${name}: ${p.kind}`);
          else expect(VFX_IDS as readonly string[], `${name} vfx ${p.vfx}`).toContain(p.vfx);
        }
      }
    }
    expect(n).toBeGreaterThan(40);
    expect(missing).toEqual([]);
  });

  it('enemy and boss attacks keep their own look (no player animation ids leak into them)', () => {
    const leaks: string[] = [];
    const scan = (id: string, v: unknown): void => {
      if (v && typeof v === 'object') {
        if ('vfx' in v) leaks.push(id);
        for (const x of Object.values(v)) scan(id, x);
      }
    };
    for (const e of Object.values(ENEMIES)) scan(e.id, e);
    for (const b of Object.values(BOSSES)) scan(b.id, b);
    expect(leaks).toEqual([]);
  });

  it("a skill's impact carries its animation, true shape and damage type to the view", () => {
    const w = new World('VFX', Room.empty());
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(4));
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    installRules(w, { onPlayerDown: (_w, e) => (e.hp!.hp = e.hp!.max) });
    const seen: GameEvent[] = [];
    const fire = (effects: EffectDef[], isSpell: boolean): void => {
      runEffects(w, effects, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: p.x + 300, aimY: p.y, targetId: 0, powerMult: 1, isSpell, isSkill: !isSpell, baseDamage: 30, windupS: 0, tag: 'test' });
      for (let i = 0; i < 10; i++) {
        stepWorld(w);
        seen.push(...w.events);
      }
    };
    fire(SKILLS.colossal_guillotine!.effect, false);
    fire(SPELLS.frost_lance!.effect, true);
    const fx = seen.filter((e): e is Extract<GameEvent, { t: 'fx' }> => e.t === 'fx' && !!e.v);
    const g = fx.find((e) => e.v === 'guillotine');
    expect(g, 'guillotine fx').toBeTruthy();
    expect(g!.kind).toBe('line');
    expect(g!.r).toBeCloseTo(220, 0);
    expect(g!.x2).toBe(80);
    expect(g!.a).toBeCloseTo(0, 3);
    const ice = fx.find((e) => e.v === 'ice_lance');
    expect(ice, 'ice lance fx').toBeTruthy();
    expect(ice!.el).toBe('magic');
    expect(ice!.r).toBeCloseTo(420, 0);
    // and no plain line burst is emitted alongside them
    expect(seen.filter((e) => e.t === 'fx' && e.kind === 'line' && !e.v)).toEqual([]);
  });
});
