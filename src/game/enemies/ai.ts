// Enemy AI (GAME_DESIGN §6.2): idle → alert → approach/kite → windup → attack → recover → reposition.
// Weighted attack choice by distance and cooldowns, the room-wide special budget, aggro, move styles,
// swarms, stealth, teleports, passive pulls, elite affixes. Nothing here is specific to an enemy id.
import { DEG, angleDiff, circleHit, clamp, dist, turnToward } from '../../engine/math';
import { applyStatusBuild, emptySpec, grantBarrier, heal, hitPlayer, interrupt } from '../combat/damage';
import { MAX_PROJECTILE_RANGE } from '../combat/formulas';
import { hasControl, speedMult } from '../combat/state';
import { ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y, ROOM_CX, ROOM_CY } from '../combat/patterns';
import { runEffects } from '../effects/run';
import { spawnHazard } from '../systems/hazards';
import { terrainWalkMult } from '../systems/terrain';
import { patternAllowed, ringReachable, startEnemyAttack, teleportAway, updateEnemyAttack } from './attacks';
import { updateDevour } from '../interact';
import { phasePassive, tickBossPassive } from '../boss/passive';
import { stepToward } from './pathing';
import { attackDamage } from './spawn';
import type { AttackDef, EnemyDef } from '../types';
import type { Entity, World } from '../world';

const RETARGET_S = 1.5;

/** Specials (Red/Piercing) currently in windup in this room (the group budget). */
export function specialsInWindup(w: World): number {
  let n = 0;
  for (const e of w.enemies) {
    const a = e.en?.attack;
    if (a && a.phase === 'windup' && a.usedBudget && !e.en!.isBoss) n++;
  }
  return n;
}

function usersOf(w: World, atkId: string): number {
  let n = 0;
  for (const e of w.enemies) if (e.en?.attack && e.en.attack.def.id === atkId && e.en.attack.phase !== 'recover') n++;
  return n;
}

function conditionOk(w: World, e: Entity, atk: AttackDef, target: Entity): boolean {
  const c = atk.condition;
  if (!c) return true;
  let m = /^allPlayersWithin\((\d+)\)$/.exec(c);
  if (m) return w.livingPlayers().every((p) => dist(p.x, p.y, e.x, e.y) <= Number(m![1]));
  m = /^hpBelow\((\d+)\)$/.exec(c);
  if (m) return e.hp!.hp < (e.hp!.max * Number(m[1])) / 100;
  m = /^alliesAlive\((\d+)\)$/.exec(c);
  if (m) return w.livingEnemies().filter((x) => x !== e).length >= Number(m[1]);
  if (c === 'targetBehind') return Math.abs(angleDiff(target.facing, Math.atan2(e.y - target.y, e.x - target.x))) > 100 * DEG;
  if (c === 'deadAllies') return w.enemies.some((x) => x.hp?.dead && !x.en?.elite && !x.en?.isBoss && !x.removed && x.type === 'enemy');
  if (c === 'injuredAlly') return w.livingEnemies().some((x) => x !== e && x.hp!.hp < x.hp!.max * 0.8);
  if (c === 'hasAlly') return w.livingEnemies().some((x) => x !== e);
  if (c === 'constructAlly') return w.livingEnemies().some((x) => x !== e && x.en!.def.construct && x.hp!.hp < x.hp!.max * 0.9);
  if (c === 'linesExist') return [...w.entities.values()].some((x) => !x.removed && ((x.type === 'hazard' && x.hz?.ownerId === e.id) || (x.type === 'enemy' && !x.hp?.dead && x.en?.summonerId === e.id)));
  if (c === 'noFlood') return w.roomMods.floodUntil < w.time;
  // a ring out to the edge: every player can get inside its inner radius before it lands
  if (c === 'ringReachable') return ringReachable(w, e, atk, target);
  return true;
}

