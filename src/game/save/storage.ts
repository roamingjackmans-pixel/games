// Save slots in a key-value store (`dj.save.<1–10>`, `dj.meta`) — GAME_DESIGN §14.
import type { KeyValueStore } from '../../engine/settings';
import type { SaveFile } from '../types';
import { SLOT_COUNT, normalizeSave, validateSave } from './schema';
import { migrate } from './migrations';

export const SAVE_KEY = (slot: number): string => `dj.save.${slot}`;
export const META_KEY = 'dj.meta';

export interface SaveMeta {
  lastSlot: number | null;
  version: string;
}

export function writeSave(store: KeyValueStore, save: SaveFile, now = new Date()): void {
  save.updatedAt = now.toISOString();
  store.setItem(SAVE_KEY(save.slot), JSON.stringify(save));
  writeMeta(store, { lastSlot: save.slot, version: __GAME_VERSION__ });
}

export function readSave(store: KeyValueStore, slot: number): SaveFile | null {
  const raw = store.getItem(SAVE_KEY(slot));
  if (!raw) return null;
  try {
    const obj = migrate(JSON.parse(raw) as unknown);
    if (validateSave(obj).length) return null;
    return normalizeSave(obj as SaveFile);
  } catch {
    return null;
  }
}

export function deleteSave(store: KeyValueStore, slot: number): void {
  store.removeItem(SAVE_KEY(slot));
}

export function listSaves(store: KeyValueStore): (SaveFile | null)[] {
  const out: (SaveFile | null)[] = [];
  for (let i = 1; i <= SLOT_COUNT; i++) out.push(readSave(store, i));
  return out;
}

export function readMeta(store: KeyValueStore): SaveMeta {
  try {
    const raw = store.getItem(META_KEY);
    if (raw) return JSON.parse(raw) as SaveMeta;
  } catch {
    // ignore
  }
  return { lastSlot: null, version: __GAME_VERSION__ };
}

export function writeMeta(store: KeyValueStore, m: SaveMeta): void {
  store.setItem(META_KEY, JSON.stringify(m));
}
