// Boss 6 draw functions: Saint Aurelia the Unthawed (Frozen Reliquary) and her ice mirrors (ART_AUDIO §2:
// thick outlines, flat two-tone fills, real silhouettes). Her damage is Magic (frost is magic), so she reads
// blue: blue-steel plate with gold trim, a magic-blue cape, a glowing visor. Phase 0 she fights from inside a
// faceted block of ice that cracks as her HP falls toward 50%; phase 1 the block is gone, crystalline frost
// wings open, she hovers, shards orbit her and the halo blazes. Drawn upright in a frame mirrored to the side
// she faces (the sword hand leads); the sword glows and trails in the colour of the attack in progress.
import { ELEMENTS } from '../../../game/elements';
import { registerDraw, type DrawState } from '../registry';
import {
  OUTLINE,
  TAU,
  arm2,
  atkGlow,
  atkK,
  begin,
  blendPose,
  clamp01,
  claws,
  dizzy,
  f,
  glint,
  glow,
  glowLine,
  groundShadow,
  hash,
  horn,
  mixPose,
  oval,
  ow,
  poseWeights,
  roar,
  roarLines,
  roarShake,
  shade,
  shape,
  strokePts,
  taper,
  trail,
  withAlpha,
} from '../shapesBoss';
import { overtimeAura } from './overtime';

const MAGIC = ELEMENTS.magic;
const HOLY = ELEMENTS.holy;
const STEEL = '#c8d6ea';
const STEEL_D = '#8ea2c2';
const GOLD = '#d9b23c';
const CAPE = '#2f66d0';
const CAPE_D = MAGIC.deep;
const ICE = '#bfe4ff';
const FROST = '#f4f8ff';
const BLADE = '#e8f5ff';

/** Facing in a frame mirrored so she always faces +x: [side (±1), local facing angle in [−π/2, π/2]]. */
function mirrored(s: DrawState): [number, number] {
  const fx = Math.cos(s.facing);
  const side = fx >= 0 ? 1 : -1;
  return [side, Math.atan2(Math.sin(s.facing), Math.abs(fx))];
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
  // from the rim inward, zig-zagging, with one short branch
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
  ctx.moveTo((sx + x) / 2, (sy + y) / 2);
  ctx.lineTo((sx + x) / 2 + Math.cos(a + 0.9) * len * 0.22, (sy + y) / 2 + Math.sin(a + 0.9) * len * 0.22);
  ctx.stroke();
}

/** A long ice crystal (orbiting shard, shard burst, block spike). */
function crystal(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, len: number, wd: number, a: number, fill: string): void {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const px = -dy * wd;
  const py = dx * wd;
  shape(ctx, [x - dx * len * 0.5, y - dy * len * 0.5, x + px, y + py, x + dx * len * 0.5, y + dy * len * 0.5, x - px, y - py], f(s, fill), { under: f(s, shade(fill, 0.78)), w: 0.7 });
  strokePts(ctx, [x - dx * len * 0.4, y - dy * len * 0.4, x + dx * len * 0.4, y + dy * len * 0.4], withAlpha('#ffffff', 0.7), Math.max(1, ow(0.4)));
}

/** One frost wing on `side` (±1): an ice bone arcing up and out from the upper back, long angular feathers
 * hanging from it and sweeping outward, a row of deep-blue coverts along the edge. */
