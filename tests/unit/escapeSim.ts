// A walking-escape simulator for the boss escapability tests (CONTENT_ENEMIES §13, D89). It resolves an attack's
// pattern exactly as the game does, then sweeps the set of floor cells a player could be standing on through
// time: each step the set grows by one walking step (slower on moving floors) and loses every cell the attack
// hits at that moment. If the set ever empties, there was no way out from that start.
import { resolvePattern, shapeHit, type PatternCtx, type TeleSpec } from '../../src/game/combat/patterns';
import { Rng } from '../../src/engine/rng';
import { floorSpeedAt } from '../../src/game/systems/movingFloor';
import type { Room } from '../../src/game/room';
import type { AttackDef } from '../../src/game/types';

export interface EscapeWorld {
  room: Room;
  boss: { x: number; y: number; r: number };
  /** walking speed in px/s after slows and pulls */
  walk: number;
  /** extra floor cells a player must not stand on (lava, thorn walls) */
  blocked?: (x: number, y: number) => boolean;
}

export interface EscapeResult {
  ok: boolean;
  /** seconds after the telegraph started when the last safe cell was lost */
  failAt: number;
  /** how many cells were still safe at the end */
  cells: number;
}

/** The player's radius plus 2 px of slack: a gap you can only stand in pixel-perfectly does not count. */
export const SIM_PLAYER_R = 16;
const CELL = 10;

interface Hit {
  t0: number;
  t1: number;
  /** instant hits (and ticks) test once at t0 with this tau */
  instant: boolean;
  tau0: number;
  spec: TeleSpec;
}

const W = Math.ceil(1280 / CELL);
const H = Math.ceil(736 / CELL);
const gridCache = new WeakMap<EscapeWorld, { walkable: Uint8Array; slowFrac: Float32Array }>();

/** Which cells a player can stand on, and how much of a walking step each allows (moving floors), per arena state. */
function gridOf(ew: EscapeWorld): { walkable: Uint8Array; slowFrac: Float32Array } {
  let g = gridCache.get(ew);
  if (g) return g;
  const walkable = new Uint8Array(W * H);
  const slowFrac = new Float32Array(W * H);
  for (let gy = 0; gy < H; gy++)
    for (let gx = 0; gx < W; gx++) {
      const x = gx * CELL + CELL / 2;
      const y = gy * CELL + CELL / 2;
      // a moving floor can carry you the wrong way: count its speed against you (cautious)
      slowFrac[gy * W + gx] = Math.max(0, (ew.walk - floorSpeedAt(ew.room, x, y)) / ew.walk);
      if (ew.room.circleBlocked(x, y, 14) || ew.room.isFallAt(x, y)) continue;
      if (Math.hypot(x - ew.boss.x, y - ew.boss.y) < ew.boss.r + 14) continue;
      if (ew.blocked?.(x, y)) continue;
      walkable[gy * W + gx] = 1;
    }
  g = { walkable, slowFrac };
  gridCache.set(ew, g);
  return g;
}

const discCache = new Map<number, [number, number][]>();
/** Grid offsets within `r` cells (r rounded down to a quarter cell). */
function discOffsets(r: number): [number, number][] {
  const key = Math.floor(r * 4 + 1e-6) / 4;
  let out = discCache.get(key);
  if (!out) {
    out = [];
    const R = Math.floor(key);
    for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) if ((ox || oy) && ox * ox + oy * oy <= key * key) out.push([ox, oy]);
    discCache.set(key, out);
  }
  return out;
}

function hitsOf(specs: TeleSpec[], teleS: number): Hit[] {
  const out: Hit[] = [];
  for (const s of specs) {
    const base = teleS + s.delay;
    if (s.mode === 'instant') {
      for (let k = 0; k < s.pulses; k++) out.push({ t0: base + k * s.pulseGap, t1: base + k * s.pulseGap, instant: true, tau0: 0, spec: s });
    } else if (s.mode === 'tick') {
      for (let tau = 0; tau <= s.activeS + 1e-6; tau += Math.max(0.05, s.tickS)) out.push({ t0: base + tau, t1: base + tau, instant: true, tau0: tau, spec: s });
    } else {
      // an expanding ring is done once it has passed the room's farthest corner
      let active = s.activeS;
      const rings = s.shapes.filter((sh) => sh.k === 'expRing');
      if (rings.length === s.shapes.length)
        active = Math.min(active, Math.max(...rings.map((sh) => (Math.max(Math.hypot(sh.x, sh.y - 16), Math.hypot(1280 - sh.x, sh.y - 16), Math.hypot(sh.x, 736 - sh.y), Math.hypot(1280 - sh.x, 736 - sh.y)) + sh.thick + SIM_PLAYER_R) / sh.speed)));
      out.push({ t0: base, t1: base + active, instant: false, tau0: 0, spec: s });
    }
  }
  return out;
}

