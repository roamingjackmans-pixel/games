// Enemy attack execution: windup (tint + telegraph) → active (impact, projectiles, lunges, combos) → recover.
import { DEG, angleDiff, circleHit, clamp, dist, turnToward } from '../../engine/math';
import { emptySpec, hitPlayer } from '../combat/damage';
import { spawnShapeTelegraph, spawnTelegraphs } from '../combat/telegraph';
import { resolvePattern, type PatternCtx } from '../combat/patterns';
import { speedMult } from '../combat/state';
import { runEffects } from '../effects/run';
import { attackDamage } from './spawn';
import type { AttackDef, PatternDef } from '../types';
import type { DamageSpec, Entity, World } from '../world';
import { ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y } from '../combat/patterns';

export function enemyAttackSpec(e: Entity, atk: AttackDef, mult = 1): DamageSpec {
  const en = e.en!;
  const phaseMult = en.isBoss ? ((en.def as unknown as { phases: { dmgMult: number }[] }).phases[en.phase]?.dmgMult ?? 1) : 1;
  const spec = emptySpec(atk.kind === 'utility' ? 'normal' : atk.kind);
  spec.dmg[atk.type] = attackDamage(e, atk.dmgMult * mult) * phaseMult;
  if (atk.status) spec.status = [atk.status];
  spec.control = atk.control ?? null;
  spec.knockback = atk.knockback ?? 0;
  const isProj = atk.pattern?.kind === 'projectile';
  // bosses can be parried only on attacks marked parryable (GAME_DESIGN §5.4)
  spec.parryable = atk.kind === 'normal' ? (atk.parryable ?? (!en.def.swarm && !en.isBoss)) : false;
  if (isProj && atk.kind === 'normal') spec.parryable = atk.parryable ?? true;
  spec.grab = atk.grab ?? null;
  spec.pull = atk.pull ?? null;
  spec.staminaDrain = atk.stamDrain ?? 0;
  if (atk.onHitEffects) spec.onHitEffects = atk.onHitEffects;
  spec.sourceTag = atk.id;
  return spec;
}

export function patternCtx(w: World, e: Entity, tx: number, ty: number, teleS: number): PatternCtx {
  const target = w.get(e.en?.targetId ?? 0);
  let pastX = tx;
  let pastY = ty;
  if (target?.pl) {
    const past = target.pl.pastPos.find((p) => p.t >= w.time - 1.05) ?? target.pl.pastPos[0];
    if (past) {
      pastX = past.x;
      pastY = past.y;
    }
  }
  return {
    ox: e.x,
    oy: e.y,
    facing: e.facing,
    tx,
    ty,
    pastX,
    pastY,
    players: w.livingPlayers().map((p) => ({ x: p.x, y: p.y })),
    rng: w.combat,
    room: w.room,
    telegraphS: teleS,
  };
}

/** Enemy action speed (Chill, Time Dilation, freeze) scales windups and recoveries. */
function actSpeed(w: World, e: Entity): number {
  return Math.min(1, speedMult(e, w) / Math.max(0.01, 1 + 0));
}