function wing(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, side: number, r: number, spread: number, flap: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side, 1);
  ctx.rotate(-flap * 0.14 - spread * 0.12);
  const k = 1 + spread * 0.15;
  const wx = 0.5 * r * k;
  const wy = -0.95 * r * k;
  const tx = 1.3 * r * k;
  const ty = -1.45 * r * k;
  const at = (u: number): [number, number] => (u < 0.4 ? [(wx * u) / 0.4, (wy * u) / 0.4] : [wx + ((tx - wx) * (u - 0.4)) / 0.6, wy + ((ty - wy) * (u - 0.4)) / 0.6]);
  const feather = (u: number, a: number, len: number, wd: number, fill: string, line: boolean): void => {
    const [bx, by] = at(u);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const px = -dy;
    const py = dx;
    const pts = [bx + px * wd * 0.6, by + py * wd * 0.6, bx + dx * len * 0.6 + px * wd, by + dy * len * 0.6 + py * wd, bx + dx * len, by + dy * len, bx + dx * len * 0.72 - px * wd * 0.5, by + dy * len * 0.72 - py * wd * 0.5, bx - px * wd * 0.6, by - py * wd * 0.6];
    shape(ctx, pts, f(s, fill), { under: f(s, shade(fill, 0.8)), uf: 0.45, w: 0.8 });
    if (line) strokePts(ctx, [bx + dx * len * 0.15, by + dy * len * 0.15, bx + dx * len * 0.88, by + dy * len * 0.88], withAlpha('#ffffff', 0.75), Math.max(1, ow(0.45)));
  };
  // a translucent sheet of ice behind the feathers gives the wing its mass
  const n = 6;
  const sheet: number[] = [];
  for (let i = 3; i <= 10; i++) {
    const [bx, by] = at(i / 10);
    sheet.push(bx, by);
  }
  for (let i = n - 1; i >= 2; i--) {
    const u = 0.12 + (i / (n - 1)) * 0.88;
    const a = 1.45 - u * 1.85 + spread * 0.1;
    const [bx, by] = at(u);
    const len = r * (0.8 + u * 0.55) * k * 0.8;
    sheet.push(bx + Math.cos(a) * len, by + Math.sin(a) * len);
  }
  ctx.save();
  ctx.globalAlpha *= 0.45;
  shape(ctx, sheet, f(s, '#9fd2ff'), { under: f(s, '#6aaaf0'), uf: 0.5, w: 0 });
  ctx.restore();
  // primaries, root to tip (the outer ones on top)
  for (let i = 0; i < n; i++) {
    const u = 0.12 + (i / (n - 1)) * 0.88;
    const a = 1.45 - u * 1.85 + spread * 0.1;
    feather(u, a, r * (0.8 + u * 0.55) * k, r * 0.15, i % 2 === 0 ? '#dff2ff' : '#b8e0fb', true);
  }
  // the ice bone along the leading edge
  taper(ctx, 0, 0, wx, wy, r * 0.2, r * 0.13, f(s, '#eaf6ff'), 0.9);
  taper(ctx, wx, wy, tx, ty, r * 0.13, r * 0.05, f(s, '#eaf6ff'), 0.9);
  // coverts: short deep-blue feathers along the bone
  for (let i = 0; i < 5; i++) {
    const u = 0.08 + i * 0.2;
    feather(u, 1.2 - u * 1.6 + spread * 0.1, r * (0.38 + u * 0.15) * k, r * 0.12, i % 2 === 0 ? '#7cb8ff' : '#5c9cf2', false);
  }
  ctx.restore();
}
// pose arrays (× r): [handX, handY, swordAngle, offX, offY, lean, wingSpread]
const AU_REST = [0.64, 0.02, 0.85, -0.6, 0.05, 0, 0];
const AU_RAISED = [0.3, -0.98, -2.2, -0.78, -0.32, -0.1, 0.8];
const AU_HOLY = [0.3, -0.62, -1.57, -0.58, -1.0, -0.05, 0.6];
const AU_HOLY_STRUCK = [0.66, -0.98, -1.25, -0.98, -0.88, -0.1, 1.1];
const AU_STAGGER = [0.52, 0.3, 1.45, -0.55, 0.25, 0.35, -0.4];
const AU_ROAR0 = [1.0, -0.4, -0.14, -0.5, -0.32, 0.12, 0];
const AU_ROAR1 = [0.34, -1.16, -1.42, -0.98, -0.72, -0.15, 1.35];

