// The Abyss roster (void black, violet, white, deep purple — ART_AUDIO §2). Nearly everything here deals Void, so
// bodies are void grey-black (ELEMENTS.void) with pale void-glow rims, bone-white claws and teeth and lilac-grey
// eyes, which keeps the silhouettes readable on the near-black floor. Whatever strikes glows in its attack's colour.
import { OUTLINE, glow, shade, shadow, spec, withAlpha } from '../parts';
import { DEFAULT_LOOK, drawJoe, type JoeLook } from '../players';
import { registerDraw, type DrawState } from '../registry';
import { drawWeapon, isPairedWeapon } from '../weapons';
import {
  TAU,
  armBehind,
  bend,
  bob,
  claws,
  el,
  ell,
  eye,
  eyes2,
  floorShadow,
  frame,
  fwdP,
  horn,
  hot,
  legs,
  limb3,
  poly2,
  ragHem,
  sheen,
  sideP,
  slits,
  smooth2,
  sparkle,
  stick,
  streak,
  striking,
  swingTrail,
} from '../shapesB';

const PALE = '#e4d4ff';
const BONE = '#e8e0f0';
/** bright core for void eyes (the void glow itself is a dull lilac-grey) */
const VEYE = '#e6e0f4';

// ---------------------------------------------------------------- Hollow Joe: a grey, tired Joe
const HOLLOW_LOOK: JoeLook = {
  ...DEFAULT_LOOK,
  skin: '#a9a5ad',
  hair: '#55525a',
  bodyColor: '#6c6874',
  legsColor: '#46434e',
  trim: '#87838f',
  headColor: '#77737f',
};
/** weaponPick order: longsword, club, twin daggers, spear (one per spawn variant) */
const HOLLOW_WEAPONS = ['w_longsword', 'w_club', 'w_daggers', 'w_spear'];

function hollowSwing(s: DrawState, thrust: boolean): { rot: number; ext: number } {
  if (s.pose === 'windup') {
    const k = Math.min(1, s.poseT / 0.45);
    return thrust ? { rot: 0, ext: -10 * k } : { rot: 0.7 - 2.0 * k, ext: 0 };
  }
  if (s.pose === 'attack') {
    const idx = Math.floor(s.poseT / 0.4);
    const k = (s.poseT % 0.4) / 0.4;
    if (thrust) return { rot: 0, ext: -10 + Math.sin(k * Math.PI) * 52 };
    const dir = idx % 2 === 0 ? 1 : -1;
    return { rot: (-1.3 + 2.6 * k) * dir, ext: 4 };
  }
  if (s.pose === 'stagger') return { rot: 1.4, ext: -4 };
  return { rot: 0.7 + Math.sin(s.t * 1.5) * 0.05, ext: 0 };
}

registerDraw('abyss_hollow_joe', (ctx, s) => {
  const weapon = HOLLOW_WEAPONS[Math.abs(s.variant) % HOLLOW_WEAPONS.length]!;
  const thrust = weapon === 'w_spear';
  const pose = hollowSwing(s, thrust);
  const sc = s.scale * (s.r / 18);
  const H = hot(s);
  const E = el(s);
  const tSlow = s.t * 0.8; // he trudges
  drawJoe(ctx, HOLLOW_LOOK, {
    x: s.x,
    y: s.y,
    facing: s.facing,
    t: tSlow,
    moving: s.moving,
    squash: s.squash,
    flash: s.flash,
    tint: null,
    alpha: 1,
    scale: sc,
    drawWeapon: (c) => {
      c.save();
      const a = s.facing + pose.rot;
      const ox = Math.cos(s.facing + 0.9) * 10;
      const oy = Math.sin(s.facing + 0.9) * 10 + 2;
      // the swing trail in the attack's colour
      if (H && s.pose === 'attack') {
        if (thrust) streak(c, ox, oy, ox + Math.cos(a) * (pose.ext + 30), oy + Math.sin(a) * (pose.ext + 30), 5, H, 0.6);
        else swingTrail(c, ox, oy, 26, a - 1.2 * Math.sign(pose.rot || 1), a, 9, H, 0.6);
      }
      c.translate(ox + Math.cos(a) * pose.ext, oy + Math.sin(a) * pose.ext);
      c.rotate(a);
      drawWeapon(c, weapon, 0);
      c.fillStyle = s.flash ? '#ffffff' : HOLLOW_LOOK.skin;
      c.beginPath();
      c.arc(0, 0, 4.5, 0, TAU);
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = OUTLINE;
      c.stroke();
      c.restore();
      if (isPairedWeapon(weapon)) {
        c.save();
        c.translate(Math.cos(s.facing - 0.9) * 10, Math.sin(s.facing - 0.9) * 10 + 2);
        c.rotate(s.facing - pose.rot * 0.8);
        drawWeapon(c, weapon, 0);
        c.restore();
      }
    },
  });
  if (s.flash) return;
  // the void leaking out of him: slow wisps rising from his shoulders
  for (let i = 0; i < 3; i++) {
    const k = (s.t * 0.35 + i / 3) % 1;
    const wx = s.x + Math.sin(s.t * 1.3 + i * 2.2) * 9 * sc;
    const wy = s.y - 12 * sc - k * 26 * sc;
    glow(ctx, wx, wy, (5 + k * 4) * sc, E.glow, 0.45 * (1 - k));
    ctx.fillStyle = withAlpha('#0d0b11', 0.5 * (1 - k));
    ctx.beginPath();
    ctx.arc(wx, wy, (1.6 + k * 1.5) * sc, 0, TAU);
    ctx.fill();
  }
});

