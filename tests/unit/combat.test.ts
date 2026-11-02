import { describe, expect, it } from 'vitest';
import {
  flaskHeal,
  levelCost,
  maxHP,
  maxStamina,
  scalingCurve,
  weaponDamage,
  dodgeRecharge,
  reviveRequirement,
  flaskMaxFor,
  gemUpgradeCost,
  enemyHpMult,
} from '../../src/game/combat/formulas';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { stepWorld } from '../../src/game/sim';
import { emptySpec, hitPlayer, applyStatusBuild } from '../../src/game/combat/damage';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { TRAINING_DUMMY } from '../../src/data/enemies/special';
import { shapeHit, resolvePattern, checkEscapable, type PatternCtx } from '../../src/game/combat/patterns';
import { Rng } from '../../src/engine/rng';
import { itemRequirements, meetsRequirements } from '../../src/game/items/bases';
import { makeItem } from '../../src/game/items/make';

function setup(classId: 'knight' | 'brute' | 'duelist' = 'knight'): { w: World; p: Entity; d: Entity } {
  const w = new World('TEST', Room.empty());
  const p = spawnPlayer(w, newCharacter(classId, 'Joe', 'p1', new Rng(1)), 0, true, 600, 368);
  const d = spawnEnemy(w, TRAINING_DUMMY, 700, 368, { tellS: 0 });
  return { w, p, d };
}
function run(w: World, seconds: number): void {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) stepWorld(w);
}
function press(p: Entity, action: keyof typeof ACTION_BIT, holdOthers = 0): void {
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368, buttons: ACTION_BIT[action] | holdOthers, pressed: ACTION_BIT[action] };
}
function hold(p: Entity, bits: number): void {
  p.pl!.input = { ...emptyInput(), aimX: 700, aimY: 368, buttons: bits, pressed: 0 };
}

describe('formulas (GAME_DESIGN §3)', () => {
  it('HP and stamina curves', () => {
    expect(maxHP(0)).toBe(100);
    expect(maxHP(10)).toBe(240);
    expect(maxHP(30)).toBe(520);
    expect(maxHP(40)).toBe(600);
    expect(maxHP(99)).toBe(100 + 30 * 14 + 30 * 8 + 39 * 3);
    expect(maxStamina(10)).toBe(105);
  });
  it('scaling curve values', () => {
    expect(scalingCurve(10)).toBeCloseTo(0.166, 2);
    expect(scalingCurve(40)).toBeCloseTo(0.517, 2);
    expect(scalingCurve(99)).toBeCloseTo(0.834, 2);
  });
  it('weapon damage and the 40% requirement penalty', () => {
    const full = weaponDamage(62, 1, { bonk: 'S', slicey: '-' }, { bonk: 14, slicey: 5 }, false, 1);
    const low = weaponDamage(62, 1, { bonk: 'S', slicey: '-' }, { bonk: 14, slicey: 5 }, false, 1, 1, false);
    expect(low / full).toBeCloseTo(0.4);
    // two-handing counts Bonk ×1.5
    const two = weaponDamage(62, 1, { bonk: 'S', slicey: '-' }, { bonk: 14, slicey: 5 }, true, 1);
    expect(two).toBeGreaterThan(full);
  });
  it('level cost curve matches the documented points', () => {
    expect(levelCost(1)).toBe(77);
    expect(levelCost(10)).toBe(243);
    expect(levelCost(30)).toBe(674);
    expect(levelCost(50)).toBe(1291); // floor; the doc rounded to 1292
    expect(levelCost(80)).toBe(3229); // floor; the doc rounded to 3228
  });
  it('flask, dodge floor, revive requirement, flask max, gem costs, enemy scaling', () => {
    expect(flaskHeal(500, 0)).toBe(200);
    expect(dodgeRecharge(0)).toBe(5);
    expect(dodgeRecharge(5)).toBe(3);
    expect([1, 2, 3, 4].map(reviveRequirement)).toEqual([10, 20, 40, 40]);
    expect(flaskMaxFor(0, false)).toBe(1);
    expect(flaskMaxFor(8, false)).toBe(5);
    expect(flaskMaxFor(8, true)).toBe(5);
    expect(flaskMaxFor(2, true)).toBe(3);
    expect([1, 2, 3, 4].map(gemUpgradeCost)).toEqual([400, 1200, 3600, 10800]);
    expect(enemyHpMult(1, 0, 2)).toBeCloseTo(2.5);
    expect(enemyHpMult(1, 0, 4)).toBeCloseTo(5.5);
  });
  it('requirements rise on the primary stat and two-handing counts ×1.5', () => {
    const gh = makeItem('greathammer', 'common', 3);
    const r = itemRequirements(gh);
    expect(r.bonk).toBe(18);
    expect(meetsRequirements(r, { bonk: 12, slicey: 0, brain: 0, prayer: 0 }, false)).toBe(false);
    expect(meetsRequirements(r, { bonk: 12, slicey: 0, brain: 0, prayer: 0 }, true)).toBe(true);
  });
});

