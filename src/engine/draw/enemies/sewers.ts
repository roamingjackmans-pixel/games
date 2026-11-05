// Drowned Sewers roster draw functions (sludge green, rust brown, black water, moss; ART_AUDIO §2).
// Upright bodies are drawn facing right inside a mirrored local frame (shapesA.upright); swimmers and crawlers are
// drawn top-down, rotated to their facing. Units inside a body are multiples of its radius u.
import { OUTLINE, glow, mix, shade, shadow, spec, withAlpha } from '../parts';
import { registerDraw, type DrawState } from '../registry';
import {
  arm,
  bob,
  capsule,
  claws,
  cord,
  dot,
  elemGlow,
  elemTint,
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
  swoosh,
  taper,
  teeth,
  upright,
} from '../shapesA';

const RUST = '#8d6a3a';
const MOSS = '#8fa37a';
const WEED = '#3e6a3a';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Expanding water ripples around a wading body. */
function ripples(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, alpha = 0.5): void {
  ctx.save();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.8 + i * 0.5) % 1;
    ctx.strokeStyle = withAlpha('#9ad0d0', alpha * (1 - k));
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.6, r * (0.9 + k * 0.8), r * (0.35 + k * 0.3), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Drowned
// A bloated drowned corpse: pear-shaped body crusted with barnacles, a curtain of pond-weed hair over its face
// with pale eyes peering through, a gaping mouth, and long puffy arms that open wide for the hug.
const DR_SKIN = '#92b8a6';
const DR_SKIN_U = shade(DR_SKIN, 0.68);
const DR_BODY = [-0.5, 0.42, -0.64, 0.06, -0.52, -0.3, -0.2, -0.48, 0.2, -0.48, 0.52, -0.3, 0.64, 0.06, 0.5, 0.42, 0.0, 0.52];
const DR_HEAD = [-0.46, 0.0, -0.4, -0.42, 0.0, -0.56, 0.4, -0.42, 0.46, 0.0, 0.36, 0.34, 0.0, 0.42, -0.36, 0.34];
const DR_HAIR = [
  -0.56, 0.5, -0.56, 0.5, -0.54, -0.2, -0.34, -0.58, 0.08, -0.66, 0.46, -0.5, 0.58, -0.14, 0.56, 0.5, 0.56, 0.5, 0.42, 0.06, 0.32, -0.14, 0.32, -0.14, 0.2, -0.08, 0.08, -0.18, 0.08, -0.18,
  0.02, 0.22, 0.02, 0.22, -0.06, -0.16, -0.06, -0.16, -0.18, -0.08, -0.3, -0.16, -0.3, -0.16, -0.42, 0.06,
];
const DR_HAIR_BACK = [-0.56, 0.54, -0.54, -0.2, -0.34, -0.58, 0.08, -0.66, 0.46, -0.5, 0.58, -0.14, 0.56, 0.54, 0.56, 0.54, 0.3, 0.4, 0.12, 0.6, 0.12, 0.6, -0.08, 0.42, -0.3, 0.6, -0.3, 0.6];

function drownedArm(ctx: CanvasRenderingContext2D, s: DrawState, u: number, sx: number, sy: number, ax: number, ay: number, side: number, fill: string): void {
  const hug = s.pose === 'windup' ? 1 : s.pose === 'attack' ? -0.4 : 0;
  const sway = Math.sin(s.t * 2 + side) * 0.06 * u;
  const tx = sx + ax * (0.7 - hug * 0.1) * u + side * hug * 0.5 * u * (1 - ax * 0.4);
  const ty = sy + ay * 0.55 * u + 0.2 * u - hug * 0.35 * u + sway;
  arm(ctx, s, sx, sy, tx, ty, 0.36 * u, 0.36 * u, side > 0 ? -1 : 1, 0.15 * u, 0.13 * u, 0.1 * u, fill, 2);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.2 * u, 4, 1.0, heat(s, shade(fill, 0.85)), 1.2);
  hot(ctx, s, J[2]!, J[3]!, 0.6 * u);
}

registerDraw('sewers_drowned', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  if (s.moving > 0.2) ripples(ctx, s.x, s.y, u, s.t, 0.35);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.5, 3.5));
  // stubby legs
  const step = Math.sin(s.t * 3.5) * 0.1 * u * s.moving;
  capsule(ctx, s, -0.22 * u, 0.36 * u, -0.26 * u - step, 0.7 * u, 0.15 * u, 0.13 * u, DR_SKIN_U, 2);
  capsule(ctx, s, 0.2 * u, 0.36 * u, 0.26 * u + step, 0.7 * u, 0.15 * u, 0.13 * u, DR_SKIN, 2);
  drownedArm(ctx, s, u, lerp(-0.5, -0.18, fw) * u, -0.3 * u, f.ax, f.ay, -1, DR_SKIN_U);
  // bloated body, rag sash, barnacles
  shape(ctx, s, DR_BODY, u, DR_SKIN, DR_SKIN_U, 0.14);
  inside(ctx, DR_BODY, u);
  flat(ctx, s, [-0.8, 0.12, 0.8, 0.02, 0.8, 0.26, 0.3, 0.4, 0.18, 0.62, 0.0, 0.42, -0.2, 0.66, -0.34, 0.4, -0.8, 0.36], u, '#5e5644', 2);
  if (!s.flash) {
    mark(ctx, s, [-0.62, -0.1, -0.44, -0.34, -0.2, -0.46, -0.3, -0.2], u, withAlpha(WEED, 0.8));
    ctx.strokeStyle = withAlpha('#3a5a50', 0.6);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0.1 * u, -0.3 * u);
    ctx.quadraticCurveTo(0.3 * u, -0.1 * u, 0.2 * u, 0.1 * u);
    ctx.stroke();
  }
  ctx.restore();
  if (!s.flash) {
    for (const [bx, by, br] of [
      [0.36, -0.28, 0.07],
      [0.46, -0.16, 0.05],
      [0.28, -0.14, 0.045],
    ] as const) oval(ctx, null, bx * u, by * u, br * u, br * u, '#c8c4b0', 1.2);
  }
  // round bloated head under a curtain of weed hair
  ctx.save();
  ctx.translate(0.12 * fw * u, -0.64 * u);
  const h = 0.62 * u;
  shape(ctx, s, DR_HEAD, h, mix(DR_SKIN, '#ffffff', 0.12), DR_SKIN_U, 0.12, 2.5);
  const c = 0.12 * fw * h;
  if (!s.flash && !f.back) {
    const gap = s.pose === 'windup' ? 0.14 : 0.08;
    oval(ctx, null, c + 0.02 * h, 0.24 * h, 0.12 * h, gap * h, '#1a2a24', 0);
  }
  // a mop of pond-weed hair: a ragged fringe over the face, long strands down the sides (all of it from behind)
  const sway = Math.sin(s.t * 2) * 0.03;
  ctx.save();
  ctx.translate(f.back ? 0 : c * 0.6, 0);
  shape(ctx, s, f.back ? DR_HAIR_BACK : DR_HAIR, h, WEED, shade(WEED, 0.65), 0.1, 2);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#203a1e', 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(i * 0.16 * h, -0.5 * h);
      ctx.quadraticCurveTo((i * 0.2 + sway) * h, -0.3 * h, i * 0.22 * h, -0.14 * h);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (!s.flash && !f.back) {
    // pale eyes peering out under the fringe
    const eye = elemGlow(s, '#eaf6c8');
    dot(ctx, c - 0.16 * h, -0.01 * h, Math.max(1.2, 0.08 * h), eye);
    dot(ctx, c + 0.18 * h, -0.01 * h, Math.max(1.2, 0.08 * h), eye);
    glow(ctx, c, -0.01 * h, 0.6 * h, eye, 0.35);
  }
  ctx.restore();
  drownedArm(ctx, s, u, lerp(0.5, 0.24, fw) * u, -0.28 * u, f.ax, f.ay, 1, DR_SKIN);
  // drips
  if (!s.flash) {
    const k = (s.t * 1.3) % 1;
    glow(ctx, 0.5 * u, 0.2 * u + k * u * 0.6, 4, '#9ad0d0', 1 - k);
  }
  ctx.restore();
});

// ---------------------------------------------------------------- Green Slime
// A jiggling ooze: a lumpy translucent dome over a dripping puddle, a swallowed skull and a coin floating
// inside, big googly eyes and a mouth that gapes before it bounces.
const SL_GREEN = '#6ad040';

