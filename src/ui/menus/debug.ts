// Hidden debug menu (D29): Ctrl+Shift+D → code prompt → SHA-256 check → tools panel.
import { checkDebugCode } from '../../game/debug/hash';
import { debugApi, isDebugUnlocked, overlays, setDebugUnlocked } from '../../game/debug/menu';
import { playSfx } from '../../engine/audio/sfx';
import { btn, h, toast, uiRoot } from '../dom';
import { GEM_FAMILIES } from '../../data/gems';

let panel: HTMLElement | null = null;
let prompt: HTMLElement | null = null;
let statsEl: HTMLElement | null = null;
let statsTimer: ReturnType<typeof setInterval> | null = null;

export function installDebugMenu(): void {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
      e.preventDefault();
      if (isDebugUnlocked()) togglePanel();
      else openPrompt();
    }
  });
  // Dev server only: ?debug unlocks without the code so automated playtests never handle it.
  // import.meta.env.DEV is false in production builds, so this branch is removed from the shipped game.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('debug')) {
    setDebugUnlocked(true);
  }
}

function openPrompt(): void {
  if (prompt) return;
  // the box always opens empty (D190): browsers' password managers ignore autocomplete="off" on a password box and
  // fill in a code they saved, so it is a plain text box with masked letters where the browser can mask them (no
  // password manager looks at it), marked for the common managers to skip, and anything filled in before the first
  // key press is wiped
  const masked = typeof CSS !== 'undefined' && CSS.supports('-webkit-text-security', 'disc');
  const input = h('input', {
    type: masked ? 'text' : 'password',
    name: `dj-${Date.now().toString(36)}`,
    placeholder: 'code',
    autocomplete: masked ? 'off' : 'new-password',
    autocapitalize: 'off',
    spellcheck: 'false',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    'data-bwignore': 'true',
    'data-form-type': 'other',
    style: `width:200px${masked ? ';-webkit-text-security:disc' : ''}`,
    'data-testid': 'debug-code',
  });
  input.value = '';
  let typed = false;
  // typing, deleting and pasting carry an inputType; a password manager's fill does not (or calls it a replacement)
  input.addEventListener('input', (e) => {
    const kind = (e as InputEvent).inputType;
    if (kind && kind !== 'insertReplacementText') typed = true;
    else if (!typed) input.value = '';
  });
  for (const ms of [0, 60, 250, 600, 1200]) setTimeout(() => {
    if (!typed) input.value = '';
  }, ms);
  const msg = h('div', { class: 'small dim-text' }, 'Owner code');
  const close = (): void => {
    prompt?.remove();
    prompt = null;
  };
  const submit = async (): Promise<void> => {
    const ok = await checkDebugCode(input.value);
    if (ok) {
      setDebugUnlocked(true);
      playSfx('uiConfirm');
      close();
      togglePanel();
    } else {
      playSfx('uiError');
      msg.textContent = 'Wrong code.';
      msg.className = 'small bad';
      input.value = '';
    }
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') void submit();
    if (e.key === 'Escape') close();
  });
  prompt = h(
    'div',
    { class: 'layer clear', style: 'align-items:flex-start;padding-top:120px' },
    h('div', { class: 'panel col', style: 'width:280px', 'data-testid': 'debug-prompt' }, h('h3', null, 'Debug'), msg, input, h('div', { class: 'row' }, btn('Enter', () => void submit(), 'primary'), btn('Cancel', close))),
  );
  uiRoot().appendChild(prompt);
  setTimeout(() => input.focus(), 0);
}

