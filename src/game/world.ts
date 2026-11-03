// ECS-lite world (DATA_MODEL §4, D43): entities are plain objects with optional components in a Map.
// No DOM, canvas or audio here; the client reads `events` to play sounds and effects.
import { Rng } from '../engine/rng';
import type { InputFrame } from '../engine/input/actions';
import type {
  AttackDef,
  BossDef,
  BuffStat,
  Character,
  ControlId,
  DamageType,
  EffectDef,
  EliteAffix,
  EnemyDef,
  HazardId,
  Item,
  StatusId,
  SwingDef,
  Team,
  Gem,
  ConsumableId,
} from './types';
import type { Derived } from './player/derived';
import type { Shape } from './combat/patterns';
import { Room } from './room';

export type EType = 'player' | 'enemy' | 'projectile' | 'telegraph' | 'hazard' | 'pickup' | 'interact' | 'decoy' | 'wall' | 'corpse';

export interface HealthC {
  hp: number;
  max: number;
  poise: number;
  poiseMax: number;
  poiseRegenAt: number;
  invulnUntil: number;
  barrier: number;
  barrierUntil: number;
  staggerUntil: number;
  /** riposte-staggered (parried): next player hit ×3 */
  riposteUntil: number;
  lastHitAt: number;
  lastHitBy: number;
  dead: boolean;
}

export interface StatusC {
  meters: Record<StatusId, number>;
  lastBuild: Record<StatusId, number>;
  /** active status effect end times */
  active: Record<StatusId, number>;
  controls: Record<ControlId, number>;
  shockArmed: boolean;
  burnTickAt: number;
  poisonTickAt: number;
  immune: Set<string>;
}

export interface Buff {
  id: string;
  stat: BuffStat;
  amount: number;
  until: number;
  stacks: number;
  maxStacks: number;
  sourceId: number;
  /** stacks grow on kills or hits (Bloodlust, Rampage) */
  stackOn?: 'kill' | 'hit';
  onStack?: EffectDef[];
}

export interface ComboState {
  idx: number;
  phase: 'windup' | 'active' | 'recovery';
  t: number;
  dur: number;
  swing: SwingDef;
  hit: Set<number>;
  queued: boolean;
  charging: boolean;
  chargeT: number;
  speed: number;
  fired: boolean;
}

export type PlayerState = 'idle' | 'attack' | 'dodge' | 'skill' | 'cast' | 'flask' | 'stagger' | 'held' | 'falling' | 'consumable' | 'channel' | 'charge' | 'dashing';

export interface ActionRun {
  kind: 'skill' | 'spell' | 'consumable';
  index: number;
  id: string;
  t: number;
  castS: number;
  fired: boolean;
  effects: EffectDef[];
  aimX: number;
  aimY: number;
  powerMult: number;
  hyperArmor: boolean;
}

export interface ChannelRun {
  until: number;
  tickS: number;
  nextTick: number;
  tick: EffectDef[];
  moveMult: number;
  followAim: boolean;
  source: 'skill' | 'spell';
  powerMult: number;
  hyperArmor: boolean;
}

export interface ChargeRun {
  t: number;
  maxS: number;
  minMult: number;
  maxMult: number;
  release: EffectDef;
  hyperArmor: boolean;
  source: 'skill' | 'spell';
}

