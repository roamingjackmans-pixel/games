// Boss 7 draw functions: Archmagister Tock (Clockwork Citadel) and his corner turrets (ART_AUDIO §2: thick
// outlines, flat two-tone fills, real silhouettes). Tock deals mostly Void, so he reads void grey-black with
// lilac-grey glows: a clockwork mage in a dark robe with a high brass collar, a clock face for a face, a tall
// crooked hat with gears on its band, a great wind-up key turning in his back, two little mechanical arms and a
// staff with a caged hourglass and a pendulum, riding a floating gear. Phase 1 he rewinds the clock: the key,
// gears and hands spin backward, his chest doors swing open on glowing gears and a gear halo of hour plates
// turns behind him. Drawn upright in a frame mirrored to the side he faces; attacks glow in their element.
import { ELEMENTS } from '../../../game/elements';
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
  dizzy,
  f,
  glint,
  glow,
  glowEye,
  glowLine,
  groundShadow,
  hash,
  mixPose,
  oval,
  ow,
  poseWeights,
  roar,
  roarLines,
  roarShake,
  shade,
  shape,
  stick,
  strokePts,
  withAlpha,
} from '../shapesBoss';
import { overtimeAura } from './overtime';

const VOID = ELEMENTS.void;
const MAGIC = ELEMENTS.magic;
const BRASS = '#c09a44';
const BRASS_D = '#8a6a26';
const ROBE = '#3a3346';
const ROBE_D = '#211c29';
const IVORY = '#efe6cc';
const STEEL = '#6a6a78';
const LILAC = '#c9bdf0';
const REWIND = '#b06bff';

/** Facing in a frame mirrored so he always faces +x: [side (±1), local facing angle in [−π/2, π/2]]. */
function mirrored(s: DrawState): [number, number] {
  const fx = Math.cos(s.facing);
  const side = fx >= 0 ? 1 : -1;
  return [side, Math.atan2(Math.sin(s.facing), Math.abs(fx))];
}

/** A filled, outlined cog (sy squashes it into the floor plane). */
function cog(ctx: CanvasRenderingContext2D, x: number, y: number, rOut: number, rIn: number, teeth: number, rot: number, fill: string, sy = 1, lw = 1, outline = OUTLINE): void {
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * TAU;
    const rr = i % 4 === 0 || i % 4 === 1 ? rOut : rIn;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr * sy;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = ow(lw);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
}

/** A crackle of lightning (magic) from (x1, y1) toward (x2, y2): a jagged glowing line, deterministic per frame. */
function crackle(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, t: number, seed: number, color: string, w: number): void {
  const frame = Math.floor(t * 18);
  const pts: number[] = [x1, y1];
  const n = 5;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < n; i++) {
    const k = i / n;
    const j = (hash(frame * 13 + seed * 7 + i) - 0.5) * len * 0.35;
    pts.push(x1 + dx * k - (dy / len) * j, y1 + dy * k + (dx / len) * j);
  }
  pts.push(x2, y2);
  strokePts(ctx, pts, color, w * 2.2, 0.35);
  strokePts(ctx, pts, '#ffffff', w * 0.8, 0.95);
}

// pose arrays (× r, from the platform top): [staffHandX, staffHandY, staffAngle, offX, offY, lean, spread]
const TK_REST = [0.56, -0.6, -1.5, -0.56, -0.56, 0, 0];
const TK_RAISED = [0.5, -1.18, -1.2, -0.72, -1.02, -0.1, 0.55];
const TK_DASH = [0.6, -0.78, -0.55, -0.52, -0.82, 0.45, 0.2];
const TK_ROAR = [0.86, -1.38, -1.38, -0.98, -1.18, -0.16, 1.15];
const TK_STAGGER = [0.6, -0.42, -0.85, -0.48, -0.36, 0.35, -0.4];

