// Clockwork Citadel roster (brass, teal, violet, near-black steel — ART_AUDIO §2). The constructs are Physical,
// so they stay brass and steel with warm lamp-lit eyes; the Repair Drone's sparks are Magic blue (lightning is
// Magic now, D80) and the Magister is Void. Whatever strikes glows in the colour of the attack's type.
import { OUTLINE, glow, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';
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
  p3,
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

const BRASS = '#b08d3c';
const TEAL = '#2aa198';
const VIOLET = '#6c4ab6';
const DARK = '#1a1a22';
const STEEL = '#5a5a68';
/** warm lamp light for the Physical constructs' eyes (kept clear of the element colours) */
const LAMP = '#ffc86a';

/** A toothed cog, optionally squashed vertically (lying on the floor in 3/4 view). */
function gear(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, rOut: number, rIn: number, teeth: number, rot: number, fill: string, squash = 1, ow = 3): void {
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * TAU;
    const rr = i % 4 === 0 || i % 4 === 1 ? rOut : rIn;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr * squash;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = s.flash ? '#ffffff' : fill;
  ctx.fill();
  ctx.lineWidth = ow;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

/** A small clock face with two hands. */
function clockFace(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, r: number, t: number, face: string, rim: string): void {
  ell(ctx, s, x, y, r, r, face, 2, 2);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 12; i += 3) {
    const a = (i / 12) * TAU;
    ctx.moveTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62);
    ctx.lineTo(x + Math.cos(a) * r * 0.88, y + Math.sin(a) * r * 0.88);
  }
  ctx.stroke();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(t * 2) * r * 0.75, y + Math.sin(t * 2) * r * 0.75);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(t * 0.3) * r * 0.5, y + Math.sin(t * 0.3) * r * 0.5);
  ctx.stroke();
}

// ------------------------------------------------------------------ Tin Soldier: a wind-up toy with shako and bayonet
registerDraw('citadel_tin_soldier', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  shadow(ctx, s.x, s.y, r * 0.85);
  // stiff toy march: a side-to-side rock instead of a bob
  const rock = Math.sin(s.t * 9) * 0.08 * (0.3 + s.moving * 0.7);
  const gy = s.y + r * 0.72;
  ctx.save();
  ctx.translate(s.x, gy);
  ctx.rotate(rock);
  ctx.translate(-s.x, -gy);
  const x = s.x;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.4 * (1 - s.squash * 0.06);
  const key = (): void => {
    const [kx, ky] = fwdP(f, x, top + r * 0.3, -r * 0.55);
    const ka = s.t * 4;
    stick(ctx, s, x - f.fx * r * 0.2, top + r * 0.3, kx, ky, r * 0.1, BRASS, 2);
    for (const side of [-1, 1]) {
      const wx = kx + Math.cos(ka) * r * 0.25 * side;
      ell(ctx, s, wx, ky - r * 0.02, r * (0.12 + Math.abs(Math.cos(ka)) * 0.08), r * 0.16, BRASS, 0.6, 2);
    }
  };
  const musket = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.5 * wf, 1);
    const level = striking(s) || s.pose === 'recover';
    const thrust = s.pose === 'attack' ? r * 0.7 : s.pose === 'windup' ? -r * 0.25 : 0;
    let a: number;
    let hx: number;
    let hy: number;
    if (level) {
      a = Math.atan2(f.fy * 0.55, f.fx);
      [hx, hy] = fwdP(f, sx, sy + r * 0.15, r * 0.25 + thrust);
    } else {
      a = -Math.PI / 2 + f.dir * 0.15;
      [hx, hy] = [sx + f.fx * r * 0.08, sy + r * 0.25];
    }
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.6, f.px, 0.6);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.2, r * 0.17, TEAL);
    const L = r * 1.5;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    if (H && s.pose === 'attack') streak(ctx, hx - ca * r * 0.4, hy - sa * r * 0.4, hx + ca * (L + r * 0.5), hy + sa * (L + r * 0.5), 4, H, 0.7);
    stick(ctx, s, hx - ca * r * 0.45, hy - sa * r * 0.45, hx + ca * L * 0.55, hy + sa * L * 0.55, r * 0.16, '#6a4a2a', 3);
    stick(ctx, s, hx + ca * L * 0.3, hy + sa * L * 0.3, hx + ca * L, hy + sa * L, r * 0.08, '#3a3a44', 2);
    poly2(ctx, s, [hx + ca * L - sa * 2, hy + sa * L + ca * 2, hx + ca * (L + r * 0.45), hy + sa * (L + r * 0.45), hx + ca * L + sa * 2, hy + sa * L - ca * 2], '#d8dce4', 2, 1.6);
    ell(ctx, s, hx, hy, r * 0.11, r * 0.1, '#f0ece4', 0.6, 2);
  };
  const offArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.5 * wf, -1);
    const sw = Math.sin(s.t * 9) * r * 0.15 * s.moving;
    const hx = sx + f.fx * sw;
    const hy = sy + r * 0.55;
    stick(ctx, s, sx, sy, hx, hy, r * 0.2, TEAL);
    ell(ctx, s, hx, hy, r * 0.11, r * 0.1, '#f0ece4', 0.6, 2);
  };
  if (!f.back) key();
  if (armBehind(f, 1)) musket();
  if (armBehind(f, -1)) offArm();
  // stiff stilt legs (white trousers, black boots)
  legs(ctx, s, f, x, s.y + r * 0.3, gy, r * 0.24, r * 0.2, '#ece8e0', DARK, r * 0.3, 9);
  // teal coat with a flared skirt, white crossbelts and brass buttons
  poly2(ctx, s, [x - w * 0.5, top, x + w * 0.5, top, x + w * 0.52, s.y + r * 0.22, x + w * 0.62, s.y + r * 0.42, x - w * 0.62, s.y + r * 0.42, x - w * 0.52, s.y + r * 0.22], TEAL, 0.62);
  if (!f.back) {
    ctx.strokeStyle = fc(s, '#f0ece4');
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, top + r * 0.04);
    ctx.lineTo(x + w * 0.45, s.y + r * 0.3);
    ctx.moveTo(x + w * 0.42, top + r * 0.04);
    ctx.lineTo(x - w * 0.45, s.y + r * 0.3);
    ctx.stroke();
    ctx.fillStyle = fc(s, '#e8c870');
    const bx = x + f.fx * w * 0.1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(bx, top + r * 0.12 + i * r * 0.16, 1.6, 0, TAU);
      ctx.fill();
    }
  } else key();
  // fringed gold epaulettes
  for (const side of [-1, 1]) {
    const [ex, ey] = sideP(f, x, top + r * 0.02, r * 0.5 * wf, side);
    poly2(ctx, s, [ex - r * 0.2, ey + r * 0.06, ex - r * 0.16, ey - r * 0.08, ex + r * 0.16, ey - r * 0.08, ex + r * 0.2, ey + r * 0.06], BRASS, 0.6, 2);
    ctx.strokeStyle = fc(s, '#e8c870');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(ex + i * r * 0.07, ey + r * 0.06);
      ctx.lineTo(ex + i * r * 0.07, ey + r * 0.16);
    }
    ctx.stroke();
  }
  if (!armBehind(f, 1)) musket();
  if (!armBehind(f, -1)) offArm();
  // round tin face with painted cheeks, tall shako with brass plate and a red plume
  const hx = x + f.fx * r * 0.04;
  const hy = top - r * 0.34;
  poly2(ctx, s, [hx - r * 0.3, hy - r * 0.12, hx + r * 0.3, hy - r * 0.12, hx + r * 0.3, hy + r * 0.2, hx + r * 0.2, hy + r * 0.3, hx - r * 0.2, hy + r * 0.3, hx - r * 0.3, hy + r * 0.2], '#c8ccd4', 0.65, 2.5);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.12;
    eyes2(ctx, f, fx2, hy + r * 0.04, r * 0.11, Math.max(1.2, r * 0.06), OUTLINE, 0);
    ctx.fillStyle = s.flash ? '#ffffff' : '#e07070';
    for (const side of [-1, 1]) {
      const [cx, cy] = sideP(f, fx2, hy + r * 0.16, r * 0.17, side, 0.3);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.06, 0, TAU);
      ctx.fill();
    }
    sheen(ctx, [fx2 - r * 0.1, hy + r * 0.12, fx2, hy + r * 0.1, fx2 + r * 0.1, hy + r * 0.12], OUTLINE, 1.6, 1);
  }
  poly2(ctx, s, [hx - r * 0.3, hy - r * 0.08, hx + r * 0.3, hy - r * 0.08, hx + r * 0.27, hy - r * 0.72, hx - r * 0.27, hy - r * 0.72], DARK, 0.7, 2.5);
  poly2(ctx, s, [hx - r * 0.34, hy - r * 0.14, hx + r * 0.34 + f.fx * r * 0.1, hy - r * 0.14, hx + r * 0.3, hy - r * 0.02, hx - r * 0.3, hy - r * 0.02], '#2a2a34', 2, 2);
  if (!f.back) poly2(ctx, s, [hx - r * 0.12 + f.fx * r * 0.1, hy - r * 0.55, hx + r * 0.12 + f.fx * r * 0.1, hy - r * 0.55, hx + r * 0.1 + f.fx * r * 0.1, hy - r * 0.3, hx - r * 0.1 + f.fx * r * 0.1, hy - r * 0.3], BRASS, 0.6, 1.5);
  smooth2(ctx, s, [hx - r * 0.1, hy - r * 0.72, hx - r * 0.12, hy - r * 0.95, hx, hy - r * 1.12, hx + r * 0.12, hy - r * 0.95, hx + r * 0.1, hy - r * 0.72], '#d04040', 0.6, 2);
  ctx.restore();
});

