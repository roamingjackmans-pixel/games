// Joe: a round-headed guy with stubble; class gear drawn on top (ART_AUDIO §2).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec } from './parts';

export type HeadGear = 'none' | 'hood' | 'helm' | 'greathelm' | 'cap' | 'wizard' | 'mitre' | 'horned' | 'bandana' | 'crown';
export type BodyGear = 'shirt' | 'leather' | 'chain' | 'plate' | 'robe' | 'cloak' | 'bathrobe' | 'loincloth' | 'suit';

export interface JoeLook {
  skin: string;
  hair: string;
  head: HeadGear;
  headColor: string;
  body: BodyGear;
  bodyColor: string;
  trim: string;
  legsColor: string;
}

export const DEFAULT_LOOK: JoeLook = {
  skin: '#e8c9a0',
  hair: '#4a3626',
  head: 'none',
  headColor: '#777',
  body: 'shirt',
  bodyColor: '#6a7f9a',
  trim: '#c9b98a',
  legsColor: '#3d3a4a',
};

export interface JoePose {
  x: number;
  y: number;
  facing: number;
  t: number;
  /** 0..1 walk cycle intensity */
  moving: number;
  /** squash/stretch amount (attack windup negative, release positive) */
  squash?: number;
  flash?: boolean;
  tint?: 'red' | 'blue' | null;
  alpha?: number;
  /** grey desaturation (downed ghost) */
  ghost?: boolean;
  scale?: number;
  /** two-handing changes the off-hand position */
  twoHanded?: boolean;
  blocking?: boolean;
  /** called to draw the weapon in hand (after body, before head) */
  drawWeapon?: (ctx: CanvasRenderingContext2D) => void;
  drawOffhand?: (ctx: CanvasRenderingContext2D) => void;
}

