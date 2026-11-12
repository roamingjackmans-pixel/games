// Boss draw functions for zones 1–3: The Caretaker, Mother Spore, The Bloatking (ART_AUDIO §2: thick
// outlines, flat two-tone fills, real silhouettes). Upright bosses are drawn in a local frame mirrored to the
// side they face (their weapon hand leads); s.phase 1 is each boss's dramatic second form. Poses: 'windup'
// raises, 'attack' strikes (trails glow in the attack's element colour), 'stagger' reels, 'roar' is the
// intro's hero stance.
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
  flame,
  glint,
  glow,
  glowEye,
  glowLine,
  groundShadow,
  hash,
  horn,
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
  stick,
  strokePts,
  tentacle,
  taper,
  teeth,
  trail,
  withAlpha,
} from '../shapesBoss';

/** Facing in a frame mirrored so the boss always faces +x: [side (±1), local facing angle in [−π/2, π/2]]. */
function mirrored(s: DrawState): [number, number] {
  const fx = Math.cos(s.facing);
  const side = fx >= 0 ? 1 : -1;
  return [side, Math.atan2(Math.sin(s.facing), Math.abs(fx))];
}

// ---------------------------------------------------------------- The Caretaker
// A hulking gravedigger: a boulder of a hunched back in a long tattered coat, the head jutting low and
// forward under a floppy moss-hung hat, face lost in shadow but for two lamp eyes, a hooked nose and an
// underbite of snaggle teeth. Long gorilla arms: a door-sized spade in the leading hand, a caged lantern
// dangling from the other. Phase 1: the lantern breaks into a burning fist, the moss on his back and hat
// goes up in flames, his eyes turn to fire and the hem smoulders.
const CT_COAT = '#4a4232';
const CT_HEM = '#2f2a20';
const CT_SKIN = '#8f9c80';
const CT_HAT = '#2a2620';
const CT_MOSS = '#5f8f3a';
const CT_IRON = '#7e858d';
const CT_WOOD = '#6e4c2c';
const CT_LAMP = '#ffcf6a';
const CT_FIRE = '#ff7a3a';
const CT_SOUL = '#5fd0ff';

// pose arrays (× r): [gripX, gripY, spadeAngle, lampX, lampY, hunch, headTilt, mouth]
/**
 * The look of a zone 1–2 boss's New Game+ third phase (D358, s.phase 2): a pulsing aura, two runic rings turning on the
 * floor in opposite ways, wisps orbiting the body (a short comet tail behind each) and motes rising off it.
 */
function overtimeAura(ctx: CanvasRenderingContext2D, s: DrawState, r: number, color: string, core: string, rings: number): void {
  const t = s.t;
  glow(ctx, s.x, s.y - r * 0.35, r * 3.3, color, 0.2 + Math.sin(t * 5) * 0.07);
  glow(ctx, s.x, s.y - r * 0.35, r * 1.7, core, 0.12 + Math.sin(t * 7 + 1) * 0.04);
  // runic rings on the floor
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.72);
  ctx.scale(1, 0.36);
  for (let k = 0; k < rings; k++) {
    const rad = r * (1.5 + k * 0.45);
    ctx.setLineDash([r * (0.2 + k * 0.05), r * 0.13]);
    ctx.lineDashOffset = -t * r * (0.7 + k * 0.2) * (k % 2 ? -1 : 1);
    ctx.strokeStyle = withAlpha(k ? core : color, 0.55 + Math.sin(t * 4 + k) * 0.2);
    ctx.lineWidth = Math.max(1.5, r * 0.045);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  // wisps orbiting, each trailing a few fading glows
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      const a = t * 1.35 - j * 0.11 + (i / 6) * TAU;
      const wx = s.x + Math.cos(a) * r * 1.4;
      const wy = s.y - r * 0.15 + Math.sin(a) * r * 0.55 + Math.sin(t * 2 + i) * r * 0.06;
      const k = 1 - j / 4;
      glow(ctx, wx, wy, r * (0.2 + 0.1 * k), j === 0 ? core : color, 0.8 * k);
    }
  }
  // motes rising
  for (let i = 0; i < 12; i++) {
    const k = (t * 0.45 + hash(i * 5)) % 1;
    const mx = s.x + (hash(i * 3 + 1) - 0.5) * r * 2.2 + Math.sin(t * 2 + i) * r * 0.1;
    const my = s.y + r * 0.7 - k * r * 2.5;
    glow(ctx, mx, my, r * 0.1, i % 3 ? color : core, 0.75 * (1 - k));
  }
}

const CT_REST = [1.0, -0.2, 1.45, -1.0, 0.1, 1, 0, 0];
const CT_RAISED = [0.55, -1.05, -2.4, -0.95, 0.05, 0.75, -0.12, 0.45];
const CT_LAMP_RAISED = [1.0, -0.22, 1.42, -0.62, -1.25, 0.7, -0.15, 0.55];
const CT_ROAR = [0.88, -1.02, -1.72, -1.32, -0.72, 0.1, -0.28, 1];
const CT_STAGGER = [1.08, 0.05, 1.15, -0.92, 0.32, 1.45, 0.4, 0.35];

