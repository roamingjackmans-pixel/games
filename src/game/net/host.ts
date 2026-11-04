// The host (NETCODE §2, §5–§7): runs the only simulation. In the lobby it collects guests' hellos; in the
// world it applies their inputs, sends each of them snapshots at 20 Hz (a keyframe every 2 s), their own
// character ops and the world events they should hear, and removes anyone silent for 10 s.
import { emptyInput, type InputFrame } from '../../engine/input/actions';
import { refreshDerived } from '../player/player';
import { CharLog } from './charSync';
import { gearOf } from './lobbyGear';
import {
  CH,
  FULL_EVERY_S,
  GUEST_TIMEOUT_S,
  MAX_GUESTS,
  SNAP_HZ,
  decodeInput,
  gameVersion,
  seqNewer,
  versionMismatch,
  type Cmd,
  type Hello,
  type LobbyState,
  type NetEvent,
  type PublicPlayer,
  type Welcome,
} from './protocol';
import { encodeSnap, metaOf, recEqual, recordOf, roomSync, selfStateOf, type EntityMeta, type Rec, type SnapJson } from './snapshot';
import type { Transport, NetChannel } from './transport';
import type { GameSession, SessionPlayer } from '../session';
import type { Character, SaveFile } from '../types';
import type { Entity, GameEvent } from '../world';

export interface HostGuest {
  peerId: string;
  hello: Hello;
  char: Character;
  log: CharLog;
  sp: SessionPlayer | null;
  input: InputFrame;
  pressed: number;
  lastSeq: number;
  lastHeard: number;
  sentRecs: Map<number, Rec>;
  sentMeta: Map<number, string>;
  roomSent: string;
  zoneSent: string;
  lastFullAt: number;
  events: GameEvent[];
}

/** Sessions whose boss kills are already relayed to guests (D195). */
const HOOKED = new WeakSet<GameSession>();

export class NetHost {
  guests = new Map<string, HostGuest>();
  session: GameSession | null = null;
  inGame = false;
  /** UI callbacks */
  onLobbyChange: () => void = () => undefined;
  onGuestLeft: (name: string) => void = () => undefined;
  /** the host's friendly-fire percent for the lobby (the scene reads Settings → Game; D115) */
  friendlyFire: () => number = () => 100;
  private ch: {
    hello: NetChannel<Hello & Record<string, unknown>>;
    lobby: NetChannel<LobbyState & Record<string, unknown>>;
    welcome: NetChannel<Welcome & Record<string, unknown>>;
    reject: NetChannel<{ reason: string }>;
    input: NetChannel<ArrayBuffer>;
    snap: NetChannel<ArrayBuffer>;
    event: NetChannel<NetEvent & Record<string, unknown>>;
    cmd: NetChannel<Cmd & Record<string, unknown>>;
    char: NetChannel<{ ack: number; char: Character }>;
    charop: NetChannel<{ rev: number; ops: unknown[] }>;
    ping: NetChannel<{ t: number }>;
    pong: NetChannel<{ t: number }>;
  };
  private snapAcc = 0;

  constructor(
    public t: Transport,
    public code: string,
    public save: SaveFile,
    private clock: () => number = () => performance.now() / 1000,
  ) {
    this.ch = {
      hello: t.channel(CH.hello),
      lobby: t.channel(CH.lobby),
      welcome: t.channel(CH.welcome),
      reject: t.channel(CH.reject),
      input: t.channel(CH.input),
      snap: t.channel(CH.snap),
      event: t.channel(CH.event),
      cmd: t.channel(CH.cmd),
      char: t.channel(CH.char),
      charop: t.channel(CH.charop),
      ping: t.channel(CH.ping),
      pong: t.channel(CH.pong),
    };
    this.ch.hello.onMessage((h, from) => this.onHello(h, from));
    this.ch.input.onMessage((b, from) => this.onInput(b, from));
    this.ch.char.onMessage((m, from) => this.onChar(m, from));
    this.ch.cmd.onMessage((c, from) => this.onCmd(c, from));
    this.ch.ping.onMessage((p, from) => {
      this.touch(from);
      this.ch.pong.send({ t: p.t }, from);
    });
    t.onPeerJoin(() => this.sendLobby());
    t.onPeerLeave((id) => this.drop(id));
  }

  // ------------------------------------------------------------------ lobby

  lobbyState(): LobbyState {
    const c = this.save.character;
    const players: PublicPlayer[] = [{ peerId: this.t.selfId, playerId: c.playerId, name: c.name, classId: c.classId, level: c.level, host: true, cycle: c.cycle, appearance: c.appearance, gear: gearOf(c) }];
    for (const g of this.guests.values()) players.push({ peerId: g.peerId, playerId: g.char.playerId, name: g.char.name, classId: g.char.classId, level: g.char.level, host: false, cycle: g.char.cycle, appearance: g.char.appearance, gear: gearOf(g.char) });
    return { code: this.code, players, zone: this.save.world.zone, ff: this.friendlyFire() };
  }

