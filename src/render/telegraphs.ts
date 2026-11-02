// Telegraph drawing (ART_AUDIO §3): 22%-alpha fill, 2 px outline, a progress fill that grows over the
// telegraph time. Red = #ff3b3b; Piercing = #8fd3ff with diagonal stripes; colorblind icons (skull / hollow ring).
import { sweepAngle, wavePos, ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y, type Shape } from '../game/combat/patterns';
import { withAlpha } from '../engine/draw/parts';
import type { Entity, World } from '../game/world';

export const RED = '#ff3b3b';
export const BLUE = '#8fd3ff';
const NORMAL = '#f2d9a0';
const PLAYER = '#ffd27a';

let stripes: CanvasPattern | null = null;
function stripePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (stripes) return stripes;
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(16, 16) : document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.strokeStyle = withAlpha(BLUE, 0.55);
  g.lineWidth = 4;
  for (let i = -16; i <= 32; i += 8) {
    g.beginPath();
    g.moveTo(i, 16);
    g.lineTo(i + 16, 0);
    g.stroke();
  }
  stripes = ctx.createPattern(c as CanvasImageSource, 'repeat');
  return stripes;
}

function path(ctx: CanvasRenderingContext2D, s: Shape, scale = 1): void {
  ctx.beginPath();
  switch (s.k) {
    case 'circle':
      ctx.arc(s.x, s.y, Math.max(0.1, s.r * scale), 0, Math.PI * 2);
      break;
    case 'ring':
      ctx.arc(s.x, s.y, Math.min(1600, s.rOut), 0, Math.PI * 2);
      if (s.rIn > 0) ctx.arc(s.x, s.y, s.rIn + (Math.min(1600, s.rOut) - s.rIn) * (1 - scale), 0, Math.PI * 2, true);
      break;
    case 'line':
    case 'beam': {
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = (s.w / 2) * (s.k === 'line' ? scale : 1);
      const l = s.k === 'beam' ? s.l : s.l;
      ctx.moveTo(s.x - sa * hw, s.y + ca * hw);
      ctx.lineTo(s.x + ca * l - sa * hw, s.y + sa * l + ca * hw);
      ctx.lineTo(s.x + ca * l + sa * hw, s.y + sa * l - ca * hw);
      ctx.lineTo(s.x + sa * hw, s.y - ca * hw);
      ctx.closePath();
      break;
    }
    case 'cone':
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, Math.min(1600, s.r) * scale, s.a - s.half, s.a + s.half);
      ctx.closePath();
      break;
    default:
      break;
  }
}

function colorFor(kind: string, team: number): string {
  if (team === 0) return PLAYER;
  return kind === 'red' ? RED : kind === 'pierce' ? BLUE : NORMAL;
}

