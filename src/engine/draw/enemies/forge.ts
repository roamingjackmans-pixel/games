// Ashen Forge roster (crimson, soot, ember orange, molten gold — ART_AUDIO §2). Fire enemies wear fire red
// (ELEMENTS.fire) in their cloth, cracks and eyes; whatever strikes glows in the colour of the attack's type.
import { OUTLINE, glow, shade, shadow, spec } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';
import {
  TAU,
  armBehind,
  bend,
  bob,
  hound,
  claws,
  el,
  ell,
  eye,
  eyes2,
  flame,
  frame,
  fwdP,
  horn,
  hot,
  legs,
  limb3,
  p3,
  poly2,
  ragHem,
  sheen,
  sideP,
  slits,
  smooth2,
  stick,
  streak,
  striking,
  swingTrail,
  taper,
  type Frame,
} from '../shapesB';

const CRIMSON = '#8e1b1b';
const SOOT = '#1a1010';
const EMBER = '#ff7a1a';
const GOLD = '#ffd27a';
const IRON = '#4a4650';

/** Where a hand goes for the common enemy poses: rest low and forward, cock back on windup, thrust on attack. */
function handPose(s: DrawState, f: Frame, sx: number, sy: number, r: number, reach = 1): [number, number] {
  if (s.pose === 'windup') {
    const k = Math.min(1, s.poseT / 0.35);
    return [sx - f.fx * r * 0.35 * k + f.px * r * 0.2, sy - r * (0.15 + 0.35 * k) - f.fy * r * 0.15 * k];
  }
  if (s.pose === 'attack') return [sx + f.fx * r * 1.15 * reach, sy + f.fy * r * 0.75 * reach + r * 0.1];
  if (s.pose === 'recover') return [sx + f.fx * r * 0.7 * reach, sy + f.fy * r * 0.45 * reach + r * 0.3];
  return [sx + f.fx * r * 0.3, sy + r * 0.5 + f.fy * r * 0.15];
}

// ------------------------------------------------------------------ Cinder Cultist: hunched, pointed hood, kris
registerDraw('forge_cultist', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1.4, 7);
  shadow(ctx, s.x, s.y, r);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const top = s.y - r * 0.5 * (1 - s.squash * 0.1) + b;
  const lean = s.pose === 'attack' ? 4 : s.pose === 'windup' ? -2 : 0;
  const cx = x + f.fx * lean;
  const ROBE = CRIMSON;

  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, cx, top + r * 0.14, r * 0.46 * wf, side);
    let hx: number;
    let hy: number;
    if (side > 0) [hx, hy] = handPose(s, f, sx, sy, r, 1.05);
    else [hx, hy] = sideP(f, cx + f.fx * r * 0.2, s.y + r * 0.02 + b, r * 0.2, side);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.95, f.px * side, f.py * side * 0.4 + 0.6);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.3, r * 0.24, shade(ROBE, 0.85));
    if (side > 0) {
      // the kris: a wavy fire-hot blade
      const a = s.pose === 'windup' ? Math.atan2(-0.6, -f.fx * 0.4 + f.px * 0.3) : s.pose === 'attack' || s.pose === 'recover' ? Math.atan2(hy - sy, hx - sx) : Math.atan2(f.fy * 0.55 + 0.55, f.fx);
      const L = r * 0.95;
      if (H && s.pose === 'attack') streak(ctx, sx, sy, hx + Math.cos(a) * L, hy + Math.sin(a) * L, 5, H, 0.75);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(a);
      stick(ctx, s, -r * 0.22, 0, 0, 0, 2.5, '#3a2418', 2);
      poly2(ctx, s, [0, -2.4, L * 0.26, -1.3, L * 0.44, -2.6, L * 0.62, -1.2, L * 0.8, -2.1, L, 0, L * 0.8, 1.0, L * 0.62, 2.1, L * 0.44, 0.9, L * 0.26, 2.1, 0, 2.4], '#f2a35a', 2, 1.8);
      sheen(ctx, [L * 0.1, 0, L * 0.85, 0], '#fff0c0', 1, 0.9);
      poly2(ctx, s, [-1.5, -4.5, 2, -4.5, 2, 4.5, -1.5, 4.5], '#2a2224', 2, 1.5);
      ctx.restore();
      glow(ctx, hx + Math.cos(a) * L * 0.7, hy + Math.sin(a) * L * 0.7, r * (H ? 0.9 : 0.55), H ?? E.glow, H ? 0.75 : 0.4);
    } else {
      // clutching a smouldering idol to the chest
      ell(ctx, s, hx, hy, r * 0.13, r * 0.13, '#b8a8a0', 0.6, 2);
      eye(ctx, hx, hy - r * 0.18, Math.max(1.4, r * 0.08), E.glow, 0.55);
    }
  };

  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  legs(ctx, s, f, cx, s.y + r * 0.35 + b, gy, r * 0.26, r * 0.2, '#2a1a18', SOOT, r * 0.32, 11);
  // ragged robe
  const w = r * wf;
  const hem = gy - r * 0.16;
  const robe = [cx - w * 0.42, top, cx + w * 0.42, top, cx + w * 0.62, s.y + r * 0.12 + b, cx + w * 0.84, hem];
  ragHem(robe, cx - w * 0.84, cx + w * 0.84, hem, 4, r * 0.18, s.t);
  robe.push(cx - w * 0.62, s.y + r * 0.12 + b);
  poly2(ctx, s, robe, ROBE, 0.66);
  if (!f.back) {
    const ox = cx + f.fx * w * 0.2;
    poly2(ctx, s, [ox - r * 0.07, top + r * 0.1, ox + r * 0.07, top + r * 0.1, ox + r * 0.13, hem - r * 0.05, ox - r * 0.13, hem - r * 0.05], shade(ROBE, 0.55), 2, 0);
  }
  // rope belt with a dangling charm, fire-red trim at the hem
  ctx.strokeStyle = fc(s, '#c9a060');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.6, s.y + r * 0.08 + b);
  ctx.quadraticCurveTo(cx, s.y + r * 0.2 + b, cx + w * 0.6, s.y + r * 0.08 + b);
  ctx.stroke();
  sheen(ctx, [cx - w * 0.74, hem - r * 0.1, cx + w * 0.74, hem - r * 0.1], E.main, 2, 0.9);
  // jagged shoulder capelet
  poly2(ctx, s, [cx - w * 0.55, top + r * 0.02, cx, top - r * 0.12, cx + w * 0.55, top + r * 0.02, cx + w * 0.5, top + r * 0.32, cx + w * 0.25, top + r * 0.2, cx, top + r * 0.36, cx - w * 0.25, top + r * 0.2, cx - w * 0.5, top + r * 0.32], shade(ROBE, 0.75), 0.7, 2.5);
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // the pointed hood, its tip bent back away from the facing
  const hx = cx + f.fx * r * 0.08;
  const hy = top - r * 0.3;
  const tx = hx - f.fx * r * 0.55;
  const ty = hy - r * 1.0;
  smooth2(ctx, s, [hx - r * 0.48, hy + r * 0.4, hx - r * 0.56, hy - r * 0.05, hx - r * 0.34, hy - r * 0.48, tx, ty, tx, ty, hx + r * 0.34, hy - r * 0.48, hx + r * 0.56, hy - r * 0.05, hx + r * 0.48, hy + r * 0.4], '#9a2020', 0.72);
  if (!f.back) {
    const fxc = hx + f.fx * r * 0.2;
    const fyc = hy + r * 0.04 + f.fy * r * 0.04;
    const rx = r * (0.3 - 0.1 * Math.abs(f.fx));
    smooth2(ctx, s, [fxc - rx, fyc - r * 0.05, fxc, fyc - r * 0.32, fxc + rx, fyc - r * 0.05, fxc + rx * 0.7, fyc + r * 0.28, fxc - rx * 0.7, fyc + r * 0.28], '#0c0606', 2, 2);
    eyes2(ctx, f, fxc + f.fx * 1.5, fyc, r * 0.12, Math.max(1.3, r * 0.08), s.flash ? '#ffffff' : E.glow, 0.5);
  } else {
    sheen(ctx, [hx, hy - r * 0.45, hx, hy + r * 0.3], shade('#9a2020', 0.7), 2, 0.9);
  }
});

