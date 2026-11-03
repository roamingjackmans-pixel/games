// Mossy Crypt roster draw functions (moss green, bone white, grey) + the Mimic.
// Upright bodies are drawn facing right inside a mirrored local frame (shapesA.upright); crawlers are drawn
// top-down, rotated to their facing. Units inside a body are multiples of its radius u; `fw` (0…1) is how
// side-on the body is, so faces slide to the front when it walks toward or away from the camera.
import { ELEMENTS } from '../../../game/elements';
import { OUTLINE, glow, mix, poly, shade, shadow, spec, withAlpha } from '../parts';
import { registerDraw, type DrawState } from '../registry';
import {
  arm,
  atkGlow,
  bow,
  bob,
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
  smoothPath,
  streak,
  striking,
  swoosh,
  taper,
  teeth,
  upright,
} from '../shapesA';

const MOSS = '#6a8452';
const BONE = '#ece6d0';
const BONE_U = '#b0a88e';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------- Shambler
// A hunched, rotting corpse: a big drooping head with a hanging jaw and one glowing eye, a torn shirt over bare
// ribs, arms reaching out with cracked nails.
const SH_SKIN = '#9fb08a';
const SH_SKIN_U = shade(SH_SKIN, 0.7);
const SH_SHIRT = '#7c6a50';
const SH_PANTS = '#5a5046';
const SH_TORSO = [-0.38, 0.34, -0.46, 0.02, -0.38, -0.32, -0.12, -0.52, 0.18, -0.5, 0.36, -0.22, 0.34, 0.12, 0.22, 0.36];
const SH_RAG = [-0.7, -0.05, -0.7, -0.8, 0.7, -0.8, 0.7, -0.12, 0.44, -0.02, 0.32, -0.16, 0.2, 0.04, 0.06, -0.12, -0.08, 0.06, -0.22, -0.08, -0.36, 0.1, -0.5, -0.04];
const SH_HEAD = [-0.42, -0.05, -0.36, -0.45, 0.02, -0.58, 0.4, -0.42, 0.5, -0.08, 0.44, 0.18, 0.2, 0.28, -0.12, 0.28, -0.38, 0.16];
const SH_JAW = [-0.22, -0.04, 0.32, -0.06, 0.36, 0.1, 0.2, 0.26, -0.1, 0.24, -0.24, 0.1];
const SH_MOSS = [-0.4, -0.26, -0.28, -0.52, 0.12, -0.58, 0.02, -0.4, -0.22, -0.2];

function shamblerArm(ctx: CanvasRenderingContext2D, s: DrawState, u: number, sx: number, sy: number, ax: number, ay: number, phase: number, fill: string): void {
  let tx: number;
  let ty: number;
  if (s.pose === 'windup') {
    tx = sx - 0.12 * u + ax * 0.15 * u;
    ty = sy - 0.55 * u;
  } else if (s.pose === 'attack') {
    tx = sx + ax * 0.95 * u;
    ty = sy + ay * 0.8 * u + 0.25 * u;
  } else {
    const sway = Math.sin(s.t * 2.4 + phase) * 0.07 * u;
    tx = sx + ax * 0.72 * u;
    ty = sy + ay * 0.62 * u + 0.12 * u + sway;
  }
  arm(ctx, s, sx, sy, tx, ty, 0.36 * u, 0.36 * u, 1, 0.13 * u, 0.11 * u, 0.09 * u, fill, 2);
  const a = Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!);
  claws(ctx, s, J[2]!, J[3]!, a, 0.24 * u, 3, 0.9, heat(s, '#e0d8b8'));
  hot(ctx, s, J[2]!, J[3]!, 0.55 * u);
}

