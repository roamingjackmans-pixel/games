// Connects modules that would otherwise import each other in a cycle (effects ↔ player ↔ enemies).
import { effectHooks } from './effects/run';
import { spawnPlayerProjectile, weaponSpec } from './player/player';
import { spawnEnemy } from './enemies/spawn';

effectHooks.weaponSpec = (w, p, mult, opts) => weaponSpec(w, p, mult, opts);
effectHooks.spawnPlayerProjectile = (w, p, a, speed, r, spec, pierce, drawId, o) => spawnPlayerProjectile(w, p, a, speed, r, spec, pierce, drawId, o);
effectHooks.spawnSummon = (w, source, def, x, y, lifetimeS) =>
  spawnEnemy(w, def, x, y, {
    tellS: 0.6,
    noDrop: true,
    summonerId: source?.id ?? 0,
    ...(lifetimeS ? { lifeS: lifetimeS } : {}),
    zone: source?.en?.zone ?? w.zone,
  });

export const WIRED = true;
