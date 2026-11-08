// The balance report (`npm run balance:report`, D-balance-report): a fast, deterministic look at the game's numbers,
// read from the real data, formulas and player code (nothing copied). It writes docs/balance/report.md and prints the
// findings. Unlike `npm run balance` (bots playing whole campaigns), it does not play: it measures.
//
// What it assumes (stated in the report too): a player at the zone's expected level (tuning.ts EXPECTED_LEVEL; for
// New Game+, the levels one clear of each zone buys), gear of the zone's item level with no affixes or gems, a
// typical reinforcement, and light attacks only (skills and spells are measured on their own). Enemy resistances
// and weaknesses are left out of time-to-kill.
import { describe, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { Rng } from '../../src/engine/rng';
import { newCharacter } from '../../src/game/player/character';
import { attackCost, attackSpeedOf, spawnPlayer, weaponSpec } from '../../src/game/player/player';
import { castSpeedFor, spellPowerMult } from '../../src/game/skills/use';
import { attackDamage, spawnEnemy } from '../../src/game/enemies/spawn';
import { bossDefOf, bossPhaseCheck, phaseFloor } from '../../src/game/combat/bossPhase';
import { GRADE_MULT, ngGrowth, attackStaminaCost, damageAfterDefense, levelCost, itemLevelFor, enemyShardMult } from '../../src/game/combat/formulas';
import { EXPECTED_LEVEL, zoneShardNeed, zoneShardYield } from '../../src/game/procgen/tuning';
import { generateZone } from '../../src/game/procgen/zone';
import { planRoom, planShards } from '../../src/game/procgen/waves';
import { ENEMIES, rosterOf } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { WEAPONS } from '../../src/data/weapons';
import { SPELLS } from '../../src/data/spells';
import { SKILLS } from '../../src/data/skills';
import { CLASSES } from '../../src/data/classes';
import { ROLE_STATS, SHARD_SCALE, zoneShardFactor } from '../../src/data/roles';
import { ARMOR_SETS } from '../../src/data/armor';
import { ARMOR_GEM_FAMILIES, GEMS, WEAPON_GEM_FAMILIES, gemDropLevel, makeGem } from '../../src/data/gems';
import { expectedReinforce, reinforceGlowen, reinforceDmgMult as reinforceMult, MAX_REINFORCE } from '../../src/data/essence';
import { RARITY_POWER } from '../../src/data/proficiency';
import { makeItem } from '../../src/game/items/make';
import type { BossDef, ClassId, DamageType, EffectDef, Gem, Item, Rarity, StatId, WeaponDef } from '../../src/game/types';

const OUT = 'docs/balance/report.md';
const CYCLES = [0, 1, 2] as const;
const ZONES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const SHARD_SEEDS = 24;

// ------------------------------------------------------------------ small helpers

const r0 = (n: number): string => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '∞');
const r1 = (n: number): string => (Number.isFinite(n) ? (Math.round(n * 10) / 10).toString() : '∞');
const r2 = (n: number): string => (Number.isFinite(n) ? (Math.round(n * 100) / 100).toString() : '∞');
const pct = (n: number): string => `${n >= 0 ? '+' : ''}${Math.round(n * 100)}%`;
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const cycleName = (c: number): string => (c === 0 ? 'First playthrough' : `NG+${c}`);
const WARN = '⚠';