registerDraw('boss_tock', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const p3 = s.phase >= 2; // D359: the third phase runs out of time: a clock face on the floor, gears and ticks round him
  const [side, aL] = mirrored(s);
  const back = Math.sin(s.facing) < -0.6;
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const attacking = s.pose === 'windup' || s.pose === 'attack';
  const dash = s.atk === 'physical' && attacking;
  const w = poseWeights(s);
  const fx = Math.cos(aL);
  const fy = Math.sin(aL);
  const struck = dash ? [0.66, -0.74, -0.35, -0.5, -0.8, 0.6, 0.3] : [0.32 + fx * 0.66, -0.95 + fy * 0.45, aL - 0.5, -0.62, -0.78, 0.2, 0.3];
  const p = blendPose(TK_REST, dash ? TK_DASH : TK_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, TK_STAGGER, 1);
  mixPose(p, TK_ROAR, R);
  const [sX, sY, stA, oX, oY, lean, spread] = p as [number, number, number, number, number, number, number];
  const float = r * (0.3 + Math.sin(s.t * 2) * 0.07);
  const turn = p2 ? -s.t * 1.8 : s.t * 0.6;
  const spin = dash ? turn * 4 : turn;
  const hub = p2 ? REWIND : LILAC;
  const eye = p2 ? '#e2c8ff' : LILAC;

  groundShadow(ctx, s.x, s.y + r * 0.66, r * 1.0, r * 0.34, 0.3);
  if (p2) glow(ctx, s.x, s.y - r * 0.9, r * 2.7, REWIND, 0.32 + Math.sin(s.t * 5) * 0.06);
  else glow(ctx, s.x, s.y - r * 0.6, r * 1.9, VOID.glow, 0.28);
  if (p3) overtimeAura(ctx, s, r, { color: REWIND, core: '#ffd870', rings: 3, ringKind: 'clock', wisps: 'gear', motes: 'tick', count: 7, lift: 0.4 });
  if (R > 0) glow(ctx, s.x, s.y - r * 1.0, r * 2.6, p2 ? REWIND : VOID.glow, 0.35 * R);

  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y + r * 0.26 - float);
  ctx.scale(side, 1);

  // ---- the floating gear platform (O = its top centre)
  glow(ctx, 0, r * 0.25, r * 1.1, dash && ag ? ag : hub, 0.55 + (dash ? ak * 0.4 : 0));
  cog(ctx, r * 0.78, r * 0.32, r * 0.3, r * 0.22, 8, -spin * 2.2, f(s, BRASS_D), 0.55);
  cog(ctx, -r * 0.66, r * 0.3, r * 0.24, r * 0.17, 7, -spin * 2.6, f(s, BRASS_D), 0.55);
  cog(ctx, 0, r * 0.14, r * 1.12, r * 0.94, 16, spin, f(s, shade(BRASS, 0.62)), 0.42);
  cog(ctx, 0, 0, r * 1.12, r * 0.94, 16, spin, f(s, BRASS), 0.42);
  oval(ctx, 0, 0, r * 0.74, r * 0.3, f(s, shade(BRASS, 0.8)), { under: null, w: 0.7 });
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = ow(0.7);
  for (let i = 0; i < 6; i++) {
    const a = spin + (i * TAU) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.08);
    ctx.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.29);
    ctx.stroke();
  }
  ctx.restore();
  oval(ctx, 0, 0, r * 0.2, r * 0.085, s.flash ? '#ffffff' : hub, { under: null, w: 0.7 });
  if (dash && ag) {
    // ramming: the rim glows and speed streaks trail behind
    glow(ctx, r * 0.9, 0, r * 0.7, ag, 0.7 * ak);
    for (let i = 0; i < 4; i++) strokePts(ctx, [-r * (1.2 + i * 0.12), -r * (0.1 + i * 0.25), -r * (1.9 + hash(i) * 0.5), -r * (0.1 + i * 0.25)], ag, ow(0.8), 0.6 * ak);
  }

  const lx = lean * 0.22 * r;
  const shY = -1.0 * r;
  const fsX = 0.3 * r + lx;
  const bsX = -0.3 * r + lx;
  const headX = 0.04 * r + lx * 1.5 + fx * 0.05 * r;
  const headY = -1.36 * r + Math.max(0, lean) * 0.1 * r;

  // phase 1: a great gear halo turning backward behind him, hour plates orbiting on it
  if (p2 || R > 0) {
    const hk = p2 ? 1 : R * 0.8;
    ctx.save();
    ctx.globalAlpha *= 0.7 * hk;
    cog(ctx, headX, headY + r * 0.2, r * 1.36, r * 1.2, 20, -s.t * 0.5, withAlpha(REWIND, 0.22), 1, 1.1, withAlpha('#e2c8ff', 0.8));
    ctx.strokeStyle = withAlpha('#e2c8ff', 0.5);
    ctx.lineWidth = ow(0.7);
    ctx.beginPath();
    ctx.arc(headX, headY + r * 0.2, r * 1.05, 0, TAU);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 12; i++) {
      const a = -s.t * 0.5 + (i * TAU) / 12;
      const hx2 = headX + Math.cos(a) * r * 1.25;
      const hy2 = headY + r * 0.2 + Math.sin(a) * r * 1.25;
      ctx.save();
      ctx.globalAlpha *= hk;
      glow(ctx, hx2, hy2, r * 0.22, REWIND, 0.6);
      ctx.translate(hx2, hy2);
      ctx.rotate(a + Math.PI / 2);
      shape(ctx, [-r * 0.09, -r * 0.065, r * 0.09, -r * 0.065, r * 0.09, r * 0.065, -r * 0.09, r * 0.065], f(s, BRASS), { under: null, w: 0.6 });
      strokePts(ctx, [0, -r * 0.04, 0, r * 0.04], i % 3 === 0 ? '#ffffff' : '#e2c8ff', Math.max(1.5, r * 0.025));
      ctx.restore();
    }
  }

  // ---- the wind-up key in his back (behind him unless he turns away)
  const keyRot = p2 ? -s.t * 9 : s.t * 1.6;
  const drawKey = (): void => {
    const kx0 = -0.18 * r + lx;
    const ky0 = -0.86 * r;
    const kx1 = -0.8 * r + lx;
    const ky1 = -1.22 * r;
    stick(ctx, kx0, ky0, kx1, ky1, r * 0.1, f(s, BRASS));
    const c = Math.cos(keyRot);
    for (const k of [-1, 1]) {
      const bx = kx1 - 0.1 * r + k * 0.1 * r * c;
      const by = ky1 - 0.06 * r + k * 0.06 * r * c;
      oval(ctx, bx, by, r * (0.06 + 0.12 * Math.abs(c)), r * 0.17, f(s, c * k > 0 ? '#d8b860' : BRASS_D), { w: 0.8, rot: -0.5 });
      oval(ctx, bx, by, r * (0.02 + 0.045 * Math.abs(c)), r * 0.07, f(s, ROBE_D), { under: null, w: 0.5, rot: -0.5 });
    }
    oval(ctx, kx1, ky1, r * 0.07, r * 0.07, f(s, BRASS_D), { w: 0.7 });
  };
  if (!back) drawKey();

  // ---- two little mechanical arms from behind the shoulders, flaring in the roar
  for (const k of [-1, 1]) {
    const bx = k * 0.22 * r + lx;
    const by = -0.95 * r;
    const wave = Math.sin(s.t * 3 + k) * 0.25;
    const a = -Math.PI / 2 + k * (0.75 + spread * 0.55 + wave);
    const ex = bx + Math.cos(a) * r * 0.4;
    const ey = by + Math.sin(a) * r * 0.4;
    const a2 = a + k * (0.9 - spread * 0.4);
    const hx2 = ex + Math.cos(a2) * r * 0.32;
    const hy2 = ey + Math.sin(a2) * r * 0.32;
    stick(ctx, bx, by, ex, ey, r * 0.05, f(s, BRASS_D));
    stick(ctx, ex, ey, hx2, hy2, r * 0.04, f(s, BRASS_D));
    oval(ctx, ex, ey, r * 0.045, r * 0.045, f(s, BRASS), { under: null, w: 0.6 });
    if (k > 0) cog(ctx, hx2, hy2, r * 0.12, r * 0.08, 6, spin * 3, f(s, BRASS), 1, 0.7);
    else {
      // a tiny clock hand like a dagger
      const ha = a2 + Math.sin(s.t * 2) * 0.3;
      shape(ctx, [hx2 - Math.sin(ha) * r * 0.03, hy2 + Math.cos(ha) * r * 0.03, hx2 + Math.cos(ha) * r * 0.26, hy2 + Math.sin(ha) * r * 0.26, hx2 + Math.sin(ha) * r * 0.03, hy2 - Math.cos(ha) * r * 0.03], f(s, IVORY), { under: null, w: 0.6 });
    }
  }

  // ---- the off arm (behind the robe): a brass claw cupping a mote of void
  const ox = oX * r + lx;
  const oy = oY * r;
  arm2(ctx, bsX, shY, ox, oy, r * 0.36, r * 0.36, 1, r * 0.18, r * 0.22, r * 0.3, f(s, shade(ROBE, 0.85)));
  claws(ctx, ox, oy, -Math.PI / 2 - 0.4, r * 0.14, r * 0.05, 3, 1.2, -0.3, f(s, BRASS));
  {
    const mote = attacking && !dash && ag ? ag : p2 ? REWIND : VOID.glow;
    const my = oy - r * 0.22 + Math.sin(s.t * 3) * r * 0.03;
    glow(ctx, ox, my, r * (0.35 + (attacking ? ak * 0.35 : 0)), mote, 0.8);
    oval(ctx, ox, my, r * 0.08, r * 0.08, s.flash ? '#ffffff' : VOID.main, { under: null, outline: mote, w: 0.7 });
    if (s.atk === 'magic' && attacking) crackle(ctx, ox, my, ox + r * 0.25, my - r * 0.3, s.t, 3, MAGIC.glow, Math.max(1, ow(0.5)));
  }

  // ---- the robe: high shoulders, flaring to the platform, brass hem and placket
  const sway = Math.sin(s.t * 2.3) * r * 0.03;
  const robe = [
    -0.3 * r + lx, -1.04 * r,
    0.3 * r + lx, -1.04 * r,
    0.44 * r + lx, -0.86 * r,
    0.4 * r + lx * 0.6, -0.5 * r,
    0.74 * r + sway, 0.0,
    0.5 * r + sway, 0.07 * r,
    0.0, 0.03 * r,
    -0.5 * r + sway, 0.07 * r,
    -0.74 * r + sway, 0.0,
    -0.4 * r + lx * 0.6, -0.5 * r,
    -0.44 * r + lx, -0.86 * r,
  ];
  shape(ctx, robe, f(s, ROBE), { smooth: true, under: f(s, ROBE_D), uf: 0.45, hi: s.flash ? null : withAlpha('#ffffff', 0.06) });
  strokePts(ctx, [-0.62 * r + sway, -0.01 * r, -0.4 * r + sway, 0.03 * r, 0, 0.0, 0.4 * r + sway, 0.03 * r, 0.62 * r + sway, -0.01 * r], f(s, BRASS), r * 0.06);
  strokePts(ctx, [-0.56 * r, -0.13 * r, 0.56 * r, -0.13 * r], withAlpha(VOID.glow, 0.35), Math.max(1, ow(0.5)));
  if (!back) {
    const cx = 0.04 * r + lx * 0.8 + fx * 0.04 * r;
    if (!p2) {
      // closed: a brass placket with rivets and a keyhole
      shape(ctx, [cx - 0.1 * r, -0.98 * r, cx + 0.1 * r, -0.98 * r, cx + 0.13 * r, -0.16 * r, cx - 0.13 * r, -0.16 * r], f(s, BRASS), { under: f(s, BRASS_D), uf: 0.3, w: 0.8 });
      ctx.fillStyle = OUTLINE;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, (-0.86 + i * 0.18) * r, Math.max(1.2, r * 0.025), 0, TAU);
        ctx.fill();
      }
      oval(ctx, cx, -0.62 * r, r * 0.05, r * 0.05, f(s, ROBE_D), { under: null, w: 0.5 });
    } else {
      // open: two brass doors swung wide on a cavity of spinning gears
      shape(ctx, [cx - 0.24 * r, -0.95 * r, cx + 0.24 * r, -0.95 * r, cx + 0.28 * r, -0.32 * r, cx - 0.28 * r, -0.32 * r], '#140f1c', { under: null, w: 0.8 });
      glow(ctx, cx, -0.62 * r, r * 0.6, REWIND, 0.75 + Math.sin(s.t * 8) * 0.1);
      cog(ctx, cx - 0.08 * r, -0.74 * r, r * 0.16, r * 0.11, 8, -s.t * 4, f(s, BRASS), 1, 0.7);
      cog(ctx, cx + 0.12 * r, -0.56 * r, r * 0.13, r * 0.09, 7, s.t * 5, f(s, '#d8b860'), 1, 0.7);
      cog(ctx, cx - 0.1 * r, -0.44 * r, r * 0.1, r * 0.07, 6, -s.t * 6, f(s, BRASS_D), 1, 0.7);
      oval(ctx, cx + 0.12 * r, -0.56 * r, r * 0.04, r * 0.04, s.flash ? '#ffffff' : '#ffffff', { under: null, w: 0.4 });
      for (const k of [-1, 1]) shape(ctx, [cx + k * 0.24 * r, -0.95 * r, cx + k * 0.36 * r, -1.0 * r, cx + k * 0.4 * r, -0.36 * r, cx + k * 0.28 * r, -0.32 * r], f(s, BRASS), { under: f(s, BRASS_D), uf: 0.4, w: 0.8 });
    }
  } else drawKey();

  // ---- the high collar flaring behind the head
  for (const k of [-1, 1]) shape(ctx, [lx + k * 0.08 * r, -1.0 * r, lx + k * 0.38 * r, -1.08 * r, lx + k * 0.46 * r, -1.5 * r, lx + k * 0.2 * r, -1.22 * r], f(s, k > 0 ? '#4a4258' : ROBE), { under: f(s, ROBE_D), uf: 0.4, w: 0.9 });
  strokePts(ctx, [lx - 0.4 * r, -1.08 * r, lx + 0.4 * r, -1.08 * r], f(s, BRASS), Math.max(1.5, ow(0.8)));

  // ---- the head: a brass-rimmed clock face with two glowing eyes; hands run backward in phase 1
  ctx.save();
  ctx.translate(headX, headY);
  ctx.scale(1.18, 1.18);
  const hr = 0.3 * r;
  if (!back) {
    oval(ctx, 0, 0, hr, hr, f(s, BRASS), { under: f(s, BRASS_D), uf: 0.3 });
    oval(ctx, 0, 0, hr * 0.8, hr * 0.8, f(s, IVORY), { under: f(s, '#d6caa6'), uf: 0.3, w: 0.7 });
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = Math.max(1, ow(0.45));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const k = i % 3 === 0 ? 0.56 : 0.64;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * hr * k, Math.sin(a) * hr * k);
      ctx.lineTo(Math.cos(a) * hr * 0.74, Math.sin(a) * hr * 0.74);
      ctx.stroke();
    }
    ctx.restore();
    const ex = fx * hr * 0.12;
    const ey = -hr * 0.2 + fy * hr * 0.08;
    const ek = 1 + R * 0.5 + (attacking ? ak * 0.3 : 0);
    glowEye(ctx, ex - hr * 0.32, ey, hr * 0.18 * ek, hr * 0.08 * ek, attacking && ag && !dash ? ag : eye, 0.3, 1);
    glowEye(ctx, ex + hr * 0.32, ey, hr * 0.18 * ek, hr * 0.08 * ek, attacking && ag && !dash ? ag : eye, -0.3, 1);
    // the hands: a stern moustache at rest, spinning backward in the rewind
    const minute = p2 ? -s.t * 7 : R > 0 ? -0.6 : Math.PI * 0.62 + Math.sin(s.t * 0.5) * 0.04;
    const hour = p2 ? -s.t * 0.6 : R > 0 ? Math.PI + 0.6 : Math.PI * 1.38;
    ctx.save();
    ctx.lineCap = 'round';
    for (const [a, l, wd] of [[minute, 0.66, 0.09], [hour, 0.46, 0.12]] as const) {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = hr * wd;
      ctx.beginPath();
      ctx.moveTo(0, hr * 0.15);
      ctx.lineTo(Math.cos(a) * hr * l, hr * 0.15 + Math.sin(a) * hr * l);
      ctx.stroke();
    }
    ctx.restore();
    oval(ctx, 0, hr * 0.15, hr * 0.09, hr * 0.09, f(s, BRASS), { under: null, w: 0.5 });
    glint(ctx, -hr * 0.45, -hr * 0.5, hr * 0.1, 0.7);
  } else {
    oval(ctx, 0, 0, hr, hr, f(s, BRASS), { under: f(s, BRASS_D), uf: 0.4 });
    cog(ctx, 0, 0, hr * 0.55, hr * 0.42, 8, -turn * 2, f(s, BRASS_D), 1, 0.7);
  }
  // the hat: wide brim, a tall crooked cone, a brass band with a turning gear
  shape(ctx, [-0.52 * r, -0.22 * r, -0.2 * r, -0.33 * r, 0.24 * r, -0.33 * r, 0.54 * r, -0.2 * r, 0.24 * r, -0.12 * r, -0.22 * r, -0.12 * r], f(s, '#2e2838'), { smooth: true, under: f(s, ROBE_D), uf: 0.5 });
  const tip = Math.sin(s.t * 1.7) * 0.03 * r - R * 0.1 * r;
  shape(ctx, [-0.27 * r, -0.26 * r, -0.16 * r, -0.62 * r, -0.04 * r, -0.92 * r, 0.12 * r + tip, -1.1 * r, -0.2 * r + tip, -1.2 * r, 0.06 * r, -0.86 * r, 0.16 * r, -0.6 * r, 0.27 * r, -0.26 * r], f(s, ROBE), { under: f(s, ROBE_D), uf: 0.35, hi: s.flash ? null : withAlpha('#ffffff', 0.08) });
  shape(ctx, [-0.27 * r, -0.27 * r, 0.27 * r, -0.27 * r, 0.24 * r, -0.38 * r, -0.24 * r, -0.38 * r], f(s, BRASS), { under: null, w: 0.7 });
  cog(ctx, 0.12 * r, -0.33 * r, r * 0.11, r * 0.075, 7, turn * 3, f(s, '#d8b860'), 1, 0.7);
  oval(ctx, 0.12 * r, -0.33 * r, r * 0.03, r * 0.03, f(s, hub), { under: null, w: 0.4 });
  cog(ctx, -0.1 * r, -0.62 * r, r * 0.07, r * 0.05, 6, -turn * 4, f(s, BRASS_D), 1, 0.6);
  ctx.restore();

  // ---- the staff arm and the staff: a caged hourglass on top, a pendulum swinging beneath it
  const hx = sX * r + lx;
  const hy = sY * r;
  const dx = Math.cos(stA);
  const dy = Math.sin(stA);
  const topX = hx + dx * r * 0.95;
  const topY = hy + dy * r * 0.95;
  stick(ctx, hx - dx * r * 0.62, hy - dy * r * 0.62, topX, topY, r * 0.07, f(s, STEEL));
  arm2(ctx, fsX, shY, hx, hy, r * 0.36, r * 0.36, -1, r * 0.18, r * 0.22, r * 0.3, f(s, ROBE));
  shape(ctx, [hx - dy * r * 0.15 - dx * r * 0.04, hy + dx * r * 0.15 - dy * r * 0.04, hx + dy * r * 0.15 - dx * r * 0.04, hy - dx * r * 0.15 - dy * r * 0.04, hx + dy * r * 0.15 + dx * r * 0.03, hy - dx * r * 0.15 + dy * r * 0.03, hx - dy * r * 0.15 + dx * r * 0.03, hy + dx * r * 0.15 + dy * r * 0.03], f(s, BRASS), { under: null, w: 0.7 });
  oval(ctx, hx, hy, r * 0.09, r * 0.08, f(s, BRASS), { w: 0.7 });
  const head = attacking && ag && !dash ? ag : p2 ? REWIND : VOID.glow;
  const hk = attacking && !dash ? ak : 0;
  const gx = topX + dx * r * 0.16;
  const gy = topY + dy * r * 0.16;
  glow(ctx, gx, gy, r * (0.45 + hk * 0.55 + R * 0.4), head, 0.6 + hk * 0.35);
  // the cage: a brass ring with the hourglass inside, sand running (backward in the rewind)
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(stA + Math.PI / 2);
  const cg = r * 0.2;
  shape(ctx, [-cg * 0.7, -cg, cg * 0.7, -cg, 0, 0], s.flash ? '#ffffff' : withAlpha('#e8f0ff', 0.85), { under: null, w: 0.6 });
  shape(ctx, [-cg * 0.7, cg, cg * 0.7, cg, 0, 0], s.flash ? '#ffffff' : withAlpha('#e8f0ff', 0.85), { under: null, w: 0.6 });
  const sand = p2 ? 0.5 + 0.5 * Math.sin(-s.t * 2) : 0.5 + 0.5 * Math.sin(s.t * 0.7);
  shape(ctx, [-cg * 0.5 * sand, cg - cg * 0.7 * sand, cg * 0.5 * sand, cg - cg * 0.7 * sand, cg * 0.68, cg * 0.97, -cg * 0.68, cg * 0.97], f(s, head), { under: null, w: 0 });
  shape(ctx, [-cg * 0.45 * (1 - sand), -cg * 0.3 * (1 - sand) - cg * 0.05, cg * 0.45 * (1 - sand), -cg * 0.3 * (1 - sand) - cg * 0.05, 0, -cg * 0.02], f(s, head), { under: null, w: 0 });
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = ow(1.5);
  ctx.beginPath();
  ctx.arc(0, 0, cg * 1.25, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = f(s, BRASS);
  ctx.lineWidth = ow(0.8);
  ctx.stroke();
  for (const k of [-1, 1]) shape(ctx, [-cg * 0.85, k * cg, cg * 0.85, k * cg, cg * 0.85, k * cg * 1.22, -cg * 0.85, k * cg * 1.22], f(s, BRASS), { under: null, w: 0.6 });
  ctx.restore();
  // spikes of the cage crown
  glint(ctx, gx - r * 0.06, gy - r * 0.08, r * 0.04, 0.8);
  // pendulum
  const swingA = Math.sin(s.t * (p2 ? -4 : 3)) * 0.55;
  const pdx = topX + Math.sin(swingA) * r * 0.42;
  const pdy = topY + Math.cos(swingA) * r * 0.42;
  stick(ctx, topX, topY, pdx, pdy, Math.max(1.5, r * 0.02), OUTLINE);
  oval(ctx, pdx, pdy, r * 0.08, r * 0.08, f(s, BRASS), { w: 0.7 });
  if (s.atk === 'magic' && attacking) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + s.t * 3;
      crackle(ctx, gx, gy, gx + Math.cos(a) * r * (0.5 + ak * 0.3), gy + Math.sin(a) * r * (0.5 + ak * 0.3), s.t, i, MAGIC.glow, Math.max(1, ow(0.5)));
    }
  }
  if (attacking && ag && !dash && s.pose === 'attack') glowLine(ctx, gx, gy, gx + Math.cos(aL) * r * 1.2, gy + Math.sin(aL) * r * 1.2, r * 0.3, ag, 0.5 * ak, 4);
  ctx.restore();

  if (R > 0) roarLines(ctx, s.x + side * headX, s.y + r * 0.26 - float + headY - r * 0.35, r * 0.85, R, s.t, p2 ? REWIND : LILAC);
  if (s.pose === 'stagger') dizzy(ctx, s.x + side * headX, s.y + r * 0.26 - float + headY - r * 1.0, r * 0.45, s.t);
});

