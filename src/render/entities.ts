// Drawing world entities: players (Joe + gear + weapon swing), enemies via the draw registry,
// projectiles, hazards, pickups, interactables, decoys and walls.
import { DEG } from '../engine/math';
import { drawById, type DrawState } from '../engine/draw/registry';
import { DEFAULT_LOOK, drawJoe, type BodyGear, type HeadGear, type JoeLook } from '../engine/draw/players';
import { drawShield, drawTool, drawWeapon, isPairedWeapon } from '../engine/draw/weapons';
import { OUTLINE, blob, glow, poly, shade, withAlpha } from '../engine/draw/parts';
import { CLASSES } from '../data/classes';
import { parseArmorBase } from '../data/armor';
import { SHIELDS } from '../data/shields';
import { CASTING_TOOLS } from '../data/castingTools';
import { shapeHit } from '../game/combat/patterns';
import { drawAttackIcon } from './telegraphs';
import { enemyElement } from '../game/elements';
import type { Character } from '../game/types';
import type { Entity, World } from '../game/world';

const RARITY_COLOR: Record<string, string> = { common: '#e8e8e8', uncommon: '#58d66a', rare: '#4aa3ff', epic: '#b06bff', legendary: '#ff9b2e' };
export function rarityColor(r: string): string {
  return RARITY_COLOR[r] ?? '#e8e8e8';
}

