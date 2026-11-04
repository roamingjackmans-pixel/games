// The guest (NETCODE §2, §5, §6): sends inputs at 60 Hz, mirrors the host's world from snapshots for the
// normal renderer (everything 100 ms behind, interpolated), predicts its own walking and reconciles
// against the host, and keeps its own character in sync (ops in, whole character out).
import { BOSSES } from '../../data/bosses';
import { ENEMIES } from '../../data/enemies';
import { dist } from '../../engine/math';
import { ACTION_BIT, type InputFrame } from '../../engine/input/actions';
import { spawnEnemy } from '../enemies/spawn';
import { ATTACK_MOVE, DODGE_DIST, DODGE_S, refreshDerived, spawnPlayer } from '../player/player';
import { generateZone, type ZoneLayout } from '../procgen/zone';
import { Room } from '../room';
import { terrainWalkMult } from '../systems/terrain';
import { World, type Entity, type EType } from '../world';
import { applyCharOp, cloneChar, type CharOp } from './charSync';
import { CH, SNAP_HZ, encodeInput, gameVersion, seqNewer, type Cmd, type Hello, type LobbyState, type NetEvent, type Welcome } from './protocol';
import { HostClock } from './clock';
import { CONTROL_BITS, ENEMY_STATES, F, PLAYER_STATES, POSES, STATUS_BITS, decodeSnap, fromB64, type EntityMeta, type Rec, type RoomSync, type SelfState } from './snapshot';
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

