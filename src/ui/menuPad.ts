// Gamepad navigation for the DOM menus: D-pad / left stick moves focus, A clicks, B backs out (Escape).
import type { InputManager } from '../engine/input/input';
import { moveFocus } from './dom';

let repeatAt = 0;

export function pollMenuPad(input: InputManager, now: number): void {
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
  if (input.padButtonEdge(0)) {
    const el = document.activeElement as HTMLElement | null;
    if (el && scope.contains(el)) el.click();
  }
  if (input.padButtonEdge(1)) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
}
