// The guest (NETCODE §2, §5, §6). Its own body is its own (D338): it runs on this screen at full speed (walking,
// dodges and their i-frames, blocks, parries, swings and their hits on enemies, the Thermos, statuses) and is sent
// to the host every frame. Enemies' hits on it are found by the host and decided here, at the moment this screen
// shows them land. Everything else is the host's world, mirrored from snapshots for the normal renderer (drawn a
// little behind the host, interpolated; walking enemies are led a little toward now). The guest keeps its own
// character in sync (ops in, whole character out).
import { BOSSES } from '../../data/bosses';
import { ENEMIES } from '../../data/enemies';
import { dist } from '../../engine/math';
import type { InputFrame } from '../../engine/input/actions';
import { spawnEnemy } from '../enemies/spawn';
import { PLAYER_DOT_DY, PLAYER_DOT_R, refreshDerived, spawnPlayer } from '../player/player';
import { hitPlayer } from '../combat/damage';
import { shapeHit } from '../combat/patterns';
import { guestZoneBeaten } from '../save/coopProgress';
import { generateZone, type ZoneLayout } from '../procgen/zone';
import { Room } from '../room';
import { HOST_RUN_STATES, World, type Entity, type EType, type PlayerState } from '../world';
import { applyCharOp, cloneChar, type CharOp } from './charSync';
import { CH, SNAP_HZ, encodeInput, gameVersion, seqNewer, type Cmd, type Hello, type LobbyState, type NetEvent, type Welcome } from './protocol';
import { HostClock } from './clock';
import { ARCANE_ORB_SPIN } from '../enemies/ai';
import { CONTROL_BITS, ENEMY_STATES, F, ORB_BASE, ORB_STEPS, PLAYER_STATES, POSES, STATUS_BITS, decodeSnap, fromB64, type EntityMeta, type Rec, type RoomSync, type SelfState } from './snapshot';
import { applyDelta, bodyReportOf, comboFromWire, encodeBody, stepBody } from './body';
import type { IncomingHit, NetAct } from './acts';
import type { NetChannel, Transport } from './transport';
import type { AttackDef, BossDef, Character, EliteAffix, EnemyDef, SaveFile } from '../types';

/**
 * The walking animation on the guest's mirror (D151): the host's simulation sets how much a body is walking, but the
 * mirror only moves bodies to where the snapshots say, so it measures that step instead (eased so a snapshot's
 * uneven steps do not make the feet stutter).
 */
function walkAnim(e: Entity, moved: number, dt: number): void {
  const a = e.anim as { moving?: number };
  const raw = dt > 0 ? Math.min(1, moved / dt / 45) : 0;
  a.moving = (a.moving ?? 0) + (raw - (a.moving ?? 0)) * Math.min(1, dt * 12);
  if (a.moving < 0.02) a.moving = 0;
}

/** An enemy's or boss's attack by id: its own (a boss's in every phase), its phase two, and any attack they chain into (D149). */
export function findAttack(def: EnemyDef | BossDef, id: string): AttackDef | null {
  const seen = new Set<AttackDef>();
  const stack: AttackDef[] = 'phases' in def ? def.phases.flatMap((p) => p.attacks) : [...def.attacks, ...(def.phase2?.attacks ?? [])];
  while (stack.length) {
    const a = stack.pop()!;
    if (seen.has(a)) continue;
    seen.add(a);
    if (a.id === id) return a;
    if (a.chain) stack.push(a.chain);
  }
  return null;
}

/** How far ahead of the interpolated time a walking enemy is drawn, at most (D338): closer to where it really is. */
export const ENEMY_LEAD_S = 0.05;
/** A hit on this body that arrives early waits for this screen to show it land, but never longer than this (D338). */
export const HIT_HOLD_MAX_S = 0.6;
/** A little room around a hit's area when this screen checks it against the body (rounding, one frame). */
export const HIT_AREA_SLACK = 4;

interface Sample {
  t: number;
  x: number;
  y: number;
}

export class NetGuest {
  state: 'connecting' | 'lobby' | 'game' | 'rejected' | 'closed' = 'connecting';
  hostId: string | null = null;
  lobby: LobbyState | null = null;
  welcome: Welcome | null = null;
  rejectReason = '';
  /** the mirror world the guest draws, where its own body runs */
  cw = new World('mirror');
  layout: ZoneLayout | null = null;
  me: Entity | null = null;
  /** minimap data from the host */
  visited: string[] = [];
  cleared: string[] = [];
  nodeId = '';
  nodeKind = '';
  rtt = 0;
  /** the host's friendly-fire percent (D115): from the lobby, then from every snapshot; null until heard */
  hostFriendlyFire: number | null = null;
  // callbacks for the scene
  onLobby: () => void = () => undefined;
  onWelcome: () => void = () => undefined;
  onReject: (reason: string) => void = () => undefined;
  onEvent: (e: NetEvent) => void = () => undefined;
  onCharChanged: () => void = () => undefined;
  onHostLeft: () => void = () => undefined;

