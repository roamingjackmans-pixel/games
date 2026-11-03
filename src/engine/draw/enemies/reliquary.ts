// Frozen Reliquary roster (ice blue, frost white, reliquary gold, deep blue — ART_AUDIO §2). The frost is Magic
// now (D80), so ice enemies keep the crystal look but carry magic blue (ELEMENTS.magic) in their tabards, runes,
// eyes and glows; whatever strikes glows in the colour of the attack's type.
import { OUTLINE, glow, shade, shadow, spec } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';
import {
  TAU,
  armBehind,
  bend,
  bob,
  capsule,
  claws,
  el,
  ell,
  eye,
  eyes2,
  floorShadow,
  frame,
  fwdP,
  horn,
  hot,
  hound,
  legs,
  limb3,
  p3,
  poly2,
  ragHem,
  sheen,
  sideP,
  slits,
  smooth2,
  sparkle,
  stick,
  streak,
  striking,
  swingTrail,
  type Frame,
} from '../shapesB';

const ICE = '#9ad0ff';
const FROST = '#f4f8ff';
const GOLD = '#d4af37';
const STEEL = '#8aa6c4';

/** A crystal shard: a long diamond from (x, y) along angle a with a lit facet on one side. */
function shard(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, len: number, w: number, fill: string, ow = 2): void {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const mx = x + ca * len * 0.3;
  const my = y + sa * len * 0.3;
  const tx = x + ca * len;
  const ty = y + sa * len;
  poly2(ctx, s, [x, y, mx - sa * w, my + ca * w, tx, ty, mx + sa * w, my - ca * w], fill, 2, ow);
  if (!s.flash) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(mx + sa * w * 0.9, my - ca * w * 0.9);
    ctx.lineTo(tx, ty);
    ctx.closePath();
    ctx.fill();
  }
}

/** A sword angle for the common poses: low at rest, cocked over the shoulder on windup, sweeping on attack. */
function swordAngle(s: DrawState, f: Frame): { a: number; from: number; dir: number } {
  const fa = Math.atan2(f.fy * 0.55, f.fx);
  if (s.pose === 'windup') return { a: -Math.PI / 2 - f.dir * 0.75, from: 0, dir: 0 };
  if (s.pose === 'attack') {
    const idx = Math.floor(s.poseT / 0.32) % 2;
    const dir = (idx === 0 ? 1 : -1) * f.dir;
    const k = Math.min(1, (s.poseT % 0.32) / 0.12);
    return { a: fa - 1.25 * dir + 2.5 * dir * k, from: fa - 1.25 * dir, dir };
  }
  if (s.pose === 'recover') return { a: fa + 1.1 * f.dir, from: 0, dir: 0 };
  if (s.pose === 'stagger') return { a: -Math.PI / 2 + f.dir * 1.2, from: 0, dir: 0 };
  return { a: Math.atan2(0.75 + f.fy * 0.35, f.fx * 0.7), from: 0, dir: 0 };
}

