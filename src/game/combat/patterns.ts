// Pattern primitives (GAME_DESIGN §5.7, DATA_MODEL §3): resolve a PatternDef into concrete telegraph shapes,
// hit-test them over time, and check the escapability rule (§5.6) used by the data tests.
import { DEG, angleDiff, clamp, coneHit, dist, lineHit, ringHit, circleHit } from '../../engine/math';
import type { Rng } from '../../engine/rng';
import type { Anchor, PatternDef } from '../types';
import type { Room } from '../room';
import { floorSpeedAt } from '../systems/movingFloor';
import { ROOM_PX_W, ROOM_Y0, ROOM_PX_H } from '../room';

export const ROOM_MIN_X = 32;
export const ROOM_MAX_X = ROOM_PX_W - 32;
export const ROOM_MIN_Y = ROOM_Y0 + 32;
export const ROOM_MAX_Y = ROOM_Y0 + ROOM_PX_H - 32;
export const ROOM_CX = ROOM_PX_W / 2;
export const ROOM_CY = ROOM_Y0 + ROOM_PX_H / 2;
export const ROOM_DIAG = Math.hypot(ROOM_PX_W, ROOM_PX_H);
export const BASE_WALK = 260;

export type Shape =
  | { k: 'circle'; x: number; y: number; r: number }
  | { k: 'ring'; x: number; y: number; rIn: number; rOut: number }
  | { k: 'line'; x: number; y: number; a: number; w: number; l: number }
  | { k: 'cone'; x: number; y: number; a: number; half: number; r: number }
  /** gaps: distances from (x, y) where the sweep is broken, each gapW wide (D163) */
  | { k: 'sweep'; x: number; y: number; a0: number; arc: number; half: number; r: number; dur: number; line: boolean; w: number; gaps?: number[]; gapW?: number }
  | { k: 'expRing'; x: number; y: number; speed: number; thick: number; gaps: number[]; gapW: number; maxR: number }
  /** gaps: centres of breaks in the wall along its length (x for a north/south wave, y for east/west), each gapW wide */
  | { k: 'wave'; dir: 'north' | 'south' | 'east' | 'west'; w: number; speed: number; safeGrates: boolean; gaps?: number[]; gapW?: number }
  | { k: 'pockets'; pockets: { x: number; y: number; r: number }[] }
  | { k: 'beam'; x: number; y: number; a: number; w: number; l: number; turn: number }
  /** a boulder of diameter 0.9 w rolling from (x, y) along angle a for l px at speed px/s after impact */
  | { k: 'roll'; x: number; y: number; a: number; w: number; l: number; speed: number };

/** The four 'corner' anchor points (NW, NE, SW, SE): corner sweeps start here, corner turrets stand here. */
export const ROOM_CORNERS: readonly [number, number][] = [
  [ROOM_MIN_X + 20, ROOM_MIN_Y + 20],
  [ROOM_MAX_X - 20, ROOM_MIN_Y + 20],
  [ROOM_MIN_X + 20, ROOM_MAX_Y - 20],
  [ROOM_MAX_X - 20, ROOM_MAX_Y - 20],
];

export interface TeleSpec {
  shapes: Shape[];
  /** extra seconds after the attack's impact time */
  delay: number;
  mode: 'instant' | 'once' | 'tick';
  activeS: number;
  tickS: number;
  pulses: number;
  pulseGap: number;
  track: boolean;
  turnRate: number;
  follow: boolean;
  area: boolean;
  pullSpeed: number;
  /** a later set of a two-set pattern: its marker appears `delay` s after the first set and charges for the same time (D261) */
  showLate: boolean;
}

export interface PatternCtx {
  ox: number;
  oy: number;
  /** direction toward the target / aim */
  facing: number;
  tx: number;
  ty: number;
  pastX?: number;
  pastY?: number;
  /** positions of the players the attack must stay fair to (escapability placement) */
  players: { x: number; y: number }[];
  rng: Rng;
  room: Room | null;
  telegraphS: number;
  /** each living player's recent positions, oldest first, with their age in seconds (anchor 'eachPlayerPast(1.0)') */
  pastTrails?: { age: number; x: number; y: number }[][];
}

/** `n` points 0.1 s apart along each player's path, starting `ageS` seconds ago (repeats where they stood still are dropped). */
function pastPoints(c: PatternCtx, ageS: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  const trails = c.pastTrails ?? c.players.map((p) => [{ age: 0, x: p.x, y: p.y }]);
  for (const tr of trails) {
    let last: [number, number] | null = null;
    for (let i = 0; i < n; i++) {
      const want = Math.max(0, ageS - i * 0.1);
      let best: { age: number; x: number; y: number } | null = null;
      for (const q of tr) if (!best || Math.abs(q.age - want) < Math.abs(best.age - want)) best = q;
      if (!best) continue;
      if (last && Math.hypot(best.x - last[0], best.y - last[1]) < 8) continue;
      last = [best.x, best.y];
      out.push(last);
    }
  }
  return out.length ? out : [[c.tx, c.ty]];
}

function spec(shapes: Shape[], o: Partial<TeleSpec> = {}): TeleSpec {
  return {
    shapes,
    delay: 0,
    mode: 'instant',
    activeS: 0.1,
    tickS: 0,
    pulses: 1,
    pulseGap: 0.8,
    track: false,
    turnRate: 0,
    follow: false,
    area: false,
    pullSpeed: 0,
    showLate: false,
    ...o,
  };
}

