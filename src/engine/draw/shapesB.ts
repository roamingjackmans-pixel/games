// Shape helpers for the zone 5–8 rosters and the special enemies (forge, reliquary, citadel, abyss, special).
// Silhouettes are built from polygons and smooth bezier outlines instead of ellipses, in the house style
// (ART_AUDIO §2): a thick dark outline, a flat fill with a darker underside, small specular dots, glows.
// The underside is a hard-stop linear gradient, so a two-tone part costs one fill and no clip.
// Everything here is 3/4 top-down: "forward" on screen is (fx, fy·k) with the vertical foreshortened.
import { ELEMENTS } from '../../game/elements';
import { OUTLINE, OUTLINE_W, glow, shade } from './parts';
import type { DrawState } from './registry';

export const TAU = Math.PI * 2;

/** Facing frame: forward on screen, the creature's right-hand side, and which way it reads. */
export interface Frame {
  fx: number;
  fy: number;
  /** the creature's own right-hand side on screen */
  px: number;
  py: number;
  /** +1 facing screen-right, −1 facing screen-left */
  dir: number;
  /** facing away from the camera: we see its back, not its face */
  back: boolean;
}

export function frame(s: DrawState): Frame {
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  return { fx, fy, px: -fy, py: fx, dir: fx >= 0 ? 1 : -1, back: fy < -0.35 };
}

/** Idle/walk bob. */
export function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** True while winding up or swinging. */
export function striking(s: DrawState): boolean {
  return s.pose === 'windup' || s.pose === 'attack';
}

/** The glow colour of the attack being made right now (its damage type), or null when not attacking. */
export function hot(s: DrawState): string | null {
  if (!s.atk || s.pose === 'idle' || s.pose === 'stagger') return null;
  return ELEMENTS[s.atk].glow;
}

/** The enemy's own element look. */
export function el(s: DrawState): (typeof ELEMENTS)['physical'] {
  return ELEMENTS[s.elem];
}

/** A point sideways from (x, y) along the creature's right (side = ±1), vertical foreshortened by k. */
export function sideP(f: Frame, x: number, y: number, w: number, side: number, k = 0.45): [number, number] {
  return [x + f.px * w * side, y + f.py * w * side * k];
}

/** A point forward from (x, y) along the facing, vertical foreshortened by k. */
export function fwdP(f: Frame, x: number, y: number, d: number, k = 0.55): [number, number] {
  return [x + f.fx * d, y + f.fy * d * k];
}

/** Whether the arm on `side` sits behind the torso (drawn first). */
export function armBehind(f: Frame, side: number): boolean {
  return f.back || f.py * side < -0.3;
}

/**
 * Fill and outline the current path with a flat colour and a darker underside below `cutY` (in the current
 * transform). Flashing turns both tones white. `cutY` null = no underside; `w` 0 = no outline.
 */
