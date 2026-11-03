// In-game HUD drawn on the canvas (GAME_DESIGN §16): HP/stamina, status meters, control icons, flask,
// Shards/Glowen, Q/E/R skills with radial cooldowns, 1/2/3 spells, quick-use item.
import { drawText, FONT } from '../engine/text';
import { glow, withAlpha } from '../engine/draw/parts';
import { keyName } from '../engine/input/bindings';
import type { Settings } from '../engine/settings';
import { SKILLS } from '../data/skills';
import { SPELLS } from '../data/spells';
import { CONSUMABLES } from '../data/consumables';
import type { Entity, World } from '../game/world';
import type { ControlId, StatusId } from '../game/types';
import { buffSum } from '../game/combat/state';
import { flaskCap } from '../game/combat/formulas';

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

function cdIcon(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, key: string, frac: number, locked: boolean, color: string, sub = ''): void {
  const s = 40;
  ctx.save();
  ctx.fillStyle = locked ? '#1a1820' : '#2a2433';
  ctx.strokeStyle = locked ? '#3a3447' : color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, s, s, 6);
  ctx.fill();
  ctx.stroke();
  if (!locked) {
    ctx.fillStyle = withAlpha(color, 0.85);
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(label.slice(0, 5), x + s / 2, y + s / 2 + 4, s - 4);
  } else {
    ctx.fillStyle = '#4a4458';
    ctx.font = `bold 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('🔒︎', x + s / 2, y + s / 2 + 6);
  }
  if (frac > 0 && !locked) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.moveTo(x + s / 2, y + s / 2);
    ctx.arc(x + s / 2, y + s / 2, s * 0.72, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.fillRect(x, y, s, s);
    ctx.restore();
  }
  ctx.restore();
  drawText(ctx, key, x + 3, y + 12, { size: 10, color: '#efe6d2', weight: 'bold' });
  if (sub) drawText(ctx, sub, x + s - 3, y + s - 3, { size: 10, color: '#efe6d2', align: 'right' });
}

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
  // statuses: meters and active effects under the bars
  let sx = 20;
  const sy = 60;
  for (const k of ['burn', 'chill', 'shock', 'bleed', 'poison'] as StatusId[]) {
    const m = p.st!.meters[k];
    const active = p.st!.active[k] > now;
    if (m <= 0 && !active) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(sx, sy, 46, 14);
    ctx.fillStyle = withAlpha(STATUS_COLOR[k], active ? 1 : 0.7);
    ctx.fillRect(sx, sy, active ? 46 : (46 * m) / 100, 14);
    drawText(ctx, k.toUpperCase(), sx + 23, sy + 11, { size: 9, align: 'center', weight: 'bold' });
    sx += 50;
  }
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
  drawText(ctx, `${ch.flaskCur}/${flaskCap(ch)}`, fx + 24, fy + 20, { size: 15, weight: 'bold', mono: true });
  // currencies
  drawText(ctx, `◆ ${Math.floor(ch.shards).toLocaleString('en-US')}`, 110, fy + 20, { size: 15, color: '#9ad0ff', mono: true });
  drawText(ctx, `✦ ${Math.floor(ch.glowen).toLocaleString('en-US')}`, 230, fy + 20, { size: 15, color: '#fff3b0', mono: true });
  if (ch.twoHanded) drawText(ctx, 'TWO-HANDED', 340, fy + 20, { size: 12, color: '#ffd27a', weight: 'bold' });
  if (!d.weaponMeetsReq) drawText(ctx, '! weapon below requirement (40% damage)', 20, fy + 44, { size: 12, color: '#ff6a5a' });

  // skills (bottom-left) Q/E/R
  const kb = settings.controls.keyboard;
  const pad = 20;
  const by = 720 - 60;
  const skillIds = d.weapon.skills;
  for (let i = 0; i < 3; i++) {
    const sid = skillIds[i] ?? '';
    const def = SKILLS[sid];
    const locked = !def || i >= d.skillsUnlocked;
    const ready = pl.skillReadyAt[i]!;
    const total = def ? def.cooldownS * (1 - d.cdr) : 1;
    const frac = ready > now ? (ready - now) / Math.max(0.1, total) : 0;
    const key = keyName(kb[(['skill1', 'skill2', 'skill3'] as const)[i]!][0] ?? '?');
    cdIcon(ctx, pad + i * 46, by, def?.name ?? '—', key, frac, locked, '#ffd27a', ready > now ? `${Math.ceil(ready - now)}` : '');
  }
  // spells 1/2/3
  const school = d.offKind === 'staff' ? 'brain' : d.offKind === 'talisman' ? 'prayer' : null;
  const loadout = school ? ch.spellLoadout[school] : [null, null, null];
  for (let i = 0; i < 3; i++) {
    const id = loadout[i] ?? null;
    const def = id ? SPELLS[id] : undefined;
    const locked = !def || !d.toolMeetsReq;
    const ready = pl.spellReadyAt[i]!;
    const total = def ? def.cooldownS : 1;
    const frac = ready > now ? (ready - now) / Math.max(0.1, total) : 0;
    const key = keyName(kb[(['spell1', 'spell2', 'spell3'] as const)[i]!][0] ?? '?');
    cdIcon(ctx, pad + 160 + i * 46, by, def?.name ?? '—', key, frac, locked, school === 'brain' ? '#8fd3ff' : '#fff3b0', ready > now ? `${Math.ceil(ready - now)}` : '');
  }
  // quick-use
  const q = ch.quickSlot;
  const qn = q ? (ch.consumables[q] ?? 0) : 0;
  cdIcon(ctx, pad + 320, by, q ? (CONSUMABLES[q]?.short ?? q) : '—', keyName(kb.quick[0] ?? 'G'), 0, !q || qn <= 0, '#c9b98a', qn ? `${qn}` : '');

  // parry/riposte hint
  if (pl.riposteBuffUntil > now) {
    glow(ctx, 640, 690, 60, '#ffffff', 0.25);
    drawText(ctx, 'RIPOSTE READY', 640, 696, { size: 14, align: 'center', weight: 'bold', color: '#ffffff' });
  }
  if (pl.guardBrokenUntil > now) drawText(ctx, 'GUARD BROKEN', p.x, p.y - 40, { size: 13, align: 'center', weight: 'bold', color: '#ff6a5a' });
}