function anchorPoints(a: Anchor | undefined, c: PatternCtx): [number, number][] {
  switch (a) {
    case 'self':
      return [[c.ox, c.oy]];
    case 'target':
    case 'aim':
    case 'point':
      return [[c.tx, c.ty]];
    case 'targetPast(1.0)':
      return [[c.pastX ?? c.tx, c.pastY ?? c.ty]];
    case 'eachPlayer':
      return c.players.length ? c.players.map((p) => [p.x, p.y] as [number, number]) : [[c.tx, c.ty]];
    case 'eachPlayerPast(1.0)':
      return pastPoints(c, 1.0, 1);
    case 'center':
      return [[ROOM_CX, ROOM_CY]];
    case 'corner': {
      const corners: [number, number][] = [
        [ROOM_MIN_X + 20, ROOM_MIN_Y + 20],
        [ROOM_MAX_X - 20, ROOM_MIN_Y + 20],
        [ROOM_MIN_X + 20, ROOM_MAX_Y - 20],
        [ROOM_MAX_X - 20, ROOM_MAX_Y - 20],
      ];
      return [c.rng.pick(corners)];
    }
    case 'wall': {
      const side = c.rng.int(0, 3);
      if (side === 0) return [[c.rng.range(ROOM_MIN_X, ROOM_MAX_X), ROOM_MIN_Y]];
      if (side === 1) return [[c.rng.range(ROOM_MIN_X, ROOM_MAX_X), ROOM_MAX_Y]];
      if (side === 2) return [[ROOM_MIN_X, c.rng.range(ROOM_MIN_Y, ROOM_MAX_Y)]];
      return [[ROOM_MAX_X, c.rng.range(ROOM_MIN_Y, ROOM_MAX_Y)]];
    }
    default:
      return [[c.ox, c.oy]];
  }
}

function lenTo(c: PatternCtx, x: number, y: number, a: number, l: number | 'room'): number {
  if (l !== 'room') return l;
  return c.room ? c.room.rayToWall(x, y, a) : ROOM_DIAG;
}

/** The narrowest safe gap an area may leave: a player's body (28 px) and a little room to stand in it. */
export const SAFE_GAP = 32;

/** Escape reach in px for a telegraph of `teleS` seconds under a pull (GAME_DESIGN §5.6). */
export function escapeReach(teleS: number, pullSpeed = 0): number {
  return (teleS - 0.1) * (BASE_WALK - pullSpeed) - 40;
}

/** Resolve a pattern at telegraph start. Returns one TeleSpec per independently-timed piece. */
export function resolvePattern(p: PatternDef, c: PatternCtx): TeleSpec[] {
  const pull = p.pullSpeed ?? 0;
  const extra = p.delayS ?? 0;
  const out = resolveInner(p, c).map((s) => ({ ...s, delay: s.delay + extra, pullSpeed: pull }));
  return out;
}

type WaveDir = 'north' | 'south' | 'east' | 'west';
const WAVE_DIRS: readonly WaveDir[] = ['north', 'south', 'east', 'west'];

/**
 * Wading speed used to aim waves fairly: off a grate the Bloatking's water (×0.85) and phase-2 flood (×0.7) slow
 * you (D94).
 */
export const WAVE_WADE_SPEED = BASE_WALK * 0.85 * 0.7;
/** px a wave leaves spare on top of the straight-line wade (walking round the boss or a pillar) */
const WAVE_MARGIN = 40;

/** Distance from (x, y) to the nearest raised grate tile (a body is safe from a wave once its centre is on one). */
export function grateDistance(room: Room, x: number, y: number): number {
  let best = Infinity;
  for (let ty = 0; ty < ROOM_PX_H / 32; ty++)
    for (let tx = 0; tx < ROOM_PX_W / 32; tx++) {
      const px = tx * 32 + 16;
      const py = ROOM_Y0 + ty * 32 + 16;
      if (!room.isGrateAt(px, py)) continue;
      const dx = Math.max(0, Math.abs(x - px) - 15);
      const dy = Math.max(0, Math.abs(y - py) - 15);
      best = Math.min(best, Math.hypot(dx, dy));
    }
  return best;
}

/**
 * The wade to the nearest grate in px of open water: the straight distance plus what crossing a moving floor
 * against you costs (the Bloatking's whirlpool), counted as if it carried you the wrong way the whole time.
 */
function grateWade(room: Room, x: number, y: number): number {
  let best = Infinity;
  for (let ty = 0; ty < ROOM_PX_H / 32; ty++)
    for (let tx = 0; tx < ROOM_PX_W / 32; tx++) {
      const gx = tx * 32 + 16;
      const gy = ROOM_Y0 + ty * 32 + 16;
      if (!room.isGrateAt(gx, gy)) continue;
      const ex = clamp(x, gx - 15, gx + 15);
      const ey = clamp(y, gy - 15, gy + 15);
      const d = Math.hypot(ex - x, ey - y);
      if (d >= best) continue;
      let cost = d;
      if (room.rotFloor || room.movers.length) {
        const n = Math.ceil(d / 8);
        for (let i = 1; i <= n; i++) {
          const fs = floorSpeedAt(room, x + ((ex - x) * i) / n, y + ((ey - y) * i) / n);
          if (fs > 0) cost += ((d / n) * fs) / Math.max(20, WAVE_WADE_SPEED - fs);
        }
      }
      best = Math.min(best, cost);
    }
  return best;
}

/**
 * Slack (px of wading to spare, the worst player) against a wave from `dir` whose band sets off `delayS` after
 * the telegraph ends: the time until its front reaches each player, minus the wade to their nearest grate.
 */
function waveSlack(p: Extract<PatternDef, { kind: 'wave' }>, dir: WaveDir, c: PatternCtx, delayS: number): number {
  if (!c.room) return 0;
  let worst = Infinity;
  for (const pl of c.players) {
    const run = dir === 'west' ? pl.x - ROOM_MIN_X : dir === 'east' ? ROOM_MAX_X - pl.x : dir === 'north' ? pl.y - ROOM_MIN_Y : ROOM_MAX_Y - pl.y;
    const tHit = Math.max(0, run - 7) / p.speed;
    const t = c.telegraphS + delayS + tHit - 0.1;
    worst = Math.min(worst, t * WAVE_WADE_SPEED - WAVE_MARGIN - grateWade(c.room, pl.x, pl.y));
  }
  return worst;
}

/** How fair the fairest side for a wave is (see waveSlack); a wave that a cross wave follows counts that one too. */
function bestWaveSlack(p: Extract<PatternDef, { kind: 'wave' }>, c: PatternCtx, pool: readonly WaveDir[], delay: number, crossAfter: number | undefined): { d: WaveDir; s: number }[] {
  return pool.map((d) => {
    const s = waveSlack(p, d, c, delay);
    if (crossAfter === undefined) return { d, s };
    return { d, s: Math.min(s, Math.max(...PERP[d].map((q) => waveSlack(p, q, c, delay + crossAfter)))) };
  });
}

