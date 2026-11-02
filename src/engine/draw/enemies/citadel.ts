// Clockwork Citadel roster draw functions (brass, teal, violet, near-black steel).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const BRASS = '#b08d3c';
const TEAL = '#2aa198';
const VIOLET = '#6c4ab6';
const DARK = '#1a1a22';
const STEEL = '#5a5a68';

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** A toothed cog outline as a path (filled and outlined by the caller's style). */
function gear(ctx: CanvasRenderingContext2D, x: number, y: number, rOut: number, rIn: number, teeth: number, rot: number, fill: string): void {
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const rr = i % 4 === 0 || i % 4 === 1 ? rOut : rIn;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

/** A small clock face with two hands. */
function clockFace(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, face: string, rim: string): void {
  blob(ctx, x, y, r, r, { fill: face, under: shade(face, 0.9), outline: OUTLINE, outlineW: 2 });
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i += 3) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
    ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
    ctx.stroke();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(t * 2) * r * 0.75, y + Math.sin(t * 2) * r * 0.75);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(t * 0.3) * r * 0.5, y + Math.sin(t * 0.3) * r * 0.5);
  ctx.stroke();
}

registerDraw('citadel_tin_soldier', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.85);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  // stiff toy march: a side-to-side rock instead of a bob
  const rock = Math.sin(s.t * 9) * 0.09 * (0.3 + s.moving * 0.7);
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.8);
  ctx.rotate(rock);
  ctx.translate(-s.x, -s.y - r * 0.8);
  // wind-up key turning on its back
  const kx = s.x - fx * r * 0.7;
  const ky = s.y - fy * r * 0.7 - r * 0.1;
  limb(ctx, s.x - fx * r * 0.4, s.y - fy * r * 0.4 - r * 0.1, kx, ky, 3, fc(s, BRASS));
  const ka = s.t * 4;
  blob(ctx, kx + Math.cos(ka) * 5, ky, 4 + Math.abs(Math.cos(ka)) * 3, 5, { fill: fc(s, BRASS), outlineW: 2 });
  blob(ctx, kx - Math.cos(ka) * 5, ky, 4 + Math.abs(Math.cos(ka)) * 3, 5, { fill: fc(s, BRASS), outlineW: 2 });
  // legs
  for (const side of [-1, 1]) {
    const step = Math.sin(s.t * 9 + (side > 0 ? 0 : Math.PI)) * 3 * s.moving;
    limb(ctx, s.x + side * r * 0.3, s.y + r * 0.4, s.x + side * r * 0.3, s.y + r * 0.85 + step, 4, fc(s, '#e8e4dc'));
  }
  // teal coat with brass buttons and a white crossbelt
  poly(ctx, [s.x - r * 0.55, s.y - r * 0.55, s.x + r * 0.55, s.y - r * 0.55, s.x + r * 0.65, s.y + r * 0.5, s.x - r * 0.65, s.y + r * 0.5], fc(s, TEAL));
  ctx.strokeStyle = fc(s, '#f0ece4');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.48, s.y - r * 0.5);
  ctx.lineTo(s.x + r * 0.52, s.y + r * 0.42);
  ctx.moveTo(s.x + r * 0.48, s.y - r * 0.5);
  ctx.lineTo(s.x - r * 0.52, s.y + r * 0.42);
  ctx.stroke();
  ctx.fillStyle = fc(s, BRASS);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(s.x, s.y - r * 0.32 + i * r * 0.3, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // musket with bayonet: shouldered, levelled on windup, thrust on release
  const level = s.pose === 'windup' || s.pose === 'attack' ? 0 : -0.9;
  const thrust = s.pose === 'attack' ? 10 : s.pose === 'windup' ? -5 : 0;
  ctx.save();
  ctx.translate(s.x + fy * r * 0.55 + fx * thrust, s.y - fx * r * 0.55 + fy * thrust - r * 0.05);
  ctx.rotate(s.facing + level);
  limb(ctx, -r * 0.5, 0, r * 1.25, 0, 4, fc(s, '#6a4a2a'));
  limb(ctx, r * 0.2, 0, r * 1.25, 0, 2, fc(s, '#3a3a44'));
  poly(ctx, [r * 1.25, -2.5, r * 1.75, 0, r * 1.25, 2.5], fc(s, '#d8dce4'), OUTLINE, 2);
  ctx.restore();
  // tin face with rosy cheeks, and a tall shako with a red plume
  const hy = s.y - r * 0.85;
  blob(ctx, s.x, hy, r * 0.42, r * 0.4, { fill: fc(s, '#c8ccd4') });
  ctx.fillStyle = s.flash ? '#ffffff' : '#e07070';
  ctx.beginPath();
  ctx.arc(s.x - r * 0.24, hy + r * 0.12, 2, 0, Math.PI * 2);
  ctx.arc(s.x + r * 0.24, hy + r * 0.12, 2, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, s.x, hy - 1, s.facing, r * 0.15, 1.6, OUTLINE, 1);
  poly(ctx, [s.x - r * 0.36, hy - r * 0.22, s.x + r * 0.36, hy - r * 0.22, s.x + r * 0.32, hy - r * 1.05, s.x - r * 0.32, hy - r * 1.05], fc(s, DARK));
  ctx.fillStyle = fc(s, BRASS);
  ctx.fillRect(s.x - r * 0.16, hy - r * 0.75, r * 0.32, r * 0.3);
  blob(ctx, s.x, hy - r * 1.15, r * 0.14, r * 0.2, { fill: fc(s, '#d04040'), outlineW: 2 });
  ctx.restore();
});

