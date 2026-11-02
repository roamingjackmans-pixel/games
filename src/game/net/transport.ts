// Transport interface (NETCODE §1, §8): the Trystero adapter, the in-memory loopback (tests) and the
// BroadcastChannel transport (?net=test, Playwright) all implement it. Payloads are JSON values or
// ArrayBuffers; every channel is reliable and ordered (WebRTC data channels in Trystero are).

export type NetPayload = ArrayBuffer | string | number | boolean | null | { [k: string]: unknown } | unknown[];

export interface NetChannel<T extends NetPayload = NetPayload> {
  /** to: one peer, several, or everyone (null/undefined) */
  send(data: T, to?: string | string[] | null): void;
  onMessage(cb: (data: T, from: string) => void): void;
}

export interface Transport {
  readonly selfId: string;
  readonly kind: 'loopback' | 'broadcast' | 'trystero';
  channel<T extends NetPayload = NetPayload>(name: string): NetChannel<T>;
  onPeerJoin(cb: (peerId: string) => void): void;
  onPeerLeave(cb: (peerId: string) => void): void;
  peers(): string[];
  leave(): void;
}

/** Shared bookkeeping for transports: channel handlers and peer callbacks. */
export abstract class BaseTransport implements Transport {
  abstract readonly selfId: string;
  abstract readonly kind: Transport['kind'];
  protected handlers = new Map<string, ((data: NetPayload, from: string) => void)[]>();
  protected joinCbs: ((id: string) => void)[] = [];
  protected leaveCbs: ((id: string) => void)[] = [];
  protected peerSet = new Set<string>();
  protected closed = false;

  protected abstract rawSend(name: string, data: NetPayload, to: string[] | null): void;

  channel<T extends NetPayload = NetPayload>(name: string): NetChannel<T> {
    return {
      send: (data, to) => {
        if (this.closed) return;
        const list = to == null ? null : Array.isArray(to) ? to : [to];
        this.rawSend(name, data, list);
      },
      onMessage: (cb) => {
        const list = this.handlers.get(name) ?? [];
        list.push(cb as (data: NetPayload, from: string) => void);
        this.handlers.set(name, list);
      },
    };
  }

  onPeerJoin(cb: (peerId: string) => void): void {
    this.joinCbs.push(cb);
  }

  onPeerLeave(cb: (peerId: string) => void): void {
    this.leaveCbs.push(cb);
  }

  peers(): string[] {
    return [...this.peerSet];
  }

  /** Subclasses call these when the medium reports a peer or a message. */
  protected peerJoined(id: string): void {
    if (this.closed || this.peerSet.has(id)) return;
    this.peerSet.add(id);
    for (const cb of this.joinCbs) cb(id);
  }

  protected peerLeft(id: string): void {
    if (!this.peerSet.delete(id)) return;
    for (const cb of this.leaveCbs) cb(id);
  }

  protected deliver(name: string, data: NetPayload, from: string): void {
    if (this.closed) return;
    for (const cb of this.handlers.get(name) ?? []) cb(data, from);
  }

  leave(): void {
    this.closed = true;
  }
}

/** A short random id for transports without one (crypto, not the game RNG). */
export function randomPeerId(): string {
  const a = new Uint8Array(8);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