  private rev = 0;
  private seq = 0;
  private tick = 0;
  private samples = new Map<number, Sample[]>();
  private meta = new Map<number, EntityMeta>();
  /** the host's clock, smoothed against network jitter (D149) */
  private hostClock = new HostClock(1 / SNAP_HZ);
  /** the host's last word on this body (SelfState); its epoch is quoted back in every body packet (D338) */
  self: SelfState | null = null;
  private epoch = 0;
  /** where the host has this body while it runs one of its skills (the body follows) */
  private followTo: { x: number; y: number } | null = null;
  /** the input seq when a skill was asked of the host: once the host has seen it and is not running it, stop waiting */
  private awaitSeq = -1;
  /** hits on this body waiting for this screen's clock to reach them (D338) */
  private inbox: (IncomingHit & { by: number })[] = [];
  /** damage this screen dealt to an enemy that the host has not shown yet, so its bar does not jump back (D338) */
  private hpDebt = new Map<number, { amt: number; at: number }>();
  private lastRecHp = new Map<number, number>();
  /** how much of this frame's outgoing acts noteOwnHits has counted */
  private outSeen = 0;
  /** how far ahead each walking enemy is drawn now (eased) */
  private lead = new Map<number, number>();
  /** a knockback this screen gave an enemy, shown until the host's own arrives (D338) */
  private nudge = new Map<number, { x: number; y: number }>();
  /** enemy shots that hit this body: hidden here until the host removes them */
  private spent = new Set<number>();
  private gearKey = '';
  private roomKey = '';
  private ch: {
    hello: NetChannel<Hello & Record<string, unknown>>;
    input: NetChannel<ArrayBuffer>;
    cmd: NetChannel<Cmd & Record<string, unknown>>;
    char: NetChannel<{ ack: number; char: Character }>;
    ping: NetChannel<{ t: number }>;
    body: NetChannel<ArrayBuffer>;
    act: NetChannel<{ a: NetAct[] }>;
  };

  constructor(
    public t: Transport,
    public save: SaveFile,
    private clock: () => number = () => performance.now() / 1000,
  ) {
    this.ch = { hello: t.channel(CH.hello), input: t.channel(CH.input), cmd: t.channel(CH.cmd), char: t.channel(CH.char), ping: t.channel(CH.ping), body: t.channel(CH.body), act: t.channel(CH.act) };
    t.channel<LobbyState & Record<string, unknown>>(CH.lobby).onMessage((l, from) => {
      // the host's lobby goes to everyone on the channel: a turned-away guest is not in it (D156: it used to wipe the
      // rejection off the screen and look like a normal lobby, just without them)
      if (this.state === 'rejected') return;
      this.hostId = from;
      this.lobby = l;
      this.setFriendlyFire(l.ff);
      if (this.state === 'connecting') this.state = 'lobby';
      this.onLobby();
    });
    t.channel<{ reason: string }>(CH.reject).onMessage((r, from) => {
      // a guest already playing never gives up its seat over a stray rejection (D156)
      if (this.state === 'game' || (this.hostId && from !== this.hostId)) return;
      this.state = 'rejected';
      this.rejectReason = r.reason;
      this.onReject(r.reason);
    });
    t.channel<Welcome & Record<string, unknown>>(CH.welcome).onMessage((wm, from) => this.onWelcomeMsg(wm, from));
    t.channel<ArrayBuffer>(CH.snap).onMessage((b, from) => {
      if (from === this.hostId) this.applySnap(b);
    });
    t.channel<NetEvent & Record<string, unknown>>(CH.event).onMessage((e, from) => {
      if (from === this.hostId) this.onNetEvent(e);
    });
    t.channel<{ rev: number; ops: CharOp[] }>(CH.charop).onMessage((m, from) => {
      if (from === this.hostId) this.onOps(m.rev, m.ops);
    });
    t.channel<{ t: number }>(CH.pong).onMessage((p) => {
      this.rtt = Math.max(0, this.clock() - p.t);
    });
    // someone new on the channel: greet again only while still looking for the host (D156: guests already in the
    // lobby or the game used to greet on every newcomer, and a host mid-game rejected them, freezing their game)
    t.onPeerJoin(() => {
      if (this.state === 'connecting') this.sayHello();
    });
    t.onPeerLeave((id) => {
      if (id === this.hostId) {
        this.state = 'closed';
        this.onHostLeft();
      }
    });
    this.sayHello();
  }

