// D261 (a two-set attack's second set shows up as late as it strikes), D262 (area attacks test the dot at a
// player's feet), D263 (door torch spots).
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room, doorTiles } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { PLAYER_DOT_DY, PLAYER_DOT_R, PLAYER_RADIUS, spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { emptySpec } from '../../src/game/combat/damage';
import { spawnTelegraphs } from '../../src/game/combat/telegraph';
import { TRAINING_DUMMY } from '../../src/data/enemies/special';
import { Rng } from '../../src/engine/rng';
import { doorTorchSpots } from '../../src/render/walls';
import type { PatternCtx } from '../../src/game/combat/patterns';
import type { PatternDef } from '../../src/game/types';

const ctx = (): PatternCtx => ({ ox: 640, oy: 368, facing: 0, tx: 800, ty: 368, players: [{ x: 800, y: 368 }], rng: new Rng(3), room: Room.empty(), telegraphS: 1.2 });

function world(): { w: World; owner: number; px: number; py: number; hp: () => number } {
  const w = new World('TEST', Room.empty());
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng(1)), 0, true, 600, 368);
  const d = spawnEnemy(w, TRAINING_DUMMY, 1000, 368, { tellS: 0 });
  return { w, owner: d.id, px: p.x, py: p.y, hp: () => p.hp!.hp };
}

describe('two-set attacks show each set as it charges (D261)', () => {
  for (const pattern of [
    { kind: 'lanes', n: 5, w: 64, orientation: 'horizontal', alternate: true, setGapS: 1.0 },
    { kind: 'grid', spacing: 140, r: 50, checkerboard: true, sets: 2, setGapS: 1.0 },
  ] as PatternDef[]) {
    it(`${pattern.kind}: the B set appears 1 s after A and charges for the same windup`, () => {
      const { w, owner } = world();
      const now = w.time;
      const [a, b] = spawnTelegraphs(w, pattern, { ownerId: owner, team: 1, kind: 'pierce', windupS: 1.2, spec: null, ctx: ctx() });
      expect(a!.tg!.start).toBeCloseTo(now);
      expect(b!.tg!.start).toBeCloseTo(now + 1.0);
      expect(a!.tg!.impact - a!.tg!.start).toBeCloseTo(1.2);
      expect(b!.tg!.impact - b!.tg!.start).toBeCloseTo(1.2);
      expect(b!.tg!.impact - a!.tg!.impact).toBeCloseTo(1.0);
    });
  }
  it('other delayed telegraphs still show from the start', () => {
    const { w, owner } = world();
    const seq = { kind: 'sequence', steps: [{ delayS: 0, pattern: { kind: 'circle', r: 80, anchor: 'target' } }, { delayS: 0.6, pattern: { kind: 'circle', r: 80, anchor: 'target' } }] } as PatternDef;
    const tgs = spawnTelegraphs(w, seq, { ownerId: owner, team: 1, kind: 'normal', windupS: 1, spec: null, ctx: ctx() });
    for (const t of tgs) expect(t.tg!.start).toBeCloseTo(w.time);
  });
});

describe('area attacks test the dot at a player\'s feet (D262)', () => {
  const spec = (): ReturnType<typeof emptySpec> => {
    const s = emptySpec('normal');
    s.dmg = { physical: 40 };
    return s;
  };
  it('an area that only grazes the body misses; one over the dot hits', () => {
    // the dot sits inside the old body circle, so no area catches more than before
    expect(PLAYER_DOT_DY + PLAYER_DOT_R).toBeLessThanOrEqual(PLAYER_RADIUS);
    // a big circle whose edge sits 9 px from the player's centre: inside the body, clear of the dot
    const miss = world();
    const r = 300;
    spawnTelegraphs(miss.w, { kind: 'circle', r, anchor: 'target' }, { ownerId: miss.owner, team: 1, kind: 'normal', windupS: 0.2, spec: spec(), ctx: { ...ctx(), tx: miss.px + r + 9, ty: miss.py } });
    const hp0 = miss.hp();
    for (let i = 0; i < 30; i++) stepWorld(miss.w);
    expect(miss.hp()).toBe(hp0);
    // the same circle 3 px closer covers the dot's edge
    const hit = world();
    spawnTelegraphs(hit.w, { kind: 'circle', r, anchor: 'target' }, { ownerId: hit.owner, team: 1, kind: 'normal', windupS: 0.2, spec: spec(), ctx: { ...ctx(), tx: hit.px + r + 3, ty: hit.py } });
    const hp1 = hit.hp();
    for (let i = 0; i < 30; i++) stepWorld(hit.w);
    expect(hit.hp()).toBeLessThan(hp1);
  });
});

describe('door torches (D263)', () => {
  it('two torches, one on the wall tile either side of each doorway', () => {
    for (const side of ['n', 's', 'e', 'w'] as const) {
      const spots = doorTorchSpots(side, 18);
      expect(spots).toHaveLength(2);
      const door = doorTiles(side);
      for (const s of spots) {
        // next to the doorway, never on it
        expect(door.some(([x, y]) => x === s.tx && y === s.ty)).toBe(false);
        expect(door.some(([x, y]) => Math.abs(x - s.tx) + Math.abs(y - s.ty) === 1)).toBe(true);
      }
      expect(spots[0]!.tx !== spots[1]!.tx || spots[0]!.ty !== spots[1]!.ty).toBe(true);
    }
  });
});

describe('the dot sits at the feet (D262)', () => {
  it('an area just below the belt but over the feet hits; one just above the head misses', () => {
    const r = 300;
    const spec = emptySpec('normal');
    spec.dmg = { physical: 40 };
    // circle edge 2 px into the dot from below
    const feet = world();
    spawnTelegraphs(feet.w, { kind: 'circle', r, anchor: 'target' }, { ownerId: feet.owner, team: 1, kind: 'normal', windupS: 0.2, spec, ctx: { ...ctx(), tx: feet.px, ty: feet.py + PLAYER_DOT_DY + PLAYER_DOT_R - 2 + r } });
    const hpA = feet.hp();
    for (let i = 0; i < 30; i++) stepWorld(feet.w);
    expect(feet.hp()).toBeLessThan(hpA);
    // circle edge over the top of the body (centre - 10): clear of the dot
    const head = world();
    spawnTelegraphs(head.w, { kind: 'circle', r, anchor: 'target' }, { ownerId: head.owner, team: 1, kind: 'normal', windupS: 0.2, spec, ctx: { ...ctx(), tx: head.px, ty: head.py - 10 - r } });
    const hpB = head.hp();
    for (let i = 0; i < 30; i++) stepWorld(head.w);
    expect(head.hp()).toBe(hpB);
  });
});