// ------------------------------------------------------------------ Clockwork Spider: a brass spider carrying a lit bomb
registerDraw('citadel_spider', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  shadow(ctx, s.x, s.y, r * 0.95, 0.25);
  const gy = s.y + r * 0.55;
  const crouch = s.pose === 'windup' ? 0.7 : 1;
  const z = r * 0.55 * crouch;
  const near = f.py >= 0 ? 1 : -1;
  const pt = (a: number, b: number, zz: number): [number, number] => p3(f, s.x, gy, a, b, zz);
  const leg = (i: number, side: number): void => {
    const along = (i - 1.5) * 0.42;
    const tick = Math.sin(s.t * 26 + i * 1.7 + side) * r * 0.18 * (0.3 + s.moving);
    const [rx, ry] = pt(r * along * 0.5, r * 0.3 * side, z);
    const [kx, ky] = pt(r * along * 1.5 + tick * 0.5, r * 1.0 * side, z + r * 0.55);
    const [px, py] = pt(r * along * 2.4 + tick, r * 1.45 * side, 0);
    limb3(ctx, s, rx, ry, kx, ky, px, py, 1.8, 1.4, side === near ? '#8a6e2c' : '#5a4a26', 2.5);
  };
  for (let i = 0; i < 4; i++) leg(i, -near);
  // the bomb abdomen with brass bands, and the fuse
  const [bx, by] = pt(-r * 0.35, 0, z + r * 0.35);
  ell(ctx, s, bx, by, r * 0.72, r * 0.66, '#2e2e38', 0.6, 2.5);
  ctx.strokeStyle = fc(s, BRASS);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(bx, by, r * 0.7, r * 0.2, 0, 0, Math.PI);
  ctx.stroke();
  spec(ctx, bx - r * 0.28, by - r * 0.3, 1.5, 0.8);
  const fuseX = bx + r * 0.1;
  const fuseY = by - r * 0.62;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fuseX, fuseY + r * 0.1);
  ctx.quadraticCurveTo(fuseX + r * 0.3, fuseY - r * 0.1, fuseX + r * 0.15, fuseY - r * 0.4);
  ctx.stroke();
  const low = s.hpFrac < 0.25;
  const blink = !low || Math.sin(s.t * 30) > 0;
  if (blink) {
    glow(ctx, fuseX + r * 0.15, fuseY - r * 0.4, r * (low ? 1.6 : 0.8), low ? '#ff3b3b' : LAMP, low ? 0.9 : 0.6);
    sparkle(ctx, fuseX + r * 0.15, fuseY - r * 0.4, r * 0.25, '#ffffff', s.t * 9);
  }
  // brass thorax and head with a cluster of lamp eyes
  const [tx, ty] = pt(r * 0.35, 0, z + r * 0.2);
  smooth2(ctx, s, [tx - r * 0.38, ty + r * 0.1, tx - r * 0.3, ty - r * 0.25, tx + r * 0.3, ty - r * 0.25, tx + r * 0.38, ty + r * 0.1, tx, ty + r * 0.3], BRASS, 0.6, 2);
  const [qx, qy] = pt(r * 0.7, 0, z + r * 0.15);
  if (!f.back) {
    for (const side of [-1, 1]) horn(ctx, s, qx + f.px * r * 0.15 * side, qy + r * 0.05, Math.atan2(f.fy * 0.5 + 0.3, f.fx) + side * 0.3, r * 0.35, r * 0.07, -side * 0.6, '#d8c070', 1.5);
    const ec = s.flash ? '#ffffff' : (H ?? '#ff5a3a');
    eye(ctx, qx - f.px * r * 0.12, qy - r * 0.1, 1.4, ec, 0.5);
    eye(ctx, qx + f.px * r * 0.12, qy - r * 0.1, 1.4, ec, 0.5);
    eye(ctx, qx, qy - r * 0.2, 1.1, ec, 0.3);
  }
  for (let i = 0; i < 4; i++) leg(i, near);
  if (H && s.pose === 'attack') glow(ctx, qx, qy, r * 1.4, H, 0.6);
});