export function paint(ctx: CanvasRenderingContext2D, s: DrawState, fill: string, cutY: number | null, w = OUTLINE_W, under?: string): void {
  if (s.flash) ctx.fillStyle = '#ffffff';
  else if (cutY === null) ctx.fillStyle = fill;
  else {
    const g = ctx.createLinearGradient(0, cutY - 0.5, 0, cutY + 0.5);
    g.addColorStop(0, fill);
    g.addColorStop(1, under ?? shade(fill, 0.7));
    ctx.fillStyle = g;
  }
  ctx.fill();
  if (w > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = w;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

/** Build a closed polygon path from a flat [x0, y0, x1, y1, …] list. Returns [minY, maxY]. */
export function pathPoly(ctx: CanvasRenderingContext2D, pts: number[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 2) {
    const y = pts[i + 1]!;
    if (i === 0) ctx.moveTo(pts[0]!, y);
    else ctx.lineTo(pts[i]!, y);
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  ctx.closePath();
  return [lo, hi];
}

/**
 * Build a smooth closed path through a point list (each point is a control point; the curve runs through the
 * midpoints). Repeat a point to make a sharp corner there. Returns [minY, maxY] of the control points.
 */
export function pathSmooth(ctx: CanvasRenderingContext2D, pts: number[]): [number, number] {
  const n = pts.length / 2;
  let lo = Infinity;
  let hi = -Infinity;
  ctx.beginPath();
  const lx = pts[(n - 1) * 2]!;
  const ly = pts[(n - 1) * 2 + 1]!;
  ctx.moveTo((lx + pts[0]!) / 2, (ly + pts[1]!) / 2);
  for (let i = 0; i < n; i++) {
    const x = pts[i * 2]!;
    const y = pts[i * 2 + 1]!;
    const j = ((i + 1) % n) * 2;
    ctx.quadraticCurveTo(x, y, (x + pts[j]!) / 2, (y + pts[j + 1]!) / 2);
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  ctx.closePath();
  return [lo, hi];
}

/** A two-tone polygon. `cut` is where the underside starts, as a fraction of its height (≥ 1 = none). */
export function poly2(ctx: CanvasRenderingContext2D, s: DrawState, pts: number[], fill: string, cut = 0.62, w = OUTLINE_W, under?: string): void {
  const [lo, hi] = pathPoly(ctx, pts);
  paint(ctx, s, fill, cut >= 1 ? null : lo + (hi - lo) * cut, w, under);
}

/** A two-tone smooth shape (see pathSmooth). */
export function smooth2(ctx: CanvasRenderingContext2D, s: DrawState, pts: number[], fill: string, cut = 0.62, w = OUTLINE_W, under?: string): void {
  const [lo, hi] = pathSmooth(ctx, pts);
  paint(ctx, s, fill, cut >= 1 ? null : lo + (hi - lo) * cut, w, under);
}

/** A two-tone ellipse (for eyeballs, joints, orbs — use sparingly; prefer shapes). */
export function ell(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, rx: number, ry: number, fill: string, cut = 0.6, w = OUTLINE_W, rot = 0, under?: string): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  paint(ctx, s, fill, cut >= 1 ? null : y - ry + ry * 2 * cut, w, under);
}

/** Elbow/knee position for a two-bone limb from A to B (segment lengths l1, l2); bend ±1 picks the side. */
export function ik(ax: number, ay: number, bx: number, by: number, l1: number, l2: number, bend: number): [number, number] {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.max(0.001, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01));
  const a = Math.atan2(dy, dx);
  const c = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const t = a + Math.acos(c) * bend;
  return [ax + Math.cos(t) * l1, ay + Math.sin(t) * l1];
}

/** An outlined stick (flash-aware). */
export function stick(ctx: CanvasRenderingContext2D, s: DrawState, x1: number, y1: number, x2: number, y2: number, w: number, color: string, ow = OUTLINE_W): void {
  ctx.lineCap = 'round';
  if (ow > 0) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = w + ow * 2 - 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.strokeStyle = s.flash ? '#ffffff' : color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** An articulated limb A → joint B → C, tapering from w1 (upper) to w2 (lower). */
export function limb3(ctx: CanvasRenderingContext2D, s: DrawState, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, w1: number, w2: number, color: string, ow = OUTLINE_W): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w1 + ow * 2 - 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.lineWidth = w2 + ow * 2 - 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  const c = s.flash ? '#ffffff' : color;
  ctx.strokeStyle = c;
  ctx.lineWidth = w1;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.strokeStyle = s.flash ? '#ffffff' : shade(color, 0.85);
  ctx.lineWidth = w2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.stroke();
}

/** A straight tapered piece (tail, spike, blade, finger) from a round base of half-width w1 to w2 at the tip. */
export function taper(ctx: CanvasRenderingContext2D, s: DrawState, x1: number, y1: number, x2: number, y2: number, w1: number, w2: number, fill: string, ow = 2): void {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  ctx.beginPath();
  ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
  ctx.lineTo(x2 - nx * w2, y2 - ny * w2);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.arc(x1, y1, w1, a - Math.PI / 2, a + Math.PI / 2, true);
  ctx.closePath();
  paint(ctx, s, fill, null, ow);
}

/**
 * A curved, pointed horn/talon/tentacle: from a base at (x, y) of half-width w toward angle a, length len;
 * curl bends it sideways (fraction of len, sign picks the side).
 */
export function horn(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, len: number, w: number, curl: number, fill: string, ow = 2, tipW = 0): void {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const nx = -sa;
  const ny = ca;
  const tx = x + ca * len + nx * curl * len * 0.55;
  const ty = y + sa * len + ny * curl * len * 0.55;
  const mx = x + ca * len * 0.55 + nx * curl * len * 0.45;
  const my = y + sa * len * 0.55 + ny * curl * len * 0.45;
  ctx.beginPath();
  ctx.moveTo(x + nx * w, y + ny * w);
  ctx.quadraticCurveTo(mx + nx * w * 0.6, my + ny * w * 0.6, tx + nx * tipW, ty + ny * tipW);
  if (tipW > 0) ctx.lineTo(tx - nx * tipW, ty - ny * tipW);
  ctx.quadraticCurveTo(mx - nx * w * 0.6, my - ny * w * 0.6, x - nx * w, y - ny * w);
  ctx.closePath();
  // thin pieces keep a thinner outline so their colour still shows
  paint(ctx, s, fill, null, Math.min(ow, w * 0.6));
}

/** A fan of n curved talons from (x, y) around angle a (stroked, so even tiny claws keep their colour). */
export function claws(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, a: number, len: number, n: number, spread: number, fill: string, w = 1.8, curl = 0.25): void {
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? OUTLINE : s.flash ? '#ffffff' : fill;
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0 : i / (n - 1) - 0.5;
      const ai = a + k * spread * 2;
      const l = len * (1 - Math.abs(k) * 0.35);
      const c = curl * (k >= 0 ? 1 : -1);
      const nx = -Math.sin(ai);
      const ny = Math.cos(ai);
      const tx = x + Math.cos(ai) * l + nx * c * l * 0.5;
      const ty = y + Math.sin(ai) * l + ny * c * l * 0.5;
      const mx = x + Math.cos(ai) * l * 0.55 + nx * c * l * 0.35;
      const my = y + Math.sin(ai) * l * 0.55 + ny * c * l * 0.35;
      ctx.lineWidth = pass === 0 ? w * 1.4 + 2 : w * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(mx, my, (mx + tx) / 2, (my + ty) / 2);
      ctx.stroke();
      ctx.lineWidth = pass === 0 ? w * 0.7 + 2 : w * 0.7;
      ctx.beginPath();
      ctx.moveTo((mx + tx) / 2, (my + ty) / 2);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  }
}

/** A ragged hem: points from (x1, y) back to (x0, y) with n tatters of depth d (animated by t). */
export function ragHem(out: number[], x0: number, x1: number, y: number, n: number, d: number, t: number, ph = 0): number[] {
  for (let i = 0; i <= n * 2; i++) {
    const k = i / (n * 2);
    const x = x1 + (x0 - x1) * k;
    const deep = i % 2 === 0 ? d * (0.75 + 0.25 * Math.sin(i * 2.3 + ph)) : -d * 0.15;
    out.push(x, y + deep + (i % 2 === 0 ? Math.sin(t * 6 + i + ph) * d * 0.25 : 0));
  }
  return out;
}

/** A glowing eye: a soft glow and a bright dot. */
export function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, glowA = 0.6): void {
  if (glowA > 0) glow(ctx, x, y, r * 4, color, glowA);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** Two glowing eyes on a face at (x, y), spread along the creature's sides; hidden from behind. */
export function eyes2(ctx: CanvasRenderingContext2D, f: Frame, x: number, y: number, spread: number, r: number, color: string, glowA = 0.5): void {
  if (f.back) return;
  const ox = f.px * spread;
  const oy = f.py * spread * 0.35;
  eye(ctx, x + ox, y + oy, r, color, glowA);
  eye(ctx, x - ox, y - oy, r, color, glowA);
}

/** Slanted angry eye slits (inner ends lower), for helms and skull sockets; hidden from behind. */
export function slits(ctx: CanvasRenderingContext2D, f: Frame, x: number, y: number, spread: number, w: number, h: number, color: string, glowA = 0.5): void {
  if (f.back) return;
  for (const side of [1, -1]) {
    const cx = x + f.px * spread * side;
    const cy = y + f.py * spread * side * 0.35;
    const ix = f.px * side > 0 ? -1 : 1; // towards the face centre
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - ix * w * 0.5, cy - h * 0.5);
    ctx.lineTo(cx + ix * w * 0.5, cy - h * 0.05);
    ctx.lineTo(cx + ix * w * 0.5, cy + h * 0.5);
    ctx.lineTo(cx - ix * w * 0.5, cy + h * 0.3);
    ctx.closePath();
    ctx.fill();
    if (glowA > 0) glow(ctx, cx, cy, w * 2.2, color, glowA);
  }
}

