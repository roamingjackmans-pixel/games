// The player controller (GAME_DESIGN §4–5): input → movement, light combos, dodge, block, parry,
// two-hand toggle, flask, skills/spells hooks. Runs on the host for every player (guests send inputs).
import { emptyInput, held, pressed } from '../../engine/input/actions';
import { T } from '../room';
import { DEG, angleDiff, coneHit, dist, lineHit } from '../../engine/math';
import { flaskHeal } from '../combat/formulas';
import { addRevive, applyControl, cleanse, emptySpec, heal, hitEnemy, rawDamage, typeColor } from '../combat/damage';
import { buffSum, hasControl, speedMult } from '../combat/state';
import { computeDerived } from './derived';
import { tryCastSpell, tryUseConsumable, tryUseSkill, updatePlayerAction } from '../skills/use';
import type { Character, DamageType, SwingDef } from '../types';
import { DAMAGE_TYPES } from '../types';
import { newStatus, type DamageSpec, type Entity, type PlayerC, type World } from '../world';

/** walking speed while swinging, by weapon speed class (D88) */
const ATTACK_MOVE: Record<string, number> = { veryfast: 0.6, fast: 0.52, medium: 0.42, mediumslow: 0.33, slow: 0.25, veryslow: 0.18 };
export const DODGE_S = 0.45;
export const DODGE_DIST = 220;
export const DODGE_IFRAME_FROM = 0.05;
export const DODGE_IFRAME_TO = 0.4;
export const DODGE_STAMINA = 10;
export const FLASK_DRINK_S = 1.2;
export const FLASK_HEAL_S = 1.5;
export const GHOST_SPEED = 90;
export const GHOST_TIME = 30;
export const PLAYER_RADIUS = 14;

export function spawnPlayer(w: World, char: Character, slot: number, local: boolean, x: number, y: number): Entity {
  const derived = computeDerived(char);
  const pl: PlayerC = {
    slot,
    playerId: char.playerId,
    name: char.name,
    char,
    derived,
    local,
    input: emptyInput(),
    prevButtons: 0,
    state: 'idle',
    stateUntil: 0,
    combo: null,
    comboResetAt: 0,
    nextComboIdx: 0,
    blocking: false,
    blockToggled: false,
    parryUntil: 0,
    parryReadyAt: 0,
    guardBrokenUntil: 0,
    dodgeReadyAt: 0,
    lastBowHintAt: -9,
    dodgeRechargeTotal: derived.dodgeRecharge,
    dodgeUntil: 0,
    dodgeDir: [1, 0],
    iframesFrom: 0,
    iframesUntil: 0,
    iframeKind: 'all',
    stamDelayUntil: 0,
    riposteBuffUntil: 0,
    riposteTarget: 0,
    skillReadyAt: [0, 0, 0],
    spellReadyAt: [0, 0, 0],
    action: null,
    channel: null,
    charge: null,
    flaskT: 0,
    healOver: [],
    downed: false,
    ghostUntil: 0,
    reviveProgress: 0,
    reviveNeed: 10,
    downs: 0,
    deadUntilRest: false,
    lastLightAttackAt: -10,
    momentum: 0,
    hitCounter: 0,
    stillSince: 0,
    holdBy: 0,
    holdUntil: 0,
    holdDmg: 0,
    holdType: 'physical',
    holdStatus: null,
    aimX: x + 100,
    aimY: y,
    aimNeutral: false,
    falling: null,
    nextSpellFree: null,
    flaskBoost: null,
    stanceUntil: 0,
    stanceRiposteMult: 3,
    link: null,
    attached: [],
    timeSlow: 1,
    pastPos: [],
    shardsGained: 0,
    inBossRoom: false,
    lastFootstep: 0,
    pendingLoot: [],
    pendingGems: [],
    pendingConsumables: [],
    remote: false,
  };
  const e = w.spawn('player', x, y, {
    radius: PLAYER_RADIUS,
    team: 0,
    solid: true,
    drawId: 'joe',
    hp: {
      hp: derived.maxHp,
      max: derived.maxHp,
      poise: 0,
      poiseMax: 0,
      poiseRegenAt: 0,
      invulnUntil: 0,
      barrier: 0,
      barrierUntil: 0,
      staggerUntil: 0,
      riposteUntil: 0,
      lastHitAt: -10,
      lastHitBy: 0,
      dead: false,
    },
    stam: { cur: derived.maxStam, max: derived.maxStam },
    st: newStatus(),
    buffs: [],
    pl,
  });
  return e;
}

