// Boss 8 — The Landlord (CONTENT_ENEMIES §11): three phases at 66% / 33%, the floating platform (open edges,
// the void fall, two shrinks that spare the door approaches and the boss), the face's pull pausing in the last
// 0.2 s of its bite, Collapse, Hollow Joes two at a time, and a long fight that does not throw.
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { THE_LANDLORD } from '../../src/data/bosses/abyss';
import { BOSS_ARENAS } from '../../src/data/rooms/bosses';
import { ZONES } from '../../src/data/zones';
import { validateBoss, type ValidationIssue } from '../../src/data/validate';
import { validateTemplate } from '../../src/game/procgen/templates';
import { checkEscapable } from '../../src/game/combat/patterns';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import { startEnemyAttack } from '../../src/game/enemies/attacks';
import { CRUMBLE_S, platformBounds } from '../../src/game/boss/platform';
import { OVERLAY, ROOM_H, ROOM_W, ROOM_Y0, T, TILE, tileCenter, type Side } from '../../src/game/room';
import type { AttackDef } from '../../src/game/types';
import type { Entity, World } from '../../src/game/world';

function session(): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('landlord'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'LANDLORD-SEED');
  save.world.zone = 8;
  save.world.respawnBonfireId = 'z8-start';
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
function enterArena(s: GameSession): Entity {
  s.enterRoom(s.layout.bossId, 's');
  run(s, 1.6); // past the name card
  const b = s.w.get(s.w.bossId);
  if (!b) throw new Error('no boss');
  return b;
}
function bigHit(s: GameSession, b: Entity, amount: number): number {
  const spec = emptySpec('normal');
  spec.dmg.physical = amount;
  return hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
}
/** Hit the boss into its next phase and let the transition and the crumbling edge play out. */
function nextPhase(s: GameSession, b: Entity): void {
  bigHit(s, b, b.hp!.max * 10);
  run(s, Math.max(PHASE_TRANSITION_S, CRUMBLE_S) + 0.2);
}
function floorCount(w: World): number {
  let n = 0;
  for (let ty = 1; ty < ROOM_H - 1; ty++) for (let tx = 1; tx < ROOM_W - 1; tx++) if (w.room.get(tx, ty) === T.Floor) n++;
  return n;
}
function attack(phase: number, id: string): AttackDef {
  const a = THE_LANDLORD!.phases[phase]!.attacks.find((x) => x.id === id);
  if (!a) throw new Error(`no ${id} in phase ${phase + 1}`);
  return a;
}
function clearAdds(w: World): void {
  for (const e of w.enemies) if (!e.en?.isBoss) w.remove(e);
  for (const e of w.entities.values()) if (e.type === 'projectile' || e.type === 'telegraph') w.remove(e);
  w.sweep();
}
const INSIDE_DOOR: Record<Side, [number, number][]> = {
  n: [
    [19, 1],
    [20, 1],
  ],
  s: [
    [19, ROOM_H - 2],
    [20, ROOM_H - 2],
  ],
  w: [
    [1, 10],
    [1, 11],
  ],
  e: [
    [ROOM_W - 2, 10],
    [ROOM_W - 2, 11],
  ],
};
/** Every door's approach is floor and connects to the middle of the platform. */
function doorApproachesConnected(w: World): boolean {
  const seen = new Set<number>([11 * ROOM_W + 20]);
  const q: [number, number][] = [[20, 11]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 1 || ny < 1 || nx > ROOM_W - 2 || ny > ROOM_H - 2 || seen.has(ny * ROOM_W + nx) || w.room.get(nx, ny) !== T.Floor) continue;
      seen.add(ny * ROOM_W + nx);
      q.push([nx, ny]);
    }
  }
  return (['n', 's', 'e', 'w'] as Side[]).every((s) => INSIDE_DOOR[s].every(([x, y]) => seen.has(y * ROOM_W + x)));
}
/** No void tile under any part of the boss's body. */
function solidUnder(w: World, b: Entity): boolean {
  for (let ty = 0; ty < ROOM_H; ty++)
    for (let tx = 0; tx < ROOM_W; tx++) {
      if (w.room.get(tx, ty) !== T.Void) continue;
      const cx = Math.max(tx * TILE, Math.min(b.x, tx * TILE + TILE));
      const cy = Math.max(ROOM_Y0 + ty * TILE, Math.min(b.y, ROOM_Y0 + ty * TILE + TILE));
      if ((cx - b.x) ** 2 + (cy - b.y) ** 2 < b.radius * b.radius) return false;
    }
  return true;
}