/** A bent-limb joint: the midpoint of A→B pushed toward (ox, oy) so the two halves (each len/2) meet. */
export function bend(ax: number, ay: number, bx: number, by: number, len: number, ox: number, oy: number): [number, number] {
  const d = Math.hypot(bx - ax, by - ay);
  const k = Math.sqrt(Math.max(0, (len * len) / 4 - (d * d) / 4));
  const ol = Math.hypot(ox, oy) || 1;
  return [(ax + bx) / 2 + (ox / ol) * k, (ay + by) / 2 + (oy / ol) * k];
}

/** 3/4 projection of a creature-local point: a forward, b to its right, z up; (x, gy) is its ground centre. */
export function p3(f: Frame, x: number, gy: number, a: number, b: number, z: number): [number, number] {
  return [x + f.fx * a + f.px * b, gy + (f.fy * a + f.py * b) * 0.5 - z];
}

/**
 * A quadruped/crawler body: a smooth capsule around the screen segment from the rump H (radius rh) to the chest C
 * (radius rc), humped along the back. Works at every facing (seen end-on it reads as a rounded trunk).
 */
export function capsule(ctx: CanvasRenderingContext2D, s: DrawState, hx: number, hy: number, rh: number, cx: number, cy: number, rc: number, fill: string, hump = 0.15, cut = 0.6, ow = OUTLINE_W, under?: string): void {
  let tx = cx - hx;
  let ty = cy - hy;
  const tl = Math.hypot(tx, ty);
  if (tl < 0.001) {
    tx = 1;
    ty = 0;
  } else {
    tx /= tl;
    ty /= tl;
  }
  let nx = ty;
  let ny = -tx;
  if (ny > 0 || (ny === 0 && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }
  const mx = (hx + cx) / 2;
  const my = (hy + cy) / 2;
  const rm = (rh + rc) / 2;
  const k = 1.12;
  const pts = [
    cx + tx * rc * k, cy + ty * rc * k,
    cx + nx * rc * k + tx * rc * 0.35, cy + ny * rc * k + ty * rc * 0.35,
    mx + nx * rm * (1 + hump) * k, my + ny * rm * (1 + hump) * k,
    hx + nx * rh * k - tx * rh * 0.35, hy + ny * rh * k - ty * rh * 0.35,
    hx - tx * rh * k, hy - ty * rh * k,
    hx - nx * rh * 0.95 * k - tx * rh * 0.25, hy - ny * rh * 0.95 * k - ty * rh * 0.25,
    mx - nx * rm * 0.78 * k, my - ny * rm * 0.78 * k,
    cx - nx * rc * k + tx * rc * 0.25, cy - ny * rc * k + ty * rc * 0.25,
  ];
  smooth2(ctx, s, pts, fill, cut, ow, under);
}

export interface CanineLook {
  fur: string;
  muzzle: string;
  mouth: string;
  eye: string;
  teeth: string;
  /** swept-back horns instead of ears */
  horn?: string;
  ear?: string;
}

/**
 * A dog/wolf head at (hx, hy): a side profile when facing sideways (snout, jaw that gapes 0…1, eye, ears or
 * horns), a front view when facing the camera, and the back of the skull when facing away.
 */
export function canineHead(ctx: CanvasRenderingContext2D, s: DrawState, f: Frame, hx: number, hy: number, r: number, L: CanineLook, gape: number): void {
  ctx.save();
  ctx.translate(hx, hy);
  const side = Math.abs(f.fx) >= 0.45;
  const ears = (near: boolean, sx: number): void => {
    if (L.horn) horn(ctx, s, sx - 0.02 * r, -0.26 * r, -Math.PI * 0.82, r * (near ? 0.62 : 0.5), r * 0.1, 0.5, near ? L.horn : shade(L.horn, 0.75), 2);
    else if (L.ear) poly2(ctx, s, [sx - 0.16 * r, -0.2 * r, sx - 0.12 * r, -0.62 * r, sx + 0.08 * r, -0.26 * r], near ? L.ear : shade(L.ear, 0.75), 2, 2);
  };
  if (side) {
    ctx.scale(f.dir, 1);
    ctx.rotate(f.fy * 0.45);
    ears(false, 0.1 * r);
    // lower jaw, hinged under the eye
    ctx.save();
    ctx.translate(-0.08 * r, 0.12 * r);
    ctx.rotate(gape * 0.55);
    poly2(ctx, s, [0, -0.04 * r, 0.62 * r, 0.02 * r, 0.6 * r, 0.12 * r, 0.12 * r, 0.2 * r], shade(L.fur, 0.8), 2, 2);
    if (gape > 0.15) {
      ctx.fillStyle = L.teeth;
      for (let i = 0; i < 3; i++) {
        const tx = 0.2 * r + i * 0.14 * r;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx + 0.05 * r, -0.1 * r);
        ctx.lineTo(tx + 0.09 * r, 0);
        ctx.fill();
      }
    }
    ctx.restore();
    if (gape > 0.15) {
      // the open mouth's inside
      ctx.fillStyle = L.mouth;
      ctx.beginPath();
      ctx.moveTo(-0.05 * r, 0.12 * r);
      ctx.lineTo(0.62 * r, 0.1 * r);
      ctx.lineTo(0.5 * r, 0.12 * r + gape * 0.3 * r);
      ctx.closePath();
      ctx.fill();
    }
    smooth2(ctx, s, [-0.34 * r, 0.06 * r, -0.32 * r, -0.26 * r, -0.04 * r, -0.38 * r, 0.2 * r, -0.26 * r, 0.52 * r, -0.16 * r, 0.76 * r, -0.08 * r, 0.78 * r, 0.06 * r, 0.76 * r, 0.12 * r, 0.42 * r, 0.14 * r, 0.04 * r, 0.2 * r, -0.22 * r, 0.24 * r], L.fur, 0.62, OUTLINE_W, undefined);
    // muzzle band and nose
    sheen(ctx, [0.22 * r, -0.2 * r, 0.52 * r, -0.12 * r, 0.72 * r, -0.06 * r], L.muzzle, 1.6, 0.8);
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(0.75 * r, -0.02 * r, 0.07 * r, 0, TAU);
    ctx.fill();
    if (gape > 0.15) {
      ctx.fillStyle = L.teeth;
      ctx.beginPath();
      ctx.moveTo(0.55 * r, 0.12 * r);
      ctx.lineTo(0.6 * r, 0.26 * r);
      ctx.lineTo(0.65 * r, 0.12 * r);
      ctx.fill();
    }
    eye(ctx, 0.14 * r, -0.16 * r, Math.max(1.3, 0.07 * r), L.eye, 0.55);
    ears(true, -0.04 * r);
  } else if (!f.back) {
    ears(false, -0.2 * r);
    ctx.scale(-1, 1);
    ears(false, -0.2 * r);
    ctx.scale(-1, 1);
    smooth2(ctx, s, [-0.38 * r, -0.04 * r, -0.32 * r, -0.34 * r, 0, -0.4 * r, 0.32 * r, -0.34 * r, 0.38 * r, -0.04 * r, 0.24 * r, 0.22 * r, 0, 0.3 * r, -0.24 * r, 0.22 * r], L.fur, 0.6);
    // jaw opens downward
    if (gape > 0.15) {
      poly2(ctx, s, [-0.16 * r, 0.2 * r, 0.16 * r, 0.2 * r, 0.1 * r, (0.34 + gape * 0.22) * r, -0.1 * r, (0.34 + gape * 0.22) * r], L.mouth, 2, 1.5);
      ctx.fillStyle = L.teeth;
      for (const sx of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx * 0.13 * r, 0.2 * r);
        ctx.lineTo(sx * 0.09 * r, 0.33 * r);
        ctx.lineTo(sx * 0.05 * r, 0.2 * r);
        ctx.fill();
      }
    }
    smooth2(ctx, s, [-0.15 * r, 0.04 * r, 0, -0.04 * r, 0.15 * r, 0.04 * r, 0.13 * r, 0.24 * r, 0, 0.28 * r, -0.13 * r, 0.24 * r], L.muzzle, 0.65, 2);
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(-0.07 * r, 0.02 * r);
    ctx.lineTo(0.07 * r, 0.02 * r);
    ctx.lineTo(0, 0.09 * r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0.09 * r);
    ctx.lineTo(0, 0.16 * r);
    ctx.moveTo(-0.08 * r, 0.19 * r);
    ctx.quadraticCurveTo(0, 0.14 * r, 0.08 * r, 0.19 * r);
    ctx.stroke();
    const er = Math.max(1.3, 0.07 * r);
    eye(ctx, -0.17 * r, -0.12 * r, er, L.eye, 0.5);
    eye(ctx, 0.17 * r, -0.12 * r, er, L.eye, 0.5);
    ears(true, -0.2 * r);
    ctx.scale(-1, 1);
    ears(true, -0.2 * r);
  } else {
    smooth2(ctx, s, [-0.36 * r, 0.04 * r, -0.3 * r, -0.3 * r, 0, -0.36 * r, 0.3 * r, -0.3 * r, 0.36 * r, 0.04 * r, 0, 0.22 * r], L.fur, 0.55);
    ears(true, -0.2 * r);
    ctx.scale(-1, 1);
    ears(true, -0.2 * r);
  }
  ctx.restore();
}