/** Recompute derived stats after equipment/stat/two-hand changes, keeping HP and stamina fractions. */
export function refreshDerived(e: Entity): void {
  const pl = e.pl!;
  const hpFrac = e.hp!.max > 0 ? e.hp!.hp / e.hp!.max : 1;
  const stFrac = e.stam!.max > 0 ? e.stam!.cur / e.stam!.max : 1;
  pl.derived = computeDerived(pl.char);
  e.hp!.max = pl.derived.maxHp;
  e.hp!.hp = Math.max(e.hp!.dead ? 0 : 1, Math.min(e.hp!.max, Math.round(hpFrac * e.hp!.max)));
  e.stam!.max = pl.derived.maxStam;
  e.stam!.cur = Math.min(e.stam!.max, stFrac * e.stam!.max);
}

function canAct(w: World, e: Entity): boolean {
  const pl = e.pl!;
  const now = w.time;
  if (pl.downed || pl.deadUntilRest || pl.falling) return false;
  if (hasControl(e, 'freeze', now) || hasControl(e, 'hold', now)) return false;
  if (w.inputLock > now) return false;
  return pl.state === 'idle';
}

export function attackSpeedOf(w: World, e: Entity): number {
  const pl = e.pl!;
  let s = pl.derived.attackSpeed * (1 + buffSum(e, 'attackSpeedPct', w.time));
  if (e.st && e.st.active.chill > w.time) s *= 0.7;
  s *= pl.timeSlow;
  return Math.max(0.3, Math.min(1.6 * pl.timeSlow, s));
}

function staminaCostMult(w: World, e: Entity): number {
  return e.pl!.derived.stamCost * Math.max(0.2, 1 + buffSum(e, 'staminaCostPct', w.time));
}

export function spendStamina(w: World, e: Entity, amount: number): boolean {
  const s = e.stam!;
  if (s.cur <= 0 && amount > 0) return false;
  s.cur = Math.max(0, s.cur - amount * staminaCostMult(w, e));
  e.pl!.stamDelayUntil = w.time + 0.6;
  return true;
}

/** The aim angle, with gamepad melee auto-targeting and projectile aim assist (GAME_DESIGN §4, §5.1). */
export function aimAngle(w: World, e: Entity, projectile: boolean): number {
  const pl = e.pl!;
  let a = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
  if (pl.aimNeutral && !projectile) {
    let best: Entity | null = null;
    let bd = 160;
    for (const en of w.livingEnemies()) {
      const d = dist(e.x, e.y, en.x, en.y) - en.radius;
      if (d < bd && Math.abs(angleDiff(a, Math.atan2(en.y - e.y, en.x - e.x))) < 70 * DEG) {
        bd = d;
        best = en;
      }
    }
    if (best) a = Math.atan2(best.y - e.y, best.x - e.x);
  }
  if (projectile && pl.input.aimAssist > 0) {
    let best: Entity | null = null;
    let ba = 14 * DEG * Math.min(1, pl.input.aimAssist * 1.5);
    for (const en of w.livingEnemies()) {
      const d = Math.abs(angleDiff(a, Math.atan2(en.y - e.y, en.x - e.x)));
      if (d < ba) {
        ba = d;
        best = en;
      }
    }
    if (best) a = Math.atan2(best.y - e.y, best.x - e.x);
  }
  return a;
}