describe('dodge, Red and Piercing (GAME_DESIGN §5.3–5.6)', () => {
  it('dodge i-frames avoid normal and Red attacks but not Piercing', () => {
    const { w, p } = setup();
    press(p, 'dodge');
    stepWorld(w);
    hold(p, 0);
    run(w, 0.1); // inside the 0.05–0.40 s window
    const hp0 = p.hp!.hp;
    const red = emptySpec('red');
    red.dmg.physical = 30;
    expect(hitPlayer(w, 0, p, red, p.x + 50, p.y)).toBe('dodged');
    const normal = emptySpec('normal');
    normal.dmg.physical = 30;
    expect(hitPlayer(w, 0, p, normal, p.x + 50, p.y)).toBe('dodged');
    const pierce = emptySpec('pierce');
    pierce.dmg.physical = 30;
    expect(hitPlayer(w, 0, p, pierce, p.x + 50, p.y)).toBe('hit');
    expect(p.hp!.hp).toBeLessThan(hp0);
  });
  it('dodge has one charge and a 5 s recharge', () => {
    const { w, p } = setup();
    press(p, 'dodge');
    stepWorld(w);
    hold(p, 0);
    run(w, 1);
    expect(p.pl!.state).toBe('idle');
    const ready = p.pl!.dodgeReadyAt;
    press(p, 'dodge');
    stepWorld(w);
    expect(p.pl!.state).toBe('idle'); // no second dodge
    expect(ready - (w.time - 1 - 1 / 60)).toBeCloseTo(5, 0);
  });
  it('blocking reduces normal hits; Red attacks guard-break and deal full damage', () => {
    const { w, p } = setup();
    hold(p, ACTION_BIT.block);
    stepWorld(w);
    expect(p.pl!.blocking).toBe(true);
    const normal = emptySpec('normal');
    normal.dmg.physical = 40;
    normal.parryable = false;
    const hp0 = p.hp!.hp;
    expect(hitPlayer(w, 0, p, normal, p.x + 50, p.y)).toBe('blocked');
    const blockedLoss = hp0 - p.hp!.hp;
    expect(blockedLoss).toBeLessThan(40 * 0.2);
    const hp1 = p.hp!.hp;
    const red = emptySpec('red');
    red.dmg.physical = 40;
    hitPlayer(w, 0, p, red, p.x + 50, p.y);
    expect(hp1 - p.hp!.hp).toBeGreaterThan(30); // full damage through armor
    expect(p.pl!.guardBrokenUntil).toBeGreaterThan(w.time);
  });
  it('Piercing attacks can be blocked at normal values but not parried', () => {
    const { w, p } = setup();
    press(p, 'block');
    stepWorld(w);
    hold(p, ACTION_BIT.block);
    expect(p.pl!.parryUntil).toBeGreaterThan(w.time);
    const pierce = emptySpec('pierce');
    pierce.dmg.physical = 40;
    expect(hitPlayer(w, 0, p, pierce, p.x + 50, p.y)).toBe('blocked');
  });
  it('parry window: a parryable normal attack inside it is parried and staggers the attacker', () => {
    const { w, p, d } = setup();
    press(p, 'block');
    stepWorld(w);
    const normal = emptySpec('normal');
    normal.dmg.physical = 40;
    expect(hitPlayer(w, d.id, p, normal, d.x, d.y)).toBe('parried');
    expect(d.hp!.riposteUntil).toBeGreaterThan(w.time);
    expect(p.pl!.riposteBuffUntil).toBeGreaterThan(w.time);
  });
  it('parry window closes after the shield window (kite 0.12 s)', () => {
    const { w, p, d } = setup();
    press(p, 'block');
    stepWorld(w);
    hold(p, ACTION_BIT.block);
    run(w, 0.2);
    const normal = emptySpec('normal');
    normal.dmg.physical = 40;
    expect(hitPlayer(w, d.id, p, normal, d.x, d.y)).toBe('blocked');
  });
  it('guard break when stamina runs out while blocking', () => {
    const { w, p } = setup();
    hold(p, ACTION_BIT.block);
    stepWorld(w);
    p.stam!.cur = 1;
    const normal = emptySpec('normal');
    normal.dmg.physical = 200;
    normal.parryable = false;
    hitPlayer(w, 0, p, normal, p.x + 50, p.y);
    expect(p.pl!.guardBrokenUntil).toBeGreaterThan(w.time);
  });
});