// ------------------------------------------------------------------ Gear Turret: a domed cannon on a turning floor cog
registerDraw('citadel_gear_turret', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  shadow(ctx, s.x, s.y + 2, r);
  const charging = s.pose === 'windup';
  const rot = s.t * (charging ? 2.5 : 0.4);
  const gy = s.y + r * 0.45;
  // the floor cog and its pedestal
  gear(ctx, s, s.x, gy, r * 1.1, r * 0.86, 12, rot, BRASS, 0.55);
  ell(ctx, s, s.x, gy, r * 0.58, r * 0.32, shade(BRASS, 0.65), 2, 2);
  poly2(ctx, s, [s.x - r * 0.42, gy, s.x - r * 0.34, s.y - r * 0.15, s.x + r * 0.34, s.y - r * 0.15, s.x + r * 0.42, gy], STEEL, 0.55, 2.5);
  ctx.strokeStyle = fc(s, BRASS);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.38, s.y + r * 0.12);
  ctx.lineTo(s.x + r * 0.38, s.y + r * 0.12);
  ctx.stroke();
  // twin barrels along the facing (behind the dome when aiming away)
  const hy = s.y - r * 0.45;
  const recoil = s.pose === 'attack' ? -r * 0.22 : 0;
  const a = Math.atan2(f.fy * 0.6, f.fx);
  const barrels = (): void => {
    for (const side of [-1, 1]) {
      const [bx, by] = sideP(f, s.x + f.fx * recoil, hy + f.fy * recoil * 0.6, r * 0.2, side, 0.4);
      const L = r * (0.3 + 1.05 * Math.abs(f.fx));
      stick(ctx, s, bx, by, bx + Math.cos(a) * L, by + Math.sin(a) * L, r * 0.2, '#3e4a52', 3);
      ell(ctx, s, bx + Math.cos(a) * L, by + Math.sin(a) * L, r * (0.12 + 0.06 * Math.abs(f.fy)), r * (0.12 + 0.05 * Math.abs(f.fy)), DARK, 2, 2);
    }
    if (s.pose === 'attack') glow(ctx, s.x + Math.cos(a) * r * 1.5, hy + Math.sin(a) * r * 1.5, r * 0.8, H ?? LAMP, 0.8);
  };
  if (f.fy < 0) barrels();
  // armoured dome with rivets and a crenellated crown
  smooth2(ctx, s, [s.x - r * 0.62, hy + r * 0.3, s.x - r * 0.66, hy - r * 0.1, s.x - r * 0.4, hy - r * 0.48, s.x + r * 0.4, hy - r * 0.48, s.x + r * 0.66, hy - r * 0.1, s.x + r * 0.62, hy + r * 0.3], '#4e5a62', 0.6);
  for (let i = -2; i <= 2; i++) poly2(ctx, s, [s.x + i * r * 0.22 - r * 0.07, hy - r * 0.38, s.x + i * r * 0.22 + r * 0.07, hy - r * 0.38, s.x + i * r * 0.22 + r * 0.07, hy - r * 0.55, s.x + i * r * 0.22 - r * 0.07, hy - r * 0.55], BRASS, 0.6, 1.8);
  sheen(ctx, [s.x - r * 0.55, hy + r * 0.12, s.x + r * 0.55, hy + r * 0.12], BRASS, 2.5, 1);
  spec(ctx, s.x - r * 0.3, hy - r * 0.25, 2, 0.7);
  // the cyclops lens: brightens while charging (white for the Physical laser)
  if (!f.back) {
    const lx = s.x + f.fx * r * 0.32;
    const ly = hy - r * 0.05 + f.fy * r * 0.08;
    const lc = charging || s.pose === 'attack' ? (H ?? '#ffffff') : LAMP;
    ell(ctx, s, lx, ly, r * 0.2, r * 0.18, BRASS, 2, 2);
    glow(ctx, lx, ly, r * (charging ? 1.0 : 0.5), lc, charging ? 0.9 : 0.6);
    eye(ctx, lx, ly, r * 0.1, s.flash ? '#ffffff' : lc, 0);
  }
  if (f.fy >= 0) barrels();
});