// ------------------------------------------------------------------ Forge Hound: horned hellhound with a flame mane
registerDraw('forge_hound', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  shadow(ctx, s.x, s.y, r * 1.05);
  hound(
    ctx,
    s,
    f,
    r,
    { fur: '#2e1c16', muzzle: '#6a3020', mouth: H ?? E.glow, eye: s.flash ? '#ffffff' : '#ffb040', teeth: '#f0e0c0', horn: '#c8b8a0', body: '#2e1c16', leg: '#2a1812', legFar: '#1a100c', paw: '#0e0806' },
    {
      tail: '#2a1812',
      mouthGlow: H ?? E.glow,
      hot: H,
      tailTip: (x, y) => flame(ctx, x, y + 2, r * 0.6, s.t, E.main, GOLD, 0),
      spine: (x, y, i) => flame(ctx, x, y + 2, r * (0.55 + Math.sin(s.t * 12 + i * 1.7) * 0.12 - i * 0.07), s.t + i * 0.7, E.main, GOLD, 0),
      flank: (pt, near) => {
        // molten cracks along the near flank
        const [m1x, m1y] = pt(-r * 0.37, r * 0.18 * near, r * 0.67);
        const [m2x, m2y] = pt(-r * 0.06, r * 0.22 * near, r * 0.5);
        const [m3x, m3y] = pt(r * 0.22, r * 0.2 * near, r * 0.68);
        ctx.strokeStyle = s.flash ? '#ffffff' : E.main;
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(m1x, m1y);
        ctx.lineTo(m2x, m2y - r * 0.1);
        ctx.lineTo(m2x + f.fx * r * 0.1, m2y + r * 0.08);
        ctx.lineTo(m3x, m3y);
        ctx.stroke();
        glow(ctx, m2x, m2y, r * 0.5, E.glow, 0.35);
      },
    },
  );
});

