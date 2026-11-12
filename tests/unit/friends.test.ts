import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../../src/engine/settings';
import { formatFriendCode, friendRoom, newFriendCode, parseFriendCode } from '../../src/game/net/friendCode';
import { FriendsService } from '../../src/game/net/friends';
import { LoopbackHub } from '../../src/game/net/loopback';
import { INVITE_TTL_MS, Presence, type FriendStatus, type IncomingInvite, type OutState } from '../../src/game/net/presence';
import { FriendsBook, FRIENDS_KEY, MAX_FRIENDS } from '../../src/game/save/friends';

// D339: friend codes, the friends book, presence and invites over the loopback transport.

const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

describe('friend codes', () => {
  it('round-trips, forgives typing and catches typos', () => {
    for (let i = 0; i < 50; i++) {
      const c = newFriendCode();
      expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/);
      expect(parseFriendCode(c)).toBe(c);
      expect(parseFriendCode(` ${formatFriendCode(c).toLowerCase()} `)).toBe(c);
    }
    const c = newFriendCode();
    // one character changed is caught by the check character
    const i = 3;
    const other = c[i] === 'A' ? 'B' : 'A';
    expect(parseFriendCode(c.slice(0, i) + other + c.slice(i + 1))).toBeNull();
    expect(parseFriendCode('hello')).toBeNull();
    expect(parseFriendCode('')).toBeNull();
  });

  it('reads O as 0 and I or L as 1', () => {
    let c = newFriendCode();
    while (!c.includes('0') && !c.includes('1')) c = newFriendCode();
    expect(parseFriendCode(c.replace(/0/g, 'O').replace(/1/g, 'l'))).toBe(c);
  });

  it('gives two friends the same room whoever adds whom, and nobody else that room', async () => {
    const a = newFriendCode();
    const b = newFriendCode();
    const c = newFriendCode();
    const ab = await friendRoom(a, b);
    expect(await friendRoom(b, a)).toEqual(ab);
    expect((await friendRoom(a, c)).room).not.toBe(ab.room);
    // the room id carries neither code
    expect(ab.room).not.toContain(a);
    expect(ab.room).not.toContain(b);
    expect(ab.password.length).toBeGreaterThan(20);
  });
});

describe('the friends book', () => {
  it('keeps its own code, refuses bad adds, and persists', () => {
    const store = new MemoryStore();
    const book = new FriendsBook(store);
    const me = book.me;
    expect(parseFriendCode(me)).toBe(me);
    expect(book.add(me).ok).toBe(false);
    expect(book.add('nope').ok).toBe(false);
    const f = newFriendCode();
    expect(book.add(formatFriendCode(f)).ok).toBe(true);
    expect(book.add(f).ok).toBe(false);
    book.setName(f, 'Ann');
    const again = new FriendsBook(store);
    expect(again.me).toBe(me);
    expect(again.list).toEqual([expect.objectContaining({ code: f, name: 'Ann' })]);
    again.remove(f);
    expect(new FriendsBook(store).list).toEqual([]);
    expect(JSON.parse(store.getItem(FRIENDS_KEY)!).v).toBe(1);
  });

  it('caps the list', () => {
    const book = new FriendsBook(new MemoryStore());
    for (let i = 0; i < MAX_FRIENDS; i++) expect(book.add(newFriendCode()).ok).toBe(true);
    const r = book.add(newFriendCode());
    expect(r.ok).toBe(false);
  });

  it('survives junk in storage', () => {
    const store = new MemoryStore();
    store.setItem(FRIENDS_KEY, '{not json');
    expect(new FriendsBook(store).list).toEqual([]);
    store.setItem(FRIENDS_KEY, JSON.stringify({ me: 'bad', list: [{ code: 'x' }, null, 4] }));
    const b = new FriendsBook(store);
    expect(parseFriendCode(b.me)).toBe(b.me);
    expect(b.list).toEqual([]);
  });
});

/** a player: their own presence on the hub, a clock, and what they are doing */
function player(hub: LoopbackHub, clock: { t: number }, name: string, code = newFriendCode()) {
  const me = { code, status: 'menu' as FriendStatus, name, invites: [] as IncomingInvite[], gone: [] as string[], answers: [] as OutState[] };
  let n = 0;
  const p = new Presence({
    me: code,
    name: () => me.name,
    status: () => me.status,
    version: 'test',
    now: () => clock.t,
    open: async (room) => hub.join(room, `${name}-${n++}`),
  });
  p.onInvite = (inv) => me.invites.push(inv);
  p.onInviteGone = (_inv, why) => me.gone.push(why);
  p.onAnswer = (_f, _n, s) => me.answers.push(s);
  return Object.assign(me, { p });
}