const COMBO_PHASES = ['', 'windup', 'active', 'recovery'] as const;

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
  /** the mirror world the guest draws */
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
  /** inputs the host has not acknowledged yet, each with the speed this screen walked it at (D154) */
  private pending: { seq: number; dt: number; mx: number; my: number; sp: number; fx: number; fy: number }[] = [];
  /** this guest's own swing, started locally the moment attack is pressed (D154): its end, combo step, start,
   *  windup length, forward step (px) and the direction of that step */
  private atk: { until: number; idx: number; start: number; windup: number; active: number; recover: number; step: number; dir: [number, number]; queued: boolean; last: boolean } | null = null;
  /** the combo step the next swing continues with, until when (as the host's nextComboIdx / comboResetAt) */
  private nextSwing: { idx: number; until: number } | null = null;
  private samples = new Map<number, Sample[]>();
  private meta = new Map<number, EntityMeta>();
  /** the host's clock, smoothed against network jitter (D149) */
  private hostClock = new HostClock(1 / SNAP_HZ);
  /** a dodge this guest started locally before the host confirmed it (D149) */
  private lastWalkSpeed = 0;
  /** when the host last started reporting that this guest cannot walk (0 while it can) */
  private zeroSince = 0;
  private dodgePred: { until: number; holdUntil: number; dir: [number, number]; mult: number; t: number } | null = null;
  private self: SelfState | null = null;
  private correction = { x: 0, y: 0 };
  private roomKey = '';
  private ch: {
    hello: NetChannel<Hello & Record<string, unknown>>;
    input: NetChannel<ArrayBuffer>;
    cmd: NetChannel<Cmd & Record<string, unknown>>;
    char: NetChannel<{ ack: number; char: Character }>;
    ping: NetChannel<{ t: number }>;
  };

  constructor(
    public t: Transport,
    public save: SaveFile,
    private clock: () => number = () => performance.now() / 1000,
  ) {
    this.ch = { hello: t.channel(CH.hello), input: t.channel(CH.input), cmd: t.channel(CH.cmd), char: t.channel(CH.char), ping: t.channel(CH.ping) };
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

  /** Tell the host about a change made on this side (equip, level up, gems, spells). */
  syncChar(): void {
    if (!this.hostId) return;
    this.ch.char.send({ ack: this.rev, char: cloneChar(this.save.character) }, this.hostId);
    if (this.me?.pl) refreshDerived(this.me);
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
    if (this.hostFriendlyFire !== null) this.cw.friendlyFire = this.hostFriendlyFire / 100;
    this.me = null;
    this.samples.clear();
    this.meta.clear();
    this.pending = [];
    this.self = null;
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
    this.onEvent(e);
  }

  private onOps(rev: number, ops: CharOp[]): void {
    const c = this.save.character;
    const before = c.highestZoneBeaten;
    for (const o of ops) applyCharOp(c, o);
    this.rev = rev;
    // D31: a zone beaten here that was this character's next zone moves its own world on
    if (c.highestZoneBeaten > before && c.highestZoneBeaten + 1 > this.save.world.zone) {
      this.save.pending = { ...(this.save.pending ?? {}), advanceToZone: Math.min(9, c.highestZoneBeaten + 1) };
    }
    if (this.me?.pl && ops.some((o) => o.op === 'gear' || o.op === 'set' || o.op === 'prof')) refreshDerived(this.me);
    this.onCharChanged();
  }

  // ------------------------------------------------------------------ snapshots → mirror world

  private applySnap(b: ArrayBuffer): void {
    const s = decodeSnap(b);
    const now = this.clock();
    this.hostClock.sample(s.time, now);
    const j = s.json;
    if (j.room) this.applyRoom(j.room);
    if (j.meta) for (const [id, m] of Object.entries(j.meta)) this.meta.set(Number(id), m);
    for (const r of s.recs) this.applyRec(r, s.time);
    for (const id of s.removed) {
      const e = this.cw.entities.get(id);
      if (e) {
        e.removed = true;
        this.cw.entities.delete(id);
      }
      this.samples.delete(id);
      this.meta.delete(id);
      if (e === this.me) this.me = null;
    }
    this.cw.refreshLists();
    this.cw.bossId = j.bossId ?? 0;
    if (j.roomMods) {
      this.cw.roomMods.dark = j.roomMods.dark;
      this.cw.roomMods.floodUntil = j.roomMods.floodUntil;
    }
    this.setFriendlyFire(j.ff);
    if (j.ev) this.cw.events.push(...j.ev);
    if (j.self) this.applySelf(j.self);
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
      e.pl!.remote = true;
      if (mine) this.me = e;
    } else if (m.t === 'enemy') {
      const def = ENEMIES[m.def] ?? BOSSES[m.def];
      if (!def) return null;
      e = spawnEnemy(w, def, x, y, { tellS: 0, elite: m.elite as EliteAffix | null, pieceIndex: m.piece, illusion: m.illusion });
      e.drawId = m.drawId;
      e.radius = m.r;
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
    const list = this.samples.get(r.id) ?? [];
    list.push({ t, x, y });
    if (list.length > 12) list.shift();
    this.samples.set(r.id, list);
    e.facing = (r.facing / 256) * Math.PI * 2;
    const a = e.anim;
    a.pose = POSES[r.pose] ?? 'idle';
    a.poseT = r.poseT / 50;
    a.alpha = r.alpha / 255;
    a.scale = r.scale / 64;
    a.squash = r.squash / 100;
    a.tint = r.flags & F.red ? 'red' : r.flags & F.blue ? 'blue' : null;
    a.flashUntil = r.flags & F.flash ? t + 0.08 : 0;
    if (e.hp && e !== this.me) {
      e.hp.hp = (e.hp.max * r.hp) / 1000;
      e.hp.dead = (r.flags & F.dead) !== 0;
      e.hp.invulnUntil = r.flags & F.invuln ? t + 0.2 : 0;
      e.hp.staggerUntil = r.flags & F.stagger ? t + 0.2 : 0;
    }
    // statuses and controls for the particles and icons (the guest's own come exactly from its self state)
    if (e.st && e !== this.me) {
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
      en.phase = r.extra;
      en.phaseTransitionUntil = r.flags & F.transition ? t + 0.3 : 0;
      en.fadeUntil = r.flags & F.faded ? t + 0.2 : 0;
      const k = r.extra2 / 1000;
      en.spawnedAt = t - k;
      en.spawnUntil = t + (1 - k);
      en.attack = this.mirrorAttack(e, m, r);
    }
    if (e.pl) {
      const pl = e.pl;
      // the guest's own locally started dodge keeps its look until it has played out (D149)
      const predicting = e === this.me && this.dodgePred !== null && this.dodgePred.t < DODGE_S;
      if (!predicting) pl.state = PLAYER_STATES[r.state] ?? 'idle';
      pl.downed = (r.flags & F.downed) !== 0;
      pl.deadUntilRest = (r.flags & F.deadUntilRest) !== 0;
      pl.blocking = (r.flags & F.blocking) !== 0;
      pl.parryUntil = r.flags & F.parry ? t + 0.1 : 0;
      pl.reviveProgress = r.extra / 100;
      pl.reviveNeed = Math.max(1, r.extra2 / 100);
      const ph = COMBO_PHASES[r.cPhase] ?? '';
      const combo = pl.derived.weapon.combo;
      if (ph && combo.length) {
        const swing = combo[r.cIdx % combo.length]!;
        pl.combo = { idx: r.cIdx, phase: ph, t: r.cK / 255, dur: 1, swing, hit: new Set(), queued: false, charging: (r.flags & F.charging) !== 0, chargeT: 0, speed: 1, fired: false };
      } else pl.combo = null;
    }
    if (e.pr?.lob) e.pr.lob.t = (r.extra / 1000) * e.pr.lob.dur;
    if (e.it) e.it.used = (r.flags & F.used) !== 0;
  }

  /**
   * This guest's own swing, predicted (D154): it starts when attack is pressed (or held, for melee) while free, and
   * lasts as long as that combo step does at the current attack speed, chaining into the next step while held.
   * Only movement uses it; the host still decides every hit.
   */
  private predictSwing(me: Entity, input: InputFrame, speed: number): boolean {
    const d = me.pl!.derived;
    const combo = d.weapon.combo;
    const now = this.clock();
    if (!combo.length) return false;
    const pressed = (input.pressed & ACTION_BIT.attack) !== 0;
    const held = (input.buttons & ACTION_BIT.attack) !== 0;
    const stam = (this.self?.stam ?? 0) > 0;
    const as = Math.max(0.3, d.attackSpeed);
    const start = (idx: number): void => {
      const sw = combo[idx % combo.length]!;
      const last = idx % combo.length === combo.length - 1;
      // the host turns to the aim at the swing's start; a neutral pad stick keeps the current facing
      const ax = input.aimX - me.x;
      const ay = input.aimY - me.y;
      const a = input.aimNeutral || Math.hypot(ax, ay) < 1 ? me.facing : Math.atan2(ay, ax);
      const windup = sw.windupMs / 1000 / as;
      const active = sw.activeMs / 1000 / as;
      const recover = (sw.recoverMs / 1000 / as) * (last ? 1.15 : 1);
      this.atk = { idx: idx % combo.length, start: now, windup, active, recover, step: sw.step ?? 0, dir: [Math.cos(a), Math.sin(a)], until: now + windup + active + recover, queued: false, last };
    };
    // the same rules as the host's combo (player.ts updateCombo): presses queue in the recovery, a queued swing
    // starts at 45% of it (the last swing waits for the end), and a new swing within 0.5 s continues the combo
    const a = this.atk;
    if (a && now < a.until) {
      const tr = now - a.start - a.windup - a.active;
      if (tr >= 0) {
        if (pressed || (held && tr > a.recover * 0.3)) a.queued = true;
        if (a.queued && !a.last && tr >= a.recover * 0.45 && stam) start(a.idx + 1);
      }
      return true;
    }
    if (a && now >= a.until) {
      this.nextSwing = { idx: a.last ? 0 : a.idx + 1, until: a.until + 0.5 };
      const chain = a.queued && a.last && stam;
      this.atk = null;
      if (chain) {
        start(0);
        return true;
      }
    }
    const bowLocked = d.weapon.twoHandOnly && !d.twoHanded;
    const free = speed > 0 && !this.dodgePred && stam && !bowLocked;
    if (free && (pressed || (held && !d.weapon.ranged))) {
      start(this.nextSwing && now <= this.nextSwing.until ? this.nextSwing.idx : 0);
      return true;
    }
    return false;
  }

  /** The predicted swing's step velocity right now (the last 40% of its windup), or null. */
  private swingStep(): [number, number] | null {
    const a = this.atk;
    if (!a || !a.step) return null;
    const t = this.clock() - a.start;
    if (t < a.windup * 0.6 || t >= a.windup) return null;
    const sp = a.step / Math.max(0.05, a.windup * 0.4);
    return [a.dir[0] * sp, a.dir[1] * sp];
  }

  /**
   * Start the dodge on this screen the moment it is pressed (D149), on the same rules the host checks (free to act,
   * recharged, stamina left); the host runs the real one and the two meet when it confirms. A refused dodge is put
   * right by the next reconcile.
   */
  private maybePredictDodge(me: Entity, input: InputFrame, speed: number): void {
    if (this.dodgePred || !(input.pressed & ACTION_BIT.dodge) || !me.pl || !this.self) return;
    const free = speed > 0 && this.self.stam > 0 && this.hostNow() >= this.self.dodgeReadyAt;
    if (!free) return;
    let dx = input.moveX;
    let dy = input.moveY;
    const m = Math.hypot(dx, dy);
    if (m < 0.2) {
      dx = Math.cos(me.facing);
      dy = Math.sin(me.facing);
    } else {
      dx /= m;
      dy /= m;
    }
    const now = this.clock();
    // hold off reconciling until the host has run its own dodge and reported back: the dodge, a round trip and a margin
    this.dodgePred = { until: now + DODGE_S, holdUntil: now + DODGE_S + this.rtt + 0.12, dir: [dx, dy], mult: me.pl.derived.load.effects.dodge, t: 0 };
    me.pl.state = 'dodge';
    me.pl.dodgeUntil = this.cw.time + DODGE_S;
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
    if (!phase || !def) {
      // no attack id (an old host): keep the Red / Blue windup icon with a plain element
      const kind = r.flags & F.windRed ? 'red' : r.flags & F.windPierce ? 'pierce' : null;
      return kind ? ({ phase: 'windup', t: 0, windup: 1, active: 0.1, recover: 0.3, def: { id: '', kind, type: 'physical', windupMs: 1000, recoverMs: 300 } } as unknown as NonNullable<typeof en.attack>) : null;
    }
    const cur = en.attack;
    if (cur && cur.def === def && cur.phase === phase) return cur;
    return { def, phase, t: 0, windup: def.windupMs / 1000, active: (def.activeMs ?? 100) / 1000, recover: def.recoverMs / 1000, angle: e.facing } as unknown as NonNullable<typeof en.attack>;
  }

  private applySelf(s: SelfState): void {
    this.self = s;
    const e = this.me;
    if (!e?.pl || !e.hp) return;
    e.hp.hp = s.hp;
    e.hp.max = s.max;
    e.hp.barrier = s.barrier;
    e.hp.invulnUntil = s.invulnUntil;
    if (e.stam) {
      e.stam.cur = s.stam;
      e.stam.max = s.stamMax;
    }
    if (e.st) {
      Object.assign(e.st.meters, s.meters);
      Object.assign(e.st.active, s.active);
      Object.assign(e.st.controls, s.controls);
    }
    const pl = e.pl;
    pl.skillReadyAt = [s.skillReadyAt[0] ?? 0, s.skillReadyAt[1] ?? 0, s.skillReadyAt[2] ?? 0];
    pl.spellReadyAt = [s.spellReadyAt[0] ?? 0, s.spellReadyAt[1] ?? 0, s.spellReadyAt[2] ?? 0];
    pl.dodgeReadyAt = s.dodgeReadyAt;
    pl.dodgeRechargeTotal = s.dodgeRechargeTotal;
    pl.guardBrokenUntil = s.guardBrokenUntil;
    pl.riposteBuffUntil = s.riposteBuffUntil;
    pl.ghostUntil = s.ghostUntil;
    pl.stateUntil = s.stateUntil;
    // reconcile the prediction (NETCODE §5): replay unacknowledged inputs from the host's position
    this.pending = this.pending.filter((p) => seqNewer(p.seq, s.lastSeq));
    // a locally started dodge runs on its own until the host has caught up with it (D149)
    if (this.dodgePred && this.clock() < this.dodgePred.holdUntil) return;
    this.dodgePred = null;
    let px = s.x;
    let py = s.y;
    if (s.speed > 0) {
      const probe = { ...e, x: px, y: py };
      for (const p of this.pending) {
        // each input at the speed it was walked at here (D154); Slow terrain where each step starts, as the host does
        const sp = p.sp * terrainWalkMult(this.cw.room, probe.x, probe.y);
        this.cw.room.moveCircle(probe, p.mx * sp * p.dt + p.fx, p.my * sp * p.dt + p.fy);
      }
      px = probe.x;
      py = probe.y;
    }
    const err = dist(px, py, e.x, e.y);
    if (s.speed <= 0) {
      // a brief stop (a swing's step forward, a flinch): hold where we are and settle once walking resumes, rather
      // than snapping back to the host's older position on every swing (D150)
      if (this.zeroSince === 0) this.zeroSince = this.clock();
      if (e.pl?.state === 'attack' && this.clock() - this.zeroSince < 0.3 && err < 64) return;
      // knocked back, staggered, grabbed: the frame glides to the host's newest position (D154: this used to snap,
      // so every knockback on a guest was a teleport); only a real teleport (a room change, a warp) snaps
      if (err < 160) return;
    } else this.zeroSince = 0;
    // ease anything short of a real teleport (D154: it used to snap at 24 px, which read as blinking back)
    if (err >= 64 || s.speed <= 0) {
      e.x = e.px = px;
      e.y = e.py = py;
      this.correction = { x: 0, y: 0 };
    } else {
      // smooth small errors over ~100 ms
      this.correction = { x: px - e.x, y: py - e.y };
    }
  }

  // ------------------------------------------------------------------ per frame

  /** Host time estimate for "now" and the time the mirror is drawn at (100 ms behind). */
  hostNow(): number {
    return this.hostClock.now(this.clock());
  }

  /** Send this frame's input and move the mirror: interpolate others, predict self. */
  frame(input: InputFrame, dt: number): void {
    if (this.state !== 'game' || !this.hostId) return;
    this.seq = (this.seq + 1) & 0xffff;
    this.tick++;
    this.ch.input.send(encodeInput({ seq: this.seq, tick: this.tick, frame: input }), this.hostId);
    // draw a little behind the newest snapshot: how far depends on how jittery this connection is (D149)
    const renderT = this.hostNow() - this.hostClock.delay(dt);
    this.cw.time = renderT;
    // mirrored enemy attacks run their own clock between snapshots (windup glow and motes)
    for (const e of this.cw.entities.values()) if (e.en?.attack) e.en.attack.t += dt;
    // others: interpolate between the two samples around renderT (extrapolate at most 100 ms)
    for (const [id, list] of this.samples) {
      const e = this.cw.entities.get(id);
      if (!e || e === this.me || !list.length) continue;
      let a = list[0]!;
      let b = list[list.length - 1]!;
      for (let i = 0; i < list.length - 1; i++) {
        if (list[i]!.t <= renderT && list[i + 1]!.t >= renderT) {
          a = list[i]!;
          b = list[i + 1]!;
          break;
        }
      }
      let x = b.x;
      let y = b.y;
      if (b.t > a.t) {
        const k = Math.max(0, Math.min(1 + 0.1 / Math.max(0.01, b.t - a.t), (renderT - a.t) / (b.t - a.t)));
        x = a.x + (b.x - a.x) * k;
        y = a.y + (b.y - a.y) * k;
      }
      walkAnim(e, dist(x, y, e.x, e.y), dt);
      e.px = e.x = x;
      e.py = e.y = y;
    }
    // self: predict walking with the host's current walk speed, and start a dodge at once (D149)
    const me = this.me;
    if (me) {
      const mx0 = me.x;
      const my0 = me.y;
      const speed = this.self?.speed ?? 0;
      this.maybePredictDodge(me, input, speed);
      const dp = this.dodgePred;
      // asked once a frame: the clock moves between calls, so asking twice could get two answers (D155)
      const stepV = this.swingStep();
      // right after a predicted dodge the host may still report 0 (it is finishing its own): keep walking at the last speed
      if (speed > 0) this.lastWalkSpeed = speed;
      let walk = speed > 0 ? speed : dp ? this.lastWalkSpeed : 0;
      // swings slow walking from the moment they start (D88): predict that here instead of waiting for the host's
      // word, which arrives a round trip late and used to snap the guest back at every swing's start and end (D154)
      const base = this.self?.base ?? 0;
      const swinging = this.predictSwing(me, input, speed);
      if (base > 0 && walk > 0) {
        if (swinging) walk = base * (ATTACK_MOVE[me.pl!.derived.weapon.speedClass] ?? 0.4) * (me.pl!.blocking ? 0.75 : 1);
        else if (me.pl!.state === 'attack') walk = base;
      }
      if (dp && dp.t < DODGE_S) {
        // the same path the host's dodge takes (player.ts): fast at first, easing out
        const step = Math.min(dt, DODGE_S - dp.t);
        const k = dp.t / DODGE_S;
        const sp = (DODGE_DIST / DODGE_S) * 1.6 * Math.max(0.1, 1 - k) * dp.mult;
        this.cw.room.moveCircle(me, dp.dir[0] * sp * step, dp.dir[1] * sp * step, false, true);
        dp.t += step;
        this.pending = [];
        this.correction = { x: 0, y: 0 };
      } else if (stepV) {
        // the swing's step forward, as the host takes it (player.ts): a short slide toward the aim, no walking (D154)
        const v = stepV;
        const fx = v[0] * dt;
        const fy = v[1] * dt;
        this.pending.push({ seq: this.seq, dt, mx: 0, my: 0, sp: 0, fx, fy });
        if (this.pending.length > 120) this.pending.shift();
        this.cw.room.moveCircle(me, fx, fy);
      } else if (walk > 0) {
        this.pending.push({ seq: this.seq, dt, mx: input.moveX, my: input.moveY, sp: walk, fx: 0, fy: 0 });
        if (this.pending.length > 120) this.pending.shift();
        const sp = walk * terrainWalkMult(this.cw.room, me.x, me.y);
        this.cw.room.moveCircle(me, input.moveX * sp * dt, input.moveY * sp * dt);
        const k = Math.min(1, dt / 0.1);
        me.x += this.correction.x * k;
        me.y += this.correction.y * k;
        this.correction.x *= 1 - k;
        this.correction.y *= 1 - k;
      } else if (this.zeroSince !== 0 && this.clock() - this.zeroSince < 0.3 && me.pl?.state === 'attack') {
        // a swing's step forward: stand still until walking resumes (D150)
      } else {
        // staggered, held, knocked back: follow the host's newest position
        const list = this.samples.get(me.id);
        const last = list?.[list.length - 1];
        if (last) {
          me.x += (last.x - me.x) * Math.min(1, dt / 0.08);
          me.y += (last.y - me.y) * Math.min(1, dt / 0.08);
        }
      }
      walkAnim(me, dist(mx0, my0, me.x, me.y), dt);
      me.px = me.x;
      me.py = me.y;
      if (me.pl && me.pl.state !== 'attack' && me.pl.state !== 'dodge') me.facing = Math.atan2(input.aimY - me.y, input.aimX - me.x);
    }
  }
}
