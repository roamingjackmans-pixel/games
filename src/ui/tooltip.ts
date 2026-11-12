// Item tooltips (GAME_DESIGN §16): one organised, stacked layout for every item kind, side-by-side compare
// against what is worn in that slot (green better, white same, red worse), and small item icons.
import { WEAPONS } from '../data/weapons';
import { variantOf, weaponOf } from '../game/items/weaponOf';
import { SHIELDS, SHIELD_POISE, shieldStability, shieldValues } from '../data/shields';
import { CASTING_TOOLS } from '../data/castingTools';
import { RINGS, bandAmount, bandStat } from '../data/rings';
import { GEMS, GEM_QUALITIES, gemColor, gemLevel, gemKind, gemKindLabel, gemTitle, perkName, perkQuality, perkRollText, perkText } from '../data/gems';
import type { GemPerk } from '../game/types';
import { LEGENDARY_POWERS, LEGENDARY_FLAVOR } from '../data/legendaries';
import { SET_PERKS, SET_STEPS, setEffectText, setStep, type SetPerkDef } from '../data/setPerks';
import { affixText } from '../data/affixes';
import { armorPieceDefense, armorPiecePoise, parseArmorBase } from '../data/armor';
import { ELEMENTS } from '../game/elements';
import { baseInfo, itemRequirements, meetsRequirements, type Requirements } from '../game/items/bases';
import { defaultSlotFor, itemSellValue, WORN_SLOTS, type EquipSlot } from '../game/items/inventory';
import { STAT_CAP, reqAtIlvl, toolMult, weaponBase, weaponScaling, gradeDamageMult } from '../game/combat/formulas';
import { computeDerived } from '../game/player/derived';
import { toolSpellSkill } from '../game/skills/use';
import { itemUnlockedSkills } from '../game/items/weaponSkills';
import { effectiveSpellSkill, effectiveWeaponHit } from '../game/items/effectiveDamage';
import { LOAD_TIERS, LOAD_TIERS_ORDER, equipLoadWith, itemWeight, type EquipLoadInfo } from '../game/player/equipLoad';
import { drawShield, drawTool, drawWeapon, weaponGripBack } from '../engine/draw/weapons';
import { OUTLINE, poly } from '../engine/draw/parts';
import { drawArmorIcon } from './armorIcons';
import { DAMAGE_TYPES, type Character, type DamageType, type Gem, type Grade, type Item, type StatId, type Stats, type WeaponDef } from '../game/types';
import { fmt, h } from './dom';
import { shieldSpecials, weaponSpecials } from './itemSpecials';
import { RARITY_POWER } from '../data/proficiency';
import { plusName, reinforceDmgMult } from '../data/essence';

export const RARITY_LABEL: Record<string, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
export const RARITY_BORDER: Record<string, string> = { common: '#6a6a6a', uncommon: '#58d66a', rare: '#4aa3ff', epic: '#b06bff', legendary: '#ff9b2e' };
/** Glowen, the currency: a pale ghostly green ectoplasm. */
export const GLOWEN_COLOR = '#9dffcf';

export const STAT_LABEL: Record<StatId, string> = { hp: 'HP', endurance: 'Endurance', bonk: 'Bonk', slicey: 'Slicey', brain: 'Brain', prayer: 'Prayer' };
const ARMOR_SLOT_LABEL: Record<string, string> = { head: 'Helmet', body: 'Body Armor', legs: 'Legs' };
const SPEED_LABEL: Record<string, string> = { veryslow: 'Very slow', slow: 'Slow', mediumslow: 'Medium-slow', medium: 'Medium', fast: 'Fast', veryfast: 'Very fast' };
const SHIELD_SIZE_LABEL: Record<string, string> = { small: 'Small shield', medium: 'Medium shield', great: 'Greatshield' };
const GRADE_ORDER: Grade[] = ['-', 'E', 'D', 'C', 'B', 'A', 'S'];

/** "1,234G" with the G in Glowen's colour (never boxed). */
export function glowenEl(n: number, prefix = ''): HTMLElement {
  return h('span', { class: 'money' }, `${prefix}${fmt(n)}`, h('span', { class: 'glowen-g' }, 'G'));
}

function hashStr(s: string): number {
  let h0 = 0;
  for (let i = 0; i < s.length; i++) h0 = (h0 * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h0);
}

// ---------------------------------------------------------------- weapon fields, read defensively
// Hybrid weapons (Brain / Prayer grades and requirements) and a weapon's own damage type are optional fields
// that may or may not exist on WeaponDef yet; read them through these so this file compiles either way.

type HybridGrades = { bonk: Grade; slicey: Grade; brain?: Grade; prayer?: Grade };
type HybridReq = { bonk: number; slicey: number; brain?: number; prayer?: number };