export interface PlayerC {
  /** a block pressed with no parrying shield: its parry-timing window (only the tutorial cares, D96) */
  bareParryUntil: number;
  /** last "a bow needs both hands" hint (D88) */
  lastBowHintAt: number;
  slot: number;
  playerId: string;
  name: string;
  char: Character;
  derived: Derived;
  local: boolean;
  input: InputFrame;
  prevButtons: number;
  state: PlayerState;
  stateUntil: number;
  combo: ComboState | null;
  comboResetAt: number;
  nextComboIdx: number;
  blocking: boolean;
  blockToggled: boolean;
  parryUntil: number;
  parryReadyAt: number;
  guardBrokenUntil: number;
  dodgeReadyAt: number;
  dodgeRechargeTotal: number;
  dodgeUntil: number;
  dodgeDir: [number, number];
  iframesFrom: number;
  iframesUntil: number;
  iframeKind: 'all' | 'redOnly';
  stamDelayUntil: number;
  riposteBuffUntil: number;
  riposteTarget: number;
  skillReadyAt: [number, number, number];
  spellReadyAt: [number, number, number];
  action: ActionRun | null;
  channel: ChannelRun | null;
  charge: ChargeRun | null;
  flaskT: number;
  healOver: { perS: number; until: number; interruptible: boolean }[];
  downed: boolean;
  ghostUntil: number;
  reviveProgress: number;
  reviveNeed: number;
  downs: number;
  deadUntilRest: boolean;
  lastLightAttackAt: number;
  momentum: number;
  hitCounter: number;
  stillSince: number;
  holdBy: number;
  holdUntil: number;
  holdDmg: number;
  holdType: DamageType;
  holdStatus: { id: StatusId; buildup: number } | null;
  aimX: number;
  aimY: number;
  aimNeutral: boolean;
  falling: { until: number; toX: number; toY: number } | null;
  nextSpellFree: { count: number; until: number; powerPct: number; noCooldown: boolean; noStamina: boolean } | null;
  flaskBoost: { until: number; pct: number; cleanse: boolean } | null;
  stanceUntil: number;
  stanceRiposteMult: number;
  link: { otherId: number; until: number; split: number } | null;
  attached: number[];
  timeSlow: number;
  pastPos: { t: number; x: number; y: number }[];
  shardsGained: number;
  inBossRoom: boolean;
  lastFootstep: number;
  pendingLoot: Item[];
  pendingGems: Gem[];
  pendingConsumables: { id: ConsumableId; n: number }[];
  /** true on guests' mirror entity: do not simulate locally */
  remote: boolean;
}

export interface AttackRun {
  def: AttackDef;
  t: number;
  phase: 'windup' | 'active' | 'recover';
  windup: number;
  active: number;
  recover: number;
  targetId: number;
  aimX: number;
  aimY: number;
  angle: number;
  teleIds: number[];
  fired: boolean;
  comboIdx: number;
  moveDone: boolean;
  hit: Set<number>;
  usedBudget: boolean;
  /** repeated charges (AttackMove.charges): charges finished so far, and the re-aim pause before the next */
  chargesDone?: number;
  pauseUntil?: number;
}

export interface EnemyC {
  def: EnemyDef | BossDef;
  isBoss: boolean;
  elite: EliteAffix | null;
  state: 'spawning' | 'idle' | 'alert' | 'approach' | 'kite' | 'windup' | 'attack' | 'recover' | 'stagger' | 'reposition' | 'held' | 'channel' | 'dormant' | 'ceiling' | 'submerged' | 'stealth' | 'invisible' | 'dead';
  stateT: number;
  spawnUntil: number;
  cooldowns: Record<string, number>;
  attack: AttackRun | null;
  lastAttackId: string;
  targetId: number;
  retargetAt: number;
  aggro: Record<number, number>;
  dmgMult: number;
  speed: number;
  baseSpeed: number;
  shards: number;
  zone: number;
  groupId: number;
  strafeDir: number;
  thinkAt: number;
  phase: number;
  phaseTransitionUntil: number;
  extrasUsed: Record<string, number>;
  summonerId: number;
  summonCount: number;
  eliteTimerAt: number;
  eliteOrbAngle: number;
  hitTimes: number[];
  flippedUntil: number;
  stunUntil: number;
  reviveCount: number;
  visibleUntil: number;
  revealedUntil: number;
  fadeUntil: number;
  wanderX: number;
  wanderY: number;
  lastContact: Record<number, number>;
  dropRow: string;
  noDrop: boolean;
  mimicChestId: string | null;
  tauntedBy: number;
  tauntUntil: number;
  slowUntil: number;
  slowMult: number;
  frozenUntil: number;
  rootUntil: number;
  holdingId: number;
  pieceIndex: number;
  isIllusion: boolean;
  lifeUntil: number;
  spawnedAt: number;
  regenBlockedUntil: number;
  attachedTo: number;
  hpScaleBase: number;
  /** room-wave enemies: Shards and drop chances divided by this (D79) */
  share: number;
  splitDone: boolean;
  phaseAttacks: AttackDef[];
  gary: boolean;
  garyHits: number;
  /** id of a linked body that shares this boss's health bar (two targets, one bar) */
  linkedTo: number;
  /** projectile speed multiplier from phase passive */
  projSpeedMult: number;
  /** where this enemy's next gaze attack strikes (AttackDef.gazeTurnDeg); drawn as an arrow */
  gaze?: number;
  homeX: number;
  homeY: number;
  movedAt: number;
  /** died by its own detonation: skip its on-death effects */
  quietDeath: boolean;
  stolen: number;
  stolenFrom: string;
}