/** Build the damage spec for a weapon hit with the given multiplier. */
export function weaponSpec(w: World, e: Entity, mult: number, opts: { skill?: boolean; ignoreFrontGuard?: boolean; poiseMult?: number } = {}): DamageSpec {
  const pl = e.pl!;
  const d = pl.derived;
  const now = w.time;
  const base = d.weaponPower * mult * (1 + d.dmgPct);
  // a hybrid weapon's base damage is its own type (D80); conversion gems take their share from it
  const own: DamageType = d.weapon.element ?? 'physical';
  const dmg: Partial<Record<DamageType, number>> = {};
  let ownLeft = base;
  for (const c of d.convert) {
    const amt = base * c.pct;
    ownLeft -= amt;
    dmg[c.type] = (dmg[c.type] ?? 0) + amt;
  }
  dmg[own] = (dmg[own] ?? 0) + Math.max(0, ownLeft);
  const holyPct = buffSum(e, 'holyConvertPct', now);
  if (holyPct > 0) dmg.holy = (dmg.holy ?? 0) + base * holyPct;
  for (const t of DAMAGE_TYPES) {
    const f = d.flat[t];
    if (f) dmg[t] = (dmg[t] ?? 0) + f * mult;
  }
  const spec = emptySpec('player');
  spec.dmg = dmg;
  spec.status = d.statusBuild.map((s) => ({ ...s }));
  // harder swings (combo finishers, charged shots, skills) hit poise harder in proportion (D78)
  spec.poiseDmg = d.weapon.poiseDmg * Math.max(1, mult) * (opts.poiseMult ?? 1);
  spec.isSkill = !!opts.skill;
  spec.reviveValue = d.weapon.reviveValue + d.reviveBonus;
  spec.ignoreFrontGuard = !!(d.weapon.ignoreFrontGuard || opts.ignoreFrontGuard);
  if (buffSum(e, 'holyConvertPct', now) > 0) spec.undeadMult = 1.15;
  return spec;
}

function swingSfx(e: Entity): string {
  const sc = e.pl!.derived.weapon.speedClass;
  return sc === 'veryslow' || sc === 'slow' ? 'swingHeavy' : sc === 'veryfast' || sc === 'fast' ? 'swingLight' : 'swingMedium';
}

export function hitstopMs(e: Entity): number {
  const sc = e.pl?.derived.weapon.speedClass ?? 'medium';
  return sc === 'veryslow' ? 90 : sc === 'slow' ? 80 : sc === 'mediumslow' ? 65 : sc === 'medium' ? 55 : 40;
}

function startSwing(w: World, e: Entity, idx: number): void {
  const pl = e.pl!;
  const wpn = pl.derived.weapon;
  const swing = wpn.combo[idx % wpn.combo.length]!;
  const spd = attackSpeedOf(w, e);
  if (!spendStamina(w, e, wpn.stamina)) return;
  const ranged = swing.hitbox.shape === 'proj';
  e.facing = aimAngle(w, e, ranged);
  pl.combo = {
    idx,
    phase: 'windup',
    t: 0,
    dur: swing.windupMs / 1000 / spd,
    swing,
    hit: new Set(),
    queued: false,
    charging: !!wpn.ranged?.chargeS,
    chargeT: 0,
    speed: spd,
    fired: false,
  };
  pl.state = 'attack';
  pl.blocking = false;
  pl.lastLightAttackAt = w.time;
  e.anim.pose = 'windup';
  e.anim.poseT = 0;
}

function fireWeaponProjectile(w: World, e: Entity, swing: SwingDef, mult: number, pierce: number): void {
  const pl = e.pl!;
  if (swing.hitbox.shape !== 'proj') return;
  const a = aimAngle(w, e, true);
  e.facing = a;
  const spec = weaponSpec(w, e, swing.mult * mult);
  const wpn = pl.derived.weapon;
  const bonkPierce = wpn.ranged?.pierceBonk && pl.derived.stats.bonk >= wpn.ranged.pierceBonk ? 1 : 0;
  const shot = spawnPlayerProjectile(w, e, a, swing.hitbox.speed, swing.hitbox.r, spec, pierce + bonkPierce, wpn.id === 'bow' ? 'p_arrow' : 'p_bolt');
  shot.pr!.falloffFrom = { x: e.x, y: e.y };
  w.sfx(wpn.id === 'bow' ? 'shootArrow' : 'shootBolt', e.x);
}