export function startEnemyAttack(w: World, e: Entity, atk: AttackDef, target: Entity | null): void {
  const en = e.en!;
  const now = w.time;
  const tx = target ? target.x : e.x + Math.cos(e.facing) * 100;
  const ty = target ? target.y : e.y + Math.sin(e.facing) * 100;
  const slow = actSpeed(w, e);
  const phaseSpeed = en.isBoss ? ((en.def as unknown as { phases: { speedMult: number }[] }).phases[en.phase]?.speedMult ?? 1) : 1;
  const windup = atk.windupMs / 1000 / slow;
  const active = (atk.activeMs ?? defaultActive(atk)) / 1000 / slow;
  const recover = atk.recoverMs / 1000 / slow / phaseSpeed;
  en.cooldowns[atk.id] = now + atk.cooldownS;
  en.lastAttackId = atk.id;
  if (target) e.facing = Math.atan2(ty - e.y, tx - e.x);
  en.attack = {
    def: atk,
    t: 0,
    phase: 'windup',
    windup,
    active,
    recover,
    targetId: target?.id ?? 0,
    aimX: tx,
    aimY: ty,
    angle: e.facing,
    teleIds: [],
    fired: false,
    comboIdx: 0,
    moveDone: false,
    hit: new Set(),
    usedBudget: atk.kind === 'red' || atk.kind === 'pierce',
  };
  en.state = 'windup';
  en.stateT = 0;
  if (atk.kind === 'red') {
    e.anim.tint = 'red';
    w.sfx('redWarning', e.x);
  } else if (atk.kind === 'pierce') {
    e.anim.tint = 'blue';
    w.sfx('pierceWarning', e.x);
  } else e.anim.tint = null;
  e.anim.pose = 'windup';
  e.anim.poseT = 0;

  if (atk.effects?.some((fx) => fx.op === 'pulseHazards')) en.attack.teleIds.push(...pulseOwnHazards(w, e, atk, windup));
  // pre-moves that happen before the telegraph resolves
  const mv = atk.move;
  if (mv?.kind === 'behindTarget' && target) {
    const a = target.facing + Math.PI;
    const bx = clamp(target.x + Math.cos(a) * 70, ROOM_MIN_X + 20, ROOM_MAX_X - 20);
    const by = clamp(target.y + Math.sin(a) * 70, ROOM_MIN_Y + 20, ROOM_MAX_Y - 20);
    if (!w.room.circleBlocked(bx, by, e.radius * 0.8)) {
      w.fx('teleport', e.x, e.y);
      e.x = bx;
      e.y = by;
      e.px = bx;
      e.py = by;
      e.facing = Math.atan2(target.y - e.y, target.x - e.x);
      en.attack.angle = e.facing;
    }
  } else if (mv?.kind === 'toTarget' && target) {
    const d = dist(e.x, e.y, target.x, target.y);
    const sp = Math.max(400, d / 0.35);
    e.forced = { vx: ((target.x - e.x) / Math.max(1, d)) * sp, vy: ((target.y - e.y) / Math.max(1, d)) * sp, until: now + Math.min(0.35, d / sp), kind: 'dash' };
  } else if (mv?.kind === 'converge' && target) {
    en.wanderX = target.x;
    en.wanderY = target.y;
  }

  // telegraphs for area / melee patterns (projectiles have none: the windup pose is their tell)
  if (atk.pattern && atk.pattern.kind !== 'projectile' && atk.pattern.kind !== 'trail') {
    const spec = enemyAttackSpec(e, atk, atk.comboMults?.[0] ?? 1);
    let teleS = windup;
    if (mv?.kind === 'leap' || mv?.kind === 'lunge' || mv?.kind === 'charge') teleS = windup + (mv.kind === 'leap' ? active : 0);
    const ctx = patternCtx(w, e, tx, ty, teleS);
    if (mv?.kind === 'toTarget') {
      ctx.ox = tx;
      ctx.oy = ty;
    }
    // pocket attacks refuse to fire if any player could not reach a pocket (DATA_MODEL §3)
    const teles = spawnTelegraphs(w, atk.pattern, {
      ownerId: e.id,
      team: 1,
      kind: atk.kind,
      windupS: teleS,
      spec: mv?.kind === 'charge' || mv?.kind === 'lunge' ? null : spec,
      ctx,
      onImpact: atk.effects && atk.kind !== 'utility' ? atk.effects : [],
      trackTargetId: target?.id ?? 0,
      minActiveS: mv?.kind === 'charge' ? 1.2 : 0,
    });
    en.attack.teleIds.push(...teles.map((t) => t.id));
    // single-shape melee/anchor-self shapes follow the enemy until 60% of the windup, then lock;
    // multi-shape patterns (random circles, lanes, line fans) stay where they were placed
    if (teles.length === 1 && teles[0]!.tg!.shapes.length === 1 && isSelfAnchored(atk.pattern) && FOLLOW_KINDS.has(atk.pattern.kind)) teles[0]!.tg!.follow = true;
  }
}