// ---------------------------------------------------------------- Void Mote: a spiky speck of nothing with one pale eye
registerDraw('abyss_void_mote', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const ph = s.variant * 1.7;
  const y = s.y - r * 0.9 + Math.sin(s.t * 5 + ph) * 2.5;
  floorShadow(ctx, s.x, s.y + r * 0.5, r * 0.7, r * 0.26, 0.22);
  // comet tail behind the motion
  const [tx, ty] = fwdP(f, s.x, y, -r * (1.6 + s.moving * 1.0), 0.6);
  smooth2(ctx, s, [s.x - f.px * r * 0.6, y - f.py * r * 0.3, tx, ty, tx, ty, s.x + f.px * r * 0.6, y + f.py * r * 0.3], shade(E.main, 0.9), 2, 0);
  glow(ctx, s.x, y, r * 2.6, H ?? E.glow, H ? 0.75 : 0.45);
  // spiked corona, turning; the spikes stretch when it collapses
  const swell = 1 - s.squash * 0.3;
  const n = 7;
  const pts: number[] = [];
  const rot = s.t * 2 + ph;
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU;
    const rr = i % 2 === 0 ? r * (1.15 + 0.12 * Math.sin(s.t * 9 + i)) * swell : r * 0.6 * swell;
    pts.push(s.x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  poly2(ctx, s, pts, E.main, 0.6, 2.5, E.deep);
  sheen(ctx, [s.x - r * 0.45, y - r * 0.35, s.x, y - r * 0.55, s.x + r * 0.4, y - r * 0.35], E.glow, 1.4, 0.8);
  // one pale eye looking where it is going
  if (!f.back) {
    const ex = s.x + f.fx * r * 0.22;
    const ey = y + f.fy * r * 0.15;
    ell(ctx, s, ex, ey, r * 0.34, r * 0.3, '#d8d0e6', 2, 1.5);
    eye(ctx, ex + f.fx * r * 0.08, ey + f.fy * r * 0.06, r * 0.15, s.flash ? '#ffffff' : (H ? '#ffffff' : '#0d0b11'), 0);
  }
});

// ---------------------------------------------------------------- Eye of the Deep: a lidded eye in a fleshy orb, tentacles below
registerDraw('abyss_eye', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const y = s.y - r * 0.95 + Math.sin(s.t * 2.2) * 3;
  floorShadow(ctx, s.x, s.y + r * 0.6, r * 0.8, r * 0.28, 0.22);
  const charging = striking(s);
  // dangling tentacles
  for (let i = 0; i < 4; i++) {
    const bx = s.x + (i - 1.5) * r * 0.38;
    const wav = Math.sin(s.t * 3 + i * 1.4) * r * 0.25;
    const a = Math.PI / 2 + (i - 1.5) * 0.25;
    horn(ctx, s, bx, y + r * 0.6, a + wav * 0.02, r * (1.2 + (i % 2) * 0.3), r * 0.17, Math.sin(s.t * 2.5 + i) * 0.6, shade(E.main, 1.5), 2.5);
  }
  glow(ctx, s.x, y, r * 2.4, H ?? E.glow, charging ? 0.7 : 0.4);
  // the fleshy orb, crowned with little horns
  for (let i = -2; i <= 2; i++) horn(ctx, s, s.x + i * r * 0.32, y - r * 0.78 + Math.abs(i) * r * 0.16, -Math.PI / 2 + i * 0.42, r * (0.42 - Math.abs(i) * 0.06), r * 0.12, i * 0.15, BONE, 1.8);
  smooth2(ctx, s, [s.x - r * 1.0, y + r * 0.05, s.x - r * 0.85, y - r * 0.7, s.x, y - r * 0.98, s.x + r * 0.85, y - r * 0.7, s.x + r * 1.0, y + r * 0.05, s.x + r * 0.7, y + r * 0.78, s.x, y + r * 0.92, s.x - r * 0.7, y + r * 0.78], shade(E.main, 1.2), 0.6, 3, E.deep);
  sheen(ctx, [s.x - r * 0.75, y - r * 0.55, s.x - r * 0.3, y - r * 0.82], E.glow, 1.6, 0.8);
  // the eye: lids open wide while charging, shut in a blink
  const blink = (s.t + s.variant * 0.7) % 4.5 < 0.14;
  const open = blink ? 0.05 : charging ? 0.72 : 0.5;
  const ew = r * 0.78;
  const eh = r * open;
  const ecx = s.x + f.fx * r * 0.1;
  const ecy = y + r * 0.02 + f.fy * r * 0.06;
  ctx.beginPath();
  ctx.moveTo(ecx - ew, ecy);
  ctx.quadraticCurveTo(ecx, ecy - eh * 1.6, ecx + ew, ecy);
  ctx.quadraticCurveTo(ecx, ecy + eh * 1.6, ecx - ew, ecy);
  ctx.closePath();
  ctx.fillStyle = s.flash ? '#ffffff' : '#ece6f2';
  ctx.fill();
  if (!blink && !s.flash) {
    ctx.save();
    ctx.clip();
    const ix = ecx + f.fx * ew * 0.38;
    const iy = ecy + f.fy * eh * 0.4;
    const ir = r * (charging ? 0.42 : 0.36);
    ctx.fillStyle = H ?? E.glow;
    ctx.beginPath();
    ctx.arc(ix, iy, ir, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0d0b11';
    ctx.beginPath();
    ctx.ellipse(ix + f.fx * 1.2, iy, ir * (charging ? 0.42 : 0.2), ir * 0.82, 0, 0, TAU);
    ctx.fill();
    // veins
    ctx.strokeStyle = withAlpha('#8a5a8a', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ecx - ew * 0.9, ecy);
    ctx.lineTo(ecx - ew * 0.55, ecy - eh * 0.2);
    ctx.moveTo(ecx + ew * 0.9, ecy);
    ctx.lineTo(ecx + ew * 0.6, ecy + eh * 0.25);
    ctx.stroke();
    ctx.restore();
    spec(ctx, ix - ir * 0.4, iy - ir * 0.4, Math.max(1.2, r * 0.07), 0.9);
  }
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  // lashes along the upper lid
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    const k = i / 2.5;
    const lx = ecx + k * ew;
    const ly = ecy - eh * 1.6 * (1 - k * k) * 0.5;
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + k * r * 0.12, ly - r * 0.16);
  }
  ctx.stroke();
  if (s.pose === 'attack') glow(ctx, ecx + f.fx * ew * 0.4, ecy, r * 1.0, H ?? '#ffffff', 0.6);
});