registerDraw('crypt_shambler', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.6, 5));
  // legs: one stiff, one dragging
  const step = Math.sin(s.t * 5) * 0.16 * u * s.moving;
  arm(ctx, s, -0.15 * u, 0.26 * u, -0.22 * u - step, 0.74 * u, 0.27 * u, 0.27 * u, -1, 0.14 * u, 0.12 * u, 0.1 * u, shade(SH_PANTS, 0.8), 2);
  oval(ctx, s, J[2]! + 0.05 * u, J[3]!, 0.14 * u, 0.075 * u, SH_SKIN_U, 2);
  arm(ctx, s, 0.12 * u, 0.28 * u, 0.2 * u + step, 0.74 * u, 0.27 * u, 0.27 * u, -1, 0.14 * u, 0.12 * u, 0.1 * u, SH_PANTS, 2);
  oval(ctx, s, J[2]! + 0.06 * u, J[3]!, 0.15 * u, 0.08 * u, SH_SKIN, 2);
  // far arm behind the body
  shamblerArm(ctx, s, u, lerp(-0.34, -0.1, fw) * u, -0.36 * u, f.ax, f.ay, 1.3, SH_SKIN_U);
  // torso: bare ribs below a torn shirt, moss on the shoulder
  shape(ctx, s, SH_TORSO, u, SH_SKIN, SH_SKIN_U, 0.12);
  inside(ctx, SH_TORSO, u);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha(OUTLINE, 0.55);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const y = (0.04 + i * 0.09) * u;
      ctx.moveTo(-0.24 * u, y);
      ctx.quadraticCurveTo(0.04 * u, y - 0.06 * u, 0.3 * u, y + 0.02 * u);
    }
    ctx.stroke();
  }
  flat(ctx, s, SH_RAG, u, SH_SHIRT, 2);
  mark(ctx, s, [-0.5, -0.3, -0.3, -0.6, -0.02, -0.6, -0.22, -0.36], u, MOSS);
  ctx.restore();
  // big head drooping forward, jaw hanging
  const h = 0.62 * u;
  const jaw = s.pose === 'windup' ? 0.6 : s.pose === 'attack' ? 0.4 : 0.22 + Math.sin(s.t * 3) * 0.06;
  ctx.save();
  ctx.translate((0.06 + 0.16 * fw) * u, -0.66 * u);
  ctx.rotate((0.2 + Math.sin(s.t * 1.7) * 0.06) * fw);
  const c = 0.12 * fw * h;
  ctx.save();
  ctx.translate(c, 0.14 * h);
  ctx.rotate(jaw * (0.4 + fw * 0.6));
  ctx.translate(0, jaw * (1 - fw) * 0.15 * h);
  shape(ctx, s, SH_JAW, h, SH_SKIN, SH_SKIN_U, 0.1, 2);
  ctx.restore();
  if (!f.back) oval(ctx, null, c + 0.06 * h * fw, 0.2 * h, 0.16 * h, 0.06 * h + jaw * 0.1 * h, s.flash ? '#ffffff' : heat(s, '#2a1014', 0.5), 0);
  shape(ctx, s, SH_HEAD, h, mix(SH_SKIN, '#d8dcc0', 0.3), SH_SKIN_U, 0.12);
  if (!s.flash) {
    mark(ctx, s, SH_MOSS, h, MOSS);
    line(ctx, -0.3 * h, -0.4 * h, -0.42 * h, 0.15 * h, 1.4, '#2a2a1e');
    line(ctx, -0.12 * h, -0.52 * h, -0.2 * h, 0.05 * h, 1.4, '#2a2a1e');
    if (!f.back) {
      const sp = (0.17 - 0.03 * fw) * h;
      dot(ctx, c + sp, -0.08 * h, 0.13 * h, '#1a1012');
      dot(ctx, c - sp, -0.1 * h, 0.1 * h, '#1a1012');
      const eye = elemGlow(s, '#e0f070');
      dot(ctx, c + sp + 0.02 * h, -0.08 * h, Math.max(1.2, 0.06 * h), eye);
      glow(ctx, c + sp, -0.08 * h, 0.4 * h, eye, 0.5);
      teeth(ctx, s, c - 0.1 * h, 0.16 * h, c + 0.24 * h, 0.14 * h, 4, -0.08 * h, '#e0d8b8', 0.8);
    }
  }
  ctx.restore();
  // near arm in front
  shamblerArm(ctx, s, u, lerp(0.34, 0.2, fw) * u, -0.34 * u, f.ax, f.ay, 0, SH_SKIN);
  swoosh(ctx, s, 0.2 * u, -0.3 * u, 0.9 * u, f.aim - 1.3, f.aim + 0.7, 0.32 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Bone Archer
// A skeleton in a tattered moss cloak with a quiver on its back and a recurve bow; ember eyes in the sockets.
const BA_CLOTH = '#5c6b52';
const BA_CAPE = [-0.26, -0.54, 0.16, -0.54, 0.26, -0.1, 0.24, 0.5, 0.24, 0.5, 0.08, 0.34, -0.06, 0.62, -0.06, 0.62, -0.2, 0.4, -0.36, 0.58, -0.36, 0.58, -0.46, 0.3, -0.44, -0.2];
const BA_RIBS = [-0.28, -0.46, 0.28, -0.46, 0.32, -0.16, 0.15, 0.04, -0.15, 0.04, -0.32, -0.16];
const BA_PELVIS = [-0.22, 0.1, -0.25, -0.06, -0.08, -0.08, 0, 0.0, 0.08, -0.08, 0.25, -0.06, 0.22, 0.1, 0, 0.17];

registerDraw('crypt_bone_archer', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  shadow(ctx, s.x, s.y, u * 0.8);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.2, 7));
  const pull = s.pose === 'windup' ? Math.min(1, 0.3 + s.poseT * 1.6) : 0;
  const released = s.pose === 'attack' || s.pose === 'recover';
  const capeSway = Math.sin(s.t * 3) * 0.04 + s.moving * 0.06;
  // tattered cloak and quiver behind
  ctx.save();
  ctx.translate(-capeSway * u, 0);
  shape(ctx, s, BA_CAPE, u, BA_CLOTH, shade(BA_CLOTH, 0.7), 0.12);
  ctx.restore();
  ctx.save();
  ctx.translate(-0.22 * u, -0.36 * u);
  ctx.rotate(-0.45);
  flat(ctx, s, [-0.1, -0.42, 0.1, -0.42, 0.11, 0.36, -0.11, 0.36], u, '#7a5636', 2);
  for (let i = -1; i <= 1; i++) {
    line(ctx, i * 0.05 * u, -0.42 * u, i * 0.06 * u, -0.6 * u, 1.5, '#a08a60');
    flat(ctx, s, [i * 0.06 - 0.05, -0.58, i * 0.06, -0.74, i * 0.06 + 0.05, -0.58, i * 0.06, -0.52], u, '#d8d0b8', 1);
  }
  ctx.restore();
  // legs: bare bones with knobbly knees
  const step = Math.sin(s.t * 7) * 0.12 * u * s.moving;
  for (const [hx, fx2, c] of [
    [-0.11, -0.17 - step / u, BONE_U],
    [0.11, 0.17 + step / u, BONE],
  ] as const) {
    arm(ctx, s, hx * u, 0.24 * u, fx2 * u, 0.74 * u, 0.26 * u, 0.26 * u, -1, 0.07 * u, 0.065 * u, 0.06 * u, c, 1.5);
    oval(ctx, s, J[0]!, J[1]!, 0.09 * u, 0.085 * u, c, 1.5);
    oval(ctx, s, J[2]! + 0.06 * u, J[3]!, 0.12 * u, 0.06 * u, c, 1.5);
  }
  shape(ctx, s, BA_PELVIS, u, BONE, BONE_U, 0.06, 2);
  // spine and ribcage
  cord(ctx, s, 0, 0.18 * u, 0.02 * u, -0.1 * u, 0, -0.5 * u, 0.11 * u, BONE, 2);
  shape(ctx, s, BA_RIBS, u, BONE, BONE_U, 0.1, 2);
  if (!s.flash) {
    ctx.strokeStyle = '#2a241e';
    ctx.lineWidth = Math.max(1.1, 0.045 * u);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const y = (-0.34 + i * 0.12) * u;
      const w = (0.22 - i * 0.03) * u;
      ctx.moveTo(-w, y + 0.04 * u);
      ctx.quadraticCurveTo(-w * 0.5, y - 0.03 * u, -0.05 * u, y);
      ctx.moveTo(w, y + 0.04 * u);
      ctx.quadraticCurveTo(w * 0.5, y - 0.03 * u, 0.05 * u, y);
    }
    ctx.stroke();
  }
  // bow arm reaches toward the facing; the other hand draws the string
  const sx = 0.2 * u;
  const sy = -0.42 * u;
  const gx = sx + f.ax * 0.6 * u;
  const gy = sy + f.ay * 0.55 * u + 0.05 * u;
  const drawBowNow = (): void => {
    bow(ctx, s, gx, gy, f.aim, 0.8 * u, released ? 0 : pull, heat(s, '#8a6a40', 0.3), Math.max(2.5, 0.13 * u));
    const nx = J[0]!;
    const ny = J[1]!;
    if (pull > 0) {
      // nocked arrow, its head glowing in the attack colour
      const tx = nx + f.ax * 1.02 * u;
      const ty = ny + f.ay * 1.02 * u;
      line(ctx, nx, ny, tx, ty, 2, '#d8c8a0');
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(f.aim);
      flat(ctx, s, [0, -0.09, 0.22, 0, 0, 0.09], u, heat(s, '#c0c4cc', 0.9), 1.5);
      ctx.restore();
      hot(ctx, s, tx, ty, 0.6 * u);
    }
    arm(ctx, s, -0.18 * u, -0.42 * u, nx, ny, 0.3 * u, 0.3 * u, -1, 0.065 * u, 0.06 * u, 0.055 * u, BONE, 1.5);
    arm(ctx, s, sx, sy, gx, gy, 0.32 * u, 0.32 * u, 1, 0.065 * u, 0.06 * u, 0.055 * u, BONE, 1.5);
    if (released) streak(ctx, s, gx, gy, gx + f.ax * 1.8 * u, gy + f.ay * 1.8 * u, 0.25 * u);
  };
  if (f.back) drawBowNow();
  skull(ctx, s, 0.05 * u * f.ax, -0.8 * u, 0.74 * u, f.ax * 0.9, f.back, BONE, elemGlow(s, '#ffb040'), s.pose === 'windup' ? 0.25 : 0.05);
  if (!f.back) drawBowNow();
  ctx.restore();
});

// ---------------------------------------------------------------- Crypt Rat (one swarm piece)
const RAT_FUR = '#7e6c62';
const RAT_FUR_U = shade(RAT_FUR, 0.66);
const RAT_PINK = '#d8a0a0';
const RAT_BODY = [-0.95, 0, -0.8, -0.56, -0.1, -0.7, 0.62, -0.42, 1.28, 0, 1.28, 0, 0.62, 0.42, -0.1, 0.7, -0.8, 0.56];

