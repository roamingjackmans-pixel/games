// Wave Rush (GAME_DESIGN §24, D401–D410): a horde mode. One arena room per zone, zone 1 to zone 8 at one cycle's
// difficulty, then a random boss sized like that cycle's Landlord; beating it is a checkpoint, and the next cycle
// follows. Pure helpers here (layouts, the boss pick and its scaling, the account-wide unlock, the per-character
// record); GameSession runs the mode (session.ts) and the scenes show it.
import { stream } from '../engine/rng';
import type { KeyValueStore } from '../engine/settings';
import { ROOM_TEMPLATES } from '../data/rooms';
import { ENEMIES, rosterOf } from '../data/enemies';
import { zoneDef } from '../data/zones';
import { BOSSES } from '../data/bosses';
import { MIX_SIZE, pickMix } from './procgen/mix';
import { shapeIds } from './procgen/shapes';
import { enemyFullHp } from './enemies/spawn';
import { ngBossDef } from './boss/ngPhases';
import type { RoomNode, ZoneLayout } from './procgen/zone';
import type { BossDef } from './types';
import { ROOM_H, ROOM_W, ROOM_Y0, T, TERRAIN, TILE, type Room } from './room';
import { RUSH_BOSS_STAGE, RUSH_ROOMS } from './rushRecord';

export * from './rushRecord';

/**
 * A room's depth for its threat budget (D407, the owner's "full horde"): as deep as a zone's deepest combat rooms, so
 * three waves solo plus one per extra player, at the cycle's head counts (New Game+ budgets zone 8's, D276).
 */
export const RUSH_DEPTH = 7;
/** Seconds after entering a room before its first wave comes (there is no door to walk through to start it). */
export const RUSH_ARM_S = 1.5;
/** The boss whose size every Wave Rush boss takes (the final boss of every cycle). */
export const RUSH_FINAL_BOSS = 'the_landlord';

/** A Wave Rush in progress (session-side; not saved: a quit run starts again at a chosen cycle). */
export interface RushRun {
  /** 0-based (0 = the first playthrough's difficulty, shown as "Cycle 1") */
  cycle: number;
  /** 1–8 the zone rooms, 9 the boss */
  stage: number;
  /** which attempt this is on the character (its tries counter): seeds the rooms and the boss */
  attempt: number;
  /** sim seconds when room 1 of this attempt began (the cycle clock, D406) */
  startedAt: number;
  /** this attempt's boss (D403: random every attempt) */
  bossId: string;
  /** this attempt's map seed */
  seed: string;
}

/** The seed of an attempt: the character's world seed, the cycle and the attempt number. */
export function rushSeed(base: string, cycle: number, attempt: number): string {
  return `WR${attempt}c${cycle}:${base.slice(0, 12)}`;
}

/** The boss of an attempt (D403): any of the bosses, drawn from the attempt's seed, so each attempt rolls a new one. */
export function pickRushBoss(seed: string, cycle: number): string {
  const ids = Object.keys(BOSSES).sort();
  return stream(seed, `rush:boss:${cycle}`).pick(ids);
}

/** Room `zone`'s layout: one closed combat room with that zone's look, enemies and hazards (no doors, no chests). */
export function rushRoomLayout(seed: string, zone: number, cycle: number): ZoneLayout {
  const rng = stream(seed, `rush:room:${zone}:${cycle}`);
  const templates = ROOM_TEMPLATES[zone]?.length ? ROOM_TEMPLATES[zone]! : ROOM_TEMPLATES[1]!;
  const families = shapeIds(zone);
  const id = `wr-z${zone}`;
  const node: RoomNode = {
    id,
    gx: 4,
    gy: 4,
    kind: 'combat',
    depth: RUSH_DEPTH,
    doors: [],
    template: rng.pick(templates).id,
    mirrorH: rng.chance(0.5),
    mirrorV: rng.chance(0.5),
    bonusChest: false,
    shape: families.length ? rng.pick(families) : '',
  };
  const roster = rosterOf(zone);
  const mixRng = stream(seed, `rooms:${zone}:${cycle}`);
  const mix = roster.length >= MIX_SIZE ? pickMix(mixRng, roster).map((d) => d.id) : zoneDef(zone).enemies.filter((id) => !!ENEMIES[id]).slice(0, MIX_SIZE);
  return { zone, seed, cycle, rooms: [node], byId: { [id]: node }, startId: id, anteroomId: id, bossId: id, tutorialId: null, trialId: null, mix, links: {}, rush: true };
}

