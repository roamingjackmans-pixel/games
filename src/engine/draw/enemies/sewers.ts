// Drowned Sewers roster draw functions (sludge green, rust brown, black water, moss; ART_AUDIO §2).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const RUST = '#7d5a2e';
const MOSS = '#8fa37a';
const WATER = '#2a5a5a';

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** Expanding water ripples around a wading body. */
function ripples(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, alpha = 0.5): void {
  ctx.save();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.8 + i * 0.5) % 1;
    ctx.strokeStyle = withAlpha('#9ad0d0', alpha * (1 - k));
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.6, r * (0.9 + k * 0.8), r * (0.35 + k * 0.3), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Drowned: a bloated, hunched corpse with weed hair and arms that open wide for the hug.
registerDraw('sewers_drowned', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.5, 3.5);
  const skin = '#7a9a84';
  const hug = s.pose === 'windup' ? 1.6 : s.pose === 'attack' ? 0.5 : 1;
  for (const side of [-1, 1]) {
    const ax = s.x - fy * r * 0.65 * side;
    const ay = s.y + fx * r * 0.65 * side + b;
    const ex = ax + fx * r * 1.1 - fy * r * 0.5 * side * (hug - 1);
    const ey = ay + fy * r * 1.1 + fx * r * 0.5 * side * (hug - 1);
    limb(ctx, ax, ay, ex, ey, 6, fc(s, skin));
  }
  blob(ctx, s.x, s.y + b, r * 0.95, r * (0.9 - s.squash * 0.1), { fill: fc(s, '#5a7a64') });
  // rags
  ctx.fillStyle = fc(s, '#4a4030');
  ctx.fillRect(s.x - r * 0.6, s.y + b, r * 1.2, r * 0.4);
  blob(ctx, s.x + fx * 3, s.y - r * 0.7 + b, r * 0.55, r * 0.52, { fill: fc(s, skin) });
  // weed hair hanging over the face
  ctx.strokeStyle = fc(s, '#2e4a2a');
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    const hx = s.x + fx * 3 + i * r * 0.18;
    ctx.beginPath();
    ctx.moveTo(hx, s.y - r * 1.15 + b);
    ctx.quadraticCurveTo(hx + Math.sin(s.t * 2 + i) * 3, s.y - r * 0.85 + b, hx + Math.sin(s.t * 2 + i) * 2, s.y - r * 0.55 + b);
    ctx.stroke();
  }
  eyes(ctx, s.x + fx * 4, s.y - r * 0.68 + b, s.facing, r * 0.2, 2, '#e8f0c0', 1.5);
  // drips
  const k = (s.t * 1.3) % 1;
  glow(ctx, s.x + r * 0.5, s.y + r * 0.2 + k * r * 0.8, 4, '#9ad0d0', 1 - k);
  if (s.moving > 0.2) ripples(ctx, s.x, s.y, r, s.t, 0.35);
});

// Green Slime: a translucent jelly dome with its eyes floating inside; squash and stretch on every bounce.
registerDraw('sewers_slime', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.95);
  const jig = Math.sin(s.t * 7) * 0.06;
  const sq = s.pose === 'windup' ? -0.28 : s.pose === 'attack' ? 0.22 : jig;
  const rx = r * (1 + -sq * 0.6);
  const ry = r * (0.85 + sq);
  const y = s.y + r * 0.15 - (ry - r * 0.85);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(s.x - rx, y + r * 0.45);
  ctx.quadraticCurveTo(s.x - rx * 1.05, y - ry * 1.1, s.x, y - ry * 1.05);
  ctx.quadraticCurveTo(s.x + rx * 1.05, y - ry * 1.1, s.x + rx, y + r * 0.45);
  ctx.quadraticCurveTo(s.x, y + r * 0.7, s.x - rx, y + r * 0.45);
  ctx.closePath();
  ctx.fillStyle = s.flash ? '#ffffff' : withAlpha('#6ad040', 0.82);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  // inner core and swallowed junk
  if (!s.flash) {
    blob(ctx, s.x, y - ry * 0.1, rx * 0.55, ry * 0.45, { fill: withAlpha('#3a8a2a', 0.6), outlineW: 0 });
    ctx.fillStyle = withAlpha(RUST, 0.8);
    ctx.fillRect(s.x - rx * 0.45, y + r * 0.05, 5, 3);
  }
  eyes(ctx, s.x + Math.cos(s.facing) * rx * 0.2, y - ry * 0.35, s.facing, rx * 0.25, 2.4, OUTLINE, 2);
  spec(ctx, s.x - rx * 0.45, y - ry * 0.6, 3);
  spec(ctx, s.x - rx * 0.2, y - ry * 0.8, 1.5);
  if (s.pose === 'windup') glow(ctx, s.x, y, r * 2, '#a6e040', 0.3);
});

