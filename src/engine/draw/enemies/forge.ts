// Ashen Forge roster draw functions (crimson, soot, ember orange, molten gold — ART_AUDIO §2).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const CRIMSON = '#8e1b1b';
const SOOT = '#1a1010';
const EMBER = '#ff7a1a';
const GOLD = '#ffd27a';

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** A small licking flame (teardrop) pointing up from (x, y). */
function flame(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, t: number, outer = EMBER, inner = GOLD): void {
  const w = h * 0.45;
  const lick = Math.sin(t * 14) * h * 0.12;
  ctx.beginPath();
  ctx.moveTo(x + lick, y - h);
  ctx.quadraticCurveTo(x + w, y - h * 0.35, x + w * 0.6, y);
  ctx.quadraticCurveTo(x, y + h * 0.18, x - w * 0.6, y);
  ctx.quadraticCurveTo(x - w, y - h * 0.35, x + lick, y - h);
  ctx.closePath();
  ctx.fillStyle = outer;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + lick * 0.6, y - h * 0.6);
  ctx.quadraticCurveTo(x + w * 0.45, y - h * 0.2, x, y - 1);
  ctx.quadraticCurveTo(x - w * 0.45, y - h * 0.2, x + lick * 0.6, y - h * 0.6);
  ctx.closePath();
  ctx.fillStyle = inner;
  ctx.fill();
}

registerDraw('forge_cultist', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.6, 6);
  // dagger hand with a burning blade
  const reach = s.pose === 'attack' ? 1.45 : s.pose === 'windup' ? 0.4 : 0.9;
  const ax = s.x + fy * r * 0.6;
  const ay = s.y - fx * r * 0.6 + b;
  const kx = ax + fx * r * reach;
  const ky = ay + fy * r * reach;
  limb(ctx, ax, ay, kx, ky, 4, fc(s, shade(CRIMSON, 0.8)));
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(s.facing);
  poly(ctx, [0, -2.5, 13, -1, 17, 0, 13, 1, 0, 2.5], fc(s, '#c9ced6'), OUTLINE, 2);
  ctx.restore();
  glow(ctx, kx + fx * 10, ky + fy * 10, 12, EMBER, 0.7);
  // robe, flared
  poly(ctx, [s.x - r * 0.45, s.y - r * 0.6 + b, s.x + r * 0.45, s.y - r * 0.6 + b, s.x + r * 0.85, s.y + r * 0.8 + b, s.x - r * 0.85, s.y + r * 0.8 + b], fc(s, CRIMSON));
  ctx.fillStyle = fc(s, shade(CRIMSON, 0.65));
  ctx.fillRect(s.x - r * 0.8, s.y + r * 0.55 + b, r * 1.6, r * 0.22);
  // rope belt
  ctx.strokeStyle = fc(s, GOLD);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.55, s.y + b);
  ctx.lineTo(s.x + r * 0.55, s.y + b);
  ctx.lineTo(s.x + r * 0.3, s.y + r * 0.35 + b);
  ctx.stroke();
  // peaked hood with an iron mask
  poly(ctx, [s.x - r * 0.55, s.y - r * 0.45 + b, s.x, s.y - r * 1.6 + b, s.x + r * 0.55, s.y - r * 0.45 + b], fc(s, shade(CRIMSON, 0.85)));
  blob(ctx, s.x + fx * r * 0.15, s.y - r * 0.72 + b + fy * 2, r * 0.32, r * 0.3, { fill: fc(s, '#5a5458'), outlineW: 2 });
  eyes(ctx, s.x + fx * r * 0.25, s.y - r * 0.74 + b + fy * 2, s.facing, r * 0.13, 1.6, EMBER, 1);
  // smouldering coals on the shoulders
  glow(ctx, s.x - r * 0.45, s.y - r * 0.5 + b, 8, EMBER, 0.5 + Math.sin(s.t * 7) * 0.2);
  glow(ctx, s.x + r * 0.45, s.y - r * 0.5 + b, 8, EMBER, 0.5 + Math.cos(s.t * 6) * 0.2);
});

