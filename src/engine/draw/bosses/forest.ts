// Boss 4 draw functions: Vexthorn, the Hollow Stag (Hollow Forest), and his Fey Lights (ART_AUDIO §2: thick
// outlines, flat two-tone fills, real silhouettes). Drawn from above and turned to his facing: a lean fey stag
// on jointed bark legs, a bone skull-mask for a face, a crown of thorn antlers, a leaf mane, and a hollow
// ribcage on his back with a lantern burning where the heart should be. Phase 1 (the heart-lantern flares):
// fire licks out between the ribs, the antlers grow longer with burning tips, the eyes blaze. Poses: windup
// lowers the antlers, attack lunges (antlers glow the attack's element colour), stagger reels, roar rears up.
import { ELEMENTS } from '../../../game/elements';
import { registerDraw } from '../registry';
import {
  OUTLINE,
  TAU,
  atkGlow,
  atkK,
  begin,
  clamp01,
  dizzy,
  f,
  flame,
  glow,
  glowEye,
  glowLine,
  hash,
  horn,
  oval,
  ow,
  poseWeights,
  roar,
  roarLines,
  roarShake,
  shade,
  shape,
  strokePts,
  taper,
  withAlpha,
} from '../shapesBoss';

const HIDE = '#cfc4a6';
const HIDE_DARK = '#8a7e62';
const BARK = '#3a2614';
const THORN = '#4a2e1a';
const BONE = '#ebe2c9';
const MOSS = '#3f6a34';
const LEAF = '#2f5a30';
const LANTERN = '#ffcf6a';
const BLAZE = '#ff9b2e';

// ---------------------------------------------------------------- Vexthorn
// Built as a little 3D model (forward d, lateral l, height h, in units of r) and projected into the 3/4 view
// along his facing, so he reads as a stag from every side: profile when running across the screen, the
// skull and the antler crown toward you when he charges down, the haunches when he turns away.
const K = 0.62; // ground-plane squash of the 3/4 camera
const PIVOT_D = -0.5;
const PIVOT_H = 0.8;
// the torso: spheres along the spine (d, h, radius), merged into one outlined body
const SPINE: [number, number, number][] = [
  [0.5, 0.88, 0.31],
  [0.28, 0.85, 0.34],
  [0.02, 0.82, 0.3],
  [-0.26, 0.84, 0.31],
  [-0.5, 0.88, 0.33],
  [-0.68, 0.92, 0.25],
];

interface View {
  x: number;
  y: number;
  r: number;
  fx: number;
  fy: number;
  /** body pitch (rearing) */
  pitch: number;
}

/** Body-space point (pitched about the hips for the rear) → [d, l, h]. */
function bodyPt(v: View, d: number, l: number, h: number): [number, number, number] {
  const dd = d - PIVOT_D;
  const c = Math.cos(v.pitch);
  const sn = Math.sin(v.pitch);
  return [PIVOT_D + dd * c - (h - PIVOT_H) * sn * 0.4, l, h + dd * sn];
}

function proj(v: View, p: [number, number, number]): [number, number] {
  return [v.x + (v.fx * p[0] - v.fy * p[1]) * v.r, v.y + ((v.fy * p[0] + v.fx * p[1]) * K - p[2]) * v.r];
}

function depth(v: View, p: [number, number, number]): number {
  return v.fy * p[0] + v.fx * p[1];
}

/** A head-space offset (a forward, b lateral, c up) rotated by the head's pitch q (q > 0 lowers it). */
function headOff(hc: [number, number, number], q: number, a: number, b: number, c: number): [number, number, number] {
  const cq = Math.cos(q);
  const sq = Math.sin(q);
  return [hc[0] + a * cq + c * sq, hc[1] + b, hc[2] - a * sq + c * cq];
}