function weaponGrades(w: WeaponDef): HybridGrades {
  return w.grades as HybridGrades;
}
function weaponElement(w: WeaponDef): DamageType {
  return (w as { element?: DamageType }).element ?? 'physical';
}

/**
 * Can this character use this item, as the game counts it (D210): its requirements (a hybrid's Brain / Prayer too)
 * against the stats with gear bonuses (+Bonk affixes, bands), two-handing for a weapon. The inventory's "!" and the
 * tooltip both ask this, so they never disagree with the damage the game deals.
 */
export function itemMeetsReqs(item: Item, c: Character, stats: Stats = computeDerived(c).stats): boolean {
  return meetsRequirements(reqsFor(item), stats, item.kind === 'weapon' ? c.twoHanded : false);
}

/** Requirements at the item's level, including a hybrid weapon's Brain / Prayer requirement. */
function reqsFor(item: Item): Requirements {
  const r = itemRequirements(item);
  const w = weaponOf(item);
  if (w) {
    const req = w.req as HybridReq;
    if (req.brain && !r.brain) r.brain = reqAtIlvl(req.brain, item.ilvl, false);
    if (req.prayer && !r.prayer) r.prayer = reqAtIlvl(req.prayer, item.ilvl, false);
  }
  return r;
}

/** Damage of one hit at ×1, split by damage type (holyPct converts part of it, as in combat). */
function weaponDamageByType(item: Item, stats: Stats, twoH: boolean, boost: Partial<Record<StatId, number>> = {}): Partial<Record<DamageType, number>> {
  const w = weaponOf(item);
  if (!w) return {};
  const meets = meetsRequirements(reqsFor(item), stats, twoH);
  const total = weaponBase(w.base1, item.ilvl) * weaponScaling(w, stats, twoH, boost) * gradeDamageMult(w) * (meets ? 1 : 0.4) * RARITY_POWER[item.rarity] * reinforceDmgMult(item.plus);
  const holy = w.holyPct ?? 0;
  const out: Partial<Record<DamageType, number>> = {};
  const el = weaponElement(w);
  out[el] = total * (1 - holy);
  if (holy) out.holy = (out.holy ?? 0) + total * holy;
  return out;
}

/** One number to compare two items of the same slot (damage, defense, block, tool power). */
export function itemScore(item: Item | null, stats: Stats, twoHanded: boolean): number {
  if (!item) return 0;
  const w = WEAPONS[item.baseId];
  if (w) return Object.values(weaponDamageByType(item, stats, twoHanded)).reduce((a, b) => a + (b ?? 0), 0);
  const s = SHIELDS[item.baseId];
  if (s) {
    const v = shieldValues(s, item.ilvl, item.plus, item.rarity);
    return v.physical * 100 + v.elemental * 50;
  }
  const t = CASTING_TOOLS[item.baseId];
  if (t) return toolMult(t.grade, item.ilvl) * RARITY_POWER[item.rarity] * reinforceDmgMult(item.plus) * 100;
  if (item.kind === 'armor') {
    const d = armorPieceDefense(item.baseId, item.ilvl, item.plus);
    return DAMAGE_TYPES.reduce((a, k) => a + d[k], 0);
  }
  return 0;
}

// ---------------------------------------------------------------- compare rows

type Better = 'higher' | 'lower' | 'none';
type Verdict = 'up' | 'same' | 'down';

interface Row {
  label: string;
  /** label colour (damage types) */
  color?: string | undefined;
  /** the hovered item's value; null = it has none */
  cur: number | null;
  /** the equipped item's value (compare mode only); null = nothing there */
  prev?: number | null;
  better: Better;
  fmt: (n: number) => string;
  /** class on the value (e.g. req-bad) */
  cls?: string;
  /** a small dim line under the row */
  note?: string;
  /** extra dim text after the value */
  after?: string | undefined;
}

function verdict(prev: number, cur: number, better: Better): Verdict {
  if (better === 'none' || Math.abs(cur - prev) < 1e-6) return 'same';
  return (better === 'higher' ? cur > prev : cur < prev) ? 'up' : 'down';
}

const DASH = '—';

/** Rows in a grid: label · - · value · → compared value. Values line up down the section. */
function rowsEl(rows: Row[], cmp: boolean, indent = true): HTMLElement {
  const g = h('div', { class: `tt-rows${indent ? '' : ' flat'}` });
  for (const r of rows) {
    const show = (v: number | null | undefined): string => (v === null || v === undefined ? DASH : r.fmt(v));
    g.appendChild(h('div', { class: 'lbl', style: r.color ? `color:${r.color}` : '' }, r.label));
    g.appendChild(h('div', { class: 'sep' }, '-'));
    if (cmp) {
      g.appendChild(h('div', { class: 'val' }, show(r.prev)));
      const v = verdict(r.prev ?? 0, r.cur ?? 0, r.better);
      g.appendChild(h('div', { class: 'cmp' }, h('span', { class: 'tt-arrow' }, '→ '), h('span', { class: `tt-${v} ${r.cls ?? ''}` }, show(r.cur)), r.after ? h('span', { class: 'dim-text' }, ` ${r.after}`) : null));
    } else {
      g.appendChild(h('div', { class: `val ${r.cls ?? ''}` }, show(r.cur), r.after ? h('span', { class: 'dim-text' }, ` ${r.after}`) : null));
      g.appendChild(h('div'));
    }
    if (r.note) g.appendChild(h('div', { class: 'note' }, r.note));
  }
  return g;
}

