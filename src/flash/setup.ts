// A FlashGames run (D452, GAME_DESIGN §25): Joe and his world built from the day's seed and modifiers, with no menu.
// Everyone playing that day gets the same class, look, kit and map. The save lives only in memory (main.ts gives the
// run a store that never writes to the browser), so no save slot, setting or record of the normal game is touched.
import { CLASS_IDS } from '../data/classes';
import { randomAppearance } from '../data/appearance';
import { stream } from '../engine/rng';
import { levelFromStats, newCharacter } from '../game/player/character';
import { neutralRunMods, setRunMods, type RunMods } from '../game/runMods';
import { newSave } from '../game/save/schema';
import type { ClassId, SaveFile } from '../game/types';
import { FLASH_MODIFIER_BY_ID, type FlashModifier, type FlashRules } from './modifiers';

export interface FlashConfig {
  seed: number;
  mods: readonly string[];
  /** FlashRun.rng: a seeded generator in [0, 1) per salt */
  rng(salt: string): () => number;
}

export interface FlashSetup {
  save: SaveFile;
  mods: RunMods;
  rules: FlashRules;
  /** the day's modifiers this game knows, in the day's order */
  active: FlashModifier[];
  /** ids it does not know (ignored) */
  unknown: string[];
  classId: ClassId;
}

/** The run's world seed: every zone, wave, chest and drop of the day comes from it (PROCGEN §1). */
export function flashWorldSeed(seed: number): string {
  return `FLASH-${seed >>> 0}`;
}

/** The modifiers of the day that this game knows (duplicates once), and the ones it does not. */
export function knownMods(ids: readonly string[]): { active: FlashModifier[]; unknown: string[] } {
  const active: FlashModifier[] = [];
  const unknown: string[] = [];
  for (const id of ids) {
    const m = FLASH_MODIFIER_BY_ID[id];
    if (!m) unknown.push(id);
    else if (!active.includes(m)) active.push(m);
  }
  return { active, unknown };
}

/** The run modifiers and scene rules a set of FlashGames modifiers adds up to. */
export function flashModsOf(active: readonly FlashModifier[]): { mods: RunMods; rules: FlashRules } {
  const mods = neutralRunMods();
  const rules: FlashRules = { steps: 1, oneLife: false, dark: false };
  for (const m of active) {
    m.mods?.(mods);
    if (m.rules) Object.assign(rules, m.rules);
  }
  return { mods, rules };
}

/**
 * Build the day's run (pure: nothing global changes until applyFlashRun). The class comes from FlashRun.rng('class');
 * a new character's tutorial is skipped; the kit modifiers (Wrong Bag, Spells Only) and then the stat ones (Glass Joe)
 * change the class's start.
 */
export function planFlashRun(cfg: FlashConfig): FlashSetup {
  const { active, unknown } = knownMods(cfg.mods);
  const { mods, rules } = flashModsOf(active);
  const seed = flashWorldSeed(cfg.seed);
  const pick = cfg.rng('class');
  const classId = CLASS_IDS[Math.min(CLASS_IDS.length - 1, Math.floor(pick() * CLASS_IDS.length))]!;
  const ch = newCharacter(classId, 'Joe', 'flash-joe', stream(seed, 'kit'));
  ch.appearance = randomAppearance(stream(seed, 'look'), cfg.rng('look')() < 0.5 ? 'male' : 'female');
  ch.tutorialDone = true;
  const kit = { rng: (salt: string) => cfg.rng(`kit:${salt}`) };
  for (const m of active) m.kit?.(ch, kit);
  for (const m of active) m.stats?.(ch);
  ch.level = levelFromStats(ch);
  ch.flaskCur = mods.noFlask ? 0 : ch.flaskMax;
  // slot 0 is no slot of the ten (1–10): even a stray write could never land on a real save
  const save = newSave(0, ch, seed, new Date(0));
  return { save, mods, rules, active, unknown, classId };
}

/** Put the run's modifiers in force (the systems read them from src/game/runMods.ts). */
export function applyFlashRun(s: FlashSetup): void {
  setRunMods(s.mods);
}
