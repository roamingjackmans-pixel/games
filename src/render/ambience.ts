// Per-frame room atmosphere, cheap by design (no allocation per frame, cached glow sprites, no shadowBlur):
//  · under the entities (called from drawRoomFloor): flickering light pools, torch/candle flames, animated hazard
//    tiles (ripples, lava bubbles, ice glints, void motes), turning wall gears, haze in pits, star twinkle in the
//    void, the glow on a shut door's seal;
//  · over the entities (called from the view after particles): the zone's ambient particles (dust motes, spores,
//    drips, fireflies and falling leaves, embers and ash, snow, steam and gear sparks, void motes, dust falling
//    into pits) and a soft vignette.
// Math.random is fine here (cosmetic, client only).
import { OUTLINE, getGlow, offscreen } from '../engine/draw/parts';
import { ROOM_W, ROOM_Y0, TILE, type Room, type Side } from '../game/room';
import { gearPath } from './floors';
import { AMB, RH, RW, type AmbKind, type Light, type RoomArt, type RoomStyle } from './roomStyle';
import { doorRect } from './walls';

const MAXP = 110;

interface Anim {
  /** tile index or puddle index */
  i: number;
  phase: number;
  period: number;
  last: number;
}

interface State {
  art: RoomArt;
  flick: Light[];
  haz: Anim[];
  puddles: Anim[];
  stars: Anim[];
  fog: number[];
  // particles (struct of arrays, fixed kind per slot)
  n: number;
  kind: Uint8Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  life: Float32Array;
  max: Float32Array;
  size: Float32Array;
  seed: Float32Array;
}

let st: State | null = null;
let lastT = 0;

const rnd = Math.random;
const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;

function anims(count: number, n: number, pMin: number, pMax: number): Anim[] {
  const out: Anim[] = [];
  for (let k = 0; k < count; k++) out.push({ i: Math.floor(rnd() * n), phase: rnd() * 10, period: pMin + rnd() * (pMax - pMin), last: 0 });
  return out;
}

function setup(art: RoomArt): State {
  const flick = art.lights
    .filter((l) => l.flicker > 0)
    .sort((a, b) => b.r * b.a - a.r * a.a)
    .slice(0, 28);
  const fam = art.hazardFamily;
  const nh = art.hazardTiles.length;
  const hazCount = nh === 0 || fam === 'thorns' ? 0 : Math.min(18, Math.ceil(nh / 5));
  const fog: number[] = [];
  for (const i of art.pitTiles) {
    const ok = [i - 1, i + 1, i - ROOM_W, i + ROOM_W].every((j) => art.pitTiles.includes(j));
    if (ok && fog.length < 8 && (i * 7) % 3 === 0) fog.push(i);
  }
  const s: State = {
    art,
    flick,
    haz: anims(hazCount, nh, fam === 'molten' ? 1.2 : 1.6, fam === 'molten' ? 2.4 : 3.2),
    puddles: anims(art.puddles.length, art.puddles.length, 2, 3.4).map((a, k) => ({ ...a, i: k })),
    stars: anims(art.voidTiles.length ? 14 : 0, art.voidTiles.length, 1.5, 3.5),
    fog,
    n: 0,
    kind: new Uint8Array(MAXP),
    x: new Float32Array(MAXP),
    y: new Float32Array(MAXP),
    vx: new Float32Array(MAXP),
    vy: new Float32Array(MAXP),
    life: new Float32Array(MAXP),
    max: new Float32Array(MAXP),
    size: new Float32Array(MAXP),
    seed: new Float32Array(MAXP),
  };
  for (const [kind, count] of art.style.particles) {
    if (kind === AMB.pitDust && !art.pitTiles.length && !art.voidTiles.length) continue;
    if (kind === AMB.steam && !art.vents.length) continue;
    for (let k = 0; k < count && s.n < MAXP; k++) {
      const i = s.n++;
      s.kind[i] = kind;
      spawn(s, i, true);
    }
  }
  return s;
}

