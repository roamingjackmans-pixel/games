// Tiny DOM toolkit for the HTML overlay menus (no framework, D6).
import { playSfx } from '../engine/audio/sfx';

type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined | null>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else if (k === 'class') el.className = String(v);
      else if (k === 'style') el.setAttribute('style', String(v));
      else if (k === 'html') el.innerHTML = String(v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

/** A button that plays the UI click sound. */
export function btn(label: Child, onClick: () => void, cls = '', disabled = false): HTMLButtonElement {
  const b = h('button', { class: cls, disabled }, label);
  b.addEventListener('click', () => {
    playSfx('uiClick');
    onClick();
  });
  b.addEventListener('mouseenter', () => playSfx('uiHover', { vol: 0.5 }));
  return b;
}

let root: HTMLElement | null = null;

export function uiRoot(): HTMLElement {
  if (!root) {
    const overlay = document.getElementById('overlay')!;
    root = h('div', { class: 'ui-root' });
    overlay.appendChild(root);
  }
  return root;
}

/** A full-size overlay layer; returns it so the caller can remove it. */
export function layer(cls = 'dim'): HTMLElement {
  const l = h('div', { class: `layer ${cls}` });
  uiRoot().appendChild(l);
  return l;
}

export function clearEl(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let toastEl: HTMLElement | null = null;
export function toast(msg: string, ms = 2200): void {
  if (!toastEl) {
    toastEl = h('div', { class: 'toast' });
    uiRoot().appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (toastEl) toastEl.style.display = 'none';
  }, ms);
}

/** Focus the first focusable element inside el (keyboard/gamepad navigation). */
// ---- keeping the focus across a menu redraw (D144) ---------------------------------------------------------------
// Menus rebuild their DOM after every change; without this the focus (which a gamepad lives on) jumps back to the
// first button each time. A control is found again by its `data-focus` name, else by its place inside the nearest
// `data-focus-group`, else by its place in the whole menu; disabled controls count for places so they stay stable.

const ANY_CONTROL = 'button, a[href], input, select, [tabindex="0"]';
const usable = (e: HTMLElement): boolean => !(e as HTMLButtonElement).disabled && e.offsetParent !== null;

export interface FocusMark {
  key: string | null;
  group: string | null;
  groupIndex: number;
  index: number;
}

/** Where the focus is inside `scope` right now (null when it is elsewhere). */
export function markFocus(scope: HTMLElement): FocusMark | null {
  const a = document.activeElement as HTMLElement | null;
  if (!a || !scope.contains(a) || a === scope) return null;
  const g = a.closest<HTMLElement>('[data-focus-group]');
  const group = g && scope.contains(g) ? g.getAttribute('data-focus-group') : null;
  return {
    key: a.getAttribute('data-focus'),
    group,
    groupIndex: g ? [...g.querySelectorAll<HTMLElement>(ANY_CONTROL)].indexOf(a) : -1,
    index: [...scope.querySelectorAll<HTMLElement>(ANY_CONTROL)].indexOf(a),
  };
}

/** The usable control at `i` in `list`, or the nearest usable one to it. */
function nearestUsable(list: HTMLElement[], i: number): HTMLElement | null {
  if (i < 0 || list.length === 0) return null;
  for (let d = 0; d < list.length; d++) {
    for (const j of [i - d, i + d]) {
      const e = list[j];
      if (e && usable(e)) return e;
    }
  }
  return null;
}

/** Put the focus back where `mark` was after a redraw of `scope`; returns false when nothing matched. */
export function restoreFocus(scope: HTMLElement, mark: FocusMark | null): boolean {
  if (!mark) return false;
  let el: HTMLElement | null = null;
  if (mark.key) {
    const k = scope.querySelector<HTMLElement>(`[data-focus="${CSS.escape(mark.key)}"]`);
    if (k && usable(k)) el = k;
    else if (k) {
      // the same control just turned disabled: its nearest neighbour in its group
      const g = k.closest<HTMLElement>('[data-focus-group]');
      if (g) {
        const list = [...g.querySelectorAll<HTMLElement>(ANY_CONTROL)];
        el = nearestUsable(list, list.indexOf(k));
      }
    }
  }
  if (!el && mark.group) {
    const g = scope.querySelector<HTMLElement>(`[data-focus-group="${CSS.escape(mark.group)}"]`);
    if (g) el = nearestUsable([...g.querySelectorAll<HTMLElement>(ANY_CONTROL)], mark.groupIndex);
  }
  if (!el) el = nearestUsable([...scope.querySelectorAll<HTMLElement>(ANY_CONTROL)], mark.index);
  if (!el) return false;
  el.focus({ preventScroll: false });
  return true;
}

/**
 * Focus where a menu's content starts (D148): its `data-autofocus` control if usable, else the top-most usable control
 * below the tab bar, leftmost of that row. `content` narrows the search (a tab's body); the tab bar never counts.
 */
export function focusContentStart(scope: HTMLElement, content?: HTMLElement | null): boolean {
  const auto = scope.querySelector<HTMLElement>('[data-autofocus]');
  if (auto && usable(auto)) {
    auto.focus();
    return true;
  }
  const area = content ?? scope.querySelector<HTMLElement>('[data-focus-group^="tab-"]') ?? scope;
  const items = [...area.querySelectorAll<HTMLElement>(ANY_CONTROL)].filter((e) => usable(e) && !e.closest('.tabs'));
  if (items.length === 0) return false;
  const pos = items.map((e) => ({ e, r: e.getBoundingClientRect() }));
  // one "row" is anything whose top is within 8 px of the highest; take its leftmost
  const top = Math.min(...pos.map((p) => p.r.top));
  const row = pos.filter((p) => p.r.top - top < 8).sort((a, b) => a.r.left - b.r.left);
  row[0]!.e.focus();
  return true;
}

export function focusFirst(el: HTMLElement): void {
  const f = el.querySelector<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]');
  f?.focus();
}