/** The boss stage: the boss's own arena, with its home zone's look. */
export function rushBossLayout(seed: string, bossId: string, cycle: number): ZoneLayout {
  const def = BOSSES[bossId] ?? BOSSES[RUSH_FINAL_BOSS]!;
  const id = 'wr-boss';
  const node: RoomNode = { id, gx: 4, gy: 4, kind: 'boss', depth: RUSH_BOSS_STAGE, doors: [], template: 'boss', mirrorH: false, mirrorV: false, bonusChest: false, shape: '' };
  return { zone: def.zone, seed, cycle, rooms: [node], byId: { [id]: node }, startId: id, anteroomId: id, bossId: id, tutorialId: null, trialId: null, mix: [], links: {}, rush: true };
}

/** The layout of a stage of an attempt. */
export function rushLayout(seed: string, stage: number, cycle: number, bossId: string): ZoneLayout {
  return stage >= RUSH_BOSS_STAGE ? rushBossLayout(seed, bossId, cycle) : rushRoomLayout(seed, Math.max(1, Math.min(RUSH_ROOMS, stage)), cycle);
}

/**
 * How many full bars of its HP a boss has to lose over its whole fight (its phases at this cycle): 1 for most; more
 * for a boss whose phase refills its bar (Ignatius, the Landlord's Unbound phase), less when its first bar is a share.
 */
export function bossBarWork(def: BossDef): number {
  let bar = def.phases[0]?.barMult ?? 1;
  let total = bar;
  let start = 100;
  let prevSpan = bar;
  def.phases.forEach((p, i) => {
    if (i > 0 && p.refillHp) {
      const next = p.hpOfPrevPhase ? p.hpOfPrevPhase * prevSpan : (p.barMult ?? 1);
      total += next;
      bar = next;
      start = 100;
    }
    prevSpan = ((start - p.untilHpPct) / 100) * bar;
    start = p.untilHpPct;
  });
  return total;
}

/**
 * A Wave Rush boss's full HP for one player (D404): whatever boss it is, its whole fight takes as much HP to win as
 * that cycle's Landlord (his four phases, Unbound included), so it is sized like the cycle's final boss.
 */
export function rushBossHpBase(def: BossDef, cycle: number): number {
  const ll = BOSSES[RUSH_FINAL_BOSS]!;
  const full = enemyFullHp(ngBossDef(ll, cycle), 8, cycle);
  if (def.id === ll.id) return full;
  return (full * bossBarWork(ngBossDef(ll, cycle))) / bossBarWork(ngBossDef(def, cycle));
}

/** A Wave Rush boss hits like the Landlord (D404): his damage multiplier in place of its own (spawned at zone 8). */
export function rushBossDmgMult(def: BossDef): number {
  const ll = BOSSES[RUSH_FINAL_BOSS]!;
  return (ll.mult?.dmg ?? 1) / (def.mult?.dmg ?? 1);
}

// ---------------------------------------------------------------- the exit (D413)

/** centre-to-centre gap between the bonfire (left) and the stairs (right) */
export const RUSH_EXIT_GAP = 100;
/** half the pair's drawn width (stairs ±30 round its centre) plus a tile's breathing room, and its height above / below */
const EXIT_HALF_W = RUSH_EXIT_GAP / 2 + 30 + 16;
const EXIT_UP = 40 + 16;
const EXIT_DOWN = 28 + 16;

/**
 * Is the pair's whole footprint, centred on (cx, cy), clear? Never a wall, pillar, prop, tree, pit or door; `plain` also
 * keeps it off the zone's ~ hazard tiles, grates and patches of bad terrain (walkable, so allowed when nothing plainer is left).
 */
