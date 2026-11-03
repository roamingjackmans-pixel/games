// Cutscenes (owner's request): the zone-entry story card, the Borderlands-style boss intro (storm in, roar,
// freeze-frame with the name in huge letters), the boss-defeat lines and the Instructor's lighter card. All
// drawn on the canvas over the world in logical 1280 × 720 px; skippable with any key, mouse button or gamepad
// button. The text lives in src/data/story.ts; the scenes decide when to play them (run.ts, guestRun.ts).
import { playSfx } from '../engine/audio/sfx';
import { drawById, type DrawState } from '../engine/draw/registry';
import { OUTLINE, glow, hexToRgb, mix, offscreen, shade, withAlpha } from '../engine/draw/parts';
import { FONT, drawText } from '../engine/text';
import { enemyDrawState } from '../render/entities';
import { BOSS_DEFEAT, INSTRUCTOR_INTRO } from '../data/story';
import type { BossDef, Palette } from '../game/types';
import type { Entity } from '../game/world';

/** Glowen's colour: the warm, pale ectoplasm everything leaks (matches the pickup). */
export const GLOWEN = '#fff3b0';
const W = 1280;
const H = 720;
const BAR = 108;
const INK = '#efe6d2';
const DIM = '#a59c8a';
/** typing speed (characters per second), the pause between lines and the hold after the last one */
const CPS = 48;
const GAP = 0.45;

const clock = (): number => performance.now() / 1000;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const easeOut = (v: number): number => 1 - Math.pow(1 - clamp01(v), 3);
const easeIn = (v: number): number => Math.pow(clamp01(v), 2);
/** deterministic hash noise in [0, 1) (no Math.random: the art must not flicker between frames) */
function hash(i: number, s = 0): number {
  const x = Math.sin(i * 127.1 + s * 311.7 + 0.5) * 43758.5453;
  return x - Math.floor(x);
}
const wrap = (v: number, m: number): number => ((v % m) + m) % m;
/** lighten (d > 0) or darken (d < 0) a colour by a fraction */
const tone = (hex: string, d: number): string => shade(hex, 1 + d);

// ------------------------------------------------------------------ switches and skipping

/**
 * Cutscenes play unless the page is an automated test pane (`?auto=host|guest`) or asks for none (`?nocut`,
 * `?cutscenes=0`); `?cutscenes=1` forces them on.
 */
export function cutscenesEnabled(): boolean {
  if (typeof location === 'undefined') return false;
  const q = new URLSearchParams(location.search);
  if (q.has('cutscenes')) return q.get('cutscenes') !== '0';
  return !q.has('auto') && !q.has('nocut');
}

let lastPressAt = -1;
let listening = false;
const padPrev: number[] = [];

function listen(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('keydown', (e) => {
    if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) lastPressAt = clock();
  });
  window.addEventListener('pointerdown', () => {
    lastPressAt = clock();
  });
}

function pollPads(): void {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
  for (const p of navigator.getGamepads()) {
    if (!p) continue;
    let m = 0;
    for (let i = 0; i < Math.min(17, p.buttons.length); i++) if (p.buttons[i]!.pressed) m |= 1 << i;
    const prev = padPrev[p.index] ?? m;
    if (m & ~prev) lastPressAt = clock();
    padPrev[p.index] = m;
  }
}

export interface CutCamera {
  x: number;
  y: number;
  zoom: number;
}

export interface CutDrawOpts {
  /** the camera the world was drawn with this frame (WorldView.camera) */
  cam: CutCamera | null;
}

/** A cutscene: a clock, a skip rule and a draw. Scenes tick it with real seconds and drop it when done. */
export abstract class Cutscene {
  t = 0;
  done = false;
  /** seconds it plays before fading out if nobody skips */
  abstract readonly length: number;
  /** presses earlier than this (seconds after the start) are ignored, so a held attack never skips it */
  protected minSkip = 0.3;
  protected readonly fade = 0.3;
  private readonly startedAt = clock();
  private outAt = -1;

  constructor() {
    listen();
  }

  tick(dt: number): void {
    pollPads();
    this.t += Math.min(0.1, Math.max(0, dt));
    if (this.outAt < 0 && (this.t >= this.length || lastPressAt >= this.startedAt + this.minSkip)) this.outAt = this.t;
    if (this.outAt >= 0 && this.t - this.outAt >= this.fade) this.done = true;
  }

  skip(): void {
    if (this.outAt < 0) this.outAt = this.t;
  }

  /** 1 while playing, falling to 0 over the fade-out */
  protected get out(): number {
    return this.outAt < 0 ? 1 : Math.max(0, 1 - (this.t - this.outAt) / this.fade);
  }

  /** a camera for the world under it (boss intros punch in), or null; `shake` is the settings' 0–1 */
  camera(_shake: number): CutCamera | null {
    return null;
  }

  abstract draw(ctx: CanvasRenderingContext2D, o: CutDrawOpts): void;
}

// ------------------------------------------------------------------ shared drawing helpers

/** Letterbox bars; k 0 → 1 slides them in. */
function bars(ctx: CanvasRenderingContext2D, k: number): void {
  const h = BAR * easeOut(k);
  if (h <= 0) return;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
  ctx.restore();
}

interface TypedLine {
  text: string;
  start: number;
}

/** When each line starts typing, from t0. */
function schedule(lines: readonly string[], t0: number): { lines: TypedLine[]; end: number } {
  let t = t0;
  const out: TypedLine[] = [];
  for (const l of lines) {
    out.push({ text: l, start: t });
    t += l.length / CPS + GAP;
  }
  return { lines: out, end: t };
}

/** Typed-out lines, centred as whole lines (the text grows rightward from where the full line starts). */
function drawTyped(ctx: CanvasRenderingContext2D, lines: TypedLine[], t: number, y0: number, step: number, size: number, alpha: number, color = INK): void {
  ctx.save();
  ctx.font = `normal ${size}px ${FONT}`;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!;
    const n = Math.floor((t - l.start) * CPS);
    if (n <= 0) continue;
    const full = ctx.measureText(l.text).width;
    const shown = l.text.slice(0, Math.min(l.text.length, n));
    drawText(ctx, shown, W / 2 - Math.min(full, 1160) / 2, y0 + i * step, { size, color, alpha, maxWidth: 1160, outline: 'rgba(0,0,0,0.85)', outlineWidth: 4 });
  }
  ctx.restore();
}

/** Glowen motes drifting (down toward the Landlord, or up when it is set free). */
function glowenMotes(ctx: CanvasRenderingContext2D, t: number, n: number, up: boolean, alpha: number, seed = 7): void {
  for (let i = 0; i < n; i++) {
    const sp = 22 + hash(i, seed) * 50;
    const x = wrap(hash(i, seed + 1) * W + Math.sin(t * 0.8 + i) * 24, W);
    const y = wrap(hash(i, seed + 2) * (H + 80) + (up ? -1 : 1) * sp * t, H + 80) - 40;
    const r = 6 + hash(i, seed + 3) * 10;
    glow(ctx, x, y, r, GLOWEN, alpha * (0.35 + 0.35 * Math.sin(t * 2.3 + i * 1.7)));
  }
}

