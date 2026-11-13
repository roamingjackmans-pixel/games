// The player controller (GAME_DESIGN §4–5): input → movement, light combos, dodge, block, parry,
// two-hand toggle, flask, skills/spells hooks. Runs for the host's own player and, on each co-op guest's screen, for
// that guest's own body; a guest's copy in the host's world runs only what the host runs (updatePuppet, D338).
import { emptyInput, held, pressed } from '../../engine/input/actions';
import { T } from '../room';
import { DEG, angleDiff, coneHit, dist, lineHit } from '../../engine/math';
import { attackStaminaCost, flaskHeal, MAX_PROJECTILE_RANGE, STAMINA_COST_MULT } from '../combat/formulas';
import { addRevive, applyControl, cleanse, emptySpec, ffVictims, heal, hitAlly, hitEnemy, rawDamage, endPlayerStun, typeColor } from '../combat/damage';
import { buffSum, hasControl, speedMult } from '../combat/state';
import { terrainWalkMult } from '../systems/terrain';
import { computeDerived, weaponHitByType } from './derived';
import { tryCastSpell, tryUseConsumable, spellKeysAreOffSkills, tryUseSkill, updatePlayerAction } from '../skills/use';
import type { Character, SwingDef, WeaponDef } from '../types';
import { netHostDriven, newStatus, type DamageSpec, type Entity, type PlayerC, type World } from '../world';

/** Walking speed while swinging (D88), by weapon speed class; a pair in both hands may cut the slowdown (D346). */
export function attackMoveMult(d: { weapon: WeaponDef; twoHanded: boolean }): number {
  const m = ATTACK_MOVE[d.weapon.speedClass] ?? 0.4;
  const cut = d.weapon.paired && d.twoHanded ? (d.weapon.dualSwingSlowCut ?? 0) : 0;
  return 1 - (1 - m) * (1 - cut);
}

/** walking speed while swinging, by weapon speed class (D88) */
export const ATTACK_MOVE: Record<string, number> = { veryfast: 0.6, fast: 0.52, medium: 0.42, mediumslow: 0.33, slow: 0.25, veryslow: 0.18 };
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
/** the eye-coloured dot at a player's feet (D262): area attacks test it, not the whole body, so a dot clear of an area is safe */
export const PLAYER_DOT_R = 5;
/** how far below a player's centre (their belt) the dot sits, on their feet (D262); with its radius it stays inside the body, so an area never catches more than it did */
export const PLAYER_DOT_DY = 9;

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
    bareParryUntil: 0,
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
    ghostPauseUntil: 0,
    reviveProgress: 0,
    reviveNeed: 10,
    downs: 0,
    downedBy: '',
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
    terrainHurtAt: 0,
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

/** `offHand`: an off-hand shot (D369: that hand's own Quicksilver). */
export function attackSpeedOf(w: World, e: Entity, offHand = false): number {
  const pl = e.pl!;
  let s = (offHand && pl.derived.offWeapon ? pl.derived.off.attackSpeed : pl.derived.attackSpeed) * (1 + buffSum(e, 'attackSpeedPct', w.time));
  if (e.st && e.st.active.chill > w.time) s *= 0.7;
  s *= pl.timeSlow;
  return Math.max(0.3, Math.min(1.6 * pl.timeSlow, s));
}

function staminaCostMult(w: World, e: Entity): number {
  return STAMINA_COST_MULT * e.pl!.derived.stamCost * Math.max(0.2, 1 + buffSum(e, 'staminaCostPct', w.time));
}

export function spendStamina(w: World, e: Entity, amount: number): boolean {
  const s = e.stam!;
  if (s.cur <= 0 && amount > 0) return false;
  s.cur = Math.max(0, s.cur - amount * staminaCostMult(w, e));
  e.pl!.stamDelayUntil = w.time + 0.6;
  return true;
}

