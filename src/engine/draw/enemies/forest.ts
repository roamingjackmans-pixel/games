// Hollow Forest roster draw functions (rust orange, pine green, amber, bark brown — ART_AUDIO §2).
// Upright bodies are drawn facing right inside a mirrored local frame (shapesA.upright); beasts are drawn top-down,
// rotated to their facing. Units inside a body are multiples of its radius u.
import { ELEMENTS } from '../../../game/elements';
import { OUTLINE, glow, mix, shade, shadow, spec, withAlpha } from '../parts';
import { registerDraw, type DrawState } from '../registry';
import {
  arm,
  atkGlow,
  bob,
  bow,
  capsule,
  claws,
  cord,
  dot,
  elemGlow,
  facing,
  flat,
  heat,
  hot,
  inside,
  J,
  light,
  line,
  mark,
  oval,
  shape,
  skull,
  streak,
  striking,
  swoosh,
  taper,
  teeth,
  upright,
} from '../shapesA';

const RUST = '#c8621f';
const PINE = '#2f5a32';
const AMBER = '#e6b84a';
const BONE = '#ece6d0';
const PIXIE_COLORS = ['#f08ab0', '#9ad0ff', '#b8f090', '#ffd27a', '#d0a0ff'];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

// ---------------------------------------------------------------- Hollow Wolf
// A gaunt wolf seen from above: a spiky mane over the shoulders, a hollowed flank where pale ribs show over the
// dark inside, long jointed legs, a bushy pale-tipped tail, a long snout with ears laid back and amber eyes.
const WO_FUR = '#6e665e';
const WO_FUR_U = shade(WO_FUR, 0.64);
const WO_MANE = '#4e4842';
const WO_BODY = [-0.95, 0, -0.8, -0.34, -0.2, -0.32, 0.4, -0.4, 0.78, -0.26, 0.9, 0, 0.78, 0.26, 0.4, 0.4, -0.2, 0.32, -0.8, 0.34];
const WO_MANE_P = [
  0.0, -0.36, 0.0, -0.36, 0.1, -0.58, 0.1, -0.58, 0.24, -0.46, 0.34, -0.66, 0.34, -0.66, 0.46, -0.48, 0.6, -0.6, 0.6, -0.6, 0.7, -0.36, 0.86, -0.3, 0.92, 0, 0.86, 0.3, 0.7, 0.36, 0.6,
  0.6, 0.6, 0.6, 0.46, 0.48, 0.34, 0.66, 0.34, 0.66, 0.24, 0.46, 0.1, 0.58, 0.1, 0.58, 0.0, 0.36, 0.0, 0.36, -0.1, 0,
];
const WO_HEAD = [-0.26, -0.28, 0.14, -0.3, 0.46, -0.16, 0.86, -0.08, 0.86, -0.08, 0.86, 0.08, 0.86, 0.08, 0.46, 0.16, 0.14, 0.3, -0.26, 0.28];
const WO_EAR = [0.0, -0.14, -0.36, -0.52, -0.36, -0.52, -0.14, -0.04];

registerDraw('forest_wolf', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u * 1.1);
  const run = Math.sin(s.t * 16) * (0.25 + s.moving * 0.75);
  const stretch = s.pose === 'attack' ? 1.25 : s.pose === 'windup' ? 0.88 : 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  ctx.scale(stretch, 1 - s.squash * 0.08);
  // bushy tail with a pale tip
  const wag = Math.sin(s.t * 9) * 0.35;
  taper(ctx, s, [-0.85 * u, 0, -1.25 * u, wag * 0.3 * u, -1.65 * u, wag * 0.5 * u, -1.9 * u, wag * 0.55 * u], 0.42 * u, 0.12 * u, WO_FUR, WO_FUR_U, 2);
  oval(ctx, s, -1.85 * u, wag * 0.55 * u, 0.14 * u, 0.12 * u, '#c8c0b4', 1.5);
  // four scissoring jointed legs
  for (const [hx, side, k] of [
    [0.45, 1, 1],
    [0.45, -1, -1],
    [-0.6, 1, -1],
    [-0.6, -1, 1],
  ] as const) {
    const px = (hx + (hx > 0 ? 0.32 : -0.22)) * u + k * run * 0.3 * u;
    arm(ctx, s, hx * u, side * 0.26 * u, px, side * 0.86 * u, 0.36 * u, 0.36 * u, side * (hx > 0 ? -1 : 1), 0.14 * u, 0.1 * u, 0.08 * u, '#4a4440', 2);
    claws(ctx, s, J[2]!, J[3]!, hx > 0 ? 0 : Math.PI, 0.14 * u, 3, 1.1, '#d8d0c0', 1.2);
  }
  shape(ctx, s, WO_BODY, u, WO_FUR, WO_FUR_U, 0.14, 2.5);
  // the hollow: a dark open flank with pale ribs over it
  if (!s.flash) {
    oval(ctx, null, -0.22 * u, 0, 0.36 * u, 0.22 * u, '#1a1418', 1.5);
    ctx.strokeStyle = BONE;
    ctx.lineWidth = Math.max(1.2, 0.07 * u);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const x = (-0.42 + i * 0.2) * u;
      ctx.moveTo(x, -0.2 * u);
      ctx.quadraticCurveTo(x + 0.08 * u, 0, x, 0.2 * u);
    }
    ctx.stroke();
    glow(ctx, -0.22 * u, 0, 0.4 * u, elemGlow(s, AMBER), 0.25);
  }
  shape(ctx, s, WO_MANE_P, u, WO_MANE, shade(WO_MANE, 0.7), 0.1, 2);
  // head with laid-back ears and a long snout
  ctx.save();
  ctx.translate(0.9 * u, 0);
  shape(ctx, s, WO_EAR, u, WO_MANE, null, 0, 2);
  ctx.save();
  ctx.scale(1, -1);
  shape(ctx, s, WO_EAR, u, WO_MANE, null, 0, 2);
  ctx.restore();
  shape(ctx, s, WO_HEAD, u, mix(WO_FUR, '#ffffff', 0.12), WO_FUR_U, 0.08, 2.5);
  const bite = s.pose === 'windup' || s.pose === 'attack';
  if (bite && !s.flash) {
    const g = s.pose === 'attack' ? 0.2 : 0.12;
    flat(ctx, s, [0.36, 0, 0.92, -g, 0.92, g], u, heat(s, '#3a0c14', 0.4), 1.5);
    teeth(ctx, s, 0.42 * u, -0.03 * u, 0.9 * u, -g * u, 4, -0.07 * u, heat(s, '#f4f0e0'), 0.5);
    teeth(ctx, s, 0.9 * u, g * u, 0.42 * u, 0.03 * u, 4, -0.07 * u, heat(s, '#f4f0e0'), 0.5);
  }
  if (!s.flash) {
    const eye = elemGlow(s, AMBER);
    dot(ctx, 0.3 * u, -0.15 * u, Math.max(1.2, 0.07 * u), eye);
    dot(ctx, 0.3 * u, 0.15 * u, Math.max(1.2, 0.07 * u), eye);
    dot(ctx, 0.86 * u, 0, Math.max(1, 0.06 * u), '#1a1418');
  }
  ctx.restore();
  ctx.restore();
  light(0);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  glow(ctx, s.x + fx * u * 1.2, s.y + fy * u * 1.2, 9, elemGlow(s, AMBER), 0.3);
  hot(ctx, s, s.x + fx * u * 1.7, s.y + fy * u * 1.7, u * 1.1);
  if (s.pose === 'attack') streak(ctx, s, s.x + fx * u * 1.0, s.y + fy * u * 1.0, s.x + fx * u * 2.1, s.y + fy * u * 2.1, u * 0.32);
});

// ---------------------------------------------------------------- Thornling
// A hopping bramble imp: a ball of hooked thorns around a mossy body, a scowling face with glowing eyes and a
// jagged mouth, twig arms with thorn claws, twig legs, and a sprout on top. It bristles before a burst.
const TH_MOSS = '#4f7e34';
const TH_THORN = '#7e5022';

