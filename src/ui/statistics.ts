// Statistics screen (GAME_DESIGN §21), from the title menu and the pause menu, below Achievements. Two views: this
// character (the save's own counters; on the title screen a slot picker chooses whose) and all characters (the
// account totals in `dj.stats`). Grouped sections, a strip of headline numbers, and a few unkind observations.
import './statistics.css';
import { BOSSES } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import { ZONES } from '../data/zones';
import { CLASSES } from '../data/classes';
import { TILE } from '../game/room';
import { peekSaveCounters, stats, type Counters } from '../game/stats';
import type { SaveFile } from '../game/types';
import { btn, clearEl, fmt, h, layer } from './dom';

export interface StatisticsOpts {
  /** in a run: the character being played */
  save?: SaveFile;
  /** on the title screen: every save to pick from, and the one to show first */
  saves?: SaveFile[];
  slot?: number | null;
}

// ------------------------------------------------------------------ formatting

export function fmtDuration(sec: number): string {
  const s = Math.floor(sec);
  const hrs = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

/** m:ss for boss times */
export function fmtClock(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** World px → metres (a tile is a metre) → "830 m" or "12.4 km". */
export function fmtDistance(px: number): string {
  const m = px / TILE;
  return m < 1000 ? `${Math.floor(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

function enemyName(id: string): string {
  if (id === '?') return 'gravity, mostly';
  return ENEMIES[id]?.name ?? BOSSES[id]?.name ?? cap(id.replace(/_/g, ' '));
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The key with the highest count among `prefix*` keys. */
export function topOf(c: Counters, prefix: string): [string, number] | null {
  let best: [string, number] | null = null;
  for (const [k, v] of Object.entries(c)) {
    if (!k.startsWith(prefix) || v <= 0) continue;
    const id = k.slice(prefix.length);
    if (!best || v > best[1] || (v === best[1] && id < best[0])) best = [id, v];
  }
  return best;
}

/** The headline lines, worked out from the counters (exported for the tests). */
export function headlines(c: Counters): { label: string; value: string; sub: string }[] {
  const n = (k: string): number => c[k] ?? 0;
  const hated = topOf(c, 'kill:');
  const nemesis = topOf(c, 'deathBy:');
  const affix = topOf(c, 'affix:');
  const donated = Math.max(0, n('shardsDropped') - n('shardsRecovered'));
  const kd = n('kills') / Math.max(1, n('deaths'));
  return [
    { label: 'Most hated enemy', value: hated ? enemyName(hated[0]) : 'Nobody yet', sub: hated ? `${fmt(hated[1])} kills` : 'Go and hit something' },
    { label: 'Nemesis', value: nemesis ? enemyName(nemesis[0]) : 'None', sub: nemesis ? `killed you ${fmt(nemesis[1])} time${nemesis[1] === 1 ? '' : 's'}` : 'Suspiciously undead' },
    { label: 'Shards donated to the floor', value: fmt(donated), sub: n('shardsDropped') ? `${Math.round((100 * Math.min(n('shardsRecovered'), n('shardsDropped'))) / n('shardsDropped'))}% picked back up` : 'The floor is still waiting' },
    { label: 'Favourite elite to flatten', value: affix ? cap(affix[0]) : 'None', sub: affix ? `${fmt(affix[1])} elites` : 'They were all too scary' },
    { label: 'Kills per death', value: kd >= 100 ? fmt(kd) : kd.toFixed(1), sub: n('deaths') ? `${fmt(n('kills'))} for ${fmt(n('deaths'))}` : 'Undefeated (so far)' },
  ];
}

// ------------------------------------------------------------------ sections

type Row = [label: string, value: string, cls?: string];

function sections(c: Counters): { title: string; rows: Row[] }[][] {
  const n = (k: string): number => c[k] ?? 0;
  const N = (k: string): string => fmt(n(k));
  const lootTotal = ['common', 'uncommon', 'rare', 'epic', 'legendary'].reduce((a, r) => a + n(`loot:${r}`), 0);
  const bosses: Row[] = Object.values(BOSSES)
    .sort((a, b) => a.zone - b.zone)
    .map((b) => {
      const k = n(`boss:${b.id}`);
      const best = c[`best:boss:${b.id}`];
      return [b.name, k ? `×${fmt(k)}${best ? ` · best ${fmtClock(best)}` : ''}` : 'not yet', k ? '' : 'none'] as Row;
    });
  const zones: Row[] = ZONES.filter((z) => n(`zoneKills:${z.id}`) > 0).map((z) => [z.name, N(`zoneKills:${z.id}`)] as Row);
  if (!zones.length) zones.push(['Nowhere yet', '—', 'none']);
  return [
    [
      {
        title: 'Combat',
        rows: [
          ['Enemies killed', N('kills')],
          ['Elites killed', N('elites')],
          ['Bosses killed', N('bosses')],
          ['Mimics killed', N('mimics')],
          ['Damage dealt', N('dmgDealt')],
          ['Damage taken', N('dmgTaken')],
          ['Biggest single hit', N('most:hit')],
          ['Critical hits', N('crits')],
          ['Weakness hits ("Weak!")', N('weakHits')],
          ['Resisted hits', N('resistHits')],
          ['Parries', N('parries')],
          ['Ripostes', N('ripostes')],
          ['Dodges', N('dodges')],
          ['Blocks', N('blocks')],
          ['Thermos sips', N('sips')],
        ],
      },
    ],
    [
      {
        title: 'Death & Shards',
        rows: [
          ['Deaths', N('deaths')],
          ['…in boss fights', N('bossDeaths')],
          ['Falls into pits', N('falls')],
          ['Mimic bites', N('mimicBites')],
          ['Shards gained', N('shardsGained')],
          ['Shards spent', N('shardsSpent')],
          ['Shards dropped on death', N('shardsDropped')],
          ['Shards recovered', N('shardsRecovered')],
          ['Most Shards held at once', N('most:shards')],
          ['Levels gained', N('levels')],
          ['Glowen earned', N('glowenEarned'), 'glowen'],
          ['Glowen spent', N('glowenSpent'), 'glowen'],
        ],
      },
      {
        title: 'Co-op',
        rows: [
          ['Time in co-op', fmtDuration(n('coopTime'))],
          ['Biggest party', n('most:party') ? N('most:party') : '—'],
          ['Revives given', N('revivesGiven')],
          ['Revives received', N('revivesReceived')],
          ['Times downed', N('downed')],
        ],
      },
    ],
    [
      {
        title: 'Loot',
        rows: [
          ['Items found', fmt(lootTotal)],
          ['Common', N('loot:common'), 'r-common'],
          ['Uncommon', N('loot:uncommon'), 'r-uncommon'],
          ['Rare', N('loot:rare'), 'r-rare'],
          ['Epic', N('loot:epic'), 'r-epic'],
          ['Legendary', N('loot:legendary'), 'r-legendary'],
          ['Gems found', N('gems')],
          ['Gems upgraded / fused', `${N('gemsUpgraded')} / ${N('gemsFused')}`],
          ['Chests opened', N('chests')],
          ['Gary visits', N('garyVisits')],
          ['Bought from Gary', N('garyBuys')],
          ['Glowen spent at Gary', N('garyGlowen'), 'glowen'],
        ],
      },
      {
        title: 'Exploration',
        rows: [
          ['Time played', fmtDuration(n('playtime'))],
          ['Distance walked', fmtDistance(n('distance'))],
          ['Rooms entered', N('rooms')],
          ['Rooms cleared', N('roomsCleared')],
          ['Bonfires lit', N('bonfires')],
          ['Deepest zone', n('most:zone') ? ZONES[n('most:zone') - 1]?.name ?? N('most:zone') : '—'],
          ['NG+ cycles finished', N('cycles')],
        ],
      },
    ],
    [
      { title: 'Bosses', rows: bosses },
      { title: 'Kills by zone', rows: zones },
    ],
  ];
}

function sectionEl(s: { title: string; rows: Row[] }): HTMLElement {
  return h(
    'div',
    { class: 'stat-sec', 'data-sec': s.title },
    h('h3', null, s.title),
    ...s.rows.map(([label, value, cls]) => h('div', { class: `stat-row${cls ? ` ${cls}` : ''}` }, h('span', { class: 'stat-label' }, label), h('span', { class: 'stat-val' }, value))),
  );
}

/** The body for one set of counters. */
export function statsBody(c: Counters): HTMLElement {
  return h(
    'div',
    { class: 'col', style: 'gap:10px' },
    h(
      'div',
      { class: 'stat-heads' },
      ...headlines(c).map((x) => h('div', { class: 'stat-head' }, h('div', { class: 'stat-head-label' }, x.label), h('div', { class: 'stat-head-val' }, x.value), h('div', { class: 'stat-head-sub' }, x.sub))),
    ),
    h('div', { class: 'stat-grid' }, ...sections(c).map((col) => h('div', { class: 'stat-col' }, ...col.map(sectionEl)))),
  );
}

// ------------------------------------------------------------------ the screen

/** The Statistics screen; Esc or Back closes it and calls onClose. */
export function openStatistics(onClose: () => void, opts: StatisticsOpts = {}): HTMLElement {
  const t = stats();
  t.flush();
  const saves = opts.save ? [opts.save] : [...(opts.saves ?? [])].sort((a, b) => a.slot - b.slot);
  let pick: SaveFile | null = opts.save ?? saves.find((s) => s.slot === opts.slot) ?? saves[0] ?? null;
  let tab: 'char' | 'all' = pick ? 'char' : 'all';
  const root = layer('dim');
  root.setAttribute('data-testid', 'statistics');
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
  const panel = h('div', { class: 'panel stat-panel' });
  root.appendChild(panel);

  const render = (focusKey?: string): void => {
    clearEl(panel);
    const tabBtn = (key: 'char' | 'all', label: string, disabled: boolean): HTMLElement => {
      const b = btn(label, () => {
        tab = key;
        render(`tab-${key}`);
      }, `tiny stat-tab${tab === key ? ' on' : ''}`, disabled);
      b.setAttribute('data-key', `tab-${key}`);
      b.setAttribute('data-testid', `stat-tab-${key}`);
      return b;
    };
    const back = btn('Back', close, 'primary');
    back.setAttribute('data-key', 'back');
    panel.appendChild(h('div', { class: 'row stat-header' }, h('h2', { class: 'grow' }, 'Statistics'), tabBtn('char', 'This character', !pick), tabBtn('all', 'All characters', false), back));
    // the slot picker's row is always there (hidden on All characters), so the tables never move between tabs
    if (!opts.save && saves.length > 1) {
      const hidden = !(tab === 'char' && pick);
      const row = h(
        'div',
        { class: 'row wrap stat-slots', style: hidden ? 'visibility:hidden' : '' },
        ...saves.map((s) => {
          const b = btn(
            `${s.character.name} · Lv ${s.character.level}`,
            () => {
              pick = s;
              render(`slot-${s.slot}`);
            },
            `tiny stat-slot${s === pick ? ' on' : ''}`,
            hidden,
          );
          if (hidden) b.tabIndex = -1;
          else {
            b.setAttribute('data-key', `slot-${s.slot}`);
            b.setAttribute('data-testid', `stat-slot-${s.slot}`);
          }
          return b;
        }),
      );
      panel.appendChild(row);
    }
    if (tab === 'char' && pick) {
      const c = pick.character;
      panel.appendChild(h('div', { class: 'small dim-text stat-note' }, `${c.name}, ${CLASSES[c.classId].name}, level ${c.level}${c.cycle ? ` · Cycle ${c.cycle + 1}` : ''}. Numbers from before this screen existed start at what the save already knew.`));
      panel.appendChild(statsBody(peekSaveCounters(pick)));
    } else {
      panel.appendChild(h('div', { class: 'small dim-text stat-note' }, 'Every character this browser has ever played, deleted ones included. Co-op counts what you did, not what your friends did.'));
      panel.appendChild(statsBody(t.rec.c));
    }
    setTimeout(() => {
      // on opening: the first character button below the header if there is one, else Back (D148)
      const first = !focusKey ? [...panel.querySelectorAll<HTMLButtonElement>('.stat-slots button')].find((b) => !b.disabled && b.offsetParent !== null && getComputedStyle(b.parentElement!).visibility !== 'hidden') : null;
      (first ?? panel.querySelector<HTMLElement>(`[data-key="${focusKey ?? 'back'}"]`) ?? back).focus();
    }, 0);
  };
  render();
  return root;
}
