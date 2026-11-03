// The Abyss roster draw functions (void black, violet, white, deep purple). The floor is near-black, so
// every body carries a violet rim, a pale face or a glow to keep its silhouette readable.
import { OUTLINE, blob, eyes, glow, limb, poly, shadow, spec, withAlpha } from '../parts';
import { DEFAULT_LOOK, drawJoe, type JoeLook } from '../players';
import { fc, registerDraw, type DrawState } from '../registry';
import { drawWeapon, isPairedWeapon } from '../weapons';

const VOID = '#06030a';
const VIOLET = '#7a2bd6';
const LILAC = '#b06bff';
const PALE = '#e4d4ff';
const DEEP = '#2a0d3f';
const TAU = Math.PI * 2;

function bob(s: DrawState, amp = 1.5, speed = 6): number {
  return Math.sin(s.t * speed) * amp * (0.4 + s.moving * 0.6);
}

// ---------------------------------------------------------------- Hollow Joe: a grey, tired Joe
const HOLLOW_LOOK: JoeLook = {
  ...DEFAULT_LOOK,
  skin: '#a9a5ad',
  hair: '#55525a',
  bodyColor: '#6c6874',
  legsColor: '#46434e',
  trim: '#87838f',
  headColor: '#77737f',
  lids: true,
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
  const tSlow = s.t * 0.8; // he trudges
  // a thin wisp of the void leaving him
  glow(ctx, s.x, s.y - 30 * sc + Math.sin(s.t * 2) * 2, 9 * sc, VIOLET, 0.28);
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
      c.translate(Math.cos(s.facing + 0.9) * 10 + Math.cos(a) * pose.ext, Math.sin(s.facing + 0.9) * 10 + 2 + Math.sin(a) * pose.ext);
      c.rotate(a);
      drawWeapon(c, weapon, 0);
      blob(c, 0, 0, 4.5, 4.5, { fill: s.flash ? '#ffffff' : HOLLOW_LOOK.skin, outlineW: 2 });
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
  // heavy eyelids: HOLLOW_LOOK.lids, drawn by drawJoe on the face
});

// ---------------------------------------------------------------- Void Mote: a black core in a violet halo
registerDraw('abyss_void_mote', (ctx, s) => {
  const r = s.r * s.scale;
  const ph = s.variant * 1.7;
  const y = s.y - 8 + Math.sin(s.t * 5 + ph) * 2.5;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  shadow(ctx, s.x, s.y, r * 0.7, 0.22);
  // comet tail behind the motion
  ctx.fillStyle = withAlpha(LILAC, 0.3 + s.moving * 0.2);
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(s.x - fx * r * 0.85 * i, y - fy * r * 0.85 * i, r * (0.72 - i * 0.17), 0, TAU);
    ctx.fill();
  }
  glow(ctx, s.x, y, r * 3.2, VIOLET, 0.6);
  const swell = 1 - s.squash * 0.25;
  const rr = r * swell;
  blob(ctx, s.x, y, rr, rr, { fill: fc(s, DEEP), under: VOID });
  ctx.fillStyle = s.flash ? '#ffffff' : VOID;
  ctx.beginPath();
  ctx.arc(s.x + fx * 1.5, y + fy * 1.5, rr * 0.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = fc(s, LILAC);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x, y, Math.max(1, rr - 2.5), -2.5 + ph * 0.2, -0.5 + ph * 0.2);
  ctx.stroke();
  spec(ctx, s.x - rr * 0.35, y - rr * 0.4, 1.6);
});