/**
 * May a grate-dodged wave (alone, or a sequence of them: the Crosswave) be thrown now? Only when, from its fairest
 * side, every player can still wade to a grate before the band reaches them (D94). Other patterns: always.
 */
export function waveFair(p: PatternDef, c: PatternCtx): boolean {
  if (!c.room) return true;
  let wave: Extract<PatternDef, { kind: 'wave' }> | null = null;
  let crossAfter: number | undefined;
  let delay = 0;
  if (p.kind === 'wave') wave = p;
  else if (p.kind === 'sequence') {
    const i = p.steps.findIndex((s) => s.pattern.kind === 'wave');
    const st = p.steps[i];
    if (st && st.pattern.kind === 'wave') {
      wave = st.pattern;
      delay = p.steps.slice(0, i + 1).reduce((a, s) => a + s.delayS, 0);
      const next = p.steps[i + 1];
      if (next && next.pattern.kind === 'wave' && next.pattern.from === 'cross') crossAfter = next.delayS;
    }
  }
  if (!wave || wave.safeTiles !== 'G' || grateDistance(c.room, ROOM_CX, ROOM_CY) === Infinity) return true;
  const pool = wave.from === 'random' || wave.from === 'cross' ? WAVE_DIRS : [wave.from];
  return bestWaveSlack(wave, c, pool, delay, crossAfter).some((x) => x.s >= 0);
}

/** default width of a gap in a wave (D163): a body fits with room to spare */
export const WAVE_GAP_W = 130;

/**
 * Where a wave's gaps go (D163): the wall's length is cut into n equal stretches and each gets one gap somewhere
 * inside it (clear of the room's edge), so the gaps are always well apart.
 */
function placeWaveGaps(dir: WaveDir, n: number, gapW: number, rng: Rng): number[] {
  const horiz = dir === 'east' || dir === 'west';
  const lo = horiz ? ROOM_MIN_Y : ROOM_MIN_X;
  const hi = horiz ? ROOM_MAX_Y : ROOM_MAX_X;
  const part = (hi - lo) / n;
  const pad = gapW / 2 + 8;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = lo + part * i + pad;
    const b = lo + part * (i + 1) - pad;
    out.push(Math.round(b > a ? rng.range(a, b) : (a + b) / 2));
  }
  return out;
}

/** Is a body at (x, y) with radius r inside one of a wave's gaps (at least half of it within the break)? */
export function inWaveGap(s: Extract<Shape, { k: 'wave' }>, x: number, y: number, r: number): boolean {
  if (!s.gaps?.length) return false;
  const v = s.dir === 'east' || s.dir === 'west' ? y : x;
  const half = (s.gapW ?? WAVE_GAP_W) / 2;
  return s.gaps.some((g) => Math.abs(v - g) + r * 0.5 <= half);
}

const PERP: Record<WaveDir, WaveDir[]> = { north: ['east', 'west'], south: ['east', 'west'], east: ['north', 'south'], west: ['north', 'south'] };

/**
 * Where a grate-dodged wave comes from (D94). 'random' and 'cross' (perpendicular to the wave before it) pick at
 * random among the sides every player can still reach a grate from in time, else the fairest side; a fixed side
 * is kept. Without grates or a room it is the old uniform pick.
 */
function pickWaveDir(p: Extract<PatternDef, { kind: 'wave' }>, c: PatternCtx, o: ResolveOpts): WaveDir {
  if (p.from !== 'random' && p.from !== 'cross') return p.from;
  const pool = p.from === 'cross' && o.prevWave ? PERP[o.prevWave] : WAVE_DIRS;
  if (p.safeTiles !== 'G' || !c.room || !c.players.length || grateDistance(c.room, ROOM_CX, ROOM_CY) === Infinity) return c.rng.pick(pool);
  // a wave that a cross wave follows must leave a fair perpendicular one too
  const scored = bestWaveSlack(p, c, pool, o.delay ?? 0, o.crossAfter);
  const fair = scored.filter((x) => x.s >= 0);
  if (fair.length) return c.rng.pick(fair).d;
  return scored.reduce((a, b) => (b.s > a.s ? b : a)).d;
}

interface ResolveOpts {
  /** seconds after the telegraph this piece sets off (sequence steps) */
  delay?: number;
  /** the wave before this one in the sequence ('cross' waves turn 90° from it) */
  prevWave?: WaveDir | undefined;
  /** a 'cross' wave follows this one after this many seconds */
  crossAfter?: number | undefined;
}

