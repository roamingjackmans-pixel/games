// The damage pipeline (GAME_DESIGN §3.1, §5.2–5.6, §6.3): players hit enemies, enemies hit players.
// Red: block and parry fail (guard break), i-frames work. Piercing: i-frames fail, block works, parry fails.
import { damageAfterDefense, reviveRequirement } from './formulas';
import { addBuff, behind, buffSum, frontOf, hasControl, statusActive } from './state';
import { DAMAGE_TYPES, type ControlId, type DamageType, type StatusId } from '../types';
import type { DamageSpec, Entity, World } from '../world';

export const STATUS_DECAY = 15;
export const GUARD_BREAK_S = 1.5;
export const PLAYER_STAGGER_S = 0.3;
export const PARRY_RIPOSTE_S = 2.0;

export function emptySpec(kind: DamageSpec['kind'] = 'normal'): DamageSpec {
  return {
    dmg: {},
    status: [],
    control: null,
    poiseDmg: 0,
    knockback: 0,
    kind,
    parryable: kind === 'normal',
    grab: null,
    pull: null,
    staminaDrain: 0,
    isSpell: false,
    isSkill: false,
    reviveValue: 0,
  };
}

export function specTotal(s: DamageSpec): number {
  let t = 0;
  for (const k of DAMAGE_TYPES) t += s.dmg[k] ?? 0;
  return t;
}

export function scaleSpec(s: DamageSpec, k: number): DamageSpec {
  const dmg: Partial<Record<DamageType, number>> = {};
  for (const t of DAMAGE_TYPES) if (s.dmg[t]) dmg[t] = s.dmg[t]! * k;
  return { ...s, dmg };
}

export type HitResult = 'none' | 'hit' | 'blocked' | 'parried' | 'dodged' | 'guarded' | 'immune';

// ---------------------------------------------------------------- statuses

export function applyStatusBuild(w: World, e: Entity, id: StatusId, amount: number): void {
  const st = e.st;
  if (!st || amount <= 0) return;
  if (st.immune.has(id)) return;
  const now = w.time;
  if (e.pl) {
    if (e.pl.derived.powers.has('moss_mantle')) amount *= 0.6;
    if (insideSanctuary(w, e)) return;
  }
  st.meters[id] = Math.min(100, st.meters[id] + amount);
  st.lastBuild[id] = now;
  if (st.meters[id] >= 100) {
    st.meters[id] = 0;
    triggerStatus(w, e, id);
  }
}

function insideSanctuary(w: World, e: Entity): boolean {
  for (const h of w.entities.values()) {
    if (h.type !== 'hazard' || !h.hz || !h.hz.noStatusBuild || h.removed) continue;
    for (const s of h.hz.shapes) if (s.k === 'circle' && Math.hypot(s.x - e.x, s.y - e.y) <= s.r) return true;
  }
  return false;
}

export function triggerStatus(w: World, e: Entity, id: StatusId): void {
  const st = e.st!;
  const now = w.time;
  const maxHp = e.hp?.max ?? 100;
  switch (id) {
    case 'burn':
      st.active.burn = now + 4;
      st.burnTickAt = now + 1;
      w.sfx('burn', e.x);
      w.fx('status', e.x, e.y, { color: '#ff7a1a', n: 10 });
      break;
    case 'chill':
      if (st.active.chill > now) {
        // second trigger while Chilled → Freeze
        applyControl(w, e, 'freeze', 1.5);
        st.active.chill = 0;
      } else {
        st.active.chill = now + 3;
        if (e.pl) e.pl.dodgeReadyAt = Math.max(e.pl.dodgeReadyAt, now) + 1.5;
      }
      w.sfx('freeze', e.x, 0.7);
      w.fx('status', e.x, e.y, { color: '#9ad0ff', n: 10 });
      break;
    case 'shock':
      st.shockArmed = true;
      st.active.shock = now + 3;
      if (e.stam) e.stam.cur = Math.max(0, e.stam.cur - 25);
      interrupt(w, e, 0.25);
      w.sfx('shock', e.x);
      w.fx('status', e.x, e.y, { color: '#ffe14a', n: 12 });
      break;
    case 'bleed': {
      let dmg: number;
      if (e.pl) dmg = maxHp * 0.12;
      else if (e.en?.isBoss) dmg = e.hp!.hp * 0.05;
      else dmg = Math.max(e.hp!.hp * 0.1, maxHp * 0.03);
      const lastBy = e.hp?.lastHitBy ?? 0;
      const attacker = w.get(lastBy);
      if (attacker) dmg *= 1 + buffSum(attacker, 'bleedBurstPct', now);
      st.active.bleed = now + 0.5;
      w.sfx('bleed', e.x);
      w.fx('status', e.x, e.y, { color: '#c01828', n: 16 });
      rawDamage(w, e, dmg, 'physical', lastBy, false);
      break;
    }
    case 'poison':
      st.active.poison = now + 8;
      st.poisonTickAt = now + 1;
      w.sfx('poison', e.x);
      w.fx('status', e.x, e.y, { color: '#7ad040', n: 10 });
      break;
  }
}

