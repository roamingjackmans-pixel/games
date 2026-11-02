// Fungal Caverns roster draw functions (deep purple, teal glow, brown, violet; ART_AUDIO §2).
import { OUTLINE, blob, eyes, glow, limb, poly, shade, shadow, spec, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const PURPLE = '#3b2a4f';
const TEAL = '#5fd3c0';
const BROWN = '#8b5a3c';
const VIOLET = '#c58cff';
const STEM = '#d8c8b0';

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

/** Spots on a mushroom cap (deterministic positions). */
function capSpots(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, n: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.9 + (i / Math.max(1, n - 1)) * Math.PI * 0.8;
    const k = 0.45 + (i % 2) * 0.25;
    const sx = x + Math.cos(a) * rx * k;
    const sy = y + Math.sin(a) * ry * k;
    const sr = Math.max(1.5, rx * (0.11 + (i % 3) * 0.03));
    ctx.moveTo(sx + sr, sy);
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  }
  ctx.fill();
}

// Sporeling: a waddling button mushroom, huge round cap on stubby feet.
registerDraw('caverns_sporeling', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const waddle = Math.sin(s.t * 9) * 0.18 * (0.3 + s.moving * 0.7);
  const fx = Math.cos(s.facing);
  const puff = s.pose === 'windup' ? 1 : 0;
  // feet
  for (const side of [-1, 1]) {
    const lift = Math.max(0, Math.sin(s.t * 9 + (side > 0 ? 0 : Math.PI))) * 3 * s.moving;
    blob(ctx, s.x + side * r * 0.45, s.y + r * 0.62 - lift, r * 0.28, r * 0.18, { fill: fc(s, shade(STEM, 0.8)), outlineW: 2 });
  }
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.4);
  ctx.rotate(waddle);
  // stem body
  blob(ctx, 0, -r * 0.2, r * 0.48, r * 0.5 * (1 + s.squash * 0.15), { fill: fc(s, STEM) });
  eyes(ctx, fx * 2, -r * 0.18, s.facing, r * 0.2, 2, OUTLINE, 1.5);
  // cap (squashes down on windup, puffs on release)
  const capY = -r * 0.85 + puff * r * 0.12;
  const capW = r * (1.05 + puff * 0.12 + Math.max(0, s.squash) * 0.1);
  blob(ctx, 0, capY, capW, r * (0.62 - puff * 0.1), { fill: fc(s, VIOLET), under: shade(VIOLET, 0.62) });
  if (!s.flash) capSpots(ctx, 0, capY - r * 0.05, capW, r * 0.55, 5, '#f4e8ff');
  spec(ctx, -capW * 0.45, capY - r * 0.3, 2);
  ctx.restore();
  if (s.pose === 'attack' || s.pose === 'windup') {
    for (let i = 0; i < 4; i++) {
      const a = s.t * 2 + i * 1.57;
      glow(ctx, s.x + Math.cos(a) * r * 1.3, s.y - r * 0.4 + Math.sin(a) * r * 0.8, 9, '#b8f070', s.pose === 'attack' ? 0.7 : 0.35);
    }
  }
});

