// Statistics (GAME_DESIGN §21): fun numbers, counted twice — per character (in the save, `SaveFile.stats.extra`)
// and account-wide for every character ever played on this browser (`dj.stats`). Fed exactly like the achievement
// tracker: the run scenes pass each frame's world events, the local player and the save to `frame()`; the session
// adds deaths (`note()`); a few inventory actions call `add()`. A co-op guest counts its own from the host's
// mirrored events, so everyone gets their own numbers. Headless: no DOM (the screen is src/ui/statistics.ts).
//
// Counter keys. Plain keys add up; `best:` keys keep the lowest value (fastest times); `most:` keys the highest.
//   Combat     kills, kill:<enemyId>, zoneKills:<zone>, elites, affix:<affix>, bosses, boss:<bossId>,
//              best:boss:<bossId> (seconds), mimics, mimicBites, dmgDealt, dmgTaken, most:hit, crits, weakHits,
//              resistHits, parries, ripostes, dodges, blocks, sips
//   Death      deaths, deathBy:<enemyId | '?'>, bossDeaths, falls, downed, shardsGained, shardsSpent, shardsDropped,
//              shardsRecovered, most:shards, levels, glowenEarned, glowenSpent
//   Loot       loot:<rarity>, gems, gemsUpgraded, gemsFused, chests, garyBuys, garyGlowen
//   Exploring  rooms, roomsCleared, bonfires, distance (px), playtime (s), most:zone, cycles, garyVisits
//   Co-op      revivesGiven, revivesReceived, coopTime (s), most:party
import { BOSSES } from '../data/bosses';
import { GARY, INSTRUCTOR, MIMIC, SPECIAL_ENEMIES } from '../data/enemies/special';
import { getStore, type KeyValueStore } from '../engine/settings';
import { listSaves } from './save/storage';
import type { SaveFile, SaveStats } from './types';
import type { Entity, GameEvent, World } from './world';

export const STATS_KEY = 'dj.stats';
const VERSION = 1;

export type Counters = Record<string, number>;

export interface StatsRecord {
  v: number;
  c: Counters;
}

/** Apply one change to a counter map with the key's rule (add, keep lowest, keep highest). */
export function bump(c: Counters, key: string, n: number): void {
  if (!Number.isFinite(n)) return;
  const cur = c[key];
  if (key.startsWith('best:')) {
    if (n > 0 && (cur === undefined || n < cur)) c[key] = n;
  } else if (key.startsWith('most:')) {
    if (n > (cur ?? 0)) c[key] = n;
  } else if (n > 0) c[key] = (cur ?? 0) + n;
}

/** Keep only finite non-negative numbers under string keys. */
export function cleanCounters(raw: unknown): Counters {
  const out: Counters = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = v;
  return out;
}

/** The counters a save already kept before statistics existed (carried over the first time a save is seen). */
export function legacyCounters(s: SaveStats): Counters {
  const c: Counters = {};
  const put = (k: string, v: unknown): void => {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) c[k] = v;
  };
  put('kills', s.kills);
  put('deaths', s.deaths);
  put('bosses', s.bossKills);
  put('elites', s.elitesKilled);
  put('mimics', s.mimicsKilled);
  put('mimicBites', s.mimicDeaths);
  put('playtime', s.playtimeSec);
  return c;
}

/** A save's statistics, created (from its old counters) on first use. */
export function saveCounters(save: SaveFile): Counters {
  const st = save.stats;
  if (!st.extra || typeof st.extra !== 'object') st.extra = legacyCounters(st);
  return st.extra;
}

/** Read-only view for the screen: never writes into the save. */
export function peekSaveCounters(save: SaveFile): Counters {
  return save.stats.extra && typeof save.stats.extra === 'object' ? save.stats.extra : legacyCounters(save.stats);
}

export function loadStats(store: KeyValueStore): StatsRecord | null {
  try {
    const s = store.getItem(STATS_KEY);
    if (!s) return null;
    const o = JSON.parse(s) as { c?: unknown } | null;
    return { v: VERSION, c: cleanCounters(o?.c) };
  } catch {
    return { v: VERSION, c: {} };
  }
}

