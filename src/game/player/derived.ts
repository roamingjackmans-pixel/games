// Derived player numbers from stats + equipment + affixes + gems + rings + legendary powers.
// Recomputed on every equipment, stat or two-hand change. Never stored.
import { WEAPONS } from '../../data/weapons';
import { armorPiecePoise } from '../../data/armor';
import { SHIELD_POISE } from '../../data/shields';
import { SHIELDS, shieldStability, shieldValues } from '../../data/shields';
import { CASTING_TOOLS, toolBash } from '../../data/castingTools';
import { armorPieceDefense } from '../../data/armor';
import { AFFIXES, affixBuildup } from '../../data/affixes';
import { SET_PERKS, setStep } from '../../data/setPerks';
import { GEMS, gemBuildup, perkValue } from '../../data/gems';
import { RINGS, ballastPoise, bandAmount, bandStat } from '../../data/rings';
import { castMoveMult, slickCast, dodgeRecharge, itemSkillCount, maxHP, maxStamina, scalingMult, staminaRegen, toolMult, weaponBase } from '../combat/formulas';
import { itemRequirements, meetsRequirements } from '../items/bases';
import { equipLoadOf, type EquipLoadInfo } from './equipLoad';
import type { CastingToolDef, Character, DamageType, Item, ShieldDef, StatId, StatusId, Stats, WeaponDef } from '../types';
import { statBoosts } from '../../data/classes';
import { DAMAGE_TYPES } from '../types';
import { RARITY_POWER } from '../../data/proficiency';
import { reinforceDmgMult } from '../../data/essence';
import { profBonuses } from '../items/proficiency';

export interface Derived {
  stats: Stats;
  maxHp: number;
  maxStam: number;
  regen: number;
  walk: number;
  twoHanded: boolean;
  weapon: WeaponDef;
  weaponItem: Item | null;
  weaponIlvl: number;
  weaponMeetsReq: boolean;
  skillsUnlocked: number;
  /** base(ilvl) × scaling — multiply by a swing's mult and dmgMult */
  weaponPower: number;
  /** a weapon held in the off hand (D291: a crossbow), shot with the block button; null when two-handing */
  offWeapon: { def: WeaponDef; item: Item; power: number; meetsReq: boolean } | null;
  dmgPct: number;
  flat: Partial<Record<DamageType, number>>;
  convert: { type: DamageType; pct: number }[];
  /** D283: gem damage added on top of the hit as another type (a share of the base hit; the physical stays) */
  addDmg: { type: DamageType; pct: number }[];
  statusBuild: { id: StatusId; buildup: number }[];
  attackSpeed: number;
  castSpeed: number;
  /** walking speed while casting a spell (D106: 50%, up to about 70% with Bonk) */
  castMoveMult: number;
  cdr: number;
  dodgeRecharge: number;
  stamCost: number;
  lifesteal: number;
  poiseDmgMult: number;
  /** the class's boost to each stat's benefit (D184): primary 1.25, secondary 1.15 */
  statBoost: Record<StatId, number>;
  /** weapon reach (swing range and the drawn blade), from proficiency (D178) */
  reachMult: number;
  /** spell cooldown reduction and spell power, from proficiency (D178) */
  spellCdr: number;
  spellPowerPct: number;
  defense: Record<DamageType, number>;
  defensePct: Partial<Record<DamageType, number>>;
  offKind: 'shield' | 'staff' | 'talisman' | null;
  shield: ShieldDef | null;
  shieldIlvl: number;
  shieldVals: { physical: number; elemental: number; holyVoid: number };
  /** seconds added to a shield's parry window by Small Shield proficiency (D215) */
  parryBonusS: number;
  /** stamina per 100 blocked: the shield's stability, less for a reinforced shield (D198) */
  shieldStability: number;
  shieldMeetsReq: boolean;
  stabilityMult: number;
  /** the casting tool keys 1–3 cast with: the one in the weapon hand if it holds one, else the off hand's (D117) */
  tool: CastingToolDef | null;
  toolIlvl: number;
  toolMeetsReq: boolean;
  toolMult: number;
  /** a staff or talisman held in the weapon hand (its light attack is `weapon`, a bash) */
  mainTool: HeldTool | null;
  /** a staff or talisman in the off hand (null while two-handing) */
  offTool: HeldTool | null;
  /** the school keys 1–3 cast (the off-hand tool's), and the school Q/E/R cast (the weapon-hand tool's), D201 */
  spellKeys: SpellSchool | null;
  skillKeySchool: SpellSchool | null;
  shardFind: number;
  glowenFind: number;
  gemFind: number;
  reviveBonus: number;
  flaskBonus: number;
  powers: Set<string>;
  rings: Set<string>;
  /** how many of each ring are worn (D227: every copy counts) */
  ringCounts: Record<string, number>;
  /** worn pieces per set perk, counting only gear whose requirements you meet (D243) */
  setCounts: Record<string, number>;
  maxHpMult: number;
  poiseThresholdPct: number;
  /** D312: your poise: a hit staggers you only if it deals at least this % of your max HP (8 + armour + a held shield) */
  poise: number;
  staminaRegenMult: number;
  canBlock: boolean;
  redTakenMult: number;
  /** equip load and its tier (D82); `walk` already includes the tier's speed */
  load: EquipLoadInfo;
}