// ------------------------------------------------------------------ Frost Knight: great helm, ice longsword, kite shield
registerDraw('reliquary_frost_knight', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1, 5);
  shadow(ctx, s.x, s.y, r);
  const gy = s.y + r * 0.72;
  const wf = 0.78 + 0.22 * Math.abs(f.fy);
  const lean = s.pose === 'windup' ? -3 : s.pose === 'attack' ? 5 : 0;
  const cx = s.x + f.fx * lean;
  const top = s.y - r * 0.42 * (1 - s.squash * 0.08) + b;
  const w = r * wf;

  const cape = (): void => {
    const pts = [cx - w * 0.55, top + r * 0.02, cx + w * 0.55, top + r * 0.02, cx + w * 0.72, gy - r * 0.15];
    ragHem(pts, cx - w * 0.72, cx + w * 0.72, gy - r * 0.15, 3, r * 0.14, s.t, 0.5);
    poly2(ctx, s, pts, E.deep, 0.7, 2.5);
  };
  const sword = (): void => {
    const [sx, sy] = sideP(f, cx, top + r * 0.12, r * 0.55 * wf, 1);
    const sw = swordAngle(s, f);
    const hx = sx + Math.cos(sw.a) * r * 0.5;
    const hy = sy + Math.sin(sw.a) * r * 0.5 + r * 0.12;
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.75, f.px, 0.6);
    const L = r * 1.45;
    if (H && s.pose === 'attack' && sw.dir !== 0) swingTrail(ctx, sx, sy, r * 0.5 + L * 0.85, sw.from, sw.a, r * 0.45, H, 0.75);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.26, r * 0.22, STEEL);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(sw.a);
    stick(ctx, s, -r * 0.2, 0, 0, 0, r * 0.1, '#2a3a50', 2);
    poly2(ctx, s, [r * 0.06, -r * 0.09, L * 0.86, -r * 0.08, L, 0, L * 0.86, r * 0.08, r * 0.06, r * 0.09], '#d6ecff', 2, 2);
    sheen(ctx, [r * 0.12, 0, L * 0.85, 0], E.main, 1.5, 0.9);
    poly2(ctx, s, [-r * 0.02, -r * 0.24, r * 0.08, -r * 0.24, r * 0.08, r * 0.24, -r * 0.02, r * 0.24], GOLD, 2, 2);
    ctx.restore();
    glow(ctx, hx + Math.cos(sw.a) * L * 0.6, hy + Math.sin(sw.a) * L * 0.6, r * (H ? 1.0 : 0.5), H ?? E.glow, H ? 0.6 : 0.3);
    ell(ctx, s, hx, hy, r * 0.12, r * 0.11, '#6a84a4', 0.6, 2);
  };
  const shield = (): void => {
    const [qx, qy] = sideP(f, ...fwdP(f, cx, top + r * 0.42, r * 0.62), r * 0.32, -1);
    const sw = r * 0.4 * (0.3 + 0.7 * Math.abs(f.fy));
    const sh = r * 0.55;
    const face = !f.back;
    poly2(ctx, s, [qx - sw, qy - sh, qx + sw, qy - sh, qx + sw, qy + sh * 0.2, qx, qy + sh, qx - sw, qy + sh * 0.2], face ? '#2a5ab8' : '#24304a', 0.65, 2.5);
    if (face) {
      sheen(ctx, [qx - sw * 0.8, qy - sh * 0.82, qx + sw * 0.8, qy - sh * 0.82, qx + sw * 0.8, qy + sh * 0.15, qx, qy + sh * 0.8, qx - sw * 0.8, qy + sh * 0.15, qx - sw * 0.8, qy - sh * 0.82], '#dfe8f4', 1.5, 0.9);
      if (sw > r * 0.2) {
        glow(ctx, qx, qy - sh * 0.15, r * 0.4, E.glow, 0.35);
        sparkle(ctx, qx, qy - sh * 0.15, r * 0.24, s.flash ? '#ffffff' : FROST, 0);
      }
    }
  };
  if (!f.back) cape();
  if (armBehind(f, 1)) sword();
  if (f.back) shield();
  legs(ctx, s, f, cx, s.y + r * 0.3 + b, gy, r * 0.3, r * 0.24, STEEL, '#4a5a74', r * 0.25, 9);
  // breastplate and the blue tabard
  poly2(ctx, s, [cx - w * 0.62, top, cx - w * 0.3, top - r * 0.12, cx + w * 0.3, top - r * 0.12, cx + w * 0.62, top, cx + w * 0.52, s.y + r * 0.3 + b, cx, s.y + r * 0.42 + b, cx - w * 0.52, s.y + r * 0.3 + b], STEEL, 0.6);
  if (!f.back) {
    const ox = cx + f.fx * w * 0.15;
    const flap = Math.sin(s.t * 5) * r * 0.04;
    poly2(ctx, s, [ox - r * 0.2, top + r * 0.02, ox + r * 0.2, top + r * 0.02, ox + r * 0.24, s.y + r * 0.5 + b, ox + flap, s.y + r * 0.66 + b, ox - r * 0.24, s.y + r * 0.5 + b], E.main, 0.7, 2.5);
    sparkle(ctx, ox, s.y + r * 0.02 + b, r * 0.14, s.flash ? '#ffffff' : FROST, 0);
  }
  poly2(ctx, s, [cx - w * 0.55, s.y + r * 0.2 + b, cx + w * 0.55, s.y + r * 0.2 + b, cx + w * 0.53, s.y + r * 0.32 + b, cx - w * 0.53, s.y + r * 0.32 + b], '#3a2a20', 2, 2);
  spec(ctx, cx - w * 0.38, top + r * 0.1, 2, 0.7);
  if (f.back) cape();
  // pauldrons with frost spikes
  for (const side of [-1, 1]) {
    const [px, py] = sideP(f, cx, top + r * 0.02, r * 0.6 * wf, side);
    shard(ctx, s, px + f.px * side * r * 0.1, py - r * 0.1, -Math.PI / 2 + f.px * side * 0.6, r * 0.42, r * 0.08, ICE);
    smooth2(ctx, s, [px - r * 0.26, py + r * 0.12, px - r * 0.22, py - r * 0.14, px, py - r * 0.2, px + r * 0.22, py - r * 0.14, px + r * 0.26, py + r * 0.12, px, py + r * 0.18], '#b4cce4', 0.55, 2.5);
  }
  if (!armBehind(f, 1)) sword();
  if (!f.back) shield();
  // great helm: flat-topped, T visor glowing blue, a crest of icicles
  const hx = cx + f.fx * r * 0.05;
  const hy = top - r * 0.34;
  shard(ctx, s, hx, hy - r * 0.32, -Math.PI / 2, r * 0.6, r * 0.1, ICE);
  shard(ctx, s, hx - r * 0.2, hy - r * 0.3, -Math.PI / 2 - 0.45, r * 0.42, r * 0.08, ICE);
  shard(ctx, s, hx + r * 0.2, hy - r * 0.3, -Math.PI / 2 + 0.45, r * 0.42, r * 0.08, ICE);
  poly2(ctx, s, [hx - r * 0.34, hy + r * 0.3, hx - r * 0.36, hy - r * 0.22, hx - r * 0.24, hy - r * 0.38, hx + r * 0.24, hy - r * 0.38, hx + r * 0.36, hy - r * 0.22, hx + r * 0.34, hy + r * 0.3, hx, hy + r * 0.38], '#b4cce4', 0.62);
  if (!f.back) {
    const vx = hx + f.fx * r * 0.14;
    const vw = r * (0.26 - 0.1 * Math.abs(f.fx));
    const vc = s.flash ? '#ffffff' : (H ?? E.glow);
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(vx - vw, hy - r * 0.08, vw * 2, r * 0.1);
    ctx.fillRect(vx - r * 0.04, hy - r * 0.08, r * 0.08, r * 0.3);
    ctx.fillStyle = vc;
    ctx.fillRect(vx - vw * 0.85, hy - r * 0.055, vw * 1.7, r * 0.045);
    glow(ctx, vx, hy - r * 0.03, r * 0.45, vc, 0.5);
  }
  sheen(ctx, [hx - r * 0.3, hy - r * 0.22, hx - r * 0.18, hy - r * 0.32], '#ffffff', 1.5, 0.7);
});