// ------------------------------------------------------------------ Pyromancer: horned mantle, bronze mask, brazier staff
registerDraw('forge_pyromancer', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1.2, 3);
  shadow(ctx, s.x, s.y, r);
  const x = s.x;
  const gy = s.y + r * 0.74;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const top = s.y - r * 0.48 * (1 - s.squash * 0.08) + b;
  const casting = striking(s);
  const ROBE = '#3a1414';

  // staff in the off hand, planted beside it, brazier cage burning on top
  const staff = (): void => {
    const [sx, sy] = sideP(f, x + f.fx * r * 0.25, s.y + r * 0.05 + b, r * 0.72, -1);
    const lift = casting ? r * 0.25 : 0;
    const tx = sx + f.fx * r * 0.15;
    const ty = sy - r * 1.35 - lift;
    stick(ctx, s, sx - f.fx * r * 0.05, sy + r * 0.7 - lift, tx, ty + r * 0.15, r * 0.12, '#3a2a22');
    // cage
    poly2(ctx, s, [tx - r * 0.2, ty - r * 0.15, tx + r * 0.2, ty - r * 0.15, tx + r * 0.13, ty + r * 0.18, tx - r * 0.13, ty + r * 0.18], '#2a2224', 2, 2);
    flame(ctx, tx, ty - r * 0.1, r * (0.55 + (casting ? 0.25 : 0)), s.t, H ?? E.main, GOLD, 0);
    glow(ctx, tx, ty - r * 0.2, r * (casting ? 1.3 : 0.9), H ?? E.glow, 0.6);
    // hand on the staff
    const [ax, ay] = sideP(f, x, top + r * 0.15, r * 0.46 * wf, -1);
    const hy = sy - r * 0.35 - lift;
    const [ex, ey] = bend(ax, ay, sx, hy, r * 0.75, f.px * -1, 0.6);
    limb3(ctx, s, ax, ay, ex, ey, sx, hy, r * 0.28, r * 0.22, ROBE);
    ell(ctx, s, sx, hy, r * 0.11, r * 0.1, '#c8906a', 0.6, 2);
  };
  // the casting hand: a fireball grows over the palm
  const castHand = (): void => {
    const [ax, ay] = sideP(f, x, top + r * 0.15, r * 0.46 * wf, 1);
    let hx: number;
    let hy: number;
    if (casting) [hx, hy] = fwdP(f, ax, ay - r * 0.1, r * (0.75 + Math.min(1, s.poseT) * 0.25));
    else [hx, hy] = [ax + f.fx * r * 0.25 + f.px * r * 0.1, ay + r * 0.45];
    const [ex, ey] = bend(ax, ay, hx, hy, r * 0.8, f.px, 0.5);
    limb3(ctx, s, ax, ay, ex, ey, hx, hy, r * 0.3, r * 0.24, ROBE);
    ell(ctx, s, hx, hy, r * 0.11, r * 0.1, '#c8906a', 0.6, 2);
    const sz = casting ? r * (0.22 + Math.min(1, s.poseT) * 0.18) : r * 0.14;
    const oy = hy - r * 0.25 - Math.abs(Math.sin(s.t * 5)) * 2;
    glow(ctx, hx, oy, sz * 3.2, H ?? E.glow, 0.75);
    ell(ctx, s, hx, oy, sz, sz, GOLD, 2, 2, 0, undefined);
    flame(ctx, hx, oy + sz * 0.5, sz * 2.2, s.t * 1.3, H ?? E.main, GOLD, 0);
    if (H && s.pose === 'attack') glow(ctx, hx + f.fx * r * 0.4, oy + f.fy * r * 0.2, r * 1.2, H, 0.8);
  };
  if (armBehind(f, -1)) staff();
  if (armBehind(f, 1)) castHand();
  legs(ctx, s, f, x, s.y + r * 0.4 + b, gy, r * 0.24, r * 0.2, '#1a0e0e', SOOT, r * 0.22, 8);
  // long robe, flame-tongue hem in fire red
  const w = r * wf;
  const hem = gy - r * 0.14;
  poly2(ctx, s, [x - w * 0.4, top, x + w * 0.4, top, x + w * 0.66, s.y + r * 0.2 + b, x + w * 0.78, hem, x - w * 0.78, hem, x - w * 0.66, s.y + r * 0.2 + b], ROBE, 0.64);
  const tongues = [x + w * 0.76, hem];
  for (let i = 0; i <= 6; i++) {
    const k = i / 6;
    const tx = x + w * 0.76 - k * w * 1.52;
    tongues.push(tx, hem - (i % 2 === 0 ? r * 0.06 : r * (0.3 + 0.08 * Math.sin(s.t * 8 + i))));
  }
  tongues.push(x - w * 0.76, hem + r * 0.02, x + w * 0.76, hem + r * 0.02);
  poly2(ctx, s, tongues, E.main, 0.7, 2);
  if (!f.back) {
    const ox = x + f.fx * w * 0.18;
    sheen(ctx, [ox, top + r * 0.2, ox + f.fx * 2, hem - r * 0.3], GOLD, 2, 0.8);
  }
  if (!armBehind(f, -1)) staff();
  if (!armBehind(f, 1)) castHand();
  // mantle with up-swept horn spikes rising beside the head
  const mt = top - r * 0.04;
  poly2(ctx, s, [x - w * 0.95, mt + r * 0.24, x - w * 0.92, mt - r * 0.72, x - w * 0.55, mt - r * 0.06, x, mt - r * 0.12, x + w * 0.55, mt - r * 0.06, x + w * 0.92, mt - r * 0.72, x + w * 0.95, mt + r * 0.24, x + w * 0.4, mt + r * 0.4, x, mt + r * 0.28, x - w * 0.4, mt + r * 0.4], CRIMSON, 0.55);
  sheen(ctx, [x - w * 0.9, mt + r * 0.1, x - w * 0.9, mt - r * 0.55], E.main, 1.5, 0.9);
  sheen(ctx, [x + w * 0.9, mt + r * 0.1, x + w * 0.9, mt - r * 0.55], E.main, 1.5, 0.9);
  spec(ctx, x - w * 0.55, mt + r * 0.08, 1.6, 0.6);
  // rounded cowl with a bronze face-mask
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.36;
  smooth2(ctx, s, [hx - r * 0.42, hy + r * 0.32, hx - r * 0.46, hy - r * 0.15, hx - r * 0.2, hy - r * 0.5, hx + r * 0.2, hy - r * 0.5, hx + r * 0.46, hy - r * 0.15, hx + r * 0.42, hy + r * 0.32], '#4a1a1a', 0.7);
  if (!f.back) {
    const mx = hx + f.fx * r * 0.18;
    const my = hy + r * 0.02;
    const mw = r * (0.26 - 0.08 * Math.abs(f.fx));
    poly2(ctx, s, [mx - mw, my - r * 0.22, mx + mw, my - r * 0.22, mx + mw * 0.85, my + r * 0.12, mx, my + r * 0.3, mx - mw * 0.85, my + r * 0.12], '#6a4224', 0.6, 2);
    slits(ctx, f, mx + f.fx * 1.5, my - r * 0.06, r * 0.11, r * 0.13, r * 0.08, s.flash ? '#ffffff' : (H ?? E.glow), 0.45);
  }
});