export type SpellSchool = 'brain' | 'prayer';

export interface HeldTool {
  def: CastingToolDef;
  item: Item;
  hand: 'main' | 'off';
  ilvl: number;
  meetsReq: boolean;
  mult: number;
}

/** The tool that casts spells of `school`: the weapon hand's if it is of that school, else the off hand's. */
/**
 * One weapon hit by damage type for these derived stats (D294): weaponSpec deals it and the item cards show it, so
 * they never disagree. `holyBuffPct` is a timed buff's holy share (none on a card).
 */
export function weaponHitByType(d: Pick<Derived, 'offWeapon' | 'weapon' | 'weaponPower' | 'dmgPct' | 'convert' | 'addDmg' | 'flat'>, mult: number, offHand = false, holyBuffPct = 0): Partial<Record<DamageType, number>> {
  const ow = offHand ? d.offWeapon : null;
  const wdef = ow?.def ?? d.weapon;
  const base = (ow?.power ?? d.weaponPower) * mult * (1 + d.dmgPct);
  // a hybrid weapon's base damage is its own type (D80); a weapon's holy share comes out of it
  const own: DamageType = wdef.element ?? 'physical';
  const dmg: Partial<Record<DamageType, number>> = {};
  let ownLeft = base;
  // conversions never take more than all of it
  const convTotal = d.convert.reduce((t, c) => t + c.pct, 0);
  const convScale = convTotal > 1 ? 1 / convTotal : 1;
  for (const c of d.convert) {
    const amt = base * c.pct * convScale;
    ownLeft -= amt;
    dmg[c.type] = (dmg[c.type] ?? 0) + amt;
  }
  dmg[own] = (dmg[own] ?? 0) + Math.max(0, ownLeft);
  // D283: Ember, Rime, Storm, Dawn and Dusk add their share on top as their own type (they used to take it from the base)
  for (const a of d.addDmg) dmg[a.type] = (dmg[a.type] ?? 0) + base * a.pct;
  if (holyBuffPct > 0) dmg.holy = (dmg.holy ?? 0) + base * holyBuffPct;
  for (const t of DAMAGE_TYPES) {
    const f = d.flat[t];
    if (f) dmg[t] = (dmg[t] ?? 0) + f * mult;
  }
  return dmg;
}

export function toolForSchool(d: Pick<Derived, 'mainTool' | 'offTool'>, school: SpellSchool): HeldTool | null {
  if (d.mainTool?.def.school === school) return d.mainTool;
  if (d.offTool?.def.school === school) return d.offTool;
  return null;
}

const FIST: WeaponDef = {
  id: 'fists',
  name: 'Fists',
  weight: 0,
  grades: { bonk: 'E', slicey: 'E' },
  req: { bonk: 0, slicey: 0 },
  speedClass: 'fast',
  combo: [
    { windupMs: 180, activeMs: 80, recoverMs: 200, mult: 1, hitbox: { shape: 'arc', angleDeg: 70, r: 55 }, step: 8 },
    { windupMs: 180, activeMs: 80, recoverMs: 260, mult: 1.1, hitbox: { shape: 'arc', angleDeg: 70, r: 55 }, step: 8 },
  ],
  base1: 14,
  stamina: 8,
  poiseDmg: 8,
  reviveValue: 1,
  skills: ['', '', ''],
  flavor: 'Two of them. Free.',
  draw: 'w_fists',
  legendaryNames: [],
};

/** Everyone's poise before gear (D312): a hit of 8% of your max HP staggers you. */
export const BASE_POISE = 8;

