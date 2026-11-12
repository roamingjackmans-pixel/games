// The friends list (DATA_MODEL §1.1, D339): one record per browser in `dj.friends`, not in a save file. Friends
// belong to the person at this browser, not to one of their ten characters: deleting, importing or exporting a
// character never changes who their friends are or what their own friend code is.
import type { KeyValueStore } from '../../engine/settings';
import { newFriendCode, parseFriendCode } from '../net/friendCode';

export const FRIENDS_KEY = 'dj.friends';
/** each friend is one relay room kept open while online, so the list is capped */
export const MAX_FRIENDS = 30;
export const FRIEND_NAME_MAX = 16;

export interface FriendEntry {
  code: string;
  /** the name they last announced (empty until they have been seen online) */
  name: string;
  added: number;
}

export interface FriendsData {
  v: 1;
  /** this browser's own friend code */
  me: string;
  /** off: never connect, so nobody sees you and you see nobody */
  appearOnline: boolean;
  list: FriendEntry[];
}

export function normalizeFriends(raw: unknown, me?: string): FriendsData {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const own = (me && parseFriendCode(me)) || (typeof o.me === 'string' && parseFriendCode(o.me)) || newFriendCode();
  const list: FriendEntry[] = [];
  if (Array.isArray(o.list))
    for (const e of o.list as Record<string, unknown>[]) {
      const code = typeof e?.code === 'string' ? parseFriendCode(e.code) : null;
      if (!code || code === own || list.some((x) => x.code === code)) continue;
      list.push({ code, name: typeof e.name === 'string' ? e.name.slice(0, FRIEND_NAME_MAX) : '', added: typeof e.added === 'number' ? e.added : 0 });
      if (list.length >= MAX_FRIENDS) break;
    }
  return { v: 1, me: own, appearOnline: o.appearOnline !== false, list };
}

export type AddResult = { ok: true; entry: FriendEntry } | { ok: false; error: string };

export class FriendsBook {
  data: FriendsData;
  constructor(
    private store: KeyValueStore,
    private key = FRIENDS_KEY,
    me?: string,
  ) {
    let raw: unknown;
    try {
      const s = store.getItem(key);
      raw = s ? JSON.parse(s) : null;
    } catch {
      raw = null;
    }
    this.data = normalizeFriends(raw, me);
    this.save();
  }

  get me(): string {
    return this.data.me;
  }

  get list(): readonly FriendEntry[] {
    return this.data.list;
  }

  save(): void {
    try {
      this.store.setItem(this.key, JSON.stringify(this.data));
    } catch {
      // storage full or blocked: the list lives for this session only
    }
  }

  add(raw: string, now = Date.now()): AddResult {
    const code = parseFriendCode(raw);
    if (!code) return { ok: false, error: 'That is not a friend code (10 letters and digits, like 7K3QD-M9X2A).' };
    if (code === this.me) return { ok: false, error: 'That is your own code. Send it to a friend instead.' };
    if (this.data.list.some((f) => f.code === code)) return { ok: false, error: 'They are already on your list.' };
    if (this.data.list.length >= MAX_FRIENDS) return { ok: false, error: `Your list is full (${MAX_FRIENDS}). Remove someone first.` };
    const entry: FriendEntry = { code, name: '', added: now };
    this.data.list.push(entry);
    this.save();
    return { ok: true, entry };
  }

  remove(code: string): void {
    const n = this.data.list.length;
    this.data.list = this.data.list.filter((f) => f.code !== code);
    if (this.data.list.length !== n) this.save();
  }

  /** remember the name a friend announced, so the list shows it while they are offline */
  setName(code: string, name: string): void {
    const f = this.data.list.find((x) => x.code === code);
    const nm = name.trim().slice(0, FRIEND_NAME_MAX);
    if (!f || !nm || f.name === nm) return;
    f.name = nm;
    this.save();
  }

  setAppearOnline(on: boolean): void {
    this.data.appearOnline = on;
    this.save();
  }
}
