// Hollow Forest roster draw functions (rust orange, pine green, amber, bark brown — ART_AUDIO §2).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const RUST = '#c8621f';
const PINE = '#1f3d22';
const AMBER = '#e6b84a';
const BARK = '#5a3a1a';
const PIXIE_COLORS = ['#f08ab0', '#9ad0ff', '#b8f090', '#ffd27a', '#d0a0ff'];

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** A full-circle sub-path (moveTo first, so several dots in one path are not joined by lines). */
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number): void {
  ctx.moveTo(x + rad, y);
  ctx.arc(x, y, rad, 0, Math.PI * 2);
}

/** A star / burr outline as one path (no array allocation). */
function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, rIn: number, rOut: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? rOut : rIn;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

registerDraw('forest_wolf', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.1);
  const run = Math.sin(s.t * 16) * (0.25 + s.moving * 0.75);
  const stretch = s.pose === 'attack' ? 1.25 : s.pose === 'windup' ? 0.86 : 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  // four scissoring legs
  for (let i = 0; i < 4; i++) {
    const lx = i < 2 ? r * 0.55 : -r * 0.55;
    const side = i % 2 === 0 ? 1 : -1;
    const k = (i < 2 ? 1 : -1) * side * run * r * 0.4;
    limb(ctx, lx, side * r * 0.3, lx + k, side * r * 0.72, 4, fc(s, '#2e2a26'));
  }
  // bushy tail with a pale tip
  const wag = Math.sin(s.t * 9) * 0.35;
  ctx.save();
  ctx.translate(-r * 0.95, 0);
  ctx.rotate(Math.PI + wag);
  blob(ctx, r * 0.5, 0, r * 0.62, r * 0.3, { fill: fc(s, '#3e3934') });
  blob(ctx, r * 0.95, 0, r * 0.22, r * 0.18, { fill: fc(s, '#a8a098'), outlineW: 2 });
  ctx.restore();
  blob(ctx, 0, 0, r * 1.05 * stretch, r * 0.7 * (1 - s.squash * 0.1), { fill: fc(s, '#4d4741') });
  // shaggy scruff over the shoulders
  blob(ctx, r * 0.45 * stretch, 0, r * 0.5, r * 0.75, { fill: fc(s, '#5c554e') });
  // hollow ribs showing along the back
  ctx.strokeStyle = withAlpha('#120e14', 0.7);
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.32, -r * 0.42);
    ctx.lineTo(i * r * 0.32 + r * 0.08, r * 0.42);
    ctx.stroke();
  }
  // head, snout, ears
  const hx = r * 1.05 * stretch;
  blob(ctx, hx, 0, r * 0.5, r * 0.42, { fill: fc(s, '#57514a') });
  poly(ctx, [hx + r * 0.3, -r * 0.2, hx + r * 0.85, -r * 0.08, hx + r * 0.85, r * 0.08, hx + r * 0.3, r * 0.2], fc(s, '#3a3632'));
  poly(ctx, [hx - r * 0.25, -r * 0.22, hx - r * 0.5, -r * 0.85, hx + r * 0.12, -r * 0.32], fc(s, '#3a3632'));
  poly(ctx, [hx - r * 0.25, r * 0.22, hx - r * 0.5, r * 0.85, hx + r * 0.12, r * 0.32], fc(s, '#3a3632'));
  if (s.pose === 'attack' || s.pose === 'windup') {
    // bared teeth
    ctx.fillStyle = '#f4f0e0';
    ctx.fillRect(hx + r * 0.55, -r * 0.12, r * 0.25, 2);
    ctx.fillRect(hx + r * 0.55, r * 0.1, r * 0.25, 2);
  }
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  dot(ctx, hx + r * 0.22, -r * 0.17, 2);
  dot(ctx, hx + r * 0.22, r * 0.17, 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x + Math.cos(s.facing) * r * 1.3, s.y + Math.sin(s.facing) * r * 1.3, 9, AMBER, 0.35);
});

