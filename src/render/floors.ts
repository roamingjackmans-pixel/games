// Zone floors (pre-rendered once per room, seeded by room id so every room differs and looks the same on every
// visit): crypt flagstones, cavern rock, sewer brick, forest litter, forge plates, reliquary marble, citadel
// brass tiles, abyssal obsidian. No hard tile grid.
import { OUTLINE, mix, shade, withAlpha } from '../engine/draw/parts';
import { Rng } from '../engine/rng';
import { ROOM_W, TILE } from '../game/room';
import type { Palette } from '../game/types';
import { E, RH, RW, crack, jitterPoly, soft, type RoomArt, type RoomStyle, type Tiles } from './roomStyle';

export interface FloorCtx {
  ctx: CanvasRenderingContext2D;
  rng: Rng;
  tiles: Tiles;
  pal: Palette;
  style: RoomStyle;
  art: RoomArt;
}

/** Floor tiles a decal may sit on (shuffled-pick helper). */
function floorSpots(f: FloorCtx): number[] {
  const out: number[] = [];
  for (let i = 0; i < f.tiles.e.length; i++) if (f.tiles.e[i] === E.Floor) out.push(i);
  return out;
}

function spot(f: FloorCtx, list: number[], pad = 4): [number, number] {
  if (!list.length) return [RW / 2, RH / 2];
  const i = list[f.rng.int(0, list.length - 1)]!;
  return [(i % ROOM_W) * TILE + f.rng.range(pad, TILE - pad), Math.floor(i / ROOM_W) * TILE + f.rng.range(pad, TILE - pad)];
}

/** Floor tiles touching a wall (for roots, wax, grime). */
function wallSpots(f: FloorCtx): number[] {
  const out: number[] = [];
  const t = f.tiles;
  for (let i = 0; i < t.e.length; i++) {
    if (t.e[i] !== E.Floor) continue;
    const x = i % ROOM_W;
    const y = Math.floor(i / ROOM_W);
    if (t.wall(x, y - 1) || t.wall(x - 1, y) || t.wall(x + 1, y) || t.wall(x, y + 1)) out.push(i);
  }
  return out;
}

export function paintFloor(f: FloorCtx): void {
  switch (f.style.id) {
    case 'caverns':
      return cavernFloor(f);
    case 'sewers':
      return sewerFloor(f);
    case 'forest':
      return forestFloor(f);
    case 'forge':
      return forgeFloor(f);
    case 'reliquary':
      return reliquaryFloor(f);
    case 'citadel':
      return citadelFloor(f);
    case 'abyss':
      return abyssFloor(f);
    default:
      return cryptFloor(f, f.style.id === 'crypt');
  }
}

// ------------------------------------------------------------------ 1 · Mossy Crypt: flagstones, moss, bones, wax, runes

const MOSS = ['#3d5826', '#557a34', '#2c421e', '#6a8a3a'];

function mossRun(ctx: CanvasRenderingContext2D, rng: Rng, x0: number, y0: number, x1: number, y1: number, dense: number): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(2, Math.floor((len / 3) * dense));
  for (let k = 0; k < n; k++) {
    const t = rng.next();
    const x = x0 + (x1 - x0) * t + rng.range(-2, 2);
    const y = y0 + (y1 - y0) * t + rng.range(-2, 2);
    ctx.fillStyle = MOSS[rng.int(0, 3)]!;
    ctx.globalAlpha = 0.65 + rng.next() * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + rng.next() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function slab(f: FloorCtx, x: number, y: number, w: number, h: number, moss: number): void {
  const { ctx, rng, pal } = f;
  const j = (): number => rng.range(-1.6, 1.6);
  const p = [x + 1.5 + j(), y + 1.5 + j(), x + w - 1.5 + j(), y + 1.5 + j(), x + w - 1.5 + j(), y + h - 1.5 + j(), x + 1.5 + j(), y + h - 1.5 + j()];
  const base = shade(mix(pal.floor, pal.floor2, rng.next()), 0.82 + rng.next() * 0.36);
  ctx.beginPath();
  ctx.moveTo(p[0]!, p[1]!);
  for (let i = 2; i < 8; i += 2) ctx.lineTo(p[i]!, p[i + 1]!);
  ctx.closePath();
  ctx.fillStyle = base;
  ctx.fill();
  // worn middle, bevel light on the top/left, dark on the bottom/right
  if (rng.chance(0.5)) soft(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.45, '#ffffff', 0.025 + rng.next() * 0.03);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.moveTo(p[6]!, p[7]! - 1);
  ctx.lineTo(p[0]!, p[1]!);
  ctx.lineTo(p[2]!, p[3]!);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.38)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p[2]!, p[3]!);
  ctx.lineTo(p[4]!, p[5]!);
  ctx.lineTo(p[6]!, p[7]!);
  ctx.stroke();
  if (rng.chance(0.22)) crack(ctx, rng, x + rng.range(4, w - 4), y + rng.range(4, h - 4), rng.range(8, Math.max(10, w * 0.6)), rng.range(0, Math.PI * 2), 'rgba(0,0,0,0.4)', 1);
  if (rng.chance(0.12)) {
    // chipped corner
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(p[4]!, p[5]!);
    ctx.lineTo(p[4]! - rng.range(4, 8), p[5]!);
    ctx.lineTo(p[4]!, p[5]! - rng.range(4, 8));
    ctx.fill();
  }
  // moss creeping out of the cracks
  if (moss > 0 && rng.chance(moss)) {
    const e = rng.int(0, 3);
    const a = e * 2;
    const b = ((e + 1) % 4) * 2;
    const t0 = rng.next() * 0.5;
    const t1 = t0 + 0.3 + rng.next() * 0.5;
    mossRun(ctx, rng, p[a]! + (p[b]! - p[a]!) * t0, p[a + 1]! + (p[b + 1]! - p[a + 1]!) * t0, p[a]! + (p[b]! - p[a]!) * Math.min(1, t1), p[a + 1]! + (p[b + 1]! - p[a + 1]!) * Math.min(1, t1), 1.2);
  }
}