function table(head: string[], rows: (string | number)[][]): string {
  const line = (r: (string | number)[]): string => `| ${r.map((x) => String(x)).join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}

interface Finding {
  severity: number;
  area: string;
  text: string;
  fix: string;
}
const findings: Finding[] = [];
function find(severity: number, area: string, text: string, fix: string): void {
  findings.push({ severity, area, text, fix });
}

let idSeq = 0;
const rng = new Rng('balance-report');
function item(baseId: string, rarity: Rarity, ilvl: number, plus = 0, gems: Gem[] = []): Item {
  const it = makeItem(baseId, rarity, ilvl, { rng, sockets: gems.length, gems });
  it.id = `br${++idSeq}`;
  if (plus > 0) it.plus = plus;
  return it;
}

/** The item level a player wears: the zone's drops, or what they finished the last playthrough with if that is higher. */
function gearIlvl(zone: number, cycle: number): number {
  return Math.max(itemLevelFor(zone, cycle), cycle > 0 ? itemLevelFor(8, cycle - 1) : 1);
}
/** Expected gear for a zone and cycle (assumptions, stated in the report). */
function rarityFor(zone: number, cycle: number): Rarity {
  if (cycle >= 1) return 'epic';
  return zone <= 2 ? 'uncommon' : zone <= 5 ? 'rare' : 'epic';
}
/** Reinforcement the Essence found by then allows (the game's own rule, D303). */
function plusFor(zone: number, cycle: number): number {
  return expectedReinforce(zone, cycle);
}

// ------------------------------------------------------------------ the world's side

interface FoeHit {
  dmg: number;
  type: DamageType;
  name: string;
  kind: string;
}
function hitsOf(e: Entity, attacks: { dmgMult: number; type: DamageType; name: string; kind: string }[], phaseMult = 1): FoeHit[] {
  return attacks.filter((a) => a.dmgMult > 0).map((a) => ({ dmg: attackDamage(e, a.dmgMult) * phaseMult, type: a.type, name: a.name, kind: a.kind }));
}

interface ZoneFoes {
  hp: number[];
  hits: FoeHit[];
  perEnemyAvgHit: number[];
  byRole: Record<string, { hp: number[]; hit: number[] }>;
}
function zoneFoes(zone: number, cycle: number): ZoneFoes {
  const w = new World(`foes${zone}:${cycle}`, Room.empty());
  const out: ZoneFoes = { hp: [], hits: [], perEnemyAvgHit: [], byRole: {} };
  for (const d of rosterOf(zone)) {
    const e = spawnEnemy(w, d, 640, 300, { zone, cycle, players: 1 });
    const hs = hitsOf(e, d.attacks);
    out.hp.push(e.hp!.max);
    out.hits.push(...hs);
    const avg = mean(hs.map((h) => h.dmg));
    if (hs.length) out.perEnemyAvgHit.push(avg);
    const role = (out.byRole[d.role] ??= { hp: [], hit: [] });
    role.hp.push(e.hp!.max);
    if (hs.length) role.hit.push(avg);
  }
  return out;
}

interface BossPhaseRow {
  phase: number;
  name: string;
  hp: number;
  hits: FoeHit[];
}
interface BossRow {
  def: BossDef;
  phases: BossPhaseRow[];
  totalHp: number;
}
/** Every phase of a zone's boss, walked with the real phase code: its bar, then the clamp and the next phase. */
function zoneBosses(zone: number, cycle: number): BossRow[] {
  const rows: BossRow[] = [];
  for (const def of Object.values(BOSSES).filter((b) => b.zone === zone)) {
    const w = new World(`boss${zone}:${cycle}:${def.id}`, Room.empty());
    const e = spawnEnemy(w, def, 640, 300, { zone, cycle, players: 1 });
    const phases: BossPhaseRow[] = [];
    for (let guard = 0; guard < 12; guard++) {
      const i = e.en!.phase;
      const live = bossDefOf(e) ?? def;
      const ph = live.phases[i];
      const floor = phaseFloor(e);
      phases.push({ phase: i + 1, name: ph?.name ?? (i === 0 ? 'Opening' : `Phase ${i + 1}`), hp: e.hp!.hp - floor, hits: hitsOf(e, e.en!.phaseAttacks, ph?.dmgMult ?? 1) });
      if (floor <= 0) break;
      e.hp!.hp = floor;
      bossPhaseCheck(w, e);
      if (e.en!.phase === i) break;
    }
    rows.push({ def, phases, totalHp: phases.reduce((s, p) => s + p.hp, 0) });
  }
  return rows;
}

// ------------------------------------------------------------------ levels per cycle (Shards)

function zoneShardsWithBoss(zone: number, cycle: number): number {
  let tot = 0;
  for (let s = 0; s < SHARD_SEEDS; s++) {
    const L = generateZone(`BR${s}`, zone, { cycle });
    for (const r of L.rooms)
      tot += planShards(planRoom(L, r), (id) => ROLE_STATS[ENEMIES[id]!.role].shards * SHARD_SCALE * zoneShardFactor(zone) * (ENEMIES[id]!.mult?.shards ?? 1) * enemyShardMult(zone, cycle));
  }
  const rooms = tot / SHARD_SEEDS;
  const w = new World('bossShards', Room.empty());
  const boss = Object.values(BOSSES).find((b) => b.zone === zone);
  const bossShards = boss ? spawnEnemy(w, boss, 640, 300, { zone, cycle, players: 1 }).en!.shards : 0;
  return rooms + bossShards;
}
function levelsBought(from: number, shards: number): number {
  let L = from;
  let left = shards;
  while (left >= levelCost(L) && L < 713) {
    left -= levelCost(L);
    L++;
  }
  return L;
}
/** Expected level at the start of each zone: the design table for the first playthrough, then one clear of each zone. */
const LEVEL_AT: Record<number, number[]> = {};
const SHARDS_AT: Record<number, number[]> = {};
function computeLevels(): void {
  LEVEL_AT[0] = ZONES.map((z) => EXPECTED_LEVEL[z - 1]! + Math.round((EXPECTED_LEVEL[z]! - EXPECTED_LEVEL[z - 1]!) / 2));
  let L = EXPECTED_LEVEL[8]!;
  for (const c of CYCLES.filter((x) => x > 0)) {
    LEVEL_AT[c] = [];
    SHARDS_AT[c] = [];
    for (const z of ZONES) {
      const s = zoneShardsWithBoss(z, c);
      SHARDS_AT[c]!.push(s);
      const after = levelsBought(L, s);
      LEVEL_AT[c]!.push(Math.round((L + after) / 2));
      L = after;
    }
  }
}

// ------------------------------------------------------------------ the player's side

interface Build {
  name: string;
  cls: ClassId;
  main: string;
  off?: string;
  twoHanded?: boolean;
  /** shares of the points bought */
  split: Partial<Record<StatId, number>>;
  caster?: 'brain' | 'prayer';
}
const BUILDS: Build[] = [
  { name: 'Bonk: greathammer (2H)', cls: 'brute', main: 'greathammer', twoHanded: true, split: { bonk: 0.5, hp: 0.3, endurance: 0.2 } },
  { name: 'Slicey: twin daggers', cls: 'duelist', main: 'twin_daggers', off: 'buckler', split: { slicey: 0.5, hp: 0.3, endurance: 0.2 } },
  { name: 'Quality: longsword + shield', cls: 'knight', main: 'longsword', off: 'kite_shield', split: { bonk: 0.25, slicey: 0.25, hp: 0.3, endurance: 0.2 } },
  { name: 'Bow (Slicey)', cls: 'hunter', main: 'bow', twoHanded: true, split: { slicey: 0.5, hp: 0.3, endurance: 0.2 } },
  { name: 'Crossbow (Bonk)', cls: 'brute', main: 'crossbow', split: { bonk: 0.5, hp: 0.3, endurance: 0.2 } },
  { name: 'Brain caster: staff spells', cls: 'scholar', main: 'rapier', off: 'apprentice_staff', split: { brain: 0.55, hp: 0.3, endurance: 0.15 }, caster: 'brain' },
  { name: 'Prayer caster: talisman spells', cls: 'occultist', main: 'dawn_glaive', off: 'silver_talisman', split: { prayer: 0.55, hp: 0.3, endurance: 0.15 }, caster: 'prayer' },
];

function buildPlayer(b: Build, level: number, zone: number, cycle: number, gems: Gem[] = []): { w: World; p: Entity } {
  const c = newCharacter(b.cls, 'Bal', 'bal', new Rng(`${b.name}`));
  const cls = CLASSES[b.cls];
  const stats = { ...cls.stats };
  const pts = Math.max(0, level - 1);
  const keys = Object.keys(b.split) as StatId[];
  let given = 0;
  for (const k of keys) {
    const n = Math.floor(pts * (b.split[k] ?? 0));
    stats[k] = Math.min(99, stats[k] + n);
    given += n;
  }
  // leftovers to the first stat that has room
  for (let i = 0; given < pts && i < 600; i++) {
    const k = keys.find((s) => stats[s] < 99) ?? 'hp';
    if (stats[k] >= 99) break;
    stats[k]++;
    given++;
  }
  c.stats = stats;
  c.level = level;
  const ilvl = gearIlvl(zone, cycle);
  const rar = rarityFor(zone, cycle);
  const plus = plusFor(zone, cycle);
  c.equipment.main = item(b.main, rar, ilvl, plus, gems);
  c.equipment.off = b.off ? item(b.off, rar, ilvl, plus) : null;
  // every build wears the zone's full medium set, blue (Rare), reinforced as far as that area allows, so a one-shot
  // alert means the hit is too big, not that the build had no armour (a class starts with only some pieces)
  const medium = ARMOR_SETS.find((st) => st.weight === 'medium' && st.zone === Math.min(8, zone)) ?? ARMOR_SETS.find((st) => st.weight === 'medium')!;
  for (const sl of ['head', 'body', 'legs'] as const) c.equipment[sl] = item(`${medium.id}_${sl}`, 'rare', ilvl, plus);
  c.twoHanded = b.twoHanded ?? false;
  const w = new World(`pl:${b.name}:${zone}:${cycle}`, Room.empty());
  const p = spawnPlayer(w, c, 0, true, 400, 368);
  return { w, p };
}

interface Dps {
  burst: number;
  sustained: number;
  perSwing: number;
  staminaPerHit: number;
}
/** Light-attack damage per second with the real damage spec, swing timings, attack speed and stamina. */
function lightDps(w: World, p: Entity, wpn: WeaponDef = p.pl!.derived.weapon): Dps {
  const d = p.pl!.derived;
  const spd = attackSpeedOf(w, p);
  let dmg = 0;
  let time = 0;
  const n = wpn.combo.length;
  wpn.combo.forEach((s, i) => {
    const spec = weaponSpec(w, p, s.mult);
    dmg += Object.values(spec.dmg).reduce((a, b) => a + (b ?? 0), 0);
    const last = i === n - 1;
    // a queued swing starts 45% into the recovery; the last one's recovery is 15% longer and runs out (player.ts)
    time += (s.windupMs + s.activeMs + s.recoverMs * (last ? 1.15 : 0.45)) / 1000 / spd;
  });
  // a bow or crossbow that charges (D88): a full charge, if that is the better rate
  const ch = wpn.ranged?.chargeS && n === 1 ? wpn.ranged : null;
  if (ch?.chargeS) {
    const s = wpn.combo[0]!;
    const cdmg = Object.values(weaponSpec(w, p, s.mult * (ch.chargeMult ?? 1)).dmg).reduce((a, b) => a + (b ?? 0), 0);
    const ctime = (Math.max(s.windupMs / 1000 / spd, ch.chargeS) + (s.activeMs + s.recoverMs * 1.15) / 1000 / spd);
    if (cdmg / ctime > dmg / time) {
      dmg = cdmg;
      time = ctime;
    }
  }
  const perSwing = dmg / n;
  const burst = dmg / time;
  const cost = attackCost(w, p, wpn.stamina);
  // swing until the bar is empty (each swing needs its full cost), then wait out the delay and refill
  const swings = Math.max(1, Math.floor(d.maxStam / Math.max(1, cost)));
  const burstT = (swings * time) / n;
  const refill = 0.6 + (swings * cost) / Math.max(1, d.regen);
  const sustained = (swings * perSwing) / (burstT + refill);
  return { burst, sustained, perSwing, staminaPerHit: cost };
}

/** Single-target damage of an effect list, in units of `base` (spells) or `mult` (skills). */
function effDmg(effs: EffectDef[] | undefined, key: 'base' | 'mult'): number {
  let t = 0;
  for (const e of effs ?? []) {
    switch (e.op) {
      case 'damage': {
        // scattered circles (Comet Barrage): the share that lands on one target of about 40 px radius
        const pat = e.pattern;
        const share = pat.kind === 'randomCircles' ? pat.n * Math.min(1, ((pat.r + 40) / Math.max(1, pat.within ?? pat.r * 4)) ** 2) : 1;
        t += (e[key] ?? 0) * (e.ticks ?? 1) * share;
        break;
      }
      case 'zone':
        t += (e.durationS / Math.max(0.05, e.tickS)) * effDmg(e.tick, key) + (e.burst ? effDmg([e.burst], key) : 0);
        break;
      case 'channel':
        t += (e.durationS / Math.max(0.05, e.tickS)) * effDmg(e.tick, key);
        break;
      case 'chain':
        t += effDmg([e.hit], key);
        break;
      case 'repeat':
        t += e.count * effDmg([e.effect], key);
        break;
      case 'sequence':
        t += e.steps.reduce((s, x) => s + effDmg([x.effect], key), 0);
        break;
      case 'charge':
        t += e.maxMult * effDmg([e.release], key);
        break;
      case 'dash':
        t += effDmg([e.hitOnEntry, e.hitOnExit, e.hitOnLand].filter((x): x is EffectDef => !!x), key);
        break;
      default:
        break;
    }
  }
  return t;
}

interface SpellRow {
  id: string;
  name: string;
  school: string;
  dmg: number;
  castS: number;
  cd: number;
  stamina: number;
  dps: number;
  perStam: number;
}
/** Seconds a spell keeps you busy: its cast plus any channel it holds you in. */
function busyS(effs: EffectDef[]): number {
  return effs.reduce((s, e) => s + (e.op === 'channel' ? e.durationS : 0), 0);
}
function spellRows(): SpellRow[] {
  return Object.values(SPELLS)
    .map((s) => {
      const dmg = effDmg(s.effect, 'base');
      const busy = Math.max(s.castS + busyS(s.effect), s.cooldownS);
      return { id: s.id, name: s.name, school: s.school, dmg, castS: s.castS + busyS(s.effect), cd: s.cooldownS, stamina: s.stamina, dps: dmg / busy, perStam: s.stamina > 0 ? dmg / s.stamina : Infinity };
    })
    .filter((r) => r.dmg > 0);
}

/** A caster's spell damage per second: the best three damaging spells it can cast, cast as often as time allows. */
function casterDps(w: World, p: Entity, school: 'brain' | 'prayer'): { dps: number; spells: string[]; spellDps: number; melee: number } {
  const d = p.pl!.derived;
  const stat = school === 'brain' ? d.stats.brain : d.stats.prayer;
  const cs = castSpeedFor(w, p);
  const options = Object.values(SPELLS)
    .filter((s) => s.school === school && s.req <= stat && !s.weaponBuff)
    .map((s) => {
      const dmg = effDmg(s.effect, 'base') * spellPowerMult(p, s);
      const castS = s.castS / cs + busyS(s.effect);
      const cd = Math.max(castS, s.cooldownS * (1 - d.spellCdr));
      return { s, dmg, castS, cd };
    })
    .filter((o) => o.dmg > 0)
    .sort((a, b) => b.dmg / b.castS - a.dmg / a.castS);
  let room = 1;
  let dps = 0;
  let stamPerS = 0;
  const used: string[] = [];
  for (const o of options) {
    if (used.length >= 3 || room <= 0) break;
    const occ = o.castS / o.cd;
    const f = Math.min(1, room / occ);
    dps += (f * o.dmg) / o.cd;
    stamPerS += (f * attackStaminaCost(o.s.stamina, d.stamCost, 0, d.maxStam)) / o.cd;
    room -= f * occ;
    used.push(o.s.name);
  }
  // stamina regen caps it (with the regen delay after each spend, about 80% of the regen is usable)
  const usable = d.regen * 0.8;
  const cap = stamPerS > 0 ? Math.min(1, usable / stamPerS) : 1;
  // the time and stamina the spells leave go to light attacks with the weapon in hand
  const melee = lightDps(w, p).sustained * Math.max(0, room) * Math.max(0, 1 - stamPerS / usable);
  return { dps: dps * cap + melee, spells: used, spellDps: dps * cap, melee };
}

function playerDps(b: Build, w: World, p: Entity): { dps: number; burst: number; note: string } {
  if (b.caster) {
    const c = casterDps(w, p, b.caster);
    return { dps: c.dps, burst: c.dps, note: `${c.spells.join(', ') || 'no spell castable'}; spells ${r0(c.spellDps)} + weapon ${r0(c.melee)}` };
  }
  const l = lightDps(w, p);
  return { dps: l.sustained, burst: l.burst, note: `${r0(l.perSwing)}/swing` };
}

const casterNotes = new Map<string, string[]>();
function hitsToDie(p: Entity, h: FoeHit): number {
  const d = p.pl!.derived;
  return d.maxHp / Math.max(0.01, damageAfterDefense(h.dmg, d.defense[h.type]));
}

// ------------------------------------------------------------------ the report

const md: string[] = [];
const out = (s = ''): void => {
  md.push(s);
};

function section1(foes: Record<string, ZoneFoes>, bosses: Record<string, BossRow[]>): void {
  out('## 1. Enemies and bosses by zone');
  out();
  out('Room enemies: each roster enemy spawned with the real spawn code (solo); a hit is `attackDamage` for each attack with a damage multiplier. Bosses: every phase walked with the real phase code; the phase bar is the HP that phase has to lose.');
  out();
  for (const c of CYCLES) {
    out(`### ${cycleName(c)}`);
    out();
    const rows: string[][] = [];
    let prevHp = 0;
    let prevHit = 0;
    for (const z of ZONES) {
      const f = foes[`${z}:${c}`]!;
      const hp = mean(f.hp);
      const hit = mean(f.perEnemyAvgHit);
      const flags: string[] = [];
      if (z > 1 && hp < prevHp * 0.98) flags.push(`${WARN} HP below zone ${z - 1}`);
      if (z > 1 && hit < prevHit * 0.98) flags.push(`${WARN} hits softer than zone ${z - 1}`);
      if (z > 1 && hit < prevHit * 0.98) find(3 + (prevHit / hit - 1) * 10, 'Enemy curve', `${cycleName(c)}: zone ${z} room enemies hit for ${r0(hit)} on average, below zone ${z - 1}'s ${r0(prevHit)}.`, 'Make the per-zone damage table climb (zoneDmgFactor / NG_ZONE_ENEMY_DMG).');
      if (z > 1 && hp < prevHp * 0.98) find(2 + (prevHp / hp - 1) * 10, 'Enemy curve', `${cycleName(c)}: zone ${z} room enemies have ${r0(hp)} HP on average, below zone ${z - 1}'s ${r0(prevHp)}.`, 'Check the zone roster mix and the HP curve.');
      rows.push([String(z), r0(hp), `${r0(Math.min(...f.hp))}–${r0(Math.max(...f.hp))}`, r0(hit), `${r0(Math.min(...f.hits.map((h) => h.dmg)))}–${r0(Math.max(...f.hits.map((h) => h.dmg)))}`, flags.join('; ')]);
      prevHp = hp;
      prevHit = hit;
    }
    out(table(['Zone', 'Avg HP', 'HP range', 'Avg hit', 'Hit range', 'Flags'], rows));
    out();
    // per role
    const roles = [...new Set(ZONES.flatMap((z) => Object.keys(foes[`${z}:${c}`]!.byRole)))].sort();
    out('Average hit by role (HP in brackets):');
    out();
    out(
      table(
        ['Role', ...ZONES.map((z) => `Z${z}`)],
        roles.map((r) => [r, ...ZONES.map((z) => {
          const x = foes[`${z}:${c}`]!.byRole[r];
          return x && x.hit.length ? `${r0(mean(x.hit))} (${r0(mean(x.hp))})` : '—';
        })]),
      ),
    );
    out();
    // bosses
    const brows: string[][] = [];
    let prevBossHp = 0;
    let prevBossHit = 0;
    for (const z of ZONES) {
      for (const b of bosses[`${z}:${c}`] ?? []) {
        const allHits = b.phases.flatMap((p) => p.hits.map((h) => h.dmg));
        const avg = mean(allHits);
        const flags: string[] = [];
        if (z > 1 && b.totalHp < prevBossHp * 0.98) {
          flags.push(`${WARN} less HP than zone ${z - 1}'s boss`);
          find(3 + (prevBossHp / b.totalHp - 1) * 8, 'Boss curve', `${cycleName(c)}: ${b.def.name} (zone ${z}) has ${r0(b.totalHp)} HP over all phases, below zone ${z - 1}'s boss (${r0(prevBossHp)}).`, 'Raise its baseHp / phase bars, or lower the previous boss.');
        }
        if (z > 1 && avg < prevBossHit * 0.9) {
          flags.push(`${WARN} hits softer than zone ${z - 1}'s boss`);
          find(2 + (prevBossHit / avg - 1) * 8, 'Boss curve', `${cycleName(c)}: ${b.def.name} (zone ${z}) averages ${r0(avg)} a hit, below zone ${z - 1}'s boss (${r0(prevBossHit)}).`, 'Raise its phase damage multipliers.');
        }
        brows.push([String(z), b.def.name, String(b.phases.length), b.phases.map((p) => r0(p.hp)).join(' / '), r0(b.totalHp), b.phases.map((p) => r0(mean(p.hits.map((h) => h.dmg)))).join(' / '), r0(Math.max(...allHits)), flags.join('; ')]);
        prevBossHp = b.totalHp;
        prevBossHit = avg;
      }
    }
    out(table(['Zone', 'Boss', 'Phases', 'HP per phase', 'Total HP', 'Avg hit per phase', 'Biggest hit', 'Flags'], brows));
    out();
  }
}

