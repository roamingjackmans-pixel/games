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

// `m` on each stat formula below is the class's boost for that stat (D184): primary 1.25, secondary 1.15, else 1. It
// multiplies what the points give, never the base.
export function maxHP(hpStat: number, m = 1): number {
  return Math.round(
    100 +
      m *
        piecewise(hpStat, [
          [30, 14],
          [60, 8],
          [99, 3],
        ]),
  );
}

export function maxStamina(stamStat: number, m = 1): number {
  return Math.round(
    70 +
      m *
      piecewise(stamStat, [
        [30, 3.5],
        [60, 2],
        [99, 0.8],
      ]),
  );
}

/** Max equip load (D82): 26 + 1.5 per Endurance point to 30, 1.0 to 60, 0.5 to 99. */
export function maxEquipLoad(endurance: number, m = 1): number {
  return (
    26 +
    m *
    piecewise(endurance, [
      [30, 1.5],
      [60, 1.0],
      [99, 0.5],
    ])
  );
}

export function staminaRegen(stamStat: number, m = 1): number {
  return 22 + 0.25 * stamStat * m;
}
export const STAMINA_REGEN_DELAY = 0.6;

/** No projectile flies further than this (D185): about two-thirds of the 1,280 px screen, enemies' and players' alike. */
export const MAX_PROJECTILE_RANGE = 850;
/** Enemies' projectiles fly half as far as players' (D186): about a third of the screen. */
export const ENEMY_PROJECTILE_RANGE = 425;

/** Every stamina cost a player pays (swings, dodges, skills, spells, blocking) is ×1.15 (D105). */
export const STAMINA_COST_MULT = 1.15;
/** Attacks (weapon swings, weapon skills, spells) cost 50% more on top of that, and only start with the stamina to pay
 *  for them in full (D193); a dodge, a block or a sprint still goes with any stamina left. */
export const ATTACK_STAMINA_MULT = 1.5;

/** What an attack costs: its listed stamina × every multiplier, never more than a full bar (so none is ever out of reach). */
export function attackStaminaCost(amount: number, stamCost: number, buffPct: number, maxStam: number): number {
  return Math.min(maxStam, amount * STAMINA_COST_MULT * ATTACK_STAMINA_MULT * stamCost * Math.max(0.2, 1 + buffPct));
}

/** Elites have 50% more poise on top of their bigger body (D105). */
export const ELITE_POISE_MULT = 1.5;