// ---------------------------------------------------------------- Eye of the Deep: a floating eyeball with nerve tendrils
registerDraw('abyss_eye', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 16 + Math.sin(s.t * 2.2) * 4;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  shadow(ctx, s.x, s.y + 4, r * 0.8, 0.22);
  // optic tendrils trail behind the gaze
  for (let i = -1; i <= 1; i++) {
    const a = s.facing + Math.PI + i * 0.5;
    const wav = Math.sin(s.t * 4 + i * 1.3) * 5;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    limb(ctx, s.x + ca * r * 0.6, y + sa * r * 0.6 + r * 0.25, s.x + ca * r * 1.9 - sa * wav, y + sa * r * 1.9 + ca * wav + r * 0.55, 4, fc(s, '#5a2a7a'));
  }
  const charging = s.pose === 'windup' || s.pose === 'attack';
  glow(ctx, s.x, y, r * 2.6, charging ? LILAC : VIOLET, charging ? 0.7 : 0.45);
  blob(ctx, s.x, y, r, r * (1 + s.squash * 0.06), { fill: fc(s, '#efe8f4'), under: '#bfb2cc' });
  if (!s.flash) {
    // bloodshot veins toward the iris
    ctx.strokeStyle = withAlpha('#9a3a8a', 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = s.facing + Math.PI * 0.6 + i * 0.55;
      ctx.moveTo(s.x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
      ctx.quadraticCurveTo(s.x + Math.cos(a + 0.3) * r * 0.6, y + Math.sin(a + 0.3) * r * 0.6, s.x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45);
    }
    ctx.stroke();
  }
  // iris and slit pupil look along the facing; the pupil dilates as it charges
  const ix = s.x + fx * r * 0.42;
  const iy = y + fy * r * 0.36;
  const ir = r * (charging ? 0.52 : 0.46);
  blob(ctx, ix, iy, ir, ir, { fill: fc(s, charging ? '#c58cff' : VIOLET), under: DEEP, outlineW: 2 });
  ctx.fillStyle = VOID;
  ctx.beginPath();
  ctx.ellipse(ix + fx * 1.5, iy + fy * 1.5, ir * (charging ? 0.45 : 0.2), ir * 0.8, s.facing, 0, TAU);
  ctx.fill();
  if (s.pose === 'attack') glow(ctx, ix, iy, ir * 2.2, '#ffffff', 0.6);
  spec(ctx, s.x - r * 0.4, y - r * 0.45, 2.4);
  // a blink every few seconds
  if ((s.t + s.variant * 0.7) % 4.5 < 0.14) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(s.x, y, r, r, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = fc(s, '#5a2a7a');
    ctx.fillRect(s.x - r, y - r, r * 2, r * 1.6);
    ctx.restore();
  }
});

// ---------------------------------------------------------------- Abyssal Knight: horned plate, greatsword, tattered cape
registerDraw('abyss_knight', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const b = bob(s, 1, 4);
  // tattered cape hanging behind
  const cx = s.x - fx * 4;
  const top = s.y - r * 0.55 + b;
  const hem = s.y + r * 0.95 + b;
  const flap = Math.sin(s.t * 5) * 2;
  poly(
    ctx,
    [cx - r * 0.85, top, cx + r * 0.85, top, cx + r * 1.05, hem, cx + r * 0.6, hem - 6 + flap, cx + r * 0.25, hem + 2, cx - r * 0.15, hem - 7 - flap, cx - r * 0.55, hem + 1, cx - r * 1.05, hem - 4],
    fc(s, '#1c1428'),
  );
  // greatsword: raised back in the windup, swept through in the attack
  let rot = 0.6;
  if (s.pose === 'windup') rot = 0.6 - 2.2 * Math.min(1, s.poseT / 0.7);
  else if (s.pose === 'attack') {
    const idx = Math.floor(s.poseT / 0.55);
    const k = Math.min(1, (s.poseT % 0.55) / 0.3);
    rot = idx % 2 === 0 ? -1.6 + 3.0 * k : 1.4 - 3.0 * k;
  } else if (s.pose === 'stagger') rot = 1.5;
  const sa = s.facing + rot;
  const hx = s.x - fy * r * 0.7;
  const hy = s.y + fx * r * 0.7 + b;
  const len = r * 2.7;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(sa);
  limb(ctx, -6, 0, 8, 0, 5, '#2a2236');
  poly(ctx, [8, -9, 12, -9, 12, 9, 8, 9], fc(s, '#5a4a7a'));
  poly(ctx, [12, -6, len - 12, -6, len, 0, len - 12, 6, 12, 6], fc(s, '#3a2d50'));
  ctx.strokeStyle = fc(s, LILAC);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(14, -3.5);
  ctx.lineTo(len - 10, -3.5);
  ctx.stroke();
  ctx.restore();
  if (s.tint === 'red' || s.pose === 'attack') glow(ctx, hx + Math.cos(sa) * len * 0.6, hy + Math.sin(sa) * len * 0.6, len * 0.5, VIOLET, 0.45);
  // body and pauldrons
  blob(ctx, s.x, s.y + b, r * 0.85, r * (0.82 - s.squash * 0.08), { fill: fc(s, '#3a2d50'), under: '#241a34' });
  blob(ctx, s.x - fy * r * 0.72, s.y + fx * r * 0.72 - r * 0.3 + b, r * 0.36, r * 0.3, { fill: fc(s, '#4a3a66'), outlineW: 2 });
  blob(ctx, s.x + fy * r * 0.72, s.y - fx * r * 0.72 - r * 0.3 + b, r * 0.36, r * 0.3, { fill: fc(s, '#4a3a66'), outlineW: 2 });
  // the guarded front: a heavy breastplate rim toward the facing
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(s.x, s.y + b, r * 0.9, s.facing - 1.0, s.facing + 1.0);
  ctx.stroke();
  ctx.strokeStyle = fc(s, '#6a5a8a');
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = fc(s, LILAC);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(s.x, s.y + b, r * 0.9 + 1, s.facing - 0.8, s.facing + 0.2);
  ctx.stroke();
  ctx.restore();
  // horned helm with a glowing visor
  const hdx = s.x + fx * 3;
  const hdy = s.y - r * 0.78 + b;
  poly(ctx, [hdx - r * 0.4, hdy - r * 0.2, hdx - r * 0.75, hdy - r * 0.95, hdx - r * 0.2, hdy - r * 0.45], fc(s, '#d8c8e8'));
  poly(ctx, [hdx + r * 0.4, hdy - r * 0.2, hdx + r * 0.75, hdy - r * 0.95, hdx + r * 0.2, hdy - r * 0.45], fc(s, '#d8c8e8'));
  blob(ctx, hdx, hdy, r * 0.5, r * 0.5, { fill: fc(s, '#4a3a66') });
  spec(ctx, hdx - r * 0.2, hdy - r * 0.25, 2);
  if (fy > -0.5) {
    ctx.save();
    ctx.translate(hdx + fx * r * 0.18, hdy + fy * r * 0.12 + 1);
    ctx.rotate(s.facing + Math.PI / 2);
    ctx.fillStyle = s.flash ? '#ffffff' : '#c58cff';
    ctx.fillRect(-r * 0.32, -1.6, r * 0.64, 3.2);
    ctx.restore();
    glow(ctx, hdx + fx * r * 0.18, hdy + 1, r * 0.5, LILAC, 0.4);
  }
});

