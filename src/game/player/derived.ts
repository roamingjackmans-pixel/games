// Derived player numbers from stats + equipment + affixes + gems + rings + legendary powers.
// Recomputed on every equipment, stat or two-hand change. Never stored.
import { WEAPONS } from '../../data/weapons';
import { SHIELDS, shieldValues } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { armorPieceDefense } from '../../data/armor';
import { AFFIXES, affixBuildup } from '../../data/affixes';
import { GEMS, gemBuildup, gemValue } from '../../data/gems';
import { RINGS, bandAmount, bandStat } from '../../data/rings';
import { dodgeRecharge, itemSkillCount, maxHP, maxStamina, scalingMult, staminaRegen, toolMult, weaponBase } from '../combat/formulas';
import { itemRequirements, meetsRequirements } from '../items/bases';
import { equipLoadOf, type EquipLoadInfo } from './equipLoad';
import type { CastingToolDef, Character, DamageType, Item, ShieldDef, StatusId, Stats, WeaponDef } from '../types';
import { DAMAGE_TYPES } from '../types';

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
  dmgPct: number;
  flat: Partial<Record<DamageType, number>>;
  convert: { type: DamageType; pct: number }[];
  statusBuild: { id: StatusId; buildup: number }[];
  attackSpeed: number;
  castSpeed: number;
  cdr: number;
  dodgeRecharge: number;
  stamCost: number;
  lifesteal: number;
  poiseDmgMult: number;
  defense: Record<DamageType, number>;
  defensePct: Partial<Record<DamageType, number>>;
  offKind: 'shield' | 'staff' | 'talisman' | null;
  shield: ShieldDef | null;
  shieldIlvl: number;
  shieldVals: { physical: number; elemental: number; holyVoid: number };
  shieldMeetsReq: boolean;
  stabilityMult: number;
  tool: CastingToolDef | null;
  toolIlvl: number;
  toolMeetsReq: boolean;
  toolMult: number;
  shardFind: number;
  glowenFind: number;
  gemFind: number;
  reviveBonus: number;
  flaskBonus: number;
  powers: Set<string>;
  rings: Set<string>;
  maxHpMult: number;
  poiseThresholdPct: number;
  staminaRegenMult: number;
  canBlock: boolean;
  redTakenMult: number;
  /** equip load and its tier (D82); `walk` already includes the tier's speed */
  load: EquipLoadInfo;
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