// Sewer Crocodile: a long armoured body with a snout and a sweeping tail, half under the water while it lurks.
registerDraw('sewers_croc', (ctx, s) => {
  const r = s.r * s.scale;
  const lurking = s.pose === 'idle' && s.moving > 0.2;
  if (!lurking) shadow(ctx, s.x, s.y, r * 1.2);
  const tailSwing = s.pose === 'attack' ? Math.sin(s.poseT * 16) * 1.2 : Math.sin(s.t * 3) * 0.35;
  const gape = s.pose === 'windup' ? 0.45 : s.pose === 'attack' ? 0.05 : 0.12;
  const hide = '#3e5a36';
  ctx.save();
  if (lurking) ctx.globalAlpha *= 0.7;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  // tail
  ctx.save();
  ctx.translate(-r * 0.9, 0);
  ctx.rotate(tailSwing);
  poly(ctx, [0, -r * 0.4, -r * 1.5, -r * 0.12, -r * 1.9, 0, -r * 1.5, r * 0.12, 0, r * 0.4], fc(s, hide));
  ctx.restore();
  // legs
  const gait = Math.sin(s.t * 10) * 4 * s.moving;
  for (const lx of [r * 0.5, -r * 0.55]) {
    limb(ctx, lx, -r * 0.45, lx + gait, -r * 0.9, 5, fc(s, shade(hide, 0.85)));
    limb(ctx, lx, r * 0.45, lx - gait, r * 0.9, 5, fc(s, shade(hide, 0.85)));
  }
  // body
  blob(ctx, 0, 0, r * 1.15, r * 0.6, { fill: fc(s, hide), under: shade(hide, 0.65) });
  // scutes along the back
  if (!s.flash) {
    ctx.fillStyle = shade(hide, 0.6);
    for (let i = -2; i <= 2; i++) poly(ctx, [i * r * 0.32 - 4, -3, i * r * 0.32, -8, i * r * 0.32 + 4, -3], shade(hide, 0.6), OUTLINE, 1);
  }
  // snout: two jaws that gape on windup
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(r * 0.95, 0);
    ctx.rotate(side * gape);
    poly(ctx, [0, side * r * 0.35, r * 1.05, side * r * 0.15, r * 1.1, 0, 0, 0], fc(s, shade(hide, 1.1)), OUTLINE, 2.5);
    ctx.fillStyle = '#f4f0e0';
    for (let k = 1; k <= 3; k++) ctx.fillRect(k * r * 0.25, side > 0 ? 0 : -3, 2, 3);
    ctx.restore();
  }
  ctx.restore();
  // yellow eyes on top of the head (all that shows while lurking)
  const hx = s.x + Math.cos(s.facing) * r * 0.85;
  const hy = s.y + Math.sin(s.facing) * r * 0.85;
  eyes(ctx, hx, hy, s.facing, r * 0.28, 3, '#e6d040', 0);
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(hx - Math.sin(s.facing) * r * 0.28, hy + Math.cos(s.facing) * r * 0.28, 0.8, 2.4, s.facing, 0, Math.PI * 2);
  ctx.ellipse(hx + Math.sin(s.facing) * r * 0.28, hy - Math.cos(s.facing) * r * 0.28, 0.8, 2.4, s.facing, 0, Math.PI * 2);
  ctx.fill();
  if (lurking) ripples(ctx, s.x, s.y, r * 1.2, s.t, 0.6);
  else spec(ctx, s.x - r * 0.3, s.y - r * 0.3, 2.5);
});