function resolveInner(p: PatternDef, c: PatternCtx, o: ResolveOpts = {}): TeleSpec[] {
  switch (p.kind) {
    case 'melee': {
      if (p.shape === 'arc') return [spec([{ k: 'cone', x: c.ox, y: c.oy, a: c.facing, half: ((p.angleDeg ?? 90) * DEG) / 2, r: p.r ?? 60 }])];
      return [spec([{ k: 'line', x: c.ox, y: c.oy, a: c.facing, w: p.w ?? 40, l: p.l ?? 80 }])];
    }
    case 'projectile':
      return [];
    case 'circle': {
      // strikes along each player's recent path (Rewind Volley): `count` points 0.1 s apart from 1.0 s ago
      if (p.anchor === 'eachPlayerPast(1.0)') return [spec(pastPoints(c, 1.0, p.count ?? 1).map(([x, y]): Shape => ({ k: 'circle', x, y, r: p.r })), { area: true })];
      const pts = anchorPoints(p.anchor, c);
      const shapes: Shape[] = [];
      for (const [x, y] of pts) for (let i = 0; i < (p.count ?? 1); i++) {
        if (i === 0) shapes.push({ k: 'circle', x, y, r: p.r });
        else shapes.push({ k: 'circle', x: clamp(x + c.rng.spread(p.r * 2.2), ROOM_MIN_X, ROOM_MAX_X), y: clamp(y + c.rng.spread(p.r * 2.2), ROOM_MIN_Y, ROOM_MAX_Y), r: p.r });
      }
      return [spec(shapes, { area: p.r >= 140 })];
    }
    case 'ring': {
      const [x, y] = anchorPoints(p.anchor, c)[0]!;
      const rOut = p.rOut === 'edge' ? ROOM_DIAG : p.rOut;
      return [spec([{ k: 'ring', x, y, rIn: p.rIn, rOut }], { area: rOut >= 200 })];
    }
    case 'line': {
      const pts = anchorPoints(p.anchor, c);
      const shapes: Shape[] = [];
      const n = p.count ?? 1;
      for (const [x, y] of pts) {
        for (let i = 0; i < n; i++) {
          let a = c.facing;
          if (p.anchor === 'target' || p.anchor === 'targetPast(1.0)') a = c.facing;
          if (p.randomAngles) a = c.rng.range(-Math.PI, Math.PI);
          // spokes turned by angleOffsetDeg as a whole (D309: a second cross set 45° off the first)
          else if (n > 1 && p.spokes) a = c.facing + (p.angleOffsetDeg ?? 0) * DEG + (i * Math.PI * 2) / n;
          else if (n > 1) a = c.facing + (i - (n - 1) / 2) * ((p.angleOffsetDeg ?? 90) * DEG);
          else if (p.angleOffsetDeg) a += p.angleOffsetDeg * DEG;
          if (p.toAim) {
            // anchor → aim point exactly (a returning hammer's path)
            shapes.push({ k: 'line', x, y, a: Math.atan2(c.ty - y, c.tx - x), w: p.w, l: Math.max(1, Math.hypot(c.tx - x, c.ty - y)) });
          } else if (p.through) {
            const l = lenTo(c, x, y, a, 'room') * (p.lMult ?? 1);
            shapes.push({ k: 'line', x, y, a, w: p.w, l });
          } else {
            const l = lenTo(c, x, y, a, p.l) * (p.lMult ?? 1);
            shapes.push({ k: 'line', x, y, a, w: p.w, l });
          }
        }
      }
      return [spec(shapes, { area: p.l === 'room' || !!p.through || n > 2 })];
    }
    case 'cone': {
      const [x, y] = anchorPoints(p.anchor, c)[0]!;
      const r = p.r === 'room' ? ROOM_DIAG : p.r;
      const shapes: Shape[] = [];
      const n = p.count ?? 1;
      for (let i = 0; i < n; i++) shapes.push({ k: 'cone', x, y, a: c.facing + i * ((p.rotateDeg ?? 0) * DEG), half: (p.angleDeg * DEG) / 2, r });
      return [spec(shapes, { area: r >= 300 || p.angleDeg >= 120 })];
    }
    case 'lanes': {
      const vertical = p.orientation === 'vertical';
      const span = vertical ? ROOM_MAX_X - ROOM_MIN_X : ROOM_MAX_Y - ROOM_MIN_Y;
      const lo = vertical ? ROOM_MIN_X : ROOM_MIN_Y;
      const mk = (centers: number[]): Shape[] =>
        centers.map((cc) =>
          vertical
            ? ({ k: 'line', x: cc, y: ROOM_MIN_Y - 32, a: Math.PI / 2, w: p.w, l: ROOM_MAX_Y - ROOM_MIN_Y + 64 } as Shape)
            : ({ k: 'line', x: ROOM_MIN_X - 32, y: cc, a: 0, w: p.w, l: ROOM_MAX_X - ROOM_MIN_X + 64 } as Shape),
        );
      // rolling lanes: a boulder starts at one end of each lane (alternating ends) and rolls to the other
      const len = vertical ? ROOM_MAX_Y - ROOM_MIN_Y + 64 : ROOM_MAX_X - ROOM_MIN_X + 64;
      const roll = p.roll;
      const mkRoll = (centers: number[]): Shape[] =>
        centers.map((cc, i): Shape => {
          const back = i % 2 === 1;
          const a = (vertical ? Math.PI / 2 : 0) + (back ? Math.PI : 0);
          const x = vertical ? cc : back ? ROOM_MAX_X + 32 : ROOM_MIN_X - 32;
          const y = vertical ? (back ? ROOM_MAX_Y + 32 : ROOM_MIN_Y - 32) : cc;
          return { k: 'roll', x, y, a, w: p.w, l: len, speed: roll?.speed ?? 600 };
        });
      const make = roll ? mkRoll : mk;
      const laneOpts: Partial<TeleSpec> = roll ? { area: true, mode: 'once', activeS: len / roll.speed } : { area: true };
      // lanes that stay lit (bellows jets): they hit every tickS for durationS
      if (!roll && p.tickS) Object.assign(laneOpts, { mode: 'tick', activeS: p.durationS ?? 1, tickS: p.tickS });
      if (p.alternate) {
        const step = span / (p.n * 2);
        const a: number[] = [];
        const b: number[] = [];
        for (let i = 0; i < p.n * 2; i++) (i % 2 === 0 ? a : b).push(lo + step * (i + 0.5));
        const gap = p.setGapS ?? 0.8;
        return [spec(make(a), { ...laneOpts }), spec(make(b), { ...laneOpts, delay: gap, showLate: true })];
      }
      const step = span / p.n;
      const off = c.rng.range(-step * 0.25, step * 0.25);
      const centers: number[] = [];
      for (let i = 0; i < p.n; i++) centers.push(lo + step * (i + 0.5) + off);
      return [spec(make(centers), { ...laneOpts })];
    }
    case 'grid': {
      const pts: { x: number; y: number; parity: number }[] = [];
      const ox = c.rng.range(0, p.spacing * 0.5);
      const oy = c.rng.range(0, p.spacing * 0.5);
      let row = 0;
      for (let y = ROOM_MIN_Y + p.spacing / 2 - oy; y < ROOM_MAX_Y; y += p.spacing, row++) {
        let col = 0;
        for (let x = ROOM_MIN_X + p.spacing / 2 - ox; x < ROOM_MAX_X; x += p.spacing, col++) {
          if (y < ROOM_MIN_Y - 10 || x < ROOM_MIN_X - 10) continue;
          pts.push({ x, y, parity: (row + col) % 2 });
        }
      }
      const pulses = p.pulses ?? 1;
      const circ = (q: { x: number; y: number }): Shape => ({ k: 'circle', x: q.x, y: q.y, r: p.r });
      if ((p.sets ?? 1) >= 2 || p.checkerboard) {
        const a = pts.filter((q) => q.parity === 0).map(circ);
        const b = pts.filter((q) => q.parity === 1).map(circ);
        if ((p.sets ?? 1) >= 2) {
          const gap = p.setGapS ?? 1.0;
          return [spec(a, { area: true, pulses }), spec(b, { area: true, delay: gap, pulses, showLate: true })];
        }
        return [spec(a, { area: true, pulses })];
      }
      return [spec(pts.map(circ), { area: true, pulses, pulseGap: 0.8 })];
    }
    case 'sweep': {
      if ((p.count ?? 1) > 1 || p.anchor !== 'self') return remoteSweeps(p, c);
      const [x, y] = anchorPoints(p.anchor, c)[0]!;
      const arc = p.angleDeg * DEG * (p.clockwise === false ? -1 : 1);
      const a0 = Math.abs(p.angleDeg) >= 360 ? c.facing : c.facing - arc / 2;
      const r = p.r === 'room' ? ROOM_DIAG : p.r;
      return [
        spec([withSweepGaps({ k: 'sweep', x, y, a0, arc, half: (p.beamLine ? 4 : 14) * DEG, r, dur: p.durationS, line: !!p.beamLine, w: p.w ?? 30 }, p, c.rng)], {
          mode: p.tickS ? 'tick' : 'once',
          activeS: p.durationS,
          tickS: p.tickS ?? 0,
          area: true,
          follow: p.anchor === 'self',
        }),
      ];
    }
    case 'expandingRing': {
      const [x, y] = anchorPoints(p.anchor, c)[0]!;
      const gapW = p.gapW ?? 90;
      const n = p.count ?? 1;
      const out: TeleSpec[] = [];
      // a gap toward the middle of the room shared by every ring, so standing in it dodges the whole series
      const centerGap = p.centerGapDeg !== undefined ? Math.atan2(ROOM_CY - y, ROOM_CX - x) + c.rng.spread(p.centerGapDeg * DEG) : null;
      for (let k = 0; k < n; k++) {
        const gaps = placeRingGaps(p, c, x, y, k);
        if (centerGap !== null) gaps.unshift(centerGap);
        const thick = p.thickness ?? 36;
        out.push(
          spec([{ k: 'expRing', x, y, speed: p.speed, thick, gaps, gapW, maxR: ROOM_DIAG }], {
            mode: 'once',
            activeS: ROOM_DIAG / p.speed,
            area: true,
            delay: k * (p.spacingS ?? 1.2),
          }),
        );
      }
      return out;
    }
    case 'randomCircles': {
      const shapes: Shape[] = [];
      const [ax, ay] = anchorPoints(p.anchor, c)[0]!;
      // one circle lands on each player (the threat), the rest scatter
      const targets = p.within ? [] : c.players.slice(0, p.n);
      for (const t of targets) shapes.push({ k: 'circle', x: t.x, y: t.y, r: p.r });
      // circles "around a point" always include the point itself (Volley, Rain, Comet Barrage)
      if (p.within && (p.anchor === 'aim' || p.anchor === 'target' || p.anchor === 'point')) shapes.push({ k: 'circle', x: ax, y: ay, r: p.r });
      while (shapes.length < p.n) {
        let x: number;
        let y: number;
        if (p.within) {
          const a = c.rng.range(-Math.PI, Math.PI);
          const d = Math.sqrt(c.rng.next()) * p.within;
          x = ax + Math.cos(a) * d;
          y = ay + Math.sin(a) * d;
        } else {
          x = c.rng.range(ROOM_MIN_X + p.r * 0.5, ROOM_MAX_X - p.r * 0.5);
          y = c.rng.range(ROOM_MIN_Y + p.r * 0.5, ROOM_MAX_Y - p.r * 0.5);
        }
        shapes.push({ k: 'circle', x: clamp(x, ROOM_MIN_X, ROOM_MAX_X), y: clamp(y, ROOM_MIN_Y, ROOM_MAX_Y), r: p.r });
      }
      if (p.overS && p.overS > 0) {
        return shapes.map((s, i) => spec([s], { area: true, delay: (p.overS! * i) / Math.max(1, shapes.length - 1) }));
      }
      return [spec(shapes, { area: true })];
    }
    case 'wave': {
      const dir = pickWaveDir(p, c, o);
      const across = dir === 'east' || dir === 'west' ? ROOM_PX_W : ROOM_PX_H;
      const shape: Extract<Shape, { k: 'wave' }> = { k: 'wave', dir, w: p.w, speed: p.speed, safeGrates: p.safeTiles === 'G' };
      if (p.gaps) {
        shape.gapW = p.gapW ?? WAVE_GAP_W;
        shape.gaps = placeWaveGaps(dir, p.gaps, shape.gapW, c.rng);
      }
      return [spec([shape], { mode: 'once', activeS: across / p.speed, area: true })];
    }
    case 'pockets': {
      return [spec([{ k: 'pockets', pockets: placePockets(p.n, p.pocketR, c, p.anchor) }], { area: true })];
    }
    case 'beam': {
      const [x, y] = anchorPoints(p.anchor, c)[0]!;
      const out: TeleSpec[] = [];
      const n = p.count ?? 1;
      for (let i = 0; i < n; i++) {
        const a = c.facing + (i * Math.PI * 2) / n;
        const l = p.l === 'room' ? ROOM_DIAG : p.l;
        const turn = p.turnRateDeg * DEG * (p.opposite && i % 2 === 1 ? -1 : 1);
        out.push(
          spec([{ k: 'beam', x, y, a, w: p.w, l, turn }], {
            mode: 'tick',
            activeS: p.durationS,
            tickS: p.tickS,
            track: !p.opposite,
            turnRate: p.turnRateDeg * DEG,
            follow: p.anchor === 'self',
            area: true,
          }),
        );
      }
      return out;
    }
    case 'trail':
      return [];
    case 'sequence': {
      const out: TeleSpec[] = [];
      let t = 0;
      let prevWave: WaveDir | undefined;
      p.steps.forEach((s, i) => {
        t += s.delayS;
        const next = p.steps[i + 1];
        const crossAfter = next && next.pattern.kind === 'wave' && next.pattern.from === 'cross' ? next.delayS : undefined;
        for (const r of resolveInner(s.pattern, c, { delay: t, prevWave, crossAfter })) {
          out.push({ ...r, delay: r.delay + t });
          for (const sh of r.shapes) if (sh.k === 'wave') prevWave = sh.dir;
        }
      });
      return out;
    }
  }
}