export function spawnPlayerProjectile(w: World, e: Entity, a: number, speed: number, r: number, spec: DamageSpec, pierce: number, drawId: string, opts: { range?: number; isSpell?: boolean; returns?: boolean; color?: string; homing?: number } = {}): Entity {
  const range = opts.range ?? 900;
  return w.spawn('projectile', e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, {
    radius: r,
    team: 0,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    facing: a,
    drawId,
    pr: {
      ownerId: e.id,
      team: 0,
      dmg: spec.dmg,
      status: spec.status,
      control: spec.control,
      kind: 'player',
      speed,
      homing: opts.homing ?? 0,
      targetId: 0,
      until: w.time + range / speed,
      pierce,
      hit: new Set(),
      poiseDmg: spec.poiseDmg,
      onImpact: null,
      parryable: false,
      reflected: false,
      returns: !!opts.returns,
      returning: false,
      drawId,
      color: opts.color ?? '#efe6d2',
      reviveValue: opts.isSpell ? 0.25 : spec.reviveValue * 0.5,
      knockback: spec.knockback,
      lob: null,
      curve: 0,
      isSpell: !!opts.isSpell,
      isSkill: spec.isSkill,
      sourceTag: '',
    },
  });
}

/** Melee hit test for the current swing: enemies take damage, ghosts get revive progress. */
function swingHits(w: World, e: Entity): void {
  const pl = e.pl!;
  const c = pl.combo!;
  const hb = c.swing.hitbox;
  if (hb.shape === 'proj') return;
  const spec = weaponSpec(w, e, c.swing.mult);
  const heavy = ['veryslow', 'slow'].includes(pl.derived.weapon.speedClass);
  let any = false;
  const test = (t: Entity): boolean =>
    hb.shape === 'arc' ? coneHit(e.x, e.y, e.facing, (hb.angleDeg * DEG) / 2, hb.r, t.x, t.y, t.radius) : lineHit(e.x, e.y, e.facing, hb.w, hb.l, t.x, t.y, t.radius);
  for (const en of w.enemies) {
    if (en.hp?.dead || c.hit.has(en.id)) continue;
    if (en.en?.state === 'ceiling') continue;
    if (!test(en)) continue;
    c.hit.add(en.id);
    const dealt = hitEnemy(w, e, en, spec, e.x, e.y, { heavy, light: true });
    if (dealt > 0 || en.en?.gary) any = true;
    if (dealt > 0 && w.hitstopEnabled) {
      en.hitstopUntil = w.time + hitstopMs(e) / 1000;
    }
  }
  for (const g of w.players) {
    if (g === e || !g.pl!.downed || c.hit.has(g.id)) continue;
    if (!test(g)) continue;
    c.hit.add(g.id);
    addRevive(w, g, e, pl.derived.weapon.reviveValue + pl.derived.reviveBonus);
  }
  // destructible things (tendril lines, mirrors) are enemies too; props are not
  if (any) {
    if (w.hitstopEnabled) e.hitstopUntil = w.time + hitstopMs(e) / 1000;
    w.emit({ t: 'hitstop', ms: hitstopMs(e), ids: [e.id] });
    w.emit({ t: 'shake', amount: heavy ? 5 : 2 });
  }
}

