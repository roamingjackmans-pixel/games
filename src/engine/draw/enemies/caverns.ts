// Fungal Caverns roster draw functions (deep purple, teal glow, brown, violet; ART_AUDIO §2).
// Upright bodies are drawn facing right inside a mirrored local frame (shapesA.upright); beasts are drawn top-down,
// rotated to their facing. Units inside a body are multiples of its radius u.
import { glow, mix, shade, shadow, spec, withAlpha } from '../parts';
import { registerDraw, type DrawState } from '../registry';
import {
  arm,
  atkGlow,
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
  streak,
  striking,
  swoosh,
  taper,
  teeth,
  upright,
} from '../shapesA';

const TEAL = '#5fd3c0';
const VIOLET = '#c58cff';
const STEM = '#e6dac2';
const STEM_U = shade(STEM, 0.72);
const SPORE = '#c8f080';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Spots on a mushroom cap (deterministic positions), drawn as one path. */
function capSpots(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, n: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.9 + (i / Math.max(1, n - 1)) * Math.PI * 0.8;
    const k = 0.45 + (i % 2) * 0.25;
    const sx = x + Math.cos(a) * rx * k;
    const sy = y + Math.sin(a) * ry * k;
    const sr = Math.max(1.2, rx * (0.1 + (i % 3) * 0.03));
    ctx.moveTo(sx + sr, sy);
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  }
  ctx.fill();
}

/** Spore motes swirling around a point, brightening with the attack (in its colour while striking). */
function spores(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, rad: number, n: number, natural: string): void {
  if (s.flash) return;
  const h = striking(s);
  const col = h > 0.05 ? mix(natural, atkGlow(s), 0.7) : natural;
  for (let i = 0; i < n; i++) {
    const a = s.t * (1.2 + h * 2) + (i * Math.PI * 2) / n;
    const rr = rad * (0.8 + Math.sin(s.t * 3 + i) * 0.2 + h * 0.4);
    glow(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7, 3 + rad * 0.12, col, 0.35 + h * 0.5);
  }
  hot(ctx, s, x, y, rad * 1.3, 0.5);
}

// ---------------------------------------------------------------- Sporeling
// A waddling toadstool imp: a huge frilled violet cap with gills beneath, a stout stalk body with an angry face,
// twiggy root arms and stubby root feet. It puffs spores from its gills.
const SP_CAP = '#b878e8';
const SP_CAP_U = shade(SP_CAP, 0.62);
const SP_GILL = '#7a4a9a';
const SP_BODY = [-0.42, 0.42, -0.5, 0.0, -0.36, -0.36, 0.0, -0.44, 0.36, -0.36, 0.5, 0.0, 0.42, 0.42, 0.0, 0.52];
const SP_CAPP = [-1.05, 0.08, -1.0, -0.3, -0.62, -0.68, 0.0, -0.82, 0.62, -0.68, 1.0, -0.3, 1.05, 0.08, 0.78, 0.18, 0.52, 0.08, 0.26, 0.2, 0.0, 0.1, -0.26, 0.2, -0.52, 0.08, -0.78, 0.18];

registerDraw('caverns_sporeling', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u * 0.9);
  const puff = s.pose === 'windup' ? 1 : 0;
  const burst = s.pose === 'attack' ? 1 : 0;
  ctx.save();
  upright(ctx, s, f, u, -Math.abs(Math.sin(s.t * 9)) * 2 * s.moving);
  ctx.rotate(Math.sin(s.t * 9) * 0.12 * (0.3 + s.moving * 0.7));
  // root feet
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(s.t * 9 + (side > 0 ? 0 : Math.PI))) * 0.12 * u * s.moving;
    const fx0 = side * 0.26 * u;
    capsule(ctx, s, fx0, 0.38 * u, fx0 + side * 0.08 * u + 0.06 * u, 0.66 * u - lift, 0.12 * u, 0.1 * u, STEM_U, 2);
    claws(ctx, s, fx0 + side * 0.08 * u + 0.06 * u, 0.68 * u - lift, side > 0 ? 0.3 : Math.PI - 0.3, 0.16 * u, 3, 1.4, '#a89070', 1.5);
  }
  // twig arms (the far one first)
  const armY = -0.02 * u;
  const reach = puff ? -0.1 : burst ? 0.55 : 0.25;
  arm(ctx, s, lerp(-0.4, -0.2, fw) * u, armY, lerp(-0.62, -0.1, fw) * u + f.ax * reach * u, armY + 0.3 * u - puff * 0.45 * u, 0.24 * u, 0.22 * u, 1, 0.065 * u, 0.055 * u, 0.05 * u, '#9a8060', 1.5);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.14 * u, 3, 1.2, '#8a7050', 1.2);
  // stout stalk body with a face
  shape(ctx, s, SP_BODY, u, STEM, STEM_U, 0.12, 2.5);
  if (!s.flash && !f.back) {
    const c = 0.14 * fw * u;
    const sp = (0.17 - 0.03 * fw) * u;
    const ey = -0.08 * u;
    // angry slanted eyes
    flat(ctx, s, [(c - sp - 0.09 * u) / u, ey / u - 0.06, (c - sp + 0.09 * u) / u, ey / u - 0.0, (c - sp + 0.07 * u) / u, ey / u + 0.08, (c - sp - 0.08 * u) / u, ey / u + 0.06], u, '#1a1020', 0);
    flat(ctx, s, [(c + sp + 0.09 * u) / u, ey / u - 0.06, (c + sp - 0.09 * u) / u, ey / u - 0.0, (c + sp - 0.07 * u) / u, ey / u + 0.08, (c + sp + 0.08 * u) / u, ey / u + 0.06], u, '#1a1020', 0);
    dot(ctx, c - sp + 0.02 * u, ey + 0.035 * u, Math.max(0.8, 0.035 * u), elemGlow(s, '#f4f0a0'));
    dot(ctx, c + sp - 0.02 * u, ey + 0.035 * u, Math.max(0.8, 0.035 * u), elemGlow(s, '#f4f0a0'));
    const mo = 0.06 + puff * 0.06 + burst * 0.1;
    oval(ctx, null, c, 0.16 * u, 0.13 * u, mo * u, '#3a1a2a', 0);
    teeth(ctx, s, c - 0.11 * u, 0.16 * u - mo * u * 0.7, c + 0.11 * u, 0.16 * u - mo * u * 0.7, 3, -0.05 * u, '#f4f0e0', 0.5);
  }
  // the cap: squashes in the windup, swells and puffs on release
  const capY = -0.5 * u + puff * 0.08 * u - burst * 0.06 * u;
  const capK = 1 + burst * 0.12 + puff * 0.04;
  ctx.save();
  ctx.translate(0.04 * u * fw, capY);
  ctx.scale(capK, 1 - puff * 0.12 + burst * 0.08);
  // gills under the rim, glowing in the attack colour as it charges
  oval(ctx, s, 0, 0.06 * u, 0.92 * u, 0.2 * u, heat(s, SP_GILL, 0.7), 2);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#2a1438', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -4; i <= 4; i++) {
      ctx.moveTo(i * 0.04 * u, 0.0);
      ctx.lineTo(i * 0.2 * u, 0.2 * u);
    }
    ctx.stroke();
  }
  shape(ctx, s, SP_CAPP, u, elemTintCap(s), SP_CAP_U, 0.18, 2.5);
  if (!s.flash) {
    capSpots(ctx, 0, -0.38 * u, 0.9 * u, 0.4 * u, 5, '#f8ecff');
    spec(ctx, -0.45 * u, -0.5 * u, Math.max(1.2, 0.08 * u), 0.6);
  }
  ctx.restore();
  hot(ctx, s, 0, capY + 0.1 * u, 1.3 * u, 0.7);
  // near arm
  arm(ctx, s, lerp(0.4, 0.2, fw) * u, armY + 0.02 * u, lerp(0.62, 0.3, fw) * u + f.ax * reach * u, armY + 0.32 * u - puff * 0.45 * u, 0.24 * u, 0.22 * u, -1, 0.065 * u, 0.055 * u, 0.05 * u, '#b09070', 1.5);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.14 * u, 3, 1.2, '#9a8060', 1.2);
  ctx.restore();
  if (puff || burst) spores(ctx, s, s.x, s.y - 0.5 * u, u * 1.2, 5, SPORE);
});

