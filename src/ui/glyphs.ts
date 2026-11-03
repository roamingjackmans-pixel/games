// Button prompts drawn in code (no image files, D8): keyboard keycaps, mouse buttons, Xbox and PlayStation pad
// buttons. Every prompt reads the CURRENT bindings and the chosen prompt style (settings.controls.prompts:
// 'auto' follows the last device used, and a Sony pad gets PlayStation symbols).
//   text:   promptStyle() · glyphText(action) · promptLabel(action, label) · formatPrompts('Drink ({flask})')
//   canvas: drawGlyph(ctx, action, x, y, size) · drawGlyphLabel(ctx, action, label, x, y) · drawPromptText(ctx, tpl, x, y)
//   DOM:    glyphEl(action, size) · inputGlyphEl(input, size) · promptTextEl(tpl, size); live elements follow
//           style / binding changes through refreshGlyphs() (called every frame from pollMenuPad).
// A glyph is built once as resolution-free primitives (paths, circles, text) and painted to a canvas or an SVG.
import { app } from '../app';
import { ACTION_LABEL, ALL_ACTIONS, type Action } from '../engine/input/actions';
import { HOLD, defaultGamepad, defaultKeyboard, defaultMenuPad } from '../engine/input/bindings';
import type { PadKind } from '../engine/input/input';
import type { PromptSetting, Settings } from '../engine/settings';
import { FONT } from '../engine/text';

export type PromptStyle = 'keyboard' | PadKind;
/** Everything a prompt can name: the bindable actions plus the gamepad's menu confirm / back. */
export type GlyphAction = Action | 'menuConfirm' | 'menuBack';
/** One physical input: a keyboard/mouse code (KeyboardEvent.code, 'Mouse0', 'WheelUp'…) or a pad value (n, HOLD + n). */
export type GlyphInput = string | number;

/** Pseudo pad inputs for the sticks (movement and aim are not buttons). */
export const PAD_LSTICK = -1;
export const PAD_RSTICK = -2;

export const GLYPH_ACTIONS: readonly GlyphAction[] = [...ALL_ACTIONS, 'menuConfirm', 'menuBack'];
export const GLYPH_LABEL: Record<GlyphAction, string> = { ...ACTION_LABEL, menuConfirm: 'Menu: confirm', menuBack: 'Menu: back' };

// ---------------------------------------------------------------------------------------------------------------
// where settings and the last device come from (the live app; tests inject their own)

export interface GlyphSource {
  settings(): Settings | null;
  device(): 'kbm' | 'pad';
  padKind(): PadKind;
}

const appSource: GlyphSource = {
  settings: () => {
    try {
      return app().settings;
    } catch {
      return null;
    }
  },
  device: () => {
    try {
      return app().input.lastDevice;
    } catch {
      return 'kbm';
    }
  },
  padKind: () => {
    try {
      return app().input.padKind();
    } catch {
      return 'xbox';
    }
  },
};
let source: GlyphSource = appSource;

/** Tests: read settings / device from somewhere other than the running app (null restores the app). */
export function setGlyphSource(s: GlyphSource | null): void {
  source = s ?? appSource;
  lastSig = '';
}

export function promptSetting(): PromptSetting {
  return source.settings()?.controls.prompts ?? 'auto';
}

/** The resolved prompt style: the setting, or for 'auto' the last device used (and the pad's brand). */
export function promptStyle(): PromptStyle {
  const s = promptSetting();
  if (s !== 'auto') return s;
  return source.device() === 'pad' ? source.padKind() : 'keyboard';
}

/** Which pad pictures the Gamepad settings tab shows: the chosen pad style, else the connected pad's brand. */
export function padStyle(): PadKind {
  const s = promptSetting();
  if (s === 'xbox' || s === 'playstation') return s;
  return source.padKind();
}

/** The inputs bound to `action` for a style, in binding order (current bindings, not the defaults). */
export function actionInputs(action: GlyphAction, style: PromptStyle = promptStyle()): GlyphInput[] {
  const c = source.settings()?.controls;
  if (style === 'keyboard') {
    if (action === 'menuConfirm') return ['Enter'];
    if (action === 'menuBack') return ['Escape'];
    return [...(c?.keyboard ?? defaultKeyboard())[action]];
  }
  if (action === 'menuConfirm' || action === 'menuBack') {
    const m = c?.menuPad ?? defaultMenuPad();
    return [action === 'menuConfirm' ? m.confirm : m.back];
  }
  if (action === 'moveUp' || action === 'moveDown' || action === 'moveLeft' || action === 'moveRight') return [PAD_LSTICK];
  return [...(c?.gamepad ?? defaultGamepad())[action]];
}

/** The first bound input (what a prompt shows), or null when the action has nothing bound in this style. */
export function primaryInput(action: GlyphAction, style: PromptStyle = promptStyle()): GlyphInput | null {
  return actionInputs(action, style)[0] ?? null;
}

// ---------------------------------------------------------------------------------------------------------------
// text

const PAD_TEXT: Record<PadKind, string[]> = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'LS', 'RS', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →', 'Guide'],
  playstation: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →', 'PS'],
};

