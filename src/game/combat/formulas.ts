// GAME_DESIGN §2.3, §3.1, §3.3, CONTENT_ITEMS §1 formulas. Pure functions, unit-tested.
import type { Grade, Stats } from '../types';

/** Sum a piecewise per-point table: [upToPoint, perPoint][] */
function piecewise(points: number, table: [number, number][]): number {
  let total = 0;
  let prev = 0;
  for (const [upTo, per] of table) {
    const n = Math.max(0, Math.min(points, upTo) - prev);
    total += n * per;
    prev = upTo;
    if (points <= upTo) break;
  }
  return total;
}

export function maxHP(hpStat: number): number {
  return Math.round(
    100 +
      piecewise(hpStat, [
        [30, 14],
        [60, 8],
        [99, 3],
      ]),
  );
}

export function maxStamina(stamStat: number): number {
  return Math.round(
    70 +
      piecewise(stamStat, [
        [30, 3.5],
        [60, 2],
        [99, 0.8],
      ]),
  );
}

/** Max equip load (D82): 26 + 1.5 per Endurance point to 30, 1.0 to 60, 0.5 to 99. */
export function maxEquipLoad(endurance: number): number {
  return (
    26 +
    piecewise(endurance, [
      [30, 1.5],
      [60, 1.0],
      [99, 0.5],
    ])
  );
}

export function staminaRegen(stamStat: number): number {
  return 22 + 0.25 * stamStat;
}
export const STAMINA_REGEN_DELAY = 0.6;

/** Scaling curve f(s) = 1 − 0.982^s */
export function scalingCurve(s: number): number {
  return 1 - Math.pow(0.982, Math.max(0, s));
}

/** Grade weights (D88: raised so stats matter more; were S 1.2, A 1.0, B 0.75, C 0.5, D 0.25, E 0.1). */
export const GRADE_MULT: Record<Grade, number> = { S: 1.9, A: 1.55, B: 1.15, C: 0.8, D: 0.45, E: 0.2, '-': 0 };

/** Two-handing counts Bonk ×1.5 (capped at 99) for scaling and requirements; Slicey is unchanged (D72). */
export function effBonk(bonk: number, twoHanded: boolean): number {
  return twoHanded ? Math.min(99, bonk * 1.5) : bonk;
}

/**
 * An enemy's poise from its size (D78): bigger bodies take bigger hits to stagger. One hit staggers it out of
 * whatever it is doing only if that hit's poise damage reaches this. r 9 (a rat) 4 · r 17 (a skeleton) 14 ·
 * r 24 (a knight) 29 · r 30 (a brute) 45 · r 33 54; an Elite is 30% bigger, so about 70% sturdier.
 */
export function poiseForSize(radius: number): number {
  return Math.round(0.05 * radius * radius);
}

/** Weapon base damage at an item level: base1 × (1 + 0.45 (ilvl − 1)) */
export function weaponBase(base1: number, ilvl: number): number {
  return base1 * (1 + 0.45 * (ilvl - 1));
}

/**
 * Multiplier from stat scaling: 1 + Σ grade × f(stat), with Bonk ×1.5 while two-handing. Hybrid weapons (D80) add
 * a Brain or Prayer grade on top of their Bonk or Slicey grade.
 */
export function scalingMult(
  grades: { bonk: Grade; slicey: Grade; brain?: Grade; prayer?: Grade },
  stats: Pick<Stats, 'bonk' | 'slicey'> & Partial<Pick<Stats, 'brain' | 'prayer'>>,
  twoHanded: boolean,
): number {
  return (
    1 +
    GRADE_MULT[grades.bonk] * scalingCurve(effBonk(stats.bonk, twoHanded)) +
    GRADE_MULT[grades.slicey] * scalingCurve(stats.slicey) +
    (grades.brain ? GRADE_MULT[grades.brain] * scalingCurve(stats.brain ?? 0) : 0) +
    (grades.prayer ? GRADE_MULT[grades.prayer] * scalingCurve(stats.prayer ?? 0) : 0)
  );
}