function skipHint(ctx: CanvasRenderingContext2D, alpha: number): void {
  drawText(ctx, 'any key to skip', W - 24, H - BAR / 2 + 5, { size: 13, align: 'right', color: DIM, alpha: alpha * 0.7, outline: null });
}

// ------------------------------------------------------------------ zone backdrops (one drawn vignette per zone)

function vertical(ctx: CanvasRenderingContext2D, stops: [number, string][]): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function motes(ctx: CanvasRenderingContext2D, t: number, n: number, color: string, vx: number, vy: number, size: number, seed: number, alpha = 0.7): void {
  for (let i = 0; i < n; i++) {
    const k = 0.5 + hash(i, seed + 1);
    const x = wrap(hash(i, seed) * (W + 120) + vx * t * k + Math.sin(t + i) * 10, W + 120) - 60;
    const y = wrap(hash(i, seed + 2) * (H + 120) + vy * t * k, H + 120) - 60;
    glow(ctx, x, y, size * (0.6 + hash(i, seed + 3)), color, alpha * (0.5 + 0.5 * Math.sin(t * 2 + i)));
  }
}

function fillPath(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, build: () => void, stroke: string | null = null, lw = 3): void {
  ctx.beginPath();
  build();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** A gothic arch outline (pointed top) from the floor line up. */
function archPath(ctx: CanvasRenderingContext2D, x: number, w: number, top: number, floor: number): void {
  const r = w / 2;
  ctx.moveTo(x, floor);
  ctx.lineTo(x, top + r);
  ctx.quadraticCurveTo(x, top, x + r, top - r * 0.35);
  ctx.quadraticCurveTo(x + w, top, x + w, top + r);
  ctx.lineTo(x + w, floor);
  ctx.closePath();
}

/** Joe, small, side-on, watching the zone: round head, Thermos in hand (D14: an ordinary guy). */
function joeSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, rim: string): void {
  ctx.save();
  ctx.translate(x, y);
  const dark = '#08070b';
  fillPath(ctx, dark, () => ctx.ellipse(0, 4, 26, 6, 0, 0, Math.PI * 2));
  fillPath(ctx, dark, () => {
    ctx.rect(-9, -30, 7, 32);
    ctx.rect(2, -30, 7, 32);
  });
  fillPath(ctx, dark, () => ctx.roundRect(-14, -66, 28, 40, 10));
  fillPath(ctx, dark, () => ctx.arc(0, -80, 15, 0, Math.PI * 2));
  // the Thermos
  fillPath(ctx, dark, () => ctx.roundRect(13, -44, 9, 20, 3));
  ctx.strokeStyle = withAlpha(rim, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -80, 15, -Math.PI * 0.9, -Math.PI * 0.2);
  ctx.moveTo(14, -60);
  ctx.lineTo(14, -30);
  ctx.stroke();
  ctx.restore();
}

function drawCrypt(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, tone(p.wall, -0.2)],
    [0.55, tone(p.wallTop, -0.05)],
    [1, tone(p.floor, -0.1)],
  ]);
  // the crypt wall with its arches; a cold light through the far ones
  ctx.fillStyle = tone(p.wallTop, -0.1);
  ctx.fillRect(0, 120, W, 420);
  for (let i = 0; i < 7; i++) {
    const x = i * 200 - 30;
    fillPath(ctx, tone(p.wall, -0.25), () => archPath(ctx, x, 130, 210, 540), tone(p.wallTop, 0.25), 4);
    glow(ctx, x + 65, 420, 70, p.colors[3]!, 0.35);
  }
  // the Caretaker's lantern, far off
  const pulse = 0.75 + Math.sin(t * 3.1) * 0.1 + Math.sin(t * 7.3) * 0.05;
  glow(ctx, 905, 400, 90, '#ffcf6a', 0.35 * pulse);
  glow(ctx, 905, 400, 26, '#ffe6a0', 0.9 * pulse);
  // floor and graves
  ctx.fillStyle = tone(p.floor, 0.1);
  ctx.fillRect(0, 540, W, 180);
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 140 + hash(i, 3) * 50;
    const h = 60 + hash(i, 4) * 70;
    const w = 38 + hash(i, 5) * 26;
    const y = 560 + hash(i, 6) * 60;
    const stone = tone(p.colors[3]!, -0.25 - hash(i, 8) * 0.2);
    if (hash(i, 7) > 0.65) {
      fillPath(ctx, stone, () => {
        ctx.rect(x - 6, y - h, 12, h);
        ctx.rect(x - w / 2, y - h * 0.72, w, 12);
      }, OUTLINE, 3);
    } else fillPath(ctx, stone, () => ctx.roundRect(x - w / 2, y - h, w, h, [w / 2, w / 2, 2, 2]), OUTLINE, 3);
  }
  // hanging moss
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x = hash(i, 9) * W;
    const len = 30 + hash(i, 10) * 150;
    const sway = Math.sin(t * 0.9 + i) * 6;
    ctx.strokeStyle = withAlpha(i % 3 ? p.colors[0]! : p.accent, 0.55);
    ctx.lineWidth = 2 + hash(i, 11) * 3;
    ctx.beginPath();
    ctx.moveTo(x, 110);
    ctx.quadraticCurveTo(x + sway, 110 + len / 2, x + sway * 1.6, 110 + len);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = tone(p.wall, -0.35);
  ctx.fillRect(0, 0, W, 116);
  motes(ctx, t, 26, p.accent, 6, -14, 9, 21, 0.45);
}

function drawCaverns(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, tone(p.wall, -0.5)],
    [0.6, tone(p.floor, -0.1)],
    [1, tone(p.wall, -0.4)],
  ]);
  // giant mushrooms, far and near
  const caps: [number, number, number, number][] = [
    [170, 470, 120, 0.55],
    [430, 520, 80, 0.5],
    [700, 450, 160, 0.6],
    [1010, 500, 110, 0.55],
    [1180, 470, 90, 0.5],
  ];
  caps.forEach(([x, base, r, dk], i) => {
    const top = base - r * 2.2;
    fillPath(ctx, tone(p.colors[2]!, -0.7), () => ctx.roundRect(x - r * 0.18, top, r * 0.36, base - top + 60, 8));
    fillPath(ctx, tone(p.colors[0]!, -dk), () => ctx.ellipse(x, top, r, r * 0.5, 0, Math.PI, 0), OUTLINE, 3);
    fillPath(ctx, tone(p.colors[0]!, -dk - 0.15), () => ctx.ellipse(x, top, r, r * 0.16, 0, 0, Math.PI));
    const glowA = 0.55 + Math.sin(t * 1.7 + i * 2) * 0.2;
    glow(ctx, x, top - r * 0.15, r * 1.2, p.accent, 0.25 * glowA);
    for (let s = 0; s < 5; s++) {
      const a = Math.PI + (s + 0.5) * (Math.PI / 5);
      glow(ctx, x + Math.cos(a) * r * 0.65, top + Math.sin(a) * r * 0.3, 8 + r * 0.05, i % 2 ? p.accent : p.colors[3]!, glowA);
    }
  });
  // stalactites
  for (let i = 0; i < 22; i++) {
    const x = hash(i, 31) * W;
    const len = 50 + hash(i, 32) * 170;
    const w = 26 + hash(i, 33) * 40;
    fillPath(ctx, tone(p.wall, -0.45), () => {
      ctx.moveTo(x - w / 2, 0);
      ctx.lineTo(x + w / 2, 0);
      ctx.lineTo(x + hash(i, 34) * 10 - 5, len);
      ctx.closePath();
    });
  }
  ctx.fillStyle = tone(p.wall, -0.55);
  ctx.fillRect(0, 590, W, 130);
  motes(ctx, t, 34, p.accent, 4, -22, 7, 41, 0.6);
  motes(ctx, t, 14, p.colors[3]!, -3, -12, 9, 43, 0.4);
}