registerDraw('forge_hound', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.1);
  const run = Math.sin(s.t * 15) * (0.25 + s.moving * 0.75);
  const stretch = s.pose === 'attack' ? 1.22 : s.pose === 'windup' ? 0.85 : 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  // stubby legs
  for (let i = 0; i < 4; i++) {
    const lx = i < 2 ? r * 0.5 : -r * 0.5;
    const side = i % 2 === 0 ? 1 : -1;
    const k = (i < 2 ? 1 : -1) * side * run * r * 0.35;
    limb(ctx, lx, side * r * 0.35, lx + k, side * r * 0.75, 5, fc(s, '#140c0a'));
  }
  // burning tail
  ctx.save();
  ctx.translate(-r * 1.05, 0);
  ctx.rotate(-Math.PI / 2 + Math.sin(s.t * 8) * 0.3);
  flame(ctx, 0, 0, r * 0.9, s.t);
  ctx.restore();
  // stocky body with molten cracks
  blob(ctx, 0, 0, r * 1.05 * stretch, r * 0.72 * (1 - s.squash * 0.1), { fill: fc(s, '#2e1c16') });
  ctx.strokeStyle = s.flash ? '#ffffff' : EMBER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.2);
  ctx.lineTo(-r * 0.2, r * 0.05);
  ctx.lineTo(r * 0.1, -r * 0.25);
  ctx.lineTo(r * 0.45, r * 0.1);
  ctx.moveTo(-r * 0.4, r * 0.35);
  ctx.lineTo(0, r * 0.25);
  ctx.stroke();
  // flame mane along the spine
  for (let i = 0; i < 4; i++) {
    const mx = r * 0.55 - i * r * 0.38;
    const h = r * (0.55 + Math.sin(s.t * 12 + i * 1.7) * 0.15);
    ctx.save();
    ctx.translate(mx, 0);
    ctx.rotate(Math.PI);
    flame(ctx, 0, 0, h, s.t + i);
    ctx.restore();
  }
  // blunt head with glowing maw
  const hx = r * 1.0 * stretch;
  blob(ctx, hx, 0, r * 0.52, r * 0.48, { fill: fc(s, '#3a2218') });
  const open = s.pose === 'windup' || s.pose === 'attack' ? 0.22 : 0.08;
  ctx.fillStyle = s.flash ? '#ffffff' : GOLD;
  ctx.beginPath();
  ctx.ellipse(hx + r * 0.4, 0, r * 0.16, r * open + 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = EMBER;
  ctx.beginPath();
  ctx.arc(hx + r * 0.1, -r * 0.22, 2.2, 0, Math.PI * 2);
  ctx.moveTo(hx + r * 0.1 + 2.2, r * 0.22);
  ctx.arc(hx + r * 0.1, r * 0.22, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x, s.y, r * 1.8, EMBER, 0.25);
});