function section2(foes: Record<string, ZoneFoes>, bosses: Record<string, BossRow[]>): void {
  out('## 2. Time to kill and hits to die');
  out();
  out(
    'Each build at the zone\'s expected level, with points split as listed, wearing the zone\'s full **medium armour set at Rare (blue)** and its weapon at the zone\'s item level (no affixes or gems), both reinforced as far as that area allows, the weapon at the rarity assumed below. **DPS** is sustained light-attack damage per second (swing until the stamina bar is empty, then wait for it to refill); casters cast their three best damaging spells as often as cooldowns, cast time and stamina allow. **TTK** = seconds of that DPS to kill the zone\'s average room enemy / its boss (all phases). **Hits** = average hits of the zone\'s room enemies / the boss\'s biggest hit to kill the build, after its defense.',
  );
  out();
  out(table(['Cycle', ...ZONES.map((z) => `Z${z}`)], CYCLES.map((c) => [cycleName(c), ...ZONES.map((z) => `L${LEVEL_AT[c]![z - 1]} · ilvl ${gearIlvl(z, c)}${gearIlvl(z, c) > itemLevelFor(z, c) ? ` (drops ${itemLevelFor(z, c)})` : ''} · ${rarityFor(z, c)} +${plusFor(z, c)}`)])));
  out();
  for (const c of CYCLES) {
    out(`### ${cycleName(c)}`);
    out();
    const rows: string[][] = [];
    const ttkBossByZone: Record<number, number[]> = {};
    for (const b of BUILDS) {
      const cells: string[] = [b.name];
      for (const z of ZONES) {
        const level = LEVEL_AT[c]![z - 1]!;
        const { w, p } = buildPlayer(b, level, z, c);
        const d = playerDps(b, w, p);
        if (b.caster) {
          const list = casterNotes.get(b.name) ?? [];
          list.push(`Z${z} ${d.note}`);
          casterNotes.set(b.name, list);
        }
        const f = foes[`${z}:${c}`]!;
        const boss = (bosses[`${z}:${c}`] ?? [])[0];
        const ttkRoom = mean(f.hp) / d.dps;
        const ttkBoss = boss ? boss.totalHp / d.dps : NaN;
        const roomHits = mean(f.hits.map((h) => hitsToDie(p, h)));
        const bossBig = boss ? boss.phases.flatMap((ph) => ph.hits).reduce((m, h) => (h.dmg > m.dmg ? h : m), { dmg: 0, type: 'physical' as DamageType, name: '', kind: '' }) : null;
        const bossHits = bossBig && bossBig.dmg > 0 ? hitsToDie(p, bossBig) : NaN;
        (ttkBossByZone[z] ??= []).push(ttkBoss);
        const dd = p.pl!.derived;
        const meetsReq = b.caster ? (dd.offTool?.meetsReq ?? dd.mainTool?.meetsReq ?? false) : dd.weaponMeetsReq;
        const meets = meetsReq ? '' : ` ${WARN}req`;
        const flag = bossHits < 1 ? ` ${WARN}1-shot` : '';
        cells.push(`${r0(d.dps)} dps · ${r1(ttkRoom)}s / ${r0(ttkBoss)}s · ${r1(roomHits)} / ${r1(bossHits)} hits${meets}${flag}`);
        if (!meetsReq) find(4, 'Builds', `${cycleName(c)} zone ${z}: the ${b.name} build at level ${level} does not meet its own ${b.caster ? 'casting tool' : 'weapon'}'s requirements at item level ${gearIlvl(z, c)} (40% damage, no skills).`, 'Item-level requirements (+2 a level on the primary stat) outpace the points a focused build has; ease reqAtIlvl or the NG+ item level.');
        if (bossHits < 1) find(6, 'One-shots', `${cycleName(c)} zone ${z}: ${boss!.def.name}'s biggest hit (${bossBig!.name}, ${bossBig!.kind}, ${r0(bossBig!.dmg)} ${bossBig!.type}) kills the ${b.name} build (${r0(p.pl!.derived.maxHp)} HP) in one hit (${r2(bossHits)}).`, 'Cap a boss hit at ~70% of an expected-level player\'s HP, or lower that attack\'s multiplier.');
      }
      rows.push(cells);
    }
    out(table(['Build', ...ZONES.map((z) => `Z${z}`)], rows));
    out();
    for (const [b, notes] of casterNotes) out(`- ${b}: ${notes.join(' · ')}`);
    casterNotes.clear();
    out();
    // spread between builds
    const spreadRows: string[][] = [];
    for (const z of ZONES) {
      const xs = ttkBossByZone[z]!.filter((x) => Number.isFinite(x));
      const med = median(xs);
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      spreadRows.push([String(z), r0(med), r0(lo), r0(hi), r1(hi / Math.max(1, lo))]);
      // the owner's fight lengths (D301): NG+1 5 min (the Landlord 8), NG+2 on 8 min (11); first playthrough under 5
      const target = c <= 0 ? null : c === 1 ? (z === 8 ? 480 : 300) : z === 8 ? 660 : 480;
      const bossName = (bosses[`${z}:${c}`] ?? [])[0]?.def.name ?? 'the boss';
      const bossHp = r0((bosses[`${z}:${c}`] ?? [])[0]?.totalHp ?? 0);
      if (target === null ? med > 300 : med > target * 1.25 || med < target * 0.75)
        find(
          3 + Math.min(4, med / 300),
          'Boss length',
          `${cycleName(c)} zone ${z}: the median build needs ${r0(med)} s of nonstop hitting to kill ${bossName} (${bossHp} HP), ${r1(med / 60)} minutes before any dodging${target ? ` (target ${r1(target / 60)} min, D301)` : ''}.`,
          target && med < target ? 'Raise its NG_BOSS_HP factor (D301).' : 'Trim its NG_BOSS_HP factor (D301), the boss HP multiplier for this cycle, or the extra phase bars.',
        );
      if (hi / lo > 3) {
        const iHi = ttkBossByZone[z]!.indexOf(hi);
        const iLo = ttkBossByZone[z]!.indexOf(lo);
        find(3 + Math.min(4, hi / lo / 2), 'Build spread', `${cycleName(c)} zone ${z}: the slowest build (${BUILDS[iHi]!.name}) takes ${r0(hi)} s on the boss, ${r1(hi / lo)}× the fastest (${BUILDS[iLo]!.name}, ${r0(lo)} s).`, 'Bring the slow build\'s damage source up (or the fast one down).');
      }
    }
    out('Boss time-to-kill across the builds (seconds):');
    out();
    out(table(['Zone', 'Median', 'Fastest', 'Slowest', 'Slowest ÷ fastest'], spreadRows));
    out();
  }
}

