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

/** Every stat goes to 999 (D311; was 99). Most of a stat's worth comes by 150, the soft cap. */
export const STAT_CAP = 999;
export const STAT_SOFT_CAP = 150;

// `m` on each stat formula below is the class's boost for that stat (D184): primary 1.25, secondary 1.15, else 1. It
// multiplies what the points give, never the base.
/**
 * Max HP (D311): up to HP 50 as before (14 a point to 30, 8 to 60); past 50 what the points give grows with the same
 * shape as an S weapon's damage (statGrowth): about ×2 by 100, more slowly past the soft cap 150, ×3 again by 999.
 */
function hpPointsBefore(hpStat: number): number {
  const s = Math.max(0, hpStat);
  return s <= 50 ? piecewise(s, [[30, 14], [60, 8]]) : piecewise(50, [[30, 14], [60, 8]]) * statGrowth(s);
}
export function maxHP(hpStat: number, m = 1): number {
  return Math.round(100 + m * fromTable(TABLES().hp, hpStat));
}

/** Max stamina (D311): as before to 99, then +0.8 a point to 150 and +0.3 a point to 999. */
function staminaPointsBefore(stamStat: number): number {
  return piecewise(stamStat, [[30, 3.5], [60, 2], [99, 0.8], [STAT_SOFT_CAP, 0.8], [STAT_CAP, 0.3]]);
}
export function maxStamina(stamStat: number, m = 1): number {
  return Math.round(70 + m * fromTable(TABLES().stamina, stamStat));
}

/** Max equip load (D82, D311): 26 + 1.5 per Endurance point to 30, 1.0 to 60, 0.5 to 150, 0.1 to 999. */
function loadPointsBefore(endurance: number): number {
  return piecewise(endurance, [[30, 1.5], [60, 1.0], [STAT_SOFT_CAP, 0.5], [STAT_CAP, 0.1]]);
}
export function maxEquipLoad(endurance: number, m = 1): number {
  return 26 + m * fromTable(TABLES().load, endurance);
}

