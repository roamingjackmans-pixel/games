// Achievement tracking (GAME_DESIGN §20). Account-wide: one record in localStorage (`dj.achievements`) for all
// ten save slots, robust to a missing or mangled record. Fed from the client's own view of the world, so a co-op
// guest tracks theirs exactly like a host: the run scenes pass each frame's world events and the local player to
// `frame()`; the session adds the few things events do not carry (`note()`: deaths, Gary leaving, the credits).
// Headless: no DOM. The UI listens with `onUnlock()` (src/ui/achievements.ts).
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, type AchievementDef, type AchView } from '../data/achievements';
import { GEM_MAX_LEVEL, perkLevel, perkQuality } from '../data/gems';
import { MAX_REINFORCE } from '../data/essence';
import { BOSSES } from '../data/bosses';
import { GARY, INSTRUCTOR, MIMIC, SPECIAL_ENEMIES } from '../data/enemies/special';
import { parseArmorBase } from '../data/armor';
import { getStore, type KeyValueStore } from '../engine/settings';
import type { Character, Gem, Item } from './types';
import type { Entity, GameEvent, World } from './world';

export const ACH_KEY = 'dj.achievements';
const VERSION = 1;

export interface AchRecord {
  v: number;
  /** achievement id → unlock time (ms since the epoch) */
  unlocked: Record<string, number>;
  counters: Record<string, number>;
}

export function emptyRecord(): AchRecord {
  return { v: VERSION, unlocked: {}, counters: {} };
}

/** Keep only well-formed entries: finite non-negative numbers under string keys. Unknown ids are kept (newer builds). */
export function normalizeRecord(raw: unknown): AchRecord {
  const out = emptyRecord();
  if (!raw || typeof raw !== 'object') return out;
  const o = raw as Record<string, unknown>;
  const nums = (src: unknown, dst: Record<string, number>): void => {
    if (!src || typeof src !== 'object' || Array.isArray(src)) return;
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) dst[k] = v;
    }
  };
  nums(o.unlocked, out.unlocked);
  nums(o.counters, out.counters);
  return out;
}

export function loadRecord(store: KeyValueStore): AchRecord {
  try {
    const s = store.getItem(ACH_KEY);
    return normalizeRecord(s ? JSON.parse(s) : null);
  } catch {
    return emptyRecord();
  }
}

/** Notes from the session and scenes: the moments world events do not carry. */
export type AchNote =
  /** the local player died (solo) or the party was evicted (co-op); `by` is the killer's enemy def id */
  | { k: 'death'; by?: string | undefined }
  /** climbed out of the Abyss: the credits roll */
  | { k: 'credits' }
  /** Gary was hit until he left */
  | { k: 'garyGone' };

/** Enemies whose deaths are not kills (training dummies, Gary). */
function countsAsKill(defId: string): boolean {
  if (!defId || defId === GARY.id) return false;
  return !SPECIAL_ENEMIES[defId] || defId === MIMIC.id || defId === INSTRUCTOR.id;
}

function itemsOf(c: Character): Item[] {
  const e = c.equipment;
  const all: (Item | null | undefined)[] = [e.main, e.off, e.head, e.body, e.legs, e.ring1, e.ring2, e.ring3, e.ring4, c.altMain, c.altOff, ...c.bag];
  return all.filter((x): x is Item => !!x);
}

/** Head, body and legs all from one armor set found past zone 1 (every starting kit is a zone-1 set). */
export function wearsFullSet(c: Character): boolean {
  const e = c.equipment;
  const sets = [e.head, e.body, e.legs].map((it) => (it && it.kind === 'armor' ? parseArmorBase(it.baseId)?.set : null));
  const s = sets[0];
  return !!s && s.zone >= 2 && sets[1] === s && sets[2] === s;
}

export function hasMaxGem(c: Character): boolean {
  // a gem perk at Tier 5 (perks carry the tiers since gems can hold several)
  const maxed = (g: { perks: { tier: number }[] } | null): boolean => !!g && g.perks.some((p) => p.tier >= 5);
  if (c.gems.some(maxed)) return true;
  return itemsOf(c).some((it) => it.sockets.some(maxed));
}

/** A level 50 gem with three perks, all Orange rolls (D199); loose or socketed. */
export function hasPerfectGem(c: Character): boolean {
  const perfect = (g: Gem | null): boolean => !!g && g.perks.length === 3 && g.perks.every((p) => perkLevel(p) >= GEM_MAX_LEVEL && perkQuality(p).id === 'orange');
  return c.gems.some(perfect) || itemsOf(c).some((it) => it.sockets.some(perfect));
}

/** Any weapon, shield or armour piece at +15 (D199). */
export function hasMaxReinforce(c: Character): boolean {
  return itemsOf(c).some((it) => (it.plus ?? 0) >= MAX_REINFORCE);
}