// Cave Hound: a long, low quadruped seen from above, ears back, teal eyes.
registerDraw('caverns_hound', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const crouch = s.pose === 'windup' ? 0.82 : 1;
  const stretch = s.pose === 'attack' ? 1.25 : 1;
  const gait = Math.sin(s.t * 16) * 5 * s.moving;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  ctx.scale(stretch, crouch);
  // legs (diagonal pairs move together)
  const fur = fc(s, '#4a3a5e');
  limb(ctx, r * 0.55, -r * 0.4, r * 0.75 + gait, -r * 0.85, 4, fur);
  limb(ctx, r * 0.55, r * 0.4, r * 0.75 - gait, r * 0.85, 4, fur);
  limb(ctx, -r * 0.55, -r * 0.4, -r * 0.75 - gait, -r * 0.85, 4, fur);
  limb(ctx, -r * 0.55, r * 0.4, -r * 0.75 + gait, r * 0.85, 4, fur);
  // tail
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, 0);
  ctx.quadraticCurveTo(-r * 1.4, Math.sin(s.t * 10) * r * 0.4, -r * 1.75, Math.sin(s.t * 10 + 1) * r * 0.3);
  ctx.stroke();
  ctx.strokeStyle = fur;
  ctx.lineWidth = 3;
  ctx.stroke();
  // body
  blob(ctx, 0, 0, r * 1.05, r * 0.55, { fill: fur, under: shade('#4a3a5e', 0.7) });
  // glowing fungus ridge down the spine
  if (!s.flash) for (let i = -1; i <= 1; i++) blob(ctx, i * r * 0.4, 0, r * 0.13, r * 0.13, { fill: TEAL, outlineW: 1.5 });
  // head
  blob(ctx, r * 1.05, 0, r * 0.5, r * 0.42, { fill: fc(s, '#5a4870') });
  poly(ctx, [r * 0.85, -r * 0.3, r * 0.6, -r * 0.65, r * 0.95, -r * 0.42], fc(s, '#3a2a4e'), OUTLINE, 2);
  poly(ctx, [r * 0.85, r * 0.3, r * 0.6, r * 0.65, r * 0.95, r * 0.42], fc(s, '#3a2a4e'), OUTLINE, 2);
  // snout + teeth when biting
  blob(ctx, r * 1.45, 0, r * 0.24, r * 0.22, { fill: fc(s, '#6a5880'), outlineW: 2 });
  if (s.pose === 'attack') {
    ctx.fillStyle = '#f4f0e0';
    ctx.fillRect(r * 1.5, -r * 0.18, 4, r * 0.36);
  }
  ctx.restore();
  eyes(ctx, s.x + Math.cos(s.facing) * r * 1.1, s.y + Math.sin(s.facing) * r * 1.1, s.facing, r * 0.2, 2, TEAL, 2);
  if (!s.flash) glow(ctx, s.x + Math.cos(s.facing) * r * 1.15, s.y + Math.sin(s.facing) * r * 1.15, 10, TEAL, 0.4);
});

// Myconid Shaman: a stout myconid under a tall pointed hat, with a glowing bulb staff.
registerDraw('caverns_shaman', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.9);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1.2, 4);
  const casting = s.pose === 'windup' || s.pose === 'attack';
  // staff held to the side, raised while casting
  const sx = s.x + fy * r * 0.85;
  const sy = s.y - fx * r * 0.85 + b;
  const top = casting ? r * 2.2 : r * 1.6;
  limb(ctx, sx, sy + r * 0.6, sx + fx * 4, sy - top, 3, fc(s, BROWN));
  glow(ctx, sx + fx * 4, sy - top, casting ? 26 : 16, '#9ae060', casting ? 0.8 : 0.45);
  blob(ctx, sx + fx * 4, sy - top, 5, 5, { fill: fc(s, '#c8f090'), outlineW: 2 });
  // robe-like stem body
  poly(ctx, [s.x - r * 0.7, s.y + r * 0.7 + b, s.x - r * 0.45, s.y - r * 0.3 + b, s.x + r * 0.45, s.y - r * 0.3 + b, s.x + r * 0.7, s.y + r * 0.7 + b], fc(s, '#6a4a8a'));
  ctx.fillStyle = fc(s, shade('#6a4a8a', 0.7));
  ctx.fillRect(s.x - r * 0.6, s.y + r * 0.35 + b, r * 1.2, r * 0.3);
  // face
  blob(ctx, s.x + fx * 2, s.y - r * 0.35 + b, r * 0.45, r * 0.38, { fill: fc(s, STEM) });
  eyes(ctx, s.x + fx * 3, s.y - r * 0.38 + b, s.facing, r * 0.17, 1.8, OUTLINE, 1.5);
  // the hat: a tall bent cone with a wide brim
  blob(ctx, s.x, s.y - r * 0.72 + b, r * 0.95, r * 0.25, { fill: fc(s, PURPLE), under: shade(PURPLE, 0.7) });
  const tip = Math.sin(s.t * 2) * r * 0.2 + (casting ? fx * r * 0.3 : 0);
  poly(ctx, [s.x - r * 0.55, s.y - r * 0.78 + b, s.x + tip, s.y - r * 2.3 + b, s.x + r * 0.55, s.y - r * 0.78 + b], fc(s, '#4a3462'));
  if (!s.flash) {
    ctx.fillStyle = withAlpha(TEAL, 0.9);
    ctx.beginPath();
    ctx.arc(s.x - r * 0.15, s.y - r * 1.2 + b, 2.4, 0, Math.PI * 2);
    ctx.arc(s.x + r * 0.18, s.y - r * 1.55 + b, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
});