// ---------------------------------------------------------------- the corner turrets (Laser Sweep comes from these)
// Seen from above, turned to aim: a brass mount bolted into the corner, a dark dome housing and a banded
// emitter barrel whose lens glows magic blue (the Laser Sweep is Magic).
registerDraw('tock_turret', (ctx, s) => {
  const r = begin(s);
  const charging = s.atk !== null && (s.pose === 'windup' || s.pose === 'attack');
  const lensCol = charging && s.atk ? ELEMENTS[s.atk].glow : MAGIC.glow;
  groundShadow(ctx, s.x, s.y + r * 0.3, r * 1.15, r * 0.6, 0.35);
  cog(ctx, s.x, s.y + r * 0.12, r * 1.18, r * 0.95, 10, s.t * 0.3, f(s, shade(BRASS, 0.62)));
  cog(ctx, s.x, s.y, r * 1.18, r * 0.95, 10, s.t * 0.3, f(s, BRASS_D));
  oval(ctx, s.x, s.y, r * 0.78, r * 0.78, f(s, '#2a2630'), { w: 0.8 });
  ctx.fillStyle = OUTLINE;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    ctx.beginPath();
    ctx.arc(s.x + Math.cos(a) * r * 0.62, s.y + Math.sin(a) * r * 0.62, Math.max(1.2, r * 0.06), 0, TAU);
    ctx.fill();
  }
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  ctx.save();
  ctx.translate(s.x, s.y - r * 0.2);
  ctx.rotate(s.facing);
  // the emitter barrel: steel, two brass bands, a flared lens hood
  shape(ctx, [0, -r * 0.42, r * 1.45, -r * 0.32, r * 1.6, -r * 0.44, r * 1.9, -r * 0.4, r * 1.9, r * 0.4, r * 1.6, r * 0.44, r * 1.45, r * 0.32, 0, r * 0.42], f(s, STEEL), { under: f(s, '#4a4a58'), uf: 0.45 });
  shape(ctx, [r * 0.65, -r * 0.4, r * 0.85, -r * 0.39, r * 0.85, r * 0.39, r * 0.65, r * 0.4], f(s, BRASS), { under: null, w: 0.7 });
  shape(ctx, [r * 1.1, -r * 0.37, r * 1.28, -r * 0.35, r * 1.28, r * 0.35, r * 1.1, r * 0.37], f(s, BRASS), { under: null, w: 0.7 });
  ctx.restore();
  // the dome housing with a glowing sight
  oval(ctx, s.x, s.y - r * 0.2, r * 0.68, r * 0.6, f(s, '#3e4652'), { hi: s.flash ? null : withAlpha('#ffffff', 0.2) });
  oval(ctx, s.x + fx * r * 0.25, s.y - r * 0.2 + fy * r * 0.2, r * 0.16, r * 0.14, s.flash ? '#ffffff' : lensCol, { under: null, w: 0.6 });
  const lx = s.x + fx * r * 1.9;
  const ly = s.y - r * 0.2 + fy * r * 1.9;
  glow(ctx, lx, ly, r * (0.9 + (charging ? 0.6 : 0)) + Math.sin(s.t * 6) * r * 0.12, lensCol, 0.85);
  oval(ctx, lx, ly, r * 0.24, r * 0.24, s.flash ? '#ffffff' : '#d8f0ff', { under: null, outline: OUTLINE, w: 0.7 });
  glint(ctx, s.x - r * 0.25, s.y - r * 0.5, r * 0.1, 0.8);
});