/** A weapon's or shield's special perks, each in words with its number (D171); nothing when it has none. */
function specialSection(out: (HTMLElement | null)[], lines: string[]): void {
  if (lines.length) out.push(section('Special', ...lines.map((l) => h('div', { class: 'tt-text good' }, l))));
}

function section(title: string, ...body: (HTMLElement | null)[]): HTMLElement {
  return h('div', { class: 'tt-section' }, h('div', { class: 'tt-sec' }, title), ...body);
}

/** "Light - Weight 1.8  → 1.5" */
function headLine(label: string, cur: number, prev: number | null | undefined, cmp: boolean): HTMLElement {
  const w = (n: number): string => n.toFixed(1);
  if (!cmp) return h('div', { class: 'tt-head' }, `${label} - Weight ${w(cur)}`);
  const v = verdict(prev ?? 0, cur, 'lower');
  return h('div', { class: 'tt-head' }, `${label} - Weight ${prev === null || prev === undefined ? DASH : w(prev)}`, h('span', { class: 'tt-arrow' }, '  → '), h('span', { class: `tt-${v}` }, w(cur)));
}

/** "Equip load - Medium 66% → Heavy 81%" (the right side coloured by the tier change). */
function loadLine(before: EquipLoadInfo, after: EquipLoadInfo): HTMLElement {
  const bi = LOAD_TIERS_ORDER.indexOf(before.tier);
  const ai = LOAD_TIERS_ORDER.indexOf(after.tier);
  const v: Verdict = ai < bi ? 'up' : ai > bi ? 'down' : 'same';
  const pct = (i: EquipLoadInfo): string => `${Math.round(i.frac * 100)}%`;
  return h(
    'div',
    { class: 'tt-rows flat' },
    h('div', { class: 'lbl' }, 'Equip load'),
    h('div', { class: 'sep' }, '-'),
    h('div', { class: 'val' }, h('span', { style: `color:${before.effects.color}` }, LOAD_TIERS[before.tier].label), h('span', { class: 'dim-text' }, ` ${pct(before)}`)),
    h('div', { class: 'cmp' }, h('span', { class: 'tt-arrow' }, '→ '), h('span', { class: `tt-${v}` }, LOAD_TIERS[after.tier].label), h('span', { class: 'dim-text' }, ` ${pct(after)}`)),
  );
}

const pct0 = (n: number): string => `${Math.round(n * 100)}%`;
const fmtS = (n: number): string => `${Number(n.toFixed(1))} s`;
const int0 = (n: number): string => String(Math.round(n));
const gradeOf = (n: number): string => (n <= 0 ? DASH : GRADE_ORDER[Math.round(n)] ?? DASH);
const gradeNum = (g: Grade | undefined): number => (g ? GRADE_ORDER.indexOf(g) : 0);

// ---------------------------------------------------------------- compare target

export function isEquipped(c: Character, item: Item): boolean {
  const e = c.equipment;
  return [...WORN_SLOTS.map((s) => e[s]), c.altMain, c.altOff].some((x) => x?.id === item.id);
}

type WornSlot = (typeof WORN_SLOTS)[number];

/** The slot a bag item would go into when clicked, and what is in it now (compare target). */
export function compareTargetFor(c: Character, item: Item): { slot: WornSlot; item: Item | null } | null {
  if (isEquipped(c, item)) return null;
  const s = defaultSlotFor(c, item) as EquipSlot | null;
  if (!s || s === 'altMain' || s === 'altOff') return null;
  return { slot: s, item: c.equipment[s] ?? null };
}

/**
 * One line saying what an item is: "Epic Longsword · Level 6 · Medium · 2 affixes · 1 socket".
 */
