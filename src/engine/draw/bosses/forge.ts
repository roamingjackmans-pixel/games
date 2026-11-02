// Boss 5 draw functions: Foreman Ignatius (Ashen Forge). Phase 1: a fire-cult blacksmith riding the shoulders of
// an Anvil Golem. Phase 2: the Golem goes molten (the boss body) and Ignatius fights on foot (his own draw).
// ART_AUDIO §2: chunky vector shapes, 3 px outlines; 3/4 view like the zone 1–3 bosses.
import { OUTLINE, blob, eyes, glow, limb, poly, shadow, shade } from '../parts';
import { fc, registerDraw, type DrawState } from '../registry';

const IRON = '#3a3a40';
const IRON_LIGHT = '#5a5a64';
const EMBER = '#ff7a1a';
const MOLTEN = '#ffd27a';
const LEATHER = '#5a2a1a';
const APRON = '#7a4a2a';
const SKIN = '#c8885a';

function lift(s: DrawState): number {
  if (s.pose === 'windup') return 1;
  if (s.pose === 'attack') return -0.6;
  return 0;
}

/** The smith himself (on the Golem's shoulders or on foot): hood, goggles, apron, a hammer in the right hand. */
function smith(ctx: CanvasRenderingContext2D, s: DrawState, x: number, y: number, r: number, swing: number): void {
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const px = -fy;
  const py = fx;
  // the hammer arm: raised in the windup, swung through on the attack
  const hx = x + px * r * 0.9 + fx * r * 0.2;
  const hy = y + py * r * 0.9 + fy * r * 0.2 - swing * r * 0.7;
  const sa = s.facing + (s.pose === 'attack' ? 0.9 : s.pose === 'windup' ? -1.4 : -0.5);
  const tx = hx + Math.cos(sa) * r * 1.5;
  const ty = hy + Math.sin(sa) * r * 1.5 - swing * r * 0.4;
  limb(ctx, hx, hy, tx, ty, 4, '#6a4a2a');
  const bx = Math.cos(sa);
  const by = Math.sin(sa);
  poly(ctx, [tx - by * 9 - bx * 5, ty + bx * 9 - by * 5, tx + by * 9 - bx * 5, ty - bx * 9 - by * 5, tx + by * 9 + bx * 8, ty - bx * 9 + by * 8, tx - by * 9 + bx * 8, ty + bx * 9 + by * 8], fc(s, IRON_LIGHT));
  glow(ctx, tx, ty, 14, EMBER, 0.45);
  // body: a leather coat under a scorched apron
  blob(ctx, x, y, r * 0.75, r * 0.7 * (1 - s.squash * 0.06), { fill: fc(s, LEATHER) });
  blob(ctx, x + fx * 3, y + r * 0.12, r * 0.5, r * 0.5, { fill: fc(s, APRON), outlineW: 2 });
  ctx.fillStyle = fc(s, '#c8a060');
  ctx.fillRect(x - r * 0.3, y - r * 0.1, r * 0.6, 3);
  limb(ctx, x + px * r * 0.6, y + py * r * 0.6, hx, hy, 6, fc(s, LEATHER));
  // the free hand holds a glowing coal
  const lx = x - px * r * 0.75 + fx * r * 0.3;
  const ly = y - py * r * 0.75 + fy * r * 0.3;
  limb(ctx, x - px * r * 0.6, y - py * r * 0.6, lx, ly, 6, fc(s, LEATHER));
  glow(ctx, lx, ly, 12, EMBER, 0.8);
  blob(ctx, lx, ly, 4, 4, { fill: MOLTEN, outlineW: 1.5 });
  // head: hood, a bit of face, goggles that catch the fire
  const hdx = x + fx * r * 0.15;
  const hdy = y - r * 0.7;
  blob(ctx, hdx, hdy, r * 0.48, r * 0.44, { fill: fc(s, '#3a1a10') });
  blob(ctx, hdx + fx * r * 0.12, hdy + r * 0.08, r * 0.28, r * 0.22, { fill: fc(s, SKIN), outlineW: 2 });
  eyes(ctx, hdx + fx * r * 0.14, hdy + 1, s.facing, r * 0.15, 3.2, MOLTEN, 2);
  glow(ctx, hdx + fx * r * 0.14, hdy, 12, EMBER, 0.5);
  // a short singed beard
  poly(ctx, [hdx + fx * r * 0.1 - 6, hdy + r * 0.2, hdx + fx * r * 0.1 + 6, hdy + r * 0.2, hdx + fx * r * 0.1, hdy + r * 0.42], fc(s, '#8a3a1a'), OUTLINE, 2);
}