/** An element-coloured swing trail: a fading crescent around (x, y) from angle a0 to a1. */
export function swingTrail(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a0: number, a1: number, w: number, color: string, alpha = 0.8): void {
  const prevOp = ctx.globalCompositeOperation;
  const prevA = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  const ccw = a1 < a0;
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const s0 = a0 + ((a1 - a0) * i) / steps;
    const s1 = a0 + ((a1 - a0) * (i + 1)) / steps;
    ctx.globalAlpha = prevA * alpha * ((i + 1) / steps);
    ctx.lineWidth = w * (0.45 + (0.55 * (i + 1)) / steps);
    ctx.beginPath();
    ctx.arc(x, y, r, s0, s1, ccw);
    ctx.stroke();
  }
  ctx.globalAlpha = prevA;
  ctx.globalCompositeOperation = prevOp;
}

/** A glowing streak (thrust, lunge, beam) from (x1, y1) to (x2, y2). */
export function streak(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string, alpha = 0.7): void {
  const prevOp = ctx.globalCompositeOperation;
  const prevA = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = prevA * alpha * 0.45;
  ctx.lineWidth = w * 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = prevA * alpha;
  ctx.lineWidth = w * 0.7;
  ctx.stroke();
  ctx.globalAlpha = prevA;
  ctx.globalCompositeOperation = prevOp;
}

