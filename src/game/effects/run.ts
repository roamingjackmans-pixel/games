// EffectDef executor (DATA_MODEL §3): the closed vocabulary shared by weapon skills, spells, consumables,
// legendary powers, elite affixes, enemy utilities and on-death effects.
import { ELEMENTS } from '../elements';
import { DEG, clamp, dist } from '../../engine/math';
import { ENEMIES } from '../../data/enemies';
import { addBuff, buffSum } from '../combat/state';
import { addRevive, applyControl, checkDeath, cleanse, emptySpec, ffVictims, grantBarrier, heal, hitAlly, hitEnemy, hitPlayer, interrupt } from '../combat/damage';
import { spawnTelegraphs } from '../combat/telegraph';
import { ENEMY_PROJECTILE_RANGE, spellUtility } from '../combat/formulas';
import { ROOM_MAX_X, ROOM_MAX_Y, ROOM_MIN_X, ROOM_MIN_Y, resolvePattern, type PatternCtx, type Shape } from '../combat/patterns';
import { spawnHazard } from '../systems/hazards';
import { collapseFloor } from '../boss/platform';
import type { BuffStat, DamageType, EffectDef, EnemyDef, PatternDef, Team } from '../types';
import type { DamageSpec, Entity, World } from '../world';

export interface EffectCtx {
  sourceId: number;
  team: Team;
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  targetId: number;
  powerMult: number;
  isSpell: boolean;
  isSkill: boolean;
  /** the base damage that `mult` multiplies (weapon power for skills, role hit for enemies) */
  baseDamage: number;
  /** telegraph time for pattern damage effects (0 = instant) */
  windupS: number;
  tag: string;
}

/** Hooks the game layer provides (weapon spec for skills, summons into the room's wave tracking). */
export interface EffectHooks {
  weaponSpec?(w: World, p: Entity, mult: number, opts: { skill: boolean; ignoreFrontGuard?: boolean }): DamageSpec;
  spawnSummon?(w: World, source: Entity, def: EnemyDef, x: number, y: number, lifetimeS?: number): Entity | null;
  spawnPlayerProjectile?(w: World, p: Entity, a: number, speed: number, r: number, spec: DamageSpec, pierce: number, drawId: string, o: { range?: number; isSpell?: boolean; returns?: boolean; color?: string; homing?: number }): Entity;
}
export const effectHooks: EffectHooks = {};

const ELEMENT_COLOR: Record<DamageType, string> = { physical: ELEMENTS.physical.glow, magic: ELEMENTS.magic.glow, void: ELEMENTS.void.glow, fire: ELEMENTS.fire.glow, holy: ELEMENTS.holy.glow };

function enemiesOf(w: World, team: Team): Entity[] {
  return team === 0 ? w.livingEnemies() : w.livingPlayers();
}
function alliesOf(w: World, team: Team): Entity[] {
  return team === 0 ? w.livingPlayers() : w.livingEnemies();
}

function patternCtxFor(w: World, ctx: EffectCtx, src: Entity | undefined): PatternCtx {
  const facing = Math.atan2(ctx.aimY - ctx.y, ctx.aimX - ctx.x);
  return {
    ox: ctx.x,
    oy: ctx.y,
    facing: Number.isFinite(facing) ? facing : (src?.facing ?? 0),
    tx: ctx.aimX,
    ty: ctx.aimY,
    players: (ctx.team === 0 ? w.livingEnemies() : w.livingPlayers()).map((p) => ({ x: p.x, y: p.y })),
    rng: w.combat,
    room: w.room,
    telegraphS: ctx.windupS,
  };
}

/** Damage spec for a `damage` op from this source. */
function damageSpec(w: World, e: Extract<EffectDef, { op: 'damage' }>, ctx: EffectCtx, src: Entity | undefined): DamageSpec {
  const mult = (e.mult ?? 1) * ctx.powerMult;
  let spec: DamageSpec;
  if (src?.pl && !ctx.isSpell && e.base === undefined && effectHooks.weaponSpec && e.type === 'physical') {
    spec = effectHooks.weaponSpec(w, src, mult, { skill: ctx.isSkill, ...(e.ignoreFrontGuard ? { ignoreFrontGuard: true } : {}) });
  } else if (src?.pl && !ctx.isSpell && e.base === undefined && effectHooks.weaponSpec) {
    // elemental skill: the weapon's damage becomes the listed type
    spec = effectHooks.weaponSpec(w, src, mult, { skill: ctx.isSkill });
    const total = Object.values(spec.dmg).reduce((a, b) => a + (b ?? 0), 0);
    spec.dmg = { [e.type]: total };
  } else {
    spec = emptySpec(ctx.team === 0 ? 'player' : 'normal');
    const base = e.base ?? ctx.baseDamage;
    let amt = base * mult;
    // ilvl scaling for consumables happens in the caller via powerMult
    if (src?.pl && ctx.isSpell) {
      // either hand's tool (D117): staff bonuses are Void/Magic and talisman bonuses Holy, which only that
      // school's spells deal, so a bonus never crosses schools
      const d = src.pl.derived;
      const tool = [d.mainTool, d.offTool].find((t) => t?.def.bonus?.element === e.type)?.def;
      if (tool?.bonus) amt *= 1 + tool.bonus.pct;
      if (src.pl.derived.powers.has('overcharge')) amt *= 1.25;
    }
    spec.dmg = { [e.type]: amt };
    spec.isSpell = ctx.isSpell;
    spec.isSkill = ctx.isSkill;
  }
  if (e.status) spec.status = [...spec.status, e.status];
  if (e.control) spec.control = e.control;
  if (e.poiseDmg !== undefined) spec.poiseDmg = e.poiseDmg;
  if (e.knockback) spec.knockback = e.knockback;
  if (e.critVs) spec.critVs = e.critVs;
  if (e.critMult) spec.critMult = e.critMult;
  if (e.ignoreFrontGuard) spec.ignoreFrontGuard = true;
  if (e.guaranteedStagger) spec.guaranteedStagger = true;
  if (e.bossPoiseMult) spec.bossPoiseMult = e.bossPoiseMult;
  if (e.root) spec.root = e.root;
  if (e.pull) spec.pullToSource = true;
  if (e.undeadMult) spec.undeadMult = e.undeadMult;
  if (e.onlyUndead) spec.onlyUndead = true;
  if (e.onKill) spec.onKillEffects = e.onKill;
  spec.reviveValue = ctx.isSpell ? 0.25 : spec.reviveValue;
  spec.sourceTag = ctx.tag;
  return spec;
}