registerDraw('citadel_spider', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9, 0.25);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const crouch = s.pose === 'windup' ? 0.75 : 1;
  // eight jointed legs, four per side
  for (const side of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const along = (i - 1.5) * 0.45;
      const tick = Math.sin(s.t * 26 + i * 1.7 + side) * 2.5 * (0.3 + s.moving);
      const bx = s.x + fx * r * along * 0.6;
      const by = s.y + fy * r * along * 0.6;
      const kx = bx - fy * r * 1.2 * side + fx * r * along * 0.6;
      const ky = by + fx * r * 1.2 * side + fy * r * along * 0.6 - 4 * crouch;
      const tx = kx - fy * r * 0.6 * side + fx * (tick + along * r);
      const ty = ky + fx * r * 0.6 * side + fy * (tick + along * r) + 5;
      limb(ctx, bx, by, kx, ky, 1.6, fc(s, '#7a6430'));
      limb(ctx, kx, ky, tx, ty, 1.4, fc(s, '#5a4a26'));
    }
  blob(ctx, s.x - fx * r * 0.3, s.y - fy * r * 0.3, r * 0.95, r * 0.8 * crouch, { fill: fc(s, BRASS), outlineW: 2 }, s.facing);
  blob(ctx, s.x + fx * r * 0.6, s.y + fy * r * 0.6, r * 0.5, r * 0.45, { fill: fc(s, '#8a6e2c'), outlineW: 2 }, s.facing);
  spec(ctx, s.x - fx * r * 0.5 - r * 0.2, s.y - fy * r * 0.5 - r * 0.3, 1.5);
  glow(ctx, s.x + fx * r * 0.9, s.y + fy * r * 0.9, 6, '#ff4040', 0.7);
  ctx.fillStyle = '#ff5050';
  ctx.beginPath();
  ctx.arc(s.x + fx * r * 0.85, s.y + fy * r * 0.85, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // fuse: once badly damaged it blinks faster and faster (self-destruct)
  if (s.hpFrac < 0.25) {
    const blink = Math.sin(s.t * 30) > 0;
    if (blink) glow(ctx, s.x - fx * r * 0.3, s.y - fy * r * 0.3 - r * 0.6, 12, '#ff3b3b', 0.9);
    spec(ctx, s.x - fx * r * 0.3, s.y - fy * r * 0.3 - r * 0.9, 1.5, 1);
  }
});