describe('The Landlord: data', () => {
  const L = THE_LANDLORD!;
  it('is registered for zone 8 with three phases at 66% and 33% and passes the boss rules', () => {
    expect(BOSSES.the_landlord).toBe(L);
    expect(ZONES.find((z) => z.id === 8)!.boss).toBe('the_landlord');
    expect(L.zone).toBe(8);
    expect(L.phases.map((p) => p.untilHpPct)).toEqual([66, 33, 0]);
    const issues: ValidationIssue[] = [];
    validateBoss(L, issues);
    expect(issues).toEqual([]);
  });
  it('every phase has Red and Piercing; each new phase adds at least two new attacks; ≥ 2 [AREA]', () => {
    L.phases.forEach((p, i) => {
      expect(p.attacks.some((a) => a.kind === 'red'), `phase ${i + 1} red`).toBe(true);
      expect(p.attacks.some((a) => a.kind === 'pierce'), `phase ${i + 1} pierce`).toBe(true);
      if (i > 0) expect(p.attacks.filter((a) => !L.phases[i - 1]!.attacks.some((b) => b.id === a.id)).length, `phase ${i + 1} new`).toBeGreaterThanOrEqual(2);
    });
    expect(new Set(L.phases.flatMap((p) => p.attacks.filter((a) => a.area).map((a) => a.id))).size).toBeGreaterThanOrEqual(2);
  });
  it('every Piercing pattern is escapable, pull included (the bite: 280 ≥ 260)', () => {
    for (const p of L.phases)
      for (const a of p.attacks.filter((x) => x.kind === 'pierce')) {
        const r = checkEscapable(a.pattern!, a.windupMs / 1000, a.condition ? { condition: a.condition } : {});
        expect(r.ok, `${a.id}: ${r.reason}`).toBe(true);
      }
    const bite = attack(2, 'landlord_maw');
    expect(bite.pattern!.pullSpeed).toBe(L.phases[2]!.passive!.pull!.speed);
    expect(checkEscapable(bite.pattern!, bite.windupMs / 1000).available).toBeCloseTo(280, 5);
  });
  it('the arena is a valid room: a platform in the void, a bridge from every door', () => {
    const t = BOSS_ARENAS.abyss_arena!;
    expect(validateTemplate(t, { arena: true })).toEqual([]);
    expect(t.rows.every((r) => r.length === 40)).toBe(true);
    expect(t.rows.join('').includes('V')).toBe(true);
  });
});