export interface ProjC {
  ownerId: number;
  team: Team;
  dmg: Partial<Record<DamageType, number>>;
  status: { id: StatusId; buildup: number }[];
  control: { id: ControlId; durationS: number } | null;
  kind: 'normal' | 'red' | 'pierce' | 'player' | 'utility';
  speed: number;
  homing: number;
  targetId: number;
  until: number;
  pierce: number;
  hit: Set<number>;
  poiseDmg: number;
  onImpact: EffectDef | null;
  parryable: boolean;
  reflected: boolean;
  returns: boolean;
  returning: boolean;
  drawId: string;
  color: string;
  reviveValue: number;
  knockback: number;
  lob: { fromX: number; fromY: number; toX: number; toY: number; t: number; dur: number } | null;
  curve: number;
  isSpell: boolean;
  isSkill: boolean;
  sourceTag: string;
  /** bow and crossbow shots lose damage past 250 px from where they were loosed (D88) */
  falloffFrom?: { x: number; y: number };
}

export interface DamageSpec {
  dmg: Partial<Record<DamageType, number>>;
  status: { id: StatusId; buildup: number }[];
  control: { id: ControlId; durationS: number } | null;
  poiseDmg: number;
  knockback: number;
  kind: 'normal' | 'red' | 'pierce' | 'player' | 'utility';
  parryable: boolean;
  grab: { holdS: number; mult: number; staminaDrain?: number } | null;
  pull: { speed: number; durationS: number } | null;
  staminaDrain: number;
  isSpell: boolean;
  isSkill: boolean;
  reviveValue: number;
  critVs?: string;
  critMult?: number;
  ignoreFrontGuard?: boolean;
  guaranteedStagger?: boolean;
  bossPoiseMult?: number;
  root?: number;
  pullToSource?: boolean;
  undeadMult?: number;
  sourceTag?: string;
  /** effects applied to the victim on hit */
  onHitEffects?: EffectDef[];
  onKillEffects?: EffectDef[];
  onlyUndead?: boolean;
}

export interface TeleC {
  ownerId: number;
  team: Team;
  shapes: Shape[];
  kind: 'normal' | 'red' | 'pierce' | 'utility';
  start: number;
  impact: number;
  end: number;
  mode: 'instant' | 'once' | 'tick';
  tickS: number;
  nextTick: number;
  hit: Set<number>;
  spec: DamageSpec | null;
  pulses: number;
  pulseGap: number;
  pulsesDone: number;
  persist: { hazard: HazardId; durationS: number } | null;
  onImpact: EffectDef[];
  fired: boolean;
  /** beams/sweeps follow their owner */
  follow: boolean;
  trackTargetId: number;
  turnRate: number;
  pullSpeed: number;
  area: boolean;
  /** visible only to its owner team (player skills draw nothing) */
  hidden: boolean;
  sourceTag: string;
  slowable: number;
  /** the attack's damage type: its ELEMENTS glow accents the telegraph's sparks and cracks (render only) */
  dmgType?: DamageType;
}

