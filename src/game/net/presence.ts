// Friends' presence and invites (NETCODE §10, D339). Each friend on the list is one room that only the two of
// them can name (friendRoom: a hash of both codes); being online is being in it. Once both have added each other
// they meet there, say who they are (`fp`) and what they are doing, and the host's lobby can send an invite (`fi`)
// carrying its room code, which the friend accepts or declines (`fa`) or the host withdraws (`fx`). Nothing here
// ever reaches anyone who lacks both codes. Transport-agnostic: Trystero rooms in the game, loopback in tests.
import { parseRoomCode } from './protocol';
import { friendRoom } from './friendCode';
import { randomPeerId, type Transport } from './transport';

/** What a friend is doing: in the menus, playing alone, hosting a lobby, or in a co-op game. */
export type FriendStatus = 'menu' | 'solo' | 'hosting' | 'coop';
const STATUSES: readonly FriendStatus[] = ['menu', 'solo', 'hosting', 'coop'];

/** an invite stays open this long unless answered or withdrawn */
export const INVITE_TTL_MS = 60_000;

/** Channel names (short: they travel with every packet). */
export const FCH = { hi: 'fp', invite: 'fi', answer: 'fa', cancel: 'fx' } as const;

type HiMsg = {
  code: string;
  name: string;
  st: FriendStatus;
  v: string;
};
type InviteMsg = {
  id: string;
  room: string;
  name: string;
  zone: number;
  ttl: number;
};
type AnswerMsg = {
  id: string;
  ok: boolean;
  why?: 'busy';
};
type CancelMsg = {
  id: string;
};

export interface IncomingInvite {
  id: string;
  /** the friend's code */
  from: string;
  name: string;
  room: string;
  zone: number;
  expiresAt: number;
}

export type OutState = 'sent' | 'accepted' | 'declined' | 'busy' | 'expired' | 'cancelled';
export interface OutInvite {
  id: string;
  expiresAt: number;
  state: OutState;
}

export interface FriendView {
  code: string;
  online: boolean;
  name: string;
  status: FriendStatus | null;
  version: string | null;
  invite: OutInvite | null;
}

export interface PresenceOpts {
  me: string;
  name: () => string;
  status: () => FriendStatus;
  version: string;
  /** join one friend room (the id and password come from friendRoom) */
  open: (room: string, password: string) => Promise<Transport>;
  now: () => number;
}

interface PeerInfo {
  name: string;
  st: FriendStatus;
  v: string;
}

interface Link {
  code: string;
  t: Transport | null;
  closed: boolean;
  /** peers in the room that proved they are this friend (a second tab of our own also turns up here) */
  peers: Map<string, PeerInfo>;
  out: OutInvite | null;
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

export class Presence {
  private links = new Map<string, Link>();
  readonly incoming = new Map<string, IncomingInvite>();
  private sent: { name: string; st: FriendStatus } | null = null;
  private closed = false;
  private listeners = new Set<() => void>();
  onInvite: (inv: IncomingInvite) => void = () => undefined;
  onInviteGone: (inv: IncomingInvite, why: 'expired' | 'cancelled' | 'offline') => void = () => undefined;
  onAnswer: (friend: string, name: string, state: OutState) => void = () => undefined;
  /** a friend's announced name, to keep in the book */
  onName: (friend: string, name: string) => void = () => undefined;

  constructor(private o: PresenceOpts) {}

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    for (const fn of [...this.listeners]) fn();
  }

  /** Keep one room open per friend on the list: new codes are joined, removed ones left. */
  setFriends(codes: readonly string[]): void {
    if (this.closed) return;
    const want = new Set(codes);
    for (const [code, l] of this.links)
      if (!want.has(code)) {
        this.drop(l);
        this.links.delete(code);
      }
    for (const code of want) if (!this.links.has(code)) this.link(code);
    this.changed();
  }

  private link(code: string): void {
    const l: Link = { code, t: null, closed: false, peers: new Map(), out: null };
    this.links.set(code, l);
    void friendRoom(this.o.me, code)
      .then(({ room, password }) => this.o.open(room, password))
      .then((t) => {
        if (l.closed || this.closed) {
          t.leave();
          return;
        }
        l.t = t;
        this.wire(l, t);
      })
      .catch(() => undefined);
  }