registerDraw('citadel_gear_turret', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y + 2, r);
  const charging = s.pose === 'windup';
  // the gear base turns slowly (faster while charging)
  const rot = s.t * (charging ? 2.5 : 0.4);
  gear(ctx, s.x, s.y + 3, r * 1.05, r * 0.82, 10, rot, fc(s, BRASS));
  blob(ctx, s.x, s.y + 3, r * 0.55, r * 0.55, { fill: fc(s, shade(BRASS, 0.7)), outlineW: 2 });
  // turret head and barrel along the facing
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const recoil = s.pose === 'attack' ? -4 : 0;
  ctx.save();
  ctx.translate(s.x + fx * recoil, s.y - 4 + fy * recoil);
  ctx.rotate(s.facing);
  poly(ctx, [0, -5, r * 1.35, -4, r * 1.35, 4, 0, 5], fc(s, STEEL));
  ctx.fillStyle = fc(s, DARK);
  ctx.fillRect(r * 1.2, -5, 4, 10);
  ctx.restore();
  blob(ctx, s.x + fx * recoil, s.y - 4 + fy * recoil, r * 0.58, r * 0.5, { fill: fc(s, '#3e4a52') });
  spec(ctx, s.x - r * 0.2, s.y - r * 0.35, 2);
  // teal lens: brightens while charging
  const lx = s.x + fx * (r * 0.3 + recoil);
  const ly = s.y - 4 + fy * (r * 0.3 + recoil);
  glow(ctx, lx, ly, charging ? 18 : 9, TEAL, charging ? 0.9 : 0.6);
  blob(ctx, lx, ly, 3.5, 3.5, { fill: s.flash ? '#ffffff' : '#9af0e6', outlineW: 1.5 });
  if (charging) glow(ctx, s.x + fx * r * 1.4, s.y - 4 + fy * r * 1.4, 10 + Math.sin(s.t * 30) * 3, '#ff5a5a', 0.7);
});

registerDraw('citadel_brass_juggernaut', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.05);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 3);
  // the exposed backplate: a glowing furnace grate on its back
  const gx = s.x - fx * r * 0.7;
  const gy = s.y - fy * r * 0.7 + b;
  glow(ctx, gx, gy, r * 1.0, '#ff8a2a', 0.45 + Math.sin(s.t * 5) * 0.1);
  // smokestacks with puffs
  for (const side of [-1, 1]) {
    const cx = s.x - fx * r * 0.55 - fy * r * 0.4 * side;
    const cy = s.y - fy * r * 0.55 + fx * r * 0.4 * side - r * 0.6 + b;
    poly(ctx, [cx - 4, cy + 8, cx + 4, cy + 8, cx + 5, cy - 10, cx - 5, cy - 10], fc(s, DARK));
    const k = (s.t * 0.8 + (side > 0 ? 0.5 : 0)) % 1;
    glow(ctx, cx, cy - 14 - k * 22, 8 + k * 8, '#9a9aa6', 0.5 * (1 - k));
  }
  // piston arms: one fires forward on release (Overdrive alternates them)
  const left = Math.floor(s.poseT / 0.26) % 2 === 0;
  for (const side of [-1, 1]) {
    const fire = s.pose === 'attack' && (side < 0) === left ? 1 : 0;
    const back = s.pose === 'windup' ? 1 : 0;
    const sx = s.x - fy * r * 0.8 * side;
    const sy = s.y + fx * r * 0.8 * side + b;
    const ex = sx + fx * r * (0.5 + fire * 0.9 - back * 0.25);
    const ey = sy + fy * r * (0.5 + fire * 0.9 - back * 0.25);
    limb(ctx, sx, sy, ex, ey, 7, fc(s, STEEL));
    limb(ctx, sx, sy, sx + fx * r * 0.3, sy + fy * r * 0.3, 10, fc(s, shade(BRASS, 0.8)));
    blob(ctx, ex, ey, r * 0.3, r * 0.28, { fill: fc(s, '#3e3e48') });
  }
  // boiler body with rivet bands
  blob(ctx, s.x, s.y + b, r * 0.95, r * 0.9 * (1 - s.squash * 0.07), { fill: fc(s, BRASS) });
  ctx.fillStyle = fc(s, shade(BRASS, 0.75));
  ctx.fillRect(s.x - r * 0.85, s.y - r * 0.15 + b, r * 1.7, r * 0.14);
  ctx.fillStyle = fc(s, '#e0c878');
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(s.x + i * r * 0.32, s.y - r * 0.08 + b, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  spec(ctx, s.x - r * 0.45, s.y - r * 0.45 + b, 3);
  // grate drawn over the back of the body
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(s.facing);
  poly(ctx, [-r * 0.22, -r * 0.42, r * 0.12, -r * 0.42, r * 0.12, r * 0.42, -r * 0.22, r * 0.42], fc(s, '#3a1a0a'), OUTLINE, 2);
  ctx.fillStyle = s.flash ? '#ffffff' : '#ff9a3a';
  for (let i = -1; i <= 1; i++) ctx.fillRect(-r * 0.16, i * r * 0.22 - 2, r * 0.22, 4);
  ctx.restore();
  // domed head with a teal eye slit
  const hx = s.x + fx * r * 0.3;
  const hy = s.y - r * 0.7 + fy * r * 0.2 + b;
  blob(ctx, hx, hy, r * 0.42, r * 0.34, { fill: fc(s, '#7a6430') });
  ctx.save();
  ctx.translate(hx + fx * r * 0.2, hy + fy * r * 0.12);
  ctx.rotate(s.facing + Math.PI / 2);
  ctx.fillStyle = s.flash ? '#ffffff' : '#7af0e0';
  ctx.fillRect(-r * 0.25, -2, r * 0.5, 4);
  ctx.restore();
  glow(ctx, hx + fx * r * 0.25, hy + fy * r * 0.15, 9, TEAL, 0.6);
});

