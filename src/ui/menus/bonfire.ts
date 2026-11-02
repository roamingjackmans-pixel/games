// Bonfire menu (GAME_DESIGN §9.1): Level up · Respec · Gem bench · Shop · Warp (+ Spell loadout from M6).
import { CONSUMABLES } from '../../data/consumables';
import { GEMS, gemName } from '../../data/gems';
import { levelCost, gemRerollCost, gemSellValue, gemUpgradeCost } from '../../game/combat/formulas';
import { canSocket, itemSellValue } from '../../game/items/inventory';
import { shopConsumables, shopGemPrice, shopItemPrice } from '../../game/bonfire/shop';
import type { Character, ConsumableId, Gem, Item, StatId } from '../../game/types';
import { btn, clearEl, fmt, h, layer, toast } from '../dom';
import { gemIcon, itemIcon, itemTooltip } from '../tooltip';

export interface BonfireOps {
  levelUp(stat: StatId): string;
  respec(): string;
  socket(itemId: string, socketIdx: number, gemIdx: number): string;
  unsocket(itemId: string, socketIdx: number): string;
  upgradeGem(gemIdx: number): string;
  rerollGem(gemIdx: number): string;
  sellItem(itemId: string): string;
  sellGem(gemIdx: number): string;
  sellConsumable(id: ConsumableId): string;
  buyConsumable(id: ConsumableId): string;
  buyGem(): string;
  buyPiece(): string;
  warp(bonfireId: string): string;
}

export interface BonfireView {
  char: Character;
  bonfireId: string;
  firstRest: boolean;
  shopGem: Gem;
  shopPiece: Item | null;
  discovered: { id: string; label: string; used: boolean }[];
  ops: BonfireOps;
  extraTabs?: { label: string; render: (el: HTMLElement, rerender: () => void) => void }[];
  openInventory(): void;
  close(): void;
}

const STATS: { id: StatId; label: string; what: string }[] = [
  { id: 'hp', label: 'HP', what: 'max health' },
  { id: 'stamina', label: 'Stamina', what: 'max stamina and regen' },
  { id: 'bonk', label: 'Bonk', what: 'heavy weapons, crossbows' },
  { id: 'slicey', label: 'Slicey', what: 'fast weapons, bows' },
  { id: 'brain', label: 'Brain', what: 'staff spells' },
  { id: 'prayer', label: 'Prayer', what: 'talisman spells, flask' },
];