export function itemSummary(item: Item): string {
  const w = WEAPONS[item.baseId];
  const s = SHIELDS[item.baseId];
  const t = CASTING_TOOLS[item.baseId];
  const vw = variantOf(item)?.word;
  const cls = (w && vw ? `${vw} ${w.name}` : undefined) ?? w?.name ?? s?.name ?? t?.name ?? (item.kind === 'armor' ? (ARMOR_SLOT_LABEL[item.slot] ?? 'Armor') : item.kind === 'ring' ? 'Ring' : (baseInfo(item.baseId)?.name ?? item.kind));
  const sub = w ? (SPEED_LABEL[w.speedClass] ?? w.speedClass) : s ? (SHIELD_SIZE_LABEL[s.size] ?? 'Shield') : t ? (t.school === 'brain' ? 'Staff' : 'Talisman') : item.kind === 'armor' ? (parseArmorBase(item.baseId)?.set?.weight ?? 'cloth') : '';
  const parts = [`${RARITY_LABEL[item.rarity]} ${cls}`, `Level ${item.ilvl}`];
  if (sub) parts.push(sub[0]!.toUpperCase() + sub.slice(1));
  if (item.affixes.length) parts.push(`${item.affixes.length} affix${item.affixes.length === 1 ? '' : 'es'}`);
  if (item.sockets.length) parts.push(`${item.sockets.length} socket${item.sockets.length === 1 ? '' : 's'}`);
  if (item.legendaryPower) parts.push(LEGENDARY_POWERS[item.legendaryPower]?.name ?? 'Legendary power');
  if (item.setPerk && SET_PERKS[item.setPerk]) parts.push(`Set: ${SET_PERKS[item.setPerk]!.name}`);
  return parts.join(' · ');
}

/** A tooltip laid out in the page (a detail pane) instead of floating beside the pointer. */
export function staticTip(tt: HTMLElement): HTMLElement {
  tt.style.position = 'static';
  tt.style.width = '100%';
  tt.style.zIndex = 'auto';
  return tt;
}

/**
 * Tooltip for an item. `compare`:
 * - 'auto': compare against whatever is worn in the slot it would go into (nothing there compares against 0 / —);
 *   equipped items show plain values;
 * - an Item: compare against that item;
 * - null: no compare.
 */
