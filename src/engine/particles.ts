// Pooled particles (cosmetic only, never sent over the network). Math.random is allowed here (engine fx).
import { getGlow } from './draw/parts';

export type ParticleKind = 'dot' | 'glow' | 'spark' | 'ring' | 'smoke' | 'shard' | 'text';

const MAX = 1200;

export class Particles {
  readonly x = new Float32Array(MAX);
  readonly y = new Float32Array(MAX);
  readonly vx = new Float32Array(MAX);
  readonly vy = new Float32Array(MAX);
  readonly life = new Float32Array(MAX);
  readonly maxLife = new Float32Array(MAX);
  readonly size = new Float32Array(MAX);
  readonly grow = new Float32Array(MAX);
  readonly drag = new Float32Array(MAX);
  readonly grav = new Float32Array(MAX);
  readonly kind = new Uint8Array(MAX);
  readonly color: string[] = new Array<string>(MAX).fill('#fff');
  readonly text: string[] = new Array<string>(MAX).fill('');
  private freeList: number[] = [];
  private alive = new Uint8Array(MAX);
  count = 0;
  /** multiplier the settings can lower for performance */
  density = 1;

  constructor() {
    for (let i = MAX - 1; i >= 0; i--) this.freeList.push(i);
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
    kind: ParticleKind = 'dot',
    opts?: { drag?: number; grav?: number; grow?: number; text?: string },
  ): void {
    const i = this.freeList.pop();
    if (i === undefined) return;
    this.alive[i] = 1;
    this.count++;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.size[i] = size;
    this.color[i] = color;
    this.kind[i] = KIND_CODE[kind];
    this.drag[i] = opts?.drag ?? 2;
    this.grav[i] = opts?.grav ?? 0;
    this.grow[i] = opts?.grow ?? 0;
    this.text[i] = opts?.text ?? '';
  }

  /** Burst of n particles in all directions (or within an arc). */
  burst(
    x: number,
    y: number,
    n: number,
    speed: number,
    life: number,
    size: number,
    color: string,
    kind: ParticleKind = 'dot',
    angle = 0,
    spread = Math.PI,
    opts?: { drag?: number; grav?: number; grow?: number },
  ): void {
    const count = Math.max(1, Math.round(n * this.density));
    for (let k = 0; k < count; k++) {
      const a = angle + (Math.random() * 2 - 1) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.7), color, kind, opts);
    }
  }

  update(dt: number): void {
    for (let i = 0; i < MAX; i++) {
      if (!this.alive[i]) continue;
      this.life[i]! -= dt;
      if (this.life[i]! <= 0) {
        this.alive[i] = 0;
        this.count--;
        this.freeList.push(i);
        continue;
      }
      const d = Math.max(0, 1 - this.drag[i]! * dt);
      this.vx[i]! *= d;
      this.vy[i]! *= d;
      this.vy[i]! += this.grav[i]! * dt;
      this.x[i]! += this.vx[i]! * dt;
      this.y[i]! += this.vy[i]! * dt;
      this.size[i]! += this.grow[i]! * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let i = 0; i < MAX; i++) {
      if (!this.alive[i]) continue;
      const t = this.life[i]! / this.maxLife[i]!;
      const k = this.kind[i]!;
      const x = this.x[i]!;
      const y = this.y[i]!;
      const s = Math.max(0.1, this.size[i]!);
      if (k === 1) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = t * 0.9;
        const g = getGlow(this.color[i]!);
        ctx.drawImage(g, x - s * 2, y - s * 2, s * 4, s * 4);
        ctx.globalCompositeOperation = 'source-over';
      } else if (k === 2) {
        ctx.globalAlpha = t;
        ctx.strokeStyle = this.color[i]!;
        ctx.lineWidth = Math.max(1, s * 0.5);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - this.vx[i]! * 0.04, y - this.vy[i]! * 0.04);
        ctx.stroke();
      } else if (k === 3) {
        ctx.globalAlpha = t * 0.8;
        ctx.strokeStyle = this.color[i]!;
        ctx.lineWidth = 3 * t + 1;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.stroke();
      } else if (k === 4) {
        ctx.globalAlpha = t * 0.35;
        ctx.fillStyle = this.color[i]!;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (k === 5) {
        ctx.globalAlpha = t;
        ctx.fillStyle = this.color[i]!;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.life[i]! * 8);
        ctx.fillRect(-s / 2, -s, s, s * 2);
        ctx.restore();
      } else if (k === 6) {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.font = `bold ${Math.round(s)}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(this.text[i]!, x, y);
        ctx.fillStyle = this.color[i]!;
        ctx.fillText(this.text[i]!, x, y);
      } else {
        ctx.globalAlpha = t;
        ctx.fillStyle = this.color[i]!;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  clear(): void {
    for (let i = 0; i < MAX; i++) {
      if (this.alive[i]) {
        this.alive[i] = 0;
        this.freeList.push(i);
      }
    }
    this.count = 0;
  }
}

const KIND_CODE: Record<ParticleKind, number> = { dot: 0, glow: 1, spark: 2, ring: 3, smoke: 4, shard: 5, text: 6 };