registerDraw('forest_thornling', (ctx, s) => {
  const r = s.r * s.scale;
  const hop = Math.abs(Math.sin(s.t * 7 + s.variant * 1.3)) * 7 * (0.3 + s.moving * 0.7);
  shadow(ctx, s.x, s.y, r * 0.9, 0.32 - hop * 0.02);
  const y = s.y - hop - 2;
  const bristle = s.pose === 'windup' ? 1.6 : s.pose === 'attack' ? 1.75 : 1.3;
  // thorny burr
  starPath(ctx, s.x, y, 9, r * 0.8, r * bristle, s.t * 0.6);
  ctx.fillStyle = fc(s, '#6e4218');
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  blob(ctx, s.x, y, r * 0.88, r * 0.82 * (1 - s.squash * 0.15), { fill: fc(s, '#3f6a2a') });
  // sprout on top
  limb(ctx, s.x, y - r * 0.7, s.x + 3, y - r * 1.2, 2, fc(s, '#5a8a3a'));
  blob(ctx, s.x + 6, y - r * 1.25, 4, 2.5, { fill: fc(s, '#7ab04a'), outlineW: 1.5 }, -0.5);
  eyes(ctx, s.x, y - r * 0.1, s.facing, r * 0.3, 2.2, '#f0e070', 1.5);
  // grumpy mouth
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(s.x + Math.cos(s.facing) * 2, y + r * 0.42, r * 0.22, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
});

registerDraw('forest_fey_archer', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.8);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.5, 4) - 3;
  // gossamer wings behind the shoulders
  const flap = 0.75 + Math.abs(Math.sin(s.t * 11)) * 0.35;
  ctx.save();
  ctx.globalAlpha *= 0.55;
  for (const side of [-1, 1]) {
    blob(ctx, s.x + side * r * 0.75 - fx * 4, s.y - r * 0.55 + b, r * 0.62 * flap, r * 0.32, { fill: '#d8f0c0', outline: '#3a6a3a', outlineW: 1.5 }, side * 0.6);
    blob(ctx, s.x + side * r * 0.6 - fx * 4, s.y - r * 0.05 + b, r * 0.45 * flap, r * 0.22, { fill: '#e8f8d0', outline: '#3a6a3a', outlineW: 1.5 }, side * -0.4);
  }
  ctx.restore();
  // slender body and leaf cloak
  blob(ctx, s.x, s.y + b, r * 0.5, r * 0.8 * (1 - s.squash * 0.08), { fill: fc(s, '#3f7a4a') });
  poly(ctx, [s.x - r * 0.5, s.y - r * 0.2 + b, s.x, s.y + r * 0.9 + b, s.x + r * 0.5, s.y - r * 0.2 + b, s.x, s.y + r * 0.2 + b], fc(s, PINE), OUTLINE, 2);
  // bow toward the facing
  const pull = s.pose === 'windup' ? 0.9 : 0;
  const bx = s.x + fx * r * 0.9;
  const by = s.y + fy * r * 0.9 + b;
  limb(ctx, s.x - fy * 4, s.y + fx * 4 + b, bx, by, 3, fc(s, '#e8d8b0'));
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(s.facing);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(-3, 0, r * 0.95, -1.25, 1.25);
  ctx.stroke();
  ctx.strokeStyle = fc(s, AMBER);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#f4f0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3 + Math.cos(-1.25) * r * 0.95, Math.sin(-1.25) * r * 0.95);
  ctx.lineTo(-3 - pull * 11, 0);
  ctx.lineTo(-3 + Math.cos(1.25) * r * 0.95, Math.sin(1.25) * r * 0.95);
  ctx.stroke();
  ctx.restore();
  // head with long ears
  const hy = s.y - r * 0.95 + b;
  poly(ctx, [s.x - r * 0.3, hy - 1, s.x - r * 1.0, hy - r * 0.55, s.x - r * 0.25, hy - r * 0.25], fc(s, '#e8d8b0'), OUTLINE, 2);
  poly(ctx, [s.x + r * 0.3, hy - 1, s.x + r * 1.0, hy - r * 0.55, s.x + r * 0.25, hy - r * 0.25], fc(s, '#e8d8b0'), OUTLINE, 2);
  blob(ctx, s.x + fx * 2, hy, r * 0.42, r * 0.42, { fill: fc(s, '#f0e2c0') });
  // amber hair band
  ctx.fillStyle = fc(s, RUST);
  ctx.fillRect(s.x - r * 0.38, hy - r * 0.32, r * 0.76, 3);
  eyes(ctx, s.x + fx * 3, hy + 1, s.facing, r * 0.16, 1.8, '#2a6a3a', 1.5);
  spec(ctx, s.x - r * 0.15, hy - r * 0.18, 1.5);
});