export function itemTooltip(item: Item, c: Character, compare: Item | null | 'auto' = null): HTMLElement {
  const info = baseInfo(item.baseId);
  const d0 = computeDerived(c);
  const stats = d0.stats;
  const twoH = c.twoHanded;
  const target = compare === null ? null : compareTargetFor(c, item);
  const cmp = compare === 'auto' ? !!target : compare !== null && compare.id !== item.id;
  const other: Item | null = compare === 'auto' ? (target?.item ?? null) : cmp ? (compare as Item) : null;
  const req = reqsFor(item);
  const meets = itemMeetsReqs(item, c, stats);
  const out: (HTMLElement | null)[] = [];

  // ---- name and title line
  out.push(h('div', { class: `name r-${item.rarity}` }, plusName(item)));
  const w = weaponOf(item);
  const vnt = variantOf(item);
  const s = SHIELDS[item.baseId];
  const t = CASTING_TOOLS[item.baseId];
  const ring = RINGS[item.baseId];
  const armor = item.kind === 'armor' ? parseArmorBase(item.baseId) : null;
  const cls = (w ? `${vnt ? `${vnt.word} ` : ''}${w.name}` : undefined) ?? s?.name ?? t?.name ?? (item.kind === 'armor' ? (ARMOR_SLOT_LABEL[item.slot] ?? 'Armor') : item.kind === 'ring' ? 'Ring' : (info?.name ?? item.kind));
  out.push(h('div', { class: 'tt-title' }, `${RARITY_LABEL[item.rarity]} ${cls} - Level ${item.ilvl}`));
  if (cmp) out.push(h('div', { class: 'tt-vs' }, other ? ['Compared with your ', h('span', { class: `r-${other.rarity}` }, other.name)] : 'Nothing worn in this slot'));

  // ---- class - weight (and the equip load change if worn)
  const kindLabel = w
    ? (SPEED_LABEL[w.speedClass] ?? w.speedClass)
    : s
      ? (SHIELD_SIZE_LABEL[s.size] ?? 'Shield')
      : t
        ? t.school === 'brain'
          ? 'Staff (Brain)'
          : 'Talisman (Prayer)'
        : armor
          ? armor.set
            ? `${armor.set.weight[0]!.toUpperCase()}${armor.set.weight.slice(1)}`
            : 'Cloth'
          : 'Ring';
  out.push(headLine(kindLabel, itemWeight(item), other ? itemWeight(other) : null, cmp));
  if (cmp && target) {
    const swapped = computeDerived({ ...c, equipment: { ...c.equipment, [target.slot]: item } });
    out.push(loadLine(d0.load, equipLoadWith(c, swapped.stats.endurance, target.slot, item)));
  }

  // ---- per kind
  if (w) {
    const ow = other ? weaponOf(other) : undefined;
    // D294: what it would really deal in your hands, every perk counted (equipped on a copy of you)
    const mineHit = effectiveWeaponHit(c, item);
    const theirsHit = ow && other ? effectiveWeaponHit(c, other) : null;
    const mine = mineHit?.byType ?? {};
    const theirs = theirsHit?.byType ?? {};
    const types = DAMAGE_TYPES.filter((k) => (mine[k] ?? 0) > 0 || (cmp && (theirs[k] ?? 0) > 0));
    const dmgRows: Row[] = types.map((k) => ({ label: ELEMENTS[k].name, color: ELEMENTS[k].glow, cur: mine[k] ?? 0, prev: ow ? (theirs[k] ?? 0) : null, better: 'higher', fmt: int0 }));
    if (types.length > 1) dmgRows.push({ label: 'Total', cur: mineHit?.total ?? 0, prev: theirsHit ? theirsHit.total : ow ? 0 : null, better: 'higher', fmt: int0 });
    // D305: no damage-per-second row (owner's request); the per-hit numbers stay
    const dmgTitle = `${mineHit?.offHand ? 'Damage per bolt (off hand)' : 'Damage per hit'}${meets ? '' : ' (40%: below requirement)'}`;
    out.push(section(dmgTitle, rowsEl(dmgRows, cmp)));
    out.push(h('div', { class: 'small dim-text' }, 'With your stats, proficiency, gems, set perks and gear. Not timed buffs.'));

    const g = weaponGrades(w);
    const og = ow ? weaponGrades(ow) : null;
    const gradeRows: Row[] = [];
    for (const k of ['bonk', 'slicey', 'brain', 'prayer'] as const) {
      const mineG = g[k];
      const theirsG = og?.[k];
      const shown = k === 'bonk' || k === 'slicey' || (mineG && mineG !== '-') || (cmp && theirsG && theirsG !== '-');
      if (!shown) continue;
      gradeRows.push({ label: STAT_LABEL[k], cur: gradeNum(mineG), prev: og ? gradeNum(theirsG) : null, better: 'higher', fmt: gradeOf });
    }
    out.push(section('Scaling', rowsEl(gradeRows, cmp)));
    // D319: a scaling variant says what changed from its class
    if (vnt) out.push(h('div', { class: 'small dim-text' }, `${vnt.word}: a ${w.name} that scales differently${vnt.element ? ` and deals ${ELEMENTS[vnt.element].name}` : ''}.`));

    const reqEl = requirementsEl(req, stats, twoH, true);
    if (reqEl) out.push(reqEl);
    if (!meets) out.push(h('div', { class: 'small req-bad' }, 'Below requirement: 40% damage, skills locked.'));

    out.push(
      h(
        'div',
        { class: 'tt-section' },
        rowsEl(
          [
            { label: 'Stamina', cur: w.stamina, prev: ow ? ow.stamina : null, better: 'lower', fmt: int0, after: 'per swing' },
          ],
          cmp,
          false,
        ),
      ),
    );
    // D291: a crossbow goes in either hand
    if (w.eitherHand) out.push(h('div', { class: 'small dim-text' }, 'Either hand: in the off hand, the block button shoots it.'));

    // D244: no Poise row on weapon cards. Skills: only the ones this item has unlocked (none: no section)
    const skills = itemUnlockedSkills(item);
    if (skills.length)
      out.push(
        section(
          meets ? 'Skills' : 'Skills (locked: below requirement)',
          ...skills.map((k) =>
            h(
              'div',
              { class: 'tt-skill', 'data-testid': `tt-skill-${k.slot + 1}` },
              h('div', null, h('span', { class: 'dim-text' }, `Skill ${k.slot + 1} `), h('b', null, k.def.name), h('span', { class: 'dim-text' }, ` - ${fmtS(k.def.cooldownS)} cooldown, ${k.def.stamina} stamina`)),
              h('div', { class: 'tt-text small' }, k.def.description),
            ),
          ),
        ),
      );
    specialSection(out, weaponSpecials(w));
  }

  if (s) {
    const os = other ? SHIELDS[other.baseId] : undefined;
    const v = shieldValues(s, item.ilvl, item.plus, item.rarity);
    const ov = os && other ? shieldValues(os, other.ilvl, other.plus, other.rarity) : null;
    const pick = (x: { physical: number; elemental: number; holyVoid: number }, k: DamageType): number => (k === 'physical' ? x.physical : k === 'holy' || k === 'void' ? x.holyVoid : x.elemental);
    const half = meets ? 1 : 0.5;
    const otherMeets = !!(os && other && meetsRequirements(reqsFor(other), stats, false));
    const ohalf = otherMeets ? 1 : 0.5;
    out.push(section(meets ? 'Block' : 'Block (half: below requirement)', rowsEl(DAMAGE_TYPES.map((k) => ({ label: ELEMENTS[k].short, cur: pick(v, k) * half, prev: ov ? pick(ov, k) * ohalf : null, better: 'higher', fmt: pct0 })), cmp)));
    out.push(
      h(
        'div',
        { class: 'tt-section' },
        rowsEl(
          [
            { label: 'Stability', cur: shieldStability(s, item.plus, item.rarity), prev: os ? shieldStability(os, other?.plus, other?.rarity) : null, better: 'lower', fmt: int0, note: 'stamina lost per 100 damage blocked (lower is better)' },
            { label: 'Parry', cur: meets ? (s.parryS ?? 0) : 0, prev: os ? (otherMeets ? (os.parryS ?? 0) : 0) : null, better: 'higher', fmt: (x) => (x > 0 ? `${x.toFixed(2)} s` : 'none') },
            // D312: a held shield adds poise (not while two-handing)
            { label: 'Poise', cur: SHIELD_POISE[s.size] ?? 0, prev: os ? (SHIELD_POISE[os.size] ?? 0) : null, better: 'higher', fmt: (x) => `+${x}`, note: 'stagger threshold, % of your max HP' },
          ],
          cmp,
          false,
        ),
      ),
    );
    const reqEl = requirementsEl(req, stats, false, false);
    if (reqEl) out.push(reqEl);
    if (!meets) out.push(h('div', { class: 'small req-bad' }, 'Below requirement: half block, no parry.'));
    specialSection(out, shieldSpecials(s));
  }

  if (t) {
    const ot = other ? CASTING_TOOLS[other.baseId] : undefined;
    const statKey = t.school === 'brain' ? 'brain' : 'prayer';
    const mySkill = effectiveSpellSkill(c, item) ?? toolSpellSkill(item, stats, d0.statBoost);
    const rows: Row[] = [
      // Spell Skill (D182): what this tool makes of your Brain or Prayer; spells deal and heal Spell Skill / 100 times their listed amounts
      // D294: with you holding it: proficiency and set perks too (falls back to the tool on its own)
      { label: 'Spell Skill', cur: mySkill, prev: ot && other ? (effectiveSpellSkill(c, other) ?? toolSpellSkill(other, stats, d0.statBoost)) : null, better: 'higher', fmt: int0, note: `${STAT_LABEL[statKey]} ${t.gradeLetter} scaling · spells do ×${(mySkill / 100).toFixed(2)}` },
      { label: 'Cast speed', cur: t.castSpeed, prev: ot ? ot.castSpeed : null, better: 'higher', fmt: (x) => `×${x.toFixed(2)}` },
    ];
    if (t.bonus) {
      const key = t.bonus.heals ? 'heals' : (t.bonus.element ?? '');
      const label = t.bonus.heals ? 'Healing' : t.bonus.element ? `${ELEMENTS[t.bonus.element].name} spells` : 'Spells';
      const ob = ot?.bonus && (ot.bonus.heals ? 'heals' : (ot.bonus.element ?? '')) === key ? ot.bonus.pct : 0;
      rows.push({ label, color: t.bonus.element ? ELEMENTS[t.bonus.element].glow : undefined, cur: t.bonus.pct, prev: ot ? ob : null, better: 'higher', fmt: (x) => `+${Math.round(x * 100)}%` });
    }
    out.push(section(t.school === 'brain' ? 'Brain spells' : 'Prayer spells', rowsEl(rows, cmp)));
    const otherGrade = ot && ot.school === t.school ? gradeNum(ot.gradeLetter) : 0;
    out.push(section('Scaling', rowsEl([{ label: STAT_LABEL[statKey], cur: gradeNum(t.gradeLetter), prev: ot ? otherGrade : null, better: 'higher', fmt: gradeOf }], cmp)));
    const reqEl = requirementsEl(req, stats, false, false);
    if (reqEl) out.push(reqEl);
    if (!meets) out.push(h('div', { class: 'small req-bad' }, 'Below requirement: cannot cast.'));
  }

  if (armor) {
    const def = armorPieceDefense(item.baseId, item.ilvl, item.plus);
    const odef = other && other.kind === 'armor' ? armorPieceDefense(other.baseId, other.ilvl, other.plus) : null;
    out.push(section('Defense', rowsEl(DAMAGE_TYPES.map((k) => ({ label: ELEMENTS[k].short, cur: def[k], prev: odef ? odef[k] : null, better: 'higher', fmt: int0 })), cmp)));
    // D312: armour adds poise, heavy the most
    const po = armorPiecePoise(item.baseId);
    const opo = other && other.kind === 'armor' ? armorPiecePoise(other.baseId) : null;
    out.push(h('div', { class: 'tt-section' }, rowsEl([{ label: 'Poise', cur: po, prev: opo, better: 'higher', fmt: (x) => `+${x}`, note: 'stagger threshold, % of your max HP' }], cmp, false)));
  }

  if (ring) {
    out.push(section('Effect', h('div', { class: 'tt-text' }, ringEffect(item))));
    if (cmp && other && RINGS[other.baseId]) out.push(h('div', { class: 'tt-vs' }, 'Replaces ', h('span', { class: `r-${other.rarity}` }, other.name), `: ${ringEffect(other)}`));
  }

  // ---- affixes, sockets, legendary power: each in its own section
  if (item.affixes.length) out.push(section('Affixes', ...item.affixes.map((a) => h('div', { class: 'tt-text good' }, affixText(a.id, a.value)))));
  if (item.sockets.length) {
    out.push(
      section(
        'Sockets',
        ...item.sockets.map((g, i) =>
          g
            ? h('div', { class: 'tt-text' }, ...g.perks.map((p, j) => h('div', null, h('span', { style: `color:${GEMS[p.family].color}` }, `${j === 0 ? '◆' : '+'} ${perkName(p)}`), ': ', perkEffectEl(p))))
            : h('div', { class: 'tt-text dim-text' }, `◇ Empty socket ${i + 1} (${item.kind === 'armor' ? 'armor' : 'weapon'} gems)`),
        ),
      ),
    );
  }
  if (item.legendaryPower) {
    const lp = LEGENDARY_POWERS[item.legendaryPower];
    if (lp) out.push(section('Legendary power', h('div', { class: 'tt-text r-legendary' }, `${lp.name}: ${lp.text}`)));
  }
  // its set perk (D243): the three steps, the one reached lit, and how many you wear
  const sp = item.setPerk ? SET_PERKS[item.setPerk] : undefined;
  if (sp) out.push(setPerkSection(sp, d0.setCounts[sp.id] ?? 0));
  // D244: no Experience section on item cards (the bar is on the bonfire's Weapons tab, D178)

  // ---- footer: flavour left, sell value right
  const flavor = item.rarity === 'legendary' ? LEGENDARY_FLAVOR[hashStr(item.name) % LEGENDARY_FLAVOR.length]! : (info?.flavor ?? '');
  out.push(h('div', { class: 'tt-foot' }, h('div', { class: 'flavor' }, flavor), glowenEl(itemSellValue(item))));
  return h('div', { class: 'tooltip' }, ...out);
}