/** How much bigger a player's spell projectiles are than their listed radius (D180). */
export const SPELL_PROJECTILE_SCALE = 4; // D204: twice D180's ×2

function doDamage(w: World, e: Extract<EffectDef, { op: 'damage' }>, ctx: EffectCtx, src: Entity | undefined): void {
  const spec = damageSpec(w, e, ctx, src);
  const p = e.pattern;
  if (p.kind === 'projectile') {
    const a = Math.atan2(ctx.aimY - ctx.y, ctx.aimX - ctx.x);
    const n = p.count ?? 1;
    const spread = (p.spreadDeg ?? (n > 1 ? 30 : 0)) * DEG;
    for (let i = 0; i < n; i++) {
      const ang = n > 1 ? a - spread / 2 + (spread * i) / (n - 1) : a;
      if (ctx.team === 0 && src?.pl && effectHooks.spawnPlayerProjectile) {
        // a player's spell projectiles fly twice their listed size, to see and to hit with (D180)
        const pr = effectHooks.spawnPlayerProjectile(w, src, ang, p.speed, ctx.isSpell ? p.r * SPELL_PROJECTILE_SCALE : p.r, spec, p.pierce ?? 0, p.drawId ?? (ctx.isSpell ? 'p_magic' : 'p_knife'), {
          ...(p.range ? { range: p.range } : {}),
          isSpell: ctx.isSpell,
          ...(p.returns ? { returns: true } : {}),
          color: ELEMENT_COLOR[e.type],
          ...(p.homing ? { homing: p.homing * DEG } : {}),
        });
        if (p.lob) pr.pr!.lob = { fromX: ctx.x, fromY: ctx.y, toX: ctx.aimX, toY: ctx.aimY, t: 0, dur: Math.max(0.3, dist(ctx.x, ctx.y, ctx.aimX, ctx.aimY) / p.speed) };
        if (p.onImpact) pr.pr!.onImpact = { ...e, pattern: p.onImpact };
        pr.x = ctx.x + Math.cos(ang) * 16;
        pr.y = ctx.y + Math.sin(ang) * 16;
      } else if (src) {
        // enemy projectile from an effect
        const sp = w.spawn('projectile', ctx.x, ctx.y, {
          radius: p.r,
          team: 1,
          vx: Math.cos(ang) * p.speed,
          vy: Math.sin(ang) * p.speed,
          facing: ang,
          drawId: p.drawId ?? 'e_bolt',
          pr: {
            ownerId: src.id,
            team: 1,
            dmg: spec.dmg,
            status: spec.status,
            control: spec.control,
            kind: 'normal',
            speed: p.speed,
            homing: (p.homing ?? 0) * DEG,
            targetId: ctx.targetId,
            until: w.time + Math.min(p.range ?? 1600, ENEMY_PROJECTILE_RANGE) / p.speed,
            pierce: 0,
            hit: new Set(),
            poiseDmg: 0,
            onImpact: p.onImpact ? { ...e, pattern: p.onImpact } : null,
            parryable: true,
            reflected: false,
            returns: false,
            returning: false,
            drawId: p.drawId ?? 'e_bolt',
            color: ELEMENT_COLOR[e.type],
            reviveValue: 0,
            knockback: 0,
            lob: p.lob ? { fromX: ctx.x, fromY: ctx.y, toX: ctx.aimX, toY: ctx.aimY, t: 0, dur: Math.max(0.35, dist(ctx.x, ctx.y, ctx.aimX, ctx.aimY) / p.speed) } : null,
            curve: (p.curve ?? 0) * DEG,
            isSpell: false,
            isSkill: false,
            sourceTag: ctx.tag,
          },
        });
        void sp;
      }
    }
    return;
  }
  const windup = e.telegraphS ?? ctx.windupS;
  const ticks = e.ticks ?? 1;
  const fire = (): void => {
    spawnTelegraphs(w, p, {
      ownerId: ctx.sourceId,
      team: ctx.team,
      kind: ctx.team === 0 ? 'normal' : 'normal',
      windupS: windup,
      spec,
      ctx: patternCtxFor(w, ctx, src),
      hidden: ctx.team === 0 && windup <= 0.05,
      sourceTag: ctx.tag,
    });
  };
  fire();
  for (let i = 1; i < ticks; i++) w.schedule((e.tickS ?? 0.3) * i, fire);
}

