// Achievements UI (GAME_DESIGN §20): the unlock toast (top-right, queued, ~4 s, a small bell) and the
// Achievements screen (title menu and pause): every achievement with its icon, locked/unlocked state, progress
// bars for counters, hidden ones as "???" until unlocked, and The Dark Shard on top. Icons are inline SVG drawn here.
import './achievements.css';
import { playSfx } from '../engine/audio/sfx';
import { ACHIEVEMENTS, DARK_SHARD, type AchIcon, type AchievementDef } from '../data/achievements';
import { achievements } from '../game/achievements';
import { btn, fmt, h, layer, uiRoot } from './dom';

// ------------------------------------------------------------------ icons (24×24, stroke = currentColor)

const ICON_PATHS: Record<AchIcon, string> = {
  sword: '<path d="M19 3l2 2-11 11-3 1 1-3z"/><path d="M5 15l4 4M4 20l2-2"/>',
  skull: '<path d="M12 3c-4.4 0-8 3.1-8 7.5 0 2.6 1.3 4 3 5V19h10v-3.5c1.7-1 3-2.4 3-5C20 6.1 16.4 3 12 3z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 19v2M14 19v2M12 14l-1 2h2z"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/><path d="M5 19h14"/>',
  mortarboard: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M20 10v6"/>',
  stairs: '<path d="M3 20h5v-4h4v-4h4V8h5"/><path d="M17 4l3-1-1 3M20 3l-5 5"/>',
  cycle: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  helm: '<path d="M5 13c0-4.5 3-8 7-8s7 3.5 7 8v6H5z"/><path d="M5 12h14M12 12v7M9 15h-2M17 15h-2"/>',
  chest: '<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 9c0-3 2-5 9-5s9 2 9 5M3 13h18"/><rect x="10.5" y="11.5" width="3" height="3"/><path d="M7 16l1 2 1-2M15 16l1 2 1-2"/>',
  star: '<path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9z"/>',
  armor: '<path d="M8 3l4 2 4-2 5 3-2 5-2-1v11H7V10l-2 1-2-5z"/><path d="M12 5v15"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 9v12"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 3v18M4 10h16"/>',
  dagger: '<path d="M14 3l7 7-9 6-3-3z"/><path d="M9 13l-2 2 2 2-5 5M7 15l2 2"/>',
  flask: '<rect x="7" y="7" width="10" height="14" rx="2"/><path d="M9 7V4h6v3M7 12h10"/><path d="M4 4l16 16" stroke-width="2.2"/>',
  broom: '<path d="M19 3l-7 9"/><path d="M12 12l-6 2-3 7 7-3 2-6z"/><path d="M6 17l3-3M8 19l2-3"/>',
  fist: '<path d="M7 10V7a1.5 1.5 0 0 1 3 0v3M10 9V6a1.5 1.5 0 0 1 3 0v4M13 9V7a1.5 1.5 0 0 1 3 0v4M16 10a1.5 1.5 0 0 1 3 0v4c0 4-3 7-7 7-3 0-5-2-6-4l-2-4c-.6-1.2 1-2.2 2-1.2L7 14V10"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M12 8v6M9 11h6"/>',
  party: '<circle cx="7" cy="8" r="2.5"/><circle cx="17" cy="8" r="2.5"/><circle cx="7" cy="16" r="2.5"/><circle cx="17" cy="16" r="2.5"/><path d="M12 4v16M4 12h16" stroke-dasharray="1.5 2"/>',
  level: '<path d="M12 21V4M5 11l7-7 7 7"/><path d="M5 21h14"/>',
  coin: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  weight: '<path d="M8 8a4 4 0 0 1 8 0"/><path d="M6 8h12l3 13H3z"/><path d="M9 15h6"/>',
  cart: '<path d="M2 5h3l3 10h11l2-7H7"/><circle cx="9" cy="19" r="1.8"/><circle cx="17" cy="19" r="1.8"/>',
  shard: '<path d="M12 2l5 7-3 13-5-3-4-8z"/><path d="M12 2l-1 10 3 10M5 11l6 1 6-3"/>',
};