registerDraw('forest_thornling', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  const hop = Math.abs(Math.sin(s.t * 7 + s.variant * 1.3)) * 0.45 * u * (0.3 + s.moving * 0.7);
  shadow(ctx, s.x, s.y, u * 0.9, 0.32 - hop * 0.01);
  const bristle = s.pose === 'windup' ? 1.55 : s.pose === 'attack' ? 1.7 : 1.3;
  ctx.save();
  upright(ctx, s, f, u, -hop);
  // twig legs
  for (const side of [-1, 1]) {
    const tuck = hop > 0.1 * u ? 0.1 * u : 0;
    capsule(ctx, s, side * 0.24 * u, 0.4 * u, side * 0.32 * u, 0.72 * u - tuck, 0.07 * u, 0.06 * u, '#5a3a1a', 1.5);
    claws(ctx, s, side * 0.32 * u, 0.74 * u - tuck, side > 0 ? 0.2 : Math.PI - 0.2, 0.14 * u, 3, 1.3, '#5a3a1a', 1.2);
  }
  // the burr of thorns (spikes glow in the attack colour while bristling)
  const cy = -0.05 * u;
  starPath(ctx, 0, cy, 10, u * 0.78, u * bristle * 0.95, s.t * 0.5);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = s.flash ? '#ffffff' : heat(s, TH_THORN, 0.8);
  ctx.fill();
  hot(ctx, s, 0, cy, u * bristle * 1.2, 0.6);
  // mossy body
  shape(ctx, s, [-0.78, 0.1, -0.7, -0.5, 0.0, -0.84, 0.7, -0.5, 0.78, 0.1, 0.5, 0.62, 0.0, 0.72, -0.5, 0.62], u, TH_MOSS, shade(TH_MOSS, 0.64), 0.14, 2.5);
  if (!s.flash) {
    mark(ctx, s, [-0.5, -0.4, -0.2, -0.62, 0.1, -0.6, -0.2, -0.4], u, withAlpha('#7ab04a', 0.8));
  }
  // twig arms with thorn claws
  const swipe = s.pose === 'attack' ? 0.5 : s.pose === 'windup' ? -0.2 : 0.15;
  for (const side of [-1, 1]) {
    const sx = side * 0.66 * u;
    const tx = sx + side * 0.25 * u + f.ax * swipe * u;
    const ty = 0.1 * u + f.ay * swipe * u - (s.pose === 'windup' ? 0.3 * u : 0);
    arm(ctx, s, sx, -0.05 * u, tx, ty, 0.22 * u, 0.22 * u, side, 0.07 * u, 0.06 * u, 0.05 * u, '#6a4420', 1.5);
    claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.18 * u, 3, 1.2, heat(s, '#d8c890'), 1.2);
  }
  // scowling face
  if (!s.flash && !f.back) {
    const c = 0.16 * fw * u;
    const eye = elemGlow(s, '#f4e870');
    for (const side of [-1, 1]) {
      const ex = c + side * 0.24 * u;
      flat(ctx, s, [ex / u - 0.14, -0.22, ex / u + 0.14, -0.22 + side * 0.08 * -1 + 0.08, ex / u + 0.1, -0.04, ex / u - 0.12, -0.06], u, '#1a1408', 0);
      dot(ctx, ex, -0.11 * u, Math.max(1.1, 0.07 * u), eye);
    }
    glow(ctx, c, -0.11 * u, 0.6 * u, eye, 0.3);
    const gape = s.pose === 'windup' ? 0.14 : 0.06;
    ctx.save();
    ctx.translate(c, 0.24 * u);
    flat(ctx, s, [-0.28, -0.02, 0.28, -0.02, 0.18, gape + 0.06, -0.18, gape + 0.06], u, '#2a1408', 1.5);
    teeth(ctx, s, -0.26 * u, -0.02 * u, 0.26 * u, -0.02 * u, 5, -0.07 * u, '#e8e0b0', 0.5);
    ctx.restore();
  }
  // sprout on top
  cord(ctx, s, 0, -0.78 * u, 0.05 * u, -1.0 * u, 0.12 * u, -1.12 * u, Math.max(1.5, 0.08 * u), '#5a8a3a', 1.5);
  ctx.save();
  ctx.translate(0.12 * u, -1.12 * u);
  ctx.rotate(-0.6 + Math.sin(s.t * 3) * 0.2);
  shape(ctx, s, [0, 0, 0.18, -0.12, 0.36, 0, 0.18, 0.1], u, '#7ab04a', null, 0, 1.5);
  ctx.restore();
  ctx.restore();
});

// ---------------------------------------------------------------- Fey Archer
// A slender fey hunter: shimmering dragonfly wings, a leaf-petal cloak and hood, long pointed ears and a sharp
// face, bending a living-branch bow whose nocked arrow glows in the attack colour.
const FE_SKIN = '#e8dcc0';
const FE_LEAF = '#4a8a4a';
const FE_LEAF_D = '#2f6234';
const FE_WING = [0.0, 0.0, 0.3, -0.28, 0.95, -0.42, 1.12, -0.32, 1.0, -0.18, 0.4, -0.02];
const FE_SKIRT = [-0.32, -0.2, 0.32, -0.2, 0.44, 0.24, 0.3, 0.5, 0.3, 0.5, 0.16, 0.32, 0.02, 0.56, 0.02, 0.56, -0.12, 0.32, -0.28, 0.5, -0.28, 0.5, -0.44, 0.24];
const FE_HOOD = [-0.42, 0.16, -0.46, -0.24, -0.2, -0.52, 0.12, -0.6, 0.12, -0.6, 0.3, -0.42, 0.46, -0.18, 0.44, 0.16, 0.0, 0.3];

registerDraw('forest_fey_archer', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u * 0.8);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.5, 4) - 3);
  // four dragonfly wings behind the shoulders, buzzing
  const flap = 0.75 + Math.abs(Math.sin(s.t * 13)) * 0.3;
  if (!s.flash) {
    ctx.save();
    ctx.globalAlpha *= 0.6;
    for (const [side, rot, k] of [
      [-1, -0.35, 1],
      [1, -0.35, 1],
      [-1, 0.25, 0.8],
      [1, 0.25, 0.8],
    ] as const) {
      ctx.save();
      ctx.translate(side * 0.1 * u, -0.38 * u);
      ctx.scale(side * flap * k, k);
      ctx.rotate(rot);
      shape(ctx, s, FE_WING, u, '#d8f4e0', null, 0, 1.2);
      ctx.strokeStyle = withAlpha('#3a7a5a', 0.6);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0.1 * u, -0.05 * u);
      ctx.lineTo(1.0 * u, -0.3 * u);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  // slender legs in pointed boots
  const step = Math.sin(s.t * 4) * 0.08 * u * s.moving;
  for (const [hx, fx2, c] of [
    [-0.1, -0.14 - step / u, FE_LEAF_D],
    [0.1, 0.16 + step / u, '#3a6a3a'],
  ] as const) {
    capsule(ctx, s, hx * u, 0.3 * u, fx2 * u, 0.66 * u, 0.07 * u, 0.055 * u, c, 1.5);
    flat(ctx, s, [fx2 - 0.06, 0.62, fx2 + 0.08, 0.64, fx2 + 0.2, 0.7, fx2 - 0.06, 0.74], u, '#5a3a20', 1.5);
  }
  // leaf-petal cloak over a slender body
  shape(ctx, s, [-0.22, -0.44, 0.22, -0.44, 0.24, 0.0, 0.0, 0.1, -0.24, 0.0], u, '#3f7a4a', FE_LEAF_D, 0.08, 2);
  shape(ctx, s, FE_SKIRT, u, FE_LEAF, FE_LEAF_D, 0.12, 2);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#1e4224', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const x of [-0.28, 0.02, 0.3]) {
      ctx.moveTo(x * 0.6 * u, -0.1 * u);
      ctx.lineTo(x * u, 0.46 * u);
    }
    ctx.stroke();
    line(ctx, -0.24 * u, -0.08 * u, 0.24 * u, -0.08 * u, Math.max(1.5, 0.07 * u), RUST);
  }
  // bow and arms
  const pull = s.pose === 'windup' ? Math.min(1, 0.3 + s.poseT * 1.6) : 0;
  const released = s.pose === 'attack' || s.pose === 'recover';
  const sx = 0.18 * u;
  const sy = -0.38 * u;
  const gx = sx + f.ax * 0.6 * u;
  const gy = sy + f.ay * 0.55 * u + 0.05 * u;
  const drawBow = (): void => {
    bow(ctx, s, gx, gy, f.aim, 0.85 * u, released ? 0 : pull, heat(s, AMBER, 0.3), Math.max(2.5, 0.12 * u), '#f4f0e0');
    const nx = J[0]!;
    const ny = J[1]!;
    if (pull > 0) {
      const tx = nx + f.ax * 1.05 * u;
      const ty = ny + f.ay * 1.05 * u;
      line(ctx, nx, ny, tx, ty, 2, '#c8b080');
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(f.aim);
      flat(ctx, s, [0, -0.09, 0.24, 0, 0, 0.09], u, heat(s, '#b8f090', 0.9), 1.5);
      ctx.restore();
      hot(ctx, s, tx, ty, 0.6 * u);
    }
    arm(ctx, s, -0.16 * u, -0.38 * u, nx, ny, 0.28 * u, 0.28 * u, -1, 0.06 * u, 0.055 * u, 0.05 * u, FE_SKIN, 1.5);
    arm(ctx, s, sx, sy, gx, gy, 0.3 * u, 0.3 * u, 1, 0.06 * u, 0.055 * u, 0.05 * u, FE_SKIN, 1.5);
    if (released) streak(ctx, s, gx, gy, gx + f.ax * 1.9 * u, gy + f.ay * 1.9 * u, 0.25 * u);
  };
  if (f.back) drawBow();
  // head: long ears, sharp face, leaf hood
  ctx.save();
  ctx.translate(0.06 * fw * u, -0.7 * u);
  const h = 0.64 * u;
  for (const side of [-1, 1]) flat(ctx, s, [side * 0.3, -0.04, side * 0.9, -0.4, side * 0.9, -0.4, side * 0.36, -0.2], h, side < 0 && fw > 0.5 ? shade(FE_SKIN, 0.85) : FE_SKIN, 2, true);
  shape(ctx, s, FE_HOOD, h, FE_LEAF, FE_LEAF_D, 0.08, 2);
  if (!f.back) {
    // cut the face opening out of the hood
    ctx.save();
    ctx.translate(0.12 * fw * h, 0.04 * h);
    oval(ctx, s, 0, -0.04 * h, 0.26 * h, 0.28 * h, FE_SKIN, 0);
    if (!s.flash) {
      const sp = (0.12 - 0.03 * fw) * h;
      const eye = elemGlow(s, '#58d66a');
      oval(ctx, null, -sp, -0.08 * h, 0.07 * h, 0.05 * h, eye, 0, 0.3);
      oval(ctx, null, sp, -0.08 * h, 0.07 * h, 0.05 * h, eye, 0, -0.3);
      glow(ctx, 0, -0.08 * h, 0.4 * h, eye, 0.3);
      line(ctx, -0.06 * h, 0.12 * h, 0.08 * h, 0.11 * h, 1, '#6a4a3a');
      spec(ctx, -0.12 * h, -0.2 * h, 1.2, 0.5);
    }
    ctx.restore();
  }
  ctx.restore();
  if (!f.back) drawBow();
  ctx.restore();
});