function drawSewers(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, tone(p.wall, -0.2)],
    [1, tone(p.wall, -0.5)],
  ]);
  // bricks
  ctx.save();
  ctx.strokeStyle = withAlpha(p.wallTop, 0.25);
  ctx.lineWidth = 2;
  for (let row = 0; row < 14; row++) {
    const y = 90 + row * 34;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    for (let c = 0; c < 22; c++) {
      const x = c * 64 + (row % 2) * 32;
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 34);
    }
    ctx.stroke();
  }
  ctx.restore();
  // the tunnel mouth
  fillPath(ctx, '#050806', () => {
    ctx.moveTo(300, 560);
    ctx.lineTo(300, 340);
    ctx.arc(640, 340, 340, Math.PI, 0);
    ctx.lineTo(980, 560);
    ctx.closePath();
  }, tone(p.colors[1]!, -0.2), 10);
  const fog = ctx.createRadialGradient(640, 420, 20, 640, 420, 320);
  fog.addColorStop(0, withAlpha(p.accent, 0.18));
  fog.addColorStop(1, withAlpha(p.accent, 0));
  ctx.fillStyle = fog;
  ctx.fillRect(300, 0, 680, 560);
  // a shaft of light through a grate
  ctx.save();
  ctx.globalAlpha = 0.07 + Math.sin(t * 0.7) * 0.02;
  fillPath(ctx, '#f4f0d0', () => {
    ctx.moveTo(560, 0);
    ctx.lineTo(640, 0);
    ctx.lineTo(760, 560);
    ctx.lineTo(560, 560);
    ctx.closePath();
  });
  ctx.restore();
  // rusty pipes and their drips
  for (const [x, y] of [
    [150, 250],
    [1130, 300],
  ] as const) {
    ctx.fillStyle = tone(p.colors[1]!, -0.25);
    ctx.fillRect(x - 160, y, 320, 34);
    ctx.fillStyle = tone(p.colors[1]!, -0.45);
    ctx.fillRect(x - 18, y - 6, 36, 46);
    for (let d = 0; d < 3; d++) {
      const k = wrap(t * 0.9 + d * 0.37 + x * 0.001, 1);
      glow(ctx, x + (d - 1) * 50, y + 40 + k * (520 - y), 6, p.accent, 0.8 * (1 - k * 0.6));
    }
  }
  // black water with ripples and the arch's reflection
  vertical(ctx, [
    [0, 'rgba(0,0,0,0)'],
    [0.77, 'rgba(0,0,0,0)'],
    [0.78, tone(p.hazard, 0.15)],
    [1, tone(p.hazard, -0.3)],
  ]);
  ctx.save();
  ctx.strokeStyle = withAlpha(p.accent, 0.25);
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const y = 576 + i * 12;
    const x = wrap(hash(i, 51) * W + t * (20 + i * 3), W + 300) - 150;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 90 + hash(i, 52) * 120, y);
    ctx.stroke();
  }
  ctx.restore();
  motes(ctx, t, 16, p.accent, 2, -6, 6, 55, 0.35);
}

function drawForest(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, tone(p.colors[1]!, -0.55)],
    [0.62, tone(p.colors[0]!, -0.35)],
    [1, tone(p.wall, -0.3)],
  ]);
  // light shafts
  ctx.save();
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.06 + 0.03 * Math.sin(t * 0.6 + i);
    const x = 140 + i * 260;
    fillPath(ctx, p.colors[2]!, () => {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 70, 0);
      ctx.lineTo(x + 260, 600);
      ctx.lineTo(x + 120, 600);
      ctx.closePath();
    });
  }
  ctx.restore();
  // the stag's lantern-heart, deep in the trees (it beats)
  const beat = Math.max(0, Math.sin(t * 5)) ** 6 * 0.4 + Math.max(0, Math.sin(t * 5 - 0.9)) ** 6 * 0.25;
  glow(ctx, 760, 430, 70 + beat * 40, p.colors[2]!, 0.35 + beat);
  glow(ctx, 760, 430, 16, '#fff3c0', 0.8);
  // hollow trunks
  for (let i = 0; i < 9; i++) {
    const x = i * 150 + hash(i, 61) * 60 - 20;
    const w = 40 + hash(i, 62) * 70;
    const col = tone(p.colors[3]!, -0.55 - hash(i, 63) * 0.2);
    fillPath(ctx, col, () => {
      ctx.moveTo(x - w * 0.6, 640);
      ctx.lineTo(x - w * 0.42, 0);
      ctx.lineTo(x + w * 0.42, 0);
      ctx.lineTo(x + w * 0.6, 640);
      ctx.closePath();
    }, OUTLINE, 3);
    if (hash(i, 64) > 0.4) fillPath(ctx, '#050403', () => ctx.ellipse(x, 300 + hash(i, 65) * 200, w * 0.22, w * 0.4, 0, 0, Math.PI * 2));
  }
  // canopy
  for (let i = 0; i < 18; i++) fillPath(ctx, tone(p.colors[1]!, -0.6), () => ctx.ellipse(i * 80, 10 + hash(i, 66) * 40, 80, 60, 0, 0, Math.PI * 2));
  ctx.fillStyle = tone(p.wall, -0.4);
  ctx.fillRect(0, 610, W, 110);
  // leaves falling upward
  for (let i = 0; i < 34; i++) {
    const k = 0.6 + hash(i, 67);
    const x = wrap(hash(i, 68) * W + Math.sin(t * 1.3 + i) * 30, W);
    const y = wrap(hash(i, 69) * (H + 60) - t * 26 * k, H + 60) - 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * (1 + hash(i, 70)) + i);
    fillPath(ctx, i % 3 ? p.colors[0]! : p.colors[2]!, () => ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2));
    ctx.restore();
  }
}