function section3(): void {
  out('## 3. Gems, compared');
  out();
  out('Each gem at the level a zone 5 drop has (first playthrough) and a +0% roll, on the quality build (longsword) at zone 5. Weapon gems are compared by how much they raise sustained light-attack DPS; armour gems by how much they raise effective HP against zone 5\'s room hits. Families that do neither are listed with their raw value.');
  out();
  const lvlRng = new Rng('gemlevel');
  const lvls: number[] = [];
  for (let i = 0; i < 200; i++) lvls.push(gemDropLevel(lvlRng, 5, 0));
  const level = Math.round(mean(lvls));
  const b = BUILDS[2]!;
  const L = LEVEL_AT[0]![4]!;
  const base = buildPlayer(b, L, 5, 0);
  const baseL = lightDps(base.w, base.p);
  const baseDps = baseL.sustained;
  const foes = zoneFoes(5, 0);
  const ehp = (p: Entity): number => p.pl!.derived.maxHp / mean(foes.hits.map((h) => damageAfterDefense(h.dmg, p.pl!.derived.defense[h.type])));
  const baseEhp = ehp(base.p);
  const rows: string[][] = [];
  const dmgGains: { f: string; g: number; burst: number }[] = [];
  for (const f of WEAPON_GEM_FAMILIES) {
    const gem = makeGem(f, { level, q: 0 });
    const g = buildPlayer(b, L, 5, 0, [gem]);
    const gl = lightDps(g.w, g.p);
    const dps = gl.sustained;
    const gain = dps / baseDps - 1;
    const burstGain = gl.burst / baseL.burst - 1;
    const d = g.p.pl!.derived;
    let note = '';
    if (f === 'leech') note = `heals ${r1((d.lifesteal * dps * 10) / d.maxHp * 100)}% max HP per 10 s of attacking`;
    if (Math.abs(gain) > 0.001) dmgGains.push({ f, g: gain, burst: burstGain });
    rows.push([GEMS[f].name, 'weapon', GEMS[f].text.replace('{v}', r1(GEMS[f].value)), Math.abs(gain) > 0.001 || Math.abs(burstGain) > 0.001 ? `${pct(gain)} sustained, ${pct(burstGain)} burst DPS` : '—', note]);
  }
  for (const f of ARMOR_GEM_FAMILIES) {
    const gem = makeGem(f, { level, q: 0 });
    const g = buildPlayer(b, L, 5, 0);
    const body = g.p.pl!.char.equipment.body;
    if (body) {
      body.sockets = [gem];
    }
    // recompute with the gem in the body armour
    const w2 = new World('gemArmor', Room.empty());
    const p2 = spawnPlayer(w2, g.p.pl!.char, 0, true, 400, 368);
    const gain = ehp(p2) / baseEhp - 1;
    rows.push([GEMS[f].name, 'armour', GEMS[f].text.replace('{v}', r1(GEMS[f].value)), Math.abs(gain) > 0.001 ? pct(gain) + ' effective HP' : '—', '']);
  }
  out(`Gem level ${level} (zone 5 drop), +0% roll. Base: ${r0(baseDps)} DPS, ${r1(baseEhp)} average hits to die.`);
  out();
  out(table(['Gem', 'Kind', 'Baseline text', 'Effect on the build', 'Notes'], rows));
  out();
  const brutal = dmgGains.find((x) => x.f === 'brutal')?.g ?? 0;
  for (const x of dmgGains) {
    if (x.f === 'brutal' || brutal <= 0) continue;
    const ratio = x.g / brutal;
    if (ratio > 1.6 || ratio < 0.5) {
      const staminaBound = x.burst > x.g * 1.5;
      find(2 + Math.abs(Math.log2(ratio)) * 2, 'Gems', `${GEMS[x.f as keyof typeof GEMS].name} raises sustained DPS by ${pct(x.g)} (burst ${pct(x.burst)}) where Brutal gives ${pct(brutal)} (${r2(ratio)}× Brutal).${staminaBound ? ' Stamina, not swing time, limits sustained damage, so speed is worth little.' : ''}`, staminaBound ? 'Let it also ease stamina (e.g. Quicksilver adds stamina regen), or raise its value.' : "Bring its baseline value nearer Brutal's (D292 set the elemental adds to Brutal + 20%).");
    }
  }
}