// ------------------------------------------------------------------ Reliquary Wraith: a veiled ghost with an icicle crown
registerDraw('reliquary_wraith', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const x = s.x;
  const y = s.y - r * 0.55 + Math.sin(s.t * 2.4) * 3;
  floorShadow(ctx, x, s.y + r * 0.62, r * 0.75, r * 0.26, 0.2);
  glow(ctx, x, y, r * 2.4, E.glow, 0.3);
  const casting = striking(s);
  const prevA = ctx.globalAlpha;
  ctx.globalAlpha = prevA * (s.hpFrac < 0.5 ? 0.82 : 0.94);
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, y - r * 0.2, r * 0.45, side);
    const [hx, hy] = casting ? sideP(f, ...fwdP(f, sx, sy - r * 0.4, r * 0.55), r * 0.35, side) : sideP(f, ...fwdP(f, x, y + r * 0.08, r * 0.3), r * 0.12, side);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.9, f.px * side, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.12, r * 0.09, '#dfe8f0', 2.5);
    claws(ctx, s, hx, hy, Math.atan2(hy - ey, hx - ex), r * 0.22, 3, 0.4, '#eef4fa', 1, 0.2);
    if (casting) eye(ctx, hx, hy, Math.max(1.4, r * 0.08), H ?? E.glow, 0.7);
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  // the shroud: bell-shaped, a tattered hem streaming into wisps
  const sh = [x - r * 0.4, y - r * 0.5, x + r * 0.4, y - r * 0.5, x + r * 0.78, y + r * 0.25, x + r * 0.7, y + r * 0.85];
  ragHem(sh, x - r * 0.7, x + r * 0.7, y + r * 0.85, 4, r * 0.32, s.t, 2.1);
  sh.push(x - r * 0.78, y + r * 0.25);
  poly2(ctx, s, sh, '#d6e6f8', 0.55, 3, '#9ab8dc');
  sheen(ctx, [x + f.fx * r * 0.1, y - r * 0.35, x + f.fx * r * 0.15, y + r * 0.6], E.main, 2, 0.7);
  // reliquary lantern in the clasped hands while not casting
  if (!casting && !f.back) {
    const [lx, ly] = fwdP(f, x, y + r * 0.28, r * 0.42);
    glow(ctx, lx, ly, r * 0.8, E.glow, 0.6);
    poly2(ctx, s, [lx - r * 0.13, ly - r * 0.12, lx + r * 0.13, ly - r * 0.12, lx + r * 0.13, ly + r * 0.14, lx - r * 0.13, ly + r * 0.14], GOLD, 2, 2);
    ctx.fillStyle = s.flash ? '#ffffff' : E.glow;
    ctx.fillRect(lx - r * 0.07, ly - r * 0.06, r * 0.14, r * 0.14);
  }
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  if (casting) {
    // a rune ring between the hands
    const [rx, ry] = fwdP(f, x, y - r * 0.4, r * 0.8);
    const k = s.pose === 'attack' ? 1 : Math.min(1, s.poseT / 0.6);
    glow(ctx, rx, ry, r * (0.8 + k * 0.5), H ?? E.glow, 0.7);
    ctx.strokeStyle = H ?? E.glow;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(rx, ry, r * 0.42 * k + 1, r * 0.3 * k + 1, 0, 0, TAU);
    ctx.stroke();
    sparkle(ctx, rx, ry, r * 0.22 * k + 1, '#ffffff', s.t * 3);
  }
  // hood with a peak and a gold band of icicles
  const hx = x + f.fx * r * 0.08;
  const hy = y - r * 0.72;
  smooth2(ctx, s, [hx - r * 0.42, hy + r * 0.38, hx - r * 0.46, hy - r * 0.08, hx - r * 0.24, hy - r * 0.44, hx - f.fx * r * 0.18, hy - r * 0.62, hx + r * 0.24, hy - r * 0.44, hx + r * 0.46, hy - r * 0.08, hx + r * 0.42, hy + r * 0.38], '#e4eefa', 0.7, 3, '#aac4e4');
  for (let i = -1; i <= 1; i++) shard(ctx, s, hx + i * r * 0.22, hy - r * 0.34 - (i === 0 ? r * 0.06 : 0), -Math.PI / 2 + i * 0.4, r * (i === 0 ? 0.5 : 0.36), r * 0.07, ICE, 1.5);
  sheen(ctx, [hx - r * 0.34, hy - r * 0.26, hx + r * 0.34, hy - r * 0.26], GOLD, 2.2, 1);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.18;
    const rw = r * (0.28 - 0.1 * Math.abs(f.fx));
    smooth2(ctx, s, [fx2 - rw, hy, fx2, hy - r * 0.22, fx2 + rw, hy, fx2 + rw * 0.6, hy + r * 0.3, fx2 - rw * 0.6, hy + r * 0.3], '#0a1424', 2, 2);
    eyes2(ctx, f, fx2 + f.fx * 1.5, hy + r * 0.04, r * 0.11, Math.max(1.3, r * 0.075), s.flash ? '#ffffff' : (H ?? E.glow), 0.6);
  }
  ctx.globalAlpha = prevA;
});