  sayHello(): void {
    const c = this.save.character;
    const h: Hello = { version: gameVersion(), playerId: c.playerId, name: c.name, classId: c.classId, level: c.level, char: cloneChar(c) };
    this.ch.hello.send(h as Hello & Record<string, unknown>, this.hostId);
  }

  /** Tell the host about a change made on this side (equip, level up, gems, spells, two-handing, a weapon swap). */
  syncChar(): void {
    if (!this.hostId) return;
    this.ch.char.send({ ack: this.rev, char: cloneChar(this.save.character) }, this.hostId);
    if (this.me?.pl) refreshDerived(this.me);
    this.gearKey = this.gearOf();
  }

  command(c: Cmd): void {
    if (this.hostId) this.ch.cmd.send(c as Cmd & Record<string, unknown>, this.hostId);
  }

  ping(): void {
    if (this.hostId) this.ch.ping.send({ t: this.clock() }, this.hostId);
  }

  leave(): void {
    this.command({ op: 'leave' });
    this.state = 'closed';
    this.t.leave();
  }

  // ------------------------------------------------------------------ messages

  private onWelcomeMsg(wm: Welcome, from: string): void {
    this.hostId = from;
    this.welcome = wm;
    this.state = 'game';
    this.resetWorld();
    this.hostClock.reset(wm.time, this.clock());
    this.buildLayout(wm.seed, wm.zone, wm.cycle, wm.layoutOpts);
    this.onWelcome();
  }

  private resetWorld(): void {
    this.cw = new World('mirror');
    // this world's own body sends what it does to the host (D338)
    this.cw.netGuest = { out: [] };
    if (this.hostFriendlyFire !== null) this.cw.friendlyFire = this.hostFriendlyFire / 100;
    this.me = null;
    this.samples.clear();
    this.meta.clear();
    this.self = null;
    this.epoch = 0;
    this.followTo = null;
    this.inbox = [];
    this.hpDebt.clear();
    this.lastRecHp.clear();
    this.outSeen = 0;
    this.lead.clear();
    this.nudge.clear();
    this.spent.clear();
    this.roomKey = '';
  }

  private buildLayout(seed: string, zone: number, cycle: number, o: { tutorial: boolean; fewSpells: boolean }): void {
    this.layout = generateZone(seed, zone, { cycle, tutorial: o.tutorial, fewSpells: o.fewSpells });
    this.cw.zone = zone;
    this.cw.cycle = cycle;
  }

  private onNetEvent(e: NetEvent): void {
    if (e.t === 'zone') this.buildLayout(e.seed, e.zone, e.cycle, e.layoutOpts);
    if (e.t === 'toLobby') {
      this.state = 'lobby';
      this.resetWorld();
    }
    if (e.t === 'hostLeft') {
      this.state = 'closed';
      this.onHostLeft();
      return;
    }
    // what this guest's own world keeps from the zone just beaten (D195); saved with the character
    if (e.t === 'zoneBeaten' && guestZoneBeaten(this.save, e.zone, e.cycle)) this.onCharChanged();
    this.onEvent(e);
  }

  private onOps(rev: number, ops: CharOp[]): void {
    const c = this.save.character;
    for (const o of ops) applyCharOp(c, o);
    this.rev = rev;
    if (this.me?.pl && ops.some((o) => o.op === 'gear' || o.op === 'set' || o.op === 'prof')) refreshDerived(this.me);
    this.gearKey = this.gearOf();
    this.onCharChanged();
  }

  // ------------------------------------------------------------------ snapshots → mirror world