function elemTintCap(s: DrawState): string {
  return s.elem === 'physical' ? SP_CAP : mix(SP_CAP, elemGlow(s, SP_CAP), 0.7);
}

// ---------------------------------------------------------------- Cave Hound
// A lean, blind cave hound seen from above: deep chest, jointed legs, a wedge head with swept-back ears and a
// toothy split snout, glowing teal fungus nodules down its spine.
const HO_FUR = '#6a5888';
const HO_FUR_U = shade(HO_FUR, 0.66);
const HO_LEG = shade(HO_FUR, 0.8);
const HO_BODY = [-0.95, 0, -0.84, -0.4, -0.3, -0.4, 0.1, -0.5, 0.18, -0.62, 0.18, -0.62, 0.3, -0.5, 0.42, -0.62, 0.42, -0.62, 0.52, -0.46, 0.8, -0.3, 0.92, 0, 0.8, 0.3, 0.52, 0.46, 0.42, 0.62, 0.42, 0.62, 0.3, 0.5, 0.18, 0.62, 0.18, 0.62, 0.1, 0.5, -0.3, 0.4, -0.84, 0.4];
const HO_HEAD = [-0.3, -0.32, 0.1, -0.36, 0.5, -0.22, 0.9, -0.12, 0.9, -0.12, 0.9, 0.12, 0.9, 0.12, 0.5, 0.22, 0.1, 0.36, -0.3, 0.32];
const HO_EAR = [0.1, -0.14, -0.22, -0.56, -0.22, -0.56, -0.12, -0.06];

registerDraw('caverns_hound', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u);
  const crouch = s.pose === 'windup' ? 0.86 : 1;
  const stretch = s.pose === 'attack' ? 1.22 : 1;
  const gait = Math.sin(s.t * 16) * 0.22 * u * s.moving;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  ctx.scale(stretch * (2 - crouch), crouch);
  // tail with a ragged tuft
  const wag = Math.sin(s.t * 10) * 0.35;
  taper(ctx, s, [-0.85 * u, 0, -1.25 * u, wag * 0.35 * u, -1.6 * u, wag * 0.15 * u], 0.28 * u, 0, HO_FUR, null, 2);
  // jointed legs: knees bow outward, paws reach forward/back with the gait
  const legs: readonly (readonly [number, number, number, number])[] = [
    [0.42, 1, 0.98, 1],
    [0.42, -1, 0.98, -1],
    [-0.55, 1, -1.0, -1],
    [-0.55, -1, -1.0, 1],
  ];
  for (const [hx, side, px, g] of legs) {
    const pX = px * u + gait * g * side;
    const pY = side * 0.66 * u;
    arm(ctx, s, hx * u, side * 0.3 * u, pX, pY, 0.42 * u, 0.42 * u, side * (hx > 0 ? -1 : 1), 0.17 * u, 0.12 * u, 0.09 * u, HO_LEG, 2);
    claws(ctx, s, J[2]!, J[3]!, hx > 0 ? 0 : Math.PI, 0.14 * u, 3, 1.2, '#d8d0c0', 1.2);
  }
  shape(ctx, s, HO_BODY, u, HO_FUR, HO_FUR_U, 0.14, 2.5);
  if (!s.flash) {
    // ribs and the glowing fungus ridge
    ctx.strokeStyle = withAlpha('#1a1024', 0.5);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const x = (-0.15 + i * 0.18) * u;
      ctx.moveTo(x, -0.38 * u);
      ctx.quadraticCurveTo(x - 0.08 * u, 0, x, 0.38 * u);
    }
    ctx.stroke();
    const nod = elemGlow(s, TEAL);
    for (let i = 0; i < 3; i++) {
      const x = (-0.62 + i * 0.36) * u;
      const y = (i % 2 ? 0.12 : -0.12) * u;
      oval(ctx, null, x, y, 0.09 * u, 0.08 * u, nod, 1.5);
      glow(ctx, x, y, 0.32 * u, nod, 0.35);
    }
  }
  // head: wedge skull, ears swept back, split snout baring teeth
  const hx = 0.86 * u;
  const gape = s.pose === 'windup' ? 0.16 : s.pose === 'attack' ? 0.24 : 0.02;
  ctx.save();
  ctx.translate(hx, 0);
  ctx.scale(1.12, 1.12);
  shape(ctx, s, HO_HEAD, u, mix(HO_FUR, '#ffffff', 0.1), HO_FUR_U, 0.1, 2.5);
  // tall pointed ears standing on the skull, swept back
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(1, side);
    shape(ctx, s, HO_EAR, u, mix(HO_FUR, '#ffffff', 0.18), null, 0, 2);
    mark(ctx, s, [0.04, -0.15, -0.16, -0.46, -0.1, -0.12], u, '#c890b0', false);
    ctx.restore();
  }
  if (gape > 0.03 && !s.flash) {
    flat(ctx, s, [0.3, 0, 0.84, -gape, 0.84, gape], u, heat(s, '#2a0c18', 0.4), 1.5);
    teeth(ctx, s, 0.36 * u, -0.02 * u, 0.82 * u, -gape * u, 4, -0.07 * u, heat(s, '#f4f0e0'), 0.5);
    teeth(ctx, s, 0.82 * u, gape * u, 0.36 * u, 0.02 * u, 4, -0.07 * u, heat(s, '#f4f0e0'), 0.5);
  }
  if (!s.flash) {
    const eye = elemGlow(s, TEAL);
    dot(ctx, 0.3 * u, -0.17 * u, Math.max(1.2, 0.07 * u), eye);
    dot(ctx, 0.3 * u, 0.17 * u, Math.max(1.2, 0.07 * u), eye);
    dot(ctx, 0.8 * u, 0, Math.max(1, 0.06 * u), '#1a1020');
  }
  ctx.restore();
  ctx.restore();
  light(0);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  hot(ctx, s, s.x + fx * u * 1.5, s.y + fy * u * 1.5, u * 1.1);
  if (s.pose === 'attack') streak(ctx, s, s.x + fx * u * 0.9, s.y + fy * u * 0.9, s.x + fx * u * 2.0, s.y + fy * u * 2.0, u * 0.32);
});

