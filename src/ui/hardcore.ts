// Hardcore characters (D440): a red skull beside the name wherever a character is picked, drawn in code (the
// achievements' skull).
import { h } from './dom';
import { ICON_PATHS } from './achievements';
import type { Character } from '../game/types';

/** The red skull a Hardcore character carries beside its name. */
export function hardcoreSkull(size = 16): HTMLElement {
  const svg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS.skull}</svg>`;
  return h('span', { class: 'hc-skull', title: 'Hardcore', 'aria-label': 'Hardcore', 'data-testid': 'hardcore-skull', style: 'color:#e04848;display:inline-flex;vertical-align:-3px;margin-left:5px', html: svg });
}

/** A character's name in bold, with the skull after it when Hardcore. */
export function charName(c: Pick<Character, 'name' | 'hardcore'>): HTMLElement {
  return h('span', null, h('b', null, c.name), c.hardcore ? hardcoreSkull() : null);
}
