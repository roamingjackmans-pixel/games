// Bonfire menu (GAME_DESIGN §9.1): Level up · Gem bench · Shop · Warp (+ Spell loadout from M6).
import { CONSUMABLES } from '../../data/consumables';
import { renderBestiary } from '../bestiary';
import { CASTING_TOOLS } from '../../data/castingTools';
import { statBoosts } from '../../data/classes';
import { ESSENCES, MAX_REINFORCE, canPayEssence, essenceCounts, essenceDef, plusName, reinforceDmgMult, reinforceMult } from '../../data/essence';
import { SHIELDS, shieldStability, shieldValues } from '../../data/shields';
import { armorPieceDefense } from '../../data/armor';
import { canReinforce, reinforceInfo } from '../../game/items/reinforce';
import { isPrimaryStat, isSecondaryStat } from '../../data/classes';
import { GEMS, gemColor, gemKind, gemKindLabel, gemOrigin, gemTitle, perkName } from '../../data/gems';
import { flaskHeal, levelCost, gemSellTotal } from '../../game/combat/formulas';
import { computeDerived } from '../../game/player/derived';
import { spellSkill, toolSpellSkill } from '../../game/skills/use';
import { ELEMENTS } from '../../game/elements';
import { canSocket, socketKind, fusePreview, gemAt, itemPlace, placeLabel, itemSellValue, lockedSkipped, planLevelUps, sellAllGemsPreview, sellAllPreview, toggleItemLock, type FusePick, type GemLoc, type PendingPoints, type SellAllFilter } from '../../game/items/inventory';
import { shopConsumables, shopGemPrice, shopItemPrice } from '../../game/bonfire/shop';
import { DAMAGE_TYPES, type Character, type ConsumableId, type Gem, type Item, type StatId } from '../../game/types';
import { hasRarityBar, upgradeInfo } from '../../game/items/proficiency';
import { btn, chosenFocus, clearEl, fmt, focusContentStart, h, layer, markFocus, restoreFocus, toast, type FocusMark } from '../dom';
import { tabHints } from '../glyphs';
import { gemLockButton, lockButton } from '../itemLock';
import { PAD_LOCK_EVENT } from '../menuPad';
import { gemIcon, gemKindChip, gemPerkLines, gemTooltip, perkEffectEl, perkEffectsEl, glowenEl, itemIcon, itemScore, itemSummary, itemTooltip, staticTip } from '../tooltip';

export interface BonfireOps {
  levelUp(stat: StatId): string;
  socket(itemId: string, socketIdx: number, gemIdx: number): string;
  unsocket(itemId: string, socketIdx: number): string;
  /** lock or unlock a loose or socketed gem: Sell all gems keeps a locked one (D282) */
  toggleGemLock(loc: GemLoc): string;
  /** sell every loose gem that is not locked (D282) */
  sellAllGems(): string;
  /** break Soul Essence of `tier` into three of the tier below: one, or all of them (D285) */
  breakEssence(tier: number, all: boolean): string;
  /** fuse a loose donor gem into the original (loose or socketed), keeping the picked perks */
  fuseGem(orig: GemLoc, donorIdx: number, picks: FusePick[]): string;
  sellItem(itemId: string): string;
  sellAll(filter: SellAllFilter): string;
  sellGem(gemIdx: number): string;
  sellConsumable(id: ConsumableId): string;
  buyConsumable(id: ConsumableId): string;
  buyGem(): string;
  buyPiece(): string;
  warp(bonfireId: string): string;
  /** pay Glowen to raise a weapon or casting tool with a full bar to the next rarity (D178) */
  raiseRarity(itemId: string): string;
  /** spend Soul Essence and Glowen to reinforce a weapon, shield or armour piece +1 (D198) */
  reinforce(itemId: string): string;
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
  /** open on this tab (its key), or the first / last tab before Inventory (LB / RB coming back from the inventory, D169) */
  startTab?: string | undefined;
}

const STATS: { id: StatId; label: string; what: string }[] = [
  { id: 'hp', label: 'HP', what: 'max health' },
  { id: 'endurance', label: 'Endurance', what: 'max stamina, regen and equip load' },
  { id: 'bonk', label: 'Bonk', what: 'heavy weapons, crossbows' },
  { id: 'slicey', label: 'Slicey', what: 'fast weapons, bows' },
  { id: 'brain', label: 'Brain', what: 'staff spells' },
  { id: 'prayer', label: 'Prayer', what: 'talisman spells, flask' },
];

const SELL_ALL: { filter: SellAllFilter; label: string; what: string }[] = [
  { filter: 'common', label: 'Sell all Commons', what: 'every Common item in your bag' },
  { filter: 'belowRare', label: 'Sell all below Rare', what: 'every Common and Uncommon item in your bag' },
  { filter: 'all', label: 'Sell all', what: 'everything in your bag' },
];

const locKey = (loc: GemLoc): string => ('gemIdx' in loc ? `l${loc.gemIdx}` : `s:${loc.itemId}:${loc.socketIdx}`);