/** Requirements stacked one per stat; unmet ones red with what you have. */
function requirementsEl(req: Requirements, stats: Stats, twoH: boolean, weapon: boolean): HTMLElement | null {
  const rows: Row[] = [];
  for (const key of ['bonk', 'slicey', 'brain', 'prayer'] as const) {
    if (!req[key]) continue;
    const have = key === 'bonk' && weapon && twoH ? Math.min(STAT_CAP, Math.floor(stats.bonk * 1.5)) : stats[key];
    const ok = have >= req[key];
    rows.push({ label: STAT_LABEL[key], cur: req[key], better: 'none', fmt: int0, cls: ok ? '' : 'req-bad', after: ok ? undefined : `(you have ${have})` });
  }
  if (!rows.length) return null;
  return section('Requirements', rowsEl(rows, false));
}

/** A ring's effect; the stat bands say exactly what this rarity gives. */
function ringEffect(item: Item): string {
  const r = RINGS[item.baseId];
  if (!r) return '';
  const stat = bandStat(item.baseId);
  if (stat) return `+${bandAmount(item.rarity)} ${STAT_LABEL[stat]}.`;
  return r.effect;
}

/** A small "Weapon gem" / "Armor gem" chip. */
export function gemKindChip(g: Gem): HTMLElement {
  const armor = gemKind(g) === 'armor';
  return h('span', { class: `gem-chip ${armor ? 'gem-armor' : 'gem-weapon'}`, 'data-testid': 'gem-kind' }, gemKindLabel(g));
}