function pickAlly(w: World, ctx: EffectCtx, src: Entity | undefined, pred: (x: Entity) => boolean = () => true): Entity | null {
  let best: Entity | null = null;
  let bs = Infinity;
  for (const a of alliesOf(w, ctx.team)) {
    if (a === src || !pred(a)) continue;
    const s = a.hp ? a.hp.hp / a.hp.max : 1;
    if (s < bs) {
      bs = s;
      best = a;
    }
  }
  return best;
}

function targets(w: World, eff: EffectDef, ctx: EffectCtx, src: Entity | undefined): Entity[] {
  const t = eff.target ?? 'self';
  const r = eff.r ?? 140;
  switch (t) {
    case 'self':
      return src ? [src] : [];
    case 'party':
      return alliesOf(w, ctx.team).filter((a) => dist(a.x, a.y, ctx.x, ctx.y) <= r || a === src);
    case 'others':
      return alliesOf(w, ctx.team).filter((a) => a !== src && dist(a.x, a.y, ctx.x, ctx.y) <= r);
    case 'ally':
    case 'nearestAlly': {
      if (ctx.team === 0) {
        let best: Entity | null = null;
        let bd = Infinity;
        for (const a of w.livingPlayers()) {
          const d = dist(a.x, a.y, ctx.aimX, ctx.aimY);
          if (a !== src && d < bd && d < 160) {
            bd = d;
            best = a;
          }
        }
        return best ? [best] : src ? [src] : [];
      }
      const a = pickAlly(w, ctx, src);
      return a ? [a] : [];
    }
    case 'enemies':
      return enemiesOf(w, ctx.team).filter((x) => dist(x.x, x.y, ctx.x, ctx.y) <= r);
    case 'allEnemies':
      return enemiesOf(w, ctx.team);
    case 'target': {
      const tt = w.get(ctx.targetId);
      return tt ? [tt] : [];
    }
    case 'ghost':
      return w.players.filter((p) => p.pl!.downed && dist(p.x, p.y, ctx.x, ctx.y) <= r);
    case 'summoner': {
      const s = src?.en ? w.get(src.en.summonerId) : undefined;
      return s ? [s] : [];
    }
  }
}

/** A random spot just inside one of the room's walls. */
function edgePoint(w: World): [number, number] {
  const side = w.combat.int(0, 3);
  if (side === 0) return [w.combat.range(ROOM_MIN_X + 40, ROOM_MAX_X - 40), ROOM_MIN_Y + 40];
  if (side === 1) return [w.combat.range(ROOM_MIN_X + 40, ROOM_MAX_X - 40), ROOM_MAX_Y - 40];
  if (side === 2) return [ROOM_MIN_X + 40, w.combat.range(ROOM_MIN_Y + 40, ROOM_MAX_Y - 40)];
  return [ROOM_MAX_X - 40, w.combat.range(ROOM_MIN_Y + 40, ROOM_MAX_Y - 40)];
}

function placeNear(w: World, x: number, y: number, r: number, radius: number): [number, number] {
  for (let i = 0; i < 16; i++) {
    const a = w.combat.range(-Math.PI, Math.PI);
    const d = w.combat.range(r * 0.4, r);
    const px = clamp(x + Math.cos(a) * d, ROOM_MIN_X + 20, ROOM_MAX_X - 20);
    const py = clamp(y + Math.sin(a) * d, ROOM_MIN_Y + 20, ROOM_MAX_Y - 20);
    if (!w.room.circleBlocked(px, py, radius)) return [px, py];
  }
  return w.room.nearestFloor(x, y, radius);
}

export function runEffects(w: World, effects: EffectDef[], ctx: EffectCtx): void {
  for (const e of effects) {
    if (e.delayS && e.delayS > 0) {
      const { delayS: _d, ...rest } = e;
      void _d;
      w.schedule(e.delayS, () => runEffects(w, [rest as EffectDef], ctx));
      continue;
    }
    runOne(w, e, ctx);
  }
}

/** A spell buff's size after Spell Skill (D182), held inside sane limits for stats that run away. */
function spellBuffAmount(stat: string, amount: number): number {
  if (stat === 'holyConvertPct') return Math.min(0.8, amount);
  if (stat === 'physicalTakenPct' || stat.endsWith('TakenPct')) return Math.max(-0.6, amount);
  if (stat === 'speedMult') return Math.max(-0.8, amount);
  if (stat === 'attackSpeedPct' || stat === 'castSpeedPct') return Math.min(0.6, amount);
  return amount;
}