// ---------------------------------------------------------------- Abyssal Knight: horned void plate, greatsword, torn cape
registerDraw('abyss_knight', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1, 4);
  shadow(ctx, s.x, s.y, r);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.42 * (1 - s.squash * 0.08) + b;
  const PLATE = '#3a3546';
  const cape = (): void => {
    const pts = [x - w * 0.6, top, x + w * 0.6, top, x + w * 0.85, gy - r * 0.05];
    ragHem(pts, x - w * 0.85, x + w * 0.85, gy - r * 0.05, 4, r * 0.18, s.t, 0.3);
    poly2(ctx, s, pts, '#1c1824', 0.7, 2.5, E.deep);
  };
  // greatsword: raised back in the windup, swept through in the attack
  const sword = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.6 * wf, 1);
    const fa = Math.atan2(f.fy * 0.55, f.fx);
    let a: number;
    let from = 0;
    if (s.pose === 'windup') a = -Math.PI / 2 - f.dir * (0.4 + 0.6 * Math.min(1, s.poseT / 0.7));
    else if (s.pose === 'attack') {
      const idx = Math.floor(s.poseT / 0.55);
      const k = Math.min(1, (s.poseT % 0.55) / 0.3);
      const d = (idx % 2 === 0 ? 1 : -1) * f.dir;
      from = fa - 1.5 * d;
      a = from + 3.0 * d * k;
    } else if (s.pose === 'stagger') a = -Math.PI / 2 + f.dir * 1.3;
    else if (s.pose === 'recover') a = fa + 1.3 * f.dir;
    else a = Math.atan2(0.85, f.fx * 0.5 + f.px * 0.2);
    const hx = sx + Math.cos(a) * r * 0.45;
    const hy = sy + Math.sin(a) * r * 0.45 + r * 0.12;
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.7, f.px, 0.6);
    const L = r * 2.1;
    if (H && s.pose === 'attack') swingTrail(ctx, sx, sy, r * 0.45 + L * 0.85, from, a, r * 0.55, H, 0.75);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.26, r * 0.22, PLATE);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(a);
    stick(ctx, s, -r * 0.28, 0, 0, 0, r * 0.1, '#2a2236', 2);
    poly2(ctx, s, [-r * 0.04, -r * 0.34, r * 0.1, -r * 0.3, r * 0.1, r * 0.3, -r * 0.04, r * 0.34], '#5a5268', 2, 2);
    poly2(ctx, s, [r * 0.1, -r * 0.16, L * 0.86, -r * 0.13, L, 0, L * 0.86, r * 0.13, r * 0.1, r * 0.16], '#2e2a38', 2, 2.5);
    sheen(ctx, [r * 0.16, -r * 0.08, L * 0.86, -r * 0.07, L * 0.97, 0], H ?? E.glow, 1.6, 1);
    ctx.restore();
    if (H) glow(ctx, hx + Math.cos(a) * L * 0.6, hy + Math.sin(a) * L * 0.6, L * 0.45, H, 0.45);
    ell(ctx, s, hx, hy, r * 0.12, r * 0.11, '#4a4458', 0.6, 2);
  };
  const offArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.6 * wf, -1);
    const [hx, hy] = sideP(f, sx + f.fx * r * 0.25, sy + r * 0.55, r * 0.08, -1);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.72, -f.px, 0.4);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.26, r * 0.22, PLATE);
    claws(ctx, s, hx, hy, Math.PI / 2 + f.fx * 0.4, r * 0.22, 3, 0.35, BONE, 1.2, 0.2);
  };
  if (!f.back) cape();
  if (armBehind(f, 1)) sword();
  if (armBehind(f, -1)) offArm();
  legs(ctx, s, f, x, s.y + r * 0.3 + b, gy, r * 0.3, r * 0.26, PLATE, '#1c1824', r * 0.25, 8);
  // breastplate with a void-glow seam
  poly2(ctx, s, [x - w * 0.7, top, x - w * 0.36, top - r * 0.14, x + w * 0.36, top - r * 0.14, x + w * 0.7, top, x + w * 0.56, s.y + r * 0.32 + b, x, s.y + r * 0.46 + b, x - w * 0.56, s.y + r * 0.32 + b], PLATE, 0.6, 3, '#24202e');
  if (!f.back) {
    const ox = x + f.fx * w * 0.14;
    sheen(ctx, [ox, top - r * 0.08, ox, s.y + r * 0.38 + b], E.glow, 1.8, 0.9);
    sheen(ctx, [x - w * 0.6, top + r * 0.18, ox, top + r * 0.32, x + w * 0.6, top + r * 0.18], E.glow, 1.4, 0.7);
  } else cape();
  // spiked pauldrons
  for (const side of [-1, 1]) {
    const [px, py] = sideP(f, x, top, r * 0.66 * wf, side);
    horn(ctx, s, px + f.px * side * r * 0.08, py - r * 0.08, -Math.PI / 2 + f.px * side * 0.7, r * 0.38, r * 0.12, 0, BONE, 1.8);
    smooth2(ctx, s, [px - r * 0.28, py + r * 0.14, px - r * 0.24, py - r * 0.16, px, py - r * 0.24, px + r * 0.24, py - r * 0.16, px + r * 0.28, py + r * 0.14, px, py + r * 0.22], '#4a4458', 0.55, 2.5);
  }
  if (!armBehind(f, 1)) sword();
  if (!armBehind(f, -1)) offArm();
  // horned helm with a glowing visor
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.34;
  for (const side of [-1, 1]) {
    const [bx, by] = sideP(f, hx, hy - r * 0.12, r * 0.3, side, 0.3);
    horn(ctx, s, bx, by, -Math.PI / 2 + f.px * side * 0.8 - f.fx * 0.4, r * 0.62, r * 0.15, -f.px * side * 0.5, BONE, 2);
  }
  smooth2(ctx, s, [hx - r * 0.34, hy + r * 0.3, hx - r * 0.38, hy - r * 0.12, hx - r * 0.2, hy - r * 0.38, hx + r * 0.2, hy - r * 0.38, hx + r * 0.38, hy - r * 0.12, hx + r * 0.34, hy + r * 0.3, hx, hy + r * 0.42, hx, hy + r * 0.42], '#4a4458', 0.6);
  if (!f.back) slits(ctx, f, hx + f.fx * r * 0.14, hy + r * 0.02, r * 0.12, r * 0.14, r * 0.08, s.flash ? '#ffffff' : (H ?? VEYE), 0.25);
  sheen(ctx, [hx - r * 0.3, hy - r * 0.16, hx - r * 0.12, hy - r * 0.32], E.glow, 1.5, 0.8);
});

