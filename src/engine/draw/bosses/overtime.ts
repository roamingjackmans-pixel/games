// The New Game+ third phase ("Overtime", D295) look every zone 1–7 boss shares (D358, D359): a pulsing aura, turning
// rings on the floor (runes or a clock face), wisps orbiting the body and motes rising off it. Each boss picks its
// colours and what the wisps and motes are, so the Caretaker's soulfire, Mother Spore's bloom, the Bloatking's drowned
// treasure, Vexthorn's fey hunt, Ignatius's meltdown, Aurelia's absolute zero and Tock's gears each read their own.
import { TAU, glow, hash, withAlpha } from '../shapesBoss';
import type { DrawState } from '../registry';

export type WispKind = 'orb' | 'coin' | 'shard' | 'gear' | 'leaf';
export type MoteKind = 'glow' | 'flake' | 'bubble' | 'ember' | 'tick';
export type RingKind = 'runes' | 'clock';

export interface OvertimeLook {
  color: string;
  core: string;
  rings?: number;
  ringKind?: RingKind;
  wisps?: WispKind;
  motes?: MoteKind;
  /** pixels (in boss radii) the body floats above its floor spot, so the aura and rings sit with it */
  lift?: number;
  /** how many wisps orbit */
  count?: number;
}

function wisp(ctx: CanvasRenderingContext2D, kind: WispKind, x: number, y: number, a: number, size: number, color: string, core: string, k: number): void {
  glow(ctx, x, y, size * 1.9, color, 0.55 * k);
  ctx.save();
  ctx.translate(x, y);
  switch (kind) {
    case 'coin':
      ctx.rotate(a);
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(a * 2)));
      ctx.fillStyle = withAlpha(core, 0.95 * k);
      ctx.strokeStyle = withAlpha('#5a4210', 0.9 * k);
      ctx.lineWidth = Math.max(1, size * 0.2);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, TAU);
      ctx.fill();
      ctx.stroke();
      break;
    case 'shard':
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = withAlpha(core, 0.95 * k);
      ctx.strokeStyle = withAlpha(color, 0.9 * k);
      ctx.lineWidth = Math.max(1, size * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(size * 0.55, 0);
      ctx.lineTo(0, size * 1.1);
      ctx.lineTo(-size * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'gear': {
      ctx.rotate(a * 2);
      ctx.strokeStyle = withAlpha(core, 0.95 * k);
      ctx.lineWidth = Math.max(1.5, size * 0.45);
      ctx.setLineDash([size * 0.3, size * 0.3]);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.9, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = withAlpha(color, 0.9 * k);
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, TAU);
      ctx.fill();
      break;
    }
    case 'leaf':
      ctx.rotate(a + 1.2);
      ctx.fillStyle = withAlpha(core, 0.9 * k);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.2, size * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.9 * k);
      ctx.lineWidth = Math.max(1, size * 0.14);
      ctx.beginPath();
      ctx.moveTo(-size * 1.1, 0);
      ctx.lineTo(size * 1.1, 0);
      ctx.stroke();
      break;
    default:
      glow(ctx, 0, 0, size * 0.8, core, 0.9 * k);
  }
  ctx.restore();
}

function mote(ctx: CanvasRenderingContext2D, kind: MoteKind, x: number, y: number, size: number, color: string, core: string, k: number, spin: number): void {
  switch (kind) {
    case 'flake':
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(spin);
      ctx.strokeStyle = withAlpha(core, 0.9 * k);
      ctx.lineWidth = Math.max(1, size * 0.22);
      for (let i = 0; i < 3; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        ctx.stroke();
      }
      ctx.restore();
      break;
    case 'bubble':
      ctx.strokeStyle = withAlpha(core, 0.85 * k);
      ctx.lineWidth = Math.max(1, size * 0.25);
      ctx.beginPath();
      ctx.arc(x, y, size * 0.9, 0, TAU);
      ctx.stroke();
      glow(ctx, x - size * 0.3, y - size * 0.3, size * 0.35, '#ffffff', 0.6 * k);
      break;
    case 'tick':
      ctx.fillStyle = withAlpha(core, 0.9 * k);
      ctx.fillRect(x - size * 0.2, y - size, size * 0.4, size * 2);
      break;
    default:
      glow(ctx, x, y, size, kind === 'ember' ? core : color, 0.8 * k);
  }
}

/** Draw the third-phase look around the boss at (s.x, s.y) with body radius r (drawn first, so the body is over it). */
export function overtimeAura(ctx: CanvasRenderingContext2D, s: DrawState, r: number, look: OvertimeLook): void {
  const { color, core } = look;
  const rings = look.rings ?? 2;
  const lift = (look.lift ?? 0) * r;
  const t = s.t;
  glow(ctx, s.x, s.y - r * 0.35 - lift, r * 3.3, color, 0.2 + Math.sin(t * 5) * 0.07);
  glow(ctx, s.x, s.y - r * 0.35 - lift, r * 1.7, core, 0.12 + Math.sin(t * 7 + 1) * 0.04);
  // the floor: two or three rings, runes or a clock face (a ring of hours and a sweeping hand)
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.72);
  ctx.scale(1, 0.36);
  for (let k = 0; k < rings; k++) {
    const rad = r * (1.5 + k * 0.45);
    const dir = k % 2 ? -1 : 1;
    ctx.strokeStyle = withAlpha(k ? core : color, 0.55 + Math.sin(t * 4 + k) * 0.2);
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    if (look.ringKind === 'clock' && k === 0) {
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, TAU);
      ctx.stroke();
      for (let h = 0; h < 12; h++) {
        const a = (h / 12) * TAU + t * 0.25;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rad * 0.9, Math.sin(a) * rad * 0.9);
        ctx.lineTo(Math.cos(a) * rad * 1.08, Math.sin(a) * rad * 1.08);
        ctx.stroke();
      }
      const ha = t * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ha) * rad, Math.sin(ha) * rad);
      ctx.stroke();
      continue;
    }
    ctx.setLineDash([r * (0.2 + k * 0.05), r * 0.13]);
    ctx.lineDashOffset = -t * r * (0.7 + k * 0.2) * dir;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  // wisps orbit, each trailing fading glows
  const n = look.count ?? 6;
  const kind = look.wisps ?? 'orb';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 4; j++) {
      const a = t * 1.35 - j * 0.11 + (i / n) * TAU;
      const wx = s.x + Math.cos(a) * r * 1.4;
      const wy = s.y - r * 0.15 - lift + Math.sin(a) * r * 0.55 + Math.sin(t * 2 + i) * r * 0.06;
      const k = 1 - j / 4;
      if (j === 0) wisp(ctx, kind, wx, wy, a, r * 0.13, color, core, 1);
      else glow(ctx, wx, wy, r * (0.2 + 0.1 * k), color, 0.7 * k);
    }
  }
  // motes rising (embers fast and bright, flakes and bubbles slow)
  const mk = look.motes ?? 'glow';
  const speed = mk === 'ember' ? 0.7 : mk === 'flake' ? 0.3 : 0.45;
  for (let i = 0; i < 14; i++) {
    const k = (t * speed + hash(i * 5)) % 1;
    const mx = s.x + (hash(i * 3 + 1) - 0.5) * r * 2.4 + Math.sin(t * 2 + i) * r * 0.1;
    const my = s.y + r * 0.7 - lift - k * r * 2.6;
    mote(ctx, mk, mx, my, r * (mk === 'glow' ? 0.1 : 0.08), color, core, 1 - k, t + i);
  }
}