function bone(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, a: number): void {
  const dx = (Math.cos(a) * len) / 2;
  const dy = (Math.sin(a) * len) / 2;
  const px = -Math.sin(a) * 1.8;
  const py = Math.cos(a) * 1.8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(10,8,6,0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy + 1);
  ctx.lineTo(x + dx, y + dy + 1);
  ctx.stroke();
  ctx.strokeStyle = '#cfc6ad';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  ctx.fillStyle = '#ddd5bd';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + dx * s + px, y + dy * s + py, 2, 0, Math.PI * 2);
    ctx.arc(x + dx * s - px, y + dy * s - py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function skull(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = 'rgba(10,8,6,0.5)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 2, 6 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8d0b8';
  ctx.beginPath();
  ctx.arc(x, y, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 3 * s, y + 2 * s, 6 * s, 4 * s);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 5 * s, Math.PI * 0.8, Math.PI * 2.2);
  ctx.stroke();
  ctx.fillStyle = '#1a1410';
  ctx.beginPath();
  ctx.arc(x - 2 * s, y + 0.5 * s, 1.4 * s, 0, Math.PI * 2);
  ctx.arc(x + 2 * s, y + 0.5 * s, 1.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 0.5 * s, y + 2.5 * s, 1 * s, 1.5 * s);
}

/** A cluster of wax candle stubs (flames are drawn per frame). */
export function candles(ctx: CanvasRenderingContext2D, art: RoomArt, rng: Rng, x: number, y: number, n: number, tint: 0 | 1 = 0, light = '#ffb04a'): void {
  ctx.fillStyle = 'rgba(232,223,196,0.75)';
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.ellipse(x + rng.range(-6, 6), y + rng.range(-2, 3), rng.range(3, 7), rng.range(2, 4), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < n; k++) {
    const cx = x + rng.range(-7, 7);
    const h = rng.range(5, 12);
    const cy = y + rng.range(-2, 3);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(cx - 2.5, cy - h - 0.5, 5, h + 1.5);
    ctx.fillStyle = '#efe6cc';
    ctx.fillRect(cx - 1.8, cy - h, 3.6, h);
    ctx.fillStyle = '#c8bc98';
    ctx.fillRect(cx + 0.6, cy - h, 1.2, h);
    art.flames.push({ x: cx, y: cy - h - 1, s: 0.42, phase: rng.next() * 10, tint });
  }
  art.lights.push({ x, y: y - 6, r: 64 + n * 8, color: light, a: 0.55, flicker: 1, phase: rng.next() * 10 });
}

function rune(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, r: number, color: string, a: number): void {
  ctx.strokeStyle = withAlpha(color, a);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  const n = rng.int(5, 8);
  for (let k = 0; k < n; k++) {
    const ang = (k / n) * Math.PI * 2;
    const gx = x + Math.cos(ang) * r * 0.86;
    const gy = y + Math.sin(ang) * r * 0.86;
    ctx.beginPath();
    ctx.moveTo(gx - 3, gy - 2);
    ctx.lineTo(gx + rng.range(-3, 3), gy + 3);
    ctx.lineTo(gx + 3, gy - rng.range(0, 3));
    ctx.stroke();
  }
  // a glyph in the middle
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.5);
  ctx.lineTo(x, y + r * 0.5);
  ctx.moveTo(x - r * 0.35, y - r * 0.15);
  ctx.lineTo(x + r * 0.35, y + r * 0.2);
  ctx.stroke();
}