  /** Send everyone the lobby; `notify` false skips the host's own redraw (a setting being dragged). */
  sendLobby(notify = true): void {
    this.ch.lobby.send(this.lobbyState() as LobbyState & Record<string, unknown>);
    if (notify) this.onLobbyChange();
  }

  private onHello(h: Hello, from: string): void {
    const reject = (reason: string): void => this.ch.reject.send({ reason }, from);
    const mism = versionMismatch(gameVersion(), h.version);
    if (mism) return reject(mism);
    // a guest already in the party saying hello again is not a new join (D156)
    if (this.inGame && this.guests.has(from)) return;
    if (this.inGame) return reject('The game has started. Ask the host to return to the lobby.');
    if (!this.guests.has(from) && this.guests.size >= MAX_GUESTS) return reject('The party is full (4 players).');
    const same = h.char.playerId === this.save.character.playerId || [...this.guests.values()].some((g) => g.peerId !== from && g.char.playerId === h.char.playerId);
    if (same) return reject('That character is already in this party. Pick another character (incognito windows share their characters with each other).');
    this.guests.set(from, {
      peerId: from,
      hello: h,
      char: h.char,
      log: new CharLog(h.char),
      sp: null,
      input: emptyInput(),
      pressed: 0,
      lastSeq: 0,
      lastHeard: this.clock(),
      sentRecs: new Map(),
      sentMeta: new Map(),
      roomSent: '',
      zoneSent: '',
      lastFullAt: -99,
      events: [],
    });
    this.sendLobby();
  }

  /** Start pressed in the lobby: everyone enters the host's world (D31). */
  start(session: GameSession): void {
    this.session = session;
    this.inGame = true;
    // every guest hears when a zone's boss falls; each guest's own world decides what it keeps (D195)
    if (!HOOKED.has(session)) {
      HOOKED.add(session);
      const prev = session.listener.zoneBeaten;
      session.listener.zoneBeaten = (zone) => {
        prev?.(zone);
        if (this.session === session) this.broadcastEvent({ t: 'zoneBeaten', zone, cycle: this.save.character.cycle });
      };
    }
    const lay = session.layout;
    for (const g of this.guests.values()) this.enter(g, lay);
    this.sendLobby();
  }

  private enter(g: HostGuest, lay: GameSession['layout']): void {
    const s = this.session!;
    g.log = new CharLog(g.char);
    g.sp = s.joinPlayer(g.char);
    g.sentRecs.clear();
    g.sentMeta.clear();
    g.roomSent = '';
    g.zoneSent = `${lay.seed}|${lay.zone}`;
    g.lastFullAt = -99;
    // a fresh grace period: guests send nothing while waiting in the lobby, so anyone who joined more than 10 s
    // before Start was dropped as silent the moment the game began (D161: only the last to join got in)
    g.lastHeard = this.clock();
    const c = this.save.character;
    const welcome: Welcome = {
      you: g.char.playerId,
      seed: lay.seed,
      cycle: c.cycle,
      zone: lay.zone,
      layoutOpts: { tutorial: lay.tutorialId !== null, fewSpells: c.knownSpells.length < 2 },
      time: s.w.time,
      slot: g.sp.slot,
    };
    this.ch.welcome.send(welcome as Welcome & Record<string, unknown>, g.peerId);
  }

  /** "Return to lobby" from the host's pause menu: bodies leave the world, everyone sees the lobby. */
  toLobby(): void {
    for (const g of this.guests.values()) {
      if (g.sp) this.session?.removePlayer(g.char.playerId);
      g.sp = null;
    }
    this.inGame = false;
    this.session = null;
    this.broadcastEvent({ t: 'toLobby' });
    this.sendLobby();
  }

  close(): void {
    this.broadcastEvent({ t: 'hostLeft' });
    this.t.leave();
  }

  // ------------------------------------------------------------------ messages

  private touch(from: string): HostGuest | null {
    const g = this.guests.get(from);
    if (g) g.lastHeard = this.clock();
    return g ?? null;
  }

  private onInput(b: ArrayBuffer, from: string): void {
    const g = this.touch(from);
    if (!g) return;
    const p = decodeInput(b);
    if (g.lastSeq && !seqNewer(p.seq, g.lastSeq)) return;
    g.lastSeq = p.seq;
    g.input = p.frame;
    g.pressed |= p.frame.pressed;
  }

  private onChar(m: { ack: number; char: Character }, from: string): void {
    const g = this.touch(from);
    if (!g) return;
    g.log.adopt(g.char, m.char, m.ack);
    if (g.sp?.entity) refreshDerived(g.sp.entity);
    if (!this.inGame) this.sendLobby();
  }

  private onCmd(c: Cmd, from: string): void {
    const g = this.touch(from);
    if (!g) return;
    if (c.op === 'leave') this.drop(from);
    else if (c.op === 'fullPlease') g.lastFullAt = -99;
    else if (c.op === 'chat') this.broadcastEvent({ t: 'chat', from: g.char.name, text: String(c.text).slice(0, 120) });
  }