export function applyControl(w: World, e: Entity, id: ControlId, durationS: number): void {
  const st = e.st;
  if (!st || st.immune.has(id)) return;
  if (id === 'freeze' && st.immune.has('chill')) return;
  const now = w.time;
  st.controls[id] = Math.max(st.controls[id], now + durationS);
  if (id === 'freeze') interrupt(w, e, 0);
  if (id === 'hexed' && e.pl) e.pl.dodgeReadyAt = Math.max(e.pl.dodgeReadyAt, now) + 0;
}

/** Cancel the current action (players: 0.3 s stagger; enemies: stop the windup). */
export function interrupt(w: World, e: Entity, staggerS: number): void {
  const now = w.time;
  if (e.pl) {
    const p = e.pl;
    if (p.state === 'dodge' || p.state === 'falling') return;
    p.combo = null;
    p.action = null;
    p.channel = null;
    p.charge = null;
    p.healOver = p.healOver.filter((h) => !h.interruptible);
    if (staggerS > 0) {
      p.state = 'stagger';
      p.stateUntil = now + staggerS;
    } else if (p.state !== 'held') p.state = 'idle';
  } else if (e.en) {
    const en = e.en;
    if (en.attack) cancelEnemyAttack(w, e);
    if (staggerS > 0) {
      en.state = 'stagger';
      en.stateT = 0;
      e.hp!.staggerUntil = Math.max(e.hp!.staggerUntil, now + staggerS);
    }
  }
}

export function cancelEnemyAttack(w: World, e: Entity): void {
  const en = e.en!;
  if (!en.attack) return;
  for (const id of en.attack.teleIds) {
    const t = w.get(id);
    // telegraphs already at impact keep going (a swing in flight still lands)
    if (t && t.tg && t.tg.impact > w.time) w.remove(t);
  }
  en.attack = null;
  e.anim.tint = null;
}

// ---------------------------------------------------------------- raw damage / heal

/** Apply damage without mitigation (status ticks, falls, bleed bursts). */
export function rawDamage(w: World, e: Entity, amount: number, type: DamageType, sourceId: number, showNumber = true): void {
  if (!e.hp || e.hp.dead || amount <= 0) return;
  if (e.pl && (w.god || e.pl.downed || e.pl.deadUntilRest)) return;
  if (e.en?.gary) return;
  e.hp.hp -= amount;
  e.hp.lastHitBy = sourceId || e.hp.lastHitBy;
  if (showNumber) w.emit({ t: 'dmg', x: e.x, y: e.y - e.radius, amount, type, crit: false, toPlayer: !!e.pl, targetId: e.id });
  checkDeath(w, e, sourceId);
}

export function heal(w: World, e: Entity, amount: number, show = true): number {
  if (!e.hp || e.hp.dead || amount <= 0) return 0;
  if (e.pl && (e.pl.downed || e.pl.deadUntilRest)) return 0;
  const before = e.hp.hp;
  e.hp.hp = Math.min(e.hp.max, e.hp.hp + amount);
  const got = e.hp.hp - before;
  if (show && got >= 1) w.emit({ t: 'dmg', x: e.x, y: e.y - e.radius - 6, amount: got, type: 'holy', crit: false, toPlayer: false, heal: true, targetId: e.id });
  return got;
}

export function checkDeath(w: World, e: Entity, killerId: number): void {
  if (!e.hp || e.hp.dead || e.hp.hp > 0) return;
  if (e.pl) {
    e.hp.hp = 0;
    w.hooks.onPlayerDowned?.(w, e);
    return;
  }
  e.hp.hp = 0;
  e.hp.dead = true;
  w.emit({ t: 'death', id: e.id, x: e.x, y: e.y, isPlayer: false, defId: e.en?.def.id ?? '' });
  w.hooks.onEnemyKilled?.(w, e, killerId);
}

