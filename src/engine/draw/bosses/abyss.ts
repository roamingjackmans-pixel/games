// Boss 8 draw function — The Landlord (CONTENT_ENEMIES §11, ART_AUDIO §2). Void-typed: black suits rim-lit in
// the Abyss violets so the silhouette reads on the black platform.
// Phase 0, The Interview: a very tall, slender man in a sharp-shouldered tailcoat and a top hat, his head an
// old TV set showing static, a briefcase in the leading hand, long spindly fingers.
// Phase 1, The Eviction: bigger, the suit torn open on void ribs, two more long clawed arms from the shoulder
// blades (they spin with the Four-Arm Flurry), the screen cracked into a jagged grin, a taller battered hat.
// Phase 2, The Deep Lease: a colossal void face filling the far third of the platform under a floating top
// hat, ram horns, glowing slit-pupil eyes, a grinning maw that opens on the windup, two huge clawed hands
// gripping the platform's edge, and a red sweep arrow showing where Foreclosure's gaze strikes next (s.gaze).
// Phase 4, The Landlord, Unbound (D279): the face knocked down, he rises player-sized in black spiked plate, his
// TV head a horned helm with burning eyes, a void blade in his hand, wreathed in a golden-violet aura with
// crackling arcs. The 4.5 s transition (s.trans) plays it: face shards fly, he lies stunned, gets up, the power
// gathers, the top hat falls away and the armour forms.
// The red/blue tint glow is added by the registry.
import { mix, poly } from '../parts';
import { registerDraw, type DrawState } from '../registry';
import {
  OUTLINE,
  TAU,
  arm2,
  atkGlow,
  atkK,
  begin,
  blendPose,
  claws,
  clamp01,
  dizzy,
  elbow,
  f,
  flame,
  glow,
  glowEye,
  groundShadow,
  hash,
  horn,
  lerp,
  linePath,
  mixPose,
  oval,
  ow,
  poseWeights,
  raggedEdge,
  roar,
  roarLines,
  roarShake,
  shade,
  shape,
  smoothPath,
  strokePts,
  taper,
  trail,
  withAlpha,
} from '../shapesBoss';

const VOID = '#06030a';
const SUIT = '#1c1826';
const SUIT_HI = '#30293f';
const TROUSER = '#120e18';
const BEZEL = '#2a2433';
const LILAC = '#b06bff';
const VIOLET = '#7a2bd6';
const PALE = '#e8e4f0';
const HAND = '#cfc8dc';

/** Facing in a frame mirrored so the body always faces +x: [side (±1), local facing angle in [−π/2, π/2]]. */
function mirrored(s: DrawState): [number, number] {
  const fx = Math.cos(s.facing);
  const side = fx >= 0 ? 1 : -1;
  return [side, Math.atan2(Math.sin(s.facing), Math.abs(fx))];
}

/** A lilac rim stroke around a silhouette (drawn before the fills, so only the outer edge shows). */
function rim(ctx: CanvasRenderingContext2D, pts: number[], smooth: boolean, k = 1): void {
  if (smooth) smoothPath(ctx, pts);
  else linePath(ctx, pts);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = withAlpha(LILAC, 0.45);
  ctx.lineWidth = ow(2.1 * k);
  ctx.stroke();
}

/** Lilac rim behind a two-bone arm. */
function rimArm(ctx: CanvasRenderingContext2D, sx: number, sy: number, hx: number, hy: number, l1: number, l2: number, bend: number, w: number): void {
  const e = elbow(sx, sy, hx, hy, l1, l2, bend);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = withAlpha(LILAC, 0.42);
  ctx.lineWidth = w + ow(2.6);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(e[0], e[1]);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.restore();
}

/** A rounded-rect screen of TV static, clipped to its shape (deterministic per frame: no Math.random). */
function staticFace(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, flash: boolean, alpha = 1, bright = 0): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.28);
  ctx.fillStyle = flash ? '#ffffff' : bright > 0.5 ? '#5a5468' : '#3a3644';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const frame = Math.floor(t * 14);
  const rows = Math.max(6, Math.min(40, Math.round(h / 4)));
  for (let i = 0; i < rows; i++) {
    const k = hash(frame * 31 + i);
    const ry = y - h / 2 + (i * h) / rows;
    ctx.fillStyle = withAlpha(k > 0.5 - bright * 0.2 ? PALE : '#141018', 0.25 + hash(frame * 7 + i * 3) * 0.55);
    ctx.fillRect(x - w / 2 + k * w * 0.5 - w * 0.25, ry, w * (0.4 + hash(i + frame) * 0.8), h / rows);
  }
  // a rolling bright band
  const band = y - h / 2 + ((t * 0.6) % 1) * h;
  ctx.fillStyle = withAlpha(PALE, 0.22 + bright * 0.3);
  ctx.fillRect(x - w / 2, band, w, h * 0.12);
  ctx.restore();
  ctx.lineWidth = ow(0.8);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
}

interface TvOpts {
  back: boolean;
  flare: number;
  mouth: number;
  cracked: boolean;
  look: number;
  eyeCol: string | null;
}

