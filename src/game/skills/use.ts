// Weapon skills (Q/E/R), spells (1/2/3) and consumables (G) — GAME_DESIGN §5.8, §8.3, §10.
import { CONSUMABLES } from '../../data/consumables';
import { SKILLS } from '../../data/skills';
import { SPELLS } from '../../data/spells';
import { runEffects } from '../effects/run';
import { itemLevelFor, scalingCurve } from '../combat/formulas';
import { buffSum } from '../combat/state';
import { dist } from '../../engine/math';
import type { EffectDef, SkillDef, SpellDef } from '../types';
import type { Entity, World } from '../world';

const SKILL_RECOVER_S = 0.2;

export function attackSpeedFor(w: World, e: Entity): number {
  const pl = e.pl!;
  let s = pl.derived.attackSpeed * (1 + buffSum(e, 'attackSpeedPct', w.time));
  if (e.st && e.st.active.chill > w.time) s *= 0.7;
  return Math.max(0.3, Math.min(1.6, s));
}

/** Cooldown reduction from gems, affixes and buffs, capped at 50% (CONTENT_ITEMS §1). */
export function cooldownReduction(w: World, e: Entity): number {
  return Math.min(0.5, e.pl!.derived.cdr - buffSum(e, 'cooldownPct', w.time));
}

export function castSpeedFor(w: World, e: Entity): number {
  return Math.min(1.6, e.pl!.derived.castSpeed * (1 + buffSum(e, 'castSpeedPct', w.time)));
}

export function skillOf(e: Entity, i: number): SkillDef | null {
  return SKILLS[e.pl!.derived.weapon.skills[i] ?? ''] ?? null;
}

export function spellOf(e: Entity, i: number): SpellDef | null {
  const pl = e.pl!;
  const school = pl.derived.offKind === 'staff' ? 'brain' : pl.derived.offKind === 'talisman' ? 'prayer' : null;
  if (!school) return null;
  const id = pl.char.spellLoadout[school][i];
  return id ? (SPELLS[id] ?? null) : null;
}

/** The power multiplier of a spell for this caster: Brain/Prayer curve × casting tool (GAME_DESIGN §3.1). */
export function spellPowerMult(e: Entity, sp: SpellDef): number {
  const d = e.pl!.derived;
  const stat = sp.school === 'brain' ? d.stats.brain : d.stats.prayer;
  const curve = sp.school === 'brain' ? 1 + 1.2 * scalingCurve(stat) : 1 + 1.0 * scalingCurve(stat);
  let m = curve * Math.max(0.5, d.toolMult);
  if (d.tool?.bonus?.heals && sp.effect.some((x) => x.op === 'heal')) m *= 1 + d.tool.bonus.pct;
  return m;
}

function nearestEnemyTo(w: World, x: number, y: number, r: number): number {
  let best = 0;
  let bd = r;
  for (const en of w.livingEnemies()) {
    const d = dist(en.x, en.y, x, y);
    if (d < bd) {
      bd = d;
      best = en.id;
    }
  }
  return best;
}

function msg(w: World, e: Entity, text: string): void {
  w.emit({ t: 'msg', text, forPlayer: e.pl!.playerId, color: '#ff9b6a' });
}

function spend(w: World, e: Entity, amount: number): void {
  const pl = e.pl!;
  e.stam!.cur = Math.max(0, e.stam!.cur - amount * pl.derived.stamCost * Math.max(0.2, 1 + buffSum(e, 'staminaCostPct', w.time)));
  pl.stamDelayUntil = w.time + 0.6;
}

export function tryUseSkill(w: World, e: Entity, i: number): boolean {
  const pl = e.pl!;
  const d = pl.derived;
  const s = skillOf(e, i);
  const now = w.time;
  if (!s) return false;
  if (i >= d.skillsUnlocked) {
    msg(w, e, d.weaponMeetsReq ? `${s.name} is locked (better item tier needed).` : 'Skills are locked: weapon below requirement.');
    return false;
  }
  if (pl.skillReadyAt[i]! > now) return false;
  if (e.stam!.cur <= 0) return false;
  spend(w, e, s.stamina);
  pl.skillReadyAt[i] = now + s.cooldownS * (1 - cooldownReduction(w, e));
  let ax = pl.aimX;
  let ay = pl.aimY;
  if (s.range) {
    const a = Math.atan2(ay - e.y, ax - e.x);
    const dd = Math.min(s.range, dist(e.x, e.y, ax, ay));
    ax = e.x + Math.cos(a) * dd;
    ay = e.y + Math.sin(a) * dd;
  }
  e.facing = Math.atan2(ay - e.y, ax - e.x);
  pl.combo = null;
  pl.blocking = false;
  pl.state = 'skill';
  pl.action = {
    kind: 'skill',
    index: i,
    id: s.id,
    t: 0,
    castS: (s.castMs ?? 80) / 1000 / attackSpeedFor(w, e),
    fired: false,
    effects: s.effect,
    aimX: ax,
    aimY: ay,
    powerMult: 1,
    hyperArmor: !!s.castHyperArmor,
  };
  e.anim.pose = 'windup';
  e.anim.poseT = 0;
  return true;
}