registerDraw('boss_caretaker', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const p3 = s.phase >= 2; // D358: the third phase burns blue-white
  const FIRE = p3 ? CT_SOUL : CT_FIRE;
  const FL_O = p3 ? '#35b6ff' : '#ff5a1a';
  const FL_I = p3 ? '#eaffff' : '#ffd27a';
  const [side, aL] = mirrored(s);
  const back = Math.sin(s.facing) < -0.6;
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const lampThrow = s.atk === 'fire' && (s.pose === 'windup' || s.pose === 'attack');
  const w = poseWeights(s);
  const fx = Math.cos(aL);
  const fy = Math.sin(aL);
  // the struck pose follows the facing: the spade slams down along it (or the lantern is hurled along it)
  const struck = lampThrow ? [1.0, -0.22, 1.42, 0.45 + fx * 0.75, -0.5 + fy * 0.55, 0.85, 0.05, 0.6] : [0.55 + fx * 0.78, -0.42 + fy * 0.55, aL + 0.1, -0.95, 0.15, 1.25, 0.15, 0.8];
  const p = blendPose(CT_REST, lampThrow ? CT_LAMP_RAISED : CT_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, CT_STAGGER, 1);
  mixPose(p, CT_ROAR, R);
  const [gX, gY, spA, lX, lY, hunch, tilt, mouth] = p as [number, number, number, number, number, number, number, number];
  const bob = Math.sin(s.t * 2.2) * r * 0.02;
  const fire = p2 ? FIRE : CT_LAMP;
  const up = 1 - hunch; // standing taller (roar), negative = slumped (stagger)

  groundShadow(ctx, s.x, s.y + r * 0.72, r * 1.2, r * 0.42, 0.4);
  if (p3) overtimeAura(ctx, s, r, CT_SOUL, '#eaffff', 2);
  if (p2) glow(ctx, s.x, s.y - r * 0.3, r * 2.6, FIRE, 0.28 + Math.sin(s.t * 9) * 0.05);
  if (R > 0) glow(ctx, s.x, s.y - r * 0.5, r * 2.8, fire, 0.22 * R);

  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y);
  ctx.scale(side, 1);
  ctx.translate(0, r * 0.7);
  ctx.scale(1 + s.squash * 0.05, 1 - s.squash * 0.07);
  ctx.translate(0, -r * 0.7);

  const headX = (0.5 - up * 0.12 + fx * 0.06) * r;
  const headY = (-0.46 - up * 0.42 + fy * 0.04) * r + bob;
  const fsX = 0.34 * r;
  const fsY = (-0.34 - up * 0.22) * r + bob;
  const bsX = -0.66 * r;
  const bsY = (-0.5 - up * 0.12) * r + bob;
  const gx = gX * r;
  const gy = gY * r;

  // the spade: T-handle above the grip, shaft, broad riveted blade. Behind the body unless struck forward.
  const spadeFront = w[2] > 0.3 && !lampThrow;
  const drawSpade = (): void => {
    const dx = Math.cos(spA);
    const dy = Math.sin(spA);
    const hx = gx - dx * r * 0.5;
    const hy = gy - dy * r * 0.5;
    const nx = gx + dx * r * 0.62;
    const ny = gy + dy * r * 0.62;
    const bl = r * 0.8;
    const bw = r * 0.32;
    const tx = nx + dx * bl;
    const ty = ny + dy * bl;
    if (ag && !lampThrow) {
      if (s.pose === 'attack') {
        const ra = CT_RAISED[2]!;
        const rx0 = CT_RAISED[0]! * r + Math.cos(ra) * r * 0.95;
        const ry0 = CT_RAISED[1]! * r + Math.sin(ra) * r * 0.95;
        const mx = (nx + tx) / 2;
        const my = (ny + ty) / 2;
        trail(ctx, fsX, fsY, Math.hypot(mx - fsX, my - fsY) + bl * 0.5, bl * 1.2, Math.atan2(ry0 - fsY, rx0 - fsX), Math.atan2(my - fsY, mx - fsX), ag, ak);
      }
      glowLine(ctx, nx, ny, tx, ty, r * 0.45, ag, 0.5 * ak, 3);
    }
    stick(ctx, hx, hy, nx, ny, r * 0.09, f(s, CT_WOOD));
    stick(ctx, hx - dy * r * 0.13, hy + dx * r * 0.13, hx + dy * r * 0.13, hy - dx * r * 0.13, r * 0.08, f(s, CT_WOOD));
    const px = -dy;
    const py = dx;
    const blade = [
      nx + px * bw * 0.45, ny + py * bw * 0.45,
      nx + dx * bl * 0.12 + px * bw, ny + dy * bl * 0.12 + py * bw,
      nx + dx * bl * 0.8 + px * bw * 0.92, ny + dy * bl * 0.8 + py * bw * 0.92,
      tx + px * bw * 0.15, ty + py * bw * 0.15,
      tx - px * bw * 0.25 - dx * bl * 0.06, ty - py * bw * 0.25 - dy * bl * 0.06,
      nx + dx * bl * 0.8 - px * bw * 0.92, ny + dy * bl * 0.8 - py * bw * 0.92,
      nx + dx * bl * 0.12 - px * bw, ny + dy * bl * 0.12 - py * bw,
      nx - px * bw * 0.45, ny - py * bw * 0.45,
    ];
    shape(ctx, blade, f(s, CT_IRON), { under: f(s, '#5a6068'), hi: s.flash ? null : '#a8aeb5' });
    shape(ctx, [nx + px * bw * 0.5, ny + py * bw * 0.5, nx + dx * bl * 0.22 + px * bw * 0.4, ny + dy * bl * 0.22 + py * bw * 0.4, nx + dx * bl * 0.22 - px * bw * 0.4, ny + dy * bl * 0.22 - py * bw * 0.4, nx - px * bw * 0.5, ny - py * bw * 0.5], f(s, '#5d6168'), { under: null, w: 0.7 });
    strokePts(ctx, [nx + dx * bl * 0.28, ny + dy * bl * 0.28, nx + dx * bl * 0.78, ny + dy * bl * 0.78], withAlpha('#ffffff', 0.35), ow(0.7));
    // grave dirt caked on the tip
    shape(ctx, [tx - px * bw * 0.28, ty - py * bw * 0.28, tx - dx * bl * 0.25 - px * bw * 0.7, ty - dy * bl * 0.25 - py * bw * 0.7, tx - dx * bl * 0.32 + px * bw * 0.35, ty - dy * bl * 0.32 + py * bw * 0.35, tx + px * bw * 0.15, ty + py * bw * 0.15], f(s, '#4a3a28'), { under: null, w: 0.6 });
  };
  if (!spadeFront) drawSpade();

  // the lantern arm (behind the body), its lantern or burning fist
  const lx = lX * r;
  const ly = lY * r + bob;
  arm2(ctx, bsX, bsY, lx, ly, r * 0.46, r * 0.46, 1, r * 0.3, r * 0.25, r * 0.2, f(s, shade(CT_COAT, 0.8)));
  const lampCol = lampThrow && ag ? ag : fire;
  if (!p2) {
    const chain = r * 0.14;
    const lcy = ly + chain + r * 0.17;
    glow(ctx, lx, lcy, r * (lampThrow ? 1.7 : 1.1) * (0.92 + Math.sin(s.t * 6) * 0.06), lampCol, lampThrow ? 0.55 + ak * 0.4 : 0.6);
    stick(ctx, lx, ly, lx, ly + chain, Math.max(1.5, r * 0.025), '#2a2420');
    shape(ctx, [lx - r * 0.08, lcy - r * 0.17, lx + r * 0.08, lcy - r * 0.17, lx + r * 0.14, lcy - r * 0.1, lx - r * 0.14, lcy - r * 0.1], f(s, '#3a3430'), { under: null, w: 0.8 });
    shape(ctx, [lx - r * 0.12, lcy - r * 0.1, lx + r * 0.12, lcy - r * 0.1, lx + r * 0.1, lcy + r * 0.13, lx - r * 0.1, lcy + r * 0.13], s.flash ? '#ffffff' : '#ffe39a', { under: null, w: 0.8 });
    flame(ctx, lx, lcy + r * 0.08, r * 0.17, r * 0.09, s.t, 1, lampThrow && ag ? ag : '#ff9b2e', '#fff6c8', 0);
    strokePts(ctx, [lx, lcy - r * 0.1, lx, lcy + r * 0.13], '#3a3430', Math.max(1.5, r * 0.03));
    shape(ctx, [lx - r * 0.13, lcy + r * 0.12, lx + r * 0.13, lcy + r * 0.12, lx + r * 0.1, lcy + r * 0.19, lx - r * 0.1, lcy + r * 0.19], f(s, '#3a3430'), { under: null, w: 0.8 });
  }
  oval(ctx, lx, ly, r * 0.14, r * 0.13, f(s, CT_SKIN));
  if (p2) {
    glow(ctx, lx, ly - r * 0.15, r * (lampThrow ? 1.6 : 1.0), lampCol, 0.75);
    for (let i = 0; i < 3; i++) flame(ctx, lx + (i - 1) * r * 0.09, ly - r * 0.02, r * (0.32 + (i === 1 ? 0.16 : 0)) * (lampThrow ? 1.5 : 1), r * 0.13, s.t, i + 2, lampThrow && ag ? ag : FL_O, FL_I);
  }

  // boots and the ragged coat skirt (smouldering in phase 1)
  const step = Math.sin(s.t * 6) * r * 0.06 * s.moving;
  oval(ctx, -0.34 * r - step, 0.7 * r, r * 0.21, r * 0.12, f(s, '#1f1b16'), { w: 0.8 });
  oval(ctx, 0.4 * r + step, 0.72 * r, r * 0.21, r * 0.12, f(s, '#1f1b16'), { w: 0.8 });
  const skirt = [-0.66 * r, 0.05 * r, -0.92 * r, 0.5 * r, ...raggedEdge(-0.92 * r, 0.9 * r, 0.5 * r, 0.18 * r, 6, 3, s.t), 0.9 * r, 0.5 * r, 0.64 * r, 0.05 * r];
  shape(ctx, skirt, f(s, CT_HEM), { uf: 0.5 });
  if (p2) for (let i = 0; i < 6; i++) glow(ctx, (-0.82 + i * 0.33) * r, 0.62 * r, r * 0.22, FIRE, 0.35 + 0.25 * Math.sin(s.t * 7 + i * 2));

  // the torso: a boulder of a hunched back with the front shoulder rolled forward
  const torso = [
    -0.96 * r, 0.02 * r,
    -0.92 * r, (-0.5 - up * 0.08) * r + bob,
    -0.5 * r, (-0.94 - up * 0.1) * r + bob,
    0.1 * r, (-0.9 - up * 0.2) * r + bob,
    0.6 * r, (-0.62 - up * 0.25) * r + bob,
    0.78 * r, -0.22 * r + bob,
    0.6 * r, 0.24 * r,
    -0.72 * r, 0.24 * r,
  ];
  shape(ctx, torso, f(s, CT_COAT), { smooth: true, uf: 0.4, hi: s.flash ? null : withAlpha('#ffffff', 0.08) });
  // a stitched patch on the hump, the coat's centre seam
  shape(ctx, [-0.62 * r, -0.62 * r + bob, -0.26 * r, -0.74 * r + bob, -0.2 * r, -0.36 * r + bob, -0.58 * r, -0.3 * r + bob], f(s, '#5f4f34'), { under: null, w: 0.7 });
  ctx.save();
  ctx.setLineDash([Math.max(2, r * 0.045), Math.max(2, r * 0.045)]);
  strokePts(ctx, [-0.57 * r, -0.58 * r + bob, -0.29 * r, -0.68 * r + bob, -0.25 * r, -0.4 * r + bob, -0.54 * r, -0.35 * r + bob, -0.57 * r, -0.58 * r + bob], '#c8b890', Math.max(1, r * 0.022));
  ctx.restore();
  strokePts(ctx, [0.28 * r, -0.4 * r + bob, 0.3 * r, 0.2 * r], shade(CT_COAT, 0.6), ow(0.8));
  // rope belt and a ring of grave keys
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = r * 0.1 + ow(1.4);
  ctx.beginPath();
  ctx.moveTo(-0.74 * r, 0.12 * r);
  ctx.quadraticCurveTo(0, 0.26 * r, 0.64 * r, 0.1 * r);
  ctx.stroke();
  ctx.strokeStyle = f(s, '#8a7a52');
  ctx.lineWidth = r * 0.1;
  ctx.stroke();
  ctx.restore();
  const kx = -0.36 * r;
  const ky = 0.24 * r;
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = ow(1.3);
  ctx.beginPath();
  ctx.arc(kx, ky, r * 0.09, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = f(s, '#b8a060');
  ctx.lineWidth = ow(0.6);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const a = 1.2 + i * 0.35 + Math.sin(s.t * 3 + i) * 0.08;
    const k0x = kx + Math.cos(a) * r * 0.09;
    const k0y = ky + Math.sin(a) * r * 0.09;
    stick(ctx, k0x, k0y, k0x + Math.cos(a) * r * 0.2, k0y + Math.sin(a) * r * 0.2, Math.max(2, r * 0.04), f(s, '#b8a060'));
  }
  // moss over the hump (phase 0) or burning (phase 1)
  for (const [mx0, my0, k] of [[-0.62, -0.8, 1.1], [0.0, -0.86, 0.9], [0.5, -0.66, 0.75]] as const) {
    const mx = mx0 * r;
    const my = (my0 - up * 0.12) * r + bob;
    const sz = r * k;
    if (!p2) {
      shape(ctx, [mx - 0.24 * sz, my, mx - 0.1 * sz, my - 0.1 * sz, mx + 0.16 * sz, my - 0.08 * sz, mx + 0.24 * sz, my + 0.04 * sz, mx + 0.18 * sz, my + 0.2 * sz, mx + 0.08 * sz, my + 0.1 * sz, mx - 0.02 * sz, my + 0.28 * sz, mx - 0.1 * sz, my + 0.1 * sz, mx - 0.2 * sz, my + 0.18 * sz], f(s, CT_MOSS), { smooth: true, under: f(s, '#3f6a2a'), w: 0.8 });
    } else {
      shape(ctx, [mx - 0.22 * sz, my + 0.04 * sz, mx, my - 0.08 * sz, mx + 0.22 * sz, my + 0.06 * sz, mx + 0.1 * sz, my + 0.14 * sz, mx - 0.12 * sz, my + 0.14 * sz], f(s, '#241a12'), { smooth: true, under: null, w: 0.8 });
      glow(ctx, mx, my - 0.1 * r, r * 0.55 * k, FIRE, 0.6);
      for (let i = 0; i < 3; i++) flame(ctx, mx + (i - 1) * 0.13 * sz, my + 0.03 * sz, r * (0.26 + hash(i + mx0 * 9) * 0.2) * k, r * 0.13 * k, s.t, i * 3 + mx0 * 7, FL_O, FL_I);
    }
  }

  // the spade arm, in front of the body (the head juts over it)
  if (spadeFront) drawSpade();
  arm2(ctx, fsX, fsY, gx, gy, r * 0.46, r * 0.46, 1, r * 0.34, r * 0.27, r * 0.21, f(s, CT_COAT));
  oval(ctx, gx, gy, r * 0.16, r * 0.14, f(s, CT_SKIN));
  strokePts(ctx, [gx - r * 0.08, gy - r * 0.02, gx + r * 0.02, gy + r * 0.06], OUTLINE, ow(0.6));
  strokePts(ctx, [gx - r * 0.04, gy - r * 0.08, gx + r * 0.07, gy - r * 0.01], OUTLINE, ow(0.6));

  // the head, jutting low from the front of the hump: hooked nose, shadowed face, lamp eyes, snaggle jaw
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(tilt * 0.7);
  ctx.scale(1.22, 1.22);
  if (!back) {
    ctx.save();
    ctx.translate(0, 0.09 * r);
    oval(ctx, 0.02 * r, -0.02 * r, 0.27 * r, 0.22 * r, f(s, '#15120e'), { under: null });
    // the jaw drops to roar
    const jd = mouth * 0.13 * r;
    if (mouth > 0.05) {
      shape(ctx, [-0.16 * r, 0.04 * r, 0.2 * r, 0.04 * r, 0.16 * r, 0.1 * r + jd, -0.12 * r, 0.1 * r + jd], '#2a0a08', { smooth: true, under: null, w: 0.8 });
      teeth(ctx, -0.13 * r, 0.05 * r, 0.17 * r, 0.05 * r, 6, 0.045 * r, -1, '#d8d0b0');
    }
    shape(ctx, [-0.17 * r, 0.06 * r + jd, 0.22 * r, 0.05 * r + jd, 0.2 * r, 0.16 * r + jd, 0.06 * r, 0.23 * r + jd, -0.12 * r, 0.18 * r + jd], f(s, CT_SKIN), { smooth: true, uf: 0.5 });
    horn(ctx, -0.08 * r, 0.08 * r + jd, -1.75, 0.11 * r, 0.05 * r, 0.25, f(s, '#e8e0c0'), 0.7);
    horn(ctx, 0.14 * r, 0.075 * r + jd, -1.4, 0.13 * r, 0.055 * r, -0.2, f(s, '#e8e0c0'), 0.7);
    const ex = fx * 0.05 * r;
    const ey = -0.06 * r + fy * 0.02 * r;
    const eyeK = 1 + R * 0.45;
    glowEye(ctx, ex - 0.08 * r, ey, 0.075 * r * eyeK, 0.04 * r * eyeK, fire, 0.35, p2 ? 1.2 : 0.9);
    glowEye(ctx, ex + 0.12 * r, ey - 0.005 * r, 0.08 * r * eyeK, 0.042 * r * eyeK, fire, -0.35, p2 ? 1.2 : 0.9);
    horn(ctx, 0.06 * r + fx * 0.05 * r, -0.03 * r, 1.0 + fy * 0.3, 0.2 * r, 0.09 * r, 0.6, f(s, CT_SKIN), 0.8);
    ctx.restore();
  }
  // the hat: a dented crown and a wide drooping brim
  shape(ctx, [-0.27 * r, -0.2 * r, -0.24 * r, -0.56 * r, -0.08 * r, -0.66 * r, 0.02 * r, -0.58 * r, 0.14 * r, -0.66 * r, 0.27 * r, -0.54 * r, 0.3 * r, -0.2 * r], f(s, CT_HAT), { smooth: true, uf: 0.3 });
  shape(ctx, [-0.26 * r, -0.31 * r, 0.29 * r, -0.31 * r, 0.29 * r, -0.21 * r, -0.26 * r, -0.21 * r], f(s, '#4a3a26'), { under: null, w: 0.7 });
  const brim = [-0.62 * r, -0.1 * r, -0.4 * r, -0.26 * r, 0.0, -0.3 * r, 0.42 * r, -0.26 * r, 0.66 * r, -0.1 * r, 0.5 * r, -0.02 * r, 0.1 * r, -0.08 * r, -0.4 * r, -0.02 * r];
  shape(ctx, brim, f(s, shade(CT_HAT, 1.2)), { smooth: true, uf: 0.5 });
  if (!p2) {
    for (const i of [0, 3]) {
      const bx = (-0.5 + i * 0.34) * r;
      const len = (0.1 + hash(i * 3) * 0.12) * r + Math.sin(s.t * 2 + i) * r * 0.01;
      shape(ctx, [bx - 0.05 * r, -0.08 * r, bx + 0.05 * r, -0.08 * r, bx + 0.02 * r, -0.06 * r + len, bx - 0.01 * r, -0.04 * r + len * 1.1], f(s, CT_MOSS), { under: null, w: 0.6 });
    }
  } else {
    for (let i = 0; i < 4; i++) flame(ctx, (-0.5 + i * 0.36) * r, -0.14 * r, r * (0.2 + hash(i + 9) * 0.14), r * 0.11, s.t, i + 20, FL_O, FL_I);
  }
  ctx.restore();
  ctx.restore();

  if (R > 0) roarLines(ctx, s.x + side * headX, s.y + headY - r * 0.25, r * 0.75, R, s.t, p2 ? FIRE : '#ffe8b0');
  if (s.pose === 'stagger') dizzy(ctx, s.x + side * headX, s.y + headY - r * 0.8, r * 0.45, s.t);
});

