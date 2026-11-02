// Interactable props: the bonfire (Joe's camp stove), sign posts, stairs, the reliquary, Gary's cart,
// station floor markers; plus The Instructor and Gary.
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from './parts';
import { drawChest } from './enemies/crypt';
import { DEFAULT_LOOK, drawJoe } from './players';
import { fc, registerDraw } from './registry';

export function drawBonfire(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, state: 'fresh' | 'ember' | 'unlit'): void {
  shadow(ctx, x, y + 6, 26);
  // the camp stove: a small metal stove on legs with a kettle
  limb(ctx, x - 14, y + 4, x - 18, y + 16, 3, '#3a3a40');
  limb(ctx, x + 14, y + 4, x + 18, y + 16, 3, '#3a3a40');
  poly(ctx, [x - 20, y - 6, x + 20, y - 6, x + 16, y + 8, x - 16, y + 8], '#5a5a62');
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(x - 14, y - 2, 28, 6);
  if (state !== 'unlit') {
    const k = state === 'fresh' ? 1 : 0.35;
    glow(ctx, x, y - 14, 60 * k + Math.sin(t * 7) * 4, '#ff9b2e', 0.7 * k);
    for (let i = 0; i < 3; i++) {
      const fx = x - 8 + i * 8;
      const h = (state === 'fresh' ? 18 : 7) + Math.sin(t * 9 + i * 2) * 4;
      ctx.fillStyle = i === 1 ? '#ffd27a' : '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(fx - 5, y - 6);
      ctx.quadraticCurveTo(fx, y - 6 - h * 1.2, fx + 5, y - 6);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#3a3030';
    ctx.fillRect(x - 10, y - 9, 20, 3);
  }
  // kettle
  blob(ctx, x + 10, y - 12, 7, 6, { fill: '#8a8f98', outlineW: 2 });
  spec(ctx, x + 8, y - 14, 1.5);
}

export function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void {
  shadow(ctx, x, y + 6, 8);
  limb(ctx, x, y + 6, x, y - 16, 4, '#6a4a2a');
  poly(ctx, [x - 14, y - 30, x + 14, y - 30, x + 14, y - 14, x - 14, y - 14], '#8a6a3a');
  ctx.fillStyle = '#2a1a0a';
  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(n), x, y - 18);
}

export function drawStationMarker(ctx: CanvasRenderingContext2D, x: number, y: number, done: boolean, t: number): void {
  ctx.save();
  ctx.strokeStyle = done ? '#58d66a' : withAlpha('#e6b84a', 0.6 + Math.sin(t * 4) * 0.2);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  if (done) {
    glow(ctx, x, y, 26, '#58d66a', 0.5);
    ctx.strokeStyle = '#58d66a';
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x - 2, y + 6);
    ctx.lineTo(x + 8, y - 6);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStairs(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, up = false): void {
  glow(ctx, x, y, 50, up ? '#fff3b0' : '#7a6aff', 0.4 + Math.sin(t * 2) * 0.1);
  for (let i = 0; i < 5; i++) {
    const w = 60 - i * 8;
    ctx.fillStyle = shade('#5a5a62', 1 - i * 0.15);
    ctx.fillRect(x - w / 2, y - 24 + i * 10, w, 10);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - 24 + i * 10, w, 10);
  }
}

export function drawReliquary(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, open: boolean): void {
  // a shrine plinth with an ornate chest
  poly(ctx, [x - 34, y + 14, x + 34, y + 14, x + 28, y + 24, x - 28, y + 24], '#6a6070');
  drawChest(ctx, x, y, open ? 1 : 0, false, 0, false, true);
  if (!open) for (let i = 0; i < 4; i++) glow(ctx, x + Math.cos(t + i * 1.6) * 30, y - 10 + Math.sin(t * 1.3 + i) * 10, 8, '#c58cff', 0.6);
  // candles
  for (const cx of [x - 40, x + 40]) {
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(cx - 3, y - 4, 6, 14);
    glow(ctx, cx, y - 8, 12 + Math.sin(t * 8 + cx) * 2, '#ffd27a', 0.8);
  }
}

export function drawCart(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(ctx, x, y + 10, 40);
  poly(ctx, [x - 40, y - 10, x + 40, y - 10, x + 36, y + 14, x - 36, y + 14], '#7a5232');
  for (const wx of [x - 24, x + 24]) {
    blob(ctx, wx, y + 16, 9, 9, { fill: '#4a3020' });
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(wx - 1, y + 9, 2, 14);
  }
  // awning
  poly(ctx, [x - 44, y - 34, x + 44, y - 34, x + 40, y - 22, x - 40, y - 22], '#a03030');
  for (let i = -36; i < 40; i += 16) {
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(x + i, y - 34, 8, 12);
  }
  limb(ctx, x - 38, y - 22, x - 38, y - 8, 3, '#5a3a20');
  limb(ctx, x + 38, y - 22, x + 38, y - 8, 3, '#5a3a20');
  // wares
  blob(ctx, x - 16, y - 14, 6, 6, { fill: '#58d66a', outlineW: 2 });
  blob(ctx, x, y - 15, 5, 7, { fill: '#4aa3ff', outlineW: 2 });
  blob(ctx, x + 16, y - 14, 6, 6, { fill: '#ff9b2e', outlineW: 2 });
}

registerDraw('the_instructor', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = Math.sin(s.t * 3) * 1.5;
  // huge torso in a tracksuit
  for (const side of [-1, 1]) {
    const ax = s.x - fy * r * 0.8 * side;
    const ay = s.y + fx * r * 0.8 * side + b;
    const up = s.pose === 'windup' ? -r * 0.9 : 0;
    limb(ctx, ax, ay, ax + fx * r * 0.9, ay + fy * r * 0.9 + up, 12, fc(s, '#2a4a8a'));
    blob(ctx, ax + fx * r * 0.95, ay + fy * r * 0.95 + up, 8, 8, { fill: fc(s, '#e0b890') });
  }
  blob(ctx, s.x, s.y + b, r, r * 0.92 * (1 - s.squash * 0.08), { fill: fc(s, '#2a4a8a') });
  ctx.strokeStyle = '#efe6d2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.9, s.y + b);
  ctx.lineTo(s.x + r * 0.9, s.y + b);
  ctx.stroke();
  // head with a cap and a whistle
  blob(ctx, s.x + fx * 4, s.y - r * 0.8 + b, r * 0.45, r * 0.45, { fill: fc(s, '#e0b890') });
  blob(ctx, s.x + fx * 4, s.y - r * 1.05 + b, r * 0.45, r * 0.2, { fill: fc(s, '#c03030') });
  eyes(ctx, s.x + fx * 6, s.y - r * 0.8 + b, s.facing, r * 0.15, 2, OUTLINE, 2);
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s.x - 6, s.y - r * 0.55 + b);
  ctx.lineTo(s.x + fx * r * 0.3, s.y - r * 0.3 + b);
  ctx.stroke();
  blob(ctx, s.x + fx * r * 0.3, s.y - r * 0.28 + b, 4, 3, { fill: '#d0d0d0', outlineW: 1.5 });
});

registerDraw('gary', (ctx, s) => {
  drawCart(ctx, s.x + 50, s.y - 4);
  drawJoe(ctx, { ...DEFAULT_LOOK, skin: '#e0c0a0', hair: '#7a5a3a', head: 'cap', headColor: '#4a7a4a', body: 'leather', bodyColor: '#6a5a3a', trim: '#c9b98a' }, {
    x: s.x,
    y: s.y,
    facing: s.facing,
    t: s.t,
    moving: 0,
    flash: s.flash,
  });
});