function num(v: string, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function togglePanel(): void {
  if (panel) {
    panel.remove();
    panel = null;
    if (statsTimer) clearInterval(statsTimer);
    statsTimer = null;
    return;
  }
  buildPanel();
}

/** Rebuild the panel (called when the active scene changes its API). */
export function refreshDebugPanel(): void {
  if (panel) {
    panel.remove();
    panel = null;
    buildPanel();
  }
}

function buildPanel(): void {
  const api = debugApi();
  const out = h('div', { class: 'small mono', 'data-testid': 'debug-out' }, api ? 'Ready.' : 'No game running (start or load a character).');
  const say = (s: string): void => {
    out.textContent = s;
  };
  const call = (f: () => string): void => {
    try {
      say(f());
    } catch (e) {
      say(`Error: ${String(e)}`);
    }
  };
  const stop = (e: Event): void => e.stopPropagation();
  const field = (attrs: Record<string, string>): HTMLInputElement => {
    const i = h('input', attrs);
    i.addEventListener('keydown', stop);
    return i;
  };
  const select = (opts: string[], testid: string): HTMLSelectElement => {
    const s = h('select', { 'data-testid': testid }, ...opts.map((o) => h('option', { value: o }, o)));
    s.addEventListener('keydown', stop);
    return s;
  };
  statsEl = h('div', { class: 'mono small', 'data-testid': 'debug-stats' });

  const sections: HTMLElement[] = [];
  if (api) {
    const god = h('input', { type: 'checkbox', 'data-testid': 'debug-god' });
    god.checked = api.isGod();
    god.addEventListener('change', () => {
      api.god(god.checked);
      say(`God mode ${god.checked ? 'on' : 'off'}`);
    });
    const bases = api.listBases();
    const baseSel = select(bases, 'debug-base');
    const rar = select(['common', 'uncommon', 'rare', 'epic', 'legendary'], 'debug-rarity');
    const ilvl = field({ type: 'number', value: '1', style: 'width:50px' });
    const gemFam = select(GEM_FAMILIES, 'debug-gem');
    const gemFam2 = select(['(none)', ...GEM_FAMILIES], 'debug-gem2');
    const gemFam3 = select(['(none)', ...GEM_FAMILIES], 'debug-gem3');
    const gemLv = field({ type: 'number', value: '1', style: 'width:44px', title: 'Gem level 1–50' });
    const gemRoll = field({ type: 'number', value: '0', style: 'width:44px', title: 'Quality roll −50 … +50 (%)' });
    const cons = select(['throwing_knife', 'firebomb', 'frost_jar', 'holy_water', 'stamina_tonic', 'lure', 'shard_pouch'], 'debug-cons');
    const level = field({ type: 'number', value: '10', style: 'width:60px' });
    const statSel = select(['hp', 'endurance', 'bonk', 'slicey', 'brain', 'prayer'], 'debug-stat');
    const statVal = field({ type: 'number', value: '30', style: 'width:50px' });
    const enemies = api.listEnemies();
    const enemySel = select(enemies, 'debug-enemy');
    const eliteSel = select(['(none)', 'frenzied', 'armored', 'vampiric', 'arcane', 'molten', 'frostbound', 'shielded', 'summoner'], 'debug-elite');
    const zoneSel = select(api.listZones(), 'debug-zone');
    const roomSel = select(api.listRooms(), 'debug-room');
    const cycle = field({ type: 'number', value: '1', style: 'width:50px' });
    const flaskCur = field({ type: 'number', value: '5', style: 'width:40px' });
    const flaskMax = field({ type: 'number', value: '5', style: 'width:40px' });
    const amount = field({ type: 'number', value: '10000', style: 'width:80px' });
    const ov = (k: keyof typeof overlays, label: string): HTMLElement => {
      const c = h('input', { type: 'checkbox' });
      c.checked = overlays[k];
      c.addEventListener('change', () => {
        overlays[k] = c.checked;
      });
      return h('label', { class: 'row' }, c, label);
    };
    sections.push(
      h('fieldset', null, h('legend', null, 'Player'), h('label', { class: 'row' }, god, 'God mode'),
        h('div', { class: 'row wrap' }, 'Level', level, btn('Set', () => call(() => api.setLevel(num(level.value, 1))))),
        h('div', { class: 'row wrap' }, statSel, statVal, btn('Set stat', () => call(() => api.setStat(statSel.value, num(statVal.value, 1))))),
        h('div', { class: 'row wrap' }, 'Flask', flaskCur, '/', flaskMax, btn('Set', () => call(() => api.setFlask(num(flaskCur.value), num(flaskMax.value))))),
        h('div', { class: 'row wrap' }, amount, btn('+Shards', () => call(() => api.addShards(num(amount.value)))), btn('+Glowen', () => call(() => api.addGlowen(num(amount.value)))), btn('+Tear', () => call(() => api.addTear()))),
        h('div', { class: 'row wrap' }, btn('Learn all spells', () => call(() => api.learnAllSpells())))),
      h('fieldset', null, h('legend', null, 'Items'),
        h('div', { class: 'row wrap' }, baseSel, rar, 'ilvl', ilvl, btn('Give', () => call(() => api.giveItem(baseSel.value, rar.value, num(ilvl.value, 1))))),
        h('div', { class: 'row wrap' }, gemFam, gemFam2, gemFam3, 'Lv', gemLv, 'Roll %', gemRoll, btn('Give gem', () => call(() => api.giveGem([gemFam.value, gemFam2.value, gemFam3.value].filter((f) => f !== '(none)').join('+'), num(gemLv.value, 1), num(gemRoll.value, 0))))),
        h('div', { class: 'row wrap' }, cons, btn('Give ×5', () => call(() => api.giveConsumable(cons.value, 5))))),
      h('fieldset', null, h('legend', null, 'Enemies'),
        h('div', { class: 'row wrap' }, enemySel, eliteSel, btn('Spawn', () => call(() => api.spawnEnemy(enemySel.value, eliteSel.value === '(none)' ? null : eliteSel.value)), '', false)),
        h('div', { class: 'row wrap' }, btn('Kill all', () => call(() => api.killAll())), btn('Test arena', () => call(() => api.testArena())))),
      h('fieldset', null, h('legend', null, 'World'),
        h('div', { class: 'row wrap' }, zoneSel, btn('Jump to zone', () => call(() => api.jumpZone(num(zoneSel.value.split(' ')[0] ?? '1', 1))))),
        h('div', { class: 'row wrap' }, roomSel, btn('Jump to room', () => call(() => api.jumpRoom(roomSel.value))), btn('Boss', () => call(() => api.jumpBoss())), btn('Reveal map', () => call(() => api.revealMap()))),
        h('div', { class: 'row wrap' }, 'Cycle', cycle, btn('Set cycle', () => call(() => api.setCycle(num(cycle.value)))))),
      h('fieldset', null, h('legend', null, 'Overlays'), h('div', { class: 'row wrap' }, ov('hitbox', 'Hitboxes'), ov('telegraph', 'Telegraph debug'), ov('ai', 'AI state'), ov('frameGraph', 'Frame graph'))),
    );
  }
  panel = h(
    'div',
    { class: 'debug-panel', 'data-testid': 'debug-panel' },
    h('div', { class: 'row' }, h('h3', { class: 'grow', style: 'margin:0' }, 'Debug'), btn('×', togglePanel, 'tiny')),
    statsEl,
    ...sections,
    out,
  );
  panel.addEventListener('mousedown', stop);
  uiRoot().appendChild(panel);
  const update = (): void => {
    const a = debugApi();
    if (!a || !statsEl) return;
    const s = a.stats();
    statsEl.textContent = `FPS ${s.fps.toFixed(0)} | sim ${s.simMs.toFixed(2)} ms | render ${s.renderMs.toFixed(2)} ms\nentities ${s.entities} | enemies ${s.enemies} | proj ${s.projectiles} | tele ${s.telegraphs} | particles ${s.particles}${s.heapMb ? ` | heap ${s.heapMb.toFixed(0)} MB` : ''}`;
    statsEl.style.whiteSpace = 'pre';
  };
  update();
  statsTimer = setInterval(update, 250);
  if (!api) toast('Debug: no game running yet');
}