// ---------------------------------------------------------------- Mother Spore
// A cathedral-sized toadstool: a scalloped purple bell of a cap over glowing gills, a ragged skirt, and a
// face in the fat pale stalk (deep slanted sockets, glowing pupils, a gaping mouth). Roots grip the floor;
// two sucker-lined tendrils hang from under the cap and lash along the facing. Phase 1: the cap tears in two
// and a toothed, toxic-green maw opens in the split; the gills and eyes go toxic and spores pour down.
const MS_CAP = '#7a4a8a';
const MS_CAP_D = '#553062';
const MS_GILL = '#3c2150';
const MS_STALK = '#e6d6bc';
const MS_STALK_D = '#bca686';
const MS_ROOT = '#5e3c62';
const MS_SPOT = '#ead6f2';
const MS_TEAL = '#5fd3c0';
const MS_TOX = '#c8f06a';
const MS_BLOOM = '#ff6bd6';
const MS_GOLD = '#ffe27a';
const MS_TENDRIL = '#8a5a96';

// pose arrays: [lift, mouth, flare, leadTipX, leadTipY, offTipX, offTipY, tilt] (tips × r, lead side +x)
const MS_REST = [0, 0.15, 0, 1.0, 0.5, -1.0, 0.5, 0];
const MS_RAISED = [0.22, 0.55, 0.25, 0.75, -1.55, -1.05, 0.2, -0.04];
const MS_ROAR = [0.12, 1, 1, 1.3, -1.4, -1.3, -1.4, 0];
const MS_STAGGER = [-0.04, 0.3, -0.3, 0.9, 0.62, -0.9, 0.62, 0.3];