registerDraw('sewers_slime', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u * 0.95);
  const jig = Math.sin(s.t * 7) * 0.06;
  const sq = s.pose === 'windup' ? -0.28 : s.pose === 'attack' ? 0.22 : jig;
  const rx = u * (1 + -sq * 0.6);
  const ry = u * (0.85 + sq);
  const y = s.y + u * 0.15 - (ry - u * 0.85);
  const body = elemTint(s, SL_GREEN, 0.6);
  // puddle with drips
  ctx.save();
  ctx.globalAlpha *= 0.75;
  oval(ctx, s, s.x, s.y + u * 0.58, rx * 1.12, u * 0.24, shade(body, 0.6), 0);
  ctx.restore();
  // lumpy dome
  const p: number[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const lump = 1 + Math.sin(s.t * 4 + i * 2.1) * 0.05 + (i % 2) * 0.04;
    p.push(Math.cos(a) * rx * lump, Math.sin(a) * ry * 1.1 * lump);
  }
  p.push(rx * 1.02, u * 0.38, rx * 0.5, u * 0.56, -rx * 0.5, u * 0.56, -rx * 1.02, u * 0.38);
  ctx.save();
  ctx.translate(s.x, y);
  ctx.save();
  ctx.globalAlpha *= s.flash ? 1 : 0.86;
  shape(ctx, s, p, 1, body, shade(body, 0.66), u * 0.18, 3);
  ctx.restore();
  if (!s.flash) {
    // swallowed junk and bubbles
    ctx.save();
    ctx.globalAlpha *= 0.6;
    skull(ctx, s, -rx * 0.35, u * 0.12, u * 0.42, 0.3, false, '#d8d4b8', null, 0.1);
    oval(ctx, null, rx * 0.4, u * 0.28, u * 0.1, u * 0.07, '#e6c040', 1.2, 0.4);
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const k = (s.t * 0.5 + i * 0.33) % 1;
      ctx.strokeStyle = withAlpha('#e8ffd8', 0.6 * (1 - k));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc((i - 1) * rx * 0.35, u * 0.3 - k * ry * 0.9, 1.5 + i * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // googly eyes and a mouth
    const fx = Math.cos(s.facing);
    const fy = Math.sin(s.facing);
    const ex = fx * rx * 0.18;
    const ey = -ry * 0.4 + fy * ry * 0.08;
    for (const side of [-1, 1]) {
      oval(ctx, null, ex + side * rx * 0.28, ey, u * 0.2, u * 0.22, '#f4fff0', 2);
      dot(ctx, ex + side * rx * 0.28 + fx * u * 0.07, ey + fy * u * 0.07, u * 0.09, '#10200c');
    }
    const gape = s.pose === 'windup' ? 0.22 : s.pose === 'attack' ? 0.1 : 0.05;
    oval(ctx, null, ex, ey + u * 0.36, u * 0.26, gape * u, heat(s, '#1e4a14', 0.6), 1.5);
    hot(ctx, s, ex, ey + u * 0.36, u * 1.1);
    spec(ctx, -rx * 0.5, -ry * 0.7, Math.max(2, u * 0.14), 0.75);
    spec(ctx, -rx * 0.28, -ry * 0.88, Math.max(1, u * 0.06), 0.75);
  }
  ctx.restore();
  if (s.pose === 'windup') glow(ctx, s.x, y, u * 2, '#a6e040', 0.25);
});

// ---------------------------------------------------------------- Sewer Crocodile
// A long armoured crocodile seen from above: rows of back scutes, a ridged tail that sweeps, four sprawled
// clawed legs, raised eye bumps and a long toothy snout. Half under the water while it lurks.
const CR_HIDE = '#5a7a48';
const CR_HIDE_U = shade(CR_HIDE, 0.62);
const CR_SCUTE = '#3e5a34';
const CR_BODY = [1.0, 0, 0.8, -0.42, 0.2, -0.6, -0.5, -0.52, -1.0, -0.32, -1.1, 0, -1.0, 0.32, -0.5, 0.52, 0.2, 0.6, 0.8, 0.42];
const CR_JAW = [0, -0.34, 0.5, -0.3, 1.0, -0.2, 1.22, -0.08, 1.22, 0.0, 0.0, 0.0];