/** A tapered segment between two projected 3D points. */
function seg3(
  ctx: CanvasRenderingContext2D,
  v: View,
  a: [number, number, number],
  b: [number, number, number],
  w1: number,
  w2: number,
  fill: string,
): void {
  const [x1, y1] = proj(v, a);
  const [x2, y2] = proj(v, b);
  taper(ctx, x1, y1, x2, y2, w1 * v.r, w2 * v.r, fill);
}

/** A horn/thorn/leaf from 3D point a toward b (projected). */
function horn3(
  ctx: CanvasRenderingContext2D,
  v: View,
  a: [number, number, number],
  b: [number, number, number],
  w: number,
  curl: number,
  fill: string,
  lw = 0.8,
): void {
  const [x1, y1] = proj(v, a);
  const [x2, y2] = proj(v, b);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return;
  horn(ctx, x1, y1, Math.atan2(y2 - y1, x2 - x1), len, w * v.r, curl, fill, lw);
}

registerDraw('boss_vexthorn', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const R = roar(s);
  const w = poseWeights(s);
  const stunned = s.pose === 'stagger';
  const charging = s.pose === 'attack';
  const lower = clamp01(w[1] + w[2]) * (1 - R);
  const beat = 0.5 + 0.5 * Math.sin(s.t * (p2 ? 9 : 4));
  const ag = atkGlow(s);
  const ak = atkK(s);
  const heart = p2 ? BLAZE : LANTERN;
  const fa = s.facing;
  const run = charging ? 1 : 0.1 + s.moving * 0.9;
  const freq = charging ? 16 : 11;
  const v: View = { x: s.x + roarShake(s, r), y: s.y + r * 0.3, r, fx: Math.cos(fa), fy: Math.sin(fa), pitch: R * 0.55 - s.squash * 0.06 };
  const facingAway = v.fy < -0.55;

  // ground shadow along the body
  ctx.save();
  ctx.globalAlpha *= 0.34;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(v.x - v.fx * r * 0.05, v.y, r * (0.42 + 0.62 * Math.hypot(v.fx, v.fy * K)), r * 0.36, Math.atan2(v.fy * K, v.fx), 0, TAU);
  ctx.fill();
  ctx.restore();
  if (p2) glow(ctx, s.x, s.y - r * 0.4, r * 2.5, BLAZE, 0.2 + beat * 0.12);
  if (R > 0) glow(ctx, s.x, s.y - r * 0.6, r * 2.8, heart, 0.28 * R);

  // charge streaks trailing behind
  if (charging) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const l = (i - 2) * 0.2;
      const ph = (s.t * 3 + i * 0.37) % 1;
      const [ax, ay] = proj(v, [-0.95 - ph * 0.3, l, 0.4 + (i % 3) * 0.25]);
      const [bx, by] = proj(v, [-1.5 - ph * 0.6, l, 0.4 + (i % 3) * 0.25]);
      ctx.strokeStyle = withAlpha(ag ?? '#ffffff', 0.5 * (1 - ph));
      ctx.lineWidth = ow(1.2);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- parts, drawn back to front
  const legs = (near: boolean): void => {
    for (const [d0, side, grp] of [
      [0.44, 1, 1],
      [0.44, -1, 0],
      [-0.5, 1, 0],
      [-0.5, -1, 1],
    ] as const) {
      const fore = d0 > 0;
      const top = bodyPt(v, d0, side * 0.16, 0.74);
      const isNear = depth(v, top) > -0.02 + (fore ? 0 : 0.0);
      if (isNear !== near) continue;
      const ph = s.t * freq + grp * Math.PI;
      const swing = Math.sin(ph) * run;
      const up = Math.max(0, Math.cos(ph)) * 0.14 * run;
      let hoof: [number, number, number] = [d0 + (fore ? 0.06 : -0.03) + swing * 0.24 - lower * 0.06 * (fore ? -1 : 1), side * 0.2, up];
      let knee: [number, number, number] = [(top[0] + hoof[0]) / 2 + (fore ? 0.05 : -0.13), side * 0.18, 0.38 + up * 0.6];
      if (fore && R > 0) {
        const paw = Math.sin(s.t * 9 + side) * 0.06;
        const kT: [number, number, number] = [top[0] + 0.26, top[1], top[2] - 0.16 + paw];
        const hT: [number, number, number] = [top[0] + 0.12, side * 0.2, top[2] - 0.42 - paw];
        knee = [knee[0] + (kT[0] - knee[0]) * R, knee[1], knee[2] + (kT[2] - knee[2]) * R];
        hoof = [hoof[0] + (hT[0] - hoof[0]) * R, hoof[1], hoof[2] + (hT[2] - hoof[2]) * R];
      }
      const shade0 = isNear ? 1 : 0.82;
      seg3(ctx, v, top, knee, 0.22, 0.11, f(s, shade(HIDE_DARK, shade0)));
      seg3(ctx, v, knee, hoof, 0.11, 0.075, f(s, shade(BARK, shade0)));
      const [kx, ky] = proj(v, knee);
      oval(ctx, kx, ky, r * 0.06, r * 0.055, f(s, shade(BARK, 1.35 * shade0)), { under: null, w: 0.6 });
      const [hx, hy] = proj(v, hoof);
      shape(
        ctx,
        [hx - r * 0.08, hy + r * 0.03, hx - r * 0.06, hy - r * 0.04, hx + r * 0.06, hy - r * 0.04, hx + r * 0.08, hy + r * 0.03],
        f(s, '#d8ccb0'),
        { under: null, w: 0.8 },
      );
    }
  };

  const torso = (): void => {
    const pts = SPINE.map(([d, h, rad]) => {
      const p = bodyPt(v, d, 0, h);
      const [x, y] = proj(v, p);
      return [x, y, rad * r] as const;
    });
    ctx.fillStyle = OUTLINE;
    for (const [x, y, rad] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, rad + ow(1), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = f(s, HIDE_DARK);
    for (const [x, y, rad] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = f(s, HIDE);
    for (const [x, y, rad] of pts) {
      ctx.beginPath();
      ctx.arc(x, y - rad * 0.12, rad * 0.86, 0, TAU);
      ctx.fill();
    }
    if (!s.flash) {
      ctx.fillStyle = withAlpha('#ffffff', 0.16);
      for (const [x, y, rad] of pts) {
        ctx.beginPath();
        ctx.ellipse(x - rad * 0.1, y - rad * 0.55, rad * 0.5, rad * 0.22, 0, 0, TAU);
        ctx.fill();
      }
    }
    // the moss saddle on the back and a ridge of thorns along the spine
    const [mx, my] = proj(v, bodyPt(v, -0.36, 0, 1.12));
    const mrx = r * (0.18 + 0.2 * Math.abs(v.fx));
    shape(
      ctx,
      [
        mx - mrx,
        my + r * 0.02,
        mx - mrx * 0.6,
        my - r * 0.1,
        mx,
        my - r * 0.13,
        mx + mrx * 0.6,
        my - r * 0.1,
        mx + mrx,
        my + r * 0.03,
        mx + mrx * 0.5,
        my + r * 0.11,
        mx + mrx * 0.15,
        my + r * 0.05,
        mx - mrx * 0.2,
        my + r * 0.13,
        mx - mrx * 0.6,
        my + r * 0.08,
      ],
      f(s, MOSS),
      { smooth: true, under: f(s, shade(MOSS, 0.75)), w: 0.8 },
    );
    for (let i = 0; i < 6; i++) {
      const d = -0.74 + i * 0.17;
      const a = bodyPt(v, d, 0, 1.12 + Math.sin(i) * 0.02);
      const b = bodyPt(v, d - 0.12, 0, 1.12 + 0.2 + hash(i) * 0.06);
      horn3(ctx, v, a, b, 0.07, 0, f(s, THORN), 0.7);
    }
  };

  // the hollow chest: a dark cavity in the near flank of the chest, ribs over it, the lantern-heart inside
  const chestC = bodyPt(v, 0.32, 0, 0.82);
  const [chx0, chy0] = proj(v, chestC);
  const showChest = !facingAway;
  const cavX = chx0 + v.fy * 0 - Math.abs(v.fy) * 0;
  const cavY = chy0 + r * 0.06;
  const chest = (): void => {
    const crx = r * (0.17 + 0.07 * Math.abs(v.fy));
    const cry = r * 0.21;
    oval(ctx, cavX, cavY, crx, cry, '#140b06', { under: null, w: 0.9 });
    const hr = r * (0.075 + beat * 0.012) * (p2 ? 1.25 : 1);
    if (!s.flash) glow(ctx, cavX, cavY, r * (p2 ? 0.95 : 0.6) * (0.85 + beat * 0.3), ag && s.atk === 'holy' ? ag : heart, p2 ? 0.95 : 0.8);
    // the lantern: a little iron cage hanging inside the ribs
    strokePts(ctx, [cavX, cavY - cry * 0.95, cavX, cavY - hr * 1.3], '#2a1a0e', Math.max(1.2, r * 0.025));
    shape(
      ctx,
      [
        cavX - hr * 0.6,
        cavY - hr * 1.35,
        cavX + hr * 0.6,
        cavY - hr * 1.35,
        cavX + hr,
        cavY - hr * 0.9,
        cavX + hr * 0.85,
        cavY + hr,
        cavX - hr * 0.85,
        cavY + hr,
        cavX - hr,
        cavY - hr * 0.9,
      ],
      s.flash ? '#ffffff' : heart,
      { under: null, w: 0.7 },
    );
    oval(ctx, cavX, cavY, hr * 0.45, hr * 0.65, s.flash ? '#ffffff' : '#fff6c8', { under: null, w: 0 });
    strokePts(ctx, [cavX - hr * 0.35, cavY - hr * 0.9, cavX - hr * 0.35, cavY + hr], '#3a2a14', Math.max(1, r * 0.018));
    strokePts(ctx, [cavX + hr * 0.35, cavY - hr * 0.9, cavX + hr * 0.35, cavY + hr], '#3a2a14', Math.max(1, r * 0.018));
    // ribs: pale curved bars across the cavity
    ctx.save();
    ctx.lineCap = 'round';
    const lean = v.fx * 0.35;
    for (const k of [-0.62, -0.08, 0.46]) {
      const x = cavX + k * crx * 1.1;
      for (const [col, lw] of [
        [OUTLINE, r * 0.06 + ow(1.2)],
        [f(s, BONE), r * 0.06],
      ] as const) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x - lean * cry * 0.4, cavY - cry * 1.05);
        ctx.quadraticCurveTo(x + crx * 0.45, cavY, x + lean * cry * 0.4, cavY + cry * 1.05);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  // tail: a ragged tuft of leaves off the rump
  const tail = (): void => {
    const base = bodyPt(v, -0.84, 0, 0.98);
    const tw = Math.sin(s.t * 5) * 0.08 + Math.sin(s.t * 13) * 0.04 * s.moving;
    for (const i of [-1, 1, 0])
      horn3(
        ctx,
        v,
        base,
        bodyPt(v, -1.12, i * 0.12 + tw, 1.12 + (i === 0 ? 0.12 : 0)),
        0.13,
        i * 0.3,
        f(s, i === 0 ? LEAF : shade(LEAF, 0.8)),
      );
  };

  // neck, mane and head (with the antler crown)
  const q = lower * 1.0 - R * 0.55 + (stunned ? Math.sin(s.t * 6) * 0.25 : 0);
  const hc = bodyPt(v, 0.92 + lower * 0.16, stunned ? Math.sin(s.t * 4) * 0.08 : 0, 1.34 - lower * 0.42);
  const neckBase = bodyPt(v, 0.5, 0, 1.02);
  const head = (): void => {
    // mane: leaves down both sides of the neck, then the neck itself
    for (let i = 0; i < 4; i++) {
      const k = i / 3;
      const a: [number, number, number] = [
        neckBase[0] + (hc[0] - neckBase[0]) * k * 0.85,
        0,
        neckBase[2] + (hc[2] - neckBase[2]) * k * 0.85,
      ];
      for (const side of [-1, 1])
        horn3(
          ctx,
          v,
          [a[0], side * 0.06, a[2] + 0.04],
          [a[0] - 0.24, side * 0.2, a[2] + 0.06 + Math.sin(s.t * 3 + i) * 0.03],
          0.13,
          side * 0.2,
          f(s, i % 2 ? LEAF : shade(LEAF, 0.82)),
          0.7,
        );
    }
    seg3(ctx, v, neckBase, headOff(hc, q, -0.08, 0, -0.02), 0.4, 0.27, f(s, HIDE_DARK));
    // ears
    for (const side of [-1, 1])
      horn3(
        ctx,
        v,
        headOff(hc, q, -0.06, side * 0.1, 0.06),
        headOff(hc, q, -0.14, side * 0.36, 0.14 + R * 0.08),
        0.14,
        side * 0.2,
        f(s, HIDE),
      );
    // the skull mask: cranium and long snout, a dropped jaw when roaring
    const back = headOff(hc, q, -0.04, 0, 0.02);
    const snout = headOff(hc, q, 0.4, 0, -0.1);
    const [bx, by] = proj(v, back);
    if (R > 0.05) {
      const jaw = headOff(hc, q + 0.55 * R, 0.34, 0, -0.18);
      seg3(ctx, v, headOff(hc, q, 0.02, 0, -0.06), jaw, 0.2, 0.1, '#2a0a06');
      seg3(ctx, v, headOff(hc, q, 0.02, 0, -0.1), jaw, 0.16, 0.08, f(s, shade(BONE, 0.85)));
    }
    seg3(ctx, v, back, snout, 0.34, 0.17, f(s, BONE));
    oval(ctx, bx, by, r * 0.2, r * 0.18, f(s, BONE), { under: f(s, '#c2b694'), uf: 0.35 });
    const [sx] = proj(v, snout);
    if (!facingAway) {
      ctx.fillStyle = OUTLINE;
      for (const side of [-1, 1]) {
        const [nx, ny] = proj(v, headOff(hc, q, 0.4, side * 0.04, -0.08));
        ctx.beginPath();
        ctx.ellipse(nx + (sx - nx) * 0.1, ny, r * 0.025, r * 0.018, 0, 0, TAU);
        ctx.fill();
      }
      // burning eyes in dark sockets, on the sides that face the camera
      for (const side of [-1, 1]) {
        const vis = v.fx * side * 0.6 + v.fy * 0.8;
        if (vis < -0.15) continue;
        const [ex, ey] = proj(v, headOff(hc, q, 0.1, side * 0.1, 0.05));
        oval(ctx, ex, ey, r * 0.08, r * 0.05, '#1a0e08', { under: null, w: 0.7, rot: side * v.fy * 0.4 });
        glowEye(
          ctx,
          ex,
          ey,
          r * 0.05 * (1 + R * 0.3),
          r * 0.025 * (1 + R * 0.3),
          s.flash ? '#ffffff' : heart,
          side * v.fy * 0.4,
          p2 ? 1.3 : 0.9,
        );
      }
    }
    // the antler crown: beams rise, spread and sweep back; tines reach forward; thorns along the beams
    const len = (p2 ? 1.3 : 1.0) * (1 + R * 0.1);
    const spread = 1 + R * 0.25;
    const col = f(s, THORN);
    const tips: [number, number][] = [];
    for (const side of [-1, 1]) {
      const A = (a: number, b: number, c: number): [number, number, number] =>
        headOff(hc, q, -0.02 + a * len, side * (0.08 + b * len * spread), 0.1 + c * len);
      const b0 = A(0, 0, 0);
      const b1 = A(-0.08, 0.32, 0.34);
      const b2 = A(-0.2, 0.55, 0.7);
      const b3 = A(-0.12, 0.64, 0.96);
      const tines: [[number, number, number], [number, number, number], number][] = [
        [b1, A(0.28, 0.38, 0.46), 0.09],
        [b2, A(0.16, 0.66, 0.84), 0.08],
        [b2, A(-0.42, 0.78, 0.8), 0.07],
        [b3, A(0.08, 0.8, 1.16), 0.07],
        [b3, A(-0.3, 0.7, 1.18), 0.06],
      ];
      for (const [a, b, wd] of tines) {
        horn3(ctx, v, a, b, wd * len, -side * 0.3, col);
        tips.push(proj(v, b));
      }
      seg3(ctx, v, b0, b1, 0.13 * len, 0.1 * len, col);
      seg3(ctx, v, b1, b2, 0.1 * len, 0.075 * len, col);
      seg3(ctx, v, b2, b3, 0.075 * len, 0.05 * len, col);
      // thorns
      for (const [a, b, k] of [
        [b0, b1, 0.5],
        [b1, b2, 0.4],
        [b1, b2, 0.8],
        [b2, b3, 0.5],
      ] as const) {
        const m: [number, number, number] = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
        horn3(ctx, v, m, [m[0] - 0.1, m[1] + side * 0.1, m[2] + 0.02], 0.045, 0, col, 0.6);
      }
      if (ag) {
        const [x0, y0] = proj(v, b0);
        const [x3, y3] = proj(v, b3);
        glowLine(ctx, x0, y0, x3, y3, r * 0.24, ag, 0.25 * ak, 3);
      }
    }
    for (const [tx, ty] of tips) {
      if (ag) glow(ctx, tx, ty, r * 0.1, ag, 0.5 * ak);
      if (p2) glow(ctx, tx, ty, r * 0.14, BLAZE, 0.55 + beat * 0.3);
    }
  };

  const headBehind = depth(v, hc) < -0.25;
  if (headBehind) head();
  legs(false);
  if (v.fx * 0 + depth(v, bodyPt(v, -0.84, 0, 0.98)) > 0) {
    torso();
    tail();
  } else {
    tail();
    torso();
  }
  if (showChest) chest();
  legs(true);
  if (!headBehind) head();

  // flames rising out of the ribcage (phase 1), roar lines, dizzy stars, fey motes
  const [hwx, hwy] = proj(v, hc);
  if (p2) {
    glow(ctx, cavX, cavY - r * 0.1, r * 0.9, BLAZE, 0.5 + beat * 0.3);
    if (showChest)
      for (let i = 0; i < 3; i++)
        flame(
          ctx,
          cavX + (i - 1) * r * 0.1,
          cavY - r * 0.08,
          r * (0.26 + hash(i * 5) * 0.16) * (0.8 + beat * 0.4),
          r * 0.11,
          s.t,
          i * 4 + 1,
          '#ff6a1a',
          '#fff3b0',
        );
  }
  if (R > 0) roarLines(ctx, hwx, hwy - r * 0.2, r * 0.75, R, s.t, heart);
  if (stunned) dizzy(ctx, hwx, hwy - r * 0.9, r * 0.5, s.t);
  for (let i = 0; i < (p2 ? 8 : 4); i++) {
    const a = s.t * 0.8 + i * 1.9;
    const d = r * (1.25 + ((s.t * 0.25 + i * 0.31) % 1) * 0.8);
    glow(ctx, s.x + Math.cos(a) * d, s.y - r * 0.3 + Math.sin(a) * d * 0.7, r * 0.14, LANTERN, 0.6);
  }
});

// ---------------------------------------------------------------- Fey Light (holy)
// A little moth-spirit of holy light: a teardrop of gold fire with two pairs of moth wings and curled
// antennae. It swells and burns white-hot as it winds up to pop.
const HOLY = ELEMENTS.holy;

registerDraw('boss_fey_light', (ctx, s) => {
  const r = begin(s);
  const bob = Math.sin(s.t * 3 + s.variant) * r * 0.28;
  const charge = s.pose === 'windup' ? clamp01(s.poseT / 0.7) : 0;
  const swell = 1 + charge * 0.6;
  const y = s.y - r * 0.95 + bob;
  const flick = Math.sin(s.t * (7 + charge * 20)) * 0.12;
  ctx.save();
  ctx.globalAlpha *= 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.5, r * 0.6, r * 0.25, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x, y, r * 3.2 * swell, HOLY.glow, 0.55 + flick);
  glow(ctx, s.x, y, r * 1.6 * swell, '#fffbe0', 0.8);
  // wings: an upper and a lower pair, beating fast
  const flap = 0.55 + 0.45 * Math.abs(Math.sin(s.t * 18 + s.variant));
  ctx.save();
  ctx.globalAlpha *= 0.85;
  for (const side of [-1, 1]) {
    for (const [ay, len, wd, rot] of [
      [-0.2, 1.25, 0.62, -0.45],
      [0.25, 0.85, 0.42, 0.55],
    ] as const) {
      ctx.save();
      ctx.translate(s.x + side * r * 0.2, y + ay * r);
      ctx.scale(side * flap, 1);
      ctx.rotate(rot);
      shape(
        ctx,
        [0, 0, len * r * 0.45, -wd * r, len * r, -wd * r * 0.4, len * r * 0.9, wd * r * 0.35, len * r * 0.35, wd * r * 0.4],
        withAlpha('#fff4cc', 0.85),
        { smooth: true, under: withAlpha(HOLY.main, 0.6), outline: '#b8862a', w: 0.5 },
      );
      oval(ctx, len * r * 0.6, -wd * r * 0.1, r * 0.13, r * 0.13, withAlpha(HOLY.main, 0.9), { under: null, outline: '#b8862a', w: 0.4 });
      ctx.restore();
    }
  }
  ctx.restore();
  // antennae
  ctx.save();
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = Math.max(1, ow(0.4));
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s.x + side * r * 0.12, y - r * 0.45 * swell);
    ctx.quadraticCurveTo(s.x + side * r * 0.4, y - r * 1.2, s.x + side * r * 0.65, y - r * 0.95);
    ctx.stroke();
  }
  ctx.restore();
  // the body: a teardrop of holy fire, white-hot as it charges
  const bw = r * 0.55 * swell;
  const bh = r * 0.95 * swell;
  shape(
    ctx,
    [
      s.x,
      y - bh,
      s.x + bw * 0.75,
      y - bh * 0.15,
      s.x + bw,
      y + bh * 0.35,
      s.x,
      y + bh * 0.6,
      s.x - bw,
      y + bh * 0.35,
      s.x - bw * 0.75,
      y - bh * 0.15,
    ],
    f(s, charge > 0.6 ? '#fffbe8' : HOLY.main),
    { smooth: true, under: f(s, charge > 0.6 ? HOLY.glow : '#d6a020'), outline: '#7a5a10', w: 0.6 },
  );
  oval(ctx, s.x, y + bh * 0.12, bw * 0.5, bh * 0.38, s.flash ? '#ffffff' : '#fff8d8', { under: null, w: 0 });
  // two tiny dark eyes: it is quite pleased to meet you
  ctx.fillStyle = '#5a3a08';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s.x + side * bw * 0.32, y + bh * 0.08, Math.max(1, r * 0.09), 0, TAU);
    ctx.fill();
  }
  // orbiting sparks
  for (let i = 0; i < 3; i++) {
    const a = s.t * 4 + (i * TAU) / 3;
    glow(ctx, s.x + Math.cos(a) * r * 1.4 * swell, y + Math.sin(a) * r * 0.8, r * 0.38, HOLY.glow, 0.85);
  }
});