// Rat Physician: a scurrying rat in a plague-doctor beak mask, wide hat and coat, vial in paw.
registerDraw('sewers_physician', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.5, 11);
  // tail
  ctx.strokeStyle = fc(s, '#c8a0a0');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - fx * r * 0.6, s.y + r * 0.4);
  ctx.quadraticCurveTo(s.x - fx * r * 1.6, s.y + r * 0.9 + Math.sin(s.t * 6) * 4, s.x - fx * r * 2.1, s.y + r * 0.5);
  ctx.stroke();
  // coat (a long cone)
  poly(ctx, [s.x - r * 0.75, s.y + r * 0.75 + b, s.x - r * 0.4, s.y - r * 0.35 + b, s.x + r * 0.4, s.y - r * 0.35 + b, s.x + r * 0.75, s.y + r * 0.75 + b], fc(s, '#2a2a26'));
  ctx.fillStyle = fc(s, RUST);
  ctx.fillRect(s.x - 1.5, s.y - r * 0.3 + b, 3, r);
  // vial arm: raised on windup
  const vx = s.x + fy * r * 0.7 + (s.pose === 'windup' ? -fx * r * 0.5 : fx * r * 0.4);
  const vy = s.y - fx * r * 0.7 + b - (s.pose === 'windup' ? r * 0.6 : 0);
  limb(ctx, s.x + fy * r * 0.35, s.y - fx * r * 0.35 + b, vx, vy, 3, fc(s, '#2a2a26'));
  blob(ctx, vx, vy - 3, 3.5, 4.5, { fill: fc(s, '#a6e040'), outlineW: 1.5 });
  glow(ctx, vx, vy - 3, 9, '#a6e040', 0.4);
  // head: grey fur and a long pale beak pointing along the facing
  const hx = s.x + fx * 2;
  const hy = s.y - r * 0.7 + b;
  blob(ctx, hx, hy, r * 0.45, r * 0.42, { fill: fc(s, '#7a6a62') });
  ctx.save();
  ctx.translate(hx + fx * r * 0.2, hy + r * 0.12);
  ctx.rotate(Math.atan2(fy * 0.6, fx));
  poly(ctx, [0, -r * 0.18, r * 0.95, -r * 0.02, r * 1.0, r * 0.04, 0, r * 0.18], fc(s, '#e8dcc0'), OUTLINE, 2);
  ctx.restore();
  // round goggles
  ctx.fillStyle = s.flash ? '#fff' : '#ff6a3a';
  ctx.beginPath();
  ctx.arc(hx - fy * r * 0.2 + fx * r * 0.18, hy + fx * r * 0.2 * 0.4 - 1, 2.4, 0, Math.PI * 2);
  ctx.arc(hx + fy * r * 0.2 + fx * r * 0.18, hy - fx * r * 0.2 * 0.4 - 1, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // wide-brimmed hat with a stovepipe crown
  blob(ctx, hx, hy - r * 0.35, r * 0.82, r * 0.22, { fill: fc(s, '#1e1e1a') });
  blob(ctx, hx, hy - r * 0.58, r * 0.38, r * 0.3, { fill: fc(s, '#1e1e1a'), outlineW: 2 });
  // round ears poking out under the brim
  blob(ctx, hx - r * 0.5, hy - r * 0.2, r * 0.16, r * 0.16, { fill: fc(s, '#c8a0a0'), outlineW: 1.5 });
  blob(ctx, hx + r * 0.5, hy - r * 0.2, r * 0.16, r * 0.16, { fill: fc(s, '#c8a0a0'), outlineW: 1.5 });
});