/** Choose the target: aggro = recent damage × 1.0 + proximity + taunt (GAME_DESIGN §6.2). */
function pickTarget(w: World, e: Entity): Entity | null {
  const en = e.en!;
  const now = w.time;
  const players = w.livingPlayers();
  // decoys (Mirror Images, Lure) taunt within their radius
  for (const d of w.entities.values()) {
    if (d.type !== 'decoy' || d.removed || !d.dc) continue;
    if (d.dc.until < now) continue;
    if (dist(d.x, d.y, e.x, e.y) <= d.dc.tauntR) return d;
  }
  if (en.tauntUntil > now) {
    const t = w.get(en.tauntedBy);
    if (t) return t;
  }
  if (players.length === 0) return null;
  if (players.length === 1) return players[0]!;
  let best: Entity | null = null;
  let bs = -Infinity;
  const role = en.def.role;
  for (const p of players) {
    let s = (en.aggro[p.id] ?? 0) * 1.0 + 300 / Math.max(40, dist(p.x, p.y, e.x, e.y)) * 20;
    if (role === 'fodder' || role === 'swarm') {
      // fodder spread out across targets
      let same = 0;
      for (const o of w.enemies) if (o !== e && o.en?.targetId === p.id && (o.en.def.role === 'fodder' || o.en.def.role === 'swarm')) same++;
      s -= same * 12;
    }
    if (s > bs) {
      bs = s;
      best = p;
    }
  }
  // decay aggro
  for (const k of Object.keys(en.aggro)) en.aggro[Number(k)]! *= 0.7;
  return best;
}

function linkedSpecialWindup(w: World, id: number): boolean {
  const a = w.get(id)?.en?.attack;
  return !!a && a.phase === 'windup' && (a.def.kind === 'red' || a.def.kind === 'pierce');
}

function chooseAttack(w: World, e: Entity, target: Entity): AttackDef | null {
  const en = e.en!;
  const now = w.time;
  const d = dist(e.x, e.y, target.x, target.y) - target.radius;
  const list = en.phaseAttacks;
  const options: AttackDef[] = [];
  const weights: number[] = [];
  const budgetUsed = specialsInWindup(w);
  for (const atk of list) {
    if (atk.trigger) continue;
    // illusions only mimic the normal attack (no specials, no utilities, no real damage)
    if (en.isIllusion && atk.kind !== 'normal') continue;
    if ((en.cooldowns[atk.id] ?? 0) > now) continue;
    // a shot only from within its reach (D185: projectiles fly at most MAX_PROJECTILE_RANGE)
    const reach = atk.pattern?.kind === 'projectile' ? Math.min(atk.range[1], MAX_PROJECTILE_RANGE) : atk.range[1];
    if (d < atk.range[0] || d > reach) continue;
    if (en.isBoss && atk.id === en.lastAttackId && list.filter((a) => !a.trigger).length > 1) continue;
    // two targets, one bar: the split body performs these, the boss never does
    if (en.isBoss && atk.body === 'split') continue;
    const special = atk.kind === 'red' || atk.kind === 'pierce';
    if (special && !en.isBoss && budgetUsed >= w.specialBudget) continue;
    // linked bodies take turns: neither starts a Red/Piercing attack while the other winds one up
    if (special && en.linkedTo && linkedSpecialWindup(w, en.linkedTo)) continue;
    if (atk.budget !== undefined && usersOf(w, atk.id) >= atk.budget) continue;
    if (!conditionOk(w, e, atk, target)) continue;
    if (!patternAllowed(w, e, atk, target)) continue;
    if (atk.pattern && atk.pattern.kind !== 'projectile' && !w.room.lineOfSight(e.x, e.y, target.x, target.y) && atk.pattern.kind === 'melee') continue;
    if (atk.pattern?.kind === 'projectile' && !w.room.lineOfSight(e.x, e.y, target.x, target.y)) continue;
    options.push(atk);
    // specials are weighted up a little when they are ready, so they show up in readable waves
    weights.push(atk.weight * (special ? 1.2 : 1));
  }
  if (options.length === 0) return null;
  const i = w.combat.weighted(weights);
  return i >= 0 ? options[i]! : null;
}

