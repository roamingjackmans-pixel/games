// Weapons, shields and casting tools drawn in local space: the grip at the origin, pointing along +x.
import { OUTLINE, blob, glow, limb, poly, shade, spec } from './parts';

const STEEL = '#c9ced6';
const WOOD = '#7a5232';
const DARK = '#3a3440';

function blade(ctx: CanvasRenderingContext2D, from: number, to: number, w: number, color = STEEL, tip = 8): void {
  poly(ctx, [from, -w / 2, to - tip, -w / 2, to, 0, to - tip, w / 2, from, w / 2], color);
  ctx.strokeStyle = shade(color, 1.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(from + 2, -w / 6);
  ctx.lineTo(to - tip, -w / 6);
  ctx.stroke();
}

function handle(ctx: CanvasRenderingContext2D, len: number, color = WOOD, w = 5): void {
  limb(ctx, -6, 0, len, 0, w, color);
}

/** Draw a weapon by draw id. `scale` lets two-handed or enlarged weapons grow. */
export function drawWeapon(ctx: CanvasRenderingContext2D, id: string, t = 0): void {
  switch (id) {
    case 'w_greathammer':
      handle(ctx, 46, WOOD, 6);
      poly(ctx, [40, -16, 64, -16, 64, 16, 40, 16], '#8a8f98');
      ctx.fillStyle = '#6a6f78';
      ctx.fillRect(42, -14, 6, 28);
      spec(ctx, 58, -10, 2);
      break;
    case 'w_greataxe':
      handle(ctx, 56, WOOD, 6);
      poly(ctx, [40, -4, 50, -24, 64, -20, 60, 0, 64, 20, 50, 24, 40, 4], STEEL);
      break;
    case 'w_colossal':
      limb(ctx, -8, 0, 12, 0, 6, DARK);
      poly(ctx, [10, -12, 14, -12, 14, 12, 10, 12], '#8a6a3a');
      blade(ctx, 14, 84, 16, '#b8bec8', 12);
      break;
    case 'w_crossbow':
      handle(ctx, 30, WOOD, 7);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(30, 0, 18, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = '#8a8f98';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30 + Math.cos(-1.2) * 18, Math.sin(-1.2) * 18);
      ctx.lineTo(14, 0);
      ctx.lineTo(30 + Math.cos(1.2) * 18, Math.sin(1.2) * 18);
      ctx.stroke();
      break;
    case 'w_club':
      poly(ctx, [-6, -3, 30, -7, 46, -9, 50, 0, 46, 9, 30, 7, -6, 3], '#8a5a32');
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.arc(38, -3, 2, 0, 7);
      ctx.arc(30, 4, 1.6, 0, 7);
      ctx.fill();
      break;
    case 'w_daggers':
      limb(ctx, -4, 0, 6, 0, 4, DARK);
      blade(ctx, 6, 30, 7, STEEL, 6);
      break;
    case 'w_rapier':
      limb(ctx, -4, 0, 6, 0, 4, DARK);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, 0, 7, -1.5, 1.5);
      ctx.stroke();
      blade(ctx, 6, 62, 4, '#dfe4ea', 6);
      break;
    case 'w_katana':
      limb(ctx, -8, 0, 8, 0, 4, '#2a2a2a');
      poly(ctx, [8, -5, 12, -5, 12, 5, 8, 5], '#d4af37');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(12, -3);
      ctx.quadraticCurveTo(40, -7, 62, -9);
      ctx.lineTo(58, -2);
      ctx.quadraticCurveTo(38, 2, 12, 3);
      ctx.closePath();
      ctx.fillStyle = '#e4e8ee';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.restore();
      break;
    case 'w_bow': {
      ctx.save();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(-6, 0, 26, -1.25, 1.25);
      ctx.stroke();
      ctx.strokeStyle = '#9a6a3a';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      const pull = Math.min(14, t * 18);
      ctx.beginPath();
      ctx.moveTo(-6 + Math.cos(-1.25) * 26, Math.sin(-1.25) * 26);
      ctx.lineTo(-6 - pull, 0);
      ctx.lineTo(-6 + Math.cos(1.25) * 26, Math.sin(1.25) * 26);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'w_whip': {
      handle(ctx, 10, '#4a3020', 5);
      ctx.save();
      ctx.strokeStyle = '#5a3a20';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      for (let i = 1; i <= 8; i++) ctx.lineTo(10 + i * 6, Math.sin(i * 0.9 + t * 8) * (2 + i));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'w_longsword':
      limb(ctx, -6, 0, 8, 0, 4, DARK);
      poly(ctx, [8, -10, 12, -10, 12, 10, 8, 10], '#8a7a5a');
      blade(ctx, 12, 64, 8);
      break;
    case 'w_spear':
      handle(ctx, 76, WOOD, 4);
      poly(ctx, [76, -6, 96, 0, 76, 6, 72, 0], STEEL);
      break;
    case 'w_battleaxe':
      handle(ctx, 48, WOOD, 5);
      poly(ctx, [38, -2, 44, -20, 56, -16, 54, 0, 56, 14, 44, 18, 38, 2], STEEL);
      break;
    case 'w_mace':
      handle(ctx, 36, '#6a5a4a', 5);
      blob(ctx, 42, 0, 10, 10, { fill: '#b0a070' });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        poly(ctx, [42 + Math.cos(a) * 9, Math.sin(a) * 9 - 2, 42 + Math.cos(a) * 15, Math.sin(a) * 15, 42 + Math.cos(a) * 9, Math.sin(a) * 9 + 2], '#d4c080', OUTLINE, 1.5);
      }
      break;
    case 'w_halberd':
      handle(ctx, 84, WOOD, 4);
      poly(ctx, [70, -2, 76, -20, 88, -16, 86, -2], STEEL);
      poly(ctx, [84, -3, 100, 0, 84, 3], STEEL);
      poly(ctx, [70, 2, 64, 12, 74, 4], STEEL);
      break;
    case 'w_twinaxes':
      handle(ctx, 28, WOOD, 4);
      poly(ctx, [22, -2, 26, -14, 36, -12, 34, 0, 36, 10, 26, 12, 22, 2], STEEL);
      break;
    case 'w_fists':
    default:
      blob(ctx, 6, 0, 6, 6, { fill: '#e8c9a0' });
      break;
  }
}

/** True for weapons drawn in both hands (second copy in the off hand). */
export function isPairedWeapon(id: string): boolean {
  return id === 'w_daggers' || id === 'w_twinaxes';
}

export function drawShield(ctx: CanvasRenderingContext2D, id: string): void {
  switch (id) {
    case 's_buckler':
      blob(ctx, 0, 0, 9, 9, { fill: '#8a7a5a' });
      spec(ctx, -2, -3, 2);
      break;
    case 's_targe':
      blob(ctx, 0, 0, 11, 11, { fill: '#7a4a2a' });
      blob(ctx, 0, 0, 4, 4, { fill: '#c9b98a', outlineW: 2 });
      break;
    case 's_round':
      blob(ctx, 0, 0, 13, 13, { fill: '#8a5a32' });
      ctx.strokeStyle = '#c9ced6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, 7);
      ctx.stroke();
      break;
    case 's_kite':
      poly(ctx, [-10, -14, 10, -14, 11, 2, 0, 18, -11, 2], '#4a6aa0');
      ctx.fillStyle = '#e6b84a';
      ctx.fillRect(-2, -10, 4, 22);
      break;
    case 's_heater':
      poly(ctx, [-12, -12, 12, -12, 12, 2, 0, 16, -12, 2], '#a03030');
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(-8, -3, 16, 4);
      break;
    case 's_tower':
      poly(ctx, [-12, -22, 12, -22, 12, 22, -12, 22], '#7a7f88');
      ctx.strokeStyle = '#5a5f68';
      ctx.lineWidth = 2;
      ctx.strokeRect(-8, -18, 16, 36);
      break;
    case 's_spiked':
      poly(ctx, [-12, -22, 12, -22, 12, 22, -12, 22], '#5a5f68');
      for (let i = -16; i <= 16; i += 8) poly(ctx, [12, i - 3, 20, i, 12, i + 3], '#c9ced6', OUTLINE, 1.5);
      break;
    case 's_bulwark':
      poly(ctx, [-13, -22, 13, -22, 13, 18, 0, 26, -13, 18], '#efe6d2');
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-2, -16, 4, 32);
      ctx.fillRect(-9, -6, 18, 4);
      glow(ctx, 0, 0, 30, '#fff3b0', 0.4);
      break;
    default:
      blob(ctx, 0, 0, 12, 12, { fill: '#8a7a5a' });
  }
}

export function drawTool(ctx: CanvasRenderingContext2D, id: string, t: number): void {
  const isStaff = id.startsWith('t_staff') || id === 't_rod';
  if (isStaff) {
    limb(ctx, -10, 0, 44, 0, 4, id === 't_rod' ? '#b08d3c' : WOOD);
    const color =
      id === 't_staff_void' ? '#9b5bff' : id === 't_staff_storm' ? '#ffe14a' : id === 't_staff_arcane' ? '#5fd3c0' : id === 't_rod' ? '#2aa198' : '#8fd3ff';
    blob(ctx, 48, 0, 6, 6, { fill: color });
    glow(ctx, 48, 0, 16 + Math.sin(t * 4) * 2, color, 0.6);
  } else {
    const color = id === 't_talisman_silver' ? '#d8dde4' : id === 't_talisman_sun' ? '#ffd27a' : id === 't_relic' ? '#efe6d2' : '#9a6a3a';
    limb(ctx, 0, 0, 8, 0, 2, '#5a4a3a');
    poly(ctx, [8, -8, 16, 0, 8, 8, 0, 0], color);
    glow(ctx, 8, 0, 14, '#fff3b0', 0.35);
  }
}
