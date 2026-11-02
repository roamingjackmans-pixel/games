// Boss 6 draw functions: Saint Aurelia the Unthawed (Frozen Reliquary) and her ice mirrors (ART_AUDIO §2:
// chunky vector shapes, 3 px outlines). Phase 1 she fights from inside a block of ice that cracks as her HP
// falls toward 50%; phase 2 the block is gone and frost wings open behind her.
import { OUTLINE, blob, eyes, glow, limb, poly, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const ICE = '#9ad0ff';
const FROST = '#f4f8ff';
const GOLD = '#d4af37';
const STEEL = '#b8cce0';

function lift(s: DrawState): number {
  if (s.pose === 'windup') return 1;
  if (s.pose === 'attack') return -0.6;
  return 0;
}

/** Crack lines across the ice block: (angle from the centre, length as a fraction of the block). */
const CRACKS: [number, number][] = [
  [0.4, 0.95],
  [2.5, 0.85],
  [4.2, 1.0],
  [1.4, 0.7],
  [5.4, 0.9],
  [3.3, 0.8],
  [0.9, 0.65],
  [4.9, 0.75],
];

function crack(ctx: CanvasRenderingContext2D, cx: number, cy: number, a: number, len: number): void {
  // from the rim inward, zig-zagging
  const sx = cx + Math.cos(a) * len;
  const sy = cy + Math.sin(a) * len * 1.15;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  let x = sx;
  let y = sy;
  for (let i = 1; i <= 4; i++) {
    const k = i / 4;
    const zig = (i % 2 === 0 ? 1 : -1) * len * 0.12;
    x = sx + (cx - sx) * k * 0.75 - Math.sin(a) * zig;
    y = sy + (cy - sy) * k * 0.75 + Math.cos(a) * zig;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  // a short branch
  ctx.beginPath();
  ctx.moveTo((sx + x) / 2, (sy + y) / 2);
  ctx.lineTo((sx + x) / 2 + Math.cos(a + 0.9) * len * 0.22, (sy + y) / 2 + Math.sin(a + 0.9) * len * 0.22);
  ctx.stroke();
}

/** One frost wing: a fan of angular ice feathers behind the shoulder (side ±1). */
function wing(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, r: number, flap: number, s: DrawState): void {
  const feathers = 5;
  for (let i = feathers - 1; i >= 0; i--) {
    const a = -Math.PI / 2 + side * (0.55 + i * 0.32 + flap * 0.25);
    const len = r * (1.9 - i * 0.18);
    const w = r * 0.2;
    const px = -Math.sin(a) * w;
    const py = Math.cos(a) * w;
    const tipX = x + Math.cos(a) * len;
    const tipY = y + Math.sin(a) * len;
    poly(ctx, [x + px, y + py, tipX + px * 0.4, tipY + py * 0.4, tipX + Math.cos(a) * r * 0.25, tipY + Math.sin(a) * r * 0.25, tipX - px * 0.4, tipY - py * 0.4, x - px, y - py], fc(s, i % 2 === 0 ? '#cfeaff' : '#a8d8f8'), OUTLINE, 2);
  }
}

registerDraw('boss_aurelia', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const px = -fy;
  const py = fx;
  const p2 = s.phase >= 1;
  const L = lift(s);
  const hover = p2 ? Math.sin(s.t * 2.4) * 4 - 4 : 0;
  shadow(ctx, s.x, s.y, r * (p2 ? 0.9 : 1.05), p2 ? 0.25 : 0.35);
  const cx = s.x;
  const cy = s.y + hover;
  // phase 2: the frost wings and a cold glow
  if (p2) {
    glow(ctx, cx, cy - r * 0.3, r * 2.6, ICE, 0.4 + Math.sin(s.t * 3) * 0.08);
    const flap = Math.sin(s.t * 3.2) * (s.pose === 'windup' ? 1.4 : 0.7);
    wing(ctx, cx - r * 0.35, cy - r * 0.35, -1, r, flap, s);
    wing(ctx, cx + r * 0.35, cy - r * 0.35, 1, r, flap, s);
  } else glow(ctx, cx, cy - r * 0.2, r * 1.9, ICE, 0.25);
  // the knight: plate, a white tabard with a gold sunburst
  blob(ctx, cx, cy, r * 0.8, r * 0.78 * (1 - s.squash * 0.06), { fill: fc(s, STEEL), under: '#8aa6c4' });
  poly(ctx, [cx - r * 0.3, cy - r * 0.42, cx + r * 0.3, cy - r * 0.42, cx + r * 0.38, cy + r * 0.62, cx - r * 0.38, cy + r * 0.62], fc(s, FROST), OUTLINE, 2);
  ctx.save();
  ctx.strokeStyle = fc(s, GOLD);
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.08, cy + Math.sin(a) * r * 0.08);
    ctx.lineTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
  spec(ctx, cx - r * 0.45, cy - r * 0.3, 3);
  // pauldrons
  for (const k of [-1, 1]) blob(ctx, cx + px * r * 0.7 * k, cy + py * r * 0.7 * k - r * 0.3, r * 0.3, r * 0.22, { fill: fc(s, '#d6e6f6'), outlineW: 2 });
  // helm with a gold halo above it
  const hx = cx + fx * r * 0.12;
  const hy = cy - r * 0.72;
  blob(ctx, hx, hy, r * 0.4, r * 0.42, { fill: fc(s, '#c8dcf0') });
  ctx.save();
  ctx.translate(hx + fx * r * 0.22, hy + fy * r * 0.14);
  ctx.rotate(s.facing + Math.PI / 2);
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(-r * 0.24, -2.5, r * 0.48, 5);
  ctx.restore();
  eyes(ctx, hx + fx * r * 0.2, hy + fy * r * 0.12, s.facing, r * 0.12, 2.5, p2 ? '#ffffff' : ICE, 1);
  const haloY = hy - r * 0.5 + Math.sin(s.t * 2) * 1.5;
  glow(ctx, hx, haloY, r * 0.7, GOLD, p2 ? 0.7 : 0.45);
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(hx, haloY, r * 0.42, r * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = fc(s, GOLD);
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  // phase 1: the block of ice around her, cracking as her HP falls toward the threshold
  if (!p2) {
    const bw = r * 1.2;
    const bh = r * 1.45;
    const by = cy - r * 0.25;
    const block = [cx - bw * 0.55, by - bh, cx + bw * 0.6, by - bh * 0.92, cx + bw, by - bh * 0.15, cx + bw * 0.8, by + bh * 0.72, cx - bw * 0.2, by + bh * 0.82, cx - bw, by + bh * 0.35, cx - bw * 0.95, by - bh * 0.55];
    ctx.save();
    ctx.globalAlpha *= 0.42;
    poly(ctx, block, s.flash ? '#ffffff' : '#bfe4ff', '#eaf6ff', 0);
    ctx.restore();
    poly(ctx, block, 'rgba(0,0,0,0)', '#eaf6ff', 3);
    // facets
    ctx.save();
    ctx.strokeStyle = withAlpha('#ffffff', 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.55, by - bh);
    ctx.lineTo(cx - bw * 0.25, by - bh * 0.1);
    ctx.lineTo(cx + bw, by - bh * 0.15);
    ctx.moveTo(cx - bw * 0.25, by - bh * 0.1);
    ctx.lineTo(cx - bw * 0.2, by + bh * 0.82);
    ctx.stroke();
    // cracks: none at full HP, all of them by 50%
    const dmg = Math.max(0, Math.min(1, (1 - s.hpFrac) / 0.5));
    const n = Math.round(dmg * CRACKS.length);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) crack(ctx, cx, by, CRACKS[i]![0], bw * CRACKS[i]![1]);
    ctx.restore();
    spec(ctx, cx - bw * 0.6, by - bh * 0.6, 5, 0.9);
    spec(ctx, cx - bw * 0.45, by - bh * 0.35, 2.5, 0.8);
  }
  // the sword arm and blade (cuts out through the ice): raised on windup, swung through on the attack
  const shx = cx + px * r * 0.62;
  const shy = cy + py * r * 0.62 - r * 0.2;
  const sa = s.facing + (s.pose === 'attack' ? 1.0 : s.pose === 'windup' ? -1.3 : -0.45);
  const hx2 = shx + fx * r * 0.45;
  const hy2 = shy + fy * r * 0.45 - L * r * 0.35;
  limb(ctx, shx, shy, hx2, hy2, 10, fc(s, STEEL));
  ctx.save();
  ctx.translate(hx2, hy2);
  ctx.rotate(sa);
  if (s.pose === 'windup') glow(ctx, r * 1.1, 0, r * 0.8, ICE, 0.55);
  poly(ctx, [4, -5, r * 1.9, -4, r * 2.2, 0, r * 1.9, 4, 4, 5], fc(s, '#e6f4ff'));
  ctx.strokeStyle = withAlpha(ICE, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(r * 1.9, 0);
  ctx.stroke();
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(-2, -10, 6, 20);
  limb(ctx, -10, 0, -2, 0, 5, '#4a3a2a');
  ctx.restore();
  // phase 2: shards of the broken block circle her
  if (p2) {
    for (let i = 0; i < 4; i++) {
      const a = s.t * 1.6 + (i * Math.PI) / 2;
      const ox = cx + Math.cos(a) * r * 1.35;
      const oy = cy - r * 0.2 + Math.sin(a) * r * 0.75;
      const k = r * 0.16;
      poly(ctx, [ox, oy - k * 1.6, ox + k, oy, ox, oy + k * 1.6, ox - k, oy], fc(s, i % 2 ? FROST : ICE), OUTLINE, 2);
    }
  }
});

// ---------------------------------------------------------------- the ice mirrors (1 HP, reflect projectiles)
registerDraw('aurelia_mirror', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.8, 0.3);
  glow(ctx, s.x, s.y - r * 0.6, r * 2, ICE, 0.35 + Math.sin(s.t * 4 + s.variant) * 0.1);
  // a frosty base
  poly(ctx, [s.x - r * 0.8, s.y + r * 0.55, s.x - r * 0.45, s.y + r * 0.15, s.x + r * 0.45, s.y + r * 0.15, s.x + r * 0.8, s.y + r * 0.55], fc(s, '#a8d8f8'), OUTLINE, 2);
  // the tall oval mirror in a frame of ice
  const my = s.y - r * 0.75;
  blob(ctx, s.x, my, r * 0.72, r * 1.05, { fill: fc(s, '#7fbde8'), under: '#6aa6d6', outlineW: 3 });
  blob(ctx, s.x, my, r * 0.52, r * 0.82, { fill: fc(s, '#e8f6ff'), under: '#c8e6fa', outlineW: 2 });
  // the shine sweeps across
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(s.x, my, r * 0.52, r * 0.82, 0, 0, Math.PI * 2);
  ctx.clip();
  const k = ((s.t * 0.6 + s.variant * 0.3) % 1) * 2 - 0.5;
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  ctx.beginPath();
  ctx.moveTo(s.x - r + k * r * 2, my - r);
  ctx.lineTo(s.x - r * 0.6 + k * r * 2, my - r);
  ctx.lineTo(s.x - r * 1.2 + k * r * 2, my + r);
  ctx.lineTo(s.x - r * 1.6 + k * r * 2, my + r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // icicle spikes on the frame
  for (const a of [-2.4, -1.57, -0.7]) {
    const bx = s.x + Math.cos(a) * r * 0.7;
    const by = my + Math.sin(a) * r * 1.0;
    poly(ctx, [bx - 3, by + 2, bx + Math.cos(a) * r * 0.45, by + Math.sin(a) * r * 0.45, bx + 3, by + 2], fc(s, FROST), OUTLINE, 2);
  }
  spec(ctx, s.x - r * 0.25, my - r * 0.45, 2.5);
});
