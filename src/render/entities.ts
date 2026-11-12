// Drawing world entities: players (Joe + gear + weapon swing), enemies via the draw registry,
// projectiles, hazards, pickups, interactables, decoys and walls.
import { DEG } from '../engine/math';
import { drawById, type DrawState } from '../engine/draw/registry';
import { DEFAULT_LOOK, drawJoe, type BodyGear, type HeadGear, type JoeLook } from '../engine/draw/players';
import type { Beard, Emblem, HairStyle, HandPose } from '../engine/draw/players';
import { ARMOR_LOOKS, HEAD_OVERRIDE } from '../data/armorLooks';
import { FLASK_DRINK_S, PLAYER_DOT_DY, PLAYER_DOT_R } from '../game/player/player';
import { chakramRing, drawShield, drawTool, drawWeapon, isPairedWeapon } from '../engine/draw/weapons';
import { cacheable, drawCachedEnemy } from './spriteCache';
import { OUTLINE, blob, glow, poly, shade, withAlpha } from '../engine/draw/parts';
import { CLASSES } from '../data/classes';
import { parseArmorBase } from '../data/armor';
import { SHIELDS } from '../data/shields';
import { WEAPONS } from '../data/weapons';
import { CASTING_TOOLS } from '../data/castingTools';
import { SPELLS } from '../data/spells';
import { toolForSchool } from '../game/player/derived';
import { shapeHit, type Shape } from '../game/combat/patterns';
import { drawAttackIcon } from './telegraphs';
import { ELEMENTS, enemyElement } from '../game/elements';
import { drawElementOver, drawElementUnder, drawGolden, isImmuneNow } from './elementFx';
import type { BossDef, Character, DamageType, SwingDef, SwingMove } from '../game/types';
import { PHASE_TRANSITION_S } from '../game/combat/bossPhase';
import { essenceDef } from '../data/essence';
import type { Entity, World } from '../game/world';
import { SKILL_RECOVER_S } from '../game/skills/use';
import { channelPose, dashPose, leapPose, skillMotion, skillWeaponPose } from './skillPose';

const RARITY_COLOR: Record<string, string> = { common: '#e8e8e8', uncommon: '#58d66a', rare: '#4aa3ff', epic: '#b06bff', legendary: '#ff9b2e' };
export function rarityColor(r: string): string {
  return RARITY_COLOR[r] ?? '#e8e8e8';
}

/** Buff stats that load a weapon with an element (D129); add a line here for any new elemental weapon buff. */
const ELEMENT_BUFFS: Partial<Record<string, DamageType>> = { holyConvertPct: 'holy', holyDamagePct: 'holy' };

/** The element a player's weapon is buffed with right now, or null. */
function weaponBuffElement(e: Entity, now: number): DamageType | null {
  for (const b of e.buffs ?? []) {
    if (b.until <= now) continue;
    const el = ELEMENT_BUFFS[b.stat];
    if (el) return el;
  }
  return null;
}