function drawForge(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, '#0a0505'],
    [0.6, tone(p.colors[0]!, -0.55)],
    [1, tone(p.colors[0]!, -0.2)],
  ]);
  // chimneys and their smoke
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 260 + hash(i, 71) * 40;
    const top = 120 + hash(i, 72) * 120;
    fillPath(ctx, '#120808', () => ctx.rect(x - 34, top, 68, 600 - top), OUTLINE, 3);
    for (let s = 0; s < 4; s++) {
      const k = wrap(t * 0.25 + s * 0.25 + i * 0.13, 1);
      fillPath(ctx, withAlpha('#2a2020', 0.5 * (1 - k)), () => ctx.arc(x + Math.sin(k * 4 + i) * 20, top - k * 160, 26 + k * 40, 0, Math.PI * 2));
    }
  }
  // chains
  ctx.save();
  ctx.strokeStyle = '#1a0e0e';
  ctx.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    const x = 80 + i * 230;
    const sway = Math.sin(t * 0.8 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + sway, 90, x + sway * 1.5, 170 + hash(i, 73) * 80);
    ctx.stroke();
  }
  ctx.restore();
  // the productivity board
  fillPath(ctx, '#1a1010', () => ctx.rect(960, 440, 250, 92), tone(p.accent, -0.3), 3);
  drawText(ctx, 'DAYS WITHOUT A BREAK', 1085, 470, { size: 15, align: 'center', weight: 'bold', color: p.colors[3]!, outline: null });
  drawText(ctx, `${74312 + Math.floor(t / 2)}`, 1085, 512, { size: 30, align: 'center', weight: 'bold', color: p.accent, mono: true, outline: null });
  // anvils
  for (const [x, s] of [
    [260, 1.2],
    [620, 0.9],
    [1120, 1.1],
  ] as const) {
    ctx.save();
    ctx.translate(x, 620);
    ctx.scale(s, s);
    fillPath(ctx, '#0e0707', () => {
      ctx.moveTo(-70, -60);
      ctx.lineTo(60, -60);
      ctx.quadraticCurveTo(100, -58, 110, -44);
      ctx.lineTo(40, -38);
      ctx.lineTo(28, -10);
      ctx.lineTo(50, 0);
      ctx.lineTo(-50, 0);
      ctx.lineTo(-28, -10);
      ctx.lineTo(-40, -38);
      ctx.lineTo(-70, -44);
      ctx.closePath();
    }, withAlpha(p.accent, 0.4), 2);
    ctx.restore();
  }
  // molten channel
  const g = ctx.createLinearGradient(0, 630, 0, H);
  g.addColorStop(0, p.colors[3]!);
  g.addColorStop(1, p.colors[0]!);
  fillPath(ctx, g, () => {
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 640 + Math.sin(x * 0.02 + t * 2) * 6);
    ctx.lineTo(W, H);
    ctx.closePath();
  });
  glow(ctx, 640, 660, 600, p.accent, 0.25);
  motes(ctx, t, 40, p.accent, 8, -60, 5, 77, 0.85);
}

function drawReliquary(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, tone(p.wall, -0.45)],
    [0.6, tone(p.colors[3]!, -0.2)],
    [1, tone(p.colors[0]!, -0.4)],
  ]);
  // tall windows of gold light
  for (let i = 0; i < 5; i++) {
    const x = 90 + i * 250;
    glow(ctx, x + 45, 300, 140, p.accent, 0.15 + 0.05 * Math.sin(t + i));
    fillPath(ctx, withAlpha(p.accent, 0.45), () => archPath(ctx, x, 90, 170, 470), tone(p.wall, -0.4), 6);
    ctx.save();
    ctx.strokeStyle = tone(p.wall, -0.4);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 45, 140);
    ctx.lineTo(x + 45, 470);
    ctx.moveTo(x, 330);
    ctx.lineTo(x + 90, 330);
    ctx.stroke();
    ctx.restore();
  }
  // pillars
  for (let i = 0; i < 6; i++) {
    const x = i * 250 - 20;
    fillPath(ctx, tone(p.colors[3]!, -0.45), () => ctx.rect(x - 32, 60, 64, 560), OUTLINE, 3);
    fillPath(ctx, tone(p.accent, -0.35), () => ctx.rect(x - 42, 60, 84, 22), OUTLINE, 2);
  }
  // the saint in her ice, far down the nave
  ctx.save();
  ctx.globalAlpha = 0.85;
  fillPath(ctx, withAlpha(p.colors[0]!, 0.35), () => ctx.rect(605, 400, 70, 130), withAlpha(p.colors[1]!, 0.6), 2);
  fillPath(ctx, tone(p.colors[3]!, -0.5), () => {
    ctx.arc(640, 430, 11, 0, Math.PI * 2);
    ctx.moveTo(624, 520);
    ctx.lineTo(628, 446);
    ctx.lineTo(652, 446);
    ctx.lineTo(656, 520);
  });
  ctx.restore();
  glow(ctx, 640, 460, 80, p.colors[0]!, 0.3);
  // ice floor
  ctx.fillStyle = withAlpha(p.colors[1]!, 0.12);
  ctx.fillRect(0, 600, W, 120);
  // snow
  for (let i = 0; i < 60; i++) {
    const k = 0.5 + hash(i, 81);
    const x = wrap(hash(i, 82) * W + Math.sin(t * 0.7 + i) * 26, W);
    const y = wrap(hash(i, 83) * H + t * 30 * k, H);
    ctx.fillStyle = withAlpha(p.colors[1]!, 0.5 + hash(i, 84) * 0.4);
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + hash(i, 85) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gearPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, teeth: number, a: number): void {
  for (let i = 0; i < teeth * 2; i++) {
    const rr = i % 2 ? r * 0.84 : r;
    const a0 = a + (i * Math.PI) / teeth;
    const a1 = a + ((i + 1) * Math.PI) / teeth;
    if (i === 0) ctx.moveTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr);
    ctx.lineTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr);
    ctx.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
  }
  ctx.closePath();
  ctx.moveTo(x + r * 0.3, y);
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2, true);
}

