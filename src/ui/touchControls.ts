// On-screen touch controller for phones and tablets (D143): two sticks and the 16 buttons of a standard pad (A B X
// Y, LB RB LT RT, View, Menu, L3 R3 and the D-pad). It drives the virtual pad (engine/input/virtualPad.ts), which the
// game reads like a real Xbox controller, so the controls follow the player's gamepad bindings and the button prompts
// match. Each button shows its pad name and, small, what it does right now.
import { app } from '../app';
import { ACTION_LABEL, type Action } from '../engine/input/actions';
import { defaultGamepad, type GamepadBindings } from '../engine/input/bindings';
import { setVirtualButton, setVirtualPadActive, setVirtualStick } from '../engine/input/virtualPad';
import type { TouchMode } from '../engine/settings';

/** A phone or tablet: a coarse touch pointer and no fine pointer (mouse or trackpad) at all. */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  return coarse && !window.matchMedia('(any-pointer: fine)').matches;
}

interface Btn {
  i: number;
  label: string;
  /** centre, in vmin from the given edges */
  x: number;
  y: number;
  side: 'left' | 'right' | 'center';
  r: number;
  shape?: 'round' | 'pill' | 'dpad';
  color?: string;
}

// standard mapping: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 View, 9 Menu, 10 L3, 11 R3, 12–15 D-pad up/down/left/right
const BUTTONS: Btn[] = [
  { i: 0, label: 'A', side: 'right', x: 30, y: 58, r: 6.2, color: '#6fcf6f' },
  { i: 1, label: 'B', side: 'right', x: 18, y: 46, r: 6.2, color: '#ef6b6b' },
  { i: 2, label: 'X', side: 'right', x: 42, y: 46, r: 6.2, color: '#6ba6ef' },
  { i: 3, label: 'Y', side: 'right', x: 30, y: 34, r: 6.2, color: '#efd26b' },
  { i: 6, label: 'LT', side: 'left', x: 9, y: 9, r: 6, shape: 'pill' },
  { i: 4, label: 'LB', side: 'left', x: 9, y: 23, r: 6, shape: 'pill' },
  { i: 7, label: 'RT', side: 'right', x: 9, y: 9, r: 6, shape: 'pill' },
  { i: 5, label: 'RB', side: 'right', x: 9, y: 23, r: 6, shape: 'pill' },
  // View and Menu flank the Full screen button along the top edge, clear of the menus below
  { i: 8, label: '⧉', side: 'center', x: -20, y: 6, r: 4.6 },
  { i: 9, label: '☰', side: 'center', x: 20, y: 6, r: 4.6 },
  { i: 10, label: 'L3', side: 'left', x: 40, y: 90, r: 4.6 },
  { i: 11, label: 'R3', side: 'right', x: 40, y: 90, r: 4.6 },
  { i: 12, label: '▲', side: 'left', x: 30, y: 34, r: 5.6, shape: 'dpad' },
  { i: 13, label: '▼', side: 'left', x: 30, y: 58, r: 5.6, shape: 'dpad' },
  { i: 14, label: '◀', side: 'left', x: 18, y: 46, r: 5.6, shape: 'dpad' },
  { i: 15, label: '▶', side: 'left', x: 42, y: 46, r: 5.6, shape: 'dpad' },
];

/** Short captions that fit inside a button. */
const SHORT: Partial<Record<Action, string>> = { flask: 'Thermos', quick: 'Item', block: 'Block', skill1: 'Skill 1', skill2: 'Skill 2', skill3: 'Skill 3', swapWeapon: 'Swap', twoHand: '2-hand', cycleQuick: 'Next item', inventory: 'Bag' };

/** What each pad button does under the current bindings (taps only; holds are not shown). */
function buttonActions(): Map<number, string> {
  let pad: GamepadBindings;
  try {
    pad = app().settings.controls.gamepad;
  } catch {
    pad = defaultGamepad();
  }
  const out = new Map<number, string>();
  for (const [action, list] of Object.entries(pad) as [Action, number[]][]) {
    for (const b of list) if (b < 100 && !out.has(b)) out.set(b, SHORT[action] ?? ACTION_LABEL[action] ?? action);
  }
  return out;
}

