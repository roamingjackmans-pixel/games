// The damage pipeline (GAME_DESIGN §3.1, §5.2–5.6, §6.3): players hit enemies, enemies hit players.
// Red: block and parry fail (guard break), i-frames work. Piercing: i-frames fail, block works, parry fails.
import { affinityMult, elementGlow, enemyElement } from '../elements';
import { bestiaryDealMult, bestiaryTakenMult } from '../../data/bestiary';
import { STAMINA_COST_MULT, damageAfterDefense, reviveRequirement } from './formulas';
import { bossPhaseCheck } from './bossPhase';
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

/** How fast each status builds, on everyone (D330: frost twice as fast as it was). */
export const STATUS_BUILD_MULT: Partial<Record<StatusId, number>> = { chill: 2 };

/** D336: a Vampiric Elite's heal for each hit that lands, as a share of its own max HP. */
export const VAMPIRIC_HEAL_PCT = 0.3;

export function applyStatusBuild(w: World, e: Entity, id: StatusId, amount: number): void {
  const st = e.st;
  if (!st || amount <= 0) return;
  amount *= STATUS_BUILD_MULT[id] ?? 1;
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
  // a full stun on a player (a freeze, a hold) goes through the one stun rule (D293)
  if (e.pl && isFullStun(id)) {
    const len = startPlayerStun(w, e, durationS);
    if (len <= 0) return;
    st.controls[id] = now + len;
    if (id === 'freeze') interrupt(w, e, 0);
    return;
  }
  st.controls[id] = Math.max(st.controls[id], now + durationS);
  if (id === 'freeze') interrupt(w, e, 0);
  if (id === 'hexed' && e.pl) e.pl.dodgeReadyAt = Math.max(e.pl.dodgeReadyAt, now) + 0;
}

