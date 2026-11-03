// Interactable props: the bonfire (Joe's camp stove), sign posts, stairs, the reliquary, Gary's cart,
// station floor markers; and the zones' room props ('o' tiles: coffins, urns,
// tombstones, giant mushrooms, barrels, stumps, anvils, ice crystals, gear machines, floating void rocks…).
import { OUTLINE, blob, glow, limb, poly, shade, shadow, spec, withAlpha } from './parts';
import { drawChest } from './enemies/crypt';

export function drawBonfire(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, state: 'fresh' | 'ember' | 'unlit'): void {
  shadow(ctx, x, y + 6, 26);
  // the camp stove: a small metal stove on legs with a kettle
  limb(ctx, x - 14, y + 4, x - 18, y + 16, 3, '#3a3a40');
  limb(ctx, x + 14, y + 4, x + 18, y + 16, 3, '#3a3a40');
  poly(ctx, [x - 20, y - 6, x + 20, y - 6, x + 16, y + 8, x - 16, y + 8], '#5a5a62');
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(x - 14, y - 2, 28, 6);
  if (state !== 'unlit') {
    const k = state === 'fresh' ? 1 : 0.35;
    glow(ctx, x, y - 14, 60 * k + Math.sin(t * 7) * 4, '#ff9b2e', 0.7 * k);
    for (let i = 0; i < 3; i++) {
      const fx = x - 8 + i * 8;
      const h = (state === 'fresh' ? 18 : 7) + Math.sin(t * 9 + i * 2) * 4;
      ctx.fillStyle = i === 1 ? '#ffd27a' : '#ff7a1a';
      ctx.beginPath();
      ctx.moveTo(fx - 5, y - 6);
      ctx.quadraticCurveTo(fx, y - 6 - h * 1.2, fx + 5, y - 6);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#3a3030';
    ctx.fillRect(x - 10, y - 9, 20, 3);
  }
  // kettle
  blob(ctx, x + 10, y - 12, 7, 6, { fill: '#8a8f98', outlineW: 2 });
  spec(ctx, x + 8, y - 14, 1.5);
}

export function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void {
  shadow(ctx, x, y + 6, 8);
  limb(ctx, x, y + 6, x, y - 16, 4, '#6a4a2a');
  poly(ctx, [x - 14, y - 30, x + 14, y - 30, x + 14, y - 14, x - 14, y - 14], '#8a6a3a');
  ctx.fillStyle = '#2a1a0a';
  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(n), x, y - 18);
}

export function drawStationMarker(ctx: CanvasRenderingContext2D, x: number, y: number, done: boolean, t: number): void {
  ctx.save();
  ctx.strokeStyle = done ? '#58d66a' : withAlpha('#e6b84a', 0.6 + Math.sin(t * 4) * 0.2);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  if (done) {
    glow(ctx, x, y, 26, '#58d66a', 0.5);
    ctx.strokeStyle = '#58d66a';
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x - 2, y + 6);
    ctx.lineTo(x + 8, y - 6);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStairs(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, up = false): void {
  glow(ctx, x, y, 50, up ? '#fff3b0' : '#7a6aff', 0.4 + Math.sin(t * 2) * 0.1);
  for (let i = 0; i < 5; i++) {
    const w = 60 - i * 8;
    ctx.fillStyle = shade('#5a5a62', 1 - i * 0.15);
    ctx.fillRect(x - w / 2, y - 24 + i * 10, w, 10);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y - 24 + i * 10, w, 10);
  }
}

export function drawReliquary(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, open: boolean): void {
  // a shrine plinth with an ornate chest
  poly(ctx, [x - 34, y + 14, x + 34, y + 14, x + 28, y + 24, x - 28, y + 24], '#6a6070');
  drawChest(ctx, x, y, open ? 1 : 0, false, 0, false, true);
  if (!open) for (let i = 0; i < 4; i++) glow(ctx, x + Math.cos(t + i * 1.6) * 30, y - 10 + Math.sin(t * 1.3 + i) * 10, 8, '#c58cff', 0.6);
  // candles
  for (const cx of [x - 40, x + 40]) {
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(cx - 3, y - 4, 6, 14);
    glow(ctx, cx, y - 8, 12 + Math.sin(t * 8 + cx) * 2, '#ffd27a', 0.8);
  }
}