registerDraw('forge_pyromancer', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 3);
  const casting = s.pose === 'windup';
  // long robe with a soot hem
  blob(ctx, s.x, s.y + b, r * 0.8, r * 0.85 * (1 - s.squash * 0.08), { fill: fc(s, '#5a1414') });
  ctx.fillStyle = fc(s, SOOT);
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.62 + b, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // spiked mantle collar
  poly(ctx, [s.x - r * 0.95, s.y - r * 0.35 + b, s.x - r * 0.75, s.y - r * 1.05 + b, s.x - r * 0.35, s.y - r * 0.55 + b, s.x, s.y - r * 0.7 + b, s.x + r * 0.35, s.y - r * 0.55 + b, s.x + r * 0.75, s.y - r * 1.05 + b, s.x + r * 0.95, s.y - r * 0.35 + b, s.x, s.y - r * 0.1 + b], fc(s, CRIMSON));
  // bald head with goggles
  const hy = s.y - r * 0.8 + b;
  blob(ctx, s.x + fx * 2, hy, r * 0.4, r * 0.38, { fill: fc(s, '#c8906a') });
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(s.x - r * 0.4 + fx * 2, hy - 3, r * 0.8, 3);
  eyes(ctx, s.x + fx * 3, hy - 1, s.facing, r * 0.18, 3, GOLD, 1);
  spec(ctx, s.x - r * 0.12, hy - r * 0.22, 1.8);
  // two hands, each juggling a fireball; they meet in front while casting
  for (const side of [-1, 1]) {
    const spread = casting ? 0.25 : 0.85;
    const hx = s.x + fx * r * (casting ? 1.1 : 0.55) - fy * r * spread * side;
    const hy2 = s.y + fy * r * (casting ? 1.1 : 0.55) + fx * r * spread * side + b - r * 0.2;
    limb(ctx, s.x - fy * r * 0.5 * side, s.y + fx * r * 0.5 * side - r * 0.3 + b, hx, hy2, 3.5, fc(s, '#5a1414'));
    const fy2 = hy2 - 8 - Math.abs(Math.sin(s.t * 5 + side)) * 4;
    const sz = casting ? 7 + s.poseT * 6 : 5;
    glow(ctx, hx, fy2, sz * 3, EMBER, 0.75);
    blob(ctx, hx, fy2, sz, sz, { fill: GOLD, outline: EMBER, outlineW: 2 });
  }
});

registerDraw('forge_anvil_golem', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y + 4, r * 1.15, 0.42);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 2.5);
  const side = fx >= 0 ? 1 : -1;
  // stubby stone legs
  for (const lx of [-0.45, 0.45]) blob(ctx, s.x + lx * r, s.y + r * 0.7 + b * 0.5, r * 0.28, r * 0.22, { fill: fc(s, '#3a3438') });
  // the anvil torso: flat top, waist, horn toward the facing side
  const ty = s.y - r * 0.55 + b;
  poly(
    ctx,
    [
      s.x - r * 0.85 * side, ty - r * 0.2,
      s.x + r * 0.7 * side, ty - r * 0.2,
      s.x + r * 1.35 * side, ty - r * 0.05,
      s.x + r * 0.7 * side, ty + r * 0.2,
      s.x + r * 0.45 * side, ty + r * 0.35,
      s.x + r * 0.6 * side, ty + r * 1.05,
      s.x - r * 0.75 * side, ty + r * 1.05,
      s.x - r * 0.55 * side, ty + r * 0.35,
      s.x - r * 0.85 * side, ty + r * 0.2,
    ],
    fc(s, '#4a4650'),
  );
  ctx.fillStyle = fc(s, '#6a6670');
  ctx.fillRect(s.x - r * 0.8, ty - r * 0.2, r * 1.5, r * 0.12);
  // glowing forge core
  glow(ctx, s.x, ty + r * 0.65, r * 0.9, EMBER, 0.6 + Math.sin(s.t * 3) * 0.15);
  blob(ctx, s.x, ty + r * 0.65, r * 0.2, r * 0.22, { fill: s.flash ? '#ffffff' : GOLD, outline: CRIMSON, outlineW: 2 });
  // blocky head
  poly(ctx, [s.x - r * 0.3, ty - r * 0.2, s.x - r * 0.28, ty - r * 0.7, s.x + r * 0.28, ty - r * 0.7, s.x + r * 0.3, ty - r * 0.2], fc(s, '#55515a'));
  ctx.fillStyle = EMBER;
  ctx.fillRect(s.x - r * 0.18 + fx * 3, ty - r * 0.5, r * 0.36, 3);
  // hammer arm: raised in windup, slammed in attack
  const lift = s.pose === 'windup' ? -1.4 : s.pose === 'attack' ? 0.35 : -0.5;
  const ax = s.x + fy * r * 0.9;
  const ay = ty + r * 0.1 - fx * r * 0.4;
  const a = s.facing + lift * 0.6;
  const ex = ax + Math.cos(a) * r * 1.3;
  const ey = ay + Math.sin(a) * r * 1.3 - (s.pose === 'windup' ? r * 0.7 : 0);
  limb(ctx, ax, ay, ex, ey, 9, fc(s, '#3a3438'));
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(a + Math.PI / 2);
  poly(ctx, [-r * 0.45, -r * 0.22, r * 0.45, -r * 0.22, r * 0.45, r * 0.22, -r * 0.45, r * 0.22], fc(s, '#7a7680'));
  ctx.fillStyle = withAlpha(EMBER, 0.8);
  ctx.fillRect(-r * 0.45, -r * 0.05, r * 0.9, 3);
  ctx.restore();
  // off arm block
  blob(ctx, s.x - fy * r * 0.95, ty + r * 0.45 + fx * r * 0.3, r * 0.3, r * 0.34, { fill: fc(s, '#3a3438') });
});