/** Cancel the current action (players: 0.3 s stagger; enemies: stop the windup). */
export function interrupt(w: World, e: Entity, staggerS: number): void {
  const now = w.time;
  if (e.pl) {
    const p = e.pl;
    // a held player stays held: a second hit does not stagger them out of the grab (its end, and the grace after it, stand)
    if (p.state === 'dodge' || p.state === 'falling' || p.state === 'held') return;
    p.combo = null;
    p.action = null;
    p.channel = null;
    p.charge = null;
    p.healOver = p.healOver.filter((h) => !h.interruptible);
    if (staggerS > 0) {
      p.state = 'stagger';
      p.stateUntil = now + staggerS;
    } else p.state = 'idle';
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

export function wakeMimic(w: World, e: Entity): void {
  const en = e.en!;
  if (en.state !== 'dormant') return;
  en.state = 'alert';
  en.mimicChestId = 'awake:' + (en.mimicChestId ?? '');
  en.thinkAt = w.time + 0.4;
  e.anim.pose = 'windup';
  w.sfx('mimicBite', e.x, 0.8);
  w.emit({ t: 'msg', text: 'The chest has teeth!', color: '#ff9b6a' });
  w.hooks.onMimicWake?.(w, e);
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
  // D329: nothing hurts a player out of combat: no burn or bleed ticks, falls or harmful ground
  if (e.pl && !w.hostilesPresent()) return;
  if (e.en?.gary) return;
  if (e.en?.isBoss && e.en.phaseTransitionUntil > w.time) return;
  if (e.en?.def.traits?.invulnerable) return;
  // a mimic eating the last player standing cannot be hurt: solo, opening one is always fatal (D179)
  if (e.en?.devour && w.livingPlayers().length <= 1) return;
  // two targets, one bar: a split body's damage (burn, bleed…) lands on the boss it is linked to
  const host = barHost(w, e);
  if (host) {
    if (showNumber) w.emit({ t: 'dmg', x: e.x, y: e.y - e.radius, amount, type, crit: false, toPlayer: false, targetId: e.id, src: sourceId });
    rawDamage(w, host, amount, type, sourceId, false);
    return;
  }
  e.hp.hp -= amount;
  e.hp.lastHitBy = sourceId || e.hp.lastHitBy;
  if (showNumber) w.emit({ t: 'dmg', x: e.x, y: e.y - e.radius, amount, type, crit: false, toPlayer: !!e.pl, targetId: e.id, src: sourceId });
  if (e.en?.isBoss) bossPhaseCheck(w, e);
  checkDeath(w, e, sourceId);
}

/** The boss whose health bar a split body shares (EnemyC.linkedTo on a non-boss), if it still stands. */
export function barHost(w: World, e: Entity): Entity | null {
  if (!e.en?.linkedTo || e.en.isBoss) return null;
  const h = w.get(e.en.linkedTo);
  return h?.hp && !h.hp.dead ? h : null;
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
  w.emit({ t: 'death', id: e.id, x: e.x, y: e.y, isPlayer: false, defId: e.en?.def.id ?? '', by: killerId, elite: e.en?.elite ?? null, ...(e.en?.bonusBoss ? { bonus: true } : {}) });
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
  return { pct, stability: d.shieldStability || d.shield.stability };
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
  // D329: nothing hurts a player out of combat (a stray shot or hazard left over after the last enemy)
  if (!w.hostilesPresent()) return 'none';
  // off the edge, climbing back: out of reach until you are back on the floor
  if (pl.falling) return 'none';
  if (hp.invulnUntil > now) return 'immune';
  const attacker = w.get(attackerId);

  // i-frames (dodge, Meteor Lunge, Vault) never work against Piercing
  if (spec.kind !== 'pierce' && now >= pl.iframesFrom && now < pl.iframesUntil) {
    w.fx('dodge', p.x, p.y);
    return 'dodged';
  }

  // Riposte Stance: any non-Red enemy hit is parried and auto-riposted (an ally's friendly fire is only blocked)
  if (pl.stanceUntil > now && spec.kind !== 'red' && spec.kind !== 'pierce' && spec.kind !== 'player') {
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

  // a well-timed block with nothing to parry with: no parry, but the timing is noted (D96)
  if (pl.bareParryUntil > now && facingHit && spec.kind === 'normal' && spec.parryable && attacker?.en) {
    pl.bareParryUntil = 0;
    w.hooks.onTimedBlock?.(w, p, attacker);
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
    staminaCost *= d.stabilityMult * STAMINA_COST_MULT;
    const stam = p.stam!;
    pl.stamDelayUntil = now + 0.8;
    if (stam.cur - staminaCost <= 0) {
      stam.cur = 0;
      if (!(d.powers.has('unyielding') && total + specTotal(spec) * 0 < hp.max * 0.1)) guardBroke = true;
    } else stam.cur -= staminaCost;
    w.sfx('block', p.x);
    w.fx('block', p.x + Math.cos(p.facing) * 16, p.y + Math.sin(p.facing) * 16);
    // Warden (legendary shield): each blocked hit heals allies within 120 px by 1% of their max HP
    if (d.powers.has('warden')) {
      for (const a of w.players) if (a !== p && !a.pl!.downed && a.hp && Math.hypot(a.x - p.x, a.y - p.y) <= 120) heal(w, a, a.hp.max * 0.01);
    }
    // Spiked greatshield: blocking a melee hit deals ×0.5 back
    if (d.shield?.thorns && attacker?.en && !projectile) {
      const back = { ...emptySpec('player'), dmg: { physical: specTotal(spec) * d.shield.thorns } };
      hitEnemy(w, p, attacker, back, p.x, p.y);
    }
    if (d.shield?.blockHealPct) heal(w, p, hp.max * d.shield.blockHealPct, false);
    w.emit({ t: 'stat', key: 'blocks', playerId: pl.playerId });
    w.hooks.onPlayerBlocked?.(w, p, attacker ?? null);
  }
  if (guardBroke) {
    pl.guardBrokenUntil = now + GUARD_BREAK_S;
    pl.blocking = false;
    interrupt(w, p, GUARD_BREAK_S);
    w.sfx('guardBreak', p.x);
    w.emit({ t: 'guardBreak', playerId: pl.playerId });
  }

  // the Bestiary (D229): an enemy you have studied deals 25% less to you
  if (attacker?.en) total *= bestiaryTakenMult(pl.char, attacker.en.def);

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
    w.emit({ t: 'dmg', x: p.x, y: p.y - 20, amount: total, type: dominantType(spec), crit: false, toPlayer: true, targetId: p.id, src: attackerId });
    w.emit({ t: 'shake', amount: Math.min(14, 3 + (total / Math.max(1, hp.max)) * 40) });
    w.sfx('hitFlesh', p.x, 0.9, 0.8);
  }
  // momentum resets when hit
  pl.momentum = 0;
  // D336: a Vampiric Elite heals 30% of its own max HP for each hit that lands (it was 20% of the damage)
  if (attacker?.en?.elite === 'vampiric' && total > 0 && attacker.hp) heal(w, attacker, attacker.hp.max * VAMPIRIC_HEAL_PCT);

  // interrupt: a hit of at least your poise (D312: 8% of max HP + armour + shield, + poise buffs) staggers you unless
  // hyper armor; a projectile needs twice that; grabs always
  const threshold = hp.max * (d.poiseThresholdPct + buffSum(p, 'poiseThreshold', now) / 100) * (projectile ? 2 : 1);
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

// ---------------------------------------------------------------- players hit players (friendly fire, D115)

/**
 * The co-op allies a player's attack can hurt: every other standing player, while the host's friendly fire is
 * above 0%. Never the attacker; never a ghost (hitting a downed ally's ghost revives them, D12); nobody in solo.
 */
export function ffVictims(w: World, attacker: Entity | null | undefined): Entity[] {
  if (!attacker?.pl || !(w.friendlyFire > 0) || w.players.length < 2) return [];
  return w.livingPlayers().filter((p) => p !== attacker);
}

/**
 * A player's damaging attack lands on a standing co-op ally: the normal player hit pipeline (i-frames, block,
 * defense, barrier, statuses) with the damage and status buildup scaled by the friendly-fire multiplier. The hit
 * is of kind 'player', so it is never parried or riposted and never staggers the attacker; grabs, pulls and
 * enemy on-hit effects do not carry over. Attacks that deal no damage (pure control, buffs) never hit allies.
 */
export function hitAlly(w: World, attacker: Entity | null | undefined, p: Entity, spec: DamageSpec, fromX: number, fromY: number, projectile?: Entity): HitResult {
  const k = w.friendlyFire;
  if (!attacker?.pl || !p.pl || p === attacker || !(k > 0) || w.players.length < 2) return 'none';
  if (specTotal(spec) <= 0) return 'none';
  // D329: no friendly fire out of combat
  if (!w.hostilesPresent()) return 'none';
  const s: DamageSpec = {
    ...scaleSpec(spec, k),
    kind: 'player',
    parryable: false,
    status: spec.status.map((x) => ({ ...x, buildup: x.buildup * k })),
    grab: null,
    pull: null,
    staminaDrain: 0,
  };
  delete s.onHitEffects;
  return hitPlayer(w, attacker.id, p, s, fromX, fromY, projectile);
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

// ------------------------------------------------------------------ the one stun rule (D293)
// A full stun stops a player acting and moving: a grab's hold, a freeze, a hold control. Every one goes through
// startPlayerStun: (a) it lasts PLAYER_STUN_MULT of its listed length (D288); (b) none takes hold while one is on, nor
// for STUN_GRACE_S after one ends (D274, now for every kind); (c) one that starts within STUN_CHAIN_S of the last one
// ending is halved again for each one before it in that chain, down to STUN_CHAIN_FLOOR. The stagger is not a stun.

/** Full stuns on a player last this share of their listed length (D288: 30% shorter). */
export const PLAYER_STUN_MULT = 0.7;
/** After a full stun ends, this long before another can take hold (s). */
export const STUN_GRACE_S = 0.5;
/** A full stun starting within this long after the last one ended is part of a chain, and shorter (s). */
export const STUN_CHAIN_S = 6;
/** The shortest a chained stun gets, as a share of its (already cut) length: 1, ½, ¼, ¼… */
export const STUN_CHAIN_FLOOR = 0.25;

/** The controls that are full stuns on a player (root, blind, silence and hexed are not: you can still act). */
export function isFullStun(id: ControlId): boolean {
  return id === 'freeze' || id === 'hold';
}

/** Is a player under a full stun right now (held, frozen, or under a hold control)? */
export function playerStunned(w: World, p: Entity): boolean {
  if (!p.pl) return false;
  return p.pl.state === 'held' || hasControl(p, 'freeze', w.time) || hasControl(p, 'hold', w.time);
}

/** Is a player stunned now or in the grace after one? No new full stun takes hold then. */
export function stunProtected(w: World, p: Entity): boolean {
  const pl = p.pl;
  if (!pl) return false;
  return playerStunned(w, p) || (pl.stunImmuneUntil ?? 0) > w.time;
}

/** How long a full stun listed at `listedS` would last on this player if it started now (0: it would not take hold). */
export function playerStunLength(w: World, p: Entity, listedS: number): number {
  const pl = p.pl;
  if (!pl || stunProtected(w, p)) return 0;
  const chain = w.time < (pl.stunChainUntil ?? 0) ? (pl.stunChain ?? 0) : 0;
  return listedS * PLAYER_STUN_MULT * Math.max(STUN_CHAIN_FLOOR, Math.pow(0.5, chain));
}

/** Start a full stun on a player under the one rule: its length (0 when refused). The caller applies the stun itself. */
export function startPlayerStun(w: World, p: Entity, listedS: number): number {
  const pl = p.pl!;
  const len = playerStunLength(w, p, listedS);
  if (len <= 0) return 0;
  const now = w.time;
  pl.stunChain = (now < (pl.stunChainUntil ?? 0) ? (pl.stunChain ?? 0) : 0) + 1;
  endPlayerStun(p, now + len);
  return len;
}

/** A full stun ends (or is planned to) at `at`: the grace and the chain window count from there. */
export function endPlayerStun(p: Entity, at: number): void {
  const pl = p.pl!;
  pl.stunImmuneUntil = at + STUN_GRACE_S;
  pl.stunChainUntil = at + STUN_CHAIN_S;
}

/** A fresh start (a rest, a respawn, a revive): no grace, no chain. */
export function resetPlayerStun(p: Entity): void {
  const pl = p.pl;
  if (!pl) return;
  pl.stunImmuneUntil = 0;
  pl.stunChainUntil = 0;
  pl.stunChain = 0;
}

function startHold(w: World, p: Entity, attacker: Entity, spec: DamageSpec): void {
  const pl = p.pl!;
  const g = spec.grab!;
  const now = w.time;
  // a grab cannot take a player who is already stunned, nor one in the grace after a stun (the hit itself still
  // lands); a chained one is shorter (D293)
  const holdS = startPlayerStun(w, p, g.holdS);
  if (holdS <= 0) return;
  interrupt(w, p, 0);
  pl.state = 'held';
  pl.stateUntil = now + holdS;
  pl.holdBy = attacker.id;
  pl.holdUntil = now + holdS;
  pl.holdDmg = specTotal(spec) * (g.mult - 1);
  pl.holdType = dominantType(spec);
  pl.holdStatus = spec.status[0] ?? null;
  if (g.staminaDrain && p.stam) p.stam.cur = Math.max(0, p.stam.cur - g.staminaDrain);
  p.st!.controls.hold = now + holdS;
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

/** How much of a front guard's cut non-physical damage takes (D176): a 70% guard stops 70% of physical, 21% of the rest. */
export const GUARD_NONPHYS_SHARE = 0.3;

/** A hit's damage after a front guard of `guard` (0–1): physical cut by all of it, every other type by a share of it. */
export function frontGuardDmg(dmg: Partial<Record<DamageType, number>>, guard: number): Partial<Record<DamageType, number>> {
  const out: Partial<Record<DamageType, number>> = {};
  const g = Math.min(1, Math.max(0, guard));
  for (const t of DAMAGE_TYPES) {
    const v = dmg[t];
    if (v) out[t] = v * (1 - (t === 'physical' ? g : g * GUARD_NONPHYS_SHARE));
  }
  return out;
}

/** A player (or player-owned thing) hits an enemy. Returns the damage dealt. */
export function hitEnemy(w: World, attacker: Entity | null, e: Entity, spec: DamageSpec, fromX: number, fromY: number, o: PlayerHitOpts = {}): number {
  const en = e.en!;
  const hp = e.hp!;
  const now = w.time;
  if (hp.dead) return 0;
  if (en.state === 'spawning' || en.state === 'ceiling' || en.phaseTransitionUntil > now || hp.invulnUntil > now || en.fadeUntil > now || (en.devour && w.livingPlayers().length <= 1)) {
    w.fx('immune', e.x, e.y - e.radius);
    return 0;
  }
  // two targets, one bar: a split body is as invulnerable as its boss during a phase transition
  const host = barHost(w, e);
  if (host && host.en!.phaseTransitionUntil > now) {
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
  if (spec.onlyUndead && !(en.def.undead || en.def.zone === 8)) return 0;
  if (en.state === 'dormant') {
    // attacking a mimic first wakes it as a mid-tier enemy (GAME_DESIGN §6.5)
    wakeMimic(w, e);
  }
  if (traits.mimic && pl?.derived.powers.has('mimics_tooth')) mult *= 2;
  // front guard (whips and Shield Breaker go over it)
  const guard = traits.frontGuard ?? en.def.frontGuard ?? 0;
  if (guard > 0 && !spec.ignoreFrontGuard && frontOf(e, fromX, fromY, traits.frontGuardArcDeg ?? 120) && hp.staggerUntil < now) {
    // a shield stops physical hits hard; fire, frost, magic and the rest mostly get through it (D176)
    const other = DAMAGE_TYPES.reduce((sum, t) => sum + (t === 'physical' ? 0 : (spec.dmg[t] ?? 0)), 0);
    if (guard >= 1 && other <= 0) {
      w.sfx('hitMetal', e.x);
      w.fx('block', (e.x + fromX) / 2, (e.y + fromY) / 2);
      // unbreakable guard: poise still chips
      return 0;
    }
    spec = { ...spec, dmg: frontGuardDmg(spec.dmg, guard) };
    w.sfx('hitMetal', e.x, guard >= 1 ? 1 : 0.6);
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
      // D88: a riposte doubles (was ×3); Riposte Master triples
      mult *= pl.derived.powers.has('riposte_master') ? 3 : 2;
      if (wpn.ripostedCritMult) mult *= wpn.ripostedCritMult;
      crit = true;
      pl.riposteBuffUntil = 0;
      hp.riposteUntil = 0;
      w.sfx('riposte', e.x);
      w.emit({ t: 'feat', kind: 'riposte', playerId: pl.playerId, targetId: e.id });
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
    if (pl.derived.rings.has('ring_stillness') && now - pl.stillSince >= 1) mult *= Math.pow(1.15, pl.derived.ringCounts.ring_stillness ?? 1);
  }
  if (en.elite === 'armored') spec = { ...spec, dmg: { ...spec.dmg, physical: (spec.dmg.physical ?? 0) * 0.6 } };
  if (attacker) mult *= 1 + buffSum(attacker, 'damagePct', now);
  // the Bestiary (D229): +25% against an enemy you have studied
  if (pl) mult *= bestiaryDealMult(pl.char, en.def);

  let total = 0;
  const resist = en.def.resist;
  // the weakness chart (D81): the enemy's own type against each part of the hit
  const bodyType = enemyElement(en.def);
  let biggest = 0;
  let affinity: 'weak' | 'resist' | undefined;
  for (const t of DAMAGE_TYPES) {
    let amt = spec.dmg[t] ?? 0;
    if (amt <= 0) continue;
    let r = resist[t] ?? 0;
    if (t === 'holy' && traits.holyMult) r = 1 - traits.holyMult;
    if (t === 'magic' && w.roomMods.lightningBonusUntil > now) r -= 0.4;
    if (t === 'holy' && attacker) amt *= 1 + buffSum(attacker, 'holyDamagePct', now);
    if ((t === 'holy' || t === 'void') && spec.undeadMult && (en.def.undead || en.def.zone === 8)) amt *= spec.undeadMult;
    // Sunder: skills ignore 30% of enemy defense (resistances)
    if (spec.isSkill && pl?.derived.powers.has('sunder') && r > 0) r *= 0.7;
    const aff = affinityMult(t, bodyType);
    amt *= Math.max(0, 1 - r) * aff;
    if (amt > biggest) {
      biggest = amt;
      affinity = aff > 1 ? 'weak' : aff < 1 ? 'resist' : undefined;
    }
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
  if (host) {
    // the hit lands on the shared pool (the boss's phase clamp and death apply there); this body's HP never moves
    rawDamage(w, host, total, dominantTypeOf(spec), attacker?.id ?? 0, false);
    host.hp!.lastHitAt = now;
    if (attacker) host.en!.aggro[attacker.id] = (host.en!.aggro[attacker.id] ?? 0) + total;
  } else hp.hp -= total;
  hp.lastHitAt = now;
  hp.lastHitBy = attacker?.id ?? 0;
  if (en.isBoss) bossPhaseCheck(w, e);
  e.anim.flashUntil = now + 0.08;
  if (traits.revealedByHoly && (spec.dmg.holy ?? 0) > 0) en.revealedUntil = now + traits.revealedByHoly;
  // D253: the AI blinks it away on its next step
  if (traits.teleportOnHit && now - (en.extrasUsed.__hitTp ?? -99) >= traits.teleportOnHit.cooldownS) en.extrasUsed.__hitAt = now;
  const shown = total;
  w.emit({ t: 'dmg', x: e.x, y: e.y - e.radius - 4, amount: shown, type: dominantTypeOf(spec), crit, toPlayer: false, targetId: e.id, src: attacker?.id ?? 0, ...(affinity ? { affinity } : {}) });
  w.sfx(en.def.hitSound ?? 'hitFlesh', e.x, 0.8, 0.9 + (w.tick % 5) * 0.04);
  w.fx('hit', e.x, e.y, { color: typeColor(dominantTypeOf(spec)), n: crit ? 14 : 7, a: Math.atan2(e.y - fromY, e.x - fromX) });

  // aggro
  if (attacker) en.aggro[attacker.id] = (en.aggro[attacker.id] ?? 0) + total;
  // lifesteal (D325): a share of your max HP for each hit, scaled by how hard the hit is (×1 a plain swing), not of the damage
  // once an attack: a swing that hits ten enemies heals once, not ten times
  if (pl && !o.noLifesteal && pl.derived.lifesteal > 0 && total > 0) {
    const id = spec.attackId;
    const done = (pl.lifestealAttacks ??= []);
    if (id === undefined || !done.includes(id)) {
      if (id !== undefined) {
        done.push(id);
        if (done.length > 24) done.shift();
      }
      // D337: rounded up to a whole number, never less than 1
      heal(w, attacker!, Math.max(1, Math.ceil(attacker!.hp!.max * pl.derived.lifesteal * Math.max(0, spec.lifestealScale ?? 1))), false);
    }
  }
  if (pl) {
    pl.momentum = Math.min(10, pl.momentum + 1);
    pl.hitCounter++;
    // Thunderclap (legendary weapon): every 4th hit chains Lightning to 3 more enemies at ×0.8
    if (attacker && pl.derived.powers.has('thunderclap') && pl.hitCounter % 4 === 0 && spec.sourceTag !== 'thunderclap') {
      const chained = new Set([e.id]);
      let from: Entity = e;
      for (let j = 0; j < 3; j++) {
        let best: Entity | null = null;
        let bd = 220;
        for (const o of w.livingEnemies()) {
          if (chained.has(o.id) || o.en?.gary) continue;
          const dd = Math.hypot(o.x - from.x, o.y - from.y);
          if (dd < bd) {
            bd = dd;
            best = o;
          }
        }
        if (!best) break;
        chained.add(best.id);
        w.fx('line', from.x, from.y, { a: Math.atan2(best.y - from.y, best.x - from.x), r: bd, x2: 10, color: '#ffe14a', v: 'lightning', el: 'magic' });
        const zap = emptySpec('player');
        zap.dmg = { magic: total * 0.8 };
        zap.sourceTag = 'thunderclap';
        hitEnemy(w, attacker, best, zap, from.x, from.y, { noLifesteal: true });
        from = best;
      }
    }
  }
  // Poise and stagger (D78). An enemy's poise comes from its size. One hit staggers it, cancelling the attack it
  // is making, only when that hit's poise damage reaches its poise: a greathammer staggers a brute, daggers
  // only stagger rats. Bosses instead have a poise pool that hits wear down (and that regenerates).
  // a staggered enemy gets a couple of seconds of grace after it recovers, so it cannot be stun-locked (D103)
  const staggerGrace = (en.staggerImmuneUntil ?? 0) > now;
  if ((!en.isBoss || spec.poiseDmg > 0) && !staggerGrace) {
    let poise = spec.poiseDmg * (en.isBoss ? (spec.bossPoiseMult ?? 1) : 1);
    if (attacker) poise *= 1 + buffSum(attacker, 'poiseDamagePct', now);
    if (pl) poise *= pl.derived.poiseDmgMult;
    // hyper armor (heavy swings): a boss cannot be staggered out of it; anyone else's poise counts double
    const hyper = !!(en.def.hyperArmor || en.attack?.def.hyperArmor) && !!en.attack && en.attack.phase !== 'recover';
    let broken: boolean;
    if (en.isBoss) {
      hp.poise -= poise;
      hp.poiseRegenAt = now + 3;
      broken = hp.poise <= 0 && !hyper;
    } else broken = poise > 0 && poise >= hp.poiseMax * (hyper ? 2 : 1);
    if ((broken || (spec.guaranteedStagger && !hyper)) && !traits.noFlinch) {
      const heavy = o.heavy ?? false;
      hp.poise = hp.poiseMax;
      const staggerS = en.isBoss ? 1.2 : heavy ? 0.9 : 0.6;
      interrupt(w, e, staggerS);
      en.staggerImmuneUntil = now + staggerS + STAGGER_GRACE_S;
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
  if (hp.dead && attacker && spec.onKillEffects) w.hooks.onSpecKill?.(w, attacker, e, spec.onKillEffects, spec.sourceTag ?? '');
  if (pl && attacker) w.hooks.onPlayerHitEnemy?.(w, attacker, e, total, spec);
  return total;
}

function dominantTypeOf(spec: DamageSpec): DamageType {
  return dominantType(spec);
}

/** The colour a damage type shows as on the dark floor (damage numbers, hit sparks). */
export function typeColor(t: DamageType): string {
  return elementGlow(t);
}

/** Seconds after a poise stagger ends during which the same enemy cannot be poise-staggered again (D103). */
export const STAGGER_GRACE_S = 2;

/** Add revive progress to a ghost (D12). */
/** How long one ally hit holds a downed player's bleed-out countdown (D202). */
export const GHOST_HIT_PAUSE_S = 3;

export function addRevive(w: World, ghost: Entity, attacker: Entity, value: number): void {
  const gp = ghost.pl!;
  if (!gp.downed) return;
  let v = value;
  if (attacker.pl?.derived.rings.has('ghost_lantern')) v *= Math.pow(2, attacker.pl.derived.ringCounts.ghost_lantern ?? 1);
  gp.reviveProgress += v;
  // every hit holds the bleed-out countdown for 3 s, starting the 3 s again (D202)
  gp.ghostPauseUntil = w.time + GHOST_HIT_PAUSE_S;
  w.sfx('reviveTick', ghost.x);
  w.fx('revive', ghost.x, ghost.y);
  if (gp.reviveProgress < gp.reviveNeed) return;
  if (attacker.pl) w.emit({ t: 'feat', kind: 'revive', playerId: attacker.pl.playerId, targetId: ghost.id });
  w.hooks.onRevive?.(w, ghost);
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