/** Spell cast speed from Slicey (D106): ×(1 + 0.25 f(Slicey)), ≈ +13% at 40, +21% at 99. */
export function slickCast(slicey: number, m = 1): number {
  return 1 + 0.25 * scalingCurve(slicey) * m;
}
/** Walking speed while casting (D106): 50% of normal, + 0.25 f(Bonk), ≈ 63% at 40, 70% at 99. */
export function castMoveMult(bonk: number, m = 1): number {
  return 0.5 + 0.25 * scalingCurve(bonk) * m;
}

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
  boost: Partial<Record<'bonk' | 'slicey' | 'brain' | 'prayer', number>> = {},
): number {
  return (
    1 +
    GRADE_MULT[grades.bonk] * scalingCurve(effBonk(stats.bonk, twoHanded)) * (boost.bonk ?? 1) +
    GRADE_MULT[grades.slicey] * scalingCurve(stats.slicey) * (boost.slicey ?? 1) +
    (grades.brain ? GRADE_MULT[grades.brain] * scalingCurve(stats.brain ?? 0) * (boost.brain ?? 1) : 0) +
    (grades.prayer ? GRADE_MULT[grades.prayer] * scalingCurve(stats.prayer ?? 0) * (boost.prayer ?? 1) : 0)
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

/**
 * How much a spell's non-damage effects grow at a power of p = Spell Skill / 100 (D182): buffs, barriers, revive
 * strength and how long utility lasts. Damage and healing take p itself; these take a gentler curve so a strong
 * caster's ward is bigger, not absurd: 1 at 100, about 1.5 at 270, 2.2 at 1,080, at most 3.
 */
export function spellUtility(p: number): number {
  if (p <= 0) return 0;
  if (p < 1) return Math.sqrt(p);
  return Math.min(3, 1 + 0.5 * Math.log(p));
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
export function flaskHeal(maxHp: number, prayer: number, bonusPct = 0, m = 1): number {
  return 0.4 * maxHp * (1 + 0.003 * prayer * m) * (1 + bonusPct);
}

/** damageTaken = incoming × 100 / (100 + Def[type]) (negative defense is treated as 0) */
export function damageAfterDefense(incoming: number, def: number): number {
  return (incoming * 100) / (100 + Math.max(0, def));
}

/**
 * cost(L) = floor((60 × 1.045^L + 15 L) × early(L)) Shards to go from L to L+1. early(L) makes the first twenty levels
 * dearer (D147): ×1.6 at level 1, easing in a straight line to ×1 at level 21 and after.
 */
export const EARLY_LEVEL_SURCHARGE = 0.6;
export const EARLY_LEVEL_END = 21;
export function levelCost(level: number): number {
  const early = 1 + EARLY_LEVEL_SURCHARGE * Math.max(0, (EARLY_LEVEL_END - level) / (EARLY_LEVEL_END - 1));
  return Math.floor((60 * Math.pow(1.045, level) + 15 * level) * early);
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

/**
 * Co-op HP per extra player (D159): +125% each for bosses and Elites, +75% each for every other enemy (bosses were
 * +150% and room enemies +0%, D15 / D79).
 */
export function coopHpMult(players: number, strong = true): number {
  return 1 + (strong ? 1.25 : 0.75) * (Math.max(1, Math.min(4, players)) - 1);
}
/** Co-op boss poise (D194): +150% for each extra player, so a party staggers a boss about as often as one player does. */
export function coopPoiseMult(players: number): number {
  return 1 + 1.5 * (Math.max(1, Math.min(4, players)) - 1);
}
/** New Game+ (D209): its zone 1 is this much harder than the first playthrough's zone 8, its zone 8 this much. */
export const NG_ZONE1_OVER_Z8 = 1.05;
export const NG_ZONE8_OVER_Z8 = 1.35;
/** Each New Game+ after the first: every zone this much harder again. */
export const NG_PER_CYCLE = 1.1;

/**
 * A zone's scaling in a cycle (D209). The first playthrough climbs `1 + perZone × (zone − 1)`. New Game+ starts just
 * above where that ended (zone 1 = 1.05 × the first playthrough's zone 8) and climbs evenly to 1.35 × it by zone 8;
 * every New Game+ after that is ×1.1 on every zone. (It used to multiply the first playthrough by a fixed amount per
 * cycle, so NG+ zone 1 was far easier than the zone 8 just beaten.)
 */
export function cycleZoneCurve(zone: number, cycle: number, perZone: number): number {
  const z = Math.max(1, Math.min(8, zone));
  const first = (n: number): number => 1 + perZone * (n - 1);
  if (cycle <= 0) return first(z);
  const top = first(8);
  const lo = NG_ZONE1_OVER_Z8 * top;
  const hi = NG_ZONE8_OVER_Z8 * top;
  return (lo + ((hi - lo) * (z - 1)) / 7) * Math.pow(NG_PER_CYCLE, cycle - 1);
}
/** D258: every enemy and boss has 3× the HP the NG+1 curve gives; D259: +50% more (4.5×). */
export const NG1_HP_MULT = 4.5;
/** D259: and hits 40% harder than the NG+1 curve. Later cycles build on NG+1, so they carry both. */
export const NG1_DMG_MULT = 1.4;
/** D258: how much stronger (HP and damage both) each New Game+ is than the one before it: NG+2 ×2.5, NG+3 and NG+4 ×2. */
export const NG_STEPS: Record<number, number> = { 2: 2.5, 3: 2, 4: 2 };
/** D258: every New Game+ after NG+4. */
export const NG_LATE_STEP = 1.15;

/** How much stronger a cycle is than NG+1 (1 up to NG+1): ×2.5, ×2, ×2, then ×1.15 a cycle. */
export function ngGrowth(cycle: number): number {
  let m = 1;
  for (let c = 2; c <= cycle; c++) m *= NG_STEPS[c] ?? NG_LATE_STEP;
  return m;
}

// HP and damage (D258) follow the zone curve up to NG+1, then grow by ngGrowth; Shards keep the D209 curve
export function enemyHpMult(zone: number, cycle: number, players: number): number {
  return cycleZoneCurve(zone, Math.min(1, cycle), 0.55) * (cycle >= 1 ? NG1_HP_MULT : 1) * ngGrowth(cycle) * coopHpMult(players);
}
export function enemyDmgMult(zone: number, cycle: number): number {
  return cycleZoneCurve(zone, Math.min(1, cycle), 0.35) * (cycle >= 1 ? NG1_DMG_MULT : 1) * ngGrowth(cycle);
}
/** Shards follow the same curve, so the reward keeps up with the danger (D209). */
export function enemyShardMult(zone: number, cycle: number): number {
  return cycleZoneCurve(zone, cycle, 1.1);
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
/** One perk's sale price: its tier's value × its level's strength (D197; a perk from before levels sells as it did). */
export function gemPerkSellValue(p: { tier: number; level?: number }): number {
  if (p.level === undefined) return gemSellValue(p.tier);
  const l = Math.max(1, Math.min(50, p.level));
  return Math.max(5, Math.round(gemSellValue(p.tier) * (0.25 + (2.75 * (l - 1)) / 49)));
}
/** A whole gem sells for the sum of its perks. */
export function gemSellTotal(g: { perks: { tier: number; level?: number }[] }): number {
  return g.perks.reduce((s, p) => s + gemPerkSellValue(p), 0);
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