/** An attack's stamina cost for this player now (D193). */
export function attackCost(w: World, e: Entity, amount: number, offHand = false): number {
  const d = e.pl!.derived;
  return attackStaminaCost(amount, offHand && d.offWeapon ? d.off.stamCost : d.stamCost, buffSum(e, 'staminaCostPct', w.time), e.stam!.max);
}

/** Attacks start only with the stamina to pay for them in full (D193); `offHand`: an off-hand shot (D369). */
export function canAffordAttack(w: World, e: Entity, amount: number, offHand = false): boolean {
  return e.stam!.cur >= attackCost(w, e, amount, offHand) - 1e-6;
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
export function weaponSpec(w: World, e: Entity, mult: number, opts: { skill?: boolean; ignoreFrontGuard?: boolean; poiseMult?: number; offHand?: boolean } = {}): DamageSpec {
  const pl = e.pl!;
  const d = pl.derived;
  const now = w.time;
  // a shot of the off-hand weapon (D291) uses that weapon's own power
  const wdef = (opts.offHand ? d.offWeapon?.def : null) ?? d.weapon;
  // the hit by type (shared with the item cards, D294), plus a timed holy buff (Bless Weapon, Consecrate…)
  const dmg = weaponHitByType(d, mult, !!opts.offHand, buffSum(e, 'holyConvertPct', now));
  const spec = emptySpec('player');
  spec.dmg = dmg;
  spec.lifestealScale = mult;
  // D369: the hand that strikes brings its own gems' buildup and lifesteal
  const hm = opts.offHand && d.offWeapon ? d.off : d;
  spec.lifestealPct = hm.lifesteal;
  spec.status = hm.statusBuild.map((s) => ({ ...s }));
  // harder swings (combo finishers, charged shots, skills) hit poise harder in proportion (D78)
  spec.poiseDmg = wdef.poiseDmg * Math.max(1, mult) * (opts.poiseMult ?? 1);
  spec.isSkill = !!opts.skill;
  spec.reviveValue = wdef.reviveValue + d.reviveBonus;
  spec.ignoreFrontGuard = !!(wdef.ignoreFrontGuard || opts.ignoreFrontGuard);
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

/** The weapon a swing uses: the off-hand one for an off-hand shot (D291). */
function comboWeapon(e: Entity, offHand: boolean | undefined): WeaponDef {
  const d = e.pl!.derived;
  return offHand && d.offWeapon ? d.offWeapon.def : d.weapon;
}

function startSwing(w: World, e: Entity, idx: number, offHand = false): void {
  const pl = e.pl!;
  const wpn = comboWeapon(e, offHand);
  const swing = wpn.combo[idx % wpn.combo.length]!;
  const spd = attackSpeedOf(w, e, offHand);
  if (!canAffordAttack(w, e, wpn.stamina, offHand)) return;
  e.stam!.cur = Math.max(0, e.stam!.cur - attackCost(w, e, wpn.stamina, offHand));
  pl.stamDelayUntil = w.time + 0.6;
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
    attackId: w.newAttackId(),
    ...(offHand ? { offHand: true } : {}),
  };
  pl.state = 'attack';
  pl.blocking = false;
  pl.lastLightAttackAt = w.time;
  e.anim.pose = 'windup';
  e.anim.poseT = 0;
}

function fireWeaponProjectile(w: World, e: Entity, swing: SwingDef, mult: number, pierce: number, offHand = false, angle?: number): void {
  const pl = e.pl!;
  if (swing.hitbox.shape !== 'proj') return;
  const a = angle ?? aimAngle(w, e, true);
  e.facing = a;
  // D338: a co-op guest's own shot: its swing plays on its screen, the arrow itself is the host's (and so are its hits)
  if (pl.net === 'body' && w.netGuest) {
    w.netGuest.out.push({ t: 'shot', idx: pl.combo?.idx ?? 0, ...(offHand ? { off: true } : {}), mult, pierce, a, x: e.x, y: e.y });
    w.sfx(comboWeapon(e, offHand).ranged?.sfx ?? 'shootBolt', e.x);
    return;
  }
  const spec = weaponSpec(w, e, swing.mult * mult, { offHand });
  // a whole volley (or a thrown ring, out and back) is one attack for lifesteal (D325)
  spec.attackId = w.newAttackId();
  const wpn = comboWeapon(e, offHand);
  const bonkPierce = wpn.ranged?.pierceBonk && pl.derived.stats.bonk >= wpn.ranged.pierceBonk ? 1 : 0;
  // a volley (D205): one shot down the aim and the rest fanned out either side, all at once
  const n = Math.max(1, wpn.ranged?.volley?.count ?? 1);
  const step = (wpn.ranged?.volley?.spreadDeg ?? 0) * DEG;
  // one hit per target per shot (D264): the arrows share a list of what the volley has struck
  const volleyHit = n > 1 ? new Set<number>() : undefined;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * step;
    const hb = swing.hitbox;
    const shot = spawnPlayerProjectile(w, e, a + off, hb.speed, hb.r, { ...spec, dmg: { ...spec.dmg }, status: spec.status.map((s) => ({ ...s })) }, pierce + bonkPierce + (hb.pierce ?? 0), wpn.ranged?.drawId ?? 'p_bolt', {
      ...(hb.returns ? { returns: true } : {}),
      ...(hb.range ? { range: hb.range } : {}),
    });
    // a thrown ring that comes back (D320) loses nothing with distance; arrows and bolts do
    if (!hb.returns) shot.pr!.falloffFrom = { x: e.x, y: e.y };
    if (volleyHit) shot.pr!.volleyHit = volleyHit;
  }
  w.sfx(wpn.ranged?.sfx ?? 'shootBolt', e.x);
}