const KEY_TEXT: Record<string, string> = {
  Mouse0: 'LMB',
  Mouse1: 'MMB',
  Mouse2: 'RMB',
  Mouse3: 'Mouse 4',
  Mouse4: 'Mouse 5',
  WheelUp: 'Wheel ↑',
  WheelDown: 'Wheel ↓',
  Space: 'Space',
  Escape: 'Esc',
  Enter: 'Enter',
  NumpadEnter: 'Num Enter',
  Tab: 'Tab',
  Backspace: 'Bksp',
  CapsLock: 'Caps',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  MetaLeft: 'Win',
  MetaRight: 'Win',
  ContextMenu: 'Menu',
  Delete: 'Del',
  Insert: 'Ins',
  Home: 'Home',
  End: 'End',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  IntlBackslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  NumpadAdd: 'Num +',
  NumpadSubtract: 'Num -',
  NumpadMultiply: 'Num *',
  NumpadDivide: 'Num /',
  NumpadDecimal: 'Num .',
};

/** Short keycap text for a KeyboardEvent.code / mouse code ('KeyE' → 'E', 'ShiftLeft' → 'Shift', 'Mouse0' → 'LMB'). */
export function keyLabel(code: string): string {
  const k = KEY_TEXT[code];
  if (k) return k;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Numpad\d$/.test(code)) return `Num ${code.slice(6)}`;
  return code;
}

function padText(n: number, kind: PadKind): string {
  if (n === PAD_LSTICK) return 'Left stick';
  if (n === PAD_RSTICK) return 'Right stick';
  if (n >= HOLD) return `Hold ${padText(n - HOLD, kind)}`;
  return PAD_TEXT[kind][n] ?? `Button ${n}`;
}

/** Plain text for one input in a style ('RB', 'R1', 'Hold View', 'E', 'LMB'). */
export function inputText(input: GlyphInput, style: PromptStyle = promptStyle()): string {
  if (typeof input === 'string') return keyLabel(input);
  return padText(input, style === 'keyboard' ? 'xbox' : style);
}

/** The prompt text for an action in the current style and bindings ('RB' / 'R1' / 'E'); '—' when unbound. */
export function glyphText(action: GlyphAction, style: PromptStyle = promptStyle()): string {
  const i = primaryInput(action, style);
  return i === null ? '—' : inputText(i, style);
}

/**
 * A one-line prompt: prefix form 'F  Rest' (the in-world style) or suffix form 'Close (Tab)' (menu buttons).
 */
export function promptLabel(action: GlyphAction, label = '', form: 'prefix' | 'suffix' = 'prefix'): string {
  const k = glyphText(action);
  if (!label) return k;
  return form === 'prefix' ? `${k}  ${label}` : `${label} (${k})`;
}

const TOKEN = /\{(\w+)\}/g;
function isGlyphAction(s: string): s is GlyphAction {
  return (GLYPH_ACTIONS as readonly string[]).includes(s);
}

/** Replace {action} tokens with the current prompt text: 'Drink ({flask})' → 'Drink (C)' / 'Drink (X)' / 'Drink (□)'. */
export function formatPrompts(template: string): string {
  return template.replace(TOKEN, (m, name: string) => (isGlyphAction(name) ? glyphText(name) : m));
}

