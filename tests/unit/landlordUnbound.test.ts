// The Landlord, Unbound (D279): phase 3's bar running out knocks the face down; after a 4.5 s invulnerable
// transformation he fights on player-sized, fast and blinking, on a second bar 1.2× what phase 3 had. Only
// the end of that bar ends the fight.
import { describe, expect, it, vi } from 'vitest';
import { THE_LANDLORD } from '../../src/data/bosses/abyss';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import { metaOf } from '../../src/game/net/snapshot';
import { drawById, type DrawState } from '../../src/engine/draw/registry';
import '../../src/engine/draw/bosses/abyss';
import { enemyDrawState } from '../../src/render/entities';
import { T } from '../../src/game/room';
import type { Entity } from '../../src/game/world';

const L = THE_LANDLORD!;
const P4 = L.phases[3]!;

function session(cycle = 0): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('unbound'));
  ch.tutorialDone = true;
  ch.cycle = cycle;
  const save = newSave(1, ch, 'UNBOUND-SEED');
  save.world.zone = 8;
  save.world.respawnBonfireId = 'z8-start';
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
function bigHit(s: GameSession, b: Entity, amount: number): number {
  const spec = emptySpec('normal');
  spec.dmg.physical = amount;
  return hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
}
/** Into the arena, then through phases 1–3 to the moment phase 3's bar runs out. Returns the first bar's size. */
function toUnbound(s: GameSession): { b: Entity; max: number } {
  s.enterRoom(s.layout.bossId, 's');
  run(s, 1.6);
  const b = s.w.get(s.w.bossId)!;
  const max = b.hp!.max;
  bigHit(s, b, max * 10);
  run(s, PHASE_TRANSITION_S + 0.1);
  bigHit(s, b, max * 10);
  run(s, PHASE_TRANSITION_S + 0.1);
  expect(b.en!.phase).toBe(2);
  bigHit(s, b, max * 10);
  return { b, max };
}

/** A canvas context that accepts every call (draw smoke tests). */
function fakeCtx(): CanvasRenderingContext2D {
  const fn: unknown = new Proxy(() => fn, { get: () => fn, apply: () => fn });
  return new Proxy({ globalAlpha: 1, lineWidth: 1, globalCompositeOperation: 'source-over' } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : fn), set: (t, k, v) => ((t[k as string] = v), true) }) as unknown as CanvasRenderingContext2D;
}

describe('The Landlord, Unbound: data', () => {
  it('a fourth phase on a refilled bar 1.2× phase 3, player-sized, fast and blinking', () => {
    expect(L.phases.length).toBe(4);
    expect(P4.refillHp).toBe(true);
    expect(P4.hpOfPrevPhase).toBe(1.2);
    expect(P4.barName).toBe('The Landlord, Unbound');
    expect(L.radius * P4.passive!.scale!).toBeCloseTo(21, 0); // D315: half again the player's size
    expect(P4.speedMult).toBeGreaterThanOrEqual(2.5);
    expect(P4.passive!.blink).toBeDefined();
    expect(P4.attacks.some((a) => a.kind === 'red')).toBe(true);
    expect(P4.attacks.some((a) => a.kind === 'pierce')).toBe(true);
    // no attack is both Red and Piercing
    for (const a of P4.attacks) expect(a.kind === 'red' && a.kind === ('pierce' as string)).toBe(false);
  });
});