/** Enemies whose deaths are not kills (training dummies, Gary) — the same rule as the achievements. */
function countsAsKill(defId: string): boolean {
  if (!defId || defId === GARY.id) return false;
  return !SPECIAL_ENEMIES[defId] || defId === MIMIC.id || defId === INSTRUCTOR.id;
}

/** Things the session tells the tracker (world events do not carry them). */
export type StatNote =
  /** the local player died (solo) or the party was evicted; `by`: the killer's enemy def id */
  { k: 'death'; by?: string | undefined };

/** px walked per frame above this is a teleport or a room change, not walking */
const MAX_STEP = 40;

export class StatsTracker {
  rec: StatsRecord;
  /** the character counted right now (null on the title screen) */
  save: SaveFile | null = null;
  private dirty = false;
  private frames = 0;
  // ---- per-run state (reset by begin())
  private pid = '';
  private lastShards = -1;
  private lastGlowen = -1;
  private lastLevel = -1;
  private lastFlask = -1;
  private lastCycle = -1;
  private recoverCredit = 0;
  private deathGuard = 0;
  private lastX = NaN;
  private lastY = NaN;
  private lastRoom: unknown = null;
  private garyRoom: unknown = null;
  private lastHitter = '';
  private lastClock = -1;
  /** play-clock seconds (paused time does not count) */
  private clock = 0;
  private fight: { id: number; defId: string; start: number } | null = null;
  private lastBossDown: { defId: string; at: number } | null = null;

  constructor(
    private store: KeyValueStore | null = null,
    private now: () => number = () => Date.now(),
    seed: () => SaveFile[] = () => [],
  ) {
    const got = store ? loadStats(store) : null;
    if (got) this.rec = got;
    else {
      // first run of a build with statistics: the account starts from what the saves already counted
      this.rec = { v: VERSION, c: {} };
      try {
        for (const s of seed()) for (const [k, v] of Object.entries(legacyCounters(s.stats))) bump(this.rec.c, k, v);
      } catch {
        // unreadable saves: start from zero
      }
      this.dirty = true;
      this.flush();
    }
  }

  // ------------------------------------------------------------------ reading / writing

  /** Account-wide value. */
  get(key: string): number {
    return this.rec.c[key] ?? 0;
  }

  /** Count something for the account and the character being played. */
  add(key: string, n = 1): void {
    bump(this.rec.c, key, n);
    if (this.save) bump(saveCounters(this.save), key, n);
    this.dirty = true;
  }

  /** Count an inventory action when it went through (`{ key: n }` for several); returns the result unchanged. */
  count<T extends { ok: boolean }>(res: T, what: string | Counters): T {
    if (res.ok) for (const [k, n] of Object.entries(typeof what === 'string' ? { [what]: 1 } : what)) this.add(k, n);
    return res;
  }

  flush(): void {
    if (!this.dirty || !this.store) return;
    this.dirty = false;
    try {
      this.store.setItem(STATS_KEY, JSON.stringify(this.rec));
    } catch {
      // storage full or blocked: keep counting in memory
    }
  }

  /** Forget the account totals (tests, debug). Saves keep theirs. */
  reset(): void {
    this.rec = { v: VERSION, c: {} };
    this.dirty = true;
    this.flush();
  }

  // ------------------------------------------------------------------ the run

  /** A run scene starts with this save. */
  begin(save: SaveFile): void {
    this.flush();
    this.save = save;
    saveCounters(save);
    this.pid = save.character.playerId;
    this.lastShards = this.lastGlowen = this.lastLevel = this.lastFlask = this.lastCycle = -1;
    this.recoverCredit = 0;
    this.deathGuard = 0;
    this.lastX = this.lastY = NaN;
    this.lastRoom = this.garyRoom = null;
    this.lastHitter = '';
    this.lastClock = -1;
    this.fight = null;
    this.lastBossDown = null;
  }

  /** The run scene ends: write everything. */
  end(): void {
    this.flush();
    this.save = null;
  }