describe('statuses (GAME_DESIGN §5.5)', () => {
  it('burn, chill → freeze, bleed burst, poison', () => {
    const { w, p } = setup();
    applyStatusBuild(w, p, 'burn', 100);
    expect(p.st!.active.burn).toBeGreaterThan(w.time);
    applyStatusBuild(w, p, 'chill', 100);
    expect(p.st!.active.chill).toBeGreaterThan(w.time);
    applyStatusBuild(w, p, 'chill', 100);
    expect(p.st!.controls.freeze).toBeGreaterThan(w.time);
    const hp = p.hp!.hp;
    applyStatusBuild(w, p, 'bleed', 100);
    expect(hp - p.hp!.hp).toBeCloseTo(p.hp!.max * 0.12, 0);
    applyStatusBuild(w, p, 'poison', 100);
    const hp2 = p.hp!.hp;
    run(w, 2.1);
    expect(p.hp!.hp).toBeLessThan(hp2);
  });
  it('meters decay when not applied', () => {
    const { w, p } = setup();
    applyStatusBuild(w, p, 'shock', 50);
    run(w, 2);
    expect(p.st!.meters.shock).toBeLessThan(40);
  });
});

describe('weapons feel distinct', () => {
  it('greathammer swings are much slower than twin daggers', () => {
    const brute = setup('brute');
    press(brute.p, 'attack');
    stepWorld(brute.w);
    const ghWindup = brute.p.pl!.combo!.dur;
    const duel = setup('duelist');
    press(duel.p, 'attack');
    stepWorld(duel.w);
    const dgWindup = duel.p.pl!.combo!.dur;
    expect(ghWindup).toBeGreaterThan(dgWindup * 3);
  });
  it('a light attack damages the dummy', () => {
    const { w, p, d } = setup();
    p.x = 640;
    const hp0 = d.hp!.hp;
    press(p, 'attack');
    stepWorld(w);
    hold(p, 0);
    run(w, 0.6);
    expect(d.hp!.hp).toBeLessThan(hp0);
  });
});

