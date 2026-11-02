// Mossy Crypt roster draw functions (moss green, bone white, grey) + the Mimic.
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const MOSS = '#5a6e4a';
const BONE = '#e8e1c8';
const ROT = '#7a8a6a';

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

registerDraw('crypt_shambler', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 2, 5);
  const reach = s.pose === 'attack' ? 1.5 : s.pose === 'windup' ? 0.6 : 1;
  // arms reaching forward
  limb(ctx, s.x - fy * r * 0.6, s.y + fx * r * 0.6 + b, s.x + fx * r * 1.3 * reach - fy * r * 0.4, s.y + fy * r * 1.3 * reach + fx * r * 0.4 + b, 5, fc(s, ROT));
  limb(ctx, s.x + fy * r * 0.6, s.y - fx * r * 0.6 + b, s.x + fx * r * 1.25 * reach + fy * r * 0.4, s.y + fy * r * 1.25 * reach - fx * r * 0.4 + b, 5, fc(s, ROT));
  blob(ctx, s.x, s.y + b, r * 0.85, r * (0.9 - s.squash * 0.1), { fill: fc(s, '#4a4a3a') });
  // torn shirt
  ctx.fillStyle = fc(s, '#6a5a44');
  ctx.fillRect(s.x - r * 0.5, s.y + b - r * 0.1, r, r * 0.35);
  blob(ctx, s.x + fx * 3, s.y - r * 0.7 + b, r * 0.6, r * 0.58, { fill: fc(s, MOSS) });
  ctx.fillStyle = withAlpha('#2a3a1a', 0.7);
  ctx.beginPath();
  ctx.arc(s.x - r * 0.25, s.y - r * 0.95 + b, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, s.x + fx * 3, s.y - r * 0.72 + b, s.facing, r * 0.22, 2, '#d8e070', 2);
});

registerDraw('crypt_bone_archer', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.8);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 7);
  // ribcage
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - r * 0.5 + b);
  ctx.lineTo(s.x, s.y + r * 0.7 + b);
  ctx.stroke();
  ctx.strokeStyle = fc(s, BONE);
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - r * 0.2 + i * r * 0.25 + b, r * 0.5, r * 0.12, 0, 0, Math.PI);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = fc(s, BONE);
    ctx.stroke();
  }
  // bow held toward the facing
  const draw = s.pose === 'windup' ? 0.8 : 0;
  const bx = s.x + fx * r * 0.9;
  const by = s.y + fy * r * 0.9 + b;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(s.facing);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(-4, 0, r * 0.9, -1.2, 1.2);
  ctx.stroke();
  ctx.strokeStyle = fc(s, '#8a6a3a');
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4 + Math.cos(-1.2) * r * 0.9, Math.sin(-1.2) * r * 0.9);
  ctx.lineTo(-4 - draw * 10, 0);
  ctx.lineTo(-4 + Math.cos(1.2) * r * 0.9, Math.sin(1.2) * r * 0.9);
  ctx.stroke();
  ctx.restore();
  limb(ctx, s.x - fy * 5, s.y + fx * 5 + b, bx, by, 3, fc(s, BONE));
  // skull
  blob(ctx, s.x + fx * 2, s.y - r * 0.85 + b, r * 0.5, r * 0.48, { fill: fc(s, BONE) });
  eyes(ctx, s.x + fx * 3, s.y - r * 0.85 + b, s.facing, r * 0.18, 2.6, '#1a1410', 1.5);
  ctx.fillStyle = '#ffb040';
  if (!s.flash) {
    ctx.beginPath();
    ctx.arc(s.x + fx * 5 - fy * r * 0.18, s.y - r * 0.85 + b + fx * r * 0.18, 1.2, 0, Math.PI * 2);
    ctx.arc(s.x + fx * 5 + fy * r * 0.18, s.y - r * 0.85 + b - fx * r * 0.18, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
});