const FOLLOW_KINDS = new Set(['melee', 'cone', 'line', 'circle', 'ring', 'sweep', 'expandingRing', 'beam']);

/** Attacks that make the enemy's own hazards pulse (Mycelium Weaver's Lash). */
function pulseOwnHazards(w: World, e: Entity, atk: AttackDef, windup: number): number[] {
  const ids: number[] = [];
  for (const fx of atk.effects ?? []) {
    if (fx.op !== 'pulseHazards') continue;
    const shapes = [...w.entities.values()]
      .filter((h) => h.type === 'hazard' && !h.removed && h.hz!.ownerId === e.id && h.hz!.hazard === fx.hazard)
      .flatMap((h) => h.hz!.shapes.map((s) => ({ ...s })));
    if (!shapes.length) continue;
    const spec = enemyAttackSpec(e, atk, fx.mult / Math.max(0.01, atk.dmgMult || 1));
    const total = Object.values(spec.dmg).reduce((a, b) => a + (b ?? 0), 0);
    spec.dmg = { [fx.type]: total };
    if (fx.status) spec.status = [fx.status];
    ids.push(spawnShapeTelegraph(w, shapes, { ownerId: e.id, team: 1, kind: atk.kind, windupS: windup, spec, x: e.x, y: e.y, sourceTag: atk.id }).id);
  }
  return ids;
}

function isSelfAnchored(p: PatternDef): boolean {
  if (p.kind === 'melee') return true;
  if ('anchor' in p) return p.anchor === 'self';
  return false;
}

function defaultActive(atk: AttackDef): number {
  if (atk.move?.kind === 'leap') return 350;
  if (atk.move?.kind === 'lunge') return 250;
  if (atk.move?.kind === 'charge') return 1500;
  if (atk.comboMults && atk.comboMults.length > 1) return (atk.comboGapMs ?? 380) * atk.comboMults.length;
  return 120;
}

/** Move the attacker during the active phase of a lunge / leap / charge and hit with its body. */
function activeMove(w: World, e: Entity, dt: number): void {
  const en = e.en!;
  const a = en.attack!;
  const mv = a.def.move;
  if (!mv) return;
  const now = w.time;
  if (mv.kind === 'lunge') {
    const dist0 = mv.distance ?? 160;
    const sp = dist0 / Math.max(0.05, a.active);
    w.room.moveCircle(e, Math.cos(a.angle) * sp * dt, Math.sin(a.angle) * sp * dt, e.flying);
    bodyHits(w, e, 18);
  } else if (mv.kind === 'leap') {
    const sp = dist(e.x, e.y, a.aimX, a.aimY) / Math.max(0.02, a.active - a.t);
    const ang = Math.atan2(a.aimY - e.y, a.aimX - e.x);
    e.x += Math.cos(ang) * Math.min(sp * dt, dist(e.x, e.y, a.aimX, a.aimY));
    e.y += Math.sin(ang) * Math.min(sp * dt, dist(e.x, e.y, a.aimX, a.aimY));
    e.anim.scale = 1 + Math.sin((a.t / a.active) * Math.PI) * 0.35;
  } else if (mv.kind === 'charge') {
    const sp = mv.speed ?? 620;
    const hit = w.room.moveCircle(e, Math.cos(a.angle) * sp * dt, Math.sin(a.angle) * sp * dt, false);
    bodyHits(w, e, 22);
    if (hit || (!mv.untilWall && a.t * sp >= (mv.distance ?? 400))) {
      if (hit && (mv.bounces ?? 0) > a.comboIdx) {
        a.comboIdx++;
        a.angle = a.angle + Math.PI;
        a.hit.clear();
        return;
      }
      a.t = a.active; // end the charge
      if (hit && mv.stunOnWallS) {
        en.stunUntil = now + mv.stunOnWallS;
        e.hp!.staggerUntil = now + mv.stunOnWallS;
        w.emit({ t: 'shake', amount: 6 });
        w.fx('dust', e.x, e.y, { n: 20 });
        w.sfx('hitMetal', e.x);
      }
      w.hooks.onChargeEnd?.(w, e, hit);
    }
  }
}

