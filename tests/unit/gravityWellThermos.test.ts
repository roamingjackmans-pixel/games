// Gravity Well pulls flyers (Saint Aurelia's ice mirrors) and deals no damage at its end; the Thermos sparkle shows
// while a player drinks.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { CRYPT } from '../../src/data/enemies/crypt';
import { SPELLS } from '../../src/data/spells';
import { runEffects } from '../../src/game/effects/run';
import { thermosProgress } from '../../src/render/thermosFx';

const well = SPELLS.gravity_well!;

function cast(w: World, casterId: number, x: number, y: number): void {
  runEffects(w, well.effect, { sourceId: casterId, team: 0, x: 200, y: 368, aimX: x, aimY: y, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'test' });
}

describe('Gravity Well', () => {
  it('has no end burst and no damage', () => {
    const z = well.effect[0]!;
    expect(z.op).toBe('zone');
    expect((z as { burst?: unknown }).burst ?? null).toBeNull();
    expect(JSON.stringify(well.effect)).not.toContain('"damage"');
  });

  it("pulls a hovering ice mirror toward its centre", () => {
    const w = new World('GWM', Room.empty());
    const c = newCharacter('scholar', 'Joe', 'p1', new Rng(1));
    const p = spawnPlayer(w, c, 0, true, 200, 368);
    const m = spawnEnemy(w, ENEMIES.ice_mirror!, 760, 368, { tellS: 0 });
    m.en!.state = 'dormant';
    expect(m.flying).toBe(true);
    cast(w, p.id, 640, 368);
    const d0 = Math.hypot(m.x - 640, m.y - 368);
    for (let i = 0; i < 60; i++) stepWorld(w);
    expect(Math.hypot(m.x - 640, m.y - 368)).toBeLessThan(d0 - 60);
  });

  it('deals no damage when it ends', () => {
    const w = new World('GWD', Room.empty());
    const c = newCharacter('scholar', 'Joe', 'p1', new Rng(1));
    const p = spawnPlayer(w, c, 0, true, 200, 368);
    const foe = spawnEnemy(w, CRYPT.shambler!, 640, 368, { tellS: 0 });
    foe.en!.state = 'dormant';
    cast(w, p.id, 640, 368);
    let dmg = 0;
    for (let i = 0; i < 60 * 4; i++) {
      w.events.length = 0;
      stepWorld(w);
      for (const ev of w.events) if (ev.t === 'dmg' && ev.targetId === foe.id) dmg++;
    }
    expect([...w.entities.values()].some((e) => e.type === 'hazard')).toBe(false);
    expect(dmg).toBe(0);
    expect(foe.hp!.hp).toBe(foe.hp!.max);
  });
});

describe('Thermos sparkle', () => {
  it('runs while the player drinks and stops after', () => {
    const w = new World('TS', Room.empty());
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    expect(thermosProgress(p, w.time)).toBe(-1);
    p.hp!.hp = 10;
    p.pl!.input = { ...emptyInput(), buttons: ACTION_BIT.flask, pressed: ACTION_BIT.flask };
    stepWorld(w);
    p.pl!.input = { ...p.pl!.input, pressed: 0, buttons: 0 };
    expect(p.pl!.state).toBe('flask');
    expect(thermosProgress(p, w.time)).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 120; i++) stepWorld(w);
    expect(thermosProgress(p, w.time)).toBe(-1);
  });
});