function itemsOf(c: Character): Item[] {
  const e = c.equipment;
  return [e.main, e.off, e.head, e.body, e.legs, e.ring1, e.ring2, e.ring3, e.ring4].filter((x): x is Item => !!x);
}

/** A weapon in the off hand (D291): its own damage, from its own base, scaling, rarity and reinforcement. */
function offWeaponOf(off: Item | null | undefined, twoHanded: boolean, stats: Stats, boost: ReturnType<typeof statBoosts>): Derived['offWeapon'] {
  const def = off && off.kind === 'weapon' ? WEAPONS[off.baseId] : undefined;
  if (!off || !def?.eitherHand || twoHanded) return null;
  const meetsReq = meetsRequirements(itemRequirements(off), stats, false);
  const power = weaponBase(def.base1, off.ilvl) * scalingMult(def.grades, stats, false, boost) * (meetsReq ? 1 : 0.4) * RARITY_POWER[off.rarity] * reinforceDmgMult(off.plus);
  return { def, item: off, power, meetsReq };
}

export function computeDerived(c: Character): Derived {
  // gear you lack the stats for still works at reduced efficacy, but none of its buffs apply (D88): affixes,
  // gems, bands, ring effects and legendary powers come only from items whose requirements you meet
  // (checked against your own stats, so a stat affix cannot lift you over its own requirement)
  const items = itemsOf(c).filter((it) => meetsRequirements(itemRequirements(it), c.stats, it.kind === 'weapon' ? c.twoHanded : false));
  // ---- stat bonuses (affixes "of the X", bands) ----
  const stats: Stats = { ...c.stats };
  for (const it of items) {
    for (const a of it.affixes) {
      const def = AFFIXES[a.id];
      if (def?.stat) stats[def.stat] += Math.round(a.value);
    }
    if (it.kind === 'ring') {
      const s = bandStat(it.baseId);
      if (s) stats[s] += bandAmount(it.rarity);
    }
  }
  const powers = new Set<string>();
  const rings = new Set<string>();
  const ringCounts: Record<string, number> = {};
  for (const it of items) {
    if (it.legendaryPower) powers.add(it.legendaryPower);
    if (it.kind === 'ring' && RINGS[it.baseId]) {
      rings.add(it.baseId);
      ringCounts[it.baseId] = (ringCounts[it.baseId] ?? 0) + 1;
    }
  }

  const main = c.equipment.main;
  // a staff or talisman may be held in the weapon hand (D117): it swings as a bash and still casts
  const mainToolDef = main ? (CASTING_TOOLS[main.baseId] ?? null) : null;
  const weapon = main ? (WEAPONS[main.baseId] ?? (mainToolDef ? toolBash(mainToolDef) : FIST)) : FIST;
  const weaponIlvl = main?.ilvl ?? 1;
  const off = c.equipment.off;
  const shield = off ? (SHIELDS[off.baseId] ?? null) : null;
  const tool = off ? (CASTING_TOOLS[off.baseId] ?? null) : null;
  const twoHanded = c.twoHanded;
  // D312: poise from armour pieces and a held shield
  const poise =
    BASE_POISE +
    (['head', 'body', 'legs'] as const).reduce((s, sl) => s + (c.equipment[sl] ? armorPiecePoise(c.equipment[sl]!.baseId) : 0), 0) +
    (shield && !twoHanded ? (SHIELD_POISE[shield.size] ?? 0) : 0);
  const weaponMeetsReq = main ? meetsRequirements(itemRequirements(main), stats, twoHanded) : true;
  const held = (def: CastingToolDef | null, item: Item | null, hand: 'main' | 'off'): HeldTool | null =>
    def && item ? { def, item, hand, ilvl: item.ilvl, meetsReq: meetsRequirements(itemRequirements(item), stats, false), mult: toolMult(def.grade, item.ilvl) * RARITY_POWER[item.rarity] * reinforceDmgMult(item.plus) } : null; // D227: reinforcement too
  // two-handing sets the off hand aside but a tool in the weapon hand still casts (held in both hands)
  const mainTool = held(mainToolDef, main, 'main');
  const offTool = twoHanded ? null : held(tool, off, 'off');
  // which keys cast (D201): a staff or talisman in the weapon hand casts on the weapon-skill keys (Q/E/R), as its
  // skills; one in the off hand casts on 1/2/3. A staff and a talisman together: six spells on six keys.
  const castTool = mainTool ?? offTool;
  const skillKeySchool = mainTool ? mainTool.def.school : null;
  const spellKeys = offTool && offTool.def.school !== skillKeySchool ? offTool.def.school : null;

  let dmgPct = 0;
  const flat: Partial<Record<DamageType, number>> = {};
  const convert: { type: DamageType; pct: number }[] = [];
  const addDmg: { type: DamageType; pct: number }[] = [];
  const statusBuild: { id: StatusId; buildup: number }[] = [];
  let attackSpeedPct = 0;
  let castSpeedPct = 0;
  let cdrPct = 0;
  let dodgeRed = 0;
  let stamCostPct = 0;
  let lifesteal = 0;
  let poisePct = 0;
  let shardFind = 0;
  let glowenFind = 0;
  let gemFind = 0;
  let reviveBonus = 0;
  let flaskBonus = 0;
  /** D313: poise from rings, affixes and set perks, on top of armour and shield (D312) */
  let poiseBonus = 0;
  let hpFlat = 0;
  /** Hearth gems (D260): a share of max HP */
  let hpPctGem = 0;
  let stamFlat = 0;
  let defAll = 0;
  const defPct: Partial<Record<DamageType, number>> = {};
  let stabilityRed = 0;
  let elemBlockBonus = 0;
  let maxHpMult = 1;
  let regenMult = 1;
  let redTakenMult = 1;

  if (weapon.bleed) statusBuild.push({ id: 'bleed', buildup: weapon.bleed });
  if (weapon.holyPct) convert.push({ type: 'holy', pct: weapon.holyPct });

  for (const it of items) {
    for (const a of it.affixes) {
      const def = AFFIXES[a.id];
      if (!def) continue;
      const v = a.value;
      const isWeapon = it.kind === 'weapon';
      switch (a.id) {
        case 'brutal':
          dmgPct += v / 100;
          break;
        case 'heavy':
          flat.physical = (flat.physical ?? 0) + v;
          break;
        case 'burning':
        case 'freezing':
        case 'shocking':
        case 'radiant':
        case 'dusky':
          if (def.element) flat[def.element] = (flat[def.element] ?? 0) + v;
          if (def.status) statusBuild.push({ id: def.status, buildup: affixBuildup(a.id, v, it.ilvl) });
          break;
        case 'swift':
          attackSpeedPct += v / 100;
          break;
        case 'hasty':
          cdrPct += v / 100;
          break;
        case 'fleet':
          dodgeRed += v;
          break;
        case 'ballasted':
          poiseBonus += v;
          break;
        case 'frugal':
          stamCostPct += v / 100;
          break;
        case 'leeching':
          if (isWeapon) lifesteal += v / 100;
          break;
        case 'crushing':
          poisePct += v / 100;
          break;
        case 'warded':
          defAll += v;
          break;
        case 'hearty':
          hpFlat += v;
          break;
        case 'enduring':
          stamFlat += v;
          break;
        case 'lucky':
          shardFind += v / 100;
          break;
        case 'glowing':
          glowenFind += v / 100;
          break;
        case 'medic':
          reviveBonus += v;
          break;
        case 'steadfast':
          stabilityRed += v / 100;
          break;
        case 'reflective':
          elemBlockBonus += v / 100;
          break;
        default:
          if (def.defType) defPct[def.defType] = (defPct[def.defType] ?? 0) + v / 100;
      }
    }
    // every perk of every socketed gem counts; armor perks work in armor, weapon perks in weapons
    for (const g of it.sockets) for (const pk of g?.perks ?? []) {
      const gd = GEMS[pk.family];
      if (!gd) continue;
      const v = perkValue(pk);
      // D227: a shield's sockets take armour gems, a staff's or talisman's weapon gems
      if (it.kind === 'armor' || it.kind === 'shield') {
        if (!gd.armorOnly) continue;
        if (pk.family === 'bulwark') defAll += v;
        else if (pk.family === 'hearth') hpPctGem += v / 100; // D260: a share of max HP
        else if (pk.family === 'zephyr') regenMult += v / 100;
        else if (pk.family === 'gilt') glowenFind += v / 100;
        continue;
      }
      if ((it.kind !== 'weapon' && it.kind !== 'staff' && it.kind !== 'talisman') || gd.armorOnly) continue;
      switch (pk.family) {
        case 'quicksilver':
          attackSpeedPct += v / 100;
          castSpeedPct += v / 100;
          break;
        case 'tempo':
          cdrPct += v / 100;
          break;
        case 'fleetfoot':
          dodgeRed += v;
          break;
        case 'brutal':
          dmgPct += v / 100;
          break;
        case 'leech':
          lifesteal += v / 100;
          break;
        case 'vigor':
          stamCostPct += v / 100;
          break;
        default:
          if (gd.adds) {
            addDmg.push({ type: gd.adds.type, pct: v / 100 });
            if (gd.adds.status) statusBuild.push({ id: gd.adds.status, buildup: gemBuildup(pk) });
          }
      }
    }
  }
  // rings: each copy worn counts (D227; two of a kind used to count once)
  const rn = (id: string): number => ringCounts[id] ?? 0;
  shardFind += 0.1 * rn('lucky_charm');
  flaskBonus += 0.15 * rn('thermos_lid');
  dodgeRed += 0.5 * rn('fleet_ring');
  regenMult += 0.2 * rn('chloranthy_knot');
  gemFind += 0.25 * rn('glowcatcher');
  glowenFind += 0.2 * rn('glowcatcher');
  dmgPct += 0.15 * rn('slumlords_signet');
  maxHpMult *= Math.pow(0.85, rn('slumlords_signet'));
  if (rn('red_thread')) redTakenMult = Math.pow(0.75, rn('red_thread'));
  // D313: each Ballast Ring worn adds poise by its rarity
  for (const it of items) if (it.kind === 'ring' && it.baseId === 'ballast_ring') poiseBonus += ballastPoise(it.rarity);
  // legendary powers that are plain numbers
  if (powers.has('hungering')) {
    lifesteal += 0.04;
    maxHpMult *= 0.9;
  }
  if (powers.has('timekeeper')) dodgeRed += 1.0;
  // weapon-class proficiency (D178): the perks of the classes out right now
  const prof = profBonuses(c);
  dmgPct += prof.damage;
  poisePct += prof.poise;
  attackSpeedPct += prof.attackSpeed;
  castSpeedPct += prof.castSpeed;
  cdrPct += prof.skillCooldown;
  dodgeRed += prof.dodge;
  stamCostPct += prof.stamina;
  lifesteal += prof.lifesteal;
  if (prof.bleed) for (const sb of statusBuild) if (sb.id === 'bleed') sb.buildup *= 1 + prof.bleed;
  // set perks (D243): the step each set reaches, from the worn pieces that carry it
  const setCounts: Record<string, number> = {};
  for (const it of items) if (it.setPerk && SET_PERKS[it.setPerk]) setCounts[it.setPerk] = (setCounts[it.setPerk] ?? 0) + 1;
  let spellPowerSet = 0;
  let spellCdrSet = 0;
  let parrySet = 0;
  let statusSet = 0;
  for (const [id, n] of Object.entries(setCounts)) {
    const step = setStep(n);
    if (!step) continue;
    const e = SET_PERKS[id]!.steps[step - 1]!;
    dmgPct += e.damagePct ?? 0;
    attackSpeedPct += e.attackSpeedPct ?? 0;
    castSpeedPct += e.castSpeedPct ?? 0;
    spellPowerSet += e.spellPowerPct ?? 0;
    cdrPct += e.skillCdrPct ?? 0;
    spellCdrSet += e.spellCdrPct ?? 0;
    dodgeRed += e.dodgeS ?? 0;
    stamCostPct += e.staminaCostPct ?? 0;
    regenMult += e.staminaRegenPct ?? 0;
    lifesteal += e.lifestealPct ?? 0;
    poisePct += e.poiseDamagePct ?? 0;
    maxHpMult *= 1 + (e.maxHpPct ?? 0);
    defAll += e.defense ?? 0;
    stabilityRed += e.blockStaminaPct ?? 0;
    parrySet += e.parryS ?? 0;
    statusSet += e.statusBuildupPct ?? 0;
    flaskBonus += e.flaskPct ?? 0;
    poiseBonus += e.poise ?? 0;
  }
  if (statusSet) for (const sb of statusBuild) sb.buildup *= 1 + statusSet;
  if (powers.has('unyielding')) stabilityRed += 0.4;
  // shield proficiency (D215): less stamina a block, more elemental block
  stabilityRed += prof.blockStamina;
  elemBlockBonus += prof.elemBlock;

  // ---- defense ----
  const defense: Record<DamageType, number> = { physical: 0, magic: 0, void: 0, fire: 0, holy: 0 };
  for (const slot of ['head', 'body', 'legs'] as const) {
    const it = c.equipment[slot];
    if (!it) continue;
    const d = armorPieceDefense(it.baseId, it.ilvl, it.plus);
    for (const t of DAMAGE_TYPES) defense[t] += d[t];
  }
  for (const t of DAMAGE_TYPES) defense[t] = (defense[t] + defAll) * (1 + (defPct[t] ?? 0));

  const boost = statBoosts(c.classId);
  const hp = maxHP(stats.hp, boost.hp) + hpFlat;
  const stam = maxStamina(stats.endurance, boost.endurance) + stamFlat;
  const shieldIlvl = off?.ilvl ?? 1;
  const toolIlvl = off?.ilvl ?? 1;
  // a reinforced shield leaks less and costs less stamina a block (D198)
  const sv = shield ? shieldValues(shield, shieldIlvl, off?.plus, off?.rarity) : { physical: 0, elemental: 0, holyVoid: 0 };
  sv.elemental = Math.min(0.85, sv.elemental + elemBlockBonus);
  sv.holyVoid = Math.min(0.85, sv.holyVoid + elemBlockBonus);

  const load = equipLoadOf(c.equipment, stats.endurance, boost.endurance);
  return {
    stats,
    maxHp: Math.max(1, Math.round(hp * maxHpMult * (1 + hpPctGem))),
    maxStam: stam,
    regen: staminaRegen(stats.endurance, boost.endurance) * regenMult,
    walk: 260 * (shield?.walkMult ?? 1) * load.effects.speed,
    twoHanded,
    weapon,
    weaponItem: main,
    weaponIlvl,
    weaponMeetsReq,
    skillsUnlocked: main && weaponMeetsReq ? itemSkillCount(main) : 0,
    // rarity sets the damage tier (D178)
    offWeapon: offWeaponOf(off, twoHanded, stats, boost),
    weaponPower: weaponBase(weapon.base1, weaponIlvl) * scalingMult(weapon.grades, stats, twoHanded, boost) * (weaponMeetsReq ? 1 : 0.4) * RARITY_POWER[main?.rarity ?? 'common'] * reinforceDmgMult(main?.plus),
    dmgPct,
    flat,
    convert,
    addDmg,
    statusBuild,
    attackSpeed: Math.min(1.6, 1 + attackSpeedPct),
    // Slicey quickens your casting hands a little: up to about +21% at 99 (D106)
    castSpeed: Math.min(1.6, (castTool?.def.castSpeed ?? 1) * (1 + castSpeedPct) * slickCast(stats.slicey, boost.slicey)),
    castMoveMult: castMoveMult(stats.bonk, boost.bonk),
    cdr: Math.min(0.5, cdrPct),
    dodgeRecharge: dodgeRecharge(dodgeRed),
    stamCost: Math.max(0.3, 1 - stamCostPct),
    lifesteal,
    poiseDmgMult: 1 + poisePct,
    statBoost: boost,
    reachMult: 1 + prof.reach,
    spellCdr: Math.min(0.5, prof.spellCooldown + spellCdrSet),
    spellPowerPct: prof.spellPower + spellPowerSet,
    defense,
    defensePct: defPct,
    offKind: twoHanded ? null : shield ? 'shield' : tool ? (tool.school === 'brain' ? 'staff' : 'talisman') : null,
    shield: twoHanded ? null : shield,
    shieldIlvl,
    shieldVals: sv,
    shieldStability: shield ? shieldStability(shield, off?.plus, off?.rarity) : 0,
    shieldMeetsReq: off && shield ? meetsRequirements(itemRequirements(off), stats, false) : false,
    stabilityMult: Math.max(0.2, 1 - stabilityRed),
    parryBonusS: prof.parryWindow + parrySet,
    tool: castTool?.def ?? null,
    toolIlvl: castTool?.ilvl ?? toolIlvl,
    toolMeetsReq: castTool?.meetsReq ?? false,
    toolMult: castTool?.mult ?? 0,
    mainTool,
    offTool,
    spellKeys,
    skillKeySchool,
    shardFind,
    glowenFind,
    gemFind,
    reviveBonus,
    flaskBonus,
    powers,
    rings,
    ringCounts,
    setCounts,
    maxHpMult,
    poiseThresholdPct: (poise + poiseBonus) / 100,
    poise: poise + poiseBonus,
    staminaRegenMult: regenMult,
    canBlock: !rings.has('red_thread'),
    redTakenMult,
    load,
  };
}
