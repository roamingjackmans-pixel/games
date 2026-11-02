// Export / import of one save as a `.dungeonjoe.json` file (DATA_MODEL §1). Import validates the schema and
// refuses versions newer than this game.
import { migrate } from './migrations';
import { SAVE_VERSION, normalizeSave, validateSave } from './schema';
import type { SaveFile } from '../types';

export function exportText(save: SaveFile): string {
  return JSON.stringify(save, null, 2);
}

export function exportFileName(save: SaveFile): string {
  return `${save.character.name.replace(/[^a-z0-9]+/gi, '_')}-slot${save.slot}.dungeonjoe.json`;
}

/** Parse and validate an imported file into `slot`. Returns the save or an error message. */
export function parseImport(text: string, slot: number): SaveFile | string {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return 'That file is not valid JSON.';
  }
  const migrated = migrate(raw);
  const problems = validateSave(migrated, SAVE_VERSION);
  if (problems.length) return `Not a Dungeon Joe save (${problems.slice(0, 3).join(', ')}).`;
  const s = normalizeSave(migrated as SaveFile);
  s.slot = slot;
  return s;
}