registerDraw('forest_treant', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y + 4, r * 1.1, 0.4);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const sway = Math.sin(s.t * 1.6) * 0.06 + s.moving * Math.sin(s.t * 4) * 0.05;
  // root feet
  for (let i = -1; i <= 1; i++) limb(ctx, s.x + i * r * 0.35, s.y + r * 0.55, s.x + i * r * 0.7, s.y + r * 0.85 + Math.abs(i) * -2, 6, fc(s, shade(BARK, 0.8)));
  // branch arms: raised in windup, slammed forward in attack
  const lift = s.pose === 'windup' ? -1.3 : s.pose === 'attack' ? 0.5 : -0.3;
  for (const side of [-1, 1]) {
    const ax = s.x + side * r * 0.6;
    const ay = s.y - r * 0.2;
    const ex = ax + side * r * 0.4 + fx * r * 0.45;
    const ey = ay + lift * r * 0.55 + fy * r * 0.35;
    limb(ctx, ax, ay, ex, ey, 8, fc(s, BARK));
    limb(ctx, ex, ey, ex + side * r * 0.3 + fx * 6, ey - r * 0.25, 3, fc(s, BARK));
    limb(ctx, ex, ey, ex + fx * r * 0.35, ey + fy * r * 0.2 + 5, 3, fc(s, BARK));
  }
  // trunk
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.4);
  ctx.rotate(sway);
  blob(ctx, 0, -r * 0.45, r * 0.68, r * 0.95 * (1 - s.squash * 0.06), { fill: fc(s, '#6a4624') });
  // bark grooves
  ctx.strokeStyle = withAlpha('#120e14', 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.1);
  ctx.quadraticCurveTo(-r * 0.4, r * 0.15, -r * 0.25, r * 0.4);
  ctx.moveTo(r * 0.32, -r * 0.2);
  ctx.quadraticCurveTo(r * 0.42, r * 0.1, r * 0.3, r * 0.4);
  ctx.stroke();
  // carved face: glowing eye holes and a knot mouth
  const ey2 = -r * 0.6;
  ctx.fillStyle = '#120e14';
  ctx.beginPath();
  ctx.ellipse(-r * 0.22 + fx * 3, ey2, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
  ctx.moveTo(r * 0.34 + fx * 3, ey2);
  ctx.ellipse(r * 0.22 + fx * 3, ey2, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = s.pose === 'windup' ? '#ffd27a' : AMBER;
  ctx.beginPath();
  dot(ctx, -r * 0.22 + fx * 4, ey2 + 1, 2.4);
  dot(ctx, r * 0.22 + fx * 4, ey2 + 1, 2.4);
  ctx.fill();
  ctx.fillStyle = '#120e14';
  ctx.beginPath();
  ctx.ellipse(fx * 3, -r * 0.25, r * 0.2, s.pose === 'windup' ? r * 0.14 : r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // canopy crown
  blob(ctx, -r * 0.55, -r * 1.35, r * 0.6, r * 0.5, { fill: fc(s, PINE) });
  blob(ctx, r * 0.55, -r * 1.35, r * 0.6, r * 0.5, { fill: fc(s, PINE) });
  blob(ctx, 0, -r * 1.6, r * 0.75, r * 0.6, { fill: fc(s, '#2a5230') });
  ctx.fillStyle = fc(s, RUST);
  ctx.beginPath();
  dot(ctx, -r * 0.4, -r * 1.55, 3);
  dot(ctx, r * 0.3, -r * 1.8, 3);
  dot(ctx, r * 0.7, -r * 1.3, 2.5);
  ctx.fill();
  ctx.fillStyle = fc(s, AMBER);
  ctx.beginPath();
  dot(ctx, -r * 0.05, -r * 1.95, 2.5);
  dot(ctx, -r * 0.75, -r * 1.25, 2.2);
  ctx.fill();
  spec(ctx, -r * 0.2, -r * 1.85, 2.5, 0.5);
  ctx.restore();
});

registerDraw('forest_witch', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 3.5);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  // staff with a hex orb
  const sx = s.x + fy * r * 0.7 + fx * r * 0.4;
  const sy = s.y - fx * r * 0.7 + fy * r * 0.4 + b;
  limb(ctx, sx, sy + r * 0.8, sx + fx * 3, sy - r * 1.1 - (casting ? 4 : 0), 3, fc(s, BARK));
  glow(ctx, sx + fx * 3, sy - r * 1.2, casting ? 22 : 12, '#b06bff', casting ? 0.8 : 0.45);
  blob(ctx, sx + fx * 3, sy - r * 1.2 - (casting ? 4 : 0), 4, 4, { fill: fc(s, '#c58cff'), outlineW: 2 });
  // robe
  poly(ctx, [s.x - r * 0.4, s.y - r * 0.55 + b, s.x + r * 0.4, s.y - r * 0.55 + b, s.x + r * 0.95, s.y + r * 0.8 + b, s.x - r * 0.95, s.y + r * 0.8 + b], fc(s, '#3a2a4a'));
  ctx.fillStyle = fc(s, shade('#3a2a4a', 0.7));
  ctx.fillRect(s.x - r * 0.9, s.y + r * 0.55 + b, r * 1.8, r * 0.22);
  // free hand reaching toward the target while casting
  const hx = s.x - fy * r * 0.5 + fx * r * (casting ? 1.1 : 0.6);
  const hy = s.y + fx * r * 0.5 + fy * r * (casting ? 1.1 : 0.6) + b;
  limb(ctx, s.x - fy * r * 0.35, s.y + fx * r * 0.35 - r * 0.2 + b, hx, hy, 3, fc(s, '#8aa070'));
  // face with a long nose
  const hy2 = s.y - r * 0.85 + b;
  blob(ctx, s.x + fx * 2, hy2, r * 0.42, r * 0.4, { fill: fc(s, '#8aa070') });
  poly(ctx, [s.x + fx * r * 0.2 - fy * 3, hy2 + fy * r * 0.2 + fx * 3, s.x + fx * r * 0.75, hy2 + fy * r * 0.75 + 3, s.x + fx * r * 0.2 + fy * 3, hy2 + fy * r * 0.2 - fx * 3], fc(s, '#7a9060'), OUTLINE, 2);
  eyes(ctx, s.x + fx * 3, hy2 - 1, s.facing, r * 0.17, 1.8, '#e6ff60', 1.5);
  // the hat: wide brim and a crooked cone
  blob(ctx, s.x, hy2 - r * 0.3, r * 0.95, r * 0.26, { fill: fc(s, '#24182e') });
  const tip = Math.sin(s.t * 2) * 3;
  poly(ctx, [s.x - r * 0.5, hy2 - r * 0.38, s.x + r * 0.5, hy2 - r * 0.38, s.x + r * 0.25 + tip, hy2 - r * 1.25, s.x + r * 0.7 + tip, hy2 - r * 1.7], fc(s, '#2e2038'));
  ctx.fillStyle = fc(s, AMBER);
  ctx.fillRect(s.x - r * 0.46, hy2 - r * 0.55, r * 0.92, 3);
});

