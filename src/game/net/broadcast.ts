// BroadcastChannel transport: peers in the same browser (the ?net=test two-pane page, Playwright). Presence
// is a hello/here handshake plus a heartbeat; a peer silent for 4 s is gone.
import { BaseTransport, BIG_MESSAGE_BYTES, randomPeerId, type NetPayload } from './transport';

type Wire =
  | { t: 'hello' | 'here' | 'beat' | 'bye'; from: string }
  | { t: 'msg'; from: string; to: string[] | null; ch: string; data: NetPayload };

export class BroadcastTransport extends BaseTransport {
  readonly kind = 'broadcast' as const;
  readonly selfId = randomPeerId();
  private bc: BroadcastChannel;
  private seen = new Map<string, number>();
  private timer: ReturnType<typeof setInterval>;
  /**
   * Test network conditions (D154): `?lag=60&jitter=25` delays every message by lag ± jitter ms one way, kept in
   * order per sender like the real (reliable, ordered) WebRTC channel, so prediction can be tried as over the internet.
   */
  private lagMs = 0;
  private jitterMs = 0;
  /** `?biglate=1` (D393): a message over 16 KiB arrives two trips later and does not hold back later ones, as Trystero's */
  private bigLate = false;
  private lastAt = new Map<string, number>();
  /** test jitter only, from its own tiny generator (Math.random is banned in src/game) */
  private jit = 1;
  private jitRand(): number {
    this.jit = (this.jit * 1103515245 + 12345) & 0x7fffffff;
    return this.jit / 0x7fffffff;
  }

  constructor(room: string) {
    super();
    if (typeof location !== 'undefined') {
      const q = new URLSearchParams(location.search);
      this.lagMs = Math.max(0, Number(q.get('lag')) || 0);
      this.jitterMs = Math.max(0, Number(q.get('jitter')) || 0);
      this.bigLate = q.get('biglate') === '1';
    }
    this.bc = new BroadcastChannel(`dungeon-joe-v1:${room}`);
    this.bc.onmessage = (ev: MessageEvent<Wire>) => this.onWire(ev.data);
    this.post({ t: 'hello', from: this.selfId });
    this.timer = setInterval(() => {
      this.post({ t: 'beat', from: this.selfId });
      const now = performance.now();
      for (const [id, at] of this.seen) if (now - at > 4000) {
        this.seen.delete(id);
        this.peerLeft(id);
      }
    }, 1000);
  }

  private post(w: Wire): void {
    if (!this.closed) this.bc.postMessage(w);
  }

  private onWire(w: Wire): void {
    if (this.closed || w.from === this.selfId) return;
    if (w.t === 'bye') {
      this.seen.delete(w.from);
      this.peerLeft(w.from);
      return;
    }
    const known = this.seen.has(w.from);
    this.seen.set(w.from, performance.now());
    if (!known) {
      this.peerJoined(w.from);
      if (w.t !== 'here') this.post({ t: 'here', from: this.selfId });
    }
    if (w.t === 'msg' && (!w.to || w.to.includes(this.selfId))) {
      const big = this.bigLate && w.data instanceof ArrayBuffer && w.data.byteLength > BIG_MESSAGE_BYTES;
      if (!this.lagMs && !this.jitterMs && !big) this.deliver(w.ch, w.data, w.from);
      else {
        const now = performance.now();
        const trip = this.lagMs + this.jitRand() * this.jitterMs;
        const at = big ? now + Math.max(30, trip) * 3 : Math.max(this.lastAt.get(w.from) ?? 0, now + trip);
        if (!big) this.lastAt.set(w.from, at);
        setTimeout(() => {
          if (!this.closed) this.deliver(w.ch, w.data, w.from);
        }, at - now);
      }
    }
  }

  protected rawSend(name: string, data: NetPayload, to: string[] | null): void {
    this.post({ t: 'msg', from: this.selfId, to, ch: name, data });
  }

  override leave(): void {
    if (this.closed) return;
    this.post({ t: 'bye', from: this.selfId });
    super.leave();
    clearInterval(this.timer);
    this.bc.close();
  }
}
