// Bonfire menu (GAME_DESIGN §9.1): Level up · Respec · Gem bench · Shop · Warp (+ Spell loadout from M6).
import { CONSUMABLES } from '../../data/consumables';
import { renderBestiary } from '../bestiary';
import { CASTING_TOOLS } from '../../data/castingTools';
import { statBoosts } from '../../data/classes';
import { ESSENCES, MAX_REINFORCE, canPayEssence, essenceCounts, essenceDef, plusName, reinforceMult } from '../../data/essence';
import { SHIELDS, shieldStability, shieldValues } from '../../data/shields';
import { armorPieceDefense } from '../../data/armor';
import { canReinforce, reinforceInfo } from '../../game/items/reinforce';
import { CLASSES } from '../../data/classes';
import { GEMS, gemColor, gemKind, gemKindLabel, gemTitle, perkName, perkText } from '../../data/gems';
import { flaskHeal, levelCost, gemSellTotal, gemUpgradeCost } from '../../game/combat/formulas';
import { computeDerived } from '../../game/player/derived';
import { spellSkill, toolSpellSkill } from '../../game/skills/use';
import { ELEMENTS } from '../../game/elements';
import { canSocket, socketKind, fusePreview, gemAt, itemPlace, placeLabel, itemSellValue, planLevelUps, sellAllPreview, type FusePick, type GemLoc, type PendingPoints, type SellAllFilter } from '../../game/items/inventory';
import { shopConsumables, shopGemPrice, shopItemPrice } from '../../game/bonfire/shop';
import { DAMAGE_TYPES, type Character, type ConsumableId, type Gem, type GemTier, type Item, type StatId } from '../../game/types';
import { hasRarityBar, upgradeInfo } from '../../game/items/proficiency';
import { btn, chosenFocus, clearEl, fmt, focusContentStart, h, layer, markFocus, restoreFocus, toast, type FocusMark } from '../dom';
import { tabHints } from '../glyphs';
import { gemIcon, gemKindChip, gemPerkLines, gemTooltip, perkEffectEl, perkEffectsEl, glowenEl, itemIcon, itemScore, itemSummary, itemTooltip, staticTip } from '../tooltip';

export interface BonfireOps {
  levelUp(stat: StatId): string;
  respec(): string;
  socket(itemId: string, socketIdx: number, gemIdx: number): string;
  unsocket(itemId: string, socketIdx: number): string;
  /** upgrade one perk of a loose or socketed gem */
  upgradeGem(loc: GemLoc, perkIdx: number): string;
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
  /** which gem's per-perk upgrade list is open */
  let upOpen: string | null = null;
  /** the fuse dialog's state */
  let fuse: { orig: GemLoc; donor: number | null; picks: FusePick[] } | null = null;
  /** the Sell all confirmation */
  let confirmSell: SellAllFilter | null = null;
  let modal: HTMLElement | null = null;
  /** the item whose next reinforcement is being looked at (D216 / D220): its before → after and the cost, to confirm or back out of */
  let reinforceAsk: { itemId: string } | null = null;
  /** the respec question is open (D238) */
  let respecAsk = false;
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
    const askLeave = !fuse && !confirmSell && !confirmLeave && !reinforceAsk && !respecAsk && !sellAsk && pendingCount() > 0;
    if (!fuse && !confirmSell && !confirmLeave && !reinforceAsk && !respecAsk && !sellAsk && !askLeave) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (askLeave) confirmLeave = () => v.close();
    else if (confirmLeave) confirmLeave = null;
    fuse = null;
    confirmSell = null;
    reinforceAsk = null;
    respecAsk = false;
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
          h('div', { style: 'width:100px', title: CLASSES[c.classId]?.primary === s.id ? 'Primary: every point gives 25% more' : CLASSES[c.classId]?.secondary === s.id ? 'Secondary: every point gives 15% more' : '' }, s.label, CLASSES[c.classId]?.primary === s.id ? ' (P)' : CLASSES[c.classId]?.secondary === s.id ? ' (S)' : ''),
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
    left.appendChild(h('hr'));
    left.appendChild(
      h(
        'div',
        { class: 'row' },
        (() => {
          // asks first (D238): a Tear is rare and the old spread cannot be put back
          const b = btn(`Respec with a Tear of Undoing (${c.tears})`, () => {
            respecAsk = true;
            render();
          }, 'danger', c.tears <= 0);
          b.setAttribute('data-testid', 'respec');
          b.setAttribute('data-focus', 'respec');
          return b;
        })(),
        h('div', { class: 'small dim-text' }, 'Stats return to your class base; every point comes back to place freely.'),
      ),
    );
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

