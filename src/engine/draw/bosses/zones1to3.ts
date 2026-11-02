// Boss draw functions for zones 1–3 (ART_AUDIO §2: chunky vector shapes, 3 px outlines, readable poses).
// s.phase is the boss phase index (0, 1, 2); s.pose 'windup' raises weapons, 'attack' swings through.
import { OUTLINE, blob, eyes, glow, limb, poly, shadow, shade, withAlpha } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

function lift(s: DrawState): number {
  if (s.pose === 'windup') return 1;
  if (s.pose === 'attack') return -0.6;
  return 0;
}

// ---------------------------------------------------------------- The Caretaker
registerDraw('boss_caretaker', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const px = -fy;
  const py = fx;
  const b = Math.sin(s.t * 2.2) * 2;
  const p2 = s.phase >= 1;
  const L = lift(s);
  shadow(ctx, s.x, s.y, r);
  if (p2) glow(ctx, s.x, s.y, r * 2.2, '#ff7a1a', 0.35 + Math.sin(s.t * 9) * 0.08);
  // the shovel (door-sized) in the right hand
  const hx = s.x + px * r * 0.85 + fx * r * 0.3;
  const hy = s.y + py * r * 0.85 + fy * r * 0.3 + b - L * r * 0.6;
  const sa = s.facing + (s.pose === 'attack' ? 0.9 : s.pose === 'windup' ? -1.2 : -0.3);
  const tipX = hx + Math.cos(sa) * r * 2.1;
  const tipY = hy + Math.sin(sa) * r * 2.1 - L * r * 0.4;
  limb(ctx, hx, hy, tipX, tipY, 7, '#6a4a2a');
  const bx = Math.cos(sa);
  const by = Math.sin(sa);
  poly(ctx, [tipX - by * 18, tipY + bx * 18, tipX + by * 18, tipY - bx * 18, tipX + bx * 34 + by * 14, tipY + by * 34 - bx * 14, tipX + bx * 34 - by * 14, tipY + by * 34 + bx * 14], fc(s, '#8a8f96'));
  // hunched body in a long coat
  blob(ctx, s.x - fx * 4, s.y + b, r, r * 0.95 * (1 - s.squash * 0.06), { fill: fc(s, '#4a3f36') });
  blob(ctx, s.x - fx * 10, s.y + r * 0.35 + b, r * 0.8, r * 0.45, { fill: fc(s, '#3a312a') });
  // moss on the shoulders (burning in phase 2)
  for (const k of [-1, 1]) blob(ctx, s.x + px * r * 0.55 * k, s.y + py * r * 0.55 * k - r * 0.35 + b, r * 0.28, r * 0.16, { fill: fc(s, p2 ? '#ff8a2a' : '#5a7a3a'), outlineW: 2 });
  // arms
  limb(ctx, s.x + px * r * 0.7, s.y + py * r * 0.7 + b, hx, hy, 12, fc(s, '#4a3f36'));
  const lx = s.x - px * r * 0.8 + fx * r * 0.4;
  const ly = s.y - py * r * 0.8 + fy * r * 0.4 + b;
  limb(ctx, s.x - px * r * 0.7, s.y - py * r * 0.7 + b, lx, ly, 12, fc(s, '#4a3f36'));
  // the lantern (broken in phase 2: just a flame in the fist)
  if (!p2) {
    glow(ctx, lx, ly + 10, 46, '#ffb347', 0.7 + Math.sin(s.t * 6) * 0.1);
    limb(ctx, lx, ly, lx, ly + 8, 2, '#2a2420');
    blob(ctx, lx, ly + 16, 8, 10, { fill: '#ffcf6a', outline: '#2a2420', outlineW: 2 });
  } else {
    glow(ctx, lx, ly, 40, '#ff6a1a', 0.8);
    poly(ctx, [lx - 6, ly, lx + 6, ly, lx + Math.sin(s.t * 14) * 3, ly - 18], '#ffcf6a', '#ff6a1a', 2);
  }
  // head: a hood and two lamp eyes
  const hdx = s.x + fx * r * 0.25;
  const hdy = s.y - r * 0.6 + b;
  blob(ctx, hdx, hdy, r * 0.42, r * 0.4, { fill: fc(s, '#2e2a24') });
  eyes(ctx, hdx + fx * 4, hdy + 2, s.facing, r * 0.14, 3.5, p2 ? '#ff9b2e' : '#ffcf6a', 3);
});

