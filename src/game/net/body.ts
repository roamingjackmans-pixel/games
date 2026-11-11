// Guest-owned bodies (D338, NETCODE §5–§6). A co-op guest runs its own player on its own screen at full speed and
// tells the host where it is and what it is doing about 60 times a second (the body packet). The host shows that
// player (its "puppet") where the guest says. Whatever the host's world does to the puppet by itself (a heal, a buff,
// a status from a puddle, a pull, a teleport into the next room) is caught as a change and sent back to the guest,
// which applies it to the body it owns. This module holds the shared parts: the body packet, that change capture,
// applying it, and the guest's per-frame step of its own body.
import { checkDeath, interrupt } from '../combat/damage';
import { updatePlayer } from '../player/player';
import { updateMovement } from '../systems/movement';
import { updateStatuses } from '../systems/statuses';
import { netHostDriven, type Buff, type Entity, type PlayerState, type World } from '../world';
import { CONTROL_BITS, PLAYER_STATES, POSES, STATUS_BITS } from './snapshot';
import { offSkillOf, skillOf, SKILL_RECOVER_S } from '../skills/use';

// ---------------------------------------------------------------- the body packet (guest → host, every frame)

export const BODY_BYTES = 36;

/** body packet flag bits */
export const BF = { blocking: 1, parry: 2, iframes: 4, follow: 8, charging: 16, flash: 32 } as const;

export interface BodyReport {
  seq: number;
  /** the last host override of this body the guest has applied (SelfState.epoch) */
  epoch: number;
  x: number;
  y: number;
  facing: number;
  state: number;
  pose: number;
  poseT: number;
  squash: number;
  alpha: number;
  scale: number;
  moving: number;
  flags: number;
  hp: number;
  barrier: number;
  stam: number;
  cIdx: number;
  cPhase: number;
  cK: number;
  status: number;
  flask: number;
}

const COMBO_PHASES = ['', 'windup', 'active', 'recovery'] as const;
const q = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(v)));

/** The status / control bits of a body at `now` (as in a snapshot record). */
export function statusBits(e: Entity, now: number): number {
  let status = 0;
  if (!e.st) return 0;
  STATUS_BITS.forEach((k, i) => {
    if (e.st!.active[k] > now) status |= 1 << i;
  });
  CONTROL_BITS.forEach((k, i) => {
    if (e.st!.controls[k] > now) status |= 1 << (5 + i);
  });
  return status;
}

/** The guest's own body, as its packet. */
export function bodyReportOf(e: Entity, now: number, seq: number, epoch: number): BodyReport {
  const pl = e.pl!;
  let flags = 0;
  if (pl.blocking) flags |= BF.blocking;
  if (pl.parryUntil > now) flags |= BF.parry;
  if (now >= pl.iframesFrom && now < pl.iframesUntil) flags |= BF.iframes;
  if (pl.netFollow) flags |= BF.follow;
  if (pl.combo?.charging) flags |= BF.charging;
  if (e.anim.flashUntil > now) flags |= BF.flash;
  let cIdx = 0;
  let cPhase = 0;
  let cK = 0;
  if (pl.combo) {
    cIdx = (pl.combo.offHand ? 100 : 0) + pl.combo.idx;
    cPhase = Math.max(0, COMBO_PHASES.indexOf(pl.combo.phase));
    cK = q((pl.combo.t / Math.max(0.001, pl.combo.dur)) * 255, 0, 255);
  }
  return {
    seq,
    epoch,
    x: e.x,
    y: e.y,
    facing: e.facing,
    state: Math.max(0, PLAYER_STATES.indexOf(pl.state)),
    pose: Math.max(0, POSES.indexOf(e.anim.pose)),
    poseT: e.anim.poseT,
    squash: e.anim.squash,
    alpha: e.anim.alpha,
    scale: e.anim.scale,
    moving: (e.anim as { moving?: number }).moving ?? 0,
    flags,
    hp: e.hp!.hp,
    barrier: e.hp!.barrierUntil > now ? e.hp!.barrier : 0,
    stam: e.stam?.cur ?? 0,
    cIdx,
    cPhase,
    cK,
    status: statusBits(e, now),
    flask: pl.char.flaskCur,
  };
}