// ------------------------------------------------------------------ Anvil Golem: an iron giant with an anvil for a head
registerDraw('forge_anvil_golem', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  const b = bob(s, 1, 2.5);
  shadow(ctx, s.x, s.y + 2, r * 1.1, 0.42);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.82 + 0.18 * Math.abs(f.fy);
  const sq = 1 - s.squash * 0.07;
  const top = s.y - r * 0.55 * sq + b;
  const core = H ?? EMBER;
  const coreA = H ? 0.8 : 0.45 + Math.sin(s.t * 3) * 0.12;

  const hammerArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.18, r * 0.72 * wf, 1);
    let ang: number;
    if (s.pose === 'windup') ang = -Math.PI / 2 - f.dir * 0.4;
    else if (s.pose === 'attack') ang = Math.atan2(f.fy * 0.55 + 0.5, f.fx);
    else if (s.pose === 'recover') ang = Math.atan2(f.fy * 0.55 + 0.9, f.fx * 0.8);
    else ang = Math.atan2(0.9, f.fx * 0.35 + f.px * 0.25);
    const reach = s.pose === 'windup' ? r * 0.75 : r * 0.85;
    const hx = sx + Math.cos(ang) * reach;
    const hy = sy + Math.sin(ang) * reach;
    const [ex, ey] = bend(sx, sy, hx, hy, reach * 1.25, f.px, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.36, r * 0.3, '#3a3438');
    // the forge hammer
    const L = r * 1.0;
    if (H && s.pose === 'attack') swingTrail(ctx, sx, sy, reach + L * 0.8, ang - 1.6 * f.dir, ang, r * 0.5, H, 0.7);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    stick(ctx, s, -r * 0.15, 0, L, 0, r * 0.12, '#5a3a22');
    ctx.translate(L, 0);
    poly2(ctx, s, [-r * 0.22, -r * 0.42, r * 0.24, -r * 0.42, r * 0.3, -r * 0.3, r * 0.3, r * 0.3, r * 0.24, r * 0.42, -r * 0.22, r * 0.42, -r * 0.28, r * 0.3, -r * 0.28, -r * 0.3], '#6a6670', 0.6);
    ctx.fillStyle = fc(s, shade('#6a6670', 0.6));
    ctx.fillRect(-r * 0.26, -r * 0.08, r * 0.54, r * 0.16);
    if (H) glow(ctx, 0, 0, r * 0.8, H, 0.6);
    ctx.restore();
    ell(ctx, s, hx, hy, r * 0.2, r * 0.18, '#3a3438', 0.55);
  };
  const fistArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.18, r * 0.72 * wf, -1);
    const punch = s.pose === 'attack' ? 0.4 : 0;
    const [hx, hy] = sideP(f, sx + f.fx * r * (0.2 + punch), sy + r * 0.7 + f.fy * r * 0.1, r * 0.12, -1);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.95, f.px * -1, 0.3);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.36, r * 0.3, '#3a3438');
    // a blocky fist with knuckle plates
    poly2(ctx, s, [hx - r * 0.24, hy - r * 0.18, hx + r * 0.24, hy - r * 0.18, hx + r * 0.27, hy + r * 0.16, hx - r * 0.27, hy + r * 0.16], '#5a5660', 0.6);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(hx + i * r * 0.13, hy - r * 0.18);
      ctx.lineTo(hx + i * r * 0.13, hy - r * 0.02);
    }
    ctx.stroke();
  };
  if (armBehind(f, 1)) hammerArm();
  if (armBehind(f, -1)) fistArm();
  // stumpy iron legs with block feet
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.42, r * 0.34, '#3a3438', '#2a2628', r * 0.15, 5, 1.2);
  // torso: broad riveted iron, waist pinched, furnace in the chest
  const w = r * wf;
  poly2(ctx, s, [x - w * 0.95, top, x - w * 0.55, top - r * 0.2, x + w * 0.55, top - r * 0.2, x + w * 0.95, top, x + w * 0.75, s.y + r * 0.2 + b, x + w * 0.5, s.y + r * 0.45 + b, x - w * 0.5, s.y + r * 0.45 + b, x - w * 0.75, s.y + r * 0.2 + b], IRON, 0.62);
  // belt plate
  poly2(ctx, s, [x - w * 0.55, s.y + r * 0.22 + b, x + w * 0.55, s.y + r * 0.22 + b, x + w * 0.5, s.y + r * 0.42 + b, x - w * 0.5, s.y + r * 0.42 + b], '#3a3640', 2, 2);
  ctx.fillStyle = fc(s, '#8a8690');
  for (const k of [-0.75, -0.35, 0.35, 0.75]) {
    ctx.beginPath();
    ctx.arc(x + w * k, top + r * 0.02, 1.6, 0, TAU);
    ctx.fill();
  }
  if (!f.back) {
    // furnace grate
    const gx = x + f.fx * w * 0.12;
    const gyy = s.y - r * 0.1 + b;
    glow(ctx, gx, gyy, r * 0.95, core, coreA);
    poly2(ctx, s, [gx - r * 0.3, gyy - r * 0.22, gx + r * 0.3, gyy - r * 0.22, gx + r * 0.26, gyy + r * 0.2, gx - r * 0.26, gyy + r * 0.2], '#1a1010', 2, 2);
    ctx.fillStyle = s.flash ? '#ffffff' : H ?? GOLD;
    for (let i = -1; i <= 1; i++) ctx.fillRect(gx + i * r * 0.17 - r * 0.05, gyy - r * 0.15, r * 0.1, r * 0.3);
  } else {
    // a smokestack vent on its back
    poly2(ctx, s, [x - r * 0.2, top - r * 0.05, x + r * 0.2, top - r * 0.05, x + r * 0.16, s.y + r * 0.1 + b, x - r * 0.16, s.y + r * 0.1 + b], '#2a2628', 2, 2);
    glow(ctx, x, top + r * 0.2, r * 0.6, core, coreA * 0.7);
  }
  // pauldrons
  for (const side of [-1, 1]) {
    const [px, py] = sideP(f, x, top - r * 0.02, r * 0.78 * wf, side);
    smooth2(ctx, s, [px - r * 0.3, py + r * 0.12, px - r * 0.26, py - r * 0.18, px, py - r * 0.26, px + r * 0.26, py - r * 0.18, px + r * 0.3, py + r * 0.12, px, py + r * 0.2], '#5a5660', 0.55, 2.5);
    spec(ctx, px - r * 0.08, py - r * 0.1, 1.8, 0.7);
  }
  if (!armBehind(f, 1)) hammerArm();
  if (!armBehind(f, -1)) fistArm();
  // the anvil head: flat face, horn toward the facing side, glowing slit eyes in the waist below
  const ax = x + f.fx * r * 0.08;
  const ay = top - r * 0.42;
  const d = f.dir;
  poly2(ctx, s, [ax - r * 0.26, ay + r * 0.36, ax + r * 0.26, ay + r * 0.36, ax + r * 0.2, ay + r * 0.08, ax - r * 0.2, ay + r * 0.08], '#3a3640', 2, 2.5);
  poly2(ctx, s, [ax - d * r * 0.55, ay - r * 0.22, ax + d * r * 0.4, ay - r * 0.22, ax + d * r * 0.95, ay - r * 0.12, ax + d * r * 0.42, ay + r * 0.02, ax + d * r * 0.3, ay + r * 0.12, ax - d * r * 0.45, ay + r * 0.12, ax - d * r * 0.55, ay + r * 0.02], '#6a6670', 0.55);
  sheen(ctx, [ax - d * r * 0.5, ay - r * 0.19, ax + d * r * 0.4, ay - r * 0.19], '#b0aab8', 1.5, 0.8);
  slits(ctx, f, ax + f.fx * r * 0.06, ay + r * 0.22, r * 0.11, r * 0.12, r * 0.08, s.flash ? '#ffffff' : (H ?? GOLD), 0.4);
});