describe('pattern hit tests (GAME_DESIGN §5.7)', () => {
  const ctx = (): PatternCtx => ({ ox: 640, oy: 368, facing: 0, tx: 800, ty: 368, players: [{ x: 800, y: 368 }], rng: new Rng(3), room: Room.empty(), telegraphS: 1.0 });
  it('circle, ring, line, cone', () => {
    const [c] = resolvePattern({ kind: 'circle', r: 100, anchor: 'target' }, ctx());
    expect(shapeHit(c!.shapes[0]!, 0, 850, 368, 10, null)).toBe(true);
    expect(shapeHit(c!.shapes[0]!, 0, 950, 368, 10, null)).toBe(false);
    const [r] = resolvePattern({ kind: 'ring', rIn: 60, rOut: 260, anchor: 'self' }, ctx());
    expect(shapeHit(r!.shapes[0]!, 0, 640 + 150, 368, 10, null)).toBe(true);
    expect(shapeHit(r!.shapes[0]!, 0, 640 + 20, 368, 10, null)).toBe(false);
    const [l] = resolvePattern({ kind: 'line', w: 40, l: 300, anchor: 'self' }, ctx());
    expect(shapeHit(l!.shapes[0]!, 0, 900, 368, 10, null)).toBe(true);
    expect(shapeHit(l!.shapes[0]!, 0, 900, 430, 10, null)).toBe(false);
    const [k] = resolvePattern({ kind: 'cone', angleDeg: 90, r: 200, anchor: 'self' }, ctx());
    expect(shapeHit(k!.shapes[0]!, 0, 760, 400, 10, null)).toBe(true);
    expect(shapeHit(k!.shapes[0]!, 0, 600, 368, 10, null)).toBe(false);
  });
  it('lanes, grid, randomCircles, sweep, expandingRing, wave, pockets, beam', () => {
    const lanes = resolvePattern({ kind: 'lanes', n: 5, w: 90, orientation: 'vertical' }, ctx());
    expect(lanes[0]!.shapes.length).toBe(5);
    const alt = resolvePattern({ kind: 'lanes', n: 4, w: 80, orientation: 'horizontal', alternate: true }, ctx());
    expect(alt.length).toBe(2);
    expect(alt[1]!.delay).toBeGreaterThan(0);
    const grid = resolvePattern({ kind: 'grid', spacing: 160, r: 55, pulses: 3 }, ctx());
    expect(grid[0]!.shapes.length).toBeGreaterThan(20);
    expect(grid[0]!.pulses).toBe(3);
    const rc = resolvePattern({ kind: 'randomCircles', n: 5, r: 70, anchor: 'self' }, ctx());
    expect(rc[0]!.shapes.length).toBe(5);
    // one circle lands on the player
    expect(rc[0]!.shapes.some((s) => shapeHit(s, 0, 800, 368, 10, null))).toBe(true);
    const sw = resolvePattern({ kind: 'sweep', angleDeg: 180, r: 300, durationS: 1.5, anchor: 'self' }, ctx())[0]!.shapes[0]!;
    // starts at facing − 90°, ends at facing + 90°
    expect(shapeHit(sw, 0, 640, 368 - 200, 10, null)).toBe(true);
    expect(shapeHit(sw, 1.5, 640, 368 + 200, 10, null)).toBe(true);
    expect(shapeHit(sw, 0, 640, 368 + 200, 10, null)).toBe(false);
    const er = resolvePattern({ kind: 'expandingRing', speed: 300, gaps: 2, anchor: 'self' }, ctx())[0]!.shapes[0]!;
    if (er.k !== 'expRing') throw new Error('expected expRing');
    // at tau=0.5 the ring is at 150 px; a point on the ring outside the gaps is hit, inside the gap is safe
    const g = er.gaps[0]!;
    expect(shapeHit(er, 0.5, 640 + Math.cos(g) * 150, 368 + Math.sin(g) * 150, 8, null)).toBe(false);
    expect(shapeHit(er, 0.5, 640 + Math.cos(g + 1.5) * 150, 368 + Math.sin(g + 1.5) * 150, 8, null) || shapeHit(er, 0.5, 640 + Math.cos(g - 1.5) * 150, 368 + Math.sin(g - 1.5) * 150, 8, null)).toBe(true);
    const wave = resolvePattern({ kind: 'wave', w: 120, speed: 320, from: 'west' }, ctx())[0]!.shapes[0]!;
    expect(shapeHit(wave, 1.0, 290, 368, 10, null)).toBe(true);
    expect(shapeHit(wave, 1.0, 900, 368, 10, null)).toBe(false);
    const pk = resolvePattern({ kind: 'pockets', n: 2, pocketR: 110 }, ctx())[0]!.shapes[0]!;
    if (pk.k !== 'pockets') throw new Error('expected pockets');
    expect(shapeHit(pk, 0, pk.pockets[0]!.x, pk.pockets[0]!.y, 10, null)).toBe(false);
    const beam = resolvePattern({ kind: 'beam', w: 26, l: 'room', turnRateDeg: 40, durationS: 3, tickS: 0.25, anchor: 'self' }, ctx())[0]!.shapes[0]!;
    expect(shapeHit(beam, 0, 900, 368, 10, null)).toBe(true);
  });
  it('escapability helper', () => {
    expect(checkEscapable({ kind: 'circle', r: 130, anchor: 'target' }, 1.2).ok).toBe(true);
    expect(checkEscapable({ kind: 'circle', r: 300, anchor: 'target' }, 0.8).ok).toBe(false);
    expect(checkEscapable({ kind: 'expandingRing', speed: 300, gaps: 0, anchor: 'self' }, 1.0).ok).toBe(false);
    expect(checkEscapable({ kind: 'circle', r: 150, anchor: 'self', pullSpeed: 60 }, 1.0).ok).toBe(true);
  });
});
