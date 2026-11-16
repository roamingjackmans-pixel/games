// D425: Arcane Beam turns smoothly while you swing it round. The caster used to turn only on each 0.2 s damage tick
// and every tick laid a fresh beam at that tick's angle, so a beam swung round jumped five times a second. Now the
// caster turns with the aim every frame, and the beam is one animation that stays on the caster and turns with it.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { ENEMIES } from '../../src/data/enemies';
import { tryCastSpell } from '../../src/game/skills/use';
import { emptyInput } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { clearSkillFx, drawSkillFxTop, spawnSkillFx } from '../../src/render/skillFx';
import type { Particles } from '../../src/engine/particles';

describe('Arcane Beam turns smoothly (D425)', () => {
  it('the caster turns with the aim every frame of the channel, not only on its ticks', () => {
    const w = new World('BEAM', Room.empty());
    const c = newCharacter('scholar', 'Joe', 'p1', new Rng(3));
    c.stats.brain = 40;
    c.knownSpells = [...new Set([...c.knownSpells, 'arcane_beam'])];
    c.spellLoadout.brain = ['arcane_beam', null, null];
    const p = spawnPlayer(w, c, 0, true, 640, 400);
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 400 };
    w.god = true;
    spawnEnemy(w, ENEMIES.hollow_wolf!, 1200, 650);
    expect(tryCastSpell(w, p, 0)).toBe(true);
    for (let i = 0; i < 20; i++) stepWorld(w);
    expect(p.pl!.channel).toBeTruthy();
    // swing the aim a little each frame: the facing follows on every frame, between ticks too
    for (let i = 1; i <= 12; i++) {
      const a = i * 0.05;
      p.pl!.input = { ...p.pl!.input, aimX: 640 + Math.cos(a) * 300, aimY: 400 + Math.sin(a) * 300 };
      stepWorld(w);
      expect(p.facing).toBeCloseTo(a, 1);
    }
  });

  it('D427: walking while it fires, every tick still names its caster, so the beam stays one beam on the move', () => {
    const w = new World('BEAM2', Room.empty());
    const c = newCharacter('scholar', 'Joe', 'p1', new Rng(4));
    c.stats.brain = 40;
    c.knownSpells = [...new Set([...c.knownSpells, 'arcane_beam'])];
    c.spellLoadout.brain = ['arcane_beam', null, null];
    const p = spawnPlayer(w, c, 0, true, 400, 400);
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 200 };
    w.god = true;
    spawnEnemy(w, ENEMIES.hollow_wolf!, 1200, 650);
    expect(tryCastSpell(w, p, 0)).toBe(true);
    const x0 = p.x;
    let beams = 0;
    let named = 0;
    for (let i = 0; i < 100; i++) {
      // walk diagonally (down-right) the whole time
      p.pl!.input = { ...p.pl!.input, moveX: 0.7, moveY: 0.7 };
      w.events.length = 0;
      stepWorld(w);
      for (const ev of w.events) {
        if (ev.t !== 'fx' || ev.v !== 'arcane_beam') continue;
        beams++;
        if (ev.src === p.id) named++;
      }
    }
    expect(p.x).toBeGreaterThan(x0 + 20);
    expect(beams).toBeGreaterThan(5);
    expect(named).toBe(beams);
  });

  it('the ticks of one caster draw one beam, on the caster and at its angle now', () => {
    clearSkillFx();
    const rotations: number[] = [];
    const ctx = new Proxy(
      {},
      {
        get(_t, k) {
          if (k === 'rotate') return (a: number) => rotations.push(a);
          if (k === 'createRadialGradient') return () => ({ addColorStop: () => undefined });
          return () => undefined;
        },
        set: () => true,
      },
    ) as CanvasRenderingContext2D;
    const particles = { burst: () => undefined, spawn: () => undefined } as unknown as Particles;
    // the glow sprites draw on an offscreen canvas: a stand-in that draws nothing
    const g = globalThis as { OffscreenCanvas?: unknown };
    const hadOffscreen = g.OffscreenCanvas;
    g.OffscreenCanvas ??= class {
      width = 0;
      height = 0;
      getContext(): unknown {
        return new Proxy({}, { get: (_t, k) => (k === 'createRadialGradient' ? () => ({ addColorStop: () => undefined }) : () => undefined), set: () => true });
      }
    };
    // two ticks laid at different angles, 0.2 s apart
    expect(spawnSkillFx({ kind: 'line', x: 640, y: 400, a: 0, r: 700, x2: 52, v: 'arcane_beam', el: 'void', src: 7 }, 10)).toBe(true);
    expect(spawnSkillFx({ kind: 'line', x: 640, y: 400, a: 0.6, r: 700, x2: 52, v: 'arcane_beam', el: 'void', src: 7 }, 10.2)).toBe(true);
    drawSkillFxTop(ctx, 10.25, particles, [], 10.25, (id) => (id === 7 ? { x: 650, y: 410, a: 0.9 } : null));
    expect(rotations).toEqual([0.9]);
    // still lit past the first tick's own life: the second tick lengthened it
    rotations.length = 0;
    drawSkillFxTop(ctx, 10.4, particles, [], 10.4, () => ({ x: 650, y: 410, a: 1.1 }));
    expect(rotations).toEqual([1.1]);
    clearSkillFx();
    g.OffscreenCanvas = hadOffscreen;
  });
});
