// Save files (DATA_MODEL §1): creation and a hand-written validator (import refuses bad files).
import type { Character, SaveFile, WorldState } from '../types';
import { CLASS_IDS } from '../../data/classes';
import { sanitizeAppearance } from '../../data/appearance';
import { dedupeItemIds } from '../items/inventory';

export const SAVE_VERSION = 3;
export const SLOT_COUNT = 10;

export function newWorldState(seed: string, zone = 1): WorldState {
  return {
    seed,
    zone,
    roomId: `z${zone}-start`,
    respawnBonfireId: `z${zone}-start`,
    bonfiresUsed: [],
    bonfiresUsedByPlayer: {},
    bonfiresDiscovered: [],
    roomsCleared: [],
    roomsVisited: [],
    chestsOpened: [],
    mimicsKilled: [],
    mimicsAwake: [],
    reliquariesOpened: [],
    bossesBeatenThisCycle: [],
    garyGone: false,
    garyStock: {},
    shopStock: {},
    leftBehind: {},
    bossKilled: [],
  };
}

export function newSave(slot: number, character: Character, seed: string, now = new Date()): SaveFile {
  const iso = now.toISOString();
  return {
    version: SAVE_VERSION,
    slot,
    createdAt: iso,
    updatedAt: iso,
    character,
    world: newWorldState(seed),
    stats: { deaths: 0, kills: 0, bossKills: 0, playtimeSec: 0, elitesKilled: 0, mimicsKilled: 0, mimicDeaths: 0 },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function validItem(v: unknown): boolean {
  if (v === null) return true;
  if (!isObj(v)) return false;
  return isStr(v.id) && isStr(v.baseId) && isStr(v.slot) && isStr(v.kind) && isStr(v.rarity) && isNum(v.ilvl) && isStr(v.name) && Array.isArray(v.affixes) && Array.isArray(v.sockets);
}

/** Validate an unknown object as a SaveFile of a version we can read. Returns a list of problems (empty = ok). */
export function validateSave(raw: unknown, maxVersion = SAVE_VERSION): string[] {
  const p: string[] = [];
  if (!isObj(raw)) return ['not an object'];
  if (!isNum(raw.version)) p.push('missing version');
  else if (raw.version > maxVersion) p.push(`save version ${raw.version} is newer than this game (${maxVersion})`);
  else if (raw.version < 1) p.push('bad version');
  const c = raw.character;
  if (!isObj(c)) p.push('missing character');
  else {
    if (!isStr(c.playerId) || !isStr(c.name)) p.push('character id/name');
    if (!isStr(c.classId) || !CLASS_IDS.includes(c.classId as never)) p.push('unknown class');
    if (!isNum(c.level) || c.level < 1) p.push('level');
    const st = c.stats;
    if (!isObj(st) || !['hp', 'endurance', 'bonk', 'slicey', 'brain', 'prayer'].every((k) => isNum(st[k]))) p.push('stats');
    for (const k of ['shards', 'glowen', 'flaskMax', 'flaskCur', 'bossesBeaten', 'highestZoneBeaten', 'cycle', 'tears']) if (!isNum(c[k])) p.push(`character.${k}`);
    const eq = c.equipment;
    if (!isObj(eq) || !['main', 'off', 'head', 'body', 'legs', 'ring1', 'ring2'].every((k) => k in eq && validItem(eq[k]))) p.push('equipment');
    if (!Array.isArray(c.bag) || !c.bag.every(validItem)) p.push('bag');
    if (!Array.isArray(c.knownSpells)) p.push('knownSpells');
    if (!isObj(c.spellLoadout)) p.push('spellLoadout');
  }
  const w = raw.world;
  if (!isObj(w)) p.push('missing world');
  else {
    if (!isStr(w.seed) || !isNum(w.zone) || !isStr(w.roomId) || !isStr(w.respawnBonfireId)) p.push('world basics');
    for (const k of ['bonfiresUsed', 'roomsCleared', 'chestsOpened', 'bossesBeatenThisCycle']) if (!Array.isArray(w[k])) p.push(`world.${k}`);
  }
  if (!isObj(raw.stats)) p.push('missing stats');
  return p;
}

/** Fill fields added after a save was written (forward-compatible defaults). */
export function normalizeSave(s: SaveFile): SaveFile {
  const w = s.world as unknown as Record<string, unknown>;
  const d = newWorldState(s.world.seed, s.world.zone) as unknown as Record<string, unknown>;
  for (const k of Object.keys(d)) if (w[k] === undefined) w[k] = d[k];
  const c = s.character as Character & Partial<Character>;
  if (c.altMain === undefined) c.altMain = null;
  // D228: a second off hand and rings 3 and 4
  if (c.altOff === undefined) c.altOff = null;
  if (c.equipment.ring3 === undefined) c.equipment.ring3 = null;
  if (c.equipment.ring4 === undefined) c.equipment.ring4 = null;
  if (c.freePoints === undefined) c.freePoints = 0;
  if (c.quickSlot === undefined) c.quickSlot = null;
  if (!c.consumables) c.consumables = {};
  if (!c.gems) c.gems = [];
  // Soul Essence (D198): five whole, non-negative counts; reinforcement levels 0–15 on every item
  if (c.essence !== undefined) {
    const e = Array.isArray(c.essence) ? c.essence : [];
    c.essence = [0, 1, 2, 3, 4].map((i) => (typeof e[i] === 'number' && Number.isFinite(e[i]) ? Math.max(0, Math.floor(e[i])) : 0));
  }
  const clampPlus = (it: { plus?: unknown } | null): void => {
    if (!it || it.plus === undefined) return;
    const n = typeof it.plus === 'number' && Number.isFinite(it.plus) ? Math.max(0, Math.min(15, Math.floor(it.plus))) : 0;
    if (n) it.plus = n;
    else delete it.plus;
  };
  // D232: items that share an id (drops rolled from a repeated stream) each get their own
  dedupeItemIds(c);
  for (const it of [...Object.values(c.equipment), c.altMain, c.altOff, ...c.bag]) clampPlus(it as { plus?: unknown } | null);
  // statistics: numbers only (a hand-edited or newer file may carry anything)
  const ex = s.stats.extra as unknown;
  if (ex !== undefined) {
    const clean: Record<string, number> = {};
    if (ex && typeof ex === 'object' && !Array.isArray(ex)) for (const [k, v] of Object.entries(ex)) if (typeof v === 'number' && Number.isFinite(v) && v >= 0) clean[k] = v;
    s.stats.extra = clean;
  }
  // optional: saves from before the character creator's appearance keep the class look
  if (c.appearance !== undefined) c.appearance = sanitizeAppearance(c.appearance, c.classId);
  return s;
}