  private wire(l: Link, t: Transport): void {
    const hi = t.channel<HiMsg>(FCH.hi);
    const inv = t.channel<InviteMsg>(FCH.invite);
    const ans = t.channel<AnswerMsg>(FCH.answer);
    const can = t.channel<CancelMsg>(FCH.cancel);
    t.onPeerJoin((id) => hi.send(this.hello(), id));
    t.onPeerLeave((id) => {
      if (!l.peers.delete(id)) return;
      if (l.peers.size === 0) this.wentOffline(l);
      this.changed();
    });
    hi.onMessage((m, from) => {
      // only the friend this room is for counts (another tab of our own has our code, not theirs)
      if (!m || m.code !== l.code) return;
      const st = STATUSES.includes(m.st) ? m.st : 'menu';
      const name = str(m.name, 16).trim();
      const was = l.peers.has(from);
      l.peers.set(from, { name, st, v: str(m.v, 32) });
      if (!was) hi.send(this.hello(), from);
      if (name) this.onName(l.code, name);
      this.changed();
    });
    inv.onMessage((m, from) => {
      const p = l.peers.get(from);
      const room = m && typeof m.room === 'string' ? parseRoomCode(m.room) : null;
      if (!p || !room || typeof m.id !== 'string') return;
      if (this.o.status() === 'coop') {
        // already in a co-op game: say so without asking
        ans.send({ id: m.id, ok: false, why: 'busy' }, from);
        return;
      }
      for (const [id, old] of this.incoming) if (old.from === l.code) this.incoming.delete(id);
      const ttl = Math.min(120_000, Math.max(5_000, Number(m.ttl) || INVITE_TTL_MS));
      const invite: IncomingInvite = { id: m.id.slice(0, 32), from: l.code, name: str(m.name, 16) || p.name, room, zone: Math.max(1, Math.floor(Number(m.zone)) || 1), expiresAt: this.o.now() + ttl };
      this.incoming.set(invite.id, invite);
      this.onInvite(invite);
      this.changed();
    });
    ans.onMessage((m) => {
      const out = l.out;
      if (!m || !out || out.id !== m.id || out.state !== 'sent') return;
      out.state = m.ok ? 'accepted' : m.why === 'busy' ? 'busy' : 'declined';
      this.onAnswer(l.code, this.view(l.code).name, out.state);
      this.changed();
    });
    can.onMessage((m, from) => {
      const inv0 = m ? this.incoming.get(m.id) : undefined;
      if (!inv0 || inv0.from !== l.code || !l.peers.has(from)) return;
      this.incoming.delete(inv0.id);
      this.onInviteGone(inv0, 'cancelled');
      this.changed();
    });
    // peers already there (a transport that reported them before we listened)
    for (const id of t.peers()) hi.send(this.hello(), id);
  }

  private wentOffline(l: Link): void {
    for (const [id, inv] of this.incoming)
      if (inv.from === l.code) {
        this.incoming.delete(id);
        this.onInviteGone(inv, 'offline');
      }
    if (l.out?.state === 'sent') l.out.state = 'cancelled';
  }

  private hello(): HiMsg {
    const name = this.o.name();
    const st = this.o.status();
    this.sent = { name, st };
    return { code: this.o.me, name, st, v: this.o.version };
  }

  /** Once a second: tell friends what changed, and let invites run out. */
  pulse(): void {
    if (this.closed) return;
    const now = this.o.now();
    const name = this.o.name();
    const st = this.o.status();
    let dirty = false;
    if (!this.sent || this.sent.name !== name || this.sent.st !== st) {
      const msg = this.hello();
      for (const l of this.links.values()) if (l.t && l.peers.size) l.t.channel<HiMsg>(FCH.hi).send(msg, [...l.peers.keys()]);
    }
    for (const [id, inv] of this.incoming)
      if (inv.expiresAt <= now) {
        this.incoming.delete(id);
        this.onInviteGone(inv, 'expired');
        dirty = true;
      }
    for (const l of this.links.values()) {
      if (l.out?.state !== 'sent') continue;
      if (l.out.expiresAt <= now) l.out.state = 'expired';
      // a running countdown on the Invite button
      dirty = true;
    }
    if (dirty || this.incoming.size) this.changed();
  }

  view(code: string): FriendView {
    const l = this.links.get(code);
    // the most recently heard tab of theirs speaks for them
    const p = l ? [...l.peers.values()].pop() : undefined;
    return { code, online: !!p, name: p?.name ?? '', status: p?.st ?? null, version: p?.v ?? null, invite: l?.out ?? null };
  }

  /** Send a friend an invite to the room `room`. False when they are not online or one is already waiting. */
  invite(code: string, room: string, zone: number, name: string, ttl = INVITE_TTL_MS): boolean {
    const l = this.links.get(code);
    if (!l?.t || !l.peers.size || !parseRoomCode(room)) return false;
    if (l.out?.state === 'sent' && l.out.expiresAt > this.o.now()) return false;
    const id = randomPeerId();
    l.out = { id, expiresAt: this.o.now() + ttl, state: 'sent' };
    l.t.channel<InviteMsg>(FCH.invite).send({ id, room, name: name.slice(0, 16), zone, ttl }, [...l.peers.keys()]);
    this.changed();
    return true;
  }

  /** The lobby closed or the game started: every invite still waiting is withdrawn. */
  cancelInvites(): void {
    for (const l of this.links.values()) {
      if (l.out?.state !== 'sent') continue;
      if (l.t && l.peers.size) l.t.channel<CancelMsg>(FCH.cancel).send({ id: l.out.id }, [...l.peers.keys()]);
      l.out.state = 'cancelled';
    }
    this.changed();
  }

  /** Forget an answered invite, so the Invite button reads plainly again. */
  clearInvite(code: string): void {
    const l = this.links.get(code);
    if (l?.out && l.out.state !== 'sent') {
      l.out = null;
      this.changed();
    }
  }

  /** Answer an invite; returns it (with its room code) if it was still open. */
  answer(id: string, ok: boolean, why?: 'busy'): IncomingInvite | null {
    const inv = this.incoming.get(id);
    if (!inv) return null;
    this.incoming.delete(id);
    const l = this.links.get(inv.from);
    if (l?.t && l.peers.size) l.t.channel<AnswerMsg>(FCH.answer).send(why ? { id, ok, why } : { id, ok }, [...l.peers.keys()]);
    this.changed();
    return inv.expiresAt > this.o.now() ? inv : null;
  }

  private drop(l: Link): void {
    l.closed = true;
    this.wentOffline(l);
    l.t?.leave();
    l.t = null;
    l.peers.clear();
  }

  close(): void {
    if (this.closed) return;
    this.cancelInvites();
    for (const l of this.links.values()) this.drop(l);
    this.links.clear();
    this.closed = true;
    this.changed();
  }
}