// ---------------------------------------------------------------- enemies hit players

function blockReduction(p: Entity, type: DamageType): { pct: number; stability: number } {
  const d = p.pl!.derived;
  if (d.twoHanded || !d.shield) {
    // weapon guard (GAME_DESIGN §5.4)
    return { pct: type === 'physical' ? 0.45 : 0.15, stability: 12 };
  }
  const v = d.shieldVals;
  let pct = type === 'physical' ? v.physical : type === 'holy' || type === 'void' ? v.holyVoid : v.elemental;
  if (!d.shieldMeetsReq) pct *= 0.5;
  return { pct, stability: d.shield.stability };
}

/** A player's guard: shield, or two-handed weapon guard (Phalanx improves it). */
function guardValues(w: World, p: Entity, type: DamageType): { pct: number; stability: number } {
  const g = blockReduction(p, type);
  const phalanx = p.buffs?.find((b) => b.id === 'phalanx' && b.until > w.time);
  if (phalanx && (p.pl!.derived.twoHanded || !p.pl!.derived.shield)) {
    return { pct: type === 'physical' ? 0.8 : 0.4, stability: 12 };
  }
  return g;
}

/**
 * An enemy attack (or hazard/projectile) hits a player.
 * fromX/fromY is where the hit comes from (attacker or projectile position) for block facing.
 */