export function drawCart(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(ctx, x, y + 10, 40);
  poly(ctx, [x - 40, y - 10, x + 40, y - 10, x + 36, y + 14, x - 36, y + 14], '#7a5232');
  for (const wx of [x - 24, x + 24]) {
    blob(ctx, wx, y + 16, 9, 9, { fill: '#4a3020' });
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(wx - 1, y + 9, 2, 14);
  }
  // awning
  poly(ctx, [x - 44, y - 34, x + 44, y - 34, x + 40, y - 22, x - 40, y - 22], '#a03030');
  for (let i = -36; i < 40; i += 16) {
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(x + i, y - 34, 8, 12);
  }
  limb(ctx, x - 38, y - 22, x - 38, y - 8, 3, '#5a3a20');
  limb(ctx, x + 38, y - 22, x + 38, y - 8, 3, '#5a3a20');
  // wares
  blob(ctx, x - 16, y - 14, 6, 6, { fill: '#58d66a', outlineW: 2 });
  blob(ctx, x, y - 15, 5, 7, { fill: '#4aa3ff', outlineW: 2 });
  blob(ctx, x + 16, y - 14, 6, 6, { fill: '#ff9b2e', outlineW: 2 });
}

// ------------------------------------------------------------------ room props ('o' tiles), pre-rendered with the floor

/** Where a prop's light and flames go (room.ts turns them into baked light pools and per-frame flames). */
export interface PropFx {
  light(x: number, y: number, r: number, color: string, a: number): void;
  flame(x: number, y: number, s: number): void;
}

interface PropRng {
  next(): number;
  range(lo: number, hi: number): number;
  int(lo: number, hi: number): number;
  chance(p: number): boolean;
}

function propShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry = rx * 0.4): void {
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** An 'o' prop in the zone's style at tile (x, y) (top-left), varied by the room's stream. */
export function drawRoomProp(ctx: CanvasRenderingContext2D, x: number, y: number, style: string, rng: PropRng, fx: PropFx): void {
  const cx = x + 16;
  const v = rng.next();
  switch (style) {
    case 'coffin':
      if (v < 0.35) coffin(ctx, cx, y, rng, false);
      else if (v < 0.5) coffin(ctx, cx, y, rng, true);
      else if (v < 0.68) sarcophagus(ctx, cx, y, rng);
      else if (v < 0.84) urn(ctx, cx, y);
      else tombstone(ctx, cx, y, rng, fx);
      return;
    case 'mushroom':
      if (v < 0.5) giantMushroom(ctx, cx, y, rng, fx);
      else if (v < 0.8) mushroomCluster(ctx, cx, y, rng, fx);
      else boulder(ctx, cx, y, rng, '#4a3a5e', '#5fd3c0', fx);
      return;
    case 'barrel':
      if (v < 0.45) barrel(ctx, cx, y, rng, false, fx);
      else if (v < 0.6) barrel(ctx, cx, y, rng, true, fx);
      else if (v < 0.85) crate(ctx, cx, y, '#6a4a2a', '#3a2814');
      else sacks(ctx, cx, y);
      return;
    case 'stump':
      if (v < 0.45) stump(ctx, cx, y, rng);
      else if (v < 0.65) boulder(ctx, cx, y, rng, '#5a5a48', '#4a7a2a', null);
      else if (v < 0.85) thornBush(ctx, cx, y, rng);
      else log(ctx, cx, y, rng);
      return;
    case 'anvil':
      if (v < 0.45) anvil(ctx, cx, y, fx);
      else if (v < 0.65) coals(ctx, cx, y, rng, fx);
      else if (v < 0.85) crate(ctx, cx, y, '#4a3a30', '#2a1a14', '#d8a040');
      else barrel(ctx, cx, y, rng, false, null, '#3a3434');
      return;
    case 'crystal':
      if (v < 0.45) iceCrystal(ctx, cx, y, rng, fx);
      else if (v < 0.65) candelabra(ctx, cx, y, fx);
      else if (v < 0.85) shrineBox(ctx, cx, y);
      else statue(ctx, cx, y);
      return;
    case 'gear':
      if (v < 0.4) gearMachine(ctx, cx, y, rng);
      else if (v < 0.6) teslaCoil(ctx, cx, y, fx);
      else if (v < 0.8) gearStack(ctx, cx, y, rng);
      else crate(ctx, cx, y, '#4a3a2a', '#b08d3c');
      return;
    case 'void':
      if (v < 0.5) voidRock(ctx, cx, y, rng, fx);
      else if (v < 0.8) voidSpire(ctx, cx, y, rng, fx);
      else brokenPillar(ctx, cx, y, fx);
      return;
    default:
      crate(ctx, cx, y, '#7a5a34', '#4a3018');
  }
}

function coffin(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, open: boolean): void {
  propShadow(ctx, cx, y + 29, 13, 5);
  const pts = [cx - 6, y + 1, cx + 6, y + 1, cx + 12, y + 9, cx + 7, y + 30, cx - 7, y + 30, cx - 12, y + 9];
  poly(ctx, pts, '#4a3424', OUTLINE, 2.5);
  if (open) {
    // the inside and its occupant, lid slid aside
    poly(ctx, [cx - 4, y + 4, cx + 4, y + 4, cx + 8, y + 10, cx + 4, y + 27, cx - 4, y + 27, cx - 8, y + 10], '#120c08', '#2a1a10', 1);
    blob(ctx, cx, y + 10, 3.5, 3.5, { fill: '#d8d0b8', outlineW: 1 });
    ctx.fillStyle = '#d8d0b8';
    for (let i = 0; i < 3; i++) ctx.fillRect(cx - 3, y + 15 + i * 3, 6, 1.5);
    poly(ctx, [cx + 2, y + 6, cx + 13, y + 4, cx + 18, y + 12, cx + 12, y + 31, cx + 1, y + 30, cx - 3, y + 14], '#5a4030', OUTLINE, 2);
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(cx + 7, y + 10, 2, 11);
    ctx.fillRect(cx + 4, y + 13, 8, 2);
    return;
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 4, y + 4);
  ctx.lineTo(cx - 5, y + 27);
  ctx.moveTo(cx + 4, y + 4);
  ctx.lineTo(cx + 5, y + 27);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,200,0.12)';
  ctx.fillRect(cx - 6, y + 2, 12, 2);
  ctx.fillStyle = '#b8a070';
  ctx.fillRect(cx - 1, y + 7, 2, 13);
  ctx.fillRect(cx - 5, y + 11, 10, 2);
  ctx.fillStyle = '#8a7a5a';
  for (const [px, py] of [
    [cx - 10, y + 9],
    [cx + 9, y + 9],
    [cx - 6, y + 27],
    [cx + 5, y + 27],
  ] as const)
    ctx.fillRect(px - 1, py - 1, 2.5, 2.5);
  if (rng.chance(0.4)) {
    ctx.fillStyle = '#4f6b32';
    for (let i = 0; i < 6; i++) ctx.fillRect(cx - 10 + rng.range(0, 20), y + 20 + rng.range(0, 9), 2, 2);
  }
}