function section4(): void {
  out('## 4. Weapons, weapon skills and spells');
  out();
  out('Every weapon at item level 5, rare, +0, held by a knight whose points (10 in each damage stat, plus 45 shared by the weapon\'s grades in proportion to their weight) suit that weapon. Best grip (one- or two-handed). Skills: listed damage multipliers × the weapon\'s power, per second of cooldown (single target; utility skills show 0).');
  out();
  const rows: string[][] = [];
  const sus: { id: string; v: number }[] = [];
  const skillRates: { id: string; v: number }[] = [];
  for (const wdef of Object.values(WEAPONS)) {
    const grades = wdef.grades;
    const weight: Partial<Record<StatId, number>> = {};
    weight.bonk = GRADE_MULT[grades.bonk];
    weight.slicey = GRADE_MULT[grades.slicey];
    if (grades.brain) weight.brain = GRADE_MULT[grades.brain];
    if (grades.prayer) weight.prayer = GRADE_MULT[grades.prayer];
    const tot = Object.values(weight).reduce((a, b) => a + (b ?? 0), 0) || 1;
    let best: { dps: Dps; grip: string; power: number } | null = null;
    for (const two of wdef.twoHandOnly ? [true] : [false, true]) {
      const c = newCharacter('knight', 'Bal', 'bal', new Rng('w'));
      for (const s of ['bonk', 'slicey', 'brain', 'prayer'] as const) c.stats[s] = Math.min(99, 10 + Math.round((45 * (weight[s] ?? 0)) / tot));
      c.equipment.main = item(wdef.id, 'rare', 5);
      c.equipment.off = null;
      c.twoHanded = two;
      const w = new World(`wpn:${wdef.id}`, Room.empty());
      const p = spawnPlayer(w, c, 0, true, 400, 368);
      const dps = lightDps(w, p);
      if (!best || dps.sustained > best.dps.sustained) best = { dps, grip: two ? '2H' : '1H', power: p.pl!.derived.weaponPower };
    }
    const skills = (wdef.skills ?? []).map((id) => SKILLS[id]).filter((s) => !!s);
    const skillDps = skills.map((s) => (effDmg(s!.effect, 'mult') * best!.power) / Math.max(1, s!.cooldownS));
    const skillSum = skillDps.reduce((a, b) => a + b, 0);
    sus.push({ id: wdef.id, v: best!.dps.sustained });
    skillRates.push({ id: wdef.id, v: skillSum });
    rows.push([wdef.name, `${grades.bonk}/${grades.slicey}${grades.brain ? `/Br ${grades.brain}` : ''}${grades.prayer ? `/Pr ${grades.prayer}` : ''}`, best!.grip, r0(best!.dps.burst), r0(best!.dps.sustained), r0(best!.dps.perSwing), r1(best!.dps.staminaPerHit), skills.map((s, i) => `${s!.name} ${r0(skillDps[i]!)}`).join(', '), '']);
  }
  const med = median(sus.map((x) => x.v));
  const medSk = median(skillRates.map((x) => x.v).filter((x) => x > 0));
  rows.forEach((r, i) => {
    const v = sus[i]!.v;
    const flags: string[] = [];
    if (v > med * 1.35) flags.push(`${WARN} ${r2(v / med)}× median DPS`);
    if (v < med * 0.7) flags.push(`${WARN} ${r2(v / med)}× median DPS`);
    const sk = skillRates[i]!.v;
    if (sk > medSk * 2) flags.push(`${WARN} skills ${r2(sk / medSk)}× median`);
    r[8] = flags.join('; ');
    if (v > med * 1.35 || v < med * 0.7) find(2 + Math.abs(Math.log2(v / med)) * 3, 'Weapons', `${r[0]}: ${r0(v)} sustained light-attack DPS, ${r2(v / med)}× the median weapon (${r0(med)}) at equal fitting stats.`, v > med ? 'Lower its base damage or combo multipliers, or raise its stamina cost.' : 'Raise its base damage / combo multipliers (D40: poor scaling should mean higher base, not lower DPS).');
    if (sk > medSk * 2) find(2 + Math.log2(sk / medSk) * 2, 'Weapon skills', `${r[0]}'s skills deal ${r0(sk)} damage per second of cooldown, ${r2(sk / medSk)}× the median weapon's (${r0(medSk)}).`, 'Lower the skill multipliers or lengthen the cooldowns.');
  });
  out(table(['Weapon', 'Grades', 'Grip', 'Burst DPS', 'Sustained DPS', 'Per swing', 'Stamina/swing', 'Skills (dmg per s of cooldown)', 'Flags'], rows));
  out();
  out('Spells at Spell Skill 100 (single target; fans count one projectile, ticking areas their whole duration):');
  out();
  const sp = spellRows();
  const srows: string[][] = [];
  for (const school of ['brain', 'prayer']) {
    const xs = sp.filter((s) => s.school === school);
    const m = median(xs.map((s) => s.dps));
    const ms = median(xs.map((s) => s.perStam).filter(Number.isFinite));
    for (const s of xs) {
      const flags: string[] = [];
      if (s.dps > m * 2) flags.push(`${WARN} ${r2(s.dps / m)}× school median DPS`);
      if (s.dps < m * 0.4) flags.push(`${WARN} ${r2(s.dps / m)}× school median DPS`);
      if (s.perStam > ms * 2.5) flags.push(`${WARN} ${r2(s.perStam / ms)}× damage per stamina`);
      if (s.dps > m * 2 || s.dps < m * 0.4) find(2 + Math.abs(Math.log2(s.dps / m)) * 1.5, 'Spells', `${s.name} (${school}): ${r1(s.dps)} damage per busy second at Spell Skill 100, ${r2(s.dps / m)}× the ${school} median (${r1(m)}).`, s.dps > m ? 'Lengthen its cooldown or lower its base.' : 'Raise its base or shorten its cooldown (unless its utility is the point).');
      srows.push([s.name, school, r0(s.dmg), r2(s.castS), r1(s.cd), String(s.stamina), r1(s.dps), r1(s.perStam), flags.join('; ')]);
    }
  }
  out(table(['Spell', 'School', 'Damage', 'Cast s', 'Cooldown s', 'Stamina', 'Dmg / busy s', 'Dmg / stamina', 'Flags'], srows));
  out();
}

