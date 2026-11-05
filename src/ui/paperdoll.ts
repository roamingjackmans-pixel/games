// Paper doll for the equipment window: a dark human silhouette drawn as inline SVG (crisp at any UI scale),
// with the equipment slots laid over the part of the body they go on. Helmet at the head, body at the torso,
// legs at the legs; the off hand and the 2nd off hand by one hand, the weapon and the 2nd weapon by the other, two
// rings under each (D228). The caller builds the slot buttons (so clicks, tooltips and focus
// stay in the inventory) and this places them.
import type { EquipSlot } from '../game/items/inventory';
import { h } from './dom';

export const DOLL_W = 300;
export const DOLL_H = 400;

export interface DollSlot {
  slot: EquipSlot;
  /** shown inside the slot when it is empty */
  label: string;
  /** slot centre in doll pixels */
  x: number;
  y: number;
  size: number;
}

/** Figure faces the viewer: its right hand (weapons) is on the viewer's left, its left hand (shield) on the right. */
export const DOLL_SLOTS: DollSlot[] = [
  { slot: 'head', label: 'Helmet', x: 150, y: 48, size: 56 },
  { slot: 'body', label: 'Body', x: 150, y: 160, size: 60 },
  { slot: 'legs', label: 'Legs', x: 150, y: 298, size: 56 },
  // D228: the hands sit higher so each side has two rings under them (four rings), and a 2nd off hand by the off hand
  { slot: 'main', label: 'Weapon', x: 42, y: 150, size: 56 },
  { slot: 'altMain', label: '2nd weapon', x: 42, y: 214, size: 56 },
  { slot: 'ring3', label: 'Ring', x: 42, y: 278, size: 46 },
  { slot: 'ring4', label: 'Ring', x: 42, y: 332, size: 46 },
  { slot: 'off', label: 'Off hand', x: 258, y: 150, size: 56 },
  { slot: 'altOff', label: '2nd off hand', x: 258, y: 214, size: 56 },
  { slot: 'ring1', label: 'Ring', x: 258, y: 278, size: 46 },
  { slot: 'ring2', label: 'Ring', x: 258, y: 332, size: 46 },
];

const SVG_NS = 'http://www.w3.org/2000/svg';
let dollCount = 0;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, ...children: SVGElement[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) el.appendChild(c);
  return el;
}

/** The human shadow: one dark shape with a faint violet rim glow, on a soft pool of light. */
export function silhouette(): SVGSVGElement {
  const id = `dj-doll-${++dollCount}`;
  const body = '#07060b';
  const limb = (d: string, w: number): SVGPathElement => svg('path', { d, fill: 'none', stroke: body, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const filter = svg(
    'filter',
    { id: `${id}-glow`, x: '-20%', y: '-20%', width: '140%', height: '140%' },
    svg('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: 1.5, result: 'grown' }),
    svg('feGaussianBlur', { in: 'grown', stdDeviation: 5, result: 'soft' }),
    svg('feFlood', { 'flood-color': '#8a74c0', 'flood-opacity': 0.45 }),
    svg('feComposite', { in2: 'soft', operator: 'in', result: 'rim' }),
    svg('feMerge', {}, svg('feMergeNode', { in: 'rim' }), svg('feMergeNode', { in: 'SourceGraphic' })),
  );
  const pool = svg(
    'radialGradient',
    { id: `${id}-pool`, cx: '50%', cy: '45%', r: '55%' },
    svg('stop', { offset: '0%', 'stop-color': '#3a3150', 'stop-opacity': 0.55 }),
    svg('stop', { offset: '100%', 'stop-color': '#14121a', 'stop-opacity': 0 }),
  );
  const figure = svg(
    'g',
    { filter: `url(#${id}-glow)` },
    // legs (behind the hips), then feet
    limb('M130 250 L124 316 L120 368', 30),
    limb('M170 250 L176 316 L180 368', 30),
    svg('ellipse', { cx: 113, cy: 378, rx: 19, ry: 9, fill: body }),
    svg('ellipse', { cx: 187, cy: 378, rx: 19, ry: 9, fill: body }),
    // arms (angled away from the body), then hands
    limb('M100 114 Q84 146 77 178 L61 226', 20),
    limb('M200 114 Q216 146 223 178 L239 226', 20),
    svg('circle', { cx: 58, cy: 238, r: 11, fill: body }),
    svg('circle', { cx: 242, cy: 238, r: 11, fill: body }),
    // torso and hips
    svg('path', { d: 'M100 102 Q150 90 200 102 Q214 108 213 126 Q206 170 194 218 L200 256 Q150 266 100 256 L106 218 Q94 170 87 126 Q86 108 100 102 Z', fill: body }),
    // neck and head
    svg('rect', { x: 139, y: 70, width: 22, height: 32, rx: 8, fill: body }),
    svg('ellipse', { cx: 150, cy: 46, rx: 25, ry: 30, fill: body }),
  );
  return svg(
    'svg',
    { class: 'doll-svg', width: DOLL_W, height: DOLL_H, viewBox: `0 0 ${DOLL_W} ${DOLL_H}`, 'aria-hidden': 'true' },
    svg('defs', {}, filter, pool),
    svg('ellipse', { cx: 150, cy: 200, rx: 150, ry: 200, fill: `url(#${id}-pool)` }),
    svg('ellipse', { cx: 150, cy: 386, rx: 78, ry: 10, fill: '#000', opacity: 0.45 }),
    figure,
  );
}

/**
 * The doll with the given slot buttons placed on it. `cells` maps each slot to its button (already wired by
 * the caller); empty slots get their label. `dimmed` slots are drawn faded (the off hand while two-handing).
 */
export function paperDoll(cells: Partial<Record<EquipSlot, HTMLElement>>, opts: { empty?: Partial<Record<EquipSlot, boolean>>; dimmed?: EquipSlot[] } = {}): HTMLElement {
  const root = h('div', { class: 'doll', style: `width:${DOLL_W}px;height:${DOLL_H}px`, 'data-testid': 'paperdoll' });
  root.appendChild(silhouette());
  for (const s of DOLL_SLOTS) {
    const el = cells[s.slot];
    if (!el) continue;
    el.classList.add('doll-slot');
    if (opts.empty?.[s.slot]) {
      el.classList.add('empty');
      el.appendChild(h('span', { class: 'doll-label' }, s.label));
    }
    if (opts.dimmed?.includes(s.slot)) el.classList.add('idle');
    el.style.left = `${s.x - s.size / 2}px`;
    el.style.top = `${s.y - s.size / 2}px`;
    el.style.width = `${s.size}px`;
    el.style.height = `${s.size}px`;
    root.appendChild(el);
  }
  return root;
}