// ---------------------------------------------------------------- Myconid Shaman
// A lanky fungus-folk shaman: a tall drooping morel cap pitted like honeycomb, a pale face with deep eyes,
// a robe of hanging mycelium threads, and a gnarled root staff topped with a glowing spore bulb.
const MS_ROBE = '#7a58a0';
const MS_ROBE_U = shade(MS_ROBE, 0.64);
const MS_CAP = '#5e3e78';
const MS_ROBE_P = [-0.36, -0.36, 0.34, -0.36, 0.5, 0.2, 0.56, 0.66, 0.56, 0.66, 0.36, 0.52, 0.22, 0.7, 0.22, 0.7, 0.06, 0.54, -0.1, 0.72, -0.1, 0.72, -0.26, 0.54, -0.42, 0.68, -0.42, 0.68, -0.58, 0.6, -0.5, 0.2];
const MS_FACE = [-0.36, -0.1, -0.3, -0.4, 0.0, -0.46, 0.3, -0.4, 0.36, -0.1, 0.26, 0.24, 0.0, 0.34, -0.26, 0.24];

registerDraw('caverns_shaman', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u * 0.9);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  ctx.save();
  upright(ctx, s, f, u, bob(s, 1.2, 4));
  // staff in the far hand, raised while casting
  const top = casting ? 1.75 : 1.35;
  const stx = lerp(-0.62, -0.46, fw) * u;
  const drawStaff = (): void => {
    cord(ctx, s, stx + 0.04 * u, 0.7 * u, stx - 0.1 * u, -0.3 * u, stx + 0.06 * u, -top * u, Math.max(2.5, 0.12 * u), '#7a5638', 2);
    const bx = stx + 0.06 * u;
    const by = -top * u - 0.12 * u;
    const bulb = casting ? heat(s, SPORE, 0.8) : elemGlow(s, SPORE);
    if (!s.flash) glow(ctx, bx, by, (casting ? 1.6 : 0.9) * u, bulb, casting ? 0.8 : 0.45);
    oval(ctx, s, bx, by, 0.16 * u, 0.18 * u, bulb, 2);
    for (const a of [-0.9, 0.4, 2.2]) cord(ctx, s, bx, by, bx, by, bx + Math.cos(a) * 0.22 * u, by + Math.sin(a) * 0.18 * u + 0.1 * u, Math.max(1.2, 0.04 * u), '#7a5638', 1.5);
    arm(ctx, s, lerp(-0.34, -0.22, fw) * u, -0.24 * u, stx + 0.04 * u, (casting ? -0.55 : -0.15) * u, 0.26 * u, 0.24 * u, 1, 0.07 * u, 0.06 * u, 0.055 * u, STEM_U, 1.5);
  };
  if (!f.back) drawStaff();
  // robe of hanging mycelium threads
  shape(ctx, s, MS_ROBE_P, u, MS_ROBE, MS_ROBE_U, 0.14, 2.5);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#2a1a3a', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(i * 0.16 * u, -0.2 * u);
      ctx.lineTo(i * 0.2 * u, 0.55 * u);
    }
    ctx.stroke();
    mark(ctx, s, [-0.3, 0.05, 0.32, 0.05, 0.34, 0.14, -0.32, 0.14], u, withAlpha(TEAL, 0.55), false);
  }
  if (f.back) drawStaff();
  // face, then the drooping morel cap
  ctx.save();
  ctx.translate(0.08 * fw * u, -0.48 * u);
  shape(ctx, s, MS_FACE, u * 0.9, STEM, STEM_U, 0.1, 2);
  if (!s.flash && !f.back) {
    const c = 0.1 * fw * u;
    const sp = (0.14 - 0.03 * fw) * u;
    oval(ctx, null, c - sp, -0.06 * u, 0.07 * u, 0.1 * u, '#1a1024', 0);
    oval(ctx, null, c + sp, -0.06 * u, 0.07 * u, 0.1 * u, '#1a1024', 0);
    const eye = elemGlow(s, TEAL);
    dot(ctx, c - sp, -0.05 * u, Math.max(0.9, 0.035 * u), eye);
    dot(ctx, c + sp, -0.05 * u, Math.max(0.9, 0.035 * u), eye);
    // gill frills where a mouth would be
    for (let i = -1; i <= 1; i++) line(ctx, c + i * 0.06 * u, 0.12 * u, c + i * 0.08 * u, 0.22 * u, 1, withAlpha('#5a4a3a', 0.8));
  }
  const tip = Math.sin(s.t * 2) * 0.12 + (casting ? 0.25 : 0);
  const capP = [-0.5, -0.26, -0.5, -0.26, -0.34, -0.7, -0.1 + tip * 0.5, -1.15, 0.28 + tip, -1.42, 0.28 + tip, -1.42, 0.2 + tip * 0.5, -1.0, 0.36, -0.62, 0.5, -0.26, 0.5, -0.26, 0.0, -0.16];
  shape(ctx, s, capP, u, MS_CAP, shade(MS_CAP, 0.6), 0.12, 2.5);
  if (!s.flash) {
    // honeycomb pits and a teal glow speckle
    ctx.fillStyle = withAlpha('#2a1838', 0.65);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const px = (-0.24 + (i % 3) * 0.2 + tip * 0.25 * Math.floor(i / 3)) * u;
      const py = (-0.42 - Math.floor(i / 3) * 0.3) * u;
      ctx.moveTo(px + 0.06 * u, py);
      ctx.ellipse(px, py, 0.06 * u, 0.08 * u, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    dot(ctx, 0.05 * u, -0.95 * u, Math.max(1, 0.05 * u), elemGlow(s, TEAL));
    glow(ctx, 0.05 * u, -0.95 * u, 0.3 * u, elemGlow(s, TEAL), 0.5);
  }
  ctx.restore();
  // free hand: reaches out and glows while casting
  const hx = lerp(0.34, 0.22, fw) * u;
  const tx = hx + f.ax * (casting ? 0.62 : 0.3) * u;
  const ty = -0.1 * u + f.ay * (casting ? 0.5 : 0.25) * u + (casting ? -0.15 * u : 0.12 * u);
  arm(ctx, s, hx, -0.24 * u, tx, ty, 0.26 * u, 0.24 * u, 1, 0.07 * u, 0.06 * u, 0.055 * u, STEM, 1.5);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.14 * u, 3, 1.3, heat(s, '#d0c4a8'), 1.2);
  hot(ctx, s, J[2]!, J[3]!, 0.8 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Boulder Beetle
// A rhinoceros beetle the size of a boulder: a stone-plated shell split down the seam with violet crystals
// growing from it, a curved horn, snapping mandibles and six jointed legs. Rolls into a ball to charge;
// belly-up and paddling when flipped.
const BB_SHELL = '#7a5a3e';
const BB_SHELL_U = shade(BB_SHELL, 0.6);
const BB_CHITIN = '#3e2c22';
const BB_ELYTRON = [0.5, 0.02, 0.42, -0.6, 0.0, -0.9, -0.62, -0.78, -1.04, -0.3, -1.06, 0.02];
const BB_THORAX = [0.32, -0.5, 0.72, -0.4, 0.86, 0.0, 0.72, 0.4, 0.32, 0.5, 0.22, 0.0];
const BB_HORN = [0.86, -0.12, 1.25, -0.16, 1.55, -0.34, 1.55, -0.34, 1.42, -0.04, 1.14, 0.1, 0.86, 0.12];

function beetleLegs(ctx: CanvasRenderingContext2D, s: DrawState, u: number, gait: number, belly: boolean): void {
  for (let i = 0; i < 3; i++) {
    const lx = (0.38 - i * 0.42) * u;
    for (const side of [-1, 1]) {
      const g = (i % 2 === 0 ? gait : -gait) * side;
      const fx = belly ? lx + Math.sin(s.t * 20 + i + side) * 0.2 * u : lx + (0.25 - i * 0.25) * u + g;
      const fy = side * (belly ? 1.0 : 1.12) * u;
      arm(ctx, s, lx, side * 0.5 * u, fx, fy, 0.36 * u, 0.4 * u, side * (i === 0 ? -1 : 1), 0.1 * u, 0.08 * u, 0.05 * u, BB_CHITIN, 2);
      oval(ctx, s, J[0]!, J[1]!, 0.07 * u, 0.07 * u, '#5a4232', 1.5);
    }
  }
}

registerDraw('caverns_beetle', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u);
  if (s.pose === 'stagger') {
    // flipped on its back: pale segmented belly, legs paddling at the air
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.facing);
    light(s.facing);
    beetleLegs(ctx, s, u, 0, true);
    shape(ctx, s, [1.0, 0, 0.7, -0.62, 0, -0.88, -0.8, -0.7, -1.04, 0, -0.8, 0.7, 0, 0.88, 0.7, 0.62], u, '#d8b890', '#a88860', 0.14);
    if (!s.flash) {
      ctx.strokeStyle = withAlpha('#3a2a1e', 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(i * 0.3 * u - 0.1 * u, -0.7 * u);
        ctx.quadraticCurveTo(i * 0.3 * u + 0.1 * u, 0, i * 0.3 * u - 0.1 * u, 0.7 * u);
      }
      ctx.stroke();
    }
    ctx.restore();
    light(0);
    for (let i = 0; i < 3; i++) {
      const a = s.t * 5 + (i * Math.PI * 2) / 3;
      glow(ctx, s.x + Math.cos(a) * u * 0.6, s.y - u * 0.9 + Math.sin(a) * u * 0.2, 6, '#ffe14a', 0.8);
    }
    return;
  }
  if (s.pose === 'attack') {
    // rolled into a boulder: stone plates rolling along the facing, horn tucked in
    const spin = s.t * 14;
    oval(ctx, s, s.x, s.y, u * 0.98, u * 0.98, BB_SHELL, 3);
    if (!s.flash) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, u * 0.95, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.facing);
      for (let i = 0; i < 4; i++) {
        const off = ((((spin * 0.35 + i * 0.5) % 2) + 2) % 2) - 1;
        const x = off * 1.3 * u;
        oval(ctx, null, x, 0, 0.18 * u, 1.0 * u, BB_SHELL_U, 2);
        oval(ctx, null, x - 0.2 * u, -0.3 * u, 0.08 * u, 0.1 * u, VIOLET, 1);
      }
      ctx.restore();
      hot(ctx, s, s.x, s.y, u * 1.4, 0.45);
    }
    spec(ctx, s.x - u * 0.35, s.y - u * 0.4, 3);
    return;
  }
  const curl = s.pose === 'windup' ? 0.88 : 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  ctx.scale(curl, 1 / curl);
  beetleLegs(ctx, s, u, Math.sin(s.t * 12) * 0.16 * u * s.moving, false);
  // antennae
  for (const side of [-1, 1]) {
    cord(ctx, s, 0.8 * u, side * 0.2 * u, 1.1 * u, side * 0.45 * u, 1.25 * u, side * (0.62 + Math.sin(s.t * 3 + side) * 0.06) * u, 1.5, BB_CHITIN, 1.5);
    oval(ctx, s, 1.25 * u, side * (0.62 + Math.sin(s.t * 3 + side) * 0.06) * u, 0.06 * u, 0.06 * u, BB_CHITIN, 1.5);
  }
  // mandibles (open on windup, snap shut on release)
  const open = s.pose === 'windup' ? 0.6 : 0.2;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(0.82 * u, side * 0.26 * u);
    ctx.rotate(side * open);
    flat(ctx, s, [0, -0.08 * side, 0.5, 0.0, 0.62, 0.16 * side, 0.62, 0.16 * side, 0.36, 0.12 * side, 0.0, 0.1 * side], u, heat(s, '#2a1e16', 0.6), 2);
    ctx.restore();
  }
  // head with its horn, the thorax plate, then the two wing cases
  oval(ctx, s, 0.8 * u, 0, 0.26 * u, 0.3 * u, BB_CHITIN, 2.5);
  shape(ctx, s, BB_HORN, u, heat(s, '#5a4232', 0.7), '#3a2a20', 0.06, 2.5);
  shape(ctx, s, BB_THORAX, u, mix(BB_SHELL, '#3a2a20', 0.35), BB_SHELL_U, 0.1, 2.5);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(1, side);
    shape(ctx, s, BB_ELYTRON, u, BB_SHELL, BB_SHELL_U, 0.18, 2.5);
    if (!s.flash) {
      inside(ctx, BB_ELYTRON, u);
      // stone facets and crystal growths
      mark(ctx, s, [-0.1, -0.2, 0.25, -0.35, 0.2, -0.6, -0.2, -0.62, -0.35, -0.4], u, withAlpha('#9a7a58', 0.6), false);
      mark(ctx, s, [-0.5, -0.15, -0.3, -0.3, -0.45, -0.62, -0.8, -0.5, -0.82, -0.2], u, withAlpha('#5a4030', 0.6), false);
      ctx.restore();
      const cx = side > 0 ? -0.45 : -0.2;
      flat(ctx, s, [cx - 0.08, -0.42, cx, -0.62, cx + 0.08, -0.42, cx, -0.3], u, elemGlow(s, VIOLET), 1.5);
      glow(ctx, cx * u, -0.46 * u, 0.3 * u, elemGlow(s, VIOLET), 0.4);
    }
    ctx.restore();
  }
  ctx.restore();
  light(0);
  if (!s.flash) {
    const fx = Math.cos(s.facing);
    const fy = Math.sin(s.facing);
    dot(ctx, s.x + fx * u * 0.85 - fy * u * 0.16, s.y + fy * u * 0.85 + fx * u * 0.16, Math.max(1.2, 0.07 * u), '#ffd27a');
    dot(ctx, s.x + fx * u * 0.85 + fy * u * 0.16, s.y + fy * u * 0.85 - fx * u * 0.16, Math.max(1.2, 0.07 * u), '#ffd27a');
    hot(ctx, s, s.x + fx * u * 1.3, s.y + fy * u * 1.3, u);
  }
  spec(ctx, s.x - u * 0.3, s.y - u * 0.45, 3);
});