registerDraw('crypt_rat', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u * 0.8, 0.25);
  const lunge = s.pose === 'attack' ? 0.25 : s.pose === 'windup' ? -0.12 : 0;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  ctx.scale(1 + lunge, 1 - lunge * 0.4);
  // tail: a long pink whip
  const wig = Math.sin(s.t * 16 + s.variant * 1.9);
  taper(ctx, s, [-0.85 * u, 0, -1.5 * u, wig * 0.35 * u, -2.1 * u, -wig * 0.2 * u, -2.6 * u, wig * 0.4 * u], 0.28 * u, 0, RAT_PINK, null, 1.5);
  // scurrying feet
  const g = Math.sin(s.t * 26 + s.variant) * 0.22 * u * (0.3 + s.moving * 0.7);
  for (const [lx, side, k] of [
    [0.5, -1, 1],
    [0.5, 1, -1],
    [-0.45, -1, -1],
    [-0.45, 1, 1],
  ] as const) {
    oval(ctx, s, lx * u + g * k, side * 0.64 * u, 0.2 * u, 0.13 * u, RAT_PINK, 1.5);
  }
  shape(ctx, s, RAT_BODY, u, RAT_FUR, RAT_FUR_U, 0.2, 2);
  // bristly ridge down the back
  if (!s.flash) {
    ctx.strokeStyle = shade(RAT_FUR, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const x = (-0.7 + i * 0.32) * u;
      ctx.moveTo(x, -0.14 * u);
      ctx.lineTo(x - 0.18 * u, 0);
      ctx.lineTo(x, 0.14 * u);
    }
    ctx.stroke();
  }
  // ears, eyes, nose and incisors
  oval(ctx, s, 0.42 * u, -0.5 * u, 0.25 * u, 0.21 * u, '#8a7a70', 1.5);
  oval(ctx, s, 0.42 * u, 0.5 * u, 0.25 * u, 0.21 * u, '#8a7a70', 1.5);
  if (!s.flash) {
    dot(ctx, 0.44 * u, -0.5 * u, 0.13 * u, RAT_PINK);
    dot(ctx, 0.44 * u, 0.5 * u, 0.13 * u, RAT_PINK);
    const eye = elemGlow(s, '#ff4a4a');
    dot(ctx, 0.85 * u, -0.25 * u, Math.max(1.1, 0.13 * u), eye);
    dot(ctx, 0.85 * u, 0.25 * u, Math.max(1.1, 0.13 * u), eye);
    dot(ctx, 1.27 * u, 0, Math.max(1, 0.13 * u), '#f0a8a8');
    line(ctx, 1.1 * u, -0.1 * u, 1.45 * u, -0.45 * u, 0.7, withAlpha('#e8e0d0', 0.7));
    line(ctx, 1.1 * u, 0.1 * u, 1.45 * u, 0.45 * u, 0.7, withAlpha('#e8e0d0', 0.7));
  }
  if (s.pose === 'windup' || s.pose === 'attack') {
    flat(ctx, s, [1.2, -0.13, 1.44, -0.06, 1.2, 0], u, heat(s, '#f4f0e0'), 1);
    flat(ctx, s, [1.2, 0.13, 1.44, 0.06, 1.2, 0], u, heat(s, '#f4f0e0'), 1);
  }
  ctx.restore();
  light(0);
  hot(ctx, s, s.x + Math.cos(s.facing) * u * 1.3, s.y + Math.sin(s.facing) * u * 1.3, u * 1.2);
});

// ---------------------------------------------------------------- Gravedigger
// A hulking undead gravedigger: hunched coat with ragged tails, leather apron, a lantern on the belt, a gaunt
// face with ember eyes under a wide hat, and a big spade swung with both hands.
const GD_COAT = '#5e4c38';
const GD_COAT_U = shade(GD_COAT, 0.62);
const GD_APRON = '#947c56';
const GD_SKIN = '#b4b8a2';
const GD_SKIN_U = shade(GD_SKIN, 0.68);
const GD_HAT = '#2e2a22';
const GD_HULK = [
  -0.56, 0.4, -0.64, 0.0, -0.56, -0.36, -0.3, -0.62, 0.1, -0.64, 0.46, -0.44, 0.56, -0.1, 0.52, 0.32, 0.5, 0.62, 0.5, 0.62, 0.3, 0.5, 0.14, 0.7, 0.14, 0.7, -0.04, 0.54, -0.22,
  0.72, -0.22, 0.72, -0.38, 0.54, -0.6, 0.66, -0.6, 0.66,
];
const GD_APRON_P = [0.0, -0.3, 0.5, -0.38, 0.7, 0.2, 0.46, 0.78, 0.02, 0.72];
const GD_FACE = [-0.4, -0.2, 0.0, -0.4, 0.4, -0.25, 0.5, 0.1, 0.36, 0.46, 0.1, 0.58, -0.2, 0.4, -0.42, 0.1];
const GD_BRIM = [-0.66, 0.04, -0.5, -0.12, 0.0, -0.18, 0.5, -0.12, 0.66, 0.04, 0.4, 0.14, 0.0, 0.17, -0.4, 0.14];
const GD_CROWN = [-0.3, -0.04, -0.3, -0.04, -0.26, -0.44, 0.0, -0.5, 0.26, -0.44, 0.3, -0.04, 0.3, -0.04];