/**
 * Sweeps from somewhere other than the attacker (corner turrets), or several at once: each starts pointing
 * at the target from its own anchor; with anchor 'corner' every sweep gets its own corner (the second one
 * diagonally opposite the first); `opposite` turns every other sweep the other way.
 */
/**
 * A sweep's gaps (D163): breaks at set distances from its pivot, so standing that far away lets it pass over you.
 * The reach that lies inside the room is cut into equal stretches and each gets one gap.
 */
function withSweepGaps(s: Extract<Shape, { k: 'sweep' }>, p: Extract<PatternDef, { kind: 'sweep' }>, rng: Rng): Extract<Shape, { k: 'sweep' }> {
  if (!p.gaps) return s;
  const gapW = p.gapW ?? WAVE_GAP_W;
  let far = 0;
  for (const [cx, cy] of [[ROOM_MIN_X, ROOM_MIN_Y], [ROOM_MAX_X, ROOM_MIN_Y], [ROOM_MIN_X, ROOM_MAX_Y], [ROOM_MAX_X, ROOM_MAX_Y]] as const) far = Math.max(far, Math.hypot(cx - s.x, cy - s.y));
  const lo = 100;
  const hi = Math.max(lo + gapW * p.gaps, Math.min(s.r, far * 0.8));
  const part = (hi - lo) / p.gaps;
  const pad = gapW / 2 + 8;
  const gaps: number[] = [];
  for (let i = 0; i < p.gaps; i++) {
    const a = lo + part * i + pad;
    const b = lo + part * (i + 1) - pad;
    gaps.push(Math.round(b > a ? rng.range(a, b) : (a + b) / 2));
  }
  return { ...s, gaps, gapW };
}