registerDraw('boss_aurelia', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const p3 = s.phase >= 2; // D359: the third phase is absolute zero: a halo of ice shards and falling snow
  const [side, aL] = mirrored(s);
  const back = Math.sin(s.facing) < -0.6;
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const holy = s.atk === 'holy' && (s.pose === 'windup' || s.pose === 'attack');
  const w = poseWeights(s);
  const fx = Math.cos(aL);
  const fy = Math.sin(aL);
  // the struck pose follows the facing: the blade sweeps through along it
  const struck = holy ? AU_HOLY_STRUCK : [0.32 + fx * 0.82, -0.46 + fy * 0.6, aL + 0.5, -0.74, -0.26, 0.25, 0.6];
  const p = blendPose(AU_REST, holy ? AU_HOLY : AU_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, AU_STAGGER, 1);
  mixPose(p, p2 ? AU_ROAR1 : AU_ROAR0, R);
  const [hX, hY, swA, oX, oY, lean, spread] = p as [number, number, number, number, number, number, number];
  const hover = p2 ? -r * 0.3 + Math.sin(s.t * 2.4) * r * 0.06 : 0;
  const visor = p2 ? '#ffffff' : MAGIC.glow;

  // floor: shadow (lighter while she hovers) and the cold glow
  groundShadow(ctx, s.x, s.y + r * 0.74, r * (p2 ? 0.8 : 1.05), r * (p2 ? 0.3 : 0.4), p2 ? 0.25 : 0.38);
  glow(ctx, s.x, s.y - r * 0.4 + hover, r * (p2 ? 2.8 : 2.0), MAGIC.glow, (p2 ? 0.35 : 0.2) + Math.sin(s.t * 3) * 0.05 + R * 0.25);
  if (p3) overtimeAura(ctx, s, r, { color: '#7fd4ff', core: '#ffffff', rings: 3, wisps: 'shard', motes: 'flake', count: 8, lift: 0.3 });
  if (holy && ag) glow(ctx, s.x, s.y - r * 1.3 + hover, r * 1.8, HOLY.glow, 0.5 * ak);

  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y + hover);
  ctx.scale(side, 1);
  ctx.translate(0, r * 0.72);
  ctx.scale(1 + s.squash * 0.04, 1 - s.squash * 0.06);
  ctx.translate(0, -r * 0.72);

  const lx = lean * 0.14 * r;
  const fsX = 0.4 * r + lx;
  const fsY = -0.5 * r;
  const bsX = -0.4 * r + lx;
  const bsY = -0.5 * r;
  const headX = 0.04 * r + lx * 1.4 + fx * 0.04 * r;
  const headY = -0.84 * r + Math.max(0, lean) * 0.08 * r;

  // phase 1: the frost wings (behind her, or over her back when she turns away) and the shards behind her
  const wings = (): void => {
    if (!p2) return;
    const flap = Math.sin(s.t * 3.2) * (s.pose === 'windup' ? 1.2 : 0.6) + R * 0.3;
    for (const k of [-1, 1]) {
      glow(ctx, k * r * 0.9, -r * 1.2, r * 1.3, MAGIC.glow, 0.3);
      wing(ctx, s, k * 0.24 * r + lx, -0.6 * r, k, r, spread, flap);
    }
  };
  if (!back) wings();
  const shards = (front: boolean): void => {
    if (!p2) return;
    for (let i = 0; i < 5; i++) {
      const a = s.t * 1.4 + (i * TAU) / 5;
      if (Math.sin(a) > 0 !== front) continue;
      const ox = Math.cos(a) * r * 1.45;
      const oy = -0.35 * r + Math.sin(a) * r * 0.55;
      glow(ctx, ox, oy, r * 0.35, MAGIC.glow, 0.45);
      crystal(ctx, s, ox, oy, r * 0.36, r * 0.09, -1.2 + Math.sin(s.t * 2 + i) * 0.3, i % 2 ? FROST : ICE);
    }
  };
  shards(false);

  // the cape: magic blue, falling behind her and stirring
  const stir = Math.sin(s.t * 2.1) * r * 0.05;
  const cape = [
    -0.36 * r + lx, -0.56 * r,
    0.3 * r + lx, -0.56 * r,
    0.5 * r, 0.2 * r,
    0.46 * r + stir, 0.74 * r,
    0.1 * r + stir * 0.5, 0.66 * r,
    -0.3 * r + stir, 0.8 * r,
    -0.66 * r + stir * 1.4, 0.66 * r,
    -0.62 * r, 0.1 * r,
  ];
  if (!back) shape(ctx, cape, f(s, CAPE), { under: f(s, CAPE_D), uf: 0.5 });

  // the free arm (behind the torso): an armoured hand that prays, balances or casts
  arm2(ctx, bsX, bsY, oX * r, oY * r, r * 0.42, r * 0.42, 1, r * 0.22, r * 0.18, r * 0.15, f(s, STEEL_D));
  oval(ctx, oX * r, oY * r, r * 0.1, r * 0.09, f(s, STEEL), { w: 0.8 });
  claws(ctx, oX * r, oY * r - r * 0.04, -Math.PI / 2 - 0.3, r * 0.13, r * 0.05, 3, 1.0, 0.2, f(s, STEEL));
  if (holy && ag) {
    glow(ctx, oX * r, oY * r, r * 0.7, ag, 0.8 * ak);
    glint(ctx, oX * r, oY * r, r * 0.06, 0.9);
  }

  // legs: plated greaves and pointed sabatons
  const step = Math.sin(s.t * 6) * r * 0.06 * s.moving;
  for (const k of [-1, 1]) {
    const kx = k * 0.17 * r + (k > 0 ? step : -step);
    taper(ctx, k * 0.14 * r, 0.25 * r, kx, 0.66 * r, r * 0.2, r * 0.15, f(s, STEEL_D));
    shape(ctx, [kx - 0.1 * r, 0.62 * r, kx + 0.08 * r + fx * 0.08 * r, 0.64 * r, kx + 0.18 * r + fx * 0.06 * r, 0.72 * r, kx - 0.1 * r, 0.76 * r], f(s, STEEL), { w: 0.8 });
  }

  // fauld and skirt of plates, then the white tabard panel with a blue border
  shape(ctx, [-0.3 * r + lx, 0.02 * r, 0.3 * r + lx, 0.02 * r, 0.38 * r, 0.36 * r, -0.38 * r, 0.36 * r], f(s, STEEL), { uf: 0.5 });
  strokePts(ctx, [-0.34 * r, 0.18 * r, 0.34 * r, 0.18 * r], shade(STEEL_D, 0.8), ow(0.6));
  // breastplate: broad chest, narrow waist
  const chest = [
    -0.4 * r + lx, -0.58 * r,
    0.4 * r + lx, -0.58 * r,
    0.44 * r + lx, -0.3 * r,
    0.27 * r + lx, 0.06 * r,
    -0.27 * r + lx, 0.06 * r,
    -0.44 * r + lx, -0.3 * r,
  ];
  shape(ctx, chest, f(s, STEEL), { under: f(s, STEEL_D), uf: 0.4, hi: s.flash ? null : withAlpha('#ffffff', 0.35) });
  if (!back) {
    const tx = lx + fx * 0.05 * r;
    shape(ctx, [-0.17 * r + tx, -0.5 * r, 0.17 * r + tx, -0.5 * r, 0.21 * r + tx, 0.52 * r, 0.0 + tx, 0.64 * r, -0.21 * r + tx, 0.52 * r], f(s, FROST), { under: f(s, '#d2e2f4'), uf: 0.3 });
    strokePts(ctx, [-0.13 * r + tx, -0.46 * r, -0.17 * r + tx, 0.5 * r, 0 + tx, 0.59 * r, 0.17 * r + tx, 0.5 * r, 0.13 * r + tx, -0.46 * r], f(s, CAPE), ow(0.8));
    // the gold sunburst
    ctx.save();
    ctx.strokeStyle = f(s, GOLD);
    ctx.lineWidth = Math.max(1.5, ow(0.7));
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2;
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(a) * r * 0.05, -0.27 * r + Math.sin(a) * r * 0.05);
      ctx.lineTo(tx + Math.cos(a) * r * 0.12, -0.27 * r + Math.sin(a) * r * 0.12);
      ctx.stroke();
    }
    ctx.restore();
    oval(ctx, tx, -0.27 * r, r * 0.04, r * 0.04, f(s, GOLD), { under: null, w: 0.6 });
  }
  // belt
  shape(ctx, [-0.3 * r + lx, -0.02 * r, 0.3 * r + lx, -0.02 * r, 0.3 * r + lx, 0.06 * r, -0.3 * r + lx, 0.06 * r], f(s, GOLD), { under: null, w: 0.7 });
  if (back) {
    shape(ctx, cape, f(s, CAPE), { under: f(s, CAPE_D), uf: 0.5 });
    wings();
  }

  // pauldrons: three layered plates each, gold-rimmed (the back one first)
  const pauldron = (px0: number, py0: number, k: number): void => {
    for (let i = 2; i >= 0; i--) {
      const yy = py0 + i * 0.08 * r;
      const ww = (0.27 - i * 0.03) * r;
      shape(ctx, [px0 - ww * k * 0.6, yy - 0.1 * r, px0 + ww * k, yy - 0.06 * r, px0 + ww * k * 1.1, yy + 0.06 * r, px0 + ww * k * 0.2, yy + 0.1 * r, px0 - ww * k * 0.7, yy + 0.04 * r], f(s, i === 0 ? '#dce8f6' : STEEL), { smooth: true, under: f(s, STEEL_D), uf: 0.45, w: 0.85 });
    }
    strokePts(ctx, [px0 - 0.14 * r * k, py0 - 0.08 * r, px0 + 0.22 * r * k, py0 - 0.04 * r], f(s, GOLD), Math.max(1.5, ow(0.6)));
  };
  pauldron(bsX - 0.02 * r, bsY - 0.04 * r, -1);

  // the great helm: a tall sugarloaf with a cross visor glowing blue, a crown of icicles, the halo above
  ctx.save();
  ctx.translate(headX, headY);
  ctx.scale(1.15, 1.15);
  const haloY = -0.74 * r + Math.sin(s.t * 2) * r * 0.025;
  const blaze = (p2 ? 0.8 : 0.45) + R * 0.4 + (holy ? ak * 0.5 : 0);
  glow(ctx, 0, haloY - r * 0.1, r * (0.7 + blaze * 0.35), holy ? HOLY.glow : GOLD, blaze * 0.7);
  shape(ctx, [-0.12 * r, 0.08 * r, 0.12 * r, 0.08 * r, 0.14 * r, 0.16 * r, -0.14 * r, 0.16 * r], f(s, STEEL_D), { under: null, w: 0.8 });
  const helm = [-0.23 * r, 0.08 * r, -0.26 * r, -0.2 * r, -0.2 * r, -0.4 * r, 0, -0.56 * r, 0.2 * r, -0.4 * r, 0.26 * r, -0.2 * r, 0.23 * r, 0.08 * r, 0, 0.14 * r];
  shape(ctx, helm, f(s, '#d2deee'), { under: f(s, STEEL_D), uf: 0.4, hi: s.flash ? null : withAlpha('#ffffff', 0.45) });
  strokePts(ctx, [-0.24 * r, -0.26 * r, 0.24 * r, -0.26 * r], f(s, GOLD), Math.max(1.5, ow(0.7)));
  if (!back) {
    const vx = fx * 0.05 * r;
    const vy = -0.13 * r + fy * 0.02 * r;
    const vk = 1 + R * 0.5 + (ag && !holy ? ak * 0.4 : 0);
    glow(ctx, vx, vy, r * 0.26 * vk, visor, 0.55);
    ctx.save();
    ctx.lineCap = 'round';
    for (const [c, wd] of [[OUTLINE, r * 0.075 + ow(0.6)], [visor, r * 0.05]] as const) {
      ctx.strokeStyle = c;
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.moveTo(vx - 0.16 * r, vy);
      ctx.lineTo(vx + 0.16 * r, vy);
      ctx.moveTo(vx, vy - 0.02 * r);
      ctx.lineTo(vx, vy + 0.15 * r);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    strokePts(ctx, [0, -0.5 * r, 0, 0.1 * r], STEEL_D, ow(0.8));
  }
  // crown of icicles along the band
  for (let i = 0; i < 5; i++) {
    const k = (i - 2) / 2;
    horn(ctx, k * 0.19 * r, -0.28 * r - (1 - Math.abs(k)) * 0.04 * r, -Math.PI / 2 + k * 0.35, r * (0.16 + (1 - Math.abs(k)) * 0.1), r * 0.06, 0, f(s, ICE), 0.7);
  }
  // halo: gold ring (rays and a blaze once the ice is gone)
  if (p2 || R > 0 || holy) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = withAlpha(HOLY.glow, clamp01(0.4 + blaze * 0.4));
    ctx.lineWidth = Math.max(1.5, ow(0.6));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + s.t * 0.4;
      const l = r * (0.55 + (i % 2) * 0.18) * (0.9 + blaze * 0.2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.42, haloY + Math.sin(a) * r * 0.16);
      ctx.lineTo(Math.cos(a) * l, haloY + Math.sin(a) * l * 0.42);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = r * 0.075 + ow(1.2);
  ctx.beginPath();
  ctx.ellipse(0, haloY, r * 0.38, r * 0.12, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = f(s, holy ? HOLY.glow : GOLD);
  ctx.lineWidth = r * 0.075;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // the sword arm and its front pauldron
  const hx = hX * r + lx;
  const hy = hY * r;
  arm2(ctx, fsX, fsY, hx, hy, r * 0.42, r * 0.42, -1, r * 0.23, r * 0.19, r * 0.16, f(s, STEEL));
  pauldron(fsX + 0.02 * r, fsY - 0.04 * r, 1);

  // phase 0: the block of ice around her, cracking as her HP falls toward the threshold (and in the roar)
  if (!p2) {
    const bc = -0.32 * r;
    const block = [-0.78 * r, -1.42 * r, -0.2 * r, -1.62 * r, 0.52 * r, -1.48 * r, 0.98 * r, -0.92 * r, 1.02 * r, 0.12 * r, 0.82 * r, 0.86 * r, 0.0, 0.98 * r, -0.86 * r, 0.86 * r, -1.04 * r, 0.02 * r, -0.98 * r, -0.92 * r];
    ctx.save();
    ctx.globalAlpha *= 0.36;
    shape(ctx, block, s.flash ? '#ffffff' : ICE, { under: s.flash ? null : '#8cc8f4', uf: 0.3, w: 0 });
    ctx.restore();
    shape(ctx, block, 'rgba(0,0,0,0)', { under: null, outline: '#eaf6ff', w: 1 });
    // facets
    strokePts(ctx, [-0.78 * r, -1.42 * r, -0.36 * r, -0.62 * r, 0.98 * r, -0.92 * r], withAlpha('#ffffff', 0.55), Math.max(1.5, ow(0.6)));
    strokePts(ctx, [-0.36 * r, -0.62 * r, -0.3 * r, 0.98 * r], withAlpha('#ffffff', 0.4), Math.max(1.5, ow(0.6)));
    strokePts(ctx, [-0.36 * r, -0.62 * r, -1.04 * r, 0.02 * r], withAlpha('#ffffff', 0.3), Math.max(1.5, ow(0.6)));
    // crystals jutting from the top and the base
    for (const [cx0, cy0, len, a] of [[-0.45, -1.55, 0.45, -1.9], [0.15, -1.62, 0.6, -1.5], [0.7, -1.32, 0.4, -1.0], [-0.95, 0.75, 0.35, -2.4], [0.95, 0.72, 0.38, -0.7]] as const) {
      ctx.save();
      ctx.globalAlpha *= 0.85;
      crystal(ctx, s, cx0 * r, cy0 * r, len * r, len * r * 0.24, a, ICE);
      ctx.restore();
    }
    // cracks: none at full HP, all of them by 50%; the roar bursts them all
    const dmg = clamp01(Math.max((1 - s.hpFrac) / 0.5, R));
    const n = Math.round(dmg * CRACKS.length);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (n > 0) glow(ctx, 0, bc, r * (0.8 + dmg * 0.8), MAGIC.glow, 0.25 * dmg);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, ow(0.8));
    for (let i = 0; i < n; i++) crack(ctx, 0, bc, CRACKS[i]![0], r * 0.98 * CRACKS[i]![1]);
    ctx.restore();
    glint(ctx, -0.62 * r, -1.0 * r, r * 0.09, 0.9);
    glint(ctx, -0.48 * r, -0.72 * r, r * 0.045, 0.8);
    // the roar: shards burst off the block
    if (R > 0) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.3;
        const d = r * (1.05 + clamp01(s.poseT / 0.5) * 0.55 + hash(i) * 0.2);
        ctx.save();
        ctx.globalAlpha *= clamp01(R) * (1 - clamp01((s.poseT - 0.8) / 1.5) * 0.6);
        crystal(ctx, s, Math.cos(a) * d, bc + Math.sin(a) * d * 0.85, r * 0.22, r * 0.06, a, i % 2 ? FROST : ICE);
        ctx.restore();
      }
    }
  }

  // the sword: gold winged guard, a long blade with a glowing fuller; charged and trailing in the attack's colour
  const dx = Math.cos(swA);
  const dy = Math.sin(swA);
  const px = -dy;
  const py = dx;
  const bl = r * 1.72;
  const gx = hx + dx * r * 0.13;
  const gy = hy + dy * r * 0.13;
  const tx = gx + dx * bl;
  const ty = gy + dy * bl;
  if (ag && !holy) {
    if (s.pose === 'attack') {
      const ra = AU_RAISED[2]!;
      const a0 = Math.atan2(AU_RAISED[1]! * r + Math.sin(ra) * bl * 0.6 - fsY, AU_RAISED[0]! * r + Math.cos(ra) * bl * 0.6 - fsX);
      const a1 = Math.atan2(gy + dy * bl * 0.6 - fsY, gx + dx * bl * 0.6 - fsX);
      trail(ctx, fsX, fsY, Math.hypot(gx + dx * bl - fsX, gy + dy * bl - fsY), bl * 0.75, a0, a1, ag, ak);
    }
    glowLine(ctx, gx, gy, tx, ty, r * 0.4, ag, 0.55 * ak, 5);
  } else if (R > 0) glowLine(ctx, gx, gy, tx, ty, r * 0.35, MAGIC.glow, 0.5 * R, 5);
  const bw = r * 0.09;
  shape(ctx, [gx + px * bw, gy + py * bw, tx - dx * r * 0.18 + px * bw * 0.6, ty - dy * r * 0.18 + py * bw * 0.6, tx, ty, tx - dx * r * 0.18 - px * bw * 0.6, ty - dy * r * 0.18 - py * bw * 0.6, gx - px * bw, gy - py * bw], f(s, BLADE), { under: f(s, '#a6c6e6'), uf: 0.5, w: 0.9 });
  ctx.save();
  ctx.globalAlpha *= 0.85;
  strokePts(ctx, [gx + dx * r * 0.08, gy + dy * r * 0.08, tx - dx * r * 0.3, ty - dy * r * 0.3], s.flash ? '#ffffff' : ag && !holy ? ag : MAGIC.glow, Math.max(1.5, bw * 0.55));
  ctx.restore();
  // guard: swept gold wings
  const gw = r * 0.2;
  shape(ctx, [gx + px * gw - dx * r * 0.08, gy + py * gw - dy * r * 0.08, gx + px * gw * 0.4, gy + py * gw * 0.4, gx + dx * r * 0.04, gy + dy * r * 0.04, gx - px * gw * 0.4, gy - py * gw * 0.4, gx - px * gw - dx * r * 0.08, gy - py * gw - dy * r * 0.08, gx - dx * r * 0.05, gy - dy * r * 0.05], f(s, GOLD), { under: null, w: 0.8 });
  // grip and pommel behind the hand
  taper(ctx, hx - dx * r * 0.18, hy - dy * r * 0.18, gx, gy, r * 0.06, r * 0.06, f(s, '#4a3a6a'), 0.7);
  oval(ctx, hx - dx * r * 0.21, hy - dy * r * 0.21, r * 0.055, r * 0.055, f(s, GOLD), { under: null, w: 0.7 });
  // gauntlet over the grip
  oval(ctx, hx, hy, r * 0.1, r * 0.09, f(s, '#dce8f6'), { w: 0.8 });
  shards(true);
  ctx.restore();

  if (R > 0) roarLines(ctx, s.x + side * headX, s.y + hover + headY - r * 0.1, r * 0.9, R, s.t, MAGIC.glow);
  if (s.pose === 'stagger') dizzy(ctx, s.x + side * headX, s.y + hover + headY - r * 0.75, r * 0.45, s.t);
});