function tilePoint(list: number[]): [number, number] {
  if (!list.length) return [64 + rnd() * (RW - 128), 64 + rnd() * (RH - 128)];
  const i = list[Math.floor(rnd() * list.length)]!;
  return [(i % ROOM_W) * TILE + rnd() * TILE, Math.floor(i / ROOM_W) * TILE + rnd() * TILE];
}

function spawn(s: State, i: number, initial: boolean): void {
  const art = s.art;
  const k = s.kind[i] as AmbKind;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let life = 4;
  let size = 2;
  switch (k) {
    case AMB.dust:
      [x, y] = tilePoint(art.openTiles);
      vx = (rnd() - 0.5) * 8;
      vy = (rnd() - 0.5) * 6;
      life = 5 + rnd() * 5;
      size = 1 + rnd() * 1.4;
      break;
    case AMB.spore:
      [x, y] = tilePoint(art.openTiles);
      vx = (rnd() - 0.5) * 8;
      vy = -6 - rnd() * 9;
      life = 4 + rnd() * 4;
      size = 2.5 + rnd() * 2.5;
      break;
    case AMB.drip:
      [x, y] = art.vents.length && rnd() < 0.5 ? pick(art.vents) : tilePoint(art.openTiles);
      life = 0.9 + rnd() * 2.5; // fall + splash, then idle
      size = 1;
      break;
    case AMB.firefly:
      [x, y] = tilePoint(art.openTiles);
      vx = (rnd() - 0.5) * 24;
      vy = (rnd() - 0.5) * 24;
      life = 5 + rnd() * 5;
      size = 3 + rnd() * 2;
      break;
    case AMB.leaf:
      x = rnd() * (RW + 200) - 200;
      y = initial ? rnd() * RH : -20 - rnd() * 60;
      vx = 10 + rnd() * 18;
      vy = 16 + rnd() * 14;
      life = 8 + rnd() * 6;
      size = 3 + rnd() * 1.5;
      break;
    case AMB.ember: {
      const hot = art.lights.filter((l) => l.color === '#ff6a10' || l.color === '#ff7a1a');
      if (hot.length && rnd() < 0.7) {
        const l = pick(hot);
        x = l.x + (rnd() - 0.5) * l.r * 0.6;
        y = l.y + (rnd() - 0.5) * l.r * 0.3;
      } else [x, y] = tilePoint(art.openTiles);
      vx = (rnd() - 0.5) * 12;
      vy = -18 - rnd() * 26;
      life = 1.4 + rnd() * 2;
      size = 1.5 + rnd() * 1.8;
      break;
    }
    case AMB.ash:
      x = rnd() * RW;
      y = initial ? rnd() * RH : -10;
      vx = 2 + rnd() * 6;
      vy = 6 + rnd() * 8;
      life = 8 + rnd() * 6;
      size = 1.2 + rnd() * 1.2;
      break;
    case AMB.snow:
      x = rnd() * (RW + 100) - 50;
      y = initial ? rnd() * RH : -10 - rnd() * 40;
      vx = -4 + rnd() * 10;
      vy = 12 + rnd() * 14;
      life = 9 + rnd() * 8;
      size = 1.2 + rnd() * 1.6;
      break;
    case AMB.steam:
      [x, y] = pick(art.vents);
      vx = (rnd() - 0.5) * 8;
      vy = -16 - rnd() * 12;
      life = 1.6 + rnd() * 1.2 + (initial ? rnd() * 2 : rnd() * 1.5);
      size = 4;
      break;
    case AMB.spark:
      if (art.gears.length && rnd() < 0.7) {
        const g = pick(art.gears);
        x = g.x;
        y = g.y;
      } else [x, y] = tilePoint(art.openTiles);
      {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 2.4;
        const sp = 50 + rnd() * 80;
        vx = Math.cos(a) * sp;
        vy = Math.sin(a) * sp;
      }
      life = 0.35 + rnd() * 0.3 + rnd() * 3; // short flight after a random wait
      size = 1.5;
      break;
    case AMB.voidMote:
      [x, y] = tilePoint(art.voidTiles.length && rnd() < 0.5 ? art.voidTiles : art.openTiles);
      vx = (rnd() - 0.5) * 6;
      vy = -5 - rnd() * 10;
      life = 4 + rnd() * 5;
      size = 2 + rnd() * 3.5;
      break;
    case AMB.pitDust: {
      const list = art.pitTiles.length ? art.pitTiles : art.voidTiles;
      const i2 = list[Math.floor(rnd() * list.length)]!;
      x = (i2 % ROOM_W) * TILE + 3 + rnd() * (TILE - 6);
      y = Math.floor(i2 / ROOM_W) * TILE + rnd() * 6;
      vx = (rnd() - 0.5) * 4;
      vy = 7 + rnd() * 8;
      life = 1.4 + rnd() * 1.4;
      size = 1 + rnd();
      break;
    }
  }
  s.x[i] = x;
  s.y[i] = y;
  s.vx[i] = vx;
  s.vy[i] = vy;
  s.max[i] = life;
  s.life[i] = initial ? life * (0.05 + rnd() * 0.95) : life;
  s.size[i] = size;
  s.seed[i] = rnd() * 100;
}