function bodyHits(w: World, e: Entity, extra: number): void {
  const a = e.en!.attack!;
  const spec = enemyAttackSpec(e, a.def);
  for (const p of w.livingPlayers()) {
    if (a.hit.has(p.id)) continue;
    if (circleHit(e.x, e.y, e.radius + extra, p.x, p.y, p.radius)) {
      a.hit.add(p.id);
      hitPlayer(w, e.id, p, spec, e.x, e.y);
    }
  }
}

function fireProjectiles(w: World, e: Entity, atk: AttackDef, p: Extract<PatternDef, { kind: 'projectile' }>): void {
  const en = e.en!;
  const a = en.attack!;
  const target = w.get(a.targetId);
  const n = p.count ?? 1;
  const spread = (p.spreadDeg ?? (n > 1 ? 30 : 0)) * DEG;
  const base = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.facing;
  const spec = enemyAttackSpec(e, atk);
  const speed = p.speed * en.projSpeedMult;
  for (let i = 0; i < n; i++) {
    const ang = n > 1 ? base - spread / 2 + (spread * i) / (n - 1) : base;
    const tx = target ? target.x : e.x + Math.cos(ang) * 300;
    const ty = target ? target.y : e.y + Math.sin(ang) * 300;
    spawnEnemyProjectile(w, e, ang, speed, p, spec, a.targetId, tx, ty);
  }
  w.sfx('enemyShot', e.x);
}

export function spawnEnemyProjectile(
  w: World,
  e: Entity,
  ang: number,
  speed: number,
  p: Extract<PatternDef, { kind: 'projectile' }>,
  spec: DamageSpec,
  targetId: number,
  tx: number,
  ty: number,
): Entity {
  const lob = p.lob ? { fromX: e.x, fromY: e.y, toX: tx, toY: ty, t: 0, dur: Math.max(0.35, dist(e.x, e.y, tx, ty) / speed) } : null;
  return w.spawn('projectile', e.x + Math.cos(ang) * e.radius, e.y + Math.sin(ang) * e.radius, {
    radius: p.r,
    team: 1,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    facing: ang,
    drawId: p.drawId ?? 'e_bolt',
    pr: {
      ownerId: e.id,
      team: 1,
      dmg: spec.dmg,
      status: spec.status,
      control: spec.control,
      kind: spec.kind === 'red' || spec.kind === 'pierce' ? spec.kind : 'normal',
      speed,
      homing: (p.homing ?? 0) * DEG,
      targetId,
      until: w.time + (p.range ?? 1600) / speed,
      pierce: 0,
      hit: new Set(),
      poiseDmg: 0,
      onImpact: p.onImpact ? { op: 'damage', pattern: p.onImpact, type: firstType(spec), mult: 1 } : null,
      parryable: spec.parryable,
      reflected: false,
      returns: !!p.returns,
      returning: false,
      drawId: p.drawId ?? 'e_bolt',
      color: e.en?.def.palette?.[1] ?? '#ff9b6a',
      reviveValue: 0,
      knockback: spec.knockback,
      lob,
      curve: (p.curve ?? 0) * DEG,
      isSpell: false,
      isSkill: false,
      sourceTag: spec.sourceTag ?? '',
    },
  });
}

function firstType(spec: DamageSpec): 'physical' | 'fire' | 'frost' | 'lightning' | 'holy' | 'void' {
  for (const k of ['physical', 'fire', 'frost', 'lightning', 'holy', 'void'] as const) if ((spec.dmg[k] ?? 0) > 0) return k;
  return 'physical';
}