/** The Landlord's head: an old TV set (bezel, static screen, pinprick or slit eyes, a scream or a cracked grin). */
function tvHead(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, w: number, h: number, r: number, o: TvOpts): void {
  // bezel
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22);
  ctx.fillStyle = f(s, BEZEL);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = f(s, shade(BEZEL, 0.6));
  ctx.fillRect(x - w / 2, y + h * 0.22, w, h * 0.3);
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22);
  ctx.lineWidth = ow(1);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (o.back) {
    // the back of the set: a cathode hump and vents
    shape(ctx, [x - w * 0.32, y - h * 0.3, x + w * 0.32, y - h * 0.3, x + w * 0.22, y + h * 0.3, x - w * 0.22, y + h * 0.3], f(s, shade(BEZEL, 0.8)), { under: null, w: 0.7 });
    for (let i = 0; i < 4; i++) strokePts(ctx, [x - w * 0.18, y - h * 0.16 + i * h * 0.1, x + w * 0.18, y - h * 0.16 + i * h * 0.1], OUTLINE, ow(0.5));
    return;
  }
  const sx = x - w * 0.04 + o.look * w * 0.03;
  const sw = w * 0.76;
  const sh = h * 0.72;
  if (o.flare > 0) glow(ctx, sx, y, w * (1.1 + o.flare * 0.9), o.flare > 0.6 ? '#e8d8ff' : LILAC, 0.3 + o.flare * 0.45);
  staticFace(ctx, sx, y, sw, sh, s.t, s.flash, 1, o.flare);
  // knobs and the power light
  oval(ctx, x + w * 0.42, y - h * 0.12, w * 0.035, w * 0.035, f(s, '#5a5468'), { under: null, w: 0.5 });
  oval(ctx, x + w * 0.42, y + h * 0.1, w * 0.035, w * 0.035, f(s, '#5a5468'), { under: null, w: 0.5 });
  glow(ctx, x + w * 0.42, y + h * 0.3, w * 0.12, LILAC, 0.8);
  // eyes: pinpricks, or angry glowing slits once he is angry
  const ex = sx + o.look * sw * 0.08;
  const ey = y - sh * 0.14;
  if (o.eyeCol) {
    for (const k of [-1, 1]) glowEye(ctx, ex + k * sw * 0.2, ey, sw * 0.11, sh * 0.06, o.eyeCol, k * 0.35, 1);
  } else {
    ctx.fillStyle = withAlpha('#ffffff', 0.92);
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(ex + k * sw * 0.18, ey, Math.max(1.5, r * 0.045), 0, TAU);
      ctx.fill();
    }
    glow(ctx, ex, ey, sw * 0.5, PALE, 0.25);
  }
  if (o.cracked) {
    // a jagged crack across the glass and a grin of teeth torn into the static
    strokePts(ctx, [sx - sw * 0.46, y - sh * 0.38, sx - sw * 0.12, y - sh * 0.05, sx - sw * 0.22, y + sh * 0.08, sx + sw * 0.1, y + sh * 0.18], '#ffffff', ow(0.6), 0.9);
    strokePts(ctx, [sx - sw * 0.12, y - sh * 0.05, sx + sw * 0.08, y - sh * 0.3, sx + sw * 0.3, y - sh * 0.42], '#ffffff', ow(0.5), 0.7);
    const gw = sw * (0.42 + o.mouth * 0.04);
    const gy = y + sh * 0.2;
    const gh = sh * (0.08 + o.mouth * 0.14);
    ctx.beginPath();
    ctx.moveTo(sx - gw, gy - gh * 1.1);
    ctx.quadraticCurveTo(sx, gy + gh * 0.4, sx + gw, gy - gh * 1.1);
    ctx.quadraticCurveTo(sx, gy + gh * 2.6, sx - gw, gy - gh * 1.1);
    ctx.closePath();
    ctx.fillStyle = VOID;
    ctx.fill();
    ctx.lineWidth = ow(0.6);
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const tx = sx - gw + k * gw * 2;
      const upper = gy - gh * 1.1 + (1 - (2 * k - 1) ** 2) * gh * 0.75;
      const lower = gy - gh * 1.1 + (1 - (2 * k - 1) ** 2) * gh * 1.85;
      const tw = gw / n;
      poly(ctx, [tx - tw * 0.8, upper, tx + tw * 0.8, upper, tx, upper + gh * 0.7], PALE, OUTLINE, ow(0.35));
      poly(ctx, [tx - tw * 0.8, lower, tx + tw * 0.8, lower, tx, lower - gh * 0.7], PALE, OUTLINE, ow(0.35));
    }
  } else if (o.mouth > 0.05) {
    // a distorted scream in the static
    const mh = sh * 0.26 * o.mouth;
    const pts: number[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const jag = 0.85 + hash(i * 5 + Math.floor(s.t * 14)) * 0.3;
      pts.push(sx + Math.cos(a) * sw * 0.2 * jag, y + sh * 0.2 + Math.sin(a) * mh * jag);
    }
    shape(ctx, pts, VOID, { under: null, w: 0.5 });
  }
}

/** The briefcase hanging from (x, y), its body extending along angle `a`; papers poke out of the lid. */
function briefcase(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, size: number, s: DrawState, ag: string | null, ak: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a - Math.PI / 2);
  if (ag) glow(ctx, 0, size * 0.6, size * 1.5, ag, 0.5 * ak + 0.2);
  // handle
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = ow(1.3);
  ctx.beginPath();
  ctx.arc(0, size * 0.16, size * 0.17, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = f(s, '#4a3424');
  ctx.lineWidth = ow(0.6);
  ctx.stroke();
  // an eviction notice escaping the lid
  shape(ctx, [-size * 0.42, size * 0.2, -size * 0.12, size * 0.06, -size * 0.04, size * 0.24, -size * 0.36, size * 0.36], f(s, '#efe6d2'), { under: null, w: 0.5 });
  // body
  shape(ctx, [-size * 0.62, size * 0.16, size * 0.62, size * 0.16, size * 0.62, size * 0.95, -size * 0.62, size * 0.95], f(s, '#3a2a1c'), { under: f(s, '#24180f'), uf: 0.4 });
  strokePts(ctx, [-size * 0.62, size * 0.34, size * 0.62, size * 0.34], OUTLINE, ow(0.5));
  // brass clasps and corners
  for (const k of [-1, 1]) {
    ctx.fillStyle = f(s, '#c9a85a');
    ctx.fillRect(k * size * 0.32 - size * 0.07, size * 0.27, size * 0.14, size * 0.12);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = ow(0.4);
    ctx.strokeRect(k * size * 0.32 - size * 0.07, size * 0.27, size * 0.14, size * 0.12);
  }
  ctx.restore();
}

/** A long spindly pale hand at (x, y) pointing along `a`: a palm and long fingers (claws when angry). */
function hand(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, r: number, clawed: boolean): void {
  oval(ctx, x, y, r * 0.085, r * 0.075, f(s, HAND), { w: 0.8 });
  claws(ctx, x + Math.cos(a) * r * 0.04, y + Math.sin(a) * r * 0.04, a, r * (clawed ? 0.4 : 0.3), r * (clawed ? 0.085 : 0.07), 4, 1.0, clawed ? 0.6 : 0.35, f(s, clawed ? '#b8aecb' : HAND));
}

// pose arrays: [caseArmAngle, caseReach, offArmAngle, offReach, lean, hatTilt, faceFlare, mouth]
const LL_REST = [1.3, 0.92, 1.9, 0.9, 0, 0, 0, 0];
const LL_RAISED = [-1.45, 0.98, 0.45, 0.78, -0.1, -0.06, 0.35, 0.3];
const LL_ROAR = [-0.5, 1, -2.65, 1, -0.14, -0.42, 1, 1];
const LL_STAGGER = [1.62, 0.85, 1.65, 0.85, 0.3, 0.38, 0, 0.2];