  note(n: StatNote): void {
    if (n.k === 'death') {
      this.add('deaths');
      this.add(`deathBy:${n.by || this.lastHitter || '?'}`);
      if (this.fight) this.add('bossDeaths');
      const held = Math.max(0, this.lastShards, this.save?.character.shards ?? 0);
      this.add('shardsDropped', Math.floor(held));
      this.deathGuard = 600;
      this.recoverCredit = 0;
      this.fight = null;
      this.flush();
    }
  }

  /**
   * Once per client frame, before the frame's events are cleared. `w` is the world this client shows (the host's
   * own, or a guest's mirror), `me` the local player's body and `save` the local save.
   */
  frame(w: World, me: Entity | null, save: SaveFile, events: readonly GameEvent[]): void {
    if (this.save !== save) this.begin(save);
    const c = save.character;
    const pid = me?.pl?.playerId ?? c.playerId;
    this.pid = pid;
    const t = this.now() / 1000;
    const dt = this.lastClock < 0 ? 0 : Math.max(0, Math.min(0.25, t - this.lastClock));
    this.lastClock = t;
    if (!w.paused && dt > 0) {
      this.clock += dt;
      this.add('playtime', dt);
      if (w.players.length > 1) this.add('coopTime', dt);
    }
    for (const ev of events) this.event(w, ev, me);
    this.watchFight(w);
    this.watchChar(save);
    this.watchBody(w, me);
    if (++this.frames % 30 === 0) {
      this.add('most:zone', w.zone);
      this.add('most:party', w.players.length);
      if (this.garyRoom !== w.room && w.enemies.some((e) => e.en?.def.id === GARY.id && !e.removed)) {
        this.garyRoom = w.room;
        this.add('garyVisits');
      }
    }
    if (this.deathGuard > 0) this.deathGuard--;
    if (this.frames % 600 === 0) this.flush();
  }

  /** The body behind a hit or a kill: a projectile's, telegraph's or hazard's owner, else the source itself. */
  private who(w: World, id: number | undefined): Entity | undefined {
    if (!id) return undefined;
    const src = w.get(id);
    const owner = src?.pr?.ownerId ?? src?.tg?.ownerId ?? src?.hz?.ownerId;
    return (owner ? w.get(owner) : undefined) ?? src;
  }

  /** Credit unless another player did it (unknown sources, hazards and burns count for you). */
  private mine(id: number | undefined, w: World, me: Entity | null): boolean {
    if (!id || (me && id === me.id)) return true;
    const src = this.who(w, id);
    return !src?.pl || src === me;
  }

  private event(w: World, ev: GameEvent, me: Entity | null): void {
    const pid = this.pid;
    switch (ev.t) {
      case 'death': {
        if (ev.isPlayer || !ev.defId) return;
        const boss = BOSSES[ev.defId];
        if (boss) {
          // a split boss dies in pieces: one kill
          const lb = this.lastBossDown;
          if (lb && lb.defId === boss.id && this.clock - lb.at < 10) return;
          this.lastBossDown = { defId: boss.id, at: this.clock };
          this.add('bosses');
          this.add(`boss:${boss.id}`);
          if (this.fight && this.fight.defId === boss.id) this.add(`best:boss:${boss.id}`, Math.max(1, Math.round(this.clock - this.fight.start)));
          this.fight = null;
        }
        if (!countsAsKill(ev.defId) || !this.mine(ev.by, w, me)) return;
        this.add('kills');
        this.add(`kill:${ev.defId}`);
        this.add(`zoneKills:${w.zone}`);
        if (ev.elite) {
          this.add('elites');
          this.add(`affix:${ev.elite}`);
        }
        if (ev.defId === MIMIC.id) this.add('mimics');
        return;
      }
      case 'dmg': {
        if (ev.heal || ev.amount <= 0) return;
        if (ev.toPlayer) {
          if (!me || ev.targetId !== me.id) return;
          this.add('dmgTaken', ev.amount);
          const def = this.who(w, ev.src)?.en?.def.id;
          if (def) this.lastHitter = def;
          return;
        }
        // solo every hit is yours; in co-op only the ones you (or your projectiles) land
        if (!me || (w.players.length > 1 ? this.who(w, ev.src) !== me : !this.mine(ev.src, w, me))) return;
        this.add('dmgDealt', ev.amount);
        this.add('most:hit', Math.round(ev.amount));
        if (ev.crit) this.add('crits');
        if (ev.affinity === 'weak') this.add('weakHits');
        else if (ev.affinity === 'resist') this.add('resistHits');
        return;
      }
      case 'parry':
        if (ev.playerId === pid) this.add('parries');
        return;
      case 'feat':
        if (ev.playerId !== pid) return;
        this.add(ev.kind === 'riposte' ? 'ripostes' : 'revivesGiven');
        return;
      case 'revived':
        if (ev.playerId === pid) this.add('revivesReceived');
        return;
      case 'downed':
        if (ev.playerId === pid) this.add('downed');
        return;
      case 'loot':
        if (ev.playerId === pid || ev.playerId === '') this.add(`loot:${ev.rarity}`);
        return;
      case 'stat':
        if (ev.playerId !== pid && ev.playerId !== '') return;
        this.add(ev.key, ev.n ?? 1);
        if (ev.key === 'shardsRecovered') this.recoverCredit += ev.n ?? 0;
        return;
      default:
    }
  }