registerDraw('sewers_croc', (ctx, s) => {
  const u = s.r * s.scale;
  const lurking = s.pose === 'idle' && s.moving > 0.2;
  if (!lurking) shadow(ctx, s.x, s.y, u * 1.2);
  const tailSwing = s.pose === 'attack' ? Math.sin(s.poseT * 16) * 1.0 : Math.sin(s.t * 3) * 0.3;
  const gape = s.pose === 'windup' ? 0.32 : s.pose === 'attack' ? 0.04 : 0.06;
  ctx.save();
  if (lurking) ctx.globalAlpha *= 0.62;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  // tail: tapered with a ridge of spikes, swinging from the hips
  const tw = tailSwing;
  const tail = [-0.95 * u, 0, -1.45 * u, Math.sin(tw) * 0.25 * u, -1.95 * u, Math.sin(tw) * 0.55 * u, -2.35 * u, Math.sin(tw) * 0.85 * u];
  taper(ctx, s, tail, 0.62 * u, 0, CR_HIDE, CR_HIDE_U, 2.5);
  if (!s.flash) {
    for (let i = 1; i < 4; i++) {
      const tx = tail[i * 2]!;
      const ty = tail[i * 2 + 1]!;
      flat(ctx, s, [tx / u - 0.08, ty / u - 0.04, tx / u, ty / u - 0.14, tx / u + 0.08, ty / u - 0.04], u, CR_SCUTE, 1.2);
    }
  }
  // sprawled legs
  const gait = Math.sin(s.t * 10) * 0.2 * u * s.moving;
  for (const [lx, g] of [
    [0.45, 1],
    [-0.6, -1],
  ] as const) {
    for (const side of [-1, 1]) {
      const fx = lx * u + gait * g * side + 0.15 * u;
      const fy = side * 0.92 * u;
      arm(ctx, s, lx * u, side * 0.45 * u, fx, fy, 0.32 * u, 0.3 * u, side * (lx > 0 ? -1 : 1), 0.15 * u, 0.12 * u, 0.1 * u, CR_HIDE_U, 2);
      claws(ctx, s, J[2]!, J[3]!, side * 0.4 + (lx > 0 ? 0.2 : -0.2), 0.16 * u, 4, 1.4, '#d8d0b8', 1.2);
    }
  }
  // body with rows of scutes
  shape(ctx, s, CR_BODY, u, CR_HIDE, CR_HIDE_U, 0.16);
  if (!s.flash) {
    // two rows of big scutes down the spine, a row of small ones along each flank
    ctx.fillStyle = CR_SCUTE;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const x = (0.6 - i * 0.36) * u;
      ctx.moveTo(x + 0.13 * u, 0.15 * u);
      ctx.ellipse(x, 0.15 * u, 0.13 * u, 0.09 * u, 0, 0, Math.PI * 2);
      ctx.moveTo(x + 0.13 * u, -0.15 * u);
      ctx.ellipse(x, -0.15 * u, 0.13 * u, 0.09 * u, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = withAlpha(CR_SCUTE, 0.7);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const x = (0.42 - i * 0.36) * u;
      ctx.moveTo(x + 0.09 * u, 0.36 * u);
      ctx.ellipse(x, 0.36 * u, 0.09 * u, 0.06 * u, 0, 0, Math.PI * 2);
      ctx.moveTo(x + 0.09 * u, -0.36 * u);
      ctx.ellipse(x, -0.36 * u, 0.09 * u, 0.06 * u, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  // the snout: two jaws that gape on the windup, teeth along the edges
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(0.85 * u, 0);
    ctx.rotate(side * gape);
    ctx.scale(1, side);
    if (gape > 0.1) flat(ctx, s, [0.05, 0.0, 1.05, -0.04, 1.1, 0.04, 0.05, 0.08], u, heat(s, '#c86a7a', 0.5), 1.5);
    teeth(ctx, s, 0.15 * u, -0.28 * u, 1.05 * u, -0.12 * u, 6, 0.08 * u, heat(s, '#f4f0e0'), 1);
    shape(ctx, s, CR_JAW, u, mix(CR_HIDE, '#ffffff', 0.08), CR_HIDE_U, 0.06, 2.5);
    ctx.restore();
  }
  // eye bumps and nostrils (all that shows while lurking)
  if (!s.flash) {
    for (const side of [-1, 1]) {
      oval(ctx, null, 0.85 * u, side * 0.26 * u, 0.13 * u, 0.11 * u, CR_HIDE, 2);
      oval(ctx, null, 0.88 * u, side * 0.26 * u, 0.08 * u, 0.07 * u, '#e6d040', 0);
      oval(ctx, null, 0.88 * u, side * 0.26 * u, 0.06 * u, 0.018 * u + 0.3, OUTLINE, 0, Math.PI / 2);
      dot(ctx, 1.95 * u, side * 0.05 * u, Math.max(0.8, 0.035 * u), OUTLINE);
    }
  }
  ctx.restore();
  light(0);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  hot(ctx, s, s.x + fx * u * 1.8, s.y + fy * u * 1.8, u * 1.2);
  if (s.pose === 'attack') swoosh(ctx, s, s.x - fx * u * 0.9, s.y - fy * u * 0.9, u * 1.6, s.facing + Math.PI - 1.2, s.facing + Math.PI + 1.2, u * 0.5);
  if (lurking) ripples(ctx, s.x, s.y, u * 1.2, s.t, 0.6);
  else spec(ctx, s.x - u * 0.3, s.y - u * 0.3, 2.5);
});

// ---------------------------------------------------------------- Rat Physician
// A hunched rat in a plague doctor's long coat and wide hat, ears poking through the brim, a long bone-white
// beak mask with round glowing goggles, a bandolier of vials, a cane, and a vial raised to throw.
const RP_COAT = '#504840';
const RP_COAT_U = shade(RP_COAT, 0.6);
const RP_FUR = '#8a7a70';
const RP_COAT_P = [-0.34, -0.42, 0.3, -0.42, 0.42, 0.1, 0.6, 0.66, 0.6, 0.66, 0.3, 0.58, 0.1, 0.7, 0.1, 0.7, -0.12, 0.58, -0.36, 0.68, -0.36, 0.68, -0.58, 0.6, -0.44, 0.1];
const RP_BEAK = [0.18, -0.14, 0.6, -0.08, 1.02, 0.12, 1.02, 0.12, 0.62, 0.1, 0.18, 0.14];
const RP_BRIM = [-0.7, 0.06, -0.52, -0.1, 0.0, -0.15, 0.52, -0.1, 0.7, 0.06, 0.4, 0.14, 0.0, 0.16, -0.4, 0.14];
const RP_CROWN = [-0.32, 0.0, -0.32, 0.0, -0.3, -0.5, 0.3, -0.5, 0.32, 0.0, 0.32, 0.0];

registerDraw('sewers_physician', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u * 0.9);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.5, 11));
  // long tail curling out behind the coat
  const tw = Math.sin(s.t * 6) * 0.15;
  taper(ctx, s, [-0.3 * u, 0.5 * u, -0.9 * u, (0.7 + tw) * u, -1.3 * u, (0.4 - tw) * u, -1.55 * u, (0.05 + tw) * u], 0.2 * u, 0, '#d8a0a0', null, 1.5);
  // rat feet under the coat
  const step = Math.sin(s.t * 11) * 0.1 * u * s.moving;
  oval(ctx, s, -0.18 * u - step, 0.72 * u, 0.15 * u, 0.07 * u, '#d8a0a0', 1.5);
  oval(ctx, s, 0.2 * u + step, 0.72 * u, 0.15 * u, 0.07 * u, '#d8a0a0', 1.5);
  // cane in the far hand
  const cx = lerp(-0.56, -0.4, fw) * u + f.ax * 0.15 * u;
  cord(ctx, s, cx, 0.74 * u, cx + 0.02 * u, 0.1 * u, cx - 0.05 * u, -0.38 * u, Math.max(2, 0.08 * u), RUST, 2);
  arm(ctx, s, lerp(-0.34, -0.2, fw) * u, -0.3 * u, cx - 0.03 * u, -0.2 * u, 0.2 * u, 0.2 * u, 1, 0.09 * u, 0.08 * u, 0.07 * u, RP_COAT_U, 1.5);
  // the coat with a rust sash and a bandolier of vials
  shape(ctx, s, RP_COAT_P, u, RP_COAT, RP_COAT_U, 0.12, 2.5);
  if (!s.flash) {
    inside(ctx, RP_COAT_P, u);
    line(ctx, -0.36 * u, -0.38 * u, 0.4 * u, 0.24 * u, Math.max(2, 0.1 * u), RUST);
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const t = 0.25 + i * 0.22;
      const vx = lerp(-0.36, 0.4, t) * u;
      const vy = lerp(-0.38, 0.24, t) * u;
      oval(ctx, null, vx, vy, 0.05 * u, 0.07 * u, ['#a6e040', '#e06a3a', '#7ac8ff'][i]!, 1);
    }
  }
  // head: grey fur, ears through the brim, the beak mask and goggles
  ctx.save();
  ctx.translate(0.08 * fw * u, -0.6 * u);
  const h = 0.72 * u;
  oval(ctx, s, 0, 0, 0.44 * h, 0.4 * h, RP_FUR, 2.5);
  const eye = elemGlow(s, '#ff7a3a');
  if (!f.back) {
    const c = 0.12 * fw * h;
    const sp = (0.19 - 0.05 * fw) * h;
    if (!s.flash) {
      oval(ctx, null, c - sp, -0.06 * h, 0.13 * h, 0.13 * h, '#2a2420', 1.5);
      oval(ctx, null, c + sp, -0.06 * h, 0.13 * h, 0.13 * h, '#2a2420', 1.5);
      dot(ctx, c - sp, -0.06 * h, 0.085 * h, eye);
      dot(ctx, c + sp, -0.06 * h, 0.085 * h, eye);
      glow(ctx, c, -0.06 * h, 0.6 * h, eye, 0.35);
    }
    // the long beak mask, foreshortened when it points at the camera
    ctx.save();
    ctx.translate(c * 0.5, 0.08 * h);
    ctx.scale(lerp(0.4, 1, fw), lerp(1.3, 1, fw));
    shape(ctx, s, RP_BEAK, h, '#ece2c8', '#b0a688', 0.06, 2);
    ctx.restore();
  }
  // round ears poking through the hat brim
  oval(ctx, s, -0.4 * h, -0.36 * h, 0.15 * h, 0.15 * h, RP_FUR, 1.5);
  oval(ctx, s, 0.4 * h, -0.36 * h, 0.15 * h, 0.15 * h, RP_FUR, 1.5);
  ctx.translate(0, -0.32 * h);
  shape(ctx, s, RP_CROWN, h * 0.9, '#2a2622', '#141210', 0.06, 2);
  if (!s.flash) mark(ctx, s, [-0.31, -0.14, 0.31, -0.14, 0.31, -0.04, -0.31, -0.04], h * 0.9, RUST, false);
  shape(ctx, s, RP_BRIM, h, '#2a2622', '#141210', 0.06, 2);
  ctx.restore();
  // vial arm: raised back in the windup, flung forward
  const wind = s.pose === 'windup';
  const thrown = s.pose === 'attack' || s.pose === 'recover';
  const vsx = lerp(0.36, 0.24, fw) * u;
  const vtx = wind ? vsx - 0.2 * u : vsx + f.ax * (thrown ? 0.62 : 0.32) * u;
  const vty = wind ? -0.85 * u : -0.2 * u + f.ay * (thrown ? 0.5 : 0.2) * u;
  arm(ctx, s, vsx, -0.3 * u, vtx, vty, 0.26 * u, 0.24 * u, 1, 0.09 * u, 0.08 * u, 0.07 * u, RP_COAT, 1.5);
  if (!thrown) {
    const vial = elemGlow(s, '#a6e040');
    oval(ctx, s, J[2]!, J[3]! - 0.1 * u, 0.1 * u, 0.13 * u, heat(s, vial, 0.6), 1.5);
    if (!s.flash) glow(ctx, J[2]!, J[3]! - 0.1 * u, 0.5 * u, vial, 0.4);
    hot(ctx, s, J[2]!, J[3]! - 0.1 * u, 0.7 * u);
  } else streak(ctx, s, J[2]!, J[3]!, J[2]! + f.ax * 1.2 * u, J[3]! + f.ay * 1.2 * u, 0.2 * u);
  oval(ctx, s, J[2]!, J[3]!, 0.07 * u, 0.07 * u, '#d8a0a0', 1.2);
  ctx.restore();
});

// ---------------------------------------------------------------- Harpooner
// A hunched fish-man fisher in a yellow oilskin and sou'wester: a bulbous head with huge round eyes, a wide
// needle-toothed frown, a dorsal fin poking out the back of the hat, webbed hands on a barbed harpoon with rope.
const HP_COAT = '#d8b030';
const HP_COAT_U = shade(HP_COAT, 0.66);
const HP_SKIN = '#6a9a8a';
const HP_SKIN_U = shade(HP_SKIN, 0.68);
const HP_COAT_P = [-0.4, -0.38, 0.36, -0.38, 0.48, 0.1, 0.52, 0.58, 0.0, 0.66, -0.54, 0.58, -0.5, 0.1];
const HP_HEAD = [-0.44, 0.1, -0.42, -0.3, -0.1, -0.52, 0.3, -0.46, 0.52, -0.18, 0.56, 0.12, 0.36, 0.36, -0.1, 0.38, -0.36, 0.3];
const HP_FIN = [-0.2, -0.36, -0.5, -0.9, -0.5, -0.9, -0.62, -0.62, -0.84, -0.72, -0.84, -0.72, -0.7, -0.3];
const HP_HAT = [-0.62, 0.06, -0.4, -0.26, 0.0, -0.36, 0.4, -0.26, 0.56, -0.02, 0.36, 0.06, 0.0, 0.02, -0.4, 0.1];