function drawSuited(ctx: CanvasRenderingContext2D, s: DrawState, angry: boolean): void {
  const r = begin(s);
  const [side, aL] = mirrored(s);
  const back = Math.sin(s.facing) < -0.6;
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const w = poseWeights(s);
  const struck = [aL + 0.55, 1, 2.3, 0.85, 0.15, 0.08, 0.5, 0.5];
  const p = blendPose(LL_REST, LL_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, LL_STAGGER, 1);
  mixPose(p, LL_ROAR, R);
  const [caseA, caseReach, offA, offReach, lean, hatTilt, flare, mouth] = p as [number, number, number, number, number, number, number, number];
  const G = angry ? 1.14 : 1;
  const sway = Math.sin(s.t * 1.6) * r * 0.015;
  const fyL = Math.sin(aL);

  // violet backlight so the black suit reads on the black platform
  glow(ctx, s.x, s.y - r * 0.6 * G, r * (angry ? 2.8 : 2.2), angry ? LILAC : VIOLET, (angry ? 0.42 : 0.32) + Math.sin(s.t * (angry ? 5 : 2)) * 0.06 + R * 0.2);
  groundShadow(ctx, s.x, s.y + r * 0.9, r * 0.75 * G, r * 0.24, 0.5);

  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y + r * 0.9);
  ctx.scale(side * G * (1 + s.squash * 0.04), G * (1 - s.squash * 0.06));
  ctx.translate(0, -r * 0.9);

  // ---- geometry (local, facing +x)
  const stride = Math.sin(s.t * 5) * r * 0.12 * s.moving;
  const hipY = 0.14 * r;
  const legs: [number, number, number, number][] = [
    [-0.13 * r, hipY, -0.2 * r - stride, 0.88 * r],
    [0.13 * r, hipY, 0.22 * r + stride, 0.88 * r],
  ];
  const tailSway = Math.sin(s.t * 2.4) * r * 0.03 + s.moving * r * 0.06;
  const tails = angry
    ? [-0.32 * r, -0.02 * r, -0.66 * r, 0.6 * r + tailSway, ...raggedEdge(-0.66 * r, 0.06 * r, 0.62 * r + tailSway * 0.5, 0.16 * r, 4, 11, s.t), 0.08 * r, 0.08 * r]
    : [-0.32 * r, -0.02 * r, -0.64 * r, 0.66 * r + tailSway, -0.44 * r, 0.58 * r + tailSway, -0.28 * r, 0.7 * r + tailSway * 0.6, -0.1 * r, 0.62 * r, 0.06 * r, 0.08 * r];
  const padY = angry ? -1.12 : -1.04;
  const padX = angry ? 0.8 : 0.72;
  const jacket = [
    -0.16 * r, -1.0 * r + sway,
    -padX * r, padY * r + sway,
    -0.52 * r, -0.74 * r + sway,
    -0.34 * r, -0.32 * r,
    -0.32 * r, 0.16 * r,
    0.32 * r, 0.16 * r,
    0.36 * r, -0.32 * r,
    0.52 * r, -0.74 * r + sway,
    padX * r, padY * r + sway,
    0.16 * r, -1.0 * r + sway,
  ];
  const headW = 0.6 * r;
  const headH = 0.5 * r;
  const headX = 0.03 * r + Math.cos(aL) * 0.04 * r;
  const headY = -1.36 * r + sway + fyL * 0.02 * r;
  const hatH = (angry ? 0.72 : 0.52) * r;
  const brimY = headY - headH * 0.5 - 0.02 * r;
  const hat = [
    -0.25 * r, 0,
    -0.27 * r, -hatH,
    angry ? -0.05 * r : 0.27 * r, angry ? -hatH * 0.92 : -hatH,
    ...(angry ? [0.08 * r, -hatH * 1.04, 0.28 * r, -hatH * 0.97] : []),
    0.25 * r, 0,
  ];
  const brim = [-0.4 * r, 0.02 * r, -0.36 * r, -0.06 * r, 0.36 * r, -0.06 * r, 0.42 * r, 0.02 * r, 0.3 * r, 0.06 * r, -0.3 * r, 0.06 * r];
  const fsX = 0.46 * r;
  const fsY = -0.86 * r + sway;
  const bsX = -0.46 * r;
  const bsY = -0.86 * r + sway;
  const armL = 0.52 * r;
  const cX = fsX + Math.cos(caseA) * armL * 2 * caseReach;
  const cY = fsY + Math.sin(caseA) * armL * 2 * caseReach;
  const oX = bsX + Math.cos(offA) * armL * 2 * offReach;
  const oY = bsY + Math.sin(offA) * armL * 2 * offReach;

  const upper = (): void => {
    ctx.translate(0, hipY);
    ctx.rotate(lean * 0.5);
    ctx.translate(0, -hipY);
  };

  // ---- rim pass
  ctx.save();
  for (const [x1, y1, x2, y2] of legs) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = withAlpha(LILAC, 0.42);
    ctx.lineWidth = r * 0.17 + ow(2.6);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  rim(ctx, tails, false);
  upper();
  rim(ctx, jacket, false);
  ctx.beginPath();
  ctx.roundRect(headX - headW / 2, headY - headH / 2, headW, headH, Math.min(headW, headH) * 0.22);
  ctx.strokeStyle = withAlpha(LILAC, 0.45);
  ctx.lineWidth = ow(2.1);
  ctx.stroke();
  ctx.save();
  ctx.translate(headX, brimY);
  ctx.rotate(hatTilt);
  rim(ctx, hat, false);
  rim(ctx, brim, true);
  ctx.restore();
  ctx.restore();

  // ---- coat tails and legs
  shape(ctx, tails, f(s, shade(SUIT, 0.85)), { under: f(s, VOID), uf: 0.3 });
  for (const [x1, y1, x2, y2] of legs) {
    taper(ctx, x1, y1, x2, y2, r * 0.17, r * 0.11, f(s, TROUSER));
    horn(ctx, x2 - 0.06 * r, y2 + 0.02 * r, 0.05, 0.24 * r, 0.1 * r, 0.25, f(s, '#0a0810'), 0.9);
  }

  ctx.save();
  upper();
  // the extra pair of arms (phase 1) from the shoulder blades; they spin with the Four-Arm Flurry
  if (angry) {
    const spin = s.pose === 'attack' ? s.poseT * TAU * 1.1 : 0;
    for (const k of [-1, 1]) {
      const base = aL + k * (Math.PI * 0.62) + spin + w[1] * 0.5 * k;
      const roarA = k > 0 ? 0.35 : Math.PI - 0.35;
      const a = lerp(base, roarA + (k > 0 ? 0 : TAU * Math.round((base - roarA) / TAU)), R);
      const sx = k * 0.34 * r;
      const sy = -0.66 * r + sway;
      const len = 0.62 * r;
      const hx = sx + Math.cos(a) * len * 1.9;
      const hy = sy + Math.sin(a) * len * 1.9;
      if (ag && s.pose === 'attack') trail(ctx, sx, sy, len * 2.05, len * 0.9, a - 1.3, a, ag, ak);
      rimArm(ctx, sx, sy, hx, hy, len, len, -k, r * 0.14);
      arm2(ctx, sx, sy, hx, hy, len, len, -k, r * 0.15, r * 0.12, r * 0.09, f(s, shade(SUIT, 0.9)));
      if (ag) glow(ctx, hx, hy, r * 0.5, ag, 0.5 * ak);
      hand(ctx, s, hx, hy, a, r, true);
    }
  }
  // the empty hand (behind)
  rimArm(ctx, bsX, bsY, oX, oY, armL, armL, 1, r * 0.15);
  arm2(ctx, bsX, bsY, oX, oY, armL, armL, 1, r * 0.16, r * 0.13, r * 0.1, f(s, shade(SUIT, 0.9)));
  if (ag && s.atk === 'void') glow(ctx, oX, oY, r * 0.55, ag, 0.6 * ak);
  hand(ctx, s, oX, oY, offA, r, angry);

  // the tailcoat
  shape(ctx, jacket, f(s, SUIT), { under: f(s, shade(SUIT, 0.6)), uf: 0.35, hi: s.flash ? null : withAlpha('#ffffff', 0.06) });
  if (back) {
    // from behind: the centre seam, a collar
    strokePts(ctx, [0, -0.98 * r + sway, 0, 0.12 * r], OUTLINE, ow(0.6));
    shape(ctx, [-0.18 * r, -1.02 * r + sway, 0.18 * r, -1.02 * r + sway, 0.12 * r, -0.92 * r + sway, -0.12 * r, -0.92 * r + sway], f(s, SUIT_HI), { under: null, w: 0.6 });
  } else {
    // lapels, shirt, violet tie, buttons, a pocket square
    shape(ctx, [-0.16 * r, -1.0 * r + sway, 0.16 * r, -1.0 * r + sway, 0.0, -0.44 * r], f(s, PALE), { under: null, w: 0.7 });
    shape(ctx, [-0.05 * r, -0.97 * r + sway, 0.05 * r, -0.97 * r + sway, 0.06 * r, -0.56 * r, 0, -0.47 * r, -0.06 * r, -0.56 * r], f(s, '#6a1fb0'), { under: null, w: 0.6 });
    shape(ctx, [-0.16 * r, -1.0 * r + sway, -0.3 * r, -0.86 * r + sway, -0.02 * r, -0.46 * r], f(s, SUIT_HI), { under: null, w: 0.7 });
    shape(ctx, [0.16 * r, -1.0 * r + sway, 0.3 * r, -0.86 * r + sway, 0.02 * r, -0.46 * r], f(s, SUIT_HI), { under: null, w: 0.7 });
    for (const by of [-0.3, -0.12]) oval(ctx, 0.03 * r, by * r, r * 0.035, r * 0.035, f(s, LILAC), { under: null, w: 0.5 });
    shape(ctx, [0.2 * r, -0.7 * r, 0.34 * r, -0.72 * r, 0.3 * r, -0.62 * r], f(s, LILAC), { under: null, w: 0.5 });
  }
  if (angry) {
    // the suit torn open on the void inside, ribs glowing
    const hole = [
      -0.34 * r, -0.8 * r, -0.2 * r, -0.72 * r, -0.12 * r, -0.84 * r, 0.02 * r, -0.7 * r, 0.12 * r, -0.78 * r, 0.2 * r, -0.6 * r, 0.12 * r, -0.48 * r, 0.22 * r, -0.34 * r,
      0.1 * r, -0.22 * r, 0.14 * r, -0.08 * r, -0.02 * r, -0.14 * r, -0.16 * r, -0.06 * r, -0.24 * r, -0.2 * r, -0.36 * r, -0.16 * r, -0.32 * r, -0.34 * r, -0.38 * r, -0.5 * r, -0.3 * r, -0.62 * r,
    ];
    shape(ctx, hole, VOID, { under: null, w: 0.8 });
    ctx.save();
    linePath(ctx, hole);
    ctx.clip();
    glow(ctx, -0.07 * r, -0.45 * r, r * 0.7, VIOLET, 0.95);
    ctx.lineCap = 'round';
    // a ribcage in the void: a spine and ribs curving out to both sides
    const bone = s.flash ? '#ffffff' : '#cdbbea';
    for (const [col, wd] of [[OUTLINE, r * 0.045 + ow(1)], [bone, r * 0.045]] as const) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.moveTo(-0.07 * r, -0.84 * r);
      ctx.lineTo(-0.07 * r, -0.08 * r);
      for (let i = 0; i < 4; i++) {
        const ry = (-0.72 + i * 0.15) * r;
        ctx.moveTo(-0.07 * r, ry);
        ctx.quadraticCurveTo(-0.3 * r, ry - 0.05 * r, -0.36 * r, ry + 0.12 * r);
        ctx.moveTo(-0.07 * r, ry);
        ctx.quadraticCurveTo(0.14 * r, ry - 0.05 * r, 0.2 * r, ry + 0.12 * r);
      }
      ctx.stroke();
    }
    ctx.restore();
    // shoulder spikes burst through the pads
    for (const k of [-1, 1]) horn(ctx, k * 0.62 * r, -1.02 * r + sway, -Math.PI / 2 + k * 0.5, 0.3 * r, 0.1 * r, k * 0.4, f(s, '#3a2f4c'), 0.8);
  }

  // the head: a thin neck, a TV set of static, a top hat
  strokePts(ctx, [0, -1.0 * r + sway, headX * 0.5, headY + headH * 0.4], OUTLINE, r * 0.09 + ow(1.6));
  strokePts(ctx, [0, -1.0 * r + sway, headX * 0.5, headY + headH * 0.4], f(s, HAND), r * 0.09);
  const eyeCol = angry ? (ag ?? LILAC) : ag && s.pose === 'windup' ? ag : null;
  tvHead(ctx, s, headX, headY, headW, headH, r, { back, flare: Math.max(flare * (R > 0 ? 1 : 0.5), angry ? 0.25 : 0), mouth, cracked: angry, look: Math.cos(aL), eyeCol });
  ctx.save();
  ctx.translate(headX, brimY);
  ctx.rotate(hatTilt);
  shape(ctx, hat, f(s, '#16121e'), { uf: 0.3, hi: s.flash ? null : withAlpha('#ffffff', 0.07) });
  shape(ctx, [-0.25 * r, -0.03 * r, 0.25 * r, -0.03 * r, 0.25 * r, -0.13 * r, -0.25 * r, -0.13 * r], f(s, VIOLET), { under: null, w: 0.7 });
  shape(ctx, brim, f(s, '#1e1828'), { smooth: true, under: null });
  ctx.restore();

  // the briefcase arm, in front
  if (ag && s.pose === 'attack') {
    const rr = armL * 2 + r * 0.25;
    trail(ctx, fsX, fsY, rr, r * 0.55, LL_RAISED[0]!, caseA, ag, ak);
  }
  rimArm(ctx, fsX, fsY, cX, cY, armL, armL, 1, r * 0.15);
  arm2(ctx, fsX, fsY, cX, cY, armL, armL, 1, r * 0.17, r * 0.13, r * 0.1, f(s, SUIT));
  briefcase(ctx, cX, cY, caseA, r * 0.46, s, ag, ak);
  hand(ctx, s, cX, cY, caseA, r * 0.8, angry);
  ctx.restore();
  ctx.restore();

  const hx = s.x + side * headX * G;
  const hy = s.y + r * 0.9 + (headY - r * 0.9) * G;
  if (R > 0) roarLines(ctx, hx, hy - r * 0.5, r * 0.85, R, s.t, LILAC);
  if (s.pose === 'stagger') dizzy(ctx, hx, hy - r * 0.95 * G, r * 0.75, s.t);
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

