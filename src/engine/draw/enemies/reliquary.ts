// Frozen Reliquary roster draw functions (ice blue, frost white, reliquary gold, deep blue).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const ICE = '#9ad0ff';
const FROST = '#f4f8ff';
const GOLD = '#d4af37';
const DEEP = '#3a5a8a';
const STEEL = '#8aa6c4';

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** A sharp ice shard from (x, y) pointing along angle a. */
function shard(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, w: number, fill: string): void {
  const px = -Math.sin(a) * w;
  const py = Math.cos(a) * w;
  poly(ctx, [x + px, y + py, x + Math.cos(a) * len, y + Math.sin(a) * len, x - px, y - py], fill, OUTLINE, 2);
}

registerDraw('reliquary_frost_knight', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 5);
  const lean = s.pose === 'windup' ? -3 : s.pose === 'attack' ? 5 : 0;
  const cx = s.x + fx * lean;
  const cy = s.y + fy * lean + b;
  // sword: drawn back on windup, thrust along the facing on release
  const swing = s.pose === 'attack' ? 0.1 : s.pose === 'windup' ? -1.4 : 0.5;
  const ext = s.pose === 'attack' ? 12 : 0;
  ctx.save();
  ctx.translate(cx + fy * r * 0.7 + fx * ext, cy - fx * r * 0.7 + fy * ext);
  ctx.rotate(s.facing + swing);
  limb(ctx, 0, 0, 6, 0, 4, '#2a3a50');
  poly(ctx, [6, -3, 44, -2.5, 54, 0, 44, 2.5, 6, 3], fc(s, '#d6ecff'));
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(3, -7, 4, 14);
  ctx.restore();
  // plate body with a white tabard and gold cross
  blob(ctx, cx, cy, r * 0.9, r * 0.85 * (1 - s.squash * 0.08), { fill: fc(s, STEEL) });
  ctx.fillStyle = fc(s, FROST);
  ctx.fillRect(cx - r * 0.28, cy - r * 0.35, r * 0.56, r * 0.95);
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(cx - r * 0.06, cy - r * 0.25, r * 0.12, r * 0.6);
  ctx.fillRect(cx - r * 0.2, cy - r * 0.05, r * 0.4, r * 0.11);
  spec(ctx, cx - r * 0.45, cy - r * 0.3, 2.5);
  // helm with a crest of icicles
  const hx = cx + fx * 2;
  const hy = cy - r * 0.78;
  shard(ctx, hx, hy - r * 0.3, -Math.PI / 2, r * 0.75, r * 0.13, fc(s, ICE));
  shard(ctx, hx - r * 0.3, hy - r * 0.25, -Math.PI / 2 - 0.5, r * 0.5, r * 0.1, fc(s, ICE));
  shard(ctx, hx + r * 0.3, hy - r * 0.25, -Math.PI / 2 + 0.5, r * 0.5, r * 0.1, fc(s, ICE));
  blob(ctx, hx, hy, r * 0.52, r * 0.55, { fill: fc(s, '#b4cce4') });
  ctx.save();
  ctx.translate(hx + fx * r * 0.28, hy + fy * r * 0.18);
  ctx.rotate(s.facing + Math.PI / 2);
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(-r * 0.32, -2, r * 0.64, 4);
  ctx.restore();
  glow(ctx, hx + fx * r * 0.32, hy + fy * r * 0.15, 8, ICE, 0.6);
  // kite shield toward the facing (the guarded front)
  ctx.save();
  ctx.translate(cx + fx * r * 0.95 - fy * r * 0.25, cy + fy * r * 0.95 + fx * r * 0.25);
  ctx.rotate(s.facing);
  poly(ctx, [-4, -r * 0.75, 6, -r * 0.65, 11, 0, 6, r * 0.65, -4, r * 0.75], fc(s, DEEP));
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(0, -r * 0.45, 4, r * 0.9);
  ctx.fillRect(-2, -3, 9, 6);
  ctx.restore();
});

