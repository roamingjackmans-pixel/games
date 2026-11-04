// Default world rules: what happens when enemies die (on-death effects, splits, Shards, drops),
// elite summons, on-hit enemy effects, and player down/death routing. Scenes extend these hooks.
import { runEffects } from './effects/run';
import { emptySpec, hitPlayer } from './combat/damage';
import { addBuff } from './combat/state';
import { spawnEnemy } from './enemies/spawn';
import { attackDamage } from './enemies/spawn';
import { ENEMIES } from '../data/enemies';
import type { EnemyDef } from './types';
import { PROF_CLASSES, killXp } from '../data/proficiency';
import { grantKillXp, upgradeInfo } from './items/proficiency';
import { refreshDerived } from './player/player';
import { endDevour } from './interact';
import type { Entity, World } from './world';

export interface RulesOpts {
  /** drop loot for each player (instanced, D33) */
  onDrops?(w: World, e: Entity, killerId: number): void;
  /** a player reached 0 HP: solo death or co-op downed */
  onPlayerDown?(w: World, p: Entity): void;
  onKillStat?(w: World, e: Entity): void;
  /** the zone's fodder type for the Summoner elite affix */
  zoneFodder?(): EnemyDef | null;
}

/**
 * Weapon experience (D178): every standing player, whoever made the kill, gets it on what they have out (the weapon
 * hand's item and a held staff or talisman) and on those classes' proficiency. A new level refreshes their perks.
 */
export function grantWeaponXp(w: World, xp: number): void {
  for (const p of w.players) {
    const pl = p.pl!;
    if (pl.downed || pl.deadUntilRest || p.removed) continue;
    const res = grantKillXp(pl.char, xp);
    for (const it of res.filled) {
      const u = upgradeInfo(it);
      if (u) w.emit({ t: 'msg', text: `${it.name} is ready to become ${u.to[0]!.toUpperCase()}${u.to.slice(1)} (at a bonfire)`, forPlayer: pl.playerId, color: '#ffd27a' });
    }
    for (const l of res.levels) w.emit({ t: 'msg', text: `${PROF_CLASSES[l.cls]?.name ?? l.cls} proficiency ${l.level}`, forPlayer: pl.playerId, color: '#9ad0ff' });
    if (res.levels.length) refreshDerived(p);
  }
}

export function grantShards(w: World, amount: number, x: number, y: number): void {
  for (const p of w.players) {
    if (p.pl!.deadUntilRest) continue;
    const got = Math.round(amount * (1 + p.pl!.derived.shardFind));
    if (got <= 0) continue;
    p.pl!.char.shards += got;
    p.pl!.shardsGained += got;
    w.emit({ t: 'shardGain', playerId: p.pl!.playerId, amount: got, x, y });
  }
  w.sfx('shardPickup', x, 0.6);
}

