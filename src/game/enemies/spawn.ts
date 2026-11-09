// Enemy creation with scaling (GAME_DESIGN §2.3, §6.4; CONTENT_ENEMIES §1).
import { reinforceHpFactor } from '../../data/essence';
import { ROLE_STATS, SHARD_SCALE, ngBossDmgMult, ngBossHpMult, ngLevelComp, statCurveComp, ngZoneEnemyDmg, zoneDmgFactor, zoneShardFactor } from '../../data/roles';
import { ELITE_POISE_MULT, coopHpMult, coopPoiseMult, enemyDmgMult, enemyHpMult, enemyShardMult, poiseForSize } from '../combat/formulas';
import type { BossDef, EliteAffix, EnemyDef, Role } from '../types';
import { newStatus, type EnemyC, type Entity, type World } from '../world';
import { ngBossDef } from '../boss/ngPhases';

export interface SpawnOpts {
  elite?: EliteAffix | null;
  zone?: number;
  cycle?: number;
  players?: number;
  /** seconds of spawn tell (rising circle) before it can act or be hurt */
  tellS?: number;
  hpMult?: number;
  dmgMult?: number;
  summonerId?: number;
  illusion?: boolean;
  groupId?: number;
  pieceIndex?: number;
  zoneResist?: Partial<Record<string, number>>;
  zoneImmune?: string[];
  noDrop?: boolean;
  lifeS?: number;
  /** room-wave enemies (D79): Shards and drop chances are divided by this (the room's count multiplier) */
  share?: number;
  mimicChestId?: string;
  facing?: number;
}

export function roleOf(def: EnemyDef | BossDef): Role | 'boss' {
  return def.role;
}

/**
 * An enemy's full HP for one player at a zone and cycle, before co-op scaling and a boss's first-bar share (D289): what
 * spawnEnemy starts from (its hpScaleBase). A bonus boss takes a share of its room's zone boss's (D322).
 */
export function enemyFullHp(def: EnemyDef | BossDef, zone: number, cycle: number, o: { elite?: string | null; hpMult?: number } = {}): number {
  const isBoss = def.role === 'boss';
  const rs = isBoss ? ROLE_STATS.boss : def.traits?.mimic ? ROLE_STATS.mimic : ROLE_STATS[def.role as Role];
  const baseHp = isBoss ? ((def as BossDef).baseHp ?? rs.hp) : rs.hp;
  // co-op adds bodies to rooms instead of HP to each body (D79); bosses alone still grow with the party
  let hp = baseHp * (def.mult?.hp ?? 1) * enemyHpMult(zone, cycle, 1) * (o.hpMult ?? 1);
  if (o.elite) hp *= 3;
  // weapon reinforcement gives 15% a step, not 20%: enemies lose the matching share of HP for the zone (D303)
  hp *= reinforceHpFactor(zone, cycle);
  // New Game+ levels go much further now (D307): enemies grow by 70% of what those levels give a player
  hp *= ngLevelComp('hp', zone, cycle);
  // the longer stat curve (D311): enemies grow by 70% of what it gives a player, then by the late-cycle table
  hp *= statCurveComp('hp', zone, cycle);
  // a boss lighter on the first playthrough (D211)
  if (isBoss && cycle <= 0) hp *= (def as BossDef).firstCycleHpMult ?? 1;
  // New Game+ bosses sized to a target fight length (D301)
  if (isBoss && !def.special) hp *= ngBossHpMult((def as BossDef).zone, cycle);
  return hp;
}

