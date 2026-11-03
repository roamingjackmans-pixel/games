// Special non-roster enemies (CONTENT_ENEMIES §10): the training dummy, The Instructor and Gary.
// props.ts registers older versions of 'the_instructor' and 'gary'; importing it first (drawCart) makes the
// registrations below the ones that stand, whatever order the scenes import the draw modules in.
import { OUTLINE, glow, shade, shadow, spec } from '../parts';
import { drawCart } from '../props';
import { fc, registerDraw } from '../registry';
import {
  TAU,
  armBehind,
  bend,
  bob,
  ell,
  eyes2,
  frame,
  fwdP,
  hot,
  legs,
  limb3,
  poly2,
  sheen,
  sideP,
  smooth2,
  sparkle,
  stick,
  streak,
  striking,
  swingTrail,
} from '../shapesB';

const WOOD = '#6a4a2a';
const BURLAP = '#c8a860';
const STRAW = '#e6c870';

// ------------------------------------------------------------------ Training dummy: a sack-and-straw figure on a post
registerDraw('training_dummy', (ctx, s) => {
  const r = s.r * s.scale;
  const H = hot(s);
  const swinging = s.pose === 'attack' || s.pose === 'recover';
  const sway = Math.sin(s.t * 2) * 0.05 + (s.pose === 'attack' ? 0.3 : s.squash * -0.2) + (s.pose === 'stagger' ? 0.35 : 0);
  const hop = s.pose === 'windup' && s.atk && s.tint === 'red' ? Math.abs(Math.sin(s.poseT * 9)) * r * 0.15 : 0;
  shadow(ctx, s.x, s.y + r * 0.1, r * 0.9);
  // weighted base: two crossed planks on the floor
  poly2(ctx, s, [s.x - r * 0.75, s.y + r * 0.62, s.x + r * 0.75, s.y + r * 0.62, s.x + r * 0.7, s.y + r * 0.8, s.x - r * 0.7, s.y + r * 0.8], shade(WOOD, 0.85), 2, 2.5);
  poly2(ctx, s, [s.x - r * 0.14, s.y + r * 0.45, s.x + r * 0.14, s.y + r * 0.45, s.x + r * 0.16, s.y + r * 0.95, s.x - r * 0.16, s.y + r * 0.95], shade(WOOD, 0.7), 2, 2.5);
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.7 - hop);
  ctx.rotate(sway);
  const k = r / 22;
  // the post
  stick(ctx, s, 0, 0, 0, -r * 1.35, r * 0.2, WOOD);
  // crossbar arms; the swing turns them like a turnstile
  const spin = swinging ? Math.min(1, s.poseT / 0.25) * Math.PI * 0.9 : s.pose === 'windup' ? -0.35 * Math.min(1, s.poseT / 0.6) : 0;
  const armL = r * 1.05 * Math.cos(spin);
  const armY = -r * 1.25 + r * 0.25 * Math.sin(spin);
  if (H && s.pose === 'attack') swingTrail(ctx, 0, -r * 1.25, r * 1.05, -0.2, -0.2 + spin, r * 0.35, H, 0.6);
  stick(ctx, s, -armL, armY, armL, -r * 1.25 - r * 0.25 * Math.sin(spin), r * 0.16, WOOD);
  for (const side of [-1, 1]) {
    const ax = side * armL;
    const ay = side > 0 ? -r * 1.25 - r * 0.25 * Math.sin(spin) : armY;
    // straw tufts at the ends of the stuffed sleeves
    for (let i = -1; i <= 1; i++) stick(ctx, s, ax, ay, ax + side * r * 0.22, ay + i * r * 0.12, 1.6 * k, STRAW, 1.5);
    smooth2(ctx, s, [ax - r * 0.18, ay - r * 0.12, ax + r * 0.18, ay - r * 0.12, ax + r * 0.2, ay + r * 0.12, ax - r * 0.2, ay + r * 0.12], BURLAP, 0.6, 2);
  }
  // sack torso tied at the waist, a painted target on the chest
  const ty = -r * 0.95;
  smooth2(ctx, s, [-r * 0.5, ty - r * 0.35, 0, ty - r * 0.45, r * 0.5, ty - r * 0.35, r * 0.45, ty + r * 0.15, r * 0.3, ty + r * 0.42, r * 0.36, ty + r * 0.6, -r * 0.36, ty + r * 0.6, -r * 0.3, ty + r * 0.42, -r * 0.45, ty + r * 0.15], BURLAP, 0.62);
  ctx.strokeStyle = s.flash ? '#ffffff' : '#8a6a30';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, ty + r * 0.36);
  ctx.lineTo(r * 0.3, ty + r * 0.36);
  ctx.stroke();
  if (!s.flash) {
    ctx.fillStyle = '#c03a3a';
    ctx.beginPath();
    ctx.arc(0, ty - r * 0.05, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = BURLAP;
    ctx.beginPath();
    ctx.arc(0, ty - r * 0.05, r * 0.14, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c03a3a';
    ctx.beginPath();
    ctx.arc(0, ty - r * 0.05, r * 0.06, 0, TAU);
    ctx.fill();
  }
  // straw sticking out at the neck
  for (let i = -2; i <= 2; i++) stick(ctx, s, i * r * 0.06, ty - r * 0.4, i * r * 0.12, ty - r * 0.58, 1.5 * k, STRAW, 1.5);
  // sack head with stitched eyes, under a dented pot helmet
  const hy = -r * 1.72;
  smooth2(ctx, s, [-r * 0.36, hy + r * 0.1, -r * 0.3, hy - r * 0.28, r * 0.3, hy - r * 0.28, r * 0.36, hy + r * 0.1, r * 0.2, hy + r * 0.36, -r * 0.2, hy + r * 0.36], '#d8b870', 0.62);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    const ex = side * r * 0.14;
    const ey = hy + r * 0.04;
    ctx.moveTo(ex - r * 0.06, ey - r * 0.06);
    ctx.lineTo(ex + r * 0.06, ey + r * 0.06);
    ctx.moveTo(ex + r * 0.06, ey - r * 0.06);
    ctx.lineTo(ex - r * 0.06, ey + r * 0.06);
  }
  ctx.moveTo(-r * 0.12, hy + r * 0.22);
  for (let i = 1; i <= 4; i++) ctx.lineTo(-r * 0.12 + i * r * 0.06, hy + r * (i % 2 ? 0.26 : 0.2));
  ctx.stroke();
  poly2(ctx, s, [-r * 0.4, hy - r * 0.16, r * 0.4, hy - r * 0.16, r * 0.3, hy - r * 0.5, r * 0.05, hy - r * 0.46, -r * 0.3, hy - r * 0.5], '#8a8f98', 0.6, 2.5);
  spec(ctx, -r * 0.18, hy - r * 0.38, 1.6, 0.7);
  ctx.restore();
  if (H && striking(s) && s.atk !== 'physical') glow(ctx, s.x, s.y - r * 0.6, r * 1.4, H, 0.4 + Math.min(0.4, s.poseT * 0.3));
});

