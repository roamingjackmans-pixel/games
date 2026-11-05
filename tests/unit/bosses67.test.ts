// Boss 6 (Saint Aurelia the Unthawed) and Boss 7 (Archmagister Tock): data, arenas, a minute of fighting,
// the 50% phase change and their special mechanics (CONTENT_ENEMIES §11, §13).
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { SAINT_AURELIA, SAINT_AURELIA_ARENA } from '../../src/data/bosses/reliquary';
import { ARCHMAGISTER_TOCK, ARCHMAGISTER_TOCK_ARENA } from '../../src/data/bosses/citadel';
import { ENEMIES } from '../../src/data/enemies';
import { validateBoss, type ValidationIssue } from '../../src/data/validate';
import { validateTemplate } from '../../src/game/procgen/templates';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import { ROOM_CORNERS, resolvePattern, shapeHit, type Shape } from '../../src/game/combat/patterns';
import { startEnemyAttack } from '../../src/game/enemies/attacks';
import { spawnPlayerProjectile } from '../../src/game/player/player';
import { T } from '../../src/game/room';
import type { AttackDef, BossDef } from '../../src/game/types';
import type { Entity } from '../../src/game/world';

function session(zone: number): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('b'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'BOSS-SEED');
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
function boss(s: GameSession): Entity {
  const b = s.w.get(s.w.bossId);
  if (!b) throw new Error('no boss');
  return b;
}
function bigHit(s: GameSession, b: Entity, amount: number): number {
  const spec = emptySpec('normal');
  spec.dmg.physical = amount;
  return hitEnemy(s.w, s.localPlayer, b, spec, b.x, b.y + 50);
}
/** A god-mode player in the boss room, past the name card. */
function fight(zone: number): { s: GameSession; b: Entity; p: Entity } {
  const s = session(zone);
  s.w.god = true;
  s.enterRoom(s.layout.bossId, 's');
  run(s, 1.7);
  return { s, b: boss(s), p: s.localPlayer! };
}
function attackOf(def: BossDef, phase: number, id: string): AttackDef {
  const a = def.phases[phase]!.attacks.find((x) => x.id === id);
  if (!a) throw new Error(`no attack ${id}`);
  return a;
}
/** Keep the boss from choosing attacks of its own (it still runs the one a test starts). */
function quiet(s: GameSession, b: Entity): void {
  for (const a of b.en!.phaseAttacks) b.en!.cooldowns[a.id] = s.w.time + 999;
  b.en!.attack = null;
}
function toPhase2(s: GameSession, b: Entity): void {
  bigHit(s, b, b.hp!.max * 10);
  run(s, PHASE_TRANSITION_S + 0.1);
}
function telegraphsOf(s: GameSession, b: Entity): Entity[] {
  return [...s.w.entities.values()].filter((e) => e.type === 'telegraph' && !e.removed && e.tg?.ownerId === b.id);
}

describe('bosses 6–7: data and arenas', () => {
  it('both are registered, valid (Red + Piercing each phase, ≥ 2 [AREA], 2 new phase-2 attacks, escapable)', () => {
    expect(BOSSES.saint_aurelia).toBe(SAINT_AURELIA);
    expect(BOSSES.archmagister_tock).toBe(ARCHMAGISTER_TOCK);
    expect(SAINT_AURELIA.zone).toBe(6);
    expect(ARCHMAGISTER_TOCK.zone).toBe(7);
    const issues: ValidationIssue[] = [];
    validateBoss(SAINT_AURELIA, issues);
    validateBoss(ARCHMAGISTER_TOCK, issues);
    expect(issues).toEqual([]);
    expect(validateTemplate(SAINT_AURELIA_ARENA, { arena: true })).toEqual([]);
    expect(validateTemplate(ARCHMAGISTER_TOCK_ARENA, { arena: true })).toEqual([]);
    expect(ENEMIES.ice_mirror?.special).toBe(true);
    expect(ENEMIES.clock_turret?.special).toBe(true);
  });
  it('no chained follow-up is both Red and Piercing, and each keeps its own kind', () => {
    const judgment = attackOf(SAINT_AURELIA, 1, 'aurelia_judgment');
    expect(judgment.kind).toBe('red');
    expect(judgment.chain?.kind).toBe('pierce');
    expect(judgment.chain?.pattern?.kind === 'expandingRing' && judgment.chain.pattern.gaps).toBe(4); // D114: 4 gaps plus one toward the centre
  });
});

