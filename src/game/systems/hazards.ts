// Floor hazards (fire puddles, poison clouds, thorns, ice, oil, slag, roots, time bubbles…) and their ticks.
import { shapeHit, type Shape } from '../combat/patterns';
import { applyControl, applyStatusBuild, emptySpec, hitAlly, hitEnemy, hitPlayer, rawDamage } from '../combat/damage';
import { runEffects } from '../effects/run';
import type { HazardId, Team } from '../types';
import type { DamageSpec, Entity, World } from '../world';

export interface HazardDef {
  /** damage per tick as a fraction of the zone fodder hit (18 × zone dmg mult); 0 = none */
  dmg: number;
  tickS: number;
  status?: { id: 'burn' | 'chill' | 'shock' | 'bleed' | 'poison'; buildup: number };
  slow?: number;
  slippery?: boolean;
  color: string;
  blocksEnemies?: boolean;
  blocksProjectiles?: boolean;
  /** solid while it lasts (root walls): bodies cannot walk through */
  blocksMove?: boolean;
  /** seconds before it can trigger (bear traps arm in 1 s) */
  armS?: number;
  /** a trap: the first body inside is caught (control + hit) and the hazard is used up */
  trap?: { control: { id: 'root'; durationS: number }; dmg: number };
  hitsTeam: 'enemies' | 'players' | 'both';
  /** standing inside clears this status (Mother Spore's glowing pools) */
  cures?: 'poison';
  /** wind: players inside are pushed away from the hazard's origin at this speed (px/s; dodging players are not) */
  push?: number;
}

export const HAZARDS: Record<HazardId, HazardDef> = {
  poisonCloud: { dmg: 0, tickS: 0.5, status: { id: 'poison', buildup: 15 }, color: '#7ad040', hitsTeam: 'players' },
  firePuddle: { dmg: 0.25, tickS: 0.5, status: { id: 'burn', buildup: 15 }, color: '#ff7a1a', hitsTeam: 'both' },
  acid: { dmg: 0.15, tickS: 0.5, status: { id: 'poison', buildup: 12 }, color: '#a6e040', hitsTeam: 'players' },
  thorns: { dmg: 0.3, tickS: 1.0, color: '#6a8a3a', hitsTeam: 'players' },
  ice: { dmg: 0, tickS: 0.5, slippery: true, color: '#cfeaff', hitsTeam: 'both' },
  oil: { dmg: 0, tickS: 0.5, slippery: true, color: '#3a3020', hitsTeam: 'both' },
  slag: { dmg: 0.3, tickS: 0.5, status: { id: 'burn', buildup: 10 }, color: '#ff5a1a', hitsTeam: 'players' },
  roots: { dmg: 0, tickS: 1, color: '#5a3a1a', blocksEnemies: true, blocksMove: true, hitsTeam: 'players' },
  water: { dmg: 0, tickS: 1, slow: 0.15, color: '#2a5a5a', hitsTeam: 'both' },
  lava: { dmg: 1.2, tickS: 0.5, status: { id: 'burn', buildup: 40 }, color: '#ff4a10', hitsTeam: 'players' },
  timeBubble: { dmg: 0, tickS: 0.25, slow: 0.4, color: '#b08de8', hitsTeam: 'players' },
  voidEdge: { dmg: 0, tickS: 1, color: '#7a2bd6', hitsTeam: 'players' },
  tendril: { dmg: 0.5, tickS: 0.6, slow: 0.4, color: '#c58cff', hitsTeam: 'players' },
  fireWall: { dmg: 0.5, tickS: 0.5, status: { id: 'burn', buildup: 40 }, color: '#ff6a1a', hitsTeam: 'players' },
  consecrate: { dmg: 0, tickS: 1, color: '#fff3b0', hitsTeam: 'both' },
  sanctuary: { dmg: 0, tickS: 1, color: '#fff3b0', hitsTeam: 'both' },
  voidRift: { dmg: 0, tickS: 0.5, slow: 0.2, color: '#9b5bff', hitsTeam: 'enemies' },
  regenAura: { dmg: 0, tickS: 1, color: '#7ad0a0', hitsTeam: 'players' },
  timeDilation: { dmg: 0, tickS: 0.25, slow: 0.4, color: '#b08de8', hitsTeam: 'enemies' },
  gravityWell: { dmg: 0, tickS: 0.1, color: '#6a3ab0', hitsTeam: 'enemies' },
  curePool: { dmg: 0, tickS: 1, slow: 0.3, cures: 'poison', color: '#7af0d0', hitsTeam: 'players' },
  emberMoss: { dmg: 0.15, tickS: 0.5, status: { id: 'burn', buildup: 10 }, color: '#ff8a2a', hitsTeam: 'players' },
  bearTrap: { dmg: 0, tickS: 0.1, color: '#8a8a8a', hitsTeam: 'both', armS: 1, trap: { control: { id: 'root', durationS: 1.5 }, dmg: 1.0 } },
  // Hex Gale: 0.375 fodder hits per 0.5 s = ×0.3 of a boss hit per second, pushing 150 px/s
  wind: { dmg: 0.375, tickS: 0.5, color: '#d8f0e0', hitsTeam: 'players', push: 150 },
};

