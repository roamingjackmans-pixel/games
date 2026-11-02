// Inventory / character screen (GAME_DESIGN §16): stats, equipment, 60-slot bag, gems, consumables,
// compare tooltips, two-hand toggle, second weapon, quick-use selection. Mouse, keyboard and gamepad.
import { CONSUMABLES, CONSUMABLE_IDS } from '../../data/consumables';
import { CLASSES } from '../../data/classes';
import { BAG_SIZE, equip, unequip, type EquipSlot } from '../../game/items/inventory';
import { itemRequirements, meetsRequirements } from '../../game/items/bases';
import { levelCost } from '../../game/combat/formulas';
import type { Derived } from '../../game/player/derived';
import type { Character, ConsumableId, Item } from '../../game/types';
import { btn, clearEl, fmt, h, layer } from '../dom';
import { gemIcon, gemTooltip, itemIcon, itemTooltip } from '../tooltip';

export interface InventoryHost {
  char: Character;
  derived(): Derived;
  /** called after any change so the player entity refreshes its derived stats */
  changed(): void;
  /** co-op guests route these through the host (NETCODE §6); solo applies them directly */
  equip?(itemId: string, slot?: EquipSlot): void;
  unequip?(slot: EquipSlot): void;
  toggleTwoHand(): void;
  /** extra tabs (spell loadout) */
  extraTabs?: { label: string; render: (el: HTMLElement) => void }[];
  close(): void;
}

const EQUIP_SLOTS: { slot: EquipSlot; label: string }[] = [
  { slot: 'main', label: 'Weapon' },
  { slot: 'off', label: 'Off hand' },
  { slot: 'altMain', label: '2nd weapon' },
  { slot: 'head', label: 'Head' },
  { slot: 'body', label: 'Body' },
  { slot: 'legs', label: 'Legs' },
  { slot: 'ring1', label: 'Ring' },
  { slot: 'ring2', label: 'Ring' },
];