function cryptFloor(f: FloorCtx, crypt: boolean): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = shade(pal.floor, 0.5);
  ctx.fillRect(0, 0, RW, RH);
  let y = 0;
  while (y < RH) {
    const rh = rng.pick([32, 40, 48, 40]);
    let x = -rng.int(0, 48);
    while (x < RW) {
      const sw = rng.int(36, 86);
      slab(f, x, y, sw, rh, crypt ? 0.42 : 0.12);
      x += sw;
    }
    y += rh;
  }
  // damp blotches
  for (let k = 0; k < 26; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 90), '#000000', 0.08 + rng.next() * 0.1);
  if (crypt) for (let k = 0; k < 10; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 70), '#3d5826', 0.08 + rng.next() * 0.08);
  const spots = floorSpots(f);
  const nearWall = wallSpots(f);
  // faded runes (a couple glow faintly)
  for (let k = rng.int(crypt ? 1 : 0, 2); k > 0; k--) {
    const [rx, ry] = spot(f, spots, 16);
    const rr = rng.range(24, 40);
    const glows = rng.chance(0.5);
    rune(ctx, rng, rx, ry, rr, glows ? '#8fe0b0' : pal.accent, glows ? 0.22 : 0.12);
    if (glows) f.art.lights.push({ x: rx, y: ry, r: rr * 2.4, color: '#6ad0a0', a: 0.3, flicker: 3, phase: rng.next() * 10 });
  }
  if (!crypt) return;
  // bones and skulls
  for (let k = rng.int(5, 10); k > 0; k--) {
    const [bx, by] = spot(f, spots);
    bone(ctx, bx, by, rng.range(8, 14), rng.range(0, Math.PI));
    if (rng.chance(0.3)) bone(ctx, bx + rng.range(-6, 6), by + rng.range(-4, 4), rng.range(6, 11), rng.range(0, Math.PI));
  }
  for (let k = rng.int(0, 2); k > 0; k--) {
    const [sx, sy] = spot(f, nearWall.length ? nearWall : spots, 8);
    skull(ctx, sx, sy, rng.range(0.9, 1.15));
    bone(ctx, sx + 9, sy + 4, 10, rng.range(0, Math.PI));
  }
  // candle wax by the walls
  for (let k = rng.int(1, 3); k > 0; k--) {
    const [cx, cy] = spot(f, nearWall.length ? nearWall : spots, 9);
    candles(ctx, f.art, rng, cx, cy, rng.int(1, 3));
  }
}

// ------------------------------------------------------------------ 2 · Fungal Caverns: uneven rock, glowing fungus, spore dust

const FUNGUS: [string, string][] = [
  ['#5fd3c0', '#d8fff6'],
  ['#c58cff', '#f4e4ff'],
];

export function fungusPatch(ctx: CanvasRenderingContext2D, art: RoomArt, rng: Rng, x: number, y: number, r: number): void {
  const [c, hi] = FUNGUS[rng.int(0, 1)]!;
  soft(ctx, x, y, r * 1.6, c, 0.2);
  // mycelium threads
  ctx.strokeStyle = withAlpha('#e8e0f0', 0.14);
  ctx.lineWidth = 1;
  for (let k = 0; k < 7; k++) {
    const a = rng.range(0, Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a + 0.5) * r * 0.8, y + Math.sin(a + 0.5) * r * 0.8, x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5);
    ctx.stroke();
  }
  const n = rng.int(6, 13);
  for (let k = 0; k < n; k++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(0, r);
    const mx = x + Math.cos(a) * d;
    const my = y + Math.sin(a) * d * 0.8;
    const s = rng.range(1.8, 4.6);
    ctx.fillStyle = '#d8d0c0';
    ctx.fillRect(mx - 0.8, my, 1.6, s * 0.9);
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.ellipse(mx, my, s + 1, s * 0.7 + 1, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(mx, my, s, s * 0.7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = hi;
    ctx.fillRect(mx - s * 0.3, my - s * 0.45, 1.3, 1.3);
  }
  art.lights.push({ x, y, r: r * 3.2, color: c, a: 0.5, flicker: 2, phase: rng.next() * 10 });
}

function cavernFloor(f: FloorCtx): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = shade(pal.floor, 0.55);
  ctx.fillRect(0, 0, RW, RH);
  // uneven rock plates
  for (let k = 0; k < 300; k++) {
    const x = rng.range(-20, RW + 20);
    const y = rng.range(-20, RH + 20);
    jitterPoly(ctx, rng, x, y, rng.range(16, 38), rng.int(6, 8), 0.3, 0.8);
    ctx.fillStyle = shade(mix(pal.floor, '#352c48', rng.next() * 0.6), 0.68 + rng.next() * 0.32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(8,4,14,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (let k = 0; k < 24; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 90), rng.chance(0.5) ? '#000000' : '#4a3a66', 0.08 + rng.next() * 0.1);
  // gravel
  for (let k = 0; k < 260; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    const s = rng.range(1, 2.6);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y + 0.8, s, s);
    ctx.fillStyle = rng.chance(0.5) ? '#5a4a70' : '#3e3250';
    ctx.fillRect(x, y, s, s);
  }
  for (let k = 0; k < 18; k++) crack(ctx, rng, rng.range(0, RW), rng.range(0, RH), rng.range(16, 50), rng.range(0, Math.PI * 2), 'rgba(6,2,12,0.55)', 1.5);
  const spots = floorSpots(f);
  for (let k = rng.int(3, 6); k > 0; k--) {
    const [x, y] = spot(f, spots, 8);
    fungusPatch(ctx, f.art, rng, x, y, rng.range(12, 24));
  }
  // spore dust
  for (let k = 0; k < 360; k++) {
    ctx.fillStyle = rng.chance(0.5) ? withAlpha('#5fd3c0', 0.12 + rng.next() * 0.2) : withAlpha('#c58cff', 0.1 + rng.next() * 0.16);
    ctx.fillRect(rng.range(0, RW), rng.range(0, RH), 1.2, 1.2);
  }
}

// ------------------------------------------------------------------ 3 · Drowned Sewers: wet brick, puddles, grime, algae

function puddle(f: FloorCtx, x: number, y: number, r: number): void {
  const { ctx, rng } = f;
  ctx.fillStyle = 'rgba(6,14,12,0.7)';
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.ellipse(x + rng.range(-r * 0.5, r * 0.5), y + rng.range(-r * 0.25, r * 0.25), r * rng.range(0.5, 0.9), r * rng.range(0.3, 0.5), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  soft(ctx, x - r * 0.2, y - r * 0.12, r * 0.7, '#4a7a70', 0.22, 1, 0.5);
  ctx.strokeStyle = 'rgba(190,220,210,0.22)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const lx = x + rng.range(-r * 0.5, r * 0.3);
    const ly = y + rng.range(-r * 0.25, r * 0.2);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + rng.range(4, 10), ly);
    ctx.stroke();
  }
  f.art.puddles.push([x, y, r * 0.8, r * 0.4]);
}