registerDraw('forest_stag', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.15, 0.36);
  const run = Math.sin(s.t * 10) * (0.2 + s.moving * 0.8);
  const charge = s.pose === 'attack' ? 1.15 : 1;
  const lower = s.pose === 'windup' || s.pose === 'attack' ? 1 : 0;
  const stunned = s.pose === 'stagger';
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing + (stunned ? Math.sin(s.t * 30) * 0.08 : 0));
  // long legs
  for (let i = 0; i < 4; i++) {
    const lx = i < 2 ? r * 0.55 : -r * 0.6;
    const side = i % 2 === 0 ? 1 : -1;
    const k = (i < 2 ? 1 : -1) * side * run * r * 0.35;
    limb(ctx, lx, side * r * 0.3, lx + k, side * r * 0.8, 5, fc(s, '#4a3420'));
  }
  // neck reaching forward to the head
  limb(ctx, r * 0.5, 0, r * (0.85 + lower * 0.25) * charge, 0, r * 0.4, fc(s, '#7a5a36'));
  // stub tail
  blob(ctx, -r * 1.05, 0, r * 0.2, r * 0.16, { fill: fc(s, '#e8e1c8'), outlineW: 2 });
  blob(ctx, 0, 0, r * 1.05 * charge, r * 0.55 * (1 - s.squash * 0.08), { fill: fc(s, '#8a6a42') });
  // pale chest blaze
  ctx.fillStyle = fc(s, '#c8a878');
  ctx.beginPath();
  ctx.ellipse(r * 0.5, 0, r * 0.3, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // head on a neck; lowered for the charge
  const hx = r * (0.95 + lower * 0.25) * charge;
  blob(ctx, hx, 0, r * 0.38, r * 0.3, { fill: fc(s, '#7a5a36') });
  ctx.fillStyle = '#120e14';
  ctx.beginPath();
  ctx.arc(hx + r * 0.32, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // great antlers: main beams sweep forward when lowered
  const spread = 1.0 - lower * 0.5;
  for (const side of [-1, 1]) {
    const a = side * spread;
    const bx = hx + Math.cos(a) * r * 0.75;
    const by = Math.sin(a) * r * 0.75 + side * r * 0.2;
    limb(ctx, hx - r * 0.05, side * r * 0.18, bx, by, 3.5, fc(s, '#e8e1c8'));
    const mx = (hx + bx) / 2;
    const my = (side * r * 0.18 + by) / 2;
    limb(ctx, mx, my, mx + r * 0.25, my + side * r * 0.22, 2.5, fc(s, '#e8e1c8'));
    limb(ctx, bx, by, bx + r * 0.22, by + side * r * 0.04, 2.5, fc(s, '#e8e1c8'));
    limb(ctx, bx, by, bx - r * 0.04, by + side * r * 0.25, 2.5, fc(s, '#e8e1c8'));
  }
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  dot(ctx, hx + r * 0.08, -r * 0.18, 2);
  dot(ctx, hx + r * 0.08, r * 0.18, 2);
  ctx.fill();
  ctx.restore();
  if (stunned) {
    // dizzy stars over the head
    for (let i = 0; i < 3; i++) {
      const a = s.t * 5 + (i * Math.PI * 2) / 3;
      glow(ctx, s.x + Math.cos(a) * r * 0.7, s.y - r * 0.9 + Math.sin(a) * r * 0.25, 7, '#ffe14a', 0.8);
    }
  }
});