function section5(): void {
  out('## 5. Economy');
  out();
  out('Shards from clearing every room of a zone once (solo, averaged over seeds; tuning.ts), against what its levels cost (GAME_DESIGN §2.3 target: 80–120%).');
  out();
  const rows: string[][] = [];
  for (const z of ZONES) {
    const y = zoneShardYield(z, SHARD_SEEDS);
    const need = zoneShardNeed(z);
    const ratio = y / need;
    const flag = ratio < 0.8 || ratio > 1.2 ? `${WARN} outside 80–120%` : '';
    if (flag) find(2 + Math.abs(ratio - 1) * 5, 'Economy', `Zone ${z}: one clear yields ${r0(y)} Shards against ${r0(need)} needed (${Math.round(ratio * 100)}%).`, 'Retune ZONE_SHARD_FACTOR for that zone.');
    rows.push([String(z), `${EXPECTED_LEVEL[z - 1]} → ${EXPECTED_LEVEL[z]}`, r0(y), r0(need), `${Math.round(ratio * 100)}%`, flag]);
  }
  out(table(['Zone', 'Levels', 'Shards (rooms)', 'Shards needed', 'Yield', 'Flags'], rows));
  out();
  out('New Game+: levels one clear of each zone (rooms and boss) buys, from level 80:');
  out();
  out(table(['Cycle', ...ZONES.map((z) => `Z${z}`)], CYCLES.filter((c) => c > 0).map((c) => [cycleName(c), ...ZONES.map((z) => `${r0(SHARDS_AT[c]![z - 1]!)} → L${LEVEL_AT[c]![z - 1]}`)])));
  out();
  const stale = CYCLES.filter((c) => c > 0).map((c) => ({ c, zones: ZONES.filter((z) => itemLevelFor(z, c) < itemLevelFor(8, c - 1)) })).filter((x) => x.zones.length);
  for (const x of stale) find(4, 'NG+ loot', `${cycleName(x.c)}: drops in zones ${x.zones[0]}–${x.zones[x.zones.length - 1]} are item level ${itemLevelFor(x.zones[0]!, x.c)}–${itemLevelFor(x.zones[x.zones.length - 1]!, x.c)}, below the item level ${itemLevelFor(8, x.c - 1)} gear the last playthrough ended with, so almost nothing found there is an upgrade.`, "Make itemLevelFor in New Game+ start at the last cycle's top (e.g. 8c + z) or at least never below it.");
  const lv = CYCLES.filter((c) => c > 0).map((c) => LEVEL_AT[c]![7]! - (c === 1 ? EXPECTED_LEVEL[8]! : LEVEL_AT[c - 1]![7]!));
  CYCLES.filter((c) => c > 1).forEach((c, i) => {
    const gained = lv[i + 1]!;
    if (gained < 25) find(4, 'NG+ levels', `${cycleName(c)}: a full clear buys only about ${gained} levels (level costs grow ×1.045 a level), while enemies grow ×${r1(ngGrowth(c) / ngGrowth(c - 1))} in HP and damage; the player's own growth that cycle is nearly all reinforcement.`, 'Flatten the level cost curve past level 80, raise NG+ Shard income, or soften NG_STEPS.');
  });
  out('Reinforcement: each +1 is +20% (×4 at +15), against rarity steps of ×1.06–×1.28. Glowen per step:');
  out();
  out(table(['+', ...Array.from({ length: MAX_REINFORCE }, (_, i) => `+${i + 1}`)], [['Glowen', ...Array.from({ length: MAX_REINFORCE }, (_, i) => r0(reinforceGlowen(i)))], ['Power', ...Array.from({ length: MAX_REINFORCE }, (_, i) => `×${r2(reinforceMult(i + 1))}`)]]));
  out();
  const rarSpread = RARITY_POWER.legendary / RARITY_POWER.common;
  if (reinforceMult(MAX_REINFORCE) / rarSpread > 2.5) find(3, 'Gear power', `Reinforcement reaches ×${r2(reinforceMult(MAX_REINFORCE))} at +${MAX_REINFORCE}, while the whole rarity ladder is ×${r2(rarSpread)}: a +15 common out-hits a +0 legendary ${r1(reinforceMult(MAX_REINFORCE) / rarSpread)}×, so drops matter little once reinforcement starts.`, 'Either flatten reinforcement (e.g. +10% a step) or widen rarity power, so finding better gear stays exciting in NG+.');
}

