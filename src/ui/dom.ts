// Tiny DOM toolkit for the HTML overlay menus (no framework, D6).
import { playSfx } from '../engine/audio/sfx';

type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined | null>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
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
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const e of items) {
    if (e === cur) continue;
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
  if (best) {
    best.focus();
    playSfx('uiHover', { vol: 0.5 });
  }
}

export function fmt(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}
