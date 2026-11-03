// Shape kit for the zone 1–4 enemy art (Mossy Crypt, Fungal Caverns, Drowned Sewers, Hollow Forest):
// smooth bezier bodies with a shaded underside, tapered capsule limbs with two-bone IK, claws, teeth, tapered
// tails, a skull, and the element colouring rules (ART_AUDIO §2; D81: an elemental enemy reads as its type's
// colour, and the striking part of an attack glows in the attack's type colour).
import { ELEMENTS } from '../../game/elements';
import { OUTLINE, OUTLINE_W, glow, mix, withAlpha } from './parts';
import type { DrawState } from './registry';

export const TAU = Math.PI * 2;

// ---------- light direction (the darker underside sits away from it) ----------

let LX = 0;
let LY = -1;

/** Call right after rotating the canvas by `a` so undersides stay on the screen-bottom side; light(0) resets. */
export function light(a: number): void {
  LX = -Math.sin(a);
  LY = -Math.cos(a);
}

// ---------- paths ----------

/**
 * A smooth closed path through the edge midpoints of a control polygon (flat [x0, y0, x1, y1, …], scaled by k).
 * A point listed twice in a row becomes a sharp corner (horn tips, claws, ragged hems).
 */
export function smoothPath(ctx: CanvasRenderingContext2D, p: readonly number[], k = 1, ox = 0, oy = 0): void {
  const n = p.length >> 1;
  ctx.beginPath();
  if (n < 3) return;
  const lx = p[(n - 1) * 2]!;
  const ly = p[(n - 1) * 2 + 1]!;
  ctx.moveTo(ox + ((lx + p[0]!) / 2) * k, oy + ((ly + p[1]!) / 2) * k);
  for (let i = 0; i < n; i++) {
    const j = i + 1 < n ? i + 1 : 0;
    const cx = p[i * 2]!;
    const cy = p[i * 2 + 1]!;
    ctx.quadraticCurveTo(ox + cx * k, oy + cy * k, ox + ((cx + p[j * 2]!) / 2) * k, oy + ((cy + p[j * 2 + 1]!) / 2) * k);
  }
  ctx.closePath();
}

/** Straight-edged closed path (scaled by k). */
export function polyPath(ctx: CanvasRenderingContext2D, p: readonly number[], k = 1, ox = 0, oy = 0): void {
  ctx.beginPath();
  ctx.moveTo(ox + p[0]! * k, oy + p[1]! * k);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(ox + p[i]! * k, oy + p[i + 1]! * k);
  ctx.closePath();
}