function updateCombo(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  const c = pl.combo;
  if (!c) return;
  const inp = pl.input;
  const wpn = pl.derived.weapon;
  c.t += dt;
  const ranged = c.swing.hitbox.shape === 'proj';
  if (c.phase === 'windup') {
    if (!ranged) e.facing = aimAngle(w, e, false);
    else e.facing = aimAngle(w, e, true);
    if (c.charging && ranged) {
      // bow: hold to charge, release to fire
      if (held(inp, 'attack') && c.chargeT < 1.6) {
        c.chargeT += dt;
        if (c.t >= c.dur) c.t = c.dur;
        return;
      }
    }
    // forward step during the last 40% of the windup
    if (c.swing.step && c.t > c.dur * 0.6 && !e.forced) {
      const sp = c.swing.step / Math.max(0.05, c.dur * 0.4);
      e.forced = { vx: Math.cos(e.facing) * sp, vy: Math.sin(e.facing) * sp, until: w.time + c.dur * 0.4, kind: 'slide' };
    }
    if (c.t >= c.dur) {
      c.phase = 'active';
      c.t = 0;
      c.dur = c.swing.activeMs / 1000 / c.speed;
      e.anim.pose = 'swing';
      e.anim.poseT = 0;
      e.anim.swingFrom = e.facing;
      w.sfx(swingSfx(e), e.x);
      if (ranged) {
        const charged = !!wpn.ranged?.chargeS && c.chargeT >= wpn.ranged.chargeS;
        fireWeaponProjectile(w, e, c.swing, charged ? (wpn.ranged?.chargeMult ?? 1) : 1, charged ? (wpn.ranged?.chargePierce ?? 0) : 0);
        c.fired = true;
      }
    }
  } else if (c.phase === 'active') {
    swingHits(w, e);
    if (c.t >= c.dur) {
      c.phase = 'recovery';
      c.t = 0;
      const last = c.idx === wpn.combo.length - 1;
      c.dur = (c.swing.recoverMs / 1000 / c.speed) * (last ? 1.15 : 1);
      e.anim.pose = 'recover';
      e.anim.poseT = 0;
    }
  } else {
    if (pressed(inp, 'attack') || (held(inp, 'attack') && c.t > c.dur * 0.3)) c.queued = true;
    const last = c.idx === wpn.combo.length - 1;
    // the next swing can start in the back half of the recovery
    if (c.queued && !last && c.t >= c.dur * 0.45 && e.stam!.cur > 0) {
      startSwing(w, e, c.idx + 1);
      return;
    }
    if (c.t >= c.dur) {
      pl.combo = null;
      pl.state = 'idle';
      pl.nextComboIdx = last ? 0 : c.idx + 1;
      pl.comboResetAt = w.time + 0.5;
      e.anim.pose = 'idle';
      if (c.queued && last && e.stam!.cur > 0) startSwing(w, e, 0);
    }
  }
}

function startDodge(w: World, e: Entity): void {
  const pl = e.pl!;
  const inp = pl.input;
  const now = w.time;
  let dx = inp.moveX;
  let dy = inp.moveY;
  const m = Math.hypot(dx, dy);
  if (m < 0.2) {
    dx = Math.cos(e.facing);
    dy = Math.sin(e.facing);
  } else {
    dx /= m;
    dy /= m;
  }
  if (!spendStamina(w, e, DODGE_STAMINA)) return;
  pl.combo = null;
  pl.blocking = false;
  pl.state = 'dodge';
  pl.stateUntil = now + DODGE_S;
  pl.dodgeUntil = now + DODGE_S;
  pl.dodgeDir = [dx, dy];
  // equip load (D82): heavier loads shorten the invulnerable window (from its start)
  pl.iframesFrom = now + DODGE_IFRAME_FROM;
  pl.iframesUntil = now + DODGE_IFRAME_FROM + (DODGE_IFRAME_TO - DODGE_IFRAME_FROM) * pl.derived.load.effects.iframes;
  pl.iframeKind = 'all';
  let recharge = pl.derived.dodgeRecharge;
  if (hasControl(e, 'hexed', now)) recharge += 2;
  pl.dodgeRechargeTotal = recharge;
  pl.dodgeReadyAt = now + recharge;
  // root is broken by a dodge after 0.5 s
  if (e.st && e.st.controls.root > now) e.st.controls.root = 0;
  for (const id of pl.attached) {
    const leech = w.get(id);
    if (leech?.en) leech.en.attachedTo = 0;
  }
  pl.attached = [];
  w.sfx('dodge', e.x);
  w.fx('dust', e.x, e.y + 10, { n: 8 });
  if (pl.derived.powers.has('cowards_comfort')) {
    e.buffs!.push({ id: 'cowards', stat: 'moveSpeedPct', amount: 0.4, until: now + 1.4, stacks: 1, maxStacks: 1, sourceId: e.id });
  }
  w.emit({ t: 'stat', key: 'dodges', playerId: pl.playerId });
  w.hooks.onDodge?.(w, e);
}

function startFlask(w: World, e: Entity): void {
  const pl = e.pl!;
  const ch = pl.char;
  if (ch.flaskCur <= 0) {
    w.sfx('uiError', e.x, 0.5);
    w.emit({ t: 'msg', text: 'The Thermos is empty.', forPlayer: pl.playerId });
    return;
  }
  ch.flaskCur--;
  const now = w.time;
  pl.state = 'flask';
  pl.stateUntil = now + FLASK_DRINK_S;
  pl.blocking = false;
  let boost = 0;
  if (pl.flaskBoost && pl.flaskBoost.until > now) {
    boost = pl.flaskBoost.pct;
    if (pl.flaskBoost.cleanse) cleanse(e, ['statuses']);
    pl.flaskBoost = null;
  }
  const amount = flaskHeal(e.hp!.max, pl.derived.stats.prayer, pl.derived.flaskBonus + boost);
  pl.healOver.push({ perS: amount / FLASK_HEAL_S, until: now + FLASK_HEAL_S, interruptible: false });
  w.sfx('flask', e.x);
  w.fx('flask', e.x, e.y);
}

