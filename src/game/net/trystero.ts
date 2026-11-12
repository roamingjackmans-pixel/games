// Trystero adapter (NETCODE §1, D5): WebRTC through public Nostr relays first; a joiner that finds no peer
// within 8 s also tries MQTT relays, and the host listens on both. The strategies load on demand so solo
// play never downloads them.
import { BaseTransport, type NetChannel, type NetPayload } from './transport';

export const APP_ID = 'dungeon-joe-v1';
const FALLBACK_AFTER_MS = 8000;

interface TrysteroAction {
  send: (data: NetPayload, options?: { target?: string | string[] | null }) => Promise<void>;
  onMessage: ((data: NetPayload, context: { peerId: string }) => void) | null;
}
interface TrysteroRoom {
  makeAction: (name: string) => TrysteroAction;
  leave: () => Promise<void>;
  onPeerJoin: ((peerId: string) => void) | null;
  onPeerLeave: ((peerId: string) => void) | null;
  getPeers: () => Record<string, unknown>;
}
interface Strategy {
  joinRoom: (config: { appId: string; password?: string }, roomId: string) => TrysteroRoom;
  selfId: string;
}

/** Binary messages arrive as typed-array views; the codecs want a plain ArrayBuffer. */
function toBuffer(d: NetPayload): NetPayload {
  if (ArrayBuffer.isView(d)) return d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) as ArrayBuffer;
  return d;
}

/** A password derived from the room code keeps strangers who guess the id from reading traffic. */
export function passwordFor(code: string): string {
  return `dj-${code.split('').reverse().join('')}-${code.length * 7919}`;
}

export class TrysteroTransport extends BaseTransport {
  readonly kind = 'trystero' as const;
  selfId = '';
  private rooms: { name: string; room: TrysteroRoom; actions: Map<string, TrysteroAction>; peers: Set<string> }[] = [];
  private names = new Set<string>();
  /** a guest uses one relay network: the first one on which any peer turned up (D158) */
  private chosen: (typeof this.rooms)[number] | null = null;
  status = 'connecting';

  constructor(
    private code: string,
    private role: 'host' | 'guest',
    private onStatus: (s: string) => void = () => undefined,
    /** friend rooms (D339): their own password, and Nostr only (one room per friend, so no second network) */
    private opts: { password?: string; mqtt?: boolean } = {},
  ) {
    super();
  }

  async connect(): Promise<void> {
    await this.add('nostr', () => import('trystero/nostr') as unknown as Promise<Strategy>);
    this.setStatus(this.role === 'host' ? 'waiting for friends' : 'finding your friend…');
    if (this.opts.mqtt === false) return;
    if (this.role === 'host') {
      // the host is reachable on both relay networks
      void this.add('mqtt', () => import('@trystero-p2p/mqtt') as unknown as Promise<Strategy>).catch(() => undefined);
    } else {
      setTimeout(() => {
        if (this.closed || this.peerSet.size > 0) return;
        this.setStatus('still looking (trying a second relay network)…');
        void this.add('mqtt', () => import('@trystero-p2p/mqtt') as unknown as Promise<Strategy>).catch(() => undefined);
      }, FALLBACK_AFTER_MS);
    }
  }

  private setStatus(s: string): void {
    this.status = s;
    this.onStatus(s);
  }

  private async add(name: string, load: () => Promise<Strategy>): Promise<void> {
    const mod = await load();
    if (this.closed) return;
    this.selfId ||= mod.selfId;
    const room = mod.joinRoom({ appId: APP_ID, password: this.opts.password ?? passwordFor(this.code) }, this.code);
    const entry = { name, room, actions: new Map<string, TrysteroAction>(), peers: new Set<string>() };
    this.rooms.push(entry);
    for (const n of this.names) this.wire(entry, n);
    room.onPeerJoin = (id) => {
      // a guest keeps whichever relay NETWORK connected first, and every peer on it (D158): it used to keep only the
      // first PEER, and in a party of 3+ that is often another guest (the mesh links guests too), so the host was
      // ignored: the guest heard the lobby but its hello never left, so it never joined
      if (this.role === 'guest') {
        if (this.chosen && this.chosen !== entry) return;
        this.chosen = entry;
      }
      entry.peers.add(id);
      this.setStatus('connected');
      this.peerJoined(id);
    };
    room.onPeerLeave = (id) => {
      entry.peers.delete(id);
      if (!this.rooms.some((r) => r.peers.has(id))) this.peerLeft(id);
    };
  }

  private wire(entry: (typeof this.rooms)[number], name: string): void {
    if (entry.actions.has(name)) return;
    const a = entry.room.makeAction(name);
    a.onMessage = (data, ctx) => {
      // a guest listens on its chosen network only (the host would otherwise reach it twice)
      if (this.role === 'guest' && this.chosen && this.chosen !== entry) return;
      this.deliver(name, toBuffer(data), ctx.peerId);
    };
    entry.actions.set(name, a);
  }

  override channel<T extends NetPayload = NetPayload>(name: string): NetChannel<T> {
    if (!this.names.has(name)) {
      this.names.add(name);
      for (const r of this.rooms) this.wire(r, name);
    }
    return super.channel<T>(name);
  }

  protected rawSend(name: string, data: NetPayload, to: string[] | null): void {
    // each peer once, through the first network that has it
    const sent = new Set<string>();
    for (const r of this.rooms) {
      const a = r.actions.get(name);
      if (!a) continue;
      const targets = (to ?? [...r.peers]).filter((id) => r.peers.has(id) && !sent.has(id));
      if (!targets.length) continue;
      for (const id of targets) sent.add(id);
      void a.send(data, { target: targets }).catch(() => undefined);
    }
  }

  override leave(): void {
    if (this.closed) return;
    super.leave();
    for (const r of this.rooms) void r.room.leave().catch(() => undefined);
    this.rooms = [];
  }
}

export async function joinTrystero(code: string, role: 'host' | 'guest', onStatus?: (s: string) => void): Promise<TrysteroTransport> {
  const t = new TrysteroTransport(code, role, onStatus);
  await t.connect();
  return t;
}

/** A friend room (NETCODE §10, D339): the two friends are equals in it, on the Nostr relays only. */
export async function joinFriendRoom(room: string, password: string): Promise<TrysteroTransport> {
  const t = new TrysteroTransport(room, 'host', undefined, { password, mqtt: false });
  await t.connect();
  return t;
}
