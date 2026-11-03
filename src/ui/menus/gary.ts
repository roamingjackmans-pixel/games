// Gary's cart (GAME_DESIGN §11): 3–5 special things for Glowen. Every entry says what it is; the detail
// pane shows the full stats of the one under the pointer or focus (gear is compared with what you wear).
import { CONSUMABLES } from '../../data/consumables';
import { gemColor, gemTitle, perkText } from '../../data/gems';
import { garyEntryName } from '../../game/bonfire/gary';
import type { Character, GaryStockEntry } from '../../game/types';
import { btn, clearEl, fmt, h } from '../dom';
import { gemIcon, gemKindChip, gemTooltip, glowenEl, itemIcon, itemSummary, itemTooltip, RARITY_BORDER, staticTip } from '../tooltip';

export interface GaryView {
  char: Character;
  stock: GaryStockEntry[];
  buy(e: GaryStockEntry): { ok: boolean; msg: string };
  close(): void;
}

/** What an entry is, in one short line. */
function entryKind(e: GaryStockEntry): string {
  switch (e.kind) {
    case 'item':
    case 'ring':
      return e.item ? itemSummary(e.item) : 'Gear';
    case 'gem':
      return e.gem ? e.gem.perks.map(perkText).join(' · ') : 'Gem';
    case 'consumable':
      return e.consumable ? CONSUMABLES[e.consumable].description : 'Consumable';
    case 'tear':
      return 'Undo your stats at a bonfire: every point comes back to place freely.';
  }
}

function entryColor(e: GaryStockEntry): string {
  if (e.item) return RARITY_BORDER[e.item.rarity] ?? '#efe6d2';
  if (e.kind === 'gem' && e.gem) return gemColor(e.gem);
  return e.kind === 'tear' ? '#9ad0ff' : '#efe6d2';
}

function entryDetail(e: GaryStockEntry, c: Character): HTMLElement {
  if ((e.kind === 'item' || e.kind === 'ring') && e.item) return staticTip(itemTooltip(e.item, c, 'auto'));
  if (e.kind === 'gem' && e.gem) return staticTip(gemTooltip(e.gem));
  const name = garyEntryName(e);
  return staticTip(h('div', { class: 'tooltip' }, h('div', { class: 'name' }, name), h('div', null, entryKind(e)), e.kind === 'consumable' && e.consumable ? h('div', { class: 'small dim-text' }, `You carry ${c.consumables[e.consumable] ?? 0}.`) : null));
}

export function renderGary(l: HTMLElement, v: GaryView, onBought: () => void): void {
  const c = v.char;
  let focus = Math.max(0, v.stock.findIndex((e) => !e.sold && (e.kind === 'item' || e.kind === 'ring')));
  const detail = h('div', { style: 'width:340px;flex:none', 'data-testid': 'gary-detail' });
  const showDetail = (i: number): void => {
    focus = i;
    clearEl(detail);
    const e = v.stock[i];
    if (e) detail.appendChild(entryDetail(e, c));
  };
  const draw = (msg = ''): void => {
    clearEl(l);
    const rows = v.stock.map((e, i) => {
      const icon = (e.kind === 'item' || e.kind === 'ring') && e.item ? itemIcon(e.item, 30) : e.kind === 'gem' && e.gem ? gemIcon(e.gem, 26) : h('span', { style: 'width:30px;display:inline-block' });
      const b = btn(e.sold ? 'Sold' : ['Buy ', glowenEl(e.price)], () => {
        const o = v.buy(e);
        if (o.ok) onBought();
        draw(o.msg);
      }, 'tiny', e.sold || c.glowen < e.price);
      b.addEventListener('focus', () => showDetail(i));
      const row = h(
        'div',
        { class: 'card row', style: `padding:6px 8px;${e.sold ? 'opacity:.5' : ''}`, 'data-testid': `gary-entry-${i}` },
        icon,
        h(
          'div',
          { class: 'col', style: 'gap:1px;flex:1;min-width:0' },
          h('div', { class: 'row', style: 'gap:6px' }, h('span', { style: `color:${entryColor(e)}` }, e.kind === 'gem' && e.gem ? gemTitle(e.gem) : garyEntryName(e)), e.kind === 'gem' && e.gem ? gemKindChip(e.gem) : null),
          h('div', { class: 'small dim-text' }, entryKind(e)),
        ),
        b,
      );
      row.addEventListener('mouseenter', () => showDetail(i));
      return row;
    });
    showDetail(focus);
    l.appendChild(
      h(
        'div',
        { class: 'panel col', style: 'width:860px' },
        h('h2', null, 'Gary'),
        h('div', { class: 'small dim-text' }, '"Don’t ask where I got it." · You have ', glowenEl(c.glowen), ` (${fmt(c.glowen)} Glowen).`),
        h('div', { class: 'row', style: 'align-items:flex-start;gap:16px' }, h('div', { class: 'col', style: 'gap:6px;flex:1;min-width:0' }, ...rows), detail),
        msg ? h('div', { class: 'small' }, msg) : null,
        btn('Leave', () => v.close(), 'big'),
      ),
    );
  };
  draw();
}