// Harpooner: a stocky sewer fisher in an oilskin hat, holding a long harpoon on a rope.
registerDraw('sewers_harpooner', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 6);
  const aim = s.pose === 'windup' ? -0.6 : s.pose === 'attack' ? 0.6 : 0;
  // harpoon: drawn back during windup, thrust/thrown forward
  const hx = s.x + fy * r * 0.6 + fx * r * aim;
  const hy = s.y - fx * r * 0.6 + fy * r * aim + b;
  const thrown = s.pose === 'attack' || s.pose === 'recover';
  if (!thrown) {
    limb(ctx, hx - fx * r * 1.2, hy - fy * r * 1.2, hx + fx * r * 1.6, hy + fy * r * 1.6, 3, fc(s, RUST));
    ctx.save();
    ctx.translate(hx + fx * r * 1.6, hy + fy * r * 1.6);
    ctx.rotate(s.facing);
    poly(ctx, [0, -4, 10, 0, 0, 4, 3, 0], fc(s, '#c9ced6'), OUTLINE, 2);
    poly(ctx, [2, -4, -3, -8, 0, -3], fc(s, '#c9ced6'), OUTLINE, 1.5);
    ctx.restore();
  }
  // rope coil at the hip
  ctx.strokeStyle = fc(s, '#c8b080');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x - fy * r * 0.6, s.y + fx * r * 0.6 + b + 3, r * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  limb(ctx, s.x + fy * r * 0.4, s.y - fx * r * 0.4 + b, hx, hy, 4, fc(s, '#c8a020'));
  // oilskin coat
  blob(ctx, s.x, s.y + b, r * 0.9, r * (0.85 - s.squash * 0.08), { fill: fc(s, '#c8a020'), under: shade('#c8a020', 0.7) });
  ctx.fillStyle = fc(s, shade('#c8a020', 0.6));
  ctx.fillRect(s.x - 1.5, s.y - r * 0.2 + b, 3, r * 0.9);
  // face with a beard
  blob(ctx, s.x + fx * 3, s.y - r * 0.62 + b, r * 0.45, r * 0.42, { fill: fc(s, '#d8b090') });
  blob(ctx, s.x + fx * 4, s.y - r * 0.42 + b, r * 0.32, r * 0.2, { fill: fc(s, '#8a8a8a'), outlineW: 2 });
  eyes(ctx, s.x + fx * 4, s.y - r * 0.68 + b, s.facing, r * 0.16, 1.8, OUTLINE, 1.5);
  // sou'wester hat: brim longer at the back
  ctx.save();
  ctx.translate(s.x + fx * 2, s.y - r * 0.92 + b);
  poly(ctx, [-r * 0.75, r * 0.1, -r * 0.4, -r * 0.3, r * 0.4, -r * 0.3, r * 0.75, r * 0.1, r * 0.2, r * 0.18, -r * 0.2, r * 0.18], fc(s, '#d8b028'));
  ctx.restore();
  spec(ctx, s.x - r * 0.35, s.y - r * 0.25 + b, 2);
});

// Leech: a small segmented black worm with a red ring mouth.
registerDraw('sewers_leech', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.8, 0.22);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const wig = s.t * 14 + s.variant * 1.9;
  const body = fc(s, '#2a2a30');
  // three segments trailing behind the head, wriggling side to side
  for (let i = 2; i >= 0; i--) {
    const back = i * r * 0.75;
    const side = Math.sin(wig - i * 1.1) * r * 0.45;
    const x = s.x - fx * back - fy * side;
    const y = s.y - fy * back + fx * side;
    blob(ctx, x, y, r * (0.8 - i * 0.12), r * (0.62 - i * 0.1), { fill: body, under: '#1a1a20', outlineW: 2 }, s.facing);
  }
  // red sucker mouth
  ctx.fillStyle = s.flash ? '#fff' : '#c0304a';
  ctx.beginPath();
  ctx.arc(s.x + fx * r * 0.65, s.y + fy * r * 0.65, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  spec(ctx, s.x - fy * r * 0.2, s.y + fx * r * 0.2 - 2, 1.4, 0.6);
  if (s.pose === 'windup') glow(ctx, s.x, s.y, r * 2.2, '#ff3b3b', 0.25);
});

// Bloated Carrier: an enormous pustuled belly on tiny legs; it swells and glows before it bursts.
registerDraw('sewers_carrier', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 2.5);
  const swelling = s.pose === 'windup' ? Math.min(1, s.poseT / 1.2) : 0;
  const pulse = swelling > 0 ? Math.sin(s.t * (10 + swelling * 20)) * 0.04 * swelling : Math.sin(s.t * 2) * 0.02;
  const k = 1 + swelling * 0.3 + pulse;
  const skin = '#7a9060';
  // tiny legs
  for (const side of [-1, 1]) limb(ctx, s.x + side * r * 0.35, s.y + r * 0.55, s.x + side * r * 0.4, s.y + r * 0.95 + Math.sin(s.t * 8 + side) * 2 * s.moving, 5, fc(s, shade(skin, 0.8)));
  // stubby arms
  limb(ctx, s.x - fy * r * 0.9 * k, s.y + fx * r * 0.9 * k + b, s.x - fy * r * 1.1 + fx * r * 0.5, s.y + fx * r * 1.1 + fy * r * 0.5 + b, 5, fc(s, skin));
  limb(ctx, s.x + fy * r * 0.9 * k, s.y - fx * r * 0.9 * k + b, s.x + fy * r * 1.1 + fx * r * 0.5, s.y - fx * r * 1.1 + fy * r * 0.5 + b, 5, fc(s, skin));
  if (swelling > 0) glow(ctx, s.x, s.y + b, r * (1.8 + swelling), '#a6e040', 0.25 + swelling * 0.4);
  blob(ctx, s.x, s.y + b, r * k, r * 0.92 * k, { fill: fc(s, swelling > 0.6 ? '#9ab060' : skin), under: shade(skin, 0.68) });
  // pustules
  if (!s.flash) {
    ctx.fillStyle = '#c8d870';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s.x - r * 0.45 * k, s.y - r * 0.2 * k + b, r * 0.16 * k, 0, Math.PI * 2);
    ctx.moveTo(s.x + r * 0.55 * k + r * 0.12, s.y + r * 0.15 * k + b);
    ctx.arc(s.x + r * 0.55 * k, s.y + r * 0.15 * k + b, r * 0.12 * k, 0, Math.PI * 2);
    ctx.moveTo(s.x + r * 0.1 + r * 0.1, s.y + r * 0.5 * k + b);
    ctx.arc(s.x + r * 0.1, s.y + r * 0.5 * k + b, r * 0.1 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // a little head perched on top
  const hy = s.y - r * 0.85 * k + b;
  blob(ctx, s.x + fx * 3, hy, r * 0.32, r * 0.3, { fill: fc(s, shade(skin, 1.1)), outlineW: 2.5 });
  eyes(ctx, s.x + fx * 4, hy, s.facing, r * 0.12, 1.6, OUTLINE, 1);
  spec(ctx, s.x - r * 0.4 * k, s.y - r * 0.5 * k + b, 3);
  ripples(ctx, s.x, s.y, r, s.t, 0.2);
});