registerDraw('citadel_magister', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 2.5);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  const hy = s.y - r * 0.95 + b;
  // clock-face halo behind the head (spins faster while casting)
  glow(ctx, s.x, hy, r * 1.6, VIOLET, casting ? 0.7 : 0.35);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(s.x, hy - 2, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = fc(s, BRASS);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  const spin = s.t * (casting ? 6 : 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + spin * 0.1;
    spec(ctx, s.x + Math.cos(a) * r * 0.95, hy - 2 + Math.sin(a) * r * 0.95, i % 3 === 0 ? 1.8 : 1, 0.9);
  }
  // violet robe with a high brass collar
  poly(ctx, [s.x - r * 0.45, s.y - r * 0.6 + b, s.x - r * 0.9, s.y + r * 0.85, s.x + r * 0.9, s.y + r * 0.85, s.x + r * 0.45, s.y - r * 0.6 + b], fc(s, VIOLET));
  ctx.fillStyle = fc(s, shade(VIOLET, 0.7));
  ctx.fillRect(s.x - r * 0.84, s.y + r * 0.45, r * 1.68, r * 0.33);
  ctx.fillStyle = fc(s, BRASS);
  ctx.fillRect(s.x - r * 0.06, s.y - r * 0.5 + b, r * 0.12, r * 1.3);
  poly(ctx, [s.x - r * 0.5, s.y - r * 0.55 + b, s.x - r * 0.35, s.y - r * 0.9 + b, s.x + r * 0.35, s.y - r * 0.9 + b, s.x + r * 0.5, s.y - r * 0.55 + b], fc(s, BRASS), OUTLINE, 2);
  // hourglass staff at its side, raised while casting
  const lift = casting ? r * 0.5 : 0;
  const sx = s.x + fy * r * 0.85 + fx * r * 0.2;
  const sy = s.y - fx * r * 0.85 + fy * r * 0.2 + b;
  limb(ctx, sx, sy + r * 0.8 - lift, sx, sy - r * 1.1 - lift, 3, fc(s, '#4a3a2a'));
  const ty = sy - r * 1.3 - lift;
  poly(ctx, [sx - 6, ty - 8, sx + 6, ty - 8, sx, ty, sx + 6, ty + 8, sx - 6, ty + 8, sx, ty], fc(s, '#e8e0c8'), OUTLINE, 2);
  glow(ctx, sx, ty, casting ? 16 : 8, TEAL, 0.7);
  // pale face with glowing teal eyes
  blob(ctx, s.x + fx * 1.5, hy, r * 0.4, r * 0.4, { fill: fc(s, '#d8ccc0') });
  eyes(ctx, s.x + fx * 3, hy - 1, s.facing, r * 0.15, 1.8, s.flash ? '#ffffff' : TEAL, 1.5);
  poly(ctx, [s.x - r * 0.12 + fx * 3, hy + r * 0.2, s.x + r * 0.12 + fx * 3, hy + r * 0.2, s.x + fx * 4, hy + r * 0.55], fc(s, '#cfc8bc'), OUTLINE, 1.5);
});