registerDraw('crypt_rat', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.8, 0.25);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const wig = Math.sin(s.t * 18 + s.variant) * 3;
  ctx.strokeStyle = fc(s, '#c8a0a0');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - fx * r, s.y - fy * r);
  ctx.quadraticCurveTo(s.x - fx * r * 2 - fy * wig, s.y - fy * r * 2 + fx * wig, s.x - fx * r * 2.6, s.y - fy * r * 2.6);
  ctx.stroke();
  blob(ctx, s.x, s.y, r * 1.1, r * 0.75, { fill: fc(s, '#6a5a52') }, s.facing);
  blob(ctx, s.x + fx * r * 0.9, s.y + fy * r * 0.9, r * 0.55, r * 0.45, { fill: fc(s, '#7a6a62'), outlineW: 2 }, s.facing);
  ctx.fillStyle = '#ff5050';
  ctx.beginPath();
  ctx.arc(s.x + fx * r * 1.1 - fy * 2.5, s.y + fy * r * 1.1 + fx * 2.5, 1.2, 0, Math.PI * 2);
  ctx.arc(s.x + fx * r * 1.1 + fy * 2.5, s.y + fy * r * 1.1 - fx * 2.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
});

registerDraw('crypt_gravedigger', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.5, 3);
  // shovel: raised in windup, slammed in attack
  const lift = s.pose === 'windup' ? -1.6 : s.pose === 'attack' ? 0.2 : -0.6;
  const a = s.facing + lift * 0.5;
  const hx = s.x + fy * r * 0.5;
  const hy = s.y - fx * r * 0.5 + b;
  limb(ctx, hx, hy, hx + Math.cos(a) * r * 2.2, hy + Math.sin(a) * r * 2.2 - (s.pose === 'windup' ? r * 0.8 : 0), 4, fc(s, '#6a4a2a'));
  const ex = hx + Math.cos(a) * r * 2.2;
  const ey = hy + Math.sin(a) * r * 2.2 - (s.pose === 'windup' ? r * 0.8 : 0);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(a);
  poly(ctx, [0, -9, 18, -11, 22, 0, 18, 11, 0, 9], fc(s, '#8a8f98'));
  ctx.restore();
  blob(ctx, s.x, s.y + b, r * 0.95, r * (0.85 - s.squash * 0.1), { fill: fc(s, '#4a3a2a') });
  // apron
  ctx.fillStyle = fc(s, '#7a6a4a');
  ctx.beginPath();
  ctx.ellipse(s.x + fx * 4, s.y + r * 0.2 + b, r * 0.55, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  blob(ctx, s.x + fx * 4, s.y - r * 0.6 + b, r * 0.45, r * 0.42, { fill: fc(s, '#9a8a7a') });
  // wide hat
  blob(ctx, s.x + fx * 3, s.y - r * 0.85 + b, r * 0.85, r * 0.28, { fill: fc(s, '#2a2a22') });
  blob(ctx, s.x + fx * 3, s.y - r * 1.0 + b, r * 0.42, r * 0.3, { fill: fc(s, '#2a2a22'), outlineW: 2 });
  eyes(ctx, s.x + fx * 6, s.y - r * 0.55 + b, s.facing, r * 0.15, 2, '#ffd27a', 2);
});