describe('Saint Aurelia the Unthawed', () => {
  it('spawns in the reliquary nave (6 pillars) and is the zone 6 boss', () => {
    const { s, b } = fight(6);
    expect(b.en!.def.id).toBe('saint_aurelia');
    expect(s.roomPhase).toBe('boss');
    let pillars = 0;
    for (let y = 0; y < 22; y++) for (let x = 0; x < 40; x++) if (s.w.room.get(x, y) === T.Pillar) pillars++;
    expect(pillars).toBe(6 * 4);
  });
  it('fights a god-mode player for a minute in both phases, changing phase at exactly 50%', () => {
    const s = session(6);
    s.w.god = true;
    s.enterRoom(s.layout.bossId, 's');
    const b = boss(s);
    run(s, 20);
    expect(b.en!.phase).toBe(0);
    const max = b.hp!.max;
    bigHit(s, b, max * 10);
    expect(b.hp!.hp).toBe(max * 0.5);
    expect(b.en!.phase).toBe(1);
    expect(b.en!.phaseAttacks.some((a) => a.id === 'aurelia_judgment')).toBe(true);
    run(s, 40);
    expect(b.en!.phase).toBe(1);
    expect(b.hp!.dead).toBe(false);
  });
  it('phase 2 no longer scatters ice patches over the nave (D224: they did nothing)', () => {
    const { s, b } = fight(6);
    toPhase2(s, b);
    expect([...s.w.entities.values()].filter((e) => e.type === 'hazard' && e.hz?.hazard === 'ice')).toEqual([]);
  });
  it('Mirror of Faith raises three mirrors that send a player projectile back and take real hits to break (D222)', () => {
    const { s, b, p } = fight(6);
    quiet(s, b);
    startEnemyAttack(s.w, b, attackOf(SAINT_AURELIA, 0, 'aurelia_mirror_of_faith'), p);
    run(s, 1.7);
    const mirrors = s.w.enemies.filter((e) => e.en?.def.id === 'ice_mirror' && !e.hp?.dead);
    expect(mirrors.length).toBe(3);
    // D222: real enemies (they were 1 HP): a health bar's worth, two attacks of their own
    expect(mirrors.every((m) => m.hp!.max > 300)).toBe(true);
    // D222: ×1.2 on the hazard role in zone 6 (D224 gave the 40% to Aurelia, not to them)
    expect(mirrors[0]!.hp!.max).toBeCloseTo(80 * 1.2 * (1 + 0.55 * 5), 0);
    expect(SAINT_AURELIA.baseHp).toBe(5040);
    expect((mirrors[0]!.en!.def as { attacks: { id: string }[] }).attacks.map((a) => a.id)).toEqual(['mirror_glint', 'mirror_shatter']);
    expect(mirrors[0]!.en!.def.traits?.hideHpBar).toBeFalsy();
    const m = mirrors[0]!;
    const spec = emptySpec('player');
    spec.dmg.physical = 12;
    const pr = spawnPlayerProjectile(s.w, p, 0, 600, 6, spec, 0, 'p_knife');
    pr.x = m.x - 45;
    pr.y = m.y;
    pr.vx = 600;
    pr.vy = 0;
    run(s, 0.12);
    expect(pr.pr!.team).toBe(1);
    expect(pr.pr!.ownerId).toBe(m.id);
    expect(pr.vx).toBeLessThan(0);
    expect(m.hp!.dead).toBe(false);
    // a light cut no longer breaks it; enough damage does
    const cut = emptySpec('player');
    cut.dmg.physical = 5;
    m.hp!.invulnUntil = 0;
    hitEnemy(s.w, p, m, cut, m.x - 20, m.y);
    expect(m.hp!.dead).toBe(false);
    const big = emptySpec('player');
    big.dmg.physical = m.hp!.max * 3;
    m.hp!.invulnUntil = 0;
    hitEnemy(s.w, p, m, big, m.x - 20, m.y);
    expect(m.hp!.dead).toBe(true);
  });
  it('the mirrors fly round Aurelia on a ring and follow her when she moves (D224)', () => {
    const { s, b, p } = fight(6);
    quiet(s, b);
    startEnemyAttack(s.w, b, attackOf(SAINT_AURELIA, 0, 'aurelia_mirror_of_faith'), p);
    run(s, 1.7);
    quiet(s, b);
    const mirrors = (): Entity[] => s.w.enemies.filter((e) => e.en?.def.id === 'ice_mirror' && !e.hp?.dead);
    for (const m of mirrors()) m.en!.cooldowns = { mirror_glint: s.w.time + 99, mirror_shatter: s.w.time + 99 };
    // she stands mid-room (away from the walls that would cut the ring short), rooted
    b.x = 640;
    b.y = 380;
    b.en!.rootUntil = s.w.time + 99;
    p.x = 1100;
    p.y = 600;
    run(s, 3);
    const near = (): number[] => mirrors().map((m) => Math.hypot(m.x - b.x, m.y - b.y));
    for (const d of near()) expect(Math.abs(d - 150)).toBeLessThan(40);
    // spread round her, not bunched: every pair well apart
    const ms = mirrors();
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) expect(Math.hypot(ms[i]!.x - ms[j]!.x, ms[i]!.y - ms[j]!.y)).toBeGreaterThan(150);
    // she moves; they come with her
    b.x = 760;
    b.y = 420;
    run(s, 2);
    for (const d of near()) expect(Math.abs(d - 150)).toBeLessThan(45);
  });
  it('a mirror attacks: Shatter when you stand at it, Frost Glint from range (D222)', () => {
    const { s, b, p } = fight(6);
    quiet(s, b);
    startEnemyAttack(s.w, b, attackOf(SAINT_AURELIA, 0, 'aurelia_mirror_of_faith'), p);
    run(s, 1.7);
    const m = s.w.enemies.find((e) => e.en?.def.id === 'ice_mirror' && !e.hp?.dead)!;
    // keep the boss out of it
    b.x = 100;
    b.y = 100;
    b.en!.cooldowns = Object.fromEntries(b.en!.phaseAttacks.map((atk) => [atk.id, s.w.time + 60]));
    const seen = new Set<string>();
    p.x = m.x + 60;
    p.y = m.y;
    for (let i = 0; i < 6 * 60; i++) {
      if (m.en!.attack) seen.add(m.en!.attack.def.id);
      run(s, 1 / 60);
    }
    expect(seen.has('mirror_shatter')).toBe(true);
    p.x = m.x + 450;
    for (let i = 0; i < 8 * 60; i++) {
      if (m.en!.attack) seen.add(m.en!.attack.def.id);
      run(s, 1 / 60);
    }
    expect(seen.has('mirror_glint')).toBe(true);
  });
  it('Blessed Blade: three arcs reaching 190 px, every one parryable (D223; it was the third only)', () => {
    const { s, b, p } = fight(6);
    quiet(s, b);
    p.x = b.x + 90;
    p.y = b.y;
    const before = new Set(telegraphsOf(s, b).map((t) => t.id));
    startEnemyAttack(s.w, b, attackOf(SAINT_AURELIA, 0, 'aurelia_blessed_blade'), p);
    const seen = new Map<number, boolean>();
    for (let i = 0; i < 120; i++) {
      for (const t of telegraphsOf(s, b)) if (!before.has(t.id) && t.tg!.shapes[0]?.k === 'cone' && !seen.has(t.id)) seen.set(t.id, !!t.tg!.spec?.parryable);
      stepWorld(s.w);
    }
    expect([...seen.values()]).toEqual([true, true, true]);
    const atk = attackOf(SAINT_AURELIA, 0, 'aurelia_blessed_blade');
    expect(atk.pattern).toMatchObject({ kind: 'melee', shape: 'arc', r: 190 });
    expect(atk.range).toEqual([0, 190]);
  });
  it('Judgment dives through the target, then a Piercing Frost Nova with 5 gaps (one toward the centre) rings out where she lands', () => {
    const { s, b, p } = fight(6);
    toPhase2(s, b);
    quiet(s, b);
    p.x = b.x + 260;
    p.y = b.y;
    const x0 = b.x;
    startEnemyAttack(s.w, b, attackOf(SAINT_AURELIA, 1, 'aurelia_judgment'), p);
    expect(b.anim.tint).toBe('red');
    let nova: Entity | undefined;
    let landedX = 0;
    for (let i = 0; i < 240 && !nova; i++) {
      stepWorld(s.w);
      if (b.en!.attack?.def.id === 'aurelia_frost_nova') {
        landedX = b.x;
        nova = telegraphsOf(s, b).find((t) => t.tg!.shapes[0]?.k === 'expRing');
      }
    }
    expect(nova).toBeDefined();
    const ring = nova!.tg!.shapes[0] as Extract<Shape, { k: 'expRing' }>;
    expect(nova!.tg!.kind).toBe('pierce');
    expect(ring.gaps.length).toBe(5); // D114: 4 + the centre gap
    expect(ring.gapW).toBeGreaterThanOrEqual(90);
    // she went through the target (past where it stood) before the nova
    expect(landedX).toBeGreaterThan(x0 + 260);
    expect(Math.abs(ring.x - landedX)).toBeLessThan(2);
    expect(b.anim.tint).toBe('blue');
  });
  it('Avalanche: boulders roll down 4 horizontal lanes after the telegraph, alternating ends', () => {
    const av = attackOf(SAINT_AURELIA, 1, 'aurelia_avalanche');
    const specs = resolvePattern(av.pattern!, { ox: 640, oy: 368, facing: 0, tx: 640, ty: 368, players: [], rng: new Rng('av'), room: null, telegraphS: 1.2 });
    const lanes = specs.flatMap((sp) => sp.shapes).filter((sh): sh is Extract<Shape, { k: 'roll' }> => sh.k === 'roll');
    expect(lanes.length).toBe(4);
    expect(specs[0]!.mode).toBe('once');
    const east = lanes[0]!;
    const west = lanes[1]!;
    expect(Math.cos(east.a)).toBeCloseTo(1);
    expect(Math.cos(west.a)).toBeCloseTo(-1);
    // someone standing mid-lane is safe until the boulder arrives, hit when it passes, safe after
    const midT = (640 - east.x) / east.speed;
    expect(shapeHit(east, 0, 640, east.y, 14, null)).toBe(false);
    expect(shapeHit(east, midT, 640, east.y, 14, null)).toBe(true);
    expect(shapeHit(east, midT + 0.6, 640, east.y, 14, null)).toBe(false);
    // and stepping half a lane sideways is always safe
    expect(shapeHit(east, midT, 640, east.y + east.w / 2 + 14, 14, null)).toBe(false);
  });
});

