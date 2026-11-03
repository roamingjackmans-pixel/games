// Settings (GAME_DESIGN §17): video, audio, controls (keyboard + gamepad rebinding: every action, Hold bindings,
// menu confirm/back, conflicts swap instead of unbinding), the button-prompt style, accessibility, aim assist,
// hold/toggle block, and the offline download for a Steam library (Game tab). Saved globally in `dj.settings`.
import '../controls.css';
import { app } from '../../app';
import { ALL_ACTIONS, type Action } from '../../engine/input/actions';
import {
  HOLD,
  defaultGamepad,
  defaultKeyboard,
  defaultMenuPad,
  findConflicts,
  menuPadAllowed,
  rebindSwap,
  unboundActions,
  type RebindResult,
} from '../../engine/input/bindings';
import { HOLD_S } from '../../engine/input/input';
import { FRIENDLY_FIRE_MAX, FRIENDLY_FIRE_STEP, PROMPT_SETTINGS, normalizeFriendlyFire, type PromptSetting } from '../../engine/settings';
import { btn, clearEl, h, layer } from '../dom';
import { GLYPH_LABEL, glyphEl, inputGlyphEl, inputText, padStyle, promptStyle, refreshGlyphs, type GlyphAction, type GlyphInput } from '../glyphs';

type Tab = 'video' | 'audio' | 'controls' | 'gamepad' | 'coop' | 'game';
type BindTarget = Action | 'menuConfirm' | 'menuBack';

/** the tab the screen reopens on */
let lastTab: Tab = 'video';

const CAPTURE_MS = 8000;
const PROMPT_NAMES: Record<PromptSetting, string> = {
  auto: 'Auto — the last device you used',
  keyboard: 'Keyboard & mouse',
  xbox: 'Xbox controller',
  playstation: 'PlayStation controller',
};
const PREVIEW: GlyphAction[] = ['attack', 'block', 'dodge', 'skill1', 'skill2', 'skill3', 'spell1', 'spell2', 'spell3', 'flask', 'quick', 'interact'];

/** The offline zip sits next to index.html on the website build (scripts/build-offline.mjs). */
export const OFFLINE_ZIP = 'dungeonjoe-offline.zip';

/** What the settings screen needs to know about a co-op session it opens in. */
export interface SettingsOpts {
  /** a co-op guest: the host's friendly-fire percent (read-only here; the host sets it for everyone, D115) */
  hostFriendlyFire?: () => number | null;
}

const ffText = (v: number): string => (v <= 0 ? 'Off (0%)' : `${v}%`);

/**
 * The friendly-fire row (D115): a 0–200% slider in steps of 10 for the host or a solo player, or the host's value,
 * read-only, with "set by the host" for a co-op guest. `changed` runs after the value is saved.
 */
export function friendlyFireRow(o: { hostValue?: number | null; changed?: () => void } = {}): HTMLElement {
  const a = app();
  const guest = o.hostValue !== undefined;
  const cur = (): number => (guest ? (o.hostValue ?? 100) : a.settings.game.friendlyFire);
  const val = h('span', { class: 'mono', style: 'width:80px', 'data-testid': 'ff-value' }, ffText(cur()));
  const inp = h('input', { type: 'range', min: '0', max: String(FRIENDLY_FIRE_MAX), step: String(FRIENDLY_FIRE_STEP), value: String(cur()), style: 'width:260px', 'data-testid': 'ff-slider', 'aria-label': 'Friendly fire damage' }) as HTMLInputElement;
  if (guest) inp.disabled = true;
  else
    inp.addEventListener('input', () => {
      a.settings.game.friendlyFire = normalizeFriendlyFire(Number(inp.value));
      val.textContent = ffText(a.settings.game.friendlyFire);
      a.saveSettings();
      o.changed?.();
    });
  const note = guest ? h('span', { class: 'small dim-text', 'data-testid': 'ff-host-note' }, 'set by the host') : null;
  return h('div', { class: 'row' }, h('div', { style: 'width:240px' }, 'Friendly fire damage'), inp, val, note);
}