// ------------------------------------------------------------------ Icicle Lurker: an ice gargoyle-spider with scythe claws
registerDraw('reliquary_icicle_lurker', (ctx, s) => {
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  // Drop: during its (blue) windup it still hangs from the ceiling over a growing shadow, then falls in the leap
  const dropping = s.tint === 'blue' && s.pose === 'windup';
  const leaping = s.pose === 'attack' && s.scale > 1.001;
  const r = s.r;
  const BODY = '#a8cce8';
  if (dropping) {
    const k = Math.min(1, s.poseT);
    floorShadow(ctx, s.x, s.y + r * 0.4, r * (0.8 + k * 0.6), r * (0.45 + k * 0.3), 0.3 + k * 0.25);
    const hy = s.y - 130 + k * 25 + Math.sin(s.t * 30) * k * 1.5;
    // hanging upside down: legs splayed on the ceiling, a beard of icicles pointing at the floor
    for (const side of [-1, 1]) {
      limb3(ctx, s, s.x + side * r * 0.4, hy - r * 0.1, s.x + side * r * 0.95, hy - r * 0.5, s.x + side * r * 1.2, hy - r * 0.1, r * 0.12, r * 0.08, '#6a8aaa', 2);
      limb3(ctx, s, s.x + side * r * 0.3, hy + r * 0.1, s.x + side * r * 0.85, hy + r * 0.1, s.x + side * r * 1.05, hy + r * 0.45, r * 0.12, r * 0.08, '#6a8aaa', 2);
    }
    for (let i = -2; i <= 2; i++) shard(ctx, s, s.x + i * r * 0.3, hy + r * 0.2, Math.PI / 2 + i * 0.12, r * (1.3 - Math.abs(i) * 0.25), r * 0.14, i % 2 === 0 ? ICE : FROST);
    smooth2(ctx, s, [s.x - r * 0.75, hy, s.x - r * 0.5, hy - r * 0.45, s.x + r * 0.5, hy - r * 0.45, s.x + r * 0.75, hy, s.x, hy + r * 0.5], BODY, 0.6);
    for (const side of [-1, 1]) eye(ctx, s.x + side * r * 0.2, hy + r * 0.12, 1.6, E.glow, 0.6);
    if (k > 0.3) for (let i = 0; i < 3; i++) spec(ctx, s.x + Math.sin(s.t * 7 + i * 2) * r * 0.6, hy + r * 1.2 + ((s.t * 140 + i * 40) % 90), 1.6, 0.7);
    return;
  }
  const lift = leaping ? Math.max(0, 1 - s.poseT / 0.25) * 100 : 0;
  shadow(ctx, s.x, s.y, r * (lift > 0 ? 1.2 : 1));
  const gy = s.y + r * 0.62 - lift;
  const b = lift > 0 ? 0 : bob(s, 1.2, 9);
  const flare = s.tint === 'red' ? 1.35 + Math.sin(s.t * 40) * 0.05 : s.pose === 'attack' ? 1.25 : 1;
  const z = r * 0.5 + b;
  const pt = (a: number, bb: number, zz: number): [number, number] => p3(f, s.x, gy, a, bb, zz);
  const near = f.py >= 0 ? 1 : -1;
  // spindly back legs splayed wide, knees high
  const leg = (a: number, side: number): void => {
    const step = Math.sin(s.t * 16 + a + side) * r * 0.2 * s.moving;
    const [rx, ry] = pt(a, r * 0.25 * side, z);
    const [kx, ky] = pt(a + step * 0.5, r * 0.75 * side, z + r * 0.45);
    const [px, py] = pt(a + step, r * 0.95 * side, 0);
    limb3(ctx, s, rx, ry, kx, ky, px, py, r * 0.14, r * 0.09, side === near ? '#7a9aba' : '#5a7a9a', 2.5);
  };
  const scythe = (side: number): void => {
    const reach = s.pose === 'attack' ? 1.4 : s.pose === 'windup' ? 0.35 : 0.9;
    const [rx, ry] = pt(r * 0.45, r * 0.25 * side, z + r * 0.1);
    const [kx, ky] = pt(r * 0.6, r * 0.55 * side, z + r * (s.pose === 'windup' ? 0.9 : 0.55));
    const [px, py] = pt(r * (0.6 + reach * 0.6), r * 0.3 * side, z + r * 0.2);
    limb3(ctx, s, rx, ry, kx, ky, px, py, r * 0.15, r * 0.11, '#8ab0d0', 2.5);
    const a = Math.atan2(py - ky, px - kx);
    if (H && s.pose === 'attack') streak(ctx, kx, ky, px + Math.cos(a) * r * 0.6, py + Math.sin(a) * r * 0.6, 4, H, 0.7);
    horn(ctx, s, px, py, a - side * f.dir * 0.3, r * 0.75, r * 0.15, side * f.dir * 0.7, FROST, 2);
  };
  leg(-r * 0.35, -near);
  leg(r * 0.05, -near);
  scythe(-near);
  // abdomen and thorax as one hunched capsule; spikes along the back
  const [cx, cy] = pt(r * 0.35, 0, z + r * 0.08);
  const [hx, hy] = pt(-r * 0.45, 0, z + r * 0.12);
  const backSpikes = (): void => {
    for (let i = 0; i < 5; i++) {
      const [qx, qy] = pt(-r * 0.6 + i * r * 0.22, (i - 2) * r * 0.08, z + r * 0.42);
      const a = -Math.PI / 2 - f.fx * 0.5 + (i - 2) * 0.22;
      shard(ctx, s, qx, qy, a, r * (0.65 - Math.abs(i - 2) * 0.1) * flare, r * 0.11, i % 2 === 0 ? ICE : FROST);
    }
  };
  if (f.fy >= 0) backSpikes();
  capsule(ctx, s, hx, hy, r * 0.45, cx, cy, r * 0.36, BODY, 0.25, 0.58);
  if (f.fy < 0) backSpikes();
  leg(-r * 0.35, near);
  leg(r * 0.05, near);
  // wedge head: fanged maw and four blue eyes
  const [qx, qy] = pt(r * 0.72, 0, z + r * 0.18);
  const hw = r * 0.3;
  const open = striking(s) ? 0.2 : 0.06;
  if (!f.back) {
    poly2(ctx, s, [qx - hw, qy - r * 0.16, qx + hw, qy - r * 0.16, qx + hw * 0.8, qy + r * 0.12, qx, qy + r * (0.24 + open), qx - hw * 0.8, qy + r * 0.12], '#c4e2f8', 0.6, 2.5);
    ctx.fillStyle = '#0e1a2a';
    ctx.beginPath();
    ctx.moveTo(qx - hw * 0.5, qy + r * 0.06);
    ctx.lineTo(qx + hw * 0.5, qy + r * 0.06);
    ctx.lineTo(qx, qy + r * (0.12 + open));
    ctx.closePath();
    ctx.fill();
    const ec = s.flash ? '#ffffff' : (H ?? E.glow);
    for (let i = 0; i < 4; i++) eye(ctx, qx + (i - 1.5) * hw * 0.42, qy - r * 0.06 - (i === 1 || i === 2 ? r * 0.04 : 0), Math.max(1, r * 0.055), ec, 0.4);
  } else {
    poly2(ctx, s, [qx - hw, qy - r * 0.12, qx + hw, qy - r * 0.12, qx, qy + r * 0.16], '#b0d0ea', 0.6, 2.5);
  }
  scythe(near);
});

// ------------------------------------------------------------------ Frozen Hound: an ice wolf with a crystal spine
registerDraw('reliquary_frozen_hound', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  shadow(ctx, s.x, s.y, r);
  hound(
    ctx,
    s,
    f,
    r,
    { fur: '#a4bcd4', muzzle: '#e8f0fa', mouth: H ?? E.main, eye: s.flash ? '#ffffff' : E.glow, teeth: '#ffffff', ear: '#a4bcd4', body: '#a4bcd4', leg: '#8aa4c0', legFar: '#6a84a0', paw: '#3a5470' },
    {
      tail: '#c4d6ea',
      mouthGlow: H ?? E.glow,
      hot: H,
      tailTip: (x, y, a) => shard(ctx, s, x, y, a, r * 0.45, r * 0.08, ICE, 1.5),
      spine: (x, y, i) => shard(ctx, s, x, y + 2, -Math.PI / 2 - f.fx * 0.7, r * (0.55 - i * 0.08), r * 0.1, i % 2 === 0 ? ICE : FROST, 1.8),
      flank: (pt, near) => {
        // magic frost runes on the near flank
        const [m1x, m1y] = pt(-r * 0.3, r * 0.2 * near, r * 0.62);
        const [m2x, m2y] = pt(r * 0.1, r * 0.22 * near, r * 0.6);
        ctx.strokeStyle = s.flash ? '#ffffff' : E.main;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m1x, m1y - r * 0.08);
        ctx.lineTo(m1x + r * 0.08, m1y + r * 0.08);
        ctx.lineTo(m2x, m2y - r * 0.06);
        ctx.lineTo(m2x + r * 0.06, m2y + r * 0.1);
        ctx.stroke();
        glow(ctx, (m1x + m2x) / 2, (m1y + m2y) / 2, r * 0.45, E.glow, 0.35);
      },
    },
  );
  // frosty breath
  const [bx, by] = p3(f, s.x, s.y + r * 0.62, r * 1.45, 0, r * 0.95);
  glow(ctx, bx, by, r * 0.5, FROST, 0.18 + Math.sin(s.t * 2) * 0.08);
});

