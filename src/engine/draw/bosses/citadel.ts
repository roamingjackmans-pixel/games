// Boss 7 draw functions: Archmagister Tock (Clockwork Citadel) and his corner turrets (ART_AUDIO §2: chunky
// vector shapes, 3 px outlines). A clockwork mage riding a floating gear; phase 2 he rewinds the clock: the
// gear and the hands on his chest run backward and the violet glow comes up.
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const BRASS = '#b08d3c';
const TEAL = '#2aa198';
const VIOLET = '#6c4ab6';
const STEEL = '#5a5a68';

function lift(s: DrawState): number {
  if (s.pose === 'windup') return 1;
  if (s.pose === 'attack') return -0.6;
  return 0;
}

/** A filled, outlined cog. */
function cog(ctx: CanvasRenderingContext2D, x: number, y: number, rOut: number, rIn: number, teeth: number, rot: number, fill: string, sy = 1): void {
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const rr = i % 4 === 0 || i % 4 === 1 ? rOut : rIn;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr * sy;
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

/** A clock face with two hands at angle `t` (radians of the minute hand). */
function clockFace(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, s: DrawState): void {
  blob(ctx, x, y, r, r, { fill: fc(s, '#f2ead2'), under: '#d8ccaa', outlineW: 2.5 });
  ctx.save();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72);
    ctx.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(t - Math.PI / 2) * r * 0.75, y + Math.sin(t - Math.PI / 2) * r * 0.75);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(t / 12 - Math.PI / 2) * r * 0.5, y + Math.sin(t / 12 - Math.PI / 2) * r * 0.5);
  ctx.stroke();
  ctx.restore();
}

registerDraw('boss_tock', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const px = -fy;
  const py = fx;
  const p2 = s.phase >= 1;
  const L = lift(s);
  // he floats: the shadow stays on the floor, the platform bobs above it
  const float = 14 + Math.sin(s.t * 2) * 4;
  shadow(ctx, s.x, s.y + 6, r * 0.95, 0.3);
  const gx = s.x;
  const gy = s.y - float * 0.5;
  // the gear platform (seen at an angle), turning forward — backward in phase 2
  const turn = p2 ? -s.t * 1.8 : s.t * 0.6;
  if (p2) glow(ctx, gx, gy - r * 0.4, r * 2.4, '#b06bff', 0.4 + Math.sin(s.t * 5) * 0.08);
  else glow(ctx, gx, gy, r * 1.6, TEAL, 0.25);
  cog(ctx, gx, gy + r * 0.12, r * 1.12, r * 0.92, 14, turn, shade(BRASS, 0.7), 0.5);
  cog(ctx, gx, gy, r * 1.12, r * 0.92, 14, turn, fc(s, BRASS), 0.5);
  blob(ctx, gx, gy, r * 0.62, r * 0.3, { fill: fc(s, shade(BRASS, 0.82)), outlineW: 2 });
  // the hub glows teal underneath (violet in phase 2)
  glow(ctx, gx, gy + r * 0.25, r * 0.6, p2 ? '#b06bff' : TEAL, 0.6);
  // the mage: a violet robe with brass trim and a clock on the chest
  const by = gy - r * 0.55;
  blob(ctx, gx, by + r * 0.15, r * 0.62, r * 0.7 * (1 - s.squash * 0.06), { fill: fc(s, VIOLET), under: '#4a3080' });
  poly(ctx, [gx - r * 0.6, by + r * 0.55, gx + r * 0.6, by + r * 0.55, gx + r * 0.45, by + r * 0.75, gx - r * 0.45, by + r * 0.75], fc(s, BRASS), OUTLINE, 2);
  // hands run backward in phase 2 (and fast)
  const handT = p2 ? -s.t * 6 : s.t * 0.8;
  clockFace(ctx, gx + fx * r * 0.08, by + r * 0.08, r * 0.3, handT, s);
  // the left arm holds a little gear; the right a staff with a pendulum
  const lx = gx - px * r * 0.7;
  const ly = by - py * r * 0.2 + r * 0.1;
  limb(ctx, gx - px * r * 0.45, by - py * r * 0.45, lx, ly, 9, fc(s, VIOLET));
  cog(ctx, lx, ly, r * 0.2, r * 0.14, 6, -turn * 2, fc(s, BRASS));
  const hx = gx + px * r * 0.62 + fx * r * 0.2;
  const hy = by + py * r * 0.3 - L * r * 0.45;
  limb(ctx, gx + px * r * 0.45, by + py * r * 0.45, hx, hy, 9, fc(s, VIOLET));
  const sa = s.facing + (s.pose === 'attack' ? 0.2 : s.pose === 'windup' ? -1.4 : -0.9);
  const tx = hx + Math.cos(sa) * r * 1.25;
  const ty = hy + Math.sin(sa) * r * 1.25 - L * r * 0.3;
  limb(ctx, hx - Math.cos(sa) * r * 0.35, hy - Math.sin(sa) * r * 0.35, tx, ty, 5, fc(s, STEEL));
  cog(ctx, tx, ty, r * 0.22, r * 0.15, 8, turn * 2, fc(s, BRASS));
  // pendulum under the staff head
  const sw = Math.sin(s.t * (p2 ? -4 : 3)) * 0.6;
  const pdx = tx + Math.sin(sw) * r * 0.45;
  const pdy = ty + Math.cos(sw) * r * 0.45;
  limb(ctx, tx, ty, pdx, pdy, 2, OUTLINE);
  glow(ctx, pdx, pdy, s.pose === 'windup' ? r * 0.7 : r * 0.35, p2 ? '#b06bff' : TEAL, 0.8);
  blob(ctx, pdx, pdy, r * 0.11, r * 0.11, { fill: s.flash ? '#ffffff' : p2 ? '#d6a8ff' : '#9af0e6', outlineW: 2 });
  // head: a brass mask, teal eyes, a tall pointed hat with a gear on the band
  const hdx = gx + fx * r * 0.12;
  const hdy = by - r * 0.62;
  blob(ctx, hdx, hdy, r * 0.34, r * 0.32, { fill: fc(s, '#c9a85a'), under: '#a08640' });
  eyes(ctx, hdx + fx * r * 0.1, hdy + fy * r * 0.06 + 1, s.facing, r * 0.12, 3, p2 ? '#d6a8ff' : '#7af0e0', 1);
  poly(ctx, [hdx - r * 0.5, hdy - r * 0.18, hdx + r * 0.5, hdy - r * 0.18, hdx + r * 0.14, hdy - r * 1.25, hdx + r * 0.3, hdy - r * 1.45, hdx - r * 0.06, hdy - r * 1.2], fc(s, '#4a3080'), OUTLINE, 3);
  poly(ctx, [hdx - r * 0.42, hdy - r * 0.2, hdx + r * 0.42, hdy - r * 0.2, hdx + r * 0.36, hdy - r * 0.36, hdx - r * 0.36, hdy - r * 0.36], fc(s, BRASS), OUTLINE, 2);
  cog(ctx, hdx + r * 0.2, hdy - r * 0.3, r * 0.13, r * 0.09, 6, turn * 3, fc(s, '#d4b060'));
  spec(ctx, hdx - r * 0.15, hdy - r * 0.12, 2);
});