  private drop(peerId: string): void {
    const g = this.guests.get(peerId);
    if (!g) return;
    this.guests.delete(peerId);
    if (g.sp) this.session?.removePlayer(g.char.playerId);
    this.onGuestLeft(g.char.name);
    this.sendLobby();
  }

  sendEvent(peerId: string, e: NetEvent): void {
    this.ch.event.send(e as NetEvent & Record<string, unknown>, peerId);
  }

  broadcastEvent(e: NetEvent): void {
    this.ch.event.send(e as NetEvent & Record<string, unknown>);
  }

  guestByEntity(e: Entity): HostGuest | null {
    for (const g of this.guests.values()) if (g.sp?.entity === e) return g;
    return null;
  }

  // ------------------------------------------------------------------ the world loop

  /** Before each simulation tick: guests' latest inputs drive their bodies. */
  beforeTick(): void {
    if (!this.inGame) return;
    const now = this.clock();
    for (const g of [...this.guests.values()]) {
      if (now - g.lastHeard > GUEST_TIMEOUT_S) {
        this.drop(g.peerId);
        continue;
      }
      const e = g.sp?.entity;
      if (!e?.pl) continue;
      e.pl.input = { ...g.input, pressed: g.pressed };
      g.pressed = 0;
    }
  }

  /** After each tick, with the tick's world events (before the host's view consumes them). */
  afterTick(events: GameEvent[], dt: number): void {
    if (!this.inGame || !this.session) return;
    for (const g of this.guests.values()) {
      for (const ev of events) if (this.eventFor(ev, g)) g.events.push(ev);
      if (g.events.length > 200) g.events.splice(0, g.events.length - 200);
      const ops = g.log.collect(g.char);
      if (ops) this.ch.charop.send(ops, g.peerId);
    }
    this.snapAcc += dt;
    if (this.snapAcc + 1e-9 < 1 / SNAP_HZ) return;
    this.snapAcc = 0;
    for (const g of this.guests.values()) this.sendSnap(g);
  }

  private eventFor(ev: GameEvent, g: HostGuest): boolean {
    const pid = g.char.playerId;
    if (ev.t === 'msg') return !ev.forPlayer || ev.forPlayer === pid;
    if (ev.t === 'loot' || ev.t === 'shardGain') return ev.playerId === pid || ev.playerId === '';
    if (ev.t === 'hitstop') return false;
    return true;
  }

  private sendSnap(g: HostGuest): void {
    const s = this.session!;
    const w = s.w;
    const now = this.clock();
    const full = now - g.lastFullAt >= FULL_EVERY_S;
    if (full) g.lastFullAt = now;
    // a zone change: the guest rebuilds its map
    const zkey = `${s.layout.seed}|${s.layout.zone}`;
    if (zkey !== g.zoneSent) {
      g.zoneSent = zkey;
      const c = this.save.character;
      this.sendEvent(g.peerId, { t: 'zone', zone: s.layout.zone, seed: s.layout.seed, cycle: c.cycle, layoutOpts: { tutorial: s.layout.tutorialId !== null, fewSpells: c.knownSpells.length < 2 } });
    }
    const recs: Rec[] = [];
    const meta: Record<number, EntityMeta> = {};
    const seen = new Set<number>();
    for (const e of w.entities.values()) {
      if (e.removed || e.type === 'corpse') continue;
      const m = metaOf(e, g.char.playerId);
      if (!m) continue;
      seen.add(e.id);
      const r = recordOf(e, w.time);
      const prev = g.sentRecs.get(e.id);
      if (full || !prev || !recEqual(prev, r)) {
        recs.push(r);
        g.sentRecs.set(e.id, r);
      }
      const js = JSON.stringify(m);
      if (full || g.sentMeta.get(e.id) !== js) {
        meta[e.id] = m;
        g.sentMeta.set(e.id, js);
      }
    }
    const removed: number[] = [];
    for (const id of [...g.sentRecs.keys()]) {
      if (seen.has(id)) continue;
      removed.push(id);
      g.sentRecs.delete(id);
      g.sentMeta.delete(id);
    }
    const json: SnapJson = { bossId: w.bossId, roomMods: { dark: w.roomMods.dark, floodUntil: w.roomMods.floodUntil }, ff: Math.round(w.friendlyFire * 100) };
    if (Object.keys(meta).length) json.meta = meta;
    const rk = `${w.room.id}|${w.room.version}|${s.save.world.roomsVisited.length}|${s.save.world.roomsCleared.length}`;
    if (full || rk !== g.roomSent) {
      g.roomSent = rk;
      json.room = roomSync(w, s.node.id, s.node.kind, s.layout.zone, s.save.world.roomsVisited, s.save.world.roomsCleared);
    }
    if (g.events.length) {
      json.ev = g.events;
      g.events = [];
    }
    if (g.sp?.entity) json.self = selfStateOf(w, g.sp.entity, g.lastSeq);
    this.ch.snap.send(encodeSnap({ full, tick: w.tick, time: w.time, ackSeq: g.lastSeq, recs, removed, json }), g.peerId);
  }
}