export function spawnHazard(w: World, hazard: HazardId, shapes: Shape[], durationS: number, team: Team, ownerId: number, o: Partial<Entity['hz']> = {}): Entity {
  const def = HAZARDS[hazard];
  const s0 = shapes[0];
  const x = s0 && 'x' in s0 ? s0.x : 640;
  const y = s0 && 'y' in s0 ? s0.y : 360;
  let spec: DamageSpec | null = null;
  const owner = w.get(ownerId);
  if (def.dmg > 0 || def.status) {
    spec = emptySpec('normal');
    spec.parryable = false;
    const base = 18 * (1 + 0.35 * (w.zone - 1)) * Math.pow(1.35, w.cycle);
    const type = hazard === 'firePuddle' || hazard === 'slag' || hazard === 'lava' || hazard === 'fireWall' ? 'fire' : 'physical';
    spec.dmg[type] = base * def.dmg;
    if (owner?.pl) spec.dmg[type] = (owner.pl.derived.weaponPower || 20) * def.dmg;
    if (def.status) spec.status = [def.status];
  }
  return w.spawn('hazard', x, y, {
    team,
    hz: {
      hazard,
      shapes,
      until: w.time + durationS,
      team,
      tickS: def.tickS,
      nextTick: {},
      ownerId,
      spec,
      effects: [],
      slowPct: def.slow ?? 0,
      blocksProjectiles: !!def.blocksProjectiles,
      blocksEnemies: !!def.blocksEnemies,
      hp: 20,
      enemiesOnly: def.hitsTeam === 'enemies',
      alliesOnly: false,
      noStatusBuild: false,
      enemyDamagePct: 0,
      burst: null,
      follow: 0,
      pull: 0,
      armedAt: w.time,
      allyEffects: [],
      powerMult: 1,
      ...o,
    },
  });
}

/** Is a point inside any live hazard of this kind? */
export function inHazard(w: World, x: number, y: number, r: number, kinds: HazardId[]): Entity | null {
  for (const h of w.entities.values()) {
    if (h.type !== 'hazard' || h.removed || !h.hz || !kinds.includes(h.hz.hazard)) continue;
    for (const s of h.hz.shapes) if (shapeHit(s, 0, x, y, r, w.room)) return h;
  }
  return null;
}