/** One half of the cap (side −1 left, +1 right) in cap-local units (origin at the cap's bottom centre). */
function capHalf(side: number, flare: number): number[] {
  const out: number[] = [];
  const lift = flare * 0.16;
  for (let i = 0; i <= 4; i++) {
    const k = i / 4;
    out.push(side * (1.38 - k * 1.3), (i % 2 === 1 ? 0.1 : -0.02) - lift * (1 - k));
  }
  // the torn edge up the middle
  out.push(side * 0.14, -0.22, side * 0.04, -0.4, side * 0.15, -0.58, side * 0.02, -0.78 - flare * 0.1);
  out.push(side * 0.5, -0.74 - flare * 0.1, side * 1.05, -0.5 - flare * 0.05, side * 1.34, -0.12 - lift);
  return out;
}

function capFull(flare: number): number[] {
  const out: number[] = [];
  const lift = flare * 0.16;
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    out.push(-1.38 + k * 2.76, (i % 2 === 1 ? 0.1 : -0.02) - lift * Math.abs(k * 2 - 1));
  }
  out.push(1.34, -0.12 - lift, 1.06, -0.52 - flare * 0.05, 0.5, -0.76 - flare * 0.1, 0, -0.8 - flare * 0.12, -0.5, -0.76 - flare * 0.1, -1.06, -0.52 - flare * 0.05, -1.34, -0.12 - lift);
  return out;
}

function scaled(pts: number[], ox: number, oy: number, r: number): number[] {
  const out = new Array<number>(pts.length);
  for (let i = 0; i < pts.length; i += 2) {
    out[i] = ox + pts[i]! * r;
    out[i + 1] = oy + pts[i + 1]! * r;
  }
  return out;
}

