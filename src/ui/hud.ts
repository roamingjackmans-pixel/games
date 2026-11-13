// In-game HUD drawn on the canvas (GAME_DESIGN §16): HP/stamina, status meters, control icons, flask,
// Shards/Glowen, the three weapon skills with radial cooldowns, three spells, quick-use item. Every key hint is
// a button glyph for the chosen prompt style and the current bindings (glyphs.ts).
import { GLOWEN_COLOR } from './tooltip';
import { drawText, FONT, MONO } from '../engine/text';
import { glow, withAlpha } from '../engine/draw/parts';
import type { Action } from '../engine/input/actions';
import type { Settings } from '../engine/settings';
import { drawGlyph, drawPromptText } from './glyphs';
import { SKILLS } from '../data/skills';
import { SPELLS } from '../data/spells';
import { CONSUMABLES } from '../data/consumables';
import type { Entity, World } from '../game/world';
import type { ControlId, StatusId } from '../game/types';
import { buffSum } from '../game/combat/state';
import { flaskCap } from '../game/combat/formulas';
import { toolForSchool } from '../game/player/derived';
import { offSkillsUnlocked, spellKeysAreOffSkills } from '../game/skills/use';

const STATUS_COLOR: Record<StatusId, string> = { burn: '#ff7a1a', chill: '#9ad0ff', shock: '#ffe14a', bleed: '#c01828', poison: '#7ad040' };
const CONTROL_LABEL: Record<ControlId, string> = { freeze: 'FROZEN', blind: 'BLIND', hexed: 'HEXED', silence: 'SILENCED', root: 'ROOTED', hold: 'HELD' };

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frac: number, color: string, back = '#2a2433', ghost = -1): void {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  if (ghost > frac) {
    ctx.fillStyle = withAlpha('#ffffff', 0.35);
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ghost)), h);
  }
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.fillStyle = withAlpha('#ffffff', 0.15);
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h * 0.35);
}

/**
 * A cooldown circle (D-HUD, Nightreign style): it fills from the bottom up while it recharges, greyed out, and once
 * full it glows and pulses to say it is ready. `left` is the share of the cooldown still to go (0 = ready); `readyAt`
 * is when it came (or comes) off cooldown, for a short flash the moment it fills. The button glyph sits at its top
 * left, the name under it, the seconds left in the middle.
 */
/** a paused cooldown's glow and rim (D324) */
const PAUSED_RED = '#ff4a4a';

function skillCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  label: string,
  action: Action,
  left: number,
  locked: boolean,
  color: string,
  now: number,
  readyAt: number,
  o: { sub?: string; alpha?: number; badge?: string; quiet?: boolean; paused?: boolean } = {},
): void {
  const sub = o.sub ?? '';
  const alpha = o.alpha ?? 1;
  const level = locked ? 0 : 1 - Math.max(0, Math.min(1, left));
  const ready = !locked && left <= 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  // the glow behind a ready circle, brighter for a moment as it fills
  if (ready && !o.quiet) {
    const flash = Math.max(0, 1 - (now - readyAt) / 0.6);
    glow(ctx, cx, cy, r * (1.55 + 0.5 * flash), color, 0.22 + 0.06 * Math.sin(now * 4) + 0.5 * flash);
  }
  // a cooldown paused with nothing to fight (D177, D324) glows a soft red
  const paused = !!o.paused && !ready && !locked;
  if (paused) glow(ctx, cx, cy, r * 1.5, PAUSED_RED, 0.3 + 0.05 * Math.sin(now * 2.5));
  // the dark disc
  ctx.fillStyle = locked ? 'rgba(14,12,18,0.72)' : 'rgba(18,15,24,0.8)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // the liquid level, bottom to top: grey while it charges, the slot's colour when full
  if (level > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
    ctx.clip();
    const top = cy + r - 3 - (2 * r - 6) * level;
    ctx.fillStyle = ready ? withAlpha(color, 0.42) : 'rgba(150,146,160,0.38)';
    ctx.fillRect(cx - r, top, r * 2, cy + r - top);
    // the surface line of the liquid
    if (!ready) {
      ctx.fillStyle = 'rgba(220,216,228,0.55)';
      ctx.fillRect(cx - r, top, r * 2, 1.5);
    } else {
      // a soft sheen across the top of a full circle
      const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  // the rim: dim and grey while charging, the slot's colour and pulsing when ready
  ctx.lineWidth = ready ? 3 : 2;
  ctx.strokeStyle = locked ? '#3a3447' : paused ? withAlpha(PAUSED_RED, 0.85) : ready ? withAlpha(color, o.quiet ? 0.7 : 0.75 + 0.25 * Math.sin(now * 4)) : 'rgba(120,114,132,0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (ready) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = withAlpha('#ffffff', 0.35);
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (locked) {
    ctx.fillStyle = '#4a4458';
    ctx.font = `bold ${Math.round(r * 0.6)}px ${FONT}`;
    ctx.fillText('🔒︎', cx, cy + 1);
  } else if (sub) {
    // seconds left, big in the middle
    ctx.font = `bold ${Math.round(r * 0.62)}px ${MONO}`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineJoin = 'round';
    ctx.strokeText(sub, cx, cy + 1);
    ctx.fillStyle = '#d8d2e0';
    ctx.fillText(sub, cx, cy + 1);
  } else {
    // ready (or a slot with no cooldown): its name inside, on two lines when it needs them
    const size = r >= 28 ? 11 : 10;
    ctx.font = `bold ${size}px ${FONT}`;
    const lines = fitTwoLines(ctx, label, r * 1.7);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineJoin = 'round';
    ctx.fillStyle = ready ? '#fffaf0' : '#a8a2b4';
    lines.forEach((ln, i) => {
      const ly = cy + 1 + (i - (lines.length - 1) / 2) * (size + 1);
      ctx.strokeText(ln, cx, ly, r * 1.75);
      ctx.fillText(ln, cx, ly, r * 1.75);
    });
  }
  ctx.restore();
  drawGlyph(ctx, action, cx - r * 0.78, cy - r * 0.78, GLYPH, { align: 'center', valign: 'middle', alpha: (locked ? 0.6 : 1) * alpha });
  // a count (the quick item's), bottom right
  if (o.badge) drawText(ctx, o.badge, cx + r * 0.8, cy + r * 0.8, { size: 12, align: 'center', weight: 'bold', mono: true, color: '#efe6d2', alpha });
}

/** A name split onto at most two lines that each fit `maxW` (the current font), words kept whole. */
function fitTwoLines(ctx: CanvasRenderingContext2D, s: string, maxW: number): string[] {
  if (ctx.measureText(s).width <= maxW || !s.includes(' ')) return [s];
  const words = s.split(' ');
  let best: string[] = [s];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (w < bestW) {
      bestW = w;
      best = [a, b];
    }
  }
  return best;
}

/** How long each status lasts once it goes off (combat/damage.ts triggerStatus), for the draining bar. */
const STATUS_DUR: Record<StatusId, number> = { burn: 4, chill: 3, shock: 3, bleed: 0.5, poison: 8 };

/** A small status picture drawn in code, centred on (x, y), about `s` across. */
function statusIcon(ctx: CanvasRenderingContext2D, k: StatusId, x: number, y: number, s: number): void {
  const c = STATUS_COLOR[k];
  const u = s / 2;
  ctx.save();
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (k) {
    case 'burn':
      // a flame: a teardrop pointing up with a yellow heart
      ctx.moveTo(x, y - u);
      ctx.bezierCurveTo(x + u * 0.9, y - u * 0.1, x + u * 0.8, y + u, x, y + u);
      ctx.bezierCurveTo(x - u * 0.8, y + u, x - u * 0.9, y - u * 0.1, x, y - u);
      ctx.fill();
      ctx.fillStyle = '#ffe14a';
      ctx.beginPath();
      ctx.ellipse(x, y + u * 0.4, u * 0.32, u * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'chill':
      // a snowflake: three crossed strokes with little ticks
      ctx.lineWidth = Math.max(1.4, s * 0.12);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3 + Math.PI / 2;
        const dx = Math.cos(a) * u;
        const dy = Math.sin(a) * u;
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
      }
      ctx.stroke();
      break;
    case 'shock':
      // a lightning bolt
      ctx.moveTo(x + u * 0.25, y - u);
      ctx.lineTo(x - u * 0.55, y + u * 0.1);
      ctx.lineTo(x - u * 0.02, y + u * 0.1);
      ctx.lineTo(x - u * 0.25, y + u);
      ctx.lineTo(x + u * 0.55, y - u * 0.15);
      ctx.lineTo(x + u * 0.02, y - u * 0.15);
      ctx.closePath();
      ctx.fill();
      break;
    case 'bleed':
      // a blood drop
      ctx.moveTo(x, y - u);
      ctx.bezierCurveTo(x + u * 0.2, y - u * 0.4, x + u * 0.8, y + u * 0.05, x + u * 0.7, y + u * 0.45);
      ctx.arc(x, y + u * 0.35, u * 0.62, 0.1, Math.PI - 0.1);
      ctx.bezierCurveTo(x - u * 0.8, y + u * 0.05, x - u * 0.2, y - u * 0.4, x, y - u);
      ctx.fill();
      break;
    case 'poison':
      // bubbles
      ctx.arc(x - u * 0.25, y + u * 0.3, u * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + u * 0.5, y - u * 0.3, u * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - u * 0.35, y - u * 0.65, u * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

/** status bars over a player: icon box, track and their gaps (logical px) */
const SB_W = 150;
const SB_ICON = 15;
const SB_H = 6;
const SB_ROW = 18;

/**
 * Status buildup over the player's head (D-HUD, Nightreign style): one wide see-through bar a status, its picture in a
 * small dark box at the left, filled in its colour as it builds. Once it goes off the bar runs down over the status's
 * length, flashing; a meter building again under it (a second Chill toward Freeze) shows as a thin line along the bottom.
 * Returns how many rows it drew, so whatever else sits over the head can move up.
 */
export function drawStatusBars(ctx: CanvasRenderingContext2D, p: Entity, now: number): number {
  const st = p.st;
  if (!st) return 0;
  const rows: StatusId[] = [];
  for (const k of ['burn', 'chill', 'shock', 'bleed', 'poison'] as StatusId[]) if (st.meters[k] > 0 || st.active[k] > now) rows.push(k);
  if (!rows.length) return 0;
  // kept on screen when the player is against a side wall
  const x0 = Math.max(6, Math.min(1280 - SB_W - 6, p.x - SB_W / 2));
  // above the head, stacking upward; near the top of the room they hang under the feet instead
  const above = p.y - 46 - rows.length * SB_ROW > 24;
  rows.forEach((k, i) => {
    const y = above ? p.y - 46 - i * SB_ROW : p.y + 30 + i * SB_ROW;
    const active = st.active[k] > now;
    const meter = Math.max(0, Math.min(1, st.meters[k] / 100));
    const fill = active ? Math.max(0, Math.min(1, (st.active[k] - now) / STATUS_DUR[k])) : meter;
    const c = STATUS_COLOR[k];
    ctx.save();
    // the icon in its little dark box
    ctx.fillStyle = 'rgba(10,8,14,0.7)';
    ctx.strokeStyle = active ? withAlpha(c, 0.9) : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x0, y - SB_ICON / 2, SB_ICON, SB_ICON, 3);
    ctx.fill();
    ctx.stroke();
    statusIcon(ctx, k, x0 + SB_ICON / 2, y, SB_ICON - 5);
    // the track and the fill
    const bx = x0 + SB_ICON + 4;
    const bw = SB_W - SB_ICON - 4;
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(bx - 1, y - SB_H / 2 - 1, bw + 2, SB_H + 2);
    const pulse = active ? 0.7 + 0.3 * Math.sin(now * 14) : 0.78;
    ctx.fillStyle = withAlpha(c, pulse);
    ctx.fillRect(bx, y - SB_H / 2, bw * fill, SB_H);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(bx, y - SB_H / 2, bw * fill, 1.5);
    if (active) {
      glow(ctx, bx + bw * fill, y, 10, c, 0.5);
      if (meter > 0) {
        ctx.fillStyle = withAlpha('#ffffff', 0.85);
        ctx.fillRect(bx, y + SB_H / 2 - 1.5, bw * meter, 1.5);
      }
    }
    ctx.restore();
  });
  return above ? rows.length : 0;
}

/** HUD glyph height in logical px */
const GLYPH = 19;

/**
 * The circles' row (centre y) and radius. The three skills and three spells are the same size, either side of a short
 * divider at the middle of the screen (D323); the quick item, smaller, to the skills' left.
 */
export const HUD_Y = 678;
const SKILL_R = 30;
const DIVIDER_X = 640;
const SKILL_X = [454, 526, 598] as const;
const SPELL_R = SKILL_R;
const SPELL_X = [682, 754, 826] as const;
const QUICK_R = 23;
const QUICK_X = 386;
/** spells' circles (both schools, and an off-hand crossbow's skills on the spell keys): pinkish purple (D323) */
const SPELL_COLOR = '#e08aff';

export interface HudExtras {
  ghostHp: number;
}

export function drawHud(ctx: CanvasRenderingContext2D, w: World, p: Entity, settings: Settings, extras: HudExtras): void {
  const pl = p.pl!;
  const hp = p.hp!;
  const st = p.stam!;
  const now = w.time;
  const ch = pl.char;
  const d = pl.derived;
  // HP and stamina, top-left
  const hpW = Math.min(360, 160 + hp.max * 0.35);
  bar(ctx, 20, 20, hpW, 16, hp.hp / hp.max, '#c8302a', '#2a1418', extras.ghostHp);
  if (hp.barrier > 0) bar(ctx, 20, 20, hpW * Math.min(1, hp.barrier / hp.max), 4, 1, '#5fe0ff');
  drawText(ctx, `${Math.ceil(hp.hp)} / ${hp.max}`, 26, 33, { size: 12, mono: true });
  const stW = Math.min(300, 120 + st.max * 0.8);
  bar(ctx, 20, 42, stW, 10, st.cur / st.max, '#4caf50', '#142a18');
  // status buildup: wide bars over the player's head (drawStatusBars); held-in-place controls and buffs under the bars
  const statusRows = pl.downed || hp.dead ? 0 : drawStatusBars(ctx, p, now);
  let sx = 20;
  const sy = 60;
  for (const k of ['freeze', 'blind', 'hexed', 'silence', 'root', 'hold'] as ControlId[]) {
    if (p.st!.controls[k] <= now) continue;
    drawText(ctx, CONTROL_LABEL[k], sx + 2, sy + 11, { size: 11, color: '#9ad0ff', weight: 'bold' });
    sx += 70;
  }
  if (buffSum(p, 'damagePct', now) > 0) {
    drawText(ctx, `+${Math.round(buffSum(p, 'damagePct', now) * 100)}% dmg`, sx + 2, sy + 11, { size: 11, color: '#ffd27a' });
  }
  // flask
  const fx = 20;
  const fy = 84;
  ctx.save();
  ctx.fillStyle = ch.flaskCur > 0 ? '#c9a24a' : '#4a4030';
  ctx.strokeStyle = '#120e14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(fx, fy, 18, 28, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a8f98';
  ctx.fillRect(fx + 3, fy - 5, 12, 6);
  ctx.restore();
  const fw = drawGlyph(ctx, 'flask', fx + 23, fy + 15, 15, { align: 'left', alpha: ch.flaskCur > 0 ? 1 : 0.55 });
  const flaskText = `${ch.flaskCur}/${flaskCap(ch)}`;
  drawText(ctx, flaskText, fx + 28 + fw, fy + 20, { size: 15, weight: 'bold', mono: true });
  // currencies (pushed right when a wide flask button, e.g. a Hold binding, needs the room)
  ctx.font = `bold 15px ${MONO}`;
  const cx = Math.max(110, fx + 28 + fw + ctx.measureText(flaskText).width + 14);
  drawText(ctx, `◆ ${Math.floor(ch.shards).toLocaleString('en-US')}`, cx, fy + 20, { size: 15, color: '#9ad0ff', mono: true });
  drawText(ctx, `${Math.floor(ch.glowen).toLocaleString('en-US')}G`, cx + 120, fy + 20, { size: 15, color: GLOWEN_COLOR, mono: true });
  if (ch.twoHanded) drawText(ctx, 'TWO-HANDED', cx + 230, fy + 20, { size: 12, color: '#ffd27a', weight: 'bold' });
  if (!d.weaponMeetsReq) drawText(ctx, '! weapon below requirement (40% damage)', 20, fy + 44, { size: 12, color: '#ff6a5a' });

  // skills and spells as circles at the bottom middle (Nightreign style): the three weapon skills big in the centre
  // (Q/E/R on a keyboard, LB/RB/Y on an Xbox pad… whatever is bound), the three spells smaller to their right, the
  // quick item to their left. They fade while the player walks under them.
  const under = p.y > HUD_Y - 64 && Math.abs(p.x - 606) < 260;
  const alpha = under ? 0.35 : 1;
  // a spell loadout drawn on three keys (Q/E/R for a weapon-hand staff or talisman, 1/2/3 for the off hand's: D201)
  const held = !w.hostilesPresent();
  const spellRow = (school: 'brain' | 'prayer' | null, keys: readonly Action[], readyAt: readonly number[], xs: readonly number[], r: number, cy: number): void => {
    const loadout = school ? ch.spellLoadout[school] : [null, null, null];
    const tool = school ? toolForSchool(d, school) : null;
    for (let i = 0; i < 3; i++) {
      const id = loadout[i] ?? null;
      const def = id ? SPELLS[id] : undefined;
      const locked = !def || !tool?.meetsReq;
      const ready = readyAt[i]!;
      const total = def ? def.cooldownS : 1;
      const frac = ready > now ? (ready - now) / Math.max(0.1, total) : 0;
      // held with nothing to fight (D177): a red glow while it waits (D324)
      skillCircle(ctx, xs[i]!, cy, r, def?.name ?? '—', keys[i]!, frac, locked, SPELL_COLOR, now, ready, { sub: ready > now ? `${Math.ceil(ready - now)}` : '', alpha, paused: held });
    }
  };
  const skillKeys = ['skill1', 'skill2', 'skill3'] as const;
  if (d.skillKeySchool) spellRow(d.skillKeySchool, skillKeys, pl.skillReadyAt, SKILL_X, SKILL_R, HUD_Y);
  else {
    const skillIds = d.weapon.skills;
    for (let i = 0; i < 3; i++) {
      const def = SKILLS[skillIds[i] ?? ''];
      const locked = !def || i >= d.skillsUnlocked;
      const ready = pl.skillReadyAt[i]!;
      const total = def ? def.cooldownS * (1 - d.cdr) : 1;
      const frac = ready > now ? (ready - now) / Math.max(0.1, total) : 0;
      skillCircle(ctx, SKILL_X[i]!, HUD_Y, SKILL_R, def?.name ?? '—', skillKeys[i]!, frac, locked, '#ffd27a', now, ready, { sub: ready > now ? `${Math.ceil(ready - now)}` : '', alpha, paused: held });
    }
  }
  // a short line between the skills and the spells
  ctx.save();
  ctx.globalAlpha = 0.55 * alpha;
  ctx.strokeStyle = '#efe6d2';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(DIVIDER_X, HUD_Y - SKILL_R * 0.7);
  ctx.lineTo(DIVIDER_X, HUD_Y + SKILL_R * 0.7);
  ctx.stroke();
  ctx.restore();
  // spells (1/2/3, or the D-pad): the off-hand tool's school, or the off-hand crossbow's skills (D316)
  const spellY = HUD_Y;
  if (spellKeysAreOffSkills(d)) {
    const unlocked = offSkillsUnlocked(d);
    for (let i = 0; i < 3; i++) {
      const def = SKILLS[d.offWeapon!.def.skills[i] ?? ''];
      const ready = pl.spellReadyAt[i]!;
      const total = def ? def.cooldownS * (1 - d.off.cdr) : 1; // D369: the off hand's own Tempo
      const frac = ready > now ? (ready - now) / Math.max(0.1, total) : 0;
      skillCircle(ctx, SPELL_X[i]!, spellY, SPELL_R, def?.name ?? '—', (['spell1', 'spell2', 'spell3'] as const)[i]!, frac, !def || i >= unlocked, SPELL_COLOR, now, ready, { sub: ready > now ? `${Math.ceil(ready - now)}` : '', alpha, paused: held });
    }
  } else spellRow(d.spellKeys, ['spell1', 'spell2', 'spell3'], pl.spellReadyAt, SPELL_X, SPELL_R, spellY);
  // quick-use, and the "next item" button when there is more than one kind to cycle through
  const q = ch.quickSlot;
  const qn = q ? (ch.consumables[q] ?? 0) : 0;
  skillCircle(ctx, QUICK_X, HUD_Y + SKILL_R - QUICK_R, QUICK_R, q ? (CONSUMABLES[q]?.short ?? q) : '—', 'quick', 0, !q || qn <= 0, '#c9b98a', now, 0, { badge: qn ? `${qn}` : '', alpha, quiet: true });
  if (Object.values(ch.consumables).filter((n) => (n ?? 0) > 0).length > 1) {
    drawPromptText(ctx, '{cycleQuick} next', QUICK_X - QUICK_R - 10, HUD_Y + SKILL_R - QUICK_R, { size: 11, align: 'right', weight: 'normal', color: '#a59c8a', alpha });
  }

  // parry/riposte hint, over the circles (and over a boss bar's name)
  if (pl.riposteBuffUntil > now) {
    const ry = w.bossId ? 566 : 600;
    glow(ctx, 640, ry, 60, '#ffffff', 0.25);
    drawPromptText(ctx, 'RIPOSTE READY  {attack}', 640, ry + 1, { size: 14, color: '#ffffff' });
  }
  if (pl.guardBrokenUntil > now) drawText(ctx, 'GUARD BROKEN', p.x, p.y - 40 - statusRows * SB_ROW, { size: 13, align: 'center', weight: 'bold', color: '#ff6a5a' });
}