/** Stamina regen (D314): +0.165 a point to 200, so 200 Endurance gives 55 a second, then +0.02 a point (was 0.25). */
export const REGEN_PER_POINT = 0.165;
export const REGEN_FULL_AT = 200;
function regenPointsBefore(stamStat: number): number {
  const s = Math.max(0, stamStat);
  return REGEN_PER_POINT * Math.min(s, REGEN_FULL_AT) + 0.02 * Math.max(0, s - REGEN_FULL_AT);
}
export function staminaRegen(stamStat: number, m = 1): number {
  return 22 + fromTable(TABLES().regen, stamStat) * m;
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

/** Spell cast speed from Slicey (D106): ×(1 + 0.25 f(Slicey)), ≈ +13% at 40, +21% at 99 (the old, settling curve). */
export function slickCast(slicey: number, m = 1): number {
  return 1 + 0.25 * fromTable(TABLES().soft, slicey) * m;
}
/** Walking speed while casting (D106): 50% of normal, + 0.25 f(Bonk), ≈ 63% at 40, 70% at 99 (the old curve). */
export function castMoveMult(bonk: number, m = 1): number {
  return 0.5 + 0.25 * fromTable(TABLES().soft, bonk) * m;
}

/** The old scaling curve 1 − 0.982^s: it settles near 1 by 99. Cast speed and moving while casting still use it. */
export function softStatCurve(s: number): number {
  return 1 - Math.pow(0.982, Math.max(0, s));
}

// Damage scaling (D311). With grade S (×1.9) a weapon's stat multiplier 1 + 1.9 f(s) is: as before to 50 (×2.13),
// twice that at 100 (×4.27), ×5.87 at the soft cap 150, and three times that at 999 (×17.6), easing off as it goes.
const REF_GRADE = 1.9;
const F50 = softStatCurve(50);
const F100 = (2 * (1 + REF_GRADE * F50) - 1) / REF_GRADE;
const SLOPE_50_100 = (F100 - F50) / 50;
const F150 = F100 + 0.75 * SLOPE_50_100 * 50;
const F999 = (3 * (1 + REF_GRADE * F150) - 1) / REF_GRADE;
const TAIL_K = 2;

/** The scaling curve f(s) every damage grade multiplies, reshaped by D450 (see TABLES). */
export function scalingCurve(s: number): number {
  return fromTable(TABLES().curve, s);
}

/** The scaling curve as D311 set it (it was 1 − 0.982^s, which flattened by 99): what D450 reshaped. */
export function scalingCurveBefore(s: number): number {
  const x = Math.max(0, Math.min(STAT_CAP, s));
  if (x <= 50) return softStatCurve(x);
  if (x <= 100) return F50 + SLOPE_50_100 * (x - 50);
  if (x <= STAT_SOFT_CAP) return F100 + 0.75 * SLOPE_50_100 * (x - 100);
  const t = (x - STAT_SOFT_CAP) / (STAT_CAP - STAT_SOFT_CAP);
  return F150 + ((F999 - F150) * (1 - Math.exp(-TAIL_K * t))) / (1 - Math.exp(-TAIL_K));
}

/** How much a stat's worth had grown since 50 before D450, on an S grade's shape (1 at 50 or less; ×2 at 100, ×8.25 at 999). */
export function statGrowth(s: number): number {
  return (1 + REF_GRADE * scalingCurveBefore(Math.max(50, s))) / (1 + REF_GRADE * F50);
}

// ---------------------------------------------------------------- D450: every stat's gains reshaped
/** The early bands are pitched against 85% of what point 51 gave before D450 (the owner's S-weapon numbers). */
export const EARLY_ANCHOR = 0.85;
/**
 * The first 50 points, in bands of ten (D450): the owner's numbers for Bonk on an S weapon, in % of the weapon's base
 * damage a point. They climb to 21–30, the best ten points, then ease off into point 51 and keep easing from there.
 */
export const EARLY_SHAPE = [3.3, 3.5, 4.05, 3.95, 3.85] as const;

/**
 * Builds a stat's new value at every point 0–999 from what each point gave before (D450, D451). Up to 50 each band of
 * ten follows EARLY_SHAPE, pitched against EARLY_ANCHOR of what that stat's point 51 gave (so an S weapon's Bonk gets
 * the owner's numbers exactly); a band that already gave more keeps what it gave, so no early point is worth less than
 * before. Past 50 a point gives k × what it did, never more than point 50 now gives (so nothing climbs again after
 * 21–30), with k solved for each stat so it ends at 999 exactly where it did before (D451). Everything is cumulative,
 * so a stat's value never drops.
 */
function reshape(before: (s: number) => number): Float64Array {
  const t = new Float64Array(STAT_CAP + 1);
  const gain = (s: number): number => before(s) - before(s - 1);
  // the owner's 41–50 band against an S weapon's point 51 after the cut: every stat's early bands sit this high over its own
  const lift = EARLY_SHAPE[4] / 100 / REF_GRADE / (EARLY_ANCHOR * (scalingCurveBefore(51) - scalingCurveBefore(50)));
  const at51 = EARLY_ANCHOR * gain(51);
  t[0] = before(0);
  for (let b = 0; b < 5; b++) {
    const rate = (EARLY_SHAPE[b]! / EARLY_SHAPE[4]) * lift * at51;
    let was = 0;
    for (let s = b * 10 + 1; s <= b * 10 + 10; s++) was += gain(s);
    for (let s = b * 10 + 1; s <= b * 10 + 10; s++) t[s] = t[s - 1]! + (rate * 10 >= was ? rate : gain(s));
  }
  // D451: the same value at 999 as before. The points past 50 share what is left, each at most point 50's worth
  const cap = t[50]! - t[49]!;
  const need = before(STAT_CAP) - t[50]!;
  const late = (k: number): number => {
    let sum = 0;
    for (let s = 51; s <= STAT_CAP; s++) sum += Math.min(cap, k * gain(s));
    return sum;
  };
  let lo = 0;
  let hi = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (late(mid) < need) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  for (let s = 51; s <= STAT_CAP; s++) t[s] = t[s - 1]! + Math.min(cap, k * gain(s));
  return t;
}

/** A table's value at a stat, between whole points in a straight line (two-handed Bonk is ×1.5, so 76.5 happens). */
function fromTable(t: Float64Array, s: number): number {
  const x = Math.max(0, Math.min(STAT_CAP, s));
  const i = Math.floor(x);
  if (i >= STAT_CAP) return t[STAT_CAP]!;
  return t[i]! + (t[i + 1]! - t[i]!) * (x - i);
}

let tables: { curve: Float64Array; soft: Float64Array; hp: Float64Array; stamina: Float64Array; regen: Float64Array; load: Float64Array; thermos: Float64Array } | null = null;
/** Every stat's reshaped values (D450), built once on first use. */
function TABLES(): NonNullable<typeof tables> {
  tables ??= {
    curve: reshape(scalingCurveBefore),
    soft: reshape(softStatCurve),
    hp: reshape(hpPointsBefore),
    stamina: reshape(staminaPointsBefore),
    regen: reshape(regenPointsBefore),
    load: reshape(loadPointsBefore),
    thermos: reshape((s) => 0.003 * Math.max(0, s)),
  };
  return tables;
}

/** Grade weights (D88: raised so stats matter more; were S 1.2, A 1.0, B 0.75, C 0.5, D 0.25, E 0.1). */
export const GRADE_MULT: Record<Grade, number> = { S: 1.9, A: 1.55, B: 1.15, C: 0.8, D: 0.45, E: 0.2, '-': 0 };

/**
 * A staff's scaling letter draws out Brain on a flatter curve than a weapon's (D395): S is 30% weaker than the weapon
 * table's (1.33, was 1.9), A sits clearly under it (1.25, was 1.55), and B down stay as they were. Talismans keep the
 * weapon table.
 */
export const STAFF_GRADE_MULT: Record<Grade, number> = { S: 1.33, A: 1.25, B: 1.15, C: 0.8, D: 0.45, E: 0.2, '-': 0 };

/** How much a casting tool's scaling letter draws out its stat: a staff's flatter table (D395), a talisman's the weapons'. */
export function toolGradeMult(def: { gradeLetter: Grade; school: 'brain' | 'prayer' }): number {
  return (def.school === 'brain' ? STAFF_GRADE_MULT : GRADE_MULT)[def.gradeLetter];
}

/** Two-handing counts Bonk ×1.5 (capped at the stat cap) for scaling and requirements; Slicey is unchanged (D72). */
export function effBonk(bonk: number, twoHanded: boolean): number {
  return twoHanded ? Math.min(STAT_CAP, bonk * 1.5) : bonk;
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

/**
 * A weapon's scaling, with its own boost (D331): the part scaling adds (everything over ×1) is ×`scalingBoost`, so a
 * Greatsword, Katana or Twin Daggers gets more from the same stats without its grade letters changing.
 */
export function weaponScaling(
  def: { grades: { bonk: Grade; slicey: Grade; brain?: Grade; prayer?: Grade }; scalingBoost?: number },
  stats: Pick<Stats, 'bonk' | 'slicey'> & Partial<Pick<Stats, 'brain' | 'prayer'>>,
  twoHanded: boolean,
  boost: Partial<Record<'bonk' | 'slicey' | 'brain' | 'prayer', number>> = {},
): number {
  return 1 + (scalingMult(def.grades, stats, twoHanded, boost) - 1) * (def.scalingBoost ?? 1);
}

/** D343: a weapon that scales A or S with Bonk (as rolled, its variant included) deals 10% less. */
export const BONK_HEAVY_MULT = 0.9;

/** D347: a Slicey-based weapon (its Slicey grade above its Bonk grade, as rolled) deals 20% more. */
export const SLICEY_LED_MULT = 1.2;

const GRADE_ORDER: Grade[] = ['-', 'E', 'D', 'C', 'B', 'A', 'S'];

/** A weapon scales more with Slicey than with Bonk (D347): Twin Daggers, Rapier, Katana, Bow, Whip, Spear, Twin Axes… */
export function sliceyLed(def: { grades: { bonk: Grade; slicey: Grade } }): boolean {
  return GRADE_ORDER.indexOf(def.grades.slicey) > GRADE_ORDER.indexOf(def.grades.bonk);
}

/**
 * A weapon's damage multiplier from how it scales: ×0.9 for Bonk A or S (D343), ×1.2 when Slicey-based (D347) unless its
 * class opts out (D348: Bow, Twin Axes, Spellblade, Dawn Glaive, Chakrams, their variants too).
 */
export function gradeDamageMult(def: { grades: { bonk: Grade; slicey: Grade }; noSliceyBoost?: boolean }): number {
  return (def.grades.bonk === 'A' || def.grades.bonk === 'S' ? BONK_HEAVY_MULT : 1) * (sliceyLed(def) && !def.noSliceyBoost ? SLICEY_LED_MULT : 1);
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
/** a requirement never climbs past this (D299: deep New Game+ gear stays wearable) */
export const REQ_CAP = 90;
/**
 * The main stat a weapon or tool asks for at an item level: +2 a level to level 8 (the first playthrough), then +0.5
 * a level (D299: New Game+ drops are 8 levels a cycle higher, and asked for about what they did before that).
 */
export function reqAtIlvl(req1: number, ilvl: number, primary: boolean): number {
  if (!primary) return req1;
  const climb = 2 * (Math.min(ilvl, 8) - 1) + Math.round(0.5 * Math.max(0, ilvl - 8));
  return Math.min(req1 + climb, Math.max(req1, REQ_CAP));
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

/**
 * D343: spells hit harder early and scale less. A spell's damage is ×1.4 while its school's stat (Brain or Prayer) is
 * 30 or less, easing in a straight line to ×1 at 300, where it stays: the same as before from 300 on. Heals and other
 * effects are unchanged.
 */
export const SPELL_EARLY = { bonus: 0.4, from: 30, to: 300 };

export function spellDamageMult(stat: number): number {
  const { bonus, from, to } = SPELL_EARLY;
  const k = Math.max(0, Math.min(1, (to - stat) / (to - from)));
  return 1 + bonus * k;
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

/** flaskHeal = 40% maxHP × (1 + Prayer's bonus: 0.3% a point to 50, 0.255% past it, D450) */
export function flaskHeal(maxHp: number, prayer: number, bonusPct = 0, m = 1): number {
  return 0.4 * maxHp * (1 + fromTable(TABLES().thermos, prayer) * m) * (1 + bonusPct);
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
/**
 * Past the first playthrough's last level (80) the cost nearly stops climbing (D307): LATE_LEVEL_BASE Shards plus
 * LATE_LEVEL_STEP a level, so the Shards of New Game+ 1 and 2 reach about level 300 (it was about 136). The first
 * playthrough's costs are unchanged.
 */
export const LATE_LEVEL_FROM = 80;
export const LATE_LEVEL_BASE = 5500;
export const LATE_LEVEL_STEP = 3;
export function levelCost(level: number): number {
  if (level >= LATE_LEVEL_FROM) return Math.floor(LATE_LEVEL_BASE + LATE_LEVEL_STEP * (level - LATE_LEVEL_FROM));
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
/** Item level of drops, the shop and Gary (D299): zone 1–8 is level 1–8, and each New Game+ cycle adds 8, so every
 * zone of a playthrough drops better gear than the whole playthrough before it (NG+1: 9–16, NG+2: 17–24…). */
export const ILVL_PER_CYCLE = 8;
export function itemLevelFor(zone: number, cycle: number): number {
  return Math.max(1, zone + ILVL_PER_CYCLE * Math.max(0, cycle));
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

/** Glowen for one baseline gem perk (D284: one price for every family now tiers are gone; T1 sold for 40, T3 for 360). */
export const GEM_PERK_PRICE = 80;
/** A perk's sale price: the baseline price × its level's strength × its roll (a perk from before levels counts as ×1). */
export function gemPerkSellValue(p: { level?: number; q?: number }): number {
  const l = p.level === undefined ? null : Math.max(1, Math.min(50, p.level));
  const lm = l === null ? 1 : 0.25 + (2.75 * (l - 1)) / 49;
  return Math.max(5, Math.round(GEM_PERK_PRICE * lm * (1 + (p.q ?? 0))));
}
/** A whole gem sells for the sum of its perks. */
export function gemSellTotal(g: { perks: { level?: number; q?: number }[] }): number {
  return g.perks.reduce((s, p) => s + gemPerkSellValue(p), 0);
}
/**
 * Everything bought with Glowen costs this many times its listed price (D309: with gem upgrades gone (D284) Glowen
 * piled up). Selling is unchanged, so this is what makes Glowen worth keeping. Reinforcement has its own, larger
 * multiplier (REINFORCE_GLOWEN_MULT in data/essence.ts).
 */
export const GLOWEN_PRICE_MULT = 2;
export function buyPrice(listed: number): number {
  return Math.round(listed * GLOWEN_PRICE_MULT);
}

/** Fusing two gems costs twice (D309) the sale price of the best perk the result keeps (at least 80). */
export function gemFuseCost(perks: { level?: number; q?: number }[]): number {
  return buyPrice(Math.max(40, perks.reduce((m, p) => Math.max(m, gemPerkSellValue(p)), 0)));
}

export const GEAR_SELL: Record<string, number> = { common: 10, uncommon: 25, rare: 60, epic: 150, legendary: 400 };
export function gearSellValue(rarity: string, ilvl: number): number {
  return Math.round((GEAR_SELL[rarity] ?? 10) * (1 + 0.3 * (ilvl - 1)));
}

/** Total stat points for a level (48 at level 1, +1 per level). */
export function pointsForLevel(level: number): number {
  return 47 + level;
}