registerDraw('boss_mother_spore', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const p3 = s.phase >= 2; // D358: the third phase blooms magenta and gold
  const TOX = p3 ? MS_BLOOM : MS_TOX;
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const w = poseWeights(s);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const side = fx >= 0 ? 1 : -1;
  const baseX = side * 0.42;
  const baseY = -0.28;
  const struck = [-0.04, 0.85, -0.1, baseX + fx * 2.3, baseY + fy * 2.0, -1.0, 0.42, 0.04];
  const p = blendPose(MS_REST, MS_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, MS_STAGGER, 1);
  mixPose(p, MS_ROAR, R);
  const [lift, mouth, flare, ltx, lty, otx, oty, tilt] = p as [number, number, number, number, number, number, number, number];
  const glowC = p2 ? TOX : MS_TEAL;
  const sway = Math.sin(s.t * 1.3) * r * 0.03;
  const L = lift * r;
  const ox = s.x + roarShake(s, r);
  const oy = s.y - L;

  groundShadow(ctx, s.x, s.y + r * 0.68, r * 1.45, r * 0.5, 0.42);
  if (p3) overtimeAura(ctx, s, r, MS_BLOOM, MS_GOLD, 3);
  if (p2) glow(ctx, s.x, s.y - r * 0.8, r * 2.8, TOX, 0.22 + Math.sin(s.t * 3) * 0.06);
  if (R > 0) glow(ctx, s.x, s.y - r * 0.6, r * 3.2 * R, glowC, 0.25 * R);

  // roots gripping the floor (they dangle when she lifts)
  for (let i = 0; i < 7; i++) {
    const a = 0.15 + (i / 6) * (Math.PI - 0.3);
    const cx = Math.cos(a);
    const x0 = ox + cx * r * 0.42;
    const y0 = oy + r * 0.56;
    const reach = 1.35 + hash(i) * 0.3;
    const x3 = s.x + cx * r * reach;
    const y3 = s.y + r * (0.62 + Math.sin(a) * 0.32) + L * 0.4;
    tentacle(ctx, x0, y0, x0 + cx * r * 0.4, y0 + r * 0.05, x3 - cx * r * 0.3, y3 - r * 0.12 + Math.sin(s.t * 1.5 + i) * r * 0.03, x3, y3, r * 0.17, r * 0.03, f(s, MS_ROOT), f(s, shade(MS_ROOT, 0.7)));
  }

  const tendril = (tipX: number, tipY: number, sd: number, lead: boolean): void => {
    const bx = ox + sd * 0.42 * r;
    const by = oy + baseY * r;
    const tx = ox + tipX * r;
    const ty = oy + tipY * r + (lead ? 0 : Math.sin(s.t * 1.7) * r * 0.04);
    const dx = tx - bx;
    const dy = ty - by;
    const wob = Math.sin(s.t * 2.1 + sd) * r * 0.18;
    if (lead && ag) {
      if (s.pose === 'attack') trail(ctx, bx, by, Math.hypot(dx, dy), r * 0.6, Math.atan2(MS_RAISED[4]! - baseY, MS_RAISED[3]! * side - baseX), Math.atan2(dy, dx), ag, ak);
      glow(ctx, tx, ty, r * 0.7, ag, 0.6 * ak);
    }
    tentacle(ctx, bx, by, bx + sd * r * 0.45, by + r * 0.1, bx + dx * 0.65 - dy * 0.2 + wob, by + dy * 0.65 + dx * 0.2 * sd, tx, ty, r * 0.24, r * 0.05, f(s, MS_TENDRIL), f(s, shade(MS_TENDRIL, 0.7)), s.flash ? null : withAlpha(MS_SPOT, 0.8));
    horn(ctx, tx, ty, Math.atan2(dy, dx) + sd * 0.6, r * 0.16, r * 0.07, sd * 0.9, f(s, '#d8c4a0'), 0.7);
  };
  const lt: [number, number] = [ltx * side, lty];
  const ot: [number, number] = [otx * side, oty];
  if (oty > -0.35) tendril(ot[0], ot[1], -side, false);
  if (lty > -0.35) tendril(lt[0], lt[1], side, true);

  // a couple of sporeling buds at her feet
  for (const [bx, by, k] of [[-0.72, 0.62, 0.22], [0.66, 0.66, 0.18], [-0.3, 0.74, 0.14]] as const) {
    const x = s.x + bx * r;
    const y = s.y + by * r;
    stick(ctx, x, y, x, y - k * r * 0.6, k * r * 0.35, f(s, MS_STALK));
    shape(ctx, [x - k * r * 0.6, y - k * r * 0.45, x, y - k * r * 1.05, x + k * r * 0.6, y - k * r * 0.45, x, y - k * r * 0.35], f(s, '#9a68aa'), { smooth: true, w: 0.7 });
  }

  // the stalk with its face
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(tilt * 0.3);
  ctx.translate(0, r * 0.6);
  ctx.scale(1 + s.squash * 0.05, 1 - s.squash * 0.08);
  ctx.translate(0, -r * 0.6);
  shape(ctx, [-0.62 * r, 0.62 * r, -0.4 * r, 0.42 * r, -0.33 * r, 0.0, -0.38 * r, -0.42 * r, 0.38 * r, -0.42 * r, 0.33 * r, 0.0, 0.4 * r, 0.42 * r, 0.62 * r, 0.62 * r, 0, 0.7 * r], f(s, MS_STALK), { smooth: true, under: f(s, MS_STALK_D), uf: 0.35 });
  // fibres
  for (const k of [-0.22, -0.08, 0.12, 0.25]) strokePts(ctx, [k * r, 0.5 * r, k * 0.9 * r, -0.05 * r, k * r, -0.35 * r], withAlpha('#8a7458', 0.35), Math.max(1, r * 0.018));
  // the face: slanted sockets, glowing pupils looking along the facing, a gaping mouth
  const lx = fx * 0.035 * r;
  const ly = fy * 0.02 * r;
  for (const k of [-1, 1]) {
    const ex = k * 0.15 * r;
    const ey = 0.02 * r;
    oval(ctx, ex, ey, 0.12 * r, 0.075 * r, f(s, '#1e1020'), { rot: -k * 0.4, under: null, w: 0.8 });
    glowEye(ctx, ex + lx, ey + ly + 0.005 * r, 0.05 * r * (1 + R * 0.3), 0.028 * r * (1 + R * 0.3), glowC, -k * 0.4, p2 ? 1.1 : 0.8);
    strokePts(ctx, [ex + k * 0.14 * r, ey - 0.13 * r, ex - k * 0.1 * r, ey - 0.05 * r], shade(MS_STALK_D, 0.55), ow(1.3));
  }
  const mh = (0.035 + mouth * 0.14) * r;
  const my = 0.3 * r;
  shape(ctx, [-0.17 * r, my - mh * 0.4, 0, my - mh * 0.6, 0.17 * r, my - mh * 0.4, 0.13 * r, my + mh * 0.7, 0, my + mh, -0.13 * r, my + mh * 0.7], '#1e0c18', { smooth: true, under: null, w: 0.9 });
  if (mouth > 0.25) {
    teeth(ctx, -0.13 * r, my - mh * 0.42, 0.13 * r, my - mh * 0.42, 5, 0.04 * r * mouth, -1, '#efe2c8');
    glow(ctx, 0, my + mh * 0.2, r * 0.3, glowC, 0.35 * mouth);
  }
  // drool of spores
  for (let i = 0; i < 3; i++) {
    const k = (s.t * 0.7 + i * 0.33) % 1;
    glint(ctx, (i - 1) * 0.06 * r, my + mh + k * r * 0.3, Math.max(1.2, r * 0.022), 0.6 * (1 - k));
  }
  // the ragged skirt under the cap
  shape(ctx, [-0.44 * r, -0.44 * r, 0.44 * r, -0.44 * r, ...raggedEdge(0.5 * r, -0.5 * r, -0.3 * r, 0.12 * r, 5, 11, s.t)], f(s, '#d9c6e6'), { under: f(s, '#b49cc4'), w: 0.9 });
  ctx.restore();

  // the cap: gills underneath, the scalloped bell on top (torn in two in phase 1)
  const cx = ox + sway;
  const cy = oy - 0.48 * r;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt * 0.6);
  oval(ctx, 0, 0.02 * r, 1.3 * r, 0.3 * r, f(s, p2 ? '#4a2a46' : MS_GILL), { under: null });
  ctx.save();
  ctx.strokeStyle = withAlpha(p2 ? TOX : '#8a5aa0', p2 ? 0.8 : 0.6);
  ctx.lineWidth = Math.max(1, r * 0.018);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 0.4 * r, 0.02 * r + Math.sin(a) * 0.08 * r);
    ctx.lineTo(Math.cos(a) * 1.22 * r, 0.02 * r + Math.sin(a) * 0.27 * r);
    ctx.stroke();
  }
  ctx.restore();
  if (p2) glow(ctx, 0, 0.05 * r, r * 1.3, TOX, 0.45 + Math.sin(s.t * 4) * 0.1);
  const capFill = f(s, p2 ? '#6a3a6e' : MS_CAP);
  const capUnder = f(s, p2 ? '#4a2450' : MS_CAP_D);
  const spots = (sd: number): void => {
    for (const [sx, sy, sr] of [[0.75, -0.3, 0.16], [0.35, -0.55, 0.12], [1.08, -0.12, 0.1], [0.5, -0.12, 0.09]] as const) {
      if (sd === 0) {
        for (const m of [-1, 1]) oval(ctx, m * sx * r, (sy - flare * 0.05) * r, sr * r, sr * r * 0.7, f(s, MS_SPOT), { w: 0.6, uf: 0.3 });
      } else oval(ctx, sd * sx * r, (sy - flare * 0.05) * r, sr * r, sr * r * 0.7, f(s, MS_SPOT), { w: 0.6, uf: 0.3 });
    }
  };
  if (!p2) {
    shape(ctx, scaled(capFull(flare), 0, 0, r), capFill, { smooth: true, under: capUnder, uf: 0.42, hi: s.flash ? null : withAlpha('#ffffff', 0.12) });
    spots(0);
    oval(ctx, 0, -0.62 * r, 0.14 * r, 0.1 * r, f(s, MS_SPOT), { w: 0.6, uf: 0.3 });
  } else {
    // the split: a toothed toxic maw opening between the halves
    const gape = 0.2 + mouth * 0.25 + Math.sin(s.t * 2.5) * 0.03;
    glow(ctx, 0, -0.4 * r, r * (1.1 + gape), TOX, 0.8);
    shape(ctx, [0, 0.0, gape * 0.9 * r, -0.3 * r, gape * 0.7 * r, -0.62 * r, 0, -0.86 * r, -gape * 0.7 * r, -0.62 * r, -gape * 0.9 * r, -0.3 * r], '#1a0a14', { smooth: true, under: null });
    shape(ctx, [0, -0.1 * r, gape * 0.5 * r, -0.35 * r, 0, -0.72 * r, -gape * 0.5 * r, -0.35 * r], s.flash ? '#ffffff' : TOX, { smooth: true, under: null, w: 0.6 });
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(sd * gape * 0.75 * r, 0);
      ctx.rotate(sd * gape * 0.5);
      shape(ctx, scaled(capHalf(sd, flare), 0, 0, r), capFill, { smooth: true, under: capUnder, uf: 0.42, hi: s.flash ? null : withAlpha('#ffffff', 0.1) });
      spots(sd);
      teeth(ctx, sd * 0.1 * r, -0.04 * r, sd * 0.08 * r, -0.74 * r, 6, 0.1 * r, -sd, '#efe2c8');
      // glowing veins
      strokePts(ctx, [sd * 0.2 * r, -0.2 * r, sd * 0.55 * r, -0.4 * r, sd * 0.95 * r, -0.3 * r], withAlpha(TOX, 0.7), Math.max(1.5, r * 0.025));
      ctx.restore();
    }
  }
  // bioluminescent dots along the rim
  for (let i = 0; i < 7; i++) {
    const k = i / 6;
    glow(ctx, (-1.15 + k * 2.3) * r, (0.08 + Math.sin(k * Math.PI) * 0.12) * r, r * 0.12, glowC, 0.5 + 0.3 * Math.sin(s.t * 3 + i));
  }
  ctx.restore();

  if (oty <= -0.35) tendril(ot[0], ot[1], -side, false);
  if (lty <= -0.35) tendril(lt[0], lt[1], side, true);

  // drifting spores
  const n = p2 ? 16 : 7;
  for (let i = 0; i < n; i++) {
    const a = s.t * 0.4 + i * 1.7;
    const d = r * (1.0 + ((s.t * 0.3 + i * 0.37) % 1) * 1.0 + R * 0.6);
    const sx = s.x + Math.cos(a) * d;
    const sy = cy + Math.sin(a) * d * 0.6 + (p2 ? ((s.t * 30 + i * 13) % (r * 1.2)) : -((s.t * 20 + i * 13) % (r * 0.6)));
    glow(ctx, sx, sy, Math.max(4, r * 0.08), glowC, 0.55);
  }
  if (R > 0) roarLines(ctx, s.x, oy - r * 0.95, r * 1.25, R, s.t, glowC);
  if (s.pose === 'stagger') dizzy(ctx, s.x, oy - r * 1.45, r * 0.6, s.t);
});