registerDraw('sewers_harpooner', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.2, 6));
  const wind = s.pose === 'windup';
  const thrown = s.pose === 'attack' || s.pose === 'recover';
  // the harpoon: shouldered and drawn back in the windup, gone once thrown (only the rope trails out)
  const ha = wind ? f.aim - 0.25 : f.aim * 0.6 + 0.35;
  const hcx = wind ? -0.25 * u : 0.15 * u;
  const hcy = wind ? -0.62 * u : -0.12 * u;
  const hdx = Math.cos(ha);
  const hdy = Math.sin(ha);
  const drawHarpoon = (): void => {
    if (thrown) {
      cord(ctx, s, -0.3 * u, 0.22 * u, f.ax * 0.8 * u, f.ay * 0.6 * u, f.ax * 2.2 * u, f.ay * 1.8 * u - 0.1 * u, 1.5, '#d8c890', 1.5);
      return;
    }
    const tx = hcx + hdx * 1.15 * u;
    const ty = hcy + hdy * 1.15 * u;
    capsule(ctx, s, hcx - hdx * 0.75 * u, hcy - hdy * 0.75 * u, tx, ty, 0.05 * u, 0.05 * u, RUST, 2);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(ha);
    flat(ctx, s, [0, -0.08, 0.34, 0, 0, 0.08, 0.05, 0], u, heat(s, '#c9ced6'), 2);
    flat(ctx, s, [0.02, -0.07, -0.12, -0.2, 0.04, -0.03], u, heat(s, '#c9ced6'), 1.5);
    flat(ctx, s, [0.02, 0.07, -0.12, 0.2, 0.04, 0.03], u, heat(s, '#c9ced6'), 1.5);
    ctx.restore();
    hot(ctx, s, tx + hdx * 0.2 * u, ty + hdy * 0.2 * u, 0.7 * u);
  };
  // webbed feet
  const step = Math.sin(s.t * 6) * 0.1 * u * s.moving;
  capsule(ctx, s, -0.18 * u, 0.4 * u, -0.22 * u - step, 0.68 * u, 0.1 * u, 0.09 * u, HP_SKIN_U, 2);
  flat(ctx, s, [(-0.3 - step / u), 0.66, (-0.06 - step / u), 0.64, (-0.02 - step / u), 0.76, (-0.32 - step / u), 0.76], u, HP_SKIN_U, 1.5);
  capsule(ctx, s, 0.18 * u, 0.4 * u, 0.22 * u + step, 0.68 * u, 0.1 * u, 0.09 * u, HP_SKIN, 2);
  flat(ctx, s, [(0.1 + step / u), 0.64, (0.36 + step / u), 0.64, (0.4 + step / u), 0.76, (0.08 + step / u), 0.76], u, HP_SKIN, 1.5);
  if (f.back) drawHarpoon();
  // back hand on the haft
  arm(ctx, s, lerp(-0.42, -0.26, fw) * u, -0.3 * u, hcx - hdx * 0.45 * u, hcy - hdy * 0.45 * u, 0.28 * u, 0.28 * u, 1, 0.1 * u, 0.09 * u, 0.08 * u, HP_COAT_U, 2);
  // oilskin coat with a rope coil at the hip
  shape(ctx, s, HP_COAT_P, u, HP_COAT, HP_COAT_U, 0.14, 2.5);
  if (!s.flash) {
    line(ctx, 0.02 * u, -0.3 * u, 0.0, 0.62 * u, 1.5, withAlpha(OUTLINE, 0.5));
    for (let i = 0; i < 3; i++) dot(ctx, 0.08 * u, (-0.18 + i * 0.22) * u, Math.max(0.8, 0.04 * u), '#5a4a20');
    ctx.strokeStyle = '#c8b080';
    ctx.lineWidth = Math.max(1.5, 0.06 * u);
    ctx.beginPath();
    ctx.ellipse(-0.3 * u, 0.24 * u, 0.2 * u, 0.13 * u, 0, 0, Math.PI * 2);
    ctx.ellipse(-0.3 * u, 0.24 * u, 0.13 * u, 0.08 * u, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // fish head: fin through the hat, huge eyes, needle-toothed frown, gills
  ctx.save();
  ctx.translate(0.1 * fw * u, -0.62 * u);
  const h = 0.76 * u;
  shape(ctx, s, HP_FIN, h, mix(HP_SKIN, '#ff8a6a', 0.3), null, 0, 2);
  shape(ctx, s, HP_HEAD, h, HP_SKIN, HP_SKIN_U, 0.12, 2.5);
  if (!s.flash && !f.back) {
    const c = 0.14 * fw * h;
    const sp = (0.22 - 0.06 * fw) * h;
    const eye = elemGlow(s, '#f0e040');
    for (const side of [-1, 1]) {
      oval(ctx, null, c + side * sp, -0.08 * h, 0.15 * h, 0.15 * h, eye, 1.5);
      dot(ctx, c + side * sp + f.ax * 0.04 * h, -0.07 * h, 0.07 * h, '#10140c');
    }
    const gape = wind ? 0.1 : 0.04;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(c - 0.3 * h, 0.2 * h);
    ctx.quadraticCurveTo(c, 0.1 * h, c + 0.34 * h, 0.2 * h);
    ctx.quadraticCurveTo(c, (0.3 + gape) * h, c - 0.3 * h, 0.2 * h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = '#1a2420';
    ctx.fill();
    ctx.clip();
    teeth(ctx, s, c - 0.28 * h, 0.15 * h, c + 0.32 * h, 0.15 * h, 7, -0.08 * h, '#f4f0e0', 0.5);
    ctx.restore();
    for (let i = 0; i < 2; i++) line(ctx, -0.32 * h + i * 0.07 * h, 0.0, -0.36 * h + i * 0.07 * h, 0.2 * h, 1, withAlpha(OUTLINE, 0.6));
  }
  ctx.translate(-0.02 * h, -0.36 * h);
  shape(ctx, s, HP_HAT, h, '#e8c038', HP_COAT_U, 0.08, 2.5);
  ctx.restore();
  if (!f.back) drawHarpoon();
  // front hand on the haft
  arm(ctx, s, lerp(0.42, 0.28, fw) * u, -0.3 * u, hcx + hdx * 0.15 * u, hcy + hdy * 0.15 * u, 0.28 * u, 0.28 * u, 1, 0.1 * u, 0.09 * u, 0.08 * u, HP_COAT, 2);
  oval(ctx, s, J[2]!, J[3]!, 0.08 * u, 0.08 * u, HP_SKIN, 1.5);
  if (thrown) streak(ctx, s, 0.2 * u, -0.2 * u, f.ax * 2.2 * u, f.ay * 1.8 * u - 0.1 * u, 0.25 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Leech (one swarm piece)
// A ringed black leech, tapering behind a round sucker mouth lined with tiny teeth; it rears before it leaps.
const LE_BODY = '#3a3444';

registerDraw('sewers_leech', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u * 0.8, 0.22);
  const wig = s.t * 14 + s.variant * 1.9;
  const rear = s.pose === 'windup' ? 0.25 : 0;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  const sp: number[] = [];
  for (let i = 0; i < 5; i++) sp.push(0.6 * u - i * 0.62 * u * (1 - rear), Math.sin(wig - i * 1.0) * 0.32 * u * (i / 4));
  taper(ctx, s, sp, 1.25 * u, 0.3 * u, LE_BODY, shade(LE_BODY, 0.6), 2);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#8a9a5a', 0.7);
    ctx.lineWidth = Math.max(1, 0.12 * u);
    ctx.beginPath();
    ctx.moveTo(sp[0]!, sp[1]!);
    for (let i = 1; i < 5; i++) ctx.lineTo(sp[i * 2]!, sp[i * 2 + 1]!);
    ctx.stroke();
    ctx.strokeStyle = withAlpha('#120e14', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const x = sp[i * 2]!;
      const y = sp[i * 2 + 1]!;
      ctx.moveTo(x, y - 0.5 * u);
      ctx.lineTo(x, y + 0.5 * u);
    }
    ctx.stroke();
  }
  // sucker mouth
  oval(ctx, s, 0.68 * u, 0, 0.42 * u, 0.46 * u, mix(LE_BODY, '#ffffff', 0.12), 2);
  if (!s.flash) {
    oval(ctx, null, 0.74 * u, 0, 0.26 * u, 0.3 * u, heat(s, '#c0304a', 0.6), 0);
    ctx.fillStyle = '#f4e8e0';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + s.t;
      const x = 0.74 * u + Math.cos(a) * 0.22 * u;
      const y = Math.sin(a) * 0.25 * u;
      ctx.moveTo(x + 0.05 * u + 0.3, y);
      ctx.arc(x, y, 0.05 * u + 0.3, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
  light(0);
  hot(ctx, s, s.x + Math.cos(s.facing) * u * 0.8, s.y + Math.sin(s.facing) * u * 0.8, u * 2);
  if (s.pose === 'windup') glow(ctx, s.x, s.y, u * 2.2, '#ff3b3b', 0.2);
});

// ---------------------------------------------------------------- Bloated Carrier
// An enormous stitched belly of plague on stubby legs: pustules and veins all over, a tiny idiot head with a
// lolling tongue perched on top, little arms. It swells and glows before it bursts.
const BC_SKIN = '#8aa068';
const BC_SKIN_U = shade(BC_SKIN, 0.66);

registerDraw('sewers_carrier', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  const swelling = s.pose === 'windup' ? Math.min(1, s.poseT / 1.2) : 0;
  const pulse = swelling > 0 ? Math.sin(s.t * (10 + swelling * 20)) * 0.04 * swelling : Math.sin(s.t * 2) * 0.02;
  const k = 1 + swelling * 0.28 + pulse;
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1, 2.5));
  // stubby legs
  const step = Math.sin(s.t * 5) * 0.08 * u * s.moving;
  capsule(ctx, s, -0.32 * u, 0.5 * u, -0.36 * u - step, 0.72 * u, 0.16 * u, 0.14 * u, BC_SKIN_U, 2);
  capsule(ctx, s, 0.3 * u, 0.5 * u, 0.34 * u + step, 0.72 * u, 0.16 * u, 0.14 * u, BC_SKIN, 2);
  if (swelling > 0 && !s.flash) glow(ctx, 0, 0, u * (1.8 + swelling), heat(s, '#a6e040', 0.6), 0.25 + swelling * 0.4);
  // the belly
  ctx.save();
  ctx.scale(k, k);
  const belly = [-0.9, 0.2, -0.88, -0.4, -0.4, -0.86, 0.3, -0.88, 0.86, -0.42, 0.94, 0.2, 0.6, 0.62, 0.0, 0.72, -0.6, 0.62];
  shape(ctx, s, belly, u, swelling > 0.6 ? mix(BC_SKIN, '#d8f080', 0.3) : BC_SKIN, BC_SKIN_U, 0.18);
  if (!s.flash) {
    // stitched seam and veins
    ctx.strokeStyle = '#3a2a20';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-0.1 * u, -0.7 * u);
    ctx.quadraticCurveTo(0.15 * u, 0.0, -0.05 * u, 0.62 * u);
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const yy = (-0.62 + t * 1.2) * u;
      const xx = (Math.sin(t * Math.PI) * 0.12 - 0.08) * u;
      ctx.moveTo(xx - 0.07 * u, yy - 0.03 * u);
      ctx.lineTo(xx + 0.07 * u, yy + 0.03 * u);
    }
    ctx.stroke();
    ctx.strokeStyle = withAlpha('#5a3a5a', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-0.6 * u, -0.3 * u);
    ctx.quadraticCurveTo(-0.4 * u, -0.1 * u, -0.5 * u, 0.2 * u);
    ctx.moveTo(0.5 * u, -0.5 * u);
    ctx.quadraticCurveTo(0.35 * u, -0.2 * u, 0.55 * u, 0.0);
    ctx.stroke();
    const pus = heat(s, '#d8e070', 0.8);
    for (const [px, py, pr] of [
      [-0.5, -0.2, 0.15],
      [0.55, 0.15, 0.12],
      [0.25, 0.42, 0.1],
      [-0.35, 0.4, 0.08],
      [0.45, -0.45, 0.09],
    ] as const) {
      oval(ctx, null, px * u, py * u, pr * u, pr * u, pus, 1.5);
      spec(ctx, (px - pr * 0.3) * u, (py - pr * 0.35) * u, Math.max(0.8, pr * 0.3 * u), 0.7);
    }
    spec(ctx, -0.45 * u, -0.55 * u, Math.max(1.5, 0.1 * u), 0.6);
  }
  ctx.restore();
  hot(ctx, s, 0, 0, u * 1.6, 0.5);
  // little arms
  for (const side of [-1, 1]) {
    const sx = side * 0.8 * k * u;
    arm(ctx, s, sx, -0.3 * u, sx + side * 0.18 * u + f.ax * 0.2 * u, 0.0 + Math.sin(s.t * 3 + side) * 0.05 * u, 0.18 * u, 0.18 * u, side, 0.1 * u, 0.09 * u, 0.08 * u, side < 0 ? BC_SKIN_U : BC_SKIN, 2);
  }
  // tiny head on top
  ctx.save();
  ctx.translate(0.1 * fw * u, -0.88 * k * u);
  const h = 0.42 * u;
  oval(ctx, s, 0, 0, 0.42 * h, 0.4 * h, mix(BC_SKIN, '#ffffff', 0.1), 2.5);
  if (!s.flash && !f.back) {
    const c = 0.14 * fw * h;
    dot(ctx, c - 0.14 * h, -0.06 * h, Math.max(1, 0.07 * h), OUTLINE);
    dot(ctx, c + 0.16 * h, -0.08 * h, Math.max(1, 0.06 * h), OUTLINE);
    oval(ctx, null, c + 0.02 * h, 0.16 * h, 0.13 * h, 0.09 * h, '#3a1a20', 0);
    oval(ctx, null, c + 0.08 * h, 0.26 * h, 0.07 * h, 0.08 * h, '#d86a7a', 1);
  }
  ctx.restore();
  ctx.restore();
  ripples(ctx, s.x, s.y, u, s.t, 0.2);
});