export function drawTelegraph(ctx: CanvasRenderingContext2D, w: World, t: Entity, highContrast: boolean, alphaTime: number): void {
  const tg = t.tg!;
  if (tg.hidden) return;
  const now = alphaTime;
  const color = colorFor(tg.kind, tg.team);
  const pierce = tg.kind === 'pierce';
  const lw = highContrast ? 4 : 2;
  const pre = now < tg.impact;
  const p = pre ? Math.min(1, Math.max(0, (now - tg.start) / Math.max(0.01, tg.impact - tg.start))) : 1;
  const tau = now - tg.impact;
  const baseFill = tg.kind === 'normal' ? 0.12 : 0.22;
  ctx.save();
  for (const s of tg.shapes) {
    switch (s.k) {
      case 'circle':
      case 'ring':
      case 'line':
      case 'cone': {
        if (!pre && tg.mode === 'instant') {
          // brief flash after impact
          ctx.globalAlpha = Math.max(0, 0.6 - tau * 5);
          path(ctx, s);
          ctx.fillStyle = color;
          ctx.fill();
          break;
        }
        path(ctx, s);
        ctx.fillStyle = withAlpha(color, baseFill);
        ctx.fill();
        if (pierce) {
          const pat = stripePattern(ctx);
          if (pat) {
            ctx.fillStyle = pat;
            ctx.fill();
          }
        }
        ctx.lineWidth = lw;
        ctx.strokeStyle = withAlpha(color, 0.9);
        ctx.stroke();
        // progress fill
        path(ctx, s, p);
        ctx.fillStyle = withAlpha(color, 0.28 + (highContrast ? 0.15 : 0));
        ctx.fill();
        break;
      }
      case 'pockets': {
        // the whole room except the pockets
        ctx.beginPath();
        ctx.rect(ROOM_MIN_X - 32, ROOM_MIN_Y - 32, ROOM_MAX_X - ROOM_MIN_X + 64, ROOM_MAX_Y - ROOM_MIN_Y + 64);
        for (const q of s.pockets) {
          ctx.moveTo(q.x + q.r, q.y);
          ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2, true);
        }
        ctx.fillStyle = withAlpha(color, pre ? 0.12 + p * 0.22 : Math.max(0, 0.5 - tau * 3));
        ctx.fill('evenodd');
        if (pierce && pre) {
          const pat = stripePattern(ctx);
          if (pat) {
            ctx.fillStyle = pat;
            ctx.fill('evenodd');
          }
        }
        for (const q of s.pockets) {
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
          ctx.lineWidth = lw + 1;
          ctx.strokeStyle = '#ffffff';
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      }
      case 'sweep': {
        const a = pre ? s.a0 : sweepAngle(s, tau);
        const r = Math.min(1600, s.r);
        ctx.beginPath();
        if (s.line) {
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const hw = s.w / 2;
          ctx.moveTo(s.x - sa * hw, s.y + ca * hw);
          ctx.lineTo(s.x + ca * r - sa * hw, s.y + sa * r + ca * hw);
          ctx.lineTo(s.x + ca * r + sa * hw, s.y + sa * r - ca * hw);
          ctx.lineTo(s.x + sa * hw, s.y - ca * hw);
          ctx.closePath();
        } else {
          ctx.moveTo(s.x, s.y);
          ctx.arc(s.x, s.y, r, a - s.half, a + s.half);
          ctx.closePath();
        }
        ctx.fillStyle = withAlpha(color, pre ? 0.18 + p * 0.25 : 0.55);
        ctx.fill();
        if (pierce) {
          const pat = stripePattern(ctx);
          if (pat) {
            ctx.fillStyle = pat;
            ctx.fill();
          }
        }
        ctx.lineWidth = lw;
        ctx.strokeStyle = color;
        ctx.stroke();
        if (pre) {
          // the arc the sweep will cover, and a direction arrow
          ctx.beginPath();
          const rr = Math.min(r, 260);
          const dir = Math.sign(s.arc);
          ctx.arc(s.x, s.y, rr * 0.7, s.a0, s.a0 + s.arc, dir < 0);
          ctx.setLineDash([6, 8]);
          ctx.strokeStyle = withAlpha(color, 0.7);
          ctx.stroke();
          ctx.setLineDash([]);
          const ea = s.a0 + dir * 0.5;
          const ax = s.x + Math.cos(ea) * rr * 0.7;
          const ay = s.y + Math.sin(ea) * rr * 0.7;
          ctx.beginPath();
          ctx.arc(ax, ay, 6, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
        break;
      }
      case 'expRing': {
        const R = pre ? 0 : s.speed * tau;
        const show = pre ? 60 + p * 40 : R;
        ctx.lineWidth = pre ? lw + 2 : s.thick;
        ctx.strokeStyle = withAlpha(color, pre ? 0.5 + p * 0.4 : 0.55);
        // draw the ring with gaps cut out
        const gapsSorted = [...s.gaps].sort((a, b) => a - b);
        const halfGap = s.gapW / 2 / Math.max(show, 30);
        if (gapsSorted.length === 0) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, show, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          for (let i = 0; i < gapsSorted.length; i++) {
            const g0 = gapsSorted[i]! + halfGap;
            const g1 = (i + 1 < gapsSorted.length ? gapsSorted[i + 1]! : gapsSorted[0]! + Math.PI * 2) - halfGap;
            if (g1 <= g0) continue;
            ctx.beginPath();
            ctx.arc(s.x, s.y, show, g0, g1);
            ctx.stroke();
          }
        }
        if (pre) {
          // safe lanes: dashed white rays through the gaps
          ctx.setLineDash([10, 10]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          for (const g of s.gaps) {
            ctx.beginPath();
            ctx.moveTo(s.x + Math.cos(g) * 40, s.y + Math.sin(g) * 40);
            ctx.lineTo(s.x + Math.cos(g) * 900, s.y + Math.sin(g) * 900);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }
        break;
      }
      case 'wave': {
        const pos = pre ? wavePos(s, 0) + (s.dir === 'west' || s.dir === 'north' ? s.w * 0.6 : -s.w * 0.6) : wavePos(s, tau);
        ctx.fillStyle = withAlpha(color, pre ? 0.2 + p * 0.3 : 0.55);
        if (s.dir === 'east' || s.dir === 'west') ctx.fillRect(pos - s.w / 2, ROOM_MIN_Y - 32, s.w, ROOM_MAX_Y - ROOM_MIN_Y + 64);
        else ctx.fillRect(ROOM_MIN_X - 32, pos - s.w / 2, ROOM_MAX_X - ROOM_MIN_X + 64, s.w);
        if (pierce) {
          const pat = stripePattern(ctx);
          if (pat) {
            ctx.fillStyle = pat;
            if (s.dir === 'east' || s.dir === 'west') ctx.fillRect(pos - s.w / 2, ROOM_MIN_Y - 32, s.w, ROOM_MAX_Y - ROOM_MIN_Y + 64);
            else ctx.fillRect(ROOM_MIN_X - 32, pos - s.w / 2, ROOM_MAX_X - ROOM_MIN_X + 64, s.w);
          }
        }
        if (pre) {
          ctx.fillStyle = color;
          ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          const arrow = s.dir === 'west' ? '→' : s.dir === 'east' ? '←' : s.dir === 'north' ? '↓' : '↑';
          if (s.dir === 'east' || s.dir === 'west') for (let y = 120; y < 700; y += 140) ctx.fillText(arrow, pos, y);
          else for (let x = 120; x < 1240; x += 160) ctx.fillText(arrow, x, pos + 10);
        }
        break;
      }
      case 'beam': {
        path(ctx, s);
        ctx.fillStyle = withAlpha(color, pre ? 0.15 + p * 0.2 : 0.6);
        ctx.fill();
        ctx.lineWidth = lw;
        ctx.strokeStyle = color;
        ctx.stroke();
        break;
      }
    }
  }
  ctx.restore();
  void w;
}

/** Skull icon (Red) and hollow ring icon (Piercing) over an attacker in windup (colorblind support, §5.6). */
export function drawAttackIcon(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'red' | 'pierce', size: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  const k = size * (1 + Math.sin(t * 14) * 0.08);
  ctx.scale(k, k);
  if (kind === 'red') {
    ctx.fillStyle = RED;
    ctx.strokeStyle = '#1a0606';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 9, Math.PI, 0);
    ctx.lineTo(9, 3);
    ctx.lineTo(5, 4);
    ctx.lineTo(5, 9);
    ctx.lineTo(-5, 9);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-9, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1a0606';
    ctx.beginPath();
    ctx.arc(-3.5, -1, 2.4, 0, Math.PI * 2);
    ctx.arc(3.5, -1, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#0a1a24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
  ctx.restore();
}
