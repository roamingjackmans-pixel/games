// Character sync (NETCODE §6). Each guest owns its character; the host keeps a copy for the simulation.
// What the simulation changes on that copy (Shards, loot, Thermos, consumables, a weapon swap, bosses
// beaten) becomes a numbered list of ops sent to the guest. When the guest changes its character itself
// (equip, level up, gems, spells) it sends the whole character with the last op number it applied, and
// the host replays any newer ops on top so nothing granted in flight is lost.
import type { Character, ConsumableId, Gem, Item } from '../types';

export type CharOp =
  | { op: 'add'; key: 'shards' | 'glowen' | 'tears' | 'bossesBeaten'; n: number }
  | { op: 'set'; key: 'flaskCur' | 'flaskMax' | 'highestZoneBeaten' | 'twoHanded' | 'quickSlot'; v: number | boolean | string | null }
  | { op: 'bag'; item: Item }
  | { op: 'gem'; gem: Gem }
  | { op: 'consumable'; id: ConsumableId; n: number }
  | { op: 'spell'; id: string }
  | { op: 'gear'; equipment: Character['equipment']; altMain: Item | null }
  /** weapon-class proficiency experience gained (D178) */
  | { op: 'prof'; cls: string; n: number }
  /** Soul Essence picked up (D198): n more of tier */
  | { op: 'essence'; tier: number; n: number };

export function cloneChar(c: Character): Character {
  return JSON.parse(JSON.stringify(c)) as Character;
}

/** Ops that turn `base` into `cur` for the fields the simulation may change. */
export function diffChar(base: Character, cur: Character): CharOp[] {
  const ops: CharOp[] = [];
  for (const key of ['shards', 'glowen', 'tears', 'bossesBeaten'] as const) if (cur[key] !== base[key]) ops.push({ op: 'add', key, n: cur[key] - base[key] });
  for (const key of ['flaskCur', 'flaskMax', 'highestZoneBeaten', 'twoHanded', 'quickSlot'] as const) if (cur[key] !== base[key]) ops.push({ op: 'set', key, v: cur[key] });
  const had = new Set(base.bag.map((i) => i.id));
  for (const it of cur.bag) if (!had.has(it.id)) ops.push({ op: 'bag', item: it });
  for (let i = base.gems.length; i < cur.gems.length; i++) ops.push({ op: 'gem', gem: cur.gems[i]! });
  const ids = new Set([...Object.keys(base.consumables), ...Object.keys(cur.consumables)]) as Set<ConsumableId>;
  for (const id of ids) if ((cur.consumables[id] ?? 0) !== (base.consumables[id] ?? 0)) ops.push({ op: 'consumable', id, n: cur.consumables[id] ?? 0 });
  for (const s of cur.knownSpells) if (!base.knownSpells.includes(s)) ops.push({ op: 'spell', id: s });
  for (const [cls, v] of Object.entries(cur.proficiency ?? {})) {
    const d = v - (base.proficiency?.[cls] ?? 0);
    if (d > 0) ops.push({ op: 'prof', cls, n: d });
  }
  for (let i = 0; i < 5; i++) {
    const d = (cur.essence?.[i] ?? 0) - (base.essence?.[i] ?? 0);
    if (d !== 0) ops.push({ op: 'essence', tier: i + 1, n: d });
  }
  if (JSON.stringify(cur.equipment) !== JSON.stringify(base.equipment) || JSON.stringify(cur.altMain) !== JSON.stringify(base.altMain)) {
    ops.push({ op: 'gear', equipment: JSON.parse(JSON.stringify(cur.equipment)) as Character['equipment'], altMain: cur.altMain ? (JSON.parse(JSON.stringify(cur.altMain)) as Item) : null });
  }
  return ops;
}

export function applyCharOp(c: Character, o: CharOp): void {
  switch (o.op) {
    case 'add':
      c[o.key] = Math.max(0, c[o.key] + o.n);
      break;
    case 'set':
      (c as unknown as Record<string, unknown>)[o.key] = o.v;
      break;
    case 'bag':
      if (!c.bag.some((i) => i.id === o.item.id)) c.bag.push(o.item);
      break;
    case 'gem':
      c.gems.push(o.gem);
      break;
    case 'essence': {
      const e = [0, 1, 2, 3, 4].map((i) => c.essence?.[i] ?? 0);
      const i = Math.max(1, Math.min(5, o.tier)) - 1;
      e[i] = Math.max(0, e[i]! + o.n);
      c.essence = e;
      break;
    }
    case 'consumable':
      if (o.n > 0) c.consumables[o.id] = o.n;
      else delete c.consumables[o.id];
      break;
    case 'spell':
      if (!c.knownSpells.includes(o.id)) c.knownSpells.push(o.id);
      break;
    case 'gear':
      c.equipment = o.equipment;
      c.altMain = o.altMain;
      break;
    case 'prof':
      c.proficiency ??= {};
      c.proficiency[o.cls] = (c.proficiency[o.cls] ?? 0) + o.n;
      break;
  }
}

/** Replace a character object's contents in place (entities and the session hold the same object). */
export function assignChar(target: Character, src: Character): void {
  const t = target as unknown as Record<string, unknown>;
  for (const k of Object.keys(t)) delete t[k];
  Object.assign(target, cloneChar(src));
}

/** Host side: the op log for one guest. */
export class CharLog {
  rev = 0;
  private log: { rev: number; op: CharOp }[] = [];
  private base: Character;
  constructor(char: Character) {
    this.base = cloneChar(char);
  }

  /** New ops since the last call (empty when nothing changed). */
  collect(cur: Character): { rev: number; ops: CharOp[] } | null {
    const ops = diffChar(this.base, cur);
    if (!ops.length) return null;
    this.base = cloneChar(cur);
    for (const op of ops) this.log.push({ rev: ++this.rev, op });
    return { rev: this.rev, ops };
  }

  /** The guest sent its own character having applied ops up to `ack`: adopt it plus anything newer. */
  adopt(host: Character, guest: Character, ack: number): void {
    const next = cloneChar(guest);
    for (const l of this.log) if (l.rev > ack) applyCharOp(next, l.op);
    this.log = this.log.filter((l) => l.rev > ack);
    assignChar(host, next);
    this.base = cloneChar(next);
  }
}