/** Point on a quadratic Bézier. */
function qpt(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, k: number): [number, number] {
  const u = 1 - k;
  return [u * u * x0 + 2 * u * k * cx + k * k * x1, u * u * y0 + 2 * u * k * cy + k * k * y1];
}

const HANDV = '#2a1a3e';

/** A ram horn from (x, y) sweeping outward to side k and curling up and back in, tapering, with ridges. */
function ramHorn(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, k: number, len: number, w: number): void {
  const n = 12;
  const left: number[] = [];
  const right: number[] = [];
  const mid: number[] = [];
  let px = x;
  let py = y;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = k > 0 ? -0.12 - t * 2.3 : Math.PI + 0.12 + t * 2.3;
    const hw = (w / 2) * (1 - t * 0.88);
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    left.push(px + nx * hw, py + ny * hw);
    right.push(px - nx * hw, py - ny * hw);
    mid.push(px, py, nx * hw, ny * hw);
    px += Math.cos(a) * (len / n);
    py += Math.sin(a) * (len / n) * 0.85;
  }
  const pts = [...left];
  for (let i = right.length - 2; i >= 0; i -= 2) pts.push(right[i]!, right[i + 1]!);
  rim(ctx, pts, false, 1);
  shape(ctx, pts, f(s, '#2a1c38'), { under: f(s, '#160c22'), uf: 0.45 });
  for (let i = 2; i < n; i += 2) {
    const j = i * 4;
    const cx = mid[j]!;
    const cy = mid[j + 1]!;
    strokePts(ctx, [cx - mid[j + 2]! * 0.9, cy - mid[j + 3]! * 0.9, cx + mid[j + 2]! * 0.9, cy + mid[j + 3]! * 0.9], withAlpha(LILAC, 0.55), ow(0.7));
  }
}