/** What a perk does, in its quality colour (Green, Blue, Purple, Orange), its roll beside it (D197). */
export function perkEffectEl(p: GemPerk): HTMLElement {
  const qd = perkQuality(p);
  return h('span', { style: `color:${qd.color}`, title: `${perkRollText(p)} of its level value` }, perkText(p), h('span', { class: 'dim-text', style: 'font-size:.85em' }, ` (${perkRollText(p)})`));
}

/** Perks' effects side by side, " · " between. */
export function perkEffectsEl(g: Gem): HTMLElement {
  const el = h('span', null);
  g.perks.forEach((p, i) => {
    if (i) el.append(' · ');
    el.appendChild(perkEffectEl(p));
  });
  return el;
}

/** One line per perk: name (level, family colour) and what it does (quality colour). */
export function gemPerkLines(g: Gem): HTMLElement[] {
  return g.perks.map((p) => h('div', { class: 'small' }, h('span', { style: `color:${GEMS[p.family].color}` }, perkName(p)), ' ', perkEffectEl(p)));
}

export function gemTooltip(g: Gem): HTMLElement {
  return h(
    'div',
    { class: 'tooltip' },
    h('div', { class: 'name', style: `color:${gemColor(g)}` }, gemTitle(g)),
    h('div', null, gemKindChip(g)),
    ...gemPerkLines(g),
    h('div', { class: 'small dim-text' }, gemKind(g) === 'armor' ? 'Armor sockets only.' : 'Weapon sockets only.', g.perks.length > 1 ? ' Each perk upgrades on its own.' : ''),
    h('div', { class: 'small dim-text' }, 'Rolls: ', ...GEM_QUALITIES.flatMap((qd, i) => [i ? ' · ' : '', h('span', { style: `color:${qd.color}` }, qd.label)]), ' (−50% … +50%). Level 1–50: ×0.25 … ×3.'),
  );
}