function sewerFloor(f: FloorCtx): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = '#10160f';
  ctx.fillRect(0, 0, RW, RH);
  const bh = 16;
  for (let row = 0; row * bh < RH; row++) {
    const off = row % 2 === 0 ? 0 : -16;
    for (let x = off; x < RW; x += 32) {
      const y = row * bh;
      if (rng.chance(0.015)) continue; // a missing brick
      let c = shade(mix(pal.floor, pal.floor2, rng.next()), 0.62 + rng.next() * 0.38);
      if (rng.chance(0.12)) c = mix(c, '#3a3424', 0.5);
      else if (rng.chance(0.14)) c = mix(c, '#2a4a2a', 0.4);
      ctx.fillStyle = c;
      ctx.fillRect(x + 1, y + 1, 30, bh - 2);
      ctx.fillStyle = 'rgba(200,230,210,0.06)';
      ctx.fillRect(x + 1, y + 1, 30, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 1, y + bh - 2.5, 30, 1.5);
      if (rng.chance(0.05)) crack(ctx, rng, x + rng.range(4, 26), y + 4, rng.range(6, 14), rng.range(0, Math.PI * 2), 'rgba(0,0,0,0.45)', 1, false);
    }
  }
  // wet sheen and grime streaks
  for (let k = 0; k < 18; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 80), '#a8d8c8', 0.03, 1.6, 0.5);
  for (let k = 0; k < 34; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(14, 30), '#000000', 0.2 + rng.next() * 0.15, 0.5, 2.2);
  for (let k = 0; k < 16; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(20, 50), '#3a2a14', 0.18, 1, 1);
  // algae
  for (let k = 0; k < 18; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    soft(ctx, x, y, rng.range(18, 34), '#3a6a22', 0.16);
    for (let d = 0; d < 26; d++) {
      ctx.fillStyle = rng.chance(0.5) ? '#3d5e22' : '#557f2c';
      ctx.globalAlpha = 0.5 + rng.next() * 0.4;
      ctx.fillRect(x + rng.range(-22, 22), y + Math.round(rng.range(-14, 14) / 8) * 8 + rng.range(-1, 1), rng.range(1, 3), 1.5);
    }
    ctx.globalAlpha = 1;
  }
  const spots = floorSpots(f);
  for (let k = rng.int(3, 6); k > 0; k--) {
    const [x, y] = spot(f, spots, 10);
    puddle(f, x, y, rng.range(14, 26));
  }
}

// ------------------------------------------------------------------ 4 · Hollow Forest: dirt, leaf litter, roots, grass, mushrooms

const LEAVES = ['#c8621f', '#e6b84a', '#8a4a1a', '#a0501a', '#6a5a1a', '#b0402a'];