export function encodeBody(r: BodyReport): ArrayBuffer {
  const b = new ArrayBuffer(BODY_BYTES);
  const v = new DataView(b);
  v.setUint16(0, r.seq & 0xffff);
  v.setUint16(2, r.epoch & 0xffff);
  v.setInt16(4, q(r.x * 2, -32768, 32767));
  v.setInt16(6, q(r.y * 2, -32768, 32767));
  v.setUint8(8, q(((((r.facing % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * 256, 0, 256) & 255);
  v.setUint8(9, r.state);
  v.setUint8(10, r.pose);
  v.setUint8(11, q(r.poseT * 50, 0, 255));
  v.setInt8(12, q(r.squash * 100, -128, 127));
  v.setUint8(13, q(r.alpha * 255, 0, 255));
  v.setUint8(14, q(r.scale * 64, 0, 255));
  v.setUint8(15, q(r.moving * 255, 0, 255));
  v.setUint16(16, r.flags);
  v.setFloat32(18, r.hp);
  v.setFloat32(22, r.barrier);
  v.setFloat32(26, r.stam);
  v.setUint8(30, q(r.cIdx, 0, 255));
  v.setUint8(31, r.cPhase);
  v.setUint8(32, r.cK);
  v.setUint16(33, r.status);
  v.setUint8(35, q(r.flask, 0, 255));
  return b;
}

export function decodeBody(b: ArrayBuffer): BodyReport | null {
  if (b.byteLength < BODY_BYTES) return null;
  const v = new DataView(b);
  return {
    seq: v.getUint16(0),
    epoch: v.getUint16(2),
    x: v.getInt16(4) / 2,
    y: v.getInt16(6) / 2,
    facing: (v.getUint8(8) / 256) * Math.PI * 2,
    state: v.getUint8(9),
    pose: v.getUint8(10),
    poseT: v.getUint8(11) / 50,
    squash: v.getInt8(12) / 100,
    alpha: v.getUint8(13) / 255,
    scale: v.getUint8(14) / 64,
    moving: v.getUint8(15) / 255,
    flags: v.getUint16(16),
    hp: v.getFloat32(18),
    barrier: v.getFloat32(22),
    stam: v.getFloat32(26),
    cIdx: v.getUint8(30),
    cPhase: v.getUint8(31),
    cK: v.getUint8(32),
    status: v.getUint16(33),
    flask: v.getUint8(35),
  };
}

/**
 * Another player's swing or weapon skill from its wire form (a snapshot record or a body packet), for drawing only:
 * 100 + index is an off-hand shot (D291), 200 + key a weapon skill (D234).
 */
export function comboFromWire(e: Entity, cIdx: number, cPhase: number, cK: number, charging: boolean): void {
  const pl = e.pl!;
  const ph = COMBO_PHASES[cPhase] ?? '';
  const offShot = cIdx >= 100 && cIdx < 200 && !!pl.derived.offWeapon;
  const idx = offShot ? cIdx - 100 : cIdx;
  const combo = offShot ? pl.derived.offWeapon!.def.combo : pl.derived.weapon.combo;
  if (ph && combo.length) {
    const swing = combo[idx % combo.length]!;
    pl.combo = { idx, phase: ph, t: cK / 255, dur: 1, swing, hit: new Set(), queued: false, charging, chargeT: 0, speed: 1, fired: false, ...(offShot ? { offHand: true } : {}) };
  } else pl.combo = null;
  if (!ph && cIdx >= 200 && pl.state === 'skill') {
    const k = cIdx - 200;
    const off = k >= 3;
    const sk = off ? offSkillOf(e, k - 3) : skillOf(e, k);
    const fired = cK >= 128;
    const t = fired ? 1 + ((cK - 128) / 127) * SKILL_RECOVER_S : cK / 127;
    if (sk) pl.action = { kind: 'skill', index: k % 3, id: sk.id, t, castS: 1, fired, effects: [], aimX: e.x, aimY: e.y, powerMult: 1, hyperArmor: false, ...(off ? { offHand: true } : {}) };
  } else if (pl.action?.kind === 'skill' && !netHostDriven(pl)) pl.action = null;
}

/** Host: show a guest's puppet as its latest packet says (D338). Returns false when the packet is out of date. */
export function applyBodyReport(w: World, e: Entity, r: BodyReport, epoch: number): boolean {
  const pl = e.pl!;
  const now = w.time;
  // the guest has not yet applied the host's last word on its body (a revive, a teleport): wait for it
  if (r.epoch !== (epoch & 0xffff)) return false;
  // a ghost walks on its own screen; everything else about it is the host's
  if (pl.deadUntilRest) return true;
  if (pl.downed || (!netHostDriven(pl) && !(r.flags & BF.follow))) {
    const d = Math.hypot(r.x - e.x, r.y - e.y);
    // eased a little so the host's screen does not show every bump of the network (a jump of 48 px or more snaps)
    const k = d >= 48 ? 1 : 0.6;
    e.x += (r.x - e.x) * k;
    e.y += (r.y - e.y) * k;
    e.facing = r.facing;
    e.forced = null;
    (e.anim as { moving?: number }).moving = r.moving;
  }
  if (pl.downed) return true;
  if (!netHostDriven(pl) && !(r.flags & BF.follow)) {
    const st = (PLAYER_STATES[r.state] ?? 'idle') as PlayerState;
    pl.state = netHostDrivenState(st) ? 'idle' : st;
    pl.blocking = (r.flags & BF.blocking) !== 0;
    pl.parryUntil = r.flags & BF.parry ? now + 0.1 : 0;
    pl.dodgeUntil = st === 'dodge' ? now + 0.1 : 0;
    comboFromWire(e, r.cIdx, r.cPhase, r.cK, (r.flags & BF.charging) !== 0);
    e.anim.pose = POSES[r.pose] ?? 'idle';
    e.anim.poseT = r.poseT;
    e.anim.squash = r.squash;
    e.anim.alpha = r.alpha;
    e.anim.scale = r.scale;
  }
  if (r.flags & BF.flash) e.anim.flashUntil = Math.max(e.anim.flashUntil, now + 0.08);
  e.hp!.hp = Math.min(e.hp!.max, Math.max(0, r.hp));
  e.hp!.barrier = Math.max(0, r.barrier);
  if (r.barrier > 0) e.hp!.barrierUntil = Math.max(e.hp!.barrierUntil, now + 0.5);
  if (e.stam) e.stam.cur = Math.min(e.stam.max, Math.max(0, r.stam));
  if (e.st) {
    STATUS_BITS.forEach((k, i) => {
      e.st!.active[k] = r.status & (1 << i) ? Math.max(e.st!.active[k], now + 0.3) : 0;
    });
    CONTROL_BITS.forEach((k, i) => {
      e.st!.controls[k] = r.status & (1 << (5 + i)) ? Math.max(e.st!.controls[k], now + 0.3) : 0;
    });
  }
  return true;
}

function netHostDrivenState(s: PlayerState): boolean {
  return s === 'skill' || s === 'cast' || s === 'consumable' || s === 'channel' || s === 'charge' || s === 'dashing';
}

// ---------------------------------------------------------------- what the host's world did to a puppet

/** The parts of a puppet the host's world may change by itself, as they were. */
export interface BodySnap {
  x: number;
  y: number;
  hp: number;
  max: number;
  stam: number;
  barrier: number;
  barrierUntil: number;
  invulnUntil: number;
  meters: Record<string, number>;
  active: Record<string, number>;
  controls: Record<string, number>;
  buffs: Map<string, string>;
  heals: number;
  forced: string;
  iframesFrom: number;
  iframesUntil: number;
  state: PlayerState;
  stateUntil: number;
  downed: boolean;
  dead: boolean;
  driven: boolean;
}

/** A change the host's world made to a guest's body, for the guest to apply (times are the host's). */
export interface BodyDelta {
  hp?: number;
  full?: boolean;
  stam?: number;
  barrier?: [number, number];
  invuln?: number;
  meters?: Record<string, number>;
  active?: Record<string, number>;
  controls?: Record<string, number>;
  buffs?: Buff[];
  unbuff?: string[];
  heal?: { perS: number; until: number; interruptible: boolean }[];
  forced?: NonNullable<Entity['forced']>;
  iframes?: [number, number, 'all' | 'redOnly'];
  stagger?: number;
  move?: [number, number];
}

const buffKey = (b: Buff): string => `${b.id}|${b.sourceId}`;
const buffSig = (b: Buff): string => `${b.amount}|${b.until}|${b.stacks}`;

export function snapBody(e: Entity): BodySnap {
  const pl = e.pl!;
  const buffs = new Map<string, string>();
  for (const b of e.buffs ?? []) buffs.set(buffKey(b), buffSig(b));
  return {
    x: e.x,
    y: e.y,
    hp: e.hp!.hp,
    max: e.hp!.max,
    stam: e.stam?.cur ?? 0,
    barrier: e.hp!.barrier,
    barrierUntil: e.hp!.barrierUntil,
    invulnUntil: e.hp!.invulnUntil,
    meters: { ...e.st!.meters },
    active: { ...e.st!.active },
    controls: { ...e.st!.controls },
    buffs,
    heals: pl.healOver.length,
    forced: e.forced ? JSON.stringify(e.forced) : '',
    iframesFrom: pl.iframesFrom,
    iframesUntil: pl.iframesUntil,
    state: pl.state,
    stateUntil: pl.stateUntil,
    downed: pl.downed,
    dead: pl.deadUntilRest,
    driven: netHostDriven(pl),
  };
}

/** How far the host may move a puppet by itself and still be a nudge (a pull, the wind); further is a teleport. */
export const TELEPORT_PX = 48;

/** What the host's world changed on a puppet since `b` (null when nothing a guest needs to know). */
export function diffBody(b: BodySnap, e: Entity): BodyDelta | null {
  const pl = e.pl!;
  const hp = e.hp!;
  const d: BodyDelta = {};
  const life = pl.downed !== b.downed || pl.deadUntilRest !== b.dead;
  if (!life && Math.abs(hp.hp - b.hp) > 1e-6) {
    if (hp.hp >= hp.max - 0.5 && b.hp < hp.max - 0.5) d.full = true;
    else d.hp = hp.hp - b.hp;
  }
  const stam = e.stam?.cur ?? 0;
  if (Math.abs(stam - b.stam) > 1e-6) d.stam = stam - b.stam;
  if (hp.barrier !== b.barrier || hp.barrierUntil !== b.barrierUntil) d.barrier = [hp.barrier, hp.barrierUntil];
  if (hp.invulnUntil !== b.invulnUntil) d.invuln = hp.invulnUntil;
  const st = e.st!;
  for (const k of Object.keys(st.meters)) {
    const dv = (st.meters as Record<string, number>)[k]! - (b.meters[k] ?? 0);
    if (Math.abs(dv) > 1e-6) (d.meters ??= {})[k] = dv;
  }
  for (const k of Object.keys(st.active)) if ((st.active as Record<string, number>)[k] !== b.active[k]) (d.active ??= {})[k] = (st.active as Record<string, number>)[k]!;
  for (const k of Object.keys(st.controls)) if ((st.controls as Record<string, number>)[k] !== b.controls[k]) (d.controls ??= {})[k] = (st.controls as Record<string, number>)[k]!;
  const now = new Set<string>();
  for (const bf of e.buffs ?? []) {
    const k = buffKey(bf);
    now.add(k);
    if (b.buffs.get(k) !== buffSig(bf)) (d.buffs ??= []).push(JSON.parse(JSON.stringify(bf)) as Buff);
  }
  for (const k of b.buffs.keys()) if (!now.has(k)) (d.unbuff ??= []).push(k);
  if (pl.healOver.length > b.heals) d.heal = pl.healOver.slice(b.heals).map((h) => ({ ...h }));
  const forced = e.forced ? JSON.stringify(e.forced) : '';
  if (forced && forced !== b.forced) d.forced = { ...e.forced! };
  if (pl.iframesFrom !== b.iframesFrom || pl.iframesUntil !== b.iframesUntil) d.iframes = [pl.iframesFrom, pl.iframesUntil, pl.iframeKind];
  if (pl.state === 'stagger' && (b.state !== 'stagger' || pl.stateUntil !== b.stateUntil)) d.stagger = pl.stateUntil;
  // a small move the host made by itself (a pull, the wind) is passed on; while the host drives the body the guest
  // follows it anyway, and a big one is a teleport (SelfState.epoch)
  const mx = e.x - b.x;
  const my = e.y - b.y;
  if (!b.driven && !netHostDriven(pl) && !pl.downed && Math.hypot(mx, my) > 0.01 && Math.hypot(mx, my) < TELEPORT_PX) d.move = [mx, my];
  return Object.keys(d).length ? d : null;
}

/** A change big enough that the host's word replaces the guest's: a down, a revive, a respawn, a teleport. */
export function isOverride(b: BodySnap, e: Entity): boolean {
  const pl = e.pl!;
  return pl.downed !== b.downed || pl.deadUntilRest !== b.dead || Math.hypot(e.x - b.x, e.y - b.y) >= TELEPORT_PX;
}

/** Two changes in a row as one. */
export function mergeDelta(a: BodyDelta | null, b: BodyDelta): BodyDelta {
  if (!a) return b;
  const out: BodyDelta = { ...a, ...b };
  if (a.hp !== undefined || b.hp !== undefined) out.hp = (a.hp ?? 0) + (b.hp ?? 0);
  if (b.full) delete out.hp;
  else if (a.full && b.hp !== undefined) out.hp = b.hp;
  if (a.stam !== undefined || b.stam !== undefined) out.stam = (a.stam ?? 0) + (b.stam ?? 0);
  if (a.meters || b.meters) {
    out.meters = { ...a.meters };
    for (const [k, v] of Object.entries(b.meters ?? {})) out.meters[k] = (out.meters[k] ?? 0) + v;
  }
  if (a.active || b.active) out.active = { ...a.active, ...b.active };
  if (a.controls || b.controls) out.controls = { ...a.controls, ...b.controls };
  if (a.buffs || b.buffs) out.buffs = [...(a.buffs ?? []), ...(b.buffs ?? [])];
  if (a.unbuff || b.unbuff) out.unbuff = [...(a.unbuff ?? []), ...(b.unbuff ?? [])];
  if (a.heal || b.heal) out.heal = [...(a.heal ?? []), ...(b.heal ?? [])];
  if (a.move || b.move) out.move = [(a.move?.[0] ?? 0) + (b.move?.[0] ?? 0), (a.move?.[1] ?? 0) + (b.move?.[1] ?? 0)];
  return out;
}

/**
 * Guest: apply what the host's world did to this body. `off` turns the host's times into this screen's (they keep
 * how long they had left when the snapshot was sent).
 */
export function applyDelta(w: World, e: Entity, d: BodyDelta, off: number): void {
  const pl = e.pl!;
  const hp = e.hp!;
  const now = w.time;
  const t = (v: number): number => (v > 0 ? v + off : v);
  if (d.full) hp.hp = hp.max;
  if (d.hp) {
    hp.hp = Math.max(0, Math.min(hp.max, hp.hp + d.hp));
    if (d.hp < 0) checkDeath(w, e, hp.lastHitBy);
  }
  if (d.stam && e.stam) e.stam.cur = Math.max(0, Math.min(e.stam.max, e.stam.cur + d.stam));
  if (d.barrier) {
    hp.barrier = d.barrier[0];
    hp.barrierUntil = t(d.barrier[1]);
  }
  if (d.invuln !== undefined) hp.invulnUntil = Math.max(hp.invulnUntil, t(d.invuln));
  const st = e.st!;
  for (const [k, v] of Object.entries(d.meters ?? {})) if (k in st.meters) (st.meters as Record<string, number>)[k] = Math.max(0, Math.min(100, (st.meters as Record<string, number>)[k]! + v));
  for (const [k, v] of Object.entries(d.active ?? {})) if (k in st.active) (st.active as Record<string, number>)[k] = t(v);
  for (const [k, v] of Object.entries(d.controls ?? {})) if (k in st.controls) (st.controls as Record<string, number>)[k] = t(v);
  if (d.unbuff?.length && e.buffs) e.buffs = e.buffs.filter((b) => !d.unbuff!.includes(buffKey(b)));
  for (const b of d.buffs ?? []) {
    e.buffs ??= [];
    e.buffs = e.buffs.filter((x) => buffKey(x) !== buffKey(b));
    e.buffs.push({ ...b, until: t(b.until) });
  }
  for (const h of d.heal ?? []) pl.healOver.push({ ...h, until: t(h.until) });
  if (d.forced) e.forced = { ...d.forced, until: t(d.forced.until) };
  if (d.iframes) {
    pl.iframesFrom = t(d.iframes[0]);
    pl.iframesUntil = t(d.iframes[1]);
    pl.iframeKind = d.iframes[2];
  }
  if (d.stagger !== undefined && t(d.stagger) > now) interrupt(w, e, t(d.stagger) - now);
  if (d.move) w.room.moveCircle(e, d.move[0], d.move[1], false);
}

// ---------------------------------------------------------------- the guest's own body, each frame

/** Guest: one step of its own body on its own screen (the host's own order: controller, movement, statuses). */
export function stepBody(w: World, e: Entity, dt: number): void {
  e.px = e.x;
  e.py = e.y;
  updatePlayer(w, e, dt);
  updateMovement(w, dt, e);
  updateStatuses(w, dt, e);
}
