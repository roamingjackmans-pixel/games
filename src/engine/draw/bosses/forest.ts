// Boss 4 draw functions: Vexthorn, the Hollow Stag (Hollow Forest), and his Fey Lights (ART_AUDIO §2: chunky
// vector shapes, 3 px outlines). Drawn from above, turned to his facing like the Stag Sentinel. s.phase 1: the
// heart-lantern flares and the thorn antlers grow longer.
import { OUTLINE, blob, glow, limb, poly, shadow, withAlpha } from '../parts';
import { fc, registerDraw } from '../registry';

const HIDE = '#cfc4a6';
const HIDE_DARK = '#8a7e62';
const BARK = '#3a2614';
const THORN = '#24160c';
const LANTERN = '#ffcf6a';

/** One antler: a crooked thorn branch with tines and spikes, from (x0, y0) sweeping outward by `side`. */
function antler(ctx: CanvasRenderingContext2D, x0: number, y0: number, side: number, len: number, sweep: number, color: string, tips: string | null): void {
  const a = side * sweep;
  const mx = x0 + Math.cos(a * 0.6) * len * 0.5;
  const my = y0 + Math.sin(a * 0.6) * len * 0.5 + side * len * 0.12;
  const ex = mx + Math.cos(a) * len * 0.55;
  const ey = my + Math.sin(a) * len * 0.55;
  limb(ctx, x0, y0, mx, my, 6, color);
  limb(ctx, mx, my, ex, ey, 5, color);
  // tines: one forward, one outward off each segment
  const tines: [number, number, number, number][] = [
    [mx, my, mx + len * 0.32, my + side * len * 0.05],
    [mx, my, mx - len * 0.05, my + side * len * 0.3],
    [ex, ey, ex + len * 0.25, ey - side * len * 0.06],
    [ex, ey, ex + len * 0.04, ey + side * len * 0.24],
  ];
  for (const [x1, y1, x2, y2] of tines) limb(ctx, x1, y1, x2, y2, 3.5, color);
  // thorns along the beam
  for (let i = 1; i <= 4; i++) {
    const k = i / 5;
    const tx = x0 + (ex - x0) * k;
    const ty = y0 + (ey - y0) * k;
    const nx = -(ey - y0) / len;
    const ny = (ex - x0) / len;
    const s = (i % 2 === 0 ? 1 : -1) * 6;
    poly(ctx, [tx - 2, ty - 2, tx + 2, ty + 2, tx + nx * s, ty + ny * s], color, OUTLINE, 1.5);
  }
  if (tips) for (const [, , x2, y2] of tines) glow(ctx, x2, y2, 10, tips, 0.7);
}

