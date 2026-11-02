// Boss 8 draw function — The Landlord (CONTENT_ENEMIES §11, ART_AUDIO §2). Phase 0: a tall suited
// silhouette with a face of static and a briefcase. Phase 1: bigger, four arms. Phase 2: a huge void face
// filling the far third of the platform, its maw opening on the windup, a red sweep arrow showing where
// Foreclosure's gaze strikes next (s.gaze). The red/blue tint glow is added by the registry.
import { OUTLINE, blob, glow, limb, poly, shade, shadow, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const VOID = '#06030a';
const SUIT = '#1c1826';
const LILAC = '#b06bff';
const VIOLET = '#7a2bd6';
const PALE = '#e8e4f0';
const TAU = Math.PI * 2;

/** Deterministic flicker in [0, 1) (no Math.random in draw code: frames must be reproducible). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function lift(s: DrawState): number {
  if (s.pose === 'windup') return 1;
  if (s.pose === 'attack') return -0.6;
  return 0;
}

/** A rounded-rect screen of TV static (the Landlord's face), clipped to its shape. */
function staticFace(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, flash: boolean, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.32);
  ctx.fillStyle = flash ? '#ffffff' : '#3a3644';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const frame = Math.floor(t * 14);
  const rows = Math.max(6, Math.round(h / 4));
  for (let i = 0; i < rows; i++) {
    const k = hash(frame * 31 + i);
    const ry = y - h / 2 + (i * h) / rows;
    ctx.fillStyle = withAlpha(k > 0.5 ? PALE : '#141018', 0.25 + hash(frame * 7 + i * 3) * 0.55);
    ctx.fillRect(x - w / 2 + k * w * 0.5 - w * 0.25, ry, w * (0.4 + hash(i + frame) * 0.8), h / rows);
  }
  // a rolling bright band
  const band = y - h / 2 + ((t * 0.6) % 1) * h;
  ctx.fillStyle = withAlpha(PALE, 0.22);
  ctx.fillRect(x - w / 2, band, w, h * 0.12);
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
}

function briefcase(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, size: number, s: DrawState): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -size * 0.45, size * 0.22, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-size * 0.6, -size * 0.45, size * 1.2, size * 0.85, 4);
  ctx.fillStyle = fc(s, '#2e2216');
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9a85a';
  ctx.fillRect(-size * 0.12, -size * 0.3, size * 0.24, size * 0.12);
  ctx.restore();
}

/** One suit arm from the shoulder to a pale hand; returns the hand position. */
function arm(ctx: CanvasRenderingContext2D, sx: number, sy: number, a: number, len: number, w: number, s: DrawState): [number, number] {
  const ex = sx + Math.cos(a) * len * 0.55;
  const ey = sy + Math.sin(a) * len * 0.55;
  const hx = sx + Math.cos(a + 0.25) * len;
  const hy = sy + Math.sin(a + 0.25) * len;
  limb(ctx, sx, sy, ex, ey, w, fc(s, SUIT));
  limb(ctx, ex, ey, hx, hy, w * 0.85, fc(s, SUIT));
  blob(ctx, hx, hy, w * 0.55, w * 0.55, { fill: fc(s, '#cfc8dc'), outlineW: 2 });
  return [hx, hy];
}