// ---------------------------------------------------------------- Treant
// A walking tree: a gnarled trunk with a carved face (glowing eye-knots and a hollow maw), heavy branch arms
// with twig fingers, splayed root feet, moss, and a crown of pine and autumn leaves.
const TR_BARK = '#7a5430';
const TR_BARK_U = shade(TR_BARK, 0.6);
const TR_TRUNK = [-0.5, 0.56, -0.62, 0.1, -0.5, -0.4, -0.3, -0.8, 0.3, -0.8, 0.5, -0.4, 0.6, 0.1, 0.5, 0.56, 0.2, 0.64, -0.2, 0.64];
const TR_LEAVES: readonly (readonly [number, number, number, string])[] = [
  [-0.62, -1.0, 0.42, PINE],
  [0.6, -0.98, 0.4, PINE],
  [-0.25, -1.28, 0.46, '#3a6a3a'],
  [0.28, -1.32, 0.44, '#2a5230'],
  [0.0, -1.0, 0.4, '#3e7040'],
];

function treantArm(ctx: CanvasRenderingContext2D, s: DrawState, u: number, sx: number, sy: number, ax: number, ay: number, side: number, fill: string): void {
  let tx: number;
  let ty: number;
  if (s.pose === 'windup') {
    tx = sx + side * 0.25 * u - ax * 0.1 * u;
    ty = sy - 0.75 * u;
  } else if (s.pose === 'attack') {
    tx = sx + ax * 0.95 * u;
    ty = sy + ay * 0.8 * u + 0.35 * u;
  } else {
    tx = sx + side * 0.25 * u + ax * 0.35 * u;
    ty = sy + 0.5 * u + ay * 0.2 * u + Math.sin(s.t * 1.6 + side) * 0.04 * u;
  }
  arm(ctx, s, sx, sy, tx, ty, 0.44 * u, 0.42 * u, side, 0.2 * u, 0.15 * u, 0.12 * u, fill, 2.5);
  const a = Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!);
  const hx = J[2]!;
  const hy = J[3]!;
  // twig fingers
  for (let i = -1; i <= 1; i++) {
    const fa = a + i * 0.55;
    cord(ctx, s, hx, hy, hx + Math.cos(fa) * 0.18 * u, hy + Math.sin(fa) * 0.18 * u, hx + Math.cos(fa + i * 0.3) * 0.32 * u, hy + Math.sin(fa + i * 0.3) * 0.32 * u, Math.max(2, 0.07 * u), heat(s, fill, 0.6), 1.5);
  }
  hot(ctx, s, hx, hy, 0.8 * u);
}