/** A four-point sparkle (magic glints, stars). */
export function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot = 0): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * TAU;
    const rr = i % 2 === 0 ? r : r * 0.28;
    if (i === 0) ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/** A licking teardrop flame pointing up from (x, y), height h. */
export function flame(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, t: number, outer: string, inner: string, ow = 0): void {
  const w = h * 0.42;
  const lick = Math.sin(t * 14) * h * 0.14;
  ctx.beginPath();
  ctx.moveTo(x + lick, y - h);
  ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.35, x + w * 0.6, y);
  ctx.quadraticCurveTo(x, y + h * 0.2, x - w * 0.6, y);
  ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.35, x + lick, y - h);
  ctx.closePath();
  ctx.fillStyle = outer;
  ctx.fill();
  if (ow > 0) {
    ctx.lineWidth = ow;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + lick * 0.6, y - h * 0.62);
  ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.2, x, y - 1);
  ctx.quadraticCurveTo(x - w * 0.5, y - h * 0.2, x + lick * 0.6, y - h * 0.62);
  ctx.closePath();
  ctx.fillStyle = inner;
  ctx.fill();
}

/** A soft drop shadow ellipse (lighter than parts.shadow, for floaters). */
export function floorShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, alpha = 0.25): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** A thin light highlight line (rim light / edge sheen), not outlined. */
export function sheen(ctx: CanvasRenderingContext2D, pts: number[], color: string, w = 1.5, alpha = 0.7): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.stroke();
  ctx.restore();
}