registerDraw('reliquary_wraith', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 12 + Math.sin(s.t * 2.4) * 4;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 10, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x, y, r * 3.2, ICE, 0.4);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const reach = s.pose === 'windup' ? 1.45 : s.pose === 'attack' ? 1.2 : 0.85 + Math.sin(s.t * 3) * 0.1;
  // wispy arms, spread wide while casting
  for (const side of [-1, 1]) {
    const ax = s.x - fy * r * 0.6 * side;
    const ay = y - r * 0.2 + fx * r * 0.6 * side;
    const ex = ax + fx * r * 0.6 - fy * r * 0.7 * side * reach;
    const ey = ay + fy * r * 0.6 - r * 0.35 * reach + fx * r * 0.7 * side * reach;
    limb(ctx, ax, ay, ex, ey, 3, fc(s, '#cfe4f8'));
    glow(ctx, ex, ey, 7, ICE, 0.6);
  }
  // shroud: round hood, tattered hem that flutters
  const w0 = Math.sin(s.t * 6) * 3;
  const w1 = Math.sin(s.t * 6 + 2) * 3;
  const w2 = Math.sin(s.t * 6 + 4) * 3;
  ctx.save();
  ctx.globalAlpha *= 0.9;
  ctx.beginPath();
  ctx.moveTo(s.x + r * 0.9, y + r * 0.1);
  ctx.quadraticCurveTo(s.x + r * 1.0, y - r * 1.5, s.x, y - r * 1.6);
  ctx.quadraticCurveTo(s.x - r * 1.0, y - r * 1.5, s.x - r * 0.9, y + r * 0.1);
  ctx.lineTo(s.x - r * 0.65, y + r * 1.25 + w0);
  ctx.lineTo(s.x - r * 0.32, y + r * 0.75);
  ctx.lineTo(s.x, y + r * 1.4 + w1);
  ctx.lineTo(s.x + r * 0.32, y + r * 0.75);
  ctx.lineTo(s.x + r * 0.65, y + r * 1.25 + w2);
  ctx.closePath();
  ctx.fillStyle = fc(s, '#dcebfa');
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  // hood opening and eyes
  blob(ctx, s.x + fx * r * 0.2, y - r * 0.65 + fy * r * 0.1, r * 0.5, r * 0.45, { fill: '#0e1a2a', outlineW: 0 });
  eyes(ctx, s.x + fx * r * 0.25, y - r * 0.68, s.facing, r * 0.2, 2.2, s.flash ? '#ffffff' : '#bff0ff', 1.5);
  // little gold reliquary crown
  for (let i = -1; i <= 1; i++) shard(ctx, s.x + i * r * 0.28, y - r * 1.45, -Math.PI / 2 + i * 0.35, r * 0.4, r * 0.08, fc(s, GOLD));
});

