// Small helpers over entity state used by many systems.
import type { BuffStat, ControlId, StatusId } from '../types';
import type { Buff, Entity, World } from '../world';

export function buffSum(e: Entity, stat: BuffStat, now: number): number {
  if (!e.buffs) return 0;
  let s = 0;
  for (const b of e.buffs) if (b.stat === stat && b.until > now) s += b.amount * b.stacks;
  return s;
}

export function addBuff(e: Entity, w: World, b: Omit<Buff, 'stacks' | 'until'> & { durationS: number; stackAdd?: boolean }): void {
  if (!e.buffs) e.buffs = [];
  const now = w.time;
  const existing = e.buffs.find((x) => x.id === b.id && x.until > now);
  if (existing) {
    existing.until = now + b.durationS;
    if (b.stackAdd) existing.stacks = Math.min(existing.maxStacks, existing.stacks + 1);
    existing.amount = b.amount;
    return;
  }
  e.buffs.push({ id: b.id, stat: b.stat, amount: b.amount, until: now + b.durationS, stacks: 1, maxStacks: b.maxStacks, sourceId: b.sourceId });
}

export function hasControl(e: Entity, c: ControlId, now: number): boolean {
  return !!e.st && e.st.controls[c] > now;
}

export function statusActive(e: Entity, s: StatusId, now: number): boolean {
  return !!e.st && e.st.active[s] > now;
}

/** Movement/attack speed multiplier from Chill, Freeze (boss), slows, buffs, time bubbles. */
export function speedMult(e: Entity, w: World): number {
  const now = w.time;
  let m = 1;
  if (statusActive(e, 'chill', now)) m *= 0.7;
  if (e.en) {
    if (e.en.slowUntil > now) m *= e.en.slowMult;
    if (e.en.isBoss && hasControl(e, 'freeze', now)) m *= 0.5;
  }
  if (e.pl) m *= e.pl.timeSlow;
  m *= 1 + buffSum(e, 'moveSpeedPct', now);
  m *= 1 + buffSum(e, 'speedMult', now);
  if (w.roomMods.floodUntil > now && !e.en?.isBoss && !(e.flying || (e.pl && w.room.isGrateAt(e.x, e.y)))) m *= 1 - w.roomMods.floodSlow;
  return Math.max(0.05, m);
}

export function isIncapacitated(e: Entity, now: number): boolean {
  if (!e.st) return false;
  return e.st.controls.freeze > now || e.st.controls.hold > now;
}

export function frontOf(e: Entity, fromX: number, fromY: number, arcDeg = 120): boolean {
  const a = Math.atan2(fromY - e.y, fromX - e.x);
  let d = a - e.facing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d) <= (arcDeg * Math.PI) / 360;
}

export function behind(target: Entity, fromX: number, fromY: number): boolean {
  return !frontOf(target, fromX, fromY, 180);
}