// ------------------------------------------------------------------ The Instructor: a hulking coach with a whistle
registerDraw('the_instructor', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  const b = bob(s, 1.2, 3);
  shadow(ctx, s.x, s.y, r, 0.4);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.82 + 0.18 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.4 * (1 - s.squash * 0.08) + b;
  const SUIT = '#2a4a8a';
  const SKIN = '#e0b890';
  const raise = s.pose === 'windup';
  const slam = s.pose === 'attack';
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.1, r * 0.78 * wf, side);
    let hx: number;
    let hy: number;
    if (raise) [hx, hy] = sideP(f, x + f.fx * r * 0.1, top - r * 0.85, r * 0.25, side);
    else if (slam) [hx, hy] = sideP(f, ...fwdP(f, x, s.y + r * 0.2 + b, r * 1.0), r * 0.22, side);
    else [hx, hy] = sideP(f, sx + f.fx * r * 0.15, sy + r * 0.62, r * 0.1, side);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.0, f.px * side, 0.3);
    // jacket sleeve with a white stripe, then a huge forearm
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.32, r * 0.3, SUIT);
    sheen(ctx, [sx, sy, ex, ey], '#efe6d2', 2, 0.9);
    stick(ctx, s, ex + (hx - ex) * 0.35, ey + (hy - ey) * 0.35, hx, hy, r * 0.28, SKIN);
    if (H && slam) streak(ctx, ex, ey, hx, hy + r * 0.2, r * 0.25, H, 0.5);
    smooth2(ctx, s, [hx - r * 0.2, hy - r * 0.08, hx - r * 0.1, hy - r * 0.2, hx + r * 0.12, hy - r * 0.2, hx + r * 0.2, hy - r * 0.06, hx + r * 0.14, hy + r * 0.16, hx - r * 0.14, hy + r * 0.16], SKIN, 0.6, 2.5);
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  legs(ctx, s, f, x, s.y + r * 0.3 + b, gy, r * 0.36, r * 0.28, SUIT, '#efe6d2', r * 0.15, 4, 1.1);
  // a wedge of a torso in a tracksuit
  poly2(ctx, s, [x - w * 0.98, top - r * 0.02, x - w * 0.55, top - r * 0.22, x + w * 0.55, top - r * 0.22, x + w * 0.98, top - r * 0.02, x + w * 0.62, s.y + r * 0.38 + b, x - w * 0.62, s.y + r * 0.38 + b], SUIT, 0.6);
  sheen(ctx, [x - w * 0.95, top + r * 0.02, x - w * 0.6, s.y + r * 0.34 + b], '#efe6d2', 2.5, 1);
  sheen(ctx, [x + w * 0.95, top + r * 0.02, x + w * 0.6, s.y + r * 0.34 + b], '#efe6d2', 2.5, 1);
  if (!f.back) {
    const ox = x + f.fx * w * 0.12;
    sheen(ctx, [ox, top - r * 0.18, ox, s.y + r * 0.34 + b], '#c8ccd4', 1.5, 0.9);
    // the whistle cord
    ctx.strokeStyle = fc(s, '#c03030');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox - r * 0.2, top - r * 0.2);
    ctx.quadraticCurveTo(ox, top + r * 0.25, ox + r * 0.2, top - r * 0.2);
    ctx.stroke();
    ell(ctx, s, ox, top + r * 0.14, r * 0.07, r * 0.05, '#d0d0d0', 2, 1.5);
  }
  spec(ctx, x - w * 0.5, top - r * 0.08, 2.6, 0.6);
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // small head on a thick neck: square jaw, red cap; he blows the whistle on the windup
  const hx = x + f.fx * r * 0.12;
  const hy = top - r * 0.32 + f.fy * r * 0.04;
  smooth2(ctx, s, [hx - r * 0.26, hy + r * 0.14, hx - r * 0.26, hy - r * 0.16, hx + r * 0.26, hy - r * 0.16, hx + r * 0.26, hy + r * 0.14, hx + r * 0.2, hy + r * 0.3, hx - r * 0.2, hy + r * 0.3], SKIN, 0.65, 2.5);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.1;
    eyes2(ctx, f, fx2, hy - r * 0.02, r * 0.1, Math.max(1.3, r * 0.04), OUTLINE, 0);
    sheen(ctx, [fx2 - r * 0.16, hy - r * 0.1, fx2 - r * 0.04, hy - r * 0.07], OUTLINE, 2, 1);
    sheen(ctx, [fx2 + r * 0.04, hy - r * 0.07, fx2 + r * 0.16, hy - r * 0.1], OUTLINE, 2, 1);
    if (raise) {
      // whistle in the mouth, a shrill glint
      ell(ctx, s, fx2 + f.fx * r * 0.12, hy + r * 0.16, r * 0.08, r * 0.05, '#d0d0d0', 2, 1.5);
      sparkle(ctx, fx2 + f.fx * r * 0.3 + r * 0.15, hy - r * 0.05, r * 0.14 + Math.sin(s.t * 30) * 2, '#ffffff', s.t * 6);
    } else sheen(ctx, [fx2 - r * 0.09, hy + r * 0.18, fx2 + r * 0.09, hy + r * 0.18], OUTLINE, 1.6, 1);
  }
  poly2(ctx, s, [hx - r * 0.28, hy - r * 0.08, hx - r * 0.24, hy - r * 0.3, hx + r * 0.24, hy - r * 0.3, hx + r * 0.28, hy - r * 0.08], '#c03030', 0.6, 2.5);
  if (!f.back) poly2(ctx, s, [hx + f.fx * r * 0.05 - r * 0.24, hy - r * 0.1, hx + f.fx * r * 0.05 + r * 0.24, hy - r * 0.1, hx + f.fx * r * 0.42 + r * 0.16 * Math.abs(f.fy), hy - r * 0.02 + f.fy * r * 0.12, hx + f.fx * r * 0.42 - r * 0.16 * Math.abs(f.fy), hy - r * 0.02 + f.fy * r * 0.12], shade('#c03030', 0.8), 2, 2);
});