export function spawnEnemy(w: World, def0: EnemyDef | BossDef, x: number, y: number, o: SpawnOpts = {}): Entity {
  const isBoss = def0.role === 'boss';
  const isMimic = !!def0.traits?.mimic;
  const rs = isBoss ? ROLE_STATS.boss : isMimic ? ROLE_STATS.mimic : ROLE_STATS[def0.role as Role];
  const zone = o.zone ?? w.zone;
  const cycle = o.cycle ?? w.cycle;
  // New Game+ (D295): zone 1–7 bosses fight with a third phase
  const def: EnemyDef | BossDef = isBoss ? ngBossDef(def0 as BossDef, cycle) : def0;
  const players = o.players ?? w.playerCount;
  const elite = o.elite ?? null;
  const baseHp = isBoss ? ((def as BossDef).baseHp ?? rs.hp) : rs.hp;
  let hp = enemyFullHp(def, zone, cycle, { elite, hpMult: o.hpMult ?? 1 });
  // co-op: more HP for each extra player, more for bosses and Elites (D159); special NPCs and illusions keep theirs
  const coop = def.special || o.illusion ? 1 : coopHpMult(players, isBoss || !!elite);
  hp *= coop;
  if (def.traits?.invincible) hp = def.mult?.hp ? baseHp * def.mult.hp : 120000;
  if (def.traits?.fixedHp) hp = def.traits.fixedHp;
  // New Game+ room enemies hit harder by zone (D275); bosses and special NPCs keep the plain curve
  const ngZone = isBoss || def.special ? 1 : ngZoneEnemyDmg(zone, cycle);
  const dmgMult = (rs.dmg / 18) * (def.mult?.dmg ?? 1) * enemyDmgMult(zone, cycle) * zoneDmgFactor(zone) * ngZone * ngLevelComp('dmg', zone, cycle) * statCurveComp('dmg', zone, cycle) * (isBoss && !def.special ? ngBossDmgMult(cycle) : 1) * (elite ? 1.5 : 1) * (o.dmgMult ?? 1);
  const speed = (def.speed ?? rs.speed) * (def.mult?.speed ?? 1) * (elite === 'frenzied' ? 1.4 : 1);
  const share = Math.max(1, o.share ?? 1);
  const rawShards = (rs.shards * SHARD_SCALE * zoneShardFactor(zone) * (def.mult?.shards ?? 1) * enemyShardMult(zone, cycle) * (elite ? 3 : 1)) / share;
  const shards = rawShards > 0 ? Math.max(1, Math.round(rawShards)) : 0;
  const radius = (def.radius || rs.radius) * (elite ? 1.3 : 1) * (def.traits?.scale ?? 1);
  // bosses keep a large poise pool that hits wear down; everyone else's poise comes from their size (D78)
  const basePoise = (isBoss ? rs.poise : poiseForSize(radius)) * (def.mult?.poise ?? 1) * (elite && !isBoss ? ELITE_POISE_MULT : 1);
  // a boss's poise grows with the party (D194)
  const poise = basePoise * (isBoss && !def.special && !o.illusion ? coopPoiseMult(players) : 1);
  const resist = { ...(o.zoneResist ?? {}), ...def.resist };
  const immune = [...(o.zoneImmune ?? []), ...(def.statusImmune ?? [])];
  const now = w.time;
  // a boss's first bar may be a share of its full HP (D289); hpScaleBase stays the full HP
  const bar = isBoss ? ((def as BossDef).phases[0]?.barMult ?? 1) : 1;
  const hpBase = hp / coop;
  hp *= bar;
  const en: EnemyC = {
    def: { ...def, resist } as EnemyDef,
    isBoss,
    elite,
    state: 'spawning',
    stateT: 0,
    spawnUntil: now + (o.tellS ?? 1.0),
    cooldowns: {},
    attack: null,
    lastAttackId: '',
    targetId: 0,
    retargetAt: 0,
    aggro: {},
    dmgMult,
    speed,
    baseSpeed: speed,
    shards,
    zone,
    groupId: o.groupId ?? 0,
    strafeDir: 1,
    thinkAt: now + (o.tellS ?? 1.0),
    phase: 0,
    phaseTransitionUntil: 0,
    extrasUsed: {},
    summonerId: o.summonerId ?? 0,
    summonCount: 0,
    eliteTimerAt: now + 10,
    eliteOrbAngle: 0,
    hitTimes: [],
    flippedUntil: 0,
    stunUntil: 0,
    reviveCount: 0,
    visibleUntil: 0,
    revealedUntil: 0,
    fadeUntil: 0,
    wanderX: x,
    wanderY: y,
    lastContact: {},
    dropRow: elite ? 'elite' : rs.dropRow,
    noDrop: !!o.noDrop || !!def.traits?.noDrops,
    mimicChestId: o.mimicChestId ?? null,
    tauntedBy: 0,
    tauntUntil: 0,
    slowUntil: 0,
    slowMult: 1,
    frozenUntil: 0,
    rootUntil: 0,
    holdingId: 0,
    devour: null,
    pieceIndex: o.pieceIndex ?? 0,
    isIllusion: !!o.illusion,
    lifeUntil: o.lifeS ? now + o.lifeS : 0,
    spawnedAt: now,
    regenBlockedUntil: 0,
    attachedTo: 0,
    hpScaleBase: hpBase,
    barMult: bar,
    poiseScaleBase: basePoise,
    share,
    splitDone: false,
    phaseAttacks: isBoss ? (def as BossDef).phases[0]!.attacks : (def as EnemyDef).attacks,
    gary: !!def.traits?.merchant,
    garyHits: 0,
    linkedTo: 0,
    projSpeedMult: 1,
    homeX: x,
    homeY: y,
    movedAt: -10,
    quietDeath: false,
    stolen: 0,
    stolenFrom: '',
  };
  if (o.illusion) {
    hp = 1;
    en.noDrop = true;
    en.shards = 0;
  }
  const e = w.spawn('enemy', x, y, {
    radius,
    team: 1,
    solid: true,
    flying: def.moveStyle === 'hover' || def.moveStyle === 'ceiling',
    drawId: def.draw,
    facing: o.facing ?? 0,
    hp: {
      hp,
      max: hp,
      poise,
      poiseMax: poise,
      poiseRegenAt: 0,
      invulnUntil: def.traits?.invulnerable ? 1e9 : 0,
      barrier: elite === 'shielded' ? hp * 0.25 : 0,
      barrierUntil: elite === 'shielded' ? Infinity : 0,
      staggerUntil: 0,
      riposteUntil: 0,
      lastHitAt: -10,
      lastHitBy: 0,
      dead: false,
    },
    st: newStatus(immune),
    buffs: [],
    en,
  });
  if (def.moveStyle === 'ceiling') en.state = 'spawning';
  // player-look enemies roll the weapon they carry (drawn from the variant)
  const pick = def.traits?.weaponPick;
  if (pick && pick.length && o.pieceIndex === undefined) en.pieceIndex = w.combat.int(0, pick.length - 1);
  w.hooks.onEnemySpawned?.(w, e);
  return e;
}