export function openSettings(onClose: () => void, opts: SettingsOpts = {}): HTMLElement {
  const a = app();
  const s = a.settings;
  const root = layer('dim');
  root.setAttribute('data-testid', 'settings');
  const panel = h('div', { class: 'panel settings-panel' });
  root.appendChild(panel);
  let tab: Tab = lastTab;
  /** the rebinding in progress */
  let cap: { pad: boolean; act: BindTarget; slot: number; hold: boolean; until: number } | null = null;
  /** one line about the last change (what moved where) */
  let notice = '';
  let raf = 0;

  const save = (): void => {
    a.saveSettings();
    a.applySettings();
    refreshGlyphs(undefined, true);
  };
  const slider = (label: string, get: () => number, set: (v: number) => void, min = 0, max = 1, step = 0.05, fmt = (v: number) => `${Math.round(v * 100)}%`): HTMLElement => {
    const val = h('span', { class: 'mono', style: 'width:60px' }, fmt(get()));
    const inp = h('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(get()), style: 'width:260px' });
    inp.addEventListener('input', () => {
      set(Number(inp.value));
      val.textContent = fmt(get());
      save();
    });
    return h('div', { class: 'row' }, h('div', { style: 'width:240px' }, label), inp, val);
  };
  const check = (label: string, get: () => boolean, set: (v: boolean) => void): HTMLElement => {
    const c = h('input', { type: 'checkbox' });
    c.checked = get();
    c.addEventListener('change', () => {
      set(c.checked);
      save();
    });
    return h('label', { class: 'row', style: 'cursor:pointer' }, c, label);
  };
  const select = <T extends string | number>(label: string, options: [T, string][], get: () => T, set: (v: T) => void, after?: () => void): HTMLElement => {
    const sel = h('select', null, ...options.map(([v, l]) => h('option', { value: String(v) }, l)));
    sel.value = String(get());
    sel.addEventListener('change', () => {
      const opt = options.find(([v]) => String(v) === sel.value);
      if (opt) set(opt[0]);
      save();
      after?.();
    });
    return h('div', { class: 'row' }, h('div', { style: 'width:240px' }, label), sel);
  };

  function video(el: HTMLElement): void {
    el.appendChild(slider('Resolution scale', () => s.video.scale, (v) => (s.video.scale = v), 0.5, 1, 0.05));
    el.appendChild(
      h(
        'div',
        { class: 'row' },
        h('div', { style: 'width:240px' }, 'Fullscreen'),
        btn('Toggle fullscreen', () => {
          void a.canvas.toggleFullscreen();
          s.video.fullscreen = !document.fullscreenElement;
          save();
        }),
      ),
    );
    el.appendChild(select('Frame cap', [[0, 'Display refresh (VSync)'], [30, '30 fps'], [60, '60 fps'], [120, '120 fps']], () => s.video.frameCap, (v) => (s.video.frameCap = v as 0 | 30 | 60 | 120)));
    el.appendChild(slider('Screen shake', () => s.video.shake, (v) => (s.video.shake = v)));
    el.appendChild(check('Hitstop (freeze frames on hits)', () => s.video.hitstop, (v) => (s.video.hitstop = v)));
    el.appendChild(check('Damage numbers', () => s.video.damageNumbers, (v) => (s.video.damageNumbers = v)));
    el.appendChild(h('h3', null, 'Accessibility'));
    el.appendChild(check('High-contrast telegraphs (thicker outlines, bigger icons)', () => s.video.highContrastTelegraphs, (v) => (s.video.highContrastTelegraphs = v)));
    el.appendChild(select('Red / Piercing icon size', [[1, 'Normal'], [2, 'Large']], () => s.video.telegraphIconSize, (v) => (s.video.telegraphIconSize = v as 1 | 2)));
    el.appendChild(check('Show FPS', () => s.video.showFps, (v) => (s.video.showFps = v)));
    el.appendChild(h('div', { class: 'small dim-text' }, 'Red attacks always show a skull over the attacker; Piercing attacks a hollow ring and a striped floor area.'));
  }
  function audio(el: HTMLElement): void {
    el.appendChild(slider('Master volume', () => s.audio.master, (v) => (s.audio.master = v)));
    el.appendChild(slider('Sound effects', () => s.audio.sfx, (v) => (s.audio.sfx = v)));
    el.appendChild(slider('Music', () => s.audio.music, (v) => (s.audio.music = v)));
  }
  function nameInput(): HTMLElement {
    const i = h('input', { value: s.net.name, maxlength: '16' });
    i.addEventListener('change', () => {
      s.net.name = i.value.trim() || 'Joe';
      save();
    });
    return i;
  }

  // ---- button prompts ---------------------------------------------------------------------------------------

  function prompts(el: HTMLElement): void {
    const resolved = promptStyle();
    const names = { keyboard: 'keyboard & mouse', xbox: 'Xbox', playstation: 'PlayStation' } as const;
    el.appendChild(
      select(
        'Button prompts',
        PROMPT_SETTINGS.map((p) => [p, PROMPT_NAMES[p]] as [PromptSetting, string]),
        () => s.controls.prompts,
        (v) => (s.controls.prompts = v),
        () => render('prompts'),
      ),
    );
    const sel = el.lastElementChild?.querySelector('select');
    sel?.setAttribute('data-focus', 'prompts');
    el.appendChild(
      h(
        'div',
        { class: 'row prompt-preview', 'data-testid': 'prompt-preview' },
        h('div', { style: 'width:240px', class: 'small dim-text' }, s.controls.prompts === 'auto' ? `Showing ${names[resolved]} now` : 'Every prompt in the game shows'),
        ...PREVIEW.map((act) => h('span', { class: 'prompt-chip', title: GLYPH_LABEL[act] }, glyphEl(act, 22))),
      ),
    );
  }

  // ---- rebinding --------------------------------------------------------------------------------------------

  function tableFor(pad: boolean): Record<Action, (string | number)[]> {
    return pad ? s.controls.gamepad : s.controls.keyboard;
  }

  function cancelCapture(msg = ''): void {
    if (!cap) return;
    cap = null;
    a.input.cancelCapture();
    cancelAnimationFrame(raf);
    notice = msg;
  }

  /** while a pad capture waits: Esc cancels, H toggles Hold, a mouse click elsewhere cancels */
  function armPadKeys(): void {
    a.input.captureKey = (code) => {
      if (!cap) return;
      if (code === 'KeyH') {
        cap.hold = !cap.hold;
        armPadKeys();
        updateCaptureBar();
        return;
      }
      if (code === 'Escape' || code.startsWith('Mouse')) {
        const key = focusKey(cap.act, cap.slot);
        cancelCapture('Nothing changed.');
        render(key);
        return;
      }
      armPadKeys();
    };
  }

  function startCapture(pad: boolean, act: BindTarget, slot: number): void {
    cancelCapture();
    notice = '';
    cap = { pad, act, slot, hold: false, until: performance.now() + CAPTURE_MS };
    if (pad) {
      a.input.capturePad = (n, held) => finishPad(n, held);
      armPadKeys();
    } else a.input.captureKey = (code) => finishKey(code);
    render(focusKey(act, slot));
    tick();
  }

  function tick(): void {
    cancelAnimationFrame(raf);
    const step = (): void => {
      if (!cap) return;
      if (performance.now() > cap.until) {
        const key = focusKey(cap.act, cap.slot);
        cancelCapture('No input — nothing changed.');
        render(key);
        return;
      }
      updateCaptureBar();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function updateCaptureBar(): void {
    if (!cap) return;
    const bar = panel.querySelector<HTMLElement>('.capture-progress > div');
    const p = a.input.padCaptureProgress();
    if (bar) bar.style.width = `${Math.round(Math.max(0, p) * 100)}%`;
    const hold = panel.querySelector<HTMLInputElement>('.capture-hold input');
    if (hold) hold.checked = cap.hold || p >= 1;
    const left = panel.querySelector<HTMLElement>('.capture-left');
    if (left) left.textContent = `${Math.max(0, Math.ceil((cap.until - performance.now()) / 1000))} s`;
  }

  function describe(act: BindTarget, v: GlyphInput, r: RebindResult<string | number> | null, pad: boolean): string {
    const style = pad ? padStyle() : 'keyboard';
    let msg = `${GLYPH_LABEL[act]}: ${inputText(v, style)}.`;
    if (r?.swapped) msg += ` ${GLYPH_LABEL[r.swapped.action]} took ${inputText(r.swapped.input, style)} in exchange.`;
    else if (r && r.displaced.length) msg += ` Removed from ${r.displaced.map((x) => GLYPH_LABEL[x]).join(', ')}.`;
    if (pad && typeof v === 'number') {
      const n = v >= HOLD ? v - HOLD : v;
      const other = v >= HOLD ? n : HOLD + n;
      if (ALL_ACTIONS.some((x) => s.controls.gamepad[x].includes(other))) msg += ` ${inputText(n, style)} also has a ${v >= HOLD ? 'tap' : 'Hold'} binding, so its tap fires on release.`;
    }
    return msg;
  }

  function finishPad(n: number, held: boolean): void {
    const c = cap;
    if (!c) return;
    cap = null;
    a.input.cancelCapture();
    cancelAnimationFrame(raf);
    const v = held || c.hold ? HOLD + n : n;
    if (c.act === 'menuConfirm' || c.act === 'menuBack') {
      if (v >= HOLD || !menuPadAllowed(n)) {
        notice = 'Menu confirm / back take a plain press of any button except the D-pad (it moves the focus). Nothing changed.';
      } else {
        const mp = s.controls.menuPad;
        if (c.act === 'menuConfirm') {
          if (mp.back === n) mp.back = mp.confirm;
          mp.confirm = n;
        } else {
          if (mp.confirm === n) mp.confirm = mp.back;
          mp.back = n;
        }
        notice = describe(c.act, n, null, true);
        save();
      }
    } else {
      const r = rebindSwap(s.controls.gamepad, c.act, v, c.slot);
      notice = describe(c.act, v, r, true);
      save();
    }
    render(focusKey(c.act, c.slot));
  }

  function finishKey(code: string): void {
    const c = cap;
    if (!c || c.act === 'menuConfirm' || c.act === 'menuBack') return;
    cap = null;
    cancelAnimationFrame(raf);
    if (code === 'Escape') notice = 'Nothing changed.';
    else {
      const r = rebindSwap(s.controls.keyboard, c.act, code, c.slot);
      notice = describe(c.act, code, r, false);
      save();
    }
    render(focusKey(c.act, c.slot));
  }

  function focusKey(act: BindTarget, slot: number): string {
    return `bind:${act}:${slot}`;
  }

  function slotContent(v: GlyphInput | undefined, pad: boolean): (Node | string)[] {
    if (v === undefined) return [h('span', { class: 'dim-text' }, '—')];
    const style = pad ? padStyle() : 'keyboard';
    const g = inputGlyphEl(v, 20, style);
    // keycaps already carry their text; pad buttons and the mouse get a name beside them
    if (typeof v === 'string' && !/^(Mouse\d|Wheel)/.test(v)) return [g];
    return [g, h('span', { class: 'bind-name' }, inputText(v, style))];
  }

  function slotBtn(pad: boolean, act: BindTarget, slot: number, v: GlyphInput | undefined): HTMLButtonElement {
    const waiting = cap !== null && cap.act === act && cap.slot === slot && cap.pad === pad;
    const b = btn(waiting ? (pad ? 'Press a button…' : 'Press a key or click…') : slotContent(v, pad), () => {
      if (cap) {
        const key = focusKey(cap.act, cap.slot);
        cancelCapture('Nothing changed.');
        render(key);
        return;
      }
      startCapture(pad, act, slot);
    });
    b.classList.add('bind-slot');
    if (waiting) {
      b.classList.add('capturing');
      // a pad capture: clicking the waiting slot cancels; a key capture: a click anywhere binds that mouse button
      if (pad) b.setAttribute('data-capture-ignore', '');
    }
    b.setAttribute('data-focus', focusKey(act, slot));
    b.title = pad ? 'Click or press confirm, then press the new button (hold it 0.5 s for a Hold binding).' : 'Click, then press the new key, mouse button or wheel. Esc cancels.';
    return b;
  }

  function captureBar(pad: boolean): HTMLElement | null {
    if (!cap || cap.pad !== pad) return null;
    const holdBox = h('input', { type: 'checkbox' });
    holdBox.checked = cap.hold;
    holdBox.addEventListener('change', () => {
      if (cap) cap.hold = holdBox.checked;
    });
    const what = h('b', null, GLYPH_LABEL[cap.act]);
    const isMenu = cap.act === 'menuConfirm' || cap.act === 'menuBack';
    return h(
      'div',
      { class: 'capture-bar', 'data-capture-ignore': '', 'data-testid': 'capture-bar' },
      h(
        'div',
        { class: 'row' },
        h(
          'div',
          { class: 'grow' },
          pad
            ? isMenu
              ? ['Press the gamepad button for ', what, '.']
              : ['Press the gamepad button for ', what, `. Tap it, or keep it held ${HOLD_S} s for a Hold binding.`]
            : ['Press a key, a mouse button or the wheel for ', what, '.'],
        ),
        h('span', { class: 'capture-left mono small dim-text' }, ''),
      ),
      h(
        'div',
        { class: 'row' },
        pad && !isMenu ? h('label', { class: 'row capture-hold', title: 'Bind as "hold this button 0.5 s" (H)' }, holdBox, 'Hold (H)') : null,
        pad && !isMenu ? h('div', { class: 'capture-progress', title: 'Hold progress' }, h('div')) : null,
        h('div', { class: 'grow' }),
        btn('Cancel (Esc)', () => {
          const key = cap ? focusKey(cap.act, cap.slot) : undefined;
          cancelCapture('Nothing changed.');
          render(key);
        }, 'tiny'),
      ),
    );
  }

  function padStatus(): HTMLElement {
    let id = '';
    try {
      for (const p of navigator.getGamepads?.() ?? []) if (p && p.connected) {
        id = p.id;
        break;
      }
    } catch {
      // getGamepads can throw where the Gamepad API is blocked
    }
    return h('div', { class: 'small dim-text' }, id ? `Gamepad: ${id.replace(/\s*\(.*\)\s*$/, '') || id}` : 'No gamepad found yet. Press a button on it to wake it up.');
  }

  function bindings(el: HTMLElement, pad: boolean): void {
    prompts(el);
    if (!pad) {
      el.appendChild(select('Block', [['hold', 'Hold to block'], ['toggle', 'Toggle block']], () => (s.controls.holdToBlock ? 'hold' : 'toggle'), (v) => (s.controls.holdToBlock = v === 'hold')));
    } else {
      el.appendChild(slider('Aim assist strength', () => s.controls.aimAssist, (v) => (s.controls.aimAssist = v)));
      el.appendChild(padStatus());
    }
    const table = tableFor(pad);
    const conflicts = findConflicts(table);
    const conflictSet = new Set<Action>(conflicts.flatMap((c) => c.actions));
    const unbound = unboundActions(table, (x) => pad && x.startsWith('move'));
    if (conflicts.length) el.appendChild(h('div', { class: 'conflict' }, `Shared inputs: ${conflicts.map((c) => c.actions.map((x) => GLYPH_LABEL[x]).join(' / ')).join('; ')}`));
    if (unbound.length) el.appendChild(h('div', { class: 'conflict' }, `Nothing bound: ${unbound.map((x) => GLYPH_LABEL[x]).join(', ')}`));

    const list = h('div', { class: 'col bind-list' });
    list.appendChild(h('div', { class: 'bind-row bind-head small dim-text' }, h('div', null, 'Action'), h('div', null, pad ? 'Button' : 'Key'), h('div', null, 'Second'), h('div')));
    for (const act of ALL_ACTIONS) {
      if (pad && act.startsWith('move')) continue;
      const cur = table[act];
      list.appendChild(
        h(
          'div',
          { class: 'bind-row', 'data-action': act },
          h('div', { class: conflictSet.has(act) ? 'conflict' : unbound.includes(act) ? 'dim-text' : '' }, GLYPH_LABEL[act]),
          slotBtn(pad, act, 0, cur[0]),
          slotBtn(pad, act, 1, cur[1]),
          btn(
            'Clear',
            () => {
              cancelCapture();
              table[act] = [];
              notice = `${GLYPH_LABEL[act]}: nothing bound.`;
              save();
              render(focusKey(act, 0));
            },
            'tiny',
            cur.length === 0,
          ),
        ),
      );
    }
    if (pad) {
      list.appendChild(h('h3', { style: 'margin:10px 0 2px' }, 'Menus'));
      const mp = s.controls.menuPad;
      for (const act of ['menuConfirm', 'menuBack'] as const) {
        list.appendChild(
          h(
            'div',
            { class: 'bind-row', 'data-action': act },
            h('div', null, GLYPH_LABEL[act]),
            slotBtn(true, act, 0, act === 'menuConfirm' ? mp.confirm : mp.back),
            h('div', { class: 'small dim-text' }, act === 'menuConfirm' ? 'presses the focused button' : 'closes / goes back'),
            h('div'),
          ),
        );
      }
    }
    el.appendChild(
      h(
        'div',
        { class: 'row bind-foot' },
        btn('Reset to defaults', () => {
          cancelCapture();
          if (pad) {
            s.controls.gamepad = defaultGamepad();
            s.controls.menuPad = defaultMenuPad();
          } else s.controls.keyboard = defaultKeyboard();
          notice = pad ? 'Gamepad buttons reset.' : 'Keys reset.';
          save();
          render();
        }),
        h(
          'div',
          { class: 'small dim-text' },
          pad
            ? `Left stick moves, right stick aims (fixed). Hold bindings fire after ${HOLD_S} s; a button that also has a Hold binding fires its tap on release. Taking a button another action uses swaps the two.`
            : 'Taking a key another action uses swaps the two. Esc cancels.',
        ),
      ),
    );
    el.appendChild(list);
  }

  // ---- co-op: your name and friendly fire -------------------------------------------------------------------

  function coop(el: HTMLElement): void {
    el.appendChild(h('div', { class: 'row' }, h('div', { style: 'width:240px' }, 'Name in co-op'), nameInput()));
    el.appendChild(h('div', { class: 'small dim-text', style: 'max-width:760px' }, 'What your friends see over your head and on the party cards.'));
    const host = opts.hostFriendlyFire;
    el.appendChild(friendlyFireRow(host ? { hostValue: host() } : {}));
    el.appendChild(
      h(
        'div',
        { class: 'small dim-text', style: 'max-width:760px' },
        host
          ? "You are in someone else's game: the host decides how hard everyone's attacks hit each other."
          : "How hard your party's attacks hit each other in co-op, from off (0%) to double (200%). When you host, everyone plays by your setting. Hitting a downed friend's ghost still revives them.",
      ),
    );
  }

  // ---- game: the offline download ---------------------------------------------------------------------------

  function game(el: HTMLElement): void {
    el.appendChild(h('h3', null, 'Download the game'));
    el.appendChild(
      h(
        'div',
        { class: 'small', style: 'max-width:760px' },
        'A copy of Dungeon Joe that runs from your own computer in its own full-screen window, with no website. Add it to your Steam library to launch it from Steam for personal play (this does not put it on the Steam store).',
      ),
    );
    const offline = import.meta.env.MODE === 'offline';
    if (offline) {
      el.appendChild(h('div', { class: 'bind-notice' }, 'You are playing the downloaded copy. The newest version is always at josephjackman.com/games/dungeonjoe/.'));
    } else if (import.meta.env.DEV) {
      el.appendChild(h('div', { class: 'row' }, btn('Download the game (.zip)', () => undefined, 'primary', true), h('div', { class: 'small dim-text' }, 'This is the dev server: the download is made by the website build (npm run build) and is available on the website.')));
    } else {
      el.appendChild(
        h(
          'div',
          { class: 'row' },
          h('a', { class: 'btn primary', href: `${import.meta.env.BASE_URL}${OFFLINE_ZIP}`, download: 'DungeonJoe-offline.zip', tabindex: '0', 'data-testid': 'download-game' }, 'Download the game (.zip)'),
          h('div', { class: 'small dim-text' }, 'For Windows · about 350 kB'),
        ),
      );
    }
    el.appendChild(
      h(
        'ol',
        { class: 'download-steps' },
        h('li', null, h('b', null, 'Unzip it. '), 'Right-click the .zip → Extract All…, into a folder you will keep (for example Documents\\Games\\Dungeon Joe).'),
        h('li', null, h('b', null, 'Play. '), 'Double-click ', h('span', { class: 'mono' }, 'Dungeon Joe.cmd'), '. It opens the game full screen in its own window (Microsoft Edge, or Chrome, or your browser). Alt+F4 quits.'),
        h(
          'li',
          null,
          h('b', null, 'Add it to Steam. '),
          'In Steam: Games → Add a Non-Steam Game to My Library… → Browse… → set the file type to "All Files" → choose ',
          h('span', { class: 'mono' }, 'Dungeon Joe.cmd'),
          ' → Add Selected Programs. Steam shows it with a blank name and no icon (it is not an .exe), so right-click it → Properties: type Dungeon Joe as its name and click the icon square to pick ',
          h('span', { class: 'mono' }, 'DungeonJoe.ico'),
          ' from the same folder.',
        ),
        h('li', null, h('b', null, 'Saves. '), 'The downloaded copy keeps its own saves, separate from the website. To move a character, use Load Character → Export on one and Import a .dungeonjoe.json on the other. Online co-op still needs the internet.'),
      ),
    );
    el.appendChild(h('div', { class: 'small dim-text' }, 'The same steps are in README.txt inside the zip.'));
  }

  // ---- frame ------------------------------------------------------------------------------------------------

  function close(): void {
    cancelCapture();
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('gamepadconnected', onPad);
    window.removeEventListener('gamepaddisconnected', onPad);
    root.remove();
    onClose();
  }
  /** Esc (and the pad's menu back, which sends Esc) leaves the screen, unless a rebinding is waiting */
  function onKey(e: KeyboardEvent): void {
    if (e.code !== 'Escape' || a.input.capturing || !root.isConnected) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    close();
  }
  function onPad(): void {
    if (!cap && tab === 'gamepad') render();
  }
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('gamepadconnected', onPad);
  window.addEventListener('gamepaddisconnected', onPad);

  function render(focus?: string): void {
    const body0 = panel.querySelector<HTMLElement>('.settings-body');
    const scroll = body0 && focus ? body0.scrollTop : 0;
    clearEl(panel);
    const tabs = h('div', { class: 'tabs' });
    for (const [k, l] of [
      ['video', 'Video & accessibility'],
      ['audio', 'Audio'],
      ['controls', 'Keyboard & mouse'],
      ['gamepad', 'Gamepad'],
      ['coop', 'Co-op'],
      ['game', 'Game'],
    ] as const) {
      const b = btn(l, () => {
        cancelCapture();
        notice = '';
        tab = k;
        lastTab = k;
        render();
      });
      b.setAttribute('data-tab', k);
      if (tab === k) b.classList.add('on');
      tabs.appendChild(b);
    }
    tabs.appendChild(h('div', { class: 'grow' }));
    tabs.appendChild(btn('Back', () => close(), 'primary'));
    panel.appendChild(h('h2', null, 'Settings'));
    panel.appendChild(tabs);
    // the capture bar and the last change stay above the scrolling list, always in view
    if (tab === 'controls' || tab === 'gamepad') {
      const bar = captureBar(tab === 'gamepad');
      if (bar) panel.appendChild(bar);
      else if (notice) panel.appendChild(h('div', { class: 'bind-notice', 'data-testid': 'bind-notice' }, notice));
    }
    const body = h('div', { class: 'col scroll settings-body' });
    if (tab === 'video') video(body);
    else if (tab === 'audio') audio(body);
    else if (tab === 'coop') coop(body);
    else if (tab === 'game') game(body);
    else bindings(body, tab === 'gamepad');
    panel.appendChild(body);
    body.scrollTop = scroll;
    setTimeout(() => {
      const el = (focus && panel.querySelector<HTMLElement>(`[data-focus="${focus}"]`)) || panel.querySelector<HTMLElement>('.tabs button.on');
      el?.focus({ preventScroll: Boolean(focus) });
    }, 0);
  }
  render();
  return root;
}
