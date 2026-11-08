// Snapshots (NETCODE §4). Every entity a guest draws is a fixed 27-byte record (position, pose, flags, hp
// permille, combo progress…) plus a JSON "meta" block that is only sent when it changes (what the entity
// is: enemy type, player gear, telegraph shapes, pickup contents). Room tiles travel the same way. The guest
// rebuilds real Entity objects from these so the normal renderer and HUD draw them unchanged.
import { walkSpeedFor } from '../player/player';
import { speedMult } from '../combat/state';
import type { Entity, EType, World, GameEvent } from '../world';
import { SKILL_RECOVER_S } from '../skills/use';
import type { MovingFloorDef } from '../types';

export const ETYPES: EType[] = ['player', 'enemy', 'projectile', 'telegraph', 'hazard', 'pickup', 'interact', 'decoy', 'wall', 'corpse'];
export const POSES = ['idle', 'windup', 'attack', 'recover', 'swing', 'cast', 'open', 'parry', 'stagger', 'hurt', 'devour'];
export const ENEMY_STATES = ['spawning', 'idle', 'alert', 'approach', 'kite', 'windup', 'attack', 'recover', 'stagger', 'reposition', 'held', 'channel', 'dormant', 'ceiling', 'submerged', 'stealth', 'invisible', 'dead'] as const;
export const PLAYER_STATES = ['idle', 'attack', 'dodge', 'skill', 'cast', 'flask', 'stagger', 'held', 'falling', 'consumable', 'channel', 'charge', 'dashing'] as const;
const COMBO_PHASES = ['', 'windup', 'active', 'recovery'] as const;
const REC = 27;
/** statusMask bits: the five statuses, then the six controls (NETCODE §4) */
export const STATUS_BITS = ['burn', 'chill', 'shock', 'bleed', 'poison'] as const;
export const CONTROL_BITS = ['freeze', 'blind', 'hexed', 'silence', 'root', 'hold'] as const;

export const F = {
  flash: 1,
  red: 2,
  blue: 4,
  dead: 8,
  downed: 16,
  deadUntilRest: 32,
  blocking: 64,
  parry: 128,
  invuln: 256,
  transition: 512,
  charging: 1024,
  used: 2048,
  windRed: 4096,
  windPierce: 8192,
  stagger: 16384,
  /** faded (immune) enemies: the gold border (D108) */
  faded: 32768,
} as const;

export interface Rec {
  id: number;
  kind: number;
  pose: number;
  x: number;
  y: number;
  facing: number;
  state: number;
  flags: number;
  hp: number;
  alpha: number;
  scale: number;
  squash: number;
  poseT: number;
  extra: number;
  extra2: number;
  cIdx: number;
  cPhase: number;
  cK: number;
  status: number;
}

const q = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(v)));