// ---------------------------------------------------------------- Nullwraith: a ragged hood with claws, mostly not there
registerDraw('abyss_nullwraith', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 6 + Math.sin(s.t * 3) * 3;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const lean = s.moving * 5;
  // the shimmer that gives it away
  ctx.save();
  ctx.strokeStyle = withAlpha(PALE, 0.55);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a0 = s.t * 2.5 + i * 2.1;
    ctx.beginPath();
    ctx.arc(s.x, y, r * 1.35 + Math.sin(s.t * 6 + i) * 2, a0, a0 + 0.9);
    ctx.stroke();
  }
  ctx.restore();
  shadow(ctx, s.x, s.y + 2, r * 0.8, 0.2);
  // claws reach out from under the cloak on the attack
  const reach = s.pose === 'attack' ? 1.9 : s.pose === 'windup' ? 0.6 : 1.0;
  for (const side of [1, -1]) {
    const sx = s.x - fy * r * 0.6 * side;
    const sy = y + fx * r * 0.6 * side;
    const ex = s.x + fx * r * reach - fy * r * 0.45 * side;
    const ey = y + fy * r * reach + fx * r * 0.45 * side + r * 0.2;
    limb(ctx, sx, sy, ex, ey, 3, fc(s, '#cfc0ea'));
    for (let k = -1; k <= 1; k++) {
      const a = s.facing + k * 0.35;
      limb(ctx, ex, ey, ex + Math.cos(a) * 7, ey + Math.sin(a) * 7, 1.5, fc(s, '#efe6ff'));
    }
  }
  // ragged cloak: hood on top, torn hem below
  const tx = s.x + fx * lean;
  const pts = [tx, y - r * 1.55, s.x + r * 0.95, y - r * 0.25, s.x + r * 1.05, y + r * 1.0];
  const n = 6;
  for (let i = 1; i < n; i++) {
    const hxp = s.x + r * 1.05 - (r * 2.1 * i) / n;
    pts.push(hxp, y + r * (i % 2 === 0 ? 1.05 : 0.7) + Math.sin(s.t * 7 + i) * 2);
  }
  pts.push(s.x - r * 1.05, y + r * 1.0, s.x - r * 0.95, y - r * 0.25);
  poly(ctx, pts, fc(s, '#3a2850'));
  // violet sheen down the cloak
  ctx.strokeStyle = fc(s, withAlpha(LILAC, 0.6));
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx - r * 0.25, y - r * 1.2);
  ctx.quadraticCurveTo(s.x - r * 0.6, y, s.x - r * 0.5, y + r * 0.8);
  ctx.stroke();
  // the empty hood and its two eyes
  blob(ctx, tx + fx * 2, y - r * 0.55, r * 0.55, r * 0.5, { fill: VOID, outline: '#5a3a7a', outlineW: 2 });
  if (fy > -0.6) {
    glow(ctx, tx + fx * 4, y - r * 0.55, r * 0.9, PALE, 0.35);
    eyes(ctx, tx + fx * 3, y - r * 0.55, s.facing, r * 0.2, 1.8, s.flash ? '#ffffff' : PALE, 2);
  }
});