describe('Archmagister Tock', () => {
  it('spawns on his floating gear above the floor ring; four invulnerable turrets rise in the corners', () => {
    const { s, b } = fight(7);
    expect(b.en!.def.id).toBe('archmagister_tock');
    expect(b.flying).toBe(true);
    expect(s.w.room.rotFloor).not.toBeNull();
    run(s, 1.2);
    const turrets = s.w.enemies.filter((e) => e.en?.def.id === 'clock_turret' && !e.hp?.dead);
    expect(turrets.length).toBe(4);
    for (const [cx, cy] of ROOM_CORNERS) expect(turrets.some((t) => Math.hypot(t.x - cx, t.y - cy) < 8)).toBe(true);
    const t = turrets[0]!;
    const hp = t.hp!.hp;
    expect(bigHit(s, t, 500)).toBe(0);
    expect(t.hp!.hp).toBe(hp);
  });
  it('fights a god-mode player for a minute in both phases, changing phase at exactly 50%', () => {
    const s = session(7);
    s.w.god = true;
    s.enterRoom(s.layout.bossId, 's');
    const b = boss(s);
    run(s, 20);
    expect(b.en!.phase).toBe(0);
    const max = b.hp!.max;
    bigHit(s, b, max * 10);
    expect(b.hp!.hp).toBe(max * 0.5);
    expect(b.en!.phase).toBe(1);
    expect(b.en!.phaseAttacks.some((a) => a.id === 'tock_rewind_volley')).toBe(true);
    run(s, 40);
    expect(b.en!.phase).toBe(1);
    expect(b.hp!.dead).toBe(false);
  });
  it('the floor ring carries a player standing on it at ~40 px/s, and runs the other way in phase 2', () => {
    const { s, b, p } = fight(7);
    const rf = s.w.room.rotFloor!;
    const ride = (): number => {
      quiet(s, b);
      b.en!.stunUntil = s.w.time + 60;
      p.x = rf.x + 170;
      p.y = rf.y;
      const a0 = Math.atan2(p.y - rf.y, p.x - rf.x);
      const x0 = p.x;
      const y0 = p.y;
      run(s, 1);
      expect(Math.hypot(p.x - x0, p.y - y0)).toBeGreaterThan(32);
      expect(Math.hypot(p.x - x0, p.y - y0)).toBeLessThan(48);
      return Math.atan2(p.y - rf.y, p.x - rf.x) - a0;
    };
    expect(ride()).toBeGreaterThan(0);
    // off the ring nothing moves
    p.x = rf.x;
    p.y = rf.y - 280;
    const x1 = p.x;
    run(s, 0.5);
    expect(p.x).toBeCloseTo(x1, 3);
    b.en!.stunUntil = 0;
    toPhase2(s, b);
    expect(rf.speed).toBeLessThan(0);
    expect(ride()).toBeLessThan(0);
  });
  it('Rewind Volley strikes where the player was 1.0 s earlier, three times 0.7 s apart', () => {
    const { s, b, p } = fight(7);
    toPhase2(s, b);
    quiet(s, b);
    // walk the player along the top of the room (off the floor ring) for 1.5 s
    const track: { t: number; x: number; y: number }[] = [];
    for (let i = 0; i < 90; i++) {
      p.x = 300 + i * 4;
      p.y = 110;
      stepWorld(s.w);
      track.push({ t: s.w.time, x: p.x, y: p.y });
    }
    const t0 = s.w.time;
    const then = track.reduce((best, q) => (Math.abs(q.t - (t0 - 1)) < Math.abs(best.t - (t0 - 1)) ? q : best));
    startEnemyAttack(s.w, b, attackOf(ARCHMAGISTER_TOCK, 1, 'tock_rewind_volley'), p);
    const first = b.en!.attack!.teleIds.map((id) => s.w.get(id)!).filter(Boolean);
    const circles = first.flatMap((t) => t.tg!.shapes).filter((sh): sh is Extract<Shape, { k: 'circle' }> => sh.k === 'circle');
    expect(first[0]!.tg!.kind).toBe('pierce');
    expect(circles.length).toBeGreaterThanOrEqual(6);
    expect(circles.every((c) => c.r === 90)).toBe(true);
    // one strike lands on the spot from 1.0 s ago; none sits on the player now
    expect(Math.min(...circles.map((c) => Math.hypot(c.x - then.x, c.y - then.y)))).toBeLessThan(30);
    expect(Math.min(...circles.map((c) => Math.hypot(c.x - p.x, c.y - p.y)))).toBeGreaterThan(40);
    // the volley repeats twice more, re-read from the history each time
    const impacts = new Map<number, number>();
    for (let i = 0; i < 180; i++) {
      for (const t of telegraphsOf(s, b)) {
        const sh = t.tg!.shapes[0];
        if (sh?.k === 'circle' && sh.r === 90 && t.tg!.kind === 'pierce') impacts.set(t.id, t.tg!.impact);
      }
      stepWorld(s.w);
    }
    const times = [...impacts.values()].sort((x, y) => x - y);
    expect(times.length).toBe(3);
    expect(times[0]).toBeCloseTo(t0 + 0.9, 1);
    expect(times[1]! - times[0]!).toBeCloseTo(0.7, 1);
    expect(times[2]! - times[1]!).toBeCloseTo(0.7, 1);
  });
  it('Laser Sweep: one corner turret in phase 1, two opposite corners turning opposite ways in phase 2', () => {
    const { s, b, p } = fight(7);
    quiet(s, b);
    startEnemyAttack(s.w, b, attackOf(ARCHMAGISTER_TOCK, 0, 'tock_laser_sweep'), p);
    const one = b.en!.attack!.teleIds.map((id) => s.w.get(id)!.tg!.shapes[0]!) as Extract<Shape, { k: 'sweep' }>[];
    expect(one.length).toBe(1);
    expect(ROOM_CORNERS.some(([cx, cy]) => cx === one[0]!.x && cy === one[0]!.y)).toBe(true);
    // it starts on the target
    expect(Math.abs(Math.atan2(p.y - one[0]!.y, p.x - one[0]!.x) - one[0]!.a0)).toBeLessThan(1e-6);
    run(s, 4.5);
    toPhase2(s, b);
    quiet(s, b);
    startEnemyAttack(s.w, b, attackOf(ARCHMAGISTER_TOCK, 1, 'tock_laser_sweep'), p);
    const two = b.en!.attack!.teleIds.map((id) => s.w.get(id)!.tg!.shapes[0]!) as Extract<Shape, { k: 'sweep' }>[];
    expect(two.length).toBe(2);
    expect(Math.sign(two[0]!.arc)).toBe(-Math.sign(two[1]!.arc));
    // diagonally opposite corners
    expect(Math.abs(two[0]!.x - two[1]!.x)).toBeGreaterThan(1000);
    expect(Math.abs(two[0]!.y - two[1]!.y)).toBeGreaterThan(500);
  });
  it('Overclock: four Red Gear Dashes in a row, each re-aimed', () => {
    const { s, b, p } = fight(7);
    toPhase2(s, b);
    quiet(s, b);
    p.x = b.x + 250;
    p.y = b.y;
    startEnemyAttack(s.w, b, attackOf(ARCHMAGISTER_TOCK, 1, 'tock_overclock'), p);
    const ids: string[] = [];
    for (let i = 0; i < 600; i++) {
      const a = b.en!.attack;
      if (a && ids[ids.length - 1] !== a.def.id) {
        ids.push(a.def.id);
        expect(a.def.kind).toBe('red');
        expect(b.anim.tint).toBe('red');
      }
      stepWorld(s.w);
    }
    expect(ids.slice(0, 4)).toEqual(['tock_overclock', 'tock_overclock_2', 'tock_overclock_3', 'tock_overclock_4']);
  });
  it('Tin Reinforcements march in from the walls', () => {
    const { s, b, p } = fight(7);
    quiet(s, b);
    startEnemyAttack(s.w, b, attackOf(ARCHMAGISTER_TOCK, 0, 'tock_tin_reinforcements'), p);
    run(s, 1.1);
    const tins = s.w.enemies.filter((e) => e.en?.def.id === 'tin_soldier' && !e.hp?.dead);
    expect(tins.length).toBe(4);
    for (const t of tins) expect(Math.min(t.x - 32, 1248 - t.x, t.y - 48, 688 - t.y)).toBeLessThan(110);
  });
});

describe('Aurelia arena (D224)', () => {
  it('has no ice patches: every floor tile is plain', async () => {
    const { SAINT_AURELIA_ARENA } = await import('../../src/data/bosses/reliquary');
    expect(SAINT_AURELIA_ARENA.rows.join('')).not.toContain('~');
  });
});