function section6(): void {
  out('## 6. Growth: player against the world');
  out();
  out('How the quality build\'s damage and toughness grow against the zone\'s enemies (zone 1 of the first playthrough = 1.00). A healthy curve keeps both ratios near 1.');
  out();
  const rows: string[][] = [];
  const b = BUILDS[2]!;
  let base: { dps: number; hp: number; foeHp: number; foeHit: number } | null = null;
  for (const c of CYCLES) {
    for (const z of ZONES) {
      const { w, p } = buildPlayer(b, LEVEL_AT[c]![z - 1]!, z, c);
      const dps = lightDps(w, p).sustained;
      const f = zoneFoes(z, c);
      const foeHp = mean(f.hp);
      const taken = mean(f.hits.map((h) => damageAfterDefense(h.dmg, p.pl!.derived.defense[h.type])));
      const cur = { dps, hp: p.pl!.derived.maxHp, foeHp, foeHit: taken };
      if (!base) base = cur;
      const kill = foeHp / dps / (base.foeHp / base.dps);
      const surv = cur.hp / taken / (base.hp / base.foeHit);
      const flags: string[] = [];
      if (kill > 2) flags.push(`${WARN} kills ${r1(kill)}× slower`);
      if (surv < 0.5) flags.push(`${WARN} survives ${r1(1 / surv)}× fewer hits`);
      if (kill > 2.5) find(3 + kill / 2, 'Growth', `${cycleName(c)} zone ${z}: the quality build needs ${r1(kill)}× as long to kill a room enemy as in zone 1 (${r1(foeHp / dps)} s against ${r1(base.foeHp / base.dps)} s).`, 'Enemy HP is outgrowing player damage here; trim the HP multiplier or give more damage growth.');
      if (surv < 0.4) find(3 + 1 / surv / 2, 'Growth', `${cycleName(c)} zone ${z}: the quality build survives ${r1(cur.hp / taken)} average room hits, ${r1(1 / surv)}× fewer than in zone 1 (${r1(base.hp / base.foeHit)}).`, 'Enemy damage is outgrowing player HP and defense here; trim the damage multipliers.');
      rows.push([cycleName(c), String(z), `L${LEVEL_AT[c]![z - 1]}`, r0(dps), r0(foeHp), r1(foeHp / dps), r0(cur.hp), r0(taken), r1(cur.hp / taken), r2(kill), r2(surv), flags.join('; ')]);
    }
  }
  out(table(['Cycle', 'Zone', 'Level', 'DPS', 'Foe HP', 'TTK s', 'Max HP', 'Hit taken', 'Hits to die', 'Kill time ×', 'Survival ×', 'Flags'], rows));
  out();
}

