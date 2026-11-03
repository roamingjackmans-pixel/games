// Gamepad navigation for the DOM menus: D-pad / left stick moves focus, the confirm button (A / ✕) clicks, the back
// button (B / ○) backs out (Escape). Confirm and back are remappable (settings.controls.menuPad); focus movement is
// fixed. Also keeps the live button prompts in the menus current (refreshGlyphs).
import { app } from '../app';
import { defaultMenuPad, type MenuPadBindings } from '../engine/input/bindings';
import type { InputManager } from '../engine/input/input';
import { moveFocus } from './dom';
import { refreshGlyphs } from './glyphs';

let repeatAt = 0;
let lastPoll = 0;

if (typeof window !== 'undefined') {
  const off = (): void => document.body?.classList.remove('pad-nav');
  window.addEventListener('mousemove', off, { passive: true });
  window.addEventListener('mousedown', off, { passive: true });
}

function menuButtons(): MenuPadBindings {
  try {
    return app().settings.controls.menuPad;
  } catch {
    return defaultMenuPad();
  }
}

function canScroll(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 2) return false;
  const oy = getComputedStyle(el).overflowY;
  return oy === 'auto' || oy === 'scroll';
}

/** The scroll box for the right stick: the nearest scrolling ancestor of the focus, else the largest in the menu. */
function scrollBoxFor(scope: HTMLElement, focus: HTMLElement | null): HTMLElement | null {
  for (let el = focus; el && el !== scope.parentElement; el = el.parentElement) if (canScroll(el)) return el;
  let best: HTMLElement | null = null;
  let area = 0;
  for (const el of scope.querySelectorAll<HTMLElement>('*')) {
    if (!canScroll(el)) continue;
    const a = el.clientWidth * el.clientHeight;
    if (a > area) {
      area = a;
      best = el;
    }
  }
  return best ?? (canScroll(scope) ? scope : null);
}

export function pollMenuPad(input: InputManager, now: number): void {
  refreshGlyphs(now);
  // while the rebinding screen waits for a button, every press belongs to it
  if (input.capturing) {
    repeatAt = now + 0.25;
    return;
  }
  const layers = [...document.querySelectorAll<HTMLElement>('#overlay .layer')].filter((l) => !l.classList.contains('clear') || l.querySelector('.panel'));
  const scope = layers[layers.length - 1];
  if (!scope || input.lastDevice !== 'pad') return;
  // show where the pad's focus is (browsers only draw focus rings for the keyboard), and put focus somewhere
  // visible as soon as a menu opens under the pad
  document.body.classList.add('pad-nav');
  const active = document.activeElement as HTMLElement | null;
  if (!active || !scope.contains(active)) moveFocus(scope, 0, 1);
  const [sx, sy] = input.padStick();
  let dx = 0;
  let dy = 0;
  if (input.padButtonDown(14) || sx < -0.6) dx = -1;
  else if (input.padButtonDown(15) || sx > 0.6) dx = 1;
  else if (input.padButtonDown(12) || sy < -0.6) dy = -1;
  else if (input.padButtonDown(13) || sy > 0.6) dy = 1;
  if ((dx || dy) && now >= repeatAt) {
    moveFocus(scope, dx, dy);
    // keep what the pad selects on screen inside scrolling lists
    (document.activeElement as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    repeatAt = now + 0.18;
  } else if (!dx && !dy) repeatAt = 0;
  // the right stick scrolls whatever can scroll: the list around the focus, else the menu's biggest scroll box
  const dt = Math.min(0.1, Math.max(0, now - lastPoll));
  lastPoll = now;
  const [, ry] = input.padRightStick();
  if (Math.abs(ry) > 0.2) {
    const box = scrollBoxFor(scope, document.activeElement as HTMLElement | null);
    if (box) box.scrollTop += ry * 1100 * dt;
  }
  // LB / RB (L1 / R1) step through a menu's tabs (D145), stopping at the ends; the focus goes to the new tab
  for (const [btnIdx, step] of [[4, -1], [5, 1]] as const) {
    if (!input.padButtonEdge(btnIdx)) continue;
    const tabs = [...scope.querySelectorAll<HTMLButtonElement>('.tabs [data-tab]')].filter((t) => t.offsetParent !== null && !t.disabled);
    const cur = tabs.findIndex((t) => t.classList.contains('on'));
    const next = tabs[cur + step];
    input.swallowPadButton(btnIdx);
    if (cur < 0 || !next) continue;
    next.click();
    // after the menu's own redraw has put the focus back
    setTimeout(() => {
      const on = document.querySelector<HTMLElement>('#overlay .layer .tabs [data-tab].on');
      on?.focus();
    }, 0);
  }
  const mp = menuButtons();
  if (input.padButtonEdge(mp.confirm)) {
    const el = document.activeElement as HTMLElement | null;
    // the game must not also take this press (A is Interact) when the menu closes under it (D147)
    input.swallowPadButton(mp.confirm);
    if (el && scope.contains(el)) el.click();
  }
  if (input.padButtonEdge(mp.back)) {
    // B is Dodge in play: closing a menu with it must not dodge as well; it dodges again after a fresh press (D147)
    input.swallowPadButton(mp.back);
    // a full press (down and up): a lone keydown left Escape "held", so B only ever backed out once
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape', key: 'Escape' }));
    input.lastDevice = 'pad';
  }
}