registerDraw('citadel_pendulum_knight', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 4);
  // the pendulum blade: swings behind it like a clock, lifts on windup, sweeps through the front on release
  let a: number;
  if (s.pose === 'windup') a = s.facing + Math.PI * 0.75;
  else if (s.pose === 'attack') a = s.facing - 1.0 + Math.min(1, s.poseT / 0.12) * 2.0;
  else if (s.pose === 'recover') a = s.facing + 1.0 + Math.min(1.6, s.poseT * 2.5);
  else a = s.facing + Math.PI + Math.sin(s.t * 2.6) * 0.55;
  const px = s.x + fy * r * 0.2;
  const py = s.y - r * 0.55 - fx * r * 0.2 + b;
  const len = r * 1.5;
  const bx = px + Math.cos(a) * len;
  const by = py + Math.sin(a) * len;
  limb(ctx, px, py, bx, by, 4, fc(s, BRASS));
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, -1.15, 1.15);
  ctx.arc(-r * 0.45, 0, r * 0.75, 0.95, -0.95, true);
  ctx.closePath();
  ctx.fillStyle = fc(s, '#d0d6de');
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  if (s.pose === 'attack' || s.tint === 'blue') glow(ctx, bx, by, r * 0.9, '#e8f0ff', 0.35);
  // armoured body: dark steel with brass trim
  blob(ctx, s.x, s.y + b, r * 0.9, r * 0.85 * (1 - s.squash * 0.07), { fill: fc(s, STEEL) });
  ctx.fillStyle = fc(s, BRASS);
  ctx.fillRect(s.x - r * 0.7, s.y + r * 0.1 + b, r * 1.4, r * 0.12);
  // chest clock
  clockFace(ctx, s.x, s.y - r * 0.15 + b, r * 0.28, s.t, s.flash ? '#ffffff' : '#ece4cc', BRASS);
  // shoulder mount for the pendulum
  gear(ctx, px, py, r * 0.32, r * 0.24, 8, s.t, fc(s, BRASS));
  // helm with a slit visor
  const hx = s.x + fx * 2;
  const hy = s.y - r * 0.8 + b;
  blob(ctx, hx, hy, r * 0.48, r * 0.46, { fill: fc(s, '#6a6a7a') });
  ctx.save();
  ctx.translate(hx + fx * r * 0.25, hy + fy * r * 0.15);
  ctx.rotate(s.facing + Math.PI / 2);
  ctx.fillStyle = s.flash ? '#ffffff' : '#7af0e0';
  ctx.fillRect(-r * 0.28, -1.5, r * 0.56, 3);
  ctx.restore();
  spec(ctx, hx - r * 0.2, hy - r * 0.2, 2);
});

registerDraw('citadel_repair_drone', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 16 + Math.sin(s.t * 3.2) * 3;
  // floor shadow and an oil drip
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 8, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const drip = (s.t * 1.3) % 1;
  ctx.fillStyle = withAlpha('#2a2418', 1 - drip * 0.6);
  ctx.beginPath();
  ctx.arc(s.x, y + r * 0.8 + drip * 22, 2, 0, Math.PI * 2);
  ctx.fill();
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const working = s.pose === 'windup';
  // wrench arm reaching forward (sparks while repairing)
  const wx = s.x + fx * r * 1.3;
  const wy = y + fy * r * 1.3 + r * 0.4;
  limb(ctx, s.x + fx * r * 0.5, y + fy * r * 0.5 + r * 0.3, wx, wy, 2.5, fc(s, STEEL));
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(s.facing + (working ? Math.sin(s.t * 20) * 0.5 : 0));
  poly(ctx, [0, -4, 7, -5, 9, -1, 5, 0, 9, 1, 7, 5, 0, 4], fc(s, '#a0a4ae'), OUTLINE, 1.5);
  ctx.restore();
  if (working) {
    for (let i = 0; i < 3; i++) glow(ctx, wx + Math.sin(s.t * 31 + i * 2) * 8, wy + Math.cos(s.t * 27 + i) * 8, 6, TEAL, 0.9);
  }
  // orb body with a teal eye
  blob(ctx, s.x, y, r, r * 0.9, { fill: fc(s, BRASS) });
  ctx.fillStyle = fc(s, shade(BRASS, 0.72));
  ctx.fillRect(s.x - r * 0.9, y - 1.5, r * 1.8, 3);
  blob(ctx, s.x + fx * r * 0.45, y + fy * r * 0.35, r * 0.38, r * 0.38, { fill: fc(s, DARK), outlineW: 2 });
  glow(ctx, s.x + fx * r * 0.5, y + fy * r * 0.4, 10, TEAL, 0.8);
  spec(ctx, s.x + fx * r * 0.55 - 1, y + fy * r * 0.42 - 1, 1.5, 1);
  spec(ctx, s.x - r * 0.4, y - r * 0.45, 2);
  // rotor on top
  limb(ctx, s.x, y - r * 0.85, s.x, y - r * 1.25, 2, fc(s, STEEL));
  const ra = s.t * 30;
  const rl = r * 1.4;
  ctx.save();
  ctx.globalAlpha *= 0.85;
  limb(ctx, s.x - Math.cos(ra) * rl, y - r * 1.25 - Math.sin(ra) * rl * 0.3, s.x + Math.cos(ra) * rl, y - r * 1.25 + Math.sin(ra) * rl * 0.3, 2.5, fc(s, '#c8ccd4'));
  ctx.restore();
});

