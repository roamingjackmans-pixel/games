// Telegraph entities: spawn from a PatternDef, then the telegraph system (systems/telegraphs.ts) resolves
// impacts, continuous areas (sweeps, rings, waves, beams) and pulses.
import { resolvePattern, type PatternCtx } from './patterns';
import type { HazardId, PatternDef, Team } from '../types';
import type { DamageSpec, Entity, World } from '../world';
import type { EffectDef } from '../types';

export interface TeleOpts {
  ownerId: number;
  team: Team;
  kind: 'normal' | 'red' | 'pierce' | 'utility';
  /** seconds until impact (the attack's windup) */
  windupS: number;
  spec: DamageSpec | null;
  ctx: PatternCtx;
  onImpact?: EffectDef[];
  hidden?: boolean;
  sourceTag?: string;
  trackTargetId?: number;
  /** a telegraph's active duration override */
  minActiveS?: number;
}

export function spawnTelegraphs(w: World, pattern: PatternDef, o: TeleOpts): Entity[] {
  const specs = resolvePattern(pattern, o.ctx);
  const out: Entity[] = [];
  const now = w.time;
  for (const s of specs) {
    const impact = now + o.windupS + s.delay;
    const end = impact + Math.max(s.mode === 'instant' ? 0.12 : s.activeS, o.minActiveS ?? 0) + (s.pulses - 1) * s.pulseGap;
    const persist = pattern.persist ? { hazard: pattern.persist.hazard as HazardId, durationS: pattern.persist.durationS } : null;
    const e = w.spawn('telegraph', o.ctx.ox, o.ctx.oy, {
      team: o.team,
      tg: {
        ownerId: o.ownerId,
        team: o.team,
        shapes: s.shapes,
        kind: o.kind,
        start: now,
        impact,
        end,
        mode: s.mode,
        tickS: s.tickS,
        nextTick: impact,
        hit: new Set(),
        spec: o.spec,
        pulses: s.pulses,
        pulseGap: s.pulseGap,
        pulsesDone: 0,
        persist,
        onImpact: o.onImpact ?? [],
        fired: false,
        follow: s.follow,
        trackTargetId: s.track ? (o.trackTargetId ?? 0) : 0,
        turnRate: s.turnRate,
        pullSpeed: s.pullSpeed,
        area: s.area,
        hidden: !!o.hidden,
        sourceTag: o.sourceTag ?? '',
        slowable: 1,
      },
    });
    out.push(e);
    w.emit({ t: 'telegraph', id: e.id });
  }
  return out;
}

/** A telegraph over shapes that already exist (existing tendril lines pulsing: the Weaver's Lash). */
export function spawnShapeTelegraph(w: World, shapes: import('./patterns').Shape[], o: Omit<TeleOpts, 'ctx'> & { x: number; y: number }): Entity {
  const now = w.time;
  const e = w.spawn('telegraph', o.x, o.y, {
    team: o.team,
    tg: {
      ownerId: o.ownerId,
      team: o.team,
      shapes,
      kind: o.kind,
      start: now,
      impact: now + o.windupS,
      end: now + o.windupS + 0.12,
      mode: 'instant',
      tickS: 0,
      nextTick: now + o.windupS,
      hit: new Set(),
      spec: o.spec,
      pulses: 1,
      pulseGap: 0.8,
      pulsesDone: 0,
      persist: null,
      onImpact: [],
      fired: false,
      follow: false,
      trackTargetId: 0,
      turnRate: 0,
      pullSpeed: 0,
      area: true,
      hidden: false,
      sourceTag: o.sourceTag ?? '',
      slowable: 1,
    },
  });
  w.emit({ t: 'telegraph', id: e.id });
  return e;
}