export function hitPlayer(w: World, attackerId: number, p: Entity, spec: DamageSpec, fromX: number, fromY: number, projectile?: Entity): HitResult {
  const pl = p.pl!;
  const hp = p.hp!;
  const now = w.time;
  if (pl.downed || pl.deadUntilRest || hp.dead) return 'none';
  if (hp.invulnUntil > now) return 'immune';
  const attacker = w.get(attackerId);

  // i-frames (dodge, Meteor Lunge, Vault) never work against Piercing
  if (spec.kind !== 'pierce' && now >= pl.iframesFrom && now < pl.iframesUntil) {
    w.fx('dodge', p.x, p.y);
    return 'dodged';
  }

  // Riposte Stance: any non-Red hit is parried and auto-riposted
  if (pl.stanceUntil > now && spec.kind !== 'red' && spec.kind !== 'pierce') {
    if (attacker && attacker.en) {
      parryEnemy(w, p, attacker);
      const riposte = { ...emptySpec('player'), dmg: { physical: pl.derived.weaponPower * pl.stanceRiposteMult } };
      hitEnemy(w, p, attacker, riposte, p.x, p.y);
    }
    w.emit({ t: 'parry', x: p.x, y: p.y, playerId: pl.playerId });
    return 'parried';
  }

  const facingHit = frontOf(p, fromX, fromY, 180);
  const d = pl.derived;
  const canGuard = pl.blocking && d.canBlock && facingHit && pl.state !== 'stagger';

  // Parry: shield parry window, parryable normal attacks and projectiles only
  if (pl.parryUntil > now && facingHit && d.canBlock && d.shield && d.shield.parryS && d.shieldMeetsReq && spec.kind === 'normal' && spec.parryable) {
    if (projectile && projectile.pr) {
      reflectProjectile(w, projectile, p);
    } else if (attacker && attacker.en) {
      parryEnemy(w, p, attacker);
    }
    pl.parryUntil = 0;
    w.sfx('parry', p.x);
    w.emit({ t: 'parry', x: p.x, y: p.y, playerId: pl.playerId });
    w.fx('parry', (p.x + fromX) / 2, (p.y + fromY) / 2);
    return 'parried';
  }

  let mult = 1;
  if (pl.guardBrokenUntil > now) mult *= 1.5;
  if (p.st?.shockArmed) {
    mult *= 1.2;
    p.st.shockArmed = false;
    interrupt(w, p, PLAYER_STAGGER_S);
  }
  mult *= 1 + buffSum(p, 'damageTakenPct', now);
  if (spec.kind === 'red') mult *= d.redTakenMult;
  if (d.powers.has('hollow_guard') && hp.hp < hp.max * 0.3) mult *= 0.7;
  if (attacker?.en) {
    const lateFee = w.roomMods.lateFeeUntil > now ? 0.2 : 0;
    const enrage = w.roomMods.enrageUntil > now ? 0.25 : 0;
    mult *= 1 + buffSum(attacker, 'damagePct', now) + lateFee + enrage;
    mult *= sanctuaryEnemyMult(w, p);
  }
  // Overcharge: you take +10%
  if (d.powers.has('overcharge')) mult *= 1.1;

  let total = 0;
  let blockedAny = false;
  let guardBroke = false;
  let staminaCost = 0;
  if (canGuard && spec.kind === 'red') {
    // Red: the block fails, full damage and guard break
    guardBroke = true;
  }
  for (const t of DAMAGE_TYPES) {
    let amt = spec.dmg[t] ?? 0;
    if (amt <= 0) continue;
    amt *= mult;
    if (canGuard && spec.kind !== 'red') {
      const g = guardValues(w, p, t);
      const blocked = amt * g.pct;
      staminaCost += (g.stability * blocked) / 100;
      amt -= blocked;
      blockedAny = true;
    }
    let def = d.defense[t] + buffSum(p, 'defenseAll', now) + buffSum(p, `defense:${t}`, now);
    if (t === 'physical') amt *= 1 + buffSum(p, 'physicalTakenPct', now);
    def = Math.max(0, def);
    total += damageAfterDefense(amt, def);
  }
  if (blockedAny) {
    staminaCost *= d.stabilityMult;
    const stam = p.stam!;
    pl.stamDelayUntil = now + 0.8;
    if (stam.cur - staminaCost <= 0) {
      stam.cur = 0;
      if (!(d.powers.has('unyielding') && total + specTotal(spec) * 0 < hp.max * 0.1)) guardBroke = true;
    } else stam.cur -= staminaCost;
    w.sfx('block', p.x);
    w.fx('block', p.x + Math.cos(p.facing) * 16, p.y + Math.sin(p.facing) * 16);
    // Spiked greatshield: blocking a melee hit deals ×0.5 back
    if (d.shield?.thorns && attacker?.en && !projectile) {
      const back = { ...emptySpec('player'), dmg: { physical: specTotal(spec) * d.shield.thorns } };
      hitEnemy(w, p, attacker, back, p.x, p.y);
    }
    if (d.shield?.blockHealPct) heal(w, p, hp.max * d.shield.blockHealPct, false);
    w.hooks.onPlayerBlocked?.(w, p, attacker ?? null);
  }
  if (guardBroke) {
    pl.guardBrokenUntil = now + GUARD_BREAK_S;
    pl.blocking = false;
    interrupt(w, p, GUARD_BREAK_S);
    w.sfx('guardBreak', p.x);
    w.emit({ t: 'guardBreak', playerId: pl.playerId });
  }

  // Martyr's Chain: split with the linked ally
  if (pl.link && pl.link.until > now) {
    const other = w.get(pl.link.otherId);
    if (other && other.hp && !other.hp.dead && !other.pl?.downed) {
      const share = total * pl.link.split;
      total -= share;
      rawDamage(w, other, share, 'void', attackerId);
    }
  }

  // barrier absorbs first
  if (hp.barrier > 0 && hp.barrierUntil > now) {
    const a = Math.min(hp.barrier, total);
    hp.barrier -= a;
    total -= a;
  }

  if (!w.god && total > 0) {
    hp.hp -= total;
    hp.lastHitAt = now;
    hp.lastHitBy = attackerId;
  }
  p.anim.flashUntil = now + 0.08;
  if (total > 0) {
    w.emit({ t: 'dmg', x: p.x, y: p.y - 20, amount: total, type: dominantType(spec), crit: false, toPlayer: true, targetId: p.id });
    w.emit({ t: 'shake', amount: Math.min(14, 3 + (total / Math.max(1, hp.max)) * 40) });
    w.sfx('hitFlesh', p.x, 0.9, 0.8);
  }
  // momentum resets when hit
  pl.momentum = 0;
  if (attacker?.en?.elite === 'vampiric' && total > 0) heal(w, attacker, total * 0.2);

  // interrupt: ≥ 8% max HP (+poise buffs) unless hyper armor; grabs always
  const threshold = hp.max * (d.poiseThresholdPct + buffSum(p, 'poiseThreshold', now) / 100);
  const hyper = playerHyperArmor(w, p);
  if (!guardBroke && total >= threshold && !hyper && !blockedAny) interrupt(w, p, PLAYER_STAGGER_S);

  // statuses and controls
  for (const s of spec.status) applyStatusBuild(w, p, s.id, s.buildup * (blockedAny ? 0.5 : 1));
  if (spec.control) applyControl(w, p, spec.control.id, spec.control.durationS);
  if (spec.staminaDrain && p.stam) p.stam.cur = Math.max(0, p.stam.cur - spec.staminaDrain);
  if (spec.knockback > 0 && !blockedAny) knockback(w, p, fromX, fromY, spec.knockback);
  if (spec.grab && !blockedAny && attacker) startHold(w, p, attacker, spec);
  if (spec.pull && attacker) {
    const dx = attacker.x - p.x;
    const dy = attacker.y - p.y;
    const dd = Math.hypot(dx, dy) || 1;
    const sp = Math.min(spec.pull.speed, dd / spec.pull.durationS);
    p.forced = { vx: (dx / dd) * sp, vy: (dy / dd) * sp, until: now + spec.pull.durationS, kind: 'pull' };
  }
  if (spec.onHitEffects && attacker) w.hooks.onEnemyHitEffects?.(w, attacker, p, spec.onHitEffects);
  checkDeath(w, p, attackerId);
  return blockedAny ? 'blocked' : 'hit';
}