function forestFloor(f: FloorCtx): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = pal.floor;
  ctx.fillRect(0, 0, RW, RH);
  for (let k = 0; k < 80; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(24, 70), rng.pick(['#3a3218', '#1c1c0e', '#2e3a1a', '#3a2a12']), 0.3 + rng.next() * 0.3);
  // grass patches and tufts
  for (let k = 0; k < 18; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 70), '#3a5a1e', 0.2);
  ctx.lineCap = 'round';
  for (let k = 0; k < 180; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    ctx.strokeStyle = rng.pick(['#4a6a24', '#5f8a2e', '#3a5420', '#7a9a3a']);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let b = 0; b < 4; b++) {
      const a = -Math.PI / 2 + rng.range(-0.7, 0.7);
      const l = rng.range(3, 8);
      ctx.moveTo(x + b - 1.5, y);
      ctx.lineTo(x + b - 1.5 + Math.cos(a) * l, y + Math.sin(a) * l);
    }
    ctx.stroke();
  }
  // roots crawling out of the tree line
  const nearWall = wallSpots(f);
  for (let k = rng.int(5, 9); k > 0 && nearWall.length; k--) {
    const i = nearWall[rng.int(0, nearWall.length - 1)]!;
    const tx = i % ROOM_W;
    const ty = Math.floor(i / ROOM_W);
    let x = tx * TILE + 16;
    let y = ty * TILE + 16;
    let a: number;
    if (f.tiles.wall(tx, ty - 1)) {
      y = ty * TILE;
      a = Math.PI / 2 + rng.range(-0.6, 0.6);
    } else if (f.tiles.wall(tx - 1, ty)) {
      x = tx * TILE;
      a = rng.range(-0.6, 0.6);
    } else if (f.tiles.wall(tx + 1, ty)) {
      x = tx * TILE + TILE;
      a = Math.PI + rng.range(-0.6, 0.6);
    } else {
      y = ty * TILE + TILE;
      a = -Math.PI / 2 + rng.range(-0.6, 0.6);
    }
    root(ctx, rng, x, y, a, rng.range(40, 90), rng.range(4, 6));
  }
  // twigs and pebbles
  ctx.strokeStyle = '#4a3418';
  ctx.lineWidth = 1.3;
  for (let k = 0; k < 26; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    const a = rng.range(0, Math.PI * 2);
    const l = rng.range(6, 14);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.moveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5);
    ctx.lineTo(x + Math.cos(a + 0.6) * l * 0.8, y + Math.sin(a + 0.6) * l * 0.8);
    ctx.stroke();
  }
  for (let k = 0; k < 40; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    const s = rng.range(1.5, 3.5);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, s, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rng.pick(['#6a6650', '#585440']);
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // leaf litter
  for (let k = 0; k < 420; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    const rx = rng.range(2.2, 4.2);
    const a = rng.range(0, Math.PI);
    ctx.globalAlpha = 0.6 + rng.next() * 0.4;
    ctx.fillStyle = LEAVES[rng.int(0, LEAVES.length - 1)]!;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.5, a, 0, Math.PI * 2);
    ctx.fill();
    if (rx > 3.4) {
      ctx.strokeStyle = 'rgba(40,20,8,0.6)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * rx, y - Math.sin(a) * rx);
      ctx.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // mushroom clusters (a few glow amber)
  const spots = floorSpots(f);
  for (let k = rng.int(2, 5); k > 0; k--) {
    const [x, y] = spot(f, nearWall.length && rng.chance(0.6) ? nearWall : spots, 8);
    const glows = rng.chance(0.45);
    for (let m = rng.int(2, 4); m > 0; m--) {
      const mx = x + rng.range(-8, 8);
      const my = y + rng.range(-5, 5);
      const s = rng.range(2.5, 4.5);
      ctx.fillStyle = '#e0d4b0';
      ctx.fillRect(mx - 1, my - s * 0.3, 2, s * 1.2);
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(mx, my - s * 0.3, s + 1, s * 0.7 + 1, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = glows ? '#e6b84a' : rng.pick(['#b0302a', '#8a5a2a']);
      ctx.beginPath();
      ctx.ellipse(mx, my - s * 0.3, s, s * 0.7, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#f4ead0';
      ctx.fillRect(mx - s * 0.4, my - s * 0.75, 1.2, 1.2);
    }
    if (glows) f.art.lights.push({ x, y, r: 60, color: '#e6b84a', a: 0.4, flicker: 2, phase: rng.next() * 10 });
  }
}

export function root(ctx: CanvasRenderingContext2D, rng: Rng, x: number, y: number, a: number, len: number, w: number): void {
  const pts: number[] = [x, y];
  let px = x;
  let py = y;
  let ang = a;
  for (let d = 0; d < len; d += 8) {
    ang += rng.range(-0.45, 0.45);
    px += Math.cos(ang) * 8;
    py += Math.sin(ang) * 8;
    pts.push(px, py);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = pts.length / 2;
  for (const [col, extra, dy] of [
    ['rgba(0,0,0,0.45)', 2, 2],
    ['#120c06', 2, 0],
    ['#4a3018', 0, 0],
  ] as const) {
    ctx.strokeStyle = col;
    for (let i = 1; i < n; i++) {
      ctx.lineWidth = Math.max(1, w * (1 - i / n)) + extra;
      ctx.beginPath();
      ctx.moveTo(pts[(i - 1) * 2]!, pts[(i - 1) * 2 + 1]! + dy);
      ctx.lineTo(pts[i * 2]!, pts[i * 2 + 1]! + dy);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(140,100,60,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[0]! - 1, pts[1]! - 1);
  for (let i = 1; i < Math.ceil(n * 0.6); i++) ctx.lineTo(pts[i * 2]! - 1, pts[i * 2 + 1]! - 1);
  ctx.stroke();
}

// ------------------------------------------------------------------ 5 · Ashen Forge: iron plates, rivets, soot, glowing seams

export function rivet(ctx: CanvasRenderingContext2D, x: number, y: number, r = 2.2, hi = '#7a6a60'): void {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(x + 0.6, y + 0.8, r + 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - r * 0.5, y - r * 0.6, 1, 1);
}

function forgeFloor(f: FloorCtx): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = '#140b09';
  ctx.fillRect(0, 0, RW, RH);
  const seams: [number, number, number, number][] = [];
  for (let gy = 0; gy < RH; gy += 64) {
    let gx = 0;
    while (gx < RW) {
      const w = rng.chance(0.3) ? 128 : 64;
      const x = gx;
      const y = gy;
      ctx.fillStyle = shade(mix(pal.floor, '#3a2c28', rng.next()), 0.68 + rng.next() * 0.32);
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, 61);
      if (rng.chance(0.25)) soft(ctx, x + w / 2, y + 32, 34, rng.chance(0.5) ? '#5a2a1a' : '#3a3a5a', 0.22);
      // tread pattern
      if (rng.chance(0.3)) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let ty = y + 8; ty < y + 60; ty += 9)
          for (let tx = x + 8 + ((ty / 9) % 2) * 4; tx < x + w - 6; tx += 9) {
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + 4, ty - 3);
          }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,220,200,0.07)';
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, 1.5);
      ctx.fillRect(x + 1.5, y + 1.5, 1.5, 61);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x + 1.5, y + 61, w - 3, 1.5);
      ctx.fillRect(x + w - 3, y + 1.5, 1.5, 61);
      for (const [rx, ry] of [
        [x + 6, y + 6],
        [x + w - 6, y + 6],
        [x + 6, y + 58],
        [x + w - 6, y + 58],
      ] as const)
        rivet(ctx, rx, ry, 2, '#5e4e46');
      seams.push([x, y + 64, x + w, y + 64], [x + w, y, x + w, y + 64]);
      gx += w;
    }
  }
  // soot and scorch marks
  for (let k = 0; k < 34; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(26, 80), '#000000', 0.2 + rng.next() * 0.25);
  for (let k = 0; k < 6; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    soft(ctx, x, y, rng.range(20, 34), '#000000', 0.45);
    for (let e = 0; e < 8; e++) {
      ctx.fillStyle = rng.chance(0.5) ? '#ff7a1a' : '#8a2a10';
      ctx.fillRect(x + rng.range(-14, 14), y + rng.range(-10, 10), 1.5, 1.5);
    }
  }
  // glowing seams
  for (let k = rng.int(3, 6); k > 0 && seams.length; k--) {
    const [x0, y0, x1, y1] = seams[rng.int(0, seams.length - 1)]!;
    if (y0 >= RH || x0 >= RW) continue;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ff5a10';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0 + 6, y0);
    ctx.lineTo(x1 - (x1 > x0 ? 6 : 0), y1 - (y1 > y0 ? 6 : 0));
    ctx.stroke();
    ctx.strokeStyle = '#ffd27a';
    ctx.lineWidth = 1;
    ctx.stroke();
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    soft(ctx, mx, my, 40, '#ff6a10', 0.25, x1 > x0 ? 1.4 : 0.6, y1 > y0 ? 1.4 : 0.6);
    f.art.lights.push({ x: mx, y: my, r: 80, color: '#ff6a10', a: 0.45, flicker: 2, phase: rng.next() * 10 });
  }
  // metal shavings
  for (let k = 0; k < 120; k++) {
    ctx.fillStyle = rng.chance(0.5) ? 'rgba(160,140,130,0.25)' : 'rgba(0,0,0,0.3)';
    ctx.fillRect(rng.range(0, RW), rng.range(0, RH), rng.range(1, 3), 1);
  }
}