/** A colossal void forearm reaching up out of the void behind the face to the hand at (cx, cy). */
function forearm(ctx: CanvasRenderingContext2D, s: DrawState, cx: number, cy: number, side: number, hr: number, raise: number, ax: number, ay: number): void {
  const ex = cx + side * hr * lerp(1.0, 1.1, raise);
  const ey = cy + hr * lerp(-0.9, 1.4, raise);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = withAlpha(LILAC, 0.5);
  ctx.lineWidth = hr * 0.95 + ow(3);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ex, ey);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.restore();
  taper(ctx, ax, ay, ex, ey, hr * 1.1, hr * 0.95, f(s, '#150b22'));
  taper(ctx, ex, ey, cx, cy, hr * 0.95, hr * 0.8, f(s, '#1c1029'));
  // knobbly lilac knuckle-ridges along the arm
  for (let i = 1; i <= 2; i++) {
    const k = i / 3;
    const qx = ex + (cx - ex) * k;
    const qy = ey + (cy - ey) * k;
    glow(ctx, qx, qy, hr * 0.3, VIOLET, 0.5);
  }
}

/** One colossal clawed void hand gripping the platform (raise 0) or lifted with claws up (raise 1). */
function voidHand(ctx: CanvasRenderingContext2D, s: DrawState, cx: number, cy: number, side: number, hr: number, raise: number, ag: string | null, ak: number): void {
  const fa = lerp(Math.PI / 2 - side * 0.35, -Math.PI / 2 - side * 0.45, raise);
  if (ag) glow(ctx, cx + Math.cos(fa) * hr, cy + Math.sin(fa) * hr, hr * 1.8, ag, 0.5 * ak);
  // the palm (a broad knuckled back of the hand)
  const palm: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = fa + (i / 8) * TAU;
    const rr = hr * (i % 2 === 0 ? 0.62 : 0.55) * (Math.abs(Math.cos(a - fa)) > 0.7 && Math.cos(a - fa) > 0 ? 1.1 : 1);
    palm.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9);
  }
  rim(ctx, palm, true, 1);
  shape(ctx, palm, f(s, HANDV), { smooth: true, under: f(s, '#160c22') });
  // four long two-joint fingers and a thumb, curling over the edge, pale hooked claws
  for (let i = 0; i < 5; i++) {
    const thumb = i === 4;
    const off = thumb ? side * 1.35 : (i - 1.5) * 0.4;
    const a0 = fa + off;
    const bx = cx + Math.cos(a0) * hr * 0.42;
    const by = cy + Math.sin(a0) * hr * 0.42;
    const l1 = hr * (thumb ? 0.5 : 0.72 - Math.abs(i - 1.5) * 0.08);
    const curl = (thumb ? -0.5 * side : (i - 1.5) * 0.12) + (1 - raise) * 0.35 * Math.sign(Math.cos(fa)) + Math.sin(s.t * 2 + i) * 0.05;
    const mx = bx + Math.cos(a0) * l1;
    const my = by + Math.sin(a0) * l1;
    const a1 = a0 + curl;
    const ex = mx + Math.cos(a1) * l1 * 0.75;
    const ey = my + Math.sin(a1) * l1 * 0.75;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = withAlpha(LILAC, 0.45);
    ctx.lineWidth = hr * 0.26 + ow(2.6);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
    taper(ctx, bx, by, mx, my, hr * 0.3, hr * 0.24, f(s, HANDV));
    taper(ctx, mx, my, ex, ey, hr * 0.24, hr * 0.18, f(s, HANDV));
    oval(ctx, mx, my, hr * 0.06, hr * 0.06, withAlpha(LILAC, 0.6), { under: null, w: 0 });
    horn(ctx, ex, ey, a1 + curl * 0.4, hr * 0.45, hr * 0.17, curl * 0.8 + 0.3 * -side * (thumb ? -1 : 1), f(s, PALE), 0.8);
  }
}