function sarcophagus(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng): void {
  propShadow(ctx, cx, y + 29, 14, 5);
  poly(ctx, [cx - 12, y + 9, cx + 12, y + 9, cx + 12, y + 30, cx - 12, y + 30], '#4a5048', OUTLINE, 2.5);
  poly(ctx, [cx - 13, y + 2, cx + 13, y + 2, cx + 13, y + 11, cx - 13, y + 11], '#6a7266', OUTLINE, 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(cx - 11, y + 3.5, 22, 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 9, y + 13.5, 18, 13);
  ctx.beginPath();
  ctx.arc(cx, y + 6.5, 2.5, 0, Math.PI * 2);
  ctx.stroke();
  if (rng.chance(0.5)) {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(cx + 4, y + 9);
    ctx.lineTo(cx + 7, y + 16);
    ctx.lineTo(cx + 5, y + 22);
    ctx.stroke();
  }
  ctx.fillStyle = '#4f6b32';
  for (let i = 0; i < 5; i++) ctx.fillRect(cx - 12 + rng.range(0, 6), y + 22 + rng.range(0, 7), 2, 2);
}

function urn(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  propShadow(ctx, cx, y + 29, 10, 4);
  limb(ctx, cx - 9, y + 12, cx - 11, y + 18, 2, '#7a6a52');
  limb(ctx, cx + 9, y + 12, cx + 11, y + 18, 2, '#7a6a52');
  blob(ctx, cx, y + 19, 10, 10, { fill: '#8a7658', outlineW: 2.5 });
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(cx - 9, y + 17, 18, 3);
  poly(ctx, [cx - 6, y + 6, cx + 6, y + 6, cx + 5, y + 10, cx - 5, y + 10], '#8a7658', OUTLINE, 2);
  blob(ctx, cx, y + 5, 6, 2.5, { fill: '#9a8668', outlineW: 2 });
  spec(ctx, cx - 4, y + 15, 1.5, 0.5);
}

function tombstone(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 12, 4);
  ctx.beginPath();
  ctx.moveTo(cx - 10, y + 29);
  ctx.lineTo(cx - 10, y + 10);
  ctx.arc(cx, y + 10, 10, Math.PI, 0);
  ctx.lineTo(cx + 10, y + 29);
  ctx.closePath();
  ctx.fillStyle = '#5a6258';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(cx - 8, y + 6, 3, 20);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(cx - 5, y + 12, 10, 1.5);
  ctx.fillRect(cx - 4, y + 16, 8, 1.5);
  ctx.fillRect(cx - 5, y + 20, 10, 1.5);
  ctx.fillStyle = '#4f6b32';
  for (let i = 0; i < 6; i++) ctx.fillRect(cx - 10 + rng.range(0, 20), y + 25 + rng.range(0, 4), 2, 2);
  // a candle left at the foot
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(cx + 9, y + 21, 5, 9);
  ctx.fillStyle = '#efe6cc';
  ctx.fillRect(cx + 10, y + 22, 3, 7);
  fx.flame(cx + 11.5, y + 21, 0.4);
  fx.light(cx + 11, y + 24, 60, '#ffb04a', 0.5);
}