// ---------------------------------------------------------------- Glowcap Spitter
// A carnivorous glowcap: a tall stalk rooted in a spread of feeler roots, a luminous bell cap with fangs
// along its rim and two small eyes, and a dripping acid maw beneath. It rears back to spit.
const GC_CAP = '#6ac848';
const GC_CAP_U = shade(GC_CAP, 0.6);
const GC_GLOW = '#c8ff80';

registerDraw('caverns_glowcap', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u * 0.8);
  const spit = s.pose === 'attack';
  const rear = s.pose === 'windup';
  const capGlow = elemGlow(s, GC_GLOW);
  glow(ctx, s.x, s.y - u * 1.3, u * 2.4, capGlow, 0.32 + Math.sin(s.t * 4) * 0.08);
  ctx.save();
  upright(ctx, s, f, u, 0);
  // feeler roots splayed on the ground
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.05 + i * 0.225);
    const wv = Math.sin(s.t * 2 + i) * 0.05;
    taper(ctx, s, [0, 0.5 * u, Math.cos(a) * 0.4 * u, 0.6 * u + Math.sin(a) * 0.08 * u, Math.cos(a + wv) * 0.75 * u, 0.66 * u + Math.sin(a) * 0.12 * u], 0.16 * u, 0, '#a89070', null, 1.5);
  }
  // the stalk leans back in the windup and snaps forward to spit
  const lean = rear ? -0.3 : spit ? 0.35 : Math.sin(s.t * 3) * 0.06;
  ctx.translate(0, 0.5 * u);
  ctx.rotate(lean * (0.4 + fw * 0.6));
  shape(ctx, s, [-0.2, 0, -0.16, -0.7, -0.12, -1.25, 0.12, -1.25, 0.16, -0.7, 0.2, 0], u, STEM, STEM_U, 0.06, 2.5);
  // ring skirt on the stalk
  shape(ctx, s, [-0.34, -0.66, 0.34, -0.66, 0.4, -0.54, 0.2, -0.5, 0.0, -0.56, -0.2, -0.5, -0.4, -0.54], u, shade(STEM, 0.86), STEM_U, 0.06, 2);
  // maw under the cap, opening as it spits
  const gape = rear ? 0.18 : spit ? 0.26 : 0.06;
  oval(ctx, s, 0.06 * u * fw, -1.3 * u, 0.36 * u, (0.06 + gape) * u, heat(s, '#2a1408', 0.6), 2);
  hot(ctx, s, 0.06 * u * fw, -1.3 * u, 1.0 * u);
  // the bell cap with fangs on its rim
  const sw = rear ? 1.1 : 1;
  ctx.save();
  ctx.translate(0, -1.32 * u - gape * u * 0.7);
  ctx.scale(sw, sw);
  teeth(ctx, s, -0.62 * u, 0.0, 0.62 * u, 0.0, 6, -0.16 * u, '#f4f0d8', 1);
  shape(ctx, s, [-0.8, 0.04, -0.82, -0.5, -0.4, -1.0, 0.0, -1.1, 0.4, -1.0, 0.82, -0.5, 0.8, 0.04, 0.0, -0.08], u, s.elem === 'physical' ? GC_CAP : mix(GC_CAP, capGlow, 0.6), GC_CAP_U, 0.14, 2.5);
  if (!s.flash) {
    ctx.fillStyle = capGlow;
    ctx.beginPath();
    for (const [px, py, pr] of [
      [-0.42, -0.55, 0.11],
      [0.36, -0.72, 0.09],
      [0.0, -0.9, 0.07],
      [-0.1, -0.42, 0.06],
    ] as const) {
      ctx.moveTo((px + pr) * u, py * u);
      ctx.arc(px * u, py * u, pr * u, 0, Math.PI * 2);
    }
    ctx.fill();
    if (!f.back) {
      const c = 0.16 * fw * u;
      oval(ctx, null, c - 0.18 * u, -0.22 * u, 0.09 * u, 0.07 * u, '#1a2408', 0);
      oval(ctx, null, c + 0.18 * u, -0.22 * u, 0.09 * u, 0.07 * u, '#1a2408', 0);
      dot(ctx, c - 0.17 * u, -0.22 * u, Math.max(0.9, 0.04 * u), '#f4ff90');
      dot(ctx, c + 0.19 * u, -0.22 * u, Math.max(0.9, 0.04 * u), '#f4ff90');
    }
    spec(ctx, -0.4 * u, -0.72 * u, Math.max(1.2, 0.07 * u), 0.6);
  }
  ctx.restore();
  ctx.restore();
  // acid drips from the maw
  if (!s.flash) {
    for (let i = 0; i < 2; i++) {
      const k = (s.t * 0.9 + i * 0.5) % 1;
      glow(ctx, s.x + (i - 0.5) * u * 0.5, s.y - u * 0.75 + k * u * 1.0, 4, capGlow, 1 - k);
    }
  }
});