export function drawJoe(ctx: CanvasRenderingContext2D, look: JoeLook, p: JoePose): void {
  const s = p.scale ?? 1;
  const bob = Math.sin(p.t * 12) * 1.6 * p.moving;
  const sq = p.squash ?? 0;
  ctx.save();
  ctx.globalAlpha *= p.alpha ?? 1;
  shadow(ctx, p.x, p.y + 2, 16 * s);
  ctx.translate(p.x, p.y + bob);
  ctx.scale(s * (1 - sq * 0.12), s * (1 + sq * 0.12));
  const pal = p.ghost
    ? { ...look, skin: '#9a9aa6', bodyColor: '#6e6e7a', headColor: '#80808a', legsColor: '#55555f', trim: '#8a8a94', hair: '#555' }
    : look;
  const flashFill = (c: string): string => (p.flash ? '#ffffff' : c);

  // feet
  const step = Math.sin(p.t * 12) * 5 * p.moving;
  const fx = Math.cos(p.facing);
  const fy = Math.sin(p.facing);
  const px = -fy;
  const py = fx;
  blob(ctx, px * 7 + fx * step, py * 7 + fy * step + 12, 5, 4, { fill: flashFill(shade(pal.legsColor, 0.8)) });
  blob(ctx, -px * 7 - fx * step, -py * 7 - fy * step + 12, 5, 4, { fill: flashFill(shade(pal.legsColor, 0.8)) });

  // body
  const bodyFill = flashFill(pal.bodyColor);
  if (pal.body === 'robe' || pal.body === 'bathrobe' || pal.body === 'cloak') {
    poly(ctx, [-13, -2, 13, -2, 16, 15, -16, 15], bodyFill);
  }
  blob(ctx, 0, 2, 14, 13, { fill: bodyFill });
  if (pal.body === 'plate') {
    ctx.strokeStyle = shade(pal.bodyColor, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(-8, 6);
    ctx.lineTo(8, 6);
    ctx.stroke();
    spec(ctx, -5, -4, 2.2);
  } else if (pal.body === 'chain') {
    ctx.fillStyle = shade(pal.bodyColor, 0.7);
    for (let i = -8; i <= 8; i += 4) for (let j = -4; j <= 8; j += 4) ctx.fillRect(i, j, 1.5, 1.5);
  } else if (pal.body === 'bathrobe') {
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(3, 12);
    ctx.stroke();
    ctx.fillStyle = pal.trim;
    ctx.fillRect(-12, 4, 24, 3);
  } else if (pal.body === 'loincloth') {
    ctx.fillStyle = flashFill(pal.skin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-12, 7, 24, 5);
  } else if (pal.body === 'leather') {
    ctx.strokeStyle = shade(pal.bodyColor, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(10, 8);
    ctx.stroke();
  } else if (pal.body === 'suit') {
    poly(ctx, [-3, -10, 3, -10, 0, 8], '#efe6d2', OUTLINE, 1.5);
  }
  if (pal.body === 'cloak') {
    ctx.strokeStyle = pal.trim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -6, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // off-hand (shield/staff) behind weapon
  if (p.drawOffhand && !p.twoHanded) p.drawOffhand(ctx);
  // weapon
  if (p.drawWeapon) p.drawWeapon(ctx);

  // head
  const hx = fx * 2;
  const hy = -14 + fy * 1.5;
  blob(ctx, hx, hy, 11, 11, { fill: flashFill(pal.skin) });
  // stubble
  if (!p.flash) {
    ctx.fillStyle = shade(pal.hair, 0.9);
    ctx.globalAlpha *= 0.55;
    for (let i = -4; i <= 4; i++) {
      const a = Math.PI / 2 + i * 0.22 + (fx * 0.3);
      ctx.fillRect(hx + Math.cos(a) * 7.5 - 0.6, hy + Math.sin(a) * 7.5 - 0.6, 1.3, 1.3);
    }
    ctx.globalAlpha /= 0.55;
  }
  eyes(ctx, hx, hy - 1, p.facing, 3.6, 1.7, OUTLINE, 2.4);
  drawHeadGear(ctx, pal, hx, hy, p.facing, flashFill(pal.headColor));

  ctx.restore();

  if (p.tint === 'red') {
    glow(ctx, p.x, p.y, 34 * s, '#ff3b3b', 0.55 + Math.sin(p.t * 20) * 0.2);
  } else if (p.tint === 'blue') {
    glow(ctx, p.x, p.y, 34 * s, '#8fd3ff', 0.55);
  }
}

function drawHeadGear(ctx: CanvasRenderingContext2D, pal: JoeLook, hx: number, hy: number, facing: number, fill: string): void {
  switch (pal.head) {
    case 'none':
      // a tuft of hair
      blob(ctx, hx - Math.cos(facing) * 2, hy - 8, 7, 4, { fill: pal.hair, outlineW: 2 });
      break;
    case 'hood':
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy - 1, 13, Math.PI * 0.95, Math.PI * 2.05);
      ctx.lineTo(hx + 13, hy + 4);
      ctx.lineTo(hx - 13, hy + 4);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.restore();
      break;
    case 'helm':
    case 'greathelm':
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy - 1, 12.5, Math.PI, Math.PI * 2);
      ctx.lineTo(hx + 12.5, hy + (pal.head === 'greathelm' ? 8 : 2));
      ctx.lineTo(hx - 12.5, hy + (pal.head === 'greathelm' ? 8 : 2));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      if (pal.head === 'greathelm') {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(hx - 8 + Math.cos(facing) * 2, hy - 2, 16, 3);
      }
      spec(ctx, hx - 5, hy - 8, 2);
      ctx.restore();
      break;
    case 'cap':
      blob(ctx, hx, hy - 7, 11, 5, { fill });
      blob(ctx, hx + Math.cos(facing) * 9, hy - 5 + Math.sin(facing) * 3, 6, 3, { fill: shade(fill, 0.8), outlineW: 2 });
      break;
    case 'wizard':
      poly(ctx, [hx - 13, hy - 4, hx + 13, hy - 4, hx + 4, hy - 30, hx - 1, hy - 24], fill);
      ctx.fillStyle = pal.trim;
      ctx.fillRect(hx - 12, hy - 7, 24, 3);
      break;
    case 'mitre':
      poly(ctx, [hx - 10, hy - 5, hx + 10, hy - 5, hx + 6, hy - 24, hx, hy - 28, hx - 6, hy - 24], fill);
      ctx.strokeStyle = pal.trim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy - 26);
      ctx.lineTo(hx, hy - 6);
      ctx.moveTo(hx - 5, hy - 18);
      ctx.lineTo(hx + 5, hy - 18);
      ctx.stroke();
      break;
    case 'horned':
      blob(ctx, hx, hy - 4, 12, 9, { fill });
      poly(ctx, [hx - 10, hy - 8, hx - 18, hy - 22, hx - 6, hy - 11], '#e8e1c8');
      poly(ctx, [hx + 10, hy - 8, hx + 18, hy - 22, hx + 6, hy - 11], '#e8e1c8');
      break;
    case 'bandana':
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 11.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      limb(ctx, hx - Math.cos(facing) * 10, hy - 4, hx - Math.cos(facing) * 18, hy + 2, 3, fill);
      break;
    case 'crown':
      poly(ctx, [hx - 9, hy - 6, hx - 9, hy - 16, hx - 4, hy - 11, hx, hy - 18, hx + 4, hy - 11, hx + 9, hy - 16, hx + 9, hy - 6], '#e6b84a');
      break;
  }
}