function drawVoidFace(ctx: CanvasRenderingContext2D, s: DrawState): void {
  const r = begin(s);
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const rx = r * 2.1;
  const ry = r * 1.35;
  const baseOpen = s.pose === 'windup' ? Math.min(1, s.poseT / 0.8) : s.pose === 'attack' ? 1 - Math.min(1, s.poseT / 0.3) : 0.12;
  const open = lerp(baseOpen, 1.15, R);
  const breathe = Math.sin(s.t * 1.4) * 0.03;
  const shake = roarShake(s, r) * 2;
  const x = s.x + shake;
  const y = s.y;
  glow(ctx, x, y, rx * 1.8, VIOLET, 0.45 + Math.sin(s.t * 2.3) * 0.08 + R * 0.2);
  // void tendrils writhing round the rim: tapering, curling, deep violet with a few lilac ones
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + Math.sin(s.t * 0.7 + i) * 0.1;
    const len = (0.42 + 0.18 * Math.sin(s.t * 2 + i * 1.7) + hash(i) * 0.2 + R * 0.15) * rx;
    const bx = x + Math.cos(a) * rx * 0.88;
    const by = y + Math.sin(a) * ry * 0.88;
    const curl = Math.sin(s.t * 1.6 + i * 2.3) * 0.9;
    horn(ctx, bx, by, a, len, r * (0.34 - (i % 3) * 0.06), curl, i % 4 === 0 ? withAlpha(LILAC, 0.42) : '#1e0a30', i % 4 === 0 ? 0 : 0.6);
  }
  // ram horns sweeping out of the temples and curling up
  for (const k of [-1, 1]) ramHorn(ctx, s, x + k * rx * 0.62, y - ry * 0.5, k, rx * (1.15 + R * 0.1), ry * 0.56);
  // the giant forearms reach up out of the void behind the face
  const hr = r * 0.62;
  const raiseK = clamp01(R);
  const handAt = (k: number): [number, number] => [x + k * rx * lerp(1.16, 1.3, raiseK), y + lerp(ry * 0.55, -ry * 0.62, raiseK) + Math.sin(s.t * 1.3 + k) * r * 0.03];
  for (const k of [-1, 1]) {
    const [hx, hy] = handAt(k);
    forearm(ctx, s, hx, hy, k, hr, raiseK, x + k * rx * 0.7, y + ry * 0.05);
  }
  // the face itself: void, a faint static, a pale-lilac rim
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx * (1 + breathe) + ow(1.5), ry * (1 - breathe) + ow(1.5), 0, 0, TAU);
  ctx.strokeStyle = withAlpha(LILAC, 0.5);
  ctx.lineWidth = ow(3);
  ctx.stroke();
  ctx.restore();
  oval(ctx, x, y, rx * (1 + breathe), ry * (1 - breathe), f(s, VOID), { under: '#120a1e', outline: LILAC, w: 1 });
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.96, ry * 0.96, 0, 0, TAU);
  ctx.clip();
  staticFace(ctx, x, y, rx * 2, ry * 2, s.t, false, 0.16);
  ctx.restore();
  // furrowed brows and sunken sockets, eyes with glowing slit pupils looking where it looks
  const lx = Math.cos(s.facing) * r * 0.16;
  const ly = Math.sin(s.facing) * r * 0.12;
  const eyeGlow = ag ?? LILAC;
  for (const k of [-1, 1]) {
    const ex = x + k * rx * 0.42;
    const ey = y - ry * 0.26;
    shape(ctx, [ex - k * r * 0.62, ey - r * 0.12, ex + k * r * 0.55, ey - r * 0.5, ex + k * r * 0.62, ey + r * 0.05, ex + k * r * 0.1, ey + r * 0.4, ex - k * r * 0.5, ey + r * 0.22], '#1a0f28', { smooth: true, under: null, outline: withAlpha(LILAC, 0.7), w: 0.6 });
    const eh = r * 0.28 * (1 - open * 0.25) * (1 + R * 0.2);
    oval(ctx, ex, ey, r * 0.44, eh, f(s, PALE), { under: '#b9b0cc', rot: k * -0.18 });
    glow(ctx, ex + lx, ey + ly, r * (0.5 + ak * 0.4 + R * 0.3), eyeGlow, 0.8);
    oval(ctx, ex + lx, ey + ly, r * 0.17, Math.min(r * 0.17, eh * 0.9), eyeGlow, { under: shade(eyeGlow, 0.7), w: 0.7 });
    oval(ctx, ex + lx, ey + ly, r * 0.04, Math.min(r * 0.14, eh * 0.75), VOID, { under: null, w: 0 });
    // the brow: a heavy angled ridge slanting down to the middle
    shape(ctx, [ex - k * r * 0.7, ey - r * 0.36, ex + k * r * 0.6, ey - r * 0.62 - R * r * 0.12, ex + k * r * 0.5, ey - r * 0.4 - R * r * 0.1, ex - k * r * 0.62, ey - r * 0.16], f(s, '#241634'), { under: null, outline: OUTLINE, w: 0.8 });
  }
  // the maw: a wide grin with its corners raised; it opens on the windup (the bite)
  const mw = rx * 0.66;
  const my = y + ry * 0.36;
  const mh = ry * (0.1 + open * 0.42);
  const lcx = x - mw;
  const lcy = my - ry * 0.16;
  const rcx = x + mw;
  const topCy = my - mh * 0.7 + ry * 0.12;
  const botCy = my + mh * 1.5 + ry * 0.05;
  ctx.beginPath();
  ctx.moveTo(lcx, lcy);
  ctx.quadraticCurveTo(x, topCy, rcx, lcy);
  ctx.quadraticCurveTo(x, botCy, lcx, lcy);
  ctx.closePath();
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.lineWidth = ow(0.9);
  ctx.strokeStyle = LILAC;
  ctx.stroke();
  if (open > 0.2) {
    ctx.save();
    ctx.clip();
    glow(ctx, x, my + mh * 0.4, mw * 0.9, ag ?? VIOLET, 0.35 + open * 0.4 + ak * 0.3);
    ctx.restore();
  }
  const nT = 11;
  for (let i = 1; i < nT; i++) {
    const k = i / nT;
    const [tx, ty] = qpt(lcx, lcy, x, topCy, rcx, lcy, k);
    const [bx, by] = qpt(lcx, lcy, x, botCy, rcx, lcy, k);
    const th = r * 0.17 * (0.55 + open * 0.6) * (0.75 + hash(i) * 0.5) * Math.sin(k * Math.PI) ** 0.4;
    const tw = (mw / nT) * 0.85;
    poly(ctx, [tx - tw, ty - r * 0.02, tx + tw, ty - r * 0.02, tx, ty + th], f(s, PALE), OUTLINE, ow(0.5));
    poly(ctx, [bx - tw, by + r * 0.02, bx + tw, by + r * 0.02, bx, by - th], f(s, PALE), OUTLINE, ow(0.5));
  }
  // the giant top hat, floating above the head
  const float = Math.sin(s.t * 1.1) * ry * 0.05;
  const hatX = x + Math.sin(s.t * 0.6) * rx * 0.02;
  const hatY = y - ry * 1.08 + float - R * ry * 0.18;
  const hw = rx * 0.5;
  const hh = ry * 1.05;
  ctx.save();
  ctx.translate(hatX, hatY);
  ctx.rotate(Math.sin(s.t * 0.6) * 0.04 - R * 0.18);
  const crown = [-hw, 0, -hw * 1.06, -hh, hw * 1.06, -hh, hw, 0];
  rim(ctx, crown, false, 1.2);
  shape(ctx, crown, f(s, '#120d1a'), { uf: 0.3, hi: withAlpha('#ffffff', 0.05) });
  shape(ctx, [-hw, -ry * 0.04, hw, -ry * 0.04, hw * 1.01, -ry * 0.26, -hw * 1.01, -ry * 0.26], f(s, VIOLET), { under: null, w: 0.8 });
  // an eviction notice tucked in the band
  shape(ctx, [hw * 0.35, -ry * 0.12, hw * 0.72, -ry * 0.2, hw * 0.8, -ry * 0.62, hw * 0.42, -ry * 0.56], f(s, '#efe6d2'), { under: null, w: 0.6 });
  for (let i = 0; i < 3; i++) strokePts(ctx, [hw * 0.47, -ry * (0.26 + i * 0.1), hw * 0.7, -ry * (0.3 + i * 0.1)], OUTLINE, ow(0.4));
  const brim = [-rx * 0.82, ry * 0.05, -rx * 0.74, -ry * 0.08, rx * 0.74, -ry * 0.08, rx * 0.82, ry * 0.05, rx * 0.6, ry * 0.12, -rx * 0.6, ry * 0.12];
  rim(ctx, brim, true, 1.2);
  shape(ctx, brim, f(s, '#1a1424'), { smooth: true, under: null });
  ctx.restore();
  // the hands grip the platform's edge at either side (raised high when it roars)
  for (const k of [-1, 1]) {
    const [hx, hy] = handAt(k);
    voidHand(ctx, s, hx, hy, k, hr, raiseK, ag, ak);
  }
  if (R > 0) roarLines(ctx, x, y - ry * 0.4, rx * 0.9, R, s.t, LILAC);
  if (s.gaze !== undefined) sweepArrow(ctx, x, y, Math.max(rx, ry) * 1.25, s.gaze, s.t);
}

// ---------------------------------------------------------------- Unbound (phase 4)

const GOLD = '#ffd24a';
const GOLD_HI = '#fff3b0';
const PLATE = '#110d17';
const PLATE_HI = '#43375a';
const EVIL_EYE = '#ff2a3a';

const ease = (k: number): number => k * k * (3 - 2 * k);