registerDraw('forest_treant', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y + 4, u * 1.1, 0.4);
  ctx.save();
  upright(ctx, s, f, u, 0);
  ctx.rotate(Math.sin(s.t * 1.6) * 0.04 + s.moving * Math.sin(s.t * 4) * 0.04);
  // splayed root feet
  const step = Math.sin(s.t * 4) * 0.08 * u * s.moving;
  for (let i = -2; i <= 2; i++) {
    const rx = i * 0.24 * u + (i > 0 ? step : -step);
    taper(ctx, s, [i * 0.14 * u, 0.4 * u, rx, 0.62 * u, rx + i * 0.14 * u, 0.76 * u], 0.24 * u, 0.04 * u, i % 2 ? TR_BARK_U : shade(TR_BARK, 0.8), null, 2);
  }
  treantArm(ctx, s, u, lerp(-0.56, -0.36, fw) * u, -0.5 * u, f.ax, f.ay, -1, TR_BARK_U);
  // the trunk: bark grooves, moss, a carved face
  shape(ctx, s, TR_TRUNK, u, TR_BARK, TR_BARK_U, 0.16);
  inside(ctx, TR_TRUNK, u);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#2a1a0e', 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-0.34 * u, -0.6 * u);
    ctx.quadraticCurveTo(-0.44 * u, 0.0, -0.3 * u, 0.6 * u);
    ctx.moveTo(0.36 * u, -0.5 * u);
    ctx.quadraticCurveTo(0.46 * u, 0.05, 0.32 * u, 0.6 * u);
    ctx.moveTo(-0.1 * u, 0.3 * u);
    ctx.lineTo(-0.12 * u, 0.62 * u);
    ctx.stroke();
    mark(ctx, s, [-0.62, -0.1, -0.5, -0.5, -0.24, -0.6, -0.36, -0.2, -0.5, 0.1], u, withAlpha('#5a8a3a', 0.85));
  }
  ctx.restore();
  if (!s.flash && !f.back) {
    const c = 0.14 * fw * u;
    const ey = -0.36 * u;
    const eye = s.pose === 'windup' ? heat(s, AMBER, 0.7) : elemGlow(s, AMBER);
    for (const side of [-1, 1]) {
      oval(ctx, null, c + side * 0.2 * u, ey, 0.12 * u, 0.14 * u, '#1a100a', 1.5, side * 0.3);
      dot(ctx, c + side * 0.2 * u, ey + 0.02 * u, Math.max(1.4, 0.06 * u), eye);
    }
    glow(ctx, c, ey, 0.6 * u, eye, 0.35);
    // heavy brow ridge of bark and a hollow maw
    flat(ctx, s, [c / u - 0.36, -0.5, c / u, -0.44, c / u + 0.36, -0.5, c / u + 0.34, -0.42, c / u, -0.36, c / u - 0.34, -0.42], u, TR_BARK_U, 1.5);
    const maw = s.pose === 'windup' ? 0.16 : s.pose === 'attack' ? 0.12 : 0.07;
    oval(ctx, null, c, -0.06 * u, 0.2 * u, maw * u, '#1a100a', 2);
  }
  // crown of leaves
  for (const [lx, ly, lr, col] of TR_LEAVES) {
    ctx.save();
    ctx.translate(lx * u, ly * u + Math.sin(s.t * 1.3 + lx) * 0.02 * u);
    shape(ctx, s, [-1, 0.2, -0.9, -0.5, -0.4, -0.95, 0.3, -0.92, 0.9, -0.5, 1, 0.2, 0.4, 0.6, -0.4, 0.6], lr * u, col, shade(col, 0.66), 0.25, 2.5);
    ctx.restore();
  }
  if (!s.flash) {
    ctx.fillStyle = RUST;
    ctx.beginPath();
    for (const [lx, ly] of [
      [-0.5, -1.2],
      [0.35, -1.5],
      [0.75, -1.05],
      [-0.15, -1.55],
    ] as const) {
      ctx.moveTo(lx * u + 0.07 * u, ly * u);
      ctx.ellipse(lx * u, ly * u, 0.07 * u, 0.05 * u, lx, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    for (const [lx, ly] of [
      [0.05, -1.7],
      [-0.75, -1.0],
      [0.5, -1.25],
    ] as const) {
      ctx.moveTo(lx * u + 0.06 * u, ly * u);
      ctx.ellipse(lx * u, ly * u, 0.06 * u, 0.045 * u, -lx, 0, Math.PI * 2);
    }
    ctx.fill();
    spec(ctx, -0.25 * u, -1.55 * u, 2.5, 0.45);
  }
  treantArm(ctx, s, u, lerp(0.56, 0.4, fw) * u, -0.48 * u, f.ax, f.ay, 1, TR_BARK);
  swoosh(ctx, s, 0.3 * u, -0.5 * u, 1.2 * u, -1.6, f.aim + 0.9, 0.45 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Witch of the Glade
// A hunched hag of the Void: a tattered robe and crooked hat of void-black with a pale glowing hem and band,
// grey skin, a long crooked nose, stringy hair, claw fingers, and a gnarled staff holding an orb of nothing.
// Coloured by her element (Void in the data) so she reads as Void at a glance.
const WI_SKIN = '#a8a4ac';
const WI_SKIN_U = shade(WI_SKIN, 0.7);
const WI_ROBE_P = [-0.3, -0.46, 0.28, -0.46, 0.44, 0.0, 0.6, 0.62, 0.6, 0.62, 0.36, 0.5, 0.2, 0.7, 0.2, 0.7, 0.0, 0.52, -0.2, 0.72, -0.2, 0.72, -0.4, 0.52, -0.62, 0.64, -0.62, 0.64, -0.5, 0.0];
const WI_FACE = [-0.3, -0.1, -0.26, -0.38, 0.06, -0.44, 0.32, -0.3, 0.36, 0.0, 0.26, 0.28, 0.0, 0.36, -0.22, 0.24];
const WI_BRIM = [-0.8, 0.06, -0.6, -0.1, 0.0, -0.16, 0.6, -0.1, 0.8, 0.06, 0.4, 0.14, 0.0, 0.16, -0.4, 0.14];

registerDraw('forest_witch', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  const E = ELEMENTS[s.elem === 'physical' ? 'void' : s.elem];
  const robe = mix(E.main, '#4a4458', 0.45);
  const robeU = mix(E.deep, '#000000', 0.2);
  shadow(ctx, s.x, s.y, u * 0.9);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  // drifting motes of her element
  if (!s.flash) {
    for (let i = 0; i < 4; i++) {
      const a = s.t * 0.9 + i * 1.6;
      const mx = s.x + Math.cos(a) * u * 1.15;
      const my = s.y - u * 0.3 + Math.sin(a * 1.3) * u * 0.7;
      glow(ctx, mx, my, 0.45 * u, E.glow, 0.35);
      dot(ctx, mx, my, Math.max(1, 0.07 * u), E.deep);
    }
  }
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.2, 3.5));
  // gnarled staff in the far hand, the orb of nothing on top
  const stx = lerp(-0.6, -0.44, fw) * u;
  const top = casting ? 1.6 : 1.3;
  const drawStaff = (): void => {
    cord(ctx, s, stx, 0.72 * u, stx - 0.1 * u, -0.2 * u, stx + 0.06 * u, -top * u, Math.max(2.5, 0.11 * u), '#5a3e22', 2);
    cord(ctx, s, stx + 0.06 * u, -top * u, stx - 0.1 * u, -top * u - 0.1 * u, stx - 0.04 * u, -top * u - 0.3 * u, Math.max(1.5, 0.07 * u), '#5a3e22', 1.5);
    const ox = stx + 0.06 * u;
    const oy = -top * u - 0.2 * u;
    if (!s.flash) glow(ctx, ox, oy, (casting ? 1.6 : 0.9) * u, E.glow, casting ? 0.85 : 0.5);
    oval(ctx, s, ox, oy, 0.17 * u, 0.17 * u, E.main, 2);
    if (!s.flash) {
      ctx.strokeStyle = E.glow;
      ctx.lineWidth = Math.max(1, 0.05 * u);
      ctx.beginPath();
      ctx.arc(ox, oy, 0.12 * u, s.t * 3, s.t * 3 + 4);
      ctx.stroke();
    }
    arm(ctx, s, lerp(-0.32, -0.2, fw) * u, -0.32 * u, stx + 0.02 * u, (casting ? -0.65 : -0.2) * u, 0.26 * u, 0.24 * u, 1, 0.08 * u, 0.07 * u, 0.06 * u, robeU, 1.5);
  };
  if (!f.back) drawStaff();
  // the tattered robe with a pale glowing hem
  shape(ctx, s, WI_ROBE_P, u, robe, robeU, 0.14);
  if (!s.flash) {
    inside(ctx, WI_ROBE_P, u);
    ctx.strokeStyle = withAlpha(E.glow, 0.85);
    ctx.lineWidth = Math.max(1.5, 0.07 * u);
    ctx.beginPath();
    ctx.moveTo(-0.66 * u, 0.56 * u);
    ctx.lineTo(-0.4 * u, 0.46 * u);
    ctx.lineTo(-0.2 * u, 0.64 * u);
    ctx.lineTo(0.0, 0.46 * u);
    ctx.lineTo(0.2 * u, 0.64 * u);
    ctx.lineTo(0.36 * u, 0.44 * u);
    ctx.lineTo(0.64 * u, 0.56 * u);
    ctx.stroke();
    // a sigil on the chest
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0.04 * u, -0.06 * u, 0.12 * u, 0, Math.PI * 2);
    ctx.moveTo(0.04 * u, -0.2 * u);
    ctx.lineTo(0.04 * u, 0.08 * u);
    ctx.stroke();
    ctx.restore();
  }
  if (f.back) drawStaff();
  // the hunched head: stringy hair, a long crooked nose, glowing eyes, the crooked hat
  ctx.save();
  ctx.translate((0.06 + 0.16 * fw) * u, -0.64 * u);
  const h = 0.74 * u;
  for (let i = -2; i <= 2; i++) {
    const hx = i * 0.14 * h - 0.06 * h * fw;
    taper(ctx, s, [hx, -0.3 * h, hx - 0.04 * h, 0.1 * h, hx + Math.sin(s.t * 2 + i) * 0.04 * h, 0.5 * h], 0.12 * h, 0.02 * h, '#c8c4cc', null, 1.2);
  }
  shape(ctx, s, WI_FACE, h, WI_SKIN, WI_SKIN_U, 0.1, 2);
  if (!f.back) {
    const c = 0.14 * fw * h;
    if (!s.flash) {
      oval(ctx, null, c - 0.11 * h, -0.1 * h, 0.07 * h, 0.06 * h, E.glow, 0, 0.3);
      oval(ctx, null, c + 0.13 * h, -0.1 * h, 0.07 * h, 0.06 * h, E.glow, 0, -0.3);
      glow(ctx, c, -0.1 * h, 0.5 * h, E.glow, 0.4);
      line(ctx, c - 0.1 * h, 0.2 * h, c + 0.12 * h, 0.17 * h, 1.2, '#3a3040');
    }
    // the nose: long and hooked toward the facing (short when she faces the camera)
    const nl = 0.18 + 0.36 * fw;
    flat(ctx, s, [c / h - 0.04, -0.06, c / h + nl, 0.12, c / h + nl - 0.06, 0.18, c / h + 0.02, 0.1], h, WI_SKIN_U, 1.5);
    dot(ctx, c + 0.1 * h, 0.05 * h, 0.03 * h + 0.4, '#5a5048');
  }
  // crooked pointed hat with a glowing band
  ctx.translate(0, -0.32 * h);
  const tip = Math.sin(s.t * 2) * 0.06;
  shape(ctx, s, [-0.36, 0.02, -0.36, 0.02, -0.2, -0.5, 0.0, -0.95, 0.4 + tip, -1.35, 0.4 + tip, -1.35, 0.24, -0.9, 0.24, -0.45, 0.36, 0.02, 0.36, 0.02], h, robe, robeU, 0.08, 2);
  if (!s.flash) mark(ctx, s, [-0.33, -0.12, 0.33, -0.12, 0.34, -0.02, -0.34, -0.02], h, E.glow, false);
  shape(ctx, s, WI_BRIM, h, robe, robeU, 0.06, 2);
  ctx.restore();
  // free hand: long claws, reaching and glowing while she hexes
  const hx = lerp(0.32, 0.22, fw) * u;
  const tx = hx + f.ax * (casting ? 0.62 : 0.3) * u;
  const ty = (casting ? -0.35 : 0.0) * u + f.ay * (casting ? 0.45 : 0.2) * u;
  arm(ctx, s, hx, -0.3 * u, tx, ty, 0.26 * u, 0.24 * u, 1, 0.08 * u, 0.07 * u, 0.06 * u, robe, 1.5);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.2 * u, 4, 1.2, casting ? heat(s, WI_SKIN, 0.85) : WI_SKIN, 1.2);
  hot(ctx, s, J[2]!, J[3]!, 1.0 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Stag Sentinel
// A great forest stag seen from above: long jointed legs with hooves, a moss blanket over its back, a pale chest
// and rump, amber eyes, and a vast rack of branching antlers lowered for the charge.
const ST_HIDE = '#8a6a42';
const ST_HIDE_U = shade(ST_HIDE, 0.64);
const ST_BODY = [1.0, 0, 0.8, -0.42, 0.2, -0.5, -0.6, -0.46, -1.05, -0.24, -1.1, 0, -1.05, 0.24, -0.6, 0.46, 0.2, 0.5, 0.8, 0.42];
const ST_HEAD = [-0.22, -0.26, 0.16, -0.26, 0.5, -0.14, 0.62, 0, 0.5, 0.14, 0.16, 0.26, -0.22, 0.26];

function antler(ctx: CanvasRenderingContext2D, s: DrawState, u: number, x: number, y: number, side: number, spread: number, col: string): void {
  // main beam sweeping out and forward, three tines
  const a0 = side * (1.0 * spread + 0.25);
  const bx = x + Math.cos(a0) * 0.6 * u;
  const by = y + Math.sin(a0) * 0.6 * u;
  const ex = bx + Math.cos(a0 - side * 0.7) * 0.5 * u;
  const ey = by + Math.sin(a0 - side * 0.7) * 0.5 * u;
  const w = Math.max(2, 0.1 * u);
  cord(ctx, s, x, y, bx, by, ex, ey, w, col, 2);
  for (const [k, ta, tl] of [
    [0.35, -0.9, 0.32],
    [0.7, 0.2, 0.3],
    [1.0, -0.4, 0.26],
  ] as const) {
    const px = k < 1 ? lerp(x, bx, k * 1.4 > 1 ? 1 : k * 1.4) : ex;
    const py = k < 1 ? lerp(y, by, k * 1.4 > 1 ? 1 : k * 1.4) : ey;
    const tA = a0 + side * ta;
    cord(ctx, s, px, py, px, py, px + Math.cos(tA) * tl * u, py + Math.sin(tA) * tl * u, w * 0.75, col, 1.5);
  }
}

registerDraw('forest_stag', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u * 1.15, 0.36);
  const run = Math.sin(s.t * 10) * (0.2 + s.moving * 0.8);
  const charge = s.pose === 'attack' ? 1.12 : 1;
  const lower = s.pose === 'windup' || s.pose === 'attack' ? 1 : 0;
  const stunned = s.pose === 'stagger';
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing + (stunned ? Math.sin(s.t * 30) * 0.08 : 0));
  light(s.facing);
  // long jointed legs with dark hooves
  for (const [hx, side, k] of [
    [0.5, 1, 1],
    [0.5, -1, -1],
    [-0.65, 1, -1],
    [-0.65, -1, 1],
  ] as const) {
    const px = (hx + (hx > 0 ? 0.3 : -0.2)) * u + k * run * 0.32 * u;
    arm(ctx, s, hx * u, side * 0.32 * u, px, side * 0.9 * u, 0.36 * u, 0.36 * u, side * (hx > 0 ? -1 : 1), 0.15 * u, 0.09 * u, 0.07 * u, '#5a4028', 2);
    oval(ctx, s, J[2]!, J[3]!, 0.08 * u, 0.07 * u, '#2a1e14', 1.5);
  }
  // white rump and the body with its moss blanket
  oval(ctx, s, -1.02 * u, 0, 0.22 * u, 0.2 * u, BONE, 2);
  ctx.save();
  ctx.scale(charge, 1 - s.squash * 0.06);
  shape(ctx, s, ST_BODY, u, ST_HIDE, ST_HIDE_U, 0.16);
  if (!s.flash) {
    inside(ctx, ST_BODY, u);
    // a darker stripe down the spine, ragged moss tufts growing along it, a pale belly edge
    mark(ctx, s, [0.7, -0.08, 0.2, -0.16, -0.7, -0.12, -1.0, 0, -0.7, 0.12, 0.2, 0.16, 0.7, 0.08], u, ST_HIDE_U);
    mark(ctx, s, [0.25, -0.22, 0.1, -0.3, -0.08, -0.2, -0.2, -0.32, -0.3, -0.16, -0.18, 0.04, 0.0, 0.2, 0.12, 0.06], u, '#4e7a3a', false);
    mark(ctx, s, [-0.42, 0.18, -0.5, -0.06, -0.62, 0.14, -0.78, 0.08, -0.72, 0.3, -0.5, 0.34], u, '#5a8a40', false);
    mark(ctx, s, [0.2, 0.5, 0.2, 0.4, -0.6, 0.38, -0.6, 0.48], u, withAlpha('#e0c8a0', 0.7));
    ctx.restore();
    oval(ctx, null, 0.6 * u, 0, 0.26 * u, 0.22 * u, '#d8b888', 0);
  }
  ctx.restore();
  // neck and head (lowered and pushed forward for the charge)
  const hx = (1.0 + lower * 0.2) * charge * u;
  capsule(ctx, s, 0.6 * u, 0, hx - 0.1 * u, 0, 0.24 * u, 0.2 * u, ST_HIDE, 2);
  ctx.save();
  ctx.translate(hx, 0);
  shape(ctx, s, ST_HEAD, u, mix(ST_HIDE, '#ffffff', 0.08), ST_HIDE_U, 0.08, 2.5);
  // ears
  flat(ctx, s, [-0.1, -0.2, -0.32, -0.42, 0.0, -0.26], u, ST_HIDE_U, 1.5);
  flat(ctx, s, [-0.1, 0.2, -0.32, 0.42, 0.0, 0.26], u, ST_HIDE_U, 1.5);
  if (!s.flash) {
    dot(ctx, 0.6 * u, 0, Math.max(1.2, 0.07 * u), '#1a1410');
    const eye = elemGlow(s, AMBER);
    dot(ctx, 0.14 * u, -0.17 * u, Math.max(1.2, 0.06 * u), eye);
    dot(ctx, 0.14 * u, 0.17 * u, Math.max(1.2, 0.06 * u), eye);
  }
  // the great antlers: spread wide at rest, swept forward into a ram when lowered
  const spread = 1.0 - lower * 0.55;
  const acol = heat(s, BONE, 0.8);
  antler(ctx, s, u, -0.02 * u, -0.14 * u, -1, spread, acol);
  antler(ctx, s, u, -0.02 * u, 0.14 * u, 1, spread, acol);
  ctx.restore();
  ctx.restore();
  light(0);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  hot(ctx, s, s.x + fx * u * 1.6, s.y + fy * u * 1.6, u * 1.3);
  if (s.pose === 'attack') streak(ctx, s, s.x + fx * u * 1.4, s.y + fy * u * 1.4, s.x + fx * u * 2.5, s.y + fy * u * 2.5, u * 0.45);
  if (stunned) {
    for (let i = 0; i < 3; i++) {
      const a = s.t * 5 + (i * Math.PI * 2) / 3;
      glow(ctx, s.x + Math.cos(a) * u * 0.7, s.y - u * 0.9 + Math.sin(a) * u * 0.25, 7, '#ffe14a', 0.8);
    }
  }
});

