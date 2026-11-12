// The friends service (GAME_DESIGN §12.1, NETCODE §10, D339): the friends book plus presence, started on demand.
// Presence connects only when the player has friends (or opens the Friends screen or a host lobby) and has not
// turned "Appear online" off, so solo players who never add a friend never download the relay code.
import { getStore } from '../../engine/settings';
import { FriendsBook, FRIENDS_KEY, type AddResult } from '../save/friends';
import { BroadcastTransport } from './broadcast';
import { parseFriendCode } from './friendCode';
import { Presence, type FriendStatus, type FriendView, type IncomingInvite, type OutState } from './presence';
import type { Transport } from './transport';
// the adapter only: it loads the relay strategy itself, on the first room
import { joinFriendRoom } from './trystero';

export type JoinResult = 'ok' | 'busy';

export class FriendsService {
  readonly book: FriendsBook;
  presence: Presence | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<() => void>();
  private unsub: (() => void) | null = null;
  /** set by main.ts: what this player is doing now, and the name friends see */
  statusOf: () => FriendStatus = () => 'menu';
  nameOf: () => string = () => 'Joe';
  /** set by main.ts: go to the host's lobby with this room code (or say the player is busy) */
  joinHook: (room: string) => JoinResult = () => 'busy';
  /** set by the invite prompt */
  onInvite: (inv: IncomingInvite) => void = () => undefined;
  onInviteGone: (inv: IncomingInvite, why: 'expired' | 'cancelled' | 'offline') => void = () => undefined;
  onAnswer: (friend: string, name: string, state: OutState) => void = () => undefined;

  constructor(
    book: FriendsBook,
    private open: (room: string, password: string) => Promise<Transport>,
    private version: string,
    private now: () => number = () => Date.now(),
  ) {
    this.book = book;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    for (const fn of [...this.listeners]) fn();
  }

  get online(): boolean {
    return !!this.presence;
  }

  /** Connect to every friend's room (no-op when hidden or already online). */
  ensureOnline(): void {
    if (this.presence || !this.book.data.appearOnline) return;
    const p = new Presence({ me: this.book.me, name: () => this.nameOf(), status: () => this.statusOf(), version: this.version, open: this.open, now: this.now });
    p.onInvite = (inv) => this.onInvite(inv);
    p.onInviteGone = (inv, why) => this.onInviteGone(inv, why);
    p.onAnswer = (f, n, s) => this.onAnswer(f, n, s);
    p.onName = (f, n) => this.book.setName(f, n);
    this.unsub = p.subscribe(() => this.changed());
    this.presence = p;
    p.setFriends(this.book.list.map((f) => f.code));
    if (typeof setInterval !== 'undefined') this.timer = setInterval(() => p.pulse(), 1000);
  }

  /** Start at boot only for players who use friends. */
  autoStart(): void {
    if (this.book.list.length) this.ensureOnline();
  }

  goOffline(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.presence?.close();
    this.unsub?.();
    this.unsub = null;
    this.presence = null;
    this.changed();
  }

  setAppearOnline(on: boolean): void {
    this.book.setAppearOnline(on);
    if (on) this.ensureOnline();
    else this.goOffline();
    this.changed();
  }

  add(raw: string): AddResult {
    const r = this.book.add(raw);
    if (r.ok) {
      this.presence?.setFriends(this.book.list.map((f) => f.code));
      this.ensureOnline();
    }
    this.changed();
    return r;
  }

  remove(code: string): void {
    this.book.remove(code);
    this.presence?.setFriends(this.book.list.map((f) => f.code));
    this.changed();
  }

  /** every friend, online first, with what presence knows about them */
  views(): (FriendView & { savedName: string })[] {
    const rows = this.book.list.map((f) => {
      const v = this.presence?.view(f.code) ?? { code: f.code, online: false, name: '', status: null, version: null, invite: null };
      return { ...v, savedName: f.name };
    });
    return rows.sort((a, b) => Number(b.online) - Number(a.online));
  }

  incoming(): IncomingInvite[] {
    return [...(this.presence?.incoming.values() ?? [])];
  }

  /** Accept an invite: answer it and go to the lobby (or decline as busy when the player cannot leave now). */
  accept(id: string): JoinResult | 'gone' {
    const p = this.presence;
    const inv = p?.incoming.get(id);
    if (!p || !inv || inv.expiresAt <= this.now()) {
      if (inv) p?.answer(id, false);
      return 'gone';
    }
    const res = this.joinHook(inv.room);
    p.answer(id, res === 'ok', res === 'busy' ? 'busy' : undefined);
    return res;
  }

  decline(id: string): void {
    this.presence?.answer(id, false);
  }
}

let service: FriendsService | null = null;

function netBc(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('net') === 'bc';
}

async function openRoom(room: string, password: string): Promise<Transport> {
  // the same-browser test transport (Playwright, ?net=bc); the relays otherwise, loaded only now
  if (netBc()) return new BroadcastTransport(room);
  return joinFriendRoom(room, password);
}

/** The app's friends service. Tests on `?net=bc` may pick an identity (`&me=CODE`) and pre-add friends (`&friends=A,B`). */
export function friends(): FriendsService {
  if (service) return service;
  let key = FRIENDS_KEY;
  let me: string | undefined;
  let pre: string[] = [];
  if (netBc()) {
    const q = new URLSearchParams(location.search);
    const m = parseFriendCode(q.get('me') ?? '');
    if (m) {
      me = m;
      key = `${FRIENDS_KEY}.${m}`;
    }
    pre = (q.get('friends') ?? '').split(',').filter(Boolean);
  }
  const book = new FriendsBook(getStore(), key, me);
  for (const c of pre) if (parseFriendCode(c) && !book.list.some((f) => f.code === parseFriendCode(c))) book.add(c);
  service = new FriendsService(book, openRoom, __GAME_VERSION__);
  return service;
}