// ---------------------------------------------------------------- Nullwraith: a ragged hood with bone claws, mostly not there
registerDraw('abyss_nullwraith', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const x = s.x;
  const y = s.y - r * 0.45 + Math.sin(s.t * 3) * 2.5;
  // the shimmer that gives it away
  ctx.save();
  ctx.strokeStyle = withAlpha(PALE, 0.5);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a0 = s.t * 2.5 + i * 2.1;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.35 + Math.sin(s.t * 6 + i) * 2, a0, a0 + 0.9);
    ctx.stroke();
  }
  ctx.restore();
  floorShadow(ctx, x, s.y + r * 0.6, r * 0.8, r * 0.28, 0.2);
  const prevA = ctx.globalAlpha;
  ctx.globalAlpha = prevA * 0.88;
  const reach = s.pose === 'attack' ? 1.6 : s.pose === 'windup' ? 0.3 : 0.85;
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, y - r * 0.25, r * 0.5, side);
    const [hx, hy] = s.pose === 'windup' ? sideP(f, sx, sy - r * 0.55, r * 0.35, side) : fwdP(f, ...sideP(f, sx, sy + r * 0.3, r * 0.12, side), r * reach);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.2, f.px * side, 0.4);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.14, r * 0.1, '#cfc6de', 2.5);
    const a = Math.atan2(hy - ey, hx - ex);
    if (H && s.pose === 'attack') streak(ctx, ex, ey, hx + Math.cos(a) * r * 0.6, hy + Math.sin(a) * r * 0.6, 4, H, 0.7);
    claws(ctx, s, hx, hy, a, r * 0.55, 3, 0.4, BONE, 1.6, 0.35);
    if (H) glow(ctx, hx + Math.cos(a) * r * 0.3, hy + Math.sin(a) * r * 0.3, r * 0.6, H, 0.6);
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  // ragged cloak: shoulders to a torn, streaming hem
  const cl = [x - r * 0.42, y - r * 0.55, x + r * 0.42, y - r * 0.55, x + r * 0.85, y + r * 0.1, x + r * 0.8, y + r * 0.85];
  ragHem(cl, x - r * 0.8, x + r * 0.8, y + r * 0.85, 4, r * 0.35, s.t * 1.2, 3.3);
  cl.push(x - r * 0.85, y + r * 0.1);
  poly2(ctx, s, cl, E.main, 0.55, 2.5, E.deep);
  sheen(ctx, [x - r * 0.38, y - r * 0.45, x - r * 0.72, y + r * 0.15, x - r * 0.66, y + r * 0.7], E.glow, 1.6, 0.8);
  sheen(ctx, [x + r * 0.38, y - r * 0.45, x + r * 0.72, y + r * 0.15, x + r * 0.66, y + r * 0.7], E.glow, 1.6, 0.5);
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // the empty hood and its two eyes
  const hx = x + f.fx * r * 0.1 + f.fx * s.moving * 3;
  const hy = y - r * 0.72;
  smooth2(ctx, s, [hx - r * 0.46, hy + r * 0.36, hx - r * 0.5, hy - r * 0.08, hx - r * 0.22, hy - r * 0.46, hx - f.fx * r * 0.32, hy - r * 0.66, hx + r * 0.22, hy - r * 0.46, hx + r * 0.5, hy - r * 0.08, hx + r * 0.46, hy + r * 0.36], shade(E.main, 1.15), 0.68, 2.5, E.deep);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.18;
    const rw = r * (0.3 - 0.1 * Math.abs(f.fx));
    smooth2(ctx, s, [fx2 - rw, hy + r * 0.02, fx2, hy - r * 0.26, fx2 + rw, hy + r * 0.02, fx2 + rw * 0.6, hy + r * 0.3, fx2 - rw * 0.6, hy + r * 0.3], '#06030a', 2, 2);
    eyes2(ctx, f, fx2 + f.fx * 1.5, hy + r * 0.02, r * 0.11, Math.max(1.3, r * 0.075), s.flash ? '#ffffff' : (H ?? VEYE), 0.55);
  }
  ctx.globalAlpha = prevA;
});

