// Spell buff icons by the HP bar (D373): one icon a self-buff spell while its buff lasts (Haste, Ward of Steel and
// Fortify Thermos on at once: three icons), each drawn in code, with a ring that drains as its time runs out. A timed
// buff's icon goes when it ends; Fortify Thermos's also when the Thermos is drunk (its buff is used up).
import { hudSpellIcons } from '../game/combat/spellBuffs';
import { drawText } from '../engine/text';
import type { Entity, World } from '../game/world';

export const BUFF_ICON = 24;

/** The colour each spell's icon is framed in (unknown spells: gold). */
const RIM: Record<string, string> = {
  ward_of_steel: '#b8c8dc',
  stone_skin: '#c09a6a',
  haste: '#9cff6a',
  bless_weapon: '#ffe27a',
  fortify_thermos: '#ffb04a',
  overload: '#c78aff',
  // D400
  spirit_shield: '#5fe0ff',
  sanctuary: '#7ad0a0',
  regen_aura: '#7ad0a0',
};

/** One spell's picture, centred on (x, y), about `s` across. */
export function drawBuffIcon(ctx: CanvasRenderingContext2D, spell: string, x: number, y: number, s: number): void {
  const u = s / 2;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  switch (spell) {
    case 'ward_of_steel': {
      // a steel heater shield with a bright rim and a cross
      ctx.moveTo(x - u * 0.8, y - u * 0.8);
      ctx.lineTo(x + u * 0.8, y - u * 0.8);
      ctx.quadraticCurveTo(x + u * 0.85, y + u * 0.3, x, y + u);
      ctx.quadraticCurveTo(x - u * 0.85, y + u * 0.3, x - u * 0.8, y - u * 0.8);
      ctx.fillStyle = '#7f90a6';
      ctx.fill();
      ctx.strokeStyle = '#e6eef8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - u * 0.55);
      ctx.lineTo(x, y + u * 0.6);
      ctx.moveTo(x - u * 0.45, y - u * 0.15);
      ctx.lineTo(x + u * 0.45, y - u * 0.15);
      ctx.strokeStyle = '#f4f8ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }
    case 'stone_skin': {
      // a cracked boulder
      const pts: [number, number][] = [
        [-0.85, 0.1],
        [-0.55, -0.7],
        [0.2, -0.85],
        [0.8, -0.35],
        [0.85, 0.45],
        [0.2, 0.85],
        [-0.6, 0.7],
      ];
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * u, y + py * u) : ctx.moveTo(x + px * u, y + py * u)));
      ctx.closePath();
      ctx.fillStyle = '#8a6e4e';
      ctx.fill();
      ctx.strokeStyle = '#2a1e14';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - u * 0.2, y - u * 0.75);
      ctx.lineTo(x, y - u * 0.1);
      ctx.lineTo(x - u * 0.35, y + u * 0.35);
      ctx.moveTo(x, y - u * 0.1);
      ctx.lineTo(x + u * 0.5, y + u * 0.2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,220,0.35)';
      ctx.beginPath();
      ctx.ellipse(x - u * 0.35, y - u * 0.4, u * 0.25, u * 0.13, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'haste': {
      // two speed chevrons and a trail
      ctx.strokeStyle = '#c8ff8a';
      ctx.lineWidth = Math.max(2, s * 0.14);
      for (const dx of [-0.35, 0.3]) {
        ctx.moveTo(x + (dx - 0.3) * u, y - u * 0.6);
        ctx.lineTo(x + (dx + 0.3) * u, y);
        ctx.lineTo(x + (dx - 0.3) * u, y + u * 0.6);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(200,255,138,0.45)';
      ctx.lineWidth = 1.2;
      ctx.moveTo(x - u * 0.95, y - u * 0.3);
      ctx.lineTo(x - u * 0.6, y - u * 0.3);
      ctx.moveTo(x - u * 0.95, y + u * 0.3);
      ctx.lineTo(x - u * 0.6, y + u * 0.3);
      ctx.stroke();
      break;
    }
    case 'bless_weapon': {
      // a sword pointing up in a holy glow
      const g = ctx.createRadialGradient(x, y, 0, x, y, u);
      g.addColorStop(0, 'rgba(255,240,170,0.9)');
      g.addColorStop(1, 'rgba(255,220,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - u, y - u, s, s);
      ctx.beginPath();
      ctx.moveTo(x, y - u * 0.9);
      ctx.lineTo(x + u * 0.16, y - u * 0.65);
      ctx.lineTo(x + u * 0.16, y + u * 0.3);
      ctx.lineTo(x - u * 0.16, y + u * 0.3);
      ctx.lineTo(x - u * 0.16, y - u * 0.65);
      ctx.closePath();
      ctx.fillStyle = '#fff8dc';
      ctx.fill();
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(x - u * 0.5, y + u * 0.3, u, u * 0.16);
      ctx.fillRect(x - u * 0.09, y + u * 0.46, u * 0.18, u * 0.42);
      break;
    }
    case 'fortify_thermos': {
      // the Thermos with a plus on it
      ctx.fillStyle = '#c9a24a';
      ctx.roundRect(x - u * 0.45, y - u * 0.55, u * 0.9, u * 1.45, u * 0.2);
      ctx.fill();
      ctx.strokeStyle = '#2a1e10';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#8a8f98';
      ctx.fillRect(x - u * 0.32, y - u * 0.85, u * 0.64, u * 0.32);
      ctx.strokeStyle = '#fff6d0';
      ctx.lineWidth = Math.max(1.6, s * 0.11);
      ctx.beginPath();
      ctx.moveTo(x, y - u * 0.15);
      ctx.lineTo(x, y + u * 0.55);
      ctx.moveTo(x - u * 0.35, y + u * 0.2);
      ctx.lineTo(x + u * 0.35, y + u * 0.2);
      ctx.stroke();
      break;
    }
    case 'overload': {
      // a crackling bolt in a violet orb
      ctx.arc(x, y, u * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = '#4a2a7a';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + u * 0.2, y - u * 0.7);
      ctx.lineTo(x - u * 0.35, y + u * 0.05);
      ctx.lineTo(x + u * 0.02, y + u * 0.05);
      ctx.lineTo(x - u * 0.2, y + u * 0.7);
      ctx.lineTo(x + u * 0.4, y - u * 0.12);
      ctx.lineTo(x + u * 0.02, y - u * 0.12);
      ctx.closePath();
      ctx.fillStyle = '#e8d0ff';
      ctx.fill();
      break;
    }
    case 'spirit_shield': {
      // a pale blue bubble with a shine, over a small figure
      ctx.arc(x, y, u * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(95,224,255,0.35)';
      ctx.fill();
      ctx.strokeStyle = '#bff4ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - u * 0.15, u * 0.2, 0, Math.PI * 2);
      ctx.moveTo(x - u * 0.32, y + u * 0.5);
      ctx.quadraticCurveTo(x, y - u * 0.05, x + u * 0.32, y + u * 0.5);
      ctx.fillStyle = '#e8fbff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, u * 0.62, -2.5, -1.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case 'sanctuary': {
      // a green dome of light over a cross
      ctx.moveTo(x - u * 0.85, y + u * 0.55);
      ctx.arc(x, y + u * 0.55, u * 0.85, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(122,208,160,0.45)';
      ctx.fill();
      ctx.strokeStyle = '#c8f5da';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - u * 0.1);
      ctx.lineTo(x, y + u * 0.55);
      ctx.moveTo(x - u * 0.25, y + u * 0.12);
      ctx.lineTo(x + u * 0.25, y + u * 0.12);
      ctx.strokeStyle = '#f4fff8';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      break;
    }
    case 'regen_aura': {
      // a green plus inside a soft ring of leaves
      ctx.arc(x, y, u * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(122,208,160,0.8)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = i * (Math.PI / 2) + Math.PI / 4;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * u * 0.8, y + Math.sin(a) * u * 0.8, u * 0.22, u * 0.1, a + Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#7ad0a0';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.rect(x - u * 0.14, y - u * 0.5, u * 0.28, u);
      ctx.rect(x - u * 0.5, y - u * 0.14, u, u * 0.28);
      ctx.fillStyle = '#e6fff0';
      ctx.fill();
      break;
    }
    default: {
      // any other buff spell: a four-point star
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        const r = i % 2 ? u * 0.3 : u * 0.85;
        if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffe27a';
      ctx.fill();
    }
  }
  ctx.restore();
}

/** How long each spell's buff lasted when it was seen first, for the draining ring. */
const started = new Map<string, { until: number; len: number }>();

/**
 * The icons in a row from (x, y) (their top-left), one a self-buff spell on the player now. Returns how wide the row
 * is, so whatever sits to its right can move over.
 */
export function drawBuffIcons(ctx: CanvasRenderingContext2D, w: World, p: Entity, now: number, x: number, y: number): number {
  // D400: with a spell's barrier on you and the helpful spell zones you stand in or cast
  const list = hudSpellIcons(w, p, now);
  const s = BUFF_ICON;
  list.forEach((a, i) => {
    const key = `${p.id}|${a.spell}`;
    let st = started.get(key);
    // a recast (a later end) starts the ring full again
    if (!st || a.until > st.until + 0.05) started.set(key, (st = { until: a.until, len: Math.max(0.5, a.until - now) }));
    const left = Math.max(0, Math.min(1, (a.until - now) / st.len));
    const cx = x + i * (s + 6) + s / 2;
    const cy = y + s / 2;
    const rim = RIM[a.spell] ?? '#ffe27a';
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,14,0.75)';
    ctx.beginPath();
    ctx.roundRect(cx - s / 2, cy - s / 2, s, s, 5);
    ctx.fill();
    // the time left: a ring round the box that drains; it blinks in its last two seconds
    ctx.globalAlpha = a.until - now < 2 ? 0.45 + 0.55 * Math.abs(Math.sin(now * 8)) : 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2 + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2 + 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
    ctx.stroke();
    drawBuffIcon(ctx, a.spell, cx, cy, s - 6);
    ctx.restore();
    // D400: the seconds left, under the icon
    drawText(ctx, `${Math.max(0, Math.ceil(a.until - now))}`, cx, cy + s / 2 + 12, { size: 11, mono: true, align: 'center', color: rim });
  });
  for (const k of [...started.keys()]) if (k.startsWith(`${p.id}|`) && !list.some((a) => k === `${p.id}|${a.spell}`)) started.delete(k);
  return list.length ? list.length * (s + 6) : 0;
}