// ------------------------------------------------------------------ Choir Acolyte: veiled singer with a porcelain mask
registerDraw('reliquary_choir_acolyte', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const singing = striking(s);
  shadow(ctx, s.x, s.y, r * 0.9);
  const x = s.x + Math.sin(s.t * 1.6) * 1.2;
  const gy = s.y + r * 0.74;
  const top = s.y - r * 0.45 + Math.sin(s.t * 1.6 + 1) * 0.6;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const noteC = H ?? E.glow;
  // floating notes
  for (let i = 0; i < 3; i++) {
    const k = (s.t * 0.5 + i / 3) % 1;
    const nx = s.x + Math.sin(s.t * 2 + i * 2.1) * r * 0.9;
    const ny = s.y - r * 1.5 - k * r * 2.2;
    ctx.save();
    ctx.globalAlpha *= (1 - k) * (singing ? 1 : 0.55);
    glow(ctx, nx, ny, r * 0.5, noteC, 0.6);
    ctx.fillStyle = noteC;
    ctx.beginPath();
    ctx.ellipse(nx, ny, r * 0.1, r * 0.075, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillRect(nx + r * 0.07, ny - r * 0.35, 1.4, r * 0.35);
    ctx.restore();
  }
  // long robe with a gold hem and blue stole
  const hem = gy - r * 0.1;
  poly2(ctx, s, [x - w * 0.36, top, x + w * 0.36, top, x + w * 0.62, s.y + r * 0.2, x + w * 0.8, hem, x - w * 0.8, hem, x - w * 0.62, s.y + r * 0.2], '#e4ecf8', 0.62, 3, '#b4c4dc');
  poly2(ctx, s, [x - w * 0.8, hem - r * 0.12, x + w * 0.8, hem - r * 0.12, x + w * 0.82, hem + r * 0.02, x - w * 0.82, hem + r * 0.02], GOLD, 2, 2);
  if (!f.back) {
    const ox = x + f.fx * w * 0.16;
    for (const side of [-1, 1]) poly2(ctx, s, [ox + side * r * 0.08, top + r * 0.05, ox + side * r * 0.2, top + r * 0.05, ox + side * r * 0.22, hem - r * 0.12, ox + side * r * 0.08, hem - r * 0.12], E.main, 2, 1.8);
  }
  // sleeves meet at the hymnal (raised while singing)
  const [bx, by] = fwdP(f, x, top + r * (singing ? 0.2 : 0.42), r * 0.42);
  for (const side of [-1, 1]) {
    if (f.back) continue;
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.38 * wf, side);
    const [hx, hy] = sideP(f, bx, by, r * 0.18, side);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.7, f.px * side, 0.6);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.24, r * 0.26, '#d4def0');
  }
  if (!f.back) {
    poly2(ctx, s, [bx - r * 0.32, by - r * 0.14, bx, by - r * 0.1, bx + r * 0.32, by - r * 0.14, bx + r * 0.32, by + r * 0.16, bx, by + r * 0.2, bx - r * 0.32, by + r * 0.16], E.deep, 2, 2);
    ctx.fillStyle = s.flash ? '#ffffff' : FROST;
    ctx.fillRect(bx - r * 0.27, by - r * 0.08, r * 0.24, r * 0.22);
    ctx.fillRect(bx + r * 0.03, by - r * 0.08, r * 0.24, r * 0.22);
  }
  // tall veil hood with a gold circlet, porcelain mask with an open singing mouth
  const hx = x + f.fx * r * 0.05;
  const hy = top - r * 0.38 + (singing ? -r * 0.04 : 0);
  smooth2(ctx, s, [hx - r * 0.5, hy + r * 0.5, hx - r * 0.42, hy - r * 0.1, hx - r * 0.24, hy - r * 0.62, hx, hy - r * 0.95, hx, hy - r * 0.95, hx + r * 0.24, hy - r * 0.62, hx + r * 0.42, hy - r * 0.1, hx + r * 0.5, hy + r * 0.5], '#f0f4fa', 0.7, 3, '#c4d2e6');
  sheen(ctx, [hx - r * 0.33, hy - r * 0.32, hx, hy - r * 0.38, hx + r * 0.33, hy - r * 0.32], GOLD, 2.4, 1);
  if (!f.back) {
    const mx = hx + f.fx * r * 0.14;
    const my = hy + r * 0.04;
    const mw = r * (0.24 - 0.08 * Math.abs(f.fx));
    smooth2(ctx, s, [mx - mw, my - r * 0.12, mx, my - r * 0.26, mx + mw, my - r * 0.12, mx + mw * 0.8, my + r * 0.16, mx, my + r * 0.28, mx - mw * 0.8, my + r * 0.16], '#e0e6ee', 0.7, 2);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const [ex, ey] = sideP(f, mx, my - r * 0.04, mw * 0.5, side, 0.3);
      ctx.moveTo(ex - r * 0.07, ey);
      ctx.quadraticCurveTo(ex, ey + r * 0.05, ex + r * 0.07, ey);
    }
    ctx.stroke();
    const m = singing ? 0.11 + Math.sin(s.t * 18) * 0.02 : 0.05;
    ctx.fillStyle = '#1a1420';
    ctx.beginPath();
    ctx.ellipse(mx, my + r * 0.13, r * 0.06, r * m, 0, 0, TAU);
    ctx.fill();
    if (singing) glow(ctx, mx, my + r * 0.15, r * 0.9, noteC, 0.5);
  }
});