registerDraw('reliquary_icicle_lurker', (ctx, s) => {
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  // Drop: during its (blue) windup it still hangs from the ceiling over a growing shadow, then falls in the leap
  const dropping = s.tint === 'blue' && s.pose === 'windup';
  const leaping = s.pose === 'attack' && s.scale > 1.001;
  const r = s.r;
  if (dropping) {
    const k = Math.min(1, s.poseT);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.3 + k * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + r * 0.4, r * (0.8 + k * 0.6), r * (0.45 + k * 0.3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const hy = s.y - 130 + k * 25 + Math.sin(s.t * 30) * k * 1.5;
    // hanging upside down: a cluster of icicles pointing at the floor
    for (let i = -2; i <= 2; i++) shard(ctx, s.x + i * r * 0.32, hy + r * 0.2, Math.PI / 2 + i * 0.12, r * (1.3 - Math.abs(i) * 0.25), r * 0.16, fc(s, ICE));
    blob(ctx, s.x, hy, r * 0.8, r * 0.55, { fill: fc(s, '#c4e2f8') });
    eyes(ctx, s.x, hy + r * 0.15, Math.PI / 2, r * 0.25, 2, '#2a6aa0', 1);
    if (k > 0.3) for (let i = 0; i < 3; i++) spec(ctx, s.x + Math.sin(s.t * 7 + i * 2) * r * 0.6, hy + r * 1.2 + ((s.t * 140 + i * 40) % 90), 1.6, 0.7);
    return;
  }
  const lift = leaping ? Math.max(0, 1 - s.poseT / 0.25) * 100 : 0;
  shadow(ctx, s.x, s.y, r * (lift > 0 ? 1.2 : 1));
  const y = s.y - lift;
  const b = lift > 0 ? 0 : bob(s, 1.5, 9);
  const flare = s.tint === 'red' ? 1.35 + Math.sin(s.t * 40) * 0.05 : s.pose === 'attack' ? 1.25 : 1;
  // spikes radiating from its back (they flare for Shatter)
  for (let i = -2; i <= 2; i++) {
    const a = s.facing + Math.PI + i * 0.55;
    shard(ctx, s.x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4 + b, a, r * (1.25 - Math.abs(i) * 0.15) * flare, r * 0.18, fc(s, i % 2 === 0 ? ICE : FROST));
  }
  // spindly legs
  for (const side of [-1, 1])
    for (const k of [-0.4, 0.3]) {
      const lx = s.x + fx * r * k - fy * r * 0.5 * side;
      const ly = y + fy * r * k + fx * r * 0.5 * side + b;
      const step = Math.sin(s.t * 16 + k * 5 + side) * 3 * s.moving;
      limb(ctx, lx, ly, lx - fy * r * 0.55 * side + fx * step, ly + fx * r * 0.55 * side + fy * step + 4, 2.5, fc(s, '#6a8aaa'));
    }
  blob(ctx, s.x, y + b, r * 0.85, r * 0.7 * (1 - s.squash * 0.15), { fill: fc(s, '#b8d8f0') }, s.facing);
  // long claws reaching forward
  const reach = s.pose === 'attack' ? 1.5 : s.pose === 'windup' ? 0.7 : 1;
  for (const side of [-1, 1]) {
    const ax = s.x + fx * r * 0.4 - fy * r * 0.45 * side;
    const ay = y + fy * r * 0.4 + fx * r * 0.45 * side + b;
    const ex = ax + fx * r * 0.9 * reach;
    const ey = ay + fy * r * 0.9 * reach;
    limb(ctx, ax, ay, ex, ey, 3, fc(s, '#8ab0d0'));
    shard(ctx, ex, ey, s.facing + side * 0.25, r * 0.6, r * 0.1, fc(s, FROST));
  }
  blob(ctx, s.x + fx * r * 0.55, y + fy * r * 0.55 - r * 0.2 + b, r * 0.42, r * 0.36, { fill: fc(s, '#d4ecff') });
  eyes(ctx, s.x + fx * r * 0.7, y + fy * r * 0.6 - r * 0.25 + b, s.facing, r * 0.17, 1.8, '#1a5a9a', 1.5);
});

registerDraw('reliquary_frozen_hound', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const crouch = s.pose === 'windup' ? 0.8 : 1;
  const stretch = s.pose === 'attack' ? 1.25 : 1;
  const run = Math.sin(s.t * 16) * 4 * s.moving;
  // legs: four, gait alternating
  for (const k of [-0.55, 0.5])
    for (const side of [-1, 1]) {
      const lx = s.x + fx * r * k - fy * r * 0.4 * side;
      const ly = s.y + fy * r * k + fx * r * 0.4 * side;
      const ph = run * (k > 0 ? side : -side);
      limb(ctx, lx, ly, lx + fx * ph - fy * r * 0.2 * side, ly + fy * ph + fx * r * 0.2 * side + 6, 4, fc(s, '#5a7a9a'));
    }
  // tail
  limb(ctx, s.x - fx * r * 0.9, s.y - fy * r * 0.9, s.x - fx * r * 1.5 + Math.sin(s.t * 9) * 3, s.y - fy * r * 1.5 - 4, 3.5, fc(s, '#a8c4dc'));
  blob(ctx, s.x, s.y, r * 1.1 * stretch, r * 0.62 * crouch, { fill: fc(s, '#8eaecb') }, s.facing);
  // ice ridge along the spine
  for (let i = -1; i <= 1; i++) {
    const px = s.x + fx * r * i * 0.45;
    const py = s.y + fy * r * i * 0.45 - r * 0.3;
    shard(ctx, px, py, s.facing + Math.PI - 0.9, r * 0.6, r * 0.13, fc(s, ICE));
  }
  // head, snout, ears
  const hx = s.x + fx * r * 1.0 * stretch;
  const hy = s.y + fy * r * 1.0 * stretch - r * 0.2;
  shard(ctx, hx - fy * r * 0.25, hy + fx * r * 0.25, s.facing + Math.PI - 0.6, r * 0.45, r * 0.12, fc(s, '#a8c4dc'));
  shard(ctx, hx + fy * r * 0.25, hy - fx * r * 0.25, s.facing + Math.PI + 0.6, r * 0.45, r * 0.12, fc(s, '#a8c4dc'));
  blob(ctx, hx, hy, r * 0.48, r * 0.42, { fill: fc(s, '#a8c4dc') });
  blob(ctx, hx + fx * r * 0.38, hy + fy * r * 0.38 + 2, r * 0.26, r * 0.2, { fill: fc(s, '#c8dcf0'), outlineW: 2 });
  eyes(ctx, hx + fx * 3, hy - 1, s.facing, r * 0.2, 1.8, s.flash ? '#ffffff' : '#5fd0ff', 1.5);
  if (s.pose === 'attack') {
    ctx.fillStyle = FROST;
    ctx.fillRect(hx + fx * r * 0.55 - 3, hy + fy * r * 0.55 + 2, 6, 2);
  }
  glow(ctx, hx + fx * r * 0.5, hy + fy * r * 0.5, 10, ICE, 0.3);
});