/** The host fires a co-op guest's ranged swing where that guest's screen aimed it (D338). */
export function remoteShot(w: World, e: Entity, idx: number, offHand: boolean, mult: number, pierce: number, angle: number): void {
  const wpn = comboWeapon(e, offHand);
  const swing = wpn.combo[idx % Math.max(1, wpn.combo.length)];
  if (!swing || swing.hitbox.shape !== 'proj' || !Number.isFinite(angle)) return;
  const from = w.events.length;
  fireWeaponProjectile(w, e, swing, Number.isFinite(mult) ? Math.max(0, Math.min(4, mult)) : 1, Number.isFinite(pierce) ? Math.max(0, Math.min(8, Math.round(pierce))) : 0, offHand, angle);
  // that guest heard its own shot already
  for (let i = from; i < w.events.length; i++) {
    const ev = w.events[i]!;
    if (ev.t === 'sfx') ev.echo = e.pl!.playerId;
  }
}

export function spawnPlayerProjectile(w: World, e: Entity, a: number, speed: number, r: number, spec: DamageSpec, pierce: number, drawId: string, opts: { range?: number; isSpell?: boolean; returns?: boolean; color?: string; homing?: number } = {}): Entity {
  const range = Math.min(opts.range ?? 900, MAX_PROJECTILE_RANGE);
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
      ...(spec.attackId !== undefined ? { attackId: spec.attackId } : {}),
      ...(spec.lifestealScale !== undefined ? { lifestealScale: spec.lifestealScale } : {}),
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
  // the whole swing is one attack for lifesteal (D325)
  if (c.attackId !== undefined) spec.attackId = c.attackId;
  const heavy = ['veryslow', 'slow'].includes(pl.derived.weapon.speedClass);
  let any = false;
  // proficiency reach (D178) lengthens every swing
  const reach = pl.derived.reachMult;
  // an overhead (D320) lands a circle in front: reach carries it further out
  const slamX = hb.shape === 'circle' ? e.x + Math.cos(e.facing) * hb.d * reach : 0;
  const slamY = hb.shape === 'circle' ? e.y + Math.sin(e.facing) * hb.d * reach : 0;
  const test = (t: Entity): boolean =>
    hb.shape === 'arc'
      ? coneHit(e.x, e.y, e.facing, (hb.angleDeg * DEG) / 2, hb.r * reach, t.x, t.y, t.radius)
      : hb.shape === 'circle'
        ? Math.hypot(t.x - slamX, t.y - slamY) <= hb.r + t.radius
        : lineHit(e.x, e.y, e.facing, hb.w, hb.l * reach, t.x, t.y, t.radius);
  // the overhead's landing kicks up dust and shakes the screen once, as it starts to land
  if (hb.shape === 'circle' && c.hit.size === 0 && !c.landed) {
    c.landed = true;
    w.fx('dust', slamX, slamY, { n: 8 });
    w.emit({ t: 'shake', amount: heavy ? 4 : 2 });
  }
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
  // friendly fire (D115): standing allies in the arc take the hit too
  for (const a of ffVictims(w, e)) {
    if (c.hit.has(a.id) || !test(a)) continue;
    c.hit.add(a.id);
    const r = hitAlly(w, e, a, spec, e.x, e.y);
    if (r === 'hit' || r === 'blocked') any = true;
  }
  // destructible things (tendril lines, mirrors) are enemies too; props are not
  if (any) {
    // the swinging body freezes where it is simulated (the host's own player, or a guest's body on its own screen, D338)
    if (w.hitstopEnabled && pl.local) e.hitstopUntil = w.time + hitstopMs(e) / 1000;
    w.emit({ t: 'hitstop', ms: hitstopMs(e), ids: [e.id] });
    w.emit({ t: 'shake', amount: heavy ? 5 : 2 });
  }
}