type Segment = { text: string } | { action: GlyphAction };
function segments(template: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of template.matchAll(TOKEN)) {
    const name = m[1]!;
    if (!isGlyphAction(name)) continue;
    if (m.index > last) out.push({ text: template.slice(last, m.index) });
    out.push({ action: name });
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// shapes: resolution-free primitives in a w × h box

interface Paint {
  fill?: string;
  stroke?: string;
  lw?: number;
}
export type GlyphPrim =
  | (Paint & { t: 'path'; d: string })
  | (Paint & { t: 'circle'; x: number; y: number; r: number })
  | { t: 'text'; x: number; y: number; s: string; size: number; fill: string; weight: number; stroke?: string; lw?: number }
  | { t: 'group'; dx: number; prims: GlyphPrim[] };

export interface GlyphShape {
  w: number;
  h: number;
  prims: GlyphPrim[];
  /** plain text for screen readers and tooltips */
  label: string;
}

const C = {
  outline: '#08070b',
  // mid-tones so pad shapes stand out on the dark HUD and dungeon floors as well as on light panels
  body: '#5a5470',
  bodyDark: '#3b3648',
  rim: 'rgba(255,255,255,0.22)',
  light: '#f4efe4',
  ink: '#1a1620',
  accent: '#e6b84a',
  keyFace: '#efe6d2',
  keySide: '#7d7462',
  mouse: '#d9d0bd',
};
const XBOX_FACE = [
  { fill: '#4caf3e', ring: '#1f5a18', s: 'A' },
  { fill: '#e0453a', ring: '#6a1610', s: 'B' },
  { fill: '#3a7fe0', ring: '#143a7a', s: 'X' },
  { fill: '#e7b623', ring: '#6a5008', s: 'Y' },
];
/** PlayStation symbol colours: cross blue, circle red, square pink, triangle green. */
export const PS_COLORS = { cross: '#7fb2ff', circle: '#ff6a7a', square: '#f08ad0', triangle: '#4fd6a8' };

const f = (n: number): number => Math.round(n * 100) / 100;

/** Rounded-rectangle path with per-corner radii [top-left, top-right, bottom-right, bottom-left]. */
function rr(x: number, y: number, w: number, h: number, r: number | [number, number, number, number]): string {
  const m = Math.min(w, h) / 2;
  const [a, b, c, d] = (typeof r === 'number' ? [r, r, r, r] : r).map((v) => Math.min(m, Math.max(0, v))) as [number, number, number, number];
  return (
    `M${f(x + a)},${f(y)}H${f(x + w - b)}A${f(b)},${f(b)} 0 0 1 ${f(x + w)},${f(y + b)}V${f(y + h - c)}` +
    `A${f(c)},${f(c)} 0 0 1 ${f(x + w - c)},${f(y + h)}H${f(x + d)}A${f(d)},${f(d)} 0 0 1 ${f(x)},${f(y + h - d)}` +
    `V${f(y + a)}A${f(a)},${f(a)} 0 0 1 ${f(x + a)},${f(y)}Z`
  );
}

let measureCtx: CanvasRenderingContext2D | null | undefined;
function textWidth(s: string, size: number, weight = 700): number {
  if (measureCtx === undefined) {
    measureCtx = null;
    try {
      if (typeof document !== 'undefined') measureCtx = document.createElement('canvas').getContext('2d');
    } catch {
      measureCtx = null;
    }
  }
  if (measureCtx) {
    measureCtx.font = `${weight} ${size}px ${FONT}`;
    return measureCtx.measureText(s).width;
  }
  let w = 0;
  for (const ch of s) w += /[A-Z0-9]/.test(ch) ? 0.66 : /[a-z]/.test(ch) ? 0.55 : 0.6;
  return w * size;
}

function lineW(S: number): number {
  return Math.max(1, S * 0.07);
}

function keycap(label: string, S: number): GlyphShape {
  const lw = lineW(S);
  const n = [...label].length;
  const fs = n <= 1 ? S * 0.56 : n <= 3 ? S * 0.46 : S * 0.42;
  const w = Math.max(S, textWidth(label, fs) + S * 0.55);
  const faceH = S * 0.72;
  return {
    w,
    h: S,
    label,
    prims: [
      { t: 'path', d: rr(lw / 2, lw / 2, w - lw, S - lw, S * 0.2), fill: C.keySide, stroke: C.outline, lw },
      { t: 'path', d: rr(S * 0.1, S * 0.07, w - S * 0.2, faceH, S * 0.14), fill: C.keyFace },
      { t: 'text', x: w / 2, y: S * 0.07 + faceH / 2 + S * 0.02, s: label, size: fs, fill: C.ink, weight: 700 },
    ],
  };
}

function mouseGlyph(code: string, S: number): GlyphShape {
  const lw = lineW(S);
  const bw = S * 0.7;
  const x0 = lw / 2;
  const x1 = bw - lw / 2;
  const y0 = lw / 2;
  const y1 = S - lw / 2;
  const cx = (x0 + x1) / 2;
  const rt = (x1 - x0) / 2;
  const ys = y0 + (y1 - y0) * 0.44;
  const prims: GlyphPrim[] = [{ t: 'path', d: rr(x0, y0, x1 - x0, y1 - y0, [rt, rt, rt * 0.85, rt * 0.85]), fill: C.mouse }];
  const left = `M${f(cx)},${f(y0)}A${f(rt)},${f(rt)} 0 0 0 ${f(x0)},${f(y0 + rt)}V${f(ys)}H${f(cx)}Z`;
  const right = `M${f(cx)},${f(y0)}A${f(rt)},${f(rt)} 0 0 1 ${f(x1)},${f(y0 + rt)}V${f(ys)}H${f(cx)}Z`;
  if (code === 'Mouse0') prims.push({ t: 'path', d: left, fill: C.accent });
  if (code === 'Mouse2') prims.push({ t: 'path', d: right, fill: C.accent });
  const wheelLit = code === 'Mouse1' || code === 'WheelUp' || code === 'WheelDown';
  prims.push({ t: 'path', d: `M${f(cx)},${f(y0)}V${f(ys)}M${f(x0)},${f(ys)}H${f(x1)}`, stroke: C.outline, lw: lw * 0.8 });
  prims.push({ t: 'path', d: rr(cx - S * 0.075, y0 + S * 0.09, S * 0.15, S * 0.22, S * 0.075), fill: wheelLit ? C.accent : C.bodyDark, stroke: C.outline, lw: lw * 0.6 });
  prims.push({ t: 'path', d: rr(x0, y0, x1 - x0, y1 - y0, [rt, rt, rt * 0.85, rt * 0.85]), stroke: C.outline, lw });
  let w = bw;
  if (code === 'WheelUp' || code === 'WheelDown') {
    const ax = bw + S * 0.24;
    const up = code === 'WheelUp';
    const tip = up ? S * 0.3 : S * 0.7;
    const base = up ? S * 0.62 : S * 0.38;
    prims.push({ t: 'path', d: `M${f(ax - S * 0.17)},${f(base)}L${f(ax)},${f(tip)}L${f(ax + S * 0.17)},${f(base)}Z`, fill: C.light, stroke: C.outline, lw: lw * 0.8 });
    w = bw + S * 0.44;
  } else if (code === 'Mouse3' || code === 'Mouse4') {
    prims.push({ t: 'path', d: rr(0, ys + S * 0.08, S * 0.12, S * 0.24, S * 0.04), fill: C.accent, stroke: C.outline, lw: lw * 0.6 });
    prims.push({ t: 'text', x: bw + S * 0.24, y: S * 0.52, s: code === 'Mouse3' ? '4' : '5', size: S * 0.5, fill: C.light, weight: 700, stroke: C.outline, lw: S * 0.1 });
    w = bw + S * 0.46;
  }
  return { w, h: S, label: keyLabel(code), prims };
}

/** A round button: outline plus a faint inner rim (the rim keeps dark buttons visible on dark backgrounds). */
function circleButton(S: number, fill: string, stroke = C.outline): GlyphPrim {
  const lw = lineW(S);
  const r = S / 2 - lw / 2;
  return {
    t: 'group',
    dx: 0,
    prims: [
      { t: 'circle', x: S / 2, y: S / 2, r, fill, stroke, lw },
      { t: 'circle', x: S / 2, y: S / 2, r: r - lw * 0.95, stroke: C.rim, lw: lw * 0.6 },
    ],
  };
}

function padGlyph(n: number, kind: PadKind, S: number): GlyphShape {
  const lw = lineW(S);
  const label = padText(n, kind);
  const c = S / 2;
  if (n >= 0 && n <= 3) {
    if (kind === 'xbox') {
      const b = XBOX_FACE[n]!;
      return {
        w: S,
        h: S,
        label,
        prims: [
          circleButton(S, b.fill, b.ring),
          { t: 'text', x: c, y: c + S * 0.03, s: b.s, size: S * 0.6, fill: '#ffffff', weight: 800, stroke: 'rgba(0,0,0,0.55)', lw: S * 0.1 },
        ],
      };
    }
    const sw = S * 0.11;
    const sym: GlyphPrim[] =
      n === 0
        ? [{ t: 'path', d: `M${f(S * 0.32)},${f(S * 0.32)}L${f(S * 0.68)},${f(S * 0.68)}M${f(S * 0.68)},${f(S * 0.32)}L${f(S * 0.32)},${f(S * 0.68)}`, stroke: PS_COLORS.cross, lw: sw }]
        : n === 1
          ? [{ t: 'circle', x: c, y: c, r: S * 0.2, stroke: PS_COLORS.circle, lw: sw }]
          : n === 2
            ? [{ t: 'path', d: rr(S * 0.31, S * 0.31, S * 0.38, S * 0.38, S * 0.03), stroke: PS_COLORS.square, lw: sw }]
            : [{ t: 'path', d: `M${f(c)},${f(S * 0.27)}L${f(S * 0.735)},${f(S * 0.67)}L${f(S * 0.265)},${f(S * 0.67)}Z`, stroke: PS_COLORS.triangle, lw: sw }];
    return { w: S, h: S, label, prims: [circleButton(S, C.bodyDark), ...sym] };
  }
  if (n === 4 || n === 5) {
    const w = S * 1.7;
    const big = S * 0.36;
    const small = S * 0.12;
    const radii: [number, number, number, number] = n === 4 ? [big, small, small, small] : [small, big, small, small];
    return {
      w,
      h: S,
      label,
      prims: [
        { t: 'path', d: rr(lw / 2, S * 0.16, w - lw, S * 0.68, radii), fill: C.body, stroke: C.outline, lw },
        { t: 'path', d: `M${f(S * 0.42)},${f(S * 0.16 + lw * 1.2)}H${f(w - S * 0.42)}`, stroke: C.rim, lw: lw * 0.7 },
        { t: 'text', x: w / 2, y: S * 0.52, s: kind === 'xbox' ? (n === 4 ? 'LB' : 'RB') : n === 4 ? 'L1' : 'R1', size: S * 0.44, fill: C.light, weight: 700 },
      ],
    };
  }
  if (n === 6 || n === 7) {
    const w = S * 1.25;
    return {
      w,
      h: S,
      label,
      prims: [
        { t: 'path', d: rr(lw / 2, lw / 2, w - lw, S - lw, [S * 0.46, S * 0.46, S * 0.16, S * 0.16]), fill: C.body, stroke: C.outline, lw },
        { t: 'path', d: `M${f(w * 0.3)},${f(S * 0.2)}H${f(w * 0.7)}`, stroke: C.rim, lw: lw * 0.8 },
        { t: 'text', x: w / 2, y: S * 0.58, s: kind === 'xbox' ? (n === 6 ? 'LT' : 'RT') : n === 6 ? 'L2' : 'R2', size: S * 0.42, fill: C.light, weight: 700 },
      ],
    };
  }
  if (n >= 12 && n <= 15) {
    const a = S * 0.2;
    const e = S / 2 - lw / 2;
    const plus =
      `M${f(c - a)},${f(c - e)}H${f(c + a)}V${f(c - a)}H${f(c + e)}V${f(c + a)}H${f(c + a)}V${f(c + e)}` +
      `H${f(c - a)}V${f(c + a)}H${f(c - e)}V${f(c - a)}H${f(c - a)}Z`;
    // the lit arm and a small arrow in it
    const dir = n - 12; // 0 up, 1 down, 2 left, 3 right
    // light the half-bar from the tip to the centre: readable even at HUD size
    const ins = lw * 0.9;
    const len = e - ins * 1.2;
    const arm =
      dir === 0
        ? rr(c - a + ins, c - e + ins, 2 * a - 2 * ins, len, S * 0.04)
        : dir === 1
          ? rr(c - a + ins, c + e - ins - len, 2 * a - 2 * ins, len, S * 0.04)
          : dir === 2
            ? rr(c - e + ins, c - a + ins, len, 2 * a - 2 * ins, S * 0.04)
            : rr(c + e - ins - len, c - a + ins, len, 2 * a - 2 * ins, S * 0.04);
    const t = S * 0.11;
    const m = e * 0.5;
    const [ax, ay] = dir === 0 ? [c, c - m] : dir === 1 ? [c, c + m] : dir === 2 ? [c - m, c] : [c + m, c];
    const tri =
      dir === 0
        ? `M${f(ax - t)},${f(ay + t * 0.6)}L${f(ax)},${f(ay - t * 0.6)}L${f(ax + t)},${f(ay + t * 0.6)}Z`
        : dir === 1
          ? `M${f(ax - t)},${f(ay - t * 0.6)}L${f(ax)},${f(ay + t * 0.6)}L${f(ax + t)},${f(ay - t * 0.6)}Z`
          : dir === 2
            ? `M${f(ax + t * 0.6)},${f(ay - t)}L${f(ax - t * 0.6)},${f(ay)}L${f(ax + t * 0.6)},${f(ay + t)}Z`
            : `M${f(ax - t * 0.6)},${f(ay - t)}L${f(ax + t * 0.6)},${f(ay)}L${f(ax - t * 0.6)},${f(ay + t)}Z`;
    return {
      w: S,
      h: S,
      label,
      prims: [
        { t: 'path', d: plus, fill: C.body, stroke: C.outline, lw },
        { t: 'path', d: arm, fill: C.light },
        { t: 'path', d: tri, fill: C.ink },
      ],
    };
  }
  if (n === 8 || n === 9) {
    if (kind === 'xbox') {
      const il = Math.max(1, S * 0.075);
      const icon: GlyphPrim[] =
        n === 8
          ? [
              { t: 'path', d: rr(S * 0.27, S * 0.29, S * 0.3, S * 0.25, S * 0.04), stroke: C.light, lw: il },
              { t: 'path', d: rr(S * 0.43, S * 0.45, S * 0.3, S * 0.25, S * 0.04), fill: C.bodyDark, stroke: C.light, lw: il },
            ]
          : [{ t: 'path', d: `M${f(S * 0.3)},${f(S * 0.35)}H${f(S * 0.7)}M${f(S * 0.3)},${f(S * 0.5)}H${f(S * 0.7)}M${f(S * 0.3)},${f(S * 0.65)}H${f(S * 0.7)}`, stroke: C.light, lw: il }];
      return { w: S, h: S, label, prims: [circleButton(S, C.bodyDark), ...icon] };
    }
    const w = S * 0.66;
    const cx = w / 2;
    const il = Math.max(1, S * 0.07);
    const icon: GlyphPrim[] =
      n === 8
        ? [
            {
              t: 'path',
              d: `M${f(cx)},${f(S * 0.7)}V${f(S * 0.3)}M${f(cx - S * 0.14)},${f(S * 0.42)}L${f(cx)},${f(S * 0.27)}L${f(cx + S * 0.14)},${f(S * 0.42)}M${f(cx - S * 0.15)},${f(S * 0.72)}H${f(cx + S * 0.15)}`,
              stroke: C.light,
              lw: il,
            },
          ]
        : [{ t: 'path', d: `M${f(cx - S * 0.14)},${f(S * 0.36)}H${f(cx + S * 0.14)}M${f(cx - S * 0.14)},${f(S * 0.5)}H${f(cx + S * 0.14)}M${f(cx - S * 0.14)},${f(S * 0.64)}H${f(cx + S * 0.14)}`, stroke: C.light, lw: il }];
    return { w, h: S, label, prims: [{ t: 'path', d: rr(lw / 2, lw / 2, w - lw, S - lw, w / 2), fill: C.bodyDark, stroke: C.outline, lw }, ...icon] };
  }
  if (n === 10 || n === 11 || n === PAD_LSTICK || n === PAD_RSTICK) {
    const left = n === 10 || n === PAD_LSTICK;
    const click = n === 10 || n === 11;
    const s = click ? (kind === 'xbox' ? (left ? 'LS' : 'RS') : left ? 'L3' : 'R3') : left ? 'L' : 'R';
    const prims: GlyphPrim[] = [circleButton(S, C.bodyDark), { t: 'circle', x: c, y: c, r: S * 0.31, fill: '#665f7c', stroke: '#15121a', lw: lw * 0.7 }];
    if (!click) {
      // four ticks: "move the stick"
      const r0 = S * 0.4;
      const tk = S * 0.07;
      prims.push({
        t: 'path',
        d: `M${f(c - tk)},${f(c - r0 + tk)}L${f(c)},${f(c - r0)}L${f(c + tk)},${f(c - r0 + tk)}M${f(c - tk)},${f(c + r0 - tk)}L${f(c)},${f(c + r0)}L${f(c + tk)},${f(c + r0 - tk)}`,
        stroke: C.light,
        lw: Math.max(1, S * 0.06),
      });
    }
    prims.push({ t: 'text', x: c, y: c + S * 0.02, s, size: S * (s.length > 1 ? 0.34 : 0.42), fill: C.light, weight: 700 });
    return { w: S, h: S, label, prims };
  }
  const s = n === 16 ? (kind === 'xbox' ? 'G' : 'PS') : String(n);
  return { w: S, h: S, label, prims: [circleButton(S, C.bodyDark), { t: 'text', x: c, y: c + S * 0.02, s, size: S * 0.42, fill: C.light, weight: 700 }] };
}

function holdWrap(base: GlyphShape, S: number): GlyphShape {
  const fs = S * 0.34;
  const tw = textWidth('HOLD', fs) + S * 0.28;
  const gap = S * 0.1;
  const lw = lineW(S);
  return {
    w: tw + gap + base.w,
    h: S,
    label: `Hold ${base.label}`,
    prims: [
      { t: 'path', d: rr(lw / 2, S * 0.22, tw - lw, S * 0.56, S * 0.12), fill: C.accent, stroke: C.outline, lw: lw * 0.8 },
      { t: 'text', x: tw / 2, y: S * 0.51, s: 'HOLD', size: fs, fill: C.ink, weight: 800 },
      { t: 'group', dx: tw + gap, prims: base.prims },
    ],
  };
}

function unboundGlyph(S: number): GlyphShape {
  const lw = lineW(S);
  return {
    w: S,
    h: S,
    label: '—',
    prims: [
      { t: 'path', d: rr(lw / 2, lw / 2, S - lw, S - lw, S * 0.2), fill: '#2a2433', stroke: '#4a4458', lw },
      { t: 'text', x: S / 2, y: S / 2, s: '—', size: S * 0.5, fill: '#a59c8a', weight: 700 },
    ],
  };
}

const shapeCache = new Map<string, GlyphShape>();

/** Build (cached) the shape for one input in a style at height `size`. null input = an unbound placeholder. */
export function glyphShape(input: GlyphInput | null, style: PromptStyle, size: number): GlyphShape {
  const S = Math.max(6, Math.round(size * 2) / 2);
  const kind: PadKind = style === 'keyboard' ? 'xbox' : style;
  const key = `${kind}|${String(input)}|${S}`;
  const hit = shapeCache.get(key);
  if (hit) return hit;
  let shape: GlyphShape;
  if (input === null) shape = unboundGlyph(S);
  else if (typeof input === 'string') shape = /^(Mouse\d|Wheel(Up|Down))$/.test(input) ? mouseGlyph(input, S) : keycap(keyLabel(input), S);
  else if (input >= HOLD) shape = holdWrap(padGlyph(input - HOLD, kind, S), S);
  else shape = padGlyph(input, kind, S);
  if (shapeCache.size > 600) shapeCache.clear();
  shapeCache.set(key, shape);
  return shape;
}

/** The shape a prompt for `action` shows right now (style and bindings resolved). */
export function actionShape(action: GlyphAction, size: number, style: PromptStyle = promptStyle()): GlyphShape {
  return glyphShape(primaryInput(action, style), style, size);
}

// ---------------------------------------------------------------------------------------------------------------
// canvas

const pathCache = new Map<string, Path2D>();
function path2d(d: string): Path2D {
  let p = pathCache.get(d);
  if (!p) {
    if (pathCache.size > 2000) pathCache.clear();
    p = new Path2D(d);
    pathCache.set(d, p);
  }
  return p;
}

function paint(ctx: CanvasRenderingContext2D, prims: GlyphPrim[]): void {
  for (const p of prims) {
    if (p.t === 'group') {
      ctx.save();
      ctx.translate(p.dx, 0);
      paint(ctx, p.prims);
      ctx.restore();
      continue;
    }
    if (p.t === 'text') {
      ctx.font = `${p.weight} ${p.size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (p.stroke) {
        ctx.lineWidth = p.lw ?? 1;
        ctx.strokeStyle = p.stroke;
        ctx.lineJoin = 'round';
        ctx.strokeText(p.s, p.x, p.y);
      }
      ctx.fillStyle = p.fill;
      ctx.fillText(p.s, p.x, p.y);
      continue;
    }
    // circles go through the same cache as an SVG arc path
    const path = path2d(p.t === 'circle' ? `M${f(p.x - p.r)},${f(p.y)}a${f(p.r)},${f(p.r)} 0 1 0 ${f(p.r * 2)},0a${f(p.r)},${f(p.r)} 0 1 0 ${f(-p.r * 2)},0Z` : p.d);
    if (p.fill) {
      ctx.fillStyle = p.fill;
      ctx.fill(path);
    }
    if (p.stroke) {
      ctx.strokeStyle = p.stroke;
      ctx.lineWidth = p.lw ?? 1;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke(path);
    }
  }
}

export interface GlyphDrawOpts {
  /** horizontal anchor of x (default 'center') */
  align?: 'left' | 'center' | 'right';
  /** vertical anchor of y (default 'middle') */
  valign?: 'top' | 'middle' | 'bottom';
  alpha?: number;
  /** override the resolved style (e.g. the Gamepad settings tab always shows pad pictures) */
  style?: PromptStyle;
}

/** Paint a shape anchored at (x, y); returns its width. */
export function drawShape(ctx: CanvasRenderingContext2D, shape: GlyphShape, x: number, y: number, o: GlyphDrawOpts = {}): number {
  const left = o.align === 'left' ? x : o.align === 'right' ? x - shape.w : x - shape.w / 2;
  const top = o.valign === 'top' ? y : o.valign === 'bottom' ? y - shape.h : y - shape.h / 2;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.translate(left, top);
  paint(ctx, shape.prims);
  ctx.restore();
  return shape.w;
}

/**
 * Draw the prompt for `action` (current style and bindings) at (x, y), centred by default, `size` px tall.
 * Returns the drawn width (a Hold binding, a mouse wheel or a word keycap is wider than `size`).
 */
export function drawGlyph(ctx: CanvasRenderingContext2D, action: GlyphAction, x: number, y: number, size: number, o: GlyphDrawOpts = {}): number {
  return drawShape(ctx, actionShape(action, size, o.style ?? promptStyle()), x, y, o);
}

/** Draw one specific input (rebinding UI, help screens). */
export function drawInputGlyph(ctx: CanvasRenderingContext2D, input: GlyphInput, x: number, y: number, size: number, o: GlyphDrawOpts = {}): number {
  return drawShape(ctx, glyphShape(input, o.style ?? (typeof input === 'string' ? 'keyboard' : padStyle()), size), x, y, o);
}

export interface GlyphLabelOpts {
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'bold' | '600';
  alpha?: number;
}

function drawLabelText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, weight: string): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 6);
  ctx.strokeStyle = '#000';
  ctx.lineJoin = 'round';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

/** "[glyph] Rest": the in-world interaction prompt. (x, y) anchors the whole line, y is its vertical middle. */
export function drawGlyphLabel(ctx: CanvasRenderingContext2D, action: GlyphAction, label: string, x: number, y: number, o: GlyphLabelOpts = {}): number {
  return drawPromptText(ctx, label ? `{${action}} ${label}` : `{${action}}`, x, y, o);
}

/**
 * Draw text with inline glyphs for {action} tokens ('Drink from the Thermos ({flask}).'), one line, y = middle.
 * Shrinks to fit `maxWidth`. Returns the drawn width.
 */
export function drawPromptText(ctx: CanvasRenderingContext2D, template: string, x: number, y: number, o: GlyphLabelOpts & { maxWidth?: number } = {}): number {
  const size = o.size ?? 15;
  const gs = Math.round(size * 1.3);
  const color = o.color ?? '#efe6d2';
  const weight = o.weight ?? 'bold';
  const style = promptStyle();
  const parts = segments(template).map((s) => {
    if ('text' in s) {
      ctx.font = `${weight} ${size}px ${FONT}`;
      return { s, w: ctx.measureText(s.text).width, shape: null as GlyphShape | null };
    }
    const shape = actionShape(s.action, gs, style);
    return { s, w: shape.w + size * 0.25, shape };
  });
  const total = parts.reduce((a, p) => a + p.w, 0);
  const k = o.maxWidth && total > o.maxWidth ? o.maxWidth / total : 1;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  const left = o.align === 'left' ? x : o.align === 'right' ? x - total * k : x - (total * k) / 2;
  ctx.translate(left, y);
  ctx.scale(k, k);
  let cx = 0;
  for (const p of parts) {
    if (p.shape) {
      drawShape(ctx, p.shape, cx + size * 0.125, 0, { align: 'left' });
    } else if ('text' in p.s) drawLabelText(ctx, p.s.text, cx, size * 0.04, size, color, weight);
    cx += p.w;
  }
  ctx.restore();
  return total * k;
}

// ---------------------------------------------------------------------------------------------------------------
// DOM (inline SVG, crisp at any overlay scale)

const SVG = 'http://www.w3.org/2000/svg';

function svgPrims(parent: SVGElement, prims: GlyphPrim[]): void {
  for (const p of prims) {
    let el: SVGElement;
    if (p.t === 'group') {
      el = document.createElementNS(SVG, 'g');
      el.setAttribute('transform', `translate(${f(p.dx)},0)`);
      svgPrims(el, p.prims);
    } else if (p.t === 'text') {
      el = document.createElementNS(SVG, 'text');
      el.setAttribute('x', String(f(p.x)));
      el.setAttribute('y', String(f(p.y)));
      el.setAttribute('text-anchor', 'middle');
      el.setAttribute('dominant-baseline', 'central');
      el.setAttribute('font-family', FONT);
      el.setAttribute('font-size', String(f(p.size)));
      el.setAttribute('font-weight', String(p.weight));
      el.setAttribute('fill', p.fill);
      if (p.stroke) {
        el.setAttribute('stroke', p.stroke);
        el.setAttribute('stroke-width', String(f(p.lw ?? 1)));
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('paint-order', 'stroke');
      }
      el.textContent = p.s;
    } else {
      if (p.t === 'circle') {
        el = document.createElementNS(SVG, 'circle');
        el.setAttribute('cx', String(f(p.x)));
        el.setAttribute('cy', String(f(p.y)));
        el.setAttribute('r', String(f(p.r)));
      } else {
        el = document.createElementNS(SVG, 'path');
        el.setAttribute('d', p.d);
      }
      el.setAttribute('fill', p.fill ?? 'none');
      if (p.stroke) {
        el.setAttribute('stroke', p.stroke);
        el.setAttribute('stroke-width', String(f(p.lw ?? 1)));
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('stroke-linecap', 'round');
      }
    }
    parent.appendChild(el);
  }
}

/** An <svg> of a shape at 1 CSS px per unit. */
export function shapeSvg(shape: GlyphShape): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('width', String(Math.ceil(shape.w)));
  svg.setAttribute('height', String(Math.ceil(shape.h)));
  svg.setAttribute('viewBox', `0 0 ${Math.ceil(shape.w)} ${Math.ceil(shape.h)}`);
  svg.setAttribute('aria-hidden', 'true');
  svgPrims(svg, shape.prims);
  return svg;
}

function fillGlyphSpan(span: HTMLElement, shape: GlyphShape): void {
  while (span.firstChild) span.removeChild(span.firstChild);
  span.appendChild(shapeSvg(shape));
  span.setAttribute('aria-label', shape.label);
  span.title = shape.label;
}

function glyphSpan(): HTMLElement {
  const span = document.createElement('span');
  span.className = 'glyph';
  span.setAttribute('role', 'img');
  span.style.cssText = 'display:inline-flex;vertical-align:middle;line-height:0;flex:none';
  return span;
}

/**
 * A live prompt element for `action`: it redraws itself when the prompt style, the last device (auto) or the
 * bindings change (refreshGlyphs). Pass `style` to pin it (e.g. the Gamepad tab).
 */
export function glyphEl(action: GlyphAction, size = 20, style?: PromptStyle): HTMLElement {
  const span = glyphSpan();
  span.dataset.glyphAction = action;
  span.dataset.glyphSize = String(size);
  if (style) span.dataset.glyphStyle = style;
  fillGlyphSpan(span, actionShape(action, size, style ?? promptStyle()));
  return span;
}

/** A static element for one specific input (rebinding buttons). */
export function inputGlyphEl(input: GlyphInput | null, size = 20, style?: PromptStyle): HTMLElement {
  const span = glyphSpan();
  const st = style ?? (typeof input === 'string' ? 'keyboard' : padStyle());
  fillGlyphSpan(span, glyphShape(input, st, size));
  return span;
}

/** Text with live inline glyphs for {action} tokens, for DOM menus and signs. */
export function promptTextEl(template: string, size = 16): HTMLElement {
  const el = document.createElement('span');
  el.className = 'prompt-text';
  for (const s of segments(template)) el.appendChild('text' in s ? document.createTextNode(s.text) : glyphEl(s.action, Math.round(size * 1.25)));
  return el;
}

let lastSig = '';
let lastCheck = -1;

function signature(): string {
  const c = source.settings()?.controls;
  return `${promptStyle()}|${padStyle()}|${c ? JSON.stringify([c.keyboard, c.gamepad, c.menuPad]) : ''}`;
}

/**
 * Redraw live glyph elements if the style, the device or the bindings changed. Cheap; throttled to 5 Hz when
 * given a clock (seconds). pollMenuPad calls it every frame; the settings screen calls it after a change.
 */
export function refreshGlyphs(now?: number, force = false): void {
  if (typeof document === 'undefined') return;
  if (now !== undefined && !force) {
    if (now - lastCheck < 0.2 && now >= lastCheck) return;
    lastCheck = now;
  }
  const sig = signature();
  if (sig === lastSig && !force) return;
  lastSig = sig;
  for (const span of document.querySelectorAll<HTMLElement>('[data-glyph-action]')) {
    const a = span.dataset.glyphAction ?? '';
    if (!isGlyphAction(a)) continue;
    const st = span.dataset.glyphStyle as PromptStyle | undefined;
    fillGlyphSpan(span, actionShape(a, Number(span.dataset.glyphSize) || 20, st ?? promptStyle()));
  }
}
