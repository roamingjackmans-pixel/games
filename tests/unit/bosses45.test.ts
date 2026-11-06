import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { BOSS_ARENAS } from '../../src/data/rooms/bosses';
import { ENEMIES } from '../../src/data/enemies';
import { validateBoss, type ValidationIssue } from '../../src/data/validate';
import { validateTemplate } from '../../src/game/procgen/templates';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitEnemy, rawDamage } from '../../src/game/combat/damage';
import { PHASE_TRANSITION_S } from '../../src/game/combat/bossPhase';
import { shapeHit } from '../../src/game/combat/patterns';
import { startEnemyAttack } from '../../src/game/enemies/attacks';
import { ROOM_W, T } from '../../src/game/room';
import { hasDraw } from '../../src/engine/draw/registry';
import '../../src/engine/draw/bosses';
import type { AttackRun, Entity } from '../../src/game/world';

function session(zone: number): GameSession {
  const ch = newCharacter('knight', 'Joe', 'p1', new Rng('b45'));
  ch.tutorialDone = true;
  const save = newSave(1, ch, 'BOSS45-SEED');
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  return s;
}
function run(s: GameSession, sec: number): void {
  for (let i = 0; i < Math.round(sec * 60); i++) stepWorld(s.w);
}
/** Run and collect the ids of every attack any enemy (boss, second body, summons) starts. */
function watch(s: GameSession, sec: number): Set<string> {
  const seen = new Set<string>();
  for (let i = 0; i < Math.round(sec * 60); i++) {
    stepWorld(s.w);
    for (const e of s.w.enemies) if (e.en?.attack) seen.add(e.en.attack.def.id);
  }
  return seen;
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
function place(e: Entity, x: number, y: number): void {
  e.x = e.px = x;
  e.y = e.py = y;
}
function fight(zone: number): { s: GameSession; b: Entity } {
  const s = session(zone);
  s.w.god = true;
  s.enterRoom(s.layout.bossId, 's');
  run(s, 1.6); // past the name card
  return { s, b: boss(s) };
}
/** Let the current attack play out, but no follow-ups and no walking (isolates one mechanic). */
function hold(s: GameSession, b: Entity): void {
  for (const a of b.en!.phaseAttacks) if (a.id !== b.en!.attack?.def.id) b.en!.cooldowns[a.id] = s.w.time + 999;
  b.en!.rootUntil = s.w.time + 999;
}
/** The attack in progress (read through a function so a test's own `attack = null` does not narrow it). */
function current(b: Entity): AttackRun | null {
  return b.en!.attack;
}
function attackOf(b: Entity, id: string) {
  const a = b.en!.phaseAttacks.find((x) => x.id === id);
  if (!a) throw new Error(`no attack ${id}`);
  return a;
}

describe('bosses 4–5: data', () => {
  it('Vexthorn and Foreman Ignatius are registered, valid, and drawn', () => {
    const issues: ValidationIssue[] = [];
    for (const id of ['vexthorn', 'foreman_ignatius']) {
      const b = BOSSES[id];
      expect(b, id).toBeDefined();
      validateBoss(b!, issues);
      expect(hasDraw(b!.draw), b!.draw).toBe(true);
    }
    expect(issues).toEqual([]);
    expect(BOSSES.vexthorn!.zone).toBe(4);
    expect(BOSSES.foreman_ignatius!.zone).toBe(5);
    for (const id of ['forest_arena', 'forge_arena']) expect(validateTemplate(BOSS_ARENAS[id]!, { arena: true }), id).toEqual([]);
    for (const id of ['fey_light', 'ignatius_on_foot']) {
      expect(ENEMIES[id]?.special, id).toBe(true);
      expect(hasDraw(ENEMIES[id]!.draw), id).toBe(true);
    }
  });
});

describe('Vexthorn, the Hollow Stag', () => {
  it('spawns in the clearing with five breakable trees', () => {
    const { s, b } = fight(4);
    expect(b.en!.def.id).toBe('vexthorn');
    expect(s.roomPhase).toBe('boss');
    // five 2×2 trees
    expect(s.w.room.trees.size).toBe(20);
  });

  it('fights a god-mode player for a minute in both phases; phase 2 starts at exactly 50% and grows thorn walls', () => {
    const { s, b } = fight(4);
    const max = b.hp!.max;
    const p1 = watch(s, 20);
    expect(b.en!.phase).toBe(0);
    expect(p1.size, [...p1].join()).toBeGreaterThanOrEqual(3);
    bigHit(s, b, max * 10);
    expect(b.hp!.hp).toBe(max * 0.5);
    expect(b.en!.phase).toBe(1);
    expect(b.en!.phaseAttacks.some((a) => a.id === 'vex_triple_charge')).toBe(true);
    const p2 = watch(s, 40);
    expect(b.en!.phase).toBe(1);
    expect(b.hp!.dead).toBe(false);
    expect(p2.size, [...p2].join()).toBeGreaterThanOrEqual(4);
    expect([...s.w.entities.values()].some((e) => e.type === 'hazard' && e.hz?.hazard === 'thorns' && e.hz.shapes.length === 4)).toBe(true);
  });

  it('a charge into a tree breaks the tree and staggers him for 2 s', () => {
    const { s, b } = fight(4);
    const w = s.w;
    const p = s.localPlayer!;
    // the south tree: tiles (19..20, 14..15), centre (640, 496)
    const tiles = [
      [19, 14],
      [20, 14],
      [19, 15],
      [20, 15],
    ] as const;
    for (const [x, y] of tiles) expect(w.room.trees.has(y * ROOM_W + x)).toBe(true);
    for (const e of w.enemies) if (e !== b) e.hp!.dead = true;
    b.en!.attack = null;
    place(b, 640, 276);
    place(p, 640, 660);
    startEnemyAttack(w, b, attackOf(b, 'vex_charge'), p);
    let staggered = false;
    for (let i = 0; i < 240 && !staggered; i++) {
      stepWorld(w);
      staggered = b.en!.stunUntil > w.time;
    }
    expect(staggered).toBe(true);
    expect(b.en!.stunUntil - w.time).toBeGreaterThan(1.9);
    expect(b.hp!.staggerUntil).toBeGreaterThan(w.time + 1.9);
    for (const [x, y] of tiles) {
      expect(w.room.get(x, y)).toBe(T.Floor);
      expect(w.room.trees.has(y * ROOM_W + x)).toBe(false);
    }
    // only that tree went
    expect(w.room.trees.size).toBe(16);
    // he stopped at the tree, short of the player
    expect(b.y).toBeLessThan(470);
    run(s, 0.5);
    expect(b.en!.state).toBe('stagger');
  });

  it('a charge into a wall does not stagger him; Triple Charge charges three times, re-aimed', () => {
    const { s, b } = fight(4);
    const w = s.w;
    const p = s.localPlayer!;
    // clear the trees out of the way
    for (const idx of [...w.room.trees.keys()]) w.room.set(idx % ROOM_W, Math.floor(idx / ROOM_W), T.Floor);
    w.room.trees.clear();
    for (const e of w.enemies) if (e !== b) e.hp!.dead = true;
    b.en!.attack = null;
    place(b, 300, 368);
    place(p, 900, 368);
    startEnemyAttack(w, b, attackOf(b, 'vex_charge'), p);
    run(s, 3);
    expect(b.en!.stunUntil).toBeLessThan(w.time);
    // phase 2: the triple charge
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 0.1);
    b.en!.attack = null;
    place(b, 300, 250);
    place(p, 900, 500);
    const tc = attackOf(b, 'vex_triple_charge');
    startEnemyAttack(w, b, tc, p);
    const angles: number[] = [];
    let maxDone = 0;
    let lastPause = 0;
    for (let i = 0; i < 60 * 10 && current(b)?.def.id === tc.id; i++) {
      stepWorld(w);
      const a = current(b);
      if (!a || a.def.id !== tc.id) break;
      maxDone = Math.max(maxDone, a.chargesDone ?? 0);
      if ((a.pauseUntil ?? 0) > lastPause) {
        lastPause = a.pauseUntil!;
        // re-aimed straight at the player
        expect(Math.abs(Math.atan2(p.y - b.y, p.x - b.x) - a.angle)).toBeLessThan(0.01);
        angles.push(a.angle);
        // keep the player moving so each re-aim differs
        place(p, p.x < 640 ? 1000 : 250, p.y < 368 ? 560 : 180);
      }
    }
    expect(maxDone).toBe(2);
    expect(angles.length).toBe(2);
    expect(current(b)?.def.id === tc.id).toBe(false);
  });

  it('Hex Gale leaves a wind that pushes the player away', () => {
    const { s, b } = fight(4);
    const w = s.w;
    const p = s.localPlayer!;
    for (const e of w.enemies) if (e !== b) e.hp!.dead = true;
    b.en!.attack = null;
    // a column with no trees in it
    place(b, 400, 200);
    place(p, 400, 380);
    startEnemyAttack(w, b, attackOf(b, 'vex_hex_gale'), p);
    hold(s, b);
    run(s, 0.95);
    expect([...w.entities.values()].some((e) => e.type === 'hazard' && e.hz?.hazard === 'wind')).toBe(true);
    const y0 = p.y;
    run(s, 1.0);
    expect(p.y - y0).toBeGreaterThan(100);
  });

  it('Fey Lights drift in and pop', () => {
    const { s, b } = fight(4);
    const w = s.w;
    const p = s.localPlayer!;
    b.en!.attack = null;
    startEnemyAttack(w, b, attackOf(b, 'vex_fey_lights'), p);
    hold(s, b);
    run(s, 1.5);
    const lights = w.enemies.filter((e) => e.en?.def.id === 'fey_light' && !e.hp?.dead);
    expect(lights.length).toBe(3);
    run(s, 20);
    expect(w.enemies.filter((e) => e.en?.def.id === 'fey_light' && !e.hp?.dead).length).toBe(0);
  });
});