// ---------------------------------------------------------------- The Bloatking
// A bloated drowned monarch: a vast pear of a belly in sallow green, a sodden crimson cape with an ermine
// collar, a wide frog mouth and bulging drowned eyes, kelp for hair under a tilted barnacled crown, a gold
// scepter crowned with a pearl. Phase 0 he sits on a floating throne of wreckage (spired back, a broken
// ship's wheel, barrels, seaweed); phase 1 the throne has sunk and he swims, half under, cape spread on the
// water, mouth agape.
const BK_SKIN = '#7f9a78';
const BK_SKIN_D = '#5c7860';
const BK_BELLY = '#a9ba98';
const BK_CAPE = '#7a2236';
const BK_CAPE_D = '#521424';
const BK_ERMINE = '#ece6da';
const BK_GOLD = '#d6b84a';
const BK_GOLD_D = '#9a7a2a';
const BK_WOOD = '#5a4632';
const BK_WEED = '#3f6a3a';
const BK_WATER = '#9ad0d0';

// pose arrays (× r): [scepX, scepY, scepAngle, offX, offY, mouth, lean]
const BK_REST = [0.98, 0.02, -1.2, -0.5, 0.18, 0.1, 0];
const BK_RAISED = [0.72, -0.9, -2.35, -1.0, -0.45, 0.55, -0.06];
const BK_ROAR = [1.12, -0.95, -1.5, -1.28, -0.8, 1, -0.1];
const BK_STAGGER = [1.0, 0.25, -0.6, -0.8, 0.35, 0.35, 0.15];