describe('balance report', () => {
  it('measures the game and writes docs/balance/report.md', () => {
    const t0 = Date.now();
    computeLevels();
    const foes: Record<string, ZoneFoes> = {};
    const bosses: Record<string, BossRow[]> = {};
    for (const c of CYCLES)
      for (const z of ZONES) {
        foes[`${z}:${c}`] = zoneFoes(z, c);
        bosses[`${z}:${c}`] = zoneBosses(z, c);
      }
    out('# Balance report (generated)');
    out();
    out('Written by `npm run balance:report` (tests/sim/report.sim.ts) from the live data and formulas: do not edit by hand. The curated write-up of the bot campaigns is docs/BALANCE_REPORT.md. Solo throughout; resistances and weaknesses are not in the kill times; gear has no affixes, gems or set perks unless a section says so.');
    out();
    const bodyStart = md.length;
    section1(foes, bosses);
    section2(foes, bosses);
    section3();
    section4();
    section5();
    section6();
    const body = md.splice(bodyStart);
    out('## Findings, worst first');
    out();
    const ranked = [...findings].sort((a, b) => b.severity - a.severity);
    // the same kind of finding repeated across zones is listed once with its worst case first, the rest counted
    const seen = new Map<string, number>();
    let n = 0;
    for (const f of ranked) {
      const key = `${f.area}|${f.fix}`;
      const k = seen.get(key) ?? 0;
      seen.set(key, k + 1);
      if (k >= 3) continue;
      n++;
      out(`${n}. **${f.area}** (severity ${r1(f.severity)}): ${f.text} *Suggested:* ${f.fix}`);
    }
    const hidden = [...seen.values()].reduce((s, v) => s + Math.max(0, v - 3), 0);
    if (hidden) out(`\n(${hidden} more findings of the same kinds are in the tables below.)`);
    if (!findings.length) out('Nothing flagged.');
    out();
    md.push(...body);
    mkdirSync('docs/balance', { recursive: true });
    writeFileSync(OUT, md.join('\n') + '\n');
    console.log(`balance report: ${findings.length} findings, ${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}`);
    for (const f of ranked.slice(0, 12)) console.log(` - [${f.area}] ${f.text}`);
  });
});