// ---------------------------------------------------------------- Mother Spore
registerDraw('boss_mother_spore', (ctx, s) => {
  const r = s.r * s.scale;
  const p2 = s.phase >= 1;
  const sway = Math.sin(s.t * 1.3) * 3;
  const L = lift(s);
  shadow(ctx, s.x, s.y, r * 1.3, 0.4);
  // roots
  ctx.save();
  ctx.strokeStyle = shade('#7a4a8a', 0.6);
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(s.x + Math.cos(a) * r * 0.4, s.y + r * 0.5 + Math.sin(a) * r * 0.2);
    ctx.quadraticCurveTo(s.x + Math.cos(a) * r * 1.1, s.y + r * 0.6 + Math.sin(a) * r * 0.5, s.x + Math.cos(a) * r * 1.5, s.y + r * 0.7 + Math.sin(a) * r * 0.6);
    ctx.stroke();
  }
  ctx.restore();
  // stalk with a face
  const sy = s.y - L * 10;
  blob(ctx, s.x, sy + r * 0.15, r * 0.55, r * 0.75 * (1 - s.squash * 0.08), { fill: fc(s, '#e8d8c0'), under: '#c8b49a' });
  eyes(ctx, s.x + sway * 0.3, sy - r * 0.05, Math.PI / 2, r * 0.18, 5, p2 ? '#c8f06a' : '#2a1a2a', 1);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(s.x + sway * 0.3, sy + r * 0.22, r * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // the cap (split open in phase 2, glowing gills)
  const cy = sy - r * 0.55;
  if (p2) glow(ctx, s.x, cy, r * 1.4, '#c8f06a', 0.45 + Math.sin(s.t * 4) * 0.1);
  const capFill = fc(s, '#7a4a8a');
  if (!p2) {
    blob(ctx, s.x + sway, cy, r * 1.35, r * 0.62, { fill: capFill, under: '#5a3466' });
  } else {
    blob(ctx, s.x - r * 0.42 + sway, cy - 4, r * 0.85, r * 0.55, { fill: capFill, under: '#5a3466' }, -0.2);
    blob(ctx, s.x + r * 0.42 + sway, cy - 4, r * 0.85, r * 0.55, { fill: capFill, under: '#5a3466' }, 0.2);
    poly(ctx, [s.x - 10 + sway, cy - r * 0.5, s.x + 10 + sway, cy - r * 0.5, s.x + sway, cy + r * 0.2], '#c8f06a', OUTLINE, 2);
  }
  // spots
  for (const [ox, oy, rr] of [[-0.6, -0.1, 0.16], [0.1, -0.3, 0.2], [0.65, 0.05, 0.13], [-0.2, 0.15, 0.1]] as const)
    blob(ctx, s.x + sway + ox * r, cy + oy * r, rr * r, rr * r * 0.7, { fill: '#e6d0f0', outlineW: 2 });
  // drifting spores
  ctx.save();
  for (let i = 0; i < (p2 ? 14 : 6); i++) {
    const a = s.t * 0.4 + i * 1.7;
    const d = r * (1.1 + ((s.t * 0.3 + i * 0.37) % 1) * 0.9);
    ctx.fillStyle = withAlpha('#c8f06a', 0.55);
    ctx.beginPath();
    ctx.arc(s.x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6 - ((s.t * 20 + i * 13) % 40), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
});

// ---------------------------------------------------------------- The Bloatking
registerDraw('boss_bloatking', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const px = -fy;
  const py = fx;
  const p2 = s.phase >= 1;
  const bob = Math.sin(s.t * 1.6) * 3;
  const L = lift(s);
  if (!p2) {
    // the floating throne of debris
    shadow(ctx, s.x, s.y + 6, r * 1.2, 0.3);
    poly(ctx, [s.x - r * 1.1, s.y + r * 0.2 + bob, s.x + r * 1.1, s.y + r * 0.1 + bob, s.x + r * 0.9, s.y + r * 0.75 + bob, s.x - r * 0.95, s.y + r * 0.8 + bob], fc(s, '#5a4632'));
    ctx.strokeStyle = shade('#5a4632', 0.6);
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + i * r * 0.38, s.y + r * 0.2 + bob);
      ctx.lineTo(s.x + i * r * 0.34, s.y + r * 0.75 + bob);
      ctx.stroke();
    }
    poly(ctx, [s.x - r * 0.75, s.y - r * 0.2 + bob, s.x - r * 0.6, s.y - r * 1.35 + bob, s.x + r * 0.6, s.y - r * 1.35 + bob, s.x + r * 0.75, s.y - r * 0.2 + bob], fc(s, '#6a5238'));
  } else {
    // swimming: water rings around a half-sunk body
    ctx.save();
    ctx.strokeStyle = withAlpha('#9ad0d0', 0.5);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const k = (s.t * 0.8 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + r * 0.35, r * (1 + k * 0.8), r * (0.4 + k * 0.3), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  const by = s.y - (p2 ? -r * 0.15 : r * 0.1) + bob;
  // the bloated body
  blob(ctx, s.x, by, r * 0.95, r * 0.85 * (1 - s.squash * 0.08), { fill: fc(s, '#7a9a7a'), under: '#5a7a62' });
  // robe sash
  ctx.save();
  ctx.strokeStyle = '#7a2a3a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(s.x, by + r * 0.2, r * 0.9, r * 0.35, 0, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
  // scepter arm
  const hx = s.x + px * r * 0.85 + fx * r * 0.4;
  const hy = by + py * r * 0.85 + fy * r * 0.4 - L * r * 0.5;
  limb(ctx, s.x + px * r * 0.7, by + py * r * 0.7, hx, hy, 14, fc(s, '#7a9a7a'));
  const sa = s.facing + (s.pose === 'attack' ? 0.8 : s.pose === 'windup' ? -1.0 : -0.4);
  const tx = hx + Math.cos(sa) * r * 1.2;
  const ty = hy + Math.sin(sa) * r * 1.2;
  limb(ctx, hx, hy, tx, ty, 5, '#c9a94a');
  blob(ctx, tx, ty, 9, 9, { fill: '#d6c25a', outlineW: 2 });
  glow(ctx, tx, ty, 18, '#d6c25a', 0.5);
  // head, crown, drowned eyes
  const hdx = s.x + fx * r * 0.15;
  const hdy = by - r * 0.75;
  blob(ctx, hdx, hdy, r * 0.42, r * 0.38, { fill: fc(s, '#8aaa8a') });
  poly(ctx, [hdx - r * 0.32, hdy - r * 0.22, hdx - r * 0.3, hdy - r * 0.55, hdx - r * 0.14, hdy - r * 0.36, hdx, hdy - r * 0.6, hdx + r * 0.14, hdy - r * 0.36, hdx + r * 0.3, hdy - r * 0.55, hdx + r * 0.32, hdy - r * 0.22], '#d6c25a', OUTLINE, 2);
  eyes(ctx, hdx + fx * 4, hdy + 2, s.facing, r * 0.15, 4, '#e8f0d8', 2);
  eyes(ctx, hdx + fx * 5, hdy + 2, s.facing, r * 0.15, 1.6, '#1a2420', 3);
});