// ------------------------------------------------------------------ Slag Crawler: a rock-plated magma grub (per piece)
registerDraw('forge_slag', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const ph = s.variant * 2.1;
  shadow(ctx, s.x, s.y, r, 0.28);
  glow(ctx, s.x, s.y, r * 2.2, E.glow, 0.28);
  const gy = s.y + r * 0.55;
  const sq = 1 - s.squash * 0.25;
  const hotC = s.pose === 'windup' ? GOLD : (H ?? E.main);
  // three segments, rear to front (front last when facing the camera)
  const segs: [number, number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const wig = Math.sin(s.t * 7 + ph + i * 1.3) * r * 0.12 * (0.4 + s.moving);
    segs.push([-r * 0.75 + i * r * 0.62, wig, r * (0.42 + i * 0.08)]);
  }
  const order = f.fy >= 0 ? [0, 1, 2] : [2, 1, 0];
  for (const i of order) {
    const [a, bb, rr] = segs[i]!;
    const [px, py] = p3(f, s.x, gy, a, bb, rr * 0.7 * sq);
    // glowing seam then the crusted plate
    glow(ctx, px, py, rr * 1.6, hotC, 0.4);
    smooth2(ctx, s, [px - rr, py + rr * 0.35, px - rr * 0.8, py - rr * 0.55, px, py - rr * 0.85 * sq, px + rr * 0.8, py - rr * 0.55, px + rr, py + rr * 0.35, px, py + rr * 0.6], i === 2 ? '#4a2c22' : '#3a2420', 0.6, 2);
    ctx.strokeStyle = s.flash ? '#ffffff' : hotC;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px - rr * 0.5, py - rr * 0.2);
    ctx.lineTo(px - rr * 0.05, py - rr * 0.45);
    ctx.lineTo(px + rr * 0.4, py - rr * 0.1);
    ctx.stroke();
    if (i === 2) {
      // mandibles and ember eyes on the head segment
      const [mx, my] = p3(f, s.x, gy, a + rr * 0.9, 0, rr * 0.4);
      const ma = Math.atan2(f.fy * 0.5, f.fx);
      const open = s.pose === 'windup' || s.pose === 'attack' ? 0.6 : 0.25;
      for (const side of [-1, 1]) horn(ctx, s, mx + f.px * rr * 0.35 * side, my + f.py * rr * 0.2 * side, ma + side * open, rr * 0.75, rr * 0.16, -side * 0.6, '#1a0e0a', 1.5);
      eyes2(ctx, f, px + f.fx * rr * 0.45, py - rr * 0.25 + f.fy * rr * 0.2, rr * 0.32, Math.max(1, rr * 0.13), s.flash ? '#ffffff' : GOLD, 0.4);
    }
  }
});