async function settle(hub: LoopbackHub, ms = 100): Promise<void> {
  await flush();
  hub.pump(ms);
  await flush();
  hub.pump(ms);
}

describe('presence', () => {
  it('two friends who added each other see each other online, with name and status', async () => {
    const hub = new LoopbackHub({ latencyMs: 30 });
    const clock = { t: 0 };
    const a = player(hub, clock, 'Ann');
    const b = player(hub, clock, 'Bob');
    a.p.setFriends([b.code]);
    expect(a.p.view(b.code).online).toBe(false);
    b.p.setFriends([a.code]);
    await settle(hub);
    expect(a.p.view(b.code)).toMatchObject({ online: true, name: 'Bob', status: 'menu', version: 'test' });
    expect(b.p.view(a.code)).toMatchObject({ online: true, name: 'Ann' });
    // status and name changes reach them on the next pulse
    b.status = 'hosting';
    b.name = 'Bobby';
    b.p.pulse();
    await settle(hub);
    expect(a.p.view(b.code)).toMatchObject({ status: 'hosting', name: 'Bobby' });
    // and leaving the game is going offline
    b.p.close();
    await settle(hub);
    expect(a.p.view(b.code).online).toBe(false);
  });

  it('a one-sided add sees nothing, and the other side learns nothing (privacy)', async () => {
    const hub = new LoopbackHub({ latencyMs: 10 });
    const clock = { t: 0 };
    const a = player(hub, clock, 'Ann');
    const c = player(hub, clock, 'Cat');
    // Ann adds Cat, Cat never added Ann: different rooms, so neither connects
    a.p.setFriends([c.code]);
    c.p.setFriends([]);
    await settle(hub);
    expect(a.p.view(c.code).online).toBe(false);
    const ac = await friendRoom(a.code, c.code);
    expect(hub.members(ac.room).length).toBe(1);
  });

  it('a second tab of your own in a friend room is not taken for the friend', async () => {
    const hub = new LoopbackHub({ latencyMs: 10 });
    const clock = { t: 0 };
    const a = player(hub, clock, 'Ann');
    const a2 = player(hub, clock, 'Ann2', a.code);
    const b = newFriendCode();
    a.p.setFriends([b]);
    a2.p.setFriends([b]);
    await settle(hub);
    expect(a.p.view(b).online).toBe(false);
  });

  it('removing a friend leaves their room', async () => {
    const hub = new LoopbackHub({ latencyMs: 10 });
    const clock = { t: 0 };
    const a = player(hub, clock, 'Ann');
    const b = player(hub, clock, 'Bob');
    a.p.setFriends([b.code]);
    b.p.setFriends([a.code]);
    await settle(hub);
    a.p.setFriends([]);
    await settle(hub);
    expect(b.p.view(a.code).online).toBe(false);
  });
});