/**
 * Two legs under a biped: hips beside (x, hipY), feet on the ground line gy, stepping along the facing while
 * moving. Knees bend forward. Drawn far leg first; call before the torso.
 */
export function legs(ctx: CanvasRenderingContext2D, s: DrawState, f: Frame, x: number, hipY: number, gy: number, hw: number, w: number, color: string, boot: string, stride: number, speed = 10, bootLen = 1): void {
  const order = f.py >= 0 ? [-1, 1] : [1, -1];
  for (const side of order) {
    const ph = s.t * speed + (side > 0 ? 0 : Math.PI);
    const step = Math.sin(ph) * stride * s.moving;
    const lift = Math.max(0, Math.cos(ph)) * stride * 0.35 * s.moving;
    const [hx, hy] = sideP(f, x, hipY, hw, side, 0.4);
    const [bx, by] = sideP(f, x, gy, hw * 1.1, side, 0.4);
    const fx = bx + f.fx * step;
    const fy = by + f.fy * step * 0.5 - lift;
    const len = Math.hypot(fx - hx, fy - hy);
    const [kx, ky] = ik(hx, hy, fx, fy, len * 0.56, len * 0.56, -f.dir);
    const c = side * f.py < 0 ? shade(color, 0.8) : color;
    limb3(ctx, s, hx, hy, kx, ky, fx, fy, w, w * 0.85, c);
    // boot pointing along the facing
    const ba = Math.atan2(f.fy * 0.5, f.fx);
    const bl = w * (0.75 + Math.abs(f.fx) * 0.45) * bootLen;
    ctx.beginPath();
    ctx.ellipse(fx + Math.cos(ba) * bl * 0.35, fy + 1, bl, w * 0.62, ba, 0, TAU);
    paint(ctx, s, boot, null, 2);
  }
}