/** The boss fight in progress, from the local player's side. */
interface Fight {
  bossId: number;
  flask: number;
  drank: boolean;
  armed: boolean;
}

export class AchievementTracker {
  rec: AchRecord;
  private listeners: ((def: AchievementDef) => void)[] = [];
  private dirty = false;
  private frames = 0;
  // ---- per-run state (reset by begin())
  private fight: Fight | null = null;
  private zone = 0;
  /** the zone being cleared without a death (0: none) */
  private cleanZone = 0;
  private encumberedS = 0;
  private lastTime = -1;
  private ripostes = new Map<number, number>();
  private cycle = 0;

  constructor(
    private store: KeyValueStore | null = null,
    private now: () => number = () => Date.now(),
  ) {
    this.rec = store ? loadRecord(store) : emptyRecord();
  }

  // ------------------------------------------------------------------ reading

  readonly view: AchView = {
    count: (key) => this.rec.counters[key] ?? 0,
    has: (id) => this.rec.unlocked[id] !== undefined,
  };

  unlocked(id: string): boolean {
    return this.rec.unlocked[id] !== undefined;
  }

  unlockedAt(id: string): number | null {
    return this.rec.unlocked[id] ?? null;
  }

  /** [unlocked, total] over the known achievements */
  totals(): [number, number] {
    return [ACHIEVEMENTS.filter((a) => this.unlocked(a.id)).length, ACHIEVEMENTS.length];
  }

  onUnlock(fn: (def: AchievementDef) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }

  // ------------------------------------------------------------------ counters

  add(key: string, n = 1): void {
    if (n <= 0) return;
    this.rec.counters[key] = (this.rec.counters[key] ?? 0) + n;
    this.dirty = true;
    this.evaluate();
  }

  /** Raise a counter to `v` if it is higher (levels, Glowen held, party size). */
  max(key: string, v: number): void {
    if (!Number.isFinite(v) || v <= (this.rec.counters[key] ?? 0)) return;
    this.rec.counters[key] = v;
    this.dirty = true;
    this.evaluate();
  }

  /** Mark a one-off. */
  flag(key: string): void {
    this.max(key, 1);
  }

  /** Unlock whatever now passes its check; repeats so The Dark Shard follows the last one in the same call. */
  evaluate(): AchievementDef[] {
    const got: AchievementDef[] = [];
    for (let pass = 0; pass < 3; pass++) {
      let any = false;
      for (const a of ACHIEVEMENTS) {
        if (this.unlocked(a.id) || !a.check(this.view)) continue;
        this.rec.unlocked[a.id] = this.now();
        got.push(a);
        any = true;
      }
      if (!any) break;
    }
    if (got.length) {
      this.dirty = true;
      this.flush();
      for (const a of got) for (const fn of this.listeners) fn(a);
    }
    return got;
  }

  flush(): void {
    if (!this.dirty || !this.store) return;
    this.dirty = false;
    try {
      this.store.setItem(ACH_KEY, JSON.stringify(this.rec));
    } catch {
      // storage full or blocked: keep counting in memory
    }
  }

  /** Forget everything (tests, debug). */
  reset(): void {
    this.rec = emptyRecord();
    this.dirty = true;
    this.flush();
    this.begin();
  }

  // ------------------------------------------------------------------ the run

  /** A run scene starts. `clean`: the character has never died, so the zone it stands in counts as clean. */
  begin(opts: { clean?: boolean } = {}): void {
    this.fight = null;
    this.zone = 0;
    this.cleanZone = opts.clean ? -1 : 0;
    this.encumberedS = 0;
    this.lastTime = -1;
    this.ripostes.clear();
  }

  note(n: AchNote): void {
    switch (n.k) {
      case 'death':
        this.add('deaths');
        if (n.by === MIMIC.id) this.flag('mimicDeath');
        this.fight = null;
        // The Instructor floors everybody: that does not spoil zone 1's clean run (D207)
        if (n.by !== INSTRUCTOR.id) this.cleanZone = 0;
        break;
      case 'credits':
        this.flag('credits');
        break;
      case 'garyGone':
        this.flag('garyGone');
        break;
    }
    this.flush();
  }

  /**
   * Once per client frame, before the frame's events are cleared. `w` is the world this client shows (the host's
   * own, or a guest's mirror), `me` the local player's body and `c` the local character.
   */
  frame(w: World, me: Entity | null, c: Character, events: readonly GameEvent[]): void {
    const pid = me?.pl?.playerId ?? c.playerId;
    this.cycle = w.cycle;
    this.watchZone(w.zone);
    // events first: the frame a boss dies its id is already gone from the world, the fight record is not
    for (const ev of events) this.event(ev, pid, c);
    this.watchFight(w, me, c);
    if (me?.pl) this.watchLoad(w, me);
    if (++this.frames % 30 === 0) this.poll(w, c);
    if (this.frames % 240 === 0) this.flush();
  }