// ---------------------------------------------------------------- Maw: a lipped, toothed pit with feelers and a gravity well
registerDraw('abyss_maw', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  // the pull field: arcs drifting inward at the pull speed (60 px/s) from 350 px
  ctx.save();
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const rr = 350 - ((s.t * 60 + i * 87.5) % (350 - r));
    ctx.strokeStyle = withAlpha(PALE, 0.05 + 0.14 * (1 - rr / 350));
    for (let k = 0; k < 3; k++) {
      const a0 = k * 2.094 - s.t * 0.8 + i * 0.6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, rr, a0, a0 + 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
  // open in the windup (squash < 0), snap shut on the attack
  let open = 1 - s.squash * 0.4 + Math.sin(s.t * 2) * 0.04;
  if (s.pose === 'attack') open = 0.55 + Math.min(1, s.poseT / 0.35) * 0.45;
  const rx = r * 1.25;
  const ry = r * 0.88;
  floorShadow(ctx, s.x, s.y + 4, rx * 1.2, ry * 1.2, 0.4);
  // feelers flailing around the rim
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.5 + Math.sin(s.t * 1.5 + i) * 0.15;
    const bx = s.x + Math.cos(a) * rx * 0.92;
    const by = s.y + Math.sin(a) * ry * 0.92;
    const reach = s.pose === 'windup' ? 0.8 : 1.1;
    horn(ctx, s, bx, by, a + Math.sin(s.t * 3 + i * 2) * 0.4, r * 0.75 * reach, r * 0.14, Math.sin(s.t * 2.2 + i * 1.3) * 0.9, shade(E.main, 1.25), 2.5);
  }
  // lumpy lips
  const lips: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const k = i % 2 === 0 ? 1.05 : 0.93;
    lips.push(s.x + Math.cos(a) * rx * k, s.y + Math.sin(a) * ry * k);
  }
  smooth2(ctx, s, lips, shade(E.main, 1.35), 0.55, 3, E.main);
  sheen(ctx, [s.x - rx * 0.75, s.y - ry * 0.55, s.x - rx * 0.2, s.y - ry * 0.92, s.x + rx * 0.35, s.y - ry * 0.85], E.glow, 1.6, 0.8);
  // the hole, glowing from deep inside
  const hx = rx * 0.76 * open;
  const hy = ry * 0.7 * open;
  ctx.fillStyle = '#06030a';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, hx, hy, 0, 0, TAU);
  ctx.fill();
  glow(ctx, s.x, s.y + 2, r * 0.8 * open, H ?? E.glow, H ? 0.8 : 0.5);
  // two rings of teeth pointing in
  for (let ring = 0; ring < 2; ring++) {
    const n = ring === 0 ? 12 : 9;
    const kk = ring === 0 ? 1.04 : 0.7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.13 + ring * 0.3;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const wdt = ring === 0 ? 0.16 : 0.2;
      const len = (i % 2 === 0 ? 0.42 : 0.3) * (ring === 0 ? 1 : 0.8);
      poly2(ctx, s, [s.x + Math.cos(a - wdt) * hx * kk, s.y + Math.sin(a - wdt) * hy * kk, s.x + Math.cos(a + wdt) * hx * kk, s.y + Math.sin(a + wdt) * hy * kk, s.x + c * hx * kk * (1 - len), s.y + sn * hy * kk * (1 - len)], ring === 0 ? BONE : shade(BONE, 0.8), 2, 1.5);
    }
  }
  // small eyes on the upper lip, watching
  if (!s.flash) {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      const ex = s.x + Math.cos(a) * rx * 0.9;
      const ey = s.y + Math.sin(a) * ry * 0.9;
      ctx.fillStyle = VEYE;
      ctx.beginPath();
      ctx.arc(ex, ey, r * 0.09, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#06030a';
      ctx.beginPath();
      ctx.arc(ex + f.fx * r * 0.035, ey + f.fy * r * 0.035, r * 0.045, 0, TAU);
      ctx.fill();
    }
  }
});