function moveSpeed(w: World, e: Entity): number {
  const en = e.en!;
  let s = en.speed * speedMult(e, w);
  if (w.roomMods.enrageUntil > w.time) s *= 1.15;
  // Slow terrain (PROCGEN §3.2) bogs walkers down too; fliers and phasing ghosts skim over it
  if (!en.isBoss) s *= terrainWalkMult(w.room, e.x, e.y, e.flying || !!en.def.traits?.phasesThroughProps);
  if (en.isBoss) s *= (en.def as unknown as { phases: { speedMult: number }[] }).phases[en.phase]?.speedMult ?? 1;
  return s;
}

function stepTo(w: World, e: Entity, gx: number, gy: number, speed: number, dt: number): void {
  const passes = e.flying || !!e.en?.def.traits?.phasesThroughProps;
  // room enemies path with their body size; bosses keep point pathing (their arenas and moves are tuned for it)
  const [dx, dy] = stepToward(w.room, e.x, e.y, gx, gy, passes, w.time, e.en?.isBoss ? 0 : e.radius);
  if (e.en && Math.hypot(dx, dy) > 0.1 && speed > 1) e.en.movedAt = w.time;
  w.room.moveCircle(e, dx * speed * dt, dy * speed * dt, e.flying || !!e.en?.def.traits?.phasesThroughProps);
  if (Math.hypot(dx, dy) > 0.1) {
    const want = Math.atan2(dy, dx);
    const rate = (e.en?.def.traits?.turnRate ?? 540) * DEG;
    e.facing = turnToward(e.facing, want, rate * dt);
  }
}

function moveByStyle(w: World, e: Entity, target: Entity, dt: number): void {
  const en = e.en!;
  const def = en.def as EnemyDef;
  const now = w.time;
  const sp = moveSpeed(w, e);
  const d = dist(e.x, e.y, target.x, target.y);
  const pref = def.preferredRange;
  const face = (): void => {
    const rate = (def.traits?.turnRate ?? 540) * DEG;
    e.facing = turnToward(e.facing, Math.atan2(target.y - e.y, target.x - e.x), rate * dt);
  };
  if (en.rootUntil > now) {
    face();
    return;
  }
  // leashed enemies (The Instructor) never leave their home area
  const home = en.phase >= 1 && (def as { phase2?: { noLeash?: boolean } }).phase2?.noLeash ? undefined : def.traits?.homeRadius;
  if (home && dist(e.x, e.y, en.homeX, en.homeY) > home) {
    stepTo(w, e, en.homeX, en.homeY, sp, dt);
    face();
    return;
  }
  // a boss phase can root the boss in place (BossPhase.passive.stationaryAt)
  const style = phasePassive(e)?.stationaryAt ? 'stationary' : def.moveStyle;
  switch (style) {
    case 'stationary':
      face();
      return;
    case 'ceiling':
    case 'walk':
    case 'dash':
    case 'burrow': {
      if (d > pref + 10) stepTo(w, e, target.x, target.y, sp, dt);
      else if (pref > 120 && d < pref * 0.6) {
        // ranged walkers back off
        const a = Math.atan2(e.y - target.y, e.x - target.x);
        stepTo(w, e, e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80, sp * 0.8, dt);
        face();
      } else face();
      return;
    }
    case 'circle':
    case 'flank':
    case 'hover':
    case 'teleport':
    case 'orbit':
    case 'swarm': {
      if (now > en.thinkAt) {
        en.thinkAt = now + 1.2 + w.combat.next() * 1.5;
        if (w.combat.chance(0.35)) en.strafeDir = -en.strafeDir;
      }
      const ang = Math.atan2(e.y - target.y, e.x - target.x);
      let r = pref;
      if (def.moveStyle === 'orbit' || def.moveStyle === 'swarm') r = def.traits?.orbitR ?? 70 + en.pieceIndex * 6;
      if (def.moveStyle === 'flank') r = Math.max(60, pref);
      const step = (def.moveStyle === 'flank' ? 0.9 : 0.6) * en.strafeDir;
      let gx = target.x + Math.cos(ang + step) * r;
      let gy = target.y + Math.sin(ang + step) * r;
      if (def.moveStyle === 'hover' || def.moveStyle === 'teleport') {
        gx += Math.sin(now * 1.7 + e.id) * 40;
        gy += Math.cos(now * 1.3 + e.id) * 40;
      }
      gx = clamp(gx, ROOM_MIN_X + 20, ROOM_MAX_X - 20);
      gy = clamp(gy, ROOM_MIN_Y + 20, ROOM_MAX_Y - 20);
      stepTo(w, e, gx, gy, sp, dt);
      face();
      return;
    }
  }
}