registerDraw('forest_pixie', (ctx, s) => {
  const r = s.r * s.scale;
  const col = PIXIE_COLORS[s.variant % PIXIE_COLORS.length]!;
  const y = s.y - 12 + Math.sin(s.t * 9 + s.variant * 1.7) * 3;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 6, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x, y, r * 3.2, s.pose === 'windup' ? '#fff6c0' : col, s.pose === 'windup' ? 0.9 : 0.5);
  // four buzzing wings
  const flap = 0.4 + Math.abs(Math.sin(s.t * 38 + s.variant)) * 0.8;
  ctx.save();
  ctx.globalAlpha *= 0.7;
  for (const side of [-1, 1]) {
    blob(ctx, s.x + side * r * 0.9, y - r * 0.5, r * 0.9 * flap, r * 0.45, { fill: '#f4fbff', outline: '#5a6a8a', outlineW: 1 }, side * -0.5);
    blob(ctx, s.x + side * r * 0.7, y + r * 0.2, r * 0.6 * flap, r * 0.3, { fill: '#f4fbff', outline: '#5a6a8a', outlineW: 1 }, side * 0.5);
  }
  ctx.restore();
  blob(ctx, s.x, y, r * 0.5, r * 0.7, { fill: fc(s, col), outlineW: 2 });
  blob(ctx, s.x, y - r * 0.75, r * 0.45, r * 0.45, { fill: fc(s, '#ffe8d0'), outlineW: 2 });
  // tuft of hair
  ctx.fillStyle = fc(s, AMBER);
  ctx.beginPath();
  ctx.arc(s.x - 1, y - r * 1.1, r * 0.25, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, s.x, y - r * 0.75, s.facing, r * 0.18, 1.1, OUTLINE, 1);
});

