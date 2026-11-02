// Plain item construction (class kits, debug gifts). The loot generator (generate.ts) builds on this.
import type { Rng } from '../../engine/rng';
import { baseInfo } from './bases';
import type { Gem, Item, Rarity } from '../types';

let fallbackCounter = 0;

/** A uuid-shaped id from a seeded stream (no Math.random in src/game). */
export function newId(rng?: Rng): string {
  const hex = (n: number): string => (n >>> 0).toString(16).padStart(8, '0');
  if (rng) return `${hex(rng.nextU32())}-${hex(rng.nextU32()).slice(0, 4)}-${hex(rng.nextU32()).slice(0, 4)}-${hex(rng.nextU32())}`;
  fallbackCounter++;
  const t = Date.now();
  return `${hex(t / 1000)}-${hex(fallbackCounter).slice(4)}-${hex(t).slice(4)}-${hex(fallbackCounter * 2654435761)}`;
}

export function socketCount(kind: Item['kind'], rarity: Rarity, rng?: Rng): number {
  const isWeapon = kind === 'weapon';
  const isArmor = kind === 'armor';
  if (!isWeapon && !isArmor) return 0;
  switch (rarity) {
    case 'common':
      return 0;
    case 'uncommon':
      return isWeapon ? (rng ? (rng.chance(0.5) ? 1 : 0) : 0) : 0;
    case 'rare':
      return isWeapon ? 1 : rng ? (rng.chance(0.5) ? 1 : 0) : 0;
    case 'epic':
      return isWeapon ? (rng ? (rng.chance(0.5) ? 2 : 1) : 1) : 1;
    case 'legendary':
      return isWeapon ? 2 : 1;
  }
}

export function makeItem(baseId: string, rarity: Rarity = 'common', ilvl = 1, opts: { rng?: Rng; sockets?: number; gems?: Gem[] } = {}): Item {
  const info = baseInfo(baseId);
  if (!info) throw new Error(`Unknown item base ${baseId}`);
  const n = opts.sockets ?? socketCount(info.kind, rarity, opts.rng);
  const sockets: (Gem | null)[] = [];
  for (let i = 0; i < n; i++) sockets.push(opts.gems?.[i] ?? null);
  return {
    id: newId(opts.rng),
    baseId,
    slot: info.slot,
    kind: info.kind,
    rarity,
    ilvl,
    name: info.name,
    affixes: [],
    sockets,
  };
}