// ---------------------------------------------------------------- Pixie (one swarm piece)
// A tiny cheeky fey imp: four buzzing dragonfly wings, pointed ears, a tuft of hair, an impish grin and a
// coloured glow (each piece its own colour). Its Flash blazes in the attack colour.
registerDraw('forest_pixie', (ctx, s) => {
  const u = s.r * s.scale;
  const col = PIXIE_COLORS[s.variant % PIXIE_COLORS.length]!;
  const y = s.y - 12 + Math.sin(s.t * 9 + s.variant * 1.7) * 3;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const sd = fx < -0.02 ? -1 : 1;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 6, u * 0.8, u * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const h = striking(s);
  glow(ctx, s.x, y, u * (3.2 + h * 1.5), h > 0.05 ? atkGlow(s) : col, 0.5 + h * 0.45);
  ctx.save();
  ctx.translate(s.x, y);
  ctx.scale(sd, 1);
  // four buzzing wings
  const flap = 0.4 + Math.abs(Math.sin(s.t * 38 + s.variant)) * 0.8;
  if (!s.flash) {
    ctx.save();
    ctx.globalAlpha *= 0.7;
    for (const side of [-1, 1]) {
      oval(ctx, null, side * u * 0.85, -u * 0.55, u * 0.85 * flap, u * 0.36, '#f4fbff', 1, side * -0.5);
      oval(ctx, null, side * u * 0.7, u * 0.05, u * 0.6 * flap, u * 0.26, '#f4fbff', 1, side * 0.5);
    }
    ctx.restore();
  }
  // body: a little dress of petals, legs, arms
  capsule(ctx, s, -0.12 * u, 0.4 * u, -0.16 * u, 0.85 * u, 0.08 * u, 0.06 * u, '#ffe8d0', 1.2);
  capsule(ctx, s, 0.12 * u, 0.4 * u, 0.2 * u, 0.82 * u, 0.08 * u, 0.06 * u, '#ffe8d0', 1.2);
  shape(ctx, s, [-0.34, -0.1, 0.34, -0.1, 0.52, 0.5, 0.2, 0.42, 0.0, 0.62, -0.2, 0.42, -0.52, 0.5], u, col, shade(col, 0.7), 0.12, 1.5);
  const poke = s.pose === 'windup' || s.pose === 'attack';
  arm(ctx, s, 0.28 * u, -0.05 * u, (0.28 + (poke ? 0.6 : 0.3)) * u, (poke ? -0.05 : 0.25) * u + fy * 0.2 * u, 0.24 * u, 0.24 * u, 1, 0.07 * u, 0.06 * u, 0.06 * u, '#ffe8d0', 1.2);
  hot(ctx, s, J[2]!, J[3]!, u * 1.2);
  // head: pointed ears, hair tuft, impish grin
  const hy = -0.62 * u;
  flat(ctx, s, [-0.3, hy / u - 0.05, -0.85, hy / u - 0.45, -0.32, hy / u + 0.12], u, '#ffe8d0', 1.2);
  flat(ctx, s, [0.3, hy / u - 0.05, 0.85, hy / u - 0.45, 0.32, hy / u + 0.12], u, '#ffe8d0', 1.2);
  oval(ctx, s, 0, hy, 0.42 * u, 0.4 * u, '#ffe8d0', 1.5);
  shape(ctx, s, [-0.42, -0.72, -0.2, -1.12, 0.1, -1.24, 0.1, -1.24, 0.06, -1.02, 0.4, -0.84, 0.3, -0.62, -0.3, -0.6], u, AMBER, shade(AMBER, 0.7), 0.08, 1.2);
  if (!s.flash) {
    const c = 0.1 * u * Math.abs(fx);
    dot(ctx, c - 0.13 * u, hy, Math.max(0.8, 0.07 * u), OUTLINE);
    dot(ctx, c + 0.15 * u, hy, Math.max(0.8, 0.07 * u), OUTLINE);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(c + 0.02 * u, hy + 0.1 * u, 0.13 * u, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  ctx.restore();
});

// ---------------------------------------------------------------- Hollow Huntsman
// A hunter in a tattered hooded cloak whose face is a deer skull with small antlers through the hood and pale
// glints in its sockets; a long curved knife, a bear trap on the belt, wrapped legs and boots.
const HU_CLOAK = '#3e4a30';
const HU_CLOAK_U = shade(HU_CLOAK, 0.62);
const HU_CLOAK_P = [-0.34, -0.5, 0.3, -0.5, 0.5, 0.0, 0.62, 0.56, 0.62, 0.56, 0.4, 0.44, 0.26, 0.66, 0.26, 0.66, 0.08, 0.46, -0.1, 0.68, -0.1, 0.68, -0.28, 0.46, -0.48, 0.62, -0.48, 0.62, -0.64, 0.5, -0.52, 0.0];
const HU_HOOD = [-0.48, 0.24, -0.5, -0.24, -0.26, -0.58, 0.1, -0.66, 0.1, -0.66, 0.34, -0.48, 0.5, -0.2, 0.48, 0.24, 0.0, 0.36];

registerDraw('forest_huntsman', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u * 0.9);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1, 6));
  // wrapped legs and boots
  const step = Math.sin(s.t * 6) * 0.12 * u * s.moving;
  for (const [hx, fx2, c] of [
    [-0.14, -0.2 - step / u, '#4a3a28'],
    [0.14, 0.2 + step / u, '#5a4a34'],
  ] as const) {
    arm(ctx, s, hx * u, 0.34 * u, fx2 * u, 0.72 * u, 0.2 * u, 0.2 * u, -1, 0.1 * u, 0.09 * u, 0.08 * u, c, 2);
    oval(ctx, s, J[2]! + 0.05 * u, J[3]!, 0.13 * u, 0.07 * u, '#2a2018', 1.5);
  }
  // knife: drawn back in the windup, thrust out on release
  const reach = s.pose === 'attack' ? 0.95 : s.pose === 'windup' ? -0.15 : 0.45;
  const ksx = lerp(0.36, 0.24, fw) * u;
  const ktx = ksx + f.ax * reach * u;
  const kty = -0.1 * u + f.ay * reach * u + (s.pose === 'windup' ? -0.25 * u : 0.1 * u);
  const drawKnife = (): void => {
    arm(ctx, s, ksx, -0.32 * u, ktx, kty, 0.28 * u, 0.28 * u, 1, 0.09 * u, 0.08 * u, 0.07 * u, HU_CLOAK, 2);
    const ka = s.pose === 'windup' ? f.aim - 0.5 : f.aim;
    ctx.save();
    ctx.translate(J[2]!, J[3]!);
    ctx.rotate(ka);
    capsule(ctx, s, -0.1 * u, 0, 0.08 * u, 0, 0.05 * u, 0.05 * u, '#4a3020', 1.5);
    shape(ctx, s, [0.08, -0.07, 0.5, -0.1, 0.78, -0.02, 0.78, -0.02, 0.5, 0.06, 0.08, 0.06], u, heat(s, '#d8dde4'), heat(s, '#9aa0a8'), 0.04, 2);
    ctx.restore();
    hot(ctx, s, J[2]! + Math.cos(ka) * 0.6 * u, J[3]! + Math.sin(ka) * 0.6 * u, 0.7 * u);
    if (s.pose === 'attack') streak(ctx, s, ksx, -0.3 * u, J[2]! + Math.cos(ka) * 1.2 * u, J[3]! + Math.sin(ka) * 1.2 * u, 0.3 * u);
  };
  if (f.back) drawKnife();
  // the tattered cloak, a belt with a bear trap
  shape(ctx, s, HU_CLOAK_P, u, HU_CLOAK, HU_CLOAK_U, 0.14);
  if (!s.flash) {
    inside(ctx, HU_CLOAK_P, u);
    line(ctx, -0.6 * u, 0.1 * u, 0.6 * u, 0.06 * u, Math.max(2, 0.08 * u), '#3a2a18');
    ctx.restore();
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = Math.max(1.5, 0.06 * u);
    ctx.beginPath();
    ctx.arc(-0.3 * u, 0.26 * u, 0.16 * u, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
    teeth(ctx, s, -0.44 * u, 0.28 * u, -0.16 * u, 0.28 * u, 4, 0.07 * u, '#c8ccd2', 0.6);
  }
  // hood with a deer-skull face and small antlers through it
  ctx.save();
  ctx.translate(0.08 * fw * u, -0.66 * u);
  const h = 0.68 * u;
  if (!f.back) {
    for (const side of [-1, 1]) {
      const ax = side * 0.22 * h + 0.06 * fw * h;
      cord(ctx, s, ax, -0.42 * h, ax + side * 0.12 * h, -0.7 * h, ax + side * 0.3 * h, -0.86 * h, Math.max(1.5, 0.07 * h), BONE, 1.5);
      cord(ctx, s, ax + side * 0.1 * h, -0.64 * h, ax + side * 0.1 * h, -0.64 * h, ax - side * 0.02 * h, -0.86 * h, Math.max(1.2, 0.05 * h), BONE, 1.2);
    }
  }
  shape(ctx, s, HU_HOOD, h, shade(HU_CLOAK, 0.9), HU_CLOAK_U, 0.1, 2.5);
  if (!f.back) {
    oval(ctx, null, 0.1 * fw * h, -0.02 * h, 0.34 * h, 0.34 * h, s.flash ? '#ffffff' : '#0e0c10', 0);
    skull(ctx, s, 0.12 * fw * h, 0.0, 0.58 * h, fw * 0.8, false, BONE, elemGlow(s, '#d8f0c0'), s.pose === 'windup' ? 0.3 : 0);
  }
  ctx.restore();
  if (!f.back) drawKnife();
  // a rust feather tucked in the hood
  cord(ctx, s, -0.16 * u, -1.0 * u, -0.36 * u, -1.1 * u, -0.56 * u, -1.0 * u, Math.max(2, 0.08 * u), RUST, 1.5);
  ctx.restore();
});


