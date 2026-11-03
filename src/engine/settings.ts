// Global settings (`dj.settings`, DATA_MODEL §5), merged over defaults on load.
import {
  defaultGamepad,
  defaultKeyboard,
  defaultMenuPad,
  normalizeGamepad,
  normalizeKeyboard,
  normalizeMenuPad,
  type GamepadBindings,
  type KeyboardBindings,
  type MenuPadBindings,
} from './input/bindings';

/** Which button pictures prompts show: 'auto' follows the last device used (keyboard/mouse, or the pad's brand). */
export type PromptSetting = 'auto' | 'keyboard' | 'xbox' | 'playstation';
export const PROMPT_SETTINGS: readonly PromptSetting[] = ['auto', 'keyboard', 'xbox', 'playstation'];

/** When the on-screen touch controller shows (D143). */
export type TouchMode = 'auto' | 'on' | 'off';
export const TOUCH_MODES: readonly TouchMode[] = ['auto', 'on', 'off'];

export interface Settings {
  video: {
    scale: number;
    fullscreen: boolean;
    shake: number;
    hitstop: boolean;
    damageNumbers: boolean;
    highContrastTelegraphs: boolean;
    telegraphIconSize: 1 | 2;
    frameCap: 0 | 30 | 60 | 120;
    showFps: boolean;
  };
  audio: { master: number; sfx: number; music: number };
  controls: {
    keyboard: KeyboardBindings;
    gamepad: GamepadBindings;
    /** gamepad confirm / back inside the DOM menus */
    menuPad: MenuPadBindings;
    aimAssist: number;
    holdToBlock: boolean;
    prompts: PromptSetting;
    /** the on-screen touch controller (D143): auto = on phones and tablets */
    touch: { mode: TouchMode; size: number; opacity: number };
  };
  net: { name: string };
  /** co-op rules the host sets for the whole party (D115) */
  game: {
    /** friendly fire: how hard your attacks hit co-op allies, in percent (0 = off … 200), steps of 10 */
    friendlyFire: number;
  };
}

/** Friendly fire range and default (D115). */
export const FRIENDLY_FIRE_MAX = 200;
export const FRIENDLY_FIRE_STEP = 10;
export const FRIENDLY_FIRE_DEFAULT = 100;

/** Clamp a friendly-fire percent to 0–200 in steps of 10 (anything unreadable is the default, 100). */
export function normalizeFriendlyFire(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return FRIENDLY_FIRE_DEFAULT;
  return Math.min(FRIENDLY_FIRE_MAX, Math.max(0, Math.round(v / FRIENDLY_FIRE_STEP) * FRIENDLY_FIRE_STEP));
}

export const SETTINGS_KEY = 'dj.settings';

export function defaultSettings(): Settings {
  return {
    video: {
      scale: 1,
      fullscreen: false,
      shake: 0.8,
      hitstop: true,
      damageNumbers: true,
      highContrastTelegraphs: false,
      telegraphIconSize: 1,
      frameCap: 0,
      showFps: false,
    },
    audio: { master: 0.8, sfx: 0.9, music: 0.6 },
    controls: { keyboard: defaultKeyboard(), gamepad: defaultGamepad(), menuPad: defaultMenuPad(), aimAssist: 0.6, holdToBlock: true, prompts: 'auto', touch: { mode: 'auto', size: 1, opacity: 0.75 } },
    net: { name: 'Joe' },
    game: { friendlyFire: FRIENDLY_FIRE_DEFAULT },
  };
}

function num(v: unknown, d: number, lo: number, hi: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
}
function bool(v: unknown, d: boolean): boolean {
  return typeof v === 'boolean' ? v : d;
}

/** Validate and merge an unknown object over the defaults. */
export function normalizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> | undefined>;
  const v = o.video ?? {};
  const a = o.audio ?? {};
  const c = o.controls ?? {};
  const n = o.net ?? {};
  const g = o.game ?? {};
  const cap = v.frameCap;
  return {
    video: {
      scale: num(v.scale, d.video.scale, 0.5, 1),
      fullscreen: bool(v.fullscreen, d.video.fullscreen),
      shake: num(v.shake, d.video.shake, 0, 1),
      hitstop: bool(v.hitstop, d.video.hitstop),
      damageNumbers: bool(v.damageNumbers, d.video.damageNumbers),
      highContrastTelegraphs: bool(v.highContrastTelegraphs, d.video.highContrastTelegraphs),
      telegraphIconSize: v.telegraphIconSize === 2 ? 2 : 1,
      frameCap: cap === 30 || cap === 60 || cap === 120 ? cap : 0,
      showFps: bool(v.showFps, d.video.showFps),
    },
    audio: {
      master: num(a.master, d.audio.master, 0, 1),
      sfx: num(a.sfx, d.audio.sfx, 0, 1),
      music: num(a.music, d.audio.music, 0, 1),
    },
    controls: {
      keyboard: normalizeKeyboard(c.keyboard as Record<string, unknown> | undefined),
      gamepad: normalizeGamepad(c.gamepad as Record<string, unknown> | undefined),
      menuPad: normalizeMenuPad(c.menuPad as Record<string, unknown> | undefined),
      aimAssist: num(c.aimAssist, d.controls.aimAssist, 0, 1),
      holdToBlock: bool(c.holdToBlock, d.controls.holdToBlock),
      prompts: PROMPT_SETTINGS.includes(c.prompts as PromptSetting) ? (c.prompts as PromptSetting) : d.controls.prompts,
      touch: (() => {
        const t = (c.touch ?? {}) as Record<string, unknown>;
        return {
          mode: TOUCH_MODES.includes(t.mode as TouchMode) ? (t.mode as TouchMode) : d.controls.touch.mode,
          size: num(t.size, d.controls.touch.size, 0.7, 1.4),
          opacity: num(t.opacity, d.controls.touch.opacity, 0.25, 1),
        };
      })(),
    },
    net: { name: typeof n.name === 'string' && n.name.trim() ? n.name.trim().slice(0, 16) : d.net.name },
    game: { friendlyFire: normalizeFriendlyFire(g.friendlyFire) },
  };
}

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** In-memory store for tests and when localStorage is blocked. */
export class MemoryStore implements KeyValueStore {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, v);
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  keys(): string[] {
    return [...this.m.keys()];
  }
}

export function getStore(): KeyValueStore {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dj.probe', '1');
      localStorage.removeItem('dj.probe');
      return localStorage;
    }
  } catch {
    // private mode / blocked storage
  }
  return fallback;
}
const fallback = new MemoryStore();

export function loadSettings(store: KeyValueStore = getStore()): Settings {
  try {
    const s = store.getItem(SETTINGS_KEY);
    return normalizeSettings(s ? JSON.parse(s) : null);
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: Settings, store: KeyValueStore = getStore()): void {
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // storage full or blocked; settings stay in memory
  }
}