/** The record for one entity at host time `now`. */
export function recordOf(e: Entity, now: number): Rec {
  let flags = 0;
  if (e.anim.flashUntil > now) flags |= F.flash;
  if (e.anim.tint === 'red') flags |= F.red;
  if (e.anim.tint === 'blue') flags |= F.blue;
  if (e.hp?.dead) flags |= F.dead;
  if (e.hp && e.hp.invulnUntil > now) flags |= F.invuln;
  let state = 0;
  let extra = 0;
  let extra2 = 0;
  let cIdx = 0;
  let cPhase = 0;
  let cK = 0;
  if (e.pl) {
    const pl = e.pl;
    state = Math.max(0, PLAYER_STATES.indexOf(pl.state));
    if (pl.downed) flags |= F.downed;
    if (pl.deadUntilRest) flags |= F.deadUntilRest;
    if (pl.blocking) flags |= F.blocking;
    if (pl.parryUntil > now) flags |= F.parry;
    if (pl.combo) {
      // an off-hand shot (D291) is sent as 100 + its index
      cIdx = (pl.combo.offHand ? 100 : 0) + pl.combo.idx;
      cPhase = Math.max(0, COMBO_PHASES.indexOf(pl.combo.phase));
      cK = q((pl.combo.t / Math.max(0.001, pl.combo.dur)) * 255, 0, 255);
      if (pl.combo.charging) flags |= F.charging;
    } else if (pl.action?.kind === 'skill') {
      // a weapon skill playing (D234): 200 + its key, then the windup (0–127) or the strike after it fires (128–255)
      const a = pl.action;
      // an off-hand crossbow skill (D316) is 203 + its key
      cIdx = 200 + (a.offHand ? 3 : 0) + a.index;
      cK = a.fired ? 128 + q(Math.min(1, (a.t - a.castS) / SKILL_RECOVER_S) * 127, 0, 127) : q(Math.min(1, a.t / Math.max(0.001, a.castS)) * 127, 0, 127);
    }
    extra = q(pl.reviveProgress * 100, 0, 65535);
    extra2 = q(pl.reviveNeed * 100, 0, 65535);
  } else if (e.en) {
    const en = e.en;
    state = Math.max(0, ENEMY_STATES.indexOf(en.state));
    if (en.phaseTransitionUntil > now) flags |= F.transition;
    if (en.fadeUntil > now) flags |= F.faded;
    if (e.hp && e.hp.staggerUntil > now) flags |= F.stagger;
    const a = en.attack;
    if (a && a.phase === 'windup') {
      if (a.def.kind === 'red') flags |= F.windRed;
      if (a.def.kind === 'pierce') flags |= F.windPierce;
    }
    extra = en.phase;
    extra2 = en.state === 'spawning' ? q(Math.max(0, Math.min(1, (now - en.spawnedAt) / Math.max(0.01, en.spawnUntil - en.spawnedAt))) * 1000, 0, 1000) : 1000;
  } else if (e.pr?.lob) {
    extra = q((e.pr.lob.t / Math.max(0.01, e.pr.lob.dur)) * 1000, 0, 1000);
  } else if (e.it?.used) flags |= F.used;
  let status = 0;
  if (e.st) {
    STATUS_BITS.forEach((k, i) => {
      if (e.st!.active[k] > now) status |= 1 << i;
    });
    CONTROL_BITS.forEach((k, i) => {
      if (e.st!.controls[k] > now) status |= 1 << (5 + i);
    });
  }
  return {
    id: e.id,
    kind: Math.max(0, ETYPES.indexOf(e.type)),
    pose: Math.max(0, POSES.indexOf(e.anim.pose)),
    x: q(e.x * 2, -32768, 32767),
    y: q(e.y * 2, -32768, 32767),
    facing: q((((e.facing % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 256, 0, 256) & 255,
    state,
    flags,
    hp: e.hp ? q((Math.max(0, e.hp.hp) / Math.max(1e-6, e.hp.max)) * 1000, 0, 1000) : 1000,
    alpha: q(e.anim.alpha * 255, 0, 255),
    scale: q(e.anim.scale * 64, 0, 255),
    squash: q(e.anim.squash * 100, -128, 127),
    poseT: q(e.anim.poseT * 50, 0, 255),
    extra,
    extra2,
    cIdx: q(cIdx, 0, 255),
    cPhase,
    cK,
    status,
  };
}

function writeRec(v: DataView, o: number, r: Rec): void {
  v.setUint16(o, r.id);
  v.setUint8(o + 2, r.kind);
  v.setUint8(o + 3, r.pose);
  v.setInt16(o + 4, r.x);
  v.setInt16(o + 6, r.y);
  v.setUint8(o + 8, r.facing);
  v.setUint8(o + 9, r.state);
  v.setUint16(o + 10, r.flags);
  v.setUint16(o + 12, r.hp);
  v.setUint8(o + 14, r.alpha);
  v.setUint8(o + 15, r.scale);
  v.setInt8(o + 16, r.squash);
  v.setUint8(o + 17, r.poseT);
  v.setUint16(o + 18, r.extra);
  v.setUint16(o + 20, r.extra2);
  v.setUint8(o + 22, r.cIdx);
  v.setUint8(o + 23, r.cPhase);
  v.setUint8(o + 24, r.cK);
  v.setUint16(o + 25, r.status);
}

function readRec(v: DataView, o: number): Rec {
  return {
    id: v.getUint16(o),
    kind: v.getUint8(o + 2),
    pose: v.getUint8(o + 3),
    x: v.getInt16(o + 4),
    y: v.getInt16(o + 6),
    facing: v.getUint8(o + 8),
    state: v.getUint8(o + 9),
    flags: v.getUint16(o + 10),
    hp: v.getUint16(o + 12),
    alpha: v.getUint8(o + 14),
    scale: v.getUint8(o + 15),
    squash: v.getInt8(o + 16),
    poseT: v.getUint8(o + 17),
    extra: v.getUint16(o + 18),
    extra2: v.getUint16(o + 20),
    cIdx: v.getUint8(o + 22),
    cPhase: v.getUint8(o + 23),
    cK: v.getUint8(o + 24),
    status: v.getUint16(o + 25),
  };
}

export function recEqual(a: Rec, b: Rec): boolean {
  for (const k of Object.keys(a) as (keyof Rec)[]) if (a[k] !== b[k]) return false;
  return true;
}

/** The JSON side of a snapshot. */
export interface SnapJson {
  /** per-entity meta, only for new or changed entities */
  meta?: Record<number, EntityMeta>;
  /** the current room, when it changed */
  room?: RoomSync;
  /** world events since the last snapshot (sounds, numbers, messages) */
  ev?: GameEvent[];
  /** the receiving guest's own HUD state */
  self?: SelfState;
  bossId?: number;
  roomMods?: { dark: number; floodUntil: number };
  /** the host's friendly-fire percent (0–200, D115), in every snapshot so a change mid-run reaches guests */
  ff?: number;
}

export interface Snap {
  full: boolean;
  tick: number;
  time: number;
  ackSeq: number;
  recs: Rec[];
  removed: number[];
  json: SnapJson;
}

export function encodeSnap(s: Snap): ArrayBuffer {
  const json = new TextEncoder().encode(JSON.stringify(s.json));
  const size = 1 + 4 + 8 + 2 + 2 + 2 + 4 + s.recs.length * REC + s.removed.length * 2 + json.length;
  const b = new ArrayBuffer(size);
  const v = new DataView(b);
  let o = 0;
  v.setUint8(o, s.full ? 1 : 0);
  v.setUint32(o + 1, s.tick >>> 0);
  v.setFloat64(o + 5, s.time);
  v.setUint16(o + 13, s.ackSeq & 0xffff);
  v.setUint16(o + 15, s.recs.length);
  v.setUint16(o + 17, s.removed.length);
  v.setUint32(o + 19, json.length);
  o = 23;
  for (const r of s.recs) {
    writeRec(v, o, r);
    o += REC;
  }
  for (const id of s.removed) {
    v.setUint16(o, id);
    o += 2;
  }
  new Uint8Array(b, o, json.length).set(json);
  return b;
}

export function decodeSnap(b: ArrayBuffer): Snap {
  const v = new DataView(b);
  const nRec = v.getUint16(15);
  const nRem = v.getUint16(17);
  const jl = v.getUint32(19);
  let o = 23;
  const recs: Rec[] = [];
  for (let i = 0; i < nRec; i++) {
    recs.push(readRec(v, o));
    o += REC;
  }
  const removed: number[] = [];
  for (let i = 0; i < nRem; i++) {
    removed.push(v.getUint16(o));
    o += 2;
  }
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(b, o, jl))) as SnapJson;
  return { full: v.getUint8(0) === 1, tick: v.getUint32(1), time: v.getFloat64(5), ackSeq: v.getUint16(13), recs, removed, json };
}

// ---------------------------------------------------------------- meta

export type EntityMeta =
  | { t: 'player'; pid: string; slot: number; name: string; char: unknown; r: number }
  | { t: 'enemy'; def: string; elite: string | null; piece: number; boss: boolean; drawId: string; r: number; illusion: boolean; gaze?: number; linkedTo: number; atk?: string }
  | { t: 'other'; type: EType; drawId: string; r: number; team: number; c: Record<string, unknown> };

const DROP_KEYS = new Set(['spec', 'onImpact', 'effects', 'allyEffects', 'nextTick', 'hit']);
function clean(o: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(o, (k, val: unknown) => (DROP_KEYS.has(k) || val instanceof Set || val instanceof Map ? undefined : val))) as Record<string, unknown>;
}