// ------------------------------------------------------------------ Brass Juggernaut: boiler hulk with piston fists
registerDraw('citadel_brass_juggernaut', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  const b = bob(s, 1, 3);
  shadow(ctx, s.x, s.y, r * 1.05, 0.4);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.82 + 0.18 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.42 * (1 - s.squash * 0.07) + b;
  const vent = s.atk === 'fire' && striking(s);
  // the exposed back: a glowing furnace grate
  const grate = (): void => {
    const [gx, gyy] = fwdP(f, x, s.y - r * 0.05 + b, -r * 0.3);
    glow(ctx, gx, gyy, r * 0.9, '#ff8a2a', 0.45 + Math.sin(s.t * 5) * 0.1);
    poly2(ctx, s, [gx - r * 0.35, gyy - r * 0.28, gx + r * 0.35, gyy - r * 0.28, gx + r * 0.3, gyy + r * 0.3, gx - r * 0.3, gyy + r * 0.3], '#3a1a0a', 2, 2);
    ctx.fillStyle = s.flash ? '#ffffff' : '#ff9a3a';
    for (let i = -1; i <= 1; i++) ctx.fillRect(gx - r * 0.25, gyy + i * r * 0.17 - r * 0.04, r * 0.5, r * 0.08);
  };
  const stacks = (): void => {
    for (const side of [-1, 1]) {
      const [cx, cy] = sideP(f, ...fwdP(f, x, top - r * 0.15, -r * 0.3), r * 0.45 * wf, side);
      poly2(ctx, s, [cx - r * 0.11, cy + r * 0.2, cx + r * 0.11, cy + r * 0.2, cx + r * 0.13, cy - r * 0.42, cx - r * 0.13, cy - r * 0.42], DARK, 0.6, 2.5);
      const k = (s.t * 0.8 + (side > 0 ? 0.5 : 0)) % 1;
      glow(ctx, cx, cy - r * 0.55 - k * r * 0.8, r * (0.25 + k * 0.3), '#b4b4c0', 0.55 * (1 - k));
    }
  };
  // piston arms; Overdrive alternates them
  const left = Math.floor(s.poseT / 0.26) % 2 === 0;
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.12, r * 0.82 * wf, side);
    const fire = s.pose === 'attack' && !vent && (side < 0) === left ? 1 : 0;
    const back = s.pose === 'windup' && !vent ? 1 : 0;
    const [hx, hy] = sideP(f, ...fwdP(f, sx, sy + r * 0.45, r * (0.25 + fire * 0.95 - back * 0.3)), r * 0.05, side);
    // upper arm block and the piston rod
    stick(ctx, s, sx, sy, sx + (hx - sx) * 0.45, sy + (hy - sy) * 0.45, r * 0.36, shade(BRASS, 0.8));
    stick(ctx, s, sx + (hx - sx) * 0.35, sy + (hy - sy) * 0.35, hx, hy, r * 0.16, '#c8ccd4');
    if (H && fire) streak(ctx, sx, sy, hx + (hx - sx) * 0.3, hy + (hy - sy) * 0.3, r * 0.3, H, 0.6);
    // block fist
    poly2(ctx, s, [hx - r * 0.26, hy - r * 0.22, hx + r * 0.26, hy - r * 0.22, hx + r * 0.3, hy + r * 0.2, hx - r * 0.3, hy + r * 0.2], '#3e3e48', 0.6);
    ctx.strokeStyle = fc(s, BRASS);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx - r * 0.24, hy - r * 0.06);
    ctx.lineTo(hx + r * 0.24, hy - r * 0.06);
    ctx.stroke();
  };
  if (!f.back) stacks();
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.42, r * 0.32, STEEL, DARK, r * 0.14, 5, 1.2);
  // boiler body with rivet bands and a pressure gauge
  smooth2(ctx, s, [x - w * 0.9, top - r * 0.05, x - w * 0.88, top - r * 0.3, x, top - r * 0.38, x + w * 0.88, top - r * 0.3, x + w * 0.9, top - r * 0.05, x + w * 0.85, s.y + r * 0.42 + b, x, s.y + r * 0.55 + b, x - w * 0.85, s.y + r * 0.42 + b], BRASS, 0.6);
  sheen(ctx, [x - w * 0.82, s.y - r * 0.05 + b, x + w * 0.82, s.y - r * 0.05 + b], shade(BRASS, 0.6), 3.5, 1);
  ctx.fillStyle = fc(s, '#e0c878');
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(x + i * w * 0.32, s.y - r * 0.05 + b, 1.5, 0, TAU);
    ctx.fill();
  }
  spec(ctx, x - w * 0.5, top - r * 0.12, 2.6, 0.7);
  if (!f.back) {
    const ox = x + f.fx * w * 0.2;
    if (vent) {
      // the steam vent glows with the attack's heat
      const k = s.pose === 'attack' ? 1 : Math.min(1, s.poseT / 1.2);
      glow(ctx, ox, s.y + r * 0.2 + b, r * (0.6 + k * 0.8), H ?? '#ff7a3a', 0.8);
      const [vx, vy] = fwdP(f, ox, s.y + r * 0.2 + b, r * (0.4 + k * 0.9));
      streak(ctx, ox, s.y + r * 0.2 + b, vx, vy, r * 0.35 * k + 1, H ?? '#ff7a3a', 0.5);
    }
    poly2(ctx, s, [ox - r * 0.26, s.y + r * 0.08 + b, ox + r * 0.26, s.y + r * 0.08 + b, ox + r * 0.22, s.y + r * 0.34 + b, ox - r * 0.22, s.y + r * 0.34 + b], '#2a2a32', 2, 2);
    ctx.fillStyle = s.flash ? '#ffffff' : vent ? (H ?? '#ff7a3a') : '#5a5a66';
    for (let i = -1; i <= 1; i++) ctx.fillRect(ox + i * r * 0.14 - r * 0.04, s.y + r * 0.12 + b, r * 0.08, r * 0.18);
    clockFace(ctx, s, ox - f.px * r * 0.3, top + r * 0.12, r * 0.14, s.t * 3, s.flash ? '#ffffff' : '#ece4cc', BRASS);
  } else {
    grate();
    stacks();
  }
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // small domed head with a lamp slit
  const hx = x + f.fx * r * 0.18;
  const hy = top - r * 0.38 + f.fy * r * 0.06;
  smooth2(ctx, s, [hx - r * 0.32, hy + r * 0.16, hx - r * 0.3, hy - r * 0.14, hx, hy - r * 0.28, hx + r * 0.3, hy - r * 0.14, hx + r * 0.32, hy + r * 0.16], '#7a6430', 0.6, 2.5);
  if (!f.back) {
    const vx = hx + f.fx * r * 0.12;
    const vw = r * (0.22 - 0.06 * Math.abs(f.fx));
    ctx.fillStyle = '#120e14';
    ctx.fillRect(vx - vw, hy - r * 0.04, vw * 2, r * 0.1);
    ctx.fillStyle = s.flash ? '#ffffff' : (H ?? LAMP);
    ctx.fillRect(vx - vw * 0.8, hy - r * 0.01, vw * 1.6, r * 0.04);
    glow(ctx, vx, hy, r * 0.4, H ?? LAMP, 0.5);
  }
});