registerDraw('forge_slag', (ctx, s) => {
  const r = s.r * s.scale;
  const wob = Math.sin(s.t * 6 + s.variant * 2.1);
  shadow(ctx, s.x, s.y, r, 0.25);
  glow(ctx, s.x, s.y, r * 2.4, EMBER, 0.35);
  // lumpy crust
  const sq = 1 - s.squash * 0.2;
  blob(ctx, s.x - r * 0.45, s.y + r * 0.1, r * 0.6, r * 0.48 * sq, { fill: fc(s, '#3a2420') });
  blob(ctx, s.x + r * 0.5, s.y + r * 0.15, r * 0.55, r * 0.45 * sq, { fill: fc(s, '#3a2420') });
  blob(ctx, s.x, s.y - wob * 1.5, r * 0.85, r * 0.7 * sq * (1 + wob * 0.05), { fill: fc(s, '#4a2c22') });
  // molten top and cracks
  ctx.fillStyle = s.flash ? '#ffffff' : s.pose === 'windup' ? GOLD : EMBER;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - r * 0.25 - wob * 1.5, r * 0.45, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = EMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.6, s.y + r * 0.2);
  ctx.lineTo(s.x - r * 0.2, s.y + r * 0.05);
  ctx.lineTo(s.x + r * 0.15, s.y + r * 0.3);
  ctx.stroke();
  eyes(ctx, s.x + Math.cos(s.facing) * 2, s.y - r * 0.05, s.facing, r * 0.25, 1.4, GOLD, 1.5);
});