describe('invites', () => {
  async function pair() {
    const hub = new LoopbackHub({ latencyMs: 25 });
    const clock = { t: 1000 };
    const a = player(hub, clock, 'Host Ann');
    const b = player(hub, clock, 'Bob');
    a.status = 'hosting';
    a.p.setFriends([b.code]);
    b.p.setFriends([a.code]);
    await settle(hub);
    return { hub, clock, a, b };
  }

  it('an invite carries the room code; accepting tells the host', async () => {
    const { hub, a, b } = await pair();
    expect(a.p.invite(b.code, '123456', 3, 'Host Ann')).toBe(true);
    // one at a time
    expect(a.p.invite(b.code, '123456', 3, 'Host Ann')).toBe(false);
    await settle(hub);
    expect(b.invites).toHaveLength(1);
    expect(b.invites[0]).toMatchObject({ from: a.code, name: 'Host Ann', room: '123456', zone: 3 });
    const got = b.p.answer(b.invites[0]!.id, true);
    expect(got?.room).toBe('123456');
    await settle(hub);
    expect(a.answers).toEqual(['accepted']);
    expect(a.p.view(b.code).invite?.state).toBe('accepted');
  });

  it('declining tells the host, who can invite again', async () => {
    const { hub, a, b } = await pair();
    a.p.invite(b.code, '123456', 1, 'Host Ann');
    await settle(hub);
    b.p.answer(b.invites[0]!.id, false);
    await settle(hub);
    expect(a.answers).toEqual(['declined']);
    expect(a.p.invite(b.code, '123456', 1, 'Host Ann')).toBe(true);
  });

  it('an unanswered invite runs out on both sides', async () => {
    const { hub, clock, a, b } = await pair();
    a.p.invite(b.code, '654321', 1, 'Host Ann');
    await settle(hub);
    expect(b.p.incoming.size).toBe(1);
    clock.t += INVITE_TTL_MS + 1;
    a.p.pulse();
    b.p.pulse();
    expect(b.gone).toEqual(['expired']);
    expect(b.p.incoming.size).toBe(0);
    expect(a.p.view(b.code).invite?.state).toBe('expired');
    // accepting it late finds nothing
    expect(b.p.answer(b.invites[0]!.id, true)).toBeNull();
    expect(a.p.invite(b.code, '654321', 1, 'Host Ann')).toBe(true);
  });

  it('closing the lobby withdraws invites still waiting', async () => {
    const { hub, a, b } = await pair();
    a.p.invite(b.code, '111111', 1, 'Host Ann');
    await settle(hub);
    a.p.cancelInvites();
    await settle(hub);
    expect(b.gone).toEqual(['cancelled']);
    expect(b.p.incoming.size).toBe(0);
  });

  it('the host going offline takes the invite with them', async () => {
    const { hub, a, b } = await pair();
    a.p.invite(b.code, '111111', 1, 'Host Ann');
    await settle(hub);
    a.p.close();
    await settle(hub);
    expect(b.p.incoming.size).toBe(0);
    expect(b.gone.length).toBe(1);
  });

  it('a friend already in a co-op game answers busy without being asked', async () => {
    const { hub, a, b } = await pair();
    b.status = 'coop';
    a.p.invite(b.code, '222222', 1, 'Host Ann');
    await settle(hub);
    expect(b.invites).toEqual([]);
    expect(a.answers).toEqual(['busy']);
  });

  it('no invite to a friend who is offline, or with a bad room code', async () => {
    const { a, b } = await pair();
    expect(a.p.invite(b.code, 'abc', 1, 'Host Ann')).toBe(false);
    expect(a.p.invite(newFriendCode(), '123456', 1, 'Host Ann')).toBe(false);
  });
});

describe('the friends service', () => {
  it('accepting joins the room through the join hook; a busy player declines as busy', async () => {
    const hub = new LoopbackHub({ latencyMs: 20 });
    const now = 0;
    let n = 0;
    const make = (name: string) => {
      const s = new FriendsService(new FriendsBook(new MemoryStore()), async (room) => hub.join(room, `${name}-${n++}`), 'test', () => now);
      s.nameOf = () => name;
      return s;
    };
    const host = make('Ann');
    const guest = make('Bob');
    host.add(guest.book.me);
    guest.add(host.book.me);
    await settle(hub);
    expect(host.views()[0]).toMatchObject({ online: true, name: 'Bob' });
    expect(guest.book.list[0]!.name).toBe('Ann');
    const joined: string[] = [];
    let busy = false;
    guest.joinHook = (room) => {
      if (busy) return 'busy';
      joined.push(room);
      return 'ok';
    };
    const answers: OutState[] = [];
    host.onAnswer = (_c, _n, s) => answers.push(s);
    host.presence!.invite(guest.book.me, '777777', 2, 'Ann');
    await settle(hub);
    const inv = guest.incoming()[0]!;
    expect(guest.accept(inv.id)).toBe('ok');
    expect(joined).toEqual(['777777']);
    await settle(hub);
    expect(answers).toEqual(['accepted']);
    // again, while busy
    host.presence!.clearInvite(guest.book.me);
    host.presence!.invite(guest.book.me, '777777', 2, 'Ann');
    await settle(hub);
    busy = true;
    expect(guest.accept(guest.incoming()[0]!.id)).toBe('busy');
    await settle(hub);
    expect(answers).toEqual(['accepted', 'busy']);
    // hidden: nobody connects
    guest.setAppearOnline(false);
    await settle(hub);
    expect(host.views()[0]!.online).toBe(false);
    host.goOffline();
  });
});