// ------------------------------------------------------------------ Citadel Magister: void robes, clock hat, hourglass staff
registerDraw('citadel_magister', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const b = bob(s, 1, 2.5);
  shadow(ctx, s.x, s.y, r * 0.9);
  const x = s.x;
  const gy = s.y + r * 0.74;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.45 + b;
  const casting = striking(s);
  const ROBE = E.main === '#ece6da' ? VIOLET : E.main;
  const trim = H ?? E.glow;
  const hx = x + f.fx * r * 0.05;
  const hy = top - r * 0.36;
  // clockwork halo ring behind the head
  const spin = s.t * (casting ? 5 : 0.8);
  glow(ctx, hx, hy - r * 0.1, r * 1.4, trim, casting ? 0.6 : 0.3);
  ctx.beginPath();
  ctx.arc(hx, hy - r * 0.1, r * 0.82, 0, TAU);
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = fc(s, BRASS);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + spin * 0.1;
    const big = i % 3 === 0;
    ctx.fillStyle = big ? trim : '#ece4cc';
    ctx.beginPath();
    ctx.arc(hx + Math.cos(a) * r * 0.82, hy - r * 0.1 + Math.sin(a) * r * 0.82, big ? 1.8 : 1, 0, TAU);
    ctx.fill();
  }
  // hourglass staff, raised while casting
  const staff = (): void => {
    const [sx, sy] = sideP(f, x + f.fx * r * 0.2, s.y + r * 0.05 + b, r * 0.72, 1);
    const lift = casting ? r * 0.35 : 0;
    stick(ctx, s, sx, sy + r * 0.7 - lift, sx, sy - r * 1.05 - lift, r * 0.1, '#4a3a2a');
    const ty = sy - r * 1.3 - lift;
    poly2(ctx, s, [sx - r * 0.24, ty - r * 0.32, sx + r * 0.24, ty - r * 0.32, sx + r * 0.24, ty - r * 0.26, sx - r * 0.24, ty - r * 0.26], BRASS, 2, 1.5);
    poly2(ctx, s, [sx - r * 0.24, ty + r * 0.32, sx + r * 0.24, ty + r * 0.32, sx + r * 0.24, ty + r * 0.26, sx - r * 0.24, ty + r * 0.26], BRASS, 2, 1.5);
    poly2(ctx, s, [sx - r * 0.18, ty - r * 0.26, sx + r * 0.18, ty - r * 0.26, sx, ty, sx + r * 0.18, ty + r * 0.26, sx - r * 0.18, ty + r * 0.26, sx, ty], '#e8e0c8', 2, 1.8);
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.12, ty + r * 0.24);
    ctx.lineTo(sx + r * 0.12, ty + r * 0.24);
    ctx.lineTo(sx, ty + r * 0.08);
    ctx.fill();
    glow(ctx, sx, ty, r * (casting ? 1.1 : 0.55), trim, 0.7);
    const [ax, ay] = sideP(f, x, top + r * 0.14, r * 0.42 * wf, 1);
    const handY = sy - r * 0.35 - lift;
    const [ex, ey] = bend(ax, ay, sx, handY, r * 0.75, f.px, 0.6);
    limb3(ctx, s, ax, ay, ex, ey, sx, handY, r * 0.26, r * 0.28, ROBE);
    ell(ctx, s, sx, handY, r * 0.1, r * 0.09, '#d8ccc0', 0.6, 2);
  };
  const castHand = (): void => {
    const [ax, ay] = sideP(f, x, top + r * 0.14, r * 0.42 * wf, -1);
    const [hx2, hy2] = casting ? fwdP(f, ...sideP(f, ax, ay - r * 0.1, r * 0.1, -1), r * 0.8) : sideP(f, x + f.fx * r * 0.25, s.y + r * 0.05 + b, r * 0.15, -1);
    const [ex, ey] = bend(ax, ay, hx2, hy2, r * 0.8, -f.px, 0.6);
    limb3(ctx, s, ax, ay, ex, ey, hx2, hy2, r * 0.26, r * 0.28, ROBE);
    ell(ctx, s, hx2, hy2, r * 0.1, r * 0.09, '#d8ccc0', 0.6, 2);
    if (casting) {
      glow(ctx, hx2, hy2, r * 0.9, trim, 0.7);
      clockFace(ctx, s, hx2 + f.fx * r * 0.2, hy2 - r * 0.25, r * 0.22, -s.t * 6, withAlpha('#ece4cc', 0.9), trim);
    }
  };
  if (armBehind(f, 1)) staff();
  if (armBehind(f, -1)) castHand();
  legs(ctx, s, f, x, s.y + r * 0.4 + b, gy, r * 0.22, r * 0.18, DARK, '#120e14', r * 0.2, 8);
  // void robe with a brass hem and a high collar
  const hem = gy - r * 0.12;
  poly2(ctx, s, [x - w * 0.4, top, x + w * 0.4, top, x + w * 0.68, s.y + r * 0.2 + b, x + w * 0.82, hem, x - w * 0.82, hem, x - w * 0.68, s.y + r * 0.2 + b], ROBE, 0.64, 3, E.deep);
  sheen(ctx, [x - w * 0.8, hem - r * 0.06, x + w * 0.8, hem - r * 0.06], BRASS, 2.5, 1);
  // a void-glow rim so the dark robe reads on dark floors
  sheen(ctx, [x - w * 0.36, top + r * 0.04, x - w * 0.63, s.y + r * 0.2 + b, x - w * 0.76, hem - r * 0.1], E.glow, 1.5, 0.75);
  sheen(ctx, [x + w * 0.36, top + r * 0.04, x + w * 0.63, s.y + r * 0.2 + b, x + w * 0.76, hem - r * 0.1], E.glow, 1.5, 0.75);
  if (!f.back) {
    const ox = x + f.fx * w * 0.16;
    sheen(ctx, [ox, top + r * 0.2, ox + f.fx * 2, hem - r * 0.12], trim, 2, 0.9);
    // gear sigils down the front
    for (let i = 0; i < 2; i++) gear(ctx, s, ox, s.y + r * (0.08 + i * 0.28) + b, r * 0.1, r * 0.07, 6, s.t * (i ? -1 : 1), BRASS, 1, 1.5);
  }
  poly2(ctx, s, [x - w * 0.5, top + r * 0.08, x - w * 0.42, top - r * 0.3, x + w * 0.42, top - r * 0.3, x + w * 0.5, top + r * 0.08], BRASS, 0.6, 2.5);
  if (!armBehind(f, 1)) staff();
  if (!armBehind(f, -1)) castHand();
  // pale face, white beard, tall pointed hat bent back with a clock band
  smooth2(ctx, s, [hx - r * 0.26, hy + r * 0.05, hx - r * 0.24, hy - r * 0.16, hx + r * 0.24, hy - r * 0.16, hx + r * 0.26, hy + r * 0.05, hx + r * 0.14, hy + r * 0.28, hx - r * 0.14, hy + r * 0.28], '#d8ccc0', 0.62, 2.5);
  if (!f.back) {
    const fx2 = hx + f.fx * r * 0.1;
    poly2(ctx, s, [fx2 - r * 0.18, hy + r * 0.12, fx2 + r * 0.18, hy + r * 0.12, fx2 + f.fx * r * 0.06, hy + r * 0.62], '#e8e4ec', 0.6, 2);
    eyes2(ctx, f, fx2 + f.fx * 1.5, hy, r * 0.1, Math.max(1.2, r * 0.06), s.flash ? '#ffffff' : trim, 0.5);
    // brass monocle
    const [mx, my] = sideP(f, fx2, hy, r * 0.1, -1, 0.3);
    ctx.strokeStyle = fc(s, BRASS);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.09, 0, TAU);
    ctx.stroke();
  }
  const ty = hy - r * 0.14;
  const tipX = hx - f.fx * r * 0.45 - f.dir * r * 0.1;
  poly2(ctx, s, [hx - r * 0.42, ty, hx + r * 0.42, ty, hx + r * 0.32, ty - r * 0.12, hx + r * 0.2, ty - r * 0.7, tipX, ty - r * 1.2, hx - r * 0.2, ty - r * 0.62, hx - r * 0.32, ty - r * 0.12], ROBE, 0.75, 2.5, E.deep);
  sheen(ctx, [hx - r * 0.3, ty - r * 0.14, hx + r * 0.3, ty - r * 0.14], BRASS, 3, 1);
  if (!f.back) clockFace(ctx, s, hx + f.fx * r * 0.1, ty - r * 0.3, r * 0.12, s.t * (casting ? 8 : 1), s.flash ? '#ffffff' : '#ece4cc', BRASS);
});