/** Recompute boss HP for a new player count, keeping its HP fraction (NETCODE §7); rooms scale by count (D79). */
export function rescaleForPlayers(w: World, players: number): void {
  w.playerCount = players;
  for (const e of w.enemies) {
    if (!e.hp || e.hp.dead || !e.en || e.en.isIllusion || e.en.def.special) continue;
    // a boss's poise follows the party too, keeping how worn down it is (D194)
    if (e.en.isBoss && e.hp.poiseMax > 0) {
      const pf = e.hp.poise / e.hp.poiseMax;
      e.hp.poiseMax = e.en.poiseScaleBase * coopPoiseMult(players);
      e.hp.poise = pf * e.hp.poiseMax;
    }
    if (e.en.def.traits?.invincible || e.en.def.traits?.fixedHp) continue;
    const frac = e.hp.hp / e.hp.max;
    // everyone grows (or shrinks) with the party now, keeping their HP fraction (D159)
    e.hp.max = e.en.hpScaleBase * coopHpMult(players, e.en.isBoss || !!e.en.elite) * (e.en.barMult ?? 1);
    e.hp.hp = Math.max(1, frac * e.hp.max);
  }
}

/** Base damage for an enemy attack: role hit damage (18 for fodder) × multipliers. */
export function attackDamage(e: Entity, dmgMult: number): number {
  return 18 * e.en!.dmgMult * dmgMult;
}

let groupCounter = 1;

/** Spawn one roster "unit": a swarm spawns all its pieces as a group; everything else spawns one. */
export function spawnUnit(w: World, def: EnemyDef | BossDef, x: number, y: number, o: SpawnOpts = {}): Entity[] {
  const swarm = 'swarm' in def ? def.swarm : undefined;
  if (!swarm) return [spawnEnemy(w, def, x, y, o)];
  const gid = groupCounter++;
  const out: Entity[] = [];
  for (let i = 0; i < swarm.pieces; i++) {
    const a = (i / swarm.pieces) * Math.PI * 2;
    const [px, py] = w.room.nearestFloor(x + Math.cos(a) * 26, y + Math.sin(a) * 26, def.radius);
    out.push(spawnEnemy(w, def, px, py, { ...o, groupId: gid, pieceIndex: i, elite: null }));
  }
  return out;
}
