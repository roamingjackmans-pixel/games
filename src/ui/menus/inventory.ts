// Inventory / character screen (GAME_DESIGN §16): stats, a paper doll of the equipment, equip load, the
// 60-slot bag, gems, consumables, compare tooltips, two-hand toggle, second weapon, quick-use selection.
// Mouse, keyboard and gamepad (every slot is a focusable button; menuPad moves focus spatially).
import { glyphText, inputText, padStyle, tabHints } from '../glyphs';
import { PAD_ALT, PAD_ALT_EVENT, PAD_LOCK, PAD_LOCK_EVENT, TAB_EDGE_EVENT } from '../menuPad';
import { lockButton } from '../itemLock';
import { PROF_CLASSES, PROF_MAX_LEVEL, perkPoints, profLevel } from '../../data/proficiency';
import { activeClasses, profXp } from '../../game/items/proficiency';
import { CONSUMABLES, CONSUMABLE_IDS } from '../../data/consumables';
import { CLASSES } from '../../data/classes';
import { ELEMENTS } from '../../game/elements';
import { BAG_SIZE, allItems, equip, isToolItem, placeLabel, toggleItemLock, unequip, unsocketGem, type EquipSlot, slotItem } from '../../game/items/inventory';
import { levelCost } from '../../game/combat/formulas';
import { LIGHT_LOAD_MAX, LOAD_TIERS, LOAD_TIERS_ORDER, fmtLoad, type EquipLoadInfo } from '../../game/player/equipLoad';
import { toolForSchool, type Derived } from '../../game/player/derived';
import { spellSkill } from '../../game/skills/use';
import { DAMAGE_TYPES, type Character, type ConsumableId, type Gem, type Item, type StatId } from '../../game/types';
import { btn, chosenFocus, clearEl, fmt, focusContentStart, h, layer, markFocus, restoreFocus } from '../dom';
import { DOLL_SLOTS, paperDoll } from '../paperdoll';
import { RARITY_BORDER, gemIcon, gemTooltip, glowenEl, itemIcon, itemMeetsReqs, itemTooltip, setPerkSection } from '../tooltip';
import { SET_PERKS, SET_STEPS, setEffectText, setStep } from '../../data/setPerks';

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
  /** LB / RB past the first (-1) or last (1) tab: opened from a bonfire, the bonfire's tabs carry on there (D169) */
  tabEdge?(step: number): void;
}

/** Equip load bar scale: 0 to 125% so the 100% mark (Encumbered beyond it) is visible. */
const LOAD_BAR_MAX = 1.25;
const LOAD_MARKS = [LIGHT_LOAD_MAX, 0.7, 1];