// ------------------------------------------------------------------ Pendulum Knight: clock-tower helm and a giant pendulum
registerDraw('citadel_pendulum_knight', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  const b = bob(s, 1, 4);
  shadow(ctx, s.x, s.y, r);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.42 * (1 - s.squash * 0.07) + b;
  // the pendulum blade: swings behind it like a clock, lifts on windup, sweeps through the front on release
  const fa = Math.atan2(f.fy * 0.55, f.fx);
  let a: number;
  let from = 0;
  if (s.pose === 'windup') a = fa + Math.PI * 0.75 * f.dir;
  else if (s.pose === 'attack') {
    from = fa - 1.0 * f.dir;
    a = from + Math.min(1, s.poseT / 0.12) * 2.0 * f.dir;
  } else if (s.pose === 'recover') a = fa + (1.0 + Math.min(1.6, s.poseT * 2.5)) * f.dir;
  else a = fa + Math.PI + Math.sin(s.t * 2.6) * 0.55;
  const [px, py] = sideP(f, x, top - r * 0.05, r * 0.2, 1);
  const len = r * 1.45;
  const blade = (): void => {
    const bx = px + Math.cos(a) * len;
    const by = py + Math.sin(a) * len;
    if (H && s.pose === 'attack') swingTrail(ctx, px, py, len + r * 0.45, from, a, r * 0.6, H, 0.7);
    stick(ctx, s, px, py, bx, by, r * 0.14, BRASS);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, -1.1, 1.1);
    ctx.arc(-r * 0.42, 0, r * 0.72, 0.95, -0.95, true);
    ctx.closePath();
    ctx.fillStyle = fc(s, '#d0d6de');
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    sheen(ctx, [Math.cos(-0.8) * r * 0.86, Math.sin(-0.8) * r * 0.86, r * 0.88, 0, Math.cos(0.8) * r * 0.86, Math.sin(0.8) * r * 0.86], '#ffffff', 1.5, 0.9);
    ctx.restore();
    if (H) glow(ctx, bx, by, r * 0.9, H, 0.4);
  };
  const behind = Math.sin(a) < 0;
  if (behind) blade();
  // the off arm with a round buckler
  const offArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.14, r * 0.6 * wf, -1);
    const [hx, hy] = sideP(f, sx + f.fx * r * 0.3, sy + r * 0.5, r * 0.1, -1);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.75, -f.px, 0.4);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.26, r * 0.22, STEEL);
    gear(ctx, s, hx, hy, r * 0.3, r * 0.24, 8, s.t * 0.5, '#6a6a7a', 1, 2.5);
    ell(ctx, s, hx, hy, r * 0.12, r * 0.12, BRASS, 2, 2);
  };
  if (armBehind(f, -1)) offArm();
  legs(ctx, s, f, x, s.y + r * 0.3 + b, gy, r * 0.32, r * 0.26, STEEL, DARK, r * 0.2, 7);
  // armoured body, chest clock, brass trim
  poly2(ctx, s, [x - w * 0.72, top, x - w * 0.38, top - r * 0.14, x + w * 0.38, top - r * 0.14, x + w * 0.72, top, x + w * 0.6, s.y + r * 0.32 + b, x, s.y + r * 0.45 + b, x - w * 0.6, s.y + r * 0.32 + b], STEEL, 0.6);
  sheen(ctx, [x - w * 0.55, s.y + r * 0.18 + b, x + w * 0.55, s.y + r * 0.18 + b], BRASS, 3, 1);
  if (!f.back) clockFace(ctx, s, x + f.fx * w * 0.14, top + r * 0.22, r * 0.24, s.t, s.flash ? '#ffffff' : '#ece4cc', BRASS);
  else gear(ctx, s, x, top + r * 0.22, r * 0.3, r * 0.22, 8, s.t, BRASS, 1, 2.5);
  for (const side of [-1, 1]) {
    const [qx, qy] = sideP(f, x, top + r * 0.02, r * 0.66 * wf, side);
    smooth2(ctx, s, [qx - r * 0.26, qy + r * 0.14, qx - r * 0.22, qy - r * 0.14, qx, qy - r * 0.2, qx + r * 0.22, qy - r * 0.14, qx + r * 0.26, qy + r * 0.14, qx, qy + r * 0.2], '#6a6a7a', 0.55, 2.5);
  }
  if (!armBehind(f, -1)) offArm();
  // shoulder pivot gear for the pendulum
  gear(ctx, s, px, py, r * 0.3, r * 0.22, 8, s.t, BRASS, 1, 2.5);
  // clock-tower helm: a slit visor under a pointed roof
  const hx = x + f.fx * r * 0.05;
  const hy = top - r * 0.34;
  poly2(ctx, s, [hx - r * 0.32, hy + r * 0.3, hx - r * 0.32, hy - r * 0.2, hx + r * 0.32, hy - r * 0.2, hx + r * 0.32, hy + r * 0.3], '#6a6a7a', 0.6);
  poly2(ctx, s, [hx - r * 0.4, hy - r * 0.18, hx + r * 0.4, hy - r * 0.18, hx, hy - r * 0.78], '#3a3a48', 0.7, 2.5);
  sheen(ctx, [hx - r * 0.34, hy - r * 0.2, hx + r * 0.34, hy - r * 0.2], BRASS, 2.5, 1);
  ell(ctx, s, hx, hy - r * 0.8, r * 0.06, r * 0.06, BRASS, 2, 1.5);
  if (!f.back) {
    const vx = hx + f.fx * r * 0.12;
    const vw = r * (0.24 - 0.08 * Math.abs(f.fx));
    ctx.fillStyle = '#120e14';
    ctx.fillRect(vx - vw, hy - r * 0.02, vw * 2, r * 0.09);
    ctx.fillStyle = s.flash ? '#ffffff' : (H ?? LAMP);
    ctx.fillRect(vx - vw * 0.8, hy + r * 0.01, vw * 1.6, r * 0.035);
    glow(ctx, vx, hy + r * 0.02, r * 0.35, H ?? LAMP, 0.5);
  }
  if (!behind) blade();
});