// ---------------------------------------------------------------- Fungal Ogre
// A hulking ogre overgrown with shelf mushrooms: a great hunched back, a small underbite head with tusks sunk
// between massive shoulders, a loincloth, a knuckle-dragging grab arm and a knotted log club.
const OG_SKIN = '#9a88aa';
const OG_SKIN_U = shade(OG_SKIN, 0.66);
const OG_BODY = [-0.62, 0.34, -0.74, -0.06, -0.62, -0.5, -0.24, -0.76, 0.26, -0.74, 0.6, -0.48, 0.66, -0.06, 0.52, 0.3, 0.2, 0.48, -0.3, 0.48];
const OG_HEAD = [-0.4, 0.1, -0.42, -0.25, -0.15, -0.46, 0.25, -0.44, 0.48, -0.2, 0.52, 0.12, 0.34, 0.38, -0.05, 0.42, -0.32, 0.32];
const OG_SHELVES: readonly (readonly [number, number, number, number])[] = [
  [-0.56, -0.56, 0.3, -0.3],
  [-0.2, -0.78, 0.24, 0.1],
  [-0.72, -0.12, 0.22, -0.5],
  [0.42, -0.62, 0.18, 0.4],
];

registerDraw('caverns_ogre', (ctx, s) => {
  const u = s.r * s.scale;
  const f = facing(s);
  const fw = f.ax;
  shadow(ctx, s.x, s.y, u);
  ctx.save();
  upright(ctx, s, f, u, bob(s, 2, 3));
  // club: raised overhead in the windup, slammed forward on release
  const ca = s.pose === 'windup' ? -2.1 : s.pose === 'attack' ? f.aim * 0.8 + 0.35 : f.aim * 0.4 + (s.pose === 'recover' ? 0.8 : 1.15);
  const hx = s.pose === 'windup' ? -0.05 * u : lerp(0.66, 0.5, fw) * u;
  const hy = s.pose === 'windup' ? -0.85 * u : -0.12 * u;
  const cdx = Math.cos(ca);
  const cdy = Math.sin(ca);
  const drawClub = (): void => {
    const ex = hx + cdx * 1.25 * u;
    const ey = hy + cdy * 1.25 * u;
    capsule(ctx, s, hx - cdx * 0.15 * u, hy - cdy * 0.15 * u, ex, ey, 0.1 * u, 0.24 * u, heat(s, '#8a6040', 0.6), 2.5);
    if (!s.flash) {
      for (let i = 0; i < 3; i++) {
        const k = 0.35 + i * 0.22;
        dot(ctx, hx + cdx * k * 1.25 * u - cdy * 0.06 * u * (i % 2 ? 1 : -1), hy + cdy * k * 1.25 * u + cdx * 0.06 * u, 0.045 * u, '#4a3020');
      }
      // a mushroom sprouting from the club head
      oval(ctx, s, ex - cdy * 0.2 * u, ey + cdx * 0.2 * u - 0.05 * u, 0.15 * u, 0.09 * u, VIOLET, 1.5);
    }
    hot(ctx, s, ex, ey, 1.0 * u);
  };
  // stubby bowed legs
  const step = Math.sin(s.t * 3) * 0.12 * u * s.moving;
  arm(ctx, s, -0.3 * u, 0.3 * u, -0.36 * u - step, 0.72 * u, 0.26 * u, 0.24 * u, 1, 0.2 * u, 0.17 * u, 0.15 * u, OG_SKIN_U, 2.5);
  oval(ctx, s, J[2]! + 0.04 * u, J[3]!, 0.2 * u, 0.1 * u, OG_SKIN_U, 2);
  arm(ctx, s, 0.28 * u, 0.3 * u, 0.34 * u + step, 0.72 * u, 0.26 * u, 0.24 * u, -1, 0.2 * u, 0.17 * u, 0.15 * u, OG_SKIN, 2.5);
  oval(ctx, s, J[2]! + 0.06 * u, J[3]!, 0.2 * u, 0.1 * u, OG_SKIN, 2);
  // grab arm behind: dragging knuckles, or lunging forward to grab
  const grab = s.pose === 'windup' ? 0.2 : 1;
  const gsx = lerp(-0.62, -0.42, fw) * u;
  arm(ctx, s, gsx, -0.44 * u, gsx + f.ax * 0.7 * grab * u + 0.1 * u, -0.1 * u + f.ay * 0.5 * u + 0.45 * u * grab, 0.42 * u, 0.42 * u, 1, 0.2 * u, 0.17 * u, 0.15 * u, OG_SKIN_U, 2.5);
  oval(ctx, s, J[2]!, J[3]!, 0.17 * u, 0.15 * u, OG_SKIN_U, 2);
  claws(ctx, s, J[2]!, J[3]!, Math.atan2(J[3]! - J[1]!, J[2]! - J[0]!), 0.2 * u, 4, 1.1, OG_SKIN_U, 1.5);
  if (f.back) drawClub();
  // the hunched body with a loincloth and its mushroom shelves
  shape(ctx, s, OG_BODY, u, OG_SKIN, OG_SKIN_U, 0.14);
  inside(ctx, OG_BODY, u);
  flat(ctx, s, [-0.7, 0.18, 0.7, 0.14, 0.7, 0.3, 0.34, 0.66, 0.1, 0.4, -0.18, 0.7, -0.4, 0.4, -0.7, 0.34], u, '#6a5038', 2);
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#2a1a30', 0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0.1 * u, -0.3 * u);
    ctx.quadraticCurveTo(0.35 * u, -0.1 * u, 0.15 * u, 0.1 * u);
    ctx.stroke();
  }
  ctx.restore();
  for (const [cx, cy, cr, rot] of OG_SHELVES) {
    ctx.save();
    ctx.translate(cx * u, cy * u);
    ctx.rotate(rot);
    shape(ctx, s, [-1, 0.1, -0.8, -0.5, 0, -0.75, 0.8, -0.5, 1, 0.1, 0, 0.25], cr * u, elemGlow(s, VIOLET), shade(VIOLET, 0.6), 0.2, 2);
    if (!s.flash) capSpots(ctx, 0, -0.3 * cr * u, cr * u * 0.8, cr * u * 0.3, 3, '#f4e8ff');
    ctx.restore();
  }
  if (!s.flash) glow(ctx, -0.4 * u, -0.6 * u, 0.6 * u, TEAL, 0.3);
  // small head sunk between the shoulders: heavy brow, underbite, tusks
  ctx.save();
  ctx.translate((0.06 + 0.32 * fw) * u, -0.74 * u);
  const h = 0.6 * u;
  shape(ctx, s, OG_HEAD, h, mix(OG_SKIN, '#ffffff', 0.08), OG_SKIN_U, 0.12, 2.5);
  if (!s.flash && !f.back) {
    const c = 0.1 * fw * h;
    const sp = (0.19 - 0.04 * fw) * h;
    mark(ctx, s, [-0.42 + c / h, -0.2, 0.46 + c / h, -0.24, 0.42 + c / h, -0.1, -0.4 + c / h, -0.06], h, OG_SKIN_U, true);
    const eye = elemGlow(s, '#ffd27a');
    dot(ctx, c - sp, -0.04 * h, Math.max(1.2, 0.07 * h), eye);
    dot(ctx, c + sp, -0.04 * h, Math.max(1.2, 0.07 * h), eye);
    const jaw = s.pose === 'windup' ? 0.12 : 0.04;
    oval(ctx, null, c, 0.24 * h, 0.26 * h, (0.04 + jaw) * h, '#2a1420', 0);
    flat(ctx, s, [c / h - 0.22, 0.26, c / h - 0.16, 0.0, c / h - 0.1, 0.26], h, '#f4f0e0', 1);
    flat(ctx, s, [c / h + 0.1, 0.26, c / h + 0.16, 0.0, c / h + 0.22, 0.26], h, '#f4f0e0', 1);
  }
  ctx.restore();
  if (!f.back) drawClub();
  // club arm in front
  arm(ctx, s, lerp(0.66, 0.5, fw) * u, -0.3 * u, hx, hy, 0.4 * u, 0.4 * u, 1, 0.22 * u, 0.18 * u, 0.16 * u, OG_SKIN, 2.5);
  oval(ctx, s, J[2]!, J[3]!, 0.17 * u, 0.15 * u, OG_SKIN, 2);
  swoosh(ctx, s, 0.2 * u, -0.5 * u, 1.6 * u, -2.0, ca, 0.5 * u);
  ctx.restore();
});

