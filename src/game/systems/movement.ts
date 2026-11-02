// Forced motion (dodges handled by the player controller; knockbacks, pulls, dashes, slides), body
// separation, pits/void falls, the rotating floor ring, and the time-slow reset.
import { dist } from '../../engine/math';
import { rawDamage } from '../combat/damage';
import type { Entity, World } from '../world';

export const FALL_PIT_PCT = 0.3;

export function startFall(w: World, e: Entity, pct: number, climbS: number): void {
  if (!e.pl || e.pl.falling) return;
  const [fx, fy] = w.room.nearestFloor(e.x, e.y, e.radius);
  e.pl.falling = { until: w.time + climbS, toX: fx, toY: fy };
  e.pl.combo = null;
  e.pl.state = 'falling';
  e.forced = null;
  w.sfx('fall', e.x);
  rawDamage(w, e, e.hp!.max * pct, 'physical', 0);
  w.hooks.onFall?.(w, e);
}

export function updateMovement(w: World, dt: number): void {
  const now = w.time;
  for (const e of w.entities.values()) {
    if (e.removed) continue;
    if (e.type !== 'player' && e.type !== 'enemy') continue;
    if (w.frozen(e)) continue;
    // forced motion
    if (e.forced) {
      if (now >= e.forced.until) e.forced = null;
      else {
        const ignoreFall = e.forced.kind === 'leap' || e.forced.kind === 'dash' || e.type === 'player';
        const hit = w.room.moveCircle(e, e.forced.vx * dt, e.forced.vy * dt, e.flying, ignoreFall);
        if (hit && e.forced.kind === 'knock') e.forced = null;
      }
    }
    // the rotating floor ring carries everyone standing on it
    const rf = w.room.rotFloor;
    if (rf && !e.flying) {
      const d = dist(rf.x, rf.y, e.x, e.y);
      if (d >= rf.rIn && d <= rf.rOut) {
        const a = Math.atan2(e.y - rf.y, e.x - rf.x) + (rf.speed / Math.max(40, d)) * dt * 40;
        const nx = rf.x + Math.cos(a) * d;
        const ny = rf.y + Math.sin(a) * d;
        w.room.moveCircle(e, nx - e.x, ny - e.y, false);
      }
    }
    // pits and void: falling only when the centre is over the hole and not mid-dodge
    if (e.pl && !e.pl.falling && !e.pl.downed && !e.pl.deadUntilRest && e.pl.state !== 'dodge' && !e.forced) {
      if (w.room.isFallAt(e.x, e.y)) {
        const voidFall = w.room.tileAt(e.x, e.y) === 8;
        startFall(w, e, voidFall ? 0.5 : FALL_PIT_PCT, voidFall ? 1.5 : 0.6);
      }
    } else if (e.en && !e.flying && w.room.isFallAt(e.x, e.y) && !e.forced) {
      // enemies knocked into a pit fall and die (bosses are pushed back out)
      if (e.en.isBoss) {
        const [fx, fy] = w.room.nearestFloor(e.x, e.y, e.radius);
        e.x = fx;
        e.y = fy;
      } else {
        rawDamage(w, e, e.hp!.max * 10, 'physical', e.hp!.lastHitBy);
        w.sfx('fall', e.x);
      }
    }
  }
  // soft separation between bodies (players and enemies push each other apart)
  const bodies: Entity[] = [];
  for (const p of w.players) if (!p.pl!.downed && !p.pl!.deadUntilRest && !p.pl!.falling) bodies.push(p);
  for (const e of w.enemies) if (!e.hp?.dead && e.solid && e.en!.state !== 'ceiling' && e.en!.state !== 'spawning' && !e.en!.isIllusion) bodies.push(e);
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i]!;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j]!;
      if (a.flying !== b.flying) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const rr = (a.radius + b.radius) * 0.85;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      const push = (rr - d) * 0.5;
      const nx = dx / d;
      const ny = dy / d;
      // heavier bodies move less; players dodging pass through
      if (a.pl?.state === 'dodge' || b.pl?.state === 'dodge') continue;
      const wa = a.en?.isBoss ? 0.05 : b.en?.isBoss ? 1 : a.radius < b.radius ? 0.7 : 0.3;
      const wb = 1 - wa;
      w.room.moveCircle(a, -nx * push * 2 * wa, -ny * push * 2 * wa, a.flying);
      w.room.moveCircle(b, nx * push * 2 * wb, ny * push * 2 * wb, b.flying);
    }
  }
  for (const p of w.players) if (p.pl) p.pl.timeSlow = 1;
}