  private watchFight(w: World): void {
    const bid = w.bossId;
    if (!bid) return;
    if (this.fight?.id === bid) return;
    const b = w.get(bid);
    // the clock starts when the intro ends
    if (!b?.en || b.en.state === 'spawning') return;
    const def = BOSSES[b.en.def.id];
    if (def) this.fight = { id: bid, defId: def.id, start: this.clock };
  }

  /** Shards, Glowen, levels, Thermos and cycles from the character's numbers. */
  private watchChar(save: SaveFile): void {
    const c = save.character;
    const shards = Math.floor(c.shards);
    if (this.lastShards >= 0) {
      const d = shards - this.lastShards;
      if (d > 0) {
        const r = Math.min(d, this.recoverCredit);
        this.recoverCredit -= r;
        this.add('shardsGained', d - r);
      } else if (d < 0 && this.deathGuard <= 0) this.add('shardsSpent', -d);
    }
    this.lastShards = shards;
    this.add('most:shards', shards);
    const glowen = Math.floor(c.glowen);
    if (this.lastGlowen >= 0) {
      const d = glowen - this.lastGlowen;
      if (d > 0) this.add('glowenEarned', d);
      else if (d < 0) this.add('glowenSpent', -d);
    }
    this.lastGlowen = glowen;
    if (this.lastLevel >= 0 && c.level > this.lastLevel) this.add('levels', c.level - this.lastLevel);
    this.lastLevel = c.level;
    if (this.lastFlask >= 0 && c.flaskCur < this.lastFlask && this.deathGuard <= 0) this.add('sips', this.lastFlask - c.flaskCur);
    this.lastFlask = c.flaskCur;
    if (this.lastCycle >= 0 && c.cycle > this.lastCycle) this.add('cycles', c.cycle - this.lastCycle);
    this.lastCycle = c.cycle;
  }

  /** Rooms entered and distance walked from the local body. */
  private watchBody(w: World, me: Entity | null): void {
    if (w.room !== this.lastRoom) {
      if (this.lastRoom !== null) this.add('rooms');
      this.lastRoom = w.room;
      this.lastX = NaN;
    }
    if (!me?.pl || me.pl.falling || me.pl.downed) {
      this.lastX = NaN;
      return;
    }
    if (Number.isFinite(this.lastX)) {
      const d = Math.hypot(me.x - this.lastX, me.y - this.lastY);
      if (d > 0.01 && d < MAX_STEP) this.add('distance', d);
    }
    this.lastX = me.x;
    this.lastY = me.y;
  }
}

let shared: StatsTracker | null = null;

/** The account's statistics (created on first use from the browser's storage, or memory when blocked). */
export function stats(): StatsTracker {
  if (!shared) {
    const store = getStore();
    shared = new StatsTracker(store, () => Date.now(), () => listSaves(store).filter((s): s is SaveFile => !!s));
    if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => shared?.flush());
  }
  return shared;
}