function sanctuaryEnemyMult(w: World, p: Entity): number {
  for (const h of w.entities.values()) {
    if (h.type !== 'hazard' || !h.hz || h.removed || !h.hz.enemyDamagePct) continue;
    for (const s of h.hz.shapes) if (s.k === 'circle' && Math.hypot(s.x - p.x, s.y - p.y) <= s.r) return 1 - h.hz.enemyDamagePct;
  }
  return 1;
}

export function playerHyperArmor(w: World, p: Entity): boolean {
  const pl = p.pl!;
  const now = w.time;
  if (p.buffs?.some((b) => b.id.startsWith('hyper') && b.until > now)) return true;
  if (pl.action?.hyperArmor || pl.channel?.hyperArmor || pl.charge?.hyperArmor) return true;
  const c = pl.combo;
  if (c && c.phase === 'active') {
    const ha = pl.derived.weapon.hyperArmor ?? 'none';
    if (ha === 'all') return true;
    if (ha === 'last' && c.idx === pl.derived.weapon.combo.length - 1) return true;
  }
  return false;
}

function startHold(w: World, p: Entity, attacker: Entity, spec: DamageSpec): void {
  const pl = p.pl!;
  const g = spec.grab!;
  const now = w.time;
  interrupt(w, p, 0);
  pl.state = 'held';
  pl.stateUntil = now + g.holdS;
  pl.holdBy = attacker.id;
  pl.holdUntil = now + g.holdS;
  pl.holdDmg = specTotal(spec) * (g.mult - 1);
  pl.holdType = dominantType(spec);
  pl.holdStatus = spec.status[0] ?? null;
  if (g.staminaDrain && p.stam) p.stam.cur = Math.max(0, p.stam.cur - g.staminaDrain);
  p.st!.controls.hold = now + g.holdS;
  if (attacker.en) attacker.en.holdingId = p.id;
}

export function knockback(w: World, e: Entity, fromX: number, fromY: number, dist: number): void {
  if (e.en && (e.en.isBoss || e.en.def.traits?.noFlinch)) return;
  const dx = e.x - fromX;
  const dy = e.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  const dur = 0.25;
  e.forced = { vx: ((dx / d) * dist) / dur, vy: ((dy / d) * dist) / dur, until: w.time + dur, kind: 'knock' };
}

function dominantType(spec: DamageSpec): DamageType {
  let best: DamageType = 'physical';
  let bv = -1;
  for (const t of DAMAGE_TYPES) if ((spec.dmg[t] ?? 0) > bv) {
    bv = spec.dmg[t] ?? 0;
    best = t;
  }
  return best;
}

function parryEnemy(w: World, p: Entity, attacker: Entity): void {
  const en = attacker.en!;
  const hp = attacker.hp!;
  const now = w.time;
  if (en.isBoss) {
    // bosses need two parries within 6 s
    en.hitTimes = en.hitTimes.filter((t) => t > now - 6);
    en.hitTimes.push(now);
    if (en.hitTimes.filter((t) => t > now - 6).length < 2) {
      cancelEnemyAttack(w, attacker);
      return;
    }
    en.hitTimes = [];
  }
  cancelEnemyAttack(w, attacker);
  hp.riposteUntil = now + PARRY_RIPOSTE_S;
  hp.staggerUntil = now + PARRY_RIPOSTE_S;
  en.state = 'stagger';
  en.flippedUntil = Math.max(en.flippedUntil, now + (en.def.traits?.shell?.flipS ?? 0));
  p.pl!.riposteBuffUntil = now + PARRY_RIPOSTE_S;
  p.pl!.riposteTarget = attacker.id;
  w.hooks.onPlayerParried?.(w, p, attacker);
}