registerDraw('forest_huntsman', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 6);
  // knife arm: drawn back in the windup, thrust in the attack
  const reach = s.pose === 'attack' ? 1.5 : s.pose === 'windup' ? 0.3 : 0.85;
  const ax = s.x + fy * r * 0.55;
  const ay = s.y - fx * r * 0.55 + b;
  const kx = ax + fx * r * reach;
  const ky = ay + fy * r * reach;
  limb(ctx, ax, ay, kx, ky, 4, fc(s, '#3a3020'));
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(s.facing);
  poly(ctx, [0, -2.5, 15, -1, 19, 0, 15, 1, 0, 2.5], fc(s, '#d8dde4'), OUTLINE, 2);
  ctx.restore();
  // cloak: a hooded teardrop
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - r * 1.55 + b);
  ctx.quadraticCurveTo(s.x + r * 0.95, s.y - r * 0.6 + b, s.x + r * 0.9, s.y + r * 0.75 + b);
  ctx.lineTo(s.x - r * 0.9, s.y + r * 0.75 + b);
  ctx.quadraticCurveTo(s.x - r * 0.95, s.y - r * 0.6 + b, s.x, s.y - r * 1.55 + b);
  ctx.closePath();
  ctx.fillStyle = fc(s, '#2f3a24');
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // ragged hem
  ctx.fillStyle = fc(s, shade('#2f3a24', 0.7));
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(s.x + i * r * 0.36 - r * 0.15, s.y + r * 0.72 + b);
    ctx.lineTo(s.x + i * r * 0.36, s.y + r * 0.98 + b);
    ctx.lineTo(s.x + i * r * 0.36 + r * 0.15, s.y + r * 0.72 + b);
    ctx.fill();
  }
  // a bear trap on the belt
  ctx.strokeStyle = fc(s, '#8a8a8a');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x - r * 0.35, s.y + r * 0.35 + b, r * 0.25, 0, Math.PI);
  ctx.stroke();
  // dark hood opening with two pale glints, turned to the facing
  blob(ctx, s.x + fx * r * 0.18, s.y - r * 0.55 + b + fy * r * 0.12, r * 0.42, r * 0.36, { fill: '#0e0c10', outlineW: 2 });
  eyes(ctx, s.x + fx * r * 0.3, s.y - r * 0.55 + b + fy * r * 0.15, s.facing, r * 0.15, 1.6, '#d8f0c0', 1);
  // a tuft of rust feather on the hood
  limb(ctx, s.x - r * 0.15, s.y - r * 1.3 + b, s.x - r * 0.55, s.y - r * 1.6 + b, 2.5, fc(s, RUST));
});