export function openBonfire(v: BonfireView): HTMLElement {
  const root = layer('dim');
  root.setAttribute('data-testid', 'bonfire-menu');
  const panel = h('div', { class: 'panel', style: 'width:1200px;height:660px;display:flex;flex-direction:column;gap:10px' });
  root.appendChild(panel);
  const tabKeys = ['level', 'gems', 'weapons', 'reinforce', 'shop', 'warp', 'bestiary', ...(v.extraTabs ?? []).map((t) => t.label)];
  let tab = v.startTab === 'last' ? tabKeys[tabKeys.length - 1]! : v.startTab && v.startTab !== 'first' && tabKeys.includes(v.startTab) ? v.startTab : 'level';
  let selItem: string | null = null;
  /** the empty socket picked on the selected item (D227): a gem goes there, not just into the first free one */
  let selSocket = -1;
  /** the Sell all gems confirmation (D282) */
  let confirmGemSell = false;
  /** the fuse dialog's state */
  let fuse: { orig: GemLoc; donor: number | null; picks: FusePick[] } | null = null;
  /** the Sell all confirmation */
  let confirmSell: SellAllFilter | null = null;
  let modal: HTMLElement | null = null;
  /** the item whose next reinforcement is being looked at (D216 / D220): its before → after and the cost, to confirm or back out of */
  let reinforceAsk: { itemId: string } | null = null;
  /** selling a bag item with gems in it asks first (D240) */
  let sellAsk: string | null = null;
  /** level-up points planned but not yet spent (D142) */
  let pending: PendingPoints = {};
  /** what to do after the Lock in / Discard question, while it is open */
  let confirmLeave: (() => void) | null = null;
  /** where the focus last was in the panel (outside any dialog), for the redraw to put it back (D144) */
  let panelMark: FocusMark | null = null;
  const say = (msg: string): void => {
    if (msg) toast(msg);
    render();
  };
  // Escape (or the pad's back button) closes a dialog before it closes the bonfire
  const onKey = (e: KeyboardEvent): void => {
    if (!root.isConnected) {
      window.removeEventListener('keydown', onKey, true);
      return;
    }
    if (e.code !== 'Escape') return;
    // leaving with planned level-up points asks first (D142); Escape on that question means keep editing
    const askLeave = !fuse && !confirmSell && !confirmGemSell && !confirmLeave && !reinforceAsk && !sellAsk && pendingCount() > 0;
    if (!fuse && !confirmSell && !confirmGemSell && !confirmLeave && !reinforceAsk && !sellAsk && !askLeave) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (askLeave) confirmLeave = () => v.close();
    else if (confirmLeave) confirmLeave = null;
    fuse = null;
    confirmSell = null;
    confirmGemSell = false;
    reinforceAsk = null;
    sellAsk = null;
    render();
  };
  window.addEventListener('keydown', onKey, true);
  /** An item tooltip beside `el` while hovered (kept on screen). */
  const hoverTip = (el: HTMLElement, make: () => HTMLElement): void => {
    el.addEventListener('mouseenter', () => {
      root.querySelectorAll('[data-tt]').forEach((x) => x.remove());
      const tt = make();
      tt.setAttribute('data-tt', '1');
      tt.style.visibility = 'hidden';
      root.appendChild(tt);
      const r = el.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      const scale = rr.width / 1280 || 1;
      const tw = tt.offsetWidth || 320;
      const th = tt.offsetHeight || 300;
      let x = (r.right - rr.left) / scale + 8;
      if (x > 1280 - tw - 6) x = (r.left - rr.left) / scale - tw - 8;
      tt.style.left = `${Math.max(6, x)}px`;
      tt.style.top = `${Math.max(6, Math.min(720 - th - 6, (r.top - rr.top) / scale))}px`;
      tt.style.visibility = '';
    });
    el.addEventListener('mouseleave', () => root.querySelectorAll('[data-tt]').forEach((x) => x.remove()));
  };

  // ---- level up (D142): points are only planned until Confirm; the right side shows what they change

  const pendingCount = (): number => STATS.reduce((n, s) => n + (pending[s.id] ?? 0), 0);

  /** Spend the planned points for real, one at a time, through the same op as before. */
  function commitPending(): void {
    let last = '';
    for (const s of STATS) for (let i = 0; i < (pending[s.id] ?? 0); i++) last = v.ops.levelUp(s.id) || last;
    pending = {};
    if (last) toast(last);
  }

  /** Leave the bonfire (or open the inventory): first ask about planned points that were never confirmed. */
  function leave(then: () => void): void {
    if (pendingCount() > 0) {
      confirmLeave = then;
      render();
      return;
    }
    then();
  }

  /** The numbers a stat point can change, for one character, so the before and after can sit side by side. */
  function numbers(ch: Character): { label: string; value: number; fmt: (x: number) => string; lowerIsBetter?: boolean; neutral?: boolean; head?: string }[] {
    const d = computeDerived(ch);
    const rows: { label: string; value: number; fmt: (x: number) => string; lowerIsBetter?: boolean; neutral?: boolean; head?: string }[] = [];
    const n0 = (x: number): string => String(Math.round(x));
    const n1 = (x: number): string => x.toFixed(1);
    const times = (x: number): string => `×${x.toFixed(2)}`;
    const pct = (x: number): string => `${Math.round(x * 100)}%`;
    rows.push({ head: 'Character', label: 'Level', value: ch.level, fmt: n0 });
    rows.push({ label: 'Shards', value: ch.shards, fmt: (x) => fmt(Math.round(x)), neutral: true });
    rows.push({ head: 'Body', label: 'Max HP', value: d.maxHp, fmt: n0 });
    rows.push({ label: 'Max stamina', value: d.maxStam, fmt: n0 });
    rows.push({ label: 'Stamina regen /s', value: d.regen, fmt: n1 });
    rows.push({ label: 'Equip load max', value: d.load.max, fmt: n1 });
    rows.push({ label: `Equip load (${d.load.tier})`, value: d.load.frac, fmt: pct, lowerIsBetter: true });
    rows.push({ label: 'Thermos heal', value: flaskHeal(d.maxHp, d.stats.prayer, d.flaskBonus, d.statBoost.prayer), fmt: n0 });
    rows.push({ head: 'Attack', label: `${ch.equipment.main?.name ?? 'Fists'} power`, value: d.weaponPower, fmt: n0 });
    if (ch.altMain) {
      const alt = structuredClone(ch);
      alt.equipment.main = alt.altMain;
      rows.push({ label: `${ch.altMain.name} power`, value: computeDerived(alt).weaponPower, fmt: n0 });
    }
    rows.push({ label: 'Attack speed', value: d.attackSpeed, fmt: times });
    for (const school of ['brain', 'prayer'] as const) {
      const tool = d.mainTool?.def.school === school ? d.mainTool : d.offTool?.def.school === school ? d.offTool : null;
      if (tool) rows.push({ label: `${school === 'brain' ? 'Brain' : 'Prayer'} Spell Skill`, value: spellSkill(d, school), fmt: (x: number) => String(Math.round(x)) });
    }
    rows.push({ label: 'Cast speed', value: d.castSpeed, fmt: times });
    rows.push({ label: 'Walk while casting', value: d.castMoveMult, fmt: pct });
    rows.push({ label: 'Dodge recharge', value: d.dodgeRecharge, fmt: (x) => `${x.toFixed(1)} s`, lowerIsBetter: true });
    DAMAGE_TYPES.forEach((k, i) => rows.push({ ...(i === 0 ? { head: 'Defense' } : {}), label: ELEMENTS[k].short, value: d.defense[k], fmt: n0 }));
    return rows;
  }

  function levelTab(el: HTMLElement): void {
    const c = v.char;
    // shards spent elsewhere since (the shop) can make a plan too dear: drop points from the end until it fits
    let plan = planLevelUps(c, pending);
    while (!plan.ok && pendingCount() > 0) {
      const last = [...STATS].reverse().find((s) => (pending[s.id] ?? 0) > 0)!;
      pending[last.id] = (pending[last.id] ?? 0) - 1;
      plan = planLevelUps(c, pending);
    }
    const after = plan.char;
    const count = pendingCount();
    const nextCost = after.freePoints > 0 ? 0 : levelCost(after.level);
    el.appendChild(
      h(
        'div',
        { class: 'row', style: 'gap:30px' },
        h('div', null, count ? `Level ${c.level} → ${after.level}` : `Level ${c.level}`),
        h('div', { class: 'mono' }, count ? `◆ ${fmt(c.shards)} → ${fmt(after.shards)} Shards` : `◆ ${fmt(c.shards)} Shards`),
        h('div', { class: after.freePoints ? 'good' : after.shards >= nextCost ? 'good' : 'bad' }, after.freePoints ? `${after.freePoints} free points from a Tear` : `Next point: ${fmt(nextCost)}`),
      ),
    );
    const body = h('div', { class: 'row', style: 'align-items:flex-start;gap:28px;margin-top:10px' });
    // ---- left: the stats with −1 / +1
    const left = h('div', { class: 'col', style: 'gap:6px;min-width:520px' });
    for (const s of STATS) {
      const p = pending[s.id] ?? 0;
      const canAdd = planLevelUps(c, { ...pending, [s.id]: p + 1 }).ok;
      const minus = btn('−1', () => {
        pending[s.id] = Math.max(0, p - 1);
        render();
      }, 'tiny', p <= 0);
      minus.setAttribute('data-focus', `lvl-minus-${s.id}`);
      minus.setAttribute('aria-label', `${s.label} minus one`);
      const plus = btn('+1', () => {
        pending[s.id] = p + 1;
        render();
      }, 'tiny', !canAdd);
      plus.setAttribute('data-focus', `lvl-plus-${s.id}`);
      plus.setAttribute('aria-label', `${s.label} plus one`);
      left.appendChild(
        h(
          'div',
          { class: 'row', 'data-testid': `lvl-row-${s.id}`, 'data-focus-group': `lvl-${s.id}` },
          // the class's primary (+25%) and secondary (+15%) stats are marked (D184)
          h('div', { style: 'width:100px', title: isPrimaryStat(c.classId, s.id) ? 'Primary: every point gives 25% more' : isSecondaryStat(c.classId, s.id) ? 'Secondary: every point gives 15% more' : '' }, s.label, isPrimaryStat(c.classId, s.id) ? ' (P)' : isSecondaryStat(c.classId, s.id) ? ' (S)' : ''),
          h('div', { class: 'mono', style: 'width:76px' }, p ? h('span', null, `${c.stats[s.id]} → `, h('b', { class: 'good' }, String(after.stats[s.id]))) : String(c.stats[s.id])),
          minus,
          plus,
          h('div', { class: 'small dim-text' }, s.what),
        ),
      );
    }
    const confirm = btn(count ? `Confirm ${count} point${count === 1 ? '' : 's'}${plan.shardsSpent ? ` (◆ ${fmt(plan.shardsSpent)})` : ''}` : 'Confirm', () => {
      commitPending();
      render();
    }, 'primary', count === 0);
    confirm.setAttribute('data-focus', 'lvl-confirm');
    confirm.setAttribute('data-testid', 'lvl-confirm');
    const reset = btn('Reset', () => {
      pending = {};
      render();
    }, '', count === 0);
    reset.setAttribute('data-focus', 'lvl-reset');
    left.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, confirm, reset, h('div', { class: 'small dim-text' }, count ? 'Nothing is spent until you confirm.' : 'Plan points with +1 and −1, then confirm.')));
    body.appendChild(left);
    // ---- right: every number the points change, before → after
    const before = numbers(c);
    const now = numbers(after);
    const table = h('div', { class: 'kv stats-kv', style: 'min-width:360px;grid-template-columns:auto auto auto', 'data-testid': 'lvl-compare' });
    before.forEach((r, i) => {
      const a = now[i]!;
      if (r.head) table.append(h('div', { class: 'kv-head', style: 'grid-column:1 / -1' }, r.head));
      const changed = count > 0 && Math.abs(a.value - r.value) > 1e-6;
      const better = r.lowerIsBetter ? a.value < r.value : a.value > r.value;
      table.append(h('div', { class: 'k' }, r.label), h('div', { class: 'mono' }, r.fmt(r.value)), h('div', { class: `mono ${changed ? (r.neutral ? '' : better ? 'good' : 'bad') : 'dim-text'}` }, changed ? `→ ${a.fmt(a.value)}` : ''));
    });
    body.appendChild(h('div', { class: 'col', style: 'gap:4px' }, h('div', { class: 'small dim-text' }, count ? 'Now → after your planned points' : 'Your numbers now (plan points to see what changes)'), table));
    el.appendChild(body);
  }

  /** "Lock in your stat changes?" when leaving with planned points (D142). */
  function leaveDialog(): HTMLElement | null {
    if (!confirmLeave) return null;
    const then = confirmLeave;
    const count = pendingCount();
    const plan = planLevelUps(v.char, pending);
    return h(
      'div',
      { class: 'panel col', style: 'max-width:520px;gap:10px', 'data-testid': 'lvl-leave-dialog' },
      h('h2', { style: 'margin:0' }, 'Lock in your stat changes?'),
      h('div', null, `You planned ${count} point${count === 1 ? '' : 's'}${plan.shardsSpent ? ` (◆ ${fmt(plan.shardsSpent)} Shards)` : ''} but did not confirm them.`),
      h(
        'div',
        { class: 'row' },
        btn('Lock in', () => {
          confirmLeave = null;
          commitPending();
          then();
        }, 'primary'),
        btn('Discard', () => {
          confirmLeave = null;
          pending = {};
          then();
        }),
        btn('Keep editing', () => {
          confirmLeave = null;
          render();
        }),
      ),
    );
  }

  /** Perk names in their colours with their tiers, and the Weapon / Armor chip. */
  function gemNameEl(g: Gem): HTMLElement {
    const el = h('div', { class: 'gem-name' }, gemKindChip(g));
    g.perks.forEach((p, i) => {
      if (i) el.appendChild(h('span', { class: 'dim-text' }, '+'));
      el.appendChild(h('span', { style: `color:${GEMS[p.family].color}` }, perkName(p)));
    });
    return el;
  }

  /** The gem's lock (D282): Sell all gems keeps a locked gem. */
  function gemLock(g: Gem, loc: GemLoc): HTMLElement {
    const b = gemLockButton(g, `gem-lock-${locKey(loc)}`, () => say(v.ops.toggleGemLock(loc)));
    b.setAttribute('data-focus', `gem-lock-${locKey(loc)}`);
    return b;
  }

  /** One gem on one line: icon, name + chip + effects, then its buttons, the lock last (Y on a pad or L on any of them). */
  function gemRow(g: Gem, loc: GemLoc, acts: (HTMLElement | null)[], testid: string): HTMLElement {
    const icon = h('span', { style: 'display:inline-flex;flex:none' }, gemIcon(g, 26));
    hoverTip(icon, () => gemTooltip(g));
    const main = h('div', { class: 'gem-main' }, gemNameEl(g), h('div', { class: 'small' }, perkEffectsEl(g)));
    const lock = gemLock(g, loc);
    const row = h('div', { class: `gem-row${g.locked ? ' locked-row' : ''}`, 'data-testid': testid }, icon, main, h('div', { class: 'gem-acts' }, ...acts, lock));
    for (const b of row.querySelectorAll<HTMLElement>('button')) {
      if (b === lock) continue;
      b.addEventListener(PAD_LOCK_EVENT, () => lock.click());
      b.addEventListener('keydown', (e) => {
        if (e.code !== 'KeyL' || e.repeat) return;
        e.preventDefault();
        lock.click();
      });
    }
    return row;
  }

  function fuseBtn(g: Gem, loc: GemLoc): HTMLElement | null {
    if (g.perks.length < 2) return null;
    const b = btn('Fuse', () => {
      fuse = { orig: loc, donor: null, picks: g.perks.map((_, i) => ({ from: 'orig' as const, idx: i })) };
      render();
    }, 'tiny');
    b.title = 'Swap perks in from another gem of the same kind (that gem is destroyed).';
    b.setAttribute('data-testid', 'gem-fuse');
    return b;
  }

  /** Weapons (D178): each weapon, casting tool and shield (D221) you carry, its experience bar, and raising it a rarity. */
  function weaponsTab(el: HTMLElement): void {
    const c = v.char;
    const all = [c.equipment.main, c.equipment.off, c.altMain, c.altOff, ...c.bag].filter((i): i is Item => hasRarityBar(i));
    const list = h('div', { class: 'col', style: 'gap:6px;width:640px;max-height:540px;overflow:auto' }, h('h3', null, 'Weapons · ', glowenEl(c.glowen)));
    if (!all.length) list.appendChild(h('div', { class: 'dim-text' }, 'You carry no weapons, casting tools or shields.'));
    for (const it of all) {
      const u = upgradeInfo(it);
      const worn = itemPlace(c, it.id) !== 'bag';
      const card = h('div', { class: 'card', style: `padding:6px 8px${worn ? ';border-left:3px solid #e8c25a' : ''}`, 'data-testid': `weapon-card-${it.id}` });
      const name = h('div', { class: `r-${it.rarity}` }, it.name, h('span', { class: 'small dim-text' }, ` · ${it.rarity[0]!.toUpperCase()}${it.rarity.slice(1)} · ${placeLabel(c, it.id)}`));
      hoverTip(name, () => itemTooltip(it, c, 'auto'));
      card.appendChild(name);
      if (!u) {
        card.appendChild(h('div', { class: 'small dim-text' }, 'Legendary: as high as it goes.'));
      } else {
        const fill = Math.min(1, u.xp / u.need);
        card.appendChild(h('div', { style: 'height:8px;border-radius:4px;background:#2a2533;overflow:hidden;margin:4px 0' }, h('div', { style: `height:100%;width:${Math.round(fill * 100)}%;background:${u.ready ? '#ffd27a' : '#8fd3ff'}` })));
        const to = `${u.to[0]!.toUpperCase()}${u.to.slice(1)}`;
        const b = btn(['Raise to ' + to + ' · ', glowenEl(u.cost)], () => say(v.ops.raiseRarity(it.id)), 'tiny', !u.ready || c.glowen < u.cost);
        b.setAttribute('data-focus', `raise-${it.id}`);
        b.setAttribute('data-testid', `raise-${it.id}`);
        card.appendChild(h('div', { class: 'row', style: 'gap:8px;align-items:center' }, h('span', { class: 'small' }, u.ready ? 'Bar full' : `${u.xp} / ${u.need}`), b));
      }
      list.appendChild(card);
    }
    const help = h('div', { class: 'small dim-text', style: 'max-width:420px' },
      'Every enemy that falls gives experience to what you have out: the weapon in your hand and a staff, talisman or shield in your other hand, whoever made the kill. A full bar lets you raise the item a rarity here for Glowen: it keeps its affixes, sockets, gems and skills and moves up to the new rarity’s damage (a shield’s block). Epic becomes Legendary with a legendary power of its own. The same experience trains your weapon-class proficiency (inventory → Proficiency).');
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, list, help));
  }

  /** Reinforce (D198): Soul Essence held, and every weapon, shield and armour piece you carry with its next +1. */
  function reinforceTab(el: HTMLElement): void {
    const c = v.char;
    const have = essenceCounts(c);
    const purse = h('div', { class: 'row wrap', style: 'gap:10px;align-items:center', 'data-testid': 'essence-purse' });
    ESSENCES.forEach((d, i) => {
      const chip = h('span', { class: 'small', style: `color:${d.color};${have[i] ? '' : 'opacity:.45'}`, 'data-testid': `essence-${d.tier}` }, `◆ ${d.name} × ${have[i]}`);
      chip.title = `Tier ${d.tier}. ${d.blurb}`;
      purse.appendChild(chip);
    });
    const all = [c.equipment.main, c.equipment.off, c.altMain, c.altOff, c.equipment.head, c.equipment.body, c.equipment.legs, ...c.bag].filter((i): i is Item => !!i && canReinforce(i));
    const list = h('div', { class: 'col', style: 'gap:6px;width:640px;max-height:500px;overflow:auto' }, h('h3', null, 'Reinforce · ', glowenEl(c.glowen)), purse);
    if (!all.length) list.appendChild(h('div', { class: 'dim-text' }, 'You carry no weapons, shields or armour.'));
    for (const it of all) {
      const info = reinforceInfo(c, it);
      const worn = itemPlace(c, it.id) !== 'bag';
      const card = h('div', { class: 'card', style: `padding:6px 8px${worn ? ';border-left:3px solid #e8c25a' : ''}`, 'data-testid': `reinforce-card-${it.id}` });
      const name = h('div', { class: `r-${it.rarity}` }, plusName(it), h('span', { class: 'small dim-text' }, ` · ${placeLabel(c, it.id)} · ×${info.mult.toFixed(1)} strength`));
      hoverTip(name, () => itemTooltip(it, c, 'auto'));
      card.appendChild(name);
      // fifteen pips, a tier's colour every three
      const pips = h('div', { class: 'row', style: 'gap:2px;margin:4px 0' });
      for (let k = 0; k < MAX_REINFORCE; k++) pips.appendChild(h('span', { style: `width:14px;height:6px;border-radius:2px;background:${k < info.plus ? essenceDef(Math.floor(k / 3) + 1).color : '#2a2533'}` }));
      card.appendChild(pips);
      if (!info.next) card.appendChild(h('div', { class: 'small dim-text' }, `+${MAX_REINFORCE}: as strong as it gets.`));
      else {
        const nd = essenceDef(info.next.tier);
        // shows what the step would do first; nothing is spent until it is confirmed there (D220)
        const b = btn([`+${info.plus + 1} · `, h('span', { style: `color:${nd.color}` }, `${info.next.count} × ${nd.name}`), ' + ', glowenEl(info.next.glowen)], () => {
          reinforceAsk = { itemId: it.id };
          render();
        }, 'tiny', !info.affordable);
        b.setAttribute('data-focus', `reinforce-${it.id}`);
        b.setAttribute('data-testid', `reinforce-${it.id}`);
        b.title = `×${info.mult.toFixed(1)} → ×${info.nextMult.toFixed(1)}. Higher-tier Essence pays 3:1 for this one.`;
        card.appendChild(h('div', { class: 'row', style: 'gap:8px;align-items:center' }, b));
      }
      list.appendChild(card);
    }
    const help = h('div', { class: 'small dim-text', style: 'max-width:420px' },
      'Soul Essence is what is left of somebody once the Landlord’s staff have taken all their Glowen: the stubborn part that never paid rent. The fires take it; nobody else will, so it cannot be sold.',
      h('br'), h('br'),
      'Each +1 makes a weapon, staff or talisman hit 15% harder (+15 is ×3.25), and a shield block or a piece of armour defend 20% better (+15 is ×4). A step costs 1, then 2, then 3 Essence of one tier (6 a tier), a new tier every three levels, plus Glowen. One Essence of a higher tier pays for three of the tier below.',
      h('br'), h('br'),
      'None below zone 4 of the first descent; Tier 1 from zone 4, then one tier more each New Game+ (Tier 5 from New Game+4).');
    // D285: break Essence down by hand, one into three of the tier below
    const brk = h('div', { class: 'card col', style: 'gap:6px;padding:8px 10px;width:420px', 'data-testid': 'essence-breakdown' }, h('h3', { style: 'margin:0' }, 'Break down Essence'), h('div', { class: 'small dim-text' }, 'One Essence becomes three of the tier below.'));
    for (const d of ESSENCES) {
      if (d.tier < 2) continue;
      const n = have[d.tier - 1] ?? 0;
      const lower = essenceDef(d.tier - 1);
      const one = btn('Convert 1', () => say(v.ops.breakEssence(d.tier, false)), 'tiny', n <= 0);
      one.setAttribute('data-testid', `essence-break-${d.tier}`);
      one.title = `1 × ${d.name} → 3 × ${lower.name}`;
      const all = btn('Convert all', () => say(v.ops.breakEssence(d.tier, true)), 'tiny', n <= 0);
      all.setAttribute('data-testid', `essence-break-all-${d.tier}`);
      all.title = `${n} × ${d.name} → ${3 * n} × ${lower.name}`;
      brk.appendChild(
        h(
          'div',
          { class: 'row', style: 'gap:6px;align-items:center' },
          h('span', { class: 'small', style: `flex:1;min-width:0;color:${d.color};${n ? '' : 'opacity:.45'}` }, `${d.name} × ${n}`, h('span', { class: 'dim-text' }, ' → 3 × '), h('span', { style: `color:${lower.color}` }, lower.name)),
          one,
          all,
        ),
      );
    }
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, list, h('div', { class: 'col', style: 'gap:12px' }, brk, help)));
  }

  /** What is missing for the next step (D232): the Essence (and where that tier drops) or the Glowen. */
  function reinforceShortfall(c: Character, next: { tier: number; count: number; glowen: number; name: string }): string {
    const have = essenceCounts(c);
    if (!canPayEssence(have, next.tier, next.count)) {
      const where = next.tier === 1 ? 'It drops from zone 4 of the first descent.' : `It drops only in New Game+${next.tier - 1}${next.tier === 5 ? ' and later' : ''}, so the first descent stops at +3.`;
      return `You have ${have[next.tier - 1] ?? 0} × ${next.name} (Tier ${next.tier}) and nothing higher to break down. ${where}`;
    }
    return `Not enough Glowen: ${fmt(next.glowen)} needed, you have ${fmt(c.glowen)}.`;
  }

  /** Before and after one reinforcement step (D216):damage for a weapon, block and stamina for a shield, defense for armour. */
  function reinforceRows(it: Item, from: number, to: number): { label: string; before: string; after: string }[] {
    const c = v.char;
    const rows: { label: string; before: string; after: string }[] = [];
    const add = (label: string, a: number, b: number, f: (x: number) => string): void => {
      if (a !== b || a !== 0) rows.push({ label, before: f(a), after: f(b) });
    };
    const at = (plus: number): Item => ({ ...it, plus });
    const int = (x: number): string => fmt(Math.round(x));
    const pc = (x: number): string => `${Math.round(x * 100)}%`;
    if (it.kind === 'weapon') {
      const st = computeDerived(c).stats;
      add('Damage per hit', itemScore(at(from), st, c.twoHanded), itemScore(at(to), st, c.twoHanded), int);
    } else if (it.kind === 'shield' && SHIELDS[it.baseId]) {
      const sd = SHIELDS[it.baseId]!;
      const a = shieldValues(sd, it.ilvl, from, it.rarity);
      const b = shieldValues(sd, it.ilvl, to, it.rarity);
      add('Physical block', a.physical, b.physical, pc);
      add('Elemental block', a.elemental, b.elemental, pc);
      add('Holy / Void block', a.holyVoid, b.holyVoid, pc);
      add('Stamina per 100 blocked', shieldStability(sd, from, it.rarity), shieldStability(sd, to, it.rarity), (x) => x.toFixed(1));
    } else if ((it.kind === 'staff' || it.kind === 'talisman') && CASTING_TOOLS[it.baseId]) {
      // D227: a staff's or talisman's Spell Skill for your stats now
      const st = computeDerived(c).stats;
      const sch = CASTING_TOOLS[it.baseId]!.school;
      const boost = statBoosts(c.classId);
      add(`${sch === 'brain' ? 'Brain' : 'Prayer'} Spell Skill`, toolSpellSkill(at(from), st, boost), toolSpellSkill(at(to), st, boost), int);
    } else if (it.kind === 'armor') {
      const a = armorPieceDefense(it.baseId, it.ilvl, from);
      const b = armorPieceDefense(it.baseId, it.ilvl, to);
      for (const t of DAMAGE_TYPES) add(`${t[0]!.toUpperCase()}${t.slice(1)} defense`, a[t], b[t], (x) => x.toFixed(1));
    }
    // weapons, staffs and talismans gain 15% a step, armour and shields 20% (D303)
    const rm = it.kind === 'armor' || it.kind === 'shield' ? reinforceMult : reinforceDmgMult;
    rows.push({ label: 'Strength', before: `×${rm(from).toFixed(2)}`, after: `×${rm(to).toFixed(2)}` });
    return rows;
  }

  /**
   * The next reinforcement of one item, before it is taken (D216 / D220): its name now and after, each stat before →
   * after, and the cost. Reinforce spends and applies it; Back (or B / Escape) leaves everything as it was and the focus
   * goes back to that item's button.
   */
  function reinforceDialog(): HTMLElement | null {
    if (!reinforceAsk) return null;
    const c = v.char;
    const it = [c.equipment.main, c.equipment.off, c.altMain, c.altOff, c.equipment.head, c.equipment.body, c.equipment.legs, ...c.bag].find((x) => x?.id === reinforceAsk!.itemId);
    if (!it) {
      reinforceAsk = null;
      return null;
    }
    const info = reinforceInfo(c, it);
    if (!info.next) {
      reinforceAsk = null;
      return null;
    }
    const rows = reinforceRows(it, info.plus, info.plus + 1);
    const nd = essenceDef(info.next.tier);
    const yes = btn('Reinforce', () => {
      const msg = v.ops.reinforce(it.id);
      reinforceAsk = null;
      say(msg);
    }, 'primary', !info.affordable);
    yes.setAttribute('data-testid', 'reinforce-confirm');
    const back = btn('Back', () => {
      reinforceAsk = null;
      render();
    });
    back.setAttribute('data-testid', 'reinforce-back');
    const grid = h('div', { style: 'display:grid;grid-template-columns:auto auto auto auto;column-gap:12px;row-gap:4px;align-items:baseline' });
    for (const row of rows) grid.append(h('div', { class: 'dim-text' }, row.label), h('div', { class: 'mono' }, row.before), h('div', { class: 'dim-text' }, '→'), h('div', { class: 'mono good' }, row.after));
    return h(
      'div',
      { class: 'panel col', style: 'width:460px;gap:10px', 'data-testid': 'reinforce-dialog' },
      h('h2', null, 'Reinforce?'),
      h('div', { class: `r-${it.rarity}`, style: 'font-size:18px;font-weight:600' }, plusName(it), h('span', { class: 'dim-text' }, ' → '), `+${info.plus + 1}`),
      grid,
      h('div', { class: 'row small', style: 'gap:6px;align-items:center' }, 'Costs ', h('span', { style: `color:${nd.color}` }, `${info.next.count} × ${nd.name}`), ' + ', glowenEl(info.next.glowen), h('span', { class: 'dim-text' }, ' (one of a higher tier pays for three)')),
      // D232: say why it cannot be done instead of only graying the button
      info.affordable ? null : h('div', { class: 'small bad', 'data-testid': 'reinforce-why' }, reinforceShortfall(c, info.next)),
      h('div', { class: 'row' }, yes, back),
    );
  }

  function gemsTab(el: HTMLElement): void {
    const c = v.char;
    // D227: the off hand too (a shield takes armour gems, a staff or talisman weapon gems)
    const items = [c.equipment.main, c.equipment.off, c.altMain, c.altOff, c.equipment.head, c.equipment.body, c.equipment.legs, ...c.bag].filter((i): i is Item => !!i && i.sockets.length > 0 && !!socketKind(i));
    const list = h('div', { class: 'col', style: 'gap:6px;width:500px;max-height:540px;overflow:auto' }, h('h3', null, 'Socketed gear'));
    if (items.length === 0) list.appendChild(h('div', { class: 'dim-text' }, 'Nothing you carry has sockets. Rare and better gear does.'));
    // worn gear first, under its own heading and tagged with its slot, then the bag (D168)
    let heading = '';
    for (const it of items) {
      const worn = itemPlace(c, it.id) !== 'bag';
      const want = worn ? 'Equipped' : 'In your bag';
      if (want !== heading) {
        heading = want;
        list.appendChild(h('div', { class: 'small', style: 'margin-top:4px;color:#cfc6b4;letter-spacing:0.08em;text-transform:uppercase' }, want));
      }
      const card = h('div', { class: `card ${selItem === it.id ? 'on' : ''}`, style: `padding:6px 8px${worn ? ';border-left:3px solid #e8c25a' : ''}` });
      card.setAttribute('data-testid', `gem-card-${it.id}`);
      const tag = worn ? h('span', { class: 'tag-equipped', style: 'margin-left:6px;padding:0 6px;border-radius:4px;background:#e8c25a;color:#1a1408;font-size:11px;font-weight:bold' }, `Equipped · ${placeLabel(c, it.id)}`) : null;
      const nameEl = h('div', { class: `r-${it.rarity}` }, it.name, tag, h('span', { class: 'small dim-text' }, ` · ${socketKind(it) === 'armor' ? 'armor gems' : 'weapon gems'}`));
      hoverTip(nameEl, () => itemTooltip(it, c, 'auto'));
      card.appendChild(nameEl);
      it.sockets.forEach((g, i) => {
        if (g) {
          const loc: GemLoc = { itemId: it.id, socketIdx: i };
          card.appendChild(gemRow(g, loc, [fuseBtn(g, loc), btn('Remove', () => say(v.ops.unsocket(it.id, i)), 'tiny')], `socket-gem-${it.id}-${i}`));
        } else
          card.appendChild(
            h(
              'div',
              { class: 'row', style: 'padding:3px 0' },
              (() => {
                const chosen = selItem === it.id && (selSocket === i || (selSocket < 0 && it.sockets.findIndex((x) => !x) === i));
                const b = btn(`◇ Empty socket ${i + 1} — ${chosen ? 'pick a gem →' : 'select'}`, () => {
                  selItem = it.id;
                  selSocket = i;
                  render();
                }, chosen ? 'tiny on' : 'tiny');
                b.setAttribute('data-testid', `empty-socket-${it.id}-${i}`);
                return b;
              })(),
            ),
          );
      });
      list.appendChild(card);
    }
    const gems = h('div', { class: 'col', style: 'gap:4px;flex:1;min-width:0;max-height:540px;overflow:auto' }, h('h3', null, 'Loose gems · ', glowenEl(c.glowen)));
    // D282: sell every loose gem that is not locked, after a confirm
    const gpv = sellAllGemsPreview(c);
    const sellAllB = btn('Sell all gems', () => {
      confirmGemSell = true;
      render();
    }, 'tiny danger', gpv.count === 0);
    sellAllB.setAttribute('data-testid', 'sell-all-gems');
    sellAllB.title = `${gpv.count} gem${gpv.count === 1 ? '' : 's'} for ${gpv.glowen} Glowen${gpv.locked ? ` (${gpv.locked} locked kept)` : ''}`;
    gems.appendChild(h('div', { class: 'row wrap', style: 'gap:4px;margin-bottom:4px' }, sellAllB));
    const sel = selItem ? items.find((i) => i.id === selItem) : null;
    // the socket picked, if it is still empty; else the first empty one
    const free = sel ? (selSocket >= 0 && selSocket < sel.sockets.length && !sel.sockets[selSocket] ? selSocket : sel.sockets.findIndex((x) => !x)) : -1;
    // D280: with a socket picked only the gems that fit it are listed (armor gems for armour and shields, weapon gems for
    // weapons, staffs and talismans); the rest come back when nothing is picked
    const filterKind = sel && free >= 0 ? socketKind(sel) : null;
    let hidden = 0;
    c.gems.forEach((g, gi) => {
      if (filterKind && gemKind(g) !== filterKind) {
        hidden++;
        return;
      }
      const loc: GemLoc = { gemIdx: gi };
      let sock: HTMLElement | null = null;
      if (sel && free >= 0) {
        const fits = canSocket(sel, g);
        sock = btn('Socket', () => say(v.ops.socket(sel.id, free, gi)), 'tiny', !fits);
        sock.title = fits ? `Into socket ${free + 1} of ${sel.name}` : `${sel.name} takes ${socketKind(sel) === 'armor' ? 'armor' : 'weapon'} gems.`;
      }
      // a locked gem's Sell is greyed out (D329)
      const sell = btn(['Sell ', glowenEl(gemSellTotal(g), '+')], () => say(v.ops.sellGem(gi)), 'tiny', !!g.locked);
      if (g.locked) sell.title = 'Locked: unlock it to sell it.';
      gems.appendChild(h('div', { class: 'card', style: 'padding:0' }, gemRow(g, loc, [sock, sell, fuseBtn(g, loc)], `loose-gem-${gi}`)));
    });
    if (filterKind && sel) {
      const all = btn('Show all gems', () => {
        selItem = null;
        selSocket = -1;
        render();
      }, 'tiny');
      all.setAttribute('data-testid', 'gem-filter-clear');
      gems.insertBefore(
        h('div', { class: 'row small', style: 'gap:6px;align-items:center', 'data-testid': 'gem-filter' }, h('span', { class: 'dim-text' }, `${filterKind === 'armor' ? 'Armor' : 'Weapon'} gems for socket ${free + 1} of ${sel.name}${hidden ? ` · ${hidden} ${filterKind === 'armor' ? 'weapon' : 'armor'} gem${hidden === 1 ? '' : 's'} hidden` : ''}`), all),
        gems.children[2] ?? null,
      );
    }
    if (c.gems.length === 0) gems.appendChild(h('div', { class: 'dim-text' }, 'No loose gems.'));
    else if (filterKind && hidden === c.gems.length) gems.appendChild(h('div', { class: 'dim-text' }, `No loose ${filterKind} gems.`));
    gems.appendChild(h('div', { class: 'small dim-text', style: 'margin-top:6px' }, 'Weapon gems fit weapon sockets, armor gems armor sockets; picking an empty socket lists only the gems that fit it. A gem is as strong as its level and its roll (−50% … +50%). The padlock keeps a gem from Sell all gems. Gems can also be removed from the inventory, anywhere. NG+ gems carry two or three perks; Fuse swaps perks between two gems of the same kind.'));
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, list, gems));
  }

  /** The fuse dialog: choose which perks the original gem ends up with, from it and a donor gem. */
  function fuseDialog(): HTMLElement | null {
    if (!fuse) return null;
    const c = v.char;
    const f = fuse;
    const orig = gemAt(c, f.orig);
    if (!orig || orig.perks.length < 2) {
      fuse = null;
      return null;
    }
    const n = orig.perks.length;
    const kind = gemKind(orig);
    const donors = c.gems.map((g, i) => ({ g, i })).filter(({ g }) => g !== orig && gemKind(g) === kind);
    const donor = f.donor !== null ? (c.gems[f.donor] ?? null) : null;
    const pickedFamilies = f.picks.map((p) => (p.from === 'orig' ? orig : donor)?.perks[p.idx]?.family);
    // D286: the original gem's original perks, one of which every fuse keeps
    const origin = gemOrigin(orig);
    const perkBtn = (g: Gem, from: 'orig' | 'donor', idx: number): HTMLElement => {
      const p = g.perks[idx]!;
      const on = f.picks.some((x) => x.from === from && x.idx === idx);
      const dup = !on && pickedFamilies.includes(p.family);
      const full = !on && f.picks.length >= n;
      const b = btn(
        [
          h('span', { class: 'tick' }, on ? '✓' : ''),
          h('span', { style: `color:${GEMS[p.family].color};width:120px` }, perkName(p)),
          h('span', { class: 'small' }, perkEffectEl(p)),
          from === 'orig' && origin.includes(p.family) ? h('span', { class: 'small', style: 'margin-left:6px;padding:0 5px;border-radius:4px;border:1px solid #e8c25a;color:#e8c25a', title: 'An original perk: every fuse must keep at least one.', 'data-testid': `fuse-original-${idx}` }, 'original') : null,
        ],
        () => {
          if (on) f.picks = f.picks.filter((x) => !(x.from === from && x.idx === idx));
          else f.picks.push({ from, idx });
          render();
        },
        `fuse-perk ${on ? 'on' : ''}`,
        dup || full,
      );
      b.setAttribute('data-testid', `fuse-${from}-${idx}`);
      if (dup) b.title = `You already keep a ${GEMS[p.family].name} perk.`;
      else if (full) b.title = `A fused gem has ${n} perks: untick one first.`;
      return b;
    };
    const left = h('div', { class: 'col', style: 'gap:4px;width:400px' }, h('h3', null, 'Original gem'), gemNameEl(orig), ...orig.perks.map((_, i) => perkBtn(orig, 'orig', i)));
    const right = h('div', { class: 'col', style: 'gap:4px;flex:1' }, h('h3', null, 'Fuse with (destroyed)'));
    if (donors.length === 0) right.appendChild(h('div', { class: 'dim-text' }, `No loose ${gemKindLabel(orig).toLowerCase()} to fuse with.`));
    for (const d of donors) {
      const on = f.donor === d.i;
      const b = btn([gemIcon(d.g, 20), ' ', gemTitle(d.g)], () => {
        f.donor = on ? null : d.i;
        f.picks = orig.perks.map((_, i) => ({ from: 'orig' as const, idx: i }));
        render();
      }, `tiny fuse-perk ${on ? 'on' : ''}`);
      b.setAttribute('data-testid', `fuse-gem-${d.i}`);
      right.appendChild(b);
      // D286: every perk's effect and strength, to compare without opening each gem
      if (!on) right.appendChild(h('div', { class: 'col', style: 'gap:1px;padding:0 0 4px 30px', 'data-testid': `fuse-gem-effects-${d.i}` }, ...gemPerkLines(d.g)));
      if (on) {
        const perks = h('div', { class: 'col', style: 'gap:4px;padding-left:18px' });
        d.g.perks.forEach((_, i) => perks.appendChild(perkBtn(d.g, 'donor', i)));
        right.appendChild(perks);
      }
    }
    const res = fusePreview(orig, donor, f.picks);
    const preview = h('div', { class: 'card col', style: 'gap:4px' }, h('div', { class: 'small dim-text' }, `Result: keep ${n} perks, at least one from each gem. Picked ${f.picks.length} of ${n}.`));
    if ('error' in res) preview.appendChild(h('div', { class: 'small bad', 'data-testid': 'fuse-error' }, res.error));
    else {
      const g: Gem = { perks: res.perks };
      preview.appendChild(h('div', { class: 'row' }, gemIcon(g, 26), gemNameEl(g)));
      for (const line of gemPerkLines(g)) preview.appendChild(line);
    }
    const cost = 'error' in res ? 0 : res.cost;
    const go = btn(['Fuse', 'error' in res ? '' : [' (', glowenEl(cost), ')']], () => {
      const msg = v.ops.fuseGem(f.orig, f.donor ?? -1, f.picks);
      fuse = null;
      say(msg);
    }, 'primary', 'error' in res || c.glowen < cost);
    go.setAttribute('data-testid', 'fuse-confirm');
    const cancel = btn('Cancel', () => {
      fuse = null;
      render();
    });
    const box = h(
      'div',
      { class: 'panel col', style: 'width:860px;gap:10px', 'data-testid': 'fuse-dialog' },
      h('h2', null, 'Fuse gems'),
      h('div', { class: 'small dim-text' }, `Choose the perks the original gem keeps; the rest come from the other gem, which is destroyed. Each perk keeps its own level and roll. Keep at least one original perk (${origin.map((f) => GEMS[f].name).join(', ')}): only the ones kept stay original, through every later fuse.`),
      h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, left, right),
      preview,
      h('div', { class: 'row' }, go, cancel, h('div', { class: 'grow' }), glowenEl(c.glowen)),
    );
    return box;
  }

  /**
   * Selling a bag item with gems in it (D240): are you sure? Back (first, with the focus), keep the gems (they go to
   * the loose gems and the item sells alone), or sell it with them.
   */
  function sellAskDialog(): HTMLElement | null {
    if (!sellAsk) return null;
    const c = v.char;
    const it = c.bag.find((x) => x.id === sellAsk);
    const gems = it ? it.sockets.filter((g): g is Gem => !!g) : [];
    if (!it || !gems.length) {
      sellAsk = null;
      return null;
    }
    const back = btn('Back', () => {
      sellAsk = null;
      render();
    });
    back.setAttribute('data-testid', 'sell-ask-back');
    const keep = btn(['Keep the gems, sell for ', glowenEl(itemSellValue({ ...it, sockets: [] }), '+')], () => {
      sellAsk = null;
      it.sockets.forEach((g, i) => {
        if (g) v.ops.unsocket(it.id, i);
      });
      say(v.ops.sellItem(it.id));
    }, 'primary');
    keep.setAttribute('data-testid', 'sell-ask-keep');
    // a locked gem inside never goes with it (D329)
    const lockedGem = gems.some((g) => g.locked);
    const all = btn(['Sell with the gems for ', glowenEl(itemSellValue(it), '+')], () => {
      sellAsk = null;
      say(v.ops.sellItem(it.id));
    }, 'danger', lockedGem);
    if (lockedGem) all.title = 'A gem in it is locked: keep the gems, or unlock it.';
    all.setAttribute('data-testid', 'sell-ask-all');
    return h(
      'div',
      { class: 'panel col', style: 'width:520px;gap:10px', 'data-testid': 'sell-ask-dialog' },
      h('h2', { style: 'margin:0' }, 'Sell it with its gems?'),
      h('div', { class: `r-${it.rarity}`, style: 'font-weight:600' }, plusName(it)),
      h('div', null, `It has ${gems.length} gem${gems.length === 1 ? '' : 's'} socketed. Sold with it, ${gems.length === 1 ? 'that gem is' : 'they are'} gone for good.`),
      h('div', { class: 'col', style: 'gap:2px' }, ...gems.map((g) => h('div', { class: 'row small', style: 'gap:6px;align-items:center' }, gemIcon(g, 18), h('span', null, `${gemKindLabel(g)} · ${gemTitle(g)}`)))),
      h('div', { class: 'row wrap' }, back, keep, all),
    );
  }

  /** "Sell all gems" (D282): how many loose gems go, for how much, the locked ones kept, and a confirm. */
  function gemSellAllDialog(): HTMLElement | null {
    if (!confirmGemSell) return null;
    const pv = sellAllGemsPreview(v.char);
    const yes = btn(['Sell ', String(pv.count), ' for ', glowenEl(pv.glowen, '+')], () => {
      confirmGemSell = false;
      say(v.ops.sellAllGems());
    }, 'primary', pv.count === 0);
    yes.setAttribute('data-testid', 'sell-all-gems-confirm');
    return h(
      'div',
      { class: 'panel col', style: 'width:460px;gap:10px', 'data-testid': 'sell-all-gems-dialog' },
      h('h2', null, 'Sell all gems'),
      h('div', null, `Sell every loose gem that is not locked: ${pv.count} gem${pv.count === 1 ? '' : 's'}.`),
      h('div', { class: 'row' }, 'You get ', glowenEl(pv.glowen, '+'), h('span', { class: 'dim-text' }, ` (you have ${fmt(v.char.glowen)})`)),
      pv.locked ? h('div', { class: 'small good' }, `${pv.locked} locked gem${pv.locked === 1 ? ' is' : 's are'} kept.`) : null,
      h('div', { class: 'small dim-text' }, 'Gems in sockets and locked gems are never sold.'),
      h('div', { class: 'row' }, yes, btn('Cancel', () => {
        confirmGemSell = false;
        render();
      })),
    );
  }

  /** "Sell all": what goes, for how much, and a confirm. */
  function sellAllDialog(): HTMLElement | null {
    if (!confirmSell) return null;
    const def = SELL_ALL.find((s) => s.filter === confirmSell)!;
    const pv = sellAllPreview(v.char, def.filter);
    const kept = lockedSkipped(v.char, def.filter);
    const yes = btn(['Sell ', String(pv.count), ' for ', glowenEl(pv.glowen, '+')], () => {
      confirmSell = null;
      say(v.ops.sellAll(def.filter));
    }, 'primary', pv.count === 0);
    yes.setAttribute('data-testid', 'sell-all-confirm');
    return h(
      'div',
      { class: 'panel col', style: 'width:460px;gap:10px', 'data-testid': 'sell-all-dialog' },
      h('h2', null, def.label),
      h('div', null, `Sell ${def.what}: ${pv.count} item${pv.count === 1 ? '' : 's'}.`),
      h('div', { class: 'row' }, 'You get ', glowenEl(pv.glowen, '+'), h('span', { class: 'dim-text' }, ` (you have ${fmt(v.char.glowen)})`)),
      pv.gems ? h('div', { class: 'small good' }, `${pv.gems} socketed gem${pv.gems === 1 ? '' : 's'} come out first and go to your loose gems.`) : null,
      kept ? h('div', { class: 'small good' }, `${kept} locked item${kept === 1 ? ' is' : 's are'} kept.`) : null,
      h('div', { class: 'small dim-text' }, 'Worn gear, your second weapon and locked items are never sold.'),
      h('div', { class: 'row' }, yes, btn('Cancel', () => {
        confirmSell = null;
        render();
      })),
    );
  }

  function shopTab(el: HTMLElement): void {
    const c = v.char;
    const buy = h('div', { class: 'col', style: 'gap:6px;width:360px' }, h('h3', null, 'Buy · ', glowenEl(c.glowen)));
    for (const s of shopConsumables()) {
      buy.appendChild(h('div', { class: 'row' }, h('div', { style: 'width:150px' }, CONSUMABLES[s.id].name), h('div', { class: 'mono', style: 'width:60px' }, glowenEl(s.price)), h('div', { class: 'small dim-text', style: 'width:60px' }, `have ${c.consumables[s.id] ?? 0}`), btn('Buy', () => say(v.ops.buyConsumable(s.id)), 'tiny', c.glowen < s.price)));
    }
    const sg = v.shopGem;
    const gemPrice = shopGemPrice(sg);
    const gemLine = h('div', { class: 'row' }, gemIcon(sg, 22), h('div', { style: `width:150px;color:${gemColor(sg)}` }, gemTitle(sg)), h('div', { class: 'mono', style: 'width:60px' }, glowenEl(gemPrice)), btn('Buy', () => say(v.ops.buyGem()), 'tiny', c.glowen < gemPrice));
    hoverTip(gemLine, () => gemTooltip(sg));
    buy.appendChild(h('div', { style: 'border-top:1px solid var(--line);margin:4px 0' }));
    buy.appendChild(gemLine);
    buy.appendChild(h('div', { class: 'row small', style: 'padding-left:30px;color:#cfc6b4' }, gemKindChip(sg), perkEffectsEl(sg)));

    // the rotating piece: what it is and its full stats, visible without hovering
    const piece = h('div', { class: 'col', style: 'gap:6px;width:340px' }, h('h3', null, 'Rotating piece'));
    if (v.shopPiece) {
      const p = v.shopPiece;
      const price = shopItemPrice(p);
      const b = h('div', { class: 'row' }, itemIcon(p, 32), h('div', { class: 'col', style: 'gap:0;flex:1' }, h('div', { class: `r-${p.rarity}` }, p.name), h('div', { class: 'small dim-text' }, itemSummary(p))), btn(['Buy ', glowenEl(price)], () => say(v.ops.buyPiece()), 'tiny', c.glowen < price));
      b.setAttribute('data-testid', 'shop-piece');
      piece.appendChild(b);
      piece.appendChild(h('div', { class: 'small dim-text' }, 'Changes every rest. Compared with what you wear:'));
      piece.appendChild(staticTip(itemTooltip(p, c, 'auto')));
    } else piece.appendChild(h('div', { class: 'small dim-text' }, 'The rotating piece is sold. Rest for a new one.'));

    const sell = h('div', { class: 'col', style: 'gap:3px;flex:1;min-width:0;max-height:560px;overflow:auto' }, h('h3', null, 'Sell from your bag'));
    const allRow = h('div', { class: 'row wrap', style: 'gap:4px;margin-bottom:4px' });
    for (const s of SELL_ALL) {
      const pv = sellAllPreview(c, s.filter);
      const b = btn(s.label, () => {
        confirmSell = s.filter;
        render();
      }, s.filter === 'all' ? 'tiny danger' : 'tiny', pv.count === 0);
      b.setAttribute('data-testid', `sell-all-${s.filter}`);
      b.title = `${pv.count} item${pv.count === 1 ? '' : 's'} for ${pv.glowen} Glowen`;
      allRow.appendChild(b);
    }
    sell.appendChild(allRow);
    for (const it of c.bag) {
      const gems = it.sockets.filter((g) => !!g).length;
      const sb = btn([glowenEl(itemSellValue(it), '+'), gems ? h('span', { class: 'small', style: 'margin-left:4px', title: `${gems} gem${gems === 1 ? '' : 's'} socketed` }, '◆'.repeat(gems)) : null], () => {
        // an item with gems in it asks first (D240); the rest sell at once
        if (gems) {
          sellAsk = it.id;
          render();
        } else say(v.ops.sellItem(it.id));
      }, 'tiny', !!it.locked);
      // a locked item's Sell is greyed out (D329)
      if (it.locked) sb.title = 'Locked: unlock it to sell it.';
      sb.setAttribute('data-testid', `sell-${it.id}`);
      sb.setAttribute('data-focus', `sell-${it.id}`);
      // the same lock as the inventory's (D265): Sell all keeps a locked item
      const lk = lockButton(it, () => {
        toggleItemLock(c, it.id);
        render();
      });
      lk.setAttribute('data-focus', `lock-${it.id}`);
      sb.addEventListener(PAD_LOCK_EVENT, () => lk.click());
      const row = h('div', { class: `row${it.locked ? ' locked-row' : ''}` }, itemIcon(it, 24), h('div', { class: `r-${it.rarity}`, style: 'flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, it.name), lk, sb);
      hoverTip(row, () => itemTooltip(it, c, 'auto'));
      sell.appendChild(row);
    }
    for (const [id, n] of Object.entries(c.consumables)) {
      if (!n) continue;
      const def = CONSUMABLES[id as ConsumableId];
      sell.appendChild(h('div', { class: 'row' }, h('div', { style: 'flex:1;font-size:13px' }, `${def.name} ×${n}`), btn(glowenEl(Math.floor((def.price ?? 20) / 2), '+'), () => say(v.ops.sellConsumable(id as ConsumableId)), 'tiny')));
    }
    if (c.bag.length === 0) sell.appendChild(h('div', { class: 'dim-text' }, 'Your bag is empty.'));
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, buy, piece, sell));
  }

  function warpTab(el: HTMLElement): void {
    el.appendChild(h('div', { class: 'dim-text' }, 'Warp to any bonfire you have found in this playthrough.'));
    const list = h('div', { class: 'col', style: 'gap:6px;margin-top:8px' });
    for (const d of v.discovered) list.appendChild(btn(`${d.label}${d.used ? ' (embers)' : ' (fresh)'}${d.id === v.bonfireId ? ' — you are here' : ''}`, () => say(v.ops.warp(d.id)), '', d.id === v.bonfireId));
    el.appendChild(list);
  }

  function render(): void {
    // keep the pad / keyboard focus on the same control across a redraw (D142, D144); while a dialog has the focus,
    // remember the control that opened it so the focus goes back there when it closes
    const mark = markFocus(panel);
    if (mark) panelMark = mark;
    clearEl(panel);
    root.querySelectorAll('[data-tt]').forEach((x) => x.remove());
    modal?.remove();
    modal = null;
    const tabs = h('div', { class: 'tabs', 'data-focus-group': 'tabs' });
    const defs: { key: string; label: string; fn?: (el: HTMLElement) => void }[] = [
      { key: 'level', label: 'Level up', fn: levelTab },
      { key: 'gems', label: 'Gem bench', fn: gemsTab },
      { key: 'weapons', label: 'Weapons', fn: weaponsTab },
      { key: 'reinforce', label: 'Reinforce', fn: reinforceTab },
      { key: 'shop', label: 'Shop', fn: shopTab },
      { key: 'warp', label: 'Warp', fn: warpTab },
      // D229
      { key: 'bestiary', label: 'Bestiary', fn: (el: HTMLElement) => renderBestiary(el, v.char, render) },
      ...(v.extraTabs ?? []).map((t) => ({ key: t.label, label: t.label, fn: (el: HTMLElement) => t.render(el, render) })),
    ];
    for (const d of defs) {
      const b = btn(d.label, () => {
        tab = d.key;
        fuse = null;
        confirmSell = null;
        confirmGemSell = false;
        sellAsk = null;
        render();
      });
      if (tab === d.key) b.classList.add('on');
      b.setAttribute('data-tab', d.key);
      tabs.appendChild(b);
    }
    // the Inventory is the last stop of LB / RB (D145)
    const inv = btn('Inventory', () => leave(() => v.openInventory()));
    inv.setAttribute('data-tab', 'inventory');
    tabs.appendChild(inv);
    tabHints(tabs);
    tabs.appendChild(h('div', { class: 'grow' }));
    tabs.appendChild(btn('Leave', () => leave(() => v.close()), 'primary'));
    panel.appendChild(h('div', { class: 'row' }, h('h2', { class: 'grow', style: 'margin:0' }, 'Bonfire'), h('div', { class: 'good' }, v.firstRest ? 'You rest. HP and Thermos restored.' : 'You rest. HP and Thermos restored. Enemies have returned.')));
    panel.appendChild(tabs);
    const content = h('div', { style: 'flex:1;overflow:auto', 'data-focus-group': `tab-${tab}` });
    defs.find((d) => d.key === tab)?.fn?.(content);
    panel.appendChild(content);
    const box = confirmLeave ? leaveDialog() : tab === 'level' ? null : tab === 'gems' ? (fuseDialog() ?? gemSellAllDialog()) : tab === 'shop' ? (sellAskDialog() ?? sellAllDialog()) : tab === 'reinforce' ? reinforceDialog() : null;
    if (box) {
      // a layer of its own so the pad's focus stays inside the dialog
      modal = h('div', { class: 'layer dim', style: 'z-index:40' }, box);
      root.appendChild(modal);
      const m = modal;
      setTimeout(() => m.querySelector<HTMLElement>('button:not(:disabled)')?.focus(), 0);
    } else
      setTimeout(() => {
        // something chosen since the redraw keeps the focus: a late restore used to pull it back (D169)
        if (chosenFocus(panel)) return;
        // first open: the top-left control of the tab's content (D148)
        if (!restoreFocus(panel, panelMark) && !focusContentStart(panel, content)) panel.querySelector<HTMLElement>('.tabs button')?.focus();
      }, 0);
  }
  render();
  return root;
}