function reflectProjectile(w: World, proj: Entity, p: Entity): void {
  const pr = proj.pr!;
  const owner = w.get(pr.ownerId);
  const tx = owner ? owner.x : proj.x - proj.vx;
  const ty = owner ? owner.y : proj.y - proj.vy;
  const a = Math.atan2(ty - proj.y, tx - proj.x);
  const sp = Math.hypot(proj.vx, proj.vy);
  proj.vx = Math.cos(a) * sp;
  proj.vy = Math.sin(a) * sp;
  pr.team = 0;
  pr.kind = 'player';
  pr.reflected = true;
  pr.ownerId = p.id;
  pr.homing = 0;
  pr.hit.clear();
  if (p.pl!.derived.powers.has('mirror_face')) for (const k of DAMAGE_TYPES) if (pr.dmg[k]) pr.dmg[k] = pr.dmg[k]! * 2;
}

// ---------------------------------------------------------------- players hit enemies

export interface PlayerHitOpts {
  heavy?: boolean;
  /** this hit is a light attack (riposte bonus applies) */
  light?: boolean;
  noLifesteal?: boolean;
}

/** A player (or player-owned thing) hits an enemy. Returns the damage dealt. */
export function hitEnemy(w: World, attacker: Entity | null, e: Entity, spec: DamageSpec, fromX: number, fromY: number, o: PlayerHitOpts = {}): number {
  const en = e.en!;
  const hp = e.hp!;
  const now = w.time;
  if (hp.dead) return 0;
  if (en.state === 'spawning' || en.state === 'ceiling' || en.phaseTransitionUntil > now || hp.invulnUntil > now || en.fadeUntil > now) {
    w.fx('immune', e.x, e.y - e.radius);
    return 0;
  }
  if (en.gary) {
    en.garyHits++;
    w.hooks.onGaryHit?.(w, e, attacker);
    return 0;
  }
  if (en.isIllusion) {
    hp.hp = 0;
    checkDeath(w, e, attacker?.id ?? 0);
    return 0;
  }
  const traits = en.def.traits ?? {};
  const pl = attacker?.pl;
  let mult = 1;
  let crit = false;
  // front guard (whips and Shield Breaker go over it)
  const guard = traits.frontGuard ?? en.def.frontGuard ?? 0;
  if (guard > 0 && !spec.ignoreFrontGuard && frontOf(e, fromX, fromY, traits.frontGuardArcDeg ?? 120) && hp.staggerUntil < now) {
    if (guard >= 1) {
      w.sfx('hitMetal', e.x);
      w.fx('block', (e.x + fromX) / 2, (e.y + fromY) / 2);
      // unbreakable guard: poise still chips
      return 0;
    }
    mult *= 1 - guard;
    w.sfx('hitMetal', e.x, 0.6);
  }
  if (traits.shell && en.flippedUntil < now && frontOf(e, fromX, fromY, 160)) mult *= traits.shell.frontMult;
  if (traits.shell && en.flippedUntil > now) mult *= traits.shell.flippedMult;
  if (traits.backMult && behind(e, fromX, fromY)) mult *= traits.backMult;
  if (traits.submerged && en.state === 'submerged') mult *= 0.5;
  if (pl) {
    const wpn = pl.derived.weapon;
    if (wpn.backstabMult && behind(e, fromX, fromY) && o.light) {
      mult *= wpn.backstabMult;
      crit = true;
    }
    if (o.light && hp.riposteUntil > now && pl.riposteBuffUntil > now) {
      mult *= pl.derived.powers.has('riposte_master') ? 4 : 3;
      if (wpn.ripostedCritMult) mult *= wpn.ripostedCritMult;
      crit = true;
      pl.riposteBuffUntil = 0;
      hp.riposteUntil = 0;
      w.sfx('riposte', e.x);
      if (pl.derived.powers.has('riposte_master')) heal(w, attacker!, attacker!.hp!.max * 0.05);
    }
    if (spec.critVs) {
      if (spec.critVs === 'staggered' && (hp.staggerUntil > now || hp.riposteUntil > now)) {
        mult *= spec.critMult ?? 2;
        crit = true;
      } else if (spec.critVs.startsWith('hpBelow')) {
        const pct = parseFloat(spec.critVs.slice(8)) / 100;
        if (hp.hp < hp.max * pct) {
          mult *= spec.critMult ?? 2;
          crit = true;
        }
      }
    }
    if (pl.derived.powers.has('momentum')) mult *= 1 + 0.03 * Math.min(10, pl.momentum);
    if (pl.derived.rings.has('ring_stillness') && now - pl.stillSince >= 1) mult *= 1.15;
  }
  if (en.elite === 'armored') spec = { ...spec, dmg: { ...spec.dmg, physical: (spec.dmg.physical ?? 0) * 0.6 } };
  if (attacker) mult *= 1 + buffSum(attacker, 'damagePct', now);

  let total = 0;
  const resist = en.def.resist;
  for (const t of DAMAGE_TYPES) {
    let amt = spec.dmg[t] ?? 0;
    if (amt <= 0) continue;
    let r = resist[t] ?? 0;
    if (t === 'holy' && traits.holyMult) r = 1 - traits.holyMult;
    if (t === 'lightning' && w.roomMods.lightningBonusUntil > now) r -= 0.4;
    if (t === 'holy' && attacker) amt *= 1 + buffSum(attacker, 'holyDamagePct', now);
    if ((t === 'holy' || t === 'void') && spec.undeadMult && (en.def.undead || en.def.zone === 8)) amt *= spec.undeadMult;
    // Sunder: skills ignore 30% of enemy defense (resistances)
    if (spec.isSkill && pl?.derived.powers.has('sunder') && r > 0) r *= 0.7;
    amt *= Math.max(0, 1 - r);
    total += amt;
  }
  total *= mult;
  if (total <= 0) return 0;
  if (hp.barrier > 0 && hp.barrierUntil > now) {
    const a = Math.min(hp.barrier, total);
    hp.barrier -= a;
    total -= a;
    w.fx('barrier', e.x, e.y);
  }
  hp.hp -= total;
  hp.lastHitAt = now;
  hp.lastHitBy = attacker?.id ?? 0;
  e.anim.flashUntil = now + 0.08;
  const shown = total;
  w.emit({ t: 'dmg', x: e.x, y: e.y - e.radius - 4, amount: shown, type: dominantTypeOf(spec), crit, toPlayer: false, targetId: e.id });
  w.sfx(en.def.hitSound ?? 'hitFlesh', e.x, 0.8, 0.9 + (w.tick % 5) * 0.04);
  w.fx('hit', e.x, e.y, { color: typeColor(dominantTypeOf(spec)), n: crit ? 14 : 7, a: Math.atan2(e.y - fromY, e.x - fromX) });

  // aggro
  if (attacker) en.aggro[attacker.id] = (en.aggro[attacker.id] ?? 0) + total;
  // lifesteal
  if (pl && !o.noLifesteal && pl.derived.lifesteal > 0) heal(w, attacker!, total * pl.derived.lifesteal, false);
  if (pl) {
    pl.momentum = Math.min(10, pl.momentum + 1);
    pl.hitCounter++;
  }
  // Ghost revive scoring handled by the attack system; poise and stagger:
  if (!en.isBoss || spec.poiseDmg > 0) {
    let poise = spec.poiseDmg * (en.isBoss ? (spec.bossPoiseMult ?? 1) : 1);
    if (attacker) poise *= 1 + buffSum(attacker, 'poiseDamagePct', now);
    if (pl) poise *= pl.derived.poiseDmgMult;
    hp.poise -= poise;
    hp.poiseRegenAt = now + 3;
    const hyper = (en.def.hyperArmor || en.attack?.def.hyperArmor) && en.attack && en.attack.phase !== 'recover';
    if ((hp.poise <= 0 || spec.guaranteedStagger) && !hyper && !traits.noFlinch) {
      const heavy = o.heavy ?? false;
      hp.poise = hp.poiseMax;
      interrupt(w, e, en.isBoss ? 1.2 : heavy ? 0.9 : 0.6);
      if (traits.shell) en.flippedUntil = now + traits.shell.flipS;
      w.sfx('stagger', e.x);
    }
  }
  for (const s of spec.status) applyStatusBuild(w, e, s.id, s.buildup * (1 + (s.id === 'bleed' && attacker ? buffSum(attacker, 'bleedBuildupPct', now) : 0)));
  if (spec.control) applyControl(w, e, spec.control.id, en.isBoss && spec.control.id === 'freeze' ? spec.control.durationS : spec.control.durationS);
  if (spec.root && !en.isBoss) en.rootUntil = Math.max(en.rootUntil, now + spec.root);
  if (spec.knockback > 0) knockback(w, e, fromX, fromY, spec.knockback);
  if (spec.pullToSource && attacker && !en.isBoss) {
    const dx = attacker.x - e.x;
    const dy = attacker.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d > 50) e.forced = { vx: (dx / d) * (d - 40) / 0.25, vy: (dy / d) * (d - 40) / 0.25, until: now + 0.25, kind: 'pull' };
  }
  // elite Shielded and others react; Will-o-Wisp blinks when hit twice in 1 s (data: extras with trigger onHitTwice)
  en.hitTimes = en.hitTimes.filter((t) => t > now - 1).concat(now);
  w.hooks.onEnemyHurt?.(w, e, attacker);
  checkDeath(w, e, attacker?.id ?? 0);
  if (pl && attacker) w.hooks.onPlayerHitEnemy?.(w, attacker, e, total, spec);
  return total;
}

