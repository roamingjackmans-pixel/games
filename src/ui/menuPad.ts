// Gamepad navigation for the DOM menus: D-pad / left stick moves focus, the confirm button (A / ✕) clicks, the back
// button (B / ○) backs out (Escape). Confirm and back are remappable (settings.controls.menuPad); focus movement is
// fixed. Also keeps the live button prompts in the menus current (refreshGlyphs).
import { app } from '../app';
import { defaultMenuPad, type MenuPadBindings } from '../engine/input/bindings';
import type { InputManager } from '../engine/input/input';
import { moveFocus } from './dom';
import { refreshGlyphs } from './glyphs';

let repeatAt = 0;

function menuButtons(): MenuPadBindings {
  try {
    return app().settings.controls.menuPad;
  } catch {
    return defaultMenuPad();
  }
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
  const [sx, sy] = input.padStick();
  let dx = 0;
  let dy = 0;
  if (input.padButtonDown(14) || sx < -0.6) dx = -1;
  else if (input.padButtonDown(15) || sx > 0.6) dx = 1;
  else if (input.padButtonDown(12) || sy < -0.6) dy = -1;
  else if (input.padButtonDown(13) || sy > 0.6) dy = 1;
  if ((dx || dy) && now >= repeatAt) {
    moveFocus(scope, dx, dy);
    repeatAt = now + 0.18;
  } else if (!dx && !dy) repeatAt = 0;
  const mp = menuButtons();
  if (input.padButtonEdge(mp.confirm)) {
    const el = document.activeElement as HTMLElement | null;
    if (el && scope.contains(el)) el.click();
  }
  if (input.padButtonEdge(mp.back)) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
}