export function tryCastSpell(w: World, e: Entity, i: number): boolean {
  const pl = e.pl!;
  const d = pl.derived;
  const now = w.time;
  if (d.offKind !== 'staff' && d.offKind !== 'talisman') {
    msg(w, e, pl.char.twoHanded ? 'Two-handing: no casting.' : 'Spells need a staff or talisman in your off hand.');
    return false;
  }
  if (!d.toolMeetsReq) {
    msg(w, e, 'Your casting tool is beyond your stats: it cannot cast.');
    return false;
  }
  const sp = spellOf(e, i);
  if (!sp) {
    msg(w, e, 'No spell in that slot (inventory → Spells).');
    return false;
  }
  const stat = sp.school === 'brain' ? d.stats.brain : d.stats.prayer;
  if (stat < sp.req) {
    msg(w, e, `${sp.name} needs ${sp.school === 'brain' ? 'Brain' : 'Prayer'} ${sp.req}.`);
    return false;
  }
  if (pl.spellReadyAt[i]! > now) return false;
  const boost = pl.nextSpellFree && pl.nextSpellFree.until > now && pl.nextSpellFree.count > 0 ? pl.nextSpellFree : null;
  const free = !!boost?.noStamina || (d.powers.has('font') && e.hp!.hp > e.hp!.max * 0.8) || (d.powers.has('spellsword') && now - pl.lastLightAttackAt < 2);
  if (!free) {
    if (e.stam!.cur <= 0) return false;
    spend(w, e, sp.stamina);
  }
  let power = spellPowerMult(e, sp);
  let cooldown = sp.cooldownS;
  if (boost) {
    power *= 1 + boost.powerPct;
    if (boost.noCooldown) cooldown = 0.2;
    boost.count--;
    if (boost.count <= 0) pl.nextSpellFree = null;
  }
  pl.spellReadyAt[i] = now + cooldown;
  pl.combo = null;
  pl.blocking = false;
  pl.state = 'cast';
  e.facing = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
  pl.action = {
    kind: 'spell',
    index: i,
    id: sp.id,
    t: 0,
    castS: sp.castS / castSpeedFor(w, e),
    fired: false,
    effects: sp.effect,
    aimX: pl.aimX,
    aimY: pl.aimY,
    powerMult: power,
    hyperArmor: false,
  };
  e.anim.pose = 'cast';
  return true;
}

function fire(w: World, e: Entity): void {
  const pl = e.pl!;
  const a = pl.action!;
  const isSpell = a.kind === 'spell';
  const sp = isSpell ? SPELLS[a.id] : null;
  // spells aimed at the cursor use the current aim at release; skills keep their locked aim
  const aimX = isSpell ? pl.aimX : a.aimX;
  const aimY = isSpell ? pl.aimY : a.aimY;
  const ctx = {
    sourceId: e.id,
    team: 0 as const,
    x: e.x,
    y: e.y,
    aimX,
    aimY,
    targetId: nearestEnemyTo(w, aimX, aimY, 200),
    powerMult: a.powerMult,
    isSpell,
    isSkill: !isSpell,
    baseDamage: pl.derived.weaponPower,
    windupS: 0,
    tag: `${isSpell ? 'spell' : 'skill'}:${a.index}`,
  };
  runEffects(w, a.effects, ctx);
  if (isSpell) {
    w.sfx(sp?.school === 'brain' ? 'castBrain' : 'castPrayer', e.x);
    w.fx('status', e.x, e.y - 10, { color: sp?.school === 'brain' ? '#8fd3ff' : '#fff3b0', n: 10 });
    // Echo: 10% to repeat the cast 0.4 s later for free
    if (pl.derived.powers.has('echo') && w.combat.chance(0.1)) w.schedule(0.4, () => runEffects(w, a.effects, { ...ctx, x: e.x, y: e.y }));
  } else w.sfx('swingHeavy', e.x, 0.8);
  e.anim.pose = 'swing';
  e.anim.poseT = 0;
}