export function installRules(w: World, o: RulesOpts = {}): void {
  w.hooks.onEnemyKilled = (w2, e, killerId) => {
    const en = e.en!;
    const def = en.def as EnemyDef;
    // a mimic killed while it eats someone lets them go (D179)
    if (en.devour) endDevour(w2, e, false);
    const ctx = {
      sourceId: e.id,
      team: 1 as const,
      x: e.x,
      y: e.y,
      aimX: e.x,
      aimY: e.y,
      targetId: en.targetId,
      powerMult: 1,
      isSpell: false,
      isSkill: false,
      baseDamage: attackDamage(e, 1),
      windupS: 0.9,
      tag: `death:${def.id}`,
    };
    if (!en.isIllusion) {
      if (def.onDeath && !en.quietDeath) runEffects(w2, def.onDeath, ctx);
      for (const a of en.phaseAttacks) {
        if (a.trigger !== 'onDeath') continue;
        if (a.effects) runEffects(w2, a.effects.filter((x) => x.op !== 'split' || !en.splitDone), { ...ctx, windupS: a.windupMs / 1000, baseDamage: attackDamage(e, a.dmgMult || 1) });
      }
      if (!en.elite && !en.isBoss && !en.summonerId && !def.special && !en.isIllusion) w2.fallen.push({ defId: def.id, x: e.x, y: e.y });
      if (en.shards > 0 && !def.traits?.noShards) grantShards(w2, en.shards, e.x, e.y);
      if (!def.traits?.scripted && !def.traits?.merchant) grantWeaponXp(w2, killXp({ isBoss: en.isBoss, elite: !!en.elite, role: def.role, mimic: !!def.traits?.mimic }));
      if (!en.noDrop) o.onDrops?.(w2, e, killerId);
      o.onKillStat?.(w2, e);
    }
    // a pickpocket gives the Shards back
    if (en.stolen > 0) {
      const victim = w2.players.find((p) => p.pl!.playerId === en.stolenFrom);
      if (victim) {
        victim.pl!.char.shards += en.stolen;
        w2.emit({ t: 'msg', text: `+${en.stolen} Shards recovered`, forPlayer: en.stolenFrom, color: '#9ad0ff' });
      }
      en.stolen = 0;
    }
    // detach leeches
    for (const p of w2.players) p.pl!.attached = p.pl!.attached.filter((id) => id !== e.id);
    // killer powers and kill-stacking buffs
    const killer = w2.get(killerId);
    if (killer?.pl) {
      const d = killer.pl.derived;
      if (d.powers.has('second_wind') && killer.stam) killer.stam.cur = Math.min(killer.stam.max, killer.stam.cur + 20);
      for (const b of killer.buffs ?? []) {
        if (b.stackOn !== 'kill' || b.until <= w2.time) continue;
        b.stacks = Math.min(b.maxStacks, b.stacks + 1);
        if (b.onStack) runEffects(w2, b.onStack, selfCtx(killer, 'stack'));
      }
      w2.hooks.onPlayerKill?.(w2, killer, e);
    }
  };
  w.hooks.onSpecKill = (w2, attacker, _victim, effects, tag) => runEffects(w2, effects, selfCtx(attacker, tag));
  w.hooks.onPlayerDowned = (w2, p) => {
    if (o.onPlayerDown) o.onPlayerDown(w2, p);
    else {
      p.hp!.hp = p.hp!.max;
    }
  };
  w.hooks.onEnemyHitEffects = (w2, attacker, victim, effects) => {
    runEffects(w2, effects, {
      sourceId: attacker.id,
      team: 1,
      x: victim.x,
      y: victim.y,
      aimX: victim.x,
      aimY: victim.y,
      targetId: victim.id,
      powerMult: 1,
      isSpell: false,
      isSkill: false,
      baseDamage: attacker.en ? attackDamage(attacker, 1) : 10,
      windupS: 0,
      tag: 'onhit',
    });
  };
  w.hooks.onEliteSummon = (w2, e) => {
    const def = o.zoneFodder?.() ?? null;
    if (!def) return;
    const alive = w2.enemies.filter((x) => !x.hp?.dead && x.en?.summonerId === e.id).length;
    for (let i = 0; i < Math.min(2, 4 - alive); i++) {
      const a = w2.combat.range(-Math.PI, Math.PI);
      const [x, y] = w2.room.nearestFloor(e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80, def.radius);
      spawnEnemy(w2, def, x, y, { tellS: 1.0, summonerId: e.id, noDrop: true });
    }
  };
  w.hooks.onEnemyHurt = (w2, e) => {
    // swarm Scatter-style triggers run from the AI (trigger: onHit) on the next tick
    const en = e.en!;
    for (const a of en.phaseAttacks) {
      if (a.trigger !== 'onHit' || !a.effects) continue;
      const used = en.extrasUsed[a.id] ?? -100;
      if (w2.time - used < a.cooldownS) continue;
      en.extrasUsed[a.id] = w2.time;
      runEffects(w2, a.effects, {
        sourceId: e.id,
        team: 1,
        x: e.x,
        y: e.y,
        aimX: e.x,
        aimY: e.y,
        targetId: en.targetId,
        powerMult: 1,
        isSpell: false,
        isSkill: false,
        baseDamage: attackDamage(e, 1),
        windupS: 0,
        tag: a.id,
      });
    }
  };
}

function selfCtx(p: Entity, tag: string): Parameters<typeof runEffects>[2] {
  return {
    sourceId: p.id,
    team: p.team === 0 ? 0 : 1,
    x: p.x,
    y: p.y,
    aimX: p.pl?.aimX ?? p.x,
    aimY: p.pl?.aimY ?? p.y,
    targetId: 0,
    powerMult: 1,
    isSpell: false,
    isSkill: true,
    baseDamage: p.pl?.derived.weaponPower ?? 0,
    windupS: 0,
    tag,
  };
}

/** A grab/slam or contact helper some data uses directly. */
export function slam(w: World, src: Entity, p: Entity, amount: number): void {
  const s = emptySpec('red');
  s.dmg.physical = amount;
  hitPlayer(w, src.id, p, s, src.x, src.y);
}

export { addBuff, ENEMIES };