function drawSuited(ctx: CanvasRenderingContext2D, s: DrawState, fourArms: boolean): void {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const px = -Math.sin(s.facing);
  const py = Math.cos(s.facing);
  const L = lift(s);
  const sway = Math.sin(s.t * 1.6) * 1.5;
  shadow(ctx, s.x, s.y + r * 0.2, r * 0.8);
  // a violet rim so the black suit reads on the black platform
  glow(ctx, s.x, s.y - r * 0.4, r * (fourArms ? 2.4 : 1.9), fourArms ? LILAC : VIOLET, fourArms ? 0.4 + Math.sin(s.t * 5) * 0.08 : 0.3);
  // long legs
  const step = Math.sin(s.t * 5) * r * 0.12 * s.moving;
  limb(ctx, s.x - r * 0.18, s.y + r * 0.2, s.x - r * 0.22 + step, s.y + r * 0.95, r * 0.2, fc(s, '#14101c'));
  limb(ctx, s.x + r * 0.18, s.y + r * 0.2, s.x + r * 0.22 - step, s.y + r * 0.95, r * 0.2, fc(s, '#14101c'));
  // the extra pair of arms (phase 2) spin with the flurry
  const spin = s.pose === 'attack' ? s.poseT * TAU * 1.1 : 0;
  if (fourArms) {
    for (const k of [-1, 1]) {
      const base = s.facing + k * (Math.PI * 0.62) + spin;
      arm(ctx, s.x + px * r * 0.42 * k, s.y - r * 0.25 + py * r * 0.15 * k, base + L * 0.5 * k, r * 1.25, r * 0.17, s);
    }
  }
  // tall tapered suit jacket
  const sh = s.y - r * 0.75 + sway;
  poly(
    ctx,
    [s.x - r * 0.58, sh, s.x + r * 0.58, sh, s.x + r * 0.42, s.y + r * 0.32, s.x - r * 0.42, s.y + r * 0.32],
    fc(s, SUIT),
    OUTLINE,
    3,
  );
  // lapels, shirt and a violet tie
  poly(ctx, [s.x - r * 0.2, sh, s.x + r * 0.2, sh, s.x, s.y - r * 0.2 + sway], fc(s, PALE), OUTLINE, 2);
  poly(ctx, [s.x - r * 0.06, sh + r * 0.06, s.x + r * 0.06, sh + r * 0.06, s.x + r * 0.05, s.y - r * 0.28 + sway, s.x, s.y - r * 0.18 + sway, s.x - r * 0.05, s.y - r * 0.28 + sway], fc(s, '#6a1fb0'), OUTLINE, 1.5);
  poly(ctx, [s.x - r * 0.2, sh, s.x - r * 0.34, sh + r * 0.1, s.x - r * 0.04, s.y - r * 0.12 + sway], fc(s, shade(SUIT, 1.4)), OUTLINE, 2);
  poly(ctx, [s.x + r * 0.2, sh, s.x + r * 0.34, sh + r * 0.1, s.x + r * 0.04, s.y - r * 0.12 + sway], fc(s, shade(SUIT, 1.4)), OUTLINE, 2);
  // the briefcase arm (raised on the windup, swung through on the attack) and the empty hand
  const swing = s.pose === 'windup' ? -1.3 : s.pose === 'attack' ? 1.0 : 0.15;
  const [bx, by] = arm(ctx, s.x + px * r * 0.55, sh + r * 0.12 + py * r * 0.2, s.facing + swing - L * 0.4, r * 1.05, r * 0.2, s);
  briefcase(ctx, bx + fx * 4, by + r * 0.18, s.facing + swing * 0.6, r * 0.42, s);
  arm(ctx, s.x - px * r * 0.55, sh + r * 0.12 - py * r * 0.2, Math.PI / 2 + 0.25, r * 0.9, r * 0.2, s);
  // the head: a screen of static on a thin neck
  const hy = sh - r * 0.42 - L * r * 0.06;
  limb(ctx, s.x, sh + 2, s.x, hy + r * 0.2, r * 0.12, fc(s, '#cfc8dc'));
  staticFace(ctx, s.x, hy, r * 0.62, r * 0.72, s.t, s.flash);
  // two pale pinpricks where eyes would be, looking where he looks
  ctx.fillStyle = withAlpha('#ffffff', 0.85);
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s.x + k * r * 0.13 + fx * r * 0.05, hy - r * 0.05, Math.max(1.5, r * 0.045), 0, TAU);
    ctx.fill();
  }
}

/** The arrow showing where the face's gaze turns next (Foreclosure's sweep). */
function sweepArrow(ctx: CanvasRenderingContext2D, x: number, y: number, rr: number, gaze: number, t: number): void {
  const from = gaze - (TAU / 3) * 0.55;
  const pulse = 0.55 + Math.sin(t * 6) * 0.2;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = withAlpha('#ff3b3b', pulse);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, rr, from, gaze);
  ctx.stroke();
  // the head of the arrow, then a short ray along the gaze
  const hx = x + Math.cos(gaze) * rr;
  const hy = y + Math.sin(gaze) * rr;
  const tx = -Math.sin(gaze);
  const ty = Math.cos(gaze);
  poly(ctx, [hx + tx * 18, hy + ty * 18, hx - Math.cos(gaze) * 12, hy - Math.sin(gaze) * 12, hx + Math.cos(gaze) * 12, hy + Math.sin(gaze) * 12], withAlpha('#ff3b3b', pulse + 0.2), OUTLINE, 2);
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(gaze) * rr * 1.08, y + Math.sin(gaze) * rr * 1.08);
  ctx.lineTo(x + Math.cos(gaze) * rr * 1.7, y + Math.sin(gaze) * rr * 1.7);
  ctx.stroke();
  ctx.restore();
}

