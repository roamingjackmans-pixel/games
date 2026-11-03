// Forced motion (dodges handled by the player controller; knockbacks, pulls, dashes, slides), body
// separation, pits/void falls, moving floors (rings and belts), and the time-slow reset.
import { rawDamage } from '../combat/damage';
import { HAZARDS } from './hazards';
import { carryOnMovingFloors } from './movingFloor';
import { T } from '../room';
import type { Entity, World } from '../world';

export const FALL_PIT_PCT = 0.3;
/** Off a platform's edge into the void (CONTENT_ENEMIES §11 The Landlord's arena). */
export const FALL_VOID_PCT = 0.5;
export const FALL_VOID_CLIMB_S = 1.5;

export function startFall(w: World, e: Entity, pct: number, climbS: number): void {
  if (!e.pl || e.pl.falling) return;
  const [fx, fy] = w.room.nearestFloor(e.x, e.y, e.radius);
  e.pl.falling = { until: w.time + climbS, toX: fx, toY: fy };
  e.pl.combo = null;
  e.pl.state = 'falling';
  e.forced = null;
  w.sfx('fall', e.x);
  rawDamage(w, e, e.hp!.max * pct, 'physical', 0);
  w.emit({ t: 'stat', key: 'falls', playerId: e.pl.playerId });
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
    // moving floors (Tock's ring, phase-2 rings and belts) carry everyone standing on them
    carryOnMovingFloors(w, e, dt);
    // falling only when the centre is over the hole: a dodge rolls over a pit, but the void edge cannot be
    // dodged (50% max HP, 1.5 s to climb back at the nearest edge point)
    if (e.pl && !e.pl.falling && !e.pl.downed && !e.pl.deadUntilRest && !e.forced) {
      const t = w.room.tileAt(e.x, e.y);
      if (t === T.Void) startFall(w, e, FALL_VOID_PCT, FALL_VOID_CLIMB_S);
      else if (t === T.Pit && e.pl.state !== 'dodge') startFall(w, e, FALL_PIT_PCT, 0.6);
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
  // solid hazards (root walls) block everyone, except a player mid-dodge who rolls over them (so a pocket walled in
  // by roots is never a trap under the next Piercing area, D94); Guardian Walls block non-boss enemies
  for (const h of w.entities.values()) {
    if (h.removed) continue;
    if (h.type === 'hazard' && h.hz && HAZARDS[h.hz.hazard].blocksMove) {
      for (const s of h.hz.shapes) {
        if (s.k !== 'line') continue;
        const x2 = s.x + Math.cos(s.a) * s.l;
        const y2 = s.y + Math.sin(s.a) * s.l;
        for (const b of [...w.players, ...w.enemies]) if (!b.hp?.dead && !b.flying && !b.en?.isBoss && b.pl?.state !== 'dodge') pushOut(w, b, s.x, s.y, x2, y2, s.w / 2);
      }
    } else if (h.type === 'wall' && h.wl?.blocksEnemies) {
      for (const b of w.enemies) if (!b.hp?.dead && !b.en?.isBoss) pushOut(w, b, h.wl.x1, h.wl.y1, h.wl.x2, h.wl.y2, h.wl.w / 2);
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

/** Push a body out of a capsule (segment x1,y1 → x2,y2 with half width hw). */
function pushOut(w: World, b: Entity, x1: number, y1: number, x2: number, y2: number, hw: number): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / l2));
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  const ox = b.x - cx;
  const oy = b.y - cy;
  const d = Math.hypot(ox, oy);
  const need = hw + b.radius * 0.8;
  if (d >= need) return;
  const nx = d > 1e-6 ? ox / d : -dy / Math.sqrt(l2);
  const ny = d > 1e-6 ? oy / d : dx / Math.sqrt(l2);
  w.room.moveCircle(b, nx * (need - d), ny * (need - d), b.flying);
}
