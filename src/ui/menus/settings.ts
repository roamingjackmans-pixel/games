// Settings (GAME_DESIGN §17): video, audio, controls (keyboard + gamepad rebinding with conflict
// detection), accessibility, aim assist, hold/toggle block. Saved globally in `dj.settings`.
import { app } from '../../app';
import { ACTION_LABEL, ALL_ACTIONS, type Action } from '../../engine/input/actions';
import { defaultGamepad, defaultKeyboard, findConflicts, keyName, padName, rebind } from '../../engine/input/bindings';
import { btn, clearEl, h, layer } from '../dom';

export function openSettings(onClose: () => void): HTMLElement {
  const a = app();
  const s = a.settings;
  const root = layer('dim');
  root.setAttribute('data-testid', 'settings');
  const panel = h('div', { class: 'panel', style: 'width:900px;height:640px;display:flex;flex-direction:column;gap:10px' });
  root.appendChild(panel);
  let tab: 'video' | 'audio' | 'controls' | 'gamepad' = 'video';
  const save = (): void => {
    a.saveSettings();
    a.applySettings();
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
  const select = <T extends string | number>(label: string, options: [T, string][], get: () => T, set: (v: T) => void): HTMLElement => {
    const sel = h('select', null, ...options.map(([v, l]) => h('option', { value: String(v) }, l)));
    sel.value = String(get());
    sel.addEventListener('change', () => {
      const opt = options.find(([v]) => String(v) === sel.value);
      if (opt) set(opt[0]);
      save();
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
    el.appendChild(h('div', { class: 'row' }, h('div', { style: 'width:240px' }, 'Name in co-op'), nameInput()));
  }
  function nameInput(): HTMLElement {
    const i = h('input', { value: s.net.name, maxlength: '16' });
    i.addEventListener('change', () => {
      s.net.name = i.value.trim() || 'Joe';
      save();
    });
    return i;
  }
  function bindings(el: HTMLElement, pad: boolean): void {
    const table = pad ? s.controls.gamepad : s.controls.keyboard;
    if (!pad) {
      el.appendChild(select('Block', [['hold', 'Hold to block'], ['toggle', 'Toggle block']], () => (s.controls.holdToBlock ? 'hold' : 'toggle'), (v) => (s.controls.holdToBlock = v === 'hold')));
    } else {
      el.appendChild(slider('Aim assist strength', () => s.controls.aimAssist, (v) => (s.controls.aimAssist = v)));
    }
    const conflicts = pad ? findConflicts(s.controls.gamepad) : findConflicts(s.controls.keyboard);
    const conflictSet = new Set<Action>(conflicts.flatMap((c) => c.actions));
    const list = h('div', { class: 'col', style: 'gap:3px;margin-top:8px' });
    const actions = ALL_ACTIONS.filter((x) => !(pad && x.startsWith('move')));
    for (const act of actions) {
      const cur = table[act] as (string | number)[];
      const label = (v: string | number): string => (pad ? padName(v as number) : keyName(v as string));
      const slotBtn = (slot: number): HTMLButtonElement => {
        const b: HTMLButtonElement = btn(
          cur[slot] !== undefined ? label(cur[slot]!) : '—',
          () => {
            b.textContent = pad ? 'Press a button…' : 'Press a key or click…';
            const done = (v: string | number): void => {
              if (!pad && v === 'Escape') {
                render();
                return;
              }
              if (pad) rebind(s.controls.gamepad, act, v as number, slot);
              else rebind(s.controls.keyboard, act, v as string, slot);
              save();
              render();
            };
            if (pad) a.input.capturePad = (n) => done(n);
            else a.input.captureKey = (code) => done(code);
          },
          'tiny',
        );
        return b;
      };
      list.appendChild(h('div', { class: 'bind-row' }, h('div', { class: conflictSet.has(act) ? 'conflict' : '' }, ACTION_LABEL[act]), slotBtn(0), pad ? h('span') : slotBtn(1)));
    }
    if (conflicts.length) el.appendChild(h('div', { class: 'conflict' }, `Conflicts: ${conflicts.map((c) => c.actions.map((x) => ACTION_LABEL[x]).join(' / ')).join('; ')}`));
    el.appendChild(
      h(
        'div',
        { class: 'row' },
        btn('Reset to defaults', () => {
          if (pad) s.controls.gamepad = defaultGamepad();
          else s.controls.keyboard = defaultKeyboard();
          save();
          render();
        }),
        h('div', { class: 'small dim-text' }, pad ? 'Hold-buttons (e.g. Hold Back) trigger after 0.5 s.' : 'Assigning a key already in use moves it here (no duplicates).'),
      ),
    );
    el.appendChild(list);
  }

  function render(): void {
    clearEl(panel);
    const tabs = h('div', { class: 'tabs' });
    for (const [k, l] of [
      ['video', 'Video & accessibility'],
      ['audio', 'Audio'],
      ['controls', 'Keyboard & mouse'],
      ['gamepad', 'Gamepad'],
    ] as const) {
      const b = btn(l, () => {
        tab = k;
        render();
      });
      if (tab === k) b.classList.add('on');
      tabs.appendChild(b);
    }
    tabs.appendChild(h('div', { class: 'grow' }));
    tabs.appendChild(
      btn('Back', () => {
        root.remove();
        onClose();
      }, 'primary'),
    );
    panel.appendChild(h('h2', null, 'Settings'));
    panel.appendChild(tabs);
    const body = h('div', { class: 'col scroll', style: 'flex:1;gap:8px' });
    if (tab === 'video') video(body);
    else if (tab === 'audio') audio(body);
    else bindings(body, tab === 'gamepad');
    panel.appendChild(body);
    setTimeout(() => panel.querySelector<HTMLElement>('.tabs button')?.focus(), 0);
  }
  render();
  return root;
}