// ------------------------------------------------------------------ Bellows Brute: tusked ogre smith with a bellows rig
registerDraw('forge_bellows', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1.5, 3);
  shadow(ctx, s.x, s.y, r * 1.05, 0.4);
  const x = s.x;
  const gy = s.y + r * 0.7;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const top = s.y - r * 0.45 * (1 - s.squash * 0.08) + b;
  const SKIN = '#b0503e';
  const breath = 0.5 + Math.sin(s.t * (s.pose === 'windup' ? 10 : 2.5)) * 0.5;
  const reachK = s.pose === 'attack' ? 1.35 : s.pose === 'windup' ? 0.6 : 1;

  const bellows = (): void => {
    const [bx, by] = fwdP(f, x, top - r * 0.12, -r * 0.55);
    const bw = r * (0.42 + breath * 0.16);
    poly2(ctx, s, [bx - bw, by - r * 0.42, bx + bw, by - r * 0.42, bx + r * 0.16, by + r * 0.38, bx - r * 0.16, by + r * 0.38], '#6a4228', 0.6, 2.5);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const k = i / 4;
      const yy = by - r * 0.42 + r * 0.8 * k;
      const ww = bw + (r * 0.16 - bw) * k;
      ctx.moveTo(bx - ww, yy);
      ctx.lineTo(bx + ww, yy);
    }
    ctx.stroke();
    poly2(ctx, s, [bx - bw - 2, by - r * 0.5, bx + bw + 2, by - r * 0.5, bx + bw, by - r * 0.4, bx - bw, by - r * 0.4], '#3a2418', 2, 2);
  };
  const nozzleArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.68 * wf, 1);
    const [hx, hy] = s.pose === 'idle' || s.pose === 'stagger' ? [sx + f.fx * r * 0.35, sy + r * 0.55] : fwdP(f, sx, sy + r * 0.15, r * 0.95 * reachK);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.05, f.px, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.34, r * 0.3, SKIN);
    // brass nozzle gauntlet
    const a = s.pose === 'idle' || s.pose === 'stagger' ? Math.atan2(0.8 + f.fy * 0.3, f.fx) : Math.atan2(f.fy * 0.55, f.fx);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(a);
    poly2(ctx, s, [-r * 0.12, -r * 0.18, r * 0.22, -r * 0.11, r * 0.42, -r * 0.07, r * 0.42, r * 0.07, r * 0.22, r * 0.11, -r * 0.12, r * 0.18], '#b08d3c', 0.55, 2.5);
    ctx.restore();
    const nx = hx + Math.cos(a) * r * 0.42;
    const ny = hy + Math.sin(a) * r * 0.42;
    if (striking(s)) {
      // a jet of flame in the attack's colour
      const len = s.pose === 'attack' ? r * 1.4 : r * 0.4;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(a + Math.PI / 2);
      flame(ctx, 0, 0, -len, s.t, H ?? E.main, GOLD, 0);
      ctx.restore();
      glow(ctx, nx + Math.cos(a) * len * 0.5, ny + Math.sin(a) * len * 0.5, len * 0.9, H ?? E.glow, 0.7);
    } else glow(ctx, nx, ny, r * 0.3, E.glow, 0.4);
  };
  const grabArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.68 * wf, -1);
    const [hx, hy] = s.pose === 'idle' || s.pose === 'stagger' ? sideP(f, sx + f.fx * r * 0.2, sy + r * 0.7, r * 0.1, -1) : fwdP(f, sx, sy + r * 0.2, r * 0.8 * reachK);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.05, -f.px, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.34, r * 0.3, SKIN);
    // a big open hand
    const a = Math.atan2(hy - ey, hx - ex);
    const spread = striking(s) ? 0.55 : 0.3;
    ctx.save();
    ctx.translate(hx, hy);
    for (let i = -1; i <= 1; i++) taper(ctx, s, 0, 0, Math.cos(a + i * spread) * r * 0.36, Math.sin(a + i * spread) * r * 0.36, r * 0.09, r * 0.05, SKIN, 2);
    ell(ctx, s, 0, 0, r * 0.2, r * 0.18, SKIN, 0.6, 2.5);
    if (H && striking(s)) glow(ctx, 0, 0, r * 0.7, H, 0.6);
    ctx.restore();
  };
  if (!f.back) bellows();
  if (armBehind(f, 1)) nozzleArm();
  if (armBehind(f, -1)) grabArm();
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.4, r * 0.3, '#5a3020', '#2a1a12', r * 0.18, 5);
  // barrel torso, hunched shoulders
  const w = r * wf;
  smooth2(ctx, s, [x - w * 0.95, top + r * 0.05, x - w * 0.7, top - r * 0.3, x, top - r * 0.38, x + w * 0.7, top - r * 0.3, x + w * 0.95, top + r * 0.05, x + w * 0.85, s.y + r * 0.4 + b, x, s.y + r * 0.55 + b, x - w * 0.85, s.y + r * 0.4 + b], SKIN, 0.6);
  if (!f.back) {
    // leather apron with straps
    const ox = x + f.fx * w * 0.12;
    poly2(ctx, s, [ox - w * 0.42, top + r * 0.02, ox + w * 0.42, top + r * 0.02, ox + w * 0.55, s.y + r * 0.6 + b, ox - w * 0.55, s.y + r * 0.6 + b], '#4a2a1a', 0.7, 2.5);
    sheen(ctx, [ox - w * 0.42, top + r * 0.02, ox - w * 0.75, top - r * 0.25], '#2a1a10', 3, 1);
    sheen(ctx, [ox + w * 0.42, top + r * 0.02, ox + w * 0.75, top - r * 0.25], '#2a1a10', 3, 1);
    sheen(ctx, [ox - w * 0.35, s.y + r * 0.45 + b, ox + w * 0.35, s.y + r * 0.45 + b], E.main, 2, 0.8);
  } else {
    bellows();
    // the hose running over the shoulder
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, top + r * 0.3);
    ctx.quadraticCurveTo(x + f.px * w * 0.4, top - r * 0.4, x + f.px * w * 0.7, top);
    ctx.stroke();
    ctx.strokeStyle = fc(s, '#5a3a22');
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  spec(ctx, x - w * 0.55, top - r * 0.1, 2.2, 0.6);
  if (!armBehind(f, 1)) nozzleArm();
  if (!armBehind(f, -1)) grabArm();
  // small bald head sunk between the shoulders: goggles, heavy jaw, tusks
  const hx = x + f.fx * r * 0.14;
  const hy = top - r * 0.3 + f.fy * r * 0.05;
  smooth2(ctx, s, [hx - r * 0.3, hy + r * 0.12, hx - r * 0.3, hy - r * 0.2, hx, hy - r * 0.34, hx + r * 0.3, hy - r * 0.2, hx + r * 0.3, hy + r * 0.12, hx + r * 0.22, hy + r * 0.3, hx - r * 0.22, hy + r * 0.3], '#a8473a', 0.62, 2.5);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.12;
    sheen(ctx, [hx - r * 0.3, hy - r * 0.08, hx + r * 0.3, hy - r * 0.08], '#2a1a12', 2.5, 1);
    for (const side of [-1, 1]) {
      const [gx, gyy] = sideP(f, fx2, hy - r * 0.08, r * 0.13, side, 0.3);
      ell(ctx, s, gx, gyy, r * 0.09, r * 0.08, '#3a2a20', 2, 1.5);
      eye(ctx, gx, gyy, Math.max(1.2, r * 0.05), s.flash ? '#ffffff' : (H ?? GOLD), 0.4);
      // tusks jutting up from the jaw
      const [tx, ty] = sideP(f, fx2, hy + r * 0.2, r * 0.12, side, 0.3);
      horn(ctx, s, tx, ty, -Math.PI / 2 - side * f.px * 0.3, r * 0.22, r * 0.075, 0, '#f0e6cc', 1.5);
    }
  }
});