/** The public part of a player's character (gear and look; never the bag). */
export function publicChar(c: Entity['pl'] extends infer P ? (P extends { char: infer C } ? C : never) : never): unknown {
  return {
    playerId: c.playerId,
    name: c.name,
    classId: c.classId,
    level: c.level,
    stats: c.stats,
    equipment: c.equipment,
    altMain: c.altMain,
    twoHanded: c.twoHanded,
    appearance: c.appearance,
    spellLoadout: c.spellLoadout,
    knownSpells: [],
    bag: [],
    gems: [],
    consumables: {},
    quickSlot: null,
    shards: 0,
    glowen: 0,
    flaskMax: c.flaskMax,
    flaskCur: c.flaskCur,
    bossesBeaten: c.bossesBeaten,
    highestZoneBeaten: c.highestZoneBeaten,
    cycle: c.cycle,
    tears: 0,
    freePoints: 0,
    tutorialDone: true,
  };
}

/** Meta for one entity, or null when the receiving player should not see it at all. */
export function metaOf(e: Entity, forPlayerId: string): EntityMeta | null {
  if (e.pl) return { t: 'player', pid: e.pl.playerId, slot: e.pl.slot, name: e.pl.name, char: publicChar(e.pl.char), r: e.radius };
  if (e.en) {
    // radius changes with boss phases (The Landlord grows); gaze is the direction arrow of a turning attack
    const m: EntityMeta = { t: 'enemy', def: e.en.def.id, elite: e.en.elite, piece: e.en.pieceIndex, boss: e.en.isBoss, drawId: e.drawId, r: Math.round(e.radius * 10) / 10, illusion: e.en.isIllusion, linkedTo: e.en.linkedTo };
    if (e.en.gaze !== undefined) m.gaze = Math.round(e.en.gaze * 100) / 100;
    // the attack under way, so guests draw its real windup and element (D149)
    if (e.en.attack) m.atk = e.en.attack.def.id;
    return m;
  }
  if (e.pk && e.pk.forPlayer && e.pk.forPlayer !== forPlayerId) return null; // instanced loot (D33)
  if (e.tg?.hidden && e.tg.team === 0) return null;
  const c: Record<string, unknown> = {};
  if (e.tg) c.tg = clean(e.tg);
  if (e.hz) c.hz = clean(e.hz);
  if (e.pk) c.pk = clean(e.pk);
  if (e.it) c.it = clean(e.it);
  if (e.pr) c.pr = { drawId: e.pr.drawId, color: e.pr.color, lob: e.pr.lob, kind: e.pr.kind, team: e.pr.team };
  if (e.dc) c.dc = { ...e.dc };
  if (e.wl) c.wl = { ...e.wl };
  return { t: 'other', type: e.type, drawId: e.drawId, r: e.radius, team: e.team, c };
}

