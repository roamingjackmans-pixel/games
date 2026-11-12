// Boss phase summons (DATA_MODEL BossPhase.summons): spawned when the phase starts, and topped back up to
// `max` every `everyS` seconds while the phase lasts (The Landlord's Hollow Joes, a second body…).
import { ENEMIES } from '../../data/enemies';
import { dist } from '../../engine/math';
import { ROOM_CORNERS } from '../combat/patterns';
import { PHASE_TRANSITION_S } from '../combat/bossPhase';
import { spawnEnemy } from '../enemies/spawn';
import { applyArenaChanges } from './arena';
import type { BossDef, SummonDef } from '../types';
import type { Entity, World } from '../world';

function alive(w: World, boss: Entity, id: string): number {
  return w.enemies.filter((x) => !x.hp?.dead && x.en?.summonerId === boss.id && x.en.def.id === id).length;
}

/** A room corner (the 'corner' anchor points) that has none of this summon standing in it. */
function freeCorner(w: World, boss: Entity, id: string): [number, number] | null {
  for (const [cx, cy] of ROOM_CORNERS) {
    if (!w.enemies.some((x) => !x.hp?.dead && x.en?.summonerId === boss.id && x.en.def.id === id && dist(x.x, x.y, cx, cy) < 48)) return [cx, cy];
  }
  return null;
}

function spawnSome(w: World, boss: Entity, s: SummonDef, n: number): void {
  const def = ENEMIES[s.enemyId];
  if (!def) return;
  for (let i = 0; i < n; i++) {
    if (s.at === 'corners') {
      // corner parts stand exactly on the corner anchor points (where corner sweeps start)
      const c = freeCorner(w, boss, s.enemyId);
      if (!c) break;
      const ce = spawnEnemy(w, def, c[0], c[1], { tellS: 1.0, zone: boss.en!.bonusZone ?? boss.en!.zone, noDrop: true });
      ce.en!.summonerId = boss.id;
      ce.en!.shards = 0;
      continue;
    }
    const a = w.combat.range(-Math.PI, Math.PI);
    const [x, y] = w.room.nearestFloor(boss.x + Math.cos(a) * (boss.radius + 80), boss.y + Math.sin(a) * (boss.radius + 80), def.radius);
    const e = spawnEnemy(w, def, x, y, { tellS: 1.0, zone: boss.en!.bonusZone ?? boss.en!.zone, noDrop: true });
    e.en!.summonerId = boss.id;
    e.en!.shards = 0;
  }
  w.refreshLists();
}

function phaseSummons(boss: Entity): SummonDef[] {
  const def = boss.en!.def as unknown as BossDef;
  // the NG+ random encounter (D278) leaves its arena's summons behind unless its data says otherwise (D364)
  if (boss.en!.bonusBoss && !def.bonusSummons) return [];
  return def.phases[boss.en!.phase]?.summons ?? [];
}

/** Called when a phase starts. */
export function startPhaseSummons(w: World, boss: Entity): void {
  if (boss.en!.bonusBoss && !(boss.en!.def as unknown as BossDef).bonusSummons) return;
  for (const s of phaseSummons(boss)) {
    spawnSome(w, boss, s, Math.max(0, Math.min(s.count, s.max - alive(w, boss, s.enemyId))));
    boss.en!.extrasUsed[`__summon:${s.enemyId}`] = w.time;
  }
  const split = (boss.en!.def as unknown as BossDef).phases[boss.en!.phase]?.passive?.splitBody;
  if (split) spawnSplitBody(w, boss, split);
}

/**
 * Two targets, one bar (BossPhase.passive.splitBody): a second body, linked both ways through EnemyC.linkedTo.
 * Damage to it lands on the boss's pool (combat/damage.ts), it fights with the phase's `body: 'split'` attacks
 * at the boss's hit and pace, and it goes when the boss goes.
 */
function spawnSplitBody(w: World, boss: Entity, id: string): void {
  const def = ENEMIES[id];
  const en0 = boss.en!;
  const ph = (en0.def as unknown as BossDef).phases[en0.phase];
  if (!def || !ph) return;
  if (w.enemies.some((x) => !x.hp?.dead && !x.en?.isBoss && x.en?.linkedTo === boss.id)) return;
  // thrown clear of the boss, a little behind it
  const a = boss.facing + Math.PI + w.combat.spread(0.9);
  const [x, y] = w.room.nearestFloor(boss.x + Math.cos(a) * (boss.radius + 60), boss.y + Math.sin(a) * (boss.radius + 60), def.radius);
  // same resistances and immunities as the boss: it is the same health bar
  const e = spawnEnemy(w, def, x, y, { tellS: 0.8, zone: en0.zone, noDrop: true, zoneResist: en0.def.resist, zoneImmune: [...(boss.st?.immune ?? [])], facing: boss.facing });
  const en = e.en!;
  en.summonerId = boss.id;
  en.shards = 0;
  en.linkedTo = boss.id;
  en0.linkedTo = e.id;
  en.dmgMult = en0.dmgMult * ph.dmgMult;
  en.speed *= ph.speedMult;
  en.baseSpeed = en.speed;
  const mine = ph.attacks.filter((atk) => atk.body === 'split');
  if (mine.length) en.phaseAttacks = mine;
  // its first attacks wait for the transition, then come one at a time
  en.phaseAttacks.forEach((atk, i) => {
    en.cooldowns[atk.id] = w.time + PHASE_TRANSITION_S + 0.8 + i * 0.9;
  });
  w.fx('burst', x, y, { color: (en0.def.palette ?? [])[1] ?? '#ffcf6a', n: 24, r: 40 });
  w.refreshLists();
}

/** The boss's intro is over: phase 1's own arena changes and summons (later phases start from onBossPhase). */
export function beginBossFight(w: World, boss: Entity): void {
  boss.en!.extrasUsed.__fightBegun = w.time;
  const ph = (boss.en!.def as unknown as BossDef).phases[0];
  if (ph?.arena?.length) applyArenaChanges(w, ph.arena, boss);
  startPhaseSummons(w, boss);
}

/** Called every tick while the boss lives. */
export function tickPhaseSummons(w: World, boss: Entity): void {
  if (boss.hp?.dead || boss.en!.phaseTransitionUntil > w.time || boss.en!.state === 'spawning') return;
  if (boss.en!.phase === 0 && boss.en!.extrasUsed.__fightBegun === undefined) beginBossFight(w, boss);
  for (const s of phaseSummons(boss)) {
    if (!s.everyS) continue;
    const key = `__summon:${s.enemyId}`;
    const last = boss.en!.extrasUsed[key] ?? boss.en!.spawnedAt;
    if (w.time - last < s.everyS) continue;
    boss.en!.extrasUsed[key] = w.time;
    spawnSome(w, boss, s, Math.max(0, Math.min(s.count, s.max - alive(w, boss, s.enemyId))));
  }
}