function ensure(art: RoomArt): State {
  if (!st || st.art !== art) st = setup(art);
  return st;
}

// ------------------------------------------------------------------ under the entities

const FLAME: [string, string][] = [
  ['#ff6a10', '#ffd27a'],
  ['#ffb040', '#fff3c0'],
  ['#9a4af0', '#f0d8ff'],
  ['#a8c040', '#f0ffb0'],
];

const SEAL: Record<string, string> = { forge: '#ff6a10', reliquary: '#9ad0ff', citadel: '#2aa198', abyss: '#d6a8ff' };

export function drawAmbienceUnder(ctx: CanvasRenderingContext2D, room: Room, art: RoomArt, t: number): void {
  const s = ensure(art);
  const prevOp = ctx.globalCompositeOperation;
  ctx.save();
  ctx.translate(0, ROOM_Y0);
  // glowing hazards breathe
  if (art.hazardGlow) {
    const slow = art.hazardFamily === 'crumble' || art.hazardFamily === 'moss';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = slow ? 0.35 + 0.3 * Math.sin(t * 1.3) : 0.3 + 0.22 * Math.sin(t * 1.9) + 0.08 * Math.sin(t * 5.3);
    ctx.drawImage(art.hazardGlow.canvas, art.hazardGlow.x, art.hazardGlow.y);
  }
  // flickering light
  ctx.globalCompositeOperation = 'lighter';
  for (const L of s.flick) {
    const k =
      L.flicker === 1
        ? 0.72 + 0.18 * Math.sin(t * 9.3 + L.phase) + 0.1 * Math.sin(t * 23.1 + L.phase * 1.7)
        : L.flicker === 2
          ? 0.7 + 0.3 * Math.sin(t * 1.6 + L.phase)
          : 0.75 + 0.25 * Math.sin(t * 3.2 + L.phase);
    const r = L.r * (0.68 + 0.05 * k);
    ctx.globalAlpha = Math.min(1, 0.2 * L.a * k);
    ctx.drawImage(getGlow(L.color), L.x - r, L.y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = 1;
  hazardAnims(ctx, s, t);
  // puddle ripples
  ctx.lineWidth = 1;
  for (const a of s.puddles) {
    const pd = art.puddles[a.i];
    if (!pd) continue;
    const p = ((t + a.phase) % a.period) / a.period;
    ctx.strokeStyle = 'rgba(200,230,220,0.4)';
    ctx.globalAlpha = 1 - p;
    ctx.beginPath();
    ctx.ellipse(pd[0] + Math.sin(a.phase) * pd[2] * 0.3, pd[1], 1 + p * pd[2] * 0.6, 0.5 + p * pd[3] * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // haze sitting deep in the pits
  for (const i of s.fog) {
    const x = (i % ROOM_W) * TILE + 16 + Math.sin(t * 0.4 + i) * 5;
    const y = Math.floor(i / ROOM_W) * TILE + 18 + Math.cos(t * 0.3 + i) * 3;
    ctx.globalAlpha = 0.12 + 0.05 * Math.sin(t * 0.7 + i);
    ctx.drawImage(getGlow(art.style.fog), x - 22, y - 16, 44, 32);
  }
  // stars twinkling in the void
  ctx.fillStyle = '#ffffff';
  for (const a of s.stars) {
    const p = ((t + a.phase) % a.period) / a.period;
    if (p < a.last) a.i = Math.floor(rnd() * art.voidTiles.length);
    a.last = p;
    const ti = art.voidTiles[a.i];
    if (ti === undefined) continue;
    const x = (ti % ROOM_W) * TILE + ((a.phase * 37) % 28) + 2;
    const y = Math.floor(ti / ROOM_W) * TILE + ((a.phase * 53) % 20) + 10;
    const k = Math.sin(p * Math.PI);
    ctx.globalAlpha = k * 0.9;
    ctx.fillRect(x - 2.5 * k, y - 0.5, 5 * k, 1);
    ctx.fillRect(x - 0.5, y - 2.5 * k, 1, 5 * k);
  }
  ctx.globalAlpha = 1;
  // flames
  for (const f of art.flames) flame(ctx, f.x, f.y, f.s, t, f.phase, FLAME[f.tint]!);
  // turning gears
  for (const g of art.gears) {
    gearPath(ctx, g.x, g.y, g.r, g.teeth, t * 0.9 * g.dir);
    ctx.fillStyle = '#b08d3c';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a2a14';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // a shut door's seal pulses
  const seal = SEAL[art.style.id] ?? '#ffb04a';
  ctx.globalCompositeOperation = 'lighter';
  for (const side of ['n', 's', 'e', 'w'] as Side[]) {
    const d = room.doors[side];
    if (!d.exists || d.open) continue;
    const [x, y, w, h] = doorRect(side);
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3);
    ctx.drawImage(getGlow(seal), x + w / 2 - 26, y + h / 2 - 26, 52, 52);
  }
  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = 1;
  ctx.restore();
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, ph: number, c: [string, string]): void {
  const h = (11 + Math.sin(t * 13 + ph) * 2 + Math.sin(t * 7.7 + ph * 2) * 1.5) * s;
  const w = 4.2 * s;
  const sway = Math.sin(t * 5 + ph) * 1.5 * s;
  const prev = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(getGlow(c[0]), x - 14 * s, y - 18 * s, 28 * s, 28 * s);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prev;
  ctx.fillStyle = c[0];
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w, y - h * 0.55, x + sway, y - h);
  ctx.quadraticCurveTo(x + w, y - h * 0.55, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.6, x - w, y);
  ctx.fill();
  ctx.fillStyle = c[1];
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y);
  ctx.quadraticCurveTo(x - w * 0.45, y - h * 0.35, x + sway * 0.6, y - h * 0.6);
  ctx.quadraticCurveTo(x + w * 0.45, y - h * 0.35, x + w * 0.5, y);
  ctx.closePath();
  ctx.fill();
}

function hazardAnims(ctx: CanvasRenderingContext2D, s: State, t: number): void {
  const art = s.art;
  const fam = art.hazardFamily;
  const hi = art.hazardHi;
  const list = art.hazardTiles;
  if (!list.length) return;
  for (const a of s.haz) {
    const p = ((t + a.phase) % a.period) / a.period;
    if (p < a.last) a.i = Math.floor(rnd() * list.length);
    a.last = p;
    const ti = list[a.i];
    if (ti === undefined) continue;
    const x = (ti % ROOM_W) * TILE + 6 + ((a.phase * 41) % 20);
    const y = Math.floor(ti / ROOM_W) * TILE + 6 + ((a.phase * 29) % 20);
    switch (fam) {
      case 'liquid': {
        const bubbly = art.hazardKind === 'acid' || art.hazardKind === 'poisonCloud' || art.hazardKind === 'poison' || art.hazardKind === 'bog' || art.hazardKind === 'sludge';
        if (bubbly && p < 0.8) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = hi;
          ctx.beginPath();
          ctx.arc(x, y, 1 + p * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const q = bubbly ? (p - 0.8) / 0.2 : p;
          ctx.globalAlpha = (1 - q) * 0.55;
          ctx.strokeStyle = hi;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(x, y, 2 + q * 10, 1 + q * 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (bubbly) {
          // a wisp of fumes drifting off the bog
          ctx.globalAlpha = Math.sin(p * Math.PI) * 0.18;
          ctx.drawImage(getGlow(hi), x - 16, y - 16 - p * 18, 32, 24);
        }
        break;
      }
      case 'molten':
        if (p < 0.85) {
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = '#ffd27a';
          ctx.beginPath();
          ctx.arc(x, y, 1 + p * 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff6a10';
          ctx.beginPath();
          ctx.arc(x + 0.8, y + 0.8, (1 + p * 3.5) * 0.55, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const q = (p - 0.85) / 0.15;
          ctx.globalAlpha = 1 - q;
          ctx.strokeStyle = '#ffd27a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 4 + q * 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffd27a';
          ctx.fillRect(x - 5 * q, y - 8 * q, 1.5, 1.5);
          ctx.fillRect(x + 5 * q, y - 6 * q, 1.5, 1.5);
        }
        break;
      case 'ice': {
        const k = Math.sin(p * Math.PI);
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4 * k, y - 0.5, 8 * k, 1);
        ctx.fillRect(x - 0.5, y - 4 * k, 1, 8 * k);
        break;
      }
      case 'crumble':
        ctx.globalAlpha = (1 - p) * 0.8;
        ctx.fillStyle = '#d6a8ff';
        ctx.fillRect(x, y - p * 16, 1.5, 1.5);
        break;
      case 'moss': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.7;
        ctx.drawImage(getGlow(hi), x - 5, y - 5, 10, 10);
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------ over the entities

let vignette: { key: string; canvas: CanvasImageSource } | null = null;

function vignetteFor(style: RoomStyle): CanvasImageSource {
  const key = `${style.id}|${style.vignette}`;
  if (vignette?.key === key) return vignette.canvas;
  const { canvas, ctx } = offscreen(RW, RH);
  const g = ctx.createRadialGradient(RW / 2, RH / 2, 260, RW / 2, RH / 2, 780);
  const [r, gg, b] = hex(style.vignetteColor);
  g.addColorStop(0, `rgba(${r},${gg},${b},0)`);
  g.addColorStop(0.55, `rgba(${r},${gg},${b},${style.vignette * 0.35})`);
  g.addColorStop(1, `rgba(${r},${gg},${b},${style.vignette})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, RW, RH);
  vignette = { key, canvas };
  return canvas;
}

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Ambient particles and the vignette, drawn over the entities. Call once per frame. */
export function drawAmbience(ctx: CanvasRenderingContext2D, realDt: number): void {
  if (!st) return;
  const art = st.art;
  const s = st;
  const dt = Math.min(0.05, Math.max(0, realDt));
  const t = performance.now() / 1000;
  lastT = t;
  ctx.save();
  ctx.translate(0, ROOM_Y0);
  const prevOp = ctx.globalCompositeOperation;
  for (let i = 0; i < s.n; i++) {
    s.life[i]! -= dt;
    if (s.life[i]! <= 0) spawn(s, i, false);
    const k = s.kind[i] as AmbKind;
    const life = s.life[i]!;
    const max = s.max[i]!;
    const age = max - life;
    const fade = Math.min(1, age / 0.6, life / 0.6);
    const sd = s.seed[i]!;
    // motion
    switch (k) {
      case AMB.firefly:
        s.vx[i]! += (Math.sin(t * 1.3 + sd) * 30 - s.vx[i]! * 0.5) * dt;
        s.vy[i]! += (Math.cos(t * 1.1 + sd * 1.3) * 30 - s.vy[i]! * 0.5) * dt;
        break;
      case AMB.spark:
        if (life < 0.65) s.vy[i]! += 220 * dt;
        break;
      case AMB.steam:
        s.size[i]! += dt * 7;
        break;
      default:
        break;
    }
    if (k !== AMB.drip && !(k === AMB.spark && life >= 0.65)) {
      const sway = k === AMB.snow || k === AMB.leaf || k === AMB.ash || k === AMB.spore ? Math.sin(t * 1.5 + sd) * 10 : 0;
      s.x[i]! += (s.vx[i]! + sway) * dt;
      s.y[i]! += s.vy[i]! * dt;
    }
    const x = s.x[i]!;
    const y = s.y[i]!;
    const sz = s.size[i]!;
    switch (k) {
      case AMB.dust:
        ctx.globalAlpha = fade * (0.25 + 0.2 * Math.sin(t * 2 + sd));
        ctx.fillStyle = '#e8e0c8';
        ctx.fillRect(x, y, sz, sz);
        break;
      case AMB.ash:
        ctx.globalAlpha = fade * 0.55;
        ctx.fillStyle = '#8a8480';
        ctx.fillRect(x, y, sz, sz);
        break;
      case AMB.snow:
        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = '#f4f8ff';
        ctx.fillRect(x, y, sz, sz);
        break;
      case AMB.pitDust:
        ctx.globalAlpha = Math.min(1, age / 0.3) * (life / max) * 0.7;
        ctx.fillStyle = '#c8c0b0';
        ctx.fillRect(x, y, sz * (life / max), sz * (life / max));
        break;
      case AMB.leaf: {
        const w = 1 + Math.abs(Math.cos(t * 3 + sd)) * sz;
        ctx.globalAlpha = fade * 0.9;
        ctx.fillStyle = sd < 33 ? '#c8621f' : sd < 66 ? '#e6b84a' : '#a0501a';
        ctx.fillRect(x - w / 2, y - 1, w, 2);
        break;
      }
      case AMB.drip: {
        // fall 0.35 s from above, splash 0.4 s, then idle until respawn
        const fall = 0.35;
        const splash = 0.4;
        if (age < fall) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#bfe0e0';
          ctx.fillRect(x, y - 50 * (1 - age / fall) - 4, 1.2, 4);
        } else if (age < fall + splash) {
          const q = (age - fall) / splash;
          ctx.globalAlpha = (1 - q) * 0.7;
          ctx.strokeStyle = '#bfe0e0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(x, y, 1 + q * 7, 0.5 + q * 3, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#bfe0e0';
          ctx.fillRect(x - 3 * q - 1, y - 5 * Math.sin(q * Math.PI), 1, 1);
          ctx.fillRect(x + 3 * q, y - 4 * Math.sin(q * Math.PI), 1, 1);
        }
        break;
      }
      case AMB.spark:
        if (life < 0.65) {
          ctx.globalAlpha = Math.min(1, life / 0.3);
          ctx.fillStyle = '#ffe48a';
          ctx.fillRect(x, y, 1.6, 1.6);
        }
        break;
      default: {
        // glow motes
        let color = '#5fd3c0';
        let a = 0.6;
        if (k === AMB.spore) {
          color = i % 2 === 0 ? '#5fd3c0' : '#c58cff';
          a = 0.5;
        } else if (k === AMB.firefly) {
          color = '#d8f060';
          a = Math.max(0, Math.sin(t * 2.2 + sd)) * 0.9;
        } else if (k === AMB.ember) {
          color = sd < 50 ? '#ff7a1a' : '#ffb050';
          a = 0.9;
        } else if (k === AMB.voidMote) {
          color = i % 3 === 0 ? '#e0c0ff' : '#7a2bd6';
          a = 0.55 + 0.3 * Math.sin(t * 2 + sd);
        } else if (k === AMB.steam) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = fade * 0.22 * Math.min(1, life);
          ctx.drawImage(getGlow('#dce4ec'), x - sz, y - sz, sz * 2, sz * 2);
          break;
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fade * a;
        const r = sz * 2.2;
        ctx.drawImage(getGlow(color), x - r, y - r, r * 2, r * 2);
        ctx.globalCompositeOperation = prevOp;
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prevOp;
  ctx.drawImage(vignetteFor(art.style), 0, 0);
  ctx.restore();
}

/** Seconds since the last ambient frame (lets tests/diagnostics see the layer ran). */
export function ambienceAge(): number {
  return performance.now() / 1000 - lastT;
}