// ---------------------------------------------------------------- the room

export interface RoomSync {
  key: string;
  version: number;
  kind: string;
  nodeId: string;
  zone: number;
  tiles: string;
  overlay: string;
  /** hazardous terrain (PROCGEN §3.2), only when the room has any */
  terrain?: string;
  doors: Record<string, { exists: boolean; open: boolean; locked: boolean }>;
  hazardKind: string;
  rotFloor: { x: number; y: number; rIn: number; rOut: number; speed: number } | null;
  /** phase moving floors (D95); absent from older hosts */
  movers?: MovingFloorDef[];
  /** what the minimap needs */
  visited: string[];
  cleared: string[];
}

export function toB64(a: Uint8Array): string {
  let s = '';
  for (const b of a) s += String.fromCharCode(b);
  return globalThis.btoa(s);
}

export function fromB64(s: string): Uint8Array {
  const bin = globalThis.atob(s);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}

export function roomSync(w: World, nodeId: string, kind: string, zone: number, visited: string[], cleared: string[]): RoomSync {
  const r = w.room;
  const doors: RoomSync['doors'] = {};
  for (const s of ['n', 's', 'e', 'w'] as const) doors[s] = { exists: r.doors[s].exists, open: r.doors[s].open, locked: r.doors[s].locked };
  return { key: `${r.id}`, version: r.version, kind, nodeId, zone, tiles: toB64(r.tiles), overlay: toB64(r.overlay), ...(r.terrain.some((v) => v !== 0) ? { terrain: toB64(r.terrain) } : {}), doors, hazardKind: r.hazardKind, rotFloor: r.rotFloor ? { ...r.rotFloor } : null, movers: r.movers.map((m) => ({ ...m })), visited: [...visited], cleared: [...cleared] };
}