export function openInventory(host: InventoryHost): HTMLElement {
  const root = layer('dim');
  root.setAttribute('data-testid', 'inventory');
  if (host.tabEdge)
    root.addEventListener(TAB_EDGE_EVENT, (ev) => {
      ev.preventDefault();
      host.tabEdge!((ev as CustomEvent<number>).detail);
    });
  let tab = 'items';
  let tip: HTMLElement | null = null;
  const showTip = (el: HTMLElement, node: HTMLElement): void => {
    tip?.remove();
    tip = node;
    const r = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const scale = rr.width / 1280 || 1;
    tip.style.visibility = 'hidden';
    root.appendChild(tip);
    const tw = tip.offsetWidth || 320;
    const th = tip.offsetHeight || 300;
    let x = (r.right - rr.left) / scale + 8;
    if (x > 1280 - tw - 6) x = (r.left - rr.left) / scale - tw - 8;
    const y = Math.max(6, Math.min(720 - th - 6, (r.top - rr.top) / scale));
    tip.style.left = `${Math.max(6, x)}px`;
    tip.style.top = `${y}px`;
    tip.style.visibility = '';
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
  /**
   * A staff or talisman goes in either hand (D228): its click asks which, then fills that hand's first slot (the
   * weapon or the off hand); its alternate click asks the same and fills the hand's second slot (the 2nd weapon or the
   * 2nd off hand). `focus` is the bag slot to come back to.
   */
  let handAsk: { itemId: string; second: boolean; focus: string } | null = null;
  const closeHandAsk = (then?: () => void): void => {
    const back = handAsk?.focus;
    handAsk = null;
    if (then) then();
    else render();
    setTimeout(() => root.querySelector<HTMLElement>(`[data-focus="${back}"]`)?.focus(), 0);
  };
  const onHandKey = (e: KeyboardEvent): void => {
    if (!root.isConnected) {
      window.removeEventListener('keydown', onHandKey, true);
      return;
    }
    if (e.code !== 'Escape' || !handAsk) return;
    // Escape or the pad's back button closes the question, not the inventory
    e.stopImmediatePropagation();
    e.preventDefault();
    closeHandAsk();
  };
  window.addEventListener('keydown', onHandKey, true);
  function handDialog(): HTMLElement | null {
    if (!handAsk) return null;
    const ask = handAsk;
    const item = host.char.bag.find((i) => i.id === ask.itemId);
    if (!item) return null;
    const pick = (slot: EquipSlot): void => closeHandAsk(() => doEquip(ask.itemId, slot));
    const main = btn(ask.second ? '2nd weapon (weapon hand)' : 'Weapon hand', () => pick(ask.second ? 'altMain' : 'main'), 'primary');
    main.setAttribute('data-testid', 'hand-main');
    const off = btn(ask.second ? '2nd off hand' : 'Off hand', () => pick(ask.second ? 'altOff' : 'off'));
    off.setAttribute('data-testid', 'hand-off');
    const back = btn('Back', () => closeHandAsk());
    back.setAttribute('data-testid', 'hand-back');
    return h(
      'div',
      { class: 'layer dim', style: 'z-index:40' },
      h('div', { class: 'panel col', style: 'width:420px;gap:10px', 'data-testid': 'hand-dialog' }, h('h2', null, 'Which hand?'), h('div', { class: `r-${item.rarity}` }, item.name), h('div', { class: 'small dim-text' }, ask.second ? 'Into the hand’s second slot, ready to swap in.' : 'Into the hand’s first slot.'), h('div', { class: 'row', style: 'gap:8px' }, main, off, back)),
    );
  }
  const doUnequip = (slot: EquipSlot): void => {
    if (host.unequip) host.unequip(slot);
    else unequip(host.char, slot);
    host.changed();
    render();
  };
  const body = h('div', { class: 'panel', style: 'width:1180px;height:660px;display:flex;flex-direction:column;gap:10px' });
  root.appendChild(body);

  function cell(item: Item | null, onClick: () => void, onAlt?: (ev: MouseEvent) => void, extra = '', onPadAlt?: () => void): HTMLButtonElement {
    const b = h('button', { class: `cell ${extra}`, style: item ? `border-color:${RARITY_BORDER[item.rarity] ?? '#3a3447'}` : '' }) as HTMLButtonElement;
    if (item) {
      b.appendChild(itemIcon(item, 40));
      const c = host.char;
      // the same check as the tooltip and the damage: stats with gear bonuses (D210; it used the base stats)
      const meets = itemMeetsReqs(item, c);
      if (!meets) b.appendChild(h('span', { class: 'warn' }, '!'));
      if (item.sockets.length) b.appendChild(h('span', { class: 'badge' }, '◆'.repeat(item.sockets.filter(Boolean).length) + '◇'.repeat(item.sockets.filter((g) => !g).length)));
      // the lock (D265): its corner button, Y / △ on a pad, L on the keyboard
      const lock = (): void => {
        toggleItemLock(host.char, item.id);
        host.changed();
        render();
      };
      b.appendChild(lockButton(item, lock, true));
      b.addEventListener(PAD_LOCK_EVENT, lock);
      b.addEventListener('keydown', (e) => {
        if (e.code !== 'KeyL' || e.repeat) return;
        e.preventDefault();
        lock();
      });
      const tipFor = (): void => showTip(b, itemTooltip(item, host.char, 'auto'));
      b.addEventListener('mouseenter', tipFor);
      b.addEventListener('focus', tipFor);
      b.addEventListener('mouseleave', hideTip);
      b.addEventListener('blur', hideTip);
    }
    b.addEventListener('click', onClick);
    if (onAlt)
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        onAlt(e);
      });
    if (onPadAlt) b.addEventListener(PAD_ALT_EVENT, onPadAlt);
    return b;
  }

  function statsPanel(): HTMLElement {
    const c = host.char;
    const d = host.derived();
    const kv = (k: string, v: string | number | Node, cls = ''): HTMLElement[] => [h('div', { class: 'k' }, k), h('div', { class: `mono ${cls}` }, v instanceof Node ? v : String(v))];
    const head = (t: string): HTMLElement => h('div', { class: 'kv-head' }, t);
    const pTag = (k: StatId): string => (CLASSES[c.classId]?.primary === k ? ' (P)' : CLASSES[c.classId]?.secondary === k ? ' (S)' : '');
    return h(
      'div',
      { class: 'col', style: 'width:250px;gap:6px' },
      h('h2', { style: 'margin:0' }, `${c.name}`),
      h('div', { class: 'dim-text small' }, `${CLASSES[c.classId].name} · Level ${c.level}${c.cycle ? ` · Cycle ${c.cycle + 1}` : ''}`),
      h(
        'div',
        { class: 'kv stats-kv' },
        head('Stats'),
        // the class's primary (+25%) and secondary (+15%) stats are marked (D184)
        ...kv('HP' + pTag('hp'), d.stats.hp),
        ...kv('Endurance' + pTag('endurance'), d.stats.endurance),
        ...kv('Bonk' + pTag('bonk'), `${d.stats.bonk}${c.twoHanded ? ` (2H ${Math.min(99, Math.floor(d.stats.bonk * 1.5))})` : ''}`),
        ...kv('Slicey' + pTag('slicey'), d.stats.slicey),
        ...kv('Brain' + pTag('brain'), d.stats.brain),
        ...kv('Prayer' + pTag('prayer'), d.stats.prayer),
        head('Combat'),
        ...kv('Max HP', d.maxHp),
        ...kv('Max stamina', d.maxStam),
        ...kv('Weapon power', Math.round(d.weaponPower), d.weaponMeetsReq ? '' : 'bad'),
        // Spell Skill per school you can cast (D182)
        ...(['brain', 'prayer'] as const).filter((sc) => toolForSchool(d, sc)).flatMap((sc) => kv(`${sc === 'brain' ? 'Brain' : 'Prayer'} Spell Skill`, spellSkill(d, sc), toolForSchool(d, sc)?.meetsReq ? '' : 'bad')),
        ...kv('Attack speed', `×${d.attackSpeed.toFixed(2)}`),
        ...kv('Dodge recharge', `${d.dodgeRecharge.toFixed(1)} s`),
        head('Defense'),
        ...DAMAGE_TYPES.flatMap((k) => kv(ELEMENTS[k].short, Math.round(d.defense[k]))),
        head('Carried'),
        ...kv('Shards', fmt(c.shards)),
        ...kv('Next level', fmt(levelCost(c.level))),
        ...kv('Glowen', glowenEl(c.glowen)),
        ...kv('Tears of Undoing', c.tears),
        ...kv("Joe's Thermos", `${c.flaskCur}/${c.flaskMax}`),
      ),
      btn(c.twoHanded ? `Two-handing (${glyphText('twoHand')}) — click to one-hand` : `One-handing (${glyphText('twoHand')}) — click to two-hand`, () => {
        host.toggleTwoHand();
        render();
      }, 'tiny'),
    );
  }

  /** "Equip load 24.3 / 37.0 (66%)", a bar marked at 25 / 70 / 100%, the tier and what it does to you. */
  function loadPanel(L: EquipLoadInfo): HTMLElement {
    const bar = h('div', { class: 'load-bar' });
    let from = 0;
    for (const tier of LOAD_TIERS_ORDER) {
      const to = tier === 'light' ? LIGHT_LOAD_MAX : tier === 'medium' ? 0.7 : tier === 'heavy' ? 1 : LOAD_BAR_MAX;
      bar.appendChild(h('div', { class: 'load-zone', style: `left:${(from / LOAD_BAR_MAX) * 100}%;width:${((to - from) / LOAD_BAR_MAX) * 100}%;background:${LOAD_TIERS[tier].color}` }));
      from = to;
    }
    bar.appendChild(h('div', { class: 'load-fill', style: `width:${Math.min(1, L.frac / LOAD_BAR_MAX) * 100}%;background:${L.effects.color}` }));
    for (const m of LOAD_MARKS) bar.appendChild(h('div', { class: 'load-mark', style: `left:${(m / LOAD_BAR_MAX) * 100}%` }, h('span', null, `${Math.round(m * 100)}%`)));
    return h(
      'div',
      { class: 'load-panel', 'data-testid': 'equip-load' },
      h('div', { class: 'row', style: 'justify-content:space-between;gap:6px' }, h('span', null, 'Equip load'), h('span', { class: 'mono' }, `${fmtLoad(L)} (${Math.round(L.frac * 100)}%)`)),
      bar,
      h('div', { class: 'load-tier' }, h('b', { style: `color:${L.effects.color}` }, L.effects.label), h('span', { class: 'small' }, ` — ${L.effects.text}`)),
      h('div', { class: 'small dim-text' }, 'Your 2nd weapon and 2nd off hand are not counted until swapped in.'),
    );
  }

  /**
   * The alternate select (right-click, X / □): a weapon becomes the 2nd weapon, a shield the 2nd off hand, a staff or
   * talisman asks which hand's second slot, a ring goes in the next free ring slot after the first (D228).
   */
  function second(item: Item | null, i: number): void {
    if (!item) return;
    const c = host.char;
    if (isToolItem(item)) {
      handAsk = { itemId: item.id, second: true, focus: `bag-${i}` };
      render();
    } else if (item.slot === 'main') doEquip(item.id, 'altMain');
    else if (item.slot === 'off') doEquip(item.id, 'altOff');
    else if (item.slot === 'ring') doEquip(item.id, (['ring2', 'ring3', 'ring4'] as const).find((r) => !c.equipment[r]) ?? 'ring2');
    else doEquip(item.id);
  }

  function itemsTab(el: HTMLElement): void {
    const c = host.char;
    // ---- paper doll
    const cells: Partial<Record<EquipSlot, HTMLElement>> = {};
    const empty: Partial<Record<EquipSlot, boolean>> = {};
    for (const s of DOLL_SLOTS) {
      const item = slotItem(c, s.slot);
      const b = cell(item, () => item && doUnequip(s.slot), undefined, 'equip-slot');
      b.setAttribute('data-testid', `equip-${s.slot}`);
      b.setAttribute('data-focus', `equip-${s.slot}`);
      b.setAttribute('aria-label', item ? `${s.label}: ${item.name}` : `${s.label} (empty)`);
      if (s.slot === 'main' && item && c.twoHanded) b.appendChild(h('span', { class: 'tag2h' }, '2H'));
      cells[s.slot] = b;
      empty[s.slot] = !item;
    }
    const doll = paperDoll(cells, { empty, dimmed: c.twoHanded ? ['off'] : [] });
    const dollCol = h('div', { class: 'col', style: 'gap:6px;width:300px' }, h('h3', { style: 'margin:0' }, 'Equipment'), doll, loadPanel(host.derived().load));

    // ---- bag
    // scrolls when a long gem list (D168) would run past the panel
    const bag = h('div', { class: 'col', style: 'gap:6px;max-height:566px;overflow-y:auto;padding-right:6px' }, h('h3', { style: 'margin:0' }, `Bag ${c.bag.length}/${BAG_SIZE}`));
    const bagGrid = h('div', { class: 'grid-bag' });
    for (let i = 0; i < BAG_SIZE; i++) {
      const item = c.bag[i] ?? null;
      const bagCell = bagGrid.appendChild(
        cell(
          item,
          () => {
            if (!item) return;
            // a staff or talisman asks which hand (D228)
            if (isToolItem(item)) {
              handAsk = { itemId: item.id, second: false, focus: `bag-${i}` };
              render();
            } else doEquip(item.id);
          },
          () => second(item, i),
          '',
          // X / □ (D166): the same as a right-click
          () => second(item, i),
        ),
      );
      // the same bag slot keeps the focus after equipping from it (D144)
      bagCell.setAttribute('data-focus', `bag-${i}`);
      // the inventory opens on the first bag slot, top left of the backpack (D148)
      if (i === 0) bagCell.setAttribute('data-autofocus', '');
    }
    bag.appendChild(bagGrid);
    bag.appendChild(h('div', { class: 'small dim-text', style: 'width:476px' }, `Click a bag item to equip it; right-click (${inputText(PAD_ALT, padStyle())} on a controller) puts it in the second slot: a weapon becomes your 2nd weapon (swap with ${glyphText('swapWeapon')}), a shield your 2nd off hand (hold ${glyphText('interact')} and press ${glyphText('swapWeapon')}), a ring the next ring slot. A staff or talisman asks which hand. Click worn gear to take it off. The padlock in a corner (or ${inputText(PAD_LOCK, padStyle())} / L) locks an item so Sell all keeps it.`));
    const gems = h('div', { class: 'row wrap', style: 'gap:4px;max-width:476px' });
    c.gems.forEach((g) => {
      const b = h('span', { tabindex: '0', style: 'display:inline-flex' }, gemIcon(g, 28));
      b.addEventListener('mouseenter', () => showTip(b, gemTooltip(g)));
      b.addEventListener('focus', () => showTip(b, gemTooltip(g)));
      b.addEventListener('mouseleave', hideTip);
      b.addEventListener('blur', hideTip);
      gems.appendChild(b);
    });
    bag.appendChild(h('h3', { style: 'margin:4px 0 0' }, `Loose gems (${c.gems.length}) — socket them at a bonfire`));
    bag.appendChild(gems);
    // ---- consumables
    const cons = h('div', { class: 'row wrap', style: 'gap:4px;max-width:476px' });
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
    if (!cons.childElementCount) cons.appendChild(h('div', { class: 'small dim-text' }, 'Nothing to quick-use.'));
    bag.appendChild(h('h3', { style: 'margin:4px 0 0' }, `Quick-use (${glyphText('quick')})`));
    bag.appendChild(cons);
    // ---- set perks worn (D243): each set, the pieces, and the step reached (3 / 5 / 7)
    const counts = host.derived().setCounts;
    const sets = Object.entries(counts).filter(([id]) => SET_PERKS[id]).sort((a, b) => b[1] - a[1]);
    if (sets.length) {
      const list = h('div', { class: 'col', style: 'gap:2px;max-width:476px', 'data-testid': 'inv-sets' });
      for (const [id, n] of sets) {
        const sp = SET_PERKS[id]!;
        const step = setStep(n);
        const row = h('div', { class: 'small', style: step ? `color:${sp.color}` : '' }, h('b', null, `${sp.name} ${n} / 7`), h('span', { class: step ? '' : 'dim-text' }, ` · ${step ? setEffectText(sp.steps[step - 1]!) : `${SET_STEPS[0] - n} more for its first bonus`}`));
        row.addEventListener('mouseenter', () => showTip(row, h('div', { class: 'tooltip' }, setPerkSection(sp, n))));
        row.addEventListener('mouseleave', hideTip);
        list.appendChild(row);
      }
      bag.appendChild(h('h3', { style: 'margin:4px 0 0' }, 'Set perks worn'));
      bag.appendChild(list);
    }
    // ---- gems in gear: take any of them out here, worn or in the bag, any time (D168)
    const socketed: { it: Item; g: Gem; si: number }[] = [];
    for (const it of allItems(c)) it.sockets.forEach((g, si) => g && socketed.push({ it, g, si }));
    if (socketed.length) {
      const row = h('div', { class: 'row wrap', style: 'gap:4px;max-width:476px' });
      for (const { it, g, si } of socketed) {
        const b = btn('', () => {
          unsocketGem(c, it.id, si);
          host.changed();
          render();
        }, 'tiny');
        b.append('✕ ', h('span', { style: 'display:inline-flex;vertical-align:middle;margin-right:4px' }, gemIcon(g, 16)), `${it.name} · ${placeLabel(c, it.id)}`);
        b.setAttribute('aria-label', `Remove the gem from ${it.name} (${placeLabel(c, it.id)})`);
        b.setAttribute('data-focus', `unsocket-${it.id}-${si}`);
        b.setAttribute('data-testid', `inv-unsocket-${it.id}-${si}`);
        b.addEventListener('mouseenter', () => showTip(b, gemTooltip(g)));
        b.addEventListener('focus', () => showTip(b, gemTooltip(g)));
        b.addEventListener('mouseleave', hideTip);
        b.addEventListener('blur', hideTip);
        row.appendChild(b);
      }
      bag.appendChild(h('h3', { style: 'margin:4px 0 0' }, `Gems in your gear (${socketed.length}) — ✕ takes one out`));
      bag.appendChild(row);
    }
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:22px' }, dollCol, bag));
  }

  /** Proficiency (D178): every weapon class's level, experience and two perks; the help pops out only when asked. */
  let profHelp = false;
  function profTab(el: HTMLElement): void {
    const c = host.char;
    const out = new Set(activeClasses(c));
    const pct = (x: number, stat: string): string =>
      stat === 'dodge'
        ? `−${x.toFixed(2)} s`
        : stat === 'parryWindow'
          ? `+${Math.round(x * 1000)} ms`
          : `${stat === 'stamina' || stat === 'blockStamina' || stat.endsWith('Cooldown') ? '−' : '+'}${(x * 100).toFixed(x * 100 < 1 ? 2 : 1).replace(/\.0+$/, '')}%`;
    const head = h('div', { class: 'row', style: 'gap:8px;align-items:center' }, h('h3', { style: 'margin:0' }, 'Weapon proficiency'));
    const q = btn(profHelp ? '✕' : '?', () => {
      profHelp = !profHelp;
      render();
    }, 'tiny');
    q.setAttribute('aria-label', profHelp ? 'Hide how proficiency works' : 'How proficiency works');
    q.setAttribute('data-focus', 'prof-help');
    q.setAttribute('data-testid', 'prof-help');
    head.appendChild(q);
    el.appendChild(head);
    if (profHelp)
      el.appendChild(
        h('div', { class: 'card', 'data-testid': 'prof-help-text', style: 'padding:8px 10px;margin:6px 0;max-width:640px;border-left:3px solid #9ad0ff' },
          h('div', { class: 'small' }, 'Every enemy that falls while you stand gives experience to what you have out (the weapon in your hand, and a staff, talisman or shield in your other hand), whoever made the kill. It fills that item’s own bar (raise it a rarity at a bonfire) and trains its class here. Shields train by size: small, medium or great.'),
          h('div', { class: 'small', style: 'margin-top:4px' }, `Each class levels up to ${PROF_MAX_LEVEL}. Odd levels add to its first perk, even levels to its second. Perks only work while an item of that class is out: switch weapons and the other class’s perks take over. Level 50 with one class takes about three playthroughs; ${PROF_MAX_LEVEL} is for the long haul.`),
        ),
      );
    const ids = Object.keys(PROF_CLASSES).sort((a, b) => Number(out.has(b)) - Number(out.has(a)) || profXp(c, b) - profXp(c, a) || PROF_CLASSES[a]!.name.localeCompare(PROF_CLASSES[b]!.name));
    const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px;max-width:760px;margin-top:6px' });
    for (const id of ids) {
      const def = PROF_CLASSES[id]!;
      const lv = profLevel(profXp(c, id));
      const pts = perkPoints(lv.level);
      const nextIdx = lv.level % 2 === 0 ? 0 : 1;
      const card = h('div', { class: 'card', tabindex: '0', 'data-focus': `prof-${id}`, 'data-testid': `prof-${id}`, style: `padding:6px 8px${out.has(id) ? ';border-left:3px solid #e8c25a' : ''}${lv.level === 0 && !out.has(id) ? ';opacity:0.6' : ''}` });
      card.appendChild(h('div', { class: 'row', style: 'justify-content:space-between;align-items:baseline' }, h('b', null, def.name, out.has(id) ? h('span', { style: 'margin-left:6px;padding:0 5px;border-radius:4px;background:#e8c25a;color:#1a1408;font-size:10px' }, 'OUT') : null), h('span', { class: 'small' }, `Lv ${lv.level} / ${PROF_MAX_LEVEL}`)));
      const fill = lv.next > 0 ? lv.into / lv.next : 1;
      card.appendChild(h('div', { style: 'height:5px;border-radius:3px;background:#2a2533;overflow:hidden;margin:3px 0' }, h('div', { style: `height:100%;width:${Math.round(fill * 100)}%;background:${lv.next > 0 ? '#9ad0ff' : '#ffd27a'}` })));
      def.perks.forEach((pk, i) => {
        const now = pk.per * pts[i]!;
        const more = lv.level < PROF_MAX_LEVEL && i === nextIdx ? ` (next level ${pct(pk.per, pk.stat)})` : '';
        card.appendChild(h('div', { class: `small ${now > 0 ? 'good' : 'dim-text'}` }, `${pk.label} ${pct(now, pk.stat)}${more}`));
      });
      card.appendChild(h('div', { class: 'small dim-text', style: 'font-style:italic' }, def.blurb));
      grid.appendChild(card);
    }
    el.appendChild(grid);
  }

  function render(): void {
    hideTip();
    // where the focus was, to put it back after the redraw (D144)
    const mark = markFocus(body);
    clearEl(body);
    const tabs = h('div', { class: 'tabs', 'data-focus-group': 'tabs' });
    const all = [{ label: 'Items', key: 'items' }, ...(host.extraTabs ?? []).map((t) => ({ label: t.label, key: t.label })), { label: 'Proficiency', key: 'proficiency' }];
    for (const t of all) {
      const b = btn(t.label, () => {
        tab = t.key;
        render();
      });
      if (tab === t.key) b.classList.add('on');
      b.setAttribute('data-tab', t.key);
      tabs.appendChild(b);
    }
    tabHints(tabs);
    tabs.appendChild(h('div', { class: 'grow' }));
    tabs.appendChild(btn(`Close (${glyphText('inventory')})`, () => host.close(), 'primary'));
    body.appendChild(tabs);
    const content = h('div', { class: 'row', style: 'align-items:flex-start;gap:22px;flex:1;overflow:auto' });
    content.appendChild(statsPanel());
    const right = h('div', { class: 'grow', 'data-focus-group': `tab-${tab}` });
    if (tab === 'items') itemsTab(right);
    else if (tab === 'proficiency') profTab(right);
    else host.extraTabs?.find((t) => t.label === tab)?.render(right);
    content.appendChild(right);
    body.appendChild(content);
    // the which-hand question (D228) sits over everything, the focus inside it
    root.querySelectorAll('[data-hand-modal]').forEach((x) => x.remove());
    const ask = handDialog();
    if (ask) {
      ask.setAttribute('data-hand-modal', '1');
      root.appendChild(ask);
      setTimeout(() => ask.querySelector<HTMLElement>('button')?.focus(), 0);
      return;
    }
    setTimeout(() => {
      // something chosen since the redraw keeps the focus (D169)
      if (chosenFocus(body)) return;
      if (!restoreFocus(body, mark)) focusContentStart(body, right);
    }, 0);
  }
  render();
  (root as HTMLElement & { rerender?: () => void }).rerender = render;
  return root;
}