export function toggleTwoHand(w: World, e: Entity): void {
  const pl = e.pl!;
  pl.char.twoHanded = !pl.char.twoHanded;
  refreshDerived(e);
  w.sfx('uiClick', e.x, 0.6);
  w.emit({ t: 'msg', text: pl.char.twoHanded ? 'Two-handing' : 'One-handing', forPlayer: pl.playerId });
}

export function swapWeapon(w: World, e: Entity): void {
  const pl = e.pl!;
  const ch = pl.char;
  if (!ch.altMain) {
    w.emit({ t: 'msg', text: 'No second weapon set (equip one from the bag).', forPlayer: pl.playerId });
    return;
  }
  const cur = ch.equipment.main;
  ch.equipment.main = ch.altMain;
  ch.altMain = cur;
  pl.skillReadyAt = [Math.max(pl.skillReadyAt[0], w.time + 0.5), Math.max(pl.skillReadyAt[1], w.time + 0.5), Math.max(pl.skillReadyAt[2], w.time + 0.5)];
  refreshDerived(e);
  w.sfx('uiClick', e.x, 0.6);
}

function updateGhost(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  const inp = pl.input;
  const sp = GHOST_SPEED;
  w.room.moveCircle(e, inp.moveX * sp * dt, inp.moveY * sp * dt, false);
  if (w.time >= pl.ghostUntil && !pl.deadUntilRest) {
    pl.downed = false;
    pl.deadUntilRest = true;
    w.hooks.onPlayerDied?.(w, e);
  }
}