function drawVoidFace(ctx: CanvasRenderingContext2D, s: DrawState): void {
  const r = s.r * s.scale;
  const rx = r * 2.1;
  const ry = r * 1.35;
  const open = s.pose === 'windup' ? Math.min(1, s.poseT / 0.8) : s.pose === 'attack' ? 1 - Math.min(1, s.poseT / 0.3) : 0.12;
  const breathe = Math.sin(s.t * 1.4) * 0.03;
  glow(ctx, s.x, s.y, rx * 1.7, VIOLET, 0.45 + Math.sin(s.t * 2.3) * 0.08);
  // tendrils of void around the rim
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + Math.sin(s.t * 0.7 + i) * 0.12;
    const len = 1.15 + 0.25 * Math.sin(s.t * 2 + i * 1.7);
    ctx.strokeStyle = withAlpha(i % 3 === 0 ? LILAC : '#2a0d3f', 0.75);
    ctx.lineWidth = 9 - (i % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(s.x + Math.cos(a) * rx * 0.85, s.y + Math.sin(a) * ry * 0.85);
    ctx.quadraticCurveTo(
      s.x + Math.cos(a + 0.2) * rx * (len + 0.05),
      s.y + Math.sin(a + 0.2) * ry * (len + 0.05),
      s.x + Math.cos(a - 0.1) * rx * (len + 0.2),
      s.y + Math.sin(a - 0.1) * ry * (len + 0.2),
    );
    ctx.stroke();
  }
  ctx.restore();
  // the face itself: void, a faint static, a pale rim
  blob(ctx, s.x, s.y, rx * (1 + breathe), ry * (1 - breathe), { fill: fc(s, VOID), under: '#120a1e', outline: LILAC, outlineW: 3 });
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, rx * 0.96, ry * 0.96, 0, 0, TAU);
  ctx.clip();
  staticFace(ctx, s.x, s.y, rx * 2, ry * 2, s.t, false, 0.16);
  ctx.restore();
  // two huge eyes looking where it looks
  const lx = Math.cos(s.facing) * r * 0.16;
  const ly = Math.sin(s.facing) * r * 0.12;
  for (const k of [-1, 1]) {
    const ex = s.x + k * rx * 0.42;
    const ey = s.y - ry * 0.28;
    blob(ctx, ex, ey, r * 0.42, r * 0.3 * (1 - open * 0.3), { fill: fc(s, PALE), under: '#b9b0cc', outlineW: 3 }, k * -0.15);
    blob(ctx, ex + lx, ey + ly, r * 0.15, r * 0.15, { fill: LILAC, outline: OUTLINE, outlineW: 2 });
    ctx.fillStyle = VOID;
    ctx.beginPath();
    ctx.arc(ex + lx, ey + ly, r * 0.07, 0, TAU);
    ctx.fill();
  }
  // the maw: opens on the windup (the bite), teeth all round
  const mw = rx * 0.62;
  const mh = ry * (0.12 + open * 0.38);
  const my = s.y + ry * 0.32;
  blob(ctx, s.x, my, mw, mh, { fill: '#000000', under: '#2a0d3f', outline: LILAC, outlineW: 2 });
  const teeth = 9;
  for (let i = 0; i < teeth; i++) {
    const tx = s.x - mw * 0.85 + (i * mw * 1.7) / (teeth - 1);
    const edge = Math.sqrt(Math.max(0, 1 - ((tx - s.x) / mw) ** 2));
    const th = r * 0.14 * (0.6 + open * 0.6);
    poly(ctx, [tx - r * 0.06, my - mh * edge, tx + r * 0.06, my - mh * edge, tx, my - mh * edge + th], PALE, OUTLINE, 1.5);
    poly(ctx, [tx - r * 0.06, my + mh * edge, tx + r * 0.06, my + mh * edge, tx, my + mh * edge - th], PALE, OUTLINE, 1.5);
  }
  if (s.gaze !== undefined) sweepArrow(ctx, s.x, s.y, Math.max(rx, ry) * 1.25, s.gaze, s.t);
}

registerDraw('boss_landlord', (ctx, s) => {
  if (s.phase >= 2) drawVoidFace(ctx, s);
  else drawSuited(ctx, s, s.phase >= 1);
});