/** weaponDamage = base × (1 + Σ grade × f(effStat)) × attackMultiplier × mods; 40% below requirement */
export function weaponDamage(
  base1: number,
  ilvl: number,
  grades: { bonk: Grade; slicey: Grade; brain?: Grade; prayer?: Grade },
  stats: Pick<Stats, 'bonk' | 'slicey'> & Partial<Pick<Stats, 'brain' | 'prayer'>>,
  twoHanded: boolean,
  attackMult: number,
  mods = 1,
  meetsReq = true,
): number {
  return weaponBase(base1, ilvl) * scalingMult(grades, stats, twoHanded) * attackMult * mods * (meetsReq ? 1 : 0.4);
}

/** Requirement on the primary stat: req1 + 2 × (ilvl − 1). Secondary stays. */
export function reqAtIlvl(req1: number, ilvl: number, primary: boolean): number {
  return primary ? req1 + 2 * (ilvl - 1) : req1;
}

/** toolMult = toolGrade × (1 + 0.35 × (toolIlvl − 1)) */
export function toolMult(grade: number, ilvl: number): number {
  return grade * (1 + 0.35 * (ilvl - 1));
}
export function spellPower(spellBase: number, brain: number, tMult: number): number {
  return spellBase * (1 + 1.8 * scalingCurve(brain)) * tMult;
}
export function healPower(spellBase: number, prayer: number, tMult: number): number {
  return spellBase * (1 + 1.5 * scalingCurve(prayer)) * tMult;
}

/** flaskHeal = 40% maxHP × (1 + 0.003 × Prayer) */
export function flaskHeal(maxHp: number, prayer: number, bonusPct = 0): number {
  return 0.4 * maxHp * (1 + 0.003 * prayer) * (1 + bonusPct);
}

/** damageTaken = incoming × 100 / (100 + Def[type]) (negative defense is treated as 0) */
export function damageAfterDefense(incoming: number, def: number): number {
  return (incoming * 100) / (100 + Math.max(0, def));
}

/** cost(L) = floor(60 × 1.045^L + 15 L) Shards to go from L to L+1 */
export function levelCost(level: number): number {
  return Math.floor(60 * Math.pow(1.045, level) + 15 * level);
}
export function levelCostRange(from: number, to: number): number {
  let total = 0;
  for (let L = from; L < to; L++) total += levelCost(L);
  return total;
}

/** Armor defense: def1 × slotMult × (1 + 0.6 (ilvl − 1)) */
export function armorDef(def1: number, slotMult: number, ilvl: number): number {
  return def1 * slotMult * (1 + 0.6 * (ilvl - 1));
}

// ---------- enemy scaling (GAME_DESIGN §2.3, D15) ----------

export function coopHpMult(players: number): number {
  return 1 + 1.5 * (Math.max(1, players) - 1);
}
export function enemyHpMult(zone: number, cycle: number, players: number): number {
  return (1 + 0.55 * (zone - 1)) * Math.pow(1.6, cycle) * coopHpMult(players);
}
export function enemyDmgMult(zone: number, cycle: number): number {
  return (1 + 0.35 * (zone - 1)) * Math.pow(1.35, cycle);
}
export function enemyShardMult(zone: number, cycle: number): number {
  return (1 + 1.1 * (zone - 1)) * Math.pow(1.8, cycle);
}
export function itemLevelFor(zone: number, cycle: number): number {
  return Math.max(1, zone + cycle);
}

/** Skill tiers (GAME_DESIGN §8.3): Worn 0, Fine 1, Masterwork 2, Mythic 3; Legendary +1, cap 3. */
export function skillsUnlocked(ilvl: number, legendary: boolean): number {
  const tier = ilvl >= 7 ? 3 : ilvl >= 5 ? 2 : ilvl >= 3 ? 1 : 0;
  return Math.min(3, tier + (legendary ? 1 : 0));
}
/**
 * How many skills a weapon dropped in this zone and cycle comes with (D89): before zone 4 none; from zone 4 some
 * have Q; from NG+ (cycle 1) some also have E; from NG+2 (cycle 2) some have all three. Never E before NG+, never R
 * before NG+2. Legendaries roll a little better within the same caps. `roll` returns 0..1 (a seeded stream).
 */