// ---------------------------------------------------------------- the ice mirrors (1 HP, reflect projectiles)
// A tall gothic-arch mirror on a frosted plinth: an ice frame with gold filigree and a finial, the glass
// pale and cold with a shine that sweeps across it.
registerDraw('aurelia_mirror', (ctx, s) => {
  const r = begin(s);
  const x = s.x;
  const y = s.y;
  groundShadow(ctx, x, y + r * 0.62, r * 0.95, r * 0.34, 0.32);
  glow(ctx, x, y - r * 0.9, r * 2.2, MAGIC.glow, 0.3 + Math.sin(s.t * 4 + s.variant) * 0.08);
  // the plinth
  shape(ctx, [x - r * 0.85, y + r * 0.62, x - r * 0.62, y + r * 0.22, x + r * 0.62, y + r * 0.22, x + r * 0.85, y + r * 0.62], f(s, '#a8d8f8'), { under: f(s, '#7cb2dc'), w: 0.9 });
  shape(ctx, [x - r * 0.66, y + r * 0.26, x - r * 0.56, y + r * 0.06, x + r * 0.56, y + r * 0.06, x + r * 0.66, y + r * 0.26], f(s, '#cfeaff'), { under: null, w: 0.8 });
  // the arch: outer ice frame, gold filigree, then the glass
  const arch = (k: number, top: number): number[] => {
    const wd = r * 0.86 * k;
    const base = y + r * 0.08;
    const spring = y - r * 1.1;
    return [x - wd, base, x - wd, spring, x - wd * 0.85, spring - r * 0.5 * k, x - wd * 0.45, spring - r * 0.9 * k, x, top, x + wd * 0.45, spring - r * 0.9 * k, x + wd * 0.85, spring - r * 0.5 * k, x + wd, spring, x + wd, base];
  };
  const outer = arch(1, y - r * 2.45);
  shape(ctx, outer, f(s, '#86c4ee'), { under: f(s, '#5c9cd0'), uf: 0.3 });
  const mid = arch(0.78, y - r * 2.2);
  shape(ctx, mid, f(s, GOLD), { under: f(s, '#a8862a'), uf: 0.2, w: 0.5 });
  const glass = arch(0.64, y - r * 1.98);
  shape(ctx, glass, f(s, '#e6f4ff'), { under: f(s, '#bcdcf6'), uf: 0.35, w: 0.6 });
  // the shine sweeps across the glass
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(glass[0]!, glass[1]!);
  for (let i = 2; i < glass.length; i += 2) ctx.lineTo(glass[i]!, glass[i + 1]!);
  ctx.closePath();
  ctx.clip();
  const k = ((s.t * 0.6 + s.variant * 0.3) % 1) * 2.4 - 0.7;
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  ctx.beginPath();
  ctx.moveTo(x - r + k * r * 2, y - r * 2.4);
  ctx.lineTo(x - r * 0.62 + k * r * 2, y - r * 2.4);
  ctx.lineTo(x - r * 1.5 + k * r * 2, y + r * 0.3);
  ctx.lineTo(x - r * 1.88 + k * r * 2, y + r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha(MAGIC.glow, 0.25);
  ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.5);
  ctx.restore();
  // icicle finial and side spikes
  shape(ctx, [x - r * 0.12, y - r * 2.38, x, y - r * 3.0, x + r * 0.12, y - r * 2.38], f(s, FROST), { under: null, w: 0.8 });
  for (const k2 of [-1, 1]) {
    const bx = x + k2 * r * 0.72;
    shape(ctx, [bx - r * 0.08, y - r * 1.05, bx + k2 * r * 0.34, y - r * 1.45, bx + r * 0.08, y - r * 1.15], f(s, FROST), { under: null, w: 0.7 });
    oval(ctx, bx, y - r * 1.1, r * 0.1, r * 0.1, f(s, GOLD), { w: 0.7 });
  }
  glint(ctx, x - r * 0.3, y - r * 1.5, r * 0.1, 0.9);
});