// ---------------------------------------------------------------- Spore Bat
// A bat seen from above: membrane wings stretched over finger bones with a scalloped trailing edge, big ears,
// fangs and teal eyes; spore sacs glow on its back.
const BT_WING = '#5a4078';
const BT_FUR = '#6e5888';

registerDraw('caverns_bat', (ctx, s) => {
  const u = s.r * s.scale;
  const y = s.y - 8 + Math.sin(s.t * 6 + s.variant) * 3;
  ctx.save();
  ctx.globalAlpha *= 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 6, u * 1.2, u * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const flap = Math.sin(s.t * 22 + s.variant * 1.7);
  const span = 1 + flap * 0.25 + (s.pose === 'windup' ? 0.2 : 0);
  ctx.save();
  ctx.translate(s.x, y);
  ctx.rotate(s.facing);
  light(s.facing);
  for (const side of [-1, 1]) {
    // wing: shoulder → wrist → three finger tips, scalloped edge back to the hip
    const sw = side * span;
    const wx = 0.1;
    const wy = 0.9 * sw;
    const p = [0.25, 0.25 * side, wx + 0.15, wy * 0.75, 0.05, wy, 0.05, wy, -0.3, wy * 1.55, -0.3, wy * 1.55, -0.4, wy * 1.05, -0.75, wy * 1.6, -0.75, wy * 1.6, -0.75, wy * 0.95, -1.0, wy * 1.1, -1.0, wy * 1.1, -0.75, wy * 0.45, -0.45, 0.3 * side];
    shape(ctx, s, p, u, BT_WING, shade(BT_WING, 0.7), 0.1, 2);
    if (!s.flash) {
      ctx.strokeStyle = withAlpha('#2a1a3a', 0.8);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0.1 * u, wy * 0.6 * u);
      ctx.lineTo(-0.3 * u, wy * 1.5 * u);
      ctx.moveTo(0.05 * u, wy * u);
      ctx.lineTo(-0.72 * u, wy * 1.55 * u);
      ctx.moveTo(0.05 * u, wy * u);
      ctx.lineTo(-0.95 * u, wy * 1.08 * u);
      ctx.stroke();
    }
  }
  // furry body, ears and head
  shape(ctx, s, [0.5, 0, 0.3, -0.36, -0.2, -0.32, -0.6, 0, -0.2, 0.32, 0.3, 0.36], u, BT_FUR, shade(BT_FUR, 0.7), 0.14, 2);
  flat(ctx, s, [0.45, -0.18, 0.9, -0.5, 0.62, -0.06], u, BT_FUR, 1.5);
  flat(ctx, s, [0.45, 0.18, 0.9, 0.5, 0.62, 0.06], u, BT_FUR, 1.5);
  oval(ctx, s, 0.55 * u, 0, 0.26 * u, 0.24 * u, mix(BT_FUR, '#ffffff', 0.1), 1.5);
  const screech = s.pose === 'windup' || s.pose === 'attack';
  if (!s.flash) {
    if (screech) {
      oval(ctx, null, 0.74 * u, 0, 0.1 * u, 0.12 * u, heat(s, '#ff7aa8', 0.6), 0);
      hot(ctx, s, 0.8 * u, 0, u * 1.4);
    }
    dot(ctx, 0.78 * u, -0.08 * u, 0.04 * u + 0.4, '#f4f0e0');
    dot(ctx, 0.78 * u, 0.08 * u, 0.04 * u + 0.4, '#f4f0e0');
    const eye = elemGlow(s, TEAL);
    dot(ctx, 0.6 * u, -0.12 * u, Math.max(0.9, 0.07 * u), eye);
    dot(ctx, 0.6 * u, 0.12 * u, Math.max(0.9, 0.07 * u), eye);
    if (s.variant % 2 === 0) glow(ctx, -0.25 * u, 0, 0.6 * u, SPORE, 0.45);
  }
  ctx.restore();
  light(0);
});