export function rollSkillCount(roll: () => number, zone: number, cycle: number, legendary: boolean): number {
  const bonus = legendary ? 0.2 : 0;
  const z = Math.max(1, Math.min(8, zone));
  let n = 0;
  const q = cycle <= 0 ? (z < 4 ? 0 : 0.2 + 0.1 * (z - 4) + bonus) : cycle === 1 ? Math.min(0.95, 0.6 + 0.04 * z + bonus) : 1;
  if (roll() < q) n = 1;
  if (n === 1 && cycle >= 1) {
    const e = cycle === 1 ? 0.1 + 0.05 * (z - 1) + bonus : Math.min(0.95, 0.6 + 0.04 * z + bonus);
    if (roll() < e) n = 2;
  }
  if (n === 2 && cycle >= 2) {
    const r = Math.min(0.9, 0.1 + 0.06 * (z - 1) + 0.1 * (cycle - 2) + bonus);
    if (roll() < r) n = 3;
  }
  return n;
}

/** Skills a weapon item has unlocked: its rolled count (D89), or the old ilvl tiers for items from older saves. */
export function itemSkillCount(item: { ilvl: number; rarity: string; skills?: number; bonusSkills?: number }): number {
  const base = item.skills ?? skillsUnlocked(item.ilvl, item.rarity === 'legendary');
  return Math.min(3, base + (item.bonusSkills ?? 0));
}

export function tierName(ilvl: number): string {
  return ilvl >= 7 ? 'Mythic' : ilvl >= 5 ? 'Masterwork' : ilvl >= 3 ? 'Fine' : 'Worn';
}

/** Dodge recharge with reductions summed, floor 3.0 s (GAME_DESIGN §5.3). */
export function dodgeRecharge(reductionS: number): number {
  return Math.max(3.0, 5.0 - reductionS);
}

/** Revive requirement 10 × 2^(downs−1), capped at 40. */
export function reviveRequirement(downs: number): number {
  return Math.min(40, 10 * Math.pow(2, Math.max(0, downs - 1)));
}

/** Flask max: 1 at start; +1 after every 2 bosses beaten (max 5); Lucky Socks +1 (not above 5). */
export function flaskMaxFor(bossesBeaten: number, socks: boolean): number {
  return Math.min(5, 1 + Math.floor(Math.min(8, bossesBeaten) / 2) + (socks ? 1 : 0));
}

/** The Thermos size right now: the character's flask max, +1 with Joe's Lucky Socks on (never above 5). */
export function flaskCap(c: { flaskMax: number; equipment: { legs: { legendaryPower?: string } | null } }): number {
  return Math.min(5, c.flaskMax + (c.equipment.legs?.legendaryPower === 'lucky_socks' ? 1 : 0));
}

/** Glowen for one gem perk: 40 × 3^(tier−1); upgrading a perk = 10× its value. */
export function gemSellValue(tier: number): number {
  return 40 * Math.pow(3, tier - 1);
}
export function gemUpgradeCost(tier: number): number {
  return 10 * gemSellValue(tier);
}
/** A whole gem sells for the sum of its perks. */
export function gemSellTotal(g: { perks: { tier: number }[] }): number {
  return g.perks.reduce((s, p) => s + gemSellValue(p.tier), 0);
}
/** Fusing two gems costs the value of the best perk the result keeps (small next to an upgrade). */
export function gemFuseCost(perks: { tier: number }[]): number {
  return gemSellValue(perks.reduce((m, p) => Math.max(m, p.tier), 1));
}

export const GEAR_SELL: Record<string, number> = { common: 10, uncommon: 25, rare: 60, epic: 150, legendary: 400 };
export function gearSellValue(rarity: string, ilvl: number): number {
  return Math.round((GEAR_SELL[rarity] ?? 10) * (1 + 0.3 * (ilvl - 1)));
}

/** Total stat points for a level (48 at level 1, +1 per level). */
export function pointsForLevel(level: number): number {
  return 47 + level;
}