registerDraw('reliquary_choir_acolyte', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const fx = Math.cos(s.facing);
  const singing = s.pose === 'windup' || s.pose === 'attack';
  const sway = Math.sin(s.t * 1.6) * 1.5;
  // floating notes
  for (let i = 0; i < 3; i++) {
    const k = (s.t * 0.5 + i / 3) % 1;
    glow(ctx, s.x + Math.sin(s.t * 2 + i * 2.1) * r * 0.9, s.y - r * 1.6 - k * 40, 7, GOLD, (1 - k) * (singing ? 0.9 : 0.45));
  }
  // long white robe with a gold hem
  const x = s.x + sway;
  poly(ctx, [x - r * 0.42, s.y - r * 0.75, x - r * 0.95, s.y + r * 0.85, x + r * 0.95, s.y + r * 0.85, x + r * 0.42, s.y - r * 0.75], fc(s, '#e4ecf8'));
  ctx.fillStyle = fc(s, shade('#e4ecf8', 0.8));
  ctx.fillRect(x - r * 0.88, s.y + r * 0.35, r * 1.76, r * 0.42);
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(x - r * 0.9, s.y + r * 0.62, r * 1.8, r * 0.14);
  ctx.fillRect(x - r * 0.06, s.y - r * 0.6, r * 0.12, r * 1.2);
  // hymnal held in front
  ctx.save();
  ctx.translate(x + fx * r * 0.2, s.y - r * 0.05);
  poly(ctx, [-r * 0.42, -r * 0.18, r * 0.42, -r * 0.18, r * 0.42, r * 0.22, -r * 0.42, r * 0.22], fc(s, DEEP), OUTLINE, 2);
  ctx.fillStyle = fc(s, FROST);
  ctx.fillRect(-r * 0.36, -r * 0.12, r * 0.33, r * 0.28);
  ctx.fillRect(r * 0.03, -r * 0.12, r * 0.33, r * 0.28);
  ctx.restore();
  // head and tall choir hood
  const hy = s.y - r * 0.95;
  poly(ctx, [x - r * 0.42, hy + r * 0.05, x, hy - r * 1.15, x + r * 0.42, hy + r * 0.05], fc(s, '#cfdcf0'));
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(x - r * 0.3, hy - r * 0.2, r * 0.6, r * 0.1);
  blob(ctx, x, hy + r * 0.1, r * 0.4, r * 0.4, { fill: fc(s, '#c8d2de') });
  // closed eyes and an open, singing mouth
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.24, hy + r * 0.02);
  ctx.lineTo(x - r * 0.08, hy + r * 0.04);
  ctx.moveTo(x + r * 0.08, hy + r * 0.04);
  ctx.lineTo(x + r * 0.24, hy + r * 0.02);
  ctx.stroke();
  const m = singing ? 0.16 + Math.sin(s.t * 18) * 0.03 : 0.08;
  ctx.fillStyle = '#1a1420';
  ctx.beginPath();
  ctx.ellipse(x, hy + r * 0.24, r * 0.1, r * m, 0, 0, Math.PI * 2);
  ctx.fill();
  if (singing) glow(ctx, x, hy + r * 0.3, r * 1.3, ICE, 0.35);
});

