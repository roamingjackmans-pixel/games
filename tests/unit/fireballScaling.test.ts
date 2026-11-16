// D420: Fireball's blast is 30 Fire at Spell Skill 100 and grows with Spell Skill like every other spell (its blast used
// to land at the listed amount whatever the caster's Spell Skill).
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { runEffects } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { ENEMIES } from '../../src/data/enemies';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';

/** The damage one Fireball deals to a sturdy target 200 px away, cast at this Spell Skill multiplier. */
function blast(powerMult: number): number {
  const ch = newCharacter('scholar', 'Joe', 'p1', new Rng('FB'));
  ch.tutorialDone = true;
  const s = new GameSession(newSave(1, ch, 'FB'));
  s.start();
  inCombat(s.w);
  const p = s.localPlayer!;
  const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x + 200, p.y, { tellS: 0 });
  foe.hp!.max = foe.hp!.hp = 1e6;
  s.w.refreshLists();
  runEffects(s.w, SPELLS.fireball!.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: foe.x, aimY: foe.y, targetId: foe.id, powerMult, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: 'spell:fireball', spellId: 'fireball', school: 'brain' });
  // long enough for the shot to land, not for its puddle to tick
  for (let i = 0; i < 30 && foe.hp!.hp === 1e6; i++) stepWorld(s.w);
  return 1e6 - foe.hp!.hp;
}

describe('Fireball scales with Spell Skill (D420)', () => {
  it('lists 30 Fire', () => {
    const e = SPELLS.fireball!.effect[0]!;
    expect(e.op === 'damage' && e.base).toBe(30);
    expect(SPELLS.fireball!.description).toContain('30 Fire');
  });

  it('twice the Spell Skill, twice the blast', () => {
    const one = blast(1);
    const two = blast(2);
    expect(one).toBeGreaterThan(0);
    expect(two / one).toBeCloseTo(2, 1);
  });
});
