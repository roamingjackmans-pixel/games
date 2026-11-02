// In-memory transport (NETCODE §8): host and guests in one process, with configurable latency, jitter
// and loss so the netcode is testable in Node. Time only moves when the hub is pumped (deterministic).
import { Rng } from '../../engine/rng';
import { BaseTransport, type NetPayload } from './transport';

export interface LoopbackOpts {
  latencyMs?: number;
  jitterMs?: number;
  /** drop chance for channels named in `lossy` (inputs, snapshots) */
  loss?: number;
  lossy?: string[];
  seed?: string;
}

interface Packet {
  at: number;
  seq: number;
  to: LoopbackTransport;
  name: string;
  data: NetPayload;
  from: string;
}

function copy(d: NetPayload): NetPayload {
  if (d instanceof ArrayBuffer) return d.slice(0);
  if (d === null || typeof d !== 'object') return d;
  return JSON.parse(JSON.stringify(d)) as NetPayload;
}

export class LoopbackHub {
  now = 0;
  private queue: Packet[] = [];
  private seq = 0;
  private rooms = new Map<string, Set<LoopbackTransport>>();
  private rng: Rng;
  constructor(public opts: LoopbackOpts = {}) {
    this.rng = new Rng(opts.seed ?? 'loopback');
  }

  join(room: string, id: string): LoopbackTransport {
    const t = new LoopbackTransport(this, room, id);
    const set = this.rooms.get(room) ?? new Set();
    this.rooms.set(room, set);
    const others = [...set];
    set.add(t);
    // presence is announced after the usual latency, like a signalling relay
    for (const o of others) {
      this.later(() => {
        if (!t.isClosed() && !o.isClosed()) {
          o.peerJoinedPublic(id);
          t.peerJoinedPublic(o.selfId);
        }
      });
    }
    return t;
  }

  leave(t: LoopbackTransport): void {
    const set = this.rooms.get(t.room);
    if (!set) return;
    set.delete(t);
    for (const o of set) this.later(() => o.peerLeftPublic(t.selfId));
  }

  members(room: string): LoopbackTransport[] {
    return [...(this.rooms.get(room) ?? [])];
  }

  private delay(): number {
    const l = this.opts.latencyMs ?? 0;
    const j = this.opts.jitterMs ?? 0;
    return Math.max(0, l + (j ? this.rng.range(-j, j) : 0));
  }

  private timers: { at: number; seq: number; fn: () => void }[] = [];
  private later(fn: () => void): void {
    this.timers.push({ at: this.now + this.delay(), seq: this.seq++, fn });
  }

  send(from: LoopbackTransport, name: string, data: NetPayload, to: string[] | null): void {
    const set = this.rooms.get(from.room);
    if (!set) return;
    const lossy = this.opts.lossy?.includes(name) ?? false;
    for (const t of set) {
      if (t === from) continue;
      if (to && !to.includes(t.selfId)) continue;
      if (lossy && this.opts.loss && this.rng.chance(this.opts.loss)) continue;
      // reliable channels stay in order: never deliver before an earlier packet to the same peer
      let at = this.now + this.delay();
      if (!lossy) for (const q of this.queue) if (q.to === t && q.from === from.selfId && q.at > at) at = q.at;
      this.queue.push({ at, seq: this.seq++, to: t, name, data: copy(data), from: from.selfId });
    }
  }

  /** Move time forward, delivering everything due. */
  pump(ms = 0): void {
    const end = this.now + ms;
    for (;;) {
      const due = [...this.queue.filter((p) => p.at <= end), ...this.timers.filter((t) => t.at <= end)];
      if (!due.length) break;
      due.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const first = due[0]!;
      this.now = Math.max(this.now, first.at);
      if ('to' in first) {
        this.queue.splice(this.queue.indexOf(first), 1);
        if (!first.to.isClosed()) first.to.receive(first.name, first.data, first.from);
      } else {
        this.timers.splice(this.timers.indexOf(first), 1);
        first.fn();
      }
    }
    this.now = end;
  }
}

export class LoopbackTransport extends BaseTransport {
  readonly kind = 'loopback' as const;
  constructor(
    private hub: LoopbackHub,
    public room: string,
    public readonly selfId: string,
  ) {
    super();
  }

  protected rawSend(name: string, data: NetPayload, to: string[] | null): void {
    this.hub.send(this, name, data, to);
  }

  receive(name: string, data: NetPayload, from: string): void {
    this.deliver(name, data, from);
  }

  peerJoinedPublic(id: string): void {
    this.peerJoined(id);
  }

  peerLeftPublic(id: string): void {
    this.peerLeft(id);
  }

  isClosed(): boolean {
    return this.closed;
  }

  override leave(): void {
    if (this.closed) return;
    super.leave();
    this.hub.leave(this);
  }
}