function stroke(ctx: CanvasRenderingContext2D, w: number, color = OUTLINE): void {
  if (w <= 0) return;
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * The outline is stroked BEFORE the fill and wider, so it sits outside the part: thin limbs, tails and claws keep
 * their colour at small sizes, and every part that overlaps another gets a dark seam where it covers it.
 */
function rim(ctx: CanvasRenderingContext2D, w: number): void {
  if (w <= 0) return;
  ctx.lineJoin = 'round';
  ctx.lineWidth = w + 1;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

/**
 * A smooth body part: flat fill, a darker underside crescent (the same outline shifted toward the light), and the
 * thick dark outline. `shift` is in the same units as the points (scaled by k). White while the entity flashes.
 */
export function shape(ctx: CanvasRenderingContext2D, s: DrawState, p: readonly number[], k: number, fill: string, under: string | null = null, shift = 0.16, w = OUTLINE_W, sharp = false): void {
  const path = sharp ? polyPath : smoothPath;
  path(ctx, p, k);
  rim(ctx, w);
  if (s.flash) {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else if (under && shift) {
    ctx.fillStyle = under;
    ctx.fill();
    ctx.save();
    ctx.clip();
    path(ctx, p, k, LX * shift * k, LY * shift * k);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

/** Flat filled polygon with outline (no underside), flash-aware. */
export function flat(ctx: CanvasRenderingContext2D, s: DrawState, p: readonly number[], k: number, fill: string, w = OUTLINE_W, smooth = false): void {
  if (smooth) smoothPath(ctx, p, k);
  else polyPath(ctx, p, k);
  rim(ctx, w);
  ctx.fillStyle = s.flash ? '#ffffff' : fill;
  ctx.fill();
}

/** An unoutlined detail fill (markings, shading, moss patches); skipped while flashing. */
export function mark(ctx: CanvasRenderingContext2D, s: DrawState, p: readonly number[], k: number, fill: string, smooth = true): void {
  if (s.flash) return;
  if (smooth) smoothPath(ctx, p, k);
  else polyPath(ctx, p, k);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** An ellipse part with outline (eyes, knobs, pustules). */
export function oval(ctx: CanvasRenderingContext2D, s: DrawState | null, x: number, y: number, rx: number, ry: number, fill: string, w = 2, rot = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  rim(ctx, w);
  ctx.fillStyle = s?.flash ? '#ffffff' : fill;
  ctx.fill();
}

/** A plain dot (no outline). */
export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.3, rad), 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Open stroke with a dark outline under it (a smooth curve through x0,y0 → control → x1,y1). */
export function cord(ctx: CanvasRenderingContext2D, s: DrawState, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, color: string, outlineW = OUTLINE_W): void {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  if (outlineW > 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = w + outlineW * 2 - 2;
    ctx.stroke();
  }
  ctx.strokeStyle = s.flash ? '#ffffff' : color;
  ctx.lineWidth = w;
  ctx.stroke();
}

/** A thin unoutlined line (seams, cracks, strings, whiskers). */
export function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w: number, color: string): void {
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// ---------- limbs ----------

/** Scratch output of ik(): elbow (J[0], J[1]) and the reachable hand position (J[2], J[3]). */
export const J = [0, 0, 0, 0];

/** Two-bone IK from a shoulder to a hand target; bend +1 / −1 picks which way the elbow points. */
export function ik(x0: number, y0: number, x2: number, y2: number, l1: number, l2: number, bend: number): void {
  const dx = x2 - x0;
  const dy = y2 - y0;
  const d0 = Math.hypot(dx, dy) || 0.001;
  const d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d0));
  const a = Math.atan2(dy, dx);
  const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const A = Math.acos(Math.max(-1, Math.min(1, c)));
  J[0] = x0 + Math.cos(a + bend * A) * l1;
  J[1] = y0 + Math.sin(a + bend * A) * l1;
  J[2] = x0 + Math.cos(a) * d;
  J[3] = y0 + Math.sin(a) * d;
}

/** A tapered capsule from (x0, y0) radius r0 to (x1, y1) radius r1, filled and outlined. */
export function capsule(ctx: CanvasRenderingContext2D, s: DrawState, x0: number, y0: number, x1: number, y1: number, r0: number, r1: number, fill: string, w = OUTLINE_W): void {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.arc(x0, y0, Math.max(0.3, r0), a + Math.PI / 2, a - Math.PI / 2);
  ctx.arc(x1, y1, Math.max(0.3, r1), a - Math.PI / 2, a + Math.PI / 2);
  ctx.closePath();
  rim(ctx, w);
  ctx.fillStyle = s.flash ? '#ffffff' : fill;
  ctx.fill();
}

/**
 * An articulated limb: shoulder → (IK elbow) → hand target, upper radius r0, elbow r1, wrist r2.
 * Leaves the elbow in J[0..1] and the hand in J[2..3].
 */
export function arm(ctx: CanvasRenderingContext2D, s: DrawState, x0: number, y0: number, x2: number, y2: number, l1: number, l2: number, bend: number, r0: number, r1: number, r2: number, fill: string, w = OUTLINE_W): void {
  ik(x0, y0, x2, y2, l1, l2, bend);
  const ex = J[0]!;
  const ey = J[1]!;
  const hx = J[2]!;
  const hy = J[3]!;
  capsule(ctx, s, x0, y0, ex, ey, r0, r1, fill, w);
  capsule(ctx, s, ex, ey, hx, hy, r1 * 0.95, r2, fill, w);
  J[0] = ex;
  J[1] = ey;
  J[2] = hx;
  J[3] = hy;
}

/** A recurve bow held at grip (gx, gy), aimed along a, string drawn back by pull 0…1; leaves the nock in J[0..1]. */
export function bow(ctx: CanvasRenderingContext2D, s: DrawState, gx: number, gy: number, a: number, R: number, pull: number, wood: string, w: number, string = '#efe8d8'): void {
  const c = Math.cos(a);
  const sn = Math.sin(a);
  const px = (x: number, y: number): number => gx + c * x - sn * y;
  const py = (x: number, y: number): number => gy + sn * x + c * y;
  const nock = -0.3 * R - pull * 0.62 * R;
  // string first so the limbs sit over it
  ctx.strokeStyle = string;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px(-0.32 * R, -R), py(-0.32 * R, -R));
  ctx.lineTo(px(nock, 0), py(nock, 0));
  ctx.lineTo(px(-0.32 * R, R), py(-0.32 * R, R));
  ctx.stroke();
  cord(ctx, s, px(-0.32 * R, -R), py(-0.32 * R, -R), px(0.5 * R, 0), py(0.5 * R, 0), px(-0.32 * R, R), py(-0.32 * R, R), w, wood, 2);
  cord(ctx, s, px(-0.32 * R, -R), py(-0.32 * R, -R), px(-0.3 * R, -1.08 * R), py(-0.3 * R, -1.08 * R), px(-0.14 * R, -1.14 * R), py(-0.14 * R, -1.14 * R), w * 0.8, wood, 2);
  cord(ctx, s, px(-0.32 * R, R), py(-0.32 * R, R), px(-0.3 * R, 1.08 * R), py(-0.3 * R, 1.08 * R), px(-0.14 * R, 1.14 * R), py(-0.14 * R, 1.14 * R), w * 0.8, wood, 2);
  J[0] = px(nock, 0);
  J[1] = py(nock, 0);
}

/** Fan of curved talons from (x, y) pointing along angle a. */
export function claws(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, len: number, n: number, spread: number, fill: string, w = 1.5): void {
  const bw = Math.max(0.8, len * 0.22);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const aa = a + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
    const c = Math.cos(aa);
    const sn = Math.sin(aa);
    const bx = x + c * len * 0.15;
    const by = y + sn * len * 0.15;
    const tx = x + c * len;
    const ty = y + sn * len;
    // curl the tip slightly toward the fan's centre line
    const mx = x + c * len * 0.6 - sn * len * 0.18;
    const my = y + sn * len * 0.6 + c * len * 0.18;
    ctx.moveTo(bx - sn * bw, by + c * bw);
    ctx.quadraticCurveTo(mx, my, tx, ty);
    ctx.quadraticCurveTo(mx - sn * bw * 1.2, my + c * bw * 1.2, bx + sn * bw, by - c * bw);
    ctx.closePath();
  }
  rim(ctx, w);
  ctx.fillStyle = s.flash ? '#ffffff' : fill;
  ctx.fill();
}

/** A row of n triangular teeth along (x0, y0) → (x1, y1), pointing to the left of that direction by h. */
export function teeth(ctx: CanvasRenderingContext2D, s: DrawState, x0: number, y0: number, x1: number, y1: number, n: number, h: number, fill = '#f4f0e0', w = 1): void {
  const dx = (x1 - x0) / n;
  const dy = (y1 - y0) / n;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (dy / len) * h;
  const ny = (-dx / len) * h;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ax = x0 + dx * i;
    const ay = y0 + dy * i;
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + dx * 0.5 + nx, ay + dy * 0.5 + ny);
    ctx.lineTo(ax + dx, ay + dy);
  }
  rim(ctx, w);
  ctx.fillStyle = s.flash ? '#ffffff' : fill;
  ctx.fill();
}