describe('Foreman Ignatius', () => {
  it('spawns on the forge floor; the lava channel is live once the fight starts', () => {
    const { s, b } = fight(5);
    expect(b.en!.def.id).toBe('foreman_ignatius');
    const lava = [...s.w.entities.values()].filter((e) => e.type === 'hazard' && e.hz?.hazard === 'lava');
    expect(lava.length).toBe(1);
    // a player standing in the channel is inside it; one on a bridge is not
    const inLava = (x: number, y: number): boolean => lava[0]!.hz!.shapes.some((sh) => shapeHit(sh, 0, x, y, 6, s.w.room));
    expect(inLava(5 * 32 + 16, 16 + 14 * 32 + 16)).toBe(true);
    expect(inLava(9 * 32 + 16, 16 + 14 * 32 + 16)).toBe(false);
  });

  it('fights a god-mode player for a minute in both phases; the killing blow splits them and refills the bar (D253)', () => {
    const { s, b } = fight(5);
    const max = b.hp!.max;
    const p1 = watch(s, 20);
    expect(b.en!.phase).toBe(0);
    expect(p1.size, [...p1].join()).toBeGreaterThanOrEqual(3);
    bigHit(s, b, max * 10);
    expect(b.hp!.dead).toBe(false);
    expect(b.hp!.hp).toBe(max);
    expect(b.en!.phase).toBe(1);
    const p2 = watch(s, 40);
    expect(b.en!.phase).toBe(1);
    expect(b.hp!.dead).toBe(false);
    const foot = s.w.enemies.filter((e) => e.en?.def.id === 'ignatius_on_foot' && !e.hp?.dead);
    expect(foot.length).toBe(1);
    // both bodies fight: Golem attacks and Ignatius-on-foot attacks both show up
    expect([...p2].some((id) => ['ign_golem_slam', 'ign_forge_strike', 'ign_stoke', 'ign_molten_shockwave'].includes(id)), [...p2].join()).toBe(true);
    expect([...p2].some((id) => ['ign_hammer_throw', 'ign_flame_pillars', 'ign_immolation'].includes(id)), [...p2].join()).toBe(true);
    // the channel widened and the west bridge went under; the east bridge stayed
    expect(s.w.room.get(5, 12)).toBe(T.Hazard);
    expect(s.w.room.get(9, 14)).toBe(T.Hazard);
    expect(s.w.room.get(30, 14)).toBe(T.Floor);
    expect(s.w.room.get(30, 12)).toBe(T.Floor);
  });

  it('two targets, one bar: hitting either body lowers the one pool, and the kill removes both', () => {
    const { s, b } = fight(5);
    const w = s.w;
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 0.2);
    const foot = w.enemies.find((e) => e.en?.def.id === 'ignatius_on_foot');
    expect(foot).toBeDefined();
    expect(foot!.en!.linkedTo).toBe(b.id);
    expect(b.en!.linkedTo).toBe(foot!.id);
    // the second body does not have its own bar
    const own = foot!.hp!.hp;
    const before = b.hp!.hp;
    const dealt = bigHit(s, foot!, 100);
    expect(dealt).toBeGreaterThan(0);
    expect(b.hp!.hp).toBeCloseTo(before - dealt, 5);
    expect(foot!.hp!.hp).toBe(own);
    const before2 = b.hp!.hp;
    const dealt2 = bigHit(s, b, 100);
    expect(dealt2).toBeGreaterThan(0);
    expect(b.hp!.hp).toBeCloseTo(before2 - dealt2, 5);
    // status damage on the second body (burn, bleed) lands on the bar too
    rawDamage(w, foot!, 40, 'physical', s.localPlayer!.id);
    expect(b.hp!.hp).toBeCloseTo(before2 - dealt2 - 40, 5);
    // finishing the bar through the second body kills the boss and removes both bodies
    bigHit(s, foot!, b.hp!.max * 10);
    expect(b.hp!.dead).toBe(true);
    run(s, 0.1);
    expect(w.enemies.some((e) => !e.hp?.dead && (e.en?.def.id === 'ignatius_on_foot' || e.en?.isBoss))).toBe(false);
    expect(s.save.world.bossesBeatenThisCycle).toContain(5);
    // the lava goes out with him
    expect([...w.entities.values()].some((e) => e.type === 'hazard' && e.hz?.hazard === 'lava')).toBe(false);
  });

  it('killing the Golem removes Ignatius on foot too', () => {
    const { s, b } = fight(5);
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 0.2);
    expect(s.w.enemies.some((e) => e.en?.def.id === 'ignatius_on_foot' && !e.hp?.dead)).toBe(true);
    bigHit(s, b, b.hp!.max * 10);
    expect(b.hp!.dead).toBe(true);
    run(s, 0.1);
    expect(s.w.enemies.some((e) => e.en?.def.id === 'ignatius_on_foot' && !e.hp?.dead)).toBe(false);
  });

  it('Immolation leaves a safe pocket of 140 px around Ignatius on foot; the Golem never casts it', () => {
    const { s, b } = fight(5);
    const w = s.w;
    const p = s.localPlayer!;
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 1.2);
    const foot = w.enemies.find((e) => e.en?.def.id === 'ignatius_on_foot')!;
    expect(foot.en!.phaseAttacks.map((a) => a.id).sort()).toEqual(['ign_flame_pillars', 'ign_hammer_throw', 'ign_immolation']);
    foot.en!.attack = null;
    place(foot, 640, 300);
    place(p, 800, 300);
    startEnemyAttack(w, foot, attackOf(foot, 'ign_immolation'), p);
    const tele = w.get(foot.en!.attack!.teleIds[0]!)!;
    const pocket = tele.tg!.shapes[0]!;
    expect(pocket.k).toBe('pockets');
    expect(shapeHit(pocket, 0, 640 + 100, 300, 12, w.room)).toBe(false);
    expect(shapeHit(pocket, 0, 640 + 260, 300, 12, w.room)).toBe(true);
    // the boss body never picks the split body's attacks
    b.en!.cooldowns = {};
    for (let i = 0; i < 600; i++) {
      stepWorld(w);
      const a = b.en!.attack;
      if (a) expect(a.def.body).toBeUndefined();
    }
  });
});