export function openBonfire(v: BonfireView): HTMLElement {
  const root = layer('dim');
  root.setAttribute('data-testid', 'bonfire-menu');
  const panel = h('div', { class: 'panel', style: 'width:980px;height:640px;display:flex;flex-direction:column;gap:10px' });
  root.appendChild(panel);
  let tab = 'level';
  let selItem: string | null = null;
  const say = (msg: string): void => {
    if (msg) toast(msg);
    render();
  };

  function levelTab(el: HTMLElement): void {
    const c = v.char;
    const cost = levelCost(c.level);
    el.appendChild(h('div', { class: 'row', style: 'gap:30px' }, h('div', null, `Level ${c.level}`), h('div', { class: 'mono' }, `◆ ${fmt(c.shards)} Shards`), h('div', { class: c.freePoints ? 'good' : c.shards >= cost ? 'good' : 'bad' }, c.freePoints ? `${c.freePoints} free points from a Tear` : `Next level: ${fmt(cost)}`)));
    const grid = h('div', { class: 'col', style: 'gap:6px;margin-top:10px' });
    for (const s of STATS) {
      grid.appendChild(
        h(
          'div',
          { class: 'row' },
          h('div', { style: 'width:110px' }, s.label),
          h('div', { class: 'mono', style: 'width:40px' }, String(c.stats[s.id])),
          btn('+1', () => say(v.ops.levelUp(s.id)), 'tiny', c.stats[s.id] >= 99 || (c.freePoints <= 0 && c.shards < cost)),
          h('div', { class: 'small dim-text' }, s.what),
        ),
      );
    }
    el.appendChild(grid);
    el.appendChild(h('hr'));
    el.appendChild(h('div', { class: 'row' }, btn(`Respec with a Tear of Undoing (${c.tears})`, () => say(v.ops.respec()), 'danger', c.tears <= 0), h('div', { class: 'small dim-text' }, 'Stats return to your class base; every point comes back to place freely.')));
  }

  function gemsTab(el: HTMLElement): void {
    const c = v.char;
    const items = [c.equipment.main, c.altMain, c.equipment.head, c.equipment.body, c.equipment.legs, ...c.bag].filter((i): i is Item => !!i && i.sockets.length > 0);
    const list = h('div', { class: 'col', style: 'gap:4px;width:420px;max-height:500px;overflow:auto' }, h('h3', null, 'Socketed gear'));
    if (items.length === 0) list.appendChild(h('div', { class: 'dim-text' }, 'Nothing you carry has sockets. Rare and better weapons do.'));
    for (const it of items) {
      const row = h('div', { class: `card ${selItem === it.id ? 'on' : ''}` });
      row.appendChild(h('div', { class: `r-${it.rarity}` }, it.name));
      const sockets = h('div', { class: 'row' });
      it.sockets.forEach((g, i) => {
        if (g) sockets.appendChild(btn([gemIcon(g, 20), ` ${gemName(g.family, g.tier)} (remove)`], () => say(v.ops.unsocket(it.id, i)), 'tiny'));
        else
          sockets.appendChild(
            btn(`◇ empty — ${selItem === it.id ? 'pick a gem →' : 'select'}`, () => {
              selItem = it.id;
              render();
            }, 'tiny'),
          );
      });
      row.appendChild(sockets);
      list.appendChild(row);
    }
    const gems = h('div', { class: 'col', style: 'gap:4px;flex:1;max-height:500px;overflow:auto' }, h('h3', null, `Loose gems · ✦ ${fmt(c.stardust)} Stardust`));
    c.gems.forEach((g, gi) => {
      const sel = selItem ? items.find((i) => i.id === selItem) : null;
      const free = sel ? sel.sockets.findIndex((x) => !x) : -1;
      gems.appendChild(
        h(
          'div',
          { class: 'row wrap' },
          gemIcon(g, 24),
          h('span', { style: `color:${GEMS[g.family].color};width:150px` }, gemName(g.family, g.tier)),
          sel && free >= 0 ? btn('Socket', () => say(v.ops.socket(sel.id, free, gi)), 'tiny', !canSocket(sel, g)) : null,
          btn(`Upgrade (${fmt(gemUpgradeCost(g.tier))})`, () => say(v.ops.upgradeGem(gi)), 'tiny', g.tier >= 5 || c.stardust < gemUpgradeCost(g.tier)),
          btn(`Re-roll (${fmt(gemRerollCost(g.tier))})`, () => say(v.ops.rerollGem(gi)), 'tiny', c.stardust < gemRerollCost(g.tier)),
          btn(`Sell (+${fmt(gemSellValue(g.tier))})`, () => say(v.ops.sellGem(gi)), 'tiny'),
        ),
      );
    });
    if (c.gems.length === 0) gems.appendChild(h('div', { class: 'dim-text' }, 'No loose gems.'));
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, list, gems));
  }

  function shopTab(el: HTMLElement): void {
    const c = v.char;
    const buy = h('div', { class: 'col', style: 'gap:6px;width:440px' }, h('h3', null, `Buy · ✦ ${fmt(c.stardust)} Stardust`));
    for (const s of shopConsumables()) {
      buy.appendChild(h('div', { class: 'row' }, h('div', { style: 'width:150px' }, CONSUMABLES[s.id].name), h('div', { class: 'mono', style: 'width:60px' }, `✦${s.price}`), h('div', { class: 'small dim-text', style: 'width:60px' }, `have ${c.consumables[s.id] ?? 0}`), btn('Buy', () => say(v.ops.buyConsumable(s.id)), 'tiny', c.stardust < s.price)));
    }
    buy.appendChild(h('div', { class: 'row' }, gemIcon(v.shopGem, 22), h('div', { style: 'width:128px' }, gemName(v.shopGem.family, 1)), h('div', { class: 'mono', style: 'width:60px' }, `✦${shopGemPrice()}`), btn('Buy', () => say(v.ops.buyGem()), 'tiny', c.stardust < shopGemPrice())));
    if (v.shopPiece) {
      const p = v.shopPiece;
      const price = shopItemPrice(p);
      const b = h('div', { class: 'row' }, itemIcon(p, 32), h('div', { class: `r-${p.rarity}`, style: 'width:220px' }, p.name), h('div', { class: 'mono' }, `✦${price}`), btn('Buy', () => say(v.ops.buyPiece()), 'tiny', c.stardust < price));
      b.title = '';
      b.addEventListener('mouseenter', () => {
        const tt = itemTooltip(p, c);
        tt.style.left = '520px';
        tt.style.top = '120px';
        tt.setAttribute('data-tt', '1');
        root.appendChild(tt);
      });
      b.addEventListener('mouseleave', () => root.querySelectorAll('[data-tt]').forEach((x) => x.remove()));
      buy.appendChild(h('div', { class: 'small dim-text' }, 'Rotating piece (changes every rest):'));
      buy.appendChild(b);
    } else buy.appendChild(h('div', { class: 'small dim-text' }, 'The rotating piece is sold. Rest for a new one.'));
    const sell = h('div', { class: 'col', style: 'gap:3px;flex:1;max-height:520px;overflow:auto' }, h('h3', null, 'Sell from your bag'));
    for (const it of c.bag) sell.appendChild(h('div', { class: 'row' }, itemIcon(it, 24), h('div', { class: `r-${it.rarity}`, style: 'width:260px;font-size:13px' }, it.name), btn(`+${itemSellValue(it)}`, () => say(v.ops.sellItem(it.id)), 'tiny')));
    for (const [id, n] of Object.entries(c.consumables)) {
      if (!n) continue;
      const def = CONSUMABLES[id as ConsumableId];
      sell.appendChild(h('div', { class: 'row' }, h('div', { style: 'width:290px;font-size:13px' }, `${def.name} ×${n}`), btn(`+${Math.floor((def.price ?? 20) / 2)}`, () => say(v.ops.sellConsumable(id as ConsumableId)), 'tiny')));
    }
    if (c.bag.length === 0) sell.appendChild(h('div', { class: 'dim-text' }, 'Your bag is empty.'));
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, buy, sell));
  }

  function warpTab(el: HTMLElement): void {
    el.appendChild(h('div', { class: 'dim-text' }, 'Warp to any bonfire you have found in this playthrough.'));
    const list = h('div', { class: 'col', style: 'gap:6px;margin-top:8px' });
    for (const d of v.discovered) list.appendChild(btn(`${d.label}${d.used ? ' (embers)' : ' (fresh)'}${d.id === v.bonfireId ? ' — you are here' : ''}`, () => say(v.ops.warp(d.id)), '', d.id === v.bonfireId));
    el.appendChild(list);
  }

  function render(): void {
    clearEl(panel);
    root.querySelectorAll('[data-tt]').forEach((x) => x.remove());
    const tabs = h('div', { class: 'tabs' });
    const defs: { key: string; label: string; fn?: (el: HTMLElement) => void }[] = [
      { key: 'level', label: 'Level up', fn: levelTab },
      { key: 'gems', label: 'Gem bench', fn: gemsTab },
      { key: 'shop', label: 'Shop', fn: shopTab },
      { key: 'warp', label: 'Warp', fn: warpTab },
      ...(v.extraTabs ?? []).map((t) => ({ key: t.label, label: t.label, fn: (el: HTMLElement) => t.render(el, render) })),
    ];
    for (const d of defs) {
      const b = btn(d.label, () => {
        tab = d.key;
        render();
      });
      if (tab === d.key) b.classList.add('on');
      tabs.appendChild(b);
    }
    tabs.appendChild(btn('Inventory', () => v.openInventory()));
    tabs.appendChild(h('div', { class: 'grow' }));
    tabs.appendChild(btn('Leave', () => v.close(), 'primary'));
    panel.appendChild(h('div', { class: 'row' }, h('h2', { class: 'grow', style: 'margin:0' }, 'Bonfire'), h('div', { class: v.firstRest ? 'good' : 'dim-text' }, v.firstRest ? 'You rest. HP and Thermos restored.' : 'Embers: resting restores nothing here. Enemies have returned.')));
    panel.appendChild(tabs);
    const content = h('div', { style: 'flex:1;overflow:auto' });
    defs.find((d) => d.key === tab)?.fn?.(content);
    panel.appendChild(content);
    setTimeout(() => panel.querySelector<HTMLElement>('.tabs button')?.focus(), 0);
  }
  render();
  return root;
}