// Boulder Beetle: a domed shell with mandibles; rolls up into a ball to charge, belly-up when flipped.
registerDraw('caverns_beetle', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const shellC = fc(s, '#5a3e2a');
  if (s.pose === 'stagger') {
    // flipped on its back: pale belly, legs paddling at the air
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.facing);
    for (let i = 0; i < 3; i++) {
      const lx = (i - 1) * r * 0.5;
      const k = Math.sin(s.t * 20 + i) * 4;
      limb(ctx, lx, -r * 0.5, lx + k, -r * 1.1, 3, '#3a2a1e');
      limb(ctx, lx, r * 0.5, lx - k, r * 1.1, 3, '#3a2a1e');
    }
    blob(ctx, 0, 0, r * 1.0, r * 0.85, { fill: fc(s, '#c8a888'), under: '#a88868' });
    ctx.strokeStyle = withAlpha(OUTLINE, 0.6);
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.35, -r * 0.6);
      ctx.lineTo(i * r * 0.35, r * 0.6);
      ctx.stroke();
    }
    ctx.restore();
    eyes(ctx, s.x, s.y, s.facing + Math.PI, r * 0.3, 2.4, '#ffffff', 0);
    return;
  }
  if (s.pose === 'attack') {
    // rolled into a boulder: spinning stripes
    const spin = s.t * 14;
    blob(ctx, s.x, s.y, r * 0.95, r * 0.95, { fill: shellC });
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 0.9, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = fc(s, '#7a5a3e');
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      const off = (((spin * 6 + i * r * 0.66) % (r * 2)) + r * 2) % (r * 2) - r;
      ctx.beginPath();
      ctx.moveTo(s.x + Math.cos(s.facing + Math.PI / 2) * r * 1.2 + Math.cos(s.facing) * off, s.y + Math.sin(s.facing + Math.PI / 2) * r * 1.2 + Math.sin(s.facing) * off);
      ctx.lineTo(s.x - Math.cos(s.facing + Math.PI / 2) * r * 1.2 + Math.cos(s.facing) * off, s.y - Math.sin(s.facing + Math.PI / 2) * r * 1.2 + Math.sin(s.facing) * off);
      ctx.stroke();
    }
    ctx.restore();
    spec(ctx, s.x - r * 0.35, s.y - r * 0.4, 3);
    return;
  }
  const curl = s.pose === 'windup' ? 0.85 : 1;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing);
  ctx.scale(curl, 1 / curl);
  // legs
  const gait = Math.sin(s.t * 12) * 4 * s.moving;
  for (let i = 0; i < 3; i++) {
    const lx = (i - 1) * r * 0.55;
    const g = i % 2 === 0 ? gait : -gait;
    limb(ctx, lx, -r * 0.6, lx + g, -r * 1.05, 3, '#2a1e16');
    limb(ctx, lx, r * 0.6, lx - g, r * 1.05, 3, '#2a1e16');
  }
  // mandibles (open on windup, snap shut on attack)
  const open = s.pose === 'windup' ? 0.6 : 0.25;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(r * 0.95, side * r * 0.25);
    ctx.rotate(side * open);
    poly(ctx, [0, -3, r * 0.6, side * 2, r * 0.75, side * 6, r * 0.2, 4], fc(s, '#2a1e16'), OUTLINE, 2);
    ctx.restore();
  }
  // head
  blob(ctx, r * 0.78, 0, r * 0.38, r * 0.42, { fill: fc(s, '#3a2a20') });
  // shell: two wing covers with a seam down the middle and a stone-like sheen
  blob(ctx, -r * 0.1, 0, r * 1.0, r * 0.88, { fill: shellC, under: shade('#5a3e2a', 0.65) });
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(r * 0.55, 0);
  ctx.lineTo(-r * 1.05, 0);
  ctx.stroke();
  if (!s.flash) {
    ctx.fillStyle = withAlpha(VIOLET, 0.55);
    ctx.beginPath();
    ctx.arc(-r * 0.45, -r * 0.42, r * 0.16, 0, Math.PI * 2);
    ctx.arc(-r * 0.2, r * 0.45, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  spec(ctx, s.x - r * 0.3, s.y - r * 0.45, 3);
  eyes(ctx, s.x + Math.cos(s.facing) * r * 0.85, s.y + Math.sin(s.facing) * r * 0.85, s.facing, r * 0.2, 2, '#ffd27a', 1);
});