/** One achievement icon as an element (`locked` greys it). */
export function achIcon(icon: AchIcon, locked = false, size = 40): HTMLElement {
  const svg = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[icon]}</svg>`;
  return h('div', { class: `ach-icon${locked ? ' locked' : ''}`, html: svg });
}

function isSecret(a: AchievementDef, got: boolean): boolean {
  return !!a.hidden && !got;
}

// ------------------------------------------------------------------ toasts

const TOAST_MS = 4000;
let queue: AchievementDef[] = [];
let showing = false;
let box: HTMLElement | null = null;

function showNext(): void {
  const a = queue.shift();
  if (!a) {
    showing = false;
    return;
  }
  showing = true;
  if (!box || !box.isConnected) {
    box = h('div', { class: 'ach-toasts' });
    uiRoot().appendChild(box);
  }
  const t = h(
    'div',
    { class: `ach-toast${a.id === DARK_SHARD ? ' dark' : ''}`, 'data-testid': 'ach-toast', 'data-ach': a.id },
    achIcon(a.icon, false, 36),
    h('div', { class: 'ach-toast-text' }, h('div', { class: 'ach-toast-head' }, 'Achievement unlocked'), h('div', { class: 'ach-toast-name' }, a.name), h('div', { class: 'ach-toast-desc' }, a.desc)),
  );
  box.appendChild(t);
  playSfx('achievement');
  setTimeout(() => t.classList.add('out'), TOAST_MS - 350);
  setTimeout(() => {
    t.remove();
    showNext();
  }, TOAST_MS);
}

export function queueAchievementToast(a: AchievementDef): void {
  queue.push(a);
  if (!showing) showNext();
}

let installed = false;

/** Boot: toasts for every unlock, and a last flush when the page goes away. */
export function installAchievementToasts(): void {
  if (installed) return;
  installed = true;
  const t = achievements();
  t.onUnlock((a) => queueAchievementToast(a));
  window.addEventListener('beforeunload', () => t.flush());
  // Dev server only: poke the tracker from the console / Playwright
  if (import.meta.env.DEV) (window as unknown as { __djAch: unknown }).__djAch = t;
}

/** For tests: drop pending toasts. */
export function clearAchievementToasts(): void {
  queue = [];
}

// ------------------------------------------------------------------ the screen

function fmtDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function card(a: AchievementDef, big = false): HTMLElement {
  const t = achievements();
  const got = t.unlocked(a.id);
  const secret = isSecret(a, got);
  const prog = !got && !secret && a.progress ? a.progress(t.view) : null;
  const at = t.unlockedAt(a.id);
  return h(
    'div',
    { class: `ach-card${got ? ' got' : ''}${a.id === DARK_SHARD ? ' dark' : ''}${big ? ' big' : ''}`, 'data-ach': a.id, 'data-got': got ? '1' : '0' },
    secret ? h('div', { class: 'ach-icon locked secret' }, '?') : achIcon(a.icon, !got, big ? 56 : 40),
    h(
      'div',
      { class: 'ach-body' },
      h('div', { class: 'ach-name' }, secret ? '???' : a.name),
      h('div', { class: 'ach-desc' }, secret ? 'Hidden. Keep playing; something will happen.' : a.desc),
      prog
        ? h(
            'div',
            { class: 'ach-prog' },
            h('div', { class: 'bar' }, h('div', { style: `width:${Math.round((100 * prog[0]) / Math.max(1, prog[1]))}%` })),
            h('span', { class: 'small dim-text' }, `${fmt(prog[0])} / ${fmt(prog[1])}`),
          )
        : null,
      got && at ? h('div', { class: 'ach-date' }, `Unlocked ${fmtDate(at)}`) : null,
    ),
  );
}

/** The Achievements screen; Esc or Back closes it and calls onClose. */
export function openAchievements(onClose: () => void): HTMLElement {
  const t = achievements();
  const [got, total] = t.totals();
  const root = layer('dim');
  root.setAttribute('data-testid', 'achievements');
  const dark = ACHIEVEMENTS.find((a) => a.id === DARK_SHARD)!;
  const rest = ACHIEVEMENTS.filter((a) => a.id !== DARK_SHARD);
  // unlocked first, then the ones with progress, then the rest, each in list order
  const order = (a: AchievementDef): number => (t.unlocked(a.id) ? 0 : a.progress && !a.hidden ? 1 : 2);
  const sorted = rest.map((a, i) => ({ a, i })).sort((x, y) => order(x.a) - order(y.a) || x.i - y.i).map((x) => x.a);
  const close = (): void => {
    window.removeEventListener('keydown', onKey, true);
    root.remove();
    onClose();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.code !== 'Escape' || !root.isConnected) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    close();
  };
  window.addEventListener('keydown', onKey, true);
  root.appendChild(
    h(
      'div',
      { class: 'panel ach-panel' },
      h(
        'div',
        { class: 'row ach-header' },
        h('h2', { class: 'grow' }, 'Achievements'),
        h('div', { class: 'ach-total', 'data-testid': 'ach-total' }, `${got} / ${total}`),
        btn('Back', close, 'primary'),
      ),
      h('div', { class: 'bar ach-total-bar' }, h('div', { style: `width:${Math.round((100 * got) / total)}%` })),
      h('div', { class: 'small dim-text' }, 'Shared by every character on this browser. Co-op counts what you see from your side of the screen.'),
      card(dark, true),
      h('div', { class: 'ach-grid' }, ...sorted.map((a) => card(a))),
    ),
  );
  setTimeout(() => root.querySelector<HTMLElement>('button')?.focus(), 0);
  return root;
}