/** A tapered tail/tentacle along a spine polyline (flat [x0, y0, …]) from width w0 to w1 (0 = pointed tip). */
export function taper(ctx: CanvasRenderingContext2D, s: DrawState, spine: readonly number[], w0: number, w1: number, fill: string, under: string | null = null, w = OUTLINE_W): void {
  const n = spine.length >> 1;
  if (n < 2) return;
  const out: number[] = new Array<number>(n * 4);
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(n - 1, i + 1);
    const dx = spine[i1 * 2]! - spine[i0 * 2]!;
    const dy = spine[i1 * 2 + 1]! - spine[i0 * 2 + 1]!;
    const l = Math.hypot(dx, dy) || 1;
    const hw = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    const nx = (-dy / l) * hw;
    const ny = (dx / l) * hw;
    const x = spine[i * 2]!;
    const y = spine[i * 2 + 1]!;
    out[i * 2] = x + nx;
    out[i * 2 + 1] = y + ny;
    out[(2 * n - 1 - i) * 2] = x - nx;
    out[(2 * n - 1 - i) * 2 + 1] = y - ny;
  }
  // a zero end width puts both tip points on the spine end: listed twice in a row, it draws as a sharp tip
  shape(ctx, s, out, 1, fill, under, under ? Math.max(w0, 2) * 0.35 : 0, w);
}

// ---------- heads ----------

