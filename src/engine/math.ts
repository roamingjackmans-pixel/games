// Small math library: scalar helpers, angles, and the shape tests used by hitboxes and telegraphs.
// All shape tests take a target circle (x, y, r) so entity radius is respected.

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
export function invLerp(a: number, b: number, v: number): number {
  return b === a ? 0 : (v - a) / (b - a);
}
export function approach(v: number, target: number, step: number): number {
  return v < target ? Math.min(target, v + step) : Math.max(target, v - step);
}
export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}
export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}
export function len(x: number, y: number): number {
  return Math.hypot(x, y);
}
/** Normalised direction; returns [0, 0] for a zero vector. */
export function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y);
  return l > 1e-9 ? [x / l, y / l] : [0, 0];
}
/** Wrap angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  a = a % TAU;
  if (a <= -Math.PI) a += TAU;
  else if (a > Math.PI) a -= TAU;
  return a;
}
/** Signed shortest difference b - a. */
export function angleDiff(a: number, b: number): number {
  return wrapAngle(b - a);
}
export function angleTo(ax: number, ay: number, bx: number, by: number): number {
  return Math.atan2(by - ay, bx - ax);
}
/** Rotate angle a toward b by at most step radians. */
export function turnToward(a: number, b: number, step: number): number {
  const d = angleDiff(a, b);
  if (Math.abs(d) <= step) return b;
  return wrapAngle(a + Math.sign(d) * step);
}
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ---------- shape tests (target circle tx, ty, tr) ----------

export function circleHit(cx: number, cy: number, r: number, tx: number, ty: number, tr: number): boolean {
  const rr = r + tr;
  return dist2(cx, cy, tx, ty) <= rr * rr;
}

/** Annulus rIn..rOut. The target counts as inside if any part of it overlaps the band. */
export function ringHit(cx: number, cy: number, rIn: number, rOut: number, tx: number, ty: number, tr: number): boolean {
  const d = dist(cx, cy, tx, ty);
  return d + tr >= rIn && d - tr <= rOut;
}

/** Cone from (cx, cy) facing `facing` with half angle `half` and radius r. */
export function coneHit(cx: number, cy: number, facing: number, half: number, r: number, tx: number, ty: number, tr: number): boolean {
  const d = dist(cx, cy, tx, ty);
  if (d - tr > r) return false;
  if (d <= tr) return true;
  if (half >= Math.PI) return true;
  const a = Math.abs(angleDiff(facing, Math.atan2(ty - cy, tx - cx)));
  if (a <= half) return true;
  // allow the target's radius to graze the cone edge
  const edgeSlack = Math.asin(Math.min(1, tr / d));
  return a <= half + edgeSlack;
}

/**
 * Oriented rectangle starting at (sx, sy) running `l` px along `angle`, `w` px wide (a "line" or "thrust").
 */
export function lineHit(sx: number, sy: number, angle: number, w: number, l: number, tx: number, ty: number, tr: number): boolean {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const dx = tx - sx;
  const dy = ty - sy;
  const along = dx * ca + dy * sa;
  const across = -dx * sa + dy * ca;
  return along >= -tr && along <= l + tr && Math.abs(across) <= w / 2 + tr;
}

/** Axis-aligned rectangle hit. */
export function rectHit(x0: number, y0: number, x1: number, y1: number, tx: number, ty: number, tr: number): boolean {
  const nx = clamp(tx, x0, x1);
  const ny = clamp(ty, y0, y1);
  return dist2(nx, ny, tx, ty) <= tr * tr;
}

/** Closest distance from point to segment. */
export function pointSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const l2 = abx * abx + aby * aby;
  let t = l2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / l2 : 0;
  t = clamp(t, 0, 1);
  return dist(px, py, ax + abx * t, ay + aby * t);
}

/** Does segment A→B intersect the circle? */
export function segCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number): boolean {
  return pointSegDist(cx, cy, ax, ay, bx, by) <= r;
}

/** Distance from a point inside a circle to its edge (0 if outside). */
export function distToCircleEdge(cx: number, cy: number, r: number, px: number, py: number): number {
  return Math.max(0, r - dist(cx, cy, px, py));
}

/** Ray cast against an axis-aligned box; returns t of entry or Infinity. */
export function rayBox(ox: number, oy: number, dx: number, dy: number, x0: number, y0: number, x1: number, y1: number): number {
  let tmin = -Infinity;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < x0 || ox > x1) return Infinity;
  } else {
    const t1 = (x0 - ox) / dx;
    const t2 = (x1 - ox) / dx;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < y0 || oy > y1) return Infinity;
  } else {
    const t1 = (y0 - oy) / dy;
    const t2 = (y1 - oy) / dy;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  }
  if (tmax < Math.max(0, tmin)) return Infinity;
  return Math.max(0, tmin);
}