/** The aura: gold and violet flame tongues licking up round him and a gold glow; k = strength (0–1.5). */
function unboundAura(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, k: number): void {
  if (k <= 0.01) return;
  glow(ctx, x, y - r * 0.9, r * (2.4 + k * 1.2), '#ffb52a', Math.min(0.5, (0.26 + Math.sin(t * 9) * 0.04) * k));
  glow(ctx, x, y - r * 0.9, r * 2.0, LILAC, 0.32 * Math.min(1, k));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= Math.min(1, k);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - 0.5) * 2.6;
    const bx = x + Math.sin(a) * r * 0.85;
    const by = y + r * 0.85 - Math.cos(a) * r * 0.25;
    const h = r * (1.7 + 1.3 * hash(i * 13 + Math.floor(t * 12))) * Math.min(1.4, k) * (1 - Math.abs(a) * 0.18);
    flame(ctx, bx, by, h, r * 0.6, t * 1.6, i * 7.3, i % 3 === 0 ? LILAC : '#ffb52a', GOLD_HI, 0);
  }
  ctx.restore();
}

/** Crackling arcs round him, re-rolled 16 times a second (deterministic: no Math.random). */
function crackle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, k: number): void {
  if (k <= 0.2) return;
  const frame = Math.floor(t * 16);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 4; i++) {
    if (hash(frame * 3 + i * 17) > 0.35 + 0.3 * Math.min(1, k)) continue;
    const a0 = hash(frame * 5 + i) * TAU;
    let px = x + Math.cos(a0) * r * 0.5;
    let py = y - r * 0.9 + Math.sin(a0) * r * 0.9;
    const pts = [px, py];
    for (let j = 1; j <= 4; j++) {
      const aa = a0 + (hash(frame * 11 + i * 7 + j) - 0.5) * 1.6;
      px += Math.cos(aa) * r * 0.45;
      py += Math.sin(aa) * r * 0.45;
      pts.push(px, py);
    }
    const [outer, inner] = i % 2 ? [GOLD, GOLD_HI] : [LILAC, '#f0e0ff'];
    for (const [c, wd] of [[outer, r * 0.16], [inner, r * 0.06]] as const) {
      ctx.strokeStyle = withAlpha(c, 0.9);
      ctx.lineWidth = wd;
      linePath(ctx, pts);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A round-capped stroke with an outline (arms, the blade). */
function limb(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, wd: number, fill: string, lw: number): void {
  ctx.lineCap = 'round';
  for (const [c, w] of [[OUTLINE, wd + lw], [fill, wd]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * The small form. `armour` 0–1 turns the torn suit and TV head into spiked black plate and a horned helm with
 * burning eyes (the top hat falls away); `lie` 0–1 lays him on his back (knocked down).
 */
function drawSmall(ctx: CanvasRenderingContext2D, s: DrawState, armour: number, lie: number): void {
  const r = s.r;
  const lw = Math.max(1, r * 0.09);
  const [side, aL] = mirrored(s);
  const back = Math.sin(s.facing) < -0.6 && lie < 0.5;
  const w = poseWeights(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  // blade arm angle (local, facing +x): low and forward at rest, raised over the shoulder, struck through
  const bladeA = blendPose([0.9], [-2.0], [aL + 0.7], w)[0]!;
  const offA = 1.9 - w[1] * 0.6;
  const stride = Math.sin(s.t * 14) * r * 0.16 * s.moving * (1 - lie);
  const bob = lie > 0 ? 0 : Math.sin(s.t * 3) * r * 0.03;
  const col = (a: string, b: string): string => f(s, mix(a, b, armour));
  const fillPoly = (pts: number[], fill: string): void => {
    linePath(ctx, pts);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = lw;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  };

  groundShadow(ctx, s.x, s.y + r * 0.9, r * (0.7 + lie * 0.7), r * 0.22, 0.5);
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.9);
  // knocked down: turned onto his back about the feet, along the floor
  if (lie > 0) {
    ctx.translate(-side * r * 1.1 * lie, -r * 0.35 * lie);
    ctx.rotate(-side * (Math.PI / 2) * lie);
  }
  ctx.scale(side * (1 + s.squash * 0.05), 1 - s.squash * 0.08);

  // the cape (his coat tails, ragged)
  const capeSway = Math.sin(s.t * 3) * r * 0.05 + s.moving * r * 0.12;
  fillPoly([-0.42 * r, -1.5 * r + bob, -0.62 * r - capeSway, -0.1 * r, ...raggedEdge(-0.62 * r - capeSway, -0.05 * r, -0.05 * r, 0.14 * r, 4, 5, s.t), -0.1 * r, -1.2 * r + bob], col(SUIT, '#1a0d24'));
  // the empty hand, behind (clawed gauntlet once armoured)
  const bsX = -0.42 * r;
  const bsY = -1.42 * r + bob;
  const oX = bsX + Math.cos(offA) * r * 0.8;
  const oY = bsY + Math.sin(offA) * r * 0.8;
  limb(ctx, bsX, bsY, oX, oY, r * 0.22, col(SUIT, PLATE), lw);
  if (armour > 0.3) claws(ctx, oX, oY, offA, r * 0.3 * armour, r * 0.08, 3, 0.9, 0.3, f(s, '#2a2236'));
  // legs: greaves with a spike at each knee
  for (const [hx, fx] of [[-0.16, -0.22], [0.16, 0.24]] as const) {
    const st = fx > 0 ? stride : -stride;
    taper(ctx, hx * r, -0.78 * r, fx * r + st, 0, r * 0.26, r * 0.2, col(TROUSER, PLATE));
    if (armour > 0.2) horn(ctx, (hx + fx) * 0.5 * r + st * 0.5, -0.42 * r, -0.3, 0.26 * r * armour, 0.1 * r, 0.3, f(s, PLATE_HI), 0.6);
  }
  // the torso: the suit, or a cuirass with a burning void core
  fillPoly([-0.5 * r, -1.58 * r + bob, 0.5 * r, -1.58 * r + bob, 0.34 * r, -0.78 * r, -0.34 * r, -0.78 * r], col(SUIT, PLATE));
  if (!back) {
    if (armour < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - armour;
      fillPoly([-0.12 * r, -1.58 * r + bob, 0.12 * r, -1.58 * r + bob, 0, -1.05 * r], f(s, PALE));
      fillPoly([-0.04 * r, -1.55 * r + bob, 0.04 * r, -1.55 * r + bob, 0.05 * r, -1.2 * r, -0.05 * r, -1.2 * r], f(s, '#6a1fb0'));
      ctx.restore();
    }
    if (armour > 0) {
      ctx.save();
      ctx.globalAlpha *= armour;
      ctx.strokeStyle = PLATE_HI;
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.moveTo(-0.36 * r, -1.36 * r + bob);
      ctx.lineTo(0, -1.12 * r);
      ctx.lineTo(0.36 * r, -1.36 * r + bob);
      ctx.moveTo(-0.28 * r, -0.98 * r);
      ctx.lineTo(0.28 * r, -0.98 * r);
      ctx.stroke();
      glow(ctx, 0, -1.2 * r, r * 0.55, ag ?? GOLD, 0.8);
      oval(ctx, 0, -1.2 * r, r * 0.1, r * 0.1, f(s, GOLD_HI), { under: null, w: 0.3 });
      ctx.restore();
    }
  }
  // pauldrons, spiked
  for (const k of [-1, 1]) {
    oval(ctx, k * 0.5 * r, -1.55 * r + bob, r * 0.24, r * 0.18, col(SUIT_HI, '#241c30'), { under: null, w: 0.4 });
    if (armour > 0) {
      horn(ctx, k * 0.56 * r, -1.66 * r + bob, -Math.PI / 2 + k * 0.6, 0.5 * r * armour, 0.14 * r, k * 0.35, f(s, PLATE_HI), 0.6);
      horn(ctx, k * 0.4 * r, -1.68 * r + bob, -Math.PI / 2 + k * 0.25, 0.32 * r * armour, 0.1 * r, k * 0.2, f(s, PLATE_HI), 0.6);
    }
  }
  // the head: the TV set, or a horned helm with burning slits
  const hX = 0.04 * r;
  const hY = -1.98 * r + bob;
  const hW = 0.66 * r;
  const hH = 0.54 * r;
  ctx.beginPath();
  ctx.roundRect(hX - hW / 2, hY - hH / 2, hW, hH, hW * 0.22);
  ctx.fillStyle = col(BEZEL, PLATE);
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (!back) {
    if (armour < 0.6) staticFace(ctx, hX + 0.02 * r, hY, hW * 0.72, hH * 0.66, s.t, s.flash, 1 - armour / 0.6);
    else {
      ctx.beginPath();
      ctx.roundRect(hX - hW * 0.36, hY - hH * 0.3, hW * 0.72, hH * 0.6, hW * 0.12);
      ctx.fillStyle = '#05030a';
      ctx.fill();
    }
    if (armour > 0.3) {
      const eye = ag ?? (armour > 0.8 ? EVIL_EYE : GOLD);
      for (const k of [-1, 1]) glowEye(ctx, hX + k * hW * 0.18 + 0.03 * r, hY - hH * 0.02, r * 0.1, r * 0.035, eye, k * -0.25, armour);
    }
  }
  if (armour > 0) for (const k of [-1, 0, 1]) horn(ctx, hX + k * hW * 0.32, hY - hH * 0.42, -Math.PI / 2 + k * 0.45, (k === 0 ? 0.5 : 0.42) * r * armour, 0.12 * r, k * 0.4, f(s, PLATE_HI), 0.6);
  // the top hat, tumbling away as the armour forms
  if (armour < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - armour;
    ctx.translate(hX + armour * r * 0.6, hY - hH * 0.5 - armour * r * 0.5);
    ctx.rotate(armour * 0.9);
    fillPoly([-0.24 * r, 0, -0.26 * r, -0.5 * r, 0.26 * r, -0.5 * r, 0.24 * r, 0], f(s, '#16121e'));
    fillPoly([-0.38 * r, 0.04 * r, 0.38 * r, 0.04 * r, 0.3 * r, -0.04 * r, -0.3 * r, -0.04 * r], f(s, '#1e1828'));
    ctx.restore();
  }
  // the blade arm, in front: a long void blade, gold-edged
  const fsX = 0.42 * r;
  const fsY = -1.42 * r + bob;
  const hx = fsX + Math.cos(bladeA) * r * 0.85;
  const hy = fsY + Math.sin(bladeA) * r * 0.85;
  if (ag && s.pose === 'attack') trail(ctx, fsX, fsY, r * 2.2, r * 0.9, -2.0, bladeA, ag, ak);
  limb(ctx, fsX, fsY, hx, hy, r * 0.22, col(SUIT, PLATE), lw);
  const bl = r * (0.6 + 1.0 * armour);
  const tx = hx + Math.cos(bladeA) * bl;
  const ty = hy + Math.sin(bladeA) * bl;
  if (armour > 0) glow(ctx, (hx + tx) / 2, (hy + ty) / 2, bl * 0.7, ag ?? GOLD, 0.45 * armour + 0.4 * ak);
  limb(ctx, hx, hy, tx, ty, r * 0.16, f(s, VOID), lw);
  limb(ctx, hx, hy, tx, ty, r * 0.05, f(s, mix(LILAC, GOLD_HI, armour)), 0);
  oval(ctx, hx, hy, r * 0.12, r * 0.12, f(s, armour > 0.5 ? '#2a2236' : HAND), { under: null, w: 0.4 });
  ctx.restore();
}

/** The face's pieces flying apart as it is knocked down (the first moments of the transformation). */
function faceShards(ctx: CanvasRenderingContext2D, x: number, y: number, k: number): void {
  if (k >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - k;
  for (let i = 0; i < 12; i++) {
    const a = hash(i * 3.7) * TAU;
    const d = 40 + ease(k) * (160 + hash(i) * 220);
    const sx = x + Math.cos(a) * d;
    const sy = y + Math.sin(a) * d * 0.7 + k * k * 80;
    const sz = 8 + hash(i * 9) * 14;
    poly(ctx, [sx, sy - sz, sx + sz * 0.7, sy, sx, sy + sz * 0.6, sx - sz * 0.6, sy], i % 3 ? '#1a1424' : LILAC, OUTLINE, 1.5);
  }
  ctx.restore();
}

function drawUnbound(ctx: CanvasRenderingContext2D, s: DrawState): void {
  const r = s.r;
  const k = s.trans;
  if (k === undefined) {
    // the duel: full plate, a steady blaze that flares on his windups
    const aura = 1 + (s.pose === 'windup' ? 0.35 : 0) + Math.sin(s.t * 6) * 0.08;
    unboundAura(ctx, s.x, s.y, r, s.t, aura);
    drawSmall(ctx, s, 1, 0);
    crackle(ctx, s.x, s.y, r, s.t, aura);
    if (s.pose === 'stagger') dizzy(ctx, s.x, s.y - r * 2.6, r * 0.9, s.t);
    return;
  }
  // the transformation: knocked down (0–0.32), getting up (–0.5), the power gathering (–0.68), the scream as the
  // armour forms (–0.9), the blaze settling (–1)
  const lie = k < 0.32 ? 1 : k < 0.5 ? 1 - ease((k - 0.32) / 0.18) : 0;
  const armour = ease(Math.max(0, Math.min(1, (k - 0.6) / 0.3)));
  const aura = k < 0.42 ? 0 : Math.min(1, (k - 0.42) / 0.26) * (k > 0.68 && k < 0.85 ? 1.5 : 1);
  const screaming = k > 0.68 && k < 0.85;
  faceShards(ctx, s.x, s.y - r, Math.min(1, k / 0.3));
  unboundAura(ctx, s.x, s.y, r, s.t, aura);
  const squash = k > 0.45 && k < 0.66 ? Math.sin(((k - 0.45) / 0.21) * Math.PI) * -0.6 : 0;
  drawSmall(ctx, { ...s, squash, pose: 'idle', moving: 0, flash: screaming && Math.floor(s.t * 20) % 4 === 0 }, armour, lie);
  crackle(ctx, s.x, s.y, r, s.t, aura);
  if (k < 0.32) dizzy(ctx, s.x - r * 0.4, s.y + r * 0.2, r * 0.9, s.t);
  if (screaming) roarLines(ctx, s.x, s.y - r * 2, r * 2.2, 1, s.t, GOLD);
}

registerDraw('boss_landlord', (ctx, s) => {
  if (s.phase >= 3) drawUnbound(ctx, s);
  else if (s.phase >= 2) drawVoidFace(ctx, s);
  else drawSuited(ctx, s, s.phase >= 1);
});