// ---------------------------------------------------------------- Maw: a toothed hole in the floor with a gravity well
registerDraw('abyss_maw', (ctx, s) => {
  const r = s.r * s.scale;
  // the pull field: arcs drifting inward at the pull speed (60 px/s) from 350 px
  ctx.save();
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const rr = 350 - ((s.t * 60 + i * 87.5) % (350 - r));
    ctx.strokeStyle = withAlpha(LILAC, 0.06 + 0.16 * (1 - rr / 350));
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
  const ry = r * 0.9;
  ctx.save();
  ctx.globalAlpha *= 0.4;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 4, rx * 1.15, ry * 1.15, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // gums
  blob(ctx, s.x, s.y, rx, ry, { fill: fc(s, '#5a1a6a'), under: '#3a0f4a' });
  // the hole
  const hx = rx * 0.78 * open;
  const hy = ry * 0.72 * open;
  ctx.fillStyle = VOID;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, hx, hy, 0, 0, TAU);
  ctx.fill();
  glow(ctx, s.x, s.y + 2, r * 0.7 * open, VIOLET, 0.55);
  // teeth around the rim, pointing in
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.13;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const w = 0.16;
    const bx1 = s.x + Math.cos(a - w) * hx * 1.04;
    const by1 = s.y + Math.sin(a - w) * hy * 1.04;
    const bx2 = s.x + Math.cos(a + w) * hx * 1.04;
    const by2 = s.y + Math.sin(a + w) * hy * 1.04;
    const len = i % 2 === 0 ? 0.42 : 0.3;
    poly(ctx, [bx1, by1, bx2, by2, s.x + c * hx * (1 - len), s.y + sn * hy * (1 - len)], fc(s, '#efe6f4'), OUTLINE, 1.5);
  }
  // a few small eyes on the upper lip
  if (!s.flash) {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.55;
      const ex = s.x + Math.cos(a) * rx * 0.92;
      const ey = s.y + Math.sin(a) * ry * 0.92;
      ctx.fillStyle = PALE;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = VOID;
      ctx.beginPath();
      ctx.arc(ex + Math.cos(s.facing) * 0.9, ey + Math.sin(s.facing) * 0.9, 1.1, 0, TAU);
      ctx.fill();
    }
  }
});