function itemsOf(c: Character): Item[] {
  const e = c.equipment;
  return [e.main, e.off, e.head, e.body, e.legs, e.ring1, e.ring2].filter((x): x is Item => !!x);
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
  for (const it of items) {
    if (it.legendaryPower) powers.add(it.legendaryPower);
    if (it.kind === 'ring' && RINGS[it.baseId]) rings.add(it.baseId);
  }

  const main = c.equipment.main;
  const weapon = main ? (WEAPONS[main.baseId] ?? FIST) : FIST;
  const weaponIlvl = main?.ilvl ?? 1;
  const off = c.equipment.off;
  const shield = off ? (SHIELDS[off.baseId] ?? null) : null;
  const tool = off ? (CASTING_TOOLS[off.baseId] ?? null) : null;
  const twoHanded = c.twoHanded;
  const weaponMeetsReq = main ? meetsRequirements(itemRequirements(main), stats, twoHanded) : true;

  let dmgPct = 0;
  const flat: Partial<Record<DamageType, number>> = {};
  const convert: { type: DamageType; pct: number }[] = [];
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
  let hpFlat = 0;
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
      const v = gemValue(pk.family, pk.tier);
      if (it.kind === 'armor') {
        if (!gd.armorOnly) continue;
        if (pk.family === 'bulwark') defAll += v;
        else if (pk.family === 'hearth') hpFlat += v;
        else if (pk.family === 'zephyr') regenMult += v / 100;
        else if (pk.family === 'gilt') glowenFind += v / 100;
        continue;
      }
      if (it.kind !== 'weapon' || gd.armorOnly) continue;
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
          if (gd.convert) {
            convert.push({ type: gd.convert.type, pct: v / 100 });
            if (gd.convert.status) statusBuild.push({ id: gd.convert.status, buildup: gemBuildup(pk.tier) });
          }
      }
    }
  }
  // rings
  if (rings.has('lucky_charm')) shardFind += 0.1;
  if (rings.has('thermos_lid')) flaskBonus += 0.15;
  if (rings.has('fleet_ring')) dodgeRed += 0.5;
  if (rings.has('chloranthy_knot')) regenMult += 0.2;
  if (rings.has('glowcatcher')) {
    gemFind += 0.25;
    glowenFind += 0.2;
  }
  if (rings.has('slumlords_signet')) {
    dmgPct += 0.15;
    maxHpMult *= 0.85;
  }
  if (rings.has('red_thread')) redTakenMult = 0.75;
  // legendary powers that are plain numbers
  if (powers.has('hungering')) {
    lifesteal += 0.04;
    maxHpMult *= 0.9;
  }
  if (powers.has('timekeeper')) dodgeRed += 1.0;
  if (powers.has('unyielding')) stabilityRed += 0.4;

  // ---- defense ----
  const defense: Record<DamageType, number> = { physical: 0, magic: 0, void: 0, fire: 0, holy: 0 };
  for (const slot of ['head', 'body', 'legs'] as const) {
    const it = c.equipment[slot];
    if (!it) continue;
    const d = armorPieceDefense(it.baseId, it.ilvl);
    for (const t of DAMAGE_TYPES) defense[t] += d[t];
  }
  for (const t of DAMAGE_TYPES) defense[t] = (defense[t] + defAll) * (1 + (defPct[t] ?? 0));

  const hp = maxHP(stats.hp) + hpFlat;
  const stam = maxStamina(stats.endurance) + stamFlat;
  const shieldIlvl = off?.ilvl ?? 1;
  const toolIlvl = off?.ilvl ?? 1;
  const sv = shield ? shieldValues(shield, shieldIlvl) : { physical: 0, elemental: 0, holyVoid: 0 };
  sv.elemental = Math.min(0.85, sv.elemental + elemBlockBonus);
  sv.holyVoid = Math.min(0.85, sv.holyVoid + elemBlockBonus);

  const load = equipLoadOf(c.equipment, stats.endurance);
  return {
    stats,
    maxHp: Math.max(1, Math.round(hp * maxHpMult)),
    maxStam: stam,
    regen: staminaRegen(stats.endurance) * regenMult,
    walk: 260 * (shield?.walkMult ?? 1) * load.effects.speed,
    twoHanded,
    weapon,
    weaponItem: main,
    weaponIlvl,
    weaponMeetsReq,
    skillsUnlocked: main && weaponMeetsReq ? itemSkillCount(main) : 0,
    weaponPower: weaponBase(weapon.base1, weaponIlvl) * scalingMult(weapon.grades, stats, twoHanded) * (weaponMeetsReq ? 1 : 0.4),
    dmgPct,
    flat,
    convert,
    statusBuild,
    attackSpeed: Math.min(1.6, 1 + attackSpeedPct),
    castSpeed: Math.min(1.6, (tool?.castSpeed ?? 1) * (1 + castSpeedPct)),
    cdr: Math.min(0.5, cdrPct),
    dodgeRecharge: dodgeRecharge(dodgeRed),
    stamCost: Math.max(0.3, 1 - stamCostPct),
    lifesteal,
    poiseDmgMult: 1 + poisePct,
    defense,
    defensePct: defPct,
    offKind: twoHanded ? null : shield ? 'shield' : tool ? (tool.school === 'brain' ? 'staff' : 'talisman') : null,
    shield: twoHanded ? null : shield,
    shieldIlvl,
    shieldVals: sv,
    shieldMeetsReq: off && shield ? meetsRequirements(itemRequirements(off), stats, false) : false,
    stabilityMult: Math.max(0.2, 1 - stabilityRed),
    tool: twoHanded ? null : tool,
    toolIlvl,
    toolMeetsReq: off && tool ? meetsRequirements(itemRequirements(off), stats, false) : false,
    toolMult: tool ? toolMult(tool.grade, toolIlvl) : 0,
    shardFind,
    glowenFind,
    gemFind,
    reviveBonus,
    flaskBonus,
    powers,
    rings,
    maxHpMult,
    poiseThresholdPct: 0.08,
    staminaRegenMult: regenMult,
    canBlock: !rings.has('red_thread'),
    redTakenMult,
    load,
  };
}