  private applySnap(b: ArrayBuffer): void {
    const s = decodeSnap(b);
    const now = this.clock();
    this.noteOwnHits();
    this.hostClock.sample(s.time, now);
    const j = s.json;
    if (j.room) this.applyRoom(j.room);
    if (j.meta) for (const [id, m] of Object.entries(j.meta)) this.meta.set(Number(id), m);
    for (const r of s.recs) this.applyRec(r, s.time);
    for (const id of s.removed) {
      const e = this.cw.entities.get(id);
      if (e === this.me) this.me = null;
      if (e) {
        e.removed = true;
        this.cw.entities.delete(id);
      }
      this.samples.delete(id);
      this.meta.delete(id);
      this.lead.delete(id);
      this.nudge.delete(id);
      this.spent.delete(id);
      this.hpDebt.delete(id);
      this.lastRecHp.delete(id);
    }
    this.cw.refreshLists();
    this.cw.bossId = j.bossId ?? 0;
    if (j.roomMods) {
      this.cw.roomMods.dark = j.roomMods.dark;
      this.cw.roomMods.floodUntil = j.roomMods.floodUntil;
      // how hard the water slows (the Bloatking's phase-two flood is 30%) and the Lightning bonus on magic (D345)
      if (typeof j.roomMods.floodSlow === 'number') this.cw.roomMods.floodSlow = j.roomMods.floodSlow;
      if (typeof j.roomMods.lightningBonusUntil === 'number') this.cw.roomMods.lightningBonusUntil = j.roomMods.lightningBonusUntil;
    }
    this.setFriendlyFire(j.ff);
    if (j.ev) this.cw.events.push(...j.ev);
    if (j.self) this.applySelf(j.self, s.time);
  }

  /** The host's friendly fire, as sent (a missing or broken value leaves the last one). */
  private setFriendlyFire(v: unknown): void {
    if (typeof v !== 'number' || !Number.isFinite(v)) return;
    this.hostFriendlyFire = Math.max(0, Math.min(200, Math.round(v)));
    this.cw.friendlyFire = this.hostFriendlyFire / 100;
  }

  private applyRoom(r: RoomSync): void {
    const room = new Room(fromB64(r.tiles));
    room.overlay = fromB64(r.overlay);
    if (r.terrain) room.terrain = fromB64(r.terrain);
    room.id = r.key;
    room.hazardKind = r.hazardKind;
    room.rotFloor = r.rotFloor;
    room.movers = r.movers ?? [];
    for (const s of ['n', 's', 'e', 'w'] as const) {
      const d = r.doors[s];
      if (d) Object.assign(room.doors[s], d);
    }
    room.version = r.version;
    if (r.key !== this.roomKey) {
      // a new room: everything from the old one is gone
      this.roomKey = r.key;
      for (const [id, e] of this.cw.entities) if (e !== this.me) this.cw.entities.delete(id);
      this.inbox = [];
    }
    this.cw.room = room;
    this.nodeId = r.nodeId;
    this.nodeKind = r.kind;
    this.visited = r.visited;
    this.cleared = r.cleared;
  }

  private create(r: Rec, m: EntityMeta): Entity | null {
    const w = this.cw;
    const x = r.x / 2;
    const y = r.y / 2;
    let e: Entity;
    if (m.t === 'player') {
      const mine = m.pid === this.save.character.playerId;
      const char = mine ? this.save.character : (m.char as Character);
      e = spawnPlayer(w, char, m.slot, mine, x, y);
      e.pl!.remote = !mine;
      if (mine) {
        // this screen's own body (D338); a body the host replaced goes
        if (this.me && this.me !== e) this.cw.entities.delete(this.me.id);
        e.pl!.net = 'body';
        this.me = e;
        this.gearKey = this.gearOf();
      }
    } else if (m.t === 'enemy') {
      const def = ENEMIES[m.def] ?? BOSSES[m.def];
      if (!def) return null;
      e = spawnEnemy(w, def, x, y, { tellS: 0, elite: m.elite as EliteAffix | null, pieceIndex: m.piece, illusion: m.illusion });
      e.drawId = m.drawId;
      e.radius = m.r;
      // the host's max HP (co-op scaling, D159): the mirror's own would be a solo enemy's (D340)
      if (m.hm && e.hp) e.hp.max = m.hm;
      // held in its phase on the host (D278): this screen's own hits must not start a phase change either (D361)
      if (m.bonus) e.en!.bonusBoss = true;
    } else {
      e = w.spawn(m.type as EType, x, y, { drawId: m.drawId, radius: m.r, team: m.team as Entity['team'], ...(m.c as Partial<Entity>) });
    }
    // take the host's id
    w.entities.delete(e.id);
    e.id = r.id;
    w.entities.set(r.id, e);
    return e;
  }

  private refreshMeta(e: Entity, m: EntityMeta): void {
    if (m.t === 'player' && e !== this.me && e.pl) {
      e.pl.char = m.char as Character;
      refreshDerived(e);
    } else if (m.t === 'enemy' && e.en) {
      e.radius = m.r;
      e.drawId = m.drawId;
      e.en.linkedTo = m.linkedTo;
      if (m.gaze !== undefined) e.en.gaze = m.gaze;
      if (m.hm && e.hp) e.hp.max = m.hm;
      e.en.bonusBoss = m.bonus === true;
    } else if (m.t === 'other') {
      Object.assign(e, m.c);
      e.drawId = m.drawId;
    }
  }