export function updatePlayerAction(w: World, e: Entity, dt: number): void {
  const pl = e.pl!;
  const now = w.time;
  if (pl.state === 'consumable' && now >= pl.stateUntil) pl.state = 'idle';
  const a = pl.action;
  if (a) {
    a.t += dt;
    if (a.kind === 'spell') e.facing = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
    if (!a.fired && a.t >= a.castS) {
      a.fired = true;
      fire(w, e);
    }
    if (a.fired && a.t >= a.castS + SKILL_RECOVER_S) {
      pl.action = null;
      if (pl.state === 'skill' || pl.state === 'cast') pl.state = pl.channel ? 'channel' : pl.charge ? 'charge' : 'idle';
    }
  }
  const ch = pl.channel;
  if (ch) {
    if (now >= ch.until) {
      pl.channel = null;
      if (pl.state === 'channel') pl.state = 'idle';
    } else if (now >= ch.nextTick) {
      ch.nextTick = now + ch.tickS;
      if (ch.followAim) e.facing = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
      runEffects(w, ch.tick, {
        sourceId: e.id,
        team: 0,
        x: e.x,
        y: e.y,
        aimX: pl.aimX,
        aimY: pl.aimY,
        targetId: 0,
        powerMult: ch.powerMult,
        isSpell: ch.source === 'spell',
        isSkill: ch.source === 'skill',
        baseDamage: pl.derived.weaponPower,
        windupS: 0,
        tag: `channel:${ch.source}`,
      });
      if (ch.source === 'skill') w.sfx('swingLight', e.x, 0.5);
    }
  }
  const cg = pl.charge;
  if (cg) {
    cg.t += dt;
    e.facing = Math.atan2(pl.aimY - e.y, pl.aimX - e.x);
    const keys = [1 << 3, 1 << 4, 1 << 5];
    const heldAny = keys.some((k) => (pl.input.buttons & k) !== 0);
    if (!heldAny || cg.t >= cg.maxS) {
      const k = Math.min(1, cg.t / cg.maxS);
      const m = cg.minMult + (cg.maxMult - cg.minMult) * k;
      const rel = cg.release as EffectDef;
      const scaled: EffectDef = rel.op === 'damage' ? { ...rel, mult: (rel.mult ?? 1) * m } : rel;
      runEffects(w, [scaled], {
        sourceId: e.id,
        team: 0,
        x: e.x,
        y: e.y,
        aimX: pl.aimX,
        aimY: pl.aimY,
        targetId: 0,
        powerMult: 1,
        isSpell: cg.source === 'spell',
        isSkill: true,
        baseDamage: pl.derived.weaponPower,
        windupS: 0,
        tag: 'charge',
      });
      w.sfx('swingHeavy', e.x);
      w.emit({ t: 'shake', amount: 3 + k * 6 });
      pl.charge = null;
      if (pl.state === 'charge') pl.state = 'idle';
    }
  }
}

/** Use the item in the quick-use slot: thrown items go to the cursor; damage scales with item level. */
export function tryUseConsumable(w: World, e: Entity): boolean {
  const pl = e.pl!;
  const c = pl.char;
  const id = c.quickSlot;
  if (!id || (c.consumables[id] ?? 0) <= 0) {
    w.emit({ t: 'msg', text: 'Nothing in the quick-use slot.', forPlayer: pl.playerId });
    return false;
  }
  const def = CONSUMABLES[id];
  c.consumables[id] = (c.consumables[id] ?? 0) - 1;
  const ilvl = itemLevelFor(w.zone, w.cycle);
  pl.state = 'consumable';
  pl.stateUntil = w.time + 0.3;
  runEffects(w, def.effect, {
    sourceId: e.id,
    team: 0,
    x: e.x,
    y: e.y,
    aimX: pl.aimX,
    aimY: pl.aimY,
    targetId: nearestEnemyTo(w, pl.aimX, pl.aimY, 200),
    powerMult: 1 + 0.45 * (ilvl - 1),
    isSpell: false,
    isSkill: false,
    baseDamage: 20,
    windupS: 0,
    tag: `consumable:${id}`,
  });
  w.sfx(def.thrown ? 'swingLight' : 'heal', e.x, 0.7);
  if ((c.consumables[id] ?? 0) <= 0) {
    const next = (Object.keys(c.consumables) as (keyof typeof c.consumables)[]).find((k) => (c.consumables[k] ?? 0) > 0) ?? null;
    c.quickSlot = next;
  }
  return true;
}