// Tide Caller: a robed figure with a shell crown and a hooked staff, water circling its feet.
registerDraw('sewers_tide_caller', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  // swirling water ring
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = withAlpha('#6ac8e8', casting ? 0.75 : 0.4);
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + r * 0.6, r * 1.4, r * 0.55, 0, s.t * 2, s.t * 2 + Math.PI * 1.3);
  ctx.stroke();
  ctx.restore();
  // staff with a crescent hook
  const sx = s.x + fy * r * 0.8;
  const sy = s.y - fx * r * 0.8;
  const top = casting ? r * 2.3 : r * 1.8;
  limb(ctx, sx, sy + r * 0.6, sx, sy - top, 3, fc(s, RUST));
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(sx, sy - top - 6, 7, Math.PI * 0.1, Math.PI * 1.1);
  ctx.stroke();
  ctx.strokeStyle = fc(s, '#9ad0d0');
  ctx.lineWidth = 3;
  ctx.stroke();
  if (casting) glow(ctx, sx, sy - top - 4, 22, '#6ac8e8', 0.7);
  // robe
  poly(ctx, [s.x - r * 0.85, s.y + r * 0.75, s.x - r * 0.35, s.y - r * 0.55, s.x + r * 0.35, s.y - r * 0.55, s.x + r * 0.85, s.y + r * 0.75], fc(s, '#2a4a5a'));
  ctx.fillStyle = fc(s, shade('#2a4a5a', 0.7));
  ctx.fillRect(s.x - r * 0.75, s.y + r * 0.45, r * 1.5, r * 0.25);
  // seaweed sash
  ctx.strokeStyle = fc(s, MOSS);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.35, s.y - r * 0.3);
  ctx.quadraticCurveTo(s.x, s.y + r * 0.1 + Math.sin(s.t * 3) * 3, s.x + r * 0.45, s.y + r * 0.35);
  ctx.stroke();
  // hooded head with a scallop-shell crown
  blob(ctx, s.x + fx * 2, s.y - r * 0.75, r * 0.45, r * 0.42, { fill: fc(s, '#1e3a48') });
  eyes(ctx, s.x + fx * 4, s.y - r * 0.72, s.facing, r * 0.15, 2, '#9ae8ff', 1.5);
  ctx.save();
  ctx.translate(s.x + fx * 2, s.y - r * 1.12);
  for (let i = -2; i <= 2; i++) {
    const a = -Math.PI / 2 + i * 0.32;
    poly(ctx, [0, 4, Math.cos(a - 0.14) * r * 0.55, Math.sin(a - 0.14) * r * 0.55, Math.cos(a + 0.14) * r * 0.55, Math.sin(a + 0.14) * r * 0.55], fc(s, i % 2 ? '#e8c8b0' : '#f4dcc8'), OUTLINE, 1.5);
  }
  ctx.restore();
  // a stray drop hovering in the ring
  const da = s.t * 2.6;
  glow(ctx, s.x + Math.cos(da) * r * 1.3, s.y + r * 0.6 + Math.sin(da) * r * 0.5, 6, WATER, 0.6);
});