// ------------------------------------------------------------------ Glacial Golem: a faceted ice giant with crystal fists
registerDraw('reliquary_glacial_golem', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1.2, 2.5);
  shadow(ctx, s.x, s.y, r * 1.05, 0.4);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.82 + 0.18 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.45 * (1 - s.squash * 0.08) + b;
  const ICEB = '#8fb4d8';
  const raise = s.pose === 'windup';
  const slam = s.pose === 'attack';
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.78 * wf, side);
    let hx: number;
    let hy: number;
    if (raise) [hx, hy] = sideP(f, sx - f.fx * r * 0.1, sy - r * 0.75, r * 0.05, side);
    else if (slam) [hx, hy] = sideP(f, ...fwdP(f, x, s.y + r * 0.35 + b, r * 1.0), r * 0.32, side);
    else [hx, hy] = sideP(f, sx + f.fx * r * 0.2, sy + r * 0.72, r * 0.12, side);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.05, f.px * side, 0.4);
    // stacked ice chunks for the arm
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.34, r * 0.3, '#7e9ebe');
    if (H && slam) streak(ctx, ex, ey, hx, hy + r * 0.2, r * 0.3, H, 0.7);
    // the fist: a faceted boulder with crystal knuckles
    const fr = r * 0.32;
    poly2(ctx, s, [hx - fr, hy - fr * 0.4, hx - fr * 0.55, hy - fr, hx + fr * 0.55, hy - fr, hx + fr, hy - fr * 0.4, hx + fr * 0.85, hy + fr * 0.6, hx, hy + fr * 0.9, hx - fr * 0.85, hy + fr * 0.6], '#a6c2dc', 0.6);
    for (let i = -1; i <= 1; i++) shard(ctx, s, hx + i * fr * 0.5, hy - fr * 0.7, -Math.PI / 2 + i * 0.35, fr * 0.7, fr * 0.16, ICE, 1.5);
    if (H && striking(s)) glow(ctx, hx, hy, r * 0.7, H, 0.55);
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  // ice-column legs
  legs(ctx, s, f, x, s.y + r * 0.3 + b, gy, r * 0.42, r * 0.34, '#7e9ebe', '#5a7a9a', r * 0.12, 4, 1.2);
  // the back cluster of crystals
  const cluster = (): void => {
    for (let i = -2; i <= 2; i++) shard(ctx, s, x + i * r * 0.22, top - r * 0.05, -Math.PI / 2 + i * 0.3, r * (0.9 - Math.abs(i) * 0.18), r * 0.13, i % 2 === 0 ? ICE : FROST);
  };
  if (!f.back) cluster();
  // faceted torso
  poly2(ctx, s, [x - w * 0.98, top + r * 0.05, x - w * 0.7, top - r * 0.32, x - w * 0.1, top - r * 0.42, x + w * 0.62, top - r * 0.34, x + w * 0.98, top + r * 0.05, x + w * 0.75, s.y + r * 0.35 + b, x + w * 0.1, s.y + r * 0.5 + b, x - w * 0.72, s.y + r * 0.38 + b], ICEB, 0.62, 3.5);
  if (!s.flash) {
    ctx.fillStyle = 'rgba(220,240,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.62, top - r * 0.22);
    ctx.lineTo(x - w * 0.08, top - r * 0.34);
    ctx.lineTo(x + w * 0.05, top + r * 0.2);
    ctx.lineTo(x - w * 0.5, top + r * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  if (!f.back) {
    // glowing rune heart
    const ox = x + f.fx * w * 0.12;
    const oy = s.y - r * 0.02 + b;
    glow(ctx, ox, oy, r * 0.75, H ?? E.glow, 0.65);
    poly2(ctx, s, [ox, oy - r * 0.2, ox + r * 0.14, oy, ox, oy + r * 0.2, ox - r * 0.14, oy], s.flash ? '#ffffff' : E.main, 2, 2);
    sparkle(ctx, ox, oy, r * 0.1, '#ffffff', 0);
  } else cluster();
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // small craggy head sunk between the shoulders
  const hx = x + f.fx * r * 0.18;
  const hy = top - r * 0.28 + f.fy * r * 0.06;
  poly2(ctx, s, [hx - r * 0.26, hy + r * 0.16, hx - r * 0.3, hy - r * 0.1, hx - r * 0.12, hy - r * 0.26, hx + r * 0.14, hy - r * 0.24, hx + r * 0.3, hy - r * 0.08, hx + r * 0.24, hy + r * 0.18], '#6a8aa8', 0.62, 2.5);
  slits(ctx, f, hx + f.fx * r * 0.08, hy - r * 0.02, r * 0.1, r * 0.11, r * 0.07, s.flash ? '#ffffff' : (H ?? E.glow), 0.5);
});