/** Re-resolve and immediately apply one melee hit of a combo at the current facing. */
function comboHit(w: World, e: Entity, atk: AttackDef, idx: number): void {
  if (!atk.pattern || idx === 0) return; // hit 0 is the telegraph's own impact
  const mult = atk.comboMults?.[idx] ?? 1;
  const spec = enemyAttackSpec(e, atk, mult);
  const target = w.get(e.en!.attack!.targetId);
  const tx = target?.x ?? e.x + Math.cos(e.facing) * 80;
  const ty = target?.y ?? e.y + Math.sin(e.facing) * 80;
  const ctx = patternCtx(w, e, tx, ty, 0.28);
  spawnTelegraphs(w, atk.pattern, { ownerId: e.id, team: 1, kind: atk.kind, windupS: 0.28, spec, ctx });
}

export function updateEnemyAttack(w: World, e: Entity, dt: number): void {
  const en = e.en!;
  const a = en.attack;
  if (!a) return;
  const now = w.time;
  a.t += dt;
  const target = w.get(a.targetId);
  if (a.phase === 'windup') {
    // track the target during the first 60% of the windup, then lock (fair dodge timing)
    if (target && a.t < a.windup * 0.6 && !a.def.move?.untilWall) {
      const want = Math.atan2(target.y - e.y, target.x - e.x);
      const rate = (en.def.traits?.turnRate ?? 240) * DEG;
      e.facing = turnToward(e.facing, want, rate * dt);
      a.angle = e.facing;
      if (a.def.move?.kind !== 'leap') {
        a.aimX = target.x;
        a.aimY = target.y;
      }
    }
    // keep self-anchored telegraphs on the attacker
    for (const id of a.teleIds) {
      const t = w.get(id);
      if (!t?.tg || !t.tg.follow || now >= t.tg.impact) continue;
      if (a.t < a.windup * 0.6) followShapes(t, e, a.angle);
    }
    if (a.def.move?.kind === 'converge') {
      const d = dist(e.x, e.y, en.wanderX, en.wanderY);
      if (d > 4) w.room.moveCircle(e, ((en.wanderX - e.x) / d) * 300 * dt, ((en.wanderY - e.y) / d) * 300 * dt, e.flying);
    }
    e.anim.squash = -0.5 * Math.min(1, a.t / a.windup);
    if (a.t >= a.windup) {
      a.phase = 'active';
      a.t = 0;
      e.anim.pose = 'attack';
      e.anim.poseT = 0;
      e.anim.tint = null;
      onImpact(w, e);
    }
  } else if (a.phase === 'active') {
    activeMove(w, e, dt);
    // combo hits
    if (a.def.comboMults && a.def.comboMults.length > 1) {
      const gap = (a.def.comboGapMs ?? 380) / 1000;
      const want = Math.min(a.def.comboMults.length - 1, Math.floor(a.t / gap));
      while (a.comboIdx < want) {
        a.comboIdx++;
        if (target) e.facing = turnToward(e.facing, Math.atan2(target.y - e.y, target.x - e.x), 60 * DEG);
        comboHit(w, e, a.def, a.comboIdx);
      }
    }
    e.anim.squash = 0.5;
    if (a.t >= a.active) {
      a.phase = 'recover';
      a.t = 0;
      e.anim.pose = 'recover';
      e.anim.scale = 1;
      if (a.def.move?.kind === 'teleportAway') teleportAway(w, e, 300);
      const fade = en.def.traits?.fadeAfterAttackS;
      if (fade) {
        en.fadeUntil = now + fade;
        e.hp!.invulnUntil = Math.max(e.hp!.invulnUntil, now + fade);
      }
      if (a.def.stunAfterS) {
        en.stunUntil = now + a.def.stunAfterS;
        e.hp!.staggerUntil = now + a.def.stunAfterS;
      }
    }
  } else {
    e.anim.squash = 0;
    if (a.t >= a.recover) {
      en.attack = null;
      en.state = 'reposition';
      en.stateT = 0;
      e.anim.pose = 'idle';
    }
  }
}

