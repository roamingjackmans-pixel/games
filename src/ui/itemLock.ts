// The item lock (D265): one lock button, the same in the inventory and the shop. A locked item is never taken by
// "Sell all". The padlock is drawn as inline SVG (no fonts or images).
import type { Item } from '../game/types';
import { playSfx } from '../engine/audio/sfx';
import { h } from './dom';

const NS = 'http://www.w3.org/2000/svg';

/** A small padlock: shut (gold) when locked, open (grey) when not. */
export function lockIcon(locked: boolean, size = 12): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 12 12');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  const col = locked ? '#e8c060' : '#9a93a8';
  const shackle = document.createElementNS(NS, 'path');
  // a shut shackle comes down into the body on both sides; an open one swings up off the right side
  shackle.setAttribute('d', locked ? 'M3.5 6 V4 a2.5 2.5 0 0 1 5 0 V6' : 'M3.5 6 V4 a2.5 2.5 0 0 1 5 0 V3');
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', col);
  shackle.setAttribute('stroke-width', '1.6');
  shackle.setAttribute('stroke-linecap', 'round');
  if (!locked) shackle.setAttribute('transform', 'translate(2.2 -0.6)');
  const body = document.createElementNS(NS, 'rect');
  body.setAttribute('x', '2');
  body.setAttribute('y', '5.5');
  body.setAttribute('width', '8');
  body.setAttribute('height', '5.5');
  body.setAttribute('rx', '1');
  body.setAttribute('fill', col);
  body.setAttribute('stroke', '#16131d');
  body.setAttribute('stroke-width', '0.8');
  const hole = document.createElementNS(NS, 'rect');
  hole.setAttribute('x', '5.4');
  hole.setAttribute('y', '7.2');
  hole.setAttribute('width', '1.2');
  hole.setAttribute('height', '2');
  hole.setAttribute('fill', '#16131d');
  svg.append(shackle, body, hole);
  return svg;
}

export function lockTitle(item: Item): string {
  return item.locked ? 'Locked: Sell all keeps it. Click to unlock.' : 'Lock it so Sell all keeps it.';
}

/**
 * The lock button. `inCell` makes it a corner badge inside an inventory bag slot (a span, so the slot stays the one
 * focus stop for the pad; its click does not reach the slot); otherwise a small real button (the shop's rows).
 */
export function lockButton(item: Item, toggle: () => void, inCell = false): HTMLElement {
  const press = (e: Event): void => {
    e.stopPropagation();
    e.preventDefault();
    playSfx('uiClick');
    toggle();
  };
  if (inCell) {
    const s = h('span', { class: `lock-toggle${item.locked ? ' on' : ''}`, title: lockTitle(item), 'data-testid': `lock-${item.id}` }, lockIcon(!!item.locked, 12));
    s.addEventListener('click', press);
    // a right-click on the lock is not the slot's second action
    s.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    return s;
  }
  const b = h('button', { class: `tiny lock-btn${item.locked ? ' on' : ''}`, title: lockTitle(item), 'aria-label': item.locked ? 'Unlock' : 'Lock', 'aria-pressed': item.locked ? 'true' : 'false', 'data-testid': `lock-${item.id}` }, lockIcon(!!item.locked, 13));
  b.addEventListener('click', press);
  return b;
}