// ---------------------------------------------------------------- the guest's own HUD state

export interface SelfState {
  hp: number;
  max: number;
  stam: number;
  stamMax: number;
  barrier: number;
  meters: Record<string, number>;
  active: Record<string, number>;
  controls: Record<string, number>;
  skillReadyAt: number[];
  spellReadyAt: number[];
  dodgeReadyAt: number;
  dodgeRechargeTotal: number;
  guardBrokenUntil: number;
  riposteBuffUntil: number;
  ghostUntil: number;
  ghostPauseUntil: number;
  stateUntil: number;
  invulnUntil: number;
  lastSeq: number;
  /** server position for prediction */
  x: number;
  y: number;
  speed: number;
  /** walking speed with no swing, cast or block slowing it (the guest predicts its own swings from here, D154) */
  base?: number;
}

/** The speed the guest's own prediction should walk at right now (0 when the player cannot walk). */
function walkSpeedOf(w: World, e: Entity): number {
  if (e.pl!.downed) return 90;
  // exactly the host's own walking speed (D150): swinging slows, it does not root
  return walkSpeedFor(w, e);
}

export function selfStateOf(w: World, e: Entity, lastSeq: number): SelfState {
  const pl = e.pl!;
  return {
    hp: e.hp!.hp,
    max: e.hp!.max,
    stam: e.stam?.cur ?? 0,
    stamMax: e.stam?.max ?? 0,
    barrier: e.hp!.barrier,
    meters: { ...e.st!.meters },
    active: { ...e.st!.active },
    controls: { ...e.st!.controls },
    skillReadyAt: [...pl.skillReadyAt],
    spellReadyAt: [...pl.spellReadyAt],
    dodgeReadyAt: pl.dodgeReadyAt,
    dodgeRechargeTotal: pl.dodgeRechargeTotal,
    guardBrokenUntil: pl.guardBrokenUntil,
    riposteBuffUntil: pl.riposteBuffUntil,
    ghostUntil: pl.ghostUntil,
    ghostPauseUntil: pl.ghostPauseUntil,
    stateUntil: pl.stateUntil,
    invulnUntil: e.hp!.invulnUntil,
    lastSeq,
    x: e.x,
    y: e.y,
    speed: walkSpeedOf(w, e),
    base: e.pl!.downed ? 90 : e.pl!.derived.walk * speedMult(e, w),
  };
}