function runOne(w: World, e: EffectDef, ctx: EffectCtx): void {
  const src = w.get(ctx.sourceId);
  const now = w.time;
  // a player's spell grows with its caster's Spell Skill (D182): damage and healing by ctx.powerMult, everything
  // else (buff sizes, barriers, revive strength, how long utility lasts) by the gentler spellUtility
  const spell = ctx.isSpell && ctx.team === 0;
  const u = spell ? spellUtility(ctx.powerMult) : 1;
  switch (e.op) {
    case 'damage':
      doDamage(w, e, ctx, src);
      break;
    case 'dash': {
      if (!src) break;
      let tx = ctx.aimX;
      let ty = ctx.aimY;
      if (e.toward === 'target' || e.toward === 'behindTarget') {
        const t = w.get(ctx.targetId) ?? nearestEnemy(w, src, ctx.team, 400);
        if (t) {
          const a = Math.atan2(t.y - src.y, t.x - src.x);
          tx = t.x + Math.cos(a) * (e.toward === 'behindTarget' ? t.radius + 40 : 0);
          ty = t.y + Math.sin(a) * (e.toward === 'behindTarget' ? t.radius + 40 : 0);
        }
      }
      let a = Math.atan2(ty - src.y, tx - src.x);
      if (e.toward === 'away') a += Math.PI;
      const dd = e.leap ? Math.min(e.distance, dist(src.x, src.y, tx, ty)) : e.distance;
      const sp = dd / Math.max(0.05, e.durationS);
      src.forced = { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, until: now + e.durationS, kind: e.leap ? 'leap' : 'dash' };
      if (src.pl && e.iframes !== 'none') {
        src.pl.iframesFrom = now;
        src.pl.iframesUntil = now + e.durationS;
        src.pl.iframeKind = e.iframes === 'all' ? 'all' : 'redOnly';
      }
      if (e.leap) src.anim.scale = 1.3;
      if (e.hitOnEntry) runEffects(w, [e.hitOnEntry], { ...ctx, x: src.x, y: src.y });
      const exit = e.hitOnExit ?? e.hitOnLand;
      w.schedule(e.durationS, () => {
        src.anim.scale = 1;
        if (exit) runEffects(w, [exit], { ...ctx, x: src.x, y: src.y, aimX: src.x + Math.cos(a) * 60, aimY: src.y + Math.sin(a) * 60 });
      });
      if (e.toward === 'behindTarget') w.schedule(e.durationS, () => (src.facing = a + Math.PI));
      break;
    }
    case 'teleport': {
      if (!src) break;
      let x = src.x;
      let y = src.y;
      if (e.toward === 'aim') {
        const a = Math.atan2(ctx.aimY - src.y, ctx.aimX - src.x);
        const d = Math.min(e.distance, dist(src.x, src.y, ctx.aimX, ctx.aimY));
        x = src.x + Math.cos(a) * d;
        y = src.y + Math.sin(a) * d;
      } else if (e.toward === 'behindTarget') {
        const t = w.get(ctx.targetId);
        if (t) {
          x = t.x - Math.cos(t.facing) * 70;
          y = t.y - Math.sin(t.facing) * 70;
        }
      } else {
        const a = e.toward === 'away' && w.get(ctx.targetId) ? Math.atan2(src.y - w.get(ctx.targetId)!.y, src.x - w.get(ctx.targetId)!.x) : w.combat.range(-Math.PI, Math.PI);
        x = src.x + Math.cos(a) * e.distance;
        y = src.y + Math.sin(a) * e.distance;
      }
      x = clamp(x, ROOM_MIN_X + 16, ROOM_MAX_X - 16);
      y = clamp(y, ROOM_MIN_Y + 16, ROOM_MAX_Y - 16);
      if (w.room.circleBlocked(x, y, src.radius * 0.8)) [x, y] = w.room.nearestFloor(x, y, src.radius);
      w.fx('teleport', src.x, src.y);
      src.x = x;
      src.y = y;
      src.px = x;
      src.py = y;
      w.fx('teleport', x, y);
      w.sfx('dodge', x, 0.6, 1.4);
      break;
    }
    case 'buff':
    case 'debuff': {
      const list = e.op === 'debuff' ? targets(w, { ...e, target: e.target ?? 'enemies' }, ctx, src) : targets(w, e, ctx, src);
      const id = ('id' in e && e.id) || `${ctx.tag}:${e.stat}`;
      for (const t of list) {
        const isStack = e.op === 'buff' && !!e.stackOn;
        addBuff(t, w, {
          id,
          stat: e.stat as BuffStat,
          amount: spell ? spellBuffAmount(e.stat, e.amount * u) : e.amount,
          durationS: e.durationS,
          maxStacks: e.op === 'buff' ? (e.maxStacks ?? 1) : 1,
          sourceId: ctx.sourceId,
        });
        if (isStack) {
          // stacking buffs start at 0 stacks and grow on kills/hits (power hooks)
          const b = t.buffs!.find((x) => x.id === id)!;
          b.stacks = 0;
          if (e.op === 'buff' && e.stackOn) b.stackOn = e.stackOn;
        }
        if (e.stat === 'speedMult' && t.en && e.amount < 0) {
          t.en.slowUntil = now + e.durationS;
          t.en.slowMult = 1 + e.amount;
        }
      }
      break;
    }
    case 'heal': {
      for (const t of targets(w, e, ctx, src)) {
        if (!t.hp) continue;
        const amount = (e.flat ?? 0) + t.hp.max * e.pct * (e.spell || spell ? ctx.powerMult : 1);
        if (e.overS && e.overS > 0) {
          if (t.pl) t.pl.healOver.push({ perS: amount / e.overS, until: now + e.overS, interruptible: !!e.interruptible });
          else {
            const steps = Math.ceil(e.overS / 0.5);
            for (let i = 1; i <= steps; i++) w.schedule(i * 0.5, () => heal(w, t, amount / steps));
          }
        } else heal(w, t, amount);
        w.fx('heal', t.x, t.y);
        if (t.pl && src?.pl?.derived.powers.has('litany') && t.stam) t.stam.cur = Math.min(t.stam.max, t.stam.cur + t.stam.max * 0.1);
      }
      w.sfx('heal', ctx.x, 0.7);
      break;
    }
    case 'barrier':
      for (const t of targets(w, e, ctx, src)) if (t.hp) grantBarrier(w, t, t.hp.max * Math.min(0.75, e.pctMaxHp * u), e.durationS);
      break;
    case 'summon': {
      const def = ENEMIES[e.enemyId];
      if (!def || !src) break;
      const alive = w.enemies.filter((x) => !x.hp?.dead && x.en?.summonerId === src.id && x.en.def.id === e.enemyId).length;
      const max = e.max ?? 99;
      const n = Math.min(e.count, Math.max(0, max - alive));
      const graves = e.at === 'graves' ? (w.spots.graves ?? []) : [];
      for (let i = 0; i < n; i++) {
        // 'edges': they march in from a random point along the walls
        const g = graves.length ? graves[w.combat.int(0, graves.length - 1)]! : e.at === 'edges' ? edgePoint(w) : null;
        const [x, y] = g ? placeNear(w, g[0], g[1], 56, def.radius) : placeNear(w, src.x, src.y, 140, def.radius);
        const s = effectHooks.spawnSummon?.(w, src, def, x, y, e.lifetimeS);
        if (s?.en) s.en.summonerId = src.id;
      }
      break;
    }
    case 'decoy': {
      for (let i = 0; i < e.count; i++) {
        const x = ctx.team === 0 ? ctx.aimX : ctx.x + w.combat.spread(60);
        const y = ctx.team === 0 ? ctx.aimY : ctx.y + w.combat.spread(60);
        w.spawn('decoy', clamp(x + i * 30, ROOM_MIN_X, ROOM_MAX_X), clamp(y, ROOM_MIN_Y, ROOM_MAX_Y), {
          radius: 14,
          team: ctx.team,
          dc: { until: now + e.durationS * u, tauntR: e.tauntR, ownerId: ctx.sourceId, illusion: !!e.illusion },
        });
      }
      break;
    }
    case 'pull':
    case 'push': {
      const cx = e.at === 'aim' ? ctx.aimX : ctx.x;
      const cy = e.at === 'aim' ? ctx.aimY : ctx.y;
      for (const t of enemiesOf(w, ctx.team)) {
        const d = dist(t.x, t.y, cx, cy);
        if (d > e.r || d < 1) continue;
        if (t.en?.isBoss) {
          if (e.bosses === 'immune' || !e.bosses) continue;
          const m = /slow\((\d+)\)/.exec(e.bosses);
          if (m) {
            t.en.slowUntil = now + e.durationS;
            t.en.slowMult = 1 - Number(m[1]) / 100;
          }
          continue;
        }
        const dir = e.op === 'pull' ? -1 : 1;
        const sp = e.op === 'pull' ? Math.min(e.speed, d / e.durationS) : e.speed;
        t.forced = { vx: ((t.x - cx) / d) * sp * dir, vy: ((t.y - cy) / d) * sp * dir, until: now + e.durationS, kind: 'pull' };
      }
      break;
    }
    case 'zone': {
      const pctx = patternCtxFor(w, ctx, src);
      const specs = resolvePattern(e.pattern, pctx);
      const shapes: Shape[] = specs.flatMap((s) => s.shapes);
      const hz = spawnHazard(w, e.hazard ?? 'consecrate', shapes, e.durationS, ctx.team, ctx.sourceId, {
        tickS: e.tickS,
        effects: e.tick,
        allyEffects: e.allyTick ?? [],
        powerMult: ctx.powerMult,
        enemiesOnly: !!e.enemiesOnly,
        alliesOnly: !!e.alliesOnly,
        slowPct: e.slowPct ?? 0,
        noStatusBuild: !!e.noStatusBuild,
        enemyDamagePct: e.enemyDamagePct ?? 0,
        burst: e.burst ?? null,
        follow: e.follow ? ctx.sourceId : 0,
        spec: null,
        pull: e.hazard === 'gravityWell' ? 220 : 0,
      });
      void hz;
      break;
    }
    case 'wall': {
      const a = Math.atan2(ctx.aimY - ctx.y, ctx.aimX - ctx.x) + Math.PI / 2;
      const len = e.pattern.kind === 'line' && typeof e.pattern.l === 'number' ? e.pattern.l : 200;
      const wd = e.pattern.kind === 'line' ? e.pattern.w : 40;
      w.spawn('wall', ctx.aimX, ctx.aimY, {
        team: ctx.team,
        wl: {
          until: now + e.durationS * u,
          blocksProjectiles: e.blocks.includes('projectiles'),
          blocksEnemies: e.blocks.includes('enemies'),
          x1: ctx.aimX - (Math.cos(a) * len) / 2,
          y1: ctx.aimY - (Math.sin(a) * len) / 2,
          x2: ctx.aimX + (Math.cos(a) * len) / 2,
          y2: ctx.aimY + (Math.sin(a) * len) / 2,
          w: wd,
        },
      });
      break;
    }
    case 'stance':
      if (src?.pl) {
        src.pl.stanceUntil = now + e.durationS;
        src.pl.stanceRiposteMult = e.riposteMult ?? 3;
      }
      break;
    case 'channel':
      if (src?.pl) {
        src.pl.channel = {
          until: now + e.durationS,
          tickS: e.tickS,
          nextTick: now,
          tick: e.tick,
          moveMult: e.moveSpeedPct,
          followAim: !!e.followAim,
          source: ctx.isSpell ? 'spell' : 'skill',
          powerMult: ctx.powerMult,
          hyperArmor: !!e.hyperArmor,
        };
        src.pl.state = 'channel';
        src.pl.stateUntil = now + e.durationS;
      }
      break;
    case 'chain': {
      const hit = new Set<number>();
      // a player's chain starts at the cursor (the bolt is near-instant at 900 px/s)
      let fx = ctx.team === 0 ? ctx.aimX : ctx.x;
      let fy = ctx.team === 0 ? ctx.aimY : ctx.y;
      let k = 1;
      for (let j = 0; j <= e.jumps; j++) {
        let best: Entity | null = null;
        let bd = j === 0 ? e.r * 1.5 : e.r;
        // friendly fire (D115): a player's chain can jump to the other standing players too
        for (const t of ctx.team === 0 ? [...enemiesOf(w, 0), ...ffVictims(w, src)] : enemiesOf(w, ctx.team)) {
          if (hit.has(t.id)) continue;
          const d = dist(t.x, t.y, fx, fy);
          if (d < bd) {
            bd = d;
            best = t;
          }
        }
        if (!best) break;
        hit.add(best.id);
        w.fx('line', fx, fy, { a: Math.atan2(best.y - fy, best.x - fx), r: dist(fx, fy, best.x, best.y), color: '#ffe14a' });
        if (e.hit.op === 'damage') {
          const spec = damageSpec(w, e.hit, { ...ctx, powerMult: ctx.powerMult * k }, src);
          if (best.en) hitEnemy(w, src ?? null, best, spec, fx, fy);
          else if (best.pl && ctx.team === 0) hitAlly(w, src, best, spec, fx, fy);
          else if (best.pl) hitPlayer(w, ctx.sourceId, best, spec, fx, fy);
        }
        fx = best.x;
        fy = best.y;
        k *= 1 - e.falloff;
      }
      if (hit.size) w.sfx('shock', ctx.x, 0.7);
      break;
    }
    case 'modifyNext':
      if (src?.pl) {
        if (e.what === 'flask') src.pl.flaskBoost = { until: now + e.windowS, pct: e.mods.powerPct ?? 0.5, cleanse: true };
        else
          src.pl.nextSpellFree = {
            count: e.count,
            until: now + e.windowS,
            powerPct: e.mods.powerPct ?? 0,
            noCooldown: !!e.mods.noCooldown,
            noStamina: !!e.mods.noStamina,
          };
      }
      break;
    case 'link': {
      if (!src?.pl) break;
      let best: Entity | null = null;
      let bd = 200;
      for (const p of w.livingPlayers()) {
        if (p === src) continue;
        const d = dist(p.x, p.y, ctx.aimX, ctx.aimY);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      if (best) {
        src.pl.link = { otherId: best.id, until: now + e.durationS * u, split: e.splitPct };
        best.pl!.link = { otherId: src.id, until: now + e.durationS * u, split: e.splitPct };
      } else w.emit({ t: 'msg', text: 'No ally under the cursor.', forPlayer: src.pl.playerId });
      break;
    }
    case 'cleanse':
      for (const t of targets(w, e, ctx, src)) cleanse(t, e.what);
      w.fx('heal', ctx.x, ctx.y);
      break;
    case 'reviveValue': {
      if (!src) break;
      let did = false;
      for (const g of w.players) {
        if (g === src || !g.pl!.downed) continue;
        if (dist(g.x, g.y, ctx.aimX, ctx.aimY) > 140 && dist(g.x, g.y, src.x, src.y) > 120) continue;
        const lantern = src.pl?.derived.rings.has('ghost_lantern');
        // Last Rites: 3.0, or 6.0 with a Ghost Lantern (addRevive doubles with the lantern)
        addRevive(w, g, src, (lantern && e.lanternAmount ? e.lanternAmount / 2 : e.amount) * u);
        did = true;
        break;
      }
      if (!did && e.livingHealPct) {
        const ally = targets(w, { op: 'heal', pct: 0, target: 'ally' }, ctx, src)[0];
        if (ally?.hp) heal(w, ally, ally.hp.max * e.livingHealPct * (spell ? ctx.powerMult : 1));
      }
      break;
    }
    case 'stagger':
      for (const t of targets(w, { ...e, target: e.target ?? 'enemies' }, ctx, src)) {
        if (t.en?.isBoss) {
          if (t.hp) t.hp.poise -= 40 * (e.bossPoiseMult ?? 1);
          continue;
        }
        interrupt(w, t, e.durationS);
      }
      break;
    case 'resetCooldown':
      if (src?.pl) {
        const fr = e.fraction ?? 1;
        if (e.skill === 'all') src.pl.skillReadyAt = src.pl.skillReadyAt.map((t) => now + (t - now) * (1 - fr)) as [number, number, number];
        else {
          const idx = e.skill === 'this' ? Number(ctx.tag.split(':')[1] ?? -1) : src.pl.derived.weapon.skills.indexOf(e.skill);
          if (idx >= 0 && idx < 3) src.pl.skillReadyAt[idx] = now + (src.pl.skillReadyAt[idx]! - now) * (1 - fr);
        }
      }
      break;
    case 'resource':
      for (const t of targets(w, { ...e, target: e.target ?? 'self' }, ctx, src)) {
        if (e.stamina && t.stam) t.stam.cur = Math.min(t.stam.max, t.stam.cur + e.stamina);
        if (e.hp && t.hp) heal(w, t, e.hp);
        if (t.pl) {
          if (e.shards) {
            const k = Math.max(1, w.zone + w.cycle);
            t.pl.char.shards += Math.round(e.shards * k);
            t.pl.shardsGained += Math.round(e.shards * k);
            w.emit({ t: 'shardGain', playerId: t.pl.playerId, amount: e.shards * k, x: t.x, y: t.y });
          }
          if (e.glowen) t.pl.char.glowen += Math.round(e.glowen * Math.max(1, w.zone));
          // e.flask is deliberately ignored: nothing restores a Thermos charge (D38, tested)
        }
        if (e.staminaRegenPct && e.durationS) addBuff(t, w, { id: 'resource_regen', stat: 'staminaRegenPct', amount: e.staminaRegenPct, durationS: e.durationS, maxStacks: 1, sourceId: ctx.sourceId });
      }
      break;
    case 'hyperArmor':
      if (src) addBuff(src, w, { id: `hyper:${ctx.tag}`, stat: 'poiseThreshold', amount: 0, durationS: e.durationS * u, maxStacks: 1, sourceId: src.id });
      break;
    case 'reveal':
      for (const t of enemiesOf(w, ctx.team)) if (t.en && dist(t.x, t.y, ctx.x, ctx.y) <= e.r + 300) t.en.revealedUntil = now + e.durationS * u;
      break;
    case 'hazard': {
      const specs = resolvePattern(e.pattern, patternCtxFor(w, ctx, src));
      for (const s of specs) spawnHazard(w, e.hazard, s.shapes, e.durationS, ctx.team, ctx.sourceId);
      break;
    }
    case 'onKill':
    case 'onHit':
    case 'onBlock':
    case 'onParry':
    case 'onDodge':
    case 'everyNthHit':
      // registered triggers are handled by the legendary power hooks (game/items/powers.ts)
      break;
    case 'sequence':
      for (const s of e.steps) w.schedule(s.delayS, () => runEffects(w, [s.effect], src ? { ...ctx, x: src.x, y: src.y } : ctx));
      break;
    case 'repeat':
      for (let i = 0; i < e.count; i++) {
        w.schedule(i * e.intervalS, () => {
          const s2 = w.get(ctx.sourceId);
          let c2 = s2 ? { ...ctx, x: s2.x, y: s2.y } : ctx;
          if (e.reaim && s2) {
            const t = w.get(ctx.targetId) ?? (s2.pl ? null : nearestEnemy(w, s2, ctx.team, 2000));
            if (t) c2 = { ...c2, aimX: t.x, aimY: t.y };
            else if (s2.pl) c2 = { ...c2, aimX: s2.pl.aimX, aimY: s2.pl.aimY };
          }
          runEffects(w, [e.effect], c2);
        });
      }
      break;
    case 'invuln':
      if (src?.hp) {
        src.hp.invulnUntil = now + e.durationS;
        if (src.en) src.en.fadeUntil = now + e.durationS;
      }
      break;
    case 'charge':
      if (src?.pl) {
        src.pl.charge = { t: 0, maxS: e.maxS, minMult: e.minMult, maxMult: e.maxMult, release: e.release, hyperArmor: !!e.hyperArmor, source: ctx.isSpell ? 'spell' : 'skill' };
        src.pl.state = 'charge';
      }
      break;
    case 'taunt':
      for (const t of enemiesOf(w, ctx.team)) {
        if (!t.en || dist(t.x, t.y, ctx.x, ctx.y) > e.r) continue;
        t.en.tauntedBy = ctx.sourceId;
        t.en.tauntUntil = now + (t.en.isBoss ? Math.min(2, e.durationS) : e.durationS);
      }
      break;
    case 'split': {
      const def = ENEMIES[e.enemyId];
      if (!def) break;
      for (let i = 0; i < e.count; i++) {
        const [x, y] = placeNear(w, ctx.x, ctx.y, 40, def.radius);
        const s = effectHooks.spawnSummon?.(w, src ?? w.get(0)!, def, x, y);
        if (s && s.hp) {
          s.hp.max *= e.hpMult;
          s.hp.hp = s.hp.max;
          s.en!.dmgMult *= e.dmgMult;
          s.en!.splitDone = true;
          s.en!.spawnUntil = now + 0.15;
        }
      }
      break;
    }
    case 'resurrect': {
      if (!src?.en) break;
      if (src.en.reviveCount >= e.max || w.fallen.length === 0) break;
      const start = now;
      src.en.state = 'channel';
      w.schedule(e.channelS, () => {
        if (!src.en || src.hp?.dead || src.hp!.staggerUntil > start || src.en.stunUntil > start) {
          if (src.en) src.en.state = 'alert';
          return;
        }
        src.en.state = 'alert';
        const f = w.fallen.shift();
        if (!f) return;
        const def = ENEMIES[f.defId];
        if (!def) return;
        src.en.reviveCount++;
        const s = effectHooks.spawnSummon?.(w, src, def, f.x, f.y);
        if (s?.hp) s.hp.hp = s.hp.max * e.hpPct;
      });
      break;
    }
    case 'mirror': {
      if (!src?.en) break;
      for (let i = 0; i < e.count; i++) {
        const [x, y] = placeNear(w, src.x, src.y, 160, src.radius);
        const s = effectHooks.spawnSummon?.(w, src, src.en.def as EnemyDef, x, y, e.durationS);
        if (s?.en && s.hp) {
          s.en.isIllusion = true;
          s.hp.hp = 1;
          s.hp.max = 1;
          s.en.dmgMult = 0;
          s.en.noDrop = true;
          s.en.shards = 0;
        }
      }
      // the original jumps too, so the player has to guess
      runOne(w, { op: 'teleport', distance: 180, toward: 'random' }, ctx);
      break;
    }
    case 'roomMod': {
      const m = w.roomMods;
      if (e.mod === 'flood') {
        m.floodUntil = now + e.durationS;
        m.lightningBonusUntil = now + e.durationS;
      } else if (e.mod === 'enrage') m.enrageUntil = now + e.durationS;
      else if (e.mod === 'lateFee') m.lateFeeUntil = now + e.durationS;
      else if (e.mod === 'lightning') m.lightningBonusUntil = now + e.durationS;
      w.emit({ t: 'msg', text: e.mod === 'flood' ? 'The water rises!' : e.mod === 'enrage' ? 'The enemies are enraged!' : e.mod === 'lateFee' ? 'A late fee has been applied.' : '', color: '#ff9b6a' });
      break;
    }
    case 'pulseHazards': {
      // handled at telegraph time by the attack system; at impact this does nothing extra
      break;
    }
    case 'scatter': {
      if (!src?.en) break;
      for (const o of w.enemies) {
        if (o === src || o.hp?.dead || o.en!.groupId !== src.en.groupId || !src.en.groupId) continue;
        const a = Math.atan2(o.y - src.y, o.x - src.x) + w.combat.spread(0.6);
        o.forced = { vx: Math.cos(a) * e.distance * 4, vy: Math.sin(a) * e.distance * 4, until: now + 0.25, kind: 'dash' };
      }
      break;
    }
    case 'eliteSummon':
      break;
    case 'die':
      if (src?.hp && !src.hp.dead) {
        if (src.en && e.quiet) src.en.quietDeath = true;
        src.hp.hp = 0;
        checkDeath(w, src, 0);
      }
      break;
    case 'collapseFloor':
      // the floor inside the pattern falls away into the void for a while (The Landlord's Collapse)
      collapseFloor(w, e.pattern, e.durationS, patternCtxFor(w, ctx, src));
      break;
    case 'steal': {
      // Pickpocket: take a share of the victim's Shards; killing the thief gives them back
      const victim = w.get(ctx.targetId);
      if (!src?.en || !victim?.pl) break;
      const amount = Math.floor(victim.pl.char.shards * e.pct);
      if (amount <= 0) break;
      victim.pl.char.shards -= amount;
      src.en.stolen += amount;
      src.en.stolenFrom = victim.pl.playerId;
      w.emit({ t: 'msg', text: `-${amount} Shards (pickpocketed!)`, forPlayer: victim.pl.playerId, color: '#ff9b2e' });
      break;
    }
  }
}

function nearestEnemy(w: World, src: Entity, team: Team, r: number): Entity | null {
  let best: Entity | null = null;
  let bd = r;
  for (const t of enemiesOf(w, team)) {
    const d = dist(t.x, t.y, src.x, src.y);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

export function applyControlTo(w: World, t: Entity, id: 'freeze' | 'root', s: number): void {
  applyControl(w, t, id, s);
}

export { buffSum };
export type { PatternDef };