/** Move focus among focusable elements in `scope` (gamepad D-pad / stick). */
export function moveFocus(scope: HTMLElement, dx: number, dy: number): void {
  const items = [...scope.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]')].filter(
    (e) => e.offsetParent !== null,
  );
  if (items.length === 0) return;
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !items.includes(cur)) {
    items[0]!.focus();
    return;
  }
  const r0 = cur.getBoundingClientRect();
  const cx = r0.left + r0.width / 2;
  const cy = r0.top + r0.height / 2;
  // a menu's tab bar and its content are separate areas (D145): left / right never leave the area the focus is in,
  // and up / down cross between them only when there is nothing further that way in the same area
  const bar = (e: HTMLElement): Element | null => e.closest('.tabs');
  const here = bar(cur);
  const pick = (sameArea: boolean): HTMLElement | null => {
    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const e of items) {
      if (e === cur) continue;
      if (sameArea && bar(e) !== here) continue;
      const r = e.getBoundingClientRect();
      const ex = r.left + r.width / 2;
      const ey = r.top + r.height / 2;
      const ddx = ex - cx;
      const ddy = ey - cy;
      const along = dx !== 0 ? ddx * dx : ddy * dy;
      if (along <= 2) continue;
      const across = dx !== 0 ? Math.abs(ddy) : Math.abs(ddx);
      const score = along + across * 2.5;
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  };
  const best = pick(true) ?? (dy !== 0 ? pick(false) : null) ?? wrapTarget(items, cur, cx, cy, dx, dy, here);
  if (best) {
    best.focus();
    playSfx('uiHover', { vol: 0.5 });
  }
}

/**
 * Where the focus goes when nothing is further that way (D169): menus loop. Left / right wrap to the other end of
 * the same row, in the same area. Up / down wrap to the far end of the whole menu: a menu with tabs is one loop
 * (Up from the content's top row already reaches the tab bar, so Up from the bar goes to the bottom row and Down
 * from the bottom row comes back up to the bar, onto the open tab).
 */
function wrapTarget(items: HTMLElement[], cur: HTMLElement, cx: number, cy: number, dx: number, dy: number, here: Element | null): HTMLElement | null {
  const others = items.filter((e) => e !== cur).map((e) => {
    const r = e.getBoundingClientRect();
    return { e, x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
  });
  if (dx !== 0) {
    // the same row, the same area: the far end
    const hh = cur.getBoundingClientRect().height;
    const row = others.filter((o) => o.e.closest('.tabs') === here && Math.abs(o.y - cy) <= Math.max(10, Math.min(hh, o.h) * 0.6));
    if (!row.length) return null;
    return row.reduce((a, o) => (-dx * o.x > -dx * a.x ? o : a)).e;
  }
  if (!others.length) return null;
  // the far row: the bottom one for Up, the top one for Down
  const far = Math.max(...others.map((o) => -dy * o.y));
  const row = others.filter((o) => -dy * o.y >= far - 12);
  // on the tab bar, the open tab; otherwise the one nearest across
  const open = row.find((o) => o.e.closest('.tabs') && o.e.classList.contains('on'));
  if (open) return open.e;
  return row.reduce((a, o) => (Math.abs(o.x - cx) < Math.abs(a.x - cx) ? o : a)).e;
}

export function fmt(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}