// ---------------------------------------------------------------- Landlord's Clerk: top hat, spectacles, clipboard, notices
registerDraw('abyss_clerk', (ctx, s) => {
  const r = s.r * s.scale;
  const y = s.y - 12 + Math.sin(s.t * 2.6) * 3;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  shadow(ctx, s.x, s.y + 4, r * 0.7, 0.22);
  // a ghostly tail instead of legs
  const sway = Math.sin(s.t * 4) * 4;
  poly(ctx, [s.x - r * 0.55, y + r * 0.35, s.x + r * 0.55, y + r * 0.35, s.x - fx * 6 + sway, y + r * 1.7], fc(s, '#2a2236'));
  // suit
  blob(ctx, s.x, y, r * 0.72, r * (0.85 - s.squash * 0.06), { fill: fc(s, '#3a3048'), under: '#262032' });
  poly(ctx, [s.x - 4, y - r * 0.7, s.x + 4, y - r * 0.7, s.x, y + r * 0.15], fc(s, '#efe6d2'), OUTLINE, 1.5);
  poly(ctx, [s.x - 1.5, y - r * 0.62, s.x + 1.5, y - r * 0.62, s.x + 2.5, y - r * 0.05, s.x, y + r * 0.1, s.x - 2.5, y - r * 0.05], fc(s, VIOLET), OUTLINE, 1);
  // the stamp arm: raised in the windup, brought down on the attack
  const lift = s.pose === 'windup' ? -r * 0.9 : s.pose === 'attack' ? r * 0.15 : -r * 0.2;
  const ax = s.x - fy * r * 0.65 + fx * r * 0.7;
  const ay = y + fx * r * 0.65 + fy * r * 0.4 + lift;
  limb(ctx, s.x - fy * r * 0.55, y + fx * r * 0.55 - r * 0.2, ax, ay, 4, fc(s, '#3a3048'));
  blob(ctx, ax, ay - 4, 4, 5, { fill: fc(s, '#6a4a2a'), outlineW: 2 });
  ctx.fillStyle = fc(s, VIOLET);
  ctx.fillRect(ax - 5, ay, 10, 4);
  // the clipboard in the other hand
  const kx = s.x + fy * r * 0.75 + fx * r * 0.35;
  const ky = y - fx * r * 0.75 + fy * r * 0.3;
  poly(ctx, [kx - 6, ky - 8, kx + 6, ky - 8, kx + 6, ky + 8, kx - 6, ky + 8], fc(s, '#8a6a3a'), OUTLINE, 2);
  ctx.fillStyle = s.flash ? '#ffffff' : '#f4f0e0';
  ctx.fillRect(kx - 4, ky - 5, 8, 11);
  ctx.fillStyle = '#9a90a8';
  ctx.fillRect(kx - 3, ky - 3, 6, 1);
  ctx.fillRect(kx - 3, ky, 6, 1);
  ctx.fillRect(kx - 3, ky + 3, 4, 1);
  // pale head, round spectacles, a tall hat
  const hx = s.x + fx * 2;
  const hy = y - r * 1.05;
  blob(ctx, hx, hy, r * 0.48, r * 0.46, { fill: fc(s, '#c8bcd8') });
  eyes(ctx, hx, hy, s.facing, r * 0.2, 1.4, OUTLINE, 1.5);
  if (!s.flash && fy > -0.5) {
    ctx.strokeStyle = '#efe6ff';
    ctx.lineWidth = 1.2;
    const px = -fy * r * 0.2;
    const py = fx * r * 0.2;
    ctx.beginPath();
    ctx.arc(hx + px + fx * 1.5, hy + py + fy * 1.5, 3.2, 0, TAU);
    ctx.moveTo(hx - px + fx * 1.5 + 3.2, hy - py + fy * 1.5);
    ctx.arc(hx - px + fx * 1.5, hy - py + fy * 1.5, 3.2, 0, TAU);
    ctx.stroke();
  }
  blob(ctx, hx, hy - r * 0.38, r * 0.62, r * 0.16, { fill: fc(s, '#1a1424'), outlineW: 2 });
  poly(ctx, [hx - r * 0.36, hy - r * 0.42, hx + r * 0.36, hy - r * 0.42, hx + r * 0.32, hy - r * 1.2, hx - r * 0.32, hy - r * 1.2], fc(s, '#1a1424'));
  ctx.fillStyle = fc(s, VIOLET);
  ctx.fillRect(hx - r * 0.34, hy - r * 0.62, r * 0.68, 3);
  // eviction notices orbiting him
  for (let i = 0; i < 3; i++) {
    const a = s.t * 1.6 + i * 2.094;
    const nx = s.x + Math.cos(a) * r * 1.55;
    const ny = y - r * 0.2 + Math.sin(a) * r * 0.65;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(Math.sin(s.t * 3 + i) * 0.4);
    poly(ctx, [-4, -5, 4, -5, 4, 5, -4, 5], s.flash ? '#ffffff' : '#f4f0e0', OUTLINE, 1.5);
    ctx.fillStyle = '#c03a3a';
    ctx.fillRect(-2.5, -3, 5, 1.5);
    ctx.restore();
  }
});

// ---------------------------------------------------------------- Star-Eater: a hunched starfield with a swallowed sun
const STAR_DOTS: [number, number, number][] = [];
for (let i = 0; i < 10; i++) STAR_DOTS.push([Math.cos(i * 2.39996) * (0.25 + (i % 4) * 0.17), Math.sin(i * 2.39996) * (0.25 + (i % 4) * 0.15), 0.9 + (i % 3) * 0.45]);