// ---------------------------------------------------------------- Tide Caller
// A sea-priest in a tattered teal robe and hood: a fish-pale face with a beard of writhing tentacles, a crown of
// scallop shells, a driftwood staff hooked like a wave with a glowing pearl, water circling its feet.
const TC_ROBE = '#2e6070';
const TC_ROBE_U = shade(TC_ROBE, 0.62);
const TC_ROBE_P = [-0.36, -0.44, 0.32, -0.44, 0.5, 0.1, 0.62, 0.68, 0.62, 0.68, 0.36, 0.56, 0.16, 0.72, 0.16, 0.72, -0.06, 0.56, -0.28, 0.72, -0.28, 0.72, -0.48, 0.56, -0.66, 0.66, -0.66, 0.66, -0.52, 0.1];
const TC_HOOD = [-0.44, 0.2, -0.46, -0.28, -0.2, -0.56, 0.2, -0.56, 0.46, -0.28, 0.44, 0.2, 0.2, 0.34, -0.2, 0.34];

registerDraw('sewers_tide_caller', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  const water = elemGlow(s, '#6ac8e8');
  // swirling water ring
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = withAlpha(water, casting ? 0.75 : 0.4);
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + u * 0.6, u * 1.4, u * 0.55, 0, s.t * 2, s.t * 2 + Math.PI * 1.3);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1, 3));
  // driftwood staff with a crescent hook and a pearl
  const top = casting ? 1.75 : 1.4;
  const stx = lerp(-0.62, -0.46, fw) * u;
  const drawStaff = (): void => {
    cord(ctx, s, stx, 0.72 * u, stx - 0.06 * u, -0.4 * u, stx + 0.02 * u, -top * u, Math.max(2.5, 0.11 * u), RUST, 2);
    ctx.save();
    ctx.translate(stx + 0.02 * u, -top * u - 0.22 * u);
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(4, 0.2 * u);
    ctx.beginPath();
    ctx.arc(0, 0, 0.24 * u, Math.PI * 0.15, Math.PI * 1.25);
    ctx.stroke();
    ctx.strokeStyle = s.flash ? '#ffffff' : '#a8d8d0';
    ctx.lineWidth = Math.max(2, 0.1 * u);
    ctx.stroke();
    const pearl = casting ? heat(s, water, 0.8) : '#f4f8ff';
    if (!s.flash) glow(ctx, 0, 0, (casting ? 1.3 : 0.6) * u, water, casting ? 0.8 : 0.4);
    oval(ctx, s, 0, 0, 0.1 * u, 0.1 * u, pearl, 1.5);
    ctx.restore();
    arm(ctx, s, lerp(-0.34, -0.22, fw) * u, -0.3 * u, stx + 0.03 * u, (casting ? -0.6 : -0.2) * u, 0.26 * u, 0.24 * u, 1, 0.09 * u, 0.08 * u, 0.07 * u, TC_ROBE_U, 2);
  };
  if (!f.back) drawStaff();
  // robe with a seaweed sash
  shape(ctx, s, TC_ROBE_P, u, elemTint(s, TC_ROBE, 0.5), TC_ROBE_U, 0.14);
  if (!s.flash) {
    inside(ctx, TC_ROBE_P, u);
    ctx.strokeStyle = MOSS;
    ctx.lineWidth = Math.max(2, 0.1 * u);
    ctx.beginPath();
    ctx.moveTo(-0.4 * u, -0.25 * u);
    ctx.quadraticCurveTo(0.0, 0.15 * u + Math.sin(s.t * 3) * 0.04 * u, 0.5 * u, 0.32 * u);
    ctx.stroke();
    ctx.restore();
  }
  if (f.back) drawStaff();
  // hood, the pale fish face, tentacle beard, shell crown
  ctx.save();
  ctx.translate(0.08 * fw * u, -0.66 * u);
  const h = 0.76 * u;
  shape(ctx, s, TC_HOOD, h, shade(TC_ROBE, 0.9), TC_ROBE_U, 0.1, 2.5);
  if (!f.back) {
    const c = 0.12 * fw * h;
    oval(ctx, s, c, 0.0, 0.28 * h, 0.3 * h, '#b8d4cc', 2);
    // tentacle beard, writhing (they curl forward while casting)
    for (let i = -2; i <= 2; i++) {
      const tx = c + i * 0.1 * h;
      const wv = Math.sin(s.t * 3 + i * 1.3) * 0.08 * h + (casting ? f.ax * 0.1 * h : 0);
      taper(ctx, s, [tx, 0.12 * h, tx + wv, 0.36 * h, tx - wv * 0.5, 0.56 * h - Math.abs(i) * 0.06 * h], 0.1 * h, 0.02 * h, i % 2 ? '#8ab8ac' : '#a0c8bc', null, 1.5);
    }
    if (!s.flash) {
      const eye = elemGlow(s, '#9ae8ff');
      oval(ctx, null, c - 0.11 * h, -0.05 * h, 0.07 * h, 0.05 * h, eye, 0, -0.2);
      oval(ctx, null, c + 0.11 * h, -0.05 * h, 0.07 * h, 0.05 * h, eye, 0, 0.2);
      glow(ctx, c, -0.05 * h, 0.5 * h, eye, 0.4);
    }
  }
  ctx.translate(0, -0.48 * h);
  for (let i = -2; i <= 2; i++) {
    const a = -Math.PI / 2 + i * 0.36;
    flat(ctx, s, [0, 0.1, Math.cos(a - 0.15) * 0.42, Math.sin(a - 0.15) * 0.42, Math.cos(a) * 0.48, Math.sin(a) * 0.48, Math.cos(a + 0.15) * 0.42, Math.sin(a + 0.15) * 0.42], h, i % 2 ? '#e8c8b0' : '#f8dcc8', 1.5, true);
  }
  ctx.restore();
  // free hand raised to call the wave
  const hx = lerp(0.34, 0.22, fw) * u;
  const tx = hx + f.ax * (casting ? 0.6 : 0.3) * u;
  const ty = (casting ? -0.55 : -0.05) * u + f.ay * 0.3 * u;
  arm(ctx, s, hx, -0.3 * u, tx, ty, 0.26 * u, 0.24 * u, 1, 0.09 * u, 0.08 * u, 0.07 * u, TC_ROBE, 2);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.16 * u, 3, 1.2, heat(s, '#b8d4cc'), 1.2);
  hot(ctx, s, J[2]!, J[3]!, 0.9 * u);
  ctx.restore();
  // a stray drop hovering in the ring
  if (!s.flash) {
    const da = s.t * 2.6;
    glow(ctx, s.x + Math.cos(da) * u * 1.3, s.y + u * 0.6 + Math.sin(da) * u * 0.5, 6, water, 0.6);
  }
});