/** One simulation tick for one player. */
export function updatePlayer(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  if (pl.remote) return;
  const now = w.time;
  const inp = pl.input;
  if (pl.downed) {
    updateGhost(w, e, dt);
    return;
  }
  if (pl.deadUntilRest) return;
  if (w.frozen(e)) return;

  pl.aimX = inp.aimX;
  pl.aimY = inp.aimY;
  pl.aimNeutral = inp.aimNeutral;
  // positions over the last 1.5 s (Rewind Strike, Rewind Volley)
  if (pl.pastPos.length === 0 || now - pl.pastPos[pl.pastPos.length - 1]!.t >= 0.1) {
    pl.pastPos.push({ t: now, x: e.x, y: e.y });
    if (pl.pastPos.length > 16) pl.pastPos.shift();
  }

  // falling into a pit / off the platform
  if (pl.falling) {
    if (now >= pl.falling.until) {
      // climb back at the edge point picked when you fell (or the nearest floor still there, if it fell away too)
      const [cx, cy] = w.room.circleBlocked(pl.falling.toX, pl.falling.toY, e.radius) ? w.room.nearestFloor(pl.falling.toX, pl.falling.toY, e.radius) : [pl.falling.toX, pl.falling.toY];
      e.x = cx;
      e.y = cy;
      pl.falling = null;
      pl.state = 'idle';
      e.anim.alpha = 1;
      e.anim.scale = 1;
    } else {
      e.anim.scale = Math.max(0.2, e.anim.scale - dt * 1.5);
      return;
    }
  }

  // held (grab): damage at the end
  if (pl.state === 'held') {
    if (now >= pl.holdUntil || !w.get(pl.holdBy)) {
      if (now >= pl.holdUntil && pl.holdDmg > 0) {
        const holder = w.get(pl.holdBy);
        const spec = emptySpec('red');
        spec.dmg[pl.holdType] = pl.holdDmg;
        if (pl.holdStatus) spec.status = [pl.holdStatus];
        pl.iframesUntil = 0;
        // the slam at the end of a grab cannot be blocked or dodged
        const hp0 = e.hp!.hp;
        rawDamage(w, e, pl.holdDmg * (100 / (100 + pl.derived.defense[pl.holdType])), pl.holdType, holder?.id ?? 0);
        if (pl.holdStatus && e.hp!.hp < hp0) {
          // status rides on the slam
        }
        w.emit({ t: 'shake', amount: 8 });
      }
      pl.state = 'idle';
      pl.holdDmg = 0;
      e.st!.controls.hold = 0;
    } else return;
  }

  // timed states
  if ((pl.state === 'stagger' || pl.state === 'dodge' || pl.state === 'flask') && now >= pl.stateUntil) {
    if (pl.state === 'stagger' && pl.guardBrokenUntil > now) {
      /* guard break stagger ends with the state timer */
    }
    pl.state = 'idle';
  }
  if (pl.combo && pl.combo.phase !== 'windup' && now > pl.comboResetAt + 2) {
    /* stale */
  }

  // heal-over-time (flask, Heal spell)
  if (pl.healOver.length) {
    for (const h of pl.healOver) if (h.until > now) heal(w, e, h.perS * dt, false);
    pl.healOver = pl.healOver.filter((h) => h.until > now);
  }

  const frozen = hasControl(e, 'freeze', now);
  const silenced = hasControl(e, 'silence', now) || buffSum(e, 'silence', now) > 0;
  if (frozen) {
    pl.combo = null;
    return;
  }

  // two-hand toggle and weapon swap (not mid-swing)
  if (pressed(inp, 'twoHand') && (pl.state === 'idle' || pl.state === 'flask')) toggleTwoHand(w, e);
  if (pressed(inp, 'swapWeapon') && pl.state === 'idle') swapWeapon(w, e);

  // dodge: from idle, blocking, or the back half of an attack's recovery
  if (pressed(inp, 'dodge')) {
    const rooted = e.st!.controls.root > now;
    const inRecovery = pl.state === 'attack' && pl.combo?.phase === 'recovery';
    const free = pl.state === 'idle' || inRecovery;
    if (free && now >= pl.dodgeReadyAt && e.stam!.cur > 0 && !(rooted && e.st!.controls.root - now > 1.0)) startDodge(w, e);
    else if (free && now < pl.dodgeReadyAt) w.emit({ t: 'msg', text: '', forPlayer: pl.playerId });
  }

  // block / parry
  const holdToBlock = true;
  if (pressed(inp, 'block')) {
    pl.blockToggled = !pl.blockToggled;
    const d = pl.derived;
    if (canAct(w, e) && d.shield && d.shield.parryS && d.shieldMeetsReq && d.canBlock && now >= pl.parryReadyAt) {
      pl.parryUntil = now + d.shield.parryS;
      pl.parryReadyAt = now + 0.45;
      e.anim.pose = 'parry';
      e.anim.poseT = 0;
    }
  }
  const wantBlock = holdToBlock ? held(inp, 'block') : pl.blockToggled;
  // Phalanx: thrust while holding a two-hand guard
  const phalanx = !!e.buffs?.some((b) => b.id === 'phalanx' && b.until > now) && (pl.derived.twoHanded || !pl.derived.shield);
  pl.blocking = wantBlock && (pl.state === 'idle' || (phalanx && pl.state === 'attack')) && pl.derived.canBlock && !pl.channel && !pl.charge;

  // actions from idle
  if (pl.state === 'idle' && !pl.channel && !pl.charge) {
    if (pressed(inp, 'attack') && pl.derived.weapon.twoHandOnly && !pl.derived.twoHanded) {
      // a bow needs both hands to draw (D88)
      if (now - pl.lastBowHintAt > 1.5) {
        pl.lastBowHintAt = now;
        w.emit({ t: 'msg', text: 'A bow needs both hands. Two-hand it ({twoHand}) to shoot.', forPlayer: pl.playerId, color: '#ffb35a' });
      }
    } else if ((pressed(inp, 'attack') || (held(inp, 'attack') && !pl.derived.weapon.ranged)) && e.stam!.cur > 0) {
      const idx = now <= pl.comboResetAt ? pl.nextComboIdx : 0;
      startSwing(w, e, idx);
    } else if (pressed(inp, 'flask')) startFlask(w, e);
    else if (pressed(inp, 'quick')) tryUseConsumable(w, e);
    else if (!silenced) {
      for (let i = 0; i < 3; i++) {
        if (pressed(inp, (['skill1', 'skill2', 'skill3'] as const)[i]!)) {
          if (tryUseSkill(w, e, i)) break;
        }
        if (pressed(inp, (['spell1', 'spell2', 'spell3'] as const)[i]!)) {
          if (tryCastSpell(w, e, i)) break;
        }
      }
    } else if ([...(['skill1', 'skill2', 'skill3', 'spell1', 'spell2', 'spell3'] as const)].some((a) => pressed(inp, a))) {
      w.emit({ t: 'msg', text: 'Silenced!', forPlayer: pl.playerId, color: '#9ad0ff' });
    }
    if (pressed(inp, 'interact')) w.hooks.onInteract?.(w, e, e);
  }

  if (pl.state === 'attack') updateCombo(w, e, dt);
  updatePlayerAction(w, e, dt);

  // movement
  let mv = 0;
  const canMove = (pl.state === 'idle' || pl.state === 'flask' || pl.state === 'cast' || pl.state === 'channel' || pl.state === 'charge' || pl.state === 'attack') && !e.forced;
  if (pl.state === 'dodge') {
    const t = 1 - (pl.dodgeUntil - now) / DODGE_S;
    const sp = (DODGE_DIST / DODGE_S) * 1.6 * Math.max(0.1, 1 - t) * pl.derived.load.effects.dodge;
    const fall = w.room.moveCircle(e, pl.dodgeDir[0] * sp * dt, pl.dodgeDir[1] * sp * dt, false, true);
    void fall;
    mv = 1;
  } else if (canMove && e.st!.controls.root <= now) {
    let speed = pl.derived.walk * speedMult(e, w);
    if (pl.state === 'flask') speed *= 0.4;
    if (pl.state === 'cast') speed *= 0.5;
    if (pl.channel) speed *= pl.channel.moveMult;
    if (pl.charge) speed *= 0.35;
    // swinging slows you down instead of rooting you; heavier weapon classes slow you more (D88)
    if (pl.state === 'attack') speed *= ATTACK_MOVE[pl.derived.weapon.speedClass] ?? 0.4;
    if (pl.blocking) speed *= 0.75;
    const ix = inp.moveX;
    const iy = inp.moveY;
    mv = Math.min(1, Math.hypot(ix, iy));
    // a platform's void edge has no wall: you can walk off it (pits keep their rim)
    if (mv > 0.05) w.room.moveCircle(e, ix * speed * dt, iy * speed * dt, false, 'void');
    // the rotating floor ring (Tock) carries you along
  }
  if (pl.state !== 'attack' && pl.state !== 'dodge') {
    e.facing = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
  }
  if (mv < 0.05 && pl.state === 'idle') {
    if (pl.stillSince === 0) pl.stillSince = now;
  } else pl.stillSince = 0;
  e.anim.squash = pl.combo?.phase === 'windup' ? -0.6 : pl.combo?.phase === 'active' ? 0.6 : 0;
  e.anim.poseT += dt;
  (e.anim as { moving?: number }).moving = mv;
  if (mv > 0.2 && now - pl.lastFootstep > 0.32) {
    pl.lastFootstep = now;
    // footsteps per surface (ART_AUDIO §5): splashes in water, soft steps on moss and forest floor
    const wet = w.room.tileAt(e.x, e.y) === T.Hazard && w.room.hazardKind === 'water';
    const soft = w.zone === 2 || w.zone === 4;
    w.sfx(wet ? 'stepWater' : soft ? 'stepGrass' : 'stepStone', e.x, 0.6, 0.9 + (w.tick % 3) * 0.1);
  }

  // stamina regen: after a delay; paused during active frames; slower while blocking
  const s = e.stam!;
  const activeFrames = pl.combo?.phase === 'active';
  if (now >= pl.stamDelayUntil && !activeFrames && pl.state !== 'dodge') {
    let regen = pl.derived.regen * (1 + buffSum(e, 'staminaRegenPct', now));
    if (pl.blocking) regen *= 0.3;
    s.cur = Math.min(s.max, s.cur + regen * dt);
  }
  pl.prevButtons = inp.buttons;
}

/** Throwables and other player-side projectiles reuse this colour lookup. */
export { typeColor, applyControl };