registerDraw('citadel_chronomancers_hand', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  // afterimages: where it was a moment ago
  for (let i = 2; i >= 1; i--) {
    const k = i * (0.35 + s.moving * 0.65);
    ctx.save();
    ctx.globalAlpha *= 0.18;
    blob(ctx, s.x - fx * r * 0.9 * k, s.y - fy * r * 0.9 * k, r * 0.8, r * 0.85, { fill: VIOLET, outlineW: 0 });
    ctx.restore();
  }
  shadow(ctx, s.x, s.y, r * 0.9);
  const b = bob(s, 1.2, 8);
  // hooded cloak
  poly(ctx, [s.x - r * 0.35, s.y - r * 0.8 + b, s.x - r * 0.95, s.y + r * 0.8, s.x - r * 0.3, s.y + r * 0.6, s.x, s.y + r * 0.85, s.x + r * 0.3, s.y + r * 0.6, s.x + r * 0.95, s.y + r * 0.8, s.x + r * 0.35, s.y - r * 0.8 + b], fc(s, '#3a2a5a'));
  ctx.fillStyle = fc(s, VIOLET);
  ctx.fillRect(s.x - r * 0.08, s.y - r * 0.5 + b, r * 0.16, r * 1.1);
  // the great brass gauntlet whose fingers are clock hands
  const reach = s.pose === 'attack' ? 1.6 : s.pose === 'windup' ? 0.4 : 1;
  const gx = s.x + fx * r * 0.75 * reach - fy * r * 0.35;
  const gy = s.y + fy * r * 0.75 * reach + fx * r * 0.35 + b;
  limb(ctx, s.x - fy * r * 0.4, s.y + fx * r * 0.4 + b, gx, gy, 5, fc(s, '#3a2a5a'));
  for (let i = -1; i <= 1; i++) {
    const a = s.facing + i * 0.32;
    const len = r * (i === 0 ? 1.1 : 0.8);
    poly(ctx, [gx - Math.sin(a) * 2.5, gy + Math.cos(a) * 2.5, gx + Math.cos(a) * len, gy + Math.sin(a) * len, gx + Math.sin(a) * 2.5, gy - Math.cos(a) * 2.5], fc(s, i === 0 ? '#e0c878' : BRASS), OUTLINE, 2);
  }
  blob(ctx, gx, gy, r * 0.38, r * 0.34, { fill: fc(s, BRASS) });
  spec(ctx, gx - 2, gy - 2, 1.5);
  if (s.tint) glow(ctx, gx + fx * r * 0.6, gy + fy * r * 0.6, 14, s.tint === 'red' ? '#ff3b3b' : TEAL, 0.6);
  // hood with a clock-face mask
  const hx = s.x + fx * 2;
  const hy = s.y - r * 0.85 + b;
  blob(ctx, hx, hy - r * 0.05, r * 0.55, r * 0.55, { fill: fc(s, '#2a1e44') });
  clockFace(ctx, hx + fx * r * 0.15, hy + fy * r * 0.1, r * 0.34, s.t * (s.pose === 'windup' ? -4 : 1), s.flash ? '#ffffff' : '#ece4cc', VIOLET);
  glow(ctx, hx + fx * r * 0.15, hy, r * 0.8, TEAL, 0.25);
});