// ---------------------------------------------------------------- Sewer Diver
// An old brass deep-sea diving suit that never came back up: a round brass helmet with a porthole full of murky
// green water (a small fish still lives in there), a bolted collar, a muck-stained canvas suit, lead boots, an air
// hose trailing behind, a pipe wrench in the near hand and an anchor on a chain swinging from the far one.
const DV_BRASS = '#c49440';
const DV_BRASS_U = shade(DV_BRASS, 0.6);
const DV_SUIT = '#a89a78';
const DV_SUIT_U = shade(DV_SUIT, 0.64);
const DV_LEAD = '#4c4e56';
const DV_IRON = '#6a6e76';
const DV_BODY = [-0.52, -0.34, -0.22, -0.5, 0.24, -0.5, 0.54, -0.32, 0.62, 0.1, 0.52, 0.46, 0.0, 0.54, -0.52, 0.46, -0.62, 0.1];
const DV_MUCK = [-0.66, 0.2, -0.36, 0.08, -0.1, 0.22, 0.2, 0.1, 0.44, 0.2, 0.66, 0.16, 0.6, 0.6, 0.0, 0.62, -0.62, 0.6];
const DV_COLLAR = [-0.5, -0.34, -0.34, -0.56, 0.34, -0.56, 0.5, -0.34, 0.3, -0.2, 0.0, -0.16, -0.3, -0.2];

/** An anchor centred on its shank (k ≈ its height), ring at the top (−y), flukes at the bottom. */
function anchor(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, k: number, iron: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  const w = Math.max(2, 0.1 * k);
  cord(ctx, s, -0.46 * k, 0.16 * k, 0, 0.86 * k, 0.46 * k, 0.16 * k, w, iron, 2);
  for (const side of [-1, 1]) flat(ctx, s, [side * 0.36, 0.12, side * 0.56, 0.02, side * 0.5, 0.3], k, iron, 1.5);
  capsule(ctx, s, 0, -0.42 * k, 0, 0.46 * k, w * 0.55, w * 0.6, iron, 2);
  capsule(ctx, s, -0.24 * k, -0.3 * k, 0.24 * k, -0.3 * k, w * 0.45, w * 0.45, iron, 2);
  ctx.beginPath();
  ctx.arc(0, -0.54 * k, 0.11 * k, 0, Math.PI * 2);
  ctx.lineWidth = w * 0.6 + 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = w * 0.6;
  ctx.strokeStyle = s.flash ? '#ffffff' : iron;
  ctx.stroke();
  ctx.restore();
}

/** A heavy chain between two points (dark links over an outline), sagging by `sag`. */
function chain(ctx: CanvasRenderingContext2D, s: DrawState, x0: number, y0: number, x1: number, y1: number, sag: number, w: number): void {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 + sag;
  cord(ctx, s, x0, y0, cx, cy, x1, y1, w, '#3a3c42', 1.5);
  if (s.flash) return;
  ctx.save();
  ctx.setLineDash([Math.max(2, w * 0.9), Math.max(2, w * 0.7)]);
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#8a8e96';
  ctx.lineWidth = w * 0.55;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  ctx.restore();
}