describe('The Landlord: the fight', () => {
  it('spawns in its arena from the session and changes phase at exactly 66% and 33%', () => {
    const s = session();
    const b = enterArena(s);
    expect(s.roomPhase).toBe('boss');
    expect(b.en!.def.id).toBe('the_landlord');
    expect(s.w.room.id.endsWith(s.layout.bossId)).toBe(true);
    const max = b.hp!.max;
    // a hit that leaves him above 66% stays in phase 1
    b.hp!.hp = max * 0.7;
    bigHit(s, b, 1);
    expect(b.en!.phase).toBe(0);
    bigHit(s, b, max * 10);
    expect(b.hp!.hp).toBeCloseTo(max * 0.66, 6);
    expect(b.en!.phase).toBe(1);
    expect(bigHit(s, b, 100)).toBe(0); // the transition is invulnerable
    run(s, PHASE_TRANSITION_S + 0.1);
    bigHit(s, b, max * 10);
    expect(b.hp!.hp).toBeCloseTo(max * 0.33, 6);
    expect(b.en!.phase).toBe(2);
    expect(b.en!.phaseAttacks.some((a) => a.id === 'landlord_collapse')).toBe(true);
    run(s, PHASE_TRANSITION_S + 0.1);
    bigHit(s, b, max * 10);
    expect(b.hp!.dead).toBe(true);
    // zone 8 has no stairs down (the ending is the session's)
    run(s, 2.2);
    expect([...s.w.entities.values()].some((e) => e.it?.kind === 'stairs' && e.it.label === 'Descend')).toBe(false);
  });

  it('the platform shrinks ~25% in phases 2 and 3, never under the door approaches or the boss', () => {
    const s = session();
    const b = enterArena(s);
    const w = s.w;
    const full = floorCount(w);
    expect(doorApproachesConnected(w)).toBe(true);
    // phase 2: the edge crumbles first (still floor), then falls
    bigHit(s, b, b.hp!.max * 10);
    let crumbling = 0;
    for (const o of w.room.overlay) if (o === OVERLAY.Crumbling) crumbling++;
    expect(crumbling).toBeGreaterThan(0);
    expect(floorCount(w)).toBe(full);
    run(s, CRUMBLE_S + 0.2);
    const p2 = floorCount(w);
    expect(p2 / full).toBeGreaterThan(0.68);
    expect(p2 / full).toBeLessThan(0.82);
    expect(doorApproachesConnected(w)).toBe(true);
    expect(solidUnder(w, b)).toBe(true);
    expect(b.radius).toBeGreaterThan(THE_LANDLORD!.radius * 1.2); // he grows
    // phase 3: again
    run(s, 1);
    nextPhase(s, b);
    const p3 = floorCount(w);
    expect(p3 / p2).toBeGreaterThan(0.68);
    expect(p3 / p2).toBeLessThan(0.82);
    expect(doorApproachesConnected(w)).toBe(true);
    // the void face: stationary in the far third (away from the door), wholly on the platform
    run(s, 0.1);
    expect(solidUnder(w, b)).toBe(true);
    const door = (['n', 's', 'e', 'w'] as Side[]).find((d) => w.room.doors[d].exists) ?? 's';
    const pb = platformBounds(w.room)!;
    const [x0, y0] = [pb.x0 * TILE, ROOM_Y0 + pb.y0 * TILE];
    const [x1, y1] = [(pb.x1 + 1) * TILE, ROOM_Y0 + (pb.y1 + 1) * TILE];
    if (door === 's') expect(b.y).toBeLessThan(y0 + (y1 - y0) / 3 + 1);
    if (door === 'n') expect(b.y).toBeGreaterThan(y1 - (y1 - y0) / 3 - 1);
    if (door === 'w') expect(b.x).toBeGreaterThan(x1 - (x1 - x0) / 3 - 1);
    if (door === 'e') expect(b.x).toBeLessThan(x0 + (x1 - x0) / 3 + 1);
    const at: [number, number] = [b.x, b.y];
    s.w.god = true;
    run(s, 5);
    expect([b.x, b.y]).toEqual(at);
  });

  it('walking off the edge costs 50% max HP and returns you to the nearest edge after 1.5 s; a dodge does not save you', () => {
    const s = session();
    const b = enterArena(s);
    s.w.remove(b);
    s.w.sweep();
    const p = s.localPlayer!;
    const pl = p.pl!;
    // the west edge of the platform, row 6
    const [ex, ey] = tileCenter(3, 6);
    expect(s.w.room.get(2, 6)).toBe(T.Void);
    p.x = ex;
    p.y = ey;
    const max = p.hp!.max;
    p.hp!.hp = max;
    pl.input.moveX = -1;
    pl.input.moveY = 0;
    for (let i = 0; i < 60 && !pl.falling; i++) stepWorld(s.w);
    pl.input.moveX = 0;
    expect(pl.falling).not.toBeNull();
    expect(p.hp!.hp).toBeCloseTo(max * 0.5, 6);
    const fellAt = s.w.time;
    while (pl.falling && s.w.time - fellAt < 3) stepWorld(s.w);
    expect(s.w.time - fellAt).toBeGreaterThan(1.5 - 1 / 30);
    expect(s.w.time - fellAt).toBeLessThan(1.5 + 1 / 30);
    expect([p.x, p.y]).toEqual([ex, ey]);
    expect(p.hp!.hp).toBeCloseTo(max * 0.5, 6);
    // rolling over the edge: still a fall
    p.hp!.hp = max;
    pl.state = 'dodge';
    pl.stateUntil = pl.dodgeUntil = s.w.time + 0.45;
    pl.iframesFrom = s.w.time;
    pl.iframesUntil = s.w.time + 0.45;
    pl.dodgeDir = [-1, 0];
    for (let i = 0; i < 30 && !pl.falling; i++) stepWorld(s.w);
    expect(pl.falling).not.toBeNull();
    expect(p.hp!.hp).toBeCloseTo(max * 0.5, 6);
  });

  it("the face's pull stops in the last 0.2 s of the bite telegraph", () => {
    const s = session();
    s.w.god = true;
    const b = enterArena(s);
    nextPhase(s, b);
    nextPhase(s, b);
    run(s, 0.1);
    expect(b.en!.phase).toBe(2);
    clearAdds(s.w);
    const p = s.localPlayer!;
    p.pl!.input.moveX = 0;
    p.pl!.input.moveY = 0;
    // 300 px from the face, toward the middle of the platform
    const a = Math.atan2(368 - b.y, 640 - b.x);
    p.x = b.x + Math.cos(a) * 300;
    p.y = b.y + Math.sin(a) * 300;
    b.en!.attack = null;
    const bite = attack(2, 'landlord_maw');
    startEnemyAttack(s.w, b, bite, p);
    let pulledEarly = 0;
    let pulledLate = 0;
    let lateFrames = 0;
    const running = (): NonNullable<typeof b.en>['attack'] => b.en!.attack;
    while (running()?.phase === 'windup') {
      const at = running()!;
      const left = at.windup - at.t;
      const [x, y] = [p.x, p.y];
      stepWorld(s.w);
      const moved = Math.hypot(p.x - x, p.y - y);
      if (left >= 0.2 + 1 / 60) pulledEarly += moved;
      else if (left < 0.2) {
        lateFrames++;
        pulledLate += moved;
      }
    }
    expect(pulledEarly).toBeGreaterThan(70 * 1.2); // ~70 px/s for 1.3 s
    expect(lateFrames).toBeGreaterThanOrEqual(11);
    expect(pulledLate).toBe(0);
  });

  it('Collapse drops the outer ring for 4 s: standing on it is the void fall, then the floor returns', () => {
    const s = session();
    const b = enterArena(s);
    nextPhase(s, b);
    nextPhase(s, b);
    run(s, 0.1);
    clearAdds(s.w);
    const p = s.localPlayer!;
    const before = floorCount(s.w);
    // stand on the platform's outer ring: the corner farthest from the face (the pull drags you toward it)
    const pb = platformBounds(s.w.room)!;
    const corners = [tileCenter(pb.x0 + 1, pb.y0 + 1), tileCenter(pb.x1 - 1, pb.y0 + 1), tileCenter(pb.x0 + 1, pb.y1 - 1), tileCenter(pb.x1 - 1, pb.y1 - 1)];
    const [cx, cy] = corners.sort((u, v) => Math.hypot(v[0] - b.x, v[1] - b.y) - Math.hypot(u[0] - b.x, u[1] - b.y))[0]!;
    p.x = cx;
    p.y = cy;
    p.hp!.hp = p.hp!.max;
    b.en!.attack = null;
    startEnemyAttack(s.w, b, attack(2, 'landlord_collapse'), p);
    run(s, 1.5 + 0.1);
    expect(floorCount(s.w)).toBeLessThan(before * 0.75);
    expect(p.pl!.falling).not.toBeNull();
    expect(p.hp!.hp).toBeCloseTo(p.hp!.max * 0.5, 6);
    expect(solidUnder(s.w, b)).toBe(true);
    // the climb back lands inside the ring that stayed
    run(s, 1.5);
    expect(p.pl!.falling).toBeNull();
    expect(Math.hypot(p.x - 640, p.y - 368)).toBeLessThan(220 + 32);
    run(s, 2.6);
    expect(floorCount(s.w)).toBe(before);
  });

  it('Hollow Joes come two at a time in phase 3, and never more', () => {
    const s = session();
    s.w.god = true;
    const b = enterArena(s);
    nextPhase(s, b);
    nextPhase(s, b);
    let most = 0;
    for (let i = 0; i < 60; i++) {
      run(s, 0.5);
      const n = s.w.enemies.filter((e) => !e.hp?.dead && e.en?.def.id === 'hollow_joe').length;
      expect(n).toBeLessThanOrEqual(2);
      most = Math.max(most, n);
    }
    expect(most).toBe(2);
  });

  it('runs ~90 s against a god-mode player through all three phases without throwing', () => {
    const s = session();
    s.w.god = true;
    s.enterRoom(s.layout.bossId, 's');
    const b = s.w.get(s.w.bossId)!;
    run(s, 25);
    bigHit(s, b, b.hp!.max * 10);
    expect(b.en!.phase).toBe(1);
    run(s, 30);
    bigHit(s, b, b.hp!.max * 10);
    expect(b.en!.phase).toBe(2);
    run(s, 35);
    expect(b.hp!.dead).toBe(false);
    expect(b.en!.phase).toBe(2);
    expect(s.roomPhase).toBe('boss');
  });
});