// ---------------------------------------------------------------- Hollow Scarecrow
// A scarecrow on a weathered post: a burlap sack head with cut-out eyes and a stitched grin lit pumpkin-orange from
// inside, a battered straw hat, a ragged coat over a crossbar with straw bursting from the cuffs and hem, and the
// crows that work for it: one on the near arm, one on the hat. The crows lift off in the windup; the near arm flings
// forward on the release. It never walks; it sways.
const SC_SACK = '#c8a870';
const SC_SACK_U = shade(SC_SACK, 0.66);
const SC_COAT = '#7a4a34';
const SC_COAT_U = shade(SC_COAT, 0.62);
const SC_WOOD = '#6a4a2a';
const SC_STRAW = '#e0c060';
const SC_CROW = '#1e1c24';
const SC_COAT_P = [-0.46, -0.5, 0.46, -0.5, 0.56, 0.0, 0.5, 0.34, 0.5, 0.34, 0.34, 0.24, 0.24, 0.42, 0.24, 0.42, 0.08, 0.26, -0.08, 0.4, -0.08, 0.4, -0.2, 0.24, -0.36, 0.38, -0.36, 0.38, -0.5, 0.3, -0.56, 0.0];
const SC_HEAD = [-0.44, 0.1, -0.46, -0.32, -0.2, -0.52, 0.22, -0.52, 0.46, -0.3, 0.44, 0.12, 0.2, 0.32, -0.2, 0.32];
const SC_BRIM = [-0.8, 0.08, -0.56, -0.08, 0.0, -0.12, 0.56, -0.06, 0.82, 0.1, 0.5, 0.16, 0.0, 0.14, -0.5, 0.18];
const SC_CROWN = [-0.36, 0.0, -0.36, 0.0, -0.3, -0.44, -0.08, -0.36, 0.06, -0.5, 0.3, -0.42, 0.36, 0.0, 0.36, 0.0];

/** A tuft of straw: n short strands fanning out from (x, y) around angle a. */
function straw(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, len: number, n: number, t: number): void {
  if (s.flash) return;
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0 : i / (n - 1) - 0.5;
    const aa = a + k * 1.2 + Math.sin(t * 3 + i * 1.7) * 0.08;
    const l = len * (0.75 + 0.25 * Math.sin(i * 2.3));
    line(ctx, x, y, x + Math.cos(aa) * l, y + Math.sin(aa) * l, Math.max(1, len * 0.12), i % 2 ? SC_STRAW : shade(SC_STRAW, 0.8));
  }
}

/** A crow at (x, y) (k ≈ its length) facing dir (±1); lift 0…1 opens and flaps its wings and raises it. */
function crow(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, k: number, dir: number, lift: number, t: number): void {
  ctx.save();
  ctx.translate(x, y - lift * k * 0.9);
  ctx.scale(dir, 1);
  const flap = lift > 0.05 ? Math.sin(t * 28) : 0;
  // far wing, then body, near wing
  if (lift > 0.05) flat(ctx, s, [-0.1, -0.15, -0.5, -0.5 - flap * 0.4, 0.1, -0.2], k, shade(SC_CROW, 0.8), 1.5);
  flat(ctx, s, [-0.42, 0.0, -0.72, 0.08, -0.7, -0.08], k, SC_CROW, 1.5);
  oval(ctx, s, -0.08 * k, -0.14 * k, 0.36 * k, 0.2 * k, SC_CROW, 1.5, -0.2);
  oval(ctx, s, 0.26 * k, -0.34 * k, 0.17 * k, 0.15 * k, SC_CROW, 1.5);
  flat(ctx, s, [0.38, -0.38, 0.62, -0.32, 0.38, -0.28], k, '#d8a040', 1);
  if (!s.flash) dot(ctx, 0.3 * k, -0.37 * k, Math.max(0.6, 0.04 * k), '#ffd27a');
  if (lift > 0.05) flat(ctx, s, [0.0, -0.18, -0.3, -0.62 - flap * 0.5, -0.46, -0.5 - flap * 0.5, 0.12, -0.08], k, SC_CROW, 1.5);
  else flat(ctx, s, [0.08, -0.22, -0.46, -0.06, 0.02, -0.04], k, shade(SC_CROW, 1.3), 1.2);
  // feet on the perch
  if (lift < 0.05 && !s.flash) {
    line(ctx, -0.02 * k, 0.04 * k, -0.04 * k, 0.12 * k, 1, '#a07a40');
    line(ctx, 0.08 * k, 0.04 * k, 0.08 * k, 0.12 * k, 1, '#a07a40');
  }
  ctx.restore();
}