  private applyRec(r: Rec, t: number): void {
    const w = this.cw;
    let e = w.entities.get(r.id) ?? null;
    const m = this.meta.get(r.id);
    if (!m) {
      this.command({ op: 'fullPlease' });
      return;
    }
    if (e && e.removed) e = null;
    if (!e) {
      e = this.create(r, m);
      if (!e) return;
    } else this.refreshMeta(e, m);
    const x = r.x / 2;
    const y = r.y / 2;
    if (e === this.me) {
      // this body is this screen's own (D338): from the host only what the host decides, the revive ring
      const pl = e.pl!;
      pl.reviveProgress = r.extra / 100;
      pl.reviveNeed = Math.max(1, r.extra2 / 100);
      // while the host runs one of its skills, the host's picture of it is the one to draw
      if (pl.netFollow) {
        e.facing = (r.facing / 256) * Math.PI * 2;
        e.anim.pose = POSES[r.pose] ?? 'idle';
        e.anim.poseT = r.poseT / 50;
        comboFromWire(e, r.cIdx, r.cPhase, r.cK, (r.flags & F.charging) !== 0);
      }
      return;
    }
    const list = this.samples.get(r.id) ?? [];
    list.push({ t, x, y });
    if (list.length > 12) list.shift();
    this.samples.set(r.id, list);
    e.facing = (r.facing / 256) * Math.PI * 2;
    const a = e.anim;
    a.pose = POSES[r.pose] ?? 'idle';
    a.poseT = r.poseT / 50;
    a.alpha = this.spent.has(r.id) ? 0 : r.alpha / 255;
    a.scale = r.scale / 64;
    a.squash = r.squash / 100;
    a.tint = r.flags & F.red ? 'red' : r.flags & F.blue ? 'blue' : null;
    // a flash this screen started (its own hit) runs its course
    if (r.flags & F.flash) a.flashUntil = Math.max(a.flashUntil, t + 0.08);
    if (e.hp) {
      const hpNow = (e.hp.max * r.hp) / 1000;
      // damage this screen dealt and the host has not shown yet stays off the bar (D338)
      const prev = this.lastRecHp.get(r.id);
      const debt = this.hpDebt.get(r.id);
      if (debt) {
        if (prev !== undefined && hpNow < prev) debt.amt -= prev - hpNow;
        if (debt.amt <= 0 || this.cw.time - debt.at > 1.2) this.hpDebt.delete(r.id);
      }
      this.lastRecHp.set(r.id, hpNow);
      e.hp.hp = Math.max(0, hpNow - (this.hpDebt.get(r.id)?.amt ?? 0));
      e.hp.dead = (r.flags & F.dead) !== 0;
      e.hp.invulnUntil = r.flags & F.invuln ? t + 0.2 : 0;
      e.hp.staggerUntil = r.flags & F.stagger ? t + 0.2 : 0;
    }
    // statuses and controls for the particles and icons
    if (e.st) {
      STATUS_BITS.forEach((k, i) => {
        e.st!.active[k] = r.status & (1 << i) ? t + 0.3 : 0;
      });
      CONTROL_BITS.forEach((k, i) => {
        e.st!.controls[k] = r.status & (1 << (5 + i)) ? t + 0.3 : 0;
      });
    }
    if (e.en) {
      const en = e.en;
      en.state = ENEMY_STATES[r.state] ?? 'alert';
      // when a new phase began, for the transition's animation (a scripted one plays over its own length, D279)
      if (r.extra !== en.phase || (r.flags & F.transition && en.phaseTransitionUntil <= t)) en.extrasUsed.__phaseAt = t;
      en.phase = r.extra;
      en.phaseTransitionUntil = r.flags & F.transition ? t + 0.3 : 0;
      en.fadeUntil = r.flags & F.faded ? t + 0.2 : 0;
      // an Arcane Elite's orbs (D340): where the host has them, wound back to the time this screen shows
      if (r.extra2 >= ORB_BASE) en.eliteOrbAngle = ((r.extra2 - ORB_BASE) / ORB_STEPS) * Math.PI * 2 + ARCANE_ORB_SPIN * (this.cw.time - t);
      const k = r.extra2 >= ORB_BASE ? 1 : r.extra2 / 1000;
      en.spawnedAt = t - k;
      en.spawnUntil = t + (1 - k);
      en.attack = this.mirrorAttack(e, m, r);
    }
    if (e.pl) {
      const pl = e.pl;
      pl.state = PLAYER_STATES[r.state] ?? 'idle';
      pl.downed = (r.flags & F.downed) !== 0;
      pl.deadUntilRest = (r.flags & F.deadUntilRest) !== 0;
      pl.blocking = (r.flags & F.blocking) !== 0;
      pl.parryUntil = r.flags & F.parry ? t + 0.1 : 0;
      pl.reviveProgress = r.extra / 100;
      pl.reviveNeed = Math.max(1, r.extra2 / 100);
      // D329: another player's downed countdown
      if (pl.downed) {
        pl.ghostUntil = t + (r.ghost & 127);
        pl.ghostPauseUntil = r.ghost & 128 ? t + 0.25 : 0;
      }
      comboFromWire(e, r.cIdx, r.cPhase, r.cK, (r.flags & F.charging) !== 0);
    }
    if (e.pr?.lob) e.pr.lob.t = (r.extra / 1000) * e.pr.lob.dur;
    if (e.it) e.it.used = (r.flags & F.used) !== 0;
  }