// ------------------------------------------------------------------ Hoarfrost Archer: fur-hooded ranger with an ice bow
registerDraw('reliquary_hoarfrost_archer', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1.2, 7);
  shadow(ctx, s.x, s.y, r * 0.85);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.78 + 0.22 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.42 * (1 - s.squash * 0.06) + b;
  const drawn = s.pose === 'windup' ? Math.min(1, s.poseT / 0.5) : 0;
  const quiver = (): void => {
    const [qx, qy] = fwdP(f, x - f.px * r * 0.2, top + r * 0.1, -r * 0.4);
    for (let i = -1; i <= 1; i++) shard(ctx, s, qx + i * r * 0.1, qy - r * 0.1, -Math.PI / 2 - f.dir * 0.3 + i * 0.15, r * 0.55, r * 0.06, ICE, 1.5);
    poly2(ctx, s, [qx - r * 0.13, qy - r * 0.1, qx + r * 0.13, qy - r * 0.1, qx + r * 0.1, qy + r * 0.55, qx - r * 0.1, qy + r * 0.55], '#5a4030', 2, 2);
  };
  // the bow, held out toward the facing; the string draws back on windup
  const bow = (): void => {
    const [gx, gyy] = fwdP(f, x, top + r * 0.22, r * 0.7);
    const bend2 = r * 0.35 * f.dir * Math.abs(f.fx);
    const th = r * 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gx - bend2 * 0.6, gyy - th);
    ctx.quadraticCurveTo(gx + bend2, gyy, gx - bend2 * 0.6, gyy + th);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = r * 0.16 + 3;
    ctx.stroke();
    ctx.strokeStyle = fc(s, '#cfe8ff');
    ctx.lineWidth = r * 0.16;
    ctx.stroke();
    const [dx, dy] = fwdP(f, gx, gyy, -r * 0.6 * drawn);
    ctx.strokeStyle = '#e8f4ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx - bend2 * 0.6, gyy - th);
    ctx.lineTo(dx - bend2 * 0.3, dy);
    ctx.lineTo(gx - bend2 * 0.6, gyy + th);
    ctx.stroke();
    if (drawn > 0 || s.pose === 'attack') {
      const ac = H ?? E.glow;
      const [tx, ty] = fwdP(f, gx, gyy, r * 0.5);
      streak(ctx, dx, dy, tx, ty, 2.5, ac, 0.9);
      shard(ctx, s, tx - f.fx * r * 0.2, ty - f.fy * r * 0.1, Math.atan2(f.fy * 0.55, f.fx), r * 0.35, r * 0.07, ICE, 1.5);
      glow(ctx, tx, ty, r * 0.6, ac, 0.7);
    }
    ell(ctx, s, gx, gyy, r * 0.1, r * 0.1, '#e0ecf6', 0.6, 2);
    // the drawing arm
    const [sx, sy] = sideP(f, x, top + r * 0.1, r * 0.42 * wf, 1);
    const [ex, ey] = bend(sx, sy, dx, dy, r * 0.8, f.px, 0.4);
    limb3(ctx, s, sx, sy, ex, ey, dx, dy, r * 0.22, r * 0.18, '#d8e2ee');
    // the bow arm
    const [ax, ay] = sideP(f, x, top + r * 0.1, r * 0.42 * wf, -1);
    const [ex2, ey2] = bend(ax, ay, gx, gyy, r * 0.85, -f.px, 0.4);
    limb3(ctx, s, ax, ay, ex2, ey2, gx, gyy, r * 0.22, r * 0.18, '#d8e2ee');
  };
  if (!f.back) quiver();
  if (f.back) bow();
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.24, r * 0.2, E.deep, '#e8eef6', r * 0.3, 10);
  // tunic in magic blue under a white fur cloak
  poly2(ctx, s, [x - w * 0.5, top, x + w * 0.5, top, x + w * 0.55, s.y + r * 0.42 + b, x - w * 0.55, s.y + r * 0.42 + b], E.main, 0.6);
  if (!f.back) {
    poly2(ctx, s, [x - w * 0.62, top - r * 0.02, x - w * 0.28, top, x - w * 0.36, s.y + r * 0.52 + b, x - w * 0.78, s.y + r * 0.45 + b], '#e6eef8', 0.6, 2.5);
    poly2(ctx, s, [x + w * 0.62, top - r * 0.02, x + w * 0.28, top, x + w * 0.36, s.y + r * 0.52 + b, x + w * 0.78, s.y + r * 0.45 + b], '#e6eef8', 0.6, 2.5);
    sheen(ctx, [x - w * 0.3, s.y + r * 0.2 + b, x + w * 0.3, s.y + r * 0.2 + b], '#5a4030', 3, 1);
  } else {
    const pts = [x - w * 0.62, top - r * 0.04, x + w * 0.62, top - r * 0.04, x + w * 0.78, s.y + r * 0.5 + b];
    ragHem(pts, x - w * 0.78, x + w * 0.78, s.y + r * 0.5 + b, 3, r * 0.1, s.t * 0.5);
    poly2(ctx, s, pts, '#e6eef8', 0.6, 2.5);
    quiver();
  }
  if (!f.back) bow();
  // fur hood ringing a shadowed face with a scarf
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.34;
  smooth2(ctx, s, [hx - r * 0.44, hy + r * 0.32, hx - r * 0.48, hy - r * 0.12, hx - r * 0.2, hy - r * 0.5, hx + r * 0.2, hy - r * 0.5, hx + r * 0.48, hy - r * 0.12, hx + r * 0.44, hy + r * 0.32, hx, hy + r * 0.4], '#f0f4fa', 0.68, 3, '#c8d4e4');
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.16;
    const rw = r * (0.26 - 0.08 * Math.abs(f.fx));
    smooth2(ctx, s, [fx2 - rw, hy + r * 0.02, fx2, hy - r * 0.24, fx2 + rw, hy + r * 0.02, fx2 + rw * 0.7, hy + r * 0.26, fx2 - rw * 0.7, hy + r * 0.26], '#1a2430', 2, 2);
    poly2(ctx, s, [fx2 - rw * 0.85, hy + r * 0.06, fx2 + rw * 0.85, hy + r * 0.06, fx2 + rw * 0.6, hy + r * 0.26, fx2 - rw * 0.6, hy + r * 0.26], E.deep, 2, 1.5);
    eyes2(ctx, f, fx2 + f.fx * 1.2, hy - r * 0.06, r * 0.1, Math.max(1.2, r * 0.065), s.flash ? '#ffffff' : (H ?? E.glow), 0.5);
  }
});