function dominantTypeOf(spec: DamageSpec): DamageType {
  return dominantType(spec);
}

export function typeColor(t: DamageType): string {
  switch (t) {
    case 'physical':
      return '#f2e8d8';
    case 'fire':
      return '#ff7a1a';
    case 'frost':
      return '#9ad0ff';
    case 'lightning':
      return '#ffe14a';
    case 'holy':
      return '#fff3b0';
    case 'void':
      return '#b06bff';
  }
}

/** Add revive progress to a ghost (D12). */
export function addRevive(w: World, ghost: Entity, attacker: Entity, value: number): void {
  const gp = ghost.pl!;
  if (!gp.downed) return;
  let v = value;
  if (attacker.pl?.derived.rings.has('ghost_lantern')) v *= 2;
  gp.reviveProgress += v;
  w.sfx('reviveTick', ghost.x);
  w.fx('revive', ghost.x, ghost.y);
  if (gp.reviveProgress >= gp.reviveNeed) w.hooks.onRevive?.(w, ghost);
}

export { reviveRequirement };

export function statusTickActive(w: World, e: Entity): void {
  const st = e.st;
  if (!st || !e.hp || e.hp.dead) return;
  const now = w.time;
  const max = e.hp.max;
  if (st.active.burn > now && now >= st.burnTickAt) {
    st.burnTickAt = now + 1;
    let k = 1;
    if (e.en?.def.traits?.burnKills) k = 2;
    rawDamage(w, e, max * 0.03 * k * (e.en?.isBoss ? 0.4 : 1), 'fire', e.hp.lastHitBy);
  }
  if (st.active.poison > now && now >= st.poisonTickAt) {
    st.poisonTickAt = now + 1;
    rawDamage(w, e, max * 0.02 * (e.en?.isBoss ? 0.4 : 1), 'physical', e.hp.lastHitBy);
  }
}