/** Draw a small icon for an item into a canvas. */
/** Rough drawn length of each weapon (grip at 0 → tip), for fitting icons. */
const WEAPON_ICON_LEN: Record<string, number> = { w_bow: 60, w_crossbow: 56, w_spear: 120, w_halberd: 118, w_dawn_glaive: 118, w_colossal: 88, w_greathammer: 66, w_hollow_maul: 66, w_whip: 90, w_greataxe: 66, w_longsword: 78, w_spellblade: 78, w_katana: 76, w_rapier: 74, w_chakram: 30 };

export function itemIcon(item: Item | null, size = 40): HTMLCanvasElement {
  const c = h('canvas', { width: size, height: size });
  if (!item) return c;
  const ctx = c.getContext('2d')!;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  const s = size / 44;
  ctx.scale(s, s);
  const w = WEAPONS[item.baseId];
  if (w) {
    // fit the whole weapon diagonally: long ones (bows, spears, halberds) are scaled down to the icon
    const len = WEAPON_ICON_LEN[w.draw] ?? 70;
    const k = Math.min(0.62, 52 / len);
    ctx.rotate(-Math.PI / 4);
    ctx.translate((-len * k) / 2, 0);
    ctx.scale(k, k);
    ctx.translate(weaponGripBack(w.draw), 0); // a polearm held up its shaft is drawn back from the hand
    drawWeapon(ctx, w.draw, 0, item.rarity === 'legendary' ? item.name : undefined);
  } else if (SHIELDS[item.baseId]) {
    ctx.scale(0.9, 0.9);
    drawShield(ctx, SHIELDS[item.baseId]!.draw);
  } else if (CASTING_TOOLS[item.baseId]) {
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-18, 0);
    ctx.scale(0.7, 0.7);
    drawTool(ctx, CASTING_TOOLS[item.baseId]!.draw, 0);
  } else if (item.kind === 'ring') {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.stroke();
    poly(ctx, [0, -14, 5, -8, 0, -4, -5, -8], '#9ad0ff', OUTLINE, 1.5);
  } else {
    const p = parseArmorBase(item.baseId);
    drawArmorIcon(ctx, item.slot === 'head' || item.slot === 'body' ? item.slot : 'legs', p?.set ?? null);
  }
  ctx.restore();
  return c;
}

export function gemIcon(g: Gem, size = 28): HTMLCanvasElement {
  const c = h('canvas', { width: size, height: size });
  const ctx = c.getContext('2d')!;
  const m = size / 2;
  const n = g.perks.length;
  // a cut gem split into one facet per perk (left to right), each in its perk's colour
  const pts = [m, 3, size - 4, m, m, size - 3, 4, m];
  if (n <= 1) poly(ctx, pts, gemColor(g), OUTLINE, 2);
  else {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0]!, pts[1]!);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
    ctx.closePath();
    ctx.clip();
    const w = (size - 8) / n;
    g.perks.forEach((p, i) => {
      ctx.fillStyle = GEMS[p.family].color;
      ctx.fillRect(4 + i * w, 0, w + 0.5, size);
    });
    ctx.restore();
    poly(ctx, pts, 'rgba(0,0,0,0)', OUTLINE, 2);
  }
  // the level on a one-perk gem (D284: was its tier); a multi-perk gem's facets say enough at icon size
  if (n <= 1 || size >= 40) {
    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.round(size * (n > 1 ? 0.24 : 0.3))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(gemLevel(g)), m, m + size * 0.11);
  }
  return c;
}

/** A set perk on a card (D243): its playstyle, how many pieces you wear, and each step, the one reached lit. */
export function setPerkSection(sp: SetPerkDef, worn: number): HTMLElement {
  const step = setStep(worn);
  const rows = SET_STEPS.map((n, i) =>
    h(
      'div',
      { class: `tt-text ${step === i + 1 ? '' : 'dim-text'}`, style: step === i + 1 ? `color:${sp.color}` : '' },
      h('b', null, `${n}: `),
      setEffectText(sp.steps[i]!),
    ),
  );
  return section(`Set perk · ${sp.name}`, h('div', { class: 'tt-text', style: `color:${sp.color}` }, `${sp.style} · you wear ${worn} / 7`), ...rows);
}