registerDraw('crypt_gravedigger', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.5, 3));
  // spade pose: carried low, heaved overhead in the windup, slammed forward on release
  let th: number;
  let px: number;
  let py: number;
  if (s.pose === 'windup') {
    th = -2.05;
    px = 0.02 * u;
    py = -0.8 * u;
  } else if (s.pose === 'attack') {
    th = f.aim * 0.8 + 0.3;
    px = 0.5 * u + f.ax * 0.1 * u;
    py = -0.08 * u + f.ay * 0.2 * u;
  } else {
    th = f.aim * 0.5 + (s.pose === 'recover' ? 0.7 : 1.0);
    px = 0.42 * u;
    py = -0.06 * u;
  }
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  const gx = px - dx * 0.55 * u;
  const gy = py - dy * 0.55 * u;
  const drawSpade = (): void => {
    const bx = px + dx * 1.2 * u;
    const by = py + dy * 1.2 * u;
    capsule(ctx, s, gx - dx * 0.1 * u, gy - dy * 0.1 * u, bx, by, 0.065 * u, 0.06 * u, '#7a5832', 2);
    capsule(ctx, s, gx - dx * 0.12 * u - dy * 0.14 * u, gy - dy * 0.12 * u + dx * 0.14 * u, gx - dx * 0.12 * u + dy * 0.14 * u, gy - dy * 0.12 * u - dx * 0.14 * u, 0.05 * u, 0.05 * u, '#7a5832', 2);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(th);
    shape(ctx, s, [-0.04, -0.24, 0.42, -0.26, 0.66, -0.1, 0.7, 0.0, 0.66, 0.1, 0.42, 0.26, -0.04, 0.24], u, heat(s, '#9aa0a8'), heat(s, '#62666e'), 0.08, 2.5);
    if (!s.flash) mark(ctx, s, [0.46, -0.24, 0.66, -0.1, 0.7, 0.0, 0.66, 0.1, 0.46, 0.24, 0.6, 0.0], u, withAlpha('#9a6a40', 0.7));
    ctx.restore();
    hot(ctx, s, bx + dx * 0.4 * u, by + dy * 0.4 * u, 0.9 * u);
  };
  // stubby legs in heavy boots
  const step = Math.sin(s.t * 3) * 0.12 * u * s.moving;
  capsule(ctx, s, -0.22 * u, 0.32 * u, -0.28 * u - step, 0.68 * u, 0.17 * u, 0.14 * u, '#3a3228', 2.5);
  oval(ctx, s, -0.24 * u - step, 0.72 * u, 0.2 * u, 0.11 * u, '#2a241e', 2.5);
  capsule(ctx, s, 0.2 * u, 0.32 * u, 0.28 * u + step, 0.68 * u, 0.17 * u, 0.14 * u, '#4a4034', 2.5);
  oval(ctx, s, 0.34 * u + step, 0.72 * u, 0.2 * u, 0.11 * u, '#3a3228', 2.5);
  // back arm to the grip, behind the coat
  arm(ctx, s, lerp(-0.42, -0.3, fw) * u, -0.4 * u, gx, gy, 0.42 * u, 0.42 * u, 1, 0.16 * u, 0.13 * u, 0.11 * u, GD_COAT_U, 2.5);
  oval(ctx, s, J[2]!, J[3]!, 0.12 * u, 0.11 * u, GD_SKIN_U, 2);
  if (f.back) drawSpade();
  // the hulking coat with an apron
  shape(ctx, s, GD_HULK, u, GD_COAT, GD_COAT_U, 0.14);
  inside(ctx, GD_HULK, u);
  shape(ctx, s, GD_APRON_P, u, GD_APRON, shade(GD_APRON, 0.72), 0.12, 2);
  if (!s.flash) {
    ctx.setLineDash([2, 3]);
    line(ctx, 0.1 * u, -0.15 * u, 0.12 * u, 0.6 * u, 1, withAlpha('#2a2016', 0.8));
    ctx.setLineDash([]);
    mark(ctx, s, [-0.62, -0.3, -0.42, -0.6, -0.1, -0.64, -0.3, -0.42], u, withAlpha(MOSS, 0.85));
  }
  ctx.restore();
  // belt and lantern
  line(ctx, -0.55 * u, 0.12 * u, 0.55 * u, 0.06 * u, Math.max(2, 0.07 * u), '#1e1a14');
  const lamp = elemGlow(s, '#ffcc66');
  if (!s.flash) glow(ctx, -0.36 * u, 0.32 * u, 0.6 * u, lamp, 0.35 + Math.sin(s.t * 7) * 0.08);
  flat(ctx, s, [-0.44, 0.2, -0.28, 0.2, -0.26, 0.42, -0.46, 0.42], u, '#4a4238', 2);
  if (!s.flash) dot(ctx, -0.36 * u, 0.31 * u, 0.06 * u, lamp);
  // gaunt head between the shoulders, under a wide-brimmed hat
  ctx.save();
  ctx.translate((0.06 + 0.2 * fw) * u, -0.64 * u);
  const h = 0.48 * u;
  shape(ctx, s, GD_FACE, h, GD_SKIN, GD_SKIN_U, 0.12, 2.5);
  if (!f.back && !s.flash) {
    const eye = elemGlow(s, '#ffd27a');
    const c = 0.1 * fw * h;
    const sp = (0.16 - 0.02 * fw) * h;
    dot(ctx, c - sp, 0.0, 0.12 * h, '#1a1410');
    dot(ctx, c + sp, 0.0, 0.12 * h, '#1a1410');
    dot(ctx, c - sp, 0.0, Math.max(1.1, 0.065 * h), eye);
    dot(ctx, c + sp, 0.0, Math.max(1.1, 0.065 * h), eye);
    glow(ctx, c, 0.0, 0.7 * h, eye, 0.35);
    // stitched mouth
    line(ctx, c - 0.18 * h, 0.32 * h, c + 0.2 * h, 0.3 * h, 1.2, '#2a2016');
    for (let i = 0; i < 3; i++) line(ctx, c + (-0.12 + i * 0.13) * h, 0.24 * h, c + (-0.1 + i * 0.13) * h, 0.38 * h, 1, '#2a2016');
  }
  ctx.translate(0, -0.36 * h);
  shape(ctx, s, GD_CROWN, h * 1.2, GD_HAT, shade(GD_HAT, 0.6), 0.08, 2.5);
  if (!s.flash) mark(ctx, s, [-0.3, -0.16, 0.3, -0.16, 0.3, -0.06, -0.3, -0.06], h * 1.2, '#6a5638', false);
  shape(ctx, s, GD_BRIM, h * 1.55, GD_HAT, shade(GD_HAT, 0.55), 0.08, 2.5);
  ctx.restore();
  if (!f.back) drawSpade();
  // front arm to the haft
  arm(ctx, s, lerp(0.42, 0.34, fw) * u, -0.26 * u, px, py, 0.4 * u, 0.4 * u, 1, 0.17 * u, 0.14 * u, 0.12 * u, GD_COAT, 2.5);
  oval(ctx, s, J[2]!, J[3]!, 0.13 * u, 0.12 * u, GD_SKIN, 2);
  swoosh(ctx, s, 0.1 * u, -0.5 * u, 1.9 * u, -2.0, th, 0.5 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Will-o-Wisp
// A wailing spirit of living flame: licking tongues of fire, a hollow face, a flickering tail, rising embers.
// Coloured by its element (Fire in the data), so the room can read it at a glance.
const FLAME_XS = [0.46, 0.22, -0.02, -0.26, -0.48];
const FLAME_HS = [0.62, 0.9, 1.0, 0.82, 0.55];

function flame(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, w: number, h: number, t: number, lean: number, fill: string, outlineW: number): void {
  const p: number[] = [0, 0.62 * w, 0.62 * w, 0.32 * w, 0.66 * w, -0.1 * h];
  for (let i = 0; i < 5; i++) {
    const tipX = FLAME_XS[i]! * w + lean * w * (0.3 + FLAME_HS[i]! * 0.4);
    const tipY = -h * (FLAME_HS[i]! + Math.sin(t * 9 + i * 1.9) * 0.1);
    p.push(tipX, tipY, tipX, tipY);
    if (i < 4) p.push((FLAME_XS[i]! + FLAME_XS[i + 1]!) * 0.5 * w + lean * w * 0.2, -h * (0.3 + Math.sin(t * 7 + i) * 0.05));
  }
  p.push(-0.66 * w, -0.1 * h, -0.62 * w, 0.32 * w);
  ctx.save();
  ctx.translate(x, y);
  shape(ctx, s, p, 1, fill, null, 0, outlineW);
  ctx.restore();
}

registerDraw('crypt_wisp', (ctx, s) => {
  const u = s.r * s.scale;
  const E = ELEMENTS[s.elem === 'physical' ? 'fire' : s.elem];
  const y = s.y - 10 + Math.sin(s.t * 3) * 4;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const flare = s.pose === 'windup' ? 0.25 + striking(s) * 0.35 : s.pose === 'attack' ? 0.5 : 0;
  // shadow and glow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 12, u * 0.7, u * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x, y, u * (4 + flare * 2), E.glow, 0.45 + flare * 0.3);
  // trailing tail of flame, streaming away from the facing
  const wv = Math.sin(s.t * 6);
  taper(
    ctx,
    s,
    [s.x - fx * 0.3 * u, y + 0.3 * u, s.x - fx * 0.9 * u - fy * wv * 0.2 * u, y + 0.5 * u - fy * 0.6 * u, s.x - fx * 1.6 * u + fy * wv * 0.3 * u, y + 0.7 * u - fy * 1.2 * u],
    0.8 * u,
    0,
    E.main,
    null,
    2,
  );
  const lean = -fx * 0.25;
  const k = 1 + flare;
  flame(ctx, s, s.x, y, 0.95 * u * k, 1.85 * u * k, s.t, lean, E.main, 2);
  if (!s.flash) {
    flame(ctx, s, s.x, y + 0.1 * u, 0.68 * u * k, 1.3 * u * k, s.t + 0.7, lean * 1.2, E.glow, 0);
    oval(ctx, null, s.x, y + 0.2 * u, 0.42 * u * k, 0.4 * u * k, mix(E.glow, '#fff6d0', 0.6), 0);
    // hollow face: two eye holes and a wailing mouth, turned to the facing
    const lx = fx * 0.18 * u;
    const ly = fy * 0.1 * u;
    const face = s.pose === 'windup' || s.pose === 'attack' ? mix(atkGlow(s), E.deep, 0.35) : E.deep;
    oval(ctx, null, s.x + lx - 0.16 * u, y + ly + 0.08 * u, 0.09 * u, 0.13 * u, face, 0, -0.3);
    oval(ctx, null, s.x + lx + 0.16 * u, y + ly + 0.08 * u, 0.09 * u, 0.13 * u, face, 0, 0.3);
    oval(ctx, null, s.x + lx, y + ly + 0.36 * u, 0.08 * u, 0.1 * u + flare * 0.1 * u, face, 0);
    hot(ctx, s, s.x + lx, y + ly + 0.15 * u, u * 1.4);
    // embers rising off the crown
    for (let i = 0; i < 4; i++) {
      const kk = (s.t * 0.7 + i * 0.25) % 1;
      const ex = s.x + Math.sin(i * 2.3 + s.t * 2) * u * 0.6;
      const ey = y - u * (1.2 + kk * 1.6);
      dot(ctx, ex, ey, 1.4 * (1 - kk) + 0.4, E.glow);
    }
  }
});

// ---------------------------------------------------------------- Hollow Knight
// Empty plate armour that still fights: a great helm with a soul-lit visor slit and a ragged crest, layered
// pauldrons, a tattered moss tabard and cape, a longsword and a kite shield held toward the facing.
const HK_STEEL = '#8c929a';
const HK_STEEL_U = shade(HK_STEEL, 0.64);
const HK_CLOTH = '#4e6a44';
const HK_CAPE = [-0.32, -0.5, 0.2, -0.5, 0.3, 0.1, 0.24, 0.5, 0.24, 0.5, 0.1, 0.36, -0.04, 0.6, -0.04, 0.6, -0.18, 0.4, -0.34, 0.58, -0.34, 0.58, -0.48, 0.3];
const HK_CHEST = [-0.42, -0.46, 0.42, -0.46, 0.46, -0.14, 0.32, 0.1, -0.32, 0.1, -0.46, -0.14];
const HK_SKIRT = [-0.36, 0.02, 0.36, 0.02, 0.42, 0.36, 0.16, 0.42, -0.16, 0.42, -0.42, 0.36];
const HK_PAULD = [-0.28, 0.06, -0.24, -0.18, 0, -0.27, 0.24, -0.18, 0.28, 0.06, 0, 0.13];
const HK_HELM = [-0.42, 0.46, -0.42, 0.46, -0.46, -0.18, -0.32, -0.5, 0.32, -0.5, 0.46, -0.18, 0.42, 0.46, 0.42, 0.46];
const HK_SHIELD = [-0.3, -0.52, 0.3, -0.52, 0.33, -0.1, 0, 0.62, 0, 0.62, -0.33, -0.1];
const HK_CROSS = [-0.04, -0.4, 0.04, -0.4, 0.04, -0.12, 0.2, -0.12, 0.2, -0.04, 0.04, -0.04, 0.04, 0.36, -0.04, 0.36, -0.04, -0.04, -0.2, -0.04, -0.2, -0.12, -0.04, -0.12];

registerDraw('crypt_hollow_knight', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  shadow(ctx, s.x, s.y, u);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1, 5));
  // sword swing angle around the shoulder; the combo alternates fore- and backhand
  const combo = s.pose === 'attack' ? Math.floor(s.poseT / 0.42) % 2 : 0;
  const phi = s.pose === 'windup' ? -1.95 : s.pose === 'attack' ? f.aim + (combo ? -0.7 : 1.05) : f.aim + (s.pose === 'recover' ? 0.8 : 1.15);
  const ssx = -0.3 * u;
  const ssy = -0.4 * u;
  const hx = ssx + Math.cos(phi) * 0.62 * u;
  const hy = ssy + Math.sin(phi) * 0.62 * u;
  const idle = s.pose !== 'windup' && s.pose !== 'attack';
  const psi = idle ? phi - 1.05 : phi - 0.25;
  const drawSword = (): void => {
    arm(ctx, s, ssx, ssy, hx, hy, 0.34 * u, 0.32 * u, 1, 0.13 * u, 0.115 * u, 0.1 * u, HK_STEEL_U, 2);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(psi);
    shape(ctx, s, [0.12, -0.08, 1.25, -0.065, 1.42, 0, 1.42, 0, 1.25, 0.065, 0.12, 0.08], u, heat(s, '#d4d9e0'), heat(s, '#8a9098'), 0.04, 2);
    if (!s.flash) line(ctx, 0.18 * u, 0, 1.2 * u, 0, 1, withAlpha('#ffffff', 0.55));
    capsule(ctx, s, 0.1 * u, -0.22 * u, 0.1 * u, 0.22 * u, 0.055 * u, 0.055 * u, '#6a5a44', 2);
    capsule(ctx, s, -0.14 * u, 0, 0.08 * u, 0, 0.055 * u, 0.055 * u, '#4a3626', 2);
    oval(ctx, s, -0.17 * u, 0, 0.075 * u, 0.075 * u, '#9aa0a8', 2);
    ctx.restore();
    hot(ctx, s, hx + Math.cos(psi) * 1.1 * u, hy + Math.sin(psi) * 1.1 * u, 1.0 * u);
  };
  const charge = s.pose === 'windup' || s.pose === 'attack' ? 0.15 : 0;
  const drawShield = (): void => {
    ctx.save();
    ctx.translate(0.36 * u * f.ax + f.ax * (0.3 + charge) * u, -0.18 * u + f.ay * (0.42 + charge) * u);
    ctx.rotate(f.ay * 0.35);
    shape(ctx, s, HK_SHIELD, u * 0.95, '#5e7454', '#425238', 0.1, 2.5);
    if (!s.flash) {
      ctx.save();
      ctx.scale(0.8, 0.82);
      smoothPath(ctx, HK_SHIELD, u * 0.95);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#a8aeb6';
      ctx.stroke();
      ctx.restore();
      flat(ctx, s, HK_CROSS, u * 0.95, BONE, 1);
    }
    ctx.restore();
  };
  shape(ctx, s, HK_CAPE, u, HK_CLOTH, shade(HK_CLOTH, 0.65), 0.12, 2.5);
  if (f.back) drawShield();
  // armoured legs
  const step = Math.sin(s.t * 5) * 0.13 * u * s.moving;
  for (const [hipX, footX, c] of [
    [-0.15, -0.2 - step / u, HK_STEEL_U],
    [0.14, 0.2 + step / u, HK_STEEL],
  ] as const) {
    arm(ctx, s, hipX * u, 0.3 * u, footX * u, 0.74 * u, 0.24 * u, 0.24 * u, -1, 0.14 * u, 0.12 * u, 0.11 * u, c, 2);
    oval(ctx, s, J[0]!, J[1]!, 0.11 * u, 0.1 * u, mix(c, '#ffffff', 0.18), 1.5);
    flat(ctx, s, [J[2]! / u - 0.1, J[3]! / u - 0.08, J[2]! / u + 0.12, J[3]! / u - 0.06, J[2]! / u + 0.22, J[3]! / u + 0.04, J[2]! / u - 0.1, J[3]! / u + 0.07], u, c, 2);
  }
  if (f.back) drawSword();
  // tassets, a ragged tabard strip, the breastplate
  shape(ctx, s, HK_SKIRT, u, HK_STEEL_U, shade(HK_STEEL, 0.5), 0.1, 2.5);
  if (!s.flash) line(ctx, -0.38 * u, 0.2 * u, 0.38 * u, 0.2 * u, 1.5, withAlpha(OUTLINE, 0.6));
  flat(ctx, s, [-0.14, -0.1, 0.14, -0.1, 0.15, 0.52, 0.06, 0.42, 0.0, 0.6, -0.07, 0.42, -0.15, 0.54], u, HK_CLOTH, 2);
  shape(ctx, s, HK_CHEST, u, HK_STEEL, HK_STEEL_U, 0.14, 2.5);
  if (!s.flash) {
    line(ctx, 0.04 * u, -0.42 * u, 0.02 * u, 0.06 * u, 1.5, withAlpha(OUTLINE, 0.5));
    spec(ctx, -0.18 * u, -0.3 * u, Math.max(1.2, 0.07 * u), 0.7);
  }
  // pauldrons
  for (const [px, c] of [
    [-0.42, HK_STEEL_U],
    [0.42, HK_STEEL],
  ] as const) {
    ctx.save();
    ctx.translate(px * u, -0.4 * u);
    shape(ctx, s, HK_PAULD, u, c, shade(c, 0.66), 0.1, 2);
    ctx.translate(0, 0.1 * u);
    ctx.scale(0.85, 0.7);
    shape(ctx, s, HK_PAULD, u, c, shade(c, 0.66), 0.1, 1.5);
    ctx.restore();
  }
  if (s.pose === 'windup' && !f.back) drawSword();
  // great helm with a soul-lit slit and a ragged crest
  ctx.save();
  ctx.translate(0.05 * u * f.ax, -0.8 * u);
  const hk = 0.56 * u;
  const crestW = Math.sin(s.t * 4) * 0.08;
  taper(ctx, s, [0, -0.45 * hk, -0.45 * hk, (-0.7 + crestW) * hk, -0.95 * hk, (-0.5 - crestW) * hk, -1.25 * hk, -0.1 * hk], 0.35 * hk, 0, '#9a3a2a', null, 2);
  shape(ctx, s, HK_HELM, hk, mix(HK_STEEL, '#ffffff', 0.1), HK_STEEL_U, 0.14, 2.5);
  if (!s.flash) {
    if (f.back) {
      line(ctx, 0, -0.45 * hk, 0, 0.4 * hk, 1.5, withAlpha(OUTLINE, 0.55));
    } else {
      const lk = f.ax * 0.14 * hk;
      ctx.fillStyle = '#08080c';
      ctx.fillRect(lk - 0.36 * hk, -0.12 * hk, 0.72 * hk, 0.15 * hk);
      ctx.fillRect(lk - 0.065 * hk, -0.05 * hk, 0.13 * hk, 0.42 * hk);
      const soul = elemGlow(s, '#7affc0');
      dot(ctx, lk - 0.18 * hk, -0.045 * hk, Math.max(1.1, 0.065 * hk), soul);
      dot(ctx, lk + 0.18 * hk, -0.045 * hk, Math.max(1.1, 0.065 * hk), soul);
      glow(ctx, lk, -0.05 * hk, 0.9 * hk, soul, 0.5);
      for (let i = 0; i < 3; i++) dot(ctx, lk + 0.22 * hk, (0.15 + i * 0.1) * hk, 0.025 * hk + 0.4, '#08080c');
    }
    line(ctx, -0.46 * hk, -0.22 * hk, 0.46 * hk, -0.22 * hk, 1.2, withAlpha(OUTLINE, 0.45));
  }
  ctx.restore();
  if (s.pose !== 'windup' && !f.back) drawSword();
  if (!f.back) drawShield();
  swoosh(ctx, s, ssx, ssy, 1.6 * u, combo ? f.aim + 1.05 : -1.9, combo ? f.aim - 0.7 : f.aim + 1.05, 0.4 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Ghoul Leaper
// A crouching, long-limbed ghoul: knobbly spine, digitigrade legs, arms that drag hooked claws, and a huge
// bald head split by a grin with far too many teeth.
const GH_SKIN = '#b4bca8';
const GH_SKIN_D = shade(GH_SKIN, 0.74);
const GH_SKIN_U = shade(GH_SKIN, 0.64);
const GH_TORSO = [-0.62, 0.1, -0.52, -0.24, -0.16, -0.44, 0.26, -0.44, 0.46, -0.18, 0.32, 0.14, -0.04, 0.26, -0.42, 0.28];
const GH_HEAD = [-0.45, -0.05, -0.3, -0.46, 0.15, -0.52, 0.52, -0.28, 0.64, 0.04, 0.44, 0.32, 0.0, 0.36, -0.36, 0.2];
const GH_EAR = [-0.18, -0.28, -0.82, -0.62, -0.82, -0.62, -0.08, -0.08];

function ghoulLimbs(ctx: CanvasRenderingContext2D, s: DrawState, u: number, ax: number, ay: number, near: boolean, crouch: number, step: number): void {
  const fill = near ? GH_SKIN : GH_SKIN_D;
  const off = near ? 0.06 * u : -0.08 * u;
  // hind leg: thigh forward, shin back, clawed foot
  const hipX = -0.38 * u + off;
  const hipY = 0.06 * u + crouch * 0.1 * u;
  const footX = -0.18 * u + off + (near ? step : -step);
  arm(ctx, s, hipX, hipY, footX, 0.74 * u, 0.36 * u, 0.36 * u, -1, 0.16 * u, 0.1 * u, 0.07 * u, fill, 2);
  claws(ctx, s, J[2]!, J[3]!, 0.2, 0.22 * u, 3, 0.8, '#e0d8c0');
  // long arm with hooked claws
  const shX = 0.24 * u + off;
  const shY = -0.3 * u;
  let R: number;
  let drop: number;
  if (s.pose === 'windup') {
    R = -0.15;
    drop = -0.3;
  } else if (s.pose === 'attack') {
    R = 1.15;
    drop = near ? 0.25 : -0.05;
  } else {
    R = 0.55;
    drop = 0.55;
  }
  const tx = shX + ax * R * u + (near ? -step : step) * 0.8;
  const ty = shY + ay * R * 0.8 * u + drop * u;
  arm(ctx, s, shX, shY, tx, ty, 0.42 * u, 0.42 * u, 1, 0.11 * u, 0.085 * u, 0.07 * u, fill, 2);
  const a = Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!);
  claws(ctx, s, J[2]!, J[3]!, a + 0.2, 0.36 * u, 3, 1.0, heat(s, '#ece6d0'));
  hot(ctx, s, J[2]!, J[3]!, 0.6 * u);
}