export interface HazardC {
  hazard: HazardId;
  shapes: Shape[];
  until: number;
  team: Team;
  tickS: number;
  nextTick: Record<number, number>;
  ownerId: number;
  spec: DamageSpec | null;
  effects: EffectDef[];
  slowPct: number;
  blocksProjectiles: boolean;
  blocksEnemies: boolean;
  hp: number;
  enemiesOnly: boolean;
  alliesOnly: boolean;
  noStatusBuild: boolean;
  enemyDamagePct: number;
  burst: EffectDef | null;
  allyEffects: EffectDef[];
  powerMult: number;
  follow: number;
  pull: number;
  armedAt: number;
}

export interface PickupC {
  kind: 'item' | 'shards' | 'gem' | 'consumable' | 'shardpile' | 'glowen' | 'spell' | 'tear';
  forPlayer: string | null;
  item?: Item;
  gem?: Gem;
  amount: number;
  consumable?: ConsumableId;
  spellId?: string;
  until: number;
  rarity: string;
  autoCollectAt: number;
}

export interface InteractC {
  kind: 'chest' | 'mimic' | 'bonfire' | 'sign' | 'stairs' | 'gary' | 'reliquary' | 'door' | 'station' | 'shardpile' | 'ngplus';
  key: string;
  label: string;
  used: boolean;
  holdS: number;
  text?: string;
  chestKind?: 'small' | 'treasure' | 'boss';
  data?: Record<string, unknown>;
}

export interface AnimC {
  t: number;
  flashUntil: number;
  tint: 'red' | 'blue' | null;
  scale: number;
  alpha: number;
  squash: number;
  pose: string;
  poseT: number;
  swingFrom: number;
  swingTo: number;
}

export interface Entity {
  id: number;
  type: EType;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  facing: number;
  radius: number;
  team: Team;
  solid: boolean;
  flying: boolean;
  removed: boolean;
  born: number;
  hitstopUntil: number;
  forced: { vx: number; vy: number; until: number; kind: 'dash' | 'knock' | 'pull' | 'leap' | 'slide'; hitWall?: boolean; stunOnWall?: number; bounces?: number } | null;
  drawId: string;
  hp?: HealthC;
  stam?: { cur: number; max: number };
  st?: StatusC;
  buffs?: Buff[];
  pl?: PlayerC;
  en?: EnemyC;
  pr?: ProjC;
  tg?: TeleC;
  hz?: HazardC;
  pk?: PickupC;
  it?: InteractC;
  dc?: { until: number; tauntR: number; ownerId: number; illusion: boolean };
  wl?: { until: number; blocksProjectiles: boolean; blocksEnemies: boolean; x1: number; y1: number; x2: number; y2: number; w: number };
  anim: AnimC;
}

export type GameEvent =
  | { t: 'sfx'; id: string; x?: number; vol?: number; rate?: number }
  | { t: 'fx'; kind: string; x: number; y: number; a?: number; color?: string; n?: number; r?: number; x2?: number; y2?: number }
  | { t: 'dmg'; x: number; y: number; amount: number; type: DamageType; crit: boolean; toPlayer: boolean; heal?: boolean; targetId?: number; affinity?: 'weak' | 'resist' }
  | { t: 'shake'; amount: number }
  | { t: 'hitstop'; ms: number; ids: number[] }
  | { t: 'msg'; text: string; forPlayer?: string | undefined; color?: string }
  | { t: 'death'; id: number; x: number; y: number; isPlayer: boolean; defId?: string; playerId?: string }
  | { t: 'telegraph'; id: number }
  | { t: 'parry'; x: number; y: number; playerId: string }
  | { t: 'guardBreak'; playerId: string }
  | { t: 'downed'; playerId: string }
  | { t: 'revived'; playerId: string }
  | { t: 'levelBanner'; text: string; sub?: string }
  | { t: 'bossPhase'; phase: number; name?: string }
  | { t: 'shardGain'; playerId: string; amount: number; x: number; y: number }
  | { t: 'loot'; playerId: string; rarity: string; x: number; y: number }
  /** a player landed a riposte on targetId, or finished reviving the ghost targetId (achievements read these) */
  | { t: 'feat'; kind: 'riposte' | 'revive'; playerId: string; targetId: number };