describe('Foreman Ignatius phase 2 (D253)', () => {
  it('Ignatius on foot teleports away when hit, and the Golem has Forge Draw, a room-wide pull', () => {
    const { s, b } = fight(5);
    bigHit(s, b, b.hp!.max * 10);
    run(s, PHASE_TRANSITION_S + 0.2);
    const foot = s.w.enemies.find((e) => e.en?.def.id === 'ignatius_on_foot')!;
    const [x0, y0] = [foot.x, foot.y];
    bigHit(s, foot, 10);
    run(s, 0.1);
    expect(Math.hypot(foot.x - x0, foot.y - y0)).toBeGreaterThan(150);
    const draw = b.en!.phaseAttacks.find((a) => a.id === 'ign_forge_draw');
    expect(draw).toBeDefined();
    expect(JSON.stringify(draw!.effects)).toContain('"op":"pull"');
    // a player across the forge ends up at the Golem's feet
    const p = s.localPlayer!;
    s.w.god = true;
    place(p, 1180, 100);
    place(b, 640, 520);
    const d0 = Math.hypot(p.x - b.x, p.y - b.y);
    startEnemyAttack(s.w, b, draw!, p);
    run(s, 2.4);
    expect(Math.hypot(p.x - b.x, p.y - b.y)).toBeLessThan(d0 * 0.4);
  });
});