function drawCitadel(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  vertical(ctx, [
    [0, tone(p.colors[3]!, -0.3)],
    [0.6, tone(p.colors[2]!, -0.6)],
    [1, tone(p.colors[3]!, -0.4)],
  ]);
  const gears: [number, number, number, number, number][] = [
    [200, 260, 170, 14, 0.12],
    [470, 150, 90, 9, -0.22],
    [1060, 300, 210, 16, -0.09],
    [820, 560, 120, 11, 0.16],
    [130, 600, 100, 10, -0.18],
  ];
  gears.forEach(([x, y, r, n, sp], i) => {
    ctx.save();
    ctx.globalAlpha = 0.85;
    fillPath(ctx, tone(p.colors[0]!, -0.55 - (i % 2) * 0.1), () => gearPath(ctx, x, y, r, n, t * sp), withAlpha(p.accent, 0.35), 3);
    ctx.restore();
  });
  // the clock: the minute hand ticks, the second hand sweeps
  const cx = 640;
  const cy = 330;
  fillPath(ctx, tone(p.colors[3]!, -0.2), () => ctx.arc(cx, cy, 120, 0, Math.PI * 2), tone(p.colors[0]!, -0.1), 8);
  ctx.save();
  ctx.strokeStyle = withAlpha(p.colors[0]!, 0.9);
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.lineWidth = i % 3 ? 3 : 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96);
    ctx.lineTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110);
    ctx.stroke();
  }
  const tick = Math.floor(t);
  const minute = -Math.PI / 2 + tick * ((Math.PI * 2) / 60);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(minute) * 82, cy + Math.sin(minute) * 82);
  ctx.stroke();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  const sec = -Math.PI / 2 - t * 2.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sec) * 100, cy + Math.sin(sec) * 100);
  ctx.stroke();
  ctx.restore();
  glow(ctx, cx, cy, 160, p.accent, 0.18);
  ctx.fillStyle = tone(p.colors[3]!, -0.5);
  ctx.fillRect(0, 620, W, 100);
  motes(ctx, t, 20, p.accent, 10, -8, 6, 91, 0.6);
  motes(ctx, t, 12, p.colors[2]!, -12, 6, 7, 93, 0.5);
}

function drawAbyss(ctx: CanvasRenderingContext2D, p: Palette, t: number): void {
  ctx.fillStyle = '#030106';
  ctx.fillRect(0, 0, W, H);
  const pit = ctx.createRadialGradient(640, 520, 10, 640, 520, 520);
  pit.addColorStop(0, withAlpha(p.accent, 0.55));
  pit.addColorStop(0.4, withAlpha(p.colors[3]!, 0.5));
  pit.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pit;
  ctx.fillRect(0, 0, W, H);
  // specks
  for (let i = 0; i < 80; i++) {
    const a = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + hash(i, 101)) + i));
    ctx.fillStyle = withAlpha('#ffffff', a * 0.7);
    ctx.fillRect(hash(i, 102) * W, hash(i, 103) * H, 2, 2);
  }
  // the stairs going down into it
  const vx = 640;
  const vy = 470;
  for (let i = 0; i < 14; i++) {
    const k0 = Math.pow(0.82, i);
    const k1 = Math.pow(0.82, i + 1);
    const y0 = vy + (H - vy) * k0;
    const y1 = vy + (H - vy) * k1;
    const w0 = 360 * k0;
    const w1 = 360 * k1;
    fillPath(ctx, i % 2 ? '#0d0714' : '#120a1c', () => {
      ctx.moveTo(vx - w0, y0);
      ctx.lineTo(vx + w0, y0);
      ctx.lineTo(vx + w1, y1);
      ctx.lineTo(vx - w1, y1);
      ctx.closePath();
    }, withAlpha(p.accent, 0.35), 1.5);
  }
  // a desk at the bottom, and someone behind it
  const fx = 640;
  const fy = 452;
  fillPath(ctx, '#000', () => ctx.rect(fx - 30, fy - 6, 60, 14));
  fillPath(ctx, '#000', () => {
    ctx.rect(fx - 6, fy - 46, 12, 40);
    ctx.rect(fx - 9, fy - 64, 18, 20);
  });
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = fy - 62 + i * 3 + ((t * 30) % 3);
    ctx.moveTo(fx - 7, y);
    ctx.lineTo(fx - 7 + 14 * hash(i + Math.floor(t * 12), 104), y);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, fx + 22, fy - 12, 22, '#ffffff', 0.6);
  // every glow in the world, flowing down to him
  for (let i = 0; i < 46; i++) {
    const k = wrap(t * (0.07 + hash(i, 105) * 0.06) + hash(i, 106), 1);
    const sx = hash(i, 107) * W;
    const sy = -20 + hash(i, 108) * 120;
    const x = sx + (fx - sx) * easeIn(k);
    const y = sy + (fy - 40 - sy) * k;
    glow(ctx, x, y, 7 + (1 - k) * 8, GLOWEN, 0.25 + 0.5 * (1 - k));
  }
}

const BACKDROPS: Record<number, (ctx: CanvasRenderingContext2D, p: Palette, t: number) => void> = {
  1: drawCrypt,
  2: drawCaverns,
  3: drawSewers,
  4: drawForest,
  5: drawForge,
  6: drawReliquary,
  7: drawCitadel,
  8: drawAbyss,
};