export interface HoundLook extends CanineLook {
  body: string;
  leg: string;
  legFar: string;
  paw: string;
}

export interface HoundDeco {
  tail: string;
  /** decoration along the back: i = 0 (withers) … 3 (rump), at the back line point (x, y) */
  spine?: (x: number, y: number, i: number) => void;
  /** decoration at the tail tip, pointing along angle a */
  tailTip?: (x: number, y: number, a: number) => void;
  /** markings on the near flank; pt projects creature-local (forward, right, up) points */
  flank?: (pt: (a: number, b: number, z: number) => [number, number], near: number) => void;
  /** the glow colour of the open mouth */
  mouthGlow: string;
  /** bite streak colour while attacking (the attack's type), or null */
  hot: string | null;
}

/**
 * A 3/4 quadruped hound: capsule trunk along the facing, four jointed legs that gallop while moving, a tail and
 * a canine head (profile, front or back view). Crouches on windup and stretches on the lunge.
 */
export function hound(ctx: CanvasRenderingContext2D, s: DrawState, f: Frame, r: number, look: HoundLook, deco: HoundDeco): void {
  const gy = s.y + r * 0.62;
  const run = s.t * 15;
  const mv = 0.25 + s.moving * 0.75;
  const crouch = s.pose === 'windup' ? 0.8 : 1;
  const stretch = s.pose === 'attack' ? 1.3 : s.pose === 'windup' ? 0.88 : 1;
  const L = r * 0.62 * stretch;
  const z = r * 0.62 * crouch;
  const pt = (a: number, b: number, zz: number): [number, number] => p3(f, s.x, gy, a, b, zz);
  const [cx, cy] = pt(L, 0, z + r * 0.05);
  const [hx, hy] = pt(-L, 0, z);
  const near = f.py >= 0 ? 1 : -1;
  const leg = (front: boolean, side: number): void => {
    const a = front ? L * 0.8 : -L * 0.85;
    const ph = run + (front ? 0 : Math.PI) + (side > 0 ? 0.6 : 0);
    const g = Math.sin(ph) * r * 0.32 * mv;
    const [rx, ry] = pt(a, r * 0.24 * side, z - r * 0.05);
    const [px, py] = pt(a + g, r * 0.26 * side, Math.max(0, Math.cos(ph)) * r * 0.12 * mv);
    const [kx, ky] = bend(rx, ry, px, py, z * 1.12, front ? f.fx * 0.7 : -f.fx * 1.3, 0.2);
    limb3(ctx, s, rx, ry, kx, ky, px, py, r * (front ? 0.2 : 0.26), r * 0.13, side === near ? look.leg : look.legFar);
    ctx.fillStyle = s.flash ? '#ffffff' : look.paw;
    ctx.beginPath();
    ctx.ellipse(px + f.fx * 2, py + 1, r * 0.12, r * 0.07, 0, 0, TAU);
    ctx.fill();
  };
  const tail = (): void => {
    const [tx, ty] = pt(-L * 1.1, 0, z + r * 0.15);
    const wag = Math.sin(s.t * 9) * 0.5;
    const ta = Math.atan2(ty - cy, tx - cx) - 0.6 * f.dir + wag * 0.4;
    horn(ctx, s, tx, ty, ta, r * 0.75, r * 0.11, 0.4 * f.dir, deco.tail, 2);
    deco.tailTip?.(tx + Math.cos(ta) * r * 0.75, ty + Math.sin(ta) * r * 0.75, ta);
  };
  const head = (): void => {
    const [qx, qy] = pt(L + r * 0.42, 0, z + r * (0.38 + 0.14 * Math.abs(f.fy)));
    capsule(ctx, s, cx, cy - r * 0.05, r * 0.3, qx, qy + r * 0.05, r * 0.2, look.body, 0, 0.6, 3);
    const gape = s.pose === 'windup' ? 0.6 : s.pose === 'attack' ? 1 : 0.1 + Math.max(0, Math.sin(s.t * 3)) * 0.1;
    if (deco.hot && s.pose === 'attack') streak(ctx, qx - f.fx * r * 0.8, qy - f.fy * r * 0.4, qx + f.fx * r * 0.6, qy + f.fy * r * 0.3, 6, deco.hot, 0.6);
    canineHead(ctx, s, f, qx, qy, r * 1.05, look, gape);
    if (gape > 0.5) glow(ctx, qx + f.fx * r * 0.45, qy + r * 0.12, r * 0.6, deco.mouthGlow, 0.6);
  };
  const farFirst = f.fy < 0;
  leg(true, -near);
  leg(false, -near);
  if (farFirst) head();
  else tail();
  capsule(ctx, s, hx, hy, r * 0.42, cx, cy, r * 0.48, look.body, 0.2, 0.58);
  deco.flank?.(pt, near);
  if (deco.spine) {
    for (let i = 0; i < 4; i++) {
      const [mx, my] = pt(L * (0.75 - i * 0.42), 0, z + r * (0.42 - i * 0.04));
      deco.spine(mx, my, i);
    }
  }
  leg(true, near);
  leg(false, near);
  if (farFirst) tail();
  else head();
}