// ---------------------------------------------------------------- Landlord's Clerk: ghostly clerk with top hat, ledger and stamp
registerDraw('abyss_clerk', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const x = s.x;
  const y = s.y - r * 0.55 + Math.sin(s.t * 2.6) * 2.5;
  floorShadow(ctx, x, s.y + r * 0.6, r * 0.7, r * 0.25, 0.22);
  const SUIT = shade(E.main, 1.2);
  // a ghostly tail instead of legs
  const sway = Math.sin(s.t * 4) * r * 0.25;
  smooth2(ctx, s, [x - r * 0.5, y + r * 0.25, x + r * 0.5, y + r * 0.25, x - f.fx * r * 0.3 + sway, y + r * 1.2, x - f.fx * r * 0.3 + sway, y + r * 1.2], SUIT, 0.5, 2.5, E.deep);
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = y - r * 0.45;
  // the stamp arm: raised in the windup, brought down on the attack
  const stampArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.46 * wf, 1);
    const [hx, hy] = s.pose === 'windup' ? [sx + f.fx * r * 0.2, sy - r * 0.6] : s.pose === 'attack' ? fwdP(f, sx, sy + r * 0.45, r * 0.6) : [sx + f.fx * r * 0.3, sy + r * 0.45];
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.75, f.px, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.2, r * 0.17, SUIT);
    stick(ctx, s, hx, hy, hx, hy - r * 0.22, r * 0.1, '#6a4a2a', 2);
    poly2(ctx, s, [hx - r * 0.18, hy, hx + r * 0.18, hy, hx + r * 0.2, hy + r * 0.14, hx - r * 0.2, hy + r * 0.14], H ?? E.glow, 2, 2);
    if (H) glow(ctx, hx, hy + r * 0.1, r * 0.7, H, 0.6);
  };
  const ledger = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.46 * wf, -1);
    const [kx, ky] = sideP(f, ...fwdP(f, x, top + r * 0.4, r * 0.35), r * 0.3, -1);
    const [ex, ey] = bend(sx, sy, kx, ky, r * 0.7, -f.px, 0.6);
    limb3(ctx, s, sx, sy, ex, ey, kx, ky, r * 0.2, r * 0.17, SUIT);
    poly2(ctx, s, [kx - r * 0.3, ky - r * 0.38, kx + r * 0.3, ky - r * 0.38, kx + r * 0.3, ky + r * 0.38, kx - r * 0.3, ky + r * 0.38], '#8a6a3a', 2, 2);
    ctx.fillStyle = s.flash ? '#ffffff' : '#f4f0e0';
    ctx.fillRect(kx - r * 0.22, ky - r * 0.26, r * 0.44, r * 0.58);
    ctx.fillStyle = '#9a90a8';
    for (let i = 0; i < 3; i++) ctx.fillRect(kx - r * 0.16, ky - r * 0.16 + i * r * 0.15, r * (i === 2 ? 0.2 : 0.32), 1);
    poly2(ctx, s, [kx - r * 0.1, ky - r * 0.44, kx + r * 0.1, ky - r * 0.44, kx + r * 0.1, ky - r * 0.34, kx - r * 0.1, ky - r * 0.34], '#a0a4ae', 2, 1.5);
  };
  if (armBehind(f, 1)) stampArm();
  if (armBehind(f, -1)) ledger();
  // suit: tails, lapels, a white shirt and a void-glow tie
  poly2(ctx, s, [x - w * 0.52, top, x + w * 0.52, top, x + w * 0.58, y + r * 0.4, x - w * 0.58, y + r * 0.4], SUIT, 0.6, 2.5, E.deep);
  if (!f.back) {
    const ox = x + f.fx * w * 0.14;
    poly2(ctx, s, [ox - r * 0.16, top + r * 0.02, ox + r * 0.16, top + r * 0.02, ox, top + r * 0.5], '#efe6d2', 2, 1.5);
    poly2(ctx, s, [ox - r * 0.04, top + r * 0.06, ox + r * 0.04, top + r * 0.06, ox + r * 0.06, top + r * 0.36, ox, top + r * 0.44, ox - r * 0.06, top + r * 0.36], E.glow, 2, 1);
  }
  sheen(ctx, [x - w * 0.5, top + r * 0.05, x - w * 0.56, y + r * 0.36], E.glow, 1.4, 0.7);
  if (!armBehind(f, 1)) stampArm();
  if (!armBehind(f, -1)) ledger();
  // gaunt pale head, round spectacles, a pointed grin, a tall hat
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.34;
  smooth2(ctx, s, [hx - r * 0.3, hy - r * 0.05, hx - r * 0.26, hy - r * 0.26, hx + r * 0.26, hy - r * 0.26, hx + r * 0.3, hy - r * 0.05, hx + r * 0.16, hy + r * 0.34, hx, hy + r * 0.42, hx - r * 0.16, hy + r * 0.34], '#c8bcd8', 0.62, 2.5);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.12;
    ctx.strokeStyle = s.flash ? '#ffffff' : '#efe6ff';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const [ex, ey] = sideP(f, fx2, hy - r * 0.02, r * 0.13, side, 0.3);
      ctx.moveTo(ex + r * 0.09, ey);
      ctx.arc(ex, ey, r * 0.09, 0, TAU);
    }
    ctx.stroke();
    eyes2(ctx, f, fx2, hy - r * 0.02, r * 0.13, Math.max(1, r * 0.045), H ?? '#2a2236', 0);
    // a thin, pleased grin
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx2 - r * 0.12, hy + r * 0.16);
    ctx.quadraticCurveTo(fx2, hy + r * 0.24, fx2 + r * 0.12, hy + r * 0.14);
    ctx.stroke();
  }
  poly2(ctx, s, [hx - r * 0.46, hy - r * 0.2, hx + r * 0.46, hy - r * 0.2, hx + r * 0.42, hy - r * 0.32, hx - r * 0.42, hy - r * 0.32], '#1a1424', 2, 2);
  poly2(ctx, s, [hx - r * 0.3, hy - r * 0.3, hx + r * 0.3, hy - r * 0.3, hx + r * 0.27, hy - r * 0.95, hx - r * 0.27, hy - r * 0.95], '#1a1424', 0.75, 2.5);
  sheen(ctx, [hx - r * 0.28, hy - r * 0.45, hx + r * 0.28, hy - r * 0.45], E.glow, 2.5, 1);
  // eviction notices orbiting him
  for (let i = 0; i < 3; i++) {
    const a = s.t * 1.6 + i * 2.094;
    const nx = x + Math.cos(a) * r * 1.5;
    const ny = y - r * 0.2 + Math.sin(a) * r * 0.6;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(Math.sin(s.t * 3 + i) * 0.4);
    poly2(ctx, s, [-r * 0.22, -r * 0.28, r * 0.22, -r * 0.28, r * 0.22, r * 0.28, -r * 0.22, r * 0.28], '#f4f0e0', 2, 1.5);
    ctx.fillStyle = '#c03a3a';
    ctx.fillRect(-r * 0.14, -r * 0.16, r * 0.28, r * 0.08);
    ctx.restore();
  }
});