registerDraw('crypt_wisp', (ctx, s) => {
  const r = s.r * s.scale;
  const fl = Math.sin(s.t * 13) * 0.15;
  const y = s.y - 10 + Math.sin(s.t * 3) * 4;
  glow(ctx, s.x, y, r * 4, '#8fe0ff', 0.55);
  ctx.save();
  ctx.fillStyle = fc(s, '#bff0ff');
  ctx.beginPath();
  ctx.moveTo(s.x, y - r * (1.8 + fl));
  ctx.quadraticCurveTo(s.x + r * 1.1, y - r * 0.4, s.x + r * 0.9, y + r * 0.4);
  ctx.arc(s.x, y + r * 0.2, r * 0.95, 0.3, Math.PI - 0.3);
  ctx.quadraticCurveTo(s.x - r * 1.1, y - r * 0.4, s.x, y - r * (1.8 + fl));
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#3a6a8a';
  ctx.stroke();
  ctx.restore();
  blob(ctx, s.x, y, r * 0.5, r * 0.5, { fill: '#ffffff', outlineW: 0 });
  eyes(ctx, s.x, y - 1, s.facing, r * 0.22, 1.8, '#1a3a5a', 1.5);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 12, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

registerDraw('crypt_hollow_knight', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 5);
  // sword arm
  const swing = s.pose === 'attack' ? 0.9 : s.pose === 'windup' ? -1.2 : 0.4;
  const sa = s.facing + swing;
  const sx = s.x + fy * r * 0.7;
  const sy = s.y - fx * r * 0.7 + b;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(sa);
  limb(ctx, 0, 0, 6, 0, 4, '#3a3440');
  poly(ctx, [6, -3, 40, -3, 46, 0, 40, 3, 6, 3], fc(s, '#c9ced6'));
  ctx.restore();
  blob(ctx, s.x, s.y + b, r * 0.9, r * 0.85, { fill: fc(s, '#6a7078') });
  spec(ctx, s.x - r * 0.3, s.y - r * 0.3 + b, 2.5);
  // helm with empty visor
  blob(ctx, s.x + fx * 2, s.y - r * 0.75 + b, r * 0.55, r * 0.55, { fill: fc(s, '#7a8088') });
  ctx.fillStyle = '#0a0a10';
  ctx.save();
  ctx.translate(s.x + fx * (r * 0.3), s.y - r * 0.75 + b + fy * r * 0.2);
  ctx.rotate(s.facing + Math.PI / 2);
  ctx.fillRect(-r * 0.35, -2, r * 0.7, 4);
  ctx.restore();
  glow(ctx, s.x + fx * r * 0.35, s.y - r * 0.72 + b, 8, '#7affc0', 0.5);
  // shield toward the facing
  ctx.save();
  ctx.translate(s.x + fx * r * 0.95 - fy * r * 0.2, s.y + fy * r * 0.95 + fx * r * 0.2 + b);
  ctx.rotate(s.facing);
  poly(ctx, [-4, -r * 0.8, 6, -r * 0.7, 8, 0, 6, r * 0.7, -4, r * 0.8], fc(s, '#4a5a44'));
  ctx.fillStyle = fc(s, BONE);
  ctx.fillRect(-1, -r * 0.5, 4, r);
  ctx.restore();
});

registerDraw('crypt_ghoul', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const crouch = s.pose === 'windup' ? 0.75 : 1;
  const b = bob(s, 2, 10);
  // long clawed arms
  for (const side of [-1, 1]) {
    const ax = s.x - fy * r * 0.7 * side;
    const ay = s.y + fx * r * 0.7 * side + b;
    const ex = ax + fx * r * 1.3 + (s.pose === 'attack' ? fx * r * 0.6 : 0);
    const ey = ay + fy * r * 1.3 + (s.pose === 'attack' ? fy * r * 0.6 : 0);
    limb(ctx, ax, ay, ex, ey, 4, fc(s, '#a8b0a0'));
    for (let k = -1; k <= 1; k++) limb(ctx, ex, ey, ex + Math.cos(s.facing + k * 0.4) * 8, ey + Math.sin(s.facing + k * 0.4) * 8, 1.5, '#e8e1c8');
  }
  blob(ctx, s.x, s.y + b, r * 0.8, r * 0.75 * crouch, { fill: fc(s, '#9aa290') }, s.facing);
  blob(ctx, s.x + fx * r * 0.6, s.y + fy * r * 0.6 - r * 0.3 + b, r * 0.5, r * 0.45, { fill: fc(s, '#b8c0a8') });
  eyes(ctx, s.x + fx * r * 0.7, s.y + fy * r * 0.6 - r * 0.35 + b, s.facing, r * 0.2, 2, '#ff3030', 1.5);
  // teeth
  ctx.fillStyle = '#fff';
  ctx.fillRect(s.x + fx * r * 0.95 - 3, s.y + fy * r * 0.85 - r * 0.15 + b, 6, 2);
});