// ------------------------------------------------------------------ Repair Drone: rotor orb with a wrench and an arc welder
registerDraw('citadel_repair_drone', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const E = el(s);
  const H = hot(s);
  const y = s.y - r * 1.0 + Math.sin(s.t * 3.2) * 2.5;
  floorShadow(ctx, s.x, s.y + r * 0.55, r * 0.8, r * 0.3, 0.25);
  const drip = (s.t * 1.3) % 1;
  ctx.fillStyle = withAlpha('#2a2418', 1 - drip * 0.6);
  ctx.beginPath();
  ctx.arc(s.x, y + r * 0.8 + drip * r * 1.3, 1.8, 0, TAU);
  ctx.fill();
  const working = s.pose === 'windup' || s.pose === 'attack';
  const sparkC = H ?? E.glow;
  const arm = (side: number): void => {
    const [sx, sy] = sideP(f, s.x, y + r * 0.35, r * 0.6, side);
    const [hx, hy] = fwdP(f, ...sideP(f, sx, sy + r * 0.35, r * 0.15, side), r * (working ? 0.9 : 0.5));
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.9, f.px * side, 0.8);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.12, r * 0.1, STEEL, 2.5);
    const a = Math.atan2(hy - ey, hx - ex) + (side > 0 && working ? Math.sin(s.t * 20) * 0.5 : 0);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(a);
    if (side > 0) poly2(ctx, s, [0, -r * 0.18, r * 0.32, -r * 0.22, r * 0.42, -r * 0.06, r * 0.24, 0, r * 0.42, r * 0.06, r * 0.32, r * 0.22, 0, r * 0.18], '#a0a4ae', 2, 1.5);
    else poly2(ctx, s, [0, -r * 0.08, r * 0.38, -r * 0.05, r * 0.46, 0, r * 0.38, r * 0.05, 0, r * 0.08], BRASS, 2, 1.5);
    ctx.restore();
    if (side < 0) {
      // the arc welder's tip: blue arcane sparks
      const tx = hx + Math.cos(a) * r * 0.46;
      const ty = hy + Math.sin(a) * r * 0.46;
      glow(ctx, tx, ty, r * (working ? 0.9 : 0.4), sparkC, working ? 0.85 : 0.5);
      if (working) {
        ctx.strokeStyle = sparkC;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const sa = s.t * 17 + i * 2.1;
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx + Math.cos(sa) * r * 0.35, ty + Math.sin(sa) * r * 0.35);
          ctx.lineTo(tx + Math.cos(sa + 0.6) * r * 0.6, ty + Math.sin(sa + 0.6) * r * 0.6);
        }
        ctx.stroke();
      }
    }
  };
  if (armBehind(f, -1)) arm(-1);
  if (armBehind(f, 1)) arm(1);
  // the orb: brass hemispheres split by a glowing blue seam
  ell(ctx, s, s.x, y, r, r * 0.9, BRASS, 0.55);
  ctx.fillStyle = s.flash ? '#ffffff' : E.main;
  ctx.fillRect(s.x - r * 0.95, y - r * 0.06, r * 1.9, r * 0.12);
  glow(ctx, s.x, y, r * 1.1, E.glow, 0.3);
  spec(ctx, s.x - r * 0.4, y - r * 0.45, 2, 0.8);
  if (!f.back) {
    const lx = s.x + f.fx * r * 0.42;
    const ly = y + r * 0.12 + f.fy * r * 0.18;
    ell(ctx, s, lx, ly, r * 0.36, r * 0.34, DARK, 2, 2);
    glow(ctx, lx, ly, r * 0.8, sparkC, 0.8);
    eye(ctx, lx, ly, r * 0.15, s.flash ? '#ffffff' : sparkC, 0);
    spec(ctx, lx - r * 0.08, ly - r * 0.08, 1.2, 1);
  }
  if (!armBehind(f, -1)) arm(-1);
  if (!armBehind(f, 1)) arm(1);
  // rotor on top
  stick(ctx, s, s.x, y - r * 0.85, s.x, y - r * 1.2, r * 0.12, STEEL, 2);
  const ra = s.t * 30;
  const rl = r * 1.35;
  ctx.save();
  ctx.globalAlpha *= 0.85;
  stick(ctx, s, s.x - Math.cos(ra) * rl, y - r * 1.2 - Math.sin(ra) * rl * 0.3, s.x + Math.cos(ra) * rl, y - r * 1.2 + Math.sin(ra) * rl * 0.3, r * 0.16, '#c8ccd4', 2);
  ctx.restore();
  ell(ctx, s, s.x, y - r * 1.2, r * 0.12, r * 0.08, BRASS, 2, 1.5);
});

