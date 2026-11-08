// Per-character controller layouts: each character keeps its own gamepad bindings, menu confirm /
// back and aim assist, so a caster can lay the pad out differently from a sword-and-shield player.
//
// The live `settings.controls` always holds the layout in use: while a character plays, its copy is swapped in, and
// the global one (what the title screen edits and what a character without a layout copies) is kept aside here.
// `diskSettings` puts the global layout back for writing `dj.settings`, so a character's layout never leaks into it.
import { defaultGamepad, defaultMenuPad, normalizeGamepad, normalizeMenuPad, type GamepadBindings, type MenuPadBindings } from './input/bindings';
import type { Settings } from './settings';

/** The controller settings a character owns. Keyboard, prompts, block mode and touch controls stay global. */
export interface PadLayout {
  gamepad: GamepadBindings;
  menuPad: MenuPadBindings;
  aimAssist: number;
}

/** Anything that can own a pad layout (a Character). */
export interface PadOwnerChar {
  name: string;
  pad?: PadLayout;
}

export function defaultPadLayout(): PadLayout {
  return { gamepad: defaultGamepad(), menuPad: defaultMenuPad(), aimAssist: 0.6 };
}

/** A saved layout, checked (anything unreadable falls back to `fallback`, else the defaults). */
export function normalizePadLayout(raw: unknown, fallback: PadLayout = defaultPadLayout()): PadLayout {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const aa = o.aimAssist;
  return {
    gamepad: o.gamepad && typeof o.gamepad === 'object' ? normalizeGamepad(o.gamepad as Record<string, unknown>) : clonePad(fallback).gamepad,
    menuPad: o.menuPad && typeof o.menuPad === 'object' ? normalizeMenuPad(o.menuPad as Record<string, unknown>) : { ...fallback.menuPad },
    aimAssist: typeof aa === 'number' && Number.isFinite(aa) ? Math.min(1, Math.max(0, aa)) : fallback.aimAssist,
  };
}

export function clonePad(p: PadLayout): PadLayout {
  return JSON.parse(JSON.stringify(p)) as PadLayout;
}

/** The layout the live settings hold right now (a copy). */
export function padOf(s: Settings): PadLayout {
  return clonePad({ gamepad: s.controls.gamepad, menuPad: s.controls.menuPad, aimAssist: s.controls.aimAssist });
}

function putPad(s: Settings, p: PadLayout): void {
  const c = clonePad(p);
  s.controls.gamepad = c.gamepad;
  s.controls.menuPad = c.menuPad;
  s.controls.aimAssist = c.aimAssist;
}

interface Owner {
  char: PadOwnerChar;
  /** save the character (its save file) after its layout changed */
  commit: () => void;
}

let owner: Owner | null = null;
/** the global layout, kept aside while a character's is live */
let globalPad: PadLayout | null = null;

/**
 * A character starts playing: its layout goes live. A character without one (made before per-character layouts, or new)
 * copies the global layout first.
 */
export function usePadOf(s: Settings, char: PadOwnerChar, commit: () => void): void {
  if (owner?.char === char) return;
  if (owner) releasePad(s);
  globalPad = padOf(s);
  if (!char.pad) {
    char.pad = clonePad(globalPad);
    commit();
  } else char.pad = normalizePadLayout(char.pad, globalPad);
  owner = { char, commit };
  putPad(s, char.pad);
}

/** The character stops playing: its layout is stored on it and the global one goes live again. */
export function releasePad(s: Settings, char?: PadOwnerChar): void {
  if (!owner || (char && owner.char !== char)) return;
  syncPad(s);
  if (globalPad) putPad(s, globalPad);
  owner = null;
  globalPad = null;
}

/** After a settings change: a character's live layout is copied onto it (and saved) when it changed. */
export function syncPad(s: Settings): void {
  if (!owner) return;
  const cur = padOf(s);
  if (JSON.stringify(cur) === JSON.stringify(owner.char.pad)) return;
  owner.char.pad = cur;
  owner.commit();
}

/** The settings as `dj.settings` stores them: the global pad layout, never a character's. */
export function diskSettings(s: Settings): Settings {
  if (!owner || !globalPad) return s;
  const g = clonePad(globalPad);
  return { ...s, controls: { ...s.controls, gamepad: g.gamepad, menuPad: g.menuPad, aimAssist: g.aimAssist } };
}

/** Whose controller layout the settings screen edits: a character's name, or null for the global one. */
export function padOwnerName(): string | null {
  return owner ? owner.char.name : null;
}

/** Tests: forget any owner. */
export function resetPadProfile(): void {
  owner = null;
  globalPad = null;
}

/** While a character plays: copy the global layout over its own (the settings screen's "Use the default layout"). */
export function adoptGlobalPad(s: Settings): boolean {
  if (!owner || !globalPad) return false;
  putPad(s, globalPad);
  return true;
}

/** While a character plays: make its layout the global one too, which characters without a layout copy. */
export function shareAsGlobalPad(s: Settings): boolean {
  if (!owner) return false;
  globalPad = padOf(s);
  return true;
}