/** A shimmering glow along the weapon (drawn in its local space, blade along +x). */
function drawBuffGlow(c: CanvasRenderingContext2D, el: DamageType, now: number, seed: number): void {
  const col = ELEMENTS[el].glow;
  const pulse = 0.55 + 0.25 * Math.sin(now * 6 + seed);
  for (let x = 8; x <= 62; x += 9) glow(c, x, 0, 13, col, pulse * (0.5 + 0.5 * (x / 62)));
  // a few motes drifting off the edge
  c.save();
  c.fillStyle = col;
  for (let i = 0; i < 4; i++) {
    const k = (now * 0.9 + i / 4 + seed * 0.13) % 1;
    c.globalAlpha = (1 - k) * 0.8;
    c.beginPath();
    c.arc(20 + i * 12, -4 - k * 14, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

export function lookFor(c: Character): JoeLook {
  const cls = CLASSES[c.classId];
  const cl = cls.look;
  // the class default: a tunic in the class colours, the class's own hat, hair and beard
  const look: JoeLook = {
    ...DEFAULT_LOOK,
    skin: cl.skin,
    hair: cl.hair,
    head: cl.head as HeadGear,
    headColor: cl.hat ?? cl.trim,
    body: 'shirt',
    bodyColor: cl.shirt,
    trim: cl.trim,
    legsColor: cl.legs,
  };
  if (cl.hairStyle) look.hairStyle = cl.hairStyle as HairStyle;
  if (cl.beard) look.beard = cl.beard as Beard;
  if (cl.belt) look.belt = cl.belt;
  if (cl.emblem) look.emblem = cl.emblem as Emblem;
  if (look.head === 'hood') look.headStyle = c.classId === 'occultist' ? 'deep' : 'ranger';
  if (c.classId === 'occultist') look.eyeGlow = '#ffd27a'; // the Zealot's eyes burn like dawn (D121)
  // the person from the character creator (old saves have none: the class look stands)
  const ap = c.appearance;
  if (ap) {
    if (ap.sex === 'female') look.female = true;
    look.skin = ap.skin;
    look.hair = ap.hair;
    look.hairStyle = ap.hairStyle;
    look.beard = ap.beard;
    if (ap.eyes) look.eyes = ap.eyes;
    look.eyeShape = ap.eyeShape;
    look.nose = ap.nose;
    look.brows = ap.brows;
    look.mark = ap.mark;
    look.armL = ap.armL;
    look.armR = ap.armR;
    look.legL = ap.legL;
    look.legR = ap.legR;
  }
  // an empty armor slot is bare, whatever the class (D176): no hat, a bare chest with a loincloth, bare legs, as the
  // Nobody wears it; the class's tunic, hood and trousers came off with the armor
  if (!c.equipment.head) {
    look.head = 'none';
    delete look.headStyle;
    delete look.eyeGlow;
  }
  if (!c.equipment.body) {
    look.body = 'loincloth';
    delete look.belt;
    delete look.emblem;
  }
  if (!c.equipment.legs) look.legs = 'bare';
  // armor pieces: the set's base look from armor.ts, the fantasy dressing from armorLooks.ts
  const head = c.equipment.head && parseArmorBase(c.equipment.head.baseId);
  if (head?.set) {
    look.head = (HEAD_OVERRIDE[head.set.id] ?? head.set.look.head) as HeadGear;
    look.headColor = head.set.look.color;
    look.headTrim = head.set.look.trim;
    delete look.headStyle;
    delete look.eyeGlow;
    Object.assign(look, ARMOR_LOOKS[head.set.id]?.head);
  }
  const body = c.equipment.body && parseArmorBase(c.equipment.body.baseId);
  if (body?.set) {
    look.body = body.set.look.body as BodyGear;
    look.bodyColor = body.set.look.color;
    look.trim = body.set.look.trim;
    delete look.belt;
    delete look.emblem;
    Object.assign(look, ARMOR_LOOKS[body.set.id]?.body);
  }
  const legs = c.equipment.legs && parseArmorBase(c.equipment.legs.baseId);
  if (legs && !legs.set) {
    look.body = c.equipment.body ? look.body : 'loincloth';
    look.legs = 'bare';
  } else if (legs?.set) {
    look.legsColor = shade(legs.set.look.color, 0.8);
    // worn leg armor always shows, even under a bare chest (a loincloth body would otherwise draw bare legs)
    look.legs = 'trousers';
    Object.assign(look, ARMOR_LOOKS[legs.set.id]?.legs);
  }
  return look;
}

/**
 * A character standing idle as they are now (D170): their creator look, worn armor, and the weapon, shield or staff
 * they hold, posed as an idle player is in the game (menus and the co-op lobby; no entity needed).
 */
export function drawCharacterPreview(ctx: CanvasRenderingContext2D, c: Character, o: { x: number; y: number; facing: number; t: number; scale: number }): void {
  const look = lookFor(c);
  const mainItem = c.equipment.main;
  const wDraw = (mainItem && (WEAPONS[mainItem.baseId]?.draw ?? CASTING_TOOLS[mainItem.baseId]?.draw)) || 'w_fists';
  const legendName = mainItem?.rarity === 'legendary' ? mainItem.name : undefined;
  const offItem = c.equipment.off;
  const shield = offItem ? SHIELDS[offItem.baseId] : undefined;
  const tool = offItem ? CASTING_TOOLS[offItem.baseId] : undefined;
  const two = c.twoHanded;
  const paired = isPairedWeapon(wDraw);
  const f = o.facing;
  const rot = two && !paired ? 1.0 : 0.7 + Math.sin(o.t * 2) * 0.03;
  const ha = f + 0.9 + (rot - 0.7) * 0.55;
  const main: HandPose = { x: Math.cos(ha) * 10, y: Math.sin(ha) * 10 + 2, a: f + rot, draw: (g) => drawWeapon(g, wDraw, o.t, legendName) };
  let off: HandPose | undefined;
  if (paired && two) off = { x: Math.cos(f - 0.9) * 10, y: Math.sin(f - 0.9) * 10 + 2, a: f - rot * 0.8, draw: (g) => drawWeapon(g, wDraw, o.t, legendName) };
  else if (!two && shield) off = { x: Math.cos(f - 1.1) * 13, y: Math.sin(f - 1.1) * 13 + 2, a: Math.cos(f) * 0.18, hold: 'shield', draw: (g) => drawShield(g, shield.draw) };
  else if (!two && tool) off = { x: Math.cos(f - 1.1) * 13, y: Math.sin(f - 1.1) * 13 + 2, a: f - 0.4, draw: (g) => drawTool(g, tool.draw, o.t) };
  else if (!two && offItem && WEAPONS[offItem.baseId]?.eitherHand) {
    const od = WEAPONS[offItem.baseId]!.draw;
    off = { x: Math.cos(f - 1.0) * 12, y: Math.sin(f - 1.0) * 12 + 2, a: f - 0.5, draw: (g) => drawWeapon(g, od, o.t) };
  }
  drawJoe(ctx, look, { x: o.x, y: o.y, facing: f, t: o.t, moving: 0, scale: o.scale, twoHanded: two && !paired, main, ...(off ? { off } : {}) });
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** What a player's weapon did last in a skill, to ease it back to rest afterwards (D234). */
interface SkillMemo {
  id: string;
  rot: number;
  ext: number;
  at: number;
  leapStart: number;
  leapUntil: number;
  /** a charged skill: held wound up while charging, swung when let go */
  charging: boolean;
  releaseAt: number;
}
const skillMemo = new WeakMap<Entity, SkillMemo>();
const SKILL_EASE_BACK_S = 0.16;

/**
 * The weapon during a weapon skill (D234): its windup, the strike when it fires, held high through a leap or out
 * through a dash, round and round through a spin it channels, then eased back to rest. Null when no skill is playing.
 */
function skillPose(e: Entity, now: number, rest: { rot: number; ext: number }): { rot: number; ext: number; flip: boolean } | null {
  const pl = e.pl!;
  const a = pl.action;
  let memo = skillMemo.get(e);
  if (a?.kind === 'skill') {
    if (!memo || memo.id !== a.id || memo.at < now - 1) {
      memo = { id: a.id, rot: rest.rot, ext: rest.ext, at: now, leapStart: 0, leapUntil: 0, charging: false, releaseAt: -1 };
      skillMemo.set(e, memo);
    }
  }
  if (!memo) return null;
  const m = skillMotion(memo.id);
  let pose: { rot: number; ext: number } | null = null;
  const f = e.forced;
  if (f && (f.kind === 'leap' || f.kind === 'dash') && f.until > now && (m.motion === 'leap' || m.motion === 'lunge')) {
    if (memo.leapUntil !== f.until) {
      memo.leapStart = now;
      memo.leapUntil = f.until;
    }
    pose = f.kind === 'leap' ? leapPose((now - memo.leapStart) / Math.max(0.05, f.until - memo.leapStart)) : dashPose();
  } else if (a?.kind === 'skill') {
    const wind = Math.min(1, a.t / Math.max(0.001, a.castS));
    const hit = a.t <= a.castS ? 0 : Math.min(1, (a.t - a.castS) / SKILL_RECOVER_S);
    pose = skillWeaponPose(m, wind, Math.max(hit, a.fired ? 0.001 : 0));
  } else if (pl.charge) {
    memo.charging = true;
    pose = skillWeaponPose(m, 1, 0);
  } else if (memo.charging || (memo.releaseAt >= 0 && now - memo.releaseAt < SKILL_RECOVER_S)) {
    if (memo.charging) {
      memo.charging = false;
      memo.releaseAt = now;
    }
    pose = skillWeaponPose(m, 1, Math.max(0.001, (now - memo.releaseAt) / SKILL_RECOVER_S));
  } else if (pl.channel && pl.channel.source === 'skill' && pl.channel.until > now) {
    pose = channelPose(m, now, pl.channel.tickS);
  }
  if (pose) {
    memo.rot = pose.rot;
    memo.ext = pose.ext;
    memo.at = now;
    // the edge leads: a blade turning toward its local +y is drawn mirrored (as a combo swing, D104)
    return { ...pose, flip: m.motion === 'chop' || m.motion === 'sweep' || m.motion === 'crack' || m.motion === 'leap' };
  }
  // just finished: back to rest over a moment instead of snapping
  const k = (now - memo.at) / SKILL_EASE_BACK_S;
  if (k >= 1 || pl.combo || pl.blocking) {
    skillMemo.delete(e);
    return null;
  }
  const s = k * k * (3 - 2 * k);
  return { rot: lerp(memo.rot, rest.rot, s), ext: lerp(memo.ext, rest.ext, s), flip: false };
}

/**
 * A weapon's pose relative to facing: its angle and how far it is pushed out; an overhead's foreshortening (`len`, the
 * weapon raised toward the camera looks shorter), a whip's stretch to its lash, and a spin's hand that orbits all the way round.
 */
interface WeaponPose {
  rot: number;
  ext: number;
  len?: number;
  stretch?: number;
  orbit?: boolean;
}

/** Weapon angle relative to facing for the current swing phase. */
function weaponPose(e: Entity): WeaponPose {
  const pl = e.pl!;
  // an off-hand shot (D291) leaves the main weapon at rest
  const c = pl.combo?.offHand ? null : pl.combo;
  if (!c) {
    if (pl.blocking) return { rot: -0.9, ext: 0 };
    // a staff or talisman in the weapon hand points at the target while it casts (D117)
    const a = pl.action;
    if (a?.kind === 'spell' && pl.derived.mainTool && SPELLS[a.id]?.school === pl.derived.mainTool.def.school) {
      const k = Math.min(1, a.t / Math.max(0.05, a.castS) + 0.4);
      return { rot: lerp(0.7, 0.1, k), ext: 4 * k };
    }
    return { rot: 0.7 + Math.sin(e.anim.t * 2) * 0.03, ext: 0 };
  }
  const hb = c.swing.hitbox;
  const k = Math.min(1, c.t / Math.max(0.001, c.dur));
  const move = moveOf(c);
  const reach = e.pl!.derived.reachMult;
  // a whip's lash (D320): the arm stays put and the whip itself runs out to the hit's length, then coils back
  if (move === 'lash' && hb.shape === 'thrust') {
    const full = (hb.l * reach) / WHIP_LEN;
    if (c.phase === 'windup') return { rot: lerp(0.7, -0.25, k), ext: -4 * k, stretch: 1 };
    if (c.phase === 'active') return { rot: lerp(-0.25, 0, k), ext: 0, stretch: lerp(1, full, Math.min(1, k * 2.5)) };
    return { rot: lerp(0, 0.7, k), ext: 0, stretch: lerp(full, 1, Math.min(1, k * 1.6)) };
  }
  if (hb.shape === 'thrust') {
    if (c.phase === 'windup') return { rot: 0, ext: -10 * k };
    if (c.phase === 'active') return { rot: 0, ext: lerp(-10, hb.l * 0.35, k) };
    return { rot: 0, ext: lerp(hb.l * 0.35, 0, k) };
  }
  if (hb.shape === 'proj') {
    // a thrown ring (D320): drawn back across the body, flung out on the release
    if (move !== 'throw') return { rot: 0, ext: 0 };
    if (c.phase === 'windup') return { rot: lerp(0.7, 1.9, k), ext: -4 * k };
    if (c.phase === 'active') return { rot: lerp(1.9, -0.4, k), ext: 8 };
    return { rot: lerp(-0.4, 0.7, k), ext: lerp(8, 0, k) };
  }
  // an overhead (D320): raised high (foreshortened, seen from above) in the windup, brought down to full length
  if (hb.shape === 'circle') {
    if (c.phase === 'windup') return { rot: lerp(0.7, 0, k), ext: lerp(0, -8, k), len: lerp(1, 0.35, k) };
    if (c.phase === 'active') return { rot: 0, ext: lerp(-8, 6, k), len: lerp(0.35, 1.12, Math.min(1, k * 1.4)) };
    return { rot: lerp(0, 0.7, k), ext: lerp(6, 0, k), len: lerp(1.12, 1, k) };
  }
  const dir = swingDir(c);
  // a spin (D320): wound back, then the blade goes all the way round the player
  if (move === 'spin') {
    if (c.phase === 'windup') return { rot: lerp(0.7 * dir, 1.4 * dir, k), ext: 0, orbit: true };
    if (c.phase === 'active') return { rot: (1.4 - Math.PI * 2 * k) * dir, ext: 6, orbit: true };
    return { rot: lerp((1.4 - Math.PI * 2) * dir, 0.7 * dir - Math.PI * 2 * dir, k), ext: lerp(6, 0, k), orbit: true };
  }
  const half = (hb.angleDeg * DEG) / 2;
  // a whip's sideways crack runs out to its full length too
  const sweepStretch = move === 'lashSweep' ? (hb.r * reach) / WHIP_LEN : 0;
  if (c.phase === 'windup') return { rot: lerp(0.7 * dir, -half * dir - 0.3 * dir, k), ext: 0, ...(sweepStretch ? { stretch: lerp(1, 1.4, k) } : {}) };
  if (c.phase === 'active') return { rot: lerp(-half * dir - 0.3 * dir, half * dir, k), ext: sweepStretch ? 0 : 4, ...(sweepStretch ? { stretch: lerp(1.4, sweepStretch, Math.min(1, k * 3)) } : {}) };
  return { rot: lerp(half * dir, 0.7 * dir, k), ext: 0, ...(sweepStretch ? { stretch: lerp(sweepStretch, 1, Math.min(1, k * 1.6)) } : {}) };
}

/** A plain whip's drawn length at rest (engine/draw/weapons.ts whip()), for stretching it to a lash's reach. */
const WHIP_LEN = 60;

/** How a combo step moves (D320): its own `move`, else an arc slashes by its place in the combo and a thrust thrusts. */
function moveOf(c: { swing: SwingDef; idx: number }): SwingMove {
  if (c.swing.move) return c.swing.move;
  const hb = c.swing.hitbox;
  return hb.shape === 'thrust' ? 'thrust' : hb.shape === 'circle' ? 'overhead' : hb.shape === 'proj' ? 'throw' : c.idx % 2 === 0 ? 'slash' : 'backslash';
}

/** Which way an arc swing turns: +1 a slash, −1 a backslash; a whip's crack and a spin alternate by place. */
function swingDir(c: { swing: SwingDef; idx: number }): 1 | -1 {
  const m = moveOf(c);
  if (m === 'slash') return 1;
  if (m === 'backslash') return -1;
  return c.idx % 2 === 0 ? 1 : -1;
}

/**
 * The dot at a player's feet in their eye colour (D262), drawn over the bodies and the attack markers so it shows
 * through any area: it is exactly what an area attack tests, so a dot clear of a marker is safe.
 */
export function drawPlayerDot(ctx: CanvasRenderingContext2D, e: Entity, x: number, cy: number): void {
  const y = cy + PLAYER_DOT_DY;
  const pl = e.pl;
  if (!pl || pl.deadUntilRest || pl.downed || e.hp?.dead) return;
  const eyes = pl.char.appearance?.eyes || '#5a3a22';
  ctx.save();
  ctx.globalAlpha = e.anim.alpha;
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_DOT_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4efe4';
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_DOT_R - 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = eyes;
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_DOT_R - 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPlayerEntity(ctx: CanvasRenderingContext2D, w: World, e: Entity, x: number, y: number, now: number, isLocal: boolean): void {
  const pl = e.pl!;
  if (pl.deadUntilRest) return;
  const look = lookFor(pl.char);
  const wDraw = pl.derived.weapon.draw;
  const wItem = pl.derived.weaponItem;
  // a weapon buffed with an element (Bless Weapon, Consecrate…) glows that element's colour (D129)
  // (only on a weapon: a staff or talisman swapped into the hand mid-buff does not glow, D131)
  const buffEl = pl.derived.mainTool || !wItem ? null : weaponBuffElement(e, now);
  const legendName = wItem?.rarity === 'legendary' ? wItem.name : undefined;
  const offItem = pl.char.equipment.off;
  const shield = offItem ? SHIELDS[offItem.baseId] : undefined;
  const tool = offItem ? CASTING_TOOLS[offItem.baseId] : undefined;
  const two = pl.char.twoHanded;
  const basePose = weaponPose(e);
  const restRot = !pl.combo && two && !pl.blocking && !isPairedWeapon(wDraw) ? 1.0 : basePose.rot;
  // a weapon skill moves the weapon itself (D234); a staff or talisman in the weapon hand casts as before
  const sk = pl.downed || pl.combo || pl.derived.mainTool ? null : skillPose(e, now, { rot: restRot, ext: basePose.ext });
  const pose = sk ?? basePose;
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
  // hands: the main hand orbits the body with the swing so the arm carries the blade; the off hand holds
  // the shield (raised when blocking), the staff (thrust forward while casting) or the second weapon
  const f = e.facing;
  const rot = sk ? sk.rot : restRot;
  // a spin (D320) carries the hand all the way round the body
  const ha = !sk && basePose.orbit ? f + rot : f + 0.9 + (rot - 0.7) * 0.55;
  const wa = f + rot;
  // which way the current arc swing turns: increasing angle moves the blade toward its local +y (D104)
  const edgeFlip = sk ? sk.flip : !!pl.combo && pl.combo.swing.hitbox.shape === 'arc' && swingDir(pl.combo) === 1;
  const len = sk ? 1 : (basePose.len ?? 1);
  const stretch = sk ? 1 : (basePose.stretch ?? 1);
  const main: HandPose | undefined = ghost
    ? undefined
    : {
        x: Math.cos(ha) * 10 + Math.cos(wa) * pose.ext,
        y: Math.sin(ha) * 10 + 2 + Math.sin(wa) * pose.ext,
        a: wa,
        draw: (c) => {
          // the cutting edge is drawn on the weapon's −y side: on swings that turn the other way, mirror it so the
          // edge leads the swing (D104)
          if (edgeFlip) c.scale(1, -1);
          // proficiency reach (D178): the weapon itself grows a little longer (a whip slowly gets bigger)
          if (pl.derived.reachMult > 1 && stretch === 1) c.scale(pl.derived.reachMult, 1);
          // an overhead raised toward the camera looks shorter (D320)
          if (len !== 1) c.scale(len, 1);
          drawWeapon(c, wDraw, now, legendName, charging, stretch);
          if (buffEl) drawBuffGlow(c, buffEl, now, e.id);
        },
      };
  let off: HandPose | undefined;
  // paired weapons (twin daggers/axes): one-handed shows only the main-hand blade plus the usual off-hand
  // item; two-handed shows both blades and never a shield or staff
  const paired = isPairedWeapon(wDraw);
  const dual = paired && two;
  if (!ghost && dual) {
    off = { x: Math.cos(f - 0.9) * 10, y: Math.sin(f - 0.9) * 10 + 2, a: f - pose.rot * 0.8, draw: (c) => {
        if (pl.combo && pl.combo.swing.hitbox.shape === 'arc' && !edgeFlip) c.scale(1, -1);
        drawWeapon(c, wDraw, now, legendName);
        if (buffEl) drawBuffGlow(c, buffEl, now, e.id + 7);
      } };
  } else if (!ghost && !two) {
    const blockLayer: 'front' | 'back' = Math.sin(f) < -0.35 ? 'back' : 'front';
    if (shield) {
      const side = pl.blocking ? 0.15 : -1.1;
      // the shield stays upright whichever way Joe faces, leaning a touch toward his facing (D113); it used to spin with him
      off = { x: Math.cos(f + side) * 13, y: Math.sin(f + side) * 13 + 2, a: Math.cos(f) * 0.18, hold: 'shield', draw: (c) => drawShield(c, shield.draw), ...(pl.blocking ? { layer: blockLayer } : {}) };
    } else if (tool) {
      // thrust forward only when this off-hand tool is the one casting (not a main-hand tool of the same school)
      const castsHere = pl.action?.kind === 'spell' && toolForSchool(pl.derived, SPELLS[pl.action.id]?.school ?? 'brain')?.hand === 'off';
      const cast = pl.state === 'cast' && pl.action && castsHere ? Math.min(1, pl.action.t / Math.max(0.05, pl.action.castS) + 0.4) : 0;
      const side = -1.1 + 0.7 * cast;
      const rad = 13 + 2 * cast;
      off = { x: Math.cos(f + side) * rad, y: Math.sin(f + side) * rad + 2, a: f - 0.4 + 0.32 * cast, draw: (c) => drawTool(c, tool.draw, now) };
    } else if (pl.derived.offWeapon) {
      // a crossbow in the off hand (D291): held low at the side, raised and aimed while it shoots
      const ow = pl.derived.offWeapon.def;
      const aiming = pl.combo?.offHand ? 1 : 0;
      const side = -1.0 + 0.75 * aiming;
      off = { x: Math.cos(f + side) * 12, y: Math.sin(f + side) * 12 + 2, a: f - 0.5 * (1 - aiming), draw: (c) => drawWeapon(c, ow.draw, now) };
    }
  }
  // walking with something in hand: the arms swing with the stride as free hands do (D176), weapon hand forward as the
  // off hand goes back; less for two-handed grips and shields; never while attacking, blocking, casting or dodging
  const moving = (e.anim as { moving?: number }).moving ?? 0;
  if (moving > 0.05 && pl.state === 'idle' && !pl.combo && !pl.blocking && !ghost) {
    const ph = (e.anim.t + now) * 12;
    const k = Math.min(1, moving);
    const s = Math.sin(ph);
    if (main) {
      const g = two && !dual ? 0.5 : 1;
      const sw = -s * 3.2 * k * g;
      main.x += Math.cos(f) * sw;
      main.y += Math.sin(f) * sw * 0.6;
      main.a += s * 0.16 * k * g;
    }
    if (off) {
      const g = shield ? 0.6 : 1;
      const sw = s * 3.2 * k * g;
      off.x += Math.cos(f) * sw;
      off.y += Math.sin(f) * sw * 0.6;
      if (!shield) off.a -= s * 0.12 * k;
    }
  }
  const drink = pl.state === 'flask' ? Math.max(0.01, Math.min(1, 1 - (pl.stateUntil - now) / FLASK_DRINK_S)) : 0;
  drawJoe(ctx, look, {
    x,
    y,
    facing: f,
    t: e.anim.t + now,
    moving: (e.anim as { moving?: number }).moving ?? 0,
    squash: e.anim.squash,
    flash: e.anim.flashUntil > now,
    tint: null,
    alpha: (ghost ? 0.55 : dodge ? 0.75 : 1) * e.anim.alpha,
    ghost,
    scale: e.anim.scale,
    twoHanded: two && !dual,
    blocking: pl.blocking,
    ...(main ? { main } : {}),
    ...(off ? { off } : {}),
    ...(drink > 0 && !ghost ? { drink } : {}),
  });
  // slash arc: the swing drawn as a fading wedge while the hit is live (ART_AUDIO §4)
  const sw = pl.combo;
  const swingGlow = ELEMENTS[pl.derived.weapon.element ?? 'physical'].glow; // the swing shows the weapon's damage type (D81)
  if (!ghost && sw && sw.phase === 'active' && sw.swing.hitbox.shape === 'arc') {
    const hb = sw.swing.hitbox;
    const half = (hb.angleDeg * DEG) / 2;
    const dir = swingDir(sw);
    const k = Math.min(1, sw.t / Math.max(0.001, sw.dur));
    const move = moveOf(sw);
    // a spin (D320) leaves a ring behind the blade as it goes round; a slash a wedge across its arc
    const a0 = move === 'spin' ? e.facing + 1.4 * dir : e.facing - half * dir;
    const a1 = move === 'spin' ? e.facing + (1.4 - Math.PI * 2 * k) * dir : e.facing + (-half + 2 * half * k) * dir;
    // a whip's crack reaches its full length; a blade's trail stays near the body
    const r = move === 'lashSweep' ? hb.r * pl.derived.reachMult * 0.95 : Math.min(hb.r * pl.derived.reachMult, 130) * 0.85;
    ctx.save();
    ctx.globalAlpha = 0.4 * (1 - k * 0.5);
    ctx.strokeStyle = swingGlow;
    ctx.lineWidth = move === 'lashSweep' ? 4 : 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r, Math.min(a0, a1), Math.max(a0, a1));
    ctx.stroke();
    ctx.restore();
  }
  // an overhead's landing (D320): a ring bursts out where it strikes, the size of its hit
  if (!ghost && sw && sw.phase !== 'windup' && sw.swing.hitbox.shape === 'circle') {
    const hb = sw.swing.hitbox;
    const k = Math.min(1, sw.t / Math.max(0.001, sw.dur));
    const t = sw.phase === 'active' ? Math.max(0, k * 1.4 - 0.4) : 1;
    const fade = sw.phase === 'active' ? 1 : 1 - k;
    if (t > 0 && fade > 0) {
      const d = hb.d * pl.derived.reachMult;
      const cx = x + Math.cos(e.facing) * d;
      const cy = y + Math.sin(e.facing) * d;
      ctx.save();
      ctx.globalAlpha = 0.5 * fade;
      ctx.strokeStyle = swingGlow;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, hb.r * (0.4 + 0.6 * t), hb.r * (0.4 + 0.6 * t) * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18 * fade;
      ctx.fillStyle = swingGlow;
      ctx.fill();
      ctx.restore();
    }
  }
  // held in place (D252): grabbed, rooted or frozen. Grey stones bounce round you, tied by a ring, so being stuck
  // never looks like the controls stopped working
  const st = e.st;
  const stuckUntil = Math.max(pl.state === 'held' ? pl.holdUntil : 0, st?.controls.hold ?? 0, st?.controls.root ?? 0, st?.controls.freeze ?? 0);
  if (!ghost && stuckUntil > now) drawImmobilized(ctx, x, y, now, Math.min(1, (stuckUntil - now) / 0.25));
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
    // held by an ally's hit (D202): a pause mark before the seconds
    ctx.fillText(`${now < pl.ghostPauseUntil ? '‖ ' : ''}${Math.max(0, Math.ceil(pl.ghostUntil - now))}s`, x, y - 36);
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

/** Six grey stones bouncing round a stuck player on a grey ring (D252); `k` fades it out as the hold ends. */
export function drawImmobilized(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, k: number): void {
  ctx.save();
  ctx.globalAlpha = 0.8 * k;
  ctx.strokeStyle = '#d0d0d8';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.lineDashOffset = -now * 30;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 28, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = now * 2.2 + (i / n) * Math.PI * 2;
    // each stone hops on its own beat
    const hop = Math.abs(Math.sin(now * 7 + i * 1.3)) * 10;
    const sx = x + Math.cos(a) * 28;
    const sy = y + 6 + Math.sin(a) * 14 - hop;
    const front = Math.sin(a) > 0;
    ctx.globalAlpha = (front ? 1 : 0.75) * k;
    ctx.fillStyle = front ? '#e2e2ea' : '#9a9aa4';
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** How far a boss is through its phase transition (DrawState.trans), only while it is in one. */
function transOf(e: Entity, now: number): { trans?: number } {
  const en = e.en!;
  if (!en.isBoss || en.phaseTransitionUntil <= now) return {};
  const at = en.extrasUsed.__phaseAt;
  if (at === undefined) return {};
  const dur = (en.def as unknown as BossDef).phases?.[en.phase]?.transitionS ?? PHASE_TRANSITION_S;
  return { trans: Math.max(0, Math.min(1, (now - at) / dur)) };
}

/** A boss in a phase transition with its own scripted animation (BossPhase.transitionBeats). */
function scriptedTransition(e: Entity, now: number): boolean {
  const en = e.en!;
  return en.isBoss && en.phaseTransitionUntil > now && !!(en.def as unknown as BossDef).phases?.[en.phase]?.transitionBeats;
}

export function enemyDrawState(e: Entity, x: number, y: number, now: number, pal: string[]): DrawState {
  const en = e.en!;
  // a co-op guest's mirror sets anim.moving from what it saw move (D151); the host measures this tick's step
  const moving = (e.anim as { moving?: number }).moving ?? Math.min(1, Math.hypot(e.x - e.px, e.y - e.py) * 20);
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
    ...transOf(e, now),
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
  // on the ceiling it is not drawn at all (D248; it used to show as a wandering shadow)
  if (en.state === 'ceiling') return;
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
  drawElementUnder(ctx, e, x, y, now);
  // an immune enemy turns to gold while it cannot be hurt (D108), fully solid even if it is otherwise see-through
  // (an invisible Ash Wraith fading after an attack was a ghost of gold at 8%, D164)
  // (a scripted boss transformation, D279, plays in its own colours: the gold would wash it out)
  if (isImmuneNow(e, now) && !scriptedTransition(e, now)) drawGolden(ctx, e, x, y, now, (c, cx, cy) => drawById(c, e.drawId, { ...enemyDrawState(e, cx, cy, now, pal), alpha: 1 }));
  else if (cacheable(e)) {
    // the body through its own cached picture, redrawn at most 24 times a second (D152)
    const st = enemyDrawState(e, x, y, now, pal);
    drawCachedEnemy(ctx, e, x, y, now, e.drawId, st, (c, cx, cy) => drawById(c, e.drawId, { ...st, x: cx, y: cy }));
  } else drawById(ctx, e.drawId, enemyDrawState(e, x, y, now, pal));
  drawElementOver(ctx, e, x, y, now);
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
    case 'p_chakram':
      // a thrown ring (D320) whirls flat as it flies
      chakramRing(ctx, 0, Math.max(7, e.radius * 0.85), now * 22);
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
    case 'e_soccer': {
      // The Instructor's soccer balls (D110): white with black pentagons, spinning as they fly
      const R = Math.max(7, e.radius);
      ctx.rotate(now * 9);
      blob(ctx, 0, 0, R, R, { fill: '#f4f4ee', under: '#cfcfc6', outlineW: 1.6 });
      ctx.fillStyle = '#1a1a1e';
      const pent = (cx: number, cy: number, s: number): void => {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
          if (i === 0) ctx.moveTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
          else ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
        }
        ctx.closePath();
        ctx.fill();
      };
      pent(0, 0, R * 0.36);
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        pent(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, R * 0.24);
      }
      break;
    }
    case 'e_basketball': {
      // The Instructor's basketball (D110): orange with black seams, tumbling through its lob
      const R = Math.max(9, e.radius);
      ctx.rotate(now * 5);
      blob(ctx, 0, 0, R, R, { fill: '#e8742a', under: '#b5501a', outlineW: 1.8 });
      ctx.strokeStyle = '#1a1210';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-R, 0);
      ctx.lineTo(R, 0);
      ctx.moveTo(0, -R);
      ctx.lineTo(0, R);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-R * 1.15, 0, R * 0.85, -0.95, 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(R * 1.15, 0, R * 0.85, Math.PI - 0.95, Math.PI + 0.95);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(-R * 0.35, -R * 0.4, R * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
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

export function drawHazardEntity(ctx: CanvasRenderingContext2D, e: Entity, now: number, color: string, danger = false): void {
  const hz = e.hz!;
  const life = Math.max(0, hz.until - now);
  const fade = Math.min(1, life / 0.6);
  if (danger) {
    drawDangerHazard(ctx, hz.shapes, now, color, fade);
    return;
  }
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

/**
 * A hazard that hurts, drawn so nobody mistakes it for decoration (D251): a toxic glow that pulses, dark hazard
 * stripes crawling across it, a bright edge, and spines poking out of it. Lines and circles (thorn walls, Thorn Burst).
 */
function drawDangerHazard(ctx: CanvasRenderingContext2D, shapes: readonly Shape[], now: number, color: string, fade: number): void {
  const pulse = 0.5 + 0.5 * Math.sin(now * 4);
  for (const s of shapes) {
    if (s.k !== 'line' && s.k !== 'circle') continue;
    ctx.save();
    const path = new Path2D();
    let cx: number;
    let cy: number;
    let span: number;
    if (s.k === 'line') {
      const ca = Math.cos(s.a);
      const sa = Math.sin(s.a);
      const hw = s.w / 2;
      path.moveTo(s.x - sa * hw, s.y + ca * hw);
      path.lineTo(s.x + ca * s.l - sa * hw, s.y + sa * s.l + ca * hw);
      path.lineTo(s.x + ca * s.l + sa * hw, s.y + sa * s.l - ca * hw);
      path.lineTo(s.x + sa * hw, s.y - ca * hw);
      path.closePath();
      cx = s.x + (ca * s.l) / 2;
      cy = s.y + (sa * s.l) / 2;
      span = s.l / 2 + s.w;
    } else {
      path.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      cx = s.x;
      cy = s.y;
      span = s.r;
    }
    // the glow under it, then the fill
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 + pulse * 14;
    ctx.globalAlpha = (0.32 + pulse * 0.18) * fade;
    ctx.fillStyle = color;
    ctx.fill(path);
    ctx.shadowBlur = 0;
    // dark stripes crawling across it, clipped to the shape
    ctx.clip(path);
    ctx.globalAlpha = 0.35 * fade;
    ctx.strokeStyle = '#141a04';
    ctx.lineWidth = 9;
    const off = (now * 30) % 28;
    ctx.beginPath();
    for (let d = -span * 2 - 28; d < span * 2 + 28; d += 28) {
      ctx.moveTo(cx + d + off - span, cy - span);
      ctx.lineTo(cx + d + off + span, cy + span);
    }
    ctx.stroke();
    // spines: short dark thorns tipped with the glow colour, fixed in place
    ctx.globalAlpha = 0.8 * fade;
    ctx.lineWidth = 2;
    const n = Math.max(6, Math.floor((s.k === 'line' ? s.l : s.r * 6) / 26));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const h1 = Math.sin(i * 12.9898 + s.x * 0.01) * 43758.5453;
      const jit = h1 - Math.floor(h1);
      let px: number;
      let py: number;
      let ang: number;
      if (s.k === 'line') {
        const side = (jit - 0.5) * s.w * 0.8;
        px = s.x + Math.cos(s.a) * s.l * u - Math.sin(s.a) * side;
        py = s.y + Math.sin(s.a) * s.l * u + Math.cos(s.a) * side;
        ang = s.a + Math.PI / 2 + (jit - 0.5) * 1.6;
      } else {
        const a = u * Math.PI * 2;
        const rr = s.r * (0.3 + jit * 0.6);
        px = s.x + Math.cos(a) * rr;
        py = s.y + Math.sin(a) * rr;
        ang = a + (jit - 0.5) * 1.2;
      }
      ctx.strokeStyle = '#1c2608';
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(ang) * 6, py - Math.sin(ang) * 6);
      ctx.lineTo(px + Math.cos(ang) * 8, py + Math.sin(ang) * 8);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px + Math.cos(ang) * 8, py + Math.sin(ang) * 8, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // the bright edge
    ctx.save();
    ctx.globalAlpha = (0.65 + pulse * 0.35) * fade;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke(path);
    ctx.restore();
  }
}

/** Glowen (D83): a ghostly green blob of ectoplasm with a wobbling skin and a wisp of tail; bigger for more. */
export const GLOWEN_COLOR = '#9dffcf';
/** Soul Essence (D198): a small soul-flame with a face, its tier's colour, a beam, and one orbiting spark per tier. */
export function drawEssence(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, color: string, tier: number): void {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y - 130, x, y);
  grad.addColorStop(0, withAlpha(color, 0));
  grad.addColorStop(1, withAlpha(color, 0.45));
  ctx.fillStyle = grad;
  ctx.fillRect(x - 5, y - 130, 10, 130);
  ctx.restore();
  const bob = Math.sin(now * 2.4) * 2;
  glow(ctx, x, y + bob, 24 + tier * 2, color, 0.6);
  ctx.save();
  ctx.translate(x, y + bob);
  // the flame: a teardrop whose tip flickers
  const tip = Math.sin(now * 7) * 2.2;
  ctx.beginPath();
  ctx.moveTo(tip, -15);
  ctx.bezierCurveTo(7 + tip * 0.3, -8, 9, -1, 7, 4);
  ctx.bezierCurveTo(5, 9, -5, 9, -7, 4);
  ctx.bezierCurveTo(-9, -1, -7 + tip * 0.3, -8, tip, -15);
  ctx.closePath();
  ctx.fillStyle = withAlpha(color, 0.9);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  // a paler core
  ctx.beginPath();
  ctx.ellipse(0, 2, 3.6, 4.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha('#ffffff', 0.55);
  ctx.fill();
  // whoever it was, still a little surprised
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(-2.2, -0.5, 1.1, 0, Math.PI * 2);
  ctx.arc(2.2, -0.5, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 3.2, 1, 0, Math.PI * 2);
  ctx.fill();
  // one spark per tier
  for (let i = 0; i < tier; i++) {
    const a = now * 1.8 + (i / tier) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 13, Math.sin(a) * 5 - 2, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(color, 0.95);
    ctx.fill();
  }
  ctx.restore();
}

function drawGlowenWisp(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, id: number, amount: number): void {
  const s = Math.min(1.8, 0.75 + Math.log10(Math.max(1, amount)) * 0.35);
  glow(ctx, x, y, 22 * s, GLOWEN_COLOR, 0.55 + Math.sin(now * 4 + id) * 0.1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // a trailing wisp that curls upward
  ctx.strokeStyle = withAlpha(GLOWEN_COLOR, 0.45);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(Math.sin(now * 3 + id) * 6, -12, Math.sin(now * 2.2 + id) * 4, -18);
  ctx.stroke();
  // the wobbling blob
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 6.5 + Math.sin(a * 3 + now * 5 + id) * 1.1;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.85 + (Math.sin(a) > 0 ? 1.5 : 0);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = withAlpha(GLOWEN_COLOR, 0.75);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#2f8a66', 0.9);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // two faint eye-holes: it was alive once
  ctx.fillStyle = withAlpha('#1f5a44', 0.55);
  ctx.beginPath();
  ctx.arc(-2.2, -1, 1.1, 0, Math.PI * 2);
  ctx.arc(2.2, -1, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(-3, -3.5, 1.3, 0, Math.PI * 2);
  ctx.fill();
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
  if (pk.kind === 'glowen') {
    drawGlowenWisp(ctx, x, y, now, e.id, pk.amount);
    return;
  }
  if (pk.kind === 'essence') {
    drawEssence(ctx, x, y, now, essenceDef(pk.essenceTier ?? 1).color, pk.essenceTier ?? 1);
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
  } else if (pk.kind === 'consumable') {
    blob(ctx, x, y, 6, 7, { fill: '#b08d6a' });
  } else if (pk.kind === 'spell') {
    blob(ctx, x, y, 8, 8, { fill: '#c58cff' });
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
    if (c && c.phase === 'active' && c.swing.hitbox.shape === 'circle') {
      ctx.strokeStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(e.facing) * c.swing.hitbox.d, e.y + Math.sin(e.facing) * c.swing.hitbox.d, c.swing.hitbox.r, 0, Math.PI * 2);
      ctx.stroke();
    }
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