// ------------------------------------------------------------------ 6 · Frozen Reliquary: frosted marble, ice crackle, gold inlay

function reliquaryFloor(f: FloorCtx): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = '#1a2532';
  ctx.fillRect(0, 0, RW, RH);
  for (let gy = 0; gy < RH; gy += 64)
    for (let gx = 0; gx < RW; gx += 64) {
      const light = ((gx + gy) / 64) % 2 === 0;
      ctx.fillStyle = shade(light ? mix(pal.floor2, '#4a6076', 0.45) : pal.floor, 0.92 + rng.next() * 0.16);
      ctx.fillRect(gx + 1, gy + 1, 62, 62);
      ctx.save();
      ctx.beginPath();
      ctx.rect(gx + 1, gy + 1, 62, 62);
      ctx.clip();
      // marble veins
      for (let v = rng.int(1, 2); v > 0; v--) {
        ctx.strokeStyle = rng.chance(0.6) ? withAlpha('#a8c0d8', 0.16 + rng.next() * 0.14) : 'rgba(10,20,34,0.35)';
        ctx.lineWidth = rng.range(0.7, 1.4);
        ctx.beginPath();
        let x = gx + rng.range(0, 64);
        let y = gy;
        ctx.moveTo(x, y);
        while (y < gy + 64) {
          x += rng.range(-8, 8);
          y += rng.range(5, 12);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(220,240,255,0.08)';
      ctx.fillRect(gx + 1, gy + 1, 62, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(gx + 1, gy + 61.5, 62, 1.5);
    }
  // gold inlay: framed 2 × 2 panels with diamonds at the corners
  const step = rng.pick([192, 256]);
  const ox = rng.pick([0, 64]);
  const oy = rng.pick([0, 64]);
  ctx.strokeStyle = withAlpha('#d4af37', 0.5);
  ctx.lineWidth = 1.5;
  for (let y = oy; y < RH; y += step)
    for (let x = ox; x < RW; x += step) {
      ctx.strokeRect(x + 6, y + 6, 116, 116);
      for (const [dx, dy] of [
        [6, 6],
        [122, 6],
        [6, 122],
        [122, 122],
      ] as const)
        diamond(ctx, x + dx, y + dy, 5);
      diamond(ctx, x + 64, y + 64, 9);
    }
  // frost and crackle
  for (let k = 0; k < 26; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 90), '#e8f4ff', 0.05 + rng.next() * 0.1);
  for (let k = 0; k < 14; k++) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    for (let b = rng.int(3, 5); b > 0; b--) crack(ctx, rng, x, y, rng.range(14, 36), rng.range(0, Math.PI * 2), withAlpha('#e8f4ff', 0.3 + rng.next() * 0.2), 0.9);
  }
  for (let k = 0; k < 260; k++) {
    ctx.fillStyle = withAlpha('#ffffff', 0.15 + rng.next() * 0.35);
    ctx.fillRect(rng.range(0, RW), rng.range(0, RH), 1.3, 1.3);
  }
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6a5418';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#fff3c0';
  ctx.fillRect(x - 1, y - r * 0.5, 1.5, 1.5);
  ctx.strokeStyle = withAlpha('#d4af37', 0.5);
  ctx.lineWidth = 1.5;
}