registerDraw('abyss_star_eater', (ctx, s) => {
  const r = s.r * s.scale;
  shadow(ctx, s.x, s.y, r * 1.05);
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const px = -fy;
  const py = fx;
  const b = bob(s, 1.5, 2.5);
  // long arms dragging forward; claws reach on the attack
  const reach = s.pose === 'attack' ? 1.55 : s.pose === 'windup' ? 0.7 : 1.05;
  for (const side of [1, -1]) {
    const sx = s.x + px * r * 0.8 * side;
    const sy = s.y - r * 0.3 + py * r * 0.5 * side + b;
    const ex = s.x + px * r * 1.0 * side + fx * r * reach;
    const ey = s.y + r * 0.5 + py * r * 0.6 * side + fy * r * reach * 0.7 + b;
    limb(ctx, sx, sy, ex, ey, 10, fc(s, '#24143a'));
    for (let k = -1; k <= 1; k++) {
      const a = s.facing + k * 0.4;
      limb(ctx, ex, ey, ex + Math.cos(a) * 10, ey + Math.sin(a) * 10, 2.5, fc(s, '#f4ecff'));
    }
  }
  // body full of stars
  const by = s.y + b;
  blob(ctx, s.x, by, r, r * (0.9 - s.squash * 0.08), { fill: fc(s, '#24143a'), under: '#140a24' });
  if (!s.flash) {
    const a0 = ctx.globalAlpha;
    for (let i = 0; i < STAR_DOTS.length; i++) {
      const d = STAR_DOTS[i]!;
      ctx.globalAlpha = a0 * (0.55 + 0.45 * Math.sin(s.t * 3 + i * 1.7));
      ctx.fillStyle = i % 3 === 0 ? PALE : '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x + d[0] * r, by + d[1] * r * 0.85, d[2], 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = a0;
  }
  // the swallowed star: brightens through a Supernova windup
  const core = s.pose === 'windup' ? 1 + Math.min(1, s.poseT / 1.8) : 1;
  glow(ctx, s.x + fx * r * 0.15, by + r * 0.15, r * 0.8 * core, '#ffe6ff', 0.55);
  blob(ctx, s.x + fx * r * 0.15, by + r * 0.15, r * 0.16 * core, r * 0.16 * core, { fill: '#ffffff', outline: LILAC, outlineW: 2 });
  // constellation horns
  ctx.strokeStyle = fc(s, withAlpha(PALE, 0.8));
  ctx.lineWidth = 1.5;
  const hx = s.x + fx * r * 0.5;
  const hy = by - r * 0.62 + fy * r * 0.25;
  for (const side of [1, -1]) {
    const x1 = hx + px * r * 0.35 * side;
    const y1 = hy - r * 0.1;
    const x2 = x1 + px * r * 0.25 * side;
    const y2 = y1 - r * 0.45;
    const x3 = x2 + px * r * 0.2 * side;
    const y3 = y2 - r * 0.3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
    spec(ctx, x2, y2, 1.8, 1);
    spec(ctx, x3, y3, 2.2, 1);
  }
  // low head with a wide jaw; it gapes before a Devour
  const gape = s.pose === 'windup' ? 1.6 : s.pose === 'attack' ? 0.6 : 1;
  blob(ctx, hx, hy, r * 0.55, r * 0.42, { fill: fc(s, '#2e1a4a'), under: '#1c0f30' });
  const mx = hx + fx * r * 0.2;
  const my = hy + r * 0.12 + fy * r * 0.12;
  ctx.fillStyle = VOID;
  ctx.beginPath();
  ctx.ellipse(mx, my, r * 0.34, r * 0.1 * gape, 0, 0, TAU);
  ctx.fill();
  glow(ctx, mx, my, r * 0.3 * gape, LILAC, 0.5);
  ctx.strokeStyle = fc(s, '#f4ecff');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    const tx = mx + i * r * 0.09;
    ctx.moveTo(tx, my - r * 0.1 * gape);
    ctx.lineTo(tx + 1, my - r * 0.02 * gape);
  }
  ctx.stroke();
  // three pinprick eyes along the brow
  if (fy > -0.6 && !s.flash) {
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + px * i * r * 0.18 + fx * 2, hy - r * 0.16 - Math.abs(i) * 1.5, 1.8, 0, TAU);
      ctx.fill();
    }
    glow(ctx, hx, hy - r * 0.16, r * 0.4, PALE, 0.3);
  }
});