  private watchZone(z: number): void {
    if (z === this.zone) return;
    if (this.cleanZone === -1 && this.zone === 0) this.cleanZone = z;
    else if (this.zone > 0 && z === this.zone + 1) this.cleanZone = z;
    else this.cleanZone = 0;
    this.zone = z;
    this.fight = null;
  }

  private watchFight(w: World, me: Entity | null, c: Character): void {
    const bid = w.bossId;
    // between fights the last record stays until a new boss, a death or a new zone
    if (!bid) return;
    if (!this.fight || this.fight.bossId !== bid) this.fight = { bossId: bid, flask: c.flaskCur, drank: false, armed: false };
    const f = this.fight;
    if (c.flaskCur < f.flask || me?.pl?.state === 'flask') f.drank = true;
    f.flask = c.flaskCur;
    if (c.equipment.main) f.armed = true;
  }

  private watchLoad(w: World, me: Entity): void {
    const t = w.time;
    const dt = this.lastTime < 0 ? 0 : Math.max(0, Math.min(0.25, t - this.lastTime));
    this.lastTime = t;
    const pl = me.pl!;
    if (pl.derived?.load?.tier === 'encumbered' && !pl.downed && !pl.deadUntilRest) {
      this.encumberedS += dt;
      if (Math.floor(this.encumberedS) > (this.rec.counters.encumberedS ?? 0)) this.max('encumberedS', Math.floor(this.encumberedS));
    } else this.encumberedS = 0;
  }

  private event(ev: GameEvent, pid: string, c: Character): void {
    switch (ev.t) {
      case 'death': {
        if (ev.isPlayer || !ev.defId) return;
        const until = this.ripostes.get(ev.id);
        if (until !== undefined) {
          this.ripostes.delete(ev.id);
          this.add('riposteKills');
        }
        const boss = BOSSES[ev.defId];
        if (boss) this.bossDown(boss.id, boss.zone, c);
        if (ev.defId === INSTRUCTOR.id) this.flag('instructor');
        if (ev.defId === MIMIC.id) this.flag('mimicKill');
        if (countsAsKill(ev.defId)) this.add('kills');
        return;
      }
      case 'parry':
        if (ev.playerId === pid) this.add('parries');
        return;
      case 'feat':
        if (ev.playerId !== pid) return;
        if (ev.kind === 'riposte') {
          if (this.ripostes.size > 32) this.ripostes.clear();
          this.ripostes.set(ev.targetId, this.frames + 30);
        } else if (ev.kind === 'revive') this.flag('revive');
        else if (ev.kind === 'downAlly') this.flag('ffDown');
        else if (ev.kind === 'abandonAlly') this.flag('ffAbandon');
        return;
      case 'loot':
        if (ev.rarity === 'legendary' && (ev.playerId === pid || ev.playerId === '')) this.flag('legendary');
        return;
      default:
    }
  }

  private bossDown(bossId: string, zone: number, c: Character): void {
    this.flag(`boss:${bossId}`);
    this.flag(`class:${c.classId}`);
    if (zone === 8 && this.cycle >= 1) this.flag('ng1');
    if (zone === 8 && this.cycle >= 2) this.flag('ng2');
    const f = this.fight;
    if (f && !f.drank) this.flag('flaskless');
    if (f && !f.armed && !c.equipment.main) this.flag('fists');
    if (this.cleanZone > 0 && this.cleanZone === zone) this.flag(`clean:${zone}`);
    this.fight = null;
  }

  /** The slower checks on the character and the party, twice a second. */
  private poll(w: World, c: Character): void {
    for (const [id, until] of this.ripostes) if (until < this.frames) this.ripostes.delete(id);
    this.max('level', c.level);
    this.max('glowen', Math.floor(c.glowen));
    this.max('party', w.players.length);
    if (!this.view.count('legendary') && itemsOf(c).some((it) => it.rarity === 'legendary')) this.flag('legendary');
    if (!this.view.count('fullSet') && wearsFullSet(c)) this.flag('fullSet');
    if (!this.view.count('gemMax') && hasMaxGem(c)) this.flag('gemMax');
    if (!this.view.count('gemPerfect') && hasPerfectGem(c)) this.flag('gemPerfect');
    if (!this.view.count('plusMax') && hasMaxReinforce(c)) this.flag('plusMax');
    if (!this.view.count('gary') && w.enemies.some((e) => e.en?.def.id === GARY.id && !e.removed)) this.flag('gary');
  }
}

let shared: AchievementTracker | null = null;

/** The account's tracker (created on first use from the browser's storage, or memory when blocked). */
export function achievements(): AchievementTracker {
  shared ??= new AchievementTracker(getStore());
  return shared;
}

export { ACHIEVEMENTS, ACHIEVEMENT_BY_ID };