export function openInventory(host: InventoryHost): HTMLElement {
  const root = layer('dim');
  root.setAttribute('data-testid', 'inventory');
  let tab = 'items';
  let tip: HTMLElement | null = null;
  const showTip = (el: HTMLElement, node: HTMLElement): void => {
    tip?.remove();
    tip = node;
    const r = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const scale = rr.width / 1280;
    let x = (r.right - rr.left) / scale + 8;
    const y = Math.min(720 - 330, (r.top - rr.top) / scale);
    if (x > 1280 - 310) x = (r.left - rr.left) / scale - 310;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    root.appendChild(tip);
  };
  const hideTip = (): void => {
    tip?.remove();
    tip = null;
  };
  const doEquip = (id: string, slot?: EquipSlot): void => {
    if (host.equip) host.equip(id, slot);
    else equip(host.char, id, slot);
    host.changed();
    render();
  };
  const doUnequip = (slot: EquipSlot): void => {
    if (host.unequip) host.unequip(slot);
    else unequip(host.char, slot);
    host.changed();
    render();
  };
  const equippedFor = (item: Item): Item | null => {
    const e = host.char.equipment;
    if (item.slot === 'ring') return e.ring1;
    if (item.slot === 'main') return e.main;
    return e[item.slot as 'off' | 'head' | 'body' | 'legs'];
  };
  const body = h('div', { class: 'panel', style: 'width:1180px;height:660px;display:flex;flex-direction:column;gap:10px' });
  root.appendChild(body);

  function cell(item: Item | null, onClick: () => void, onAlt?: () => void, extra = ''): HTMLButtonElement {
    const b = h('button', { class: `cell ${extra}`, style: item ? `border-color:${rarityBorder(item.rarity)}` : '' }) as HTMLButtonElement;
    if (item) {
      b.appendChild(itemIcon(item, 40));
      const c = host.char;
      const meets = meetsRequirements(itemRequirements(item), c.stats, item.kind === 'weapon' ? c.twoHanded : false);
      if (!meets) b.appendChild(h('span', { class: 'warn' }, '!'));
      if (item.sockets.length) b.appendChild(h('span', { class: 'badge' }, '◆'.repeat(item.sockets.filter(Boolean).length) + '◇'.repeat(item.sockets.filter((g) => !g).length)));
      const tipFor = (): void => showTip(b, itemTooltip(item, host.char, equippedFor(item)));
      b.addEventListener('mouseenter', tipFor);
      b.addEventListener('focus', tipFor);
      b.addEventListener('mouseleave', hideTip);
      b.addEventListener('blur', hideTip);
    }
    b.addEventListener('click', onClick);
    if (onAlt)
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        onAlt();
      });
    return b;
  }

  function statsPanel(): HTMLElement {
    const c = host.char;
    const d = host.derived();
    const kv = (k: string, v: string | number, cls = ''): HTMLElement[] => [h('div', { class: 'k' }, k), h('div', { class: `mono ${cls}` }, String(v))];
    return h(
      'div',
      { class: 'col', style: 'width:300px' },
      h('h2', null, `${c.name}`),
      h('div', { class: 'dim-text' }, `${CLASSES[c.classId].name} · Level ${c.level}${c.cycle ? ` · Cycle ${c.cycle + 1}` : ''}`),
      h(
        'div',
        { class: 'kv' },
        ...kv('HP', `${d.maxHp}`),
        ...kv('Stamina', `${d.maxStam}`),
        ...kv('Bonk', `${d.stats.bonk}${c.twoHanded ? ` (×1.5 = ${Math.min(99, Math.floor(d.stats.bonk * 1.5))})` : ''}`),
        ...kv('Slicey', `${d.stats.slicey}`),
        ...kv('Brain', d.stats.brain),
        ...kv('Prayer', d.stats.prayer),
        ...kv('Weapon power', Math.round(d.weaponPower), d.weaponMeetsReq ? '' : 'bad'),
        ...kv('Attack speed', `×${d.attackSpeed.toFixed(2)}`),
        ...kv('Dodge recharge', `${d.dodgeRecharge.toFixed(1)} s`),
        ...kv('Defense (phys)', Math.round(d.defense.physical)),
        ...kv('Defense (elem)', `${Math.round(d.defense.fire)}/${Math.round(d.defense.frost)}/${Math.round(d.defense.lightning)}`),
        ...kv('Defense (holy/void)', `${Math.round(d.defense.holy)}/${Math.round(d.defense.void)}`),
        ...kv('Shards', fmt(c.shards)),
        ...kv('Next level', fmt(levelCost(c.level))),
        ...kv('Stardust', fmt(c.stardust)),
        ...kv('Tears of Undoing', c.tears),
        ...kv("Joe's Thermos", `${c.flaskCur}/${c.flaskMax}`),
      ),
      btn(c.twoHanded ? 'Two-handing (Shift) — click to one-hand' : 'One-handing (Shift) — click to two-hand', () => {
        host.toggleTwoHand();
        render();
      }),
    );
  }

  function itemsTab(el: HTMLElement): void {
    const c = host.char;
    const eq = h('div', { class: 'col', style: 'gap:6px' }, h('h3', null, 'Equipment'));
    const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(4,auto);gap:6px' });
    for (const s of EQUIP_SLOTS) {
      const item = s.slot === 'altMain' ? c.altMain : c.equipment[s.slot];
      const b = cell(item, () => item && doUnequip(s.slot), undefined, 'equip-slot');
      b.style.width = '56px';
      b.style.height = '56px';
      if (!item) b.appendChild(h('span', { class: 'small dim-text' }, s.label));
      grid.appendChild(b);
    }
    eq.appendChild(grid);
    eq.appendChild(h('div', { class: 'small dim-text', style: 'width:250px' }, 'Click a bag item to equip it. Right-click a weapon to make it your second weapon (swap with X); right-click a ring for the second ring slot. Click equipped gear to take it off.'));
    // consumables
    const cons = h('div', { class: 'col', style: 'gap:4px' }, h('h3', null, 'Quick-use (G)'));
    for (const id of CONSUMABLE_IDS) {
      const n = c.consumables[id] ?? 0;
      if (n <= 0) continue;
      const def = CONSUMABLES[id];
      cons.appendChild(
        btn(`${c.quickSlot === id ? '▶ ' : ''}${def.name} ×${n}`, () => {
          c.quickSlot = id as ConsumableId;
          render();
        }, 'tiny'),
      );
    }
    const left = h('div', { class: 'col', style: 'gap:12px' }, eq, cons);
    // bag
    const bag = h('div', { class: 'col', style: 'gap:6px' }, h('h3', null, `Bag ${c.bag.length}/${BAG_SIZE}`));
    const bagGrid = h('div', { class: 'grid-bag' });
    for (let i = 0; i < BAG_SIZE; i++) {
      const item = c.bag[i] ?? null;
      bagGrid.appendChild(
        cell(
          item,
          () => item && doEquip(item.id),
          () => {
            if (!item) return;
            if (item.slot === 'main') doEquip(item.id, 'altMain');
            else if (item.slot === 'ring') doEquip(item.id, 'ring2');
            else doEquip(item.id);
          },
        ),
      );
    }
    bag.appendChild(bagGrid);
    const gems = h('div', { class: 'row wrap', style: 'gap:4px;max-width:500px' });
    c.gems.forEach((g) => {
      const b = h('span', { tabindex: '0', style: 'display:inline-flex' }, gemIcon(g, 28));
      b.addEventListener('mouseenter', () => showTip(b, gemTooltip(g)));
      b.addEventListener('mouseleave', hideTip);
      gems.appendChild(b);
    });
    bag.appendChild(h('h3', null, `Loose gems (${c.gems.length}) — socket them at a bonfire`));
    bag.appendChild(gems);
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:24px' }, left, bag));
  }

  function render(): void {
    hideTip();
    clearEl(body);
    const tabs = h('div', { class: 'tabs' });
    const all = [{ label: 'Items', key: 'items' }, ...(host.extraTabs ?? []).map((t) => ({ label: t.label, key: t.label }))];
    for (const t of all) {
      const b = btn(t.label, () => {
        tab = t.key;
        render();
      });
      if (tab === t.key) b.classList.add('on');
      tabs.appendChild(b);
    }
    tabs.appendChild(h('div', { class: 'grow' }));
    tabs.appendChild(btn('Close (Tab)', () => host.close(), 'primary'));
    body.appendChild(tabs);
    const content = h('div', { class: 'row', style: 'align-items:flex-start;gap:24px;flex:1;overflow:auto' });
    content.appendChild(statsPanel());
    const right = h('div', { class: 'grow' });
    if (tab === 'items') itemsTab(right);
    else host.extraTabs?.find((t) => t.label === tab)?.render(right);
    content.appendChild(right);
    body.appendChild(content);
    setTimeout(() => body.querySelector<HTMLElement>('.grid-bag button, .tabs button')?.focus(), 0);
  }
  render();
  (root as HTMLElement & { rerender?: () => void }).rerender = render;
  return root;
}

function rarityBorder(r: string): string {
  return ({ common: '#6a6a6a', uncommon: '#58d66a', rare: '#4aa3ff', epic: '#b06bff', legendary: '#ff9b2e' } as Record<string, string>)[r] ?? '#3a3447';
}