function followShapes(t: Entity, e: Entity, angle: number): void {
  const tg = t.tg!;
  for (const s of tg.shapes) {
    if (s.k === 'cone' || s.k === 'line' || s.k === 'sweep' || s.k === 'beam') {
      const dx = s.x - t.x;
      const dy = s.y - t.y;
      void dx;
      void dy;
      s.x = e.x;
      s.y = e.y;
      if (s.k === 'cone' || s.k === 'line' || s.k === 'beam') s.a = angle;
      else s.a0 = Math.abs(s.arc) >= Math.PI * 2 - 0.01 ? angle : angle - s.arc / 2;
    } else if (s.k === 'circle' || s.k === 'ring' || s.k === 'expRing') {
      s.x = e.x;
      s.y = e.y;
    }
  }
  t.x = e.x;
  t.y = e.y;
}

function onImpact(w: World, e: Entity): void {
  const en = e.en!;
  const a = en.attack!;
  const atk = a.def;
  if (atk.pattern?.kind === 'projectile') fireProjectiles(w, e, atk, atk.pattern);
  if (atk.kind === 'utility' && atk.effects) {
    runEffects(w, atk.effects, {
      sourceId: e.id,
      team: 1,
      x: e.x,
      y: e.y,
      aimX: a.aimX,
      aimY: a.aimY,
      targetId: a.targetId,
      powerMult: 1,
      isSpell: false,
      isSkill: false,
      baseDamage: attackDamage(e, atk.dmgMult || 1),
      windupS: 0,
      tag: atk.id,
    });
  }
  if (atk.move?.kind === 'lunge' || atk.move?.kind === 'charge') {
    w.sfx(atk.kind === 'red' ? 'swingHeavy' : 'swingMedium', e.x);
  }
  if (atk.pattern?.kind === 'melee') w.sfx('swingMedium', e.x, 0.7);
}

export function teleportAway(w: World, e: Entity, d: number): void {
  for (let i = 0; i < 12; i++) {
    const ang = w.combat.range(-Math.PI, Math.PI);
    const x = clamp(e.x + Math.cos(ang) * d, ROOM_MIN_X + 30, ROOM_MAX_X - 30);
    const y = clamp(e.y + Math.sin(ang) * d, ROOM_MIN_Y + 30, ROOM_MAX_Y - 30);
    if (!w.room.circleBlocked(x, y, e.radius)) {
      w.fx('teleport', e.x, e.y);
      e.x = x;
      e.y = y;
      e.px = x;
      e.py = y;
      w.fx('teleport', x, y);
      return;
    }
  }
}

/** Would a pattern attack be fair right now? (pockets reachable, waves have grates within reach). */
export function patternAllowed(w: World, e: Entity, atk: AttackDef, target: Entity): boolean {
  const p = atk.pattern;
  if (!p) return true;
  if (p.kind === 'pockets') {
    const ctx = patternCtx(w, e, target.x, target.y, atk.windupMs / 1000);
    const specs = resolvePattern(p, { ...ctx, rng: w.combat.clone() });
    const s = specs[0]?.shapes[0];
    if (s && s.k === 'pockets') {
      const reach = (atk.windupMs / 1000 - 0.1) * (260 - (p.pullSpeed ?? 0)) - 40;
      return w.livingPlayers().every((pl) => s.pockets.some((q) => dist(q.x, q.y, pl.x, pl.y) - q.r <= reach));
    }
  }
  if (p.kind === 'wave' && p.safeTiles === 'G') {
    const reach = (atk.windupMs / 1000 - 0.1) * 260 - 40 + 120;
    return w.livingPlayers().every((pl) => nearestGrate(w, pl.x, pl.y) <= reach);
  }
  return true;
}

function nearestGrate(w: World, x: number, y: number): number {
  let best = Infinity;
  const r = w.room;
  for (let ty = 0; ty < 22; ty++)
    for (let tx = 0; tx < 40; tx++) {
      if (r.get(tx, ty) !== 6) continue;
      const d = Math.hypot(tx * 32 + 16 - x, 16 + ty * 32 + 16 - y);
      if (d < best) best = d;
    }
  return best;
}

export { angleDiff };