registerDraw('sewers_diver', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  if (s.moving > 0.2) ripples(ctx, s.x, s.y, u, s.t, 0.3);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.2, 4));
  const wind = s.pose === 'windup';
  const swing = s.pose === 'attack';
  // the anchor: dangling from the far hand, heaved overhead in the windup, flung forward on release
  const sway = Math.sin(s.t * 2.2) * 0.12 * u * (1 - s.moving * 0.5) + s.moving * Math.sin(s.t * 8) * 0.06 * u;
  const fsx = lerp(-0.44, -0.3, fw) * u;
  const fsy = -0.36 * u;
  const ak = 0.78 * u;
  let ahx: number;
  let ahy: number;
  let ax: number;
  let ay: number;
  let aa: number;
  if (wind) {
    ahx = -0.2 * u;
    ahy = -1.05 * u;
    ax = -0.7 * u + Math.sin(s.t * 9) * 0.05 * u;
    ay = -1.45 * u;
    aa = -2.2;
  } else if (swing) {
    ahx = fsx + f.ax * 0.5 * u;
    ahy = -0.4 * u + f.ay * 0.3 * u;
    ax = f.ax * 1.5 * u;
    ay = -0.1 * u + f.ay * 1.1 * u;
    aa = f.aim - Math.PI / 2;
  } else {
    ahx = fsx - 0.3 * u;
    ahy = 0.08 * u;
    ax = fsx - 0.42 * u + sway;
    ay = 0.42 * u;
    aa = -sway / u;
  }
  // the ring sits 0.54 k up the shank
  const ringX = ax + Math.sin(aa) * 0.54 * ak;
  const ringY = ay - Math.cos(aa) * 0.54 * ak;
  const drawAnchor = (): void => {
    chain(ctx, s, ahx, ahy, ringX, ringY, wind ? -0.1 * u : 0.08 * u, Math.max(2, 0.1 * u));
    anchor(ctx, s, ax, ay, aa, ak, heat(s, DV_IRON));
    hot(ctx, s, ax, ay, 0.8 * u);
  };
  // air hose trailing from the back of the helmet down to the floor
  cord(ctx, s, -0.3 * u, -0.8 * u, -1.0 * u, -0.5 * u + sway, -0.9 * u, 0.7 * u, Math.max(2.5, 0.12 * u), '#5a4a3a', 2);
  if (!wind && !swing) drawAnchor();
  // canvas legs and lead boots
  const step = Math.sin(s.t * 4) * 0.12 * u * s.moving;
  capsule(ctx, s, -0.22 * u, 0.3 * u, -0.26 * u - step, 0.62 * u, 0.17 * u, 0.15 * u, DV_SUIT_U, 2.5);
  flat(ctx, s, [-0.46 - step / u, 0.58, -0.08 - step / u, 0.58, 0.0 - step / u, 0.8, -0.5 - step / u, 0.8], u, shade(DV_LEAD, 0.85), 2);
  capsule(ctx, s, 0.2 * u, 0.3 * u, 0.26 * u + step, 0.62 * u, 0.17 * u, 0.15 * u, DV_SUIT, 2.5);
  flat(ctx, s, [0.02 + step / u, 0.58, 0.42 + step / u, 0.58, 0.52 + step / u, 0.8, -0.02 + step / u, 0.8], u, DV_LEAD, 2);
  // far arm on the chain
  arm(ctx, s, fsx, fsy, ahx, ahy, 0.26 * u, 0.26 * u, -1, 0.15 * u, 0.13 * u, 0.12 * u, DV_SUIT_U, 2.5);
  oval(ctx, s, J[2]!, J[3]!, 0.13 * u, 0.12 * u, '#5a4a3a', 2);
  // the suit: canvas stained dark up to the knees, a lead weight belt
  shape(ctx, s, DV_BODY, u, DV_SUIT, DV_SUIT_U, 0.14, 2.5);
  if (!s.flash) {
    inside(ctx, DV_BODY, u);
    mark(ctx, s, DV_MUCK, u, withAlpha('#3e4a2c', 0.75));
    mark(ctx, s, [-0.3, -0.1, -0.18, -0.2, -0.06, -0.08, -0.16, 0.02], u, withAlpha('#3e4a2c', 0.5));
    line(ctx, -0.7 * u, 0.12 * u, 0.7 * u, 0.06 * u, Math.max(3, 0.14 * u), '#3a3028');
    for (let i = -2; i <= 2; i++) flat(ctx, s, [i * 0.22 - 0.07, 0.02, i * 0.22 + 0.07, 0.01, i * 0.22 + 0.07, 0.17, i * 0.22 - 0.07, 0.18], u, DV_LEAD, 1.2);
    ctx.restore();
  }
  // the bolted brass collar
  shape(ctx, s, DV_COLLAR, u, DV_BRASS, DV_BRASS_U, 0.08, 2.5);
  if (!s.flash) for (let i = 0; i < 5; i++) dot(ctx, (-0.36 + i * 0.18) * u, (-0.27 - Math.abs(i - 2) * 0.03) * u, Math.max(1, 0.035 * u), '#5a4020');
  // the helmet
  ctx.save();
  ctx.translate(0.06 * fw * u, (wind ? -0.86 : -0.8) * u);
  ctx.rotate(wind ? -0.1 : swing ? 0.12 * fw : Math.sin(s.t * 1.6) * 0.03);
  const h = 0.86 * u;
  oval(ctx, s, 0, 0, 0.5 * h, 0.48 * h, DV_BRASS, 2.5);
  if (!s.flash) {
    // underside shading, sheen, a dent and the valve on top
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.5 * h, 0.48 * h, 0, 0, Math.PI * 2);
    ctx.clip();
    oval(ctx, null, 0.04 * h, 0.2 * h, 0.56 * h, 0.4 * h, DV_BRASS_U, 0);
    oval(ctx, null, -0.02 * h, -0.08 * h, 0.5 * h, 0.4 * h, DV_BRASS, 0);
    ctx.restore();
    oval(ctx, null, -0.2 * h, -0.28 * h, 0.1 * h, 0.05 * h, withAlpha('#fff2c0', 0.7), 0, -0.5);
    line(ctx, -0.36 * h, -0.02 * h, -0.28 * h, 0.08 * h, 1.2, withAlpha(OUTLINE, 0.45));
    flat(ctx, s, [-0.08, -0.47, 0.08, -0.47, 0.06, -0.58, -0.06, -0.58], h, DV_BRASS_U, 1.5);
  }
  if (!f.back) {
    const c = 0.24 * fw * h;
    const pr = lerp(0.3, 0.24, Math.abs(fw)) * h;
    const sq = 1 - Math.abs(fw) * 0.25;
    // a small side port toward the back when seen side-on
    if (Math.abs(fw) > 0.45) {
      oval(ctx, s, c - 0.48 * h * fw, 0.0, 0.1 * h * (1 - Math.abs(fw) * 0.4), 0.12 * h, DV_BRASS_U, 2);
      if (!s.flash) oval(ctx, null, c - 0.48 * h * fw, 0.0, 0.06 * h * (1 - Math.abs(fw) * 0.4), 0.08 * h, '#24341e', 0);
    }
    // the porthole: thick brass ring, murky water, a fish, a grille
    oval(ctx, s, c, 0.02 * h, pr * sq + 0.07 * h, pr + 0.07 * h, mix(DV_BRASS, '#fff0c0', 0.15), 2.5);
    const water = elemGlow(s, '#8fc060');
    oval(ctx, s, c, 0.02 * h, pr * sq, pr, heat(s, '#2c4426', 0.5), 2);
    if (!s.flash) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(c, 0.02 * h, pr * sq, pr, 0, 0, Math.PI * 2);
      ctx.clip();
      glow(ctx, c, 0.06 * h, pr * 1.6, water, 0.55);
      // the fish swims back and forth behind the glass
      const fx = c + Math.sin(s.t * 1.3) * pr * 0.45;
      const dir = Math.cos(s.t * 1.3) >= 0 ? 1 : -1;
      const fy = 0.06 * h + Math.sin(s.t * 3.1) * 0.04 * h;
      oval(ctx, null, fx, fy, 0.1 * h, 0.055 * h, '#d89a40', 0);
      flat(ctx, s, [fx / h - dir * 0.08, fy / h, fx / h - dir * 0.17, fy / h - 0.06, fx / h - dir * 0.17, fy / h + 0.06], h, '#d89a40', 0);
      dot(ctx, fx + dir * 0.05 * h, fy - 0.01 * h, Math.max(0.6, 0.015 * h), OUTLINE);
      for (let i = 0; i < 3; i++) {
        const k = (s.t * 0.5 + i / 3) % 1;
        dot(ctx, c + (i - 1) * 0.08 * h, 0.02 * h + pr - k * pr * 1.8, Math.max(0.6, 0.025 * h), withAlpha('#d8f0c0', 0.7 * (1 - k)));
      }
      oval(ctx, null, c - pr * 0.4, -pr * 0.4, pr * 0.22, pr * 0.1, withAlpha('#ffffff', 0.35), 0, -0.6);
      ctx.restore();
      ctx.strokeStyle = DV_BRASS_U;
      ctx.lineWidth = Math.max(1.5, 0.05 * h);
      ctx.beginPath();
      ctx.moveTo(c, 0.02 * h - pr);
      ctx.lineTo(c, 0.02 * h + pr);
      ctx.moveTo(c - pr * sq, 0.02 * h);
      ctx.lineTo(c + pr * sq, 0.02 * h);
      ctx.stroke();
    }
  } else if (!s.flash) {
    // the back: an air-hose coupling and a row of rivets
    oval(ctx, null, 0, 0.12 * h, 0.12 * h, 0.1 * h, DV_BRASS_U, 2);
    for (let i = 0; i < 5; i++) dot(ctx, (-0.3 + i * 0.15) * h, 0.3 * h, Math.max(0.8, 0.025 * h), '#5a4020');
  }
  ctx.restore();
  if (wind || swing) drawAnchor();
  // the pipe wrench in the near hand: hanging, cocked back over the shoulder, swung down through the front
  let th: number;
  let px: number;
  let py: number;
  if (wind) {
    th = -1.35;
    px = 0.5 * u;
    py = -0.6 * u;
  } else if (swing) {
    th = f.aim * 0.8 + 0.25;
    px = 0.46 * u + f.ax * 0.12 * u;
    py = -0.12 * u + f.ay * 0.22 * u;
  } else {
    th = f.aim * 0.4 + (s.pose === 'recover' ? 0.9 : 1.25);
    px = 0.56 * u;
    py = 0.0;
  }
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  const ex = px + dx * 0.95 * u;
  const ey = py + dy * 0.95 * u;
  capsule(ctx, s, px - dx * 0.12 * u, py - dy * 0.12 * u, ex, ey, 0.07 * u, 0.08 * u, '#a83a2a', 2);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(th);
  const jaw = heat(s, '#9aa0a8');
  flat(ctx, s, [-0.06, -0.12, 0.3, -0.12, 0.3, 0.02, 0.18, 0.02, 0.18, 0.08, -0.06, 0.08], u, jaw, 2);
  flat(ctx, s, [-0.02, -0.12, 0.08, -0.12, 0.08, -0.36, 0.3, -0.36, 0.3, -0.24, -0.02, -0.24], u, jaw, 2);
  if (!s.flash) for (let i = 0; i < 3; i++) line(ctx, (0.12 + i * 0.06) * u, -0.24 * u, (0.12 + i * 0.06) * u, -0.18 * u, 1, withAlpha(OUTLINE, 0.6));
  ctx.restore();
  hot(ctx, s, ex + dx * 0.1 * u, ey + dy * 0.1 * u, 0.8 * u);
  arm(ctx, s, lerp(0.44, 0.32, fw) * u, -0.32 * u, px, py, 0.26 * u, 0.26 * u, 1, 0.16 * u, 0.14 * u, 0.12 * u, DV_SUIT, 2.5);
  oval(ctx, s, J[2]!, J[3]!, 0.14 * u, 0.13 * u, '#5a4a3a', 2);
  swoosh(ctx, s, 0.1 * u, -0.4 * u, 1.3 * u, -2.0, th, 0.4 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Fuse Eel
// A long sewer eel seen from above, rotated to its facing: near-black with hazard-yellow bands, a blunt head with
// glowing eyes and frayed copper cables for whiskers that spit sparks. It coils up crackling before it strikes and
// snaps out straight as a live wire. Magic (lightning), so its eyes, sparks and arcs are Magic blue.
const EE_SKIN = '#2c2a34';
const EE_SKIN_U = shade(EE_SKIN, 0.55);
const EE_STRIPE = '#e8c020';
const EE_HEAD = [-0.34, -0.34, 0.16, -0.38, 0.52, -0.24, 0.7, 0, 0.52, 0.24, 0.16, 0.38, -0.34, 0.34];

/** A jagged electric arc from (x0, y0) to (x1, y1), additive. `seed` changes the zigzag. */
function zap(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, seed: number, color: string, w: number, alpha: number): void {
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i < 5; i++) {
    const k = i / 5;
    const j = Math.sin(seed * 7.3 + i * 12.9) * len * 0.18;
    ctx.lineTo(x0 + dx * k + nx * j, y0 + dy * k + ny * j);
  }
  ctx.lineTo(x1, y1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = withAlpha(color, 0.35 * alpha);
  ctx.lineWidth = w * 2.5;
  ctx.stroke();
  ctx.strokeStyle = withAlpha('#ffffff', 0.85 * alpha);
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.globalCompositeOperation = prev;
}

registerDraw('sewers_eel', (ctx, s) => {
  const u = s.r * s.scale;
  const spark = elemGlow(s, '#ffe060');
  const coil = s.pose === 'windup' ? Math.min(1, 0.35 + s.poseT * 2.2) : s.pose === 'stagger' ? 0.25 : 0;
  const stretch = s.pose === 'attack' ? 1 : s.pose === 'recover' ? Math.max(0, 1 - s.poseT * 2.5) : 0;
  shadow(ctx, s.x, s.y, u * 1.2, 0.22);
  if (s.moving > 0.2 && s.pose === 'idle') ripples(ctx, s.x, s.y, u * 1.1, s.t, 0.5);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  // the spine: a swimming S-wave, a tight coil, or snapped out straight
  const N = 8;
  const sp: number[] = [];
  const freq = 5 + s.moving * 4;
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    let x = 0.9 * u - i * 0.42 * u;
    let y = Math.sin(s.t * freq - i * 0.95) * 0.4 * u * (0.25 + k * 0.75);
    if (coil > 0) {
      const a = -i * 0.92 + Math.sin(s.t * 20) * 0.03;
      const rr = (0.82 - i * 0.075) * u;
      x = lerp(x, -0.15 * u + Math.cos(a) * rr, coil);
      y = lerp(y, Math.sin(a) * rr, coil);
    }
    if (stretch > 0) {
      x = lerp(x, 1.25 * u - i * 0.5 * u, stretch);
      y = lerp(y, Math.sin(s.t * 30 - i) * 0.05 * u, stretch);
    }
    sp.push(x, y);
  }
  // back fin ridge first, so the body covers its root
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#5a5468', 0.9);
    ctx.lineWidth = Math.max(2, 0.18 * u);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sp[2]!, sp[3]!);
    for (let i = 2; i < N; i++) ctx.lineTo(sp[i * 2]!, sp[i * 2 + 1]!);
    ctx.stroke();
  }
  taper(ctx, s, sp, 0.8 * u, 0, EE_SKIN, EE_SKIN_U, 2);
  if (!s.flash) {
    // hazard bands across the back
    ctx.lineCap = 'butt';
    ctx.strokeStyle = EE_STRIPE;
    ctx.lineWidth = Math.max(1.5, 0.17 * u);
    ctx.beginPath();
    for (let i = 1; i < N - 1; i += 2) {
      const x0 = sp[i * 2]!;
      const y0 = sp[i * 2 + 1]!;
      const x1 = sp[i * 2 + 2]!;
      const y1 = sp[i * 2 + 3]!;
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const l = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / l;
      const ny = (x1 - x0) / l;
      const hw = ((0.8 * u * (1 - (i + 0.5) / (N - 1))) / 2) * 0.72;
      if (hw < 1) continue;
      ctx.moveTo(mx + nx * hw, my + ny * hw);
      ctx.lineTo(mx - nx * hw, my - ny * hw);
    }
    ctx.stroke();
    // a pale belly line along the middle
    ctx.lineCap = 'round';
    ctx.strokeStyle = withAlpha('#8a8494', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sp[0]!, sp[1]!);
    for (let i = 1; i < N - 1; i++) ctx.lineTo(sp[i * 2]!, sp[i * 2 + 1]!);
    ctx.stroke();
  }
  // head, turned along the front of the spine (toward the facing while coiled or striking)
  const hx = sp[0]!;
  const hy = sp[1]!;
  const ha = lerp(Math.atan2(sp[1]! - sp[3]!, sp[0]! - sp[2]!), 0, Math.max(coil, stretch));
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ha);
  const h = 0.8 * u;
  const gape = s.pose === 'attack' ? 0.28 : s.pose === 'windup' ? 0.12 : 0.03;
  // frayed copper whiskers: insulated cable, bare copper ends, a spark at each tip
  for (const side of [-1, 1]) {
    const wv = Math.sin(s.t * 6 + side) * 0.12;
    const tx = 1.05 * h;
    const ty = side * (0.48 + wv) * h;
    cord(ctx, s, 0.5 * h, side * 0.16 * h, 0.85 * h, side * 0.1 * h, tx, ty, Math.max(1.5, 0.07 * h), '#c8402a', 1.5);
    if (!s.flash) {
      for (let k = -1; k <= 1; k++) line(ctx, tx, ty, tx + 0.12 * h, ty + side * 0.06 * h + k * 0.05 * h, 1, '#e89a4a');
      const fl = 0.5 + 0.5 * Math.sin(s.t * 23 + side * 2);
      glow(ctx, tx + 0.1 * h, ty, (0.2 + coil * 0.3) * h, spark, Math.min(1, 0.4 + fl * 0.4 + coil * 0.3));
      dot(ctx, tx + 0.1 * h, ty, Math.max(0.8, 0.04 * h), '#ffffff');
    }
  }
  if (gape > 0.05) {
    flat(ctx, s, [0.2, -0.04 - gape * 0.4, 0.78, -gape * 0.9, 0.78, gape * 0.9, 0.2, 0.04 + gape * 0.4], h, heat(s, '#5a1a2a', 0.5), 1.5);
    teeth(ctx, s, 0.3 * h, -gape * 0.5 * h, 0.74 * h, -gape * 0.85 * h, 4, -0.06 * h, '#f4f0e0', 0.8);
    teeth(ctx, s, 0.3 * h, gape * 0.5 * h, 0.74 * h, gape * 0.85 * h, 4, 0.06 * h, '#f4f0e0', 0.8);
  }
  shape(ctx, s, EE_HEAD, h, mix(EE_SKIN, '#ffffff', 0.06), EE_SKIN_U, 0.1, 2.5);
  if (!s.flash) {
    mark(ctx, s, [-0.3, -0.12, -0.1, -0.3, 0.0, -0.1, -0.1, 0.1], h, withAlpha(EE_STRIPE, 0.85));
    const eye = elemGlow(s, '#9ae8ff');
    for (const side of [-1, 1]) {
      oval(ctx, null, 0.3 * h, side * 0.22 * h, 0.1 * h, 0.08 * h, eye, 1.5);
      dot(ctx, 0.33 * h, side * 0.22 * h, Math.max(0.6, 0.035 * h), OUTLINE);
    }
    glow(ctx, 0.3 * h, 0, 0.6 * h, eye, 0.35);
  }
  ctx.restore();
  // crackling arcs along the body while it charges, along the line while it strikes
  const live = Math.max(coil, stretch);
  if (!s.flash && live > 0.3) {
    const n = stretch > 0.3 ? 3 : 4;
    for (let j = 0; j < n; j++) {
      const seed = Math.floor(s.t * 18) + j * 3.1;
      const i0 = 1 + ((j * 2 + Math.floor(s.t * 12)) % (N - 2));
      const a = Math.sin(seed) * Math.PI;
      const x0 = sp[i0 * 2]!;
      const y0 = sp[i0 * 2 + 1]!;
      zap(ctx, x0, y0, x0 + Math.cos(a) * 0.9 * u, y0 + Math.sin(a) * 0.9 * u, seed, spark, Math.max(1, 0.06 * u), live);
    }
    glow(ctx, -0.1 * u, 0, u * 2.2, spark, 0.25 * live);
  }
  ctx.restore();
  light(0);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  hot(ctx, s, s.x + fx * u * 1.2, s.y + fy * u * 1.2, u * 1.3);
  if (s.pose === 'attack') streak(ctx, s, s.x - fx * u * 2.5, s.y - fy * u * 2.5, s.x + fx * u * 2.2, s.y + fy * u * 2.2, u * 0.5);
  spec(ctx, s.x + fx * u * 0.6 - u * 0.15, s.y + fy * u * 0.6 - u * 0.2, 2);
});