export function rushExitFits(room: Room, cx: number, cy: number, plain = true): boolean {
  const tx0 = Math.floor((cx - EXIT_HALF_W) / TILE);
  const tx1 = Math.floor((cx + EXIT_HALF_W - 1) / TILE);
  const ty0 = Math.floor((cy - EXIT_UP - ROOM_Y0) / TILE);
  const ty1 = Math.floor((cy + EXIT_DOWN - 1 - ROOM_Y0) / TILE);
  if (tx0 < 1 || ty0 < 1 || tx1 >= ROOM_W - 1 || ty1 >= ROOM_H - 1) return false;
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const t = room.get(tx, ty);
      if (plain ? t !== T.Floor : t !== T.Floor && t !== T.Hazard && t !== T.Grate) return false;
      if (plain && room.terrainAt(tx * TILE + 16, ROOM_Y0 + ty * TILE + 16) !== TERRAIN.None) return false;
    }
  }
  return true;
}

/** candidate offsets from the wanted spot, nearest first, anything to the south counted twice as far */
let exitTries: [number, number][] | null = null;
function exitOffsets(): [number, number][] {
  if (exitTries) return exitTries;
  const all: [number, number, number][] = [];
  for (let dy = -ROOM_H * TILE; dy <= ROOM_H * TILE; dy += 16) {
    for (let dx = -ROOM_W * TILE; dx <= ROOM_W * TILE; dx += 16) all.push([dx, dy, Math.hypot(dx, dy) + Math.max(0, dy)]);
  }
  all.sort((a, b) => a[2] - b[2]);
  return (exitTries = all.map(([dx, dy]) => [dx, dy]));
}

/**
 * Where a cleared room's bonfire and stairs go (D413): side by side, the fire on the left, centred on (x, y) when that is
 * clear, else straight north of it to the first clear spot, else the nearest clear spot (north first). Plain floor is
 * tried before walkable hazard ground; only a room with no room for the pair at all puts each on its own nearest floor.
 */
export function rushExitSpots(room: Room, x: number, y: number): { bonfire: [number, number]; stairs: [number, number] } {
  const pair = (cx: number, cy: number) => ({ bonfire: [cx - RUSH_EXIT_GAP / 2, cy] as [number, number], stairs: [cx + RUSH_EXIT_GAP / 2, cy] as [number, number] });
  for (const plain of [true, false]) {
    for (let cy = y; cy - EXIT_UP > ROOM_Y0 + TILE; cy -= 16) if (rushExitFits(room, x, cy, plain)) return pair(x, cy);
    for (const [dx, dy] of exitOffsets()) if (rushExitFits(room, x + dx, y + dy, plain)) return pair(x + dx, y + dy);
  }
  return { bonfire: room.nearestFloor(x - RUSH_EXIT_GAP / 2, y, 20), stairs: room.nearestFloor(x + RUSH_EXIT_GAP / 2, y, 26) };
}

// ---------------------------------------------------------------- the cycle unlock (account-wide, D405)

/** The browser's Wave Rush unlock, shared by every save slot (D405). */
export const RUSH_KEY = 'dj.waveRush';

export interface RushUnlock {
  /** the highest cycle (0-based) any character on this browser has cleared; -1 none */
  best: number;
}

export function readRushUnlock(store: KeyValueStore): RushUnlock {
  try {
    const raw = store.getItem(RUSH_KEY);
    const o = raw ? (JSON.parse(raw) as { best?: unknown }) : null;
    const b = typeof o?.best === 'number' && Number.isFinite(o.best) ? Math.max(-1, Math.floor(o.best)) : -1;
    return { best: b };
  } catch {
    return { best: -1 };
  }
}

/** A cycle cleared: the unlock moves up (never down). */
export function noteRushUnlock(store: KeyValueStore, cycle: number): RushUnlock {
  const u = readRushUnlock(store);
  if (cycle > u.best) {
    u.best = cycle;
    try {
      store.setItem(RUSH_KEY, JSON.stringify(u));
    } catch {
      // storage full: the unlock waits for the next clear
    }
  }
  return u;
}

/** The cycles a run may start in (0-based): every one up to one past the best cleared. */
export function rushStartCycles(u: RushUnlock): number[] {
  return Array.from({ length: Math.max(0, u.best + 1) + 1 }, (_, i) => i);
}

export function canStartRushAt(u: RushUnlock, cycle: number): boolean {
  return Number.isInteger(cycle) && cycle >= 0 && cycle <= u.best + 1;
}

