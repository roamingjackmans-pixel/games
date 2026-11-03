// Moving floors (D68, D90): Tock's brass ring and the rings and conveyor belts boss phases start. Each is drawn
// on the floor under everything else, with stripes and chevrons that travel in the direction it carries you.
import { withAlpha } from '../engine/draw/parts';
import { movingFloors } from '../game/systems/movingFloor';
import type { Room } from '../game/room';
import type { MovingFloorDef, MovingFloorLook } from '../game/types';

interface Look {
  base: string;
  rim: string;
  arrow: string;
}

const LOOKS: Record<MovingFloorLook, Look> = {
  brass: { base: '#b08d3c', rim: '#d4b060', arrow: '#f0d890' },
  water: { base: '#2a7a8a', rim: '#7ad0e0', arrow: '#c8f4ff' },
  ice: { base: '#9ad0ff', rim: '#e0f4ff', arrow: '#ffffff' },
  roots: { base: '#5a3a1a', rim: '#9a7a3a', arrow: '#d8b070' },
  forge: { base: '#4a4448', rim: '#ff7a1a', arrow: '#ffd27a' },
};

/** A chevron pointing along +x, centred on the origin, `s` px long. */
function chevron(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  ctx.moveTo(-s * 0.35, -s * 0.5);
  ctx.lineTo(s * 0.25, 0);
  ctx.lineTo(-s * 0.35, s * 0.5);
  ctx.stroke();
}

function drawRing(ctx: CanvasRenderingContext2D, f: Extract<MovingFloorDef, { kind: 'ring' }>, now: number, look: Look): void {
  const mid = (f.rIn + f.rOut) / 2;
  const band = f.rOut - f.rIn;
  ctx.save();
  // the band, then dashes that travel with the floor (speed is px/s along the ring)
  ctx.strokeStyle = withAlpha(look.base, 0.28);
  ctx.lineWidth = band;
  ctx.beginPath();
  ctx.arc(f.x, f.y, mid, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(look.base, 0.5);
  ctx.setLineDash([18, 14]);
  ctx.lineDashOffset = -now * f.speed;
  ctx.stroke();
  ctx.setLineDash([]);
  // chevrons riding round at the floor's speed, pointing the way it turns
  const dir = f.speed >= 0 ? 1 : -1;
  const n = Math.max(6, Math.round((Math.PI * 2 * mid) / 90));
  const turn = (now * f.speed) / Math.max(40, mid);
  ctx.strokeStyle = withAlpha(look.arrow, 0.75);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(f.x + Math.cos(a) * mid, f.y + Math.sin(a) * mid);
    // the tangent of a clockwise (screen) turn is a + 90°
    ctx.rotate(a + (dir * Math.PI) / 2);
    chevron(ctx, Math.min(30, band * 0.4));
    ctx.restore();
  }
  // rims mark where the moving floor starts and ends
  ctx.lineWidth = 4;
  ctx.strokeStyle = withAlpha(look.rim, 0.8);
  for (const rr of [f.rIn, f.rOut]) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBelt(ctx: CanvasRenderingContext2D, f: Extract<MovingFloorDef, { kind: 'belt' }>, now: number, look: Look): void {
  const horiz = f.dir === 'e' || f.dir === 'w';
  const sign = f.dir === 'e' || f.dir === 's' ? 1 : -1;
  const len = horiz ? f.w : f.h;
  const across = horiz ? f.h : f.w;
  ctx.save();
  ctx.beginPath();
  ctx.rect(f.x, f.y, f.w, f.h);
  ctx.clip();
  ctx.fillStyle = withAlpha(look.base, 0.4);
  ctx.fillRect(f.x, f.y, f.w, f.h);
  // work in belt space: +u along the travel direction, v across it
  ctx.translate(f.x + f.w / 2, f.y + f.h / 2);
  ctx.rotate(horiz ? (sign > 0 ? 0 : Math.PI) : sign > 0 ? Math.PI / 2 : -Math.PI / 2);
  const gap = 44;
  const off = (((now * f.speed) % gap) + gap) % gap;
  // slats across the belt
  ctx.strokeStyle = withAlpha('#000000', 0.25);
  ctx.lineWidth = 3;
  for (let u = -len / 2 - gap + off; u < len / 2 + gap; u += gap / 2) {
    ctx.beginPath();
    ctx.moveTo(u, -across / 2);
    ctx.lineTo(u, across / 2);
    ctx.stroke();
  }
  // rows of chevrons travelling with it
  ctx.strokeStyle = withAlpha(look.arrow, 0.7);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const rows = Math.max(1, Math.floor(across / 40));
  const s = Math.min(26, (across / rows) * 0.7);
  for (let r = 0; r < rows; r++) {
    const v = -across / 2 + (across / rows) * (r + 0.5);
    for (let u = -len / 2 - gap + off; u < len / 2 + gap; u += gap) {
      ctx.save();
      ctx.translate(u, v);
      chevron(ctx, s);
      ctx.restore();
    }
  }
  ctx.restore();
  // rails along the long edges
  ctx.save();
  ctx.strokeStyle = withAlpha(look.rim, 0.85);
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (horiz) {
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x + f.w, f.y);
    ctx.moveTo(f.x, f.y + f.h);
    ctx.lineTo(f.x + f.w, f.y + f.h);
  } else {
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x, f.y + f.h);
    ctx.moveTo(f.x + f.w, f.y);
    ctx.lineTo(f.x + f.w, f.y + f.h);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draw every moving floor in the room (call after the floor tiles, before hazards and bodies). */
export function drawMovingFloors(ctx: CanvasRenderingContext2D, room: Room, now: number): void {
  for (const f of movingFloors(room)) {
    const look = LOOKS[f.look];
    if (f.kind === 'ring') drawRing(ctx, f, now, look);
    else drawBelt(ctx, f, now, look);
  }
}