/**
 * A skull centred at (x, y), size k (≈ its height). look −1…1 slides the face sideways; back hides the face.
 * jaw 0…1 opens the mandible; eye is the socket glow colour (null for empty sockets).
 */
export function skull(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, k: number, look: number, back: boolean, bone: string, eye: string | null, jaw = 0): void {
  const lk = look * k * 0.12;
  // mandible first (under the cranium), dropping as the jaw opens
  const jy = y + k * (0.16 + jaw * 0.18);
  ctx.save();
  ctx.translate(x + lk * 0.6, jy);
  shape(ctx, s, SKULL_JAW, k, bone, mix(bone, '#3a3428', 0.4), 0.08, 2);
  if (!back && jaw > 0.15 && !s.flash) teeth(ctx, s, -k * 0.2, -k * 0.06, k * 0.2, -k * 0.06, 4, k * 0.08, mix(bone, '#ffffff', 0.4), 0.8);
  ctx.restore();
  if (!back && jaw > 0.05) dot(ctx, x + lk, y + k * 0.22, k * 0.14 * jaw + k * 0.06, '#140c10');
  ctx.save();
  ctx.translate(x, y);
  shape(ctx, s, SKULL_CRANIUM, k, bone, mix(bone, '#3a3428', 0.45), 0.1, 2.5);
  if (!s.flash) {
    if (back) {
      line(ctx, -k * 0.05, -k * 0.62, k * 0.08, -k * 0.3, 1, withAlpha(OUTLINE, 0.5));
    } else {
      // brow ridge, sockets, nasal cavity, teeth line
      ctx.fillStyle = '#140c10';
      ctx.beginPath();
      ctx.ellipse(lk - k * 0.19, -k * 0.12, k * 0.15, k * 0.13, 0.15, 0, TAU);
      ctx.moveTo(lk + k * 0.34, -k * 0.12);
      ctx.ellipse(lk + k * 0.19, -k * 0.12, k * 0.15, k * 0.13, -0.15, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(lk, k * 0.02);
      ctx.lineTo(lk - k * 0.06, k * 0.13);
      ctx.lineTo(lk + k * 0.06, k * 0.13);
      ctx.closePath();
      ctx.fill();
      teeth(ctx, s, lk - k * 0.17, k * 0.17, lk + k * 0.17, k * 0.17, 4, -k * 0.09, mix(bone, '#ffffff', 0.35), 0.8);
      if (eye) {
        dot(ctx, lk - k * 0.17 + look * k * 0.03, -k * 0.11, Math.max(0.9, k * 0.055), eye);
        dot(ctx, lk + k * 0.21 + look * k * 0.03, -k * 0.11, Math.max(0.9, k * 0.055), eye);
      }
    }
  }
  ctx.restore();
}

const SKULL_CRANIUM = [-0.44, 0.05, -0.47, -0.42, -0.2, -0.68, 0.2, -0.68, 0.47, -0.42, 0.44, 0.05, 0.3, 0.22, 0.1, 0.24, -0.1, 0.24, -0.3, 0.22];
const SKULL_JAW = [-0.3, -0.08, 0.3, -0.08, 0.28, 0.12, 0.12, 0.22, -0.12, 0.22, -0.28, 0.12];

// ---------- facing frame for upright (3/4 view) bodies ----------

export interface Facing {
  fx: number;
  fy: number;
  /** +1 facing right, −1 facing left: upright bodies are drawn facing right inside ctx.scale(sd, 1) */
  sd: number;
  /** the facing angle inside the mirrored frame (−π/2 … π/2) */
  aim: number;
  ax: number;
  ay: number;
  /** facing away from the camera (up the screen): draw the back of the head */
  back: boolean;
  /** facing toward the camera */
  front: boolean;
}

export function facing(s: DrawState): Facing {
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const sd = fx < -0.02 ? -1 : 1;
  const aim = Math.atan2(fy, fx * sd);
  return { fx, fy, sd, aim, ax: Math.cos(aim), ay: Math.sin(aim), back: fy < -0.62, front: fy > 0.62 };
}

/**
 * Enter the local frame of an upright body: origin at the hitbox centre (plus bob), x toward the facing side,
 * squash-and-stretch pivoting on the feet, a wobble while staggered. Caller wraps in save/restore.
 */
export function upright(ctx: CanvasRenderingContext2D, s: DrawState, f: Facing, r: number, lift = 0): void {
  const feet = r * 0.72;
  ctx.translate(s.x, s.y + feet + lift);
  if (s.pose === 'stagger') ctx.rotate(-f.sd * (0.14 + Math.sin(s.t * 24) * 0.05));
  ctx.scale(f.sd * (1 - s.squash * 0.07), 1 + s.squash * 0.09);
  ctx.translate(0, -feet);
}

/** Clip to a smooth shape (for overlays such as cloth, plates and markings); the caller restores. */
export function inside(ctx: CanvasRenderingContext2D, p: readonly number[], k: number): void {
  ctx.save();
  smoothPath(ctx, p, k);
  ctx.clip();
}

/** Re-stroke a smooth shape's outline (after overlays were drawn inside it). */
export function outline(ctx: CanvasRenderingContext2D, p: readonly number[], k: number, w = OUTLINE_W): void {
  smoothPath(ctx, p, k);
  stroke(ctx, w);
}

/** Idle/walk bob in px. */
export function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

// ---------- element colouring ----------

/** 0…1: how hot the striking part is (rises through the windup, full on release, fades in recovery). */
export function striking(s: DrawState): number {
  if (!s.atk) return 0;
  if (s.pose === 'windup') return 0.35 + 0.65 * Math.min(1, s.poseT / 0.45);
  if (s.pose === 'attack') return 1;
  if (s.pose === 'recover') return Math.max(0, 1 - s.poseT / 0.3);
  return 0;
}

/** Glow colour of the attack being made now (falls back to the enemy's own type). */
export function atkGlow(s: DrawState): string {
  return ELEMENTS[s.atk ?? s.elem].glow;
}

/** Main colour of the attack being made now. */
export function atkMain(s: DrawState): string {
  return ELEMENTS[s.atk ?? s.elem].main;
}

/** Blend a striking part's colour toward the attack colour by how hot it is. */
export function heat(s: DrawState, base: string, k = 0.75): string {
  const h = striking(s);
  return h > 0 ? mix(base, atkGlow(s), Math.min(1, h * k)) : base;
}

/** A soft glow in the attack colour at a striking part (claw, blade, mouth, casting hand). */
export function hot(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, rad: number, k = 1): void {
  const h = striking(s) * k;
  if (h > 0.03 && !s.flash) glow(ctx, x, y, rad, atkGlow(s), Math.min(1, h));
}

/** Natural colour for Physical enemies, the type's bright glow for elemental ones (eyes, runes, orbs, motes). */
export function elemGlow(s: DrawState, natural: string): string {
  return s.elem === 'physical' ? natural : ELEMENTS[s.elem].glow;
}

/** Natural colour for Physical enemies, a strong blend toward the type's main colour for elemental ones (cloth, hide). */
export function elemTint(s: DrawState, natural: string, k = 0.7): string {
  return s.elem === 'physical' ? natural : mix(natural, ELEMENTS[s.elem].main, k);
}

/**
 * A swing trail: an additive crescent swept around (cx, cy) at radius rad from angle a0 to a1, in the attack
 * colour. Drawn only on the release and early recovery.
 */
export function swoosh(ctx: CanvasRenderingContext2D, s: DrawState, cx: number, cy: number, rad: number, a0: number, a1: number, w: number): void {
  if (s.pose !== 'attack' && s.pose !== 'recover') return;
  const h = striking(s);
  if (h < 0.05 || s.flash) return;
  const col = atkGlow(s);
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const lo = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  ctx.strokeStyle = withAlpha(col, 0.28 * h);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, lo, hi);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(col, 0.6 * h);
  ctx.lineWidth = Math.max(1.5, w * 0.4);
  ctx.beginPath();
  ctx.arc(cx, cy, rad, lo + (hi - lo) * 0.25, hi);
  ctx.stroke();
  ctx.globalCompositeOperation = prevOp;
}

/** A straight additive streak in the attack colour (thrusts, lunges, spit). */
export function streak(ctx: CanvasRenderingContext2D, s: DrawState, x0: number, y0: number, x1: number, y1: number, w: number): void {
  const h = striking(s);
  if (h < 0.05 || s.flash) return;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  line(ctx, x0, y0, x1, y1, w, withAlpha(atkGlow(s), 0.3 * h));
  line(ctx, x0 + (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.3, x1, y1, Math.max(1.2, w * 0.35), withAlpha(atkGlow(s), 0.7 * h));
  ctx.globalCompositeOperation = prevOp;
}