// ---------------------------------------------------------------- the corner turrets (Laser Sweep comes from these)
registerDraw('tock_turret', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y + 2, r);
  // a heavy brass mount bolted into the corner
  cog(ctx, s.x, s.y + 3, r * 1.15, r * 0.92, 10, s.t * 0.3, fc(s, shade(BRASS, 0.85)));
  blob(ctx, s.x, s.y + 3, r * 0.62, r * 0.62, { fill: fc(s, '#2a2630'), outlineW: 2 });
  // the lens head turns to follow the party
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  ctx.save();
  ctx.translate(s.x, s.y - 4);
  ctx.rotate(s.facing);
  // a thick twin-banded emitter barrel
  poly(ctx, [0, -r * 0.42, r * 1.55, -r * 0.34, r * 1.85, 0, r * 1.55, r * 0.34, 0, r * 0.42], fc(s, STEEL));
  ctx.fillStyle = fc(s, BRASS);
  ctx.fillRect(r * 0.75, -r * 0.42, 5, r * 0.84);
  ctx.fillRect(r * 1.25, -r * 0.38, 5, r * 0.76);
  ctx.restore();
  blob(ctx, s.x, s.y - 4, r * 0.66, r * 0.58, { fill: fc(s, '#3e4a52') });
  const lx = s.x + fx * r * 1.8;
  const ly = s.y - 4 + fy * r * 1.8;
  glow(ctx, lx, ly, 16 + Math.sin(s.t * 6) * 3, TEAL, 0.8);
  blob(ctx, lx, ly, 5, 5, { fill: s.flash ? '#ffffff' : '#9af0e6', outlineW: 2 });
  spec(ctx, s.x - r * 0.2, s.y - r * 0.4, 2);
});