  /** "Respec?" before a Tear of Undoing is spent (D238). Back (or B / Escape) leaves everything as it was. */
  function respecDialog(): HTMLElement | null {
    if (!respecAsk) return null;
    const c = v.char;
    if (c.tears <= 0) {
      respecAsk = false;
      return null;
    }
    const count = pendingCount();
    const back = btn('Back', () => {
      respecAsk = false;
      render();
    });
    back.setAttribute('data-testid', 'respec-back');
    const yes = btn('Respec', () => {
      respecAsk = false;
      pending = {};
      say(v.ops.respec());
    }, 'danger');
    yes.setAttribute('data-testid', 'respec-confirm');
    return h(
      'div',
      { class: 'panel col', style: 'max-width:520px;gap:10px', 'data-testid': 'respec-dialog' },
      h('h2', { style: 'margin:0' }, 'Respec with a Tear of Undoing?'),
      h('div', null, `Every stat goes back to your class base and every point you placed comes back to place freely. It uses 1 Tear of Undoing (you have ${c.tears}).`),
      count ? h('div', { class: 'small bad' }, `Your ${count} planned point${count === 1 ? '' : 's'} not yet confirmed will be dropped.`) : null,
      // Back first, so a stray confirm press does not spend the Tear
      h('div', { class: 'row' }, back, yes),
    );
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

  /** The upgrade control: one button for a one-perk gem, a drop-down of perks for more. */
  function upgradeCtl(g: Gem, loc: GemLoc): HTMLElement {
    const c = v.char;
    if (g.perks.length === 1) {
      const p = g.perks[0]!;
      const cost = gemUpgradeCost(p.tier);
      const b = btn(p.tier >= 5 ? 'T5 (max)' : ['Upgrade ', glowenEl(cost)], () => say(v.ops.upgradeGem(loc, 0)), 'tiny', p.tier >= 5 || c.glowen < cost);
      b.title = p.tier >= 5 ? 'Already T5.' : `T${p.tier + 1}: ${perkText({ ...p, tier: (p.tier + 1) as GemTier })}`;
      b.setAttribute('data-testid', 'gem-upgrade');
      return b;
    }
    const key = locKey(loc);
    const b = btn(upOpen === key ? 'Upgrade ▴' : 'Upgrade ▾', () => {
      upOpen = upOpen === key ? null : key;
      render();
    }, 'tiny', g.perks.every((p) => p.tier >= 5));
    b.title = 'Each perk upgrades on its own.';
    b.setAttribute('data-testid', 'gem-upgrade');
    return b;
  }

  /** The per-perk upgrade list under a gem row (when open). */
  function perkUpgrades(g: Gem, loc: GemLoc): HTMLElement | null {
    if (g.perks.length < 2 || upOpen !== locKey(loc)) return null;
    const c = v.char;
    const row = h('div', { class: 'row wrap', style: 'gap:4px;padding:0 8px 6px 40px' });
    g.perks.forEach((p, i) => {
      const cost = gemUpgradeCost(p.tier);
      const b = btn(
        p.tier >= 5 ? [h('span', { style: `color:${GEMS[p.family].color}` }, GEMS[p.family].name), ' T5 (max)'] : [h('span', { style: `color:${GEMS[p.family].color}` }, GEMS[p.family].name), ` T${p.tier}→T${p.tier + 1} `, glowenEl(cost)],
        () => say(v.ops.upgradeGem(loc, i)),
        'tiny perk-up',
        p.tier >= 5 || c.glowen < cost,
      );
      b.setAttribute('data-testid', `perk-up-${i}`);
      b.title = p.tier >= 5 ? 'Already T5.' : `Now: ${perkText(p)}. T${p.tier + 1}: ${perkText({ ...p, tier: (p.tier + 1) as GemTier })}`;
      row.appendChild(b);
    });
    return row;
  }

  /** One gem on one line: icon, name + chip + effects, then its buttons. */
  function gemRow(g: Gem, loc: GemLoc, acts: (HTMLElement | null)[], testid: string): HTMLElement {
    const icon = h('span', { style: 'display:inline-flex;flex:none' }, gemIcon(g, 26));
    hoverTip(icon, () => gemTooltip(g));
    const main = h('div', { class: 'gem-main' }, gemNameEl(g), h('div', { class: 'small' }, perkEffectsEl(g)));
    const row = h('div', { class: 'gem-row', 'data-testid': testid }, icon, main, h('div', { class: 'gem-acts' }, ...acts));
    const sub = perkUpgrades(g, loc);
    return sub ? h('div', null, row, sub) : row;
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
      'Each +1 makes a weapon hit, a shield block or a piece of armour defend 20% better: +15 is four times the item. A step costs 1, then 2, then 3 Essence of one tier (6 a tier), a new tier every three levels, plus Glowen. One Essence of a higher tier pays for three of the tier below.',
      h('br'), h('br'),
      'None below zone 4 of the first descent; Tier 1 from zone 4, then one tier more each New Game+ (Tier 5 from New Game+4).');
    el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:20px' }, list, help));
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
    rows.push({ label: 'Strength', before: `×${reinforceMult(from).toFixed(1)}`, after: `×${reinforceMult(to).toFixed(1)}` });
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
          card.appendChild(gemRow(g, loc, [upgradeCtl(g, loc), fuseBtn(g, loc), btn('Remove', () => say(v.ops.unsocket(it.id, i)), 'tiny')], `socket-gem-${it.id}-${i}`));
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
    const sel = selItem ? items.find((i) => i.id === selItem) : null;
    // the socket picked, if it is still empty; else the first empty one
    const free = sel ? (selSocket >= 0 && selSocket < sel.sockets.length && !sel.sockets[selSocket] ? selSocket : sel.sockets.findIndex((x) => !x)) : -1;
    c.gems.forEach((g, gi) => {
      const loc: GemLoc = { gemIdx: gi };
      let sock: HTMLElement | null = null;
      if (sel && free >= 0) {
        const fits = canSocket(sel, g);
        sock = btn('Socket', () => say(v.ops.socket(sel.id, free, gi)), 'tiny', !fits);
        sock.title = fits ? `Into socket ${free + 1} of ${sel.name}` : `${sel.name} takes ${socketKind(sel) === 'armor' ? 'armor' : 'weapon'} gems.`;
      }
      const sell = btn(['Sell ', glowenEl(gemSellTotal(g), '+')], () => say(v.ops.sellGem(gi)), 'tiny');
      gems.appendChild(h('div', { class: 'card', style: 'padding:0' }, gemRow(g, loc, [sock, upgradeCtl(g, loc), sell, fuseBtn(g, loc)], `loose-gem-${gi}`)));
    });
    if (c.gems.length === 0) gems.appendChild(h('div', { class: 'dim-text' }, 'No loose gems.'));
    gems.appendChild(h('div', { class: 'small dim-text', style: 'margin-top:6px' }, 'Weapon gems fit weapon sockets, armor gems armor sockets. Upgrade any perk without unsocketing. Gems can also be removed from the inventory, anywhere. NG+ gems carry two or three perks; Fuse swaps perks between two gems of the same kind.'));
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
    const perkBtn = (g: Gem, from: 'orig' | 'donor', idx: number): HTMLElement => {
      const p = g.perks[idx]!;
      const on = f.picks.some((x) => x.from === from && x.idx === idx);
      const dup = !on && pickedFamilies.includes(p.family);
      const full = !on && f.picks.length >= n;
      const b = btn(
        [h('span', { class: 'tick' }, on ? '✓' : ''), h('span', { style: `color:${GEMS[p.family].color};width:120px` }, perkName(p)), h('span', { class: 'small' }, perkEffectEl(p))],
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
      upOpen = null;
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
      h('div', { class: 'small dim-text' }, 'Choose the perks the original gem keeps; the rest come from the other gem, which is destroyed. Tiers come with their perks.'),
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
    const all = btn(['Sell with the gems for ', glowenEl(itemSellValue(it), '+')], () => {
      sellAsk = null;
      say(v.ops.sellItem(it.id));
    }, 'danger');
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

  /** "Sell all": what goes, for how much, and a confirm. */
  function sellAllDialog(): HTMLElement | null {
    if (!confirmSell) return null;
    const def = SELL_ALL.find((s) => s.filter === confirmSell)!;
    const pv = sellAllPreview(v.char, def.filter);
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
      h('div', { class: 'small dim-text' }, 'Worn gear and your second weapon are never sold.'),
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
      }, 'tiny');
      sb.setAttribute('data-testid', `sell-${it.id}`);
      sb.setAttribute('data-focus', `sell-${it.id}`);
      const row = h('div', { class: 'row' }, itemIcon(it, 24), h('div', { class: `r-${it.rarity}`, style: 'flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, it.name), sb);
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
        respecAsk = false;
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
    const box = confirmLeave ? leaveDialog() : tab === 'level' ? respecDialog() : tab === 'gems' ? fuseDialog() : tab === 'shop' ? (sellAskDialog() ?? sellAllDialog()) : tab === 'reinforce' ? reinforceDialog() : null;
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