const CSS = `
#touchpad { position: fixed; inset: 0; z-index: 900; pointer-events: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: none; }
#touchpad.hidden { display: none; }
#touchpad .tp-b, #touchpad .tp-zone { pointer-events: auto; touch-action: none; }
#touchpad .tp-b { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;
  border-radius: 50%; border: 2px solid rgba(255,255,255,.45); background: rgba(20,18,28,.45); color: #fff; font: 700 calc(var(--u) * 4.2) system-ui, sans-serif; line-height: 1; }
#touchpad .tp-b.pill { border-radius: calc(var(--u) * 3); }
#touchpad .tp-b.dpad { border-radius: calc(var(--u) * 1.6); font-size: calc(var(--u) * 3.6); }
#touchpad .tp-b small { font: 600 calc(var(--u) * 1.9) system-ui, sans-serif; opacity: .8; margin-top: calc(var(--u) * .5); max-width: 140%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#touchpad .tp-b.on { background: rgba(255,255,255,.35); border-color: #fff; }
#touchpad .tp-zone { position: absolute; bottom: 0; height: 52%; width: 40%; }
#touchpad .tp-zone.l { left: 0; } #touchpad .tp-zone.r { right: 0; }
#touchpad .tp-base { position: absolute; width: calc(var(--u) * 26); height: calc(var(--u) * 26); margin: calc(var(--u) * -13) 0 0 calc(var(--u) * -13); border-radius: 50%;
  border: 2px solid rgba(255,255,255,.35); background: rgba(20,18,28,.35); pointer-events: none; }
#touchpad .tp-knob { position: absolute; left: 50%; top: 50%; width: calc(var(--u) * 11); height: calc(var(--u) * 11); margin: calc(var(--u) * -5.5) 0 0 calc(var(--u) * -5.5);
  border-radius: 50%; background: rgba(255,255,255,.55); border: 2px solid #fff; }
#touchpad .tp-cap { position: absolute; left: 0; right: 0; bottom: calc(var(--u) * -4.5); text-align: center; color: #fff; opacity: .7; font: 600 calc(var(--u) * 2) system-ui, sans-serif; }
#touchpad .tp-tool { position: absolute; top: calc(var(--u) * 1); left: 50%; transform: translateX(-50%); display: flex; gap: calc(var(--u) * 1.5); pointer-events: auto; }
#touchpad .tp-tool button { font: 600 calc(var(--u) * 2.4) system-ui, sans-serif; color: #fff; background: rgba(20,18,28,.55); border: 1px solid rgba(255,255,255,.35); border-radius: 6px; padding: 2px 8px; }
#touchpad .tp-rotate { position: absolute; top: 40%; left: 5%; right: 5%; text-align: center; color: #fff; font: 600 18px system-ui, sans-serif; background: rgba(10,8,14,.85); padding: 14px; border-radius: 10px; }
`;

let root: HTMLElement | null = null;
let shown = false;
let touchedOnce = false;
const capEls = new Map<number, HTMLElement>();

function mode(): TouchMode {
  try {
    return app().settings.controls.touch.mode;
  } catch {
    return 'auto';
  }
}

/** Show or hide the controls from the setting (auto: on phones and tablets, or once the screen is touched). */
export function refreshTouchControls(): void {
  if (!root) return;
  let s = { size: 1, opacity: 0.75 };
  try {
    s = app().settings.controls.touch;
  } catch {
    // no app yet
  }
  const m = mode();
  shown = m === 'on' || (m === 'auto' && (isTouchDevice() || touchedOnce));
  root.classList.toggle('hidden', !shown);
  root.style.opacity = String(s.opacity);
  // one unit = 1 vmin × the size setting; everything is laid out in units
  root.style.setProperty('--u', `calc(min(1vw, 1vh) * ${s.size})`);
  setVirtualPadActive(shown);
  labelButtons();
}

function labelButtons(): void {
  const acts = buttonActions();
  for (const [i, el] of capEls) el.textContent = acts.get(i) ?? '';
}

function makeStick(side: 'l' | 'r', stick: 0 | 1, label: string): HTMLElement {
  const zone = document.createElement('div');
  zone.className = `tp-zone ${side}`;
  const base = document.createElement('div');
  base.className = 'tp-base';
  const knob = document.createElement('div');
  knob.className = 'tp-knob';
  const cap = document.createElement('div');
  cap.className = 'tp-cap';
  cap.textContent = label;
  base.append(knob, cap);
  zone.appendChild(base);
  // the stick rests here, and jumps to wherever a thumb lands in its zone
  const home = (): void => {
    base.style.left = side === 'l' ? 'calc(var(--u) * 18)' : 'calc(100% - var(--u) * 18)';
    base.style.top = 'calc(100% - var(--u) * 20)';
    knob.style.transform = '';
  };
  home();
  let id: number | null = null;
  let cx = 0;
  let cy = 0;
  const unitPx = (): number => base.getBoundingClientRect().width / 26;
  const move = (e: PointerEvent): void => {
    const rad = unitPx() * 11;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const m = Math.hypot(dx, dy);
    if (m > rad) {
      dx *= rad / m;
      dy *= rad / m;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setVirtualStick(stick, dx / rad, dy / rad);
  };
  zone.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    id = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    const zr = zone.getBoundingClientRect();
    cx = e.clientX;
    cy = e.clientY;
    base.style.left = `${cx - zr.left}px`;
    base.style.top = `${cy - zr.top}px`;
    move(e);
    e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId === id) move(e);
  });
  const end = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    id = null;
    setVirtualStick(stick, 0, 0);
    home();
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
  return zone;
}