// ---------------------------------------------------------------- Vexthorn
registerDraw('boss_vexthorn', (ctx, s) => {
  const r = s.r * s.scale;
  const p2 = s.phase >= 1;
  const run = Math.sin(s.t * 11) * (0.2 + s.moving * 0.8);
  const lower = s.pose === 'windup' || s.pose === 'attack' ? 1 : 0;
  const stunned = s.pose === 'stagger';
  const charge = s.pose === 'attack' ? 1.1 : 1;
  const beat = 0.5 + 0.5 * Math.sin(s.t * (p2 ? 9 : 4));
  shadow(ctx, s.x, s.y, r * 1.2, 0.38);
  if (p2) glow(ctx, s.x, s.y, r * 2.4, '#ff9b2e', 0.25 + beat * 0.15);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.facing + (stunned ? Math.sin(s.t * 30) * 0.08 : 0));
  // four long legs (bark-dark, hooves pale)
  for (let i = 0; i < 4; i++) {
    const lx = i < 2 ? r * 0.55 : -r * 0.62;
    const side = i % 2 === 0 ? 1 : -1;
    const k = (i < 2 ? 1 : -1) * side * run * r * 0.38;
    limb(ctx, lx, side * r * 0.3, lx + k, side * r * 0.82, 7, fc(s, BARK));
    blob(ctx, lx + k, side * r * 0.84, 4, 4, { fill: fc(s, HIDE), outlineW: 2 });
  }
  // a ragged tail of leaves
  poly(ctx, [-r * 1.0, -r * 0.12, -r * 1.35, 0, -r * 1.0, r * 0.12], fc(s, '#2f5a30'), OUTLINE, 2);
  // neck reaching forward
  const hx = r * (0.98 + lower * 0.22) * charge;
  limb(ctx, r * 0.45, 0, hx - r * 0.1, 0, r * 0.42, fc(s, HIDE_DARK));
  // the body: pale fey hide with moss on the back
  blob(ctx, 0, 0, r * 1.02 * charge, r * 0.56 * (1 - s.squash * 0.08), { fill: fc(s, HIDE), under: HIDE_DARK });
  blob(ctx, -r * 0.35, 0, r * 0.45, r * 0.22, { fill: fc(s, '#3f6a34'), outlineW: 2 });
  // the hollow chest: a dark cavity caged by ribs, the lantern-heart burning inside
  const cx = r * 0.32;
  blob(ctx, cx, 0, r * 0.34, r * 0.3, { fill: '#160d08', outlineW: 2 });
  const heart = p2 ? '#ff9b2e' : LANTERN;
  glow(ctx, cx, 0, r * (p2 ? 1.0 : 0.6) * (0.85 + beat * 0.3), heart, p2 ? 0.95 : 0.75);
  blob(ctx, cx, 0, r * 0.12, r * 0.15, { fill: s.flash ? '#ffffff' : heart, outline: '#5a3a10', outlineW: 2 });
  if (p2) poly(ctx, [cx - 4, -r * 0.05, cx + 4, -r * 0.05, cx + Math.sin(s.t * 16) * 3, -r * 0.24], '#fff3b0', '#ff6a1a', 1.5);
  ctx.strokeStyle = fc(s, HIDE);
  ctx.lineWidth = 3;
  for (const k of [-0.18, 0, 0.18]) {
    ctx.beginPath();
    ctx.moveTo(cx + k * r, -r * 0.28);
    ctx.quadraticCurveTo(cx + k * r + r * 0.08, 0, cx + k * r, r * 0.28);
    ctx.stroke();
  }
  // head, lowered for the charge; two lamp eyes
  blob(ctx, hx, 0, r * 0.36, r * 0.27, { fill: fc(s, HIDE) });
  blob(ctx, hx + r * 0.3, 0, r * 0.12, r * 0.1, { fill: fc(s, HIDE_DARK), outlineW: 2 });
  const eye = p2 ? '#ff9b2e' : LANTERN;
  for (const side of [-1, 1]) {
    glow(ctx, hx + r * 0.1, side * r * 0.15, 9, eye, 0.9);
    blob(ctx, hx + r * 0.1, side * r * 0.15, 2.6, 2.6, { fill: eye, outlineW: 1 });
  }
  // antlers of thorn: they sweep forward when lowered and grow longer in phase 2
  const len = r * (p2 ? 1.25 : 0.95);
  const sweep = 1.05 - lower * 0.55;
  for (const side of [-1, 1]) antler(ctx, hx - r * 0.05, side * r * 0.16, side, len, sweep, fc(s, THORN), p2 ? '#ff9b2e' : null);
  ctx.restore();
  // drifting fey motes around him
  for (let i = 0; i < (p2 ? 8 : 4); i++) {
    const a = s.t * 0.8 + i * 1.9;
    const d = r * (1.2 + ((s.t * 0.25 + i * 0.31) % 1) * 0.8);
    glow(ctx, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d * 0.7, 6, LANTERN, 0.6);
  }
  if (stunned) {
    // reeling against the broken tree: dizzy stars
    for (let i = 0; i < 3; i++) {
      const a = s.t * 5 + (i * Math.PI * 2) / 3;
      const sx = s.x + Math.cos(a) * r * 0.75;
      const sy = s.y - r * 0.95 + Math.sin(a) * r * 0.25;
      glow(ctx, sx, sy, 8, '#ffe14a', 0.85);
      poly(ctx, [sx, sy - 5, sx + 2, sy - 1, sx + 5, sy, sx + 2, sy + 1, sx, sy + 5, sx - 2, sy + 1, sx - 5, sy, sx - 2, sy - 1], '#ffe14a', OUTLINE, 1);
    }
  }
});

// ---------------------------------------------------------------- Fey Light
registerDraw('boss_fey_light', (ctx, s) => {
  const r = s.r * s.scale;
  const bob = Math.sin(s.t * 3 + s.variant) * 3;
  const swelling = s.pose === 'windup' ? 1 + Math.min(1, s.poseT / 0.7) * 0.6 : 1;
  const y = s.y - 10 + bob;
  // a faint shadow far below: it floats
  shadow(ctx, s.x, s.y + 6, r * 0.6, 0.18);
  glow(ctx, s.x, y, r * 3.2 * swelling, '#ffcf6a', 0.55 + Math.sin(s.t * 7) * 0.12);
  glow(ctx, s.x, y, r * 1.6 * swelling, '#fff3b0', 0.8);
  // two tiny moth wings
  ctx.save();
  ctx.globalAlpha *= 0.75;
  const flap = Math.sin(s.t * 18) * 0.35;
  for (const side of [-1, 1]) blob(ctx, s.x + side * r * 0.85, y - r * 0.2, r * 0.7, r * 0.38, { fill: withAlpha('#e8f4ff', 0.8), outline: withAlpha('#8fd3ff', 0.9), outlineW: 1.5 }, side * (0.5 + flap));
  ctx.restore();
  blob(ctx, s.x, y, r * 0.55 * swelling, r * 0.55 * swelling, { fill: fc(s, '#fff7d6'), outline: '#c89a3a', outlineW: 2 });
  // orbiting sparks
  for (let i = 0; i < 3; i++) {
    const a = s.t * 4 + (i * Math.PI * 2) / 3;
    glow(ctx, s.x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 0.8, 4, '#8fd3ff', 0.8);
  }
});