registerDraw('forest_scarecrow', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  const af = Math.abs(fw);
  const wind = s.pose === 'windup';
  const flung = s.pose === 'attack' || s.pose === 'recover';
  shadow(ctx, s.x, s.y, u * 0.8);
  ctx.save();
  upright(ctx, s, f, u, 0);
  // it sways on its post, pivoting at the ground
  ctx.translate(0, 0.74 * u);
  ctx.rotate(Math.sin(s.t * 1.3) * 0.035 + (wind ? -0.05 : flung ? 0.06 : 0));
  ctx.translate(0, -0.74 * u);
  // the post and a little mound of earth and straw at its foot
  oval(ctx, s, 0, 0.74 * u, 0.32 * u, 0.1 * u, '#4a3a22', 2);
  capsule(ctx, s, 0, 0.76 * u, 0, -0.98 * u, 0.09 * u, 0.08 * u, SC_WOOD, 2);
  straw(ctx, s, 0, 0.7 * u, -Math.PI / 2, 0.18 * u, 5, s.t);
  // crossbar: seen side-on its ends come toward and away from the camera
  const span = lerp(0.98, 0.42, af) * u;
  const barY = -0.42 * u;
  const nearX = span;
  const nearY = barY + 0.24 * af * u;
  const farX = -span;
  const farY = barY - 0.14 * af * u;
  capsule(ctx, s, farX - 0.06 * u, farY, nearX + 0.06 * u, nearY, 0.07 * u, 0.07 * u, shade(SC_WOOD, 0.85), 2);
  // far sleeve along the bar
  capsule(ctx, s, -0.38 * u, barY, farX, farY, 0.17 * u, 0.13 * u, SC_COAT_U, 2);
  straw(ctx, s, farX, farY, Math.PI + 0.1, 0.22 * u, 5, s.t + 1);
  // the coat, patched, straw out of the hem
  shape(ctx, s, SC_COAT_P, u, SC_COAT, SC_COAT_U, 0.12, 2.5);
  if (!s.flash) {
    inside(ctx, SC_COAT_P, u);
    flat(ctx, s, [0.12, -0.2, 0.34, -0.22, 0.36, 0.0, 0.14, 0.02], u, '#8a6a3a', 1.2);
    ctx.setLineDash([2, 2]);
    line(ctx, 0.12 * u, -0.2 * u, 0.34 * u, -0.22 * u, 1, '#2a2018');
    ctx.setLineDash([]);
    line(ctx, -0.04 * u, -0.5 * u, -0.02 * u, 0.36 * u, 1.5, withAlpha(OUTLINE, 0.5));
    line(ctx, -0.58 * u, 0.02 * u, 0.58 * u, 0.0, Math.max(2, 0.07 * u), '#8a7040');
    ctx.restore();
    for (const hx of [-0.36, -0.08, 0.24]) straw(ctx, s, hx * u, 0.3 * u, Math.PI / 2, 0.18 * u, 3, s.t + hx * 5);
    straw(ctx, s, 0.02 * u, -0.5 * u, -Math.PI / 2, 0.12 * u, 3, s.t);
  }
  // the sack head, tied at the neck, lolling to one side; it cocks in the windup
  ctx.save();
  ctx.translate(0.06 * fw * u, -0.82 * u);
  ctx.rotate(wind ? 0.28 : 0.1 + Math.sin(s.t * 0.9) * 0.05);
  const h = 0.78 * u;
  const lamp = elemGlow(s, '#ff9a2a');
  shape(ctx, s, SC_HEAD, h, SC_SACK, SC_SACK_U, 0.1, 2.5);
  if (!s.flash) {
    // burlap weave and the twine at the neck
    ctx.strokeStyle = withAlpha('#8a6a40', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(-0.36 * h, (-0.3 + i * 0.14) * h);
      ctx.lineTo(0.36 * h, (-0.32 + i * 0.14) * h);
    }
    ctx.stroke();
    line(ctx, -0.3 * h, 0.28 * h, 0.3 * h, 0.28 * h, Math.max(2, 0.07 * h), '#6a5030');
    if (f.back) line(ctx, 0.0, -0.46 * h, 0.04 * h, 0.24 * h, 1.4, withAlpha('#4a3420', 0.8));
    else {
      const c = 0.16 * fw * h;
      const sp = (0.18 - 0.05 * af) * h;
      const flick = 0.75 + Math.sin(s.t * 9) * 0.1 + (wind || flung ? 0.25 : 0);
      glow(ctx, c, -0.02 * h, 0.9 * h, lamp, 0.35 * flick);
      // cut-out triangle eyes and a jagged grin, lit from within
      for (const side of [-1, 1]) {
        const ex = c + side * sp;
        flat(ctx, s, [ex / h - 0.1, -0.06, ex / h + 0.1, -0.06, ex / h + side * 0.02, -0.24], h, heat(s, lamp, 0.3), 1.5);
      }
      ctx.beginPath();
      ctx.moveTo(c - 0.24 * h, 0.06 * h);
      for (let i = 1; i <= 6; i++) ctx.lineTo(c + (-0.24 + i * 0.08) * h, (i % 2 ? 0.18 : 0.08) * h + (wind ? 0.04 * h : 0));
      ctx.lineTo(c + 0.22 * h, 0.2 * h);
      ctx.quadraticCurveTo(c, 0.3 * h, c - 0.22 * h, 0.18 * h);
      ctx.closePath();
      ctx.fillStyle = lamp;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      // the stitches across the grin
      for (let i = 0; i < 4; i++) {
        const sx = c + (-0.16 + i * 0.1) * h;
        line(ctx, sx, 0.06 * h, sx + 0.02 * h, 0.26 * h, 1, '#2a1a10');
      }
    }
  }
  // battered straw hat with a torn crown
  ctx.translate(0, -0.42 * h);
  shape(ctx, s, SC_CROWN, h, '#c8a050', '#8a6a30', 0.08, 2);
  if (!s.flash) {
    mark(ctx, s, [-0.34, -0.12, 0.34, -0.1, 0.34, -0.02, -0.34, -0.04], h, '#7a3a22', false);
    oval(ctx, null, 0.16 * h, -0.28 * h, 0.06 * h, 0.04 * h, '#2a1a10', 0);
  }
  shape(ctx, s, SC_BRIM, h, '#d8b060', '#9a7a3a', 0.06, 2);
  straw(ctx, s, -0.78 * h, 0.08 * h, Math.PI + 0.3, 0.14 * h, 3, s.t);
  // the hat crow
  const hatLift = wind ? Math.min(1, 0.3 + s.poseT * 2) : flung ? 0.6 : 0;
  crow(ctx, s, 0.12 * h, -0.36 * h, 0.5 * u, f.back ? -1 : 1, hatLift, s.t + 0.4);
  ctx.restore();
  // near sleeve: along the bar, flung forward off it on release
  let hx = nearX;
  let hy = nearY;
  if (flung) {
    hx = 0.3 * u + f.ax * 1.0 * u;
    hy = -0.4 * u + f.ay * 0.7 * u;
  } else if (wind) {
    hx = nearX - 0.1 * u;
    hy = nearY - 0.28 * u;
  }
  capsule(ctx, s, 0.36 * u, barY, hx, hy, 0.18 * u, 0.14 * u, SC_COAT, 2);
  const ha = Math.atan2(hy - barY, hx - 0.36 * u);
  straw(ctx, s, hx, hy, ha, 0.26 * u, 5, s.t);
  hot(ctx, s, hx, hy, 0.6 * u);
  if (flung) swoosh(ctx, s, 0.36 * u, barY, 1.0 * u, -1.6, ha, 0.35 * u);
  // the arm crow: perched on the cuff, off its perch in the windup, gone (it is the projectile) on release
  if (!flung) crow(ctx, s, nearX - 0.06 * u, nearY - 0.14 * u, 0.5 * u, 1, wind ? Math.min(1, s.poseT * 2.5) : 0, s.t);
  ctx.restore();
});

// ---------------------------------------------------------------- Beekeeper
// A beekeeper in a pale smock, gloves and a wide hat with a dark mesh veil (two amber eyes glint behind it), a tin
// smoker puffing in the near hand and a straw skep hive under the other arm, with a few bees on patrol. The hive is
// hoisted overhead in the windup and thrust out on the release in a burst of angry bees.
const BK_SMOCK = '#e6dfc6';
const BK_SMOCK_U = shade(BK_SMOCK, 0.72);
const BK_GLOVE = '#c8a868';
const BK_BODY = [-0.42, -0.44, 0.4, -0.44, 0.5, 0.0, 0.52, 0.42, 0.0, 0.5, -0.52, 0.42, -0.5, 0.0];
const BK_SKEP = [-0.42, 0.32, -0.46, -0.02, -0.32, -0.32, 0.0, -0.44, 0.32, -0.32, 0.46, -0.02, 0.42, 0.32];
const BK_BRIM = [-0.82, 0.04, -0.56, -0.1, 0.0, -0.14, 0.56, -0.1, 0.82, 0.04, 0.5, 0.14, 0.0, 0.16, -0.5, 0.14];
const BK_CROWN = [-0.36, 0.0, -0.36, 0.0, -0.32, -0.34, 0.0, -0.46, 0.32, -0.34, 0.36, 0.0, 0.36, 0.0];

function bee(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, k: number, a: number, t: number): void {
  if (s.flash) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  const flick = Math.sin(t * 60) * 0.3;
  oval(ctx, null, -0.1 * k, -0.35 * k, 0.26 * k, 0.16 * k, withAlpha('#ffffff', 0.7), 0.8, -0.6 + flick);
  oval(ctx, null, 0.06 * k, -0.35 * k, 0.24 * k, 0.15 * k, withAlpha('#ffffff', 0.7), 0.8, 0.6 - flick);
  oval(ctx, null, 0, 0, 0.42 * k, 0.26 * k, '#f0c020', 1.2);
  line(ctx, -0.08 * k, -0.24 * k, -0.08 * k, 0.24 * k, Math.max(1, 0.12 * k), OUTLINE);
  line(ctx, -0.26 * k, -0.18 * k, -0.26 * k, 0.18 * k, Math.max(1, 0.1 * k), OUTLINE);
  ctx.restore();
}