/** One zone's drawn vignette, full screen (the zone cutscene's backdrop). */
export function drawZoneBackdrop(ctx: CanvasRenderingContext2D, zone: number, p: Palette, t: number): void {
  ctx.save();
  (BACKDROPS[zone] ?? drawCrypt)(ctx, p, t);
  if (zone !== 8) glowenMotes(ctx, t, 18, false, 0.8, zone * 11);
  if (zone !== 8) joeSilhouette(ctx, 170, 600, p.accent);
  // vignette
  const v = ctx.createRadialGradient(640, 360, 300, 640, 360, 820);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ------------------------------------------------------------------ zone entry

export interface ZoneCutSpec {
  zone: number;
  name: string;
  palette: Palette;
  lines: readonly string[];
  /** the zone's enemy mix this playthrough ("tonight's guests") */
  guests: string[];
  cycle: number;
}

/** Zone entry: letterbox, a drawn vignette in the zone's palette, the name, 2–4 typed lines. */
export class ZoneCutscene extends Cutscene {
  readonly length: number;
  private typed: TypedLine[];

  constructor(private s: ZoneCutSpec) {
    super();
    this.minSkip = 0.25;
    const sch = schedule(s.lines, 1.1);
    this.typed = sch.lines;
    this.length = sch.end + 2.4;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    const s = this.s;
    const a = this.out;
    ctx.save();
    ctx.globalAlpha = a * easeOut(t / 0.6);
    drawZoneBackdrop(ctx, s.zone, s.palette, t);
    // soft dark bands behind the name and the lines, so text reads over any vignette
    const band = (y0: number, y1: number, k: number): void => {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.25, `rgba(0,0,0,${k})`);
      g.addColorStop(0.75, `rgba(0,0,0,${k})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y0, W, y1 - y0);
    };
    band(110, 270, 0.35);
    band(282, 330 + this.typed.length * 46, 0.5);
    ctx.restore();
    const ta = a * easeOut((t - 0.35) / 0.5);
    const label = `ZONE ${s.zone} OF 8${s.cycle > 0 ? ` · CYCLE ${s.cycle + 1}` : ''}`;
    drawText(ctx, label.split('').join(' '), W / 2, 150, { size: 15, align: 'center', weight: 'bold', color: s.palette.accent, alpha: ta, outline: 'rgba(0,0,0,0.8)' });
    const slide = (1 - easeOut((t - 0.35) / 0.6)) * 30;
    drawText(ctx, s.name.toUpperCase(), W / 2, 222 + slide, { size: 68, align: 'center', weight: 'bold', color: s.palette.accent, alpha: ta, outline: '#000', outlineWidth: 10 });
    ctx.save();
    ctx.globalAlpha = ta * 0.7;
    ctx.fillStyle = s.palette.accent;
    const rw = 300 * easeOut((t - 0.6) / 0.6);
    ctx.fillRect(W / 2 - rw, 250, rw * 2, 2);
    ctx.restore();
    drawTyped(ctx, this.typed, t, 330, 46, 23, a);
    bars(ctx, Math.min(t / 0.35, a));
    const ba = a * easeOut((t - 0.8) / 0.5);
    if (s.guests.length) drawText(ctx, `Tonight’s guests: ${s.guests.join(' · ')}`, W / 2, H - BAR / 2 + 5, { size: 15, align: 'center', color: INK, alpha: ba * 0.85, outline: null, maxWidth: 900 });
    skipHint(ctx, ba);
  }
}

/** A bonfire line under the bonfire menu's panel (DOM; the menu layer is a full-screen flex box). */
export function restLine(text: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'rest-line';
  el.textContent = text;
  el.setAttribute('style', 'position:absolute;left:0;right:0;bottom:8px;text-align:center;font-style:italic;font-size:15px;color:#e6d08a;pointer-events:none;text-shadow:0 2px 0 #000');
  return el;
}

/** The plain zone title card (D57) for a zone already introduced: name, enemy mix, tagline. */
export function drawZoneTitleCard(ctx: CanvasRenderingContext2D, name: string, accent: string, names: string[], tagline: string, left: number, total: number): void {
  const k = Math.max(0, Math.min(1, left / 0.6, (total - left) / 0.4));
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 250, W, 150);
  ctx.restore();
  drawText(ctx, name.toUpperCase(), 640, 320, { size: 52, align: 'center', weight: 'bold', alpha: k, color: accent });
  drawText(ctx, names.join(' · '), 640, 356, { size: 16, align: 'center', alpha: k, color: INK });
  drawText(ctx, tagline, 640, 384, { size: 14, align: 'center', alpha: k * 0.8, color: DIM });
}

// ------------------------------------------------------------------ boss intro (and the Instructor's card)

export interface BossIntroSpec {
  /** big letters: BossDef.introTitle */
  title: string;
  /** the funny line beneath: BossDef.introSub */
  sub: string;
  /** small tag above the name ("BOSS 3 OF 8 · DROWNED SEWERS") */
  label: string;
  /** panel colours: the boss palette ([0] main, [1] accent) */
  colors: string[];
  /** the boss in the world (drawn with its own draw function); may be null on a guest that lost it */
  entity: () => Entity | null;
  /** zone palette colours for draws that use them */
  pal: string[];
  /** where the boss stands if its entity is gone */
  at: [number, number];
  /** storm in and roar first (≈4 s); false = only the freeze-frame (≈2 s, repeat attempts, the Instructor) */
  full: boolean;
}

const ROAR_CACHE = new Map<string, string>();

/**
 * The pose a draw function uses for the roar: 'roar' when it draws one (the boss-art pass adds it), else
 * 'attack'. Tested once per draw id by drawing both poses offscreen and comparing pixels with 'idle'.
 */
function roarPose(drawId: string, base: DrawState): string {
  const hit = ROAR_CACHE.get(drawId);
  if (hit) return hit;
  let pose = 'roar';
  try {
    const { ctx } = offscreen(160, 160);
    const k = 50 / Math.max(10, base.r);
    const shot = (p: string): Uint8ClampedArray => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 160, 160);
      ctx.translate(80, 80);
      ctx.scale(k, k);
      drawById(ctx, drawId, { ...base, x: 0, y: 0, pose: p, poseT: 0.6, t: 1, flash: false, tint: null, alpha: 1, squash: 0 });
      return ctx.getImageData(0, 0, 160, 160).data;
    };
    const a = shot('idle');
    const b = shot('roar');
    let diff = 0;
    for (let i = 3; i < a.length; i += 4) if (Math.abs(a[i]! - b[i]!) > 8 || Math.abs(a[i - 1]! - b[i - 1]!) > 24) diff++;
    if (diff < 12) pose = 'attack';
  } catch {
    pose = 'roar';
  }
  ROAR_CACHE.set(drawId, pose);
  return pose;
}

/** Split "VEXTHORN, THE HOLLOW STAG" into a big name and a smaller epithet. */
function splitTitle(title: string): [string, string] {
  const comma = title.indexOf(', ');
  if (comma > 0) return [title.slice(0, comma), title.slice(comma + 2)];
  const the = title.indexOf(' THE ');
  if (the > 0) return [title.slice(0, the), title.slice(the + 1)];
  return [title, ''];
}

const BIG_FONT = `"Arial Black", "Segoe UI Black", ${FONT}`;

/** Huge stylised letters: drop shadow, heavy outline, gradient fill, fitted to maxW. */
function bigLetters(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxSize: number, maxW: number, light: string, color: string): number {
  let size = maxSize;
  ctx.font = `italic 900 ${size}px ${BIG_FONT}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) {
    size = Math.max(28, Math.floor((size * maxW) / w));
    ctx.font = `italic 900 ${size}px ${BIG_FONT}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillText(text, x + size * 0.07, y + size * 0.08);
  ctx.lineWidth = Math.max(6, size * 0.16);
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y);
  g.addColorStop(0, light);
  g.addColorStop(0.55, light);
  g.addColorStop(0.56, color);
  g.addColorStop(1, tone(color, -0.25));
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  return size;
}

export class BossIntroCutscene extends Cutscene {
  readonly length: number;
  /** when the freeze-frame starts */
  private readonly f0: number;
  private slammed = false;
  private pose = '';

  constructor(private s: BossIntroSpec) {
    super();
    this.f0 = s.full ? 1.6 : 0;
    // D102: the name card holds 50% longer than it used to (freeze-frame 2.15 s → 3.25 s; short 2 s → 3 s)
    this.length = s.full ? 4.85 : 3.0;
    this.minSkip = s.full ? 0.5 : 0.3;
  }

  private bossPos(): [number, number] {
    const e = this.s.entity();
    return e && !e.removed ? [e.x, e.y] : this.s.at;
  }

  override camera(shake: number): CutCamera | null {
    if (!this.s.full) return null;
    const t = this.t;
    const zoom = 1 + 0.9 * easeOut(t / 0.45);
    const [bx, by] = this.bossPos();
    // impact shake at the landing, rumble through the roar
    const amp = t < this.f0 ? shake * ((t > 0.4 ? 14 * Math.max(0, 1 - (t - 0.4) / 0.35) : 0) + (t > 0.45 ? 5 : 0)) : 0;
    const jx = Math.sin(t * 61) * amp + Math.sin(t * 37) * amp * 0.5;
    const jy = Math.cos(t * 53) * amp * 0.8;
    const hw = 640 / zoom;
    const hh = 360 / zoom;
    return { x: Math.max(hw, Math.min(W - hw, bx)) + jx / zoom, y: Math.max(hh, Math.min(H - hh, by - 20)) + jy / zoom, zoom };
  }

  private state(e: Entity | null, now: number): { id: string; st: DrawState } | null {
    if (!e?.en) return null;
    const st = enemyDrawState(e, 0, 0, now, this.s.pal);
    return { id: e.drawId, st };
  }

  draw(ctx: CanvasRenderingContext2D, o: CutDrawOpts): void {
    const t = this.t;
    const a = this.out;
    const e = this.s.entity();
    const ds = this.state(e, t);
    if (ds && !this.pose) this.pose = roarPose(ds.id, ds.st);
    const c0 = this.s.colors[0] ?? '#8a1a1a';
    const c1 = this.s.colors[1] ?? '#e6b84a';
    if (this.s.full && t < this.f0 + 0.1) this.drawStorm(ctx, o, ds, c0, c1, a);
    if (t >= this.f0) this.drawFreeze(ctx, ds, c0, c1, a);
    // the cut: a white flash between the roar and the freeze-frame
    if (this.s.full && t > this.f0 - 0.08 && t < this.f0 + 0.2) {
      const k = 1 - Math.abs(t - this.f0) / 0.2;
      ctx.fillStyle = `rgba(255,252,240,${clamp01(k) * 0.9 * a})`;
      ctx.fillRect(0, 0, W, H);
    }
    bars(ctx, Math.min(this.s.full ? t / 0.3 : 1, a));
    skipHint(ctx, a * (t > this.minSkip ? 1 : 0));
    if (t >= this.f0 + 0.05 && !this.slammed) {
      this.slammed = true;
      playSfx('explosion', { vol: 0.45, rate: 1.35 });
    }
  }

  /** The boss storms in and roars, the camera punched in on it. */
  private drawStorm(ctx: CanvasRenderingContext2D, o: CutDrawOpts, ds: { id: string; st: DrawState } | null, c0: string, c1: string, a: number): void {
    const t = this.t;
    const cam = o.cam ?? { x: 640, y: 360, zoom: 1 };
    const [bx, by] = this.bossPos();
    const sx = (bx - cam.x) * cam.zoom + 640;
    const sy = (by - cam.y) * cam.zoom + 360;
    ctx.save();
    ctx.globalAlpha = a;
    // the room darkens around it
    const v = ctx.createRadialGradient(sx, sy, 60, sx, sy, 700);
    v.addColorStop(0, 'rgba(0,0,0,0.1)');
    v.addColorStop(1, `rgba(0,0,0,${0.75 * easeOut(t / 0.4)})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    // speed lines radiating from it
    if (t > 0.4) {
      ctx.save();
      ctx.strokeStyle = withAlpha(c1, 0.25);
      ctx.lineWidth = 3;
      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2 + hash(i, 5) * 0.1;
        const r0 = 160 + hash(i, 6) * 80 + ((t * 900 + i * 37) % 220);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(ang) * r0, sy + Math.sin(ang) * r0);
        ctx.lineTo(sx + Math.cos(ang) * (r0 + 70 + hash(i, 7) * 60), sy + Math.sin(ang) * (r0 + 70 + hash(i, 7) * 60));
        ctx.stroke();
      }
      ctx.restore();
    }
    // the roar's shockwaves
    if (t > 0.42) {
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const k = (t - 0.42 - i * 0.2) / 0.55;
        if (k < 0 || k > 1) continue;
        ctx.strokeStyle = withAlpha(i % 2 ? c1 : '#ffffff', 0.7 * (1 - k));
        ctx.lineWidth = 10 * (1 - k) + 2;
        ctx.beginPath();
        ctx.arc(sx, sy - 20, 60 + k * 420, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    glow(ctx, sx, sy, 260 * cam.zoom * 0.6, c0, 0.55 + Math.sin(t * 18) * 0.12);
    // it drops in, lands, then roars
    const land = easeIn(t / 0.4);
    const drop = (1 - land) * -140;
    const scale = cam.zoom * (1.35 - 0.35 * land);
    const squash = t < 0.4 ? 0.6 : t < 0.55 ? -1 + (t - 0.4) / 0.15 : 0.35 + Math.sin(t * 30) * 0.15;
    if (t > 0.38 && t < 0.75) {
      // dust ring at the landing
      const k = (t - 0.38) / 0.37;
      ctx.fillStyle = withAlpha('#8a7a6a', 0.45 * (1 - k));
      ctx.beginPath();
      ctx.ellipse(sx, sy + 10, 60 + k * 220, 18 + k * 50, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ds) {
      ctx.save();
      ctx.translate(sx, sy + drop);
      ctx.scale(scale, scale);
      const roaring = t >= 0.4;
      drawById(ctx, ds.id, { ...ds.st, x: 0, y: 0, facing: Math.PI / 2, t, alpha: Math.min(1, t / 0.15), flash: t > 0.4 && t < 0.47, tint: null, squash, pose: roaring ? this.pose : 'windup', poseT: roaring ? t - 0.4 : t });
      ctx.restore();
    }
    ctx.restore();
  }

  /** The freeze-frame: a slanted panel, the boss in its pose, the name in huge letters, the line beneath. */
  private drawFreeze(ctx: CanvasRenderingContext2D, ds: { id: string; st: DrawState } | null, c0: string, c1: string, a: number): void {
    const t = this.t - this.f0;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(6,4,10,0.72)';
    ctx.fillRect(0, 0, W, H);
    // the slanted colour panel slides in from the left
    const slide = (1 - easeOut(t / 0.2)) * -W;
    ctx.save();
    ctx.translate(640 + slide, 380);
    ctx.rotate(-0.12);
    const pw = 1700;
    const ph = 300;
    const g = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
    g.addColorStop(0, tone(c0, -0.35));
    g.addColorStop(0.45, c0);
    g.addColorStop(1, tone(c0, -0.55));
    ctx.fillStyle = g;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    // diagonal hatching that keeps moving under the freeze
    ctx.save();
    ctx.beginPath();
    ctx.rect(-pw / 2, -ph / 2, pw, ph);
    ctx.clip();
    ctx.strokeStyle = withAlpha('#000000', 0.16);
    ctx.lineWidth = 14;
    const off = (this.t * 60) % 48;
    for (let x = -pw / 2 - 400; x < pw / 2 + 400; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x + off, -ph / 2);
      ctx.lineTo(x + off - 160, ph / 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-pw / 2, -ph / 2 - 10, pw, 12);
    ctx.fillRect(-pw / 2, ph / 2 - 2, pw, 12);
    ctx.fillStyle = c1;
    ctx.fillRect(-pw / 2, -ph / 2 - 22, pw, 6);
    ctx.fillRect(-pw / 2, ph / 2 + 16, pw, 6);
    ctx.restore();
    // the boss in its pose, bursting out of the panel
    const px = 330;
    const py = 420;
    const pop = easeOut((t - 0.05) / 0.22);
    glow(ctx, px, py - 30, 260, c1, 0.35 * pop);
    if (ds) {
      const k = Math.max(1.4, Math.min(4.2, 125 / Math.max(12, ds.st.r))) * (0.85 + 0.15 * pop);
      ctx.save();
      ctx.globalAlpha = a * pop;
      ctx.translate(px - (1 - pop) * 120, py);
      ctx.scale(k, k);
      drawById(ctx, ds.id, { ...ds.st, x: 0, y: 0, facing: Math.PI / 2 + 0.25, t: 1.3, flash: false, tint: null, alpha: 1, squash: 0.35, pose: this.pose || 'attack', poseT: 0.6 });
      ctx.restore();
    }
    // the name, slammed in
    const [name, epithet] = splitTitle(this.s.title);
    const nk = clamp01((t - 0.08) / 0.16);
    if (nk > 0) {
      const sc = 1 + (1 - easeOut(nk)) * 1.3;
      ctx.save();
      ctx.globalAlpha = a * nk;
      ctx.translate(830, epithet ? 352 : 374);
      ctx.rotate(-0.1);
      ctx.scale(sc, sc);
      drawText(ctx, this.s.label.split('').join(' '), -300, -88, { size: 16, weight: 'bold', color: c1, outline: '#000', outlineWidth: 5 });
      const size = bigLetters(ctx, name, 0, 0, 104, 640, '#ffffff', c1);
      if (epithet) bigLetters(ctx, epithet, 0, Math.min(70, size * 0.75), 52, 600, '#ffffff', c1);
      ctx.restore();
    }
    // the line beneath
    const sk = clamp01((t - 0.35) / 0.3);
    if (sk > 0) {
      ctx.save();
      ctx.translate(830 + (1 - easeOut(sk)) * 40, epithet ? 478 : 452);
      ctx.rotate(-0.1);
      drawText(ctx, this.s.sub, 0, 0, { size: 23, align: 'center', color: INK, alpha: a * sk, outline: '#000', outlineWidth: 5, maxWidth: 760 });
      ctx.restore();
    }
    ctx.restore();
  }
}

/** A panel colour that reads under huge letters: very dark or very light boss colours are pulled to the middle. */
function panelColor(c0: string, c1: string): string {
  const [r, g, b] = hexToRgb(c0);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.18) return mix(c0, c1, 0.42);
  if (lum > 0.55) return tone(c0, -0.5);
  return c0;
}

/** The intro for a zone's boss: "BOSS 3 OF 8 · DROWNED SEWERS", its title and its line. */
export function bossIntroCut(def: BossDef, zone: number, zoneName: string, entity: () => Entity | null, pal: string[], full: boolean): BossIntroCutscene {
  const c0 = def.palette?.[0] ?? pal[0] ?? '#5a2a2a';
  const c1 = def.palette?.[1] ?? pal[1] ?? '#e6b84a';
  return new BossIntroCutscene({ title: def.introTitle, sub: def.introSub, label: `BOSS ${zone} OF 8 · ${zoneName.toUpperCase()}`, colors: [panelColor(c0, c1), c1], entity, pal, at: [640, 300], full });
}

/** The Instructor's lighter card (no storm-in): his own room off the Training Hall. */
export function instructorCut(entity: () => Entity | null, pal: string[]): BossIntroCutscene {
  return new BossIntroCutscene({ title: INSTRUCTOR_INTRO.title, sub: INSTRUCTOR_INTRO.sub, label: INSTRUCTOR_INTRO.label, colors: ['#3a4a6a', '#ffcf6a'], entity, pal, at: [640, 260], full: false });
}

/** The defeat lines for a zone's boss (The Landlord's lead into the credits). */
export function defeatCut(def: BossDef, zone: number): DefeatCutscene {
  return new DefeatCutscene({ name: def.name, label: zone === 8 ? 'LEASE TERMINATED' : `BOSS ${zone} OF 8 DEFEATED`, color: def.palette?.[1] ?? '#e6b84a', lines: BOSS_DEFEAT[def.id] ?? [] });
}

/** The old 1.5 s boss name card, for test panes with cutscenes off. */
export function drawBossNameCard(ctx: CanvasRenderingContext2D, title: string, sub: string, color: string, left: number, total: number): void {
  const k = Math.max(0, Math.min(1, left / 0.6, (total - left) / 0.3));
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  const g = ctx.createLinearGradient(0, 230, 0, 420);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.7)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 230, W, 190);
  ctx.restore();
  drawText(ctx, title, 640, 330, { size: 60, align: 'center', weight: 'bold', alpha: k, color });
  drawText(ctx, sub, 640, 366, { size: 17, align: 'center', alpha: k * 0.9, color: INK });
}