  /**
   * The enemy's attack as the host runs it (D149): the real attack, found by the id the host sends, in the phase its
   * state shows, timed from when this guest first saw that phase. It used to be a stand-in with no element, which made
   * the renderer throw on every Red or Blue windup and drop every enemy from that frame.
   */
  private mirrorAttack(e: Entity, m: EntityMeta, r: Rec): NonNullable<NonNullable<Entity['en']>['attack']> | null {
    const en = e.en!;
    const phase = en.state === 'windup' ? 'windup' : en.state === 'attack' ? 'active' : en.state === 'recover' ? 'recover' : null;
    const id = m.t === 'enemy' ? m.atk : undefined;
    const def = id ? findAttack(en.def, id) : null;
    // the parts of a running attack this screen's own hits may touch (a stagger or a parry cancels it, D338)
    const run = { targetId: 0, aimX: e.x, aimY: e.y, teleIds: [] as number[], fired: false, comboIdx: 0, moveDone: false, hit: new Set<number>(), usedBudget: false };
    if (!phase || !def) {
      // no attack id (an old host): keep the Red / Blue windup icon with a plain element
      const kind = r.flags & F.windRed ? 'red' : r.flags & F.windPierce ? 'pierce' : null;
      return kind ? ({ ...run, phase: 'windup', t: 0, windup: 1, active: 0.1, recover: 0.3, angle: e.facing, def: { id: '', kind, type: 'physical', windupMs: 1000, recoverMs: 300 } } as unknown as NonNullable<typeof en.attack>) : null;
    }
    const cur = en.attack;
    if (cur && cur.def === def && cur.phase === phase) return cur;
    return { ...run, def, phase, t: 0, windup: def.windupMs / 1000, active: (def.activeMs ?? 100) / 1000, recover: def.recoverMs / 1000, angle: e.facing } as unknown as NonNullable<typeof en.attack>;
  }

  /** The host's word on this body (D338): its overrides, cooldowns, the skill it is running, changes, and hits. */
  private applySelf(s: SelfState, snapTime: number): void {
    this.self = s;
    const e = this.me;
    if (!e?.pl || !e.hp) return;
    const pl = e.pl;
    const w = this.cw;
    // the host's times, as this screen's: what was left of them when the snapshot was sent
    const off = w.time - snapTime;
    const conv = (v: number): number => (v > 0 ? v + off : v);
    if (s.epoch !== this.epoch) {
      // the host overrode the body (a down, a revive, a respawn, a teleport): its place and HP are the host's
      this.epoch = s.epoch;
      e.x = e.px = s.x;
      e.y = e.py = s.y;
      e.forced = null;
      e.hp.hp = Math.max(0, Math.min(e.hp.max, s.hp));
      e.hp.dead = false;
      if (s.downed && !pl.downed) {
        pl.combo = null;
        pl.action = null;
        pl.channel = null;
        pl.charge = null;
        pl.falling = null;
        pl.healOver = [];
      }
      pl.state = 'idle';
      pl.netFollow = false;
      this.inbox = [];
    }
    pl.downed = s.downed;
    pl.deadUntilRest = s.dead;
    pl.ghostUntil = conv(s.ghostUntil);
    pl.ghostPauseUntil = conv(s.ghostPauseUntil);
    pl.skillReadyAt = [conv(s.skillReadyAt[0] ?? 0), conv(s.skillReadyAt[1] ?? 0), conv(s.skillReadyAt[2] ?? 0)];
    pl.spellReadyAt = [conv(s.spellReadyAt[0] ?? 0), conv(s.spellReadyAt[1] ?? 0), conv(s.spellReadyAt[2] ?? 0)];
    // the host is running one of this body's skills, spells or consumables: the body follows the host until it ends
    if (s.follow && !pl.downed) {
      if (!pl.netFollow) {
        pl.combo = null;
        pl.blocking = false;
      }
      pl.netFollow = true;
      pl.netAwaitUntil = 0;
      pl.state = (HOST_RUN_STATES.has(s.state as PlayerState) ? s.state : 'skill') as PlayerState;
      this.followTo = { x: s.x, y: s.y };
    } else if (pl.netFollow) {
      pl.netFollow = false;
      pl.state = 'idle';
      pl.action = null;
      this.followTo = null;
    } else if ((pl.netAwaitUntil ?? 0) > w.time && this.awaitSeq >= 0 && !seqNewer(this.awaitSeq, s.lastSeq)) {
      // the host has seen the press and is not running it (on cooldown there, out of stamina…): stop waiting
      pl.netAwaitUntil = 0;
      this.awaitSeq = -1;
    }
    if (s.delta) applyDelta(w, e, s.delta, off);
    for (const h of s.hits ?? []) this.inbox.push({ ...h, by: w.time });
  }