export const ALL_STATUS: StatusId[] = ['burn', 'chill', 'shock', 'bleed', 'poison'];
export const ALL_CONTROL: ControlId[] = ['freeze', 'blind', 'hexed', 'silence', 'root', 'hold'];

export function newStatus(immune: Iterable<string> = []): StatusC {
  const z = (): Record<StatusId, number> => ({ burn: 0, chill: 0, shock: 0, bleed: 0, poison: 0 });
  return {
    meters: z(),
    lastBuild: z(),
    active: z(),
    controls: { freeze: 0, blind: 0, hexed: 0, silence: 0, root: 0, hold: 0 },
    shockArmed: false,
    burnTickAt: 0,
    poisonTickAt: 0,
    immune: new Set(immune),
  };
}

export function newAnim(): AnimC {
  return { t: 0, flashUntil: 0, tint: null, scale: 1, alpha: 1, squash: 0, pose: 'idle', poseT: 0, swingFrom: 0, swingTo: 0 };
}

export interface WorldHooks {
  onEnemyKilled?(w: World, e: Entity, killerId: number): void;
  onPlayerDowned?(w: World, e: Entity): void;
  onPlayerDied?(w: World, e: Entity): void;
  onInteract?(w: World, player: Entity, target: Entity): void;
  onPickup?(w: World, player: Entity, pickup: Entity): void;
  onDoor?(w: World, player: Entity, side: 'n' | 's' | 'e' | 'w'): void;
  onFall?(w: World, e: Entity): void;
  onEnemySpawned?(w: World, e: Entity): void;
  onBossPhase?(w: World, e: Entity, phase: number): void;
  onPlayerBlocked?(w: World, p: Entity, attacker: Entity | null): void;
  onPlayerParried?(w: World, p: Entity, attacker: Entity): void;
  /** a player hit an enemy from behind (D97) */
  onBackstab?(w: World, p: Entity, target: Entity): void;
  /** a block timed like a parry by someone with nothing to parry with (D96) */
  onTimedBlock?(w: World, p: Entity, attacker: Entity): void;
  onEnemyHitEffects?(w: World, attacker: Entity, victim: Entity, effects: EffectDef[]): void;
  onGaryHit?(w: World, gary: Entity, attacker: Entity | null): void;
  onEnemyHurt?(w: World, e: Entity, attacker: Entity | null): void;
  onPlayerHitEnemy?(w: World, p: Entity, e: Entity, amount: number, spec: DamageSpec): void;
  onRevive?(w: World, ghost: Entity): void;
  onDodge?(w: World, p: Entity): void;
  onChargeEnd?(w: World, e: Entity, hitWall: boolean): void;
  onEliteSummon?(w: World, e: Entity): void;
  onCeilingDrop?(w: World, e: Entity): void;
  onPlayerKill?(w: World, p: Entity, victim: Entity): void;
  onMimicWake?(w: World, e: Entity): void;
  onMimicBite?(w: World, p: Entity, mimic: Entity): void;
  onSpecKill?(w: World, attacker: Entity, victim: Entity, effects: EffectDef[], tag: string): void;
  /** room/wave logic, called once per tick after combat (rooms system) */
  onTick?(w: World, dt: number): void;
}

export class World {
  tick = 0;
  time = 0;
  entities = new Map<number, Entity>();
  private nextId = 1;
  private freeIds: number[] = [];
  events: GameEvent[] = [];
  combat: Rng;
  room: Room;
  zone = 1;
  cycle = 0;
  /** number of players for HP scaling */
  playerCount = 1;
  hooks: WorldHooks = {};
  god = false;
  /** hitstop freeze frames (Settings → Video) */
  hitstopEnabled = true;
  /** host simulates; guests only mirror */
  authoritative = true;
  /** special budget per room (GAME_DESIGN §6.2) */
  specialBudget = 2;
  /** frozen while a menu pauses a solo game */
  paused = false;
  /** room-wide modifiers (Flood, darkness, enrage) */
  roomMods: { floodUntil: number; floodSlow: number; dark: number; enrageUntil: number; lateFeeUntil: number; lightningBonusUntil: number } = {
    floodUntil: 0,
    floodSlow: 0.15,
    dark: 0,
    enrageUntil: 0,
    lateFeeUntil: 0,
    lightningBonusUntil: 0,
  };
  /** cached per tick */
  players: Entity[] = [];
  enemies: Entity[] = [];
  lootCounter: Record<string, number> = {};
  inputLock = 0;
  bossId = 0;
  /** named spots of the current room (boss arenas: graves the Caretaker summons from) */
  spots: Record<string, [number, number][]> = {};
  /** effects waiting for their delay (sequence steps, dash landings, channels) */
  scheduled: { at: number; run: () => void }[] = [];
  /** fallen non-elite enemies this room (Raise Dead) */
  fallen: { defId: string; x: number; y: number }[] = [];