registerDraw('crypt_ghoul', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  const crouch = s.pose === 'windup' ? 1 : 0;
  const leap = s.pose === 'attack' ? 1 : 0;
  ctx.save();
  upright(ctx, s, f, u, bob(s, 2, 10) + crouch * 0.12 * u - leap * 0.15 * u);
  if (crouch) ctx.scale(1.08, 0.86);
  const step = Math.sin(s.t * 10) * 0.16 * u * s.moving;
  ghoulLimbs(ctx, s, u, f.ax, f.ay, false, crouch, step);
  // loincloth rag, then the lean torso with its spine knobs
  flat(ctx, s, [-0.5, 0.12, -0.22, 0.16, -0.3, 0.46, -0.38, 0.36, -0.46, 0.5], u, '#5e4e3c', 2);
  shape(ctx, s, GH_TORSO, u, GH_SKIN, GH_SKIN_U, 0.12, 2.5);
  if (!s.flash) {
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      oval(ctx, s, (-0.52 + t * 0.72) * u, (-0.27 - Math.sin(t * Math.PI) * 0.18) * u, 0.06 * u, 0.05 * u, mix(GH_SKIN, '#ffffff', 0.25), 1.2);
    }
    ctx.strokeStyle = withAlpha(OUTLINE, 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo((0.0 + i * 0.1) * u, -0.12 * u);
      ctx.quadraticCurveTo((0.06 + i * 0.1) * u, 0.02 * u, (0.0 + i * 0.1) * u, 0.14 * u);
    }
    ctx.stroke();
  }
  // big bald head, ear swept back, the grin
  ctx.save();
  ctx.translate((0.18 + 0.36 * fw) * u, -0.42 * u + f.ay * 0.08 * u);
  const h = 0.7 * u;
  shape(ctx, s, GH_EAR, h, GH_SKIN_D, null, 0, 2);
  shape(ctx, s, GH_HEAD, h, mix(GH_SKIN, '#e0e4d4', 0.25), GH_SKIN_U, 0.12, 2.5);
  if (!s.flash && !f.back) {
    const gape = s.pose === 'windup' ? 0.16 : s.pose === 'attack' ? 0.1 : 0.04;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-0.14 * h, 0.04 * h);
    ctx.quadraticCurveTo(0.25 * h, 0.12 * h, 0.62 * h, -0.02 * h);
    ctx.quadraticCurveTo(0.3 * h, (0.32 + gape) * h, -0.14 * h, 0.04 * h);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = heat(s, '#3a1018', 0.4);
    ctx.fill();
    ctx.clip();
    teeth(ctx, s, -0.14 * h, 0.03 * h, 0.62 * h, -0.03 * h, 9, -0.12 * h, '#f4f0e0', 0.5);
    teeth(ctx, s, 0.58 * h, (0.07 + gape * 0.6) * h, -0.1 * h, (0.11 + gape * 0.6) * h, 8, -0.11 * h, '#f4f0e0', 0.5);
    ctx.restore();
    const eye = elemGlow(s, '#ff3030');
    oval(ctx, null, 0.4 * h, -0.2 * h, 0.1 * h, 0.06 * h, eye, 0, -0.3);
    oval(ctx, null, 0.12 * h, -0.22 * h, 0.09 * h, 0.055 * h, eye, 0, -0.2);
    glow(ctx, 0.26 * h, -0.2 * h, 0.6 * h, eye, 0.4);
    hot(ctx, s, 0.3 * h, 0.1 * h, 0.8 * h, 0.6);
  }
  ctx.restore();
  ghoulLimbs(ctx, s, u, f.ax, f.ay, true, crouch, step);
  swoosh(ctx, s, 0.3 * u, -0.3 * u, 1.1 * u, f.aim - 1.2, f.aim + 0.9, 0.3 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Plague Bell
// A bell-wraith: a hooded skull draped in a rotten shroud over a cracked bronze bell. The bell's mouth is
// rimmed with teeth and a small skull swings inside as its clapper; bony hands ring it. Plague motes drift.
const PB_BRONZE = '#8a845a';
const PB_BRONZE_U = shade(PB_BRONZE, 0.6);
const PB_SHROUD = '#5e6a52';
const PB_BELL = [-0.36, -0.62, 0.36, -0.62, 0.52, -0.1, 0.8, 0.42, 1.0, 0.62, 1.0, 0.62, -1.0, 0.62, -1.0, 0.62, -0.8, 0.42, -0.52, -0.1];
const PB_HOOD = [
  -0.42, -0.5, -0.38, -1.0, 0.0, -1.28, 0.38, -1.0, 0.42, -0.5, 0.62, -0.22, 0.62, -0.22, 0.42, -0.3, 0.36, -0.08, 0.36, -0.08, 0.2, -0.3, 0.0, -0.12, 0.0, -0.12, -0.2, -0.3,
  -0.36, -0.06, -0.36, -0.06, -0.42, -0.3, -0.62, -0.2, -0.62, -0.2,
];

registerDraw('crypt_plague_bell', (ctx, s) => {
  const u = s.r * s.scale;
  const y = s.y - 6 + Math.sin(s.t * 2) * 1.5;
  const ringing = s.pose === 'windup' || s.pose === 'attack';
  const motes = elemGlow(s, '#9ae060');
  glow(ctx, s.x, s.y + u * 0.6, u * 2.5, motes, 0.3);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + u * 0.9, u * 0.95, u * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const sway = Math.sin(s.t * (ringing ? 14 : 2)) * (ringing ? 0.2 : 0.06);
  ctx.save();
  ctx.translate(s.x, y - 0.6 * u);
  ctx.rotate(sway);
  ctx.translate(0, 0.6 * u);
  // bony arms out of the shroud, raised to ring while winding up
  const lift = ringing ? 1 : 0;
  for (const side of [-1, 1]) {
    const shx = side * 0.4 * u;
    const shy = -0.5 * u;
    const tx = side * (0.95 - lift * 0.15) * u;
    const ty = (0.05 - lift * 0.85 + Math.sin(s.t * 3 + side) * 0.06) * u;
    arm(ctx, s, shx, shy, tx, ty, 0.38 * u, 0.36 * u, side > 0 ? 1 : -1, 0.075 * u, 0.065 * u, 0.055 * u, BONE_U, 1.5);
    claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.22 * u, 3, 1.1, heat(s, BONE));
    hot(ctx, s, J[2]!, J[3]!, 0.5 * u, 0.7);
  }
  // the bell body
  shape(ctx, s, PB_BELL, u, PB_BRONZE, PB_BRONZE_U, 0.2);
  if (!s.flash) {
    inside(ctx, PB_BELL, u);
    // verdigris streaks, a crack, a raised band near the lip
    mark(ctx, s, [-0.3, -0.5, -0.18, -0.5, -0.28, 0.2, -0.42, 0.5, -0.5, 0.2], u, withAlpha('#8ac070', 0.55));
    mark(ctx, s, [0.3, -0.4, 0.4, -0.2, 0.5, 0.4, 0.38, 0.5, 0.34, 0.0], u, withAlpha('#8ac070', 0.45));
    ctx.fillStyle = mix(PB_BRONZE, '#ffffff', 0.2);
    ctx.fillRect(-1.1 * u, 0.3 * u, 2.2 * u, 0.1 * u);
    ctx.restore();
    line(ctx, 0.12 * u, -0.55 * u, 0.2 * u, -0.25 * u, 1.5, OUTLINE);
    line(ctx, 0.2 * u, -0.25 * u, 0.1 * u, 0.0, 1.5, OUTLINE);
  }
  // toothed mouth with the swinging skull clapper
  oval(ctx, s, 0, 0.62 * u, 0.98 * u, 0.2 * u, heat(s, '#1a1410', 0.5), 2.5);
  if (!s.flash) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0.62 * u, 0.98 * u, 0.2 * u, 0, 0, Math.PI * 2);
    ctx.clip();
    teeth(ctx, s, -0.95 * u, 0.5 * u, 0.95 * u, 0.5 * u, 9, -0.13 * u, '#e0d8b8', 0.6);
    ctx.restore();
    skull(ctx, s, Math.sin(s.t * (ringing ? 14 : 5)) * 0.35 * u, 0.6 * u, 0.36 * u, 0, false, BONE_U, null, 0.2);
  }
  hot(ctx, s, 0, 0.62 * u, 1.4 * u, 0.8);
  // the shroud hood draped over the bell's crown, a skull peering out
  shape(ctx, s, PB_HOOD, u, PB_SHROUD, shade(PB_SHROUD, 0.62), 0.12, 2.5);
  oval(ctx, null, 0, -0.78 * u, 0.3 * u, 0.32 * u, s.flash ? '#ffffff' : '#141810', 0);
  skull(ctx, s, 0, -0.76 * u, 0.5 * u, 0, false, BONE, motes, ringing ? 0.5 : 0.1);
  ctx.restore();
  // drifting plague motes
  if (!s.flash) {
    for (let i = 0; i < 3; i++) {
      const a = s.t * 0.8 + i * 2.1;
      glow(ctx, s.x + Math.cos(a) * u * 1.2, s.y + Math.sin(a * 1.3) * u * 0.6, 8, motes, 0.5);
    }
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

// ---------------------------------------------------------------- Mimic (awake)
// The chest, woken: the lid gapes as a fanged upper jaw with a cluster of yellow eyes, the box is the lower
// jaw, a long tongue lolls out toward its prey, and four jointed spider legs carry it.
const MI_WOOD = '#8a5430';
const MI_LID = '#9a6038';
const MI_LEG = '#5a3428';

function mimicLeg(ctx: CanvasRenderingContext2D, s: DrawState, u: number, hx: number, hy: number, side: number, far: boolean, ph: number): void {
  const scuttle = Math.sin(s.t * 16 + ph) * 0.12 * u * (0.3 + s.moving * 0.7);
  const lift = Math.max(0, Math.sin(s.t * 16 + ph)) * 0.08 * u * s.moving;
  const fx = hx + side * 0.55 * u + scuttle;
  const fy = (far ? 0.56 : 0.78) * u - lift;
  const c = far ? shade(MI_LEG, 0.75) : MI_LEG;
  arm(ctx, s, hx, hy, fx, fy, 0.48 * u, 0.5 * u, side > 0 ? -1 : 1, 0.1 * u, 0.08 * u, 0.05 * u, c, 2);
  oval(ctx, s, J[0]!, J[1]!, 0.09 * u, 0.09 * u, far ? c : '#6e4434', 1.5);
  claws(ctx, s, J[2]!, J[3]!, Math.PI / 2 + side * 0.3, 0.16 * u, 1, 0, '#ece2c8', 1.5);
}

registerDraw('mimic', (ctx, s) => {
  if (!s.awake) {
    drawChest(ctx, s.x, s.y, 0, true, Math.sin(s.t * 2.2) * 0.012, s.flash);
    return;
  }
  const u = s.r * s.scale;
  const f = facing(s);
  const gape = s.pose === 'windup' ? 0.95 : s.pose === 'attack' ? 0.18 : s.pose === 'recover' ? 0.45 : 0.55 + Math.sin(s.t * 8) * 0.1;
  shadow(ctx, s.x, s.y + 4, u * 1.1);
  ctx.save();
  upright(ctx, s, f, u, Math.abs(Math.sin(s.t * 16)) * -1.5 * s.moving);
  // far legs, then the mouth cavity and lid, then the box and the near legs
  mimicLeg(ctx, s, u, -0.45 * u, 0.15 * u, -1, true, 0);
  mimicLeg(ctx, s, u, 0.45 * u, 0.15 * u, 1, true, 2);
  const lidY = -0.08 - gape * 0.85;
  // the mouth: dark red throat between the jaws
  flat(ctx, s, [-0.68, -0.06, 0.68, -0.06, 0.66, lidY + 0.02, -0.66, lidY + 0.02], u, heat(s, '#4a0c14', 0.3), 2.5);
  // lid (upper jaw) with eyes on its face and fangs hanging from its front edge
  flat(ctx, s, [-0.74, lidY + 0.02, 0.74, lidY + 0.02, 0.7, lidY - 0.3, 0.4, lidY - 0.42, -0.4, lidY - 0.42, -0.7, lidY - 0.3], u, MI_LID, 3);
  if (!s.flash) {
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(-0.55 * u, (lidY - 0.4) * u, 0.1 * u, 0.42 * u);
    ctx.fillRect(0.45 * u, (lidY - 0.4) * u, 0.1 * u, 0.42 * u);
  }
  teeth(ctx, s, -0.66 * u, (lidY + 0.02) * u, 0.66 * u, (lidY + 0.02) * u, 7, -0.17 * u, heat(s, '#f4f0e0'), 1);
  // the box: lower jaw with teeth along its rim
  shape(ctx, s, [-0.74, -0.08, 0.74, -0.08, 0.74, 0.56, -0.74, 0.56], u, MI_WOOD, shade(MI_WOOD, 0.7), 0.1, 3, true);
  if (!s.flash) {
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(-0.74 * u, -0.02 * u, 1.48 * u, 0.08 * u);
    ctx.fillRect(-0.55 * u, -0.08 * u, 0.1 * u, 0.64 * u);
    ctx.fillRect(0.45 * u, -0.08 * u, 0.1 * u, 0.64 * u);
    line(ctx, -0.74 * u, 0.28 * u, 0.74 * u, 0.28 * u, 1, withAlpha(OUTLINE, 0.4));
  }
  teeth(ctx, s, 0.66 * u, -0.07 * u, -0.66 * u, -0.07 * u, 7, -0.15 * u, heat(s, '#f4f0e0'), 1);
  // tongue lolling out over the lower jaw toward the facing; it lashes on the windup
  const lash = s.pose === 'windup' ? Math.sin(s.poseT * 9) * 0.5 : Math.sin(s.t * 5) * 0.2;
  const tl = s.pose === 'windup' ? 1.3 : 0.85;
  const ta = f.aim + lash;
  const t0x = 0.05 * u;
  const t0y = -0.1 * u;
  const t2x = t0x + Math.cos(ta) * tl * u;
  const t2y = t0y + Math.sin(ta) * tl * u * 0.8 + 0.4 * u;
  taper(ctx, s, [t0x, t0y, (t0x + t2x) / 2 + Math.sin(s.t * 6) * 0.1 * u, (t0y + t2y) / 2 + 0.08 * u, t2x, t2y], 0.3 * u, 0.14 * u, heat(s, '#d0405a', 0.5), '#9a2038', 2);
  hot(ctx, s, t2x, t2y, 0.6 * u);
  // eyes: a big one where the lock was, smaller ones scattered on the lid
  const lk = f.ax * 0.04 * u;
  const ly = f.ay * 0.03 * u;
  for (const [ex, ey, er] of [
    [0, -0.24, 0.17],
    [-0.38, -0.22, 0.1],
    [0.36, -0.28, 0.09],
  ] as const) {
    const cx = ex * u;
    const cy = (lidY + ey) * u;
    oval(ctx, s, cx, cy, er * u, er * u, '#ffd040', 2);
    if (!s.flash) oval(ctx, null, cx + lk, cy + ly, er * 0.35 * u, er * 0.8 * u, '#1a1008', 0);
  }
  mimicLeg(ctx, s, u, -0.5 * u, 0.4 * u, -1, false, 3.1);
  mimicLeg(ctx, s, u, 0.5 * u, 0.4 * u, 1, false, 5);
  if (s.pose === 'attack') streak(ctx, s, 0, 0, f.ax * 1.6 * u, f.ay * 1.6 * u, 0.5 * u);
  ctx.restore();
});
