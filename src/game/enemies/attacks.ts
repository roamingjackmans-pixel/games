// Enemy attack execution: windup (tint + telegraph) → active (impact, projectiles, lunges, combos) → recover.
import { DEG, angleDiff, circleHit, clamp, dist, lineHit, turnToward } from '../../engine/math';
import { emptySpec, hitPlayer } from '../combat/damage';
import { ENEMY_PROJECTILE_RANGE } from '../combat/formulas';
import { spawnShapeTelegraph, spawnTelegraphs } from '../combat/telegraph';
import { behindGap, resolvePattern, waveFair, type PatternCtx } from '../combat/patterns';
import { speedMult } from '../combat/state';
import { runEffects } from '../effects/run';
import { attackDamage } from './spawn';
import { DAMAGE_TYPES, type AttackDef, type AttackMove, type DamageType, type PatternDef } from '../types';
import { ELEMENTS } from '../elements';
import type { DamageSpec, Entity, World } from '../world';
import { ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y } from '../combat/patterns';
import { ROOM_CX, ROOM_CY, escapeReach } from '../combat/patterns';
import { ROOM_W, ROOM_Y0, T, TILE, tileCenter, worldToTile } from '../room';
import { PLAYER_DOT_DY, PLAYER_DOT_R } from '../player/player';

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
    // every player's recent path, oldest first (Rewind Volley strikes where they were)
    pastTrails: w.livingPlayers().map((p) => (p.pl?.pastPos.length ? p.pl.pastPos.map((q) => ({ age: w.time - q.t, x: q.x, y: q.y })) : [{ age: 0, x: p.x, y: p.y }])),
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
  // a boss phase may shorten its cooldowns (D295: New Game+ Overtime)
  const cdMult = en.isBoss ? ((en.def as unknown as { phases: { cooldownMult?: number }[] }).phases[en.phase]?.cooldownMult ?? 1) : 1;
  en.cooldowns[atk.id] = now + atk.cooldownS * cdMult;
  en.lastAttackId = atk.id;
  if (atk.gazeTurnDeg !== undefined) {
    // a gaze attack strikes along the attacker's gaze (first use: at the target), which then turns for the next use
    const g = en.gaze ?? (target ? Math.atan2(ty - e.y, tx - e.x) : e.facing);
    // a sweeping gaze (D315) starts at the gaze and turns the way the arrow points, to where it will look next
    e.facing = atk.pattern?.kind === 'sweep' ? g + (atk.gazeTurnDeg * DEG) / 2 : g;
    const next = g + atk.gazeTurnDeg * DEG;
    en.gaze = Math.atan2(Math.sin(next), Math.cos(next));
  } else if (target) e.facing = Math.atan2(ty - e.y, tx - e.x);
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
    if (atk.parryableHits) spec.parryable = atk.parryableHits.includes(0);
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
      // charges and lunges hit with the body; a 0-damage area with no status or control only carries its effects
      spec: mv?.kind === 'charge' || mv?.kind === 'lunge' || (atk.dmgMult === 0 && !atk.status && !atk.control) ? null : spec,
      ctx,
      onImpact: atk.effects && atk.kind !== 'utility' ? atk.effects : [],
      trackTargetId: target?.id ?? 0,
      minActiveS: mv?.kind === 'charge' ? 1.2 : 0,
      dmgType: atk.type,
    });
    en.attack.teleIds.push(...teles.map((t) => t.id));
    if (mv?.kind === 'charge' || mv?.kind === 'lunge') fitMoveLane(w, e, mv, teles);
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
    laneHits(w, e, LUNGE_REACH);
  } else if (mv.kind === 'leap') {
    const sp = dist(e.x, e.y, a.aimX, a.aimY) / Math.max(0.02, a.active - a.t);
    const ang = Math.atan2(a.aimY - e.y, a.aimX - e.x);
    e.x += Math.cos(ang) * Math.min(sp * dt, dist(e.x, e.y, a.aimX, a.aimY));
    e.y += Math.sin(ang) * Math.min(sp * dt, dist(e.x, e.y, a.aimX, a.aimY));
    e.anim.scale = 1 + Math.sin((a.t / a.active) * Math.PI) * 0.35;
  } else if (mv.kind === 'charge') {
    // repeated charges: he stands re-aimed while the next telegraph shows
    if ((a.pauseUntil ?? 0) > now) {
      a.t = 0;
      return;
    }
    if (a.pauseUntil) {
      a.pauseUntil = 0;
      e.anim.tint = null;
      w.sfx(a.def.kind === 'red' ? 'swingHeavy' : 'swingMedium', e.x);
    }
    const sp = mv.speed ?? 620;
    const hit = w.room.moveCircle(e, Math.cos(a.angle) * sp * dt, Math.sin(a.angle) * sp * dt, false);
    laneHits(w, e, CHARGE_REACH);
    if (hit || (!mv.untilWall && a.t * sp >= (mv.distance ?? 400))) {
      if (hit && (mv.bounces ?? 0) > a.comboIdx) {
        a.comboIdx++;
        a.angle = a.angle + Math.PI;
        a.hit.clear();
        return;
      }
      // a breakable prop (a tree) takes the charge: it is used up and the charger reels (the punish window)
      if (hit && mv.propStaggerS && breakPropAhead(w, e, a.angle)) {
        a.t = a.active;
        en.stunUntil = now + mv.propStaggerS;
        e.hp!.staggerUntil = now + mv.propStaggerS;
        e.anim.tint = null;
        w.emit({ t: 'shake', amount: 9 });
        w.sfx('hitBone', e.x);
        w.hooks.onChargeEnd?.(w, e, hit);
        return;
      }
      const done = (a.chargesDone ?? 0) + 1;
      if (mv.charges && done < mv.charges) {
        a.chargesDone = done;
        reaimCharge(w, e, mv.chargeGapS ?? 0.5);
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

/** Between repeated charges: face the (current) target and telegraph the next charge for `gapS`. */
function reaimCharge(w: World, e: Entity, gapS: number): void {
  const a = e.en!.attack!;
  const t = w.get(e.en!.targetId) ?? w.get(a.targetId);
  if (t && !t.pl?.downed) {
    e.facing = Math.atan2(t.y - e.y, t.x - e.x);
    a.angle = e.facing;
    a.aimX = t.x;
    a.aimY = t.y;
  }
  a.pauseUntil = w.time + gapS;
  a.t = 0;
  a.hit.clear();
  e.anim.tint = a.def.kind === 'red' ? 'red' : a.def.kind === 'pierce' ? 'blue' : null;
  if (a.def.kind === 'red') w.sfx('redWarning', e.x);
  if (a.def.pattern) {
    const teles = spawnTelegraphs(w, a.def.pattern, { ownerId: e.id, team: 1, kind: a.def.kind, windupS: gapS, spec: null, ctx: patternCtx(w, e, a.aimX, a.aimY, gapS), trackTargetId: a.targetId, minActiveS: 1.2, dmgType: a.def.type });
    a.teleIds.push(...teles.map((x) => x.id));
    if (a.def.move) fitMoveLane(w, e, a.def.move, teles);
  }
}

/** A charge stopped against a breakable prop (room.trees): the prop's whole clump takes one hit. */
function breakPropAhead(w: World, e: Entity, angle: number): boolean {
  const room = w.room;
  if (!room.trees.size) return false;
  const r = Math.max(4, e.radius * 0.8);
  const reach = r + 8;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const [x0, y0] = worldToTile(e.x - reach, e.y - reach);
  const [x1, y1] = worldToTile(e.x + reach, e.y + reach);
  let best = -1;
  let bestDot = -Infinity;
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      const idx = ty * ROOM_W + tx;
      if (!room.trees.has(idx) || room.get(tx, ty) !== T.Prop) continue;
      const cx = clamp(e.x, tx * TILE, tx * TILE + TILE);
      const cy = clamp(e.y, ROOM_Y0 + ty * TILE, ROOM_Y0 + ty * TILE + TILE);
      if (Math.hypot(cx - e.x, cy - e.y) > reach) continue;
      const dot = (cx - e.x) * ca + (cy - e.y) * sa;
      if (dot > bestDot) {
        bestDot = dot;
        best = idx;
      }
    }
  // only a prop in front of the charge (or square at its side when it slid along) counts
  if (best < 0 || bestDot < -4) return false;
  const clump = [best];
  const seen = new Set(clump);
  for (let i = 0; i < clump.length; i++) {
    const c = clump[i]!;
    for (const n of [c - 1, c + 1, c - ROOM_W, c + ROOM_W]) {
      if (seen.has(n) || !room.trees.has(n) || room.tiles[n] !== T.Prop) continue;
      seen.add(n);
      clump.push(n);
    }
  }
  for (const idx of clump) {
    const left = (room.trees.get(idx) ?? 1) - 1;
    if (left > 0) {
      room.trees.set(idx, left);
      continue;
    }
    room.trees.delete(idx);
    const tx = idx % ROOM_W;
    const ty = Math.floor(idx / ROOM_W);
    room.set(tx, ty, T.Floor);
    const [cx, cy] = tileCenter(tx, ty);
    w.fx('burst', cx, cy, { color: '#2f5a30', n: 12, r: 34 });
    w.fx('dust', cx, cy, { n: 8 });
  }
  return true;
}

/** How far past its radius a lunging or charging body reaches (px). */
export const LUNGE_REACH = 18;
export const CHARGE_REACH = 22;

type Lane = { x: number; y: number; a: number; w: number; l: number };

/**
 * The red bar of a lunge or charge is its whole hit area: it runs from where the attacker starts (from the wall behind
 * it, for a charge that bounces back) over the full travel plus the body's reach past its centre, cut at a wall. The
 * hit test below uses this same bar, so standing outside it is always safe.
 */
export function fitLaneShape(w: World, e: Entity, mv: AttackMove, s: Lane): void {
  const reach = e.radius + (mv.kind === 'charge' ? CHARGE_REACH : LUNGE_REACH);
  const fwd = w.room.rayToWall(s.x, s.y, s.a);
  let l = mv.kind === 'charge' && mv.untilWall ? fwd : Math.min(fwd, (mv.distance ?? (mv.kind === 'charge' ? 400 : 160)) + reach);
  if (mv.kind === 'charge' && (mv.bounces ?? 0) > 0) {
    // it comes back the other way, past where it started, to the wall behind
    const back = w.room.rayToWall(s.x, s.y, s.a + Math.PI);
    s.x -= Math.cos(s.a) * back;
    s.y -= Math.sin(s.a) * back;
    l += back;
  }
  s.l = Math.max(1, l);
}

function fitMoveLane(w: World, e: Entity, mv: AttackMove, teles: Entity[]): void {
  const a = e.en!.attack;
  if (!a) return;
  for (const t of teles) {
    const s = t.tg?.shapes[0];
    if (t.tg?.shapes.length !== 1 || s?.k !== 'line') continue;
    fitLaneShape(w, e, mv, s);
    a.laneTeleId = t.id;
    a.lane = { x: s.x, y: s.y, a: s.a, w: s.w, l: s.l };
    return;
  }
}

/**
 * A charging body at (cx, cy) reaching `reach` px hits a target circle only where that circle is inside the bar and
 * level with the body along it: the bar's width and length are the hit area exactly.
 */
export function laneBodyHit(lane: Lane, cx: number, cy: number, reach: number, px: number, py: number, pr: number): boolean {
  if (!lineHit(lane.x, lane.y, lane.a, lane.w, lane.l, px, py, pr)) return false;
  const along = (px - cx) * Math.cos(lane.a) + (py - cy) * Math.sin(lane.a);
  return Math.abs(along) <= reach + pr;
}

/** Lunge / charge hits: inside its bar, tested at the dot at a player's feet (D262), like an area. */
function laneHits(w: World, e: Entity, extra: number): void {
  const a = e.en!.attack!;
  const t = a.laneTeleId ? w.get(a.laneTeleId) : undefined;
  const s = t && !t.removed ? t.tg?.shapes[0] : undefined;
  if (s?.k === 'line') a.lane = { x: s.x, y: s.y, a: s.a, w: s.w, l: s.l };
  if (!a.lane) {
    bodyHits(w, e, extra);
    return;
  }
  const spec = enemyAttackSpec(e, a.def);
  const reach = e.radius + extra;
  for (const p of w.livingPlayers()) {
    if (a.hit.has(p.id)) continue;
    if (!laneBodyHit(a.lane, e.x, e.y, reach, p.x, p.y + PLAYER_DOT_DY, PLAYER_DOT_R)) continue;
    a.hit.add(p.id);
    hitPlayer(w, e.id, p, spec, e.x, e.y);
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
  // a lob lands no further than a projectile can fly (D185)
  const ld = dist(e.x, e.y, tx, ty);
  if (p.lob && ld > ENEMY_PROJECTILE_RANGE) {
    tx = e.x + ((tx - e.x) * ENEMY_PROJECTILE_RANGE) / ld;
    ty = e.y + ((ty - e.y) * ENEMY_PROJECTILE_RANGE) / ld;
  }
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
      until: w.time + Math.min(p.range ?? 1600, ENEMY_PROJECTILE_RANGE) / speed,
      pierce: 0,
      hit: new Set(),
      poiseDmg: 0,
      onImpact: p.onImpact ? { op: 'damage', pattern: p.onImpact, type: firstType(spec), mult: 1 } : null,
      parryable: spec.parryable,
      reflected: false,
      returns: !!p.returns,
      returning: false,
      drawId: p.drawId ?? 'e_bolt',
      // the bolt glows in its damage type's colour (D81)
      color: ELEMENTS[firstType(spec)].glow,
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

function firstType(spec: DamageSpec): DamageType {
  for (const k of DAMAGE_TYPES) if ((spec.dmg[k] ?? 0) > 0) return k;
  return 'physical';
}

/** Re-resolve and immediately apply one melee hit of a combo at the current facing. */
function comboHit(w: World, e: Entity, atk: AttackDef, idx: number): void {
  if (!atk.pattern || idx === 0) return; // hit 0 is the telegraph's own impact
  const mult = atk.comboMults?.[idx] ?? 1;
  const spec = enemyAttackSpec(e, atk, mult);
  if (atk.parryableHits) spec.parryable = atk.parryableHits.includes(idx);
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
    if (target && a.t < a.windup * 0.6 && !a.def.move?.untilWall && a.def.gazeTurnDeg === undefined) {
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
      if (a.t < a.windup * 0.6) {
        followShapes(t, e, a.angle);
        if (id === a.laneTeleId && a.def.move) fitMoveLane(w, e, a.def.move, [t]);
      }
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
        if (a.def.comboRotateDeg) e.facing += a.def.comboRotateDeg * DEG;
        else if (target) e.facing = turnToward(e.facing, Math.atan2(target.y - e.y, target.x - e.x), 60 * DEG);
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
      // a chained attack starts at once, re-aimed (Judgment's Frost Nova, repeated dashes and volleys)
      if (a.def.chain && !e.hp!.dead) {
        const next = w.get(en.targetId) ?? target;
        startEnemyAttack(w, e, a.def.chain, next && !next.removed && !next.pl?.downed ? next : null);
        return;
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
  // a wave dodged on the grates (alone or in a sequence: the Crosswave): from its fairest side every player can
  // still wade to a grate before the band arrives (D94)
  if (p.kind === 'wave' || p.kind === 'sequence') return waveFair(p, patternCtx(w, e, target.x, target.y, atk.windupMs / 1000));
  // a ring whose only gap is behind him: some side must have open floor everyone can walk to (D94)
  if (p.kind === 'expandingRing' && p.gapBehind) {
    const ctx = patternCtx(w, e, target.x, target.y, atk.windupMs / 1000);
    ctx.facing = Math.atan2(target.y - e.y, target.x - e.x);
    return behindGap(ctx, e.x, e.y).fair;
  }
  return true;
}

/**
 * Condition 'ringReachable' (a ring out to the room's edge: everything beyond rIn is hit): every player can get
 * inside rIn before it lands, under the pattern's pull (GAME_DESIGN §5.6).
 */
export function ringReachable(w: World, e: Entity, atk: AttackDef, target: Entity): boolean {
  const p = atk.pattern;
  if (!p || p.kind !== 'ring') return true;
  const [ax, ay] = p.anchor === 'center' ? [ROOM_CX, ROOM_CY] : p.anchor === 'target' || p.anchor === 'aim' || p.anchor === 'point' ? [target.x, target.y] : [e.x, e.y];
  const reach = escapeReach(atk.windupMs / 1000, p.pullSpeed ?? 0);
  return w.livingPlayers().every((pl) => dist(pl.x, pl.y, ax, ay) - p.rIn <= reach);
}

export { angleDiff };