// ------------------------------------------------------------------ Gary: a hooded pedlar under an enormous pack
registerDraw('gary', (ctx, s) => {
  drawCart(ctx, s.x + 50, s.y - 4);
  const r = s.r * s.scale * 0.8;
  const f = frame(s);
  const b = Math.sin(s.t * 1.6) * 0.8;
  shadow(ctx, s.x, s.y, r);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.4 + b;
  const CLOAK = '#6a5a3a';
  // the pack: a lumpy bundle piled with a pot, a rolled rug and a lantern
  const pack = (): void => {
    const [px, py] = fwdP(f, x, top - r * 0.25, -r * 0.35);
    smooth2(ctx, s, [px - r * 0.7, py + r * 0.4, px - r * 0.75, py - r * 0.4, px - r * 0.3, py - r * 0.8, px + r * 0.35, py - r * 0.78, px + r * 0.75, py - r * 0.35, px + r * 0.7, py + r * 0.4], '#8a6a42', 0.6);
    stick(ctx, s, px - r * 0.85, py - r * 0.7, px + r * 0.85, py - r * 0.95, r * 0.24, '#a03030');
    ell(ctx, s, px + r * 0.35, py - r * 1.05, r * 0.26, r * 0.2, '#5a5a62', 0.55, 2);
    stick(ctx, s, px - r * 0.45, py - r * 1.05, px - r * 0.45, py - r * 1.45, r * 0.06, '#3a3a40', 1.5);
    glow(ctx, px - r * 0.45, py - r * 1.5, r * 0.6, '#ffd27a', 0.5 + Math.sin(s.t * 5) * 0.1);
    poly2(ctx, s, [px - r * 0.58, py - r * 1.62, px - r * 0.32, py - r * 1.62, px - r * 0.36, py - r * 1.35, px - r * 0.54, py - r * 1.35], '#d4a040', 2, 1.5);
    sheen(ctx, [px - r * 0.6, py - r * 0.1, px + r * 0.6, py - r * 0.1], '#4a3a22', 2.5, 1);
  };
  if (!f.back) pack();
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.24, r * 0.2, '#4a3a2a', '#2a1e14', r * 0.2, 6);
  poly2(ctx, s, [x - w * 0.45, top, x + w * 0.45, top, x + w * 0.62, s.y + r * 0.2 + b, x + w * 0.7, gy - r * 0.15, x - w * 0.7, gy - r * 0.15, x - w * 0.62, s.y + r * 0.2 + b], CLOAK, 0.62);
  sheen(ctx, [x - w * 0.6, s.y + r * 0.1 + b, x + w * 0.6, s.y + r * 0.1 + b], '#c9b98a', 2.5, 1);
  if (f.back) pack();
  // the walking stick, and a hand rubbed against the other
  const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.45 * wf, 1);
  const [hx2, hy2] = [sx + f.fx * r * 0.35 + f.px * r * 0.2, sy + r * 0.4];
  stick(ctx, s, hx2, hy2 - r * 0.9, hx2 + f.fx * r * 0.1, gy, r * 0.1, '#5a3a20');
  const [ex, ey] = bend(sx, sy, hx2, hy2, r * 0.7, f.px, 0.6);
  limb3(ctx, s, sx, sy, ex, ey, hx2, hy2, r * 0.22, r * 0.2, CLOAK);
  ell(ctx, s, hx2, hy2, r * 0.1, r * 0.09, '#e0c0a0', 0.6, 2);
  // hood, a scarf up to the nose, and two shifty eyes
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.34;
  smooth2(ctx, s, [hx - r * 0.42, hy + r * 0.34, hx - r * 0.46, hy - r * 0.1, hx - r * 0.2, hy - r * 0.48, hx + r * 0.2, hy - r * 0.48, hx + r * 0.46, hy - r * 0.1, hx + r * 0.42, hy + r * 0.34], '#4a7a4a', 0.68);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.16;
    const rw = r * (0.26 - 0.08 * Math.abs(f.fx));
    smooth2(ctx, s, [fx2 - rw, hy + r * 0.04, fx2, hy - r * 0.24, fx2 + rw, hy + r * 0.04, fx2 + rw * 0.7, hy + r * 0.26, fx2 - rw * 0.7, hy + r * 0.26], '#e0c0a0', 0.7, 2);
    poly2(ctx, s, [fx2 - rw * 0.95, hy + r * 0.06, fx2 + rw * 0.95, hy + r * 0.06, fx2 + rw * 0.7, hy + r * 0.28, fx2 - rw * 0.7, hy + r * 0.28], '#a03030', 2, 1.5);
    const look = Math.sin(s.t * 0.9) > 0.6 ? 1 : Math.sin(s.t * 0.9) < -0.6 ? -1 : 0;
    eyes2(ctx, f, fx2 + look * r * 0.05, hy - r * 0.06, r * 0.09, Math.max(1.2, r * 0.05), OUTLINE, 0);
  }
});