export function updateHazards(w: World, _dt: number): void {
  const now = w.time;
  for (const h of w.entities.values()) {
    if (h.type !== 'hazard' || h.removed) continue;
    const hz = h.hz!;
    if (now >= hz.until) {
      if (hz.burst) {
        const owner = w.get(hz.ownerId);
        runEffects(w, [hz.burst], {
          sourceId: hz.ownerId,
          team: hz.team,
          x: h.x,
          y: h.y,
          aimX: h.x,
          aimY: h.y,
          targetId: 0,
          powerMult: 1,
          isSpell: true,
          isSkill: false,
          baseDamage: owner?.pl?.derived.weaponPower ?? 20,
          windupS: 0,
          tag: hz.hazard,
        });
      }
      w.remove(h);
      continue;
    }
    if (hz.follow) {
      const f = w.get(hz.follow);
      if (f) {
        h.x = f.x;
        h.y = f.y;
        for (const s of hz.shapes) if (s.k === 'circle') {
          s.x = f.x;
          s.y = f.y;
        }
      }
    }
    const def = HAZARDS[hz.hazard];
    if (def.armS && now < hz.armedAt + def.armS) continue;
    // who it touches
    const victims: Entity[] = [];
    const hitPlayers = !hz.enemiesOnly && (def.hitsTeam === 'players' || def.hitsTeam === 'both') && hz.team !== 0;
    const hitEnemies = !hz.alliesOnly && (def.hitsTeam === 'enemies' || def.hitsTeam === 'both' || hz.team === 0);
    if (hitPlayers || hz.alliesOnly || hz.team === 0) for (const p of w.livingPlayers()) victims.push(p);
    if (hitEnemies) for (const e of w.livingEnemies()) victims.push(e);
    for (const v of victims) {
      let inside = false;
      for (const s of hz.shapes) if (shapeHit(s, 0, v.x, v.y, v.radius * 0.6, w.room)) {
        inside = true;
        break;
      }
      if (!inside) continue;
      if (v.flying && !def.slow) continue;
      if (def.trap) {
        // caught: root + one hit, then the trap is spent (it catches enemies too)
        applyControl(w, v, def.trap.control.id, def.trap.control.durationS);
        if (v.en) v.en.rootUntil = Math.max(v.en.rootUntil, now + def.trap.control.durationS);
        const base = 18 * (1 + 0.35 * (w.zone - 1)) * Math.pow(1.35, w.cycle) * def.trap.dmg;
        rawDamage(w, v, v.pl ? base * (100 / (100 + v.pl.derived.defense.physical)) : base, 'physical', hz.ownerId);
        w.sfx('hitMetal', v.x);
        w.remove(h);
        break;
      }
      // slows apply continuously
      if (hz.slowPct > 0) {
        if (v.en && (hz.team === 0 || def.hitsTeam !== 'players')) {
          v.en.slowUntil = now + 0.15;
          v.en.slowMult = Math.min(v.en.slowMult < 1 && v.en.slowUntil > now ? v.en.slowMult : 1, 1 - hz.slowPct);
        }
        if (v.pl && hz.team !== 0) v.pl.timeSlow = Math.min(v.pl.timeSlow, 1 - hz.slowPct);
      }
      if (def.cures && v.pl && v.st) {
        v.st.meters[def.cures] = 0;
        v.st.active[def.cures] = 0;
      }
      if (hz.pull && v.en && !v.en.isBoss) {
        const dx = h.x - v.x;
        const dy = h.y - v.y;
        const d = Math.hypot(dx, dy) || 1;
        w.room.moveCircle(v, (dx / d) * hz.pull * _dt, (dy / d) * hz.pull * _dt, v.flying);
      }
      // wind pushes players away from where it blows from (they keep control and can walk against it)
      if (def.push && v.pl && hz.team !== 0 && v.pl.state !== 'dodge') {
        const dx = v.x - h.x;
        const dy = v.y - h.y;
        const d = Math.hypot(dx, dy) || 1;
        w.room.moveCircle(v, (dx / d) * def.push * _dt, (dy / d) * def.push * _dt);
      }
      const next = hz.nextTick[v.id] ?? 0;
      if (now < next) continue;
      hz.nextTick[v.id] = now + hz.tickS;
      const friendly = (v.pl && hz.team === 0) || (v.en && hz.team === 1);
      const list = friendly ? hz.allyEffects : hz.effects;
      if (list.length) {
        const owner = w.get(hz.ownerId);
        runEffects(w, list, {
          sourceId: hz.ownerId,
          team: hz.team,
          x: v.x,
          y: v.y,
          aimX: v.x,
          aimY: v.y,
          targetId: v.id,
          powerMult: hz.powerMult,
          isSpell: true,
          isSkill: false,
          baseDamage: owner?.pl?.derived.weaponPower ?? 20,
          windupS: 0,
          tag: `hz:${hz.hazard}:${friendly ? 'ally' : 'foe'}`,
        });
      }
      // friendly fire (D114): a player's harmful ground (fire puddles, fire walls) burns allies too; zones that do
      // something for allies (allyEffects, alliesOnly) never hurt them
      if (friendly && v.pl && hz.team === 0 && hz.spec && def.dmg > 0 && !hz.alliesOnly && !hz.allyEffects.length) {
        hitAlly(w, w.get(hz.ownerId), v, hz.spec, h.x, h.y);
        continue;
      }
      if (!hz.spec || friendly) continue;
      if (v.pl) {
        if (def.dmg > 0) hitPlayer(w, hz.ownerId, v, hz.spec, h.x, h.y);
        else for (const s of hz.spec.status) applyStatusBuild(w, v, s.id, s.buildup);
      } else if (v.en) {
        if (hz.team === 0) hitEnemy(w, w.get(hz.ownerId) ?? null, v, hz.spec, h.x, h.y, { noLifesteal: true });
        else if (def.dmg > 0 && def.hitsTeam === 'both') rawDamage(w, v, Object.values(hz.spec.dmg).reduce((a, b) => a + (b ?? 0), 0), 'fire', hz.ownerId, false);
      }
    }
  }
}