  // ------------------------------------------------------------------ per frame

  /** Host time estimate for "now". */
  hostNow(): number {
    return this.hostClock.now(this.clock());
  }

  /**
   * One frame: send this frame's input, move the mirror (others interpolated), decide the hits on this body that
   * this screen now shows landing, step this body, and send it and what it did to the host.
   */
  frame(input: InputFrame, dt: number): void {
    if (this.state !== 'game' || !this.hostId) return;
    this.seq = (this.seq + 1) & 0xffff;
    this.tick++;
    this.ch.input.send(encodeInput({ seq: this.seq, tick: this.tick, frame: input }), this.hostId);
    const w = this.cw;
    // draw a little behind the newest snapshot: how far depends on how jittery this connection is (D149). This
    // screen's own body lives on the same clock, so what it does lines up with what it sees.
    const renderT = this.hostNow() - this.hostClock.delay(dt);
    w.time = renderT < w.time - 1 ? renderT : Math.max(w.time, renderT);
    // mirrored enemy attacks run their own clock between snapshots (windup glow and motes)
    for (const e of w.entities.values()) {
      if (e.en?.attack) e.en.attack.t += dt;
      // an Arcane Elite's orbs keep circling between snapshots (D340)
      if (e.en?.elite === 'arcane' && e.en.state !== 'spawning') e.en.eliteOrbAngle += dt * ARCANE_ORB_SPIN;
    }
    this.interpolate(dt);
    const me = this.me;
    if (!me?.pl) return;
    this.decideHits(me);
    // this body, at full speed on this screen (D338)
    me.pl.input = input;
    const awaitBefore = me.pl.netAwaitUntil ?? 0;
    if (me.pl.netFollow && this.followTo) {
      const k = Math.min(1, dt / 0.08);
      me.x += (this.followTo.x - me.x) * k;
      me.y += (this.followTo.y - me.y) * k;
    }
    const mx0 = me.x;
    const my0 = me.y;
    stepBody(w, me, dt);
    if (me.pl.netFollow) walkAnim(me, dist(mx0, my0, me.x, me.y), dt);
    if ((me.pl.netAwaitUntil ?? 0) > awaitBefore) this.awaitSeq = this.seq;
    // two-handing or a weapon swap done on this screen: the host's copy of the character follows
    const gk = this.gearOf();
    if (gk !== this.gearKey) this.syncChar();
    this.noteOwnHits();
    const out = w.netGuest?.out ?? [];
    this.ch.body.send(encodeBody(bodyReportOf(me, w.time, this.seq, this.epoch)), this.hostId);
    if (out.length) {
      this.ch.act.send({ a: out.splice(0, out.length) }, this.hostId);
    }
    this.outSeen = 0;
  }

  /** This screen's own hits not yet counted: their damage stays off the mirrored bars until the host shows it. */
  private noteOwnHits(): void {
    const w = this.cw;
    const out = w.netGuest?.out ?? [];
    for (let i = this.outSeen; i < out.length; i++) {
      const a = out[i]!;
      if (a.t !== 'hit' || a.dmg <= 0) continue;
      const d = this.hpDebt.get(a.id) ?? { amt: 0, at: w.time };
      d.amt += a.dmg;
      d.at = w.time;
      this.hpDebt.set(a.id, d);
    }
    this.outSeen = out.length;
  }