/** Contact damage for swarm pieces and bodies with a contact trait. */
function contactDamage(w: World, e: Entity): void {
  const c = e.en!.def.traits?.contact;
  if (!c) return;
  const now = w.time;
  for (const p of w.livingPlayers()) {
    if (!circleHit(e.x, e.y, e.radius + 4, p.x, p.y, p.radius)) continue;
    if ((e.en!.lastContact[p.id] ?? 0) > now) continue;
    e.en!.lastContact[p.id] = now + c.cdS;
    const spec = emptySpec('normal');
    spec.parryable = false;
    spec.dmg[e.en!.phaseAttacks[0]?.type ?? 'physical'] = attackDamage(e, c.mult);
    if (c.status) spec.status = [c.status];
    hitPlayer(w, e.id, p, spec, e.x, e.y);
    const drain = e.en!.def.traits?.attachDrain;
    if (drain && !p.pl!.attached.includes(e.id)) {
      p.pl!.attached.push(e.id);
      e.en!.attachedTo = p.id;
    }
  }
}

function eliteUpdate(w: World, e: Entity, dt: number): void {
  const en = e.en!;
  const now = w.time;
  switch (en.elite) {
    case 'arcane': {
      en.eliteOrbAngle += dt * 2.2;
      for (let i = 0; i < 3; i++) {
        const a = en.eliteOrbAngle + (i * Math.PI * 2) / 3;
        const ox = e.x + Math.cos(a) * (e.radius + 34);
        const oy = e.y + Math.sin(a) * (e.radius + 34);
        for (const p of w.livingPlayers()) {
          if (!circleHit(ox, oy, 9, p.x, p.y, p.radius)) continue;
          if ((en.lastContact[p.id + 100000] ?? 0) > now) continue;
          en.lastContact[p.id + 100000] = now + 0.8;
          const spec = emptySpec('pierce');
          spec.dmg.void = attackDamage(e, 0.5);
          hitPlayer(w, e.id, p, spec, ox, oy);
        }
      }
      break;
    }
    case 'molten':
      if (now >= en.eliteTimerAt && Math.hypot(e.x - e.px, e.y - e.py) > 0.5) {
        en.eliteTimerAt = now + 0.35;
        spawnHazard(w, 'firePuddle', [{ k: 'circle', x: e.x, y: e.y, r: 26 }], 3, 1, e.id);
      }
      break;
    case 'frostbound':
      if (now >= en.eliteTimerAt) {
        en.eliteTimerAt = now + 0.25;
        for (const p of w.livingPlayers()) if (dist(p.x, p.y, e.x, e.y) <= 120) applyStatusBuild(w, p, 'chill', 5);
      }
      break;
    case 'shielded':
      if (now >= en.eliteTimerAt) {
        en.eliteTimerAt = now + 10;
        grantBarrier(w, e, e.hp!.max * 0.25, 10);
      }
      break;
    case 'summoner':
      if (now >= en.eliteTimerAt) {
        en.eliteTimerAt = now + 12;
        w.hooks.onEliteSummon?.(w, e);
      }
      break;
    default:
      break;
  }
}