// ------------------------------------------------------------------ Chronomancer's Hand: clock-mask assassin, clock-hand gauntlet
registerDraw('citadel_chronomancers_hand', (ctx, s) => {
  const r = s.r * s.scale;
  const f = frame(s);
  const H = hot(s);
  // afterimages: where it was a moment ago
  for (let i = 2; i >= 1; i--) {
    const k = i * (0.35 + s.moving * 0.65);
    ctx.save();
    ctx.globalAlpha *= 0.16;
    const ax = s.x - f.fx * r * 0.9 * k;
    const ay = s.y - f.fy * r * 0.5 * k;
    smooth2(ctx, s, [ax - r * 0.42, ay + r * 0.6, ax - r * 0.4, ay - r * 0.5, ax, ay - r * 1.05, ax + r * 0.4, ay - r * 0.5, ax + r * 0.42, ay + r * 0.6], VIOLET, 2, 0);
    ctx.restore();
  }
  shadow(ctx, s.x, s.y, r * 0.9);
  const b = bob(s, 1.2, 8);
  const x = s.x;
  const gy = s.y + r * 0.72;
  const wf = 0.8 + 0.2 * Math.abs(f.fy);
  const w = r * wf;
  const top = s.y - r * 0.42 + b;
  const CLOAK = '#3a2a5a';
  const gauntlet = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.14, r * 0.45 * wf, 1);
    const reach = s.pose === 'attack' ? 1.25 : s.pose === 'windup' ? 0.2 : 0.65;
    const [hx, hy] = fwdP(f, sx, sy + r * 0.3, r * reach);
    const [ex, ey] = bend(sx, sy, hx, hy, r * 0.9, f.px, 0.5);
    limb3(ctx, s, sx, sy, ex, ey, hx, hy, r * 0.24, r * 0.3, CLOAK);
    const a = Math.atan2(f.fy * 0.55, f.fx);
    if (H && s.pose === 'attack') streak(ctx, ex, ey, hx + Math.cos(a) * r * 1.1, hy + Math.sin(a) * r * 1.1, 5, H, 0.7);
    // clock-hand blades as fingers
    for (let i = -1; i <= 1; i++) {
      const fa = a + i * 0.32;
      const len = r * (i === 0 ? 1.35 : 1.0);
      poly2(ctx, s, [hx - Math.sin(fa) * 2.5, hy + Math.cos(fa) * 2.5, hx + Math.cos(fa) * len * 0.8, hy + Math.sin(fa) * len * 0.8, hx + Math.cos(fa) * len, hy + Math.sin(fa) * len, hx + Math.sin(fa) * 2.5, hy - Math.cos(fa) * 2.5], i === 0 ? '#e0c878' : BRASS, 2, 1.8);
    }
    smooth2(ctx, s, [hx - r * 0.38, hy, hx - r * 0.28, hy - r * 0.32, hx + r * 0.28, hy - r * 0.32, hx + r * 0.38, hy, hx + r * 0.26, hy + r * 0.3, hx - r * 0.26, hy + r * 0.3], BRASS, 0.6, 2.5);
    gear(ctx, s, hx, hy - r * 0.02, r * 0.14, r * 0.1, 6, s.t * 4, '#e0c878', 1, 1.5);
    if (H && striking(s)) glow(ctx, hx + Math.cos(a) * r * 0.5, hy + Math.sin(a) * r * 0.5, r * 0.8, H, 0.6);
  };
  const offArm = (): void => {
    const [sx, sy] = sideP(f, x, top + r * 0.14, r * 0.45 * wf, -1);
    const [hx, hy] = sideP(f, sx - f.fx * r * 0.15, sy + r * 0.45, r * 0.1, -1);
    stick(ctx, s, sx, sy, hx, hy, r * 0.22, CLOAK);
    claws(ctx, s, hx, hy, Math.PI / 2 - f.fx * 0.3, r * 0.2, 3, 0.35, '#d8ccc0', 1, 0.2);
  };
  if (armBehind(f, 1)) gauntlet();
  if (armBehind(f, -1)) offArm();
  legs(ctx, s, f, x, s.y + r * 0.35 + b, gy, r * 0.22, r * 0.18, '#2a1e44', DARK, r * 0.35, 12);
  // hooded cloak with a tattered hem
  const hem = gy - r * 0.18;
  const cl = [x - w * 0.42, top, x + w * 0.42, top, x + w * 0.66, s.y + r * 0.15 + b, x + w * 0.8, hem];
  ragHem(cl, x - w * 0.8, x + w * 0.8, hem, 3, r * 0.2, s.t, 0.7);
  cl.push(x - w * 0.66, s.y + r * 0.15 + b);
  poly2(ctx, s, cl, CLOAK, 0.62);
  if (!f.back) sheen(ctx, [x + f.fx * w * 0.15, top + r * 0.15, x + f.fx * w * 0.2, hem - r * 0.1], VIOLET, 2.5, 1);
  if (!armBehind(f, 1)) gauntlet();
  if (!armBehind(f, -1)) offArm();
  // hood with a clock-face mask
  const hx = x + f.fx * r * 0.06;
  const hy = top - r * 0.34;
  smooth2(ctx, s, [hx - r * 0.44, hy + r * 0.34, hx - r * 0.48, hy - r * 0.1, hx - r * 0.22, hy - r * 0.48, hx - f.fx * r * 0.2, hy - r * 0.6, hx + r * 0.22, hy - r * 0.48, hx + r * 0.48, hy - r * 0.1, hx + r * 0.44, hy + r * 0.34], '#2a1e44', 0.68);
  if (!f.back) {
    const mx = hx + f.fx * r * 0.16;
    const my = hy + r * 0.02;
    clockFace(ctx, s, mx, my, r * (0.28 - 0.06 * Math.abs(f.fx)), s.t * (s.pose === 'windup' ? -4 : 1), s.flash ? '#ffffff' : '#ece4cc', VIOLET);
    slits(ctx, f, mx + f.fx * 1.5, my - r * 0.04, r * 0.1, r * 0.09, r * 0.06, s.flash ? '#ffffff' : (H ?? LAMP), 0.4);
  }
});
