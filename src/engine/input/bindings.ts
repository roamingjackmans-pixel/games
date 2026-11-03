// Key bindings table (GAME_DESIGN §4 defaults, D34 rebinding) with serialisation and conflict detection.
import { ALL_ACTIONS, type Action } from './actions';

/** Keyboard codes are KeyboardEvent.code values plus 'Mouse0'..'Mouse4' / 'WheelUp' / 'WheelDown'. */
export type KeyboardBindings = Record<Action, string[]>;
/**
 * Gamepad values are standard-mapping button indices (0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 View,
 * 9 Menu, 10 LS, 11 RS, 12 Up, 13 Down, 14 Left, 15 Right). 100 + n means "hold button n for 0.5 s".
 */
export type GamepadBindings = Record<Action, number[]>;

export const HOLD = 100;
/** Standard-mapping buttons 0..15 can be captured by the rebinding UI (16+ are Guide / touchpad, left alone). */
export const PAD_BUTTON_COUNT = 16;

/**
 * Gamepad buttons for the DOM menus (confirm = click the focused control, back = Escape). They live apart from
 * the gameplay table because they overlap it on purpose (A both dodges and confirms). D-pad / left-stick
 * focus movement stays fixed.
 */
export interface MenuPadBindings {
  confirm: number;
  back: number;
}

export function defaultMenuPad(): MenuPadBindings {
  return { confirm: 0, back: 1 };
}

/** Menu confirm / back can be any button except the D-pad (12..15), which moves the menu focus. */
export function menuPadAllowed(v: number): boolean {
  return Number.isInteger(v) && v >= 0 && v < 12;
}

export function normalizeMenuPad(b: Partial<Record<string, unknown>> | undefined): MenuPadBindings {
  const d = defaultMenuPad();
  const ok = (v: unknown): v is number => typeof v === 'number' && menuPadAllowed(v);
  const c = b?.confirm;
  const k = b?.back;
  const confirm = ok(c) ? c : d.confirm;
  let back = ok(k) ? k : d.back;
  if (back === confirm) back = confirm === d.back ? d.confirm : d.back;
  return { confirm, back };
}

export function defaultKeyboard(): KeyboardBindings {
  return {
    moveUp: ['KeyW'],
    moveDown: ['KeyS'],
    moveLeft: ['KeyA'],
    moveRight: ['KeyD'],
    attack: ['Mouse0'],
    block: ['Mouse2'],
    dodge: ['Space'],
    skill1: ['KeyQ'],
    skill2: ['KeyE'],
    skill3: ['KeyR'],
    spell1: ['Digit1'],
    spell2: ['Digit2'],
    spell3: ['Digit3'],
    flask: ['KeyC'],
    quick: ['KeyG'],
    interact: ['KeyF'],
    twoHand: ['ShiftLeft', 'ShiftRight'],
    swapWeapon: ['KeyX'],
    inventory: ['Tab', 'KeyI'],
    map: ['KeyM'],
    pause: ['Escape', 'KeyP'],
    cycleQuick: ['WheelDown', 'KeyT'],
  };
}

export function defaultGamepad(): GamepadBindings {
  return {
    moveUp: [],
    moveDown: [],
    moveLeft: [],
    moveRight: [],
    attack: [7],
    block: [6],
    dodge: [1],
    skill1: [4],
    skill2: [5],
    skill3: [3],
    spell1: [14],
    spell2: [12],
    spell3: [15],
    flask: [2],
    quick: [13],
    interact: [0],
    twoHand: [11],
    swapWeapon: [10],
    inventory: [8],
    map: [HOLD + 8],
    pause: [9],
    cycleQuick: [HOLD + 13],
  };
}

export const PAD_NAMES: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'View',
  9: 'Menu',
  10: 'LS click',
  11: 'RS click',
  12: 'D-pad up',
  13: 'D-pad down',
  14: 'D-pad left',
  15: 'D-pad right',
};

export function padName(v: number): string {
  if (v >= HOLD) return `Hold ${PAD_NAMES[v - HOLD] ?? `#${v - HOLD}`}`;
  return PAD_NAMES[v] ?? `Button ${v}`;
}

export function keyName(code: string): string {
  if (code === 'Mouse0') return 'Left click';
  if (code === 'Mouse1') return 'Middle click';
  if (code === 'Mouse2') return 'Right click';
  if (code === 'Mouse3') return 'Mouse 4';
  if (code === 'Mouse4') return 'Mouse 5';
  if (code === 'WheelUp') return 'Wheel up';
  if (code === 'WheelDown') return 'Wheel down';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
  if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
  return code;
}