registerDraw('boss_bloatking', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const [side, aL] = mirrored(s);
  const back = Math.sin(s.facing) < -0.6;
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const w = poseWeights(s);
  const fx = Math.cos(aL);
  const fy = Math.sin(aL);
  const struck = [0.58 + fx * 0.8, -0.25 + fy * 0.55, aL + 0.2, -0.88, 0.05, 0.9, 0.1];
  const p = blendPose(BK_REST, BK_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, BK_STAGGER, 1);
  mixPose(p, BK_ROAR, R);
  const [sX, sY, sA, oX, oY, mouth, lean] = p as [number, number, number, number, number, number, number];
  const bob = Math.sin(s.t * 1.6) * r * 0.05;
  const waterY = 0.3 * r;

  if (!p2) groundShadow(ctx, s.x, s.y + r * 0.85, r * 1.2, r * 0.36, 0.3);
  else {
    // swimming: a dark pool and rings on the water
    groundShadow(ctx, s.x, s.y + waterY, r * 1.5, r * 0.5, 0.35);
    ctx.save();
    ctx.lineWidth = Math.max(1.5, r * 0.035);
    for (let i = 0; i < 3; i++) {
      const k = (s.t * 0.8 + i / 3) % 1;
      ctx.strokeStyle = withAlpha(BK_WATER, 0.55 * (1 - k));
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + waterY, r * (1.1 + k * 0.9), r * (0.36 + k * 0.3), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (R > 0) glow(ctx, s.x, s.y - r * 0.6, r * 3, BK_GOLD, 0.2 * R);

  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y + (p2 ? r * 0.12 : 0) + bob);
  ctx.scale(side, 1);
  ctx.translate(0, r * 0.6);
  ctx.scale(1 + s.squash * 0.06, 1 - s.squash * 0.07);
  ctx.translate(0, -r * 0.6);
  ctx.rotate(lean * 0.4);

  if (!p2) {
    // the throne's back: wreckage planks rising into spires, a broken ship's wheel, hanging weed
    const tb = [-0.98, -0.1, -1.04, -1.05, -0.86, -1.42, -0.66, -1.1, -0.44, -1.6, -0.22, -1.22, 0, -1.78, 0.22, -1.22, 0.44, -1.6, 0.66, -1.1, 0.86, -1.42, 1.04, -1.05, 0.98, -0.1];
    shape(ctx, scaled(tb, 0, 0, r), f(s, BK_WOOD), { under: f(s, '#3e3022'), uf: 0.3 });
    for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) strokePts(ctx, [k * r, -0.15 * r, k * r * 1.02, (-1.1 - (Math.abs(k) < 0.1 ? 0.5 : 0.1)) * r], shade(BK_WOOD, 0.6), Math.max(1.5, r * 0.025));
    const wy = -1.12 * r;
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = r * 0.07 + ow(1.4);
    ctx.beginPath();
    ctx.arc(0, wy, r * 0.32, 0.4, TAU - 0.9);
    ctx.stroke();
    ctx.strokeStyle = f(s, '#7a5a3a');
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2;
      if (i === 6) continue;
      stick(ctx, Math.cos(a) * 0.08 * r, wy + Math.sin(a) * 0.08 * r, Math.cos(a) * 0.44 * r, wy + Math.sin(a) * 0.44 * r, r * 0.05, f(s, '#7a5a3a'));
    }
    oval(ctx, 0, wy, 0.1 * r, 0.1 * r, f(s, BK_GOLD_D), { w: 0.8 });
    for (const [x, len] of [[-0.8, 0.5], [-0.35, 0.35], [0.5, 0.45], [0.9, 0.3]] as const) {
      shape(ctx, [x * r - 0.05 * r, -1.0 * r, x * r + 0.05 * r, -1.0 * r, x * r + 0.03 * r + Math.sin(s.t * 1.5 + x) * r * 0.03, (-1.0 + len) * r, x * r - 0.02 * r, (-0.98 + len * 0.9) * r], f(s, BK_WEED), { under: null, w: 0.6 });
    }
    // the raft of wreckage he floats on: planks, a barrel, a crate, dripping weed
    shape(ctx, [-1.25 * r, 0.32 * r, 1.25 * r, 0.26 * r, 1.05 * r, 0.82 * r, -1.1 * r, 0.86 * r], f(s, BK_WOOD), { under: f(s, '#3a2c1e'), uf: 0.45 });
    for (let i = -2; i <= 2; i++) strokePts(ctx, [i * 0.42 * r, 0.3 * r, i * 0.38 * r, 0.84 * r], shade(BK_WOOD, 0.55), Math.max(1.5, r * 0.025));
    oval(ctx, -0.95 * r, 0.6 * r, 0.24 * r, 0.3 * r, f(s, '#6a4a2a'));
    for (const k of [-0.15, 0.15]) strokePts(ctx, [-1.18 * r, (0.6 + k) * r, -0.72 * r, (0.6 + k) * r], '#3a3a40', ow(0.9));
    shape(ctx, [0.62 * r, 0.42 * r, 1.08 * r, 0.4 * r, 1.08 * r, 0.8 * r, 0.62 * r, 0.82 * r], f(s, '#7a5a38'), { uf: 0.4 });
    strokePts(ctx, [0.62 * r, 0.42 * r, 1.08 * r, 0.8 * r], shade(BK_WOOD, 0.5), ow(0.7));
    for (let i = 0; i < 5; i++) {
      const x = (-0.8 + i * 0.4) * r;
      const len = (0.12 + hash(i + 4) * 0.14) * r;
      shape(ctx, [x - 0.05 * r, 0.82 * r, x + 0.05 * r, 0.82 * r, x + Math.sin(s.t * 2 + i) * r * 0.02, 0.84 * r + len], f(s, BK_WEED), { under: null, w: 0.6 });
      const k = (s.t * 0.8 + i * 0.21) % 1;
      glint(ctx, x + 0.12 * r, 0.9 * r + k * r * 0.3, Math.max(1.2, r * 0.02), 0.6 * (1 - k));
    }
    // armrests
    for (const k of [-1, 1]) shape(ctx, [k * 0.82 * r, -0.2 * r, k * 1.18 * r, -0.28 * r, k * 1.2 * r, 0.18 * r, k * 0.84 * r, 0.24 * r], f(s, shade(BK_WOOD, 1.1)), { uf: 0.4 });
  } else {
    // the cape spread out on the water around him
    shape(ctx, [-1.5 * r, waterY - 0.06 * r, -0.9 * r, waterY - 0.32 * r, 0, waterY - 0.38 * r, 0.9 * r, waterY - 0.32 * r, 1.5 * r, waterY - 0.04 * r, 1.1 * r, waterY + 0.22 * r, 0, waterY + 0.3 * r, -1.1 * r, waterY + 0.22 * r], f(s, BK_CAPE), { smooth: true, under: f(s, BK_CAPE_D), uf: 0.5 });
    ctx.save();
    ctx.strokeStyle = withAlpha(BK_WATER, 0.5);
    ctx.lineWidth = Math.max(1.5, r * 0.03);
    ctx.beginPath();
    ctx.ellipse(0, waterY, 1.25 * r, 0.3 * r, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.restore();
  }

  // the body (cut at the waterline while swimming)
  ctx.save();
  if (p2) {
    ctx.beginPath();
    ctx.rect(-3 * r, -4 * r, 6 * r, 4 * r + waterY);
    ctx.clip();
  }
  if (!p2) {
    // stubby legs and webbed feet dangling from the seat
    for (const k of [-1, 1]) {
      taper(ctx, k * 0.38 * r, 0.42 * r, k * 0.44 * r, 0.78 * r, r * 0.3, r * 0.22, f(s, BK_SKIN));
      shape(ctx, [k * 0.3 * r, 0.76 * r, k * 0.62 * r, 0.8 * r, k * 0.58 * r, 0.9 * r, k * 0.46 * r, 0.86 * r, k * 0.36 * r, 0.9 * r], f(s, BK_SKIN_D), { w: 0.8, under: null });
    }
  }
  // the cape behind the shoulders
  if (!p2) shape(ctx, [-1.0 * r, -0.55 * r, -1.22 * r, 0.42 * r, -0.4 * r, 0.5 * r, 0.4 * r, 0.5 * r, 1.22 * r, 0.42 * r, 1.0 * r, -0.55 * r, 0, -0.78 * r], f(s, BK_CAPE), { smooth: true, under: f(s, BK_CAPE_D), uf: 0.5 });
  // the off arm behind (when it is raised away from the belly)
  const offX = oX * r;
  const offY = oY * r;
  const offBehind = oY < -0.2;
  const offArm = (): void => {
    arm2(ctx, -0.72 * r, -0.4 * r, offX, offY, r * 0.42, r * 0.42, -1, r * 0.32, r * 0.27, r * 0.22, f(s, BK_SKIN));
    oval(ctx, offX, offY, r * 0.14, r * 0.12, f(s, BK_SKIN));
    claws(ctx, offX, offY, Math.atan2(offY + 0.4 * r, offX + 0.72 * r), r * 0.14, r * 0.07, 3, 1.2, 0.3, f(s, BK_SKIN_D));
  };
  if (offBehind) offArm();
  // the belly: a vast sallow pear with a pale paunch and a sagging fold
  const belly = [-0.95, 0.15, -0.9, -0.3, -0.6, -0.62, 0, -0.72, 0.6, -0.62, 0.92, -0.3, 0.98, 0.18, 0.7, 0.55, 0, 0.66, -0.7, 0.55];
  shape(ctx, scaled(belly, 0, 0, r), f(s, BK_SKIN), { smooth: true, under: f(s, BK_SKIN_D), uf: 0.38, hi: s.flash ? null : withAlpha('#ffffff', 0.1) });
  if (!back) {
    oval(ctx, 0.08 * r, 0.14 * r, 0.6 * r, 0.42 * r, f(s, BK_BELLY), { under: f(s, shade(BK_BELLY, 0.85)), w: 0 });
    strokePts(ctx, [-0.45 * r, 0.28 * r, 0, 0.4 * r, 0.52 * r, 0.26 * r], shade(BK_SKIN_D, 0.8), ow(0.8));
    oval(ctx, 0.1 * r, 0.12 * r, 0.04 * r, 0.03 * r, f(s, BK_SKIN_D), { under: null, w: 0.6 });
    // barnacles and a kelp sash
    for (const [x, y] of [[-0.62, -0.1], [-0.55, 0.06], [0.7, 0.22]] as const) oval(ctx, x * r, y * r, 0.05 * r, 0.04 * r, f(s, '#c8c0a8'), { w: 0.6, uf: 0.3 });
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = r * 0.09 + ow(1.4);
    ctx.beginPath();
    ctx.moveTo(-0.88 * r, -0.2 * r);
    ctx.quadraticCurveTo(0, 0.2 * r, 0.82 * r, 0.42 * r);
    ctx.stroke();
    ctx.strokeStyle = f(s, BK_WEED);
    ctx.lineWidth = r * 0.09;
    ctx.stroke();
    ctx.restore();
  }
  // the ermine collar
  shape(ctx, [-0.92 * r, -0.5 * r, -0.6 * r, -0.74 * r, 0, -0.8 * r, 0.6 * r, -0.74 * r, 0.92 * r, -0.5 * r, 0.6 * r, -0.4 * r, 0, -0.46 * r, -0.6 * r, -0.4 * r], f(s, BK_ERMINE), { smooth: true, under: f(s, '#c8c0b0'), uf: 0.4 });
  ctx.fillStyle = OUTLINE;
  for (const [x, y] of [[-0.62, -0.56], [-0.3, -0.62], [0.05, -0.64], [0.38, -0.62], [0.68, -0.55]] as const) {
    ctx.beginPath();
    ctx.ellipse(x * r, y * r, r * 0.025, r * 0.045, 0, 0, TAU);
    ctx.fill();
  }

  // the head: jowls, drowned eyes, a frog mouth, kelp hair, a tilted barnacled crown
  const hx = (0.06 + fx * 0.06) * r;
  const hy = -0.88 * r + fy * 0.03 * r;
  ctx.save();
  ctx.translate(hx, hy - 0.06 * r);
  ctx.scale(1.3, 1.3);
  // kelp hair hanging behind the jowls
  for (const k of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const x0 = k * (0.3 + i * 0.08) * r;
      tentacle(ctx, x0, -0.12 * r, x0 + k * 0.12 * r, 0.05 * r, x0 + k * 0.05 * r + Math.sin(s.t * 1.8 + i + k) * r * 0.05, 0.25 * r, x0 + k * 0.1 * r, 0.42 * r, r * 0.08, r * 0.02, f(s, BK_WEED), null);
    }
  }
  shape(ctx, [-0.4 * r, 0.02 * r, -0.36 * r, -0.2 * r, -0.16 * r, -0.3 * r, 0.16 * r, -0.3 * r, 0.36 * r, -0.2 * r, 0.42 * r, 0.02 * r, 0.32 * r, 0.2 * r, 0, 0.26 * r, -0.32 * r, 0.2 * r], f(s, shade(BK_SKIN, 1.08)), { smooth: true, under: f(s, BK_SKIN_D), uf: 0.35 });
  if (!back) {
    // the mouth: a wide downturned frog line that gapes open
    const mo = mouth * 0.17 * r;
    const mx = fx * 0.03 * r;
    shape(ctx, [mx - 0.3 * r, 0.06 * r, mx, 0.02 * r, mx + 0.3 * r, 0.06 * r, mx + 0.22 * r, 0.1 * r + mo * 0.7, mx, 0.1 * r + mo, mx - 0.22 * r, 0.1 * r + mo * 0.7], '#2a0e14', { smooth: true, under: null, w: 0.9 });
    if (mouth > 0.2) {
      oval(ctx, mx + 0.02 * r, 0.1 * r + mo * 0.75, 0.12 * r, 0.05 * r * mouth, '#b84a5a', { under: null, w: 0 });
      teeth(ctx, mx - 0.2 * r, 0.06 * r, mx + 0.2 * r, 0.06 * r, 4, 0.05 * r, -1, '#e0dcc0');
    }
    // bulging pale eyes with pinprick pupils and heavy lids
    for (const k of [-1, 1]) {
      const ex = k * 0.17 * r + fx * 0.03 * r;
      const ey = -0.12 * r;
      oval(ctx, ex, ey, 0.12 * r, 0.1 * r, f(s, '#e8f0d8'), { under: f(s, '#bccab0'), uf: 0.3 });
      ctx.fillStyle = '#1a2420';
      ctx.beginPath();
      ctx.arc(ex + fx * 0.04 * r, ey + fy * 0.03 * r + 0.01 * r, Math.max(1.5, r * 0.03), 0, TAU);
      ctx.fill();
      shape(ctx, [ex - 0.13 * r, ey - 0.01 * r, ex - 0.1 * r, ey - 0.1 * r, ex + 0.1 * r, ey - 0.1 * r, ex + 0.13 * r, ey - 0.01 * r - k * 0.03 * r * R], f(s, BK_SKIN_D), { smooth: true, under: null, w: 0.8 });
    }
  }
  // the crown, tipped to one side
  ctx.save();
  ctx.translate(0.02 * r, -0.3 * r);
  ctx.rotate(-0.18 - R * 0.12);
  const crown = [-0.3, 0.02, -0.34, -0.36, -0.18, -0.16, -0.08, -0.44, 0.04, -0.18, 0.16, -0.46, 0.24, -0.16, 0.36, -0.38, 0.32, 0.02];
  shape(ctx, scaled(crown, 0, 0, r), f(s, BK_GOLD), { under: f(s, BK_GOLD_D), uf: 0.35, hi: s.flash ? null : '#f2dc8a' });
  oval(ctx, 0.04 * r, -0.08 * r, 0.05 * r, 0.05 * r, f(s, '#c83a4a'), { w: 0.6, uf: 0.3 });
  oval(ctx, -0.2 * r, -0.07 * r, 0.035 * r, 0.035 * r, f(s, '#3ab8a0'), { w: 0.5, uf: 0.3 });
  oval(ctx, 0.22 * r, -0.04 * r, 0.05 * r, 0.04 * r, f(s, '#c8c0a8'), { w: 0.6, uf: 0.3 });
  ctx.restore();
  ctx.restore();

  // the scepter arm
  const gx = sX * r;
  const gy = sY * r;
  const dx = Math.cos(sA);
  const dy = Math.sin(sA);
  const tx = gx + dx * r * 1.05;
  const ty = gy + dy * r * 1.05;
  if (ag) {
    if (s.pose === 'attack') {
      const r0x = BK_RAISED[0]! * r + Math.cos(BK_RAISED[2]!) * r * 1.05;
      const r0y = BK_RAISED[1]! * r + Math.sin(BK_RAISED[2]!) * r * 1.05;
      trail(ctx, 0.7 * r, -0.4 * r, Math.hypot(tx - 0.7 * r, ty + 0.4 * r), r * 0.5, Math.atan2(r0y + 0.4 * r, r0x - 0.7 * r), Math.atan2(ty + 0.4 * r, tx - 0.7 * r), ag, ak);
    }
    glow(ctx, tx, ty, r * 0.6, ag, 0.7 * ak);
  }
  stick(ctx, gx - dx * r * 0.35, gy - dy * r * 0.35, tx, ty, r * 0.075, f(s, BK_GOLD));
  glow(ctx, tx, ty, r * 0.35, BK_GOLD, 0.45);
  for (const k of [-0.7, 0, 0.7]) horn(ctx, tx + dx * r * 0.05, ty + dy * r * 0.05, sA + k, r * 0.2, r * 0.07, k * 0.4, f(s, BK_GOLD), 0.7);
  oval(ctx, tx, ty, r * 0.12, r * 0.12, f(s, BK_GOLD), { under: f(s, BK_GOLD_D) });
  oval(ctx, tx, ty, r * 0.065, r * 0.065, s.flash ? '#ffffff' : '#bfe8e0', { under: null, w: 0.6 });
  glint(ctx, tx - r * 0.02, ty - r * 0.025, Math.max(1, r * 0.02));
  arm2(ctx, 0.72 * r, -0.42 * r, gx, gy, r * 0.42, r * 0.42, 1, r * 0.34, r * 0.28, r * 0.22, f(s, BK_SKIN));
  oval(ctx, gx, gy, r * 0.15, r * 0.13, f(s, BK_SKIN));
  if (!offBehind) offArm();
  ctx.restore();

  if (p2) {
    // the waterline in front of him
    ctx.save();
    ctx.strokeStyle = withAlpha(BK_WATER, 0.75);
    ctx.lineWidth = Math.max(2, r * 0.045);
    ctx.beginPath();
    ctx.ellipse(0, waterY, 1.0 * r, 0.26 * r, 0, 0.1, Math.PI - 0.1);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  if (R > 0) roarLines(ctx, s.x + side * 0.06 * r, s.y - r * 1.1 + bob, r * 0.8, R, s.t, '#e8f0d8');
  if (s.pose === 'stagger') dizzy(ctx, s.x, s.y - r * 1.55, r * 0.5, s.t);
});
