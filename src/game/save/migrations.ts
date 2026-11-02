// Save migrations: each entry upgrades a save from `from` to `from + 1`. Version 1 is current.
import { SAVE_VERSION } from './schema';

type Migration = { from: number; up: (s: Record<string, unknown>) => Record<string, unknown> };

/** Version 0 (pre-release test saves) → 1: added leftBehind, altMain, freePoints, quickSlot. */
export const MIGRATIONS: Migration[] = [
  {
    from: 0,
    up: (s) => {
      const c = (s.character ?? {}) as Record<string, unknown>;
      c.altMain ??= null;
      c.freePoints ??= 0;
      c.quickSlot ??= null;
      c.tutorialDone ??= true;
      const w = (s.world ?? {}) as Record<string, unknown>;
      w.leftBehind ??= {};
      w.bonfiresDiscovered ??= [];
      w.roomsVisited ??= [];
      w.bossKilled ??= [];
      return { ...s, character: c, world: w, version: 1 };
    },
  },
];

export function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  let s = raw as Record<string, unknown>;
  let v = typeof s.version === 'number' ? s.version : 0;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS.find((x) => x.from === v);
    if (!m) break;
    s = m.up(s);
    v = typeof s.version === 'number' ? s.version : v + 1;
  }
  return s;
}
