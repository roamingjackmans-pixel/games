// The guest (NETCODE §2, §5, §6): sends inputs at 60 Hz, mirrors the host's world from snapshots for the
// normal renderer (everything 100 ms behind, interpolated), predicts its own walking and reconciles
// against the host, and keeps its own character in sync (ops in, whole character out).
import { BOSSES } from '../../data/bosses';
import { ENEMIES } from '../../data/enemies';
import { dist } from '../../engine/math';
import type { InputFrame } from '../../engine/input/actions';
import { spawnEnemy } from '../enemies/spawn';
import { refreshDerived, spawnPlayer } from '../player/player';
import { generateZone, type ZoneLayout } from '../procgen/zone';
import { Room } from '../room';
import { terrainWalkMult } from '../systems/terrain';
import { World, type Entity, type EType } from '../world';
import { applyCharOp, cloneChar, type CharOp } from './charSync';
import { CH, INTERP_DELAY_S, encodeInput, gameVersion, seqNewer, type Cmd, type Hello, type LobbyState, type NetEvent, type Welcome } from './protocol';
import { CONTROL_BITS, ENEMY_STATES, F, PLAYER_STATES, POSES, STATUS_BITS, decodeSnap, fromB64, type EntityMeta, type Rec, type RoomSync, type SelfState } from './snapshot';
import type { NetChannel, Transport } from './transport';
import type { Character, EliteAffix, SaveFile } from '../types';

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
  private pending: { seq: number; dt: number; mx: number; my: number }[] = [];
  private samples = new Map<number, Sample[]>();
  private meta = new Map<number, EntityMeta>();
  private hostTime = 0;
  private hostTimeAt = 0;
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
      this.hostId = from;
      this.lobby = l;
      this.setFriendlyFire(l.ff);
      if (this.state === 'connecting') this.state = 'lobby';
      this.onLobby();
    });
    t.channel<{ reason: string }>(CH.reject).onMessage((r) => {
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
    t.onPeerJoin(() => this.sayHello());
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
    this.hostTime = wm.time;
    this.hostTimeAt = this.clock();
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
    if (this.me?.pl && ops.some((o) => o.op === 'gear' || o.op === 'set')) refreshDerived(this.me);
    this.onCharChanged();
  }

  // ------------------------------------------------------------------ snapshots → mirror world

  private applySnap(b: ArrayBuffer): void {
    const s = decodeSnap(b);
    const now = this.clock();
    this.hostTime = s.time;
    this.hostTimeAt = now;
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
    if (list.length > 4) list.shift();
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
      const kind = r.flags & F.windRed ? 'red' : r.flags & F.windPierce ? 'pierce' : null;
      en.attack = kind ? ({ phase: 'windup', def: { kind } } as unknown as NonNullable<typeof en.attack>) : null;
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
    let px = s.x;
    let py = s.y;
    if (s.speed > 0) {
      const probe = { ...e, x: px, y: py };
      for (const p of this.pending) {
        // Slow terrain is applied where each step starts, as the host does (the host's speed leaves it out)
        const sp = s.speed * terrainWalkMult(this.cw.room, probe.x, probe.y);
        this.cw.room.moveCircle(probe, p.mx * sp * p.dt, p.my * sp * p.dt);
      }
      px = probe.x;
      py = probe.y;
    }
    const err = dist(px, py, e.x, e.y);
    if (err >= 24 || s.speed <= 0) {
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
    return this.hostTime + (this.clock() - this.hostTimeAt);
  }

  /** Send this frame's input and move the mirror: interpolate others, predict self. */
  frame(input: InputFrame, dt: number): void {
    if (this.state !== 'game' || !this.hostId) return;
    this.seq = (this.seq + 1) & 0xffff;
    this.tick++;
    this.ch.input.send(encodeInput({ seq: this.seq, tick: this.tick, frame: input }), this.hostId);
    const renderT = this.hostNow() - INTERP_DELAY_S;
    this.cw.time = renderT;
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
      e.px = e.x = x;
      e.py = e.y = y;
    }
    // self: predict walking with the host's current walk speed
    const me = this.me;
    if (me) {
      const speed = this.self?.speed ?? 0;
      if (speed > 0) {
        this.pending.push({ seq: this.seq, dt, mx: input.moveX, my: input.moveY });
        if (this.pending.length > 120) this.pending.shift();
        const sp = speed * terrainWalkMult(this.cw.room, me.x, me.y);
        this.cw.room.moveCircle(me, input.moveX * sp * dt, input.moveY * sp * dt);
        const k = Math.min(1, dt / 0.1);
        me.x += this.correction.x * k;
        me.y += this.correction.y * k;
        this.correction.x *= 1 - k;
        this.correction.y *= 1 - k;
      } else {
        // dodging, staggered, held: follow the host's newest position
        const list = this.samples.get(me.id);
        const last = list?.[list.length - 1];
        if (last) {
          me.x += (last.x - me.x) * Math.min(1, dt / 0.08);
          me.y += (last.y - me.y) * Math.min(1, dt / 0.08);
        }
      }
      me.px = me.x;
      me.py = me.y;
      if (me.pl && me.pl.state !== 'attack' && me.pl.state !== 'dodge') me.facing = Math.atan2(input.aimY - me.y, input.aimX - me.x);
    }
  }
}
