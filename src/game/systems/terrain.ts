// Hazardous terrain effects (PROCGEN §3.2, GAME_DESIGN §2.4). Slow terrain: −35% walking speed for players and
// walking enemies while their centre is on it (one multiplier, never stacked; dodges, leaps, dashes and knockbacks
// are forced motion and keep their full distance). Hurt terrain: players standing in it take 3% of max HP every
// 0.5 s (a dodge's i-frames skip a tick; enemies are at home in their dungeon and take none).
import { rawDamage } from '../combat/damage';
import { TERRAIN, TERRAIN_SLOW_MULT, type Room } from '../room';
import type { DamageType } from '../types';
import type { Entity, World } from '../world';

export const TERRAIN_HURT_PCT = 0.03;
export const TERRAIN_HURT_TICK_S = 0.5;

/** Walking speed multiplier for a body at (x, y): 0.65 on Slow terrain, else 1. Flying bodies skim over it. */
export function terrainWalkMult(room: Room, x: number, y: number, flying = false): number {
  if (flying) return 1;
  return room.terrainAt(x, y) === TERRAIN.Slow ? TERRAIN_SLOW_MULT : 1;
}

/** The damage number's color per zone (grave-fire, acid, sewage, thorns, embers, frost, sparks, void). */
const HURT_TYPE: DamageType[] = ['fire', 'magic', 'magic', 'physical', 'fire', 'magic', 'magic', 'void'];

export function updateTerrain(w: World): void {
  const now = w.time;
  for (const p of w.players) {
    const pl = p.pl;
    if (!pl || !p.hp || p.hp.dead || p.removed || pl.downed || pl.deadUntilRest || pl.falling) continue;
    if (w.room.terrainAt(p.x, p.y) !== TERRAIN.Hurt || now < pl.terrainHurtAt) continue;
    if (p.hp.invulnUntil > now || (now >= pl.iframesFrom && now < pl.iframesUntil)) continue;
    // a steady 0.5 s beat while you stay in it (no drift from the frame step); stepping back in waits out the beat
    const due = pl.terrainHurtAt;
    pl.terrainHurtAt = (now - due < 0.05 ? due : now) + TERRAIN_HURT_TICK_S;
    hurt(w, p);
  }
}

function hurt(w: World, p: Entity): void {
  const amount = Math.max(1, Math.round(p.hp!.max * TERRAIN_HURT_PCT));
  rawDamage(w, p, amount, HURT_TYPE[(w.zone - 1) % 8] ?? 'physical', 0);
  p.anim.flashUntil = w.time + 0.08;
  w.sfx('hitFlesh', p.x, 0.45, 1.3);
  w.fx('dust', p.x, p.y + 10, { n: 4 });
}