// ------------------------------------------------------------------ Ash Wraith: a ragged ember spectre with a skull face
registerDraw('forge_ash_wraith', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const y = s.y - r * 0.45 + Math.sin(s.t * 3) * 2.5;
  const x = s.x;
  ctx.save();
  ctx.globalAlpha *= 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, s.y + r * 0.6, r * 0.8, r * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  const ASH = '#4a4242';
  const reach = s.pose === 'attack' ? 1.4 : s.pose === 'windup' ? 0.45 : 0.9;
  // smoky tail trailing behind and below
  const [tx, ty] = fwdP(f, x, y + r * 1.0, -r * 1.2);
  const wv = Math.sin(s.t * 6) * r * 0.25;
  smooth2(ctx, s, [x - r * 0.55, y + r * 0.1, x + r * 0.55, y + r * 0.1, (x + tx) / 2 + r * 0.35 + wv, (y + ty) / 2 + r * 0.25, tx + wv, ty, tx + wv, ty, (x + tx) / 2 - r * 0.3 + wv, (y + ty) / 2 + r * 0.15], '#3a3434', 0.5, 2.5);

  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, y - r * 0.25, r * 0.5, side);
    const [hx, hy] = s.pose === 'windup' ? sideP(f, sx - f.fx * r * 0.3, sy - r * 0.5, r * 0.3, side) : fwdP(f, ...sideP(f, sx, sy + r * 0.3, r * 0.1, side), r * 1.05 * reach);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.15, f.px * side, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.17, r * 0.12, '#2a2424');
    const a = Math.atan2(hy - ey, hx - ex);
    const col = H ?? E.glow;
    if (H && s.pose === 'attack') streak(ctx, ex, ey, hx + Math.cos(a) * r * 0.5, hy + Math.sin(a) * r * 0.5, 4, H, 0.7);
    claws(ctx, s, hx, hy, a, r * 0.45, 3, 0.35, '#e8d8c8', 1.6, 0.35);
    glow(ctx, hx + Math.cos(a) * r * 0.3, hy + Math.sin(a) * r * 0.3, r * (H ? 0.7 : 0.4), col, H ? 0.75 : 0.4);
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  // hunched ragged shroud with ember cracks
  const hum = r * 0.12 * (1 - s.squash * 0.5);
  const shroud = [x - r * 0.42, y - r * 0.55 - hum, x + r * 0.42, y - r * 0.55 - hum, x + r * 0.75, y + r * 0.05, x + r * 0.72, y + r * 0.45];
  ragHem(shroud, x - r * 0.72, x + r * 0.72, y + r * 0.45, 3, r * 0.28, s.t, 1.3);
  shroud.push(x - r * 0.75, y + r * 0.05);
  poly2(ctx, s, shroud, ASH, 0.6);
  ctx.strokeStyle = s.flash ? '#ffffff' : E.main;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.35, y - r * 0.2);
  ctx.lineTo(x - r * 0.12, y + r * 0.08);
  ctx.lineTo(x - r * 0.28, y + r * 0.35);
  ctx.moveTo(x + r * 0.3, y - r * 0.3);
  ctx.lineTo(x + r * 0.18, y + r * 0.02);
  ctx.lineTo(x + r * 0.4, y + r * 0.3);
  ctx.stroke();
  glow(ctx, x, y, r * 0.8, E.glow, 0.3);
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // ragged hood over a skull mask
  const hx = x + f.fx * r * 0.12;
  const hy = y - r * 0.7 - hum + f.fy * r * 0.05;
  const hood = [hx - r * 0.42, hy + r * 0.28, hx - r * 0.46, hy - r * 0.12, hx - r * 0.2, hy - r * 0.46, hx - f.fx * r * 0.3, hy - r * 0.62, hx + r * 0.2, hy - r * 0.46, hx + r * 0.46, hy - r * 0.12, hx + r * 0.42, hy + r * 0.28, hx + r * 0.2, hy + r * 0.18, hx, hy + r * 0.34, hx - r * 0.2, hy + r * 0.18];
  smooth2(ctx, s, hood, '#3a3434', 0.65, 2.5);
  if (!f.back) {
    const mx = hx + f.fx * r * 0.18;
    const my = hy + r * 0.04;
    const mw = r * (0.24 - 0.07 * Math.abs(f.fx));
    smooth2(ctx, s, [mx - mw, my - r * 0.12, mx, my - r * 0.26, mx + mw, my - r * 0.12, mx + mw * 0.7, my + r * 0.14, mx + mw * 0.35, my + r * 0.28, mx - mw * 0.35, my + r * 0.28, mx - mw * 0.7, my + r * 0.14], '#d8ccc0', 0.7, 2);
    ctx.fillStyle = '#1a0e0a';
    for (const side of [-1, 1]) {
      const [ex, ey] = sideP(f, mx + f.fx * 1.2, my - r * 0.05, mw * 0.48, side, 0.3);
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.08, r * 0.075, 0, 0, TAU);
      ctx.fill();
      eye(ctx, ex, ey, Math.max(1.1, r * 0.045), s.flash ? '#ffffff' : (H ?? E.glow), 0.55);
    }
    ctx.strokeStyle = '#1a0e0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(mx + i * mw * 0.3, my + r * 0.16);
      ctx.lineTo(mx + i * mw * 0.3, my + r * 0.27);
    }
    ctx.stroke();
  }
  // drifting embers
  for (let i = 0; i < 4; i++) {
    const k = (s.t * 0.7 + i * 0.25) % 1;
    glow(ctx, x + Math.sin(i * 2.3 + s.t) * r * 0.9, y - k * r * 2.0, 3.5, k < 0.5 ? GOLD : E.glow, 1 - k);
  }
});