/** Run triggered utilities (onHitTwice, hpBelow, passive, firstSight). onDeath runs from the kill hook. */
function triggers(w: World, e: Entity, target: Entity | null, dt: number): void {
  const en = e.en!;
  const now = w.time;
  for (const atk of en.phaseAttacks) {
    if (!atk.trigger) continue;
    const used = en.extrasUsed[atk.id];
    if (used !== undefined && now - used < atk.cooldownS) continue;
    let fire = false;
    if (atk.onlyWhileMoving && now - en.movedAt > 0.15) continue;
    if (atk.trigger === 'onHitTwice') fire = en.hitTimes.filter((t) => t > now - 1).length >= 2;
    else if (atk.trigger === 'hpBelow') fire = e.hp!.hp < e.hp!.max * (atk.triggerValue ?? 0.3) && used === undefined;
    else if (atk.trigger === 'firstSight') fire = !!target && used === undefined;
    else if (atk.trigger === 'passive') {
      fire = true;
    }
    if (!fire) continue;
    en.extrasUsed[atk.id] = now;
    if (atk.trigger === 'onHitTwice') en.hitTimes = [];
    runEffects(w, atk.effects ?? [], {
      sourceId: e.id,
      team: 1,
      x: e.x,
      y: e.y,
      aimX: target?.x ?? e.x,
      aimY: target?.y ?? e.y,
      targetId: target?.id ?? 0,
      powerMult: 1,
      isSpell: false,
      isSkill: false,
      baseDamage: attackDamage(e, atk.dmgMult || 1),
      windupS: atk.windupMs / 1000,
      tag: `${atk.id}:${dt.toFixed(3)}`,
    });
  }
}

