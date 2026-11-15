// The Wave Rush record each character keeps (GAME_DESIGN §24, D408) and the stage numbering. No game imports, so the
// save schema can use it without pulling in the world.
import type { RushRecord } from './types';

/** Rooms a cycle has before its boss: one per zone. */
export const RUSH_ROOMS = 8;
/** The boss stage comes after the last room. */
export const RUSH_BOSS_STAGE = RUSH_ROOMS + 1;

/** 'Room 3 of 8' / 'Boss'. */
export function rushStageLabel(stage: number): string {
  return stage >= RUSH_BOSS_STAGE ? 'Boss' : `Room ${stage} of ${RUSH_ROOMS}`;
}

// ---------------------------------------------------------------- the per-character record (Statistics, D408)

export function newRushRecord(): RushRecord {
  return { tries: 0, deaths: 0, cleared: 0, roomsCleared: 0, timeSec: 0, best: {}, bestCycle: -1, furthestCycle: -1, furthestStage: 0 };
}

/** A record from a save (any shape): numbers only, missing fields filled. */
export function normalizeRushRecord(raw: unknown): RushRecord {
  const r = newRushRecord();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return r;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, min: number): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : null);
  for (const k of ['tries', 'deaths', 'cleared', 'roomsCleared', 'timeSec'] as const) r[k] = num(o[k], 0) ?? 0;
  r.bestCycle = Math.floor(num(o.bestCycle, -1) ?? -1);
  r.furthestCycle = Math.floor(num(o.furthestCycle, -1) ?? -1);
  r.furthestStage = Math.floor(num(o.furthestStage, 0) ?? 0);
  if (o.best && typeof o.best === 'object' && !Array.isArray(o.best)) {
    for (const [k, v] of Object.entries(o.best as Record<string, unknown>)) {
      const sec = num(v, 0);
      if (/^[0-9]+$/.test(k) && sec !== null && sec > 0) r.best[k] = sec;
    }
  }
  return r;
}

/** How far a stage of a cycle is, as one number (higher = further). */
export function rushProgress(cycle: number, stage: number): number {
  return cycle * (RUSH_BOSS_STAGE + 1) + stage;
}

/** A stage reached: the furthest point moves up. */
export function noteRushStage(r: RushRecord, cycle: number, stage: number): void {
  if (rushProgress(cycle, stage) > rushProgress(r.furthestCycle, r.furthestStage)) {
    r.furthestCycle = cycle;
    r.furthestStage = stage;
  }
}

/** A cycle's boss fell `sec` seconds after room 1 began: a best time, a clear, and the furthest point past the boss. */
export function noteRushClear(r: RushRecord, cycle: number, sec: number): void {
  r.cleared++;
  r.bestCycle = Math.max(r.bestCycle, cycle);
  const k = String(cycle);
  const t = Math.max(0.01, Math.round(sec * 100) / 100);
  if (!(r.best[k]! > 0) || t < r.best[k]!) r.best[k] = t;
  noteRushStage(r, cycle, RUSH_BOSS_STAGE + 1);
}

/** 'Cycle 3, room 5 of 8' / 'Cycle 2, boss' / 'Cycle 4 cleared' / 'Not played'. */
export function rushFurthestLabel(r: RushRecord): string {
  if (r.furthestCycle < 0) return 'Not played';
  const c = `Cycle ${r.furthestCycle + 1}`;
  if (r.furthestStage > RUSH_BOSS_STAGE) return `${c} cleared`;
  return r.furthestStage >= RUSH_BOSS_STAGE ? `${c}, the boss` : `${c}, room ${r.furthestStage} of ${RUSH_ROOMS}`;
}

/** The fastest clear of any cycle: [cycle, seconds], or null. */
export function rushFastest(r: RushRecord): [number, number] | null {
  let out: [number, number] | null = null;
  for (const [k, v] of Object.entries(r.best)) if (!out || v < out[1]) out = [Number(k), v];
  return out;
}

/** A Wave Rush time: "4:07.3" (or "1:02:07" past an hour). */
export function fmtRushTime(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(Math.floor(r)).padStart(2, '0')}`;
  return `${m}:${r.toFixed(1).padStart(4, '0')}`;
}

/**
 * What a co-op guest's own record takes from the host's Wave Rush (D408): the same tries, stages, rooms, deaths and
 * clears as the host's, so every player's Statistics show the run they played.
 */
export function applyRushEvent(r: RushRecord, e: { kind: 'try' | 'stage' | 'room' | 'cleared' | 'death'; cycle: number; stage: number; sec?: number }): void {
  if (e.kind === 'try') r.tries++;
  else if (e.kind === 'stage') noteRushStage(r, e.cycle, e.stage);
  else if (e.kind === 'room') r.roomsCleared++;
  else if (e.kind === 'death') r.deaths++;
  else if (e.kind === 'cleared') noteRushClear(r, e.cycle, e.sec ?? 0);
}