// ---------------------------------------------------------------- Foreman Ignatius (the Golem, with or without its rider)
registerDraw('boss_ignatius', (ctx, s) => {
  const r = s.r * s.scale;
  const fx = Math.cos(s.facing);
  const fy = Math.sin(s.facing);
  const p2 = s.phase >= 1;
  const L = lift(s);
  const stomp = Math.abs(Math.sin(s.t * 4)) * 3 * s.moving;
  const heat = 0.5 + 0.5 * Math.sin(s.t * 5);
  shadow(ctx, s.x, s.y, r * 1.1, 0.42);
  if (p2) glow(ctx, s.x, s.y, r * 2.4, EMBER, 0.4 + heat * 0.15);
  const body = p2 ? '#4a2418' : IRON;
  const seam = p2 ? MOLTEN : EMBER;
  // stubby legs
  for (const k of [-1, 1]) blob(ctx, s.x + r * 0.45 * k, s.y + r * 0.55 + (k > 0 ? stomp : -stomp) * 0.5, r * 0.3, r * 0.26, { fill: fc(s, shade(body, 0.8)) });
  // the anvil body: a wide horn-ended block on a waist
  const by = s.y - stomp - r * 0.05;
  poly(ctx, [s.x - r * 0.55, by + r * 0.55, s.x + r * 0.55, by + r * 0.55, s.x + r * 0.42, by + r * 0.05, s.x - r * 0.42, by + r * 0.05], fc(s, shade(body, 0.85)));
  poly(
    ctx,
    [s.x - r * 1.15, by - r * 0.3, s.x - r * 0.75, by - r * 0.55, s.x + r * 0.75, by - r * 0.55, s.x + r * 1.1, by - r * 0.42, s.x + r * 0.75, by + r * 0.12, s.x - r * 0.75, by + r * 0.12],
    fc(s, body),
  );
  ctx.fillStyle = fc(s, p2 ? '#6a3020' : IRON_LIGHT);
  ctx.fillRect(s.x - r * 0.72, by - r * 0.52, r * 1.44, r * 0.12);
  // glowing seams (cracks of lava once molten)
  ctx.save();
  ctx.strokeStyle = seam;
  ctx.lineWidth = p2 ? 3.5 : 2;
  ctx.globalAlpha *= p2 ? 0.75 + heat * 0.25 : 0.6;
  ctx.beginPath();
  ctx.moveTo(s.x - r * 0.5, by - r * 0.2);
  ctx.lineTo(s.x - r * 0.15, by - r * 0.05);
  ctx.lineTo(s.x + r * 0.1, by - r * 0.3);
  ctx.lineTo(s.x + r * 0.45, by - r * 0.12);
  if (p2) {
    ctx.moveTo(s.x - r * 0.3, by + r * 0.45);
    ctx.lineTo(s.x, by + r * 0.25);
    ctx.lineTo(s.x + r * 0.25, by + r * 0.5);
  }
  ctx.stroke();
  ctx.restore();
  if (p2) for (const k of [-0.4, 0.15, 0.5]) glow(ctx, s.x + k * r, by + r * 0.1, r * 0.35, MOLTEN, 0.45 + heat * 0.2);
  // huge arms ending in hammer fists, always at the body's sides (a wide body in 3/4 view); the arm on the
  // side he faces reaches toward the target and rises for a slam
  const lead = fx >= 0 ? 1 : -1;
  for (const side of [-lead, lead]) {
    const isLead = side === lead;
    const ax = s.x + side * r * 1.05 + fx * r * (isLead ? 0.3 : 0.1);
    const ay = by + r * 0.2 + fy * r * (isLead ? 0.35 : 0.1) - L * r * (isLead ? 0.85 : 0.3);
    limb(ctx, s.x + side * r * 0.75, by - r * 0.3, ax, ay, r * 0.32, fc(s, body));
    blob(ctx, ax, ay, r * 0.3, r * 0.26, { fill: fc(s, shade(body, 1.15)) });
    if (p2) glow(ctx, ax, ay, r * 0.45, EMBER, 0.6);
  }
  // a small head sunk between the shoulders: one slit of fire
  const hdx = s.x + fx * r * 0.2;
  const hdy = by - r * 0.6;
  blob(ctx, hdx, hdy, r * 0.3, r * 0.22, { fill: fc(s, shade(body, 1.1)) });
  ctx.fillStyle = seam;
  ctx.fillRect(hdx - r * 0.16 + fx * 3, hdy - 2, r * 0.32, 4);
  glow(ctx, hdx + fx * 3, hdy, r * 0.3, seam, 0.6);
  if (!p2) {
    // phase 1: Ignatius rides on the shoulders, hammer up
    smith(ctx, s, s.x - fx * r * 0.1, by - r * 0.95, r * 0.42, L);
  } else {
    // molten drips
    for (let i = 0; i < 4; i++) {
      const k = (s.t * 0.9 + i * 0.27) % 1;
      const dx = s.x + (i - 1.5) * r * 0.4;
      glow(ctx, dx, by + r * 0.2 + k * r * 0.6, 7, MOLTEN, 1 - k);
    }
  }
});

// ---------------------------------------------------------------- Ignatius on foot (phase 2's second body)
registerDraw('boss_ignatius_foot', (ctx, s) => {
  const r = s.r * s.scale;
  const step = Math.sin(s.t * 10) * 3 * s.moving;
  shadow(ctx, s.x, s.y, r);
  // the forge glow follows him around
  glow(ctx, s.x, s.y, r * 2.2, EMBER, 0.25 + Math.sin(s.t * 6) * 0.06);
  // boots
  for (const k of [-1, 1]) blob(ctx, s.x + r * 0.35 * k, s.y + r * 0.62 + (k > 0 ? step : -step) * 0.4, r * 0.24, r * 0.16, { fill: fc(s, '#2a1a10'), outlineW: 2 });
  smith(ctx, s, s.x, s.y - r * 0.05, r, lift(s));
});