/** Is a body at (x, y) with radius r inside one of a sweep's gaps (at least half of it within the break)? */
export function inSweepGap(s: Extract<Shape, { k: 'sweep' }>, x: number, y: number, r: number): boolean {
  if (!s.gaps?.length) return false;
  const d = Math.hypot(x - s.x, y - s.y);
  const half = (s.gapW ?? WAVE_GAP_W) / 2;
  return s.gaps.some((g) => Math.abs(d - g) + r * 0.5 <= half);
}

function remoteSweeps(p: Extract<PatternDef, { kind: 'sweep' }>, c: PatternCtx): TeleSpec[] {
  const n = Math.max(1, p.count ?? 1);
  const pts: [number, number][] = [];
  if (p.anchor === 'corner') {
    const first = c.rng.int(0, 3);
    const order = [first, 3 - first, ...[0, 1, 2, 3].filter((i) => i !== first && i !== 3 - first)];
    for (let i = 0; i < n; i++) pts.push([...ROOM_CORNERS[order[i % 4]!]!]);
  } else for (let i = 0; i < n; i++) pts.push(anchorPoints(p.anchor, c)[0]!);
  const r = p.r === 'room' ? ROOM_DIAG : p.r;
  return pts.map(([x, y], i) => {
    const dir = (p.clockwise === false ? -1 : 1) * (p.opposite && i % 2 === 1 ? -1 : 1);
    const arc = p.angleDeg * DEG * dir;
    const self = p.anchor === 'self';
    const aim = self ? c.facing + (i * Math.PI * 2) / n : Math.atan2(c.ty - y, c.tx - x);
    const a0 = Math.abs(p.angleDeg) >= 360 ? aim : aim - arc / 2;
    return spec([withSweepGaps({ k: 'sweep', x, y, a0, arc, half: (p.beamLine ? 4 : 14) * DEG, r, dur: p.durationS, line: !!p.beamLine, w: p.w ?? 30 }, p, c.rng)], {
      mode: p.tickS ? 'tick' : 'once',
      activeS: p.durationS,
      tickS: p.tickS ?? 0,
      area: true,
      follow: self,
    });
  });
}

/**
 * The one gap of a gap-behind ring around (x, y): behind the attacker, unless his back is to a wall, a pillar, a
 * hole or the lava; then the side nearest to behind whose corridor is open floor every player can walk straight
 * to (D94). `fair` is false when no side is (the attack is then not thrown, `patternAllowed`).
 */