  schedule(delayS: number, run: () => void): void {
    this.scheduled.push({ at: this.time + delayS, run });
  }

  constructor(seed: string, room?: Room) {
    this.combat = new Rng(`${seed}|combat`);
    this.room = room ?? Room.empty();
  }

  spawn(type: EType, x: number, y: number, init: Partial<Entity> = {}): Entity {
    const id = this.freeIds.pop() ?? this.nextId++;
    const e: Entity = {
      id,
      type,
      x,
      y,
      px: x,
      py: y,
      vx: 0,
      vy: 0,
      facing: 0,
      radius: 10,
      team: 2,
      solid: false,
      flying: false,
      removed: false,
      born: this.time,
      hitstopUntil: 0,
      forced: null,
      drawId: '',
      anim: newAnim(),
      ...init,
    };
    this.entities.set(id, e);
    if (type === 'player' || type === 'enemy') this.refreshLists();
    return e;
  }

  remove(e: Entity): void {
    if (e.removed) return;
    e.removed = true;
  }

  /** Remove entities flagged during the tick; recycle ids after a delay so references go stale safely. */
  sweep(): void {
    let changed = false;
    for (const [id, e] of this.entities) {
      if (e.removed) {
        this.entities.delete(id);
        if (id > 64) this.freeIds.unshift(id);
        if (e.type === 'player' || e.type === 'enemy') changed = true;
      }
    }
    if (changed) this.refreshLists();
    // keep the free list from recycling too soon (ids are referenced by telegraph owners etc.)
    if (this.freeIds.length > 2000) this.freeIds.length = 2000;
  }

  refreshLists(): void {
    this.players = [];
    this.enemies = [];
    for (const e of this.entities.values()) {
      if (e.removed) continue;
      if (e.type === 'player') this.players.push(e);
      else if (e.type === 'enemy') this.enemies.push(e);
    }
    this.players.sort((a, b) => a.pl!.slot - b.pl!.slot);
  }

  get(id: number): Entity | undefined {
    const e = this.entities.get(id);
    return e && !e.removed ? e : undefined;
  }

  emit(ev: GameEvent): void {
    this.events.push(ev);
  }

  sfx(id: string, x?: number, vol?: number, rate?: number): void {
    const ev: GameEvent = { t: 'sfx', id };
    if (x !== undefined) ev.x = x;
    if (vol !== undefined) ev.vol = vol;
    if (rate !== undefined) ev.rate = rate;
    this.events.push(ev);
  }

  fx(kind: string, x: number, y: number, extra: { a?: number; color?: string; n?: number; r?: number; x2?: number; y2?: number } = {}): void {
    this.events.push({ t: 'fx', kind, x, y, ...extra });
  }

  livingPlayers(): Entity[] {
    return this.players.filter((p) => !p.pl!.downed && !p.pl!.deadUntilRest && !p.removed);
  }

  livingEnemies(): Entity[] {
    return this.enemies.filter((e) => !e.hp?.dead && !e.removed && e.en!.state !== 'spawning');
  }

  nextLootIndex(playerId: string): number {
    const n = this.lootCounter[playerId] ?? 0;
    this.lootCounter[playerId] = n + 1;
    return n;
  }

  frozen(e: Entity): boolean {
    return e.hitstopUntil > this.time;
  }
}

export type { Derived };