// ------------------------------------------------------------------ Furnace Priest: furnace mitre, sun-disc halo, censer
registerDraw('forge_priest', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const chant = striking(s);
  const b = Math.sin(s.t * 2) * 1;
  shadow(ctx, s.x, s.y, r);
  const x = s.x;
  const gy = s.y + r * 0.74;
  const wf = 0.82 + 0.18 * Math.abs(f.fy);
  const top = s.y - r * 0.5 + b;
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.36;
  const flameC = H ?? E.main;
  // sun-disc halo of flame tongues behind the head
  const hr = r * (chant ? 0.95 : 0.78);
  glow(ctx, hx, hy - r * 0.2, hr * 2.2, H ?? E.glow, chant ? 0.75 : 0.4);
  ctx.save();
  ctx.translate(hx, hy - r * 0.2);
  ctx.rotate(s.t * (chant ? 1.6 : 0.4));
  for (let i = 0; i < 10; i++) {
    ctx.save();
    ctx.rotate((i / 10) * TAU);
    flame(ctx, 0, -hr * 0.62, hr * (0.5 + 0.08 * Math.sin(s.t * 9 + i)), s.t + i, flameC, GOLD, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(hx, hy - r * 0.2, hr * 0.62, 0, TAU);
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = fc(s, '#d4a040');
  ctx.stroke();

  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.14, r * 0.42 * wf, side);
    let hx2: number;
    let hy2: number;
    if (chant) [hx2, hy2] = sideP(f, sx, sy - r * 0.75, r * 0.3, side);
    else if (side > 0) [hx2, hy2] = [sx + f.fx * r * 0.3 + f.px * r * 0.15, sy + r * 0.38];
    else [hx2, hy2] = sideP(f, x + f.fx * r * 0.22, s.y + b, r * 0.12, side);
    const [ex, ey] = bend(sx, sy, hx2, hy2, r * 0.82, f.px * side, chant ? 0.1 : 0.6);
    // wide sleeve
    limb3(ctx, s, sx, sy, ex, ey, hx2, hy2, r * 0.3, r * 0.34, shade(CRIMSON, 0.9));
    ell(ctx, s, hx2, hy2, r * 0.1, r * 0.09, '#c8906a', 0.6, 2);
    if (chant) {
      flame(ctx, hx2, hy2 - r * 0.08, r * 0.55, s.t + side, flameC, GOLD, 0);
      glow(ctx, hx2, hy2 - r * 0.25, r * 0.7, H ?? E.glow, 0.6);
    } else if (side > 0) {
      // the censer swinging on its chain
      const sw = Math.sin(s.t * 3) * 0.6;
      const cx = hx2 + Math.sin(sw) * r * 0.6;
      const cy = hy2 + Math.cos(sw) * r * 0.6;
      ctx.strokeStyle = fc(s, '#8a8f98');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx2, hy2);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      glow(ctx, cx, cy, r * 0.55, E.glow, 0.55);
      smooth2(ctx, s, [cx - r * 0.16, cy - r * 0.05, cx, cy - r * 0.2, cx + r * 0.16, cy - r * 0.05, cx + r * 0.1, cy + r * 0.14, cx - r * 0.1, cy + r * 0.14], '#b08d3c', 0.6, 2);
      for (let i = 0; i < 2; i++) {
        const k = (s.t * 0.9 + i * 0.5) % 1;
        glow(ctx, cx + Math.sin(s.t * 2 + i) * 3, cy - r * 0.2 - k * r * 0.8, 3, E.glow, 1 - k);
      }
    } else {
      // a prayer book of iron
      poly2(ctx, s, [hx2 - r * 0.18, hy2 - r * 0.14, hx2 + r * 0.18, hy2 - r * 0.14, hx2 + r * 0.18, hy2 + r * 0.14, hx2 - r * 0.18, hy2 + r * 0.14], '#2a2224', 2, 2);
      ctx.fillStyle = fc(s, GOLD);
      ctx.fillRect(hx2 - r * 0.03, hy2 - r * 0.1, r * 0.06, r * 0.2);
    }
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  legs(ctx, s, f, x, s.y + r * 0.4 + b, gy, r * 0.22, r * 0.18, '#1a0e0e', SOOT, r * 0.15, 6);
  // heavy layered vestments with a gold stole
  const w = r * wf;
  const hem = gy - r * 0.12;
  poly2(ctx, s, [x - w * 0.42, top, x + w * 0.42, top, x + w * 0.7, s.y + r * 0.22 + b, x + w * 0.82, hem, x - w * 0.82, hem, x - w * 0.7, s.y + r * 0.22 + b], CRIMSON, 0.66);
  poly2(ctx, s, [x - w * 0.82, hem - r * 0.14, x + w * 0.82, hem - r * 0.14, x + w * 0.84, hem + r * 0.02, x - w * 0.84, hem + r * 0.02], '#d4a040', 2, 2);
  if (!f.back) {
    const ox = x + f.fx * w * 0.16;
    for (const side of [-1, 1]) poly2(ctx, s, [ox + side * r * 0.12, top + r * 0.05, ox + side * r * 0.22, top + r * 0.05, ox + side * r * 0.24, hem - r * 0.14, ox + side * r * 0.1, hem - r * 0.14], '#d4a040', 2, 1.8);
    // flame sigil on the chest
    flame(ctx, ox, s.y + r * 0.02 + b, r * 0.32, s.t * 0.5, E.main, GOLD, 1.5);
  }
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // gaunt face under a furnace mitre (a little iron stove with a grate and chimney)
  smooth2(ctx, s, [hx - r * 0.24, hy + r * 0.05, hx - r * 0.22, hy - r * 0.15, hx + r * 0.22, hy - r * 0.15, hx + r * 0.24, hy + r * 0.05, hx + r * 0.12, hy + r * 0.3, hx - r * 0.12, hy + r * 0.3], '#c8906a', 0.62, 2.5);
  if (!f.back) {
    eyes2(ctx, f, hx + f.fx * r * 0.08, hy + r * 0.02, r * 0.09, Math.max(1.1, r * 0.055), s.flash ? '#ffffff' : chant ? (H ?? GOLD) : '#2a1414', chant ? 0.5 : 0);
    // long grey beard
    poly2(ctx, s, [hx - r * 0.16 + f.fx * 2, hy + r * 0.16, hx + r * 0.16 + f.fx * 2, hy + r * 0.16, hx + f.fx * 3, hy + r * 0.55], '#b8b0a8', 0.6, 2);
  }
  const my = hy - r * 0.12;
  poly2(ctx, s, [hx - r * 0.3, my, hx + r * 0.3, my, hx + r * 0.26, my - r * 0.62, hx - r * 0.26, my - r * 0.62], '#2a2224', 0.7, 2.5);
  poly2(ctx, s, [hx - r * 0.06, my - r * 0.62, hx + r * 0.1, my - r * 0.62, hx + r * 0.1, my - r * 0.9, hx - r * 0.06, my - r * 0.9], '#2a2224', 2, 2);
  if (!f.back) {
    glow(ctx, hx, my - r * 0.28, r * 0.5, H ?? E.glow, chant ? 0.8 : 0.5);
    ctx.fillStyle = s.flash ? '#ffffff' : chant ? GOLD : E.main;
    for (let i = -1; i <= 1; i++) ctx.fillRect(hx + i * r * 0.12 - r * 0.035, my - r * 0.42, r * 0.07, r * 0.26);
  }
  sheen(ctx, [hx - r * 0.28, my - r * 0.6, hx + r * 0.28, my - r * 0.6], '#d4a040', 2, 0.9);
  const sm = (s.t * 0.6) % 1;
  glow(ctx, hx + r * 0.02, my - r * 0.95 - sm * r * 0.6, r * 0.25, '#8a8a90', 0.5 * (1 - sm));
});