// ------------------------------------------------------------------ Relic Guardian: tower shield, flanged mace, relic on its back
registerDraw('reliquary_relic_guardian', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 0.8, 3);
  shadow(ctx, s.x, s.y, r * 1.05, 0.4);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.42 * (1 - s.squash * 0.06) + b;
  const ARM = '#6a7a90';
  const relic = (): void => {
    const [rx, ry] = fwdP(f, x, top - r * 0.12, -r * 0.5);
    poly2(ctx, s, [rx - r * 0.36, ry - r * 0.28, rx + r * 0.36, ry - r * 0.28, rx + r * 0.36, ry + r * 0.3, rx - r * 0.36, ry + r * 0.3], GOLD, 0.6, 2.5);
    poly2(ctx, s, [rx - r * 0.42, ry - r * 0.28, rx, ry - r * 0.58, rx + r * 0.42, ry - r * 0.28], shade(GOLD, 1.2), 0.7, 2.5);
    ctx.fillStyle = fc(s, FROST);
    ctx.fillRect(rx - r * 0.04, ry - r * 0.18, r * 0.08, r * 0.38);
    ctx.fillRect(rx - r * 0.15, ry - r * 0.06, r * 0.3, r * 0.08);
    glow(ctx, rx, ry, r * 0.7, GOLD, 0.2);
  };
  const mace = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.62 * wf, 1);
    let a: number;
    if (s.pose === 'windup') a = -Math.PI / 2 - f.dir * 0.5;
    else if (s.pose === 'attack') a = Math.atan2(f.fy * 0.55 + 0.6, f.fx);
    else if (s.pose === 'recover') a = Math.atan2(0.9, f.fx * 0.6);
    else a = Math.atan2(0.85, f.fx * 0.45 + f.px * 0.2);
    const hx = sx + Math.cos(a) * r * 0.5;
    const hy = sy + Math.sin(a) * r * 0.5 + r * 0.1;
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.72, f.px, 0.5);
    const L = r * 0.95;
    if (H && s.pose === 'attack') swingTrail(ctx, sx, sy, r * 0.5 + L, a - 1.5 * f.dir, a, r * 0.4, H, 0.7);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.28, r * 0.24, ARM);
    const mx = hx + Math.cos(a) * L;
    const my = hy + Math.sin(a) * L;
    stick(ctx, s, hx - Math.cos(a) * r * 0.12, hy - Math.sin(a) * r * 0.12, mx, my, r * 0.09, '#5a4a30', 2);
    // flanged head
    for (let i = 0; i < 6; i++) {
      const fa = (i / 6) * TAU + s.facing * 0.2;
      poly2(ctx, s, [mx + Math.cos(fa - 0.25) * r * 0.12, my + Math.sin(fa - 0.25) * r * 0.12, mx + Math.cos(fa) * r * 0.34, my + Math.sin(fa) * r * 0.34, mx + Math.cos(fa + 0.25) * r * 0.12, my + Math.sin(fa + 0.25) * r * 0.12], '#c8ccd4', 2, 1.8);
    }
    ell(ctx, s, mx, my, r * 0.16, r * 0.16, '#8a94a4', 0.55, 2.5);
    if (H && striking(s)) glow(ctx, mx, my, r * 0.7, H, 0.55);
    ell(ctx, s, hx, hy, r * 0.13, r * 0.12, '#4a5668', 0.6, 2);
  };
  // the tower shield: a wall held toward the facing (unbreakable from the front)
  const shield = (): void => {
    const [qx, qy] = fwdP(f, x - f.px * r * 0.1, top + r * 0.45, r * 0.85);
    const sw = r * 0.62 * (0.22 + 0.78 * Math.abs(f.fy));
    const sh = r * 0.88;
    const face = !f.back;
    poly2(ctx, s, [qx - sw, qy - sh * 0.82, qx - sw * 0.6, qy - sh, qx + sw * 0.6, qy - sh, qx + sw, qy - sh * 0.82, qx + sw, qy + sh * 0.8, qx, qy + sh, qx - sw, qy + sh * 0.8], face ? '#3a4a66' : '#2a3448', 0.66, 3);
    if (face && sw > r * 0.25) {
      sheen(ctx, [qx - sw * 0.82, qy - sh * 0.7, qx - sw * 0.5, qy - sh * 0.85, qx + sw * 0.5, qy - sh * 0.85, qx + sw * 0.82, qy - sh * 0.7, qx + sw * 0.82, qy + sh * 0.7, qx, qy + sh * 0.86, qx - sw * 0.82, qy + sh * 0.7, qx - sw * 0.82, qy - sh * 0.7], GOLD, 2, 1);
      ctx.fillStyle = fc(s, GOLD);
      ctx.fillRect(qx - r * 0.07, qy - sh * 0.6, r * 0.14, sh * 1.2);
      ctx.fillRect(qx - sw * 0.6, qy - sh * 0.2, sw * 1.2, r * 0.14);
      spec(ctx, qx - sw * 0.5, qy - sh * 0.55, 2, 0.6);
    } else if (face) sheen(ctx, [qx, qy - sh * 0.85, qx, qy + sh * 0.85], GOLD, 2, 1);
  };
  if (!f.back) relic();
  if (armBehind(f, 1)) mace();
  if (f.back) shield();
  legs(ctx, s, f, x, s.y + r * 0.3 + b, gy, r * 0.36, r * 0.3, ARM, '#3a4456', r * 0.15, 5, 1.2);
  // massive plate body with a gold girdle
  poly2(ctx, s, [x - w * 0.82, top, x - w * 0.4, top - r * 0.15, x + w * 0.4, top - r * 0.15, x + w * 0.82, top, x + w * 0.68, s.y + r * 0.35 + b, x, s.y + r * 0.48 + b, x - w * 0.68, s.y + r * 0.35 + b], ARM, 0.6);
  sheen(ctx, [x - w * 0.62, s.y + r * 0.2 + b, x + w * 0.62, s.y + r * 0.2 + b], GOLD, 3, 1);
  spec(ctx, x - w * 0.45, top + r * 0.08, 2.4, 0.7);
  for (const side of [-1, 1]) {
    const [px, py] = sideP(f, x, top + r * 0.02, r * 0.74 * wf, side);
    smooth2(ctx, s, [px - r * 0.3, py + r * 0.14, px - r * 0.26, py - r * 0.16, px, py - r * 0.24, px + r * 0.26, py - r * 0.16, px + r * 0.3, py + r * 0.14, px, py + r * 0.22], '#8a96a8', 0.55, 2.5);
    sheen(ctx, [px - r * 0.2, py + r * 0.12, px + r * 0.2, py + r * 0.12], GOLD, 1.6, 0.9);
  }
  if (f.back) relic();
  if (!armBehind(f, 1)) mace();
  // bucket helm with a gold cross visor and a crest fin
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.32;
  poly2(ctx, s, [hx - f.fx * r * 0.05 - r * 0.04, hy - r * 0.32, hx + r * 0.04, hy - r * 0.32, hx + r * 0.04 - f.fx * r * 0.2, hy - r * 0.62, hx - r * 0.04 - f.fx * r * 0.28, hy - r * 0.6], GOLD, 2, 2);
  poly2(ctx, s, [hx - r * 0.34, hy - r * 0.3, hx + r * 0.34, hy - r * 0.3, hx + r * 0.38, hy + r * 0.3, hx - r * 0.38, hy + r * 0.3], '#8a96a8', 0.62);
  if (!f.back) {
    const vx = hx + f.fx * r * 0.14;
    const vw = r * (0.26 - 0.08 * Math.abs(f.fx));
    ctx.fillStyle = fc(s, GOLD);
    ctx.fillRect(vx - vw, hy - r * 0.06, vw * 2, r * 0.1);
    ctx.fillRect(vx - r * 0.05, hy - r * 0.24, r * 0.1, r * 0.46);
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(vx - vw * 0.85, hy - r * 0.02, vw * 0.7, r * 0.04);
    ctx.fillRect(vx + vw * 0.15, hy - r * 0.02, vw * 0.7, r * 0.04);
    glow(ctx, vx, hy, r * 0.35, E.glow, 0.25);
  }
  sheen(ctx, [hx - r * 0.3, hy - r * 0.22, hx - r * 0.3, hy + r * 0.2], '#c8d0dc', 1.5, 0.7);
  if (!f.back) shield();
});