function makeButton(b: Btn): HTMLElement {
  const el = document.createElement('div');
  el.className = `tp-b${b.shape && b.shape !== 'round' ? ` ${b.shape}` : ''}`;
  el.setAttribute('data-pad', String(b.i));
  el.setAttribute('aria-label', `Pad ${b.label}`);
  const w = b.shape === 'pill' ? b.r * 2.6 : b.r * 2;
  const hgt = b.r * 2;
  el.style.width = `calc(var(--u) * ${w})`;
  el.style.height = `calc(var(--u) * ${hgt})`;
  el.style.top = `calc(var(--u) * ${b.y - b.r})`;
  if (b.y > 60) el.style.top = `calc(100% - var(--u) * ${100 - b.y + b.r})`;
  if (b.side === 'left') el.style.left = `calc(var(--u) * ${b.x - w / 2})`;
  else if (b.side === 'right') el.style.right = `calc(var(--u) * ${b.x - w / 2})`;
  else el.style.left = `calc(50% + var(--u) * ${b.x - w / 2})`;
  if (b.color) el.style.color = b.color;
  const name = document.createElement('span');
  name.textContent = b.label;
  const cap = document.createElement('small');
  el.append(name, cap);
  capEls.set(b.i, cap);
  const pointers = new Set<number>();
  const set = (): void => {
    const on = pointers.size > 0;
    el.classList.toggle('on', on);
    setVirtualButton(b.i, on);
  };
  el.addEventListener('pointerdown', (e) => {
    pointers.add(e.pointerId);
    el.setPointerCapture(e.pointerId);
    if (navigator.vibrate) navigator.vibrate(8);
    set();
    e.preventDefault();
  });
  const up = (e: PointerEvent): void => {
    pointers.delete(e.pointerId);
    set();
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return el;
}

/** Build the controls once; they show and hide with the setting (call refreshTouchControls after a change). */
export function installTouchControls(): void {
  if (root || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  root = document.createElement('div');
  root.id = 'touchpad';
  root.className = 'hidden';
  root.setAttribute('data-testid', 'touch-controls');
  root.append(makeStick('l', 0, 'Move'), makeStick('r', 1, 'Aim'));
  for (const b of BUTTONS) root.appendChild(makeButton(b));
  // full screen (and landscape where the browser allows it)
  const tool = document.createElement('div');
  tool.className = 'tp-tool';
  const fs = document.createElement('button');
  fs.textContent = '⛶ Full screen';
  fs.addEventListener('click', () => {
    const d = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else
      void d
        .requestFullscreen?.()
        .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
        .catch(() => undefined);
  });
  tool.appendChild(fs);
  root.appendChild(tool);
  const rotate = document.createElement('div');
  rotate.className = 'tp-rotate';
  rotate.textContent = 'Turn your phone sideways to play.';
  root.appendChild(rotate);
  const portrait = (): void => {
    rotate.style.display = window.innerHeight > window.innerWidth ? '' : 'none';
  };
  window.addEventListener('resize', portrait);
  portrait();
  // the touch UI swallows its own touches (no zoom, no fake mouse clicks)
  root.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  document.body.appendChild(root);
  // a tap on the game canvas while the controls show is not a mouse click (it would attack and hide the pad prompts)
  document.getElementById('game')?.addEventListener(
    'touchstart',
    (e) => {
      if (shown) e.preventDefault();
    },
    { passive: false },
  );
  // auto mode also comes on the first time the screen is touched (a touch laptop, a tablet with a mouse)
  window.addEventListener(
    'touchstart',
    () => {
      if (touchedOnce) return;
      touchedOnce = true;
      refreshTouchControls();
    },
    { passive: true },
  );
  refreshTouchControls();
  // bindings can change in Settings; keep the small labels current
  window.setInterval(() => {
    if (shown) labelButtons();
  }, 1000);
}