/** A straw skep hive centred at (x, y), size k; tilt rotates it. */
function skep(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, k: number, tilt: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  shape(ctx, s, BK_SKEP, k, heat(s, '#d8a848', 0.25), '#9a7030', 0.08, 2);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#7a5420', 0.85);
    ctx.lineWidth = Math.max(1, 0.05 * k);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const yy = (-0.28 + i * 0.15) * k;
      const w = Math.sqrt(Math.max(0, 1 - ((yy / k + 0.02) / 0.46) ** 2)) * 0.44 * k;
      ctx.moveTo(-w, yy);
      ctx.quadraticCurveTo(0, yy + 0.06 * k, w, yy);
    }
    ctx.stroke();
    // the entrance and a guard bee
    oval(ctx, null, 0.04 * k, 0.24 * k, 0.1 * k, 0.06 * k, '#2a1a0a', 0);
  }
  ctx.restore();
}

registerDraw('forest_beekeeper', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  const wind = s.pose === 'windup';
  const thrust = s.pose === 'attack';
  shadow(ctx, s.x, s.y, u * 0.9);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.2, 7));
  // the hive: under the far arm, hoisted overhead, thrust out at the target
  let kx: number;
  let ky: number;
  let tilt: number;
  if (wind) {
    kx = -0.05 * u;
    ky = -1.42 * u;
    tilt = -0.25 + Math.sin(s.t * 14) * 0.06;
  } else if (thrust) {
    kx = 0.3 * u + f.ax * 0.75 * u;
    ky = -0.5 * u + f.ay * 0.5 * u;
    tilt = f.aim + 0.9;
  } else {
    kx = lerp(-0.62, -0.42, fw) * u;
    ky = 0.06 * u;
    tilt = -0.15;
  }
  const kk = 0.85 * u;
  const raised = wind || thrust;
  const fsx = lerp(-0.4, -0.28, fw) * u;
  // boots and gaitered legs
  const step = Math.sin(s.t * 7) * 0.12 * u * s.moving;
  for (const [hx, fx2, c] of [
    [-0.14, -0.18 - step / u, shade(BK_SMOCK, 0.82)],
    [0.14, 0.18 + step / u, BK_SMOCK],
  ] as const) {
    arm(ctx, s, hx * u, 0.36 * u, fx2 * u, 0.72 * u, 0.2 * u, 0.2 * u, -1, 0.11 * u, 0.1 * u, 0.09 * u, c, 2);
    oval(ctx, s, J[2]! + 0.05 * u, J[3]!, 0.14 * u, 0.08 * u, '#4a3a28', 1.5);
  }
  if (!raised) skep(ctx, s, kx, ky, kk, tilt);
  // far arm round the hive
  const fhx = raised ? kx - 0.1 * u : kx + 0.12 * u;
  const fhy = raised ? ky + 0.28 * u : ky - 0.12 * u;
  arm(ctx, s, fsx, -0.32 * u, fhx, fhy, 0.3 * u, 0.3 * u, raised ? 1 : -1, 0.11 * u, 0.1 * u, 0.09 * u, BK_SMOCK_U, 2);
  oval(ctx, s, J[2]!, J[3]!, 0.09 * u, 0.09 * u, shade(BK_GLOVE, 0.8), 1.5);
  // the smock, a pocket, a tool belt
  shape(ctx, s, BK_BODY, u, BK_SMOCK, BK_SMOCK_U, 0.12, 2.5);
  if (!s.flash) {
    inside(ctx, BK_BODY, u);
    line(ctx, 0.02 * u, -0.44 * u, 0.0, 0.5 * u, 1.5, withAlpha(OUTLINE, 0.35));
    line(ctx, -0.6 * u, 0.08 * u, 0.6 * u, 0.04 * u, Math.max(2, 0.08 * u), '#7a5a34');
    flat(ctx, s, [0.14, 0.16, 0.38, 0.14, 0.38, 0.34, 0.14, 0.36], u, shade(BK_SMOCK, 0.9), 1.2);
    mark(ctx, s, [0.16, 0.24, 0.24, 0.2, 0.3, 0.28, 0.22, 0.3], u, withAlpha('#e0a020', 0.7));
    ctx.restore();
  }
  // head: a wide hat with the mesh veil hanging to the shoulders, eyes glinting through it
  ctx.save();
  ctx.translate(0.06 * fw * u, -0.7 * u);
  const h = 0.66 * u;
  const eye = elemGlow(s, '#ffd27a');
  const VEIL = [-0.5, -0.08, 0.5, -0.08, 0.56, 0.36, 0.42, 0.56, 0.0, 0.62, -0.42, 0.56, -0.56, 0.36];
  shape(ctx, s, VEIL, h, '#4a4a42', '#33332e', 0.06, 2);
  if (!s.flash) {
    inside(ctx, VEIL, h);
    ctx.strokeStyle = withAlpha('#9a9a88', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -6; i <= 6; i++) {
      ctx.moveTo(i * 0.09 * h, -0.1 * h);
      ctx.lineTo(i * 0.09 * h + 0.3 * h, 0.64 * h);
      ctx.moveTo(i * 0.09 * h, -0.1 * h);
      ctx.lineTo(i * 0.09 * h - 0.3 * h, 0.64 * h);
    }
    ctx.stroke();
    ctx.restore();
    if (!f.back) {
      const c = 0.16 * fw * h;
      const sp = (0.15 - 0.04 * Math.abs(fw)) * h;
      dot(ctx, c - sp, 0.16 * h, Math.max(1, 0.05 * h), eye);
      dot(ctx, c + sp, 0.16 * h, Math.max(1, 0.05 * h), eye);
      glow(ctx, c, 0.16 * h, 0.5 * h, eye, 0.3);
    }
  }
  ctx.translate(0, -0.08 * h);
  shape(ctx, s, BK_CROWN, h, BK_SMOCK, BK_SMOCK_U, 0.08, 2);
  if (!s.flash) mark(ctx, s, [-0.34, -0.1, 0.34, -0.1, 0.34, -0.02, -0.34, -0.02], h, '#c8a040', false);
  shape(ctx, s, BK_BRIM, h, mix(BK_SMOCK, '#ffffff', 0.2), BK_SMOCK_U, 0.06, 2);
  ctx.restore();
  if (raised) {
    skep(ctx, s, kx, ky, kk, tilt);
    hot(ctx, s, kx, ky, 0.7 * u, 0.5);
  }
  // near hand: the smoker, puffing; it sweeps forward with a big puff on the release
  const nsx = lerp(0.4, 0.28, fw) * u;
  const shx = nsx + 0.22 * u + f.ax * (thrust ? 0.08 : 0.14) * u;
  const shy = wind || thrust ? -0.22 * u : 0.06 * u + f.ay * 0.12 * u;
  arm(ctx, s, nsx, -0.32 * u, shx, shy, 0.22 * u, 0.22 * u, -1, 0.11 * u, 0.1 * u, 0.09 * u, BK_SMOCK, 2);
  const gx = J[2]!;
  const gy = J[3]!;
  // smoker: a tin can with a spout, a leather bellows behind it
  flat(ctx, s, [(gx / u) - 0.22, (gy / u) - 0.04, (gx / u) - 0.08, (gy / u) - 0.16, (gx / u) - 0.06, (gy / u) + 0.12, (gx / u) - 0.2, (gy / u) + 0.12], u, '#7a4a2a', 1.5);
  capsule(ctx, s, gx, gy - 0.22 * u, gx, gy + 0.14 * u, 0.1 * u, 0.1 * u, '#a8adb4', 2);
  flat(ctx, s, [(gx / u) - 0.1, (gy / u) - 0.3, (gx / u) + 0.1, (gy / u) - 0.3, (gx / u) + 0.05, (gy / u) - 0.42, (gx / u) - 0.02, (gy / u) - 0.42], u, '#8a9098', 1.5);
  oval(ctx, s, gx - 0.02 * u, gy + 0.02 * u, 0.09 * u, 0.09 * u, BK_GLOVE, 1.5);
  if (!s.flash) {
    const spoutX = gx + 0.02 * u;
    const spoutY = gy - 0.44 * u;
    const puff = thrust ? 1.6 : wind ? 1.2 : 1;
    for (let i = 0; i < 4; i++) {
      const k = (s.t * 0.7 + i / 4) % 1;
      const px = spoutX + Math.sin(s.t * 1.5 + i * 2) * 0.12 * u * k + (thrust ? f.ax * k * 0.8 * u : 0);
      const py = spoutY - k * 0.8 * u * puff;
      oval(ctx, null, px, py, (0.05 + k * 0.14) * u * puff, (0.05 + k * 0.12) * u * puff, withAlpha('#d8d8cc', 0.55 * (1 - k)), 0);
    }
  }
  // bees on patrol round the keeper; angrier and wider in the windup, streaming out on the release
  const n = 4;
  const rr = (wind ? 1.25 : 1.0) * u;
  const sp2 = wind ? 4 : 2;
  for (let i = 0; i < n; i++) {
    const a = s.t * sp2 + (i * Math.PI * 2) / n;
    let bx = Math.cos(a) * rr;
    let by = -0.3 * u + Math.sin(a) * rr * 0.45 + Math.sin(s.t * 9 + i) * 0.05 * u;
    if (thrust) {
      bx = kx + f.ax * (0.4 + i * 0.3) * u + Math.sin(s.t * 20 + i) * 0.1 * u;
      by = ky + f.ay * (0.3 + i * 0.25) * u + Math.cos(s.t * 17 + i * 2) * 0.12 * u;
    }
    bee(ctx, s, bx, by, 0.24 * u, thrust ? f.aim : a + Math.PI / 2, s.t + i);
  }
  if (thrust) streak(ctx, s, kx + f.ax * 0.5 * u, ky + f.ay * 0.4 * u, kx + f.ax * 1.8 * u, ky + f.ay * 1.4 * u, 0.3 * u);
  ctx.restore();
});