/** Decay meters 15/s when not applied (0.5 s grace), expire controls. */
export function statusDecay(w: World, e: Entity, dt: number): void {
  const st = e.st;
  if (!st) return;
  const now = w.time;
  for (const k of ['burn', 'chill', 'shock', 'bleed', 'poison'] as StatusId[]) {
    if (st.meters[k] > 0 && now - st.lastBuild[k] > 0.5) st.meters[k] = Math.max(0, st.meters[k] - STATUS_DECAY * dt);
  }
  if (e.st && statusActive(e, 'shock', now) === false) e.st.shockArmed = false;
  if (hasControl(e, 'root', now) === false && e.en) {
    /* enemy roots are tracked on en.rootUntil */
  }
}

export function cleanse(e: Entity, what: ('statuses' | 'controls')[]): void {
  const st = e.st;
  if (!st) return;
  if (what.includes('statuses')) {
    for (const k of ['burn', 'chill', 'shock', 'bleed', 'poison'] as StatusId[]) {
      st.meters[k] = 0;
      st.active[k] = 0;
    }
    st.shockArmed = false;
  }
  if (what.includes('controls')) {
    for (const k of Object.keys(st.controls) as ControlId[]) if (k !== 'hold') st.controls[k] = 0;
  }
}

export function grantBarrier(w: World, e: Entity, amount: number, durationS: number): void {
  if (!e.hp) return;
  e.hp.barrier = Math.max(e.hp.barrier, amount);
  e.hp.barrierUntil = w.time + durationS;
}

export { addBuff };