function updateCombo(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  const c = pl.combo;
  if (!c) return;
  const inp = pl.input;
  const wpn = comboWeapon(e, c.offHand);
  // an off-hand shot (D291) answers to the block button, a main-hand swing to attack
  const key = c.offHand ? 'block' : 'attack';
  c.t += dt;
  const ranged = c.swing.hitbox.shape === 'proj';
  if (c.phase === 'windup') {
    if (!ranged) e.facing = aimAngle(w, e, false);
    else e.facing = aimAngle(w, e, true);
    if (c.charging && ranged) {
      // bow: hold to charge, release to fire
      if (held(inp, key) && c.chargeT < 1.6) {
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
        fireWeaponProjectile(w, e, c.swing, charged ? (wpn.ranged?.chargeMult ?? 1) : 1, charged ? (wpn.ranged?.chargePierce ?? 0) : 0, !!c.offHand);
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
    if (pressed(inp, key) || (held(inp, key) && c.t > c.dur * 0.3 && !c.offHand)) c.queued = true;
    const last = c.idx === wpn.combo.length - 1;
    // the next swing can start in the back half of the recovery
    if (c.queued && !last && c.t >= c.dur * 0.45 && canAffordAttack(w, e, wpn.stamina, !!c.offHand)) {
      startSwing(w, e, c.idx + 1, !!c.offHand);
      return;
    }
    if (c.t >= c.dur) {
      pl.combo = null;
      pl.state = 'idle';
      // an off-hand shot leaves the main hand's combo where it was
      if (!c.offHand) {
        pl.nextComboIdx = last ? 0 : c.idx + 1;
        pl.comboResetAt = w.time + 0.5;
      }
      e.anim.pose = 'idle';
      if (c.queued && last && canAffordAttack(w, e, wpn.stamina, !!c.offHand)) startSwing(w, e, 0, !!c.offHand);
    }
  }
}

/**
 * How fast this player walks right now, before Slow terrain, or 0 when it cannot walk. The host's movement and the
 * speed a co-op guest predicts its own walking with both come from here, so they cannot drift apart (D150: the
 * guest's copy still treated a swing as rooting, so every attack made its screen jump back and catch up).
 */
export function walkSpeedFor(w: World, e: Entity): number {
  const pl = e.pl!;
  const canMove = (pl.state === 'idle' || pl.state === 'flask' || pl.state === 'cast' || pl.state === 'channel' || pl.state === 'charge' || pl.state === 'attack') && !e.forced;
  if (!canMove || e.st!.controls.root > w.time) return 0;
  let speed = pl.derived.walk * speedMult(e, w);
  if (pl.state === 'flask') speed *= 0.4;
  if (pl.state === 'cast') speed *= pl.derived.castMoveMult;
  if (pl.channel) speed *= pl.channel.moveMult;
  if (pl.charge) speed *= 0.35;
  // swinging slows you down instead of rooting you; heavier weapon classes slow you more (D88)
  if (pl.state === 'attack') speed *= attackMoveMult(pl.derived);
  if (pl.blocking) speed *= 0.75;
  return speed;
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
  const amount = flaskHeal(e.hp!.max, pl.derived.stats.prayer, pl.derived.flaskBonus + boost, pl.derived.statBoost.prayer);
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

/** The off hand and the 2nd off hand trade places (D228): a shield for a staff, a talisman for a buckler… */
export function swapOffhand(w: World, e: Entity): void {
  const pl = e.pl!;
  const ch = pl.char;
  if (!ch.altOff) {
    w.emit({ t: 'msg', text: 'No second off-hand item set (equip one from the bag).', forPlayer: pl.playerId });
    return;
  }
  const cur = ch.equipment.off;
  ch.equipment.off = ch.altOff;
  ch.altOff = cur;
  pl.spellReadyAt = [Math.max(pl.spellReadyAt[0], w.time + 0.5), Math.max(pl.spellReadyAt[1], w.time + 0.5), Math.max(pl.spellReadyAt[2], w.time + 0.5)];
  refreshDerived(e);
  w.sfx('uiClick', e.x, 0.6);
  w.emit({ t: 'msg', text: `Off hand: ${ch.equipment.off?.name ?? 'empty'}`, forPlayer: pl.playerId });
}

function updateGhost(w: World, e: Entity, dt: number, walk = true): void {
  const pl = e.pl!;
  const inp = pl.input;
  const sp = GHOST_SPEED;
  if (walk) w.room.moveCircle(e, inp.moveX * sp * dt, inp.moveY * sp * dt, false);
  // a co-op guest's own ghost walks on its screen; the countdown, the revive and the bleed-out are the host's (D338)
  if (pl.net === 'body') return;
  // an ally hitting you holds the countdown (D202): it stands still until 3 s after their last hit
  if (w.time < pl.ghostPauseUntil) pl.ghostUntil += dt;
  if (w.time >= pl.ghostUntil && !pl.deadUntilRest) {
    pl.downed = false;
    pl.deadUntilRest = true;
    w.hooks.onPlayerDied?.(w, e);
  }
}

/** One simulation tick for one player. */
/**
 * Cooldowns only run while there is something to fight (D177): in an empty room they hold where they are, so nobody
 * waits out a Heal between fights. Weapon skills (and an off-hand crossbow's) hold the same way since D324.
 */
export function holdSpellCooldowns(w: World, e: Entity, dt: number): void {
  if (w.hostilesPresent()) return;
  const pl = e.pl!;
  const now = w.time;
  for (let i = 0; i < 3; i++) {
    if (pl.spellReadyAt[i]! > now) pl.spellReadyAt[i]! += dt;
    if (pl.skillReadyAt[i]! > now) pl.skillReadyAt[i]! += dt;
  }
}

/** Every spell and skill is ready again (D177, D324): a bonfire rest, or a real death (not being downed in co-op). */
export function resetSpellCooldowns(e: Entity): void {
  const pl = e.pl;
  if (!pl) return;
  pl.spellReadyAt = [0, 0, 0];
  pl.skillReadyAt = [0, 0, 0];
}

export function updatePlayer(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  if (pl.remote) return;
  if (pl.net === 'puppet') {
    updatePuppet(w, e, dt);
    return;
  }
  // a co-op guest's own body on its own screen (D338): everything runs here at once except what the host runs (its
  // skills, spells and consumables, the ghost's countdown); the host shows the body where this screen says
  const body = pl.net === 'body';
  const now = w.time;
  holdSpellCooldowns(w, e, dt);
  const inp = pl.input;
  if (pl.downed) {
    updateGhost(w, e, dt);
    return;
  }
  if (pl.deadUntilRest) return;
  // out of HP: the host decides what happens next (downed, the Training Hall's second chance) and says so
  if (body && e.hp!.hp <= 0) return;
  // heal over time (Heal, the Thermos) runs on whatever else is happening: frozen, held, falling or staggered (D250)
  if (pl.healOver.length) {
    for (const h of pl.healOver) if (h.until > now) heal(w, e, h.perS * dt, false);
    pl.healOver = pl.healOver.filter((h) => h.until > now);
  }
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
      // the grace and the chain run from when it let go: its end, or now if it was cut short (holder gone) (D293)
      endPlayerStun(e, pl.holdUntil > 0 && pl.holdUntil <= now ? pl.holdUntil : now);
      pl.state = 'idle';
      pl.holdDmg = 0;
      e.st!.controls.hold = 0;
    } else return;
  }

  // the host is running one of this body's skills, spells or consumables: the body follows it until it is done
  if (body && pl.netFollow) {
    regenStamina(w, e, dt);
    pl.prevButtons = inp.buttons;
    return;
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

  const frozen = hasControl(e, 'freeze', now);
  const silenced = hasControl(e, 'silence', now) || buffSum(e, 'silence', now) > 0;
  if (frozen) {
    pl.combo = null;
    return;
  }

  // two-hand toggle and weapon swap (not mid-swing)
  if (pressed(inp, 'twoHand') && (pl.state === 'idle' || pl.state === 'flask')) toggleTwoHand(w, e);
  // swap weapon on its own swaps the weapon hand; with Interact held (hold A / F and click the left stick / X) it
  // swaps the off hand (D228)
  if (pressed(inp, 'swapWeapon') && pl.state === 'idle') {
    if (held(inp, 'interact')) swapOffhand(w, e);
    else swapWeapon(w, e);
  }

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
  const offShot = !!pl.derived.offWeapon;
  if (pressed(inp, 'block') && offShot) {
    // a crossbow in the off hand (D291): the block button shoots it, with its own stamina cost
    const ow = pl.derived.offWeapon!;
    if (pl.state === 'idle' && !pl.channel && !pl.charge && canAffordAttack(w, e, ow.def.stamina, true)) startSwing(w, e, 0, true);
  } else if (pressed(inp, 'block')) {
    pl.blockToggled = !pl.blockToggled;
    const d = pl.derived;
    if (canAct(w, e) && d.shield && d.shield.parryS && d.shieldMeetsReq && d.canBlock && now >= pl.parryReadyAt) {
      pl.parryUntil = now + d.shield.parryS + d.parryBonusS; // Small Shield proficiency widens it (D215)
      pl.parryReadyAt = now + 0.45;
      e.anim.pose = 'parry';
      e.anim.poseT = 0;
    } else if (canAct(w, e) && now >= pl.parryReadyAt) {
      // no shield that parries (two-handing, a greatshield, a staff, bare hands): the timing still counts for the
      // tutorial's parry station, with a buckler's window (D96)
      pl.bareParryUntil = now + 0.18;
      pl.parryReadyAt = now + 0.45;
    }
  }
  const wantBlock = holdToBlock ? held(inp, 'block') : pl.blockToggled;
  // Phalanx: thrust while holding a two-hand guard
  const phalanx = !!e.buffs?.some((b) => b.id === 'phalanx' && b.until > now) && (pl.derived.twoHanded || !pl.derived.shield);
  pl.blocking = !offShot && wantBlock && (pl.state === 'idle' || (phalanx && pl.state === 'attack')) && pl.derived.canBlock && !pl.channel && !pl.charge;

  // actions from idle
  // a skill, spell or consumable asked of the host: no swing or drink starts until it answers (D338)
  const free = pl.state === 'idle' && !pl.channel && !pl.charge;
  if (free && body && (pl.netAwaitUntil ?? 0) > now) {
    /* waiting on the host */
  } else if (free && body && !silenced && hostRunPressed(e, now)) {
    pl.netAwaitUntil = now + NET_AWAIT_S;
  } else if (free) {
    if (pressed(inp, 'attack') && pl.derived.weapon.twoHandOnly && !pl.derived.twoHanded) {
      // a bow needs both hands to draw (D88): shooting one-handed takes it in both hands and shoots (D203)
      toggleTwoHand(w, e);
      if (pl.derived.twoHanded && canAffordAttack(w, e, pl.derived.weapon.stamina)) startSwing(w, e, 0);
    } else if ((pressed(inp, 'attack') || (held(inp, 'attack') && !pl.derived.weapon.ranged)) && canAffordAttack(w, e, pl.derived.weapon.stamina)) {
      const idx = now <= pl.comboResetAt ? pl.nextComboIdx : 0;
      startSwing(w, e, idx);
    } else if (pressed(inp, 'flask')) startFlask(w, e);
    else if (pressed(inp, 'quick')) tryUseConsumable(w, e);
    else if (!silenced) {
      for (let i = 0; i < 3; i++) {
        if (pressed(inp, (['skill1', 'skill2', 'skill3'] as const)[i]!)) {
          // a staff or talisman in the weapon hand: Q/E/R cast its spells (D201)
          if (pl.derived.skillKeySchool ? tryCastSpell(w, e, i, 'skill') : tryUseSkill(w, e, i)) break;
        }
        if (pressed(inp, (['spell1', 'spell2', 'spell3'] as const)[i]!)) {
          // a crossbow in the off hand puts its skills on the spell keys (D316)
          if (spellKeysAreOffSkills(pl.derived) ? tryUseSkill(w, e, i, true) : tryCastSpell(w, e, i)) break;
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
    // a dodge stops at a hole's edge (D185): only an attack (a knockback, a pull) can put you in one
    w.room.moveCircle(e, pl.dodgeDir[0] * sp * dt, pl.dodgeDir[1] * sp * dt, false);
    mv = 1;
  } else if (canMove && e.st!.controls.root <= now) {
    let speed = walkSpeedFor(w, e);
    // Slow terrain (PROCGEN §3.2): walking only; the dodge above is untouched
    speed *= terrainWalkMult(w.room, e.x, e.y);
    const ix = inp.moveX;
    const iy = inp.moveY;
    mv = Math.min(1, Math.hypot(ix, iy));
    // a platform's void edge has no wall: you can walk off it (pits keep their rim)
    // walking never steps off into a pit or the void (D185; a platform edge used to let you walk off)
    if (mv > 0.05) w.room.moveCircle(e, ix * speed * dt, iy * speed * dt, false);
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

  regenStamina(w, e, dt);
  pl.prevButtons = inp.buttons;
}

/** Stamina regen: after a delay; paused during active frames; slower while blocking. */
function regenStamina(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  const now = w.time;
  const s = e.stam!;
  const activeFrames = pl.combo?.phase === 'active';
  if (now >= pl.stamDelayUntil && !activeFrames && pl.state !== 'dodge') {
    let regen = pl.derived.regen * (1 + buffSum(e, 'staminaRegenPct', now));
    if (pl.blocking) regen *= 0.3;
    s.cur = Math.min(s.max, s.cur + regen * dt);
  }
}

/** How long a guest's body waits for the host to start a skill, spell or consumable it asked for (D338). */
export const NET_AWAIT_S = 0.5;

const SKILL_KEYS = ['skill1', 'skill2', 'skill3'] as const;
const SPELL_KEYS = ['spell1', 'spell2', 'spell3'] as const;

/** A guest's body pressed something the host runs that looks ready on this screen (D338). */
function hostRunPressed(e: Entity, now: number): boolean {
  const pl = e.pl!;
  const inp = pl.input;
  if (pressed(inp, 'quick')) return true;
  for (let i = 0; i < 3; i++) {
    // the weapon-hand keys cast a staff's spells (D201); the spell keys an off-hand crossbow's skills (D316)
    const skillReady = (pl.derived.skillKeySchool ? pl.spellReadyAt[i]! : pl.skillReadyAt[i]!) <= now;
    const spellReady = (spellKeysAreOffSkills(pl.derived) ? pl.skillReadyAt[i]! : pl.spellReadyAt[i]!) <= now;
    if (pressed(inp, SKILL_KEYS[i]!) && skillReady) return true;
    if (pressed(inp, SPELL_KEYS[i]!) && spellReady) return true;
  }
  return false;
}

/**
 * A co-op guest's player in the host's world (D338). The guest's own screen walks it, dodges, blocks and swings,
 * and decides every hit on it; the host shows it where that screen says. Here only what the host runs happens: its
 * skills, spells and consumables (started from its button presses, timed and fired here, walking as they allow) and
 * its ghost's countdown.
 */
export function updatePuppet(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  const now = w.time;
  const inp = pl.input;
  holdSpellCooldowns(w, e, dt);
  if (pl.downed) {
    updateGhost(w, e, dt, false);
    return;
  }
  if (pl.deadUntilRest) return;
  // heals over time someone gave it here (a Heal, an aura): they reach the guest as HP it gained
  if (pl.healOver.length) {
    for (const h of pl.healOver) if (h.until > now) heal(w, e, h.perS * dt, false);
    pl.healOver = pl.healOver.filter((h) => h.until > now);
  }
  if (w.frozen(e)) return;
  pl.aimX = inp.aimX;
  pl.aimY = inp.aimY;
  pl.aimNeutral = inp.aimNeutral;
  if (pl.pastPos.length === 0 || now - pl.pastPos[pl.pastPos.length - 1]!.t >= 0.1) {
    pl.pastPos.push({ t: now, x: e.x, y: e.y });
    if (pl.pastPos.length > 16) pl.pastPos.shift();
  }
  if (!netHostDriven(pl)) {
    if (pl.state !== 'idle' || hasControl(e, 'freeze', now) || hasControl(e, 'hold', now) || w.inputLock > now) return;
    const silenced = hasControl(e, 'silence', now) || buffSum(e, 'silence', now) > 0;
    if (pressed(inp, 'quick')) tryUseConsumable(w, e);
    else if (!silenced) {
      for (let i = 0; i < 3; i++) {
        if (pressed(inp, SKILL_KEYS[i]!) && (pl.derived.skillKeySchool ? tryCastSpell(w, e, i, 'skill') : tryUseSkill(w, e, i))) break;
        if (pressed(inp, SPELL_KEYS[i]!) && (spellKeysAreOffSkills(pl.derived) ? tryUseSkill(w, e, i, true) : tryCastSpell(w, e, i))) break;
      }
    }
    if (!netHostDriven(pl)) return;
  }
  // a skill, spell or consumable the host runs: its timeline, and walking as it allows, as for any player
  updatePlayerAction(w, e, dt);
  if (e.st!.controls.root <= now && !e.forced) {
    const speed = walkSpeedFor(w, e) * terrainWalkMult(w.room, e.x, e.y);
    const mv = Math.min(1, Math.hypot(inp.moveX, inp.moveY));
    if (speed > 0 && mv > 0.05) w.room.moveCircle(e, inp.moveX * speed * dt, inp.moveY * speed * dt, false);
    (e.anim as { moving?: number }).moving = speed > 0 ? mv : 0;
  }
  if (pl.state !== 'attack' && pl.state !== 'dodge') e.facing = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
  e.anim.poseT += dt;
}

/** Throwables and other player-side projectiles reuse this colour lookup. */
export { typeColor, applyControl };