registerDraw('forge_bellows', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.05, 0.38);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.5, 3);
  const breath = 0.5 + Math.sin(s.t * (s.pose === 'windup' ? 9 : 2.5)) * 0.5;
  // the bellows strapped to his back (opposite the facing): pleated, pumping
  const bx = s.x - fx * r * 0.75;
  const by = s.y - r * 0.55 - fy * r * 0.3 + b;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(s.facing + Math.PI / 2);
  const bw = r * (0.55 + breath * 0.25);
  poly(ctx, [-bw, -r * 0.35, bw, -r * 0.35, r * 0.18, r * 0.7, -r * 0.18, r * 0.7], fc(s, '#6a4228'));
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 3; i++) {
    const k = i / 4;
    ctx.beginPath();
    ctx.moveTo(-bw + (bw - r * 0.18) * k, -r * 0.35 + r * 1.05 * k);
    ctx.lineTo(bw - (bw - r * 0.18) * k, -r * 0.35 + r * 1.05 * k);
    ctx.stroke();
  }
  ctx.restore();
  // fat body and leather apron
  blob(ctx, s.x, s.y + b, r * 0.95, r * 0.85 * (1 - s.squash * 0.1), { fill: fc(s, '#a8705a') });
  ctx.fillStyle = fc(s, '#4a2a1a');
  ctx.beginPath();
  ctx.ellipse(s.x + fx * 4, s.y + r * 0.2 + b, r * 0.6, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  // nozzle arm (the sweep) and the grab hand
  const reach = s.pose === 'attack' ? 1.5 : s.pose === 'windup' ? 0.7 : 1;
  const nx = s.x + fy * r * 0.8;
  const ny = s.y - fx * r * 0.8 + b;
  const nex = nx + fx * r * 0.9 * reach;
  const ney = ny + fy * r * 0.9 * reach;
  limb(ctx, nx, ny, nex, ney, 8, fc(s, '#a8705a'));
  ctx.save();
  ctx.translate(nex, ney);
  ctx.rotate(s.facing);
  poly(ctx, [0, -5, 14, -3, 16, 0, 14, 3, 0, 5], fc(s, '#8a8f98'));
  ctx.restore();
  if (s.pose === 'windup' || s.pose === 'attack') glow(ctx, nex + fx * 14, ney + fy * 14, 16, EMBER, 0.8);
  const gx = s.x - fy * r * 0.8;
  const gy = s.y + fx * r * 0.8 + b;
  limb(ctx, gx, gy, gx + fx * r * 0.8 * reach, gy + fy * r * 0.8 * reach, 8, fc(s, '#a8705a'));
  blob(ctx, gx + fx * r * 0.85 * reach, gy + fy * r * 0.85 * reach, r * 0.22, r * 0.22, { fill: fc(s, '#c08068'), outlineW: 2 });
  // small head with soot mask
  const hy = s.y - r * 0.75 + b;
  blob(ctx, s.x + fx * 3, hy, r * 0.38, r * 0.34, { fill: fc(s, '#b07a62') });
  ctx.fillStyle = withAlpha(SOOT, 0.75);
  ctx.fillRect(s.x - r * 0.35 + fx * 3, hy - 2, r * 0.7, 5);
  eyes(ctx, s.x + fx * 4, hy, s.facing, r * 0.14, 1.8, GOLD, 1.5);
});

registerDraw('forge_ash_wraith', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const y = s.y - 8 + Math.sin(s.t * 3) * 3;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 10, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // ragged ash tail trailing behind the facing
  const tx = s.x - fx * r * 2.1;
  const ty = y - fy * r * 2.1 + r * 0.6;
  const wv = Math.sin(s.t * 7) * r * 0.3;
  ctx.beginPath();
  ctx.moveTo(s.x - fy * r * 0.75, y + fx * r * 0.75);
  ctx.quadraticCurveTo(s.x - fx * r * 1.2 - fy * (r * 0.5 + wv), y - fy * r * 1.2 + fx * (r * 0.5 + wv), tx, ty);
  ctx.lineTo(s.x - fx * r * 1.4 - fy * wv * 0.5, y - fy * r * 1.4 + fx * wv * 0.5 + r * 0.2);
  ctx.quadraticCurveTo(s.x - fx * r * 1.0 + fy * (r * 0.4 - wv), y - fy * r * 1.0 - fx * (r * 0.4 - wv), s.x + fy * r * 0.75, y - fx * r * 0.75);
  ctx.closePath();
  ctx.fillStyle = fc(s, '#3a3434');
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // hunched hood
  blob(ctx, s.x, y, r * 0.85, r * 0.8 * (1 - s.squash * 0.1), { fill: fc(s, '#4a4242') });
  // claws reaching forward
  const reach = s.pose === 'attack' ? 1.5 : s.pose === 'windup' ? 0.5 : 1;
  for (const side of [-1, 1]) {
    const ax = s.x - fy * r * 0.6 * side;
    const ay = y + fx * r * 0.6 * side;
    const ex = ax + fx * r * reach;
    const ey = ay + fy * r * reach;
    limb(ctx, ax, ay, ex, ey, 3, fc(s, '#2a2424'));
    glow(ctx, ex, ey, 7, EMBER, 0.6);
  }
  // hollow face with ember eyes
  blob(ctx, s.x + fx * r * 0.25, y - r * 0.15 + fy * r * 0.2, r * 0.45, r * 0.38, { fill: '#0e0a0a', outlineW: 2 });
  eyes(ctx, s.x + fx * r * 0.35, y - r * 0.15 + fy * r * 0.25, s.facing, r * 0.17, 2.2, s.flash ? '#ffffff' : EMBER, 1.2);
  glow(ctx, s.x + fx * r * 0.35, y - r * 0.15 + fy * r * 0.25, 12, EMBER, 0.5);
  // drifting embers
  for (let i = 0; i < 4; i++) {
    const k = (s.t * 0.7 + i * 0.25) % 1;
    glow(ctx, s.x + Math.sin(i * 2.3 + s.t) * r * 0.9, y - k * r * 2.2, 4, k < 0.5 ? GOLD : EMBER, 1 - k);
  }
});