  /** Others: interpolate between the two samples around the drawn time; walking enemies are led toward now (D338). */
  private interpolate(dt: number): void {
    const w = this.cw;
    const renderT = w.time;
    for (const [id, list] of this.samples) {
      const e = w.entities.get(id);
      if (!e || e === this.me || !list.length) continue;
      // an enemy that is not winding up or attacking is drawn a little ahead, where it is more nearly now; one
      // attacking is drawn exactly as the host ran it, so its swing lines up with its telegraph
      let lead = this.lead.get(id) ?? 0;
      const want = e.en && !e.en.attack && e.en.state !== 'windup' && e.en.state !== 'attack' && e.en.state !== 'recover' ? ENEMY_LEAD_S : 0;
      lead += (want - lead) * Math.min(1, dt * 8);
      this.lead.set(id, lead);
      const at = renderT + lead;
      let a = list[0]!;
      let b = list[list.length - 1]!;
      for (let i = 0; i < list.length - 1; i++) {
        if (list[i]!.t <= at && list[i + 1]!.t >= at) {
          a = list[i]!;
          b = list[i + 1]!;
          break;
        }
      }
      if (at > b.t && list.length >= 2) a = list[list.length - 2]!;
      let x = b.x;
      let y = b.y;
      if (b.t > a.t) {
        // past the newest sample: carry on along its last step for at most 100 ms
        const k = Math.max(0, Math.min(1 + 0.1 / Math.max(0.01, b.t - a.t), (at - a.t) / (b.t - a.t)));
        x = a.x + (b.x - a.x) * k;
        y = a.y + (b.y - a.y) * k;
      }
      // a knockback this screen gave: shown at once, fading out as the host's own arrives
      const n = this.nudge.get(id);
      if (e.forced && e.forced.until > renderT && e.en) {
        const nn = n ?? { x: 0, y: 0 };
        nn.x += e.forced.vx * dt;
        nn.y += e.forced.vy * dt;
        this.nudge.set(id, nn);
      } else if (e.forced) e.forced = null;
      const nd = this.nudge.get(id);
      if (nd) {
        x += nd.x;
        y += nd.y;
        const fade = Math.exp(-dt / 0.25);
        nd.x *= fade;
        nd.y *= fade;
        if (Math.abs(nd.x) + Math.abs(nd.y) < 0.2) this.nudge.delete(id);
      }
      walkAnim(e, dist(x, y, e.x, e.y), dt);
      e.px = e.x = x;
      e.py = e.y = y;
    }
  }

  /**
   * The hits on this body that this screen now shows landing (D338): each is decided here, with this body's own dodge,
   * block, parry and place at that moment, and the outcome goes back to the host.
   */
  private decideHits(me: Entity): void {
    const w = this.cw;
    if (!this.inbox.length) return;
    const due = this.inbox.filter((h) => h.at <= w.time || w.time - h.by >= HIT_HOLD_MAX_S);
    if (!due.length) return;
    this.inbox = this.inbox.filter((h) => !due.includes(h));
    const out = w.netGuest!.out;
    for (const h of due) {
      let res = 'none';
      let dmg = 0;
      let grab = false;
      const pl = me.pl!;
      if (!pl.downed && !pl.deadUntilRest && me.hp!.hp > 0) {
        const ar = h.area;
        const dot = !!ar?.dot;
        const inside = !ar || shapeHit(ar.s, ar.tau, me.x, me.y + (dot ? PLAYER_DOT_DY : 0), (dot ? PLAYER_DOT_R : me.radius) + HIT_AREA_SLACK, w.room);
        if (!inside) res = 'miss';
        else {
          const before = me.hp!.hp + (me.hp!.barrierUntil > w.time ? me.hp!.barrier : 0);
          const held = pl.state === 'held';
          const proj = h.projId ? w.get(h.projId) : undefined;
          res = hitPlayer(w, h.attackerId, me, h.spec, h.fx, h.fy, proj);
          dmg = Math.max(0, before - (me.hp!.hp + (me.hp!.barrierUntil > w.time ? me.hp!.barrier : 0)));
          grab = !held && pl.state === 'held';
          if (proj && (res === 'hit' || res === 'blocked')) this.spent.add(proj.id);
        }
      }
      out.push({ t: 'took', h: h.h, res, dmg, ...(grab ? { grab: true } : {}) });
    }
  }

  /** What this screen changes about the weapons in hand (two-handing, swaps), to sync with the host. */
  private gearOf(): string {
    const c = this.save.character;
    return `${c.twoHanded}|${c.equipment.main?.id ?? ''}|${c.equipment.off?.id ?? ''}|${c.altMain?.id ?? ''}|${c.altOff?.id ?? ''}`;
  }
}