// ------------------------------------------------------------------ boss defeat

export interface DefeatSpec {
  name: string;
  /** small tag above the name ("BOSS 3 OF 8 DEFEATED", "LEASE TERMINATED") */
  label: string;
  color: string;
  lines: readonly string[];
}

/** Boss defeat: letterbox, the name crossed off, 2–3 typed lines, Glowen rising out of the arena. */
export class DefeatCutscene extends Cutscene {
  readonly length: number;
  private typed: TypedLine[];

  constructor(private s: DefeatSpec) {
    super();
    const sch = schedule(s.lines, 1.15);
    this.typed = sch.lines;
    this.length = sch.end + 2.3;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    const a = this.out;
    const s = this.s;
    ctx.save();
    ctx.globalAlpha = a * easeOut(t / 0.5);
    ctx.fillStyle = 'rgba(4,3,8,0.68)';
    ctx.fillRect(0, 0, W, H);
    glowenMotes(ctx, t, 40, true, 1, 3);
    ctx.restore();
    const ha = a * easeOut((t - 0.2) / 0.4);
    drawText(ctx, s.label.split('').join(' '), W / 2, 196, { size: 16, align: 'center', weight: 'bold', color: DIM, alpha: ha, outline: '#000' });
    ctx.save();
    ctx.font = `bold 54px ${FONT}`;
    const nw = Math.min(1100, ctx.measureText(s.name).width);
    ctx.restore();
    drawText(ctx, s.name, W / 2, 258, { size: 54, align: 'center', weight: 'bold', color: s.color, alpha: ha, outline: '#000', outlineWidth: 8, maxWidth: 1100 });
    // crossed off the list
    const sk = easeOut((t - 0.6) / 0.25);
    if (sk > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(W / 2 - nw / 2 - 16, 246);
      ctx.lineTo(W / 2 - nw / 2 - 16 + (nw + 32) * sk, 236);
      ctx.stroke();
      ctx.strokeStyle = '#d8202a';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();
    }
    drawTyped(ctx, this.typed, t, 350, 50, 24, a);
    bars(ctx, Math.min(t / 0.35, a));
    skipHint(ctx, a * easeOut((t - 0.5) / 0.4));
  }
}