/** Does any shape of `spec` hit a body of SIM_PLAYER_R at (x, y), tau seconds after its impact? */
function hitAt(spec: TeleSpec, tau: number, x: number, y: number, room: Room): boolean {
  for (const sh of spec.shapes) if (shapeHit(sh, tau, x, y, SIM_PLAYER_R, room)) return true;
  return false;
}

/**
 * Can a player standing at `start` when the telegraph appears walk clear of every hit of `atk`? `trackedUntil`:
 * the player is assumed to stand still until then (a self-anchored line or cone tracks its target for the first
 * 60% of the windup, so moving early does not help).
 */
export function simulateEscape(atk: AttackDef, start: { x: number; y: number }, ew: EscapeWorld, seed: string, trackedUntil = 0): EscapeResult {
  const p = atk.pattern;
  if (!p) return { ok: true, failAt: 0, cells: 0 };
  let teleS = atk.windupMs / 1000;
  if (atk.move?.kind === 'leap') teleS += (atk.activeMs ?? 0) / 1000;
  const ctx: PatternCtx = {
    ox: ew.boss.x,
    oy: ew.boss.y,
    facing: Math.atan2(start.y - ew.boss.y, start.x - ew.boss.x),
    tx: start.x,
    ty: start.y,
    pastX: start.x,
    pastY: start.y,
    players: [{ x: start.x, y: start.y }],
    rng: new Rng(seed),
    room: ew.room,
    telegraphS: teleS,
  };
  const specs = resolvePattern(p, ctx);
  const hits = hitsOf(specs, teleS);
  if (!hits.length) return { ok: true, failAt: 0, cells: 0 };
  const tEnd = Math.max(...hits.map((h) => h.t1)) + 0.05;

  const { walkable, slowFrac } = gridOf(ew);
  let cur = new Uint8Array(W * H);
  const sgx = Math.min(W - 1, Math.max(0, Math.floor(start.x / CELL)));
  const sgy = Math.min(H - 1, Math.max(0, Math.floor(start.y / CELL)));
  cur[sgy * W + sgx] = 1;
  // the bounding box of the live cells (only it is scanned)
  let bx0 = sgx;
  let bx1 = sgx;
  let by0 = sgy;
  let by1 = sgy;
  // a full step walks STEP_CELLS cells in any direction (a disc of offsets); steps end early at instant hits so a
  // hit is tested where the player can be at that moment (a shortened step's leftover walk is dropped: cautious)
  const STEP_CELLS = 3;
  const full = (STEP_CELLS * CELL) / ew.walk;
  const instants = [...new Set(hits.filter((h) => h.instant).map((h) => h.t0))].sort((a, b) => a - b);
  let t = 0;
  let step = 0;
  while (t < tEnd) {
    let t1 = t + full;
    const ni = instants.find((x) => x > t + 1e-9);
    if (ni !== undefined && ni < t1) t1 = ni;
    const q = (t1 - t) / full;
    step++;
    let next = cur;
    if (t >= trackedUntil) {
      next = new Uint8Array(W * H);
      for (let gy = by0; gy <= by1; gy++)
        for (let gx = bx0; gx <= bx1; gx++) {
          const i = gy * W + gx;
          if (!cur[i]) continue;
          next[i] = 1;
          // slowed cells (moving floors) spread on only their share of the steps
          const f = slowFrac[i]!;
          if (f < 1 && Math.floor(step * f) === Math.floor((step - 1) * f)) continue;
          for (const [ox, oy] of discOffsets(STEP_CELLS * q)) {
            const nx = gx + ox;
            const ny = gy + oy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const j = ny * W + nx;
            if (walkable[j]) next[j] = 1;
          }
        }
      bx0 = Math.max(0, bx0 - STEP_CELLS);
      by0 = Math.max(0, by0 - STEP_CELLS);
      bx1 = Math.min(W - 1, bx1 + STEP_CELLS);
      by1 = Math.min(H - 1, by1 + STEP_CELLS);
    }
    // cut the cells hit during (t, t1]
    const live = hits.filter((h) => h.t1 > t && h.t0 <= t1);
    if (live.length) {
      for (let gy = by0; gy <= by1; gy++)
        for (let gx = bx0; gx <= bx1; gx++) {
        const i = gy * W + gx;
        if (!next[i]) continue;
        const x = gx * CELL + CELL / 2;
        const y = gy * CELL + CELL / 2;
        for (const h of live) {
          // continuous areas: one sample a step (nothing moves farther than its own hit band in one walking step)
          const tau = h.instant ? h.tau0 : Math.min(t1, h.t1) - h.t0;
          if (hitAt(h.spec, tau, x, y, ew.room)) {
            next[i] = 0;
            break;
          }
        }
      }
    }
    cur = next;
    let n = 0;
    for (let gy = by0; gy <= by1; gy++) for (let gx = bx0; gx <= bx1; gx++) n += cur[gy * W + gx]!;
    if (n === 0) return { ok: false, failAt: t1, cells: 0 };
    t = t1;
  }
  let n = 0;
  for (let i = 0; i < cur.length; i++) n += cur[i]!;
  return { ok: true, failAt: 0, cells: n };
}