// ---------------------------------------------------------------- Star-Eater: a hunched starfield beast with a swallowed sun
const STAR_DOTS: [number, number, number][] = [];
for (let i = 0; i < 12; i++) STAR_DOTS.push([Math.cos(i * 2.39996) * (0.2 + (i % 4) * 0.16), Math.sin(i * 2.39996) * (0.2 + (i % 4) * 0.14), 0.9 + (i % 3) * 0.45]);

registerDraw('abyss_star_eater', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1.5, 2.5);
  shadow(ctx, s.x, s.y, r * 1.05, 0.4);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.82 + 0.18 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.4 * (1 - s.squash * 0.08) + b;
  const HIDE = '#2a2436';
  // long arms dragging forward; claws reach on the attack
  const reach = s.pose === 'attack' ? 1.45 : s.pose === 'windup' ? 0.55 : 0.95;
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.05, r * 0.78 * wf, side);
    const [hx, hy] = fwdP(f, ...sideP(f, x, gy - r * 0.1, r * 0.85, side), r * reach, 0.6);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 1.35, f.px * side - f.fx * 0.4, -0.3);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.32, r * 0.26, HIDE);
    const a = Math.atan2(f.fy * 0.55 + 0.25, f.fx);
    if (H && s.pose === 'attack') streak(ctx, ex, ey, hx + Math.cos(a) * r * 0.5, hy + Math.sin(a) * r * 0.5, r * 0.2, H, 0.7);
    claws(ctx, s, hx, hy, a, r * 0.42, 3, 0.45, BONE, 2.2, 0.35);
    if (H && striking(s)) glow(ctx, hx, hy, r * 0.6, H, 0.55);
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.42, r * 0.3, HIDE, '#1c1828', r * 0.15, 4);
  // nebula fins along the hunched back
  const fins = (): void => {
    for (let i = -2; i <= 2; i++) horn(ctx, s, x + i * r * 0.28, top - r * 0.2 + Math.abs(i) * r * 0.1, -Math.PI / 2 + i * 0.35, r * (0.62 - Math.abs(i) * 0.1), r * 0.12, i * 0.2, '#4a3e62', 2.5);
  };
  if (!f.back) fins();
  // the hunched starfield body
  const by = s.y + b;
  smooth2(ctx, s, [x - w * 0.95, top + r * 0.1, x - w * 0.7, top - r * 0.38, x, top - r * 0.5, x + w * 0.7, top - r * 0.38, x + w * 0.95, top + r * 0.1, x + w * 0.85, by + r * 0.45, x, by + r * 0.6, x - w * 0.85, by + r * 0.45], HIDE, 0.62, 3, '#1c1828');
  if (!s.flash) {
    const a0 = ctx.globalAlpha;
    for (let i = 0; i < STAR_DOTS.length; i++) {
      const d = STAR_DOTS[i]!;
      ctx.globalAlpha = a0 * (0.55 + 0.45 * Math.sin(s.t * 3 + i * 1.7));
      const sx = x + d[0] * w * 1.4;
      const sy = by - r * 0.05 + d[1] * r * 1.1;
      if (i % 4 === 0) sparkle(ctx, sx, sy, d[2] * 2, PALE, 0);
      else {
        ctx.fillStyle = i % 3 === 0 ? PALE : '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, d[2], 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = a0;
  }
  sheen(ctx, [x - w * 0.82, top + r * 0.05, x - w * 0.55, top - r * 0.32, x, top - r * 0.42], E.glow, 1.8, 0.8);
  // the swallowed star: brightens through a Supernova windup
  if (!f.back) {
    const core = s.pose === 'windup' ? 1 + Math.min(1, s.poseT / 1.8) : 1;
    const cx = x + f.fx * w * 0.15;
    const cy = by + r * 0.2;
    glow(ctx, cx, cy, r * 0.75 * core, H ?? '#ffe6ff', 0.6);
    sparkle(ctx, cx, cy, r * 0.28 * core, '#ffffff', s.t);
  } else fins();
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // low head thrust forward: a wide jaw that gapes before a Devour, three pinprick eyes, constellation horns
  const [hx, hy] = fwdP(f, x, top - r * 0.12, r * 0.38);
  const gape = s.pose === 'windup' ? 1.6 : s.pose === 'attack' ? 0.5 : 1;
  ctx.strokeStyle = withAlpha(PALE, 0.85);
  ctx.lineWidth = 1.5;
  for (const side of [1, -1]) {
    const [x1, y1] = sideP(f, hx, hy - r * 0.2, r * 0.3, side, 0.3);
    const x2 = x1 + f.px * r * 0.2 * side + (f.px === 0 ? side * r * 0.2 : 0);
    const y2 = y1 - r * 0.45;
    const x3 = x2 + f.px * r * 0.16 * side + (f.px === 0 ? side * r * 0.16 : 0);
    const y3 = y2 - r * 0.3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
    sparkle(ctx, x2, y2, 3, '#ffffff', 0);
    sparkle(ctx, x3, y3, 4, '#ffffff', 0.4);
  }
  smooth2(ctx, s, [hx - r * 0.45, hy, hx - r * 0.38, hy - r * 0.28, hx, hy - r * 0.34, hx + r * 0.38, hy - r * 0.28, hx + r * 0.45, hy, hx + r * 0.3, hy + r * 0.3, hx - r * 0.3, hy + r * 0.3], '#3a3248', 0.6, 2.5, '#1c1828');
  if (!f.back) {
    const mx = hx + f.fx * r * 0.12;
    const my = hy + r * 0.1;
    ctx.fillStyle = '#06030a';
    ctx.beginPath();
    ctx.ellipse(mx, my, r * 0.3, r * 0.08 * gape, 0, 0, TAU);
    ctx.fill();
    glow(ctx, mx, my, r * 0.3 * gape, H ?? E.glow, 0.6);
    ctx.fillStyle = BONE;
    for (let i = -3; i <= 3; i++) {
      const tx = mx + i * r * 0.08;
      ctx.beginPath();
      ctx.moveTo(tx - r * 0.03, my - r * 0.08 * gape);
      ctx.lineTo(tx + r * 0.03, my - r * 0.08 * gape);
      ctx.lineTo(tx, my - r * 0.01 * gape);
      ctx.fill();
    }
    for (let i = -1; i <= 1; i++) eye(ctx, mx + i * r * 0.15, hy - r * 0.14 - Math.abs(i) * r * 0.03, Math.max(1.2, r * 0.05), s.flash ? '#ffffff' : (H ?? VEYE), 0.35);
  }
});