// Glowcap Spitter: a tall thin stalk under a bell-shaped glowing cap with a spitting mouth.
registerDraw('caverns_glowcap', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 0.75);
  const fx = Math.cos(s.facing);
  const sway = Math.sin(s.t * 3) * 0.08 + (s.pose === 'windup' ? -0.15 * fx : s.pose === 'attack' ? 0.2 * fx : 0);
  const capC = '#5ab840';
  glow(ctx, s.x, s.y - r * 1.2, r * 2.4, '#a6e040', 0.35 + Math.sin(s.t * 4) * 0.1);
  ctx.save();
  ctx.translate(s.x, s.y + r * 0.6);
  ctx.rotate(sway);
  // stalk with a little skirt
  poly(ctx, [-r * 0.22, 0, -r * 0.16, -r * 1.4, r * 0.16, -r * 1.4, r * 0.22, 0], fc(s, STEM));
  blob(ctx, 0, -r * 0.9, r * 0.38, r * 0.12, { fill: fc(s, shade(STEM, 0.85)), outlineW: 2 });
  // bell cap
  const swell = s.pose === 'windup' ? 1.12 : 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.95 * swell, -r * 1.35);
  ctx.quadraticCurveTo(-r * 0.9 * swell, -r * 2.55 * swell, 0, -r * 2.6 * swell);
  ctx.quadraticCurveTo(r * 0.9 * swell, -r * 2.55 * swell, r * 0.95 * swell, -r * 1.35);
  ctx.quadraticCurveTo(0, -r * 1.6, -r * 0.95 * swell, -r * 1.35);
  ctx.closePath();
  ctx.fillStyle = fc(s, capC);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (!s.flash) {
    ctx.fillStyle = '#d8ff90';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 2.05, 2.5, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 2.25, 2, 0, Math.PI * 2);
    ctx.arc(r * 0.05, -r * 1.85, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // mouth on the stalk; drips of acid from the rim
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.ellipse(fx * r * 0.08, -r * 1.05, r * 0.12, s.pose === 'windup' ? r * 0.16 : r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  eyes(ctx, s.x + fx * 2, s.y - r * 0.7, s.facing, r * 0.14, 1.6, '#d8ff90', 1);
  for (let i = 0; i < 2; i++) {
    const k = (s.t * 0.9 + i * 0.5) % 1;
    glow(ctx, s.x - r * 0.6 + i * r * 1.2, s.y - r * 0.75 + k * r * 1.2, 5, '#a6e040', 1 - k);
  }
});

const OGRE_CAPS: readonly (readonly [number, number, number])[] = [
  [-0.55, -0.55, 0.32],
  [0.1, -0.85, 0.26],
  [-0.75, 0.05, 0.24],
];

// Fungal Ogre: a hulking brute overgrown with shelf mushrooms, dragging a log club.
registerDraw('caverns_ogre', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 2, 3);
  const skin = '#7a6a8a';
  // club: raised overhead in windup, slammed forward on attack
  const lift = s.pose === 'windup' ? -1.5 : s.pose === 'attack' ? 0.15 : -0.5;
  const ca = s.facing + lift * 0.45;
  const hx = s.x + fy * r * 0.75;
  const hy = s.y - fx * r * 0.75 + b;
  const up = s.pose === 'windup' ? r * 0.9 : 0;
  const ex = hx + Math.cos(ca) * r * 1.9;
  const ey = hy + Math.sin(ca) * r * 1.9 - up;
  limb(ctx, hx, hy, ex, ey, 8, fc(s, BROWN));
  blob(ctx, ex, ey, r * 0.36, r * 0.3, { fill: fc(s, shade(BROWN, 0.85)) }, ca);
  // off arm reaching (grab) or hanging
  const reach = s.pose === 'windup' ? 0.4 : 1;
  limb(ctx, s.x - fy * r * 0.75, s.y + fx * r * 0.75 + b, s.x - fy * r * 0.6 + fx * r * 1.1 * reach, s.y + fx * r * 0.6 + fy * r * 1.1 * reach + b, 9, fc(s, skin));
  // body and hunched head
  blob(ctx, s.x, s.y + b, r * 0.98, r * (0.85 - s.squash * 0.08), { fill: fc(s, skin), under: shade(skin, 0.68) });
  blob(ctx, s.x + fx * r * 0.35, s.y - r * 0.45 + b, r * 0.42, r * 0.36, { fill: fc(s, shade(skin, 1.1)) });
  eyes(ctx, s.x + fx * r * 0.45, s.y - r * 0.47 + b, s.facing, r * 0.13, 2.2, '#ffd27a', 1.5);
  // tusks
  ctx.fillStyle = '#f4f0e0';
  ctx.fillRect(s.x + fx * r * 0.62 - 4, s.y - r * 0.3 + b, 3, 5);
  ctx.fillRect(s.x + fx * r * 0.62 + 2, s.y - r * 0.3 + b, 3, 5);
  // shelf mushrooms on the back and shoulders
  for (const [cx, cy, cr] of OGRE_CAPS) {
    const x = s.x - fx * r * 0.2 + cx * r;
    const y = s.y + cy * r + b;
    blob(ctx, x, y, r * cr, r * cr * 0.55, { fill: fc(s, VIOLET), under: shade(VIOLET, 0.6), outlineW: 2 });
  }
  if (!s.flash) glow(ctx, s.x - r * 0.4, s.y - r * 0.6 + b, 14, TEAL, 0.35);
});