export function lookFor(c: Character): JoeLook {
  const cls = CLASSES[c.classId];
  const look: JoeLook = {
    ...DEFAULT_LOOK,
    skin: cls.look.skin,
    hair: cls.look.hair,
    head: cls.look.head as HeadGear,
    headColor: cls.look.trim,
    body: 'shirt',
    bodyColor: cls.look.shirt,
    trim: cls.look.trim,
    legsColor: cls.look.legs,
  };
  const head = c.equipment.head && parseArmorBase(c.equipment.head.baseId);
  if (head?.set) {
    look.head = head.set.look.head as HeadGear;
    look.headColor = head.set.look.color;
  }
  const body = c.equipment.body && parseArmorBase(c.equipment.body.baseId);
  if (body?.set) {
    look.body = body.set.look.body as BodyGear;
    look.bodyColor = body.set.look.color;
    look.trim = body.set.look.trim;
  }
  const legs = c.equipment.legs && parseArmorBase(c.equipment.legs.baseId);
  if (legs && !legs.set) look.body = c.equipment.body ? look.body : 'loincloth';
  else if (legs?.set) look.legsColor = shade(legs.set.look.color, 0.8);
  if (c.classId === 'nobody' && !c.equipment.body) look.body = 'loincloth';
  return look;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Weapon angle relative to facing for the current swing phase. */
function weaponPose(e: Entity): { rot: number; ext: number } {
  const pl = e.pl!;
  const c = pl.combo;
  if (!c) {
    if (pl.blocking) return { rot: -0.9, ext: 0 };
    return { rot: 0.7 + Math.sin(e.anim.t * 2) * 0.03, ext: 0 };
  }
  const hb = c.swing.hitbox;
  const k = Math.min(1, c.t / Math.max(0.001, c.dur));
  if (hb.shape === 'thrust') {
    if (c.phase === 'windup') return { rot: 0, ext: -10 * k };
    if (c.phase === 'active') return { rot: 0, ext: lerp(-10, hb.l * 0.35, k) };
    return { rot: 0, ext: lerp(hb.l * 0.35, 0, k) };
  }
  if (hb.shape === 'proj') return { rot: 0, ext: 0 };
  const half = (hb.angleDeg * DEG) / 2;
  const dir = c.idx % 2 === 0 ? 1 : -1;
  if (c.phase === 'windup') return { rot: lerp(0.7 * dir, -half * dir - 0.3 * dir, k), ext: 0 };
  if (c.phase === 'active') return { rot: lerp(-half * dir - 0.3 * dir, half * dir, k), ext: 4 };
  return { rot: lerp(half * dir, 0.7 * dir, k), ext: 0 };
}

export function drawPlayerEntity(ctx: CanvasRenderingContext2D, w: World, e: Entity, x: number, y: number, now: number, isLocal: boolean): void {
  const pl = e.pl!;
  if (pl.deadUntilRest) return;
  const look = lookFor(pl.char);
  const wDraw = pl.derived.weapon.draw;
  const offItem = pl.char.equipment.off;
  const shield = offItem ? SHIELDS[offItem.baseId] : undefined;
  const tool = offItem ? CASTING_TOOLS[offItem.baseId] : undefined;
  const pose = weaponPose(e);
  const two = pl.char.twoHanded;
  const charging = pl.combo?.charging ? pl.combo.chargeT : 0;
  const ghost = pl.downed;
  const dodge = pl.state === 'dodge';
  // dodge recharge ring (GAME_DESIGN §5.3)
  if (isLocal && !ghost) {
    const rem = pl.dodgeReadyAt - now;
    if (rem > 0) {
      const frac = 1 - rem / Math.max(0.1, pl.dodgeRechargeTotal);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y + 4, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#8fd3ff';
      ctx.beginPath();
      ctx.arc(x, y + 4, 24, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  if (pl.blocking) {
    ctx.save();
    ctx.strokeStyle = withAlpha('#c9ced6', 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 26, e.facing - 1.2, e.facing + 1.2);
    ctx.stroke();
    ctx.restore();
  }
  if (pl.parryUntil > now) glow(ctx, x + Math.cos(e.facing) * 16, y + Math.sin(e.facing) * 16, 20, '#ffffff', 0.7);
  drawJoe(ctx, look, {
    x,
    y,
    facing: e.facing,
    t: e.anim.t + now,
    moving: (e.anim as { moving?: number }).moving ?? 0,
    squash: e.anim.squash,
    flash: e.anim.flashUntil > now,
    tint: null,
    alpha: (ghost ? 0.55 : dodge ? 0.75 : 1) * e.anim.alpha,
    ghost,
    scale: e.anim.scale,
    twoHanded: two,
    blocking: pl.blocking,
    drawWeapon: (c) => {
      if (ghost) return;
      c.save();
      const a = e.facing + pose.rot;
      const hx = Math.cos(e.facing + 0.9) * 10;
      const hy = Math.sin(e.facing + 0.9) * 10 + 2;
      c.translate(hx + Math.cos(a) * pose.ext, hy + Math.sin(a) * pose.ext);
      c.rotate(a);
      drawWeapon(c, wDraw, charging);
      blob(c, 0, 0, 4.5, 4.5, { fill: look.skin, outlineW: 2 });
      c.restore();
      if (isPairedWeapon(wDraw)) {
        c.save();
        const a2 = e.facing - pose.rot * 0.8;
        c.translate(Math.cos(e.facing - 0.9) * 10, Math.sin(e.facing - 0.9) * 10 + 2);
        c.rotate(a2);
        drawWeapon(c, wDraw, 0);
        c.restore();
      }
    },
    drawOffhand: (c) => {
      if (ghost) return;
      c.save();
      const side = pl.blocking ? 0.15 : -1.1;
      c.translate(Math.cos(e.facing + side) * 13, Math.sin(e.facing + side) * 13 + 2);
      c.rotate(e.facing + (shield ? 0 : -0.4));
      if (shield) drawShield(c, shield.draw);
      else if (tool) drawTool(c, tool.draw, now);
      c.restore();
    },
  });
  // slash arc: the swing drawn as a fading wedge while the hit is live (ART_AUDIO §4)
  const sw = pl.combo;
  if (!ghost && sw && sw.phase === 'active' && sw.swing.hitbox.shape === 'arc') {
    const hb = sw.swing.hitbox;
    const half = (hb.angleDeg * DEG) / 2;
    const dir = sw.idx % 2 === 0 ? 1 : -1;
    const k = Math.min(1, sw.t / Math.max(0.001, sw.dur));
    const a0 = e.facing - half * dir;
    const a1 = e.facing + (-half + 2 * half * k) * dir;
    ctx.save();
    ctx.globalAlpha = 0.4 * (1 - k * 0.5);
    ctx.strokeStyle = '#f4f0e6';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, Math.min(hb.r, 110) * 0.85, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
    ctx.restore();
  }
  if (ghost) {
    // revive ring and bleed-out timer
    const frac = Math.min(1, pl.reviveProgress / Math.max(1, pl.reviveNeed));
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#58d66a';
    ctx.beginPath();
    ctx.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#efe6d2';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.ceil(pl.ghostUntil - now))}s`, x, y - 36);
    ctx.restore();
  }
  // co-op name tag
  if (w.players.length > 1) {
    ctx.save();
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = PLAYER_COLORS[pl.slot % 4]!;
    ctx.fillText(pl.name, x, y - 34);
    ctx.restore();
  }
}

export const PLAYER_COLORS = ['#e6b84a', '#5fd3c0', '#ff7aa8', '#9ad0ff'];

export function enemyDrawState(e: Entity, x: number, y: number, now: number, pal: string[]): DrawState {
  const en = e.en!;
  const moving = Math.min(1, Math.hypot(e.x - e.px, e.y - e.py) * 20);
  return {
    x,
    y,
    facing: e.facing,
    t: now - e.born,
    r: e.radius,
    flash: e.anim.flashUntil > now,
    tint: e.anim.tint,
    alpha: e.anim.alpha,
    scale: e.anim.scale,
    squash: e.anim.squash,
    pose: en.state === 'stagger' ? 'stagger' : e.anim.pose,
    poseT: e.anim.poseT,
    hpFrac: e.hp ? e.hp.hp / Math.max(1, e.hp.max) : 1,
    moving,
    pal: en.def.palette ?? pal,
    phase: en.phase,
    variant: en.pieceIndex,
    awake: en.state !== 'dormant',
    ...(en.gaze !== undefined ? { gaze: en.gaze } : {}),
    elem: enemyElement(en.def),
    atk: en.attack ? en.attack.def.type : null,
  };
}

const ELITE_COLOR: Record<string, string> = {
  frenzied: '#ff4a3a',
  armored: '#9a9aa6',
  vampiric: '#8a1020',
  arcane: '#b06bff',
  molten: '#ff7a1a',
  frostbound: '#9ad0ff',
  shielded: '#5fe0ff',
  summoner: '#58d66a',
};

export function drawEnemyEntity(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number, pal: string[], iconScale: number): void {
  const en = e.en!;
  if (en.state === 'spawning') {
    // rising floor circle tell
    const k = Math.max(0, Math.min(1, 1 - (en.spawnUntil - now) / Math.max(0.05, en.spawnUntil - en.spawnedAt)));
    ctx.save();
    ctx.strokeStyle = withAlpha('#e8d8c0', 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, e.radius * (0.4 + k), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = withAlpha('#000000', 0.35 * k);
    ctx.fill();
    ctx.restore();
    if (k < 0.7) return;
  }
  if (en.state === 'ceiling') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y, e.radius * 1.3, e.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (en.elite) {
    const c = ELITE_COLOR[en.elite] ?? '#fff';
    glow(ctx, x, y, e.radius * 2.2, c, 0.45 + Math.sin(now * 4) * 0.1);
    if (en.elite === 'frostbound') {
      ctx.save();
      ctx.strokeStyle = withAlpha(c, 0.35);
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(x, y, 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (en.elite === 'summoner') {
      ctx.save();
      ctx.strokeStyle = withAlpha(c, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + e.radius * 0.6, e.radius * 1.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  drawById(ctx, e.drawId, enemyDrawState(e, x, y, now, pal));
  if (en.elite === 'arcane') {
    for (let i = 0; i < 3; i++) {
      const a = en.eliteOrbAngle + (i * Math.PI * 2) / 3;
      const ox = x + Math.cos(a) * (e.radius + 34);
      const oy = y + Math.sin(a) * (e.radius + 34);
      glow(ctx, ox, oy, 16, '#b06bff', 0.8);
      blob(ctx, ox, oy, 6, 6, { fill: '#d6a8ff', outlineW: 2 });
    }
  }
  if (en.elite === 'shielded' && e.hp!.barrier > 0) {
    ctx.save();
    ctx.strokeStyle = withAlpha('#5fe0ff', 0.7);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, e.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (en.elite === 'armored') {
    ctx.save();
    ctx.fillStyle = '#9a9aa6';
    ctx.strokeStyle = OUTLINE;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.rect(x + s * e.radius * 0.7 - 5, y - e.radius * 0.6, 10, 12);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  // windup icons (colorblind support)
  const a = en.attack;
  if (a && a.phase === 'windup' && (a.def.kind === 'red' || a.def.kind === 'pierce') && (!en.def.swarm || en.pieceIndex === 0)) {
    drawAttackIcon(ctx, x, y - e.radius - 18, a.def.kind, iconScale, now);
  }
  // hp bar for damaged non-boss enemies; elite name
  if (!en.isBoss && !en.def.traits?.hideHpBar && e.hp && (e.hp.hp < e.hp.max || en.elite)) {
    const wbar = Math.max(30, e.radius * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - wbar / 2, y - e.radius - 10, wbar, 4);
    ctx.fillStyle = en.elite ? (ELITE_COLOR[en.elite] ?? '#e33') : '#d33';
    ctx.fillRect(x - wbar / 2, y - e.radius - 10, wbar * Math.max(0, e.hp.hp / e.hp.max), 4);
  }
  if (en.elite) {
    ctx.save();
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    const label = en.elite[0]!.toUpperCase() + en.elite.slice(1);
    ctx.strokeText(label, x, y - e.radius - 14);
    ctx.fillStyle = ELITE_COLOR[en.elite] ?? '#fff';
    ctx.fillText(label, x, y - e.radius - 14);
    ctx.restore();
  }
}

export function drawProjectile(ctx: CanvasRenderingContext2D, e: Entity, x: number, y: number, now: number): void {
  const pr = e.pr!;
  const c = pr.color;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(e.facing);
  const s = e.anim.scale;
  ctx.scale(s, s);
  switch (pr.drawId) {
    case 'p_arrow':
    case 'e_arrow':
      ctx.strokeStyle = '#d8c8a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      poly(ctx, [8, -3, 14, 0, 8, 3], '#c9ced6', OUTLINE, 1);
      ctx.fillStyle = '#e8e1c8';
      ctx.fillRect(-14, -3, 4, 6);
      break;
    case 'p_bolt':
      poly(ctx, [-10, -2, 8, -2, 12, 0, 8, 2, -10, 2], '#8a8f98', OUTLINE, 1);
      break;
    case 'p_knife':
      poly(ctx, [-6, -2, 8, -1, 10, 0, 8, 1, -6, 2], '#dfe4ea', OUTLINE, 1);
      break;
    case 'p_axe':
      ctx.rotate(now * 18);
      poly(ctx, [-8, -2, 8, -2, 8, 2, -8, 2], '#7a5232', OUTLINE, 1.5);
      poly(ctx, [4, -2, 8, -10, 12, -2], '#c9ced6', OUTLINE, 1.5);
      break;
    case 'p_crescent':
      ctx.strokeStyle = '#efe6ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(-6, 0, e.radius, -1.1, 1.1);
      ctx.stroke();
      glow(ctx, 0, 0, e.radius * 1.6, '#c8c0ff', 0.6);
      break;
    case 'p_magic':
      glow(ctx, 0, 0, e.radius * 3.2, c, 0.9);
      blob(ctx, 0, 0, e.radius * 0.8, e.radius * 0.8, { fill: '#ffffff', outlineW: 0 });
      break;
    case 'e_bone':
      ctx.rotate(now * 12);
      ctx.fillStyle = '#e8e1c8';
      ctx.fillRect(-8, -2, 16, 4);
      blob(ctx, -8, 0, 3, 3, { fill: '#e8e1c8', outlineW: 1.5 });
      blob(ctx, 8, 0, 3, 3, { fill: '#e8e1c8', outlineW: 1.5 });
      break;
    case 'e_paper':
      ctx.rotate(Math.sin(now * 10) * 0.5);
      ctx.fillStyle = '#f4f0e0';
      ctx.fillRect(-7, -5, 14, 10);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(-7, -5, 14, 10);
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(4, -2);
      ctx.moveTo(-4, 1);
      ctx.lineTo(3, 1);
      ctx.stroke();
      break;
    default:
      glow(ctx, 0, 0, e.radius * 3, c, 0.8);
      blob(ctx, 0, 0, e.radius, e.radius * 0.8, { fill: c, outlineW: 2 });
  }
  ctx.restore();
  if (pr.lob) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10 * e.anim.scale, e.radius, e.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawHazardEntity(ctx: CanvasRenderingContext2D, e: Entity, now: number, color: string): void {
  const hz = e.hz!;
  const life = Math.max(0, hz.until - now);
  const fade = Math.min(1, life / 0.6);
  ctx.save();
  for (const s of hz.shapes) {
    ctx.globalAlpha = 0.35 * fade;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (s.k === 'circle') {
      ctx.arc(s.x, s.y, s.r * (1 + Math.sin(now * 3 + s.x) * 0.03), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (s.k === 'line') {
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = s.w / 2;
      ctx.moveTo(s.x - sa * hw, s.y + ca * hw);
      ctx.lineTo(s.x + ca * s.l - sa * hw, s.y + sa * s.l + ca * hw);
      ctx.lineTo(s.x + ca * s.l + sa * hw, s.y + sa * s.l - ca * hw);
      ctx.lineTo(s.x + sa * hw, s.y - ca * hw);
      ctx.closePath();
      ctx.fill();
    } else if (s.k === 'ring') {
      ctx.arc(s.x, s.y, Math.min(1600, s.rOut), 0, Math.PI * 2);
      ctx.arc(s.x, s.y, s.rIn, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
    } else if (s.k === 'cone') {
      // a wedge (Hex Gale's wind) with gusts streaming outward
      const r = Math.min(1600, s.r);
      ctx.moveTo(s.x, s.y);
      ctx.arc(s.x, s.y, r, s.a - s.half, s.a + s.half);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.55 * fade;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const a = s.a - s.half + ((i + 0.5) / 7) * s.half * 2;
        const k = (now * 1.6 + i * 0.37) % 1;
        const d0 = r * k;
        ctx.beginPath();
        ctx.moveTo(s.x + Math.cos(a) * d0, s.y + Math.sin(a) * d0);
        ctx.lineTo(s.x + Math.cos(a) * (d0 + 40), s.y + Math.sin(a) * (d0 + 40));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

export function drawPickup(ctx: CanvasRenderingContext2D, e: Entity, now: number): void {
  const pk = e.pk!;
  const bob = Math.sin(now * 3 + e.id) * 3;
  const x = e.x;
  const y = e.y + bob;
  if (pk.kind === 'shards' || pk.kind === 'shardpile') {
    glow(ctx, x, y, pk.kind === 'shardpile' ? 40 : 18, '#9ad0ff', 0.7);
    for (let i = 0; i < (pk.kind === 'shardpile' ? 5 : 2); i++) {
      const a = now * 1.5 + i * 1.3;
      poly(ctx, [x + Math.cos(a) * 6, y - 8 + Math.sin(a) * 3, x + 4 + Math.cos(a) * 6, y + Math.sin(a) * 3, x + Math.cos(a) * 6, y + 8 + Math.sin(a) * 3, x - 4 + Math.cos(a) * 6, y + Math.sin(a) * 3], '#cfeaff', OUTLINE, 1.5);
    }
    return;
  }
  const color = rarityColor(pk.rarity);
  // loot beam by rarity
  if (pk.rarity !== 'common') {
    ctx.save();
    const grad = ctx.createLinearGradient(x, y - 120, x, y);
    grad.addColorStop(0, withAlpha(color, 0));
    grad.addColorStop(1, withAlpha(color, pk.rarity === 'legendary' ? 0.6 : 0.35));
    ctx.fillStyle = grad;
    ctx.fillRect(x - 5, y - 120, 10, 120);
    ctx.restore();
  }
  glow(ctx, x, y, 20, color, 0.6);
  if (pk.kind === 'gem') {
    poly(ctx, [x, y - 8, x + 7, y, x, y + 8, x - 7, y], color, OUTLINE, 2);
  } else if (pk.kind === 'consumable' || pk.kind === 'glowen') {
    blob(ctx, x, y, 6, 7, { fill: pk.kind === 'glowen' ? '#fff3b0' : '#b08d6a' });
  } else if (pk.kind === 'spell' || pk.kind === 'tear') {
    blob(ctx, x, y, 8, 8, { fill: pk.kind === 'tear' ? '#9ad0ff' : '#c58cff' });
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6);
    ctx.fillStyle = color;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-10, -3, 20, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function debugHitboxes(ctx: CanvasRenderingContext2D, w: World): void {
  ctx.save();
  ctx.lineWidth = 1;
  for (const e of w.entities.values()) {
    if (e.type !== 'player' && e.type !== 'enemy' && e.type !== 'projectile') continue;
    ctx.strokeStyle = e.team === 0 ? '#0f0' : '#f0f';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.stroke();
    const c = e.pl?.combo;
    if (c && c.phase === 'active' && c.swing.hitbox.shape === 'arc') {
      ctx.strokeStyle = '#ff0';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.arc(e.x, e.y, c.swing.hitbox.r, e.facing - (c.swing.hitbox.angleDeg * DEG) / 2, e.facing + (c.swing.hitbox.angleDeg * DEG) / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
  void shapeHit;
}