export function behindGap(c: PatternCtx, x: number, y: number): { a: number; fair: boolean } {
  const behind = c.facing + Math.PI;
  if (!c.room) return { a: behind, fair: true };
  const room = c.room;
  const bad = (px: number, py: number): boolean =>
    px < ROOM_MIN_X || px > ROOM_MAX_X || py < ROOM_MIN_Y || py > ROOM_MAX_Y || room.circleBlocked(px, py, 14) || room.isFallAt(px, py) || room.isHazardAt(px, py);
  // a straight walk from (ax, ay) to (bx, by) without crossing a wall, a pillar, a hole or the lava
  const walkable = (ax: number, ay: number, bx: number, by: number): boolean => {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 12);
    for (let i = 1; i <= n; i++) if (bad(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
    return true;
  };
  const open = (a: number): boolean => {
    for (let d = 80; d <= 220; d += 20) if (bad(x + Math.cos(a) * d, y + Math.sin(a) * d)) return false;
    // ...and every player can walk round to its mouth (not across the lava from the other bank)
    const mx = x + Math.cos(a) * 110;
    const my = y + Math.sin(a) * 110;
    return c.players.every((pl) => walkable(pl.x, pl.y, mx, my));
  };
  for (let k = 0; k <= 12; k++) for (const sgn of k ? [1, -1] : [1]) if (open(behind + sgn * k * 15 * DEG)) return { a: behind + sgn * k * 15 * DEG, fair: true };
  return { a: behind, fair: false };
}

/** Expanding-ring gaps: one gap within escape reach of every player (D47), the rest random. */
function placeRingGaps(p: Extract<PatternDef, { kind: 'expandingRing' }>, c: PatternCtx, x: number, y: number, k: number): number[] {
  const gaps: number[] = [];
  // a ring with its gap behind the caster keeps that gap first; any further gaps are placed as usual (D114)
  if (p.gapBehind) gaps.push(behindGap(c, x, y).a);
  const n = Math.max(p.gapBehind ? 0 : 1, p.gapBehind ? p.gaps - 1 : p.gaps);
  const reach = escapeReach(c.telegraphS + k * (p.spacingS ?? 1.2), p.pullSpeed ?? 0);
  for (let i = 0; i < n; i++) {
    const pl = c.players[i % Math.max(1, c.players.length)];
    if (pl && i < c.players.length) {
      const d = Math.max(60, dist(x, y, pl.x, pl.y));
      // time until the ring reaches the player adds to the reach
      const extraReach = (d / p.speed) * BASE_WALK;
      const maxOff = clamp((reach + extraReach) / d - 0.35, 0.1, 1.2);
      gaps.push(Math.atan2(pl.y - y, pl.x - x) + c.rng.spread(maxOff));
    } else gaps.push(c.rng.range(-Math.PI, Math.PI));
  }
  return gaps;
}

/** Pockets: one on the anchor if given; then one within reach of every player (DATA_MODEL §3 rule). */
export function placePockets(n: number, r: number, c: PatternCtx, anchor?: Anchor): { x: number; y: number; r: number }[] {
  const pockets: { x: number; y: number; r: number }[] = [];
  if (anchor) {
    const [x, y] = anchorPoints(anchor, c)[0]!;
    pockets.push({ x, y, r });
  }
  const reach = Math.max(20, escapeReach(c.telegraphS));
  for (const pl of c.players) {
    if (pockets.length >= n) break;
    const covered = pockets.some((q) => dist(q.x, q.y, pl.x, pl.y) - q.r <= reach);
    if (covered) continue;
    // never centre a safe pocket over a pit or the void
    let px = pl.x;
    let py = pl.y;
    for (let tries = 0; tries < 12; tries++) {
      const a = c.rng.range(-Math.PI, Math.PI);
      const d = c.rng.range(0, Math.min(reach + r * 0.6, 160));
      px = clamp(pl.x + Math.cos(a) * d, ROOM_MIN_X + r, ROOM_MAX_X - r);
      py = clamp(pl.y + Math.sin(a) * d, ROOM_MIN_Y + r, ROOM_MAX_Y - r);
      if (!c.room || !c.room.isFallAt(px, py)) break;
    }
    pockets.push({ x: px, y: py, r });
  }
  // the rest spread out (D172): the best of a few random spots, the one farthest from the pockets placed so far
  while (pockets.length < n) {
    let best = { x: c.rng.range(ROOM_MIN_X + r, ROOM_MAX_X - r), y: c.rng.range(ROOM_MIN_Y + r, ROOM_MAX_Y - r) };
    let bestD = -1;
    for (let k = 0; k < 8; k++) {
      const q = k === 0 ? best : { x: c.rng.range(ROOM_MIN_X + r, ROOM_MAX_X - r), y: c.rng.range(ROOM_MIN_Y + r, ROOM_MAX_Y - r) };
      if (c.room?.isFallAt(q.x, q.y)) continue;
      const d = pockets.length ? Math.min(...pockets.map((o) => dist(o.x, o.y, q.x, q.y))) : 0;
      if (d > bestD) {
        bestD = d;
        best = q;
      }
    }
    pockets.push({ ...best, r });
  }
  return pockets;
}

/** Can every listed player reach safety from this pocket layout? (used to refuse the attack) */
export function pocketsReachable(pockets: { x: number; y: number; r: number }[], players: { x: number; y: number }[], teleS: number, pull = 0): boolean {
  const reach = escapeReach(teleS, pull);
  return players.every((pl) => pockets.some((q) => dist(q.x, q.y, pl.x, pl.y) - q.r <= reach));
}

/** Current sweep angle at time tau after impact. */
export function sweepAngle(s: Extract<Shape, { k: 'sweep' }>, tau: number): number {
  return s.a0 + s.arc * clamp(tau / s.dur, 0, 1);
}

/** Wave band position (center coordinate along its travel axis) at tau. */
export function wavePos(s: Extract<Shape, { k: 'wave' }>, tau: number): number {
  const d = s.speed * tau;
  switch (s.dir) {
    case 'west':
      return ROOM_MIN_X - s.w / 2 + d;
    case 'east':
      return ROOM_MAX_X + s.w / 2 - d;
    case 'north':
      return ROOM_MIN_Y - s.w / 2 + d;
    case 'south':
      return ROOM_MAX_Y + s.w / 2 - d;
  }
}

/**
 * Does shape s hit a target circle (x, y, r) at tau seconds after impact? For instant shapes tau is ignored.
 */
export function shapeHit(s: Shape, tau: number, x: number, y: number, r: number, room: Room | null): boolean {
  switch (s.k) {
    case 'circle':
      return circleHit(s.x, s.y, s.r, x, y, r);
    case 'ring':
      return ringHit(s.x, s.y, s.rIn, s.rOut, x, y, r);
    case 'line':
      return lineHit(s.x, s.y, s.a, s.w, s.l, x, y, r);
    case 'beam':
      return lineHit(s.x, s.y, s.a, s.w, s.l, x, y, r);
    case 'cone':
      return coneHit(s.x, s.y, s.a, s.half, s.r, x, y, r);
    case 'sweep': {
      const a = sweepAngle(s, tau);
      if (inSweepGap(s, x, y, r)) return false;
      if (s.line) return lineHit(s.x, s.y, a, s.w, s.r, x, y, r);
      return coneHit(s.x, s.y, a, s.half, s.r, x, y, r);
    }
    case 'expRing': {
      const R = s.speed * tau;
      const d = dist(s.x, s.y, x, y);
      if (Math.abs(d - R) > s.thick / 2 + r) return false;
      const ang = Math.atan2(y - s.y, x - s.x);
      for (const g of s.gaps) {
        const half = s.gapW / 2 / Math.max(R, 30);
        // the whole target must fit within the gap to be safe
        const targetHalf = r / Math.max(d, 1);
        if (Math.abs(angleDiff(g, ang)) + targetHalf * 0.5 <= half) return false;
      }
      return true;
    }
    case 'wave': {
      const pos = wavePos(s, tau);
      const v = s.dir === 'east' || s.dir === 'west' ? x : y;
      if (Math.abs(v - pos) > s.w / 2 + r * 0.5) return false;
      if (s.safeGrates && room && room.isGrateAt(x, y)) return false;
      if (inWaveGap(s, x, y, r)) return false;
      return true;
    }
    case 'pockets': {
      for (const p of s.pockets) if (dist(p.x, p.y, x, y) <= p.r - r * 0.3) return false;
      return true;
    }
    case 'roll': {
      const [bx, by] = rollPos(s, tau);
      return circleHit(bx, by, s.w * 0.45, x, y, r);
    }
  }
}

/** Where a rolling lane's boulder is at tau seconds after impact. */
export function rollPos(s: Extract<Shape, { k: 'roll' }>, tau: number): [number, number] {
  const d = clamp(s.speed * tau, 0, s.l);
  return [s.x + Math.cos(s.a) * d, s.y + Math.sin(s.a) * d];
}

// ---------- escapability (GAME_DESIGN §5.6, CONTENT_ENEMIES §13 item 4) ----------

export interface EscapeCheck {
  ok: boolean;
  needed: number;
  available: number;
  reason: string;
}

/**
 * Check a Piercing pattern: (telegraph − 0.1) × (260 − pull) ≥ distanceToSafety + 40.
 * `teleS` is the attack's telegraph (windup) in seconds.
 */
export function checkEscapable(p: PatternDef, teleS: number, opts: { condition?: string } = {}): EscapeCheck {
  const pull = p.pullSpeed ?? 0;
  const tele = teleS + (p.delayS ?? 0);
  // the pull pauses during the last 0.2 s of a telegraph (CONTENT_ENEMIES §9 Maw note), so that slice is at full speed
  const available = pull > 0 ? Math.max(0, tele - 0.3) * (BASE_WALK - pull) + Math.min(0.2, Math.max(0, tele - 0.1)) * BASE_WALK : (tele - 0.1) * (BASE_WALK - pull);
  const res = (needed: number, reason: string): EscapeCheck => ({ ok: available >= needed + 40, needed: needed + 40, available, reason });
  switch (p.kind) {
    case 'circle':
      return res(p.r, `circle r${p.r}`);
    case 'ring': {
      const rOut = p.rOut === 'edge' ? ROOM_DIAG : p.rOut;
      if (p.rOut === 'edge') return { ok: !!opts.condition || false, needed: 0, available, reason: 'ring to edge needs a condition' };
      return res(p.rIn > 0 ? Math.min((rOut - p.rIn) / 2, rOut) : rOut, `ring ${p.rIn}-${rOut}`);
    }
    case 'cone':
      return res(p.r === 'room' ? ROOM_DIAG : Math.min(p.r, (p.r * Math.sin(Math.min(Math.PI / 2, (p.angleDeg * DEG) / 2)))), `cone ${p.angleDeg}`);
    case 'line':
      return res(p.w / 2, `line w${p.w}`);
    case 'melee':
      return res(p.shape === 'arc' ? (p.r ?? 60) : (p.w ?? 40) / 2, 'melee');
    case 'lanes': {
      // each set's lanes must leave a gap a body fits in (D94: Rain of Caps once left 27 px gaps, no way out)
      const span = p.orientation === 'vertical' ? ROOM_MAX_X - ROOM_MIN_X : ROOM_MAX_Y - ROOM_MIN_Y;
      const gap = span / p.n - (p.roll ? p.w * 0.9 : p.w);
      if (gap < SAFE_GAP) return { ok: false, needed: SAFE_GAP, available: gap, reason: `lanes leave ${gap.toFixed(0)} px gaps` };
      return res(p.w / 2, `lanes w${p.w}`);
    }
    case 'grid': {
      // the middle of each grid square must stay clear of its four circles (D94)
      const clear = (p.spacing * Math.SQRT2) / 2 - p.r;
      if (clear * 2 < SAFE_GAP) return { ok: false, needed: SAFE_GAP, available: clear * 2, reason: `grid leaves ${(clear * 2).toFixed(0)} px` };
      return res(p.r, `grid r${p.r}`);
    }
    case 'randomCircles':
      return res(p.r, `randomCircles r${p.r}`);
    case 'sweep': {
      // worst point: inside the start wedge; step out sideways (half the wedge width at the edge) or out of range
      const r = p.r === 'room' ? ROOM_DIAG : p.r;
      const w = p.beamLine ? (p.w ?? 30) / 2 : Math.min(r, r * Math.sin(14 * DEG));
      return res(w, 'sweep start wedge');
    }
    case 'expandingRing':
      if (p.gaps < 1 && !p.gapBehind) return { ok: false, needed: Infinity, available, reason: 'expanding ring without a gap' };
      if ((p.gapW ?? 90) < 90) return { ok: false, needed: Infinity, available, reason: 'ring gap narrower than 90 px' };
      // gaps are placed within reach of each player at telegraph start (placeRingGaps); the worst
      // remaining distance is the gap half-width offset at the typical engagement distance.
      return res((p.gapW ?? 90) / 2, 'ring gap');
    case 'wave':
      // safety is a raised grate placed within reach (the attack's condition requires one)
      return { ok: p.safeTiles === 'G' || !!opts.condition, needed: 0, available, reason: 'wave needs grates' };
    case 'pockets':
      // placePockets puts a pocket edge within reach of every player
      return { ok: available - 40 > 0, needed: 40, available, reason: 'pockets within reach' };
    case 'beam':
      return res(p.w / 2, 'beam');
    case 'trail':
    case 'projectile':
      return { ok: true, needed: 0, available, reason: 'not an area' };
    case 'sequence': {
      for (const s of p.steps) {
        const r = checkEscapable(s.pattern, teleS, opts);
        if (!r.ok) return r;
      }
      return { ok: true, needed: 0, available, reason: 'sequence' };
    }
  }
}

/** Is the pattern "room-covering" ([AREA])? */
export function isAreaPattern(p: PatternDef): boolean {
  switch (p.kind) {
    case 'lanes':
    case 'grid':
    case 'expandingRing':
    case 'randomCircles':
    case 'wave':
    case 'pockets':
    case 'sweep':
    case 'beam':
      return true;
    case 'line':
      return p.l === 'room' || !!p.through || (p.count ?? 1) > 2;
    case 'circle':
      return p.r >= 150;
    case 'ring':
      return p.rOut === 'edge' || p.rOut >= 200;
    case 'cone':
      return p.r === 'room' || p.r >= 300;
    case 'sequence':
      return p.steps.some((s) => isAreaPattern(s.pattern));
    default:
      return false;
  }
}
