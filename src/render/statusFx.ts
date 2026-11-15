// Status effects on enemies (D374): while a status runs on an enemy, a small but clear animation plays on it for as
// long as it lasts, drawn in code over the body: Burn little flames licking up round its feet, Chill frost crystals
// and a pale rim, Shock jagged arcs that jump across it, Bleed a splash of blood with drops flying off, Poison green
// bubbles rising and popping; Freeze a block of ice round the whole body, Root vines round its feet. Time-driven and
// cosmetic only (never part of the simulation).
import { withAlpha } from '../engine/draw/parts';
import type { Entity } from '../game/world';

/** a stable per-enemy phase so a group of burning enemies does not flicker in step */
const phaseOf = (e: Entity): number => ((e.id * 0.6180339) % 1) * Math.PI * 2;

export function drawStatusFx(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number): void {
  const st = e.st;
  if (!st || e.hp?.dead || e.removed) return;
  const r = Math.max(10, e.radius);
  const ph = phaseOf(e);
  ctx.save();
  if (st.active.burn > now) burn(ctx, x, y, r, now, ph);
  if (st.active.poison > now) poison(ctx, x, y, r, now, ph);
  if (st.active.chill > now) chill(ctx, x, y, r, now, ph);
  if (st.active.bleed > now) bleed(ctx, x, y, r, now, ph, st.active.bleed);
  if (st.active.shock > now) shock(ctx, x, y, r, now, ph);
  if (st.controls.root > now) root(ctx, x, y, r, now);
  if (st.controls.freeze > now) freeze(ctx, x, y, r, now);
  ctx.restore();
}

function flame(ctx: CanvasRenderingContext2D, fx: number, fy: number, h: number, w: number, lean: number): void {
  ctx.beginPath();
  ctx.moveTo(fx - w, fy);
  ctx.quadraticCurveTo(fx - w * 0.9, fy - h * 0.55, fx + lean, fy - h);
  ctx.quadraticCurveTo(fx + w * 0.9, fy - h * 0.55, fx + w, fy);
  ctx.closePath();
  ctx.fill();
}

function burn(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, ph: number): void {
  const n = r > 30 ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const a = ph + (i / n) * Math.PI * 2 + t * 0.6;
    const fx = x + Math.cos(a) * r * 0.75;
    const fy = y + Math.sin(a) * r * 0.35 + r * 0.25;
    const k = 0.75 + 0.25 * Math.sin(t * 13 + i * 2.1 + ph);
    const h = r * 0.75 * k;
    const lean = Math.sin(t * 7 + i) * r * 0.12;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ff5a10';
    flame(ctx, fx, fy, h, r * 0.2, lean);
    ctx.fillStyle = '#ffb030';
    flame(ctx, fx, fy, h * 0.65, r * 0.12, lean * 0.7);
    ctx.fillStyle = '#fff2a0';
    flame(ctx, fx, fy, h * 0.3, r * 0.06, lean * 0.4);
  }
  // an ember or two rising off it
  for (let i = 0; i < 2; i++) {
    const p = (t * 0.9 + i * 0.5 + ph) % 1;
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(x + Math.sin(ph + i * 3 + p * 4) * r * 0.6, y - r * 0.2 - p * r * 1.4, 2, 2);
  }
}

function chill(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, ph: number): void {
  // a pale frost rim on the body
  ctx.globalAlpha = 0.45 + 0.1 * Math.sin(t * 3 + ph);
  ctx.strokeStyle = '#d8f0ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.95, Math.PI * 0.95, Math.PI * 2.05);
  ctx.stroke();
  // ice crystals round its feet, slowly turning, glinting in turn
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a = ph + (i / n) * Math.PI * 2 + t * 0.25;
    const cx = x + Math.cos(a) * r * 0.9;
    const cy = y + Math.sin(a) * r * 0.45 + r * 0.2;
    const s = r * 0.28;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#bfe4ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.35, cy - s * 0.2);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.3);
    ctx.lineTo(cx - s * 0.2, cy + s * 0.3);
    ctx.lineTo(cx - s * 0.35, cy - s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const glint = Math.max(0, Math.sin(t * 4 + i * 1.7 + ph));
    if (glint > 0.85) {
      ctx.globalAlpha = (glint - 0.85) * 6;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - s * 0.4);
      ctx.lineTo(cx + 4, cy - s * 0.4);
      ctx.moveTo(cx, cy - s * 0.4 - 4);
      ctx.lineTo(cx, cy - s * 0.4 + 4);
      ctx.stroke();
    }
  }
}