registerDraw('crypt_plague_bell', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 6 + Math.sin(s.t * 2) * 1;
  glow(ctx, s.x, s.y + r * 0.6, r * 2.5, '#7ad040', 0.35);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.9, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const sway = Math.sin(s.t * (s.pose === 'windup' ? 14 : 2)) * (s.pose === 'windup' ? 0.25 : 0.08);
  ctx.save();
  ctx.translate(s.x, y - r);
  ctx.rotate(sway);
  ctx.translate(0, r);
  // bell body
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.9);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.1, -r * 1.05, r * 0.6);
  ctx.lineTo(r * 1.05, r * 0.6);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.1, r * 0.45, -r * 0.9);
  ctx.closePath();
  ctx.fillStyle = fc(s, '#5a5a4a');
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = fc(s, shade('#5a5a4a', 1.3));
  ctx.fillRect(-r * 0.9, r * 0.35, r * 1.8, r * 0.18);
  // clapper
  blob(ctx, Math.sin(s.t * 6) * 3, r * 0.75, r * 0.2, r * 0.2, { fill: '#2a2a22', outlineW: 2 });
  // crown loop
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -r * 1.05, r * 0.22, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
  // drifting plague motes
  for (let i = 0; i < 3; i++) {
    const a = s.t * 0.8 + i * 2.1;
    glow(ctx, s.x + Math.cos(a) * r * 1.2, s.y + Math.sin(a * 1.3) * r * 0.6, 8, '#9ae060', 0.5);
  }
});

/** Chest look shared by real chests and dormant mimics (the mimic breathes and is a touch warmer). */
export function drawChest(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, warm: boolean, breathe: number, flash = false, ornate = false): void {
  const w = 36;
  const h = 24;
  shadow(ctx, x, y + 4, 22);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + breathe, 1 + breathe);
  const wood = flash ? '#ffffff' : warm ? '#7a4a28' : '#6e4628';
  const lid = flash ? '#ffffff' : warm ? '#8a5430' : '#7a4e2c';
  poly(ctx, [-w / 2, -2, w / 2, -2, w / 2, h / 2, -w / 2, h / 2], wood);
  ctx.fillStyle = ornate ? '#d4af37' : '#8a8f98';
  ctx.fillRect(-w / 2 + 2, 2, w - 4, 3);
  ctx.save();
  ctx.translate(0, -2);
  ctx.rotate(-open * 0.9);
  poly(ctx, [-w / 2, 0, w / 2, 0, w / 2 - 2, -12, -w / 2 + 2, -12], lid);
  ctx.fillStyle = ornate ? '#d4af37' : '#8a8f98';
  ctx.fillRect(-3, -8, 6, 8);
  ctx.restore();
  if (ornate) glow(ctx, 0, -4, 30, '#c58cff', 0.5);
  ctx.restore();
}

registerDraw('mimic', (ctx, s) => {
  if (!s.awake) {
    drawChest(ctx, s.x, s.y, 0, true, Math.sin(s.t * 2.2) * 0.012, s.flash);
    return;
  }
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const gape = s.pose === 'windup' ? 0.9 : s.pose === 'attack' ? 0.2 : 0.55 + Math.sin(s.t * 8) * 0.1;
  shadow(ctx, s.x, s.y + 4, r);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing - Math.PI / 2);
  // stubby legs
  for (const lx of [-12, 12]) limb(ctx, lx, 4, lx * 1.2, 16 + Math.sin(s.t * 14 + lx) * 3 * s.moving, 4, '#3a2418');
  poly(ctx, [-20, -4, 20, -4, 20, 14, -20, 14], s.flash ? '#fff' : '#7a4a28');
  // teeth along the rim
  ctx.fillStyle = '#f4f0e0';
  for (let i = -16; i <= 16; i += 6) poly(ctx, [i - 2, -4, i + 2, -4, i, 2], '#f4f0e0', OUTLINE, 1);
  // lid gaping up/back
  ctx.save();
  ctx.translate(0, -4);
  ctx.rotate(-gape);
  poly(ctx, [-20, 0, 20, 0, 18, -14, -18, -14], s.flash ? '#fff' : '#8a5430');
  for (let i = -16; i <= 16; i += 6) poly(ctx, [i - 2, 0, i + 2, 0, i, -6], '#f4f0e0', OUTLINE, 1);
  ctx.restore();
  // tongue
  ctx.strokeStyle = '#c0304a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(Math.sin(s.t * 6) * 8, 14, Math.sin(s.t * 5) * 4, 22 + gape * 10);
  ctx.stroke();
  ctx.restore();
  eyes(ctx, s.x - fx * 2, s.y - 8, s.facing, 6, 2.4, '#ffd040', 1);
  void fy;
});