function giantMushroom(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 13, 5);
  const glowC = rng.chance(0.5) ? '#5fd3c0' : '#c58cff';
  poly(ctx, [cx - 4, y + 29, cx + 4, y + 29, cx + 3, y + 12, cx - 3, y + 12], '#e0d8c8', OUTLINE, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(cx + 1, y + 13, 2, 15);
  ctx.beginPath();
  ctx.ellipse(cx, y + 13, 15, 11, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = shade(glowC, 0.55);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = glowC;
  ctx.fillRect(cx - 13, y + 12, 26, 2.5);
  ctx.fillStyle = withAlpha('#ffffff', 0.75);
  for (const [sx, sy, r] of [
    [-7, 7, 2.2],
    [3, 4, 1.8],
    [8, 9, 1.5],
    [-2, 10, 1.3],
  ] as const) {
    ctx.beginPath();
    ctx.arc(cx + sx, y + sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  glow(ctx, cx, y + 14, 22, glowC, 0.5);
  fx.light(cx, y + 18, 100, glowC, 0.6);
}

function mushroomCluster(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  const glowC = rng.chance(0.5) ? '#5fd3c0' : '#c58cff';
  for (const [ox, oy, s] of [
    [-7, 10, 0.75],
    [7, 12, 0.65],
    [0, 4, 1],
  ] as const) {
    const mx = cx + ox;
    const my = y + oy;
    poly(ctx, [mx - 2 * s, my + 18 * s, mx + 2 * s, my + 18 * s, mx + 1.5 * s, my + 6, mx - 1.5 * s, my + 6], '#d8d0c0', OUTLINE, 1.5);
    ctx.beginPath();
    ctx.ellipse(mx, my + 6, 9 * s, 7 * s, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = glowC;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(mx - 3 * s, my + 1, 2, 2);
  }
  glow(ctx, cx, y + 12, 20, glowC, 0.45);
  fx.light(cx, y + 16, 80, glowC, 0.5);
}

function boulder(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, rock: string, lichen: string, fx: PropFx | null): void {
  propShadow(ctx, cx, y + 28, 14, 5);
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = 12 * (0.85 + rng.next() * 0.3);
    ctx.lineTo(cx + Math.cos(a) * rr * 1.15, y + 18 + Math.sin(a) * rr * 0.85);
  }
  ctx.closePath();
  ctx.fillStyle = rock;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = shade(rock, 1.35);
  ctx.beginPath();
  ctx.ellipse(cx - 4, y + 13, 6, 3.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(rock, 0.7);
  ctx.beginPath();
  ctx.ellipse(cx + 3, y + 24, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lichen;
  for (let i = 0; i < 8; i++) ctx.fillRect(cx - 10 + rng.range(0, 20), y + 10 + rng.range(0, 14), 2, 2);
  if (fx) {
    glow(ctx, cx, y + 18, 14, lichen, 0.35);
    fx.light(cx, y + 18, 50, lichen, 0.35);
  }
}

function barrel(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, toxic: boolean, fx: PropFx | null, wood = '#6a4a2a'): void {
  propShadow(ctx, cx, y + 29, 12, 4);
  poly(ctx, [cx - 10, y + 7, cx + 10, y + 7, cx + 11, y + 18, cx + 10, y + 29, cx - 10, y + 29, cx - 11, y + 18], toxic ? '#3a4a3a' : wood, OUTLINE, 2.5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (const sx of [-5, 0, 5]) ctx.fillRect(cx + sx, y + 9, 1, 19);
  ctx.fillStyle = 'rgba(255,230,200,0.12)';
  ctx.fillRect(cx - 8, y + 9, 2, 19);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(cx - 11, y + 11, 22, 2.5);
  ctx.fillRect(cx - 11, y + 23, 22, 2.5);
  blob(ctx, cx, y + 7, 10, 4, { fill: toxic ? '#2a3a2a' : shade(wood, 1.15), outlineW: 2 });
  if (toxic) {
    ctx.fillStyle = '#8ae040';
    ctx.beginPath();
    ctx.ellipse(cx, y + 7, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx + 3, y + 7, 3, 9 + rng.range(0, 6));
    ctx.beginPath();
    ctx.ellipse(cx + 6, y + 30, 6, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e030';
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + 21);
    ctx.lineTo(cx, y + 14);
    ctx.lineTo(cx + 4, y + 21);
    ctx.closePath();
    ctx.fill();
    glow(ctx, cx, y + 10, 16, '#8ae040', 0.5);
    fx?.light(cx, y + 14, 70, '#8ae040', 0.45);
  } else if (rng.chance(0.4)) {
    ctx.fillStyle = '#4a6a22';
    ctx.fillRect(cx - 4, y + 6, 6, 2);
    ctx.fillRect(cx - 2, y + 7, 2, 6);
  }
}

function crate(ctx: CanvasRenderingContext2D, cx: number, y: number, wood: string, band: string, top?: string): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  poly(ctx, [cx - 12, y + 10, cx + 12, y + 10, cx + 12, y + 30, cx - 12, y + 30], shade(wood, 0.8), OUTLINE, 2.5);
  poly(ctx, [cx - 12, y + 3, cx + 12, y + 3, cx + 12, y + 11, cx - 12, y + 11], wood, OUTLINE, 2.5);
  ctx.strokeStyle = band;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 11, y + 12);
  ctx.lineTo(cx + 11, y + 29);
  ctx.moveTo(cx + 11, y + 12);
  ctx.lineTo(cx - 11, y + 29);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(cx - 11, y + 6.5, 22, 1);
  if (top) {
    for (const ox of [-7, 0, 7]) {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(cx + ox - 3.5, y + 3, 7, 5);
      ctx.fillStyle = top;
      ctx.fillRect(cx + ox - 2.5, y + 3.5, 5, 3.5);
    }
  }
}

function sacks(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  blob(ctx, cx - 5, y + 22, 8, 7, { fill: '#8a7a5a', outlineW: 2.5 });
  blob(ctx, cx + 6, y + 23, 7, 6, { fill: '#7a6a4a', outlineW: 2.5 });
  blob(ctx, cx, y + 13, 7, 7, { fill: '#9a8a6a', outlineW: 2.5 });
  ctx.fillStyle = '#4a3a20';
  ctx.fillRect(cx - 2, y + 6, 4, 3);
}

function stump(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng): void {
  propShadow(ctx, cx, y + 29, 14, 5);
  for (const a of [-2.6, -0.5, 0.4, 2.8]) limb(ctx, cx, y + 24, cx + Math.cos(a) * 15, y + 26 + Math.abs(Math.sin(a)) * 3, 3, '#4a3018');
  poly(ctx, [cx - 11, y + 12, cx + 11, y + 12, cx + 12, y + 27, cx - 12, y + 27], '#4a3018', OUTLINE, 2.5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (const sx of [-6, -1, 5]) ctx.fillRect(cx + sx, y + 14, 1.2, 12);
  blob(ctx, cx, y + 12, 11, 5.5, { fill: '#8a6a3a', under: '#7a5a2a', outlineW: 2.5 });
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1;
  for (const r of [3, 6]) {
    ctx.beginPath();
    ctx.ellipse(cx, y + 12, r * 1.5, r * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a5a1e';
  for (let i = 0; i < 6; i++) ctx.fillRect(cx - 11 + rng.range(0, 6), y + 15 + rng.range(0, 10), 2, 2);
  if (rng.chance(0.5)) {
    blob(ctx, cx + 9, y + 20, 3, 2, { fill: '#b0302a', outlineW: 1.5 });
    blob(ctx, cx + 11, y + 23, 2, 1.5, { fill: '#b0302a', outlineW: 1.2 });
  }
}

function thornBush(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng): void {
  propShadow(ctx, cx, y + 28, 14, 5);
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const r = k % 2 === 0 ? 15 : 11;
    ctx.lineTo(cx + Math.cos(a) * r, y + 17 + Math.sin(a) * r * 0.8);
  }
  ctx.closePath();
  ctx.fill();
  blob(ctx, cx, y + 17, 12, 9.5, { fill: '#2a4a20', outlineW: 0 });
  blob(ctx, cx - 4, y + 14, 6, 4.5, { fill: '#3a6a2a', outlineW: 0 });
  ctx.fillStyle = '#c8c090';
  for (let k = 0; k < 8; k++) {
    const a = rng.range(0, Math.PI * 2);
    ctx.fillRect(cx + Math.cos(a) * 12, y + 17 + Math.sin(a) * 9, 1.5, 1.5);
  }
  ctx.fillStyle = '#a02040';
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.arc(cx + rng.range(-8, 8), y + 17 + rng.range(-6, 6), 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function log(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng): void {
  propShadow(ctx, cx, y + 27, 15, 4);
  poly(ctx, [cx - 14, y + 13, cx + 12, y + 13, cx + 12, y + 26, cx - 14, y + 26], '#4a3018', OUTLINE, 2.5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(cx - 12, y + 19, 22, 1.2);
  ctx.fillStyle = 'rgba(255,220,180,0.1)';
  ctx.fillRect(cx - 12, y + 15, 22, 2);
  blob(ctx, cx + 12, y + 19.5, 4.5, 6.5, { fill: '#8a6a3a', outlineW: 2 });
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx + 12, y + 19.5, 2, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = rng.int(1, 3); k > 0; k--) {
    const mx = cx - 10 + rng.range(0, 16);
    blob(ctx, mx, y + 12, 2.5, 1.8, { fill: '#e6b84a', outlineW: 1.2 });
  }
}

function anvil(ctx: CanvasRenderingContext2D, cx: number, y: number, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  poly(ctx, [cx - 8, y + 18, cx + 8, y + 18, cx + 10, y + 30, cx - 10, y + 30], '#4a3020', OUTLINE, 2.5);
  poly(ctx, [cx - 5, y + 13, cx + 5, y + 13, cx + 4, y + 19, cx - 4, y + 19], '#2e2e34', OUTLINE, 2);
  poly(ctx, [cx - 14, y + 7, cx + 10, y + 7, cx + 14, y + 9, cx + 10, y + 14, cx - 10, y + 14], '#3a3a42', OUTLINE, 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(cx - 11, y + 8, 20, 1.5);
  // a glowing ingot on the face
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(cx - 7, y + 4, 10, 5);
  ctx.fillStyle = '#ff7a1a';
  ctx.fillRect(cx - 6, y + 5, 8, 3);
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(cx - 5, y + 5.5, 5, 1);
  glow(ctx, cx - 2, y + 6, 12, '#ff7a1a', 0.6);
  limb(ctx, cx + 10, y + 28, cx + 14, y + 16, 2, '#6a4a2a');
  poly(ctx, [cx + 11, y + 13, cx + 18, y + 13, cx + 18, y + 18, cx + 11, y + 18], '#4a4a52', OUTLINE, 2);
  fx.light(cx - 2, y + 10, 60, '#ff7a1a', 0.45);
}

function coals(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  poly(ctx, [cx - 12, y + 12, cx + 12, y + 12, cx + 10, y + 29, cx - 10, y + 29], '#3a3030', OUTLINE, 2.5);
  ctx.fillStyle = '#5a4a46';
  ctx.fillRect(cx - 11, y + 19, 22, 2);
  blob(ctx, cx, y + 12, 12, 4.5, { fill: '#1a0a06', outlineW: 2.5 });
  for (let k = 0; k < 9; k++) {
    ctx.fillStyle = rng.chance(0.5) ? '#ff6a10' : '#ffb050';
    ctx.beginPath();
    ctx.arc(cx + rng.range(-8, 8), y + 12 + rng.range(-2, 2), rng.range(1.2, 2.4), 0, Math.PI * 2);
    ctx.fill();
  }
  glow(ctx, cx, y + 10, 18, '#ff6a10', 0.7);
  fx.flame(cx, y + 10, 0.55);
  fx.light(cx, y + 12, 90, '#ff6a10', 0.6);
}

function iceCrystal(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 12, 4);
  for (const [ox, h, wv] of [
    [-6, 16, 4],
    [6, 13, 3.5],
    [0, 26, 5.5],
  ] as const) {
    const bx = cx + ox + rng.range(-1, 1);
    poly(ctx, [bx - wv, y + 29, bx - wv, y + 29 - h * 0.75, bx, y + 29 - h, bx + wv, y + 29 - h * 0.75, bx + wv, y + 29], '#bfe4ff', '#2a4a7a', 2);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.moveTo(bx - wv + 1, y + 28);
    ctx.lineTo(bx - wv + 1, y + 29 - h * 0.72);
    ctx.lineTo(bx, y + 30 - h);
    ctx.lineTo(bx - 0.5, y + 28);
    ctx.closePath();
    ctx.fill();
  }
  glow(ctx, cx, y + 16, 20, '#9ad0ff', 0.45);
  fx.light(cx, y + 18, 90, '#9ad0ff', 0.55);
}

function candelabra(ctx: CanvasRenderingContext2D, cx: number, y: number, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 9, 3.5);
  poly(ctx, [cx - 6, y + 30, cx + 6, y + 30, cx + 2, y + 26, cx - 2, y + 26], '#d4af37', OUTLINE, 2);
  limb(ctx, cx, y + 27, cx, y + 12, 2, '#d4af37');
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 9, y + 10);
  ctx.quadraticCurveTo(cx, y + 18, cx + 9, y + 10);
  ctx.stroke();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (const ox of [-9, 0, 9]) {
    const top = ox === 0 ? y + 4 : y + 6;
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx + ox - 2.5, top - 0.5, 5, (ox === 0 ? 9 : 5) + 1);
    ctx.fillStyle = '#f4ecd8';
    ctx.fillRect(cx + ox - 1.6, top, 3.2, ox === 0 ? 9 : 5);
    fx.flame(cx + ox, top - 1, 0.42);
  }
  fx.light(cx, y + 10, 90, '#ffd27a', 0.6);
}

function shrineBox(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  poly(ctx, [cx - 12, y + 12, cx + 12, y + 12, cx + 12, y + 30, cx - 12, y + 30], '#3a5a8a', OUTLINE, 2.5);
  poly(ctx, [cx - 13, y + 5, cx + 13, y + 5, cx + 12, y + 13, cx - 12, y + 13], '#4a6a9a', OUTLINE, 2.5);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(cx - 12, y + 12, 24, 2);
  ctx.fillRect(cx - 1.5, y + 14, 3, 10);
  ctx.fillRect(cx - 5, y + 17, 10, 2.5);
  ctx.fillStyle = 'rgba(240,250,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, y + 6, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function statue(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  propShadow(ctx, cx, y + 29, 12, 4);
  poly(ctx, [cx - 11, y + 22, cx + 11, y + 22, cx + 12, y + 30, cx - 12, y + 30], '#6a7a8a', OUTLINE, 2.5);
  poly(ctx, [cx - 7, y + 22, cx - 8, y + 10, cx - 3, y + 6, cx + 4, y + 6, cx + 8, y + 12, cx + 6, y + 22], '#a8b8c8', OUTLINE, 2.5);
  blob(ctx, cx + 1, y + 4, 4, 4, { fill: '#b8c8d8', outlineW: 2 });
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 3, y + 8);
  ctx.lineTo(cx - 1, y + 14);
  ctx.lineTo(cx + 2, y + 19);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,250,255,0.75)';
  ctx.fillRect(cx - 6, y + 9, 6, 2);
}

function gearMachine(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng): void {
  propShadow(ctx, cx, y + 29, 13, 4);
  poly(ctx, [cx - 12, y + 12, cx + 12, y + 12, cx + 12, y + 30, cx - 12, y + 30], '#5a4a2a', OUTLINE, 2.5);
  ctx.fillStyle = '#2aa198';
  ctx.fillRect(cx - 8, y + 17, 3, 3);
  ctx.fillStyle = '#c84a30';
  ctx.fillRect(cx - 3, y + 17, 3, 3);
  blob(ctx, cx + 6, y + 22, 4, 4, { fill: '#e8dcc0', outlineW: 1.5 });
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 6, y + 22);
  ctx.lineTo(cx + 8, y + 20);
  ctx.stroke();
  ctx.fillStyle = '#b08d3c';
  ctx.beginPath();
  const rot = rng.next();
  for (let i = 0; i < 20; i++) {
    const a = rot + (i / 20) * Math.PI * 2;
    const r = i % 2 === 0 ? 11 : 8.5;
    ctx.lineTo(cx + Math.cos(a) * r, y + 9 + Math.sin(a) * r * 0.55);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  blob(ctx, cx, y + 9, 3, 2, { fill: '#3a2a14', outlineW: 1.5 });
}

function gearStack(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng): void {
  propShadow(ctx, cx, y + 28, 13, 4);
  for (const [ox, oy, r, c] of [
    [-3, 22, 11, '#8a6d2e'],
    [3, 16, 9, '#b08d3c'],
    [-1, 10, 7, '#d4b060'],
  ] as const) {
    ctx.beginPath();
    const rot = rng.next();
    for (let i = 0; i < 18; i++) {
      const a = rot + (i / 18) * Math.PI * 2;
      const rr = i % 2 === 0 ? r : r * 0.78;
      ctx.lineTo(cx + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr * 0.5);
    }
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.ellipse(cx + ox, y + oy, r * 0.25, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function teslaCoil(ctx: CanvasRenderingContext2D, cx: number, y: number, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 10, 4);
  poly(ctx, [cx - 9, y + 30, cx + 9, y + 30, cx + 7, y + 25, cx - 7, y + 25], '#5a4a2a', OUTLINE, 2);
  poly(ctx, [cx - 4, y + 25, cx + 4, y + 25, cx + 3, y + 11, cx - 3, y + 11], '#8a5a3a', OUTLINE, 2);
  ctx.fillStyle = '#c08a5a';
  for (let k = y + 13; k < y + 24; k += 3) ctx.fillRect(cx - 3.5, k, 7, 1.2);
  blob(ctx, cx, y + 8, 5.5, 5.5, { fill: '#2aa198', outlineW: 2 });
  spec(ctx, cx - 2, y + 6, 1.5);
  glow(ctx, cx, y + 8, 18, '#2aa198', 0.6);
  fx.light(cx, y + 12, 90, '#2aa198', 0.6);
}

function voidRock(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  // it floats: a shadow on the ground, violet light beneath, the rock raised above
  propShadow(ctx, cx, y + 29, 11, 3.5);
  glow(ctx, cx, y + 27, 16, '#7a2bd6', 0.55);
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = (i % 2 === 0 ? 12 : 9) * (0.85 + rng.next() * 0.3);
    ctx.lineTo(cx + Math.cos(a) * rr, y + 14 + Math.sin(a) * rr * 0.75 + (Math.sin(a) > 0 ? 3 : 0));
  }
  ctx.closePath();
  ctx.fillStyle = '#1e1430';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#3a2a56';
  ctx.beginPath();
  ctx.moveTo(cx - 8, y + 11);
  ctx.lineTo(cx - 1, y + 7);
  ctx.lineTo(cx + 3, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b06bff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 3, y + 14);
  ctx.lineTo(cx + 2, y + 17);
  ctx.lineTo(cx + 6, y + 15);
  ctx.stroke();
  fx.light(cx, y + 24, 70, '#7a2bd6', 0.5);
}

function voidSpire(ctx: CanvasRenderingContext2D, cx: number, y: number, rng: PropRng, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 10, 3.5);
  for (const [ox, h, wv] of [
    [-5, 14, 3.5],
    [5, 18, 3.5],
    [0, 27, 5],
  ] as const) {
    const bx = cx + ox + rng.range(-1, 1);
    poly(ctx, [bx - wv, y + 29, bx, y + 29 - h, bx + wv, y + 29], '#4a1a7a', OUTLINE, 2);
    ctx.fillStyle = '#b06bff';
    ctx.beginPath();
    ctx.moveTo(bx - wv + 1.5, y + 28);
    ctx.lineTo(bx, y + 30 - h);
    ctx.lineTo(bx, y + 28);
    ctx.closePath();
    ctx.fill();
  }
  glow(ctx, cx, y + 16, 20, '#b06bff', 0.5);
  fx.light(cx, y + 18, 90, '#7a2bd6', 0.55);
}

function brokenPillar(ctx: CanvasRenderingContext2D, cx: number, y: number, fx: PropFx): void {
  propShadow(ctx, cx, y + 29, 12, 4);
  poly(ctx, [cx - 10, y + 30, cx - 10, y + 12, cx - 4, y + 9, cx + 1, y + 13, cx + 6, y + 8, cx + 10, y + 11, cx + 10, y + 30], '#2a1e3a', OUTLINE, 2.5);
  ctx.fillStyle = '#3e2e56';
  ctx.fillRect(cx - 9, y + 13, 3, 16);
  ctx.strokeStyle = '#b06bff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 2, y + 17);
  ctx.lineTo(cx + 3, y + 17);
  ctx.lineTo(cx, y + 24);
  ctx.closePath();
  ctx.stroke();
  glow(ctx, cx, y + 20, 12, '#b06bff', 0.45);
  fx.light(cx, y + 22, 50, '#7a2bd6', 0.35);
}