// Spore Bat: a tiny body under a wide flapping wing span.
registerDraw('caverns_bat', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 8 + Math.sin(s.t * 6 + s.variant) * 3;
  ctx.save();
  ctx.globalAlpha *= 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 6, r * 1.2, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const flap = Math.sin(s.t * 22 + s.variant * 1.7);
  const span = r * (2.2 + (s.pose === 'windup' ? 0.4 : 0));
  ctx.save();
  ctx.translate(s.x, y);
  ctx.rotate(s.facing);
  const wing = fc(s, '#4a3462');
  for (const side of [-1, 1]) {
    const tipY = side * span;
    const tipX = -r * 0.4 + flap * r * 0.5;
    poly(ctx, [r * 0.3, side * r * 0.3, tipX + r * 0.6, tipY * 0.8, tipX, tipY, tipX - r * 0.3, tipY * 0.6, -r * 0.6, side * r * 0.45, -r * 0.2, side * r * 0.2], wing, OUTLINE, 2);
  }
  blob(ctx, 0, 0, r * 0.75, r * 0.55, { fill: fc(s, '#5a4870'), outlineW: 2 });
  // ears
  poly(ctx, [r * 0.4, -r * 0.35, r * 0.95, -r * 0.55, r * 0.6, -r * 0.05], fc(s, '#5a4870'), OUTLINE, 1.5);
  poly(ctx, [r * 0.4, r * 0.35, r * 0.95, r * 0.55, r * 0.6, r * 0.05], fc(s, '#5a4870'), OUTLINE, 1.5);
  // open mouth while screeching
  if (s.pose === 'windup' || s.pose === 'attack') {
    ctx.fillStyle = '#ff7aa8';
    ctx.beginPath();
    ctx.arc(r * 0.7, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  eyes(ctx, s.x + Math.cos(s.facing) * r * 0.35, y + Math.sin(s.facing) * r * 0.35, s.facing, r * 0.25, 1.4, TEAL, 0.5);
  if (!s.flash && s.variant % 2 === 0) glow(ctx, s.x - Math.cos(s.facing) * r, y - Math.sin(s.facing) * r, 7, '#b8f070', 0.4);
});

// Mycelium Weaver: a root-knot bulb with a single eye and many writhing tendrils.
registerDraw('caverns_weaver', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.1);
  const lash = s.pose === 'windup' ? 1.3 : s.pose === 'attack' ? 1.6 : 1;
  const n = 8;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.sin(s.t * 1.3 + i) * 0.15;
    const len = r * (1.5 + (i % 3) * 0.3) * lash;
    const w1 = Math.sin(s.t * 4 + i * 1.7) * r * 0.35;
    const x1 = s.x + Math.cos(a) * r * 0.6;
    const y1 = s.y + Math.sin(a) * r * 0.6;
    const mx = s.x + Math.cos(a) * len * 0.6 - Math.sin(a) * w1;
    const my = s.y + Math.sin(a) * len * 0.6 + Math.cos(a) * w1;
    const x2 = s.x + Math.cos(a) * len;
    const y2 = s.y + Math.sin(a) * len;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();
    ctx.strokeStyle = fc(s, i % 2 ? '#a88cc8' : '#8a6aa8');
    ctx.lineWidth = 3.5;
    ctx.stroke();
    if (!s.flash && i % 2 === 0) glow(ctx, x2, y2, 7, VIOLET, 0.5);
  }
  blob(ctx, s.x, s.y - 2, r * 0.85, r * 0.78 * (1 + s.squash * 0.12), { fill: fc(s, '#6a4a8a'), under: shade('#6a4a8a', 0.65) });
  // a single slit eye that tracks the target
  const ex = s.x + Math.cos(s.facing) * r * 0.25;
  const ey = s.y - 4 + Math.sin(s.facing) * r * 0.2;
  blob(ctx, ex, ey, r * 0.38, r * 0.3, { fill: fc(s, '#f4e8ff'), outlineW: 2 });
  ctx.fillStyle = s.pose === 'windup' ? '#8fd3ff' : '#2a1040';
  ctx.beginPath();
  ctx.ellipse(ex + Math.cos(s.facing) * 3, ey + Math.sin(s.facing) * 2, r * 0.08, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  spec(ctx, s.x - r * 0.4, s.y - r * 0.45, 2.2);
});