function shock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, ph: number): void {
  // two or three jagged arcs, a new shape every 70 ms
  const step = Math.floor(t / 0.07);
  const rnd = (k: number): number => {
    const s = Math.sin(step * 12.9898 + k * 78.233 + ph * 3.1) * 43758.5453;
    return s - Math.floor(s);
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    if (rnd(i * 7) < 0.25) continue;
    const a0 = rnd(i * 7 + 1) * Math.PI * 2;
    const a1 = a0 + Math.PI * (0.6 + rnd(i * 7 + 2) * 0.8);
    const x0 = x + Math.cos(a0) * r * 0.9;
    const y0 = y + Math.sin(a0) * r * 0.9;
    const x1 = x + Math.cos(a1) * r * 0.9;
    const y1 = y + Math.sin(a1) * r * 0.9;
    const pts: [number, number][] = [[x0, y0]];
    for (let k = 1; k < 5; k++) {
      const f = k / 5;
      pts.push([x0 + (x1 - x0) * f + (rnd(i * 7 + k + 3) - 0.5) * r * 0.7, y0 + (y1 - y0) * f + (rnd(i * 7 + k + 9) - 0.5) * r * 0.7]);
    }
    pts.push([x1, y1]);
    for (const [w, c, a] of [
      [5, '#ffe14a', 0.35],
      [2, '#fffbe0', 1],
    ] as const) {
      ctx.globalAlpha = a;
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
  }
}

function bleed(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, ph: number, until: number): void {
  // a splash that bursts out over the bleed's run (it goes off as a short burst), drops flying and falling
  const left = Math.max(0, until - t);
  const p = 1 - Math.min(1, left / 0.5);
  const n = 7;
  ctx.fillStyle = '#b01828';
  for (let i = 0; i < n; i++) {
    const a = ph + (i / n) * Math.PI * 2 + Math.sin(i * 3.7) * 0.4;
    const d = r * (0.3 + p * (0.9 + 0.4 * Math.sin(i * 5.1)));
    const dx = x + Math.cos(a) * d;
    const dy = y - r * 0.2 + Math.sin(a) * d * 0.7 + p * p * r * 0.8;
    const s = Math.max(1.2, r * 0.13 * (1 - p * 0.6));
    ctx.globalAlpha = 1 - p * 0.7;
    ctx.beginPath();
    ctx.ellipse(dx, dy, s, s * 1.3, a, 0, Math.PI * 2);
    ctx.fill();
  }
  // the gash's splat on the body
  ctx.globalAlpha = 0.85 * (1 - p * 0.5);
  ctx.fillStyle = '#8a0f1c';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const rr = r * (0.22 + (i % 2 ? 0.08 : 0.2)) * (0.8 + p * 0.4);
    const px = x + Math.cos(a) * rr;
    const py = y - r * 0.15 + Math.sin(a) * rr;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function poison(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, ph: number): void {
  // a sickly green haze at the feet and bubbles rising off the body, popping at the top
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#5aa02a';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.55, r * 1.05, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.7 + i * 0.25 + ph * 0.1) % 1;
    const bx = x + Math.sin(i * 2.4 + ph) * r * 0.6 + Math.sin(t * 3 + i) * 2;
    const by = y + r * 0.3 - p * r * 1.5;
    const s = r * (0.1 + 0.08 * Math.sin(i * 1.3 + 1));
    if (p > 0.88) {
      // popping
      ctx.globalAlpha = (1 - p) * 8;
      ctx.strokeStyle = '#b8f070';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, s * (1 + (p - 0.88) * 10), 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = withAlpha('#7ad040', 0.75);
    ctx.strokeStyle = '#c8ff8a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(bx - s * 0.4, by - s * 0.5, 1.5, 1.5);
  }
}

function freeze(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  // a block of ice round the whole body
  const w = r * 2.3;
  const h = r * 2.5;
  const x0 = x - w / 2;
  const y0 = y - h * 0.62;
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#9ad8ff';
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.12, y0);
  ctx.lineTo(x0 + w * 0.9, y0 + h * 0.04);
  ctx.lineTo(x0 + w, y0 + h * 0.75);
  ctx.lineTo(x0 + w * 0.82, y0 + h);
  ctx.lineTo(x0 + w * 0.06, y0 + h * 0.95);
  ctx.lineTo(x0, y0 + h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#eaf8ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // a moving shine
  const s = (t * 0.5) % 1;
  ctx.globalAlpha = 0.5 * Math.sin(s * Math.PI);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 + w * (0.1 + s * 0.6), y0 + h * 0.1);
  ctx.lineTo(x0 + w * (0.05 + s * 0.6), y0 + h * 0.4);
  ctx.stroke();
}

function root(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
  // vines wound round its feet
  ctx.strokeStyle = '#4a7a2a';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.95;
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * Math.PI * 2 + Math.sin(t * 2 + i) * 0.1;
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.45, r * (0.75 + i * 0.12), r * 0.28, 0, a0, a0 + Math.PI * 1.3);
    ctx.stroke();
  }
  ctx.fillStyle = '#7ab040';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.85, y + r * 0.45 + Math.sin(a) * r * 0.3, 4, 2, a, 0, Math.PI * 2);
    ctx.fill();
  }
}
