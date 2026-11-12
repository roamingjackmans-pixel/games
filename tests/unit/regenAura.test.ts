// D350: a Regen Aura (anything that follows a player) goes with them from room to room for the rest of its time.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { runEffects } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { neighbourId } from '../../src/game/procgen/zone';
import { stepWorld } from '../../src/game/sim';
import type { Side } from '../../src/game/room';

describe('Regen Aura between rooms (D350)', () => {
  it('survives a room change and keeps following its caster', () => {
    const ch = newCharacter('cleric', 'Joe', 'p1', new Rng('ra'));
    ch.tutorialDone = true;
    const s = new GameSession(newSave(1, ch, 'RA-SEED'));
    s.start();
    const p = s.localPlayer!;
    runEffects(s.w, SPELLS.regen_aura!.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: p.x, aimY: p.y, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: 'ra' });
    const aura = (): ReturnType<typeof s.w.get> => [...s.w.entities.values()].find((e) => e.type === 'hazard' && !e.removed && e.hz?.follow === p.id);
    expect(aura()).toBeDefined();
    const side = (['n', 's', 'e', 'w'] as Side[]).find((d) => neighbourId(s.layout, s.node.id, d))!;
    const next = neighbourId(s.layout, s.node.id, side)!.id;
    s.enterRoom(next, 'w');
    for (let i = 0; i < 30; i++) stepWorld(s.w);
    const a = aura();
    expect(a).toBeDefined();
    expect(Math.hypot(a!.x - p.x, a!.y - p.y)).toBeLessThan(2);
  });
});