export function updateEnemy(w: World, e: Entity, dt: number): void {
  const en = e.en!;
  const hp = e.hp!;
  const now = w.time;
  if (hp.dead) return;
  if (w.frozen(e)) return;
  if (en.lifeUntil && now >= en.lifeUntil) {
    hp.dead = true;
    w.remove(e);
    return;
  }
  // a split body (two targets, one bar) goes with the boss it shares the bar with
  if (en.linkedTo && !en.isBoss) {
    const host = w.get(en.linkedTo);
    if (!host || host.hp?.dead) {
      hp.dead = true;
      w.fx('dust', e.x, e.y, { n: 10 });
      w.remove(e);
      return;
    }
    // while the boss is in a phase transition, so is its other body
    if (host.en && host.en.phaseTransitionUntil > now) return;
  }
  const def = en.def as EnemyDef;
  const traits = def.traits ?? {};
  e.anim.t += dt;
  e.anim.poseT += dt;

  if (en.state === 'spawning') {
    if (now >= en.spawnUntil) {
      if (def.moveStyle === 'ceiling') en.state = 'ceiling';
      else if (traits.mimic && !en.mimicChestId?.startsWith('awake')) en.state = 'dormant';
      else en.state = 'alert';
      en.thinkAt = now + 0.2 + w.combat.next() * 0.4;
    }
    return;
  }
  // a mimic eating whoever opened it does nothing else (D179)
  if (en.devour) {
    updateDevour(w, e);
    return;
  }
  if (en.state === 'dormant') return;
  if (en.gary) return;
  if (en.phaseTransitionUntil > now) return;
  // boss phase passives: pull toward it, a stationary form, size, projectile speed (BossPhase.passive)
  if (en.isBoss) tickBossPassive(w, e, dt);

  // a non-boss second phase (The Instructor, D107): a new, faster attack list below a health line
  const p2 = (def as { phase2?: { untilHpPct: number; attacks: AttackDef[]; name?: string } }).phase2;
  if (p2 && !en.isBoss && en.phase === 0 && hp.hp <= hp.max * (p2.untilHpPct / 100)) {
    en.phase = 1;
    en.phaseAttacks = p2.attacks;
    en.cooldowns = {};
    w.emit({ t: 'msg', text: `${def.name}: ${p2.name ?? 'Phase two'}!`, color: '#ffd27a' });
    w.sfx('phaseChange', e.x);
    w.emit({ t: 'shake', amount: 6 });
  }
  // regeneration out of combat (The Instructor)
  if (traits.regenPctPerS && now - hp.lastHitAt > 5) hp.hp = Math.min(hp.max, hp.hp + hp.max * traits.regenPctPerS * dt);

  if (hasControl(e, 'freeze', now) && !en.isBoss) return;
  if (en.stunUntil > now || hp.staggerUntil > now) {
    en.state = 'stagger';
    return;
  }
  if (en.state === 'stagger') en.state = 'alert';

  // retarget
  if (now >= en.retargetAt || !w.get(en.targetId) || w.get(en.targetId)?.pl?.downed) {
    const t = pickTarget(w, e);
    en.targetId = t?.id ?? 0;
    en.retargetAt = now + RETARGET_S;
  }
  const target = w.get(en.targetId) ?? null;

  if (en.elite) eliteUpdate(w, e, dt);
  contactDamage(w, e);
  triggers(w, e, target, dt);

  // passive pull (Maw)
  if (traits.passivePull) {
    const pp = traits.passivePull;
    for (const p of w.livingPlayers()) {
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > pp.r || d < e.radius + 10) continue;
      // the pull pauses in the last 0.2 s of a bite telegraph (escapability)
      const a = en.attack;
      if (a && a.phase === 'windup' && a.windup - a.t < 0.2) continue;
      if (p.pl!.state === 'dodge') continue;
      w.room.moveCircle(p, ((e.x - p.x) / d) * pp.speed * dt, ((e.y - p.y) / d) * pp.speed * dt);
    }
  }

  // stealth: transparent until close
  if (traits.stealthUntil || traits.invisibleBeyond) {
    const r = traits.stealthUntil ?? traits.invisibleBeyond ?? 0;
    const close = target ? dist(e.x, e.y, target.x, target.y) < r : false;
    const revealed = en.revealedUntil > now;
    e.anim.alpha = close || revealed || en.attack ? 1 : traits.invisibleBeyond ? 0.08 : 0.3;
  }
  // a fade makes it immune; it stays solid and the renderer draws a gold border instead of see-through (D108)
  if (en.fadeUntil > 0 && en.fadeUntil <= now) en.fadeUntil = 0;

  if (en.attack) {
    updateEnemyAttack(w, e, dt);
    return;
  }
  if (!target) {
    // idle wander
    if (now > en.thinkAt) {
      en.thinkAt = now + 2;
      en.wanderX = clamp(e.x + w.combat.spread(120), ROOM_MIN_X + 40, ROOM_MAX_X - 40);
      en.wanderY = clamp(e.y + w.combat.spread(120), ROOM_MIN_Y + 40, ROOM_MAX_Y - 40);
    }
    if (def.moveStyle !== 'stationary' && dist(e.x, e.y, en.wanderX, en.wanderY) > 10) stepTo(w, e, en.wanderX, en.wanderY, moveSpeed(w, e) * 0.4, dt);
    return;
  }
  if (en.state === 'ceiling') {
    // the shadow wanders toward the target; only its Drop attack can be chosen
    stepTo(w, e, target.x, target.y, moveSpeed(w, e) * 0.6, dt);
    const drop = en.phaseAttacks.find((a) => a.move?.kind === 'leap' || a.id.endsWith('drop'));
    if (drop && (en.cooldowns[drop.id] ?? 0) <= now && dist(e.x, e.y, target.x, target.y) < 160 && specialsInWindup(w) < w.specialBudget) {
      startEnemyAttack(w, e, drop, target);
      en.state = 'windup';
      e.flying = false;
      w.hooks.onCeilingDrop?.(w, e);
    }
    return;
  }
  // teleport casters
  if (traits.teleportEveryS && now - (en.extrasUsed.__tp ?? en.spawnedAt) > traits.teleportEveryS) {
    en.extrasUsed.__tp = now;
    teleportAway(w, e, 260);
  }
  // blink when approached (Fey Archer, Eye of the Deep)
  if (traits.blinkWhenApproached && dist(e.x, e.y, target.x, target.y) < traits.blinkWhenApproached.r && now - (en.extrasUsed.__blink ?? -99) > traits.blinkWhenApproached.cooldownS) {
    en.extrasUsed.__blink = now;
    teleportAway(w, e, traits.blinkWhenApproached.distance);
  }
  // scripted dummies cycle their attacks in order on a timer
  if (traits.scripted) {
    e.facing = Math.atan2(target.y - e.y, target.x - e.x);
    if (now >= en.thinkAt && dist(e.x, e.y, target.x, target.y) < 320) {
      const list = en.phaseAttacks.filter((a) => !a.trigger);
      const i = (en.summonCount++) % list.length;
      startEnemyAttack(w, e, list[i]!, target);
      en.thinkAt = now + 2.6;
    }
    return;
  }
  // think: try an attack, else move
  if (now >= en.thinkAt || en.state === 'alert' || en.state === 'reposition') {
    en.thinkAt = now + 0.15 + w.combat.next() * 0.2;
    const atk = chooseAttack(w, e, target);
    if (atk) {
      // swarms: the whole group does group specials together, staggered
      startEnemyAttack(w, e, atk, target);
      if (def.swarm && atk.kind !== 'normal') syncSwarm(w, e, atk, target);
      return;
    }
    en.state = 'approach';
  }
  moveByStyle(w, e, target, dt);
  // lurkers (Sewer Crocodile) move submerged between attacks: half damage taken, hard to see
  if (traits.submerged) {
    const far = dist(e.x, e.y, target.x, target.y) > e.radius + 70;
    if (far) en.state = 'submerged';
    e.anim.alpha = far ? 0.45 : 1;
  }
  if (en.attachedTo) {
    const host = w.get(en.attachedTo);
    if (host && !host.pl?.downed) {
      e.x = host.x + Math.cos(en.pieceIndex * 1.3) * 12;
      e.y = host.y + Math.sin(en.pieceIndex * 1.3) * 12;
      const drain = def.traits?.attachDrain ?? 0;
      if (host.stam && drain) host.stam.cur = Math.max(0, host.stam.cur - drain * dt);
    } else en.attachedTo = 0;
  }
}

function syncSwarm(w: World, e: Entity, atk: AttackDef, target: Entity): void {
  const en = e.en!;
  if (!en.groupId) return; // summoned or split pieces have no group
  let k = 1;
  for (const o of w.enemies) {
    if (o === e || o.hp?.dead || o.en!.groupId !== en.groupId || o.en!.attack) continue;
    if ((o.en!.cooldowns[atk.id] ?? 0) > w.time) continue;
    if (atk.budget !== undefined && usersOf(w, atk.id) >= atk.budget) break;
    startEnemyAttack(w, o, atk, target);
    o.en!.attack!.windup += 0.15 * k++;
    o.en!.attack!.usedBudget = false;
  }
}

/** Utility helpers used by effects. */
export function nearestAlly(w: World, e: Entity, pred: (x: Entity) => boolean = () => true): Entity | null {
  let best: Entity | null = null;
  let bd = Infinity;
  for (const o of w.livingEnemies()) {
    if (o === e || !pred(o)) continue;
    const d = dist(o.x, o.y, e.x, e.y);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}

export { heal, interrupt, ROOM_CX, ROOM_CY };