/** Fill any missing actions from defaults (older saved settings) and drop unknown keys. */
export function normalizeKeyboard(b: Partial<Record<string, unknown>> | undefined): KeyboardBindings {
  const d = defaultKeyboard();
  const out = {} as KeyboardBindings;
  for (const a of ALL_ACTIONS) {
    const v = b?.[a];
    out[a] = Array.isArray(v) && v.every((x) => typeof x === 'string') ? [...(v as string[])] : d[a];
  }
  return out;
}

export function normalizeGamepad(b: Partial<Record<string, unknown>> | undefined): GamepadBindings {
  const d = defaultGamepad();
  const out = {} as GamepadBindings;
  for (const a of ALL_ACTIONS) {
    const v = b?.[a];
    out[a] = Array.isArray(v) && v.every((x) => typeof x === 'number') ? [...(v as number[])] : d[a];
  }
  // settings saved with the old layout (dodge on A, interact on B, untouched) move to A = interact, B = dodge (D122)
  if (out.dodge.length === 1 && out.dodge[0] === 0 && out.interact.length === 1 && out.interact[0] === 1) {
    out.dodge = [1];
    out.interact = [0];
  }
  return out;
}

export function serializeBindings(kb: KeyboardBindings, pad: GamepadBindings): string {
  return JSON.stringify({ keyboard: kb, gamepad: pad });
}

export function deserializeBindings(s: string): { keyboard: KeyboardBindings; gamepad: GamepadBindings } {
  const o = JSON.parse(s) as { keyboard?: Record<string, unknown>; gamepad?: Record<string, unknown> };
  return { keyboard: normalizeKeyboard(o.keyboard), gamepad: normalizeGamepad(o.gamepad) };
}

/** Actions that share an input with another action (both listed). Movement vs menu overlaps are allowed. */
export function findConflicts<T extends string | number>(b: Record<Action, T[]>): { input: T; actions: Action[] }[] {
  const byInput = new Map<T, Action[]>();
  for (const a of ALL_ACTIONS) {
    for (const k of b[a]) {
      const list = byInput.get(k) ?? [];
      list.push(a);
      byInput.set(k, list);
    }
  }
  const out: { input: T; actions: Action[] }[] = [];
  for (const [input, actions] of byInput) if (actions.length > 1) out.push({ input, actions });
  return out;
}

/** Assign `input` to `action`, removing it from any other action (the rebinding UI's conflict rule). */
export function rebind<T extends string | number>(b: Record<Action, T[]>, action: Action, input: T, slot = 0): Action[] {
  const displaced: Action[] = [];
  for (const a of ALL_ACTIONS) {
    if (a === action) continue;
    const i = b[a].indexOf(input);
    if (i >= 0) {
      b[a].splice(i, 1);
      displaced.push(a);
    }
  }
  const list = b[action].filter((x) => x !== input);
  list[slot] = input;
  b[action] = list.filter((x) => x !== undefined);
  return displaced;
}

export interface RebindResult<T> {
  /** actions that lost `input` */
  displaced: Action[];
  /** set when a displaced action was left with nothing and took over the slot's previous input instead */
  swapped: { action: Action; input: T } | null;
}

/**
 * The rebinding UI's rule: assign `input` to `action` (at `slot`), taking it away from any other action. If that
 * leaves the other action with no input at all, it gets the input this slot held before (a swap), so remapping
 * one button never silently unbinds another action.
 */
export function rebindSwap<T extends string | number>(b: Record<Action, T[]>, action: Action, input: T, slot = 0): RebindResult<T> {
  const prev = b[action][slot];
  const displaced = rebind(b, action, input, slot);
  let swapped: RebindResult<T>['swapped'] = null;
  if (prev !== undefined && prev !== input && !ALL_ACTIONS.some((a) => b[a].includes(prev))) {
    const orphan = displaced.find((a) => b[a].length === 0);
    if (orphan) {
      b[orphan] = [prev];
      swapped = { action: orphan, input: prev };
    }
  }
  return { displaced, swapped };
}

/** Actions with no input at all in this table (the settings screen warns about them). */
export function unboundActions<T extends string | number>(b: Record<Action, T[]>, skip: (a: Action) => boolean = () => false): Action[] {
  return ALL_ACTIONS.filter((a) => !skip(a) && b[a].length === 0);
}