registerDraw('forge_priest', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const chant = s.pose === 'windup';
  const b = Math.sin(s.t * 2) * 1;
  // furnace halo behind him, roaring while chanting
  glow(ctx, s.x, s.y - r * 1.0, r * (chant ? 3.4 : 2.2), EMBER, chant ? 0.75 : 0.4);
  // robe: tall, gold-trimmed
  poly(ctx, [s.x - r * 0.45, s.y - r * 0.7 + b, s.x + r * 0.45, s.y - r * 0.7 + b, s.x + r * 0.9, s.y + r * 0.85, s.x - r * 0.9, s.y + r * 0.85], fc(s, CRIMSON));
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(s.x - r * 0.08, s.y - r * 0.65 + b, r * 0.16, r * 1.5);
  ctx.fillRect(s.x - r * 0.88, s.y + r * 0.68, r * 1.76, 3);
  // arms raised to the furnace while chanting; otherwise swinging a censer
  for (const side of [-1, 1]) {
    const ax = s.x + side * r * 0.45;
    const ay = s.y - r * 0.45 + b;
    const ex = ax + side * r * (chant ? 0.45 : 0.35);
    const ey = ay + (chant ? -r * 0.9 : r * 0.5);
    limb(ctx, ax, ay, ex, ey, 4, fc(s, shade(CRIMSON, 0.8)));
    if (chant) flame(ctx, ex, ey - 2, 10, s.t + side, EMBER, GOLD);
  }
  if (!chant) {
    const sw = Math.sin(s.t * 3) * 0.6;
    const cx = s.x + r * 0.8 + Math.sin(sw) * r * 0.6;
    const cy = s.y + r * 0.05 + Math.cos(sw) * r * 0.6 + b;
    ctx.strokeStyle = '#8a8f98';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x + r * 0.8, s.y + b);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    glow(ctx, cx, cy, 10, EMBER, 0.6);
    blob(ctx, cx, cy, 4, 4, { fill: fc(s, '#b08d3c'), outlineW: 2 });
  }
  // face and tall mitre
  const hy = s.y - r * 0.9 + b;
  blob(ctx, s.x + fx * 2, hy, r * 0.36, r * 0.34, { fill: fc(s, '#c8906a') });
  eyes(ctx, s.x + fx * 3, hy, s.facing, r * 0.14, 1.6, chant ? GOLD : OUTLINE, 1.2);
  poly(ctx, [s.x - r * 0.36, hy - r * 0.2, s.x - r * 0.3, hy - r * 1.0, s.x, hy - r * 1.35, s.x + r * 0.3, hy - r * 1.0, s.x + r * 0.36, hy - r * 0.2], fc(s, CRIMSON));
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(s.x - r * 0.05, hy - r * 1.15, r * 0.1, r * 0.8);
  ctx.fillRect(s.x - r * 0.25, hy - r * 0.75, r * 0.5, r * 0.1);
  spec(ctx, s.x - r * 0.15, hy - r * 0.6, 1.5, 0.6);
});