registerDraw('reliquary_glacial_golem', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.05);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 2.5);
  const y = s.y + b;
  // fists: raised high on windup, slammed forward on release
  const raise = s.pose === 'windup' ? 1 : 0;
  const slam = s.pose === 'attack' ? 1 : 0;
  for (const side of [-1, 1]) {
    const sx = s.x - fy * r * 0.85 * side;
    const sy = y + fx * r * 0.85 * side - r * 0.2;
    const hx = sx + fx * r * (0.45 + slam * 0.75) - fy * r * 0.15 * side;
    const hy = sy + fy * r * (0.45 + slam * 0.75) + fx * r * 0.15 * side - raise * r * 0.9 + slam * r * 0.25;
    limb(ctx, sx, sy, hx, hy, 9, fc(s, '#7e9ebe'));
    blob(ctx, hx, hy, r * 0.42, r * 0.38, { fill: fc(s, '#a6c2dc') });
    spec(ctx, hx - r * 0.12, hy - r * 0.12, 2);
  }
  // craggy ice body
  const k = 1 - s.squash * 0.08;
  poly(
    ctx,
    [s.x - r * 0.95, y + r * 0.1, s.x - r * 0.7, y - r * 0.75 * k, s.x - r * 0.15, y - r * 0.98 * k, s.x + r * 0.55, y - r * 0.85 * k, s.x + r * 0.98, y - r * 0.15, s.x + r * 0.8, y + r * 0.7, s.x - r * 0.1, y + r * 0.9, s.x - r * 0.75, y + r * 0.65],
    fc(s, '#9ab8d4'),
  );
  // lighter facets
  poly(ctx, [s.x - r * 0.6, y - r * 0.6 * k, s.x - r * 0.1, y - r * 0.82 * k, s.x + r * 0.1, y - r * 0.2, s.x - r * 0.5, y - r * 0.05], fc(s, '#c8def0'), OUTLINE, 0);
  ctx.fillStyle = fc(s, shade('#9ab8d4', 0.72));
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.75, y + r * 0.65);
  ctx.lineTo(s.x - r * 0.1, y + r * 0.9);
  ctx.lineTo(s.x + r * 0.8, y + r * 0.7);
  ctx.lineTo(s.x + r * 0.6, y + r * 0.35);
  ctx.lineTo(s.x - r * 0.6, y + r * 0.35);
  ctx.closePath();
  ctx.fill();
  // crystals jutting from its shoulders
  shard(ctx, s.x - r * 0.55, y - r * 0.7 * k, -Math.PI / 2 - 0.5, r * 0.75, r * 0.16, fc(s, ICE));
  shard(ctx, s.x + r * 0.35, y - r * 0.85 * k, -Math.PI / 2 + 0.3, r * 0.9, r * 0.18, fc(s, ICE));
  shard(ctx, s.x + r * 0.8, y - r * 0.4, -0.5, r * 0.55, r * 0.13, fc(s, FROST));
  spec(ctx, s.x - r * 0.35, y - r * 0.55, 3);
  // small sunken head with cold eyes
  const hx = s.x + fx * r * 0.35;
  const hy = y - r * 0.35 + fy * r * 0.2;
  blob(ctx, hx, hy, r * 0.32, r * 0.26, { fill: fc(s, '#6a8aa8'), outlineW: 2 });
  eyes(ctx, hx + fx * 2, hy, s.facing, r * 0.13, 2.4, s.flash ? '#ffffff' : '#dff6ff', 1.5);
  glow(ctx, hx, hy, r * 0.6, ICE, 0.4);
});