// ---------------------------------------------------------------- Mycelium Weaver
// A fungal spider that knits the floor: a bulbous abdomen veined with glowing violet mycelium, a cluster of
// eyes on its head, eight jointed stalk-legs, and threads trailing from its spinnerets. Legs rear up to lash.
const MW_BODY = '#7a5a9a';
const MW_BODY_U = shade(MW_BODY, 0.62);
const MW_LEG = '#a88cc8';

registerDraw('caverns_weaver', (ctx, s) => {
  const u = s.r * s.scale;
  shadow(ctx, s.x, s.y, u * 1.1);
  const lash = s.pose === 'windup' ? 1 : s.pose === 'attack' ? 1.4 : 0;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  light(s.facing);
  // threads trailing from the spinnerets
  if (!s.flash) {
    ctx.strokeStyle = withAlpha('#e8dcff', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(-1.0 * u, 0);
      ctx.quadraticCurveTo(-1.4 * u, i * 0.4 * u + Math.sin(s.t * 2 + i) * 0.1 * u, -1.9 * u, i * 0.7 * u);
    }
    ctx.stroke();
  }
  // eight legs: knees high and outward, tips planted; they rear and glow while lashing
  const tipCol = heat(s, MW_LEG, 0.9);
  for (let i = 0; i < 4; i++) {
    const base = 0.35 - i * 0.22;
    const ang = (1.0 - i * 0.42) * 1.0;
    for (const side of [-1, 1]) {
      const wv = Math.sin(s.t * 6 + i * 1.3 + side) * 0.08 * (0.3 + s.moving);
      const a = side * (Math.PI / 2 - ang + 0.6) + wv;
      const reach = (1.55 + (i === 0 ? 0.15 : 0)) * (1 + lash * 0.18);
      const tx = base * u + Math.cos(a) * reach * u;
      const ty = Math.sin(a) * reach * u;
      arm(ctx, s, base * u, side * 0.28 * u, tx, ty, 0.86 * u, 0.86 * u, i < 2 ? -side : side, 0.08 * u, 0.07 * u, 0.04 * u, i % 2 ? shade(MW_LEG, 0.85) : MW_LEG, 2);
      oval(ctx, s, J[0]!, J[1]!, 0.09 * u, 0.09 * u, VIOLET, 1.5);
      if (lash) {
        dot(ctx, J[2]!, J[3]!, 0.08 * u, tipCol);
        hot(ctx, s, J[2]!, J[3]!, 0.5 * u, 0.6);
      }
    }
  }
  // abdomen with glowing veins
  const breathe = 1 + Math.sin(s.t * 2) * 0.03 + Math.max(0, -s.squash) * 0.1;
  ctx.save();
  ctx.translate(-0.55 * u, 0);
  ctx.scale(breathe, breathe);
  shape(ctx, s, [0.4, 0, 0.25, -0.55, -0.3, -0.68, -0.72, -0.4, -0.85, 0, -0.72, 0.4, -0.3, 0.68, 0.25, 0.55], u, MW_BODY, MW_BODY_U, 0.16, 2.5);
  if (!s.flash) {
    const vein = elemGlow(s, VIOLET);
    ctx.strokeStyle = vein;
    ctx.lineWidth = Math.max(1.2, 0.06 * u);
    ctx.beginPath();
    ctx.moveTo(0.25 * u, 0);
    ctx.quadraticCurveTo(-0.2 * u, -0.1 * u, -0.7 * u, 0);
    ctx.moveTo(-0.1 * u, -0.05 * u);
    ctx.quadraticCurveTo(-0.3 * u, -0.4 * u, -0.5 * u, -0.5 * u);
    ctx.moveTo(-0.1 * u, 0.05 * u);
    ctx.quadraticCurveTo(-0.3 * u, 0.4 * u, -0.5 * u, 0.5 * u);
    ctx.stroke();
    for (const [px, py] of [
      [-0.3, -0.35],
      [-0.3, 0.35],
      [-0.6, 0],
    ] as const) {
      oval(ctx, null, px * u, py * u, 0.1 * u, 0.1 * u, vein, 0);
      glow(ctx, px * u, py * u, 0.4 * u, vein, 0.45);
    }
  }
  ctx.restore();
  // head and its cluster of eyes
  shape(ctx, s, [0.62, 0, 0.45, -0.32, 0.0, -0.36, -0.15, 0, 0.0, 0.36, 0.45, 0.32], u, mix(MW_BODY, '#ffffff', 0.1), MW_BODY_U, 0.1, 2.5);
  // fangs
  for (const side of [-1, 1]) flat(ctx, s, [0.55, side * 0.1, 0.82 + lash * 0.08, side * 0.16, 0.6, side * 0.02], u, heat(s, '#e8dcc0'), 1.2);
  if (!s.flash) {
    const big = s.pose === 'windup' ? heat(s, '#8fd3ff', 0.9) : '#f4e8ff';
    oval(ctx, null, 0.32 * u, 0, 0.14 * u, 0.14 * u, big, 0);
    dot(ctx, 0.36 * u, 0, 0.06 * u, '#2a1040');
    for (const [px, py] of [
      [0.42, -0.2],
      [0.42, 0.2],
      [0.18, -0.22],
      [0.18, 0.22],
    ] as const) dot(ctx, px * u, py * u, Math.max(0.9, 0.05 * u), elemGlow(s, TEAL));
  }
  ctx.restore();
  light(0);
  hot(ctx, s, s.x, s.y, u * 1.6, 0.4);
});
