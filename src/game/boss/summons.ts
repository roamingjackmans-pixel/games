// Boss phase summons (DATA_MODEL BossPhase.summons): spawned when the phase starts, and topped back up to
// `max` every `everyS` seconds while the phase lasts (The Landlord's Hollow Joes, a second body…).
import { ENEMIES } from '../../data/enemies';
import { spawnEnemy } from '../enemies/spawn';
import type { BossDef, SummonDef } from '../types';
import type { Entity, World } from '../world';

function alive(w: World, boss: Entity, id: string): number {
  return w.enemies.filter((x) => !x.hp?.dead && x.en?.summonerId === boss.id && x.en.def.id === id).length;
}

function spawnSome(w: World, boss: Entity, s: SummonDef, n: number): void {
  const def = ENEMIES[s.enemyId];
  if (!def) return;
  for (let i = 0; i < n; i++) {
    const a = w.combat.range(-Math.PI, Math.PI);
    const [x, y] = w.room.nearestFloor(boss.x + Math.cos(a) * (boss.radius + 80), boss.y + Math.sin(a) * (boss.radius + 80), def.radius);
    const e = spawnEnemy(w, def, x, y, { tellS: 1.0, zone: boss.en!.zone, noDrop: true });
    e.en!.summonerId = boss.id;
    e.en!.shards = 0;
  }
  w.refreshLists();
}

function phaseSummons(boss: Entity): SummonDef[] {
  const def = boss.en!.def as unknown as BossDef;
  return def.phases[boss.en!.phase]?.summons ?? [];
}

/** Called when a phase starts. */
export function startPhaseSummons(w: World, boss: Entity): void {
  for (const s of phaseSummons(boss)) {
    spawnSome(w, boss, s, Math.max(0, Math.min(s.count, s.max - alive(w, boss, s.enemyId))));
    boss.en!.extrasUsed[`__summon:${s.enemyId}`] = w.time;
  }
}

/** Called every tick while the boss lives. */
export function tickPhaseSummons(w: World, boss: Entity): void {
  if (boss.hp?.dead || boss.en!.phaseTransitionUntil > w.time || boss.en!.state === 'spawning') return;
  for (const s of phaseSummons(boss)) {
    if (!s.everyS) continue;
    const key = `__summon:${s.enemyId}`;
    const last = boss.en!.extrasUsed[key] ?? boss.en!.spawnedAt;
    if (w.time - last < s.everyS) continue;
    boss.en!.extrasUsed[key] = w.time;
    spawnSome(w, boss, s, Math.max(0, Math.min(s.count, s.max - alive(w, boss, s.enemyId))));
  }
}