// ------------------------------------------------------------------ 7 · Clockwork Citadel: brass-trimmed tiles, gear inlays, pipes

export function gearPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, teeth: number, rot = 0): void {
  ctx.beginPath();
  const n = teeth * 2;
  for (let i = 0; i <= n * 2; i++) {
    const a = rot + (i / (n * 2)) * Math.PI * 2;
    const rr = Math.floor(i / 2) % 2 === 0 ? r : r * 0.8;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function pipeRun(ctx: CanvasRenderingContext2D, rng: Rng, art: RoomArt, x0: number, y0: number, x1: number, y1: number): void {
  ctx.lineCap = 'butt';
  for (const [c, w, o] of [
    ['rgba(0,0,0,0.5)', 12, 3],
    [OUTLINE, 11, 0],
    ['#8a5a3a', 8, 0],
    ['#c08a5a', 2, -2],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    const horiz = y0 === y1;
    ctx.moveTo(x0 + (horiz ? 0 : o), y0 + (horiz ? o : 0));
    ctx.lineTo(x1 + (horiz ? 0 : o), y1 + (horiz ? o : 0));
    ctx.stroke();
  }
  const horiz = y0 === y1;
  const len = Math.abs(horiz ? x1 - x0 : y1 - y0);
  for (let d = 24; d < len - 8; d += 64) {
    const fx = horiz ? Math.min(x0, x1) + d : x0;
    const fy = horiz ? y0 : Math.min(y0, y1) + d;
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(fx - (horiz ? 4 : 8), fy - (horiz ? 8 : 4), horiz ? 8 : 16, horiz ? 16 : 8);
    ctx.fillStyle = '#b08d3c';
    ctx.fillRect(fx - (horiz ? 3 : 7), fy - (horiz ? 7 : 3), horiz ? 6 : 14, horiz ? 14 : 6);
    if (rng.chance(0.3)) art.vents.push([fx, fy]);
  }
}

function citadelFloor(f: FloorCtx): void {
  const { ctx, rng, pal } = f;
  ctx.fillStyle = '#121016';
  ctx.fillRect(0, 0, RW, RH);
  for (let gy = 0; gy < RH; gy += 64)
    for (let gx = 0; gx < RW; gx += 64) {
      const copper = rng.chance(0.05);
      ctx.fillStyle = copper ? shade('#4a2e22', 0.85 + rng.next() * 0.25) : shade(mix(pal.floor, pal.floor2, rng.next()), 0.9 + rng.next() * 0.25);
      ctx.fillRect(gx + 1.5, gy + 1.5, 61, 61);
      // brass trim
      ctx.fillStyle = withAlpha('#b08d3c', 0.45);
      ctx.fillRect(gx + 1.5, gy + 1.5, 61, 1.5);
      ctx.fillRect(gx + 1.5, gy + 1.5, 1.5, 61);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(gx + 1.5, gy + 61, 61, 1.5);
      ctx.fillRect(gx + 61, gy + 1.5, 1.5, 61);
      for (const [rx, ry] of [
        [gx + 6, gy + 6],
        [gx + 58, gy + 6],
        [gx + 6, gy + 58],
        [gx + 58, gy + 58],
      ] as const)
        rivet(ctx, rx, ry, 1.6, '#9a7a34');
      if (copper) {
        ctx.fillStyle = '#120c0a';
        for (let s = 0; s < 4; s++) ctx.fillRect(gx + 18, gy + 20 + s * 7, 28, 3);
      } else if (rng.chance(0.07)) {
        ctx.strokeStyle = withAlpha('#b08d3c', 0.35 + rng.next() * 0.2);
        ctx.lineWidth = 2;
        gearPath(ctx, gx + 32, gy + 32, rng.range(16, 24), rng.int(8, 12), rng.next());
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(gx + 32, gy + 32, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  // a big gear inlay or two
  for (let k = rng.int(0, 2); k > 0; k--) {
    const x = rng.int(2, 18) * 64;
    const y = rng.int(1, 9) * 64;
    ctx.strokeStyle = withAlpha('#b08d3c', 0.3);
    ctx.lineWidth = 3;
    gearPath(ctx, x, y, 56, 16, rng.next());
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  // teal light strips
  for (let k = rng.int(2, 4); k > 0; k--) {
    const vert = rng.chance(0.5);
    const x = rng.int(1, 19) * 64;
    const y = rng.int(1, 10) * 64;
    const x1 = vert ? x : x + 64 * rng.int(1, 3);
    const y1 = vert ? y + 64 * rng.int(1, 2) : y;
    ctx.strokeStyle = '#2aa198';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = '#a8fff4';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    f.art.lights.push({ x: (x + x1) / 2, y: (y + y1) / 2, r: 70, color: '#2aa198', a: 0.4, flicker: 2, phase: rng.next() * 10 });
  }
  // floor pipes
  for (let k = rng.int(1, 2); k > 0; k--) {
    if (rng.chance(0.5)) {
      const y = rng.int(3, 18) * TILE + 16;
      const x0 = rng.int(1, 12) * TILE;
      pipeRun(ctx, rng, f.art, x0, y, x0 + rng.int(6, 16) * TILE, y);
    } else {
      const x = rng.int(4, 35) * TILE + 16;
      const y0 = rng.int(1, 6) * TILE;
      pipeRun(ctx, rng, f.art, x, y0, x, y0 + rng.int(5, 12) * TILE);
    }
  }
  for (let k = 0; k < 20; k++) soft(ctx, rng.range(0, RW), rng.range(0, RH), rng.range(30, 80), '#000000', 0.12 + rng.next() * 0.12);
}

// ------------------------------------------------------------------ 8 · The Abyss: cracked obsidian, violet veins

function abyssFloor(f: FloorCtx): void {
  const { ctx, rng } = f;
  ctx.fillStyle = '#07030c';
  ctx.fillRect(0, 0, RW, RH);
  for (let k = 0; k < 260; k++) {
    const x = rng.range(-30, RW + 30);
    const y = rng.range(-30, RH + 30);
    const r = rng.range(22, 46);
    jitterPoly(ctx, rng, x, y, r, rng.int(5, 7), 0.35, 0.85);
    ctx.fillStyle = shade(mix('#170d26', '#281a3c', rng.next()), 0.85 + rng.next() * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#030106';
    ctx.lineWidth = 2;
    ctx.stroke();
    // glassy glint
    if (rng.chance(0.5)) {
      ctx.strokeStyle = withAlpha('#c8b0ff', 0.05 + rng.next() * 0.07);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, y - r * 0.1);
      ctx.lineTo(x + r * 0.1, y - r * 0.45);
      ctx.stroke();
    }
  }
  // violet veins
  for (let k = rng.int(7, 12); k > 0; k--) {
    const x = rng.range(0, RW);
    const y = rng.range(0, RH);
    const len = rng.range(40, 120);
    const a = rng.range(0, Math.PI * 2);
    const seed = rng.nextU32();
    for (const [c, w] of [
      ['#030106', 4],
      ['#7a2bd6', 1.8],
      ['#e0c0ff', 0.7],
    ] as const) {
      const r2 = new Rng(seed);
      crack(ctx, r2, x, y, len, a, c, w);
    }
    soft(ctx, x + Math.cos(a) * len * 0.4, y + Math.sin(a) * len * 0.4, len * 0.5, '#7a2bd6', 0.18);
    f.art.lights.push({ x: x + Math.cos(a) * len * 0.4, y: y + Math.sin(a) * len * 0.4, r: len * 0.8, color: '#7a2bd6', a: 0.35, flicker: 3, phase: rng.next() * 10 });
  }
  for (let k = 0; k < 220; k++) {
    ctx.fillStyle = withAlpha(rng.chance(0.7) ? '#b06bff' : '#ffffff', 0.08 + rng.next() * 0.2);
    ctx.fillRect(rng.range(0, RW), rng.range(0, RH), 1.2, 1.2);
  }
}

/** Ambient occlusion where the floor meets walls and blocks (keeps edges grounded). */
export function floorEdgeShade(ctx: CanvasRenderingContext2D, t: Tiles): void {
  for (let ty = 0; ty < 22; ty++)
    for (let tx = 0; tx < ROOM_W; tx++) {
      const v = t.get(tx, ty);
      if (v === E.Wall || v === E.Pit || v === E.Void) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      if (t.wall(tx - 1, ty)) soft(ctx, x, y + 16, 16, '#000000', 0.35, 0.5, 1.2);
      if (t.wall(tx + 1, ty)) soft(ctx, x + 32, y + 16, 16, '#000000', 0.35, 0.5, 1.2);
      if (t.wall(tx, ty + 1)) soft(ctx, x + 16, y + 32, 16, '#000000', 0.25, 1.2, 0.4);
    }
}