registerDraw('reliquary_hoarfrost_archer', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.85);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 7);
  // quiver of ice arrows on the back
  const qx = s.x - fx * r * 0.55;
  const qy = s.y - fy * r * 0.55 - r * 0.3 + b;
  for (let i = -1; i <= 1; i++) shard(ctx, qx + i * 3, qy, -Math.PI / 2 + i * 0.2, r * 0.8, 2.5, fc(s, ICE));
  // white fur cloak with a deep blue lining
  const k = 1 - s.squash * 0.06;
  poly(ctx, [s.x, s.y - r * 0.9 + b, s.x - r * 0.9, s.y + r * 0.8 * k + b, s.x + r * 0.9, s.y + r * 0.8 * k + b], fc(s, '#e6eef8'));
  ctx.fillStyle = fc(s, DEEP);
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.18, s.y - r * 0.2 + b);
  ctx.lineTo(s.x - r * 0.42, s.y + r * 0.75 * k + b);
  ctx.lineTo(s.x + r * 0.42, s.y + r * 0.75 * k + b);
  ctx.lineTo(s.x + r * 0.18, s.y - r * 0.2 + b);
  ctx.closePath();
  ctx.fill();
  // bow of ice held toward the facing; the string draws back on windup
  const draw = s.pose === 'windup' ? 1 : 0;
  const bx = s.x + fx * r * 0.85;
  const by = s.y + fy * r * 0.85 - r * 0.1 + b;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(s.facing);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(-4, 0, r * 0.95, -1.25, 1.25);
  ctx.stroke();
  ctx.strokeStyle = fc(s, ICE);
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.strokeStyle = '#e8f4ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4 + Math.cos(-1.25) * r * 0.95, Math.sin(-1.25) * r * 0.95);
  ctx.lineTo(-4 - draw * 11, 0);
  ctx.lineTo(-4 + Math.cos(1.25) * r * 0.95, Math.sin(1.25) * r * 0.95);
  ctx.stroke();
  if (draw) {
    ctx.strokeStyle = FROST;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(r * 0.95, 0);
    ctx.stroke();
    glow(ctx, r * 0.95, 0, 8, ICE, 0.8);
  }
  ctx.restore();
  limb(ctx, s.x - fy * 5, s.y + fx * 5 - r * 0.2 + b, bx, by, 3, fc(s, '#cfdcea'));
  // fur hood with a dark face
  const hx = s.x + fx * 2;
  const hy = s.y - r * 0.8 + b;
  blob(ctx, hx, hy, r * 0.52, r * 0.5, { fill: fc(s, '#f0f4fa') });
  blob(ctx, hx + fx * r * 0.18, hy + fy * r * 0.1 + 1, r * 0.3, r * 0.27, { fill: '#1a2430', outlineW: 0 });
  eyes(ctx, hx + fx * r * 0.22, hy + 1, s.facing, r * 0.13, 1.6, s.flash ? '#ffffff' : '#9ad0ff', 1);
  // breath frost
  glow(ctx, hx + fx * r * 0.7, hy + fy * r * 0.5 + 2, 9, FROST, 0.25 + Math.sin(s.t * 2) * 0.1);
});

