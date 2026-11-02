// Global settings (`dj.settings`, DATA_MODEL §5), merged over defaults on load.
import {
  defaultGamepad,
  defaultKeyboard,
  normalizeGamepad,
  normalizeKeyboard,
  type GamepadBindings,
  type KeyboardBindings,
} from './input/bindings';

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
  controls: { keyboard: KeyboardBindings; gamepad: GamepadBindings; aimAssist: number; holdToBlock: boolean };
  net: { name: string };
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
    controls: { keyboard: defaultKeyboard(), gamepad: defaultGamepad(), aimAssist: 0.6, holdToBlock: true },
    net: { name: 'Joe' },
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
      aimAssist: num(c.aimAssist, d.controls.aimAssist, 0, 1),
      holdToBlock: bool(c.holdToBlock, d.controls.holdToBlock),
    },
    net: { name: typeof n.name === 'string' && n.name.trim() ? n.name.trim().slice(0, 16) : d.net.name },
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