describe('The Landlord, Unbound: the fight', () => {
  it("phase 3's bar running out starts the transformation: 1 HP, invulnerable, then a fresh bar of 1.2 × 33%", () => {
    const s = session();
    const { b, max } = toUnbound(s);
    expect(b.hp!.dead).toBe(false);
    expect(b.en!.phase).toBe(3);
    expect(b.hp!.max).toBeCloseTo(max * 0.33 * 1.2, 4);
    expect(b.hp!.hp).toBeCloseTo(b.hp!.max, 4);
    // the new form at once, and the field is cleared
    expect(b.radius).toBeCloseTo(L.radius * 0.45, 4);
    expect(s.w.enemies.filter((e) => !e.en?.isBoss && !e.hp?.dead && !e.removed).length).toBe(0);
    expect([...s.w.entities.values()].filter((e) => e.type === 'telegraph' && e.tg?.team === 1 && !e.removed).length).toBe(0);
    // invulnerable for the whole 4.5 s transformation (not just the usual 2 s)
    run(s, PHASE_TRANSITION_S + 0.5);
    expect(bigHit(s, b, 100)).toBe(0);
    expect(b.en!.phaseTransitionUntil).toBeGreaterThan(s.w.time);
    run(s, P4.transitionS! - PHASE_TRANSITION_S - 0.4);
    expect(b.en!.phaseTransitionUntil).toBeLessThanOrEqual(s.w.time);
    expect(bigHit(s, b, 100)).toBeGreaterThan(0);
  });

  it('the transformation plays its beats: the roar, the shakes', () => {
    const s = session();
    toUnbound(s);
    const seen: string[] = [];
    for (let i = 0; i < Math.round(P4.transitionS! * 60); i++) {
      stepWorld(s.w);
      for (const ev of s.w.events) if (ev.t === 'sfx') seen.push(ev.id);
    }
    expect(seen).toContain('unboundCharge');
    expect(seen).toContain('unboundRoar');
  });

  it('dies only when the second bar runs out, and the fight then ends as before', () => {
    const s = session();
    const { b } = toUnbound(s);
    run(s, P4.transitionS! + 0.1);
    bigHit(s, b, b.hp!.max * 0.9);
    expect(b.hp!.dead).toBe(false);
    bigHit(s, b, b.hp!.max * 10);
    expect(b.hp!.dead).toBe(true);
    run(s, 0.5);
    expect(s.save.world.bossesBeatenThisCycle).toContain(8);
  });

  it('in New Game+ the second bar is 1.2 × 33% of the larger NG+ bar (D259)', () => {
    const base = toUnbound(session(0));
    const ng = toUnbound(session(1));
    expect(ng.max).toBeGreaterThan(base.max);
    expect(ng.b.hp!.max).toBeCloseTo(ng.max * 0.33 * 1.2, 4);
  });

  it('moves fast and blinks: telegraphed, never onto a player, always onto floor', () => {
    const s = session();
    const { b } = toUnbound(s);
    s.w.god = true;
    run(s, P4.transitionS! + 0.1);
    let blinks = 0;
    let marked = 0;
    let prev = { x: b.x, y: b.y };
    for (let i = 0; i < 60 * 20; i++) {
      stepWorld(s.w);
      if (s.w.events.some((ev) => ev.t === 'fx' && ev.kind === 'impact' && ev.color === '#b06bff')) marked++;
      if (Math.hypot(b.x - prev.x, b.y - prev.y) > 60) {
        blinks++;
        for (const p of s.w.livingPlayers()) expect(Math.hypot(p.x - b.x, p.y - b.y)).toBeGreaterThan(p.radius + b.radius);
        expect(s.w.room.tileAt(b.x, b.y)).not.toBe(T.Void);
      }
      prev = { x: b.x, y: b.y };
    }
    expect(blinks).toBeGreaterThanOrEqual(3);
    expect(marked).toBeGreaterThanOrEqual(blinks);
    expect(b.hp!.dead).toBe(false);
  });

  it('a guest sees the new size; the drawing plays every stage without throwing', () => {
    const s = session();
    const { b } = toUnbound(s);
    const m = metaOf(b, 'p2');
    expect(m && m.t === 'enemy' ? m.r : 0).toBeCloseTo(20.7, 1);
    const ctx = fakeCtx();
    // the glow sprites are drawn on an offscreen canvas
    vi.stubGlobal('OffscreenCanvas', class { getContext(): CanvasRenderingContext2D { return fakeCtx(); } });
    for (let k = 0; k <= 1.0001; k += 0.05) {
      const st: DrawState = { ...enemyDrawState(b, b.x, b.y, s.w.time, ['#000', '#111', '#222', '#333']), trans: k };
      expect(() => drawById(ctx, 'boss_landlord', st)).not.toThrow();
    }
    run(s, P4.transitionS! + 0.1);
    const st = enemyDrawState(b, b.x, b.y, s.w.time, ['#000', '#111', '#222', '#333']);
    expect(st.trans).toBeUndefined();
    for (const pose of ['idle', 'windup', 'attack', 'recover', 'stagger']) expect(() => drawById(ctx, 'boss_landlord', { ...st, pose })).not.toThrow();
    vi.unstubAllGlobals();
  });
});