registerDraw('reliquary_relic_guardian', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.05);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 0.8, 3);
  // the relic it guards: a gold reliquary box strapped to its back
  const rx = s.x - fx * r * 0.75;
  const ry = s.y - fy * r * 0.75 - r * 0.25 + b;
  ctx.save();
  ctx.translate(rx, ry);
  poly(ctx, [-r * 0.42, -r * 0.35, r * 0.42, -r * 0.35, r * 0.42, r * 0.3, -r * 0.42, r * 0.3], fc(s, GOLD));
  poly(ctx, [-r * 0.46, -r * 0.35, 0, -r * 0.62, r * 0.46, -r * 0.35], fc(s, shade(GOLD, 1.2)), OUTLINE, 2);
  ctx.fillStyle = fc(s, FROST);
  ctx.fillRect(-2, -r * 0.25, 4, r * 0.45);
  ctx.fillRect(-r * 0.15, -r * 0.1, r * 0.3, 4);
  ctx.restore();
  glow(ctx, rx, ry, r * 0.9, GOLD, 0.25);
  // mace arm: raised on windup, crushing down on release
  const lift = s.pose === 'windup' ? -1.5 : s.pose === 'attack' ? 0.3 : -0.4;
  const ma = s.facing + lift * 0.6;
  const mx = s.x + fy * r * 0.8;
  const my = s.y - fx * r * 0.8 + b;
  const ex = mx + Math.cos(ma) * r * 1.3;
  const ey = my + Math.sin(ma) * r * 1.3 - (s.pose === 'windup' ? r * 0.6 : 0);
  limb(ctx, mx, my, ex, ey, 5, fc(s, '#5a4a30'));
  blob(ctx, ex, ey, r * 0.3, r * 0.3, { fill: fc(s, '#7a8494') });
  for (let i = 0; i < 4; i++) shard(ctx, ex, ey, i * (Math.PI / 2) + 0.4, r * 0.48, 3, fc(s, '#c8ccd4'));
  // massive armoured body
  blob(ctx, s.x, s.y + b, r * 0.95, r * 0.9 * (1 - s.squash * 0.06), { fill: fc(s, '#6a7a90') });
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(s.x - r * 0.75, s.y + r * 0.15 + b, r * 1.5, r * 0.12);
  spec(ctx, s.x - r * 0.4, s.y - r * 0.35 + b, 3);
  // bucket helm with a gold visor cross
  const hx = s.x + fx * 2;
  const hy = s.y - r * 0.82 + b;
  poly(ctx, [hx - r * 0.42, hy - r * 0.42, hx + r * 0.42, hy - r * 0.42, hx + r * 0.46, hy + r * 0.38, hx - r * 0.46, hy + r * 0.38], fc(s, '#8a96a8'));
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(hx - r * 0.34, hy - r * 0.06, r * 0.68, r * 0.12);
  ctx.fillRect(hx - r * 0.06 + fx * r * 0.1, hy - r * 0.32, r * 0.12, r * 0.6);
  glow(ctx, hx + fx * r * 0.2, hy, 10, ICE, 0.45);
  // tower shield: a full wall toward the facing (unbreakable from the front)
  ctx.save();
  ctx.translate(s.x + fx * r * 1.0, s.y + fy * r * 1.0 + b - r * 0.1);
  ctx.rotate(s.facing);
  poly(ctx, [-6, -r * 1.05, 8, -r * 1.0, 10, 0, 8, r * 1.0, -6, r * 1.05], fc(s, DEEP));
  ctx.strokeStyle = fc(s, GOLD);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-2, -r * 0.88);
  ctx.lineTo(5, -r * 0.84);
  ctx.lineTo(6, r * 0.84);
  ctx.lineTo(-2, r * 0.88);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = fc(s, GOLD);
  ctx.fillRect(0, -r * 0.5, 5, r);
  ctx.fillRect(-2, -r * 0.18, 9, r * 0.2);
  ctx.restore();
  glow(ctx, s.x + fx * r * 1.05, s.y + fy * r * 1.05, r * 0.8, ICE, 0.12);
});
